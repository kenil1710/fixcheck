#!/usr/bin/env python3
"""Attack pass, round 2, on the v1.2 code (diff 655d61e..HEAD in contracts/).
Every test here FAILS on the current code, for the reason its docstring states
(docs/ATTACK_REPORT_R2.md):

    python3 test/test_attacks_r2.py

Same stub and real fixtures as test/test_fixcheck.py (imported as a module so
its tests are not collected twice). No network, no model, no chain. Facts that
come from outside the fixtures (commit dates, how GitHub raw and the Wayback
Machine answer) were read once during this pass and are written down in the
docstrings and in the report.
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


def decide(dep: str, aud: str, fix: str) -> dict:
    """What decide() does before it asks the model."""
    out = MOD.code_decision("OK", MOD.canon(dep), MOD.canon(aud), MOD.canon(fix))
    if not out and MOD.contains_fix(dep, aud, fix):
        out = {"verdict": "FIXED", "basis": "CODE_CONTAINS_FIX"}
    return out


def code_says(files: dict, file_name: str, fn: str, aud: str, fix: str) -> dict:
    got = MOD.extract(files, file_name, fn)
    if not got["ok"]:
        return MOD.code_decision(got["why"], "", "", "")
    out = MOD.code_decision("OK", got["canon"], MOD.canon(aud), MOD.canon(fix))
    if not out and MOD.contains_fix(got["code"], aud, fix):
        out = {"verdict": "FIXED", "basis": "CODE_CONTAINS_FIX"}
    return out


# =============================================================================
# R2-01 (High). NOT_FIXED on a deployment created before the fix existed
# =============================================================================

class R2_01_DeployedBeforeTheFixIsNotNotFixed(unittest.TestCase):
    """PREDATES_AUDIT compares the creation time with the AUDITED commit's
    date only. A contract created after the audited commit but before the fix
    commit could not contain the fix either, yet it is decided NOT_FIXED and
    the challenger takes every defender's stake.

    This is live check #5 (PoolTogether M-16, Arbitrum vault
    0x97A9...8c95): created 2024-05-29 (Sourcify deployment, block 216345371).
    The fix file it is judged against is pt-v5-vault@60be8fc, the head of
    PR #113, committed 2024-06-21T16:58:31Z and merged 2024-06-28 (merge
    2acdde5) - three weeks AFTER the vault was deployed. Check #6 (Ethereum
    vault, created 2024-08-19 by a factory created the same day; fix a812f89
    committed 2024-06-21, PR #112 merged 2024-06-28) is after its fix and is a
    fair NOT_FIXED."""

    FIX_COMMITTED_AT = epoch("2024-06-21T16:58:31Z")    # GenerationSoftware/pt-v5-vault@60be8fc

    def test_arbitrum_vault_created_before_its_fix_commit_is_not_not_fixed(self):
        w = B.World()
        out = w.file(B.VAULT)
        self.assertEqual(out["status"], "OK", out)
        ch = w.c.checks[out["check_id"]]
        self.assertLess(int(ch.audited_at), int(ch.created_at))           # after the audit ...
        self.assertLess(int(ch.created_at), self.FIX_COMMITTED_AT)        # ... before the fix existed
        w.at(T0 + 3600)
        d = w.call(B.ANYONE, "decide", out["check_id"])
        self.assertNotEqual(
            d["verdict"], "NOT_FIXED",
            "the Arbitrum vault was created " + datetime.fromtimestamp(int(ch.created_at), tz=timezone.utc).date().isoformat()
            + ", before fix commit 60be8fc (2024-06-21) existed, and is still decided NOT_FIXED / "
            + d["basis"] + "; it should be PREDATES_FIX (created before the fix commit's date)")


# =============================================================================
# R2-02 (High). The report itself is unbound: anyone's repo or archived page
# =============================================================================

ATTACKER_REPORT = "https://raw.githubusercontent.com/attacker/fake-audit/" + "9" * 40 + "/README.md"
CONTEST_SHA = "1aa1b8c028b659585e4c7a6b9b652fb075f86db3"
CLAIMER_FIX_SHA = "0651d1457d34b51d02ab0f535edc7a3ca72b176f"


class R2_02_ReportFromAnyAuthor(unittest.TestCase):
    """Fix 1 binds the audited and fix files to the REPORT, but any GitHub repo
    at a SHA (or any archived page on any host) is accepted as the report.
    The challenger writes the report: it "links" the FIXED code as the audited
    commit and the contest's vulnerable commit as the "fix". Deployed code
    that equals the real fix is then decided NOT_FIXED / CODE_MATCH_VULNERABLE
    by code, scored under the real protocol (protocol comes from the docs URL).
    That is round-1 finding 1 again, one level up."""

    def test_attacker_authored_report_turns_fixed_code_into_not_fixed(self):
        w = B.World()
        case = B.CLAIMER                    # deployed claimPrizes == fix commit 0651d14
        WEB.pages[ATTACKER_REPORT] = (200, "\n".join([
            "# Issue M-5: The claimer's fee will be stolen by the winner",
            "",
            "Code: https://github.com/GenerationSoftware/pt-v5-claimer/blob/" + CLAIMER_FIX_SHA + "/src/Claimer.sol#L90",
            "`claimPrizes` lets the winner take the fee.",
            "",
            "The protocol team fixed this issue in the following PRs/commits:",
            "https://github.com/sherlock-audit/2024-05-pooltogether/commit/" + CONTEST_SHA,
            ""]))
        WEB.pages["https://github.com/generationsoftware/pt-v5-claimer/commits/" + CLAIMER_FIX_SHA + ".atom"] = (
            200, "<feed><entry><updated>2024-07-01T00:00:00Z</updated></entry></feed>")
        out = w.file(case, report_url=ATTACKER_REPORT,
                     audited_url=case["fix"],      # the FIXED file, "audited"
                     fix_url=case["audited"])      # the contest (vulnerable) file, "fix"
        if out["status"] != "OK":
            return
        w.at(T0 + 3600)
        d = w.call(B.ANYONE, "decide", out["check_id"])
        self.assertNotEqual(
            (d["verdict"], d["basis"]), ("NOT_FIXED", "CODE_MATCH_VULNERABLE"),
            "a report written by the challenger (" + ATTACKER_REPORT + ", firm "
            + w.c.checks[out["check_id"]].firm + ") made deployed code equal to the fix a code-fact NOT_FIXED "
            "under protocol " + w.c.checks[out["check_id"]].protocol)


# =============================================================================
# R2-03 (High). CODE_CONTAINS_FIX with the whole hunk in a dead block, or
# after an early return
# =============================================================================

AUD = ("function withdraw(uint256 a) external {\n"
       "    uint256 b = bal[msg.sender];\n"
       "    token.transfer(msg.sender, a);\n"
       "    bal[msg.sender] = b - a;\n"
       "}")
FIX = ("function withdraw(uint256 a) external {\n"
       "    uint256 b = bal[msg.sender];\n"
       "    require(b >= a, \"balance\");\n"
       "    token.transfer(msg.sender, a);\n"
       "    bal[msg.sender] = b - a;\n"
       "}")


class R2_03_HunkMatchedOffTheLivePath(unittest.TestCase):
    """contains_fix() looks for each hunk (added lines + one context line on
    each side) anywhere at or after the previous hunk, with depths RELATIVE to
    the hunk's first line, and checks that no removed line survives. A fix
    that only adds a guard removes nothing, so (a) a copy of the whole hunk
    inside `if (1 == 2) { ... }` followed by the unguarded original, or (b) an
    early `return` that does the transfer before the guard, still gives
    FIXED / CODE_CONTAINS_FIX with the model never asked."""

    def test_whole_hunk_inside_dead_block(self):
        dep = ("function withdraw(uint256 a) external {\n"
               "    if (1 == 2) {\n"
               "        uint256 b = bal[msg.sender];\n"
               "        require(b >= a, \"balance\");\n"
               "        token.transfer(msg.sender, a);\n"
               "    }\n"
               "    uint256 b = bal[msg.sender];\n"
               "    token.transfer(msg.sender, a);\n"
               "    bal[msg.sender] = b - a;\n"
               "}")
        self.assertNotEqual(decide(dep, AUD, FIX).get("verdict"), "FIXED",
                            "the guarded copy can never run; the live path is the audited one")

    def test_early_return_before_the_guard(self):
        dep = ("function withdraw(uint256 a) external {\n"
               "    if (a > 0) { token.transfer(msg.sender, a); bal[msg.sender] -= a; return; }\n"
               "    uint256 b = bal[msg.sender];\n"
               "    require(b >= a, \"balance\");\n"
               "    token.transfer(msg.sender, a);\n"
               "    bal[msg.sender] = b - a;\n"
               "}")
        self.assertNotEqual(decide(dep, AUD, FIX).get("verdict"), "FIXED",
                            "every a > 0 transfers and returns before the require")


# =============================================================================
# R2-04 (Medium). The judged file is not tied to the compiled contract
# =============================================================================

class R2_04_JudgedFileIsNotTheCompiledContract(unittest.TestCase):
    """A proxy that keeps its implementation outside the EIP-1967 slot (a
    beacon the explorer does not resolve, a custom slot, a Safe-style
    slot-0 proxy) reads as "not a proxy": slot empty, explorer names nothing.
    If its verified bundle carries the implementation's file (Hardhat-style
    full-job verification), that file is judged although the verified
    contract is `CustomProxy`, which neither is nor inherits PrizeVault. And
    because `implementation` is empty, a proxy created before the audit is
    decided PREDATES_AUDIT whatever it runs today. Blockscout (`name`) and
    Sourcify (`compilation.name`) both say which contract was compiled; it
    is never read."""

    def test_unrelated_file_in_a_proxy_bundle_decides(self):
        w = B.World()
        case = B.VAULT_OP                   # OP, created 2024-04-18 (before the audit)
        u = MOD.source_url(case["chain"], case["address"].lower())
        WEB.pages[u] = (200, json.dumps({
            "is_verified": True, "is_fully_verified": True, "name": "CustomProxy",
            "file_path": "src/CustomProxy.sol",
            "source_code": ("contract CustomProxy {\n"
                            "    fallback() external payable {\n"
                            "        address impl;\n"
                            "        assembly { impl := sload(0x1234) }\n"
                            "        (bool ok, ) = impl.delegatecall(msg.data);\n"
                            "        require(ok);\n"
                            "    }\n"
                            "}\n"),
            "additional_sources": [{"file_path": "src/PrizeVault.sol", "source_code": PAGES[case["audited"]]}]}))
        out = w.file(case)
        self.assertEqual(out["status"], "OK", out)
        w.at(T0 + 3600)
        d = w.call(B.ANYONE, "decide", out["check_id"])
        self.assertEqual(d["verdict"], "INCONCLUSIVE",
                         "verified contract is CustomProxy (a delegatecall proxy), yet a bundled "
                         "PrizeVault.sol decided " + d["verdict"] + " / " + d["basis"])


# =============================================================================
# R2-05 (Medium). Override through an import alias
# =============================================================================

class R2_05_OverrideThroughImportAlias(unittest.TestCase):
    """extract()'s override rule follows `is` names literally. `import
    {PrizeVault as Base}` + `contract MyVault is Base` puts "Base" in the
    graph, which no contract declares, so the vulnerable override in MyVault
    is not seen as deriving from PrizeVault and code decides CODE_MATCH_FIX
    from the base file that does not run."""

    def test_vulnerable_override_via_aliased_parent(self):
        base = "contract PrizeVault {\n" + FIX + "\n}\n"
        derived = ("import {PrizeVault as Base} from \"lib/pt-v5-vault/src/PrizeVault.sol\";\n"
                   "contract MyVault is Base {\n"
                   + AUD.replace("external {", "external override {", 1) + "\n}\n")
        files = {"lib/pt-v5-vault/src/PrizeVault.sol": base, "src/MyVault.sol": derived}
        out = code_says(files, "PrizeVault.sol", "withdraw", AUD, FIX)
        self.assertNotEqual(out.get("verdict"), "FIXED",
                            "MyVault (is Base == PrizeVault) overrides withdraw with the audited body")


# =============================================================================
# R2-06 (Medium). The fix calls a virtual helper that the deployed contract
# overrides
# =============================================================================

AUD6 = ("function withdraw(uint256 a) external {\n"
        "    token.transfer(msg.sender, a);\n"
        "    bal[msg.sender] -= a;\n"
        "}")
FIX6 = ("function withdraw(uint256 a) external {\n"
        "    _checkBalance(a);\n"
        "    token.transfer(msg.sender, a);\n"
        "    bal[msg.sender] -= a;\n"
        "}")


class R2_06_FixHelperOverridden(unittest.TestCase):
    """The running-implementation rule (fix 3) is applied to the named function
    only. Many fixes add a call to an internal virtual helper. A derived
    contract that overrides that helper with an empty body leaves the named
    function byte-identical to the fix, so code decides CODE_MATCH_FIX while
    the check that runs does nothing."""

    def test_empty_override_of_the_helper_the_fix_calls(self):
        base = ("contract PrizeVault {\n" + FIX6 + "\n"
                "function _checkBalance(uint256 a) internal view virtual {\n"
                "    require(bal[msg.sender] >= a, \"balance\");\n"
                "}\n}\n")
        derived = ("import {PrizeVault} from \"lib/pt-v5-vault/src/PrizeVault.sol\";\n"
                   "contract MyVault is PrizeVault {\n"
                   "function _checkBalance(uint256) internal view override {}\n}\n")
        files = {"lib/pt-v5-vault/src/PrizeVault.sol": base, "src/MyVault.sol": derived}
        out = code_says(files, "PrizeVault.sol", "withdraw", AUD6, FIX6)
        self.assertNotEqual(out.get("verdict"), "FIXED",
                            "the only line the fix added calls _checkBalance, which MyVault overrides "
                            "with an empty body")


# =============================================================================
# R2-07 (Medium). A moved line grounds FIXED on the vulnerable order
# =============================================================================

AUD7 = ("function withdraw(uint256 a) external {\n"
        "    uint256 b = bal[msg.sender];\n"
        "    token.transfer(msg.sender, a);\n"
        "    bal[msg.sender] = b - a;\n"
        "    emit Withdrawn(msg.sender, a);\n"
        "}")
FIX7 = ("function withdraw(uint256 a) external {\n"
        "    uint256 b = bal[msg.sender];\n"
        "    bal[msg.sender] = b - a;\n"
        "    token.transfer(msg.sender, a);\n"
        "    emit Withdrawn(msg.sender, a);\n"
        "}")
DEP7 = ("function withdraw(uint256 a) external {\n"
        "    uint256 b = bal[msg.sender];\n"
        "    token.transfer(msg.sender, a);\n"
        "    bal[msg.sender] = b - a;\n"
        "    emit Withdrawn(msg.sender, a, block.timestamp);\n"
        "}")


class R2_07_MovedLineGroundsFixed(unittest.TestCase):
    """A checks-effects-interactions fix only MOVES a line. The diff lists it
    as removed and added, so _vulnerable_lines() is empty and grounded()
    accepts FIXED for any quote of the moved line - a line that is in the
    audited (vulnerable) function too. Deployed code still in the vulnerable
    order, plus one unrelated edit so code does not decide, therefore gets a
    grounded FIXED from any two FIXED answers; the finding prose (not blanked,
    and including the protocol team's own replies) is free to ask for it."""

    def test_moved_line_is_not_evidence_of_the_fix(self):
        ch = MOD.fix_change(AUD7, FIX7)
        self.assertEqual(MOD._vulnerable_lines(ch), [], ch)
        moved = ch["added"][0]
        self.assertIn(moved, MOD._canon_lines(AUD7), "precondition: the 'added' line is in the vulnerable version")
        self.assertEqual(decide(DEP7, AUD7, FIX7), {}, "precondition: code leaves this to the model")
        idx = [k for k, ln in enumerate(MOD.code_lines(DEP7)) if MOD.canon(ln) == moved]
        self.assertTrue(idx)
        self.assertFalse(MOD.grounded("FIXED", idx, DEP7, ch),
                         "FIXED grounded on `" + moved + "`, which the vulnerable order also has; "
                         "the deployed function still transfers before it writes the balance")


# =============================================================================
# R2-08 (Medium). A far-future Wayback timestamp is accepted as a pin
# =============================================================================

class R2_08_ArchivePinCanFloat(unittest.TestCase):
    """archive_pin() accepts any 14-digit timestamp. The Wayback Machine answers
    a timestamp that is not a capture with a 302 to the CLOSEST capture
    (checked: /web/20991231235959/https://docs.sherlock.xyz/ -> the
    2026-09-05 capture). A far-future "pin" is therefore "latest": the report
    or docs page it names changes with every new capture, so leader and
    validators can read different bodies and the stored URL is not the
    evidence it claims to be."""

    def test_future_timestamp_is_not_a_pin(self):
        # archive_pin takes the filing time (the contract's only clock); T0 is the suite's
        self.assertEqual(MOD.archive_pin("https://web.archive.org/web/20991231235959/https://example.com/report.md", T0), {},
                         "a timestamp in 2099 resolves to whatever capture is newest")


# =============================================================================
# R2-09 (Low). URL normalisation: one document, two keys; two documents, one key
# =============================================================================

class R2_09_UrlSpellings(unittest.TestCase):
    """norm_url() keeps percent-encoding and drops an archived target's query.
    raw.githubusercontent.com serves README.md, README%2Emd, %52EADME.md and
    sherlock%2Daudit/... with the same 241218 bytes (checked), so one finding
    can be open twice. And two archived reports that differ only in their
    query string (?id=1 / ?id=2) collapse into one key - and one fetched URL,
    without the query."""

    REP = "https://raw.githubusercontent.com/sherlock-audit/2024-05-pooltogether-judging/88298eacec6f178fd0b5f9f13e4605c58aa58072/"

    def test_percent_encoded_spelling_is_the_same_key(self):
        a = MOD.check_key(self.REP + "README.md", "M-16", "arbitrum", B.VAULT["address"])
        b = MOD.check_key(self.REP + "README%2Emd", "M-16", "arbitrum", B.VAULT["address"])
        self.assertEqual(a, b, "same bytes from GitHub, two check keys")

    def test_archived_reports_differing_in_query_are_different_keys(self):
        a = MOD.check_key("https://web.archive.org/web/20240101000000/https://firm.example/report?id=1", "H-1", "ethereum", "0x" + "1" * 40)
        b = MOD.check_key("https://web.archive.org/web/20240101000000/https://firm.example/report?id=2", "H-1", "ethereum", "0x" + "1" * 40)
        self.assertNotEqual(a, b, "two different archived reports share one key")


# =============================================================================
# R2-10 (Low). The EIP-1967 slot is read at "latest"
# =============================================================================

class R2_10_SlotReadAtLatest(unittest.TestCase):
    """The implementation slot is read with eth_getStorageAt(..., "latest") by
    the leader and by each validator at its own time, so an upgrade landing
    between the reads makes the evidence differ and the filing round fail
    (UNDETERMINED, retried). It cannot produce a wrong verdict - every party
    must agree on one value - but the read is not pinned to a block."""

    def test_slot_read_is_pinned_to_a_block(self):
        seen = []
        real = MOD.rpc

        def spy(chain, method, params):
            seen.append((method, params))
            return real(chain, method, params)
        MOD.rpc = spy
        try:
            w = B.World()
            self.assertEqual(w.file(B.VAULT)["status"], "OK")
        finally:
            MOD.rpc = real
        tags = [p[-1] for m, p in seen if m == "eth_getStorageAt"]
        self.assertTrue(tags)
        self.assertNotIn("latest", tags, "the implementation slot was read at 'latest'")


# =============================================================================
# R2-11 (Low). canon() joins operators into a different program
# =============================================================================

class R2_11_CanonJoinsOperators(unittest.TestCase):
    """canon() drops every space between two non-word characters. `a + ++b`
    and `a++ + b` are both valid Solidity with different results (b is
    incremented before vs a after), and both become `a+++b`."""

    def test_pre_and_post_increment_differ(self):
        self.assertNotEqual(MOD.canon("x = a + ++b;"), MOD.canon("x = a++ + b;"))


# =============================================================================
# R2-12 (Medium). A fix link in anyone's comment counts
# =============================================================================

class R2_12_FixLinkInAnyonesComment(unittest.TestCase):
    """fix_links() accepts every pull/commit link of the fix repo anywhere in
    the section. A Sherlock section is the issue plus its whole discussion:
    the real M-16 section has comments by infect3d, nevillehuang and 10xhash
    besides sherlock-admin's "The protocol team fixed this issue in the
    following PRs/commits:" block. Anyone can open a PR on a public repo, and
    the PR's .patch is served whether or not it was merged. A participant's
    comment linking their own PR makes that PR's head an accepted "fix" file -
    e.g. one equal to a deployed function that is neither the audited nor the
    real fix, which code then decides FIXED / CODE_MATCH_FIX."""

    def test_pr_linked_only_in_a_participant_comment_is_not_a_fix(self):
        rep = PAGES[B.VAULT["report"]]
        sec = MOD.finding_section(rep, "M-16")["text"]
        sec += ("\n\n**someone**\n\nI think the real fix is "
                "https://github.com/GenerationSoftware/pt-v5-vault/pull/999\n")
        pin = MOD.github_pin(B.VAULT["fix"])
        links = MOD.fix_links(sec, pin)
        self.assertIn("113", links["pulls"])        # the team's PR, from the status block
        self.assertNotIn("999", links["pulls"],
                         "a PR linked only in a participant's comment is accepted as the fix")


if __name__ == "__main__":
    unittest.main(verbosity=2)
