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

export function canon(code: string): string {
  const out: string[] = [];
  let pending = false;
  for (const c of code) {
    if (" \t\r\n\f\v".includes(c)) { pending = true; continue; }
    if (pending && out.length && isWord(out[out.length - 1]) && isWord(c)) out.push(" ");
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

/** Same rules as contracts/FixCheck.py github_pin / archive_pin. */
export function githubPin(url: string): { owner: string; repo: string; sha: string; path: string } | null {
  const t = url.trim();
  if (!t.startsWith("https://raw.githubusercontent.com/") || /[?#\s]/.test(t) || t.length > 300) return null;
  const parts = t.slice(34).split("/");
  if (parts.length < 4) return null;
  const [owner, repo, sha] = parts;
  if (!owner || !repo || !/^[0-9a-f]{40}$/.test(sha)) return null;
  if (parts.slice(3).some((s) => s === "" || s === "." || s === "..")) return null;
  return { owner: owner.toLowerCase(), repo: repo.toLowerCase(), sha, path: parts.slice(3).join("/") };
}
export function archivePin(url: string): { ts: string; target: string; host: string } | null {
  const t = url.trim();
  if (!t.startsWith("https://web.archive.org/web/") || /[?#\s]/.test(t)) return null;
  const rest = t.slice(28);
  const k = rest.indexOf("/");
  if (k < 0) return null;
  let stamp = rest.slice(0, k);
  const target = rest.slice(k + 1);
  if (stamp.endsWith("id_")) stamp = stamp.slice(0, -3);
  if (!/^\d{14}$/.test(stamp) || !/^https?:\/\//.test(target)) return null;
  const host = target.split("//")[1]?.split("/")[0]?.toLowerCase() ?? "";
  return host ? { ts: stamp, target, host } : null;
}
export const isPinned = (u: string) => Boolean(githubPin(u) || archivePin(u));

/** Lines of the stored (comment-free) function, as the contract indexes them. */
export const codeLines = (code: string) => stripComments(code).split("\n");

/** Port of fix_change / contains_fix (contracts/FixCheck.py), for the preview. */
const canonLines = (code: string) => codeLines(code).map(canon).filter(Boolean);
const substantive = (l: string) => l.trim().length >= 8 && /[\p{L}\p{N}_$]/u.test(l);
export function fixChange(aud: string, fix: string): { removed: string[]; added: string[] } {
  const a = canonLines(aud), f = canonLines(fix), n = a.length, m = f.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === f[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const removed: string[] = [], added: string[] = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === f[j]) { i++; j++; }
    else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) added.push(f[j++]);
    else removed.push(a[i++]);
  }
  return { removed, added };
}
export function containsFix(dep: string, aud: string, fix: string): boolean {
  if (!fix) return false;
  const ch = fixChange(aud, fix);
  const added = ch.added.filter(substantive), removed = ch.removed.filter(substantive);
  if (!added.length) return false;
  const d = canonLines(dep);
  return added.every((x) => d.includes(x)) && !removed.some((x) => d.includes(x));
}
