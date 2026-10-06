"use client";
import Link from "next/link";
import { useWallet } from "./WalletProvider";
import { short } from "@/lib/format";

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const w = useWallet();
  if (!w.hasWallet) {
    return <a className="btn btn-quiet btn-sm" href="https://metamask.io/download/" target="_blank" rel="noreferrer">Get a wallet</a>;
  }
  if (!w.account) {
    return <button type="button" className="btn btn-quiet btn-sm" onClick={() => void w.connect()} disabled={w.connecting}>{w.connecting ? "Connecting…" : "Connect wallet"}</button>;
  }
  if (!w.onRightNetwork) {
    return <button type="button" className="btn btn-sm" style={{ background: "var(--unsure)", borderColor: "var(--unsure)", color: "var(--sheet)" }} onClick={() => void w.switchNetwork()}>Switch to Studio Dev</button>;
  }
  return (
    <Link href="/balance" className="btn btn-quiet btn-sm mono" title="Your balance">
      <span className="h-2 w-2 rounded-full" style={{ background: "var(--fixed)" }} aria-hidden="true" />
      {compact ? short(w.account, 4, 3) : short(w.account)}
      <span className="sr-only">, connected to Studio Dev. Open your balance.</span>
    </Link>
  );
}
