import type { Metadata } from "next";
import { StatusChecker } from "./StatusChecker";
import { FIXGATE_ADDRESS, FIXSTATUS_ADDRESS, EXPLORER } from "@/lib/deployments";

export const metadata: Metadata = { title: "FixStatus checker", description: "Ask the chain whether a finding is fixed on a deployment, as any contract would." };

export default function StatusPage() {
  return (
    <div className="pt-12">
      <h1 className="t-h1">FixStatus checker</h1>
      <p className="t-lede mt-3 max-w-[64ch]">
        The question a lending market, an insurer or a wallet asks before trusting a deployment. <a className="link mono" href={`${EXPLORER}/address/${FIXSTATUS_ADDRESS}`}>FixStatus</a> answers <span className="mono">is_fixed(finding, chain, address)</span> by reading FixCheck on chain; <a className="link mono" href={`${EXPLORER}/address/${FIXGATE_ADDRESS}`}>FixGate</a> is a demo contract that refuses to interact when the answer is Not fixed or Regressed.
      </p>
      <StatusChecker />
      <section className="mt-12 max-w-[70ch]" aria-labelledby="api">
        <h2 id="api" className="t-h2">Public API and badge</h2>
        <p className="t-small mt-2 text-ink-2">Both read the chain for every request; nothing is served from a cache.</p>
        <pre className="sheet mt-3 overflow-x-auto p-4 t-small mono">GET /api/fixcheck?finding=&lt;pinned report url&gt;%23&lt;finding id&gt;&amp;chain=optimism&amp;address=0x…
GET /badge/pooltogether.svg</pre>
      </section>
    </div>
  );
}
