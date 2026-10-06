/**
 * Creates test/.accounts.json (gitignored): throwaway Studio Dev signing keys.
 * Existing roles are preserved unless --force is passed. Keys never leave this
 * file; scripts load them and print addresses only.
 *
 *   deployer    deploys all contracts
 *   challenger  files checks (stakes NOT_FIXED)
 *   challenger2 a second filer for duplicate / demo paths
 *   defender    counter-stakes FIXED
 *   defender2   a second defender
 *   trigger     calls the permissionless methods
 */
import { createAccount } from "genlayer-js";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const target = new URL("./.accounts.json", import.meta.url);
const force = process.argv.includes("--force");
const ROLES = ["deployer", "challenger", "challenger2", "defender", "defender2", "trigger", "probe"];
const existing = existsSync(target) && !force ? JSON.parse(readFileSync(target, "utf8")) : {};
const out = {};
for (const role of ROLES) {
  if (existing[role]?.key) { out[role] = existing[role]; continue; }
  const key = `0x${randomBytes(32).toString("hex")}`;
  out[role] = { key, address: createAccount(key).address };
}
writeFileSync(target, JSON.stringify(out, null, 2) + "\n", { mode: 0o600 });
for (const role of ROLES) console.log(`  ${role.padEnd(11)} ${out[role].address}`);
