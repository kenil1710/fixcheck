import { createRequire } from "node:module";
const { createClient } = createRequire(new URL("../test/package.json", import.meta.url))("genlayer-js");
const { studioDevnet } = createRequire(new URL("../test/package.json", import.meta.url))("genlayer-js/chains");
const c = createClient({ chain: { ...studioDevnet, rpcUrls: { default: { http: ["https://fixcheck-ledger.vercel.app/api/rpc"] } } } });
const plain = (v) => v instanceof Map ? Object.fromEntries([...v].map(([k, x]) => [k, plain(x)])) : Array.isArray(v) ? v.map(plain) : typeof v === "bigint" ? Number(v) : v;
const [addr, fn, ...args] = process.argv.slice(2);
console.log(JSON.stringify(plain(await c.readContract({ address: addr, functionName: fn, args: args.map((a) => /^\d+$/.test(a) ? Number(a) : a) }))).slice(0, 3000));
