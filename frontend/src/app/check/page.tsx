import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckFlow } from "./CheckFlow";

export const metadata: Metadata = { title: "Check a finding", description: "Point FixCheck at a finding marked fixed and the deployed contract; see what code will check before you stake." };

export default function CheckPage() {
  return (
    <div className="pt-12">
      <h1 className="t-h1">Check a finding</h1>
      <p className="t-lede mt-3 max-w-[62ch]">Pick a finding an audit marked fixed and the contract it’s deployed in. You’ll see exactly what code will check before you stake anything.</p>
      <Suspense fallback={<div className="skeleton mt-8 h-64" />}><CheckFlow /></Suspense>
    </div>
  );
}
