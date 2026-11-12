# Ataques evolucionados («… +»): inventario y rediseño

Los 123 ataques de `EVO` (`js/data/moves.js`), por forma (`kind`) y por tipo. Todos llevan ya el
envoltorio común de los «+» (commit b0af20c3: borde de luz, destello al lanzar, chispas, aro doble). Aquí está
lo que cada uno tiene de propio encima de eso: su silueta, su estela y su impacto (`js/entities/vfx-plus.js`).
Sólo se ve: daño, radios, alcance, recargas y hitboxes no cambian.

Demo: `node tools/serve.cjs` → http://127.0.0.1:8123/demo/ataques-plus.html · capturas: `node tools/capturas-demo.cjs`
(`demo/capturas/<familia>.png`). Este archivo lo escribe `tools/inventario-plus.cjs` (las ideas están en él).

Hechos: **123 de 123**.

## Reglas de estilo

- Pixel art: formas en la rejilla de `G.VFX` (letras `o d m l w`), paleta del tipo, bordes duros, por fotogramas.
- Nada de `shadowBlur`, `filter`, degradados ni antialias.
- El «+» conserva el tamaño de píxel de su ataque normal: crece por su silueta (2 píxeles de arte más), no inflando los píxeles.
- Rastro de fotogramas: dos siluetas planas detrás (clara, y media tramada). Sin transparencias.
- Partículas con los topes de `G.FX` (`G.FX.spare`: nunca pasan del 85 % del tope). Impacto: como mucho uno cada 90 ms por proyectil.
- Calidad media: un eco y la mitad de partículas. Calidad baja: sólo la silueta con su borde.

## Proyectil (`projectile`) — 15

Ahora (envoltorio común): borde de luz en el proyectil, chispas claras detrás y destello al lanzar.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Pulso Dragón (`dragon-pulse`) | Dragón | ring | El anillo lleva delante un colmillo y apunta; escamas que se desprenden; al golpear, rugido en punta de flecha. | sí |
| Impactrueno (`thunder-shock`) | Eléctrico | bolt, estela spark | Rayo que se bifurca; chispas en zigzag; al golpear, chispazo en cruz y luego en aspa. | sí |
| Esfera Aural (`aura-sphere`) | Lucha | ball, paleta aura, estela spark | Esfera con un aro de aura que le da vueltas; llamitas azules; al golpear, pulso y cruz de luz. | sí |
| Ascuas (`ember`) | Fuego | fire, estela ember | Llama de dos lenguas con el centro al blanco; brasas que suben; al golpear, llamarada de cuatro lenguas. | sí |
| Vendaval (`hurricane`) | Volador | wind | Cuatro arcos de viento más cerrados; rayas de viento; al golpear, remolinos que suben. | sí |
| Bola Sombra (`shadow-ball`) | Fantasma | shadow, estela wisp | Centro encendido y jirones largos que giran; humo morado a bloques; al golpear, revienta en seis jirones. | sí |
| Residuos (`sludge`) | Veneno | blob, estela bubbles | Pegote que burbujea y chorrea; gotas espesas que caen; al golpear, se aplasta contra el suelo y humea. | sí |
| Picotazo Veneno (`poison-sting`) | Veneno | needle | Aguijón con dos pares de púas; surco fino morado; al golpear, cruz de pinchazo y humo. | sí |
| Bomba Lodo (`sludge-bomb`) | Veneno | bubble, estela bubbles | Burbuja con el lodo dentro y burbujas pegadas; burbujitas que suben; al golpear, estalla en burbujas. | sí |
| Confusión (`confusion`) | Psíquico | spiral | Espiral de dos brazos; aritos que se quedan atrás; al golpear, dos ondas rosas. | sí |
| Lanzarrocas (`rock-throw`) | Roca | rock, estela dirt | Roca agrietada con dos esquirlas; piedrecitas y polvo; al golpear, se parte en esquirlas. | sí |
| Roca Afilada (`stone-edge`) | Roca | shard, estela dirt | Hoja de piedra con arista y la cola partida; polvo y chispas del filo; al golpear, púas que salen del suelo. | sí |
| Pistola Agua (`water-gun`) | Agua | drop, estela drip | Gota más llena con sombra y gotitas detrás; gotas que caen; al golpear, corona de agua. | sí |
| Escaldar (`scald`) | Agua | mist, estela wisp | Nube de vapor con el agua hirviendo dentro; vapor que sube; al golpear, nube de vapor y gotas. | sí |
| Hidropulso (`water-pulse`) | Agua | ring | Aro a trazos, aro lleno y gota en el centro; aritos y gotas; al golpear, onda y corona. | sí |

## Golpe (`melee`) — 12

Ahora (envoltorio común): filo de luz y eco por dentro del tajo, chispas en el filo y borde en el sprite del golpe.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Picadura (`bug-bite`) | Bicho | golpe jaws | Mandíbulas más grandes que muerden dos veces y trocitos verdes que saltan. | sí |
| Mordisco (`bite`) | Siniestro | golpe jaws | Colmillos de arriba y de abajo que se cierran, con destello oscuro al chocar. | sí |
| Triturar (`crunch`) | Siniestro | crescent | Mandíbula entera que se cierra y fragmentos oscuros en aspa. | sí |
| Garra Dragón (`dragon-claw`) | Dragón | golpe claw | Garras con llama de dragón en la punta y escamas que saltan. | sí |
| Carantoña (`play-rough`) | Hada | golpe impact | Nube de pelea con estrellas y corazones que salen despedidos. | sí |
| Golpe Kárate (`karate-chop`) | Lucha | golpe impact | Tajo recto con filo blanco y una grieta que corre por delante. | sí |
| Ataque Ala (`wing-attack`) | Volador | golpe feather | Dos tajos de ala paralelos y plumas que caen meciéndose. | sí |
| Lengüetazo (`lick`) | Fantasma | golpe impact | Lengua que barre (arco rosa-morado) y gotas de baba morada. | sí |
| Látigo Cepa (`vine-whip`) | Planta | golpe vine | El látigo se ve: una liana a tramos por el arco, con hojas que giran al soltarse. | sí |
| Placaje (`tackle`) | Normal | golpe impact | El impacto con ocho puntas y un aro de polvo que se abre a ras de suelo. | sí |
| Golpe Cuerpo (`body-slam`) | Normal | golpe impact | Impacto doble (uno grande y otro dentro) y grietas cortas en el suelo. | sí |
| Garra Metal (`metal-claw`) | Acero | golpe claw | Cuatro garras en vez de tres, con brillo que recorre el filo y chispas de metal. | sí |

## Ráfaga radial (`nova`) — 8

Ahora (envoltorio común): borde de luz en cada proyectil, chispas y aro doble al lanzar.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Pulso Umbrío (`dark-pulse`) | Siniestro | ring | Anillos dobles con el centro negro y humo oscuro que se queda. | sí |
| Viento Feérico (`fairy-wind`) | Hada | star | Estrellas de seis puntas con cola de polvo de hada. | sí |
| Onda Ígnea (`heat-wave`) | Fuego | wind, estela ember | Arcos de calor con brasas dentro y el aire que tiembla (rayas que suben). | sí |
| Ola-Lava (`lava-plume`) | Fuego | blob, estela ember | Goterones de lava con costra oscura; brasas y un charco que se apaga. | sí |
| Disparo Lodo (`mud-shot`) | Tierra | blob, estela dirt | Pegotes de barro con piedrecitas; salpican barro al caer. | sí |
| Vozarrón (`hyper-voice`) | Normal | note | Ondas de sonido dobles con una nota entre ellas; al lanzar, tres aros que laten. | sí |
| Psíquico (`psychic`) | Psíquico | eye | Ojo con pestañas de luz y pupila que late; aritos detrás. | sí |
| Burbuja (`bubble`) | Agua | bubble | Burbujas de dos tamaños con brillo; al tocar, estallan en gotitas. | sí |

## Teledirigido (`homing`) — 8

Ahora (envoltorio común): borde de luz, chispas detrás y destello al lanzar.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Golpe Bajo (`sucker-punch`) | Siniestro | fist | Puño con estela oscura; humo negro; al golpear, estrella de golpe. | sí |
| Beso Drenaje (`draining-kiss`) | Hada | heart | Corazón con brillo y alitas; corazoncitos que suben; al golpear, corazón que late. | sí |
| Fuerza Lunar (`moonblast`) | Hada | ball, estela spark | Bola con una media luna dentro; polvo de luna; al golpear, luna que se abre. | sí |
| Tajo Aéreo (`air-slash`) | Volador | crescent | Media luna doble con filo blanco; rayas de viento; al golpear, corte en aspa. | sí |
| Sombra Vil (`shadow-sneak`) | Fantasma | claw | Garra de sombra con ojos; sombra pegada al suelo; al golpear, zarpazo. | sí |
| Energibola (`energy-ball`) | Planta | ball, estela spark | Bola con hojas girando alrededor; hojitas detrás; al golpear, estalla en hojas. | sí |
| Canto Helado (`ice-shard`) | Hielo | shard | Cristal con facetas y punta doble; escarcha que cae; al golpear, se rompe en cristales. | sí |
| Bola Neblina (`mist-ball`) | Psíquico | mist, paleta mist, estela wisp | Nube con una perla dentro; niebla que se queda; al golpear, anillo de niebla. | sí |

## Aura (`aura`) — 7

Ahora (envoltorio común): aro doble y borde de luz en las partículas del aura.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Zumbido (`bug-buzz`) | Bicho | aura note | Ondas de sonido verdes en dos aros desfasados y notas que vibran. | sí |
| Tinieblas (`night-shade`) | Siniestro | aura shadow | Sombras que suben del suelo en columnas y un aro oscuro. | sí |
| Chispazo (`discharge`) | Eléctrico | aura bolt | Rayos cortos en zigzag que saltan entre puntos del borde. | sí |
| Brillo Mágico (`dazzling-gleam`) | Hada | aura star | Destellos en cruz que se encienden por turnos y polvo de hada. | sí |
| Hierba Lazo (`giga-drain`) | Planta | aura heart | Hilos verdes que van de cada enemigo hacia ti, con hojas y corazones por el camino. | sí |
| Terratemblor (`bulldoze`) | Tierra | aura rock | Grietas que salen de ti y piedras que saltan del suelo. | sí |
| Nieve Polvo (`powder-snow`) | Hielo | aura snowflake | Copos de dos tamaños que giran y una capa de escarcha en el borde. | sí |

## Rebote (`bounce`) — 7

Ahora (envoltorio común): borde de luz, chispas detrás y destello al lanzar.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Rayo Señal (`signal-beam`) | Bicho | star, estela spark | Estrella de dos colores que parpadea; destello doble en cada rebote. | sí |
| Bola Voltio (`electro-ball`) | Eléctrico | ball, estela spark | Bola con dos arcos eléctricos que la rodean; chispa en zigzag en cada rebote. | sí |
| Bomba Germen (`seed-bomb`) | Planta | seed | Semilla con brote; al rebotar suelta hojas y cáscara. | sí |
| Bomba Ácida (`acid-spray`) | Veneno | drop, estela bubbles | Gota con burbujas; al rebotar deja una salpicadura que humea. | sí |
| Psicocarga (`psyshock`) | Psíquico | prism, paleta psyviolet, estela spark | Cristal morado con núcleo; aritos morados; al rebotar, onda cuadrada. | sí |
| Joya de Luz (`power-gem`) | Roca | shard, estela spark | Gema tallada con brillo que la recorre; al rebotar, esquirlas de luz. | sí |
| Disparo Espejo (`mirror-shot`) | Acero | prism, estela spark | Espejo con reflejo que cruza; al rebotar, trozos de espejo. | sí |

## Embestida (`dash`) — 5

Ahora (envoltorio común): borde de luz en las copias de la estela y filo en el golpe final.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Ida y Vuelta (`u-turn`) | Bicho | streak | Estela verde que se curva y un destello al dar la vuelta. | sí |
| Megacuerno (`megahorn`) | Bicho | needle | Cuerno grande delante, con rayas de embestida y trozos que saltan. | sí |
| Nitrocarga (`flame-charge`) | Fuego | comet, estela ember | Camino de llamas que se queda un momento en el suelo. | sí |
| Golpe Aéreo (`aerial-ace`) | Volador | streak | Estela doble en V y plumas en el golpe final. | sí |
| Ataque Rápido (`quick-attack`) | Normal | streak | Estela de rayas de velocidad y polvo en el arranque. | sí |

## Abanico (`cone`) — 5

Ahora (envoltorio común): borde de luz en cada disparo y chispas.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Viento Plata (`silver-wind`) | Bicho | wind | Arcos plateados con escamas brillantes que giran. | sí |
| Dragoaliento (`dragon-breath`) | Dragón | fire, estela ember | Llamas moradas con chispas eléctricas dentro. | sí |
| Lanzallamas (`flamethrower`) | Fuego | rayo fire, estela ember | Llamas de tres tamaños, las del centro al blanco, y humo al final del chorro. | sí |
| Ventisca (`blizzard`) | Hielo | snowflake | Copos grandes y pequeños con rayas de viento helado. | sí |
| Rayo Burbuja (`bubble-beam`) | Agua | bubble | Burbujas en fila con brillo y gotitas al estallar. | sí |

## Rayo (`beam`) — 5

Ahora (envoltorio común): filo de luz a trazos por fuera del rayo y borde en lo que viaja por él.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Furia Dragón (`dragon-rage`) | Dragón | rayo fire | Rayo de llama de dragón con cabeza de fuego en la punta. | sí |
| Rayo Hielo (`ice-beam`) | Hielo | rayo shard | Rayo con cristales que crecen en los bordes y escarcha al final. | sí |
| Psicorrayo (`psybeam`) | Psíquico | rayo psiwave | Dos ondas trenzadas en rosa y morado, con aritos. | sí |
| Foco Resplandor (`flash-cannon`) | Acero | rayo shard | Rayo de acero con anillos de luz que lo recorren y destello al final. | sí |
| Hidrobomba (`hydro-pump`) | Agua | rayo drop | Chorro con remolino por dentro, gotas a los lados y corona de agua al final. | sí |

## Giro (`spin`) — 5

Ahora (envoltorio común): filo de luz y eco en cada tajo de la vuelta.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Tajo Umbrío (`night-slash`) | Siniestro | golpe claw | Tajos oscuros con filo morado y sombra que se queda. | sí |
| Enfado (`outrage`) | Dragón | golpe claw | Garras con llama de dragón en cada vuelta y escamas. | sí |
| Patada Giro (`rolling-kick`) | Lucha | golpe impact | Tajo ancho con rayas de patada y polvo. | sí |
| Giro Rápido (`rapid-spin`) | Normal | golpe impact | Aros de velocidad y estrellas que salen despedidas. | sí |
| Giro Bola (`gyro-ball`) | Acero | golpe impact | Aro metálico con dientes que gira y chispas. | sí |

## Aturdir (`stun`) — 5

Ahora (envoltorio común): borde de puntos en la zona y aro doble al estallar.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Onda Trueno (`thunder-wave`) | Eléctrico | ring, estela spark | Anillos eléctricos que se cierran y rayos pequeños dentro. | sí |
| Puño Dinámico (`dynamic-punch`) | Lucha | impact | Puño grande que cae, estrellas de aturdido y grietas. | sí |
| Liofilización (`freeze-dry`) | Hielo | snowflake | Escarcha que crece desde el borde y cristales al estallar. | sí |
| Tumba Rocas (`rock-tomb`) | Roca | rock, estela dirt | Rocas que caen en círculo y polvo. | sí |
| Cascada (`waterfall`) | Agua | streak, estela drip | Columna de agua que cae con espuma abajo. | sí |

## Órbita (`orbit`) — 4

Ahora (envoltorio común): borde de luz en los orbes y chispas que dejan atrás.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Giro Fuego (`fire-spin`) | Fuego | ball, estela ember | Bolas de fuego con cola de llama que se curva. | sí |
| Tornado (`gust`) | Volador | feather | Plumas dobles con rayas de viento. | sí |
| Tormenta Floral (`leaf-storm`) | Planta | spiral | Espirales de hojas con hojas sueltas detrás. | sí |
| Poder Pasado (`ancient-power`) | Roca | ball, estela spark | Piedras con runas que brillan por turnos. | sí |

## Empujón (`shove`) — 4

Ahora (envoltorio común): aro doble y borde de luz en lo que sale despedido.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Voz Cautivadora (`disarming-voice`) | Hada | note | Notas y corazones en ondas rosas. | sí |
| Onda Vacío (`vacuum-wave`) | Lucha | ring, paleta aura | Aros de vacío azules con rayas hacia dentro. | sí |
| Remolino (`whirlwind`) | Volador | spiral | Espirales de viento con hojas arrastradas. | sí |
| Paranormal (`extrasensory`) | Psíquico | eye, paleta psyviolet | Ojos que se abren hacia fuera y un aro morado doble. | sí |

## Puños (`punch`) — 4

Ahora (envoltorio común): filo de luz y eco en cada directo.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Puño Trueno (`thunder-punch`) | Eléctrico | fist, estela spark | Puño con arcos eléctricos y chispazo en el último. | sí |
| Puño Drenaje (`drain-punch`) | Lucha | fist | Puño con aura roja y orbes de energía que vuelven a ti. | sí |
| Puño Fuego (`fire-punch`) | Fuego | fist, estela ember | Puño envuelto en llama, brasas en cada directo y llamarada en el último. | sí |
| Puño Hielo (`ice-punch`) | Hielo | fist | Puño con cristales, escarcha y estallido de hielo en el último. | sí |

## Bumerán (`boomerang`) — 3

Ahora (envoltorio común): borde de luz y chispas a la ida y a la vuelta.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Hoja Afilada (`razor-leaf`) | Planta | leaf | Hoja doble con nervio brillante; hojitas detrás; destello al dar la vuelta. | sí |
| Huesomerang (`bonemerang`) | Tierra | crescent | Hueso entero (no media luna) que gira, con polvo. | sí |
| Psicocorte (`psycho-cut`) | Psíquico | crescent, paleta psyviolet | Media luna morada doble con aritos detrás. | sí |

## Minas (`mine`) — 3

Ahora (envoltorio común): borde de luz en la mina y aro doble al estallar.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Disparo Demora (`string-shot`) | Bicho | web | Telaraña con hilos más largos que tiemblan; al estallar, hilos que atan. | sí |
| Púas (`spikes`) | Tierra | star | Púas de metal con brillo; al estallar, púas que saltan. | sí |
| Púas Tóxicas (`toxic-spikes`) | Veneno | star | Púas moradas que gotean; al estallar, charco y humo. | sí |

## Meteoros (`meteor`) — 3

Ahora (envoltorio común): borde de luz en lo que cae, borde de puntos en la sombra y aro doble.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Granizo (`hail`) | Hielo | shard | Granizo con facetas y cola de escarcha; al caer, cristales. | sí |
| Avalancha (`rock-slide`) | Roca | boulder, estela dirt | Rocas con cola de polvo; al caer, piedras que ruedan. | sí |
| Puño Meteoro (`meteor-mash`) | Acero | rock, estela spark | Meteoro de acero con cola de fuego; al caer, estrella de impacto. | sí |

## Remolino (`vortex`) — 3

Ahora (envoltorio común): borde de puntos alrededor y borde de luz en lo que gira.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Viento Aciago (`ominous-wind`) | Fantasma | wind, estela wisp | Remolino morado con caras de humo. | sí |
| Bucle Arena (`sand-tomb`) | Tierra | mist, estela dirt | Remolino de arena con granos y piedrecitas. | sí |
| Torbellino (`whirlpool`) | Agua | spiral, estela drip | Remolino con brazos de espuma en espiral y gotas que saltan. | sí |

## Cadena (`chain`) — 2

Ahora (envoltorio común): filo de luz en cada salto.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Rayo (`thunderbolt`) | Eléctrico | rayo lightning | Rayo con ramas cortas y un chispazo en cada enemigo que toca. | sí |
| Infortunio (`hex`) | Fantasma | rayo shadow | Cadena de sombras con ojos y humo morado en cada salto. | sí |

## Rastro (`trail`) — 2

Ahora (envoltorio común): borde de puntos en cada charco.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Rueda Fuego (`flame-wheel`) | Fuego | aura fire | Charco de fuego con llamas que bailan y brasas. | sí |
| Tóxico (`toxic`) | Veneno | aura bubble | Charco con burbujas que revientan y humo morado. | sí |

## Torreta (`turret`) — 2

Ahora (envoltorio común): borde de luz en la torreta y en sus disparos.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Fuego Fatuo (`will-o-wisp`) | Fuego | ball, estela ember | Llama azulada con cara y brasas alrededor. | sí |
| Sustituto (`substitute`) | Normal | star | Muñeco con estrellas girando alrededor. | sí |

## Carga (`charge`) — 2

Ahora (envoltorio común): aro doble al cargar y filo a trazos en el rayo.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Rayo Solar (`solar-beam`) | Planta | rayo star | Al cargar, hojas y luz que entran; rayo con hojas dentro. | sí |
| Hiperrayo (`hyper-beam`) | Normal | rayo star | Al cargar, estrellas que entran; rayo con anillos y núcleo blanco. | sí |

## Onda de suelo (`quake`) — 1

Ahora (envoltorio común): aro doble en cada explosión.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Magnitud (`magnitude`) | Tierra | ring, estela dirt | Cada onda con grietas y piedras que saltan, cada vez más grandes. | sí |

## Temblor (`tremor`) — 1

Ahora (envoltorio común): borde de puntos delante del anillo.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Terremoto (`earthquake`) | Tierra | blob | Anillo con grietas radiales y bloques de tierra que se levantan. | sí |

## Ola (`wave`) — 1

Ahora (envoltorio común): filo de luz delante de la ola.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Surf (`surf`) | Agua | drop | Ola con cresta de espuma en dos filas y gotas que saltan por delante. | sí |

## Cruz (`cross`) — 1

Ahora (envoltorio común): filo de luz en la cruz del aviso y aro doble.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Llamarada (`fire-blast`) | Fuego | fire | La cruz con forma de kanji de fuego: cinco brazos con llamas en la punta. | sí |

## Tormenta (`storm`) — 1

Ahora (envoltorio común): rayo más grueso por fuera y borde de puntos en el aviso.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Trueno (`thunder`) | Eléctrico | bolt | Rayo con ramas y un cráter de chispas donde cae. | sí |

## Tijera (`scissor`) — 1

Ahora (envoltorio común): filo de luz y eco en los dos tajos.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Tijera X (`x-scissor`) | Bicho | claw | Los dos tajos dejan una X que se queda un momento y trocitos verdes. | sí |

## Saltos (`blitz`) — 1

Ahora (envoltorio común): borde de luz en la estela y filo en cada golpe.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Velocidad Extrema (`extreme-speed`) | Normal | streak | Imágenes del Pokémon en cada salto y rayas de velocidad. | sí |

## Salto (`leap`) — 1

Ahora (envoltorio común): borde de puntos donde cae y aro doble.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Acróbata (`acrobatics`) | Volador | crescent | Estela en arco del salto, plumas y onda doble al caer. | sí |

## Explosión (`boom`) — 1

Ahora (envoltorio común): aro doble de fuego.

| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |
|---|---|---|---|---|
| Explosión (`explosion`) | Normal | star | Bola de fuego a capas, humo que sube y cascotes. | sí |

