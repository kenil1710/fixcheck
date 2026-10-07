"""Rebuild test/fixtures from REAL data (cached fetches + live RPC):
   python3 tools/build_fixtures.py
pages.json  url -> body for every URL the contract fetches for the test cases
rpc.json    [url, method, params, result] JSON-RPC answers
cases.json  the cases (fix_url = the fix PR's head commit)"""
import json, os, sys, urllib.request
sys.path.insert(0, os.path.dirname(__file__)); sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "test"))
import rc, stub
stub._install_stub()
from pathlib import Path
M = stub.load_full(Path(__file__).resolve().parent.parent / "contracts" / "FixCheck.py", "fc")
ROOT = Path(__file__).resolve().parent.parent
seeds = json.loads((ROOT / "docs/research/seeds.json").read_text())
WANT = [("PoolTogether V5", "M-5", "optimism"), ("PoolTogether V5", "M-9", "optimism"), ("Mellow Flexible Vaults", "H-1", "ethereum"),
        ("Mellow Flexible Vaults", "H-2", "ethereum"), ("Cap", "M-3", "ethereum"), ("PoolTogether V5", "M-16", "arbitrum")]
pages, rpcs, cases = {}, [], []
def live_rpc(url, method, params):
    req = urllib.request.Request(url, data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode(), headers={"Content-Type": "application/json", "User-Agent": "fixcheck-fixtures"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read())["result"]
def put(u):
    if u.startswith(M.GITHUB_RAW) or u.startswith(M.ARCHIVE):
        u = M.norm_url(u)          # user-supplied URLs are normalised by the contract
    if u not in pages: pages[u] = rc.get(u)
    return pages[u]
for proto, fid, chain in WANT:
    s = next(x for x in seeds if x["protocol"] == proto and x["finding_id"] == fid and x["chain"] == chain)
    addr = s["address"].lower()
    for u in (s["report_url"], s["docs_url"], s["audited_url"], s["fix_url"]): put(u)
    ap, fp = M.github_pin(s["audited_url"]), M.github_pin(s["fix_url"])
    put(M.GITHUB_WEB + ap["owner"] + "/" + ap["repo"] + "/commits/" + ap["sha"] + ".atom")
    sec = M.finding_section(pages[M.norm_url(s["report_url"])], fid)["text"]
    for n in M.fix_links(sec, fp)["pulls"][:M.MAX_PULLS]:
        put(M.PATCH_BASE + fp["owner"] + "/" + fp["repo"] + "/pull/" + n + ".patch")
    rurl = M.CHAINS[chain][3]
    slot = live_rpc(rurl, "eth_getStorageAt", [addr, M.EIP1967_IMPL_SLOT, "latest"])
    rpcs.append([rurl, "eth_getStorageAt", [addr, M.EIP1967_IMPL_SLOT, "latest"], slot])
    put(M.source_url(chain, addr))
    if int(slot, 16):
        put(M.source_url(chain, "0x" + slot[-40:]))
    kind, base, cid, _ = M.CHAINS[chain]
    if kind == "blockscout":
        a = json.loads(put(base + "/api/v2/addresses/" + addr))
        put(base + "/api/v2/transactions/" + a["creation_transaction_hash"].lower())
    else:
        d = json.loads(put(base + "/server/v2/contract/" + str(cid) + "/" + addr + "?fields=deployment"))["deployment"]
        blk = hex(int(d["blockNumber"]))
        rpcs.append([rurl, "eth_getBlockByNumber", [blk, False], live_rpc(rurl, "eth_getBlockByNumber", [blk, False])])
    cases.append(dict(protocol=proto, id=fid, fn=s["function"], chain=chain, address=s["address"], report=s["report_url"],
                      docs=s["docs_url"], audited=s["audited_url"], fix=s["fix_url"]))
(ROOT / "test/fixtures/pages.json").write_text(json.dumps(pages))
(ROOT / "test/fixtures/rpc.json").write_text(json.dumps(rpcs))
(ROOT / "test/fixtures/cases.json").write_text(json.dumps(cases, indent=1))
print(len(pages), "pages,", len(rpcs), "rpc answers,", len(cases), "cases,", os.path.getsize(ROOT / "test/fixtures/pages.json") // 1024, "KB")
