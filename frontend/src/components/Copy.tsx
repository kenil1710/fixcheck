"use client";
import { useState } from "react";
import { IconCopy } from "./Icons";

export function Copy({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1400); } catch { /* clipboard blocked */ }
      }}
      className="inline-flex h-7 min-w-7 items-center justify-center gap-1 rounded px-1.5 text-ink-3 hover:text-ink hover:bg-sheet-2"
      aria-label={done ? "Copied" : `${label}: ${value}`}
      title={done ? "Copied" : label}
    >
      {done ? <span className="t-label text-fixed">Copied</span> : <IconCopy />}
    </button>
  );
}
