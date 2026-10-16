# Addresses

Network: GenLayer **Studio Dev** (chain id 61997), explorer https://explorer-studio-dev.genlayer.com/

Every contract was deployed with the bytes of `git show <commit>:<file>` (never the working tree). `node tools/verify_source.mjs` reads the code back from the chain and compares it byte for byte with HEAD.

| Contract | Address | File | Commit | sha256 | Constructor | Deploy tx |
|---|---|---|---|---|---|---|
| FixCheck | `0x0ed096B1888ebbE08F268b42d528326aD65cA065` | contracts/FixCheck.py | `85396d9ed6e4a0f2076bcc65c5e0d7dd9e325768` | `0729be14ffd78f3a5715b55a70b2046492deb63e58999b4d10bdb9505beef89a` | `["CANONICAL",3600,86400,200,"0x8bfB2761bA064D3F829F382f444867EE10294b1C",28800]` | `0xadae6b3a2f5c30c61ba8fb7e41722e7160209f35b6aebe9d32c0b98461fbd485` |
| FixCheckDemo | `0xf6f036F7186487655F522dB6F5dAC07E0844F7DE` | contracts/FixCheck.py | `85396d9ed6e4a0f2076bcc65c5e0d7dd9e325768` | `0729be14ffd78f3a5715b55a70b2046492deb63e58999b4d10bdb9505beef89a` | `["DEMO",90,300,200,"0x8bfB2761bA064D3F829F382f444867EE10294b1C",600]` | `0x29434054357c4f34f8fa4a437279dbd74882221b8ffb2e4b54ef6c26bd06b272` |
| FixStatus | `0xFA0A5592FbE13B8b74b8f4bc8a5abf6568420B98` | contracts/FixStatus.py | `85396d9ed6e4a0f2076bcc65c5e0d7dd9e325768` | `fc573fbf81dbf2d502d2fde6891428d748f66dbff8a5af69935899c63c5b617d` | `["0x0ed096B1888ebbE08F268b42d528326aD65cA065"]` | `0x3e6b012dd264a4b8097466ac4c16fc4f0141d74651b80f9f7bd8dbd0b2e7eb3e` |
| FixGate | `0x0B4FB25B50800Ac454e870F80011b6f3A06335Cb` | contracts/FixGate.py | `85396d9ed6e4a0f2076bcc65c5e0d7dd9e325768` | `66f0117810acda22c16177f0e9feaa21634f463000641869fe24272bcf244a83` | `["0xFA0A5592FbE13B8b74b8f4bc8a5abf6568420B98"]` | `0xbe2f030361b8e2b09d80104f9882cfb4fc5d0f1e798db281a9fa11ecf560a5ce` |

Earlier deployments, each with a one-line reason: [docs/superseded/](docs/superseded/README.md).
