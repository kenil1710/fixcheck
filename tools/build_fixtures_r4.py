"""Real GitHub answers for the round-4 attack pass (docs/ATTACK_REPORT_R4.md):
   python3 tools/build_fixtures_r4.py  ->  test/fixtures/pages_r4.json
Each key is the URL the contract fetches (owner/repo lowercased, as norm_url
spells it); the body is GitHub's answer after following redirects, which is
what GenVM sees."""
import json, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GH = "https://github.com/"
WANT = {
    # commit only on refs/pull/1305/head (closed, unmerged PR from the fork Kemperino/superchain-registry)
    "pr_only_closed": "ethereum-optimism/superchain-registry/branch_commits/6be72121777d061d6ca7256f51ad1225235f6f93",
    # commit only on refs/pull/1344/head (OPEN PR from the fork arunimshukla/superchain-registry)
    "pr_only_open": "ethereum-optimism/superchain-registry/branch_commits/3f81046b46a52bd730304829d72665373e7f940b",
    # an upstream branch with an open PR from it: the branch counts, the PR item does not
    "upstream_pr_branch": "ethereum-optimism/superchain-registry/branch_commits/882ca03bc1b2e95d31dd3dd8b38a8ae39715bfb7",
    # the head of PR #63, whose branch was deleted after the PR closed unmerged
    "deleted_branch": "generationsoftware/pt-v5-vault/branch_commits/905189bb6fb7c36f24e4a9b90d7872c963d58010",
    # a renamed repo under its OLD name: GitHub answers 301 to Uniswap/v3-core
    "renamed_old_name": "uniswap/uniswap-v3-core/branch_commits/d0831dc6b8a318df3872b6d68f6de135c9f3ec29",
    "renamed_new_name": "uniswap/v3-core/branch_commits/d0831dc6b8a318df3872b6d68f6de135c9f3ec29",
}
out = {}
for name, path in WANT.items():
    req = urllib.request.Request(GH + path, headers={"User-Agent": "fixcheck-fixtures"})
    with urllib.request.urlopen(req, timeout=30) as r:
        out[name] = {"url": GH + path, "final": r.geturl(), "status": r.status, "body": r.read().decode("utf-8")}
# Round-4 fix 7: the GitHub issue page of every fixture case's finding (the
# section's "Source:" link), cut to GitHub's embedded JSON - the part the
# contract reads (comment authors and bodies). Real bytes, a substring of the
# page.
import re, sys
sys.path.insert(0, str(ROOT / "test"))
cases = json.loads((ROOT / "test/fixtures/cases.json").read_text())
pages = json.loads((ROOT / "test/fixtures/pages.json").read_text())
issues = {}
TAG = '<script type="application/json" data-target="react-app.embeddedData">'
for c in cases:
    rep = next(v for k, v in pages.items() if k.lower() == c["report"].lower())
    rep = rep if isinstance(rep, str) else rep[1]
    k = rep.find("# Issue " + c["id"] + ":")
    m = re.search(r"Source: (https://github.com/sherlock-audit/[^/\s]+/issues/\d+)", rep[k:k + 400])
    url = m.group(1)
    if url in issues:
        continue
    req = urllib.request.Request(url, headers={"User-Agent": "fixcheck-fixtures"})
    html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8")
    a = html.index(TAG)
    b = html.index("</script>", a)
    issues[url.lower()] = html[a:b + len("</script>")]
out["issues"] = issues
(ROOT / "test/fixtures/pages_r4.json").write_text(json.dumps(out, indent=1))
print("issues", {k: len(v) for k, v in issues.items()})
for k, v in out.items():
    if k != "issues":
        print(k, v["status"], v["final"], len(v["body"]))
