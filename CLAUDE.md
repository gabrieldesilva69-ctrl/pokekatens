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

## Cómo funciona el juego

Antes de proponer o diseñar algo de juego, lee `docs/COMO-FUNCIONA-EL-JUEGO.md` (controles, combate,
mapa, enemigos, gacha, progresión e ideas pendientes de los dueños). Lo que cuenten los dueños sobre
el juego se apunta ahí, no aquí.

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
- **Cooperativo**: WebRTC directo con STUN gratuito de Google (`js/net/net.js`). Sin TURN. Quien no consigue
  el directo (CGNAT, datos móviles) juega por el relé de la Realtime Database, con un tope al mes
  (`RELAY_CAP_MB`, contador en `relayUse/<AAAA-MM>`) para no pasar del plan gratis (decidido el 25-10-2026).
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

**Material de Pokémon Reloaded (excepción decidida por los dueños):** se pueden usar sprites, gritos,
huevos, fondos y demás de Pokémon Reloaded (creado por F3R, https://pokemon-reloaded.blogspot.com; carpeta `Proyecto Reloaded*/`, en
`.gitignore`), aunque no traigan licencia. Condiciones: se convierte con una herramienta de `tools/`
(nunca se sube la carpeta), sólo lo que se use y ligero; crédito a "Pokémon Edición Reloaded, de F3R" (con enlace a su blog) en
`CREDITS.md` y en Ajustes → Acerca de; **sólo contenido oficial de Pokémon** (nada de sus Pokémon ni
megas inventados). Ideas y formatos: `docs/IDEAS-RELOADED.md`. Para cualquier otra fuente sigue
haciendo falta licencia compatible y crédito.

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

Recetas (skills): `anadir-pokemon`, `anadir-movimiento`, `anadir-funcion`, `publicar-version`, `gate`.
Subagente: `revisor-reglas` (revisa la seguridad de las reglas y de lo que se guarda; sólo lee).
Hooks (`.claude/hooks/`): `proteger-archivos.cjs` bloquea editar los archivos generados, `updater.js` y
las licencias; `probar-idiomas.cjs` pasa las pruebas de idiomas al editar `js/data/lang-*.js` o `changelog.js`.

## No negociable

1. Editar `dev.html`, nunca `index.html`.
2. Commits sin ninguna firma de IA; `push` sólo cuando los dueños lo pidan.
3. Nunca Identity Platform ni ningún servicio de pago; nunca los servidores de JPTER78.
4. No tocar `js/core/updater.js` ni quitar `version.json` de `tools/build.js`.
5. Mantener licencias, *Required Notice* y crédito a JPTER78; nunca cobrar.
6. No dar nada por hecho con el gate en rojo.
