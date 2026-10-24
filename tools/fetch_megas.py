#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Datos de las megaevoluciones (idea 4 de docs/IDEAS-RELOADED.md) desde PokeAPI
-> js/data/megas.js. Se baja una vez; el juego no toca internet.

    python tools/fetch_megas.py

Sólo las megas oficiales que tienen sprite en Pokémon Edición Reloaded (de F3R)
y cuya especie está en el juego: la lista sale de tools/import_reloaded.py
(OFFICIAL_MEGAS, mega_rid). Una por especie: Reloaded sólo trae una, así que
de Charizard es la X y de Mewtwo la Y (la que dibuja: delgada, la cola en la
cabeza); de Absol, Garchomp y Lucario, la de X/Y (no la Z).

Los stats se convierten con la misma fórmula que tools/fetch_pokedex.py.

Además, las formas primigenias de Kyogre y Groudon (PRIMALS), que el juego usa
como megas: sprites de SpriteCollab (tools/fetch_forms.py), primal:1, su orbe
(orb: nombre en español; oc: tipo que da color al icono) y el clima que ponen
mientras duran (wx).
"""
import io
import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_pokedex import API, get                       # noqa: E402
import import_reloaded as ir                              # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'js', 'data', 'megas.js')
META = os.path.join(ROOT, 'js', 'data', 'sprites-meta.js')
# La forma que dibuja Reloaded cuando la especie tiene dos (sufijo en PokeAPI y en el nombre).
WHICH = {6: 'x', 150: 'y'}
# Formas primigenias: dex -> (slug de PokeAPI, orbe, color del icono, clima)
PRIMALS = {382: ('kyogre-primal', 'Orbe Azul', 'water', 'rain'),
           383: ('groudon-primal', 'Orbe Rojo', 'fire', 'sun')}


def usable():
    text = io.open(META, encoding='utf-8').read()
    game = {int(d) for d in re.findall(r'^  (\d+): \{', text, re.M) if int(d) <= 1025}
    have = ir.reloaded_megas()
    return [d for d in ir.OFFICIAL_MEGAS if d in game and ir.mega_rid(d, have) is not None]


def stats(p):
    base = {s['stat']['name']: s['base_stat'] for s in p['stats']}
    return {
        'types': [t['type']['name'] for t in p['types']],
        'hp': round(70 + base['hp'] * 0.45),
        'spd': round(78 + base['speed'] * 0.42),
        'pa': round(0.70 + base['attack'] / 100 * 0.55, 2),
        'sa': round(0.70 + base['special-attack'] / 100 * 0.55, 2),
        'df': base['defense'], 'sd': base['special-defense'],
        # Las de Leyendas Z-A aún no traen habilidad en PokeAPI: se queda la suya.
        'ab': p['abilities'][0]['ability']['name'] if p['abilities'] else '',
    }


def primal(dex):
    slug, orb, oc, wx = PRIMALS[dex]
    p = get(f'{API}/pokemon/{slug}')
    if not p:
        print(f'  ! {dex}: PokeAPI no tiene {slug}')
        return None
    return dict({'dex': dex, 'slug': slug, 'sfx': ''}, **stats(p), primal=1, orb=orb, oc=oc, wx=wx)


def one(dex):
    sp = get(f'{API}/pokemon-species/{dex}')
    if not sp:
        print(f'  ! {dex}: sin especie')
        return None
    names = [v['pokemon']['name'] for v in sp['varieties']]
    want = [n for n in names if n.endswith('-mega' + ('-' + WHICH[dex] if dex in WHICH else ''))]
    if not want:
        print(f'  ! {dex}: PokeAPI no tiene su mega ({names})')
        return None
    p = get(f'{API}/pokemon/{want[0]}')
    return dict({'dex': dex, 'slug': want[0], 'sfx': WHICH.get(dex, '').upper()}, **stats(p))


def main():
    dexes = usable()
    print(f'{len(dexes)} megas...')
    with ThreadPoolExecutor(max_workers=8) as ex:
        rows = [r for r in ex.map(one, dexes) if r]
    text = io.open(META, encoding='utf-8').read()
    rows += [r for r in map(primal, [d for d in PRIMALS if f'\n  {100000 + d}: {{' in text]) if r]
    rows.sort(key=lambda r: r['dex'])
    lines = [
        '/* ============ megas.js — GENERADO, no editar a mano ============',
        ' * Lo produce tools/fetch_megas.py (datos de PokeAPI, sprites de Pokémon',
        ' * Edición Reloaded en assets/pokemon/<100000 + dex>/). Una mega por especie.',
        ' * Por especie: slug de PokeAPI · sfx "X"/"Y" si la especie tiene dos ·',
        ' * types · hp/spd/pa/sa/df/sd como en pokedex.js · ab habilidad de mega.',
        ' * Las formas primigenias (Kyogre, Groudon) van como megas con primal:1, su',
        ' * orbe (orb, nombre; oc, tipo del color del icono) y el clima que ponen (wx).',
        ' */',
        'G.MEGAS = {',
    ]
    for r in rows:
        d = r.pop('dex')
        lines.append(f'  {d}: {json.dumps(r, separators=(",", ":"))},')
    lines += ['};', '']
    with io.open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lines))
    print(f'{len(rows)} megas -> js/data/megas.js')


if __name__ == '__main__':
    main()
