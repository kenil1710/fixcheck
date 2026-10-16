/**
 * Consumer demo on the canonical deployment: FixGate.interact() for a decided
 * NOT_FIXED check (refused) and a decided FIXED check (allowed), each confirmed
 * by reading FixGate's stored outcome back. Appends the hashes to docs/live-v2.json.
 *   node seed_consumer.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { CHAINS, accounts, fundOnStudio, connect } from "./harness.mjs";
const dep = JSON.parse(readFileSync(new URL("../deployments.json", import.meta.url), "utf8")).contracts;
const acc = accounts();
await fundOnStudio(CHAINS.studiodev, acc.gate.address, 100n * 10n ** 18n);
const fc = connect({ address: dep.FixCheck.address, role: "gate" });
const gate = connect({ address: dep.FixGate.address, role: "gate" });
const OUT = new URL("../docs/live-v2.json", import.meta.url);
const live = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const checks = (await fc.view("get_checks", [0, 100])).items;
for (const [tag, verdict] of [["gate_refused", "NOT_FIXED"], ["gate_allowed", "FIXED"]]) {
  if (live[tag]) { console.log(tag, "done", live[tag]); continue; }
  const x = checks.find((c) => c.state === "DECIDED" && c.verdict === verdict);
  if (!x) { console.log(tag, "no decided", verdict, "check yet"); continue; }
  const before = (await gate.view("get_stats")).calls;
  const o = await gate.send("interact", [x.report_url + "#" + x.finding_id, x.chain, x.address]);
  const s = await gate.view("get_stats");
  const last = (await gate.view("get_calls", [0, 1])).items[0];
  console.log(tag, o.status, o.hash, "calls", before, "->", s.calls, JSON.stringify(last));
  if (s.calls > before) live[tag] = o.hash;
  live._gate = { ...(live._gate ?? {}), [tag]: { check_id: x.check_id, outcome: last } };
}
writeFileSync(OUT, JSON.stringify(live, null, 2) + "\n");
