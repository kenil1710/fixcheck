/** Display names for keys the contract derives from pinned URLs. Unknown keys still render (as the key). */
export type ProtocolMeta = { name: string; slug: string; blurb: string; site?: string };

export const PROTOCOLS: Record<string, ProtocolMeta> = {
  "github:generationsoftware/pt-dev-docs": { name: "PoolTogether V5", slug: "pooltogether", blurb: "Prize savings protocol. Immutable contracts on Ethereum, OP Mainnet, Base and Arbitrum.", site: "https://dev.pooltogether.com" },
  "github:mellow-finance/docs": { name: "Mellow Flexible Vaults", slug: "mellow", blurb: "Modular vault framework. Upgradeable implementations on Ethereum.", site: "https://docs.mellow.finance" },
  "github:cap-labs-dev/cap-docs": { name: "Cap", slug: "cap", blurb: "Stablecoin backed by delegated restaking. Proxied lending pool on Ethereum.", site: "https://docs.cap.app" },
  "github:ethereum-optimism/superchain-registry": { name: "OP Stack fault proofs", slug: "op-stack", blurb: "Optimism's dispute game contracts, listed in the Superchain Registry.", site: "https://docs.optimism.io" },
};

export const FIRMS: Record<string, string> = {
  "github:sherlock-audit": "Sherlock",
  "github:code-423n4": "Code4rena",
  "web:code4rena.com": "Code4rena",
  "web:cantina.xyz": "Cantina",
  "github:spearbit": "Spearbit",
};

export function protocolMeta(key: string): ProtocolMeta {
  return PROTOCOLS[key] ?? { name: key.replace(/^github:|^web:/, ""), slug: encodeURIComponent(key), blurb: "" };
}
export function protocolKeyFromSlug(slug: string): string {
  const s = decodeURIComponent(slug);
  for (const [k, v] of Object.entries(PROTOCOLS)) if (v.slug === s) return k;
  return s;
}
export function firmName(key: string): string {
  return FIRMS[key] ?? key.replace(/^github:|^web:/, "");
}

export const CHAIN_NAMES: Record<string, string> = { ethereum: "Ethereum", optimism: "OP Mainnet", base: "Base", arbitrum: "Arbitrum One", polygon: "Polygon" };
export const CHAIN_EXPLORERS: Record<string, string> = {
  ethereum: "https://eth.blockscout.com", optimism: "https://explorer.optimism.io", base: "https://base.blockscout.com",
  arbitrum: "https://arbitrum.blockscout.com", polygon: "https://polygon.blockscout.com",
};
export function severityOf(findingId: string): { label: string; rank: number } {
  const c = findingId.trim()[0]?.toUpperCase();
  if (c === "C") return { label: "Critical", rank: 0 };
  if (c === "H") return { label: "High", rank: 1 };
  if (c === "M") return { label: "Medium", rank: 2 };
  if (c === "L") return { label: "Low", rank: 3 };
  return { label: "Info", rank: 4 };
}
