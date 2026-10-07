import type { Score } from "@/lib/types";

/** A segmented bar: green fixed, red not fixed, gray predates (audit solid, fix lighter), amber inconclusive, dashed open. Labelled for screen readers. */
export function ScoreBar({ s, className = "" }: { s: Score; className?: string }) {
  const unsure = s.inconclusive + s.expired;
  const pre = s.predates_audit ?? 0;
  const pf = s.predates_fix ?? 0;
  const total = Math.max(1, s.fixed + s.not_fixed + pre + pf + unsure + s.open);
  const seg = (n: number, color: string, dashed = false, faint = false) =>
    n > 0 ? <span style={{ width: `${(n / total) * 100}%`, background: dashed ? "transparent" : color, border: dashed ? `1px dashed var(--ink-3)` : undefined, opacity: faint ? 0.5 : undefined }} className="h-full first:rounded-l-sm last:rounded-r-sm" /> : null;
  return (
    <div className={`flex h-2.5 w-full gap-[2px] ${className}`} role="img"
      aria-label={`${s.fixed} fixed, ${s.not_fixed} not fixed, ${pre} predate the audit, ${pf} predate the fix, ${unsure} inconclusive, ${s.open} being checked`}>
      {seg(s.fixed, "var(--fixed)")}{seg(s.not_fixed, "var(--bad)")}{seg(pre, "var(--ink-3)")}{seg(pf, "var(--ink-3)", false, true)}{seg(unsure, "var(--unsure)")}{seg(s.open, "", true)}
    </div>
  );
}
