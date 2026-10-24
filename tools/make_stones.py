#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Colores de la Megapiedra de cada mega -> js/data/stones.js (G.STONE_COLORS).

    python tools/make_stones.py

Las Megapiedras de los juegos son una esfera con la hélice de la megaevolución en
dos colores, los del Pokémon. Aquí se sacan de su sprite de mega del juego
(assets/pokemon/1000xx/Idle.png): los dos tonos que más se ven (sin el negro del
contorno ni los grises), y si sólo tiene uno, ese y uno más oscuro. El icono lo
dibuja js/ui/icons.js ('ms:<dex>'). Las formas primigenias (primal:1 en
js/data/megas.js) no tienen piedra: llevan su Orbe Rojo / Azul ('porb:red' / 'porb:blue').
"""
import colorsys
import io
import os
import re

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEGAS = os.path.join(ROOT, 'js', 'data', 'megas.js')
OUT = os.path.join(ROOT, 'js', 'data', 'stones.js')
BINS = 18                       # trozos de tono (de 20 grados)


def megas():
    out = []
    for line in io.open(MEGAS, encoding='utf-8'):
        m = re.match(r'\s*(\d+): \{(.*)\},?\s*$', line)
        if m and '"primal":1' not in m.group(2):
            out.append(int(m.group(1)))
    return out


def hexc(rgb):
    return '#' + ''.join(f'{max(0, min(255, round(v))):02x}' for v in rgb)


def colors(dex):
    im = Image.open(os.path.join(ROOT, 'assets', 'pokemon', str(100000 + dex), 'Idle.png')).convert('RGBA')
    bins = {}
    grey = [0, [0, 0, 0]]
    for n, (r, g, b, a) in im.getcolors(1 << 20):
        if a < 200:
            continue
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if v < 0.22:                        # contorno y sombras
            continue
        if s < 0.18:                        # blancos y grises: sólo si no hay color
            grey[0] += n; grey[1] = [grey[1][i] + c * n for i, c in enumerate((r, g, b))]
            continue
        k = int(h * BINS) % BINS
        e = bins.setdefault(k, [0, [0, 0, 0]])
        e[0] += n; e[1] = [e[1][i] + c * n * s for i, c in enumerate((r, g, b))]
        e.append(s * n)
    def avg(e):
        w = sum(e[2:]) or 1
        return [c / w for c in e[1]]
    ranked = sorted(bins.items(), key=lambda kv: -kv[1][0])
    if not ranked:
        g = [c / max(1, grey[0]) for c in grey[1]]
        return [hexc(g), hexc([c * 0.55 for c in g])]
    a = avg(ranked[0][1])
    far = [kv for kv in ranked[1:] if min((kv[0] - ranked[0][0]) % BINS, (ranked[0][0] - kv[0]) % BINS) >= 2
           and kv[1][0] >= ranked[0][1][0] * 0.12]
    if far:
        b = avg(far[0][1])
    elif grey[0] >= ranked[0][1][0] * 0.3:
        b = [c / grey[0] for c in grey[1]]
    else:
        b = [c * 0.55 for c in a]
    return [hexc(a), hexc(b)]


def main():
    rows = []
    for dex in megas():
        a, b = colors(dex)
        rows.append(f"  {dex}: ['{a}', '{b}']")
    # Los iconos de tools/import_stone_icons.py van al final del mismo archivo: se conservan.
    old = io.open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
    i = old.find('\n// ---- iconos (tools/import_stone_icons.py) ----\n')
    tail = old[i:] if i >= 0 else ''
    with io.open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write('/* ============ stones.js — Megapiedras de cada mega ============\n'
                ' * Generado por tools/make_stones.py (los colores, de su sprite de mega) y\n'
                ' * tools/import_stone_icons.py (los iconos, de tools/art/): no editar a mano.\n'
                " * El icono es 'ms:<dex>' (js/ui/icons.js): el de G.STONE_ICONS o, si no hay, la esfera con estos colores.\n */\n")
        f.write('G.STONE_COLORS = {\n' + ',\n'.join(rows) + '\n};\n' + tail)
    print(f'{len(rows)} Megapiedras en js/data/stones.js')


if __name__ == '__main__':
    main()
