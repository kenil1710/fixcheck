# Attack pass on the v2 code

Scope: only what v2 adds — whole-report scorecards (`import_report`, `file_slot`, `close_scorecard`), Code4rena as a second auditor (`c4_status`, `enumerate_findings`), the regression watch (`file_regression`, REGRESSED, `tools/patrol.mjs`), the consumers (`FixStatus`, `FixGate`), and the v2 views. The v1 filing pipeline was attacked in four earlier passes ([1](ATTACK_REPORT.md), [2](ATTACK_REPORT_R2.md), [3](ATTACK_REPORT_R3.md), [4](ATTACK_REPORT_R4.md)) and is not re-litigated here.

Method: the attacker's view of every new input (the pinned report's text, who may write which part of it, the docs URL, the choice of deployment, the order of calls), written as failing tests first in [`test/test_attacks_v2.py`](../test/test_attacks_v2.py) and run against commit `9158a42` (v2 before this pass). Then fixed in `725200c`; every test passes since.

## Result on `9158a42` (before the fixes)

```
$ python3 test/test_attacks_v2.py
ERROR: test_paged (AV2_L1_ProtocolScorecardsPaged)
TypeError: FixCheck.get_protocol_scorecards() takes 2 positional arguments but 4 were given
ERROR: test_forged_block_on_an_acknowledged_finding_does_not_block_the_import (AV2_M2_ReadmeAuthorLines)
stub._UserError: FINDING_STATUS_AMBIGUOUS
FAIL: test_report_imported_under_an_unrelated_protocol_is_refused (AV2_H1_ScorecardUnderAnyProtocol)
AssertionError: _UserError not raised
FAIL: test_a_junk_deployment_does_not_block_the_real_one (AV2_M1_SlotSquatting)
AssertionError: Tuples differ: ('REFUSED', None) != ('OK', 'FIXED')
FAIL: test_the_same_deployment_cannot_be_filed_twice_into_a_slot (AV2_M1_SlotSquatting)
AssertionError: 'SLOT_ALREADY_FILED_AS_CHECK_1' != 'DEPLOYMENT_ALREADY_IN_SLOT'
FAIL: test_status_not_on_the_issue_page_is_not_marked_fixed (AV2_M2_ReadmeAuthorLines)
AssertionError: 14 != 13
FAIL: test_planted_heading_and_row_in_a_finding_body (AV2_M3_PlantedC4Table)
AssertionError: 'FIXED_MARKED' == 'FIXED_MARKED'
Ran 10 tests
FAILED (failures=5, errors=2)
```

## Findings

| # | Severity | Issue | Test | Fix (commit `725200c` unless noted) |
|---|---|---|---|---|
| H1 | High | **A scorecard could be opened for a report under a protocol it never names.** `import_report()` bound the scorecard to `protocol_key(docs_url)`, and the docs URL was the importer's choice. Anyone could publish "PoolTogether's Sherlock report: 14 marked fixed, 0 checked" under their own GitHub account, or under another protocol's docs, and the auditor and protocol views would count it. | `AV2_H1_ScorecardUnderAnyProtocol` | The report must name the protocol: at least one fix link the auditor wrote for a finding it marks fixed (Sherlock status block; Code4rena Individual PRs row) must be in the docs owner's GitHub account (`fix_owners`), else `PROTOCOL_NOT_IN_REPORT`. |
| M1 | Medium | **One junk filing occupied a slot for good.** A slot accepted one check, and the first filer picked the deployment. A deployment the docs list but where the function is missing decides INCONCLUSIVE, the stake comes back in full, and the honest deployment could never be filed into the scorecard. For a refunded 0.1 GEN per finding, a whole report could be turned into INCONCLUSIVE + NOT_CHECKED. | `AV2_M1_SlotSquatting` | Any deployment can be filed into a slot, each once (`DEPLOYMENT_ALREADY_IN_SLOT`); every check is counted; the slot lists all of them (`get_slot_checks`, paged). Junk can add an INCONCLUSIVE row; it can no longer hide the real one. |
| M2 | Medium | **README author lines decided which findings were "marked fixed".** `enumerate_findings()` read FIXED_MARKED from the README's `**sherlock-admin2**` lines — text a participant can type into their own comment, which round 4 stopped trusting for filings. On an acknowledged finding it made the finding "fixed and acknowledged" and refused the whole import (any participant could block a report's scorecard); on an unmarked one it inflated "marked fixed". | `AV2_M2_ReadmeAuthorLines` | Every finding the README marks fixed is confirmed on GitHub's issue page (author login `sherlock-admin*`, a User, writing a fixed phrase), as for a filing. Not confirmed → its README block is ignored (class UNMARKED or ACKNOWLEDGED). An unreadable issue page refuses the import (nothing written). |
| M3 | Medium | **A planted Code4rena table could mark a finding fixed.** `c4_status()` read every table under a heading named "Mitigation Review Summary" / "Individual PRs", wherever it was. A warden controls the text of their own finding: a planted heading plus a row for their finding (and a status line) was the only row for it. | `AV2_M3_PlantedC4Table` | Rows are counted per table: every table under such a heading must name the finding exactly once, all agreeing, or the finding is AMBIGUOUS (import and filing refused). A planted table does not name the real findings and the real tables do not name a planted row, so a plant can only make a report unreadable, never mark a finding fixed. |
| L1 | Low | `get_protocol_scorecards(protocol)` returned at most 100 cards with no total and no way to read the rest. | `AV2_L1_ProtocolScorecardsPaged` | Paged (`offset`, `limit`) with `total`. |

Checked and found sound (tests kept as regressions):

* **Regression chain** (`AV2_L2_RegressionNeedsTheLatestFixed`): after a regression check decides FIXED, the watch continues from it; the original check can no longer be re-filed (`PRIOR_CHECK_NOT_LATEST`), and re-filing the new one without a further upgrade is `NO_UPGRADE_SINCE_CHECK`.
* **REGRESSED cannot be produced by the model**: only an exact canonical match of the deployed function with the audited version, on a check whose prior is FIXED (`V2_05_Regression`).
* **Consumers**: FixStatus answers from FixCheck's storage on every call; FixGate fails closed when FixStatus is unreachable and has no payable method, owner or setter (`V2_06_Consumers`).
* **Ledger**: `file_slot` and `file_regression` bank the value first and never raise (a refusal leaves it withdrawable); `import_report` and `close_scorecard` raise before their first write (`tools/scan_writes.py`: all 10 write methods PASS).

## Found while deploying (not by the attack tests)

| # | Severity | Issue | Test | Fix |
|---|---|---|---|---|
| D1 | Medium | **Studio Dev's receipt limit.** The canonical filing of PoolTogether M-8 on Base ended UNDETERMINED with `out_of receipt nondet_output` (tx `0xc670f723…cb9db`, on a superseded deployment): the leader's result was 17,655 bytes. The same evidence was accepted by v1 on 2026-10-09, so the network's limit changed. Nothing was written, but the filing could never succeed. | `V2_07_ReceiptLimit` | `6a4dd04`: the finding section kept is capped at 5,000 chars, import titles at 100, and any result over 14,500 bytes is refused deterministically (`EVIDENCE_TOO_LARGE`, stake withdrawable). All 28 planned filings measured live: largest 12,325 bytes. |
| D2 | Low | `file_slot` only accepted the scorecard's own docs page, but PoolTogether lists each chain's addresses on its own page of the same docs repository, so slots could not take Arbitrum/Base/Ethereum deployments. | `V2_03…test_slot_takes_any_docs_page_of_the_protocol_and_no_other` | `4cf0bc4`: `file_slot` takes any pinned docs page whose protocol key equals the scorecard's. |

## Residual (accepted, with why)

* **A participant can make a report un-importable** (a planted Code4rena table, or a `# Issue X-N:` heading typed inside a Sherlock finding body). The rules turn every such plant into a refusal, never a false "fixed"; reading markdown that participants partly author cannot do better without a second source the auditor signs, which neither auditor publishes.
* **The filer chooses the deployment and function for a slot.** Code verifies every rule, but which deployment a finding applies to is not stated in either auditor's report, so it cannot be derived by code. Every finding marked fixed but never checked is counted (NOT_CHECKED), so leaving findings out is visible.

## After the fixes

```
$ python3 test/test_attacks_v2.py
Ran 10 tests
OK
$ python3 -m unittest discover -s test -p "test_*.py"
Ran 303 tests
OK
```
