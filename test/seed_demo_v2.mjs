/**
 * DEMO v2 (90 s counter, 300 s decide, 600 s scorecard filing): every path once
 * on real evidence, every transaction hash recorded in docs/seed-demo.json.
 * Resumable - every step first reads the chain.
 *
 *   S0 IMPORT            PoolTogether's Sherlock report as a whole-report scorecard (22 findings)
 *   D1 NOT FIXED         PoolTogether M-17 on Ethereum, filed into the scorecard slot, vs a defender: challenger wins
 *   D4 FIXED, no defence PoolTogether M-5 on OP, filed into its slot: challenger refunded minus the 2% fee
 *   D8 PREDATES AUDIT    PoolTogether M-9 on OP, into its slot, vs a defender: refund
 *   D9 PREDATES FIX      PoolTogether M-16 on Arbitrum, into its slot, vs a defender: refund
 *   D2 FIXED vs defender Mellow H-1: defender takes the challenger's stake
 *   D3 INCONCLUSIVE      PoolTogether M-19 `claimPrize` against the OP PrizePool (function not in that contract)
 *   D6 MODEL             Mellow M-5 (deployed function changed) decided by the model
 *   D10 CODE4RENA        PoolTogether C4 2023-07 H-06 `_delegate` on OP: FIXED by code
 *   D11 FIXED PROXY      Mellow H-5 through a real Mellow proxy: FIXED, then watched
 *   R1 REGRESSION        file_regression on D11: the proxy runs the checked implementation -> refused NO_UPGRADE_SINCE_CHECK
 *   R2 REGRESSION        file_regression on D4 (not a proxy) -> NOT_A_PROXY; on D1 (not fixed) -> PRIOR_CHECK_NOT_FIXED
 *   D7 REFUSAL           an unpinned report URL: refused, stake stays withdrawable
 *   I1 IMPORT REFUSAL    the Code4rena report under Mellow's docs: PROTOCOL_NOT_IN_REPORT (reverts, nothing written)
 *   D5 EXPIRY            Cap M-1, never decided; expire() after the decide deadline
 *   S1 CLOSE             close_scorecard after 600 s: every slot marked fixed with no check counted NOT_CHECKED
 *   then sweep_fees() and every withdraw(): the ledger drains to exactly 0
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { CHAINS, accounts, fundOnStudio, connect, sleep } from "./harness.mjs";
const dep = JSON.parse(readFileSync(new URL("../deployments.json", import.meta.url), "utf8")).contracts;
const address = dep.FixCheckDemo.address;
const seeds = JSON.parse(readFileSync(new URL("../docs/research/seeds.json", import.meta.url), "utf8"));
const c4 = JSON.parse(readFileSync(new URL("../docs/research/c4_candidates.json", import.meta.url), "utf8"));
const acc = accounts();
for (const r of ["demo_challenger", "demo_defender", "demo_trigger"]) await fundOnStudio(CHAINS.studiodev, acc[r].address, 1000n * 10n ** 18n);
const GEN = 10n ** 18n;
const ch = connect({ address, role: "demo_challenger" });
const df = connect({ address, role: "demo_defender" });
const tr = connect({ address, role: "demo_trigger" });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const OUT = new URL("../docs/seed-demo.json", import.meta.url);
const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const txs = prev.contract === address ? prev.txs ?? [] : [];
const rec = (tag, fn, o, extra = {}) => { txs.push({ tag, fn, hash: o.hash, status: o.status, ok: o.ok, ...extra }); writeFileSync(OUT, JSON.stringify({ ...prev, contract: address, txs }, null, 2) + "\n"); };
const last = async (c) => JSON.parse((await c.view("get_last_result", [c.account.address])) || "{}");
const find = (p, id, fn, chain) => seeds.find((s) => s.protocol.startsWith(p) && s.finding_id === id && s.function === fn && (!chain || s.chain === chain));
const PT_REPORT = seeds.find((s) => s.protocol.startsWith("PoolTogether")).report_url;
const PT_OP_DOCS = "https://raw.githubusercontent.com/GenerationSoftware/pt-dev-docs/9f3322e7280f2e91346cabfc2512046c6cfcd2a8/docs/deployments/optimism.md";
const C4_REPORT = "https://raw.githubusercontent.com/code-423n4/2023-07-pooltogether-findings/ec193297735caa64d472a6d89ef7d77a7cb6196c/report.md";
const PRIZEPOOL_OP = "0xF35fE10ffd0a9672d0095c435fd8767A7fe29B55";
const m19 = find("PoolTogether", "M-19", "claimPrize");
const h06 = c4.find((x) => x.fid === "H-06" && x.fn === "_delegate");
const PLAN = [
  { tag: "D1", s: find("PoolTogether", "M-17", "_convertToShares", "ethereum"), slot: true, defend: 1n },
  { tag: "D4", s: find("PoolTogether", "M-5", "claimPrizes", "optimism"), slot: true },
  { tag: "D8", s: find("PoolTogether", "M-9", "liquidatableBalanceOf", "optimism"), slot: true, defend: 1n },
  { tag: "D9", s: find("PoolTogether", "M-16", "maxDeposit", "arbitrum"), slot: true, defend: 1n },
  { tag: "D2", s: find("Mellow", "H-1", "checkSignatures"), defend: 1n },
  { tag: "D3", s: { ...m19, chain: "optimism", address: PRIZEPOOL_OP, docs_url: PT_OP_DOCS }, defend: 1n },
  { tag: "D6", s: find("Mellow", "M-5", "cancelDepositRequest") },
  { tag: "D10", s: { protocol: "PoolTogether (C4)", finding_id: "H-06", function: "_delegate", chain: h06.chain, address: h06.address, report_url: C4_REPORT, docs_url: h06.docs, audited_url: h06.audited, fix_url: h06.fix } },
  { tag: "D11", s: { ...find("Mellow", "H-5", "calculateFee"), address: "0x24fd64eb4766d91fd79a4d5e8086b2460debcae7" } },
  { tag: "D5", s: find("Cap", "M-1", "liquidate"), expire: true },
];
const state = prev.contract === address ? prev.plan ?? {} : {};
const idOf = async (s) => { const st = await tr.view("fix_status", [s.chain, s.address, s.report_url, s.finding_id]); return Number(st.open_check_id || st.check_id || 0); };
const decideOne = async (p, id) => {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const c = await tr.view("get_check", [id]);
    if (c.state !== "OPEN") { log(p.tag, "check", id, c.state, c.verdict, c.basis, c.model_votes); break; }
    const wait = Number(c.counter_deadline) + 8 - Date.now() / 1000;
    if (wait > 0) await sleep(wait * 1000);
    const o = await tr.send("decide", [id]);
    rec(p.tag, "decide", o, { check_id: id });
    log(p.tag, "decide", id, o.status, o.ok, o.hash);
  }
};

// S0 import
let cards = (await tr.view("get_scorecards", [0, 10])).items;
let sid = cards.find((c) => c.report_url.toLowerCase() === PT_REPORT.toLowerCase())?.scorecard_id;
if (!sid) {
  const o = await tr.send("import_report", [PT_REPORT, PT_OP_DOCS]);
  rec("S0", "import_report", o);
  log("S0 import", o.status, o.ok, o.hash);
  cards = (await tr.view("get_scorecards", [0, 10])).items;
  sid = cards.find((c) => c.report_url.toLowerCase() === PT_REPORT.toLowerCase())?.scorecard_id;
}
state.S0 = sid;
async function fileOne(p) {
  let id = state[p.tag] ?? await idOf(p.s);
  if (!id) {
    const o = p.slot && sid
      ? await ch.send("file_slot", [sid, p.s.finding_id, p.s.function, p.s.audited_url, p.s.fix_url, p.s.chain, p.s.address, p.s.docs_url], GEN)
      : await ch.send("file_check", [p.s.report_url, p.s.finding_id, p.s.function, p.s.audited_url, p.s.fix_url, p.s.chain, p.s.address, p.s.docs_url], GEN);
    const r = await last(ch);
    rec(p.tag, p.slot ? "file_slot" : "file_check", o, { result: r });
    log(p.tag, "file", o.status, o.hash, JSON.stringify(r));
    id = await idOf(p.s);
  }
  state[p.tag] = id;
  if (p.defend && id) {
    const ds = await tr.view("get_defenders", [id]);
    const c = await tr.view("get_check", [id]);
    if (!ds.length && c.state === "OPEN" && Date.now() / 1000 < Number(c.counter_deadline) - 15) {
      const o = await df.send("counter_stake", [id], p.defend * GEN);
      rec(p.tag, "counter_stake", o, { check_id: id, result: await last(df) });
      log(p.tag, "counter-stake", o.status, o.hash);
    }
  }
  return id;
}
// the scorecard's slots are filed together inside its 600 s window, then decided
const slotted = PLAN.filter((p) => p.slot);
for (const p of slotted) await fileOne(p);
for (const p of slotted) if (state[p.tag]) await decideOne(p, state[p.tag]);
for (const p of PLAN.filter((x) => !x.slot)) {
  const id = await fileOne(p);
  if (id && !p.expire) await decideOne(p, id);
}
// R1 / R2 regression watch paths
for (const [tag, prior] of [["R1", state.D11], ["R2a", state.D4], ["R2b", state.D1]]) {
  if (txs.some((t) => t.tag === tag)) continue;
  const o = await ch.send("file_regression", [prior], GEN / 10n);
  const r = await last(ch);
  rec(tag, "file_regression", o, { prior, result: r });
  log(tag, "file_regression", prior, o.status, o.hash, JSON.stringify(r));
}
// D7 refusal
if (!txs.some((t) => t.tag === "D7")) {
  const s = PLAN[0].s;
  const o = await ch.send("file_check", [s.report_url.replace(/\/[0-9a-f]{40}\//, "/main/"), s.finding_id, s.function, s.audited_url, s.fix_url, s.chain, s.address, s.docs_url], GEN);
  rec("D7", "file_check", o, { result: await last(ch) });
  log("D7 refusal", o.status, o.hash, JSON.stringify(await last(ch)));
}
// I1 import refusal (reverts: nothing written)
if (!txs.some((t) => t.tag === "I1")) {
  const mellowDocs = find("Mellow", "H-1", "checkSignatures").docs_url;
  const o = await tr.send("import_report", [C4_REPORT, mellowDocs]);
  rec("I1", "import_report", o, { reason: o.revertReason?.slice(0, 120) });
  log("I1 import refusal", o.status, o.ok, o.hash, o.revertReason?.slice(0, 120));
}
// D5 expiry
{
  const id = state.D5;
  let c = await tr.view("get_check", [id]);
  if (c.state === "OPEN") {
    const wait = Number(c.decide_deadline) + 8 - Date.now() / 1000;
    if (wait > 0) { log("D5 waiting", wait.toFixed(0), "s for the decide deadline"); await sleep(wait * 1000); }
    const o = await tr.send("expire", [id]);
    rec("D5", "expire", o, { check_id: id });
    log("D5 expire", id, o.status, o.hash);
  }
}
// S1 close the scorecard
{
  const c = await tr.view("get_scorecard", [sid]);
  if (c.state === "OPEN") {
    const wait = Number(c.file_deadline) + 8 - Date.now() / 1000;
    if (wait > 0) { log("S1 waiting", wait.toFixed(0), "s for the filing deadline"); await sleep(wait * 1000); }
    const o = await tr.send("close_scorecard", [sid]);
    rec("S1", "close_scorecard", o, { scorecard_id: sid });
    log("S1 close", sid, o.status, o.hash);
  }
}
// drain
const led0 = await tr.view("get_ledger");
if (BigInt(led0.fees_wei) > 0n) { const o = await tr.send("sweep_fees", []); rec("DRAIN", "sweep_fees", o); }
for (const [name, c] of [["demo_challenger", ch], ["demo_defender", df], ["demo_trigger", tr], ["deployer (fee recipient)", connect({ address, role: "deployer" })]]) {
  const b = await c.view("balance_of", [c.account.address]);
  if (BigInt(b.claimable_wei) > 0n) {
    const o = await c.send("withdraw", []);
    rec("DRAIN", "withdraw", o, { who: name, wei: b.claimable_wei });
    log("withdraw", name, b.claimable_wei, o.status, o.hash);
    const o2 = await c.send("withdraw", []);
    rec("DRAIN", "withdraw again", o2, { who: name, reason: o2.revertReason?.slice(0, 80) });
    log("withdraw again", name, o2.ok ? "PAID TWICE?!" : "refused");
  }
}
const out = { contract: address, plan: state, txs, checks: await tr.view("get_checks", [0, 50]), scorecard: await tr.view("get_scorecard", [sid]),
  slots: await tr.view("get_scorecard_slots", [sid, 0, 100]), stats: await tr.view("get_stats"), ledger: await tr.view("get_ledger") };
writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
log("stats", JSON.stringify(out.stats), "ledger", JSON.stringify(out.ledger));
