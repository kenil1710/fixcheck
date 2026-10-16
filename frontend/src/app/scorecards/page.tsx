import Link from "next/link";
import type { Metadata } from "next";
import { getAuditors, getScorecards } from "@/lib/reads";
import { protocolMeta } from "@/lib/catalog";
import { auditorName } from "@/lib/classes";
import { commit7, day } from "@/lib/format";
import { ScoreBar } from "@/components/ScoreBar";
import { Busy, Empty } from "@/components/Busy";

export const revalidate = 30;
export const metadata: Metadata = { title: "Report scorecards", description: "Whole audit reports, every finding enumerated by code, with exact on-chain counts per verdict." };

export default async function Scorecards() {
  const [cards, auditors] = await Promise.all([getScorecards(), getAuditors()]);
  if (!cards.ok || !auditors.ok) return <Busy what="the scorecards" />;
  const items = cards.data.items;
  return (
    <div className="pt-12">
      <h1 className="t-h1">Report scorecards</h1>
      <p className="t-lede mt-3 max-w-[64ch]">
        A scorecard is a whole pinned audit report. The contract reads <em>every</em> finding in it and the auditor&apos;s own status for each; nobody picks which findings count. Every finding the report marks fixed gets a slot; anyone can file checks into it, and slots nobody checked by the deadline are counted as <strong>not checked</strong>. Every number on this page is read from the contract.
      </p>

      <section aria-labelledby="by-auditor" className="mt-10">
        <h2 id="by-auditor" className="t-h2">By auditor</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {auditors.data.map((a) => (
            <div key={a.auditor} className="sheet p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="t-h3">{auditorName(a.auditor)}</h3>
                <span className="t-small text-ink-3">{a.scorecards} {a.scorecards === 1 ? "scorecard" : "scorecards"} · {a.checks} checks</span>
              </div>
              <ScoreBar s={a} className="mt-4" />
              <p className="t-small mt-3 text-ink-2">
                {a.fixed} fixed · {a.not_fixed} not fixed · {a.regressed} regressed · {a.predates_audit} before the audit · {a.predates_fix} before the fix · {a.inconclusive} inconclusive · {a.expired} expired · {a.open} being checked
              </p>
              <p className="mt-3"><Link className="link t-small" href={`/auditors#${a.auditor}`}>Per-protocol breakdown</Link></p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="cards" className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="cards" className="t-h2">{cards.data.total} {cards.data.total === 1 ? "report" : "reports"}</h2>
          <Link href="/import" className="btn btn-sm">Import a report</Link>
        </div>
        {items.length === 0 ? <Empty title="No report imported yet"><p><Link className="link" href="/import">Import one</Link>.</p></Empty> : (
          <ul className="mt-4 grid gap-3">
            {items.map((c) => {
              const m = protocolMeta(c.protocol);
              return (
                <li key={c.scorecard_id}>
                  <Link href={`/scorecards/${c.scorecard_id}`} className="sheet block p-5 no-underline hover:border-ink-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span className="t-h3">{m.name} <span className="text-ink-2">· {auditorName(c.auditor)}</span></span>
                      <span className="t-small text-ink-3">#{c.scorecard_id} · {c.state === "OPEN" ? `filing open until ${day(c.file_deadline)}` : `closed ${day(c.closed_at)}`}</span>
                    </div>
                    <p className="t-small mt-1 mono text-ink-3 break-all">{c.report_url.split("/").slice(3, 5).join("/")}@{commit7(c.report_url.split("/")[5] ?? "")}</p>
                    <dl className="mt-4 grid grid-cols-2 gap-3 t-small sm:grid-cols-4">
                      <div><dt className="text-ink-3">Findings in the report</dt><dd className="t-num text-[1.4rem]">{c.findings}</dd></div>
                      <div><dt className="text-ink-3">Marked fixed by the auditor</dt><dd className="t-num text-[1.4rem]">{c.marked_fixed}</dd></div>
                      <div><dt className="text-ink-3">Checked (at least once)</dt><dd className="t-num text-[1.4rem]">{c.filed}</dd></div>
                      <div><dt className="text-ink-3">Confirmed fixed</dt><dd className="t-num text-[1.4rem] text-fixed">{c.verdicts.fixed}</dd></div>
                    </dl>
                    <ScoreBar s={c.verdicts} className="mt-4" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
