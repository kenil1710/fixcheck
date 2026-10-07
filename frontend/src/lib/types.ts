export type Verdict = "FIXED" | "NOT_FIXED" | "INCONCLUSIVE" | "PREDATES_AUDIT" | "";
export type CheckState = "OPEN" | "DECIDED" | "EXPIRED";

export type Check = {
  check_id: number; key: string; protocol: string; firm: string; report_url: string; finding_id: string; function: string;
  audited_url: string; audited_commit: string; fix_url: string; fix_commit: string; chain: string; address: string;
  implementation: string; impl_source_sha256: string; impl_source_url: string; docs_url: string; source_url: string; title: string; status_phrase: string;
  section_sha256: string; audit_binding: string; fix_ref: string; patch_sha256: string; audited_at: number; created_at: number; creation_tx: string;
  report_sha256: string; docs_sha256: string; audited_sha256: string; fix_sha256: string; source_sha256: string;
  aud_canon_sha256: string; fix_canon_sha256: string; dep_canon_sha256: string; dep_status: string;
  challenger: string; stake_wei: string; defended_wei: string; defenders: number; filed_at: number;
  counter_deadline: number; decide_deadline: number; state: CheckState; verdict: Verdict; basis: string;
  model_votes: string; quote_lines: string; quote_sha256: string; decided_at: number;
  challenger_paid_wei: string; fee_paid_wei: string;
};
export type CheckCode = { check_id: number; audited: string; fix: string; deployed: string; section: string };
export type Defender = { address: string; stake_wei: string; at: number };
export type Score = { checks: number; open: number; fixed: number; not_fixed: number; inconclusive: number; expired: number; predates_audit: number };
export type ProtocolScore = Score & { protocol: string };
export type Stats = Score & { protocols: number; staked_open_wei: string };
export type Ledger = { balance_wei: string; open_stakes_wei: string; claimable_wei: string; fees_wei: string; total_withdrawn_wei: string; total_fees_swept_wei: string; invariant_holds: boolean };
export type Config = { version: string; mode: string; counter_window_s: number; decide_window_s: number; fee_bps: number; fee_recipient: string; min_stake_wei: string; max_defenders: number; chains: string[] };
