"""Run the contract's own gather() + code decision for every seed against LIVE
evidence (real HTTP and JSON-RPC behind the stub).  python3 tools/v12_preview.py"""
import json, os, sys, urllib.request
sys.path.insert(0, os.path.dirname(__file__)); sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "test"))
import rc, stub
stub._install_stub()
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
M = stub.load_full(ROOT / "contracts" / "FixCheck.py", "fc")
def real_get(url):
    t = rc.get(url) if not url.endswith(".atom") else rc.get(url)
    return (404, "") if t == "__404__" else (200, t)
stub.WEB.flaky = lambda url, n: real_get(url)
class LiveRPC(dict):
    def __contains__(self, k): return True
    def __getitem__(self, k):
        url, method, params = k
        req = urllib.request.Request(url, data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": json.loads(params)}).encode(), headers={"Content-Type": "application/json", "User-Agent": "fixcheck-preview"})
        return json.loads(urllib.request.urlopen(req, timeout=30).read()).get("result")
stub.WEB.rpc = LiveRPC()
seeds = json.loads((ROOT / "docs/research/seeds.json").read_text())
out = []
for i, s in enumerate(seeds, 1):
    p = {"report_url": M._clean_url(s["report_url"]), "fid": s["finding_id"], "fn": s["function"], "audited_url": M._clean_url(s["audited_url"]),
         "fix_url": M._clean_url(s["fix_url"]), "chain": s["chain"], "address": s["address"].lower(), "docs_url": M._clean_url(s["docs_url"])}
    ev = M.gather(p)
    if "refused" in ev:
        row = dict(n=i, refused=ev["refused"]); out.append(row); print(i, s["finding_id"], s["function"], "REFUSED", ev["refused"]); continue
    predates = ev["impl"] == "" and 0 < ev["created_at"] < ev["audited_at"]
    dec = M.code_decision(ev["dep_status"], M.canon(M.strip_comments(ev["dep_code"])) if ev["dep_code"] else "",
                          M.canon(M.strip_comments(ev["aud_code"])), M.canon(M.strip_comments(ev["fix_code"])), predates)
    if not dec and M.contains_fix(ev["dep_code"], ev["aud_code"], ev["fix_code"]):
        dec = {"verdict": "FIXED", "basis": "CODE_CONTAINS_FIX"}
    import datetime
    d = lambda t: datetime.datetime.fromtimestamp(t, datetime.UTC).strftime("%Y-%m-%d")
    row = dict(n=i, protocol=s["protocol"], fid=s["finding_id"], fn=s["function"], chain=s["chain"], binding=ev["audit_binding"], fix_ref=ev["fix_ref"],
               dep_status=ev["dep_status"], impl=ev["impl"], created=d(ev["created_at"]), audited=d(ev["audited_at"]),
               verdict=dec.get("verdict", "MODEL"), basis=dec.get("basis", "model decides"))
    out.append(row)
    print(i, s["finding_id"], s["function"][:20], s["chain"][:4], row["binding"], row["fix_ref"], row["dep_status"], row["created"], row["audited"], row["verdict"], row["basis"])
(ROOT / "docs/research/v12_preview.json").write_text(json.dumps(out, indent=1))
