/** Print a Studio Dev transaction's status and leader/validator receipts (no keys). node tools/txinfo.mjs <hash> */
import { createRequire } from "node:module";
const req = createRequire(new URL("../test/package.json", import.meta.url));
const { createClient } = req("genlayer-js");
const { studioDevnet } = req("genlayer-js/chains");
const { transactionsStatusNumberToName } = req("genlayer-js/types");
const url = process.env.STUDIO_RPC ?? "https://fixcheck-ledger.vercel.app/api/rpc";
const c = createClient({ chain: { ...studioDevnet, rpcUrls: { default: { http: [url] } } } });
const tx = await c.getTransaction({ hash: process.argv[2] });
const pick = (r) => r && ({ mode: r.mode, vote: r.vote, execution_result: r.execution_result, result: typeof r.result === "object" ? JSON.stringify(r.result).slice(0, 300) : String(r.result).slice(0, 300), stderr: String(r.genvm_result?.stderr ?? r.stderr ?? "").slice(-600), nondet: JSON.stringify(r.eq_outputs ?? r.nondet ?? "").slice(0, 300) });
console.log("status", transactionsStatusNumberToName[tx.status] ?? tx.status, "rotations", tx.consensus_data?.leader_receipt?.length);
for (const r of tx.consensus_data?.leader_receipt ?? []) console.log("leader", JSON.stringify(pick(r)));
for (const r of tx.consensus_data?.validators ?? []) console.log("validator", JSON.stringify(pick(r)));
