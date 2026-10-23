# Cómo funciona el juego (PokeKatens)

Contexto de juego que dan los dueños para pensar ideas nuevas. Lo que dice aquí es cómo **es** el juego
hoy; las ideas que aún no existen van en su apartado al final, marcadas como tales.
El diseño detallado heredado de JPTER78 está en `GDD.md` (puede estar desfasado en lo que PokeKatens cambió).

## Controles y plataforma

- **Móvil o tablet (en horizontal):** el dedo en cualquier sitio y arrastrar para moverse (el joystick
  aparece donde tocas); tocar un ataque de abajo para cambiarlo; botón de arriba a la derecha para pausar.
- Se puede instalar como app ("Añadir a pantalla de inicio").
- **PC:** WASD o flechas, 1-4, Q / E / Tab y P / Esc de fábrica. Las teclas se cambian en Ajustes →
  Controles (dos por acción; Esc siempre pausa y las de las cartas, 1-3 y R, son fijas). Se guardan en
  este navegador, no en la cuenta (`js/core/input.js`).
- **Ajustes:** sonido, calidad gráfica (con modo automático), números de daño, menos sacudidas, FPS,
  ping (sólo en grupo: verde < 100 ms, amarillo hasta 200, rojo más) y la cuenta.
- **Música:** suena tras el primer clic (los navegadores no dejan sonar antes). Volumen y silencio con el
  botón del altavoz arriba a la derecha, o en la pausa.

## Combate

- El Pokémon **ataca solo** con el movimiento activo.
- **Vínculos:** cada legendario vencido deja fusionar movimientos para lanzarlos a la vez desde un solo
  hueco (hasta 4). Con un vínculo ataca con todos los movimientos del vínculo.
- Los movimientos **evolucionan** al llegar a su nivel máximo.
- **Tabla de tipos:** p. ej. un Rayo Burbuja le quita más a un Charmander.
- **Climas** de vez en cuando (sol, lluvia, arena, nieve, niebla): potencian unos tipos y debilitan otros.
- **Objetos** que salen en las runs (Restos, Cinta Elección…).

## Enemigos

- Tienen **personalidad**: curan, ponen escudos, llaman a su manada o atacan con aviso en el suelo.
- **Shiny salvaje:** cada enemigo tiene 1/4096 de salir shiny (`js/systems/spawner.js`). Brilla, una flecha
  en el borde de la pantalla dice dónde está y, si lo derrotas, te lo quedas.

## Mapa

- Las **rocas, cofres y la hierba alta** se rompen.
- Las **paredes y los árboles** bloquean los disparos enemigos.
- El **agua** frena y la **lava** quema (también a los enemigos).
- **Altares de poder**, **manantiales** que curan, **cofres con candado** (quedarse a su lado unos segundos)
  y **trampas** que también dañan a los enemigos.
- **Grietas:** a veces se abre una; al entrar luchas contra un **legendario** en una arena aparte.

## Progresión fuera de la run

- **Mejoras:** son de cada Pokémon (no globales).
- **Gacha:** se paga con **tickets** que se ganan jugando: ×1 (de algunos Pokémon) y ×10 (de jefes y
  legendarios). Se tira en una tragaperras pixel art. Shiny 1 de cada 100 tiradas (`js/systems/gacha.js`).
- **Colección:** eliges tu compañero en versión normal o shiny.
- **Misiones** diarias y semanales: dan tickets y monedas.
- **Logros:** dan medallas y títulos.
- **Perfil:** enseña tus 3 Pokémon favoritos, tus marcas y tus medallas.

## Guardado

- En el PokéSurvivor original el guardado vive sólo en el `localStorage` del navegador (si borras los datos
  del sitio, se pierde).
- **En PokeKatens** hay cuentas en la nube (Firebase): con sesión iniciada en la web publicada, la partida
  se guarda también en la nube; como invitado o fuera de `G.FORK.hosts`, sólo en el navegador (`js/core/db.js`).

## Dónde está cada cosa

Se edita `dev.html` (pantallas y orden de carga); `index.html` y `js/app.min.js` se generan.

| Carpeta | Qué hay |
|---|---|
| `css/style.css` | Interfaz estilo Mundo Misterioso |
| `assets/pokemon/<dex>/` y `<dex>/s/` | Hojas de sprites PMD (Idle, Walk, Attack, Shoot, Charge, Hurt, Faint), normal y shiny |
| `assets/fonts/` | Pixelify Sans (OFL) y su versión con números redibujados (`tools/make_font.py`) |
| `js/core/` | util, db (guardado y nube), audio (sintetizador + efectos), input, touch, gamepad, sprites (animador PMD), camera, i18n, settings, updater, fork-config, firebase-config |
| `js/data/` | pokedex\*, sprites-meta\*, moves, starters, enemies, upgrades, music (partituras), items, abilities, natures, tms, types, shop, missions, achievements, changelog, textos (`lang-*.js`) |
| `js/world/` | tiles (terreno en pixel art por código, biomas y su clima), world (chunks, objetos del mapa, colisiones) |
| `js/entities/` | player, enemy, projectile, pickup, fx, vfx |
| `js/systems/` | combat, spawner, levelup, gacha, weather, hazards, rift (grietas/legendarios), events, interact, judgment, pathing, progress, stats, mons |
| `js/net/` | social (apodo, amigos, salas), net (WebRTC sólo con STUN, sin relé), coop, ranking, codec |
| `js/ui/` | pantallas: menu, login, test (personalidad), hud, run-ui, gacha-ui, shop-ui, goals-ui, settings-ui, social-ui, ranking-ui, news-ui, mod-ui (moderación) … |
| `js/game.js`, `js/main.js` | Flujo y bucle principal; `main.js` tiene `MAINTENANCE` |
| `tools/` | Scripts; los `.py` regeneran lo marcado con \* (Python 3 + Pillow + internet, una sola vez): `fetch_sprites.py` (~20 min, reanudable con `tools/cache/`), `fetch_pokedex.py`, `fetch_credits.py` → `CREDITS.md` |

Donaciones: `js/data/funding.js` y `js/ui/support-ui.js` existen pero están vacíos a propósito (el botón
de Ko-fi no sale nunca). PokeKatens no acepta dinero.

## Notas técnicas

- **Sprites PMD:** columnas = fotogramas, filas = 8 direcciones (Down, DownRight, Right, UpRight, Up,
  UpLeft, Left, DownLeft). Cada animación tiene su propio tamaño de fotograma; se alinean por el ancla al
  suelo sacada del `-Shadow.png` (si no, el sprite saltaría al atacar).
- **Coordenadas:** `(x, y)` de una entidad son sus pies. Las colisiones son en el plano del suelo; los
  proyectiles vuelan en ese plano y se dibujan elevados con su sombra debajo.
- **Mundo:** chunks de 16×16 tiles (`js/world/world.js`). Los datos (terreno, objetos) se generan siempre;
  la imagen se hornea en un `ImageData` (~4 ms por chunk) y sólo para los chunks visibles.
- **Rendimiento:** rejilla espacial de enemigos reconstruida cada frame; con 420 enemigos, simulación +
  render ≈ 3 ms por frame en Chrome. Cualquier idea con muchos enemigos o efectos debe respetar esto
  (en móvil hay menos margen).
- **Metadatos en `.js`, no `.json`:** el juego nació para abrirse con `file://`, donde `fetch()` está bloqueado.
- **Shiny:** en SpriteCollab son el mismo dibujo con otra paleta; están en `s/` y sólo 30 tienen geometría
  distinta (campo `sa` en los metadatos). Las hojas son PNG con paleta exacta (la mitad de peso).
- **Audio:** sintetizador Web Audio con planificador anticipado (~150 ms por delante) y reverb por
  convolución con un impulso generado. Partituras en `js/data/music.js` (formato de texto propio). Los
  efectos tienen separación mínima entre repeticiones y tope de voces, para no saturar con 400 golpes a la vez.
- **Iconos:** mapas de caracteres convertidos a canvas y data URLs, siempre a múltiplos enteros de su tamaño
  para que el píxel quede limpio.

## Créditos de los recursos

- Sprites de SpriteCollab (https://github.com/PMDCollab/SpriteCollab) bajo **CC BY-NC 4.0**: uso no
  comercial y con atribución; la lista de artistas está en `CREDITS.md`. Un sprite nuevo de otra fuente
  necesita una licencia compatible y su crédito, salvo lo de Pokémon Reloaded (abajo).
- **Pokémon Edición Reloaded, de F3R** (https://pokemon-reloaded.blogspot.com): los dueños son fans de ese juego desde hace años y han decidido usar su
  material (sprites, gritos, huevos, fondos…) dándole crédito visible, para que la gente lo conozca y lo
  pruebe. Sólo contenido oficial de Pokémon, nada de sus Pokémon ni megas inventados (ver `CLAUDE.md`).
- Pokémon es propiedad de Nintendo, Creatures Inc. y GAME FREAK. Proyecto de fan sin ánimo de lucro.

## Ideas de los dueños (aún no están en el juego)

Todas detalladas en `docs/IDEAS-RELOADED.md` (con material de Pokémon Reloaded): completar la Pokédex,
gritos en momentos especiales, megaevolución en partida (sólo megas oficiales), objetos nuevos, huevos
(con más shiny que el gacha), más MT y mejoras visuales.
