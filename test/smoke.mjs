/**
 * DEV smoke test (not a canonical deploy): deploys the WORKING TREE FixCheck
 * with short windows and files one real check, to catch GenVM-only faults
 * before anything is committed.   node smoke.mjs [--address=0x..] [--case=N]
 */
import { readFileSync } from "node:fs";
import { createClient, createAccount } from "genlayer-js";
import { CHAINS, accounts, fundOnStudio, deploy, connect, argOf, returnedJson } from "./harness.mjs";
const chain = CHAINS.studiodev;
const acc = accounts();
const account = createAccount(acc.deployer.key);
const wallet = createClient({ chain, account });
const read = createClient({ chain });
for (const r of ["deployer", "challenger", "defender"]) await fundOnStudio(chain, acc[r].address, 1000n * 10n ** 18n);
let address = argOf("address");
if (!address) {
  const code = readFileSync(new URL("../contracts/FixCheck.py", import.meta.url), "utf8");
  const res = await deploy({ chain, wallet, read, code, args: ["SMOKE", 60, 600, 200, acc.deployer.address], label: "smoke" });
  if (!res.ok) { console.error("deploy failed", res.out?.status, res.reason, res.out?.revertReason, res.out?.stderr?.slice(-3000)); process.exit(1); }
  address = res.address;
}
console.log("FixCheck (smoke) at", address);
import("node:fs").then((fs) => fs.writeFileSync(new URL("./.smoke.json", import.meta.url), JSON.stringify({ address })));
const cases = JSON.parse(readFileSync(new URL("./fixtures/cases.json", import.meta.url), "utf8"));
const c = cases[Number(argOf("case", "0"))];
const ch = connect({ address, role: "challenger" });
console.log("config", await ch.view("get_config"));
const out = await ch.send("file_check", [c.report, c.id, c.fn, c.audited, c.fix, c.chain, c.address, c.docs], 10n ** 18n);
console.log(out.status, out.ok, out.seconds, "s", out.hash, out.revertReason?.slice(0, 400));
console.log("returned", JSON.stringify(out.returned)?.slice(0, 400));
console.log("last", await ch.view("get_last_result", [acc.challenger.address]));
console.log("check", JSON.stringify(await ch.view("get_check", [1]).catch((e) => String(e))).slice(0, 1500));
console.log("ledger", await ch.view("get_ledger"));
