#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Números de Pokémon Edición Reloaded (de F3R, https://pokemon-reloaded.blogspot.com).

Reloaded NO usa la numeración de la Pokédex nacional: hasta el 493 coincide,
pero luego mete formas y Pokémon inventados por medio (Mewthree es el 500,
Karrablast el 596, Koraidon el 1385...). Sus archivos (retratos pkmn/, gritos,
huevos, sprites de mapa, megas 100000+N) van por SU número.

La tabla está en data/text/en/txt_pkmn.dll: un nombre inglés por línea (línea
N = Pokémon N de Reloaded), cifrado con una sustitución letra a letra. La
clave se saca comparando las líneas 1-493 (que sí coinciden con la nacional)
con los nombres de js/data/pokedex.js.

Para buscar un Pokémon hace falta su nombre inglés: los de PokeAPI (se bajan
una vez a tools/cache/species.json, como hace fetch_pokedex.py) y, sin
internet, los de pokedex.js. Se comparan sin mayúsculas, tildes ni signos
(Mr. Mime = mr-mime, Flabébé = flabebe); los pocos que Reloaded escribe distinto
("Nidoran H.", "Pecharu") van en ALIAS.

    python tools/reloaded_ids.py 588 820 1007     # nº nacional -> nº(s) de Reloaded
    python tools/reloaded_ids.py --nombre 1385    # nº de Reloaded -> nombre
    python tools/reloaded_ids.py --todos          # los 1-1025 que no se encuentran

Desde otras herramientas:  from reloaded_ids import reloaded_ids, portrait_paths
"""
import io
import json
import os
import re
import sys
import unicodedata
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'Proyecto Reloaded The Last Beta 1.9.2.2 Full', 'data')
NAMES = os.path.join(DATA, 'text', 'en', 'txt_pkmn.dll')
POKEDEX = os.path.join(ROOT, 'js', 'data', 'pokedex.js')
SPECIES = os.path.join(ROOT, 'tools', 'cache', 'species.json')
SAME_UNTIL = 493      # hasta aquí el número de Reloaded es el nacional
ALIAS = {'nidoranh': 'nidoranf',   # Reloaded: "Nidoran H." (hembra)
         'pecharu': 'pecharunt'}    # Reloaded lo trae cortado

_cache = {}


def our_names():
    """{nº nacional: nombre} de js/data/pokedex.js (en español, como el juego)."""
    if 'ours' not in _cache:
        names = {}
        for line in io.open(POKEDEX, encoding='utf-8'):
            m = re.search(r'"dex":(\d+),"name":"([^"]*)"', line)
            if m:
                names[int(m.group(1))] = m.group(2)
        _cache['ours'] = names
    return _cache['ours']


def english_names():
    """{nº nacional: nombre inglés} de los 1025 (PokeAPI, guardado en tools/cache/)."""
    if 'en' not in _cache:
        names = {}
        if not os.path.exists(SPECIES):
            try:
                req = urllib.request.Request('https://pokeapi.co/api/v2/pokemon-species?limit=1025',
                                             headers={'User-Agent': 'pokekatens/1.0'})
                res = json.loads(urllib.request.urlopen(req, timeout=30).read().decode('utf-8'))
                got = {int(r['url'].rstrip('/').split('/')[-1]): r['name'] for r in res['results']}
                os.makedirs(os.path.dirname(SPECIES), exist_ok=True)
                with io.open(SPECIES, 'w', encoding='utf-8') as f:
                    json.dump(got, f)
            except Exception as e:
                print(f'(sin PokeAPI: {e}; se usan los nombres de pokedex.js)', file=sys.stderr)
        if os.path.exists(SPECIES):
            names = {int(k): v for k, v in json.load(io.open(SPECIES, encoding='utf-8')).items()}
        for dex, name in our_names().items():
            names.setdefault(dex, name)
        _cache['en'] = names
    return _cache['en']


def norm(name):
    """Para comparar: sin mayúsculas, tildes ni signos; ♀/♂ -> f/m."""
    s = name.replace('♀', 'f').replace('♂', 'm')
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]', '', s)


def reloaded_names():
    """Lista de nombres de Reloaded descifrados (índice 0 = Pokémon 1); '?' = letra sin clave."""
    if 'rl' not in _cache:
        lines = io.open(NAMES, encoding='latin-1').read().splitlines()
        ours, key = our_names(), {}
        for i in range(1, SAME_UNTIL + 1):
            plain = ours.get(i, '')
            if len(plain) == len(lines[i - 1]):
                for c, p in zip(lines[i - 1], plain):
                    key.setdefault(c, p)
        _cache['rl'] = [''.join(key.get(c, '?') for c in line) for line in lines]
    return _cache['rl']


def _rl_norm():
    if 'rln' not in _cache:
        out = []
        for name in reloaded_names():
            n = norm(name.replace('?', ''))
            out.append(ALIAS.get(n, n))
        _cache['rln'] = out
    return _cache['rln']


def reloaded_ids(dex):
    """Todos los números de Reloaded de ese Pokémon nacional: el primero es la
    forma base; los demás, formas. [] si Reloaded no lo tiene."""
    if dex <= SAME_UNTIL:
        rest = [i for i, n in enumerate(_rl_norm(), 1) if i > SAME_UNTIL and n == _rl_norm()[dex - 1]]
        return [dex] + rest
    name = english_names().get(dex)
    if not name:
        return []
    want = norm(name)
    return [i for i, n in enumerate(_rl_norm(), 1) if n == want]


def national_of(rid):
    """Nº nacional de un número de Reloaded (None si es un Pokémon inventado)."""
    if 'nat' not in _cache:
        by = {norm(n): d for d, n in english_names().items()}
        _cache['nat'] = [by.get(n) for n in _rl_norm()]
    nat = _cache['nat']
    if rid <= SAME_UNTIL:
        return rid
    return nat[rid - 1] if 0 < rid <= len(nat) else None


def file_id(rid, shiny=False):
    """Número del archivo de ese Pokémon de Reloaded, en los retratos (pkmn/,
    pkmn_shiny/) y en los sprites de mapa (pkmnbattle/P<n>_*): hasta el 1000,
    N normal y 1000+N shiny; del 1001 en adelante, N+1000 y N+2000.
    Las megas van aparte (100000+N, 101000+N)."""
    if rid <= 1000:
        return 1000 + rid if shiny else rid
    return rid + 2000 if shiny else rid + 1000


def portrait_paths(rid):
    """(normal, shiny) de los retratos 96x96 de ese número de Reloaded."""
    return (os.path.join(DATA, 'pkmn', f'{file_id(rid)}.gif'),
            os.path.join(DATA, 'pkmn_shiny', f'{file_id(rid, True)}.gif'))


def main():
    args = sys.argv[1:]
    if args[:1] == ['--nombre']:
        rl = reloaded_names()
        for a in args[1:]:
            print(a, rl[int(a) - 1] if 0 < int(a) <= len(rl) else '-')
        return
    if args[:1] == ['--todos']:
        miss = [d for d in range(1, 1026) if not reloaded_ids(d)]
        print(f'{1025 - len(miss)} de 1025 encontrados; sin encontrar: {miss}')
        return
    for a in args:
        print(a, english_names().get(int(a), '?'), reloaded_ids(int(a)))


if __name__ == '__main__':
    main()
