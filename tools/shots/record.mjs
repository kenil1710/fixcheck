/**
 * Records the 60–90 s demo on the live site (no wallet needed for what is shown).
 *   BASE=https://fixcheck-ledger.vercel.app node record.mjs  -> docs/demo/fixcheck-demo.webm
 */
import { chromium } from "playwright";
import { mkdirSync, renameSync, readdirSync, rmSync } from "node:fs";
const BASE = process.env.BASE ?? "https://fixcheck-ledger.vercel.app";
const NF = process.env.NF ?? "6";     // a canonical NOT_FIXED check
const OUT = new URL("../../docs/demo/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) if (f.endsWith(".webm")) rmSync(OUT + f);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: "light", recordVideo: { dir: OUT, size: { width: 1280, height: 800 } } });
const p = await ctx.newPage();
const wait = (ms) => p.waitForTimeout(ms);
const scrollTo = async (y, steps = 30) => { const from = await p.evaluate(() => scrollY); for (let i = 1; i <= steps; i++) { await p.evaluate((v) => scrollTo(0, v), from + ((y - from) * i) / steps); await wait(30); } };
const yOf = (sel, off = 80) => p.evaluate(([s, o]) => document.querySelector(s).getBoundingClientRect().top + scrollY - o, [sel, off]);
const t0 = Date.now();
// 1. landing: the tally and the specimen
await p.goto(BASE + "/", { waitUntil: "networkidle" }); await wait(5500);
await scrollTo(await yOf("#how")); await wait(3500);
await scrollTo(await yOf("#protocols")); await wait(3000);
// 2. PoolTogether: filter not fixed
await p.click("text=PoolTogether V5"); await p.waitForSelector("#findings", { timeout: 60000 }); await wait(3000);
await scrollTo(await yOf("#findings")); await wait(1500);
await p.click("button:has-text('Not fixed')"); await wait(3500);
// 3. a NOT_FIXED finding: deployed == audited, then vs fix
await p.goto(BASE + "/checks/" + NF, { waitUntil: "networkidle" }); await wait(3500);
await scrollTo(await yOf("#diff-title", 260)); await wait(3500);
await p.click("button:has-text('vs fix')"); await wait(4000);
await scrollTo(await yOf("#ev")); await wait(3000);
// 4. a model-decided finding with quoted lines
await p.goto(BASE + "/demo/checks/6", { waitUntil: "networkidle" }); await wait(2500);
await scrollTo(await yOf("#diff-title", 260)); await wait(5000);
// 5. check flow: real example -> live preview of what code will check
await p.goto(BASE + "/check", { waitUntil: "networkidle" }); await wait(2000);
await p.click("text=PoolTogether M-5 · claimPrizes on Arbitrum"); await p.waitForSelector("text=Code will", { timeout: 1000 }).catch(() => {});
await p.waitForSelector("text=FIXED:", { timeout: 60000 }).catch(() => {}); await wait(5000);
await p.click("button:has-text('Continue to stake')"); await wait(3500);
// 6. how it works
await p.goto(BASE + "/how-it-works", { waitUntil: "networkidle" }); await wait(3000);
await scrollTo(await yOf("#split")); await wait(4500);
console.log("seconds", ((Date.now() - t0) / 1000).toFixed(0));
const v = p.video(); await ctx.close(); await b.close();
renameSync(await v.path(), OUT + "fixcheck-demo.webm");
