/**
 * Seeds CANONICAL with every real finding from docs/research/seeds.json.
 * Resumable: the chain is the source of truth. A seed whose key already has a
 * check (open or decided) is not filed again; counter-stakes are only added
 * if the defender has none; decide runs only for OPEN checks past their
 * counter deadline.
 *
 *   node seed_canonical.mjs            file + counter-stake (phase 1)
 *   node seed_canonical.mjs --decide   decide every open check whose window passed (phase 2)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { CHAINS, accounts, fundOnStudio, connect, sleep } from "./harness.mjs";
const dep = JSON.parse(readFileSync(new URL("../deployments.json", import.meta.url), "utf8")).contracts;
const address = dep.FixCheck.address;
const seeds = JSON.parse(readFileSync(new URL("../docs/research/seeds.json", import.meta.url), "utf8"));
const acc = accounts();
for (const r of ["challenger", "challenger2", "defender", "defender2", "trigger"]) await fundOnStudio(CHAINS.studiodev, acc[r].address, 1000n * 10n ** 18n);
const GEN = 10n ** 18n;
const roles = { challenger: connect({ address, role: "challenger" }), challenger2: connect({ address, role: "challenger2" }),
  defender: connect({ address, role: "defender" }), defender2: connect({ address, role: "defender2" }), trigger: connect({ address, role: "trigger" }) };
const t = roles.trigger;
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
// who defends what: [seed index (1-based), role, GEN]
const DEFENCES = [[1, "defender", 2n], [12, "defender", 2n], [13, "defender2", 1n], [4, "defender2", 1n], [20, "defender", 1n]];

async function existing(s) {
  const st = await t.view("fix_status", [s.chain, s.address, s.report_url, s.finding_id]);
  return Number(st.open_check_id || st.check_id || 0);
}

if (!process.argv.includes("--decide")) {
  for (const [i, s] of seeds.entries()) {
    const n = i + 1;
    let id = await existing(s);
    if (id) { log(`#${n} ${s.protocol} ${s.finding_id} already check ${id}`); }
    else {
      const who = n % 3 === 0 ? "challenger2" : "challenger";
      const c = roles[who];
      const out = await c.send("file_check", [s.report_url, s.finding_id, s.function, s.audited_url, s.fix_url, s.chain, s.address, s.docs_url], GEN);
      const last = JSON.parse((await c.view("get_last_result", [c.account.address])) || "{}");
      log(`#${n} ${s.protocol} ${s.finding_id} ${s.function}@${s.chain}: ${out.status} ${out.seconds?.toFixed(0)}s ${JSON.stringify(last)}`);
      id = await existing(s);
      if (!id) { log(`  !! not filed (${out.revertReason || last.reason || "unknown"})`); continue; }
    }
    for (const [k, role, amt] of DEFENCES.filter(([k]) => k === n)) {
      const ds = await t.view("get_defenders", [id]);
      if (ds.some((d) => d.address.toLowerCase() === acc[role].address.toLowerCase())) continue;
      const o = await roles[role].send("counter_stake", [id], amt * GEN);
      log(`  ${role} counter-stakes ${amt} GEN on check ${id}: ${o.status} ${await roles[role].view("get_last_result", [acc[role].address])}`);
    }
  }
} else {
  const total = Number((await t.view("get_stats")).checks);
  for (let id = 1; id <= total; id++) {
    for (let attempt = 1; attempt <= 4; attempt++) {
      const c = await t.view("get_check", [id]);
      if (c.state !== "OPEN") { log(`check ${id} ${c.state} ${c.verdict} ${c.basis} ${c.model_votes}`); break; }
      const wait = Number(c.counter_deadline) + 10 - Date.now() / 1000;
      if (wait > 0) { log(`check ${id} counter window open for ${wait.toFixed(0)}s more; waiting`); await sleep(wait * 1000); }
      const o = await t.send("decide", [id]);
      log(`decide ${id} (attempt ${attempt}): ${o.status} ${o.ok} ${o.seconds?.toFixed(0)}s ${o.revertReason?.slice(0, 160) || ""}`);
      if (o.ok) continue;
      await sleep(20_000);
    }
  }
  writeFileSync(new URL("../docs/seed-canonical.json", import.meta.url), JSON.stringify(await t.view("get_checks", [0, 100]), null, 2));
  log("stats", JSON.stringify(await t.view("get_stats")), JSON.stringify(await t.view("get_ledger")));
}
