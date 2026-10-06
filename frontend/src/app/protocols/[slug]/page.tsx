import Link from "next/link";
import type { Metadata } from "next";
import { getProtocol } from "@/lib/reads";
import { CHAIN_EXPLORERS, CHAIN_NAMES, firmName, protocolKeyFromSlug, protocolMeta } from "@/lib/catalog";
import { commit7 } from "@/lib/format";
import { Ring } from "@/components/Ring";
import { FindingsTable } from "@/components/FindingsTable";
import { Busy, Empty } from "@/components/Busy";
import { Copy } from "@/components/Copy";
import { IconExternal } from "@/components/Icons";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const m = protocolMeta(protocolKeyFromSlug((await params).slug));
  return { title: m.name, description: `Audit findings marked fixed for ${m.name}, checked against the code deployed on chain.` };
}

export default async function ProtocolPage({ params }: { params: Promise<{ slug: string }> }) {
  const key = protocolKeyFromSlug((await params).slug);
  const meta = protocolMeta(key);
  const res = await getProtocol(key);
  if (!res.ok) return <Busy what={meta.name} />;
  const p = res.data;
  if (p.checks === 0) return <Empty title={`${meta.name} hasn’t been checked`}><p>No finding from this protocol has been filed. <Link className="link" href="/check">Check one</Link>.</p></Empty>;

  const deployments = [...new Map(p.items.map((c) => [c.chain + c.address, c])).values()];
  const reports = [...new Map(p.items.map((c) => [c.report_url, c])).values()];
  const docs = [...new Map(p.items.map((c) => [c.docs_url, c])).values()];

  return (
    <div className="pt-12">
      <p className="t-small"><Link className="link text-ink-2" href="/protocols">Protocols</Link></p>
      <div className="mt-3 grid gap-10 lg:grid-cols-[1fr_auto]">
        <div>
          <h1 className="t-h1">{meta.name}</h1>
          {meta.blurb && <p className="t-lede mt-3 max-w-[58ch]">{meta.blurb}</p>}
          <dl className="mt-7 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="t-label">Audit</dt>
              <dd className="mt-1">{reports.map((c) => (
                <a key={c.report_url} className="link inline-flex items-center gap-1" href={c.report_url}>{firmName(c.firm)} report <span className="mono t-small">@{commit7(c.report_url.split("/")[5] ?? "")}</span><IconExternal /></a>
              ))}</dd>
            </div>
            <div>
              <dt className="t-label">Addresses listed in {docs[0]?.docs_url.split("/").slice(3, 5).join("/")}</dt>
              <dd className="mt-1">{docs.map((c) => (
                <a key={c.docs_url} className="link mr-3 inline-flex items-center gap-1 break-all" href={c.docs_url}>{c.docs_url.split("/").pop()} <span className="mono t-small">@{commit7(c.docs_url.split("/")[5] ?? "")}</span><IconExternal /></a>
              ))}</dd>
            </div>
          </dl>
        </div>
        <div className="sheet self-start p-5"><Ring s={p} /></div>
      </div>

      <section aria-labelledby="deps" className="mt-10">
        <h2 id="deps" className="t-label">Deployed contracts checked</h2>
        <ul className="mt-2 grid gap-x-8 sm:grid-cols-2">
          {deployments.map((c) => (
            <li key={c.chain + c.address} className="flex items-center gap-2 border-b hair py-2 t-small">
              <span className="w-28 shrink-0 text-ink-2">{CHAIN_NAMES[c.chain] ?? c.chain}</span>
              <a className="mono link min-w-0 truncate" href={`${CHAIN_EXPLORERS[c.chain]}/address/${c.address}`}>{c.address}</a>
              <Copy value={c.address} label="Copy address" />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="findings" className="mt-12">
        <h2 id="findings" className="t-h2 mb-5">Findings</h2>
        <FindingsTable items={p.items} />
      </section>
    </div>
  );
}
