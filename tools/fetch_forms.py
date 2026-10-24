#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Formas especiales de SpriteCollab (normal y shiny) que el juego usa como si
fueran megas: hoy, Kyogre y Groudon primigenios.

    python tools/fetch_forms.py

Cada forma se guarda en assets/pokemon/<100000 + dex>/ (como las megas, ver
js/systems/mega.js) con su entrada en js/data/sprites-meta.js marcada con
"fm":1, para que tools/fetch_sprites.py la respete al regenerar.

Fuente: https://github.com/PMDCollab/SpriteCollab (CC BY-NC 4.0), carpeta
sprite/<dex>/<forma>/ y su shiny en sprite/<dex>/<forma>/0001/. Sus artistas
salen en CREDITS.md con tools/fetch_credits.py (que también mira estas carpetas).
Las primigenias no traen animación de caer: se usa la de dormir (Sleep).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fetch_sprites as fs                     # noqa: E402  (mismo formato y PNG con paleta)
from import_reloaded import load_meta, save_meta   # noqa: E402

MEGA = 100000
# id en el juego -> (dex, forma de SpriteCollab)
FORMS = {
    MEGA + 382: (382, '0001'),     # Kyogre primigenio
    MEGA + 383: (383, '0001'),     # Groudon primigenio
}


def one(gid, dex, form):
    base = f'{fs.BASE}/{dex:04d}/{form}'
    xml = fs.fetch(base + '/AnimData.xml')
    if not xml:
        print(f'  {gid}: SpriteCollab no tiene {dex:04d}/{form}')
        return None
    anims, shadow = fs.parse_animdata(xml.decode('utf-8', 'replace'))
    out = os.path.join(fs.OUT_ASSETS, str(gid))
    normal = fs.download_set(base, out, anims)
    if not fs.REQUIRED <= set(normal):
        print(f'  {gid}: le faltan animaciones ({sorted(normal)})')
        return None
    meta = {'s': shadow, 'a': normal, 'fm': 1}
    sxml = fs.fetch(base + '/0001/AnimData.xml')
    if sxml:
        sanims = fs.parse_animdata(sxml.decode('utf-8', 'replace'))[0]
        shiny = fs.download_set(base + '/0001', os.path.join(out, 's'), sanims, normal)
        if fs.REQUIRED <= set(shiny):
            meta['sh'] = 1
            diff = {k: v for k, v in shiny.items() if normal.get(k) != v}
            if diff:
                meta['sa'] = diff
            miss = [k for k in normal if k not in shiny]
            if miss:
                meta['sm'] = miss
    print(f'  {gid} ({dex:04d}/{form}): {", ".join(normal)}{" + shiny" if meta.get("sh") else ""}')
    return meta


def main():
    # Sin animación de caer: la de dormir, antes que la de recibir un golpe.
    fs.FALLBACK['Faint'] = ['Sleep'] + fs.FALLBACK['Faint']
    load_meta()
    done = {}
    for gid, (dex, form) in FORMS.items():
        meta = one(gid, dex, form)
        if meta:
            done[gid] = meta
    if done:
        save_meta(done)
        print(f'{len(done)} formas en js/data/sprites-meta.js')


if __name__ == '__main__':
    main()
