/** Every contract refusal and wallet/network failure, in plain English. */
const RULES: [RegExp, string][] = [
  [/REPORT_URL_NOT_PINNED/, "The report link must be pinned: a GitHub raw link at a full 40-character commit SHA, or a web.archive.org snapshot with a 14-digit timestamp. Branch names and live pages can change."],
  [/DOCS_URL_NOT_PINNED/, "The docs link must be pinned the same way: GitHub raw at a commit SHA, or a web.archive.org snapshot."],
  [/AUDITED_URL_NOT_PINNED/, "The audited source must be a GitHub raw link to a .sol file at the audited commit SHA."],
  [/FIX_URL_NOT_PINNED/, "The fix source must be a GitHub raw link at the fix commit SHA (or leave it empty)."],
  [/FIX_FILE_DIFFERS_FROM_AUDITED_FILE/, "The fix link must point at the same file name as the audited link."],
  [/FIX_COMMIT_IS_AUDITED_COMMIT/, "The fix commit is the audited commit. Use the commit that contains the fix."],
  [/BAD_FINDING_ID/, "Use the finding id as the report writes it, like H-1 or M-14."],
  [/BAD_FUNCTION_NAME/, "Use the function's name only, like claimPrizes — no parentheses or contract name."],
  [/UNSUPPORTED_CHAIN/, "That chain isn't supported. Pick Ethereum, OP Mainnet, Base, Arbitrum or Polygon."],
  [/BAD_ADDRESS/, "That isn't a contract address. It should be 0x followed by 40 hex characters."],
  [/STAKE_BELOW_MINIMUM/, "The stake is below the 0.1 GEN minimum. Your GEN is in your balance — withdraw it or try again with more."],
  [/ALREADY_OPEN_AS_CHECK_(\d+)/, "This finding is already being checked on this contract (check #$1). Open it and counter-stake there instead. Your stake is in your balance."],
  [/NO_CLOCK/, "The transaction had no timestamp. Try again."],
  [/REPORT_UNREADABLE/, "Validators couldn't read the report link. Check it opens, then try again — your stake is in your balance."],
  [/FINDING_NOT_IN_REPORT/, "No heading in the report names that finding id. Check the id matches the report exactly."],
  [/FIXED_STATUS_NOT_IN_FINDING/, "That finding isn't marked fixed in the report, so there's nothing to check."],
  [/FUNCTION_NOT_NAMED_IN_FINDING/, "The finding's text doesn't mention that function. Pick the function the finding is about."],
  [/DOCS_UNREADABLE/, "Validators couldn't read the docs page. Check the link opens, then try again."],
  [/ADDRESS_NOT_IN_DOCS/, "The docs page doesn't list that address. Use the protocol's own page that lists the deployment."],
  [/AUDITED_SOURCE_UNREADABLE/, "Validators couldn't read the audited source file."],
  [/AUDITED_FILE_NOT_FOUND|AUDITED_FUNCTION_NOT_FOUND/, "That function isn't in the audited file. Check the file and the function name."],
  [/AUDITED_FUNCTION_OVERLOADED/, "The audited file has several functions with that name, so it can't be compared."],
  [/AUDITED_UNPARSEABLE/, "The audited file couldn't be parsed."],
  [/AUDITED_FUNCTION_TOO_LARGE|FIX_FUNCTION_TOO_LARGE/, "That function is longer than 16,000 characters, too large to compare."],
  [/FIX_SOURCE_UNREADABLE/, "Validators couldn't read the fix source file."],
  [/FIX_(FILE|FUNCTION)_NOT_FOUND/, "That function isn't in the fix commit's file."],
  [/FIX_DOES_NOT_CHANGE_FUNCTION/, "The fix commit doesn't change this function. Pick the function the fix actually touched."],
  [/SOURCE_UNREADABLE/, "The block explorer didn't answer with verified source. Try again in a minute."],
  [/IMPLEMENTATION_NOT_VERIFIED/, "This is a proxy and its implementation isn't verified, so its code can't be read."],
  [/CONTRACT_NOT_VERIFIED/, "That contract has no verified source on this chain. Check the chain — or the contract isn't verified, so its code can't be checked."],
  [/EVIDENCE_UNREADABLE/, "The evidence couldn't be read. Try again."],
  [/NO_SUCH_CHECK/, "That check doesn't exist."],
  [/CHECK_NOT_OPEN/, "That check is already decided."],
  [/COUNTER_WINDOW_CLOSED/, "The counter-stake window for this check has closed."],
  [/CHALLENGER_CANNOT_DEFEND/, "You filed this check, so you can't also stake that it's fixed."],
  [/TOO_MANY_DEFENDERS/, "This check already has 16 defenders. Existing defenders can still add to their stake."],
  [/counter-stake window is still open/i, "The counter-stake window is still open. The check can be decided after it closes."],
  [/decide window has passed/i, "The decide window has passed. Use “Expire and refund” instead."],
  [/decide window is still open/i, "The check can still be decided; it can only expire after its decide deadline."],
  [/is already (DECIDED|EXPIRED)/i, "This check is already closed."],
  [/nothing to withdraw/i, "This wallet has nothing to withdraw."],
  [/no fees to sweep/i, "There are no fees to sweep."],
  [/user rejected|denied|4001/i, "You cancelled the request in your wallet."],
  [/insufficient funds/i, "This wallet doesn't have enough GEN. Studio Dev GEN is free from the Studio faucet."],
  [/rate limit|429|-32029/i, "Studio Dev is rate-limiting requests right now. Wait a minute and try again."],
  [/busy|execution slots|-32006/i, "Studio Dev is busy. Wait a moment and try again."],
  [/fetch failed|network|ECONN|Failed to fetch/i, "The network couldn't be reached. Check your connection and try again."],
];

export function friendly(raw: unknown): string {
  const msg = typeof raw === "string" ? raw : raw instanceof Error ? raw.message : String(raw ?? "");
  for (const [re, text] of RULES) {
    const m = re.exec(msg);
    if (m) return text.replace(/\$(\d)/g, (_, i) => m[Number(i)] ?? "");
  }
  return msg.length > 220 ? msg.slice(0, 220) + "…" : msg || "Something went wrong.";
}
