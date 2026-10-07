/** DEV smoke (working tree, not a canonical deploy): files seeds by index and prints each result. */
import { readFileSync } from "node:fs";
import { createClient, createAccount } from "genlayer-js";
import { CHAINS, accounts, fundOnStudio, deploy, connect, argOf } from "./harness.mjs";
const chain = CHAINS.studiodev;
const acc = accounts();
const account = createAccount(acc.deployer.key);
await fundOnStudio(chain, acc.challenger.address, 1000n * 10n ** 18n);
let address = argOf("address");
if (!address) {
  const res = await deploy({ chain, wallet: createClient({ chain, account }), read: createClient({ chain }), code: readFileSync(new URL("../contracts/FixCheck.py", import.meta.url), "utf8"), args: ["SMOKE", 60, 600, 200, acc.deployer.address], label: "smoke" });
  if (!res.ok) { console.error("deploy failed", res.out?.revertReason, res.out?.stderr?.slice(-2000)); process.exit(1); }
  address = res.address;
}
console.log("smoke at", address);
const seeds = JSON.parse(readFileSync(new URL("../docs/research/seeds.json", import.meta.url), "utf8"));
const ch = connect({ address, role: "challenger" });
for (const n of (argOf("seeds", "2,5,12")).split(",").map(Number)) {
  const s = seeds[n - 1];
  const out = await ch.send("file_check", [s.report_url, s.finding_id, s.function, s.audited_url, s.fix_url, s.chain, s.address, s.docs_url], 10n ** 18n);
  console.log(`#${n} ${s.finding_id} ${s.chain}: ${out.status} ${out.seconds?.toFixed(0)}s ${await ch.view("get_last_result", [ch.account.address])}`);
}
