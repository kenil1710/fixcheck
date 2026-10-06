import Link from "next/link";
import type { Metadata } from "next";
import { getChecks } from "@/lib/reads";
import { FindingsTable } from "@/components/FindingsTable";
import { Busy } from "@/components/Busy";

export const revalidate = 10;
export const metadata: Metadata = { title: "Demo deployment", description: "The same FixCheck contract with 90-second windows, for trying every path." };

export default async function Demo() {
  const res = await getChecks("demo");
  if (!res.ok) return <Busy what="the demo deployment" />;
  return (
    <div className="pt-12">
      <h1 className="t-h1">Demo deployment</h1>
      <p className="t-lede mt-3 max-w-[62ch]">The same contract, deployed from the same commit, with a 90-second counter-stake window and a 5-minute decide window — so you can try every path in one sitting. Its checks don’t count toward the scorecard. <Link className="link" href="/check?d=demo">Check a finding on the demo</Link>.</p>
      <div className="mt-10"><FindingsTable items={res.data.items} base="/demo/checks" /></div>
    </div>
  );
}
