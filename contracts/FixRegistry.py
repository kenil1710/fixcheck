# v0.3.0
# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }
import genlayer as gl
from genlayer import *
import typing

# FixRegistry - the block any app copies to ask FixCheck one question:
# is the fix for this audit finding in that deployed contract?
#
# A lending market listing a new collateral, an insurer pricing cover, a
# wallet warning before an approval: each calls fix_status(chain, address,
# finding) - free, by cross-contract view - where `finding` is
# "<pinned report url>#<finding id>". This contract judges nothing and stores
# no verdict. The report URL is normalised by FixCheck (case of owner/repo,
# trailing slashes, query string), so every spelling finds the same check.
#
# CUSTODY: FALSE. No payable method, no transfer, no owner, no setter. The
# FixCheck address is fixed at deployment.


def _split_finding(finding: str) -> list:
    t = str(finding).strip()
    k = t.rfind("#")
    if k <= 0 or k == len(t) - 1:
        return []
    return [t[:k], t[k + 1:]]


class FixRegistry(gl.contract.Contract):
    fixcheck: Address

    def __init__(self, fixcheck_address: str) -> None:
        self.fixcheck = Address(str(fixcheck_address).strip())

    def _status(self, chain: str, address: str, finding: str) -> dict:
        parts = _split_finding(finding)
        if len(parts) != 2:
            return {"reachable": True, "status": "UNCHECKED", "error": "finding must be <report url>#<finding id>"}
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
    def fix_status(self, chain: str, address: str, finding: str) -> typing.Any:
        """{"status": FIXED | NOT_FIXED | PREDATES_AUDIT | INCONCLUSIVE | OPEN |
        UNCHECKED | UNKNOWN,
        "check_id", "basis", "decided_at", "reachable"}"""
        return self._status(chain, address, finding)

    @gl.public.view
    def is_fixed(self, chain: str, address: str, finding: str) -> bool:
        """True only for a decided FIXED verdict. Anything else - not fixed,
        inconclusive, never checked, or FixCheck unreachable - is False."""
        got = self._status(chain, address, finding)
        return bool(got.get("reachable")) and got.get("status") == "FIXED"

    @gl.public.view
    def is_known_unfixed(self, chain: str, address: str, finding: str) -> bool:
        """True only for a decided NOT_FIXED: the deployed code is the audited
        version although the deployment does not predate the audit.
        PREDATES_AUDIT (deployed before the audit, not upgradeable) is False."""
        got = self._status(chain, address, finding)
        return bool(got.get("reachable")) and got.get("status") == "NOT_FIXED"
