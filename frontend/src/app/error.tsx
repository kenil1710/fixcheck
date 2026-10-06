"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-24">
      <h1 className="t-h1">This page didn’t load</h1>
      <p className="t-lede mt-3 max-w-[54ch]">Something failed while reading the contract. No verdict is shown rather than a wrong one. Try again — Studio Dev usually recovers within a minute.</p>
      <button className="btn mt-6" onClick={reset}>Try again</button>
    </div>
  );
}
