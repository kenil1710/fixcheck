# History of the decision rules

How FixCheck's decision rules got to where they are. Every number here was measured on studio-dev; the raw decisions are the `seed-*.json` files in this folder.

## 1. First deployment (v1.0) and the second (v1.1)

For "changed" functions the contract may ask the model (twice). Probes
(`test/probe_prompt.mjs`) run the exact prompt the contract builds, from GenVM
on studio-dev.

**First probe (Mellow H-2, `_handleReport`).** Both answers `FIXED`, both quoting
real deployed lines — but also short context lines (`return;`, `}`). The first
draft voided any answer with a line under 8 characters, which turned this
correct answer into INCONCLUSIVE on chain. Rule since: *every* quoted line must
exist verbatim; short context lines are allowed but not stored; at least one
substantive line is required.

**v1.0 on chain: two wrong NOT_FIXED.** v1.0 (`0x6D4390…5cF3`, superseded; its
22 decisions are kept in `docs/superseded/seed-canonical-v1.0.json`) showed the
model only the finding and the deployed function. All 7 model cases agreed with
themselves on both runs, and 5 were right — but two were not:

| Check | Model said | Deployed code | Why the model was wrong |
|---|---|---|---|
| Mellow H-3 `callHook` | NOT_FIXED | `uint256 liquid = asset.balanceOf(address(vault));` — exactly the fix commit's line | `asset.balanceOf` is `TransferLibrary.balanceOf` via `using TransferLibrary for address` (outside the function); read as the unfixed ERC-20 call |
| Mellow M-1 `updateChecks` | NOT_FIXED | `if (!info.canTransfer \|\| !toInfo.canTransfer) {` — the fix's condition, refactored with a local | the auditor *recommended* `&&`, the protocol shipped a stricter `\|\|`; the model judged against the recommendation |

Double-running did not catch them: both runs made the same mistake. So
agreement between runs is not evidence of correctness, and v1.1 changes what
the model is allowed to decide:

1. **Code first, again:** if the deployed function contains every substantive
   line the fix commit added and none it removed, code decides FIXED
   (`CODE_CONTAINS_FIX`) — the model is not asked. This decides `callHook` and
   `cancelDepositRequest`.
2. **The model sees the fix:** the prompt includes the lines the fix commit
   removed and added in this function (an ordered diff, so a moved line shows).
3. **Evidence must point at the change:** a model FIXED must quote a line that
   is new or moved by the fix; a model NOT_FIXED must quote a line the fix
   removed that is still deployed. Otherwise `MODEL_UNGROUNDED` — everyone
   refunded. `updateChecks` (model still says NOT_FIXED, quoting the *fixed*
   line) becomes INCONCLUSIVE: an honest "we can't say" instead of a false
   accusation.

GenVM probes of the v1.1 prompt, two runs each: H-2 FIXED/FIXED, H-4
FIXED/FIXED, Cap M-1 FIXED/FIXED (quotes the moved lines), OP M-3 FIXED/FIXED
(quotes the new `msg.sender` argument), `updateChecks` NOT_FIXED/NOT_FIXED
quoting the fixed line → ungrounded.

**v1.1 on chain** (`docs/SEEDS.md`): of the 7 changed functions, code decided 2
(`CODE_CONTAINS_FIX`: `callHook`, `cancelDepositRequest`), the model decided 3
FIXED with grounded quotes on both runs (H-2, Cap M-1, OP M-3), and 2 ended
INCONCLUSIVE because one of the two answers did not point at the change
(H-4 `calculateFee`: UNGROUNDED|FIXED; `updateChecks`: FIXED|UNGROUNDED) —
everyone refunded. No model answer produced a NOT_FIXED; all 8 NOT_FIXED
verdicts are code facts (deployed function identical to the audited one), and
all 15 findings research classified as identical to the fix or to the audited
code got exactly that verdict by code match.


## 2. The attack pass on v1.1 and v1.2

An independent attack pass on v1.1 (`docs/ATTACK_REPORT.md`) found nine issues; v1.2 closes all of them. On the 22 seeds the visible changes were: six PoolTogether contracts deployed before the audit became PREDATES_AUDIT instead of NOT_FIXED; four checks whose verified source is only a partial match (Mellow `callHook`, both Cap checks, the OP factory) became INCONCLUSIVE; and the model may no longer confirm a removal-only fix or ground FIXED on a line the fix did not add, so the remaining model cases end INCONCLUSIVE. The before/after table is in `docs/ATTACK_REPORT.md`.

## 3. The second attack pass on v1.2 and v1.3

A second attack pass on v1.2 (`docs/ATTACK_REPORT_R2.md`, commit `0c20168`) found twelve issues. The one visible on the seeds: PoolTogether's Arbitrum vault (check #5, created 2024-05-29) was decided NOT_FIXED because v1.2 compared its creation only with the audited commit's date, although its fix (PR #113) was committed on 2024-06-21 and merged on 2024-06-28. v1.2's totals were 7 FIXED / 2 NOT_FIXED / 6 PREDATES_AUDIT / 7 INCONCLUSIVE (`seed-canonical-v1.2.json`). v1.3 (commit `7efb699`) dates the fix, decides that vault PREDATES_FIX, accepts reports from Sherlock only, ties the judged function to the compiled contract and its resolved parents, checks the helpers it calls, requires fix hunks on the live path, grounds the model only on genuinely new lines, pins archive captures and the proxy-slot block, reads fix links only from Sherlock's status block, and keeps operators apart in the canonical form.
