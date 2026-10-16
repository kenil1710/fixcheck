import Link from "next/link";
import type { Metadata } from "next";
import { getAuditors, getProtocols, getScorecards } from "@/lib/reads";
import { protocolMeta } from "@/lib/catalog";
import { auditorName } from "@/lib/classes";
import { Counts } from "@/components/Counts";
import { Busy } from "@/components/Busy";

export const revalidate = 30;
export const metadata: Metadata = { title: "By auditor and protocol", description: "Exact on-chain counts per auditor and per protocol." };

export default async function Auditors() {
  const [auditors, protocols, cards] = await Promise.all([getAuditors(), getProtocols(), getScorecards()]);
  if (!auditors.ok || !protocols.ok || !cards.ok) return <Busy what="the summaries" />;
  return (
    <div className="pt-12">
      <h1 className="t-h1">By auditor and protocol</h1>
      <p className="t-lede mt-3 max-w-[62ch]">Exact counts, each a counter the contract stores and updates when a check is filed or decided. No number here is computed by this site.</p>

      <section aria-labelledby="aud" className="mt-10">
        <h2 id="aud" className="t-h2">Per auditor</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {auditors.data.map((a) => {
            const mine = cards.data.items.filter((c) => c.auditor === a.auditor);
            return (
              <div key={a.auditor} id={a.auditor} className="sheet scroll-mt-24 p-5">
                <h3 className="t-h3">{auditorName(a.auditor)}</h3>
                <p className="t-small mt-1 text-ink-2">{a.scorecards} whole-report {a.scorecards === 1 ? "scorecard" : "scorecards"}{mine.length > 0 && ": "}{mine.map((c, i) => <span key={c.scorecard_id}>{i > 0 && ", "}<Link className="link" href={`/scorecards/${c.scorecard_id}`}>{protocolMeta(c.protocol).name}</Link></span>)}</p>
                <div className="mt-3"><Counts s={a} /></div>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="pro" className="mt-12">
        <h2 id="pro" className="t-h2">Per protocol</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {protocols.data.map((p) => {
            const m = protocolMeta(p.protocol);
            return (
              <div key={p.protocol} className="sheet p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="t-h3"><Link className="link" href={`/protocols/${m.slug}`}>{m.name}</Link></h3>
                  {/* eslint-disable-next-line @next/next/no-img-element -- live SVG from /badge, no optimisation wanted */}
                  <img src={`/badge/${m.slug}.svg`} alt={`FixCheck badge for ${m.name}`} height={20} className="h-5 w-auto" />
                </div>
                <div className="mt-3"><Counts s={p} /></div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
