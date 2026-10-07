# Addresses

Network: GenLayer **Studio Dev** (chain id 61997), explorer https://explorer-studio-dev.genlayer.com/

Every contract was deployed with the bytes of `git show <commit>:<file>` (never the working tree). `node tools/verify_source.mjs` reads the code back from the chain and compares it byte for byte with HEAD.

| Contract | Address | File | Commit | sha256 | Constructor | Deploy tx |
|---|---|---|---|---|---|---|
| FixCheck | `0x893f96A5c72771D40F0bB55035A013a77159cc33` | contracts/FixCheck.py | `7efb699928b20cdd580b534a58609da1c1defe08` | `9ecaac1fbb8a40a6d4ec05e354048f3f048d624b20dcaf5bb1ecc16270db65c6` | `["CANONICAL",3600,86400,200,"0x8bfB2761bA064D3F829F382f444867EE10294b1C"]` | `0xca6c44d302ef1361c79e5e9710045de0f8db84e3b502ba3de324fb746022ef00` |
| FixCheckDemo | `0xF5133724f0dffF025ceA878881285aE681d71c89` | contracts/FixCheck.py | `7efb699928b20cdd580b534a58609da1c1defe08` | `9ecaac1fbb8a40a6d4ec05e354048f3f048d624b20dcaf5bb1ecc16270db65c6` | `["DEMO",90,300,200,"0x8bfB2761bA064D3F829F382f444867EE10294b1C"]` | `0x1173147bce2b51971bb84242f95ff2c50f060a766bff3e69f60b518913896b05` |
| FixRegistry | `0x50a60867153d3C63F322340dcEfe492bdd0d8D04` | contracts/FixRegistry.py | `7efb699928b20cdd580b534a58609da1c1defe08` | `6d99a876d5dadfd4bc4f9e6864dd2ade203af9a49839d100adb793cb7b97330a` | `["0x893f96A5c72771D40F0bB55035A013a77159cc33"]` | `0x491f3cf87b089535d169fec7b0c9df966b880af33b28b355bcd6694e7fa0f707` |

Earlier deployments, each with a one-line reason: [docs/superseded/](docs/superseded/README.md).
