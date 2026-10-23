#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convierte los sprites de mapa de Pokémon Edición Reloaded (de F3R,
https://pokemon-reloaded.blogspot.com) al formato del juego: hojas PMD en
assets/pokemon/<id>/ (+ s/ con el shiny) y su entrada en js/data/sprites-meta.js,
marcada con "rl":1 (para los créditos y para que fetch_sprites.py la respete).

    python tools/import_reloaded.py --mega 6          # una mega (normal y shiny) -> 100006
    python tools/import_reloaded.py --megas           # todas las megas oficiales que tenga Reloaded
    python tools/import_reloaded.py --dex 25          # un Pokémon (sólo normal; su shiny de mapa, file_id(N, True), aún no se convierte)
    python tools/import_reloaded.py --faltan          # los de 1-1025 que aún no tenemos

    --out DIR   carpeta de prueba: escribe DIR/<id>/ y DIR/sprites-meta-prueba.js
                sin tocar assets/ ni js/data/sprites-meta.js
    --id N      con --dex, el número con el que se guarda (pruebas lado a lado)
    --escala K  escala fija en vez de la automática

Nunca sustituye un Pokémon que ya tenemos de SpriteCollab (los que están en
sprites-meta.js sin "rl"). La carpeta de Reloaded no se sube nunca (.gitignore).

Formato .gmspr (GameMaker 8): 8 bytes de cabecera + zlib. Dentro, u32 versión
(800), origen x, origen y, nº de fotogramas; y por fotograma u32 versión, ancho,
alto, largo + píxeles BGRA.
  P<id>_<d>   direcciones como el teclado numérico (2 abajo, 8 arriba, 4 izq.,
              6 der., diagonales), 3-8 fotogramas; si falta la izquierda, en espejo
  P<id>_A     atacar (una sola dirección) · _H recibir golpe · _S tumbado
  ids: los de Reloaded, que NO son los nacionales a partir del 494 (mete formas
  y Pokémon inventados por medio). Archivo P<n>: hasta el 1000, N normal y
  1000+N shiny; del 1001 en adelante, N+1000 y N+2000 (file_id de
  reloaded_ids.py). 100000+N mega y 101000+N mega shiny. Cada Pokémon se busca por su nombre con tools/reloaded_ids.py; en
  el juego se guarda con el nacional (mega: 100000 + nacional).

El origen del .gmspr es el centro del dibujo y es el mismo en todas las
animaciones de un Pokémon: con él se alinean (x del ancla = x del origen). Los
pies quedan debajo: el y del ancla es el pixel opaco más bajo de andar hacia
abajo menos FOOT (como el centro de la sombra en SpriteCollab).

Tamaño: medido el 23-10-2026 con las 966 especies que están en las dos fuentes
(emparejadas por nombre), el alto en Reloaded es el mismo que en SpriteCollab
(mediana 1,0; el 80 % entre 0,89 y 1,12) pero varía por especie (Pikachu 21 px
frente a 25; Charizard 34 frente a 26). Si tenemos la
especie (o, para una mega, su forma normal) de SpriteCollab, se escala para
que mida lo mismo que la nuestra; si no, se deja tal cual. Siempre con vecino
más próximo, y si la diferencia es menor del 8 % no se escala.
"""
import argparse
import io
import json
import os
import re
import struct
import sys
import zlib

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_sprites import save_optimized   # noqa: E402  (mismo PNG con paleta)
from reloaded_ids import reloaded_ids, national_of, file_id   # noqa: E402  (su numeración no es la nacional)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RELOADED = os.path.join(ROOT, 'Proyecto Reloaded The Last Beta 1.9.2.2 Full', 'data', 'pkmnbattle')
ASSETS = os.path.join(ROOT, 'assets', 'pokemon')
META = os.path.join(ROOT, 'js', 'data', 'sprites-meta.js')

MEGA, MEGA_SHINY = 100000, 101000
FOOT = 2            # píxeles de arte entre el pixel más bajo y el ancla
SNAP = 0.08         # diferencia de tamaño por debajo de la cual no se escala

# Megas oficiales (X/Y, Rubí Omega/Zafiro Alfa y Leyendas Z-A), por su Pokémon.
# Fuera las inventadas de Reloaded y las que los dueños han decidido no usar
# (docs/IDEAS-RELOADED.md): Raichu X/Y, Garchomp Z, Lucario Z, Absol Z,
# Darkrai, Meganium.
OFFICIAL_MEGAS = sorted({
    # X/Y y Rubí Omega/Zafiro Alfa
    3, 6, 9, 15, 18, 65, 80, 94, 115, 127, 130, 142, 150, 181, 208, 212, 214,
    229, 248, 254, 257, 260, 282, 302, 303, 306, 308, 310, 319, 323, 334, 354,
    359, 362, 373, 376, 380, 381, 384, 428, 445, 448, 460, 475, 531, 719,
    # Leyendas Z-A
    36, 71, 121, 149, 160, 227, 478, 500, 530, 545, 560, 604, 609, 652, 655,
    658, 668, 670, 687, 689, 691, 701, 718, 780, 870,
})

# Filas del juego (0 Down · 1 DownRight · 2 Right · 3 UpRight · 4 Up ·
# 5 UpLeft · 6 Left · 7 DownLeft) -> dirección de Reloaded y, si falta,
# la de enfrente para sacarla en espejo.
ROWS = [('2', None), ('3', None), ('6', None), ('9', None),
        ('8', None), ('7', '9'), ('4', '6'), ('1', '3')]
LEFT_ROWS = {5, 6, 7}

# Duraciones (1/60 s): como la mediana de las de SpriteCollab.
DUR = {
    'Idle': lambda n: [60] * n,
    'Walk': lambda n: [max(6, round(36 / n))] * n,
    'Attack': lambda n: _spread(24, n),
    'Shoot': lambda n: _spread(27, n),
    'Charge': lambda n: _spread(20, n),
    'Hurt': lambda n: _spread(10, n),
    'Faint': lambda n: _spread(10, n),
}


def _spread(total, n):
    base = [total // n] * n
    for i in range(total - sum(base)):
        base[(n // 2 + i) % n] += 1      # lo que sobra, a los del medio
    return base


# ---------------- lectura del .gmspr ----------------

def read_gmspr(path):
    """-> (frames [Image RGBA], ox, oy) o None si no existe."""
    if not os.path.exists(path):
        return None
    raw = zlib.decompress(open(path, 'rb').read()[8:])
    _, ox, oy, n = struct.unpack_from('<4I', raw, 0)
    p, frames = 16, []
    for _ in range(n):
        _, w, h, ln = struct.unpack_from('<4I', raw, p)
        p += 16
        frames.append(Image.frombytes('RGBA', (w, h), raw[p:p + ln], 'raw', 'BGRA'))
        p += ln
    return frames, ox, oy


def gm(rid, suffix):
    return read_gmspr(os.path.join(RELOADED, f'P{rid}_{suffix}.gmspr'))


def opaque_box(im):
    return im.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox()


# ---------------- montaje ----------------

class Clip:
    """Fotogramas de una fila con su origen (ya en espejo y escalados)."""

    def __init__(self, frames, ox, oy, mirror=False, k=1.0):
        if mirror:
            frames = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in frames]
            ox = frames[0].width - ox
        if k != 1.0:
            frames = [f.resize((max(1, round(f.width * k)), max(1, round(f.height * k))), Image.NEAREST)
                      for f in frames]
            ox, oy = round(ox * k), round(oy * k)
        self.frames, self.ox, self.oy = frames, ox, oy


def directions(rid, k):
    """Las 8 filas de andar (o None si falta lo básico)."""
    rows = []
    for d, mirror_of in ROWS:
        g = gm(rid, d)
        if g:
            rows.append(Clip(*g, k=k))
            continue
        g = gm(rid, mirror_of) if mirror_of else None
        if not g:
            return None
        rows.append(Clip(*g, mirror=True, k=k))
    return rows


def one_way(rid, suffix, k):
    """Animación de una sola dirección repetida en las 8 filas (espejo a la izquierda)."""
    g = gm(rid, suffix)
    if not g:
        return None
    a, b = Clip(*g, k=k), Clip(*g, mirror=True, k=k)
    return [b if r in LEFT_ROWS else a for r in range(8)]


def build_sheet(rows, name, foot, path):
    """Junta las filas en una hoja alineada por el origen. Devuelve su geometría."""
    n = max(len(c.frames) for c in rows)
    L = max(c.ox for c in rows for f in c.frames)
    R = max(f.width - c.ox for c in rows for f in c.frames)
    T = max(c.oy for c in rows for f in c.frames)
    B = max(f.height - c.oy for c in rows for f in c.frames)
    B = max(B, foot + 1)                      # que el ancla quepa en el fotograma
    w, h = L + R, T + B
    sheet = Image.new('RGBA', (w * n, h * 8))
    for r, c in enumerate(rows):
        for i in range(n):
            f = c.frames[i % len(c.frames)]   # filas más cortas: se repiten
            sheet.alpha_composite(f, (i * w + L - c.ox, r * h + T - c.oy))
    buf = io.BytesIO()
    sheet.save(buf, 'PNG')
    save_optimized(buf.getvalue(), path)
    return {'w': w, 'h': h, 'n': n, 'r': 8, 'd': DUR[name](n), 'ax': float(L), 'ay': float(T + foot)}


def convert(rid, out_dir, k):
    """Convierte un id de Reloaded a out_dir. -> (meta de animaciones, ShadowSize) o None."""
    walk = directions(rid, k)
    attack = one_way(rid, 'A', k)
    if not walk or not attack:
        return None
    hurt = one_way(rid, 'H', k)
    faint = one_way(rid, 'S', k)
    if not faint and hurt:
        # Sin "tumbado": el último fotograma del golpe hace de debilitado.
        faint = [Clip([c.frames[-1]], c.ox, c.oy) for c in hurt]
    idle = [Clip(c.frames[:1], c.ox, c.oy) for c in walk]

    # Pies: el pixel opaco más bajo andando hacia abajo, respecto al origen.
    down = walk[0]
    foot = max(opaque_box(f)[3] for f in down.frames) - down.oy - FOOT

    os.makedirs(out_dir, exist_ok=True)
    anims = {}
    for name, rows in (('Idle', idle), ('Walk', walk), ('Attack', attack), ('Shoot', attack),
                       ('Charge', attack), ('Hurt', hurt or idle), ('Faint', faint or idle)):
        anims[name] = build_sheet(rows, name, foot, os.path.join(out_dir, name + '.png'))

    bb = opaque_box(idle[0].frames[0])
    width = bb[2] - bb[0]
    shadow = 2 if width >= 24 else 1 if width >= 12 else 0
    return anims, shadow


# ---------------- tamaño ----------------

def our_height(dex, metas):
    m = metas.get(dex)
    if not m or m.get('rl'):
        return None
    a = m['a']['Walk']
    im = Image.open(os.path.join(ASSETS, str(dex), 'Walk.png')).convert('RGBA')
    bb = opaque_box(im.crop((0, 0, a['w'], a['h'])))
    return bb[3] - bb[1] if bb else None


def reloaded_height(rid):
    g = gm(rid, '2')
    if not g:
        return None
    bb = opaque_box(g[0][0])
    return bb[3] - bb[1] if bb else None


def base_rid(dex):
    """Número de Reloaded de la forma base de ese Pokémon nacional (None si no está)."""
    ids = reloaded_ids(dex)
    return ids[0] if ids else None


def auto_scale(base_dex, metas):
    """Escala para que mida como nuestra versión de SpriteCollab (1 si no la hay)."""
    rid = base_rid(base_dex)
    ours, theirs = our_height(base_dex, metas), (reloaded_height(file_id(rid)) if rid else None)
    if not ours or not theirs:
        return 1.0
    k = ours / theirs
    return 1.0 if abs(k - 1) < SNAP else round(k, 3)


# ---------------- sprites-meta.js ----------------

LINE = re.compile(r'^  (\d+): (\{.*\}),$')


def load_meta():
    metas = {}
    with io.open(META, encoding='utf-8') as f:
        for line in f:
            m = LINE.match(line.rstrip('\n'))
            if m:
                metas[int(m.group(1))] = json.loads(m.group(2))
    return metas


def save_meta(updates):
    """Pone (o cambia) esas entradas en sprites-meta.js respetando el resto."""
    with io.open(META, encoding='utf-8') as f:
        lines = f.read().split('\n')
    start = lines.index('G.SPRITE_META = {') + 1
    end = lines.index('};', start)
    entries = {}
    for line in lines[start:end]:
        m = LINE.match(line)
        if m:
            entries[int(m.group(1))] = line
    for dex, meta in updates.items():
        entries[dex] = f'  {dex}: {json.dumps(meta, separators=(",", ":"))},'
    body = [entries[d] for d in sorted(entries)]
    text = '\n'.join(lines[:start] + body + lines[end:])
    with io.open(META, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)


# ---------------- trabajos ----------------

def job_dex(dex, gid, out, metas, k):
    if out == ASSETS and dex in metas and not metas[dex].get('rl'):
        print(f'  {dex}: ya lo tenemos de SpriteCollab, no se sustituye')
        return None
    rid = base_rid(dex)
    if rid is None:
        print(f'  {dex}: no está en Reloaded')
        return None
    k = auto_scale(dex, metas) if k is None else k
    res = convert(file_id(rid), os.path.join(out, str(gid)), k)
    if not res:
        print(f'  {dex} (Reloaded {rid}): no tiene sus sprites de mapa completos')
        return None
    anims, shadow = res
    print(f'  {dex} (Reloaded {rid}) -> {gid} (escala {k})')
    return {'s': shadow, 'a': anims, 'rl': 1}


def mega_rid(dex, have):
    """Número de Reloaded que lleva la mega de ese Pokémon: el de la forma base o,
    si no, el de una de sus formas (Floette Flor Eterna, Zygarde...)."""
    return next((rid for rid in reloaded_ids(dex) if rid in have), None)


def job_mega(dex, out, metas, k, have):
    gid = MEGA + dex                                    # en el juego, por su número nacional
    rid = mega_rid(dex, have)
    if rid is None:
        print(f'  Mega {dex}: no esta en Reloaded')
        return None
    k = auto_scale(dex, metas) if k is None else k     # como su forma normal
    res = convert(MEGA + rid, os.path.join(out, str(gid)), k)
    if not res:
        print(f'  Mega {dex} (Reloaded {MEGA + rid}): sprites incompletos')
        return None
    anims, shadow = res
    meta = {'s': shadow, 'a': anims, 'rl': 1}
    sres = convert(MEGA_SHINY + rid, os.path.join(out, str(gid), 's'), k)
    if sres:
        meta['sh'] = 1
        diff = {a: g for a, g in sres[0].items() if anims.get(a) != g}
        if diff:
            meta['sa'] = diff
    print(f'  Mega {dex} (Reloaded {MEGA + rid}) -> {gid} (escala {k}{", con shiny" if sres else ", sin shiny"})')
    return meta


def reloaded_megas():
    """Números de Reloaded (los suyos, no los nacionales) que tienen mega."""
    ids = set()
    for fn in os.listdir(RELOADED):
        m = re.match(r'P(\d+)_', fn)
        if m and MEGA < int(m.group(1)) < MEGA_SHINY:
            ids.add(int(m.group(1)) - MEGA)
    return ids


def main():
    ap = argparse.ArgumentParser(description='Sprites de mapa de Pokémon Edición Reloaded -> assets/pokemon/')
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--mega', type=int, metavar='N', help='la mega de ese Pokémon (normal y shiny)')
    g.add_argument('--megas', action='store_true', help='todas las megas oficiales que tenga Reloaded')
    g.add_argument('--dex', type=int, metavar='N', help='un Pokémon (sólo normal)')
    g.add_argument('--faltan', action='store_true', help='los de 1-1025 que no tenemos')
    ap.add_argument('--out', help='carpeta de prueba (no toca assets/ ni sprites-meta.js)')
    ap.add_argument('--id', type=int, help='con --dex: número con el que se guarda')
    ap.add_argument('--escala', type=float, help='escala fija en vez de la automática')
    args = ap.parse_args()

    if not os.path.isdir(RELOADED):
        sys.exit(f'No encuentro la carpeta de Reloaded: {RELOADED}')
    out = os.path.abspath(args.out) if args.out else ASSETS
    metas = load_meta()
    done = {}

    if args.mega is not None or args.megas:
        have = reloaded_megas()
        wanted = [args.mega] if args.mega is not None else OFFICIAL_MEGAS
        for dex in wanted:
            if dex not in OFFICIAL_MEGAS:
                print(f'  Mega {dex}: no es una mega oficial, se descarta')
                continue
            meta = job_mega(dex, out, metas, args.escala, have)
            if meta:
                done[MEGA + dex] = meta
        if args.megas:
            print(f'Oficiales sin sprite en Reloaded: {[d for d in OFFICIAL_MEGAS if mega_rid(d, have) is None]}')
            used = {mega_rid(d, have) for d in OFFICIAL_MEGAS}
            extra = sorted(have - used)
            print('De Reloaded descartadas (no oficiales): '
                  + ', '.join(f'{r} (nacional {national_of(r) or "-"})' for r in extra))
            print('Ojo: Reloaded solo trae Mega Charizard X (su _ALT es otra Mega X, mas pequena)'
                  ' y una sola Mega Mewtwo; las _ALT no se usan.')
    else:
        if args.dex is not None:
            dexes = [args.dex]
        else:
            dexes = [d for d in range(1, 1026) if d not in metas]
        for dex in dexes:
            gid = args.id if args.id and args.dex is not None else dex
            meta = job_dex(dex, gid, out, metas, args.escala)
            if meta:
                done[gid] = meta

    if not done:
        print('Nada convertido.')
        return
    if out == ASSETS:
        save_meta(done)
        print(f'{len(done)} entradas en js/data/sprites-meta.js')
    else:
        path = os.path.join(out, 'sprites-meta-prueba.js')
        if os.path.exists(path):                     # junta con lo de pasadas anteriores
            with io.open(path, encoding='utf-8') as f:
                for line in f:
                    m = LINE.match(line.rstrip('\n'))
                    if m and int(m.group(1)) not in done:
                        done[int(m.group(1))] = json.loads(m.group(2))
        with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write('/* Prueba de tools/import_reloaded.py: se carga a mano, no va en el juego. */\n')
            f.write('Object.assign(G.SPRITE_META, {\n')
            for d in sorted(done):
                f.write(f'  {d}: {json.dumps(done[d], separators=(",", ":"))},\n')
            f.write('});\n')
        print(f'{len(done)} convertidos en {out} (metadatos en {os.path.basename(path)})')


if __name__ == '__main__':
    main()
