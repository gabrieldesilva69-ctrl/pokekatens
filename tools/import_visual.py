#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Material visual de Pokémon Edición Reloaded (de F3R, https://pokemon-reloaded.blogspot.com)
para el juego (unidad 8 de docs/IDEAS-RELOADED.md). Sólo lo que se usa, ligero:

    python tools/import_visual.py --iconos     # Físico / Especial / Estado -> assets/ui/cat-*.png
    python tools/import_visual.py --retratos   # retratos 96x96 -> assets/portraits/<dex>.png (+ s/ shiny)
    python tools/import_visual.py --cajas      # fondos de caja, uno por región -> assets/ui/box/<gen>.png
    python tools/import_visual.py --arenas     # suelo de la arena de las grietas, uno por tipo -> assets/arenas/<tipo>.jpg
    python tools/import_visual.py --entrenadores  # avatares de entrenador -> assets/trainers/<n>.gif y js/data/avatars.js
    python tools/import_visual.py --todo       # todo lo anterior

- Iconos: image/at_fisico.png, at_especial.png y at_estado.png son de 240x180 con el
  icono (22x15) en el centro sobre negro: se recorta.
- Retratos: pkmn/<archivo>.gif y pkmn_shiny/<archivo>.gif (tools/reloaded_ids.py:
  portrait_paths). Sólo los Pokémon de js/data/pokedex.js (los oficiales del juego);
  cada uno se busca por su nombre, no por número. PNG con paleta, ~2-4 KB.
- Cajas: caja/<n>.gif (156x141, con su franja de título arriba). Se usa el dibujo de
  la caja (sin la franja ni el marco) como fondo de la colección; cuál de cada región va en BOXES.
- Arenas: battleback/realistic/<n>.gif son campos de combate vistos desde arriba (576x324).
  Uno por tipo (ARENAS; el centro tiene que ser suelo que se pisa) y el de la Sentencia de
  Arceus, en JPG (~40-70 KB). Lo pinta js/world/world.js bajo la arena del legendario.
- Entrenadores: trainer/<n>.gif (GIF animados, ~67x81). TRAINERS es la lista que han
  revisado los dueños (sólo personajes oficiales: ni Pokémon sueltos ni dudosos), en el orden
  del selector; el avatar n (1-60) es TRAINERS[n-1]. Se copian tal cual (ya son ligeros).
"""
import io
import os
import re
import sys

from PIL import Image, ImageChops

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_sprites import save_optimized                        # noqa: E402
from reloaded_ids import DATA, POKEDEX, portrait_paths, reloaded_ids  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UI = os.path.join(ROOT, 'assets', 'ui')
PORTRAITS = os.path.join(ROOT, 'assets', 'portraits')

CATS = {'physical': 'at_fisico', 'special': 'at_especial', 'status': 'at_estado'}
# Fondo de la colección por región (0 = "Todas"): caja/<n>.gif de Reloaded.
BOXES = {0: 17, 1: 1, 2: 33, 3: 10, 4: 7, 5: 22, 6: 13, 7: 9, 8: 21, 9: 26}
# Suelo de la arena por tipo (y el de la Sentencia de Arceus): battleback/realistic/<n>.gif.
ARENAS = {'normal': 1, 'fire': 69, 'water': 1004, 'grass': 181, 'electric': 98, 'ice': 61,
          'fighting': 91, 'poison': 35, 'ground': 23, 'flying': 153, 'psychic': 31, 'bug': 186,
          'rock': 6, 'ghost': 207, 'dragon': 92, 'dark': 16, 'steel': 37, 'fairy': 3012,
          'judgment': 3009}
ARENA_Q = 82           # calidad del JPG
# Avatares (24-10-2026, revisados por los dueños: fuera los #11, #12, #50, #53 y #61 de su hoja).
# No se cambia el orden: el número que se guarda en el perfil es la posición (1 = el primero).
TRAINERS = ['1', '20', '81', '107', '108', '133', '134', '135', '137', '138', '2008', '2101',
            '2102', '2103', '2104', '2105', '2106', '2107', '2108', '2201', '2202', '2203', '2204',
            '2205', '2206', '2207', '2208', '2301', '2302', '2303', '2304', '2305', '2306', '2307',
            '2308', '2309', '2401', '2402', '2403', '2404', '2405', '2406', '2407', '2408', '3002',
            '3004', '3005', '3007', '3008', '3014', '3015', '3016', '3020', '3025', '3026', '3027',
            '4008', '4009', '4010', '4011']
BOX_IN = (5, 30, 5, 5)  # se quitan la franja de título (arriba) y el marco: izq., arriba, der., abajo


def png(im):
    b = io.BytesIO()
    im.save(b, 'PNG')
    return b.getvalue()


def iconos():
    os.makedirs(UI, exist_ok=True)
    for cat, f in CATS.items():
        im = Image.open(os.path.join(DATA, 'image', f + '.png')).convert('RGB')
        bb = ImageChops.difference(im, Image.new('RGB', im.size, im.getpixel((0, 0)))).getbbox()
        w, h = save_optimized(png(im.crop(bb).convert('RGBA')), os.path.join(UI, f'cat-{cat}.png'))
        print(f'  {cat}: {w}x{h}')


def dex_list():
    out = []
    for line in io.open(POKEDEX, encoding='utf-8'):
        m = re.search(r'"dex":(\d+),', line)
        if m and int(m.group(1)) <= 1025:
            out.append(int(m.group(1)))
    return sorted(set(out))


def portrait(path):
    """Primer fotograma (96x96) con su transparencia; None si está vacío."""
    im = Image.open(path)
    im.seek(0)
    im = im.convert('RGBA')
    return im if im.getbbox() else None


def retratos():
    os.makedirs(os.path.join(PORTRAITS, 's'), exist_ok=True)
    done = shiny = 0
    miss = []
    for dex in dex_list():
        ids = reloaded_ids(dex)
        if not ids:
            miss.append(dex)
            continue
        n, s = portrait_paths(ids[0])
        if not os.path.exists(n):
            miss.append(dex)
            continue
        im = portrait(n)
        if im is None:
            miss.append(dex)
            continue
        save_optimized(png(im), os.path.join(PORTRAITS, f'{dex}.png'))
        done += 1
        if os.path.exists(s):
            si = portrait(s)
            if si is not None:
                save_optimized(png(si), os.path.join(PORTRAITS, 's', f'{dex}.png'))
                shiny += 1
    kb = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(PORTRAITS) for f in fs) // 1024
    print(f'  retratos: {done} normales, {shiny} shiny, {kb} KB; sin retrato: {miss}')


def cajas():
    out = os.path.join(UI, 'box')
    os.makedirs(out, exist_ok=True)
    for gen, n in BOXES.items():
        im = Image.open(os.path.join(DATA, 'caja', f'{n}.gif')).convert('RGBA')
        l, t, r, b = BOX_IN
        body = im.crop((l, t, im.width - r, im.height - b))
        w, h = save_optimized(png(body), os.path.join(out, f'{gen}.png'))
        print(f'  región {gen}: caja {n} ({w}x{h})')


def arenas():
    out = os.path.join(ROOT, 'assets', 'arenas')
    os.makedirs(out, exist_ok=True)
    kb = 0
    for t, n in ARENAS.items():
        im = Image.open(os.path.join(DATA, 'battleback', 'realistic', f'{n}.gif')).convert('RGB')
        f = os.path.join(out, f'{t}.jpg')
        im.save(f, 'JPEG', quality=ARENA_Q, optimize=True, progressive=True)
        kb += os.path.getsize(f)
        print(f'  {t}: battleback {n} ({os.path.getsize(f) // 1024} KB)')
    print(f'  arenas: {kb // 1024} KB')


def entrenadores():
    import shutil
    assert len(TRAINERS) == len(set(TRAINERS)) == 60
    out = os.path.join(ROOT, 'assets', 'trainers')
    os.makedirs(out, exist_ok=True)
    kb = 0
    for i, n in enumerate(TRAINERS, 1):
        f = os.path.join(out, f'{i}.gif')
        shutil.copyfile(os.path.join(DATA, 'trainer', f'{n}.gif'), f)
        kb += os.path.getsize(f)
    js = os.path.join(ROOT, 'js', 'data', 'avatars.js')
    with io.open(js, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('/* ============ avatars.js — avatares de entrenador de Pokémon Edición Reloaded (de F3R) ============\n'
                 ' * Generado por tools/import_visual.py --entrenadores: no editar a mano.\n'
                 ' * El avatar n (1..AVATARS) es assets/trainers/<n>.gif; 0 = sin avatar.\n */\n')
        fh.write(f'G.AVATARS = {len(TRAINERS)};\n')
    print(f'  entrenadores: {len(TRAINERS)} ({kb // 1024} KB) y js/data/avatars.js')


def main():
    a = set(sys.argv[1:])
    if not a or not a <= {'--iconos', '--retratos', '--cajas', '--arenas', '--entrenadores', '--todo'}:
        sys.exit(__doc__)
    if not os.path.isdir(DATA):
        sys.exit(f'No encuentro la carpeta de Reloaded: {DATA}')
    if a & {'--iconos', '--todo'}:
        iconos()
    if a & {'--retratos', '--todo'}:
        retratos()
    if a & {'--cajas', '--todo'}:
        cajas()
    if a & {'--arenas', '--todo'}:
        arenas()
    if a & {'--entrenadores', '--todo'}:
        entrenadores()


if __name__ == '__main__':
    main()
