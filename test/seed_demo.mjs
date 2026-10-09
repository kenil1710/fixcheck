/**
 * DEMO (90 s counter window, 300 s decide window): runs every path once on
 * real evidence. Resumable - every step first reads the chain.
 *
 *   D1 challenge WINS    PoolTogether M-17 on Ethereum (deployed after the fix existed, == audited) vs a defender
 *   D2 challenge LOSES   Mellow H-1 (deployed == fix) vs a defender
 *   D3 INCONCLUSIVE      PoolTogether M-19 `claimPrize` filed against the PrizePool
 *                        (listed in the docs, verified, but Claimable.sol is not in it)
 *   D4 NO-DEFENDER FEE   PoolTogether M-5 (deployed == fix), nobody defends
 *   D5 EXPIRY            Cap M-1 (Cap M-3 is the live round-3 proxy case, docs/DEPLOYED_VERIFICATION.md), never decided; expire() after the decide deadline
 *   D6 MODEL             Mellow M-5 (deployed function changed) decided by the model
 *   D7 REFUSAL           an unpinned report URL: refused, stake stays withdrawable
 *   D8 PREDATES AUDIT    PoolTogether M-9 on OP (deployed 2024-04-18, before the audit) vs a defender: refund
 *   D9 PREDATES FIX      PoolTogether M-16 on Arbitrum (deployed 2024-05-29, before its fix existed) vs a defender: refund
 *   then sweep_fees() and every withdraw()
 */
import { readFileSync, writeFileSync } from "node:fs";
import { CHAINS, accounts, fundOnStudio, connect, sleep } from "./harness.mjs";
const dep = JSON.parse(readFileSync(new URL("../deployments.json", import.meta.url), "utf8")).contracts;
const address = dep.FixCheckDemo.address;
const seeds = JSON.parse(readFileSync(new URL("../docs/research/seeds.json", import.meta.url), "utf8"));
const acc = accounts();
for (const r of ["demo_challenger", "demo_defender", "demo_trigger"]) await fundOnStudio(CHAINS.studiodev, acc[r].address, 1000n * 10n ** 18n);
const GEN = 10n ** 18n;
const ch = connect({ address, role: "demo_challenger" });
const df = connect({ address, role: "demo_defender" });
const tr = connect({ address, role: "demo_trigger" });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const find = (p, id, fn, chain) => seeds.find((s) => s.protocol.startsWith(p) && s.finding_id === id && s.function === fn && (!chain || s.chain === chain));
const PRIZEPOOL_OP = "0xF35fE10ffd0a9672d0095c435fd8767A7fe29B55";
const m19 = find("PoolTogether", "M-19", "claimPrize");
const PLAN = [
  { tag: "D1", s: find("PoolTogether", "M-17", "_convertToShares", "ethereum"), defend: 1n },
  { tag: "D2", s: find("Mellow", "H-1", "checkSignatures"), defend: 1n },
  { tag: "D3", s: { ...m19, chain: "optimism", address: PRIZEPOOL_OP, docs_url: seeds.find((s) => s.chain === "optimism" && s.protocol.startsWith("PoolTogether")).docs_url }, defend: 1n },
  { tag: "D4", s: find("PoolTogether", "M-5", "claimPrizes", "optimism") },
  { tag: "D5", s: find("Cap", "M-1", "liquidate"), expire: true },
  { tag: "D6", s: find("Mellow", "M-5", "cancelDepositRequest") },
  { tag: "D8", s: find("PoolTogether", "M-9", "liquidatableBalanceOf", "optimism"), defend: 1n },
  { tag: "D9", s: find("PoolTogether", "M-16", "maxDeposit", "arbitrum"), defend: 1n },
];
const state = {};
const idOf = async (s) => { const st = await tr.view("fix_status", [s.chain, s.address, s.report_url, s.finding_id]); return Number(st.open_check_id || st.check_id || 0); };

// A check whose decide window passed before this script reached it (an interrupted
// run) is expired, then the same evidence is filed again as a new check.
// Each case is filed, defended and decided before the next is filed, so every
// decide lands inside its 300 s window.
const decideOne = async (p, id) => {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const c = await tr.view("get_check", [id]);
    if (c.state !== "OPEN") { log(p.tag, "check", id, c.state, c.verdict, c.basis, c.model_votes, c.quote_lines); break; }
    const wait = Number(c.counter_deadline) + 8 - Date.now() / 1000;
    if (wait > 0) await sleep(wait * 1000);
    const o = await tr.send("decide", [id]);
    log(p.tag, "decide", id, o.status, o.ok, o.seconds?.toFixed(0) + "s", o.revertReason?.slice(0, 120) || "");
  }
};
for (const p of PLAN) {
  let id = await idOf(p.s);
  if (id && !p.expire) {
    const c = await tr.view("get_check", [id]);
    if (c.state === "OPEN" && Date.now() / 1000 > Number(c.decide_deadline)) {
      const o = await tr.send("expire", [id]);
      log(p.tag, "expire stale check", id, o.status, o.ok);
    }
    if ((await tr.view("get_check", [id])).state === "EXPIRED") id = 0;
  }
  if (!id) {
    const o = await ch.send("file_check", [p.s.report_url, p.s.finding_id, p.s.function, p.s.audited_url, p.s.fix_url, p.s.chain, p.s.address, p.s.docs_url], GEN);
    log(p.tag, "file", o.status, o.seconds?.toFixed(0) + "s", await ch.view("get_last_result", [ch.account.address]));
    id = await idOf(p.s);
  }
  state[p.tag] = id;
  if (p.defend && id) {
    const ds = await tr.view("get_defenders", [id]);
    const c = await tr.view("get_check", [id]);
    if (!ds.length && c.state === "OPEN" && Date.now() / 1000 < Number(c.counter_deadline) - 20) {
      const o = await df.send("counter_stake", [id], p.defend * GEN);
      log(p.tag, "counter-stake", o.status, await df.view("get_last_result", [df.account.address]));
    }
  }
  if (id && !p.expire) await decideOne(p, id);
}
// D7 refusal
const r = await ch.send("file_check", [PLAN[0].s.report_url.replace(/\/[0-9a-f]{40}\//, "/main/"), PLAN[0].s.finding_id, PLAN[0].s.function, PLAN[0].s.audited_url, PLAN[0].s.fix_url, PLAN[0].s.chain, PLAN[0].s.address, PLAN[0].s.docs_url], GEN);
log("D7 refusal", r.status, await ch.view("get_last_result", [ch.account.address]));
// D5 expiry
{
  const id = state.D5;
  const c = await tr.view("get_check", [id]);
  if (c.state === "OPEN") {
    const wait = Number(c.decide_deadline) + 8 - Date.now() / 1000;
    if (wait > 0) { log("D5 waiting", wait.toFixed(0), "s for the decide deadline"); await sleep(wait * 1000); }
    const o = await tr.send("expire", [id]);
    log("D5 expire", id, o.status, o.ok, o.revertReason?.slice(0, 120) || "");
  }
  const c2 = await tr.view("get_check", [id]);
  log("D5 check", id, c2.state, c2.basis);
}
const led0 = await tr.view("get_ledger");
if (BigInt(led0.fees_wei) > 0n) log("sweep_fees", (await tr.send("sweep_fees", [])).status);
for (const [name, c] of [["demo_challenger", ch], ["demo_defender", df], ["deployer(fee recipient)", connect({ address, role: "deployer" })]]) {
  const b = await c.view("balance_of", [c.account.address]);
  if (BigInt(b.claimable_wei) > 0n) {
    const o = await c.send("withdraw", []);
    log("withdraw", name, b.claimable_wei, o.status, o.ok);
    const o2 = await c.send("withdraw", []);
    log("withdraw again", name, o2.ok ? "PAID TWICE?!" : "refused: " + o2.revertReason?.slice(0, 60));
  }
}
const out = { contract: address, plan: Object.fromEntries(PLAN.map((p) => [p.tag, state[p.tag]])), checks: await tr.view("get_checks", [0, 50]),
  stats: await tr.view("get_stats"), ledger: await tr.view("get_ledger") };
writeFileSync(new URL("../docs/seed-demo.json", import.meta.url), JSON.stringify(out, null, 2));
log("stats", JSON.stringify(out.stats), "ledger", JSON.stringify(out.ledger));
