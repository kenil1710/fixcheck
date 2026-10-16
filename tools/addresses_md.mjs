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
if (a < 0 || b < 0) throw new Error("README contracts section not found");
const c = d.contracts;
const table = `| Contract | Address |\n|---|---|\n| FixCheck 2.0.0 — canonical (1 h counter, 24 h decide, 8 h to fill a scorecard) | \`${c.FixCheck.address}\` |\n| FixCheck 2.0.0 — demo (90 s counter, 300 s decide, 10 min scorecards) | \`${c.FixCheckDemo.address}\` |\n| FixStatus — read-only consumer (\`is_fixed\`, \`status\`, \`protocol_score\`) | \`${c.FixStatus.address}\` |\n| FixGate — demo consumer (refuses NOT_FIXED / REGRESSED) | \`${c.FixGate.address}\` |\n\nAll four deployed from commit \`${c.FixCheck.commit}\` with the bytes of \`git show <commit>:<file>\`; \`node tools/verify_source.mjs\` reads the code back from the chain (\`gen_getContractCode\`) and confirms each is byte-identical to HEAD. sha256 and deploy transactions: [\`ADDRESSES.md\`](ADDRESSES.md). Explorer: https://explorer-studio-dev.genlayer.com/`;
writeFileSync(root + "README.md", rd.slice(0, a) + table + rd.slice(b));
console.log(md);
// frontend constants
writeFileSync(root + "frontend/src/lib/deployments.ts", `/** Generated from deployments.json (tools/addresses_md.mjs). */
export const DEPLOYMENTS = {
  canonical: { address: "${c.FixCheck.address}" as \`0x\${string}\`, counterWindowS: ${c.FixCheck.constructor_args[1]}, decideWindowS: ${c.FixCheck.constructor_args[2]}, label: "Canonical" },
  demo: { address: "${c.FixCheckDemo.address}" as \`0x\${string}\`, counterWindowS: ${c.FixCheckDemo.constructor_args[1]}, decideWindowS: ${c.FixCheckDemo.constructor_args[2]}, label: "Demo" },
} as const;
export const FIXSTATUS_ADDRESS = "${c.FixStatus.address}" as \`0x\${string}\`;
export const FIXGATE_ADDRESS = "${c.FixGate.address}" as \`0x\${string}\`;
export const SCORECARD_WINDOW_S = ${c.FixCheck.constructor_args[5]};
export const COMMIT = "${c.FixCheck.commit}";
export const EXPLORER = "https://explorer-studio-dev.genlayer.com";
export type Deployment = keyof typeof DEPLOYMENTS;
`);
