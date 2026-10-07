# Addresses

Network: GenLayer **Studio Dev** (chain id 61997), explorer https://explorer-studio-dev.genlayer.com/

Every contract was deployed with the bytes of `git show <commit>:<file>` (never the working tree). `node tools/verify_source.mjs` reads the code back from the chain and compares it byte for byte with HEAD.

| Contract | Address | File | Commit | sha256 | Constructor | Deploy tx |
|---|---|---|---|---|---|---|
| FixCheck | `0x2d7b3C465D6478Db4438999b1FD0340A54256364` | contracts/FixCheck.py | `0c20168e94b47e6f3d1ebf13638c7115137f9e10` | `0344592ef7bd06a13f8e8c39eb42925506eb1cc364e9badfa77ffaaad336d576` | `["CANONICAL",3600,86400,200,"0x8bfB2761bA064D3F829F382f444867EE10294b1C"]` | `0x80460db8ddf136f02dda197ce5572069bb32e61bc412d577ff0963601766888b` |
| FixCheckDemo | `0x78D31dbB13e8348A2278b64A84eBfE129607fd91` | contracts/FixCheck.py | `0c20168e94b47e6f3d1ebf13638c7115137f9e10` | `0344592ef7bd06a13f8e8c39eb42925506eb1cc364e9badfa77ffaaad336d576` | `["DEMO",90,300,200,"0x8bfB2761bA064D3F829F382f444867EE10294b1C"]` | `0xb0dbb739f72fec8ed175d484d64f3b91e0a61cae260440cf891c3d049c402338` |
| FixRegistry | `0x8E93Ab199E737CF022F5D4cE0f171d0e68815E49` | contracts/FixRegistry.py | `0c20168e94b47e6f3d1ebf13638c7115137f9e10` | `36a8801749b1cfab86777ff19b7ae6d0b10b2dbf96fa22b72bab6f06dc406812` | `["0x2d7b3C465D6478Db4438999b1FD0340A54256364"]` | `0x966be28f115e34d233b77f04d54c48af7a025b55b35a2e60a799979378308019` |

Earlier deployments, each with a one-line reason: [docs/superseded/](docs/superseded/README.md).
