"use client";
import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@/components/WalletProvider";
import { WalletButton } from "@/components/WalletButton";
import { TxProgress } from "@/components/TxProgress";
import { sendWrite, type TxState } from "@/lib/tx";
import { readNow } from "@/lib/clientRead";
import { DEPLOYMENTS, SCORECARD_WINDOW_S } from "@/lib/deployments";
import { CLASS_WORDS, auditorName } from "@/lib/classes";
import { friendly } from "@/lib/errors";
import type { FindingClass, Scorecard } from "@/lib/types";

const EXAMPLES = [
  { label: "PoolTogether V5 · Sherlock", report: "https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/88298eacec6f178fd0b5f9f13e4605c58aa58072/README.md", docs: "https://raw.githubusercontent.com/GenerationSoftware/pt-dev-docs/9f3322e7280f2e91346cabfc2512046c6cfcd2a8/docs/deployments/optimism.md" },
  { label: "PoolTogether V5 · Code4rena", report: "https://raw.githubusercontent.com/code-423n4/2023-07-pooltogether-findings/ec193297735caa64d472a6d89ef7d77a7cb6196c/report.md", docs: "https://raw.githubusercontent.com/GenerationSoftware/pt-dev-docs/9f3322e7280f2e91346cabfc2512046c6cfcd2a8/docs/deployments/optimism.md" },
];
type Preview = { ok: true; auditor: string; protocol: string; items: [string, FindingClass, string][]; docs_owner_linked: boolean } | { ok: false; why: string };

export function ImportFlow() {
  const w = useWallet();
  const [report, setReport] = useState("");
  const [docs, setDocs] = useState("");
  const [pv, setPv] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const [made, setMade] = useState<number | null>(null);
  const address = DEPLOYMENTS.canonical.address;
  const busy = tx.phase !== "idle" && tx.phase !== "done" && tx.phase !== "failed";

  const preview = async () => {
    setLoading(true); setPv(null);
    try {
      const r = await fetch("/api/import-preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ report_url: report, docs_url: docs }) });
      setPv(await r.json());
    } catch { setPv({ ok: false, why: "PREVIEW_UNAVAILABLE" }); }
    setLoading(false);
  };
  const submit = async () => {
    if (!w.account) return;
    const before = Number((await readNow<{ total: number }>(address, "get_scorecards", [0, 1])).total);
    const o = await sendWrite(w.account, address, "import_report", [report.trim(), docs.trim()], 0n, setTx, async () => {
      const got = await readNow<{ total: number; items: Scorecard[] }>(address, "get_scorecards", [0, 1]);
      if (Number(got.total) > before) { setMade(got.items[0].scorecard_id); return true; }
      return false;
    });
    if (o.phase !== "done") setMade(null);
  };
  const counts = pv && pv.ok ? (["FIXED_MARKED", "ACKNOWLEDGED", "NOT_MITIGATED", "UNMARKED"] as FindingClass[]).map((k) => [k, pv.items.filter((x) => x[1] === k).length] as const) : [];

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <form className="sheet grid gap-4 p-5" onSubmit={(e) => { e.preventDefault(); void preview(); }}>
        <label className="grid gap-1 t-small">Pinned report (raw GitHub at a commit)
          <input className="field mono" value={report} onChange={(e) => { setReport(e.target.value); setPv(null); }} placeholder="https://raw.githubusercontent.com/sherlock-audit/…-judging/<sha>/README.md" required />
        </label>
        <label className="grid gap-1 t-small">Protocol docs (raw GitHub at a commit)
          <input className="field mono" value={docs} onChange={(e) => { setDocs(e.target.value); setPv(null); }} placeholder="https://raw.githubusercontent.com/<org>/<docs>/<sha>/…" required />
        </label>
        <p className="t-small text-ink-3">Sherlock: a <span className="mono">sherlock-audit/*-judging</span> README. Code4rena: <span className="mono">report.md</span> in a <span className="mono">code-423n4/*-findings</span> repository. The report must link at least one fix in the docs owner&apos;s GitHub account.</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((x) => <button type="button" key={x.label} className="btn btn-quiet btn-sm" onClick={() => { setReport(x.report); setDocs(x.docs); setPv(null); }}>{x.label}</button>)}
        </div>
        <div><button className="btn" disabled={loading}>{loading ? "Reading the report…" : "Preview every finding"}</button></div>
      </form>

      <div className="grid content-start gap-4">
        {pv && !pv.ok && <div className="sheet p-5"><h2 className="t-h3">The contract would refuse this import</h2><p className="t-small mt-1 text-ink-2">{friendly(pv.why)} <span className="mono text-ink-3">({pv.why})</span></p></div>}
        {pv && pv.ok && (
          <div className="sheet p-5">
            <h2 className="t-h3">{pv.items.length} findings · {auditorName(pv.auditor)}</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              {counts.map(([k, n]) => <div key={k} className="border-t hair pt-2"><dt className="t-small text-ink-3">{CLASS_WORDS[k].word}</dt><dd className="t-num text-[1.5rem]">{n}</dd></div>)}
            </dl>
            <p className="t-small mt-3 text-ink-3">Preview by this site with the contract&apos;s rules. On chain, every validator re-reads the report{pv.auditor === "sherlock" ? ", confirms each “fixed” status on GitHub’s issue page" : ""} and checks the commits; the counts above can only go down (a status GitHub doesn&apos;t confirm becomes “no status”).</p>
            {!pv.docs_owner_linked && <p className="t-small mt-2 text-bad">The report links no GitHub URL in the docs owner&apos;s account; the contract will refuse (PROTOCOL_NOT_IN_REPORT).</p>}
            <p className="t-small mt-2 text-ink-2">Filing stays open for {Math.round(SCORECARD_WINDOW_S / 3600)} hours after import. Importing pays only the network fee.</p>
            <div className="mt-4">{!w.account || !w.onRightNetwork ? <WalletButton /> : <button className="btn" disabled={busy} onClick={() => void submit()}>{busy ? "Importing…" : "Import the whole report"}</button>}</div>
            <TxProgress s={tx} deciding />
            {tx.phase === "done" && made && <p className="mt-3"><Link className="btn btn-sm" href={`/scorecards/${made}`}>Open scorecard #{made}</Link></p>}
          </div>
        )}
      </div>
    </div>
  );
}
