#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Añade Pokémon nuevos a la Pokédex del juego SIN rehacer los que ya están
(tools/fetch_pokedex.py rehace la lista entera desde SpriteCollab y PokeAPI, y
cambiaría números de Pokémon que la gente ya tiene).

    python tools/add_pokedex.py                 # los que tienen sprite (sprites-meta.js) y no datos
    python tools/add_pokedex.py 1025 893        # esos
    python tools/add_pokedex.py --comprobar     # sólo dice cuáles faltan, no escribe nada
    python tools/add_pokedex.py --nombres 1025  # sólo los nombres traducidos (los datos ya estaban)

Por cada uno, de PokeAPI (se guarda en tools/cache/add-pokedex.json; el juego no toca internet):
  - js/data/pokedex.js        su fila, con las mismas fórmulas que fetch_pokedex.py (one)
  - js/data/abilities.js      G.DEX_ABIL[dex] y, si es nueva, la habilidad en G.ABIL con sus
                              nombres [es, en, fr, it, zh-Hans, zh-Hant]
  - js/data/lang-fr.js        su nombre en francés, si no es igual que el nuestro
  - js/data/lang-zh-cn-names.js / lang-zh-hant-names.js   su nombre en chino

Hecho el 30-10-2026 para completar la Pokédex con los sprites de Pokémon Edición Reloaded
(tools/import_reloaded.py --faltan).
"""
import io
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_pokedex import API, get, one   # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'js', 'data')
POKEDEX = os.path.join(DATA, 'pokedex.js')
ABIL = os.path.join(DATA, 'abilities.js')
META = os.path.join(DATA, 'sprites-meta.js')
FR = os.path.join(DATA, 'lang-fr.js')
ZH = {'zh-hans': os.path.join(DATA, 'lang-zh-cn-names.js'), 'zh-hant': os.path.join(DATA, 'lang-zh-hant-names.js')}
CACHE = os.path.join(ROOT, 'tools', 'cache', 'add-pokedex.json')
LANGS = ['es', 'en', 'fr', 'it', 'zh-hans', 'zh-hant']


def read(p):
    with io.open(p, encoding='utf-8', newline='') as f:
        return f.read()


def write(p, s):
    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(s)


def nl(s):
    return '\r\n' if '\r\n' in s else '\n'


def have_data():
    return {int(m) for m in re.findall(r'\{"dex":(\d+),', read(POKEDEX))}


def have_sprite():
    return {int(m) for m in re.findall(r'^  (\d+): \{', read(META), re.M) if int(m) < 100000}


def names_of(obj):
    got = {n['language']['name']: n['name'] for n in obj.get('names', [])}
    return got


def fetch(dexes):
    cache = json.load(io.open(CACHE, encoding='utf-8')) if os.path.exists(CACHE) else {}
    for dex in dexes:
        k = str(dex)
        if k in cache:
            continue
        row = one(dex)
        p = get(f'{API}/pokemon/{dex}')
        s = get(f'{API}/pokemon-species/{dex}')
        if not row or not p or not s:
            sys.exit(f'PokeAPI no da el {dex}: prueba más tarde')
        abil = [0, 0, 0]
        for a in p['abilities']:
            i = 2 if a['is_hidden'] else a['slot'] - 1
            if 0 <= i < 3 and not abil[i]:
                abil[i] = a['ability']['name']
        cache[k] = {'row': row, 'abil': abil, 'names': names_of(s)}
        print(f'  {dex} {row["name"]}')
    abil_names = cache.setdefault('_abil', {})
    for dex in dexes:
        for a in cache[str(dex)]['abil']:
            if a and a not in abil_names:
                abil_names[a] = names_of(get(f'{API}/ability/{a}') or {})
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    with io.open(CACHE, 'w', encoding='utf-8') as f:
        json.dump(cache, f, ensure_ascii=False)
    return cache


def pokedex_line(r):
    o = {'dex': r['dex'], 'name': r['name'], 'types': r['types'], 'hp': r['hp'], 'spd': r['spd'], 'atk': r['atk'],
         'pa': r['pa'], 'sa': r['sa'], 'df': r['df'], 'sd': r['sd'], 'rarity': r['rarity'], 'bst': r['bst'],
         'starter': r['starter'], 'gen': r['gen']}
    if r['leg']:
        o['leg'] = True
    return '  ' + json.dumps(o, ensure_ascii=False, separators=(',', ':')) + ','


def add_rows(path, start_pat, end_pat, key_pat, new):
    """Mete las líneas `new` ({clave: línea}) en el bloque, ordenadas por número."""
    s = read(path); N = nl(s); lines = s.split(N)
    a = next(i for i, l in enumerate(lines) if re.match(start_pat, l))
    b = next(i for i in range(a + 1, len(lines)) if re.match(end_pat, lines[i]))
    body = {int(re.match(key_pat, l).group(1)): l for l in lines[a + 1:b] if re.match(key_pat, l)}
    body.update(new)
    keys = sorted(body)
    rows = [body[k] for k in keys]
    rows = [r if r.endswith(',') else r + ',' for r in rows]
    if not lines[b - 1].rstrip().endswith(','):           # el último del bloque iba sin coma
        rows[-1] = rows[-1].rstrip(',')
    write(path, N.join(lines[:a + 1] + rows + lines[b:]))


def add_dict(path, pairs, end):
    """Añade "clave": "valor" al final del bloque G.I18n.add({ ... }) que acaba en `end`."""
    if not pairs:
        return
    s = read(path); N = nl(s)
    i = s.index(end)
    head = s[:i].rstrip()
    if not head.endswith(','):
        head += ','
    add = N.join(f'  {json.dumps(k, ensure_ascii=False)}: {json.dumps(v, ensure_ascii=False)},' for k, v in pairs)
    write(path, head + N + add.rstrip(',') + N + s[i:])


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    want = [int(a) for a in args] if args else sorted(have_sprite() - have_data())
    names_only = '--nombres' in sys.argv            # (los datos ya están: sólo los nombres traducidos)
    if not names_only:
        want = [d for d in want if d not in have_data()]
    print(f'Faltan datos de {len(want)}: {want}')
    if '--comprobar' in sys.argv or not want:
        return
    cache = fetch(want)
    if names_only:
        return add_names(cache, want)
    # pokedex.js
    add_rows(POKEDEX, r'^G\.DEX = \[', r'^\];', r'^  \{"dex":(\d+),',
             {d: pokedex_line(cache[str(d)]['row']) for d in want})
    # abilities.js: habilidades nuevas y la de cada uno
    s = read(ABIL)
    known = set(re.findall(r'^  "([a-z0-9-]+)":\[', s, re.M))
    new_ab = sorted({a for d in want for a in cache[str(d)]['abil'] if a and a not in known})
    if new_ab:
        N = nl(s); lines = s.split(N)
        a = lines.index('G.ABIL = {'); b = lines.index('};', a)
        body = {re.match(r'^  "([a-z0-9-]+)"', l).group(1): l for l in lines[a + 1:b]}
        for ab in new_ab:
            n = cache['_abil'][ab]
            en = n.get('en') or ab
            body[ab] = '  ' + json.dumps(ab) + ':' + json.dumps([n.get(l) or en for l in LANGS], ensure_ascii=False, separators=(',', ':'))
        rows = [body[k] + ',' if not body[k].endswith(',') else body[k] for k in sorted(body)]
        rows[-1] = rows[-1].rstrip(',')
        write(ABIL, N.join(lines[:a + 1] + rows + lines[b:]))
        print(f'Habilidades nuevas: {new_ab}')
    add_rows(ABIL, r'^G\.DEX_ABIL = \{', r'^\};', r'^  (\d+):\[',
             {d: f'  {d}:' + json.dumps(cache[str(d)]['abil'], separators=(',', ':')) for d in want})
    add_names(cache, want)


def add_names(cache, want):
    fr_have = read(FR)
    fr = [(cache[str(d)]['row']['name'], cache[str(d)]['names'].get('fr')) for d in want]
    add_dict(FR, [(k, v) for k, v in fr if v and v != k and json.dumps(k, ensure_ascii=False) + ':' not in fr_have], "}, 'fr');")
    for lang, path in ZH.items():
        have = (read(path),)
        cache_of = lambda d: cache[str(d)]
        tag = 'zh-Hans' if lang == 'zh-hans' else 'zh-Hant'
        new = [d for d in want if cache_of(d)['names'].get(lang)]
        add_dict(path, [(cache_of(d)['row']['name'], cache_of(d)['names'][lang]) for d in new
                        if json.dumps(cache_of(d)['row']['name'], ensure_ascii=False) + ':' not in have[0]], f"}}, '{tag}');")
        if f"}}, '{tag}', 'pokemon');" in have[0]:          # (zh-Hans: también por número)
            add_dict(path, [(str(d), cache_of(d)['names'][lang]) for d in new], f"}}, '{tag}', 'pokemon');")
    print(f'{len(want)} Pokémon: nombres en francés y chino')


if __name__ == '__main__':
    main()
