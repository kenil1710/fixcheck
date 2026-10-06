"""Markdown tables for docs/RESEARCH.md from docs/research/{seeds,compare}.json."""
import json, collections
seeds = json.load(open("docs/research/seeds.json"))
rows = json.load(open("docs/research/compare.json"))
def short(a): return a[:6] + "…" + a[-4:]
def rep(u):
    p = u.split("/"); return f"[{p[4]}@{p[5][:7]}]({u})"
print("| # | Protocol | Finding | Function | Chain | Deployed address | Audited commit | Fix commit | Offline result |")
print("|---|---|---|---|---|---|---|---|---|")
for i, s in enumerate(seeds, 1):
    a = s["audited_url"].split("/"); f = s["fix_url"].split("/")
    print(f"| {i} | {s['protocol']} | {s['finding_id']} | `{s['function']}` | {s['chain']} | `{s['address']}`{' → impl `'+s['impl']+'`' if s['impl'] else ''} | [{a[3]}@{a[5][:7]}]({s['audited_url']}) | [{f[3]}/{f[4]}@{f[5][:7]}]({s['fix_url']}) | {s['offline']} |")
print()
c = collections.Counter(r["result"].split(":")[0] for r in rows)
print("All rows:", dict(c))
print()
print("| Protocol | Finding | Function | ethereum | optimism | base | arbitrum |")
print("|---|---|---|---|---|---|---|")
by = collections.OrderedDict()
for r in rows: by.setdefault((r["protocol"], r["id"], r["fn"]), {})[r["chain"]] = r["result"].replace("IDENTICAL_TO_", "=").replace("INCONCLUSIVE:", "?")
for (p, i, fn), m in by.items():
    print(f"| {p} | {i} | `{fn}` | " + " | ".join(m.get(ch, "") for ch in ("ethereum", "optimism", "base", "arbitrum")) + " |")
