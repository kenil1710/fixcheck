/** Generated from deployments.json (tools/addresses_md.py keeps both in step). */
export const DEPLOYMENTS = {
  canonical: { address: "0x6D4390521e584b71f29A7E97E0411c6141795cF3" as `0x${string}`, counterWindowS: 3600, decideWindowS: 86400, label: "Canonical" },
  demo: { address: "0xd086D592522bcdC4B4eB15AFF23BB5AD9E203f56" as `0x${string}`, counterWindowS: 90, decideWindowS: 300, label: "Demo" },
} as const;
export const REGISTRY_ADDRESS = "0xbdA30Ea646a6a82425db21559162923b2d833339" as `0x${string}`;
export const COMMIT = "1dc7e589448d519e4ac916f3b466a0195f15d9a8";
export const EXPLORER = "https://explorer-studio-dev.genlayer.com";
export type Deployment = keyof typeof DEPLOYMENTS;
