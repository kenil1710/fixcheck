/**
 * Voiced demo of the LIVE app (real contract data; the check-flow scene files a
 * real check on the demo contract through a throwaway Studio Dev key).
 *
 *   node voiced.mjs            -> docs/demo/fixcheck-demo-voiced.mp4 (1920x1080, H.264 + AAC)
 *                                 docs/demo/fixcheck-demo-vertical.mp4 (1080x1920)
 *                                 docs/demo/fixcheck-demo-voiced.srt, fixcheck-demo-vertical.srt
 *
 * Every scene is recorded for exactly as long as its narration (plus a short
 * tail), so the voice can never run ahead of the screen. Captions are PNG
 * overlays (this ffmpeg build has no libass/freetype).
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { attachWallet } from "./wallet-shim.mjs";

const BASE = process.env.BASE ?? "https://fixcheck-ledger.vercel.app";
const VOICE = process.env.VOICE ?? "Samantha";
const RATE = process.env.RATE ?? "172";
const OUT = new URL("../../docs/demo/", import.meta.url).pathname;
const WORK = (process.env.WORK ?? "/tmp/fixcheck-voiced") + "/";
const PAPER = "#f1efe7";
if (!process.env.REUSE) rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });
mkdirSync(OUT, { recursive: true });

const script = JSON.parse(readFileSync(new URL("./voiced-script.json", import.meta.url), "utf8"));
const sh = (cmd, args) => execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] }).toString();
const dur = (f) => Number(sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).trim());

// ---- 1. narration per scene ------------------------------------------------
for (const [i, s] of script.scenes.entries()) {
  sh("say", ["-v", VOICE, "-r", RATE, "-o", `${WORK}v${i}.aiff`, s.text]);
  s.voice = dur(`${WORK}v${i}.aiff`);
  s.len = Math.ceil((s.voice + (s.tail ?? 0.6)) * 30) / 30;
}
console.log("narration", script.scenes.map((s) => s.len).join(" + "), "=", script.scenes.reduce((a, s) => a + s.len, 0).toFixed(1), "s");

// ---- 2. record each scene --------------------------------------------------
const b = await chromium.launch();
const wait = (p, ms) => p.waitForTimeout(ms);
async function smooth(p, y, ms = 900) {
  const from = await p.evaluate(() => scrollY);
  const steps = Math.max(10, Math.round(ms / 30));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps; const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    await p.evaluate((v) => scrollTo(0, v), from + (y - from) * e); await wait(p, ms / steps);
  }
}
const yOf = (p, sel, off = 90) => p.evaluate(([s, o]) => { const el = document.querySelector(s); return el ? el.getBoundingClientRect().top + scrollY - o : 0; }, [sel, off]);

const ACTIONS = {
  async landing(p, L) { await wait(p, L * 1000); },
  async scorecard(p, L) { await smooth(p, 140, 1200); await wait(p, L * 1000 - 1200); },
  async protocol(p, L) {
    await smooth(p, await yOf(p, "#findings", 30), 1400);
    await wait(p, 700); await p.click("button:has-text('Not fixed')"); await wait(p, L * 1000 - 2100);
  },
  async finding(p, L) { await smooth(p, await yOf(p, "figure.slip", 30), 1500); await wait(p, L * 1000 - 1500); },
  async vsfix(p, L) { await wait(p, 600); await p.click("button:has-text('vs fix')"); await wait(p, L * 1000 - 600); },
  async model(p, L) { await smooth(p, await yOf(p, "#diff-title", 140), 1500); await wait(p, L * 1000 - 1500); },
  async preview(p, L) {
    const t0 = Date.now();
    await p.click(`text=${script.example}`);
    await p.waitForSelector("text=Continue to stake", { timeout: 60000 });
    await p.waitForSelector("p.sheet", { timeout: 60000 }).catch(() => {});
    const left = L * 1000 - (Date.now() - t0); if (left > 0) await wait(p, left);
  },
  async how(p, L) { await smooth(p, await yOf(p, "#split", 20), 1200); await wait(p, L * 1000 - 1200); },
  async result(p, L) { await wait(p, L * 1000); },
  async close(p, L) { await wait(p, L * 1000); },
};

const clips = [];
async function record(name, url, fn, L, { wallet = false, prep = null } = {}) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 810 }, colorScheme: "light", recordVideo: { dir: WORK, size: { width: 1440, height: 810 } } });
  if (wallet) await attachWallet(ctx);
  const p = await ctx.newPage();
  const born = Date.now();
  await p.goto(BASE + url, { waitUntil: "networkidle", timeout: 120000 });
  await wait(p, 900);
  if (prep) { await prep(p); await wait(p, 400); }
  const start = (Date.now() - born) / 1000;
  await fn(p, L);
  const v = p.video(); await ctx.close();
  clips.push({ name, file: await v.path(), start, len: L });
}

// The stake scene is one continuous take: click "File", show signing and the
// validators reading sources, then cut to the moment the result card appears.
async function recordStake(Lstake, Lresult) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 810 }, colorScheme: "light", recordVideo: { dir: WORK, size: { width: 1440, height: 810 } } });
  await attachWallet(ctx);
  const p = await ctx.newPage();
  const born = Date.now();
  await p.goto(BASE + "/check?d=demo", { waitUntil: "networkidle" });
  await p.click(`text=${script.stakeExample}`);
  await p.waitForSelector("text=Continue to stake", { timeout: 90000 });
  await p.waitForSelector("p.sheet", { timeout: 90000 }).catch(() => {});
  await p.click("button:has-text('Continue to stake')"); await wait(p, 900);
  const s1 = (Date.now() - born) / 1000;
  await p.click("button:has-text('File the check')");
  await p.waitForSelector("text=/Check #\\d+ filed/", { timeout: 240000 });
  const s2 = (Date.now() - born) / 1000 - 0.4;
  await smooth(p, 0, 400);
  await wait(p, Lresult * 1000 + 500);
  const v = p.video(); await ctx.close();
  const file = await v.path();
  // the first part must cover the narration; if the network was faster than
  // the voice, the take continues into the "done" state (never runs ahead)
  clips.push({ name: "stake", file, start: s1, len: Lstake, until: s2 });
  clips.push({ name: "result", file, start: Math.max(s2, s1 + Lstake), len: Lresult });
}

const S = Object.fromEntries(script.scenes.map((s) => [s.id, s]));
const REUSE = process.env.REUSE && existsSync(process.env.REUSE);
if (REUSE) clips.push(...JSON.parse(readFileSync(process.env.REUSE, "utf8")));
if (!REUSE) {
await record("landing", "/", ACTIONS.landing, S.landing.len);
await record("scorecard", "/", ACTIONS.scorecard, S.scorecard.len);
await record("protocol", "/protocols/pooltogether", ACTIONS.protocol, S.protocol.len);
await record("finding", `/checks/${script.notFixedId}`, ACTIONS.finding, S.finding.len);
await record("vsfix", `/checks/${script.notFixedId}`, ACTIONS.vsfix, S.vsfix.len, { prep: async (p) => p.evaluate((y) => scrollTo(0, y), await yOf(p, "figure.slip", 30)) });
await record("model", script.modelPath, ACTIONS.model, S.model.len);
await record("preview", "/check?d=demo", ACTIONS.preview, S.preview.len, { wallet: true });
await recordStake(S.stake.len, S.result.len);
await record("how", "/how-it-works", ACTIONS.how, S.how.len);
await record("real", `/protocols/pooltogether`, async (p, L) => {
  await smooth(p, await yOf(p, "#findings", 30), 1200); await wait(p, 500);
  // narrated in this order: predates the audit, predates its fix, not fixed
  const step = Math.max(1500, (L * 1000 - 1700) / 3);
  await p.click("button:has-text('Predates audit')"); await wait(p, step);
  await p.click("button:has-text('Predates fix')"); await wait(p, step);
  await p.click("button:has-text('Not fixed')"); await wait(p, Math.max(500, L * 1000 - 1700 - 2 * step));
}, S.real.len);
await record("close", "/", ACTIONS.close, S.close.len);
writeFileSync(`${(process.env.CLIPS_DIR ?? WORK)}clips.json`, JSON.stringify(clips));
}
await b.close();

// ---- 3. captions -------------------------------------------------------------
function chunks(text) {
  const parts = text.match(/[^.!?]+[.!?]?(\s|$)/g)?.map((x) => x.trim()).filter(Boolean) ?? [text];
  const out = [];
  for (const p of parts) {
    if (p.split(" ").length <= 15) { out.push(p); continue; }
    // split a long sentence at its clause break nearest the middle, else at the middle word
    const w = p.split(" "); let cut = Math.ceil(w.length / 2);
    let best = -1;
    w.forEach((x, i) => { if (/[;,:]$/.test(x) && i >= 3 && i < w.length - 3 && (best < 0 || Math.abs(i + 1 - w.length / 2) < Math.abs(best - w.length / 2))) best = i + 1; });
    if (best > 0) cut = best;
    out.push(w.slice(0, cut).join(" "), w.slice(cut).join(" "));
  }
  return out;
}
const capB = await chromium.launch();
async function capPng(text, file, w, h, bottom) {
  const pg = await capB.newPage({ viewport: { width: w, height: h } });
  await pg.setContent(`<html><body style="margin:0;background:transparent;width:${w}px;height:${h}px;position:relative;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif">
    <div style="position:absolute;left:0;right:0;margin:0 auto;width:fit-content;bottom:${bottom}px;max-width:${Math.round(w * (w > 1500 ? 0.82 : 0.9))}px;background:rgba(17,19,22,.86);color:#fff;
      font-size:${w > 1500 ? 40 : 38}px;line-height:1.3;font-weight:600;padding:14px 28px;border-radius:12px;text-align:center;letter-spacing:.005em">${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</div></body></html>`);
  await pg.screenshot({ path: file, omitBackground: true });
  await pg.close();
}
const srtTime = (t) => { const ms = Math.round(t * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`; };

// ---- 4. build scenes ------------------------------------------------------------
const order = ["landing", "scorecard", "protocol", "finding", "vsfix", "model", "preview", "stake", "result", "how", "real", "close"];
let t = 0;
const srt = [];
const built = [];
for (const [k, id] of order.entries()) {
  const s = S[id]; const c = clips.find((x) => x.name === id);
  const parts = chunks(s.text);
  const words = parts.map((x) => x.split(" ").length); const total = words.reduce((a, b2) => a + b2, 0);
  let acc = 0;
  const caps = parts.map((txt, j) => { const a = (acc / total) * s.voice; acc += words[j]; const e = (acc / total) * s.voice; return { txt, a: +a.toFixed(2), e: +(j === parts.length - 1 ? s.len - 0.05 : e).toFixed(2) }; });
  const inputs = ["-ss", String(c.start), "-t", String(s.len), "-i", c.file];
  let filter = `[0:v]fps=30,scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p,tpad=stop_mode=clone:stop_duration=3,trim=duration=${s.len}[b0]`;
  for (const [j, cp] of caps.entries()) {
    const png = `${WORK}c${k}_${j}.png`; await capPng(cp.txt, png, 1920, 1080, 64);
    inputs.push("-i", png);
    filter += `;[b${j}][${j + 1}:v]overlay=0:0:enable='between(t,${cp.a},${cp.e})'[b${j + 1}]`;
    srt.push({ a: t + cp.a, e: t + cp.e, txt: cp.txt, scene: id });
  }
  const out = `${WORK}s${String(k).padStart(2, "0")}.mp4`;
  sh("ffmpeg", ["-y", ...inputs, "-filter_complex", filter, "-map", `[b${caps.length}]`, "-t", String(s.len), "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-an", out]);
  // clean (caption-free) version for the vertical cut
  const clean = `${WORK}k${String(k).padStart(2, "0")}.mp4`;
  sh("ffmpeg", ["-y", "-ss", String(c.start), "-t", String(s.len), "-i", c.file, "-vf", `fps=30,scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p,tpad=stop_mode=clone:stop_duration=3,trim=duration=${s.len}`, "-c:v", "libx264", "-crf", "20", "-an", clean]);
  sh("ffmpeg", ["-y", "-i", `${WORK}v${script.scenes.indexOf(s)}.aiff`, "-af", `aresample=48000,apad=whole_dur=${s.len}`, "-t", String(s.len), "-ac", "2", `${WORK}a${String(k).padStart(2, "0")}.wav`]);
  built.push({ id, video: out, clean, audio: `${WORK}a${String(k).padStart(2, "0")}.wav`, len: s.len, caps, start: t });
  t += s.len;
}

// ---- 5. master: concat, loudness, mux -------------------------------------------
writeFileSync(`${WORK}v.txt`, built.map((x) => `file '${x.video}'`).join("\n"));
writeFileSync(`${WORK}a.txt`, built.map((x) => `file '${x.audio}'`).join("\n"));
sh("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", `${WORK}v.txt`, "-c", "copy", `${WORK}video.mp4`]);
sh("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", `${WORK}a.txt`, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", `${WORK}voice.wav`]);
sh("ffmpeg", ["-y", "-i", `${WORK}video.mp4`, "-i", `${WORK}voice.wav`, "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest", `${OUT}fixcheck-demo-voiced.mp4`]);
writeFileSync(`${OUT}fixcheck-demo-voiced.srt`, srt.map((x, i) => `${i + 1}\n${srtTime(x.a)} --> ${srtTime(x.e)}\n${x.txt}\n`).join("\n"));

// ---- 6. vertical cut (1080x1920) ----------------------------------------------------
const vIds = script.vertical;
const title = `${WORK}vtitle.png`;
{
  const pg = await capB.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.setContent(`<html><body style="margin:0;width:1080px;height:1920px;background:${PAPER};font-family:Georgia,serif;color:#1b1e22">
    <div style="position:absolute;top:150px;left:80px;right:80px">
      <div style="display:flex;align-items:center;gap:22px;font-size:46px;font-weight:600">${readFileSync(new URL("../../brand/logo.svg", import.meta.url), "utf8").replace('width="512" height="512"', 'width="72" height="72"')}FixCheck</div>
      <div style="margin-top:56px;font-size:76px;line-height:1.05;letter-spacing:-1px">The audit says it was fixed. Is the fix deployed?</div>
    </div>
    <div style="position:absolute;bottom:110px;left:0;right:0;text-align:center;font:500 34px -apple-system,Helvetica,Arial,sans-serif;color:#4f555e">fixcheck-ledger.vercel.app</div></body></html>`);
  await pg.screenshot({ path: title }); await pg.close();
}
let vt = 0; const vsrt = []; const vparts = [];
for (const id of vIds) {
  const x = built.find((y) => y.id === id);
  const inputs = ["-loop", "1", "-t", String(x.len), "-i", title, "-i", x.clean];
  let filter = `[1:v]scale=1080:-2,tpad=stop_mode=clone:stop_duration=3[sc];[0:v][sc]overlay=0:760:shortest=0[b0]`;
  for (const [j, cp] of x.caps.entries()) {
    const png = `${WORK}vc_${id}_${j}.png`; await capPng(cp.txt, png, 1080, 1920, 220);
    inputs.push("-i", png);
    filter += `;[b${j}][${j + 2}:v]overlay=0:0:enable='between(t,${cp.a},${cp.e})'[b${j + 1}]`;
    vsrt.push({ a: vt + cp.a, e: vt + cp.e, txt: cp.txt });
  }
  const out = `${WORK}vert_${id}.mp4`;
  sh("ffmpeg", ["-y", ...inputs, "-filter_complex", filter + `;[b${x.caps.length}]fps=30,format=yuv420p[o]`, "-map", "[o]", "-t", String(x.len), "-c:v", "libx264", "-crf", "20", "-an", out]);
  vparts.push({ video: out, audio: x.audio }); vt += x.len;
}
writeFileSync(`${WORK}vv.txt`, vparts.map((x) => `file '${x.video}'`).join("\n"));
writeFileSync(`${WORK}va.txt`, vparts.map((x) => `file '${x.audio}'`).join("\n"));
sh("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", `${WORK}vv.txt`, "-c", "copy", `${WORK}vvideo.mp4`]);
sh("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", `${WORK}va.txt`, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", `${WORK}vvoice.wav`]);
sh("ffmpeg", ["-y", "-i", `${WORK}vvideo.mp4`, "-i", `${WORK}vvoice.wav`, "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest", `${OUT}fixcheck-demo-vertical.mp4`]);
writeFileSync(`${OUT}fixcheck-demo-vertical.srt`, vsrt.map((x, i) => `${i + 1}\n${srtTime(x.a)} --> ${srtTime(x.e)}\n${x.txt}\n`).join("\n"));
await capB.close();
writeFileSync(`${WORK}timeline.json`, JSON.stringify(built.map(({ id, start, len }) => ({ id, start, len })), null, 1));
console.log("master", dur(`${OUT}fixcheck-demo-voiced.mp4`).toFixed(1), "s; vertical", dur(`${OUT}fixcheck-demo-vertical.mp4`).toFixed(1), "s");
console.log(JSON.stringify(built.map(({ id, start, len }) => ({ id, start: +start.toFixed(1), len }))));
