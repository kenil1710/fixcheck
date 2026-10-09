# Attack report, round 4

Scope: the round-3 code (contracts unchanged since `93de7be`, deployed at `026e0f8`) and its live deployment. This pass closes every Low left open in the earlier reports, then attacks the two round-3 fixes from outside. Each class in `test/test_attacks_r4.py` was written first and run against the round-3 code; the failures it produced are quoted below, then the fix.

```
python3 test/test_attacks_r4.py
```

Earlier reports: [round 1](ATTACK_REPORT.md) and [round 2](ATTACK_REPORT_R2.md) have no open items (every finding is marked fixed). [Round 3](ATTACK_REPORT_R3.md) left three Lows open (its items 1, 4 and 5). They are step 1 below.

## Step 1. Lows left open in round 3 (round-4 fixes 1 and 2)

| ID | Was | Test | Fix |
|---|---|---|---|
| R4-L1 | R3 item 1: docs pinned only as a Wayback capture were always refused as `FIX_REPO_NOT_PROTOCOLS`, because the fix-owner rule read the docs owner from a raw GitHub URL only. | `R4_L1_DocsCapturedOnWayback` (3) | `docs_repo()`: a capture of a GitHub URL at a full SHA names the same owner, repo and commit as the raw URL. It is compared with the fix's owner, its commit must be on a branch of that repo (round-3 fix 1), and the check is scored under the same protocol key. A capture of a website (no GitHub repo to compare the fix with) is refused as `DOCS_NOT_ON_GITHUB` before anything is fetched; an abbreviated SHA as `DOCS_REF_NOT_A_FULL_SHA`. |
| R4-L2 | R3 item 4: the leader names the slot block anywhere in the last `max_lag` blocks. A leader that picks a block just before an upgrade reads the old implementation, which disagrees with the explorer, and the check is stored INCONCLUSIVE (`PROXY_MISMATCH`). The leader chose that outcome, not the chain. | `R4_L2_LeaderPicksTheSlotBlock` (2) | Every reader also reads the slot at its own `head - margin`. If the implementation there differs from the named block's, the filing is refused (`SLOT_CHANGED_SINCE_SLOT_BLOCK`): nothing is written and it can be filed again. Any block in the window now gives the same answer or none. |
| R4-L3 | R3 item 5: allowlist prefixes without a trailing slash matched other hosts (`https://mainnet.base.org` matched `https://mainnet.base.org.evil.com` and `…@evil.com`). No user-supplied host reached them. | `R4_L3_AllowlistHostBoundary` | A prefix without a trailing slash matches only itself or itself followed by `/`. |

Run against the round-3 code (5 failures, all for the reason the test names):

```
FAIL: test_archived_docs_from_a_fork_commit_are_refused (__main__.R4_L1_DocsCapturedOnWayback.test_archived_docs_from_a_fork_commit_are_refused)
AssertionError: Tuples differ: ('REFUSED', 'FIX_REPO_NOT_PROTOCOLS') != ('REFUSED', 'DOCS_COMMIT_NOT_ON_BRANCH')
FAIL: test_archived_github_docs_at_a_full_sha_are_accepted (__main__.R4_L1_DocsCapturedOnWayback.test_archived_github_docs_at_a_full_sha_are_accepted)
AssertionError: 'REFUSED' != 'OK'
FAIL: test_archived_website_docs_are_refused_with_their_own_reason (__main__.R4_L1_DocsCapturedOnWayback.test_archived_website_docs_are_refused_with_their_own_reason)
AssertionError: Tuples differ: ('REFUSED', 'FIX_REPO_NOT_PROTOCOLS') != ('REFUSED', 'DOCS_NOT_ON_GITHUB')
FAIL: test_a_block_before_an_upgrade_inside_the_window_is_refused (__main__.R4_L2_LeaderPicksTheSlotBlock.test_a_block_before_an_upgrade_inside_the_window_is_refused)
AssertionError: 1 != 0 : a slot block whose implementation is no longer current was accepted: {"check_id": 1, "protocol": "github:generationsoftware/pt-dev-docs", "dep_status": "PROXY_MISMATCH", "code_says": "INCONCLUSIVE", "count
FAIL: test_prefix_is_a_host_boundary (__main__.R4_L3_AllowlistHostBoundary.test_prefix_is_a_host_boundary)
AssertionError: True is not false : https://ethereum-rpc.publicnode.com.evil.com
Ran 6 tests in 0.374s
FAILED (failures=5)
```

After the fix: 6 tests, OK. The 205 earlier tests still pass.

## Step 2. The fork-commit check (round-3 fix 1), attacked from outside (round-4 fix 3)

Real GitHub answers for every case are in `test/fixtures/pages_r4.json` (`tools/build_fixtures_r4.py`).

| Attack | Real data | Result on the round-3 code | Rule now |
|---|---|---|---|
| A commit that exists only on `refs/pull/<n>/head` (a pull request from a fork) | Heads of `ethereum-optimism/superchain-registry` PR #1305 (closed, fork `Kemperino`) and PR #1344 (open, fork `arunimshukla`): raw GitHub serves both under the upstream path (HTTP 200); `branch_commits` shows only GitHub's spoofed-commit warning, no branch | **Held**: refused `*_COMMIT_NOT_ON_BRANCH` (`R4_F1`) | Same. A pull request's head is never a branch: the `pull-request` item next to a real upstream branch (PR #1309, branch `feat/plataberget-superchain`) is not counted. |
| A pull ref rendered as a branch link (`/tree/refs/pull/12/head`), or a link whose text is not the branch it points at | synthetic page (defence in depth) | **Failed**: counted as `branch:refs/pull/12/head` | A link counts only if its text is exactly the ref in its href, and never as `refs/*` or `pull/*`. |
| Branch deleted, or force-pushed so the commit leaves it | Head of `GenerationSoftware/pt-v5-vault` PR #63, whose branch was deleted: spoofed-commit warning | **Held** (`R4_F2`) | Defined: the proof is GitHub's branch list **at filing**, read by every validator and stored as `report_reach`/`docs_reach`. Gone before filing: refused. Gone between the leader's and a validator's read: the round fails and nothing is written. Gone after filing: nothing changes; every body is bound by sha256 and `decide()` never reads GitHub. |
| Case, whitespace, %-escapes in owner/repo | `Sherlock-AUDIT/…-Judging` at a fork SHA; `SHERLOCK-AUDIT/…` at the real SHA; space, tab, `%2D` | **Held** (`R4_F3`): case is normalised (the branch list is read under the lowercased name and the same check key results); inner whitespace is refused as not pinned; `%` is refused | Same. |
| Names GitHub never issues: `repo.git`, `repo.`, leading `-`, `_`, `--` in the account | — | **Failed**: fetched, then refused only as `DOCS_BRANCHES_UNREADABLE` | `github_name_ok`: refused as `GITHUB_NAME_INVALID` before anything is fetched. |
| Renamed or transferred repo under its old name | `Uniswap/uniswap-v3-core` → 301 → `Uniswap/v3-core`; raw serves the old name directly (200) | **Held** (`R4_F4`): after the redirect the branch list links the new name, which is not the repo the URL names | Defined: a URL must name the repository as GitHub names it now. One repository has one spelling, one check key and one protocol key. |

Run before this fix (16 of 18 already held):

```
FAIL: test_a_pull_ref_rendered_as_a_branch_link_is_not_a_branch (__main__.R4_F1_PullRequestRefs.test_a_pull_ref_rendered_as_a_branch_link_is_not_a_branch)
AssertionError: Lists differ: ['branch:refs/pull/12/head'] != []
FAIL: test_names_github_never_issues_are_refused_before_any_fetch (__main__.R4_F3_OwnerRepoSpellings.test_names_github_never_issues_are_refused_before_any_fetch)
AssertionError: Tuples differ: ('REFUSED', 'DOCS_BRANCHES_UNREADABLE') != ('REFUSED', 'GITHUB_NAME_INVALID')
Ran 18 tests in 1.053s
FAILED (failures=2)
```

After the fix: 18 tests, OK.

## Step 3. The proxy chronology (round-3 fix 2), attacked from outside (round-4 fix 4)

| Attack | Result on the round-3 code | Rule now |
|---|---|---|
| **Beacon proxy** the explorer resolves (EIP-1967 implementation slot empty, explorer names the beacon's implementation) | **Held**: `PROXY_UNRESOLVED`, INCONCLUSIVE | Same. |
| **Beacon proxy** the explorer does not resolve, whose own verified source carries the audited function | **Failed** (`R4_P1`): judged as a plain contract and dated by the address's creation | The EIP-1967 beacon slot is read at the slot block. If it is set, `dep_status` is `BEACON_PROXY` → INCONCLUSIVE (`BEACON_PROXY`). By design: the code that runs is chosen by a second contract whose upgrades are its own log history. |
| **UUPS**: `Upgraded` is emitted by the proxy (delegatecall), not by the implementation | **Held** (`R4_P2`): only logs the proxy's own address emitted are read; a log from the implementation's address is ignored | Same. |
| **A → B → A** (rollback after the fix; and all before the fix) | **Held** (`R4_P3`): the last event at or below the slot block counts: NOT_FIXED, and PREDATES_FIX when every step is before the fix | Same. |
| **Metamorphic / CREATE2**: code redeployed at the same address after the fix (the explorer's creation tx dates the FIRST code) | **Failed** (`R4_P4`): PREDATES_AUDIT for an implementation, and for a plain contract, whose code changed after creation | For the deployment and for its implementation: `eth_getCode` at the creation block minus 1 must be empty, at the creation block non-empty, and byte-identical to the code at the slot block. Otherwise the creation date does not count (`code_status` / `impl_code_status` = `CODE_CHANGED`, `NOT_CREATED_THERE` or `UNREADABLE`, stored). A later known date still decides (a proxy created after the fix is NOT_FIXED); otherwise INCONCLUSIVE (`DEPLOY_TIME_UNKNOWN`). |
| **Slot read at a block before the last Upgraded event**, re-setting the same implementation after the fix (the slot does not change, so R4-L2 passes) | **Failed** (`R4_P5`): the switch was dated by the older event → PREDATES_AUDIT for code re-chosen after the fix | Any `Upgraded` log of the proxy above the slot block (including one the explorer has seen before the RPC) refuses the filing: `UPGRADED_AFTER_SLOT_BLOCK`, nothing written, file again once the RPC is past it. |

Run before this fix (7 of 15 failed; the 8 that held are regressions now):

```
ERROR: test_not_created_in_the_block_the_explorer_names (__main__.R4_P4_CodeRedeployedAtTheSameAddress.test_not_created_in_the_block_the_explorer_names)
KeyError: 'code_status'
ERROR: test_unchanged_code_keeps_its_dates (__main__.R4_P4_CodeRedeployedAtTheSameAddress.test_unchanged_code_keeps_its_dates)
KeyError: 'code_status'
ERROR: test_explorer_ahead_of_the_rpc_refuses_then_files (__main__.R4_P5_SlotReadBeforeTheLastUpgrade.test_explorer_ahead_of_the_rpc_refuses_then_files)
KeyError: 'reason'
FAIL: test_beacon_proxy_the_explorer_does_not_resolve (__main__.R4_P1_BeaconProxies.test_beacon_proxy_the_explorer_does_not_resolve)
AssertionError: Tuples differ: ('OK', 'OK') != ('OK', 'BEACON_PROXY')
FAIL: test_implementation_redeployed_after_the_fix (__main__.R4_P4_CodeRedeployedAtTheSameAddress.test_implementation_redeployed_after_the_fix)
AssertionError: 'PREDATES_AUDIT' unexpectedly found in ('PREDATES_AUDIT', 'PREDATES_FIX') : an implementation whose code changed after its creation was dated by that creation
FAIL: test_plain_contract_redeployed (__main__.R4_P4_CodeRedeployedAtTheSameAddress.test_plain_contract_redeployed)
AssertionError: Tuples differ: ('PREDATES_AUDIT', 'DEPLOYED_BEFORE_AUDIT') != ('INCONCLUSIVE', 'DEPLOY_TIME_UNKNOWN')
FAIL: test_same_implementation_re_set_after_the_fix_above_the_slot_block (__main__.R4_P5_SlotReadBeforeTheLastUpgrade.test_same_implementation_re_set_after_the_fix_above_the_slot_block)
AssertionError: 1 != 0 : a slot block below a later Upgraded event was accepted: {"check_id": 1, "protocol": "github:generationsoftware/pt-dev-docs", "dep_status": "OK", "code_says": "PREDATES_AUDIT",
Ran 31 tests in 3.552s
FAILED (failures=4, errors=3)
```

Changes to round-3 tests forced by this fix (no assertion about a vulnerability was weakened):

- `test_log_above_the_leader_block_is_ignored` → `test_log_above_the_leader_block_refuses_the_filing`: an Upgraded log above the slot block now refuses the filing instead of being skipped.
- `test_upgraded_twice_real_logs`: the unfiltered real list at a block below its last event is now `{"above": True}`; the ordering assertions run on the list cut at that block.
- `test_chronology_matrix`: `unknown` is now the basis to report (`""`, `UPGRADE_TIME_UNKNOWN` or `DEPLOY_TIME_UNKNOWN`) instead of a boolean.
- `as_proxy` gives each creation tx a `block_number`, as Blockscout's real answer does (the creation-block code check needs it).

After the fix: 31 tests in `test_attacks_r4.py`, OK; all earlier suites OK.

## Step 4. Two independent RPCs for every verdict-relevant chain fact (round-4 fix 5)

On the round-3 code each chain fact came from ONE source: the implementation slot from one RPC endpoint, a Blockscout chain's creation time from Blockscout alone, a Sourcify chain's from Sourcify plus one RPC, and the switch from Blockscout's log list alone. One lying or broken endpoint could move a verdict.

**Pairs** (different operators; all ten answer archive reads and logs from inside GenVM on Studio Dev, probe txs `0xe72ca8d4a95649c0c05b77f449d1f0889452dd92e15715c80f320ad57eab6851` and `0xe2ce1771829f28a2fd11f377ca27ca76a98022d15505774fdcda2380b3297bf6`, raw answers in [`research/probe_rpc_r4.json`](research/probe_rpc_r4.json) and [`research/probe_rpc_r4b.json`](research/probe_rpc_r4b.json)). `eth.drpc.org` was tried first for Ethereum and answered HTTP 429 under a burst of reads during the live replay; each call is also retried once:

| Chain | RPC A | RPC B |
|---|---|---|
| ethereum | `rpc.mevblocker.io` (MEV Blocker) | `mainnet.gateway.tenderly.co` (Tenderly) |
| optimism | `mainnet.optimism.io` (OP Labs) | `optimism.gateway.tenderly.co` |
| base | `mainnet.base.org` (Base) | `base.gateway.tenderly.co` |
| arbitrum | `arb-pokt.nodies.app` (Nodies / Pocket) | `arbitrum.gateway.tenderly.co` |
| polygon | `polygon.drpc.org` (dRPC) | `polygon.gateway.tenderly.co` |

The round-3 endpoints `ethereum-rpc.publicnode.com` and `arb1.arbitrum.io/rpc` were replaced: neither serves archive state without a token, which the creation-block code check (step 3) needs. Probed from a laptop, the other free endpoints either refuse archive reads (publicnode, Flashbots, blockpi, meowrpc) or are gone (1rpc for OP/Base, Blast, polygon-rpc.com).

**Rule.** `both()` sends the same call to A and B and reduces each answer to the fact it carries. Either answer missing: the filing is refused (`RPC_UNREADABLE`) and nothing is written. The two differ: the fact is unknown. Facts read this way:

| Fact | Used for | When A and B (or they and the explorer) differ |
|---|---|---|
| head block | slot-block range | the lower of the two heads is used |
| EIP-1967 implementation and beacon slots, at the slot block and at the head | which code runs | `dep_status` `CHAIN_SOURCES_DISAGREE` → INCONCLUSIVE |
| code at creation block − 1, at the creation block and at the slot block (sha256) | step 3 | `code_status` `SOURCES_DISAGREE` → the creation date does not count |
| the creation block's timestamp, which must also equal the explorer's creation time | PREDATES dates | same |
| the switch's `Upgraded` log at its block (same index, same implementation, and the last one in that block) and that block's timestamp, which must equal Blockscout's | the switch date | `switch_status` `UNCONFIRMED` → the switch is undated (INCONCLUSIVE `UPGRADE_TIME_UNKNOWN` unless another date is after the fix) |
| `Upgraded` logs from the slot block + 1 to the head | stale slot block | any log: refused `UPGRADED_AFTER_SLOT_BLOCK`; differing: `UNCONFIRMED` |

What stays single-source, by design: verified source and the creation tx hash come from one explorer per chain (Blockscout or Sourcify; a second explorer is not reachable from GenVM for most chains, round-1 research); completeness of Blockscout's Upgraded list before the slot block (both RPCs refuse `eth_getLogs` over a proxy's lifetime). Both are cross-checked where the RPCs can: the creation tx's block must hold the first code and the explorer's timestamp; the last listed event must be in both RPCs' logs with the slot's implementation.

Run before this fix (all 10 failed):

```
ERROR: test_one_rpc_down_refuses_and_writes_nothing (__main__.R4_C1_TwoIndependentRpcs.test_one_rpc_down_refuses_and_writes_nothing)
KeyError: 'reason'
FAIL: test_both_endpoints_are_read (__main__.R4_C1_TwoIndependentRpcs.test_both_endpoints_are_read)
AssertionError: 'https://second-rpc.invalid' not found in ['https://github.com/sherlock-audit/2024-05-pooltogether-judging/branch_commits/88298eacec6f178fd0b5f9f13e4605c58aa58072', 'https://github.com
FAIL: test_code_disagreement_is_unknown (__main__.R4_C1_TwoIndependentRpcs.test_code_disagreement_is_unknown)
AssertionError: 'OK' != 'SOURCES_DISAGREE'
FAIL: test_creation_time_disagreement_is_unknown (__main__.R4_C1_TwoIndependentRpcs.test_creation_time_disagreement_is_unknown)
AssertionError: Tuples differ: ('PREDATES_AUDIT', 'DEPLOYED_BEFORE_AUDIT') != ('INCONCLUSIVE', 'DEPLOY_TIME_UNKNOWN')
FAIL: test_explorer_time_must_match_both_rpcs (__main__.R4_C1_TwoIndependentRpcs.test_explorer_time_must_match_both_rpcs)
AssertionError: Tuples differ: ('OK', 'OK') != ('SOURCES_DISAGREE', 'SOURCES_DISAGREE')
FAIL: test_slot_disagreement_is_inconclusive (__main__.R4_C1_TwoIndependentRpcs.test_slot_disagreement_is_inconclusive)
AssertionError: Tuples differ: ('OK', 'OK') != ('OK', 'CHAIN_SOURCES_DISAGREE')
FAIL: test_two_operators_per_chain (__main__.R4_C1_TwoIndependentRpcs.test_two_operators_per_chain)
AssertionError: False is not true : ethereum
FAIL: test_upgrade_in_the_window_seen_only_by_the_rpcs (__main__.R4_C1_TwoIndependentRpcs.test_upgrade_in_the_window_seen_only_by_the_rpcs)
AssertionError: Tuples differ: ('OK', None) != ('REFUSED', 'UPGRADED_AFTER_SLOT_BLOCK')
FAIL: test_upgraded_event_must_be_confirmed_by_both_rpcs (__main__.R4_C1_TwoIndependentRpcs.test_upgraded_event_must_be_confirmed_by_both_rpcs)
AssertionError: 'EVENT' != 'UNCONFIRMED'
FAIL: test_upgraded_event_time_must_match (__main__.R4_C1_TwoIndependentRpcs.test_upgraded_event_time_must_match)
AssertionError: 'EVENT' != 'UNCONFIRMED'
Ran 41 tests in 5.592s
FAILED (failures=9, errors=1)
```

Changes to earlier tests forced by this fix: `test/fixtures/rpc.json` keys move from the two replaced endpoints to their successors (same chain answers); the stub's second RPC answers what the first does unless a test gives it its own answer; the two `rpc()` spies (`S11`, `R2_10`) accept the new `second` argument. Assertions unchanged.

After the fix: 41 tests in `test_attacks_r4.py`, OK; all earlier suites OK.

**Live replay.** `node`-free: `python3 tools/live_preview.py` runs the contract's own `gather()` and code decision for all 22 seeds against live GitHub, explorers and both RPCs ([`research/live_preview.json`](research/live_preview.json)). All 22 gather; every creation proof is `OK`; the three proxies' switches (Cap ×2, OP's DisputeGameFactory) are `EVENT`, confirmed by both RPCs; every predicted verdict equals the round-3 verdict. An RPC that does not answer (HTTP 429 from a throttled free endpoint) refuses the filing instead of being stored, so validators cannot split on who was throttled (`test_an_unanswered_read_is_not_a_fact`).

## Step 5. A live case where the date rule alone decides: searched again, none found

What such a case needs, all at once: (1) a proxy on Ethereum or OP Mainnet (the only chains with a dated log source); (2) a full/exact verified implementation; (3) a Sherlock report that pins the audited commit; (4) a deployed function canonically equal to the **audited (vulnerable)** version, so that only the dates separate NOT_FIXED from PREDATES_FIX; and (5) the proxy (or its switch) dated on the side of the fix that makes the difference. (4) and (5) together mean a team selected, or kept from before the fix, code still lacking a fix it shipped elsewhere.

Searched this round, beyond the 21 seeded findings:

- **Exactly Protocol** (Sherlock `2024-07-exactly-stacking-contracts`, fixes in `exactly/protocol`, Market and StakedEXA proxies on OP Mainnet, hardhat deployment files pinned in the same account as the fix): a natural fit for (1) and (5). It fails (3): the report links the audited code only as `blob/main` (26 links, none at a commit SHA), so filing is refused `AUDITED_COMMIT_NOT_LINKED_BY_REPORT`. That is the rule that keeps an attacker from pointing "audited" at any commit.
- The 99 Sherlock contests in `research_cache/fixed.json` (835 findings marked fixed) were reviewed by name for deployment chain and proxy pattern (from what is publicly known about each protocol, not re-read on chain). Those with upgradeable proxies are mostly on Arbitrum or Base (no log source: Perennial, Tapioca, Superfluid, Ethos), beacon-based (Arrakis: now `BEACON_PROXY`), or route through a dispatcher whose function is not in the compiled contract (Notional). None was checked to the point of a filing.
- Among the seeded findings the only proxies are Cap's Lender (two checks) and OP's DisputeGameFactory, all partial matches, so (2) fails; the live replay confirms their switches are dated and confirmed by both RPCs (`EVENT`).

So the date-only path stays covered offline: `R3_Reg_ProxyChronology`, `R4_P3_RollbackABA`, `R4_P4_CodeRedeployedAtTheSameAddress` and `R4_P5_SlotReadBeforeTheLastUpgrade` serve the real Ethereum vault (deployed code == audited) as a proxy, with explorer and RPC logs. The live proxy case on the new demo shows the chronology fields stored and confirmed by both RPCs (docs/DEPLOYED_VERIFICATION.md).

## Step 6. Known limitations: fixed now, or why they stay (round-4 fixes 6 and 7)

Each README limitation was either fixed in this round or now states plainly why it stays (by design, or not possible on Studio Dev). Two were cheap enough to fix:

| Limitation | Fix | Test |
|---|---|---|
| "Modifiers are not followed" | `modifiers_of()` reads the modifiers a function's header applies; each must run the implementation the function sees, exactly like a called helper (round-2 fix 6). A derived contract that overrides one (`modifier onlyOwner() override { _; }`) is `HELPER_OVERRIDDEN` → INCONCLUSIVE. Shared extractor updated in `tools/solfn.py` too. | `R4_K1_ModifiersAreFollowed` (2) |
| "A participant who types a `sherlock-admin` line into their own comment could forge a status block" | The judging README is Sherlock's rendering of the GitHub issue; inside it an author is only text. The section's `Source:` line names its issue in the report's own judging repo; every validator reads that issue page, and the fix link must be in a comment that **GitHub** attributes to a `sherlock-admin*` user and that carries a fixed-status phrase. Missing source: `FINDING_SOURCE_MISSING`; not confirmed: `FIX_STATUS_NOT_ON_GITHUB_ISSUE`; page unreadable: `FINDING_ISSUE_UNREADABLE` (nothing written). The issue number is stored (`status_issue`). GenVM reads these pages (probe tx `0xe8f2cd8073e7ea5034cd326f72331199f512a611efbf1f73ad34658432822512`, [`research/probe_issue_r4.json`](research/probe_issue_r4.json)); all 22 seeds confirm in the live replay. | `R4_K2_StatusBlockAuthorFromGitHub` (5) |

Run before these fixes:

```
FAIL: test_header_modifiers (__main__.R4_K1_ModifiersAreFollowed.test_header_modifiers)
AssertionError: None != ['onlyOwner', 'whenNotPaused']
FAIL: test_overridden_modifier_is_helper_overridden (__main__.R4_K1_ModifiersAreFollowed.test_overridden_modifier_is_helper_overridden)
AssertionError: None != 'HELPER_OVERRIDDEN' : an overridden modifier was not followed
Ran 44 tests in 5.715s
FAILED (failures=2)
FAIL: test_issue_page_unreadable_refuses (__main__.R4_K2_StatusBlockAuthorFromGitHub.test_issue_page_unreadable_refuses)
AssertionError: None != 'FINDING_ISSUE_UNREADABLE'
FAIL: test_real_status_comment_is_confirmed (__main__.R4_K2_StatusBlockAuthorFromGitHub.test_real_status_comment_is_confirmed)
AssertionError: 'https://github.com/sherlock-audit/2024-05-pooltogether-judging/issues/136' not found in ['https://github.com/sherlock-audit/2024-05-pooltogether-judging/branch_commits/88298eacec6f178
FAIL: test_source_issue_must_be_in_the_reports_own_repo (__main__.R4_K2_StatusBlockAuthorFromGitHub.test_source_issue_must_be_in_the_reports_own_repo)
AssertionError: None != 'FINDING_SOURCE_MISSING'
FAIL: test_status_comment_must_link_this_fix (__main__.R4_K2_StatusBlockAuthorFromGitHub.test_status_comment_must_link_this_fix)
AssertionError: None != 'FIX_STATUS_NOT_ON_GITHUB_ISSUE'
FAIL: test_status_comment_written_by_a_participant_is_refused (__main__.R4_K2_StatusBlockAuthorFromGitHub.test_status_comment_written_by_a_participant_is_refused)
AssertionError: Tuples differ: ('OK', None) != ('REFUSED', 'FIX_STATUS_NOT_ON_GITHUB_ISSUE')
Ran 49 tests in 6.788s
FAILED (failures=5)
```

Earlier test helper changed: `sherlock_report()` (home-made reports) now renders a `Source:` line per issue and serves that issue's page with Sherlock's status comment, as Sherlock's bot does. The real fixture cases use their real issue pages (`test/fixtures/pages_r4.json`, GitHub's embedded JSON cut from the page).

The rest stay, with the reason in the README: one function per finding, comments ignored, removal-only fixes and "not fixed is a code fact" (by design); one explorer per chain for verified source and undated switches on Base/Arbitrum/Polygon (no second source or log source reachable from GenVM); Sherlock only (each auditor needs its own authorship rule); `audits.sherlock.xyz` captures have no issue page to check; fix provenance from GitHub HTML (API rate limit); external calls not followed (another contract's code); identical-code metamorphic redeploys (needs history no RPC serves); Studio Dev.
