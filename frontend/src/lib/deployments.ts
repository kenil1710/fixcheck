/** Generated from deployments.json (tools/addresses_md.mjs). */
export const DEPLOYMENTS = {
  canonical: { address: "0x525D730a0fEe81881af646A784337e005cC4E833" as `0x${string}`, counterWindowS: 3600, decideWindowS: 86400, label: "Canonical" },
  demo: { address: "0x7bC20b8eAf5A80Ca717a5249029a75351234B24F" as `0x${string}`, counterWindowS: 90, decideWindowS: 300, label: "Demo" },
} as const;
export const REGISTRY_ADDRESS = "0xC96B4a0aAbf6902fBF1F2D2F0C6591d41D152aCf" as `0x${string}`;
export const COMMIT = "655d61e90e50a151dd84942b710d1652e7dd43fd";
export const EXPLORER = "https://explorer-studio-dev.genlayer.com";
export type Deployment = keyof typeof DEPLOYMENTS;
