"""Build the P.A.T.C.H. rulebook PDFs.

Two Chromium passes per book: pass 1 carries invisible @@id@@ markers so we can
read back which page every heading landed on; pass 2 fills the table of
contents and page cross-references. Then page footers are stamped and PDF
bookmarks are added.
"""
import io
import re
import subprocess
import sys
from pathlib import Path

import logging
import pdfplumber
logging.getLogger('pdfminer').setLevel(logging.ERROR)
import gen  # noqa: E402
from bs4 import BeautifulSoup
from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).parent
SRC = ROOT / 'src'
OUT = ROOT / 'out'
BUILD = ROOT / 'build'
OUT.mkdir(exist_ok=True)
BUILD.mkdir(exist_ok=True)

pdfmetrics.registerFont(TTFont('Mono', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
pdfmetrics.registerFont(TTFont('MonoB', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'))

BOOKS = {
    'handbook': ('PATCH-Operators-Handbook.pdf', "P.A.T.C.H. Operator's Handbook", "OPERATOR'S HANDBOOK"),
    'gm': ('PATCH-Game-Masters-Guide.pdf', "P.A.T.C.H. Game Master's Guide", "GAME MASTER'S GUIDE"),
    'bestiary': ('PATCH-Arena-Bestiary.pdf', 'P.A.T.C.H. Arena Bestiary', 'ARENA BESTIARY'),
    'quickref': ('PATCH-Quick-Reference-and-Record-Sheet.pdf', 'P.A.T.C.H. Quick Reference & Operator Record', 'QUICK REFERENCE'),
}

W, H = 612, 792

INDEX_TERMS = ['Acrobatics', 'Advancement Points', 'Advantage', 'Apex', 'Archetype', 'Armor', 'Athletics', 'Blueprint', 'Brute', 'CLOUT', 'Condo Hour', 'Condo Phase', 'Conditions', 'Contested', 'Counter', 'Cover', 'Crash save', 'Damage reduction', 'DATA', 'Dash', 'Data Fragments', 'Defense', 'Destructive installation', 'Disadvantage', 'Engagement', 'Field Radio', 'Flair', 'Flatlined', 'Foundation', 'Fried', 'Ghost', 'Glitched', 'Glitcher', 'Going dark', 'Grapple', 'Hacking', 'Hardened', 'Hardpoint', 'HARDWARE', 'Hardware Integrity', 'Help', 'Hide', 'Highlight', 'Initiative', 'Inmate', 'Lagged', 'Marked', 'Market', 'Medicine', 'Multi-Tool', 'Neural Shock', 'Off-Worlder', 'On air', 'Overshield', 'Patch Up', 'Payout', 'Permadeath', 'PING', 'Pinned', 'POWER', 'Prime-Time', 'Prone', 'Range', 'Reaction', 'Reboot Shield', 'Rook', 'Save', 'Shortfall', 'Signal Jammer', 'Skill', 'Specialist', 'Spectacle', 'Sponsor drop', 'Sponsor-grade', 'Stabilize', 'Staggered', 'Stealth', 'Stunned', 'Sub-skill', 'Surprised', 'SYSTEM', 'Tactical', 'Target', 'Trading', 'Viewers', 'Volunteer']


CASE_SENSITIVE = {'Marked', 'Pinned', 'Prone', 'Stunned', 'Staggered', 'Lagged', 'Glitched', 'Fried', 'Surprised', 'Hide', 'Help', 'Dash', 'Range', 'Target', 'Counter', 'Cover'}


def page_ranges(ps):
    ps = sorted(set(ps)); out = []; i = 0
    while i < len(ps):
        j = i
        while j + 1 < len(ps) and ps[j + 1] == ps[j] + 1:
            j += 1
        out.append(f'{ps[i]}' if i == j else f'{ps[i]}–{ps[j]}'); i = j + 1
    return ', '.join(out)


def build_index(pdf, pages, bleed):
    texts = subprocess.run(['pdftotext', str(pdf), '-'], capture_output=True, text=True).stdout.split('\f') if pdf else []
    first_body = pages.get('ch-intro', 1)
    stop = pages.get('index', 10 ** 6)
    rows = []
    for t in INDEX_TERMS:
        rx = re.compile(r'(?<![\w-])' + r'\s+'.join(map(re.escape, t.split())) + r's?(?![\w-])', 0 if (t.isupper() or t in CASE_SENSITIVE) else re.I)
        counts = []
        for i, tx in enumerate(texts, start=1):
            if first_body <= i < stop and i not in bleed:
                tx2 = re.sub(r'Thick\s+Hide|Hide\s+Tunic', '', tx) if t == 'Hide' else tx
                n = len(rx.findall(tx2))
                if n:
                    counts.append((n, i))
        top = sorted(i for n, i in sorted(counts, reverse=True)[:8])
        pg = page_ranges(top) if top else '00'
        rows.append(f'<div class="ix"><b>{t}</b> <span>{pg}</span></div>')
    return ''.join(rows)


def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')[:48]


def assemble(key):
    parts = sorted((SRC / key).glob('*.html'))
    body = gen.expand('\n'.join(p.read_text() for p in parts))
    css = (SRC / 'book.css').read_text()
    title = BOOKS[key][1]
    return f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{title}</title><style>{css}</style></head><body>{body}</body></html>'


def prepare(html):
    soup = BeautifulSoup(html, 'html.parser')
    for op in soup.select('.opener'):
        op['class'] = [c for c in op['class'] if c != 'bleed']
    used = set()
    heads = []  # (id, level, text, num)
    for el in soup.select('.opener h1, h2, h3, [data-mk]'):
        if not el.get('id'):
            base = slug(el.get('data-label') or el.get_text(' ', strip=True)) or 'x'
            cand, i = base, 2
            while cand in used:
                cand, i = f'{base}-{i}', i + 1
            el['id'] = cand
        used.add(el['id'])
        level = 1 if el.name == 'h1' else 2 if el.name == 'h2' else 3
        if el.has_attr('data-mk') and el.name not in ('h2', 'h3'):
            level = 4
        label = el.get('data-label') or ' '.join(t for t in el.find_all(string=True) if not (t.parent.get('class') and 'draft-tag' in t.parent.get('class'))).strip()
        label = re.sub(r'\s+', ' ', label)
        heads.append((el['id'], level, label, el.get('data-num', ''), 'notoc' in (el.get('class') or [])))
        mk = soup.new_tag('span', attrs={'class': 'mk'})
        mk.string = '@@MK@@'  # placeholder text swapped per pass
        mk['data-for'] = el['id']
        el.insert(0, mk)
    for t in soup.select('table.wide'):
        sib = t
        for _ in range(3):
            sib = sib.find_previous_sibling()
            if sib is None or sib.name == 'table':
                break
            if sib.name == 'h2':
                sib['class'] = (sib.get('class') or []) + ['span']
                break
    for h in soup.select('.flow h2, .flow h3'):
        nxt = h.find_next_sibling()
        if nxt is None or 'span' in (h.get('class') or []):
            continue
        nn = nxt.find_next_sibling()
        if nxt.name == 'p' and nn is not None and nn.name == 'table' and 'wide' not in (nn.get('class') or []) and len(nn.select('tr')) <= 16 and len(nxt.get_text()) < 400:
            wrap = soup.new_tag('div', attrs={'class': 'keep'})
            h.insert_before(wrap)
            for el in (h, nxt, nn):
                wrap.append(el.extract())
            continue
        if (nxt.name == 'table' and 'wide' not in (nxt.get('class') or []) and len(nxt.select('tr')) <= 16) or (nxt.name == 'div' and set(nxt.get('class') or []) & {'box', 'term'}) or (nxt.name == 'ol' and 'steps' in (nxt.get('class') or [])):
            wrap = soup.new_tag('div', attrs={'class': 'keep'})
            h.insert_before(wrap)
            wrap.append(h.extract())
            wrap.append(nxt.extract())
    for t in soup.select('table'):
        if len(t.select('tr')) <= 16:
            t['class'] = (t.get('class') or []) + ['nobreak']
    drafts = []
    for tag in soup.select('.draft-tag'):
        h = tag.find_parent(['h2', 'h3']) or tag.find_previous(['h2', 'h3'])
        if h is not None and h.get('id') and h['id'] not in ('contents', 'playtest-register', 'gm-playtest-register') and h['id'] not in [d[0] for d in drafts]:
            drafts.append((h['id'], h.get('data-label') or h.get_text(' ', strip=True).replace('PLAYTEST', '').replace('@@MK@@', '').strip()))
    soup.drafts = drafts
    for i, b in enumerate(soup.select('.bleed')):
        mk = soup.new_tag('span', attrs={'class': 'mk', 'data-for': f'bleed{i}'})
        mk.string = '@@MK@@'
        b.insert(0, mk)
    return soup, heads


def render(soup, pages, heads, marked):
    s = BeautifulSoup(str(soup), 'html.parser')
    for mk in s.select('span.mk'):
        mk.string = f"@@{mk['data-for']}@@" if marked else ''
    html = str(s)

    def pg(m):
        return str(pages.get(m.group(1), '00'))

    html = re.sub(r'\{\{pg:([\w-]+)\}\}', pg, html)
    drafts = getattr(soup, 'drafts', [])
    rows = ''.join(f'<li><a href="#{i}">{lbl}</a><span class="dots"></span><span class="pg">{pages.get(i, "00")}</span></li>' for i, lbl in drafts)
    html = html.replace('{{DRAFTS}}', f'<ul class="reg">{rows}</ul>')
    toc = build_toc(heads, pages)
    html = html.replace('{{TOC}}', toc)
    html = html.replace('{{INDEX}}', getattr(soup, 'index_html', '') or build_index(None, {}, set()))
    return html


def build_toc(heads, pages):
    rows = []
    for hid, level, label, num, notoc in heads:
        if notoc or level > 2:
            continue
        p = pages.get(hid, '00')
        if level == 1:
            rows.append(f'<li class="c"><span class="cn">{num}</span><a href="#{hid}">{label}</a><span class="dots"></span><span class="pg">{p}</span></li>')
        else:
            rows.append(f'<li class="s"><a href="#{hid}">{label}</a><span class="dots"></span><span class="pg">{p}</span></li>')
    return '<ol>' + '\n'.join(rows) + '</ol>'


def chromium(html, pdf):
    hp = BUILD / (pdf.stem + '.html')
    hp.write_text(html)
    subprocess.run(['node', str(ROOT / 'print.js'), str(hp), str(pdf)], check=True)


def map_pages(pdf):
    pages, bleed = {}, set()
    text = subprocess.run(['pdftotext', '-raw', str(pdf), '-'], capture_output=True, text=True).stdout.split('\f')
    with pdfplumber.open(pdf) as doc:
        text2 = [''.join(c['text'] for c in page.chars) for page in doc.pages]
    for i, ptext in enumerate((a + '\n' + b for a, b in zip(text, text2)), start=1):
        for m in re.finditer(r'@@([\w-]+)@@', ptext):
            k = m.group(1).lower()
            if k.startswith('bleed'):
                bleed.add(i)
            else:
                pages.setdefault(k, i)
    return pages, bleed


def stamp(pdf_in, pdf_out, bleed, heads, pages, running, title):
    reader = PdfReader(pdf_in)
    chapters = sorted((pages[h[0]], h[2]) for h in heads if h[1] == 1 and h[0] in pages)
    writer = PdfWriter()
    for i, page in enumerate(reader.pages, start=1):
        if i not in bleed:
            chap = ''
            for p, name in chapters:
                if p <= i:
                    chap = name
            buf = io.BytesIO()
            c = canvas.Canvas(buf, pagesize=(W, H))
            c.setStrokeColor(HexColor('#c9c3b6'))
            c.setLineWidth(0.6)
            c.line(43, 40, W - 43, 40)
            c.setFillColor(HexColor('#00796b'))
            c.setFont('MonoB', 8.5)
            left = f'P.A.T.C.H. // {running}'
            right = chap.upper()
            if i % 2 == 0:
                c.drawString(43, 27, str(i))
                c.setFillColor(HexColor('#6a7183'))
                c.setFont('Mono', 6.8)
                c.drawRightString(W - 43, 27, left)
            else:
                c.drawRightString(W - 43, 27, str(i))
                c.setFillColor(HexColor('#6a7183'))
                c.setFont('Mono', 6.8)
                c.drawString(43, 27, right or left)
            c.save()
            buf.seek(0)
            page.merge_page(PdfReader(buf).pages[0])
        writer.add_page(page)
    parents = {}
    for hid, level, label, num, notoc in heads:
        if hid not in pages or notoc or level == 3:
            continue
        idx = pages[hid] - 1
        if level == 1:
            parents = {1: writer.add_outline_item(f'{num}  {label}'.strip(), idx)}
        elif level == 2:
            parents[2] = writer.add_outline_item(label, idx, parent=parents.get(1))
        else:
            writer.add_outline_item(label, idx, parent=parents.get(2) or parents.get(1))
    writer.add_metadata({'/Title': title, '/Author': 'James Carpenter', '/Subject': 'P.A.T.C.H. tabletop RPG rules', '/Creator': 'P.A.T.C.H. rulebook build'})
    writer.page_mode = '/UseOutlines'
    with open(pdf_out, 'wb') as f:
        writer.write(f)


def build(key):
    fname, title, running = BOOKS[key]
    soup, heads = prepare(assemble(key))
    p1 = BUILD / f'{key}-pass1.pdf'
    for attempt in range(4):
        chromium(render(soup, {}, heads, True), p1)
        pages, bleed = map_pages(p1)
        fixed = 0
        for k, (hid, level, *_r) in enumerate(heads):
            if level != 1 or hid not in pages:
                continue
            nxt = next((h for h in heads[k + 1:] if h[1] >= 2 and h[0] in pages), None)
            if nxt and pages[nxt[0]] > pages[hid]:
                op = soup.find(id=hid).find_parent(class_='opener')
                if op is not None and 'pb' not in op['class']:
                    op['class'] = op['class'] + ['pb']
                    fixed += 1
        if not fixed:
            break
        print(f'  {key}: moved {fixed} stranded banner(s) to a new page')
    soup.index_html = build_index(p1, pages, bleed)
    missing = [h[0] for h in heads if h[0] not in pages]
    p2 = BUILD / f'{key}-pass2.pdf'
    chromium(render(soup, pages, heads, False), p2)
    n1, n2 = len(PdfReader(p1).pages), len(PdfReader(p2).pages)
    stamp(p2, OUT / fname, bleed, heads, pages, running, title)
    print(f'{key}: {n2} pages (pass1 {n1}); headings {len(heads)}; unmapped {missing[:8]}')
    return pages


if __name__ == '__main__':
    for k in (sys.argv[1:] or BOOKS.keys()):
        build(k)
