"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Check } from "@/lib/types";
import { CHAIN_NAMES, severityOf } from "@/lib/catalog";
import { basisOf } from "@/lib/basis";
import { day, short } from "@/lib/format";
import { Status, statusOf, type StatusKind } from "./Status";
import { Inline } from "./Inline";

type SortKey = "severity" | "status" | "id";
const ORDER: Record<StatusKind, number> = { NOT_FIXED: 0, PREDATES: 1, INCONCLUSIVE: 2, EXPIRED: 3, OPEN: 4, FIXED: 5 };
const FILTERS: [string, string][] = [["all", "All"], ["FIXED", "Fixed"], ["NOT_FIXED", "Not fixed"], ["PREDATES", "Predates audit"], ["INCONCLUSIVE", "Inconclusive"], ["OPEN", "Being checked"]];

export function FindingsTable({ items, showProtocol = false, base = "/checks" }: { items: Check[]; showProtocol?: boolean; base?: string }) {
  const [sort, setSort] = useState<SortKey>("severity");
  const [filter, setFilter] = useState("all");
  const rows = useMemo(() => {
    const r = items.map((c) => ({ c, k: statusOf(c.state, c.verdict), sev: severityOf(c.finding_id) }))
      .filter((x) => filter === "all" || x.k === filter || (filter === "INCONCLUSIVE" && x.k === "EXPIRED"));
    const num = (id: string) => Number(id.replace(/\D/g, "")) || 0;
    r.sort((a, b) =>
      sort === "severity" ? a.sev.rank - b.sev.rank || num(a.c.finding_id) - num(b.c.finding_id) :
      sort === "status" ? ORDER[a.k] - ORDER[b.k] || a.sev.rank - b.sev.rank : a.c.check_id - b.c.check_id);
    return r;
  }, [items, sort, filter]);
  const counts = (f: string) => f === "all" ? items.length : items.filter((c) => { const k = statusOf(c.state, c.verdict); return k === f || (f === "INCONCLUSIVE" && k === "EXPIRED"); }).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
          {FILTERS.map(([v, l]) => (
            <button key={v} type="button" aria-pressed={filter === v} onClick={() => setFilter(v)}
              className={`rounded-full border px-3 py-1.5 text-sm ${filter === v ? "border-ink bg-ink text-sheet" : "hair text-ink-2 hover:border-ink-3"}`}>
              {l} <span className="opacity-70">{counts(v)}</span>
            </button>
          ))}
        </div>
        <label className="t-small flex items-center gap-2 text-ink-2">Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="field !min-h-9 !w-auto !py-1 !font-sans">
            <option value="severity">Severity</option>
            <option value="status">Status</option>
            <option value="id">Check number</option>
          </select>
        </label>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 text-ink-2">Nothing matches this filter. <button type="button" className="link" onClick={() => setFilter("all")}>Show all</button></p>
      ) : (
        <ul className="mt-5 border-t hair">
          {rows.map(({ c, k, sev }) => (
            <li key={c.check_id} className="border-b hair">
              <Link href={`${base}/${c.check_id}`} className="group grid grid-cols-[3.5rem_1fr] gap-x-4 gap-y-2 py-4 no-underline sm:grid-cols-[4.5rem_1fr_auto] md:grid-cols-[4.5rem_1fr_11rem_9.5rem]">
                <div>
                  <span className="mono text-[0.95rem] font-medium">{c.finding_id}</span>
                  <span className="t-label block">{sev.label}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium leading-snug group-hover:underline decoration-1 underline-offset-4"><Inline text={c.title.replace(/^Issue [A-Z]-\d+:\s*/, "")} /></p>
                  <p className="t-small mt-1 text-ink-3">
                    <span className="mono text-ink-2">{c.function}()</span> on {CHAIN_NAMES[c.chain] ?? c.chain} <span className="mono">{short(c.address)}</span>
                    {c.created_at > 0 && <span className="block sm:inline"><span className="hidden sm:inline"> · </span>deployed {day(c.created_at)}, audited {day(c.audited_at)}</span>}
                    {showProtocol ? null : null}
                  </p>
                </div>
                <p className="t-small col-start-2 text-ink-2 md:col-start-auto md:pt-0.5">{c.state === "OPEN" ? "Waiting for the counter-stake window" : basisOf(c.basis).short}</p>
                <div className="col-start-2 sm:col-start-3 sm:row-start-1 sm:justify-self-end md:col-start-4"><Status kind={k} /></div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
