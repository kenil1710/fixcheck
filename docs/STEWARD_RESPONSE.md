# Steward response

Reply to the round-3 steward request. 876 characters, plain ASCII (count excludes this header and the code fence).

```text
Thanks, all three are fixed.
1) Pinned Sherlock report and docs commits must be on a branch of the repo named in the URL (GitHub branch_commits; fork or tag-only commits are refused, no state written; proof stored).
2) Proxy date = latest of proxy creation, implementation creation and the last EIP-1967 Upgraded event at the slot block. Unknown switch -> INCONCLUSIVE; new proxy or rollback onto a pre-fix implementation after the fix -> NOT_FIXED.
3) The 3 xfails now pass, plus regression tests: 205 tests, 0 xfail.
Deployed from 93de7be (byte-identical): FixCheck 0x65Fe440d63437e14fB9e990D1D0Dc283EE40bb56, demo 0x66E008fc08414ecF423e59482c20A046FAd7A01c, FixRegistry 0x90f8c37976D166364BD563f71156aEd187CAc9d2.
Live proof: https://github.com/kenil1710/fixcheck/blob/main/docs/DEPLOYED_VERIFICATION.md
Diff: https://github.com/kenil1710/fixcheck/compare/2b0f979...9e1aa72
```
