"""v2 research: for every Code4rena finding a report marks fixed, find filings the
contract itself would accept, by running the contract's own gather() + code decision
against LIVE evidence (cached HTTP, live JSON-RPC behind the test stub).
  python3 tools/v2_research_c4.py <report raw url> <docs raw url> <chain> [<chain> ...]
Writes docs/research/c4_candidates.json."""
import json, os, re, sys, urllib.request
sys.path.insert(0, os.path.dirname(__file__)); sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "test"))
import rc, stub, solfn
stub._install_stub()
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
M = stub.load_full(ROOT / "contracts" / "FixCheck.py", "fc")
def real_get(url):
    t = rc.get(url)
    return (404, "") if t == "__404__" else (200, t)
stub.WEB.flaky = lambda url, n: real_get(url)
class LiveRPC(dict):
    def __contains__(self, k): return True
    def __getitem__(self, k):
        url, method, params = k
        req = urllib.request.Request(url, data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": json.loads(params)}).encode(), headers={"Content-Type": "application/json", "User-Agent": "fixcheck-preview"})
        return json.loads(urllib.request.urlopen(req, timeout=30).read()).get("result")
stub.WEB.rpc = LiveRPC()

report_url, docs_base, chains = sys.argv[1], sys.argv[2], sys.argv[3:]
rep = rc.get(report_url)
items = M.enumerate_findings(rep, "code4rena")["items"]
out = []
for fid, cls, title in items:
    if cls != M.CLS_FIXED:
        continue
    st = M.c4_status(rep, fid)
    sec = M.finding_section(rep, fid)["text"]
    for m in re.finditer(r"github\.com/([\w.-]+)/([\w.-]+)/(pull|commit)/([0-9a-f]+|\d+)", st["row"]):
        owner, repo, kind, ref = m.groups()
        if kind == "pull":
            patch = rc.get(f"https://patch-diff.githubusercontent.com/raw/{owner.lower()}/{repo.lower()}/pull/{ref}.patch")
            head = M.patch_head(patch) if patch != "__404__" else ""
            files = sorted(set(re.findall(r"^diff --git a/(\S+) ", patch, re.M))) if head else []
        else:
            head, files = ref, []
        if not head:
            out.append(dict(fid=fid, ref=m.group(0), why="NO_PR_HEAD")); continue
        for f in files:
            if not f.endswith(".sol") or "/test/" in f or f.startswith("test/"):
                continue
            base = os.path.basename(f)
            # the audited commit the report links for this repo
            aud = re.search(r"github\.com/" + re.escape(owner) + "/" + re.escape(repo) + r"/blob/([0-9a-f]{40})/", rep, re.I)
            if not aud:
                continue
            audited = f"https://raw.githubusercontent.com/{owner}/{repo}/{aud.group(1)}/{f}"
            fixu = f"https://raw.githubusercontent.com/{owner}/{repo}/{head}/{f}"
            a, b = rc.get(audited), rc.get(fixu)
            if a == "__404__" or b == "__404__":
                continue
            for fn in sorted(set(rc.fn_names(a)) | set(rc.fn_names(b))):
                x = solfn.extract({"a.sol": a}, "a.sol", fn); y = solfn.extract({"a.sol": b}, "a.sol", fn)
                if x.get("canon") == y.get("canon") or sec.find(fn) < 0:
                    continue
                for ch in chains:
                    docs = docs_base.replace("{chain}", ch)
                    d = rc.get(docs)
                    name = base[:-4]
                    addrs = re.findall(r"\|\s*" + re.escape(name) + r"\s*\|\s*\[`(0x[0-9a-fA-F]{40})`", d)
                    for addr in addrs:
                        p = {"report_url": M._clean_url(report_url), "fid": fid, "fn": fn, "audited_url": M._clean_url(audited),
                             "fix_url": M._clean_url(fixu), "chain": ch, "address": addr.lower(), "docs_url": M._clean_url(docs)}
                        try:
                            ev = M.gather(p)
                        except Exception as e:
                            ev = {"refused": "EXC " + str(e)[:80]}
                        row = dict(fid=fid, fn=fn, chain=ch, address=addr, audited=audited, fix=fixu, docs=docs)
                        if "refused" in ev:
                            row["refused"] = ev["refused"]
                        else:
                            when = M.chronology(ev["impl"], ev["created_at"], ev["impl_created_at"], ev["switched_at"], ev["audited_at"], ev["fix_at"], ev["code_status"], ev["impl_code_status"])
                            dec = M.code_decision(ev["dep_status"], M.canon(M.strip_comments(ev["dep_code"])) if ev["dep_code"] else "", M.canon(M.strip_comments(ev["aud_code"])), M.canon(M.strip_comments(ev["fix_code"])), when["predates"], when["predates_fix"], when["unknown"])
                            if not dec and M.contains_fix(ev["dep_code"], ev["aud_code"], ev["fix_code"]):
                                dec = {"verdict": "FIXED", "basis": "CODE_CONTAINS_FIX"}
                            row.update(verdict=dec.get("verdict", "MODEL"), basis=dec.get("basis", ""), dep_status=ev["dep_status"], fix_ref=ev["fix_ref"])
                        print(json.dumps(row)[:400], flush=True)
                        out.append(row)
(ROOT / "docs/research/c4_candidates.json").write_text(json.dumps(out, indent=1) + "\n")
