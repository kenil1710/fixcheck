# Attack report, round 2: FixCheck at commit 0c20168 (since superseded)

Scope: the code at commit 0c20168 only (`git diff 655d61e..0c20168 -- contracts/`: `FixCheck.py`, `FixRegistry.py`), measured against the fixes listed in `docs/ATTACK_REPORT.md` and the results in `docs/FINAL_CHECK.md`. Nothing in `contracts/` or `frontend/` was changed. Nothing was written to studio-dev. The on-chain totals come from FINAL_CHECK B5 (2026-10-07T08:23Z); the live site was read again during this pass.

Every finding has a failing offline test in `test/test_attacks_r2.py` (`python3 test/test_attacks_r2.py` gives 14 failures, each for the reason in its docstring). The existing suites still pass: `test_fixcheck.py` 109 OK and `test_attacks.py` 12 OK, so 121 OK.

Some facts come from outside the fixtures. Each was read once during this pass:

* **Commit and PR dates** (GitHub API).
  * pt-v5-vault `60be8fc` (head of PR #113, M-16): committed 2024-06-21T16:58:31Z; the PR was merged 2024-06-28 (merge commit `2acdde5`).
  * `a812f89` (head of PR #112, M-17): committed 2024-06-21T01:03:19Z; the PR was merged 2024-06-28.
  * `c33bfa6` (PR #114): committed 2024-06-22.
  * `e328b31` (PR #115): committed 2024-06-28.
* **Arbitrum vault creation** (Sourcify): block 216345371 (2024-05-29).
* **GitHub raw** serves the same 241218 bytes for `README.md`, `README%2Emd`, `%52EADME.md` and `sherlock%2Daudit/…`.
* **The Wayback Machine** answers `/web/20991231235959/https://docs.sherlock.xyz/` with a 302 to the 2026-09-05 capture.

## Findings

| # | Severity | Finding | Test | Fix |
|---|---|---|---|---|
| 1 | High | **Live check #5 is an unfair NOT_FIXED.** The Arbitrum vault was created 2024-05-29. Its fix commit `60be8fc` was written on 2024-06-21 and merged on 2024-06-28. The vault could not contain a fix that did not exist yet. PREDATES only compares the creation time with the *audited* commit's date (2024-05-16), so the vault is decided NOT_FIXED / CODE_MATCH_VULNERABLE, and a NOT_FIXED pays the challenger every defender's stake. The landing specimen and both videos show this vault as the example of "not fixed", with "the line written by fix commit 60be8fc is not there". That is the same wording round 1 objected to for the OP vault. Check #6 (Ethereum vault, created 2024-08-19 by a factory deployed that day; fix `a812f89` from 2024-06-21, merged 2024-06-28) was deployed after its fix, so its NOT_FIXED is fair. The correct totals are 7 FIXED / 1 NOT_FIXED / 7 predates / 7 INCONCLUSIVE. | `R2_01_DeployedBeforeTheFixIsNotNotFixed` | Snapshot the fix commit's date at filing (its `.atom` feed, as for the audited commit). Decide `PREDATES_FIX` (refund everyone) when a non-proxy has deployed == audited and `created_at <` the fix commit date. Keep PREDATES_AUDIT for creation before the audited commit. Show both dates. |
| 2 | High | **The report itself is not bound to anyone.** Any `raw.githubusercontent.com/<any owner>/…@sha` file or any archived page on any host is accepted as "the report", for example a look-alike firm host on web.archive.org. Fix 1 then binds the audited and fix files to links that the challenger wrote. In the test, the challenger's own report links the **fixed** Claimer commit as "audited" and the contest's vulnerable commit as the "fix". The deployed Claimer equals the real fix, yet it is decided NOT_FIXED / CODE_MATCH_VULNERABLE by code, scored under PoolTogether (the protocol comes from the real docs URL), with firm `github:attacker`. This is round-1 finding 1 again, one level up. | `R2_02_ReportFromAnyAuthor` | Freeze an allowlist of report sources in the contract: GitHub owners (`sherlock-audit`, `code-423n4`, …) and archive target hosts. Refuse anything else. Until then, cap anything outside the list at INCONCLUSIVE. |
| 3 | High | **CODE_CONTAINS_FIX can match a hunk that is not on the live path.** Hunks are searched anywhere after the previous hunk, depth is measured *relative to the hunk*, and a fix that only adds lines has no removed line left to catch. Two cases give FIXED / CODE_CONTAINS_FIX with no model involved: (a) the whole hunk, context lines included, copied into `if (1 == 2) { … }` and followed by the original unguarded lines; (b) an early `if (a > 0) { transfer; return; }` placed before the guarded block. | `R2_03_HunkMatchedOffTheLivePath` (2) | Match the full fix function as an in-order subsequence at the **absolute** depth the fix uses. Refuse when the deployed function has any extra line that the fix does not have (in particular a `return`, `revert` or a branch) before the last hunk. Otherwise send the case to the model. |
| 4 | Medium | **The judged file is never tied to the compiled contract.** Take a proxy that keeps its implementation outside the EIP-1967 slot: an unresolved beacon, a custom slot, or a Safe-style proxy using slot 0. It reads as "not a proxy" (empty slot, no explorer link). If its verified bundle also carries `PrizeVault.sol`, that file is judged, even though the verified contract is `CustomProxy`, which has no relation to PrizeVault. Because `implementation` is empty, a proxy created before the audit becomes **PREDATES_AUDIT** whatever it runs today. The same gap covers stale copies and decoys in any bundle. | `R2_04_JudgedFileIsNotTheCompiledContract` | Read the compiled contract's name (Blockscout `name` / `file_path`, Sourcify `compilation.fullyQualifiedName`). Require the holder of the extracted function to be that contract or one of its ancestors. Otherwise return FUNCTION_NOT_IN_COMPILED_CONTRACT, which ends INCONCLUSIVE. |
| 5 | Medium | **An import alias hides an override.** With `import {PrizeVault as Base}` and `contract MyVault is Base { function withdraw(...) override { <audited body> } }`, the inheritance graph contains `Base`, which no contract declares. `_derives` therefore fails, and code decides CODE_MATCH_FIX from the base file, which is not the code that runs. | `R2_05_OverrideThroughImportAlias` | Resolve `import {X as Y}` (and `import "f" as F` / `F.X`) aliases into the graph. When a parent name cannot be resolved to a declaration in the bundle, return FUNCTION_OVERRIDDEN. |
| 6 | Medium | **The override rule covers only the named function.** A typical fix adds a call to an internal virtual helper (`_checkBalance(a);`). If a derived contract overrides that helper with an empty body, the named function is identical to the fix, so the result is CODE_MATCH_FIX while the check that actually runs does nothing. | `R2_06_FixHelperOverridden` | Apply the same running-implementation rule (override, library or copy gives OVERRIDDEN) to every identifier that the fix's added lines call. |
| 7 | Medium | **A moved line grounds FIXED on the vulnerable order.** A checks-effects-interactions fix only *moves* a line. The diff therefore lists that line as both removed and added, `_vulnerable_lines()` is empty, and any quote of the moved line grounds FIXED, even though the vulnerable version contains the same line. Deployed code that still transfers before it writes the balance, plus one unrelated edit, goes to the model, and two FIXED answers are accepted. The finding prose is not blanked and includes the protocol team's own replies, so nothing in code stops the model from being steered. | `R2_07_MovedLineGroundsFixed` | Ground FIXED only on an added line that does **not** occur in the audited function. For a fix made only of moved lines, require the fix's relative order of those lines in the deployed function. If neither holds, the result is INCONCLUSIVE. |
| 8 | Medium | **A far-future Wayback timestamp is accepted as a pin.** `archive_pin` accepts any 14 digits. The Wayback Machine redirects a timestamp that is not an exact capture to the *closest* capture, so `20991231235959` always means "latest" (checked: 302 to the 2026-09-05 capture). A report or docs "pin" can then change with every new capture, and leader and validators can read different bodies. Whether the GenVM fetch follows the 302 is not documented. If it does not, these URLs are simply refused; either way, a URL that is not a pin passes the pin check. | `R2_08_ArchivePinCanFloat` | Accept only a timestamp that is not later than the filing time. Use the `id_` form, and require the response to be a 200 with no redirect. Better: require the timestamp of an exact capture, by checking that the final URL equals the requested one. |
| 9 | Medium | **A fix link in anyone's comment counts.** `fix_links` scans the whole section, which includes the discussion. The real M-16 section has comments by infect3d, nevillehuang and 10xhash besides the sherlock-admin status block. Anyone can open a PR on a public repo, and its `.patch` is served whether or not the PR was merged. A participant's comment that links their own PR therefore makes that PR's head an accepted fix file. If the head is made equal to a deployed function that differs from both the audited version and the real fix, the result is CODE_MATCH_FIX. | `R2_12_FixLinkInAnyonesComment` | Read fix links only from the block that follows the matched status phrase, up to the next author line. |
| 10 | Low | **URL normalisation, two ways.** (a) Percent-encoding is kept, so `README.md` and `README%2Emd` (the same bytes from GitHub) produce two keys, and one finding can be open twice. (b) The query of an archived target is dropped, so two different archived reports (`?id=1`, `?id=2`) collapse into one key and one fetched URL without the query. | `R2_09_UrlSpellings` (2) | Refuse `%` in GitHub raw paths, or decode unreserved characters. Keep the query inside an archived target URL, since it is part of the archived document's identity. |
| 11 | Low | **The EIP-1967 slot is read at `"latest"`.** The leader and each validator read it at different moments. An upgrade that lands between those reads makes the filing round UNDETERMINED (it is retried). This cannot produce a wrong verdict, because all parties must agree on one value, but the read is not pinned. The creation lookups are immutable facts and are fine. | `R2_10_SlotReadAtLatest` | Have the leader name a block number. Validators accept it only if it is at or below their own head minus a margin, and read the slot at that block. |
| 12 | Low | **`canon()` turns two programs into one.** `a + ++b` and `a++ + b` are both valid Solidity and give different results, but both canonicalise to `a+++b`. Deployed code with one spelling and a fix with the other is decided CODE_MATCH_FIX. | `R2_11_CanonJoinsOperators` | Keep one space between two operator characters when joining them would change how they tokenise (`+ +`, `- -`, `+ ++`, …). |

## Fix 3: is the narrowing safe?

**Mostly yes.** At run time, Solidity executes the most-derived override in the deployed contract's linearisation. A same-name function in a contract that ours *calls*, or in an entry point that calls our library, does not run in its place. Ignoring those functions is correct, and it is what keeps the vault (`PrizePool.claimPrize`) and Cap (`Lender.liquidate`) checks decidable.

The narrowing is unsafe in three places, each of which has a test:

* **The graph is matched by literal name.** Import aliases escape it (finding 5). Two contracts with the same name in different files are also merged: the first file in sorted order sets the parents.
* **Only the named function is checked.** Helpers that the fix calls are not (finding 6).
* **"Ours" is never tied to the compiled contract** (finding 4).

These cases are caught, each confirmed by a quick run during this pass:

* a library, including one attached with `using for`;
* a free function;
* an override with different parameter types in a derived contract (treated as overridden, which is conservative);
* a `super` chain;
* a two-hop derivation;
* a same-name decoy contract.

A `fallback`/`delegatecall` path is finding 4.

## What held up

* **Audited-commit binding on the real reports.** The six REPORT-bound findings cannot be given another contest's commit or another repo's commit. The needle includes `owner/repo/blob/<sha>/`. In all three seeded reports, every blob link to a contest repo carries the contest SHA (PoolTogether 67 links, all `1aa1b8c`; Mellow 12; Cap 17). The other blob links (witnet, solmate, Sherlock docs) share no basename with a seeded file. What remains is that the *report* is unbound (finding 2).
* **Fix PRs on the real reports.** Only two sections link two PRs in the same repo (H-3: draw-manager #17 and #18; M-8: claimer #33 and #34), and both pairs are the team's own fix PRs. No real report has a heading naming a finding id other than `# Issue <id>:`, so a fake heading needs control of the report (finding 2).
* **PREDATES and proxies.** An EIP-1967 proxy is never PREDATES, because `implementation` is non-empty. A proxy created before the audit and upgraded after it is judged on its implementation. EIP-1167 clones, beacons and EIP-1822 proxies that the explorer names, but whose 1967 slot is empty, end PROXY_UNRESOLVED and so INCONCLUSIVE. Redeploying at the same address is not possible for contracts created after Dencun (March 2024). A factory/CREATE2 contract's creation time is its own creation transaction, which is correct. A vault spawned *after* the fix by a pre-fix factory is NOT_FIXED. That is defensible: the protocol kept deploying unfixed code. Check #6 is that case.
* **Quote matching.** Unicode look-alikes (Cyrillic `і`), doubled inner spaces and quotes that carry string text all fail to match, so the answer is INVALID and the result INCONCLUSIVE.
* **Fences.** `_defang` can rebuild `<<<` from pieces (for example `<<` + `>>>` + `<`), but never the nonce. A forged fence needs the nonce, which depends on the report's own sha256, so it cannot be written into the report.
* **Determinism of the other new reads.** The creation tx and its timestamp, Sourcify's deployment block, the block timestamp over RPC, the commit feed's first `<updated>` and the PR `.patch` head are all immutable. A transient failure on one side makes the round UNDETERMINED and it is retried. None of them can leave a check stuck: `expire` is permissionless.
* **Consistency (item 9).** These sources all say 7 FIXED / 2 NOT_FIXED / 6 PREDATES_AUDIT / 7 INCONCLUSIVE (22 checks of 21 findings):
  * chain (FINAL_CHECK B5);
  * the live site (`/`, read during this pass);
  * README;
  * `docs/SEEDS.md`;
  * `docs/demo/script.md`;
  * the voiced cut, both spoken (SRT: "7 fixed, 2 not fixed, and 6 deployed before the audit") and on screen (frame at 12 s shows 7 / 2 / 6 / 7; frame at 85 s shows PoolTogether "Predates audit 6", "Not fixed 2", "Fixed 3");
  * the vertical cut (frame at 30 s shows the same filters; it speaks only "two vaults … are not fixed").

  The figures agree everywhere. Finding 1 means one of the two "not fixed" is wrong in all of them.


---

# Fix summary — round 2

All twelve findings are fixed. The contracts were redeployed from commit `7efb699928b20cdd580b534a58609da1c1defe08` and all 22 checks re-seeded. Evidence: `docs/FINAL_CHECK.md` (B1–C4), `docs/SEEDS.md`, `python3 test/test_fixcheck.py`, `python3 test/test_attacks.py`, `python3 test/test_attacks_r2.py`, `python3 tools/scan_writes.py`, `python3 tools/live_preview.py`.

| # | Fix | Where | Tests |
|---|---|---|---|
| 1 | **PREDATES_FIX.** The fix commit's date (its `.atom` feed) and, for a PR, its merge date (the PR page's `mergedTime`) are snapshotted at filing. `fix_at` is the later of the two. Code created before `fix_at` is `PREDATES_FIX` / `DEPLOYED_BEFORE_FIX`: neutral gray badge, the requested text, everyone refunded. For a proxy, "created" means the implementation's own creation, also snapshotted. PREDATES_AUDIT still wins for non-proxies created before the audited commit. A model NOT_FIXED on pre-fix code also becomes PREDATES_FIX, so only code created after the fix existed can be NOT_FIXED. `is_known_unfixed` is false for both PREDATES outcomes. Every check page shows deployed / audited / fix dates (and the implementation's, for a proxy); every list row shows all three. | `fix_provenance`, `code_born`, `code_decision`, `decide`; frontend | `R2_01`, `S01_PredatesFix` (6) |
| 2 | **Sherlock only.** `report_source_ok`: a `sherlock-audit/*-judging` repo pinned at a SHA, or a web.archive.org capture of exactly such a URL (raw or github.com) or of `audits.sherlock.xyz`. Everything else is `REPORT_SOURCE_NOT_ALLOWED`, before any fetch. README, landing, how-it-works and the check form say "Supports Sherlock contest reports; other auditors are future work." | `report_source_ok`, `file_check` | `R2_02`, `S02_ReportAllowlist` (2) |
| 3 | **Reachable hunks.** Every line carries its *frame*: the lines that opened each block enclosing it, outermost first, inside the function. A hunk matches only where every line has the same frame as in the fix, so it sits at the fix's absolute depth inside the same branches and loops. Before each hunk, every `return` / `revert` / `throw` / `selfdestruct` in the deployed function must also be in the fix before that hunk. Otherwise there is no CODE_CONTAINS_FIX; the model decides (grounded per fix 7) or the check is INCONCLUSIVE. | `_frames`, `_exits`, `contains_fix` | `R2_03` (2), `S03_ReachableFix` (4) |
| 4 | **Compiled contract.** The explorer's compiled contract is read: Blockscout `file_path` + `name`, Sourcify `compilation.fullyQualifiedName`. The function's holder must be that contract or one of its resolved ancestors. Otherwise `FUNCTION_NOT_IN_COMPILED_CONTRACT`, which is INCONCLUSIVE. | `parse_source`, `extract(target=…)` | `R2_04`, `S04_CompiledContract` (5) |
| 5 | **Import aliases.** Declarations are file-qualified (`file:Name`). Parents are resolved through `import {X as Y}`, `import "p" as Z` / `Z.X`, `import * as Z`, plain imports (including re-exports), relative paths and remapped paths (by unique suffix). Any parent of the compiled contract that cannot be resolved is `PARENT_UNRESOLVED` (INCONCLUSIVE). Without a compiled contract, an implementer with an unresolved parent counts as overriding. | `_imports`, `_resolve_path`, `_resolve`, `_graph`, `extract` | `R2_05`, `S05_ImportAliases` (5) |
| 6 | **Helpers.** Every function called directly by the judged function *or by the fix's added lines* must run the implementation ours sees, i.e. the most-derived implementation in the compiled chain must be ours or above it. An override further down, or an ambiguous diamond, is `HELPER_OVERRIDDEN` (INCONCLUSIVE). | `calls_in`, `extract(calls=…)`, `gather` | `R2_06`, `S06_HelpersTheFixCalls` (4) |
| 7 | **Grounding on new lines.** `fix_change` adds `new`: added lines that occur nowhere in the audited function. FIXED is grounded only on those, so a fix made only of moved lines can never be grounded by the model. Code checks moves itself: the moved lines must sit in the fix's order (hunks with context) and appear exactly as often as in the fix. | `fix_change`, `grounded`, `contains_fix` | `R2_07`, `S07_GroundingOnNewLines` (3) |
| 8 | **Exact captures.** The probe showed GenVM *follows* the Wayback redirect: a 2099 timestamp came back 200 with the 2026 capture. So the archive timestamp must be a real time no later than the filing (`ARCHIVE_TIMESTAMP_AFTER_FILING`, before any fetch). Captures are stored and fetched in the raw `id_` form. The response's `Memento-Datetime` must equal the requested timestamp exactly (`ARCHIVE_CAPTURE_NOT_EXACT`), for both the report and the docs. | `archive_pin(…, now)`, `memento`, `norm_url`, `gather` | `R2_08`, `S08_ArchiveCaptureIsExact` (4) |
| 9 | **Fix provenance.** Fix links are read only from discussion blocks written by Sherlock's own accounts (`sherlock-admin`, `sherlock-adminN`) that carry a fixed-status phrase. The finding must have such a block (`FIXED_STATUS_NOT_FROM_SHERLOCK`). The fix repo must belong to the protocol (`FIX_REPO_NOT_PROTOCOLS`). The fix must be on the default branch: its head commit is, or the PR was merged and its merge commit is (`FIX_NOT_ON_DEFAULT_BRANCH`). | `status_block`, `fix_links`, `pr_facts`, `on_default_branch`, `fix_provenance`, `file_check` | `R2_12`, `S09_*` (6) |
| 10 | **URL spellings.** A `%` anywhere in a URL path is refused at filing (`URL_PERCENT_ENCODED`), before any fetch. `norm_url` decodes escapes of unreserved characters, so a key or a registry lookup in any spelling finds the same check. An archived target keeps its query string. | `norm_url`, `percent_in_path`, `check_key` | `R2_09` (2), `S10_*` (3) |
| 11 | **Pinned slot block.** The leader reads the EIP-1967 slot at `head - margin` and records `slot_block` in the evidence. Each validator re-reads that exact block and accepts it only if it is at or below its own head and within a per-chain lag (`SLOT_BLOCKS`, about 20 minutes). Otherwise `SLOT_BLOCK_OUT_OF_RANGE`, so the round fails and nothing is written. OP Mainnet and Polygon moved to RPCs that serve that much history (`mainnet.optimism.io`, `polygon.drpc.org`; probe in `docs/research/probe_web2.json`). | `head_block`, `eip1967_impl(…, block)`, `deployed_function`, `file_check` validator | `R2_10`, `S11_*` (4) |
| 12 | **Operators kept apart.** `canon` keeps one space between two operator characters that would fuse into another token (`FUSE`: `+ +`, `- -`, `* *`, `& &`, `\| \|`, `< <`, `> >`, `< =`, `> =`, `= =`, `! =`, `+ =` … `= >`, `- >`, `: =`). Ordinary formatting (`a = -b`, `x=>y`) still canonicalises to one form. | `canon` (shared with `tools/solfn.py` and the frontend) | `R2_11`, `S12_*` (2) |

Unchanged and still tested:
* strict-equality evidence with sha256 of every immutable body;
* disagreement → INCONCLUSIVE;
* fetch failure refuses the filing;
* deadlines with a permissionless `expire`;
* the ledger invariant after every call;
* no state written before a revert;
* fees estimated on every write;
* nonce-fenced finding text;
* quotes matched against comment-free, string-blanked lines.

`tools/scan_writes.py` passes for all six write methods. `file_check` and `counter_stake` first write `_bank()` and never raise afterwards; `decide`, `expire`, `withdraw` and `sweep_fees` raise only before their first write.

## Tests

**183 offline tests pass:** `test/test_fixcheck.py` 157 (the 109 that existed plus 48 new: `S01`–`S12`), `test/test_attacks.py` 12 and `test/test_attacks_r2.py` 14.

Each round-2 attack test passes for the reason in its docstring. Checked one by one:

| Test | Result now |
|---|---|
| R2_01 | the Arbitrum vault decides `PREDATES_FIX` / `DEPLOYED_BEFORE_FIX` (created 2024-05-29; fix existed 2024-06-28) |
| R2_02 | the challenger's own report is refused `REPORT_SOURCE_NOT_ALLOWED` |
| R2_03 | both dead-block and early-return variants leave code undecided (no CODE_CONTAINS_FIX) |
| R2_04 | `FUNCTION_NOT_IN_COMPILED_CONTRACT` → INCONCLUSIVE |
| R2_05 | `FUNCTION_OVERRIDDEN` |
| R2_06 | `HELPER_OVERRIDDEN` |
| R2_07 | `new` is empty and FIXED is not grounded |
| R2_08 | a 2099 timestamp is refused |
| R2_09 | the `%2E` spelling has the README key; `?id=1` and `?id=2` captures have two keys |
| R2_10 | every slot read names a hex block |
| R2_11 | `x=a+ ++b;` ≠ `x=a++ +b;` |
| R2_12 | PR #999 from a participant's comment is ignored; PR #113 from `sherlock-admin2` is read |

Changes to existing tests. No assertion about a vulnerability was weakened; each change below is forced by a fix:

* `test_attacks_r2.py`
  * `R2_08` now passes the filing time: `MOD.archive_pin(url, T0)`. A timestamp can only be judged "no later than the filing" against a clock, and the contract's only clock is the transaction time, so `archive_pin` takes it as an argument. The assertion (`== {}`) is unchanged.
  * The first docstring line names the commit instead of a version.
* `test_attacks.py`
  * `A04`: setup only. The code that runs is now dated by the implementation's own creation (fix 1), so the fake chain also answers the implementation's creation record. The assertion is unchanged.
* `test_fixcheck.py`
  * The NOT_FIXED-by-code tests now file the Ethereum vault (`VAULT_ETH`, M-17, created 2024-08-19, after its fix was merged on 2024-06-28), added to the real fixtures. The Arbitrum vault (`VAULT`) is now PREDATES_FIX, which is exactly what fix 1 requires. The model-path tests still edit the Arbitrum vault's `maxDeposit`.
  * Home-made reports are served from a `sherlock-audit/…-judging` URL with a Sherlock status block (fixes 2 and 9), and their invented fix commits get a commit feed and a `branch_commits` page.
  * The fix-not-linked test uses a repo in the protocol's own account. A fix in another account is now refused earlier (`FIX_REPO_NOT_PROTOCOLS`), and that is asserted separately.
  * The docs-not-listing-the-address test uses the protocol's own Arbitrum page instead of Mellow's (which would now be refused for the fix's account first).
  * The Sourcify URL expected by `T04` now asks for `compilation` (fix 4).
  * The proxy tests serve the implementation's creation record.
  * The reformatting test reformats the Ethereum vault's `_convertToShares` (still NOT_FIXED).
  * The pagination test names M-17.

## Interpretations (deliberate)

* **Fix 9, "same owner as the audited repo".** For a Sherlock contest the audited repo is Sherlock's copy (`sherlock-audit/<contest>`), so its owner never equals the protocol's. I used the protocol's own GitHub account instead: the owner of its pinned docs, which is also what a check is scored under. All 22 seeds satisfy it. A filing whose docs are an archived web page cannot show an account and is refused.
* **Fix 9, "the lead judge".** The report does not say who the lead judge is, and anyone can comment under any name. Fix links (and the fixed status itself) are therefore read only from `sherlock-admin…` blocks. A participant could type such an author line into their own comment. The forged link would still have to point at a commit in the protocol's own account that is on its default branch, so it cannot introduce code the protocol did not merge.
* **Fix 9, "reachable from the default branch".**
  * Three seed PRs were squash-merged or merged through a side branch, so their head commit is not on `main`/`develop`: Cap #185 and #189 (merged into `fix-review`, then `main`) and Optimism #10149. These count through the PR's merge commit (`fix_reach = MERGE`).
  * Two Mellow PRs (#5, #7) were closed unmerged, but their head commits are on `main`. They count directly, with no merge date.
* **Fix 1 and 9, where the dates come from.**
  * The PR's merge date and merge commit come from the pull-request page, and reachability from GitHub's `branch_commits` fragment. The GitHub API allows 60 unauthenticated requests per hour, too few for every validator.
  * Validators compare only the extracted facts, never the pages' bytes.
  * A PR merged into a side branch counts from that merge date, although it may have reached the default branch later. Stated in the README's known limits.
* **Fix 1 for proxies.** "The contract" is the code that runs, so a proxy is dated by its implementation's creation.
* **Fix 3, exits at any depth.** The rule is applied to an exit at *any* depth before the hunk, not only the same or a shallower one. A conditional `return` inside a deeper `if` skips the guard just like a one-line one. This is stricter: such cases go to the model.
* **Fix 6, which calls.** Helpers are taken from the judged function's own calls *and* the fix's added lines. If the deployed code calls an overridden helper, the code shown is not the code that runs, whether or not the fix added that call. Member calls (`x.f()`) and modifiers are not followed (README).
* **Fix 8, how "exact" is checked.** GenVM follows redirects, so a status code cannot tell a redirected capture from the requested one; the `Memento-Datetime` response header can. The probe shows GenVM exposes it.
* **Fix 10.** `%` in a path is refused at filing. Keys still decode unreserved escapes, so a lookup through `FixRegistry` in either spelling finds the check; `R2_09` asserts that.

## Before / after on the 22 seeds

| # | Finding | Chain | Before (commit 0c20168) | After (commit 7efb699) | Reason |
|---|---|---|---|---|---|
| 1 | PoolTogether V5 M-5 `claimPrizes` | optimism | FIXED (CODE_MATCH_FIX) | FIXED (CODE_MATCH_FIX) | unchanged |
| 2 | PoolTogether V5 M-8 `_computeFeePerClaim` | base | FIXED (CODE_MATCH_FIX) | FIXED (CODE_MATCH_FIX) | unchanged |
| 3 | PoolTogether V5 M-15 `shutdownAt` | optimism | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | unchanged |
| 4 | PoolTogether V5 M-9 `liquidatableBalanceOf` | optimism | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | unchanged |
| 5 | PoolTogether V5 M-16 `maxDeposit` | arbitrum | NOT_FIXED (CODE_MATCH_VULNERABLE) | PREDATES_FIX (DEPLOYED_BEFORE_FIX) | created 2024-05-29, after the audit (2024-05-16) but before the fix existed (2024-06-28: the later of the fix commit and its PR's merge) — round-2 fix 1 |
| 6 | PoolTogether V5 M-17 `_convertToShares` | ethereum | NOT_FIXED (CODE_MATCH_VULNERABLE) | NOT_FIXED (CODE_MATCH_VULNERABLE) | unchanged |
| 7 | PoolTogether V5 M-19 `claimPrize` | base | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | unchanged |
| 8 | PoolTogether V5 M-1 `isRequestComplete` | optimism | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | unchanged |
| 9 | PoolTogether V5 M-1 `isRequestComplete` | arbitrum | FIXED (CODE_MATCH_FIX) | FIXED (CODE_MATCH_FIX) | unchanged |
| 10 | PoolTogether V5 M-14 `canStartDraw` | optimism | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | unchanged |
| 11 | PoolTogether V5 H-3 `startDrawReward` | optimism | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | PREDATES_AUDIT (DEPLOYED_BEFORE_AUDIT) | unchanged |
| 12 | Mellow Flexible Vaults H-1 `checkSignatures` | ethereum | FIXED (CODE_MATCH_FIX) | FIXED (CODE_MATCH_FIX) | unchanged |
| 13 | Mellow Flexible Vaults H-2 `_handleReport` | ethereum | INCONCLUSIVE (MODEL_UNGROUNDED) | INCONCLUSIVE (MODEL_UNGROUNDED) | unchanged |
| 14 | Mellow Flexible Vaults H-3 `callHook` | ethereum | INCONCLUSIVE (PARTIAL_MATCH) | INCONCLUSIVE (PARTIAL_MATCH) | unchanged |
| 15 | Mellow Flexible Vaults H-4 `calculateFee` | ethereum | INCONCLUSIVE (MODEL_UNGROUNDED) | INCONCLUSIVE (MODEL_UNGROUNDED) | unchanged |
| 16 | Mellow Flexible Vaults H-5 `calculateFee` | ethereum | FIXED (CODE_MATCH_FIX) | FIXED (CODE_MATCH_FIX) | unchanged |
| 17 | Mellow Flexible Vaults M-1 `updateChecks` | ethereum | INCONCLUSIVE (MODEL_UNGROUNDED) | INCONCLUSIVE (MODEL_UNGROUNDED) | unchanged |
| 18 | Mellow Flexible Vaults M-4 `handleReport` | ethereum | FIXED (CODE_MATCH_FIX) | FIXED (CODE_MATCH_FIX) | unchanged |
| 19 | Mellow Flexible Vaults M-5 `cancelDepositRequest` | ethereum | FIXED (CODE_CONTAINS_FIX) | FIXED (CODE_CONTAINS_FIX) | unchanged |
| 20 | Cap M-1 `liquidate` | ethereum | INCONCLUSIVE (PARTIAL_MATCH) | INCONCLUSIVE (PARTIAL_MATCH) | unchanged |
| 21 | Cap M-3 `realizeRestakerInterest` | ethereum | INCONCLUSIVE (PARTIAL_MATCH) | INCONCLUSIVE (PARTIAL_MATCH) | unchanged |
| 22 | OP Stack fault proofs M-3 `create` | ethereum | INCONCLUSIVE (PARTIAL_MATCH) | INCONCLUSIVE (PARTIAL_MATCH) | unchanged |

22 checks; 21 unchanged, 1 changed.

The one change is the one the report predicted: **#5 → PREDATES_FIX**. PoolTogether's Arbitrum vault was created 2024-05-29. Its fix existed on 2024-06-28: PR #113's head `60be8fc` was committed on 2024-06-21 and the PR was merged on 2024-06-28; the later date counts.

Every other verdict is unchanged, and the new rules explain why:
* **#6** (Ethereum vault, created 2024-08-19) postdates its fix (PR #112, merged 2024-06-28), so it stays NOT_FIXED.
* The six PREDATES_AUDIT contracts predate both the audit and the fix; PREDATES_AUDIT takes precedence.
* The seven code FIXED verdicts still match the fix commit, or (#19) contain it in place. #19's hunk passes the stricter reachability rule: same frames, no new early exit.
* The four PARTIAL_MATCH checks are decided before any of the new rules apply.
* All 22 pass the new filing checks:
  * Sherlock judging reports;
  * fix links in `sherlock-admin` blocks;
  * fix repos in the protocol's docs account;
  * fixes on the default branch: 19 directly, 3 through the merge commit.

New totals: **7 FIXED / 1 NOT_FIXED / 6 PREDATES_AUDIT / 1 PREDATES_FIX / 7 INCONCLUSIVE.**

**Model double-run.** Three checks reached the model, and each was asked twice by every validator:

| Check | Votes | Result |
|---|---|---|
| #13 Mellow H-2 | UNGROUNDED, UNGROUNDED | INCONCLUSIVE `MODEL_UNGROUNDED`; the fix only removes a line, so there is nothing new to quote |
| #15 Mellow H-4 | UNGROUNDED, INCONCLUSIVE | INCONCLUSIVE `MODEL_UNGROUNDED` |
| #17 Mellow M-1 | UNGROUNDED, UNGROUNDED | INCONCLUSIVE `MODEL_UNGROUNDED` |

Everyone was refunded. No model answer moved money.

**Demo deployment.** Every path ran, including D9: PREDATES_FIX on the Arbitrum vault against a defender, everyone refunded. The check filed on camera (#9) was decided PREDATES_AUDIT, and the ledger ended drained to 0.

## Deployments

| Contract | Address |
|---|---|
| FixCheck (canonical, 1 h / 24 h) | round-2 canonical (commit 7efb699), address in docs/superseded/README.md |
| FixCheck (demo, 90 s / 300 s) | round-2 demo (commit 7efb699), address in docs/superseded/README.md |
| FixRegistry | round-2 FixRegistry (commit 7efb699), address in docs/superseded/README.md |

* **Deploy commit:** `7efb699928b20cdd580b534a58609da1c1defe08`. `tools/verify_source.mjs` reads all three back from studio-dev: each is byte-identical to the deploy commit and to HEAD, since no later commit touches `contracts/`.
* **Previous addresses:** in `docs/superseded/README.md`, each with a one-line reason.

## Final check (`docs/FINAL_CHECK.md`)

| # | Check | Result |
|---|---|---|
| B1 | Source match (3 addresses) | **PASS** |
| B2 | No trapped funds + ledger invariant | **PASS** |
| B3 | No state can stay pending forever | **PASS** |
| B4 | Counter-before-revert scan | **PASS** |
| B5 | Views consistent with storage | **PASS** |
| B6 | Evidence bound to the finding (fix 1) | **PASS** |
| B7 | Dates/params snapshotted at filing | **PASS** |
| B8 | No mutable content decides a verdict | **PASS** |
| B9 | All fetched URLs allowlisted | **PASS** |
| B10 | No one can file/claim for someone else | **PASS** |
| B11 | Hiding / partial source → INCONCLUSIVE | **PASS** |
| B12 | Verbatim resend can't reopen or re-pay | **PASS** |
| B13 | Model flips end INCONCLUSIVE | **PASS** |
| B14 | Fees on all writes | **PASS** |
| B15 | Honest limitations, no absolute claims | **PASS** |
| C1 | Live site numbers match chain | **PASS** |
| C2 | One consistent set of current addresses | **PASS** |
| C3 | 375px: no horizontal scroll | **PASS** |
| C4 | Git history and files clean | **PASS** |
