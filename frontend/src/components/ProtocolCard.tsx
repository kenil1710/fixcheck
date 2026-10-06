import Link from "next/link";
import { CHAIN_NAMES, protocolMeta } from "@/lib/catalog";
import type { Check, ProtocolScore } from "@/lib/types";
import { ScoreBar } from "./ScoreBar";

export function ProtocolCard({ p, checks }: { p: ProtocolScore; checks: Check[] }) {
  const m = protocolMeta(p.protocol);
  const chains = [...new Set(checks.filter((c) => c.protocol === p.protocol).map((c) => CHAIN_NAMES[c.chain] ?? c.chain))];
  const unsure = p.inconclusive + p.expired;
  return (
    <Link href={`/protocols/${m.slug}`} className="group sheet flex flex-col p-5 no-underline transition-colors hover:border-[var(--ink-3)]">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="t-h3 group-hover:underline decoration-1 underline-offset-4">{m.name}</h3>
        <span className="t-label shrink-0">{p.checks} checked</span>
      </div>
      <p className="t-small mt-1 text-ink-2">{chains.join(", ")}</p>
      <ScoreBar s={p} className="mt-5" />
      <dl className="t-small mt-3 flex flex-wrap gap-x-4 gap-y-1">
        <div className="flex gap-1.5"><dt className="text-ink-3">Fixed</dt><dd className="font-semibold" style={{ color: "var(--fixed)" }}>{p.fixed}</dd></div>
        <div className="flex gap-1.5"><dt className="text-ink-3">Not fixed</dt><dd className="font-semibold" style={{ color: "var(--bad)" }}>{p.not_fixed}</dd></div>
        <div className="flex gap-1.5"><dt className="text-ink-3">Inconclusive</dt><dd className="font-semibold" style={{ color: "var(--unsure)" }}>{unsure}</dd></div>
        {p.open > 0 && <div className="flex gap-1.5"><dt className="text-ink-3">Open</dt><dd className="font-semibold">{p.open}</dd></div>}
      </dl>
    </Link>
  );
}
