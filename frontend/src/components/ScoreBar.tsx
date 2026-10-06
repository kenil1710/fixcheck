import type { Score } from "@/lib/types";

/** A segmented bar: green fixed, red not fixed, amber inconclusive, dashed open. Labelled for screen readers. */
export function ScoreBar({ s, className = "" }: { s: Score; className?: string }) {
  const unsure = s.inconclusive + s.expired;
  const total = Math.max(1, s.fixed + s.not_fixed + unsure + s.open);
  const seg = (n: number, color: string, dashed = false) =>
    n > 0 ? <span style={{ width: `${(n / total) * 100}%`, background: dashed ? "transparent" : color, border: dashed ? `1px dashed var(--ink-3)` : undefined }} className="h-full first:rounded-l-sm last:rounded-r-sm" /> : null;
  return (
    <div className={`flex h-2.5 w-full gap-[2px] ${className}`} role="img"
      aria-label={`${s.fixed} fixed, ${s.not_fixed} not fixed, ${unsure} inconclusive, ${s.open} being checked`}>
      {seg(s.fixed, "var(--fixed)")}{seg(s.not_fixed, "var(--bad)")}{seg(unsure, "var(--unsure)")}{seg(s.open, "", true)}
    </div>
  );
}
