/**
 * Patrol bot: the v2 regression watch.
 *
 *   node tools/patrol.mjs [--dry] [--only=FixCheck|FixCheckDemo]
 *
 * For every FixCheck deployment in deployments.json:
 *  1. WATCH. Every check whose LATEST decided verdict is FIXED on a proxy (it
 *     names an implementation) is watched: the proxy's EIP-1967 slot is read
 *     at the chain head from the same two RPCs the contract uses (they must
 *     agree), and the proxy's Upgraded(address) logs since the check's slot
 *     block are listed (best effort; public RPCs cap log ranges). An Upgraded
 *     event always rewrites the slot, so a slot that names another
 *     implementation than the check is an upgrade.
 *  2. RE-FILE. On an upgrade it calls file_regression(check) with the minimum
 *     stake. The contract re-reads everything itself and refuses if nothing
 *     changed; a REGRESSED verdict is decided by code.
 *  3. CLOSE ITS OWN FILINGS. Every open check the bot filed is decided after
 *     its counter deadline, or expired after its decide deadline; every open
 *     scorecard past its filing deadline is closed; the bot's balance is
 *     withdrawn.
 *
 * Signs with PATROL_KEY (the CI secret) or the "patrol" role of
 * test/.accounts.json. Without either (or with --dry) it only reports what it
 * would do. Never prints key material. Writes a JSON report to stdout's last
 * line and to $PATROL_REPORT if set.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
const root = new URL("..", import.meta.url).pathname;
const require = createRequire(new URL("../test/package.json", import.meta.url));
const { createClient } = require("genlayer-js");
const H = await import(new URL("../test/harness.mjs", import.meta.url));

const DRY = process.argv.includes("--dry");
const ONLY = H.argOf("only", null);
const dep = JSON.parse(readFileSync(root + "deployments.json", "utf8")).contracts;
const src = readFileSync(root + "contracts/FixCheck.py", "utf8");
// the RPCs, slot and topic come from the contract source itself
const chainsBlock = src.slice(src.indexOf("CHAINS = {"), src.indexOf("}", src.indexOf("CHAINS = {")));
const rpcBBlock = src.slice(src.indexOf("RPC_B = {"), src.indexOf("}", src.indexOf("RPC_B = {")));
const RPC = {};
for (const m of chainsBlock.matchAll(/"(\w+)": \("\w+", "[^"]+", \d+, "([^"]+)"\)/g)) RPC[m[1]] = [m[2]];
for (const m of rpcBBlock.matchAll(/"(\w+)": "([^"]+)"/g)) RPC[m[1]]?.push(m[2]);
const SLOT = src.match(/EIP1967_IMPL_SLOT = "(0x[0-9a-f]{64})"/)[1];
const TOPIC = src.match(/UPGRADED_TOPIC = "(0x[0-9a-f]{64})"/)[1];

const key = process.env.PATROL_KEY || (existsSync(root + "test/.accounts.json") ? H.accounts().patrol?.key : null);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const plain = (v) => v instanceof Map ? Object.fromEntries([...v].map(([k, x]) => [k, plain(x)])) : Array.isArray(v) ? v.map(plain) : typeof v === "bigint" ? Number(v) : v;

async function rpc(url, method, params) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), signal: AbortSignal.timeout(20000) });
      const j = await r.json();
      if (j.error) throw new Error(j.error.message);
      return j.result;
    } catch (e) { if (i === 2) return null; await H.sleep(2000 * (i + 1)); }
  }
}
async function slotNow(chain, proxy) {
  const words = await Promise.all(RPC[chain].map((u) => rpc(u, "eth_getStorageAt", [proxy, SLOT, "latest"])));
  if (words.some((w) => typeof w !== "string" || w.length !== 66)) return { error: "RPC_UNREADABLE" };
  const impls = words.map((w) => "0x" + w.slice(26).toLowerCase());
  return impls[0] === impls[1] ? { impl: impls[0] } : { error: "RPCS_DISAGREE", impls };
}
async function upgradedSince(chain, proxy, fromBlock) {
  const head = await rpc(RPC[chain][0], "eth_blockNumber", []);
  if (!head) return null;
  const hi = parseInt(head, 16), lo = Math.max(fromBlock + 1, hi - 50_000);
  const logs = await rpc(RPC[chain][0], "eth_getLogs", [{ address: proxy, topics: [TOPIC], fromBlock: "0x" + lo.toString(16), toBlock: head }]);
  return logs === null ? null : logs.map((l) => ({ block: parseInt(l.blockNumber, 16), tx: l.transactionHash, impl: "0x" + l.topics[1].slice(26) }));
}

const report = { at: new Date().toISOString(), dry: DRY || !key, contracts: [] };
async function patrol(name) {
  const address = dep[name].address;
  const rec = { name, address, checks: 0, watched: [], filed: [], closed: [], scorecards_closed: [], withdrawn: null };
  const reader = createClient({ chain: H.CHAINS.studiodev });
  const view = async (fn, args = []) => plain(await H.retry(() => reader.readContract({ address, functionName: fn, args }), { label: fn }));
  const c = key ? H.connect({ address, key }) : null;
  const me = c?.account.address.toLowerCase() ?? "";
  if (c && !DRY) await H.fundOnStudio(H.CHAINS.studiodev, c.account.address, 100n * 10n ** 18n);
  const checks = [];
  for (let off = 0; ; off += 100) {
    const page = await view("get_checks", [off, 100]);
    checks.push(...page.items);
    if (checks.length >= page.total || page.items.length === 0) break;
  }
  const latest = {};
  for (const x of checks) if (x.state !== "EXPIRED" && (!latest[x.key] || x.check_id > latest[x.key].check_id)) latest[x.key] = x;
  rec.checks = checks.length;
  // 1 + 2: watch and re-file
  for (const x of Object.values(latest)) {
    if (x.state !== "DECIDED" || x.verdict !== "FIXED" || !x.implementation) continue;
    const now = await slotNow(x.chain, x.address);
    const ups = await upgradedSince(x.chain, x.address, x.slot_block);
    const w = { check_id: x.check_id, chain: x.chain, proxy: x.address, checked_impl: x.implementation, impl_now: now.impl ?? null, rpc: now.error ?? "AGREE", upgraded_logs: ups };
    w.upgraded = Boolean(now.impl && now.impl !== x.implementation.toLowerCase());
    rec.watched.push(w);
    log(name, "watch #" + x.check_id, x.chain, x.address, w.upgraded ? "UPGRADED -> " + now.impl : now.error ?? "unchanged");
    if (w.upgraded && c && !DRY) {
      const o = await c.send("file_regression", [x.check_id], 10n ** 17n);
      const last = await view("get_last_result", [me]);
      rec.filed.push({ prior: x.check_id, hash: o.hash, status: o.status, result: last });
      log(name, "file_regression", x.check_id, o.status, o.hash, last.slice(0, 160));
    }
  }
  // 3: close own filings after their deadlines
  const t = Math.floor(Date.now() / 1000);
  for (const x of checks.filter((y) => y.state === "OPEN" && y.challenger === me)) {
    const fn = t >= x.decide_deadline ? "expire" : t >= x.counter_deadline ? "decide" : null;
    if (!fn) continue;
    if (c && !DRY) {
      const o = await c.send(fn, [x.check_id]);
      rec.closed.push({ check_id: x.check_id, fn, hash: o.hash, status: o.status, ok: o.ok });
      log(name, fn, x.check_id, o.status, o.hash);
    } else rec.closed.push({ check_id: x.check_id, fn, dry: true });
  }
  const cards = (await view("get_scorecards", [0, 100])).items;
  for (const s of cards.filter((y) => y.state === "OPEN" && t >= y.file_deadline)) {
    if (c && !DRY) {
      const o = await c.send("close_scorecard", [s.scorecard_id]);
      rec.scorecards_closed.push({ scorecard_id: s.scorecard_id, hash: o.hash, status: o.status });
      log(name, "close_scorecard", s.scorecard_id, o.status, o.hash);
    } else rec.scorecards_closed.push({ scorecard_id: s.scorecard_id, dry: true });
  }
  if (c && !DRY) {
    const bal = await view("balance_of", [me]);
    if (BigInt(bal.claimable_wei) > 0n) {
      const o = await c.send("withdraw", []);
      rec.withdrawn = { wei: bal.claimable_wei, hash: o.hash, status: o.status };
      log(name, "withdraw", bal.claimable_wei, o.status);
    }
  }
  return rec;
}
for (const name of ["FixCheck", "FixCheckDemo"]) {
  if (!dep[name] || (ONLY && ONLY !== name)) continue;
  try {
    report.contracts.push(await patrol(name));
  } catch (e) {
    // a network failure ends this contract's pass; the next scheduled run retries
    report.contracts.push({ name, error: String(e?.shortMessage ?? e?.message ?? e).slice(0, 200) });
    log(name, "pass ended early:", String(e?.message ?? e).slice(0, 120));
  }
}
const out = JSON.stringify(report);
if (process.env.PATROL_REPORT) writeFileSync(process.env.PATROL_REPORT, JSON.stringify(report, null, 1) + "\n");
console.log(out);
