import Link from "next/link";
import type { Metadata } from "next";
import { getChecks } from "@/lib/reads";
import { FindingsTable } from "@/components/FindingsTable";
import { Busy, Empty } from "@/components/Busy";

export const revalidate = 30;
export const metadata: Metadata = { title: "All checks", description: "Every finding FixCheck has checked against deployed code." };

export default async function AllChecks() {
  const res = await getChecks();
  if (!res.ok) return <Busy what="the list of checks" />;
  return (
    <div className="pt-12">
      <h1 className="t-h1">All checks</h1>
      <p className="t-lede mt-3 max-w-[60ch]">{res.data.total} findings checked on the canonical contract. Practice runs live on the <Link className="link" href="/demo">demo deployment</Link>.</p>
      <div className="mt-10">{res.data.items.length ? <FindingsTable items={res.data.items} showProtocol /> : <Empty title="No checks yet"><p><Link className="link" href="/check">Check the first finding</Link>.</p></Empty>}</div>
    </div>
  );
}
