#!/usr/bin/env python3
"""Attack pass, round 4, on the code at commit 026e0f8 (the round-3 deployment,
contracts unchanged since 93de7be). Every class below was written first and
run against that code; the failures it produced are quoted in
docs/ATTACK_REPORT_R4.md. The round-4 fixes make all of them pass.

    python3 test/test_attacks_r4.py

Same stub and real fixtures as test/test_fixcheck.py. No network, no model, no
chain.
"""
import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import test_fixcheck as B  # noqa: E402  (installs the stub, loads the contract)
import test_attacks_r3 as R3  # noqa: E402

MOD = B.MOD
WEB = B.WEB
PAGES = B.PAGES
FORGE = B.FORGE
T0 = B.T0
GH = "https://github.com/"


def params_of(case, **over):
    """The params dict file_check() hands to gather(), for a test that plays a
    leader."""
    a = B.args_of(case, **over)
    return {"report_url": MOD._clean_url(a["report_url"]), "fid": MOD._finding_id(a["finding_id"]),
            "fn": MOD._ident(a["function_name"], MOD.MAX_FN), "audited_url": MOD._clean_url(a["audited_url"]),
            "fix_url": MOD._clean_url(a["fix_url"]), "chain": a["chain"], "address": MOD._addr(a["address"]),
            "docs_url": MOD._clean_url(a["docs_url"])}


def slot_word(impl):
    return "0x" + "0" * 24 + impl[2:] if impl else "0x" + "0" * 64


def rolled(w, case, **over):
    """True if the filing round failed (validators disagreed): nothing written."""
    try:
        w.file(case, **over)
    except B.stub._Rolled:
        return True
    return False


# =============================================================================
# Step 1. The Lows left open in docs/ATTACK_REPORT_R3.md
# =============================================================================

ARCHIVED_AT = "20250101000000"
MEMENTO = "Wed, 01 Jan 2025 00:00:00 GMT"


def archived(url, body, memento=MEMENTO):
    cap = MOD.ARCHIVE + ARCHIVED_AT + "id_/" + url
    WEB.pages[MOD.norm_url(cap)] = (200, body)
    WEB.headers[MOD.norm_url(cap)] = {"memento-datetime": memento}
    return cap


class R4_L1_DocsCapturedOnWayback(unittest.TestCase):
    """R3 item 1 (Low): docs pinned only as a Wayback capture were always
    refused as FIX_REPO_NOT_PROTOCOLS, because the fix-owner rule read the
    docs owner from a raw GitHub URL only. A capture of the protocol's own
    GitHub page at a full SHA names the same owner/repo/commit."""

    def test_archived_github_docs_at_a_full_sha_are_accepted(self):
        w = B.World()
        case = B.VAULT_ETH
        cap = archived(case["docs"], PAGES[case["docs"]])
        out = w.file(case, docs_url=cap)
        self.assertEqual(out.get("status"), "OK", out)
        ch = w.c.get_check(out["check_id"])
        self.assertEqual(ch["protocol"], "github:generationsoftware/pt-dev-docs",
                         "the same protocol key as the raw spelling")
        self.assertEqual(ch["docs_reach"], "default:main", "the captured commit is still checked for a branch")

    def test_archived_docs_from_a_fork_commit_are_refused(self):
        w = B.World()
        case = B.VAULT_ETH
        forged = R3.at_sha(case["docs"], R3.FORK_SHA)
        cap = archived(forged, PAGES[case["docs"]])
        R3.branch_answer(forged, R3.FORK_ONLY)
        out = w.file(case, docs_url=cap)
        self.assertEqual((out["status"], out["reason"]), ("REFUSED", "DOCS_COMMIT_NOT_ON_BRANCH"))

    def test_archived_website_docs_are_refused_with_their_own_reason(self):
        # a protocol website names no GitHub account the fix could be compared with
        w = B.World()
        cap = archived("https://dev.pooltogether.com/protocol/deployments/ethereum", PAGES[B.VAULT_ETH["docs"]])
        out = w.file(B.VAULT_ETH, docs_url=cap)
        self.assertEqual((out["status"], out["reason"]), ("REFUSED", "DOCS_NOT_ON_GITHUB"))
        self.assertEqual(WEB.log, [], "refused before anything is fetched")


class R4_L2_LeaderPicksTheSlotBlock(unittest.TestCase):
    """R3 item 4 (Low): the leader names the block the EIP-1967 slot is read
    at, anywhere in the last max_lag blocks. A leader that picks a block just
    before an upgrade reads the old implementation; it disagrees with the
    explorer and the filing is stored as INCONCLUSIVE (PROXY_MISMATCH) - the
    leader, not the chain, chose that outcome. Validators must also read the
    slot at their own latest block and refuse a block whose implementation is
    no longer current."""

    def test_a_block_before_an_upgrade_inside_the_window_is_refused(self):
        w = B.World()
        case = B.VAULT_ETH
        R3.as_proxy(case, R3.AFTER_FIX, R3.BEFORE_FIX, [(20600000, 7, R3.IMPL, R3.AFTER_FIX)])
        rpc = MOD.CHAINS["ethereum"][3]
        addr = case["address"].lower()
        old = B.stub.HEAD - 50                       # inside max_lag (100), before the upgrade
        WEB.rpc[(rpc, "eth_getStorageAt", json.dumps([addr, MOD.EIP1967_IMPL_SLOT, hex(old)]))] = slot_word(R3.OTHER)
        base = MOD.CHAINS["ethereum"][1]
        WEB.pages[base + "/api/v2/addresses/" + R3.OTHER] = (200, json.dumps({"creation_transaction_hash": "0x" + "c3" * 32}))
        WEB.pages[base + "/api/v2/transactions/0x" + "c3" * 32] = (200, json.dumps({"timestamp": B.iso(R3.BEFORE_FIX)}))
        # the leader names `old` and hands in what it read there
        FORGE["payload"] = MOD.gather(params_of(case), old)
        try:
            out = w.file(case)
        except B.stub._Rolled:
            out = {"status": "ROLLED"}
        self.assertEqual(int(w.c.checks_n), 0, "a slot block whose implementation is no longer current was "
                         "accepted: " + json.dumps(out)[:200])
        self.assertEqual(MOD.gather(params_of(case), old), {"refused": "SLOT_CHANGED_SINCE_SLOT_BLOCK"})
        self.assertEqual(w.claimable(B.CHALLENGER), B.STAKE if out["status"] == "REFUSED" else 0)

    def test_honest_leader_unchanged(self):
        w = B.World()
        R3.as_proxy(B.VAULT_ETH, R3.AFTER_FIX, R3.BEFORE_FIX, [(20600000, 7, R3.IMPL, R3.AFTER_FIX)])
        self.assertEqual(w.file(B.VAULT_ETH)["status"], "OK")


class R4_L3_AllowlistHostBoundary(unittest.TestCase):
    """R3 item 5: prefixes without a trailing slash also matched other hosts
    (https://mainnet.base.org matched https://mainnet.base.org.evil.com). No
    user-supplied host reached them, but the allowlist itself must hold."""

    def test_prefix_is_a_host_boundary(self):
        for p in MOD.ALLOWED_PREFIXES:
            if p.endswith("/"):
                continue
            for bad in (p + ".evil.com", p + ".evil.com/x", p + "@evil.com/", p + "evil"):
                self.assertFalse(MOD.allowed_url(bad), bad)
            self.assertTrue(MOD.allowed_url(p), p)
        self.assertTrue(MOD.allowed_url("https://eth.blockscout.com/api/v2/addresses/0x" + "1" * 40))
        self.assertFalse(MOD.allowed_url("https://eth.blockscout.com.evil.com/api/v2/"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
