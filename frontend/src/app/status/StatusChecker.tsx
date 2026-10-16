"use client";
import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@/components/WalletProvider";
import { WalletButton } from "@/components/WalletButton";
import { TxProgress } from "@/components/TxProgress";
import { Status } from "@/components/Status";
import { sendWrite, type TxState } from "@/lib/tx";
import { readNow } from "@/lib/clientRead";
import { FIXGATE_ADDRESS } from "@/lib/deployments";

type Answer = { status: string; is_fixed: boolean; unsafe: boolean; check_id: number; basis: string; decided_at: number; open_check_id: number; read_at: string } | { error: string };
const EXAMPLES = [
  { label: "Not fixed (Ethereum vault)", finding: "https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/88298eacec6f178fd0b5f9f13e4605c58aa58072/README.md#M-17", chain: "ethereum", address: "0x9ee31e845ff1358bf6b1f914d3918c6223c75573" },
  { label: "Fixed (OP claimer)", finding: "https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/88298eacec6f178fd0b5f9f13e4605c58aa58072/README.md#M-5", chain: "optimism", address: "0x220c9398b0ee07472bf8906e44574cb9fe3b8d90" },
];
const kindOf = (s: string) => s === "FIXED" ? "FIXED" : s === "NOT_FIXED" ? "NOT_FIXED" : s === "REGRESSED" ? "REGRESSED" : s === "PREDATES_AUDIT" ? "PREDATES" : s === "PREDATES_FIX" ? "PREDATES_FIX" : s === "OPEN" ? "OPEN" : "INCONCLUSIVE";

export function StatusChecker() {
  const w = useWallet();
  const [f, setF] = useState({ finding: "", chain: "ethereum", address: "" });
  const [a, setA] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(false);
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const [gate, setGate] = useState<{ result: string; why: string } | null>(null);
  const busy = tx.phase !== "idle" && tx.phase !== "done" && tx.phase !== "failed";
  const ask = async () => {
    setLoading(true); setA(null); setGate(null); setTx({ phase: "idle" });
    const q = new URLSearchParams({ finding: f.finding.trim(), chain: f.chain, address: f.address.trim() });
    try { setA(await (await fetch(`/api/fixcheck?${q}`, { cache: "no-store" })).json()); } catch { setA({ error: "The API could not be reached." }); }
    setLoading(false);
  };
  const interact = async () => {
    if (!w.account) return;
    const before = Number((await readNow<{ calls: number }>(FIXGATE_ADDRESS, "get_stats")).calls);
    await sendWrite(w.account, FIXGATE_ADDRESS, "interact", [f.finding.trim(), f.chain, f.address.trim()], 0n, setTx, async () => {
      const s = await readNow<{ calls: number }>(FIXGATE_ADDRESS, "get_stats");
      if (Number(s.calls) <= before) return false;
      const last = await readNow<{ items: { result: string; why: string }[] }>(FIXGATE_ADDRESS, "get_calls", [0, 1]);
      setGate(last.items[0]);
      return true;
    });
  };
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <form className="sheet grid gap-4 p-5" onSubmit={(e) => { e.preventDefault(); void ask(); }}>
        <label className="grid gap-1 t-small">Finding (<span className="mono">&lt;pinned report url&gt;#&lt;id&gt;</span>)
          <input className="field mono" value={f.finding} onChange={(e) => setF({ ...f, finding: e.target.value })} required />
        </label>
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <label className="grid gap-1 t-small">Chain
            <select className="field" value={f.chain} onChange={(e) => setF({ ...f, chain: e.target.value })}>{["ethereum", "optimism", "base", "arbitrum", "polygon"].map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label className="grid gap-1 t-small">Deployed address<input className="field mono" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="0x…" required /></label>
        </div>
        <div className="flex flex-wrap gap-2">{EXAMPLES.map((x) => <button key={x.label} type="button" className="btn btn-quiet btn-sm" onClick={() => { setF({ finding: x.finding, chain: x.chain, address: x.address }); setA(null); }}>{x.label}</button>)}</div>
        <div><button className="btn" disabled={loading}>{loading ? "Reading the chain…" : "Ask FixStatus"}</button></div>
      </form>
      <div className="grid content-start gap-4">
        {a && "error" in a && <div className="sheet p-5 t-small" role="alert">{a.error}</div>}
        {a && !("error" in a) && (
          <div className="sheet p-5">
            <p className="t-label">FixStatus.status() · read {new Date(a.read_at).toUTCString()}</p>
            <div className="mt-3 flex items-center gap-3">
              {a.status === "UNCHECKED" || a.status === "UNKNOWN" ? <span className="t-h3">{a.status === "UNCHECKED" ? "Never checked" : "Unknown"}</span> : <Status kind={kindOf(a.status)} large />}
              <span className="t-small text-ink-3">is_fixed = <span className="mono">{String(a.is_fixed)}</span></span>
            </div>
            {a.check_id > 0 && <p className="t-small mt-2">Latest decided check: <Link className="link" href={`/checks/${a.check_id}`}>#{a.check_id}</Link>{a.basis && <> · <span className="mono">{a.basis}</span></>}</p>}
            {a.open_check_id > 0 && <p className="t-small mt-1 text-ink-2">Check <Link className="link" href={`/checks/${a.open_check_id}`}>#{a.open_check_id}</Link> is open on it now.</p>}
            <div className="mt-5 border-t hair pt-4">
              <h3 className="t-h3">Ask FixGate to interact</h3>
              <p className="t-small mt-1 text-ink-2">A write: FixGate reads FixStatus inside the transaction and records <strong>Refused</strong> for Not fixed or Regressed (and when FixStatus can&apos;t be read), <strong>Allowed</strong> otherwise.</p>
              <div className="mt-3">{!w.account || !w.onRightNetwork ? <WalletButton /> : <button className="btn btn-sm" disabled={busy} onClick={() => void interact()}>{busy ? "Asking…" : "Call FixGate.interact()"}</button>}</div>
              <TxProgress s={tx} />
              {gate && tx.phase === "done" && <p className={`t-small mt-3 font-medium ${gate.result === "REFUSED" ? "text-bad" : "text-fixed"}`}>FixGate recorded: {gate.result} ({gate.why})</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
