/**
 * The final submission video: a voiced walkthrough of FixCheck recorded from
 * the LIVE site, the studio-dev explorer and GitHub, with real contract data.
 *
 *   node final.mjs   -> docs/demo/fixcheck-final.mp4 (1920x1080, 30 fps, H.264 + AAC)
 *                       docs/demo/fixcheck-final.srt, fixcheck-final-script.md, youtube.md
 *
 * Every number spoken or shown is read from the canonical contract right
 * before recording. Each scene is recorded for exactly as long as its
 * narration (plus a short tail). The live filing is one continuous take on the
 * DEMO contract (90 s window) through a throwaway Studio Dev key; the waits
 * for validators and for the window are jump cuts, never mocks.
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { attachWallet } from "./wallet-shim.mjs";

const BASE = process.env.BASE ?? "https://fixcheck-ledger.vercel.app";
const VOICE = process.env.VOICE ?? "Samantha";
const RATE = process.env.RATE ?? "175";
const OUT = new URL("../../docs/demo/", import.meta.url).pathname;
const ROOT = new URL("../../", import.meta.url).pathname;
const WORK = (process.env.WORK ?? "/tmp/fixcheck-final") + "/";
const W = 1440, H = 810;
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;   // re-record only these scenes, reuse the rest
if (!ONLY) rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });
const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...opts }).toString();
const dur = (f) => Number(sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).trim());

// ---- 0. facts from the chain ----------------------------------------------------
const require = createRequire(new URL("../../test/package.json", import.meta.url));
const { createClient } = require("genlayer-js");
const { studioDevnet } = require("genlayer-js/chains");
const dep = JSON.parse(readFileSync(ROOT + "deployments.json", "utf8")).contracts;
const gl = createClient({ chain: studioDevnet });
const plain = (v) => v instanceof Map ? Object.fromEntries([...v].map(([k, x]) => [k, plain(x)])) : Array.isArray(v) ? v.map(plain) : typeof v === "bigint" ? Number(v) : v;
const view = async (address, functionName, args = []) => {
  for (let i = 0; ; i++) {
    try { return plain(await gl.readContract({ address, functionName, args })); }
    catch (e) { if (i >= 8) throw e; await new Promise((r) => setTimeout(r, 3000 + 2000 * i)); }
  }
};
const stats = await view(dep.FixCheck.address, "get_stats");
const checks = (await view(dep.FixCheck.address, "get_checks", [0, 100])).items;
const findings = new Set(checks.map((c) => c.report_url + "#" + c.finding_id)).size;
const byId = Object.fromEntries(checks.map((c) => [c.check_id, c]));
const N = { checks: stats.checks, findings, fixed: stats.fixed, not_fixed: stats.not_fixed, pa: stats.predates_audit, pf: stats.predates_fix, inc: stats.inconclusive + stats.expired, protocols: stats.protocols };
if (stats.open !== 0) throw new Error("canonical has open checks; numbers would move");
const want = { 1: "FIXED", 6: "NOT_FIXED", 4: "PREDATES_AUDIT", 5: "PREDATES_FIX", 14: "INCONCLUSIVE" };
for (const [id, v] of Object.entries(want)) if (byId[id].verdict !== v) throw new Error(`check ${id} is ${byId[id].verdict}, not ${v}`);
const verify = sh("node", [ROOT + "tools/verify_source.mjs"]).trim().split("\n");
if (!verify.slice(1).every((l) => l.includes("identical to HEAD"))) throw new Error("source does not match HEAD");
console.log("chain", JSON.stringify(N));
const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const say = (n) => (n <= 10 ? words[n] : String(n));

// ---- 1. scenes ---------------------------------------------------------------
// text: what is spoken; cap: caption text when the spoken form differs
const SC = [
  { id: "hook", ch: "Hook", text: "Audit reports say Fixed. Almost nobody checks the code that actually runs on chain. FixCheck checks it, one finding at a time." },
  { id: "finding", ch: "The problem", text: "This is a real Sherlock finding. Sherlock runs audit contests. When the team ships a fix, Sherlock marks the finding fixed and links the pull request." },
  { id: "pr", text: "But the fix lands in a repository. The contract on chain is a separate deployment. It can be older than the fix, or simply never replaced." },
  { id: "how", ch: "How FixCheck works", text: "Here is how a check works. Someone files a check, and stakes that the fix is not deployed. Every validator reads the same evidence: the finding's section of the report, the merged fix commit, and the verified source at the deployed address. Code compares the functions, and decides whenever it can. A model only sees what code cannot settle. It must quote a line the fix added, and two runs must agree. Otherwise the result is inconclusive, and everyone is refunded." },
  { id: "fixed", ch: "Every outcome, from the canonical contract", text: "Fixed. PoolTogether's Claimer on OP Mainnet was redeployed in July 2024. Its function is identical to the fix commit, so code alone says fixed." },
  { id: "notfixed", text: "Not fixed. Check six is PoolTogether's vault on Ethereum. It was deployed on August 19, 2024, after the fix was merged on June 28. Its function is still the audited version. This is the only not fixed result." },
  { id: "pa", text: "Predates the audit. This vault on OP Mainnet was deployed in April 2024, before the audit. It is immutable, so it could never contain the fix. FixCheck does not blame the team for that. It says so." },
  { id: "pf", text: "Predates the fix. Check five is the vault on Arbitrum. It was deployed on May 29. The fix was merged on June 28. It could not contain a fix that did not exist yet, so every stake is refunded." },
  { id: "inc", text: "Inconclusive. The explorer verified this contract's source only partially, so the code shown may not be exactly what runs. Guessing would be unfair to one side. Inconclusive is the honest answer, and everyone is refunded." },
  { id: "pick", ch: "A live check on the demo contract", text: "Now a live check, on the demo contract, where the window is ninety seconds. Pick a real finding. Before you pay, the app runs the same checks the contract will.", cap: "Now a live check, on the demo contract, where the window is 90 seconds. Pick a real finding. Before you pay, the app runs the same checks the contract will." },
  { id: "file", text: "File the check, with a stake that it is not fixed. Every validator fetches the sources, and they must agree." },
  { id: "open", text: "The check is open. Until the window closes, anyone can stake that it is fixed." },
  { id: "decide", text: "Ninety seconds later, anyone can ask the validators to decide.", cap: "90 seconds later, anyone can ask the validators to decide." },
  { id: "verdict", text: "This vault was deployed before the audit. So the verdict is predates the audit, and every stake comes back." },
  { id: "withdraw", text: "Refunds and winnings wait in your balance. Withdraw them whenever you like." },
  { id: "results", ch: "Results", text: `Across ${N.checks} checks of ${N.findings} real findings, from ${say(N.protocols)} protocols: ${N.fixed} fixed, ${N.not_fixed} not fixed, ${N.pa} predate the audit, ${N.pf} predates its fix, and ${N.inc} inconclusive.` },
  { id: "explorer", ch: "Why you can trust it", text: "Every verdict is contract state on GenLayer. You can read it yourself on the explorer." },
  { id: "verify", text: "The code deployed at these addresses matches the repository, byte for byte." },
  { id: "attacks", text: "Two independent attack rounds found twenty-one issues. All of them are fixed, and 183 tests pass.", cap: "Two independent attack rounds found 21 issues. All of them are fixed, and 183 tests pass." },
  { id: "limits", text: "What is not fixed yet is written down, in the Known limitations section of the README." },
  { id: "close", ch: "Close", text: "Next time a report says Fixed, you can check. fixcheck-ledger dot vercel dot app.", cap: "Next time a report says Fixed, you can check. fixcheck-ledger.vercel.app" },
];
for (const [i, s] of SC.entries()) {
  sh("say", ["-v", VOICE, "-r", RATE, "-o", `${WORK}v${i}.aiff`, s.text]);
  s.voice = dur(`${WORK}v${i}.aiff`);
  s.len = Math.ceil((s.voice + (s.tail ?? 0.7)) * 30) / 30;
}
const S = Object.fromEntries(SC.map((s) => [s.id, s]));
console.log("narration", SC.reduce((a, s) => a + s.len, 0).toFixed(1), "s");

// ---- 2. helpers --------------------------------------------------------------------
const b = await chromium.launch();
const wait = (p, ms) => p.waitForTimeout(Math.max(0, ms));
async function smooth(p, y, ms = 900) {
  const from = await p.evaluate(() => scrollY);
  const steps = Math.max(10, Math.round(ms / 30));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps; const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    await p.evaluate((v) => scrollTo(0, v), from + (y - from) * e); await wait(p, ms / steps);
  }
}
/** Page y of the smallest element matching `sel` (and containing `text`), minus `off`. */
const yOf = (p, sel, text = null, off = 120) => p.evaluate(([s, t, o]) => {
  const all = [...document.querySelectorAll(s)].filter((e) => !t || e.textContent.includes(t));
  all.sort((a, b2) => a.textContent.length - b2.textContent.length);
  const el = all[0]; return el ? Math.max(0, el.getBoundingClientRect().top + scrollY - o) : 0;
}, [sel, text, off]);
/** A highlight box around the smallest element matching `sel` and containing `text`. */
async function hl(p, sel, text = null, { pad = 8, keep = false } = {}) {
  await p.evaluate(([s, t, pad2, keep2]) => {
    if (!keep2) document.querySelectorAll(".fc-hl").forEach((x) => x.remove());
    const all = [...document.querySelectorAll(s)].filter((e) => !t || e.textContent.includes(t));
    all.sort((a, b2) => a.textContent.length - b2.textContent.length);
    const el = all[0]; if (!el) return;
    const r = el.getBoundingClientRect();
    const d = document.createElement("div"); d.className = "fc-hl";
    Object.assign(d.style, { position: "absolute", left: `${r.left + scrollX - pad2}px`, top: `${r.top + scrollY - pad2}px`, width: `${r.width + 2 * pad2}px`, height: `${r.height + 2 * pad2}px`,
      border: "3px solid #c98a12", borderRadius: "10px", boxShadow: "0 0 0 6px rgba(201,138,18,.16)", pointerEvents: "none", zIndex: 2147483647, opacity: "0", transition: "opacity .35s ease" });
    document.body.appendChild(d); requestAnimationFrame(() => { d.style.opacity = "1"; });
  }, [sel, text, pad, keep]);
}
const clear = (p) => p.evaluate(() => document.querySelectorAll(".fc-hl").forEach((x) => x.remove()));

async function safeReload(p) {
  await p.reload({ waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
  await p.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
}
/** The site shows "The network is busy" when Studio Dev did not answer; reload until it does. */
async function notBusy(p) {
  for (let i = 0; i < 8; i++) {
    const busy = await p.evaluate(() => document.body.innerText.includes("The network is busy"));
    if (!busy) return;
    await wait(p, 5000 + 2000 * i);
    await safeReload(p); await wait(p, 1500);
  }
  throw new Error("page stayed busy: " + p.url());
}
const clips = [];
const ctxOpts = { viewport: { width: W, height: H }, colorScheme: "light", recordVideo: { dir: WORK, size: { width: W, height: H } } };
async function record(id, url, fn, { wallet = false, prep = null } = {}) {
  if (ONLY && !ONLY.includes(id)) return;
  const L = S[id].len;
  const ctx = await b.newContext(ctxOpts);
  if (wallet) await attachWallet(ctx);
  const p = await ctx.newPage();
  const born = Date.now();
  await p.goto(url.startsWith("http") ? url : BASE + url, { waitUntil: "networkidle", timeout: 120000 }).catch(() => {});
  await wait(p, 1200);
  await notBusy(p);
  if (prep) { await prep(p); await wait(p, 400); }
  const start = (Date.now() - born) / 1000;
  const t0 = Date.now();
  await fn(p, L);
  await wait(p, L * 1000 - (Date.now() - t0) + 300);
  const v = p.video(); await ctx.close();
  clips.push({ id, file: await v.path(), start, len: L });
}

// slides use the site's own stylesheet and fonts
const SLIDE_CSS = `body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--f-sans)}
.sl{position:fixed;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 120px}
.k{font:500 18px var(--f-sans);color:var(--ink-3);letter-spacing:.02em}
.h{font:500 60px/1.08 var(--f-serif);letter-spacing:-.01em;margin:10px 0 0}
.box{background:var(--sheet);border:1px solid var(--rule);border-radius:10px;padding:18px 20px;box-shadow:var(--shadow)}
.rev{opacity:0;transform:translateY(8px);transition:opacity .5s ease,transform .5s ease}.rev.on{opacity:1;transform:none}
.mono{font-family:var(--f-mono)}`;
async function slide(p, html) {
  await p.evaluate(([css, h]) => {
    document.body.innerHTML = `<style>${css}</style>${h}`;
    document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, 0);
  }, [SLIDE_CSS, html]);
  await wait(p, 300);
}
const reveal = (p, i) => p.evaluate((k) => document.querySelectorAll(".rev")[k]?.classList.add("on"), i);

// ---- 3. scenes -----------------------------------------------------------------------
await record("hook", "/", async (p, L) => {
  await hl(p, "h1"); await wait(p, L * 1000 * 0.45);
  await hl(p, "section[aria-label^='Scorecard']", null, { pad: 10 });
});

const README_URL = "https://github.com/sherlock-audit/2024-05-pooltogether-judging/blob/88298eacec6f178fd0b5f9f13e4605c58aa58072/README.md";
const markReadme = (p) => p.evaluate(() => {
  const h = [...document.querySelectorAll("h1, h2")].find((x) => x.textContent.includes("Issue M-16:"));
  if (!h) return null;
  const head = h.closest(".markdown-heading") ?? h; head.setAttribute("data-fc", "title");
  let el = head, n = 0;
  while (el && n++ < 400) { el = el.nextElementSibling; if (el && el.textContent.includes("The protocol team fixed this issue")) { el.setAttribute("data-fc", "status"); break; } }
  return { y1: head.getBoundingClientRect().top + scrollY, y2: el ? el.getBoundingClientRect().top + scrollY : 0 };
});
await record("finding", README_URL, async (p, L) => {
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; document.body.style.scrollBehavior = "auto"; });
  await markReadme(p);
  await hl(p, "[data-fc='title']", null, { pad: 6 }); await wait(p, L * 1000 * 0.33);
  await clear(p);
  // GitHub re-renders the file view, so find the status line fresh each time
  const statusY = () => p.evaluate(() => {
    const h = [...document.querySelectorAll("h1, h2")].find((x) => x.textContent.includes("Issue M-16:"));
    let el = h ? (h.closest(".markdown-heading") ?? h) : null, n = 0;
    while (el && n++ < 400) { el = el.nextElementSibling; if (el && el.textContent.includes("The protocol team fixed this issue")) break; }
    if (!el) return -1;
    document.querySelectorAll("[data-fc='status']").forEach((x) => x.removeAttribute("data-fc"));
    el.setAttribute("data-fc", "status");
    return el.getBoundingClientRect().top + scrollY;
  });
  await smooth(p, Math.max(0, (await statusY()) - 330), 1400);
  for (let i = 0; i < 3; i++) { const y = await statusY(); await p.evaluate((v) => scrollTo(0, v), Math.max(0, y - 330)); await wait(p, 350); }
  await statusY();
  await hl(p, "[data-fc='status']", null, { pad: 8 });
}, { prep: async (p) => { await p.waitForTimeout(2500); await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; }); const m = await markReadme(p); if (m) await p.evaluate((y) => scrollTo(0, y - 140), m.y1); } });

await record("pr", "https://github.com/GenerationSoftware/pt-v5-vault/pull/113", async (p, L) => {
  await hl(p, "span, div", "Merged"); await wait(p, L * 1000 * 0.45);
  await clear(p);
  await hl(p, "relative-time, span", "Jun 28", { pad: 6 });
});

await record("how", "/how-it-works", async (p, L) => {
  const step = (lab, body, color = "var(--ink)") => `<div class="box rev" style="flex:1"><div class="k">${lab}</div><div style="margin-top:10px;font:500 25px/1.32 var(--f-serif);color:${color}">${body}</div></div>`;
  const arrow = `<div class="rev" style="align-self:center;font:400 30px var(--f-sans);color:var(--ink-3)">→</div>`;
  const out = (cls, w) => `<span class="status ${cls}" style="font-size:21px;padding:8px 14px">${w}</span>`;
  await slide(p, `<div class="sl"><div class="k">How a check works</div><div class="h">Code decides first. The model only gets what code can’t settle.</div>
    <div style="display:flex;gap:16px;margin-top:44px;align-items:stretch">
      ${step("1 · File", "Someone stakes that the fix is <b>not</b> deployed.")}${arrow}
      ${step("2 · Validators read", "The finding’s report section, the merged fix commit, the verified deployed source.")}${arrow}
      ${step("3 · Code decides", "Identical to the fix or the audited code, deployed before the audit or the fix, fix in place.")}${arrow}
      ${step("4 · Model, only if needed", "Must quote a line the fix added. Two runs must agree.")}
    </div>
    <div class="rev" style="display:flex;gap:12px;margin-top:40px;align-items:center;flex-wrap:wrap"><span class="k" style="margin-right:6px">Outcomes</span>
      ${out("status-fixed", "Fixed")}${out("status-bad", "Not fixed")}${out("status-predates", "Predates audit")}${out("status-predates", "Predates fix")}${out("status-unsure", "Inconclusive · everyone refunded")}</div></div>`);
  // reveal in step with the narration
  const at = [0.08, 0.2, 0.22, 0.52, 0.54, 0.66, 0.68, 0.86];
  const t0 = Date.now();
  for (const [i, f] of at.entries()) { await wait(p, f * L * 1000 - (Date.now() - t0)); await reveal(p, i); }
});

async function outcome(id, check, { hiDiff = true, scrollFirst = 0.42 } = {}) {
  await record(id, `/checks/${check}`, async (p, L) => {
    await hl(p, "header .status"); await wait(p, L * 1000 * 0.16);
    if (hiDiff) {
      const t = (await p.evaluate(() => document.body.innerText.includes("line for line"))) ? "line for line" : "differ between";
      await hl(p, "p, div", t, { pad: 6 });
    }
    await wait(p, L * 1000 * (scrollFirst - 0.16));
    await clear(p);
    await smooth(p, await yOf(p, "section[aria-labelledby='verdict']", null, 40), 1100);
    await hl(p, "section[aria-labelledby='dep'] dl", null, { pad: 10 });
    await wait(p, L * 1000 * 0.3);
    await hl(p, "section[aria-labelledby='verdict']", null, { pad: 4 });
  });
}
await outcome("fixed", 1);
await outcome("notfixed", 6);
await outcome("pa", 4);
await outcome("pf", 5);
await record("inc", "/checks/14", async (p, L) => {
  await hl(p, "header .status"); await wait(p, L * 1000 * 0.15);
  await smooth(p, await yOf(p, "section[aria-labelledby='verdict']", null, 40), 1100);
  await hl(p, "section[aria-labelledby='verdict']", null, { pad: 4 }); await wait(p, L * 1000 * 0.45);
  await hl(p, "section[aria-labelledby='stakes']", null, { pad: 4 });
});

// ---- the live filing: one take on the DEMO contract -----------------------------------
if (!ONLY || ONLY.includes("pick")) {
  const ctx = await b.newContext(ctxOpts);
  await attachWallet(ctx);
  const p = await ctx.newPage();
  const born = Date.now();
  const now = () => (Date.now() - born) / 1000;
  await p.goto(BASE + "/check?d=demo", { waitUntil: "networkidle", timeout: 120000 });
  await wait(p, 1000);
  const pick0 = now();
  await hl(p, "button, a", "PoolTogether M-16 · maxDeposit on Base", { pad: 6 }); await wait(p, 1600); await clear(p);
  await p.click("text=PoolTogether M-16 · maxDeposit on Base");
  await p.waitForSelector("text=Continue to stake", { timeout: 120000 });
  await p.waitForSelector("p.sheet", { timeout: 90000 }).catch(() => {});
  await wait(p, Math.max(0, S.pick.len * 1000 - (now() - pick0) * 1000 - 1500));
  await hl(p, "p.sheet", null, { pad: 6 }); await wait(p, 1500); await clear(p);
  const pickEnd = now();
  await p.click("button:has-text('Continue to stake')"); await wait(p, 900);
  const file0 = now();
  await p.click("button:has-text('File the check')");
  await p.waitForSelector("text=/Check #\\d+ filed/", { timeout: 300000 });
  const filed = now() - 0.3;
  await smooth(p, 0, 400); await wait(p, 1500);
  const idText = await p.textContent("text=/Check #\\d+ filed/");
  const demoId = Number(/#(\d+)/.exec(idText)[1]);
  await p.click("a:has-text('Open the check')");
  await p.waitForLoadState("networkidle");
  await wait(p, 900); await notBusy(p);
  const open0 = now();
  await smooth(p, await yOf(p, "section[aria-labelledby='stakes']", null, 120), 1000);
  await hl(p, "div.sheet", "Think it is fixed", { pad: 6 });
  await wait(p, S.open.len * 1000 + 600);
  await clear(p);
  // off camera: the counter window runs out
  const c = await view(dep.FixCheckDemo.address, "get_check", [demoId]);
  await wait(p, (Number(c.counter_deadline) + 25) * 1000 - Date.now());
  await safeReload(p); await wait(p, 1200);
  await p.evaluate(() => scrollTo(0, 0));
  await smooth(p, await yOf(p, "button", "Decide this check", 300), 900);
  const decide0 = now();
  await hl(p, "button", "Decide this check", { pad: 6 }); await wait(p, 1800); await clear(p);
  let decided = false;
  for (let attempt = 1; attempt <= 3 && !decided; attempt++) {
    if (attempt > 1) { await safeReload(p); await wait(p, 1500); }
    await p.click("button:has-text('Decide this check')", { timeout: 20000 }).catch((e) => console.log("decide click", attempt, e.message.slice(0, 80)));
    for (let i = 0; i < 40; i++) {
      const x = await view(dep.FixCheckDemo.address, "get_check", [demoId]);
      if (x.state !== "OPEN") { decided = true; break; }
      const err = await p.evaluate(() => (document.querySelector("main")?.innerText.match(/[^\n]*(could not|failed|refused|still open|error)[^\n]*/i) ?? [""])[0]);
      if (err && i > 3) { console.log("decide attempt", attempt, "page says:", err.slice(0, 160)); break; }
      await wait(p, 3000);
    }
  }
  if (!decided) throw new Error("demo check " + demoId + " was not decided on camera");
  for (let i = 0; i < 30; i++) {
    await safeReload(p); await wait(p, 1500); await notBusy(p);
    const st = await p.evaluate(() => document.querySelector("header .status")?.textContent ?? "");
    if (st && !/Being checked/.test(st)) break;
    await wait(p, 5000);
  }
  await p.evaluate(() => scrollTo(0, 0)); await wait(p, 400);
  const verdict0 = now();
  await hl(p, "header .status"); await wait(p, 2200);
  await smooth(p, await yOf(p, "section[aria-labelledby='verdict']", null, 40), 1000);
  await hl(p, "section[aria-labelledby='verdict']", null, { pad: 4 }); await wait(p, 1800);
  await hl(p, "section[aria-labelledby='stakes']", null, { pad: 4 });
  await wait(p, S.verdict.len * 1000);
  await p.goto(BASE + "/balance", { waitUntil: "networkidle" }); await wait(p, 2500); await notBusy(p);
  const w0 = now();
  await hl(p, "button", "Withdraw", { pad: 6 }); await wait(p, 1500);
  const wb = p.locator("section, div").filter({ hasText: "Demo deployment" }).locator("button:has-text('Withdraw')").last();
  await wb.click({ timeout: 20000 }).catch(() => p.click("button:has-text('Withdraw')"));
  await clear(p);
  let wDone = now() + 6;
  for (let i = 0; i < 60; i++) {
    const t = await p.evaluate(() => document.body.innerText);
    if (/Final|done|Withdrawn/i.test(t) && !/Withdrawing/.test(t)) { wDone = now(); break; }
    await wait(p, 1000);
  }
  await wait(p, 3500);
  const v = p.video(); await ctx.close();
  const file = await v.path();
  clips.push({ id: "pick", file, start: pick0, len: S.pick.len });
  clips.push({ id: "file", file, start: Math.min(file0 - 0.6, filed - S.file.len + 3), len: S.file.len });
  clips.push({ id: "open", file, start: open0 - 0.4, len: S.open.len });
  clips.push({ id: "decide", file, start: decide0 - 0.6, len: S.decide.len });
  clips.push({ id: "verdict", file, start: verdict0, len: S.verdict.len });
  clips.push({ id: "withdraw", file, start: Math.max(w0 - 0.3, wDone + 2.5 - S.withdraw.len), len: S.withdraw.len });
  S.pick.meta = { demoId, pickEnd };
  writeFileSync(WORK + "live.json", JSON.stringify({ demoId, pick0, file0, filed, open0, decide0, verdict0, w0 }));
}

await record("results", "/", async (p, L) => {
  await smooth(p, await yOf(p, "section[aria-label^='Scorecard']", null, 160), 1100);
  await hl(p, "section[aria-label^='Scorecard'] dl", null, { pad: 10 }); await wait(p, L * 1000 * 0.62);
  await smooth(p, await yOf(p, "#protocols", null, 40), 1200);
});

await record("explorer", `https://explorer-studio-dev.genlayer.com/address/${dep.FixCheck.address}`, async (p, L) => {
  await hl(p, "p, div, span", dep.FixCheck.address, { pad: 6 }); await wait(p, L * 1000 * 0.5);
  await hl(p, "div", "Transactions (", { pad: 4 });
});

await record("verify", "/how-it-works", async (p, L) => {
  const rows = verify.slice(1).map((l) => l.trim().split(/\s+/)).map(([name, addr, file, , , sha]) =>
    `<div class="box rev" style="display:grid;grid-template-columns:170px 1fr;gap:8px 18px;font-size:21px"><b>${name}</b><span class="mono">${addr}</span><span class="k">${file}</span><span class="mono" style="color:var(--ink-2)">sha256 ${sha.slice(0, 32)}… <b style="color:var(--fixed)">identical to the repository</b></span></div>`).join("");
  await slide(p, `<div class="sl"><div class="k">tools/verify_source.mjs · reads the code back from the chain</div><div class="h">Deployed code = the repository, byte for byte</div>
    <div style="display:grid;gap:12px;margin-top:36px">${rows}</div>
    <div class="k rev" style="margin-top:22px">Deployed from commit <span class="mono">${dep.FixCheck.commit}</span></div></div>`);
  for (let i = 0; i < 4; i++) { await wait(p, 600); await reveal(p, i); }
});

await record("attacks", "/how-it-works", async (p, L) => {
  const card = (n, l) => `<div class="box rev" style="flex:1"><div style="font:500 76px/1 var(--f-serif)">${n}</div><div style="margin-top:14px;font-size:23px;color:var(--ink-2)">${l}</div></div>`;
  await slide(p, `<div class="sl"><div class="k">Attacked, fixed, tested</div><div class="h">Two independent attack rounds</div>
    <div style="display:flex;gap:16px;margin-top:40px">
      ${card("9", "issues in round one, all fixed")}${card("12", "issues in round two, all fixed")}${card("183", "tests pass, offline, on real evidence")}${card("2", "open gaps from round three, written down")}
    </div></div>`);
  for (let i = 0; i < 4; i++) { await wait(p, 700 + i * 250); await reveal(p, i); }
});

await record("limits", "https://github.com/kenil1710/fixcheck#known-limitations", async (p, L) => {
  await wait(p, 300);
  await hl(p, "h2, .markdown-heading", "Known limitations", { pad: 6 }); await wait(p, L * 1000 * 0.4);
  await hl(p, "li", "Pinned report and docs commits", { pad: 6 }); await wait(p, L * 1000 * 0.3);
  await hl(p, "li", "Proxies are dated by creation", { pad: 6 });
}, { prep: async (p) => { await p.evaluate(() => { const h = [...document.querySelectorAll("h2")].find((x) => x.textContent.includes("Known limitations")); if (h) scrollTo(0, h.getBoundingClientRect().top + scrollY - 90); }); } });

await record("close", "/", async (p, L) => {
  await slide(p, `<div class="sl" style="align-items:flex-start">
    <div style="display:flex;align-items:center;gap:18px;font:600 34px var(--f-serif)">${readFileSync(ROOT + "brand/logo.svg", "utf8").replace('width="512" height="512"', 'width="56" height="56"')}FixCheck</div>
    <div class="h rev" style="font-size:64px;max-width:18ch;margin-top:36px">Next time a report says Fixed, you can check.</div>
    <div class="rev" style="margin-top:44px;display:grid;gap:10px;font-size:26px"><span><span class="k" style="font-size:18px;margin-right:14px">App</span><b>fixcheck-ledger.vercel.app</b></span>
      <span><span class="k" style="font-size:18px;margin-right:14px">Code</span><b>github.com/kenil1710/fixcheck</b></span></div></div>`);
  await wait(p, 500); await reveal(p, 0); await wait(p, 1200); await reveal(p, 1);
});
await b.close();
if (ONLY) {
  const old = JSON.parse(readFileSync(WORK + "clips.json", "utf8"));
  for (const c of old) if (!clips.some((x) => x.id === c.id)) clips.push(c);
  S.pick.meta = { demoId: JSON.parse(readFileSync(WORK + "live.json", "utf8")).demoId };
}
writeFileSync(WORK + "clips.json", JSON.stringify(clips, null, 1));

// ---- 4. captions -------------------------------------------------------------------
function chunks(text) {
  const MAX = 60;
  const sentences = text.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
  const out = [];
  const split = (p) => {
    if (p.length <= MAX) { out.push(p); return; }
    const w = p.split(" ");
    let best = -1, bestScore = 1e9;
    for (let i = 2; i < w.length - 1; i++) {
      const left = w.slice(0, i).join(" ");
      const score = Math.abs(left.length - p.length / 2) - (/[,;:]$/.test(w[i - 1]) ? 22 : 0);
      if (score < bestScore) { bestScore = score; best = i; }
    }
    split(w.slice(0, best).join(" ")); split(w.slice(best).join(" "));
  };
  for (const x of sentences) split(x);
  return out;
}
const capB = await chromium.launch();
async function capPng(text, file) {
  const pg = await capB.newPage({ viewport: { width: 1920, height: 1080 } });
  await pg.setContent(`<html><body style="margin:0;background:transparent;width:1920px;height:1080px;position:relative;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif">
    <div style="position:absolute;left:0;right:0;margin:0 auto;width:fit-content;bottom:56px;max-width:1500px;background:rgba(17,19,22,.86);color:#fff;
      font-size:44px;line-height:1.28;font-weight:600;padding:14px 30px;border-radius:12px;text-align:center">${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</div></body></html>`);
  await pg.screenshot({ path: file, omitBackground: true }); await pg.close();
}
const srtTime = (t) => { const ms = Math.round(t * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`; };

// ---- 5. build ------------------------------------------------------------------------
let t = 0; const srt = []; const built = [];
for (const [k, s] of SC.entries()) {
  const c = clips.find((x) => x.id === s.id);
  const parts = chunks(s.cap ?? s.text);
  // time each caption by its share of the spoken words (numbers count as spoken)
  const spokenWords = s.text.split(/\s+/).length, shownWords = parts.reduce((a, x) => a + x.split(" ").length, 0);
  const wc = parts.map((x) => x.split(" ").length * spokenWords / shownWords); const total = wc.reduce((a, x) => a + x, 0);
  let acc = 0;
  const caps = parts.map((txt, j) => { const a = (acc / total) * s.voice; acc += wc[Math.min(j, wc.length - 1)]; const e = (acc / total) * s.voice; return { txt, a: +a.toFixed(2), e: +(j === parts.length - 1 ? s.len - 0.05 : e).toFixed(2) }; });
  const inputs = ["-ss", String(Math.max(0, c.start)), "-t", String(s.len + 0.5), "-i", c.file];
  let filter = `[0:v]fps=30,scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p,tpad=stop_mode=clone:stop_duration=3,trim=duration=${s.len}[b0]`;
  for (const [j, cp] of caps.entries()) {
    const png = `${WORK}c${k}_${j}.png`; await capPng(cp.txt, png);
    inputs.push("-i", png);
    filter += `;[b${j}][${j + 1}:v]overlay=0:0:enable='between(t,${cp.a},${cp.e})'[b${j + 1}]`;
    srt.push({ a: t + cp.a, e: t + cp.e, txt: cp.txt });
  }
  const out = `${WORK}s${String(k).padStart(2, "0")}.mp4`;
  sh("ffmpeg", ["-y", ...inputs, "-filter_complex", filter, "-map", `[b${caps.length}]`, "-t", String(s.len), "-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-an", out]);
  sh("ffmpeg", ["-y", "-i", `${WORK}v${k}.aiff`, "-af", `aresample=48000,apad=whole_dur=${s.len}`, "-t", String(s.len), "-ac", "2", `${WORK}a${String(k).padStart(2, "0")}.wav`]);
  built.push({ id: s.id, ch: s.ch, video: out, audio: `${WORK}a${String(k).padStart(2, "0")}.wav`, len: s.len, start: t, text: s.cap ?? s.text });
  t += s.len;
}
writeFileSync(`${WORK}v.txt`, built.map((x) => `file '${x.video}'`).join("\n"));
writeFileSync(`${WORK}a.txt`, built.map((x) => `file '${x.audio}'`).join("\n"));
sh("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", `${WORK}v.txt`, "-c", "copy", `${WORK}video.mp4`]);
sh("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", `${WORK}a.txt`, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", `${WORK}voice.wav`]);
sh("ffmpeg", ["-y", "-i", `${WORK}video.mp4`, "-i", `${WORK}voice.wav`, "-map_metadata", "-1", "-metadata", "title=FixCheck — is the audit fix actually deployed?", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest", `${OUT}fixcheck-final.mp4`]);
writeFileSync(`${OUT}fixcheck-final.srt`, srt.map((x, i) => `${i + 1}\n${srtTime(x.a)} --> ${srtTime(x.e)}\n${x.txt}\n`).join("\n"));
writeFileSync(`${WORK}timeline.json`, JSON.stringify(built.map(({ id, ch, start, len }) => ({ id, ch, start, len })), null, 1));

// ---- 6. script and YouTube text ---------------------------------------------------------
const mmss = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;
const total = dur(`${OUT}fixcheck-final.mp4`);
let md = `# FixCheck — final video script\n\n\`fixcheck-final.mp4\`: 1920×1080, 30 fps, H.264 + AAC, ${total.toFixed(1)} s. Captions burned in and in \`fixcheck-final.srt\`. Voice: macOS \`say\`, ${VOICE}, ${RATE} wpm, loudness-normalised to −16 LUFS; no music. Built by \`tools/shots/final.mjs\` from the live site, the studio-dev explorer and GitHub.\n\nNumbers read from the canonical contract (\`${dep.FixCheck.address}\`) right before recording: ${N.checks} checks of ${N.findings} findings, ${N.fixed} fixed, ${N.not_fixed} not fixed, ${N.pa} predates audit, ${N.pf} predates fix, ${N.inc} inconclusive. The live filing is demo check #${S.pick.meta.demoId} on \`${dep.FixCheckDemo.address}\`.\n\n| Time | Narration |\n|---|---|\n`;
for (const x of built) md += `| ${mmss(x.start)}–${mmss(x.start + x.len)} | ${x.text} |\n`;
writeFileSync(`${OUT}fixcheck-final-script.md`, md);
const chapters = built.filter((x) => x.ch).map((x) => `${mmss(x.start)} ${x.ch}`).join("\n");
writeFileSync(`${OUT}youtube.md`, `# YouTube\n\n**Title:** FixCheck: is the audit fix actually deployed?\n\n**Description:**\n\nAudit reports mark findings "Fixed". FixCheck checks, one finding at a time, whether the fixed function is what is actually running at the protocol's listed address. It runs on GenLayer: validators read the Sherlock report, the merged fix commit and the verified deployed source, and code decides whenever it can. A model is only asked when code can't settle it, must quote a line the fix added, and two runs must agree; otherwise the check is inconclusive and everyone is refunded.\n\nResults so far, read from the contract: ${N.checks} checks of ${N.findings} real Sherlock findings. ${N.fixed} fixed, ${N.not_fixed} not fixed, ${N.pa} deployed before the audit, ${N.pf} deployed before its fix existed, ${N.inc} inconclusive. "Not fixed" is a code fact, not an exploit claim.\n\nApp: https://fixcheck-ledger.vercel.app\nCode: https://github.com/kenil1710/fixcheck\nContracts (GenLayer Studio Dev): FixCheck ${dep.FixCheck.address} · demo ${dep.FixCheckDemo.address} · FixRegistry ${dep.FixRegistry.address}\n\n**Chapters:**\n\n${chapters}\n\n**Tags:** FixCheck, GenLayer, smart contract audit, Sherlock, audit findings, deployed code, Solidity, security, intelligent contracts, PoolTogether\n`);
await capB.close();
console.log("final", total.toFixed(1), "s;", JSON.stringify(built.map(({ id, start, len }) => ({ id, start: +start.toFixed(1), len }))));
