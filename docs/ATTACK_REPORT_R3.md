# Attack report, round 3

Scope: `git diff 548caffe199ffc51f72c94623fb7d4fa522ff7a1..2b0f979 -- contracts/` (FixCheck 1.3.0, FixRegistry, `_probe.py`) and the live deployment. Only High and Medium findings are listed. Each one has a test in `test/test_attacks_r3.py` that fails on the current code:

```
python3 test/test_attacks_r3.py      # 3 tests, 3 failures (expected)
```

The 183 existing tests still pass: `test_fixcheck.py` has 157, `test_attacks.py` has 12 and `test_attacks_r2.py` has 14.

## Findings

| ID | Severity | Where | Finding | Test |
|---|---|---|---|---|
| R3-01 | **High** | `file_check` (round-2 fix 9), `gather` docs check, `protocol_key` | Pinned docs can come from a commit that exists only in a fork. `raw.githubusercontent.com/<owner>/<repo>/<sha>/…` serves any commit in the repo's fork network under the upstream path. So anyone can fork the protocol's docs repo, commit a page that lists any address, and pin it under the protocol's own owner/repo. `ADDRESS_NOT_IN_DOCS` passes, "docs owner = fix owner" passes, and the check is scored under the protocol for a contract its docs never listed. | `R3_01_DocsFromAForkCommit` |
| R3-02 | **High** | `report_source_ok` (round-2 fix 2), and every binding built on the report (fix 1, round-2 fix 9) | A "Sherlock" report can come from a commit that exists only in a fork. Anyone can fork `sherlock-audit/<contest>-judging`, edit `README.md` (the finding's section, its audited-code link, a `**sherlock-admin2**` status block that links any PR or commit), and pin it as `raw.githubusercontent.com/sherlock-audit/<contest>-judging/<fork sha>/README.md`. That path passes `report_source_ok`. This is R2-02 (attacker-authored report) again. It also answers check item 1: a filer can make their own fix count as the protocol's. The forged status block links the filer's PR, and the filer pins docs that the filer owns. | `R3_02_ReportFromAForkCommit` |
| R3-03 | **Medium** | `code_born`, `file_check` preview, `decide` | PREDATES_FIX dates a proxy only by its implementation's creation. Two cases dodge a fair NOT_FIXED: (a) a new proxy deployed after the fix that points at an implementation created before the fix, or (b) an existing proxy upgraded or rolled back after the fix to such an implementation. Both run code chosen after the fix existed. Both end PREDATES_FIX ("the fix did not exist yet"), everyone is refunded, and `FixRegistry.is_known_unfixed()` returns False. The contract never reads when the slot took its current value. | `R3_03_NewProxyOnAnOldImplementation` |

### Evidence for R3-01 and R3-02 (read once during this pass)

- `https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/a925a29c22c5b928f4ddc692bee352ad6e0ba664/s` returned HTTP 200 with body `s`. Commit `a925a29` ("Create s") and file `s` exist only in the fork `edwardmadi/2024-05-pooltogether-judging`. The GitHub compare API shows the fork 1 commit ahead of upstream `main`.
- `…/6035289fa29efbada06e35f963ffd2f981ef4bfb/README.md` exists only in `minanew12/2024-05-pooltogether-judging`. It is served byte for byte the same under `sherlock-audit/` and under `minanew12/`.
- `github.com/sherlock-audit/2024-05-pooltogether-judging/branch_commits/<either sha>` lists no branch. So the repository's own default branch can tell a fork commit apart (see the fix direction below).

Fix direction (not applied): require the pinned report commit and docs commit to be reachable from a branch of the named repo. One option is the same `branch_commits` check that `fix_provenance` already uses for the fix: the default branch must be listed. For R3-03, date the running code by the later of the proxy's creation and the implementation's creation, at minimum. A rollback also needs the block of the last `Upgraded(address)` event, or such proxies should be INCONCLUSIVE.

## Items checked with no High or Medium finding

1. **Fix 9 and default-branch reachability.** With an honest report, the fix repo comes from Sherlock's status block, so an attacker's account is refused (`FIX_REPO_NOT_PROTOCOLS` or `FIX_NOT_LINKED_IN_FINDING`). A PR that was never merged and whose head is not on the default branch is refused (`FIX_NOT_ON_DEFAULT_BRANCH`). Squash merges pass through `mergeCommitSha`, which is a real check. The way around fix 9 is a fork commit (R3-01, R3-02). Low: docs pinned only as a Wayback capture are always refused, because `github_pin(docs)` is empty.
2. **Fix 1 / PREDATES_FIX dates.** `fix_at = max(committed, merged)` is stored at filing and used for both the preview and `decide()`. A commit-only fix has `merged_at = 0`, so its git commit date is used. Because Sherlock's status block pins the commit hash, that date cannot be changed afterwards. The dodge is R3-03.
3. **Fix 3 early exit.** I replayed `contains_fix` on the on-chain evidence (`get_check_code`) with and without the early-exit rule. Checks 13, 15 and 17 return False both ways; they went to the model and ended INCONCLUSIVE / MODEL_UNGROUNDED. Check 19 returns True both ways (FIXED / CODE_CONTAINS_FIX). All other checks are decided by exact match, PREDATES or PARTIAL_MATCH. None of the 22 results changes.
4. **Fix 11 leader-named block.** A validator accepts the leader's block only if it is at or below the validator's own head and at most `max_lag` blocks old (about 20 minutes). The leader can therefore choose only between real chain states inside that window. A pre-upgrade block disagrees with the explorer's current `proxyResolution` and ends PROXY_MISMATCH, which is INCONCLUSIVE. Rated Low.
5. **Allowlist.** The new RPC hosts are only reached through the fixed `CHAINS` table. The three new `github.com` page shapes are strictly checked: `pull/<≤7 digits>`, `branch_commits/<40 hex>` and `commits/<40 hex>.atom`. Reports and docs must pass `pinned_kind` before any fetch. Wayback `id_` captures of reports are limited to Sherlock hosts and judging repos; docs must be GitHub raw. The prefixes have no trailing slash (for example `https://mainnet.base.org` also matches `https://mainnet.base.org.evil.com`), but no user-supplied host reaches those prefixes. Not a finding.
6. **Chain and site.** Numbers below.
7. **Wording.** README, frontend, `docs/demo/script.md`, both `.srt` files and `voiced-script.json` were searched for "failed", "ignored", "unfixed", "guaranteed", "100%" and "verified safe". "Ignored" appears only for comments and whitespace, and "failed" only for transaction phases. Every "not fixed" refers to check #6, the Ethereum vault. No finding.

## Item 6: re-read from the chain (Studio Dev, 2026-10-07)

Canonical FixCheck `0x893f96A5c72771D40F0bB55035A013a77159cc33`, `get_checks(0, 100)` and `get_stats()`:

| FIXED | NOT_FIXED | PREDATES_AUDIT | PREDATES_FIX | INCONCLUSIVE | total |
|---|---|---|---|---|---|
| 7 (#1, 2, 9, 12, 16, 18, 19) | 1 (#6) | 6 (#3, 4, 7, 8, 10, 11) | 1 (#5) | 7 (#13, 14, 15, 17, 20, 21, 22) | 22 |

`get_stats` reports 22 checks, 7 fixed, 1 not fixed, 6 predates audit, 1 predates fix, 7 inconclusive, 0 open, 0 expired and 4 protocols. Expected 7 / 1 / 6 / 1 / 7: **confirmed**.

`gen_getContractCode` compared with the files at HEAD, byte for byte:

| Address | File | sha256 (chain = HEAD) | Equal |
|---|---|---|---|
| `0x893f96A5c72771D40F0bB55035A013a77159cc33` | contracts/FixCheck.py | `9ecaac1f…270db65c6` | yes |
| `0xF5133724f0dffF025ceA878881285aE681d71c89` | contracts/FixCheck.py | `9ecaac1f…270db65c6` | yes |
| `0x50a60867153d3C63F322340dcEfe492bdd0d8D04` | contracts/FixRegistry.py | `6d99a876…b97330a` | yes |

https://fixcheck-ledger.vercel.app shows 22 checks of 21 findings: 7 confirmed in deployed code, 1 not in deployed code, 6 deployed before the audit, 1 deployed before the fix and 7 inconclusive. These **match** the chain.
