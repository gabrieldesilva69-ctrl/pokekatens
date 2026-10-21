# Epic 03: Escritorio y publicación

> Al acabar existe el instalador `desktop/dist/PokeKatens-Setup-1.0.0.exe`, que abre el juego (o una pantalla
> «Sin conexión»), probado también empaquetado; `CLAUDE.md` tiene las normas de PokeKatens; los dueños tienen su
> guía; y la versión final pasa la comprobación global.

| | |
|---|---|
| **Epic id** | `03-escritorio-y-publicacion` |
| **Tasks** | `E3-T1` … `E3-T5` |
| **Depends on** | `02-limpieza-y-datos` (y, a través de ella, `01-base-del-fork`) |
| **Unlocks** | la lista de lanzamiento de `blueprint.md` §20.1 (la hacen personas) |
| **Parallel with** | ninguna |

You do not need any other file to complete this epic. Everything below is repeated here on purpose.

Hace falta internet: `npm install --prefix desktop` descarga Electron (≈100 MB) y `npm --prefix desktop run dist`
descarga NSIS la primera vez. Si electron-builder falla al descomprimir con un error de «symbolic link» o
«privilege», activa el Modo de desarrollador de Windows (Configuración → Sistema → Para programadores) y repite;
no cambies la configuración del paquete.

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
desktop/                       # NUEVO
  package.json                 # NUEVO (E3-T1) — versiones exactas y config de electron-builder
  package-lock.json            # NUEVO (E3-T1) — lo escribe npm install; se sube
  main.js                      # NUEVO (E3-T1), se edita (E3-T2)
  offline.html                 # NUEVO (E3-T2)
  build/icon.png               # NUEVO (E3-T3) — copia de assets/icons/icon-512.png
  legal/LICENSE, legal/LICENSE-NONCOMMERCIAL.md   # NUEVOS (E3-T3) — copias exactas
  node_modules/, dist/         # ignorados por .gitignore
tools/desktop-smoke.cjs        # NUEVO (E3-T1)
tools/check-tags.cjs           # NUEVO (E3-T5) — comprueba las 15 etiquetas de paso
tools/serve.cjs                # de la épica 01, sólo lectura (lo arranca el arnés)
tools/emu.cjs, tests/emulator/*.cjs   # de la épica 02, sólo lectura (E3-T5 los ejecuta)
CLAUDE.md                      # existe, se SUSTITUYE (E3-T4) por blueprints/pokekatens/workspace/CLAUDE.md
AGENTS.md                      # llegó con el Bootstrap, sólo lectura
docs/GUIA-PUBLICAR-POKEKATENS.md   # NUEVO (E3-T4)
docs/PUBLICAR.md               # existe, se añade una primera línea (E3-T4)
index.html, js/app.min.js, version.json, js/lang/*.js   # GENERADOS (E3-T5)
assets/icons/icon-512.png, LICENSE, LICENSE-NONCOMMERCIAL.md   # existen, sólo lectura
js/core/updater.js, database.rules.json   # existen, PROHIBIDO tocarlos (E3-T5 lo comprueba)
```

Everything outside this subtree is out of scope. If a task seems to require editing a file not listed here,
stop and report — it means the epic boundary is wrong.

## Data model touched here

| Entity | Fields this epic adds or reads | Notes |
|---|---|---|
| `desktop/package.json` → `pokekatens.url` | `http://127.0.0.1:8123/` | La lista de lanzamiento lo cambia a `https://<usuario>.github.io/pokekatens/` |
| Datos del juego | ninguno | La app sólo abre la web; no guarda nada propio |

## Contracts

**Consumed** — already exists, do not rebuild:

| From | Interface | Guarantee |
|---|---|---|
| `01-base-del-fork` | `node tools/serve.cjs --port 0` | Escribe `PK_SERVE http://127.0.0.1:<puerto>/` y sirve el repo (`/` → `index.html`) |
| `02-limpieza-y-datos` | `node tools/emu.cjs "<comando>"` | Ejecuta el comando con los emuladores y devuelve su código |
| `02-limpieza-y-datos` | `tests/emulator/smoke.cjs`, `ranking.cjs` | Imprimen `EMULATOR_SMOKE_OK` / `EMULATOR_RANKING_OK` |
| repo | `js/core/updater.js` | Recarga la página cuando cambia `version.json`: por eso el `.exe` no lleva el juego dentro |

**Produced** — later epics depend on exactly these signatures. Changing one breaks them:

| Export | Signature | Used by |
|---|---|---|
| `desktop/main.js` | `PK_URL` / `PK_PROFILE` / `--smoke` / `PK_SMOKE_OUT` → `PK_SMOKE_OK` (0), `PK_SMOKE_OFFLINE` (0), `PK_SMOKE_TIMEOUT` (3) | `tools/desktop-smoke.cjs`, lista de lanzamiento |
| `tools/desktop-smoke.cjs` | modos `online`, `--offline`, `--hang`, `--exe <ruta>`, `--url <url>`, `--exe <ruta> --default` (sin `PK_URL`) → `DESKTOP_SMOKE_OK <modo>` (0) / `DESKTOP_SMOKE_FAIL …` (1); perfil nuevo en cada ejecución (`PK_PROFILE`) | `blueprint.md` §20.1, guía |
| `desktop/dist/PokeKatens-Setup-1.0.0.exe` | instalador NSIS de un clic, por usuario | los amigos |

## Conventions that bite in this area

- **Versiones exactas** en `desktop/package.json` (`44.9.2`, `26.15.3`, sin `^`) y `desktop/package-lock.json` se sube.
- **La ventana no expone nada**: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, sin `preload`. Carga una web remota: abrir algo nativo sería dejar que esa web controle el PC.
- **Las marcas de prueba no se cambian**: el arnés las busca letra por letra.
- **La marca se escribe también en `PK_SMOKE_OUT`**: en Windows la salida de una app de ventana no siempre llega a la consola; el arnés lee el archivo.
- **`${productName}`, `${version}`, `${ext}`** en `artifactName` son de electron-builder: se escriben tal cual.
- **Nunca `git push`** ni cambiar remotos: es de la lista de lanzamiento.

Full project rules: `CLAUDE.md` (el de PokeKatens desde `E3-T4`). Area rules: `.claude/rules/escritorio.md`.
They sit in the project root — the builder copied them there from the bundle's `workspace/` before task one.

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

### `E3-T1` — Crear la app de escritorio y abrirla por primera vez

**Depends on:** `E2-T5` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 11

El programa de Windows es una ventana de Electron que abre la web del juego (en la construcción, la local; tras el lanzamiento, la de GitHub Pages). No lleva el juego dentro: así se actualiza solo con cada `git push`, gracias a `js/core/updater.js`. Este paso crea el paquete y lo **ejecuta** ya, para que cualquier fallo de rutas salga aquí y no en el paso 13.

1. **Nuevo `desktop/package.json`** (contenido completo, 2 espacios; `${productName}`, `${version}` y `${ext}` son variables de electron-builder y se escriben tal cual):

   ```json
   {
     "name": "pokekatens",
     "productName": "PokeKatens",
     "version": "1.0.0",
     "description": "PokeKatens para Windows: versión no oficial y sin ánimo de lucro basada en PokéSurvivor de JPTER78",
     "author": "PokeKatens",
     "license": "SEE LICENSE IN legal/LICENSE-NONCOMMERCIAL.md",
     "private": true,
     "main": "main.js",
     "scripts": {
       "start": "electron .",
       "smoke": "electron . --smoke",
       "dist": "electron-builder --win nsis --x64"
     },
     "pokekatens": {
       "url": "http://127.0.0.1:8123/"
     },
     "devDependencies": {
       "electron": "44.9.2",
       "electron-builder": "26.15.3"
     },
     "build": {
       "appId": "com.pokekatens.app",
       "productName": "PokeKatens",
       "directories": { "output": "dist" },
       "files": ["main.js", "offline.html", "package.json"],
       "extraResources": [{ "from": "legal", "to": "legal" }],
       "win": { "target": "nsis", "icon": "build/icon.png" },
       "nsis": { "oneClick": true, "perMachine": false, "artifactName": "${productName}-Setup-${version}.${ext}" }
     }
   }
   ```
2. **Instala**: `npm install --prefix desktop` (escribe `desktop/package-lock.json`, que se sube al repositorio; `desktop/node_modules/` ya lo ignora la línea `node_modules/` de `.gitignore`).
3. **Nuevo `desktop/main.js`** (CommonJS):
   - `const URL_JUEGO = process.env.PK_URL || require('./package.json').pokekatens.url;` y `const SMOKE = process.argv.includes('--smoke');`.
   - Si existe `process.env.PK_PROFILE`, antes de `app.whenReady()`: `app.setPath('userData', process.env.PK_PROFILE)` (perfil limpio para las pruebas; sin la variable, el perfil normal del usuario).
   - Una sola `BrowserWindow`: `width: 1280`, `height: 720`, `autoHideMenuBar: true`, `title: 'PokeKatens'`, `backgroundColor: '#0a1430'`, `show: !SMOKE`, y `webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false }` — **sin `preload`**: la página no tiene ningún acceso a Node.
   - `webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; })` y un `will-navigate` que, si el destino es `http(s)` de **otro origen** que `URL_JUEGO`, hace `preventDefault()` y lo abre con `shell.openExternal`.
   - `fin(codigo, marca)`: escribe `marca` con `console.log`, y si existe `process.env.PK_SMOKE_OUT` la escribe también en ese archivo (`fs.writeFileSync`); después `app.exit(codigo)`.
   - Con `SMOKE`: en `did-finish-load`, si la URL actual no empieza por `file:` → `fin(0, 'PK_SMOKE_OK')`; y un temporizador de 30 000 ms → `fin(3, 'PK_SMOKE_TIMEOUT')`.
   - `win.loadURL(URL_JUEGO)`; `app.on('window-all-closed', () => app.quit())`.
4. **Nuevo `tools/desktop-smoke.cjs`** (CommonJS, sólo módulos de Node), el arnés que prueba la app sin manos:
   - Modos: sin argumentos (`online`) · `--offline` · `--hang` · `--exe <ruta>` (como `online`, pero ejecuta ese `.exe` empaquetado). Opcional con `online`/`--exe`: `--url <url>` usa esa URL como `PK_URL` en vez de arrancar el servidor local. Opcional con `--exe`: `--default` (modo `default`) **no** pasa `PK_URL` (la quita también si venía del entorno), así el programa usa el `pokekatens.url` que lleva dentro; el arnés lee esa URL de `desktop/package.json` (la misma que se empaquetó) y, sólo si es `http://127.0.0.1:8123/`, arranca antes `node tools/serve.cjs --port 8123` (si el puerto está ocupado, falla con un mensaje claro). Con la URL de GitHub Pages del lanzamiento no arranca nada.
   - Binario: con `--exe`, esa ruta; si no, `require(<raíz>/desktop/node_modules/electron)` (devuelve la ruta de `electron.exe`) con argumentos `[<raíz>/desktop, '--smoke']`; con `--exe`, sólo `['--smoke']`.
   - `PK_URL`: con `--url`, esa; si no, en `online` arranca `node tools/serve.cjs --port 0` (con `process.execPath`), espera la línea `PK_SERVE http://127.0.0.1:<puerto>/` y usa `<esa URL>index.html`; en `--offline`, `http://127.0.0.1:1/`; en `--hang`, un `net.createServer()` en `127.0.0.1` y puerto 0 que acepta conexiones y no contesta nunca → `http://127.0.0.1:<puerto>/`.
   - Lanza la app con `env` = el del proceso + `PK_URL` (salvo en `default`) + `PK_SMOKE_OUT` (un archivo nuevo en `os.tmpdir()`) + `PK_PROFILE` (una carpeta nueva y vacía de `fs.mkdtempSync` en `os.tmpdir()`: cada prueba empieza sin caché ni service worker), espera a que salga (máximo 60 s; si no, la mata y falla), y cierra el servidor que haya arrancado.
   - Éxito: `online` y `default` → código 0 y marca `PK_SMOKE_OK` · `offline` → código 0 y `PK_SMOKE_OFFLINE` · `hang` → código **3** y `PK_SMOKE_TIMEOUT`. La marca se lee del archivo `PK_SMOKE_OUT` (si no existe, de la salida de la app). Si coincide escribe `DESKTOP_SMOKE_OK <modo>` (con `--exe` el modo es `online`) y sale con 0; si no, `DESKTOP_SMOKE_FAIL <modo>: código <c>, marca <m>` y sale con 1.

El modo `--offline` todavía no pasa en este paso (lo hace pasar el 12); este `Verify` no lo usa.

**Files**
- `desktop/package.json`
- `desktop/package-lock.json`
- `desktop/main.js`
- `tools/desktop-smoke.cjs`

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization defined in `agents/blueprint-writer.md` *Acceptance strings*. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `npm install --prefix desktop` se ejecuta **THE SYSTEM SHALL** terminar con exit 0, instalar `electron` 44.9.2 y `electron-builder` 26.15.3 y escribir `desktop/package-lock.json`.
2. **WHEN** se lee la versión instalada de `desktop/node_modules/electron/package.json` y de `desktop/node_modules/electron-builder/package.json` **THE SYSTEM SHALL** ser `44.9.2` y `26.15.3`.
3. **WHEN** `node tools/desktop-smoke.cjs` se ejecuta **THE SYSTEM SHALL** arrancar `tools/serve.cjs` en un puerto libre, abrir la app con `PK_URL` apuntando a `index.html` y `--smoke`, recibir `PK_SMOKE_OK`, imprimir `DESKTOP_SMOKE_OK online` y terminar con exit 0.
4. **WHEN** `node tools/desktop-smoke.cjs --hang` abre la app contra un servidor que acepta la conexión y nunca contesta **THE SYSTEM SHALL** ver la app salir con código 3 (`PK_SMOKE_TIMEOUT`) a los 30 segundos e imprimir `DESKTOP_SMOKE_OK hang`.
5. **WHEN** se busca en `desktop/main.js` **THE SYSTEM SHALL** encontrar `setWindowOpenHandler`, `contextIsolation: true`, `sandbox: true` y `nodeIntegration: false`.
6. **WHEN** `git check-ignore -q desktop/node_modules/electron/package.json` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 (las dependencias no se suben al repositorio).

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
npm install --prefix desktop   # expect: exit 0 (descarga Electron: hace falta internet)
test "$(node -p "require('./desktop/node_modules/electron/package.json').version")" = 44.9.2   # expect: exit 0
test "$(node -p "require('./desktop/node_modules/electron-builder/package.json').version")" = 26.15.3   # expect: exit 0
test -f desktop/package-lock.json   # expect: exit 0
node tools/desktop-smoke.cjs | grep -F "DESKTOP_SMOKE_OK online"   # expect: exit 0
node tools/desktop-smoke.cjs --hang | grep -F "DESKTOP_SMOKE_OK hang"   # expect: exit 0 (tarda unos 30 s)
grep -qF "setWindowOpenHandler" desktop/main.js   # expect: exit 0
grep -qF "contextIsolation: true" desktop/main.js   # expect: exit 0
grep -qF "sandbox: true" desktop/main.js   # expect: exit 0
grep -qF "nodeIntegration: false" desktop/main.js   # expect: exit 0
git check-ignore -q desktop/node_modules/electron/package.json   # expect: exit 0 — 0 = ignorado
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 11 (E3-T1): app de escritorio con Electron"
git tag -f step-11-escritorio-base
status=0; git log -1 --format=%B | grep -qi "co-authored-by" || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = el commit no lleva firma de IA (norma de los dueños)
git ls-files --error-unmatch desktop/package.json desktop/package-lock.json desktop/main.js tools/desktop-smoke.cjs   # expect: exit 0
```

Run these after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts. If this task or a later one goes wrong, follow the single recovery procedure (section *Volver atrás* above, the same as `blueprint.md` §9 rule 6) with NN = the first broken step, instead of debugging forward; `git tag -f` makes re-tagging after a recovery safe. Never invent the tag: copy the `checkpoint` field. The extra lines after the tag check that the commit carries no AI signature and that the files this task created are now tracked (only decidable after the commit).

### `E3-T2` — Mostrar la pantalla Sin conexión cuando no carga

**Depends on:** `E3-T1` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 12

Si no hay internet (o la web no responde), en vez de una ventana en blanco sale una pantalla clara con un botón para reintentar. Ojo: el juego registra un *service worker* (`sw.js`, desde `js/main.js`); después de la primera carga con conexión, sin internet ese service worker sirve la copia guardada del juego y la carga **no** falla, así que `offline.html` sólo aparece cuando la web nunca se ha cargado en ese perfil. La prueba `--offline` usa un perfil nuevo (`PK_PROFILE`) y prueba justo eso: el primer arranque sin conexión.

1. **Nuevo `desktop/offline.html`**: página autónoma, sin archivos externos.
   - `<!doctype html>`, `<html lang="es">`, `<meta charset="utf-8">`, `<title>PokeKatens · Sin conexión</title>` y esta CSP: `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'">`.
   - Colores del juego, escritos aquí tal cual: fondo `#0a1430`, texto `#ffffff`, título `#ffd84a`, botón con fondo `#ffd84a` y texto `#0a1430`, radio 10 px, letra `system-ui, sans-serif` (contraste del botón ≈ 13:1 y del texto ≈ 18:1, ambos por encima de 4.5:1).
   - Contenido: `<h1>Sin conexión</h1>`, el párrafo `No se ha podido abrir PokeKatens. Comprueba tu conexión a internet y vuelve a intentarlo.` y `<button id="reintentar" type="button">Reintentar</button>`, con borde de foco visible (`outline: 3px solid #ffffff` en `:focus-visible`).
   - Script en línea: lee `url` de `location.search` (`new URLSearchParams(location.search).get('url')`); al pulsar el botón, sólo si esa URL empieza por `http://` o `https://`, hace `location.href = url`.
2. **`desktop/main.js`**:
   - Variable `fallo = false`. `webContents.on('did-fail-load', (e, codigo, desc, url, esPrincipal) => { … })`: si no es el marco principal o `codigo === -3` (carga cancelada), no hace nada; si no, `fallo = true` y `win.loadFile(path.join(__dirname, 'offline.html'), { query: { url: URL_JUEGO } })`.
   - El `did-finish-load` de `SMOKE` pasa a: si la URL actual empieza por `file:` → `fin(0, 'PK_SMOKE_OFFLINE')`; si no y `fallo` es `false` → `fin(0, 'PK_SMOKE_OK')`; si `fallo` es `true` y la URL no es `file:`, espera (llegará la de `offline.html`).

**Files**
- `desktop/offline.html`
- `desktop/main.js`

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization defined in `agents/blueprint-writer.md` *Acceptance strings*. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `node tools/desktop-smoke.cjs --offline` se ejecuta **THE SYSTEM SHALL** abrir la app con `PK_URL=http://127.0.0.1:1/`, ver fallar la carga del marco principal, mostrar `offline.html`, recibir `PK_SMOKE_OFFLINE`, imprimir `DESKTOP_SMOKE_OK offline` y terminar con exit 0.
2. **WHEN** `node tools/desktop-smoke.cjs` se ejecuta **THE SYSTEM SHALL** seguir imprimiendo `DESKTOP_SMOKE_OK online` (la página del juego carga y `offline.html` no aparece).
3. **WHEN** se busca en `desktop/offline.html` **THE SYSTEM SHALL** encontrar `<html lang="es">`, el texto `Sin conexión` y un botón `Reintentar`, y `desktop/main.js` SHALL contener `did-fail-load`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
node tools/desktop-smoke.cjs --offline | grep -F "DESKTOP_SMOKE_OK offline"   # expect: exit 0
node tools/desktop-smoke.cjs | grep -F "DESKTOP_SMOKE_OK online"   # expect: exit 0
grep -qF '<html lang="es">' desktop/offline.html   # expect: exit 0
grep -qF "Sin conexión" desktop/offline.html   # expect: exit 0
grep -qF "Reintentar" desktop/offline.html   # expect: exit 0
grep -qF "did-fail-load" desktop/main.js   # expect: exit 0
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 12 (E3-T2): pantalla Sin conexión en la app de escritorio"
git tag -f step-12-sin-conexion
status=0; git log -1 --format=%B | grep -qi "co-authored-by" || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = el commit no lleva firma de IA (norma de los dueños)
git ls-files --error-unmatch desktop/offline.html   # expect: exit 0
```

Run these after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts. If this task or a later one goes wrong, follow the single recovery procedure (section *Volver atrás* above, the same as `blueprint.md` §9 rule 6) with NN = the first broken step, instead of debugging forward; `git tag -f` makes re-tagging after a recovery safe. Never invent the tag: copy the `checkpoint` field. The extra lines after the tag check that the commit carries no AI signature and that the files this task created are now tracked (only decidable after the commit).

### `E3-T3` — Generar el instalador PokeKatens-Setup-1.0.0.exe

**Depends on:** `E3-T2` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 13

El instalador que se pasa a los amigos. **Sin firma de código** (costaría dinero): Windows avisará con SmartScreen y la guía explica cómo seguir.

1. Copia los archivos que el instalador necesita (copias exactas, se suben al repositorio):

   ```bash
   mkdir -p desktop/build desktop/legal
   cp assets/icons/icon-512.png desktop/build/icon.png
   cp LICENSE desktop/legal/LICENSE
   cp LICENSE-NONCOMMERCIAL.md desktop/legal/LICENSE-NONCOMMERCIAL.md
   ```
   (Las licencias viajan dentro del programa, en `resources/legal/`, por la configuración `extraResources` del paso 11: la licencia de JPTER78 obliga a dar sus términos y su *Required Notice* a quien reciba una copia.)
2. Construye: `npm --prefix desktop run dist` (sólo 64 bits, `--x64`, para que `win-unpacked/` sea siempre la misma carpeta). Crea `desktop/dist/PokeKatens-Setup-1.0.0.exe` (instalador de un clic, para el usuario, sin permisos de administrador) y `desktop/dist/win-unpacked/PokeKatens.exe` (el programa sin instalar, que usa la prueba). `desktop/dist/` está en `.gitignore` desde el Bootstrap (§10): nada de esto se sube.

El `Verify` prueba el programa empaquetado de dos formas: con `PK_URL` (`--exe`) y **sin** ella (`--exe … --default`), que es como lo abren los amigos: usa la URL de fábrica `http://127.0.0.1:8123/`, y el arnés arranca para ello `tools/serve.cjs` en el puerto 8123, que tiene que estar libre.

Si electron-builder falla al descomprimir sus herramientas con un error de «symbolic link» o «privilege», activa el Modo de desarrollador de Windows (§10 Requisitos) y repite el comando; no cambies la configuración del paquete.

**Files**
- `desktop/build/icon.png`
- `desktop/legal/LICENSE`
- `desktop/legal/LICENSE-NONCOMMERCIAL.md`

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization defined in `agents/blueprint-writer.md` *Acceptance strings*. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `cmp` compara `desktop/build/icon.png` con `assets/icons/icon-512.png` y los dos archivos de `desktop/legal/` con `LICENSE` y `LICENSE-NONCOMMERCIAL.md` **THE SYSTEM SHALL** decir que son idénticos (exit 0).
2. **WHEN** `npm --prefix desktop run dist` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 y crear `desktop/dist/PokeKatens-Setup-1.0.0.exe` no vacío.
3. **WHEN** `node tools/desktop-smoke.cjs --exe desktop/dist/win-unpacked/PokeKatens.exe` se ejecuta **THE SYSTEM SHALL** imprimir `DESKTOP_SMOKE_OK online` — el programa empaquetado encuentra su `main.js` y carga el juego.
4. **WHEN** `test -f desktop/dist/win-unpacked/resources/legal/LICENSE-NONCOMMERCIAL.md` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 (la licencia viaja con el programa).
5. **WHEN** `git check-ignore -q desktop/dist/PokeKatens-Setup-1.0.0.exe` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 (el instalador nunca se sube al repositorio).
6. **WHEN** `node tools/desktop-smoke.cjs --exe desktop/dist/win-unpacked/PokeKatens.exe --default` se ejecuta **THE SYSTEM SHALL** arrancar `tools/serve.cjs` en el puerto 8123, abrir el programa empaquetado sin `PK_URL` (usa el `pokekatens.url` que lleva dentro, `http://127.0.0.1:8123/`) e imprimir `DESKTOP_SMOKE_OK default`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
cmp assets/icons/icon-512.png desktop/build/icon.png   # expect: exit 0
cmp LICENSE desktop/legal/LICENSE   # expect: exit 0
cmp LICENSE-NONCOMMERCIAL.md desktop/legal/LICENSE-NONCOMMERCIAL.md   # expect: exit 0
npm --prefix desktop run dist   # expect: exit 0 (la primera vez descarga NSIS: hace falta internet)
test -s desktop/dist/PokeKatens-Setup-1.0.0.exe   # expect: exit 0
test -f desktop/dist/win-unpacked/resources/legal/LICENSE-NONCOMMERCIAL.md   # expect: exit 0
node tools/desktop-smoke.cjs --exe desktop/dist/win-unpacked/PokeKatens.exe | grep -F "DESKTOP_SMOKE_OK online"   # expect: exit 0
git check-ignore -q desktop/dist/PokeKatens-Setup-1.0.0.exe   # expect: exit 0 — 0 = ignorado
node tools/desktop-smoke.cjs --exe desktop/dist/win-unpacked/PokeKatens.exe --default | grep -F "DESKTOP_SMOKE_OK default"   # expect: exit 0 — la URL de fábrica del programa (el puerto 8123 tiene que estar libre)
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 13 (E3-T3): instalador de Windows"
git tag -f step-13-instalador
status=0; git log -1 --format=%B | grep -qi "co-authored-by" || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = el commit no lleva firma de IA (norma de los dueños)
git ls-files --error-unmatch desktop/build/icon.png desktop/legal/LICENSE desktop/legal/LICENSE-NONCOMMERCIAL.md   # expect: exit 0
```

Run these after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts. If this task or a later one goes wrong, follow the single recovery procedure (section *Volver atrás* above, the same as `blueprint.md` §9 rule 6) with NN = the first broken step, instead of debugging forward; `git tag -f` makes re-tagging after a recovery safe. Never invent the tag: copy the `checkpoint` field. The extra lines after the tag check that the commit carries no AI signature and that the files this task created are now tracked (only decidable after the commit).

### `E3-T4` — Poner las normas de PokeKatens y la guía para publicar

**Depends on:** `E3-T3` · **Priority:** p1 — metadata for scope cuts, not a running order · **Paso de §9:** 14

Las normas del dueño original se sustituyen por las de PokeKatens (las que siguen valiendo se mantienen, reescritas) y los dueños nuevos reciben una guía paso a paso para lo que tienen que hacer a mano.

1. **`CLAUDE.md`**: sustitúyelo por la versión ya fusionada del bundle: `cp blueprints/pokekatens/workspace/CLAUDE.md CLAUDE.md`. Esa versión conserva todas las normas del dueño anterior que siguen valiendo (editar `dev.html`, nunca `index.html`; commits sin firma de IA; `push` sólo cuando lo pidan los dueños; actualización automática y `version.json`; novedades en español e inglés; nunca Identity Platform; mantenimiento con `MAINTENANCE`) y cambia las que eran suyas (su proyecto de Firebase, su dominio, Cloudflare, el TURN, el comando de publicar con SEO). `AGENTS.md` ya llegó con la copia del Bootstrap y no se toca.
2. **Nuevo `docs/GUIA-PUBLICAR-POKEKATENS.md`**: guía para personas que no programan, en español de España, con frases cortas y cada comando en su propio bloque para copiar y pegar en Git Bash. Apartados, en este orden (es la lista de lanzamiento de §20.1 contada para los dueños):
   1. **Qué es cada cosa** — GitHub (dónde vive el código y la web), Firebase (cuentas, partidas, ranking, amigos, salas), el `.exe` (una ventana que abre la web).
   2. **Antes de empezar: Java 21 y Modo de programador** — las dos cosas se instalan **antes** de lanzar la construcción (`/architect-next`), porque el Bootstrap las comprueba y se para si faltan. Modo de programador: Configuración → Sistema → Para programadores → Modo de programador (lo necesita el instalador `.exe`). Java: por qué hace falta (sólo para las pruebas locales) y cómo instalarlo: `winget install --id EclipseAdoptium.Temurin.21.JDK -e --silent --accept-package-agreements --accept-source-agreements` (marcado «verificar antes de instalar»); cerrar y abrir Git Bash; comprobar con `node tools/emu.cjs --check-java`.
   3. **Cuenta y repositorio de GitHub** — crear la cuenta, crear el repositorio **público** `pokekatens` (sin README) y conectar la copia local: `git remote rename origin upstream`, `git remote add origin https://github.com/<usuario>/pokekatens.git`, `git push -u origin main`. Activar Pages: Settings → Pages → Branch `main` / carpeta `/ (root)`.
   4. **Proyecto de Firebase** — crear el proyecto (plan Spark, gratis; sin Google Analytics). Activar Authentication → Método de acceso → **Correo electrónico/contraseña**. Crear Firestore (modo producción) y Realtime Database. **Aviso en grande: no pulséis nunca «Actualizar a Identity Platform» ni nada que lo active (funciones de bloqueo, MFA): cobra por usuario.**
   5. **Conectar el juego con vuestro Firebase** — registrar una app web, copiar su configuración en `js/core/firebase-config.js` **sin** `emulator: true` (y con su `databaseURL`); en `js/core/fork-config.js` poner `site: 'https://<usuario>.github.io/pokekatens/'`, añadir `'<usuario>.github.io'` a `hosts` y `repo: 'https://github.com/<usuario>/pokekatens'`; en `.firebaserc` poner el id real del proyecto. Authentication → Configuración → Dominios autorizados: añadir `<usuario>.github.io`.
   6. **Subir las reglas** — `npx --yes firebase-tools@15.34.0 login` y después `npx --yes firebase-tools@15.34.0 deploy --only firestore:rules,firestore:indexes,database`.
   7. **Primera cuenta y administrador** — crear vuestra cuenta en la web publicada; copiar su UID (Firebase → Authentication → Usuarios); ponerlo en `G.FORK.admins` y en `firestore.rules` (`function admin() { return signedIn() && me() in ['<UID>']; }`); volver a subir las reglas (comando del apartado 6).
   8. **Publicar una versión** — `node --test "tests/*.test.cjs"`, `node tools/build.js --sin-seo`, `git add -A`, `git commit -m "<qué cambia>"` (sin firmas de IA), `git push`. En unos 5 minutos todos los jugadores (web y `.exe`) pasan solos a la versión nueva.
   9. **El `.exe`** — en `desktop/package.json` poner `"url": "https://<usuario>.github.io/pokekatens/"` en `pokekatens`; `npm ci --prefix desktop` y `npm --prefix desktop run dist`; comprobarlo tal como lo abrirán los amigos (sin servidor local ni URL a mano) con `node tools/desktop-smoke.cjs --exe desktop/dist/win-unpacked/PokeKatens.exe --default` (debe decir `DESKTOP_SMOKE_OK default`); compartir `desktop/dist/PokeKatens-Setup-1.0.0.exe` (Google Drive o Discord). Sólo hay que rehacerlo si cambia algo de `desktop/`.
   10. **Sin internet** — la primera vez, el programa necesita internet; si no lo hay, sale la pantalla «Sin conexión» con el botón Reintentar. Después de haber cargado el juego una vez, el programa guarda una copia (el *service worker* `sw.js`) y sin internet abre esa copia: se ve el juego, pero sin cuentas, ranking ni cooperativo hasta que vuelva la conexión.
   11. **El aviso de Windows (SmartScreen)** — como el programa no está firmado, Windows dice «Windows protegió su PC»: pulsar **Más información** → **Ejecutar de todas formas**. Algún antivirus puede avisar también.
   12. **Cooperativo** — va por conexión directa: en algunas redes (datos móviles, algunos routers con CGNAT) dos jugadores no pueden conectarse entre sí. No hay arreglo gratuito (haría falta un servidor TURN de pago).
   13. **Si alguien olvida la contraseña** — no hay correo de recuperación: lo más fácil es crear otra cuenta con otro nombre. Si queréis liberar el nombre antiguo: Firebase → Authentication → borrar ese usuario, y en Firestore borrar su documento de `names`.
   14. **Opcional** — restringir la clave de la API a `<usuario>.github.io` en Google Cloud (APIs y servicios → Credenciales).
   15. **Obligaciones de la licencia** — no cobrar nada, mantener `LICENSE`, `LICENSE-NONCOMMERCIAL.md`, la línea *Required Notice* y el crédito visible a JPTER78.
3. **`docs/PUBLICAR.md`**: añade como **primera línea** `> **PokeKatens:** esta guía es la del juego original (pokesurvivor.com). Para publicar PokeKatens usa [GUIA-PUBLICAR-POKEKATENS.md](GUIA-PUBLICAR-POKEKATENS.md).` y una línea en blanco; el resto se queda como estaba.

**Files**
- `CLAUDE.md`
- `docs/GUIA-PUBLICAR-POKEKATENS.md`
- `docs/PUBLICAR.md`

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization defined in `agents/blueprint-writer.md` *Acceptance strings*. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `diff -q CLAUDE.md blueprints/pokekatens/workspace/CLAUDE.md` y `diff -q AGENTS.md blueprints/pokekatens/workspace/AGENTS.md` se ejecutan **THE SYSTEM SHALL** terminar ambos con exit 0.
2. **WHEN** `wc -l < CLAUDE.md` se ejecuta **THE SYSTEM SHALL** dar un número menor que 200.
3. **WHEN** `grep -nE "pokesurvivor-free|export_data.js && python" CLAUDE.md` se ejecuta **THE SYSTEM SHALL** no encontrar nada (exit 1).
4. **WHEN** se busca en `docs/GUIA-PUBLICAR-POKEKATENS.md` **THE SYSTEM SHALL** encontrar cada uno de `git remote rename origin upstream`, `firebase-tools@15.34.0 deploy --only firestore:rules,firestore:indexes,database`, `Identity Platform`, `Ejecutar de todas formas`, `npm --prefix desktop run dist` y `node tools/build.js --sin-seo`.
5. **WHEN** se leen las 5 primeras líneas de `docs/PUBLICAR.md` **THE SYSTEM SHALL** encontrar `GUIA-PUBLICAR-POKEKATENS.md`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
diff -q CLAUDE.md blueprints/pokekatens/workspace/CLAUDE.md   # expect: exit 0
diff -q AGENTS.md blueprints/pokekatens/workspace/AGENTS.md   # expect: exit 0
test "$(wc -l < CLAUDE.md)" -lt 200   # expect: exit 0
status=0; grep -nE "pokesurvivor-free|export_data.js && python" CLAUDE.md || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = ninguna coincidencia
grep -qF "git remote rename origin upstream" docs/GUIA-PUBLICAR-POKEKATENS.md   # expect: exit 0
grep -qF "firebase-tools@15.34.0 deploy --only firestore:rules,firestore:indexes,database" docs/GUIA-PUBLICAR-POKEKATENS.md   # expect: exit 0
grep -qF "Identity Platform" docs/GUIA-PUBLICAR-POKEKATENS.md   # expect: exit 0
grep -qF "Ejecutar de todas formas" docs/GUIA-PUBLICAR-POKEKATENS.md   # expect: exit 0
grep -qF "npm --prefix desktop run dist" docs/GUIA-PUBLICAR-POKEKATENS.md   # expect: exit 0
grep -qF "node tools/build.js --sin-seo" docs/GUIA-PUBLICAR-POKEKATENS.md   # expect: exit 0
head -n 5 docs/PUBLICAR.md | grep -qF "GUIA-PUBLICAR-POKEKATENS.md"   # expect: exit 0
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 14 (E3-T4): normas de PokeKatens y guía para publicar"
git tag -f step-14-normas-y-guia
status=0; git log -1 --format=%B | grep -qi "co-authored-by" || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = el commit no lleva firma de IA (norma de los dueños)
git ls-files --error-unmatch docs/GUIA-PUBLICAR-POKEKATENS.md   # expect: exit 0
```

Run these after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts. If this task or a later one goes wrong, follow the single recovery procedure (section *Volver atrás* above, the same as `blueprint.md` §9 rule 6) with NN = the first broken step, instead of debugging forward; `git tag -f` makes re-tagging after a recovery safe. Never invent the tag: copy the `checkpoint` field. The extra lines after the tag check that the commit carries no AI signature and that the files this task created are now tracked (only decidable after the commit).

### `E3-T5` — Construir la versión final y pasar la comprobación global

**Depends on:** `E3-T4` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 15

La versión que se publicará. El único código nuevo es la pequeña herramienta `tools/check-tags.cjs`; el resto es construir y pasar **la comprobación global** (la misma de §20.1) sobre el árbol que dejan los pasos 1-14.

1. **Nuevo `tools/check-tags.cjs`** (CommonJS, sólo módulos de Node). Lleva escrita la lista de las 15 etiquetas de paso del mapa de §9 (`step-01-config-fork`, `step-02-servidor-local`, `step-03-sin-google`, `step-04-sin-turn`, `step-05-identidad`, `step-06-sin-seo`, `step-07-sin-donaciones`, `step-08-emulador`, `step-09-reglas-admin`, `step-10-novedades`, `step-11-escritorio-base`, `step-12-sin-conexion`, `step-13-instalador`, `step-14-normas-y-guia`, `step-15-version-final`) y, para cada una, ejecuta `execFileSync('git', ['merge-base', '--is-ancestor', etiqueta, 'HEAD'])`. Si alguna falla (no existe o no es antepasada de `HEAD`) escribe `Falta la etiqueta <etiqueta> en la historia de HEAD` y sigue con las demás; al final sale con 0 sólo si las 15 pasan (escribe `ETIQUETAS_OK 15`), y con 1 si no. `step-00-preparacion` no está en la lista. Lo ejecuta el Checkpoint de este paso, después de `git tag -f step-15-version-final`.
2. `node tools/build.js --sin-seo` (regenera `index.html`, `js/app.min.js`, `version.json` y `js/lang/*.js`: archivos generados, no se editan a mano).
3. Ejecuta todas las líneas del `Verify` en orden. Si alguna falla, el fallo es de un paso anterior NN: aplica el procedimiento «Volver atrás» de §9 (regla 6) con ese NN — `git reset --hard` a la etiqueta del paso NN-1, `git tag -d` de cada etiqueta desde la del paso NN hasta la última creada, tareas NN y siguientes en `pending` en `tasks.json` — y rehaz desde el paso NN hasta este. No cambies ninguna línea del `Verify`.

No se hace `git push`: subir a GitHub es parte de la lista de lanzamiento (§20.1), que hacen los dueños.

**Files**
- `index.html`
- `js/app.min.js`
- `version.json`
- `tools/check-tags.cjs`

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization defined in `agents/blueprint-writer.md` *Acceptance strings*. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `node tools/build.js --sin-seo` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 y `version.json` SHALL tener un `v` de 10 caracteres hexadecimales y un `at` que es una fecha válida.
2. **WHEN** `grep -rlE "GoogleAuthProvider|ice\.pokesurvivor\.com|apis\.google\.com|rshaa5gKD3fXw6lE4PPXITbowaG2|pokesurvivor-free" dev.html index.html js/app.min.js js/core js/ui js/net` se ejecuta **THE SYSTEM SHALL** no encontrar nada (exit 1).
3. **WHEN** `node --test "tests/*.test.cjs"` y `node tools/export_data.js` se ejecutan **THE SYSTEM SHALL** terminar ambos con exit 0.
4. **WHEN** la prueba del emulador se ejecuta con los dos scripts **THE SYSTEM SHALL** imprimir `EMULATOR_SMOKE_OK` y `EMULATOR_RANKING_OK`.
5. **WHEN** `node tools/desktop-smoke.cjs` y `node tools/desktop-smoke.cjs --offline` se ejecutan **THE SYSTEM SHALL** imprimir `DESKTOP_SMOKE_OK online` y `DESKTOP_SMOKE_OK offline`, y `desktop/dist/PokeKatens-Setup-1.0.0.exe` SHALL existir y no estar vacío.
6. **WHEN** `git diff --quiet step-00-preparacion -- js/core/updater.js database.rules.json` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 (el actualizador y las reglas del cooperativo no han cambiado) y `tools/build.js` SHALL seguir escribiendo `version.json`.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
node tools/build.js --sin-seo   # expect: exit 0 (la primera vez descarga terser y javascript-obfuscator con npx: hace falta internet)
node -e "const j=JSON.parse(require('fs').readFileSync('version.json','utf8'));process.exit(/^[0-9a-f]{10}$/.test(j.v)&&!isNaN(Date.parse(j.at))?0:1)"   # expect: exit 0
status=0; grep -rlE "GoogleAuthProvider|ice\.pokesurvivor\.com|apis\.google\.com|rshaa5gKD3fXw6lE4PPXITbowaG2|pokesurvivor-free" dev.html index.html js/app.min.js js/core js/ui js/net || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = ninguna coincidencia
node --test "tests/*.test.cjs"   # expect: exit 0, 0 failed
node tools/export_data.js   # expect: exit 0
out=$(node tools/emu.cjs "node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs"); echo "$out" | grep -qF EMULATOR_SMOKE_OK && echo "$out" | grep -qF EMULATOR_RANKING_OK   # expect: exit 0 — las dos marcas
node tools/desktop-smoke.cjs | grep -F "DESKTOP_SMOKE_OK online"   # expect: exit 0
node tools/desktop-smoke.cjs --offline | grep -F "DESKTOP_SMOKE_OK offline"   # expect: exit 0
test -s desktop/dist/PokeKatens-Setup-1.0.0.exe   # expect: exit 0
git diff --quiet step-00-preparacion -- js/core/updater.js database.rules.json   # expect: exit 0 — sin cambios desde antes del paso 1
grep -qF "version.json" tools/build.js   # expect: exit 0
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 15 (E3-T5): versión final de PokeKatens"
git tag -f step-15-version-final
status=0; git log -1 --format=%B | grep -qi "co-authored-by" || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = el commit no lleva firma de IA (norma de los dueños)
node tools/check-tags.cjs   # expect: exit 0 — las 15 etiquetas de paso del mapa de §9 existen y son antepasadas de HEAD (step-00-preparacion no cuenta)
git ls-files --error-unmatch tools/check-tags.cjs   # expect: exit 0
```

Run these after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts. If this task or a later one goes wrong, follow the single recovery procedure (section *Volver atrás* above, the same as `blueprint.md` §9 rule 6) with NN = the first broken step, instead of debugging forward; `git tag -f` makes re-tagging after a recovery safe. Never invent the tag: copy the `checkpoint` field. The extra lines after the tag check that the commit carries no AI signature and that the files this task created are now tracked (only decidable after the commit).

---

## Epic acceptance

The epic is done when every task is `done` **and**:

1. **WHEN** `node tools/desktop-smoke.cjs --exe desktop/dist/win-unpacked/PokeKatens.exe`, `node tools/desktop-smoke.cjs --exe desktop/dist/win-unpacked/PokeKatens.exe --default` y `node tools/desktop-smoke.cjs --offline` se ejecutan **THE SYSTEM SHALL** imprimir `DESKTOP_SMOKE_OK online`, `DESKTOP_SMOKE_OK default` y `DESKTOP_SMOKE_OK offline`.
2. **WHEN** `node tools/check-tags.cjs` comprueba cada una de las 15 etiquetas de paso del mapa de §9 de `blueprint.md` con `git merge-base --is-ancestor <etiqueta> HEAD` **THE SYSTEM SHALL** encontrar las 15 en la historia de `HEAD` y terminar con exit 0.

```bash
node tools/desktop-smoke.cjs --exe desktop/dist/win-unpacked/PokeKatens.exe | grep -F "DESKTOP_SMOKE_OK online"
node tools/desktop-smoke.cjs --exe desktop/dist/win-unpacked/PokeKatens.exe --default | grep -F "DESKTOP_SMOKE_OK default"
node tools/desktop-smoke.cjs --offline | grep -F "DESKTOP_SMOKE_OK offline"
node tools/check-tags.cjs   # expect: exit 0 — las 15 etiquetas de paso del mapa de §9 existen y son antepasadas de HEAD (step-00-preparacion no cuenta)
```

Run from the project root. Both criteria are decidable by these commands. Después, la lista de lanzamiento de
`blueprint.md` §20.1 (y la guía `docs/GUIA-PUBLICAR-POKEKATENS.md`) la hacen los dueños.

## Pitfalls

- **Esperar un mensaje en la consola en vez de leer `PK_SMOKE_OUT`** — una app de ventana en Windows puede no escribir en la consola de Git Bash; el arnés lee el archivo.
- **Confundir `did-finish-load` de la página de error con el del juego** — tras `did-fail-load` espera a la URL `file:` de `offline.html`.
- **Ignorar el código -3** (carga cancelada) en `did-fail-load` no es opcional: ocurre en redirecciones normales.
- **Editar `CLAUDE.md` a mano** — se copia del bundle; el `diff -q` del paso 14 exige que sean idénticos.
- **Cambiar versiones para «arreglar» un fallo de electron-builder** — primero el Modo de desarrollador de Windows; un cambio de versión se decide con el registro delante (`blueprint.md` §20.2).

## Before moving on

- [ ] Every task in this epic is `done` in `tasks.json` — no task left `in_progress`.
- [ ] Every `verify` command of every task in this epic passed, not just the first one.
- [ ] No `verify` command was edited, and none was skipped because a file it names did not exist.
- [ ] **Every task in this epic has its `checkpoint` tag in version control** — one tag per task, matching the `checkpoint` value in `tasks.json`. `git tag -l 'step-*'` lists them.
- [ ] Gate command passes clean, run from the project root.
- [ ] Every "Produced" contract above exists with the stated signature.
- [ ] No file outside the subtree was modified.
- [ ] `.env.example`: este proyecto no tiene `.env`; `PK_URL` y `PK_SMOKE_OUT` las pone el arnés (tabla de §10 de `blueprint.md`).
- [ ] One commit per task, each prefixed with its step and task id, each followed by its checkpoint tag, none with an AI signature.
