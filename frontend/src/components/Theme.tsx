"use client";
import { useEffect, useState } from "react";

type Mode = "system" | "light" | "dark";
const KEY = "fixcheck-theme";

export const themeScript = `(function(){try{var m=localStorage.getItem("${KEY}");if(m==="light"||m==="dark")document.documentElement.setAttribute("data-theme",m)}catch(e){}})();`;

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");
  useEffect(() => {
    try { const m = localStorage.getItem(KEY); if (m === "light" || m === "dark") setMode(m); } catch { /* storage blocked */ }
  }, []);
  const next: Record<Mode, Mode> = { system: "light", light: "dark", dark: "system" };
  const apply = (m: Mode) => {
    setMode(m);
    try { if (m === "system") localStorage.removeItem(KEY); else localStorage.setItem(KEY, m); } catch { /* ignore */ }
    if (m === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", m);
  };
  const label = mode === "system" ? "Theme: follows your system" : mode === "light" ? "Theme: light" : "Theme: dark";
  return (
    <button type="button" onClick={() => apply(next[mode])} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-2 hover:text-ink hover:bg-sheet-2" aria-label={`${label}. Change theme`} title={label}>
      <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        {mode === "light" ? null : mode === "dark" ? <path d="M10 2.5a7.5 7.5 0 0 0 0 15z" fill="currentColor" /> : <path d="M10 2.5a7.5 7.5 0 0 1 0 15z" fill="currentColor" opacity="0.55" />}
      </svg>
    </button>
  );
}
