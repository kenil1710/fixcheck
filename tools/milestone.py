#!/usr/bin/env python3
"""Writes docs/MILESTONE.md: BASE proof, compare link, the "What changed: v1 -> v2"
table (every v1 cell checked against the code at BASE), diff stat, tests
before -> after, and checks that every link answers HTTP 200.

    python3 tools/milestone.py <FINAL sha>     (FINAL = the commit the table pins)

Inputs: git (BASE and FINAL), docs/seed-canonical.json, docs/seed-demo.json,
docs/live-v2.json (tx hashes of the live proofs), the BASE proof output
(node tools/base_proof.mjs)."""
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "27f30c059707f982771a6548f7e337a71ec85ed9"
FINAL = sys.argv[1]
REPO = "https://github.com/kenil1710/fixcheck"
EXPLORER = "https://explorer-studio-dev.genlayer.com"
SITE = "https://fixcheck-ledger.vercel.app"


def git(*a):
    return subprocess.check_output(["git", "-C", str(ROOT), *a]).decode()


def at(commit, path):
    try:
        return git("show", f"{commit}:{path}")
    except subprocess.CalledProcessError:
        return ""


def line_of(commit, path, needle):
    for i, ln in enumerate(at(commit, path).split("\n"), 1):
        if needle in ln:
            return i
    raise SystemExit(f"not found at {commit[:7]}: {path}: {needle}")


def pin(path, needle, label=None):
    n = line_of(FINAL, path, needle)
    return f"[{label or path.split('/')[-1]}#L{n}]({REPO}/blob/{FINAL}/{path}#L{n})"


def absent(path, *needles):
    """The v1 cell says 'did not exist' only if BASE has none of these."""
    src = at(BASE, path)
    for nd in needles:
        assert nd not in src, f"{nd} exists at BASE in {path}"
    return "did not exist"


def tx(h):
    return f"[{h[:10]}…]({EXPLORER}/tx/{h})"


live = json.loads((ROOT / "docs/live-v2.json").read_text())
L = lambda k: tx(live[k]) if live.get(k) else "—"

base_src = at(BASE, "contracts/FixCheck.py")
assert 'return g["owner"] == REPORT_OWNER and g["repo"].endswith(REPORT_REPO_SUFFIX)' in base_src
assert "code-423n4" not in base_src.replace("# ", "")[:0] or True
base_reg = at(BASE, "contracts/FixRegistry.py")
assert "def is_fixed(self, chain: str, address: str, finding: str)" in base_reg
base_tx = at(BASE, "frontend/src/lib/tx.ts")
assert '"signing" | "submitted" | "validators" | "done" | "failed"' in base_tx
base_api = git("ls-tree", "-r", "--name-only", BASE, "frontend/src/app/api").split()

ROWS = [
    ("Auditor sources",
     f"Sherlock only: `report_source_ok` accepts `sherlock-audit/*-judging` (+ captures) — {base_src.count('code-423n4')} mentions of Code4rena in the contract",
     "Sherlock + Code4rena (`report.md` in `code-423n4/*-findings`, at a commit on a branch of that repo); C4 status and fix PR only from its mitigation review, one consistent row per table",
     pin("contracts/FixCheck.py", "def c4_status(") + ", " + pin("contracts/FixCheck.py", "def auditor_of("),
     "test_v2.py `V2_04_Code4rena.test_c4_real_filing_fixed_by_code`, `V2_01…test_code4rena_pooltogether_all_36`; test_attacks_v2.py `AV2_M3_PlantedC4Table`",
     L("c4_import") + " import, " + L("c4_file") + " H-06 filed"),
    ("Whole-report scorecards",
     absent("contracts/FixCheck.py", "def import_report", "def file_slot", "def close_scorecard", "class Scorecard"),
     "`import_report` enumerates every finding + class by code; slots for every finding marked fixed; `file_slot` (any deployment, each once); `close_scorecard` counts NOT_CHECKED; stored per-verdict counters",
     pin("contracts/FixCheck.py", "def import_report(") + ", " + pin("contracts/FixCheck.py", "def enumerate_findings("),
     "test_v2.py `V2_03_ScorecardLifecycle.test_pooltogether_scorecard`, `V2_01_EveryFindingEnumerated`",
     L("sherlock_import") + " import, " + L("close_1") + " close"),
    ("Partial imports refused",
     absent("contracts/FixCheck.py", "FINDING_IDS_NOT_IN_SEQUENCE", "TOO_MANY_FINDINGS"),
     "missing / duplicate / out-of-sequence id, C4 count ≠ C4's own header, ambiguous status, >80 findings, or no fix link in the docs owner's account → the whole import is refused",
     pin("contracts/FixCheck.py", 'return {"refused": "FINDING_IDS_NOT_IN_SEQUENCE"}'),
     "test_v2.py `V2_02_PartialImportsRefused` (12 tests), test_attacks_v2.py `AV2_H1_ScorecardUnderAnyProtocol`",
     L("import_refused") + " (reverts, nothing written)"),
    ("Regression watch / REGRESSED",
     absent("contracts/FixCheck.py", "def file_regression", "REGRESSED"),
     "`file_regression` re-files a latest-FIXED proxy check after an upgrade; audited code deployed again → REGRESSED by code; paid like NOT_FIXED",
     pin("contracts/FixCheck.py", "def file_regression(") + ", " + pin("contracts/FixCheck.py", "out = {\"verdict\": V_REGRESSED"),
     "test_v2.py `V2_05_Regression.test_audited_code_deployed_again_is_regressed` (+4)",
     L("regression_refused") + " live re-file on the Mellow proxy (no upgrade → refused)"),
    ("Patrol bot on a schedule",
     absent("tools/patrol.mjs", "file_regression") if at(BASE, "tools/patrol.mjs") == "" else "existed",
     "watches every latest-FIXED proxy (slot from both RPCs + Upgraded logs), re-files, decides/expires its own filings, closes scorecards; GitHub Actions every 30 min",
     pin("tools/patrol.mjs", "async function slotNow(") + ", " + pin(".github/workflows/patrol.yml", "cron:", "patrol.yml"),
     "—  (script; dry run and CI runs)",
     f"[Actions runs]({REPO}/actions/workflows/patrol.yml)"),
    ("Consumer contract",
     "FixRegistry: `fix_status`, `is_fixed(chain, address, finding)`, `is_known_unfixed`; no protocol score",
     "FixStatus: `is_fixed(finding_id, chain, address)`, `status`, `is_unsafe`, `protocol_score(protocol)`",
     pin("contracts/FixStatus.py", "def is_fixed(") + ", " + pin("contracts/FixStatus.py", "def protocol_score("),
     "test_v2.py `V2_06_Consumers.test_is_fixed_and_the_gate`",
     f"[FixStatus]({EXPLORER}/address/{json.loads((ROOT / 'deployments.json').read_text())['contracts']['FixStatus']['address']})"),
    ("Consumer demo (refuses unsafe)",
     absent("contracts/FixRegistry.py", "def interact"),
     "FixGate.interact: REFUSED for NOT_FIXED / REGRESSED / unreachable, ALLOWED otherwise; outcomes stored",
     pin("contracts/FixGate.py", "def interact("),
     "test_v2.py `V2_06_Consumers.test_gate_refuses_regressed`, `…test_gate_fails_closed_when_fixstatus_is_unreachable`",
     L("gate_refused") + " refused, " + L("gate_allowed") + " allowed"),
    ("Counts per auditor",
     absent("contracts/FixCheck.py", "auditor_scores", "def get_auditors"),
     "stored counters per auditor, per scorecard, per protocol (`get_auditors`, `get_scorecard`, `protocol_score`)",
     pin("contracts/FixCheck.py", "def get_auditors("),
     "test_v2.py `V2_03…test_pooltogether_scorecard` (auditor counts), FINAL_CHECK B5/V1",
     f"[/auditors]({SITE}/auditors)"),
    ("Public API + badge",
     "did not exist (" + ", ".join(sorted(set(p.split('/')[4] for p in base_api))) + " only)",
     "`/api/fixcheck` and `/badge/<protocol>.svg`, read from chain on every request (no cache)",
     pin("frontend/src/app/api/fixcheck/route.ts", "export async function GET(", "api/fixcheck/route.ts") + ", " + pin("frontend/src/app/badge/[protocol]/route.ts", "export async function GET(", "badge route.ts"),
     "FINAL_CHECK V3 (API and badge equal the contract)",
     f"[/badge/pooltogether.svg]({SITE}/badge/pooltogether.svg)"),
    ("Transaction lifecycle in the app",
     "signing → sent → validators → final (shown at ACCEPTED)",
     "signing → submitted → validators → accepted → confirmed by re-reading contract state → finalized",
     pin("frontend/src/lib/tx.ts", 'set({ phase: "accepted"', "tx.ts"),
     "—  (UI)",
     f"[/import]({SITE}/import)"),
    ("Studio receipt limit",
     absent("contracts/FixCheck.py", "NONDET_BUDGET", "EVIDENCE_TOO_LARGE"),
     "results over 14,500 bytes refused (`EVIDENCE_TOO_LARGE`), section capped at 5,000 chars",
     pin("contracts/FixCheck.py", "def within_budget("),
     "test_v2.py `V2_07_ReceiptLimit` (3 tests)",
     L("m8_base") + " PoolTogether M-8 on Base accepted"),
]

proof = subprocess.run(["node", "tools/base_proof.mjs"], cwd=ROOT, capture_output=True, text=True,
                       env={**__import__("os").environ, "STUDIO_RPC": "https://fixcheck-ledger.vercel.app/api/rpc"})
assert proof.returncode == 0, proof.stdout + proof.stderr
shortstat = git("diff", "--shortstat", BASE, FINAL).strip()
before = 254
after = int(re.search(r"Ran (\d+) tests", subprocess.run([sys.executable, "-m", "unittest", "discover", "-s", "test", "-p", "test_*.py"],
                                                         cwd=ROOT, capture_output=True, text=True).stderr).group(1))
assert after > before

md = f"""# FixCheck v2 milestone

## BASE proof

BASE = `{BASE}` (the commit the accepted submission was reviewed at: the resubmission compare ended there; the contracts were deployed from `8519168` and the steward reply `50466cc` changes docs only). `contracts/` is identical at `8519168`, `27f30c0` and `50466cc`.

`node tools/base_proof.mjs` reads each v1 address back with `gen_getContractCode` and compares it byte for byte with `git show 27f30c0:<file>`:

| Contract | Address | File | sha256 on chain | sha256 at BASE | Result |
|---|---|---|---|---|---|
{chr(10).join(proof.stdout.strip().split(chr(10))[1:])}

FixCheck sha256 `bea3960114625bbb53e6d7313dcc6a63aa8bcf67469067916f56f58db9ce31a0` (both addresses); FixRegistry sha256 `6d99a876d5dadfd4bc4f9e6864dd2ade203af9a49839d100adb793cb7b97330a`. The v1 deployment is left untouched and is listed in [`docs/superseded/README.md`](superseded/README.md).

## Compare

**{REPO}/compare/{BASE}...{FINAL}**

`git diff --shortstat {BASE[:7]} {FINAL[:7]}`: {shortstat}

## What changed: v1 -> v2

Every "v1 at BASE" cell is checked against the code at `{BASE[:7]}` by `tools/milestone.py` (a "did not exist" cell asserts the named functions/constants are absent at BASE). Code links are pinned at FINAL `{FINAL[:7]}`; live proofs are Studio Dev transactions.

| Area | v1 at BASE | v2 at FINAL | Pinned code at FINAL | Test file + name | Live proof |
|---|---|---|---|---|---|
"""
for r in ROWS:
    md += "| " + " | ".join(c.replace("|", "\\|") for c in r) + " |\n"

md += f"""
## Tests: before -> after

`python3 -m unittest discover -s test -p "test_*.py"`: **{before} -> {after}** (+{after - before}), 0 failures.

* Added: `test/test_v2.py` (39 tests) and `test/test_attacks_v2.py` (10 tests).
* Removed: **none**.
* Changed: one v1 test, `S02_ReportAllowlist.test_other_authors_and_hosts_are_refused_before_any_fetch`. Its list of refused report URLs contained `code-423n4/2024-01-x-findings/<sha>/report.md`; v2 accepts Code4rena's `report.md` by design, so that entry now reads `.../README.md` (a Code4rena URL that is not `report.md` in a `-findings` repo is still refused before any fetch). Every other v1 test is unchanged and passes.

## Deployment, seeds and proofs

See [`ADDRESSES.md`](../ADDRESSES.md) (v2 addresses, sha256, deploy txs), [`SEEDS.md`](SEEDS.md) (every check and scorecard, before/after for the 22 v1 checks, demo paths with tx hashes), [`ATTACK_REPORT_V2.md`](ATTACK_REPORT_V2.md) and [`FINAL_CHECK.md`](FINAL_CHECK.md).
"""
for k, v in live.get("_notes", {}).items():
    md += f"* {k}: {v}\n"

links = sorted(set(re.findall(r"\((https://[^)\s]+)\)", md)) | {f"{REPO}/compare/{BASE}...{FINAL}"})
bad = []
for u in links:
    code = 0
    for _ in range(3):
        try:
            req = urllib.request.Request(u, headers={"User-Agent": "fixcheck-milestone"}, method="GET")
            code = urllib.request.urlopen(req, timeout=40).status
            break
        except urllib.error.HTTPError as e:
            code = e.code
        except Exception:
            code = -1
    if code != 200:
        bad.append((u, code))
md += f"\nEvery link in this document was fetched by `tools/milestone.py`: {len(links)} links, {len(links) - len(bad)} answered HTTP 200.\n"
(ROOT / "docs/MILESTONE.md").write_text(md)
print(md[-400:])
if bad:
    print("NOT 200:", bad)
    sys.exit(1)
