# Tasks

## Step 0 — research and probe
- [x] Probe from GenVM on studio-dev: Blockscout v2 (eth, OP ✓; base/arbitrum/polygon behind a bot wall → Sourcify v2 ✓), GitHub raw at a SHA ✓, Sherlock README ✓, Code4rena page ✓, web.archive.org snapshot ✓ (`docs/research/probe_1.json`)
- [x] 22 checks of 21 real findings marked fixed (PoolTogether M-1 on two chains), with report pinned at a SHA, finding id, function, audited commit, fix commit, deployed address + chain, docs URL listing the address (`docs/research/seeds.json`)
- [x] Offline comparison with the contract's own extractor: 64 deployment pairs — 13 identical to fix, 43 identical to audited, 7 changed, 1 inconclusive (`docs/RESEARCH.md`)
- [x] The "Fixed" findings not present in deployed code documented with dates, creation txs and hashes, no claims about intent (PoolTogether V5, `docs/RESEARCH.md` §5)
- [x] `docs/RESEARCH.md` written before contract code

## Contracts
- [x] `contracts/FixCheck.py` — v0.6 format (`# v0.3.0` + pinned Depends hash), `gl.contract.Contract`, TreeMap storage, `gl.message.raw` time, `gl.storage.allow`, fees on writes
- [x] Filing frozen: pinned report / docs / audited / fix URLs, finding id, function, chain, address; validators fetch everything; strict equality on every canonical field and every body sha256
- [x] Code checks: finding heads a report section with a fixed-status phrase and names the function; docs list the address; contract verified (one proxy hop)
- [x] Decide: code first (CODE_MATCH_FIX / CODE_MATCH_VULNERABLE / missing / overloaded / unparseable); model only otherwise, quotes verified verbatim, asked twice, flip → INCONCLUSIVE; only enums, basis and quote indices + hashes stored
- [x] Stakes: NOT_FIXED challenger vs FIXED defenders; pro-rata; no-defender fee; inconclusive refunds; one open check per key; pull payouts; withdraw; `balance == open + claimable + fees`; deadlines + permissionless decide / expire
- [x] Views: per-protocol scorecard, check details, code, defenders, paginated lists, stats, ledger, `fix_status`
- [x] `contracts/FixRegistry.py` — read-only `fix_status(chain, address, finding)`, no payable methods

## Threat model and tests
- [x] `docs/THREAT_MODEL.md` with one offline test class per item (`python3 test/test_fixcheck.py`, 74 tests, real fetched evidence as fixtures)

## Deploy and seed
- [x] CANONICAL (1 h / 24 h), DEMO (90 s / 300 s), FixRegistry deployed from committed HEAD (`test/deploy.mjs`), `ADDRESSES.md` with full addresses, commit, sha256
- [x] All 22 checks seeded on CANONICAL, resumable from chain (`test/seed_canonical.mjs`)
- [x] DEMO runs every path: challenge win, challenge lose, inconclusive refund, no-defender fee, model decision, expiry, refusal, sweep, withdraw, withdraw twice (`test/seed_demo.mjs`)
- [x] `docs/SEEDS.md` from chain, with links and the model double-run agreement
- [x] `tools/verify_source.mjs` — all 3 contracts byte-identical to HEAD

## Frontend
- [x] Next.js + genlayer-js, Vercel project with Root Directory = frontend
- [x] Landing (live tally, specimen, 3 steps, protocol cards), protocol page (ring, sortable/filterable table), finding page (diff plate, pinned finding, quoted lines, verdict, evidence hashes, stakes, timeline), check flow (stepper, live preview, tx states, shareable result), balance + ledger, how it works, all checks, demo
- [x] Per-finding OG images, brand kit (logo SVG + 512 PNG, favicons, OG), 48 screenshots 1440/390 light/dark from production
- [x] Lighthouse on the live site: performance 99 / 96 / 95, accessibility 100 on landing, protocol and finding pages (`docs/LIGHTHOUSE.md`)
- [x] Voiced demo 98.6 s (1080p H.264 + AAC, captions + SRT) and 42.7 s vertical cut, real data, real filing on camera (`docs/demo/`)
- [x] Design review loop over every page at 1440/390 in light and dark

## Review of seeded results
- [x] Earlier model verdicts reviewed against the fix diffs; two wrong NOT_FIXED found and the rules narrowed; earlier deployments kept under `docs/superseded/`
- [x] Attack pass (`docs/ATTACK_REPORT.md`): all nine findings fixed, 12 attack tests + 35 regression tests pass, redeployed from the final contract commit and reseeded
- [x] Second attack pass (`docs/ATTACK_REPORT_R2.md`): all twelve findings fixed, 14 round-2 attack tests + 48 regression tests pass (183 offline tests in all), redeployed from commit `7efb699`, 22 checks re-seeded; PoolTogether's Arbitrum vault is now PREDATES_FIX

## Finish
- [x] README (problem, how it works, model vs code, full addresses, seed table, known limits, how to use in 5 steps)
- [x] Push, deploy on Vercel, green Vercel check on GitHub, repository public
