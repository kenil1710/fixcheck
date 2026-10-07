# FixCheck

**The audit says it was fixed. Is the fix in the deployed code?**

Live: **https://fixcheck-ledger.vercel.app** · GenLayer Studio Dev · contracts in [`contracts/`](contracts/) · demo video: [`docs/demo/fixcheck-demo-voiced.mp4`](docs/demo/fixcheck-demo-voiced.mp4) ([vertical cut](docs/demo/fixcheck-demo-vertical.mp4))

![FixCheck finding page: audited vs deployed function](docs/screenshots/checks-5-1440-light.png)

## The problem

Public audit reports (Sherlock, Code4rena, Cantina…) end with a list of findings and a status: *Fixed*. Users read "audited, all fixed" and trust the protocol. Nobody checks whether the code that is actually deployed on chain contains each fix. Sometimes it doesn't: the fix was merged in the repository but the deployed contract was never replaced, or the contract was deployed before the audit and can't be upgraded.

FixCheck checks it, one finding at a time, using the real report, the real commits and the verified code running at the protocol's own listed address.

## What it found

The seeds are **22 checks of 21 findings**: 21 Sherlock findings marked fixed, with PoolTogether M-1 checked on two chains (OP Mainnet and Arbitrum). They cover PoolTogether V5, Mellow Flexible Vaults, Cap and the OP Stack fault proofs. Every check is listed in [`docs/SEEDS.md`](docs/SEEDS.md); how the data was chosen is in [`docs/RESEARCH.md`](docs/RESEARCH.md).

* **Fixed in deployed code** — the deployed function is the fix commit's, or holds the fix in place.
* **Not fixed** — the deployed function is still the audited version, on a deployment created *after* the audit: PoolTogether's Arbitrum vault (2024-05-29) and Ethereum vault (2024-08-19).
* **Predates audit** — six PoolTogether contracts (prize pool, vaults on OP Mainnet and Base, draw manager, RNG) still run the audited code, but they were deployed before the audited commit (2024-05-16) and are not upgradeable, so the fix could not have been applied there. FixCheck says so instead of calling them "not fixed".
* **Inconclusive** — code could not prove which function runs (partially verified source), or the model's answers did not point at the fix. Everyone is refunded; no verdict is invented.

These are code facts, not claims about exploitability or anyone's intent.

## How it works

1. **File.** A challenger stakes GEN on *not fixed* and names: a **pinned** report (GitHub raw at a commit SHA, or a web.archive.org snapshot), the finding id, the function, the audited source file at its commit, the **fix commit's** file (required), the chain, the deployed address, and a **pinned** docs page of the protocol that lists that address.
2. **Validators read everything themselves** and must agree on every field and on the sha256 of every immutable body. Code checks, before anything is stored:
   * the finding heads a section of the report with a fixed-status phrase and names the function;
   * the audited file is the finding's own audited commit (a code link in the finding's section, or in the same report) and the fix file is the head of the PR the finding links (or a commit it links);
   * the docs page lists the address, and the contract has a **full/exact** verified-source match;
   * a proxy is resolved through its EIP-1967 slot (cross-checked with the explorer) and only the implementation's code is judged;
   * the function is the one that actually runs: no override, library copy or same-name copy elsewhere in the bundle;
   * the audited commit's date and the deployment's creation time are recorded.

   Anything unpinned, unreadable or unlinked is refused, and the stake stays withdrawable.
3. **Counter-stake.** Until the counter deadline (1 hour on the canonical contract) anyone else may stake *fixed*.
4. **Decide** (anyone, after the deadline). Code decides first:
   * deployed == fix version → **FIXED** (`CODE_MATCH_FIX`)
   * deployed == audited version → **NOT FIXED** (`CODE_MATCH_VULNERABLE`), or **PREDATES AUDIT** (`DEPLOYED_BEFORE_AUDIT`) when the contract is not a proxy and was created before the audited commit
   * every fix hunk present as one block, in place, at the same nesting, and no removed line left → **FIXED** (`CODE_CONTAINS_FIX`)
   * function missing, overloaded, overridden, partially verified, or proxy unresolved → **INCONCLUSIVE**
   * otherwise the model only resolves what code can't: it is shown the finding, what the fix commit changed in this function, and the deployed function (comments removed, string literals blanked), and must quote deployed lines. Code accepts FIXED only if a quote is a line the fix **added** and no line the fix removed is still deployed; NOT FIXED only if a quote is a **removed** (vulnerable) line that is still deployed. It is asked twice; any disagreement, unsupported quote or error → **INCONCLUSIVE**.
5. **Pay out.** NOT FIXED: the challenger takes every defender stake. FIXED: defenders split the challenger's stake (no defender: challenger refunded minus a frozen 2% fee). INCONCLUSIVE or PREDATES AUDIT: everyone refunded. Payouts are credited and withdrawn (pull). If nobody decides before the decide deadline, anyone can `expire` and everyone is refunded.

### What the model is never allowed to decide

* which report, finding, commits or deployment are the evidence — code binds them to the finding;
* whether two functions are identical, or whether the fix is present in place — code compares them;
* whether a contract predates the audit, is a proxy, or is fully verified — code reads it on chain;
* anything from text inside comments or string literals — they are removed before it reads the code;
* a verdict on its own word — its quotes must be exact deployed lines that touch what the fix changed, and two answers must agree;
* deadlines, stakes, fees or payouts.

Ledger invariant, checked after every call in the tests and shown live on `/balance`:
`balance_wei == open_stakes_wei + claimable_wei + fees_wei`.

## How to use (5 steps)

1. Open **https://fixcheck-ledger.vercel.app/check** and connect a wallet; the app adds/switches to GenLayer Studio Dev (GEN there is free test currency).
2. Paste the pinned report link and the audited and fix source files — or click one of the real examples.
3. Enter the finding id and function, then the chain, the deployed address and the protocol's pinned docs page.
4. Review: the app runs the same checks the contract will and tells you what code will decide before you pay.
5. Stake and follow the transaction to the result card. After the counter-stake window anyone can press **Decide**; winnings and refunds land in **Balance** for you to withdraw.

## Contracts (Studio Dev, chain 61997)

| Contract | Address |
|---|---|
| FixCheck — canonical (1 h counter, 24 h decide) | `0x2d7b3C465D6478Db4438999b1FD0340A54256364` |
| FixCheck — demo (90 s counter, 300 s decide) | `0x78D31dbB13e8348A2278b64A84eBfE129607fd91` |
| FixRegistry — read-only consumer | `0x8E93Ab199E737CF022F5D4cE0f171d0e68815E49` |

Deployed from commit `0c20168e94b47e6f3d1ebf13638c7115137f9e10` with the bytes of `git show <commit>:<file>`; `node tools/verify_source.mjs` reads the code back from the chain and confirms all three are byte-identical to HEAD. sha256 and deploy transactions: [`ADDRESSES.md`](ADDRESSES.md). Explorer: https://explorer-studio-dev.genlayer.com/

Other apps read verdicts with `FixRegistry.fix_status(chain, address, "<pinned report url>#<finding id>")` (or `is_fixed` / `is_known_unfixed`; `is_known_unfixed` is false for PREDATES AUDIT) — free cross-contract views, no payable methods. Earlier versions are listed in [`docs/superseded/`](docs/superseded/).

## Seeds

All 22 real findings from Step 0, on the canonical contract (read from chain):

| # | Protocol | Finding | Function | Chain | Verdict | Basis | Model |
|---|---|---|---|---|---|---|---|
| [1](https://fixcheck-ledger.vercel.app/checks/1) | PoolTogether V5 | M-5 | `claimPrizes` | optimism | **FIXED** | CODE_MATCH_FIX | — |
| [2](https://fixcheck-ledger.vercel.app/checks/2) | PoolTogether V5 | M-8 | `_computeFeePerClaim` | base | **FIXED** | CODE_MATCH_FIX | — |
| [3](https://fixcheck-ledger.vercel.app/checks/3) | PoolTogether V5 | M-15 | `shutdownAt` | optimism | **PREDATES_AUDIT** | DEPLOYED_BEFORE_AUDIT | — |
| [4](https://fixcheck-ledger.vercel.app/checks/4) | PoolTogether V5 | M-9 | `liquidatableBalanceOf` | optimism | **PREDATES_AUDIT** | DEPLOYED_BEFORE_AUDIT | — |
| [5](https://fixcheck-ledger.vercel.app/checks/5) | PoolTogether V5 | M-16 | `maxDeposit` | arbitrum | **NOT_FIXED** | CODE_MATCH_VULNERABLE | — |
| [6](https://fixcheck-ledger.vercel.app/checks/6) | PoolTogether V5 | M-17 | `_convertToShares` | ethereum | **NOT_FIXED** | CODE_MATCH_VULNERABLE | — |
| [7](https://fixcheck-ledger.vercel.app/checks/7) | PoolTogether V5 | M-19 | `claimPrize` | base | **PREDATES_AUDIT** | DEPLOYED_BEFORE_AUDIT | — |
| [8](https://fixcheck-ledger.vercel.app/checks/8) | PoolTogether V5 | M-1 | `isRequestComplete` | optimism | **PREDATES_AUDIT** | DEPLOYED_BEFORE_AUDIT | — |
| [9](https://fixcheck-ledger.vercel.app/checks/9) | PoolTogether V5 | M-1 | `isRequestComplete` | arbitrum | **FIXED** | CODE_MATCH_FIX | — |
| [10](https://fixcheck-ledger.vercel.app/checks/10) | PoolTogether V5 | M-14 | `canStartDraw` | optimism | **PREDATES_AUDIT** | DEPLOYED_BEFORE_AUDIT | — |
| [11](https://fixcheck-ledger.vercel.app/checks/11) | PoolTogether V5 | H-3 | `startDrawReward` | optimism | **PREDATES_AUDIT** | DEPLOYED_BEFORE_AUDIT | — |
| [12](https://fixcheck-ledger.vercel.app/checks/12) | Mellow Flexible Vaults | H-1 | `checkSignatures` | ethereum | **FIXED** | CODE_MATCH_FIX | — |
| [13](https://fixcheck-ledger.vercel.app/checks/13) | Mellow Flexible Vaults | H-2 | `_handleReport` | ethereum | **INCONCLUSIVE** | MODEL_UNGROUNDED | UNGROUNDED|UNGROUNDED |
| [14](https://fixcheck-ledger.vercel.app/checks/14) | Mellow Flexible Vaults | H-3 | `callHook` | ethereum | **INCONCLUSIVE** | PARTIAL_MATCH | — |
| [15](https://fixcheck-ledger.vercel.app/checks/15) | Mellow Flexible Vaults | H-4 | `calculateFee` | ethereum | **INCONCLUSIVE** | MODEL_UNGROUNDED | UNGROUNDED|UNGROUNDED |
| [16](https://fixcheck-ledger.vercel.app/checks/16) | Mellow Flexible Vaults | H-5 | `calculateFee` | ethereum | **FIXED** | CODE_MATCH_FIX | — |
| [17](https://fixcheck-ledger.vercel.app/checks/17) | Mellow Flexible Vaults | M-1 | `updateChecks` | ethereum | **INCONCLUSIVE** | MODEL_UNGROUNDED | UNGROUNDED|UNGROUNDED |
| [18](https://fixcheck-ledger.vercel.app/checks/18) | Mellow Flexible Vaults | M-4 | `handleReport` | ethereum | **FIXED** | CODE_MATCH_FIX | — |
| [19](https://fixcheck-ledger.vercel.app/checks/19) | Mellow Flexible Vaults | M-5 | `cancelDepositRequest` | ethereum | **FIXED** | CODE_CONTAINS_FIX | — |
| [20](https://fixcheck-ledger.vercel.app/checks/20) | Cap | M-1 | `liquidate` | ethereum | **INCONCLUSIVE** | PARTIAL_MATCH | — |
| [21](https://fixcheck-ledger.vercel.app/checks/21) | Cap | M-3 | `realizeRestakerInterest` | ethereum | **INCONCLUSIVE** | PARTIAL_MATCH | — |
| [22](https://fixcheck-ledger.vercel.app/checks/22) | OP Stack fault proofs | M-3 | `create` | ethereum | **INCONCLUSIVE** | PARTIAL_MATCH | — |

Full table with links, stakes, dates and the demo paths: [`docs/SEEDS.md`](docs/SEEDS.md).

## Repository

| Path | What |
|---|---|
| `contracts/FixCheck.py` | the contract (GenVM v0.6 format) |
| `contracts/FixRegistry.py` | read-only consumer |
| `test/test_fixcheck.py`, `test/test_attacks.py` | offline suites on real fetched evidence — `python3 test/test_fixcheck.py && python3 test/test_attacks.py` |
| `tools/scan_writes.py` | static check: no state written before any revert |
| `test/deploy.mjs`, `test/seed_*.mjs` | HEAD-only deploy, resumable seeding |
| `tools/` | research pipeline, source verification, docs generators, screenshots, video |
| `frontend/` | Next.js app (Vercel Root Directory) |
| `docs/` | research, threat model, attack report, seeds, screenshots, demo video |

## Known limits

* **One function per finding.** A fix that lives in another function looks "changed"; the model can only confirm it by quoting the fix's added lines, otherwise the check is inconclusive.
* **Comments and whitespace are ignored; everything else counts.** A renamed variable, a reordered statement or an extra statement inside the fix's lines is a change; code then cannot decide FIXED by containment and the model must ground its answer.
* **Removal-only fixes** (the fix only deletes lines) cannot be confirmed FIXED by the model — there is no added line to quote — so such checks end inconclusive unless code matches exactly.
* **"Not fixed" is a code fact, not an exploit claim.** Exploitability depends on configuration.
* **Explorer trust.** Verified source comes from one public service per chain (Blockscout for Ethereum and OP Mainnet, Sourcify for Base, Arbitrum and Polygon); only full/exact matches are judged. Creation dates and proxy slots come from one public RPC per chain.
* **Sherlock-shaped reports.** Binding expects GitHub code and PR links in the report, as Sherlock judging reports have; other report formats must link the audited commit and the fix the same way, or the filing is refused.
* **Studio Dev.** This runs on a development network; windows are short so the canonical deployment can be seeded and decided in a day, and value transfers are queued by the network.
