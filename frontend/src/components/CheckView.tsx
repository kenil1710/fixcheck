import Link from "next/link";
import type { Check, CheckCode, Defender } from "@/lib/types";
import type { Deployment } from "@/lib/deployments";
import { CHAIN_EXPLORERS, CHAIN_NAMES, firmName, protocolMeta, severityOf } from "@/lib/catalog";
import { basisOf, DEP_STATUS } from "@/lib/basis";
import { commit7, day, gen, short, when } from "@/lib/format";
import { DiffViewer } from "./DiffViewer";
import { Status, statusOf, tone } from "./Status";
import { Copy } from "./Copy";
import { IconExternal } from "./Icons";
import { StakeActions } from "./StakeActions";
import { Inline } from "./Inline";

/** The sentence pinned above the code: the finding's own summary, as written. */
export function keySentence(section: string): string {
  const lines = section.split("\n");
  let i = lines.findIndex((l) => /^#{2,4}\s*(summary|vulnerability detail|description)/i.test(l.trim()));
  i = i < 0 ? 1 : i + 1;
  const para: string[] = [];
  for (; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) { if (para.length) break; continue; }
    if (t.startsWith("#") || t.startsWith("Source:") || t.startsWith("```") || /^\w[\w ,\\._-]*$/.test(t) && para.length === 0 && t.split(" ").length < 4) { if (para.length) break; continue; }
    para.push(t);
  }
  let text = para.join(" ").replace(/`/g, "").replace(/\*\*/g, "").replace(/\s+/g, " ");
  if (text.length > 280) {
    const cut = text.slice(0, 280);
    const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "));
    text = end > 120 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "") + "…";
  }
  return text;
}

function Evidence({ label, href, sha, note }: { label: string; href: string; sha: string; note?: string }) {
  return (
    <li className="grid gap-1 border-b hair py-3 sm:grid-cols-[11rem_1fr]">
      <span className="t-small text-ink-2">{label}</span>
      <div className="min-w-0">
        <a className="link inline-flex max-w-full items-center gap-1 t-small break-all" href={href}>{href.replace(/^https:\/\//, "")}<IconExternal className="shrink-0" /></a>
        {note && <p className="t-label mt-0.5">{note}</p>}
        {sha.split(",").filter(Boolean).map((h) => (
          <div key={h} className="mt-1 flex items-center gap-1">
            <span className="t-label">sha256</span>
            <code className="min-w-0 truncate text-[0.78rem] text-ink-2">{h}</code>
            <Copy value={h} label="Copy sha256" />
          </div>
        ))}
      </div>
    </li>
  );
}

export function CheckView({ c, code, defenders, dep }: { c: Check; code: CheckCode; defenders: Defender[]; dep: Deployment }) {
  const kind = statusOf(c.state, c.verdict);
  const t = tone(kind);
  const meta = protocolMeta(c.protocol);
  const sev = severityOf(c.finding_id);
  const basis = basisOf(c.basis);
  const quoted = c.quote_lines ? c.quote_lines.split(",").map(Number) : [];
  const title = c.title.replace(/^Issue [A-Z]-\d+:\s*/, "");
  const base = dep === "demo" ? "/demo/checks" : "/checks";
  const votes = c.model_votes ? c.model_votes.split("|").map((v) => v.replace("_", " ").toLowerCase()) : [];
  const explorer = CHAIN_EXPLORERS[c.chain];
  const reportFile = c.report_url.split("/").slice(3, 5).join("/");

  const predates = !c.implementation && c.created_at > 0 && c.created_at < c.audited_at;
  const preview = c.state === "OPEN"
    ? c.dep_status !== "OK" ? "Code will decide: inconclusive, everyone refunded — the function is " + (DEP_STATUS[c.dep_status] ?? c.dep_status) + "."
      : c.fix_canon_sha256 && c.dep_canon_sha256 === c.fix_canon_sha256 ? "Code will decide: fixed — the deployed function is identical to the fix commit."
      : c.dep_canon_sha256 === c.aud_canon_sha256 ? (predates ? "Code will decide: predates the audit — the deployed function is the audited version, and the contract was deployed before the audit." : "Code will decide: not fixed — the deployed function is identical to the audited version.")
      : "The deployed function matches neither version exactly. Unless it visibly contains the fix, the model will be asked twice and must quote deployed lines that point at the change."
    : "";

  const timeline: { at: number; text: string; future?: boolean }[] = [
    { at: c.filed_at, text: `Filed by ${short(c.challenger)} with ${gen(c.stake_wei)} GEN on “not fixed”. Validators fetched and hashed every source.` },
    ...defenders.map((d) => ({ at: d.at, text: `${short(d.address)} staked ${gen(d.stake_wei)} GEN on “fixed”.` })),
    { at: c.counter_deadline, text: "Counter-stake window closes.", future: c.counter_deadline * 1000 > Date.now() },
    ...(c.decided_at ? [{ at: c.decided_at, text: c.state === "EXPIRED" ? "Expired undecided; everyone refunded." : `Decided: ${kind === "FIXED" ? "fixed" : kind === "NOT_FIXED" ? "not fixed" : kind === "PREDATES" ? "predates the audit" : "inconclusive"} (${basis.short.toLowerCase()}).` }] :
      [{ at: c.decide_deadline, text: "Decide window closes; after this anyone can expire the check.", future: true }]),
  ].sort((a, b) => a.at - b.at);

  const payout = c.state === "OPEN" ? null
    : kind === "NOT_FIXED" ? `The challenger was credited ${gen(c.challenger_paid_wei)} GEN: their stake plus every defender’s.`
    : kind === "FIXED" ? (c.defenders > 0 ? `Defenders were credited their stakes plus the challenger’s ${gen(c.stake_wei)} GEN, pro rata.` : `No one defended, so the challenger got ${gen(c.challenger_paid_wei)} GEN back; ${gen(c.fee_paid_wei, 4)} GEN went to the frozen fee.`)
    : kind === "PREDATES" ? "The code could not have held the fix, so every stake was refunded in full."
    : "Every stake was refunded in full.";

  return (
    <article className="pt-10">
      <p className="t-small text-ink-2">
        <Link className="link" href={`/protocols/${meta.slug}`}>{meta.name}</Link>
        <span aria-hidden="true"> / </span>{firmName(c.firm)} audit<span aria-hidden="true"> / </span>check #{c.check_id}{dep === "demo" ? " (demo)" : ""}
      </p>

      <header className="mt-4 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="t-small"><span className="mono font-medium">{c.finding_id}</span> <span className="text-ink-3">{sev.label} severity</span></p>
          <h1 className="t-h1 mt-2 max-w-[32ch]"><Inline text={title} /></h1>
        </div>
        <div className="lg:text-right"><Status kind={kind} large settle /></div>
      </header>

      <div className="mt-10">
          <figure className="slip relative z-10 mx-auto mb-[-14px] max-w-[52rem] rounded-sm px-5 py-4 sm:mx-6">
            <figcaption className="t-label">The finding, as the report states it</figcaption>
            <blockquote className="mt-1.5 font-serif text-[1.08rem] leading-relaxed">{keySentence(code.section) || title}</blockquote>
            <p className="t-label mt-2">Report marks it: “{c.status_phrase}”</p>
          </figure>
          <DiffViewer audited={code.audited} fix={code.fix} deployed={code.deployed} quoted={quoted} tone={t} fn={c.function}
            auditedCommit={c.audited_commit} fixCommit={c.fix_commit} chain={c.chain} address={c.address} depStatus={c.dep_status} />

      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <details className="sheet p-5">
            <summary className="cursor-pointer font-medium">Read the full finding from the pinned report</summary>
            <pre className="mt-4 max-h-[32rem] overflow-auto whitespace-pre-wrap break-words text-[0.85rem] leading-relaxed text-ink-2" style={{ fontFamily: "var(--f-sans)" }}>{code.section}</pre>
          </details>

          <section aria-labelledby="ev" className="mt-10">
            <h2 id="ev" className="t-h2">Evidence</h2>
            <p className="t-small mt-2 max-w-[62ch] text-ink-2">Every validator fetched each of these itself when the check was filed, and all of them had to get the same bytes. The hashes below are what they agreed on.</p>
            <ul className="mt-4 border-t hair">
              <Evidence label="Audit report (pinned)" href={c.report_url} sha={c.report_sha256} note={`${firmName(c.firm)}, ${reportFile}. Finding section sha256 below; the audited commit is linked by ${c.audit_binding === "SECTION" ? "this finding" : "this report"}.`} />
              <li className="grid gap-1 border-b hair py-3 sm:grid-cols-[11rem_1fr]">
                <span className="t-small text-ink-2">Finding section</span>
                <div className="flex min-w-0 items-center gap-1"><span className="t-label">sha256</span><code className="min-w-0 truncate text-[0.78rem] text-ink-2">{c.section_sha256}</code><Copy value={c.section_sha256} label="Copy sha256" /></div>
              </li>
              <Evidence label="Docs listing the address" href={c.docs_url} sha={c.docs_sha256} />
              <Evidence label={`Audited source @${commit7(c.audited_commit)}`} href={c.audited_url} sha={c.audited_sha256} />
              {c.fix_url && <Evidence label={`Fix source @${commit7(c.fix_commit)}`} href={c.fix_url} sha={c.fix_sha256} note={c.fix_ref.startsWith("pull/") ? `Head commit of PR #${c.fix_ref.slice(5)}, which the finding links.` : "A commit the finding links."} />}
              {c.patch_sha256 && <Evidence label="Fix PR patch" href={`https://github.com/${c.fix_url.split("/")[3]}/${c.fix_url.split("/")[4]}/${c.fix_ref}.patch`} sha={c.patch_sha256} />}
              <Evidence label="Deployed verified source" href={c.source_url} sha={c.source_sha256} note={c.implementation ? "The proxy’s own source; the implementation’s is below." : undefined} />
              {c.implementation && c.impl_source_url && <Evidence label="Implementation source" href={c.impl_source_url} sha={c.impl_source_sha256} />}
            </ul>
            <dl className="mt-4 grid gap-1 t-small">
              {[["Audited function", c.aud_canon_sha256], ["Fixed function", c.fix_canon_sha256], ["Deployed function", c.dep_canon_sha256]].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex flex-wrap items-center gap-x-2"><dt className="w-36 text-ink-3">{k}</dt><dd className="flex min-w-0 items-center gap-1"><code className="truncate text-[0.78rem] text-ink-2">{v}</code><Copy value={v} label="Copy hash" /></dd></div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="order-first grid content-start gap-6 lg:order-none">
          <section aria-labelledby="verdict" className="sheet p-5">
            <h2 id="verdict" className="t-label">Verdict</h2>
            <div className="mt-2"><Status kind={kind} /></div>
            <p className="mt-3 font-serif text-[1.15rem] leading-snug">{c.state === "OPEN" ? "Not decided yet." : basis.long}</p>
            {preview && <p className="t-small mt-3 text-ink-2">{preview}</p>}
            <p className="t-small mt-3 text-ink-3">
              {c.state === "OPEN" ? "" : basis.by === "model" ? "Decided by: the model, checked by code." : basis.by === "deadline" ? "Closed by: the deadline." : "Decided by: code alone. The model was never asked."}
            </p>
            {votes.length === 2 && (
              <p className="t-small mt-2 text-ink-2">Model asked twice: <span className="font-medium text-ink">{votes[0]}</span>, then <span className="font-medium text-ink">{votes[1]}</span>.</p>
            )}
          </section>

          <section aria-labelledby="dep" className="sheet p-5">
            <h2 id="dep" className="t-label">Deployed contract</h2>
            <p className="mt-2 t-small">{CHAIN_NAMES[c.chain] ?? c.chain}</p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 t-small">
              <dt className="text-ink-3">Deployed</dt>
              <dd className={predates ? "font-medium" : ""}>{c.created_at ? day(c.created_at) : "—"}{c.creation_tx && <a className="link ml-1.5 mono text-[0.78rem]" href={`${explorer}/tx/${c.creation_tx}`}>tx</a>}</dd>
              <dt className="text-ink-3">Audited commit</dt>
              <dd>{c.audited_at ? day(c.audited_at) : "—"} <span className="mono text-[0.78rem] text-ink-3">{commit7(c.audited_commit)}</span></dd>
            </dl>
            <p className="mt-1 flex items-center gap-1"><a className="mono link min-w-0 truncate text-[0.82rem]" href={`${explorer}/address/${c.address}`}>{c.address}</a><Copy value={c.address} label="Copy address" /></p>
            {c.implementation && <p className="t-small mt-2 text-ink-2">Proxy. Implementation <a className="link mono text-[0.78rem]" href={`${explorer}/address/${c.implementation}`}>{short(c.implementation)}</a>, read from its EIP-1967 slot.</p>}
            <p className="t-small mt-2 text-ink-2"><span className="mono">{c.function}()</span> {c.dep_status === "OK" ? "found in the deployed source" : "is " + (DEP_STATUS[c.dep_status] ?? c.dep_status)}.</p>
          </section>

          <section aria-labelledby="stakes" className="sheet p-5">
            <h2 id="stakes" className="t-label">Stakes</h2>
            <dl className="mt-2 grid gap-1.5 t-small">
              <div className="flex justify-between gap-3"><dt className="text-ink-2">On “not fixed”</dt><dd className="font-medium">{gen(c.stake_wei)} GEN</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-2">On “fixed” ({c.defenders} defender{c.defenders === 1 ? "" : "s"})</dt><dd className="font-medium">{gen(c.defended_wei)} GEN</dd></div>
            </dl>
            {payout && <p className="t-small mt-3 border-t hair pt-3 text-ink-2">{payout}</p>}
          </section>

          <StakeActions dep={dep} checkId={c.check_id} state={c.state} counterDeadline={c.counter_deadline} decideDeadline={c.decide_deadline} challenger={c.challenger} />

          <section aria-labelledby="tl">
            <h2 id="tl" className="t-label">Timeline</h2>
            <ol className="mt-3 border-l hair">
              {timeline.map((e, i) => (
                <li key={i} className="relative pb-4 pl-4">
                  <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border" style={{ background: e.future ? "var(--paper)" : "var(--ink)", borderColor: e.future ? "var(--ink-3)" : "var(--ink)" }} aria-hidden="true" />
                  <p className="t-label">{when(e.at)}{e.future ? " (upcoming)" : ""}</p>
                  <p className="t-small">{e.text}</p>
                </li>
              ))}
            </ol>
          </section>
          <p className="t-small"><Link className="link" href={base}>All checks</Link></p>
        </aside>
      </div>
    </article>
  );
}
