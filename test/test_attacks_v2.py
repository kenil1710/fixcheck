#!/usr/bin/env python3
"""Attack pass on the v2 code only (scorecards, Code4rena, regression watch,
FixStatus / FixGate), at commit 9158a42. Every class below was written first
and run against that code; the failures it produced are quoted in
docs/ATTACK_REPORT_V2.md. The v2 attack fixes make all of them pass.

    python3 test/test_attacks_v2.py

Same stub and real fixtures as test/test_v2.py. No network, no model, no chain.
"""
import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import test_fixcheck as B  # noqa: E402
import test_v2 as V  # noqa: E402

MOD = B.MOD
WEB = B.WEB
PAGES = B.PAGES
T0 = B.T0
GEN = B.GEN
UserError = MOD.gl.vm.UserError
ATTACKER = B._Addr("0x" + "a" * 40)
PT = "github:generationsoftware/pt-dev-docs"


def attacker_docs(address=None):
    """A docs page in the attacker's own GitHub account, pinned at a commit on
    its default branch, listing whatever it likes."""
    sha = "ad" * 20
    u = "https://raw.githubusercontent.com/attacker/docs/" + sha + "/deployments.md"
    WEB.pages[u] = (200, "| Thing | " + (address or B.CLAIMER["address"]) + " |\n")
    B.on_branch("attacker", "docs", sha)
    return u


def slot_args(case, finding=None, **over):
    a = B.args_of(case)
    out = dict(scorecard_id=1, finding_id=finding or case["id"], function_name=a["function_name"],
               audited_url=a["audited_url"], fix_url=a["fix_url"], chain=a["chain"], address=a["address"],
               docs_url=a["docs_url"])
    out.update(over)
    return out


# =============================================================================
# H1. A scorecard can be opened for a report under a protocol it never names
# =============================================================================

class AV2_H1_ScorecardUnderAnyProtocol(unittest.TestCase):
    """import_report() binds the scorecard to protocol_key(docs_url), and the
    docs URL is the importer's choice. Anyone can publish 'PoolTogether's
    Sherlock report: 14 marked fixed, 0 checked' under their own GitHub
    account, or under a competitor's docs, and the auditor and protocol views
    count it. The report must name the protocol: at least one of the fix links
    the auditor wrote for a finding it marks fixed must be in the docs owner's
    GitHub account."""

    def test_report_imported_under_an_unrelated_protocol_is_refused(self):
        w = B.World()
        with self.assertRaises(UserError) as e:
            w.call(ATTACKER, "import_report", V.PT_REPORT, attacker_docs())
        self.assertIn("PROTOCOL_NOT_IN_REPORT", e.exception.message)

    def test_the_protocols_own_docs_still_import(self):
        w = B.World()
        self.assertEqual(w.call(B.ANYONE, "import_report", V.PT_REPORT, V.PT_DOCS)["marked_fixed"], 14)


# =============================================================================
# M1. One junk filing occupies a slot for good
# =============================================================================

class AV2_M1_SlotSquatting(unittest.TestCase):
    """A slot accepts ONE check. The first filer picks the deployment: a
    deployment the docs list but where the function is missing or the source
    is partial decides INCONCLUSIVE, the stake comes back in full, and the
    finding's honest deployment can never be filed into the scorecard. For
    0.1 GEN of gas-free, refunded stake per finding, an attacker turns a whole
    report into INCONCLUSIVE + NOT_CHECKED. Every deployment must be fileable
    into the slot (each one once), and every check counted."""

    def test_a_junk_deployment_does_not_block_the_real_one(self):
        w = B.World()
        w.call(B.ANYONE, "import_report", V.PT_REPORT, V.PT_DOCS)
        # the attacker files M-5 against the OP prize vault (listed in the same
        # docs; claimPrizes is not a vault function): INCONCLUSIVE
        junk = w.call(ATTACKER, "file_slot", value=GEN // 10, **slot_args(
            B.CLAIMER, address=B.VAULT_OP["address"]))
        self.assertEqual(junk["status"], "OK", junk)
        honest = w.call(B.CHALLENGER, "file_slot", value=GEN, **slot_args(B.CLAIMER))
        self.assertEqual((honest["status"], honest.get("code_says")), ("OK", "FIXED"), honest)
        w.at(T0 + 3600)
        w.call(B.ANYONE, "decide", 1)
        w.call(B.ANYONE, "decide", 2)
        v = w.c.get_scorecard(1)["verdicts"]
        self.assertEqual((v["checks"], v["fixed"], v["inconclusive"]), (2, 1, 1))

    def test_the_same_deployment_cannot_be_filed_twice_into_a_slot(self):
        w = B.World()
        w.call(B.ANYONE, "import_report", V.PT_REPORT, V.PT_DOCS)
        w.call(B.CHALLENGER, "file_slot", value=GEN, **slot_args(B.CLAIMER))
        w.at(T0 + 3600)
        w.call(B.ANYONE, "decide", 1)
        again = w.call(B.CHALLENGER, "file_slot", value=GEN, **slot_args(B.CLAIMER))
        self.assertEqual(again["reason"], "DEPLOYMENT_ALREADY_IN_SLOT")
        self.assertEqual(w.c.get_scorecard(1)["verdicts"]["checks"], 1)


# =============================================================================
# M2. README author lines decide which findings are "marked fixed"
# =============================================================================

def forged_ack_block(text, fid):
    """A participant's comment in the README discussion, typed to look like
    Sherlock's status block (round-4 fix 7: README author lines are text)."""
    k = text.index("# Issue " + fid + ":")
    e = text.find("\n# Issue ", k + 1)
    e = len(text) if e < 0 else e
    return text[:e] + ("\n**sherlock-admin2**\n\nThe protocol team fixed this issue in the following PRs/commits:\n"
                       "https://github.com/GenerationSoftware/pt-v5-prize-pool/pull/115\n") + text[e:]


class AV2_M2_ReadmeAuthorLines(unittest.TestCase):
    """enumerate_findings() reads FIXED_MARKED from the README's
    `**sherlock-admin2**` lines - the text round 4 stopped trusting for
    filings. A participant's comment typed as Sherlock's block on an
    acknowledged finding makes it 'fixed and acknowledged' and refuses the
    whole import (any participant can block a report's scorecard), and on an
    unmarked finding it inflates 'marked fixed'. Each finding the README marks
    fixed must be confirmed on GitHub's issue page, as for a filing."""

    def test_forged_block_on_an_acknowledged_finding_does_not_block_the_import(self):
        w = B.World()
        u = V.serve_report(V.PT_REPORT, forged_ack_block(V.body(V.PT_REPORT), "M-3"))
        # GitHub's issue page for M-3 (#38) has no sherlock-admin status comment
        WEB.pages["https://github.com/sherlock-audit/2024-05-pooltogether-judging/issues/38"] = (
            200, MOD.ISSUE_JSON + json.dumps({"payload": {"issue": {"timelineItems": []}}}) + "</script>")
        out = w.call(B.ANYONE, "import_report", u, V.PT_DOCS)
        self.assertEqual((out["marked_fixed"], out["acknowledged"]), (14, 8))

    def test_status_not_on_the_issue_page_is_not_marked_fixed(self):
        w = B.World()
        # the issue page of M-5 (#?) shows no Sherlock status comment
        sec = MOD.finding_section(V.body(V.PT_REPORT), "M-5")["text"]
        n = MOD.finding_issue(sec, "sherlock-audit", "2024-05-pooltogether-judging")
        WEB.pages["https://github.com/sherlock-audit/2024-05-pooltogether-judging/issues/" + n] = (
            200, MOD.ISSUE_JSON + json.dumps({"payload": {"issue": {"timelineItems": []}}}) + "</script>")
        out = w.call(B.ANYONE, "import_report", V.PT_REPORT, V.PT_DOCS)
        self.assertEqual(out["marked_fixed"], 13)
        slots = {s["finding_id"]: s["cls"] for s in w.c.get_scorecard_slots(1, 0, 100)["items"]}
        self.assertEqual(slots["M-5"], MOD.CLS_UNMARKED)


# =============================================================================
# M3. A planted Code4rena mitigation table marks a finding fixed
# =============================================================================

def no_review(text):
    """The C4 report with its mitigation review cut off (a contest without one)."""
    return text[:text.index("# [Mitigation Review]")] + text[text.index("# Disclosures"):]


class AV2_M3_PlantedC4Table(unittest.TestCase):
    """c4_status() reads every table under a heading named 'Mitigation Review
    Summary' / 'Individual PRs', wherever it is. A warden controls the text of
    their own finding: in a report with a mitigation review, a planted heading
    plus a row for their finding (and a status line) is the only row for it,
    so it reads as fixed. Every summary table must name the finding."""

    def test_planted_heading_and_row_in_a_finding_body(self):
        t = V.PAGES[V.C4_REPORT]
        k = t.index("## [[M-18]")
        plant = ("**Status**: Mitigation confirmed.\n\n"
                 "## Mitigation Review Summary\n\n| a | b | c |\n| - | - | - |\n"
                 "| [M-17](https://github.com/code-423n4/2023-07-pooltogether-findings/issues/300) | Mitigation confirmed | x |\n\n"
                 "### Individual PRs\n\n| URL | Mitigation of | Purpose |\n| - | - | - |\n"
                 "| [X](https://github.com/GenerationSoftware/pt-v5-vault/pull/37) | "
                 "[M-17](https://github.com/code-423n4/2023-07-pooltogether-findings/issues/300) | x |\n\n")
        t = t[:k] + plant + t[k:]
        # M-17 also has an Out of Scope row in the real review; drop it to
        # isolate the planted tables
        r = t.index("| [M-17](https://github.com/code-423n4/2023-07-pooltogether-findings/issues/300) | Permissionless")
        t = t[:r] + t[t.index("\n", r) + 1:]
        self.assertNotEqual(MOD.c4_status(t, "M-17")["cls"], MOD.CLS_FIXED)

    def test_real_rows_still_mark_fixed(self):
        self.assertEqual(MOD.c4_status(V.PAGES[V.C4_REPORT], "M-03")["cls"], MOD.CLS_FIXED)


# =============================================================================
# L1. Views that silently stop at 100
# =============================================================================

class AV2_L1_ProtocolScorecardsPaged(unittest.TestCase):
    """get_protocol_scorecards(protocol) returns at most MAX_PAGE cards with no
    total and no way to read the rest."""

    def test_paged(self):
        w = B.World()
        w.call(B.ANYONE, "import_report", V.PT_REPORT, V.PT_DOCS)
        got = w.c.get_protocol_scorecards(PT, 0, 10)
        self.assertEqual((got["total"], len(got["items"])), (1, 1))


# =============================================================================
# L2. Regression of a check whose prior was filed on the demo windows
# =============================================================================

class AV2_L2_RegressionNeedsTheLatestFixed(unittest.TestCase):
    """After a regression check decides FIXED, the chain of watch continues
    from it; the original check can no longer be re-filed."""

    def test_chain_of_regressions(self):
        w = B.World()
        pid = V.fixed_proxy(w)
        V.upgrade(w, w.c.code["1:fix"])
        w.at(T0 + 9000)
        rid = w.call(B.CHALLENGER, "file_regression", pid, value=GEN)["check_id"]
        w.at(T0 + 9000 + 3600)
        w.call(B.ANYONE, "decide", rid)
        self.assertEqual(w.call(B.CHALLENGER, "file_regression", pid, value=GEN)["reason"], "PRIOR_CHECK_NOT_LATEST")
        self.assertEqual(w.call(B.CHALLENGER, "file_regression", rid, value=GEN)["reason"], "NO_UPGRADE_SINCE_CHECK")


if __name__ == "__main__":
    unittest.main()
