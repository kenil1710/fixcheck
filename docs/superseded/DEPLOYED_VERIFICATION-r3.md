# Deployed verification, round 3

The round-3 fixes were checked live on the **demo** contract `0x66E008fc08414ecF423e59482c20A046FAd7A01c` (GenLayer Studio Dev), deployed from commit `93de7be2deb171cbb0a19b7b47fc280938da520b`. All three cases use real GitHub and real chain data. The script is `test/verify_live_r3.mjs`, the raw results are in [`live-r3.json`](live-r3.json), and the run was on 2026-10-09.

| Case | Input | Transaction | Result |
|---|---|---|---|
| (a) report pinned to a fork-only commit | PoolTogether M-17 (`_convertToShares`, Ethereum vault `0x9eE31E84…`), report `raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/6035289fa29efbada06e35f963ffd2f981ef4bfb/README.md` | [`0x095583d2…1686`](https://explorer-studio-dev.genlayer.com/tx/0x095583d2fe9871d581d1475210f22819a035237d5eadc82872ed5db9defb1686) | **REFUSED, `REPORT_COMMIT_NOT_ON_BRANCH`**; no check stored; the 1 GEN stake stays withdrawable |
| (b) docs pinned to a fork-only commit | OP Stack M-3 (`create`, DisputeGameFactory proxy `0xe5965ab5…`), docs `raw.githubusercontent.com/ethereum-optimism/superchain-registry/17d2cfde1b2c3742031c56f08f1bebd5ec422670/superchain/configs/mainnet/op.toml` | [`0x339eabf9…689d`](https://explorer-studio-dev.genlayer.com/tx/0x339eabf918bb2112207b5ea6f2e871fa28f93d103ff5672ecb456fd3f820689d) | **REFUSED, `DOCS_COMMIT_NOT_ON_BRANCH`**; no check stored; the stake stays withdrawable |
| (c) proxy whose current implementation was selected after the fix existed | Cap M-3 (`realizeRestakerInterest`, Lender proxy `0x15622c3d…`) | filed [`0x96d99aff…a676`](https://explorer-studio-dev.genlayer.com/tx/0x96d99aff5489c7a6d47749c10ee3018dd6eff16f649ef8a3c5bae85a6f32a676), decided [`0x1bc7e8a5…a5d`](https://explorer-studio-dev.genlayer.com/tx/0x1bc7e8a54317979be41ce46da82ec873985b0bb23226572a28dc283dc2b79a5d) | demo check #1 **INCONCLUSIVE (`PARTIAL_MATCH`)**, not PREDATES_FIX |

## Why each input is a real attack

- **(a)** Commit `6035289` ("Update README.md") exists only in the fork `minanew12/2024-05-pooltogether-judging`. GitHub raw serves it under `sherlock-audit/…` with HTTP 200, so the old contract accepted it as Sherlock's report (finding R3-02). Under the upstream path, GitHub's `branch_commits` lists no branch for it.
- **(b)** Commit `17d2cfd` exists only in the fork `Ajitrajpsp/superchain-registry`, 5 commits ahead of `main`. GitHub raw serves `op.toml` at that commit under `ethereum-optimism/superchain-registry` (HTTP 200), and the file lists the DisputeGameFactory address, so the old contract's address check passed (finding R3-01). Under the upstream path, `branch_commits` lists no branch; under the fork's own path it lists the fork's `main`, which is not a branch of the original repo. The report in this filing is the real one, pinned on `main`, so the refusal comes from the docs alone.
- **(c)** Stored at filing (`get_check(1)` on the demo):

  | Field | Value |
  |---|---|
  | implementation (EIP-1967 slot at leader block 26155087) | `0x68c4f03b8640c0393a832987147bae7a0b27aaa7` |
  | proxy created | 1751892887 (2025-07-07) |
  | implementation created | 1757094443 (2025-09-05) |
  | switch (`Upgraded` event, block 23318705) | 1757338499 (2025-09-08), `switch_status` = `EVENT` |
  | `code_born` = latest of the three | 1757338499 (2025-09-08) |
  | fix existed (`fix_at`) | 1755278193 (2025-08-15) |
  | report / docs proof | `default:main` / `default:main` |

  The running code was selected on 2025-09-08, after the fix existed, so the contract's chronology gives `predates_fix = false`. Check #1 is INCONCLUSIVE because Blockscout verifies Cap's implementation only as a partial match. Code never judges a partial match, so the verdict comes from `PARTIAL_MATCH` and not from the dates.

## What could not be built live, and where it is tested

A live case where the dates alone decide the verdict needs one specific setup: a real proxy whose verified, exactly matching implementation still contains the audited (vulnerable) function, selected after the fix existed. None of the 21 findings we researched has one. The only proxies among them are Cap's Lender, OP's DisputeGameFactory and Cap's other check, and all three are partial matches. We cannot deploy such a proxy ourselves either: FixCheck reads Ethereum, OP Mainnet, Base, Arbitrum and Polygon mainnets only, and the docs must be the protocol's own pinned page.

`test/test_attacks_r3.py` covers that path offline. The proxy is the real Ethereum vault (deployed code == audited), served as a proxy with explorer `Upgraded` logs:

- `R3_03_NewProxyOnAnOldImplementation` and `R3_Reg_ProxyChronology.test_new_proxy_after_the_fix_on_an_old_implementation`: a new proxy on a pre-fix implementation gives NOT_FIXED (`CODE_MATCH_VULNERABLE`).
- `test_rollback_after_the_fix_is_not_fixed`: a rollback after the fix gives NOT_FIXED.
- `test_upgraded_emitted_twice_in_one_transaction` and `test_upgraded_twice_real_logs` (OP's real log list).
- `test_no_upgraded_event_is_unknown_never_predates` and `test_unreadable_or_incomplete_logs_are_unknown`: INCONCLUSIVE (`UPGRADE_TIME_UNKNOWN`), never PREDATES.
- `test_old_proxy_chosen_before_the_fix_is_still_predates_fix`: an honest old proxy keeps PREDATES_FIX.
