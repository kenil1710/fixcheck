"""Record the exact HTTP bodies one filing reads (from the research cache, fetched
live) into test/fixtures/pages_v2.json, so the offline suite replays a real
filing. Chain facts come from the stub's chain model, as for the v1 fixtures.
  python3 tools/record_case.py <name> '<json filing params>'"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__)); sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "test"))
import rc, stub
stub._install_stub()
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
M = stub.load_full(ROOT / "contracts" / "FixCheck.py", "fc")
seen = {}
def real_get(url):
    t = rc.get(url)
    seen[url] = t
    return (404, "") if t == "__404__" else (200, t)
stub.WEB.flaky = lambda url, n: real_get(url)
name, p = sys.argv[1], json.loads(sys.argv[2])
p = {k: (M._clean_url(v) if k.endswith("_url") else v) for k, v in p.items()}
p["address"] = p["address"].lower()
for k in ("report_url", "audited_url", "fix_url", "docs_url"):
    real_get(p[k])
ev = M.gather(p)
print(name, ev.get("refused") or ("dep_status " + ev["dep_status"]))
f = ROOT / "test/fixtures/pages_v2.json"
doc = json.loads(f.read_text())
doc["pages"].update({u: t for u, t in seen.items() if t != "__404__"})
doc.setdefault("cases", {})[name] = p
f.write_text(json.dumps(doc, indent=0) + "\n")
