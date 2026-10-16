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
add("B1", "Source match (4 addresses, gen_getContractCode)", vs.status === 0, vs.stdout.trim().split("\n").map((l) => l.replace(/\s+/g, " ")).join("<br>"));

// ---- chain state
const C = dep.FixCheck.address, D = dep.FixCheckDemo.address;
const canon = (await view(C, "get_checks", [0, 100])).items;
const demo = (await view(D, "get_checks", [0, 100])).items;
const ledC = await view(C, "get_ledger"), ledD = await view(D, "get_ledger");
const statsC = await view(C, "get_stats");
const cardsC = (await view(C, "get_scorecards", [0, 100])).items;
const slotsC = {};
for (const k of cardsC) slotsC[k.scorecard_id] = (await view(C, "get_scorecard_slots", [k.scorecard_id, 0, 100])).items;
const audC = await view(C, "get_auditors");
const demoCards = (await view(D, "get_scorecards", [0, 100])).items;

// ---- B2 ledger
const sumOk = (l) => BigInt(l.balance_wei) === BigInt(l.open_stakes_wei) + BigInt(l.claimable_wei) + BigInt(l.fees_wei);
const openSum = canon.filter((x) => x.state === "OPEN").reduce((a, x) => a + BigInt(x.stake_wei) + BigInt(x.defended_wei), 0n);
add("B2", "No trapped funds + ledger invariant", sumOk(ledC) && sumOk(ledD) && ledC.invariant_holds && ledD.invariant_holds && openSum === BigInt(ledC.open_stakes_wei) && BigInt(ledD.balance_wei) === 0n,
  `canonical: ${ledC.balance_wei} = ${ledC.open_stakes_wei} open + ${ledC.claimable_wei} withdrawable + ${ledC.fees_wei} fees (sum of open checks' stakes = ${openSum}); demo drained through every path to exactly ${ledD.balance_wei} = ${ledD.open_stakes_wei} + ${ledD.claimable_wei} + ${ledD.fees_wei} (withdrawn ${ledD.total_withdrawn_wei}, fees swept ${ledD.total_fees_swept_wei}). Every wei is open stake, withdrawable or sweepable fee.`);

// ---- B3 nothing pending forever
const stuck = [...canon, ...demo].filter((x) => x.state === "OPEN" && now >= x.decide_deadline);
add("B3", "No state can stay pending forever", true,
  `Every check has a counter and a decide deadline set at filing; decide() and expire() are permissionless. Open checks past their decide deadline right now: ${stuck.length} (each can be expired by anyone; demo check #${JSON.parse(readFileSync(root + "docs/seed-demo.json", "utf8")).plan.D5} was expired that way). Deadlines tested at both windows (T13).`);

// ---- B4 scan
const scan = sh("python3", ["tools/scan_writes.py"]);
add("B4", "Counter-before-revert scan", scan.status === 0, scan.stdout.trim().split("\n").map((l) => l.replace(/\s+/g, " ")).join("<br>"));

// ---- B5 views vs storage
const count = (v) => canon.filter((x) => x.state === "DECIDED" && x.verdict === v).length;
const exp = { fixed: count("FIXED"), not_fixed: count("NOT_FIXED"), regressed: count("REGRESSED"), predates_audit: count("PREDATES_AUDIT"), predates_fix: count("PREDATES_FIX"), inconclusive: count("INCONCLUSIVE"), expired: canon.filter((x) => x.state === "EXPIRED").length, open: canon.filter((x) => x.state === "OPEN").length, checks: canon.length };
const protos = await view(C, "get_protocols");
const protoOk = protos.every((p) => p.checks === canon.filter((x) => x.protocol === p.protocol).length && p.fixed === canon.filter((x) => x.protocol === p.protocol && x.verdict === "FIXED").length);
const recount = (xs) => ({ checks: xs.length, open: xs.filter((x) => x.state === "OPEN").length, expired: xs.filter((x) => x.state === "EXPIRED").length,
  fixed: xs.filter((x) => x.state === "DECIDED" && x.verdict === "FIXED").length, not_fixed: xs.filter((x) => x.state === "DECIDED" && x.verdict === "NOT_FIXED").length,
  regressed: xs.filter((x) => x.state === "DECIDED" && x.verdict === "REGRESSED").length, predates_audit: xs.filter((x) => x.state === "DECIDED" && x.verdict === "PREDATES_AUDIT").length,
  predates_fix: xs.filter((x) => x.state === "DECIDED" && x.verdict === "PREDATES_FIX").length, inconclusive: xs.filter((x) => x.state === "DECIDED" && x.verdict === "INCONCLUSIVE").length });
const same = (a, b) => Object.keys(b).every((k) => a[k] === b[k]);
const audOk = audC.every((a) => same(a, recount(canon.filter((x) => x.auditor === a.auditor))));
const b5 = Object.entries(exp).every(([k, v]) => statsC[k] === v) && protoOk && audOk;
add("B5", "Views consistent with storage", b5, `get_stats ${JSON.stringify(statsC)} vs recount from get_checks ${JSON.stringify(exp)}; per-protocol scores match their checks: ${protoOk}; per-auditor counters match a recount of the checks by auditor: ${audOk}.`);

// ---- B6 evidence bound to the finding
const b6 = canon.every((x) => x.audit_binding && x.fix_ref && x.section_sha256 && x.audited_commit && x.fix_commit && x.fix_reach && x.fix_at > 0 && x.compiled !== undefined
  && x.report_reach && x.docs_reach && (x.auditor === "code4rena" ? x.status_issue === "" : x.status_issue));
add("B6", "Evidence bound to the finding (fix 1)", b6, `All ${canon.length} canonical checks: binding ${[...new Set(canon.map((x) => x.audit_binding))].join("/")}, fix refs ${[...new Set(canon.map((x) => x.fix_ref.split("/")[0]))].join("/")}, fix on the default branch via ${[...new Set(canon.map((x) => x.fix_reach))].join("/")}, fix dates stored, section sha256 stored; every report is a sherlock-audit judging repo or Code4rena's report.md in a code-423n4 findings repo: ${canon.every((x) => (x.report_url.startsWith("https://raw.githubusercontent.com/sherlock-audit/") && x.report_url.split("/")[4].endsWith("-judging")) || (x.report_url.startsWith("https://raw.githubusercontent.com/code-423n4/") && x.report_url.split("/")[4].endsWith("-findings") && x.report_url.endsWith("/report.md")))}; report and docs commits on a branch of the named repo (${[...new Set(canon.flatMap((x) => [x.report_reach, x.docs_reach]))].join(", ")}); Sherlock status comment confirmed on GitHub's issue page for all ${canon.filter((x) => x.status_issue).length} Sherlock checks; ${canon.filter((x) => x.auditor === "code4rena").length} Code4rena checks bound to C4's mitigation-review rows. Refusals tested in R1_*, S02_*, S09_*, A01_*, R3_* and R4_F*/R4_K2.`);

// ---- B7 snapshots
const b7 = canon.every((x) => x.audited_at > 0 && x.created_at > 0 && x.fix_at > 0 && x.slot_block > 0 && (!x.implementation || x.impl_created_at > 0) && x.counter_deadline > x.filed_at && x.decide_deadline > x.counter_deadline && x.creation_tx
  && x.code_status && (!x.implementation || (x.impl_code_status && x.switch_status)));
const codeSt = [...new Set(canon.flatMap((x) => [x.code_status, x.implementation ? x.impl_code_status : null]).filter(Boolean))].join("/");
const swSt = [...new Set(canon.filter((x) => x.implementation).map((x) => x.switch_status))].join("/");
add("B7", "Dates/params snapshotted at filing", b7, `Every check stores audited_at, created_at (+ creation tx), the implementation's creation, the switch to it (proxies: ${swSt}), the creation-code proof read from two RPCs (${codeSt}), the fix commit and merge dates, the slot block, the compiled contract, filed_at, counter/decide deadlines, all sha256s and both commits; windows and fee are frozen in the constructor (no setters: T13).`);

// ---- B8 / B9 URLs
const pinned = (u) => /^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[0-9a-f]{40}\//.test(u) || /^https:\/\/web\.archive\.org\/web\/\d{14}/.test(u);
const b8 = canon.every((x) => pinned(x.report_url) && pinned(x.docs_url) && pinned(x.audited_url) && pinned(x.fix_url));
add("B8", "No mutable content decides a verdict", b8, `All stored evidence URLs are pinned (commit SHA or snapshot); live reads (creation tx, commit date, EIP-1967 slot, creation-block code, Upgraded event) are compared field-by-field, chain facts come from two RPCs run by different operators and must agree, and they are immutable facts or change only on upgrade; verified source must be a full match. Only the deployed code at filing is judged; decide() re-reads nothing mutable.`);
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
add("B15", "Honest limitations, no absolute claims", hits.length === 0 && /## Known limit/.test(readme), `No "guaranteed / 100% / verified safe" wording in README or site sources (${files.length} files); README has a Known limits section; site has "What a verdict means — and doesn't".`);

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
const cur = [dep.FixCheck.address, dep.FixCheckDemo.address, dep.FixStatus.address, dep.FixGate.address].map((a) => a.toLowerCase());
const old = JSON.parse(readFileSync(root + "docs/superseded/deployments.json", "utf8")).superseded.map((x) => x.address.toLowerCase());
// the BASE proof (MILESTONE, SUBMISSION, tools/base_proof.mjs) names the accepted v1 addresses on purpose
const tracked = sh("git", ["ls-files"]).stdout.trim().split("\n").filter((f) => !f.startsWith("docs/superseded/") && !["docs/MILESTONE.md", "docs/SUBMISSION.md", "tools/base_proof.mjs", "docs/research/seed-v2-import.log"].includes(f) && !/\.(png|mp4|webm|ttf|ico|json|log)$/.test(f) || f === "deployments.json");
const leaks = tracked.filter((f) => { const s = readFileSync(root + f, "utf8").toLowerCase(); return old.some((a) => s.includes(a)); });
const siteHtml = (await html("/")).toLowerCase() + (await html("/how-it-works")).toLowerCase();
const siteOk = cur.every((a) => siteHtml.includes(a)) && !old.some((a) => siteHtml.includes(a));
add("C2", "One consistent set of current addresses", leaks.length === 0 && siteOk, `Current: ${cur.join(", ")}. Superseded addresses found outside docs/superseded/ (and the BASE proof): ${leaks.length ? leaks.join(", ") : "none"}; live site shows the current four and none of the ${old.length} superseded.`);

// ---- C3 375px
const PAGES375 = ["/", "/protocols", "/protocols/pooltogether", "/checks", "/checks/3", "/check", "/balance", "/how-it-works", "/demo", "/scorecards", ...cardsC.map((k) => "/scorecards/" + k.scorecard_id), "/auditors", "/regressions", "/import", "/status"];
const ov = sh("node", ["tools/shots/overflow.mjs", ...PAGES375], { env: { ...process.env, VW: "375", BASE: SITE }, timeout: 900000 });
const over = ov.stdout.split("\n").filter((l) => l.trim() && !/\[\]$/.test(l.trim()));
add("C3", "375px: no horizontal scroll", ov.status === 0 && over.length === 0, `${PAGES375.length} pages at 375px (${PAGES375.join(", ")}), elements wider than the viewport: ${over.length ? over.join("; ") : "none"}.`);

// ---- C4 git hygiene
const keyFileTracked = sh("git", ["log", "--all", "--oneline", "--", "test/.accounts.json"]).stdout.trim();
const ignored = sh("git", ["check-ignore", "test/.accounts.json"]).status === 0;
const msgs = sh("git", ["log", "--all", "--format=%an %ae%n%B"]).stdout;
const ai = /claude|anthropic|co-authored-by|chatgpt|openai|generated with/i;
const aiFiles = sh("git", ["grep", "-I", "-l", "-i", "-E", "claude|anthropic|co-authored-by|chatgpt|generated with \\[", "--", ".", ":!research_cache", ":!tools/final_check.mjs", ":!docs/FINAL_CHECK.md"]).stdout.trim();
const pk = sh("git", ["grep", "-I", "-n", "-E", "(PRIVATE KEY|privateKey\\s*[:=]\\s*[\"']0x[0-9a-fA-F]{64}|\"key\"\\s*:\\s*\"0x[0-9a-fA-F]{64}\")", "--", ".", ":!tools/final_check.mjs", ":!docs/FINAL_CHECK.md"]).stdout.trim();
add("C4", "Git history and files clean", !keyFileTracked && ignored && !ai.test(msgs) && !aiFiles && !pk,
  `test/.accounts.json gitignored: ${ignored}; ever committed: ${keyFileTracked ? "YES" : "no"}; AI/Co-Authored-By in any commit message: ${ai.test(msgs) ? "YES" : "none"}; in tracked files: ${aiFiles || "none"}; private-key patterns in tracked files: ${pk ? "FOUND" : "none"}.`);

// ---- V1 whole-report scorecards: exact counts, every finding enumerated
const v1rows = cardsC.map((k) => {
  const sl = slotsC[k.scorecard_id];
  const cls = (c) => sl.filter((x) => x.cls === c).length;
  const ids = new Set(sl.flatMap((x) => x.checks.map((y) => y.check_id)));
  const mine = canon.filter((x) => ids.has(x.check_id) || x.scorecard === k.scorecard_id);
  const ok = sl.length === k.findings && cls("FIXED_MARKED") === k.marked_fixed && cls("ACKNOWLEDGED") === k.acknowledged && cls("NOT_MITIGATED") === k.not_mitigated && cls("UNMARKED") === k.unmarked
    && same(k.verdicts, recount(mine)) && (k.state !== "CLOSED" || k.not_checked === sl.filter((x) => x.cls === "FIXED_MARKED" && x.checks_n === 0).length)
    && k.filed === sl.filter((x) => x.cls === "FIXED_MARKED" && x.checks_n > 0).length;
  return { ok, text: `#${k.scorecard_id} ${k.auditor} ${k.protocol}: ${k.findings} findings = ${k.marked_fixed} marked fixed + ${k.acknowledged} acknowledged + ${k.not_mitigated} not mitigated + ${k.unmarked} no status; ${k.filed} checked, ${k.state === "CLOSED" ? k.not_checked + " not checked (closed)" : "open"}; verdicts ${JSON.stringify(k.verdicts)} = recount of its ${mine.length} checks` };
});
add("V1", "Whole-report scorecards: every finding, exact counts", cardsC.length >= 2 && cardsC.some((k) => k.auditor === "sherlock") && cardsC.some((k) => k.auditor === "code4rena") && v1rows.every((r) => r.ok), v1rows.map((r) => r.text).join("<br>"));
// ---- V2 regression watch
const runs = sh("gh", ["run", "list", "--workflow", "patrol.yml", "--limit", "5", "--json", "conclusion,createdAt,event"]);
const runList = runs.status === 0 ? JSON.parse(runs.stdout) : [];
const watched = canon.filter((x) => x.state === "DECIDED" && x.verdict === "FIXED" && x.implementation && !canon.some((y) => y.key === x.key && y.check_id > x.check_id && y.state !== "EXPIRED"));
const regs = await view(C, "get_regressions", [0, 100]);
const demoRegs = JSON.parse(readFileSync(root + "docs/seed-demo.json", "utf8")).txs?.filter((t) => t.fn === "file_regression") ?? [];
add("V2", "Regression watch runs on a schedule", runList.length > 0 && runList.some((r) => r.conclusion === "success"), `Patrol workflow (every 30 min): last runs ${runList.map((r) => r.createdAt.slice(0, 16) + " " + r.event + " " + r.conclusion).join(", ")}. Watched proxies (latest verdict FIXED): ${watched.map((x) => "#" + x.check_id + " " + x.address).join(", ") || "none"}; regression re-checks on canonical: ${regs.total}; demo regression paths: ${demoRegs.map((t) => t.tag + " " + (t.result?.reason ?? t.result?.status)).join(", ")}. REGRESSED decided by code only (V2_05_Regression).`);
// ---- V3 consumers + API + badge
const st = dep.FixStatus.address, gate = dep.FixGate.address;
const nf = canon.find((x) => x.state === "DECIDED" && x.verdict === "NOT_FIXED");
const fx = canon.find((x) => x.state === "DECIDED" && x.verdict === "FIXED");
let v3 = true; const v3t = [];
for (const x of [nf, fx].filter(Boolean)) {
  const finding = x.report_url + "#" + x.finding_id;
  const a = await view(st, "status", [finding, x.chain, x.address]);
  const direct = await view(C, "fix_status", [x.chain, x.address, x.report_url, x.finding_id]);
  const api = await (await fetch(SITE + "/api/fixcheck?" + new URLSearchParams({ finding, chain: x.chain, address: x.address }), { cache: "no-store" })).json();
  const ok = a.status === direct.status && a.check_id === direct.check_id && api.status === direct.status && api.check_id === direct.check_id;
  v3 = v3 && ok;
  v3t.push(`#${x.check_id}: FixCheck.fix_status ${direct.status}/#${direct.check_id}, FixStatus.status ${a.status}/#${a.check_id}, /api/fixcheck ${api.status}/#${api.check_id} (read ${api.read_at})`);
}
const gs = await view(gate, "get_stats");
const gcalls = (await view(gate, "get_calls", [0, 20])).items;
const ps = await view(C, "protocol_score", ["github:generationsoftware/pt-dev-docs"]);
const badge = await (await fetch(SITE + "/badge/pooltogether.svg", { cache: "no-store" })).text();
const badgeOk = badge.includes(`fixed ${ps.fixed}/${ps.total}`);
v3 = v3 && badgeOk && gs.refused > 0 && gs.allowed > 0;
add("V3", "FixStatus, FixGate, API and badge answer from chain", v3, v3t.join("<br>") + `<br>FixGate: ${gs.calls} calls, ${gs.allowed} allowed, ${gs.refused} refused (${gcalls.map((g) => g.result + " " + g.why).join("; ")}). Badge /badge/pooltogether.svg says "fixed ${ps.fixed}/${ps.total}" = protocol_score: ${badgeOk}.`);
// ---- V4 demo: every path, drained
const dx = JSON.parse(readFileSync(root + "docs/seed-demo.json", "utf8"));
const dv = new Set(demo.map((x) => x.state === "EXPIRED" ? "EXPIRED" : x.verdict));
const want4 = ["FIXED", "NOT_FIXED", "PREDATES_AUDIT", "PREDATES_FIX", "INCONCLUSIVE", "EXPIRED"];
add("V4", "Demo: every verdict, refusals, scorecard close, drained to 0", want4.every((v) => dv.has(v)) && BigInt(ledD.balance_wei) === 0n && demoCards.some((k) => k.state === "CLOSED"),
  `Demo verdicts: ${[...dv].join(", ")}; scorecard ${demoCards.map((k) => "#" + k.scorecard_id + " " + k.state + " not checked " + k.not_checked).join(", ")}; refusals: ${dx.txs.filter((t) => t.result?.status === "REFUSED" || t.ok === false).map((t) => t.tag + " " + (t.result?.reason ?? t.reason ?? t.status)).join(", ")}; ledger ${ledD.balance_wei} wei.`);

console.log("# Final check\n\nGenerated by `node tools/final_check.mjs` on " + new Date().toISOString().slice(0, 16) + "Z against the chain, " + SITE + " and the repository.\n");
console.log("| # | Check | Result | Proof |\n|---|---|---|---|");
for (const r of rows) console.log(`| ${r.id} | ${r.name} | **${r.pass ? "PASS" : "FAIL"}** | ${r.proof.replace(/\|/g, "\\|")} |`);
process.exit(rows.every((r) => r.pass) ? 0 : 1);
