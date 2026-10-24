#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Material visual de Pokémon Edición Reloaded (de F3R, https://pokemon-reloaded.blogspot.com)
para el juego (unidad 8 de docs/IDEAS-RELOADED.md). Sólo lo que se usa, ligero:

    python tools/import_visual.py --cajas      # fondos de caja, uno por región -> assets/ui/box/<gen>.png
    python tools/import_visual.py --arenas     # suelo de la arena de algunos tipos -> assets/arenas/ y js/data/arenas.js
    python tools/import_visual.py --entrenadores  # avatares de entrenador -> assets/trainers/<n>.gif y js/data/avatars.js
    python tools/import_visual.py --todo       # todo lo anterior

(Los retratos y los iconos Físico / Especial / Estado se probaron el 24-10-2026 y los dueños
prefirieron quitarlos: el juego vuelve a enseñar sus sprites y las etiquetas de texto.)
- Cajas: caja/<n>.gif (156x141, con su franja de título arriba). Se usa el dibujo de
  la caja (sin la franja ni el marco) como fondo de la colección; cuál de cada región va en BOXES.
- Arenas: campos de combate vistos desde arriba. battleback/traditional/<n>.gif es la versión
  pixel art (416x320, la que encaja con el juego: se guarda en PNG y se pinta a su tamaño, sin
  suavizar) y battleback/realistic/<n>.gif la pintada (576x324, JPG; sólo la playa del agua, que
  a los dueños sí les gusta). Los tipos que no están en ARENAS usan el suelo de siempre del juego.
  Lo pinta js/world/world.js bajo la arena del legendario (js/data/arenas.js dice cuál y cómo).
- Entrenadores: trainer/<n>.gif (GIF animados, ~67x81). TRAINERS es la lista que han
  revisado los dueños (sólo personajes oficiales: ni Pokémon sueltos ni dudosos), en el orden
  del selector; el avatar n (1-60) es TRAINERS[n-1]. Se copian tal cual (ya son ligeros).
"""
import io
import os
import re
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_sprites import save_optimized                        # noqa: E402
from reloaded_ids import DATA                                     # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UI = os.path.join(ROOT, 'assets', 'ui')

# Fondo de la colección por región (0 = "Todas"): caja/<n>.gif de Reloaded.
BOXES = {0: 17, 1: 1, 2: 33, 3: 10, 4: 7, 5: 22, 6: 13, 7: 9, 8: 21, 9: 26}
# Suelo de la arena por tipo: (carpeta, n). 'traditional' = pixel art; 'realistic' = pintado.
# (24-10-2026: los dueños quitaron los pintados que no encajaban con el pixel art del juego; normal,
# veneno, volador, psíquico, siniestro y la Sentencia de Arceus usan el suelo de siempre.)
ARENAS = {'water': ('realistic', 1004), 'fire': ('traditional', 198), 'grass': ('traditional', 184),
          'electric': ('traditional', 163), 'ice': ('traditional', 179), 'fighting': ('traditional', 192),
          'ground': ('traditional', 182), 'bug': ('traditional', 241), 'rock': ('traditional', 169),
          'ghost': ('traditional', 199), 'dragon': ('traditional', 201), 'steel': ('traditional', 171),
          'fairy': ('traditional', 185)}
ARENA_Q = 82           # calidad del JPG (los pintados)
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
    keep, kb, js = set(), 0, {}
    for t, (kind, n) in ARENAS.items():
        im = Image.open(os.path.join(DATA, 'battleback', kind, f'{n}.gif'))
        if kind == 'realistic':
            f = f'{t}.jpg'
            im.convert('RGB').save(os.path.join(out, f), 'JPEG', quality=ARENA_Q, optimize=True, progressive=True)
        else:
            f = f'{t}.png'
            save_optimized(png(im.convert('RGBA')), os.path.join(out, f))
        keep.add(f)
        js[t] = f'{{ f: \'{f}\', px: {0 if kind == "realistic" else 1} }}'
        size = os.path.getsize(os.path.join(out, f))
        kb += size
        print(f'  {t}: {kind} {n} ({size // 1024} KB)')
    for f in os.listdir(out):                       # los que ya no se usan
        if f not in keep:
            os.remove(os.path.join(out, f))
            print(f'  fuera: {f}')
    with io.open(os.path.join(ROOT, 'js', 'data', 'arenas.js'), 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('/* ============ arenas.js — suelo de las arenas de Pokémon Edición Reloaded (de F3R) ============\n'
                 ' * Generado por tools/import_visual.py --arenas: no editar a mano.\n'
                 ' * assets/arenas/<f>; px: 1 = pixel art (a su tamaño, sin suavizar), 0 = pintado (cubre la arena).\n'
                 ' * Los tipos que no están usan el suelo de siempre (js/world/tiles.js).\n */\n')
        fh.write('G.ARENA_ART = {\n' + ',\n'.join(f'  {t}: {v}' for t, v in js.items()) + '\n};\n')
    print(f'  arenas: {kb // 1024} KB y js/data/arenas.js')


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
    if not a or not a <= {'--cajas', '--arenas', '--entrenadores', '--todo'}:
        sys.exit(__doc__)
    if not os.path.isdir(DATA):
        sys.exit(f'No encuentro la carpeta de Reloaded: {DATA}')
    if a & {'--cajas', '--todo'}:
        cajas()
    if a & {'--arenas', '--todo'}:
        arenas()
    if a & {'--entrenadores', '--todo'}:
        entrenadores()


if __name__ == '__main__':
    main()
