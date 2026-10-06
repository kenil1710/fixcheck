import Link from "next/link";
import type { Metadata } from "next";
import { getChecks } from "@/lib/reads";

export const revalidate = 60;

export const metadata: Metadata = { title: "How it works", description: "What FixCheck checks, what code decides and what the model never decides." };

const CODE = [
  "Whether every link is pinned to a commit or a timestamped snapshot",
  "Fetching every source — each validator does it itself — and hashing every byte",
  "Whether the finding is in the report, marked fixed, and names the function",
  "Whether the protocol’s own docs list the address",
  "Whether the contract is verified, and following a proxy to its implementation",
  "Pulling the function out of the audited, fixed and deployed code, comments removed",
  "Identical to the fix → fixed. Identical to the audited code → not fixed",
  "Holds every line the fix added and none it removed → fixed",
  "Missing, renamed or overloaded function → inconclusive, everyone refunded",
  "That every line the model quotes is really in the deployed function — and points at what the fix changed",
  "That two answers from the model agree — otherwise inconclusive",
  "Deadlines, duplicates, every stake and every payout",
];
const MODEL = [
  "Only when the deployed function matches neither the audited nor the fixed version",
  "It sees the finding’s text, what the fix commit changed in this function, and the deployed function — nothing else",
  "It answers fixed, not fixed or inconclusive, and must quote deployed lines",
  "Its words are never stored: only the answer, the reason code and which lines it quoted",
];

export default async function How() {
  const res = await getChecks();
  const decided = res.ok ? res.data.items.filter((c) => c.state === "DECIDED") : [];
  const byModel = decided.filter((c) => c.basis.startsWith("MODEL_")).length;
  const byCode = decided.length - byModel;
  return (
    <div className="pt-12">
      <h1 className="t-h1 max-w-[20ch]">How FixCheck decides</h1>
      <p className="t-lede mt-4 max-w-[62ch]">An audit report is a promise about code someone reviewed. FixCheck compares that promise with the code that’s actually running, one finding at a time, on GenLayer — where several independent validators have to reach the same answer.</p>

      <section aria-labelledby="split" className="mt-14">
        <h2 id="split" className="t-h2">What the model never decides</h2>
        <div className="mt-6 grid items-start gap-6 md:grid-cols-2">
          <div className="sheet p-6">
            <h3 className="t-h3">Code decides</h3>
            <ul className="mt-4 grid gap-2.5">{CODE.map((x) => <li key={x} className="grid grid-cols-[1.1rem_1fr] gap-2"><span aria-hidden="true" style={{ color: "var(--fixed)" }}>✓</span><span>{x}</span></li>)}</ul>
          </div>
          <div className="sheet p-6">
            <h3 className="t-h3">The model weighs in, narrowly</h3>
            <ul className="mt-4 grid gap-2.5">{MODEL.map((x) => <li key={x} className="grid grid-cols-[1.1rem_1fr] gap-2"><span aria-hidden="true" className="text-ink-3">–</span><span>{x}</span></li>)}</ul>
            {decided.length > 0 && <p className="t-small mt-5 border-t hair pt-4 text-ink-2">Of the {decided.length} real findings decided on the canonical contract, code alone decided {byCode}; the model was asked about {byModel}, each twice.</p>}
          </div>
        </div>
      </section>

      <section aria-labelledby="flow" className="mt-16">
        <h2 id="flow" className="t-h2">A check, start to finish</h2>
        <ol className="mt-6 grid gap-6">
          {[
            ["File", "A challenger stakes that the fix is not in the deployed code and points at the evidence. Validators fetch it all; if anything is unpinned, unreadable, unlisted or unverified, the filing is refused and the stake stays in the challenger’s balance."],
            ["Counter-stake", "For a fixed window (one hour on the canonical contract), anyone else can stake that it is fixed."],
            ["Decide", "After the window, anyone can ask validators to decide. Code compares the functions; the model is consulted only if they differ from both versions."],
            ["Pay out", "Not fixed: the challenger takes every defender’s stake. Fixed: defenders split the challenger’s stake; with no defender, the challenger gets it back minus a 2% fee. Inconclusive: everyone refunded."],
            ["Withdraw", "Payouts sit in your balance until you withdraw. If nobody decides before the deadline, anyone can expire the check and every stake goes back."],
          ].map(([t, d], i) => (
            <li key={t} className="grid grid-cols-[2.25rem_1fr] gap-x-3 border-t hair pt-5">
              <span className="t-num text-[1.5rem] leading-none text-ink-3" aria-hidden="true">{i + 1}</span>
              <div><h3 className="t-h3">{t}</h3><p className="mt-1.5 max-w-[66ch] text-ink-2">{d}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="limits" className="mt-16">
        <h2 id="limits" className="t-h2">What a verdict means — and doesn’t</h2>
        <ul className="mt-5 grid max-w-[70ch] gap-3 text-ink-2">
          <li><strong className="text-ink">“Not fixed” is a code fact,</strong> not an exploit claim: the deployed function is the one the auditors reviewed. Whether it can be exploited depends on how the contract is configured.</li>
          <li><strong className="text-ink">One function per finding.</strong> If a fix lives in a different function than the one the finding names, the model is told to answer inconclusive.</li>
          <li><strong className="text-ink">Comments and whitespace are ignored;</strong> a renamed variable is a change and goes to the model.</li>
          <li><strong className="text-ink">Verified source comes from one public explorer per chain</strong> (Blockscout for Ethereum and OP Mainnet, Sourcify for Base, Arbitrum and Polygon).</li>
        </ul>
        <p className="mt-6"><Link className="link" href="https://github.com/kenil1710/fixcheck/blob/main/docs/THREAT_MODEL.md">Threat model</Link> · <Link className="link" href="https://github.com/kenil1710/fixcheck/blob/main/docs/RESEARCH.md">Research notes</Link></p>
      </section>
    </div>
  );
}
