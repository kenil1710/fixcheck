/** Generated from deployments.json (tools/addresses_md.mjs). */
export const DEPLOYMENTS = {
  canonical: { address: "0x263C6a42B98E9133CF85A00A436b05C3573B88fe" as `0x${string}`, counterWindowS: 3600, decideWindowS: 86400, label: "Canonical" },
  demo: { address: "0x19bc7Cb16Ce1B4F328f33d0FDfeA61297dA04f68" as `0x${string}`, counterWindowS: 90, decideWindowS: 300, label: "Demo" },
} as const;
export const REGISTRY_ADDRESS = "0xA37F98977f023D8C0bd17aCF1A7983E5d328d9A4" as `0x${string}`;
export const COMMIT = "8519168641d560b7528f3a23640c7722598c16fe";
export const EXPLORER = "https://explorer-studio-dev.genlayer.com";
export type Deployment = keyof typeof DEPLOYMENTS;
