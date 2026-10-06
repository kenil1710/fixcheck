"""Offline Step-0 comparison: for every candidate finding and every deployment,
extract the named function from the audited commit, the fix commit and the
deployed verified source with the contract's own extractor, and classify.
   python3 tools/research_compare.py docs/research/candidates.json > docs/research/compare.json"""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
import rc, solfn

def classify(dep, aud, fix):
    if not dep["ok"]:
        return "INCONCLUSIVE:" + dep["why"]
    if fix and fix["ok"] and dep["canon"] == fix["canon"]:
        return "IDENTICAL_TO_FIX"
    if aud["ok"] and dep["canon"] == aud["canon"]:
        return "IDENTICAL_TO_VULNERABLE"
    return "CHANGED"

cands = json.load(open(sys.argv[1]))
rows = []
for proto in cands:
    report = rc.get(proto["report"])
    for f in proto["findings"]:
        aud_src = rc.get(f["audited_url"]); fix_src = rc.get(f["fix_url"]) if f.get("fix_url") else None
        fb = solfn.basename(f["audited_url"])
        aud = solfn.extract({fb: aud_src}, fb, f["fn"])
        fix = solfn.extract({fb: fix_src}, fb, f["fn"]) if fix_src else None
        for chain, addr in f["deployments"]:
            d = rc.deployed_sources(chain, addr)
            docs = rc.get(proto["docs"][chain])
            in_docs = addr.lower() in docs.lower()
            files = d["files"]
            dep = solfn.extract(files, fb, f["fn"]) if files else {"ok": False, "why": "UNVERIFIED"}
            via = ""
            if not dep["ok"] and dep["why"] == "FILE_NOT_FOUND" and d.get("impls"):
                via = d["impls"][0]
                d2 = rc.deployed_sources(chain, via)
                dep = solfn.extract(d2["files"], fb, f["fn"]) if d2["files"] else {"ok": False, "why": "UNVERIFIED"}
            sec = solfn.finding_section(report, f["id"])
            named = sec["ok"] and sec["text"].find(f["fn"]) >= 0
            row = dict(protocol=proto["protocol"], id=f["id"], fn=f["fn"], chain=chain, address=addr, impl=via,
                       report_ok=sec["ok"], fn_named=named, title=sec.get("title", ""),
                       verified=d["verified"], in_docs=in_docs, audited_ok=aud["ok"], fix_ok=bool(fix and fix["ok"]),
                       fix_differs=bool(fix and fix["ok"] and aud["ok"] and fix["canon"] != aud["canon"]),
                       result=classify(dep, aud, fix))
            rows.append(row)
            print(f"{row['protocol'][:14]:14} {row['id']:5} {row['fn'][:26]:26} {chain:9} {addr[:10]} rep={int(row['report_ok'])} named={int(named)} v={int(row['verified'])} docs={int(in_docs)} fixdiff={int(row['fix_differs'])} {row['result']}", file=sys.stderr)
json.dump(rows, sys.stdout, indent=1)
