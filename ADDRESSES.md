# Addresses

Network: GenLayer **Studio Dev** (chain id 61997), explorer https://explorer-studio-dev.genlayer.com/

Every contract was deployed with the bytes of `git show <commit>:<file>` (never the working tree). `node tools/verify_source.mjs` reads the code back from the chain and compares it byte for byte with HEAD.

| Contract | Address | File | Commit | sha256 | Constructor | Deploy tx |
|---|---|---|---|---|---|---|
| FixCheck | `0x6D4390521e584b71f29A7E97E0411c6141795cF3` | contracts/FixCheck.py | `1dc7e589448d519e4ac916f3b466a0195f15d9a8` | `1bd341717b07296c869fa554b43bfbf6f016ed5bd1c360108d17d6345d7fe0bc` | `["CANONICAL",3600,86400,200,"0x8bfB2761bA064D3F829F382f444867EE10294b1C"]` | `0x404adf7c083abb497d1072d850f3f9711be8d3d5de246c2412e32dc584819c1b` |
| FixCheckDemo | `0xd086D592522bcdC4B4eB15AFF23BB5AD9E203f56` | contracts/FixCheck.py | `1dc7e589448d519e4ac916f3b466a0195f15d9a8` | `1bd341717b07296c869fa554b43bfbf6f016ed5bd1c360108d17d6345d7fe0bc` | `["DEMO",90,300,200,"0x8bfB2761bA064D3F829F382f444867EE10294b1C"]` | `0xc3055ae24bbe5068cf6b4829a8b4a2eed1e8f3c67c480c785d524aa12657d67e` |
| FixRegistry | `0xbdA30Ea646a6a82425db21559162923b2d833339` | contracts/FixRegistry.py | `1dc7e589448d519e4ac916f3b466a0195f15d9a8` | `dac4e78b0a0c49ef8d9b1a50aa5a74f37a99d43f3f4f8d916b032003a2f8a541` | `["0x6D4390521e584b71f29A7E97E0411c6141795cF3"]` | `0x4997cf127c6e22b52fc9f52b39e04c83a46d3f1e51de554b3c78c7b8307918b5` |
