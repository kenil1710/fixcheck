"""Creation time of each deployed contract (research evidence for docs/RESEARCH.md)."""
import json, sys, urllib.request, os
sys.path.insert(0, os.path.dirname(__file__))
import rc
RPC = {"base": "https://mainnet.base.org", "arbitrum": "https://arb1.arbitrum.io/rpc", "polygon": "https://polygon-rpc.com"}
def rpc(url, m, p):
    req = urllib.request.Request(url, data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": m, "params": p}).encode(), headers={"Content-Type": "application/json", "User-Agent": "fixcheck-research"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read())["result"]
def created(chain, addr):
    if chain in rc.BLOCKSCOUT:
        d = json.loads(rc.get(f"{rc.BLOCKSCOUT[chain]}/api/v2/addresses/{addr}"))
        tx = d.get("creation_transaction_hash") or d.get("creation_tx_hash")
        t = json.loads(rc.get(f"{rc.BLOCKSCOUT[chain]}/api/v2/transactions/{tx}"))
        return t["timestamp"][:19] + "Z", tx
    d = json.loads(rc.get(f"https://sourcify.dev/server/v2/contract/{rc.CHAIN_IDS[chain]}/{addr}?fields=deployment"))
    dep = d.get("deployment") or {}
    b = rpc(RPC[chain], "eth_getBlockByNumber", [hex(int(dep["blockNumber"])), False])
    import datetime
    return datetime.datetime.fromtimestamp(int(b["timestamp"], 16), datetime.UTC).strftime("%Y-%m-%dT%H:%M:%SZ"), dep.get("transactionHash")
if __name__ == "__main__":
    out = {}
    for chain, addr in [a.split(":") for a in sys.argv[1:]]:
        try: out[chain + ":" + addr] = created(chain, addr)
        except Exception as e: out[chain + ":" + addr] = ["?", str(e)[:80]]
        print(chain, addr, out[chain + ":" + addr])
