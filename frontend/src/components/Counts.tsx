import type { Score } from "@/lib/types";

/** Every count of a Score, exactly as the contract stores it. Zero rows are kept: an exact table, not a highlight reel. */
export function Counts({ s, extra = [], caption }: { s: Score; extra?: [string, number, string?][]; caption?: string }) {
  const rows: [string, number, string][] = [
    ["Fixed in deployed code", s.fixed, "text-fixed"],
    ["Not in deployed code", s.not_fixed, "text-bad"],
    ["Regressed after an upgrade", s.regressed ?? 0, "text-bad"],
    ["Deployed before the audit", s.predates_audit ?? 0, "text-ink-2"],
    ["Deployed before the fix existed", s.predates_fix ?? 0, "text-ink-2"],
    ["Inconclusive", s.inconclusive, "text-unsure"],
    ["Expired (nobody decided in time)", s.expired, "text-unsure"],
    ["Being checked", s.open, "text-ink-2"],
    ...extra.map(([k, n, c]) => [k, n, c ?? "text-ink-2"] as [string, number, string]),
  ];
  return (
    <table className="w-full t-small">
      {caption && <caption className="t-label pb-2 text-left">{caption}</caption>}
      <tbody>
        {rows.map(([k, n, c]) => (
          <tr key={k} className="border-b hair">
            <th scope="row" className="py-2 pr-3 text-left font-normal text-ink-2">{k}</th>
            <td className={`t-num py-2 text-right text-[1.05rem] ${n > 0 ? c : "text-ink-3"}`}>{n}</td>
          </tr>
        ))}
        <tr>
          <th scope="row" className="py-2 pr-3 text-left font-medium">Checks filed</th>
          <td className="t-num py-2 text-right text-[1.05rem] font-medium">{s.checks}</td>
        </tr>
      </tbody>
    </table>
  );
}
