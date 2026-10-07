# Step 0 — Research and probe

**Question.** A public audit report says a finding was *Fixed*. Is the fix in the
code that is actually deployed on chain?

Everything below was measured, not assumed. Raw outputs live next to this file in
`docs/research/` (probe results, the candidate list, the full comparison as JSON).
The comparison was produced by `tools/research_compare.py`, which uses
**the exact extractor the contract runs** (`tools/solfn.py`; the offline suite
asserts the block is byte-identical to the one in `contracts/FixCheck.py`).

## 1. What GenVM can read (probe on studio-dev)

A throwaway contract (`contracts/_probe.py`, deployed at
`0x072997342f9d026970696E6f0a3Eaa3D87DeEdaE`, tx
`0xe79905b5480f80ef018bb7e033ef64d2bdd39f2a86a9f3b8660d005abe2ab314`) fetched each URL with
`gl.nondet.web.get` from inside GenVM. Result (`docs/research/probe_1.json`):

| Source | From GenVM | Notes |
|---|---|---|
| Blockscout v2 `eth.blockscout.com/api/v2/smart-contracts/…` | **200 JSON** | 25 KB for an Aave proxy |
| Blockscout OP Mainnet (`optimism.blockscout.com` → `explorer.optimism.io`) | **200 JSON** | 501 KB for PoolTogether's PrizePool (all 40 source files) |
| Blockscout `base.` / `arbitrum.` / `polygon.blockscout.com` | **403** | Cloudflare "Just a moment…" challenge, same as from a laptop |
| Sourcify v2 `sourcify.dev/server/v2/contract/{chainId}/{addr}?fields=sources` | **200 JSON** | works for every chain id |
| GitHub raw at a commit SHA | **200** | docs pages and Solidity files |
| Sherlock judging README (GitHub raw) | **200** | 241 KB |
| Code4rena report page | **200** | 4.4 MB HTML; usable through a web.archive.org snapshot |
| web.archive.org snapshot (`/web/<14 digits>id_/…`) | **200** | archive.org also answers **429** under load — a filing then refuses (the stake stays withdrawable) |
| `gl.nondet.exec_prompt` | answers | used only for the model path (§6) |

Bodies are byte-stable: three fetches of the same Blockscout and Sourcify URLs
produced identical sha256, so **strict sha256 equality between validators is viable**.

**Decision (frozen in the contract):** one verified-source endpoint per chain —
Blockscout for `ethereum` and `optimism`, Sourcify v2 for `base`, `arbitrum`,
`polygon`. Two validators can never read two different explorers.

## 2. Where real "Fixed" findings come from

Sherlock publishes every contest's judged findings as a markdown README in a
public repo (`sherlock-audit/<contest>-judging`). After the fix review, each
fixed finding carries the sentence **"The protocol team fixed this issue in the
following PRs/commits:"** followed by the PR links, and the finding's code
snippets link to the **audited commit** in the contest repo. That makes it the
ideal pinned report: GitHub raw at a commit SHA, a stable status phrase, a
public audited commit and a public fix PR.

* 229 Sherlock judging repos downloaded (`tools/sherlock_extract.py`).
* **835** findings carry the "fixed" phrase; **272** also have both a fix PR and
  audited-commit snippet links.
* Kept: protocols whose **official docs list deployed addresses** in a pinnable
  form (a docs repo on GitHub at a SHA): PoolTogether V5 (`GenerationSoftware/pt-dev-docs`),
  Mellow Flexible Vaults (`mellow-finance/docs`), Cap (`cap-labs-dev/cap-docs`) and the
  OP Stack (`ethereum-optimism/superchain-registry`).
* For every fix PR, the function it changed was found by comparing the merge
  commit with its first parent (`tools/changed_fns.py`), so the named function
  is the one the fix actually touched — and the contract additionally requires
  that the function name **appears in the finding's own text**.

Code4rena and Cantina reports are supported by the contract through
web.archive.org snapshots, but the seeded set is Sherlock-only because its
reports, audited commits and fix PRs are all GitHub-native and pinnable.

## 3. The seeded findings (22)

These are **22 checks of 21 findings**: PoolTogether M-1 is checked on two
chains. Each row: report pinned at a SHA, finding id, function, audited commit
(Sherlock contest repo, linked by the report), fix commit (the head commit of
the fix PR the finding links — for every seed its function body is identical
to the PR's merge commit), deployed address
from the protocol's pinned docs page, verified on Blockscout/Sourcify.
Proxies are followed one hop to the implementation the explorer names.

| # | Protocol | Finding | Function | Chain | Deployed address | Audited commit | Fix commit | Offline result |
|---|---|---|---|---|---|---|---|---|
| 1 | PoolTogether V5 | M-5 | `claimPrizes` | optimism | `0x220C9398b0Ee07472bF8906e44574Cb9FE3B8D90` | [sherlock-audit@1aa1b8c](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether/1aa1b8c028b659585e4c7a6b9b652fb075f86db3/pt-v5-claimer/src/Claimer.sol) | [GenerationSoftware/pt-v5-claimer@0651d14](https://raw.githubusercontent.com/GenerationSoftware/pt-v5-claimer/0651d1457d34b51d02ab0f535edc7a3ca72b176f/src/Claimer.sol) | IDENTICAL_TO_FIX |
| 2 | PoolTogether V5 | M-8 | `_computeFeePerClaim` | base | `0xcdCE635b774DE77cdF791647601dba64a75547ba` | [sherlock-audit@1aa1b8c](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether/1aa1b8c028b659585e4c7a6b9b652fb075f86db3/pt-v5-claimer/src/Claimer.sol) | [GenerationSoftware/pt-v5-claimer@21a9ed6](https://raw.githubusercontent.com/GenerationSoftware/pt-v5-claimer/21a9ed64437a9bf6780e6c47b2509c8bc0ea9b09/src/Claimer.sol) | IDENTICAL_TO_FIX |
| 3 | PoolTogether V5 | M-15 | `shutdownAt` | optimism | `0xF35fE10ffd0a9672d0095c435fd8767A7fe29B55` | [sherlock-audit@1aa1b8c](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether/1aa1b8c028b659585e4c7a6b9b652fb075f86db3/pt-v5-prize-pool/src/PrizePool.sol) | [GenerationSoftware/pt-v5-prize-pool@6d57310](https://raw.githubusercontent.com/GenerationSoftware/pt-v5-prize-pool/6d57310ac572086a3cda88d0a80712d20a2150f7/src/PrizePool.sol) | IDENTICAL_TO_VULNERABLE |
| 4 | PoolTogether V5 | M-9 | `liquidatableBalanceOf` | optimism | `0xa52e38a9147f5eA9E0c5547376c21c9E3F3e5e1f` | [sherlock-audit@1aa1b8c](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether/1aa1b8c028b659585e4c7a6b9b652fb075f86db3/pt-v5-vault/src/PrizeVault.sol) | [GenerationSoftware/pt-v5-vault@c33bfa6](https://raw.githubusercontent.com/GenerationSoftware/pt-v5-vault/c33bfa6befc8a9be683b52e101582d79ebef0dc9/src/PrizeVault.sol) | IDENTICAL_TO_VULNERABLE |
| 5 | PoolTogether V5 | M-16 | `maxDeposit` | arbitrum | `0x97A9C02CFBBf0332D8172331461aB476dF1E8c95` | [sherlock-audit@1aa1b8c](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether/1aa1b8c028b659585e4c7a6b9b652fb075f86db3/pt-v5-vault/src/PrizeVault.sol) | [GenerationSoftware/pt-v5-vault@60be8fc](https://raw.githubusercontent.com/GenerationSoftware/pt-v5-vault/60be8fc2d5bbf1606e920ca49bb8100337a1ee2d/src/PrizeVault.sol) | IDENTICAL_TO_VULNERABLE |
| 6 | PoolTogether V5 | M-17 | `_convertToShares` | ethereum | `0x9eE31E845fF1358Bf6B1F914d3918c6223c75573` | [sherlock-audit@1aa1b8c](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether/1aa1b8c028b659585e4c7a6b9b652fb075f86db3/pt-v5-vault/src/PrizeVault.sol) | [GenerationSoftware/pt-v5-vault@a812f89](https://raw.githubusercontent.com/GenerationSoftware/pt-v5-vault/a812f8957e4563b0bcaa01ed8c2ac767b2f3e996/src/PrizeVault.sol) | IDENTICAL_TO_VULNERABLE |
| 7 | PoolTogether V5 | M-19 | `claimPrize` | base | `0x6B5a5c55E9dD4bb502Ce25bBfbaA49b69cf7E4dd` | [sherlock-audit@1aa1b8c](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether/1aa1b8c028b659585e4c7a6b9b652fb075f86db3/pt-v5-vault/src/abstract/Claimable.sol) | [GenerationSoftware/pt-v5-vault@e328b31](https://raw.githubusercontent.com/GenerationSoftware/pt-v5-vault/e328b319b66a341ea45d7aa565095888f2008294/src/abstract/Claimable.sol) | IDENTICAL_TO_VULNERABLE |
| 8 | PoolTogether V5 | M-1 | `isRequestComplete` | optimism | `0x3d2Ef6C091f7CB69f06Ec3117F36A28BC596aa7B` | [sherlock-audit@1aa1b8c](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether/1aa1b8c028b659585e4c7a6b9b652fb075f86db3/pt-v5-rng-witnet/src/RngWitnet.sol) | [GenerationSoftware/pt-v5-rng-witnet@2ddd97f](https://raw.githubusercontent.com/GenerationSoftware/pt-v5-rng-witnet/2ddd97f1554374149594d633952422dd282d2588/src/RngWitnet.sol) | IDENTICAL_TO_VULNERABLE |
| 9 | PoolTogether V5 | M-1 | `isRequestComplete` | arbitrum | `0xad1b8ec0151f13ba563226092b5f7308d8dc107b` | [sherlock-audit@1aa1b8c](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether/1aa1b8c028b659585e4c7a6b9b652fb075f86db3/pt-v5-rng-witnet/src/RngWitnet.sol) | [GenerationSoftware/pt-v5-rng-witnet@2ddd97f](https://raw.githubusercontent.com/GenerationSoftware/pt-v5-rng-witnet/2ddd97f1554374149594d633952422dd282d2588/src/RngWitnet.sol) | IDENTICAL_TO_FIX |
| 10 | PoolTogether V5 | M-14 | `canStartDraw` | optimism | `0x7eED7444dE862c4F79c5820ff867FA3A82641857` | [sherlock-audit@1aa1b8c](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether/1aa1b8c028b659585e4c7a6b9b652fb075f86db3/pt-v5-draw-manager/src/DrawManager.sol) | [GenerationSoftware/pt-v5-draw-manager@b55a44c](https://raw.githubusercontent.com/GenerationSoftware/pt-v5-draw-manager/b55a44c7ec40a28570cf677fcd3fdf19c41a295a/src/DrawManager.sol) | IDENTICAL_TO_VULNERABLE |
| 11 | PoolTogether V5 | H-3 | `startDrawReward` | optimism | `0x7eED7444dE862c4F79c5820ff867FA3A82641857` | [sherlock-audit@1aa1b8c](https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether/1aa1b8c028b659585e4c7a6b9b652fb075f86db3/pt-v5-draw-manager/src/DrawManager.sol) | [GenerationSoftware/pt-v5-draw-manager@35f505f](https://raw.githubusercontent.com/GenerationSoftware/pt-v5-draw-manager/35f505f44d967ead5975a8cf7efc2696bc22d02b/src/DrawManager.sol) | IDENTICAL_TO_VULNERABLE |
| 12 | Mellow Flexible Vaults | H-1 | `checkSignatures` | ethereum | `0x0000000167598d2C78E2313fD5328E16bD9A0b13` | [sherlock-audit@eca8836](https://raw.githubusercontent.com/sherlock-audit/2025-07-mellow-flexible-vaults/eca8836d68d65bcbfc52c6f04cf6b4b1597555bf/flexible-vaults/src/permissions/Consensus.sol) | [mellow-finance/flexible-vaults@de69983](https://raw.githubusercontent.com/mellow-finance/flexible-vaults/de69983271bf4f1a0b748eadc588f401d74a43bd/src/permissions/Consensus.sol) | IDENTICAL_TO_FIX |
| 13 | Mellow Flexible Vaults | H-2 | `_handleReport` | ethereum | `0x000000000c139266BA06170Ed1DeacA6d11903c1` | [sherlock-audit@eca8836](https://raw.githubusercontent.com/sherlock-audit/2025-07-mellow-flexible-vaults/eca8836d68d65bcbfc52c6f04cf6b4b1597555bf/flexible-vaults/src/queues/RedeemQueue.sol) | [mellow-finance/flexible-vaults@8ff3ad4](https://raw.githubusercontent.com/mellow-finance/flexible-vaults/8ff3ad438f055a6b6427fe6f139fefced9049a58/src/queues/RedeemQueue.sol) | CHANGED |
| 14 | Mellow Flexible Vaults | H-3 | `callHook` | ethereum | `0x0000000637f1b1ccDA4Af2dB6CDDf5e5Ec45fd93` | [sherlock-audit@eca8836](https://raw.githubusercontent.com/sherlock-audit/2025-07-mellow-flexible-vaults/eca8836d68d65bcbfc52c6f04cf6b4b1597555bf/flexible-vaults/src/hooks/BasicRedeemHook.sol) | [mellow-finance/flexible-vaults@8e3703f](https://raw.githubusercontent.com/mellow-finance/flexible-vaults/8e3703ff3871f5829b6df8bae8b26282cf14eb2a/src/hooks/BasicRedeemHook.sol) | CHANGED |
| 15 | Mellow Flexible Vaults | H-4 | `calculateFee` | ethereum | `0x0000000dE74e5D51651326E0A3e1ACA94bEAF6E1` | [sherlock-audit@eca8836](https://raw.githubusercontent.com/sherlock-audit/2025-07-mellow-flexible-vaults/eca8836d68d65bcbfc52c6f04cf6b4b1597555bf/flexible-vaults/src/managers/FeeManager.sol) | [mellow-finance/flexible-vaults@db595fa](https://raw.githubusercontent.com/mellow-finance/flexible-vaults/db595fab94c2792e5c981867726b8981466ead6b/src/managers/FeeManager.sol) | CHANGED |
| 16 | Mellow Flexible Vaults | H-5 | `calculateFee` | ethereum | `0x0000000dE74e5D51651326E0A3e1ACA94bEAF6E1` | [sherlock-audit@eca8836](https://raw.githubusercontent.com/sherlock-audit/2025-07-mellow-flexible-vaults/eca8836d68d65bcbfc52c6f04cf6b4b1597555bf/flexible-vaults/src/managers/FeeManager.sol) | [mellow-finance/flexible-vaults@e181487](https://raw.githubusercontent.com/mellow-finance/flexible-vaults/e181487a3db3358203beb219f5ffcc6744ba84ab/src/managers/FeeManager.sol) | IDENTICAL_TO_FIX |
| 17 | Mellow Flexible Vaults | M-1 | `updateChecks` | ethereum | `0x0000000E8eb7173fA1a3ba60eCA325bcB6aaf378` | [sherlock-audit@eca8836](https://raw.githubusercontent.com/sherlock-audit/2025-07-mellow-flexible-vaults/eca8836d68d65bcbfc52c6f04cf6b4b1597555bf/flexible-vaults/src/managers/ShareManager.sol) | [mellow-finance/flexible-vaults@09ed3db](https://raw.githubusercontent.com/mellow-finance/flexible-vaults/09ed3dbc45db5a8918919a68c53792716b3adc6e/src/managers/ShareManager.sol) | CHANGED |
| 18 | Mellow Flexible Vaults | M-4 | `handleReport` | ethereum | `0x0000000615B2771511dAa693aC07BE5622869E01` | [sherlock-audit@eca8836](https://raw.githubusercontent.com/sherlock-audit/2025-07-mellow-flexible-vaults/eca8836d68d65bcbfc52c6f04cf6b4b1597555bf/flexible-vaults/src/modules/ShareModule.sol) | [mellow-finance/flexible-vaults@b828fae](https://raw.githubusercontent.com/mellow-finance/flexible-vaults/b828fae29317c071449fdccaf8954ea84201465f/src/modules/ShareModule.sol) | IDENTICAL_TO_FIX |
| 19 | Mellow Flexible Vaults | M-5 | `cancelDepositRequest` | ethereum | `0x00000006dA9f179BFE250Dd1c51cD2d3581930c8` | [sherlock-audit@eca8836](https://raw.githubusercontent.com/sherlock-audit/2025-07-mellow-flexible-vaults/eca8836d68d65bcbfc52c6f04cf6b4b1597555bf/flexible-vaults/src/queues/DepositQueue.sol) | [mellow-finance/flexible-vaults@18871f5](https://raw.githubusercontent.com/mellow-finance/flexible-vaults/18871f519e8600f0e0ff3298011d13b0409be8aa/src/queues/DepositQueue.sol) | CHANGED |
| 20 | Cap | M-1 | `liquidate` | ethereum | `0x15622c3dbbc5614E6DFa9446603c1779647f01FC` → impl `0x68c4F03b8640C0393a832987147BaE7A0b27aaa7` | [sherlock-audit@2bd34fa](https://raw.githubusercontent.com/sherlock-audit/2025-07-cap/2bd34fa369d36af8ecc377090d3292ea74ccc669/cap-contracts/contracts/lendingPool/libraries/LiquidationLogic.sol) | [cap-labs-dev/cap-contracts@80ea01e](https://raw.githubusercontent.com/cap-labs-dev/cap-contracts/80ea01e47e7e063fd6d607823ca38ec7e2ff147a/contracts/lendingPool/libraries/LiquidationLogic.sol) | CHANGED |
| 21 | Cap | M-3 | `realizeRestakerInterest` | ethereum | `0x15622c3dbbc5614E6DFa9446603c1779647f01FC` → impl `0x68c4F03b8640C0393a832987147BaE7A0b27aaa7` | [sherlock-audit@2bd34fa](https://raw.githubusercontent.com/sherlock-audit/2025-07-cap/2bd34fa369d36af8ecc377090d3292ea74ccc669/cap-contracts/contracts/lendingPool/libraries/BorrowLogic.sol) | [cap-labs-dev/cap-contracts@1655cf6](https://raw.githubusercontent.com/cap-labs-dev/cap-contracts/1655cf6c58c258fab8a148c41c5e777d8de38b9e/contracts/lendingPool/libraries/BorrowLogic.sol) | IDENTICAL_TO_FIX |
| 22 | OP Stack fault proofs | M-3 | `create` | ethereum | `0xe5965Ab5962eDc7477C8520243A95517CD252fA9` → impl `0x72B971717E088B59F26d4236BE222ADB6ACD393b` | [sherlock-audit@f216b0d](https://raw.githubusercontent.com/sherlock-audit/2024-02-optimism-2024/f216b0d3ad08c1a0ead557ea74691aaefd5fd489/optimism/packages/contracts-bedrock/src/dispute/DisputeGameFactory.sol) | [ethereum-optimism/optimism@909d996](https://raw.githubusercontent.com/ethereum-optimism/optimism/909d996a6bb73989346d592ddd3a5138c7cc4b77/packages/contracts-bedrock/src/dispute/DisputeGameFactory.sol) | CHANGED |

Seeded set: **7 identical to the fix, 8 identical to the audited (vulnerable)
version, 7 changed** (decided by the model, §6).

## 4. Offline comparison — every finding × every chain

64 (finding, deployment) pairs were compared, including the same PoolTogether
finding on four chains:

* **43 identical to the audited, pre-fix function**
* **13 identical to the fix commit**
* **7 changed** (neither) → the model path
* **1 inconclusive** (Cap M-2: `VaultAdapter.sol` is not among the Oracle
  implementation's verified sources — the library lives in another contract)

| Protocol | Finding | Function | ethereum | optimism | base | arbitrum |
|---|---|---|---|---|---|---|
| PoolTogether V5 | H-1 | `isWinner` | =VULNERABLE | =VULNERABLE | =VULNERABLE | =VULNERABLE |
| PoolTogether V5 | H-1 | `getTierAccrualDurationInDraws` | =VULNERABLE | =VULNERABLE | =VULNERABLE | =VULNERABLE |
| PoolTogether V5 | M-15 | `shutdownAt` | =VULNERABLE | =VULNERABLE | =VULNERABLE | =VULNERABLE |
| PoolTogether V5 | M-5 | `claimPrizes` | =FIX | =FIX | =FIX | =FIX |
| PoolTogether V5 | M-8 | `_computeFeePerClaim` | =FIX | =FIX | =FIX | =FIX |
| PoolTogether V5 | M-9 | `liquidatableBalanceOf` | =VULNERABLE | =VULNERABLE | =VULNERABLE | =VULNERABLE |
| PoolTogether V5 | M-16 | `maxDeposit` | =VULNERABLE | =VULNERABLE | =VULNERABLE | =VULNERABLE |
| PoolTogether V5 | M-17 | `_convertToShares` | =VULNERABLE | =VULNERABLE | =VULNERABLE | =VULNERABLE |
| PoolTogether V5 | M-19 | `claimPrize` | =VULNERABLE | =VULNERABLE | =VULNERABLE | =VULNERABLE |
| PoolTogether V5 | M-1 | `isRequestComplete` | =VULNERABLE | =VULNERABLE | =VULNERABLE | =FIX |
| PoolTogether V5 | M-14 | `canStartDraw` | =VULNERABLE | =VULNERABLE | =VULNERABLE | =VULNERABLE |
| PoolTogether V5 | H-3 | `startDrawReward` | =VULNERABLE | =VULNERABLE | =VULNERABLE | =VULNERABLE |
| PoolTogether V5 | H-3 | `finishDrawReward` | =VULNERABLE | =VULNERABLE | =VULNERABLE | =VULNERABLE |
| Mellow Flexible Vaults | H-1 | `checkSignatures` | =FIX |  |  |  |
| Mellow Flexible Vaults | H-2 | `_handleReport` | CHANGED |  |  |  |
| Mellow Flexible Vaults | H-3 | `callHook` | CHANGED |  |  |  |
| Mellow Flexible Vaults | H-4 | `calculateFee` | CHANGED |  |  |  |
| Mellow Flexible Vaults | H-5 | `calculateFee` | =FIX |  |  |  |
| Mellow Flexible Vaults | M-1 | `updateChecks` | CHANGED |  |  |  |
| Mellow Flexible Vaults | M-4 | `handleReport` | =FIX |  |  |  |
| Mellow Flexible Vaults | M-5 | `cancelDepositRequest` | CHANGED |  |  |  |
| Cap | M-1 | `liquidate` | CHANGED |  |  |  |
| Cap | M-2 | `_applySlopes` | ?FILE_NOT_FOUND |  |  |  |
| Cap | M-3 | `realizeRestakerInterest` | =FIX |  |  |  |
| OP Stack fault proofs | M-3 | `create` | CHANGED |  |  |  |

(`=FIX`: the deployed canonical function equals the fix commit's; `=VULNERABLE`:
equals the audited commit's. The two PoolTogether H-1 rows are *not* seeded:
the fix touched `isWinner` / `getTierAccrualDurationInDraws`, which the finding
text does not name, so the contract refuses that filing.)

## 5. "Fixed" in the report, not in the deployed code — PoolTogether V5

This is the one protocol where the report's "Fixed" and the deployed code
disagree. The facts, each reproducible from public data:

1. **Sherlock contest:** May 2024 (`sherlock-audit/2024-05-pooltogether`, audited
   commit `1aa1b8c`). The judging README marks the findings below as fixed and
   links the fix PRs; those PRs were merged **2024-06-28 → 2024-07-12**
   (e.g. `pt-v5-vault#114` merged 2024-06-28, `pt-v5-draw-manager#15` and
   `pt-v5-rng-witnet#8` merged 2024-07-08).
2. **OP Mainnet contracts listed in the docs** (`pt-dev-docs@9f3322e`,
   `docs/deployments/optimism.md`): PrizePool `0xF35fE10f…9B55`, POOL Prize Vault
   `0xa52e38a9…5e1f`, RngWitnet `0x3d2Ef6C0…aa7B` and DrawManager `0x7eED7444…1857`
   were all created on **2024-04-18** (creation txs `0x1b2027d0…`, `0x7d85707d…`,
   `0x648a2454…`, `0x678d7fe0…`) — **before** the contest. Their verified source
   matches the audited commit exactly (canonical form) for `shutdownAt` (M-15),
   `liquidatableBalanceOf` (M-9), `maxDeposit` (M-16), `_convertToShares` (M-17),
   `claimPrize` (M-19), `isRequestComplete` (M-1), `canStartDraw` (M-14) and
   `startDrawReward` / `finishDrawReward` (H-3).
3. **The Claimer was redeployed** on 2024-07-16 (OP `0x220C9398…8D90`, Base
   `0xcdCE635b…47ba`) and **does** contain the fixes (M-5, M-8: identical to the
   fix commits). The fixes reached the contracts that were deployed again.
4. **Base and Arbitrum:** the POOL Prize Vaults (created 2024-05-15 and
   2024-05-29) match the audited version. Arbitrum's RngWitnet
   (`0xad1b8ec0…107b`, created 2024-05-29) is the one RngWitnet that matches the
   **fix** for M-1.
5. **Ethereum POOL Prize Vault** `0x9eE31E84…5573` was created on **2024-08-19**,
   *after* the vault fixes were merged, by PrizeVaultFactory `0x29c10210…A75f`
   (itself created the same day). Its verified source
   (`lib/pt-v5-vault/src/PrizeVault.sol`) still matches the **audited** version of
   `liquidatableBalanceOf`, `maxDeposit`, `_convertToShares` and `claimPrize`.

**How FixCheck classifies them.** The contract binds each deployment's
creation time and the audited commit's date (2024-05-16) at filing. Six of
these deployments (OP prize pool, vault, RNG, draw manager — and the Base vault,
created 2024-05-15) predate the audited commit and are not upgradeable:
FixCheck decides them **PREDATES_AUDIT** ("deployed code matches the pre-audit
version; the contract was deployed before the audit and can't be upgraded, so
the fix could not be applied here"), not NOT_FIXED. Only the Arbitrum vault
(2024-05-29) and the Ethereum vault (2024-08-19), deployed after the audit, are
NOT_FIXED. (The Arbitrum RngWitnet, created 2024-05-29, already equals fix
commit `e44b23c`, merged 2024-07-08: the change existed in the repository
before that PR was merged.)

**What this does and does not show.** It shows that, for these functions, the
code running at the addresses PoolTogether's own docs list is the code the
audit reviewed, not the code the fix PRs produced. PoolTogether V5's core
contracts are immutable (no proxy), so a fix can only reach users through a new
deployment, and most of these contracts predate the audit. It does **not** show
that any finding is exploitable in the deployed configuration (some depend on a
specific chain or parameter), and it says nothing about anyone's intent.
FixCheck reports a code fact: *deployed function == audited function*.

The other three protocols show the opposite pattern: Mellow's and Cap's
deployed implementations (Sept 2025 – Jan 2026) contain the fixes or later
rewrites of the same functions, and the OP Stack's `DisputeGameFactory.create`
has been rewritten since the audit (implementation deployed May 2026).

## 6. The model path, measured

For a "changed" function code first tries to see the fix in place
(`CODE_CONTAINS_FIX`: every block the fix added, with its context, contiguous,
in order and at the same nesting, and no removed line left). Only when it
can't does the model answer — twice, from GenVM — and code then checks its
evidence: a FIXED must quote a line the fix ADDED with no removed line still
deployed; a NOT_FIXED must quote a removed (vulnerable) line that is still
deployed. Comments are removed and string literals blanked before the model
reads the code or a quote is matched.

Measured on studio-dev with the exact prompt the contract builds:

* Mellow H-2 `_handleReport` and M-1 `updateChecks` (smoke deployment): both
  answers were set aside as ungrounded — H-2's fix only removes a line (there
  is no added line to quote) and `updateChecks` ships a refactored form of the
  fix's line — so both end INCONCLUSIVE and everyone is refunded, instead of
  an unsupported verdict either way.
* The two model answers agreeing is not taken as evidence on its own: an
  earlier deployment's model gave the same wrong answer twice (see
  `docs/superseded/HISTORY.md`), which is why the grounding rules above exist.

On-chain double-run results for every seeded case that reaches the model are in
`docs/SEEDS.md`.

## 7. Limits of this research

* One function per finding. A fix that lives in a *different* function than the
  one the finding names will look "changed" and go to the model, which is told
  to answer INCONCLUSIVE when the function alone cannot show it.
* The canonical comparison removes comments and whitespace only. A semantically
  identical rewrite (a renamed local variable) is "changed" and goes to the model.
* Sourcify / Blockscout availability is an external dependency; an unreadable
  source refuses the filing (the stake stays withdrawable) and never produces a
  verdict.
