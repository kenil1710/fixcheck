/**
 * BASE proof: reads the code of the accepted v1 deployment back from Studio Dev
 * (gen_getContractCode) and compares it byte for byte with contracts/ at BASE.
 *   node tools/base_proof.mjs [BASE]      exit 1 on any mismatch
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const root = new URL("..", import.meta.url).pathname;
const require = createRequire(new URL("../test/package.json", import.meta.url));
const { createClient } = require("genlayer-js");
const { studioDevnet } = require("genlayer-js/chains");
const BASE = process.argv[2] ?? "27f30c059707f982771a6548f7e337a71ec85ed9";
const V1 = [
  ["FixCheck (canonical)", "0x263C6a42B98E9133CF85A00A436b05C3573B88fe", "contracts/FixCheck.py"],
  ["FixCheck (demo)", "0x19bc7Cb16Ce1B4F328f33d0FDfeA61297dA04f68", "contracts/FixCheck.py"],
  ["FixRegistry", "0xA37F98977f023D8C0bd17aCF1A7983E5d328d9A4", "contracts/FixRegistry.py"],
];
const sha = (b) => createHash("sha256").update(b).digest("hex");
const client = createClient({ chain: process.env.STUDIO_RPC ? { ...studioDevnet, rpcUrls: { default: { http: [process.env.STUDIO_RPC] } } } : studioDevnet });
let bad = 0;
console.log(`BASE ${execFileSync("git", ["-C", root, "rev-parse", BASE]).toString().trim()}`);
for (const [name, addr, file] of V1) {
  let code = "";
  for (let i = 0; i < 5 && !code; i++) { try { code = await client.getContractCode(addr); } catch { await new Promise((r) => setTimeout(r, 3000)); } }
  const atBase = execFileSync("git", ["-C", root, "show", `${BASE}:${file}`]);
  const onChain = Buffer.from(String(code), "utf8");
  const same = onChain.equals(atBase);
  if (!same) bad++;
  console.log(`| ${name} | \`${addr}\` | ${file} | \`${sha(onChain)}\` | \`${sha(atBase)}\` | ${same ? "byte-identical" : "DIFFERS"} |`);
}
process.exit(bad ? 1 : 0);
