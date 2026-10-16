/**
 * Port of contracts/FixCheck.py enumerate_findings / c4_status / sherlock_class
 * (v2), for the import PREVIEW only. On chain the contract also confirms each
 * Sherlock "fixed" status on GitHub's issue page and checks the report names
 * the protocol; this preview says so rather than guessing.
 */
import { findingSection, githubPin, statusBlock } from "./solfn";
import type { FindingClass } from "./types";

export const MAX_FINDINGS = 80;
const SHERLOCK_ACK = "The protocol has acknowledged this issue.";

export function auditorOf(url: string): "sherlock" | "code4rena" | "" {
  const g = githubPin(url);
  if (!g) return "";
  if (g.owner === "sherlock-audit" && g.repo.endsWith("-judging")) return "sherlock";
  if (g.owner === "code-423n4" && g.repo.endsWith("-findings") && g.path === "report.md") return "code4rena";
  return "";
}
const cells = (line: string) => { const t = line.trim(); return t.startsWith("|") && t.endsWith("|") && t.length >= 3 ? t.slice(1, -1).split("|").map((c) => c.trim()) : []; };
const linkText = (cell: string) => { const m = cell.match(/\[([^\]]*)\]\(/); return m ? m[1].trim() : ""; };
function tables(report: string, heading: string): string[][][] {
  const lines = report.split("\n"); const out: string[][][] = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i]; if (!ln.startsWith("#")) continue;
    let lv = 0; while (lv < ln.length && ln[lv] === "#") lv++;
    if (ln.slice(lv).trim() !== heading) continue;
    let j = i + 1; while (j < lines.length && lines[j].trim() === "") j++;
    let rows = 0; const t: string[][] = [];
    while (j < lines.length && cells(lines[j]).length) { rows++; if (rows > 2) t.push(cells(lines[j])); j++; }
    out.push(t);
  }
  return out;
}
function rowsFor(ts: string[][][], col: number, fid: string) {
  const rows: string[][] = []; let each = true;
  for (const t of ts) { const mine = t.filter((r) => r.length > col && linkText(r[col]) === fid); if (mine.length !== 1) each = false; rows.push(...mine); }
  return { rows, ok: each && ts.length > 0 };
}
const c4Class = (s: string) => /^(Not fully mitigated|Mitigation error|Unmitigated)/.test(s.trim()) ? "NOT_MITIGATED" : s.trim().startsWith("Mitigation confirmed") ? "FIXED_MARKED" : "";
export function c4Status(report: string, fid: string): { cls: FindingClass | "AMBIGUOUS" | ""; row?: string } {
  const sec = findingSection(report, fid, false);
  if (!sec.ok) return { cls: "" };
  const st = rowsFor(tables(report, "Mitigation Review Summary"), 0, fid), pt = rowsFor(tables(report, "Individual PRs"), 1, fid), ot = rowsFor(tables(report, "Out of Scope"), 0, fid);
  const lines = sec.text.split("\n").filter((l) => l.startsWith("**Status**:")).map((l) => l.slice(11).trim());
  for (const t of [st, pt, ot]) if (t.rows.length > 0 && !t.ok) return { cls: "AMBIGUOUS" };
  if (st.rows.some((r) => r.length < 2 || c4Class(r[1]) !== c4Class(st.rows[0][1]))) return { cls: "AMBIGUOUS" };
  if (pt.rows.some((r) => r[0] !== pt.rows[0][0])) return { cls: "AMBIGUOUS" };
  if (st.rows.length) {
    const cls = c4Class(st.rows[0][1]);
    if (!cls || !lines.length || lines.some((l) => c4Class(l) !== cls) || ot.rows.length) return { cls: "AMBIGUOUS" };
    if (cls !== "FIXED_MARKED") return { cls };
    return pt.rows.length ? { cls, row: pt.rows[0][0] } : { cls: "AMBIGUOUS" };
  }
  if (lines.length) return { cls: "AMBIGUOUS" };
  if (ot.rows.length && /acknowledged/i.test(ot.rows[0][1] ?? "")) return { cls: "ACKNOWLEDGED" };
  return { cls: "UNMARKED" };
}
function sherlockClass(section: string): FindingClass | "AMBIGUOUS" {
  const head = section.split("\n## Found by")[0];
  const ack = head.split("\n").slice(1).some((l) => l.trim() === SHERLOCK_ACK);
  const fixed = statusBlock(section) !== "";
  return fixed && ack ? "AMBIGUOUS" : fixed ? "FIXED_MARKED" : ack ? "ACKNOWLEDGED" : "UNMARKED";
}
export type Enumerated = { ok: true; items: [string, FindingClass, string][] } | { ok: false; why: string };
export function enumerateFindings(report: string, auditor: "sherlock" | "code4rena"): Enumerated {
  const ids: string[] = [];
  for (const ln of report.split("\n")) {
    if (auditor === "sherlock" && ln.startsWith("# Issue ")) { const k = ln.indexOf(":"); if (k > 8) ids.push(ln.slice(8, k).trim()); }
    if (auditor === "code4rena" && ln.startsWith("## [[")) { const k = ln.indexOf("]"); if (k > 5) ids.push(ln.slice(5, k).trim()); }
  }
  if (!ids.length) return { ok: false, why: "NO_FINDINGS_IN_REPORT" };
  if (ids.length > MAX_FINDINGS) return { ok: false, why: "TOO_MANY_FINDINGS" };
  const count: Record<string, number> = { H: 0, M: 0 };
  const seen = new Set<string>();
  for (const fid of ids) {
    if (seen.has(fid)) return { ok: false, why: "FINDING_IDS_NOT_UNIQUE" };
    seen.add(fid);
    const m = fid.match(/^([HM])-(\d+)$/);
    if (!m) return { ok: false, why: "FINDING_ID_MALFORMED" };
    count[m[1]]++;
    if (Number(m[2]) !== count[m[1]]) return { ok: false, why: "FINDING_IDS_NOT_IN_SEQUENCE" };
  }
  if (auditor === "code4rena") {
    const dec: Record<string, number> = {};
    for (const ln of report.split("\n")) for (const [sev, w] of [["H", "High"], ["M", "Medium"]]) { const m = ln.match(new RegExp(`^# ${w} Risk Findings \\((\\d+)\\)\\s*$`)); if (m) dec[sev] = Number(m[1]); }
    if ((dec.H ?? 0) !== count.H || (dec.M ?? 0) !== count.M) return { ok: false, why: "FINDING_COUNT_MISMATCH" };
  }
  const items: [string, FindingClass, string][] = [];
  for (const fid of ids) {
    const sec = findingSection(report, fid, false);
    if (!sec.ok) return { ok: false, why: "FINDING_SECTION_UNREADABLE" };
    const cls = auditor === "code4rena" ? c4Status(report, fid).cls : sherlockClass(sec.text);
    if (cls === "AMBIGUOUS" || cls === "") return { ok: false, why: "FINDING_STATUS_AMBIGUOUS" };
    items.push([fid, cls, sec.title.slice(0, 200)]);
  }
  if (!items.some((x) => x[1] === "FIXED_MARKED")) return { ok: false, why: "NOTHING_MARKED_FIXED" };
  return { ok: true, items };
}
