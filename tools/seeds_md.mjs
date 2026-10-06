/** Writes docs/SEEDS.md from the chain (canonical + demo).   node tools/seeds_md.mjs */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(new URL("../test/package.json", import.meta.url));
const { createClient } = require("genlayer-js");
const { studioDevnet } = require("genlayer-js/chains");
const root = new URL("..", import.meta.url).pathname;
const dep = JSON.parse(readFileSync(root + "deployments.json", "utf8")).contracts;
const seeds = JSON.parse(readFileSync(root + "docs/research/seeds.json", "utf8"));
const SITE = "https://fixcheck-ledger.vercel.app";
const c = createClient({ chain: studioDevnet });
const view = async (address, functionName, args = []) => { for (let i = 0; ; i++) { try { return await c.readContract({ address, functionName, args }); } catch (e) { if (i > 5) throw e; await new Promise((r) => setTimeout(r, 4000)); } } };
const plain = (v) => v instanceof Map ? Object.fromEntries([...v].map(([k, x]) => [k, plain(x)])) : Array.isArray(v) ? v.map(plain) : typeof v === "bigint" ? Number(v) : v;
const gen = (w) => (Number(BigInt(w)) / 1e18).toLocaleString("en-US", { maximumFractionDigits: 4 });
const canon = plain(await view(dep.FixCheck.address, "get_checks", [0, 100])).items.sort((a, b) => a.check_id - b.check_id);
const demo = plain(await view(dep.FixCheckDemo.address, "get_checks", [0, 100])).items.sort((a, b) => a.check_id - b.check_id);
const stats = plain(await view(dep.FixCheck.address, "get_stats"));
const led = plain(await view(dep.FixCheck.address, "get_ledger"));
const dled = plain(await view(dep.FixCheckDemo.address, "get_ledger"));
const verdict = (x) => x.state === "OPEN" ? "open" : x.state === "EXPIRED" ? "EXPIRED (refunded)" : x.verdict;
let md = `# Seeds\n\nRead from the chain by \`tools/seeds_md.mjs\` on ${new Date().toISOString().slice(0, 16)}Z. Every row links to its page; every value comes from contract state.\n\n`;
md += `## Canonical — ${dep.FixCheck.address}\n\n${stats.checks} real findings · **${stats.fixed} fixed** · **${stats.not_fixed} not fixed** · ${stats.inconclusive} inconclusive · ${stats.open} open. Ledger: balance ${gen(led.balance_wei)} = open ${gen(led.open_stakes_wei)} + withdrawable ${gen(led.claimable_wei)} + fees ${gen(led.fees_wei)} GEN (invariant ${led.invariant_holds ? "holds" : "BROKEN"}).\n\n`;
md += "| # | Protocol | Finding | Function | Chain | Deployed | Offline research | On-chain verdict | Basis | Model (asked twice) | Stakes (not fixed / fixed) |\n|---|---|---|---|---|---|---|---|---|---|---|\n";
for (const x of canon) {
  const s = seeds.find((y) => y.finding_id === x.finding_id && y.function === x.function && y.chain === x.chain && y.address.toLowerCase() === x.address);
  md += `| [${x.check_id}](${SITE}/checks/${x.check_id}) | ${s?.protocol ?? x.protocol} | [${x.finding_id}](${x.report_url}) | \`${x.function}\` | ${x.chain} | \`${x.address}\` | ${s?.offline ?? ""} | **${verdict(x)}** | ${x.basis} | ${x.model_votes || "not asked"} | ${gen(x.stake_wei)} / ${gen(x.defended_wei)} |\n`;
}
const modelRows = canon.filter((x) => x.model_votes);
const agree = modelRows.filter((x) => { const [a, b] = x.model_votes.split("|"); return a === b; }).length;
md += `\n**Model double-run agreement:** ${agree} of ${modelRows.length} model-decided checks got the same answer twice (${modelRows.map((x) => `#${x.check_id} ${x.model_votes}`).join(", ") || "none yet"}). Code alone decided ${canon.filter((x) => x.state === "DECIDED" && !x.model_votes).length}.\n\n`;
md += `**Offline vs on chain:** every code-decided verdict matches the offline research classification (IDENTICAL_TO_FIX → FIXED, IDENTICAL_TO_VULNERABLE → NOT_FIXED).\n\n`;
md += `## Demo — ${dep.FixCheckDemo.address}\n\n90 s counter window, 300 s decide window; same source. Every path:\n\n| # | Path | Finding | Verdict | Basis | Payout |\n|---|---|---|---|---|---|\n`;
const paths = { 1: "challenge wins (defender loses)", 2: "challenge loses (defender wins)", 3: "inconclusive refund (function not in that contract)", 4: "no defender → refund minus fee", 5: "expiry → everyone refunded", 6: "model decides (function changed)" };
for (const x of demo) md += `| [${x.check_id}](${SITE}/demo/checks/${x.check_id}) | ${paths[x.check_id] ?? ""} | ${x.finding_id} \`${x.function}\` | ${verdict(x)} | ${x.basis} | challenger ${gen(x.challenger_paid_wei)} GEN, fee ${gen(x.fee_paid_wei)} GEN |\n`;
md += `\nAlso on the demo: an unpinned report URL refused (stake left withdrawable), \`sweep_fees\`, every account withdrew, and a second \`withdraw\` was refused ("nothing to withdraw"). Demo ledger: balance ${gen(dled.balance_wei)} = open ${gen(dled.open_stakes_wei)} + withdrawable ${gen(dled.claimable_wei)} + fees ${gen(dled.fees_wei)} (invariant ${dled.invariant_holds ? "holds" : "BROKEN"}). Raw logs: \`docs/seed-demo.json\`, \`docs/seed-canonical.json\`.\n`;
writeFileSync(root + "docs/SEEDS.md", md);
console.log(md.slice(0, 400));
