#!/usr/bin/env python3
"""Attack pass, round 3, on the code at commit 2b0f979 (diff 548caff..2b0f979 in contracts/).
The three findings (docs/ATTACK_REPORT_R3.md) failed on that code and were
marked as strict expected failures. Round-3 fixes 1 and 2 close them: the
marks are gone and every test here must pass. Below the three findings are
the regression tests for both fixes.

    python3 test/test_attacks_r3.py

Same stub and real fixtures as test/test_fixcheck.py. No network, no model, no
chain. GitHub's answers (a fork-only commit, a fork's own branch, a
non-default branch, a tag-only commit) and the explorer's Upgraded logs are
real pages in test/fixtures/pages.json (tools/build_fixtures.py).
"""
import json
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
FORK_SHA = "a925a29c22c5b928f4ddc692bee352ad6e0ba664"
GH = "https://github.com/"
JUDGING = "sherlock-audit/2024-05-pooltogether-judging"
# GitHub's real answers (fixtures), read as-is
FORK_ONLY = PAGES[GH + JUDGING + "/branch_commits/" + FORK_SHA]            # upstream path: no branch
FORK_OWN = PAGES[GH + "edwardmadi/2024-05-pooltogether-judging/branch_commits/" + FORK_SHA]  # the fork's "main"
NON_DEFAULT = PAGES[GH + "generationsoftware/pt-v5-vault/branch_commits/ab93652d0c96df8bfaac9e530b87d8a0db31a2d3"]
TAG_ONLY = PAGES[GH + "generationsoftware/pt-v5-vault/branch_commits/ddd63e233cc65ec27e375927276f639ab3bfae48"]


def branch_answer(url: str, body: str, status: int = 200) -> None:
    """Serve `body` as GitHub's branch_commits answer for the commit `url` pins."""
    pin = MOD.pinned_commit(url)
    WEB.pages[GH + pin["owner"] + "/" + pin["repo"] + "/branch_commits/" + pin["sha"]] = (status, body)


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
        # what GitHub answers for a fork-only commit under the upstream path
        branch_answer(forged, FORK_ONLY)
        out = w.file(case, docs_url=forged)
        self.assertNotEqual(
            out["status"], "OK",
            "docs pinned at a commit that is on no branch of " + MOD.github_pin(forged)["owner"] + "/"
            + MOD.github_pin(forged)["repo"] + " (a fork's commit) were accepted; check scored under "
            + str(out.get("protocol")) + " for an address its docs do not list")
        self.assertEqual(out["reason"], "DOCS_COMMIT_NOT_ON_BRANCH")
        self.assertEqual(int(w.c.checks_n), 0)


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

    def test_report_commit_that_exists_only_in_a_fork_is_refused(self):
        w = B.World()
        case = B.VAULT_ETH
        forged = at_sha(case["report"], FORK_SHA)
        serve(forged, PAGES[case["report"]] + "\n<!-- edited in a fork -->\n")
        self.assertTrue(MOD.report_source_ok(forged))
        # GitHub's real answer for this very commit is a fixture (FORK_ONLY)
        self.assertIn(GH + JUDGING + "/branch_commits/" + FORK_SHA, PAGES)
        out = w.file(case, report_url=forged)
        self.assertNotEqual(
            out["status"], "OK",
            "a report pinned at a commit that exists only in a fork of sherlock-audit/"
            + MOD.github_pin(forged)["repo"] + " was accepted as Sherlock's (firm "
            + (w.c.checks[out["check_id"]].firm if out.get("check_id") else "?") + ")")
        self.assertEqual(out["reason"], "REPORT_COMMIT_NOT_ON_BRANCH")
        self.assertNotIn(forged, WEB.log, "refused before the forged report is read")


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
