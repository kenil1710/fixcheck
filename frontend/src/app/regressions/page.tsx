import Link from "next/link";
import type { Metadata } from "next";
import { getChecks, getRegressions } from "@/lib/reads";
import { CHAIN_EXPLORERS, CHAIN_NAMES, protocolMeta } from "@/lib/catalog";
import { short, when } from "@/lib/format";
import { Status, statusOf } from "@/components/Status";
import { Busy } from "@/components/Busy";

export const revalidate = 30;
export const metadata: Metadata = { title: "Regression watch", description: "Every FIXED proxy re-checked after an upgrade." };

export default async function Regressions() {
  const [reg, checks] = await Promise.all([getRegressions(), getChecks()]);
  if (!reg.ok || !checks.ok) return <Busy what="the regression watch" />;
  // what the patrol bot watches: the latest decided check per finding+deployment is FIXED and names a proxy implementation
  const latest = new Map<string, (typeof checks.data.items)[number]>();
  for (const c of checks.data.items) if (c.state !== "EXPIRED" && (!latest.get(c.key) || c.check_id > latest.get(c.key)!.check_id)) latest.set(c.key, c);
  const watched = [...latest.values()].filter((c) => c.state === "DECIDED" && c.verdict === "FIXED" && c.implementation);
  const items = [...reg.data.items].reverse();
  return (
    <div className="pt-12">
      <h1 className="t-h1">Regression watch</h1>
      <p className="t-lede mt-3 max-w-[64ch]">
        A fix can be undone by an upgrade. A patrol bot (a GitHub Actions schedule, every 30 minutes) reads the implementation slot of every proxy whose latest verdict is <strong>Fixed</strong>, from the same two RPCs the contract uses. When it changes, the bot re-files the check against the new implementation. If the function is the audited, vulnerable version again, code decides <strong>Regressed</strong>.
      </p>

      <section aria-labelledby="watched" className="mt-10">
        <h2 id="watched" className="t-h2">Watched now ({watched.length})</h2>
        {watched.length === 0 ? <p className="t-small mt-2 text-ink-2">No decided Fixed check is on a proxy yet.</p> : (
          <ul className="mt-3 grid gap-2">
            {watched.map((c) => (
              <li key={c.check_id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b hair py-2 t-small">
                <Link className="link" href={`/checks/${c.check_id}`}>#{c.check_id}</Link>
                <span>{protocolMeta(c.protocol).name} {c.finding_id} <span className="mono">{c.function}</span></span>
                <span className="text-ink-3">{CHAIN_NAMES[c.chain] ?? c.chain} proxy <a className="mono link" href={`${CHAIN_EXPLORERS[c.chain]}/address/${c.address}`}>{short(c.address)}</a> → <span className="mono">{short(c.implementation)}</span></span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="timeline" className="mt-12">
        <h2 id="timeline" className="t-h2">Timeline ({reg.data.total} re-checks)</h2>
        {items.length === 0 ? <p className="t-small mt-2 text-ink-2">No watched proxy has been upgraded since it was checked. Nothing has been re-filed.</p> : (
          <ol className="mt-4 border-l hair pl-5">
            {items.map(({ check: c, prior: p }) => (
              <li key={c.check_id} className="relative mb-8">
                <span className="absolute -left-[1.62rem] top-1.5 h-2.5 w-2.5 rounded-full" style={{ background: c.verdict === "REGRESSED" ? "var(--bad)" : c.verdict === "FIXED" ? "var(--fixed)" : "var(--ink-3)" }} aria-hidden="true" />
                <p className="t-small text-ink-3">{when(c.filed_at)}</p>
                <p className="mt-1">{protocolMeta(c.protocol).name} {c.finding_id} <span className="mono">{c.function}</span> on {CHAIN_NAMES[c.chain] ?? c.chain}</p>
                <p className="t-small mt-1 text-ink-2">
                  Was <Link className="link" href={`/checks/${p.check_id}`}>Fixed (#{p.check_id})</Link> on implementation <span className="mono">{short(p.implementation)}</span>; the proxy now runs <span className="mono">{short(c.implementation)}</span>{c.switch_status === "EVENT" && c.switch_block ? <> (Upgraded at block {c.switch_block})</> : null}.
                </p>
                <p className="mt-2"><Link href={`/checks/${c.check_id}`} className="no-underline"><Status kind={statusOf(c.state, c.verdict)} /></Link> <span className="t-small text-ink-3">check #{c.check_id}{c.basis ? ` · ${c.basis}` : ""}</span></p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
