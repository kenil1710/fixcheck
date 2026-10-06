"use client";
import { useEffect, useRef, useState } from "react";

/** Counts up once on load; respects reduced motion; the final number is in the HTML for no-JS and screen readers. */
export function Tally({ value, className = "" }: { value: number; className?: string }) {
  const [n, setN] = useState(value);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || value === 0) return;
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setN(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className}><span aria-hidden="true">{n}</span><span className="sr-only">{value}</span></span>;
}
