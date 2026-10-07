/** DEV: deploy the probe and POST JSON-RPC calls from GenVM.  node probe_rpc.mjs */
import { readFileSync, writeFileSync } from "node:fs";
import { createClient, createAccount } from "genlayer-js";
import { CHAINS, accounts, deploy, connect } from "./harness.mjs";
const chain = CHAINS.studiodev;
const account = createAccount(accounts().probe.key);
const res = await deploy({ chain, wallet: createClient({ chain, account }), read: createClient({ chain }), code: readFileSync(new URL("../contracts/_probe.py", import.meta.url), "utf8"), args: [], label: "probe" });
const { send, view } = connect({ address: res.address, role: "probe" });
const slot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const rpc = (u, m, p) => `${u} ${JSON.stringify({ jsonrpc: "2.0", id: 1, method: m, params: p })}`;
const calls = [
  rpc("https://ethereum-rpc.publicnode.com", "eth_getStorageAt", ["0x15622c3dbbc5614e6dfa9446603c1779647f01fc", slot, "latest"]),
  rpc("https://optimism-rpc.publicnode.com", "eth_getStorageAt", ["0xf35fe10ffd0a9672d0095c435fd8767a7fe29b55", slot, "latest"]),
  rpc("https://base-rpc.publicnode.com", "eth_getBlockByNumber", ["0xe4e1c0", false]),
  rpc("https://arbitrum-one-rpc.publicnode.com", "eth_getBlockByNumber", ["0xe4e1c0", false]),
  rpc("https://polygon-bor-rpc.publicnode.com", "eth_chainId", []),
].join("|");
const out = await send("probe_rpc", [calls]);
console.log(out.status, out.ok);
const last = await view("get_last");
writeFileSync(new URL("../docs/research/probe_rpc.json", import.meta.url), JSON.stringify({ address: res.address, tx: out.hash, result: JSON.parse(last) }, null, 2));
console.log(last.slice(0, 1500));
