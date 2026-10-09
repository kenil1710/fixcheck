/**
 * Round-4 live verification on the DEMO contract (docs/DEPLOYED_VERIFICATION.md):
 * the three round-3 cases again on the round-4 contracts, plus V4.
 *
 *   V1  report pinned to a commit that exists only in a fork of the Sherlock
 *       judging repo (minanew12's "Update README.md", 6035289) -> refused
 *   V2  docs pinned to a commit that exists only in a fork of OP's
 *       superchain-registry (Ajitrajpsp, 17d2cfd; it lists the address)  -> refused
 *   V3  a proxy whose current implementation was selected after the fix
 *       existed (Cap's Lender proxy, switched 2025-09-08; fix 2025-08-15):
 *       filed, then decided -> never PREDATES_FIX; the switch confirmed by both RPCs
 *   V4  docs pinned to a commit that exists only on refs/pull/1305/head of OP's
 *       superchain-registry (a closed PR from the fork Kemperino, 6be7212;
 *       GitHub raw serves it under the upstream path)                  -> refused
 *
 *   node verify_live_r4.mjs            (resumable; writes docs/live-r4.json)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { CHAINS, accounts, fundOnStudio, connect, sleep } from "./harness.mjs";

const dep = JSON.parse(readFileSync(new URL("../deployments.json", import.meta.url), "utf8")).contracts;
const address = dep.FixCheckDemo.address;
const seeds = JSON.parse(readFileSync(new URL("../docs/research/seeds.json", import.meta.url), "utf8"));
const outPath = new URL("../docs/live-r4.json", import.meta.url);
const acc = accounts();
await fundOnStudio(CHAINS.studiodev, acc.demo_challenger.address, 1000n * 10n ** 18n);
await fundOnStudio(CHAINS.studiodev, acc.demo_trigger.address, 1000n * 10n ** 18n);
const GEN = 10n ** 18n;
const ch = connect({ address, role: "demo_challenger" });
const tr = connect({ address, role: "demo_trigger" });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const doc = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")) : { contract: address, cases: {} };
if (doc.contract !== address) { doc.contract = address; doc.cases = {}; }
const save = () => writeFileSync(outPath, JSON.stringify(doc, null, 2) + "\n");

const find = (p, id, chain) => seeds.find((s) => s.protocol.startsWith(p) && s.finding_id === id && s.chain === chain);
const argsOf = (s, over = {}) => { const a = { ...s, ...over };
  return [a.report_url, a.finding_id, a.function, a.audited_url, a.fix_url, a.chain, a.address, a.docs_url]; };
const atSha = (url, sha) => { const p = url.split("/"); p[5] = sha; return p.join("/"); };

async function file(name, s, over) {
  if (doc.cases[name]?.tx) { log(`${name} already done: ${doc.cases[name].tx}`); return doc.cases[name]; }
  const args = argsOf(s, over);
  const out = await ch.send("file_check", args, GEN);
  const last = JSON.parse((await ch.view("get_last_result", [ch.account.address])) || "{}");
  log(`${name}: ${out.status} ${out.hash} ${JSON.stringify(last)}`);
  doc.cases[name] = { tx: out.hash, tx_status: out.status, args, result: last };
  save();
  return doc.cases[name];
}

// V1: the PoolTogether vault M-17 (check #6 on the canonical) with its report pinned at a fork-only commit
const vault = find("PoolTogether", "M-17", "ethereum");
await file("V1_report_fork_commit", vault,
  { report_url: atSha(vault.report_url, "6035289fa29efbada06e35f963ffd2f981ef4bfb") });

// V2: OP's DisputeGameFactory M-3 (check #22) with its docs pinned at a fork-only commit
const dgf = find("OP Stack", "M-3", "ethereum");
await file("V2_docs_fork_commit", dgf, { docs_url: atSha(dgf.docs_url, "17d2cfde1b2c3742031c56f08f1bebd5ec422670") });

// V3: Cap M-3 on the Lender proxy: filed, then decided after the 90 s counter window
const cap = seeds.find((s) => s.protocol === "Cap" && s.finding_id === "M-3");
const v3 = await file("V3_proxy_switched_after_fix", cap, {});
const id = Number(v3.result.check_id || 0);
if (id && !v3.decide_tx) {
  let c = await tr.view("get_check", [id]);
  const wait = Number(c.counter_deadline) + 10 - Date.now() / 1000;
  if (wait > 0) { log(`waiting ${wait.toFixed(0)}s for the counter window`); await sleep(wait * 1000); }
  const d = await tr.send("decide", [id]);
  c = await tr.view("get_check", [id]);
  log(`V3 decide: ${d.status} ${d.hash} ${c.verdict} ${c.basis}`);
  v3.decide_tx = d.hash;
  v3.check = Object.fromEntries(["check_id", "implementation", "created_at", "impl_created_at", "switch_status", "switch_block",
    "switched_at", "code_born", "fix_at", "audited_at", "slot_block", "dep_status", "verdict", "basis", "report_reach", "docs_reach",
    "code_status", "impl_code_status", "status_issue"]
    .map((k) => [k, c[k]]));
  save();
}
// V4: OP's DisputeGameFactory M-3 with its docs pinned at a commit only on a pull request's head
await file("V4_docs_pull_request_commit", dgf, { docs_url: atSha(dgf.docs_url, "6be72121777d061d6ca7256f51ad1225235f6f93") });
log("wrote docs/live-r4.json");
