# Addresses

Network: GenLayer **Studio Dev** (chain id 61997), explorer https://explorer-studio-dev.genlayer.com/

Every contract was deployed with the bytes of `git show <commit>:<file>` (never the working tree). `node tools/verify_source.mjs` reads the code back from the chain and compares it byte for byte with HEAD.

| Contract | Address | File | Commit | sha256 | Constructor | Deploy tx |
|---|---|---|---|---|---|---|
| FixCheck | `0x263C6a42B98E9133CF85A00A436b05C3573B88fe` | contracts/FixCheck.py | `8519168641d560b7528f3a23640c7722598c16fe` | `bea3960114625bbb53e6d7313dcc6a63aa8bcf67469067916f56f58db9ce31a0` | `["CANONICAL",3600,86400,200,"0x8bfB2761bA064D3F829F382f444867EE10294b1C"]` | `0x610ba7d18d88c431c2c5c96d3a301a1829a8daa44182992f9292e546061a3052` |
| FixCheckDemo | `0x19bc7Cb16Ce1B4F328f33d0FDfeA61297dA04f68` | contracts/FixCheck.py | `8519168641d560b7528f3a23640c7722598c16fe` | `bea3960114625bbb53e6d7313dcc6a63aa8bcf67469067916f56f58db9ce31a0` | `["DEMO",90,300,200,"0x8bfB2761bA064D3F829F382f444867EE10294b1C"]` | `0x25b0862fb14f3a1dfb1d83ad0324256340accef4d799d263e96bfcd1aeb90cec` |
| FixRegistry | `0xA37F98977f023D8C0bd17aCF1A7983E5d328d9A4` | contracts/FixRegistry.py | `8519168641d560b7528f3a23640c7722598c16fe` | `6d99a876d5dadfd4bc4f9e6864dd2ade203af9a49839d100adb793cb7b97330a` | `["0x263C6a42B98E9133CF85A00A436b05C3573B88fe"]` | `0xbe6ba14e0ce79638cca04ec726f154278e271ac37d1bf92c37586ed1ee2a2525` |

Earlier deployments, each with a one-line reason: [docs/superseded/](docs/superseded/README.md).
