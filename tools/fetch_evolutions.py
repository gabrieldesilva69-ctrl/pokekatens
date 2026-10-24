#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
A qué evoluciona cada Pokémon (cadenas de evolución de PokeAPI) -> js/data/evolutions.js.
Lo usa la evolución del compañero en la partida (js/systems/evolve.js).

    python tools/fetch_evolutions.py            # desde pokeapi.co
    python tools/fetch_evolutions.py --espejo   # desde la copia de PokeAPI en GitHub
                                                # (PokeAPI/api-data), si pokeapi.co no responde

Sólo entran los pasos en los que los dos Pokémon están en el juego (con sprite).
Se bajan una vez a tools/cache/evolution-chains.json; el juego no toca internet.
"""
import io
import json
import os
import re
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'js', 'data', 'evolutions.js')
META = os.path.join(ROOT, 'js', 'data', 'sprites-meta.js')
CACHE = os.path.join(ROOT, 'tools', 'cache', 'evolution-chains.json')
API = 'https://pokeapi.co/api/v2'
MIRROR = 'https://raw.githubusercontent.com/PokeAPI/api-data/master/data/api/v2'
LAST_CHAIN = 600          # hay ~550 cadenas, con huecos


def get(url):
    for _ in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'pokesurvivor/1.0'})
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
        except Exception:
            pass
    return None


def species_id(url):
    return int(url.rstrip('/').split('/')[-1])


def edges_of(chain):
    """[(de, a), ...] de un árbol de evolución."""
    out = []

    def walk(node):
        a = species_id(node['species']['url'])
        for nxt in node['evolves_to']:
            out.append((a, species_id(nxt['species']['url'])))
            walk(nxt)
    walk(chain['chain'])
    return out


def main():
    mirror = '--espejo' in sys.argv
    url = (lambda i: f'{MIRROR}/evolution-chain/{i}/index.json') if mirror else (lambda i: f'{API}/evolution-chain/{i}/')
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    if os.path.exists(CACHE):
        edges = [tuple(e) for e in json.load(open(CACHE, encoding='utf-8'))]
    else:
        print(f'Bajando {LAST_CHAIN} cadenas de evolución...')
        with ThreadPoolExecutor(max_workers=16) as ex:
            chains = [c for c in ex.map(lambda i: get(url(i)), range(1, LAST_CHAIN + 1)) if c]
        edges = sorted({e for c in chains for e in edges_of(c)})
        if not edges:
            sys.exit('No se ha podido bajar nada (¿sin internet? prueba con --espejo)')
        with open(CACHE, 'w', encoding='utf-8') as f:
            json.dump(edges, f)
        print(f'{len(chains)} cadenas, {len(edges)} evoluciones')

    meta = io.open(META, encoding='utf-8').read()
    game = {int(d) for d in re.findall(r'^  (\d+): \{', meta, re.M) if int(d) <= 1025}
    evos = {}
    for a, b in edges:
        if a in game and b in game:
            evos.setdefault(a, []).append(b)
    lines = [
        '/* ============ evolutions.js — GENERADO, no editar a mano ============',
        ' * Lo produce tools/fetch_evolutions.py (cadenas de evolución de PokeAPI).',
        ' * G.EVOS[dex] = Pokémon a los que puede evolucionar (sólo los que están en el juego).',
        ' */',
        'G.EVOS = {',
    ]
    for a in sorted(evos):
        lines.append(f'  {a}: {json.dumps(sorted(evos[a]))},')
    lines += ['};', '']
    with io.open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lines))
    print(f'{len(evos)} Pokémon que evolucionan -> js/data/evolutions.js')


if __name__ == '__main__':
    main()
