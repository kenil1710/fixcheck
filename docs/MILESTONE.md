# FixCheck v2 milestone

## BASE proof

BASE = `27f30c059707f982771a6548f7e337a71ec85ed9` (the commit the accepted submission was reviewed at: the resubmission compare ended there; the contracts were deployed from `8519168` and the steward reply `50466cc` changes docs only). `contracts/` is identical at `8519168`, `27f30c0` and `50466cc`.

`node tools/base_proof.mjs` reads each v1 address back with `gen_getContractCode` and compares it byte for byte with `git show 27f30c0:<file>`:

| Contract | Address | File | sha256 on chain | sha256 at BASE | Result |
|---|---|---|---|---|---|
| FixCheck (canonical) | `0x263C6a42B98E9133CF85A00A436b05C3573B88fe` | contracts/FixCheck.py | `bea3960114625bbb53e6d7313dcc6a63aa8bcf67469067916f56f58db9ce31a0` | `bea3960114625bbb53e6d7313dcc6a63aa8bcf67469067916f56f58db9ce31a0` | byte-identical |
| FixCheck (demo) | `0x19bc7Cb16Ce1B4F328f33d0FDfeA61297dA04f68` | contracts/FixCheck.py | `bea3960114625bbb53e6d7313dcc6a63aa8bcf67469067916f56f58db9ce31a0` | `bea3960114625bbb53e6d7313dcc6a63aa8bcf67469067916f56f58db9ce31a0` | byte-identical |
| FixRegistry | `0xA37F98977f023D8C0bd17aCF1A7983E5d328d9A4` | contracts/FixRegistry.py | `6d99a876d5dadfd4bc4f9e6864dd2ade203af9a49839d100adb793cb7b97330a` | `6d99a876d5dadfd4bc4f9e6864dd2ade203af9a49839d100adb793cb7b97330a` | byte-identical |

FixCheck sha256 `bea3960114625bbb53e6d7313dcc6a63aa8bcf67469067916f56f58db9ce31a0` (both addresses); FixRegistry sha256 `6d99a876d5dadfd4bc4f9e6864dd2ade203af9a49839d100adb793cb7b97330a`.

The v1 deployment is left untouched and is listed in [`docs/superseded/README.md`](superseded/README.md).

_The rest of this document (compare link, what changed, tests, proofs) is filled in as v2 lands._
