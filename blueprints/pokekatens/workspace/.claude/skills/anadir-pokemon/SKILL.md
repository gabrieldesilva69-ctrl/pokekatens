---
name: anadir-pokemon
description: Añade o cambia sprites de un Pokémon (normal y shiny) en PokeKatens. Úsala cuando digan "añade el Pokémon X", "faltan los sprites de", "pon el shiny de" o "actualiza los sprites".
---

# Añadir sprites de un Pokémon

## When to use
- Un Pokémon de la Pokédex no tiene sprites o le falta el shiny.
- Hay sprites nuevos en SpriteCollab (PMDCollab) para un número de la Pokédex.

## Steps
1. Los sprites son hojas estilo Mundo Misterioso de SpriteCollab (licencia CC BY-NC 4.0). Hacen falta
   las animaciones `Idle`, `Walk`, `Attack`, `Shoot`, `Charge`, `Hurt` y `Faint`.
2. Lo normal es descargarlos con el script del repositorio (necesita Python 3 e internet; reutiliza lo ya
   bajado en `tools/cache/`):
   ```bash
   python tools/fetch_sprites.py <dex> <dex>
   ```
   Deja las hojas en `assets/pokemon/<dex>/` (por ejemplo `assets/pokemon/25/Idle.png`), el shiny en
   `assets/pokemon/<dex>/s/`, y regenera `js/data/sprites-meta.js` (no se edita a mano).
3. Si el Pokémon flota en su sprite, `python tools/hover_flags.py` actualiza la marca `hv`.
4. Créditos de los artistas: `python tools/fetch_credits.py` actualiza `CREDITS.md`.
5. Si es un Pokémon que antes no era jugable, revisa su entrada en `js/data/pokedex.js` (nombre,
   tipos, rareza) y añade su nombre en inglés a `js/data/lang-en.js` si no está.
6. Novedades (skill `publicar-version`, paso 1) y gate.

## Verify
```bash
node tools/export_data.js          # expect: exit 0 — carga pokedex.js y sprites-meta.js
node --test "tests/*.test.cjs"     # expect: exit 0
node tools/build.js --sin-seo      # expect: exit 0
```
Después abre `node tools/serve.cjs` → http://127.0.0.1:8123/dev.html y mira al Pokémon en la colección.

## Do not
- No edites `js/data/sprites-meta.js` a mano: lo genera `tools/fetch_sprites.py`.
- No uses sprites con otra licencia ni quites créditos de `CREDITS.md`.
- No renombres las carpetas: el número de la Pokédex va sin ceros delante (`25`, no `0025`).
