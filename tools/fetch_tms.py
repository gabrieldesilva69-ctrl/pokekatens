#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Regenera js/data/tms.js: quién aprende cada movimiento por MT en los juegos
(datos de PokeAPI, por su API GraphQL: una consulta por movimiento) y su precio
en la Tienda Kecleon.

    python tools/fetch_tms.py                       # los que ya hay en tms.js
    python tools/fetch_tms.py earthquake surf ...   # y además estos (ataques nuevos)
    python tools/fetch_tms.py --comprobar           # sólo compara con lo que hay
    python tools/fetch_tms.py --pokemon 1025,893    # añade esos Pokémon (nuevos en pokedex.js) a
                                                    # las MT que ya hay, sin tocar a los demás

El id del movimiento es el de PokeAPI (el mismo que en js/data/moves.js). Sólo
entran los Pokémon que hay en js/data/pokedex.js. Precio: 300 + 6 × potencia,
redondeado a 10 (los de estado, 400), como en el PR #236 de TheAdro7, de donde
salió la primera versión de este archivo (20-10-2026).
"""
import io
import json
import os
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'js', 'data', 'tms.js')
MOVES = os.path.join(ROOT, 'js', 'data', 'moves.js')
POKEDEX = os.path.join(ROOT, 'js', 'data', 'pokedex.js')
GQL = 'https://graphql.pokeapi.co/v1beta2'
REST = 'https://pokeapi.co/api/v2'


def post(query):
    req = urllib.request.Request(GQL, data=json.dumps({'query': query}).encode(),
                                 headers={'Content-Type': 'application/json', 'User-Agent': 'pokekatens/1.0'})
    return json.load(urllib.request.urlopen(req, timeout=60))


def learners(move, methods=('machine',)):
    """Quién lo aprende por MT. Si en los juegos no es MT (Velocidad Extrema: sí lo es en
    Reloaded), quien lo aprende por nivel o por tutor."""
    q = ('query { pokemonmove(where: {move: {name: {_eq: "%s"}}, movelearnmethod: {name: {_in: %s}}}, '
         'distinct_on: pokemon_id) { pokemon_id } }' % (move, json.dumps(list(methods))))
    ids = sorted({r['pokemon_id'] for r in post(q)['data']['pokemonmove']})
    if not ids and methods == ('machine',):
        print(f'  {move}: no es MT en los juegos; se usa quien lo aprende por nivel o tutor')
        return learners(move, ('level-up', 'tutor'))
    return move, ids


def price(move):
    req = urllib.request.Request(f'{REST}/move/{move}', headers={'User-Agent': 'pokekatens/1.0'})
    p = json.load(urllib.request.urlopen(req, timeout=60)).get('power')
    return move, 400 if not p else int(round((300 + 6 * p) / 10.0) * 10)


def current():
    text = io.open(OUT, encoding='utf-8').read()
    tm = {k: json.loads(v) for k, v in re.findall(r'^  "([a-z-]+)":(\[[\d,]*\]),?$', text, re.M)}
    pr = {k: int(v) for k, v in re.findall(r'^  "([a-z-]+)":(\d+),?$', text, re.M)}
    return tm, pr


def main():
    argv = sys.argv[1:]
    # --pokemon N,N: Pokémon recién añadidos a la Pokédex (tools/add_pokedex.py, 30-10-2026).
    added = set()
    if '--pokemon' in argv:
        i = argv.index('--pokemon')
        added = {int(x) for x in argv[i + 1].split(',') if x}
        del argv[i:i + 2]
    args = [a for a in argv if not a.startswith('--')]
    check = '--comprobar' in sys.argv
    game_moves = set(re.findall(r"\{ id: '([a-z-]+)'", io.open(MOVES, encoding='utf-8').read()))
    dex = {int(d) for d in re.findall(r'"dex":(\d+)', io.open(POKEDEX, encoding='utf-8').read())}
    tm, pr = current()
    for a in args:
        if a not in game_moves:
            sys.exit(f'{a} no está en js/data/moves.js')
    keys = sorted(set(tm) | set(args))
    with ThreadPoolExecutor(max_workers=6) as ex:
        got = dict(ex.map(learners, keys))
        new_price = dict(ex.map(price, [k for k in keys if k not in pr]))
    out = {k: [d for d in got[k] if d in dex] for k in keys}
    changed = [k for k in tm if out[k] != tm[k]]
    print(f'{len(keys)} MT; distintas de las de ahora: {len(changed)} {changed[:10]}')
    for k in args:
        print(f'  {k}: {len(out[k])} Pokémon, {new_price.get(k, pr.get(k))} monedas')
    if check:
        return
    # Las que ya había se quedan como estaban (son las del PR #236); sólo se añaden las nuevas.
    final = {k: (sorted(set(tm[k]) | {d for d in out[k] if d in added}) if k in tm else out[k]) for k in keys}
    if added:
        print(f'  nuevos: {len({d for k in keys for d in final[k] if d in added})} de {len(added)} aprenden alguna MT')
    prices = dict(pr)
    prices.update(new_price)
    text = io.open(OUT, encoding='utf-8').read()
    head = text[:text.index('G.TM_MOVES = {')]
    tail_of = text[text.index('G.TM_OF = '):text.index('G.TM_PRICE = {')]
    lines = [head.rstrip('\n'), 'G.TM_MOVES = {']
    lines += [f'  "{k}":{json.dumps(final[k], separators=(",", ":"))}' + (',' if i < len(keys) - 1 else '')
              for i, k in enumerate(keys)]
    lines += ['};', tail_of.rstrip('\n'), 'G.TM_PRICE = {']
    lines += [f'  "{k}":{prices[k]}' + (',' if i < len(keys) - 1 else '') for i, k in enumerate(keys)]
    lines += ['};', '']
    with io.open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lines))
    print('js/data/tms.js escrito')


if __name__ == '__main__':
    main()
