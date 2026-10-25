#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Iconos de las Megapiedras y de los Orbes Rojo / Azul, de las imágenes que han hecho los
dueños (con IA, 24-10-2026; no son oficiales) -> js/data/stones.js.

    python tools/import_stone_icons.py

- tools/art/megapiedras.jpg: hoja de 232x777 con tres columnas (XY, ORAS, Leyendas Z-A);
  cada fila, un icono redondo de ~15x15 y su nombre en inglés. SHEET dice qué mega es cada
  fila (el número nacional, y la forma si hay dos: Charizardita X, Mewtwonita Y). Cada icono
  son sus píxeles tal cual (pixel art), sin nada de lo que queda fuera de su borde negro: ni el
  aro blanco que lleva alrededor ni el fondo verde (inside_outline). PNG en base64 (~0,5 KB).
- tools/art/orbes.jpg: el Orbe Rojo y el Orbe Azul grandes: se recortan en círculo y se
  reducen a 48x48.

Salen G.STONE_ICONS (dex -> data URI) y G.ORB_ICONS (red / blue). Si una mega del juego no
está en la hoja, js/ui/icons.js dibuja la de siempre con los colores de G.STONE_COLORS
(tools/make_stones.py, que escribe el mismo archivo: hay que ejecutar los dos).
"""
import base64
import io
import os
import re

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, 'tools', 'art')
OUT = os.path.join(ROOT, 'js', 'data', 'stones.js')
MEGAS = os.path.join(ROOT, 'js', 'data', 'megas.js')

COL_X = (2, 79, 156)          # x de la izquierda del icono en cada columna
ROW_Y0, ROW_DY, SIZE = 12, 17, 15
# Columna -> filas: (nº nacional, forma) en el orden de la hoja.
SHEET = [
    [(3, ''), (6, 'x'), (6, 'y'), (9, ''), (65, ''), (94, ''), (115, ''), (127, ''), (130, ''), (142, ''),
     (150, 'x'), (150, 'y'), (181, ''), (212, ''), (214, ''), (229, ''), (248, ''), (257, ''), (282, ''),
     (303, ''), (306, ''), (308, ''), (310, ''), (354, ''), (359, ''), (380, ''), (381, ''), (445, ''),
     (448, ''), (460, '')],
    [(15, ''), (18, ''), (80, ''), (208, ''), (254, ''), (260, ''), (302, ''), (319, ''), (323, ''),
     (334, ''), (362, ''), (373, ''), (376, ''), (384, ''), (428, ''), (475, ''), (531, ''), (719, '')],
    [(26, 'x'), (26, 'y'), (36, ''), (71, ''), (121, ''), (149, ''), (154, ''), (160, ''), (227, ''),
     (358, ''), (359, 'z'), (398, ''), (445, 'z'), (448, 'z'), (478, ''), (485, ''), (491, ''), (500, ''),
     (530, ''), (545, ''), (560, ''), (604, ''), (609, ''), (623, ''), (652, ''), (655, ''), (658, ''),
     (668, ''), (670, ''), (678, ''), (687, ''), (689, ''), (691, ''), (701, ''), (718, ''), (740, ''),
     (768, ''), (780, ''), (801, ''), (807, ''), (870, ''), (952, ''), (970, ''), (978, ''), (998, '')],
]
# La forma que usa el juego cuando hay dos (como WHICH en tools/fetch_megas.py).
WHICH = {6: 'x', 150: 'y'}
ORBS = {'red': (335, 382, 196), 'blue': (1075, 382, 196)}      # centro x, y y radio en orbes.jpg
ORB_SIZE = 48


def uri(im, colors=48):
    """PNG con paleta (pocos colores: son iconos pequeños) en base64."""
    b = io.BytesIO()
    im.quantize(colors, method=Image.Quantize.FASTOCTREE).save(b, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()


def circle(im, inset=0.0):
    """Lo de fuera del círculo, transparente."""
    w, h = im.size
    m = Image.new('L', (w * 4, h * 4), 0)
    ImageDraw.Draw(m).ellipse((inset * 4, inset * 4, (w - inset) * 4 - 1, (h - inset) * 4 - 1), fill=255)
    out = im.convert('RGBA')
    out.putalpha(m.resize((w, h), Image.LANCZOS))
    return out


def inside_outline(sheet, x, y):
    """La piedra tal cual (sus píxeles de la hoja, en pixel art), sin lo de fuera de su borde
    negro: el aro blanco que lleva alrededor y el fondo verde. Se recorta con un píxel de margen
    para que el borde negro quepa entero, se borra lo claro que se alcanza desde fuera sin
    cruzar el borde negro (el brillo blanco de dentro no se toca: el borde lo encierra) y se
    queda sólo la pieza grande (fuera los trocitos de las piedras de arriba y abajo)."""
    c = sheet.crop((x - 1, y - 1, x + SIZE + 1, y + SIZE + 1)).convert('RGBA')
    w, h = c.size
    px = c.load()
    lum = lambda i, j: sum(px[i, j][:3]) / 3
    out = set()
    todo = [(i, j) for i in range(w) for j in (0, h - 1)] + [(i, j) for j in range(h) for i in (0, w - 1)]
    while todo:
        i, j = todo.pop()
        if (i, j) in out or not (0 <= i < w and 0 <= j < h) or lum(i, j) <= 100:
            continue
        out.add((i, j))
        todo += [(i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)]
    keep = {(i, j) for j in range(h) for i in range(w) if (i, j) not in out}
    best, seen = set(), set()
    for p0 in keep:
        if p0 in seen:
            continue
        part, todo = set(), [p0]
        while todo:
            q = todo.pop()
            if q in seen or q not in keep:
                continue
            seen.add(q); part.add(q)
            i, j = q
            todo += [(i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)]
        if len(part) > len(best):
            best = part
    for j in range(h):
        for i in range(w):
            if (i, j) not in best:
                px[i, j] = (0, 0, 0, 0)
    return c


def game_megas():
    keys = set()
    for line in io.open(MEGAS, encoding='utf-8'):
        m = re.match(r'\s*(\d+): \{(.*)\},?\s*$', line)
        if m and '"primal":1' not in m.group(2):
            keys.add(int(m.group(1)))
    return keys


def main():
    sheet = Image.open(os.path.join(ART, 'megapiedras.jpg')).convert('RGB')
    have = game_megas()
    icons = {}
    for col, rows in enumerate(SHEET):
        for i, (dex, form) in enumerate(rows):
            if dex not in have or form != WHICH.get(dex, ''):
                continue
            x, y = COL_X[col], ROW_Y0 + i * ROW_DY
            icons[dex] = uri(inside_outline(sheet, x, y))
    miss = sorted(have - set(icons))
    orbs_im = Image.open(os.path.join(ART, 'orbes.jpg')).convert('RGB')
    orbs = {}
    for k, (cx, cy, r) in ORBS.items():
        c = circle(orbs_im.crop((cx - r, cy - r, cx + r, cy + r)))
        orbs[k] = uri(c.resize((ORB_SIZE, ORB_SIZE), Image.LANCZOS))

    src = io.open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
    src = re.sub(r'\n// ---- iconos \(tools/import_stone_icons\.py\) ----\n[\s\S]*$', '\n', src).rstrip('\n') + '\n'
    src += '\n// ---- iconos (tools/import_stone_icons.py) ----\n'
    src += 'G.STONE_ICONS = {\n' + ',\n'.join(f"  {d}: '{u}'" for d, u in sorted(icons.items())) + '\n};\n'
    src += 'G.ORB_ICONS = {\n' + ',\n'.join(f"  {k}: '{u}'" for k, u in orbs.items()) + '\n};\n'
    io.open(OUT, 'w', encoding='utf-8', newline='\n').write(src)
    kb = sum(len(u) for u in icons.values()) // 1024 + sum(len(u) for u in orbs.values()) // 1024
    print(f'{len(icons)} Megapiedras y 2 Orbes en js/data/stones.js (~{kb} KB); sin icono en la hoja: {miss}')


if __name__ == '__main__':
    main()
