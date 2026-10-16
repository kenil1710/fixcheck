# Superseded deployments

Kept on studio-dev and readable; nothing in the app or the docs outside this folder uses them. Current addresses: [`ADDRESSES.md`](../../ADDRESSES.md).

| Contract | Address | Commit | Why it was replaced |
|---|---|---|---|
| FixCheck | `0x6D4390521e584b71f29A7E97E0411c6141795cF3` | `1dc7e58` | first deployment; its model saw only the deployed function and answered NOT_FIXED for two Mellow functions that contain the fix (HISTORY.md) |
| FixCheckDemo | `0xd086D592522bcdC4B4eB15AFF23BB5AD9E203f56` | `1dc7e58` | first deployment; its model saw only the deployed function and answered NOT_FIXED for two Mellow functions that contain the fix (HISTORY.md) |
| FixRegistry | `0xbdA30Ea646a6a82425db21559162923b2d833339` | `1dc7e58` | first deployment; its model saw only the deployed function and answered NOT_FIXED for two Mellow functions that contain the fix (HISTORY.md) |
| FixCheck | `0x525D730a0fEe81881af646A784337e005cC4E833` | `655d61e` | nine findings of the attack pass (docs/ATTACK_REPORT.md): unbound evidence, bag-of-lines containment, overrides, proxies, optional fix, loose grounding, no PREDATES_AUDIT, URL spellings, stale claims |
| FixCheckDemo | `0x7bC20b8eAf5A80Ca717a5249029a75351234B24F` | `655d61e` | nine findings of the attack pass (docs/ATTACK_REPORT.md): unbound evidence, bag-of-lines containment, overrides, proxies, optional fix, loose grounding, no PREDATES_AUDIT, URL spellings, stale claims |
| FixRegistry | `0xC96B4a0aAbf6902fBF1F2D2F0C6591d41D152aCf` | `655d61e` | nine findings of the attack pass (docs/ATTACK_REPORT.md): unbound evidence, bag-of-lines containment, overrides, proxies, optional fix, loose grounding, no PREDATES_AUDIT, URL spellings, stale claims |
| FixCheck | `0xD0C3FA05E91189F23898332F3678cE92F139F1ad` | `a9efd8a` | same rules as the current contract; redeployed from a commit whose source header carries no version history (never seeded) |
| FixCheckDemo | `0x9524DC2f77F4264D14F6bffD0734DBdF83C8FF70` | `a9efd8a` | same rules as the current contract; redeployed from a commit whose source header carries no version history (never seeded) |
| FixRegistry | `0xe84a30AA8E861Dd9097080B9ED880CF3ec5956f5` | `a9efd8a` | same rules as the current contract; redeployed from a commit whose source header carries no version history (never seeded) |
| FixCheck | `0x2d7b3C465D6478Db4438999b1FD0340A54256364` | `0c20168` | twelve findings of the second attack pass (docs/ATTACK_REPORT_R2.md): NOT_FIXED on code deployed before its fix existed, reports from any author, fix hunks off the live path, judged file not tied to the compiled contract, import aliases, helper overrides, moved-line grounding, floating archive captures, fix links from any comment, URL spellings, slot read at latest, operator-joining canon |
| FixCheckDemo | `0x78D31dbB13e8348A2278b64A84eBfE129607fd91` | `0c20168` | twelve findings of the second attack pass (docs/ATTACK_REPORT_R2.md): NOT_FIXED on code deployed before its fix existed, reports from any author, fix hunks off the live path, judged file not tied to the compiled contract, import aliases, helper overrides, moved-line grounding, floating archive captures, fix links from any comment, URL spellings, slot read at latest, operator-joining canon |
| FixRegistry | `0x8E93Ab199E737CF022F5D4cE0f171d0e68815E49` | `0c20168` | twelve findings of the second attack pass (docs/ATTACK_REPORT_R2.md): NOT_FIXED on code deployed before its fix existed, reports from any author, fix hunks off the live path, judged file not tied to the compiled contract, import aliases, helper overrides, moved-line grounding, floating archive captures, fix links from any comment, URL spellings, slot read at latest, operator-joining canon |
| FixCheck | `0x893f96A5c72771D40F0bB55035A013a77159cc33` | `7efb699` | three findings of the third attack pass (docs/ATTACK_REPORT_R3.md): a report or docs commit that exists only in a fork was accepted as the Sherlock report or the protocol's docs, and a proxy was dated by its implementation's creation alone, so a new proxy or a rollback onto a pre-fix implementation after the fix existed could get PREDATES_FIX |
| FixCheckDemo | `0xF5133724f0dffF025ceA878881285aE681d71c89` | `7efb699` | three findings of the third attack pass (docs/ATTACK_REPORT_R3.md): a report or docs commit that exists only in a fork was accepted as the Sherlock report or the protocol's docs, and a proxy was dated by its implementation's creation alone, so a new proxy or a rollback onto a pre-fix implementation after the fix existed could get PREDATES_FIX |
| FixRegistry | `0x50a60867153d3C63F322340dcEfe492bdd0d8D04` | `7efb699` | three findings of the third attack pass (docs/ATTACK_REPORT_R3.md): a report or docs commit that exists only in a fork was accepted as the Sherlock report or the protocol's docs, and a proxy was dated by its implementation's creation alone, so a new proxy or a rollback onto a pre-fix implementation after the fix existed could get PREDATES_FIX |
| FixCheck | `0x65Fe440d63437e14fB9e990D1D0Dc283EE40bb56` | `93de7be` | eleven issues of the fourth attack pass (docs/ATTACK_REPORT_R4.md: six Medium, five Low): the leader could pick the slot block; chain facts came from one source; a metamorphic redeploy kept its first creation date; beacon proxies and an Upgraded event above the slot block were not handled; a pull ref could count as a branch; the status block's author was read from README text; modifiers were not followed |
| FixCheckDemo | `0x66E008fc08414ecF423e59482c20A046FAd7A01c` | `93de7be` | eleven issues of the fourth attack pass (docs/ATTACK_REPORT_R4.md: six Medium, five Low): the leader could pick the slot block; chain facts came from one source; a metamorphic redeploy kept its first creation date; beacon proxies and an Upgraded event above the slot block were not handled; a pull ref could count as a branch; the status block's author was read from README text; modifiers were not followed |
| FixRegistry | `0x90f8c37976D166364BD563f71156aEd187CAc9d2` | `93de7be` | eleven issues of the fourth attack pass (docs/ATTACK_REPORT_R4.md: six Medium, five Low): the leader could pick the slot block; chain facts came from one source; a metamorphic redeploy kept its first creation date; beacon proxies and an Upgraded event above the slot block were not handled; a pull ref could count as a branch; the status block's author was read from README text; modifiers were not followed |


## v1 (accepted submission, kept untouched)

The deployment the accepted submission was reviewed on (BASE `27f30c0`, deployed from `8519168`). Never written to by v2 work; its code is byte-identical to `contracts/` at BASE ([`docs/MILESTONE.md`](../MILESTONE.md), `node tools/base_proof.mjs`).

| Contract | Address | Commit | Status |
|---|---|---|---|
| FixCheck (canonical) | `0x263C6a42B98E9133CF85A00A436b05C3573B88fe` | `8519168` | v1, superseded by v2 |
| FixCheckDemo | `0x19bc7Cb16Ce1B4F328f33d0FDfeA61297dA04f68` | `8519168` | v1, superseded by v2 |
| FixRegistry | `0xA37F98977f023D8C0bd17aCF1A7983E5d328d9A4` | `8519168` | v1, superseded by v2 |

## v2 deployments replaced before use

| Contract | Address | Commit | Why it was replaced |
|---|---|---|---|
| FixCheck | `0xDc494719D5E29Ac26f23d7064128640C8E2863a3` | `c0a2410` | never seeded: file_slot could only use the scorecard's own docs page (PoolTogether lists each chain on its own page) |
| FixCheckDemo | `0x5016957BEb2E8f8904Dfe8f9a968c23dca8151B6` | `c0a2410` | never seeded: file_slot could only use the scorecard's own docs page (PoolTogether lists each chain on its own page) |
| FixStatus | `0x50b1756dE161955Fd19b817F9CC5c0b11157f2be` | `c0a2410` | never seeded: file_slot could only use the scorecard's own docs page (PoolTogether lists each chain on its own page) |
| FixGate | `0x3c546811AB2b53b284131A35bE105bc937e425CE` | `c0a2410` | never seeded: file_slot could only use the scorecard's own docs page (PoolTogether lists each chain on its own page) |
| FixCheck | `0xAE0e6f85D9C41027F5d0B03E4ED4Ae5A07B903e6` | `4cf0bc4` | Studio Dev's receipt limit: a filing whose evidence exceeded it ended UNDETERMINED (PoolTogether M-8 on Base); 3 scorecards and 4 checks were on it |
| FixCheckDemo | `0xa2d6fCf5006e912197618c529C8612C4204B5A2a` | `4cf0bc4` | Studio Dev's receipt limit: a filing whose evidence exceeded it ended UNDETERMINED (PoolTogether M-8 on Base); 3 scorecards and 4 checks were on it |
| FixStatus | `0x30dF4Fb5A884645a07D56F0202DeD370D5195046` | `4cf0bc4` | Studio Dev's receipt limit: a filing whose evidence exceeded it ended UNDETERMINED (PoolTogether M-8 on Base); 3 scorecards and 4 checks were on it |
| FixGate | `0xa84D869b9Cd82fB247A5d5c2A9F375627DC7BCB8` | `4cf0bc4` | Studio Dev's receipt limit: a filing whose evidence exceeded it ended UNDETERMINED (PoolTogether M-8 on Base); 3 scorecards and 4 checks were on it |

* `seed-canonical-v1.0.json`, `seed-demo-v1.0.json` — every check and decision on the first deployment.
* `seed-canonical-v1.1.json`, `seed-demo-v1.1.json` — every check and decision on the second deployment.
* `seed-canonical-v1.2.json`, `seed-demo-v1.2.json` — every check and decision on the third deployment (commit `0c20168`).
* `seed-canonical-v1.3.json`, `seed-demo-v1.3.json` — every check and decision on the fourth deployment (commit `7efb699`; the submitted demo video was recorded on it).
* `seed-canonical-v1.5.json`, `seed-demo-v1.5.json` — the accepted v1 deployment's chain state as committed at BASE `27f30c0` (the "before" column of the v2 re-run).
* `seed-canonical-v1.4.json`, `seed-demo-v1.4.json` — every check and decision on the fifth deployment (commit `93de7be`, round 3).
* [`DEPLOYED_VERIFICATION-r3.md`](DEPLOYED_VERIFICATION-r3.md), `live-r3.json` — the round-3 live verification on that deployment's demo.
* `preview-before-round-2.json` — the live `gather()` preview of the 22 seeds under the third deployment's rules.
* [`HISTORY.md`](HISTORY.md) — what each earlier version decided and why the rules changed.
