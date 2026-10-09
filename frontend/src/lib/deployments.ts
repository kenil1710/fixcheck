/** Generated from deployments.json (tools/addresses_md.mjs). */
export const DEPLOYMENTS = {
  canonical: { address: "0x65Fe440d63437e14fB9e990D1D0Dc283EE40bb56" as `0x${string}`, counterWindowS: 3600, decideWindowS: 86400, label: "Canonical" },
  demo: { address: "0x66E008fc08414ecF423e59482c20A046FAd7A01c" as `0x${string}`, counterWindowS: 90, decideWindowS: 300, label: "Demo" },
} as const;
export const REGISTRY_ADDRESS = "0x90f8c37976D166364BD563f71156aEd187CAc9d2" as `0x${string}`;
export const COMMIT = "93de7be2deb171cbb0a19b7b47fc280938da520b";
export const EXPLORER = "https://explorer-studio-dev.genlayer.com";
export type Deployment = keyof typeof DEPLOYMENTS;
