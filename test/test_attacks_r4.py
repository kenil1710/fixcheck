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



# =============================================================================
# Step 2. The round-3 fork-commit check, attacked from outside
# =============================================================================

R4P = json.loads((HERE / "fixtures" / "pages_r4.json").read_text())   # real GitHub answers (tools/build_fixtures_r4.py)
SPOOFED_CLOSED_PR = R4P["pr_only_closed"]["body"]   # head of closed fork PR #1305: raw serves it under the upstream path
SPOOFED_OPEN_PR = R4P["pr_only_open"]["body"]       # head of open fork PR #1344
UPSTREAM_PR_BRANCH = R4P["upstream_pr_branch"]["body"]
DELETED_BRANCH = R4P["deleted_branch"]["body"]      # head of PR #63, branch deleted after the PR closed
RENAMED = R4P["renamed_old_name"]["body"]           # Uniswap/uniswap-v3-core -> 301 -> Uniswap/v3-core


class R4_F1_PullRequestRefs(unittest.TestCase):
    """GitHub serves a commit that exists only on refs/pull/<n>/head - a pull
    request from a fork, open or closed - under the upstream repo's raw path
    (checked: HTTP 200 for both heads below). It is on no branch of the
    upstream repo and must be refused."""

    def file_at(self, what, sha, body):
        w = B.World()
        case = B.VAULT_ETH
        url = R3.at_sha(case[what], sha)
        serve_as = PAGES[case[what]]
        R3.serve(url, serve_as)
        R3.branch_answer(url, body)
        return w, w.file(case, **{("report_url" if what == "report" else "docs_url"): url})

    def test_commit_only_on_a_pull_request_ref_is_refused(self):
        for body, sha in ((SPOOFED_CLOSED_PR, "6be72121777d061d6ca7256f51ad1225235f6f93"),
                          (SPOOFED_OPEN_PR, "3f81046b46a52bd730304829d72665373e7f940b")):
            for what in ("report", "docs"):
                w, out = self.file_at(what, sha, body)
                self.assertEqual((out["status"], out["reason"]),
                                 ("REFUSED", what.upper() + "_COMMIT_NOT_ON_BRANCH"), (what, sha))
                self.assertEqual(int(w.c.checks_n), 0)

    def test_upstream_branch_with_an_open_pr_counts_as_that_branch_only(self):
        self.assertEqual(MOD.repo_branches(UPSTREAM_PR_BRANCH, "ethereum-optimism", "superchain-registry"),
                         ["branch:feat/plataberget-superchain"], "the pull-request item is never a branch")

    def test_a_pull_ref_rendered_as_a_branch_link_is_not_a_branch(self):
        # defence in depth: whatever GitHub renders, refs/pull/*, refs/* and a
        # link whose text is not the branch it points at are not branches
        def page(href, name):
            return '<ul class="branches-list"><li class="branch"><a href="' + href + '">' + name + '</a></li></ul>'
        o, r = "sherlock-audit", "x-judging"
        for href, name in (("/sherlock-audit/x-judging/tree/refs/pull/12/head", "refs/pull/12/head"),
                           ("/sherlock-audit/x-judging/compare/refs/heads/main", "refs/heads/main"),
                           ("/sherlock-audit/x-judging/tree/pull/12/head", "pull/12/head"),
                           ("/sherlock-audit/x-judging/compare/feature", "main")):
            self.assertEqual(MOD.repo_branches(page(href, name), o, r), [], href + " " + name)
        self.assertEqual(MOD.repo_branches(page("/sherlock-audit/x-judging/tree/escalations", "escalations"), o, r),
                         ["branch:escalations"])


class R4_F2_BranchDeletedOrForcePushed(unittest.TestCase):
    """The rule: the proof is GitHub's branch list AT FILING, read by every
    validator and stored (report_reach / docs_reach). A commit that is on no
    branch at filing - deleted, or force-pushed away - is refused. A branch
    deleted or force-pushed AFTER filing changes nothing: every evidence body
    is bound by sha256 at filing and decide() never reads GitHub again."""

    def test_deleted_before_filing_is_refused(self):
        w = B.World()
        branch = GH + "generationsoftware/pt-dev-docs/branch_commits/" + MOD.github_pin(B.CLAIMER["docs"])["sha"]
        WEB.pages[branch] = (200, DELETED_BRANCH)
        out = w.file(B.CLAIMER)
        self.assertEqual((out["status"], out["reason"]), ("REFUSED", "DOCS_COMMIT_NOT_ON_BRANCH"))

    def test_deleted_after_filing_keeps_the_snapshot(self):
        w = B.World()
        out = w.file(B.CLAIMER)
        before = w.c.get_check(out["check_id"])
        for u in list(WEB.pages):
            if u.find("/branch_commits/") >= 0:
                WEB.pages[u] = (200, DELETED_BRANCH)
        WEB.log.clear()
        w.at(T0 + 3600)
        d = w.call(B.ANYONE, "decide", out["check_id"])
        self.assertEqual((d["verdict"], d["basis"]), ("FIXED", "CODE_MATCH_FIX"))
        after = w.c.get_check(out["check_id"])
        self.assertEqual((after["report_reach"], after["docs_reach"]), (before["report_reach"], before["docs_reach"]))
        self.assertEqual([u for u in WEB.log if u.startswith(GH)], [], "decide() never reads GitHub")

    def test_deleted_between_leader_and_validator_writes_nothing(self):
        w = B.World()
        branch = GH + "generationsoftware/pt-dev-docs/branch_commits/" + MOD.github_pin(B.CLAIMER["docs"])["sha"]
        WEB.flaky = lambda url, n: (200, DELETED_BRANCH) if (url == branch and n >= 2) else None
        self.assertTrue(rolled(w, B.CLAIMER), "the validator saw the branch gone: the round must fail")
        self.assertEqual(int(w.c.checks_n), 0)


class R4_F3_OwnerRepoSpellings(unittest.TestCase):
    """Case, whitespace, %-escapes and names GitHub never issues, in owner/repo."""

    def test_case_variant_of_a_fork_commit_is_still_refused(self):
        w = B.World()
        case = B.VAULT_ETH
        forged = R3.at_sha(case["report"], R3.FORK_SHA).replace("sherlock-audit/2024-05-pooltogether-judging",
                                                               "Sherlock-AUDIT/2024-05-PoolTogether-Judging")
        R3.serve(forged, PAGES[case["report"]])
        R3.branch_answer(forged, R3.FORK_ONLY)
        out = w.file(case, report_url=forged)
        self.assertEqual((out["status"], out["reason"]), ("REFUSED", "REPORT_COMMIT_NOT_ON_BRANCH"))
        self.assertIn(GH + R3.JUDGING + "/branch_commits/" + R3.FORK_SHA, WEB.log, "read under the lowercased name")

    def test_case_variant_of_the_real_report_is_the_same_check(self):
        w = B.World()
        self.assertEqual(w.file(B.CLAIMER)["status"], "OK")
        upper = B.CLAIMER["report"].replace("sherlock-audit/2024-05-pooltogether-judging",
                                            "SHERLOCK-AUDIT/2024-05-POOLTOGETHER-JUDGING")
        out = w.file(B.CLAIMER, report_url="  " + upper + "\n")
        self.assertEqual(out["reason"], "ALREADY_OPEN_AS_CHECK_1")

    def test_whitespace_and_escapes_inside_owner_or_repo(self):
        w = B.World()
        r = B.CLAIMER["report"]
        for bad, why in ((r.replace("sherlock-audit/", "sherlock-audit /"), "REPORT_URL_NOT_PINNED"),
                         (r.replace("sherlock-audit/", "sherlock\taudit/"), "REPORT_URL_NOT_PINNED"),
                         (r.replace("sherlock-audit/", "sherlock%2Daudit/"), "URL_PERCENT_ENCODED"),
                         (r.replace("sherlock-audit/", "sherlock%2daudit/"), "URL_PERCENT_ENCODED")):
            out = w.file(B.CLAIMER, report_url=bad)
            self.assertEqual((out["status"], out["reason"]), ("REFUSED", why), bad)
        self.assertEqual(int(w.c.checks_n), 0)

    def test_names_github_never_issues_are_refused_before_any_fetch(self):
        d = B.CLAIMER["docs"]
        for bad in (d.replace("/pt-dev-docs/", "/pt-dev-docs.git/"), d.replace("/pt-dev-docs/", "/pt-dev-docs./"),
                    d.replace("GenerationSoftware/", "-GenerationSoftware/"),
                    d.replace("GenerationSoftware/", "Generation_Software/"),
                    d.replace("GenerationSoftware/", "Generation--Software/")):
            w = B.World()
            out = w.file(B.CLAIMER, docs_url=bad)
            self.assertEqual((out["status"], out["reason"]), ("REFUSED", "GITHUB_NAME_INVALID"), bad)
            self.assertEqual(WEB.log, [], bad)


class R4_F4_RenamedOrTransferredRepos(unittest.TestCase):
    """GitHub keeps serving a renamed or transferred repo under its old name:
    raw answers 200 directly, and github.com answers 301 to the new name
    (real: Uniswap/uniswap-v3-core -> Uniswap/v3-core). The rule: a URL must
    name the repository as GitHub names it now. Under the old name the branch
    list (after the redirect GenVM follows) links the NEW name, which is not
    the repository the URL names, so the commit is on no branch of it and the
    filing is refused. One repository therefore has one spelling, one check
    key and one protocol key."""

    def test_real_redirected_answer(self):
        self.assertEqual(MOD.repo_branches(RENAMED, "uniswap", "uniswap-v3-core"), [])
        self.assertEqual(MOD.repo_branches(RENAMED, "uniswap", "v3-core"), ["default:main"])

    def test_report_and_docs_under_an_old_name_are_refused(self):
        case = B.VAULT_ETH
        real_report_bc = PAGES[GH + R3.JUDGING + "/branch_commits/" + MOD.github_pin(case["report"])["sha"]]
        old = case["report"].replace("2024-05-pooltogether-judging", "2024-05-pooltogether-judging-old-judging")
        w = B.World()
        R3.serve(old, PAGES[case["report"]])
        R3.branch_answer(old, real_report_bc)            # what the redirect lands on
        out = w.file(case, report_url=old)
        self.assertEqual((out["status"], out["reason"]), ("REFUSED", "REPORT_COMMIT_NOT_ON_BRANCH"))
        real_docs_bc = PAGES[GH + "generationsoftware/pt-dev-docs/branch_commits/"
                             + MOD.github_pin(case["docs"])["sha"]]
        old = case["docs"].replace("/pt-dev-docs/", "/pooltogether-docs/")
        w = B.World()
        R3.serve(old, PAGES[case["docs"]])
        R3.branch_answer(old, real_docs_bc)
        out = w.file(case, docs_url=old)
        self.assertEqual((out["status"], out["reason"]), ("REFUSED", "DOCS_COMMIT_NOT_ON_BRANCH"))


# =============================================================================
# Step 3. The round-3 proxy chronology (round-3 fix 2), attacked from outside
# =============================================================================

BEACON_SLOT = "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50"
BEACON = "0x" + "3c" * 20
IMPL, OTHER = R3.IMPL, R3.OTHER
BEFORE_FIX, AFTER_FIX = R3.BEFORE_FIX, R3.AFTER_FIX
LONG_AGO = R3.epoch("2024-01-10T00:00:00Z")        # before the audit (2024-05-16)


def run(case, *a, **k):
    """File the case served as a proxy (R3.as_proxy), decide it, return (decide result, stored check)."""
    w = B.World()
    R3.as_proxy(case, *a, **k)
    out = w.file(case)
    if out["status"] != "OK":
        return out, None
    w.at(T0 + 3600)
    d = w.call(B.ANYONE, "decide", out["check_id"])
    return d, w.c.get_check(out["check_id"])


def set_beacon(case, beacon=BEACON):
    rpc = MOD.CHAINS[case["chain"]][3]
    WEB.rpc[(rpc, "eth_getStorageAt", json.dumps([case["address"].lower(), BEACON_SLOT, "latest"]))] = slot_word(beacon)


class R4_P1_BeaconProxies(unittest.TestCase):
    """A beacon proxy keeps its implementation in a second contract (the
    beacon); upgrades are the BEACON's Upgraded events, the proxy only emits
    BeaconUpgraded. The proxy's own EIP-1967 implementation slot is empty."""

    def test_beacon_proxy_the_explorer_resolves(self):
        # Blockscout names the beacon's implementation; the slot is empty: held
        w = B.World()
        R3.as_proxy(B.VAULT_ETH, BEFORE_FIX, BEFORE_FIX, [], slot="", explorer_impl=IMPL)
        set_beacon(B.VAULT_ETH)
        out = w.file(B.VAULT_ETH)
        self.assertEqual(out["code_says"], "INCONCLUSIVE")

    def test_beacon_proxy_the_explorer_does_not_resolve(self):
        # the address's own verified source carries the audited function, the
        # explorer names no implementation, but the code that runs is chosen
        # by a beacon: it must not be dated by the address's creation
        w = B.World()
        R3.as_proxy(B.VAULT_ETH, LONG_AGO, LONG_AGO, [], slot="", explorer_impl="")
        set_beacon(B.VAULT_ETH)
        out = w.file(B.VAULT_ETH)
        self.assertEqual((out["status"], out["dep_status"]), ("OK", "BEACON_PROXY"),
                         "a beacon proxy was judged and dated as a plain contract: " + json.dumps(out))
        w.at(T0 + 3600)
        d = w.call(B.ANYONE, "decide", out["check_id"])
        self.assertEqual((d["verdict"], d["basis"]), ("INCONCLUSIVE", "BEACON_PROXY"))


class R4_P2_UUPSAndWhoEmits(unittest.TestCase):
    """UUPS: upgradeTo runs in the implementation's code but in the proxy's
    context, so the proxy's address emits Upgraded, as with a transparent
    proxy. An Upgraded log emitted by the implementation's own address (an
    uninitialised implementation upgraded directly) says nothing about the
    proxy."""

    def test_uups_proxy_is_dated_by_its_own_event(self):
        d, ch = run(B.VAULT_ETH, BEFORE_FIX, BEFORE_FIX, [(20430000, 4, IMPL, AFTER_FIX)])
        self.assertEqual((d["verdict"], ch["switch_status"]), ("NOT_FIXED", "EVENT"))

    def test_upgraded_logged_by_another_address_is_ignored(self):
        addr = B.VAULT_ETH["address"].lower()
        page = json.loads(R3.logs_page(addr, [(20430000, 4, IMPL, AFTER_FIX)]))
        old = json.loads(R3.logs_page(IMPL, [(19500000, 1, IMPL, LONG_AGO)]))["items"]
        page["items"] = page["items"] + old                   # the implementation's own, older log
        last = MOD.last_upgrade(json.dumps(page), addr, 10 ** 9)
        self.assertEqual((last["block"], last["impl"]), (20430000, IMPL))


class R4_P3_RollbackABA(unittest.TestCase):
    def test_a_then_b_then_back_to_a_after_the_fix(self):
        d, ch = run(B.VAULT_ETH, BEFORE_FIX, BEFORE_FIX, [
            (19900000, 3, IMPL, BEFORE_FIX), (20280000, 9, OTHER, R3.epoch("2024-07-10T00:00:00Z")),
            (20430000, 4, IMPL, R3.epoch("2024-08-01T00:00:00Z"))])
        self.assertEqual((d["verdict"], ch["switch_block"]), ("NOT_FIXED", 20430000))

    def test_a_then_b_then_back_to_a_all_before_the_fix(self):
        d, ch = run(B.VAULT_ETH, LONG_AGO, LONG_AGO, [
            (19000000, 3, IMPL, LONG_AGO), (19100000, 9, OTHER, LONG_AGO + 86400),
            (19950000, 4, IMPL, BEFORE_FIX)])
        self.assertEqual((d["verdict"], ch["switch_block"]), ("PREDATES_FIX", 19950000))


class R4_P4_CodeRedeployedAtTheSameAddress(unittest.TestCase):
    """Metamorphic contracts: before EIP-6780 a contract could SELFDESTRUCT and
    other code be created at the same address (CREATE2 with a changing init
    code). The explorer's creation tx then dates the FIRST code. The code at
    the slot block must be the code created at that tx's block - else the
    creation date says nothing about the code that runs."""

    def redeploy(self, address, created_at, later, code_then="0x60aa", code_now="0x60bb"):
        WEB.code[address.lower()] = [(R3.block_of(created_at), code_then), (R3.block_of(later), code_now)]

    def test_implementation_redeployed_after_the_fix(self):
        w = B.World()
        R3.as_proxy(B.VAULT_ETH, LONG_AGO, LONG_AGO, [(19000000, 3, IMPL, LONG_AGO)])
        self.redeploy(IMPL, LONG_AGO, AFTER_FIX)
        out = w.file(B.VAULT_ETH)
        w.at(T0 + 3600)
        d = w.call(B.ANYONE, "decide", out["check_id"])
        self.assertNotIn(d["verdict"], ("PREDATES_AUDIT", "PREDATES_FIX"),
                         "an implementation whose code changed after its creation was dated by that creation")
        self.assertEqual((d["verdict"], d["basis"]), ("INCONCLUSIVE", "DEPLOY_TIME_UNKNOWN"))
        self.assertEqual(w.c.get_check(out["check_id"])["impl_code_status"], "CODE_CHANGED")

    def test_plain_contract_redeployed(self):
        w = B.World()
        case = B.VAULT_OP                                  # created 2024-04-18, before the audit: PREDATES_AUDIT
        addr = case["address"].lower()
        born = B.stub.born_block(addr)
        WEB.code[addr] = [(born, "0x60aa"), (born + 10 ** 6, "0x60bb")]
        out = w.file(case)
        w.at(T0 + 3600)
        d = w.call(B.ANYONE, "decide", out["check_id"])
        self.assertEqual((d["verdict"], d["basis"]), ("INCONCLUSIVE", "DEPLOY_TIME_UNKNOWN"))

    def test_not_created_in_the_block_the_explorer_names(self):
        w = B.World()
        case = B.VAULT_OP
        addr = case["address"].lower()
        WEB.code[addr] = [(0, "0x60aa")]                   # code already there before that block
        out = w.file(case)
        self.assertEqual(w.c.get_check(out["check_id"])["code_status"], "NOT_CREATED_THERE")
        self.assertEqual(out["code_says"], "INCONCLUSIVE")

    def test_unchanged_code_keeps_its_dates(self):
        d, ch = run(B.VAULT_ETH, LONG_AGO, LONG_AGO, [(19000000, 3, IMPL, LONG_AGO)])
        self.assertEqual(d["verdict"], "PREDATES_AUDIT")
        self.assertEqual((ch["code_status"], ch["impl_code_status"]), ("OK", "OK"))

    def test_a_later_known_date_still_decides(self):
        # the implementation's own date is unknown, but the proxy was created
        # after the fix: the running code was chosen after the fix either way
        w = B.World()
        R3.as_proxy(B.VAULT_ETH, AFTER_FIX, LONG_AGO, [(20670000, 3, IMPL, AFTER_FIX)])
        self.redeploy(IMPL, LONG_AGO, BEFORE_FIX)
        out = w.file(B.VAULT_ETH)
        w.at(T0 + 3600)
        self.assertEqual(w.call(B.ANYONE, "decide", out["check_id"])["verdict"], "NOT_FIXED")


class R4_P5_SlotReadBeforeTheLastUpgrade(unittest.TestCase):
    """An Upgraded event ABOVE the slot block means the block is stale. If the
    upgrade re-set the same implementation after the fix (upgradeToAndCall
    with the old implementation), the slot does not change, so the window
    check (R4-L2) passes, and the switch was dated by the older event:
    PREDATES_FIX for code re-chosen after the fix existed."""

    def test_same_implementation_re_set_after_the_fix_above_the_slot_block(self):
        w = B.World()
        case = B.VAULT_ETH
        head = B.stub.HEAD
        R3.as_proxy(case, LONG_AGO, LONG_AGO, [(19000000, 3, IMPL, LONG_AGO), (head - 10, 2, IMPL, AFTER_FIX)])
        FORGE["payload"] = MOD.gather(params_of(case), head - 50)
        try:
            out = w.file(case)
        except B.stub._Rolled:
            out = {"status": "ROLLED"}
        self.assertEqual(int(w.c.checks_n), 0, "a slot block below a later Upgraded event was accepted: "
                         + json.dumps(out)[:160])
        self.assertEqual(MOD.gather(params_of(case), head - 50), {"refused": "UPGRADED_AFTER_SLOT_BLOCK"})

    def test_explorer_ahead_of_the_rpc_refuses_then_files(self):
        w = B.World()
        case = B.VAULT_ETH
        R3.as_proxy(case, LONG_AGO, LONG_AGO, [(19000000, 3, IMPL, LONG_AGO), (B.stub.HEAD + 5, 1, IMPL, AFTER_FIX)])
        out = w.file(case)
        self.assertEqual((out["status"], out["reason"]), ("REFUSED", "UPGRADED_AFTER_SLOT_BLOCK"))
        WEB.head[MOD.CHAINS["ethereum"][3]] = B.stub.HEAD + 20          # the RPC caught up
        out = w.file(case)
        self.assertEqual(out["status"], "OK")
        w.at(T0 + 3600)
        self.assertEqual(w.call(B.ANYONE, "decide", out["check_id"])["verdict"], "NOT_FIXED")

if __name__ == "__main__":
    unittest.main(verbosity=2)
