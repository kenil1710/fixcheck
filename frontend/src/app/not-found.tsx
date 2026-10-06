import Link from "next/link";
export default function NotFound() {
  return (
    <div className="py-24">
      <h1 className="t-h1">Nothing here</h1>
      <p className="t-lede mt-3 max-w-[50ch]">That page or check doesn’t exist. Checks are numbered from 1 in the order they were filed.</p>
      <p className="mt-6 flex gap-3"><Link className="btn" href="/checks">All checks</Link><Link className="btn btn-quiet" href="/">Home</Link></p>
    </div>
  );
}
