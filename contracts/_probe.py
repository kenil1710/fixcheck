# v0.3.0
# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }
import genlayer as gl
from genlayer import *
import hashlib
import json
import typing

# THROWAWAY PROBE (Step 0). Not part of FixCheck. Measures, from inside GenVM on
# studio-dev, which evidence sources answer: Blockscout v2 verified source on
# five chains, Sourcify, GitHub raw at a pinned SHA, a Sherlock judging README
# at a pinned SHA, a Code4rena report page and web.archive.org snapshots.


def _status(res: typing.Any) -> int:
    s = getattr(res, "status_code", None)
    if s is None:
        s = getattr(res, "status", None)
    return 0 if s is None else int(s)


def _raw(res: typing.Any) -> bytes:
    b = getattr(res, "body", None)
    if b is None:
        return b""
    if isinstance(b, bytes):
        return b
    return str(b).encode("utf-8")


class Probe(gl.contract.Contract):
    last: str

    def __init__(self) -> None:
        self.last = ""

    @gl.public.write
    def probe(self, urls: str) -> None:
        def run() -> str:
            out = {}
            for url in urls.split(","):
                row = {}
                try:
                    r = gl.nondet.web.get(url)
                    b = _raw(r)
                    row["http"] = _status(r)
                    row["len"] = len(b)
                    row["sha256"] = hashlib.sha256(b).hexdigest()
                    row["head"] = b[:100].decode("utf-8", errors="ignore")
                except Exception as e:
                    row["err"] = str(e)[:160]
                out[url] = row
            return json.dumps(out, sort_keys=True)

        def validator(res: gl.vm.Result) -> bool:
            return isinstance(res, gl.vm.Return)

        self.last = gl.vm.run_nondet(run, validator)

    @gl.public.write
    def probe_model(self) -> None:
        def run() -> str:
            try:
                ans = gl.nondet.exec_prompt("Reply with exactly the JSON {\"ok\": true} and nothing else.", response_format="json")
                return str(ans)[:100]
            except Exception as e:
                return "err " + str(e)[:100]

        self.last = gl.vm.run_nondet(run, lambda r: isinstance(r, gl.vm.Return))

    @gl.public.write
    def probe_prompt(self, prompt: str) -> None:
        def run() -> str:
            out = []
            for _ in range(2):
                try:
                    out.append(str(gl.nondet.exec_prompt(prompt, response_format="json"))[:3000])
                except Exception as e:
                    out.append("err " + str(e)[:200])
            return json.dumps(out)

        self.last = gl.vm.run_nondet(run, lambda r: isinstance(r, gl.vm.Return))

    @gl.public.write
    def probe_rpc(self, calls: str) -> None:
        def run() -> str:
            out = {}
            for line in calls.split("|"):
                url, body = line.split(" ", 1)
                try:
                    r = gl.nondet.web.request(url, method="POST", body=body, headers={"Content-Type": "application/json"})
                    out[url + " " + body[:60]] = str(_status(r)) + " " + _raw(r)[:160].decode("utf-8", errors="ignore")
                except Exception as e:
                    out[url] = "err " + str(e)[:120]
            return json.dumps(out, sort_keys=True)

        self.last = gl.vm.run_nondet(run, lambda r: isinstance(r, gl.vm.Return))

    @gl.public.write
    def probe_web2(self, urls: str, rpcs: str) -> None:
        def run() -> str:
            out = {}
            for url in urls.split(","):
                row = {}
                try:
                    r = gl.nondet.web.get(url)
                    b = _raw(r)
                    row["http"] = _status(r)
                    row["len"] = len(b)
                    row["attrs"] = [a for a in dir(r) if not a.startswith("__")][:30]
                    h = getattr(r, "headers", None)
                    row["headers"] = {str(k).lower(): str(h[k])[:120] for k in h} if isinstance(h, dict) else str(h)[:400]
                    t = b.decode("utf-8", errors="ignore")
                    for needle in ["mergedTime", "mergeCommitSha", "defaultBranch", "class=\"branch\"", "<updated>", "react-app.embeddedData", "\"login\":\"sherlock-admin2\""]:
                        k = t.find(needle)
                        row[needle] = t[k:k + 90] if k >= 0 else ""
                    row["head"] = t[:80]
                except Exception as e:
                    row["err"] = str(e)[:200]
                out[url] = row
            for u in rpcs.split(","):
                try:
                    r = gl.nondet.web.request(u, method="POST", body=json.dumps({"jsonrpc": "2.0", "id": 1, "method": "eth_blockNumber", "params": []}), headers={"Content-Type": "application/json"})
                    head = int(json.loads(_raw(r).decode())["result"], 16)
                    row = {"head": head}
                    for lag in [16, 128, 600, 3000, 20000]:
                        r2 = gl.nondet.web.request(u, method="POST", body=json.dumps({"jsonrpc": "2.0", "id": 1, "method": "eth_getStorageAt", "params": ["0x4200000000000000000000000000000000000016", "0x0", hex(head - lag)]}), headers={"Content-Type": "application/json"})
                        row[str(lag)] = str(_status(r2)) + " " + _raw(r2)[:110].decode("utf-8", errors="ignore")
                    out[u] = row
                except Exception as e:
                    out[u] = {"err": str(e)[:200]}
            return json.dumps(out, sort_keys=True)

        self.last = gl.vm.run_nondet(run, lambda r: isinstance(r, gl.vm.Return))

    @gl.public.view
    def get_last(self) -> str:
        return self.last
