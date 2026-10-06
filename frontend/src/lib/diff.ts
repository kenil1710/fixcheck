/**
 * Side-by-side line diff for the evidence viewer. Lines are compared on their
 * canonical form (whitespace-insensitive, like the contract), so re-indented
 * code reads as unchanged and only real edits are highlighted.
 */
import { canon } from "./solfn";

export type Side = { n: number; text: string };
export type Row =
  | { kind: "same"; left: Side; right: Side }
  | { kind: "change"; left: Side; right: Side }
  | { kind: "del"; left: Side; right: null }
  | { kind: "add"; left: null; right: Side };

export function dedent(lines: string[]): string[] {
  // Line 0 is "function ..." sliced from the file at column 0; the rest keep the
  // file's indentation. The closing brace's indent is the function's own.
  const indent = (l: string) => l.match(/^[ \t]*/)![0].length;
  const last = [...lines].reverse().find((l) => l.trim());
  const cut = last ? indent(last) : 0;
  return lines.map((l, i) => (i === 0 ? l : l.slice(Math.min(cut, indent(l)))));
}

/** Collapse runs of rows that are blank on both sides (left by removed comments) into one. */
export function squeeze(rows: Row[]): Row[] {
  const blank = (r: Row) => (!r.left || !r.left.text.trim()) && (!r.right || !r.right.text.trim());
  return rows.filter((r, i) => !(blank(r) && i > 0 && blank(rows[i - 1])));
}

export function diffLines(a: string[], b: string[]): Row[] {
  const ca = a.map(canon), cb = b.map(canon);
  const n = a.length, m = b.length;
  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = ca[i] === cb[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const raw: Row[] = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && ca[i] === cb[j]) { raw.push({ kind: "same", left: { n: i, text: a[i] }, right: { n: j, text: b[j] } }); i++; j++; }
    else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) { raw.push({ kind: "add", left: null, right: { n: j, text: b[j] } }); j++; }
    else { raw.push({ kind: "del", left: { n: i, text: a[i] }, right: null }); i++; }
  }
  // pair adjacent del/add runs into "change" rows so the two columns line up
  const out: Row[] = [];
  for (let k = 0; k < raw.length; ) {
    if (raw[k].kind === "same") { out.push(raw[k]); k++; continue; }
    const dels: Side[] = [], adds: Side[] = [];
    while (k < raw.length && raw[k].kind !== "same") {
      const r = raw[k];
      if (r.kind === "del") dels.push(r.left); else if (r.kind === "add") adds.push(r.right);
      k++;
    }
    const pairs = Math.min(dels.length, adds.length);
    for (let p = 0; p < pairs; p++) out.push({ kind: "change", left: dels[p], right: adds[p] });
    for (let p = pairs; p < dels.length; p++) out.push({ kind: "del", left: dels[p], right: null });
    for (let p = pairs; p < adds.length; p++) out.push({ kind: "add", left: null, right: adds[p] });
  }
  return out;
}
