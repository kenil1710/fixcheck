/** Generated from deployments.json (tools/addresses_md.mjs). */
export const DEPLOYMENTS = {
  canonical: { address: "0xAE0e6f85D9C41027F5d0B03E4ED4Ae5A07B903e6" as `0x${string}`, counterWindowS: 3600, decideWindowS: 86400, label: "Canonical" },
  demo: { address: "0xa2d6fCf5006e912197618c529C8612C4204B5A2a" as `0x${string}`, counterWindowS: 90, decideWindowS: 300, label: "Demo" },
} as const;
export const FIXSTATUS_ADDRESS = "0x30dF4Fb5A884645a07D56F0202DeD370D5195046" as `0x${string}`;
export const FIXGATE_ADDRESS = "0xa84D869b9Cd82fB247A5d5c2A9F375627DC7BCB8" as `0x${string}`;
export const SCORECARD_WINDOW_S = 28800;
export const COMMIT = "4cf0bc4938b4192395d15f5389a62b667a94f2d6";
export const EXPLORER = "https://explorer-studio-dev.genlayer.com";
export type Deployment = keyof typeof DEPLOYMENTS;
