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


# =============================================================================
# Regressions for round-3 fix 1: every pinned GitHub commit is on a branch of
# the repository its URL names
# =============================================================================

class R3_Reg_BranchReachability(unittest.TestCase):
    def test_real_answers_parse(self):
        repo = "2024-05-pooltogether-judging"
        self.assertEqual(MOD.repo_branches(FORK_ONLY, "sherlock-audit", repo), [])
        self.assertEqual(MOD.repo_branches(FORK_OWN, "edwardmadi", repo), ["default:main"])
        self.assertEqual(MOD.repo_branches(FORK_OWN, "sherlock-audit", repo), [],
                         "a fork's branch named main is not a branch of the upstream repo")
        self.assertEqual(MOD.repo_branches(NON_DEFAULT, "generationsoftware", "pt-v5-vault"), ["branch:listener"])
        self.assertFalse(MOD.on_default_branch(NON_DEFAULT, "generationsoftware", "pt-v5-vault"))
        self.assertEqual(MOD.repo_branches(TAG_ONLY, "generationsoftware", "pt-v5-vault"), [],
                         "a tag is not a branch")
        self.assertEqual(MOD.reach_proof(["branch:z", "branch:a"]), "branch:a")
        self.assertEqual(MOD.reach_proof(["branch:a", "default:main"]), "default:main")

    def test_fork_commit_listing_a_branch_with_the_same_name_is_refused(self):
        # an answer that lists the FORK's "main" (GitHub's real bytes for the
        # fork's own path) served under the upstream path
        w = B.World()
        case = B.VAULT_ETH
        forged = at_sha(case["report"], FORK_SHA)
        serve(forged, PAGES[case["report"]])
        branch_answer(forged, FORK_OWN)
        out = w.file(case, report_url=forged)
        self.assertEqual((out["status"], out["reason"]), ("REFUSED", "REPORT_COMMIT_NOT_ON_BRANCH"))
        docs = at_sha(case["docs"], FORK_SHA)
        serve(docs, PAGES[case["docs"]])
        branch_answer(docs, PAGES[GH + "generationsoftware/pt-dev-docs/branch_commits/"
                                  "9f3322e7280f2e91346cabfc2512046c6cfcd2a8"].replace(
            'href="/GenerationSoftware/pt-dev-docs"', 'href="/someone/pt-dev-docs"'))
        out = w.file(case, docs_url=docs)
        self.assertEqual((out["status"], out["reason"]), ("REFUSED", "DOCS_COMMIT_NOT_ON_BRANCH"))
        self.assertEqual(int(w.c.checks_n), 0)
        self.assertEqual(w.claimable(B.CHALLENGER), 2 * B.STAKE, "refused stakes stay withdrawable")

    def test_non_default_branch_of_the_original_repo_is_allowed(self):
        w = B.World()
        case = B.VAULT_ETH
        sha = "ab" * 20
        docs = at_sha(case["docs"], sha)
        serve(docs, PAGES[case["docs"]])
        B.on_branch("GenerationSoftware", "pt-dev-docs", sha, href="/GenerationSoftware/pt-dev-docs/compare/next",
                    name="next")
        rep = at_sha(case["report"], sha)
        serve(rep, PAGES[case["report"]])
        B.on_branch("sherlock-audit", "2024-05-pooltogether-judging", sha,
                    href="/sherlock-audit/2024-05-pooltogether-judging/tree/escalations", name="escalations")
        out = w.file(case, docs_url=docs, report_url=rep)
        self.assertEqual(out["status"], "OK", out)
        ch = w.c.get_check(out["check_id"])
        self.assertEqual((ch["report_reach"], ch["docs_reach"]), ("branch:escalations", "branch:next"))

    def test_tag_only_commit_is_refused(self):
        w = B.World()
        case = B.VAULT_ETH
        sha = "dd" * 20
        docs = at_sha(case["docs"], sha)
        serve(docs, PAGES[case["docs"]])
        branch_answer(docs, TAG_ONLY.replace("GenerationSoftware/pt-v5-vault", "GenerationSoftware/pt-dev-docs"))
        out = w.file(case, docs_url=docs)
        self.assertEqual((out["status"], out["reason"]), ("REFUSED", "DOCS_COMMIT_NOT_ON_BRANCH"))

    def test_proof_is_snapshotted_at_filing(self):
        w = B.World()
        out = w.file(B.CLAIMER)
        ch = w.c.get_check(out["check_id"])
        self.assertEqual((ch["report_reach"], ch["docs_reach"]), ("default:main", "default:main"))

    def test_github_throttled_refuses_and_writes_nothing(self):
        # GitHub answers anonymous readers 403/429 when throttled
        for status in (403, 429):
            w = B.World()
            branch_answer(B.CLAIMER["report"], "rate limited", status)
            out = w.file(B.CLAIMER)
            self.assertEqual((out["status"], out["reason"]), ("REFUSED", "REPORT_BRANCHES_UNREADABLE"))
            self.assertEqual(int(w.c.checks_n), 0)
            self.assertEqual(w.claimable(B.CHALLENGER), B.STAKE)
            w = B.World()
            branch_answer(B.CLAIMER["docs"], "rate limited", status)
            self.assertEqual(w.file(B.CLAIMER)["reason"], "DOCS_BRANCHES_UNREADABLE")

    def test_each_branch_page_is_read_once_per_gather(self):
        w = B.World()
        self.assertEqual(w.file(B.CLAIMER)["status"], "OK")
        pages = [u for u in WEB.counts if u.find("/branch_commits/") >= 0]
        self.assertGreaterEqual(len(pages), 3)
        for u in pages:
            self.assertEqual(WEB.counts[u], 2, u + ": once for the leader, once for the validator")

    def test_archived_github_targets(self):
        cap = "https://web.archive.org/web/20250101000000id_/"
        up = "https://raw.githubusercontent.com/sherlock-audit/x-judging/"
        self.assertEqual(MOD.pinned_commit(cap + up + FORK_SHA + "/README.md"),
                         {"owner": "sherlock-audit", "repo": "x-judging", "sha": FORK_SHA})
        self.assertEqual(MOD.pinned_commit(cap + "https://github.com/sherlock-audit/x-judging/blob/" + FORK_SHA
                                           + "/README.md")["sha"], FORK_SHA)
        self.assertEqual(MOD.pinned_commit(cap + up + "main/README.md"), {})
        self.assertEqual(MOD.pinned_commit(cap + up + "a925a29/README.md"), {"bad": True})
        self.assertEqual(MOD.pinned_commit(cap + "https://audits.sherlock.xyz/contests/1/report"), {})
        w = B.World()
        out = w.file(B.CLAIMER, report_url=cap + up + "a925a29/README.md")
        self.assertEqual((out["status"], out["reason"]), ("REFUSED", "REPORT_REF_NOT_A_FULL_SHA"))
        self.assertEqual(WEB.log, [])


# =============================================================================
# Regressions for round-3 fix 2: a proxy is dated by the LATEST of its own
# creation, its implementation's creation and its switch to that
# implementation (the last Upgraded event at or below the leader-named block)
# =============================================================================

UPG = MOD.UPGRADED_TOPIC
IMPL = "0x" + "1a" * 20
OTHER = "0x" + "2b" * 20
AUDITED = 1715878616                                 # the audited commit (2024-05-16)
FIX_AT = 1719586361                                  # check #6: max(commit, merge) of the vault fix
BEFORE_FIX = epoch("2024-05-20T00:00:00Z")           # after the audit, before the fix
AFTER_FIX = epoch("2024-09-01T00:00:00Z")
DOCS_SWITCH = "docs/ATTACK_REPORT_R3.md"


def block_of(at: int) -> int:
    """An Ethereum block number for a time (12 s blocks, anchored on block
    19900000 at 2024-05-17), as the explorer reports a creation tx's block."""
    return 19900000 + (at - 1715900000) // 12


def logs_page(proxy: str, events: list, more: bool = False) -> str:
    """The explorer's Upgraded log list (real shape: newest first)."""
    items = []
    for blk, idx, impl, at in sorted(events, reverse=True):
        items.append({"address": {"hash": proxy}, "block_number": blk, "index": idx,
                      "block_timestamp": B.iso(at) [:19] + ".000000Z", "data": "0x",
                      "topics": [UPG, "0x" + "0" * 24 + impl[2:], None, None]})
    return json.dumps({"items": items, "next_page_params": {"block_number": 1} if more else None})


def as_proxy(case, proxy_at, impl_at, events=None, slot=IMPL, explorer_impl=IMPL, logs_status=200):
    """The case's deployment (the real vault, deployed == audited) served as an
    EIP-1967 proxy whose implementation's verified source is the vault's own."""
    chain = case["chain"]
    addr = case["address"].lower()
    kind, base, _cid, rpc = MOD.CHAINS[chain]
    src = MOD.source_url(chain, addr)
    doc = json.loads(PAGES[src])
    doc["implementations"] = [{"address_hash": explorer_impl}] if explorer_impl else []
    WEB.pages[src] = (200, json.dumps(doc))
    WEB.pages[MOD.source_url(chain, IMPL)] = (200, PAGES[src])
    word = "0x" + "0" * 24 + slot[2:] if slot else "0x" + "0" * 64
    WEB.rpc[(rpc, "eth_getStorageAt", json.dumps([addr, MOD.EIP1967_IMPL_SLOT, "latest"]))] = word
    for who, at, tx in ((addr, proxy_at, "0x" + "a1" * 32), (IMPL, impl_at, "0x" + "b2" * 32)):
        WEB.pages[base + "/api/v2/addresses/" + who] = (200, json.dumps({"creation_transaction_hash": tx}))
        WEB.pages[base + "/api/v2/transactions/" + tx] = (200, json.dumps({"timestamp": B.iso(at),
                                                                           "block_number": block_of(at)}))
    if events is not None:
        WEB.pages[MOD.upgraded_logs_url(chain, addr)] = (logs_status, logs_page(addr, events))


class R3_Reg_ProxyChronology(unittest.TestCase):
    case = B.VAULT_ETH

    def run_case(self, *a, **k):
        w = B.World()
        as_proxy(self.case, *a, **k)
        out = w.file(self.case)
        self.assertEqual(out["status"], "OK", out)
        ch = w.c.get_check(out["check_id"])
        self.assertEqual((ch["fix_at"], ch["audited_at"]), (FIX_AT, AUDITED))
        self.assertEqual(ch["implementation"], IMPL)
        w.at(T0 + 3600)
        d = w.call(B.ANYONE, "decide", out["check_id"])
        self.assertEqual(out["code_says"], d["verdict"], "the filing preview and decide() agree")
        return d, w.c.get_check(out["check_id"])

    def test_new_proxy_after_the_fix_on_an_old_implementation(self):
        d, ch = self.run_case(AFTER_FIX, BEFORE_FIX, [(20600000, 7, IMPL, AFTER_FIX)])
        self.assertEqual((d["verdict"], d["basis"]), ("NOT_FIXED", "CODE_MATCH_VULNERABLE"))
        self.assertEqual((ch["switch_status"], ch["switch_block"], ch["code_born"]), ("EVENT", 20600000, AFTER_FIX))

    def test_old_proxy_chosen_before_the_fix_is_still_predates_fix(self):
        d, ch = self.run_case(BEFORE_FIX, BEFORE_FIX, [(19900000, 3, IMPL, BEFORE_FIX)])
        self.assertEqual((d["verdict"], d["basis"]), ("PREDATES_FIX", "DEPLOYED_BEFORE_FIX"))

    def test_rollback_after_the_fix_is_not_fixed(self):
        rollback = epoch("2024-08-01T00:00:00Z")
        d, ch = self.run_case(BEFORE_FIX, BEFORE_FIX, [
            (19900000, 3, IMPL, BEFORE_FIX),                              # first implementation
            (20280000, 9, OTHER, epoch("2024-07-10T00:00:00Z")),          # upgraded (fixed) after the fix
            (20430000, 4, IMPL, rollback)])                               # rolled back to the old one
        self.assertEqual((d["verdict"], d["basis"]), ("NOT_FIXED", "CODE_MATCH_VULNERABLE"))
        self.assertEqual((ch["switch_block"], ch["switched_at"]), (20430000, rollback))

    def test_upgraded_emitted_twice_in_one_transaction(self):
        # ordered by (block, log index): the last log names the slot's implementation
        d, ch = self.run_case(BEFORE_FIX, BEFORE_FIX, [(20430000, 5, OTHER, AFTER_FIX), (20430000, 6, IMPL, AFTER_FIX)])
        self.assertEqual(d["verdict"], "NOT_FIXED")
        self.assertEqual(ch["switch_status"], "EVENT")
        # the last log names ANOTHER implementation: the slot was set some other
        # way, the switch cannot be dated, and every other date is before the fix
        d, ch = self.run_case(BEFORE_FIX, BEFORE_FIX, [(19900000, 5, IMPL, BEFORE_FIX), (19900000, 6, OTHER, BEFORE_FIX)])
        self.assertEqual((d["verdict"], d["basis"]), ("INCONCLUSIVE", "UPGRADE_TIME_UNKNOWN"))
        self.assertEqual(ch["switch_status"], "EVENT_MISMATCH")

    def test_upgraded_twice_real_logs(self):
        # OP's DisputeGameFactory proxy on Ethereum (check #22): real explorer answer
        proxy = "0xe5965ab5962edc7477c8520243a95517cd252fa9"
        text = PAGES[MOD.upgraded_logs_url("ethereum", proxy)]
        last = MOD.last_upgrade(text, proxy, 10 ** 9)
        self.assertEqual((last["block"], last["index"], last["impl"]),
                         (26048619, 780, "0x72b971717e088b59f26d4236be222adb6acd393b"))
        # round-4 fix 4: a log above the slot block makes that block stale
        self.assertEqual(MOD.last_upgrade(text, proxy, 26048618), {"above": True})

        def upto(blk):
            doc = json.loads(text)
            doc["items"] = [it for it in doc["items"] if int(it["block_number"]) <= blk]
            return json.dumps(doc)
        self.assertEqual(MOD.last_upgrade(upto(26048618), proxy, 26048618)["block"], 25397811)
        # the same implementation set twice (22990599, then 23491328): the later one counts
        same = MOD.last_upgrade(upto(23491328), proxy, 23491328)
        self.assertEqual((same["block"], same["impl"]), (23491328, "0x33d1e8571a85a538ed3d5a4d88f46c112383439d"))
        self.assertEqual(MOD.last_upgrade(text, "0x" + "9" * 40, 10 ** 9), {}, "only the proxy's own logs")

    def test_log_above_the_leader_block_refuses_the_filing(self):
        # round-4 fix 4 (was: ignored): an upgrade the explorer has seen above
        # the slot block makes that block stale; nothing is written
        w = B.World()
        as_proxy(self.case, BEFORE_FIX, BEFORE_FIX, [(19900000, 3, IMPL, BEFORE_FIX),
                                                     (stub_head() + 50, 1, OTHER, AFTER_FIX)])
        out = w.file(self.case)
        self.assertEqual((out["status"], out["reason"]), ("REFUSED", "UPGRADED_AFTER_SLOT_BLOCK"))

    def test_no_upgraded_event_is_unknown_never_predates(self):
        d, ch = self.run_case(BEFORE_FIX, BEFORE_FIX, [])
        self.assertEqual((d["verdict"], d["basis"], ch["switch_status"]),
                         ("INCONCLUSIVE", "UPGRADE_TIME_UNKNOWN", "NO_EVENT"))
        # a proxy created after the fix needs no event: NOT_FIXED
        d, ch = self.run_case(AFTER_FIX, BEFORE_FIX, [])
        self.assertEqual(d["verdict"], "NOT_FIXED")

    def test_unreadable_or_incomplete_logs_are_unknown(self):
        d, ch = self.run_case(BEFORE_FIX, BEFORE_FIX, [(19900000, 3, IMPL, BEFORE_FIX)], logs_status=403)
        self.assertEqual((d["verdict"], ch["switch_status"]), ("INCONCLUSIVE", "UNREADABLE"))
        self.assertEqual(MOD.last_upgrade(logs_page(IMPL, [], more=True), IMPL, 10 ** 9), {"error": True})

    def test_non_standard_slot(self):
        # implementation kept outside the EIP-1967 slot: the explorer names one,
        # the slot is empty -> PROXY_UNRESOLVED, refunded, never PREDATES
        w = B.World()
        as_proxy(self.case, BEFORE_FIX, BEFORE_FIX, [(19900000, 3, IMPL, BEFORE_FIX)], slot="")
        out = w.file(self.case)
        self.assertEqual((out["dep_status"], out["code_says"]), ("PROXY_UNRESOLVED", "INCONCLUSIVE"))
        w.at(T0 + 3600)
        self.assertEqual(w.call(B.ANYONE, "decide", 1)["basis"], "PROXY_UNRESOLVED")

    def test_chains_without_a_log_source(self):
        for ch in ("base", "arbitrum", "polygon"):
            self.assertEqual(MOD.upgraded_logs_url(ch, IMPL), "")
        self.assertTrue(MOD.upgraded_logs_url("optimism", IMPL).startswith("https://explorer.optimism.io/api/v2/"))

    def test_chronology_matrix(self):
        f = MOD.chronology
        self.assertEqual(f("", BEFORE_FIX, 0, 0, AUDITED, FIX_AT),
                         {"predates": False, "predates_fix": True, "unknown": ""})
        self.assertEqual(f(IMPL, BEFORE_FIX, BEFORE_FIX, 0, AUDITED, FIX_AT),
                         {"predates": False, "predates_fix": False, "unknown": "UPGRADE_TIME_UNKNOWN"})
        self.assertEqual(f(IMPL, AFTER_FIX, BEFORE_FIX, 0, AUDITED, FIX_AT),
                         {"predates": False, "predates_fix": False, "unknown": ""})
        self.assertEqual(f(IMPL, BEFORE_FIX, AFTER_FIX, 0, AUDITED, FIX_AT)["unknown"], "")
        self.assertEqual(f(IMPL, BEFORE_FIX, BEFORE_FIX, AFTER_FIX, AUDITED, FIX_AT)["predates_fix"], False)
        old = epoch("2024-01-01T00:00:00Z")
        self.assertEqual(f(IMPL, old, old, old, AUDITED, FIX_AT),
                         {"predates": True, "predates_fix": True, "unknown": ""})
        self.assertEqual(MOD.code_decision("OK", "a", "a", "b", False, False, True),
                         {"verdict": "INCONCLUSIVE", "basis": "UPGRADE_TIME_UNKNOWN"})


def stub_head() -> int:
    return B.stub.HEAD


if __name__ == "__main__":
    unittest.main(verbosity=2)
