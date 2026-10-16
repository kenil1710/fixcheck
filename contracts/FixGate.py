# v0.3.0
# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }
import genlayer as gl
from genlayer import *
import typing

# FixGate - a tiny demo of a contract that consults FixStatus before it
# interacts with a deployment. interact(finding_id, chain, address) is
# REFUSED when FixCheck's latest decided verdict for that finding on that
# deployment is NOT_FIXED or REGRESSED, and when FixCheck cannot be read
# (fail closed); otherwise it is ALLOWED. Every call records its outcome; a
# refused call records the refusal and nothing else.
#
# A real integration would do its own work where this one only counts.
# CUSTODY: FALSE. No payable method, no transfer, no owner, no setter.


class FixGate(gl.contract.Contract):
    fixstatus: Address
    calls_n: u32
    allowed_n: u32
    refused_n: u32
    outcome: gl.storage.TreeMap[u32, str]       # n -> "ALLOWED|..." / "REFUSED|..."

    def __init__(self, fixstatus_address: str) -> None:
        self.fixstatus = Address(str(fixstatus_address).strip())

    @gl.public.write
    def interact(self, finding_id: str, chain: str, address: str) -> typing.Any:
        try:
            got = gl.contract.get_at(self.fixstatus).view().status(finding_id, chain, address)
        except Exception:
            got = {"reachable": False, "status": "UNKNOWN"}
        if not isinstance(got, dict):
            got = {"reachable": False, "status": "UNKNOWN"}
        st = str(got.get("status") or "UNKNOWN")
        if not got.get("reachable"):
            result = "REFUSED"
            why = "FIXSTATUS_UNREACHABLE"
        elif st == "NOT_FIXED" or st == "REGRESSED":
            result = "REFUSED"
            why = "FINDING_" + st
        else:
            result = "ALLOWED"
            why = st
        # --- writes
        n = int(self.calls_n) + 1
        self.calls_n = u32(n)
        if result == "ALLOWED":
            self.allowed_n = u32(int(self.allowed_n) + 1)
        else:
            self.refused_n = u32(int(self.refused_n) + 1)
        self.outcome[u32(n)] = result + "|" + why + "|" + str(int(got.get("check_id") or 0)) + "|" \
            + str(chain).strip().lower()[:20] + "|" + str(address).strip().lower()[:42]
        return {"call": n, "result": result, "why": why, "check_id": int(got.get("check_id") or 0)}

    @gl.public.view
    def source(self) -> str:
        return self.fixstatus.as_hex

    @gl.public.view
    def get_stats(self) -> typing.Any:
        return {"calls": int(self.calls_n), "allowed": int(self.allowed_n), "refused": int(self.refused_n)}

    @gl.public.view
    def get_calls(self, offset: typing.Any, limit: typing.Any) -> typing.Any:
        """Newest first, at most 50."""
        try:
            off = max(int(offset), 0)
            lim = min(max(int(limit), 1), 50)
        except Exception:
            off, lim = 0, 20
        n = int(self.calls_n)
        out = []
        i = n - off
        while i >= 1 and len(out) < lim:
            p = str(self.outcome.get(u32(i)) or "").split("|")
            if len(p) == 5:
                out.append({"call": i, "result": p[0], "why": p[1], "check_id": int(p[2]), "chain": p[3],
                            "address": p[4]})
            i -= 1
        return {"total": n, "items": out}
