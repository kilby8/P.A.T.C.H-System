"""Generated content for the rulebooks.

Every rules table here comes from data/rules.json, which
patch-system/scripts/export-rules.ts writes from the app's own models.
Change a rule in the app, re-export, rebuild, and the books follow.
"""
import html
import json
from pathlib import Path

ROOT = Path(__file__).parent
DATA = json.loads((ROOT / 'data' / 'rules.json').read_text())
E = html.escape

# ---------------------------------------------------------------- dice odds


def dist(n):
    d = {0: 1.0}
    for _ in range(n):
        nd = {}
        for s, p in d.items():
            for f in range(1, 7):
                nd[s + f] = nd.get(s + f, 0) + p / 6
        d = nd
    return d


def p_at_least(n, t, bonus=0):
    return sum(p for s, p in dist(n).items() if s + bonus >= t)


def cell(v):
    txt = '–' if v < 0.5 else ('100' if v >= 99.95 else ('99+' if v > 99.4 else f'{v:.0f}'))
    cls = 'n hot' if 45 <= v <= 75 else 'n warm' if 25 <= v < 45 or 75 < v <= 90 else 'n'
    return f'<td class="{cls}">{txt}</td>'


def odds_rows(targets=(10, 13, 15, 17, 18, 20, 25, 30)):
    return '\n'.join(f'<tr><td class="n"><b>{n}d6</b></td>' + ''.join(cell(p_at_least(n, t) * 100) for t in targets) + '</tr>' for n in range(1, 11))


def mobhit_rows():
    rows = []
    for name, t in DATA['tiers'].items():
        atk = f"{t['attackDice']}d6" + (f"+{t['attackBonus']}" if t['attackBonus'] else '')
        rows.append(f'<tr><td><b>{name}</b> ({atk})</td>' + ''.join(cell(p_at_least(t['attackDice'], d, t['attackBonus']) * 100) for d in range(13, 19)) + '</tr>')
    return '\n'.join(rows)


def ophit_rows():
    defs = [t['defense'] for t in DATA['tiers'].values()]
    return '\n'.join(f'<tr><td class="n"><b>{n}d6</b></td>' + ''.join(cell(p_at_least(n, d) * 100) for d in defs) + '</tr>' for n in range(3, 9))


def ophit_head():
    return ''.join(f'<th class="n">{name} {t["defense"]}</th>' for name, t in DATA['tiers'].items())


def tier_rows(full=True):
    rows = []
    for name, t in DATA['tiers'].items():
        atk = f"{t['attackDice']}d6" + (f"+{t['attackBonus']}" if t['attackBonus'] else '')
        if full:
            rows.append(f'<tr><td><b>{name}</b></td><td class="n">{t["integrity"]}</td><td class="n">{t["ap"]}</td><td class="n">{t["init"]}</td><td class="n">{t["defense"]}</td><td class="n">{atk}</td><td class="n">{t["damage"]}</td><td class="n">{t["saveTarget"]}</td><td class="n">{t["saveDice"]}d6</td><td class="n">{t["threat"]}</td></tr>')
        else:
            rows.append(f'<tr><td>{name}</td><td class="n">{t["integrity"]}</td><td class="n">{t["defense"]}</td><td class="n">{atk}</td><td class="n">{t["damage"]}</td><td class="n">{t["saveTarget"]}</td><td class="n">{t["threat"]}</td></tr>')
    return '\n'.join(rows)


# ---------------------------------------------------------------- character tables

SKILL_NAME = {s['id']: s['name'] for s in DATA['skills']}


def skills_table():
    return '\n'.join(f'<tr><td><b>{E(s["name"])}</b></td><td>{s["attribute"]}</td><td>{E(s["use"])}</td></tr>' for s in DATA['skills'])


def save_skills_table():
    rows = []
    for attr, ids in DATA['saveSkills'].items():
        rows.append(f'<tr><td>{attr}</td><td>{" or ".join(SKILL_NAME[i] for i in ids)}</td></tr>')
    return '\n'.join(rows)


def derived_table():
    d = DATA['derived']
    sign = lambda v: f'+{v}' if v > 0 else ('+0' if v == 0 else f'−{-v}')
    return (
        '<tr><td><b>Bonus</b> (attr − 3)</td>' + ''.join(f'<td class="n">{sign(r["bonus"])}</td>' for r in d) + '</tr>'
        '<tr><td><b>Hardware Integrity</b> (HARDWARE)</td>' + ''.join(f'<td class="n">{r["hardware"]}</td>' for r in d) + '</tr>'
        '<tr><td><b>…Inmate (Hardened)</b></td>' + ''.join(f'<td class="n">{r["hardwareInmate"]}</td>' for r in d) + '</tr>'
        '<tr><td><b>AP</b> (SYSTEM)</td>' + ''.join(f'<td class="n">{r["ap"]}</td>' for r in d) + '</tr>'
    )


ORIGIN_SHORT = {'inmate': 'Inmate', 'volunteer': 'Volunteer', 'glitcher': 'Glitcher', 'offworlder': 'Off-Worlder'}


def broadcast_table():
    rows = []
    for o in DATA['broadcast']:
        cells = ''.join(f'<td class="n">{c["engagement"]} / {c["viewers"]}</td>' for c in o['byClout'])
        rows.append(f'<tr><td>{ORIGIN_SHORT[o["origin"]]}</td>{cells}</tr>')
    return '\n'.join(rows)


def backgrounds_html():
    out = []
    labels = {'inmate': ('bg-inmate', 'Inmate Block backgrounds'), 'volunteer': ('bg-volunteer', 'Volunteer backgrounds'), 'glitcher': ('bg-glitcher', 'Glitcher backgrounds')}
    cat = None
    for b in DATA['backgrounds']:
        if b['category'] != cat:
            cat = b['category']
            hid, label = labels[cat]
            out.append(f'<h3 id="{hid}">{label}</h3>')
            if cat == 'glitcher':
                out.append('<p class="small">Glitchers roll their support item (Data Anomalies), so their loadout shows <i>rolled</i> in that slot.</p>')
        loadout = list(b['loadout'])
        if cat == 'glitcher':
            loadout[2] = 'rolled'
        skills = ', '.join(SKILL_NAME[s] for s in b['skills'])
        out.append(
            f'<div class="bg"><div class="hd">{E(b["name"])} <span>{b["focus"]}</span></div>'
            f'<p>{E(b["flavor"])}</p>'
            f'<p class="kv"><b>Skills</b> {skills} · <b>Loadout</b> {", ".join(loadout)} · <b>Blueprints</b> {", ".join(b["blueprints"])}</p>'
            f'<p class="kv muted">{E(" ".join(b["notes"]))}</p></div>')
    return '\n'.join(out)


# ---------------------------------------------------------------- gear

GEAR = {g['id']: g for g in DATA['gear']}
TIER_LETTER = {'foundation': 'F', 'tactical': 'T', 'apex': 'A'}
ATTR_SHORT = {'POWER': 'POWER', 'PING': 'PING', 'HARDWARE': 'HARDWARE', 'DATA': 'DATA'}


def weapons_table():
    rows = []
    for g in DATA['gear']:
        if g['category'] != 'offensive':
            continue
        r = g['rules']
        rows.append(f'<tr><td><b>{E(g["name"])}</b></td><td>{TIER_LETTER[g["theme"]]}</td><td>{r["attribute"]} + {SKILL_NAME[r["skill"]]}</td><td>{r["damage"]} + {r["attribute"]} {r["damageType"]}</td><td>{E(r["range"])}</td><td>{E(r["feature"])}</td></tr>')
    rows.append('<tr><td><b>Unarmed</b></td><td>–</td><td>POWER + Melee</td><td>1d4 + POWER blunt</td><td>Melee</td><td>Fists, elbows, headbutts.</td></tr>')
    return '\n'.join(rows)


def armor_table():
    rows = []
    for g in DATA['gear']:
        if g['category'] != 'defensive':
            continue
        r = g['rules']
        rows.append(f'<tr><td><b>{E(g["name"])}</b></td><td>{TIER_LETTER[g["theme"]]}</td><td class="n">+{r["defenseBonus"]}</td><td>{r["counter"]} + HDW</td><td>{E(r["feature"])}</td></tr>')
    return '\n'.join(rows)


def support_table():
    rows = []
    for g in DATA['gear']:
        if g['category'] != 'support':
            continue
        r = g['rules']
        rows.append(f'<tr><td><b>{E(g["name"])}</b></td><td>{TIER_LETTER[g["theme"]]}</td><td>DATA + Hacking, {r["damage"]} + DATA {r["damageType"]}, {E(r["range"])}</td><td>{E(r["feature"])}</td></tr>')
    return '\n'.join(rows)


SLOT = {'offensive': 'Off.', 'defensive': 'Def.', 'support': 'Sup.'}


def bp_standard():
    return '\n'.join(
        f'<tr><td><b>{E(b["name"])}</b></td><td>{SLOT[b["compatibleCategories"][0]]}</td><td>{TIER_LETTER[b["theme"]]} · {b["price"]}</td><td>{E(b["rules"])}</td></tr>'
        for b in DATA['blueprints'] if b['dropRule'] == 'standard' and not b.get('sponsorGrade'))


def bp_named():
    out = []
    for b in DATA['blueprints']:
        if b['dropRule'] == 'standard':
            continue
        lock = ' · '.join(str(x) for x in b.get('sectorLocks', []))
        extra = ' · unique' if b.get('uniqueDrop') else ''
        out.append(f'<tr><td><b>{E(b["name"])}</b></td><td>{SLOT[b["compatibleCategories"][0]]}</td><td>{TIER_LETTER[b["theme"]]} · {lock}{extra}</td><td>{E(b["rules"])}</td></tr>')
    return '\n'.join(out)


def bp_sponsor():
    return '\n'.join(
        f'<tr><td><b>{E(b["name"])}</b></td><td>{SLOT[b["compatibleCategories"][0]]}</td><td>{TIER_LETTER[b["theme"]]}</td><td>{E(b["rules"])}</td><td>{E(b.get("streamTrait", ""))}</td></tr>'
        for b in DATA['blueprints'] if b.get('sponsorGrade'))


def qr_blueprints():
    return '\n'.join(
        f'<tr><td>{E(b["name"])}</td><td>{SLOT[b["compatibleCategories"][0]]}</td><td>{TIER_LETTER[b["theme"]]}</td><td>{E(b["rules"])}</td></tr>'
        for b in DATA['blueprints'] if b['dropRule'] == 'standard' and not b.get('sponsorGrade'))


# ---------------------------------------------------------------- conditions

def conditions_html():
    out = ['<h3 id="cond-flatlined" data-mk>Flatlined</h3><p>At 0 Hardware Integrity. No AP, no actions, crash saves each turn. See <a class="ref" href="#flatlined">p. {{pg:flatlined}}</a>.</p>']
    rows = list(DATA['conditions'])
    rows.append({'id': 'neural-shock', 'name': 'Neural Shock', 'text': 'Hardware below 50% of max (35% with Redundant Systems): gain 1 less AP each turn. Ends when Hardware is back above the threshold.'})
    for c in sorted(rows, key=lambda c: c['name']):
        shake = f' <b>Shake it off:</b> {E(c["shakeOff"])}.' if c.get('shakeOff') else ''
        out.append(f'<h3 id="cond-{c["id"]}" data-mk>{E(c["name"])}</h3><p>{E(c["text"])}{shake}</p>')
    return '\n'.join(out)


# ---------------------------------------------------------------- archetype nodes

ZONE_LABEL = {
    'BRUTE': 'Brute Nodes', 'GHOST': 'Ghost Nodes', 'SPECIALIST': 'Specialist Nodes',
    'BRUTE_GHOST': 'Brute ∩ Ghost', 'BRUTE_SPECIALIST': 'Brute ∩ Specialist', 'GHOST_SPECIALIST': 'Ghost ∩ Specialist',
}


def nodes_html():
    out, zone = [], None
    for n in DATA['nodes']:
        if n['zone'] != zone:
            zone = n['zone']
            out.append(f'<h3 id="zone-{zone.lower()}">{E(ZONE_LABEL[zone])}</h3>')
        subs = []
        for sk in n['subSkills']:
            nt = f' <i class="muted">Rules note: {E(sk["note"])}</i>' if sk.get('note') else ''
            subs.append(f'<p class="ss"><b>{E(sk["name"])}</b> <span class="cost">[{E(sk["use"])}]</span> {E(sk["description"])}{nt}</p>')
        prereq = '' if n['tier'] == 1 and n['zone'] in ('BRUTE', 'GHOST', 'SPECIALIST') else f'<div class="pre">{E(n["prerequisite"])}</div>'
        out.append(
            f'<div class="node" id="node-{n["id"].lower()}" data-mk data-label="{n["id"]} {E(n["name"])}"><div class="hd"><span>{n["id"]} · {E(n["name"])}</span><span class="t">TIER {n["tier"]}</span></div>'
            f'<div class="ds">{E(n["description"])}</div>{prereq}' + ''.join(subs) + '</div>')
    return '\n'.join(out)


# ---------------------------------------------------------------- bestiary

def stat_html(p):
    nm = f'<div class="nm" id="beast-{p["id"]}" data-mk data-label="#{p["id"]} {E(p["name"])}"><span>{E(p["name"])}</span><span class="id">#{p["id"]:02d}</span></div>'
    if p.get('sameAs'):
        return (f'<div class="stat">{nm}<div class="meta">{E(p["role"])} · {p["tier"]}</div>'
                f'<p>Uses the stat block of <b>#{p["sameAs"]:02d}</b>; the app lists it as a separate entry.</p><p class="look">{E(p["description"])}</p></div>')
    move = p['move'].split(' (')[0]
    ab = ''.join(f'<p><span class="ab">{E(a["name"])}.</span> {E(a["text"])}</p>' for a in p['abilities'])
    return (
        f'<div class="stat">{nm}<div class="meta">{E(p["role"])} · {p["tier"]} · {E(p["kind"])}</div>'
        f'<div class="bar"><div><span>INTEGRITY</span>{p["integrity"]}</div><div><span>AP</span>{p["ap"]}</div><div><span>DEFENSE</span>{p["defense"]}</div>'
        f'<div><span>INIT</span>{p["init"]}</div><div><span>MOVE</span>{E(move)}</div><div><span>THREAT</span>{p["threat"]}</div></div>'
        f'<p><span class="ab">Attack.</span> {p["attack"]} vs Defense, {p["damage"]} damage. Saves {p["saveDice"]}d6; its effects use save target {p["saveTarget"]}.</p>'
        f'{ab}<p><span class="ab">Tactics.</span> <i>{E(p["tactics"])}</i></p><p class="look">{E(p["description"])}</p></div>')


def blocks_html():
    return '\n'.join(stat_html(p) for p in DATA['bestiary'])


def index_rows(part):
    es = DATA['bestiary'][:25] if part == 0 else DATA['bestiary'][25:]
    return '\n'.join(
        f'<tr><td class="n">{p["id"]:02d}</td><td><a href="#beast-{p["id"]}"><b>{E(p["name"])}</b></a></td><td>{p["tier"]}</td><td class="n">{p["threat"]}</td><td class="n">{{{{pg:beast-{p["id"]}}}}}</td></tr>'
        for p in es)


# ---------------------------------------------------------------- GM tables

def loot_rows():
    rows = []
    for sec, row in DATA['sectorLoot'].items():
        f, t, a = row['foundation'], row['tactical'], row['apex']

        def rng(lo, n):
            return '–' if n == 0 else f'{lo:02d}–{lo + n - 1:02d}'.replace('100', '00')
        rows.append(f'<tr><td class="n"><b>{sec}</b></td><td class="n">{rng(1, f)}</td><td class="n">{rng(f + 1, t)}</td><td class="n">{rng(f + t + 1, a)}</td></tr>')
    return '\n'.join(rows)


def spectacle_rows():
    beast = {p['id']: p for p in DATA['bestiary']}
    rows = []
    for b in DATA['spectacle']:
        force = ', '.join(f'{beast[f["templateId"]]["name"]} ×{f["count"]}' for f in b['force'])
        threat = sum(beast[f['templateId']]['threat'] * f['count'] for f in b['force'])
        mods = ', '.join(b['modifiers']) or '–'
        lo, hi = b['scoreRange']
        rows.append(f'<tr><td class="n">{lo}–{hi}</td><td><b>{E(b["label"])}</b></td><td>{E(force)}</td><td>{E(mods)}</td><td class="n">{threat}</td></tr>')
    return '\n'.join(rows)


TOKENS = {
    '{{STATBLOCKS}}': blocks_html,
    '{{BEASTINDEX0}}': lambda: index_rows(0),
    '{{BEASTINDEX1}}': lambda: index_rows(1),
    '{{LOOT}}': loot_rows,
    '{{SPECTACLE}}': spectacle_rows,
    '{{MOBHIT}}': mobhit_rows,
    '{{OPHIT}}': ophit_rows,
    '{{OPHIT_HEAD}}': ophit_head,
    '{{TIERS_FULL}}': lambda: tier_rows(True),
    '{{TIERS_SHORT}}': lambda: tier_rows(False),
    '{{ODDS}}': odds_rows,
    '{{NODES}}': nodes_html,
    '{{SKILLS_TABLE}}': skills_table,
    '{{SAVE_SKILLS}}': save_skills_table,
    '{{DERIVED}}': derived_table,
    '{{BROADCAST}}': broadcast_table,
    '{{BACKGROUNDS}}': backgrounds_html,
    '{{WEAPONS}}': weapons_table,
    '{{ARMOR}}': armor_table,
    '{{SUPPORT}}': support_table,
    '{{BP_STANDARD}}': bp_standard,
    '{{BP_NAMED}}': bp_named,
    '{{BP_SPONSOR}}': bp_sponsor,
    '{{QR_BLUEPRINTS}}': qr_blueprints,
    '{{CONDITIONS}}': conditions_html,
}


def expand(text):
    for k, fn in TOKENS.items():
        if k in text:
            text = text.replace(k, fn())
    return text
