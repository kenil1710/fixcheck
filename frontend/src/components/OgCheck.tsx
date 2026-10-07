import { C, Mark, render } from "@/lib/og";
import { getCheck } from "@/lib/reads";
import { CHAIN_NAMES, protocolMeta } from "@/lib/catalog";
import { basisOf } from "@/lib/basis";
import type { Deployment } from "@/lib/deployments";

export async function ogForCheck(idRaw: string, dep: Deployment) {
  const id = Number(idRaw);
  const r = Number.isInteger(id) && id > 0 ? await getCheck(id, dep) : null;
  const c = r?.ok ? r.data : null;
  const v = !c ? null : c.state === "OPEN" ? "OPEN" : c.verdict === "FIXED" ? "FIXED" : c.verdict === "NOT_FIXED" ? "NOT_FIXED" : c.verdict === "PREDATES_AUDIT" ? "PREDATES" : c.verdict === "PREDATES_FIX" ? "PREDATES_FIX" : "INCONCLUSIVE";
  const look = v === "FIXED" ? { fg: C.fixed, bg: C.fixedBg, word: "Fixed in deployed code" } : v === "NOT_FIXED" ? { fg: C.bad, bg: C.badBg, word: "Not in deployed code" }
    : v === "OPEN" ? { fg: C.ink2, bg: C.sheet, word: "Being checked" } : v === "PREDATES" ? { fg: C.ink2, bg: C.sheet, word: "Deployed before the audit" } : v === "PREDATES_FIX" ? { fg: C.ink2, bg: C.sheet, word: "Deployed before the fix" } : { fg: C.unsure, bg: C.unsureBg, word: "Inconclusive" };
  const title = c ? c.title.replace(/^Issue [A-Z]-\d+:\s*/, "").replace(/`/g, "") : "FixCheck";
  const t = title.length > 120 ? title.slice(0, 117).replace(/\s+\S*$/, "") + "…" : title;
  return render(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: C.paper, padding: "56px 64px", fontFamily: "Instrument", color: C.ink,
      backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`, backgroundSize: "24px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Mark />
        <span style={{ fontFamily: "Newsreader", fontSize: 34 }}>FixCheck</span>
        <span style={{ marginLeft: "auto", fontSize: 24, color: C.ink3 }}>{c ? `${protocolMeta(c.protocol).name} · ${c.finding_id}` : ""}</span>
      </div>
      <div style={{ display: "flex", marginTop: 54, fontFamily: "Newsreader", fontSize: t.length > 80 ? 52 : 62, lineHeight: 1.08, letterSpacing: -1, maxWidth: 1040 }}>{t}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 26px", borderRadius: 999, border: `2px solid ${look.fg}`, background: look.bg, color: look.fg, fontSize: 30, fontWeight: 600 }}>
          {look.word}
        </div>
        {c && <span style={{ fontSize: 24, color: C.ink2 }}>{c.state === "OPEN" ? "Counter-stake window open" : basisOf(c.basis).short}</span>}
      </div>
      {c && <div style={{ display: "flex", marginTop: 26, fontFamily: "Plex", fontSize: 22, color: C.ink2 }}>{`${c.function}() · ${CHAIN_NAMES[c.chain] ?? c.chain} ${c.address.slice(0, 8)}…${c.address.slice(-4)}`}</div>}
    </div>,
  );
}
