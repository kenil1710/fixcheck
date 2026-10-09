# Deployed verification, round 4

The fixes were checked live on the **demo** contract `0x19bc7Cb16Ce1B4F328f33d0FDfeA61297dA04f68` (GenLayer Studio Dev), deployed from commit `8519168641d560b7528f3a23640c7722598c16fe` (FixCheck 1.5.0, byte-identical source: `node tools/verify_source.mjs`). All cases use real GitHub and real chain data. The script is `test/verify_live_r4.mjs`, the raw results are in [`live-r4.json`](live-r4.json), and the run was on 2026-10-09. The round-3 run on the previous demo is kept in [`superseded/DEPLOYED_VERIFICATION-r3.md`](superseded/DEPLOYED_VERIFICATION-r3.md).

| Case | Input | Transaction | Result |
|---|---|---|---|
| (a) report pinned to a fork-only commit | PoolTogether M-17 (`_convertToShares`, Ethereum vault `0x9eE31E84…`), report `raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/6035289fa29efbada06e35f963ffd2f981ef4bfb/README.md` | [`0xcef6dd4c…620b`](https://explorer-studio-dev.genlayer.com/tx/0xcef6dd4c620f623d75b3dd52128c6043ce9f8f676814e47699e61a635596620b) | **REFUSED, `REPORT_COMMIT_NOT_ON_BRANCH`**; no check stored; the 1 GEN stake stays withdrawable |
| (b) docs pinned to a fork-only commit | OP Stack M-3 (`create`, DisputeGameFactory proxy `0xe5965ab5…`), docs `raw.githubusercontent.com/ethereum-optimism/superchain-registry/17d2cfde1b2c3742031c56f08f1bebd5ec422670/superchain/configs/mainnet/op.toml` | [`0x564a20d1…68b4`](https://explorer-studio-dev.genlayer.com/tx/0x564a20d120126cd1dec209c44e691a5e3c6a01fbcbac88e01ffaba38417d68b4) | **REFUSED, `DOCS_COMMIT_NOT_ON_BRANCH`**; no check stored; the stake stays withdrawable |
| (c) proxy whose current implementation was selected after the fix existed | Cap M-3 (`realizeRestakerInterest`, Lender proxy `0x15622c3d…`) | filed [`0xc36e8aa7…e95`](https://explorer-studio-dev.genlayer.com/tx/0xc36e8aa7846d978f137276303c24c64858bbf2efcd40fcbaa38eb1d7c053ee95), decided [`0xc528fa2f…bfa`](https://explorer-studio-dev.genlayer.com/tx/0xc528fa2fb0431c5c257311ae5a142ccbb0982a6ab49662530dc03b015a7bebfa) | demo check #1 **INCONCLUSIVE (`PARTIAL_MATCH`)**, not PREDATES_FIX |
| (d) round 4: docs pinned to a commit that exists only on a pull request's head | OP Stack M-3 again, docs at `6be72121777d061d6ca7256f51ad1225235f6f93` (head of `superchain-registry` PR #1305, closed, from the fork `Kemperino`; GitHub raw serves it under the upstream path) | [`0xba9c9fab…586a`](https://explorer-studio-dev.genlayer.com/tx/0xba9c9fab4f5fea67faaf0ace19c7e190de085cd0429aa5cbe4b2b016e26d586a) | **REFUSED, `DOCS_COMMIT_NOT_ON_BRANCH`**; no check stored |

## Why each input is a real attack

- **(a)** Commit `6035289` ("Update README.md") exists only in the fork `minanew12/2024-05-pooltogether-judging`. GitHub raw serves it under `sherlock-audit/…` with HTTP 200. Under the upstream path, GitHub's `branch_commits` lists no branch for it.
- **(b)** Commit `17d2cfd` exists only in the fork `Ajitrajpsp/superchain-registry`. GitHub raw serves `op.toml` at that commit under `ethereum-optimism/superchain-registry`, and the file lists the DisputeGameFactory address. Under the upstream path `branch_commits` lists no branch; the fork's own `main` is not a branch of the original repo. The report in this filing is the real one, pinned on `main`, so the refusal comes from the docs alone.
- **(d)** A pull request's head is reachable as `refs/pull/1305/head` of the upstream repo, so GitHub raw serves it there, but it is on no branch of that repo (`branch_commits` shows only GitHub's spoofed-commit warning).
- **(c)** Stored at filing (`get_check(1)` on the demo):

  | Field | Value |
  |---|---|
  | implementation (EIP-1967 slot at leader block 26155885, read from both RPCs) | `0x68c4f03b8640c0393a832987147bae7a0b27aaa7` |
  | proxy created | 1751892887 (2025-07-07); `code_status` `OK`: no code before that block, the same code since, both RPCs agree and date the block as Blockscout does |
  | implementation created | 1757094443 (2025-09-05); `impl_code_status` `OK` |
  | switch (`Upgraded` event, block 23318705) | 1757338499 (2025-09-08), `switch_status` `EVENT`: Blockscout's last event, confirmed in that block by both RPCs with the same time |
  | `code_born` = latest of the three | 1757338499 (2025-09-08) |
  | fix existed (`fix_at`) | 1755278193 (2025-08-15) |
  | report / docs proof | `default:main` / `default:main` |
  | status comment | GitHub issue `#150` of `sherlock-audit/2025-07-cap-judging`, written by a `sherlock-admin` account (`status_issue` `150`) |

  The running code was selected on 2025-09-08, after the fix existed, so the chronology gives `predates_fix = false`. Check #1 is INCONCLUSIVE because Blockscout verifies Cap's implementation only as a partial match. Code never judges a partial match, so the verdict comes from `PARTIAL_MATCH` and not from the dates.

## What could not be built live, and where it is tested

A live case where the dates alone decide needs a real proxy on Ethereum or OP Mainnet whose verified, exactly matching implementation still contains the audited (vulnerable) function, with a report that pins the audited commit. None of the 21 seeded findings has one, and this round's search (docs/ATTACK_REPORT_R4.md, step 5) found none either: Exactly Protocol's proxies on OP fit except that its report links the audited code only as `blob/main`, which FixCheck refuses. We cannot deploy such a proxy ourselves: FixCheck reads Ethereum, OP Mainnet, Base, Arbitrum and Polygon mainnets only, and the docs must be the protocol's own pinned page.

The offline tests serve the real Ethereum vault (deployed code == audited) as a proxy, with explorer logs and both RPCs:

- `R3_03_NewProxyOnAnOldImplementation`, `R3_Reg_ProxyChronology.test_new_proxy_after_the_fix_on_an_old_implementation`: a new proxy on a pre-fix implementation gives NOT_FIXED.
- `R4_P3_RollbackABA`: A → B → A after the fix gives NOT_FIXED; all before the fix gives PREDATES_FIX.
- `R4_P4_CodeRedeployedAtTheSameAddress`: code changed at the implementation's address since its creation gives INCONCLUSIVE (`DEPLOY_TIME_UNKNOWN`), never PREDATES.
- `R4_P5_SlotReadBeforeTheLastUpgrade`: an `Upgraded` event above the slot block refuses the filing.
- `R4_C1_TwoIndependentRpcs`: an event or creation time only one source vouches for is unknown, never a date.
- `R3_Reg_ProxyChronology.test_no_upgraded_event_is_unknown_never_predates`: INCONCLUSIVE (`UPGRADE_TIME_UNKNOWN`).
