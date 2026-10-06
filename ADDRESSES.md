# Addresses

Network: GenLayer **Studio Dev** (chain id 61997), explorer https://explorer-studio-dev.genlayer.com/

Every contract was deployed with the bytes of `git show <commit>:<file>` (never the working tree). `node tools/verify_source.mjs` reads the code back from the chain and compares it byte for byte with HEAD.

| Contract | Address | File | Commit | sha256 | Constructor | Deploy tx |
|---|---|---|---|---|---|---|
| FixCheck | `0x525D730a0fEe81881af646A784337e005cC4E833` | contracts/FixCheck.py | `655d61e90e50a151dd84942b710d1652e7dd43fd` | `107501bf56c3e96897f0c252eb497a016a9d1a3bb6016b73cac44c3ea336a030` | `["CANONICAL",3600,86400,200,"0x8bfB2761bA064D3F829F382f444867EE10294b1C"]` | `0x1efe5816e8fc0e498b0bd09faab76d4f0a1e0162ad2d1628cb7af720854df9e0` |
| FixCheckDemo | `0x7bC20b8eAf5A80Ca717a5249029a75351234B24F` | contracts/FixCheck.py | `655d61e90e50a151dd84942b710d1652e7dd43fd` | `107501bf56c3e96897f0c252eb497a016a9d1a3bb6016b73cac44c3ea336a030` | `["DEMO",90,300,200,"0x8bfB2761bA064D3F829F382f444867EE10294b1C"]` | `0x6b25b32c471b3995952ad90e425ad3e92cbe2b1ce0bc91a710c6333f40297dd6` |
| FixRegistry | `0xC96B4a0aAbf6902fBF1F2D2F0C6591d41D152aCf` | contracts/FixRegistry.py | `655d61e90e50a151dd84942b710d1652e7dd43fd` | `dac4e78b0a0c49ef8d9b1a50aa5a74f37a99d43f3f4f8d916b032003a2f8a541` | `["0x525D730a0fEe81881af646A784337e005cC4E833"]` | `0xe7138c629123ac436866dce33b31b657b0ac85805b6c5270aa9f5ec388adadba` |

## Superseded

Kept on chain and readable; not used by the app.

| Contract | Address | Commit | Superseded by | Why |
|---|---|---|---|---|
| FixCheck | `0x6D4390521e584b71f29A7E97E0411c6141795cF3` | `1dc7e589448d519e4ac916f3b466a0195f15d9a8` | `0x525D730a0fEe81881af646A784337e005cC4E833` | v1.1: v1.0 model returned NOT_FIXED for two Mellow functions that contain the fix |
| FixCheckDemo | `0xd086D592522bcdC4B4eB15AFF23BB5AD9E203f56` | `1dc7e589448d519e4ac916f3b466a0195f15d9a8` | `0x7bC20b8eAf5A80Ca717a5249029a75351234B24F` | v1.1: v1.0 model returned NOT_FIXED for two Mellow functions that contain the fix |
| FixRegistry | `0xbdA30Ea646a6a82425db21559162923b2d833339` | `1dc7e589448d519e4ac916f3b466a0195f15d9a8` | `0xC96B4a0aAbf6902fBF1F2D2F0C6591d41D152aCf` | v1.1: v1.0 model returned NOT_FIXED for two Mellow functions that contain the fix |
