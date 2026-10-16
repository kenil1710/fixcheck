import { DEPLOYMENTS } from "@/lib/deployments";
import { freshView } from "@/lib/fresh";
import { protocolKeyFromSlug, protocolMeta } from "@/lib/catalog";
import type { ProtocolTotals } from "@/lib/types";

/**
 * GET /badge/<protocol>.svg - "fixcheck | fixed N/M" for a protocol, read from
 * FixCheck.protocol_score() on every request (no cache). M = decided checks.
 * <protocol> is a site slug (pooltogether, mellow, cap, op-stack) or a
 * contract key (github:owner/repo, URL-encoded).
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const width = (s: string) => Math.round(s.length * 6.6 + 14);

function svg(right: string, color: string, title: string) {
  const left = "fixcheck", lw = width(left), rw = width(right);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lw + rw}" height="20" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>`
    + `<rect width="${lw}" height="20" fill="#1b1e22"/><rect x="${lw}" width="${rw}" height="20" fill="${color}"/>`
    + `<g fill="#fff" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11" text-anchor="middle">`
    + `<text x="${lw / 2}" y="14">${left}</text><text x="${lw + rw / 2}" y="14">${esc(right)}</text></g></svg>`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ protocol: string }> }) {
  const raw = (await params).protocol.replace(/\.svg$/, "");
  const key = protocolKeyFromSlug(raw);
  const h = { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "no-store" };
  try {
    const s = await freshView<ProtocolTotals>(DEPLOYMENTS.canonical.address, "protocol_score", [key]);
    const name = protocolMeta(key).name;
    if (s.total === 0) return new Response(svg("not checked", "#6f747c", `${name}: no decided check`), { headers: h });
    const color = s.not_fixed + (s.regressed ?? 0) > 0 ? "#a3322a" : s.fixed === s.total ? "#22663f" : "#835708";
    return new Response(svg(`fixed ${s.fixed}/${s.total}`, color, `${name}: ${s.fixed} of ${s.total} decided checks fixed in deployed code (FixCheck, read from chain)`), { headers: h });
  } catch {
    return new Response(svg("chain busy", "#6f747c", "Studio Dev could not be read"), { status: 503, headers: h });
  }
}
