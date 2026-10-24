#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Genera CREDITS.md con los artistas de cada sprite descargado.

    python tools/fetch_credits.py

Cada carpeta de SpriteCollab tiene un credits.txt (sin cabecera) con lineas
    fecha <TAB> autor <TAB> ...
donde el autor es un nombre o un ID de Discord ("<@!123...>"). Los IDs se
traducen con el credit_names.txt de la raiz del repo.
"""
import io
import os
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_forms import FORMS   # noqa: E402  (primigenias: otra carpeta de SpriteCollab)

RAW = 'https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets', 'pokemon')
OUT = os.path.join(ROOT, 'CREDITS.md')


# Material de Pokémon Edición Reloaded (excepción de los dueños, ver CLAUDE.md).
# Se amplía con cada cosa nueva que se use de Reloaded.
RELOADED_MD = '''
## Pokémon Edición Reloaded

Material de **Pokémon Edición Reloaded, de F3R**
(<https://pokemon-reloaded.blogspot.com>), usado con crédito porque los dueños
son fans de ese juego y quieren que la gente lo conozca. Sólo contenido oficial
de Pokémon; se convierte con las herramientas de `tools/` (la carpeta del juego
no se sube).

- **Colores shiny** de 588 Karrablast, 820 Greedent, 847 Barraskewda, 868 Milcery,
  896 Glastrier, 916 Oinkologne, 933 Naclstack y 1007 Koraidon: los sprites son los
  de SpriteCollab (artistas de arriba) recoloreados con los colores de Pokémon
  Edición Reloaded (`tools/shiny_from_reloaded.py`).
- **Gritos de los Pokémon** (`assets/cries/`): los de Pokémon Edición Reloaded,
  pasados a MP3 ligero con `tools/import_cries.py`.
- **Megaevoluciones** (`assets/pokemon/1000xx/`): los sprites de mapa de 81 megas
  oficiales (normal y shiny), convertidos con `tools/import_reloaded.py --mega N`, y sus
  gritos. Sus datos (tipos, estadísticas, habilidad) son de PokeAPI (`tools/fetch_megas.py`).
- **Huevos** (`assets/eggs/`): uno por familia, normal y shiny, recortados con `tools/import_eggs.py`.
- **Fondos de caja del PC** (`assets/ui/box/`, uno por región en la colección):
  `tools/import_visual.py --cajas`.
- **Suelos de las arenas** (`assets/arenas/`): campos de combate vistos desde arriba, en pixel art
  (y una playa para el agua), bajo la arena de las grietas de muchos tipos (`tools/import_visual.py --arenas`).
- **Avatares de entrenador** (`assets/trainers/`): 60 entrenadores oficiales animados, revisados por los
  dueños, para el perfil, la lista de amigos y la sala (`tools/import_visual.py --entrenadores`).
'''


def fetch(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'pokesurvivor/1.0'})
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.read().decode('utf-8', 'replace')
    except Exception:
        return ''


def main():
    # ID de Discord / alias -> (nombre visible, contacto)
    names = {}
    for line in fetch(f'{RAW}/credit_names.txt').splitlines()[1:]:
        parts = line.split('\t')
        if len(parts) >= 2:
            display = parts[0].strip()
            contact = parts[2].strip() if len(parts) > 2 else ''
            names[parts[1].strip()] = (display, contact)
            names[display] = (display, contact)

    dexes = sorted(int(d) for d in os.listdir(ASSETS) if d.isdigit())

    def one(dex):
        # Créditos del sprite normal y del shiny (que puede ser de otro artista).
        # Las formas de tools/fetch_forms.py (primigenias...) están en su carpeta.
        if dex in FORMS:
            d, form = FORMS[dex]
            txt = fetch(f'{RAW}/sprite/{d:04d}/{form}/credits.txt')
            txt += '\n' + fetch(f'{RAW}/sprite/{d:04d}/{form}/0001/credits.txt')
            dex = d
        else:
            txt = fetch(f'{RAW}/sprite/{dex:04d}/credits.txt')
            if os.path.isdir(os.path.join(ASSETS, str(dex), 's')):
                txt += '\n' + fetch(f'{RAW}/sprite/{dex:04d}/0000/0001/credits.txt')
        authors = []
        for line in txt.splitlines():
            parts = line.split('\t')
            a = parts[1].strip() if len(parts) > 1 else ''
            if a and names.get(a, (a, ''))[0]:
                authors.append(a)
        return dex, authors

    per_artist = {}
    with ThreadPoolExecutor(max_workers=12) as ex:
        for dex, authors in ex.map(one, dexes):
            for a in set(authors):
                display, contact = names.get(a, (a, ''))
                per_artist.setdefault((display, contact), set()).add(dex)

    with io.open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write('# Créditos\n\n')
        f.write('## Sprites\n\n')
        f.write('Los sprites estilo *Pokémon Mundo Misterioso* vienen de\n')
        f.write('[SpriteCollab](https://github.com/PMDCollab/SpriteCollab), bajo licencia\n')
        f.write('[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/):\n')
        f.write('uso **no comercial** y con atribución a sus artistas.\n\n')
        f.write('| Artista | Contacto | Sprites (nº de Pokédex) |\n|---|---|---|\n')
        for (display, contact), dx in sorted(per_artist.items(), key=lambda kv: kv[0][0].lower()):
            nums = ', '.join(str(d) for d in sorted(dx))
            f.write(f'| {display} | {contact} | {nums} |\n')
        f.write(RELOADED_MD)
        f.write('\n## Datos\n\n')
        f.write('Stats base y nombres en español: [PokeAPI](https://pokeapi.co/),\n')
        f.write('descargados una vez y guardados en `js/data/pokedex.js`.\n\n')
        f.write('## Marca\n\n')
        f.write('Pokémon es propiedad de Nintendo, Creatures Inc. y GAME FREAK.\n')
        f.write('Este es un proyecto de fan sin ánimo de lucro.\n')

    print(f'{len(per_artist)} artistas para {len(dexes)} Pokemon -> CREDITS.md')


if __name__ == '__main__':
    main()
