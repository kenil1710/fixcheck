import Link from "next/link";
import { diffLines, dedent, squeeze } from "@/lib/diff";
import { codeLines } from "@/lib/solfn";
import { CHAIN_NAMES, protocolMeta } from "@/lib/catalog";
import { commit7, day, short } from "@/lib/format";
import type { Check, CheckCode } from "@/lib/types";

/**
 * The landing specimen: the deployed function read against the fix commit.
 * Lines the fix adds that the deployed code does not have are shown as such.
 */
export function Specimen({ check, code }: { check: Check; code: CheckCode }) {
  const dep = dedent(codeLines(code.deployed));
  const fix = dedent(codeLines(code.fix));
  const rows = squeeze(diffLines(dep, fix));
  const first = Math.max(0, rows.findIndex((r) => r.kind !== "same") - 3);
  const win = rows.slice(first, first + 13);
  const missing = rows.filter((r) => r.kind === "add" || r.kind === "change").length;
  return (
    <figure className="plate overflow-hidden" aria-labelledby="specimen-cap">
      <div className="flex items-baseline justify-between gap-3 border-b hair px-4 py-3">
        <span className="mono t-small truncate">{check.function}()</span>
        <span className="t-label shrink-0">{CHAIN_NAMES[check.chain]} · <span className="mono">{short(check.address)}</span></span>
      </div>
      <div className="code overflow-x-auto py-2">
        {win.map((r, i) => {
          const fixLine = r.kind === "add" || r.kind === "change";
          const depOnly = r.kind === "del" || r.kind === "change";
          return (
            <div key={i}>
              {depOnly && (
                <div className="flex whitespace-pre q-bad">
                  <span className="w-6 shrink-0" aria-hidden="true" />
                  <span className="pr-3"><span className="sr-only">Deployed, as audited: </span>{r.left!.text}</span>
                  <span className="qnote sticky right-0 ml-auto shrink-0 self-stretch pl-6 pr-2 flex items-center leading-none font-sans text-[0.72rem] italic" style={{ color: "var(--bad)" }} aria-hidden="true">deployed, as audited</span>
                </div>
              )}
              {fixLine && (
                <div className="flex whitespace-pre text-ink-3" style={{ boxShadow: "inset 3px 0 0 var(--rule)" }}>
                  <span className="w-6 shrink-0" aria-hidden="true" />
                  <span className="pr-3"><span className="sr-only">Only in the fix: </span>{r.right!.text}</span>
                  <span className="qnote sticky right-0 ml-auto shrink-0 self-stretch pl-6 pr-2 flex items-center leading-none font-sans text-[0.72rem] italic" aria-hidden="true">the fix, not deployed</span>
                </div>
              )}
              {r.kind === "same" && (
                <div className="flex whitespace-pre"><span className="w-6 shrink-0" aria-hidden="true" /><span className="pr-4">{r.left.text}</span></div>
              )}
            </div>
          );
        })}
      </div>
      <figcaption id="specimen-cap" className="border-t hair px-4 py-3 t-small text-ink-2">
        <strong className="text-ink">{protocolMeta(check.protocol).name}, {check.finding_id}.</strong>{" "}
        Marked fixed in the audit report. Deployed {day(check.created_at)}, after the audited commit ({day(check.audited_at)}) and after the fix existed ({day(check.fix_at)}); the deployed code still runs the audited line{missing === 1 ? "" : "s"}; the line{missing === 1 ? "" : "s"} written by fix commit <span className="mono">{commit7(check.fix_commit)}</span> {missing === 1 ? "is" : "are"} not there.{" "}
        <Link className="link" href={`/checks/${check.check_id}`}>See the evidence</Link>
      </figcaption>
    </figure>
  );
}
