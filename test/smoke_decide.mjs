/** DEV: file case N on an existing smoke contract, then decide it (and any extra ids). */
import { readFileSync } from "node:fs";
import { connect, argOf, sleep } from "./harness.mjs";
const address = argOf("address");
const cases = JSON.parse(readFileSync(new URL("./fixtures/cases.json", import.meta.url), "utf8"));
const ch = connect({ address, role: "challenger" });
const ids = (argOf("ids", "") || "").split(",").filter(Boolean).map(Number);
if (argOf("case")) {
  const c = cases[Number(argOf("case"))];
  const out = await ch.send("file_check", [c.report, c.id, c.fn, c.audited, c.fix, c.chain, c.address, c.docs], 10n ** 18n);
  console.log("file", out.status, out.ok, out.seconds, "s", await ch.view("get_last_result", [ch.account.address]));
  ids.push(JSON.parse(await ch.view("get_last_result", [ch.account.address])).check_id);
  await sleep(65_000);
}
const t = connect({ address, role: "trigger" });
for (const id of ids) {
  const pre = await t.view("get_check", [id]);
  while (Date.now() / 1000 < Number(pre.counter_deadline) + 5) await sleep(3000);
  const d = await t.send("decide", [id]);
  console.log("decide", id, d.status, d.ok, d.seconds, "s", d.revertReason?.slice(0, 300), JSON.stringify(d.returned));
  const c = await t.view("get_check", [id]);
  console.log("  ", c.state, c.verdict, c.basis, c.model_votes, c.quote_lines);
}
console.log(await t.view("get_ledger"));
