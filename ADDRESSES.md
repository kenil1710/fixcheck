# Addresses

Network: GenLayer **Studio Dev** (chain id 61997), explorer https://explorer-studio-dev.genlayer.com/

Every contract was deployed with the bytes of `git show <commit>:<file>` (never the working tree). `node tools/verify_source.mjs` reads the code back from the chain and compares it byte for byte with HEAD.

| Contract | Address | File | Commit | sha256 | Constructor | Deploy tx |
|---|---|---|---|---|---|---|
| FixCheck | `0xAE0e6f85D9C41027F5d0B03E4ED4Ae5A07B903e6` | contracts/FixCheck.py | `4cf0bc4938b4192395d15f5389a62b667a94f2d6` | `a51256535e497509b45ef7a9ad09a6acfb860ab91b20065422546ca55e5e91c1` | `["CANONICAL",3600,86400,200,"0x8bfB2761bA064D3F829F382f444867EE10294b1C",28800]` | `0x8ea5701baede2348cc3cb1575d8206a9888b97d7e145a730ca8636c90cd847ec` |
| FixCheckDemo | `0xa2d6fCf5006e912197618c529C8612C4204B5A2a` | contracts/FixCheck.py | `4cf0bc4938b4192395d15f5389a62b667a94f2d6` | `a51256535e497509b45ef7a9ad09a6acfb860ab91b20065422546ca55e5e91c1` | `["DEMO",90,300,200,"0x8bfB2761bA064D3F829F382f444867EE10294b1C",600]` | `0x5f328eb80bf261aa52c79ec2a0e3bad24c96d5fa634c9774986f878d9631a983` |
| FixStatus | `0x30dF4Fb5A884645a07D56F0202DeD370D5195046` | contracts/FixStatus.py | `4cf0bc4938b4192395d15f5389a62b667a94f2d6` | `fc573fbf81dbf2d502d2fde6891428d748f66dbff8a5af69935899c63c5b617d` | `["0xAE0e6f85D9C41027F5d0B03E4ED4Ae5A07B903e6"]` | `0x85446664a23d77c2382cf07f765fb679a21b9c0e51b461efd29cb2a72b27ab11` |
| FixGate | `0xa84D869b9Cd82fB247A5d5c2A9F375627DC7BCB8` | contracts/FixGate.py | `4cf0bc4938b4192395d15f5389a62b667a94f2d6` | `66f0117810acda22c16177f0e9feaa21634f463000641869fe24272bcf244a83` | `["0x30dF4Fb5A884645a07D56F0202DeD370D5195046"]` | `0x3c0db8e3ef5ec5cb1376593e9eb8a855adbf74a56d13fb2a8d0b31545e0c7a09` |

Earlier deployments, each with a one-line reason: [docs/superseded/](docs/superseded/README.md).
