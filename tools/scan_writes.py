"""B4: no state written before any check that can revert.

For every @gl.public.write method of FixCheck, walk its statements in source
order (nested helper defs - the nondet leader/validator - are skipped: they
never write storage) and record
  * writes: assignments / aug-assignments / deletes whose target is rooted at
    `self` or at a local alias of storage (x = self.<...>, self._check(),
    self._score(), self.checks[...]), and calls to the storage-writing
    helpers (_bank, _credit, _to_stake, _release, _release_fee, _settle,
    _close, _score, _refuse, _ok);
  * reverts: `raise`, and calls to self._check (which raises).
A method passes if no revert appears after its first write.
   python3 tools/scan_writes.py   (exit 1 on any violation)"""
import ast, sys
from pathlib import Path
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "contracts" / "FixCheck.py"
WRITERS = {"_bank", "_credit", "_to_stake", "_release", "_release_fee", "_settle", "_close", "_score", "_refuse", "_ok"}
RAISERS = {"_check"}
tree = ast.parse(SRC.read_text())
cls = next(n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == "FixCheck")

def is_write_method(f):
    for d in f.decorator_list:
        t = ast.unparse(d)
        if t.startswith("gl.public.write"):
            return True
    return False

def root(node):
    while isinstance(node, (ast.Attribute, ast.Subscript)):
        node = node.value
    return node.id if isinstance(node, ast.Name) else ""

def scan(f):
    aliases = {"self"}
    events = []
    def visit(stmts):
        for s in stmts:
            if isinstance(s, (ast.FunctionDef, ast.AsyncFunctionDef, ast.Lambda)):
                continue
            # aliases of storage
            if isinstance(s, ast.Assign) and len(s.targets) == 1 and isinstance(s.targets[0], ast.Name):
                v = s.value
                src = ast.unparse(v)
                if src.startswith("self.") and not src.startswith("self._now") and not src.startswith("self._who") and not src.startswith("self._bank"):
                    aliases.add(s.targets[0].id)
            for n in ast.walk(s) if not isinstance(s, (ast.If, ast.For, ast.While, ast.Try, ast.With)) else [s]:
                if isinstance(n, (ast.FunctionDef, ast.Lambda)):
                    continue
                if isinstance(n, ast.Raise):
                    events.append(("revert", n.lineno, "raise"))
                elif isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute) and isinstance(n.func.value, ast.Name) and n.func.value.id == "self":
                    if n.func.attr in RAISERS:
                        events.append(("revert", n.lineno, "self." + n.func.attr))
                    if n.func.attr in WRITERS:
                        events.append(("write", n.lineno, "self." + n.func.attr + "()"))
                elif isinstance(n, (ast.Assign, ast.AugAssign, ast.Delete)):
                    targets = n.targets if isinstance(n, (ast.Assign, ast.Delete)) else [n.target]
                    for t in targets:
                        if isinstance(t, (ast.Attribute, ast.Subscript)) and root(t) in aliases:
                            events.append(("write", n.lineno, ast.unparse(t)))
            if isinstance(s, ast.If):
                visit_expr(s.test); visit(s.body); visit(s.orelse)
            elif isinstance(s, (ast.For, ast.While)):
                visit(s.body); visit(s.orelse)
            elif isinstance(s, ast.Try):
                visit(s.body)
                for h in s.handlers: visit(h.body)
                visit(s.orelse); visit(s.finalbody)
            elif isinstance(s, ast.With):
                visit(s.body)
    def visit_expr(e):
        for n in ast.walk(e):
            if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute) and isinstance(n.func.value, ast.Name) and n.func.value.id == "self" and n.func.attr in RAISERS:
                events.append(("revert", n.lineno, "self." + n.func.attr))
    visit(f.body)
    events.sort(key=lambda e: e[1])
    first_write = next((e for e in events if e[0] == "write"), None)
    late = [e for e in events if e[0] == "revert" and first_write and e[1] > first_write[1]]
    return events, first_write, late

bad = 0
print(f"{'method':16} {'first write':40} {'last revert before it':28} result")
for f in cls.body:
    if isinstance(f, ast.FunctionDef) and is_write_method(f):
        events, fw, late = scan(f)
        reverts = [e for e in events if e[0] == "revert"]
        lr = max((e for e in reverts if not fw or e[1] < fw[1]), key=lambda e: e[1], default=None)
        ok = not late
        bad += 0 if ok else 1
        print(f"{f.name:16} {('L%d %s' % (fw[1], fw[2]))[:40] if fw else '-':40} {('L%d %s' % (lr[1], lr[2]))[:28] if lr else '-':28} {'PASS' if ok else 'FAIL ' + str(late)}")
sys.exit(1 if bad else 0)
