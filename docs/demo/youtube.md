# YouTube

**Title:** FixCheck: is the audit fix actually deployed?

**Description:**

Audit reports mark findings "Fixed". FixCheck checks, one finding at a time, whether the fixed function is what is actually running at the protocol's listed address. It runs on GenLayer: validators read the Sherlock report, the merged fix commit and the verified deployed source, and code decides whenever it can. A model is only asked when code can't settle it, must quote a line the fix added, and two runs must agree; otherwise the check is inconclusive and everyone is refunded.

Results so far, read from the contract: 22 checks of 21 real Sherlock findings. 7 fixed, 1 not fixed, 6 deployed before the audit, 1 deployed before its fix existed, 7 inconclusive. "Not fixed" is a code fact, not an exploit claim.

App: https://fixcheck-ledger.vercel.app
Code: https://github.com/kenil1710/fixcheck
Contracts (GenLayer Studio Dev): FixCheck 0x893f96A5c72771D40F0bB55035A013a77159cc33 · demo 0xF5133724f0dffF025ceA878881285aE681d71c89 · FixRegistry 0x50a60867153d3C63F322340dcEfe492bdd0d8D04

**Chapters:**

0:00 Hook
0:08 The problem
0:27 How FixCheck works
0:55 Every outcome, from the canonical contract
2:01 A live check on the demo contract
2:40 Results
2:52 Why you can trust it
3:15 Close

**Tags:** FixCheck, GenLayer, smart contract audit, Sherlock, audit findings, deployed code, Solidity, security, intelligent contracts, PoolTogether
