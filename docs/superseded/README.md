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

* `seed-canonical-v1.0.json`, `seed-demo-v1.0.json` — every check and decision on the first deployment.
* `seed-canonical-v1.1.json`, `seed-demo-v1.1.json` — every check and decision on the second deployment.
* [`HISTORY.md`](HISTORY.md) — what each earlier version decided and why the rules changed.
