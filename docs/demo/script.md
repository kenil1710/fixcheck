# Demo video — script and timing

Files (all recorded from the live app at https://fixcheck-ledger.vercel.app against the current contracts; real contract data):

| File | Format | Length |
|---|---|---|
| `fixcheck-demo-voiced.mp4` | 1920×1080, H.264 + AAC, captions burned in | 99.4 s |
| `fixcheck-demo-voiced.srt` | captions, separate | |
| `fixcheck-demo-vertical.mp4` | 1080×1920 for X, captions burned in | 41.9 s |
| `fixcheck-demo-vertical.srt` | captions, separate | |

Built by `tools/shots/voiced.mjs` from `tools/shots/voiced-script.json`. Each scene is recorded for exactly as long as its narration line (plus a short tail) and the narration is anchored to the scene's first frame, so the voice never runs ahead of the screen. The check-flow scenes file a **real** check on the demo contract (check #8) through a throwaway Studio Dev key (an injected EIP-1193 wallet that signs locally); the stake → result cut is a jump cut across the validators' wait, never a mock.

Voice: macOS `say`, **Samantha** at 172 wpm (no Premium/Enhanced English voice is installed on this machine), loudness-normalised to −16 LUFS (EBU R128, `loudnorm`). No music. To use a better voice: System Settings → Accessibility → Spoken Content → System voice → Manage Voices → install e.g. “Ava (Premium)”, then `VOICE="Ava (Premium)" node tools/shots/voiced.mjs`.

## Narration (timed to the master cut)

| Time | On screen | Narration |
|---|---|---|
| 0.0–6.1 s | Landing — headline and the live scorecard | Audit reports say “Fixed”. Users trust it. Nobody checks the code that's actually deployed. |
| 6.1–18.7 s | Landing — live tally (22 checks of 21 findings: 7 fixed · 2 not fixed · 6 deployed before the audit · 7 inconclusive) and the specimen: the Arbitrum vault, deployed after the audit | FixCheck does. It read 22 checks of 21 findings marked fixed, against the code at each protocol's listed address: 7 fixed, 2 not fixed, and 6 deployed before the audit. |
| 18.7–24.2 s | PoolTogether protocol page — findings table, filter “Not fixed” | This is PoolTogether: one row per finding, its status, and how it was decided. |
| 24.2–34.7 s | Check #5 (PoolTogether M-16, Arbitrum vault deployed 2024-05-29, after the audit) — audited vs deployed: identical | This finding was marked fixed. On the left is the function the auditors reviewed; on the right, the one deployed on Arbitrum after the audit. They're identical, line for line. |
| 34.7–41.0 s | Same check — toggle “vs fix”: the fix’s line is not in the deployed code | Against the fix commit, the fixed line simply isn't there. So code alone says: not fixed. |
| 41.0–50.9 s | Check #13 (Mellow H-2) — the model was asked twice; its answers did not point at the fix → inconclusive, refunded | When code can't decide, validators ask a model, but it must quote a line the fix added. Here it couldn't, so the check is inconclusive and everyone is refunded. |
| 50.9–60.0 s | Check flow — pick a real example; live preview of every code check | To check a finding yourself, pick the report, the finding and the deployed address. Before you pay, the app runs the same checks the contract will. |
| 60.0–67.8 s | Stake step — real filing on the demo contract (Base vault): signing → sent → validators reading sources | Then you stake that it isn't fixed. Every validator reads the report, both commits, the verified source and the deployment date. |
| 67.8–73.8 s | Result card — demo check #8: “predates the audit” | This vault was deployed the day before the audit, so code already says: predates the audit. |
| 73.8–80.6 s | How it works — “What the model is never allowed to decide” | Code decides everything it can. The model never decides what counts as evidence, the dates, or the money. |
| 80.6–89.9 s | PoolTogether page — filter “Predates audit” (6), with deployed/audited dates on every row | The real result: six PoolTogether contracts run the audited code but predate the audit and can't be upgraded. Two vaults deployed after it are not fixed. |
| 89.9–99.6 s | Landing — closing line and URL | Code compares the functions. GenLayer validators only judge the middle cases, and must quote the exact lines. fixcheck-ledger dot vercel dot app. |

The vertical cut uses the landing, the identical-to-audited finding, the “vs fix” view, the real result and the closing line (landing → finding → vsfix → real → close).

The 78–88 s result is stated neutrally: six PoolTogether contracts run the audited code but were deployed before the audit and can't be upgraded (PREDATES AUDIT, a code fact from their creation dates), and two vaults deployed after the audit are not fixed.
