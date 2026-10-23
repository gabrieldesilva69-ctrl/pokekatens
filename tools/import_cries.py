#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gritos de Pokémon Edición Reloaded (de F3R, https://pokemon-reloaded.blogspot.com)
-> assets/cries/<nº nacional>.mp3 y js/data/cries.js (los que no tienen grito).

    python tools/import_cries.py            # los Pokémon que hay en el juego (sprites-meta.js)
    python tools/import_cries.py 25 6 1007  # sólo esos (para probar)

Necesita ffmpeg (con libmp3lame). Cada WAV (44,1 kHz estéreo) pasa a mono,
22 kHz, MP3 de 48 kbps, sin el silencio del principio ni del final: unos
5-10 KB. Lo leen todos los navegadores, también el iPhone.

Los gritos van por el número de Reloaded, no por el nacional (a partir del
494 deja de coincidir; ver tools/reloaded_ids.py), con el mismo archivo que
sus sprites: hasta el 1000, N; del 1001 en adelante, N+1000 (2385 = Koraidon).
Comprobado el 23-10-2026 comparando con los gritos oficiales de PokeAPI
(700, 820, 1000, 1007...): con el número nacional sale otro Pokémon.
Si la forma base no tiene grito se prueba con sus formas; si ninguna, se queda
sin grito (en el juego no suena nada) y va a la lista de cries.js.
Megas (js/data/megas.js): su grito va en assets/cries/<100000 + dex>.mp3, del
archivo de mega de Reloaded (100000 + su archivo, como sus sprites: mega_file).
Sin grito de mega, en el juego suena el de su forma normal.
"""
import io
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from reloaded_ids import DATA, file_id, reloaded_ids   # noqa: E402
from import_reloaded import MEGA, mega_file            # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CRIES = os.path.join(DATA, 'audio', 'grito')
OUT = os.path.join(ROOT, 'assets', 'cries')
META = os.path.join(ROOT, 'js', 'data', 'sprites-meta.js')
LIST = os.path.join(ROOT, 'js', 'data', 'cries.js')
MEGAS = os.path.join(ROOT, 'js', 'data', 'megas.js')

# Silencio: por debajo de -45 dB. Al final se deja una cola corta para que no corte en seco.
FILTER = ('silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.01,'
          'areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse')


def game_dexes():
    """Los Pokémon que hay en el juego: los de sprites-meta.js (1-1025)."""
    text = io.open(META, encoding='utf-8').read()
    return sorted(d for d in map(int, re.findall(r'^  (\d+): \{', text, re.M)) if d <= 1025)


def mega_ids():
    """Las megas del juego, con su número en el juego (100000 + dex)."""
    if not os.path.exists(MEGAS):
        return []
    text = io.open(MEGAS, encoding='utf-8').read()
    return sorted(MEGA + int(d) for d in re.findall(r'^  (\d+): \{', text, re.M))


def source_of(gid):
    """WAV de Reloaded de ese Pokémon nacional (o mega, 100000 + dex), o None."""
    mega = gid > MEGA
    for rid in reloaded_ids(gid - MEGA if mega else gid):
        num = mega_file(rid) if mega else file_id(rid)
        path = os.path.join(CRIES, f'{num:03d}.wav')
        if os.path.exists(path):
            return path
    return None


def convert(src, dst):
    cmd = ['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', FILTER,
           '-ac', '1', '-ar', '22050', '-c:a', 'libmp3lame', '-b:a', '48k', '-map_metadata', '-1', dst]
    subprocess.run(cmd, check=True)


def write_list(missing):
    lines = [
        '/* ============ cries.js — GENERADO, no editar a mano ============',
        ' * Lo produce tools/import_cries.py. Los gritos son de Pokémon Edición Reloaded',
        ' * (de F3R) y están en assets/cries/<nº>.mp3; se bajan sólo al sonar.',
        ' * Aquí van los Pokémon del juego SIN grito (Reloaded no lo trae): con estos',
        ' * G.Audio.cry() no pide nada y no suena nada.',
        ' */',
        'G.CRY_MISSING = new Set([' + ','.join(map(str, missing)) + ']);',
        '',
    ]
    with io.open(LIST, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lines))


def main():
    if not os.path.isdir(CRIES):
        sys.exit(f'No encuentro los gritos de Reloaded: {CRIES}')
    only = [int(a) for a in sys.argv[1:]]
    dexes = only or game_dexes() + mega_ids()
    os.makedirs(OUT, exist_ok=True)
    missing, done = [], 0
    for dex in dexes:
        src = source_of(dex)
        dst = os.path.join(OUT, f'{dex}.mp3')
        if not src:
            missing.append(dex)
            if os.path.exists(dst) and not only:
                os.remove(dst)              # ya no tiene grito: que no quede uno viejo
            continue
        convert(src, dst)
        done += 1
        if done % 100 == 0:
            print(f'  {done}...', flush=True)
    if not only:
        # Gritos que sobran (de un Pokémon que ya no está en el juego).
        keep = {f'{d}.mp3' for d in dexes}
        for fn in os.listdir(OUT):
            if fn.endswith('.mp3') and fn not in keep:
                os.remove(os.path.join(OUT, fn))
        write_list(missing)
    size = sum(os.path.getsize(os.path.join(OUT, f'{d}.mp3')) for d in dexes
               if os.path.exists(os.path.join(OUT, f'{d}.mp3')))
    print(f'{done} gritos ({size / 1024:.0f} KB, {size / 1024 / max(done, 1):.1f} KB cada uno)')
    print(f'Sin grito en Reloaded ({len(missing)}): {missing}')


if __name__ == '__main__':
    main()
