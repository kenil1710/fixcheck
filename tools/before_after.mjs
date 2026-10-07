/** Before/after table: the previous canonical deployment (docs/superseded/seed-canonical-v1.2.json) vs the chain now.
 *   node tools/before_after.mjs > <file>.md */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(new URL("../test/package.json", import.meta.url));
const { createClient } = require("genlayer-js");
const { studioDevnet } = require("genlayer-js/chains");
const root = new URL("..", import.meta.url).pathname;
const dep = JSON.parse(readFileSync(root + "deployments.json", "utf8")).contracts;
const seeds = JSON.parse(readFileSync(root + "docs/research/seeds.json", "utf8"));
const c = createClient({ chain: studioDevnet });
const plain = (v) => v instanceof Map ? Object.fromEntries([...v].map(([k, x]) => [k, plain(x)])) : Array.isArray(v) ? v.map(plain) : typeof v === "bigint" ? Number(v) : v;
const now = plain(await c.readContract({ address: dep.FixCheck.address, functionName: "get_checks", args: [0, 100] })).items;
const before = JSON.parse(readFileSync(root + "docs/superseded/seed-canonical-v1.2.json", "utf8")).items;
const key = (x) => `${x.report_url}#${x.finding_id}@${x.chain}:${x.address.toLowerCase()}`;
const day = (t) => (t ? new Date(t * 1000).toISOString().slice(0, 10) : "—");
const v = (x) => (x.state === "OPEN" ? "open" : x.verdict) + (x.basis ? ` (${x.basis})` : "");
const why = (b, a) => {
  if (b.verdict === a.verdict && b.basis === a.basis) return "unchanged";
  if (a.verdict === "PREDATES_FIX") return `created ${day(a.created_at)}, after the audit (${day(a.audited_at)}) but before the fix existed (${day(a.fix_at)}: the later of the fix commit and its PR's merge) — round-2 fix 1`;
  return "changed: see the report";
};
let md = "| # | Finding | Chain | Before (commit 0c20168) | After (commit " + dep.FixCheck.commit.slice(0, 7) + ") | Reason |\n|---|---|---|---|---|---|\n";
const rows = [];
for (const a of now.sort((x, y) => x.check_id - y.check_id)) {
  const b = before.find((x) => key(x) === key(a));
  const s = seeds.find((x) => x.report_url.toLowerCase() === a.report_url.toLowerCase() && x.finding_id === a.finding_id && x.chain === a.chain);
  rows.push({ a, b });
  md += `| ${a.check_id} | ${s?.protocol ?? a.protocol} ${a.finding_id} \`${a.function}\` | ${a.chain} | ${b ? v(b) : "—"} | ${v(a)} | ${b ? why(b, a) : "new"} |\n`;
}
const changed = rows.filter(({ a, b }) => !b || a.verdict !== b.verdict || a.basis !== b.basis).length;
md += `\n${rows.length} checks; ${rows.length - changed} unchanged, ${changed} changed.\n`;
console.log(md);
