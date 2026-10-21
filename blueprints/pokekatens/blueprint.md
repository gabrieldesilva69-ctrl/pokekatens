# PokeKatens — Blueprint de cambio sobre PokéSurvivor

> Generado por The Architect el 2026-10-20
> Forma: desktop-app · `knowledge/shapes/desktop-app.md` (aquí, un envoltorio de escritorio sobre un juego web estático que ya existe)
> Pista de ejecución: ts-node · `knowledge/runtime-tracks/ts-node.md` (sólo Node como herramienta: el juego es JavaScript sin compilar)
> Modo de emisión: bundle (15 pasos)
> Tipo: cambio brownfield con cambio de proveedor (el Firebase de JPTER78 → el Firebase propio de los amigos)
> Versión del blueprint: 1
> Versiones verificadas: 2026-10-20 — procedencia de cada una en §11

**Dónde está todo.** Este bundle vive en `blueprints/pokekatens/` **dentro del repositorio que cambia**
(`C:\Users\gabri\Downloads\pokesurvivor`), a propósito: los comandos de comprobación se ejecutan desde la raíz
de ese repositorio, en Git Bash. No lo muevas a otro sitio. Para empezar o seguir la construcción:
`/architect-next` desde la raíz del repositorio.

**Antes de `/architect-next`, una persona instala dos cosas** (el Bootstrap de §10 las comprueba y se para
con un mensaje si faltan): **Java 21** (`winget install --id EclipseAdoptium.Temurin.21.JDK -e --silent --accept-package-agreements --accept-source-agreements`,
pide permiso de administrador) y el **Modo de programador de Windows** (Configuración → Sistema → Para
programadores → Modo de programador). Comprobado en este PC el 2026-10-21: `java` del PATH ya es 21 (Oracle; cualquier Java 21 o más vale) y el Modo de programador está desactivado, así que el Bootstrap se parará hasta activarlo.

---

## 1. Project Overview & Non-Goals

### Vision

Un grupo de amigos se ha descargado el juego **PokéSurvivor** (de Jonathan Piera Torregrosa, cuenta de GitHub
JPTER78; licencia PolyForm Noncommercial 1.0.0, y MIT para versiones antiguas) y quiere su propia copia para
jugar entre ellos: **PokeKatens**. Cada uno tendrá su perfil (nombre y contraseña), y habrá ranking, amigos y
cooperativo en línea, todo sobre **su propio proyecto gratuito de Firebase** — no tienen acceso al de JPTER78 y
no deben usarlo. Se juega con un **programa para Windows (`.exe`)** que abre la web del juego publicada en
GitHub Pages; así, cada vez que los dueños suben un cambio, todos los jugadores lo reciben solos en unos
minutos, sin reinstalar nada.

Es una copia **no oficial, gratis y sin ánimo de lucro**, con el crédito a JPTER78 visible y sus licencias
intactas. Este blueprint describe el cambio sobre el código que ya existe: quitar todo lo que pertenece al
dueño original (servidores, dominio, administrador, donaciones, Google), poner la identidad nueva, añadir la
app de escritorio y dejar pruebas que demuestran cada cosa sin tocar ningún servidor real.

### Users

| Persona | Qué viene a hacer | Frecuencia |
|---|---|---|
| Jugador (amigo) | Instala el `.exe`, crea su cuenta y juega: partidas, gacha, ranking, amigos, cooperativo | A diario |
| Dueño / administrador | Publica versiones nuevas, añade Pokémon o ataques con ayuda de Claude, modera el ranking | Semanal |
| Invitado | Prueba el juego sin cuenta (nada se guarda) | De vez en cuando |

### Current state

Mapa del repositorio, leído del código (no supuesto):

| Aspecto | Lo que hay hoy |
|---|---|
| Pista | HTML + CSS + JavaScript sin frameworks sobre Canvas 2D. Sin `package.json` en la raíz, sin linter ni formateador. |
| Módulos | Scripts clásicos colgados de un global: `G.X = (() => { … })()`. Orden de carga = bloque `<!-- scripts:begin -->`…`<!-- scripts:end -->` de `dev.html`. Comentarios y textos en español; 7 idiomas (`js/data/lang-*.js`, y `js/lang/*.js` generados por `tools/build_langs.js`). |
| Construir | Se edita `dev.html`, nunca `index.html`. `node tools/build.js` genera `index.html`, `js/app.min.js` (terser 5 + javascript-obfuscator 4.1.1 con `npx --yes`; internet la primera vez) y `version.json` `{"v": huella, "at": ISO}`. Opciones: `--expose`, `--sin-seo` (quita los bloques `<!-- seo:begin -->`…`<!-- seo:end -->`), `--forzar`. |
| Pruebas | `tests/net.test.cjs` (codec de red y 3 pruebas del TURN) y `tests/i18n.test.cjs`, con `node:test`. `node tools/export_data.js` carga los datos en una VM. **Hallazgo:** `node --test tests/` (con la carpeta) sale con exit 1 en Node 24 (intenta ejecutar la carpeta como archivo); la forma que funciona es `node --test "tests/*.test.cjs"`, y es la que usa todo este blueprint. |
| Herramientas | Node 24.21.0, npm 11.19.0, git 2.55, Python 3.14. Java: el 2026-10-20 respondía 1.8; el 2026-10-21 `java` del PATH ya es 21.0.12 (Oracle). Modo de programador de Windows desactivado (lo necesita electron-builder). Los dos son requisitos previos (§10). Git con `core.autocrlf=true` (los archivos se ven con CRLF) y **sin** `user.name`/`user.email` configurados. Git Bash no trae `rsync`. |
| Firebase | SDK compat 13.0.0 cargado en tiempo de ejecución desde `https://www.gstatic.com/firebasejs/13.0.0/` (`js/core/db.js:32`). Configuración en `js/core/firebase-config.js` (`G.FIREBASE_CONFIG`, hoy el proyecto `pokesurvivor-free` de JPTER78; `null` = modo local; `emulator: true` = emuladores en 127.0.0.1 9099/8080/9000, `db.js:478-482`). `.firebaserc` → `pokesurvivor-free`. `firebase.json` ya define los emuladores y los archivos de reglas. |
| Webs permitidas | `db.js:458` `const HOSTS = ['pokesurvivor.com', 'www.pokesurvivor.com', 'jpter78.github.io', 'localhost', '127.0.0.1'];` — fuera de ellas (y sin `emulator`), modo local. |
| Cuentas | Nombre + contraseña convertidos en un correo interno (`NAME_DOMAIN = 'jugadores.pokesurvivor.net'`, `nameToEmail`); además inicio con Google (`loginWithGoogle`, `linkGoogle`, `hasGoogle`, aviso `#scr-recover`, botón `#btn-google`, rama de borrado con `reauthenticateWithPopup`). Modo invitado y modo local. CSP de `dev.html:9` con `https://apis.google.com`. |
| Datos | Firestore: `saves`, `names`, `profiles`, `friendships`, `inv`, `lb/{tabla}/e`, `lbs`, `reports` (+ `runs`, `pres` sólo para borrar). RTDB: `rooms/{id}` para la señalización del cooperativo. `firestore.rules:20` `admin()` = UID `rshaa5gKD3fXw6lE4PPXITbowaG2` (JPTER78), igual que `js/net/ranking.js:501` `ADMINS`. |
| Cooperativo | WebRTC en estrella, señalización por RTDB, STUN de Google. Restos del TURN de JPTER78: `TURN_API = 'https://ice.pokesurvivor.com/v1/ice'` (manda el token de Firebase del jugador), filtro de `turn.pokesurvivor.com`, `viaTurn` en `js/ui/social-ui.js`, carpeta `infra/coturn/`. |
| Actualizador | `js/core/updater.js` mira `version.json` cada 5 min y recarga fuera de partida tras guardar. Se queda intacto. |
| Del dueño | `CNAME`, `robots.txt` (con `Sitemap:`), `sitemap.xml`, `404.html` y las 12 carpetas SEO generadas por `tools/make_seo_pages.py` (`guia/ pokedex/ legendarios/ shinies/ tipos/ movimientos/ objetos/ logros/ novedades/ apoyar/ contacto/ en/`); `js/noframe.js` con enlace a pokesurvivor.com; `REPO` fijo en `js/ui/settings-ui.js:10` y `js/ui/ui.js:107` (más su correo en `ui.js`); Ko-fi y Sponsors en `js/data/funding.js` y `.github/FUNDING.yml`; «Web oficial: pokesurvivor.com» en `dev.html:103,286`; título y SEO en `dev.html:12-84`; `manifest.webmanifest` «PokéSurvivor». |
| Cambio pendiente | Ninguno: el menú «Trucos» que estaba sin guardar se descartó el 2026-10-21 a petición de los dueños. |
| Normas del dueño (`CLAUDE.md`) | Commits sin firma de IA; `push` sólo si lo pide el dueño; novedades en español e inglés; nunca Identity Platform; no quitar `updater.js` ni `version.json`. |
| Remoto | `origin` = `https://github.com/JPTER78/pokesurvivor.git` (los amigos no pueden subir ahí). |

Convenciones que este cambio respeta: (1) se edita `dev.html` y todo archivo nuevo del juego entra en su bloque
de scripts; (2) módulos `G.X` sin `import`; (3) textos en español con sus traducciones; (4) pruebas con
`node:test` en `tests/*.test.cjs`; (5) commits sin firma de IA y sin `push` automático.

### Target state

- `js/core/fork-config.js` (nuevo, `G.FORK`) es la única fuente de lo que distingue a esta copia: nombre,
  webs permitidas, repositorio, crédito al original, contacto y administradores. `db.js`, `ranking.js`,
  `settings-ui.js` y `ui.js` leen de ahí.
- Firebase apunta, durante toda la construcción, a los **emuladores locales** (`demo-pokekatens`); la lista de
  lanzamiento (§20.1) pega la configuración del proyecto real de los amigos.
- Inicio de sesión **sólo con nombre y contraseña** (más invitado y modo local); correo interno en
  `jugadores.pokekatens.invalid`.
- Sin TURN, sin dominio, sin SEO, sin donaciones, sin administrador heredado, sin enlaces a pokesurvivor.com.
- Identidad **PokeKatens** con el crédito «Basado en PokéSurvivor de JPTER78 · versión no oficial y sin ánimo
  de lucro» en la entrada, en Ajustes y en el aviso legal; licencias intactas.
- `tools/serve.cjs` (servidor local), `tools/emu.cjs` + `tests/emulator/*.cjs` (pruebas de datos contra los
  emuladores), `desktop/` (Electron) + `tools/desktop-smoke.cjs` (pruebas de la app), y el instalador
  `desktop/dist/PokeKatens-Setup-1.0.0.exe`.
- Publicar = `node tools/build.js --sin-seo` + commit + `push` cuando lo pidan los dueños; los jugadores se
  actualizan solos con el `updater.js` de siempre.
- `CLAUDE.md` con las normas de PokeKatens y `docs/GUIA-PUBLICAR-POKEKATENS.md` con la lista de lanzamiento
  explicada para no programadores.

### Goals — v1 scope

1. El juego se presenta como PokeKatens, no oficial, con el crédito y las licencias de JPTER78 visibles e intactos.
2. Cuentas de nombre y contraseña, partidas, ranking, amigos y salas funcionan sobre un Firebase propio y gratuito, sin ningún servidor de JPTER78.
3. Un instalador `.exe` para Windows abre el juego publicado y muestra una pantalla clara si no hay conexión.
4. Cada publicación llega sola a todos los jugadores (web y `.exe`) en unos 5 minutos.
5. Los dueños tienen normas (`CLAUDE.md`), recetas (skills) y una guía paso a paso para lanzar y publicar.

### Non-Goals — explicitly out of scope for v1

| Not building | Why not now | Revisit when |
|---|---|---|
| Jugar sin conexión dentro del `.exe` (el juego empaquetado) | Rompe la actualización automática con cada `push` y obliga a repartir un `.exe` por versión | Si los amigos juegan a menudo sin internet |
| Firma de código del `.exe` | Cuesta dinero (certificado OV/EV); el aviso de SmartScreen se explica en la guía | Si se reparte fuera del grupo de amigos |
| Versiones para macOS o Linux | Todos usan Windows; firmar en macOS exige cuenta de Apple de pago | Si alguien del grupo usa Mac o Linux |
| Páginas SEO, dominio propio, salir en buscadores | Es un juego privado entre amigos; el dominio cuesta dinero | Nunca para v1 |
| Inicio de sesión con Google | Exige configurar OAuth y no aporta nada a un grupo pequeño | Si muchos olvidan contraseñas |
| Pasar cuentas o progreso de pokesurvivor.com | No hay acceso al proyecto de JPTER78 | Nunca |
| Contenido nuevo de juego (Pokémon, ataques, funciones) | Este cambio es la base; el contenido llega después con las recetas de §19.4 | Tras el lanzamiento |
| Cualquier servicio de pago (TURN, Identity Platform, dominio, Cloudflare) | Proyecto sin presupuesto y sin ánimo de lucro | Nunca |
| Tocar la lógica de `js/core/updater.js` | Es lo que hace llegar las versiones a todos | Nunca |
| Subir nada al repositorio de JPTER78 | No es vuestro y no tenéis permiso | Nunca |
| Cambiar la forma de los datos de Firestore/RTDB (interfaces congeladas de §5) | Las reglas y el juego dependen de ella; un fallo ahí pierde partidas | En otro blueprint, con su propia prueba |
| Cambiar el protocolo del cooperativo (`database.rules.json`, `js/net/codec.js`) | Fuera del alcance; sólo se quita el TURN | En otro blueprint |

**The builder must not implement anything in this table**, aunque parezca un añadido pequeño. Si un paso
parece necesitar algo de aquí, es un defecto del blueprint: para e infórmalo en vez de ampliar el alcance.

### Success metrics

| Metric | Target | How measured |
|---|---|---|
| Comprobación global | Todas las líneas de §20.1 con exit 0 al acabar el paso 15 | El propio bloque de §20.1 |
| Tiempo hasta que un jugador ve una versión nueva | ≤ 6 min después del `push` (5 min del actualizador + caché de Pages) | Comparar `version.json` publicado (`curl -s https://<usuario>.github.io/pokekatens/version.json`) con la huella que enseña el juego |
| Coste mensual | 0 € | Firebase → Uso y facturación (plan Spark), sin método de pago |
| Servidores de JPTER78 usados | 0 referencias | La búsqueda del paso 15 sale con exit 1 |

---

## 2. Tech Stack

**Runtime track: ts-node (sólo Node como herramienta).** Esta tabla nombra elecciones, no versiones: cada
versión está en §11 y en ningún otro sitio. Las versiones salen del informe de `stack-researcher` de esta
sesión (2026-10-20); para lo que ya fija el repositorio, del propio repositorio.

| Layer | Choice | Why this, over what |
|---|---|---|
| Language / runtime | JavaScript sin compilar en el navegador; Node para herramientas y pruebas | Es lo que ya tiene el juego; meter TypeScript o un bundler sería reescribir, no cambiar |
| Framework | Ninguno (módulos `G.X` en scripts clásicos) | Convención del repo; un framework no aporta nada a un cambio de configuración e identidad |
| Styling | `css/style.css` existente | Sin cambios de diseño (§7) |
| Component layer | NOT APPLICABLE — el juego pinta en Canvas 2D y HTML propio | — |
| Database | Firebase Firestore + Realtime Database del proyecto propio (plan Spark) | Ya es lo que usa el código y sus reglas; cambiar de proveedor obligaría a reescribir `db.js`, `ranking.js` y el cooperativo |
| ORM / data access | SDK compat de Firebase que ya carga `db.js` | El código entero está escrito contra él |
| Auth | Firebase Authentication, correo/contraseña (el nombre se convierte en un correo interno) | Ya existe; sin Google: no hace falta configurar OAuth ni pantallas de consentimiento |
| Background work | NOT APPLICABLE — no hay servidor propio | — |
| Payments | NOT APPLICABLE — sin ánimo de lucro, sin donaciones | — |
| File storage | NOT APPLICABLE — los recursos viajan con la web | — |
| Email / notifications | NOT APPLICABLE — no hay correos (los correos de las cuentas son internos y no existen) | — |
| Hosting | GitHub Pages (repositorio público, rama `main`, raíz) | Gratis y se actualiza con cada `push`; Firebase Hosting obligaría a desplegar a mano |
| App de escritorio | Electron (ventana que abre la web publicada) + electron-builder (instalador NSIS por usuario) | Tauri usa el WebView2 del sistema y pide Rust para compilar; Electron lleva su propio Chromium, igual en todos los PC, y se monta sólo con npm |
| Pruebas | `node:test` (ya en el repo) + emuladores de Firebase (`firebase-tools` por `npx`) + arnés propio para la app | Sin dependencias nuevas en la raíz; los emuladores prueban las reglas reales sin servidores |
| Package manager | npm (sólo dentro de `desktop/`) | Viene con Node; la raíz sigue sin `package.json` |

### Compatibility check

Comprobado contra `knowledge/stack-compatibility.md`: ninguna de las filas de «Known-bad combinations» aplica
(no hay ORM SQL, ni dos proveedores de identidad, ni CSS mezclado, ni servidor). La pareja «autenticación de
la plataforma + su propia base de datos (Firebase)» es una de las combinaciones probadas de la tabla
*Auth-to-database pairings*. De la forma `desktop-app.md` se aplica su aviso de seguridad («nunca cargar
contenido remoto en la ventana con comandos nativos expuestos»): aquí la ventana carga contenido remoto pero
**no expone nada** (sin `preload`, `sandbox`, `contextIsolation`, sin Node) — decisión 6 de §20.3.

---

## 3. Directory Structure

```
pokesurvivor/                          # raíz del repositorio (la copia de PokeKatens)
  dev.html                             # EDITADO (pasos 1, 3, 5, 6) — página fuente; aquí se registra cada script
  index.html                           # GENERADO por node tools/build.js --sin-seo — no se edita
  version.json                         # GENERADO — la huella que mira js/core/updater.js
  manifest.webmanifest                 # EDITADO (paso 5) — nombre PokeKatens
  robots.txt                           # EDITADO (paso 6) — "User-agent: *" / "Disallow:"
  firebase.json                        # SIN CAMBIOS — emuladores auth 9099, firestore 8080, database 9000
  .firebaserc                          # EDITADO (paso 8) — proyecto demo-pokekatens
  firestore.rules                      # EDITADO (paso 9) — sólo admin()
  database.rules.json                  # SIN CAMBIOS — salas del cooperativo
  .gitignore                           # EDITADO (Bootstrap §10) — añade desktop/dist/
  CLAUDE.md                            # SUSTITUIDO (paso 14) por workspace/CLAUDE.md
  AGENTS.md                            # NUEVO (Bootstrap §10, copia de workspace/)
  README.md                            # EDITADO (paso 7) — sección PokeKatens arriba
  LICENSE, LICENSE-NONCOMMERCIAL.md    # SIN CAMBIOS — obligatorio
  .claude/                             # NUEVO (Bootstrap §10, copia de workspace/) — settings, skills, rules
  .github/FUNDING.yml                  # BORRADO (paso 7)
  CNAME, sitemap.xml, 404.html         # BORRADOS (paso 6)
  guia/ pokedex/ legendarios/ shinies/ tipos/ movimientos/ objetos/ logros/ novedades/ apoyar/ contacto/ en/
                                       # BORRADAS (paso 6) — las 12 carpetas SEO generadas
  infra/coturn/                        # BORRADA (paso 4) — el TURN de JPTER78
  js/
    app.min.js                         # GENERADO
    core/fork-config.js                # NUEVO (paso 1) — G.FORK
    core/firebase-config.js            # EDITADO (paso 1) — config del emulador
    core/db.js                         # EDITADO (pasos 1 y 3) — HOSTS de G.FORK; fuera Google
    core/updater.js                    # SIN CAMBIOS — prohibido tocarlo
    ui/login.js                        # EDITADO (paso 3)
    ui/settings-ui.js, ui/ui.js        # EDITADOS (paso 5)
    ui/social-ui.js                    # EDITADO (paso 4)
    net/net.js                         # EDITADO (paso 4) — sólo STUN
    net/ranking.js                     # EDITADO (paso 9) — ADMINS de G.FORK
    noframe.js                         # EDITADO (paso 5) — sin enlace
    game.js                            # EDITADO (paso 3) — una línea
    data/funding.js                    # EDITADO (paso 7) — vacío
    data/changelog.js, data/lang-updates.js, data/lang-en.js   # EDITADOS (paso 10) — novedades y textos nuevos traducidos
    lang/*.js                          # GENERADOS por tools/build_langs.js al construir
  tools/
    build.js                           # SIN CAMBIOS — sigue escribiendo version.json
    serve.cjs                          # NUEVO (paso 2) — servidor local, puerto 8123
    emu.cjs                            # NUEVO (paso 8) — busca Java 21 y lanza los emuladores
    desktop-smoke.cjs                  # NUEVO (paso 11) — arnés de prueba de la app
    check-tags.cjs                     # NUEVO (paso 15) — comprueba las 15 etiquetas de paso
    make_seo_pages.py                  # SIN USO (se queda; CLAUDE.md lo dice)
  tests/
    i18n.test.cjs, net-fixtures.cjs    # SIN CAMBIOS
    net.test.cjs                       # EDITADO (paso 4)
    fork.test.cjs                      # NUEVO (paso 1)
    serve.test.cjs                     # NUEVO (paso 2)
    sin-google.test.cjs                # NUEVO (paso 3)
    textos-nuevos.test.cjs             # NUEVO (paso 10) — los 7 textos nuevos, traducidos
    emulator/smoke.cjs                 # NUEVO (paso 8) — necesita emuladores; no termina en .test.cjs
    emulator/ranking.cjs               # NUEVO (paso 9)
  desktop/                             # NUEVO — la app de Windows
    package.json                       # (paso 11) — electron + electron-builder exactos, config del instalador
    package-lock.json                  # (paso 11) — lo escribe npm install; se sube
    main.js                            # (pasos 11 y 12) — ventana, enlaces externos, modo --smoke
    offline.html                       # (paso 12) — pantalla "Sin conexión"
    build/icon.png                     # (paso 13) — copia de assets/icons/icon-512.png
    legal/LICENSE, legal/LICENSE-NONCOMMERCIAL.md   # (paso 13) — copias exactas
    node_modules/                      # ignorado por .gitignore (node_modules/)
    dist/                              # ignorado; PokeKatens-Setup-1.0.0.exe y win-unpacked/PokeKatens.exe
  docs/
    GUIA-PUBLICAR-POKEKATENS.md        # NUEVO (paso 14)
    PUBLICAR.md                        # EDITADO (paso 14) — primera línea apunta a la guía nueva
  blueprints/pokekatens/               # este bundle (se sube al repositorio; no lo usa ninguna herramienta)
```

**Boundary rules**
- Todo script del juego nuevo se registra en el bloque de scripts de `dev.html`; `js/core/fork-config.js` va
  justo antes de `js/core/firebase-config.js`. La convención de carga (scripts clásicos, CommonJS en
  herramientas y escritorio) está reconciliada con cada cargador en la *Resolution convention matrix* de §19.6.
- Sólo `js/core/fork-config.js` contiene el nombre, las webs permitidas, el repo, el crédito y los
  administradores; ningún otro JS escribe a mano `github.com/JPTER78` ni `pokesurvivor.com`.
- Sólo `desktop/` tiene `package.json`; la raíz no tiene dependencias.
- `tests/*.test.cjs` no necesitan red ni emuladores; lo que los necesita vive en `tests/emulator/` sin el
  sufijo `.test.cjs`.
- Las rutas de salida (`desktop/dist/PokeKatens-Setup-1.0.0.exe`, `desktop/dist/win-unpacked/PokeKatens.exe`)
  salen de la tabla *Cross-artifact value reconciliation* de §19.6.

Origen de cada archivo nuevo: lo crea el paso indicado (está en su lista de archivos y en el `files` de su
tarea), o llega con la copia de `workspace/` del Bootstrap (`AGENTS.md`, `.claude/**`). Ningún archivo de
configuración que necesite un `Verify` queda sin dueño.

### Delta

| Cambio | Archivos |
|---|---|
| Añadidos | `js/core/fork-config.js`, `tools/serve.cjs`, `tools/emu.cjs`, `tools/desktop-smoke.cjs`, `tools/check-tags.cjs`, `tests/fork.test.cjs`, `tests/serve.test.cjs`, `tests/sin-google.test.cjs`, `tests/textos-nuevos.test.cjs`, `tests/emulator/smoke.cjs`, `tests/emulator/ranking.cjs`, `desktop/package.json`, `desktop/package-lock.json`, `desktop/main.js`, `desktop/offline.html`, `desktop/build/icon.png`, `desktop/legal/LICENSE`, `desktop/legal/LICENSE-NONCOMMERCIAL.md`, `docs/GUIA-PUBLICAR-POKEKATENS.md`, `AGENTS.md`, `.claude/settings.json`, `.claude/skills/*/SKILL.md`, `.claude/rules/*.md` |
| Modificados | `dev.html`, `manifest.webmanifest`, `robots.txt`, `.firebaserc`, `.gitignore`, `firestore.rules`, `CLAUDE.md`, `README.md`, `docs/PUBLICAR.md`, `js/core/firebase-config.js`, `js/core/db.js`, `js/ui/login.js`, `js/ui/settings-ui.js`, `js/ui/ui.js`, `js/ui/social-ui.js`, `js/net/net.js`, `js/net/ranking.js`, `js/noframe.js`, `js/game.js`, `js/data/funding.js`, `js/data/changelog.js`, `js/data/lang-updates.js`, `js/data/lang-en.js`, `tests/net.test.cjs`; regenerados: `index.html`, `js/app.min.js`, `version.json`, `js/lang/*.js` |
| Borrados | `CNAME`, `sitemap.xml`, `404.html`, `.github/FUNDING.yml`, `infra/coturn/`, y las 12 carpetas SEO `guia/ pokedex/ legendarios/ shinies/ tipos/ movimientos/ objetos/ logros/ novedades/ apoyar/ contacto/ en/` |

---

## 4. Data Model

No cambia la forma de ningún dato. Lo que sí cambia es **dónde** viven (el proyecto propio; en la
construcción, el emulador) y **quién** es administrador. Las pruebas de los pasos 8 y 9 escriben los
documentos mínimos de abajo, que son los que aceptan las reglas actuales.

### Entities

**`saves/{uid}`** (Firestore) — la partida de cada cuenta; sólo la lee y escribe su dueño.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `save` | map | obligatorio; `coins` ≥ 0, `tickets.t1` ≥ 0, `tickets.t10` ≥ 0 (`saneSave`) | La partida entera (lo que guarda `db.js`) |
| `updatedAt` | timestamp | = hora del servidor en cada escritura (`validSaveDoc`) | Base del tope: no se reescribe antes de 20 s |
| `v` | int | obligatorio | Versión del formato (hoy 3, `VERSION` de `db.js`) |
| `ban`, `sus` | bool | opcionales; el jugador no puede quitarse `ban` | Moderación |

**`lb/{tabla}/e/{id}`** (Firestore) — una marca del ranking; sólo se puede mejorar.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `t` | int | 1…2700 | Segundos aguantados (45 min máximo) |
| `uids`, `names`, `dex`, `shiny` | list | mismo tamaño; `me()` dentro de `uids` | Tablas `s_…` de una persona: tamaño 1 e `id` = su UID |
| `lv` | int | 1 … 10 + t/4 | Nivel alcanzado |
| `kills` | int | 0 … 100 + t·12 | Derrotados |
| `at` | timestamp | = hora del servidor | — |

Las demás colecciones (`names`, `profiles`, `friendships`, `inv`, `lbs`, `reports`, `runs`, `pres`) y la
rama `rooms/{id}` de la Realtime Database se quedan exactamente como están (§5, *Interfaces held constant*).

### Relationships

`saves/{uid}` —(1:1)→ cuenta de Auth · `names/{apodo}` —(1:1)→ cuenta · `lb/{tabla}/e/{id}` —(N:1..4)→ cuentas
(`uids`) · `friendships/{a_b}` —(1:2)→ cuentas. Al borrar una cuenta, `db.js` borra su `saves` y sus marcas
(como hoy); una cuenta baneada no puede borrar su `saves`. Nada de esto cambia.

### Indexes

`firestore.indexes.json` sin cambios: la lista de lanzamiento lo despliega tal cual al proyecto nuevo.

### Schema

Las reglas son el esquema. Cambio único, en `firestore.rules`:

```
// antes
function admin() { return signedIn() && me() in ['rshaa5gKD3fXw6lE4PPXITbowaG2']; }
// después (paso 9)
function admin() { return false; }
```

### Migrations

NOT APPLICABLE como migración de datos: el proyecto nuevo empieza vacío (no se traen cuentas — es un no-objetivo
de §1). Las reglas se despliegan con `npx --yes firebase-tools@15.34.0 deploy --only firestore:rules,firestore:indexes,database`
en la lista de lanzamiento.

### Seed data

Ninguno: cada prueba de `tests/emulator/` crea sus usuarios y documentos dentro de un emulador que empieza
vacío en cada `emulators:exec`. El primer usuario real lo crea un dueño en el lanzamiento.

### Delta

| Qué | Antes | Después |
|---|---|---|
| Proyecto | `pokesurvivor-free` (JPTER78) | `demo-pokekatens` (emulador) → el proyecto propio en el lanzamiento |
| `admin()` en reglas | UID de JPTER78 | `false` → vuestro UID en el lanzamiento |
| `ADMINS` del juego | UID de JPTER78 | `G.FORK.admins` (vacío → vuestro UID) |
| Correo interno de cuentas | `@jugadores.pokesurvivor.net` | `@jugadores.pokekatens.invalid` |
| Campos y colecciones | — | sin cambios |

---

## 5. API Design

No hay servidor propio. Las «interfaces» de este cambio son: el servidor local de desarrollo, las llamadas REST
que usan las pruebas contra los emuladores, el contrato de línea de comandos de la app de escritorio y lo que
se queda congelado del juego.

### Conventions

- Base: `http://127.0.0.1:<puerto>/` (servidor local); los emuladores en `127.0.0.1` 9099/8080/9000 (`firebase.json`).
- Respuestas: archivos tal cual; errores con código HTTP y cuerpo de texto corto.
- Códigos del servidor local: 200, 400 (ruta mal codificada), 403 (fuera de la raíz), 404, 405 (método).
- Validación: la de `firestore.rules` y `database.rules.json` (no hay otra capa).
- Paginación, idempotencia, límites: NOT APPLICABLE en el servidor local; en Firestore, los topes de escritura de las reglas (20 s).

### Routes

| Method | Path | Description | Auth | Rate limit |
|---|---|---|---|---|
| GET/HEAD | `/` y cualquier archivo bajo la raíz (`tools/serve.cjs`) | Sirve el juego; `/` → `index.html`; `Cache-Control: no-store` | pública, sólo 127.0.0.1 | ninguno |
| otros | cualquier ruta (`tools/serve.cjs`) | 405 | — | — |
| POST | `127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-pokekatens-key` | Crea un usuario en el emulador de Auth (pruebas) | ninguna | — |
| POST | `127.0.0.1:8080/v1/projects/demo-pokekatens/databases/(default)/documents:commit` | Escritura con hora del servidor (pruebas) | `Bearer <idToken>` | reglas |
| GET | `127.0.0.1:8080/v1/projects/demo-pokekatens/databases/(default)/documents/<ruta>` | Lectura (pruebas) | `Bearer <idToken>` | reglas |

### Critical endpoints — full detail

**App de escritorio (`desktop/main.js`) — contrato de línea de comandos**

| Entrada | Efecto |
|---|---|
| `PK_URL` (variable) | URL que abre; si falta, `pokekatens.url` de `desktop/package.json` |
| `PK_PROFILE` (variable) | Carpeta de perfil (`userData`) que usar; si falta, el perfil normal |
| `--smoke` | Ventana oculta; termina sola con una marca |
| `PK_SMOKE_OUT` (variable) | Archivo donde además se escribe la marca |

| Marca | Cuándo | Código de salida |
|---|---|---|
| `PK_SMOKE_OK` | Terminó de cargar la URL del juego | 0 |
| `PK_SMOKE_OFFLINE` | Falló el marco principal y se mostró `offline.html` | 0 |
| `PK_SMOKE_TIMEOUT` | 30 s sin terminar de cargar | 3 |

**Arnés `tools/desktop-smoke.cjs`**: imprime `DESKTOP_SMOKE_OK <modo>` y sale con 0, o
`DESKTOP_SMOKE_FAIL <modo>: código <c>, marca <m>` y sale con 1. Modos: `online`, `offline`, `hang`, y
`--exe <ruta>` (modo `online` con el programa empaquetado); `--url <url>` cambia el servidor local por esa URL;
`--exe <ruta> --default` (modo `default`) **no** pasa `PK_URL`, así que el programa abre su `pokekatens.url` de fábrica
(si es `http://127.0.0.1:8123/`, el arnés arranca antes `tools/serve.cjs --port 8123`). Cada ejecución usa un perfil
nuevo (`PK_PROFILE`, carpeta temporal): sin caché ni service worker de pruebas anteriores.

**`tools/emu.cjs`**: `--check-java` → 0 con Java ≥ 21, 2 sin él; `"<comando>"` → el código del comando dentro
de `emulators:exec`; uso incorrecto → 64.

**`tests/emulator/smoke.cjs` / `ranking.cjs`**: imprimen `ok …` por comprobación y al final
`EMULATOR_SMOKE_OK` / `EMULATOR_RANKING_OK` (exit 0), o `EMULATOR_…_FAIL …` (exit 1). Los cuerpos exactos de
cada petición están en los pasos 8 y 9.

### Interfaces held constant

Cada fila es también un no-objetivo de §1 (no se cambia) y una fila de paridad de §9.1.

| Interfaz | Qué no se mueve | Cómo se comprueba |
|---|---|---|
| Colecciones y campos de Firestore | `saves`, `names`, `profiles`, `friendships`, `inv`, `lb/{tabla}/e`, `lbs`, `reports`, `runs`, `pres` y sus reglas (salvo `admin()`) | `tests/emulator/smoke.cjs` y `ranking.cjs` contra las reglas reales |
| Salas del cooperativo | `rooms/{id}` y `database.rules.json` | `git diff --quiet step-00-preparacion -- database.rules.json` (paso 15) |
| Actualización | `js/core/updater.js` y `version.json` `{ v, at[, force] }` escrito por `tools/build.js` | `git diff --quiet step-00-preparacion -- js/core/updater.js` y `grep -qF "version.json" tools/build.js` (paso 15) |
| Datos locales del navegador | las claves `ps.*` que usa `js/core/db.js` (`ps.accounts`, `ps.session`, `ps.save.*`, `ps.cloud.*`, `ps.migrated.*`) y `ps.lang` | No se toca el código que las usa (`db.js` sólo pierde Google) |
| API de `G.DB` | el objeto que devuelve `js/core/db.js` (líneas 880-895) igual, salvo `loginWithGoogle`, `linkGoogle` y `hasGoogle`, que desaparecen | `tests/sin-google.test.cjs` |
| API de `G.Net` | el objeto que devuelve `js/net/net.js` igual, salvo `viaTurn`, que desaparece | `tests/net.test.cjs` |
| Construcción | `tools/build.js` y sus opciones; marcas `scripts:begin/end` | Cada paso ejecuta `node tools/build.js --sin-seo` |
| Emuladores | `firebase.json` (puertos 9099/8080/9000) | `tools/emu.cjs` y las pruebas usan esas puertas |
| Licencias | `LICENSE`, `LICENSE-NONCOMMERCIAL.md` | `git diff --quiet HEAD -- LICENSE LICENSE-NONCOMMERCIAL.md` (pasos 5 y 7) |
| Modo invitado y modo local | `playAsGuest`, `localReason` `'file'`/`'config'`/`'host'` | `tests/sin-google.test.cjs` |

### Delta

Fuera: `G.DB.loginWithGoogle`, `G.DB.linkGoogle`, `G.DB.hasGoogle`, `G.Net.viaTurn`, `G.LoginUI.offerRecovery`,
la llamada a `https://ice.pokesurvivor.com/v1/ice`. Nuevos: `G.FORK`, `tools/serve.cjs`, `tools/emu.cjs`,
`tools/desktop-smoke.cjs` y el contrato de `desktop/main.js`.

---

## 6. Frontend Architecture

El juego sigue siendo una sola página (`index.html`, generada de `dev.html`) que cambia de pantalla con
secciones `#scr-…`. Este cambio sólo toca estas superficies:

### Routes

| Route | Page | Data source | Auth |
|---|---|---|---|
| `/` (`index.html`) | El juego: entrada, menú y partidas | Firebase (o local) | cuenta, invitado o local |
| `/dev.html` | Lo mismo con los scripts sueltos (sólo para programar) | igual | igual |
| `desktop/offline.html` (dentro del `.exe`) | «Sin conexión» con botón Reintentar | ninguna | — |

### Rendering strategy

Todo en el cliente, como hoy: HTML estático + scripts. GitHub Pages sirve archivos; el `.exe` los carga con
Chromium (Electron). Las versiones se renuevan con el actualizador (`version.json` cada 5 min).

El juego registra un *service worker* (`sw.js`, desde `js/main.js`): después de la primera carga con conexión, sin internet sirve la copia guardada del juego (que abre, pero sin cuentas, ranking ni cooperativo). Por eso `offline.html` del `.exe` sólo aparece cuando la web **nunca** se ha cargado en ese perfil; la prueba `--offline` lo comprueba con un perfil nuevo (`PK_PROFILE`), es decir, el primer arranque sin conexión.

### Component hierarchy

```
#scr-login            entrada: logo "PokeKatens", línea de crédito, Entrar / Crear cuenta, invitado (sin Google)
  #forgot-note        "Si olvidas la contraseña, pídele al administrador que te cree otra cuenta."
#scr-settings         Ajustes → Acerca de: crédito + enlace a G.FORK.upstream (+ repo si G.FORK.repo)
                      Ajustes → Cuenta: tipo "Nombre y contraseña" o "Cuenta de este navegador"
#scr-legal            aviso legal: "Versión no oficial" + crédito; contacto y repo sólo si G.FORK los tiene
offline.html          (escritorio) h1 "Sin conexión", texto, botón "Reintentar"
```

### State management

Sin cambios: `G.DB` guarda la partida (navegador + nube con el botón Guardar), `G.Settings` los ajustes.
`G.FORK` es configuración de sólo lectura.

### Loading, empty, and error states

- Sin nube (sin config, web no permitida, fallo): la entrada explica que la partida sólo se guarda en este
  navegador (`modeNote()` de `login.js`, con el texto nuevo para `host`).
- Sin conexión en el `.exe` la primera vez: `offline.html` en vez de una ventana en blanco. Después de la primera carga, la copia del service worker (ver *Rendering strategy*).
- Sin contacto o sin repo configurados: esas líneas del aviso legal y de Ajustes no se pintan.

---

## 7. Design System

NOT APPLICABLE — PokeKatens conserva el estilo visual del juego tal cual (`css/style.css`); este cambio no
define paleta, tipografía ni componentes nuevos. La única pantalla nueva, `desktop/offline.html`, lleva sus
colores literales escritos en el paso 12 (sacados de `manifest.webmanifest` y `js/noframe.js`).

---

## 8. Authentication & Authorization

### Provider and rationale

Firebase Authentication con correo/contraseña, en el proyecto propio (plan Spark). El jugador sólo ve
«nombre» y «contraseña»: `db.js` convierte el nombre en un correo interno (`<hex del nombre>@jugadores.pokekatens.invalid`).
Es lo que ya hacía el juego; sólo se quita Google. **Nunca Identity Platform** (cobra por usuario).

### Flows

- **Crear cuenta**: nombre (3-16 letras, números o `_`) + contraseña (≥ 6 en la nube) → `createUserWithEmailAndPassword` → abre su partida. Nombre repetido → «Ese nombre ya existe.»
- **Entrar**: `signInWithEmailAndPassword` → abre su partida. Mal → «Usuario o contraseña incorrectos.»
- **Olvidé la contraseña**: no hay recuperación (no hay correo real). Texto: «Si olvidas la contraseña, pídele al administrador que te cree otra cuenta.» La guía (paso 14) explica qué puede hacer el administrador.
- **Invitado**: juega sin guardar (sin cuenta).
- **Modo local**: sin config o en una web fuera de `G.FORK.hosts` → cuentas sólo en este navegador.
- **Cerrar sesión**: sube lo pendiente y sale. **Borrar cuenta**: pide la contraseña (`reauthenticateWithCredential`), borra la partida y la cuenta.

### Route protection

| Surface | Rule | Enforced where |
|---|---|---|
| `saves/{uid}` | sólo su dueño | `firestore.rules` (`match /saves/{uid}`) |
| `lb/{tabla}/e/{id}` | escribir sólo marcas válidas y mejores | `firestore.rules` (`validEntry`) |
| `reports/*`, moderación | sólo `admin()` | `firestore.rules` (`admin()`), y `G.Ranking.isAdmin()` sólo oculta la pantalla |
| `rooms/{id}` | miembros de la sala | `database.rules.json` |

**Enforcement rule:** la autorización la deciden las reglas de Firebase en cada petición. Ocultar la pantalla
de moderación (`js/ui/mod-ui.js`) es cosmético.

### Roles and permissions

| Role | Can | Cannot |
|---|---|---|
| Jugador | Su partida, su perfil, amigos, salas, marcas válidas, reportar | Leer partidas ajenas, poner marcas imposibles, moderar |
| Administrador (UID en `firestore.rules` y `G.FORK.admins`) | Lo del jugador + leer/borrar reportes, banear, quitar filas del top | Editar partidas ajenas más allá de `ban` |
| Invitado | Jugar | Guardar nada, ranking, amigos |

### Sessions

Sesión de Firebase Auth en el almacenamiento del navegador (`Persistence.LOCAL`), renovada por el SDK. En el
`.exe`, en la carpeta de datos de la app (por usuario de Windows). Sin cookies propias ni CSRF (no hay servidor).

### Multi-tenancy / row-level isolation

NOT APPLICABLE como multi-inquilino; el aislamiento por jugador lo hacen las reglas (`me() == uid`).

---

## 9. BUILD ORDER

### The rules of a step

1. **Una sentada por paso**: como mucho 5 archivos y 2-6 criterios de aceptación.
2. **Cada paso tiene `Do`, `Done when`, `Verify` y `Checkpoint`.** El Checkpoint hace commit (mensaje en
   español, **sin «Co-Authored-By» ni firma de IA**, norma de los dueños) y pone la etiqueta con
   `git tag -f step-NN-<slug>` (`-f`: volver a etiquetar un paso rehecho nunca falla). Nunca `git push`.
3. **«Done when» se puede comprobar con un comando**, en forma EARS (**WHEN** … **THE SYSTEM SHALL** …).
4. **`Verify` es shell literal** que se ejecuta desde la raíz del repositorio en Git Bash, y su propio código
   de salida decide; el comentario `# expect:` sólo lo explica.
5. Un paso no está hecho hasta que pasa su `Verify` **y** siguen pasando los de los pasos anteriores (las
   pruebas `tests/*.test.cjs` se acumulan, así que cada `node --test` repite las comprobaciones anteriores).
6. **Volver atrás — único procedimiento** (el mismo en las épicas y en el paso 15). Si el paso NN (o uno
   posterior) sale mal, nunca se arregla hacia delante ni se empieza el siguiente con éste en rojo:

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
7. Ningún paso añade algo que rompa el `Verify` de uno anterior: no hay validación de variables, ni linter, ni
   reglas nuevas que corran dentro de comandos anteriores (§10 no tiene variables «requeridas»).
8. Ningún `Verify` comprueba algo que sólo su propio `Checkpoint` produce: lo que necesita el commit hecho
   (archivos ya en git, etiquetas) está en el bloque `Checkpoint`, después del commit.
9. Toda comprobación que espera un fallo afirma el código exacto (`status=0; cmd || status=$?; test "$status" -eq 1`);
   nunca `!` ni «cualquier código distinto de 0».
10. Durante la construcción, el `CLAUDE.md` de la raíz es todavía el de JPTER78 (lo sustituye el paso 14).
    Donde choque con este blueprint (comando de publicar, proyecto de Firebase, dominio), **manda el blueprint**;
    sus normas de commits sin firma y sin `push` se cumplen igual.

### One step, one unit — the counting rule

**Un paso de §9 = una tarea de `tasks.json` = un bloque de tarea en un archivo de épica.** Este blueprint tiene
**15 pasos** → 15 tareas → **3 épicas** de 5 pasos cada una (lo legal para 15 pasos es 2 o 3; se eligen 3 por
las tres capas naturales: base del fork, limpieza y datos, escritorio y publicación).

### Step map

| # | Step | Depends on | Touches | Gate |
|---|---|---|---|---|
| 1 | Crear fork-config y apuntar Firebase al emulador | — (Bootstrap §10) | `js/core/fork-config.js`, `js/core/firebase-config.js`, `dev.html`, `js/core/db.js`, `tests/fork.test.cjs` | `node --test "tests/*.test.cjs"` |
| 2 | Crear el servidor local tools/serve.cjs | 1 | `tools/serve.cjs`, `tests/serve.test.cjs` | `node --test "tests/*.test.cjs"` |
| 3 | Quitar el inicio de sesión con Google | 2 | `js/core/db.js`, `js/ui/login.js`, `dev.html`, `js/game.js`, `tests/sin-google.test.cjs` | `node --test "tests/*.test.cjs"` |
| 4 | Quitar el TURN: cooperativo sólo con STUN | 3 | `js/net/net.js`, `tests/net.test.cjs`, `js/ui/social-ui.js`, `infra/coturn/**` | `node --test "tests/*.test.cjs"` |
| 5 | Poner el nombre PokeKatens y el crédito a JPTER78 | 4 | `dev.html`, `manifest.webmanifest`, `js/ui/settings-ui.js`, `js/ui/ui.js`, `js/noframe.js` | `grep -qF "<title>PokeKatens</title>" dev.html` |
| 6 | Quitar las páginas SEO y el dominio pokesurvivor.com | 5 | `dev.html`, `robots.txt`, `CNAME`, `sitemap.xml`, `{404.html,guia/**,pokedex/**,legendarios/**,shinies/**,tipos/**,movimientos/**,objetos/**,logros/**,novedades/**,apoyar/**,contacto/**,en/**}` | `test -z "$(ls -d CNAME sitemap.xml 404.html guia pokedex legendarios shinies tipos movimientos objetos logros novedades apoyar contacto en 2>/dev/null)"` |
| 7 | Quitar donaciones y presentar el fork en el README | 6 | `js/data/funding.js`, `.github/FUNDING.yml`, `README.md` | `node -e "const G={};new Function('G',require('fs').readFileSync('js/data/funding.js','utf8'))(G);const f=G.Funding;process.exit(f.url===''&&f.kofi===''&&f.sponsors===''&&f.costs.length===0?0:1)"` |
| 8 | Probar cuentas y partidas contra el emulador de Firebase | 7 | `.firebaserc`, `tools/emu.cjs`, `tests/emulator/smoke.cjs` | `node tools/emu.cjs --check-java` |
| 9 | Quitar el administrador de JPTER78 de reglas y juego | 8 | `firestore.rules`, `js/net/ranking.js`, `tests/emulator/ranking.cjs` | `node tools/build.js --sin-seo` |
| 10 | Traducir los textos nuevos y contar el cambio en novedades | 9 | `js/data/changelog.js`, `js/data/lang-updates.js`, `js/data/lang-en.js`, `tests/textos-nuevos.test.cjs` | `node -e "const G={};new Function('G',require('fs').readFileSync('js/data/changelog.js','utf8'))(G);const e=G.CHANGELOG[0],l=[...(e.new\|\|[]),...(e.chg\|\|[]),...(e.fix\|\|[])];const t=l.map(p=>p[0]).join(' ');process.exit(e.d>='2026-10-20'&&e.title[0].startsWith('PokeKatens')&&t.includes('PokeKatens')&&t.includes('administrador')&&l.every(p=>p[1])?0:1)"` |
| 11 | Crear la app de escritorio y abrirla por primera vez | 10 | `desktop/package.json`, `desktop/package-lock.json`, `desktop/main.js`, `tools/desktop-smoke.cjs` | `npm install --prefix desktop` |
| 12 | Mostrar la pantalla Sin conexión cuando no carga | 11 | `desktop/offline.html`, `desktop/main.js` | `node tools/desktop-smoke.cjs --offline \| grep -F "DESKTOP_SMOKE_OK offline"` |
| 13 | Generar el instalador PokeKatens-Setup-1.0.0.exe | 12 | `desktop/build/icon.png`, `desktop/legal/LICENSE`, `desktop/legal/LICENSE-NONCOMMERCIAL.md` | `cmp assets/icons/icon-512.png desktop/build/icon.png` |
| 14 | Poner las normas de PokeKatens y la guía para publicar | 13 | `CLAUDE.md`, `docs/GUIA-PUBLICAR-POKEKATENS.md`, `docs/PUBLICAR.md` | `diff -q CLAUDE.md blueprints/pokekatens/workspace/CLAUDE.md` |
| 15 | Construir la versión final y pasar la comprobación global | 14 | `index.html`, `js/app.min.js`, `version.json`, `tools/check-tags.cjs` | `node tools/build.js --sin-seo` |

#### Step 1 — Crear fork-config y apuntar Firebase al emulador

Tarea `E1-T1` · épica `01-base-del-fork` · etiqueta `step-01-config-fork`

**Do**

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

Archivos (los toca este paso; son los `files` de su tarea en `tasks.json`):
- `js/core/fork-config.js`
- `js/core/firebase-config.js`
- `dev.html`
- `js/core/db.js`
- `tests/fork.test.cjs`

**Done when**
- [ ] **WHEN** `node --test "tests/*.test.cjs"` se ejecuta **THE SYSTEM SHALL** pasar `tests/fork.test.cjs`, que carga `js/core/fork-config.js` y `js/core/firebase-config.js` en un entorno aislado y comprueba `G.FORK.name === 'PokeKatens'`, `G.FORK.upstream === 'https://github.com/JPTER78/pokesurvivor'`, que `G.FORK.hosts` incluye `localhost` y `127.0.0.1` y que `G.FORK.admins` es una lista de textos.
- [ ] **WHEN** `tests/fork.test.cjs` lee el bloque de scripts de `dev.html` **THE SYSTEM SHALL** encontrar `js/core/fork-config.js` antes que `js/core/firebase-config.js`, y éste antes que `js/core/db.js`.
- [ ] **WHEN** `tests/fork.test.cjs` lee `js/core/db.js` **THE SYSTEM SHALL** encontrar `const HOSTS = G.FORK.hosts;` y ningún texto `'pokesurvivor.com'`.
- [ ] **WHEN** `grep -rn "pokesurvivor-free" js/core` se ejecuta **THE SYSTEM SHALL** no encontrar nada (exit 1), y `js/core/firebase-config.js` SHALL contener `projectId: 'demo-pokekatens'` y `emulator: true`.
- [ ] **WHEN** `node tools/build.js --sin-seo` y `node tools/export_data.js` se ejecutan **THE SYSTEM SHALL** terminar ambos con exit 0.

**Verify**
```bash
# si este paso (o uno posterior) sale mal: procedimiento «Volver atrás» de §9 (regla 6) con NN = 01
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

---

#### Step 2 — Crear el servidor local tools/serve.cjs

Tarea `E1-T2` · épica `01-base-del-fork` · etiqueta `step-02-servidor-local`

**Do**

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

Archivos (los toca este paso; son los `files` de su tarea en `tasks.json`):
- `tools/serve.cjs`
- `tests/serve.test.cjs`

**Done when**
- [ ] **WHEN** `node tools/serve.cjs --port 0` arranca **THE SYSTEM SHALL** escribir una línea `PK_SERVE http://127.0.0.1:<puerto>/` y escuchar sólo en `127.0.0.1`.
- [ ] **WHEN** `tests/serve.test.cjs` pide `/dev.html`, `/js/core/util.js` y `/version.json` **THE SYSTEM SHALL** responder 200 con `Content-Type` que empieza por `text/html`, `text/javascript` y `application/json`, y con `Cache-Control: no-store`.
- [ ] **WHEN** `tests/serve.test.cjs` pide `/no-existe.html` **THE SYSTEM SHALL** responder 404.
- [ ] **WHEN** `tests/serve.test.cjs` pide la ruta sin normalizar `/%2e%2e/%2e%2e/secreto.txt` **THE SYSTEM SHALL** responder 403 y no servir nada de fuera de la carpeta del repositorio.
- [ ] **WHEN** `tests/serve.test.cjs` manda `POST /` **THE SYSTEM SHALL** responder 405.

**Verify**
```bash
# si este paso (o uno posterior) sale mal: procedimiento «Volver atrás» de §9 (regla 6) con NN = 02
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

---

#### Step 3 — Quitar el inicio de sesión con Google

Tarea `E1-T3` · épica `01-base-del-fork` · etiqueta `step-03-sin-google`

**Do**

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

Archivos (los toca este paso; son los `files` de su tarea en `tasks.json`):
- `js/core/db.js`
- `js/ui/login.js`
- `dev.html`
- `js/game.js`
- `tests/sin-google.test.cjs`

**Done when**
- [ ] **WHEN** `node --test "tests/*.test.cjs"` se ejecuta **THE SYSTEM SHALL** pasar `tests/sin-google.test.cjs`, que no encuentra ninguno de `GoogleAuthProvider`, `signInWithPopup`, `linkWithPopup`, `reauthenticateWithPopup`, `loginWithGoogle`, `linkGoogle`, `hasGoogle`, `offerRecovery`, `btn-google`, `scr-recover`, `apis.google.com` ni `auth/popup-blocked` en `dev.html` ni en los `.js` de `js/` (salvo `js/app.min.js`, `js/lang/` y `js/data/`).
- [ ] **WHEN** `tests/sin-google.test.cjs` lee `dev.html` **THE SYSTEM SHALL** encontrar exactamente la CSP `script-src 'self' file: https://www.gstatic.com https://*.firebaseio.com https://*.firebasedatabase.app; object-src 'none'; base-uri 'self'`.
- [ ] **WHEN** `tests/sin-google.test.cjs` lee `js/core/db.js` **THE SYSTEM SHALL** encontrar `const NAME_DOMAIN = 'jugadores.pokekatens.invalid';`, `createUserWithEmailAndPassword`, `signInWithEmailAndPassword` y `localReason = 'config'`.
- [ ] **WHEN** `tests/sin-google.test.cjs` lee `dev.html` y `js/ui/login.js` **THE SYSTEM SHALL** encontrar `id="btn-guest"`, `id="forgot-note"` y el texto `pídele al administrador que te cree otra cuenta`, y ningún `pokesurvivor.com` en `js/ui/login.js`.
- [ ] **WHEN** `node tools/build.js --sin-seo` se ejecuta **THE SYSTEM SHALL** terminar con exit 0.
- [ ] **WHEN** `grep -niE "entrar con google|si entras con google|correo de google|gmail" dev.html` se ejecuta **THE SYSTEM SHALL** no encontrar nada (exit 1): los textos de privacidad y de apodo ya no hablan de Google.

**Verify**
```bash
# si este paso (o uno posterior) sale mal: procedimiento «Volver atrás» de §9 (regla 6) con NN = 03
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

---

#### Step 4 — Quitar el TURN: cooperativo sólo con STUN

Tarea `E1-T4` · épica `01-base-del-fork` · etiqueta `step-04-sin-turn`

**Do**

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

Archivos (los toca este paso; son los `files` de su tarea en `tasks.json`):
- `js/net/net.js`
- `tests/net.test.cjs`
- `js/ui/social-ui.js`
- `infra/coturn/**`

**Done when**
- [ ] **WHEN** `node --test "tests/*.test.cjs"` se ejecuta **THE SYSTEM SHALL** pasar todas las pruebas de `tests/net.test.cjs`, incluida la nueva `STUN only: no request is made and every peer gets only the two Google STUN servers`, que comprueba que el `fetch` inyectado se llama 0 veces y que cada configuración de `RTCPeerConnection` es exactamente `{ iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] }`.
- [ ] **WHEN** `grep -rnE "ice\.pokesurvivor\.com|turn\.pokesurvivor\.com|TURN_API|viaTurn|turnServers" js/net js/ui tests` se ejecuta **THE SYSTEM SHALL** no encontrar nada (exit 1).
- [ ] **WHEN** `test ! -e infra/coturn` se ejecuta **THE SYSTEM SHALL** terminar con exit 0.
- [ ] **WHEN** `node tools/build.js --sin-seo` se ejecuta **THE SYSTEM SHALL** terminar con exit 0.

**Verify**
```bash
# si este paso (o uno posterior) sale mal: procedimiento «Volver atrás» de §9 (regla 6) con NN = 04
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

---

#### Step 5 — Poner el nombre PokeKatens y el crédito a JPTER78

Tarea `E1-T5` · épica `01-base-del-fork` · etiqueta `step-05-identidad`

**Do**

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

Archivos (los toca este paso; son los `files` de su tarea en `tasks.json`):
- `dev.html`
- `manifest.webmanifest`
- `js/ui/settings-ui.js`
- `js/ui/ui.js`
- `js/noframe.js`

**Done when**
- [ ] **WHEN** se busca en `dev.html` **THE SYSTEM SHALL** encontrar `<title>PokeKatens</title>`, `<div class="t1">PokeKatens</div>` y la línea visible `Basado en PokéSurvivor de JPTER78 · versión no oficial y sin ánimo de lucro`, y SHALL no encontrar `<div class="t1">PokéSurvivor` (tampoco en el logo del menú principal), `<h1>PokéSurvivor</h1>` (pantallas de carga y de «Pulsa para empezar»), `PokéSurvivor necesita JavaScript`, `apple-mobile-web-app-title" content="PokéSurvivor` ni `PokéSurvivor se juega en horizontal`.
- [ ] **WHEN** `grep -ni "web oficial" dev.html` se ejecuta **THE SYSTEM SHALL** no encontrar nada (exit 1).
- [ ] **WHEN** se lee `manifest.webmanifest` como JSON **THE SYSTEM SHALL** tener `name` y `short_name` iguales a `PokeKatens` y la descripción `Versión no oficial, gratis y sin ánimo de lucro, basada en PokéSurvivor de JPTER78`.
- [ ] **WHEN** se busca en `js/ui/settings-ui.js` y `js/ui/ui.js` **THE SYSTEM SHALL** encontrar `G.FORK.repo` en los dos, ningún `github.com/JPTER78`, ningún `pokesurvivor.com` y ningún enlace `href="contacto/"`; y `js/noframe.js` SHALL no contener `pokesurvivor.com`.
- [ ] **WHEN** `git diff --quiet HEAD -- LICENSE LICENSE-NONCOMMERCIAL.md` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 (las licencias no se tocan).
- [ ] **WHEN** `node --test "tests/*.test.cjs"` y `node tools/build.js --sin-seo` se ejecutan **THE SYSTEM SHALL** terminar ambos con exit 0.

**Verify**
```bash
# si este paso (o uno posterior) sale mal: procedimiento «Volver atrás» de §9 (regla 6) con NN = 05
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

---

#### Step 6 — Quitar las páginas SEO y el dominio pokesurvivor.com

Tarea `E2-T1` · épica `02-limpieza-y-datos` · etiqueta `step-06-sin-seo`

**Do**

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

Archivos (los toca este paso; son los `files` de su tarea en `tasks.json`):
- `dev.html`
- `robots.txt`
- `CNAME`
- `sitemap.xml`
- `{404.html,guia/**,pokedex/**,legendarios/**,shinies/**,tipos/**,movimientos/**,objetos/**,logros/**,novedades/**,apoyar/**,contacto/**,en/**}`

**Done when**
- [ ] **WHEN** `ls -d CNAME sitemap.xml 404.html guia pokedex legendarios shinies tipos movimientos objetos logros novedades apoyar contacto en` se ejecuta **THE SYSTEM SHALL** no listar ninguno (ya no existen).
- [ ] **WHEN** se lee `robots.txt` sin los retornos de carro **THE SYSTEM SHALL** contener exactamente las dos líneas `User-agent: *` y `Disallow:`.
- [ ] **WHEN** `grep -nE "seo:begin|seo:end|pokesurvivor\.com|ps-pages" dev.html` se ejecuta **THE SYSTEM SHALL** no encontrar nada (exit 1).
- [ ] **WHEN** `node tools/build.js --sin-seo` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 y el `index.html` generado SHALL no contener `pokesurvivor.com`.
- [ ] **WHEN** `node --test "tests/*.test.cjs"` y `node tools/export_data.js` se ejecutan **THE SYSTEM SHALL** terminar ambos con exit 0.

**Verify**
```bash
# si este paso (o uno posterior) sale mal: procedimiento «Volver atrás» de §9 (regla 6) con NN = 06
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

---

#### Step 7 — Quitar donaciones y presentar el fork en el README

Tarea `E2-T2` · épica `02-limpieza-y-datos` · etiqueta `step-07-sin-donaciones`

**Do**

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

Archivos (los toca este paso; son los `files` de su tarea en `tasks.json`):
- `js/data/funding.js`
- `.github/FUNDING.yml`
- `README.md`

**Done when**
- [ ] **WHEN** se carga `js/data/funding.js` **THE SYSTEM SHALL** dejar `G.Funding.kofi === ''`, `G.Funding.sponsors === ''`, `G.Funding.costs` vacío y `G.Funding.url === ''` (el botón de Ko-fi no sale nunca).
- [ ] **WHEN** `test ! -e .github/FUNDING.yml` se ejecuta **THE SYSTEM SHALL** terminar con exit 0.
- [ ] **WHEN** se leen las 20 primeras líneas de `README.md` **THE SYSTEM SHALL** encontrar `PokeKatens — versión no oficial`, y `README.md` SHALL seguir conteniendo `Jonathan Piera Torregrosa` y la línea `Required Notice: Copyright 2026 JPTER78 (https://github.com/JPTER78/pokesurvivor)`.
- [ ] **WHEN** `git diff --quiet HEAD -- LICENSE LICENSE-NONCOMMERCIAL.md` se ejecuta **THE SYSTEM SHALL** terminar con exit 0.
- [ ] **WHEN** `node tools/export_data.js`, `node tools/build.js --sin-seo` y `node --test "tests/*.test.cjs"` se ejecutan **THE SYSTEM SHALL** terminar los tres con exit 0.

**Verify**
```bash
# si este paso (o uno posterior) sale mal: procedimiento «Volver atrás» de §9 (regla 6) con NN = 07
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

---

#### Step 8 — Probar cuentas y partidas contra el emulador de Firebase

Tarea `E2-T3` · épica `02-limpieza-y-datos` · etiqueta `step-08-emulador`

**Do**

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

Archivos (los toca este paso; son los `files` de su tarea en `tasks.json`):
- `.firebaserc`
- `tools/emu.cjs`
- `tests/emulator/smoke.cjs`

**Done when**
- [ ] **WHEN** `node tools/emu.cjs --check-java` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 si encuentra Java 21 o más nuevo (en `JAVA_HOME`, en `C:\Program Files\Eclipse Adoptium\jdk-2*` o en el `PATH`), y con exit 2 y el mensaje `Falta Java 21` si no.
- [ ] **WHEN** `node tools/emu.cjs "node tests/emulator/smoke.cjs"` se ejecuta **THE SYSTEM SHALL** arrancar los emuladores `auth`, `firestore` y `database` del proyecto `demo-pokekatens` con `firebase-tools@15.34.0`, ejecutar el script, pararlos y terminar con el mismo código que el script.
- [ ] **WHEN** `tests/emulator/smoke.cjs` escribe `saves/{uid1}` con el token del usuario 1 mediante `documents:commit` **THE SYSTEM SHALL** responder 200.
- [ ] **WHEN** `tests/emulator/smoke.cjs` lee `saves/{uid1}` con el token del usuario 2 **THE SYSTEM SHALL** responder 403, y con el token del usuario 1 SHALL responder 200 con un documento cuyo `name` acaba en `/saves/{uid1}`.
- [ ] **WHEN** el usuario 1 vuelve a escribir `saves/{uid1}` antes de 20 segundos **THE SYSTEM SHALL** responder 403 (el tope de 20 s de `firestore.rules`), y el script SHALL imprimir `EMULATOR_SMOKE_OK` y terminar con exit 0.
- [ ] **WHEN** se lee `.firebaserc` **THE SYSTEM SHALL** contener `"default": "demo-pokekatens"`.

**Verify**
```bash
# si este paso (o uno posterior) sale mal: procedimiento «Volver atrás» de §9 (regla 6) con NN = 08
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

---

#### Step 9 — Quitar el administrador de JPTER78 de reglas y juego

Tarea `E2-T4` · épica `02-limpieza-y-datos` · etiqueta `step-09-reglas-admin`

**Do**

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

Archivos (los toca este paso; son los `files` de su tarea en `tasks.json`):
- `firestore.rules`
- `js/net/ranking.js`
- `tests/emulator/ranking.cjs`

**Done when**
- [ ] **WHEN** `grep -rn "rshaa5gKD3fXw6lE4PPXITbowaG2" js firestore.rules` se ejecuta después de `node tools/build.js --sin-seo` **THE SYSTEM SHALL** no encontrar nada (exit 1).
- [ ] **WHEN** se busca en `js/net/ranking.js` y `firestore.rules` **THE SYSTEM SHALL** encontrar `const ADMINS = G.FORK.admins;` y `function admin() { return false; }`.
- [ ] **WHEN** `tests/emulator/ranking.cjs` escribe `lb/s_test/e/{uid}` con `t: 2701` **THE SYSTEM SHALL** responder 403, y con `t: 600` (`uids`, `names`, `dex` y `shiny` de un elemento, `lv: 1`, `kills: 0`, `at` = hora del servidor) SHALL responder 200.
- [ ] **WHEN** ese mismo usuario sin permisos de administrador lee `reports/nada` **THE SYSTEM SHALL** responder 403, y el script SHALL imprimir `EMULATOR_RANKING_OK` y terminar con exit 0.
- [ ] **WHEN** `node tools/emu.cjs "node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs"` se ejecuta **THE SYSTEM SHALL** imprimir `EMULATOR_SMOKE_OK` y `EMULATOR_RANKING_OK`.

**Verify**
```bash
# si este paso (o uno posterior) sale mal: procedimiento «Volver atrás» de §9 (regla 6) con NN = 09
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

---

#### Step 10 — Traducir los textos nuevos y contar el cambio en novedades

Tarea `E2-T5` · épica `02-limpieza-y-datos` · etiqueta `step-10-novedades`

**Do**

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

Archivos (los toca este paso; son los `files` de su tarea en `tasks.json`):
- `js/data/changelog.js`
- `js/data/lang-updates.js`
- `js/data/lang-en.js`
- `tests/textos-nuevos.test.cjs`

**Done when**
- [ ] **WHEN** la comprobación carga `js/data/changelog.js` **THE SYSTEM SHALL** encontrar en la primera entrada (una entrada nueva, con fecha `2026-10-20` o posterior y título `PokeKatens: versión no oficial`) líneas en español que contienen `PokeKatens` y `administrador`, cada una con su pareja en inglés.
- [ ] **WHEN** `node --test "tests/*.test.cjs"` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 — `tests/i18n.test.cjs` falla si alguna línea de novedades con fecha `2026-10-18` o posterior no tiene su traducción al francés, italiano, portugués y chino.
- [ ] **WHEN** `node --test "tests/*.test.cjs"` ejecuta `tests/textos-nuevos.test.cjs` **THE SYSTEM SHALL** comprobar que cada uno de los 7 textos nuevos de los pasos 3 y 5 aparece en `dev.html` o `js/ui/login.js` y tiene inglés en `js/data/lang-en.js` y traducción en `fr`, `it`, `pt-BR`, `zh-Hans` y `zh-Hant`.
- [ ] **WHEN** `node tools/build.js --sin-seo` se ejecuta **THE SYSTEM SHALL** terminar con exit 0.

**Verify**
```bash
# si este paso (o uno posterior) sale mal: procedimiento «Volver atrás» de §9 (regla 6) con NN = 10
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

---

#### Step 11 — Crear la app de escritorio y abrirla por primera vez

Tarea `E3-T1` · épica `03-escritorio-y-publicacion` · etiqueta `step-11-escritorio-base`

**Do**

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

Archivos (los toca este paso; son los `files` de su tarea en `tasks.json`):
- `desktop/package.json`
- `desktop/package-lock.json`
- `desktop/main.js`
- `tools/desktop-smoke.cjs`

**Done when**
- [ ] **WHEN** `npm install --prefix desktop` se ejecuta **THE SYSTEM SHALL** terminar con exit 0, instalar `electron` 44.9.2 y `electron-builder` 26.15.3 y escribir `desktop/package-lock.json`.
- [ ] **WHEN** se lee la versión instalada de `desktop/node_modules/electron/package.json` y de `desktop/node_modules/electron-builder/package.json` **THE SYSTEM SHALL** ser `44.9.2` y `26.15.3`.
- [ ] **WHEN** `node tools/desktop-smoke.cjs` se ejecuta **THE SYSTEM SHALL** arrancar `tools/serve.cjs` en un puerto libre, abrir la app con `PK_URL` apuntando a `index.html` y `--smoke`, recibir `PK_SMOKE_OK`, imprimir `DESKTOP_SMOKE_OK online` y terminar con exit 0.
- [ ] **WHEN** `node tools/desktop-smoke.cjs --hang` abre la app contra un servidor que acepta la conexión y nunca contesta **THE SYSTEM SHALL** ver la app salir con código 3 (`PK_SMOKE_TIMEOUT`) a los 30 segundos e imprimir `DESKTOP_SMOKE_OK hang`.
- [ ] **WHEN** se busca en `desktop/main.js` **THE SYSTEM SHALL** encontrar `setWindowOpenHandler`, `contextIsolation: true`, `sandbox: true` y `nodeIntegration: false`.
- [ ] **WHEN** `git check-ignore -q desktop/node_modules/electron/package.json` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 (las dependencias no se suben al repositorio).

**Verify**
```bash
# si este paso (o uno posterior) sale mal: procedimiento «Volver atrás» de §9 (regla 6) con NN = 11
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

---

#### Step 12 — Mostrar la pantalla Sin conexión cuando no carga

Tarea `E3-T2` · épica `03-escritorio-y-publicacion` · etiqueta `step-12-sin-conexion`

**Do**

Si no hay internet (o la web no responde), en vez de una ventana en blanco sale una pantalla clara con un botón para reintentar. Ojo: el juego registra un *service worker* (`sw.js`, desde `js/main.js`); después de la primera carga con conexión, sin internet ese service worker sirve la copia guardada del juego y la carga **no** falla, así que `offline.html` sólo aparece cuando la web nunca se ha cargado en ese perfil. La prueba `--offline` usa un perfil nuevo (`PK_PROFILE`) y prueba justo eso: el primer arranque sin conexión.

1. **Nuevo `desktop/offline.html`**: página autónoma, sin archivos externos.
   - `<!doctype html>`, `<html lang="es">`, `<meta charset="utf-8">`, `<title>PokeKatens · Sin conexión</title>` y esta CSP: `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'">`.
   - Colores del juego, escritos aquí tal cual: fondo `#0a1430`, texto `#ffffff`, título `#ffd84a`, botón con fondo `#ffd84a` y texto `#0a1430`, radio 10 px, letra `system-ui, sans-serif` (contraste del botón ≈ 13:1 y del texto ≈ 18:1, ambos por encima de 4.5:1).
   - Contenido: `<h1>Sin conexión</h1>`, el párrafo `No se ha podido abrir PokeKatens. Comprueba tu conexión a internet y vuelve a intentarlo.` y `<button id="reintentar" type="button">Reintentar</button>`, con borde de foco visible (`outline: 3px solid #ffffff` en `:focus-visible`).
   - Script en línea: lee `url` de `location.search` (`new URLSearchParams(location.search).get('url')`); al pulsar el botón, sólo si esa URL empieza por `http://` o `https://`, hace `location.href = url`.
2. **`desktop/main.js`**:
   - Variable `fallo = false`. `webContents.on('did-fail-load', (e, codigo, desc, url, esPrincipal) => { … })`: si no es el marco principal o `codigo === -3` (carga cancelada), no hace nada; si no, `fallo = true` y `win.loadFile(path.join(__dirname, 'offline.html'), { query: { url: URL_JUEGO } })`.
   - El `did-finish-load` de `SMOKE` pasa a: si la URL actual empieza por `file:` → `fin(0, 'PK_SMOKE_OFFLINE')`; si no y `fallo` es `false` → `fin(0, 'PK_SMOKE_OK')`; si `fallo` es `true` y la URL no es `file:`, espera (llegará la de `offline.html`).

Archivos (los toca este paso; son los `files` de su tarea en `tasks.json`):
- `desktop/offline.html`
- `desktop/main.js`

**Done when**
- [ ] **WHEN** `node tools/desktop-smoke.cjs --offline` se ejecuta **THE SYSTEM SHALL** abrir la app con `PK_URL=http://127.0.0.1:1/`, ver fallar la carga del marco principal, mostrar `offline.html`, recibir `PK_SMOKE_OFFLINE`, imprimir `DESKTOP_SMOKE_OK offline` y terminar con exit 0.
- [ ] **WHEN** `node tools/desktop-smoke.cjs` se ejecuta **THE SYSTEM SHALL** seguir imprimiendo `DESKTOP_SMOKE_OK online` (la página del juego carga y `offline.html` no aparece).
- [ ] **WHEN** se busca en `desktop/offline.html` **THE SYSTEM SHALL** encontrar `<html lang="es">`, el texto `Sin conexión` y un botón `Reintentar`, y `desktop/main.js` SHALL contener `did-fail-load`.

**Verify**
```bash
# si este paso (o uno posterior) sale mal: procedimiento «Volver atrás» de §9 (regla 6) con NN = 12
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

---

#### Step 13 — Generar el instalador PokeKatens-Setup-1.0.0.exe

Tarea `E3-T3` · épica `03-escritorio-y-publicacion` · etiqueta `step-13-instalador`

**Do**

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

Archivos (los toca este paso; son los `files` de su tarea en `tasks.json`):
- `desktop/build/icon.png`
- `desktop/legal/LICENSE`
- `desktop/legal/LICENSE-NONCOMMERCIAL.md`

**Done when**
- [ ] **WHEN** `cmp` compara `desktop/build/icon.png` con `assets/icons/icon-512.png` y los dos archivos de `desktop/legal/` con `LICENSE` y `LICENSE-NONCOMMERCIAL.md` **THE SYSTEM SHALL** decir que son idénticos (exit 0).
- [ ] **WHEN** `npm --prefix desktop run dist` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 y crear `desktop/dist/PokeKatens-Setup-1.0.0.exe` no vacío.
- [ ] **WHEN** `node tools/desktop-smoke.cjs --exe desktop/dist/win-unpacked/PokeKatens.exe` se ejecuta **THE SYSTEM SHALL** imprimir `DESKTOP_SMOKE_OK online` — el programa empaquetado encuentra su `main.js` y carga el juego.
- [ ] **WHEN** `test -f desktop/dist/win-unpacked/resources/legal/LICENSE-NONCOMMERCIAL.md` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 (la licencia viaja con el programa).
- [ ] **WHEN** `git check-ignore -q desktop/dist/PokeKatens-Setup-1.0.0.exe` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 (el instalador nunca se sube al repositorio).
- [ ] **WHEN** `node tools/desktop-smoke.cjs --exe desktop/dist/win-unpacked/PokeKatens.exe --default` se ejecuta **THE SYSTEM SHALL** arrancar `tools/serve.cjs` en el puerto 8123, abrir el programa empaquetado sin `PK_URL` (usa el `pokekatens.url` que lleva dentro, `http://127.0.0.1:8123/`) e imprimir `DESKTOP_SMOKE_OK default`.

**Verify**
```bash
# si este paso (o uno posterior) sale mal: procedimiento «Volver atrás» de §9 (regla 6) con NN = 13
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

---

#### Step 14 — Poner las normas de PokeKatens y la guía para publicar

Tarea `E3-T4` · épica `03-escritorio-y-publicacion` · etiqueta `step-14-normas-y-guia`

**Do**

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

Archivos (los toca este paso; son los `files` de su tarea en `tasks.json`):
- `CLAUDE.md`
- `docs/GUIA-PUBLICAR-POKEKATENS.md`
- `docs/PUBLICAR.md`

**Done when**
- [ ] **WHEN** `diff -q CLAUDE.md blueprints/pokekatens/workspace/CLAUDE.md` y `diff -q AGENTS.md blueprints/pokekatens/workspace/AGENTS.md` se ejecutan **THE SYSTEM SHALL** terminar ambos con exit 0.
- [ ] **WHEN** `wc -l < CLAUDE.md` se ejecuta **THE SYSTEM SHALL** dar un número menor que 200.
- [ ] **WHEN** `grep -nE "pokesurvivor-free|export_data.js && python" CLAUDE.md` se ejecuta **THE SYSTEM SHALL** no encontrar nada (exit 1).
- [ ] **WHEN** se busca en `docs/GUIA-PUBLICAR-POKEKATENS.md` **THE SYSTEM SHALL** encontrar cada uno de `git remote rename origin upstream`, `firebase-tools@15.34.0 deploy --only firestore:rules,firestore:indexes,database`, `Identity Platform`, `Ejecutar de todas formas`, `npm --prefix desktop run dist` y `node tools/build.js --sin-seo`.
- [ ] **WHEN** se leen las 5 primeras líneas de `docs/PUBLICAR.md` **THE SYSTEM SHALL** encontrar `GUIA-PUBLICAR-POKEKATENS.md`.

**Verify**
```bash
# si este paso (o uno posterior) sale mal: procedimiento «Volver atrás» de §9 (regla 6) con NN = 14
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

---

#### Step 15 — Construir la versión final y pasar la comprobación global

Tarea `E3-T5` · épica `03-escritorio-y-publicacion` · etiqueta `step-15-version-final`

**Do**

La versión que se publicará. El único código nuevo es la pequeña herramienta `tools/check-tags.cjs`; el resto es construir y pasar **la comprobación global** (la misma de §20.1) sobre el árbol que dejan los pasos 1-14.

1. **Nuevo `tools/check-tags.cjs`** (CommonJS, sólo módulos de Node). Lleva escrita la lista de las 15 etiquetas de paso del mapa de §9 (`step-01-config-fork`, `step-02-servidor-local`, `step-03-sin-google`, `step-04-sin-turn`, `step-05-identidad`, `step-06-sin-seo`, `step-07-sin-donaciones`, `step-08-emulador`, `step-09-reglas-admin`, `step-10-novedades`, `step-11-escritorio-base`, `step-12-sin-conexion`, `step-13-instalador`, `step-14-normas-y-guia`, `step-15-version-final`) y, para cada una, ejecuta `execFileSync('git', ['merge-base', '--is-ancestor', etiqueta, 'HEAD'])`. Si alguna falla (no existe o no es antepasada de `HEAD`) escribe `Falta la etiqueta <etiqueta> en la historia de HEAD` y sigue con las demás; al final sale con 0 sólo si las 15 pasan (escribe `ETIQUETAS_OK 15`), y con 1 si no. `step-00-preparacion` no está en la lista. Lo ejecuta el Checkpoint de este paso, después de `git tag -f step-15-version-final`.
2. `node tools/build.js --sin-seo` (regenera `index.html`, `js/app.min.js`, `version.json` y `js/lang/*.js`: archivos generados, no se editan a mano).
3. Ejecuta todas las líneas del `Verify` en orden. Si alguna falla, el fallo es de un paso anterior NN: aplica el procedimiento «Volver atrás» de §9 (regla 6) con ese NN — `git reset --hard` a la etiqueta del paso NN-1, `git tag -d` de cada etiqueta desde la del paso NN hasta la última creada, tareas NN y siguientes en `pending` en `tasks.json` — y rehaz desde el paso NN hasta este. No cambies ninguna línea del `Verify`.

No se hace `git push`: subir a GitHub es parte de la lista de lanzamiento (§20.1), que hacen los dueños.

Archivos (los toca este paso; son los `files` de su tarea en `tasks.json`):
- `index.html`
- `js/app.min.js`
- `version.json`
- `tools/check-tags.cjs`

**Done when**
- [ ] **WHEN** `node tools/build.js --sin-seo` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 y `version.json` SHALL tener un `v` de 10 caracteres hexadecimales y un `at` que es una fecha válida.
- [ ] **WHEN** `grep -rlE "GoogleAuthProvider|ice\.pokesurvivor\.com|apis\.google\.com|rshaa5gKD3fXw6lE4PPXITbowaG2|pokesurvivor-free" dev.html index.html js/app.min.js js/core js/ui js/net` se ejecuta **THE SYSTEM SHALL** no encontrar nada (exit 1).
- [ ] **WHEN** `node --test "tests/*.test.cjs"` y `node tools/export_data.js` se ejecutan **THE SYSTEM SHALL** terminar ambos con exit 0.
- [ ] **WHEN** la prueba del emulador se ejecuta con los dos scripts **THE SYSTEM SHALL** imprimir `EMULATOR_SMOKE_OK` y `EMULATOR_RANKING_OK`.
- [ ] **WHEN** `node tools/desktop-smoke.cjs` y `node tools/desktop-smoke.cjs --offline` se ejecutan **THE SYSTEM SHALL** imprimir `DESKTOP_SMOKE_OK online` y `DESKTOP_SMOKE_OK offline`, y `desktop/dist/PokeKatens-Setup-1.0.0.exe` SHALL existir y no estar vacío.
- [ ] **WHEN** `git diff --quiet step-00-preparacion -- js/core/updater.js database.rules.json` se ejecuta **THE SYSTEM SHALL** terminar con exit 0 (el actualizador y las reglas del cooperativo no han cambiado) y `tools/build.js` SHALL seguir escribiendo `version.json`.

**Verify**
```bash
# si este paso (o uno posterior) sale mal: procedimiento «Volver atrás» de §9 (regla 6) con NN = 15
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

---


### 9.1 Parity and cutover

Este cambio **sustituye un proveedor** (el Firebase de JPTER78 por el de los amigos) y quita servicios (TURN,
dominio). No se mueven datos: lo que hay que demostrar es que todo lo que el juego hacía con el proveedor
antiguo lo sigue haciendo con el nuevo.

#### Parity set

| # | Behavior held constant | How parity is proved | Tolerance |
|---|---|---|---|
| 1 | Crear cuenta y entrar con nombre + contraseña | `tests/sin-google.test.cjs` (siguen `createUserWithEmailAndPassword` / `signInWithEmailAndPassword`) + `tests/emulator/smoke.cjs` (alta de dos usuarios en el emulador de Auth) | exacto |
| 2 | Guardar la partida en la nube, sólo su dueño la lee | `tests/emulator/smoke.cjs`: escritura 200, lectura ajena 403, lectura propia 200 | exacto |
| 3 | Tope de 20 s entre escrituras de la partida | `tests/emulator/smoke.cjs`: segunda escritura inmediata 403 | exacto |
| 4 | Ranking: marcas imposibles rechazadas, válidas aceptadas | `tests/emulator/ranking.cjs`: `t` 2701 → 403, `t` 600 → 200 | exacto |
| 5 | Moderación cerrada a quien no es administrador | `tests/emulator/ranking.cjs`: `reports/nada` → 403 | exacto |
| 6 | Cooperativo: señalización por RTDB y conexión directa STUN | `tests/net.test.cjs` (pruebas de codec y negociación sin cambios + STUN) y `database.rules.json` sin cambios | exacto |
| 7 | Actualización automática de todos los jugadores | `js/core/updater.js` sin cambios y `tools/build.js` escribe `version.json` (paso 15) | exacto |
| 8 | 7 idiomas | `tests/i18n.test.cjs` | exacto |
| 9 | Modo invitado y modo local | `tests/sin-google.test.cjs` (`btn-guest`, `localReason = 'config'`) | exacto |
| 10 | Licencias y *Required Notice* | `git diff --quiet HEAD -- LICENSE LICENSE-NONCOMMERCIAL.md` y `grep` de la línea en `README.md` | exacto |

**Shadow period:** NOT APPLICABLE como periodo en paralelo — los dos proveedores nunca sirven al mismo jugador:
el de JPTER78 no se usa en ningún momento de esta copia. La paridad se prueba contra los emuladores, que
ejecutan las reglas reales del repositorio; criterio: las 10 filas en verde en el paso 15.

#### Cutover

Coexistencia: durante toda la construcción el repositorio lleva la config del **emulador** (`demo-pokekatens`),
así que ningún paso habla con un servidor real. El remoto `origin` (JPTER78) sigue configurado pero nadie sube
ahí (`git push` está prohibido en §19.3). El cambio al proyecto real lo hacen los dueños en la lista de
lanzamiento (§20.1); cada fase tiene su comprobación por comando:

| Phase | What changes | Who is affected | Reversible by | Verify |
|---|---|---|---|---|
| 0 · construcción | config del emulador; todo probado en local | nadie | `git reset --hard` a cualquier etiqueta `step-*` | el bloque automático de §20.1 |
| 1 · config real | `js/core/firebase-config.js` sin `emulator`, `.firebaserc` y `G.FORK` con vuestros datos | nadie todavía (sin publicar) | `git checkout step-15-version-final -- js/core/firebase-config.js .firebaserc js/core/fork-config.js` | `node --test "tests/*.test.cjs"` (`tests/fork.test.cjs` comprueba que no es `pokesurvivor-free`) |
| 2 · reglas en el proyecto | reglas e índices desplegados | nadie todavía | volver a desplegar la versión anterior de las reglas | `npx --yes firebase-tools@15.34.0 deploy --only firestore:rules,firestore:indexes,database` sale con 0 |
| 3 · web publicada | `git push` a vuestro repo; GitHub Pages activo | quien abra la web | `git revert` + `push`, o desactivar Pages | `test "$(curl -s -o /dev/null -w '%{http_code}' https://<usuario>.github.io/pokekatens/version.json)" = 200` |
| 4 · `.exe` repartido | `pokekatens.url` apunta a Pages; instalador nuevo | los amigos | no repartir más el `.exe`; arreglar la web (el `.exe` siempre carga la web) | con `pokekatens.url` ya cambiado, sin servidor local ni `--url`: `node tools/desktop-smoke.cjs --exe desktop/dist/win-unpacked/PokeKatens.exe --default` imprime `DESKTOP_SMOKE_OK default` |
| 5 · decommission | `git remote rename origin upstream` | nadie | `git remote rename upstream origin` | `git remote get-url upstream` imprime la URL de JPTER78 |

**The kill switch:** poner `G.FIREBASE_CONFIG = null;` en `js/core/firebase-config.js`, construir y hacer
`push` → en ≤ 6 minutos todos los jugadores pasan a modo local (nada se escribe en la nube) mediante el
actualizador. No es instantáneo: tarda lo que tarda Pages en publicar más el ciclo de 5 min del actualizador.

#### Abort criteria

- [ ] WHEN crear la primera cuenta en la web publicada devuelve `auth/invalid-email` (el dominio interno `.invalid` rechazado por el proyecto real) THE SYSTEM SHALL parar el lanzamiento antes de que nadie más cree cuenta, cambiar `NAME_DOMAIN` en `js/core/db.js` a `jugadores.pokekatens.example` y repetir la fase 3.
- [ ] WHEN el uso diario de Firestore en Firebase → Uso pasa del 80 % del cupo gratuito de lecturas o escrituras THE SYSTEM SHALL activar el kill switch (modo local) hasta revisar qué escribe de más.
- [ ] WHEN `node --test "tests/*.test.cjs"` o la prueba de datos fallan con la config real THE SYSTEM SHALL no hacer `push` y volver la config a la de la etiqueta `step-15-version-final`.

Quién vigila: el dueño que hace el lanzamiento, desde la consola de Firebase, la primera semana.

#### Data migration

NOT APPLICABLE — no data migration: el proyecto nuevo empieza vacío y las cuentas de pokesurvivor.com no se
traen (no-objetivo de §1).

#### Decommission

Después del lanzamiento y cuando la web publicada lleve una semana funcionando: `git remote rename origin upstream`
(el repositorio de JPTER78 queda como «upstream», sólo para leer novedades suyas si queréis). Está en la lista
de lanzamiento de §20.1, nunca en §9. No hay datos ni servidores antiguos que borrar: nunca se usaron.

---

## 10. Environment Setup

### Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 20 o más (en este PC: 24.21.0) | `node --version` |
| npm | el que trae Node (en este PC: 11.19.0) | `npm --version` |
| Git + Git Bash | 2.55 en este PC | `git --version` |
| Java (Temurin JDK) | 21 o más — **instalado antes de `/architect-next`**: el Bootstrap se para sin él («verificar antes de instalar»: la exigencia de Java 21 de firebase-tools no está comprobada en el registro) | Bootstrap §10 (sección 1) · `node tools/emu.cjs --check-java` desde el paso 8 |
| Internet | la primera vez de: `npx terser`/`javascript-obfuscator` (paso 1), `firebase-tools` y sus emuladores (paso 8), Electron (paso 11), NSIS de electron-builder (paso 13) | — |
| Modo de programador de Windows | activado **antes de `/architect-next`**: el Bootstrap se para sin él (lo necesita el paso 13: electron-builder descomprime herramientas con enlaces simbólicos, que sin este modo fallan) | Bootstrap §10 (sección 1), con `reg query` |

Lo hace una persona, una vez, **antes** de lanzar la construcción.

1. Modo de programador: Configuración → Sistema → Para programadores → **Modo de programador** → activado.
2. Java 21 (pide permiso de administrador):

```bash
winget install --id EclipseAdoptium.Temurin.21.JDK -e --silent --accept-package-agreements --accept-source-agreements
```

Después, cerrar y abrir Git Bash. Si `java -version` sigue diciendo 1.8, no pasa nada: el Bootstrap y
`tools/emu.cjs` buscan en el mismo orden `%JAVA_HOME%\bin`, `C:\Program Files\Eclipse Adoptium\jdk-2*\bin` y
el `PATH`, y valen con el primero que sea 21 o más.

### Accounts to create first

Ninguna para la construcción: todo funciona con emuladores y en local. Para el lanzamiento (§20.1): una cuenta
de GitHub (https://github.com/signup) y una cuenta de Google para la consola de Firebase
(https://console.firebase.google.com). La guía del paso 14 lo explica.

### Environment variables

Este proyecto **no tiene archivo `.env`**: la configuración de Firebase es pública por diseño y va en
`js/core/firebase-config.js` (lo que protege los datos son las reglas). Las únicas variables son de las
herramientas de prueba:

| Variable | Purpose | Where to get it | Required by step | Secret? |
|---|---|---|---|---|
| `PK_URL` | URL que abre `desktop/main.js` (si falta, `pokekatens.url` de `desktop/package.json`) | La pone `tools/desktop-smoke.cjs` (servidor local o `--url`; en `--default` la quita a propósito) | 11 (opcional siempre: tiene valor por defecto) | no |
| `PK_SMOKE_OUT` | Archivo donde la app escribe su marca de prueba | La pone `tools/desktop-smoke.cjs` (archivo en la carpeta temporal) | 11 (opcional) | no |
| `PK_PROFILE` | Carpeta de perfil de la app (caché, service worker, sesión) | La pone `tools/desktop-smoke.cjs` (carpeta temporal nueva en cada prueba) | 11 (opcional: sin ella, el perfil normal) | no |
| `JAVA_HOME` | Carpeta de Java que usan los emuladores | La pone `tools/emu.cjs` para el proceso que lanza; puede venir del sistema | 8 (opcional: `emu.cjs` la busca) | no |
| `PATH` | `tools/emu.cjs` le añade delante la carpeta `bin` de Java 21 | Del sistema | 8 | no |
| `FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST`, `FIREBASE_DATABASE_EMULATOR_HOST` | Las pone `firebase emulators:exec` para el script que ejecuta | Automático (`127.0.0.1:8080`, `127.0.0.1:9099`, `127.0.0.1:9000`) | 8 | no — y las pruebas no las leen: usan las mismas direcciones fijas de `firebase.json` |

Ninguna variable es «requerida» en el sentido de validación al arrancar: no existe validación de entorno, así
que ningún paso puede romper el `Verify` de otro por una variable. Cargador de cada herramienta que lee
variables: §19.6, tabla de archivos.

### Files that must be committed

| File | Why it is committed | Ignore-file exception line |
|---|---|---|
| `.gitignore` | gobierna qué se sube | — no lo cubre ningún patrón |
| `AGENTS.md`, `.claude/settings.json`, `.claude/skills/**`, `.claude/rules/**` | configuración de los agentes | — no lo cubre ningún patrón (`.gitignore` no tiene `.claude`) |
| `blueprints/pokekatens/**` | el plan y `tasks.json` (estado de la construcción) | — no lo cubre ningún patrón |
| `js/core/fork-config.js`, `tools/serve.cjs`, `tools/emu.cjs`, `tools/desktop-smoke.cjs`, `tools/check-tags.cjs` | código y herramientas | — no lo cubre ningún patrón (`tools/cache/` es otra carpeta) |
| `tests/*.test.cjs`, `tests/emulator/*.cjs` | pruebas | — no lo cubre ningún patrón |
| `desktop/package.json`, `desktop/package-lock.json`, `desktop/main.js`, `desktop/offline.html`, `desktop/build/icon.png`, `desktop/legal/*` | la app | — no lo cubre ningún patrón (`desktop.ini` sólo cubre archivos con ese nombre) |
| `docs/GUIA-PUBLICAR-POKEKATENS.md` | guía | — no lo cubre ningún patrón (sólo `docs/CONTACTOS_CREADORES.md`) |

Lo que **no** se sube: `desktop/node_modules/` (patrón `node_modules/` existente), `desktop/dist/` (línea que
añade el Bootstrap), los registros de los emuladores (`*.log`) y `tools/cache/`.

### Bootstrap

Se ejecuta una vez antes del paso 1, desde la raíz del repositorio, en Git Bash. Se puede repetir sin
romper nada (§20.1 lo comprueba).

```bash
set -e
# Orden (importa): comprobar el sitio y los requisitos (se para aquí, sin haber cambiado nada, si falta
# Java 21 o el Modo de programador) → .gitignore con su línea nueva →
# repositorio e identidad → copia de workspace/ → commit de preparación.
# Cada línea con guarda termina con exit 0 si lo que guarda ya estaba hecho.

# 0. En la raíz del repositorio, con el bundle dentro
test -f dev.html
test -f blueprints/pokekatens/blueprint.md

# 1. Herramientas
node -e "process.exit(+process.versions.node.split('.')[0] >= 20 ? 0 : 1)"   # Node 20 o más
git --version
npm --version
#    Java 21 o más, buscado en el mismo orden que tools/emu.cjs: JAVA_HOME/bin, Eclipse Adoptium jdk-2*, PATH
java_ok=0
cands=()
if [ -n "${JAVA_HOME:-}" ]; then cands+=("$(cygpath -u "$JAVA_HOME")/bin/java.exe"); fi
for d in "/c/Program Files/Eclipse Adoptium"/jdk-2*/bin/java.exe; do cands+=("$d"); done
if command -v java >/dev/null 2>&1; then cands+=("$(command -v java)"); fi
for j in "${cands[@]}"; do
  if [ -x "$j" ]; then
    m=$("$j" -version 2>&1 | sed -n 's/.*version "\([0-9]*\).*/\1/p' | head -n 1)
    if [ "${m:-0}" -ge 21 ]; then java_ok=1; echo "Java $m: $j"; break; fi
  fi
done
if [ "$java_ok" -eq 1 ]; then :; else
  echo "Falta Java 21. Instálalo una vez (pide permiso de administrador) con:"
  echo "  winget install --id EclipseAdoptium.Temurin.21.JDK -e --silent --accept-package-agreements --accept-source-agreements"
  echo "Después cierra y abre Git Bash y repite este bloque."
  exit 1
fi
#    Modo de programador de Windows (lo necesita electron-builder en el paso 13).
#    MSYS2_ARG_CONV_EXCL='*' evita que Git Bash convierta la clave y /v en rutas de archivo.
if MSYS2_ARG_CONV_EXCL='*' reg query 'HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock' /v AllowDevelopmentWithoutDevLicense 2>/dev/null | grep -q '0x1'; then
  echo "Modo de programador: activado"
else
  echo "Falta el Modo de programador de Windows. Actívalo en:"
  echo "  Configuración → Sistema → Para programadores → Modo de programador"
  echo "y repite este bloque."
  exit 1
fi

# 2. .gitignore ANTES de cualquier commit: el instalador nunca se sube
#    (grep sin -x: con core.autocrlf=true la línea puede acabar en \r)
grep -qF 'desktop/dist/' .gitignore || printf '\n# Instalador de escritorio (lo genera: npm --prefix desktop run dist)\ndesktop/dist/\n' >> .gitignore

# 3. Repositorio (ya existe: no hace nada) e identidad de los commits (sólo si falta; los dueños pueden poner la suya)
git rev-parse --git-dir >/dev/null 2>&1 || git init -b main
git config user.name >/dev/null || git config user.name "PokeKatens"
git config user.email >/dev/null || git config user.email "pokekatens@users.noreply.github.com"

# 4. (Sin uso: el cambio «Trucos» que estaba sin guardar se descartó el 2026-10-21; no hay primer commit aparte.)

# 5. Copia de workspace/ SIN pisar nada que ya exista: el CLAUDE.md de la raíz no se pisa (lo sustituye el
#    paso 14 a propósito) y en una segunda ejecución no se revierte ningún archivo. Git Bash no trae rsync y
#    no se usa cp -n (su código de salida al saltar archivos cambia entre plataformas): este bucle sale con 0.
W=blueprints/pokekatens/workspace
(cd "$W" && find . -type f) | while IFS= read -r f; do
  if [ -e "$f" ]; then :; else mkdir -p "$(dirname "$f")" && cp "$W/$f" "$f"; fi
done

# 6. Commit de preparación (bundle, AGENTS.md, .claude/ y .gitignore) y su etiqueta step-00-preparacion
#    (punto de vuelta del paso 1 en «Volver atrás», §9 regla 6). Sólo si el paso 1 aún no está etiquetado.
if git rev-parse -q --verify refs/tags/step-01-config-fork >/dev/null; then echo "La construcción ya empezó: no hay commit de preparación"; else
  git add -A
  git diff --cached --quiet || git commit -m "Preparar la construcción de PokeKatens (plan, AGENTS.md, .claude y .gitignore)"
  git tag -f step-00-preparacion   # -f: en una segunda ejecución vuelve a marcar el mismo commit
fi
git log --oneline -3
```

Archivos que la copia nunca sobrescribe: todos los que ya existan en la raíz — en concreto `CLAUDE.md` (hasta
el paso 14) y, en una segunda ejecución, `AGENTS.md` y todo `.claude/`. No hay manifiesto de paquetes en la
raíz y el Bootstrap no instala nada con npm (las dependencias de `desktop/` las instala el paso 11).

---

## 11. Dependencies

Procedencia: informe de `stack-researcher` de esta sesión (2026-10-20) para los paquetes nuevos; el propio
repositorio para lo que ya fijaba. Ninguna versión de aquí sale de memoria. Nada se instala en la raíz.

### Runtime

| Package | Version | Source (registry URL or track file) | Checked | Installed by | Purpose |
|---|---|---|---|---|---|
| Firebase JS SDK (compat: app, auth, firestore, database) | 13.0.0 | https://www.gstatic.com/firebasejs/13.0.0/ (sigue servido; informe stack-researcher) | 2026-10-20 | Nadie lo instala: `js/core/db.js` lo descarga en tiempo de ejecución (ya existe, `SDK` en la línea 32) | Cuentas, Firestore y RTDB en el navegador y en el `.exe` |

### Development

| Package | Version | Source (registry URL or track file) | Checked | Installed by | Purpose |
|---|---|---|---|---|---|
| electron | 44.9.2 | https://registry.npmjs.org/-/package/electron/dist-tags (`latest`) | 2026-10-20 | paso 11 — `npm install --prefix desktop` (devDependencies de `desktop/package.json`) | La ventana del `.exe`. **Versión recién salida (publicada el 2026-10-20)**: fijada exacta. Si falla, plan B documentado en §20.2: el parche 44.x anterior (verificar antes de cambiar). |
| electron-builder | 26.15.3 | https://registry.npmjs.org/-/package/electron-builder/dist-tags (`latest`; existe además una etiqueta v26 con 26.18.0) | 2026-10-20 | paso 11 — `npm install --prefix desktop` | Crea el instalador NSIS. **Verificar antes de instalar:** la compatibilidad con Electron 44 no está comprobada explícitamente, ni la clave `directories.output` en sus tipos. |
| firebase-tools | 15.34.0 | https://registry.npmjs.org/-/package/firebase-tools/dist-tags (`latest`, publicada el 2026-10-15; `engines.node >=20`) | 2026-10-20 | paso 8 — `npx --yes firebase-tools@15.34.0` dentro de `tools/emu.cjs` (y en la lista de lanzamiento para `login`/`deploy`) | Emuladores de Firebase y despliegue de reglas |
| terser | 5 (rango `@5`, tal cual en el repo) | `tools/build.js` del repositorio — no verificado en el registro en esta sesión | 2026-10-20 (leído del repo) | `tools/build.js` (`npx --yes terser@5`), primera vez en el paso 1 | Minifica `js/app.min.js` (ya existía) |
| javascript-obfuscator | 4.1.1 | `tools/build.js` del repositorio — no verificado en el registro en esta sesión | 2026-10-20 (leído del repo) | `tools/build.js` (`npx --yes javascript-obfuscator@4.1.1`), primera vez en el paso 1 | Ofusca `js/app.min.js` (ya existía) |
| Temurin JDK | 21 | `winget install --id EclipseAdoptium.Temurin.21.JDK` — **UNVERIFIED — verificar antes de instalar** (la exigencia de Java 21 de firebase-tools no se comprobó en el registro) | 2026-10-20 | §10 Requisitos (lo instala una persona antes del paso 8) | Ejecuta los emuladores de Firestore y Database |
| Node.js | 20 o más (probado 24.21.0) | este PC (`node --version`); `firebase-tools` pide `>=20` | 2026-10-20 | §10 Requisitos (ya instalado) | Herramientas, pruebas, npm |

### Deliberately not used

| Rejected | Instead | Why |
|---|---|---|
| Tauri | Electron | Pide Rust y compilar; usa el WebView2 de cada PC |
| Google Sign-In (`GoogleAuthProvider`) | Nombre + contraseña | Configurar OAuth sin ganar nada para un grupo pequeño |
| Servidor TURN (coturn, Cloudflare Realtime) | Sólo STUN | Cuesta dinero |
| Identity Platform | Firebase Auth normal | Cobra por usuario |
| Un `package.json` en la raíz (Vitest, Playwright o ESLint) | `node:test` sin dependencias | La raíz nunca tuvo dependencias; no hacen falta |
| `@firebase/rules-unit-testing` | REST de los emuladores con `fetch` | Sin dependencias; prueba las mismas reglas |
| Firma de código (certificado OV/EV, Azure Trusted Signing) | Instalador sin firmar + instrucciones de SmartScreen | Cuesta dinero |
| electron-updater | El actualizador web (`updater.js`) | El `.exe` carga la web: se actualiza solo |

---

## 12. Deployment Strategy

### Hosting

GitHub Pages en el repositorio **público** `pokekatens` de los dueños, rama `main`, carpeta raíz (el repo ya
tiene `.nojekyll`). No hay paso de compilación en GitHub: `index.html`, `js/app.min.js` y `version.json` se
generan en el PC con `node tools/build.js --sin-seo` y se suben con el commit. URL:
`https://<usuario>.github.io/pokekatens/`. El `.exe` se reparte a mano (Google Drive o Discord).

### Environments

| Environment | Branch | URL | Database | Third-party mode |
|---|---|---|---|---|
| Local | — | `http://127.0.0.1:8123/` (`node tools/serve.cjs`) | emuladores de Firebase (`demo-pokekatens`) | sin servicios externos (salvo el SDK de gstatic) |
| Preview | NOT APPLICABLE — sin entornos de prueba en línea (gratis y simple) | — | — | — |
| Production | `main` | `https://<usuario>.github.io/pokekatens/` | el proyecto de Firebase propio (Spark) | real |

### CI/CD

No hay CI (GitHub Actions): los dueños pasan el gate en su PC antes de cada `push` (skill `publicar-version`),
y el bloque automático de §20.1 es la comprobación completa. Decisión 11 de §20.3.

### Release and rollback

Publicar: gate → `node tools/build.js --sin-seo` → commit → `git push`. Pages publica en 1-2 min y el
actualizador recarga a los jugadores fuera de partida en ≤ 5 min. Volver atrás: `git revert <commit>` →
construir → `push` (mismos tiempos). Reglas de Firebase: se despliegan aparte y **antes** del código que las
necesite. El `.exe` sólo se rehace si cambia `desktop/`.

### Domain, DNS, TLS

NOT APPLICABLE — sin dominio propio (se borra `CNAME`); GitHub Pages da HTTPS en `github.io`.

---

## 13. Testing Strategy

| Layer | Framework | What it covers | Where | Runs |
|---|---|---|---|---|
| Unit | `node:test` | Config del fork, ausencia de Google, codec y conexión STUN, idiomas y novedades | `tests/*.test.cjs` | Cada paso y cada publicación |
| Integration | `node:test` | Servidor local de verdad (arranca `tools/serve.cjs`) | `tests/serve.test.cjs` | Cada paso |
| Integration | scripts Node + emuladores de Firebase | Reglas reales: partidas, ranking, moderación | `tests/emulator/*.cjs` vía `tools/emu.cjs` | Pasos 8, 9, 15 y cuando se toquen reglas o `db.js` |
| Unit | `node:test` | Los 7 textos nuevos están en el juego y traducidos a los 7 idiomas | `tests/textos-nuevos.test.cjs` | Desde el paso 10 |
| E2E | arnés propio + Electron | La app abre el juego, el primer arranque sin conexión, el tiempo límite, el programa empaquetado con y sin `PK_URL` | `tools/desktop-smoke.cjs` | Pasos 11, 12, 13, 15 y cuando se toque `desktop/` |
| Smoke | `node tools/export_data.js` | Todos los datos del juego cargan | — | Cada paso |

### Critical flows to cover E2E

1. La app de escritorio carga el juego servido (`DESKTOP_SMOKE_OK online`), también empaquetada (`--exe`) y con su URL de fábrica, sin `PK_URL` (`--exe … --default` → `DESKTOP_SMOKE_OK default`).
2. El primer arranque sin conexión muestra `offline.html` (`DESKTOP_SMOKE_OK offline`). Lo que **no** prueba: un arranque sin conexión después de haber jugado, porque ahí el service worker sirve la copia guardada y `offline.html` no sale (comportamiento esperado, explicado en la guía).
3. Cuentas y partidas contra las reglas reales (`EMULATOR_SMOKE_OK`, `EMULATOR_RANKING_OK`).

### Test data

Cada `emulators:exec` arranca los emuladores vacíos y los borra al acabar: nada se comparte entre ejecuciones.
`smoke.cjs` usa `uno@`/`dos@` y `ranking.cjs` `tres@jugadores.pokekatens.invalid` para poder ir juntos en la
misma sesión. El «servicio» que necesitan (los emuladores) lo provisionan `firebase.json` (ya en el repo) y
`tools/emu.cjs` (paso 8); detalle en §19.6.

### What is deliberately not tested

- La partida en sí (combate, gacha, Pokémon): este cambio no la toca.
- El cooperativo real entre dos PC (WebRTC necesita dos máquinas y redes reales): lista de lanzamiento.
- El proyecto de Firebase real y GitHub Pages: lista de lanzamiento (§20.1), con sus comandos.
- El instalador ejecutado en otro PC limpio y el aviso de SmartScreen: lista de lanzamiento.

---

## 14. Security & Secrets

| Concern | Control | Implemented in |
|---|---|---|
| Secret storage | No hay secretos en el repo: la config web de Firebase es pública por diseño; los tokens de `firebase login` quedan en el perfil del usuario | `js/core/firebase-config.js`; §19.3 niega leer `.env` |
| Secret rotation | NOT APPLICABLE — sin secretos propios | — |
| Input validation | Reglas de Firestore/RTDB en cada petición | `firestore.rules`, `database.rules.json` |
| Output encoding / XSS | CSP `script-src 'self' file: https://www.gstatic.com https://*.firebaseio.com https://*.firebasedatabase.app; object-src 'none'; base-uri 'self'` (sin `apis.google.com`) | `dev.html` (paso 3) |
| SQL injection | NOT APPLICABLE — sin SQL | — |
| AuthN / AuthZ | Firebase Auth + reglas (§8) | `firestore.rules` |
| CSRF | NOT APPLICABLE — sin cookies ni servidor propio | — |
| Rate limiting / abuse | Topes de escritura de las reglas (`every(resource.data.updatedAt, 20)` y `validEntry`) | `firestore.rules` |
| Webhook verification | NOT APPLICABLE — sin webhooks | — |
| Dependency audit | `npm audit --prefix desktop` antes de rehacer el `.exe` | `desktop/` |
| Security headers (escritorio) | `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, sin `preload`; `setWindowOpenHandler` → navegador del sistema + `deny`; navegación a otro origen → navegador | `desktop/main.js` (paso 11) |
| Fugas de sesión | Se quita la llamada que mandaba el token de Firebase de cada jugador a `ice.pokesurvivor.com` | `js/net/net.js` (paso 4) |
| PII handling | Sólo nombre de usuario y partida; el correo es inventado y no existe; borrar cuenta borra partida y cuenta | `js/core/db.js` |
| Logging hygiene | Las pruebas sólo imprimen códigos de respuesta, nunca tokens ni contraseñas | `tests/emulator/*.cjs` |
| Clave de la API | Restringirla por referente a `<usuario>.github.io` (opcional) | lista de lanzamiento |

**Hard rules**
- Nada secreto en el repo ni en la salida de las pruebas.
- La seguridad la deciden las reglas; ocultar botones no es un permiso.
- La ventana del `.exe` no expone nada nativo a la página.

No se tratan datos regulados (ni de salud ni de pagos ni de menores identificados): sólo un apodo y la partida de cada jugador.

---

## 15. Accessibility

**Target: WCAG 2.2 Level AA** para lo que este cambio añade; el resto del juego no se toca.

### Baseline requirements

| Requirement | Rule |
|---|---|
| Semantic HTML | `offline.html`: `lang="es"`, un `h1`, un párrafo, un `<button>` real |
| Keyboard | El botón Reintentar se alcanza con Tab y se pulsa con Intro/Espacio (es un `<button>`) |
| Focus visible | `outline: 3px solid #ffffff` en `:focus-visible` sobre `#0a1430` (≈ 18:1) |
| Contrast | Texto blanco sobre `#0a1430` ≈ 18:1; botón `#0a1430` sobre `#ffd84a` ≈ 13:1 |
| Forms | Sin cambios en los formularios de entrada (siguen sus `<label>`) |
| Images | Sin imágenes nuevas |
| Motion | Sin animaciones nuevas |
| Zoom / reflow | `offline.html` centrado con ancho máximo y texto que se adapta |
| Live regions | NOT APPLICABLE en lo nuevo |
| Enlaces | El crédito es un enlace con texto («juego original»), no un icono |

### WCAG 2.2 additions — the ones most often missed

| SC | Requirement |
|---|---|
| 2.4.11 Focus Not Obscured (Min) | Nada tapa el botón de `offline.html` |
| 2.5.7 Dragging Movements | Sin arrastres nuevos |
| 2.5.8 Target Size (Min) | Botón Reintentar ≥ 24×24 px (padding 12 × 20 px) |
| 3.3.7 Redundant Entry | Sin formularios nuevos |
| 3.3.8 Accessible Authentication (Min) | La entrada sigue admitiendo pegar y gestores de contraseñas (`autocomplete` de `login.js`) |

### Verification

```bash
grep -qF '<html lang="es">' desktop/offline.html   # expect: exit 0 (paso 12)
grep -qF "Reintentar" desktop/offline.html         # expect: exit 0 (paso 12)
```
Pasada manual antes del lanzamiento: abrir el `.exe` sin internet, llegar al botón sólo con el teclado y
pulsarlo.

---

## 16. Observability & Cost

### Instrumentation

| Signal | Tool | What it captures | Who looks at it |
|---|---|---|---|
| Errors | NOT APPLICABLE — sin servicio de errores (de pago o externo); consola del navegador / DevTools del `.exe` con Ctrl+Shift+I si hace falta | — | quien depura |
| Logs | Salida de las pruebas | Códigos y marcas | el builder / los dueños |
| Metrics | Consola de Firebase → Uso | Lecturas, escrituras, almacenamiento, conexiones RTDB | el administrador |
| Uptime | NOT APPLICABLE — GitHub Pages | — | — |

### The metrics that matter for this project

| Metric | Target | Alert at |
|---|---|---|
| Lecturas de Firestore al día | muy por debajo del cupo gratuito | 80 % del cupo (activar kill switch, §9.1) |
| Escrituras de Firestore al día | muy por debajo del cupo gratuito | 80 % del cupo |
| Conexiones simultáneas a RTDB | < cupo gratuito | cerca del cupo (salas que no se cierran) |
| Tiempo de llegada de una versión | ≤ 6 min | > 15 min (Pages o actualizador) |

### Health check

NOT APPLICABLE — no hay servidor; `version.json` publicado responde 200 (fase 3 de §9.1).

### Cost model

Cifras aproximadas de las páginas de precios; **compruébalas** en https://firebase.google.com/pricing y en la
documentación de GitHub Pages al lanzar.

| Service | Free tier | Cost at un grupo de amigos (≈10 jugadores) | Cost at 10× | Cliff to watch |
|---|---|---|---|---|
| Firebase Spark: Firestore | ~50.000 lecturas, ~20.000 escrituras y ~20.000 borrados al día, ~1 GiB | 0 € | 0 € | si se pasa, deja de funcionar hasta el día siguiente (Spark no cobra: corta) |
| Firebase Spark: Realtime Database | ~1 GB guardado, ~10 GB/mes de descarga, ~100 conexiones simultáneas | 0 € | 0 € | conexiones simultáneas |
| Firebase Authentication (sin Identity Platform) | correo/contraseña gratis | 0 € | 0 € | activar Identity Platform (cobra por usuario): prohibido |
| GitHub Pages | repos públicos; ~1 GB de sitio, ~100 GB/mes | 0 € | 0 € | el sitio pesa ~110 MB: bien |

**Estimated monthly cost at launch: 0 €.** El riesgo no es una factura (Spark no tiene método de pago) sino
quedarse sin cupo un día; el juego ya trae topes de escritura y cachés para eso.

---

## 17. Model Routing

NOT APPLICABLE — this project does not call an LLM at runtime.

---

## 18. Skills to Use During Build

Si una skill no está, el builder sigue con lo que dice este blueprint y lo anota en una línea.

| Skill | Build steps | Why | Install |
|---|---|---|---|
| `/architect-next` (plugin The Architect) | todos | Reanuda la construcción: lee `tasks.json` y enseña la siguiente tarea con sus comprobaciones | Ya instalado en este equipo (comprobado el 2026-10-20); si falta, el paso continúa sin él. Para reinstalar: `/plugin install the-architect@soyenriquerocha` |
| `run` | 2, 11, 12 | Arrancar el juego o la app para ver un cambio funcionando de verdad | Ya instalado en este equipo (comprobado el 2026-10-20); si falta, el paso continúa sin él. Viene con Claude Code; si no aparece, abre `/plugin` y busca `run` |
| `code-review` | 3, 4, 9, 11 | Revisión del diff antes del Checkpoint en los pasos que tocan seguridad (Google, TURN, reglas, ventana de Electron) | Ya instalado en este equipo (comprobado el 2026-10-20); si falta, el paso continúa sin él. Viene con Claude Code; si no aparece, abre `/plugin` y busca `code-review` |
| `frontend-design` | 5, 12 | Encaje visual de la línea de crédito y de `offline.html` con el estilo del juego | Ya instalado en este equipo (comprobado el 2026-10-20); si falta, el paso continúa sin él. Para reinstalar en este equipo: `/plugin install frontend-design@claude-plugins-official`; en otro equipo: `/plugin marketplace add anthropics/skills` y luego `/plugin install example-skills@anthropic-agent-skills` |
| `emil-design-eng` | 12 | Detalles de la pantalla sin conexión (foco, estados del botón) | `npx skills@latest add emilkowalski/skills` |
| Plugin de Playwright (herramientas `mcp__plugin_playwright_*`) | 5 (opcional) | Ver la pantalla de entrada servida por `tools/serve.cjs` | Ya instalado en este equipo (comprobado el 2026-10-20); si falta, el paso continúa sin él. Para reinstalar: `/plugin install playwright@claude-plugins-official` |
| Plugin de Firebase (herramientas `mcp__plugin_firebase_firebase__*`) | lista de lanzamiento (§20.1) | Crear el proyecto, la app web y desplegar reglas sin salir de Claude | Ya instalado en este equipo (comprobado el 2026-10-20); si falta, el paso continúa sin él. Para reinstalar: `/plugin install firebase@claude-plugins-official` |

---

## 19. Agent Workspace

En modo bundle, estos archivos son reales y están en `blueprints/pokekatens/workspace/`, con la misma ruta que
tendrán en el repositorio. El Bootstrap de §10 los copia a la raíz **sin pisar nada que ya exista** (bucle con
`[ -e ]`, sale con 0 aunque se repita; no se usa `rsync` porque Git Bash no lo trae, ni `cp -n`). En este
repositorio ya existe `CLAUDE.md`: la copia no lo toca y **el paso 14 lo sustituye** por `workspace/CLAUDE.md`,
que ya es la **fusión** de las normas del dueño anterior que siguen valiendo con las de PokeKatens. `AGENTS.md`
no existía y llega con la copia. **Nunca se emite `.claude/commands/`**.

No hay linter ni formateador en este repositorio, así que ningún archivo emitido puede romper un gate de
formato; aun así siguen el estilo del repo (JSON con 2 espacios, Markdown con tablas).

### 19.1 `CLAUDE.md`

Archivo `CLAUDE.md` (en el bundle: `workspace/CLAUDE.md`):

```markdown
# PokeKatens — cómo se trabaja y se publica

Versión **no oficial, gratis y sin ánimo de lucro** de PokéSurvivor (de JPTER78) para jugar entre amigos:
la web en GitHub Pages y un programa para Windows (`.exe`) que abre esa web. Normas fijas de los dueños.

<!-- Sustituye al CLAUDE.md del dueño original (JPTER78): conserva sus normas que siguen valiendo y
     cambia las que eran de sus servidores. Lo puso el paso 14 de blueprints/pokekatens. -->

## Comandos

| Tarea | Comando |
|---|---|
| Pruebas (todas) | `node --test "tests/*.test.cjs"` · una: `node --test tests/serve.test.cjs` |
| Comprobar los datos del juego | `node tools/export_data.js` |
| Construir (publicar) | `node tools/build.js --sin-seo` → `index.html`, `js/app.min.js`, `version.json`, `js/lang/*.js` |
| Jugar en local | `node tools/serve.cjs` → http://127.0.0.1:8123/dev.html (código suelto) o /index.html (construido) |
| Prueba de datos (Firebase local) | `node tools/emu.cjs "node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs"` |
| ¿Hay Java 21? | `node tools/emu.cjs --check-java` |
| Escritorio: instalar | `npm ci --prefix desktop` (o `npm install --prefix desktop` si cambias `desktop/package.json`) |
| Escritorio: abrir | `npm --prefix desktop start` |
| Escritorio: probar | `node tools/desktop-smoke.cjs` · `--offline` · `--hang` · `--exe desktop/dist/win-unpacked/PokeKatens.exe` (`--default`: sin `PK_URL`, con su URL de fábrica) |
| Instalador `.exe` | `npm --prefix desktop run dist` → `desktop/dist/PokeKatens-Setup-1.0.0.exe` |

**Gate:** `node --test "tests/*.test.cjs" && node tools/export_data.js && node tools/build.js --sin-seo`
antes de dar algo por hecho. Si tocas Firebase o `firestore.rules`, también la prueba de datos.
Si tocas `desktop/`, también las pruebas de escritorio.

Si algo sale mal, se vuelve atrás (nunca se arregla hacia delante): `git reset --hard` a la etiqueta
`step-NN-…` del último paso bueno, `git tag -d` de las etiquetas posteriores y rehacer desde ahí.

`node --test tests/` (con la carpeta) **no funciona** en Node 24: usa siempre el patrón entre comillas.
Versiones fijadas: `desktop/package-lock.json` (Electron), `tools/emu.cjs` (firebase-tools),
`tools/build.js` (terser, javascript-obfuscator). Léelas de ahí; nunca las adivines.

## Publicar una versión

1. Se edita `dev.html` (nunca `index.html`, que se genera).
2. Si es un cambio de juego o un arreglo: novedades (ver abajo).
3. `node tools/build.js --sin-seo` y el gate. `node tools/export_data.js` sigue siendo una comprobación
   (está en el gate); lo que ya no se hace es la cadena SEO (`export_data.js` para alimentar
   `tools/make_seo_pages.py`): PokeKatens no tiene páginas SEO.
4. Commit **sin "Co-Authored-By" ni ninguna firma de IA**. `git push origin main` **sólo cuando
   los dueños lo pidan**.
5. En unos 5 minutos todos los jugadores (web y `.exe`) pasan solos a la versión nueva.
   El `.exe` sólo se rehace si cambia algo dentro de `desktop/`.

Guía paso a paso para los dueños: `docs/GUIA-PUBLICAR-POKEKATENS.md`.

## Actualización automática de los jugadores (obligatorio)

Al publicar, todos los jugadores pasan a la versión nueva sin perder nada (`js/core/updater.js`
mira `version.json` cada 5 min):
- **Fuera de partida** (menú, sala de cooperativo incluida): aviso de 5 s y la página se recarga.
  Si está en el gacha, la tienda de mejoras, los ajustes o escribiendo en un campo, espera.
- **En partida**: no se toca. Al acabar, la run se guarda como siempre y al volver al menú se recarga.
- Antes de recargar se sube a la nube lo pendiente.

No quitar ni cambiar `js/core/updater.js`, ni la escritura de `version.json` en `tools/build.js`.
El `.exe` depende de esto: no lleva el juego dentro, abre la web.

## Novedades (changelog)

Cada cambio de juego o arreglo va en `js/data/changelog.js` (español e inglés, en `new` / `chg` / `fix`):
en la entrada de PokeKatens de hoy si ya existe; si no, en una entrada nueva al principio. Nunca debajo
de las entradas antiguas de JPTER78. Cada texto español nuevo lleva su fila
en `js/data/lang-updates.js` (francés, italiano, portugués, chino simplificado y tradicional): si falta,
`tests/i18n.test.cjs` falla. Los cambios de servidores, base de datos o costes **no** van ahí.

## Arquitectura

- **Juego**: HTML + CSS + JavaScript sin frameworks, Canvas 2D. Cada módulo es un script clásico
  (sin `import`) que se cuelga de `G`: `G.X = (() => { … })()`. El orden de carga es el del bloque
  `<!-- scripts:begin -->` … `<!-- scripts:end -->` de `dev.html`; `tools/build.js` los une en ese orden.
  Un archivo nuevo que no esté en ese bloque **no llega** a `js/app.min.js`.
- **Arranque**: `js/core/util.js` (crea `G`) → `js/core/fork-config.js` (`G.FORK`) →
  `js/core/firebase-config.js` → `js/core/db.js` (cuentas y partida: nube si hay config y la web está
  en `G.FORK.hosts`; si no, sólo este navegador) → resto del juego.
- **Nube**: Firebase (Auth con nombre + contraseña, Firestore para partidas/perfil/amigos/ranking,
  Realtime Database sólo para la señalización de las salas). Lo que protege los datos son
  `firestore.rules` y `database.rules.json`, no el código del juego.
- **Cooperativo**: WebRTC directo con STUN gratuito de Google (`js/net/net.js`). Sin TURN.
- **Escritorio**: `desktop/main.js` abre la URL de `desktop/package.json` → `pokekatens.url`
  (o `PK_URL`). Sin `preload` ni Node en la página; los enlaces externos van al navegador.
  Tras la primera carga, el service worker (`sw.js`) guarda una copia: sin internet abre esa copia
  (sin cuentas ni ranking); `desktop/offline.html` sólo sale si la web nunca se cargó.

| Qué | Dónde (única fuente) |
|---|---|
| Datos de esta copia (nombre, webs, repo, crédito, admins) | `js/core/fork-config.js` (`G.FORK`) |
| Conexión con Firebase | `js/core/firebase-config.js` (`emulator: true` = emulador local) |
| Proyecto de Firebase para la línea de comandos | `.firebaserc` |
| Reglas de seguridad | `firestore.rules`, `database.rules.json` |
| Textos traducidos | `js/data/lang-*.js` (se generan `js/lang/*.js` al construir) |
| Movimientos | `js/data/moves.js` · Sprites: `assets/pokemon/<dex>/` + `js/data/sprites-meta.js` |

## Servidores

- **Firebase: el proyecto propio de los dueños** (plan Spark, gratis). **Nunca** activar
  "Identity Platform" ni nada que lo active (funciones de bloqueo, MFA, "Actualizar para habilitar"):
  cobra por usuario.
- **Nunca** usar los servidores de JPTER78 (su proyecto de Firebase, `ice.pokesurvivor.com`,
  `pokesurvivor.com`) ni intentar subir a su repositorio (`upstream`).
- Nada de pago: sin dominio, sin TURN, sin Cloudflare, sin firma de código, sin servicios nuevos.
- Mantenimiento: `MAINTENANCE` en `js/main.js` (con `?dev` se puede entrar para probar).

## Licencia y crédito (obligatorio)

PokeKatens es un derivado de PokéSurvivor bajo PolyForm Noncommercial 1.0.0:
- Nunca cobrar nada, ni poner anuncios ni donaciones.
- No tocar `LICENSE`, `LICENSE-NONCOMMERCIAL.md` ni la línea `Required Notice: Copyright 2026 JPTER78
  (https://github.com/JPTER78/pokesurvivor)`; el instalador las lleva en `resources/legal/`.
- El crédito visible se queda en la pantalla de entrada, en Ajustes y en el aviso legal:
  `Basado en PokéSurvivor de JPTER78 · versión no oficial y sin ánimo de lucro`.

## Reglas de código

1. Comentarios y textos de la interfaz en español. Cada texto visible nuevo lleva su inglés en
   `js/data/lang-en.js` y su fila en `js/data/lang-updates.js` (francés, italiano, portugués, chino
   simplificado y tradicional); las novedades, su inglés en `changelog.js` y su fila en `lang-updates.js`.
   Excepción: las líneas de crédito a JPTER78 van con `translate="no"` y no se traducen.
2. Nada de dependencias en el juego: sólo lo que ya carga `dev.html`. Las herramientas (`tools/`,
   `tests/`) usan sólo módulos de Node; `desktop/` es el único sitio con `package.json`.
3. Pruebas nuevas en `tests/<nombre>.test.cjs` (CommonJS, `node:test`). Las que necesitan emuladores
   van en `tests/emulator/` y **no** terminan en `.test.cjs`.
4. Cualquier dato que guarde o lea la nube cumple `firestore.rules`; si cambias qué se guarda,
   cambia las reglas y añade un caso a `tests/emulator/`.
5. `index.html`, `js/app.min.js`, `version.json` y `js/lang/*.js` se generan: no se editan a mano.

## Reglas por zona (se cargan solas al tocar esos archivos)

| Archivo | Se aplica a |
|---|---|
| `.claude/rules/juego-js.md` | `js/**/*.js`, `dev.html`, `css/**` |
| `.claude/rules/firebase-reglas.md` | `firestore.rules`, `database.rules.json`, `js/core/db.js`, `js/net/**`, `tests/emulator/**` |
| `.claude/rules/escritorio.md` | `desktop/**`, `tools/desktop-smoke.cjs`, `tools/serve.cjs` |
| `.claude/rules/traducciones.md` | `js/data/lang-*.js`, `js/data/changelog.js` |

Recetas (skills): `anadir-pokemon`, `anadir-movimiento`, `anadir-funcion`, `publicar-version`.

## No negociable

1. Editar `dev.html`, nunca `index.html`.
2. Commits sin ninguna firma de IA; `push` sólo cuando los dueños lo pidan.
3. Nunca Identity Platform ni ningún servicio de pago; nunca los servidores de JPTER78.
4. No tocar `js/core/updater.js` ni quitar `version.json` de `tools/build.js`.
5. Mantener licencias, *Required Notice* y crédito a JPTER78; nunca cobrar.
6. No dar nada por hecho con el gate en rojo.
```

### 19.2 `AGENTS.md`

Archivo `AGENTS.md` (en el bundle: `workspace/AGENTS.md`):

```markdown
# PokeKatens — instrucciones para agentes

Versión no oficial, gratis y sin ánimo de lucro de PokéSurvivor (de JPTER78): web en GitHub Pages y
programa para Windows que abre esa web. La fuente completa de normas es `CLAUDE.md` en esta carpeta.

## Comandos

| Tarea | Comando |
|---|---|
| Pruebas | `node --test "tests/*.test.cjs"` |
| Comprobar datos | `node tools/export_data.js` |
| Construir (publicar) | `node tools/build.js --sin-seo` |
| Jugar en local | `node tools/serve.cjs` → http://127.0.0.1:8123/dev.html |
| Prueba de datos (emulador, Java 21) | `node tools/emu.cjs "node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs"` |
| Escritorio | `npm ci --prefix desktop` · `node tools/desktop-smoke.cjs` · `npm --prefix desktop run dist` |

**Gate:** `node --test "tests/*.test.cjs" && node tools/export_data.js && node tools/build.js --sin-seo`.

## No negociable

1. Editar `dev.html`, nunca `index.html` (se genera).
2. Commits sin ninguna firma de IA ("Co-Authored-By" incluido); `push` sólo cuando los dueños lo pidan.
3. Nunca activar Identity Platform ni ningún servicio de pago; nunca usar los servidores de JPTER78.
4. No tocar `js/core/updater.js` ni quitar la escritura de `version.json` en `tools/build.js`.
5. Mantener `LICENSE`, `LICENSE-NONCOMMERCIAL.md`, la línea *Required Notice* y el crédito a JPTER78; nunca cobrar.
6. Cada cambio de juego va en `js/data/changelog.js` (español e inglés) con sus traducciones en `js/data/lang-updates.js`.

Arquitectura, dónde vive cada cosa y recetas: `CLAUDE.md`.
```

### 19.3 `.claude/settings.json`

Cada subcomando de cada `Verify` de §9, del Checkpoint y de §20.1 tiene su entrada (o es de sólo lectura:
`grep`, `ls`, `head`, `wc`, `diff`, `cmp`, `git` de lectura). Las entradas terminan en `:*` para admitir el
comentario `# expect:` del final de la línea. No hay intérpretes sueltos: cada `node -e`/`node -p` está
escrito entero, y `tools/emu.cjs` / `tools/desktop-smoke.cjs` sólo con sus argumentos exactos (`--exe` sólo con
el programa empaquetado de este repo). `includeCoAuthoredBy: false` hace cumplir la norma de commits sin firma
de IA. Denegados: leer `.env`, `git push`, `git remote` (el cambio de remotos es de la lista de lanzamiento),
`firebase login`/`deploy` y `rm -rf`.

Archivo `.claude/settings.json` (en el bundle: `workspace/.claude/settings.json`):

```json
{
  "includeCoAuthoredBy": false,
  "permissions": {
    "allow": [
      "Bash(node --test \"tests/*.test.cjs\":*)",
      "Bash(node tools/export_data.js:*)",
      "Bash(node tools/build.js --sin-seo:*)",
      "Bash(node tools/serve.cjs:*)",
      "Bash(node tools/check-tags.cjs)",
      "Bash(node tools/check-tags.cjs:*)",
      "Bash(node tools/emu.cjs --check-java:*)",
      "Bash(node tools/emu.cjs \"node tests/emulator/smoke.cjs\":*)",
      "Bash(node tools/emu.cjs \"node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs\":*)",
      "Bash(node tools/desktop-smoke.cjs)",
      "Bash(node tools/desktop-smoke.cjs --offline:*)",
      "Bash(node tools/desktop-smoke.cjs --hang:*)",
      "Bash(node tools/desktop-smoke.cjs --exe desktop/dist/win-unpacked/PokeKatens.exe:*)",
      "Bash(node tools/desktop-smoke.cjs --exe desktop/dist/win-unpacked/PokeKatens.exe --default:*)",
      "Bash(node -e \"const m=JSON.parse(require('fs').readFileSync('manifest.webmanifest','utf8'));process.exit(m.name==='PokeKatens'&&m.short_name==='PokeKatens'?0:1)\":*)",
      "Bash(node -e \"const G={};new Function('G',require('fs').readFileSync('js/data/funding.js','utf8'))(G);const f=G.Funding;process.exit(f.url===''&&f.kofi===''&&f.sponsors===''&&f.costs.length===0?0:1)\":*)",
      "Bash(node -e \"const G={};new Function('G',require('fs').readFileSync('js/data/changelog.js','utf8'))(G);const e=G.CHANGELOG[0],l=[...(e.new||[]),...(e.chg||[]),...(e.fix||[])];const t=l.map(p=>p[0]).join(' ');process.exit(e.d>='2026-10-20'&&e.title[0].startsWith('PokeKatens')&&t.includes('PokeKatens')&&t.includes('administrador')&&l.every(p=>p[1])?0:1)\":*)",
      "Bash(node -p \"require('./desktop/node_modules/electron/package.json').version\")",
      "Bash(node -p \"require('./desktop/node_modules/electron-builder/package.json').version\")",
      "Bash(node -e \"const j=JSON.parse(require('fs').readFileSync('version.json','utf8'));process.exit(/^[0-9a-f]{10}$/.test(j.v)&&!isNaN(Date.parse(j.at))?0:1)\":*)",
      "Bash(node -e \"process.exit(+process.versions.node.split('.')[0] >= 20 ? 0 : 1)\":*)",
      "Bash(npm install --prefix desktop:*)",
      "Bash(npm ci --prefix desktop:*)",
      "Bash(npm --prefix desktop run dist:*)",
      "Bash(npm --prefix desktop start:*)",
      "Bash(npm --version)",
      "Bash(git --version)",
      "Bash(java -version:*)",
      "Bash(test:*)",
      "Bash(grep:*)",
      "Bash(ls:*)",
      "Bash(head:*)",
      "Bash(wc:*)",
      "Bash(diff:*)",
      "Bash(cmp:*)",
      "Bash(printf:*)",
      "Bash(tr -d '\\r':*)",
      "Bash(date +%F)",
      "Bash(mkdir -p desktop/build desktop/legal)",
      "Bash(cp assets/icons/icon-512.png desktop/build/icon.png)",
      "Bash(cp LICENSE desktop/legal/LICENSE)",
      "Bash(cp LICENSE-NONCOMMERCIAL.md desktop/legal/LICENSE-NONCOMMERCIAL.md)",
      "Bash(cp blueprints/pokekatens/workspace/CLAUDE.md CLAUDE.md)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git show:*)",
      "Bash(git ls-files:*)",
      "Bash(git check-ignore:*)",
      "Bash(git rev-parse:*)",
      "Bash(git merge-base:*)",
      "Bash(git tag:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git rm -q:*)",
      "Bash(git rm -r -q:*)",
      "Bash(git reset --hard step-:*)",
      "Bash(git reset --hard HEAD)",
      "Bash(git tag -d:*)",
      "Bash(cygpath -u:*)",
      "Bash(command -v java)",
      "Bash(reg query:*)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Bash(git push:*)",
      "Bash(git remote:*)",
      "Bash(npx --yes firebase-tools@15.34.0 deploy:*)",
      "Bash(npx --yes firebase-tools@15.34.0 login:*)",
      "Bash(rm -rf:*)"
    ]
  }
}
```

### 19.4 Project skills — `.claude/skills/<name>/SKILL.md`

| Skill | Triggers on | What it automates |
|---|---|---|
| `publicar-version` | «publica», «sube la versión», «haz el build» | Novedades → gate → `node tools/build.js --sin-seo` → commit sin firma → `push` sólo si lo piden; el `.exe` si cambió `desktop/` |
| `anadir-pokemon` | «añade el Pokémon X», «faltan los sprites» | `tools/fetch_sprites.py` → `assets/pokemon/<dex>/` (+ `s/`) → `js/data/sprites-meta.js` → créditos → gate |
| `anadir-movimiento` | «añade el ataque X», «cambia el daño» | `js/data/moves.js` (+ `EVO`) → textos en 7 idiomas → efectos opcionales → gate |
| `anadir-funcion` | «nueva función», «añade una pantalla» | Dónde va cada cosa, registro en `dev.html`, reglas si guarda en la nube, prueba y gate |

Archivo `.claude/skills/publicar-version/SKILL.md` (en el bundle: `workspace/.claude/skills/publicar-version/SKILL.md`):

````markdown
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
````

Archivo `.claude/skills/anadir-pokemon/SKILL.md` (en el bundle: `workspace/.claude/skills/anadir-pokemon/SKILL.md`):

````markdown
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
````

Archivo `.claude/skills/anadir-movimiento/SKILL.md` (en el bundle: `workspace/.claude/skills/anadir-movimiento/SKILL.md`):

````markdown
---
name: anadir-movimiento
description: Añade o ajusta un ataque (movimiento) de PokeKatens con sus textos en los 7 idiomas. Úsala cuando digan "añade el ataque X", "nuevo movimiento", "cambia el daño de" o "haz que X evolucione".
---

# Añadir o cambiar un movimiento

## When to use
- Un ataque nuevo para un tipo, un cambio de daño/recarga/alcance, o una evolución de ataque nueva.

## Steps
1. En `js/data/moves.js`, añade el objeto en la lista de su tipo, con el mismo formato que los demás:
   `{ id: 'thunder-shock', name: 'Impactrueno', type: 'electric', kind: 'projectile', desc: 'Descarga rapidísima que atraviesa varios enemigos.', cd: 0.40, dmg: 13, speed: 480, count: 1, spread: 0.08, pierce: 2, life: 1.1, size: 5 }`
   (el `id`, en inglés y con guiones; los números, según el `kind`: copia los de un ataque parecido).
   El `kind` decide cómo se comporta (lista al principio de `moves.js`; lo implementa `js/systems/combat.js`).
   Nunca cambies el `id` de un ataque que ya existe: las partidas guardadas lo usan.
2. Si evoluciona, añade su fila en `EVO` de `moves.js`: `'id': ['Nombre evolucionado', '<mejora>']`
   (la mejora es una de `hp`, `atk`, `spd`, `cd`, `def`, `rgn`, `mag`, `xp`).
3. Textos: el nombre y la descripción en inglés en `js/data/lang-en.js`; y una fila en `rows` de
   `js/data/lang-updates.js` con francés, italiano, portugués de Brasil, chino simplificado y tradicional.
   `node tools/build_langs.js --faltan` dice lo que falta por traducir.
4. Efectos visuales opcionales: `js/entities/fx.js` y `js/entities/vfx.js` (reutiliza los que ya hay
   siempre que puedas).
5. Novedades (skill `publicar-version`, paso 1) y gate.

## Verify
```bash
node tools/export_data.js          # expect: exit 0 — instancia todos los movimientos y sus evoluciones
node --test "tests/*.test.cjs"     # expect: exit 0 — incluida la cobertura de idiomas
node tools/build.js --sin-seo      # expect: exit 0
```

## Do not
- No dejes un texto en español sin su inglés y sus cinco traducciones: `tests/i18n.test.cjs` falla.
- No cambies los `id` existentes ni borres ataques que tengan las partidas guardadas.
- No metas dependencias nuevas para efectos: Canvas 2D y lo que ya hay.
````

Archivo `.claude/skills/anadir-funcion/SKILL.md` (en el bundle: `workspace/.claude/skills/anadir-funcion/SKILL.md`):

````markdown
---
name: anadir-funcion
description: Añade una función nueva al juego PokeKatens (pantalla, sistema, opción) respetando cómo está hecho. Úsala cuando digan "añade una pantalla", "nueva función", "quiero que el juego haga" o "añade una opción en Ajustes".
---

# Añadir una función al juego

## When to use
- Una pantalla o un menú nuevo, un sistema de juego nuevo, una opción de Ajustes, algo que se guarde.

## Steps
1. Decide dónde va: sistemas de juego en `js/systems/`, pantallas y menús en `js/ui/`, red en `js/net/`.
   Cada archivo es un módulo `G.Nombre = (() => { … return { … }; })();` sin `import`.
2. Si es un archivo nuevo, añádelo a `dev.html` dentro de `<!-- scripts:begin -->` … `<!-- scripts:end -->`,
   **después** de los módulos que usa. Si no está ahí, `tools/build.js` no lo mete en `js/app.min.js`.
3. HTML de pantallas nuevas en `dev.html` (nunca en `index.html`); estilos en `css/style.css`.
4. Textos visibles en español; su inglés en `js/data/lang-en.js`.
5. Si guarda datos en la nube: el campo tiene que caber en `firestore.rules` (cambia las reglas si no),
   añade un caso a `tests/emulator/` y pasa `node tools/emu.cjs "node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs"`.
   Recuerda que Firebase va en plan gratuito: nada de escrituras en bucle (mira los topes de 20 s de las reglas).
6. Una prueba en `tests/<nombre>.test.cjs` si la lógica se puede probar sin navegador.
7. Novedades (skill `publicar-version`, paso 1) y gate.

## Verify
```bash
node --test "tests/*.test.cjs"     # expect: exit 0
node tools/export_data.js          # expect: exit 0
node tools/build.js --sin-seo      # expect: exit 0
```

## Do not
- No toques `js/core/updater.js` ni cómo `tools/build.js` escribe `version.json`.
- No añadas servicios de pago, Google Sign-In ni nada que active Identity Platform.
- No añadas librerías ni frameworks al juego.
````

### 19.5 `.claude/rules/*.md`

| File | `paths` globs | Covers |
|---|---|---|
| `.claude/rules/juego-js.md` | `js/**/*.js`, `dev.html`, `css/**` | Módulos `G.X`, bloque de scripts, `G.FORK`, archivos generados, CSP |
| `.claude/rules/firebase-reglas.md` | `firestore.rules`, `database.rules.json`, `firestore.indexes.json`, `firebase.json`, `.firebaserc`, `js/core/db.js`, `js/core/firebase-config.js`, `js/net/**`, `tests/emulator/**` | Proyecto propio, emulador, reglas = seguridad, topes, admin, sin TURN |
| `.claude/rules/escritorio.md` | `desktop/**`, `tools/desktop-smoke.cjs`, `tools/serve.cjs` | Versiones exactas, seguridad de la ventana, marcas de prueba, licencias, sin firma |
| `.claude/rules/traducciones.md` | `js/data/lang-*.js`, `js/data/changelog.js`, `js/lang/**` | Claves en español, `lang-updates.js`, novedades, `{x}` |

Archivo `.claude/rules/juego-js.md` (en el bundle: `workspace/.claude/rules/juego-js.md`):

```markdown
---
description: Convenciones del código del juego (scripts clásicos colgados de G, dev.html como fuente)
paths:
  - "js/**/*.js"
  - "dev.html"
  - "css/**"
---

# Código del juego

- Cada módulo es un script clásico sin `import`/`export`: `G.Nombre = (() => { … return { … }; })();`.
- El orden de carga es el del bloque `<!-- scripts:begin -->` … `<!-- scripts:end -->` de `dev.html`;
  `tools/build.js` une los archivos en ese orden. Un archivo nuevo va en ese bloque, después de lo que usa.
- `js/core/fork-config.js` va justo antes de `js/core/firebase-config.js`; `G.FORK` es la única fuente de
  nombre, webs permitidas (`hosts`), repo, crédito (`upstream`), contacto y administradores.
- Se edita `dev.html`; `index.html`, `js/app.min.js`, `version.json` y `js/lang/*.js` los genera el build.
- `js/core/updater.js` no se toca.
- Comentarios y textos de la interfaz en español; los nuevos, con su inglés en `js/data/lang-en.js`.
- Nada de URLs de `pokesurvivor.com`, `github.com/JPTER78` escrito a mano en JS (usa `G.FORK.upstream`)
  ni de servicios de Google para iniciar sesión.
- La CSP de `dev.html` sólo permite scripts propios y de Firebase: no añadas orígenes nuevos.
- Prueba rápida: `node --test "tests/*.test.cjs"` y `node tools/build.js --sin-seo`.
```

Archivo `.claude/rules/firebase-reglas.md` (en el bundle: `workspace/.claude/rules/firebase-reglas.md`):

```markdown
---
description: Firebase, reglas de seguridad y red del cooperativo
paths:
  - "firestore.rules"
  - "database.rules.json"
  - "firestore.indexes.json"
  - "firebase.json"
  - ".firebaserc"
  - "js/core/db.js"
  - "js/core/firebase-config.js"
  - "js/net/**"
  - "tests/emulator/**"
---

# Firebase y red

- Proyecto: el de los dueños de PokeKatens, plan Spark gratuito. Nunca Identity Platform (ni funciones de
  bloqueo, ni MFA, ni "Actualizar para habilitar"). Nunca el proyecto ni los servidores de JPTER78.
- Mientras `js/core/firebase-config.js` lleve `emulator: true`, el juego usa los emuladores locales
  (auth 9099, firestore 8080, database 9000, como en `firebase.json`).
- Las reglas son la seguridad real. Si cambias qué se guarda o quién lo lee, cambia `firestore.rules`
  y añade un caso a `tests/emulator/` (mismo estilo: códigos de respuesta, nunca tokens en la salida).
- Prueba: `node tools/emu.cjs "node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs"`
  (necesita Java 21; `node tools/emu.cjs --check-java` lo comprueba).
- Mantén los topes de escritura de las reglas (las llamadas a `every()`) y las cachés del juego: el plan gratuito tiene
  límites diarios de lecturas y escrituras.
- Administradores: `function admin()` en `firestore.rules` y `G.FORK.admins` deben tener los mismos UID.
- Cooperativo: WebRTC directo con los STUN de Google (`js/net/net.js`). No añadas TURN ni relé por la base
  de datos: cuestan dinero.
- Las reglas se despliegan a mano (lista de lanzamiento / guía): `npx --yes firebase-tools@15.34.0 deploy --only firestore:rules,firestore:indexes,database`.
```

Archivo `.claude/rules/escritorio.md` (en el bundle: `workspace/.claude/rules/escritorio.md`):

```markdown
---
description: App de escritorio (Electron) y sus herramientas de prueba
paths:
  - "desktop/**"
  - "tools/desktop-smoke.cjs"
  - "tools/serve.cjs"
---

# App de escritorio

- `desktop/` es el único sitio con `package.json`. Versiones exactas (sin `^`): cámbialas sólo a propósito,
  con `npm install --prefix desktop` y subiendo `desktop/package-lock.json`.
- La app no lleva el juego dentro: abre `pokekatens.url` de `desktop/package.json` (o `PK_URL`). Así se
  actualiza con cada publicación de la web; el `.exe` sólo se rehace si cambia `desktop/`.
- Seguridad de la ventana, sin excepciones: `contextIsolation: true`, `sandbox: true`,
  `nodeIntegration: false`, sin `preload`; ventanas nuevas → navegador del sistema y `deny`;
  navegación a otro origen → navegador del sistema.
- Marcas de prueba (no cambiar el texto, las leen las pruebas): `PK_SMOKE_OK`, `PK_SMOKE_OFFLINE`,
  `PK_SMOKE_TIMEOUT` (código 3), y en el arnés `DESKTOP_SMOKE_OK <modo>` (`online`, `offline`, `hang`, `default`).
- Pruebas: `node tools/desktop-smoke.cjs`, `--offline`, `--hang`, y tras `npm --prefix desktop run dist`,
  `--exe desktop/dist/win-unpacked/PokeKatens.exe` y `--exe desktop/dist/win-unpacked/PokeKatens.exe --default`
  (sin `PK_URL`: la URL de fábrica; con `http://127.0.0.1:8123/` necesita el puerto 8123 libre). Cada prueba
  usa un perfil nuevo (`PK_PROFILE`), por eso `--offline` mide el primer arranque sin conexión.
- `desktop/legal/` son copias exactas de `LICENSE` y `LICENSE-NONCOMMERCIAL.md`: si cambian, se vuelven a copiar.
- Sin firma de código (costaría dinero): el aviso de SmartScreen se explica en la guía, no se "arregla".
- `desktop/dist/` está en `.gitignore`: el instalador nunca se sube al repositorio.
```

Archivo `.claude/rules/traducciones.md` (en el bundle: `workspace/.claude/rules/traducciones.md`):

```markdown
---
description: Diccionarios de idiomas y novedades
paths:
  - "js/data/lang-*.js"
  - "js/data/changelog.js"
  - "js/lang/**"
---

# Idiomas y novedades

- La clave de cada texto es el texto en español, carácter por carácter. Si cambias un texto español en el
  juego, su clave en los diccionarios deja de valer: añade la nueva (la vieja puede quedarse).
- Inglés en `js/data/lang-en.js`. Francés, italiano, portugués de Brasil, chino simplificado y tradicional:
  una fila nueva en `rows` de `js/data/lang-updates.js` (`[es, fr, it, pt-BR, zh-Hans, zh-Hant]`).
- `node tools/build_langs.js --faltan` lista lo que falta; `js/lang/*.js` se regenera al construir
  (no se edita a mano).
- Novedades: `js/data/changelog.js`, la fecha más nueva arriba, cada línea `[español, inglés]` en `new`,
  `chg` o `fix`. Va en la entrada de PokeKatens de hoy si ya existe; si no, en una entrada nueva al principio (nunca debajo de las de JPTER78). Nada de servidores ni costes.
- `tests/i18n.test.cjs` exige traducción en los cinco idiomas para cada línea de novedades con fecha
  `2026-10-18` o posterior, y que todo lo que tiene inglés lo tenga también en los otros idiomas.
- Respeta los marcadores `{x}` y `{name}`: mismo número en el original y en la traducción.
```

### 19.6 Verify-critical config and local infrastructure

**No se emite ningún archivo de configuración bajo `workspace/` aparte de los de agentes**, y es correcto: cada
archivo que necesita un `Verify` o ya está en el repositorio y no cambia (`firebase.json`,
`database.rules.json`, `firestore.indexes.json`, `tools/build.js`), o lo crea un paso concreto, que lo tiene
en su lista de archivos y en el `files` de su tarea, **antes o en el mismo paso** que lo usa. No hay
`package.json` en la raíz, ni test-runner con configuración (`node:test` no la necesita), ni alias de rutas.

| File | Path in the project | Which `Verify` commands need it | Resolution/env handling it carries | Bundle-path exclusion |
|---|---|---|---|---|
| `firebase.json` | `firebase.json` (ya existe, sin cambios) | 8, 9, 15 (emuladores) | puertos 9099/8080/9000, `singleProjectMode`; no lee variables | n/a — firebase-tools no recorre el árbol buscando configuraciones |
| `.firebaserc` | `.firebaserc` (paso 8) | 8 | proyecto `demo-pokekatens`; no lee variables | n/a — la lee firebase-tools en la raíz |
| `tools/emu.cjs` | (paso 8) | 8, 9, 15 | **cargador de entorno**: busca Java ≥ 21 y lo pone delante de `PATH` y en `JAVA_HOME` del proceso que lanza; no hay `.env` | n/a — no recorre el árbol |
| `tests/emulator/smoke.cjs`, `ranking.cjs` | (pasos 8 y 9) | 8, 9, 15 | no leen variables: direcciones fijas iguales a `firebase.json`; `fetch` global de Node 24 | n/a |
| `tools/serve.cjs` | (paso 2) | 2, 11, 12, 13, 15 (vía el arnés) | ninguna variable; sólo módulos de Node | n/a — sólo sirve lo que se le pide (puede servir `blueprints/`, que es documentación pública) |
| `tests/*.test.cjs` | (pasos 1, 2, 3, 4 y 10 — `tests/textos-nuevos.test.cjs` —, más los que ya había) | todos | `node --test "tests/*.test.cjs"`: el patrón sólo mira `tests/` | n/a — el patrón no llega a `blueprints/` |
| `tools/desktop-smoke.cjs` | (paso 11) | 11, 12, 13, 15 | **cargador de entorno**: pasa `PK_URL` (salvo en `--default`, donde la quita), `PK_SMOKE_OUT` y `PK_PROFILE` explícitamente al proceso de la app; localiza Electron con `require('<raíz>/desktop/node_modules/electron')`; en `--default` lee `pokekatens.url` de `desktop/package.json` | n/a |
| `desktop/package.json` | (paso 11) | 11, 12, 13, 15 | `main: main.js`; config de electron-builder con `files` explícito (`main.js`, `offline.html`, `package.json`) | n/a — electron-builder sólo empaqueta `desktop/` y su lista `files` |

**Servicios.** El único servicio que necesitan los gates son los emuladores de Firebase, provisionados por
el blueprint: (1) lo que los arranca y para: `firebase.json` (en el repo) + `tools/emu.cjs`, que ejecuta
`firebase-tools@15.34.0 emulators:exec` (arranca, ejecuta el script y para; cada vez empiezan vacíos); (2) las
variables que apuntan a ellos: tabla de §10 (las pone `emulators:exec`, valores literales `127.0.0.1:8080`,
`127.0.0.1:9099`, `127.0.0.1:9000`); (3) los comandos: §10 y la tabla de comandos de §19.1; (4) el permiso: las
entradas exactas de `tools/emu.cjs` en §19.3. Requisito de máquina: Java 21 (§10).

**El bundle dentro del proyecto.** Ninguna herramienta que usan los gates descubre configuraciones recorriendo
carpetas: no hay formateador, linter, comprobador de tipos ni workspaces de npm; `node --test` usa un patrón
limitado a `tests/`; `tools/build.js` sólo lee los archivos que nombra `dev.html`; electron-builder sólo
`desktop/`. Por eso no hace falta ninguna línea de exclusión de `blueprints/`. Si algún día se añade una
herramienta que recorra el árbol (un formateador, por ejemplo), su configuración tendrá que excluir
`blueprints/`.

#### Resolution convention matrix

**The convention, stated once:** el código del juego son **scripts clásicos** sin `import`/`export`, cada uno
colgado de `G` y registrado en orden en el bloque `<!-- scripts:begin -->`…`<!-- scripts:end -->` de
`dev.html`; las herramientas, pruebas y la app de escritorio son **CommonJS** (`require`), con extensión
`.cjs` en `tests/` y en las herramientas nuevas, y `.js` dentro de `desktop/` (cuyo `package.json` no declara
`"type"`, así que es CommonJS).

| Context | Command that exercises it | Convention as it appears there | Config + literal setting that makes it work |
|---|---|---|---|
| Application source | `node tools/serve.cjs` → `/dev.html` en el navegador o en Electron | `<script defer src="js/core/fork-config.js">` antes de `firebase-config.js`; `G.FORK` leído en tiempo de carga de `db.js` | `dev.html` — el orden del bloque de scripts (comprobado por `tests/fork.test.cjs`) |
| Test files | `node --test "tests/*.test.cjs"` | `require('node:test')`; los scripts del juego se cargan con `vm.runInContext` o `new Function('G', código)` sobre un `G` falso | No hay config: Node trata `.cjs` como CommonJS siempre; el patrón entre comillas lo expande Node (no la carpeta, que falla en Node 24) |
| Standalone scripts | `node tools/serve.cjs`, `node tools/emu.cjs …`, `node tests/emulator/smoke.cjs`, `node tools/desktop-smoke.cjs` | `require` de módulos de Node únicamente (`http`, `fs`, `path`, `child_process`, `net`, `os`); `fetch` global | Extensión `.cjs` → CommonJS por la extensión, sin `package.json` en la raíz |
| Build / bundle | `node tools/build.js --sin-seo` | Concatena en el orden del bloque de scripts; sustituye `window.G = window.G || {};` por `var G = {};` dentro de una función | `tools/build.js` (sin cambios) — `fork-config.js` sólo usa `G`, nunca `window.G`, así que funciona encerrado |
| Electron (proceso principal) | `node tools/desktop-smoke.cjs` (lanza `electron desktop --smoke`) y el `.exe` empaquetado | `require('electron')`, `require('./package.json')` | `desktop/package.json` — `"main": "main.js"` y sin `"type"` → CommonJS; dentro del `.exe`, `files` incluye `main.js` y `package.json` |

#### Cross-artifact value reconciliation

| Shared value | Single source — the file that decides it | Literal value | Every other place it appears | Compared |
|---|---|---|---|---|
| Puerto del servidor local | `tools/serve.cjs` — puerto por defecto | `8123` | `desktop/package.json` `pokekatens.url` (`http://127.0.0.1:8123/`) · §19.1 · `AGENTS.md` · `.claude/rules/escritorio.md` (por nombre) · paso 2 (`grep -qF "8123"`) | yes |
| Línea de arranque del servidor | `tools/serve.cjs` | `PK_SERVE http://127.0.0.1:<puerto>/` | `tests/serve.test.cjs` · `tools/desktop-smoke.cjs` (expresión `PK_SERVE http://127.0.0.1:(\d+)/`) | yes |
| Id del proyecto de pruebas | `js/core/firebase-config.js` — `projectId` | `demo-pokekatens` | `.firebaserc` · `databaseURL` (`?ns=demo-pokekatens`) · `tools/emu.cjs` (`PROJECT`) · `tests/emulator/*.cjs` (rutas `projects/demo-pokekatens/…`) · pasos 1, 8 | yes |
| Clave de API de pruebas | `js/core/firebase-config.js` — `apiKey` | `demo-pokekatens-key` | `tests/emulator/*.cjs` (`?key=`) | yes |
| Puertos de los emuladores | `firebase.json` | `9099` / `8080` / `9000` | `js/core/db.js` (`useEmulator`, sin cambios) · `js/net/ranking.js:439` (sin cambios) · `tests/emulator/*.cjs` · `databaseURL` del paso 1 · §10 | yes |
| Dominio interno de cuentas | `js/core/db.js` — `NAME_DOMAIN` | `jugadores.pokekatens.invalid` | `tests/sin-google.test.cjs` · correos de `tests/emulator/*.cjs` · §8 · §9.1 | yes |
| Versión de firebase-tools | `tools/emu.cjs` — `FIREBASE_TOOLS` | `firebase-tools@15.34.0` | §11 · §19.1 · `.claude/rules/firebase-reglas.md` · skill `publicar-version` · guía del paso 14 · §19.3 (`deny`) | yes |
| Versiones de Electron | `desktop/package.json` — `devDependencies` | `44.9.2` / `26.15.3` | §11 · paso 11 (`node -p`) | yes |
| Nombre del instalador | `desktop/package.json` — `productName` + `version` + `nsis.artifactName` + `directories.output` | `desktop/dist/PokeKatens-Setup-1.0.0.exe` | pasos 13 y 15 · §20.1 · §19.1 · skill `publicar-version` · guía del paso 14 | yes |
| Programa sin instalar | `desktop/package.json` — `productName` + `directories.output` | `desktop/dist/win-unpacked/PokeKatens.exe` | pasos 13 · §20.1 · §19.1 · §19.3 · `.claude/rules/escritorio.md` | yes |
| Licencias dentro del programa | `desktop/package.json` — `extraResources` `{ from: "legal", to: "legal" }` | `desktop/dist/win-unpacked/resources/legal/LICENSE-NONCOMMERCIAL.md` | paso 13 | yes |
| Entrada de la app | `desktop/package.json` — `main` | `main.js` | `files` del mismo archivo · `scripts.start`/`smoke` (`electron .`) | yes |
| Icono | `desktop/package.json` — `win.icon` | `build/icon.png` (= `desktop/build/icon.png`) | paso 13 (`cp` y `cmp`) | yes |
| Marcas de la app | `desktop/main.js` | `PK_SMOKE_OK` · `PK_SMOKE_OFFLINE` · `PK_SMOKE_TIMEOUT` (código 3) | `tools/desktop-smoke.cjs` · §5 · `.claude/rules/escritorio.md` | yes |
| Marcas del arnés | `tools/desktop-smoke.cjs` | `DESKTOP_SMOKE_OK online` / `offline` / `hang` / `default` | pasos 11, 12, 13, 15 · §20.1 | yes |
| URL de fábrica del programa | `desktop/package.json` — `pokekatens.url` | `http://127.0.0.1:8123/` | puerto por defecto de `tools/serve.cjs` (`8123`) · `tools/desktop-smoke.cjs --default` (lee el mismo campo y arranca `serve.cjs --port 8123` sólo con este valor) · paso 13 · §20.1 · guía (la lista de lanzamiento lo cambia a `https://<usuario>.github.io/pokekatens/`) | yes |
| Marcas de datos | `tests/emulator/smoke.cjs` / `ranking.cjs` | `EMULATOR_SMOKE_OK` / `EMULATOR_RANKING_OK` | pasos 8, 9, 15 · §20.1 | yes |
| Crédito | `js/core/fork-config.js` — `upstream` | `https://github.com/JPTER78/pokesurvivor` | `dev.html` (entrada y aviso legal, escrito) · `README.md` · `LICENSE-NONCOMMERCIAL.md` (*Required Notice*, sin cambios) | yes |
| Texto del crédito | `dev.html` — línea de entrada | `Basado en PokéSurvivor de JPTER78 · versión no oficial y sin ánimo de lucro` | aviso legal de `dev.html` · Ajustes (`settings-ui.js`) · §19.1 · paso 5 | yes |
| Comando de pruebas | §19.1 | `node --test "tests/*.test.cjs"` | todos los pasos · §19.3 · §20.1 · `AGENTS.md` · skills | yes |
| Comando de publicar | §19.1 | `node tools/build.js --sin-seo` | todos los pasos · §19.3 · skills · guía del paso 14 | yes |
| Ruta del bundle | este documento | `blueprints/pokekatens/` | Bootstrap (`W=blueprints/pokekatens/workspace`) · paso 14 (`diff -q`) · §19.3 (`cp`) | yes |

La primera vez que existen los dos lados de cada contrato se comprueba en ese mismo paso: puerto y línea
`PK_SERVE` en el 2 (la prueba arranca el servidor); `demo-pokekatens`, clave y puertos en el 8 (la prueba
habla con los emuladores); `main.js` + `package.json` + Electron en el 11 (el arnés **ejecuta** la app); nombre
del instalador, programa sin instalar, icono y licencias en el 13 (se ejecuta el programa empaquetado).

#### Byte-exact artifact reconciliation

| Byte-exact artifact | Authored by | First diffed at | Blueprint rules that constrain it | Runtime call that produces it, on the §11 pin | Both confirmed |
|---|---|---|---|---|---|
| `robots.txt` (`User-agent: *` / `Disallow:`) | paso 6 | paso 6 (comparado tras quitar `\r`) | §3 (permitir todo, sin `Sitemap`); `core.autocrlf=true` (§1 Current state) → la comparación quita los retornos de carro | Ninguna: el archivo lo escribe el blueprint, no lo produce un programa | yes |
| CSP de `dev.html` | paso 3 | paso 3 (`tests/sin-google.test.cjs`) | §14 (sin `apis.google.com`); el resto de orígenes, iguales a la CSP actual de `dev.html:9` | Ninguna: texto escrito por el blueprint | yes |
| Marcas `PK_SMOKE_*`, `DESKTOP_SMOKE_*`, `EMULATOR_*_OK`, `PK_SERVE …` | pasos 2, 8, 9, 11 | los mismos pasos | §5 (tabla de marcas y códigos) | Ninguna: las imprime el código del propio proyecto | yes |
| Códigos HTTP de los emuladores (200 / 403) | pasos 8 y 9 | pasos 8 y 9 | §4 (reglas de `saves` y `lb`), §8 | Comportamiento documentado de la API REST de Firestore (permiso denegado = 403); se confirma al ejecutar el propio gate del paso 8 en el emulador de `firebase-tools@15.34.0` | yes |
| `version.json` (`v` de 10 caracteres hex, `at` fecha) | `tools/build.js` (sin cambios) | paso 15 | §5 *Interfaces held constant* | `tools/build.js` leído: `sha1(...).digest('hex').slice(0, 10)` y `new Date().toISOString()`; se comprueba la propiedad, no los bytes | yes |

---

## 20. Acceptance Gate, Risks & Decision Log

### 20.1 Global acceptance gate

El proyecto está **hecho** cuando todas estas líneas salen con 0 desde la raíz de una copia limpia (tras el
Bootstrap de §10 y con Java 21 instalado). Es lo mismo que comprueba el paso 15, más la instalación limpia y
el instalador.

```bash
npm ci --prefix desktop   # expect: exit 0 — instala exactamente desktop/package-lock.json
node --test "tests/*.test.cjs"   # expect: exit 0, 0 failed
node tools/export_data.js   # expect: exit 0
node tools/build.js --sin-seo   # expect: exit 0
node -e "const j=JSON.parse(require('fs').readFileSync('version.json','utf8'));process.exit(/^[0-9a-f]{10}$/.test(j.v)&&!isNaN(Date.parse(j.at))?0:1)"   # expect: exit 0
status=0; grep -rlE "GoogleAuthProvider|ice\.pokesurvivor\.com|apis\.google\.com|rshaa5gKD3fXw6lE4PPXITbowaG2|pokesurvivor-free" dev.html index.html js/app.min.js js/core js/ui js/net || status=$?; test "$status" -eq 1   # expect: exit 0 — 1 = ninguna coincidencia
out=$(node tools/emu.cjs "node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs"); echo "$out" | grep -qF EMULATOR_SMOKE_OK && echo "$out" | grep -qF EMULATOR_RANKING_OK   # expect: exit 0
node tools/desktop-smoke.cjs | grep -F "DESKTOP_SMOKE_OK online"   # expect: exit 0
node tools/desktop-smoke.cjs --offline | grep -F "DESKTOP_SMOKE_OK offline"   # expect: exit 0
npm --prefix desktop run dist   # expect: exit 0
test -s desktop/dist/PokeKatens-Setup-1.0.0.exe   # expect: exit 0
node tools/desktop-smoke.cjs --exe desktop/dist/win-unpacked/PokeKatens.exe | grep -F "DESKTOP_SMOKE_OK online"   # expect: exit 0 — el programa empaquetado se ejecuta
node tools/desktop-smoke.cjs --exe desktop/dist/win-unpacked/PokeKatens.exe --default | grep -F "DESKTOP_SMOKE_OK default"   # expect: exit 0 — y abre su URL de fábrica sin PK_URL (puerto 8123 libre)
git diff --quiet step-00-preparacion -- js/core/updater.js database.rules.json   # expect: exit 0
```

Todas las expectativas son propiedades, no recuentos. Ninguna línea toma «cualquier código distinto de 0» como
éxito: la única que espera un fallo (`grep`) afirma el código 1, así que un error de uso (2) la hace fallar.

**Lista de comprobación manual y de lanzamiento** — la hacen personas, una vez, después del paso 15
(la guía `docs/GUIA-PUBLICAR-POKEKATENS.md` la explica con detalle). `<usuario>` es vuestro nombre de usuario de
GitHub y `<UID>` el identificador de vuestra primera cuenta en Firebase: los conocéis al crearlos en esta lista.

- [ ] Cada paso tiene su etiqueta y está en la historia de `HEAD` (aunque se haya vuelto atrás y rehecho alguno): `node tools/check-tags.cjs` sale con 0 y escribe `ETIQUETAS_OK 15` (15 = las filas del mapa de pasos de §9; `step-00-preparacion`, la del Bootstrap, no cuenta). El repositorio ya existía; el Bootstrap lo comprueba y crea los commits que necesitan las etiquetas.
- [ ] Cada archivo de la tabla *Files that must be committed* de §10 está en git: `git ls-files --error-unmatch <ruta>` con **una ruta por llamada** (`AGENTS.md`, `.claude/settings.json`, `js/core/fork-config.js`, `tools/serve.cjs`, `tools/emu.cjs`, `tools/desktop-smoke.cjs`, `desktop/package.json`, `desktop/package-lock.json`, `desktop/main.js`, `desktop/offline.html`, `desktop/build/icon.png`, `desktop/legal/LICENSE-NONCOMMERCIAL.md`, `docs/GUIA-PUBLICAR-POKEKATENS.md`), y para cada una `status=0; git check-ignore -q <ruta> || status=$?; test "$status" -eq 1` (1 = no ignorado · 128 = error de uso, que ahora falla).
- [ ] La línea `desktop/dist/` de `.gitignore` llegó antes que cualquier archivo de `desktop/`: `c=$(git log --format=%H -S 'desktop/dist/' -- .gitignore | tail -n 1); test -n "$c"; git merge-base --is-ancestor "$c" step-01-config-fork` sale con 0.
- [ ] El Bootstrap de §10 se ha vuelto a ejecutar una vez sobre el árbol ya construido, **ha salido con 0** y no ha cambiado nada: `antes=$(git status --porcelain)`, ejecutar el bloque, y `test "$antes" = "$(git status --porcelain)"` sale con 0.
- [ ] Todas las filas de *Byte-exact artifact reconciliation* y *Cross-artifact value reconciliation* de §19.6 dicen `yes`.
- [ ] §9.1: las 10 filas de paridad en verde (las comprueba el bloque de arriba) y el kill switch probado una vez a propósito en local (`G.FIREBASE_CONFIG = null;` → el juego dice que guarda sólo en este navegador) y deshecho.
- [ ] Ningún no-objetivo de §1 se ha construido.
- [ ] **Java 21** instalado (§10) — lo necesita el bloque de arriba.
- [ ] **GitHub**: cuenta, repositorio **público** `pokekatens`; `git remote rename origin upstream`; `git remote add origin https://github.com/<usuario>/pokekatens.git`; `git push -u origin main`; Settings → Pages → `main` / `(root)`.
- [ ] **Firebase**: proyecto nuevo (Spark, **sin Identity Platform**, sin Google Analytics); Authentication → Correo/contraseña; Firestore (modo producción) y Realtime Database; app web registrada y su config pegada en `js/core/firebase-config.js` **sin** `emulator: true`; `G.FORK.site`, `G.FORK.hosts` (+ `'<usuario>.github.io'`) y `G.FORK.repo`; `.firebaserc` con el id real; dominio autorizado `<usuario>.github.io`.
- [ ] Reglas: `npx --yes firebase-tools@15.34.0 login` y `npx --yes firebase-tools@15.34.0 deploy --only firestore:rules,firestore:indexes,database` salen con 0.
- [ ] Primera cuenta creada en la web publicada (si da `auth/invalid-email`, criterio de aborto de §9.1); su UID en `G.FORK.admins` y en `function admin() { return signedIn() && me() in ['<UID>']; }`; reglas desplegadas otra vez; construir y `push`.
- [ ] `version.json` publicado responde 200: `test "$(curl -s -o /dev/null -w '%{http_code}' https://<usuario>.github.io/pokekatens/version.json)" = 200`.
- [ ] `.exe`: `pokekatens.url` = `https://<usuario>.github.io/pokekatens/`; `npm --prefix desktop run dist`; sin servidor local y sin `--url`, `node tools/desktop-smoke.cjs --exe desktop/dist/win-unpacked/PokeKatens.exe --default` imprime `DESKTOP_SMOKE_OK default`; repartir el instalador.
- [ ] En otro PC: instalar, pasar SmartScreen (**Más información → Ejecutar de todas formas**), crear cuenta, guardar, ver el ranking.
- [ ] Cooperativo probado entre dos PC en redes distintas (sin TURN, en algunas redes no conecta: avisar a los amigos).
- [ ] Opcional: restringir la clave de la API a `<usuario>.github.io` en Google Cloud.
- [ ] Una vuelta atrás hecha a propósito: `git revert` de un commit de prueba + `push`, y ver que los jugadores vuelven a la versión anterior.
- [ ] Decommission (tras una semana publicada): el remoto de JPTER78 ya se llama `upstream` (`git remote get-url upstream`).

**No warnings are ignored.**

### 20.2 Risk register

| Risk | Likelihood | Impact | Early signal | Mitigation |
|---|---|---|---|---|
| Nintendo/The Pokémon Company pide retirar un repositorio público con Pokémon | M | H | Aviso DMCA de GitHub | No comercial, «no oficial», crédito y descargo de Nintendo en el aviso legal; se acepta el riesgo (dueños) |
| Incumplir la licencia de JPTER78 | L | H | Falta el crédito o la *Required Notice* | `LICENSE`, `LICENSE-NONCOMMERCIAL.md`, *Required Notice* y crédito comprobados en los pasos 5, 7 y 13; prohibido cobrar (CLAUDE.md) |
| WebRTC sin TURN no conecta en algunas redes (datos móviles, CGNAT) | M | M | «Conectando…» que no termina en una sala | Documentado en la guía; se acepta (TURN cuesta dinero) |
| SmartScreen o un antivirus bloquean el `.exe` sin firmar | H | M | «Windows protegió su PC» | Instrucciones en la guía; firmar es un no-objetivo |
| Electron 44.9.2 salió el mismo día y trae un fallo | M | M | La app no arranca o el paso 11 falla dentro de Electron | Versión exacta fijada; plan B: el parche 44.x anterior (verificar en el registro antes de cambiar `desktop/package.json` y el `package-lock`) |
| electron-builder 26.15.3 no encaja con Electron 44 o falla al descomprimir herramientas en Windows (enlaces simbólicos) | M | M | El paso 13 falla en `npm --prefix desktop run dist` | Modo de desarrollador de Windows (§10); si es incompatibilidad, probar la 26.18.0 de la etiqueta v26 (verificar antes) |
| Falta Java 21 o el Modo de programador, o los puertos 8080/8123 están ocupados | M | M | El Bootstrap se para con su mensaje; el emulador dice «port taken»; `--default` dice que el 8123 está ocupado | Instalar/activar antes de `/architect-next` (§10); cerrar el programa que use el puerto |
| Cupo diario de Firebase Spark agotado | L | M | Errores `resource-exhausted` en la consola | Topes de escritura ya en el juego; criterio de aborto y kill switch de §9.1 |
| El dominio `.invalid` rechazado por el Firebase real | L | M | `auth/invalid-email` al crear la primera cuenta | Criterio de aborto de §9.1 (cambiar `NAME_DOMAIN` antes de que haya cuentas) |
| `tools/build.js` necesita internet (npx) | M | L | `npx` no descarga | Construir con conexión; tras la primera vez queda en la caché de npm |

### 20.3 Decision log

| # | Decision | Rejected alternative | Why | Would reverse if |
|---|---|---|---|---|
| 1 | Electron como envoltorio | Tauri | Sin Rust ni compilar; mismo Chromium en todos los PC | Si el tamaño del instalador (~100 MB) molesta de verdad |
| 2 | El `.exe` carga la web publicada | Empaquetar el juego dentro del `.exe` | Se actualiza solo con cada `push` (`updater.js`) | Si hace falta jugar sin internet |
| 3 | Firebase propio en plan Spark | Firebase Hosting / otro backend | El código ya está escrito contra Firebase; gratis | Si el cupo gratuito se queda corto de forma habitual |
| 4 | GitHub Pages | Firebase Hosting | Publicar = `git push`, sin desplegar a mano | Si el repo tiene que ser privado (Pages gratis exige público) |
| 5 | Sólo nombre + contraseña | Mantener Google | Menos configuración, sin OAuth | Si muchos jugadores pierden cuentas por olvidar la contraseña |
| 6 | Ventana sin `preload` ni Node, con `sandbox` | Exponer funciones nativas | Carga contenido remoto: exponer algo sería ejecutar código remoto con permisos del PC (aviso de `desktop-app.md`) | Si se necesita una función nativa (no hay ninguna) |
| 7 | Emulador en la config durante la construcción | Construir contra el proyecto real | Ningún paso toca servidores; pruebas repetibles sin cuentas | — (el cambio a real es la lista de lanzamiento) |
| 8 | `G.FORK` en `js/core/fork-config.js` (con `contact` añadido) | Valores sueltos en cada archivo | Una sola fuente; `contact` añadido para no enseñar el correo de JPTER78 en el aviso legal | Si se fusiona con `firebase-config.js` |
| 9 | Pruebas de datos con REST + `fetch` | `@firebase/rules-unit-testing` | Sin dependencias en la raíz; mismas reglas reales | Si las pruebas de reglas crecen mucho |
| 10 | 15 pasos y 3 épicas (el encargo decía 14 y 4) | 14 pasos / 4 épicas | Con el tope de 5 archivos por paso, el trabajo cabe en 15; para 15 pasos sólo son legales 2 o 3 épicas | — |
| 11 | Sin CI | GitHub Actions | Simplicidad para no programadores; el gate se pasa en el PC | Si se publica a menudo con errores |
| 12 | Etiquetas `step-NN-<slug>` puestas con `git tag -f` (el encargo decía `pk-step-NN`) | `pk-step-NN`; `git tag` sin `-f` | El resto de herramientas del bundle cuentan `step-*`; `-f` hace que rehacer un paso tras «Volver atrás» (§9 regla 6) no falle al etiquetar | — |
| 13 | `node --test "tests/*.test.cjs"` | `node --test tests/` | La forma con carpeta sale con exit 1 en Node 24 (comprobado en esta sesión) | Si una versión de Node vuelve a aceptar carpetas |
| 14 | Las cadenas viejas de «Web oficial: pokesurvivor.com» se quedan en los diccionarios | Borrarlas de los 7 diccionarios | Ya no se enseñan (su texto español desapareció) y borrarlas toca 7 archivos sin efecto visible | Si alguien quiere limpiar los diccionarios |
| 15 | Las líneas de crédito sin traducir (sólo español, `translate="no"`); los demás textos nuevos sí se traducen (paso 10) | Traducir también el crédito | Es un texto legal fijo; traducirlo obliga a mantener 7 versiones del mismo aviso | Si hay jugadores que no leen español |
| 16 | Admin = `false` en reglas hasta el lanzamiento | Lista vacía | `false` es inequívoco; la guía da la línea exacta para poner el UID | — |
| 17 | `.invalid` como dominio interno | Un dominio real | Nunca existirá ni recibirá correo | Si Firebase real lo rechaza (criterio de aborto de §9.1) |
| 18 | `tools/make_seo_pages.py` se queda sin usar | Borrarlo | No estorba y es del original | Si confunde a alguien |
| 19 | Identidad de commits por defecto «PokeKatens» si falta | Pararse a preguntar | El PC no tiene `user.name`; los dueños pueden poner la suya cuando quieran | Si los dueños quieren sus nombres en el historial |
| 20 | Bucle `[ -e ]` para la copia de `workspace/` | `rsync`, `cp -n` | Git Bash no trae `rsync`; `cp -n` cambia de código de salida entre plataformas | Si se usa `rsync` |
| 21 | Los textos nuevos de los pasos 3 y 5 se traducen todos juntos en el paso 10 | Traducir en cada paso | Los pasos 3 y 5 ya tienen 5 archivos; el paso 10 ya toca los diccionarios y su prueba vigila los 7 textos | — |
| 22 | Bootstrap se para si faltan Java 21 o el Modo de programador | Avisar y seguir | Fallar al principio, sin haber cambiado nada, es más barato que fallar en los pasos 8 o 13 | — |
| 23 | Instalador sólo de 64 bits (`--x64`) | Arquitectura por defecto de electron-builder | `win-unpacked/` siempre en la misma carpeta, como esperan las pruebas | Si alguien tiene Windows de 32 bits o ARM |
| 24 | `tools/emu.cjs` lanza firebase-tools sin `HTTP_PROXY`/`HTTPS_PROXY` | Heredar el entorno tal cual | Con el proxy local de Claude Code, `emulators:exec` se queda colgado cargando las reglas de `database` (reproducido 3 veces el 2026-10-21; sin las variables pasa con `SIGNUP_OK`) | Si una versión nueva de firebase-tools respeta `NO_PROXY` para 127.0.0.1 |

### 20.4 What to build next

1. Contenido nuevo (Pokémon, ataques, funciones) con las skills `anadir-pokemon`, `anadir-movimiento`, `anadir-funcion` — cuando el lanzamiento esté estable.
2. Inicio con Google — si muchos jugadores olvidan la contraseña.
3. Jugar sin conexión dentro del `.exe` — si los amigos juegan a menudo sin internet.
4. Firma de código — si el juego se reparte fuera del grupo.
5. Versión para macOS/Linux — si alguien del grupo la necesita.

---

*Fin del blueprint. El orden de construcción es §9. Se para cuando §20.1 está en verde.*
