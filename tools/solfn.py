"""Deterministic Solidity function extraction - research copy.

The SAME functions live in contracts/FixCheck.py (the contract must be a single
file); test/test_fixcheck.py asserts the two copies are identical, so the
offline research numbers in docs/RESEARCH.md are produced by the exact code the
validators run.
"""
import typing

# ---- BEGIN SHARED EXTRACTOR ----

def strip_comments(src: str) -> str:
    """Remove // and /* */ comments, keeping string literals intact. A comment
    becomes whitespace (a space, or the line breaks it spanned) so tokens on
    either side never fuse and line numbers are preserved."""
    out = []
    i = 0
    n = len(src)
    while i < n:
        c = src[i]
        if c == '"' or c == "'":
            j = i + 1
            while j < n and src[j] != c:
                if src[j] == "\\":
                    j += 1
                elif src[j] == "\n":
                    break
                j += 1
            out.append(src[i:j + 1])
            i = j + 1
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "/":
            j = src.find("\n", i)
            if j < 0:
                j = n
            out.append(" ")
            i = j
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "*":
            j = src.find("*/", i + 2)
            if j < 0:
                j = n
            else:
                j += 2
            # keep the comment's line breaks so line k of the stripped text
            # is line k of the original (quoted lines are reported by index)
            breaks = src.count("\n", i, j)
            out.append("\n" * breaks if breaks > 0 else " ")
            i = j
            continue
        out.append(c)
        i += 1
    return "".join(out)


def _word(c: str) -> bool:
    return c.isalnum() or c == "_" or c == "$"


# Two operator characters that would fuse into another token if the space
# between them were dropped (`a + ++b` is not `a++ + b`).
FUSE = ("++", "--", "**", "&&", "||", "<<", ">>", "<=", ">=", "==", "!=", "+=", "-=", "*=",
        "/=", "%=", "&=", "|=", "^=", "=>", "->", ":=", "=:", "//", "/*", "*/")


def canon(code: str) -> str:
    """Whitespace-insensitive canonical form: every whitespace run is dropped,
    except one space between two word characters (so `uint x` != `uintx`) and
    one space between two operator characters that would otherwise fuse into
    a different token (FUSE). Comments must already be stripped. Unicode
    lookalikes are NOT folded: a different character is a different program."""
    out = []
    pending = False
    for c in code:
        if c in " \t\r\n\f\v":
            pending = True
            continue
        if pending and out and ((_word(out[-1]) and _word(c)) or (out[-1] + c) in FUSE):
            out.append(" ")
        pending = False
        out.append(c)
    return "".join(out)


def _match(src: str, i: int, open_c: str, close_c: str) -> int:
    """Index just past the bracket matching src[i] (== open_c); -1 if
    unbalanced. String literals are skipped. Comments must be stripped."""
    depth = 0
    n = len(src)
    while i < n:
        c = src[i]
        if c == '"' or c == "'":
            j = i + 1
            while j < n and src[j] != c:
                if src[j] == "\\":
                    j += 1
                j += 1
            i = j + 1
            continue
        if c == open_c:
            depth += 1
        elif c == close_c:
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    return -1


def find_functions(src: str, name: str) -> list:
    """Every implemented `function <name>(...)` in comment-stripped src, as the
    raw text from `function` through the closing brace. Declarations without a
    body (interfaces, abstract) are skipped. Returns None if a definition with
    this name could not be parsed (unbalanced), which callers treat as
    UNPARSEABLE."""
    found = []
    key = "function"
    i = 0
    n = len(src)
    while True:
        k = src.find(key, i)
        if k < 0:
            return found
        i = k + len(key)
        if k > 0 and _word(src[k - 1]):
            continue
        j = i
        while j < n and src[j] in " \t\r\n":
            j += 1
        if j == i:
            continue
        e = j
        while e < n and _word(src[e]):
            e += 1
        if src[j:e] != name:
            continue
        p = e
        while p < n and src[p] in " \t\r\n":
            p += 1
        if p >= n or src[p] != "(":
            continue
        q = _match(src, p, "(", ")")
        if q < 0:
            return None
        # header runs to the first `{` or `;` at paren depth 0 (returns (...))
        h = q
        while h < n and src[h] != "{" and src[h] != ";":
            if src[h] == "(":
                h2 = _match(src, h, "(", ")")
                if h2 < 0:
                    return None
                h = h2
                continue
            h += 1
        if h >= n:
            return None
        if src[h] == ";":
            i = h
            continue
        b = _match(src, h, "{", "}")
        if b < 0:
            return None
        found.append(src[k:b])
        i = b


def basename(path: str) -> str:
    s = str(path)
    k = s.rfind("/")
    return s[k + 1:] if k >= 0 else s


def extract_plain(files: dict, file_name: str, fn: str) -> dict:
    """Pick the ONE implemented `fn` from the files whose basename equals
    file_name. {"ok": True, "code": raw, "canon": canonical} or
    {"ok": False, "why": "FILE_NOT_FOUND" | "FUNCTION_NOT_FOUND" |
    "FUNCTION_OVERLOADED" | "UNPARSEABLE"}."""
    want = basename(file_name)
    hits = []
    seen_file = False
    paths = sorted(files.keys())
    seen_canon = []
    for p in paths:
        if basename(p) != want:
            continue
        seen_file = True
        stripped = strip_comments(str(files[p]))
        got = find_functions(stripped, fn)
        if got is None:
            return {"ok": False, "why": "UNPARSEABLE"}
        for g in got:
            c = canon(g)
            # the same file vendored twice (lib/a/X.sol and lib/b/X.sol) with
            # an identical body is one function, not an overload
            if c in seen_canon:
                continue
            seen_canon.append(c)
            hits.append(g)
    if not seen_file:
        return {"ok": False, "why": "FILE_NOT_FOUND"}
    if len(hits) == 0:
        return {"ok": False, "why": "FUNCTION_NOT_FOUND"}
    if len(hits) > 1:
        return {"ok": False, "why": "FUNCTION_OVERLOADED"}
    return {"ok": True, "code": hits[0], "canon": canon(hits[0])}

def _declarations(src: str) -> list:
    """Every contract / abstract contract / library / interface declared in a
    comment-free source: [{"name", "kind", "parents", "lo", "hi"}] where
    lo..hi is the body span."""
    out = []
    i = 0
    n = len(src)
    while i < n:
        hit = ""
        for kw in ("contract", "library", "interface"):
            if src[i:i + len(kw)] == kw and (i == 0 or not _word(src[i - 1])) \
                    and i + len(kw) < n and src[i + len(kw)] in " \t\r\n":
                hit = kw
                break
        if hit == "":
            if src[i] == '"' or src[i] == "'":
                q = src[i]
                j = i + 1
                while j < n and src[j] != q:
                    if src[j] == "\\":
                        j += 1
                    j += 1
                i = j + 1
                continue
            i += 1
            continue
        j = i + len(hit)
        while j < n and src[j] in " \t\r\n":
            j += 1
        e = j
        while e < n and _word(src[e]):
            e += 1
        name = src[j:e]
        b = src.find("{", e)
        if name == "" or b < 0:
            i = e
            continue
        head = src[e:b].strip()
        clean = []
        if head.startswith("is") and (len(head) == 2 or not _word(head[2])):
            depth = 0
            cur = []
            parts = []
            for ch in head[2:]:
                if ch == "(":
                    depth += 1
                    continue
                if ch == ")":
                    depth -= 1
                    continue
                if depth > 0:
                    continue
                if ch == ",":
                    parts.append("".join(cur))
                    cur = []
                    continue
                cur.append(ch)
            parts.append("".join(cur))
            for p in parts:
                t = p.strip()
                w = 0
                while w < len(t) and (_word(t[w]) or t[w] == "."):
                    w += 1
                t = t[:w]
                if t != "":
                    clean.append(t)
        hi = _match(src, b, "{", "}")
        if hi < 0:
            i = b + 1
            continue
        kind = hit
        pre = src[max(0, i - 9):i]
        if pre.strip().endswith("abstract"):
            kind = "contract"
        out.append({"name": name, "kind": kind, "parents": clean, "lo": b, "hi": hi})
        i = b + 1
    return out


def _imports(src: str) -> list:
    """The import directives of a comment-free source, as
    [{"path", "alias", "symbols"}]: `import "p";` -> symbols None, alias "";
    `import "p" as Z;` / `import * as Z from "p";` -> alias Z;
    `import {A, B as C} from "p";` -> symbols [[A, A], [B, C]]."""
    out = []
    i = 0
    n = len(src)
    while True:
        k = src.find("import", i)
        if k < 0:
            return out
        i = k + 6
        if (k > 0 and _word(src[k - 1])) or (i < n and _word(src[i])):
            continue
        e = src.find(";", i)
        if e < 0:
            return out
        stmt = src[i:e]
        q1 = -1
        for j in range(len(stmt)):
            if stmt[j] == '"' or stmt[j] == "'":
                q1 = j
                break
        q2 = stmt.find(stmt[q1], q1 + 1) if q1 >= 0 else -1
        if q2 < 0:
            i = e
            continue
        head = stmt[:q1].strip()
        tail = stmt[q2 + 1:].split()
        alias = ""
        symbols = None
        b = head.find("{")
        if b >= 0:
            c = head.find("}", b)
            symbols = []
            for part in head[b + 1:(c if c > b else len(head))].split(","):
                w = part.split()
                if len(w) == 1:
                    symbols.append([w[0], w[0]])
                elif len(w) == 3 and w[1] == "as":
                    symbols.append([w[0], w[2]])
        elif head.startswith("*"):
            w = head.split()
            if len(w) >= 3 and w[1] == "as":
                alias = w[2]
        elif len(tail) >= 2 and tail[0] == "as":
            alias = tail[1]
        out.append({"path": stmt[q1 + 1:q2], "alias": alias, "symbols": symbols, "file": ""})
        i = e


def _norm_path(path: str) -> str:
    parts = []
    for seg in path.split("/"):
        if seg == "" or seg == ".":
            continue
        if seg == "..":
            if parts:
                parts.pop()
            continue
        parts.append(seg)
    return "/".join(parts)


def _resolve_path(frm: str, imp: str, keys: list) -> str:
    """The bundle file an import path names: relative paths exactly, others
    exactly or by the shortest unique path suffix (remappings rename the
    prefix). "" if no file, or more than one, fits."""
    if imp.startswith("./") or imp.startswith("../"):
        k = frm.rfind("/")
        cand = _norm_path((frm[:k + 1] if k >= 0 else "") + imp)
        return cand if cand in keys else ""
    if imp in keys:
        return imp
    segs = imp.split("/")
    for drop in range(0, len(segs) - 1):
        suf = "/".join(segs[drop:])
        hits = [x for x in keys if x == suf or x.endswith("/" + suf)]
        if len(hits) == 1:
            return hits[0]
        if len(hits) > 1:
            return ""
    return ""


def _units(files: dict) -> dict:
    """file -> {"src", "decls", "imports"} for every file of a bundle, imports
    resolved to bundle files."""
    keys = sorted(files.keys())
    units = {}
    for p in keys:
        src = strip_comments(str(files[p]))
        units[p] = {"src": src, "decls": _declarations(src), "imports": _imports(src)}
    for p in keys:
        for im in units[p]["imports"]:
            im["file"] = _resolve_path(p, im["path"], keys)
    return units


def _by_name(units: dict) -> dict:
    out = {}
    for p in sorted(units.keys()):
        for d in units[p]["decls"]:
            if d["name"] not in out:
                out[d["name"]] = []
            out[d["name"]].append(p + ":" + d["name"])
    return out


def _export(units: dict, byname: dict, q: str, x: str, seen: list) -> str:
    """The declaration ("file:Name") that name x denotes when imported from
    file q. An unresolved file falls back to the ONE declaration named x in
    the bundle; "" if none or several."""
    if q == "":
        hits = byname.get(x, [])
        return hits[0] if len(hits) == 1 else ""
    key = q + ":" + x
    if key in seen:
        return ""
    seen.append(key)
    for d in units[q]["decls"]:
        if d["name"] == x:
            return key
    for im in units[q]["imports"]:
        if im["alias"] != "":
            continue
        if im["symbols"] is None:
            r = _export(units, byname, im["file"], x, seen)
            if r != "":
                return r
            continue
        for sym in im["symbols"]:
            if sym[1] == x:
                return _export(units, byname, im["file"], sym[0], seen)
    return ""


def _resolve(units: dict, byname: dict, p: str, ident: str) -> str:
    """fix 5: the declaration a name used in file p denotes, through import
    aliases ({X as Y}, `as Z` namespaces); "" if it cannot be resolved."""
    k = ident.find(".")
    if k >= 0:
        for im in units[p]["imports"]:
            if im["alias"] == ident[:k]:
                return _export(units, byname, im["file"], ident[k + 1:], [])
        return ""
    for d in units[p]["decls"]:
        if d["name"] == ident:
            return p + ":" + ident
    for im in units[p]["imports"]:
        if im["symbols"] is not None:
            for sym in im["symbols"]:
                if sym[1] == ident:
                    return _export(units, byname, im["file"], sym[0], [])
    for im in units[p]["imports"]:
        if im["symbols"] is None and im["alias"] == "" and im["file"] != "":
            r = _export(units, byname, im["file"], ident, [])
            if r != "":
                return r
    hits = byname.get(ident, [])
    return hits[0] if len(hits) == 1 else ""


def _graph(units: dict) -> dict:
    """"file:Name" -> its parents, each resolved ("" = unresolved)."""
    byname = _by_name(units)
    g = {}
    for p in sorted(units.keys()):
        for d in units[p]["decls"]:
            g[p + ":" + d["name"]] = [_resolve(units, byname, p, x) for x in d["parents"]]
    return g


def _ancestry(graph: dict, node: str) -> list:
    """[node and every ancestor, any parent unresolved]."""
    out = []
    bad = False
    todo = [node]
    while todo:
        x = todo.pop()
        if x == "":
            bad = True
            continue
        if x in out:
            continue
        out.append(x)
        for y in graph.get(x, []):
            todo.append(y)
    return [out, bad]


def _impls(units: dict, name: str) -> list:
    """Every implemented `function name` in the bundle as [holder ("file:Name",
    "" for a free function), canonical body, holder kind, file]."""
    out = []
    for p in sorted(units.keys()):
        u = units[p]
        if u["src"].find(name) < 0:
            continue
        found = find_functions(u["src"], name)
        if found is None:
            out.append(["", "", "", p])
            continue
        cur = 0
        for body in found:
            at = u["src"].find(body, cur)
            cur = at + len(body)
            holder = None
            for d in u["decls"]:
                if d["lo"] <= at < d["hi"] and (holder is None or d["lo"] > holder["lo"]):
                    holder = d
            if holder is None:
                out.append(["", canon(body), "", p])
            else:
                out.append([p + ":" + holder["name"], canon(body), holder["kind"], p])
    return out


def calls_in(code: str) -> list:
    """Names called directly (`name(`, not `x.name(`) in comment-free code."""
    out = []
    n = len(code)
    i = 0
    while i < n:
        if _word(code[i]) and not code[i].isdigit() and (i == 0 or not _word(code[i - 1])):
            j = i
            while j < n and _word(code[j]):
                j += 1
            k = j
            while k < n and code[k] in " \t\r\n":
                k += 1
            b = i - 1
            while b >= 0 and code[b] in " \t\r\n":
                b -= 1
            if k < n and code[k] == "(" and (b < 0 or code[b] != ".") and code[i:j] not in out:
                out.append(code[i:j])
            i = j
            continue
        i += 1
    return out


def extract(files: dict, file_name: str, fn: str, target: str = "", calls: typing.Any = None) -> dict:
    """extract_plain() plus the implementation the contract actually runs.

    With `target` ("file:Name", the contract the explorer says was compiled):
    our function's holder must be that contract or one of its resolved
    ancestors (fix 4, else FUNCTION_NOT_IN_COMPILED_CONTRACT); every ancestor
    must resolve, through import aliases (fix 5, else PARENT_UNRESOLVED); no
    other contract in the compiled chain may implement `fn` unless ours
    overrides it (FUNCTION_OVERRIDDEN); and every function our function - or
    the fix (`calls`) - calls directly must run the implementation ours sees,
    not one overridden below it (fix 6, HELPER_OVERRIDDEN).

    Without a target (a single audited or fix file, or offline research):
    another file implementing `fn` in a contract that derives from ours, in a
    library, in a same-name contract, or in a contract whose parents cannot
    all be resolved is FUNCTION_OVERRIDDEN; a helper implemented in a
    contract deriving from ours (or, in another file, with unresolved parents)
    is HELPER_OVERRIDDEN."""
    got = extract_plain(files, file_name, fn)
    if not got["ok"]:
        return got
    want = basename(file_name)
    units = _units(files)
    graph = _graph(units)
    impl = _impls(units, fn)
    ours = ""
    for h in impl:
        if basename(h[3]) == want and h[1] == got["canon"] and h[0] != "":
            ours = h[0]
            break
    names = []
    for nm in calls_in(got["code"]) + (calls if isinstance(calls, list) else []):
        if nm != fn and nm not in names:
            names.append(nm)
    mine = _ancestry(graph, ours)[0] if ours != "" else []
    if target != "":
        if target not in graph or ours == "":
            return {"ok": False, "why": "FUNCTION_NOT_IN_COMPILED_CONTRACT"}
        anc = _ancestry(graph, target)
        if anc[1]:
            return {"ok": False, "why": "PARENT_UNRESOLVED"}
        scope = anc[0]
        if ours not in scope:
            return {"ok": False, "why": "FUNCTION_NOT_IN_COMPILED_CONTRACT"}
        for h in impl:
            if h[0] in scope and h[0] != ours and h[0] not in mine:
                return {"ok": False, "why": "FUNCTION_OVERRIDDEN"}
        for nm in names:
            hs = []
            for h in _impls(units, nm):
                if h[0] in scope and h[0] not in hs:
                    hs.append(h[0])
            top = ""
            for h in hs:
                above = _ancestry(graph, h)[0]
                if len([o for o in hs if o not in above]) == 0:
                    top = h
            if len(hs) > 0 and (top == "" or top not in mine):
                return {"ok": False, "why": "HELPER_OVERRIDDEN"}
        return got
    for h in impl:
        if h[0] == ours or basename(h[3]) == want:
            continue    # ours, or the same file: extract_plain judged overloads
        if h[0] == "" or h[2] == "library" or (ours != "" and h[0][h[0].rfind(":"):] == ours[ours.rfind(":"):]):
            return {"ok": False, "why": "FUNCTION_OVERRIDDEN"}
        above = _ancestry(graph, h[0])
        if above[1] or (ours != "" and ours in above[0]):
            return {"ok": False, "why": "FUNCTION_OVERRIDDEN"}
    if ours != "":
        for nm in names:
            for h in _impls(units, nm):
                if h[0] == "" or h[0] == ours:
                    continue
                above = _ancestry(graph, h[0])
                if ours in above[0] or (above[1] and basename(h[3]) != want):
                    return {"ok": False, "why": "HELPER_OVERRIDDEN"}
    return got


STATUS_PHRASES = [
    "The protocol team fixed this issue",
    "Mitigation confirmed",
    "Status: Fixed",
    "Status: Mitigated",
    "Status: Resolved",
]


def _id_at(line: str, fid: str) -> bool:
    """fid occurs in line as a whole token (H-1 must not match H-10)."""
    i = 0
    while True:
        k = line.find(fid, i)
        if k < 0:
            return False
        before = line[k - 1] if k > 0 else " "
        after = line[k + len(fid)] if k + len(fid) < len(line) else " "
        if not _word(before) and before != "-" and not _word(after) and after != "-":
            return True
        i = k + 1


def finding_section(report: str, fid: str) -> dict:
    """The report section for finding `fid`: from the first markdown heading
    line naming fid as a whole token, to the next heading of the same or a
    higher level. {"ok": True, "title": heading text, "text": section,
    "status": index into STATUS_PHRASES} or {"ok": False, "why": ...}."""
    lines = str(report).split("\n")
    start = -1
    level = 0
    for i, ln in enumerate(lines):
        if not ln.startswith("#"):
            continue
        lv = 0
        while lv < len(ln) and ln[lv] == "#":
            lv += 1
        if _id_at(ln[lv:], fid):
            start = i
            level = lv
            break
    if start < 0:
        return {"ok": False, "why": "FINDING_NOT_IN_REPORT"}
    end = len(lines)
    for j in range(start + 1, len(lines)):
        ln = lines[j]
        if ln.startswith("#"):
            lv = 0
            while lv < len(ln) and ln[lv] == "#":
                lv += 1
            if lv <= level and lv < len(ln) and ln[lv] == " ":
                end = j
                break
    text = "\n".join(lines[start:end])
    status = -1
    for k, phrase in enumerate(STATUS_PHRASES):
        if text.find(phrase) >= 0:
            status = k
            break
    if status < 0:
        return {"ok": False, "why": "FIXED_STATUS_NOT_IN_FINDING"}
    title = lines[start][level:].strip()
    return {"ok": True, "title": title, "text": text, "status": status}

# ---- END SHARED EXTRACTOR ----
