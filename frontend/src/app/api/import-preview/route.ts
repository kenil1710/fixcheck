import { NextResponse } from "next/server";
import { auditorOf, enumerateFindings } from "@/lib/enumerate";
import { githubPin, normUrl, percentInPath } from "@/lib/solfn";

/**
 * Preview of import_report(): reads the pinned report and enumerates every
 * finding with the contract's own rules (a TypeScript port). Preview only:
 * on chain every validator reads the report itself, confirms each Sherlock
 * "fixed" status on GitHub's issue page, checks both commits are on a branch
 * of the named repositories and that the report links a fix in the docs
 * owner's GitHub account.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  let body: { report_url?: string; docs_url?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, why: "BAD_REQUEST" }, { status: 400 }); }
  const report = normUrl(String(body.report_url ?? "")), docs = normUrl(String(body.docs_url ?? ""));
  if (percentInPath(String(body.report_url ?? "")) || percentInPath(String(body.docs_url ?? ""))) return NextResponse.json({ ok: false, why: "URL_PERCENT_ENCODED" });
  const auditor = auditorOf(report);
  if (!auditor) return NextResponse.json({ ok: false, why: "REPORT_SOURCE_NOT_ALLOWED" });
  const dp = githubPin(docs);
  if (!dp) return NextResponse.json({ ok: false, why: "DOCS_NOT_PINNED_ON_GITHUB" });
  const r = await fetch(report, { cache: "no-store" }).catch(() => null);
  if (!r || r.status !== 200) return NextResponse.json({ ok: false, why: "REPORT_UNREADABLE" });
  const text = await r.text();
  const en = enumerateFindings(text, auditor);
  if (!en.ok) return NextResponse.json({ ok: false, why: en.why, auditor });
  const linksOwner = text.toLowerCase().includes(`github.com/${dp.owner}/`);
  return NextResponse.json({ ok: true, auditor, protocol: `github:${dp.owner}/${dp.repo}`, items: en.items, docs_owner_linked: linksOwner });
}
