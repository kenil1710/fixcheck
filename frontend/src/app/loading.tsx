export default function Loading() {
  return (
    <div className="pt-14" role="status" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-12 w-2/3" />
      <div className="skeleton mt-4 h-5 w-1/2" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="skeleton h-40" /><div className="skeleton h-40" />
      </div>
    </div>
  );
}
