import { chromium } from "playwright";
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: Number(process.env.VW ?? 390), height: 900 } })).newPage();
for (const path of process.argv.slice(2)) {
  await p.goto((process.env.BASE ?? "http://localhost:3210") + path, { waitUntil: "networkidle", timeout: 120000 }); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 0.5 && !e.closest(".overflow-x-auto")).slice(0, 8).map((e) => e.tagName + "." + String(e.className).slice(0, 50) + " " + Math.round(e.getBoundingClientRect().right) + " " + (e.textContent || "").slice(0, 30)));
  console.log(path, r);
}
await b.close();
