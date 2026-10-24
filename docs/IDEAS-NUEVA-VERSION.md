# Ideas para la nueva versión (para una sola sesión)

> **Hecho (24-10-2026):** los 10 apartados están en el juego (pasos `step-01` … `step-10`). Queda en manos de los
> dueños: desplegar las reglas nuevas de Firestore y volver a convertir las megas con `--megas` en su ordenador
> (ver "Al terminar todo"). Cómo funciona cada cosa: `docs/COMO-FUNCIONA-EL-JUEGO.md`.

Lo que los dueños han elegido para la próxima versión de PokeKatens (24-10-2026). Está pensado para
pasarlo **entero** a una sesión nueva (o a un generador de prompts) y hacerlo todo en esa sesión, en el
orden de abajo: los primeros apartados preparan lo que usan los siguientes.

**Fuera de esta versión (no tocar):** líderes de gimnasio, repetición de partidas, las mejoras visuales
de Reloaded (idea 8 de `docs/IDEAS-RELOADED.md`) y completar la Pokédex.

## Lo común a todo (pégalo también si pasas un apartado suelto)

- Antes de nada, leer `CLAUDE.md` y `docs/COMO-FUNCIONA-EL-JUEGO.md`, y usar la receta (skill) que toque:
  `anadir-funcion`, `anadir-movimiento`, `anadir-pokemon`, y al final de cada apartado `gate`.
- **Un apartado = un paso:** gate en verde, commit (sin ninguna firma de IA, sin push) y etiqueta
  `step-NN-<nombre>`, para poder volver atrás como dice `CLAUDE.md` si algo sale mal.
- Textos nuevos en español con su inglés en `js/data/lang-en.js` y su fila en `js/data/lang-updates.js`
  (francés, italiano, portugués, chino simplificado y tradicional). Cada cambio de juego, en la entrada de
  hoy de `js/data/changelog.js` (usando ya el botón del apartado 1 para las listas largas).
- Lo que se guarde en la nube cumple `firestore.rules`: si cambia qué se guarda, cambiar las reglas y
  añadir un caso en `tests/emulator/` (y pasar la prueba de datos). Pasarle `revisor-reglas` al terminar.
- En cooperativo, lo que tengan que ver los demás va por `js/net/coop.js` + `js/net/codec.js` (subir la
  versión del codec si cambia el formato). El anfitrión es quien mueve a los enemigos.
- Rendimiento: con 420 enemigos el juego va a ~3 ms por frame; en móvil hay menos margen. Nada de efectos
  que recorran todos los enemigos o todos los píxeles cada frame sin necesidad.
- Nada de pago ni servicios nuevos (Firebase plan Spark gratis, sin Identity Platform).
- **Dato del gacha:** en el gacha salen **todos** los Pokémon, legendarios incluidos (`inBanner` en
  `js/systems/gacha.js`). **No** salen las megas, las formas primigenias, las Megapiedras ni los Orbes.

---

## 1. Novedades: listas largas plegadas con un botón "Ver cuáles"

**Objetivo:** que en Novedades una tanda de cosas nuevas (ataques, MT, objetos, Pokémon…) salga como una
línea corta, p. ej. *"10 ataques nuevos de MT"*, con un botón **"Ver cuáles"** que despliega la lista. Hoy
cada entrada pone la línea entera con todos los nombres y se hace muy larga.

**Qué hay hoy:** `js/data/changelog.js` (entradas `{ d, title: [es, en], new / chg / fix: [[es…], [en…]] }`)
y la pantalla en `js/ui/news-ui.js`. Las pruebas de idiomas (`tests/i18n.test.cjs`) miran que cada texto
español tenga su fila en `js/data/lang-updates.js`.

**Qué hacer:**
- Un formato para una línea con lista: p. ej. un objeto `{ t: 'resumen', list: ['Puño Fuego', …] }` en lugar
  de un texto (en español y en inglés), sin romper las entradas antiguas (que siguen siendo texto).
- En `news-ui.js`, esa línea sale con su resumen y un botón "Ver cuáles" / "Ocultar" que despliega la lista
  (se puede usar con el dedo en el móvil y con teclado/mando).
- Las traducciones: el resumen y cada elemento pasan por `lang-updates.js` igual que hoy (adaptar
  `tests/i18n.test.cjs` y la herramienta que genere `js/lang/*.js` si hace falta).
- Pasar a este formato las entradas de PokeKatens que ya tienen listas largas (tandas A–D de MT,
  objetos…). Las de JPTER78 no se tocan.

**Hecho cuando:** las tandas de MT salen plegadas, el botón despliega y pliega en PC y en móvil, se ve bien
en los 7 idiomas y las pruebas pasan.

---

## 2. Megas con buen tamaño y sin pixelar

**Problema (lo han visto los dueños):** algunas megas (p. ej. **Mega Charizard X** y **Mega Metagross**) se
ven pequeñas y pixeladas; parece que todas las megas importadas tienen el mismo tamaño.

**Qué hay hoy (comprobado):** `tools/import_reloaded.py` convierte las megas de Reloaded con `auto_scale`:
las escala para que midan **lo mismo que la forma normal** de SpriteCollab y lo hace con vecino más
próximo a una escala **no entera** (p. ej. ×1,37), que deforma los píxeles. Ejemplos de tamaño de
fotograma (Walk) normal → mega: Charizard 40×48 → 44×38, Mewtwo 48×56 → 40×40, Lucario 32×48 → 22×32,
Sableye 32×40 → 22×27. En partida, `G.Sprites.playerScale` (`js/core/sprites.js`) y `js/systems/mega.js`
deciden el tamaño en pantalla.

**Qué hacer:**
- Medir todas las megas (altura visible de cada mega frente a su forma normal) y sacar una tabla.
- Que una mega **nunca se vea más pequeña** que su forma normal; las que en los juegos son claramente más
  grandes (Charizard, Metagross, Mewtwo, Tyranitar, Aggron, Steelix, Rayquaza, Garchomp…) un poco más
  grandes (p. ej. ×1,15–1,3 de su forma normal). Tabla de tamaños por mega en la herramienta (con valor
  por defecto), para poder ajustar una sin tocar las demás.
- **Sin pixelar:** importar con escala entera (×1 o ×2) o al tamaño nativo de Reloaded y dejar que el
  juego lo escale al dibujar (como ya hace `playerScale`), en vez de reescalar a una escala rara al
  convertir. Elegir lo que deje los bordes más limpios y comprobarlo en una hoja de revisión.
- Volver a convertir con `--megas` (no hace falta la carpeta de Reloaded si se puede trabajar desde las
  hojas ya convertidas; si sí hace falta, la sesión tiene que ser en el ordenador de los dueños, que la
  tiene).
- Hoja de revisión (normal y mega lado a lado, a tamaño de partida) para que la aprueben los dueños.

**Hecho cuando:** Mega Charizard X, Mega Metagross y el resto se ven más grandes que su forma normal (o
iguales si en los juegos lo son), con píxeles limpios, y los dueños aprueban la hoja.

---

## 3. Groudon y Kyogre primigenios

**Objetivo:** que Groudon y Kyogre puedan pasar a su forma primigenia en partida, como las megas.

**Material (comprobado):** SpriteCollab tiene las dos formas, normal y shiny: `sprite/0383/0001`
(Groudon Primal) y `sprite/0382/0001` (Kyogre Primal), con Walk, Attack, Shoot, Charge, Hurt, Idle y Sleep.
**No tienen Faint:** usar Sleep (o el último fotograma de Hurt) como debilitado. Misma licencia que los
demás sprites (CC BY-NC 4.0): sus artistas van en `CREDITS.md` (`tools/fetch_credits.py`). No hace falta
Reloaded.

**Diseño (decidido por los dueños):**
- Funciona como la megaevolución (`js/systems/mega.js`): barra que se llena, tecla F / X / botón, 45 s.
- En vez de Megapiedra, el **Orbe Rojo** (Groudon) y el **Orbe Azul** (Kyogre): Tienda Kecleon (como las
  Megapiedras, sólo el de tu compañero actual) y la misma rareza al ganar una grieta. No salen en el gacha.
- Sprite, tipos, estadísticas y habilidad de su forma primigenia, de PokeAPI (`groudon-primal`,
  `kyogre-primal`), con una herramienta como `tools/fetch_pokedex.py`. Sus habilidades (Tierra del Ocaso /
  Mar del Albor) adaptadas: mientras dure, el clima es sol intenso / lluvia fuerte (`js/systems/weather.js`).
- Texto en la interfaz: "transformación primigenia" (no "megaevolución") donde se vea el nombre.
- Se ve en cooperativo (como el evento `mg` de las megas). Grito: el de su forma normal.

**Hecho cuando:** con Groudon y su Orbe Rojo se transforma con su sprite primigenio (y shiny si lo es),
pone el sol, vuelve a la normalidad, se ve en el otro jugador, y sin Orbe no sale nada.

---

## 4. Ataques exclusivos (uno por tipo)

**Objetivo:** ataques que sólo puede usar un Pokémon concreto (y su familia/mega/forma), como en los
juegos. **Sólo ataques exclusivos de verdad** (los que en los juegos aprende únicamente ese Pokémon):
nada de Esfera Aural, que la aprenden muchos.

**Ojo, conflicto (comprobado):** varios de estos nombres ya están en el juego como **nombre de la
evolución** de un ataque normal (tabla `EVO` de `js/data/moves.js`), y por tanto los usa cualquiera:
Fuego Sagrado (de Giro Fuego), Pulso Primigenio (de Surf), Precipicio Espadas (de Terremoto), Distorsión
(de Pulso Dragón), Golpe Umbrío (de Viento Aciago), Cadena Virulenta (de Bomba Lodo), Geocontrol (de
Fuerza Lunar) y Vapor Volcánico (de Escaldar). **Propuesta:** cambiar el nombre de esas evoluciones por
ataques no exclusivos parecidos (sin cambiar cómo funcionan) y usar el nombre exclusivo para el ataque
nuevo. **Decidido (24-10-2026): se renombran.**

**Candidatos** (nombres en español sacados de PokeAPI, no a mano; comprobar que el Pokémon está en el
juego, p. ej. Pecharunt **no** está):

| Tipo | Ataque | Pokémon |
|---|---|---|
| Volador | Ascenso Draco | Rayquaza |
| Psíquico | Onda Mental | Mewtwo |
| Fuego | Fuego Sagrado | Ho-Oh |
| Agua | Pulso Primigenio | Kyogre |
| Tierra | Precipicio Espadas | Groudon |
| Dragón | Distorsión | Dialga |
| Fantasma | Golpe Umbrío | Giratina |
| Siniestro | Brecha Negra | Darkrai |
| Eléctrico | Placaje Eléctrico | Pichu, Pikachu y Raichu |
| Normal | Sentencia | Arceus |
| Roca | Diamond Storm | Diancie |
| Lucha | Secret Sword | Keldeo |
| Acero | Doom Desire | Jirachi |
| Hada | Geocontrol | Xerneas |
| Hielo | Glaciate | Kyurem |
| Planta | Seed Flare | Shaymin |
| Veneno | por elegir (exclusivo y de un Pokémon que esté) | — |
| Bicho | por elegir (exclusivo y de un Pokémon que esté) | — |

**Qué hacer:**
- Receta `anadir-movimiento` para cada uno: forma de atacar propia y vistosa (más fuerte que un ataque
  normal de su tipo, como corresponde a un ataque de legendario), aspecto, sonido, evolución al nivel
  máximo y textos en 7 idiomas.
- Campo nuevo en el movimiento, p. ej. `only: [dex, …]`: nadie más puede tenerlo (ni por MT, ni por
  cartas, ni por vínculos con otro Pokémon). No se vende en la Tienda Kecleon.
- **Cómo se consigue (propuesta, confirmar con los dueños):** sale como carta especial al subir de nivel
  en la partida (p. ej. a partir del nivel 10) sólo si tu compañero es ese Pokémon; también con su mega o
  forma primigenia.

**Hecho cuando:** con Mewtwo sale Onda Mental, con otro Pokémon no aparece nunca, y cada ataque se ve y se
siente distinto.

---

## 5. Evolución del compañero en partida

**Objetivo:** que tu compañero evolucione durante la run: Charmander → Charmeleon → Charizard, con
animación y grito.

**Diseño propuesto (los dueños confirman los puntos marcados):**
- Al llegar a cierto nivel de la partida evoluciona a la siguiente fase (con sprite en el juego). Niveles
  de la run, no los de los juegos (p. ej. 2.ª fase al nivel 12 y 3.ª al 24) — *confirmar*.
- Si tiene varias evoluciones (Eevee, Ralts…), se elige con una carta.
- Cambian sprite, tipos y estadísticas (de `js/data/pokedex.js`); se quedan los ataques, el objeto, la
  vida en proporción y las mejoras del Pokémon con el que empezaste (las mejoras son de cada Pokémon).
- Animación de evolución (destello blanco, cambia la silueta) y el grito de la nueva forma.
- Shiny: sigue siendo shiny. Si su nueva forma tiene mega, la Megapiedra que vale es la de la forma
  actual — *confirmar*.
- **Decidido:** la forma evolucionada es **sólo dentro de la run** (no pasa a tu colección; para eso, gacha
  o huevo).
- En cooperativo se ve (como la mega). Misión diaria o semanal "Evoluciona a tu compañero" y un logro.

**Hecho cuando:** empiezas con Charmander, evoluciona dos veces en la partida, se ve en el otro jugador y
al acabar la run tu colección sigue igual.

---

## 6. Pokédex de vistos y derrotados

**Objetivo:** un objetivo a largo plazo: apuntar qué Pokémon has visto y derrotado, con premios.

**Diseño propuesto:**
- Se apunta cada especie vista (aparece en pantalla) y derrotada, también en cooperativo.
- Pantalla de Pokédex (desde el menú o la Colección): por región, con silueta si no lo has visto, sprite
  si lo has visto y marca si lo has derrotado; contador "vistos / derrotados / en tu colección".
- Premios por completar: p. ej. derrotar todos los de un tipo o una región da un ticket ×10, y medallas o
  títulos (`js/data/achievements.js`).
- **Guardado ligero:** dos listas compactas de números (o un mapa de bits en texto), no un objeto por
  Pokémon. Cabe en la partida de la nube: cambiar `firestore.rules` (límite de tamaño) y caso en
  `tests/emulator/`. Al juntar aparatos (`G.DB.merge` en `js/core/db.js`) se unen sin perder nada.

**Hecho cuando:** derrotas un Pokémon, sale marcado en la Pokédex, en otro aparato aparece igual y
completar un grupo da su premio.

---

## 7. Rachas y combos

**Objetivo:** premiar jugar bien: si derrotas muchos enemigos seguidos sin que te den, sube un
multiplicador de monedas.

**Diseño propuesto:**
- Contador de racha que sube con cada enemigo derrotado y **se corta al recibir daño**.
- Escalones (p. ej. 50 → ×1,1 de monedas, 150 → ×1,25, 300 → ×1,5), visibles en el HUD (`js/ui/hud.js`)
  con un aviso pequeño al subir de escalón y otro al perderla. Sin tapar la pantalla en el móvil.
- Mejor racha en la pantalla de resultados y en el perfil; un logro (p. ej. racha de 500).
- En cooperativo, cada jugador tiene la suya.

**Hecho cuando:** la racha sube, se corta al recibir un golpe, multiplica las monedas al acabar y se ve en
resultados.

---

## 8. Noche en la partida

**Objetivo:** que las partidas largas cambien de ritmo: pasados unos minutos se hace de noche.

**Diseño propuesto:**
- A partir de cierto minuto (p. ej. el 10), anochece poco a poco y dura unos minutos; luego amanece (y se
  puede repetir).
- **Se ve menos:** la pantalla se oscurece con un círculo de luz alrededor de tu Pokémon (barato: un
  degradado dibujado encima, no píxel a píxel). Los avisos importantes (flecha del shiny, jefes, avisos en
  el suelo) se siguen viendo.
- **Salen otros Pokémon:** más nocturnos (Gastly, Hoothoot, Murkrow, Umbreon, Zubat, Sableye…) según el
  bioma, en `js/systems/spawner.js`.
- **Más premio:** p. ej. +25 % de monedas y experiencia de noche.
- Convive con los climas (`js/systems/weather.js`): de noche puede llover o haber niebla.
- En cooperativo, la hora la marca el anfitrión. Ajuste para quien se marea o ve mal: menos oscuridad
  (en Ajustes, junto a "menos sacudidas").

**Hecho cuando:** al minuto marcado anochece, salen nocturnos, se gana más, va fluido en móvil y se ve
igual en los dos jugadores.

---

## 9. Regalos entre amigos

**Objetivo:** dar motivos para tener amigos y volver cada día: una vez al día puedes mandar un regalo a
cada amigo.

**Diseño propuesto:**
- En la lista de amigos (`js/ui/social-ui.js`, `js/net/social.js`), botón "Regalar" por amigo, una vez al
  día por amigo (hora de España, como las misiones diarias de `js/ui/goals-ui.js`).
- **Decidido:** el regalo es 1 ticket ×1. Quien lo recibe lo abre en un buzón y lo coge.
- Límite de regalos recibidos al día (p. ej. 10) para que no se pueda abusar.
- **Seguridad en `firestore.rules` (lo importante):** que sólo se pueda regalar a un amigo de verdad, una
  vez al día (p. ej. id del documento `de_para_fecha`), que el contenido sea exactamente el permitido, que
  sólo lo lea y lo borre quien lo recibe y que nadie se pueda dar tickets a sí mismo. Casos en
  `tests/emulator/` para cada cosa y `revisor-reglas` al terminar.
- Cuidar el plan gratuito: lecturas y escrituras pocas (leer el buzón al abrir el menú, no en bucle).

**Hecho cuando:** dos cuentas amigas se regalan, el regalo llega y se coge una sola vez, no se puede
regalar dos veces el mismo día ni a quien no es amigo, y las pruebas de datos pasan.

---

## 10. Desafío semanal

**Objetivo:** que cada semana todos jueguen la misma partida y compitan en su propio ranking.

**Diseño propuesto:**
- Cada semana (lunes, hora de España) cambia el desafío: **el mismo mapa** (`js/world/world.js` ya genera
  el mundo con una semilla: usar una sacada de la semana), **el mismo Pokémon** prestado (no hace falta
  tenerlo) y una **condición** sacada de una lista, p. ej. "siempre lloviendo", "sin objetos", "sólo
  ataques de tipo fuego", "los enemigos van más rápido".
- Que el desafío sea igual para todos: todo lo que decida la semana sale de la semilla (no de
  `Math.random`), pero la partida en sí puede seguir siendo aleatoria.
- Entrada desde el menú, con la cuenta atrás hasta el siguiente desafío.
- **Ranking propio de la semana** usando el sistema que ya hay (`js/net/ranking.js`, colecciones `lb` /
  `lbs`): un tablero nuevo por semana, con las mismas comprobaciones contra trampas que los demás, y
  reglas en `firestore.rules` + caso en `tests/emulator/`.
- Premio al acabar la semana o por llegar a ciertas marcas (tickets, medalla, título) — *confirmar*.
- En cooperativo: sólo en solitario al principio — *confirmar*.

**Hecho cuando:** dos cuentas juegan el desafío de la semana con el mismo mapa, Pokémon y condición,
salen en el ranking semanal y la semana siguiente cambia solo.

---

## Al terminar todo

- Novedades del día con todo lo anterior (usando el botón del apartado 1 donde haya listas).
- Gate completo, prueba de datos (se tocan las reglas en 6, 9 y 10) y `revisor-reglas`.
- Apuntar en `docs/COMO-FUNCIONA-EL-JUEGO.md` cómo funciona cada cosa nueva y quitar de este documento
  (o marcar como hecho) lo terminado.
- Commit sin firma de IA. **Push sólo cuando los dueños lo pidan.**
