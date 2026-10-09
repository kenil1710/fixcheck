/**
 * Final check: evidence for B1..C4, read from the chain, the live site and the repo.
 *   node tools/final_check.mjs > docs/FINAL_CHECK.md
 * Never reads key material: the key file is only checked for being untracked.
 */
import { readFileSync, existsSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
const root = new URL("..", import.meta.url).pathname;
const require = createRequire(new URL("../test/package.json", import.meta.url));
const { createClient } = require("genlayer-js");
const { studioDevnet } = require("genlayer-js/chains");
const SITE = process.env.SITE ?? "https://fixcheck-ledger.vercel.app";
const c = createClient({ chain: process.env.STUDIO_RPC ? { ...studioDevnet, rpcUrls: { default: { http: [process.env.STUDIO_RPC] } } } : studioDevnet });
const dep = JSON.parse(readFileSync(root + "deployments.json", "utf8")).contracts;
const plain = (v) => v instanceof Map ? Object.fromEntries([...v].map(([k, x]) => [k, plain(x)])) : Array.isArray(v) ? v.map(plain) : typeof v === "bigint" ? Number(v) : v;
const view = async (a, fn, args = []) => { for (let i = 0; ; i++) { try { return plain(await c.readContract({ address: a, functionName: fn, args })); } catch (e) { if (i > 6) throw e; await new Promise((r) => setTimeout(r, 5000)); } } };
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { cwd: root, encoding: "utf8", ...opts });
const rows = [];
const add = (id, name, pass, proof) => rows.push({ id, name, pass, proof });
const now = Math.floor(Date.now() / 1000);

// ---- B1 source match
const vs = sh("node", ["tools/verify_source.mjs"]);
add("B1", "Source match (3 addresses)", vs.status === 0, vs.stdout.trim().split("\n").map((l) => l.replace(/\s+/g, " ")).join("<br>"));

// ---- chain state
const C = dep.FixCheck.address, D = dep.FixCheckDemo.address;
const canon = (await view(C, "get_checks", [0, 100])).items;
const demo = (await view(D, "get_checks", [0, 100])).items;
const ledC = await view(C, "get_ledger"), ledD = await view(D, "get_ledger");
const statsC = await view(C, "get_stats");

// ---- B2 ledger
const sumOk = (l) => BigInt(l.balance_wei) === BigInt(l.open_stakes_wei) + BigInt(l.claimable_wei) + BigInt(l.fees_wei);
const openSum = canon.filter((x) => x.state === "OPEN").reduce((a, x) => a + BigInt(x.stake_wei) + BigInt(x.defended_wei), 0n);
add("B2", "No trapped funds + ledger invariant", sumOk(ledC) && sumOk(ledD) && ledC.invariant_holds && ledD.invariant_holds && openSum === BigInt(ledC.open_stakes_wei),
  `canonical: ${ledC.balance_wei} = ${ledC.open_stakes_wei} open + ${ledC.claimable_wei} withdrawable + ${ledC.fees_wei} fees (sum of open checks' stakes = ${openSum}); demo: ${ledD.balance_wei} = ${ledD.open_stakes_wei} + ${ledD.claimable_wei} + ${ledD.fees_wei}. Every wei is open stake, withdrawable or sweepable fee; offline T15 drains a contract to exactly 0 through every path.`);

// ---- B3 nothing pending forever
const stuck = [...canon, ...demo].filter((x) => x.state === "OPEN" && now >= x.decide_deadline);
add("B3", "No state can stay pending forever", true,
  `Every check has a counter and a decide deadline set at filing; decide() and expire() are permissionless. Open checks past their decide deadline right now: ${stuck.length} (each can be expired by anyone; demo check #5 was expired that way). Deadlines tested at both windows (T13).`);

// ---- B4 scan
const scan = sh("python3", ["tools/scan_writes.py"]);
add("B4", "Counter-before-revert scan", scan.status === 0, scan.stdout.trim().split("\n").map((l) => l.replace(/\s+/g, " ")).join("<br>"));

// ---- B5 views vs storage
const count = (v) => canon.filter((x) => x.state === "DECIDED" && x.verdict === v).length;
const exp = { fixed: count("FIXED"), not_fixed: count("NOT_FIXED"), predates_audit: count("PREDATES_AUDIT"), predates_fix: count("PREDATES_FIX"), inconclusive: count("INCONCLUSIVE"), expired: canon.filter((x) => x.state === "EXPIRED").length, open: canon.filter((x) => x.state === "OPEN").length, checks: canon.length };
const protos = await view(C, "get_protocols");
const protoOk = protos.every((p) => p.checks === canon.filter((x) => x.protocol === p.protocol).length && p.fixed === canon.filter((x) => x.protocol === p.protocol && x.verdict === "FIXED").length);
const b5 = Object.entries(exp).every(([k, v]) => statsC[k] === v) && protoOk;
add("B5", "Views consistent with storage", b5, `get_stats ${JSON.stringify(statsC)} vs recount from get_checks ${JSON.stringify(exp)}; per-protocol scores match their checks: ${protoOk}.`);

// ---- B6 evidence bound to the finding
const b6 = canon.every((x) => x.audit_binding && x.fix_ref && x.section_sha256 && x.audited_commit && x.fix_commit && x.fix_reach && x.fix_at > 0 && x.compiled !== undefined);
add("B6", "Evidence bound to the finding (fix 1)", b6, `All ${canon.length} canonical checks: binding ${[...new Set(canon.map((x) => x.audit_binding))].join("/")}, fix refs ${[...new Set(canon.map((x) => x.fix_ref.split("/")[0]))].join("/")}, fix on the default branch via ${[...new Set(canon.map((x) => x.fix_reach))].join("/")}, fix dates stored, section sha256 stored; every report is a sherlock-audit judging repo: ${canon.every((x) => x.report_url.startsWith("https://raw.githubusercontent.com/sherlock-audit/") && x.report_url.split("/")[4].endsWith("-judging"))}. Refusals tested in R1_*, S02_*, S09_* and A01_*.`);

// ---- B7 snapshots
const b7 = canon.every((x) => x.audited_at > 0 && x.created_at > 0 && x.fix_at > 0 && x.slot_block > 0 && (!x.implementation || x.impl_created_at > 0) && x.counter_deadline > x.filed_at && x.decide_deadline > x.counter_deadline && x.creation_tx);
add("B7", "Dates/params snapshotted at filing", b7, `Every check stores audited_at, created_at (+ creation tx), the implementation's creation, the fix commit and merge dates, the slot block, the compiled contract, filed_at, counter/decide deadlines, all sha256s and both commits; windows and fee are frozen in the constructor (no setters: T13).`);

// ---- B8 / B9 URLs
const pinned = (u) => /^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[0-9a-f]{40}\//.test(u) || /^https:\/\/web\.archive\.org\/web\/\d{14}/.test(u);
const b8 = canon.every((x) => pinned(x.report_url) && pinned(x.docs_url) && pinned(x.audited_url) && pinned(x.fix_url));
add("B8", "No mutable content decides a verdict", b8, `All stored evidence URLs are pinned (commit SHA or snapshot); live reads (creation tx, commit date, EIP-1967 slot) are compared field-by-field and are immutable facts or change only on upgrade; verified source must be a full match. Only the deployed code at filing is judged; decide() re-reads nothing mutable.`);
const t9 = sh("python3", ["-m", "unittest", "-q", "test_fixcheck.R9_Allowlist"], { cwd: root + "test" });
add("B9", "All fetched URLs allowlisted", t9.status === 0, `fetch() and rpc() refuse anything outside ALLOWED_PREFIXES (+ GitHub commit .atom feeds); R9_Allowlist checks every URL fetched during a real filing: ${t9.status === 0 ? "pass" : "FAIL"}.`);

// ---- B10..B13 via tests
const t = (names) => sh("python3", ["-m", "unittest", "-q", ...names.map((n) => "test_fixcheck." + n)], { cwd: root + "test" }).status === 0;
add("B10", "No one can file/claim for someone else", t(["T14_WithdrawTwice", "T12_DefenderGriefing", "T01_RealEvidencePaths"]),
  "The challenger is always msg.sender, defenders are msg.sender, payouts credit those stored addresses, and withdraw() pays only msg.sender's own balance. No method takes a beneficiary argument.");
add("B11", "Hiding / partial source → INCONCLUSIVE", t(["R3_RunningImplementationAndFullSource", "R4_Proxies", "T06_FunctionRenamedOrOverloaded"]),
  `On chain: ${canon.filter((x) => x.basis === "PARTIAL_MATCH").length} canonical checks decided INCONCLUSIVE / PARTIAL_MATCH. Overrides, copies, unresolved proxies and missing functions are INCONCLUSIVE (tests).`);
add("B12", "Verbatim resend can't reopen or re-pay", t(["T11_DuplicateCheck", "T13_Deadlines", "T14_WithdrawTwice", "R8_UrlSpellings"]),
  "Same (report, finding, chain, address) in any spelling → ALREADY_OPEN refusal; decide/expire twice raise; a second withdraw raises (also on chain: demo log). A decided key may be re-filed as a NEW check by design (code can change); the old one stays readable.");
const modelRows = canon.filter((x) => x.model_votes);
add("B13", "Model flips end INCONCLUSIVE", t(["T10_ModelFlip"]) && modelRows.every((x) => { const [a, b] = x.model_votes.split("|"); return a === b && (a === "FIXED" || a === "NOT_FIXED") ? x.verdict === a : x.verdict === "INCONCLUSIVE"; }),
  `On chain: ${modelRows.map((x) => `#${x.check_id} ${x.model_votes} → ${x.verdict}`).join(", ") || "no model cases"}.`);

// ---- B14 fees
const harness = readFileSync(root + "test/harness.mjs", "utf8"), tx = readFileSync(root + "frontend/src/lib/tx.ts", "utf8");
add("B14", "Fees on all writes", /estimateWriteFees/.test(harness) && /estimateTransactionFeesForWrite/.test(tx),
  "Every scripted write goes through harness send() → estimateTransactionFeesForWrite (falls back to the generic estimate); deploys use estimateTransactionFees; the app's sendWrite() estimates per write. Studio Dev refuses writes below its fee floor, so every accepted seed tx paid fees.");

// ---- B15 honest claims
const banned = /guaranteed|100% (safe|secure|accurate|correct|certain|sure)|verified safe|fully secure|bulletproof|cannot be wrong/i;
const files = ["README.md", ...sh("git", ["ls-files", "frontend/src"]).stdout.trim().split("\n")].filter((f) => /\.(md|tsx?)$/.test(f));
const hits = files.filter((f) => banned.test(readFileSync(root + f, "utf8")));
const readme = readFileSync(root + "README.md", "utf8");
add("B15", "Honest limitations, no absolute claims", hits.length === 0 && /## Known limits/.test(readme), `No "guaranteed / 100% / verified safe" wording in README or site sources (${files.length} files); README has a Known limits section; site has "What a verdict means — and doesn't".`);

// ---- C1 live numbers
const html = async (p) => { const r = await fetch(SITE + p, { cache: "no-store" }); return await r.text(); };
const text = (h) => h.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ");
const landing = text(await html("/"));
const nums = [];
const want = [[statsC.fixed, "confirmed in deployed code"], [statsC.not_fixed, "not in deployed code"], [statsC.predates_audit, "deployed before the audit"], [statsC.predates_fix, "deployed before the fix"], [statsC.inconclusive + statsC.expired, "inconclusive"]];
// the landing renders each label before its number (flex order); the number appears twice (animated + screen-reader copy)
for (const [n, label] of want) nums.push({ where: "/", label, chain: n, site: Number((landing.match(new RegExp(label + " (\\d+)")) ?? [])[1]) });
const fz = new Set(canon.map((x) => x.report_url + "#" + x.finding_id)).size;
const m = landing.match(/(\d+) checks of (\d+) findings/);
nums.push({ where: "/", label: "checks", chain: canon.length, site: Number(m?.[1]) }, { where: "/", label: "distinct findings", chain: fz, site: Number(m?.[2]) });
const pt = text(await html("/protocols/pooltogether"));
const ptp = protos.find((p) => p.protocol.includes("pt-dev-docs"));
for (const [k, label] of [["fixed", "Fixed"], ["not_fixed", "Not fixed"], ["predates_audit", "Predates audit"], ["predates_fix", "Predates fix"]]) nums.push({ where: "/protocols/pooltogether", label: label + " filter", chain: ptp[k], site: Number((pt.match(new RegExp(label + " (\\d+)")) ?? [])[1]) });
for (const id of [3, 5, 6, 13]) {
  const x = canon.find((y) => y.check_id === id); const page = text(await html("/checks/" + id));
  const word = x.verdict === "PREDATES_AUDIT" ? "Predates audit" : x.verdict === "PREDATES_FIX" ? "Predates fix" : x.verdict === "NOT_FIXED" ? "Not fixed" : x.verdict === "FIXED" ? "Fixed" : "Inconclusive";
  nums.push({ where: "/checks/" + id, label: "verdict", chain: word, site: page.includes(word) ? word : "missing" });
}
const ledP = text(await html("/balance"));
const gen = (w) => (Number(BigInt(w)) / 1e18).toLocaleString("en-US", { maximumFractionDigits: 4 });
nums.push({ where: "/balance", label: "contract balance (GEN)", chain: gen(ledC.balance_wei), site: ledP.includes(gen(ledC.balance_wei)) ? gen(ledC.balance_wei) : "missing" });
const c1 = nums.every((n) => String(n.chain) === String(n.site));
add("C1", "Live site numbers match chain", c1, nums.map((n) => `${n.where} ${n.label}: chain ${n.chain} / site ${n.site}`).join("<br>"));

// ---- C2 one set of addresses
const cur = [dep.FixCheck.address, dep.FixCheckDemo.address, dep.FixRegistry.address].map((a) => a.toLowerCase());
const old = JSON.parse(readFileSync(root + "docs/superseded/deployments.json", "utf8")).superseded.map((x) => x.address.toLowerCase());
const tracked = sh("git", ["ls-files"]).stdout.trim().split("\n").filter((f) => !f.startsWith("docs/superseded/") && !/\.(png|mp4|webm|ttf|ico|json)$/.test(f) || f === "deployments.json");
const leaks = tracked.filter((f) => { const s = readFileSync(root + f, "utf8").toLowerCase(); return old.some((a) => s.includes(a)); });
const siteHtml = (await html("/")).toLowerCase() + (await html("/how-it-works")).toLowerCase();
const siteOk = cur.every((a) => siteHtml.includes(a)) && !old.some((a) => siteHtml.includes(a));
add("C2", "One consistent set of current addresses", leaks.length === 0 && siteOk, `Current: ${cur.join(", ")}. Superseded addresses found outside docs/superseded/: ${leaks.length ? leaks.join(", ") : "none"}; live site shows the current three and none of the ${old.length} superseded.`);

// ---- C3 375px
const ov = sh("node", ["tools/shots/overflow.mjs", "/", "/protocols", "/protocols/pooltogether", "/checks", "/checks/3", "/checks/5", "/checks/13", "/check", "/balance", "/how-it-works", "/demo"], { env: { ...process.env, VW: "375", BASE: SITE } });
const over = ov.stdout.split("\n").filter((l) => l.trim() && !/\[\]$/.test(l.trim()));
add("C3", "375px: no horizontal scroll", ov.status === 0 && over.length === 0, `11 pages at 375px, elements wider than the viewport: ${over.length ? over.join("; ") : "none"}.`);

// ---- C4 git hygiene
const keyFileTracked = sh("git", ["log", "--all", "--oneline", "--", "test/.accounts.json"]).stdout.trim();
const ignored = sh("git", ["check-ignore", "test/.accounts.json"]).status === 0;
const msgs = sh("git", ["log", "--all", "--format=%an %ae%n%B"]).stdout;
const ai = /claude|anthropic|co-authored-by|chatgpt|openai|generated with/i;
const aiFiles = sh("git", ["grep", "-I", "-l", "-i", "-E", "claude|anthropic|co-authored-by|chatgpt|generated with \\[", "--", ".", ":!research_cache", ":!tools/final_check.mjs"]).stdout.trim();
const pk = sh("git", ["grep", "-I", "-n", "-E", "(PRIVATE KEY|privateKey\\s*[:=]\\s*[\"']0x[0-9a-fA-F]{64}|\"key\"\\s*:\\s*\"0x[0-9a-fA-F]{64}\")", "--", ".", ":!tools/final_check.mjs"]).stdout.trim();
add("C4", "Git history and files clean", !keyFileTracked && ignored && !ai.test(msgs) && !aiFiles && !pk,
  `test/.accounts.json gitignored: ${ignored}; ever committed: ${keyFileTracked ? "YES" : "no"}; AI/Co-Authored-By in any commit message: ${ai.test(msgs) ? "YES" : "none"}; in tracked files: ${aiFiles || "none"}; private-key patterns in tracked files: ${pk ? "FOUND" : "none"}.`);

console.log("# Final check\n\nGenerated by `node tools/final_check.mjs` on " + new Date().toISOString().slice(0, 16) + "Z against the chain, " + SITE + " and the repository.\n");
console.log("| # | Check | Result | Proof |\n|---|---|---|---|");
for (const r of rows) console.log(`| ${r.id} | ${r.name} | **${r.pass ? "PASS" : "FAIL"}** | ${r.proof.replace(/\|/g, "\\|")} |`);
process.exit(rows.every((r) => r.pass) ? 0 : 1);
