/** Generated from deployments.json (tools/addresses_md.mjs). */
export const DEPLOYMENTS = {
  canonical: { address: "0x893f96A5c72771D40F0bB55035A013a77159cc33" as `0x${string}`, counterWindowS: 3600, decideWindowS: 86400, label: "Canonical" },
  demo: { address: "0xF5133724f0dffF025ceA878881285aE681d71c89" as `0x${string}`, counterWindowS: 90, decideWindowS: 300, label: "Demo" },
} as const;
export const REGISTRY_ADDRESS = "0x50a60867153d3C63F322340dcEfe492bdd0d8D04" as `0x${string}`;
export const COMMIT = "7efb699928b20cdd580b534a58609da1c1defe08";
export const EXPLORER = "https://explorer-studio-dev.genlayer.com";
export type Deployment = keyof typeof DEPLOYMENTS;
