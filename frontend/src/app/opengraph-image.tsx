import { C, Mark, render } from "@/lib/og";
import { getStats } from "@/lib/reads";
export const alt = "FixCheck — the audit says it was fixed. Is the fix deployed?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 300;
export default async function Image() {
  const s = await getStats();
  const n = s.ok ? s.data : null;
  const cell = (v: number | string, l: string, col: string) => (
    <div style={{ display: "flex", flexDirection: "column", paddingRight: 40 }}>
      <span style={{ fontFamily: "Newsreader", fontSize: 76, color: col, lineHeight: 1 }}>{v}</span>
      <span style={{ fontSize: 22, color: C.ink2, marginTop: 8 }}>{l}</span>
    </div>
  );
  return render(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.paper, padding: "56px 64px", fontFamily: "Instrument", color: C.ink,
      backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`, backgroundSize: "24px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}><Mark /><span style={{ fontFamily: "Newsreader", fontSize: 34 }}>FixCheck</span></div>
      <div style={{ display: "flex", marginTop: 48, fontFamily: "Newsreader", fontSize: 72, lineHeight: 1.04, letterSpacing: -1.5, maxWidth: 980 }}>The audit says it was fixed. Is the fix deployed?</div>
      {n && <div style={{ display: "flex", marginTop: "auto" }}>
        {cell(n.checks, "findings marked Fixed", C.ink)}{cell(n.fixed, "confirmed in deployed code", C.fixed)}{cell(n.not_fixed, "not in deployed code", C.bad)}{cell(n.inconclusive + n.expired, "inconclusive", C.unsure)}
      </div>}
    </div>,
  );
}
