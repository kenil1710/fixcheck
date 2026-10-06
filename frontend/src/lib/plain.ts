/** genlayer-js decodes contract dicts as Map and ints as bigint; pages want plain JSON. */
export function plain<T = unknown>(v: unknown): T {
  if (v instanceof Map) return Object.fromEntries([...v.entries()].map(([k, x]) => [String(k), plain(x)])) as T;
  if (Array.isArray(v)) return v.map((x) => plain(x)) as T;
  if (typeof v === "bigint") return (Number.isSafeInteger(Number(v)) ? Number(v) : v.toString()) as T;
  if (v && typeof v === "object" && v.constructor === Object) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)])) as T;
  return v as T;
}
