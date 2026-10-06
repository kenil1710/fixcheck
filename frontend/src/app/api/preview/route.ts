import { NextResponse } from "next/server";
import { view } from "@/lib/reads";
import { archivePin, basename, extract, findingSection, githubPin, isPinned, STATUS_PHRASES } from "@/lib/solfn";

/**
 * Live preview of what the contract will check, before anyone pays.
 * Runs the same rules as contracts/FixCheck.py `gather()` from this server.
 * It is a preview only: on chain, every validator fetches and decides itself.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SOURCES: Record<string, (a: string) => string> = {
  ethereum: (a) => `https://eth.blockscout.com/api/v2/smart-contracts/${a}`,
  optimism: (a) => `https://explorer.optimism.io/api/v2/smart-contracts/${a}`,
  base: (a) => `https://sourcify.dev/server/v2/contract/8453/${a}?fields=sources,proxyResolution`,
  arbitrum: (a) => `https://sourcify.dev/server/v2/contract/42161/${a}?fields=sources,proxyResolution`,
  polygon: (a) => `https://sourcify.dev/server/v2/contract/137/${a}?fields=sources,proxyResolution`,
};

type Step = { id: string; label: string; ok: boolean | null; detail: string };

async function get(url: string): Promise<{ status: number; text: string } | null> {
  try {
    const r = await fetch(url, { headers: { "user-agent": "fixcheck-preview" }, signal: AbortSignal.timeout(25_000), cache: "no-store" });
    return { status: r.status, text: await r.text() };
  } catch { return null; }
}

function parseSource(chain: string, got: { status: number; text: string } | null) {
  if (!got) return { error: "SOURCE_UNREADABLE" as const };
  if (got.status === 404) return { verified: false, files: {} as Record<string, string>, impl: "" };
  if (got.status !== 200) return { error: "SOURCE_UNREADABLE" as const };
  let d: Record<string, unknown>;
  try { d = JSON.parse(got.text); } catch { return { error: "SOURCE_UNREADABLE" as const }; }
  const files: Record<string, string> = {};
  let impl = "";
  let verified = false;
  if (chain === "ethereum" || chain === "optimism") {
    verified = d.is_verified === true;
    if (typeof d.source_code === "string" && d.source_code) files[String(d.file_path || "main.sol")] = d.source_code;
    for (const a of (d.additional_sources as { file_path: string; source_code: string }[]) ?? []) files[a.file_path] = a.source_code;
    const im = (d.implementations as { address_hash?: string; address?: string }[]) ?? [];
    impl = String(im[0]?.address_hash ?? im[0]?.address ?? "").toLowerCase();
  } else {
    verified = d.match === "match" || d.match === "exact_match";
    for (const [k, v] of Object.entries((d.sources as Record<string, { content: string }>) ?? {})) files[k] = v.content;
    const im = ((d.proxyResolution as { implementations?: { address: string }[] })?.implementations) ?? [];
    impl = String(im[0]?.address ?? "").toLowerCase();
  }
  return { verified, files: verified ? files : {}, impl };
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const s = (k: string) => String(b?.[k] ?? "").trim();
  const report = s("report_url"), fid = s("finding_id"), fn = s("function_name"), aud = s("audited_url"),
    fix = s("fix_url"), chain = s("chain").toLowerCase(), addr = s("address").toLowerCase(), docs = s("docs_url");
  const steps: Step[] = [];
  const add = (id: string, label: string, ok: boolean | null, detail: string) => steps.push({ id, label, ok, detail });
  const done = (extra: Record<string, unknown> = {}) => NextResponse.json({ steps, ...extra });

  add("pin", "Every link is pinned", isPinned(report) && isPinned(docs) && Boolean(githubPin(aud)) && (!fix || Boolean(githubPin(fix))),
    !isPinned(report) ? "The report link isn’t pinned to a commit or snapshot." : !isPinned(docs) ? "The docs link isn’t pinned." : !githubPin(aud) ? "The audited file must be GitHub raw at a 40-character commit SHA." : fix && !githubPin(fix) ? "The fix file must be GitHub raw at a commit SHA." : `Report ${githubPin(report) ? "at commit " + githubPin(report)!.sha.slice(0, 7) : "archived " + archivePin(report)!.ts}; audited code at ${githubPin(aud)!.sha.slice(0, 7)}.`);
  if (!steps[0].ok) return done();
  if (!/^0x[0-9a-f]{40}$/.test(addr) || !SOURCES[chain] || !/^[A-Za-z_$][\w$]{0,63}$/.test(fn) || !/^[A-Za-z0-9-]{2,16}$/.test(fid)) {
    add("fields", "Finding, function, chain and address look right", false, "Check the finding id (like M-14), the function name (no parentheses), the chain and the 0x address.");
    return done();
  }

  const [rep, dpage, apage, fpage] = await Promise.all([get(report), get(docs), get(aud), fix ? get(fix) : Promise.resolve(null)]);
  const sec = rep?.status === 200 ? findingSection(rep.text, fid) : null;
  add("report", `Finding ${fid} is marked fixed in the report`, Boolean(sec?.ok), !rep || rep.status !== 200 ? "The report couldn’t be read." : sec && !sec.ok ? (sec.why === "FINDING_NOT_IN_REPORT" ? "No heading in the report names that finding." : "That finding has no “fixed” status phrase.") : `“${STATUS_PHRASES[(sec as { status: number }).status]}”`);
  const named = Boolean(sec?.ok && sec.text.includes(fn));
  add("named", `The finding mentions ${fn}()`, sec?.ok ? named : null, named ? "The function is named in the finding’s text." : "The function name doesn’t appear in the finding.");
  const listed = dpage?.status === 200 && dpage.text.toLowerCase().includes(addr);
  add("docs", "The protocol’s docs list this address", listed, listed ? "Found in the pinned docs page." : !dpage || dpage.status !== 200 ? "The docs page couldn’t be read." : "The address isn’t on that page.");

  const file = basename(githubPin(aud)!.path);
  const a = apage?.status === 200 ? extract({ [file]: apage.text }, file, fn) : null;
  const f = fix && fpage?.status === 200 ? extract({ [file]: fpage.text }, file, fn) : null;
  add("audited", `${fn}() is in the audited file`, Boolean(a?.ok), a?.ok ? `${file} at ${githubPin(aud)!.sha.slice(0, 7)}` : "Not found (or not readable) in the audited file.");
  if (fix) add("fix", "The fix commit changes it", Boolean(f?.ok && a?.ok && f.canon !== a.canon), !f?.ok ? "Not found in the fix file." : a?.ok && f.canon === a.canon ? "The fix commit doesn’t change this function." : "The fix changes this function.");

  const src = parseSource(chain, await get(SOURCES[chain](addr)));
  let dep = "error" in src || !src.verified ? null : extract(src.files, file, fn);
  let implNote = "";
  if (dep && !dep.ok && dep.why === "FILE_NOT_FOUND" && !("error" in src) && src.impl && src.impl !== addr) {
    const s2 = parseSource(chain, await get(SOURCES[chain](src.impl)));
    if (!("error" in s2) && s2.verified) { dep = extract(s2.files, file, fn); implNote = ` (proxy → implementation ${src.impl.slice(0, 10)}…)`; }
  }
  add("verified", "The deployed contract is verified", "error" in src ? null : src.verified, "error" in src ? "The explorer didn’t answer; try again." : src.verified ? `Verified source read from ${new URL(SOURCES[chain](addr)).host}${implNote}.` : "No verified source on this chain.");

  let outcome = "";
  if (dep) {
    if (!dep.ok) outcome = `INCONCLUSIVE: ${fn}() ${dep.why === "FUNCTION_OVERLOADED" ? "has several implementations" : "isn’t in the deployed source"} — everyone would be refunded.`;
    else if (f?.ok && dep.canon === f.canon) outcome = "FIXED: the deployed function is identical to the fix commit.";
    else if (a?.ok && dep.canon === a.canon) outcome = "NOT_FIXED: the deployed function is identical to the audited version.";
    else outcome = "MODEL: the deployed function matches neither version. The model will be asked twice and must quote real deployed lines; if it flips, everyone is refunded.";
  }
  const depl = b?.deployment === "demo" ? "demo" : "canonical";
  const st = await view<{ status: string; open_check_id: number; check_id: number }>(depl, "fix_status", [chain, addr, report, fid]);
  const openId = st.ok ? Number(st.data.open_check_id || 0) : 0;
  if (openId) add("dup", "No open check for this finding yet", false, `Already being checked as #${openId}. Open it and counter-stake there instead.`);
  const accepted = steps.every((x) => x.ok !== false) && steps.find((x) => x.id === "verified")?.ok === true;
  return done({ accepted, outcome, openId, previous: st.ok && !openId && st.data.check_id ? st.data : null, title: sec?.ok ? sec.title : "", deployed: dep?.ok ? dep.code : "" });
}
