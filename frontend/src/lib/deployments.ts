/** Generated from deployments.json (tools/addresses_md.mjs). */
export const DEPLOYMENTS = {
  canonical: { address: "0x2d7b3C465D6478Db4438999b1FD0340A54256364" as `0x${string}`, counterWindowS: 3600, decideWindowS: 86400, label: "Canonical" },
  demo: { address: "0x78D31dbB13e8348A2278b64A84eBfE129607fd91" as `0x${string}`, counterWindowS: 90, decideWindowS: 300, label: "Demo" },
} as const;
export const REGISTRY_ADDRESS = "0x8E93Ab199E737CF022F5D4cE0f171d0e68815E49" as `0x${string}`;
export const COMMIT = "0c20168e94b47e6f3d1ebf13638c7115137f9e10";
export const EXPLORER = "https://explorer-studio-dev.genlayer.com";
export type Deployment = keyof typeof DEPLOYMENTS;
