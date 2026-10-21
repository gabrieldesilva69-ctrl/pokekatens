# Epic 02: Limpieza y datos

> Al acabar, no queda nada del dueño original que no sea el crédito (ni SEO, ni dominio, ni donaciones, ni su
> administrador), las cuentas, partidas y ranking están probados contra las reglas reales en los emuladores de
> Firebase, y las novedades cuentan el cambio en los 7 idiomas.

| | |
|---|---|
| **Epic id** | `02-limpieza-y-datos` |
| **Tasks** | `E2-T1` … `E2-T5` |
| **Depends on** | `01-base-del-fork` |
| **Unlocks** | `03-escritorio-y-publicacion` |
| **Parallel with** | ninguna (cada tarea ejecuta la batería completa de pruebas y el build) |

You do not need any other file to complete this epic. Everything below is repeated here on purpose.

**Java 21 ya está comprobado**: el Bootstrap de `blueprint.md` §10 no deja empezar sin él (en este PC, el
2026-10-21, `java` del PATH ya es 21.0.12 de Oracle; cualquier Java 21 o más vale). `tools/emu.cjs` busca en
el mismo orden que el Bootstrap: `%JAVA_HOME%\bin`, `C:\Program Files\Eclipse Adoptium\jdk-2*\bin` y el `PATH`.
Si aun así `node tools/emu.cjs --check-java` sale con 2, instálalo (una persona, con permiso de administrador;
«verificar antes de instalar») y vuelve a abrir Git Bash:

```bash
winget install --id EclipseAdoptium.Temurin.21.JDK -e --silent --accept-package-agreements --accept-source-agreements
```

No es un fallo de esta épica: es el requisito previo de §10. La primera ejecución de los emuladores necesita internet (descarga
`firebase-tools` y los emuladores) y el puerto 8080 libre.

---

## Stack

Juego en HTML + CSS + JavaScript sin frameworks (Canvas 2D), módulos clásicos colgados de `G`
(`G.X = (() => { … })()`), sin `package.json` en la raíz · Firebase (Auth con nombre + contraseña, Firestore,
Realtime Database) por el SDK compat que `js/core/db.js` carga en tiempo de ejecución · GitHub Pages ·
app de Windows con Electron + electron-builder dentro de `desktop/` (único `package.json`, versiones exactas en
`desktop/package-lock.json`) · pruebas con `node:test` · emuladores de Firebase con `firebase-tools` vía `npx`
(versión en `tools/emu.cjs`). Node 20 o más (probado con 24.21.0), Git Bash en Windows 11. Las versiones están
en los archivos de bloqueo y en las herramientas: léelas de ahí, nunca las adivines.

| Task | Command |
|---|---|
| Pruebas (todas) | `node --test "tests/*.test.cjs"` (con la carpeta `tests/` **no** funciona en Node 24) |
| Una prueba | `node --test tests/serve.test.cjs` |
| Datos del juego | `node tools/export_data.js` |
| Construir | `node tools/build.js --sin-seo` (regenera `index.html`, `js/app.min.js`, `version.json`, `js/lang/*.js`) |
| Jugar en local | `node tools/serve.cjs` → http://127.0.0.1:8123/dev.html |
| Emuladores (Java 21) | `node tools/emu.cjs --check-java` · `node tools/emu.cjs "node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs"` |
| Escritorio | `npm install --prefix desktop` · `node tools/desktop-smoke.cjs` (`--offline`, `--hang`, `--exe …`) · `npm --prefix desktop run dist` |

**Gate:** `node --test "tests/*.test.cjs" && node tools/export_data.js && node tools/build.js --sin-seo` pasa
antes de marcar como hecha cualquier tarea de aquí.

El único servicio que usa alguna tarea son los emuladores de Firebase: los arranca y los para
`node tools/emu.cjs "<comando>"` (lo crea la tarea `E2-T3`), con `firebase.json` del repositorio. Nunca se usa
un servidor real ni un sustituto falso de los emuladores.

Todos los comandos se ejecutan **desde la raíz del repositorio** (`C:\Users\gabri\Downloads\pokesurvivor`), en
Git Bash, nunca desde la carpeta del bundle.

**Normas de los dueños que se aplican ya:** commits **sin «Co-Authored-By» ni ninguna firma de IA**; nunca
`git push`; nunca tocar `js/core/updater.js`; nunca usar los servidores de JPTER78. Hasta la tarea `E3-T4`, el
`CLAUDE.md` de la raíz todavía es el del dueño original: donde choque con esta épica (comando de publicar,
proyecto de Firebase, dominio), manda esta épica.

## Directory subtree

Only the parts this epic touches:

```
dev.html                       # existe, se edita (E2-T1: borrar los bloques SEO)
robots.txt                     # existe, se reescribe (E2-T1)
CNAME, sitemap.xml, 404.html   # existen, se BORRAN (E2-T1)
guia/ pokedex/ legendarios/ shinies/ tipos/ movimientos/ objetos/ logros/ novedades/ apoyar/ contacto/ en/
                               # existen, se BORRAN las 12 (E2-T1) — salida de tools/make_seo_pages.py
.github/FUNDING.yml            # existe, se BORRA (E2-T2)
README.md                      # existe, se edita (E2-T2)
.firebaserc                    # existe, se reescribe (E2-T3)
firebase.json                  # existe, sólo lectura (puertos de los emuladores)
firestore.rules                # existe, se edita sólo admin() (E2-T4)
js/
  data/funding.js              # existe, se edita (E2-T2)
  data/changelog.js            # existe, se edita (E2-T5) — entrada NUEVA «PokeKatens: versión no oficial»
  data/lang-updates.js         # existe, se edita (E2-T5) — filas de los textos nuevos y las novedades
  data/lang-en.js              # existe, se edita (E2-T5) — inglés de los 7 textos nuevos
  net/ranking.js               # existe, se edita (E2-T4)
  core/fork-config.js          # de la épica 01, sólo lectura
tools/emu.cjs                  # NUEVO (E2-T3)
tests/
  emulator/smoke.cjs           # NUEVO (E2-T3) — necesita emuladores; no termina en .test.cjs
  emulator/ranking.cjs         # NUEVO (E2-T4)
  textos-nuevos.test.cjs       # NUEVO (E2-T5) — los 7 textos nuevos, en el juego y traducidos
  i18n.test.cjs                # existe, sólo lectura (exige traducciones de las novedades)
index.html, js/app.min.js, version.json, js/lang/*.js   # GENERADOS por el build en cada Verify
```

Everything outside this subtree is out of scope. If a task seems to require editing a file not listed here,
stop and report — it means the epic boundary is wrong.

## Data model touched here

| Entity | Fields this epic adds or reads | Notes |
|---|---|---|
| `saves/{uid}` | escribe `v` (3), `save.coins` (500), `save.tickets.t1` (1), `save.tickets.t10` (0), `updatedAt` = hora del servidor | Sólo en el emulador; es lo mínimo que aceptan `validSaveDoc` y `saneSave` |
| `lb/s_test/e/{uid}` | `t`, `uids`, `names`, `dex`, `shiny`, `lv`, `kills`, `at` = hora del servidor | `validEntry`: `t` 1…2700, `lv` ≤ 10 + t/4, `kills` ≤ 100 + t·12, tabla `s_…` de una persona con id = su UID |
| `reports/{id}` | sólo lectura (debe dar 403) | Sólo `admin()` lee |
| `firestore.rules` `admin()` | pasa a `false` | Ninguna otra regla cambia |

## Contracts

**Consumed** — already exists, do not rebuild:

| From | Interface | Guarantee |
|---|---|---|
| `01-base-del-fork` | `G.FORK.admins` (array de textos, vacío) | `ranking.js` lo usa como `ADMINS` |
| `01-base-del-fork` | `G.FIREBASE_CONFIG` del emulador (`demo-pokekatens`, `demo-pokekatens-key`) | Mismos id y clave que usan las pruebas |
| repo | `firebase.json` | Emuladores auth 9099, firestore 8080, database 9000, `singleProjectMode` |
| repo | `tests/i18n.test.cjs` | Falla si una novedad con fecha ≥ `2026-10-18` no tiene traducción en `fr`, `it`, `pt-BR`, `zh-Hans`, `zh-Hant` |

**Produced** — later epics depend on exactly these signatures. Changing one breaks them:

| Export | Signature | Used by |
|---|---|---|
| `tools/emu.cjs` | `--check-java` → 0 / 2; `"<comando>"` → código del comando dentro de `emulators:exec`; uso incorrecto → 64 | `03` (`E3-T5`), `CLAUDE.md`, skills |
| `tests/emulator/smoke.cjs` | imprime `EMULATOR_SMOKE_OK` y sale con 0 | `03` (`E3-T5`) |
| `tests/emulator/ranking.cjs` | imprime `EMULATOR_RANKING_OK` y sale con 0 | `03` (`E3-T5`) |

## Conventions that bite in this area

- **Las pruebas de emulador no terminan en `.test.cjs`**: así `node --test "tests/*.test.cjs"` no las ejecuta sin emuladores.
- **Direcciones fijas `127.0.0.1`** (no `localhost`: en Node 24 puede resolver a `::1` y el emulador escucha en IPv4).
- **Nunca imprimas tokens ni contraseñas**: sólo códigos HTTP y las marcas.
- **`smoke.cjs` y `ranking.cjs` se ejecutan en la misma sesión de emuladores**: usan correos distintos (`uno@`, `dos@`, `tres@`) para no chocar.
- **`git rm -r -q`** para borrar (así el borrado entra en el commit y nada queda sin seguimiento).
- **Novedades**: siempre una entrada **nueva** al principio, titulada `PokeKatens: versión no oficial`, con la fecha de hoy (`date +%F`), aunque ya haya otra entrada de JPTER78 con la misma fecha (esa no se toca); el texto español de `changelog.js` y la primera columna de `lang-updates.js` son idénticos carácter por carácter.
- `tools/make_seo_pages.py`, `docs/SEO.md` y `docs/DOMINIO.md` se quedan sin usar; no los borres.

Full project rules: `CLAUDE.md`. Area rules: `.claude/rules/firebase-reglas.md`, `.claude/rules/traducciones.md`,
`.claude/rules/juego-js.md`. They sit in the project root — the builder copied them there from the bundle's
`workspace/` before task one (except `CLAUDE.md`, which is still the original owner's until `E3-T4`).

## Volver atrás (único procedimiento, igual en `blueprint.md` §9 regla 6)

Si un paso NN (o uno posterior) sale mal y hay que rehacer desde NN — nunca se arregla hacia delante:

```bash
# 1. Volver al último paso bueno: la etiqueta del paso NN-1 (la que nombra la tabla de pasos);
#    para NN = 01 es step-00-preparacion, la que pone el Bootstrap en su commit de preparación
git reset --hard step-<NN-1>-<slug>
# 2. Borrar cada etiqueta desde la del paso NN hasta la última que se llegó a crear, una por una
#    (nunca step-00-preparacion)
git tag -d step-<NN>-<slug>          # y lo mismo con step-<NN+1>-…, etc., hasta la última
# 3. Comprobar en blueprints/pokekatens/tasks.json que las tareas del paso NN en adelante están en
#    "status": "pending" (el reset ya las deja así, porque cada Checkpoint guardó tasks.json; si alguna
#    no lo está, ponla en "pending")
# 4. Rehacer desde el paso NN, en orden
```

Los Checkpoints usan `git tag -f`, así que volver a etiquetar un paso rehecho nunca falla.

---

## Tasks

Listed in the same order as `tasks.json`. That order is the build order — work top to bottom and do not
re-rank by priority or by what looks quick.

### `E2-T1` — Quitar las páginas SEO y el dominio pokesurvivor.com

**Depends on:** `E1-T5` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 6

Las páginas de guía/Pokédex para buscadores y el dominio `pokesurvivor.com` son del original. PokeKatens se publica en GitHub Pages sin dominio propio y no necesita salir en Google.

1. **`dev.html`**: borra los cuatro bloques `<!-- seo:begin -->…<!-- seo:end -->` **con su contenido** (canonical, Open Graph, Twitter, JSON-LD y la meta `ps-pages` del `<head>`; y los enlaces «Guía · Pokédex» de la pantalla de entrada y de la línea 340). Después de esto `dev.html` no contiene `seo:begin`, `seo:end`, `ps-pages` ni `pokesurvivor.com`. (`node tools/build.js --sin-seo` sigue funcionando igual: simplemente ya no encuentra bloques que quitar.)
2. **`robots.txt`**: contenido completo, dos líneas:

   ```
   User-agent: *
   Disallow:
   ```
3. **Borra** todo de una vez, con un solo comando:

   ```bash
   git rm -r -q CNAME sitemap.xml 404.html guia pokedex legendarios shinies tipos movimientos objetos logros novedades apoyar contacto en
   ```
   Las 12 carpetas y `404.html` son salida generada por `tools/make_seo_pages.py` (hoy 22 archivos HTML en las carpetas, más `404.html`), no archivos escritos a mano: por eso cuentan como **un único entregable** del paso (la entrada con llaves de la lista de archivos), igual que se contaría la salida de un compilador.

`tools/make_seo_pages.py`, `docs/SEO.md` y `docs/DOMINIO.md` se quedan en el repositorio sin usarse (el `CLAUDE.md` del paso 14 lo dice). No toques `sw.js`, `.nojekyll` ni `js/core/updater.js`.

**Files**
- `dev.html`
- `robots.txt`
- `CNAME`
- `sitemap.xml`
- `{404.html,guia/**,pokedex/**,legendarios/**,shinies/**,tipos/**,movimientos/**,objetos/**,logros/**,novedades/**,apoyar/**,contacto/**,en/**}`

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization defined in `agents/blueprint-writer.md` *Acceptance strings*. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `ls -d CNAME sitemap.xml 404.html guia pokedex legendarios shinies tipos movimientos objetos logros novedades apoyar contacto en` se ejecuta **THE SYSTEM SHALL** no listar ninguno (ya no existen).
2. **WHEN** se lee `robots.txt` sin los retornos de carro **THE SYSTEM SHALL** contener exactamente las dos líneas `User-agent: *` y `Disallow:`.
3. **WHEN** `grep -nE "seo:begin|seo:end|pokesurvivor\.com|ps-pages" dev.html` se ejecuta **THE SYSTEM SHALL** no encontrar nada (exit 1).
4. **WHEN** `node tools/build.js --sin-seo` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 y el `index.html` generado SHALL no contener `pokesurvivor.com`.
5. **WHEN** `node --test "tests/*.test.cjs"` y `node tools/export_data.js` se ejecutan **THE SYSTEM SHALL** terminar ambos con exit 0.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
test -z "$(ls -d CNAME sitemap.xml 404.html guia pokedex legendarios shinies tipos movimientos objetos logros novedades apoyar contacto en 2>/dev/null)"   # expect: exit 0 — no queda ninguno
test "$(tr -d '\r' < robots.txt)" = "$(printf 'User-agent: *\nDisallow:')"   # expect: exit 0
status=0; grep -nE "seo:begin|seo:end|pokesurvivor\.com|ps-pages" dev.html || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = ninguna coincidencia
node tools/build.js --sin-seo   # expect: exit 0 (la primera vez descarga terser y javascript-obfuscator con npx: hace falta internet)
status=0; grep -n "pokesurvivor\.com" index.html || status=$?; test "$status" -eq 1   # expect: exit 0
node --test "tests/*.test.cjs"   # expect: exit 0, 0 failed
node tools/export_data.js   # expect: exit 0
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 06 (E2-T1): fuera las páginas SEO y el dominio"
git tag -f step-06-sin-seo
status=0; git log -1 --format=%B | grep -qi "co-authored-by" || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = el commit no lleva firma de IA (norma de los dueños)
```

Run these after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts. If this task or a later one goes wrong, follow the single recovery procedure (section *Volver atrás* above, the same as `blueprint.md` §9 rule 6) with NN = the first broken step, instead of debugging forward; `git tag -f` makes re-tagging after a recovery safe. Never invent the tag: copy the `checkpoint` field. The extra lines after the tag check that the commit carries no AI signature.

### `E2-T2` — Quitar donaciones y presentar el fork en el README

**Depends on:** `E2-T1` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 7

PokeKatens es sin ánimo de lucro: no pide dinero. Y el README dice arriba del todo qué es esta copia, sin quitar nada de la autoría de JPTER78.

1. **`js/data/funding.js`**: el comentario de cabecera dice que PokeKatens no acepta donaciones y por eso todo va vacío; el objeto queda:

   ```js
   G.Funding = {
     kofi: '',
     sponsors: '',
     costs: [],
     get url() { return this.kofi ? 'https://ko-fi.com/' + this.kofi : ''; }
   };
   ```
   (`js/ui/run-ui.js` ya no enseña el botón «Apoyar en Ko-fi» cuando `G.Funding.url` está vacío.)
2. **Borra `.github/FUNDING.yml`** con `git rm -q .github/FUNDING.yml` (el botón «Sponsor» de GitHub apuntaba a JPTER78).
3. **`README.md`**: añade **encima** de la primera línea actual (`# PokéSurvivor · Mundo Misterioso`) esta sección, y deja todo lo demás (bloque de autoría incluido) tal cual debajo:

   ```markdown
   # PokeKatens — versión no oficial

   PokeKatens es una copia **no oficial, gratis y sin ánimo de lucro** de PokéSurvivor, hecha por un grupo
   de amigos para jugar entre nosotros: web en GitHub Pages y programa para Windows, con cuentas, ranking,
   amigos y cooperativo.

   - Juego original: **PokéSurvivor**, de **Jonathan Piera Torregrosa (JPTER78)** — https://github.com/JPTER78/pokesurvivor
   - Licencia: la del original (PolyForm Noncommercial 1.0.0; MIT para versiones antiguas): `LICENSE` y `LICENSE-NONCOMMERCIAL.md`.
   - Required Notice: Copyright 2026 JPTER78 (https://github.com/JPTER78/pokesurvivor)
   - No usa los servidores del original: tiene su propio proyecto de Firebase.
   - No está afiliado a Nintendo, Creatures Inc., GAME FREAK ni The Pokémon Company.
   - Cómo publicar una versión: `docs/GUIA-PUBLICAR-POKEKATENS.md`.

   ---

   ```

**Files**
- `js/data/funding.js`
- `.github/FUNDING.yml`
- `README.md`

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization defined in `agents/blueprint-writer.md` *Acceptance strings*. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** se carga `js/data/funding.js` **THE SYSTEM SHALL** dejar `G.Funding.kofi === ''`, `G.Funding.sponsors === ''`, `G.Funding.costs` vacío y `G.Funding.url === ''` (el botón de Ko-fi no sale nunca).
2. **WHEN** `test ! -e .github/FUNDING.yml` se ejecuta **THE SYSTEM SHALL** terminar con exit 0.
3. **WHEN** se leen las 20 primeras líneas de `README.md` **THE SYSTEM SHALL** encontrar `PokeKatens — versión no oficial`, y `README.md` SHALL seguir conteniendo `Jonathan Piera Torregrosa` y la línea `Required Notice: Copyright 2026 JPTER78 (https://github.com/JPTER78/pokesurvivor)`.
4. **WHEN** `git diff --quiet HEAD -- LICENSE LICENSE-NONCOMMERCIAL.md` se ejecuta **THE SYSTEM SHALL** terminar con exit 0.
5. **WHEN** `node tools/export_data.js`, `node tools/build.js --sin-seo` y `node --test "tests/*.test.cjs"` se ejecutan **THE SYSTEM SHALL** terminar los tres con exit 0.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
node -e "const G={};new Function('G',require('fs').readFileSync('js/data/funding.js','utf8'))(G);const f=G.Funding;process.exit(f.url===''&&f.kofi===''&&f.sponsors===''&&f.costs.length===0?0:1)"   # expect: exit 0
test ! -e .github/FUNDING.yml   # expect: exit 0
head -n 20 README.md | grep -qF "PokeKatens — versión no oficial"   # expect: exit 0
grep -qF "Jonathan Piera Torregrosa" README.md   # expect: exit 0
grep -qF "Required Notice: Copyright 2026 JPTER78 (https://github.com/JPTER78/pokesurvivor)" README.md   # expect: exit 0
git diff --quiet HEAD -- LICENSE LICENSE-NONCOMMERCIAL.md   # expect: exit 0 — este paso no toca las licencias
node tools/export_data.js   # expect: exit 0
node tools/build.js --sin-seo   # expect: exit 0 (la primera vez descarga terser y javascript-obfuscator con npx: hace falta internet)
node --test "tests/*.test.cjs"   # expect: exit 0, 0 failed
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 07 (E2-T2): sin donaciones y README del fork"
git tag -f step-07-sin-donaciones
status=0; git log -1 --format=%B | grep -qi "co-authored-by" || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = el commit no lleva firma de IA (norma de los dueños)
```

Run these after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts. If this task or a later one goes wrong, follow the single recovery procedure (section *Volver atrás* above, the same as `blueprint.md` §9 rule 6) with NN = the first broken step, instead of debugging forward; `git tag -f` makes re-tagging after a recovery safe. Never invent the tag: copy the `checkpoint` field. The extra lines after the tag check that the commit carries no AI signature.

### `E2-T3` — Probar cuentas y partidas contra el emulador de Firebase

**Depends on:** `E2-T2` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 8

La prueba que demuestra que cuentas, partidas y reglas funcionan **sin tocar ningún servidor real**: los emuladores de Firebase en este ordenador. Necesita **Java 21** (ver §10 Requisitos; instálalo antes de empezar este paso) e internet la primera vez (descarga `firebase-tools` y los emuladores).

1. **`.firebaserc`** (contenido completo, 2 espacios):

   ```json
   {
     "projects": {
       "default": "demo-pokekatens"
     }
   }
   ```
   El prefijo `demo-` hace que los emuladores no pidan iniciar sesión en Google.
2. **Nuevo `tools/emu.cjs`** (CommonJS, sólo módulos de Node). Constantes arriba del todo: `const FIREBASE_TOOLS = 'firebase-tools@15.34.0';` y `const PROJECT = 'demo-pokekatens';`.
   - **Buscar Java ≥ 21**, por este orden: `%JAVA_HOME%\bin`, cada carpeta `C:\Program Files\Eclipse Adoptium\jdk-2*\bin` (orden descendente), y por último `java` del `PATH`. Para cada candidato ejecuta `java -version` con `spawnSync` y lee la versión de la salida de error con `/version "(\d+)(?:\.(\d+))?/` (si el primer número es `1`, la versión es el segundo: `1.8` → 8). Vale el primero con versión ≥ 21.
   - `node tools/emu.cjs --check-java` → si lo encuentra escribe `Java <versión> en <carpeta>` y sale con 0; si no, escribe `Falta Java 21: instala Temurin JDK 21 (docs/GUIA-PUBLICAR-POKEKATENS.md, apartado Java)` y sale con **2**.
   - `node tools/emu.cjs "<comando>"` → hace la misma búsqueda (sale con 2 si falta Java); si el comando contiene `"` sale con 64; si no, ejecuta con `spawnSync(comando, { shell: true, stdio: 'inherit' })` este comando:
     `npx --yes firebase-tools@15.34.0 --non-interactive emulators:exec --only auth,firestore,database --project demo-pokekatens "<comando>"`
     con `env.PATH` empezando por la carpeta de ese Java (y `JAVA_HOME` apuntando a su carpeta padre), y sale con el mismo código que devuelve (si es `null`, con 1).
   - **Sin proxy:** en el `env` que pasa a `spawnSync` borra `HTTP_PROXY`, `HTTPS_PROXY`, `http_proxy` y `https_proxy` (con `delete`), sin tocar el resto. Comprobado el 2026-10-21 en este PC: dentro de Claude Code esas variables apuntan a un proxy local, y con ellas firebase-tools se queda colgado para siempre al cargar las reglas del emulador `database` (`PUT http://127.0.0.1:9000/.settings/rules.json` sin respuesta). Sin ellas, los tres emuladores arrancan y el comando termina.
   - Sin argumentos: escribe el modo de uso y sale con 64.
3. **Nuevo `tests/emulator/smoke.cjs`** (CommonJS, Node 24 con `fetch` global, sin dependencias; **no** termina en `.test.cjs` a propósito, para que `node --test "tests/*.test.cjs"` no lo ejecute sin emuladores). Direcciones fijas, las mismas puertas de `firebase.json`:
   - `AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1'`, `KEY = 'demo-pokekatens-key'`
   - `DOCS = 'http://127.0.0.1:8080/v1/projects/demo-pokekatens/databases/(default)/documents'`

   Pasos, cada uno escribe `ok <qué>` o, si falla, `EMULATOR_SMOKE_FAIL <qué>: esperado <x>, recibido <y>` y sale con 1:
   1. Crea dos usuarios: `POST ${AUTH}/accounts:signUp?key=${KEY}` con `{"email":"uno@jugadores.pokekatens.invalid","password":"secreto123","returnSecureToken":true}` y lo mismo con `dos@jugadores.pokekatens.invalid` → 200; guarda `idToken` y `localId` de cada uno.
   2. Usuario 1 escribe su partida: `POST ${DOCS}:commit` con `Authorization: Bearer <idToken1>` y este cuerpo (es lo mínimo que aceptan `validSaveDoc` y `saneSave` de `firestore.rules`, líneas 30-65) → **200**:

      ```json
      {
        "writes": [{
          "update": {
            "name": "projects/demo-pokekatens/databases/(default)/documents/saves/<UID1>",
            "fields": {
              "v": { "integerValue": "3" },
              "save": { "mapValue": { "fields": {
                "coins": { "integerValue": "500" },
                "tickets": { "mapValue": { "fields": {
                  "t1": { "integerValue": "1" },
                  "t10": { "integerValue": "0" }
                } } }
              } } }
            }
          },
          "updateTransforms": [{ "fieldPath": "updatedAt", "setToServerValue": "REQUEST_TIME" }],
          "currentDocument": { "exists": false }
        }]
      }
      ```
   3. Usuario 2 intenta leerla: `GET ${DOCS}/saves/<UID1>` con el token 2 → **403**.
   4. Usuario 1 la lee: el mismo `GET` con el token 1 → **200** y el JSON tiene `name` que acaba en `/saves/<UID1>`.
   5. Usuario 1 la vuelve a escribir enseguida (mismo cuerpo, pero `"currentDocument": { "exists": true }`) → **403** (la regla `every(resource.data.updatedAt, 20)`).
   6. Escribe `EMULATOR_SMOKE_OK` en una línea sola y sale con 0.

   Nunca imprime tokens ni contraseñas: sólo códigos de respuesta.

**Files**
- `.firebaserc`
- `tools/emu.cjs`
- `tests/emulator/smoke.cjs`

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization defined in `agents/blueprint-writer.md` *Acceptance strings*. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `node tools/emu.cjs --check-java` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 si encuentra Java 21 o más nuevo (en `JAVA_HOME`, en `C:\Program Files\Eclipse Adoptium\jdk-2*` o en el `PATH`), y con exit 2 y el mensaje `Falta Java 21` si no.
2. **WHEN** `node tools/emu.cjs "node tests/emulator/smoke.cjs"` se ejecuta **THE SYSTEM SHALL** arrancar los emuladores `auth`, `firestore` y `database` del proyecto `demo-pokekatens` con `firebase-tools@15.34.0`, ejecutar el script, pararlos y terminar con el mismo código que el script.
3. **WHEN** `tests/emulator/smoke.cjs` escribe `saves/{uid1}` con el token del usuario 1 mediante `documents:commit` **THE SYSTEM SHALL** responder 200.
4. **WHEN** `tests/emulator/smoke.cjs` lee `saves/{uid1}` con el token del usuario 2 **THE SYSTEM SHALL** responder 403, y con el token del usuario 1 SHALL responder 200 con un documento cuyo `name` acaba en `/saves/{uid1}`.
5. **WHEN** el usuario 1 vuelve a escribir `saves/{uid1}` antes de 20 segundos **THE SYSTEM SHALL** responder 403 (el tope de 20 s de `firestore.rules`), y el script SHALL imprimir `EMULATOR_SMOKE_OK` y terminar con exit 0.
6. **WHEN** se lee `.firebaserc` **THE SYSTEM SHALL** contener `"default": "demo-pokekatens"`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
node tools/emu.cjs --check-java   # expect: exit 0 y una línea "Java 21..." · exit 2 = falta Java 21 (instálalo: §10 Requisitos)
grep -qF '"default": "demo-pokekatens"' .firebaserc   # expect: exit 0
node tools/emu.cjs "node tests/emulator/smoke.cjs" | grep -F EMULATOR_SMOKE_OK   # expect: exit 0 — la marca sólo sale si las 5 comprobaciones pasan
node --test "tests/*.test.cjs"   # expect: exit 0, 0 failed
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 08 (E2-T3): prueba de cuentas y partidas con el emulador"
git tag -f step-08-emulador
status=0; git log -1 --format=%B | grep -qi "co-authored-by" || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = el commit no lleva firma de IA (norma de los dueños)
git ls-files --error-unmatch tools/emu.cjs tests/emulator/smoke.cjs   # expect: exit 0
```

Run these after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts. If this task or a later one goes wrong, follow the single recovery procedure (section *Volver atrás* above, the same as `blueprint.md` §9 rule 6) with NN = the first broken step, instead of debugging forward; `git tag -f` makes re-tagging after a recovery safe. Never invent the tag: copy the `checkpoint` field. The extra lines after the tag check that the commit carries no AI signature and that the files this task created are now tracked (only decidable after the commit).

### `E2-T4` — Quitar el administrador de JPTER78 de reglas y juego

**Depends on:** `E2-T3` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 9

La cuenta de moderación de JPTER78 (`rshaa5gKD3fXw6lE4PPXITbowaG2`) estaba escrita en las reglas y en el juego. En PokeKatens, hasta el lanzamiento, **nadie** es administrador; la lista de lanzamiento (§20.1) explica cómo poner vuestra cuenta.

1. **`firestore.rules`** línea 20: la función queda exactamente `function admin() { return false; }` y el comentario de encima dice, en español: «Moderación (pantalla oculta js/ui/mod-ui.js). Nadie lo es hasta el lanzamiento. Para poner vuestra cuenta: cambia esta línea por `function admin() { return signedIn() && me() in ['VUESTRO_UID']; }`, pon el mismo UID en `G.FORK.admins` (js/core/fork-config.js) y despliega las reglas». No cambies ninguna otra regla.
2. **`js/net/ranking.js`** línea 501: `const ADMINS = G.FORK.admins;` (y el comentario de encima: la lista vive en `js/core/fork-config.js`).
3. **Nuevo `tests/emulator/ranking.cjs`**, mismas direcciones, mismo estilo de mensajes y misma regla de no imprimir tokens que `tests/emulator/smoke.cjs`:
   1. Crea el usuario `tres@jugadores.pokekatens.invalid` / `secreto123` (otro correo, porque se ejecuta en la misma sesión de emuladores que `smoke.cjs`).
   2. Marca imposible: `POST ${DOCS}:commit` con el token de ese usuario y una escritura en `projects/demo-pokekatens/databases/(default)/documents/lb/s_test/e/<UID>` con estos campos y `updateTransforms` `[{ "fieldPath": "at", "setToServerValue": "REQUEST_TIME" }]`, **sin** `currentDocument` → **403** (`t` pasa de 2700):

      ```json
      {
        "t": { "integerValue": "2701" },
        "uids": { "arrayValue": { "values": [{ "stringValue": "<UID>" }] } },
        "names": { "arrayValue": { "values": [{ "stringValue": "Tres" }] } },
        "dex": { "arrayValue": { "values": [{ "integerValue": "25" }] } },
        "shiny": { "arrayValue": { "values": [{ "booleanValue": false }] } },
        "lv": { "integerValue": "1" },
        "kills": { "integerValue": "0" }
      }
      ```
   3. La misma escritura con `"t": { "integerValue": "600" }` → **200** (cumple `validEntry`: tabla `s_…` de una persona, id = su UID, nivel ≤ 10 + t/4, derrotados ≤ 100 + t·12, `at` = hora del servidor, sin guardado baneado).
   4. `GET ${DOCS}/reports/nada` con su token → **403** (sólo el administrador lee reportes, y no hay ninguno).
   5. Escribe `EMULATOR_RANKING_OK` en una línea sola y sale con 0.

**Files**
- `firestore.rules`
- `js/net/ranking.js`
- `tests/emulator/ranking.cjs`

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization defined in `agents/blueprint-writer.md` *Acceptance strings*. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `grep -rn "rshaa5gKD3fXw6lE4PPXITbowaG2" js firestore.rules` se ejecuta después de `node tools/build.js --sin-seo` **THE SYSTEM SHALL** no encontrar nada (exit 1).
2. **WHEN** se busca en `js/net/ranking.js` y `firestore.rules` **THE SYSTEM SHALL** encontrar `const ADMINS = G.FORK.admins;` y `function admin() { return false; }`.
3. **WHEN** `tests/emulator/ranking.cjs` escribe `lb/s_test/e/{uid}` con `t: 2701` **THE SYSTEM SHALL** responder 403, y con `t: 600` (`uids`, `names`, `dex` y `shiny` de un elemento, `lv: 1`, `kills: 0`, `at` = hora del servidor) SHALL responder 200.
4. **WHEN** ese mismo usuario sin permisos de administrador lee `reports/nada` **THE SYSTEM SHALL** responder 403, y el script SHALL imprimir `EMULATOR_RANKING_OK` y terminar con exit 0.
5. **WHEN** `node tools/emu.cjs "node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs"` se ejecuta **THE SYSTEM SHALL** imprimir `EMULATOR_SMOKE_OK` y `EMULATOR_RANKING_OK`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
node tools/build.js --sin-seo   # expect: exit 0 (la primera vez descarga terser y javascript-obfuscator con npx: hace falta internet)
status=0; grep -rn "rshaa5gKD3fXw6lE4PPXITbowaG2" js firestore.rules || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = ninguna coincidencia
grep -qF "const ADMINS = G.FORK.admins;" js/net/ranking.js   # expect: exit 0
grep -qF "function admin() { return false; }" firestore.rules   # expect: exit 0
out=$(node tools/emu.cjs "node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs"); echo "$out" | grep -qF EMULATOR_SMOKE_OK && echo "$out" | grep -qF EMULATOR_RANKING_OK   # expect: exit 0 — las dos marcas
node --test "tests/*.test.cjs"   # expect: exit 0, 0 failed
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 09 (E2-T4): sin administrador heredado en reglas y juego"
git tag -f step-09-reglas-admin
status=0; git log -1 --format=%B | grep -qi "co-authored-by" || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = el commit no lleva firma de IA (norma de los dueños)
git ls-files --error-unmatch tests/emulator/ranking.cjs   # expect: exit 0
```

Run these after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts. If this task or a later one goes wrong, follow the single recovery procedure (section *Volver atrás* above, the same as `blueprint.md` §9 rule 6) with NN = the first broken step, instead of debugging forward; `git tag -f` makes re-tagging after a recovery safe. Never invent the tag: copy the `checkpoint` field. The extra lines after the tag check that the commit carries no AI signature and that the files this task created are now tracked (only decidable after the commit).

### `E2-T5` — Traducir los textos nuevos y contar el cambio en novedades

**Depends on:** `E2-T4` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 10

Dos cosas de idiomas, como manda la convención del repositorio (cada texto visible nuevo tiene inglés en `js/data/lang-en.js` y fila en `js/data/lang-updates.js`): traducir los textos nuevos de los pasos 3 y 5, y contar el cambio en las novedades. Los cambios de servidores (Firebase propio, sin TURN) **no** van en las novedades.

1. **Fecha**: la de hoy, con `date +%F` (formato `AAAA-MM-DD`, el mismo que usa el archivo).
2. **`js/data/changelog.js`**: crea **siempre** una entrada nueva **al principio** de `G.CHANGELOG`, con `d: '<fecha de hoy>'` y `title: ['PokeKatens: versión no oficial', 'PokeKatens: unofficial version']`, aunque ya haya otra entrada con la misma fecha (esa es de JPTER78 y no se toca). Líneas de la entrada nueva:
   (cada una `[español, inglés]`, copiadas tal cual)
     - `chg`: `['El juego ahora se llama PokeKatens: es una versión no oficial, gratis y sin ánimo de lucro, basada en PokéSurvivor de JPTER78.', 'The game is now called PokeKatens: an unofficial, free and non-profit version based on PokéSurvivor by JPTER78.']`
     - `chg`: `['Se entra sólo con nombre y contraseña (ya no hay botón de Google). Si olvidas la contraseña, pídele al administrador que te cree otra cuenta.', 'You sign in with name and password only (the Google button is gone). If you forget your password, ask the admin to create a new account for you.']`
3. **Los 7 textos nuevos de los pasos 3 y 5** (claves exactas, con los espacios normalizados, que es como el juego busca cada texto en los diccionarios):
   1. `Si olvidas la contraseña, pídele al administrador que te cree otra cuenta.`
   2. `Esta web no está en la lista de webs de esta copia del juego: la partida sólo se guarda en este navegador.`
   3. `Si creas una cuenta, guardamos tu nombre de jugador y tu partida (colección, monedas, mejoras y estadísticas) en Google Firebase para que puedas seguir en cualquier ordenador. No usamos tus datos para nada más, ni los compartimos, ni hay publicidad ni seguimiento. Como invitado no se guarda nada fuera de tu navegador.`
   4. `Es el nombre que verán tus amigos y el que sale en el ranking. Tu nombre de usuario no se enseña a nadie.`
   5. `Versión no oficial`
   6. `PokeKatens es una versión no oficial de PokéSurvivor (de JPTER78) hecha por un grupo de amigos, gratuita y sin ánimo de lucro. No tiene anuncios, compras ni donaciones.`
   7. `PokeKatens se juega en horizontal.`

   Para cada uno: su inglés en `js/data/lang-en.js` (mismo formato que las entradas que ya hay, por ejemplo la que empieza por `'Si eres titular de derechos`) y una fila en `rows` de `js/data/lang-updates.js`.
4. **`js/data/lang-updates.js`**: en el array `rows` añade una fila `[español, francés, italiano, portugués de Brasil, chino simplificado, chino tradicional]` por cada texto nuevo: los 7 de arriba, el título de la entrada nueva y las tres líneas de novedades. El primer elemento de cada fila es el texto español **idéntico, carácter por carácter**, al texto original (el de `changelog.js`, o el de `dev.html` / `js/ui/login.js` con los espacios normalizados); las traducciones las escribes tú, con el mismo sentido y el mismo tono que las filas que ya hay. `tests/i18n.test.cjs` falla si falta alguna de las novedades.
5. **Nuevo `tests/textos-nuevos.test.cjs`** (`node:test`): contiene la lista de los 7 textos del punto 3, tal cual. Para cada uno comprueba: (a) aparece en `dev.html` o en `js/ui/login.js` después de normalizar sus espacios (`texto.replace(/\s+/g, ' ')`); (b) es una clave del diccionario inglés, capturado cargando `js/data/lang-en.js` en un `vm` con un `G.I18n.add` falso que guarda lo que recibe con idioma `'en'` (como hace `tools/export_data.js`); (c) está en el diccionario de `fr`, `it`, `pt-BR`, `zh-Hans` y `zh-Hant` según `capture(SOURCES, '?')` de `tools/build_langs.js` (como hace `tests/i18n.test.cjs`).

**Files**
- `js/data/changelog.js`
- `js/data/lang-updates.js`
- `js/data/lang-en.js`
- `tests/textos-nuevos.test.cjs`

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization defined in `agents/blueprint-writer.md` *Acceptance strings*. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** la comprobación carga `js/data/changelog.js` **THE SYSTEM SHALL** encontrar en la primera entrada (una entrada nueva, con fecha `2026-10-20` o posterior y título `PokeKatens: versión no oficial`) líneas en español que contienen `PokeKatens` y `administrador`, cada una con su pareja en inglés.
2. **WHEN** `node --test "tests/*.test.cjs"` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 — `tests/i18n.test.cjs` falla si alguna línea de novedades con fecha `2026-10-18` o posterior no tiene su traducción al francés, italiano, portugués y chino.
3. **WHEN** `node --test "tests/*.test.cjs"` ejecuta `tests/textos-nuevos.test.cjs` **THE SYSTEM SHALL** comprobar que cada uno de los 7 textos nuevos de los pasos 3 y 5 aparece en `dev.html` o `js/ui/login.js` y tiene inglés en `js/data/lang-en.js` y traducción en `fr`, `it`, `pt-BR`, `zh-Hans` y `zh-Hant`.
4. **WHEN** `node tools/build.js --sin-seo` se ejecuta **THE SYSTEM SHALL** terminar con exit 0.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
node -e "const G={};new Function('G',require('fs').readFileSync('js/data/changelog.js','utf8'))(G);const e=G.CHANGELOG[0],l=[...(e.new||[]),...(e.chg||[]),...(e.fix||[])];const t=l.map(p=>p[0]).join(' ');process.exit(e.d>='2026-10-20'&&e.title[0].startsWith('PokeKatens')&&t.includes('PokeKatens')&&t.includes('administrador')&&l.every(p=>p[1])?0:1)"   # expect: exit 0
grep -qF "PokeKatens" js/data/lang-updates.js   # expect: exit 0 — las traducciones nuevas están
node --test "tests/*.test.cjs"   # expect: exit 0, 0 failed
node tools/build.js --sin-seo   # expect: exit 0 (la primera vez descarga terser y javascript-obfuscator con npx: hace falta internet)
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 10 (E2-T5): textos nuevos traducidos y novedades de PokeKatens"
git tag -f step-10-novedades
status=0; git log -1 --format=%B | grep -qi "co-authored-by" || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = el commit no lleva firma de IA (norma de los dueños)
git ls-files --error-unmatch tests/textos-nuevos.test.cjs   # expect: exit 0
```

Run these after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts. If this task or a later one goes wrong, follow the single recovery procedure (section *Volver atrás* above, the same as `blueprint.md` §9 rule 6) with NN = the first broken step, instead of debugging forward; `git tag -f` makes re-tagging after a recovery safe. Never invent the tag: copy the `checkpoint` field. The extra lines after the tag check that the commit carries no AI signature and that the files this task created are now tracked (only decidable after the commit).

---

## Epic acceptance

The epic is done when every task is `done` **and**:

1. **WHEN** `node tools/emu.cjs "node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs"` se ejecuta **THE SYSTEM SHALL** imprimir `EMULATOR_SMOKE_OK` y `EMULATOR_RANKING_OK`.
2. **WHEN** `grep -rlE "pokesurvivor-free|rshaa5gKD3fXw6lE4PPXITbowaG2|ko-fi.com/jpter78" dev.html index.html js firestore.rules .firebaserc` se ejecuta después del build **THE SYSTEM SHALL** no encontrar nada (exit 1).

```bash
node --test "tests/*.test.cjs" && node tools/export_data.js && node tools/build.js --sin-seo
out=$(node tools/emu.cjs "node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs"); echo "$out" | grep -qF EMULATOR_SMOKE_OK && echo "$out" | grep -qF EMULATOR_RANKING_OK
status=0; grep -rlE "pokesurvivor-free|rshaa5gKD3fXw6lE4PPXITbowaG2|ko-fi.com/jpter78" dev.html index.html js firestore.rules .firebaserc || status=$?; test "$status" -eq 1
```

Run from the project root. Both criteria are decidable by these commands.

## Pitfalls

- **`updatedAt` / `at` escritos por el cliente** — las reglas exigen la hora del servidor: usa `updateTransforms` con `setToServerValue: "REQUEST_TIME"`, nunca una fecha propia.
- **Faltar un campo o sobrar otro** — `validSaveDoc` y `validEntry` usan `hasOnly`: cualquier campo extra da 403 y la prueba «buena» falla.
- **Dejar los emuladores colgados** — corta con `Ctrl+C` sólo si se cuelgan; si el 8080 queda ocupado, cierra los `java.exe` que sobren antes de repetir.
- **Traducir distinto la clave** — la primera columna de `lang-updates.js` tiene que ser idéntica al español de `changelog.js`; un espacio de más rompe `tests/i18n.test.cjs`.
- **Borrar `en/` pensando que es el inglés del juego** — el inglés del juego vive en `js/data/lang-en.js`; `en/` eran páginas SEO.

## Before moving on

- [ ] Every task in this epic is `done` in `tasks.json` — no task left `in_progress`.
- [ ] Every `verify` command of every task in this epic passed, not just the first one.
- [ ] No `verify` command was edited, and none was skipped because a file it names did not exist.
- [ ] **Every task in this epic has its `checkpoint` tag in version control** — one tag per task, matching the `checkpoint` value in `tasks.json`. `git tag -l 'step-*'` lists them.
- [ ] Gate command passes clean, run from the project root.
- [ ] Every "Produced" contract above exists with the stated signature.
- [ ] No file outside the subtree was modified.
- [ ] `.env.example`: este proyecto no tiene variables de entorno propias; las del emulador las pone `emulators:exec`.
- [ ] One commit per task, each prefixed with its step and task id, each followed by its checkpoint tag, none with an AI signature.
