/** Renders `code` spans of a finding title in mono. */
export function Title({ text }: { text: string }) {
  const parts = text.split("`");
  return <>{parts.map((p, i) => (i % 2 === 1 ? <code key={i} className="mono text-[0.92em]">{p}</code> : <span key={i}>{p}</span>))}</>;
}
