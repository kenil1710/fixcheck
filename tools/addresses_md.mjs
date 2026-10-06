/** Writes ADDRESSES.md from deployments.json.   node tools/addresses_md.mjs */
import { readFileSync, writeFileSync } from "node:fs";
const root = new URL("..", import.meta.url).pathname;
const d = JSON.parse(readFileSync(root + "deployments.json", "utf8"));
let md = `# Addresses\n\nNetwork: GenLayer **Studio Dev** (chain id ${d.chain_id}), explorer ${d.explorer}\n\nEvery contract was deployed with the bytes of \`git show <commit>:<file>\` (never the working tree). \`node tools/verify_source.mjs\` reads the code back from the chain and compares it byte for byte with HEAD.\n\n| Contract | Address | File | Commit | sha256 | Constructor | Deploy tx |\n|---|---|---|---|---|---|---|\n`;
for (const [n, c] of Object.entries(d.contracts)) md += `| ${n} | \`${c.address}\` | ${c.file} | \`${c.commit}\` | \`${c.sha256}\` | \`${JSON.stringify(c.constructor_args)}\` | \`${c.deploy_tx}\` |\n`;
writeFileSync(root + "ADDRESSES.md", md);
console.log(md);
