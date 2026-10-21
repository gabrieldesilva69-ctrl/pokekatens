---
name: publicar-version
description: Publica una versión nueva de PokeKatens (web y, si hace falta, el .exe). Úsala cuando digan "publica", "sube la versión", "saca la actualización", "haz el build" o "que les llegue a todos".
---

# Publicar una versión de PokeKatens

## When to use
- Hay cambios listos en `dev.html`, `js/`, `css/` o `assets/` y los dueños quieren que lleguen a los jugadores.
- Han cambiado `desktop/` y hay que rehacer el instalador.

## Steps
1. Si es un cambio de juego o un arreglo: añade la línea en `js/data/changelog.js` (español e inglés, en
   `new` / `chg` / `fix` de la fecha de hoy, `date +%F`) y su fila en `js/data/lang-updates.js` con las
   cinco traducciones. Los cambios de servidores no van.
2. Pasa el gate:
   ```bash
   node --test "tests/*.test.cjs"
   node tools/export_data.js
   node tools/build.js --sin-seo
   ```
3. Si se ha tocado `firestore.rules`, `database.rules.json`, `js/core/db.js` o `js/net/`, pasa también:
   `node tools/emu.cjs "node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs"`.
4. Commit con un mensaje en español que diga qué cambia, **sin "Co-Authored-By" ni firma de IA**:
   `git add -A && git commit -m "<qué cambia>"`.
5. `git push origin main` **sólo si los dueños lo han pedido**. Si cambiaron las reglas, recuérdales
   desplegarlas: `npx --yes firebase-tools@15.34.0 deploy --only firestore:rules,firestore:indexes,database`.
6. Si se ha tocado `desktop/`: `npm ci --prefix desktop`, `node tools/desktop-smoke.cjs`,
   `npm --prefix desktop run dist` y dile a los dueños que repartan `desktop/dist/PokeKatens-Setup-1.0.0.exe`
   (si cambiaste la versión en `desktop/package.json`, el nombre del archivo cambia con ella).

## Verify
```bash
node --test "tests/*.test.cjs"    # expect: exit 0
node tools/build.js --sin-seo     # expect: exit 0 y version.json nuevo
status=0; git log -1 --format=%B | grep -qi "co-authored-by" || status=$?; test "$status" -eq 1   # expect: exit 0
```

## Do not
- No edites `index.html`, `js/app.min.js`, `version.json` ni `js/lang/*.js` a mano: los genera el build.
- No uses `node tools/build.js` sin `--sin-seo` ni `tools/make_seo_pages.py`: PokeKatens no tiene SEO.
- No uses `--forzar` salvo que los dueños pidan cortar las partidas en curso.
- No hagas `push` sin que lo pidan, ni a `upstream` (el repositorio de JPTER78) nunca.
