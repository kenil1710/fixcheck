"""List functions whose canonical body differs between two file versions.
   python3 tools/changed_fns.py <rawurlA> <rawurlB>"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import rc, solfn
a, b = rc.get(sys.argv[1]), rc.get(sys.argv[2])
if a == "__404__" or b == "__404__":
    print("404", sys.argv[1] if a == "__404__" else sys.argv[2]); sys.exit()
names = sorted(set(rc.fn_names(a)) | set(rc.fn_names(b)))
for n in names:
    x = solfn.extract({"a.sol": a}, "a.sol", n); y = solfn.extract({"a.sol": b}, "a.sol", n)
    if x.get("canon") != y.get("canon"):
        print("  changed:", n, "" if x["ok"] and y["ok"] else (x.get("why"), y.get("why")))
