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
