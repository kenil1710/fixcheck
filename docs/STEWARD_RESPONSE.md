# Steward response

Reply to the steward request, after the round-4 hardening pass. 1000 characters, plain ASCII (count excludes this header and the code fence).

```text
Thanks. All three are fixed, re-checked after a fourth attack pass.
1) Pinned Sherlock report and docs commits must be on a branch of the repo the URL names; fork/PR/tag-only commits refused, nothing stored; branch proof stored.
2) Proxy date = latest of proxy creation, implementation creation and last Upgraded event at the slot block, each confirmed by two independent RPCs. Unknown -> INCONCLUSIVE; new proxy or rollback onto pre-fix code after the fix -> NOT_FIXED.
3) The 3 xfails pass: 254 tests, 0 xfail.
Also hardened: slot block, beacon proxies, metamorphic code, status author checked on GitHub, modifiers (11 issues, ATTACK_REPORT_R4).
Deployed from 8519168 (byte-identical): FixCheck 0x263C6a42B98E9133CF85A00A436b05C3573B88fe, demo 0x19bc7Cb16Ce1B4F328f33d0FDfeA61297dA04f68, FixRegistry 0xA37F98977f023D8C0bd17aCF1A7983E5d328d9A4.
Proof: https://github.com/kenil1710/fixcheck/blob/main/docs/DEPLOYED_VERIFICATION.md
Diff: https://github.com/kenil1710/fixcheck/compare/2b0f979...FINAL00
```
