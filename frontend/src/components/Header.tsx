"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Wordmark } from "./Logo";
import { ThemeToggle } from "./Theme";
import { WalletButton } from "./WalletButton";

const NAV = [
  { href: "/protocols", label: "Protocols" },
  { href: "/checks", label: "All checks" },
  { href: "/how-it-works", label: "How it works" },
];

export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b hair bg-paper">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="no-underline" aria-label="FixCheck home"><Wordmark /></Link>
        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={path.startsWith(n.href) ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-[0.95rem] no-underline hover:bg-sheet-2 ${path.startsWith(n.href) ? "text-ink font-semibold" : "text-ink-2"}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/check" className="btn btn-sm hidden sm:inline-flex">Check a finding</Link>
          <div className="hidden sm:block"><WalletButton /></div>
          <ThemeToggle />
          <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-sheet-2 md:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d={open ? "M5 5l10 10M15 5 5 15" : "M3 6h14M3 10h14M3 14h14"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" className="border-t hair px-4 pb-4 md:hidden" aria-label="Main">
          {[...NAV, { href: "/check", label: "Check a finding" }, { href: "/balance", label: "Balance" }].map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block border-b hair py-3 text-[1.05rem] no-underline">{n.label}</Link>
          ))}
          <div className="pt-4"><WalletButton /></div>
        </nav>
      )}
    </header>
  );
}
