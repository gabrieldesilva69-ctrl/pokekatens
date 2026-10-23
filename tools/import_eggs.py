#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Huevos de Pokémon Edición Reloaded (de F3R, https://pokemon-reloaded.blogspot.com)
-> assets/eggs/<base>.png (+ s/ el shiny) y js/data/eggs.js.

    python tools/import_eggs.py

Reloaded trae un huevo de colores por familia, el de su Pokémon base (Pichu para
Pikachu, Happiny para Chansey): huevo/<archivo>.gif y huevo_shiny/<archivo>.gif,
80x80 con el dibujo (unos 28x30) en el centro. El archivo es el de sus sprites
(tools/reloaded_ids.py: file_id). Se recorta el dibujo y se guarda como PNG con
paleta: ~0,5 KB cada uno.

El Pokémon base de cada familia sale de las cadenas de evolución de PokeAPI (se
bajan una vez a tools/cache/egg-chains.json). Sólo entran los Pokémon del juego
que no son legendarios ni singulares (no salen de un huevo).
"""
import io
import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_pokedex import API, get                         # noqa: E402
from fetch_sprites import save_optimized                   # noqa: E402
from reloaded_ids import DATA, file_id, reloaded_ids       # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'eggs')
LIST = os.path.join(ROOT, 'js', 'data', 'eggs.js')
POKEDEX = os.path.join(ROOT, 'js', 'data', 'pokedex.js')
META = os.path.join(ROOT, 'js', 'data', 'sprites-meta.js')
CACHE = os.path.join(ROOT, 'tools', 'cache', 'egg-chains.json')


def game_mons():
    """{dex: es legendario} de los Pokémon del juego (con sprite)."""
    meta = io.open(META, encoding='utf-8').read()
    have = {int(d) for d in re.findall(r'^  (\d+): \{', meta, re.M)}
    out = {}
    for line in io.open(POKEDEX, encoding='utf-8'):
        m = re.search(r'\{"dex":(\d+),.*\}', line)
        if m and int(m.group(1)) in have:
            d = json.loads(m.group(0))
            out[d['dex']] = bool(d.get('leg'))
    return out


def chain_root(dex):
    sp = get(f'{API}/pokemon-species/{dex}')
    if not sp or not sp.get('evolution_chain'):
        return dex, dex
    ch = get(sp['evolution_chain']['url'])
    root = int(ch['chain']['species']['url'].rstrip('/').split('/')[-1]) if ch else dex
    return dex, root


def roots(dexes):
    cache = {}
    if os.path.exists(CACHE):
        cache = {int(k): v for k, v in json.load(io.open(CACHE, encoding='utf-8')).items()}
    todo = [d for d in dexes if d not in cache]
    if todo:
        print(f'Cadenas de evolución de PokeAPI: {len(todo)}...')
        with ThreadPoolExecutor(max_workers=8) as ex:
            for d, r in ex.map(chain_root, todo):
                cache[d] = r
        os.makedirs(os.path.dirname(CACHE), exist_ok=True)
        with io.open(CACHE, 'w', encoding='utf-8') as f:
            json.dump(cache, f)
    return {d: cache[d] for d in dexes}


def egg_file(base, shiny):
    for rid in reloaded_ids(base):
        p = os.path.join(DATA, 'huevo_shiny' if shiny else 'huevo', f'{file_id(rid, shiny)}.gif')
        if os.path.exists(p):
            return p
    return None


def convert(src, dst):
    im = Image.open(src).convert('RGBA')
    bb = im.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox()
    im = im.crop(bb)
    buf = io.BytesIO()
    im.save(buf, 'PNG')
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    save_optimized(buf.getvalue(), dst)


def main():
    mons = game_mons()
    breedable = sorted(d for d, leg in mons.items() if not leg)
    base = roots(breedable)
    fams = sorted(set(base.values()))
    keep, missing = {}, []
    for b in fams:
        n, s = egg_file(b, False), egg_file(b, True)
        if not n or not s:
            missing.append(b)
            continue
        convert(n, os.path.join(OUT, f'{b}.png'))
        convert(s, os.path.join(OUT, 's', f'{b}.png'))
        keep[b] = True
    # Pokémon cuyo huevo existe: dex -> base (sólo los que no son su propio base).
    of = {d: b for d, b in base.items() if b in keep}
    lines = [
        '/* ============ eggs.js — GENERADO, no editar a mano ============',
        ' * Lo produce tools/import_eggs.py. Los huevos son de Pokémon Edición Reloaded',
        ' * (de F3R), uno por familia: assets/eggs/<base>.png (+ s/ el shiny).',
        ' *   G.EGG_BASE[dex] = Pokémon base de su familia (el del huevo), sólo de los',
        ' *   que pueden salir de un huevo (los del juego que no son legendarios).',
        ' */',
        'G.EGG_BASE = {' + ','.join(f'{d}:{b}' for d, b in sorted(of.items())) + '};',
        '',
    ]
    with io.open(LIST, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lines))
    size = sum(os.path.getsize(os.path.join(dp, fn)) for dp, _, fns in os.walk(OUT) for fn in fns)
    print(f'{len(keep)} familias, {len(of)} Pokémon con huevo, {size / 1024:.0f} KB')
    if missing:
        print(f'Familias sin huevo en Reloaded ({len(missing)}): {missing}')


if __name__ == '__main__':
    main()
