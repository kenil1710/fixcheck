#!/usr/bin/env python3
"""Writes docs/SUBMISSION.md: the milestone text (<= 1000 chars, plain ASCII),
compare link first, numbers from docs/seed-canonical.json (a chain snapshot).
    python3 tools/submission.py <FINAL sha>"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = "27f30c0"
FINAL = sys.argv[1]
d = json.loads((ROOT / "deployments.json").read_text())["contracts"]
snap = json.loads((ROOT / "docs/seed-canonical.json").read_text())
st = snap["stats"]
cards = {c["auditor"] + ":" + c["protocol"]: c for c in snap["scorecards"]["items"]}
pts = cards["sherlock:github:generationsoftware/pt-dev-docs"]
c4 = cards["code4rena:github:generationsoftware/pt-dev-docs"]
tests = sys.argv[2] if len(sys.argv) > 2 else "254->303"

text = (
    f"https://github.com/kenil1710/fixcheck/compare/{BASE}...{FINAL[:7]}\n"
    f"BASE {BASE}: gen_getContractCode of v1 0x263C6a42/0x19bc7Cb1 (sha256 bea39601) and FixRegistry 0xA37F9897 (6d99a876) byte-identical to contracts/ at BASE.\n"
    f"v2: whole-report scorecards (code enumerates every finding; partial imports refused; unchecked = NOT_CHECKED), "
    f"Code4rena via its mitigation review, regression watch (patrol bot on GitHub Actions, REGRESSED by code), "
    f"FixStatus is_fixed/protocol_score + FixGate refusing NOT_FIXED/REGRESSED, /api/fixcheck + badge from chain, per-auditor counts.\n"
    f"Live: PoolTogether Sherlock {pts['findings']} findings/{pts['marked_fixed']} fixed-marked, {pts['verdicts']['fixed']} FIXED {pts['verdicts']['not_fixed']} NOT_FIXED; "
    f"C4 {c4['findings']}/{c4['marked_fixed']}, {c4['verdicts']['fixed']} FIXED. Attack round: 1 High 3 Med 1 Low fixed.\n"
    f"Tests {tests}. New: FixCheck {d['FixCheck']['address'][:10]}, demo {d['FixCheckDemo']['address'][:10]}, FixStatus {d['FixStatus']['address'][:10]}, FixGate {d['FixGate']['address'][:10]}.\n"
    f"Details: docs/MILESTONE.md"
)
assert all(ord(ch) < 128 for ch in text), "non-ASCII"
n = len(text)
assert n <= 1000, n
md = f"# Milestone submission text\n\n{n} characters, plain ASCII (counted by `tools/submission.py`).\n\n```\n{text}\n```\n"
(ROOT / "docs/SUBMISSION.md").write_text(md)
print(text)
print("\nchars:", n)
