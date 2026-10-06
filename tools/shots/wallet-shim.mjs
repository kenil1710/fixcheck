/**
 * A minimal EIP-1193 wallet for the recorded demo: a throwaway Studio Dev key
 * (role "ui" in test/.accounts.json, never printed) signs in Node and the raw
 * transaction goes to Studio Dev. Real transactions, no mocks.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../frontend/package.json", import.meta.url));
const { privateKeyToAccount } = require("viem/accounts");
const RPC = "https://studio-dev.genlayer.com/api";
const CHAIN_ID = 61997;

export async function attachWallet(context, role = "ui") {
  const key = JSON.parse(readFileSync(new URL("../../test/.accounts.json", import.meta.url), "utf8"))[role].key;
  const account = privateKeyToAccount(key);
  await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "sim_fundAccount", params: [account.address, 100e18] }) }).catch(() => {});
  const rpc = async (method, params) => {
    const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
    const j = await r.json();
    if (j.error) throw new Error(j.error.message);
    return j.result;
  };
  await context.exposeBinding("__demoWallet", async (_src, method, params) => {
    if (method === "eth_accounts" || method === "eth_requestAccounts") return [account.address];
    if (method === "eth_chainId") return "0x" + CHAIN_ID.toString(16);
    if (method === "wallet_switchEthereumChain" || method === "wallet_addEthereumChain") return null;
    if (method === "eth_sendTransaction") {
      const t = params[0];
      const raw = await account.signTransaction({ to: t.to, data: t.data, value: t.value ? BigInt(t.value) : 0n, gas: BigInt(t.gas), gasPrice: BigInt(t.gasPrice), nonce: Number(BigInt(t.nonce)), chainId: CHAIN_ID, type: "legacy" });
      return rpc("eth_sendRawTransaction", [raw]);
    }
    return rpc(method, params ?? []);
  });
  await context.addInitScript(() => {
    window.ethereum = {
      isMetaMask: false,
      request: ({ method, params }) => window.__demoWallet(method, params),
      on: () => {}, removeListener: () => {},
    };
  });
  return account.address;
}
