/** The mark: a lens over a single checked line of code. */
export function Mark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect x="1" y="1" width="30" height="30" rx="7" fill="var(--ink)" />
      <circle cx="14" cy="14" r="7.25" fill="none" stroke="var(--sheet)" strokeWidth="2.2" />
      <path d="M19.4 19.4 25 25" stroke="var(--sheet)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M10.6 14.2l2.3 2.3 4.3-4.6" fill="none" stroke="var(--sheet)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark />
      <span className="font-serif text-[1.35rem] font-semibold tracking-[-0.01em] leading-none">FixCheck</span>
    </span>
  );
}
