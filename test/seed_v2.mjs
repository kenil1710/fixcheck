/**
 * Seeds the v2 CANONICAL contract. Resumable: the chain is the source of truth.
 *
 *   node seed_v2.mjs --import     open the three scorecards (whole reports)
 *   node seed_v2.mjs --file       file every planned check (+ counter-stakes)
 *   node seed_v2.mjs --decide     decide every open check past its counter deadline
 *   node seed_v2.mjs --close      close every scorecard past its filing deadline
 *   node seed_v2.mjs --snapshot   write docs/seed-canonical.json from the chain
 *
 * Scorecards (code enumerates every finding; nobody picks):
 *   S1 PoolTogether V5, Sherlock 2024-05     -> the 11 v1 PoolTogether checks are filed into its slots
 *   S2 PoolTogether V5, Code4rena 2023-07    -> every filing tools/v2_research_c4.py found the contract accepts
 *                                               on PoolTogether's listed OP deployments, one per finding
 *   S3 Mellow Flexible Vaults, Sherlock      -> the 8 v1 Mellow checks, plus H-5 on a real Mellow proxy
 * Plain checks: Cap M-1, Cap M-3, OP Stack M-3 (the rest of the 22 v1 checks).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { CHAINS, accounts, fundOnStudio, connect, sleep } from "./harness.mjs";
const dep = JSON.parse(readFileSync(new URL("../deployments.json", import.meta.url), "utf8")).contracts;
const address = dep.FixCheck.address;
const seeds = JSON.parse(readFileSync(new URL("../docs/research/seeds.json", import.meta.url), "utf8"));
const c4 = JSON.parse(readFileSync(new URL("../docs/research/c4_candidates.json", import.meta.url), "utf8"));
const acc = accounts();
const GEN = 10n ** 18n;
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const roles = Object.fromEntries(["challenger", "challenger2", "defender", "defender2", "trigger"].map((r) => [r, connect({ address, role: r })]));
const t = roles.trigger;

export const PT_SHERLOCK = seeds.find((s) => s.protocol.startsWith("PoolTogether")).report_url;
export const MELLOW = seeds.find((s) => s.protocol.startsWith("Mellow")).report_url;
export const C4_REPORT = "https://raw.githubusercontent.com/code-423n4/2023-07-pooltogether-findings/ec193297735caa64d472a6d89ef7d77a7cb6196c/report.md";
const PT_OP_DOCS = "https://raw.githubusercontent.com/GenerationSoftware/pt-dev-docs/9f3322e7280f2e91346cabfc2512046c6cfcd2a8/docs/deployments/optimism.md";
const MELLOW_DOCS = seeds.find((s) => s.protocol.startsWith("Mellow")).docs_url;
const CARDS = [[PT_SHERLOCK, PT_OP_DOCS], [C4_REPORT, PT_OP_DOCS], [MELLOW, MELLOW_DOCS]];
const MELLOW_PROXY_H5 = "0x24fd64eb4766d91fd79a4d5e8086b2460debcae7";   // a Mellow proxy whose implementation is the FIXED FeeManager

// [seed, scorecard report or null]
const C4_PICK = [["H-06", "_delegate"], ["M-05", "_transferBalance"], ["M-03", "getTwabBetween"], ["M-19", "getVaultPortion"], ["M-06", "setDrawManager"]];
export const PLAN = [
  ...seeds.map((s, i) => ({ n: i + 1, s, card: s.protocol.startsWith("PoolTogether") ? PT_SHERLOCK : s.protocol.startsWith("Mellow") ? MELLOW : null })),
  { n: 23, s: { ...seeds.find((s) => s.protocol.startsWith("Mellow") && s.finding_id === "H-5"), address: MELLOW_PROXY_H5 }, card: MELLOW },
  ...C4_PICK.map(([fid, fn], k) => {
    const r = c4.find((x) => x.fid === fid && x.fn === fn);
    return { n: 24 + k, s: { protocol: "PoolTogether V5 (Code4rena)", finding_id: fid, function: fn, chain: r.chain, address: r.address, report_url: C4_REPORT, docs_url: r.docs, audited_url: r.audited, fix_url: r.fix }, card: C4_REPORT };
  }),
];
// who defends what (plan numbers; the v1 defences, plus the regression-watch proxy and a C4 case)
const DEFENCES = [[1, "defender", 2n], [12, "defender", 2n], [13, "defender2", 1n], [4, "defender2", 1n], [20, "defender", 1n], [6, "defender2", 1n], [24, "defender", 1n]];

async function cards() { return (await t.view("get_scorecards", [0, 100])).items; }
async function existing(s) {
  const st = await t.view("fix_status", [s.chain, s.address, s.report_url, s.finding_id]);
  return Number(st.open_check_id || st.check_id || 0);
}

if (process.argv.includes("--import")) {
  for (const r of ["challenger", "challenger2", "defender", "defender2", "trigger"]) await fundOnStudio(CHAINS.studiodev, acc[r].address, 1000n * 10n ** 18n);
  for (const [report, docs] of CARDS) {
    const have = (await cards()).find((c) => c.report_url.toLowerCase() === report.toLowerCase());
    if (have) { log("scorecard", have.scorecard_id, "exists", report.slice(34, 100)); continue; }
    const o = await t.send("import_report", [report, docs]);
    log("import", report.slice(34, 100), o.status, o.ok, o.hash, o.seconds?.toFixed(0) + "s", o.revertReason?.slice(0, 200) || "");
  }
  for (const c of await cards()) log("scorecard", c.scorecard_id, c.auditor, c.protocol, c.findings, "findings,", c.marked_fixed, "marked fixed,", c.acknowledged, "ack,", c.not_mitigated, "not mitigated,", c.unmarked, "unmarked; filing until", new Date(c.file_deadline * 1000).toISOString());
}

if (process.argv.includes("--file")) {
  const all = await cards();
  const sidOf = (report) => all.find((c) => c.report_url.toLowerCase() === report.toLowerCase())?.scorecard_id;
  const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",").map(Number);
  for (const p of PLAN) {
    if (only && !only.includes(p.n)) continue;
    const s = p.s;
    let id = await existing(s);
    if (id) log(`#${p.n} ${s.protocol} ${s.finding_id} already check ${id}`);
    else {
      const who = p.n % 3 === 0 ? "challenger2" : "challenger";
      const c = roles[who];
      const sid = p.card ? sidOf(p.card) : null;
      const out = sid
        ? await c.send("file_slot", [sid, s.finding_id, s.function, s.audited_url, s.fix_url, s.chain, s.address, s.docs_url], GEN)
        : await c.send("file_check", [s.report_url, s.finding_id, s.function, s.audited_url, s.fix_url, s.chain, s.address, s.docs_url], GEN);
      const last = JSON.parse((await c.view("get_last_result", [c.account.address])) || "{}");
      log(`#${p.n} ${s.protocol} ${s.finding_id} ${s.function}@${s.chain}${sid ? " slot of scorecard " + sid : ""}: ${out.status} ${out.hash} ${out.seconds?.toFixed(0)}s ${JSON.stringify(last)}`);
      id = await existing(s);
      if (!id) { log(`  !! not filed (${out.revertReason || last.reason || "unknown"})`); continue; }
    }
    for (const [, role, amt] of DEFENCES.filter(([k]) => k === p.n)) {
      const c = await t.view("get_check", [id]);
      if (c.state !== "OPEN" || Date.now() / 1000 >= c.counter_deadline) continue;
      const ds = await t.view("get_defenders", [id]);
      if (ds.some((d) => d.address.toLowerCase() === acc[role].address.toLowerCase())) continue;
      const o = await roles[role].send("counter_stake", [id], amt * GEN);
      log(`  ${role} counter-stakes ${amt} GEN on check ${id}: ${o.status} ${await roles[role].view("get_last_result", [acc[role].address])}`);
    }
  }
}

if (process.argv.includes("--decide")) {
  const total = Number((await t.view("get_stats")).checks);
  for (let id = 1; id <= total; id++) {
    for (let attempt = 1; attempt <= 4; attempt++) {
      const c = await t.view("get_check", [id]);
      if (c.state !== "OPEN") { log(`check ${id} ${c.state} ${c.verdict} ${c.basis} ${c.model_votes}`); break; }
      const wait = Number(c.counter_deadline) + 10 - Date.now() / 1000;
      if (wait > 0) { log(`check ${id} counter window open for ${wait.toFixed(0)}s more; skipping`); break; }
      const o = await t.send("decide", [id]);
      log(`decide ${id} (attempt ${attempt}): ${o.status} ${o.ok} ${o.hash} ${o.seconds?.toFixed(0)}s ${o.revertReason?.slice(0, 160) || ""}`);
      if (o.ok) continue;
      await sleep(20_000);
    }
  }
}

if (process.argv.includes("--close")) {
  for (const c of await cards()) {
    if (c.state !== "OPEN") { log("scorecard", c.scorecard_id, c.state, "not checked", c.not_checked); continue; }
    if (Date.now() / 1000 < c.file_deadline) { log("scorecard", c.scorecard_id, "filing open until", new Date(c.file_deadline * 1000).toISOString()); continue; }
    const o = await t.send("close_scorecard", [c.scorecard_id]);
    log("close_scorecard", c.scorecard_id, o.status, o.ok, o.hash);
  }
}

if (process.argv.includes("--snapshot")) {
  const out = { checks: await t.view("get_checks", [0, 100]), scorecards: await t.view("get_scorecards", [0, 100]), slots: {},
    auditors: await t.view("get_auditors"), protocols: await t.view("get_protocols"), stats: await t.view("get_stats"), ledger: await t.view("get_ledger"), regressions: await t.view("get_regressions", [0, 100]) };
  for (const c of out.scorecards.items) out.slots[c.scorecard_id] = await t.view("get_scorecard_slots", [c.scorecard_id, 0, 100]);
  writeFileSync(new URL("../docs/seed-canonical.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
  log("stats", JSON.stringify(out.stats), JSON.stringify(out.ledger));
}
