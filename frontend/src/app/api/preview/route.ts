import { NextResponse } from "next/server";
import { view } from "@/lib/reads";
import { archivePin, basename, containsFix, extract, findingSection, githubPin, isPinned, normUrl, STATUS_PHRASES } from "@/lib/solfn";

/**
 * Live preview of what the contract will check, before anyone pays.
 * Mirrors contracts/FixCheck.py gather() (v1.2) from this server. It is a
 * preview only: on chain, every validator fetches and decides itself.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CHAINS: Record<string, { kind: "blockscout" | "sourcify"; base: string; id: number; rpc: string }> = {
  ethereum: { kind: "blockscout", base: "https://eth.blockscout.com", id: 1, rpc: "https://ethereum-rpc.publicnode.com" },
  optimism: { kind: "blockscout", base: "https://explorer.optimism.io", id: 10, rpc: "https://optimism-rpc.publicnode.com" },
  base: { kind: "sourcify", base: "https://sourcify.dev", id: 8453, rpc: "https://mainnet.base.org" },
  arbitrum: { kind: "sourcify", base: "https://sourcify.dev", id: 42161, rpc: "https://arb1.arbitrum.io/rpc" },
  polygon: { kind: "sourcify", base: "https://sourcify.dev", id: 137, rpc: "https://polygon-rpc.com" },
};
const SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const sourceUrl = (chain: string, a: string) => {
  const c = CHAINS[chain];
  return c.kind === "blockscout" ? `${c.base}/api/v2/smart-contracts/${a}` : `${c.base}/server/v2/contract/${c.id}/${a}?fields=sources,proxyResolution`;
};

type Step = { id: string; label: string; ok: boolean | null; detail: string };

async function get(url: string): Promise<{ status: number; text: string } | null> {
  try {
    const r = await fetch(url, { headers: { "user-agent": "fixcheck-preview" }, signal: AbortSignal.timeout(25_000), cache: "no-store" });
    return { status: r.status, text: await r.text() };
  } catch { return null; }
}
async function rpc(chain: string, method: string, params: unknown[]): Promise<unknown> {
  try {
    const r = await fetch(CHAINS[chain].rpc, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), signal: AbortSignal.timeout(20_000), cache: "no-store" });
    const j = await r.json();
    return j.error ? null : j.result;
  } catch { return null; }
}

function parseSource(chain: string, got: { status: number; text: string } | null) {
  if (!got) return { error: "SOURCE_UNREADABLE" as const };
  if (got.status === 404) return { verified: false, full: false, files: {} as Record<string, string>, impl: "" };
  if (got.status !== 200) return { error: "SOURCE_UNREADABLE" as const };
  let d: Record<string, unknown>;
  try { d = JSON.parse(got.text); } catch { return { error: "SOURCE_UNREADABLE" as const }; }
  const files: Record<string, string> = {};
  let impl = "", verified = false, full = false;
  if (CHAINS[chain].kind === "blockscout") {
    verified = d.is_verified === true;
    full = verified && d.is_fully_verified === true && d.is_partially_verified !== true;
    if (typeof d.source_code === "string" && d.source_code) files[String(d.file_path || "main.sol")] = d.source_code;
    for (const a of (d.additional_sources as { file_path: string; source_code: string }[]) ?? []) files[a.file_path] = a.source_code;
    const im = (d.implementations as { address_hash?: string; address?: string }[]) ?? [];
    impl = String(im[0]?.address_hash ?? im[0]?.address ?? "").toLowerCase();
  } else {
    verified = d.match === "match" || d.match === "exact_match";
    full = d.match === "exact_match";
    for (const [k, v] of Object.entries((d.sources as Record<string, { content: string }>) ?? {})) files[k] = v.content;
    const im = ((d.proxyResolution as { implementations?: { address: string }[] })?.implementations) ?? [];
    impl = String(im[0]?.address ?? "").toLowerCase();
  }
  return { verified, full, files: verified ? files : {}, impl };
}

async function createdAt(chain: string, a: string): Promise<number> {
  const c = CHAINS[chain];
  if (c.kind === "blockscout") {
    const r = await get(`${c.base}/api/v2/addresses/${a}`);
    const tx = r?.status === 200 ? String(JSON.parse(r.text).creation_transaction_hash ?? "") : "";
    if (!tx) return 0;
    const t = await get(`${c.base}/api/v2/transactions/${tx}`);
    return t?.status === 200 ? Math.floor(Date.parse(JSON.parse(t.text).timestamp) / 1000) : 0;
  }
  const r = await get(`${c.base}/server/v2/contract/${c.id}/${a}?fields=deployment`);
  const blk = r?.status === 200 ? Number(JSON.parse(r.text).deployment?.blockNumber ?? -1) : -1;
  if (blk < 0) return 0;
  const b = (await rpc(chain, "eth_getBlockByNumber", ["0x" + blk.toString(16), false])) as { timestamp?: string } | null;
  return b?.timestamp ? parseInt(b.timestamp, 16) : 0;
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const s = (k: string) => String(b?.[k] ?? "").trim();
  const report = normUrl(s("report_url")), fid = s("finding_id"), fn = s("function_name"), aud = normUrl(s("audited_url")),
    fix = normUrl(s("fix_url")), chain = s("chain").toLowerCase(), addr = s("address").toLowerCase(), docs = normUrl(s("docs_url"));
  const steps: Step[] = [];
  const add = (id: string, label: string, ok: boolean | null, detail: string) => steps.push({ id, label, ok, detail });
  const done = (extra: Record<string, unknown> = {}) => NextResponse.json({ steps, ...extra });
  const ap = githubPin(aud), fp = githubPin(fix);

  add("pin", "Every link is pinned", isPinned(report) && isPinned(docs) && Boolean(ap) && Boolean(fp),
    !isPinned(report) ? "The report link isn’t pinned to a commit or snapshot." : !isPinned(docs) ? "The docs link isn’t pinned." : !ap ? "The audited file must be GitHub raw at a 40-character commit SHA." : !fp ? "The fix file is required: GitHub raw at the fix PR’s head commit." : `Report ${githubPin(report) ? "at commit " + githubPin(report)!.sha.slice(0, 7) : "archived " + archivePin(report)!.ts}; audited code at ${ap.sha.slice(0, 7)}; fix at ${fp.sha.slice(0, 7)}.`);
  if (!steps[0].ok || !ap || !fp) return done();
  if (!/^0x[0-9a-f]{40}$/.test(addr) || !CHAINS[chain] || !/^[A-Za-z_$][\w$]{0,63}$/.test(fn) || !/^[A-Za-z0-9-]{2,16}$/.test(fid)) {
    add("fields", "Finding, function, chain and address look right", false, "Check the finding id (like M-14), the function name (no parentheses), the chain and the 0x address.");
    return done();
  }

  const [rep, dpage, apage, fpage, feed] = await Promise.all([get(report), get(docs), get(aud), get(fix), get(`https://github.com/${ap.owner}/${ap.repo}/commits/${ap.sha}.atom`)]);
  const sec = rep?.status === 200 ? findingSection(rep.text, fid) : null;
  add("report", `Finding ${fid} is marked fixed in the report`, Boolean(sec?.ok), !rep || rep.status !== 200 ? "The report couldn’t be read." : sec && !sec.ok ? (sec.why === "FINDING_NOT_IN_REPORT" ? "No heading in the report names that finding." : "That finding has no “fixed” status phrase.") : `“${STATUS_PHRASES[(sec as { status: number }).status]}”`);
  if (!sec?.ok) return done();
  const named = sec.text.includes(fn);
  add("named", `The finding mentions ${fn}()`, named, named ? "The function is named in the finding’s text." : "The function name doesn’t appear in the finding.");

  const needle = `github.com/${ap.owner}/${ap.repo}/blob/${ap.sha}/`;
  const binding = sec.text.toLowerCase().includes(needle) ? "SECTION" : rep!.text.toLowerCase().includes(needle) ? "REPORT" : "";
  add("bind-aud", "The audited commit is the one the report links", Boolean(binding), binding === "SECTION" ? "Linked in this finding." : binding === "REPORT" ? "Linked elsewhere in the same report (one audited commit per repository)." : "Neither the finding nor the report links this audited commit.");
  const low = sec.text.toLowerCase(), base = `github.com/${fp.owner}/${fp.repo}/`;
  const pulls = [...low.matchAll(new RegExp(base.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "pull/(\\d{1,7})", "g"))].map((m) => m[1]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);
  const commits = [...low.matchAll(new RegExp(base.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "commit/([0-9a-f]{7,40})", "g"))].map((m) => m[1]);
  let fixRef = commits.some((h) => fp.sha.startsWith(h)) ? "commit" : "";
  for (const n of pulls) {
    if (fixRef) break;
    const pg = await get(`https://patch-diff.githubusercontent.com/raw/${fp.owner}/${fp.repo}/pull/${n}.patch`);
    const heads = (pg?.text ?? "").split("\n").filter((l) => /^From [0-9a-f]{40} /.test(l)).map((l) => l.slice(5, 45));
    if (heads[heads.length - 1] === fp.sha) fixRef = `PR #${n}`;
  }
  add("bind-fix", "The fix is the one the finding links", Boolean(fixRef), fixRef ? `Head commit of ${fixRef === "commit" ? "a commit" : fixRef} linked by the finding.` : `The finding links ${pulls.length ? "PR " + pulls.map((n) => "#" + n).join(", ") : "no PR"} in this repository, and this commit isn’t its head.`);

  const listed = dpage?.status === 200 && dpage.text.toLowerCase().includes(addr);
  add("docs", "The protocol’s docs list this address", listed, listed ? "Found in the pinned docs page." : !dpage || dpage.status !== 200 ? "The docs page couldn’t be read." : "The address isn’t on that page.");

  const file = basename(ap.path);
  const a = apage?.status === 200 ? extract({ [file]: apage.text }, file, fn) : null;
  const f = fpage?.status === 200 ? extract({ [file]: fpage.text }, file, fn) : null;
  add("audited", `${fn}() is in the audited file`, Boolean(a?.ok), a?.ok ? `${file} at ${ap.sha.slice(0, 7)}` : "Not found (or not readable) in the audited file.");
  add("fix", "The fix commit changes it", Boolean(f?.ok && a?.ok && f.canon !== a.canon), !f?.ok ? "Not found in the fix file." : a?.ok && f.canon === a.canon ? "The fix commit doesn’t change this function." : "The fix changes this function.");

  const src = parseSource(chain, await get(sourceUrl(chain, addr)));
  const slotRaw = (await rpc(chain, "eth_getStorageAt", [addr, SLOT, "latest"])) as string | null;
  const slot = typeof slotRaw === "string" && /^0x[0-9a-f]{64}$/i.test(slotRaw) ? (/^0x0+$/.test(slotRaw) ? "" : "0x" + slotRaw.slice(-40).toLowerCase()) : null;
  let files: Record<string, string> = {}, full = false, implNote = "", depStatus = "OK";
  if ("error" in src || !src.verified) {
    add("verified", "The deployed contract is verified", "error" in src ? null : false, "error" in src ? "The explorer didn’t answer; try again." : "No verified source on this chain.");
    return done();
  }
  if (slot === null) { add("proxy", "The proxy slot can be read", null, "The chain’s RPC didn’t answer; try again."); return done(); }
  files = src.files; full = src.full;
  if (slot || src.impl) {
    if (!slot) depStatus = "PROXY_UNRESOLVED";
    else if (src.impl && src.impl !== slot) depStatus = "PROXY_MISMATCH";
    else {
      const s2 = parseSource(chain, await get(sourceUrl(chain, slot)));
      if ("error" in s2 || !s2.verified) depStatus = "IMPLEMENTATION_NOT_VERIFIED";
      else { files = s2.files; full = s2.full; implNote = ` Proxy: implementation ${slot.slice(0, 10)}… from its EIP-1967 slot.`; }
    }
  }
  if (depStatus === "OK" && !full) depStatus = "PARTIAL_MATCH";
  add("verified", "The running code is fully verified", depStatus === "OK" ? true : null, depStatus === "OK" ? `Full verified match from ${new URL(sourceUrl(chain, addr)).host}.${implNote}` :
    depStatus === "PARTIAL_MATCH" ? "Only a partial verified match: the check would be inconclusive." : "The proxy’s implementation can’t be confirmed: the check would be inconclusive.");

  const auditedAt = (() => { const m = /<entry>[\s\S]*?<updated>([^<]+)<\/updated>/.exec(feed?.text ?? ""); return m ? Math.floor(Date.parse(m[1]) / 1000) : 0; })();
  const created = await createdAt(chain, addr);
  add("dates", "Deployment and audit dates read", auditedAt > 0 && created > 0, auditedAt && created ? `Deployed ${new Date(created * 1000).toISOString().slice(0, 10)}; audited commit ${new Date(auditedAt * 1000).toISOString().slice(0, 10)}.` : "A date couldn’t be read; the filing would be refused.");

  let outcome = "";
  const dep = depStatus === "OK" ? extract(files, file, fn) : null;
  if (depStatus !== "OK") outcome = "INCONCLUSIVE: code can’t prove which code runs here — everyone would be refunded.";
  else if (dep && !dep.ok) outcome = `INCONCLUSIVE: ${fn}() ${dep.why === "FUNCTION_OVERLOADED" ? "has several implementations" : dep.why === "FUNCTION_OVERRIDDEN" ? "is overridden or copied elsewhere" : "isn’t in the deployed source"} — everyone would be refunded.`;
  else if (dep?.ok && f?.ok && dep.canon === f.canon) outcome = "FIXED: the deployed function is identical to the fix commit.";
  else if (dep?.ok && a?.ok && dep.canon === a.canon) outcome = !slot && created > 0 && created < auditedAt
    ? "PREDATES AUDIT: deployed code matches the pre-audit version. The contract was deployed before the audit and can’t be upgraded, so the fix could not be applied here."
    : "NOT FIXED: the deployed function is identical to the audited version.";
  else if (dep?.ok && a?.ok && f?.ok && containsFix(dep.code, a.code, f.code)) outcome = "FIXED: the deployed function contains the fix in place (code decides, no model).";
  else if (dep?.ok) outcome = "MODEL: the deployed function matches neither version. The model will be asked twice and must quote a line the fix added (for fixed) or a removed line still deployed (for not fixed); otherwise everyone is refunded.";

  const depl = b?.deployment === "demo" ? "demo" : "canonical";
  const st = await view<{ status: string; open_check_id: number; check_id: number }>(depl, "fix_status", [chain, addr, report, fid]);
  const openId = st.ok ? Number(st.data.open_check_id || 0) : 0;
  if (openId) add("dup", "No open check for this finding yet", false, `Already being checked as #${openId}. Open it and counter-stake there instead.`);
  const accepted = steps.every((x) => x.ok !== false) && steps.every((x) => x.ok !== null || x.id === "verified");
  return done({ accepted, outcome, openId, title: sec.title, deployed: dep?.ok ? dep.code : "" });
}
