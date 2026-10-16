/** Generated from deployments.json (tools/addresses_md.mjs). */
export const DEPLOYMENTS = {
  canonical: { address: "0x0ed096B1888ebbE08F268b42d528326aD65cA065" as `0x${string}`, counterWindowS: 3600, decideWindowS: 86400, label: "Canonical" },
  demo: { address: "0xf6f036F7186487655F522dB6F5dAC07E0844F7DE" as `0x${string}`, counterWindowS: 90, decideWindowS: 300, label: "Demo" },
} as const;
export const FIXSTATUS_ADDRESS = "0xFA0A5592FbE13B8b74b8f4bc8a5abf6568420B98" as `0x${string}`;
export const FIXGATE_ADDRESS = "0x0B4FB25B50800Ac454e870F80011b6f3A06335Cb" as `0x${string}`;
export const SCORECARD_WINDOW_S = 28800;
export const COMMIT = "85396d9ed6e4a0f2076bcc65c5e0d7dd9e325768";
export const EXPLORER = "https://explorer-studio-dev.genlayer.com";
export type Deployment = keyof typeof DEPLOYMENTS;
