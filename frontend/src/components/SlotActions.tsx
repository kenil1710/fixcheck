"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "./WalletProvider";
import { WalletButton } from "./WalletButton";
import { TxProgress } from "./TxProgress";
import { sendWrite, type TxState } from "@/lib/tx";
import { readNow } from "@/lib/clientRead";
import { DEPLOYMENTS, type Deployment } from "@/lib/deployments";
import { untilText } from "@/lib/format";
import { cleanTitle } from "@/lib/classes";

type Fixed = { finding_id: string; title: string };

/** File a check into a slot of an open scorecard, or close it after its deadline. */
export function SlotActions({ dep, id, state, deadline, fixed, docs }: { dep: Deployment; id: number; state: string; deadline: number; fixed: Fixed[]; docs: string }) {
  const w = useWallet();
  const router = useRouter();
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const [f, setF] = useState({ finding_id: fixed[0]?.finding_id ?? "", function_name: "", audited_url: "", fix_url: "", chain: "ethereum", address: "", docs_url: docs, stake: "1" });
  useEffect(() => { const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000); return () => clearInterval(t); }, []);
  const address = DEPLOYMENTS[dep].address;
  const busy = tx.phase !== "idle" && tx.phase !== "done" && tx.phase !== "failed";
  if (state !== "OPEN") return null;
  const open = now < deadline;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  let wei = 0n;
  try { wei = BigInt(Math.round(Number(f.stake) * 1e6)) * 10n ** 12n; } catch { wei = 0n; }

  if (!open) {
    return (
      <div className="sheet p-5">
        <h3 className="t-h3">Filing has closed</h3>
        <p className="t-small mt-1 text-ink-2">Anyone can close the scorecard now: every slot marked fixed with no check is counted as not checked.</p>
        {!w.account || !w.onRightNetwork ? <div className="mt-4"><WalletButton /></div> : (
          <button className="btn mt-4" disabled={busy} onClick={async () => {
            const o = await sendWrite(w.account!, address, "close_scorecard", [id], 0n, setTx,
              async () => (await readNow<{ state: string }>(address, "get_scorecard", [id])).state === "CLOSED");
            if (o.phase === "done") router.refresh();
          }}>{busy ? "Closing…" : "Close the scorecard"}</button>
        )}
        <TxProgress s={tx} deciding />
      </div>
    );
  }
  return (
    <div className="sheet p-5">
      <h3 className="t-h3">File a check into a slot</h3>
      <p className="t-small mt-1 text-ink-2">Filing is open for <strong className="text-ink">{untilText(deadline, now)}</strong>. A slot takes any deployment the protocol lists, each once; every check is counted. The contract applies every filing rule (pinned files, the fix from the auditor&apos;s own status, the docs listing the address).</p>
      {!w.account || !w.onRightNetwork ? <div className="mt-4"><WalletButton /></div> : (
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={async (e) => {
          e.preventDefault();
          const before = Number((await readNow<{ total: number }>(address, "get_checks", [0, 1])).total);
          const o = await sendWrite(w.account!, address, "file_slot",
            [id, f.finding_id, f.function_name.trim(), f.audited_url.trim(), f.fix_url.trim(), f.chain, f.address.trim(), f.docs_url.trim()], wei, setTx,
            async () => Number((await readNow<{ total: number }>(address, "get_checks", [0, 1])).total) > before);
          if (o.phase === "done") router.refresh();
        }}>
          <label className="grid gap-1 t-small">Finding (marked fixed)
            <select className="field" value={f.finding_id} onChange={set("finding_id")}>
              {fixed.map((x) => <option key={x.finding_id} value={x.finding_id}>{x.finding_id} — {cleanTitle(x.title).replace(/`/g, "").slice(0, 60)}</option>)}
            </select>
          </label>
          <label className="grid gap-1 t-small">Function named in the finding<input className="field mono" value={f.function_name} onChange={set("function_name")} placeholder="claimPrizes" required /></label>
          <label className="grid gap-1 t-small sm:col-span-2">Audited file (raw GitHub at a commit)<input className="field mono" value={f.audited_url} onChange={set("audited_url")} required /></label>
          <label className="grid gap-1 t-small sm:col-span-2">Fix file (head of the PR the auditor links)<input className="field mono" value={f.fix_url} onChange={set("fix_url")} required /></label>
          <label className="grid gap-1 t-small">Chain
            <select className="field" value={f.chain} onChange={set("chain")}>{["ethereum", "optimism", "base", "arbitrum", "polygon"].map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label className="grid gap-1 t-small">Deployed address<input className="field mono" value={f.address} onChange={set("address")} placeholder="0x…" required /></label>
          <label className="grid gap-1 t-small sm:col-span-2">Docs page listing it (any pinned page of this protocol&apos;s docs repo)<input className="field mono" value={f.docs_url} onChange={set("docs_url")} required /></label>
          <label className="grid gap-1 t-small">Stake (GEN, min 0.1)<input className="field w-32" inputMode="decimal" value={f.stake} onChange={set("stake")} /></label>
          <div className="flex items-end"><button className="btn" disabled={busy || wei < 10n ** 17n}>{busy ? "Filing…" : "Stake and file"}</button></div>
        </form>
      )}
      <TxProgress s={tx} />
    </div>
  );
}
