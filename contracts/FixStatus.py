# v0.3.0
# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }
import genlayer as gl
from genlayer import *
import typing

# FixStatus - what any contract asks FixCheck before trusting a deployment:
#
#   is_fixed(finding_id, chain, address)   True only for a decided FIXED
#   status(finding_id, chain, address)     the full answer
#   protocol_score(protocol)               fixed / total and every count
#
# finding_id is "<pinned report url>#<finding id>" (one finding of one report:
# "M-1" alone names a different finding in every report). Every answer is a
# cross-contract view of FixCheck's storage at the time of the call - nothing
# is cached here. If FixCheck cannot be read the answer is UNKNOWN and
# is_fixed is False.
#
# CUSTODY: FALSE. No payable method, no transfer, no owner, no setter. The
# FixCheck address is fixed at deployment.

UNSAFE = ("NOT_FIXED", "REGRESSED")


def split_finding(finding: str) -> list:
    t = str(finding).strip()
    k = t.rfind("#")
    if k <= 0 or k == len(t) - 1:
        return []
    return [t[:k], t[k + 1:]]


class FixStatus(gl.contract.Contract):
    fixcheck: Address

    def __init__(self, fixcheck_address: str) -> None:
        self.fixcheck = Address(str(fixcheck_address).strip())

    def _status(self, finding: str, chain: str, address: str) -> dict:
        parts = split_finding(finding)
        if len(parts) != 2:
            return {"reachable": True, "status": "UNCHECKED", "check_id": 0, "basis": "", "decided_at": 0,
                    "open_check_id": 0, "error": "finding must be <report url>#<finding id>"}
        try:
            got = gl.contract.get_at(self.fixcheck).view().fix_status(chain, address, parts[0], parts[1])
        except Exception:
            return {"reachable": False, "status": "UNKNOWN", "error": "FixCheck could not be read"}
        if not isinstance(got, dict):
            return {"reachable": False, "status": "UNKNOWN", "error": "FixCheck returned nothing usable"}
        got["reachable"] = True
        return got

    @gl.public.view
    def source(self) -> str:
        return self.fixcheck.as_hex

    @gl.public.view
    def status(self, finding_id: str, chain: str, address: str) -> typing.Any:
        """{"status": FIXED | NOT_FIXED | REGRESSED | PREDATES_AUDIT |
        PREDATES_FIX | INCONCLUSIVE | OPEN | UNCHECKED | UNKNOWN, "check_id",
        "basis", "decided_at", "open_check_id", "reachable"}"""
        return self._status(finding_id, chain, address)

    @gl.public.view
    def is_fixed(self, finding_id: str, chain: str, address: str) -> bool:
        """True only for a decided FIXED verdict (the latest decided check).
        Not fixed, regressed, inconclusive, never checked or unreachable are
        all False."""
        got = self._status(finding_id, chain, address)
        return bool(got.get("reachable")) and got.get("status") == "FIXED"

    @gl.public.view
    def is_unsafe(self, finding_id: str, chain: str, address: str) -> bool:
        """True only for a decided NOT_FIXED or REGRESSED verdict."""
        got = self._status(finding_id, chain, address)
        return bool(got.get("reachable")) and got.get("status") in UNSAFE

    @gl.public.view
    def protocol_score(self, protocol: str) -> typing.Any:
        """FixCheck's counts for one protocol ("github:owner/repo"): fixed,
        total (decided checks) and every verdict."""
        try:
            got = gl.contract.get_at(self.fixcheck).view().protocol_score(protocol)
        except Exception:
            return {"reachable": False, "protocol": str(protocol)}
        if not isinstance(got, dict):
            return {"reachable": False, "protocol": str(protocol)}
        got["reachable"] = True
        return got
