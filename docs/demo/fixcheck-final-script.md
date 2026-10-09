# FixCheck — final video script

`fixcheck-final.mp4`: 1920×1080, 30 fps, H.264 + AAC, 200.9 s. Captions burned in and in `fixcheck-final.srt`. Voice: macOS `say`, Samantha, 175 wpm, loudness-normalised to −16 LUFS; no music. Built by `tools/shots/final.mjs` from the live site, the studio-dev explorer and GitHub.

Numbers read from the canonical contract (round-2 canonical (commit 7efb699), address in docs/superseded/README.md) right before recording: 22 checks of 21 findings, 7 fixed, 1 not fixed, 6 predates audit, 1 predates fix, 7 inconclusive. The live filing is demo check #17 on round-2 demo (commit 7efb699), address in docs/superseded/README.md.

| Time | Narration |
|---|---|
| 0:00–0:08 | Audit reports say Fixed. Almost nobody checks the code that actually runs on chain. FixCheck checks it, one finding at a time. |
| 0:08–0:18 | This is a real Sherlock finding. Sherlock runs audit contests. When the team ships a fix, Sherlock marks the finding fixed and links the pull request. |
| 0:18–0:27 | But the fix lands in a repository. The contract on chain is a separate deployment. It can be older than the fix, or simply never replaced. |
| 0:27–0:55 | Here is how a check works. Someone files a check, and stakes that the fix is not deployed. Every validator reads the same evidence: the finding's section of the report, the merged fix commit, and the verified source at the deployed address. Code compares the functions, and decides whenever it can. A model only sees what code cannot settle. It must quote a line the fix added, and two runs must agree. Otherwise the result is inconclusive, and everyone is refunded. |
| 0:55–1:05 | Fixed. PoolTogether's Claimer on OP Mainnet was redeployed in July 2024. Its function is identical to the fix commit, so code alone says fixed. |
| 1:05–1:20 | Not fixed. Check six is PoolTogether's vault on Ethereum. It was deployed on August 19, 2024, after the fix was merged on June 28. Its function is still the audited version. This is the only not fixed result. |
| 1:20–1:34 | Predates the audit. This vault on OP Mainnet was deployed in April 2024, before the audit. It is immutable, so it could never contain the fix. FixCheck does not blame the team for that. It says so. |
| 1:34–1:47 | Predates the fix. Check five is the vault on Arbitrum. It was deployed on May 29. The fix was merged on June 28. It could not contain a fix that did not exist yet, so every stake is refunded. |
| 1:47–2:01 | Inconclusive. The explorer verified this contract's source only partially, so the code shown may not be exactly what runs. Guessing would be unfair to one side. Inconclusive is the honest answer, and everyone is refunded. |
| 2:01–2:12 | Now a live check, on the demo contract, where the window is 90 seconds. Pick a real finding. Before you pay, the app runs the same checks the contract will. |
| 2:12–2:19 | File the check, with a stake that it is not fixed. Every validator fetches the sources, and they must agree. |
| 2:19–2:24 | The check is open. Until the window closes, anyone can stake that it is fixed. |
| 2:24–2:29 | 90 seconds later, anyone can ask the validators to decide. |
| 2:29–2:35 | This vault was deployed before the audit. So the verdict is predates the audit, and every stake comes back. |
| 2:35–2:40 | Refunds and winnings wait in your balance. Withdraw them whenever you like. |
| 2:40–2:52 | Across 22 checks of 21 real findings, from four protocols: 7 fixed, 1 not fixed, 6 predate the audit, 1 predates its fix, and 7 inconclusive. |
| 2:52–2:57 | Every verdict is contract state on GenLayer. You can read it yourself on the explorer. |
| 2:57–3:02 | The code deployed at these addresses matches the repository, byte for byte. |
| 3:02–3:10 | Two independent attack rounds found 21 issues. All of them are fixed, and 183 tests pass. |
| 3:10–3:15 | What is not fixed yet is written down, in the Known limitations section of the README. |
| 3:15–3:20 | Next time a report says Fixed, you can check. fixcheck-ledger.vercel.app |
