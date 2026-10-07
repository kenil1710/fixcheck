import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCheck, getCheckCode, getDefenders } from "@/lib/reads";
import { protocolMeta } from "@/lib/catalog";
import { CheckView } from "@/components/CheckView";
import { Busy } from "@/components/Busy";
import type { Deployment } from "@/lib/deployments";


export async function loadCheck(id: number, dep: Deployment) {
  const [c, code, ds] = await Promise.all([getCheck(id, dep), getCheckCode(id, dep), getDefenders(id, dep)]);
  return { c, code, ds };
}

export async function checkMetadata(idRaw: string, dep: Deployment): Promise<Metadata> {
  const id = Number(idRaw);
  const c = Number.isInteger(id) && id > 0 ? await getCheck(id, dep) : null;
  if (!c?.ok) return { title: `Check #${idRaw}` };
  const verdict = c.data.state === "OPEN" ? "being checked" : c.data.verdict === "FIXED" ? "fixed in deployed code" : c.data.verdict === "NOT_FIXED" ? "not in deployed code" : c.data.verdict === "PREDATES_AUDIT" ? "deployed before the audit" : c.data.verdict === "PREDATES_FIX" ? "deployed before the fix existed" : "inconclusive";
  const title = `${protocolMeta(c.data.protocol).name} ${c.data.finding_id}: ${verdict}`;
  return { title, description: `${c.data.title.replace(/^Issue [A-Z]-\d+:\s*/, "")} — ${c.data.function}() checked against the deployed contract.`, openGraph: { title }, twitter: { title } };
}

export async function CheckPage({ idRaw, dep }: { idRaw: string; dep: Deployment }) {
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const { c, code, ds } = await loadCheck(id, dep);
  if (!c.ok && c.error === "NOT_FOUND") notFound();
  if (!c.ok || !code.ok || !ds.ok) return <Busy what={`check #${id}`} />;
  return <CheckView c={c.data} code={code.data} defenders={ds.data} dep={dep} />;
}

