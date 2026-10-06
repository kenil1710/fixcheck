# Demo video — script and timing

Files (all from the live app at https://fixcheck-ledger.vercel.app, real contract data):

| File | Format | Length |
|---|---|---|
| `fixcheck-demo-voiced.mp4` | 1920×1080, H.264 + AAC, captions burned in | 98.6 s |
| `fixcheck-demo-voiced.srt` | captions, separate | |
| `fixcheck-demo-vertical.mp4` | 1080×1920 for X, captions burned in | 42.7 s |
| `fixcheck-demo-vertical.srt` | captions, separate | |

Built by `tools/shots/voiced.mjs` from `tools/shots/voiced-script.json`. Each scene is recorded for exactly as long as its narration line (plus a short tail) and the narration is anchored to the scene's first frame, so the voice never runs ahead of the screen. The check-flow scenes file a **real** check on the demo contract through a throwaway Studio Dev key (an injected EIP-1193 wallet that signs locally); the stake → result cut is a jump cut across the validators' wait, never a mock.

Voice: macOS `say`, **Samantha** at 172 wpm (no Premium/Enhanced English voice is installed on this machine), loudness-normalised to −16 LUFS (EBU R128, `loudnorm`). No music. To use a better voice: System Settings → Accessibility → Spoken Content → System voice → Manage Voices → install e.g. “Ava (Premium)” or “Zoe (Premium)”, then `VOICE="Ava (Premium)" node tools/shots/voiced.mjs`.

## Narration (timed to the master cut)

| Time | On screen | Narration |
|---|---|---|
| 0.0–6.1 s | Landing — headline and the live scorecard | Audit reports say “Fixed”. Users trust it. Nobody checks the code that's actually deployed. |
| 6.1–17.3 s | Landing — live tally (22 · 12 · 8 · 2) and the specimen: deployed maxDeposit vs the fix | FixCheck does. It took 22 findings that Sherlock reports mark as fixed, and read the code at each protocol's own listed address. 12 are confirmed in deployed code; 8 are not. |
| 17.3–22.9 s | PoolTogether protocol page — findings table, filter “Not fixed” | This is PoolTogether: one row per finding, its status, and how it was decided. |
| 22.9–32.7 s | Finding #5 (PoolTogether M-16, Arbitrum) — pinned finding slip, audited vs deployed: identical | This finding was marked fixed. On the left is the function the auditors reviewed; on the right, the one deployed on Arbitrum. They're identical, line for line. |
| 32.7–39.0 s | Same finding — toggle “vs fix”: the fix’s line is not in the deployed code | Against the fix commit, the fixed line simply isn't there. So code alone says: not fixed. |
| 39.0–49.1 s | Finding #13 (Mellow H-2) — quoted lines highlighted, “quoted by validators” | When deployed code matches neither version, validators ask a model. It must quote exact deployed lines, highlighted here, and code checks they point at the fix. |
| 49.1–58.2 s | Check flow — pick a real example; live preview of every code check | To check a finding yourself, pick the report, the finding and the deployed address. Before you pay, the app runs the same checks the contract will. |
| 58.2–66.1 s | Stake step — real filing on the demo contract: signing → sent → validators reading sources | Then you stake that it isn't fixed. Every validator fetches the report, both commits and the verified source, and they must agree. |
| 66.1–71.1 s | Result card — real check filed, share / open | The check is filed. Anyone can stake that it is fixed until the window closes. |
| 71.1–78.3 s | How it works — “What the model never decides” | Code decides everything it can. The model never decides what counts as evidence, the deadlines, or the money. |
| 78.3–89.1 s | PoolTogether page — deployments and findings marked Not fixed | The real result: PoolTogether's prize pool, vault and draw manager on OP Mainnet were deployed before the audit and still run the audited code. The redeployed claimer has its fixes. |
| 89.1–98.8 s | Landing — closing line and URL | Code compares the functions. GenLayer validators only judge the middle cases, and must quote the exact lines. fixcheck-ledger dot vercel dot app. |

The vertical cut uses the landing, the identical-to-audited finding, the “vs fix” view, the real result and the closing line (landing → finding → vsfix → real → close).

The 65–85 s result is stated neutrally: those PoolTogether contracts predate the audit and still match the audited code (a code fact; see `docs/RESEARCH.md` §5), and the redeployed Claimer contains its fixes.
