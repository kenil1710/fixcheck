"""Run the contract's own gather() / gather_import() + code decision against LIVE
evidence (cached HTTP, live JSON-RPC) before spending a Studio Dev transaction.
  python3 tools/v2_preview.py check '<json params as file_check takes them>'
  python3 tools/v2_preview.py import <report url> <docs url>"""
import json, os, sys, urllib.request
sys.path.insert(0, os.path.dirname(__file__)); sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "test"))
import rc, stub
stub._install_stub()
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
M = stub.load_full(ROOT / "contracts" / "FixCheck.py", "fc")
def real_get(url):
    t = rc.get(url) if "/issues/" not in url and "branch_commits" not in url else rc.get(url)
    return (404, "") if t == "__404__" else (200, t)
stub.WEB.flaky = lambda url, n: real_get(url)
class LiveRPC(dict):
    def __contains__(self, k): return True
    def __getitem__(self, k):
        url, method, params = k
        req = urllib.request.Request(url, data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": json.loads(params)}).encode(), headers={"Content-Type": "application/json", "User-Agent": "fixcheck-preview"})
        return json.loads(urllib.request.urlopen(req, timeout=30).read()).get("result")
stub.WEB.rpc = LiveRPC()
if sys.argv[1] == "import":
    rep, docs = M._clean_url(sys.argv[2]), M._clean_url(sys.argv[3])
    ev = M.gather_import({"report_url": rep, "docs_url": docs, "auditor": M.auditor_of(rep)})
    if "refused" in ev:
        print("REFUSED", ev["refused"])
    else:
        from collections import Counter
        print(ev["report_reach"], ev["docs_reach"], len(ev["items"]), dict(Counter(x[1] for x in ev["items"])))
    sys.exit()
a = json.loads(sys.argv[2])
p = {"report_url": M._clean_url(a["report_url"]), "fid": a["finding_id"], "fn": a.get("function_name") or a["function"], "audited_url": M._clean_url(a["audited_url"]),
     "fix_url": M._clean_url(a["fix_url"]), "chain": a["chain"], "address": a["address"].lower(), "docs_url": M._clean_url(a["docs_url"])}
ev = M.gather(p)
if "refused" in ev:
    print("REFUSED", ev["refused"]); sys.exit()
when = M.chronology(ev["impl"], ev["created_at"], ev["impl_created_at"], ev["switched_at"], ev["audited_at"], ev["fix_at"], ev["code_status"], ev["impl_code_status"])
dec = M.code_decision(ev["dep_status"], M.canon(M.strip_comments(ev["dep_code"])) if ev["dep_code"] else "", M.canon(M.strip_comments(ev["aud_code"])), M.canon(M.strip_comments(ev["fix_code"])), when["predates"], when["predates_fix"], when["unknown"])
if not dec and M.contains_fix(ev["dep_code"], ev["aud_code"], ev["fix_code"]):
    dec = {"verdict": "FIXED", "basis": "CODE_CONTAINS_FIX"}
print(json.dumps({"impl": ev["impl"], "dep_status": ev["dep_status"], "switch": ev["switch_status"], "code_status": ev["code_status"], "impl_code_status": ev["impl_code_status"], "verdict": dec.get("verdict", "MODEL"), "basis": dec.get("basis", "")}))
