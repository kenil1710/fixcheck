/** Writes ADDRESSES.md from deployments.json.   node tools/addresses_md.mjs */
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname;
const d = JSON.parse(readFileSync(root + "deployments.json", "utf8"));
let md = `# Addresses\n\nNetwork: GenLayer **Studio Dev** (chain id ${d.chain_id}), explorer ${d.explorer}\n\nEvery contract was deployed with the bytes of \`git show <commit>:<file>\` (never the working tree). \`node tools/verify_source.mjs\` reads the code back from the chain and compares it byte for byte with HEAD.\n\n| Contract | Address | File | Commit | sha256 | Constructor | Deploy tx |\n|---|---|---|---|---|---|---|\n`;
for (const [n, c] of Object.entries(d.contracts)) md += `| ${n} | \`${c.address}\` | ${c.file} | \`${c.commit}\` | \`${c.sha256}\` | \`${JSON.stringify(c.constructor_args)}\` | \`${c.deploy_tx}\` |\n`;
if (false && d.superseded?.length) {
  md += `\n## Superseded\n\nKept on chain and readable; not used by the app.\n\n| Contract | Address | Commit | Superseded by | Why |\n|---|---|---|---|---|\n`;
  for (const c of d.superseded) md += `| ${c.name} | \`${c.address}\` | \`${c.commit}\` | \`${c.superseded_by}\` | ${c.why} |\n`;
}
md += `\nEarlier deployments, each with a one-line reason: [docs/superseded/](docs/superseded/README.md).\n`;
writeFileSync(root + "ADDRESSES.md", md);
// README contracts table
const rd = readFileSync(root + "README.md", "utf8");
const a = rd.indexOf("## Contracts (Studio Dev, chain 61997)\n\n") + "## Contracts (Studio Dev, chain 61997)\n\n".length;
const b = rd.indexOf("\n\nOther apps read verdicts");
const c = d.contracts;
const table = `| Contract | Address |\n|---|---|\n| FixCheck — canonical (1 h counter, 24 h decide) | \`${c.FixCheck.address}\` |\n| FixCheck — demo (90 s counter, 300 s decide) | \`${c.FixCheckDemo.address}\` |\n| FixRegistry — read-only consumer | \`${c.FixRegistry.address}\` |\n\nDeployed from commit \`${c.FixCheck.commit}\` with the bytes of \`git show <commit>:<file>\`; \`node tools/verify_source.mjs\` reads the code back from the chain and confirms all three are byte-identical to HEAD. sha256 and deploy transactions: [\`ADDRESSES.md\`](ADDRESSES.md). Explorer: https://explorer-studio-dev.genlayer.com/`;
writeFileSync(root + "README.md", rd.slice(0, a) + table + rd.slice(b));
console.log(md);
// frontend constants
writeFileSync(root + "frontend/src/lib/deployments.ts", `/** Generated from deployments.json (tools/addresses_md.mjs). */
export const DEPLOYMENTS = {
  canonical: { address: "${c.FixCheck.address}" as \`0x\${string}\`, counterWindowS: ${c.FixCheck.constructor_args[1]}, decideWindowS: ${c.FixCheck.constructor_args[2]}, label: "Canonical" },
  demo: { address: "${c.FixCheckDemo.address}" as \`0x\${string}\`, counterWindowS: ${c.FixCheckDemo.constructor_args[1]}, decideWindowS: ${c.FixCheckDemo.constructor_args[2]}, label: "Demo" },
} as const;
export const REGISTRY_ADDRESS = "${c.FixRegistry.address}" as \`0x\${string}\`;
export const COMMIT = "${c.FixCheck.commit}";
export const EXPLORER = "https://explorer-studio-dev.genlayer.com";
export type Deployment = keyof typeof DEPLOYMENTS;
`);
