# Demo video — script and timing

Files (all recorded from the live app at https://fixcheck-ledger.vercel.app against the current contracts; real contract data):

| File | Format | Length |
|---|---|---|
| `fixcheck-demo-voiced.mp4` | 1920×1080, H.264 + AAC, captions burned in | 99.0 s |
| `fixcheck-demo-voiced.srt` | captions, separate | |
| `fixcheck-demo-vertical.mp4` | 1080×1920 for X, captions burned in | 41.6 s |
| `fixcheck-demo-vertical.srt` | captions, separate | |

Built by `tools/shots/voiced.mjs` from `tools/shots/voiced-script.json`. Each scene is recorded for exactly as long as its narration line (plus a short tail) and the narration is anchored to the scene's first frame, so the voice never runs ahead of the screen. The check-flow scenes file a **real** check on the demo contract (check #9) through a throwaway Studio Dev key (an injected EIP-1193 wallet that signs locally); the stake → result cut is a jump cut across the validators' wait, never a mock.

Voice: macOS `say`, **Samantha** at 172 wpm (no Premium/Enhanced English voice is installed on this machine), loudness-normalised to −16 LUFS (EBU R128, `loudnorm`). No music.

## Narration (timed to the master cut)

| Time | On screen | Narration |
|---|---|---|
| 0.0–6.1 s | Landing — headline and the live scorecard | Audit reports say “Fixed”. Users trust it. Nobody checks the code that's actually deployed. |
| 6.1–17.6 s | Landing — live tally (22 checks of 21 findings: 7 fixed · 1 not fixed · 6 deployed before the audit · 1 deployed before the fix · 7 inconclusive) and the specimen: the Ethereum vault, deployed after its fix existed | FixCheck does. It read 22 checks of 21 findings marked fixed: 7 fixed, 1 not fixed, 6 deployed before the audit, and 1 before its fix existed. |
| 17.6–23.2 s | PoolTogether protocol page — findings table with deployed / audited / fix dates | This is PoolTogether: one row per finding, its status, and how it was decided. |
| 23.2–33.4 s | Check #6 (PoolTogether M-17, Ethereum vault created 2024-08-19, after fix PR #112 merged 2024-06-28) — audited vs deployed: identical | This finding was marked fixed. On the left, the function the auditors reviewed; on the right, the one deployed on Ethereum after the fix was merged. They're identical. |
| 33.4–39.7 s | Same check — toggle “vs fix”: the fix’s line is not in the deployed code | Against the fix commit, the fixed line simply isn't there. So code alone says: not fixed. |
| 39.7–49.5 s | Check #13 (Mellow H-2) — the model was asked twice; its answers did not point at the fix → inconclusive, refunded | When code can't decide, validators ask a model, but it must quote a line the fix added. Here it couldn't, so the check is inconclusive and everyone is refunded. |
| 49.5–58.7 s | Check flow — pick a real example; live preview of every code check | To check a finding yourself, pick the report, the finding and the deployed address. Before you pay, the app runs the same checks the contract will. |
| 58.7–67.4 s | Stake step — real filing on the demo contract (Base vault): signing → sent → validators reading sources | Then you stake that it isn't fixed. Every validator reads the report, both commits, the verified source, and when the code and the fix were made. |
| 67.4–73.4 s | Result card — demo check #9: “predates the audit” | This vault was deployed the day before the audit, so code already says: predates the audit. |
| 73.4–80.2 s | How it works — “What the model is never allowed to decide” | Code decides everything it can. The model never decides what counts as evidence, the dates, or the money. |
| 80.2–89.5 s | PoolTogether page — filters “Predates audit” (6), “Predates fix” (1), “Not fixed” (1) | The real result: six PoolTogether contracts predate the audit, one vault predates its fix, and one vault deployed after the fix is not fixed. |
| 89.5–99.2 s | Landing — closing line and URL | Code compares the functions. GenLayer validators only judge the middle cases, and must quote the exact lines. fixcheck-ledger dot vercel dot app. |

The vertical cut uses landing → finding → vsfix → real → close.

Spoken and on-screen totals equal the chain: 7 fixed, 1 not fixed, 6 deployed before the audit, 1 deployed before its fix existed, 7 inconclusive.
