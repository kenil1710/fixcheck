import Link from "next/link";
import type { Metadata } from "next";
import { getScorecard, getScorecardSlots } from "@/lib/reads";
import { CHAIN_NAMES, protocolMeta, severityOf } from "@/lib/catalog";
import { CLASS_WORDS, auditorName, cleanTitle } from "@/lib/classes";
import { Title } from "@/components/Title";
import { commit7, short, when } from "@/lib/format";
import { Counts } from "@/components/Counts";
import { Ring } from "@/components/Ring";
import { Status, statusOf } from "@/components/Status";
import { SlotActions } from "@/components/SlotActions";
import { Busy, Empty } from "@/components/Busy";
import { IconExternal } from "@/components/Icons";
import type { FindingClass } from "@/lib/types";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: `Scorecard #${(await params).id}` };
}

const CLASSES: FindingClass[] = ["FIXED_MARKED", "ACKNOWLEDGED", "NOT_MITIGATED", "UNMARKED"];

export default async function ScorecardPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return <Empty title="No such scorecard"><p><Link className="link" href="/scorecards">All scorecards</Link></p></Empty>;
  const [card, slots] = await Promise.all([getScorecard(id), getScorecardSlots(id)]);
  if (!card.ok && card.error === "NOT_FOUND") return <Empty title={`No scorecard #${id}`}><p><Link className="link" href="/scorecards">All scorecards</Link></p></Empty>;
  if (!card.ok || !slots.ok) return <Busy what={`scorecard #${id}`} />;
  const c = card.data;
  const m = protocolMeta(c.protocol);
  const v = c.verdicts;
  const byClass = (k: FindingClass) => slots.data.items.filter((s) => s.cls === k).length;
  const fixedSlots = slots.data.items.filter((s) => s.cls === "FIXED_MARKED");
  const repo = c.report_url.split("/").slice(3, 5).join("/");

  return (
    <div className="pt-12">
      <p className="t-small"><Link className="link text-ink-2" href="/scorecards">Scorecards</Link></p>
      <div className="mt-3 grid gap-10 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <h1 className="t-h1">{m.name} · {auditorName(c.auditor)} report</h1>
          <p className="t-small mt-3 flex flex-wrap gap-x-5 gap-y-1">
            <a className="link inline-flex items-center gap-1 break-all" href={c.report_url}>{repo}@{commit7(c.report_url.split("/")[5] ?? "")}<IconExternal /></a>
            <span className="text-ink-3">report on {c.report_reach.replace("default:", "default branch ").replace("branch:", "branch ")}</span>
            <a className="link inline-flex items-center gap-1" href={c.docs_url}>protocol docs<IconExternal /></a>
          </p>
          <p className="t-small mt-2 text-ink-3">Scorecard #{c.scorecard_id} · imported {when(c.opened_at)} · {c.state === "OPEN" ? `filing open until ${when(c.file_deadline)}` : `closed ${when(c.closed_at)}`} · report sha256 <span className="mono">{short(c.report_sha256, 10, 6)}</span></p>

          <section aria-labelledby="report-says" className="mt-8">
            <h2 id="report-says" className="t-label">What the report says, finding by finding (read by code)</h2>
            <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="border-t hair pt-2"><dt className="t-small text-ink-3">Findings</dt><dd className="t-num text-[1.7rem]">{c.findings}</dd></div>
              {CLASSES.map((k) => (
                <div key={k} className="border-t hair pt-2"><dt className="t-small text-ink-3">{CLASS_WORDS[k].word}</dt><dd className="t-num text-[1.7rem]">{byClass(k)}</dd></div>
              ))}
            </dl>
            <p className="t-small mt-2 text-ink-3">Stored at import: {c.marked_fixed} marked fixed, {c.acknowledged} acknowledged, {c.not_mitigated} not fully mitigated, {c.unmarked} with no status = {c.findings}. A report that could not be enumerated completely is refused whole.</p>
          </section>
        </div>
        <div className="sheet self-start p-5"><Ring s={v} /></div>
      </div>

      <section aria-labelledby="counts" className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <h2 id="counts" className="t-h2">Exact counts</h2>
          <p className="t-small mt-1 text-ink-2">Every check filed into this scorecard&apos;s slots, by verdict, as stored by the contract.</p>
          <div className="mt-3"><Counts s={v} extra={[["Marked fixed, checked at least once", c.filed], ["Marked fixed, not checked" + (c.state === "OPEN" ? " (counted at close)" : ""), c.state === "OPEN" ? c.marked_fixed - c.filed : c.not_checked, "text-unsure"]]} /></div>
        </div>
        <div className="self-start"><SlotActions dep="canonical" id={c.scorecard_id} state={c.state} deadline={c.file_deadline} docs={c.docs_url} fixed={fixedSlots.map((s) => ({ finding_id: s.finding_id, title: s.title }))} /></div>
      </section>

      <section aria-labelledby="slots" className="mt-12">
        <h2 id="slots" className="t-h2">Every finding</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full t-small">
            <thead><tr className="border-b hair text-left text-ink-3"><th className="py-2 pr-3 font-normal">Finding</th><th className="py-2 pr-3 font-normal">Report says</th><th className="py-2 font-normal">Checks</th></tr></thead>
            <tbody>
              {slots.data.items.map((s) => (
                <tr key={s.index} className="border-b hair align-top">
                  <td className="py-3 pr-3">
                    <span className="mono">{s.finding_id}</span> <span className="text-ink-3">{severityOf(s.finding_id).label}</span>
                    <div className="mt-0.5 max-w-[52ch] text-ink-2 [overflow-wrap:anywhere]"><Title text={cleanTitle(s.title)} /></div>
                  </td>
                  <td className="py-3 pr-3 text-ink-2">{CLASS_WORDS[s.cls].word}</td>
                  <td className="py-3">
                    {s.cls !== "FIXED_MARKED" ? <span className="text-ink-3">—</span> : s.checks_n === 0 ? (
                      <span className="text-unsure">{s.outcome === "NOT_CHECKED" ? "Not checked" : "No check yet"}</span>
                    ) : (
                      <ul className="grid gap-1.5">
                        {s.checks.map((k) => (
                          <li key={k.check_id} className="flex flex-wrap items-center gap-2">
                            <Link href={`/checks/${k.check_id}`} className="no-underline"><Status kind={statusOf(k.state, k.verdict)} /></Link>
                            <span className="text-ink-3">#{k.check_id} · {CHAIN_NAMES[k.chain] ?? k.chain} <span className="mono">{short(k.address)}</span></span>
                          </li>
                        ))}
                        {s.checks_n > s.checks.length && <li className="text-ink-3">+{s.checks_n - s.checks.length} more</li>}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
