/** Every basis the contract can store, in plain words. */
export const BASIS: Record<string, { short: string; long: string; by: "code" | "model" | "deadline" }> = {
  CODE_MATCH_FIX: { short: "Identical to the fix", long: "Deployed code is identical to the fix commit.", by: "code" },
  CODE_MATCH_VULNERABLE: { short: "Identical to the audited code", long: "Deployed code is identical to the audited version — the one the finding was about.", by: "code" },
  FUNCTION_MISSING: { short: "Function not found", long: "The named function is not in the deployed verified source, so code can't compare it. Everyone was refunded.", by: "code" },
  FUNCTION_OVERLOADED: { short: "Several functions share the name", long: "The deployed source has more than one implementation with this name, so code can't tell which one to compare. Everyone was refunded.", by: "code" },
  UNPARSEABLE: { short: "Could not be parsed", long: "The deployed function could not be parsed deterministically. Everyone was refunded.", by: "code" },
  FUNCTION_TOO_LARGE: { short: "Function too large", long: "The deployed function is over 16,000 characters. Everyone was refunded.", by: "code" },
  MODEL_FIXED: { short: "Model: fixed, quotes verified", long: "The deployed function differs from both versions. Asked twice, the model answered fixed both times, and code confirmed every line it quoted exists in the deployed function.", by: "model" },
  MODEL_NOT_FIXED: { short: "Model: not fixed, quotes verified", long: "The deployed function differs from both versions. Asked twice, the model answered not fixed both times, and code confirmed every line it quoted exists in the deployed function.", by: "model" },
  MODEL_UNSURE: { short: "Model could not tell", long: "The model said the function alone isn't enough to tell. Everyone was refunded.", by: "model" },
  MODEL_FLIP: { short: "Model changed its answer", long: "Asked the same question twice, the model gave two different answers, so nothing was decided. Everyone was refunded.", by: "model" },
  MODEL_QUOTE_INVALID: { short: "Quoted code not found", long: "The model quoted a line that is not in the deployed function, so its answer was discarded. Everyone was refunded.", by: "model" },
  MODEL_ERROR: { short: "Model unavailable", long: "The model did not answer. Everyone was refunded.", by: "model" },
  EXPIRED: { short: "Expired undecided", long: "Nobody decided the check before its deadline, so it expired and everyone was refunded.", by: "deadline" },
};
export const basisOf = (b: string) => BASIS[b] ?? { short: b || "Waiting for a decision", long: b, by: "code" as const };

export const DEP_STATUS: Record<string, string> = {
  OK: "found in the deployed source",
  FILE_NOT_FOUND: "its file is not part of the deployed source",
  FUNCTION_NOT_FOUND: "not found in the deployed source",
  FUNCTION_OVERLOADED: "more than one implementation with this name",
  UNPARSEABLE: "could not be parsed",
  FUNCTION_TOO_LARGE: "larger than 16,000 characters",
};
