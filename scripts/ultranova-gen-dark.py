"""Generate Ultranova's dark mode as a mirror of the light (new UI) rules.

For every rule scoped to :root[data-theme="light"] a dark twin is inserted right after it (same declarations,
colors mapped). For unscoped rules in the new-UI sections, a dark twin with only the color declarations is added.
Generated rules start with /*dk*/ so the script can be re-run (it removes the previous ones first).
"""
import re, sys

GREY_MAP = {
    '#ffffff': '#1c1c1b', '#fff': '#1c1c1b', 'white': '#1c1c1b',
    '#f7f7f5': '#252523', '#fafaf8': '#222220',
    '#f4f4f1': '#2a2a28', '#efefec': '#2a2a28', '#f1f1f4': '#2a2a28', '#f4f4f6': '#2a2a28', '#f3f3f6': '#252523',
    '#e8e8e5': '#2c2c29', '#ececea': '#30302d', '#e6e6eb': '#30302d', '#e2e2e8': '#30302d', '#e0e1e6': '#30302d', '#e0e0dc': '#30302d', '#ececf0': '#30302d',
    '#deded9': '#3a3a36', '#d9d9d5': '#3a3a36', '#d9d9e0': '#3a3a36', '#d3d4d0': '#3a3a36', '#d3d4d9': '#3a3a36', '#dcdce2': '#3a3a36',
    '#cfcfd8': '#3a3a36', '#c9c9d2': '#3a3a36', '#d4d4dc': '#3a3a36', '#c9c9c4': '#4a4a45',
    '#9f9f99': '#7d7d77', '#9a98a5': '#7d7d77',
    '#3d3d3a': '#c9c9c3',
    '#7b7b79': '#a5a59f', '#6b6976': '#a5a59f', '#4a4855': '#c9c9c3',
    '#33332f': '#e0e0da', '#2b2933': '#e0e0da',
    '#1a1a1a': '#f2f2ee', '#15131c': '#f2f2ee', '#1a0b46': '#f2f2ee', '#000': '#f2f2ee', '#101113': '#f2f2ee',
    '#5b2fc9': '#b9a0ff', '#cfc5ff': '#4b3d7d', '#e6e3ff': '#2e2842', '#7c3aed': '#a98bff',
    '#e03131': '#ff6b6b', '#c27c00': '#e0a336', '#a85d00': '#f0b44a',
    '#fff5f5': '#3a1d1d', '#fff9db': '#3a3019', '#00b894': '#f2f2ee',
}
HEX = re.compile(r'#[0-9a-fA-F]{3,8}\b|\bwhite\b')
RGBA = re.compile(r'rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)')

def map_rgba(m):
    r, g, b, a = int(m.group(1)), int(m.group(2)), int(m.group(3)), float(m.group(4))
    if (r, g, b) == (255, 255, 255): return f'rgba(28, 28, 27, {a})'
    if (r, g, b) in ((26, 26, 26), (21, 19, 28), (60, 60, 56), (0, 0, 0)): return f'rgba(0, 0, 0, {min(1, round(a * 2.2, 2))})'
    if (r, g, b) == (26, 11, 70): return f'rgba(242, 242, 238, {a})'
    return m.group(0)

def map_colors(body):
    body = RGBA.sub(map_rgba, body)
    return HEX.sub(lambda m: GREY_MAP.get(m.group(0).lower(), m.group(0)), body).replace('color-scheme: light', 'color-scheme: dark')

def has_mapped_color(val):
    return any(c.lower() in GREY_MAP for c in HEX.findall(val)) or any(map_rgba(m) != m.group(0) for m in RGBA.finditer(val))

def split_selectors(sel):
    parts, depth, cur = [], 0, ''
    for ch in sel:
        if ch == '(': depth += 1
        if ch == ')': depth -= 1
        if ch == ',' and depth == 0: parts.append(cur); cur = ''
        else: cur += ch
    parts.append(cur)
    return parts

def process(css, marker=None):
    css = re.sub(r'\n?[ \t]*/\*dk\*/.*?/\*/dk\*/', '', css)   # drop previous generated rules (they sit between /*dk*/ and /*/dk*/)
    unscoped_from = css.index(marker) if marker else None   # measured after the old twins are gone
    out, pos = [], 0
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
        sel_raw, body = m.group(1), m.group(2)
        lead = re.match(r'(\s*(?:/\*.*?\*/\s*)*)', sel_raw, re.S).group(1)
        sel = sel_raw[len(lead):].strip()
        if not sel or sel.startswith('@') or re.match(r'^(from|to|\d+%)', sel): continue
        twin = None
        parts = [p.strip() for p in split_selectors(sel)]
        light = [p for p in parts if 'data-theme="light"]' in p and ':not([data-theme="light"])' not in p]
        if light:
            dsel = ', '.join(p.replace('data-theme="light"]', 'data-theme="dark"]') for p in light)
            twin = dsel + ' { ' + ' '.join(map_colors(body).split()) + ' }'
        elif unscoped_from is not None and m.start() > unscoped_from and 'data-theme' not in sel and has_mapped_color(body):
            decls = [d.strip() for d in body.split(';') if d.strip() and ':' in d]
            col = [d for d in decls if has_mapped_color(d.split(':', 1)[1])]
            if col:
                dsel = ', '.join(':root[data-theme="dark"] ' + p for p in parts)
                twin = dsel + ' { ' + '; '.join(map_colors(d) for d in col) + '; }'
        if twin:
            out.append(css[pos:m.end()]); out.append('\n  /*dk*/ ' + twin + ' /*/dk*/'); pos = m.end()
    out.append(css[pos:])
    return ''.join(out)

def run_html(path, marker):
    s = open(path).read()
    a = s.index('<style>') + len('<style>'); b = s.index('</style>', a)
    style = s[a:b]
    s = s[:a] + process(style, marker) + s[b:]
    open(path, 'w').write(s)

def run_css(path, marker):
    s = open(path).read()
    open(path, 'w').write(process(s, marker))

base = sys.argv[1] if len(sys.argv) > 1 else 'public/ultranova'   # run from the repo root: python3 scripts/ultranova-gen-dark.py
run_html(base + '/home.html', '/* ---------- new UI (Figma "new ui"')
run_html(base + '/onboarding.html', '/* ---------- new UI (Figma "new ui"')
run_css(base + '/ultranova.css', '/* ---------- conversation cards')
print('done')
