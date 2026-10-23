# Ideas sacadas de Pokémon Reloaded (para pasar a prompts)

Cada idea de abajo va **por separado**: copia un bloque entero (desde su título hasta el siguiente) y pásalo
al generador de prompts. Llévalas en el orden en que están: las primeras preparan lo que usan las siguientes.
La 1 sólo hace falta antes de la 4 (megas); la 2, 3, 5, 6, 7 y 8 se pueden hacer en cualquier orden.
Completar la Pokédex está **aplazado** (al final del documento).

## Lo común a todas (pégalo también en cada prompt)

- El juego es **PokeKatens** (este repositorio). Antes de nada, leer `CLAUDE.md` y
  `docs/COMO-FUNCIONA-EL-JUEGO.md`, y usar la receta (skill) que toque: `anadir-funcion`,
  `anadir-movimiento`, `anadir-pokemon`, y al final `gate`.
- El material de Pokémon Reloaded está en `Proyecto Reloaded The Last Beta 1.9.2.2 Full/data/` (en
  `.gitignore`: **nunca se sube**; lo que se use se convierte y se copia a `assets/`). Los dueños han
  decidido usarlo (excepción escrita en `CLAUDE.md`): crédito visible "Pokémon Edición Reloaded, de F3R" con enlace a https://pokemon-reloaded.blogspot.com en
  `CREDITS.md` y en Ajustes → Acerca de, junto a los créditos que ya hay. Los dueños son fans de ese
  juego y quieren que la gente lo conozca.
- **Sólo contenido oficial de Pokémon.** Nada de los Pokémon inventados de Reloaded (ids `1026+`) ni de
  sus megas inventadas (Mega Raichu X/Y, Garchomp Z, Lucario Z, Absol Z, Mega Darkrai, Meganium…): sólo
  las megas que existen en los juegos oficiales.
- Todo lo que se copie de Reloaded pasa por **una herramienta en `tools/`** que se puede volver a
  ejecutar (no se convierten archivos a mano), y debe ser **ligero**: el juego es una web que cada
  jugador descarga; se carga sólo lo que se usa, cuando se usa.
- Textos nuevos en español con su inglés en `js/data/lang-en.js` y su fila en `js/data/lang-updates.js`
  (francés, italiano, portugués, chino simplificado y tradicional). Novedades en `js/data/changelog.js`.
- Lo que se guarde en la nube tiene que caber en `firestore.rules` (cambiar reglas + caso en
  `tests/emulator/` si hace falta). En cooperativo, lo que vean los demás va por `js/net/` y su codec.
- Gate en verde antes de dar algo por hecho. Commit sin firma de IA y sin push.

### Formatos de Reloaded (comprobados)

| Carpeta | Qué es | Formato |
|---|---|---|
| `pkmnbattle/P<id>_<x>.gmspr` | Sprites del mapa estilo Mundo Misterioso (como los nuestros) | GameMaker 8: 8 bytes de cabecera + zlib. Dentro: `u32` versión (800), origen x, origen y, nº de fotogramas; y por fotograma `u32` versión, ancho, alto, largo + píxeles **BGRA** |
| sufijos `_2 _8 _4 _6 _1 _3 _7 _9` | Direcciones como el teclado numérico (2 abajo, 8 arriba, 4 izq., 6 der., diagonales). 4 fotogramas | Muchos sólo traen 2, 3, 6, 8, 9: la izquierda se saca **en espejo** |
| sufijo `_A` | Atacar (5 fotogramas) | |
| sufijo `_H` | Recibir golpe / girar (5 fotogramas) | |
| sufijo `_S` | Tumbado / dormido (2 fotogramas) → sirve de "debilitado" | |
| sufijo `_ALT` | Forma alternativa (p. ej. Mega X / Mega Y) | |
| ids | `1..1025` normales · `100000+N` mega · `101000+N` mega shiny · `1026+` Pokémon inventados de Reloaded | |
| `pkmn/N.gif`, `pkmn_shiny/(1000+N).gif` | Retratos de frente 96×96 (estilo Negro/Blanco), normal y shiny. Megas en `100000+N` / `101000+N` | Del 1001 en adelante cambia: normal `pkmn/(N+1000).gif`, shiny `pkmn_shiny/(N+2000).gif` |
| `audio/grito/NNN.wav` | 1216 gritos (WAV 44,1 kHz estéreo, ~1,3 s, 66 MB en total). Megas en `100000+N` | Faltan algunos (p. ej. 6, 25, 133, 448): sin grito, no suena nada |
| `huevo/N.gif`, `huevo_shiny/(1000+N).gif` | Un huevo de color para cada familia (80×80, por el Pokémon base) | |
| `trainer/N.gif` | 666 entrenadores (algunos animados, 24 fotogramas) | |
| `battleback/realistic/` | Fondos de combate pintados 576×324 | |
| `caja/N.gif` | 36 fondos de caja PC 156×141 | |
| `image/at_fisico.png`, `at_especial.png`, `at_estado.png` | Iconos de categoría Físico / Especial / Estado | |
| `attack_pkmn/*.txt` | Listas de MT/MO (117), tutores (99) y DT | Texto en Latin-1 |

Hay `ffmpeg` instalado (para los gritos) y Python con Pillow se puede instalar para las herramientas
(ya hay `tools/fetch_sprites.py` como ejemplo de herramienta en Python).

---

## 1. Herramienta de importación de sprites de Reloaded (base para la 4)

**Objetivo:** un `tools/import_reloaded.py` que convierta los `.gmspr` de Reloaded al formato que ya usa
el juego, para poder añadir las formas que nos faltan (ahora, las megas; más adelante, la Pokédex).

**Qué hay hoy:** `assets/pokemon/<dex>/` con hojas PNG `Idle, Walk, Attack, Shoot, Charge, Hurt, Faint`
(+ carpeta `s/` con el shiny) de SpriteCollab; filas = 8 direcciones en el orden Down, DownRight, Right,
UpRight, Up, UpLeft, Left, DownLeft; columnas = fotogramas. Sus medidas, anclas y sombra están en
`js/data/sprites-meta.js` (lo genera `tools/fetch_sprites.py`; hay que leer cómo lo hace y repetirlo).

**Qué hacer:**
- Leer el `.gmspr` (formato de arriba) y montar las hojas: Walk ← direcciones (espejo si falta la
  izquierda), Idle ← primer fotograma de cada dirección, Attack/Shoot/Charge ← `_A` (repetido en las 8
  direcciones, en espejo para la izquierda), Hurt ← `_H`, Faint ← `_S`.
- El ancla de los pies sale del origen (x, y) del `.gmspr`.
- **Mismo tamaño en pantalla** que los de SpriteCollab: comparar con varios Pokémon que tenemos en
  los dos (p. ej. 25, 6, 94, 448) y escalar con vecino más próximo si hace falta.
- Escribir su entrada en `sprites-meta.js` igual que las demás y marcarla como "de Reloaded" (para
  los créditos).
- Opciones: `--mega 6` (una mega, normal y shiny), `--megas` (todas las oficiales) y, para cuando se
  complete la Pokédex, `--dex N` / `--faltan`.

**Hecho cuando:** convertir el 25 de Reloaded a una carpeta de prueba y verlo en el juego al lado del
de SpriteCollab: misma altura, anda en 8 direcciones, ataca, recibe golpes y cae. Después, Mega
Charizard X (normal y shiny) convertido y comprobado igual. No se sustituye ningún Pokémon que ya
tenemos.

---

## 2. Shiny para los 8 Pokémon que no lo tienen

**Objetivo:** que todos los Pokémon del juego tengan shiny. Hoy, de los 966, todos tienen sus 7
animaciones completas, pero **8 no tienen shiny** (SpriteCollab no lo dibujó): **588** Karrablast,
**820** Greedent, **847** Barraskewda, **868** Milcery, **896** Glastrier, **916** Oinkologne,
**933** Naclstack y **1007** Koraidon (en `js/data/sprites-meta.js` no tienen `sh: 1`). Si sale uno de
estos shiny (gacha, salvaje), hoy se ve con los colores normales.

**Material:** Reloaded tiene el retrato normal y el shiny de los 8 (`pkmn/N.gif` y
`pkmn_shiny/(1000+N).gif`; Koraidon en `pkmn/2007.gif` y `pkmn_shiny/3007.gif`). No hace falta la
herramienta de `.gmspr`.

**Qué hacer:**
- Herramienta `tools/shiny_from_reloaded.py`: comparar el retrato normal con el shiny, píxel a píxel
  (son el mismo dibujo con otra paleta), y sacar el **mapa de colores** normal → shiny. Aplicarlo a cada
  una de nuestras hojas de SpriteCollab (`assets/pokemon/<dex>/*.png`) para crear las de `s/`. Los
  colores de nuestras hojas que no estén en el retrato: el color del mapa más parecido (por tono), sin
  tocar el negro de los bordes ni la transparencia.
- Guardar como PNG con paleta, igual que los demás shiny, y poner `sh: 1` en su entrada de
  `sprites-meta.js` (mirar cómo lo escribe `tools/fetch_sprites.py` para no romper la regeneración: si
  hace falta, que esa herramienta respete los shiny añadidos a mano o los marque con un campo).
- Crédito: estos 8 shiny llevan "colores de Pokémon Edición Reloaded" en `CREDITS.md`.
- Hoja de revisión (normal y shiny lado a lado, las 7 animaciones) para que la aprueben los dueños.

**Hecho cuando:** los 8 se ven shiny en la colección y en partida, con colores que coinciden con su
shiny oficial, y el resto de Pokémon sigue igual.

---

## 3. Gritos de los Pokémon en momentos especiales

**Objetivo:** que cada Pokémon suene con su grito en momentos importantes, sin cargar 66 MB.

**Qué hay hoy:** el sonido es un sintetizador propio (`js/core/audio.js`, efectos en `SFX`, volumen de
efectos `sfxBus`, ajustes en Ajustes → Sonido con `G.UI.soundControls`). No hay ningún audio grabado.

**Qué hacer:**
- `tools/import_cries.cjs` (o `.py`): con `ffmpeg`, cada WAV → **mono, 22 kHz, MP3 ~48 kbps** (lo
  leen todos los navegadores, también iPhone) en `assets/cries/<id>.mp3`. Sólo los Pokémon que hay en
  el juego (+ megas `100000+N` si se hace la idea 4). Recortar el silencio. Objetivo: ~5–10 KB cada uno.
  Lista de los que no tienen grito en Reloaded (sin grito: no suena nada, sin error).
- En el juego, `G.Audio.cry(dex, { shiny, mega })`: descarga el archivo la primera vez y lo guarda en
  memoria; suena por el bus de efectos (respeta el volumen y el silencio). Ojo: el juego se puede abrir
  con `file://`, donde `fetch` no va; usar un `Audio()` en ese caso.
- Ajuste nuevo en Ajustes → Sonido: **"Gritos de los Pokémon"** (sí/no, viene en sí).
- Que la copia sin internet del `.exe` (service worker `sw.js`) también guarde los gritos que ya se
  hayan oído (mirar cómo guarda los sprites).
- **Momentos** (y sólo estos, para no cansar):
  1. Gacha: al revelar cada Pokémon. En la tirada ×10, sólo los de 4★ y 5★ y los shiny.
  2. Al elegir compañero (y en su ficha de la colección al tocar el sprite).
  3. Al aparecer un **jefe** o un **legendario** de grieta (una vez).
  4. Al aparecer un **shiny salvaje** (una vez).
  5. Al **megaevolucionar** (idea 4) y al eclosionar un **huevo** (idea 6).
  6. Al empezar la partida, el de tu compañero.
- Como mucho un grito a la vez (si llega otro, se espera o se descarta) y nunca en bucle.

**Hecho cuando:** suenan en esos momentos, se quitan desde Ajustes, la web pesa al cargar lo mismo que
antes (los gritos sólo se bajan al sonar) y los ~800 archivos ocupan menos de 10 MB en total.

---

## 4. Megaevolución en la partida

**Objetivo:** que tu compañero pueda megaevolucionar durante la run un rato, con su sprite de mega.

**Material:** Reloaded tiene sprites de mapa de unas 90 megas (`pkmnbattle/P100000+N_*`) y su shiny
(`P101000+N_*`); las que tienen dos (Charizard, Mewtwo) usan `_ALT` para la segunda.
**Decidido: sólo las megas oficiales** (las de X/Y, Rubí Omega/Zafiro Alfa y Leyendas Z-A). La
herramienta lleva una lista de las oficiales y descarta las inventadas de Reloaded (Mega Raichu X/Y,
Garchomp Z, Lucario Z, Absol Z, Darkrai, Meganium, Scyclaw, Cryogelix…). Si alguna oficial no tiene
sprite en Reloaded, se queda sin mega.

**Diseño propuesto (los dueños confirman cada punto):**
- **Megapiedra de cada especie**: se compra en la Tienda Kecleon (cara, p. ej. 8000 monedas) o sale muy
  raramente de un legendario. Se guarda para siempre en la Mochila (`save.bag`) como las Mentas.
- **En la partida**: si tu compañero tiene su Megapiedra, una barra de "mega" se llena derrotando
  enemigos. Llena → se pulsa la tecla nueva **"Megaevolucionar"** (por defecto **F**; en el mando **X**;
  en el móvil un botón que se coloca con "Colocar los botones") y megaevoluciona **45 s**.
  Después, la barra vuelve a empezar de cero. Si tiene dos megas (X/Y), se elige en la ficha.
- **Qué cambia**: sprite de mega (shiny si tu compañero es shiny), sus estadísticas, tipos y habilidad de
  mega (sacarlos de PokeAPI con una herramienta como `tools/fetch_pokedex.py`; todas son oficiales y
  PokeAPI las tiene, p. ej. `charizard-mega-x`), destello en pantalla, grito de mega (idea 3) y aura en el HUD.
- **Cooperativo**: los demás tienen que ver tu mega: mandar el cambio por la red (`js/net/coop.js` +
  `js/net/codec.js`, subir la versión del codec si cambia el formato).
- Nueva acción en las teclas configurables (`js/core/input.js`, `DEF_KEYS` y `KEY_ROWS` de
  `js/ui/settings-ui.js`) y en el mando (`js/core/gamepad.js`).
- Misión semanal nueva: "Megaevoluciona 3 veces".

**Hecho cuando:** con Charizard y su Megapiedra, la barra se llena, F lo megaevoluciona 45 s con su
sprite y sus tipos de Mega X, vuelve a la normalidad, se ve igual en el otro jugador en cooperativo, y
sin Megapiedra no aparece nada de esto.

---

## 5. Objetos nuevos

**Qué hay hoy:** `js/data/items.js` con 11 objetos equipables (uno por run, salen de cofres y jefes,
`on`/`off` cambian estadísticas del jugador; los que reaccionan a algo se miran con `pl.hasItem(id)`).
Iconos en `js/ui/icons.js` (mapas de caracteres pixel art).

**Objetos propuestos** (sacados de la lista de Reloaded; adaptar al juego y quitar los que no encajen):

| Objeto | Efecto en PokeKatens |
|---|---|
| Botas Gruesas | Inmune a trampas y a la lava; el agua no te frena |
| Metrónomo | Cada 3 s seguidos con el mismo ataque activo: +6 % de daño, hasta +48 %. Se pierde al cambiar |
| Hierba Copia | Los altares de poder te dan el doble de tiempo |
| Capa Furtiva | Los enemigos que curan o ponen escudos no afectan a los que tienes cerca… o: inmune a ralentizaciones |
| Guante de Boxeo | +30 % de daño a los ataques físicos de cuerpo a cuerpo |
| Supertapones | Inmune a los avisos/ataques en el suelo de los enemigos un 30 % del daño |
| Espray Bucal | +25 % de Ataque Especial durante 8 s cada vez que cambias de ataque |
| Dado Trucado | Los ataques con varios proyectiles o golpes lanzan uno más |
| Gafa Protectora | Los climas no te debilitan (sí te potencian) |
| Amuleto Exp. | +20 % de experiencia y +10 % de monedas (más flojo que Huevo Suerte, pero dos cosas) |
| Incienso Suerte | +60 % de monedas, −15 % de daño |
| Incienso Raro | Los shiny salvajes salen el doble de a menudo durante esa run |

**Y una categoría nueva, de un solo uso dentro de la run** (salen en el mapa como premio, no ocupan
el hueco del objeto): **Caramelo Exp.** (subes de nivel al momento), **Bayas** (Baya Zidra: cura el
30 % cuando bajas del 25 %; Baya Atania: +daño 10 s al bajar del 25 %; Baya Meloc: limpia ralentización)
y **Mochis** (+5 % a una estadística hasta acabar la run).

**Qué hacer:** añadirlos a `items.js` (con icono en `icons.js`), engancharlos donde toca en
`js/entities/player.js` / `js/systems/combat.js` / `js/world/world.js`, que salgan en cofres y jefes
como los demás, un logro "Colecciona todos los objetos" y probarlos uno a uno en partida.

**Hecho cuando:** cada objeto hace lo que dice su texto (comprobado en partida) y el gate pasa.

---

## 6. Huevos

**Objetivo:** conseguir Pokémon de otra forma: huevos que se abren jugando.

**Material:** `huevo/N.gif` y `huevo_shiny/(1000+N).gif` — un huevo de color propio para cada familia
(por su Pokémon base). Convertirlos a `assets/eggs/` (PNG pequeños) con una herramienta.

**Diseño propuesto:**
- **De dónde salen**: premio de algunas **misiones** semanales; recompensa del **gacha** (cada 10 tiradas
  ×10 en un mismo banner, un huevo de esa región); y muy raro de un legendario.
- **Incubadora** en el menú (o dentro de la Mochila): hasta **3 huevos a la vez**. Cada huevo pide
  derrotar enemigos para abrirse: 1★ 500 · 2★ 1000 · 3★ 2000 · 4★ 4000 · 5★ 8000 (el evento `kill` ya
  existe en `js/systems/progress.js`). Se ve la barra de cada uno.
- **Qué Pokémon sale**: se decide al conseguir el huevo (rareza y especie al azar de su región, como el
  gacha) y se guarda; el huevo se ve del color de esa familia, así se puede adivinar. **Decidido: más
  shiny que el gacha** (el gacha es 1 de 100): propuesta 1 de 32, y entonces el huevo es el shiny.
- **Eclosión**: animación (el huevo tiembla, se agrieta y aparece el Pokémon con su grito). Si ya lo
  tenías, se convierte en monedas como en el gacha.
- **Guardado**: `save.eggs = [{ id, dex, shiny, need, done, from }]` (máx. 3). Cabe en la partida de la
  nube: comprobar `firestore.rules` y añadir caso en `tests/emulator/`. Que al juntar dos aparatos
  (`G.DB.merge` en `js/core/db.js`) no se dupliquen ni se pierdan huevos.

**Hecho cuando:** consigues un huevo con una misión, se llena jugando, eclosiona con animación, el
Pokémon queda en tu colección y en otro aparato aparece lo mismo.

---

## 7. Más MT (ataques nuevos) — por tandas

**Qué hay hoy:** 103 ataques en `js/data/moves.js`; `js/data/tms.js` (generado con datos de PokeAPI)
dice quién aprende cada uno; la Tienda Kecleon vende 8 MT al día. Una MT sólo puede enseñar un ataque
que exista en el juego, así que **"más MT" = ataques nuevos**.

**Lista de Reloaded**: de sus 117 MT/MO, 29 ya los tenemos y 88 no. Los que mejor encajan en un
juego de supervivencia (cada uno con una forma de atacar distinta), en tandas de 8–10 por prompt:

- **Tanda A (área y clima):** Terremoto (onda alrededor), Surf (ola que cruza la pantalla), Ventisca
  (cono que ralentiza), Llamarada (explosión en cruz), Trueno (rayos al azar), Día Soleado / Danza
  Lluvia / Tormenta Arena (**cambian el clima** del juego, que ya existe en `js/systems/weather.js`).
- **Tanda B (golpes):** Puño Fuego, Puño Hielo, Puño Trueno, Puño Drenaje, Tijera X, Triturar,
  Cascada, Megacuerno, Velocidad Extrema, Acróbata.
- **Tanda C (proyectiles):** Pulso Dragón, Bomba Lodo (deja charco venenoso), Escaldar (quema),
  Fuerza Lunar, Vendaval, Ola-Lava, Viento Plata, Psicocarga, Hidropulso, Roca Afilada.
- **Tanda D (apoyo):** Protección (escudo unos segundos), Descanso (cura mucho y te quedas quieto),
  Reflejo / Pantalla Luz (menos daño físico / especial), Doble Equipo (señuelo), Explosión.
- Fuera (no encajan): Corte, Fuerza, Destello, Buceo, Imagen, Intercambio, Truco, Seducción, Contoneo,
  Dulce Aroma, Mimético.

**Qué hacer por tanda:** receta `anadir-movimiento` para cada ataque (efecto, aspecto, sonido, su
evolución al nivel máximo, textos en 7 idiomas); volver a generar `js/data/tms.js` con quién lo aprende
(mirar cómo se hizo: comentario de su cabecera, datos de PokeAPI) y que la tienda ya los venda.
Equilibrar con el daño de los ataques parecidos que ya hay.

**Hecho cuando:** los ataques de la tanda salen en la tienda para los Pokémon que los aprenden, se
pueden enseñar y se ven y se sienten distintos entre sí en partida.

---

## 8. Mejoras visuales con material de Reloaded (pequeñas, sueltas)

- **Fondos de las grietas**: los legendarios luchan en una arena aparte (`js/systems/rift.js`); usar un
  fondo pintado de `battleback/realistic/` (576×324) según el tipo del legendario, en vez del suelo normal.
- **Avatares de entrenador** para el perfil y la sala de cooperativo: elegir entre unos 40 entrenadores
  de `trainer/` (los animados, en movimiento). Se guarda sólo un número en el perfil (mirar las reglas
  del perfil público en `firestore.rules`, que limitan los campos).
- **Iconos Físico / Especial / Estado** de `image/at_*.png` en las cartas de nivel y en la pausa, en vez
  de la etiqueta de texto actual (`.tag-chip.cat` en `css/style.css`).
- **Retrato grande** (`pkmn/N.gif`, 96×96) en la ficha de la colección y en la pantalla de resultado del
  gacha, con su versión shiny, además del sprite de mapa.
- **Fondos de caja** (`caja/`) como fondo de la colección, uno por región.

---

## Aplazado: completar la Pokédex (los 59 que faltan)

Los dueños lo dejan para más adelante. Notas para cuando se haga:


**Objetivo:** que estén los 1025. Hoy hay 966 con sprite; Reloaded tiene sprite de mapa de **todos**
los que faltan: 514, 516, 520, 522, 523, 538, 558, 564, 565, 591, 592, 593, 616, 618, 626, 668, 683, 732,
733, 735, 756, 765, 837, 838, 839, 865, 866, 870, 878, 879, 893, 929, 931, 942, 943, 944, 945, 947, 948, 949,
950, 954, 956, 962, 973, 986, 990, 993, 999, 1001, 1002, 1003, 1008, 1014, 1020, 1021, 1022, 1023, 1025.

**Por qué faltan:** `tools/fetch_pokedex.py` (`dexes_with_sprites`) sólo mete en `js/data/pokedex.js` los
Pokémon que tienen sprite completo en SpriteCollab. Por eso de esos 59 **no hay ni datos** (estadísticas,
tipos, rareza, habilidades…), no sólo el sprite.

**Comprobado en Reloaded:** los 59 tienen sprite de mapa con abajo, arriba, derecha y diagonales, ataque
y golpe; todos menos 4 (1014, 1020, 1022, 1023) traen además "tumbado" (para esos, usar el último
fotograma del golpe como debilitado). Los 59 tienen retrato normal y shiny. Varios son legendarios o
singulares (Zarude 893, Tesoros del Desastre 1001–1003, Miraidon 1008, Pecharunt 1025…): salen en las
grietas como los demás legendarios (campo `leg`).

**Qué hacer:**
- `tools/fetch_pokedex.py` (y lo que dependa de la misma lista: `tools/fetch_stats.py`, habilidades,
  naturalezas, `js/data/tms.js`…) tiene que aceptar también los Pokémon con sprite de Reloaded. Mirar
  todos los sitios del juego que filtran con `G.SPRITE_META[dex]` (gacha, eventos, grietas, Arceus).
- Con la herramienta de la idea 1 (`--faltan`), añadirlos a `assets/pokemon/`.
- **Shiny por paleta:** Reloaded no trae su shiny de mapa, pero sí el retrato normal y el shiny
  (`pkmn/N.gif` y `pkmn_shiny/(1000+N).gif`). Sacar de esos dos retratos qué color pasa a cuál (mapa de
  colores) y aplicarlo al sprite de mapa para crear su shiny. Si algún color no se encuentra, el más
  parecido. Revisar a ojo una hoja con todos.
- Que salgan en el gacha de su generación, en la colección y como enemigos, igual que los demás
  (mirar `js/systems/gacha.js` → `inBanner` usa `G.SPRITE_META`; datos en `js/data/pokedex.js`).
- Probar con la receta `anadir-pokemon`.

**Hecho cuando:** la colección marca 1025; cada uno se ve, anda y ataca bien, y su shiny tiene colores
razonables (hoja de revisión aprobada por los dueños).



**Sobre los datos:** PokeAPI sí tiene las estadísticas, tipos, habilidades y rareza de los 59 (por
ejemplo https://pokeapi.co/api/v2/pokemon/1025 para Pecharunt). No salen en el juego sólo porque
`dexes_with_sprites()` de `tools/fetch_pokedex.py` descarta los que no tienen sprite completo en
SpriteCollab; con sprite de Reloaded, basta con que esa herramienta los acepte.
