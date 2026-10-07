import type { Score } from "@/lib/types";

/** Scorecard ring: share of decided findings confirmed in deployed code. */
export function Ring({ s, size = 132 }: { s: Score; size?: number }) {
  const unsure = s.inconclusive + s.expired;
  const pre = s.predates_audit ?? 0;
  const pf = s.predates_fix ?? 0;
  const decided = s.fixed + s.not_fixed + pre + pf + unsure;
  const r = 52, c = 2 * Math.PI * r;
  const parts: [number, string, number][] = [[s.fixed, "var(--fixed)", 1], [s.not_fixed, "var(--bad)", 1], [pre, "var(--ink-3)", 1], [pf, "var(--ink-3)", 0.5], [unsure, "var(--unsure)", 1]];
  let off = 0;
  return (
    <figure className="flex items-center gap-5">
      <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={`${s.fixed} of ${decided} decided findings confirmed fixed in deployed code`}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--rule)" strokeWidth="9" />
        {decided > 0 && parts.map(([n, col, op], i) => {
          const len = (n / decided) * c;
          const el = n > 0 ? <circle key={i} cx="60" cy="60" r={r} fill="none" stroke={col} strokeOpacity={op} strokeWidth="9" strokeDasharray={`${Math.max(0, len - 1.5)} ${c}`} strokeDashoffset={-off} transform="rotate(-90 60 60)" /> : null;
          off += len;
          return el;
        })}
        <text x="60" y="58" textAnchor="middle" className="t-num" style={{ fontSize: 30, fill: "var(--ink)", fontWeight: 500 }}>{s.fixed}/{decided}</text>
        <text x="60" y="78" textAnchor="middle" style={{ fontSize: 10.5, fill: "var(--ink-3)" }}>confirmed fixed</text>
      </svg>
      <figcaption className="t-small grid gap-1">
        <span className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--fixed)" }} />{s.fixed} fixed in deployed code</span>
        <span className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--bad)" }} />{s.not_fixed} not in deployed code</span>
        {pre > 0 && <span className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--ink-3)" }} />{pre} deployed before the audit</span>}
        {pf > 0 && <span className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--ink-3)", opacity: 0.5 }} />{pf} deployed before the fix existed</span>}
        <span className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "var(--unsure)" }} />{unsure} inconclusive</span>
        {s.open > 0 && <span className="flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-sm border border-dashed" style={{ borderColor: "var(--ink-3)" }} />{s.open} being checked</span>}
      </figcaption>
    </figure>
  );
}
