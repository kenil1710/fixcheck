/**
 * Writes docs/SEEDS.md from the chain (v2 canonical + demo), and the README's
 * results and seeds sections (between their markers).
 *   node tools/seeds_md.mjs
 * Every number is a contract read made by this script; the v1 column of the
 * before/after table is docs/superseded/seed-canonical-v1.5.json (the chain
 * state of the accepted v1 deployment, as committed at BASE 27f30c0).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(new URL("../test/package.json", import.meta.url));
const { createClient } = require("genlayer-js");
const { studioDevnet } = require("genlayer-js/chains");
const root = new URL("..", import.meta.url).pathname;
const dep = JSON.parse(readFileSync(root + "deployments.json", "utf8")).contracts;
const seeds = JSON.parse(readFileSync(root + "docs/research/seeds.json", "utf8"));
const SITE = "https://fixcheck-ledger.vercel.app";
const EXPLORER = "https://explorer-studio-dev.genlayer.com";
const c = createClient({ chain: process.env.STUDIO_RPC ? { ...studioDevnet, rpcUrls: { default: { http: [process.env.STUDIO_RPC] } } } : studioDevnet });
const plain = (v) => v instanceof Map ? Object.fromEntries([...v].map(([k, x]) => [k, plain(x)])) : Array.isArray(v) ? v.map(plain) : typeof v === "bigint" ? Number(v) : v;
const view = async (address, functionName, args = []) => { for (let i = 0; ; i++) { try { return plain(await c.readContract({ address, functionName, args })); } catch (e) { if (i > 6) throw e; await new Promise((r) => setTimeout(r, 5000)); } } };
const gen = (w) => (Number(BigInt(w)) / 1e18).toLocaleString("en-US", { maximumFractionDigits: 4 });
const day = (t) => (t ? new Date(Number(t) * 1000).toISOString().slice(0, 10) : "—");
const verdict = (x) => x.state === "OPEN" ? "open" : x.state === "EXPIRED" ? "EXPIRED (refunded)" : x.verdict;
const C = dep.FixCheck.address, D = dep.FixCheckDemo.address;
const canon = (await view(C, "get_checks", [0, 100])).items.sort((a, b) => a.check_id - b.check_id);
const demo = (await view(D, "get_checks", [0, 100])).items.sort((a, b) => a.check_id - b.check_id);
const stats = await view(C, "get_stats"), led = await view(C, "get_ledger"), dled = await view(D, "get_ledger");
const cards = (await view(C, "get_scorecards", [0, 100])).items.sort((a, b) => a.scorecard_id - b.scorecard_id);
const auditors = await view(C, "get_auditors");
const slots = {};
for (const k of cards) slots[k.scorecard_id] = (await view(C, "get_scorecard_slots", [k.scorecard_id, 0, 100])).items;
const protoName = (p) => ({ "github:generationsoftware/pt-dev-docs": "PoolTogether V5", "github:mellow-finance/docs": "Mellow Flexible Vaults", "github:cap-labs-dev/cap-docs": "Cap", "github:ethereum-optimism/superchain-registry": "OP Stack fault proofs" }[p] ?? p);
const aud = (a) => ({ sherlock: "Sherlock", code4rena: "Code4rena" }[a] ?? a);

// ---- scorecards
let cardsMd = "";
for (const k of cards) {
  const v = k.verdicts;
  cardsMd += `### Scorecard #${k.scorecard_id} — ${protoName(k.protocol)}, ${aud(k.auditor)} ([page](${SITE}/scorecards/${k.scorecard_id}))\n\n`;
  cardsMd += `Report: ${k.report_url}\n\n`;
  cardsMd += `| Findings in the report | Marked fixed | Acknowledged | Not fully mitigated | No status | Checked | Not checked | State |\n|---|---|---|---|---|---|---|---|\n`;
  cardsMd += `| ${k.findings} | ${k.marked_fixed} | ${k.acknowledged} | ${k.not_mitigated} | ${k.unmarked} | ${k.filed} | ${k.state === "CLOSED" ? k.not_checked : k.marked_fixed - k.filed + " (until close)"} | ${k.state}${k.state === "CLOSED" ? " " + new Date(k.closed_at * 1000).toISOString().slice(0, 16) + "Z" : ""} |\n\n`;
  cardsMd += `Checks filed into its slots, by verdict: **${v.fixed} fixed**, **${v.not_fixed} not fixed**, ${v.regressed} regressed, ${v.predates_audit} predates audit, ${v.predates_fix} predates fix, ${v.inconclusive} inconclusive, ${v.expired} expired, ${v.open} open (${v.checks} checks).\n\n`;
  cardsMd += `| Finding | Report says | Checks |\n|---|---|---|\n`;
  for (const s of slots[k.scorecard_id]) cardsMd += `| ${s.finding_id} | ${s.cls} | ${s.checks.map((y) => `[#${y.check_id}](${SITE}/checks/${y.check_id}) ${y.state === "DECIDED" ? y.verdict : y.state} (${y.chain})`).join(", ") || (s.cls === "FIXED_MARKED" ? (s.outcome || "no check yet") : "—")} |\n`;
  cardsMd += "\n";
}

// ---- before / after for the 22 v1 checks
const before = JSON.parse(readFileSync(root + "docs/superseded/seed-canonical-v1.5.json", "utf8")).items;
const key = (x) => `${x.report_url.toLowerCase()}#${x.finding_id}@${x.chain}:${x.address.toLowerCase()}`;
const v = (x) => x ? (x.state === "OPEN" ? "open" : x.state === "EXPIRED" ? "EXPIRED" : x.verdict) + (x.basis ? ` (${x.basis})` : "") : "—";
let ba = `| v1 # | Finding | Chain | v1 (BASE \`27f30c0\`, deployment \`8519168\`) | v2 # | v2 (\`${dep.FixCheck.commit.slice(0, 7)}\`) | Change |\n|---|---|---|---|---|---|---|\n`;
let unchanged = 0, changed = 0;
for (const b of before.sort((x, y) => x.check_id - y.check_id)) {
  const a = [...canon].reverse().find((x) => key(x) === key(b) && x.state !== "EXPIRED") ?? canon.find((x) => key(x) === key(b));
  const s = seeds.find((x) => key({ ...x, address: x.address }) === key(b));
  const same = a && a.state === "DECIDED" && a.verdict === b.verdict && a.basis === b.basis;
  if (same) unchanged++; else changed++;
  ba += `| ${b.check_id} | ${s?.protocol ?? protoName(b.protocol)} ${b.finding_id} \`${b.function}\` | ${b.chain} | ${v(b)} | ${a ? `[${a.check_id}](${SITE}/checks/${a.check_id})` : "—"} | ${v(a)} | ${same ? "unchanged" : !a ? "not filed" : a.state === "OPEN" ? "still open" : "CHANGED — see below"} |\n`;
}
ba += `\n${before.length} v1 checks re-run on v2: **${unchanged} unchanged**, ${changed} changed or not yet decided.\n`;

// ---- canonical table
let md = `# Seeds\n\nRead from the chain by \`tools/seeds_md.mjs\` on ${new Date().toISOString().slice(0, 16)}Z. Every value comes from contract state.\n\n`;
md += `## Canonical — ${C}\n\n${stats.checks} checks · **${stats.fixed} fixed** · **${stats.not_fixed} not fixed** · ${stats.regressed} regressed · **${stats.predates_audit} predates audit** · **${stats.predates_fix} predates fix** · ${stats.inconclusive} inconclusive · ${stats.expired} expired · ${stats.open} open · ${stats.scorecards} scorecards · ${stats.regressions} regression re-checks. Ledger: balance ${gen(led.balance_wei)} = open ${gen(led.open_stakes_wei)} + withdrawable ${gen(led.claimable_wei)} + fees ${gen(led.fees_wei)} GEN (invariant ${led.invariant_holds ? "holds" : "BROKEN"}).\n\n`;
md += `Per auditor: ${auditors.map((a) => `${aud(a.auditor)} — ${a.scorecards} scorecards, ${a.checks} checks: ${a.fixed} fixed, ${a.not_fixed} not fixed, ${a.regressed} regressed, ${a.predates_audit} predates audit, ${a.predates_fix} predates fix, ${a.inconclusive} inconclusive, ${a.expired} expired, ${a.open} open`).join("; ")}.\n\n`;
md += `## Whole-report scorecards\n\n${cardsMd}`;
md += `## The 22 v1 checks, re-run on v2 (before / after)\n\n${ba}\n`;
md += `## Every canonical check\n\n| # | Auditor | Protocol | Finding | Function | Chain | Address (created · fix existed) | Scorecard | Verdict | Basis | Model (asked twice) | Stakes (not fixed / fixed) |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
for (const x of canon) md += `| [${x.check_id}](${SITE}/checks/${x.check_id}) | ${aud(x.auditor)} | ${protoName(x.protocol)} | [${x.finding_id}](${x.report_url}) | \`${x.function}\` | ${x.chain} | \`${x.address}\`${x.implementation ? " → `" + x.implementation + "`" : ""} ${day(x.created_at)} · ${day(x.fix_at)} | ${x.scorecard ? "#" + x.scorecard : "—"} | **${verdict(x)}** | ${x.basis} | ${x.model_votes || "not asked"} | ${gen(x.stake_wei)} / ${gen(x.defended_wei)} |\n`;

// ---- demo
const dj = JSON.parse(readFileSync(root + "docs/seed-demo.json", "utf8"));
const TAGS = { S0: "import the PoolTogether Sherlock report (whole)", D1: "NOT FIXED: challenger wins", D4: "FIXED, no defender: refund minus 2% fee", D8: "PREDATES AUDIT: refund", D9: "PREDATES FIX: refund", D2: "FIXED: defender wins", D3: "INCONCLUSIVE: function not in that contract", D6: "model path", D10: "Code4rena H-06: FIXED by code", D11: "FIXED on a real Mellow proxy", R1: "regression re-file, proxy unchanged: refused", R2a: "regression re-file of a non-proxy: refused", R2b: "regression re-file of a NOT_FIXED check: refused", D7: "unpinned report: refused", I1: "import under another protocol's docs: refused", D5: "expiry: everyone refunded", S1: "close the scorecard: unchecked slots NOT_CHECKED", DRAIN: "sweep and withdraw" };
md += `\n## Demo — ${D}\n\n90 s counter window, 300 s decide window, 10 min scorecard filing; same source. Every transaction:\n\n| Step | Path | Call | Result | Transaction |\n|---|---|---|---|---|\n`;
for (const t of dj.txs ?? []) md += `| ${t.tag} | ${TAGS[t.tag] ?? ""} | \`${t.fn}\`${t.check_id ? " #" + t.check_id : ""}${t.prior ? " (prior #" + t.prior + ")" : ""} | ${t.result?.status === "REFUSED" ? "REFUSED " + t.result.reason : t.result?.code_says ? "code says " + t.result.code_says : t.reason ? "reverted: " + t.reason : t.status} | ${t.hash ? `[${t.hash.slice(0, 12)}…](${EXPLORER}/tx/${t.hash})` : "—"} |\n`;
md += `\n| # | Finding | Verdict | Basis | Payout |\n|---|---|---|---|---|\n`;
for (const x of demo) md += `| [${x.check_id}](${SITE}/demo/checks/${x.check_id}) | ${x.finding_id} \`${x.function}\` (${x.chain}) | ${verdict(x)} | ${x.basis} | challenger ${gen(x.challenger_paid_wei)} GEN, fee ${gen(x.fee_paid_wei)} GEN |\n`;
md += `\nDemo ledger after the drain: balance ${dled.balance_wei} wei = open ${dled.open_stakes_wei} + withdrawable ${dled.claimable_wei} + fees ${dled.fees_wei} (invariant ${dled.invariant_holds ? "holds" : "BROKEN"}); withdrawn ${gen(dled.total_withdrawn_wei)} GEN, fees swept ${gen(dled.total_fees_swept_wei)} GEN. Raw: \`docs/seed-demo.json\`, \`docs/seed-canonical.json\`.\n`;
writeFileSync(root + "docs/SEEDS.md", md);

// ---- README results + seeds
const rd = readFileSync(root + "README.md", "utf8");
const res = `On the canonical contract (read from chain by \`tools/seeds_md.mjs\`): **${stats.checks} checks**, **${stats.scorecards} whole-report scorecards** (${cards.map((k) => `${protoName(k.protocol)} · ${aud(k.auditor)}: ${k.findings} findings, ${k.marked_fixed} marked fixed, ${k.filed} checked, ${k.verdicts.fixed} confirmed fixed, ${k.verdicts.not_fixed} not fixed${k.state === "CLOSED" ? `, ${k.not_checked} not checked` : ""}`).join("; ")}).\n\n` +
  `* **Fixed in deployed code** — ${stats.fixed} checks: the deployed function is the fix's, or holds the fix in place (incl. Code4rena findings and a real Mellow proxy, now watched for upgrades).\n` +
  `* **Not fixed** — ${stats.not_fixed}: the deployed function is still the audited version on code deployed *after the fix existed* (PoolTogether's Ethereum vault, created 2024-08-19; its fix was merged on 2024-06-28).\n` +
  `* **Predates audit** — ${stats.predates_audit}; **Predates fix** — ${stats.predates_fix}: the audited code runs on contracts deployed before the audit (or before the fix existed) and not upgradeable, so the fix could not be there. FixCheck says so instead of calling them "not fixed".\n` +
  `* **Inconclusive** — ${stats.inconclusive}: code could not prove which function runs (partially verified source) or the model's answers did not point at the fix. Everyone is refunded.\n` +
  `* **Regressed** — ${stats.regressed}: no watched proxy has been upgraded back to the audited code.\n` +
  `* **Not checked** — every finding a report marks fixed that nobody filed a check for, counted per scorecard.\n\n` +
  `The 22 checks of 21 findings from v1 (PoolTogether M-1 on two chains) were re-run on v2: ${unchanged} of 22 unchanged ([before/after](docs/SEEDS.md#the-22-v1-checks-re-run-on-v2-before--after)).`;
let out = rd.replace(/<!-- RESULTS:BEGIN -->[\s\S]*<!-- RESULTS:END -->/, `<!-- RESULTS:BEGIN -->\n${res}\n<!-- RESULTS:END -->`);
let t = "| # | Auditor | Protocol | Finding | Function | Chain | Verdict | Basis |\n|---|---|---|---|---|---|---|---|\n";
for (const x of canon) t += `| [${x.check_id}](${SITE}/checks/${x.check_id}) | ${aud(x.auditor)} | ${protoName(x.protocol)} | ${x.finding_id} | \`${x.function}\` | ${x.chain} | **${verdict(x)}** | ${x.basis} |\n`;
out = out.replace(/<!-- SEEDS:BEGIN -->[\s\S]*<!-- SEEDS:END -->/, `<!-- SEEDS:BEGIN -->\nEvery canonical check, read from chain:\n\n${t.trimEnd()}\n<!-- SEEDS:END -->`);
writeFileSync(root + "README.md", out);
console.log(`checks ${stats.checks}, scorecards ${cards.length}, v1 re-run: ${unchanged} unchanged / ${changed} changed`);
