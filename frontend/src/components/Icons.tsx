type P = { className?: string; size?: number };
export const IconFixed = ({ className = "", size = 14 }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className={className}><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M4.8 8.2l2.1 2.1 4.3-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const IconBad = ({ className = "", size = 14 }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className={className}><path d="M8 1.2 15 14H1z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M8 6v3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><circle cx="8" cy="11.8" r="1" fill="currentColor" /></svg>
);
export const IconUnsure = ({ className = "", size = 14 }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className={className}><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.6 1.8" /><path d="M5 8h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
);
export const IconOpen = ({ className = "", size = 14 }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className={className}><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M8 4.2V8l2.6 1.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
export const IconCopy = ({ className = "", size = 14 }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className={className}><rect x="5" y="5" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M11 3.5V3a1.5 1.5 0 0 0-1.5-1.5h-6A1.5 1.5 0 0 0 2 3v6.5A1.5 1.5 0 0 0 3.5 11H4" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
);
export const IconExternal = ({ className = "", size = 12 }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className={className}><path d="M9 2h5v5M14 2 7.5 8.5M12 9.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
