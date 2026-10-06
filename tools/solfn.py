"""Deterministic Solidity function extraction - research copy.

The SAME functions live in contracts/FixCheck.py (the contract must be a single
file); test/test_fixcheck.py asserts the two copies are identical, so the
offline research numbers in docs/RESEARCH.md are produced by the exact code the
validators run.
"""

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


def canon(code: str) -> str:
    """Whitespace-insensitive canonical form: every whitespace run is dropped,
    except one space between two word characters (so `uint x` != `uintx`).
    Comments must already be stripped. Unicode lookalikes are NOT folded: a
    different character is a different program."""
    out = []
    pending = False
    for c in code:
        if c in " \t\r\n\f\v":
            pending = True
            continue
        if pending and out and _word(out[-1]) and _word(c):
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


def extract(files: dict, file_name: str, fn: str) -> dict:
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
