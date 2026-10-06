"""Extract every finding marked fixed from Sherlock judging READMEs.
   python3 tools/sherlock_extract.py research_cache/sherlock/*.md > out.json"""
import json, re, sys

ISSUE = re.compile(r"^# Issue ([HM]-\d+): (.*)$", re.M)
BLOB = re.compile(r"https://github\.com/([\w.-]+)/([\w.-]+)/blob/([0-9a-f]{40})/([^\s#)\]]+)(?:#L(\d+)(?:-L(\d+))?)?")
FIXLINK = re.compile(r"https://github\.com/[\w.-]+/[\w.-]+/(?:pull/\d+|commit/[0-9a-f]{7,40})")

out = []
for path in sys.argv[1:]:
    text = open(path, encoding="utf-8", errors="ignore").read()
    contest = path.rsplit("/", 1)[-1][:-3]
    heads = list(ISSUE.finditer(text))
    for i, m in enumerate(heads):
        body = text[m.end(): heads[i + 1].start() if i + 1 < len(heads) else len(text)]
        k = body.find("The protocol team fixed this issue")
        if k < 0:
            continue
        fixes = sorted(set(FIXLINK.findall(body[k:k + 2000])))
        snippets = [dict(owner=a, repo=b, sha=c, path=d, l1=e, l2=f) for a, b, c, d, e, f in BLOB.findall(body)]
        signed = "Lead Senior Watson signed off on the fix" in body
        out.append(dict(contest=contest, id=m.group(1), title=m.group(2).strip(), fixes=fixes,
                        snippets=snippets[:8], signed_off=signed))
json.dump(out, sys.stdout, indent=1)
