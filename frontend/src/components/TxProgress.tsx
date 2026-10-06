"use client";
import { EXPLORER } from "@/lib/deployments";
import type { TxState } from "@/lib/tx";

const STEPS: { key: string; label: string; detail: string }[] = [
  { key: "signing", label: "Signing", detail: "Confirm in your wallet." },
  { key: "submitted", label: "Sent", detail: "The transaction reached GenLayer." },
  { key: "validators", label: "Validators reading sources", detail: "Each validator fetches the evidence and checks it independently." },
  { key: "done", label: "Final", detail: "Validators agreed. The result is recorded." },
];

/** signing → validators reading sources → final, with the explorer link. */
export function TxProgress({ s, deciding = false }: { s: TxState; deciding?: boolean }) {
  if (s.phase === "idle") return null;
  const order = ["signing", "submitted", "validators", "done"];
  const at = s.phase === "failed" ? -1 : order.indexOf(s.phase);
  return (
    <div className="mt-4" role="status" aria-live="polite">
      <ol className="grid gap-2">
        {STEPS.map((st, i) => {
          const done = at > i || s.phase === "done";
          const now = at === i && s.phase !== "done";
          const label = st.key === "validators" && deciding ? "Validators deciding" : st.label;
          return (
            <li key={st.key} className={`flex items-start gap-3 t-small ${done || now ? "text-ink" : "text-ink-3"}`}>
              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: done ? "var(--fixed)" : "var(--rule)", background: done ? "var(--fixed)" : "transparent" }} aria-hidden="true">
                {done ? <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5.2 4 7.2 8 3" stroke="var(--sheet)" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg> : now ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink" /> : null}
              </span>
              <span><span className="font-medium">{label}</span>{now && <span className="text-ink-2"> — {st.detail}</span>}</span>
            </li>
          );
        })}
      </ol>
      {s.phase === "failed" && <p className="mt-3 rounded-md border p-3 t-small" style={{ borderColor: "var(--bad)", background: "var(--bad-bg)" }}>{s.error}</p>}
      {s.hash && <p className="mt-3 t-small"><a className="link mono" href={`${EXPLORER}/tx/${s.hash}`} target="_blank" rel="noreferrer">View transaction {s.hash.slice(0, 10)}… in the explorer</a></p>}
    </div>
  );
}
