"use client";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/components/WalletProvider";
import { WalletButton } from "@/components/WalletButton";
import { TxProgress } from "@/components/TxProgress";
import { getReadClient, plain } from "@/lib/genlayer";
import { sendWrite, type TxState } from "@/lib/tx";
import { DEPLOYMENTS, type Deployment } from "@/lib/deployments";
import { gen } from "@/lib/format";

type Bal = { claimable_wei: string; withdrawn_wei: string };

function Row({ dep, account }: { dep: Deployment; account: `0x${string}` }) {
  const [b, setB] = useState<Bal | null>(null);
  const [err, setErr] = useState("");
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const load = useCallback(async () => {
    setErr("");
    try { setB(plain<Bal>(await getReadClient().readContract({ address: DEPLOYMENTS[dep].address, functionName: "balance_of", args: [account] }))); }
    catch { setErr("Studio Dev didn’t answer. Try again in a moment."); }
  }, [dep, account]);
  useEffect(() => { void load(); }, [load]);
  const busy = ["signing", "submitted", "validators"].includes(tx.phase);
  return (
    <div className="sheet p-5">
      <h2 className="t-h3">{DEPLOYMENTS[dep].label} deployment</h2>
      {err ? <p className="t-small mt-2" style={{ color: "var(--bad)" }}>{err} <button className="link" onClick={() => void load()}>Retry</button></p> : !b ? (
        <div className="skeleton mt-3 h-14" aria-busy="true" />
      ) : (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-4">
            <div><dt className="t-label">Withdrawable</dt><dd className="t-num mt-1 text-[2rem] leading-none">{gen(b.claimable_wei, 4)} <span className="t-small font-sans">GEN</span></dd></div>
            <div><dt className="t-label">Withdrawn so far</dt><dd className="t-num mt-1 text-[2rem] leading-none text-ink-2">{gen(b.withdrawn_wei, 4)} <span className="t-small font-sans">GEN</span></dd></div>
          </dl>
          {BigInt(b.claimable_wei) > 0n ? (
            <button className="btn mt-5" disabled={busy} onClick={async () => { const o = await sendWrite(account, DEPLOYMENTS[dep].address, "withdraw", [], 0n, setTx); if (o.phase === "done") void load(); }}>
              {busy ? "Withdrawing…" : `Withdraw ${gen(b.claimable_wei, 4)} GEN`}
            </button>
          ) : <p className="t-small mt-4 text-ink-2">Nothing to withdraw here. Winnings, refunds and refused stakes land in this balance.</p>}
          <TxProgress s={tx} />
        </>
      )}
    </div>
  );
}

export function BalancePanel() {
  const w = useWallet();
  if (!w.account) return <div className="sheet mt-8 p-6"><p className="text-ink-2">Connect a wallet to see what you can withdraw.</p><div className="mt-4"><WalletButton /></div></div>;
  if (!w.onRightNetwork) return <div className="sheet mt-8 p-6"><p className="text-ink-2">Your wallet is on another network. FixCheck runs on GenLayer Studio Dev.</p><div className="mt-4"><WalletButton /></div></div>;
  return <div className="mt-8 grid gap-4 md:grid-cols-2"><Row dep="canonical" account={w.account} /><Row dep="demo" account={w.account} /></div>;
}
