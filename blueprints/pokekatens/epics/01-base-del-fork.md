# Epic 01: Base del fork

> Al acabar, el juego es PokeKatens: lee su identidad de `G.FORK`, habla sólo con el emulador de Firebase,
> entra sólo con nombre y contraseña, juega en cooperativo sin el TURN de JPTER78, da el crédito al original y
> tiene un servidor local que se puede ejecutar.

| | |
|---|---|
| **Epic id** | `01-base-del-fork` |
| **Tasks** | `E1-T1` … `E1-T5` |
| **Depends on** | nada — se empieza aquí (después del Bootstrap de `blueprint.md` §10) |
| **Unlocks** | `02-limpieza-y-datos` |
| **Parallel with** | ninguna (cada tarea ejecuta la batería completa de pruebas y el build, que leen archivos de las demás) |

You do not need any other file to complete this epic. Everything below is repeated here on purpose.

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
dev.html                       # existe, se edita (E1-T1 script nuevo, E1-T3 Google y CSP, E1-T5 identidad)
manifest.webmanifest           # existe, se edita (E1-T5)
index.html, js/app.min.js, version.json, js/lang/*.js   # GENERADOS por el build en cada Verify
js/
  core/fork-config.js          # NUEVO (E1-T1) — G.FORK
  core/firebase-config.js      # existe, se reescribe (E1-T1) — config del emulador
  core/db.js                   # existe, se edita (E1-T1 HOSTS, E1-T3 Google)
  core/util.js                 # existe, sólo lectura (crea G)
  core/updater.js              # existe, PROHIBIDO tocarlo
  ui/login.js                  # existe, se edita (E1-T3)
  ui/settings-ui.js, ui/ui.js  # existen, se editan (E1-T5)
  ui/social-ui.js              # existe, se edita (E1-T4)
  net/net.js                   # existe, se edita (E1-T4)
  noframe.js                   # existe, se edita (E1-T5)
  game.js                      # existe, una línea (E1-T3)
tools/serve.cjs                # NUEVO (E1-T2)
tests/
  fork.test.cjs                # NUEVO (E1-T1)
  serve.test.cjs               # NUEVO (E1-T2)
  sin-google.test.cjs          # NUEVO (E1-T3)
  net.test.cjs                 # existe, se edita (E1-T4)
  i18n.test.cjs, net-fixtures.cjs   # existen, sólo lectura
infra/coturn/                  # existe, se BORRA (E1-T4)
LICENSE, LICENSE-NONCOMMERCIAL.md   # existen, PROHIBIDO tocarlos
```

Everything outside this subtree is out of scope. If a task seems to require editing a file not listed here,
stop and report — it means the epic boundary is wrong.

## Data model touched here

| Entity | Fields this epic adds or reads | Notes |
|---|---|---|
| `G.FORK` (configuración, no se guarda) | `name`, `site`, `hosts`, `repo`, `upstream`, `contact`, `admins` | Única fuente de la identidad de esta copia |
| `G.FIREBASE_CONFIG` | `projectId: 'demo-pokekatens'`, `emulator: true` | El emulador; la lista de lanzamiento pone la real |
| Cuentas de Firebase Auth | correo interno `<hex del nombre>@jugadores.pokekatens.invalid` | Sólo cambia el dominio; ninguna colección cambia |

## Contracts

**Consumed** — already exists, do not rebuild:

| From | Interface | Guarantee |
|---|---|---|
| repo | `tools/build.js` | Une los scripts del bloque `<!-- scripts:begin -->`…`<!-- scripts:end -->` de `dev.html` en orden y escribe `version.json` |
| repo | `js/core/db.js` `initCloud()` | Con `cfg.emulator` usa `127.0.0.1` 9099/8080/9000; sin config o fuera de `HOSTS` → modo local |
| repo | `js/net/codec.js` y las pruebas de codec de `tests/net.test.cjs` | No cambian y deben seguir pasando |
| repo | `tests/i18n.test.cjs` | Carga `js/ui/login.js` con un `G.UI` falso y llama a `updateNotices()` |

**Produced** — later epics depend on exactly these signatures. Changing one breaks them:

| Export | Signature | Used by |
|---|---|---|
| `js/core/fork-config.js` → `G.FORK` | `{ name, site, hosts: string[], repo, upstream, contact, admins: string[] }` | `02` (`ranking.js` usa `admins`), `03` (guía) |
| `tools/serve.cjs` | `node tools/serve.cjs [--port N]` → línea `PK_SERVE http://127.0.0.1:<puerto>/`; 200/403/404/405 | `03` (`tools/desktop-smoke.cjs`) |
| `js/core/db.js` | `NAME_DOMAIN = 'jugadores.pokekatens.invalid'`; sin `loginWithGoogle`/`linkGoogle`/`hasGoogle` | `02` (correos de las pruebas del emulador) |
| `js/net/net.js` | `new RTCPeerConnection({ iceServers: ICE })`; sin `viaTurn` | — |

## Conventions that bite in this area

- **Todo script nuevo del juego va en el bloque de scripts de `dev.html`**, o el build no lo incluye. `fork-config.js` va justo antes de `firebase-config.js`.
- **`window.G` no existe en la versión publicada**: el build cambia `window.G = window.G || {};` por `var G = {};` dentro de una función. Usa siempre `G`, nunca `window.G`.
- **`node --test tests/` falla en Node 24** (intenta ejecutar la carpeta). Usa `node --test "tests/*.test.cjs"`.
- **CRLF**: el repo tiene `core.autocrlf=true`; en las pruebas busca subcadenas (`includes`), nunca líneas completas con `\n`.
- Textos de interfaz en español. Los textos nuevos de esta épica (los de las tareas `E1-T3` y `E1-T5`) reciben su inglés en `js/data/lang-en.js` y sus cinco traducciones en `js/data/lang-updates.js` en la tarea `E2-T5`, con una prueba que lo vigila; aquí sólo se escriben en español. La línea de crédito va con `translate="no"` y no se traduce (decisión registrada).
- Los archivos generados (`index.html`, `js/app.min.js`, `version.json`, `js/lang/*.js`) cambian en cada build y entran en el commit: es lo esperado.

Full project rules: `CLAUDE.md`. Area rules: `.claude/rules/juego-js.md`, `.claude/rules/firebase-reglas.md`.
Both sit in the project root — the builder copied them there from the bundle's `workspace/` before task one
(except `CLAUDE.md`, which is still the original owner's until `E3-T4`).

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

### `E1-T1` — Crear fork-config y apuntar Firebase al emulador

**Depends on:** nothing (después del Bootstrap de `blueprint.md` §10) · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 1

Crea el sitio único donde vive todo lo que distingue a esta copia (PokeKatens) del juego original, y deja Firebase apuntando al **emulador local** para que ningún paso de la construcción toque servidores reales (ni los de JPTER78 ni los vuestros, que aún no existen).

1. **Nuevo `js/core/fork-config.js`**, con un comentario de cabecera en español al estilo del repo y exactamente este objeto:

   ```js
   G.FORK = {
     name: 'PokeKatens',
     site: '',
     hosts: ['localhost', '127.0.0.1'],
     repo: '',
     upstream: 'https://github.com/JPTER78/pokesurvivor',
     contact: '',
     admins: []
   };
   ```

   `site` = URL pública del juego (vacía hasta el lanzamiento) · `hosts` = webs donde se permite la nube · `repo` = vuestro repositorio (vacío = no se enseña el enlace) · `upstream` = el juego original (crédito obligatorio) · `contact` = correo de contacto del aviso legal (vacío = no se enseña) · `admins` = UID de las cuentas de moderación.
2. **`dev.html`**: añade `<script defer src="js/core/fork-config.js"></script>` dentro del bloque `<!-- scripts:begin -->` … `<!-- scripts:end -->`, en la línea **justo anterior** a `<script defer src="js/core/firebase-config.js"></script>`. Así `tools/build.js` lo mete en `js/app.min.js` en el orden correcto (después de `js/core/util.js`, que crea `G`).
3. **`js/core/firebase-config.js`**: sustituye la configuración de `pokesurvivor-free` (y su comentario) por esta, con un comentario que diga que es la del emulador y que la lista de lanzamiento (§20.1) la cambia por la del proyecto real:

   ```js
   G.FIREBASE_CONFIG = {
     apiKey: 'demo-pokekatens-key',
     authDomain: 'demo-pokekatens.firebaseapp.com',
     projectId: 'demo-pokekatens',
     storageBucket: 'demo-pokekatens.appspot.com',
     messagingSenderId: '0',
     appId: '1:0:web:0',
     databaseURL: 'http://127.0.0.1:9000?ns=demo-pokekatens',
     emulator: true
   };
   ```
4. **`js/core/db.js`**: cambia la línea 458 (`const HOSTS = ['pokesurvivor.com', 'www.pokesurvivor.com', 'jpter78.github.io', 'localhost', '127.0.0.1'];`) por `const HOSTS = G.FORK.hosts;` y reescribe el comentario de encima: la nube sólo se usa en las webs de `G.FORK.hosts`. No toques nada más de `db.js` en este paso (Google es el paso 3).
5. **Nuevo `tests/fork.test.cjs`** (CommonJS, `node:test` + `node:assert/strict`, sin dependencias). Carga `js/core/fork-config.js` y `js/core/firebase-config.js` con `vm.runInContext` en un contexto `{ G: {} }` y comprueba:
   - `G.FORK.name === 'PokeKatens'`, `G.FORK.upstream === 'https://github.com/JPTER78/pokesurvivor'`, `G.FORK.hosts` incluye `'localhost'` y `'127.0.0.1'`, `G.FORK.admins` es un array y todos sus elementos son textos; `site`, `repo` y `contact` son textos.
   - Si `G.FIREBASE_CONFIG` no es `null`: `projectId !== 'pokesurvivor-free'`, y si `emulator === true` entonces `projectId` empieza por `demo-`. (Así la prueba sigue pasando después del lanzamiento, cuando pongáis vuestra config real.)
   - En `dev.html`, dentro del texto entre `<!-- scripts:begin -->` y `<!-- scripts:end -->`: `js/core/fork-config.js` aparece antes que `js/core/firebase-config.js`, y éste antes que `js/core/db.js`.
   - `js/core/db.js` contiene `const HOSTS = G.FORK.hosts;` y no contiene `'pokesurvivor.com'`.

El `Verify` regenera `index.html`, `js/app.min.js`, `version.json` y `js/lang/*.js` con `node tools/build.js --sin-seo`: son archivos **generados** (no se editan a mano) y entran en el commit del Checkpoint.

**Files**
- `js/core/fork-config.js`
- `js/core/firebase-config.js`
- `dev.html`
- `js/core/db.js`
- `tests/fork.test.cjs`

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization defined in `agents/blueprint-writer.md` *Acceptance strings*. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `node --test "tests/*.test.cjs"` se ejecuta **THE SYSTEM SHALL** pasar `tests/fork.test.cjs`, que carga `js/core/fork-config.js` y `js/core/firebase-config.js` en un entorno aislado y comprueba `G.FORK.name === 'PokeKatens'`, `G.FORK.upstream === 'https://github.com/JPTER78/pokesurvivor'`, que `G.FORK.hosts` incluye `localhost` y `127.0.0.1` y que `G.FORK.admins` es una lista de textos.
2. **WHEN** `tests/fork.test.cjs` lee el bloque de scripts de `dev.html` **THE SYSTEM SHALL** encontrar `js/core/fork-config.js` antes que `js/core/firebase-config.js`, y éste antes que `js/core/db.js`.
3. **WHEN** `tests/fork.test.cjs` lee `js/core/db.js` **THE SYSTEM SHALL** encontrar `const HOSTS = G.FORK.hosts;` y ningún texto `'pokesurvivor.com'`.
4. **WHEN** `grep -rn "pokesurvivor-free" js/core` se ejecuta **THE SYSTEM SHALL** no encontrar nada (exit 1), y `js/core/firebase-config.js` SHALL contener `projectId: 'demo-pokekatens'` y `emulator: true`.
5. **WHEN** `node tools/build.js --sin-seo` y `node tools/export_data.js` se ejecutan **THE SYSTEM SHALL** terminar ambos con exit 0.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
node --test "tests/*.test.cjs"   # expect: exit 0, 0 failed
node tools/export_data.js   # expect: exit 0
node tools/build.js --sin-seo   # expect: exit 0 (la primera vez descarga terser y javascript-obfuscator con npx: hace falta internet)
status=0; grep -rn "pokesurvivor-free" js/core || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = ninguna coincidencia · 2 = error de grep, y eso falla
grep -qF "projectId: 'demo-pokekatens'" js/core/firebase-config.js   # expect: exit 0
grep -qF "emulator: true" js/core/firebase-config.js   # expect: exit 0
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 01 (E1-T1): configuración base del fork"
git tag -f step-01-config-fork
status=0; git log -1 --format=%B | grep -qi "co-authored-by" || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = el commit no lleva firma de IA (norma de los dueños)
git ls-files --error-unmatch js/core/fork-config.js tests/fork.test.cjs   # expect: exit 0 — ya están en el commit de arriba
```

Run these after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts. If this task or a later one goes wrong, follow the single recovery procedure (section *Volver atrás* above, the same as `blueprint.md` §9 rule 6) with NN = the first broken step, instead of debugging forward; `git tag -f` makes re-tagging after a recovery safe. Never invent the tag: copy the `checkpoint` field. The extra lines after the tag check that the commit carries no AI signature and that the files this task created are now tracked (only decidable after the commit).

### `E1-T2` — Crear el servidor local tools/serve.cjs

**Depends on:** `E1-T1` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 2

Un servidor web local, sin dependencias, para jugar en el ordenador y para las pruebas de la app de escritorio. Es el primer programa nuevo que se puede **ejecutar**, así que su prueba lo arranca de verdad.

**Nuevo `tools/serve.cjs`** (CommonJS, sólo módulos de Node: `http`, `fs`, `path`, `url`):
- Uso: `node tools/serve.cjs [--port N]`. Puerto por defecto **8123**; `--port 0` = el sistema elige uno libre. Escucha **sólo en `127.0.0.1`**.
- Al empezar a escuchar escribe exactamente una línea: `PK_SERVE http://127.0.0.1:<puerto>/` (con el puerto real).
- Sirve la carpeta raíz del repositorio (la carpeta padre de `tools/`).
- Sólo `GET` y `HEAD`; cualquier otro método → **405**.
- Ruta: quita la parte `?…`, aplica `decodeURIComponent` (si falla → 400), `/` → `index.html`, una carpeta → su `index.html`. Resuelve con `path.resolve(raiz, '.' + ruta)` y si el resultado **no** está dentro de la raíz (comprueba que empieza por `raiz + path.sep`) → **403** sin leer nada. No existe → **404**.
- Cabeceras: `Cache-Control: no-store` siempre (así el actualizador ve cada `version.json` nuevo) y `Content-Type` según la extensión: `.html` `text/html; charset=utf-8` · `.js` `text/javascript; charset=utf-8` · `.css` `text/css; charset=utf-8` · `.json` `application/json; charset=utf-8` · `.webmanifest` `application/manifest+json` · `.png` `image/png` · `.jpg` `image/jpeg` · `.ico` `image/x-icon` · `.svg` `image/svg+xml` · `.ttf` `font/ttf` · `.woff2` `font/woff2` · `.txt` `text/plain; charset=utf-8` · `.ogg` `audio/ogg` · `.mp3` `audio/mpeg` · `.wav` `audio/wav` · el resto `application/octet-stream`.

**Nuevo `tests/serve.test.cjs`** (`node:test`): arranca `process.execPath tools/serve.cjs --port 0` con `child_process.spawn`, lee de su salida la línea `PK_SERVE http://127.0.0.1:(\d+)/`, hace las peticiones con `http.request` (pasando la ruta tal cual en `path`, sin normalizar) y al final mata el proceso en un `after()`. Comprueba:
- `/dev.html` → 200 y `content-type` empieza por `text/html`; `/js/core/util.js` → 200 y `text/javascript`; `/version.json` → 200 y `application/json`; las tres con `cache-control: no-store`.
- `/no-existe.html` → 404.
- `/%2e%2e/%2e%2e/secreto.txt` → 403.
- `POST /` → 405.

**Files**
- `tools/serve.cjs`
- `tests/serve.test.cjs`

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization defined in `agents/blueprint-writer.md` *Acceptance strings*. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `node tools/serve.cjs --port 0` arranca **THE SYSTEM SHALL** escribir una línea `PK_SERVE http://127.0.0.1:<puerto>/` y escuchar sólo en `127.0.0.1`.
2. **WHEN** `tests/serve.test.cjs` pide `/dev.html`, `/js/core/util.js` y `/version.json` **THE SYSTEM SHALL** responder 200 con `Content-Type` que empieza por `text/html`, `text/javascript` y `application/json`, y con `Cache-Control: no-store`.
3. **WHEN** `tests/serve.test.cjs` pide `/no-existe.html` **THE SYSTEM SHALL** responder 404.
4. **WHEN** `tests/serve.test.cjs` pide la ruta sin normalizar `/%2e%2e/%2e%2e/secreto.txt` **THE SYSTEM SHALL** responder 403 y no servir nada de fuera de la carpeta del repositorio.
5. **WHEN** `tests/serve.test.cjs` manda `POST /` **THE SYSTEM SHALL** responder 405.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
node --test "tests/*.test.cjs"   # expect: exit 0, 0 failed — tests/serve.test.cjs arranca tools/serve.cjs de verdad
grep -qF "8123" tools/serve.cjs   # expect: exit 0 — el puerto por defecto
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 02 (E1-T2): servidor local tools/serve.cjs"
git tag -f step-02-servidor-local
status=0; git log -1 --format=%B | grep -qi "co-authored-by" || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = el commit no lleva firma de IA (norma de los dueños)
git ls-files --error-unmatch tools/serve.cjs tests/serve.test.cjs   # expect: exit 0
```

Run these after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts. If this task or a later one goes wrong, follow the single recovery procedure (section *Volver atrás* above, the same as `blueprint.md` §9 rule 6) with NN = the first broken step, instead of debugging forward; `git tag -f` makes re-tagging after a recovery safe. Never invent the tag: copy the `checkpoint` field. The extra lines after the tag check that the commit carries no AI signature and that the files this task created are now tracked (only decidable after the commit).

### `E1-T3` — Quitar el inicio de sesión con Google

**Depends on:** `E1-T2` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 3

Se entra **sólo con nombre y contraseña** (más el modo invitado y el modo local, que se quedan igual). Fuera todo lo de Google.

1. **`js/core/db.js`**
   - `const NAME_DOMAIN = 'jugadores.pokekatens.invalid';` (línea 33; sólo sirve para el correo interno que Firebase exige; `.invalid` es un dominio que nunca existirá).
   - Borra `loginWithGoogle` (724-731), `hasGoogle` y `linkGoogle` (790-806) y el comentario de recuperación con Gmail de encima; quítalos también del objeto que devuelve el módulo (líneas 881 y 891: `loginWithGoogle` y `get hasGoogle()`/`linkGoogle`).
   - En `deleteAccount` deja sólo la rama de contraseña: si no hay `pass` → `{ ok: false, error: 'Escribe tu contraseña.' }`; si hay → `reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(cu.email, pass))`. Fuera `reauthenticateWithPopup`.
   - En `authError` quita la entrada `'auth/popup-blocked'` y la línea que ignora `auth/popup-closed-by-user` / `auth/cancelled-popup-request`.
   - No toques `register`, `login`, `playAsGuest`, `initCloud` (salvo lo del paso 1) ni el modo local: `localReason = 'file'`, `'config'`, `'host'` siguen igual.
2. **`js/ui/login.js`**
   - Borra los manejadores de `#btn-google`, `#rec-link`, `#rec-later`, `#rec-never`, la función `offerRecovery` y su aviso, y la línea de `open()` que enseña u oculta `#btn-google`. El objeto devuelto queda `{ init, open, updateNotices }`.
   - En `modeNote()`, el texto de `localReason === 'host'` pasa a: `Esta web no está en la lista de webs de esta copia del juego: la partida sólo se guarda en este navegador.`
3. **`dev.html`**
   - CSP (línea 9): quita `https://apis.google.com`. Debe quedar exactamente: `script-src 'self' file: https://www.gstatic.com https://*.firebaseio.com https://*.firebasedatabase.app; object-src 'none'; base-uri 'self'`. Ajusta el comentario de encima (ya no hay Google).
   - Borra la fila con `#btn-google` y toda la sección `#scr-recover` (el aviso de vincular Gmail).
   - El texto de `#forgot-note` pasa a: `Si olvidas la contraseña, pídele al administrador que te cree otra cuenta.` (deja el enlace `#f-forgot` que lo enseña y oculta).
   - Aviso legal, apartado Privacidad (líneas 300-305): borra la frase `Si entras con Google, Firebase guarda también tu correo de Google para identificarte (nunca se enseña a otros jugadores).`; el párrafo queda, con los espacios normalizados: `Si creas una cuenta, guardamos tu nombre de jugador y tu partida (colección, monedas, mejoras y estadísticas) en Google Firebase para que puedas seguir en cualquier ordenador. No usamos tus datos para nada más, ni los compartimos, ni hay publicidad ni seguimiento. Como invitado no se guarda nada fuera de tu navegador.` («Google Firebase» se queda: es el servicio que guarda los datos).
   - Pantalla del apodo (`#scr-nick`, líneas 349-350): el párrafo pasa a `Es el nombre que verán tus amigos y el que sale en el ranking. Tu nombre de usuario no se enseña a nadie.`
   - Después de esto `grep -niE "entrar con google|si entras con google|correo de google|gmail" dev.html` no encuentra nada (la sección `#scr-recover` con «Vincula tu Gmail» ya se ha borrado arriba).
4. **`js/game.js`** línea 977: `if (!G.LoginUI.updateNotices()) G.LoginUI.offerRecovery();` pasa a `G.LoginUI.updateNotices();`.
5. **Nuevo `tests/sin-google.test.cjs`** (`node:test`, lectura de archivos, sin ejecutar el juego):
   - Recorre `dev.html` y todos los `.js` bajo `js/` **excepto** `js/app.min.js`, la carpeta `js/lang/` y la carpeta `js/data/` (diccionarios y novedades antiguas), y comprueba que ninguno contiene: `GoogleAuthProvider`, `signInWithPopup`, `linkWithPopup`, `reauthenticateWithPopup`, `loginWithGoogle`, `linkGoogle`, `hasGoogle`, `offerRecovery`, `btn-google`, `scr-recover`, `apis.google.com`, `auth/popup-blocked` (el mensaje de fallo dice archivo y palabra).
   - `dev.html` contiene la CSP exacta de arriba, `id="btn-guest"`, `id="forgot-note"` y `pídele al administrador que te cree otra cuenta`.
   - `js/core/db.js` contiene `const NAME_DOMAIN = 'jugadores.pokekatens.invalid';`, `createUserWithEmailAndPassword`, `signInWithEmailAndPassword` y `localReason = 'config'`.
   - `js/ui/login.js` no contiene `pokesurvivor.com`.

El texto de Ajustes que decía «Google» como tipo de cuenta se cambia en el paso 5 (allí se toca `js/ui/settings-ui.js`). Los cuatro textos nuevos de este paso (la nota de contraseña, el texto `host` de `modeNote`, el párrafo de privacidad y el del apodo) se escriben aquí sólo en español; su inglés y sus cinco traducciones los añade el paso 10, que además los vigila con `tests/textos-nuevos.test.cjs`. Mientras tanto, los demás idiomas los enseñan en español: las pruebas de idiomas siguen pasando porque sólo exigen que lo que tiene inglés tenga también las otras traducciones.

**Files**
- `js/core/db.js`
- `js/ui/login.js`
- `dev.html`
- `js/game.js`
- `tests/sin-google.test.cjs`

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization defined in `agents/blueprint-writer.md` *Acceptance strings*. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `node --test "tests/*.test.cjs"` se ejecuta **THE SYSTEM SHALL** pasar `tests/sin-google.test.cjs`, que no encuentra ninguno de `GoogleAuthProvider`, `signInWithPopup`, `linkWithPopup`, `reauthenticateWithPopup`, `loginWithGoogle`, `linkGoogle`, `hasGoogle`, `offerRecovery`, `btn-google`, `scr-recover`, `apis.google.com` ni `auth/popup-blocked` en `dev.html` ni en los `.js` de `js/` (salvo `js/app.min.js`, `js/lang/` y `js/data/`).
2. **WHEN** `tests/sin-google.test.cjs` lee `dev.html` **THE SYSTEM SHALL** encontrar exactamente la CSP `script-src 'self' file: https://www.gstatic.com https://*.firebaseio.com https://*.firebasedatabase.app; object-src 'none'; base-uri 'self'`.
3. **WHEN** `tests/sin-google.test.cjs` lee `js/core/db.js` **THE SYSTEM SHALL** encontrar `const NAME_DOMAIN = 'jugadores.pokekatens.invalid';`, `createUserWithEmailAndPassword`, `signInWithEmailAndPassword` y `localReason = 'config'`.
4. **WHEN** `tests/sin-google.test.cjs` lee `dev.html` y `js/ui/login.js` **THE SYSTEM SHALL** encontrar `id="btn-guest"`, `id="forgot-note"` y el texto `pídele al administrador que te cree otra cuenta`, y ningún `pokesurvivor.com` en `js/ui/login.js`.
5. **WHEN** `node tools/build.js --sin-seo` se ejecuta **THE SYSTEM SHALL** terminar con exit 0.
6. **WHEN** `grep -niE "entrar con google|si entras con google|correo de google|gmail" dev.html` se ejecuta **THE SYSTEM SHALL** no encontrar nada (exit 1): los textos de privacidad y de apodo ya no hablan de Google.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
node --test "tests/*.test.cjs"   # expect: exit 0, 0 failed
node tools/build.js --sin-seo   # expect: exit 0 (la primera vez descarga terser y javascript-obfuscator con npx: hace falta internet)
node tools/export_data.js   # expect: exit 0
status=0; grep -niE "entrar con google|si entras con google|correo de google|gmail" dev.html || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = ninguna coincidencia
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 03 (E1-T3): fuera el inicio de sesión con Google"
git tag -f step-03-sin-google
status=0; git log -1 --format=%B | grep -qi "co-authored-by" || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = el commit no lleva firma de IA (norma de los dueños)
git ls-files --error-unmatch tests/sin-google.test.cjs   # expect: exit 0
```

Run these after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts. If this task or a later one goes wrong, follow the single recovery procedure (section *Volver atrás* above, the same as `blueprint.md` §9 rule 6) with NN = the first broken step, instead of debugging forward; `git tag -f` makes re-tagging after a recovery safe. Never invent the tag: copy the `checkpoint` field. The extra lines after the tag check that the commit carries no AI signature and that the files this task created are now tracked (only decidable after the commit).

### `E1-T4` — Quitar el TURN: cooperativo sólo con STUN

**Depends on:** `E1-T3` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 4

El TURN de JPTER78 (`ice.pokesurvivor.com`) recibía **el token de sesión de Firebase de cada jugador**: se quita entero. El cooperativo queda con conexión directa y los dos STUN gratuitos de Google, que es lo que ya pasaba cuando el TURN no respondía.

1. **`js/net/net.js`**
   - Borra `TURN_API`, todo el bloque «TURN propio» (`turn`, `turnUid`, `turnAsk`, `turnRetry`, `cleanIce`, `turnUser`, `turnNow`, `turnServers`, `checkTurn`), la llamada `turnServers();` de `open()` y las esperas `turnIce = await turnServers();` (líneas 225 y 247: la conexión se crea ya, sin esperar).
   - Cada conexión se crea exactamente con `new RTCPeerConnection({ iceServers: ICE })`, con `ICE` sin cambios: `[{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }]`.
   - Quita `viaTurn` (el campo de cada par y el método público) y la llamada a `checkTurn` cuando se abre el canal.
   - Reescribe el comentario de cabecera (líneas 5-12): conexión directa con STUN gratuito; sin TURN, algunas redes (datos móviles, CGNAT) no pueden conectar directamente y esa pareja no juega junta. Deja `DIRECT_TIMEOUT` en 15000 y quita lo de «por TURN tarda algo más».
2. **`js/ui/social-ui.js`** línea 183: `mode === 'direct' ? (G.Net.viaTurn(m.uid) ? 'Conectado (por servidor)' : 'Conectado') : …` pasa a `mode === 'direct' ? 'Conectado' : …` (la rama `relay` se queda como está).
3. **`tests/net.test.cjs`**: borra la función `turnNetwork`, `turnReply` y las tres pruebas `own TURN: …`. Añade una función `stunNetwork()` igual que la `turnNetwork` antigua pero cuyo `fetch` inyectado guarda cada llamada en `calls`, y esta prueba:

   ```js
   test('STUN only: no request is made and every peer gets only the two Google STUN servers', async () => {
     const { N, configs, calls } = stunNetwork();
     N.open('room', true, 'host'); await settle();
     N.syncMembers(['host', 'a', 'b']); await settle();
     assert.equal(calls.length, 0);
     assert.equal(configs.length, 2);
     for (const cfg of configs) assert.deepEqual(cfg, { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] });
   });
   ```
   El resto de pruebas de `tests/net.test.cjs` (codec y negociación) no se tocan y tienen que seguir pasando.
4. **Borra la carpeta `infra/coturn/`** entera con `git rm -r -q infra/coturn` (era el servidor TURN de JPTER78).

**Files**
- `js/net/net.js`
- `tests/net.test.cjs`
- `js/ui/social-ui.js`
- `infra/coturn/**`

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization defined in `agents/blueprint-writer.md` *Acceptance strings*. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** `node --test "tests/*.test.cjs"` se ejecuta **THE SYSTEM SHALL** pasar todas las pruebas de `tests/net.test.cjs`, incluida la nueva `STUN only: no request is made and every peer gets only the two Google STUN servers`, que comprueba que el `fetch` inyectado se llama 0 veces y que cada configuración de `RTCPeerConnection` es exactamente `{ iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] }`.
2. **WHEN** `grep -rnE "ice\.pokesurvivor\.com|turn\.pokesurvivor\.com|TURN_API|viaTurn|turnServers" js/net js/ui tests` se ejecuta **THE SYSTEM SHALL** no encontrar nada (exit 1).
3. **WHEN** `test ! -e infra/coturn` se ejecuta **THE SYSTEM SHALL** terminar con exit 0.
4. **WHEN** `node tools/build.js --sin-seo` se ejecuta **THE SYSTEM SHALL** terminar con exit 0.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
node --test "tests/*.test.cjs"   # expect: exit 0, 0 failed
status=0; grep -rnE "ice\.pokesurvivor\.com|turn\.pokesurvivor\.com|TURN_API|viaTurn|turnServers" js/net js/ui tests || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = ninguna coincidencia
test ! -e infra/coturn   # expect: exit 0 — la carpeta ya no existe
node tools/build.js --sin-seo   # expect: exit 0 (la primera vez descarga terser y javascript-obfuscator con npx: hace falta internet)
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 04 (E1-T4): cooperativo sólo con STUN, fuera el TURN"
git tag -f step-04-sin-turn
status=0; git log -1 --format=%B | grep -qi "co-authored-by" || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = el commit no lleva firma de IA (norma de los dueños)
```

Run these after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts. If this task or a later one goes wrong, follow the single recovery procedure (section *Volver atrás* above, the same as `blueprint.md` §9 rule 6) with NN = the first broken step, instead of debugging forward; `git tag -f` makes re-tagging after a recovery safe. Never invent the tag: copy the `checkpoint` field. The extra lines after the tag check that the commit carries no AI signature.

### `E1-T5` — Poner el nombre PokeKatens y el crédito a JPTER78

**Depends on:** `E1-T4` · **Priority:** p0 — metadata for scope cuts, not a running order · **Paso de §9:** 5

El juego se presenta como **PokeKatens**, deja claro que es una versión no oficial y da el crédito a JPTER78 en la pantalla de entrada y en Ajustes. `LICENSE` y `LICENSE-NONCOMMERCIAL.md` **no se tocan**.

El texto del crédito es siempre el mismo, letra por letra: `Basado en PokéSurvivor de JPTER78 · versión no oficial y sin ánimo de lucro`. La dirección del juego original es siempre `https://github.com/JPTER78/pokesurvivor` (en el JS se lee de `G.FORK.upstream`; en el HTML va escrita).

1. **`dev.html`**
   - `<title>PokeKatens</title>` y `<meta name="description" content="PokeKatens: versión no oficial, gratis y sin ánimo de lucro, basada en PokéSurvivor de JPTER78.">`.
   - Logo de la pantalla de entrada: `<div class="t1">PokeKatens</div>` (el `t2` «Mundo Misterioso» se queda). Logo del menú principal (`#scr-menu`, línea 174): `<div class="t1">PokéSurvivor<span class="splash">` pasa a `<div class="t1">PokeKatens<span class="splash">`, con el `<span class="splash">` y su texto sin tocar. Después, ningún `<div class="t1">PokéSurvivor` queda en `dev.html`.
   - Pantalla de carga y pantalla «Pulsa para empezar» (líneas 321 y 329): `<h1>PokéSurvivor</h1>` pasa a `<h1>PokeKatens</h1>` en las dos. Aviso `<noscript>` (líneas 337-338): `<h1>PokeKatens</h1>` y `<p>PokeKatens necesita JavaScript para funcionar. Actívalo para jugar.</p>` (sin traducción: sin JavaScript no hay diccionarios).
   - `<meta name="apple-mobile-web-app-title" content="PokéSurvivor">` (línea 46, fuera de los bloques SEO) pasa a `content="PokeKatens"`, y el aviso de girar el móvil (`#rotate`, línea 93) `PokéSurvivor se juega en horizontal.` pasa a `PokeKatens se juega en horizontal.` (texto nuevo: lo traduce el paso 10).
   - Los demás «PokéSurvivor» que quedan hablan del juego original a propósito (crédito, aviso legal, criptomonedas) y no se tocan; los del `<head>` de SEO los borra el paso 6.
   - La línea `<p class="login-official">Web oficial: pokesurvivor.com · si alguien te pide pagar, no somos nosotros</p>` se sustituye por `<p class="login-official" translate="no">Basado en PokéSurvivor de JPTER78 · versión no oficial y sin ánimo de lucro · <a href="https://github.com/JPTER78/pokesurvivor" target="_blank" rel="noopener">juego original</a></p>`.
   - Aviso legal (`#scr-legal`): el primer párrafo pasa a `<p>PokeKatens es una versión no oficial de PokéSurvivor (de JPTER78) hecha por un grupo de amigos, gratuita y sin ánimo de lucro. No tiene anuncios, compras ni donaciones.</p>` (sin negritas: así es un solo texto para el diccionario); el bloque `<h3>Web oficial</h3>` + su párrafo se sustituye por `<h3>Versión no oficial</h3>` + `<p translate="no">Basado en PokéSurvivor de JPTER78 · versión no oficial y sin ánimo de lucro. Juego original: <a href="https://github.com/JPTER78/pokesurvivor" target="_blank" rel="noopener">github.com/JPTER78/pokesurvivor</a></p>`. Los apartados de Nintendo, criptomonedas y contenido de terceros se quedan.
   - No toques todavía los bloques `<!-- seo:begin -->…<!-- seo:end -->` (los borra el paso 6).
2. **`manifest.webmanifest`**: `"name": "PokeKatens"`, `"short_name": "PokeKatens"`, `"description": "Versión no oficial, gratis y sin ánimo de lucro, basada en PokéSurvivor de JPTER78"`. El resto igual, JSON con 2 espacios.
3. **`js/ui/settings-ui.js`**
   - Quita `const REPO = …`. En «Acerca de», el botón «Código (GitHub)» sólo se pinta si `G.FORK.repo` no está vacío, con `href="${G.FORK.repo}"`; quita el enlace a `contacto/` (la carpeta desaparece en el paso 6). Añade al final del texto de «Acerca de» un párrafo `translate="no"` con el crédito y un enlace a `G.FORK.upstream` (texto del enlace: `juego original`).
   - En la pestaña Cuenta: `const kind = G.DB.mode === 'local' ? 'Cuenta de este navegador' : 'Nombre y contraseña';` (ya no existe el tipo «Google»).
4. **`js/ui/ui.js`** (aviso legal, líneas 106-116): quita `CONTACT` y `REPO` fijos. Si `G.FORK.contact` está vacío, oculta el párrafo que contiene `#legal-mail` (`$('legal-mail').parentElement.classList.add('hidden')`); si no, rellénalo como ahora. Igual con `G.FORK.repo` y el párrafo de `#legal-repo`. Arregla el comentario de `confirmDelete` (ya no hay cuentas de Google).
5. **`js/noframe.js`**: sigue bloqueando el juego cuando otra web lo mete en un marco, pero **sin enlace** y sin `pokesurvivor.com`: borra la variable `url`, el `<a>` y su manejador; cada idioma queda con dos textos `[título, explicación]`. Español: `['Esta página no se puede abrir dentro de otra web', 'PokeKatens no se juega dentro de otras webs.']`; inglés: `['This page cannot be opened inside another website', 'PokeKatens cannot be played inside other websites.']`; traduce esas dos frases al francés, italiano, portugués de Brasil, chino simplificado y chino tradicional para las otras cinco claves. Actualiza el comentario de cabecera.

Los tres textos nuevos traducibles de este paso — el título `Versión no oficial`, ese primer párrafo y `PokeKatens se juega en horizontal.` — se escriben aquí en español; su inglés y sus cinco traducciones los añade el paso 10. Las líneas de crédito (entrada, aviso legal y «Acerca de») llevan `translate="no"` y no se traducen (decisión 15 de §20.3).

Las cadenas antiguas de los diccionarios (`js/data/lang-*.js`) con «Web oficial: pokesurvivor.com» **se quedan** sin tocar: ya no se enseñan porque su texto en español ha desaparecido, y quitarlas obligaría a tocar siete diccionarios y la prueba de cobertura de idiomas (decisión 14 de §20.3).

**Files**
- `dev.html`
- `manifest.webmanifest`
- `js/ui/settings-ui.js`
- `js/ui/ui.js`
- `js/noframe.js`

**Acceptance**

Copied from this task's `acceptance` array in `tasks.json` — identical after the emphasis normalization defined in `agents/blueprint-writer.md` *Acceptance strings*. Each one is decidable by a command below, on this machine, during the build.

1. **WHEN** se busca en `dev.html` **THE SYSTEM SHALL** encontrar `<title>PokeKatens</title>`, `<div class="t1">PokeKatens</div>` y la línea visible `Basado en PokéSurvivor de JPTER78 · versión no oficial y sin ánimo de lucro`, y SHALL no encontrar `<div class="t1">PokéSurvivor` (tampoco en el logo del menú principal), `<h1>PokéSurvivor</h1>` (pantallas de carga y de «Pulsa para empezar»), `PokéSurvivor necesita JavaScript`, `apple-mobile-web-app-title" content="PokéSurvivor` ni `PokéSurvivor se juega en horizontal`.
2. **WHEN** `grep -ni "web oficial" dev.html` se ejecuta **THE SYSTEM SHALL** no encontrar nada (exit 1).
3. **WHEN** se lee `manifest.webmanifest` como JSON **THE SYSTEM SHALL** tener `name` y `short_name` iguales a `PokeKatens` y la descripción `Versión no oficial, gratis y sin ánimo de lucro, basada en PokéSurvivor de JPTER78`.
4. **WHEN** se busca en `js/ui/settings-ui.js` y `js/ui/ui.js` **THE SYSTEM SHALL** encontrar `G.FORK.repo` en los dos, ningún `github.com/JPTER78`, ningún `pokesurvivor.com` y ningún enlace `href="contacto/"`; y `js/noframe.js` SHALL no contener `pokesurvivor.com`.
5. **WHEN** `git diff --quiet HEAD -- LICENSE LICENSE-NONCOMMERCIAL.md` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 (las licencias no se tocan).
6. **WHEN** `node --test "tests/*.test.cjs"` y `node tools/build.js --sin-seo` se ejecutan **THE SYSTEM SHALL** terminar ambos con exit 0.

**Verify** — every command, in order, run from the project root. Each one exits 0 when this task is correct; the last one exiting 0 is what makes the task done.

```bash
grep -qF "<title>PokeKatens</title>" dev.html   # expect: exit 0
grep -qF '<div class="t1">PokeKatens</div>' dev.html   # expect: exit 0
status=0; grep -nE '<div class="t1">PokéSurvivor|<h1>PokéSurvivor</h1>|PokéSurvivor necesita JavaScript|apple-mobile-web-app-title" content="PokéSurvivor|PokéSurvivor se juega en horizontal' dev.html || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = ningún logo, título de carga, aviso <noscript>, título de app en iPhone ni aviso de girar el móvil con el nombre antiguo
grep -qF "Basado en PokéSurvivor de JPTER78 · versión no oficial y sin ánimo de lucro" dev.html   # expect: exit 0
status=0; grep -ni "web oficial" dev.html || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = ninguna coincidencia
node -e "const m=JSON.parse(require('fs').readFileSync('manifest.webmanifest','utf8'));process.exit(m.name==='PokeKatens'&&m.short_name==='PokeKatens'?0:1)"   # expect: exit 0 — JSON válido y nombre nuevo
grep -qF '"description": "Versión no oficial, gratis y sin ánimo de lucro, basada en PokéSurvivor de JPTER78"' manifest.webmanifest   # expect: exit 0
grep -qF "G.FORK.repo" js/ui/settings-ui.js   # expect: exit 0
grep -qF "G.FORK.repo" js/ui/ui.js   # expect: exit 0
status=0; grep -nE "github\.com/JPTER78|pokesurvivor\.com|href=\"contacto/\"" js/ui/settings-ui.js js/ui/ui.js js/noframe.js || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = ninguna coincidencia
git diff --quiet HEAD -- LICENSE LICENSE-NONCOMMERCIAL.md   # expect: exit 0 — este paso no toca las licencias
node --test "tests/*.test.cjs"   # expect: exit 0, 0 failed
node tools/build.js --sin-seo   # expect: exit 0 (la primera vez descarga terser y javascript-obfuscator con npx: hace falta internet)
```

**Checkpoint**

```bash
git add -A && git commit -m "paso 05 (E1-T5): nombre PokeKatens y crédito a JPTER78"
git tag -f step-05-identidad
status=0; git log -1 --format=%B | grep -qi "co-authored-by" || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = el commit no lleva firma de IA (norma de los dueños)
```

Run these after the last `Verify` command exits 0, before starting the next task. The tag is this task's rollback target and the thing the build's final gate counts. If this task or a later one goes wrong, follow the single recovery procedure (section *Volver atrás* above, the same as `blueprint.md` §9 rule 6) with NN = the first broken step, instead of debugging forward; `git tag -f` makes re-tagging after a recovery safe. Never invent the tag: copy the `checkpoint` field. The extra lines after the tag check that the commit carries no AI signature.

---

## Epic acceptance

The epic is done when every task is `done` **and**:

1. **WHEN** `node --test "tests/*.test.cjs"` se ejecuta **THE SYSTEM SHALL** pasar a la vez `tests/fork.test.cjs`, `tests/serve.test.cjs`, `tests/sin-google.test.cjs`, `tests/net.test.cjs` y `tests/i18n.test.cjs`.
2. **WHEN** `node tools/build.js --sin-seo` se ejecuta sobre el árbol que dejan las cinco tareas **THE SYSTEM SHALL** terminar con exit 0 y `git diff --quiet step-00-preparacion -- LICENSE LICENSE-NONCOMMERCIAL.md js/core/updater.js` **SHALL** terminar con exit 0.

```bash
node --test "tests/*.test.cjs" && node tools/export_data.js && node tools/build.js --sin-seo
git diff --quiet step-00-preparacion -- LICENSE LICENSE-NONCOMMERCIAL.md js/core/updater.js
```

Run from the project root. Both criteria are decidable by these commands.

## Pitfalls

- **Olvidar el script en `dev.html`** — `fork-config.js` existe pero el build no lo mete y `db.js` revienta con `G.FORK` indefinido. `tests/fork.test.cjs` comprueba el orden.
- **Dejar referencias a `offerRecovery`** — `js/game.js` lo llamaba; `tests/sin-google.test.cjs` recorre todo `js/` y lo encuentra.
- **Esperar a `turnServers()`** — al quitar el TURN, la conexión se crea ya; si dejas un `await` vacío cambias el orden y la prueba STUN cuenta mal las configuraciones.
- **Escribir `github.com/JPTER78` a mano en JS** — sólo `G.FORK.upstream`; en `dev.html` (HTML estático) sí va escrito.
- **Tocar los bloques SEO de `dev.html`** — los borra la épica 02; aquí no.

## Before moving on

- [ ] Every task in this epic is `done` in `tasks.json` — no task left `in_progress`.
- [ ] Every `verify` command of every task in this epic passed, not just the first one.
- [ ] No `verify` command was edited, and none was skipped because a file it names did not exist.
- [ ] **Every task in this epic has its `checkpoint` tag in version control** — one tag per task, matching the `checkpoint` value in `tasks.json`. `git tag -l 'step-*'` lists them.
- [ ] Gate command passes clean, run from the project root.
- [ ] Every "Produced" contract above exists with the stated signature.
- [ ] No file outside the subtree was modified.
- [ ] `.env.example`: este proyecto no tiene variables de entorno propias ni `.env` (la config de Firebase es pública y va en `js/core/firebase-config.js`).
- [ ] One commit per task, each prefixed with its step and task id, each followed by its checkpoint tag, none with an AI signature.
