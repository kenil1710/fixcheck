import Link from "next/link";
import { getCheckCode, getChecks, getProtocols, getStats } from "@/lib/reads";
import { Tally } from "@/components/Tally";
import { Specimen } from "@/components/Specimen";
import { ProtocolCard } from "@/components/ProtocolCard";
import { Busy } from "@/components/Busy";
import type { Check } from "@/lib/types";

export const revalidate = 30;

/** The specimen: a decided NOT_FIXED code match with a fix commit, preferring a short function. */
function pickSpecimen(items: Check[]): Check | undefined {
  // code facts are fixed at filing: deployed == audited, and a fix exists
  const pool = items.filter((c) => c.state !== "EXPIRED" && c.fix_commit && c.dep_status === "OK" && c.dep_canon_sha256 === c.aud_canon_sha256);
  return pool.find((c) => c.function === "maxDeposit") ?? pool[0];
}

export default async function Home() {
  const [stats, protocols, checks] = await Promise.all([getStats(), getProtocols(), getChecks()]);
  if (!stats.ok || !protocols.ok || !checks.ok) return <Busy what="the scorecard" />;
  const s = stats.data;
  const items = checks.data.items;
  const spec = pickSpecimen(items);
  const code = spec ? await getCheckCode(spec.check_id) : null;
  const unsure = s.inconclusive + s.expired;

  return (
    <>
      <section className="grid items-start gap-12 pt-14 pb-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-20">
        <div>
          <h1 className="t-display max-w-[13ch]">The audit says it was fixed. Is the fix deployed?</h1>
          <p className="t-lede mt-6 max-w-[54ch]">
            Audit reports end with a list of findings marked “Fixed”. FixCheck reads the report, the code the auditors saw, the fix, and the verified code on chain — and checks whether the fixed function is what’s actually running.
          </p>

          <div className="mt-10" aria-label="Scorecard, read from the contract">
            <dl className="grid grid-cols-2 border-t hair sm:grid-cols-4">
              {[
                [s.checks, "findings marked Fixed", "text-ink"],
                [s.fixed, "confirmed in deployed code", "text-fixed"],
                [s.not_fixed, "not in deployed code", "text-bad"],
                [unsure, "inconclusive", "text-unsure"],
              ].map(([n, label, cls], i) => (
                <div key={String(label)} className={`border-b hair py-4 pr-4 ${i % 2 === 1 ? "pl-4 border-l sm:pl-4" : ""} ${i === 2 ? "sm:border-l sm:pl-4" : ""}`}>
                  <dd className={`t-num text-[2.6rem] leading-none font-medium ${cls}`}><Tally value={Number(n)} /></dd>
                  <dt className="t-small mt-2 text-ink-2">{label}</dt>
                </div>
              ))}
            </dl>
            {s.open > 0 && <p className="t-small mt-3 text-ink-3">{s.open} of them {s.open === 1 ? "is" : "are"} still inside the counter-stake window; verdicts land when it closes.</p>}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/protocols" className="btn">Browse protocols</Link>
            <Link href="/check" className="btn btn-quiet">Check a finding</Link>
          </div>
        </div>

        {spec && code?.ok ? <Specimen check={spec} code={code.data} /> : null}
      </section>

      <section aria-labelledby="how" className="border-t hair py-14">
        <h2 id="how" className="t-h2">How a finding gets checked</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {[
            ["Point at the evidence", "A pinned audit report, the finding, the function it names, the audited commit and the fix — plus the protocol’s own page listing the deployed address."],
            ["Validators read it all", "Each GenLayer validator fetches every source itself, pulls the function out of the audited, fixed and deployed code, and they must agree byte for byte."],
            ["Code decides first", "Identical to the fix: fixed. Identical to the audited code: not fixed. Only when it’s neither does a model weigh in — and it must quote real deployed lines."],
          ].map(([t, d], i) => (
            <li key={t} className="grid grid-cols-[2.25rem_1fr] gap-x-3">
              <span className="t-num text-[1.6rem] leading-none text-ink-3" aria-hidden="true">{i + 1}</span>
              <div>
                <h3 className="t-h3">{t}</h3>
                <p className="mt-2 text-ink-2">{d}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-8"><Link className="link" href="/how-it-works">What the model never decides</Link></p>
      </section>

      <section aria-labelledby="protocols" className="border-t hair py-14">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="protocols" className="t-h2">Protocols checked so far</h2>
          <Link className="link t-small" href="/checks">Every check, newest first</Link>
        </div>
        {protocols.data.length === 0 ? (
          <p className="mt-6 text-ink-2">No protocol has been checked yet. <Link className="link" href="/check">Check the first finding</Link>.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {protocols.data.map((p) => <ProtocolCard key={p.protocol} p={p} checks={items} />)}
          </div>
        )}
      </section>
    </>
  );
}
