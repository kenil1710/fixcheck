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

    @gl.public.view
    def get_last(self) -> str:
        return self.last
