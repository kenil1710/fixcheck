"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "./WalletProvider";
import { WalletButton } from "./WalletButton";
import { TxProgress } from "./TxProgress";
import { sendWrite, type TxState } from "@/lib/tx";
import { DEPLOYMENTS, type Deployment } from "@/lib/deployments";
import { untilText } from "@/lib/format";

type Props = { dep: Deployment; checkId: number; state: string; counterDeadline: number; decideDeadline: number; challenger: string };

/** What can be done with this check right now: counter-stake, decide, or expire. */
export function StakeActions(p: Props) {
  const w = useWallet();
  const router = useRouter();
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [amount, setAmount] = useState("1");
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const [action, setAction] = useState<string>("");
  useEffect(() => { const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000); return () => clearInterval(t); }, []);

  if (p.state !== "OPEN") return null;
  const phase = now < p.counterDeadline ? "counter" : now < p.decideDeadline ? "decide" : "expire";
  const isChallenger = w.account?.toLowerCase() === p.challenger.toLowerCase();
  const busy = tx.phase !== "idle" && tx.phase !== "done" && tx.phase !== "failed";
  const run = async (fn: string, args: unknown[], value: bigint) => {
    if (!w.account) return;
    setAction(fn);
    const out = await sendWrite(w.account, DEPLOYMENTS[p.dep].address, fn, args, value, setTx);
    if (out.phase === "done") router.refresh();
  };
  let wei = 0n;
  try { wei = BigInt(Math.round(Number(amount) * 1e6)) * 10n ** 12n; } catch { wei = 0n; }
  const tooSmall = wei < 10n ** 17n;

  return (
    <div className="sheet p-5">
      {phase === "counter" && (
        <>
          <h3 className="t-h3">Think it is fixed? Stake on it.</h3>
          <p className="t-small mt-1 text-ink-2">Counter-staking closes in <strong className="text-ink">{untilText(p.counterDeadline, now)}</strong>. If the verdict is fixed, defenders get their stake back plus the challenger’s, pro rata. If not fixed, the challenger takes it. Inconclusive refunds everyone.</p>
          {!w.account || !w.onRightNetwork ? <div className="mt-4"><WalletButton /></div> : isChallenger ? (
            <p className="t-small mt-4 text-ink-2">You filed this check, so you can’t also stake that it’s fixed.</p>
          ) : (
            <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); void run("counter_stake", [p.checkId], wei); }}>
              <label className="grid gap-1 t-small">Stake (GEN)
                <input className="field w-32" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={tooSmall} aria-describedby="min-stake" />
              </label>
              <button className="btn" disabled={busy || tooSmall}>{busy && action === "counter_stake" ? "Staking…" : "Stake that it’s fixed"}</button>
              <span id="min-stake" className="t-label w-full">Minimum 0.1 GEN. Studio Dev GEN is free test currency.</span>
            </form>
          )}
        </>
      )}
      {phase === "decide" && (
        <>
          <h3 className="t-h3">Ready to decide</h3>
          <p className="t-small mt-1 text-ink-2">Counter-staking has closed. Anyone can ask validators to decide now; the window stays open for {untilText(p.decideDeadline, now)}.</p>
          {!w.account || !w.onRightNetwork ? <div className="mt-4"><WalletButton /></div> :
            <button className="btn mt-4" disabled={busy} onClick={() => void run("decide", [p.checkId], 0n)}>{busy ? "Deciding…" : "Decide this check"}</button>}
        </>
      )}
      {phase === "expire" && (
        <>
          <h3 className="t-h3">Nobody decided in time</h3>
          <p className="t-small mt-1 text-ink-2">The decide window has passed. Anyone can expire the check; every stake goes back to its owner.</p>
          {!w.account || !w.onRightNetwork ? <div className="mt-4"><WalletButton /></div> :
            <button className="btn btn-quiet mt-4" disabled={busy} onClick={() => void run("expire", [p.checkId], 0n)}>{busy ? "Expiring…" : "Expire and refund"}</button>}
        </>
      )}
      <TxProgress s={tx} deciding={action === "decide"} />
      {tx.phase === "done" && <p className="mt-3 t-small" style={{ color: "var(--fixed)" }}>Recorded. The page has been refreshed with the new state.</p>}
    </div>
  );
}
