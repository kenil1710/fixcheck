/**
 * Screenshots for the design review loop and the listing kit.
 *   BASE=http://localhost:3210 node shots.mjs [/path ...]   -> docs/screenshots/<name>-<w>-<theme>.png
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3210";
const OUT = new URL("../../docs/screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ["/", "/protocols", "/protocols/pooltogether", "/checks/4", "/checks/13", "/check", "/checks", "/how-it-works", "/balance"];
const widths = (process.env.W ?? "1440,390").split(",").map(Number);
const themes = (process.env.T ?? "light,dark").split(",");
const full = process.env.FULL !== "0";
const b = await chromium.launch();
for (const theme of themes) for (const w of widths) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, colorScheme: theme, deviceScaleFactor: w < 500 ? 2 : 1, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  for (const path of pages) {
    const name = (path === "/" ? "landing" : path.slice(1).replace(/[/?=&]/g, "-")) + `-${w}-${theme}`;
    try {
      await p.goto(BASE + path, { waitUntil: "networkidle", timeout: 120000 });
      await p.waitForTimeout(1200);
      const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      await p.screenshot({ path: `${OUT}${name}.png`, fullPage: full });
      console.log(name, overflow > 0 ? `HORIZONTAL OVERFLOW ${overflow}px` : "ok");
    } catch (e) { console.log(name, "FAILED", String(e).slice(0, 120)); }
  }
  await ctx.close();
}
await b.close();
