/** Renders brand/logo.svg to PNGs, the favicon set and the site OG image.  BASE=<site> node brand.mjs */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
const dir = new URL("../../brand/", import.meta.url).pathname;
const pub = new URL("../../frontend/public/", import.meta.url).pathname;
const b = await chromium.launch();
for (const s of [512, 180, 32]) {
  const q = await b.newPage({ viewport: { width: s, height: s } });
  const svg = readFileSync(dir + "logo.svg", "utf8").replace('width="512" height="512"', `width="${s}" height="${s}"`);
  await q.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await q.screenshot({ path: dir + `logo-${s}.png`, omitBackground: true });
}
// favicon.ico = ICO container around the 32px PNG
const png = readFileSync(dir + "logo-32.png");
const h = Buffer.alloc(22); h.writeUInt16LE(0, 0); h.writeUInt16LE(1, 2); h.writeUInt16LE(1, 4);
h.writeUInt8(32, 6); h.writeUInt8(32, 7); h.writeUInt8(0, 8); h.writeUInt8(0, 9); h.writeUInt16LE(1, 10); h.writeUInt16LE(32, 12); h.writeUInt32LE(png.length, 14); h.writeUInt32LE(22, 18);
writeFileSync(pub + "favicon.ico", Buffer.concat([h, png]));
copyFileSync(dir + "logo-180.png", pub + "apple-touch-icon.png");
copyFileSync(dir + "favicon.svg", pub + "favicon.svg");
copyFileSync(dir + "logo-512.png", pub + "logo-512.png");
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
const r = await p.goto((process.env.BASE ?? "http://localhost:3210") + "/opengraph-image");
writeFileSync(dir + "og.png", await r.body());
await b.close();
console.log("brand assets written");
