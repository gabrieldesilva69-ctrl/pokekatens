#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Números de Pokémon Edición Reloaded (de F3R, https://pokemon-reloaded.blogspot.com).

Reloaded NO usa la numeración de la Pokédex nacional: hasta los 400 y pico
coincide, pero luego mete formas y Pokémon inventados por medio (Mewthree es
el 500, Karrablast el 596, Koraidon el 1385...). Sus archivos (retratos
pkmn/, gritos, huevos, sprites de mapa) van por SU número.

La tabla está en data/text/en/txt_pkmn.dll: un nombre inglés por línea (línea
N = Pokémon N de Reloaded), cifrado con una sustitución letra a letra. La
clave se saca comparando las líneas 1-151 (que sí coinciden con la nacional)
con los nombres de js/data/pokedex.js; las letras que no salen ahí hacen de
comodín al comparar.

    python tools/reloaded_ids.py 588 820 1007     # nº nacional -> nº(s) de Reloaded
    python tools/reloaded_ids.py --nombre 1385    # nº de Reloaded -> nombre

Desde otras herramientas:  from reloaded_ids import reloaded_ids, portrait_paths
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'Proyecto Reloaded The Last Beta 1.9.2.2 Full', 'data')
NAMES = os.path.join(DATA, 'text', 'en', 'txt_pkmn.dll')
POKEDEX = os.path.join(ROOT, 'js', 'data', 'pokedex.js')

_cache = {}


def our_names():
    """{nº nacional: nombre inglés} de js/data/pokedex.js."""
    if 'ours' not in _cache:
        names = {}
        for line in io.open(POKEDEX, encoding='utf-8'):
            m = re.search(r'"dex":(\d+),"name":"([^"]*)"', line)
            if m:
                names[int(m.group(1))] = m.group(2)
        _cache['ours'] = names
    return _cache['ours']


def reloaded_names():
    """Lista de nombres de Reloaded descifrados (índice 0 = Pokémon 1); '?' = letra sin clave."""
    if 'rl' not in _cache:
        lines = io.open(NAMES, encoding='latin-1').read().splitlines()
        ours, key = our_names(), {}
        for i in range(1, 152):
            plain = ours.get(i, '')
            if len(plain) == len(lines[i - 1]):
                for c, p in zip(lines[i - 1], plain):
                    key.setdefault(c, p)
        _cache['rl'] = [''.join(key.get(c, '?') for c in line) for line in lines]
    return _cache['rl']


def _same(rl, name):
    return len(rl) == len(name) and all(a == '?' or a.lower() == b.lower() for a, b in zip(rl, name))


def reloaded_ids(dex):
    """Todos los números de Reloaded con el nombre de ese Pokémon nacional (el
    primero es la forma base; los demás, formas). [] si no lo tiene."""
    name = our_names().get(dex)
    if not name:
        return []
    return [i for i, rl in enumerate(reloaded_names(), 1) if _same(rl, name)]


def portrait_paths(rid):
    """(normal, shiny) de los retratos 96x96 de ese número de Reloaded."""
    if rid <= 1000:
        n, s = rid, 1000 + rid
    else:
        n, s = rid + 1000, rid + 2000
    return (os.path.join(DATA, 'pkmn', f'{n}.gif'), os.path.join(DATA, 'pkmn_shiny', f'{s}.gif'))


def main():
    args = sys.argv[1:]
    if args[:1] == ['--nombre']:
        rl = reloaded_names()
        for a in args[1:]:
            print(a, rl[int(a) - 1] if 0 < int(a) <= len(rl) else '-')
        return
    for a in args:
        print(a, our_names().get(int(a), '?'), reloaded_ids(int(a)))


if __name__ == '__main__':
    main()
