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
- **MT** (Tienda Kecleon): enseñan ataques de fuera de tus tipos que el Pokémon aprende por MT en los juegos
  (`js/data/tms.js`, se regenera con `tools/fetch_tms.py <ids nuevos>`; las que ya había no se tocan). Tanda A de
  la lista de Reloaded (23-10-2026): Terremoto (anillo), Surf (ola que arrastra), Ventisca, Llamarada (cruz),
  Trueno (rayos al azar) y Día Soleado / Danza Lluvia / Tormenta Arena (`kind: 'weather'`, ponen el clima 20 s
  aunque cambies de ataque; en grupo lo pone el anfitrión). Comparten nombre con evoluciones de otros ataques
  (Ascuas → Llamarada, Burbuja → Surf…): son ataques distintos.
  Tanda B (golpes): Puño Fuego / Hielo / Trueno / Drenaje (`punch`: tres directos con su extra), Tijera X
  (`scissor`), Triturar (`shred`: tus golpes +25 % 4 s), Cascada, Megacuerno, Velocidad Extrema (`blitz`) y
  Acróbata (`leap`, ×1,5 sin objeto). Cuentan como cuerpo a cuerpo (−25 % de daño recibido, Guante de Boxeo).
  Velocidad Extrema no es MT en los juegos: la aprenden los que la tienen por nivel o tutor.
  Tanda C (proyectiles): Pulso Dragón (atraviesa todo), Bomba Lodo y Ola-Lava (`puddle`: charco al impactar),
  Escaldar, Fuerza Lunar (`splash`), Vendaval (empuja), Viento Plata (`boost`: a veces sube Ataque y Velocidad),
  Psicocarga, Hidropulso (`stun`) y Roca Afilada (`critUp`: +30 % de críticos).
  Tanda D (apoyo; no hacen daño salvo Explosión): Protección (`guard`: intocable 1,5 s), Descanso (`rest`: cura el
  60 % y duermes 2 s sin moverte ni atacar), Reflejo / Pantalla Luz (`screen`: −35 % de daño físico / especial 8 s),
  Doble Equipo (`decoy`: una copia que atrae a los enemigos a 260 px, menos a los jefes; la mueve el anfitrión) y
  Explosión (`boom`: te cuesta un 25 % de la vida que te queda, nunca KO).
- **Ataques exclusivos** (24-10-2026): 18, uno por tipo, con `only: [dex…]` en `js/data/moves.js` (Ascenso Draco de
  Rayquaza, Onda Mental de Mewtwo, Placaje Eléctrico de Pichu/Pikachu/Raichu…; nombres y quién los aprende, de
  PokeAPI). No van en el pool de su tipo, no hay MT y no evolucionan. Salen como carta especial al subir de nivel desde
  el nivel 10 (`G.Moves.ONLY_LVL`, `systems/levelup.js`) y la ficha de la colección dice cuál es.
- **Evolución del compañero en la partida** (`js/systems/evolve.js`, cadenas en `js/data/evolutions.js` con
  `tools/fetch_evolutions.py`): al nivel 12 (24 para la segunda fase) sale una carta dorada (varias si tiene varias
  evoluciones). Cambian sprite, tipos y stats (con la naturaleza del que empezó); se quedan ataques, objeto, mejoras y
  habilidad. Sólo en la run: la colección, "más usados" y el ranking siguen con el Pokémon con el que empezaste
  (`pl.startDex`). En grupo se ve (evento `pe`).
- **Rachas** (`js/systems/streak.js`): cada enemigo que cae sube la racha y un golpe que hace daño la corta; con
  50 / 150 / 300 las monedas que recoges valen ×1,1 / ×1,25 / ×1,5. Se ve bajo la vida; mejor racha en el resumen y en
  `save.stats.bestStreak`.
- **Tabla de tipos:** p. ej. un Rayo Burbuja le quita más a un Charmander.
- **Climas** de vez en cuando (sol, lluvia, arena, nieve, niebla): potencian unos tipos y debilitan otros.
- **Objetos** que salen en las runs (Restos, Cinta Elección…): 23 equipables, uno por run (`js/data/items.js`;
  los que reaccionan a algo se miran con `pl.hasItem(id)` / `pl.item`). Y 8 de un solo uso que salen de cofres
  (20 %; el de candado, siempre) y jefes (50 %) sin ocupar el hueco: Caramelo Exp. (un nivel al equipo), Bayas
  Zidra, Atania y Meloc (se guardan, una de cada, y se usan solas; repetida, al momento) y cuatro Mochis (+5 %).
  En grupo, Capa Furtiva e Incienso Raro sólo valen si los lleva el anfitrión (es quien mueve a los enemigos).
- **Formas primigenias** (24-10-2026): Kyogre y Groudon, como una mega (`primal:1` en `js/data/megas.js`), con su
  Orbe Azul / Rojo en vez de Megapiedra y lluvia / sol mientras duran. Sprites de SpriteCollab con
  `tools/fetch_forms.py` (`fm:1` en `sprites-meta.js`). No salen en el gacha.
- **Tamaño de las megas** (`G.Mega.megaScale`): en pantalla, todas al menos un 40 % más altas que su forma normal
  (como mucho 1,6 veces lo que dan sus sprites). `tools/import_reloaded.py` ya no las encoge: al volver a convertirlas
  con `--megas` (en el ordenador de los dueños, que tiene la carpeta de Reloaded) salen a su tamaño y sin perder píxeles.
  Faltan Mega Golisopod, Mega Magearna y Mega Tatsugiri: Reloaded no trae sus sprites de mapa (de Magearna sólo un
  dibujo de combate, `data/pkmn/100992.gif`, sin animaciones), así que no tienen Megapiedra.
- **Megaevolución** (`js/systems/mega.js`): con la Megapiedra de tu compañero (Tienda Kecleon, 8000 monedas,
  sólo la de tu compañero actual; o un 3 % al ganar una grieta), una barra se llena con 150 enemigos (un jefe
  cuenta 25) y con F (X en el mando, botón en el móvil) megaevoluciona 45 s: sprite, tipos, estadísticas y
  habilidad de mega (lo que la habilidad hace "al empezar" no se aplica); no cambian la vida, el choque ni
  los ataques. 81 megas, una por especie (`js/data/megas.js`; Charizard la X, Mewtwo la Y). En grupo se ve
  (evento `mg`). Misión semanal "Megaevoluciona 3 veces" sólo si tienes alguna Megapiedra.

## Enemigos

- Tienen **personalidad**: curan, ponen escudos, llaman a su manada o atacan con aviso en el suelo.
- **Shiny salvaje:** cada enemigo tiene 1/4096 de salir shiny (`js/systems/spawner.js`). Brilla, una flecha
  en el borde de la pantalla dice dónde está y, si lo derrotas, te lo quedas.

- **Noche** (`js/systems/night.js`): desde el minuto 7, 3 minutos de cada 10 (sale del reloj: igual en grupo sin red).
  Oscuridad con luz alrededor de tu Pokémon (Ajustes → "Noches oscuras"), la mitad de los enemigos son nocturnos del
  tramo (Fantasma, Siniestro y `NIGHT_DEX` de `js/data/enemies.js`) y +25 % de monedas y experiencia.

- **Efectos visuales** (`js/entities/aura.js`): sólo en tu compañero (y los del grupo), jefes, legendarios y
  shiny; los demás enemigos, nada (rendimiento). Partes que brillan sacadas de los colores del sprite (`SPOTS`,
  más de 220 Pokémon y megas; de noche brillan más; los shiny no, que tienen otros colores), partículas por tipo (`PARTS`),
  contorno de luz (megas, racha ×1,25, jefes y legendarios), destello que cruza a los shiny y efectos propios de
  legendarios y megas (`SPECIAL`, unos 70: aura suave detrás, reloj de Dialga, notas de Meloetta...) y efectos con firma para unos 370 Pokémon conocidos (`SIG`: corazones, notas, Zzz, burbujas, pétalos, esporas, ascuas...). Todo va despacio y a ratos (`wave`); cuanto más grande es lo que brilla, más suave. Se quitan en Ajustes → Gráficos → "Efectos de los Pokémon" (`fx`) o a uno solo desde su ficha (`fxOff`). Con calidad "Baja", sin partículas.

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
- **Huevos** (`js/systems/eggs.js`, Incubadora en la Mochila: `js/ui/egg-ui.js`): salen de las semanales «Gana una
  pelea en una grieta» y «Aguanta X minutos» (región al azar), del gacha (cada 10 tiradas ×10 en un banner) y
  un 5 % al ganar una grieta. El Pokémon se sortea al conseguirlo (como el gacha, sin legendarios; shiny 1/32).
  3 incuban a la vez (avanzan con cada enemigo derrotado, también los del grupo) y 3 esperan; el séptimo da
  200 monedas. Necesitan 500/1000/2000/4000/8000 según la rareza. Huevos de Reloaded, uno por familia
  (`tools/import_eggs.py`). Al juntar aparatos se unen por id sin repetir los abiertos (`G.DB.merge`).
- **Perfil:** enseña tus 3 Pokémon favoritos, tus marcas y tus medallas.
- **Pokédex de vistos y derrotados** (`js/systems/seen.js`): `save.seen` / `save.beat`, mapas de bits en hexadecimal
  (≤ 260 caracteres, lo limita `firestore.rules`) que se unen al juntar aparatos. En la Colección se ven los vistos y
  se marcan los derrotados; cinco logros.
- **Regalos entre amigos** (`G.Social.gift`): un ticket ×1 al día a cada amigo, al buzón `gifts/{uid}/g` con id
  `f_<uid>_<día>` (las reglas sólo lo dejan crear una vez y entre amigos aceptados). Quien lo recibe lo suma al entrar,
  como mucho 10 al día.
- **Desafío semanal** (`js/systems/challenge.js`, botón en el menú): cada semana el mismo mapa, el mismo Pokémon
  prestado (sin mejoras) y una condición para todos, sacados de la semilla de la semana. Sólo en solitario, tabla propia
  del ranking (`s_c<semana>`) y un ticket ×10 la primera vez de la semana que aguantas 3 minutos (`save.wch`).
- **Novedades:** una línea `[es, en, [nombres…]]` de `js/data/changelog.js` sale resumida con un botón "Ver cuáles".

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
| `tools/` | Scripts; los `.py` regeneran lo marcado con \* (Python 3 + Pillow + internet, una sola vez): `fetch_sprites.py` (~20 min, reanudable con `tools/cache/`), `fetch_pokedex.py`, `fetch_credits.py` → `CREDITS.md`. `import_reloaded.py` convierte sprites de mapa de Pokémon Reloaded (`--mega N`, `--megas`, `--dex N`, `--faltan`, `--out` para probar) y marca sus entradas con `rl`. `shiny_from_reloaded.py` hace el shiny de los que SpriteCollab no dibujó, con los colores de los retratos de Reloaded (`rs` en los metadatos; sin `--aplicar` sólo deja la hoja de revisión en `tools/cache/`). `reloaded_ids.py` dice qué número tiene cada Pokémon en Reloaded |

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
  Los 8 que SpriteCollab no dibujó en shiny (588, 820, 847, 868, 896, 916, 933, 1007) lo tienen recoloreado
  con los colores de Pokémon Reloaded (campo `rs`): todos los Pokémon del juego tienen shiny.
- **Números de Reloaded:** no son los de la Pokédex nacional a partir del 494 (mete formas y Pokémon
  inventados por medio: Karrablast es su 596, Koraidon su 1385). Sus archivos van por su número;
  `tools/reloaded_ids.py` lo saca de su lista de nombres (encuentra los 1025) y `file_id` da el archivo:
  hasta el 1000, N normal y 1000+N shiny; del 1001 en adelante, N+1000 y N+2000 (retratos y sprites de
  mapa, que también traen shiny). Las megas: 100000 + ese archivo (101006 Charizard shiny, 102050 Zeraora). `import_reloaded.py` ya busca así.
- **Audio:** sintetizador Web Audio con planificador anticipado (~150 ms por delante) y reverb por
  convolución con un impulso generado. Partituras en `js/data/music.js` (formato de texto propio). Los
  efectos tienen separación mínima entre repeticiones y tope de voces, para no saturar con 400 golpes a la vez.
- **Gritos:** lo único grabado. Los de Pokémon Reloaded en `assets/cries/<dex>.mp3` (`tools/import_cries.py`,
  ~7 KB cada uno; sin grito: Charizard, Pikachu, Eevee, Riolu y Lucario, lista en `js/data/cries.js`).
  `G.Audio.cry(dex)` lo baja la primera vez que suena; uno a la vez. Suenan en el gacha (en la ×10 sólo 4-5★ y
  shiny), al elegir compañero o tocarlo en su ficha, al empezar la partida y al aparecer un jefe, un legendario
  de grieta o un shiny salvaje (en cooperativo, sólo en el aparato que lo crea). Se quitan en Ajustes → Sonido.
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
