# Seeds

Read from the chain by `tools/seeds_md.mjs` on 2026-10-16T18:01Z. Every value comes from contract state.

## Canonical — 0x0ed096B1888ebbE08F268b42d528326aD65cA065

28 checks · **11 fixed** · **1 not fixed** · 0 regressed · **6 predates audit** · **1 predates fix** · 9 inconclusive · 0 expired · 0 open · 3 scorecards · 0 regression re-checks. Ledger: balance 41 = open 0 + withdrawable 40.84 + fees 0.16 GEN (invariant holds).

Per auditor: Sherlock — 2 scorecards, 23 checks: 8 fixed, 1 not fixed, 0 regressed, 6 predates audit, 1 predates fix, 7 inconclusive, 0 expired, 0 open; Code4rena — 1 scorecards, 5 checks: 3 fixed, 0 not fixed, 0 regressed, 0 predates audit, 0 predates fix, 2 inconclusive, 0 expired, 0 open.

## Whole-report scorecards

### Scorecard #1 — PoolTogether V5, Sherlock ([page](https://fixcheck-ledger.vercel.app/scorecards/1))

Report: https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/88298eacec6f178fd0b5f9f13e4605c58aa58072/README.md

| Findings in the report | Marked fixed | Acknowledged | Not fully mitigated | No status | Checked | Not checked | State |
|---|---|---|---|---|---|---|---|
| 22 | 14 | 8 | 0 | 0 | 10 | 4 | CLOSED 2026-10-16T17:54Z |

Checks filed into its slots, by verdict: **3 fixed**, **1 not fixed**, 0 regressed, 6 predates audit, 1 predates fix, 0 inconclusive, 0 expired, 0 open (11 checks).

| Finding | Report says | Checks |
|---|---|---|
| H-1 | FIXED_MARKED | NOT_CHECKED |
| H-2 | FIXED_MARKED | NOT_CHECKED |
| H-3 | FIXED_MARKED | [#10](https://fixcheck-ledger.vercel.app/checks/10) PREDATES_AUDIT (optimism) |
| M-1 | FIXED_MARKED | [#7](https://fixcheck-ledger.vercel.app/checks/7) PREDATES_AUDIT (optimism), [#8](https://fixcheck-ledger.vercel.app/checks/8) FIXED (arbitrum) |
| M-2 | FIXED_MARKED | NOT_CHECKED |
| M-3 | ACKNOWLEDGED | — |
| M-4 | ACKNOWLEDGED | — |
| M-5 | FIXED_MARKED | [#1](https://fixcheck-ledger.vercel.app/checks/1) FIXED (optimism) |
| M-6 | ACKNOWLEDGED | — |
| M-7 | FIXED_MARKED | NOT_CHECKED |
| M-8 | FIXED_MARKED | [#2](https://fixcheck-ledger.vercel.app/checks/2) FIXED (base) |
| M-9 | FIXED_MARKED | [#3](https://fixcheck-ledger.vercel.app/checks/3) PREDATES_AUDIT (optimism) |
| M-10 | ACKNOWLEDGED | — |
| M-11 | ACKNOWLEDGED | — |
| M-12 | ACKNOWLEDGED | — |
| M-13 | ACKNOWLEDGED | — |
| M-14 | FIXED_MARKED | [#9](https://fixcheck-ledger.vercel.app/checks/9) PREDATES_AUDIT (optimism) |
| M-15 | FIXED_MARKED | [#25](https://fixcheck-ledger.vercel.app/checks/25) PREDATES_AUDIT (optimism) |
| M-16 | FIXED_MARKED | [#4](https://fixcheck-ledger.vercel.app/checks/4) PREDATES_FIX (arbitrum) |
| M-17 | FIXED_MARKED | [#5](https://fixcheck-ledger.vercel.app/checks/5) NOT_FIXED (ethereum) |
| M-18 | ACKNOWLEDGED | — |
| M-19 | FIXED_MARKED | [#6](https://fixcheck-ledger.vercel.app/checks/6) PREDATES_AUDIT (base) |

### Scorecard #2 — PoolTogether V5, Code4rena ([page](https://fixcheck-ledger.vercel.app/scorecards/2))

Report: https://raw.githubusercontent.com/code-423n4/2023-07-pooltogether-findings/ec193297735caa64d472a6d89ef7d77a7cb6196c/report.md

| Findings in the report | Marked fixed | Acknowledged | Not fully mitigated | No status | Checked | Not checked | State |
|---|---|---|---|---|---|---|---|
| 36 | 27 | 1 | 7 | 1 | 5 | 22 | CLOSED 2026-10-16T17:53Z |

Checks filed into its slots, by verdict: **3 fixed**, **0 not fixed**, 0 regressed, 0 predates audit, 0 predates fix, 2 inconclusive, 0 expired, 0 open (5 checks).

| Finding | Report says | Checks |
|---|---|---|
| H-01 | FIXED_MARKED | NOT_CHECKED |
| H-02 | FIXED_MARKED | NOT_CHECKED |
| H-03 | FIXED_MARKED | NOT_CHECKED |
| H-04 | FIXED_MARKED | NOT_CHECKED |
| H-05 | NOT_MITIGATED | — |
| H-06 | FIXED_MARKED | [#20](https://fixcheck-ledger.vercel.app/checks/20) FIXED (optimism) |
| H-07 | FIXED_MARKED | NOT_CHECKED |
| H-08 | FIXED_MARKED | NOT_CHECKED |
| H-09 | NOT_MITIGATED | — |
| M-01 | ACKNOWLEDGED | — |
| M-02 | NOT_MITIGATED | — |
| M-03 | FIXED_MARKED | [#22](https://fixcheck-ledger.vercel.app/checks/22) FIXED (optimism) |
| M-04 | FIXED_MARKED | NOT_CHECKED |
| M-05 | FIXED_MARKED | [#21](https://fixcheck-ledger.vercel.app/checks/21) FIXED (optimism) |
| M-06 | FIXED_MARKED | [#24](https://fixcheck-ledger.vercel.app/checks/24) INCONCLUSIVE (optimism) |
| M-07 | FIXED_MARKED | NOT_CHECKED |
| M-08 | FIXED_MARKED | NOT_CHECKED |
| M-09 | NOT_MITIGATED | — |
| M-10 | FIXED_MARKED | NOT_CHECKED |
| M-11 | FIXED_MARKED | NOT_CHECKED |
| M-12 | FIXED_MARKED | NOT_CHECKED |
| M-13 | FIXED_MARKED | NOT_CHECKED |
| M-14 | FIXED_MARKED | NOT_CHECKED |
| M-15 | FIXED_MARKED | NOT_CHECKED |
| M-16 | NOT_MITIGATED | — |
| M-17 | UNMARKED | — |
| M-18 | NOT_MITIGATED | — |
| M-19 | FIXED_MARKED | [#23](https://fixcheck-ledger.vercel.app/checks/23) INCONCLUSIVE (optimism) |
| M-20 | FIXED_MARKED | NOT_CHECKED |
| M-21 | FIXED_MARKED | NOT_CHECKED |
| M-22 | NOT_MITIGATED | — |
| M-23 | FIXED_MARKED | NOT_CHECKED |
| M-24 | FIXED_MARKED | NOT_CHECKED |
| M-25 | FIXED_MARKED | NOT_CHECKED |
| M-26 | FIXED_MARKED | NOT_CHECKED |
| M-27 | FIXED_MARKED | NOT_CHECKED |

### Scorecard #3 — Mellow Flexible Vaults, Sherlock ([page](https://fixcheck-ledger.vercel.app/scorecards/3))

Report: https://raw.githubusercontent.com/sherlock-audit/2025-07-mellow-flexible-vaults-judging/4bcbdcfe643761c67d7dd862ca5909168c3ad859/README.md

| Findings in the report | Marked fixed | Acknowledged | Not fully mitigated | No status | Checked | Not checked | State |
|---|---|---|---|---|---|---|---|
| 15 | 13 | 0 | 0 | 2 | 8 | 5 | CLOSED 2026-10-16T17:53Z |

Checks filed into its slots, by verdict: **5 fixed**, **0 not fixed**, 0 regressed, 0 predates audit, 0 predates fix, 4 inconclusive, 0 expired, 0 open (9 checks).

| Finding | Report says | Checks |
|---|---|---|
| H-1 | FIXED_MARKED | [#11](https://fixcheck-ledger.vercel.app/checks/11) FIXED (ethereum) |
| H-2 | FIXED_MARKED | [#12](https://fixcheck-ledger.vercel.app/checks/12) INCONCLUSIVE (ethereum) |
| H-3 | FIXED_MARKED | [#13](https://fixcheck-ledger.vercel.app/checks/13) INCONCLUSIVE (ethereum) |
| H-4 | FIXED_MARKED | [#14](https://fixcheck-ledger.vercel.app/checks/14) INCONCLUSIVE (ethereum) |
| H-5 | FIXED_MARKED | [#15](https://fixcheck-ledger.vercel.app/checks/15) FIXED (ethereum), [#28](https://fixcheck-ledger.vercel.app/checks/28) FIXED (ethereum) |
| H-6 | FIXED_MARKED | NOT_CHECKED |
| M-1 | FIXED_MARKED | [#16](https://fixcheck-ledger.vercel.app/checks/16) INCONCLUSIVE (ethereum) |
| M-2 | FIXED_MARKED | NOT_CHECKED |
| M-3 | UNMARKED | — |
| M-4 | FIXED_MARKED | [#17](https://fixcheck-ledger.vercel.app/checks/17) FIXED (ethereum) |
| M-5 | FIXED_MARKED | [#18](https://fixcheck-ledger.vercel.app/checks/18) FIXED (ethereum) |
| M-6 | FIXED_MARKED | NOT_CHECKED |
| M-7 | FIXED_MARKED | NOT_CHECKED |
| M-8 | FIXED_MARKED | NOT_CHECKED |
| M-9 | UNMARKED | — |

## The 22 v1 checks, re-run on v2 (before / after)

| v1 # | Finding | Chain | v1 (BASE `27f30c0`, deployment `8519168`) | v2 # | v2 (`85396d9`) | Change |
|---|---|---|---|---|---|---|
| 1 | PoolTogether V5 M-5 `claimPrizes` | optimism | FIXED (CODE_MATCH_FIX) | [1](https://fixcheck-ledger.vercel.app/checks/1) | FIXED (CODE_MATCH_FIX) | unchanged |
| 2 | PoolTogether V5 M-8 `_computeFeePerClaim` | base | FIXED (CODE_MATCH_FIX) | [2](https://fixcheck-ledger.vercel.app/checks/2) | FIXED (CODE_MATCH_FIX) | unchanged |
| 3 | PoolTogether V5 M-15 `shutdownAt` | optimism | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | [25](https://fixcheck-ledger.vercel.app/checks/25) | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | unchanged |
| 4 | PoolTogether V5 M-9 `liquidatableBalanceOf` | optimism | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | [3](https://fixcheck-ledger.vercel.app/checks/3) | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | unchanged |
| 5 | PoolTogether V5 M-16 `maxDeposit` | arbitrum | PREDATES_FIX (DEPLOYED_BEFORE_FIX) | [4](https://fixcheck-ledger.vercel.app/checks/4) | PREDATES_FIX (DEPLOYED_BEFORE_FIX) | unchanged |
| 6 | PoolTogether V5 M-17 `_convertToShares` | ethereum | NOT_FIXED (CODE_MATCH_VULNERABLE) | [5](https://fixcheck-ledger.vercel.app/checks/5) | NOT_FIXED (CODE_MATCH_VULNERABLE) | unchanged |
| 7 | PoolTogether V5 M-19 `claimPrize` | base | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | [6](https://fixcheck-ledger.vercel.app/checks/6) | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | unchanged |
| 8 | PoolTogether V5 M-1 `isRequestComplete` | optimism | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | [7](https://fixcheck-ledger.vercel.app/checks/7) | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | unchanged |
| 9 | PoolTogether V5 M-1 `isRequestComplete` | arbitrum | FIXED (CODE_MATCH_FIX) | [8](https://fixcheck-ledger.vercel.app/checks/8) | FIXED (CODE_MATCH_FIX) | unchanged |
| 10 | PoolTogether V5 M-14 `canStartDraw` | optimism | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | [9](https://fixcheck-ledger.vercel.app/checks/9) | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | unchanged |
| 11 | PoolTogether V5 H-3 `startDrawReward` | optimism | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | [10](https://fixcheck-ledger.vercel.app/checks/10) | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | unchanged |
| 12 | Mellow Flexible Vaults H-1 `checkSignatures` | ethereum | FIXED (CODE_MATCH_FIX) | [11](https://fixcheck-ledger.vercel.app/checks/11) | FIXED (CODE_MATCH_FIX) | unchanged |
| 13 | Mellow Flexible Vaults H-2 `_handleReport` | ethereum | INCONCLUSIVE (MODEL_UNGROUNDED) | [12](https://fixcheck-ledger.vercel.app/checks/12) | INCONCLUSIVE (MODEL_UNGROUNDED) | unchanged |
| 14 | Mellow Flexible Vaults H-3 `callHook` | ethereum | INCONCLUSIVE (PARTIAL_MATCH) | [13](https://fixcheck-ledger.vercel.app/checks/13) | INCONCLUSIVE (PARTIAL_MATCH) | unchanged |
| 15 | Mellow Flexible Vaults H-4 `calculateFee` | ethereum | INCONCLUSIVE (MODEL_UNGROUNDED) | [14](https://fixcheck-ledger.vercel.app/checks/14) | INCONCLUSIVE (MODEL_UNGROUNDED) | unchanged |
| 16 | Mellow Flexible Vaults H-5 `calculateFee` | ethereum | FIXED (CODE_MATCH_FIX) | [15](https://fixcheck-ledger.vercel.app/checks/15) | FIXED (CODE_MATCH_FIX) | unchanged |
| 17 | Mellow Flexible Vaults M-1 `updateChecks` | ethereum | INCONCLUSIVE (MODEL_UNGROUNDED) | [16](https://fixcheck-ledger.vercel.app/checks/16) | INCONCLUSIVE (MODEL_UNGROUNDED) | unchanged |
| 18 | Mellow Flexible Vaults M-4 `handleReport` | ethereum | FIXED (CODE_MATCH_FIX) | [17](https://fixcheck-ledger.vercel.app/checks/17) | FIXED (CODE_MATCH_FIX) | unchanged |
| 19 | Mellow Flexible Vaults M-5 `cancelDepositRequest` | ethereum | FIXED (CODE_CONTAINS_FIX) | [18](https://fixcheck-ledger.vercel.app/checks/18) | FIXED (CODE_CONTAINS_FIX) | unchanged |
| 20 | Cap M-1 `liquidate` | ethereum | INCONCLUSIVE (PARTIAL_MATCH) | [26](https://fixcheck-ledger.vercel.app/checks/26) | INCONCLUSIVE (PARTIAL_MATCH) | unchanged |
| 21 | Cap M-3 `realizeRestakerInterest` | ethereum | INCONCLUSIVE (PARTIAL_MATCH) | [19](https://fixcheck-ledger.vercel.app/checks/19) | INCONCLUSIVE (PARTIAL_MATCH) | unchanged |
| 22 | OP Stack fault proofs M-3 `create` | ethereum | INCONCLUSIVE (PARTIAL_MATCH) | [27](https://fixcheck-ledger.vercel.app/checks/27) | INCONCLUSIVE (PARTIAL_MATCH) | unchanged |

22 v1 checks re-run on v2: **22 unchanged**, 0 changed or not yet decided.

## Every canonical check

| # | Auditor | Protocol | Finding | Function | Chain | Address (created · fix existed) | Scorecard | Verdict | Basis | Model (asked twice) | Stakes (not fixed / fixed) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| [1](https://fixcheck-ledger.vercel.app/checks/1) | Sherlock | PoolTogether V5 | [M-5](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/88298eacec6f178fd0b5f9f13e4605c58aa58072/README.md) | `claimPrizes` | optimism | `0x220c9398b0ee07472bf8906e44574cb9fe3b8d90` 2024-07-16 · 2024-06-28 | #1 | **FIXED** | CODE_MATCH_FIX | not asked | 1 / 2 |
| [2](https://fixcheck-ledger.vercel.app/checks/2) | Sherlock | PoolTogether V5 | [M-8](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/88298eacec6f178fd0b5f9f13e4605c58aa58072/README.md) | `_computeFeePerClaim` | base | `0xcdce635b774de77cdf791647601dba64a75547ba` 2024-07-16 · 2024-07-12 | #1 | **FIXED** | CODE_MATCH_FIX | not asked | 1 / 0 |
| [3](https://fixcheck-ledger.vercel.app/checks/3) | Sherlock | PoolTogether V5 | [M-9](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/88298eacec6f178fd0b5f9f13e4605c58aa58072/README.md) | `liquidatableBalanceOf` | optimism | `0xa52e38a9147f5ea9e0c5547376c21c9e3f3e5e1f` 2024-04-18 · 2024-06-28 | #1 | **PREDATES_AUDIT** | DEPLOYED_BEFORE_AUDIT | not asked | 1 / 1 |
| [4](https://fixcheck-ledger.vercel.app/checks/4) | Sherlock | PoolTogether V5 | [M-16](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/88298eacec6f178fd0b5f9f13e4605c58aa58072/README.md) | `maxDeposit` | arbitrum | `0x97a9c02cfbbf0332d8172331461ab476df1e8c95` 2024-05-29 · 2024-06-28 | #1 | **PREDATES_FIX** | DEPLOYED_BEFORE_FIX | not asked | 1 / 0 |
| [5](https://fixcheck-ledger.vercel.app/checks/5) | Sherlock | PoolTogether V5 | [M-17](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/88298eacec6f178fd0b5f9f13e4605c58aa58072/README.md) | `_convertToShares` | ethereum | `0x9ee31e845ff1358bf6b1f914d3918c6223c75573` 2024-08-19 · 2024-06-28 | #1 | **NOT_FIXED** | CODE_MATCH_VULNERABLE | not asked | 1 / 1 |
| [6](https://fixcheck-ledger.vercel.app/checks/6) | Sherlock | PoolTogether V5 | [M-19](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/88298eacec6f178fd0b5f9f13e4605c58aa58072/README.md) | `claimPrize` | base | `0x6b5a5c55e9dd4bb502ce25bbfbaa49b69cf7e4dd` 2024-05-15 · 2024-06-28 | #1 | **PREDATES_AUDIT** | DEPLOYED_BEFORE_AUDIT | not asked | 1 / 0 |
| [7](https://fixcheck-ledger.vercel.app/checks/7) | Sherlock | PoolTogether V5 | [M-1](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/88298eacec6f178fd0b5f9f13e4605c58aa58072/README.md) | `isRequestComplete` | optimism | `0x3d2ef6c091f7cb69f06ec3117f36a28bc596aa7b` 2024-04-18 · 2024-07-08 | #1 | **PREDATES_AUDIT** | DEPLOYED_BEFORE_AUDIT | not asked | 1 / 0 |
| [8](https://fixcheck-ledger.vercel.app/checks/8) | Sherlock | PoolTogether V5 | [M-1](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/88298eacec6f178fd0b5f9f13e4605c58aa58072/README.md) | `isRequestComplete` | arbitrum | `0xad1b8ec0151f13ba563226092b5f7308d8dc107b` 2024-05-29 · 2024-07-08 | #1 | **FIXED** | CODE_MATCH_FIX | not asked | 1 / 0 |
| [9](https://fixcheck-ledger.vercel.app/checks/9) | Sherlock | PoolTogether V5 | [M-14](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/88298eacec6f178fd0b5f9f13e4605c58aa58072/README.md) | `canStartDraw` | optimism | `0x7eed7444de862c4f79c5820ff867fa3a82641857` 2024-04-18 · 2024-07-08 | #1 | **PREDATES_AUDIT** | DEPLOYED_BEFORE_AUDIT | not asked | 1 / 0 |
| [10](https://fixcheck-ledger.vercel.app/checks/10) | Sherlock | PoolTogether V5 | [H-3](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/88298eacec6f178fd0b5f9f13e4605c58aa58072/README.md) | `startDrawReward` | optimism | `0x7eed7444de862c4f79c5820ff867fa3a82641857` 2024-04-18 · 2024-07-12 | #1 | **PREDATES_AUDIT** | DEPLOYED_BEFORE_AUDIT | not asked | 1 / 0 |
| [11](https://fixcheck-ledger.vercel.app/checks/11) | Sherlock | Mellow Flexible Vaults | [H-1](https://raw.githubusercontent.com/sherlock-audit/2025-07-mellow-flexible-vaults-judging/4bcbdcfe643761c67d7dd862ca5909168c3ad859/README.md) | `checkSignatures` | ethereum | `0x0000000167598d2c78e2313fd5328e16bd9a0b13` 2025-09-08 · 2025-07-16 | #3 | **FIXED** | CODE_MATCH_FIX | not asked | 1 / 2 |
| [12](https://fixcheck-ledger.vercel.app/checks/12) | Sherlock | Mellow Flexible Vaults | [H-2](https://raw.githubusercontent.com/sherlock-audit/2025-07-mellow-flexible-vaults-judging/4bcbdcfe643761c67d7dd862ca5909168c3ad859/README.md) | `_handleReport` | ethereum | `0x000000000c139266ba06170ed1deaca6d11903c1` 2026-01-23 · 2025-07-22 | #3 | **INCONCLUSIVE** | MODEL_UNGROUNDED | UNGROUNDED|UNGROUNDED | 1 / 1 |
| [13](https://fixcheck-ledger.vercel.app/checks/13) | Sherlock | Mellow Flexible Vaults | [H-3](https://raw.githubusercontent.com/sherlock-audit/2025-07-mellow-flexible-vaults-judging/4bcbdcfe643761c67d7dd862ca5909168c3ad859/README.md) | `callHook` | ethereum | `0x0000000637f1b1ccda4af2db6cddf5e5ec45fd93` 2025-09-08 · 2025-07-26 | #3 | **INCONCLUSIVE** | PARTIAL_MATCH | not asked | 1 / 0 |
| [14](https://fixcheck-ledger.vercel.app/checks/14) | Sherlock | Mellow Flexible Vaults | [H-4](https://raw.githubusercontent.com/sherlock-audit/2025-07-mellow-flexible-vaults-judging/4bcbdcfe643761c67d7dd862ca5909168c3ad859/README.md) | `calculateFee` | ethereum | `0x0000000de74e5d51651326e0a3e1aca94beaf6e1` 2025-09-08 · 2025-07-27 | #3 | **INCONCLUSIVE** | MODEL_UNGROUNDED | UNGROUNDED|UNGROUNDED | 1 / 0 |
| [15](https://fixcheck-ledger.vercel.app/checks/15) | Sherlock | Mellow Flexible Vaults | [H-5](https://raw.githubusercontent.com/sherlock-audit/2025-07-mellow-flexible-vaults-judging/4bcbdcfe643761c67d7dd862ca5909168c3ad859/README.md) | `calculateFee` | ethereum | `0x0000000de74e5d51651326e0a3e1aca94beaf6e1` 2025-09-08 · 2025-07-28 | #3 | **FIXED** | CODE_MATCH_FIX | not asked | 1 / 0 |
| [16](https://fixcheck-ledger.vercel.app/checks/16) | Sherlock | Mellow Flexible Vaults | [M-1](https://raw.githubusercontent.com/sherlock-audit/2025-07-mellow-flexible-vaults-judging/4bcbdcfe643761c67d7dd862ca5909168c3ad859/README.md) | `updateChecks` | ethereum | `0x0000000e8eb7173fa1a3ba60eca325bcb6aaf378` 2025-09-08 · 2025-07-27 | #3 | **INCONCLUSIVE** | MODEL_UNGROUNDED | UNGROUNDED|UNGROUNDED | 1 / 0 |
| [17](https://fixcheck-ledger.vercel.app/checks/17) | Sherlock | Mellow Flexible Vaults | [M-4](https://raw.githubusercontent.com/sherlock-audit/2025-07-mellow-flexible-vaults-judging/4bcbdcfe643761c67d7dd862ca5909168c3ad859/README.md) | `handleReport` | ethereum | `0x0000000615b2771511daa693ac07be5622869e01` 2025-09-08 · 2025-08-11 | #3 | **FIXED** | CODE_MATCH_FIX | not asked | 1 / 0 |
| [18](https://fixcheck-ledger.vercel.app/checks/18) | Sherlock | Mellow Flexible Vaults | [M-5](https://raw.githubusercontent.com/sherlock-audit/2025-07-mellow-flexible-vaults-judging/4bcbdcfe643761c67d7dd862ca5909168c3ad859/README.md) | `cancelDepositRequest` | ethereum | `0x00000006da9f179bfe250dd1c51cd2d3581930c8` 2025-09-08 · 2025-07-17 | #3 | **FIXED** | CODE_CONTAINS_FIX | not asked | 1 / 0 |
| [19](https://fixcheck-ledger.vercel.app/checks/19) | Sherlock | Cap | [M-3](https://raw.githubusercontent.com/sherlock-audit/2025-07-cap-judging/e1c4f01994e830b520238e0c292303b0d7eed1e1/README.md) | `realizeRestakerInterest` | ethereum | `0x15622c3dbbc5614e6dfa9446603c1779647f01fc` → `0x68c4f03b8640c0393a832987147bae7a0b27aaa7` 2025-07-07 · 2025-08-15 | — | **INCONCLUSIVE** | PARTIAL_MATCH | not asked | 1 / 0 |
| [20](https://fixcheck-ledger.vercel.app/checks/20) | Code4rena | PoolTogether V5 | [H-06](https://raw.githubusercontent.com/code-423n4/2023-07-pooltogether-findings/ec193297735caa64d472a6d89ef7d77a7cb6196c/report.md) | `_delegate` | optimism | `0xcb0672de558ad8f122c0e081f0d35480ab3be167` 2024-04-18 · 2023-08-16 | #2 | **FIXED** | CODE_MATCH_FIX | not asked | 1 / 1 |
| [21](https://fixcheck-ledger.vercel.app/checks/21) | Code4rena | PoolTogether V5 | [M-05](https://raw.githubusercontent.com/code-423n4/2023-07-pooltogether-findings/ec193297735caa64d472a6d89ef7d77a7cb6196c/report.md) | `_transferBalance` | optimism | `0xcb0672de558ad8f122c0e081f0d35480ab3be167` 2024-04-18 · 2023-08-16 | #2 | **FIXED** | CODE_MATCH_FIX | not asked | 1 / 0 |
| [22](https://fixcheck-ledger.vercel.app/checks/22) | Code4rena | PoolTogether V5 | [M-03](https://raw.githubusercontent.com/code-423n4/2023-07-pooltogether-findings/ec193297735caa64d472a6d89ef7d77a7cb6196c/report.md) | `getTwabBetween` | optimism | `0xcb0672de558ad8f122c0e081f0d35480ab3be167` 2024-04-18 · 2023-08-15 | #2 | **FIXED** | CODE_CONTAINS_FIX | not asked | 1 / 0 |
| [23](https://fixcheck-ledger.vercel.app/checks/23) | Code4rena | PoolTogether V5 | [M-19](https://raw.githubusercontent.com/code-423n4/2023-07-pooltogether-findings/ec193297735caa64d472a6d89ef7d77a7cb6196c/report.md) | `getVaultPortion` | optimism | `0xf35fe10ffd0a9672d0095c435fd8767a7fe29b55` 2024-04-18 · 2023-08-16 | #2 | **INCONCLUSIVE** | MODEL_UNGROUNDED | UNGROUNDED|UNGROUNDED | 1 / 0 |
| [24](https://fixcheck-ledger.vercel.app/checks/24) | Code4rena | PoolTogether V5 | [M-06](https://raw.githubusercontent.com/code-423n4/2023-07-pooltogether-findings/ec193297735caa64d472a6d89ef7d77a7cb6196c/report.md) | `setDrawManager` | optimism | `0xf35fe10ffd0a9672d0095c435fd8767a7fe29b55` 2024-04-18 · 2023-08-16 | #2 | **INCONCLUSIVE** | MODEL_UNGROUNDED | UNGROUNDED|UNGROUNDED | 1 / 0 |
| [25](https://fixcheck-ledger.vercel.app/checks/25) | Sherlock | PoolTogether V5 | [M-15](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/88298eacec6f178fd0b5f9f13e4605c58aa58072/README.md) | `shutdownAt` | optimism | `0xf35fe10ffd0a9672d0095c435fd8767a7fe29b55` 2024-04-18 · 2024-06-28 | #1 | **PREDATES_AUDIT** | DEPLOYED_BEFORE_AUDIT | not asked | 1 / 0 |
| [26](https://fixcheck-ledger.vercel.app/checks/26) | Sherlock | Cap | [M-1](https://raw.githubusercontent.com/sherlock-audit/2025-07-cap-judging/e1c4f01994e830b520238e0c292303b0d7eed1e1/README.md) | `liquidate` | ethereum | `0x15622c3dbbc5614e6dfa9446603c1779647f01fc` → `0x68c4f03b8640c0393a832987147bae7a0b27aaa7` 2025-07-07 · 2025-08-15 | — | **INCONCLUSIVE** | PARTIAL_MATCH | not asked | 1 / 1 |
| [27](https://fixcheck-ledger.vercel.app/checks/27) | Sherlock | OP Stack fault proofs | [M-3](https://raw.githubusercontent.com/sherlock-audit/2024-02-optimism-2024-judging/2b7f5d81eeb2755a4de99e6fd5b2fce823177a3c/README.md) | `create` | ethereum | `0xe5965ab5962edc7477c8520243a95517cd252fa9` → `0x72b971717e088b59f26d4236be222adb6acd393b` 2024-05-16 · 2024-04-15 | — | **INCONCLUSIVE** | PARTIAL_MATCH | not asked | 1 / 0 |
| [28](https://fixcheck-ledger.vercel.app/checks/28) | Sherlock | Mellow Flexible Vaults | [H-5](https://raw.githubusercontent.com/sherlock-audit/2025-07-mellow-flexible-vaults-judging/4bcbdcfe643761c67d7dd862ca5909168c3ad859/README.md) | `calculateFee` | ethereum | `0x24fd64eb4766d91fd79a4d5e8086b2460debcae7` → `0x0000000de74e5d51651326e0a3e1aca94beaf6e1` 2025-09-19 · 2025-07-28 | #3 | **FIXED** | CODE_MATCH_FIX | not asked | 1 / 0 |

## Demo — 0xf6f036F7186487655F522dB6F5dAC07E0844F7DE

90 s counter window, 300 s decide window, 10 min scorecard filing; same source. Every transaction:

| Step | Path | Call | Result | Transaction |
|---|---|---|---|---|
| S0 | import the PoolTogether Sherlock report (whole) | `import_report` | ACCEPTED | [0x15bf4aacd4…](https://explorer-studio-dev.genlayer.com/tx/0x15bf4aacd45a4b6797df0518dfbd3c13bec161974439d20f317550282809225c) |
| D1 | NOT FIXED: challenger wins | `file_slot` | code says NOT_FIXED | [0x51084df48d…](https://explorer-studio-dev.genlayer.com/tx/0x51084df48dde48750e1b68c7152bbe9a56812f222cd6514e3212cf91662d87c7) |
| D1 | NOT FIXED: challenger wins | `counter_stake` #1 | ACCEPTED | [0x0091374293…](https://explorer-studio-dev.genlayer.com/tx/0x0091374293e772343b09731fc6e9cbe3a4435ba5f64b82fe6ac79bb321d17424) |
| D4 | FIXED, no defender: refund minus 2% fee | `file_slot` | code says FIXED | [0xf6ac0ca011…](https://explorer-studio-dev.genlayer.com/tx/0xf6ac0ca011b479551df50bba8148c5d13b5f2acc49fd9addf4d7e5684bf5a0aa) |
| D8 | PREDATES AUDIT: refund | `file_slot` | code says PREDATES_AUDIT | [0xe3295fba79…](https://explorer-studio-dev.genlayer.com/tx/0xe3295fba79b95ce5f9ffa3da10d0071166857845bf0d45e171e4895a0a6eb762) |
| D9 | PREDATES FIX: refund | `file_slot` | code says PREDATES_FIX | [0x0e4e39a240…](https://explorer-studio-dev.genlayer.com/tx/0x0e4e39a240be07ba7a549018aff310d897e9c9f2180ee22c7c00516478bc0062) |
| D9 | PREDATES FIX: refund | `counter_stake` #4 | ACCEPTED | [0x2d801af965…](https://explorer-studio-dev.genlayer.com/tx/0x2d801af965ea5e404d11db49cc7116926066d61b921094698d70456682a39d1f) |
| D1 | NOT FIXED: challenger wins | `decide` #1 | ACCEPTED | [0x78ed1a4417…](https://explorer-studio-dev.genlayer.com/tx/0x78ed1a44176991f12b0fb83799271ce279e72819673e1b4e9bfb84e68aafe5f9) |
| D1 | NOT FIXED: challenger wins | `decide` #1 | ACCEPTED | [0xafa8fa4125…](https://explorer-studio-dev.genlayer.com/tx/0xafa8fa41251de8cd23a0b75862e6f2c8fe29af0920f5378f57c9ba419a3fbd39) |
| D1 | NOT FIXED: challenger wins | `decide` #1 | ACCEPTED | [0x73865c321d…](https://explorer-studio-dev.genlayer.com/tx/0x73865c321d25ed79bccf53e8799185899d52025e47a5e04444bc4be2e4205052) |
| D1 | NOT FIXED: challenger wins | `decide` #1 | ACCEPTED | [0x319c785771…](https://explorer-studio-dev.genlayer.com/tx/0x319c785771277126da55b99042718d99ff99a335bf17e215d6d132fbda50670f) |
| D4 | FIXED, no defender: refund minus 2% fee | `decide` #2 | ACCEPTED | [0x2b4b8ff0ba…](https://explorer-studio-dev.genlayer.com/tx/0x2b4b8ff0ba3c8602863291f42e388d052303617ec768a28ed7deaf1a7fa10177) |
| D4 | FIXED, no defender: refund minus 2% fee | `decide` #2 | ACCEPTED | [0x6cf8325b41…](https://explorer-studio-dev.genlayer.com/tx/0x6cf8325b418c9de8ffb082deb743d8dbd4b8c13fe5c806c1cd69726c004bfa37) |
| D4 | FIXED, no defender: refund minus 2% fee | `decide` #2 | ACCEPTED | [0x5248154611…](https://explorer-studio-dev.genlayer.com/tx/0x52481546117aa69dcf4ba2a82228f56046395281f94c94ac97fbcd54e3d2f0f9) |
| D4 | FIXED, no defender: refund minus 2% fee | `decide` #2 | ACCEPTED | [0x02fa5cc0ff…](https://explorer-studio-dev.genlayer.com/tx/0x02fa5cc0ffc00bde6c9a41b94ee9eb50bbf1599efa553256d6fe0ab73a487c78) |
| D8 | PREDATES AUDIT: refund | `decide` #3 | ACCEPTED | [0xbade228c36…](https://explorer-studio-dev.genlayer.com/tx/0xbade228c3634e83b45bf10a6d297a535e481c1b0f2647650c563cf39a1236fa9) |
| D8 | PREDATES AUDIT: refund | `decide` #3 | ACCEPTED | [0x59e566d2e1…](https://explorer-studio-dev.genlayer.com/tx/0x59e566d2e13666f0c9d4a6bd518f2eee4927330b756f1ea1eace44e5a529d5ed) |
| D8 | PREDATES AUDIT: refund | `decide` #3 | ACCEPTED | [0x5868677fcb…](https://explorer-studio-dev.genlayer.com/tx/0x5868677fcb62c2a8b146beceb77719d65771562e18f0ed060ab23acd8bec07f1) |
| D8 | PREDATES AUDIT: refund | `decide` #3 | ACCEPTED | [0xabc2c1caf0…](https://explorer-studio-dev.genlayer.com/tx/0xabc2c1caf0466831089dc66e512303845c21d636b84818b647b7a1e07ae23a60) |
| D9 | PREDATES FIX: refund | `decide` #4 | ACCEPTED | [0x3a3d582fb7…](https://explorer-studio-dev.genlayer.com/tx/0x3a3d582fb7f20ca17ad76ad9dd3b5c0f2f7b1203ac178a06cdd63a4ee09f514a) |
| D9 | PREDATES FIX: refund | `decide` #4 | ACCEPTED | [0x8722e7a1d3…](https://explorer-studio-dev.genlayer.com/tx/0x8722e7a1d36a0f8e68fc88fbaa9043890bc869dd4cd9e13b47c497adb894633d) |
| D9 | PREDATES FIX: refund | `decide` #4 | ACCEPTED | [0xba7412944c…](https://explorer-studio-dev.genlayer.com/tx/0xba7412944c0279991501e5f00cc8d30815886fdd9e795f05fb94f72dab9a7b7b) |
| D9 | PREDATES FIX: refund | `decide` #4 | ACCEPTED | [0x1ffb02c5f4…](https://explorer-studio-dev.genlayer.com/tx/0x1ffb02c5f41c41b8ad5bee64824d929839a47dfc4837a54db60c70c6262fde60) |
| D2 | FIXED: defender wins | `file_check` | code says FIXED | [0x8088495b35…](https://explorer-studio-dev.genlayer.com/tx/0x8088495b35bd2127cd9056937fecf8ce47512a333a7dc9524081022bd28c576c) |
| D2 | FIXED: defender wins | `counter_stake` #5 | ACCEPTED | [0xa02b54cabc…](https://explorer-studio-dev.genlayer.com/tx/0xa02b54cabcaa0b81d2a3327adae05c334f9f9e25d03448b6b9572905d7479c95) |
| D2 | FIXED: defender wins | `decide` #5 | ACCEPTED | [0x6c701036ce…](https://explorer-studio-dev.genlayer.com/tx/0x6c701036ce5a67c0b6395a6c1f5a117e714b3a0918bd1258853df38d4d30eeef) |
| D3 | INCONCLUSIVE: function not in that contract | `file_check` | code says INCONCLUSIVE | [0x8747284e26…](https://explorer-studio-dev.genlayer.com/tx/0x8747284e26a90a2d8dbee5b758ef0b313bc3b156cfc793a5b5974d1d73ece269) |
| D3 | INCONCLUSIVE: function not in that contract | `counter_stake` #6 | ACCEPTED | [0xcc86aa19cf…](https://explorer-studio-dev.genlayer.com/tx/0xcc86aa19cf2ee6673c4d7f4b8ef6be977d7dbf8e6021b02af6488eed9789f93f) |
| D3 | INCONCLUSIVE: function not in that contract | `decide` #6 | ACCEPTED | [0xa4279fd4db…](https://explorer-studio-dev.genlayer.com/tx/0xa4279fd4db427dc3aa483102b0a5575f0e754ca35b2a546b3c4dba099f6fede6) |
| D6 | model path | `file_check` | code says FIXED | [0x849ad035ad…](https://explorer-studio-dev.genlayer.com/tx/0x849ad035ad8acf77104599b399c80e543781766786f05ea0413504d8f225c5bf) |
| D6 | model path | `decide` #7 | ACCEPTED | [0x36a56b7576…](https://explorer-studio-dev.genlayer.com/tx/0x36a56b75760a2c3e0717cab349ef48eb88f7894829515b06a5feeff12b0716b2) |
| D10 | Code4rena H-06: FIXED by code | `file_check` | code says FIXED | [0xfafdeea6c0…](https://explorer-studio-dev.genlayer.com/tx/0xfafdeea6c0de8daf316fb4f280e0cbeba10e6322baf47b2fdaab10886642a87b) |
| D10 | Code4rena H-06: FIXED by code | `decide` #8 | ACCEPTED | [0xc4c88cb7fd…](https://explorer-studio-dev.genlayer.com/tx/0xc4c88cb7fd18b3ba09f5e0089965f660fcd1cdd92b502ca8934dd240ad11cfc4) |
| D11 | FIXED on a real Mellow proxy | `file_check` | REFUSED RPC_UNREADABLE | [0x82e5c2c010…](https://explorer-studio-dev.genlayer.com/tx/0x82e5c2c010708975584235558395ef864cecd8359c9a0b35bf029782af9062fc) |
| D5 | expiry: everyone refunded | `file_check` | REFUSED RPC_UNREADABLE | [0x46ac91a6c4…](https://explorer-studio-dev.genlayer.com/tx/0x46ac91a6c431b15338a0e0004fadab26fc1b91e0205458e3e978b44c654a01ba) |
| R1 | regression re-file, proxy unchanged: refused | `file_regression` | REFUSED NO_SUCH_CHECK | [0xeca08f95e5…](https://explorer-studio-dev.genlayer.com/tx/0xeca08f95e57cffe168f7ec7ff00ace502b31f64ef3ac74126a749c65ebc7526c) |
| R2a | regression re-file of a non-proxy: refused | `file_regression` (prior #2) | REFUSED PRIOR_CHECK_NOT_FIXED | [0x39e44de1bd…](https://explorer-studio-dev.genlayer.com/tx/0x39e44de1bde1c25cb4c1f1020b7668864ab609586145a44f1dba6dbae02fe119) |
| R2b | regression re-file of a NOT_FIXED check: refused | `file_regression` (prior #1) | REFUSED PRIOR_CHECK_NOT_FIXED | [0x6b5b776348…](https://explorer-studio-dev.genlayer.com/tx/0x6b5b7763486dd119450cf4c64edd6d2bc8a271e067bac42555c7c46b50f8e21d) |
| D7 | unpinned report: refused | `file_check` | REFUSED REPORT_URL_NOT_PINNED | [0x0c6fe14d24…](https://explorer-studio-dev.genlayer.com/tx/0x0c6fe14d2481ed09badc6c4a8284c4723aefdfd504a66447a331dfcc6bdce8b7) |
| I1 | import under another protocol's docs: refused | `import_report` | reverted: PROTOCOL_NOT_IN_REPORT | [0x9a95a1f6d9…](https://explorer-studio-dev.genlayer.com/tx/0x9a95a1f6d96a98a6caf636a6c41074bbb5f8d0d7ac6c0ec1f28fbc1b22b82c91) |
| D1 | NOT FIXED: challenger wins | `expire (missed window)` #2 | ACCEPTED | [0x1623600bf3…](https://explorer-studio-dev.genlayer.com/tx/0x1623600bf37e5c94f1601590c79a2dab8d13fe0abc4dbe3998c82a37911d165d) |
| D1 | NOT FIXED: challenger wins | `file_check` | REFUSED ALREADY_OPEN_AS_CHECK_1 | [0xd185512614…](https://explorer-studio-dev.genlayer.com/tx/0xd185512614401c7b8b8d8577f967dc2d2a9c6f59c46328d1933b9e736b6c644b) |
| D1 | NOT FIXED: challenger wins | `decide` #1 | ACCEPTED | [0xeac79e2dab…](https://explorer-studio-dev.genlayer.com/tx/0xeac79e2dabe57409d6fc5d58dca0dae1e654e5c0958f3270720014df0b02cf38) |
| D1 | NOT FIXED: challenger wins | `decide` #1 | ACCEPTED | [0x1094a11a26…](https://explorer-studio-dev.genlayer.com/tx/0x1094a11a26c0926394c3e536c63546501037ceb80e29df8709c14fb9bad4765d) |
| D1 | NOT FIXED: challenger wins | `decide` #1 | ACCEPTED | [0xcaebb18cc6…](https://explorer-studio-dev.genlayer.com/tx/0xcaebb18cc6d5ba671104e755297b52fbe70c24bb52451e65110f84bf9b01e2c9) |
| D1 | NOT FIXED: challenger wins | `decide` #1 | ACCEPTED | [0x31a37e5955…](https://explorer-studio-dev.genlayer.com/tx/0x31a37e5955b573367d743120b2733f4ec0e0431e6401994c2236ff122018f21a) |
| D2 | FIXED: defender wins | `expire (missed window)` #3 | ACCEPTED | [0xb2d4c58bd9…](https://explorer-studio-dev.genlayer.com/tx/0xb2d4c58bd99e505e5ffe789aaaec1061eee8c6fea4f22ddb9614b71a12a149e5) |
| D2 | FIXED: defender wins | `file_check` | REFUSED RPC_UNREADABLE | [0xe96a2cc68c…](https://explorer-studio-dev.genlayer.com/tx/0xe96a2cc68c57d2a95ba0b6c1b15f1f911a4255edb68d87b847923e2f61f3be16) |
| D3 | INCONCLUSIVE: function not in that contract | `expire (missed window)` #4 | ACCEPTED | [0x2ec06e118e…](https://explorer-studio-dev.genlayer.com/tx/0x2ec06e118eda3f2ecb805169fd237b1826538ce0b9b5d0f3e258102050309c0c) |
| D1 | NOT FIXED: challenger wins | `expire (missed window)` #1 | ACCEPTED | [0xfc8e7a83c8…](https://explorer-studio-dev.genlayer.com/tx/0xfc8e7a83c81e463bdf965de2f74a909b1b4e91c4fbdb6e9049f4a2d4b839560d) |
| D1 | NOT FIXED: challenger wins | `file_check` | code says NOT_FIXED | [0x3878fdbb1a…](https://explorer-studio-dev.genlayer.com/tx/0x3878fdbb1ae201b3810d369d7e4945901a5f0397391e93fac74f45379444876b) |
| D1 | NOT FIXED: challenger wins | `counter_stake` #9 | ACCEPTED | [0x4848b9a20d…](https://explorer-studio-dev.genlayer.com/tx/0x4848b9a20d45d4d0701a15364255557d23a00a366cdc4fa1a4f3b9ffe9e10f08) |
| D1 | NOT FIXED: challenger wins | `decide` #9 | ACCEPTED | [0xa678e2860a…](https://explorer-studio-dev.genlayer.com/tx/0xa678e2860a765717ca2917549cee37f2368624b6475087fa2a73a56d0fd5329f) |
| D4 | FIXED, no defender: refund minus 2% fee | `file_check` | code says FIXED | [0xa09e069681…](https://explorer-studio-dev.genlayer.com/tx/0xa09e069681da5877b1280a41aec66895ad62d64b65dd5c835f0137eddabd87cf) |
| D4 | FIXED, no defender: refund minus 2% fee | `decide` #10 | ACCEPTED | [0xb025f47fad…](https://explorer-studio-dev.genlayer.com/tx/0xb025f47fad455946a402957c0c82b890bcd425ee6db15642610643d1936c8e04) |
| D8 | PREDATES AUDIT: refund | `file_check` | code says PREDATES_AUDIT | [0x7d6e802bc4…](https://explorer-studio-dev.genlayer.com/tx/0x7d6e802bc4d56a20b3cc0b154354285b164908a44dd3e7eff73e5e595dcf654c) |
| D8 | PREDATES AUDIT: refund | `counter_stake` #11 | ACCEPTED | [0x6a35aa7c5c…](https://explorer-studio-dev.genlayer.com/tx/0x6a35aa7c5c81b61b27530cb5a5f3e581ba62b3930a8a3e63811e99cb452f8e17) |
| D8 | PREDATES AUDIT: refund | `decide` #11 | ACCEPTED | [0xa8effbe3f2…](https://explorer-studio-dev.genlayer.com/tx/0xa8effbe3f2d7206ccfae10280a2316e156e2b95fe0933ffcd333fcaba859c451) |
| D9 | PREDATES FIX: refund | `file_check` | code says PREDATES_FIX | [0x4ea249d7b5…](https://explorer-studio-dev.genlayer.com/tx/0x4ea249d7b57687f80458b07cc93e083953d6c9efbbe7a7c2e7766776d9c847d3) |
| D9 | PREDATES FIX: refund | `counter_stake` #12 | ACCEPTED | [0xc18ef2fa5c…](https://explorer-studio-dev.genlayer.com/tx/0xc18ef2fa5cc716a0d5ab46754df8409af3e52777d76ff137610759ea88b47b2b) |
| D9 | PREDATES FIX: refund | `decide` #12 | ACCEPTED | [0x297f91b921…](https://explorer-studio-dev.genlayer.com/tx/0x297f91b921b1a404629a2addac7b1d81e5d39ea2ada4cb2a53f993fb8bed9da5) |
| D11 | FIXED on a real Mellow proxy | `file_check` | REFUSED RPC_UNREADABLE | [0x35a4e1666a…](https://explorer-studio-dev.genlayer.com/tx/0x35a4e1666a59219d87c20d70578139bcd9837c8e24351c3924fbd31cfd00087b) |
| D5 | expiry: everyone refunded | `file_check` | REFUSED RPC_UNREADABLE | [0x9f9621494e…](https://explorer-studio-dev.genlayer.com/tx/0x9f9621494e16d35d0c23a3af619d3b9912cad7cf97c0a0d0e875ecc57ee0f1c1) |
| R2a | regression re-file of a non-proxy: refused | `file_regression` (prior #10) | REFUSED NOT_A_PROXY | [0xf1bde4fd56…](https://explorer-studio-dev.genlayer.com/tx/0xf1bde4fd56fc278e0e1b4e9e70b4589a2412354b2264ad493910d7c554b902aa) |
| R2b | regression re-file of a NOT_FIXED check: refused | `file_regression` (prior #9) | REFUSED PRIOR_CHECK_NOT_FIXED | [0xa03fa6535b…](https://explorer-studio-dev.genlayer.com/tx/0xa03fa6535b5fa6092459334038202e4916af921b9b0f96407b5e25a0f24cf806) |
| S1 | close the scorecard: unchecked slots NOT_CHECKED | `close_scorecard` | ACCEPTED | [0xa4d82fce30…](https://explorer-studio-dev.genlayer.com/tx/0xa4d82fce3038f59facd14ec28ca2d17c0c3a1df3253202e988a4be028fb27e5b) |
| DRAIN | sweep and withdraw | `sweep_fees` | ACCEPTED | [0x8f13fbf05e…](https://explorer-studio-dev.genlayer.com/tx/0x8f13fbf05ec4e350ef197cf4272e7f9a4e4de4f986323e97bdcf0fd447deafca) |
| DRAIN | sweep and withdraw | `withdraw` | ACCEPTED | [0xb50baf645e…](https://explorer-studio-dev.genlayer.com/tx/0xb50baf645ea4f742938d4dfb772bd9161f9c79e24877aff0f7cdac98566998bb) |
| DRAIN | sweep and withdraw | `withdraw again` | reverted: nothing to withdraw for 0x062959bfd856d137f7d08ade3b7270205d68b380 | [0xfccc5152f9…](https://explorer-studio-dev.genlayer.com/tx/0xfccc5152f9b901827b6df13259822343425b9cfcb3804c15a521f25088e79f11) |
| DRAIN | sweep and withdraw | `withdraw` | ACCEPTED | [0xc48b82663d…](https://explorer-studio-dev.genlayer.com/tx/0xc48b82663d1ffbb570ac700ee63abcb84353585d06292788d0937d640cd39f49) |
| DRAIN | sweep and withdraw | `withdraw again` | reverted: nothing to withdraw for 0xef4cea1dc808e59af1d39ba97a989d258697e85e | [0x601865c306…](https://explorer-studio-dev.genlayer.com/tx/0x601865c30627cdb1aa820e7c0829aa2f1234db61d00ad8bf2ecff89c674880c8) |
| DRAIN | sweep and withdraw | `withdraw` | ACCEPTED | [0xa2a6ef6c80…](https://explorer-studio-dev.genlayer.com/tx/0xa2a6ef6c80e7421ea5cbb9f66bb58c94ea06f2b5eb53ddabe05b535d68664fb3) |
| DRAIN | sweep and withdraw | `withdraw again` | reverted: nothing to withdraw for 0x8bfb2761ba064d3f829f382f444867ee10294b1c | [0x4d992726fc…](https://explorer-studio-dev.genlayer.com/tx/0x4d992726fc4a3f77ce15601d0fb353867d3d0ac1a9865bfba452d1b832fbf964) |
| D11 | FIXED on a real Mellow proxy | `file_check` | code says FIXED | [0x06eae7d27c…](https://explorer-studio-dev.genlayer.com/tx/0x06eae7d27cd854095c4865a3a29b9814cefa57f12dd3f32299ca592b15c5f3dc) |
| D11 | FIXED on a real Mellow proxy | `decide` #13 | ACCEPTED | [0x638899cdc9…](https://explorer-studio-dev.genlayer.com/tx/0x638899cdc96cfaf30d7bd3ffc084db2d71c9451d965c9e13fbfb09f42f88703f) |
| D5 | expiry: everyone refunded | `file_check` | code says INCONCLUSIVE | [0x4ec8d13c0a…](https://explorer-studio-dev.genlayer.com/tx/0x4ec8d13c0a5e9dc6e1eeb328a6864f22de4d1778172f6d4e5aba8cf9491985a8) |
| R1 | regression re-file, proxy unchanged: refused | `file_regression` (prior #13) | REFUSED NO_UPGRADE_SINCE_CHECK | [0x17bd9d0759…](https://explorer-studio-dev.genlayer.com/tx/0x17bd9d075999e5caebc60d33e4036ce81a7184402b73c18e01b8d6e93c6f3ec8) |
| D5 | expiry: everyone refunded | `expire` #14 | ACCEPTED | [0xdca5369d1c…](https://explorer-studio-dev.genlayer.com/tx/0xdca5369d1c7b3da08aee2455efe364941c309dafec528e7047e57eae39b76090) |
| DRAIN | sweep and withdraw | `sweep_fees` | ACCEPTED | [0xdfe757af2c…](https://explorer-studio-dev.genlayer.com/tx/0xdfe757af2c4f979e68ee8406beb8ae265508b112b4c47b5ef46b51e3c4e2f8ec) |
| DRAIN | sweep and withdraw | `withdraw` | ACCEPTED | [0xb3700ce415…](https://explorer-studio-dev.genlayer.com/tx/0xb3700ce415377f204bc500f79a6ba3d20744322dd364edbdd9b592b7f524734f) |
| DRAIN | sweep and withdraw | `withdraw again` | reverted: nothing to withdraw for 0x062959bfd856d137f7d08ade3b7270205d68b380 | [0xd7832534a2…](https://explorer-studio-dev.genlayer.com/tx/0xd7832534a245e69cccb204f0ca5e007eb6a52d2f0896697ba10801066d7f8a52) |
| DRAIN | sweep and withdraw | `withdraw` | ACCEPTED | [0x878792e333…](https://explorer-studio-dev.genlayer.com/tx/0x878792e333e7869afcd53e211f8396c8da749d19abc702e6c7e7e80dbcc9dc03) |
| DRAIN | sweep and withdraw | `withdraw again` | reverted: nothing to withdraw for 0x8bfb2761ba064d3f829f382f444867ee10294b1c | [0x4648f5467d…](https://explorer-studio-dev.genlayer.com/tx/0x4648f5467daca5b42f8ae83bccb67c9fbba12fcd5b6aef8571673f076918a968) |

| # | Finding | Verdict | Basis | Payout |
|---|---|---|---|---|
| [1](https://fixcheck-ledger.vercel.app/demo/checks/1) | M-17 `_convertToShares` (ethereum) | EXPIRED (refunded) | EXPIRED | challenger 1 GEN, fee 0 GEN |
| [2](https://fixcheck-ledger.vercel.app/demo/checks/2) | M-5 `claimPrizes` (optimism) | EXPIRED (refunded) | EXPIRED | challenger 1 GEN, fee 0 GEN |
| [3](https://fixcheck-ledger.vercel.app/demo/checks/3) | M-9 `liquidatableBalanceOf` (optimism) | EXPIRED (refunded) | EXPIRED | challenger 1 GEN, fee 0 GEN |
| [4](https://fixcheck-ledger.vercel.app/demo/checks/4) | M-16 `maxDeposit` (arbitrum) | EXPIRED (refunded) | EXPIRED | challenger 1 GEN, fee 0 GEN |
| [5](https://fixcheck-ledger.vercel.app/demo/checks/5) | H-1 `checkSignatures` (ethereum) | FIXED | CODE_MATCH_FIX | challenger 0 GEN, fee 0 GEN |
| [6](https://fixcheck-ledger.vercel.app/demo/checks/6) | M-19 `claimPrize` (optimism) | INCONCLUSIVE | FUNCTION_MISSING | challenger 1 GEN, fee 0 GEN |
| [7](https://fixcheck-ledger.vercel.app/demo/checks/7) | M-5 `cancelDepositRequest` (ethereum) | FIXED | CODE_CONTAINS_FIX | challenger 0.98 GEN, fee 0.02 GEN |
| [8](https://fixcheck-ledger.vercel.app/demo/checks/8) | H-06 `_delegate` (optimism) | FIXED | CODE_MATCH_FIX | challenger 0.98 GEN, fee 0.02 GEN |
| [9](https://fixcheck-ledger.vercel.app/demo/checks/9) | M-17 `_convertToShares` (ethereum) | NOT_FIXED | CODE_MATCH_VULNERABLE | challenger 2 GEN, fee 0 GEN |
| [10](https://fixcheck-ledger.vercel.app/demo/checks/10) | M-5 `claimPrizes` (optimism) | FIXED | CODE_MATCH_FIX | challenger 0.98 GEN, fee 0.02 GEN |
| [11](https://fixcheck-ledger.vercel.app/demo/checks/11) | M-9 `liquidatableBalanceOf` (optimism) | PREDATES_AUDIT | DEPLOYED_BEFORE_AUDIT | challenger 1 GEN, fee 0 GEN |
| [12](https://fixcheck-ledger.vercel.app/demo/checks/12) | M-16 `maxDeposit` (arbitrum) | PREDATES_FIX | DEPLOYED_BEFORE_FIX | challenger 1 GEN, fee 0 GEN |
| [13](https://fixcheck-ledger.vercel.app/demo/checks/13) | H-5 `calculateFee` (ethereum) | FIXED | CODE_MATCH_FIX | challenger 0.98 GEN, fee 0.02 GEN |
| [14](https://fixcheck-ledger.vercel.app/demo/checks/14) | M-1 `liquidate` (ethereum) | EXPIRED (refunded) | EXPIRED | challenger 1 GEN, fee 0 GEN |

Demo ledger after the drain: balance 0 wei = open 0 + withdrawable 0 + fees 0 (invariant holds); withdrawn 28.6 GEN, fees swept 0.08 GEN. Raw: `docs/seed-demo.json`, `docs/seed-canonical.json`.
