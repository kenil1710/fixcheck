import type { FindingClass } from "./types";

/** What the AUDITOR's report says about a finding (read by code at import), never our verdict. */
export const CLASS_WORDS: Record<FindingClass, { word: string; note: string }> = {
  FIXED_MARKED: { word: "Marked fixed", note: "The auditor's own status marks this finding fixed; it gets a slot for checks." },
  ACKNOWLEDGED: { word: "Acknowledged", note: "The report records that the protocol acknowledged it without a fix; there is no fix to look for." },
  NOT_MITIGATED: { word: "Not fully mitigated", note: "The auditor's mitigation review did not confirm the fix." },
  UNMARKED: { word: "No status", note: "The report gives this finding no fixed or acknowledged status." },
};
export const AUDITOR_NAMES: Record<string, string> = { sherlock: "Sherlock", code4rena: "Code4rena" };
export const auditorName = (a: string) => AUDITOR_NAMES[a] ?? a;

/** A finding title as the report wrote it, minus its heading markup (Sherlock "Issue M-1:", Code4rena "[[M-01] ...](link)"). */
export function cleanTitle(raw: string, cap = 100): string {
  let t = raw.trim().replace(/^Issue [HMCL]-\d+:\s*/, "").replace(/^\[\[[^\]]+\]\s*/, "");
  const k = t.indexOf("](");
  if (k >= 0) t = t.slice(0, k);
  else if (raw.trim().startsWith("[[") && t.endsWith("]")) t = t.slice(0, -1);
  return raw.length >= cap && k < 0 ? t.trimEnd() + "…" : t.trim();
}
