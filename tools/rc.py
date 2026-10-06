"""Research helpers: cached HTTP fetch, verified-source readers, function listing."""
import hashlib, json, os, re, subprocess, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
import solfn

CACHE = os.path.join(os.path.dirname(__file__), "..", "research_cache", "http")
os.makedirs(CACHE, exist_ok=True)

def get(url, binary=False):
    p = os.path.join(CACHE, hashlib.sha256(url.encode()).hexdigest())
    if not os.path.exists(p):
        for i in range(4):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "fixcheck-research"})
                with urllib.request.urlopen(req, timeout=60) as r:
                    data = r.read()
                break
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    data = b"__404__"; break
                time.sleep(2 + 3 * i); data = None
            except Exception:
                time.sleep(2 + 3 * i); data = None
        if data is None:
            raise RuntimeError("fetch failed " + url)
        open(p, "wb").write(data)
    b = open(p, "rb").read()
    return b if binary else b.decode("utf-8", "ignore")

def gh(path):
    return json.loads(subprocess.check_output(["gh", "api", path]))

def raw(owner, repo, sha, path):
    t = get(f"https://raw.githubusercontent.com/{owner}/{repo}/{sha}/{path}")
    return None if t == "__404__" else t

CHAIN_IDS = {"ethereum": 1, "optimism": 10, "base": 8453, "arbitrum": 42161, "polygon": 137}
BLOCKSCOUT = {"ethereum": "https://eth.blockscout.com", "optimism": "https://explorer.optimism.io"}

def deployed_sources(chain, address):
    """{"verified": bool, "files": {path: src}, "impl": addr|None, "source": url}"""
    if chain in BLOCKSCOUT:
        url = f"{BLOCKSCOUT[chain]}/api/v2/smart-contracts/{address}"
        t = get(url)
        try: d = json.loads(t)
        except Exception: return {"verified": False, "files": {}, "source": url}
        files = {}
        if d.get("source_code"):
            files[d.get("file_path") or (d.get("name", "Main") + ".sol")] = d["source_code"]
        for a in d.get("additional_sources") or []:
            files[a["file_path"]] = a["source_code"]
        impls = [i.get("address_hash") or i.get("address") for i in (d.get("implementations") or [])]
        return {"verified": bool(d.get("is_verified")), "files": files, "impls": impls, "name": d.get("name"), "source": url}
    url = f"https://sourcify.dev/server/v2/contract/{CHAIN_IDS[chain]}/{address}?fields=sources,proxyResolution"
    t = get(url)
    try: d = json.loads(t)
    except Exception: return {"verified": False, "files": {}, "source": url}
    files = {k: v.get("content", "") for k, v in (d.get("sources") or {}).items()}
    impls = [i.get("address") for i in ((d.get("proxyResolution") or {}).get("implementations") or [])]
    return {"verified": bool(d.get("match")), "files": files, "impls": impls, "source": url, "match": d.get("match")}

FN = re.compile(r"\bfunction\s+([A-Za-z_$][\w$]*)\s*\(")
def fn_names(src):
    return sorted(set(FN.findall(solfn.strip_comments(src))))
