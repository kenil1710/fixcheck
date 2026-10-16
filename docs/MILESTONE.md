# FixCheck v2 milestone

## BASE proof

BASE = `27f30c059707f982771a6548f7e337a71ec85ed9` (the commit the accepted submission was reviewed at: the resubmission compare ended there; the contracts were deployed from `8519168` and the steward reply `50466cc` changes docs only). `contracts/` is identical at `8519168`, `27f30c0` and `50466cc`.

`node tools/base_proof.mjs` reads each v1 address back with `gen_getContractCode` and compares it byte for byte with `git show 27f30c0:<file>`:

| Contract | Address | File | sha256 on chain | sha256 at BASE | Result |
|---|---|---|---|---|---|
| FixCheck (canonical) | `0x263C6a42B98E9133CF85A00A436b05C3573B88fe` | contracts/FixCheck.py | `bea3960114625bbb53e6d7313dcc6a63aa8bcf67469067916f56f58db9ce31a0` | `bea3960114625bbb53e6d7313dcc6a63aa8bcf67469067916f56f58db9ce31a0` | byte-identical |
| FixCheck (demo) | `0x19bc7Cb16Ce1B4F328f33d0FDfeA61297dA04f68` | contracts/FixCheck.py | `bea3960114625bbb53e6d7313dcc6a63aa8bcf67469067916f56f58db9ce31a0` | `bea3960114625bbb53e6d7313dcc6a63aa8bcf67469067916f56f58db9ce31a0` | byte-identical |
| FixRegistry | `0xA37F98977f023D8C0bd17aCF1A7983E5d328d9A4` | contracts/FixRegistry.py | `6d99a876d5dadfd4bc4f9e6864dd2ade203af9a49839d100adb793cb7b97330a` | `6d99a876d5dadfd4bc4f9e6864dd2ade203af9a49839d100adb793cb7b97330a` | byte-identical |

FixCheck sha256 `bea3960114625bbb53e6d7313dcc6a63aa8bcf67469067916f56f58db9ce31a0` (both addresses); FixRegistry sha256 `6d99a876d5dadfd4bc4f9e6864dd2ade203af9a49839d100adb793cb7b97330a`. The v1 deployment is left untouched and is listed in [`docs/superseded/README.md`](superseded/README.md).

## Compare

**https://github.com/kenil1710/fixcheck/compare/27f30c059707f982771a6548f7e337a71ec85ed9...e5ec21c0fb6d61a112637b062558216588ba5a9f**

`git diff --shortstat 27f30c0 e5ec21c`: 87 files changed, 12684 insertions(+), 2099 deletions(-)

## What changed: v1 -> v2

Every "v1 at BASE" cell is checked against the code at `27f30c0` by `tools/milestone.py` (a "did not exist" cell asserts the named functions/constants are absent at BASE). Code links are pinned at FINAL `e5ec21c`; live proofs are Studio Dev transactions.

| Area | v1 at BASE | v2 at FINAL | Pinned code at FINAL | Test file + name | Live proof |
|---|---|---|---|---|---|
| Auditor sources | Sherlock only: `report_source_ok` accepts `sherlock-audit/*-judging` (+ captures) — 0 mentions of Code4rena in the contract | Sherlock + Code4rena (`report.md` in `code-423n4/*-findings`, at a commit on a branch of that repo); C4 status and fix PR only from its mitigation review, one consistent row per table | [FixCheck.py#L2129](https://github.com/kenil1710/fixcheck/blob/e5ec21c0fb6d61a112637b062558216588ba5a9f/contracts/FixCheck.py#L2129), [FixCheck.py#L2036](https://github.com/kenil1710/fixcheck/blob/e5ec21c0fb6d61a112637b062558216588ba5a9f/contracts/FixCheck.py#L2036) | test_v2.py `V2_04_Code4rena.test_c4_real_filing_fixed_by_code`, `V2_01…test_code4rena_pooltogether_all_36`; test_attacks_v2.py `AV2_M3_PlantedC4Table` | [0x4eae0478…](https://explorer-studio-dev.genlayer.com/tx/0x4eae04782b81e99110982b0abdae9a93b71ce75da3a64fa36d9e40cc95952cbb) import, [0xa27848a2…](https://explorer-studio-dev.genlayer.com/tx/0xa27848a24d004e3dbe2e5bbd80d638b07dffca276063749ec7c18f17c2699f89) H-06 filed |
| Whole-report scorecards | did not exist | `import_report` enumerates every finding + class by code; slots for every finding marked fixed; `file_slot` (any deployment, each once); `close_scorecard` counts NOT_CHECKED; stored per-verdict counters | [FixCheck.py#L3896](https://github.com/kenil1710/fixcheck/blob/e5ec21c0fb6d61a112637b062558216588ba5a9f/contracts/FixCheck.py#L3896), [FixCheck.py#L2267](https://github.com/kenil1710/fixcheck/blob/e5ec21c0fb6d61a112637b062558216588ba5a9f/contracts/FixCheck.py#L2267) | test_v2.py `V2_03_ScorecardLifecycle.test_pooltogether_scorecard`, `V2_01_EveryFindingEnumerated` | [0x0905629f…](https://explorer-studio-dev.genlayer.com/tx/0x0905629f75a64cdac1721948b31d0f5e9c5b6222cfbc38c91700a89b4b3c61d3) import, [0x61e448a1…](https://explorer-studio-dev.genlayer.com/tx/0x61e448a179f41149756017217d45b39d615170c626c989ca52ad683f9fdb6bb7) close |
| Partial imports refused | did not exist | missing / duplicate / out-of-sequence id, C4 count ≠ C4's own header, ambiguous status, >80 findings, or no fix link in the docs owner's account → the whole import is refused | [FixCheck.py#L2291](https://github.com/kenil1710/fixcheck/blob/e5ec21c0fb6d61a112637b062558216588ba5a9f/contracts/FixCheck.py#L2291) | test_v2.py `V2_02_PartialImportsRefused` (12 tests), test_attacks_v2.py `AV2_H1_ScorecardUnderAnyProtocol` | [0x9a95a1f6…](https://explorer-studio-dev.genlayer.com/tx/0x9a95a1f6d96a98a6caf636a6c41074bbb5f8d0d7ac6c0ec1f28fbc1b22b82c91) (reverts, nothing written) |
| Regression watch / REGRESSED | did not exist | `file_regression` re-files a latest-FIXED proxy check after an upgrade; audited code deployed again → REGRESSED by code; paid like NOT_FIXED | [FixCheck.py#L4034](https://github.com/kenil1710/fixcheck/blob/e5ec21c0fb6d61a112637b062558216588ba5a9f/contracts/FixCheck.py#L4034), [FixCheck.py#L4299](https://github.com/kenil1710/fixcheck/blob/e5ec21c0fb6d61a112637b062558216588ba5a9f/contracts/FixCheck.py#L4299) | test_v2.py `V2_05_Regression.test_audited_code_deployed_again_is_regressed` (+4) | [0x17bd9d07…](https://explorer-studio-dev.genlayer.com/tx/0x17bd9d075999e5caebc60d33e4036ce81a7184402b73c18e01b8d6e93c6f3ec8) live re-file on the Mellow proxy (no upgrade → refused) |
| Patrol bot on a schedule | did not exist | watches every latest-FIXED proxy (slot from both RPCs + Upgraded logs), re-files, decides/expires its own filings, closes scorecards; GitHub Actions every 30 min | [patrol.mjs#L61](https://github.com/kenil1710/fixcheck/blob/e5ec21c0fb6d61a112637b062558216588ba5a9f/tools/patrol.mjs#L61), [patrol.yml#L8](https://github.com/kenil1710/fixcheck/blob/e5ec21c0fb6d61a112637b062558216588ba5a9f/.github/workflows/patrol.yml#L8) | —  (script; dry run and CI runs) | [Actions runs](https://github.com/kenil1710/fixcheck/actions/workflows/patrol.yml) |
| Consumer contract | FixRegistry: `fix_status`, `is_fixed(chain, address, finding)`, `is_known_unfixed`; no protocol score | FixStatus: `is_fixed(finding_id, chain, address)`, `status`, `is_unsafe`, `protocol_score(protocol)` | [FixStatus.py#L65](https://github.com/kenil1710/fixcheck/blob/e5ec21c0fb6d61a112637b062558216588ba5a9f/contracts/FixStatus.py#L65), [FixStatus.py#L79](https://github.com/kenil1710/fixcheck/blob/e5ec21c0fb6d61a112637b062558216588ba5a9f/contracts/FixStatus.py#L79) | test_v2.py `V2_06_Consumers.test_is_fixed_and_the_gate` | [FixStatus](https://explorer-studio-dev.genlayer.com/address/0xFA0A5592FbE13B8b74b8f4bc8a5abf6568420B98) |
| Consumer demo (refuses unsafe) | did not exist | FixGate.interact: REFUSED for NOT_FIXED / REGRESSED / unreachable, ALLOWED otherwise; outcomes stored | [FixGate.py#L29](https://github.com/kenil1710/fixcheck/blob/e5ec21c0fb6d61a112637b062558216588ba5a9f/contracts/FixGate.py#L29) | test_v2.py `V2_06_Consumers.test_gate_refuses_regressed`, `…test_gate_fails_closed_when_fixstatus_is_unreachable` | [0xa1767a07…](https://explorer-studio-dev.genlayer.com/tx/0xa1767a07ccadb2fa6628ae98732537b23896d5cf43fa0521273cd5a2305441e9) refused, [0x22a04d8c…](https://explorer-studio-dev.genlayer.com/tx/0x22a04d8cfb59d4d6b183fe2fb765562c6527aea9a878dda17ee5fff80ce851f2) allowed |
| Counts per auditor | did not exist | stored counters per auditor, per scorecard, per protocol (`get_auditors`, `get_scorecard`, `protocol_score`) | [FixCheck.py#L4642](https://github.com/kenil1710/fixcheck/blob/e5ec21c0fb6d61a112637b062558216588ba5a9f/contracts/FixCheck.py#L4642) | test_v2.py `V2_03…test_pooltogether_scorecard` (auditor counts), FINAL_CHECK B5/V1 | [/auditors](https://fixcheck-ledger.vercel.app/auditors) |
| Public API + badge | did not exist (preview, rpc only) | `/api/fixcheck` and `/badge/<protocol>.svg`, read from chain on every request (no cache) | [api/fixcheck/route.ts#L21](https://github.com/kenil1710/fixcheck/blob/e5ec21c0fb6d61a112637b062558216588ba5a9f/frontend/src/app/api/fixcheck/route.ts#L21), [badge route.ts#L26](https://github.com/kenil1710/fixcheck/blob/e5ec21c0fb6d61a112637b062558216588ba5a9f/frontend/src/app/badge/%5Bprotocol%5D/route.ts#L26) | FINAL_CHECK V3 (API and badge equal the contract) | [/badge/pooltogether.svg](https://fixcheck-ledger.vercel.app/badge/pooltogether.svg) |
| Transaction lifecycle in the app | signing → sent → validators → final (shown at ACCEPTED) | signing → submitted → validators → accepted → confirmed by re-reading contract state → finalized | [tx.ts#L76](https://github.com/kenil1710/fixcheck/blob/e5ec21c0fb6d61a112637b062558216588ba5a9f/frontend/src/lib/tx.ts#L76) | —  (UI) | [/import](https://fixcheck-ledger.vercel.app/import) |
| Studio receipt limit | did not exist | results over 14,500 bytes refused (`EVIDENCE_TOO_LARGE`), section capped at 5,000 chars | [FixCheck.py#L3305](https://github.com/kenil1710/fixcheck/blob/e5ec21c0fb6d61a112637b062558216588ba5a9f/contracts/FixCheck.py#L3305) | test_v2.py `V2_07_ReceiptLimit` (3 tests) | [0x76a4fbde…](https://explorer-studio-dev.genlayer.com/tx/0x76a4fbdee500092647b2d0e804f049d65e7900c44c5dfe41b0e337283f59efaa) PoolTogether M-8 on Base accepted |

## Tests: before -> after

`python3 -m unittest discover -s test -p "test_*.py"`: **254 -> 303** (+49), 0 failures.

* Added: `test/test_v2.py` (39 tests) and `test/test_attacks_v2.py` (10 tests).
* Removed: **none**.
* Changed: one v1 test, `S02_ReportAllowlist.test_other_authors_and_hosts_are_refused_before_any_fetch`. Its list of refused report URLs contained `code-423n4/2024-01-x-findings/<sha>/report.md`; v2 accepts Code4rena's `report.md` by design, so that entry now reads `.../README.md` (a Code4rena URL that is not `report.md` in a `-findings` repo is still refused before any fetch). Every other v1 test is unchanged and passes.

## Deployment, seeds and proofs

See [`ADDRESSES.md`](../ADDRESSES.md) (v2 addresses, sha256, deploy txs), [`SEEDS.md`](SEEDS.md) (every check and scorecard, before/after for the 22 v1 checks, demo paths with tx hashes), [`ATTACK_REPORT_V2.md`](ATTACK_REPORT_V2.md) and [`FINAL_CHECK.md`](FINAL_CHECK.md).

Every link in this document was fetched by `tools/milestone.py`: 32 links, 32 answered HTTP 200.
