import type { Metadata } from "next";
import { BalancePanel } from "./BalancePanel";
import { getLedger } from "@/lib/reads";
import { gen } from "@/lib/format";

export const revalidate = 30;
export const metadata: Metadata = { title: "Balance", description: "Withdraw winnings and refunds, and see the contract’s books." };

export default async function Balance() {
  const led = await getLedger();
  return (
    <div className="pt-12">
      <h1 className="t-h1">Balance</h1>
      <p className="t-lede mt-3 max-w-[60ch]">Payouts are never pushed to you: verdicts credit your balance here, and you withdraw when you like. A balance is zeroed before the transfer is sent, so it can’t be paid twice.</p>
      <BalancePanel />
      <section aria-labelledby="books" className="mt-14">
        <h2 id="books" className="t-h2">The contract’s books</h2>
        {led.ok ? (
          <>
            <p className="t-small mt-2 max-w-[62ch] text-ink-2">Every wei the canonical contract holds is either staked on an open check, withdrawable by someone, or a fee waiting to be swept to its frozen recipient. Checked after every transaction in the test suite; live here:</p>
            <div className="plate mt-5 overflow-x-auto p-5">
              <p className="mono text-[0.95rem] whitespace-nowrap">
                {gen(led.data.balance_wei, 4)} <span className="text-ink-3">=</span> {gen(led.data.open_stakes_wei, 4)} <span className="text-ink-3">+</span> {gen(led.data.claimable_wei, 4)} <span className="text-ink-3">+</span> {gen(led.data.fees_wei, 4)} GEN
              </p>
              <p className="t-small mt-2 text-ink-2">balance = open stakes + withdrawable + fees · <span style={{ color: led.data.invariant_holds ? "var(--fixed)" : "var(--bad)" }}>{led.data.invariant_holds ? "holds" : "does not hold"}</span></p>
            </div>
          </>
        ) : <p className="mt-3 text-ink-2">Studio Dev didn’t answer; the books will show on reload.</p>}
      </section>
    </div>
  );
}
