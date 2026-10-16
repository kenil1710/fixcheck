#!/usr/bin/env python3
"""FixCheck v2 suite: whole-report scorecards, Code4rena as a second auditor,
regression re-filing (REGRESSED), and the FixStatus / FixGate consumers.

    python3 test/test_v2.py

Same stub and real fixtures as test/test_fixcheck.py (the real Sherlock
judging READMEs, deployed sources and RPC answers), plus the real Code4rena
report.md of the 2023-07 PoolTogether contest (test/fixtures/pages_v2.json).
The ledger identity is asserted after every call and every call that raises
is checked to have written nothing (World.call).
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
T0 = B.T0
GEN = B.GEN
STATUS = B.stub.load_full(B.ROOT / "contracts" / "FixStatus.py", "fixstatus")
GATE = B.stub.load_full(B.ROOT / "contracts" / "FixGate.py", "fixgate")

V2 = json.loads((HERE / "fixtures" / "pages_v2.json").read_text())
PAGES.update(V2["pages"])
C4_REPORT = V2["c4_report"]
PT_REPORT = B.CLAIMER["report"]
PT_DOCS = B.CLAIMER["docs"]
MELLOW_REPORT = B.CONSENSUS["report"]
MELLOW_DOCS = B.CONSENSUS["docs"]


def body(url):
    return PAGES[MOD.norm_url(url)] if MOD.norm_url(url) in PAGES else PAGES[url]


def c4_world(**kw):
    w = B.World(**kw)
    pin = MOD.github_pin(C4_REPORT)
    B.on_branch(pin["owner"], pin["repo"], pin["sha"])
    return w


def serve_report(url, text):
    """A variant of a real report served at a pinned URL of the same repo."""
    pin = MOD.github_pin(url)
    sha = "ab" * 20
    u = "https://raw.githubusercontent.com/" + pin["owner"] + "/" + pin["repo"] + "/" + sha + "/" + pin["path"]
    WEB.pages[u] = (200, text)
    B.on_branch(pin["owner"], pin["repo"], sha)
    return u


# =============================================================================
# 1. enumeration: every finding, by code, on the real reports
# =============================================================================

class V2_01_EveryFindingEnumerated(unittest.TestCase):
    def test_sherlock_pooltogether_all_22(self):
        en = MOD.enumerate_findings(body(PT_REPORT), "sherlock")
        ids = [x[0] for x in en["items"]]
        self.assertEqual(ids, ["H-1", "H-2", "H-3"] + ["M-%d" % i for i in range(1, 20)])
        fixed = [x[0] for x in en["items"] if x[1] == MOD.CLS_FIXED]
        ack = [x[0] for x in en["items"] if x[1] == MOD.CLS_ACK]
        self.assertEqual(fixed, ["H-1", "H-2", "H-3", "M-1", "M-2", "M-5", "M-7", "M-8", "M-9", "M-14",
                                 "M-15", "M-16", "M-17", "M-19"])
        self.assertEqual(ack, ["M-3", "M-4", "M-6", "M-10", "M-11", "M-12", "M-13", "M-18"])

    def test_sherlock_mellow_and_cap(self):
        m = MOD.enumerate_findings(body(MELLOW_REPORT), "sherlock")["items"]
        self.assertEqual((len(m), len([x for x in m if x[1] == MOD.CLS_FIXED])), (15, 13))
        c = MOD.enumerate_findings(body(B.CAP["report"]), "sherlock")["items"]
        self.assertEqual((len(c), len([x for x in c if x[1] == MOD.CLS_FIXED])), (10, 3))

    def test_code4rena_pooltogether_all_36(self):
        en = MOD.enumerate_findings(PAGES[C4_REPORT], "code4rena")
        by = {}
        for fid, cls, _t in en["items"]:
            by.setdefault(cls, []).append(fid)
        self.assertEqual(len(en["items"]), 36)
        self.assertEqual(len(by[MOD.CLS_FIXED]), 27)
        self.assertEqual(by[MOD.CLS_NOT_MITIGATED], ["H-05", "H-09", "M-02", "M-09", "M-16", "M-18", "M-22"])
        self.assertEqual(by[MOD.CLS_ACK], ["M-01"])
        self.assertEqual(by[MOD.CLS_UNMARKED], ["M-17"])

    def test_code4rena_fix_link_comes_from_c4s_own_table(self):
        st = MOD.c4_status(PAGES[C4_REPORT], "M-07")
        self.assertEqual(st["cls"], MOD.CLS_FIXED)
        self.assertIn("pt-v5-prize-pool/commit/ba56ea8bac3bce06f1e08ae071a19954dd720b1f", st["row"])
        self.assertEqual(MOD.c4_status(PAGES[C4_REPORT], "H-05")["cls"], MOD.CLS_NOT_MITIGATED)

    def test_auditor_of(self):
        self.assertEqual(MOD.auditor_of(PT_REPORT), "sherlock")
        self.assertEqual(MOD.auditor_of(C4_REPORT), "code4rena")
        self.assertEqual(MOD.auditor_of(C4_REPORT[:-len("report.md")] + "README.md"), "")
        self.assertEqual(MOD.auditor_of("https://raw.githubusercontent.com/attacker/x-findings/" + "1" * 40
                                        + "/report.md"), "")


# =============================================================================
# 2. partial or ambiguous imports are refused whole
# =============================================================================

class V2_02_PartialImportsRefused(unittest.TestCase):
    def refused(self, text, auditor="sherlock"):
        return MOD.enumerate_findings(text, auditor).get("refused")

    def test_a_missing_finding_is_refused(self):
        t = body(PT_REPORT)
        a = t.index("# Issue M-4:")
        b = t.index("# Issue M-5:")
        self.assertEqual(self.refused(t[:a] + t[b:]), "FINDING_IDS_NOT_IN_SEQUENCE")

    def test_a_duplicated_finding_is_refused(self):
        t = body(PT_REPORT)
        self.assertEqual(self.refused(t + "\n# Issue M-5: again\n"), "FINDING_IDS_NOT_UNIQUE")

    def test_fixed_and_acknowledged_at_once_is_refused(self):
        t = body(PT_REPORT)
        k = t.index("# Issue M-5:")
        e = t.index("\n", k)
        t = t[:e + 1] + "\n" + MOD.SHERLOCK_ACK + "\n" + t[e + 1:]
        self.assertEqual(self.refused(t), "FINDING_STATUS_AMBIGUOUS")

    def test_too_many_findings_is_refused_not_cut(self):
        t = "".join("# Issue M-%d: x\n\nSource: y\n\n" % i for i in range(1, MOD.MAX_FINDINGS + 2))
        self.assertEqual(self.refused(t), "TOO_MANY_FINDINGS")

    def test_nothing_marked_fixed(self):
        t = (B.ROOT / "research_cache" / "2023-06-arrakis-judging.md").read_text()
        self.assertEqual(self.refused(t), "NOTHING_MARKED_FIXED")

    def test_c4_count_must_match_c4s_own_header(self):
        t = PAGES[C4_REPORT]
        k = t.index("# Medium Risk Findings")
        t = t[:k] + "## [[H-10] planted](https://example.com)\n\n" + t[k:]
        self.assertEqual(self.refused(t, "code4rena"), "FINDING_COUNT_MISMATCH")

    def test_c4_planted_summary_row_cannot_mark_fixed(self):
        # a warden types a summary row for M-17 into a finding body
        t = PAGES[C4_REPORT]
        k = t.index("## [[M-18]")
        row = ("\n## Mitigation Review Summary\n\n| a | b | c |\n| - | - | - |\n"
               "| [M-17](https://github.com/code-423n4/2023-07-pooltogether-findings/issues/300) | Mitigation confirmed | x |\n\n")
        self.assertEqual(MOD.c4_status(t[:k] + row + t[k:], "M-17")["cls"], MOD.CLS_AMBIGUOUS)
        self.assertEqual(self.refused(t[:k] + row + t[k:], "code4rena"), "FINDING_STATUS_AMBIGUOUS")

    def test_c4_planted_second_fix_row_is_ambiguous(self):
        t = PAGES[C4_REPORT]
        k = t.index("## [[M-18]")
        row = ("\n### Individual PRs\n\n| URL | Mitigation of | Purpose |\n| - | - | - |\n"
               "| [X](https://github.com/GenerationSoftware/pt-v5-vault/pull/999) | "
               "[H-01](https://github.com/code-423n4/2023-07-pooltogether-findings/issues/443) | x |\n\n")
        self.assertEqual(MOD.c4_status(t[:k] + row + t[k:], "H-01")["cls"], MOD.CLS_AMBIGUOUS)

    def test_c4_status_line_must_agree_with_the_table(self):
        t = PAGES[C4_REPORT]
        k = t.index("## [[H-05]")
        e = t.index("\n", k)
        t = t[:e + 1] + "\n**Status**: Mitigation confirmed.\n" + t[e + 1:]
        self.assertEqual(MOD.c4_status(t, "H-05")["cls"], MOD.CLS_AMBIGUOUS)

    def test_quoted_status_line_is_not_read(self):
        t = PAGES[C4_REPORT]
        k = t.index("## [[M-17]")
        e = t.index("\n", k)
        t = t[:e + 1] + "\n> **Status**: Mitigation confirmed.\n" + t[e + 1:]
        self.assertEqual(MOD.c4_status(t, "M-17")["cls"], MOD.CLS_UNMARKED)

    def test_import_refusal_raises_and_writes_nothing(self):
        w = B.World()
        t = body(PT_REPORT)
        a = t.index("# Issue M-4:")
        b = t.index("# Issue M-5:")
        u = serve_report(PT_REPORT, t[:a] + t[b:])
        with self.assertRaises(MOD.gl.vm.UserError) as e:
            w.call(B.ANYONE, "import_report", u, PT_DOCS)
        self.assertIn("FINDING_IDS_NOT_IN_SEQUENCE", e.exception.message)
        self.assertEqual(int(w.c.scorecards_n), 0)

    def test_import_from_another_author_or_an_archive_is_refused(self):
        w = B.World()
        for bad in ("https://raw.githubusercontent.com/attacker/x-judging/" + "1" * 40 + "/README.md",
                    "https://web.archive.org/web/20240101000000/https://audits.sherlock.xyz/contests/1/report"):
            with self.assertRaises(MOD.gl.vm.UserError):
                w.call(B.ANYONE, "import_report", bad, PT_DOCS)


# =============================================================================
# 3. a scorecard from import to close
# =============================================================================

class V2_03_ScorecardLifecycle(unittest.TestCase):
    def test_pooltogether_scorecard(self):
        w = B.World()
        out = w.call(B.ANYONE, "import_report", PT_REPORT, PT_DOCS)
        self.assertEqual((out["scorecard_id"], out["findings"], out["marked_fixed"], out["acknowledged"]),
                         (1, 22, 14, 8))
        card = w.c.get_scorecard(1)
        self.assertEqual((card["auditor"], card["protocol"], card["state"]),
                         ("sherlock", "github:generationsoftware/pt-dev-docs", "OPEN"))
        self.assertTrue(card["report_reach"].startswith("default:"))
        with self.assertRaises(MOD.gl.vm.UserError):
            w.call(B.ANYONE, "import_report", PT_REPORT, PT_DOCS)       # one scorecard per report + protocol
        a = B.args_of(B.CLAIMER)
        slot_args = dict(scorecard_id=1, finding_id="M-5", function_name=a["function_name"],
                         audited_url=a["audited_url"], fix_url=a["fix_url"], chain=a["chain"], address=a["address"])
        f = w.call(B.CHALLENGER, "file_slot", value=GEN, **slot_args)
        self.assertEqual((f["status"], f["code_says"]), ("OK", "FIXED"), f)
        self.assertEqual(w.c.get_check(1)["scorecard"], 1)
        again = w.call(B.CHALLENGER, "file_slot", value=GEN, **slot_args)
        self.assertEqual(again["reason"], "SLOT_ALREADY_FILED_AS_CHECK_1")
        ack = w.call(B.CHALLENGER, "file_slot", value=GEN, **dict(slot_args, finding_id="M-3"))
        self.assertEqual(ack["reason"], "FINDING_NOT_MARKED_FIXED")
        nope = w.call(B.CHALLENGER, "file_slot", value=GEN, **dict(slot_args, finding_id="M-99"))
        self.assertEqual(nope["reason"], "FINDING_NOT_IN_SCORECARD")
        # a slot filing goes through every filing rule: H-1's fix does not touch claimPrizes
        h1 = w.call(B.CHALLENGER, "file_slot", value=GEN, **dict(slot_args, finding_id="H-1"))
        self.assertEqual(h1["status"], "REFUSED")
        with self.assertRaises(MOD.gl.vm.UserError):
            w.call(B.ANYONE, "close_scorecard", 1)                     # filing still open
        w.at(T0 + 3600)
        self.assertEqual(w.call(B.ANYONE, "decide", 1)["verdict"], "FIXED")
        v = w.c.get_scorecard(1)["verdicts"]
        self.assertEqual((v["checks"], v["fixed"], v["open"]), (1, 1, 0))
        w.at(T0 + 86400)
        late = w.call(B.CHALLENGER, "file_slot", value=GEN, **dict(slot_args, finding_id="M-8"))
        self.assertEqual(late["reason"], "SCORECARD_FILING_CLOSED")
        c = w.call(B.ANYONE, "close_scorecard", 1)
        self.assertEqual(c["not_checked"], 13)
        card = w.c.get_scorecard(1)
        self.assertEqual((card["state"], card["filed"], card["not_checked"]), ("CLOSED", 1, 13))
        # exact counts: every one of the 22 findings is in exactly one bucket
        slots = w.c.get_scorecard_slots(1, 0, 100)["items"]
        self.assertEqual(len(slots), 22)
        self.assertEqual(sorted(set(s["outcome"] for s in slots)), ["", "FIXED", "NOT_CHECKED"])
        self.assertEqual(len([s for s in slots if s["outcome"] == ""]), 8)          # the acknowledged ones
        self.assertEqual(card["acknowledged"] + card["not_checked"] + card["verdicts"]["fixed"], 22)
        with self.assertRaises(MOD.gl.vm.UserError):
            w.call(B.ANYONE, "close_scorecard", 1)
        aud = {a["auditor"]: a for a in w.c.get_auditors()}
        self.assertEqual((aud["sherlock"]["scorecards"], aud["sherlock"]["fixed"], aud["code4rena"]["checks"]),
                         (1, 1, 0))
        self.assertEqual(len(w.c.get_protocol_scorecards("github:generationsoftware/pt-dev-docs")), 1)
        # the ledger drains to exactly 0
        w.call(B.ANYONE, "sweep_fees")
        for who in (B.CHALLENGER, B.FEE_TO):
            w.call(who, "withdraw")
        self.assertEqual(int(w.c.balance_wei), 0)

    def test_expired_slot_counts_as_expired(self):
        w = B.World()
        w.call(B.ANYONE, "import_report", PT_REPORT, PT_DOCS)
        a = B.args_of(B.CLAIMER)
        w.call(B.CHALLENGER, "file_slot", 1, "M-5", a["function_name"], a["audited_url"], a["fix_url"],
               a["chain"], a["address"], value=GEN)
        w.at(T0 + 3600 + 86400)
        w.call(B.ANYONE, "expire", 1)
        card = w.c.get_scorecard(1)
        self.assertEqual((card["verdicts"]["expired"], card["verdicts"]["open"]), (1, 0))
        m5 = [x for x in w.c.get_scorecard_slots(1, 0, 100)["items"] if x["finding_id"] == "M-5"][0]
        self.assertEqual(m5["outcome"], "EXPIRED")

    def test_slot_views_are_paged(self):
        w = B.World()
        w.call(B.ANYONE, "import_report", PT_REPORT, PT_DOCS)
        p = w.c.get_scorecard_slots(1, 20, 1000)
        self.assertEqual((p["total"], len(p["items"]), p["items"][0]["finding_id"]), (22, 2, "M-18"))
        self.assertEqual(len(w.c.get_scorecard_slots(1, 0, 10 ** 9)["items"]), 22)
        self.assertEqual(w.c.get_scorecards(0, 10 ** 9)["total"], 1)

    def test_import_is_not_paid_and_needs_a_clock(self):
        w = B.World()
        B.MESSAGE.raw = {}
        w.c.__dict__  # noqa
        with self.assertRaises(MOD.gl.vm.UserError):
            B.MESSAGE.sender_address = B.ANYONE
            w.c.import_report(PT_REPORT, PT_DOCS)


# =============================================================================
# 4. Code4rena as a second auditor
# =============================================================================

class V2_04_Code4rena(unittest.TestCase):
    def test_c4_import(self):
        w = c4_world()
        out = w.call(B.ANYONE, "import_report", C4_REPORT, PT_DOCS)
        self.assertEqual((out["findings"], out["marked_fixed"], out["not_mitigated"], out["acknowledged"],
                          out["unmarked"]), (36, 27, 7, 1, 1))
        self.assertEqual(w.c.get_scorecard(1)["auditor"], "code4rena")

    def test_c4_finding_not_mitigated_cannot_be_filed(self):
        w = c4_world()
        a = B.args_of(B.CLAIMER, report_url=C4_REPORT, finding_id="H-05")
        out = w.call(B.CHALLENGER, "file_check", value=GEN, **a)
        self.assertEqual(out["status"], "REFUSED")

    def test_c4_report_on_a_fork_commit_is_refused(self):
        w = B.World()          # no branch answer for the pinned commit
        with self.assertRaises(MOD.gl.vm.UserError) as e:
            w.call(B.ANYONE, "import_report", C4_REPORT, PT_DOCS)
        self.assertIn("REPORT_", e.exception.message)


# =============================================================================
# 5. regression watch
# =============================================================================

NEW_IMPL = "0x" + "3d" * 20


def fixed_proxy(w):
    """The real PoolTogether Claimer (deployed == fix) served as an EIP-1967
    proxy; filed and decided FIXED."""
    R3.as_proxy(B.CLAIMER, R3.AFTER_FIX, R3.AFTER_FIX, [(R3.block_of(R3.AFTER_FIX), 1, R3.IMPL, R3.AFTER_FIX)])
    out = w.file(B.CLAIMER)
    assert out["status"] == "OK", out
    w.at(T0 + 3600)
    d = w.call(B.ANYONE, "decide", out["check_id"])
    assert d["verdict"] == "FIXED", d
    return out["check_id"]


def upgrade(w, function_code):
    """The proxy's slot now names NEW_IMPL, whose verified source is the
    Claimer's with claimPrizes replaced by `function_code`."""
    case = B.CLAIMER
    chain, addr = case["chain"], case["address"].lower()
    kind, base, _cid, rpc = MOD.CHAINS[chain]
    src = MOD.source_url(chain, addr)
    doc = json.loads(PAGES[src])
    fixed = w.c.code["1:dep"]
    files = [doc] + list(doc.get("additional_sources") or [])
    hit = 0
    for f in files:
        t = MOD.strip_comments(f.get("source_code") or "")
        k = t.find(fixed)
        if k >= 0:
            f["source_code"] = t[:k] + function_code + t[k + len(fixed):]
            hit += 1
    assert hit == 1, hit
    WEB.pages[MOD.source_url(chain, NEW_IMPL)] = (200, json.dumps(doc))
    pd = json.loads(WEB.pages[src][1])
    pd["implementations"] = [{"address_hash": NEW_IMPL}]
    WEB.pages[src] = (200, json.dumps(pd))
    WEB.rpc[(rpc, "eth_getStorageAt", json.dumps([addr, MOD.EIP1967_IMPL_SLOT, "latest"]))] = \
        "0x" + "0" * 24 + NEW_IMPL[2:]
    later = T0 + 7200
    WEB.pages[base + "/api/v2/addresses/" + NEW_IMPL] = (200, json.dumps({"creation_transaction_hash": "0x" + "c3" * 32}))
    WEB.pages[base + "/api/v2/transactions/0x" + "c3" * 32] = (200, json.dumps({"timestamp": B.iso(later),
                                                                               "block_number": R3.block_of(later)}))
    WEB.pages[MOD.upgraded_logs_url(chain, addr)] = (200, R3.logs_page(addr, [
        (R3.block_of(R3.AFTER_FIX), 1, R3.IMPL, R3.AFTER_FIX), (R3.block_of(later), 2, NEW_IMPL, later)]))


class V2_05_Regression(unittest.TestCase):
    def test_audited_code_deployed_again_is_regressed(self):
        w = B.World()
        pid = fixed_proxy(w)
        upgrade(w, w.c.code["1:aud"])
        w.at(T0 + 9000)
        out = w.call(B.CHALLENGER, "file_regression", pid, value=GEN)
        self.assertEqual((out["status"], out["code_says"], out["implementation"]), ("OK", "REGRESSED", NEW_IMPL), out)
        rid = out["check_id"]
        w.call(B.DEFENDER, "counter_stake", rid, value=2 * GEN)
        w.at(T0 + 9000 + 3600)
        d = w.call(B.ANYONE, "decide", rid)
        self.assertEqual((d["verdict"], d["basis"]), ("REGRESSED", "REGRESSED_TO_AUDITED_CODE"))
        self.assertEqual(B.MODEL.prompts, [])
        ch = w.c.get_check(rid)
        self.assertEqual((ch["prior_check"], ch["implementation"], ch["switch_status"]), (pid, NEW_IMPL, "EVENT"))
        a = B.args_of(B.CLAIMER)
        st = w.c.fix_status(a["chain"], a["address"], a["report_url"], a["finding_id"])
        self.assertEqual((st["status"], st["check_id"]), ("REGRESSED", rid))
        self.assertEqual(w.c.get_regressions(0, 10)["items"][0]["prior"]["check_id"], pid)
        self.assertEqual(w.c.get_stats()["regressed"], 1)
        self.assertEqual(w.c.protocol_score("github:generationsoftware/pt-dev-docs")["regressed"], 1)
        # the challenger takes the defender's stake, as for NOT_FIXED
        self.assertEqual(w.claimable(B.CHALLENGER), GEN - GEN * 200 // 10000 + GEN + 2 * GEN)

    def test_fixed_code_after_an_upgrade_stays_fixed(self):
        w = B.World()
        pid = fixed_proxy(w)
        upgrade(w, w.c.code["1:fix"])
        w.at(T0 + 9000)
        out = w.call(B.CHALLENGER, "file_regression", pid, value=GEN)
        self.assertEqual(out["code_says"], "FIXED")
        w.at(T0 + 9000 + 3600)
        self.assertEqual(w.call(B.ANYONE, "decide", out["check_id"])["verdict"], "FIXED")

    def test_no_upgrade_is_refused_and_the_stake_stays_withdrawable(self):
        w = B.World()
        pid = fixed_proxy(w)
        w.at(T0 + 9000)
        out = w.call(B.CHALLENGER, "file_regression", pid, value=GEN)
        self.assertEqual((out["status"], out["reason"]), ("REFUSED", "NO_UPGRADE_SINCE_CHECK"))
        self.assertEqual(int(w.c.regressions_n), 0)

    def test_only_a_latest_fixed_proxy_check(self):
        w = B.World()
        w.file(B.CLAIMER)                                    # not a proxy
        w.at(T0 + 3600)
        w.call(B.ANYONE, "decide", 1)
        self.assertEqual(w.call(B.CHALLENGER, "file_regression", 1, value=GEN)["reason"], "NOT_A_PROXY")
        w2 = B.World()
        w2.file(B.VAULT_ETH)
        w2.at(T0 + 3600)
        w2.call(B.ANYONE, "decide", 1)
        self.assertEqual(w2.call(B.CHALLENGER, "file_regression", 1, value=GEN)["reason"], "PRIOR_CHECK_NOT_FIXED")
        self.assertEqual(w2.call(B.CHALLENGER, "file_regression", 9, value=GEN)["reason"], "NO_SUCH_CHECK")

    def test_one_open_regression_at_a_time(self):
        w = B.World()
        pid = fixed_proxy(w)
        upgrade(w, w.c.code["1:aud"])
        w.at(T0 + 9000)
        w.call(B.CHALLENGER, "file_regression", pid, value=GEN)
        again = w.call(B.CHALLENGER, "file_regression", pid, value=GEN)
        self.assertTrue(again["reason"].startswith("ALREADY_OPEN_AS_CHECK_"), again)


# =============================================================================
# 6. FixStatus and FixGate
# =============================================================================

def consumers(w):
    """FixStatus at 0x11..11 reads the World's FixCheck; FixGate at 0x22..22
    reads FixStatus. Both modules share the stub's gl, so get_at dispatches
    by address."""
    st = STATUS.FixStatus.__new__(STATUS.FixStatus)
    st.__init__("0x" + "1" * 40)
    gate = GATE.FixGate.__new__(GATE.FixGate)
    gate.__init__("0x" + "2" * 40)
    targets = {"0x" + "1" * 40: w.c, "0x" + "2" * 40: st}

    def get_at(a):
        obj = targets[a.as_hex if hasattr(a, "as_hex") else str(a).lower()]

        class _Handle:
            def view(self):
                return obj
        return _Handle()
    STATUS.gl.contract.get_at = get_at
    GATE.gl.contract.get_at = get_at
    return st, gate


class V2_06_Consumers(unittest.TestCase):
    def test_is_fixed_and_the_gate(self):
        w = B.World()
        w.file(B.VAULT_ETH)
        w.file(B.CLAIMER)
        w.at(T0 + 3600)
        w.call(B.ANYONE, "decide", 1)
        w.call(B.ANYONE, "decide", 2)
        st, gate = consumers(w)
        bad = B.VAULT_ETH["report"] + "#" + B.VAULT_ETH["id"]
        good = B.CLAIMER["report"] + "#" + B.CLAIMER["id"]
        self.assertFalse(st.is_fixed(bad, B.VAULT_ETH["chain"], B.VAULT_ETH["address"]))
        self.assertTrue(st.is_unsafe(bad, B.VAULT_ETH["chain"], B.VAULT_ETH["address"]))
        self.assertTrue(st.is_fixed(good, B.CLAIMER["chain"], B.CLAIMER["address"]))
        self.assertEqual(st.status("no-hash", "ethereum", "0x" + "0" * 40)["status"], "UNCHECKED")
        sc = st.protocol_score("github:generationsoftware/pt-dev-docs")
        self.assertEqual((sc["fixed"], sc["not_fixed"], sc["total"]), (1, 1, 2))
        r = gate.interact(bad, B.VAULT_ETH["chain"], B.VAULT_ETH["address"])
        self.assertEqual((r["result"], r["why"], r["check_id"]), ("REFUSED", "FINDING_NOT_FIXED", 1))
        r = gate.interact(good, B.CLAIMER["chain"], B.CLAIMER["address"])
        self.assertEqual((r["result"], r["why"]), ("ALLOWED", "FIXED"))
        r = gate.interact(B.CLAIMER["report"] + "#M-99", "optimism", B.CLAIMER["address"])
        self.assertEqual((r["result"], r["why"]), ("ALLOWED", "UNCHECKED"))
        self.assertEqual(gate.get_stats(), {"calls": 3, "allowed": 2, "refused": 1})
        self.assertEqual(gate.get_calls(0, 10)["items"][2]["why"], "FINDING_NOT_FIXED")

    def test_gate_refuses_regressed(self):
        w = B.World()
        pid = fixed_proxy(w)
        upgrade(w, w.c.code["1:aud"])
        w.at(T0 + 9000)
        rid = w.call(B.CHALLENGER, "file_regression", pid, value=GEN)["check_id"]
        st, gate = consumers(w)
        f = B.CLAIMER["report"] + "#" + B.CLAIMER["id"]
        self.assertEqual(gate.interact(f, B.CLAIMER["chain"], B.CLAIMER["address"])["result"], "ALLOWED")  # FIXED, regression open
        w.at(T0 + 9000 + 3600)
        w.call(B.ANYONE, "decide", rid)
        self.assertEqual(gate.interact(f, B.CLAIMER["chain"], B.CLAIMER["address"])["why"], "FINDING_REGRESSED")

    def test_gate_fails_closed_when_fixstatus_is_unreachable(self):
        gate = GATE.FixGate.__new__(GATE.FixGate)
        gate.__init__("0x" + "2" * 40)

        def boom(_a):
            raise RuntimeError("down")
        GATE.gl.contract.get_at = boom
        self.assertEqual(gate.interact("x#M-1", "ethereum", "0x" + "1" * 40)["why"], "FIXSTATUS_UNREACHABLE")

    def test_consumers_have_no_payable_method_and_no_setter(self):
        for mod, name in ((STATUS, "FixStatus"), (GATE, "FixGate")):
            src = (B.ROOT / "contracts" / (name + ".py")).read_text()
            self.assertNotIn("gl.public.write.payable", src)
            self.assertNotIn("emit_transfer", src)
            self.assertEqual(B.stub.undefined_names(B.ROOT / "contracts" / (name + ".py")), [])
            self.assertNotIn(".replace(", src)


if __name__ == "__main__":
    unittest.main()
