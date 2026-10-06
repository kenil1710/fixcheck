/** Report titles use `backticks` for code; render those spans as code. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return <>{parts.map((p, i) => (p.startsWith("`") && p.endsWith("`") && p.length > 2 ? <code key={i} className="rounded-sm bg-[var(--sheet-2)] px-1 text-[0.82em]">{p.slice(1, -1)}</code> : <span key={i}>{p}</span>))}</>;
}
