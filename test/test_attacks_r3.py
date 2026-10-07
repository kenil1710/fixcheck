#!/usr/bin/env python3
"""Attack pass, round 3, on the code at commit 2b0f979 (diff 548caff..2b0f979 in contracts/).
Every test here FAILS on the current code, for the reason its docstring states
(docs/ATTACK_REPORT_R3.md). They are known limitations (README) and are marked
as strict expected failures: the suite stays green, and a test that starts
passing without anyone noticing turns the run red.

    python3 test/test_attacks_r3.py

Same stub and real fixtures as test/test_fixcheck.py. No network, no model, no
chain. How GitHub raw answers a commit that exists only in a fork was read once
during this pass and is written down in the docstrings and in the report.
"""
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import test_fixcheck as B  # noqa: E402  (installs the stub, loads the contract)

MOD = B.MOD
WEB = B.WEB
PAGES = B.PAGES
T0 = B.T0

REASON = "Known limitation, see README"
try:
    import pytest
    known_limitation = pytest.mark.xfail(strict=True, reason=REASON)
except ImportError:
    # plain unittest: an expected failure that passes is an "unexpected
    # success", which fails the run - the same strictness as pytest's
    known_limitation = unittest.expectedFailure


def epoch(iso: str) -> int:
    return int(datetime.strptime(iso, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc).timestamp())


def serve(url: str, text: str) -> None:
    """Serve a page under the spelling given and the normalised spelling."""
    WEB.pages[url] = (200, text)
    WEB.pages[MOD.norm_url(url)] = (200, text)


# GitHub raw serves any commit of a repository's fork network under the
# upstream owner/repo path. Observed during this pass (HTTP 200, same bytes):
#   raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/
#     a925a29c22c5b928f4ddc692bee352ad6e0ba664/s
# - commit a925a29 and file `s` exist ONLY in the fork
#   edwardmadi/2024-05-pooltogether-judging ("Create s"); likewise 6035289
#   ("Update README.md") exists only in minanew12/2024-05-pooltogether-judging.
#   github.com/<upstream>/branch_commits/<that sha> lists no branch.
FORK_SHA = "f0" * 20


def at_sha(url: str, sha: str) -> str:
    pin = MOD.github_pin(url)
    return MOD.GITHUB_RAW + pin["owner"] + "/" + pin["repo"] + "/" + sha + "/" + pin["path"]


# =============================================================================
# R3-01 (High). Pinned docs at a fork-only commit: any address, any protocol
# =============================================================================

class R3_01_DocsFromAForkCommit(unittest.TestCase):
    """Round-2 fix 9 takes "the owner of the pinned docs" as the protocol's
    own GitHub account, and the protocol a check is scored under comes from
    the docs URL. But raw.githubusercontent.com/<owner>/<repo>/<sha>/... serves
    a commit made in ANY fork of that repo. Anyone forks the protocol's docs
    repo, commits a page that lists any contract address, and pins it under
    the protocol's own owner/repo path: the address check and the
    owner-equals-fix-owner check both pass, and the check is scored under the
    protocol for a contract its docs never named."""

    @known_limitation
    def test_docs_commit_that_exists_only_in_a_fork_is_refused(self):
        w = B.World()
        case = B.VAULT_ETH
        addr = case["address"].lower()
        real = PAGES[case["docs"]]
        # The protocol's real docs at its real commit do NOT name this address ...
        cut = real
        while cut.lower().find(addr) >= 0:
            k = cut.lower().find(addr)
            cut = cut[:k] + "0x" + "0" * 40 + cut[k + 42:]
        serve(case["docs"], cut)
        self.assertEqual(w.file(case).get("reason"), "ADDRESS_NOT_IN_DOCS")
        # ... a fork's commit, served under the protocol's own path, does.
        forged = at_sha(case["docs"], FORK_SHA)
        serve(forged, real)
        out = w.file(case, docs_url=forged)
        self.assertNotEqual(
            out["status"], "OK",
            "docs pinned at a commit that is on no branch of " + MOD.github_pin(forged)["owner"] + "/"
            + MOD.github_pin(forged)["repo"] + " (a fork's commit) were accepted; check scored under "
            + str(out.get("protocol")) + " for an address its docs do not list")


# =============================================================================
# R3-02 (High). A "Sherlock" report at a fork-only commit
# =============================================================================

class R3_02_ReportFromAForkCommit(unittest.TestCase):
    """Round-2 fix 2 accepts a report only from owner sherlock-audit, repo
    *-judging, pinned at a SHA. The same fork-network behaviour of GitHub raw
    lets anyone fork a judging repo, edit README.md (the finding's section,
    its audited-code link, a `**sherlock-admin2**` status block linking any
    PR in the fix repo) and pin it as raw.githubusercontent.com/sherlock-audit/
    <contest>-judging/<fork sha>/README.md. report_source_ok() and every
    binding built on the report (fix 1, round-2 fixes 2 and 9) then trust text
    the challenger wrote - round-2 finding R2-02 again, one path over."""

    @known_limitation
    def test_report_commit_that_exists_only_in_a_fork_is_refused(self):
        w = B.World()
        case = B.VAULT_ETH
        forged = at_sha(case["report"], FORK_SHA)
        serve(forged, PAGES[case["report"]] + "\n<!-- edited in a fork -->\n")
        self.assertTrue(MOD.report_source_ok(forged))
        out = w.file(case, report_url=forged)
        self.assertNotEqual(
            out["status"], "OK",
            "a report pinned at a commit that exists only in a fork of sherlock-audit/"
            + MOD.github_pin(forged)["repo"] + " was accepted as Sherlock's (firm "
            + (w.c.checks[out["check_id"]].firm if out.get("check_id") else "?") + ")")


# =============================================================================
# R3-03 (Medium). PREDATES_FIX dates a proxy by its implementation alone
# =============================================================================

class R3_03_NewProxyOnAnOldImplementation(unittest.TestCase):
    """code_born() is the implementation's creation time for a proxy and
    ignores the proxy's own creation. A protocol that deploys a NEW proxy
    after the fix existed, pointing it at an implementation created before
    the fix (the audited, vulnerable one), runs code it chose after the fix -
    yet the check is PREDATES_FIX ("the fix did not exist yet"), everyone is
    refunded and FixRegistry.is_known_unfixed() is False. The same holds for
    an existing proxy upgraded (rolled back) after the fix to such an
    implementation; the contract never reads when the slot took its value.
    Only the later of (proxy created, implementation created) can bound when
    the running code was chosen - and for an upgrade, not even that."""

    FIX_AT = epoch("2024-06-28T00:00:00Z")
    IMPL_CREATED = epoch("2024-05-01T00:00:00Z")     # before the fix
    PROXY_CREATED = epoch("2024-09-01T00:00:00Z")    # after the fix

    @known_limitation
    def test_proxy_created_after_the_fix_is_not_predates_fix(self):
        born = MOD.code_born("0x" + "11" * 20, self.PROXY_CREATED, self.IMPL_CREATED)
        predates_fix = 0 < born < self.FIX_AT
        got = MOD.code_decision("OK", "vulnerable", "vulnerable", "fixed", False, predates_fix)
        self.assertEqual(
            got["verdict"], "NOT_FIXED",
            "a proxy created 2024-09-01, after the fix (2024-06-28), running the audited code is "
            + got["verdict"] + " / " + got["basis"] + ": it is dated by its implementation (2024-05-01)")


if __name__ == "__main__":
    unittest.main(verbosity=2)
