"""Gate check: the rulebooks agree with the app.

1. data/rules.json is a fresh export of the app's models.
2. Prose numbers that aren't generated (worked examples, formulas) match the export.
3. No unexpanded tokens, unresolved page numbers or broken internal links.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT.parent / 'patch-system'
fails, passes = [], 0


def ok(cond, msg):
    global passes
    if cond:
        passes += 1
    else:
        fails.append(msg)


tsx = sys.argv[1] if len(sys.argv) > 1 else 'npx tsx'
fresh = subprocess.run(f'{tsx} scripts/export-rules.ts', shell=True, cwd=APP, capture_output=True, text=True)
ok(fresh.returncode == 0, f'export failed: {fresh.stderr[-400:]}')
D = json.loads((ROOT / 'data' / 'rules.json').read_text())
if fresh.returncode == 0:
    ok(json.loads(fresh.stdout) == D, 'data/rules.json is stale: re-run the export')

hb = BeautifulSoup((ROOT / 'build' / 'handbook-pass2.html').read_text(), 'html.parser')
txt = re.sub(r'\s+', ' ', hb.get_text(' ', strip=True))
r = D['rook']
ok(f"Hardware Integrity 5 + 15 = {r['hardware']}" in txt, 'Rook hardware')
ok(f"Overshield 16 + 8 + 2 = {r['overshield']}" in txt, 'Rook overshield')
ok(f"AP 1 + 2 = {r['ap']}" in txt, 'Rook AP')
ok(f"Defense 10 + 4 + 1 (Thick Hide Tunic) = {r['defense']}" in txt, 'Rook defense')
ok(f"{r['fragments']} Data Fragments" in txt and f"= {r['engagement']}" in txt and f"= {r['viewers']}" in txt, 'Rook broadcast')
c = D['constants']
ok(f"from {c['overshieldRange'][0]} to {c['overshieldRange'][1]}" in txt, 'overshield range')
ok(f"You start with {c['startingAdvancementPoints']}" in txt, 'starting AdvP')
ok(f"skill rank one rank" not in txt, 'typo')
ok(all(f"Tactical blueprints need {c['engagementGates']['tactical']}" in txt for _ in [0]), 'tactical gate')
ok(f"Apex blueprints {c['engagementGates']['apex']}" in txt, 'apex gate')
ok([s['target'] for s in c['ladder']] == [10, 15, 20, 25, 30], 'ladder')

for book in ('handbook', 'gm', 'bestiary', 'quickref'):
    h = (ROOT / 'build' / f'{book}-pass2.html').read_text()
    ok('{{' not in h, f'{book}: unexpanded token')
    ok(not re.search(r'>\s*00\s*<|p\. 00\b', h), f'{book}: unresolved page number')
    s = BeautifulSoup(h, 'html.parser')
    ids = {e['id'] for e in s.select('[id]')}
    bad = [a['href'] for a in s.select('a[href^="#"]') if a['href'][1:] not in ids]
    ok(not bad, f'{book}: broken links {bad[:5]}')

print(f'{passes} passed, {len(fails)} failed')
print('\n'.join(fails))
sys.exit(1 if fails else 0)
