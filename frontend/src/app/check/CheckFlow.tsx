"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet } from "@/components/WalletProvider";
import { WalletButton } from "@/components/WalletButton";
import { TxProgress } from "@/components/TxProgress";
import { Copy } from "@/components/Copy";
import { sendWrite, type TxState } from "@/lib/tx";
import { DEPLOYMENTS, type Deployment } from "@/lib/deployments";
import { githubPin, isPinned } from "@/lib/solfn";
import { CHAIN_NAMES } from "@/lib/catalog";
import { EXAMPLES } from "./examples";

type Form = { report_url: string; finding_id: string; function_name: string; audited_url: string; fix_url: string; chain: string; address: string; docs_url: string };
type Step = { id: string; label: string; ok: boolean | null; detail: string };
type Preview = { steps: Step[]; accepted?: boolean; outcome?: string; title?: string; deployed?: string; openId?: number };

const EMPTY: Form = { report_url: "", finding_id: "", function_name: "", audited_url: "", fix_url: "", chain: "ethereum", address: "", docs_url: "" };
const STEPS = ["Report", "Finding", "Address", "Review", "Stake"];

function Field({ id, label, hint, value, onChange, error, placeholder }: { id: keyof Form; label: string; hint: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="font-medium">{label}</label>
      <input id={id} className="field" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={`${id}-hint`} autoComplete="off" spellCheck={false} />
      <p id={`${id}-hint`} className={`t-small ${error ? "" : "text-ink-3"}`} style={error ? { color: "var(--bad)" } : undefined}>{error || hint}</p>
    </div>
  );
}

export function CheckFlow() {
  const params = useSearchParams();
  const w = useWallet();
  const [dep, setDep] = useState<Deployment>(params.get("d") === "demo" ? "demo" : "canonical");
  const [step, setStep] = useState(0);
  const [f, setF] = useState<Form>(EMPTY);
  const [pv, setPv] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("1");
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const set = (k: keyof Form) => (v: string) => { setF({ ...f, [k]: v }); setPv(null); };

  const errs = useMemo(() => ({
    report_url: f.report_url && !isPinned(f.report_url) ? "Not pinned. Use GitHub raw at a full commit SHA, or a web.archive.org/web/<14 digits>/… snapshot." : "",
    audited_url: f.audited_url && !(githubPin(f.audited_url)?.path.endsWith(".sol")) ? "Use the GitHub raw link to the .sol file at the audited commit SHA." : "",
    fix_url: f.fix_url && !githubPin(f.fix_url) ? "Use the GitHub raw link at the fix commit SHA." : f.fix_url && githubPin(f.audited_url) && githubPin(f.fix_url) && githubPin(f.fix_url)!.path.split("/").pop() !== githubPin(f.audited_url)!.path.split("/").pop() ? "The fix link must point at the same file name." : "",
    finding_id: f.finding_id && !/^[A-Za-z0-9-]{2,16}$/.test(f.finding_id.trim()) ? "Like H-1 or M-14, as the report writes it." : "",
    function_name: f.function_name && !/^[A-Za-z_$][\w$]{0,63}$/.test(f.function_name.trim()) ? "Just the name, like maxDeposit — no parentheses." : "",
    address: f.address && !/^0x[0-9a-fA-F]{40}$/.test(f.address.trim()) ? "0x followed by 40 hex characters." : "",
    docs_url: f.docs_url && !isPinned(f.docs_url) ? "Not pinned. Use GitHub raw at a commit SHA or an archive.org snapshot." : "",
  }), [f]);
  const okStep = [
    f.report_url && f.audited_url && f.fix_url && !errs.report_url && !errs.audited_url && !errs.fix_url,
    f.finding_id && f.function_name && !errs.finding_id && !errs.function_name,
    f.address && f.docs_url && !errs.address && !errs.docs_url,
    Boolean(pv?.accepted),
    true,
  ];

  useEffect(() => {
    if (step !== 3 || pv) return;
    let live = true;
    setLoading(true);
    fetch("/api/preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, deployment: dep }) })
      .then((r) => r.json()).then((d) => { if (live) setPv(d); })
      .catch(() => { if (live) setPv({ steps: [{ id: "net", label: "Preview", ok: false, detail: "The preview couldn’t run. Check your connection and try again." }] }); })
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [step, pv, f, dep]);

  let wei = 0n;
  try { wei = BigInt(Math.round(Number(amount) * 1e6)) * 10n ** 12n; } catch { wei = 0n; }
  const busy = ["signing", "submitted", "validators"].includes(tx.phase);
  const checkId = tx.result && typeof tx.result.check_id === "number" ? (tx.result.check_id as number) : null;
  const base = dep === "demo" ? "/demo/checks" : "/checks";
  const shareUrl = typeof window !== "undefined" && checkId ? `${window.location.origin}${base}/${checkId}` : "";

  if (tx.phase === "done" && checkId) {
    const says = String(tx.result?.code_says ?? "");
    return (
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="plate p-6 sm:p-8">
          <p className="t-label">Check #{checkId} filed{dep === "demo" ? " on the demo deployment" : ""}</p>
          <h2 className="t-h1 mt-2">{f.finding_id} · <span className="mono text-[0.8em]">{f.function_name}()</span></h2>
          <p className="t-lede mt-3">{CHAIN_NAMES[f.chain]} <span className="mono text-[0.9em]">{f.address.slice(0, 8)}…{f.address.slice(-4)}</span></p>
          <p className="mt-6 font-serif text-[1.25rem] leading-snug">
            {says === "FIXED" ? "Code already sees the fix in the deployed function. Unless it changes, this will be decided fixed." :
              says === "NOT_FIXED" ? "Code sees the audited version still deployed. Unless it changes, this will be decided not fixed." :
              says === "INCONCLUSIVE" ? "Code can’t prove which code runs here. Everyone will be refunded." :
              says === "PREDATES_AUDIT" ? "The deployed code is the pre-audit version, and the contract was deployed before the audit and can’t be upgraded: unless it changes, this will be decided “predates audit” and everyone refunded." :
              says === "PREDATES_FIX" ? "The deployed code is the audited version, but it was deployed before the fix existed, so it could not contain it: this will be decided “predates fix” and everyone refunded." :
              "The deployed function differs from both versions; after the counter-stake window the model will be asked twice and must quote a line the fix added (or a removed line still deployed), otherwise everyone is refunded."}
          </p>
          <p className="t-small mt-4 text-ink-2">Anyone can counter-stake “fixed” for the next {Math.round(DEPLOYMENTS[dep].counterWindowS / 60)} minutes. After that, anyone can ask validators to decide.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link className="btn" href={`${base}/${checkId}`}>Open the check</Link>
            <a className="btn btn-quiet" href={`https://x.com/intent/post?text=${encodeURIComponent(`Audit says “Fixed”. Is it in the deployed code? Checking ${f.finding_id} on FixCheck:`)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer">Share on X</a>
            <span className="inline-flex items-center gap-1 t-small text-ink-2">Copy link <Copy value={shareUrl} label="Copy link" /></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <ol className="flex flex-wrap gap-x-1 gap-y-2 border-b hair pb-4" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-1">
            <button type="button" disabled={i > step && !okStep.slice(0, i).every(Boolean)} onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined}
              className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 t-small ${i === step ? "bg-ink text-sheet" : i < step ? "text-ink" : "text-ink-3"} disabled:cursor-not-allowed`}>
              <span className="tabular-nums opacity-70">{i + 1}</span>{s}
            </button>
            {i < STEPS.length - 1 && <span className="text-ink-3" aria-hidden="true">/</span>}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid content-start gap-6">
          {step === 0 && (<>
            <Field id="report_url" label="Sherlock report, pinned" hint="A Sherlock judging README on GitHub raw at a commit SHA, or a web.archive.org capture of one. Supports Sherlock contest reports; other auditors are future work." value={f.report_url} onChange={set("report_url")} error={errs.report_url} placeholder="https://raw.githubusercontent.com/…/<40-char sha>/README.md" />
            <Field id="audited_url" label="Audited source file" hint="The .sol file at the audited commit the report links." value={f.audited_url} onChange={set("audited_url")} error={errs.audited_url} />
            <Field id="fix_url" label="Fix source file" hint="The same file at the head commit of the fix PR that Sherlock’s status block links (or a commit it links), in the protocol’s own repo and merged. Required: it is what shows the fix." value={f.fix_url} onChange={set("fix_url")} error={errs.fix_url} />
          </>)}
          {step === 1 && (<>
            <Field id="finding_id" label="Finding id" hint="As the report writes it, like M-14." value={f.finding_id} onChange={set("finding_id")} error={errs.finding_id} />
            <Field id="function_name" label="Function the finding is about" hint="Its name must appear in the finding’s text." value={f.function_name} onChange={set("function_name")} error={errs.function_name} />
          </>)}
          {step === 2 && (<>
            <div className="grid gap-1.5">
              <label htmlFor="chain" className="font-medium">Chain</label>
              <select id="chain" className="field !font-sans" value={f.chain} onChange={(e) => set("chain")(e.target.value)}>
                {Object.entries(CHAIN_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <Field id="address" label="Deployed address" hint="A proxy is fine: its implementation is read from its EIP-1967 slot and checked against the explorer." value={f.address} onChange={set("address")} error={errs.address} />
            <Field id="docs_url" label="Protocol docs listing that address, pinned" hint="The protocol’s own page with its deployments, pinned to a commit or snapshot." value={f.docs_url} onChange={set("docs_url")} error={errs.docs_url} />
          </>)}
          {step === 3 && (
            <section aria-live="polite">
              <h2 className="t-h2">What code will check</h2>
              <p className="t-small mt-1 text-ink-2">Run now from our server with the contract’s rules, so you know before you pay. On chain, every validator repeats it independently.</p>
              {loading || !pv ? (
                <ul className="mt-5 grid gap-3" aria-busy="true">{[0, 1, 2, 3, 4, 5].map((i) => <li key={i} className="skeleton h-12" />)}</ul>
              ) : (
                <>
                  <ul className="mt-5 border-t hair">
                    {pv.steps.map((s) => (
                      <li key={s.id} className="grid grid-cols-[1.5rem_1fr] gap-3 border-b hair py-3">
                        <span aria-hidden="true" className="pt-0.5" style={{ color: s.ok ? "var(--fixed)" : s.ok === false ? "var(--bad)" : "var(--ink-3)" }}>{s.ok ? "✓" : s.ok === false ? "✕" : "–"}</span>
                        <div><p className="font-medium">{s.label}<span className="sr-only">{s.ok ? ": passes" : s.ok === false ? ": fails" : ": not checked"}</span></p><p className="t-small text-ink-2">{s.detail}</p></div>
                      </li>
                    ))}
                  </ul>
                  {pv.outcome && <p className="sheet mt-5 p-4 font-serif text-[1.1rem] leading-snug">{pv.outcome}</p>}
                  {pv.openId ? <p className="mt-4"><Link className="btn btn-quiet" href={`${base}/${pv.openId}`}>Open check #{pv.openId}</Link></p> : null}
                  {pv.deployed && (
                    <details className="sheet mt-4 p-4"><summary className="cursor-pointer t-small font-medium">The deployed function, as validators will read it</summary>
                      <pre className="code mt-3 max-h-80 overflow-auto whitespace-pre">{pv.deployed}</pre></details>
                  )}
                  <button type="button" className="link t-small mt-4" onClick={() => setPv(null)}>Run the preview again</button>
                </>
              )}
            </section>
          )}
          {step === 4 && (
            <section>
              <h2 className="t-h2">Stake that it’s not fixed</h2>
              <p className="mt-2 max-w-[60ch] text-ink-2">Your stake says the deployed code does not contain the fix. If the verdict is not fixed, you take every defender’s stake. If fixed, defenders take yours (or, with no defender, you get it back minus a 2% fee). Inconclusive refunds everyone.</p>
              <div className="mt-5 grid gap-1.5">
                <span className="font-medium">Deployment</span>
                <div role="radiogroup" aria-label="Deployment" className="flex flex-wrap gap-2">
                  {(["canonical", "demo"] as Deployment[]).map((d) => (
                    <button key={d} type="button" role="radio" aria-checked={dep === d} onClick={() => { setDep(d); setPv(null); }}
                      className={`rounded-md border px-3 py-2 text-left t-small ${dep === d ? "border-ink" : "hair text-ink-2"}`}>
                      <span className="font-medium text-ink">{DEPLOYMENTS[d].label}</span><br />{d === "demo" ? "90-second counter window, for trying it" : "1-hour counter window, counts on the scorecard"}
                    </button>
                  ))}
                </div>
              </div>
              <label className="mt-5 grid max-w-xs gap-1.5"><span className="font-medium">Stake (GEN)</span>
                <input className="field" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={wei < 10n ** 17n} aria-describedby="stake-hint" />
                <span id="stake-hint" className="t-small text-ink-3">Minimum 0.1 GEN. Studio Dev GEN is free test currency.</span>
              </label>
              <div className="mt-6">
                {!w.account || !w.onRightNetwork ? <WalletButton /> : (
                  <button type="button" className="btn" disabled={busy || wei < 10n ** 17n || !pv?.accepted}
                    onClick={() => void sendWrite(w.account!, DEPLOYMENTS[dep].address, "file_check", [f.report_url.trim(), f.finding_id.trim(), f.function_name.trim(), f.audited_url.trim(), f.fix_url.trim(), f.chain, f.address.trim(), f.docs_url.trim()], wei, setTx)}>
                    {busy ? "Filing…" : `File the check with ${amount || 0} GEN`}
                  </button>
                )}
                {!pv?.accepted && <p className="t-small mt-2 text-ink-3">Run the review step first; filing opens once the preview passes.</p>}
              </div>
              <TxProgress s={tx} />
            </section>
          )}

          <div className="flex gap-3 border-t hair pt-5">
            {step > 0 && <button type="button" className="btn btn-quiet" onClick={() => setStep(step - 1)}>Back</button>}
            {step < 4 && <button type="button" className="btn" disabled={!okStep[step]} onClick={() => setStep(step + 1)}>{step === 2 ? "Review what code will check" : step === 3 ? "Continue to stake" : "Continue"}</button>}
          </div>
        </div>

        <aside className="order-first grid content-start gap-4 lg:order-none">
          <div className="sheet p-5">
            <h2 className="t-label">Start from a real finding</h2>
            <ul className="mt-2 grid gap-1">
              {EXAMPLES.map((e) => (
                <li key={e.label}><button type="button" className="link text-left t-small" onClick={() => { const { label, ...rest } = e; void label; setF(rest); setPv(null); setStep(3); }}>{e.label}</button></li>
              ))}
            </ul>
          </div>
          <div className="t-small text-ink-2">
            <p>Not sure what counts as pinned? A link that can’t change: a commit SHA in the URL, or an archive snapshot with a full timestamp. <Link className="link" href="/how-it-works">How it works</Link></p>
          </div>
        </aside>
      </div>
    </div>
  );
}
