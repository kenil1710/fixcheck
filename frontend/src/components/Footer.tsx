import Link from "next/link";
import { DEPLOYMENTS, REGISTRY_ADDRESS, COMMIT, EXPLORER } from "@/lib/deployments";
import { Mark } from "./Logo";

export function Footer() {
  const rows = [
    ["FixCheck (canonical)", DEPLOYMENTS.canonical.address],
    ["FixCheck (demo, short windows)", DEPLOYMENTS.demo.address],
    ["FixRegistry (read-only)", REGISTRY_ADDRESS],
  ];
  return (
    <footer className="mt-24 border-t hair">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_1.4fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5"><Mark size={22} /><span className="font-serif text-lg font-semibold">FixCheck</span></div>
          <p className="t-small mt-3 text-ink-2">Checks, finding by finding, whether the fix an audit report lists is in the code deployed on chain. Runs on GenLayer Studio Dev; every verdict is a contract state you can read yourself.</p>
          <p className="t-small mt-3 flex flex-wrap gap-x-4 gap-y-1">
            <Link className="link" href="/how-it-works">How it works</Link>
            <a className="link" href="https://github.com/kenil1710/fixcheck">Source on GitHub</a>
            <Link className="link" href="/balance">Balance</Link>
          </p>
        </div>
        <dl className="t-small grid gap-3">
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-0.5 sm:grid-cols-[13rem_1fr]">
              <dt className="text-ink-3">{k}</dt>
              <dd className="mono break-all"><a className="link" href={`${EXPLORER}/address/${v}`}>{v}</a></dd>
            </div>
          ))}
          <div className="grid gap-0.5 sm:grid-cols-[13rem_1fr]">
            <dt className="text-ink-3">Deployed from commit</dt>
            <dd className="mono break-all"><a className="link" href={`https://github.com/kenil1710/fixcheck/commit/${COMMIT}`}>{COMMIT}</a></dd>
          </div>
        </dl>
      </div>
    </footer>
  );
}
