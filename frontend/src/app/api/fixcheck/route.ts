import { NextResponse } from "next/server";
import { DEPLOYMENTS, FIXSTATUS_ADDRESS } from "@/lib/deployments";
import { freshView } from "@/lib/fresh";
import type { FixStatusAnswer } from "@/lib/types";

/**
 * GET /api/fixcheck?finding=<pinned report url>#<finding id>&chain=<chain>&address=<0x…>
 * (the "#" may be sent as %23, or the finding id given separately as &id=M-1)
 *
 * Answers from the chain on every request: FixStatus.status() is read from
 * Studio Dev for this call (no cache), and FixStatus reads FixCheck's
 * storage by cross-contract view. If the chain can't be read the answer is
 * an error (503), never a stored or guessed verdict.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const CHAINS = ["ethereum", "optimism", "base", "arbitrum", "polygon"];
const headers = { "cache-control": "no-store", "access-control-allow-origin": "*" };

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  let finding = (q.get("finding") ?? "").trim();
  const id = (q.get("id") ?? "").trim();
  if (id && !finding.includes("#")) finding = `${finding}#${id}`;
  const chain = (q.get("chain") ?? "").trim().toLowerCase();
  const address = (q.get("address") ?? "").trim().toLowerCase();
  const bad = !/^https:\/\/\S+#[A-Za-z0-9-]{2,16}$/.test(finding) ? "finding must be <pinned report url>#<finding id>"
    : !CHAINS.includes(chain) ? `chain must be one of ${CHAINS.join(", ")}`
    : !/^0x[0-9a-f]{40}$/.test(address) ? "address must be a 0x address" : "";
  if (bad) return NextResponse.json({ error: bad }, { status: 400, headers });
  const readAt = new Date().toISOString();
  try {
    const got = await freshView<FixStatusAnswer>(FIXSTATUS_ADDRESS, "status", [finding, chain, address]);
    if (!got.reachable) return NextResponse.json({ error: "FixStatus could not read FixCheck", read_at: readAt }, { status: 503, headers });
    return NextResponse.json({
      finding, chain, address,
      status: got.status, is_fixed: got.status === "FIXED", unsafe: got.status === "NOT_FIXED" || got.status === "REGRESSED",
      check_id: got.check_id, basis: got.basis, decided_at: got.decided_at, open_check_id: got.open_check_id,
      source: { network: "GenLayer Studio Dev (61997)", fixstatus: FIXSTATUS_ADDRESS, fixcheck: DEPLOYMENTS.canonical.address, method: "FixStatus.status(finding, chain, address)" },
      read_at: readAt,
    }, { headers });
  } catch (e) {
    return NextResponse.json({ error: "the chain could not be read; no answer is given rather than a stale one", detail: String((e as Error)?.message ?? e).slice(0, 200), read_at: readAt }, { status: 503, headers });
  }
}
