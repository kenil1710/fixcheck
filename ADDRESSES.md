# Addresses

Network: GenLayer **Studio Dev** (chain id 61997), explorer https://explorer-studio-dev.genlayer.com/

Every contract was deployed with the bytes of `git show <commit>:<file>` (never the working tree). `node tools/verify_source.mjs` reads the code back from the chain and compares it byte for byte with HEAD.

| Contract | Address | File | Commit | sha256 | Constructor | Deploy tx |
|---|---|---|---|---|---|---|
| FixCheck | `0x65Fe440d63437e14fB9e990D1D0Dc283EE40bb56` | contracts/FixCheck.py | `93de7be2deb171cbb0a19b7b47fc280938da520b` | `e66fb8a621cfde3d2e2dff5d819d3240cf97a0440cef5622e6e47155abc23078` | `["CANONICAL",3600,86400,200,"0x8bfB2761bA064D3F829F382f444867EE10294b1C"]` | `0xab068c6f505cd4b430031d6ba1759cb0de1d495fb6708498314591bd0274a6c7` |
| FixCheckDemo | `0x66E008fc08414ecF423e59482c20A046FAd7A01c` | contracts/FixCheck.py | `93de7be2deb171cbb0a19b7b47fc280938da520b` | `e66fb8a621cfde3d2e2dff5d819d3240cf97a0440cef5622e6e47155abc23078` | `["DEMO",90,300,200,"0x8bfB2761bA064D3F829F382f444867EE10294b1C"]` | `0x35a507b7695ec9f52ec10b6370dcb6790fa4dfa850cb9980cf19ca969da80fd7` |
| FixRegistry | `0x90f8c37976D166364BD563f71156aEd187CAc9d2` | contracts/FixRegistry.py | `93de7be2deb171cbb0a19b7b47fc280938da520b` | `6d99a876d5dadfd4bc4f9e6864dd2ade203af9a49839d100adb793cb7b97330a` | `["0x65Fe440d63437e14fB9e990D1D0Dc283EE40bb56"]` | `0xf7a7e8c1f15cdb346985fbe759c8cae388bfbc94a80eab048b23e2153c95beea` |

Earlier deployments, each with a one-line reason: [docs/superseded/](docs/superseded/README.md).
