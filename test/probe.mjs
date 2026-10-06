/** Step 0 probe: deploy contracts/_probe.py to studio-dev and fetch each URL from GenVM. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createClient, createAccount } from "genlayer-js";
import { CHAINS, accounts, fundOnStudio, deploy, connect, argOf } from "./harness.mjs";
const chain = CHAINS.studiodev;
const account = createAccount(accounts().probe.key);
const wallet = createClient({ chain, account });
const read = createClient({ chain });
await fundOnStudio(chain, account.address, 1000n * 10n ** 18n);
let address = argOf("address");
if (!address) {
  const res = await deploy({ chain, wallet, read, code: readFileSync(new URL("../contracts/_probe.py", import.meta.url), "utf8"), args: [], label: "probe" });
  if (!res.ok) { console.error("deploy failed", res.out?.stderr?.slice(-1500), res.reason, res.out?.revertReason); process.exit(1); }
  address = res.address;
}
console.log("probe at", address);
const { send, view } = connect({ address, role: "probe" });
const urls = readFileSync(argOf("file"), "utf8").split("\n").map((s) => s.trim()).filter(Boolean).join(",");
const out = argOf("model") ? await send("probe_model", []) : await send("probe", [urls]);
console.log(out.status, out.ok, out.revertReason?.slice(0, 300), out.seconds, "s", out.hash);
const last = await view("get_last");
console.log(last);
mkdirSync(new URL("../docs/research/", import.meta.url), { recursive: true });
writeFileSync(new URL(`../docs/research/probe_${argOf("tag", "1")}.json`, import.meta.url), JSON.stringify({ address, tx: out.hash, status: out.status, seconds: out.seconds, result: (() => { try { return JSON.parse(last); } catch { return last; } })() }, null, 2));
