# Threat model

Every item below has an offline test class in `test/test_fixcheck.py` with the
same number (`python3 test/test_fixcheck.py`, stdlib only). The ledger identity
`balance == open stakes + claimable + fees` and value conservation are asserted
by the test harness after **every** call, and every call that raises or whose
consensus round fails is asserted to have written nothing.

| # | Threat | What stops it | Test |
|---|---|---|---|
| 1 | **Unpinned or mutable report URL** — a branch name, a short SHA, a `github.com/…/blob/` page, a query string, `..` segments, an archive.org "latest" or partial timestamp, a live report page | `github_pin` accepts only `raw.githubusercontent.com/<owner>/<repo>/<40-hex sha>/<path>`; `archive_pin` only `web.archive.org/web/<14 digits>[id_]/<url>`. Same rule for the docs page; the audited and fix files must be GitHub raw at a SHA and the same file name. Refused before anything is fetched. The finding must head a section of the report, carry a fixed-status phrase and name the function (`H-1` never matches `H-10`). | `T02_UnpinnedOrMutableReportUrl` |
| 2 | **Docs page not listing the address** | Every validator fetches the pinned docs page and the lowercase address must appear in it, else `ADDRESS_NOT_IN_DOCS`. The protocol a check is scored under is derived from the docs URL, never typed. | `T03_DocsPageNotListingAddress` |
| 3 | **Wrong chain** — unsupported chain, or a real address on the chain it is not deployed on | Chains are a frozen table with one verified-source endpoint each; the wrong chain's explorer answers 404 → `CONTRACT_NOT_VERIFIED`. | `T04_WrongChain` |
| 4 | **Unverified contract** / explorer down | `is_verified` (Blockscout) or `match` (Sourcify) must be true; a 404 is "not verified", any other non-200 or non-JSON body is `SOURCE_UNREADABLE` — a refusal, never a verdict. A proxy is followed exactly one hop, to the implementation the explorer itself names, which must also be verified. | `T05_UnverifiedContract` |
| 5 | **Function renamed / overloaded / unparseable** | The deterministic extractor returns `FUNCTION_NOT_FOUND`, `FUNCTION_OVERLOADED` or `UNPARSEABLE`; the check is accepted and decided `INCONCLUSIVE` (everyone refunded) without asking the model. Interface declarations are not implementations. A function missing from the audited commit, or a "fix" that does not change it, refuses the filing. | `T06_FunctionRenamedOrOverloaded` |
| 6 | **Comment / whitespace tricks to fake a match** | Comparison is on a canonical form: comments removed (string literals respected, so `"//"` in a string is code), whitespace dropped except one space between word characters (`uint x` ≠ `uintx`). Unicode look-alikes are not folded. A function inside a comment is not a function. | `T07_CommentWhitespaceTricks` |
| 7 | **Quoted lines not in the code** | Every line the model quotes must equal a line of the comment-free deployed function after trimming; one invented line voids the answer (`MODEL_QUOTE_INVALID`). Context lines like `}` are allowed but at least one substantive line is required. Validators reject a leader whose stored quote indices do not point at real, substantive lines. | `T08_QuotedLinesNotInCode` |
| 8 | **Prompt injection** in the report or in code comments | Comments are stripped before anything reaches the model or storage, so a comment can never be shown, quoted or obeyed. Report text and code are fenced with a per-check nonce and defanged (fence markers and the nonce removed). Code-decided cases never consult the model, whatever the report says. The model sees only the finding and the deployed function. | `T09_PromptInjection` |
| 9 | **Model flip / disagreement** | The model is asked twice per validator; different answers → `INCONCLUSIVE (MODEL_FLIP)`, both unsure → `MODEL_UNSURE`, an error → `MODEL_ERROR`. Validators recompute and must agree on verdict and basis; otherwise the round fails and nothing is written (retry until the decide deadline, then `expire`). | `T10_ModelFlip` |
| 10 | **Duplicate check** | One open check per `sha256(report | finding | chain | address)`; addresses are canonicalised so spellings collide. A new check is allowed once the previous one is decided or expired. A leader that forges evidence (e.g. swaps the deployed code for the fix) is rejected by validators recomputing it. | `T11_DuplicateCheck` |
| 11 | **Defender griefing** | The challenger cannot defend their own check; a minimum stake; at most 16 defenders (existing ones may top up); counter-stakes close at the counter deadline; defenders cannot delay or block `decide`; pro-rata flooring dust goes to fees, never trapped. | `T12_DefenderGriefing` |
| 12 | **Deadlines** | Counter and decide deadlines are computed and stored at filing from windows frozen at deployment (no setters, no owner). `decide` only between the deadlines; after the decide deadline anyone may `expire` → everyone refunded, key freed. | `T13_Deadlines` |
| 13 | **Withdraw twice** | `withdraw` zeroes the balance before posting the transfer; the second call raises. Refused payable calls keep the value on the sender's withdrawable balance. `sweep_fees` likewise. | `T14_WithdrawTwice` |
| 14 | **Ledger invariant on every path** | `balance_wei == open_stakes_wei + claimable_wei + fees_wei`, checked after every call in every test, plus an end-to-end walk through all paths (code FIXED with and without defenders, code NOT_FIXED, model flip, expiry, refusal, fee sweep, all withdrawals) that drains the contract to exactly zero with every wei that came in paid out. | `T15_LedgerInvariantEveryPath` |

Also covered: the extractor block in the contract is byte-identical to the one
used for the research (`T00`), no `str.replace` (rejected by the runner), no
undefined names, and FixRegistry has no payable method and no transfer (`T01`).

## Out of scope / accepted

* **Leader chooses quote indices.** Validators check the indices point at real
  substantive lines and agree on the verdict, but cannot force the leader to store
  the exact lines its model chose. Quotes are cosmetic evidence; money moves on
  the verdict, which every validator recomputes.
* **Explorer/Sourcify honesty.** Verified source is read from one frozen public
  service per chain; FixCheck trusts that service's verification.
* **Fix in another function.** Only the named function is compared; the model is
  told to answer INCONCLUSIVE when the function alone cannot show the fix.
* **Studio Dev value transfers.** `withdraw` posts `emit_transfer`; on Studio Dev
  queued transfers may not execute (see makewhole). The contract's books are
  correct either way.
