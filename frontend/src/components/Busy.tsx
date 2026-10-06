import Link from "next/link";

/** Shown when Studio Dev can't be read. Never shows a guessed verdict. */
export function Busy({ what = "this page" }: { what?: string }) {
  return (
    <div className="sheet my-10 max-w-xl p-6" role="status">
      <h2 className="t-h3">The network is busy</h2>
      <p className="mt-2 text-ink-2">GenLayer Studio Dev didn&apos;t answer while loading {what}. Nothing is shown rather than something wrong. Reload in a moment; it usually answers within a minute.</p>
      <p className="mt-4"><Link href="" className="btn btn-quiet btn-sm" prefetch={false}>Reload</Link></p>
    </div>
  );
}
export function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="plate my-8 p-8 text-center">
      <h2 className="t-h3">{title}</h2>
      <div className="mx-auto mt-2 max-w-md text-ink-2">{children}</div>
    </div>
  );
}
