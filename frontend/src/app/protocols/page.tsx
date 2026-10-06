import Link from "next/link";
import type { Metadata } from "next";
import { getChecks, getProtocols } from "@/lib/reads";
import { ProtocolCard } from "@/components/ProtocolCard";
import { Busy, Empty } from "@/components/Busy";

export const revalidate = 30;
export const metadata: Metadata = { title: "Protocols", description: "Every protocol FixCheck has checked, with how many audit fixes are confirmed in its deployed code." };

export default async function Protocols() {
  const [protocols, checks] = await Promise.all([getProtocols(), getChecks()]);
  if (!protocols.ok || !checks.ok) return <Busy what="the protocol list" />;
  return (
    <div className="pt-12">
      <h1 className="t-h1">Protocols</h1>
      <p className="t-lede mt-3 max-w-[60ch]">Each protocol is identified by the pinned docs page that lists its deployed addresses — FixCheck never takes a protocol’s name on trust.</p>
      {protocols.data.length === 0 ? (
        <Empty title="No protocols yet"><p>Nobody has checked a finding yet. <Link className="link" href="/check">Check the first one</Link>.</p></Empty>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {protocols.data.map((p) => <ProtocolCard key={p.protocol} p={p} checks={checks.data.items} />)}
        </div>
      )}
    </div>
  );
}
