#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Shiny para los Pokémon a los que SpriteCollab no les dibujó shiny, con los
colores de Pokémon Edición Reloaded (de F3R, https://pokemon-reloaded.blogspot.com).

    python tools/shiny_from_reloaded.py               # los 8 sin shiny: sólo la hoja de revisión
    python tools/shiny_from_reloaded.py 588 820       # esos
    python tools/shiny_from_reloaded.py --aplicar     # escribe assets/pokemon/<dex>/s/ y sh:1

Sin --aplicar no toca assets/ ni sprites-meta.js: deja la hoja de revisión
(normal y shiny lado a lado, las 7 animaciones) en tools/cache/shiny-revision.png.

Cómo: Reloaded trae el retrato normal y el shiny (pkmn/, pkmn_shiny/, por SU
número: tools/reloaded_ids.py). Son el mismo dibujo con otra paleta, así que
píxel a píxel sale el mapa de colores normal -> shiny. Si el shiny está en otra
postura (Greedent, Barraskewda, Milcery), se estira al recuadro del normal y
cada color se queda con el shiny que más le cae encima. Si un Pokémon tiene
varias formas en Reloaded, se usa la de colores más parecidos a nuestra hoja.

Cada color de nuestras hojas busca el color del retrato más parecido (sobre
todo por tono) y se mueve igual que él (tono, saturación y brillo), para
conservar las sombras de SpriteCollab. El negro de los bordes y la
transparencia no se tocan. Se guarda en PNG con paleta como los demás shiny,
y la entrada de sprites-meta.js lleva "sh":1 y "rs":1 (shiny con colores de
Reloaded; tools/fetch_sprites.py la respeta al regenerar).
"""
import colorsys
import io
import math
import os
import sys
from collections import Counter, defaultdict

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_sprites import save_optimized              # noqa: E402
from import_reloaded import load_meta, save_meta      # noqa: E402
from reloaded_ids import reloaded_ids, portrait_paths  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets', 'pokemon')
REVIEW = os.path.join(ROOT, 'tools', 'cache', 'shiny-revision.png')
ANIMS = ['Idle', 'Walk', 'Attack', 'Shoot', 'Charge', 'Hurt', 'Faint']
SIN_SHINY = [588, 820, 847, 868, 896, 916, 933, 1007]
DARK = 48          # bordes: ningún canal pasa de aquí -> no se toca
ALIGNED = 0.95     # coincidencia de siluetas para comparar píxel a píxel


def pixels(im):
    return list(im.get_flattened_data() if hasattr(im, 'get_flattened_data') else im.getdata())


def opaque_mask(im):
    return [p[3] > 0 for p in pixels(im)]


def iou(a, b):
    both = sum(1 for x, y in zip(a, b) if x and y)
    return both / max(1, sum(a) + sum(b) - both)


def color_pairs(normal, shiny):
    """Mapa {color normal: color shiny} de los dos retratos."""
    if normal.size != shiny.size or iou(opaque_mask(normal), opaque_mask(shiny)) < ALIGNED:
        # Otra postura: el shiny, estirado al recuadro del normal.
        nb, sb = normal.getchannel('A').getbbox(), shiny.getchannel('A').getbbox()
        fit = shiny.crop(sb).resize((nb[2] - nb[0], nb[3] - nb[1]), Image.NEAREST)
        shiny = Image.new('RGBA', normal.size)
        shiny.paste(fit, nb[:2])
    votes = defaultdict(Counter)
    for p, q in zip(pixels(normal), pixels(shiny)):
        if p[3] and q[3]:
            votes[p[:3]][q[:3]] += 1
    return {c: v.most_common(1)[0][0] for c, v in votes.items()}, {c: sum(v.values()) for c, v in votes.items()}


def hsv(c):
    return colorsys.rgb_to_hsv(*(v / 255 for v in c))


def cone(c):
    h, s, v = hsv(c)
    r = s * v
    return (2 * r * math.cos(h * 2 * math.pi), 2 * r * math.sin(h * 2 * math.pi), 0.7 * v)


def nearest(c, keys):
    a = cone(c)
    return min(keys, key=lambda k: sum((x - y) ** 2 for x, y in zip(a, cone(k))))


def shift(c, k, t):
    """Mueve c como se movió k -> t (tono, saturación y brillo)."""
    h, s, v = hsv(c)
    hk, sk, vk = hsv(k)
    ht, st, vt = hsv(t)
    if sk < 0.12:                 # k sin color: el tono no dice nada, se copia el de t
        h2, s2 = ht, min(1, st * (0.6 + s))
    else:                         # el tono del shiny, con poca holgura (si no, un azul acaba rojo)
        dh = max(-0.04, min(0.04, (h - hk + 0.5) % 1 - 0.5))
        h2, s2 = (ht + dh) % 1, min(1, s * st / sk)
    v2 = min(1, v * vt / vk) if vk > 0.02 else vt
    return tuple(round(x * 255) for x in colorsys.hsv_to_rgb(h2, s2, v2))


def sheet_colors(dex):
    cols = Counter()
    for a in ANIMS:
        p = os.path.join(ASSETS, str(dex), a + '.png')
        if os.path.exists(p):
            cols.update(c[:3] for c in pixels(Image.open(p).convert('RGBA')) if c[3])
    return cols


def build_map(dex):
    """{color de nuestra hoja: color shiny}, nº de Reloaded usado y retratos."""
    ours = sheet_colors(dex)
    best = None
    for rid in reloaded_ids(dex):
        pn, ps = portrait_paths(rid)
        if not (os.path.exists(pn) and os.path.exists(ps)):
            continue
        normal, shiny = Image.open(pn).convert('RGBA'), Image.open(ps).convert('RGBA')
        pairs, weight = color_pairs(normal, shiny)
        # Forma más parecida a nuestra hoja: distancia media de nuestros colores a los suyos.
        keys = list(pairs)
        cost = sum(n * sum((x - y) ** 2 for x, y in zip(cone(c), cone(nearest(c, keys))))
                   for c, n in ours.items()) / max(1, sum(ours.values()))
        if best is None or cost < best[0]:
            best = (cost, rid, pairs, weight, normal, shiny)
    if not best:
        return None
    _, rid, pairs, weight, normal, shiny = best
    # Sólo los colores con presencia (no el antialias de un píxel suelto).
    keys = [c for c in pairs if weight[c] >= 3 and max(c) > DARK] or list(pairs)
    cmap = {}
    for c in ours:
        if max(c) <= DARK:
            continue
        k = nearest(c, keys)
        cmap[c] = shift(c, k, pairs[k])
    return cmap, rid, normal, shiny


def recolor(im, cmap):
    im = im.convert('RGBA')
    out = [(cmap.get(p[:3], p[:3]) + (p[3],)) if p[3] else p for p in pixels(im)]
    res = Image.new('RGBA', im.size)
    res.putdata(out)
    return res


def first_frame(dex, anim, meta, shiny_img=None):
    a = meta['a'][anim]
    im = shiny_img or Image.open(os.path.join(ASSETS, str(dex), anim + '.png')).convert('RGBA')
    return im.crop((0, 0, a['w'], a['h']))


def review(rows):
    """rows: [(dex, rid, normal_retrato, shiny_retrato, [(normal, shiny) por animación])].
    Una fila por Pokémon: retratos de Reloaded (x2) y luego cada animación,
    normal y shiny lado a lado (x4), recortadas a su dibujo."""
    def trim(a, b):
        box = a.getchannel('A').getbbox() or (0, 0, a.width, a.height)
        return a.crop(box), b.crop(box)

    def zoom(im, z):
        return im.resize((im.width * z, im.height * z), Image.NEAREST)

    lines = []
    for dex, rid, pn, ps, frames in rows:
        cells = [tuple(zoom(im, 2) for im in trim(pn, ps))]
        cells += [tuple(zoom(im, 4) for im in trim(a, b)) for a, b in frames]
        lines.append(cells)
    gap = 6
    W = max(sum(2 * c[0].width + gap + 3 * gap for c in cells) for cells in lines)
    hs = [max(c[0].height for c in cells) for cells in lines]
    out = Image.new('RGBA', (W + gap, sum(hs) + gap * (len(lines) + 1)), (176, 196, 176, 255))
    y = gap
    for cells, h in zip(lines, hs):
        x = gap
        for a, b in cells:
            out.alpha_composite(a, (x, y + h - a.height))
            out.alpha_composite(b, (x + a.width + gap, y + h - b.height))
            x += 2 * a.width + 4 * gap
        y += h + gap
    out.save(REVIEW)
    return REVIEW


def main():
    args = sys.argv[1:]
    apply = '--aplicar' in args
    dexes = [int(a) for a in args if a.isdigit()] or SIN_SHINY
    metas = load_meta()
    rows, updates = [], {}
    for dex in dexes:
        meta = metas.get(dex)
        if not meta:
            print(f'{dex}: no está en sprites-meta.js'); continue
        if meta.get('sh') and not meta.get('rs'):
            print(f'{dex}: ya tiene shiny de SpriteCollab, no se toca'); continue
        built = build_map(dex)
        if not built:
            print(f'{dex}: Reloaded no tiene sus retratos'); continue
        cmap, rid, pn, ps = built
        frames = []
        for anim in ANIMS:
            if anim not in meta['a']:
                continue
            src = os.path.join(ASSETS, str(dex), anim + '.png')
            sh = recolor(Image.open(src), cmap)
            frames.append((first_frame(dex, anim, meta), first_frame(dex, anim, meta, sh)))
            if apply:
                os.makedirs(os.path.join(ASSETS, str(dex), 's'), exist_ok=True)
                buf = io.BytesIO()
                sh.save(buf, 'PNG')
                save_optimized(buf.getvalue(), os.path.join(ASSETS, str(dex), 's', anim + '.png'))
        rows.append((dex, rid, pn, ps, frames))
        print(f'{dex}: Reloaded {rid}, {len(cmap)} colores')
        if apply:
            updates[dex] = dict(meta, sh=1, rs=1)
    if rows:
        os.makedirs(os.path.dirname(REVIEW), exist_ok=True)
        print('Hoja de revisión:', review(rows))
    if updates:
        save_meta(updates)
        print(f'sprites-meta.js: sh:1 en {sorted(updates)}')


if __name__ == '__main__':
    main()
