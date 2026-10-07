"use client";
import { useMemo, useState } from "react";
import { dedent, diffLines, squeeze, type Row } from "@/lib/diff";
import { codeLines } from "@/lib/solfn";
import { commit7, short } from "@/lib/format";
import { CHAIN_NAMES } from "@/lib/catalog";

type Props = {
  audited: string;
  fix: string;
  deployed: string;
  quoted: number[];              // indices into the deployed function's lines
  tone: "fixed" | "bad" | "unsure" | "open" | "predates";
  fn: string;
  auditedCommit: string;
  fixCommit: string;
  chain: string;
  address: string;
  depStatus: string;
};

type Against = "audited" | "fix";

export function DiffViewer(p: Props) {
  const [against, setAgainst] = useState<Against>("audited");
  const [mobileSide, setMobileSide] = useState<"left" | "right">("right");
  const left = useMemo(() => dedent(codeLines(against === "audited" ? p.audited : p.fix)), [against, p.audited, p.fix]);
  const right = useMemo(() => (p.deployed ? dedent(codeLines(p.deployed)) : []), [p.deployed]);
  const rows = useMemo(() => squeeze(diffLines(left, right)), [left, right]);
  const changed = rows.filter((r) => r.kind !== "same").length;
  const quoted = new Set(p.quoted);
  const qCls = p.tone === "fixed" ? "q-fixed" : p.tone === "bad" ? "q-bad" : p.tone === "predates" ? "q-predates" : "q-unsure";
  const leftLabel = against === "audited" ? `Audited · ${commit7(p.auditedCommit)}` : `Fix commit · ${commit7(p.fixCommit)}`;
  const rightLabel = `Deployed · ${CHAIN_NAMES[p.chain] ?? p.chain} ${short(p.address)}`;

  const summary = !p.deployed
    ? "The function could not be read from the deployed source."
    : changed === 0
      ? `Deployed ${p.fn}() is identical to the ${against === "audited" ? "audited" : "fixed"} version, line for line (comments and whitespace aside).`
      : `${changed} line${changed === 1 ? "" : "s"} differ between the ${against === "audited" ? "audited" : "fixed"} and the deployed ${p.fn}().`;

  const cell = (r: Row, side: "left" | "right") => {
    const s = side === "left" ? r.left : r.right;
    const isQ = side === "right" && s && quoted.has(s.n);
    const changedRow = r.kind !== "same";
    const cls = [
      "flex min-h-[1.7em] whitespace-pre",
      changedRow && s ? "row-change sweep" : "",
      !s ? "opacity-0" : "",
      isQ ? qCls : "",
    ].join(" ");
    return (
      <div className={cls} style={changedRow && s ? ({ ["--sweep-c" as string]: "var(--chg)" } as React.CSSProperties) : undefined}>
        <span className="ln shrink-0">{s ? s.n + 1 : ""}</span>
        <span className="pr-4">{s ? s.text || " " : " "}</span>
        {isQ && s && !quoted.has(s.n - 1) && (
          <span className="qnote sticky right-0 ml-auto shrink-0 self-stretch pl-6 pr-2 font-sans text-[0.72rem] italic flex items-center leading-none" style={{ color: `var(--${p.tone === "open" || p.tone === "predates" ? "ink-2" : p.tone})` }}>quoted by validators</span>
        )}
      </div>
    );
  };

  return (
    <section aria-labelledby="diff-title" className="plate overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b hair px-4 py-3">
        <h2 id="diff-title" className="mono t-small font-medium">{p.fn}()</h2>
        <div role="group" aria-label="Compare the deployed function with" className="flex rounded-md border hair p-0.5 t-small">
          {(["audited", "fix"] as Against[]).map((a) => (
            <button key={a} type="button" aria-pressed={against === a} disabled={a === "fix" && !p.fix}
              onClick={() => setAgainst(a)}
              className={`rounded px-2.5 py-1 ${against === a ? "bg-ink text-sheet" : "text-ink-2 hover:text-ink"} disabled:opacity-40`}>
              {a === "audited" ? "vs audited" : "vs fix"}
            </button>
          ))}
        </div>
      </div>
      <p className="border-b hair px-4 py-2.5 t-small text-ink-2" aria-live="polite">{summary}</p>

      {/* phones: one column at a time */}
      <div className="md:hidden">
        <div role="tablist" aria-label="Which version" className="flex border-b hair t-small">
          {(["left", "right"] as const).map((s) => (
            <button key={s} role="tab" type="button" aria-selected={mobileSide === s} onClick={() => setMobileSide(s)}
              className={`flex-1 px-3 py-2.5 text-left ${mobileSide === s ? "font-semibold text-ink shadow-[inset_0_-2px_0_var(--ink)]" : "text-ink-2"}`}>
              {s === "left" ? leftLabel : "Deployed"}
            </button>
          ))}
        </div>
        <div className="code overflow-x-auto py-2" role="tabpanel">
          {rows.filter((r) => (mobileSide === "left" ? r.left : r.right)).map((r, i) => <div key={i}>{cell(r, mobileSide)}</div>)}
        </div>
      </div>

      {/* tablet and up: side by side, rows aligned */}
      <div className="hidden md:block">
        <div className="grid grid-cols-2 border-b hair t-label">
          <div className="border-r hair px-4 py-2">{leftLabel}</div>
          <div className="px-4 py-2">{rightLabel}</div>
        </div>
        <div className="code grid grid-cols-2 py-2">
          <div className="min-w-0 overflow-x-auto border-r hair">{rows.map((r, i) => <div key={i}>{cell(r, "left")}</div>)}</div>
          <div className="relative min-w-0 overflow-x-auto">{rows.map((r, i) => <div key={i}>{cell(r, "right")}</div>)}</div>
        </div>
      </div>

      {p.quoted.length > 0 && (
        <p className="flex items-center gap-2 border-t hair px-4 py-2.5 t-small text-ink-2">
          <span className={`inline-block h-3 w-5 rounded-sm ${qCls}`} aria-hidden="true" />
          Highlighted lines {p.quoted.map((n) => n + 1).join(", ")} were quoted by validators; code checked each one exists in the deployed function.
        </p>
      )}
      <p className="border-t hair px-4 py-2.5 t-label">Comments are removed before anything is compared or shown to a model — they can’t fake a fix.</p>
    </section>
  );
}
