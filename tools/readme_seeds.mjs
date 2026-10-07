/** Fills the README seed table from chain (between the SEEDS markers).   node tools/readme_seeds.mjs */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(new URL("../test/package.json", import.meta.url));
const { createClient } = require("genlayer-js");
const { studioDevnet } = require("genlayer-js/chains");
const root = new URL("..", import.meta.url).pathname;
const dep = JSON.parse(readFileSync(root + "deployments.json", "utf8")).contracts;
const seeds = JSON.parse(readFileSync(root + "docs/research/seeds.json", "utf8"));
const c = createClient({ chain: studioDevnet });
const r = await c.readContract({ address: dep.FixCheck.address, functionName: "get_checks", args: [0, 100] });
const items = (r.items ?? r.get?.("items")).map((x) => (x instanceof Map ? Object.fromEntries(x) : x)).sort((a, b) => Number(a.check_id) - Number(b.check_id));
const SITE = "https://fixcheck-ledger.vercel.app";
let t = "| # | Protocol | Finding | Function | Chain | Verdict | Basis | Model |\n|---|---|---|---|---|---|---|---|\n";
for (const x of items) {
  const s = seeds.find((y) => y.finding_id === x.finding_id && y.function === x.function && y.chain === x.chain);
  const v = x.state === "OPEN" ? "open" : x.state === "EXPIRED" ? "expired" : x.verdict;
  t += `| [${x.check_id}](${SITE}/checks/${x.check_id}) | ${s?.protocol ?? x.protocol} | ${x.finding_id} | \`${x.function}\` | ${x.chain} | **${v}** | ${x.basis} | ${x.model_votes || "—"} |\n`;
}
const md = readFileSync(root + "README.md", "utf8");
const start = md.indexOf("## Seeds\n\n") + "## Seeds\n\n".length;
const end = md.indexOf("\n\nFull table with links");
writeFileSync(root + "README.md", md.slice(0, start) + `All 22 checks of 21 findings from Step 0 (PoolTogether M-1 on two chains), on the canonical contract, read from chain:\n\n` + t.trimEnd() + md.slice(end));
console.log(t);
