import { IconBad, IconFixed, IconOpen, IconPredates, IconUnsure } from "./Icons";

export type StatusKind = "FIXED" | "NOT_FIXED" | "INCONCLUSIVE" | "PREDATES" | "PREDATES_FIX" | "OPEN" | "EXPIRED";

export function statusOf(state: string, verdict: string): StatusKind {
  if (state === "OPEN") return "OPEN";
  if (state === "EXPIRED") return "EXPIRED";
  if (verdict === "FIXED") return "FIXED";
  if (verdict === "NOT_FIXED") return "NOT_FIXED";
  if (verdict === "PREDATES_AUDIT") return "PREDATES";
  if (verdict === "PREDATES_FIX") return "PREDATES_FIX";
  return "INCONCLUSIVE";
}

const META: Record<StatusKind, { cls: string; word: string; Icon: typeof IconFixed }> = {
  FIXED: { cls: "status-fixed", word: "Fixed", Icon: IconFixed },
  NOT_FIXED: { cls: "status-bad", word: "Not fixed", Icon: IconBad },
  INCONCLUSIVE: { cls: "status-unsure", word: "Inconclusive", Icon: IconUnsure },
  EXPIRED: { cls: "status-unsure", word: "Expired", Icon: IconUnsure },
  PREDATES: { cls: "status-predates", word: "Predates audit", Icon: IconPredates },
  PREDATES_FIX: { cls: "status-predates", word: "Predates fix", Icon: IconPredates },
  OPEN: { cls: "status-open", word: "Being checked", Icon: IconOpen },
};

export function Status({ kind, large = false, settle = false }: { kind: StatusKind; large?: boolean; settle?: boolean }) {
  const m = META[kind];
  return (
    <span className={`status ${m.cls} ${large ? "status-lg" : ""} ${settle ? "settle" : ""}`}>
      <m.Icon size={large ? 16 : 13} />
      {m.word}
    </span>
  );
}

export const tone = (k: StatusKind) => (k === "FIXED" ? "fixed" : k === "NOT_FIXED" ? "bad" : k === "OPEN" ? "open" : k === "PREDATES" || k === "PREDATES_FIX" ? "predates" : "unsure");
