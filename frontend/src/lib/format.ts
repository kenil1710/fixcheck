export const short = (a: string, head = 6, tail = 4) => (a && a.length > head + tail + 2 ? `${a.slice(0, head)}…${a.slice(-tail)}` : a);
export function gen(wei: string | number | bigint | undefined, dp = 2): string {
  const w = BigInt(wei ?? 0);
  const whole = w / 10n ** 18n;
  const frac = Number(w % 10n ** 18n) / 1e18;
  const n = Number(whole) + frac;
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: dp });
}
export function when(ts: number): string {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";
}
export function day(ts: number): string {
  return ts ? new Date(ts * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "";
}
export function untilText(ts: number, now = Date.now() / 1000): string {
  const s = Math.round(ts - now);
  if (s <= 0) return "passed";
  if (s < 90) return `${s}s`;
  if (s < 5400) return `${Math.round(s / 60)} min`;
  if (s < 172800) return `${Math.round(s / 3600)} h`;
  return `${Math.round(s / 86400)} days`;
}
export const commit7 = (sha: string) => (sha ? sha.slice(0, 7) : "");
export function fileOf(url: string): string {
  const p = url.split("/");
  return p.slice(6).join("/") || url;
}
export function repoOf(url: string): string {
  const p = url.split("/");
  return p.length > 5 ? `${p[3]}/${p[4]}` : url;
}
