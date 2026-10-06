/** DEV: run one prompt twice through the model from GenVM and print the raw answers. */
import { readFileSync } from "node:fs";
import { createClient, createAccount } from "genlayer-js";
import { CHAINS, accounts, fundOnStudio, deploy, connect, argOf } from "./harness.mjs";
const chain = CHAINS.studiodev;
const account = createAccount(accounts().probe.key);
let address = argOf("address");
if (!address) {
  const res = await deploy({ chain, wallet: createClient({ chain, account }), read: createClient({ chain }), code: readFileSync(new URL("../contracts/_probe.py", import.meta.url), "utf8"), args: [], label: "probe" });
  address = res.address;
}
console.log("probe at", address);
const { send, view } = connect({ address, role: "probe" });
const out = await send("probe_prompt", [readFileSync(argOf("file"), "utf8")]);
console.log(out.status, out.ok, out.seconds);
console.log(await view("get_last"));
