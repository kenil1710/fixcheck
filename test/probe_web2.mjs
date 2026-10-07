/** DEV: from inside GenVM, which GitHub / Wayback / RPC reads FixCheck can rely on.  node probe_web2.mjs */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient, createAccount } from "genlayer-js";
import { CHAINS, accounts, deploy, connect } from "./harness.mjs";
const chain = CHAINS.studiodev;
const account = createAccount(accounts().probe.key);
const res = await deploy({ chain, wallet: createClient({ chain, account }), read: createClient({ chain }), code: readFileSync(new URL("../contracts/_probe.py", import.meta.url), "utf8"), args: [], label: "probe" });
const { send, view } = connect({ address: res.address, role: "probe" });
const urls = process.env.URLS ?? [
  "https://github.com/GenerationSoftware/pt-v5-vault/pull/113",
  "https://github.com/GenerationSoftware/pt-v5-vault/branch_commits/60be8fc2d5bbf1606e920ca49bb8100337a1ee2d",
  "https://github.com/generationsoftware/pt-v5-vault/commits/60be8fc2d5bbf1606e920ca49bb8100337a1ee2d.atom",
  "https://web.archive.org/web/20240101000000id_/https://docs.sherlock.xyz/",
  "https://web.archive.org/web/20991231235959id_/https://docs.sherlock.xyz/",
].join(",");
const rpcs = (process.env.RPCS ?? "https://mainnet.optimism.io,https://polygon.drpc.org");
const out = await send("probe_web2", [urls, rpcs]);
console.log(out.status, out.ok);
const last = await view("get_last");
writeFileSync(new URL("../docs/research/probe_web2.json", import.meta.url), JSON.stringify({ address: res.address, tx: out.hash, result: JSON.parse(last) }, null, 2));
console.log(JSON.stringify(JSON.parse(last), null, 1).slice(0, 6000));
