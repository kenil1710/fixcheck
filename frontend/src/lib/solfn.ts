/**
 * TypeScript port of the contract's deterministic extractor (contracts/FixCheck.py,
 * "SHARED EXTRACTOR" block). Used ONLY for the live preview before you pay and
 * for rendering; the verdict is always the contract's.
 */

const isWord = (c: string) => /[\p{L}\p{N}_$]/u.test(c);

export function stripComments(src: string): string {
  const out: string[] = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== c) {
        if (src[j] === "\\") j += 1;
        else if (src[j] === "\n") break;
        j += 1;
      }
      out.push(src.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if (c === "/" && src[i + 1] === "/") {
      let j = src.indexOf("\n", i);
      if (j < 0) j = n;
      out.push(" ");
      i = j;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      let j = src.indexOf("*/", i + 2);
      j = j < 0 ? n : j + 2;
      const breaks = src.slice(i, j).split("\n").length - 1;
      out.push(breaks > 0 ? "\n".repeat(breaks) : " ");
      i = j;
      continue;
    }
    out.push(c);
    i += 1;
  }
  return out.join("");
}

/** Operator pairs that would fuse into another token without the space between them. */
const FUSE = new Set(["++", "--", "**", "&&", "||", "<<", ">>", "<=", ">=", "==", "!=", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "=>", "->", ":=", "=:", "//", "/*", "*/"]);

export function canon(code: string): string {
  const out: string[] = [];
  let pending = false;
  for (const c of code) {
    if (" \t\r\n\f\v".includes(c)) { pending = true; continue; }
    if (pending && out.length && ((isWord(out[out.length - 1]) && isWord(c)) || FUSE.has(out[out.length - 1] + c))) out.push(" ");
    pending = false;
    out.push(c);
  }
  return out.join("");
}

function match(src: string, i: number, open: string, close: string): number {
  let depth = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== c) { if (src[j] === "\\") j += 1; j += 1; }
      i = j + 1;
      continue;
    }
    if (c === open) depth += 1;
    else if (c === close) { depth -= 1; if (depth === 0) return i + 1; }
    i += 1;
  }
  return -1;
}

export function findFunctions(src: string, name: string): string[] | null {
  const found: string[] = [];
  let i = 0;
  const n = src.length;
  for (;;) {
    const k = src.indexOf("function", i);
    if (k < 0) return found;
    i = k + 8;
    if (k > 0 && isWord(src[k - 1])) continue;
    let j = i;
    while (j < n && " \t\r\n".includes(src[j])) j++;
    if (j === i) continue;
    let e = j;
    while (e < n && isWord(src[e])) e++;
    if (src.slice(j, e) !== name) continue;
    let p = e;
    while (p < n && " \t\r\n".includes(src[p])) p++;
    if (p >= n || src[p] !== "(") continue;
    const q = match(src, p, "(", ")");
    if (q < 0) return null;
    let h = q;
    while (h < n && src[h] !== "{" && src[h] !== ";") {
      if (src[h] === "(") { const h2 = match(src, h, "(", ")"); if (h2 < 0) return null; h = h2; continue; }
      h++;
    }
    if (h >= n) return null;
    if (src[h] === ";") { i = h; continue; }
    const b = match(src, h, "{", "}");
    if (b < 0) return null;
    found.push(src.slice(k, b));
    i = b;
  }
}

export const basename = (p: string) => p.slice(p.lastIndexOf("/") + 1);

export type Extracted = { ok: true; code: string; canon: string } | { ok: false; why: string };

export function extract(files: Record<string, string>, fileName: string, fn: string): Extracted {
  const want = basename(fileName);
  const hits: string[] = [];
  const seen: string[] = [];
  let seenFile = false;
  for (const p of Object.keys(files).sort()) {
    if (basename(p) !== want) continue;
    seenFile = true;
    const got = findFunctions(stripComments(String(files[p])), fn);
    if (got === null) return { ok: false, why: "UNPARSEABLE" };
    for (const g of got) {
      const c = canon(g);
      if (seen.includes(c)) continue;
      seen.push(c);
      hits.push(g);
    }
  }
  if (!seenFile) return { ok: false, why: "FILE_NOT_FOUND" };
  if (!hits.length) return { ok: false, why: "FUNCTION_NOT_FOUND" };
  if (hits.length > 1) return { ok: false, why: "FUNCTION_OVERLOADED" };
  return { ok: true, code: hits[0], canon: canon(hits[0]) };
}

export const STATUS_PHRASES = [
  "The protocol team fixed this issue",
  "Mitigation confirmed",
  "Status: Fixed",
  "Status: Mitigated",
  "Status: Resolved",
];

function idAt(line: string, fid: string): boolean {
  let i = 0;
  for (;;) {
    const k = line.indexOf(fid, i);
    if (k < 0) return false;
    const before = k > 0 ? line[k - 1] : " ";
    const after = k + fid.length < line.length ? line[k + fid.length] : " ";
    if (!isWord(before) && before !== "-" && !isWord(after) && after !== "-") return true;
    i = k + 1;
  }
}

export type Section = { ok: true; title: string; text: string; status: number } | { ok: false; why: string };

export function findingSection(report: string, fid: string): Section {
  const lines = report.split("\n");
  let start = -1;
  let level = 0;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (!ln.startsWith("#")) continue;
    let lv = 0;
    while (lv < ln.length && ln[lv] === "#") lv++;
    if (idAt(ln.slice(lv), fid)) { start = i; level = lv; break; }
  }
  if (start < 0) return { ok: false, why: "FINDING_NOT_IN_REPORT" };
  let end = lines.length;
  for (let j = start + 1; j < lines.length; j++) {
    const ln = lines[j];
    if (ln.startsWith("#")) {
      let lv = 0;
      while (lv < ln.length && ln[lv] === "#") lv++;
      if (lv <= level && ln[lv] === " ") { end = j; break; }
    }
  }
  const text = lines.slice(start, end).join("\n");
  const status = STATUS_PHRASES.findIndex((p) => text.includes(p));
  if (status < 0) return { ok: false, why: "FIXED_STATUS_NOT_IN_FINDING" };
  return { ok: true, title: lines[start].slice(level).trim(), text, status };
}

const UNRESERVED = /^[A-Za-z0-9\-._~]$/;
const unescape = (t: string) => t.replace(/%([0-9a-fA-F]{2})/g, (m, h) => { const c = String.fromCharCode(parseInt(h, 16)); return UNRESERVED.test(c) ? c : m; });

/** Same rules as contracts/FixCheck.py norm_url. */
export function normUrl(url: string): string {
  let t = url.trim();
  const h = t.indexOf("#"); if (h >= 0) t = t.slice(0, h);
  if (!t.toLowerCase().startsWith("https://")) return "";
  const rest = t.slice(8); const j = rest.indexOf("/");
  const host = (j < 0 ? rest : rest.slice(0, j)).toLowerCase();
  let path = j < 0 ? "" : rest.slice(j), query = "";
  const q = path.indexOf("?"); if (q >= 0) { query = path.slice(q); path = path.slice(0, q); }
  path = unescape(path);
  while (path.endsWith("/")) path = path.slice(0, -1);
  t = "https://" + host + path;
  if (t.startsWith("https://web.archive.org/web/")) {
    let r = t.slice(28); const k = r.indexOf("/");
    if (k > 0 && !r.slice(0, k).endsWith("id_")) r = r.slice(0, k) + "id_" + r.slice(k);
    t = "https://web.archive.org/web/" + r + (query !== "?" ? query : "");
  } else if (t.startsWith("https://raw.githubusercontent.com/")) {
    const parts = t.slice(34).split("/");
    if (parts.length >= 2) { parts[0] = parts[0].toLowerCase(); parts[1] = parts[1].toLowerCase(); }
    t = "https://raw.githubusercontent.com/" + parts.join("/");
  }
  return t;
}
/** A %-escape in the path (before any query) - refused at filing. */
export const percentInPath = (url: string) => url.trim().split("#")[0].split("?")[0].includes("%");

/** Same rules as contracts/FixCheck.py github_pin / archive_pin. */
export function githubPin(url: string): { owner: string; repo: string; sha: string; path: string } | null {
  const t = normUrl(url);
  if (!t.startsWith("https://raw.githubusercontent.com/") || /[?#\s]/.test(t) || t.length > 300) return null;
  const parts = t.slice(34).split("/");
  if (parts.length < 4) return null;
  const [owner, repo, sha] = parts;
  if (!owner || !repo || !/^[0-9a-f]{40}$/.test(sha)) return null;
  if (parts.slice(3).some((s) => s === "" || s === "." || s === "..")) return null;
  return { owner: owner.toLowerCase(), repo: repo.toLowerCase(), sha, path: parts.slice(3).join("/") };
}
export function archivePin(url: string, now = -1): { ts: string; target: string; host: string } | null {
  const t = normUrl(url);
  if (!t.startsWith("https://web.archive.org/web/") || /[#\s]/.test(t)) return null;
  const rest = t.slice(28);
  const k = rest.indexOf("/");
  if (k < 0) return null;
  let stamp = rest.slice(0, k);
  const target = rest.slice(k + 1);
  if (stamp.endsWith("id_")) stamp = stamp.slice(0, -3);
  if (!/^\d{14}$/.test(stamp) || !/^https?:\/\//.test(target)) return null;
  if (now >= 0) {
    const at = Date.parse(`${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}T${stamp.slice(8, 10)}:${stamp.slice(10, 12)}:${stamp.slice(12, 14)}Z`) / 1000;
    if (!(at > 0) || at > now) return null;
  }
  const host = target.split("//")[1]?.split(/[/?]/)[0]?.toLowerCase() ?? "";
  return host ? { ts: stamp, target, host } : null;
}
/** Same rule as contracts/FixCheck.py report_source_ok: Sherlock only. */
export function reportSourceOk(url: string): boolean {
  const g = githubPin(url);
  if (g) return g.owner === "sherlock-audit" && g.repo.endsWith("-judging");
  const a = archivePin(url);
  if (!a) return false;
  if (a.host === "audits.sherlock.xyz") return a.target.startsWith("https://audits.sherlock.xyz/");
  for (const pre of ["https://raw.githubusercontent.com/", "https://github.com/"]) {
    if (a.target.toLowerCase().startsWith(pre)) {
      const parts = a.target.slice(pre.length).split("/");
      return parts.length >= 2 && parts[0].toLowerCase() === "sherlock-audit" && parts[1].toLowerCase().endsWith("-judging");
    }
  }
  return false;
}
/** Same rule as contracts/FixCheck.py status_block: Sherlock's own status comments only. */
export function statusBlock(section: string): string {
  const lines = section.split("\n");
  const d = lines.findIndex((l) => l.trim() === "## Discussion");
  const out: string[] = [];
  let cur: string[] = [], who = "";
  const author = (l: string) => { const t = l.trim(); return /^\*\*[\w$-]+\*\*$/.test(t) && t.length >= 5 ? t.slice(2, -2) : ""; };
  const sherlock = (n: string) => n === "sherlock-admin" || /^sherlock-admin\d+$/.test(n);
  for (const l of [...lines.slice(d < 0 ? lines.length : d + 1), "**end-of-section**"]) {
    const a = author(l);
    if (a) {
      const text = cur.join("\n");
      if (sherlock(who) && STATUS_PHRASES.some((p) => text.includes(p))) out.push(text);
      who = a; cur = []; continue;
    }
    cur.push(l);
  }
  return out.join("\n");
}
export const isPinned = (u: string) => Boolean(githubPin(u) || archivePin(u));

/** Lines of the stored (comment-free) function, as the contract indexes them. */
export const codeLines = (code: string) => stripComments(code).split("\n");

/** Port of the decision helpers in contracts/FixCheck.py, for the preview. */
export function blankStrings(code: string): string {
  let out = ""; let i = 0;
  while (i < code.length) {
    const c = code[i];
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < code.length && code[j] !== c && code[j] !== "\n") { if (code[j] === "\\") j++; j++; }
      out += c + c; i = j < code.length && code[j] === c ? j + 1 : j; continue;
    }
    out += c; i++;
  }
  return out;
}
const blankedLines = (code: string) => blankStrings(stripComments(code)).split("\n");
const canonLines = (code: string) => blankedLines(code).map(canon).filter(Boolean);
const substantive = (l: string) => l.trim().length >= 8 && /[\p{L}\p{N}_$]/u.test(l);
const frames = (lines: string[]) => { const out: string[] = []; const st: string[] = []; for (const l of lines) { out.push(st.slice(1).join("\n")); for (const ch of l) { if (ch === "{") st.push(l); else if (ch === "}") st.pop(); } } return out; };
const exits = (l: string) => /(^|[^\w$])(return|revert|throw|selfdestruct)(?![\w$])/.test(l);
function lcsOps(a: string[], f: string[]): [string, number, number][] {
  const n = a.length, m = f.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === f[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops: [string, number, number][] = []; let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === f[j]) { ops.push(["=", i++, j++]); }
    else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) ops.push(["+", -1, j++]);
    else ops.push(["-", i++, -1]);
  }
  return ops;
}
export function fixChange(aud: string, fix: string): { removed: string[]; added: string[] } {
  const a = canonLines(aud), f = canonLines(fix); const removed: string[] = [], added: string[] = [];
  for (const [op, i, j] of lcsOps(a, f)) { if (op === "-") removed.push(a[i]); else if (op === "+") added.push(f[j]); }
  return { removed, added };
}
export function containsFix(dep: string, aud: string, fix: string): boolean {
  if (!fix) return false;
  const ch = fixChange(aud, fix);
  if (!ch.added.some(substantive)) return false;
  const d = canonLines(dep), fd = frames(d);
  if (ch.removed.some((x) => !ch.added.includes(x) && substantive(x) && d.includes(x))) return false;
  const a = canonLines(aud), f = canonLines(fix), ff = frames(f);
  const count = (xs: string[], x: string) => xs.filter((y) => y === x).length;
  if (ch.added.some((x) => ch.removed.includes(x) && count(d, x) !== count(f, x))) return false;
  const addedJ = lcsOps(a, f).filter(([op]) => op === "+").map(([, , j]) => j);
  let pos = 0;
  for (let k = 0; k < addedJ.length; k++) {
    const start = addedJ[k]; let end = start;
    while (k + 1 < addedJ.length && addedJ[k + 1] === end + 1) end = addedJ[++k];
    const lo = start > 0 ? start - 1 : start, hi = end + 1 < f.length ? end + 1 : end;
    const idx = Array.from({ length: hi - lo + 1 }, (_, t) => lo + t);
    let found = -1;
    for (let s = pos; s + idx.length <= d.length; s++) {
      if (idx.every((x, t) => d[s + t] === f[x] && fd[s + t] === ff[x])) { found = s; break; }
    }
    if (found < 0) return false;
    const theirs = f.slice(0, lo).filter(exits);
    for (const x of d.slice(0, found).filter(exits)) { const i = theirs.indexOf(x); if (i < 0) return false; theirs.splice(i, 1); }
    pos = found + idx.length - 1;
  }
  return true;
}
