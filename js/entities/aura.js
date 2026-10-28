/* ============ aura.js — detalles que brillan, partículas, contorno y destello shiny ============
 * (24-10-2026.) Efectos que el juego dibuja ENCIMA de los sprites, sin tocar los
 * dibujos de SpriteCollab. Sólo en tu compañero (y los de tu grupo), los jefes,
 * los legendarios y los shiny: con cientos de enemigos el móvil no daría abasto.
 *
 *   - Detalles que brillan (SPOTS): partes de algunos Pokémon que se iluminan y
 *     parpadean (la llama de Charmander, las mejillas de Pikachu, los ojos de Gengar).
 *     Se sacan de los COLORES del sprite, así siguen al Pokémon en cada fotograma y
 *     dirección: `on` los colores que brillan, `avoid` no si tocan uno de estos (la
 *     barriga de Charmander tiene el mismo amarillo que su llama), `grow` y también
 *     estos colores pegados a ellos, `above` / `below` sólo por encima / por debajo de esa
 *     parte de su alto (los ojos de Gengar, no su lengua). Se calcula una vez por hoja
 *     (emissive). Los shiny tienen otros colores: no se encienden (ya llevan su destello).
 *   - Efectos propios de algunos legendarios (SPECIAL): un aura suave detrás, el reloj de
 *     Dialga, las chispas arcoíris de Ho-Oh...
 *   - Despacio y a ratos (24-10-2026): los brillos suben y bajan despacio y las partículas
 *     salen en olas de unos segundos con pausas (wave), no sin parar.
 *   - Se pueden quitar: Ajustes → "Efectos de los Pokémon" y en la ficha de cada uno (enabled).
 *   - En píxeles (24-10-2026): las partículas son cuadraditos en píxeles enteros, como los
 *     sprites, y dejan un rastro pixelado al moverse (las redondas y borrosas no pegaban).
 *   - Partículas suaves según su tipo (PARTS): ascuas, burbujas, hojas, chispas...
 *   - Contorno que brilla (glow): racha alta, jefes y legendarios (al megaevolucionar ya no, 28-10-2026).
 *   - El aura de color de detrás, sólo de noche, salvo los singulares, Arceus y Lucario (28-10-2026).
 *   - Destello shiny: una franja de luz cruza el sprite de vez en cuando.
 * Lo usan entities/player.js, entities/enemy.js, core/sprites.js (Animator.draw:
 * opts.glow / opts.emit / opts.sweep) y ui/ui.js (vista de lujo de la colección).
 */
G.Aura = (() => {
  // ---------------- detalles que brillan ----------------
  // color: el tono del brillo · kind: cómo parpadea y qué suelta (SPOT_PARTS) · keep: brilla con
  // sus propios colores, sin teñir (los de varios colores). Elegidos mirando sus colores uno a uno.
  // (28-10-2026) pulse: se apaga y se vuelve a encender despacio en esos segundos (núcleos, gemas,
  // líneas de energía) · seq: los puntos se encienden uno a uno y luego se apagan todos, en esos
  // segundos (los puntos de los Regi al despertar, como en el anime).
  const SPOTS = {
    4: { on: ['fff700'], avoid: ['dfb700', 'a76f00'], grow: ['d73f00'], color: '#ffb347', kind: 'flame' },   // Charmander: la llama
    5: { on: ['fff700'], color: '#ffb347', kind: 'flame' },                                                    // Charmeleon: la llama
    6: { on: ['fff700'], avoid: ['dfb700', 'a76f00'], grow: ['d73f00'], color: '#ffb347', kind: 'flame' },   // Charizard: la llama
    25: { on: ['d73f00'], color: '#ffe14d', kind: 'spark' },                                                   // Pikachu: las mejillas
    26: { on: ['fff700'], above: 0.3, below: 0.62, color: '#ffe14d', kind: 'spark' },                          // Raichu: las mejillas
    38: { on: ['e73f67', 'ff8faf'], color: '#ff5a8a', kind: 'eye' },                                           // Ninetales: los ojos
    77: { on: ['fff700', 'dfb700'], above: 0.55, color: '#ffb347', kind: 'flame' },                            // Ponyta: la crin
    78: { on: ['fff700', 'ff875f'], above: 0.45, color: '#ffb347', kind: 'flame' },                            // Rapidash: la crin
    94: { on: ['d73f00', '9f0000'], above: 0.4, color: '#ff4a6a', kind: 'eye' },                               // Gengar: los ojos
    135: { on: ['fff700'], above: 0.5, color: '#ffe14d', kind: 'spark' },                                      // Jolteon: el pelo de punta
    145: { on: ['fff700'], above: 0.5, color: '#ffe14d', kind: 'spark' },                                      // Zapdos: las plumas
    146: { on: ['d73f00', 'ff875f'], above: 0.35, color: '#ff8a3d', kind: 'flame' },                          // Moltres: las llamas
    150: { on: ['d797df', 'af6fb7'], color: '#e08aff', kind: 'psy' },                                          // Mewtwo: la cola y la barriga
    151: { on: ['0067b7', '1f9fe7', '8fdfff'], color: '#5fd0ff', kind: 'eye' },                                // Mew: los ojos
    171: { on: ['fff700', 'dfb700'], color: '#fff27a', kind: 'glow' },                                        // Lanturn: las luces
    172: { on: ['d73f00'], color: '#ffe14d', kind: 'spark' },                                                  // Pichu: las mejillas
    181: { on: ['d73f00', '9f0000'], color: '#ff7a4a', kind: 'spark' },                                       // Ampharos: la bola de la cola
    196: { on: ['d73f00', 'ff875f'], color: '#ff4a5a', kind: 'psy' },                                          // Espeon: la gema
    197: { on: ['fff700', 'dfb700'], color: '#ffe14d', kind: 'glow' },                                        // Umbreon: los anillos
    200: { on: ['b70000', 'e73f67'], color: '#ff4a8a', kind: 'eye' },                                          // Misdreavus: el collar
    212: { on: ['fff700', 'dfb700', 'ffffff'], color: '#ffe14d', kind: 'eye' },                                // Scizor: los ojos de las pinzas
    282: { on: ['e73f67', 'ff8faf'], color: '#ff6a8a', kind: 'psy' },                                          // Gardevoir: el cuerno del pecho
    302: { on: ['6787af', 'd73f00'], color: '#7fd0ff', kind: 'eye' },                                         // Sableye: las gemas
    355: { on: ['d73f00'], color: '#ff4a4a', kind: 'eye' },                                                    // Duskull: el ojo
    390: { on: ['ffa747'], color: '#ffb347', kind: 'flame' },                                                  // Chimchar: la llama
    391: { on: ['fff700'], color: '#ffb347', kind: 'flame' },                                                  // Monferno: la llama
    392: { on: ['ff7f57', 'c72f00'], above: 0.6, color: '#ff7a2a', kind: 'flame' },                           // Infernape: la llama
    607: { on: ['8793d9', '6770a1', '414b8d'], above: 0.7, color: '#a58fff', kind: 'flame', parts: { c: ['#c9b5ff', '#8f7bff', '#ffffff'] } }, // Litwick
    609: { on: ['7352e6', '9ccefc'], color: '#a58fff', kind: 'flame', parts: { c: ['#c9b5ff', '#8f7bff', '#ffffff'] } },                      // Chandelure
    // Segunda tanda (24-10-2026): más Pokémon conocidos.
    52: { on: ['dfb700', 'fff700'], color: '#ffe14d', kind: 'glow' },                                         // Meowth: la moneda
    53: { on: ['e73f67', 'ff8faf'], color: '#ff5a7a', kind: 'glow' },                                         // Persian: la gema
    120: { on: ['e73f67', 'ff8faf', 'ffc7d7'], color: '#ff6a8a', kind: 'glow' },                              // Staryu: el núcleo
    121: { on: ['d73f00', '9f0000', 'ff875f'], color: '#ff4a4a', kind: 'glow' },                              // Starmie: el núcleo
    148: { on: ['6787af', '4f5f97'], color: '#7fd0ff', kind: 'glow' },                                        // Dragonair: las perlas
    170: { on: ['fff700', 'dfb700'], color: '#fff27a', kind: 'glow' },                                        // Chinchou: las antenas
    180: { on: ['0087ff', '00c7ff'], color: '#7fd8ff', kind: 'spark', parts: { c: ['#d6f0ff', '#7fd8ff'] } },  // Flaaffy: la bola de la cola
    292: { on: ['47676f', 'afb7bf', '7f8f97', 'ffffff'], above: 0.75, color: '#fff2b0', kind: 'glow' },       // Shedinja: el halo
    310: { on: ['fff700'], above: 0.55, color: '#ffe14d', kind: 'spark' },                                    // Manectric: la crin
    330: { on: ['9f0000', 'd73f00'], color: '#ff4a4a', kind: 'eye' },                                         // Flygon: los ojos
    337: { on: ['d73f00', '9f0000'], color: '#ff4a4a', kind: 'eye' },                                         // Lunatone: el ojo
    338: { on: ['ff9747', 'df771f'], color: '#ffb347', kind: 'flame' },                                       // Solrock: el sol
    344: { on: ['d73f00', 'ff875f'], color: '#ff6a4a', kind: 'eye' },                                         // Claydol: los ojos
    350: { on: ['ff87bf'], color: '#ff9fd0', kind: 'glow' },                                                  // Milotic: las cejas
    354: { on: ['ffe79f', 'dfaf67', 'bf7727'], color: '#ffe680', kind: 'glow' },                              // Banette: la cremallera
    356: { on: ['9f0000', 'd73f00'], color: '#ff4a4a', kind: 'eye' },                                         // Dusclops: el ojo
    376: { on: ['ffffff', 'd7dfdf'], above: 0.3, color: '#bfe8ff', kind: 'glow' },                            // Metagross: la X
    405: { on: ['ffe767', 'e75757'], color: '#ffe14d', kind: 'eye' },                                         // Luxray: los ojos y la estrella
    429: { on: ['b70000', 'e73f67'], color: '#ff5a8a', kind: 'eye' },                                         // Mismagius: el collar
    442: { on: ['00c700', '5f973f', 'cfd727'], color: '#7fff7f', kind: 'eye' },                               // Spiritomb: las almas
    457: { on: ['9fefff', '87d7ff'], color: '#9fefff', kind: 'glow' },                                        // Lumineon: las luces
    461: { on: ['fff700', 'dfb700'], color: '#ffe14d', kind: 'eye' },                                         // Weavile: la gema
    462: { on: ['ffd700', 'df9f27'], color: '#ffe14d', kind: 'spark' },                                       // Magnezone: la antena
    466: { on: ['d73f00', '9f0000'], color: '#ffe14d', kind: 'spark' },                                       // Electivire: las colas
    477: { on: ['9f0000', 'd73f00', 'e7d700', 'c7a700'], color: '#ffd23f', kind: 'eye' },                     // Dusknoir: el ojo y la boca
    479: { on: ['7fcfff', '4f9ff7', '67b7ff', '378fdf'], color: '#7fd8ff', kind: 'spark', parts: { c: ['#d6f0ff', '#7fd8ff'] } }, // Rotom: el plasma
    500: { on: ['f8f000', 'f8912b'], color: '#ffb347', kind: 'flame' },                                       // Emboar: la barba
    571: { on: ['4fd6f3', '29898c'], color: '#6affff', kind: 'eye' },                                         // Zoroark: los ojos
    623: { on: ['f8d898', 'c59c52'], color: '#ffe680', kind: 'glow' },                                        // Golurk: el sello
    637: { on: ['ff7e4f', 'f45a22'], color: '#ff8a3d', kind: 'flame' },                                       // Volcarona: las alas de sol
    681: { on: ['885fa1', '9c85e6'], color: '#c08aff', kind: 'eye' },                                         // Aegislash: el ojo
    700: { on: ['73d6fb', '4294fa', 'b5f7fd'], color: '#9fe8ff', kind: 'glow' },                              // Sylveon: los lazos
    727: { on: ['fff700', 'ff9747'], color: '#ffb347', kind: 'flame' },                                       // Incineroar: el cinturón
    778: { on: ['ff875f', 'd75d33'], color: '#ff6a4a', kind: 'eye' },                                         // Mimikyu: los ojos
    // Tercera tanda (24-10-2026).
    3: { on: ['ff875f', 'd73f00'], color: '#ff9fb0', kind: 'glow' },                                          // Venusaur: la flor
    81: { on: ['d73f00', '0067b7'], color: '#7fd8ff', kind: 'spark', parts: { c: ['#d6f0ff', '#7fd8ff'] } },   // Magnemite: los tornillos
    82: { on: ['1f9fe7', '0067b7', 'd73f00'], color: '#7fd8ff', kind: 'spark', parts: { c: ['#d6f0ff', '#7fd8ff'] } }, // Magneton
    136: { on: ['fff700', 'dfb700'], soft: true, color: '#ffb347', kind: 'flame' },                                        // Flareon: el pelo
    163: { on: ['d73f00', 'ff875f'], color: '#ff7a4a', kind: 'eye' },                                         // Hoothoot: los ojos
    164: { on: ['e73f67', 'ff8faf', 'ffc7d7'], color: '#ff5a8a', kind: 'eye' },                               // Noctowl: los ojos
    176: { on: ['9f0000', 'd73f00', '0067b7', '1f9fe7'], keep: true, color: '#ffffff', kind: 'glow' },        // Togetic: los triángulos
    178: { on: ['d73f00', 'ff875f'], color: '#ff7a4a', kind: 'psy' },                                         // Xatu: los ojos y las alas
    219: { on: ['ff875f', 'fff700', 'dfb700'], color: '#ffb347', kind: 'flame' },                             // Magcargo: la lava
    280: { on: ['e73f67', 'ff8faf'], color: '#ff6a8a', kind: 'psy' },                                         // Ralts: el cuerno
    311: { on: ['d73f00', '9f0000'], color: '#ff6a4a', kind: 'spark', parts: { c: ['#ffd0c0', '#ff6a4a'] } },  // Plusle
    312: { on: ['1f9fe7', '0067b7'], color: '#7fd8ff', kind: 'spark', parts: { c: ['#d6f0ff', '#7fd8ff'] } },  // Minun
    324: { on: ['9f0000', 'd73f00'], color: '#ff8a3d', kind: 'flame' },                                       // Torkoal: el caparazón
    326: { on: ['e73f67', 'ff8faf'], color: '#ff6a8a', kind: 'psy' },                                         // Grumpig: las perlas
    362: { on: ['1f9fe7', '0067b7', '7fcfff'], color: '#7fd8ff', kind: 'ice' },                               // Glalie: los ojos
    366: { on: ['f79fbf', 'e757af', 'ffd7d7'], color: '#ffb3e6', kind: 'glow' },                              // Clamperl: la perla
    374: { on: ['b70000', 'e73f67'], color: '#ff4a4a', kind: 'eye' },                                         // Beldum: el ojo
    375: { on: ['b70000', 'e73f67'], color: '#ff4a4a', kind: 'eye' },                                         // Metang: los ojos
    403: { on: ['ffe767', 'dfbf57'], color: '#ffe14d', kind: 'spark' },                                       // Shinx: los ojos y la cola
    404: { on: ['ffe767', 'dfbf57'], color: '#ffe14d', kind: 'spark' },                                       // Luxio
    426: { on: ['fff700', 'e7a700'], color: '#ffe14d', kind: 'glow' },                                        // Drifblim: la X y las nubes
    436: { on: ['5fb7ff', '97dfff'], color: '#7fd0ff', kind: 'eye' },                                         // Bronzor: los ojos
    468: { on: ['ef0000', '00a7ff', 'a70f00', '0077d7'], keep: true, color: '#ffffff', kind: 'glow' },        // Togekiss: los triángulos
    517: { on: ['ee7aae', 'cc376b'], color: '#ff9fd0', kind: 'psy' },                                         // Munna: las flores
    518: { on: ['e170a1', 'af708c'], above: 0.6, color: '#ff9fd0', kind: 'psy' },                            // Musharna: el humo de sueños
    525: { on: ['c02d12', 'e65a40', 'ffcd41'], color: '#ff7a4a', kind: 'glow' },                              // Boldore: los cristales
    526: { on: ['c7443d', 'ac2121', 'd16863'], color: '#ff6a5a', kind: 'glow' },                              // Gigalith: los cristales
    555: { on: ['eec910', 'ee9e52', 'ee1010'], color: '#ffb347', kind: 'flame' },                             // Darmanitan: las cejas de fuego
    562: { on: ['e02323', 'ff5657'], color: '#ff4a4a', kind: 'eye' },                                         // Yamask: los ojos
    563: { on: ['1de2ff'], color: '#6affff', kind: 'eye' },                                                   // Cofagrigus: los ojos
    599: { on: ['3bb2b3', '71d1d2'], color: '#7fe8e8', kind: 'glow' },                                        // Klink: los engranajes
    600: { on: ['3bb2b3', '71d1d2'], color: '#7fe8e8', kind: 'glow' },                                        // Klang
    601: { on: ['3bb2b3', '71d1d2', 'c85a5a', 'a32d2d'], color: '#7fe8e8', kind: 'glow' },                    // Klinklang: el núcleo
    602: { on: ['fde01e'], color: '#ffe14d', kind: 'spark' },                                                 // Tynamo: las manchas
    603: { on: ['ffd500', 'eedea4'], color: '#ffe14d', kind: 'spark' },                                       // Eelektrik
    604: { on: ['f4e86b'], color: '#ffe14d', kind: 'spark' },                                                 // Eelektross
    605: { on: ['38ce69', '40f6a5', 'd24400', 'f4ba0b'], keep: true, color: '#9fffc0', kind: 'glow' },        // Elgyem: las luces de los dedos
    606: { on: ['6e9e3e', '82c242'], keep: true, color: '#9fff7f', kind: 'glow' },                            // Beheeyem: las luces de los dedos
    615: { on: ['83d5ee', '18c2f8', 'b7cfff'], color: '#9fe8ff', kind: 'ice' },                               // Cryogonal
    636: { on: ['d73f00', '9f0000', 'ff875f'], soft: true, color: '#ff6a1a', kind: 'flame' },                             // Larvesta: los cuernos
    686: { on: ['fdec3a', 'f3b761'], keep: true, color: '#ffe680', kind: 'glow' },                            // Inkay: las luces
    687: { on: ['f6efb7', 'c5ae67', 'db3f8a'], keep: true, color: '#ffe680', kind: 'glow' },                  // Malamar: las luces
    698: { on: ['f1f0a0', 'f6bdb6'], keep: true, color: '#fff2b0', kind: 'glow' },                            // Amaura: los cristales
    699: { on: ['fefeba', 'f5ca76', '7bdfe1'], keep: true, color: '#9fefff', kind: 'glow' },                  // Aurorus: la aurora
    703: { on: ['00aff8', 'bcd6ef'], color: '#9fe8ff', kind: 'glow' },                                        // Carbink: la gema
    737: { on: ['4caad9'], color: '#7fd8ff', kind: 'spark', parts: { c: ['#d6f0ff', '#7fd8ff'] } },           // Charjabug: la batería
    738: { on: ['fff57c', 'd9bc17'], color: '#ffe14d', kind: 'spark' },                                       // Vikavolt
    755: { on: ['cfec7a', 'dba1e2', 'c583cd'], keep: true, color: '#e0b0ff', kind: 'glow' },                  // Morelull: luz de seta
    757: { on: ['e7523f', 'a5423d'], color: '#ff6a8a', kind: 'glow' },                                        // Salandit: las rayas
    758: { on: ['e329ad', 'f974d4'], color: '#ff6ad8', kind: 'glow' },                                        // Salazzle: las rayas
    776: { on: ['ffee41', 'be9113'], soft: true, color: '#ffd23f', kind: 'flame' },                                       // Turtonator: el caparazón
    777: { on: ['f7df5f', 'cfa72f'], color: '#ffe14d', kind: 'spark' },                                       // Togedemaru: las púas
    851: { on: ['ffd901', 'fc6e11', 'e49616'], soft: true, color: '#ffb347', kind: 'flame' },                             // Centiskorch: las llamas
    854: { on: ['69bcac', 'a8dcd4'], color: '#9fe8d0', kind: 'glow' },                                        // Sinistea: el té
    855: { on: ['69bcac', 'a8dcd4'], color: '#9fe8d0', kind: 'glow' },                                        // Polteageist: el té
    873: { on: ['e9ffda', '9fca90'], color: '#9fe8ff', kind: 'ice' },                                         // Frosmoth
    // Cuarta tanda (24-10-2026): propuestas por tools de color y revisadas una a una.
    2: { on: ['d73f00', 'ff875f', '9f0000'], color: '#ff5e38', kind: 'glow' },                              // Ivysaur
    10: { on: ['fff700', 'dfb700', 'a76f00'], color: '#ffd619', kind: 'eye' },                              // Caterpie
    12: { on: ['d73f00', 'ff875f'], color: '#ff7f50', kind: 'eye' },                                        // Butterfree
    24: { on: ['d73f00', '9f0000'], color: '#ff4c19', kind: 'eye' },                                        // Arbok
    46: { on: ['fff700'], color: '#fff719', kind: 'glow' },                                                 // Paras
    47: { on: ['fff700'], color: '#fff719', kind: 'glow' },                                                 // Parasect
    48: { on: ['d73f00', 'ff875f', '9f0000'], color: '#ff4b26', kind: 'eye' },                              // Venonat
    49: { on: ['879fff', '5767b7'], color: '#8ba0ff', kind: 'eye' },                                        // Venomoth
    55: { on: ['ff875f', 'bf7727', 'dfaf67'], color: '#ffb66d', kind: 'glow' },                             // Golduck
    64: { on: ['e73f67'], color: '#ff587f', kind: 'psy' },                                                  // Kadabra
    113: { on: ['b78727', 'd7bf67'], color: '#ffda73', kind: 'glow' },                                      // Chansey
    175: { on: ['1f9fe7', '0067b7', '7fcfff'], color: '#4dbdff', kind: 'psy' },                             // Togepi
    214: { on: ['dfb700', 'a76f00'], color: '#ffca19', kind: 'eye' },                                       // Heracross
    218: { on: ['fff700'], color: '#fff719', kind: 'flame' },                                               // Slugma
    248: { on: ['d73f00', '9f0000'], color: '#ff3519', kind: 'eye' },                                       // Tyranitar
    261: { on: ['d73f00', '9f0000'], color: '#ff3019', kind: 'eye' },                                       // Poochyena
    267: { on: ['d73f00', '9f0000', 'bf7727', 'dfaf67'], color: '#ff9150', kind: 'glow' },                  // Beautifly
    269: { on: ['fff700', 'dfb700'], color: '#ffe619', kind: 'glow' },                                      // Dustox
    285: { on: ['8fff67', '5fb727', '7fdf57'], color: '#97ff64', kind: 'glow' },                            // Shroomish
    343: { on: ['9f0000'], color: '#ff1919', kind: 'eye' },                                                 // Baltoy
    494: { on: ['73acff', '395aac'], color: '#6d9bff', kind: 'eye' },                                       // Victini
    505: { on: ['fad83f'], color: '#ffdf53', kind: 'glow' },                                                // Watchog
    549: { on: ['d73f00', 'ff6a39', 'ff875f'], color: '#ff7848', kind: 'glow' },                            // Lilligant
    561: { on: ['f3c83e', 'caa428'], color: '#ffd54d', kind: 'psy' },                                       // Sigilyph
    570: { on: ['ac1041'], color: '#ff2e70', kind: 'eye' },                                                 // Zorua
    585: { on: ['e5a734', 'f7d154'], color: '#ffcf5b', kind: 'glow' },                                      // Deerling
    586: { on: ['ff7097', 'bb2c4a'], color: '#ff688c', kind: 'glow' },                                      // Sawsbuck
    608: { on: ['ffef5a', 'bc8728'], color: '#a58fff', kind: 'flame' },                                     // Lampent
    648: { on: ['4294aa'], color: '#72e1ff', kind: 'psy' },                                                 // Meloetta
    666: { on: ['df74a3'], color: '#ff90c1', kind: 'glow' },                                                // Vivillon
    708: { on: ['d66f86'], color: '#ff90a9', kind: 'eye' },                                                 // Phantump
    712: { on: ['ffc42d'], color: '#ffc941', kind: 'ice' },                                                 // Bergmite
    790: { on: ['4159b4'], color: '#6c8aff', kind: 'psy' },                                                 // Cosmoem
    796: { on: ['c27e41', 'd1a359'], color: '#ffc173', kind: 'spark' },                                     // Xurkitree
    804: { on: ['ca5198', 'b0489b'], color: '#ff76d2', kind: 'glow' },                                      // Naganadel
    826: { on: ['f7d342', 'c0a24f'], color: '#ffdc63', kind: 'psy' },                                       // Orbeetle
    910: { on: ['ffc53f', 'ffef69'], color: '#ffe36b', kind: 'flame' },                                     // Crocalor
    911: { on: ['ffa300', 'ffeb04'], color: '#ffcc1b', kind: 'flame' },                                     // Skeledirge
    935: { on: ['ff36d3'], color: '#ff4ad7', kind: 'flame' },                                               // Charcadet
    936: { on: ['cfac07'], color: '#ffd821', kind: 'flame' },                                               // Armarouge
    939: { on: ['fff700', 'efc700', 'df8f00'], color: '#ffbf19', kind: 'spark' },                           // Bellibolt
    989: { on: ['d73f00'], color: '#ff5c19', kind: 'spark' },                                               // Pelarena
    1004: { on: ['f3b042'], color: '#ffbf57', kind: 'flame' },                                              // Chi-Yu
    1010: { on: ['ff3263', 'b90730'], color: '#ff3564', kind: 'psy' },                                      // Ferroverdor
    1012: { on: ['6fd973'], color: '#8eff93', kind: 'eye' },                                                // Poltchageist
    1013: { on: ['6fd973'], color: '#8eff93', kind: 'eye' },                                                // Sinistcha
    // Megas (su sprite es otro número).
    100006: { on: ['68c0f0', '118dea', 'a4ddf9', '1898d0'], color: '#5fc8ff', kind: 'flame', parts: { c: ['#a4ddf9', '#5fc8ff', '#ffffff'] } }, // Mega Charizard X
    100150: { on: ['cc6898', 'dc98b8'], color: '#e08aff', kind: 'psy' },                                     // Mega Mewtwo Y
    100181: { on: ['d03800', 'f88058'], color: '#ff9a5a', kind: 'spark' },                                   // Mega Ampharos
    100229: { on: ['e64e22', 'f86534', 'f88058'], color: '#ff8a3d', kind: 'flame' },                         // Mega Houndoom
    100257: { on: ['fe8a16', 'ffc208', 'e64f06'], color: '#ffb347', kind: 'flame' },                         // Mega Blaziken
    100282: { on: ['d1416a', 'ff728c'], color: '#ff6a8a', kind: 'psy' },                                     // Mega Gardevoir
    100302: { on: ['da1a31', 'ff6e91', '940045'], color: '#ff4a6a', kind: 'glow' },                          // Mega Sableye: la gema
    100310: { on: ['fffecc', 'fffec1', '9fe7ff'], color: '#ffe14d', kind: 'spark' },                         // Mega Manectric
    100380: { on: ['f9f400', 'e5e100'], color: '#ffe14d', kind: 'eye' },                                     // Mega Latias
    100381: { on: ['cf3703', '970100'], color: '#ff4a4a', kind: 'eye' },                                     // Mega Latios
    100384: { on: ['fbe361', 'f89c30'], color: '#ffd23f', kind: 'glow', pulse: 9 },                                    // Mega Rayquaza: las líneas
    100485: { on: ['e78f27', 'ffc439'], color: '#ffb347', kind: 'flame' },                                   // Mega Heatran
    100719: { on: ['f2a8c8', 'e371ad'], keep: true, color: '#ffb5de', kind: 'glow' },             // Mega Diancie: los diamantes
    // Legendarios (y los primigenios: su sprite es otro número).
    250: { on: ['5fb727', '9fcf6f', '879fff'], keep: true, color: '#9fffd0', kind: 'glow' },                   // Ho-Oh: las puntas de las alas
    382: { on: ['d73f00', 'ff875f'], color: '#ff6a6a', kind: 'glow', pulse: 9 },                                       // Kyogre: las líneas
    384: { on: ['fff700', 'dfb700'], color: '#ffe14d', kind: 'glow', pulse: 10.5 },                                        // Rayquaza: los anillos
    483: { on: ['97e7f7', 'c7ffff', '67bfe7'], color: '#9fe8ff', kind: 'glow', pulse: 9 },                              // Dialga: el diamante
    484: { on: ['e77fe7', 'b74fb7'], color: '#ff9ff0', kind: 'glow', pulse: 9 },                                       // Palkia: las perlas
    487: { on: ['d73f00', '9f0000'], color: '#ff3a3a', kind: 'eye' },                                         // Giratina: las rayas rojas
    491: { on: ['67b7b7', '4f8f8f', 'd73f00'], color: '#7ff0ff', kind: 'eye' },                               // Darkrai: el collar y el ojo
    493: { on: ['0db54f', '1a8e38', 'fff700'], keep: true, color: '#ffe680', kind: 'glow', pulse: 10.5 },                  // Arceus: la rueda y los ojos
    643: { on: ['10a8a8', '186878'], color: '#6affff', kind: 'eye' },                                         // Reshiram: los ojos
    644: { on: ['209090', '207078', 'e03858'], color: '#7fd8ff', kind: 'spark', parts: { c: ['#bfefff', '#7fd8ff'] } },                           // Zekrom: el generador y los ojos
    646: { on: ['d5f2f0', 'afd5e4'], color: '#c8f4ff', kind: 'ice' },                                         // Kyurem: el hielo
    716: { on: ['ffae00', 'f65952', '7b69b4', '30b5de'], keep: true, color: '#ffe0a0', kind: 'glow' },        // Xerneas: los cuernos
    717: { on: ['f74125', 'ff8442'], color: '#ff4a3a', kind: 'glow' },                                       // Yveltal: las alas
    243: { on: ['b797df', '8f67bf'], above: 0.6, color: '#c9b5ff', kind: 'spark' },                          // Raikou: la nube
    244: { on: ['ff570f', 'd7a700'], color: '#ffb347', kind: 'flame' },                                       // Entei: la crin
    249: { on: ['373f8f', '5767b7'], color: '#9fd0ff', kind: 'glow', pulse: 10.5 },                                        // Lugia: las placas
    251: { on: ['b7cfff', '5767b7', '879fff'], color: '#9fe8ff', kind: 'glow' },                              // Celebi: los ojos y las alas
    377: { on: ['ff875f'], color: '#ffb347', kind: 'glow', seq: 7 },                                                  // Regirock: los puntos
    379: { on: ['ff875f'], color: '#ff8a5a', kind: 'glow', seq: 7 },                                                  // Registeel: los puntos
    385: { on: ['5fc737', '8fff67', '278700'], color: '#7fffa0', kind: 'glow', pulse: 7.5 },                              // Jirachi: las cintas
    386: { on: ['879fff', '5767b7', 'b7cfff'], color: '#7fd0ff', kind: 'glow', pulse: 6 },                              // Deoxys: el cristal
    480: { on: ['cf3f00', 'ff3f00'], color: '#ff4a4a', kind: 'eye', pulse: 7.5 },                                         // Uxie: la gema
    481: { on: ['cf3f00', 'ff3f00'], color: '#ff4a4a', kind: 'eye', pulse: 7.5 },                                         // Mesprit: la gema
    482: { on: ['cf3f00', 'ff3f00'], color: '#ff4a4a', kind: 'eye', pulse: 7.5 },                                         // Azelf: la gema
    485: { on: ['e78f27', 'f7b71f'], color: '#ffb347', kind: 'flame' },                                       // Heatran: la lava
    488: { on: ['ffe78f'], color: '#ffe680', kind: 'glow', pulse: 9 },                                                  // Cresselia: la luna
    649: { on: ['f48673', 'd36450'], color: '#ff6a5a', kind: 'eye' },                                         // Genesect: los ojos
    718: { on: ['93bc3e', '52813b'], color: '#7fff6a', kind: 'glow', pulse: 7.5 },                                        // Zygarde: las células
    720: { on: ['d3a717', 'f9c51a'], color: '#ffe14d', kind: 'glow', pulse: 9 },                                        // Hoopa: los aros
    721: { on: ['52b2ff', '73ceff'], color: '#7fd0ff', kind: 'glow' },                                        // Volcanion: el aro del brazo
    785: { on: ['f3901e', 'd66531'], color: '#ffe14d', kind: 'spark' },                                       // Tapu Koko: la cresta
    791: { on: ['ffab28', 'fede70'], color: '#ffd27f', kind: 'glow', pulse: 9 },                                        // Solgaleo: el sol
    792: { on: ['7cd8ed', '3b8bd8', 'ff268f'], color: '#c9b5ff', kind: 'glow', pulse: 9 },                              // Lunala: el pecho
    800: { on: ['f47b42', 'dc5343', '70bf4c', '6967af'], keep: true, color: '#ffffff', kind: 'eye', pulse: 7.5 },         // Necrozma: el prisma
    802: { on: ['ffef7b', 'ff8a66', 'ff6543'], color: '#ff8a5a', kind: 'eye' },                               // Marshadow: los ojos
    807: { on: ['38c0e5', '77faff', '3cdfe2'], color: '#7fd8ff', kind: 'spark', parts: { c: ['#d6f0ff', '#7fd8ff'] } }, // Zeraora
    849: { on: ['d793ff', '9b5bc1'], color: '#d793ff', kind: 'spark', parts: { c: ['#f0d6ff', '#d793ff'] } }, // Toxtricity
    890: { on: ['ff5858', 'cf2934'], color: '#ff5a6a', kind: 'glow', pulse: 6 },                                        // Eternatus: el núcleo
    789: { on: ['d8b000', 'eeed83', '28afea', '8dd5f3'], keep: true, color: '#9fe8ff', kind: 'glow', pulse: 7.5 },         // Cosmog: la nube de estrellas
    793: { on: ['6abde0', '8fdfff', '227da4'], color: '#9fe8ff', kind: 'glow' },                              // Nihilego
    801: { on: ['d3676d', 'ffd5d6', 'e6d05a'], keep: true, color: '#ff9fb0', kind: 'glow', pulse: 3.9 },                  // Magearna: el corazón
    809: { on: ['f6be13', 'd68414'], soft: true, color: '#ffd23f', kind: 'glow' },                                        // Melmetal: la tuerca
    894: { on: ['fef9b4'], soft: true, color: '#ffe14d', kind: 'spark' },                                                  // Regieleki
    897: { on: ['f7d1fc', 'af97d9'], color: '#c9b5ff', kind: 'glow' },                                        // Spectrier: la crin
    100382: { on: ['fff3ad', 'f5c26b', 'bc708c'], color: '#7fe8ff', kind: 'glow', pulse: 7.5 },                          // Kyogre primigenio: las líneas
    100383: { on: ['fef9bb'], color: '#ffd27f', kind: 'flame' },                                              // Groudon primigenio: la lava
    // Quinta tanda (28-10-2026): más legendarios, como se ven en el anime y los juegos.
    144: { on: ['d73f00'], color: '#ff4a4a', kind: 'eye' },                                                  // Articuno: los ojos
    245: { on: ['d797df', 'af6fb7'], color: '#e8c8ff', kind: 'glow', pulse: 9 },                              // Suicune: la crin de aurora
    383: { on: ['ffe79f', 'bf7727'], color: '#ffd23f', kind: 'eye' },                                         // Groudon: los ojos
    490: { on: ['ffcf77', 'efb700', 'cf3f67'], color: '#ffe680', kind: 'glow', pulse: 7.5 },                    // Manaphy: las antenas y la gema
    492: { on: ['ff87bf', 'ffafe7'], color: '#ffb3e6', kind: 'glow', pulse: 9 },                              // Shaymin: las flores
    719: { on: ['ffb5de', 'fae7f7'], keep: true, color: '#ffb5de', kind: 'glow', pulse: 7.5 },                  // Diancie: el diamante
    889: { on: ['ffd74e'], color: '#ffe14d', kind: 'eye' },                                                  // Zamazenta: los ojos
    641: { on: ['ffc500'], color: '#ffe14d', kind: 'eye' },                                                  // Tornadus: los ojos
    642: { on: ['ffc500'], color: '#ffe14d', kind: 'eye' },                                                  // Thundurus: los ojos
    645: { on: ['ffc500'], color: '#ffe14d', kind: 'eye' },                                                  // Landorus: los ojos
    786: { on: ['f94587', 'ffb5de'], color: '#ff8ad8', kind: 'glow', pulse: 9 },                              // Tapu Lele: el caparazón
    787: { on: ['eedd27', 'd3c318'], color: '#ffe14d', kind: 'glow', pulse: 9 },                              // Tapu Bulu: los cuernos
    788: { on: ['c1dafe'], color: '#c9e0ff', kind: 'glow', pulse: 10.5 },                                       // Tapu Fini: el caparazón
    378: { on: ['ffe79f', 'dfaf67'], color: '#ffc21a', kind: 'glow', seq: 7 },                                // Regice: los puntos
    486: { on: ['cf0000', '1f9fe7'], color: '#ffc21a', kind: 'glow', seq: 8 },                                // Regigigas: los puntos
    895: { on: ['ff285a', 'ff5d83', 'cf2e4a'], color: '#ff4a7a', kind: 'glow', pulse: 7.5 },                    // Regidrago: la cabeza de dragón
    489: { on: ['c7171f', 'ef3f57'], color: '#ff4a6a', kind: 'eye' },                                         // Phione: la gema
    638: { on: ['e6cd7b', 'c49f61'], color: '#ffe680', kind: 'glow', pulse: 9 },                              // Cobalion: los cuernos (Espada Santa)
    639: { on: ['f18c3c', 'ab4924'], color: '#ffb347', kind: 'glow', pulse: 9 },                              // Terrakion: las marcas
    640: { on: ['e06b88'], color: '#ff7aa0', kind: 'eye' },                                                  // Virizion: los ojos
    773: { on: ['c03045'], color: '#ff4a5a', kind: 'eye' },                                                  // Silvally: los ojos
    808: { on: ['f6be13', 'd68414'], soft: true, color: '#ffd23f', kind: 'glow', pulse: 7.5 },                  // Meltan: la tuerca
    905: { on: ['f9005e', 'e5678d'], color: '#ff5a9a', kind: 'glow', pulse: 9 },                              // Enamorus: los corazones
    1007: { on: ['ff71df', '983df8', '1e78ff'], keep: true, color: '#ffb0f0', kind: 'glow', pulse: 7.5 },       // Koraidon: el plumaje
    1015: { on: ['f711e4'], color: '#ff6ad8', kind: 'glow', pulse: 7.5 },                                      // Munkidori: el pelo tóxico
    1016: { on: ['e8bb05', 'c48509'], color: '#ffd23f', kind: 'glow', pulse: 9 },                              // Fezandipiti: la cresta
    1017: { on: ['fff700', 'dfb700'], color: '#ffe680', kind: 'eye' },                                        // Ogerpon: la máscara
    1024: { on: ['7fe7a7', '5fbfdf'], keep: true, color: '#9fe8ff', kind: 'glow', pulse: 7.5 }                  // Terapagos: el caparazón de cristal
  };
  const hex = c => [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  const masks = new WeakMap();              // hoja -> { dex -> { c: canvas, pts: Map(celda -> [x, y, ...]) } o null }

  /** Hoja con sólo los píxeles que brillan de ese Pokémon, teñidos de su color (o null),
   *  y por cada fotograma (celda "sx,sy") dónde están esos píxeles (para soltar partículas
   *  desde el detalle: ascuas de la llama, chispas de las mejillas...). m: geometría (w, h, ay). */
  function spotsOf(img, dex, m) {
    const rule = SPOTS[dex];
    if (!rule || !img || !img.width) return null;
    let per = masks.get(img);
    if (!per) masks.set(img, per = {});
    if (dex in per) return per[dex];
    let out = null;
    try {
      const w = img.width, h = img.height;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0);
      const src = x.getImageData(0, 0, w, h), d = src.data;
      const set = l => new Set((l || []).map(v => hex(v).join(',')));
      const on = set(rule.on), avoid = set(rule.avoid), grow = set(rule.grow);
      const col = i => (d[i + 3] > 40 ? d[i] + ',' + d[i + 1] + ',' + d[i + 2] : '');
      const near = (px, py, s) => {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const qx = px + dx, qy = py + dy;
          if (qx >= 0 && qy >= 0 && qx < w && qy < h && s.has(col((qy * w + qx) * 4))) return true;
        }
        return false;
      };
      // above / below: sólo por encima / por debajo de esa parte del alto (desde los pies, como en Idle).
      const idle = G.Sprites.animMeta(dex, 'Idle'), tall = idle ? idle.ay : 24;
      const high = py => !m || ((!rule.above || (m.ay - (py % m.h)) > tall * rule.above) && (!rule.below || (m.ay - (py % m.h)) < tall * rule.below));
      const keep = new Uint8Array(w * h);
      for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
        if (on.has(col((py * w + px) * 4)) && high(py) && !(avoid.size && near(px, py, avoid))) keep[py * w + px] = 1;
      }
      if (grow.size) {
        const add = [];
        for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
          const i = py * w + px;
          if (keep[i] || !grow.has(col(i * 4))) continue;
          for (let dy = -1; dy <= 1 && !keep[i]; dy++) for (let dx = -1; dx <= 1; dx++) {
            const qx = px + dx, qy = py + dy;
            if (qx >= 0 && qy >= 0 && qx < w && qy < h && keep[qy * w + qx] === 1) { add.push(i); break; }
          }
        }
        for (const i of add) keep[i] = 2;
      }
      // Teñidos de su color, casi blanco (el centro de una luz): al sumarse encima del sprite
      // se nota aunque sea amarillo sobre amarillo; el halo (sprites.js) va de su color.
      // Con keep, sus propios colores (aclarados).
      const res = x.createImageData(w, h), r = res.data, tint = hex(rule.color.slice(1)).map(v => Math.round(v + (255 - v) * 0.5));
      const pts = new Map();
      // soft: los que brillan en una zona muy grande (la tuerca de Melmetal, el cuerpo de
      // Regieleki), más suave cuanto más grande. Los demás, a tope, como en la primera versión.
      let soft = 255;
      if (rule.soft) {
        let lit = 0, body = 0;
        for (let i = 0; i < w * h; i++) { if (d[i * 4 + 3] > 40) body++; if (keep[i]) lit++; }
        soft = Math.round(255 * Math.max(0.35, Math.min(1, 0.12 / Math.max(0.001, lit / Math.max(1, body)))));
      }
      let any = false;
      for (let i = 0; i < w * h; i++) {
        if (!keep[i]) continue;
        any = true;
        if (rule.keep) for (let j = 0; j < 3; j++) r[i * 4 + j] = Math.min(255, d[i * 4 + j] + 60);
        else { r[i * 4] = tint[0]; r[i * 4 + 1] = tint[1]; r[i * 4 + 2] = tint[2]; }
        r[i * 4 + 3] = soft;
        if (m) {
          const px = i % w, py = (i - px) / w, key = (px - px % m.w) + ',' + (py - py % m.h);
          let l = pts.get(key);
          if (!l) pts.set(key, l = []);
          l.push(px % m.w, py % m.h);
        }
      }
      if (any) { x.clearRect(0, 0, w, h); x.putImageData(res, 0, 0); out = { c, pts }; }
    } catch (e) { /* file:// no deja leer los píxeles: sin brillo */ }
    per[dex] = out;
    return out;
  }

  const emissive = (img, dex, m) => { const o = spotsOf(img, dex, m); return o ? o.c : null; };

  // ---------------- ritmo: despacio y a ratos ----------------
  // (24-10-2026) Los efectos no van siempre a tope: suben y bajan despacio, y las partículas
  // salen en "olas" de unos segundos con pausas entre medias (cada Pokémon, a su aire).
  /** 0..1: ola suave que dura `on` segundos de cada `every` (`seed` desfasa a cada uno). */
  function wave(t, seed, every, on) {
    const k = (((t + seed) % every) + every) % every;
    return k < on ? Math.sin(Math.PI * k / on) : 0;
  }
  const seedOf = ent => (ent._fxSeed == null ? (ent._fxSeed = Math.random() * 20) : ent._fxSeed);

  /** 0..1: se enciende y se apaga del todo, despacio, en `s` segundos. (28-10-2026) Pasa la mitad
   *  apagado, se enciende poco a poco, brilla un rato y se apaga: no está en todo momento. */
  function breathe(t, seed, s) {
    const k = ((((t + seed) % s) + s) % s) / s;
    const v = k < 0.5 ? 0 : k < 0.65 ? (k - 0.5) / 0.15 : k < 0.85 ? 1 : 1 - (k - 0.85) / 0.15;
    return v * v * (3 - 2 * v);
  }
  /** 0..1: cuánto es de noche ahora en la partida (systems/night.js); en los menús, nada. */
  const nightNow = () => (G.Night && G.Game && G.Game.state !== 'ui' ? G.Night.level(G.Game.st.time || 0) : 0);

  /** Cuánto brilla ahora (según el tipo de detalle). `seed` desfasa a cada Pokémon. */
  function emitLevel(dex, t, seed = 0) {
    const rule = SPOTS[dex];
    if (!rule) return 0;
    // seq: los puntos se encienden uno a uno (los dibuja front, no la hoja entera).
    if (rule.seq) return 0;
    // pulse: se apaga casi del todo y se vuelve a encender despacio (el núcleo de Eternatus...).
    if (rule.pulse) return 0.05 + 0.95 * breathe(t, seed, rule.pulse);
    // Las llamas parpadean vivas, como un fuego de verdad (igual que en la primera versión).
    if (rule.kind === 'flame') return 0.6 + 0.25 * Math.sin(t * 13) + 0.15 * Math.sin(t * 31);
    // Las chispas: tranquilas y, de vez en cuando, un chispazo.
    if (rule.kind === 'spark') { const w = wave(t, seed, 4.5, 1.1); return 0.35 + 0.65 * w * (0.85 + 0.15 * Math.sin(t * 40)); }
    // Ojos y detalles: tan brillantes como en la primera versión, pero respirando más despacio.
    if (rule.kind === 'eye') return 0.75 + 0.25 * Math.sin(t * 1.3 + seed);
    return 0.7 + 0.3 * Math.sin(t * 1.6 + seed);
  }

  // Partículas que salen del propio detalle, según su clase.
  const SPOT_PARTS = {
    flame: { c: ['#ffe14d', '#ffb347', '#ff7a3d'], up: 26, spread: 5, r: 1.3, life: 0.9, rate: 5, glow: true },
    spark: { c: ['#fffbe0', '#ffe14d'], up: 0, spread: 60, r: 1, life: 0.25, rate: 7, glow: true, bolt: true },
    eye: { up: 5, spread: 5, r: 1.1, life: 1, rate: 1.5, glow: true },
    glow: { up: 8, spread: 8, r: 1.1, life: 1.2, rate: 1.5, glow: true, star: true },
    psy: { up: 6, spread: 6, r: 2, life: 1.2, rate: 1, ring: true },
    ice: { up: -5, spread: 10, r: 1.2, life: 1.4, rate: 2, glow: true, star: true }
  };
  /** Suelta partículas desde los píxeles del detalle en el fotograma que se acaba de dibujar. */
  function spotEmit(ent, anim, dex, dt, k = 1) {
    const rule = SPOTS[dex], ld = anim && anim.lastDraw;
    if (!rule || !ld || parts.length >= MAX || G.Settings.get('quality') === 'low') return;
    const o = spotsOf(ld.img, dex, ld.m);
    const l = o && o.pts.get(ld.sx + ',' + ld.sy);
    if (!l || !l.length) return;
    // Las llamas arden siempre; las chispas, con su chispazo; lo demás, a ratos.
    const t = performance.now() / 1000, seed = seedOf(ent);
    const gate = rule.kind === 'flame' ? 1 : rule.kind === 'spark' ? (wave(t, seed, 4.5, 1.1) > 0.2 ? 1 : 0) : wave(t, seed, 6, 3.5);
    if (gate <= 0) return;
    // Los que no traen colores propios, del color de su brillo y blanco.
    const P = Object.assign({ c: [rule.color, '#ffffff'] }, SPOT_PARTS[rule.kind] || SPOT_PARTS.glow, rule.parts || {});
    ent._spotAcc = (ent._spotAcc || 0) + dt * P.rate * k * gate;
    while (ent._spotAcc >= 1 && parts.length < MAX) {
      ent._spotAcc -= 1;
      const i = 2 * Math.floor(Math.random() * l.length / 2);
      parts.push({ x: ld.dx + (l[i] + 0.5) * ld.k, y: ld.dy + (l[i + 1] + 0.5) * ld.k, vx: G.U.rand(-1, 1) * P.spread * 0.5,
        vy: -P.up * G.U.rand(0.6, 1.2), t: 0, life: P.life * G.U.rand(0.7, 1.2), c: G.U.pick(P.c), r: P.r * G.U.rand(0.8, 1.3) * G.Sprites.PX, P });
    }
  }
  const spotColor = dex => (SPOTS[dex] ? SPOTS[dex].color : '#fff');

  // ---------------- partículas según el tipo ----------------
  // c colores · up subida · spread a los lados · r tamaño · life vida · rate cuántas por segundo
  const PARTS = {
    fire: { c: ['#ffb347', '#ff7a3d', '#ffe14d'], up: 34, spread: 10, r: 1.6, life: 0.9, rate: 7, glow: true },
    water: { c: ['#9fd8ff', '#d6f0ff'], up: 22, spread: 8, r: 1.8, life: 1.3, rate: 4, ring: true },
    grass: { c: ['#5fe08a', '#a5f07a'], up: -10, spread: 16, r: 1.6, life: 1.6, rate: 3, leaf: true },
    electric: { c: ['#ffe14d', '#fff7b0'], up: 0, spread: 18, r: 1.2, life: 0.25, rate: 9, glow: true },
    ice: { c: ['#d8f1ff', '#ffffff'], up: -8, spread: 14, r: 1.4, life: 1.6, rate: 3 },
    ghost: { c: ['#9b7bff', '#c9b5ff'], up: 14, spread: 12, r: 2.4, life: 1.4, rate: 3, soft: true },
    psychic: { c: ['#ff8ad8', '#ffc4ee'], up: 12, spread: 12, r: 1.4, life: 1.2, rate: 3, ring: true },
    poison: { c: ['#c86bdc', '#e2a3f0'], up: 18, spread: 8, r: 1.8, life: 1.1, rate: 4, ring: true },
    dark: { c: ['#4a4060', '#6b5d8a'], up: 10, spread: 12, r: 2.6, life: 1.4, rate: 3, soft: true },
    fairy: { c: ['#ffb3e6', '#ffffff'], up: 10, spread: 14, r: 1.2, life: 1.1, rate: 4, glow: true },
    dragon: { c: ['#8f7bff', '#5fb8ff'], up: 16, spread: 10, r: 1.6, life: 1.1, rate: 4, glow: true },
    steel: { c: ['#e6ecff', '#b0b8c8'], up: 6, spread: 14, r: 1.2, life: 0.6, rate: 3, glow: true },
    rock: { c: ['#c8a875', '#a08560'], up: -6, spread: 12, r: 1.4, life: 1.0, rate: 2 },
    ground: { c: ['#d8b878', '#b89458'], up: 4, spread: 14, r: 1.6, life: 0.9, rate: 3, soft: true },
    flying: { c: ['#ffffff', '#d6e8ff'], up: 6, spread: 18, r: 1.4, life: 1.2, rate: 3, soft: true },
    bug: { c: ['#a5d84a', '#d6f07a'], up: 12, spread: 14, r: 1.2, life: 1.0, rate: 3, glow: true },
    fighting: { c: ['#ff9a3d', '#ffd23f'], up: 20, spread: 8, r: 1.2, life: 0.5, rate: 4 },
    normal: { c: ['#ffffff', '#fff4d6'], up: 8, spread: 12, r: 1.1, life: 1.0, rate: 1.5, glow: true }
  };
  const MAX = 160;
  const parts = [];

  /** Suelta partículas del tipo principal de `ent` (llámalo cada fotograma; dt en s).
   *  Salen a ratos: olas de unos 4 s cada 7 s. */
  function emit(ent, types, dt, k = 1) {
    if (!types || !types.length || parts.length >= MAX || G.Settings.get('quality') === 'low') return;
    const P = PARTS[types[0]] || PARTS.normal;
    const w = wave(performance.now() / 1000, seedOf(ent), 7, 4);
    if (w <= 0) return;
    ent._auraAcc = (ent._auraAcc || 0) + dt * P.rate * 0.9 * k * w;
    while (ent._auraAcc >= 1 && parts.length < MAX) {
      ent._auraAcc -= 1;
      const h = ent.bodyH || 24, r = ent.r || 12;
      parts.push({ x: ent.x + G.U.rand(-r, r), y: ent.y - G.U.rand(0.1, 0.95) * h, vx: G.U.rand(-1, 1) * P.spread * 0.4,
        vy: -P.up * G.U.rand(0.6, 1.2), t: 0, life: P.life * G.U.rand(0.7, 1.2), c: G.U.pick(P.c), r: P.r * G.U.rand(0.8, 1.3) * G.Sprites.PX, P });
    }
  }
  function update(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.t >= p.life) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
      p.x += p.vx * dt + (p.P.leaf ? Math.sin(p.t * 3) * 10 * dt : 0);
      p.y += p.vy * dt;
    }
  }
  /** En el mundo (con la cámara puesta), encima de los Pokémon. */
  // Corazón de 7 × 6 píxeles.
  const HEART = ['.xx.xx.', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'];
  function draw(ctx) {
    if (!parts.length) return;
    ctx.save();
    for (const p of parts) {
      // Aparece rápido y se apaga despacio; en píxeles enteros, como los sprites.
      const k = p.t / p.life, a = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
      const x = Math.round(p.x), y = Math.round(p.y);
      ctx.globalAlpha = Math.max(0, a) * (p.P.soft ? 0.45 : 0.85);
      ctx.globalCompositeOperation = p.P.glow ? 'lighter' : 'source-over';
      ctx.fillStyle = p.c;
      if (p.P.bolt) {
        // Chispa: un rayito en zigzag que sale del detalle, con borde oscuro para que se vea
        // también encima de un cuerpo amarillo.
        // (En píxeles, 28-10-2026.)
        const s = p.vx < 0 ? -1 : 1, zig = d => {
          pixLine(ctx, p.x, p.y + d, p.x + s * 5, p.y - 4 + d);
          pixLine(ctx, p.x + s * 5, p.y - 4 + d, p.x + s * 2, p.y - 7 + d);
          pixLine(ctx, p.x + s * 2, p.y - 7 + d, p.x + s * 8, p.y - 12 + d);
        };
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(60,40,0,.5)'; zig(G.Sprites.PX);
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = p.c; zig(0);
      } else if (p.P.star) {
        // Destello de cuatro puntas en píxeles del arte, que titila (grande y pequeño por turnos).
        glyph(ctx, p.r * Math.abs(Math.sin(p.t * 5)) > 2 ? ['..x..', '..x..', 'xxoxx', '..x..', '..x..'] : ['.x.', 'xox', '.x.'],
          snap(x), snap(y), G.Sprites.PX, '#ffffff');
      } else if (p.P.heart) {
        // Corazón de píxeles.
        const u = Math.max(1, Math.round(p.r / 2.5));
        HEART.forEach((row, ry) => { for (let rx = 0; rx < row.length; rx++) if (row[rx] === 'x') ctx.fillRect(x + (rx - 3) * u, y + (ry - 3) * u, u, u); });
      } else if (p.P.zzz) {
        // Z de los dormilones, en píxeles: crece al subir (con borde, para que se lea en cualquier fondo).
        const u = p.t / p.life > 0.5 ? 2 : 1;
        ctx.fillStyle = 'rgba(20,24,48,.55)'; glyph(ctx, ZED, x + u, y + u, u);
        ctx.fillStyle = p.c; glyph(ctx, ZED, x, y, u);
      } else if (p.P.petal) {
        // Hoja o pétalo de píxeles que da vueltas mientras cae (ancho y estrecho por turnos).
        const s = Math.max(1, Math.round(p.r)), w = Math.abs(Math.cos(p.t * 3)) > 0.5;
        ctx.fillRect(x - (w ? s : 0), y, w ? s * 2 : Math.max(1, s >> 1), w ? Math.max(1, s >> 1) : s * 2);
      } else if (p.P.note) {
        // Nota musical (Meloetta, Jigglypuff...), en píxeles y con borde.
        const n = p.r > 2.2 ? NOTE2 : NOTE1;
        ctx.fillStyle = 'rgba(20,24,48,.55)'; glyph(ctx, n, x + 2, y + 2, 2);
        ctx.fillStyle = p.c; glyph(ctx, n, x, y, 2);
      } else if (p.P.ring) {
        // Burbuja de píxeles.
        glyph(ctx, ['.xx.', 'x..x', 'x..x', '.xx.'], x, y, Math.max(1, Math.round(p.r / 2.5)));
      } else {
        // Lo normal: un cuadradito de píxeles del arte, en su rejilla (deja un rastro pixelado al moverse).
        const u = G.Sprites.PX, s = Math.max(u, Math.round(p.r / u) * u);
        ctx.fillRect(snap(x) - (s >> 1), snap(y) - (s >> 1), s, s);
      }
    }
    ctx.restore();
  }
  function clear() { parts.length = 0; }

  // ---------------- destello shiny ----------------
  const SWEEP_EVERY = 5.5, SWEEP_LONG = 0.9;
  /** 0..1 mientras la franja cruza el sprite (o -1 si ahora no). `seed` desfasa a cada uno. */
  function sweep(t, seed = 0) {
    const k = ((t + seed) % SWEEP_EVERY) / SWEEP_LONG;
    return k <= 1 ? k : -1;
  }

  // Lienzo pequeño de trabajo para la franja (uno para todos).
  let work = null;
  /** Dibuja la franja de luz sobre el fotograma (lo llama Animator.draw). color: blanca en los
   *  shiny; de su color en los normales que relucen (glint). */
  function drawSweep(ctx, img, sx, sy, w, h, dx, dy, k, phase, alpha, color) {
    if (!work) work = document.createElement('canvas');
    if (work.width < w) work.width = w;
    if (work.height < h) work.height = h;
    const x = work.getContext('2d');
    x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, work.width, work.height);
    x.drawImage(G.Sprites.white(img), sx, sy, w, h, 0, 0, w, h);
    x.globalCompositeOperation = 'source-in';
    // Una franja estrecha e inclinada que cruza de izquierda a derecha.
    const c = -w * 0.3 + phase * w * 1.6;
    const g = x.createLinearGradient(c - w * 0.12, h * 0.1, c + w * 0.12, -h * 0.1);
    const c3 = color ? rgb(color) : '255,255,255';
    g.addColorStop(0, `rgba(${c3},0)`);
    g.addColorStop(0.5, `rgba(${c3},1)`);
    g.addColorStop(1, `rgba(${c3},0)`);
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = (color ? 0.6 : 0.5) * alpha;
    ctx.drawImage(work, 0, 0, w, h, dx, dy, w * k, h * k);
    ctx.restore();
  }

  // ---------------- efectos propios de legendarios ----------------
  // aura: luz suave de su color DETRÁS del cuerpo, que respira despacio (como en los juegos) ·
  // back: lo que va en el suelo, a ratos ('ripple' ondas, 'clock' el reloj de Dialga) con su color c ·
  // parts: partículas propias, que salen de su cuerpo a ratos (hue: cada una de un color del
  // arcoíris · low: sólo de la parte de abajo · star / note / heart / zzz / petal: destellos de
  // cuatro puntas, notas, corazones, Zzz u hojas que giran).
  // (28-10-2026) pulse: el aura se apaga y se enciende despacio en esos segundos · rays: rayos de
  // luz que giran detrás (un color o 'hue') · aurora: cintas de luz por encima (un color por cinta) ·
  // orbit: lo que gira alrededor (drawOrbit) · day: el aura también de día (si no, sólo de noche) ·
  // glint: la franja de luz de los shiny también sin serlo, de ese color (Dialga, Steelix...) ·
  // trail: el rastro que va dejando en el suelo al moverse ({ s: su estilo en TRAILS, c: colores }).
  const SPECIAL = {
    150: { aura: '#b060ff', back: 'ripple', c: '#e08aff', parts: { c: ['#e08aff', '#ffffff'], up: 6, spread: 16, r: 1.2, life: 1.4, rate: 2, glow: true, star: true }, pulse: 7.5, trail: { s: 'psy', c: ['#e08aff', '#ffffff'] } }, // Mewtwo: aura psíquica
    151: { parts: { c: ['#ffc4ee', '#ffffff'], up: 10, spread: 14, r: 2.2, life: 1.4, rate: 2, ring: true }, trail: { s: 'psy', c: ['#ff9fd8', '#ffffff'] } },   // Mew: burbujas
    249: { back: 'ripple', c: '#b8d8ff', parts: { c: ['#ffffff', '#d6e8ff'], up: 4, spread: 26, r: 1.4, life: 1, rate: 4, soft: true }, trail: { s: 'feather', c: ['#ffffff', '#d6e8ff', '#8f9fb7'] } }, // Lugia: viento
    250: { aura: '#ffb347', parts: { hue: true, up: 14, spread: 16, r: 1.3, life: 1.3, rate: 6, glow: true, star: true }, rays: '#ffb347', trail: { s: 'rainbow', c: ['#ffffff'] } }, // Ho-Oh: arcoíris
    382: { back: 'ripple', c: '#5fb8ff', trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } },                                                                     // Kyogre: ondas
    383: { parts: { c: ['#ff7a3d', '#ffb347'], up: 26, spread: 18, r: 1.4, life: 0.8, rate: 5, glow: true }, trail: { s: 'magma', c: ['#ffe14d', '#ff7a1a', '#c8281a'] } }, // Groudon: ascuas
    384: { parts: { c: ['#5fe08a', '#ffe14d'], up: 0, spread: 40, r: 1.2, life: 0.5, rate: 8, glow: true }, trail: { s: 'wind', c: ['#ffffff', '#a5f07a'] } },  // Rayquaza: estelas
    483: { back: 'clock', c: '#9fe8ff', trail: { s: 'star', c: ['#9fe8ff', '#ffffff'] }, glint: '#9fe8ff' },                                                                      // Dialga: el reloj del tiempo
    484: { aura: '#ff8ad8', back: 'ripple', c: '#ff9ff0', pulse: 9, trail: { s: 'gem', c: ['#ff9ff0', '#ffffff'] } },                                                    // Palkia: el espacio que se ondula
    487: { parts: { c: ['#2a1830', '#5a1a2a'], up: 8, spread: 18, r: 3, life: 1.6, rate: 4, soft: true, low: true }, trail: { s: 'shadow', c: ['#1a1020', '#ff4a4a'] } }, // Giratina: sombras
    491: { parts: { c: ['#1a1428', '#3a2c50'], up: -4, spread: 20, r: 3.2, life: 1.8, rate: 5, soft: true, low: true }, trail: { s: 'shadow', c: ['#1a1030', '#b58aff'] } }, // Darkrai: humo oscuro
    493: { day: true, aura: '#ffd23f', parts: { c: ['#ffe680', '#ffffff'], up: 10, spread: 22, r: 1.4, life: 1.4, rate: 3, glow: true, star: true }, rays: '#ffd23f', pulse: 10.5, trail: { s: 'gold', c: ['#ffd23f', '#ffffff'] } }, // Arceus: luz dorada
    643: { parts: { c: ['#ffffff', '#ffd9a0', '#9fe8ff'], up: 30, spread: 14, r: 1.5, life: 0.8, rate: 6, glow: true }, trail: { s: 'flame', c: ['#ffffff', '#d6f0ff', '#7fd8ff'] } }, // Reshiram: fuego blanco
    644: { parts: { c: ['#bfefff', '#7fd8ff'], up: 0, spread: 30, r: 1, life: 0.2, rate: 7, glow: true, bolt: true }, trail: { s: 'spark', c: ['#d6f0ff', '#7fd8ff', '#ffffff'] } },   // Zekrom: rayos
    646: { parts: { c: ['#d8f1ff', '#ffffff'], up: -10, spread: 18, r: 1.4, life: 1.6, rate: 4 }, trail: { s: 'frost', c: ['#e8f8ff', '#9fd8ff'] } },            // Kyurem: nieve
    716: { parts: { hue: true, up: 12, spread: 20, r: 1.2, life: 1.2, rate: 5, glow: true }, trail: { s: 'flower', c: ['#ff6a8a', '#ffd23f', '#5fb8ff', '#b06aff', '#ffffff'] } },                 // Xerneas: luces de colores
    717: { parts: { c: ['#ff4a3a', '#5a1a1a'], up: -12, spread: 22, r: 1.6, life: 1.4, rate: 4, leaf: true }, trail: { s: 'feather', c: ['#c8283a', '#3a2a30', '#ff5a5a'] } }, // Yveltal: plumas que caen
    // Segunda tanda.
    144: { parts: { c: ['#d8f1ff', '#ffffff'], up: -10, spread: 18, r: 1.4, life: 1.6, rate: 4 }, aurora: ['#3fd8ff', '#8f6bff'], trail: { s: 'frost', c: ['#e8f8ff', '#9fd8ff'] } },            // Articuno: nieve
    145: { parts: { c: ['#fffbe0', '#ffe14d'], up: 0, spread: 40, r: 1, life: 0.2, rate: 7, glow: true, bolt: true }, trail: { s: 'spark', c: ['#fffbe0', '#ffe14d', '#ffffff'] } }, // Zapdos: rayos
    146: { parts: { c: ['#ff7a3d', '#ffb347', '#ffe14d'], up: 30, spread: 20, r: 1.5, life: 0.9, rate: 7, glow: true }, trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } }, // Moltres: ascuas
    243: { parts: { c: ['#fffbe0', '#c9b5ff'], up: 0, spread: 36, r: 1, life: 0.2, rate: 6, glow: true, bolt: true }, trail: { s: 'spark', c: ['#fffbe0', '#ffe14d', '#c9b5ff'] } }, // Raikou: rayos
    244: { back: 'ripple', c: '#ff9a3d', parts: { c: ['#ff7a3d', '#ffb347'], up: 26, spread: 16, r: 1.4, life: 0.8, rate: 5, glow: true }, trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } }, // Entei: volcán
    245: { back: 'ripple', c: '#9fe8ff', parts: { c: ['#d6f0ff', '#b8a8ff', '#ffffff'], up: 6, spread: 24, r: 1.2, life: 1.4, rate: 5, glow: true, star: true }, trail: { s: 'aurora', c: ['#6affd0', '#5fd0ff', '#7f9fff', '#c07aff'] } }, // Suicune: rastro de aurora
    251: { parts: { c: ['#5fe08a', '#a5f07a'], up: -8, spread: 20, r: 1.6, life: 1.6, rate: 4, leaf: true }, trail: { s: 'flower', c: ['#ffffff', '#c9f07a', '#ffe14d'] } },  // Celebi: hojas
    385: { parts: { c: ['#ffe680', '#ffffff'], up: 8, spread: 22, r: 1.6, life: 1.1, rate: 4, glow: true, star: true }, trail: { s: 'star', c: ['#ffe680', '#fff7c0'] } }, // Jirachi: estrellas
    386: { day: true, aura: '#ff6a4a', parts: { c: ['#7fd0ff', '#ffffff'], up: 6, spread: 16, r: 1.2, life: 1.2, rate: 2, glow: true }, pulse: 6, trail: { s: 'psy', c: ['#ff9a5a', '#7fd0ff'] } }, // Deoxys: aura
    480: { parts: { c: ['#ffe680', '#ffffff'], up: 8, spread: 12, r: 1.4, life: 1, rate: 2, ring: true }, orbit: { n: 2, c: ['#ffe680', '#ff6a6a'], s: 'gem', sp: 0.35 }, trail: { s: 'psy', c: ['#ffe680', '#ffffff'] } },     // Uxie
    481: { parts: { c: ['#ffb3e6', '#ffffff'], up: 8, spread: 12, r: 1.4, life: 1, rate: 2, ring: true }, orbit: { n: 2, c: ['#ffb3e6', '#ff6a6a'], s: 'gem', sp: 0.35 }, trail: { s: 'psy', c: ['#ff9fd8', '#ffffff'] } },     // Mesprit
    482: { parts: { c: ['#9fd8ff', '#ffffff'], up: 8, spread: 12, r: 1.4, life: 1, rate: 2, ring: true }, orbit: { n: 2, c: ['#9fd8ff', '#ff6a6a'], s: 'gem', sp: 0.35 }, trail: { s: 'psy', c: ['#9fd8ff', '#ffffff'] } },     // Azelf
    485: { parts: { c: ['#ff7a3d', '#ffb347'], up: 24, spread: 20, r: 1.6, life: 0.9, rate: 6, glow: true }, trail: { s: 'magma', c: ['#ffe14d', '#ff7a1a', '#c8281a'] } },  // Heatran: ascuas
    488: { aura: '#ffb3e6', parts: { c: ['#ffe680', '#ffb3e6'], up: 6, spread: 18, r: 1.2, life: 1.2, rate: 3, glow: true, star: true }, pulse: 9, trail: { s: 'star', c: ['#ffb3e6', '#ffe680'] } }, // Cresselia: luz de luna
    490: { parts: { c: ['#9fd8ff', '#d6f0ff'], up: 18, spread: 12, r: 1.8, life: 1.3, rate: 3, ring: true }, trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } }, // Manaphy: burbujas
    494: { parts: { c: ['#ff7a3d', '#ffe14d'], up: 22, spread: 14, r: 1.3, life: 0.8, rate: 5, glow: true }, trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff5a2a'] } },  // Victini: llamitas
    648: { parts: { c: ['#7fffa0', '#ffffff', '#ffe680'], up: 16, spread: 20, r: 1, life: 1.4, rate: 2, note: true }, trail: { s: 'note', c: ['#7fffa0', '#ffffff', '#ffe680'] } }, // Meloetta: notas
    718: { parts: { c: ['#7fff6a', '#3fbf3f'], up: 10, spread: 22, r: 1.6, life: 1.2, rate: 5, glow: true }, orbit: { n: 5, c: ['#7fff6a', '#3fbf3f'], s: 'cell', sp: 0.25 }, trail: { s: 'cell', c: ['#7fff6a', '#ff5a5a'] } },  // Zygarde: células
    719: { parts: { c: ['#ffb5de', '#ffffff'], up: 8, spread: 18, r: 1.6, life: 1, rate: 4, glow: true, star: true }, trail: { s: 'gem', c: ['#ffb5de', '#ffffff'] }, glint: '#ffb5de' }, // Diancie: destellos
    720: { day: true, aura: '#ffd23f', parts: { c: ['#ffd23f', '#ffe680'], up: 8, spread: 20, r: 2.4, life: 1.6, rate: 1.5, ring: true, glow: true }, pulse: 9, orbit: { n: 3, c: ['#ffd23f', '#ffe680'], s: 'ring', sp: 0.3 }, trail: { s: 'psy', c: ['#ffd23f', '#ff9fd8'] } }, // Hoopa: aros dorados
    721: { parts: { c: ['#ffffff', '#e6eef5'], up: 30, spread: 12, r: 2.6, life: 1.2, rate: 4, soft: true }, trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },  // Volcanion: vapor
    791: { aura: '#ffab28', parts: { c: ['#ffd27f', '#ffffff'], up: 14, spread: 20, r: 1.3, life: 1, rate: 4, glow: true }, rays: '#ffab28', pulse: 9, trail: { s: 'flame', c: ['#ffffff', '#ffe14d', '#ff9a3d'] } }, // Solgaleo: sol
    792: { aura: '#8f6bff', parts: { c: ['#c9b5ff', '#ffffff', '#7cd8ed'], up: 4, spread: 26, r: 1.4, life: 1.4, rate: 5, glow: true, star: true }, pulse: 9, trail: { s: 'star', c: ['#c9b5ff', '#7cd8ed'] } }, // Lunala: estrellas
    800: { parts: { hue: true, up: 10, spread: 22, r: 1.4, life: 1, rate: 6, glow: true, star: true }, rays: 'hue', trail: { s: 'rainbow', c: ['#ffffff'] } },        // Necrozma: luz del prisma
    802: { parts: { c: ['#1a1428', '#2f3a2f'], up: 4, spread: 18, r: 2.8, life: 1.4, rate: 4, soft: true, low: true }, trail: { s: 'shadow', c: ['#14201a', '#7fff9f'] } }, // Marshadow: sombra
    807: { parts: { c: ['#d6f0ff', '#7fd8ff'], up: 0, spread: 36, r: 1, life: 0.2, rate: 7, glow: true, bolt: true }, trail: { s: 'spark', c: ['#d6f0ff', '#7fd8ff', '#ffffff'] } }, // Zeraora: rayos
    890: { back: 'ripple', c: '#ff5a6a', parts: { c: ['#ff5a6a', '#b04aff'], up: 20, spread: 18, r: 2, life: 1.1, rate: 5, glow: true }, trail: { s: 'miasma', c: ['#ff3a5a', '#b04aff', '#ff8a9a'] } }, // Eternatus: energía
    // Tercera tanda.
    641: { parts: { c: ['#ffffff', '#c9f0d6'], up: 2, spread: 40, r: 2.2, life: 1, rate: 4, soft: true }, trail: { s: 'wind', c: ['#ffffff', '#a5f07a'] } },    // Tornadus: viento
    642: { parts: { c: ['#fffbe0', '#c9b5ff'], up: 0, spread: 36, r: 1, life: 0.2, rate: 6, glow: true, bolt: true }, trail: { s: 'spark', c: ['#fffbe0', '#ffe14d', '#c9b5ff'] } }, // Thundurus: rayos
    645: { parts: { c: ['#d8b878', '#b89458'], up: 6, spread: 26, r: 2, life: 1, rate: 5, soft: true, low: true }, trail: { s: 'rock', c: ['#d8b878', '#b89458', '#8a6a48'] } }, // Landorus: arena
    786: { aura: '#ff8ad8', parts: { c: ['#ffb3e6', '#ffffff'], up: 6, spread: 20, r: 1.3, life: 1.3, rate: 3, glow: true, star: true }, trail: { s: 'psy', c: ['#ff9fd8', '#ffffff'] } }, // Tapu Lele: escamas
    787: { parts: { c: ['#5fe08a', '#ffe14d'], up: -6, spread: 20, r: 1.6, life: 1.6, rate: 3, leaf: true }, trail: { s: 'flower', c: ['#ffe14d', '#ffffff', '#ff9a3d'] } }, // Tapu Bulu: hojas
    788: { aura: '#9fd8ff', parts: { c: ['#d6f0ff', '#ffffff'], up: 4, spread: 26, r: 2.6, life: 1.6, rate: 3, soft: true }, trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } }, // Tapu Fini: niebla
    789: { parts: { c: ['#ffe680', '#9fe8ff', '#ffffff'], up: 6, spread: 18, r: 1.2, life: 1.3, rate: 3, glow: true, star: true }, orbit: { n: 3, c: ['#ffe680', '#9fe8ff'], s: 'star', sp: 0.3 }, trail: { s: 'star', c: ['#9fe8ff', '#ffe680'] } }, // Cosmog: estrellitas
    790: { aura: '#ffe680', parts: { c: ['#ffe680', '#ffffff'], up: 4, spread: 16, r: 1.2, life: 1.3, rate: 2, glow: true, star: true }, pulse: 7.5, trail: { s: 'star', c: ['#ffe680', '#ffffff'] } }, // Cosmoem
    793: { aura: '#6abde0' },                                                                                   // Nihilego
    801: { day: true, aura: '#ff9fb0', parts: { c: ['#ffd5d6', '#ffffff'], up: 8, spread: 14, r: 1.2, life: 1.2, rate: 2, glow: true, star: true }, pulse: 3.9, trail: { s: 'heart', c: ['#ff6aa8', '#ff9fc8', '#ffffff'] } }, // Magearna
    888: { aura: '#5fb8ff', parts: { c: ['#d6f0ff', '#ffffff'], up: 10, spread: 18, r: 1.2, life: 1.1, rate: 3, glow: true, star: true }, pulse: 7.5, trail: { s: 'metal', c: ['#ffffff', '#7fb8ff'] } }, // Zacian: espada de luz
    889: { aura: '#ff6a5a', parts: { c: ['#ffd0c0', '#ffffff'], up: 10, spread: 18, r: 1.2, life: 1.1, rate: 3, glow: true, star: true }, pulse: 7.5, trail: { s: 'metal', c: ['#ffffff', '#ffb0a0'] } }, // Zamazenta: escudo de luz
    894: { parts: { c: ['#fffbe0', '#ffe14d'], up: 0, spread: 44, r: 1, life: 0.2, rate: 8, glow: true, bolt: true }, trail: { s: 'spark', c: ['#fffbe0', '#ffe14d', '#ffffff'] } }, // Regieleki: rayos
    896: { parts: { c: ['#d8f1ff', '#ffffff'], up: -10, spread: 20, r: 1.4, life: 1.6, rate: 4 }, trail: { s: 'frost', c: ['#e8f8ff', '#9fd8ff'] } },            // Glastrier: nieve
    897: { aura: '#8f6bff', parts: { c: ['#1a1428', '#3a2c50'], up: 6, spread: 18, r: 2.8, life: 1.4, rate: 3, soft: true, low: true }, trail: { s: 'shadow', c: ['#1a1030', '#b58aff'] } }, // Spectrier: sombra
    898: { aura: '#7fe8a0', parts: { c: ['#5fe08a', '#a5f07a'], up: -6, spread: 20, r: 1.5, life: 1.6, rate: 3, leaf: true }, pulse: 7.5, trail: { s: 'flower', c: ['#ffffff', '#c9f07a', '#ffe14d'] } }, // Calyrex: hojas
    // Cuarta tanda: auras de los que en el anime y los juegos la tienen.
    447: { day: true, aura: '#3f8fff' },                                                                                   // Riolu: aura
    448: { day: true, aura: '#3f8fff', parts: { c: ['#7fb8ff', '#ffffff'], up: 14, spread: 14, r: 1.4, life: 1.1, rate: 3, glow: true }, trail: { s: 'flame', c: ['#ffffff', '#7fb8ff', '#3f6aff'] } }, // Lucario: aura
    282: { aura: '#ff8ad8', parts: { c: ['#ff8ad8', '#ffc4ee'], up: 6, spread: 12, r: 2, life: 1.3, rate: 1.5, ring: true }, trail: { s: 'heart', c: ['#ff6aa8', '#ff9fc8', '#ffffff'] } }, // Gardevoir
    100448: { day: true, aura: '#3f8fff', parts: { c: ['#7fb8ff', '#ffffff'], up: 14, spread: 14, r: 1.4, life: 1.1, rate: 4, glow: true }, trail: { s: 'flame', c: ['#ffffff', '#7fb8ff', '#3f6aff'] } }, // Mega Lucario
    100282: { aura: '#ff8ad8', trail: { s: 'heart', c: ['#ff6aa8', '#ff9fc8', '#ffffff'] } },                                                                                // Mega Gardevoir
    100006: { parts: { c: ['#a4ddf9', '#5fc8ff'], up: 30, spread: 16, r: 1.5, life: 0.8, rate: 6, glow: true }, trail: { s: 'flame', c: ['#ffffff', '#a4ddf9', '#5fc8ff'] } }, // Mega Charizard X: llamas azules
    100150: { aura: '#b060ff', back: 'ripple', c: '#e08aff', pulse: 7.5, trail: { s: 'psy', c: ['#e08aff', '#ffffff'] } },                                                  // Mega Mewtwo Y
    100384: { aura: '#5fe08a', parts: { c: ['#5fe08a', '#ffe14d'], up: 0, spread: 50, r: 1.3, life: 0.5, rate: 10, glow: true }, pulse: 9, trail: { s: 'wind', c: ['#ffffff', '#a5f07a'] } }, // Mega Rayquaza
    100719: { parts: { c: ['#ffb5de', '#ffffff'], up: 8, spread: 22, r: 1.8, life: 1.1, rate: 6, glow: true, star: true }, trail: { s: 'gem', c: ['#ffb5de', '#ffffff'] }, glint: '#ffb5de' }, // Mega Diancie
    100382: { aura: '#3fa8ff', back: 'ripple', c: '#7fe8ff', parts: { c: ['#9fd8ff', '#d6f0ff'], up: 26, spread: 16, r: 1.8, life: 1.2, rate: 5, ring: true }, trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } }, // Kyogre primigenio
    100383: { aura: '#ff6a1a', parts: { c: ['#ff7a3d', '#ffb347', '#ffe14d'], up: 34, spread: 20, r: 1.6, life: 0.9, rate: 8, glow: true }, trail: { s: 'magma', c: ['#ffe14d', '#ff7a1a', '#c8281a'] } }, // Groudon primigenio
    // Quinta tanda (28-10-2026): los legendarios que faltaban (y megas de legendarios).
    378: { parts: { c: ['#d8f1ff', '#ffffff'], up: -8, spread: 20, r: 1.3, life: 1.6, rate: 4, glow: true, star: true }, trail: { s: 'frost', c: ['#e8f8ff', '#9fd8ff'] } }, // Regice: frío
    486: { aura: '#fff2b0', pulse: 12, parts: { c: ['#ffffff', '#fff2b0'], up: 6, spread: 24, r: 1.4, life: 1.4, rate: 2, glow: true, star: true }, trail: { s: 'rock', c: ['#e6e6e6', '#b0b8c8', '#8f939c'] } }, // Regigigas
    895: { aura: '#ff4a7a', pulse: 7.5, parts: { c: ['#ff5d83', '#ffffff'], up: 10, spread: 18, r: 1.3, life: 1.2, rate: 3, glow: true, star: true }, trail: { s: 'star', c: ['#ff5d83', '#ffffff'] } }, // Regidrago
    380: { aura: '#ff6a8a', pulse: 7.5, parts: { c: ['#ffb3c8', '#ffffff'], up: 4, spread: 24, r: 1.2, life: 1.2, rate: 3, glow: true, star: true }, trail: { s: 'wind', c: ['#ffffff', '#ffc4d8'] } }, // Latias: Bola Neblina
    381: { aura: '#4a8aff', pulse: 7.5, parts: { c: ['#9fd0ff', '#ffffff'], up: 4, spread: 24, r: 1.2, life: 1.2, rate: 3, glow: true, star: true }, trail: { s: 'wind', c: ['#ffffff', '#c4d8ff'] } }, // Latios: Resplandor
    100380: { aura: '#c08aff', pulse: 7.5, parts: { c: ['#e0c0ff', '#ffffff'], up: 4, spread: 26, r: 1.3, life: 1.2, rate: 4, glow: true, star: true }, trail: { s: 'wind', c: ['#ffffff', '#e0c0ff'] } }, // Mega Latias
    100381: { aura: '#8a8aff', pulse: 7.5, parts: { c: ['#c0c8ff', '#ffffff'], up: 4, spread: 26, r: 1.3, life: 1.2, rate: 4, glow: true, star: true }, trail: { s: 'wind', c: ['#ffffff', '#c0c8ff'] } }, // Mega Latios
    489: { parts: { c: ['#9fd8ff', '#d6f0ff'], up: 16, spread: 12, r: 1.6, life: 1.3, rate: 3, ring: true }, trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } }, // Phione: burbujas
    638: { parts: { c: ['#e6eef5', '#9fe8ff'], up: 4, spread: 24, r: 1.2, life: 0.9, rate: 3, glow: true, star: true }, trail: { s: 'metal', c: ['#ffffff', '#bfe8ff'] } }, // Cobalion: brillos de acero
    639: { parts: { c: ['#c8a875', '#8f939c'], up: 4, spread: 26, r: 1.8, life: 1, rate: 4, soft: true, low: true }, trail: { s: 'rock', c: ['#c8a875', '#8f939c', '#6a5a48'] } }, // Terrakion: polvo de roca
    640: { parts: { c: ['#8bd72f', '#c9f07a'], up: -6, spread: 22, r: 2, life: 1.8, rate: 3, leaf: true, petal: true }, trail: { s: 'flower', c: ['#ff9fcf', '#ffffff', '#ffe14d'] } }, // Virizion: hojas
    647: { aura: '#5fb8ff', pulse: 9, parts: { c: ['#9fd8ff', '#d6f0ff'], up: 16, spread: 12, r: 1.6, life: 1.3, rate: 3, ring: true }, trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } }, // Keldeo: agua
    772: { parts: { c: ['#3a3f4a', '#2c7d5f'], up: 4, spread: 18, r: 2.6, life: 1.4, rate: 3, soft: true, low: true }, trail: { s: 'metal', c: ['#ffffff', '#bfe8ff'] } }, // Código Cero: humo del casco
    773: { parts: { hue: true, up: 8, spread: 18, r: 1.2, life: 1.1, rate: 3, glow: true, star: true }, trail: { s: 'metal', c: ['#ffffff', '#7fd8ff'] } }, // Silvally: el Sistema Alfa (todos los tipos)
    808: { parts: { c: ['#ffd23f', '#d0d8e0'], up: 8, spread: 14, r: 1.2, life: 1.1, rate: 2, glow: true, star: true }, trail: { s: 'metal', c: ['#ffffff', '#ffe680'] } }, // Meltan: metal
    891: { parts: { c: ['#ffffff', '#d0dfe3'], up: 2, spread: 30, r: 2, life: 0.8, rate: 3, soft: true }, trail: { s: 'wind', c: ['#ffffff', '#d6f0ff'] } }, // Kubfu: viento de sus golpes
    892: { aura: '#4a4a8a', pulse: 7.5, parts: { c: ['#1a1428', '#3a2c50'], up: 4, spread: 18, r: 2.8, life: 1.4, rate: 3, soft: true, low: true }, trail: { s: 'wind', c: ['#ffffff', '#d6f0ff'] } }, // Urshifu
    905: { aura: '#ff6aa8', pulse: 9, parts: { c: ['#ff6aa8', '#ff9fc8'], up: 12, spread: 16, r: 2.6, life: 1.6, rate: 2.5, heart: true }, trail: { s: 'heart', c: ['#ff6aa8', '#ff9fc8', '#ffffff'] } }, // Enamorus: corazones
    1007: { aura: '#ff7a3d', pulse: 9, rays: '#ff9a3d', parts: { c: ['#ff7a3d', '#ffb347', '#ffe14d'], up: 24, spread: 16, r: 1.3, life: 0.9, rate: 4, glow: true }, trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } }, // Koraidon: el sol
    1015: { parts: { c: ['#f711e4', '#97007b'], up: 6, spread: 20, r: 3, life: 1.6, rate: 2.5, soft: true }, trail: { s: 'shadow', c: ['#3a0a40', '#f711e4'] } }, // Munkidori: gas tóxico
    1016: { parts: { c: ['#ff9fcf', '#ffd23f', '#ffffff'], up: -6, spread: 24, r: 2, life: 2, rate: 3, leaf: true, petal: true }, trail: { s: 'flower', c: ['#ff9fcf', '#ffd23f', '#ffffff'] } }, // Fezandipiti: pétalos
    1017: { parts: { c: ['#5fe08a', '#a5f07a'], up: -6, spread: 22, r: 2, life: 1.8, rate: 3, leaf: true, petal: true }, trail: { s: 'flower', c: ['#ffffff', '#9fe8ff', '#ffe14d'] } }, // Ogerpon: hojas
    1024: { aura: '#9fe8ff', pulse: 7.5, rays: 'hue', parts: { hue: true, up: 8, spread: 20, r: 1.3, life: 1.2, rate: 4, glow: true, star: true }, trail: { s: 'tera', c: ['#ffffff'] } }, // Terapagos: Teracristal
    100491: { aura: '#6a3aa8', pulse: 7.5, parts: { c: ['#1a1428', '#3a2c50'], up: -4, spread: 22, r: 3.2, life: 1.8, rate: 5, soft: true, low: true }, trail: { s: 'shadow', c: ['#1a1030', '#b58aff'] } }, // Mega Darkrai
    100718: { aura: '#5fe08a', pulse: 7.5, orbit: { n: 6, c: ['#7fff6a', '#3fbf3f'], s: 'cell', sp: 0.25 }, parts: { c: ['#7fff6a', '#3fbf3f'], up: 10, spread: 22, r: 1.6, life: 1.2, rate: 4, glow: true }, trail: { s: 'cell', c: ['#7fff6a', '#ff5a5a'] } }, // Mega Zygarde
    100807: { aura: '#7fd8ff', pulse: 6, parts: { c: ['#d6f0ff', '#7fd8ff'], up: 0, spread: 40, r: 1, life: 0.2, rate: 8, glow: true, bolt: true }, trail: { s: 'spark', c: ['#d6f0ff', '#7fd8ff', '#ffffff'] } }, // Mega Zeraora
    // Sólo su rastro (28-10-2026): sus partículas siguen saliendo de SIG (abajo).
    1004: { trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },                                    // Chi-Yu
    785: { trail: { s: 'spark', c: ['#fffbe0', '#ffe14d', '#ffb347'] } },                                     // Tapu Koko
    492: { trail: { s: 'flower', c: ['#ff9fcf', '#ffffff', '#ffc4e2', '#ffe14d'] } },                         // Shaymin
    100485: { trail: { s: 'magma', c: ['#ffe14d', '#ff7a1a', '#c8281a'] } },                                  // Mega Heatran
    // Más rastros (28-10-2026): los legendarios que no tenían entrada y Pokémon conocidos (pseudolegendarios,
    // iniciales, los más usados y sus megas).
    377: { trail: { s: 'rock', c: ['#c8a875', '#8f939c', '#6a5a48'] } },                                    // Regirock
    379: { trail: { s: 'metal', c: ['#ffffff', '#bfe8ff'] }, glint: '#bfe8ff' },                                              // Registeel
    649: { trail: { s: 'metal', c: ['#ffffff', '#ffb0a0'] } },                                              // Genesect
    809: { trail: { s: 'metal', c: ['#ffffff', '#ffe680'] } },                                              // Melmetal
    149: { trail: { s: 'wind', c: ['#ffffff', '#d6f0ff'] } },                                               // Dragonite
    248: { trail: { s: 'rock', c: ['#c8a875', '#8f939c', '#6a5a48'] } },                                    // Tyranitar
    373: { trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },                                   // Salamence
    376: { trail: { s: 'metal', c: ['#ffffff', '#bfe8ff'] } },                                              // Metagross
    445: { trail: { s: 'rock', c: ['#d8b878', '#b89458', '#8a6a48'] } },                                    // Garchomp
    635: { trail: { s: 'shadow', c: ['#1a1030', '#b06aff'] } },                                             // Hydreigon
    706: { trail: { s: 'puddle', c: ['#c9a0ff', '#ffffff'] } },                                             // Goodra
    784: { trail: { s: 'metal', c: ['#ffffff', '#ffe680'] } },                                              // Kommo-o
    887: { trail: { s: 'shadow', c: ['#1a2030', '#7fd8ff'] } },                                             // Dragapult
    998: { trail: { s: 'frost', c: ['#e8f8ff', '#9fd8ff'] } },                                              // Baxcalibur
    3: { trail: { s: 'flower', c: ['#ff9fcf', '#ffffff', '#ffe14d'] } },                                    // Venusaur
    6: { trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },                                     // Charizard
    9: { trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } },                                               // Blastoise
    154: { trail: { s: 'flower', c: ['#ff9fcf', '#ffffff', '#ffe14d'] } },                                  // Meganium
    157: { trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },                                   // Typhlosion
    160: { trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } },                                             // Feraligatr
    254: { trail: { s: 'flower', c: ['#ffffff', '#c9f07a', '#ffe14d'] } },                                  // Sceptile
    257: { trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },                                   // Blaziken
    260: { trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } },                                             // Swampert
    389: { trail: { s: 'flower', c: ['#ffffff', '#c9f07a', '#ffe14d'] } },                                  // Torterra
    392: { trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },                                   // Infernape
    395: { trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } },                                             // Empoleon
    497: { trail: { s: 'flower', c: ['#ffffff', '#c9f07a', '#ffe14d'] } },                                  // Serperior
    500: { trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },                                   // Emboar
    503: { trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } },                                             // Samurott
    652: { trail: { s: 'rock', c: ['#c8a875', '#8f939c', '#6a5a48'] } },                                    // Chesnaught
    655: { trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },                                   // Delphox
    658: { trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } },                                             // Greninja
    724: { trail: { s: 'feather', c: ['#7fb86a', '#3a5a30', '#c8e0b0'] } },                                 // Decidueye
    727: { trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },                                   // Incineroar
    730: { trail: { s: 'note', c: ['#9fd8ff', '#ffffff', '#ffb3e6'] } },                                    // Primarina
    812: { trail: { s: 'flower', c: ['#ffffff', '#c9f07a', '#ffe14d'] } },                                  // Rillaboom
    815: { trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },                                   // Cinderace
    818: { trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } },                                             // Inteleon
    908: { trail: { s: 'flower', c: ['#ff9fcf', '#ffffff', '#ffe14d'] } },                                  // Meowscarada
    911: { trail: { s: 'note', c: ['#ffb347', '#ffe14d', '#ff6a4a'] } },                                    // Skeledirge
    914: { trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } },                                             // Quaquaval
    25: { trail: { s: 'spark', c: ['#fffbe0', '#ffe14d', '#ffffff'] } },                                    // Pikachu
    26: { trail: { s: 'spark', c: ['#fffbe0', '#ffe14d', '#ffffff'] } },                                    // Raichu
    38: { trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },                                    // Ninetales
    59: { trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },                                    // Arcanine
    65: { trail: { s: 'psy', c: ['#ff9fd8', '#ffffff'] } },                                                 // Alakazam
    94: { trail: { s: 'shadow', c: ['#1a1030', '#c070ff'] } },                                              // Gengar
    130: { trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } },                                             // Gyarados
    131: { trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } },                                             // Lapras
    134: { trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } },                                             // Vaporeon
    135: { trail: { s: 'spark', c: ['#fffbe0', '#ffe14d', '#ffffff'] } },                                   // Jolteon
    136: { trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },                                   // Flareon
    196: { trail: { s: 'psy', c: ['#ff9fd8', '#ffffff'] } },                                                // Espeon
    197: { trail: { s: 'star', c: ['#ffe14d', '#ffffff'] } },                                               // Umbreon
    470: { trail: { s: 'flower', c: ['#ffffff', '#c9f07a', '#ffe14d'] } },                                  // Leafeon
    471: { trail: { s: 'frost', c: ['#e8f8ff', '#9fd8ff'] } },                                              // Glaceon
    700: { trail: { s: 'heart', c: ['#ff6aa8', '#ff9fc8', '#ffffff'] } },                                   // Sylveon
    359: { trail: { s: 'shadow', c: ['#1a1030', '#d6e8ff'] } },                                             // Absol
    609: { trail: { s: 'flame', c: ['#ffffff', '#c9b5ff', '#8f6bff'] } },                                   // Chandelure
    637: { trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },                                   // Volcarona
    468: { trail: { s: 'star', c: ['#ffe680', '#ffb3e6', '#ffffff'] } },                                    // Togekiss
    350: { trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } },                                             // Milotic
    212: { trail: { s: 'metal', c: ['#ffffff', '#ffb0a0'] } },                                              // Scizor
    681: { trail: { s: 'metal', c: ['#ffffff', '#ffe680'] }, glint: '#ffe680' },                                              // Aegislash
    778: { trail: { s: 'shadow', c: ['#1a1408', '#ffe14d'] } },                                             // Mimikyu
    479: { trail: { s: 'spark', c: ['#d6f0ff', '#7fd8ff', '#ffffff'] } },                                   // Rotom
    571: { trail: { s: 'shadow', c: ['#1a1030', '#ff4a6a'] } },                                             // Zoroark
    873: { trail: { s: 'frost', c: ['#e8f8ff', '#9fd8ff'] } },                                              // Frosmoth
    936: { trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },                                   // Armarouge
    937: { trail: { s: 'flame', c: ['#ffffff', '#c9b5ff', '#8f6bff'] } },                                   // Ceruledge
    230: { trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } },                                             // Kingdra
    100009: { trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } },                                          // Mega Blastoise
    100003: { trail: { s: 'flower', c: ['#ff9fcf', '#ffffff', '#ffe14d'] } },                               // Mega Venusaur
    100094: { trail: { s: 'shadow', c: ['#1a1030', '#c070ff'] } },                                          // Mega Gengar
    100130: { trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } },                                          // Mega Gyarados
    100248: { trail: { s: 'rock', c: ['#c8a875', '#8f939c', '#6a5a48'] } },                                 // Mega Tyranitar
    100376: { trail: { s: 'metal', c: ['#ffffff', '#bfe8ff'] } },                                           // Mega Metagross
    100445: { trail: { s: 'rock', c: ['#d8b878', '#b89458', '#8a6a48'] } },                                 // Mega Garchomp
    100373: { trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },                                // Mega Salamence
    100257: { trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },                                // Mega Blaziken
    100260: { trail: { s: 'puddle', c: ['#d6f0ff', '#ffffff'] } },                                          // Mega Swampert
    100359: { trail: { s: 'shadow', c: ['#1a1030', '#d6e8ff'] } },                                          // Mega Absol
    100212: { trail: { s: 'metal', c: ['#ffffff', '#ffb0a0'] } },                                           // Mega Scizor
    100181: { trail: { s: 'spark', c: ['#fffbe0', '#ffe14d', '#ffffff'] } },                                // Mega Ampharos
    100310: { trail: { s: 'spark', c: ['#d6f0ff', '#7fd8ff', '#ffffff'] } },                                // Mega Manectric
    100229: { trail: { s: 'flame', c: ['#ffe14d', '#ff9a3d', '#ff4a1a'] } },                                // Mega Houndoom
    100254: { trail: { s: 'flower', c: ['#ffffff', '#c9f07a', '#ffe14d'] } },                               // Mega Sceptile
    100149: { trail: { s: 'wind', c: ['#ffffff', '#d6f0ff'] } },                                             // Mega Dragonite
    // La franja de luz de los shiny, de su color, en algunos normales que relucen (28-10-2026).
    208: { glint: '#e6eef5' },                                                                               // Steelix
    100208: { glint: '#e6eef5' }                                                                             // Mega Steelix
  };

  // Efectos con firma (24-10-2026): partículas según lo que es cada Pokémon conocido (los
  // corazones de Chansey, las notas de Jigglypuff, los Zzz de Snorlax, las burbujas de los de
  // agua...). Sólo los que no tienen ya un efecto propio arriba.
  const SIG_PARTS = {
    ember: { c: ['#ff7a3d', '#ffb347', '#ffe14d'], up: 24, spread: 16, r: 1.3, life: 0.9, rate: 4, glow: true },
    spark: { c: ['#fffbe0', '#ffe14d'], up: 0, spread: 36, r: 1, life: 0.2, rate: 5, glow: true, bolt: true },
    bubble: { c: ['#9fd8ff', '#d6f0ff'], up: 16, spread: 12, r: 1.8, life: 1.3, rate: 3, ring: true },
    snow: { c: ['#d8f1ff', '#ffffff'], up: -8, spread: 18, r: 1.3, life: 1.6, rate: 3 },
    leaf: { c: ['#5fe08a', '#a5f07a'], up: -6, spread: 22, r: 2, life: 1.8, rate: 3, leaf: true, petal: true },
    petal: { c: ['#ff9fcf', '#ffc4e2', '#ffffff'], up: -6, spread: 24, r: 2, life: 2, rate: 3, leaf: true, petal: true },
    spore: { c: ['#d8e89f', '#f0f0c0'], up: 8, spread: 16, r: 1.4, life: 1.8, rate: 2.5, soft: true },
    heart: { c: ['#ff6aa8', '#ff9fc8'], up: 12, spread: 16, r: 2.6, life: 1.6, rate: 2.5, heart: true },
    note: { c: ['#ffffff', '#ffe680', '#9fe8ff'], up: 14, spread: 20, r: 1, life: 1.7, rate: 2.5, note: true },
    zzz: { c: ['#ffffff', '#d6e8ff'], up: 12, spread: 6, r: 1, life: 2.2, rate: 1.4, zzz: true },
    star: { c: ['#ffe680', '#ffb3e6', '#ffffff'], up: 6, spread: 18, r: 1.3, life: 1.3, rate: 2.5, glow: true, star: true },
    psy: { c: ['#ff8ad8', '#ffc4ee'], up: 6, spread: 12, r: 2, life: 1.3, rate: 1.5, ring: true },
    wisp: { c: ['#9b7bff', '#c9b5ff'], up: 12, spread: 12, r: 2.4, life: 1.6, rate: 2.5, soft: true },
    smoke: { c: ['#1a1428', '#3a2c50'], up: 4, spread: 18, r: 2.8, life: 1.6, rate: 3, soft: true, low: true },
    sand: { c: ['#d8b878', '#b89458'], up: 4, spread: 24, r: 1.8, life: 1, rate: 3, soft: true, low: true },
    dragon: { c: ['#8f7bff', '#5fb8ff', '#ffffff'], up: 10, spread: 16, r: 1.3, life: 1.2, rate: 2.5, glow: true, star: true },
    gas: { c: ['#c86bdc', '#a07bb0'], up: 6, spread: 20, r: 3, life: 1.6, rate: 2.5, soft: true },
    slime: { c: ['#c9a0ff', '#e6d6ff'], up: -14, spread: 10, r: 1.6, life: 1.2, rate: 2 },
    coin: { c: ['#ffd23f', '#fff2b0'], up: 8, spread: 14, r: 1.3, life: 1.2, rate: 2, glow: true, star: true }
  };
  const SIG = {
    ember: [
      37, 38, 58, 59, 126, 155, 156, 157, 228, 229, 240, 255, 256, 257, 322, 323,
      467, 498, 499, 500, 513, 653, 654, 655, 667, 725, 726, 727, 813, 814, 815, 909,
      910, 911, 935, 936, 1004,
      100323, 100500, 100655   // sus megas (28-10-2026)
    ],   // ascuas
    spark: [
      100, 101, 125, 179, 180, 181, 239, 417, 587, 595, 596, 694, 695, 702, 835, 836,
      877, 921, 922, 923, 939
    ],   // chispas
    bubble: [
      7, 8, 9, 54, 55, 60, 61, 62, 98, 99, 116, 117, 118, 119, 129, 130,
      134, 158, 159, 160, 183, 184, 194, 195, 222, 223, 224, 226, 258, 259, 260, 393,
      394, 395, 418, 419, 501, 502, 503, 535, 536, 537, 656, 657, 658, 692, 693, 728,
      729, 816, 817, 818, 912, 913, 914,
      100009, 100130, 100160, 100260, 100319, 100658   // sus megas (28-10-2026)
    ],   // burbujas
    snow: [
      86, 87, 124, 215, 220, 221, 225, 238, 361, 362, 363, 364, 365, 459, 460, 461,
      471, 473, 478, 582, 583, 584, 613, 614, 712, 713, 872, 873, 875, 996, 997, 998,
      100362, 100460, 100478   // sus megas (28-10-2026)
    ],   // nieve
    leaf: [
      1, 2, 69, 70, 71, 102, 103, 114, 465, 152, 153, 191, 192, 252, 253, 254,
      273, 274, 275, 357, 387, 388, 389, 470, 495, 496, 497, 511, 512, 650, 651, 652,
      722, 723, 724, 810, 811, 812, 906, 907, 908,
      100254, 100652   // sus megas (28-10-2026)
    ],   // hojas
    petal: [
      3, 43, 44, 45, 154, 182, 315, 406, 407, 420, 421, 492, 548, 549, 669, 670,
      671,
      100003, 100154, 100670   // sus megas (28-10-2026)
    ],   // pétalos
    spore: [
      46, 47, 285, 286, 590, 187, 188, 189, 546, 547
    ],   // esporas
    heart: [
      113, 242, 440, 370, 594, 531, 700,
      100531   // sus megas (28-10-2026)
    ],   // corazones
    note: [
      39, 40, 174, 131, 401, 402, 441, 358, 433, 730
    ],   // notas
    zzz: [
      143, 446, 79, 80, 775
    ],   // Zzz (dormilones)
    star: [
      35, 36, 173, 175, 176, 468, 209, 210, 303, 682, 684, 685, 868, 869, 707,
      100036, 100303   // sus megas (28-10-2026)
    ],   // destellos de hada
    psy: [
      63, 64, 65, 96, 97, 122, 177, 178, 202, 280, 281, 325, 326, 437, 475, 574,
      575, 576, 577, 578, 579, 677, 678, 856, 857, 858,
      100065, 100475, 100678   // sus megas (28-10-2026)
    ],   // aros psíquicos
    wisp: [
      92, 93, 94, 353, 354, 425, 426, 708, 709, 710, 711, 885, 886, 887,
      100094, 100354   // sus megas (28-10-2026)
    ],   // fuegos fatuos
    smoke: [
      198, 430, 261, 262, 359, 509, 510, 559, 560, 570, 571, 629, 630, 633, 634, 635,
      778, 859, 860, 861,
      100359   // sus megas (28-10-2026)
    ],   // humo oscuro
    sand: [
      27, 28, 50, 51, 74, 75, 76, 95, 104, 105, 111, 112, 246, 247, 248, 328,
      329, 330, 443, 444, 445, 449, 450, 551, 552, 553, 769, 770,
      100248, 100445, 100208, 100530   // sus megas (28-10-2026)
    ],   // arena
    dragon: [
      147, 148, 149, 371, 372, 373, 610, 611, 612, 714, 715,
      100149, 100373, 100334, 100780   // sus megas (28-10-2026)
    ],   // destellos de dragón
    gas: [
      88, 89, 109, 110, 316, 317, 434, 435, 568, 569,
      100691   // sus megas (28-10-2026)
    ],   // gas
    slime: [
      704, 705, 706
    ],   // gotas de baba
    coin: [
      52, 53, 863, 1000
    ],   // monedas
  };
  // Los que sólo tienen su rastro arriba, también sus partículas de aquí.
  for (const [k, list] of Object.entries(SIG)) for (const d of list) if (!SPECIAL[d] || !SPECIAL[d].parts && Object.keys(SPECIAL[d]).every(k => k === 'trail' || k === 'glint')) SPECIAL[d] = Object.assign({ parts: SIG_PARTS[k] }, SPECIAL[d]);

  const rgb = c => hex(c.slice(1)).join(',');

  /** Efecto propio de `dex` (el número del sprite que lleva). Llámalo ANTES de dibujar el sprite:
   *  dibuja lo de detrás y suelta sus partículas. y: los pies (ya con lo que se eleve). */
  function special(ctx, ent, dex, y, t, dt) {
    const S = SPECIAL[dex];
    if (!S || ent.dead) return;
    const h = ent.bodyH || 24, r = ent.r || 12, x = ent.x, seed = seedOf(ent);
    if (S.rays) drawRays(ctx, S.rays, x, y - h * 0.55, Math.max(h * 1.25, r * 2.6), t, seed);
    if (S.aurora) drawAurora(ctx, S.aurora, x, y - h * 1.05, Math.max(r * 2.4, h * 0.9), t, seed);
    // (28-10-2026) El aura de su color, sólo de noche (de día no quedaba bien), salvo los que la
    // llevan siempre (day: los singulares, Arceus y la línea de Lucario).
    const night = nightNow(), dayK = S.day ? 1 : night;
    if (S.aura && dayK > 0) {
      // Luz suave detrás del cuerpo que respira (con pulse, se apaga y se enciende despacio).
      const cy = y - h * 0.5, R = Math.max(h * 0.8, r * 1.9), c = rgb(S.aura);
      const a = 0.38 * dayK * (S.pulse ? 0.1 + 0.9 * breathe(t, seed, S.pulse) : 0.7 + 0.3 * Math.sin(t * 1.2 + seed));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      chunky(ctx, x - R, cy - R, R * 2, R * 2, c2 => {
        const g = c2.createRadialGradient(x, cy, 0, x, cy, R);
        g.addColorStop(0, `rgba(${c},${a})`);
        g.addColorStop(0.5, `rgba(${c},${a * 0.45})`);
        g.addColorStop(1, `rgba(${c},0)`);
        c2.fillStyle = g;
        c2.fillRect(x - R, cy - R, R * 2, R * 2);
      });
      ctx.restore();
    }
    if (S.back) {
      ctx.save();
      ctx.fillStyle = S.c;
      ctx.globalCompositeOperation = 'lighter';
      if (S.back === 'clock') {
        // Esfera de reloj en el suelo que aparece de vez en cuando: doce marcas y una aguja (en píxeles).
        const w = wave(t, seed, 10, 5);
        if (w > 0) {
          const rx = r * 2.2 + h * 0.2, ry = rx * 0.38;
          ctx.globalAlpha = 0.55 * w;
          pixEllipse(ctx, x, y, rx, ry);
          for (let i = 0; i < 12; i++) {
            const a = i * 0.5236, cx = Math.cos(a), cy = Math.sin(a);
            pixLine(ctx, x + cx * rx * 0.8, y + cy * ry * 0.8, x + cx * rx * 0.9, y + cy * ry * 0.9);
          }
          const a = t * 0.5;
          ctx.globalAlpha = 0.8 * w;
          pixLine(ctx, x, y, x + Math.cos(a) * rx * 0.7, y + Math.sin(a) * ry * 0.7);
          dot(ctx, x, y);
        }
      } else if (S.back === 'ripple') {
        // Un par de ondas de píxeles que salen despacio de los pies, a ratos.
        const w = wave(t, seed, 6, 3.5);
        for (let i = 0; i < 2 && w > 0; i++) {
          const k = (t * 0.45 + i / 2) % 1, rx = r * (1 + 2.2 * k) + h * 0.1;
          ctx.globalAlpha = 0.5 * w * (1 - k);
          pixEllipse(ctx, x, y, rx, rx * 0.36);
        }
      }
      ctx.restore();
    }
    if (S.orbit) drawOrbit(ctx, S.orbit, ent, y, t, false);
    if (S.parts && dt > 0 && parts.length < MAX && G.Settings.get('quality') !== 'low') {
      const P = S.parts, w = wave(t, seed + 3, 8, 4.5);
      if (w <= 0) return;
      // De noche, algo más (sus efectos lucen más a oscuras).
      ent._specAcc = (ent._specAcc || 0) + dt * P.rate * 0.8 * w * (1 + 0.6 * night);
      while (ent._specAcc >= 1 && parts.length < MAX) {
        ent._specAcc -= 1;
        const c = P.hue ? 'hsl(' + Math.floor(Math.random() * 360) + ',100%,72%)' : G.U.pick(P.c);
        parts.push({ x: x + G.U.rand(-r, r) * 1.3, y: y - G.U.rand(0.05, P.low ? 0.3 : 0.95) * h, vx: G.U.rand(-1, 1) * P.spread * 0.4,
          vy: -P.up * 0.75 * G.U.rand(0.6, 1.2), t: 0, life: P.life * 1.2 * G.U.rand(0.7, 1.2), c, r: P.r * G.U.rand(0.8, 1.3) * G.Sprites.PX, P });
      }
    }
  }

  // ---------------- lo nuevo de los legendarios (28-10-2026) ----------------
  const rgba = (c, a) => (c[0] === 'h' ? c.replace('%)', '%,' + a + ')').replace('hsl(', 'hsla(') : 'rgba(' + rgb(c) + ',' + a + ')');
  // Un número "al azar" fijo para cada n (el mismo en cada fotograma).
  const hash = n => { const v = Math.sin(n * 127.1) * 43758.5; return v - Math.floor(v); };

  // ---------------- en píxeles (28-10-2026) ----------------
  // Todo en píxeles del arte (PX × PX), como los sprites: nada de líneas finas, círculos lisos ni
  // degradados suaves.
  const snap = v => { const u = G.Sprites.PX; return Math.round(v / u) * u; };
  /** Un píxel del arte en (x, y) (s: de cuántos píxeles de lado). */
  function dot(ctx, x, y, s = 1) { const u = G.Sprites.PX * s; ctx.fillRect(snap(x), snap(y), u, u); }
  /** Elipse de píxeles (las ondas, el reloj, los aros). */
  function pixEllipse(ctx, x, y, rx, ry) {
    const u = G.Sprites.PX, n = Math.max(8, Math.round(6.2832 * Math.sqrt((rx * rx + ry * ry) / 2) / u)), seen = new Set();
    for (let i = 0; i < n; i++) {
      const a = i * 6.2832 / n, px = snap(x + Math.cos(a) * rx), py = snap(y + Math.sin(a) * ry), k = px + ',' + py;
      if (!seen.has(k)) { seen.add(k); ctx.fillRect(px, py, u, u); }
    }
  }
  /** Línea de píxeles. */
  function pixLine(ctx, x0, y0, x1, y1) {
    const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) / G.Sprites.PX));
    for (let i = 0; i <= n; i++) dot(ctx, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n);
  }
  /** Dibujito de píxeles: filas con 'x' (y 'o', del segundo color), centrado en (x, y); u: tamaño del píxel. */
  function glyph(ctx, rows, x, y, u, c2) {
    const c1 = ctx.fillStyle, ox = Math.round(x) - Math.floor(rows[0].length / 2) * u, oy = Math.round(y) - Math.floor(rows.length / 2) * u;
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        if (row[i] === '.') continue;
        ctx.fillStyle = row[i] === 'o' && c2 ? c2 : c1;
        ctx.fillRect(ox + i * u, oy + j * u, u, u);
      }
    });
    ctx.fillStyle = c1;
  }
  /** Degradados (auras, rayos) a cuadritos: se pintan en un lienzo pequeño a 1/PX y se pegan sin
   *  suavizar. fn(c) dibuja con las mismas coordenadas que ctx. */
  let low = null;
  function chunky(ctx, x, y, w, h, fn) {
    const u = G.Sprites.PX, X = Math.floor(x / u) * u, Y = Math.floor(y / u) * u;
    const W = Math.ceil((w + x - X) / u) + 1, H = Math.ceil((h + y - Y) / u) + 1;
    if (!low) low = document.createElement('canvas');
    if (low.width < W) low.width = W;
    if (low.height < H) low.height = H;
    const c = low.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, W, H);
    c.setTransform(1 / u, 0, 0, 1 / u, -X / u, -Y / u);
    fn(c);
    const sm = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(low, 0, 0, W, H, X, Y, W * u, H * u);
    ctx.imageSmoothingEnabled = sm;
  }
  // Notas (♪ y ♫) y la Z de los dormilones, en píxeles.
  const NOTE1 = ['..xx', '..x.', '..x.', 'xxx.', 'xxx.'];
  const NOTE2 = ['.xxxx', '.x..x', '.x..x', 'xx.xx', 'xx.xx'];
  const ZED = ['xxxx', '..x.', '.x..', 'xxxx'];
  const DIAMOND = ['..x..', '.xxx.', 'xxxxx', '.xxx.', '..x..'];
  const AROUND = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  /** Rayos de luz que giran despacio detrás (el sol de Solgaleo, la luz de Arceus), a ratos.
   *  c: su color, o 'hue' para uno de cada color. */
  function drawRays(ctx, c, x, cy, R, t, seed) {
    const w = wave(t, seed + 5, 9, 6);
    if (w <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    chunky(ctx, x - R, cy - R, R * 2, R * 2, c2 => {
      c2.globalCompositeOperation = 'lighter';
      for (let i = 0, n = 10; i < n; i++) {
        const a = t * 0.15 + i * 6.2832 / n, da = 0.09 + 0.03 * Math.sin(t * 1.3 + i * 1.7);
        const len = R * (0.75 + 0.25 * Math.sin(t * 0.9 + i * 2.3));
        const col = c === 'hue' ? 'hsl(' + ((i * 36 + t * 40) % 360 | 0) + ',100%,72%)' : c;
        const g = c2.createRadialGradient(x, cy, 0, x, cy, len);
        g.addColorStop(0, rgba(col, 0.3 * w));
        g.addColorStop(1, rgba(col, 0));
        c2.fillStyle = g;
        c2.beginPath(); c2.moveTo(x, cy); c2.arc(x, cy, len, a - da, a + da); c2.closePath(); c2.fill();
      }
    });
    ctx.restore();
  }

  /** Aurora por encima (Suicune, Articuno): cortinas de luz que ondean, con el borde de abajo
   *  brillante y desvaneciéndose hacia arriba, en columnas de un píxel del sprite, a ratos.
   *  cs: un color por cortina (vivos: los pálidos se ven grises al sumarse). */
  function drawAurora(ctx, cs, x, top, L, t, seed) {
    const w = wave(t, seed + 7, 11, 7);
    if (w <= 0) return;
    const px = G.Sprites.PX;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    cs.forEach((c, j) => {
      for (let sx = -L; sx <= L; sx += px) {
        const edge = Math.min(1, 2.2 * (1 - Math.abs(sx) / L));
        const yy = Math.round(top - j * 6 + Math.sin(sx * 0.05 + t * 1.1 + j * 2) * 6 + Math.sin(sx * 0.13 - t * 0.7) * 2);
        const hh = Math.round(10 + 7 * Math.sin(sx * 0.08 + t * 0.8 + j * 1.7));
        const a = 0.55 * w * edge * (0.55 + 0.45 * Math.sin(sx * 0.17 + t * 2.2 + j));
        if (a <= 0.01) continue;
        const X = Math.round(x + sx);
        ctx.fillStyle = rgba(c, a);            // el borde de abajo, el más brillante
        ctx.fillRect(X, yy, px, px);
        ctx.fillStyle = rgba(c, a * 0.45);
        ctx.fillRect(X, yy - Math.round(hh * 0.4), px, Math.round(hh * 0.4));
        ctx.fillStyle = rgba(c, a * 0.18);
        ctx.fillRect(X, yy - hh, px, Math.round(hh * 0.6));
      }
    });
    ctx.restore();
  }

  // ---------------- rastros en el suelo (28-10-2026) ----------------
  // Cómo es cada punto del rastro: life segundos que dura · gap píxeles entre uno y otro · solid:
  // se pinta tapando (flores, plumas, sombras), no sumando luz · draw(ctx, p, fade, t, c) lo dibuja
  // (fade 0..1: aparece rápido y se apaga despacio). Todo en píxeles del arte.
  const TRAILS = {
    // Cortinas de aurora de pie sobre el suelo (Suicune): el borde de abajo brillante y
    // desvaneciéndose hacia arriba, en columnas de un píxel del sprite.
    aurora: { life: 2.4, gap: 3, draw(ctx, p, fade, t, cs) {
      const px = G.Sprites.PX, c = cs[(p.i >> 2) % cs.length], y0 = Math.round(p.y - 1 - p.age * 3);
      for (let j = -1; j <= 1; j++) {
        const x = Math.round(p.x + j * px), hh = Math.round(14 + 9 * Math.sin(p.i * 0.7 + j + t * 1.5));
        const a = 0.9 * fade * (0.55 + 0.45 * Math.sin(p.i * 0.9 + j * 1.3 + t * 3));
        ctx.fillStyle = rgba('#ffffff', a * 0.5); ctx.fillRect(x, y0, px, px);
        ctx.fillStyle = rgba(c, a); ctx.fillRect(x, y0 - px, px, px);
        ctx.fillStyle = rgba(c, a * 0.5); ctx.fillRect(x, y0 - px - Math.round(hh * 0.4), px, Math.round(hh * 0.4));
        ctx.fillStyle = rgba(c, a * 0.2); ctx.fillRect(x, y0 - hh - px, px, Math.round(hh * 0.6));
      }
    } },
    // Llamas que arden donde pisa (tres lenguas de fuego que bailan) y se apagan (Entei, Moltres...).
    flame: { life: 1.5, gap: 5, draw(ctx, p, f, t, cs) {
      const u = G.Sprites.PX, y = snap(p.y);
      ctx.fillStyle = rgba(cs[2], 0.22 * f); glyph(ctx, ['.xxx.', 'xxxxx', '.xxx.'], p.x, y - u, u);
      for (let j = -1; j <= 1; j++) {
        const x = snap(p.x + j * u), fl = 0.65 + 0.35 * Math.sin(t * 15 + p.i * 2 + j * 2.1);
        const n = Math.max(1, Math.round((3 + 3 * hash(p.i * 3 + j)) * fl * (0.35 + 0.65 * f) * (j ? 0.7 : 1)));
        const m = Math.max(1, Math.round(n * 0.65)), q = Math.max(1, Math.round(n * 0.3));
        ctx.fillStyle = rgba(cs[2], 0.9 * f); ctx.fillRect(x, y - n * u, u, n * u);
        ctx.fillStyle = rgba(cs[1], 0.95 * f); ctx.fillRect(x, y - m * u, u, m * u);
        ctx.fillStyle = rgba(cs[0], f); ctx.fillRect(x, y - q * u, u, q * u);
      }
    } },
    // Chispas que crepitan en el suelo (Raikou, Zekrom...).
    spark: { life: 1.2, gap: 5, draw(ctx, p, f, t, cs) {
      if (hash(p.i * 7 + Math.floor(t * 14)) < 0.3) return;
      const s = hash(p.i + Math.floor(t * 5)) < 0.5 ? -1 : 1, x = p.x, y = p.y;
      ctx.fillStyle = rgba(cs[(p.i + Math.floor(t * 8)) % cs.length], f);
      pixLine(ctx, x - 8 * s, y + 1, x - 2 * s, y - 5); pixLine(ctx, x - 2 * s, y - 5, x + s, y); pixLine(ctx, x + s, y, x + 8 * s, y - 6);
      ctx.fillStyle = rgba('#ffffff', f); dot(ctx, x, y - 2);
    } },
    // Flores que se abren donde pisa y luego se marchitan (Shaymin hace florecer la tierra).
    flower: { life: 3.2, gap: 6, solid: true, draw(ctx, p, f, t, cs) {
      const u = G.Sprites.PX, x = p.x + (hash(p.i) - 0.5) * 12, y = p.y + (hash(p.i + 3) - 0.5) * 6;
      ctx.globalAlpha = Math.min(1, f * 1.5);
      ctx.fillStyle = '#2f7a2a'; dot(ctx, x, y + u);
      ctx.fillStyle = cs[p.i % (cs.length - 1)];
      glyph(ctx, p.age > 0.25 ? ['.x.', 'xox', '.x.'] : ['o'], snap(x), snap(y), u, cs[cs.length - 1]);
      ctx.globalAlpha = 1;
    } },
    // Escarcha: copos de hielo pegados al suelo que brillan y se derriten.
    frost: { life: 2.8, gap: 5, draw(ctx, p, f, t, cs) {
      const u = G.Sprites.PX, x = snap(p.x + (hash(p.i) - 0.5) * 8), y = snap(p.y), tw = 0.6 + 0.4 * Math.sin(t * 4 + p.i);
      ctx.fillStyle = rgba(cs[1], 0.3 * f); glyph(ctx, ['.xxx.', 'xxxxx', '.xxx.'], x, y, u);
      ctx.fillStyle = rgba(cs[0], f * tw); glyph(ctx, ['x.x', '.o.', 'x.x'], x, y, u, rgba('#ffffff', f));
    } },
    // Charcos de sombra que se quedan un momento, con alguna chispa que sube (Darkrai, Giratina...).
    shadow: { life: 2.4, gap: 5, solid: true, draw(ctx, p, f, t, cs) {
      const u = G.Sprites.PX, x = snap(p.x), y = snap(p.y), w = 3 + Math.round(1.5 * Math.sin(t * 2 + p.i));
      ctx.fillStyle = rgba(cs[0], 0.5 * f);
      ctx.fillRect(x - w * u, y, w * 2 * u, u); ctx.fillRect(x - (w - 1) * u, y - u, (w * 2 - 2) * u, 3 * u);
      if (hash(p.i * 3 + Math.floor(t * 3)) > 0.5) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = rgba(cs[1], f); dot(ctx, x + (hash(p.i) - 0.5) * 10, y - 3 - p.age * 8);
        ctx.globalCompositeOperation = 'source-over';
      }
    } },
    // Ondas de agua que se abren en el suelo (Kyogre, Manaphy...).
    puddle: { life: 1.8, gap: 10, draw(ctx, p, f, t, cs) {
      const k = p.age / 1.8, rx = 4 + 16 * k;
      ctx.fillStyle = rgba(cs[0], 0.9 * f); pixEllipse(ctx, p.x, p.y, rx, rx * 0.38);
      if (k > 0.25) { ctx.fillStyle = rgba(cs[1], 0.55 * f); pixEllipse(ctx, p.x, p.y, rx * 0.5, rx * 0.19); }
    } },
    // Destellos de arcoíris que caen detrás (Ho-Oh: en el anime deja un arcoíris al volar).
    rainbow: { life: 2, gap: 3, draw(ctx, p, f, t) {
      const u = G.Sprites.PX, c = 'hsl(' + ((p.i * 23) % 360) + ',100%,68%)';
      const x = snap(p.x + (hash(p.i) - 0.5) * 22), y = snap(p.y - 6 + p.age * 4);
      ctx.fillStyle = rgba(c, 0.2 * f); glyph(ctx, DIAMOND, x, y, u);
      ctx.fillStyle = rgba(c, f);
      glyph(ctx, Math.sin(t * 6 + p.i) > 0 ? ['..x..', '..x..', 'xxoxx', '..x..', '..x..'] : ['.x.', 'xox', '.x.'], x, y, u, rgba('#ffffff', f));
    } },
    // Grietas de magma que brillan y se enfrían (Groudon, Heatran): de amarillo a rojo oscuro.
    magma: { life: 2.2, gap: 6, draw(ctx, p, f, t, cs) {
      const k = p.age / 2.2, x = p.x, y = p.y, s = hash(p.i) < 0.5 ? -1 : 1, a = (hash(p.i + 1) - 0.5) * 4;
      ctx.fillStyle = rgba(k < 0.3 ? cs[0] : k < 0.6 ? cs[1] : cs[2], f * (0.75 + 0.25 * Math.sin(t * 5 + p.i)));
      pixLine(ctx, x - 7 * s, y + a, x - 2 * s, y - 1); pixLine(ctx, x - 2 * s, y - 1, x + 2 * s, y + 2); pixLine(ctx, x + 2 * s, y + 2, x + 7 * s, y - a);
      if (hash(p.i + 5) > 0.6) pixLine(ctx, x - 2 * s, y - 1, x - 3 * s, y - 5);
    } },
    // Plumas que caen de su cuerpo meciéndose, se posan y se apagan (Lugia plateadas, Yveltal rojas).
    feather: { life: 3, gap: 9, solid: true, draw(ctx, p, f, t, cs) {
      const k = Math.min(1, p.age / 1.1), sw = Math.sin(p.age * 5 + p.i);
      const x = p.x + (1 - k) * sw * 6 + (hash(p.i) - 0.5) * 14, y = p.y - (1 - k) * p.h;
      ctx.globalAlpha = Math.min(1, f * 1.4);
      ctx.fillStyle = cs[p.i % 2];
      glyph(ctx, k >= 1 || sw > 0 ? ['.x', 'xo', 'xo', 'o.'] : ['x.', 'ox', 'ox', '.o'], snap(x), snap(y), G.Sprites.PX, cs[2]);
      ctx.globalAlpha = 1;
    } },
    // Células de Zygarde que parpadean en el suelo.
    cell: { life: 2.6, gap: 7, draw(ctx, p, f, t, cs) {
      const on = hash(p.i * 3 + Math.floor(t * 2)) > 0.35 ? 1 : 0.45;
      ctx.fillStyle = rgba(cs[0], f * on);
      glyph(ctx, ['.x.', 'xox', '.x.'], snap(p.x + (hash(p.i) - 0.5) * 10), snap(p.y), G.Sprites.PX, rgba(cs[1], f));
    } },
    // Estrellitas que se quedan titilando (Jirachi, Cosmog).
    star: { life: 2.4, gap: 6, draw(ctx, p, f, t, cs) {
      ctx.fillStyle = rgba(cs[p.i % cs.length], f);
      glyph(ctx, Math.sin(t * 5 + p.i * 1.7) > 0.2 ? ['..x..', '.xxx.', 'xxoxx', '.x.x.'] : ['.x.', 'xox', '.x.'],
        snap(p.x + (hash(p.i) - 0.5) * 12), snap(p.y - 1), G.Sprites.PX, rgba('#ffffff', f));
    } },
    // Cristales de Teracristal que brotan del suelo, cada uno de un color, y se deshacen (Terapagos).
    tera: { life: 2.4, gap: 6, draw(ctx, p, f, t) {
      const c = 'hsl(' + ((p.i * 47 + t * 30) % 360 | 0) + ',100%,70%)', grown = p.age > 0.3;
      ctx.fillStyle = rgba(c, f);
      glyph(ctx, grown ? ['.x.', 'xox', 'xxx', '.x.'] : ['x', 'x'], snap(p.x + (hash(p.i) - 0.5) * 12), snap(p.y - (grown ? 4 : 1)), G.Sprites.PX, rgba('#ffffff', f));
    } },
    // Notas que rebotan en el suelo (Meloetta).
    note: { life: 2.2, gap: 9, solid: true, draw(ctx, p, f, t, cs) {
      const x = snap(p.x + (hash(p.i) - 0.5) * 10), y = snap(p.y - 6 - Math.abs(Math.sin(p.age * 4 + p.i)) * 5), n = p.i % 2 ? NOTE1 : NOTE2;
      ctx.fillStyle = rgba('#141830', 0.5 * f); glyph(ctx, n, x + 2, y + 2, 2);
      ctx.fillStyle = rgba(cs[p.i % cs.length], f); glyph(ctx, n, x, y, 2);
    } },
    // Aros dorados de la Sentencia que se abren en el suelo (Arceus).
    gold: { life: 2.2, gap: 10, draw(ctx, p, f, t, cs) {
      const rx = 5 + 4 * p.age / 2.2;
      ctx.fillStyle = rgba(cs[0], f * (0.7 + 0.3 * Math.sin(t * 4 + p.i))); pixEllipse(ctx, p.x, p.y, rx, rx * 0.4);
      ctx.fillStyle = rgba(cs[1], f); dot(ctx, p.x, p.y);
    } },
    // Nubes de energía roja que suben del suelo (Eternatus, como el Dinamax).
    miasma: { life: 2.4, gap: 6, draw(ctx, p, f, t, cs) {
      for (let j = 0; j < 3; j++) {
        ctx.fillStyle = rgba(cs[j % cs.length], 0.6 * f * (0.7 + 0.3 * Math.sin(t * 3 + j + p.i)));
        dot(ctx, p.x + (hash(p.i * 3 + j) - 0.5) * 12, p.y - p.age * 5 - j * 3, hash(p.i + j * 7) > 0.6 ? 2 : 1);
      }
    } },
    // Aros psíquicos pequeños que se abren en el suelo (Mewtwo, Mew, Espeon...).
    psy: { life: 1.4, gap: 9, draw(ctx, p, f, t, cs) {
      const rx = 2 + 6 * p.age / 1.4;
      ctx.fillStyle = rgba(cs[0], 0.9 * f); pixEllipse(ctx, p.x, p.y, rx, rx * 0.45);
      ctx.fillStyle = rgba(cs[1], f * (0.6 + 0.4 * Math.sin(t * 6 + p.i))); dot(ctx, p.x, p.y - 2 - p.age * 4);
    } },
    // Piedrecitas que saltan al pisar y se quedan quietas (Regirock, Tyranitar, Garchomp...).
    rock: { life: 2, gap: 6, solid: true, draw(ctx, p, f, t, cs) {
      const k = Math.min(1, p.age / 0.35), up = Math.sin(k * Math.PI) * 5;
      ctx.globalAlpha = Math.min(1, f * 1.5);
      for (let j = 0; j < 2; j++) {
        ctx.fillStyle = cs[(p.i + j) % cs.length];
        dot(ctx, p.x + (hash(p.i * 2 + j) - 0.5) * 10 * (0.5 + 0.5 * k), p.y - up * (j ? 0.6 : 1), hash(p.i + j * 5) > 0.4 ? 2 : 1);
      }
      ctx.globalAlpha = 1;
    } },
    // Destello de metal: un brillo en cruz que se enciende y se apaga una vez (Registeel, Metagross...).
    metal: { life: 1.2, gap: 8, draw(ctx, p, f, t, cs) {
      const k = p.age / 1.2, big = k > 0.15 && k < 0.5, x = snap(p.x + (hash(p.i) - 0.5) * 10), y = snap(p.y - 2);
      ctx.fillStyle = rgba(cs[1], 0.5 * f); pixLine(ctx, x - 6, y + 2, x + 6, y + 2);
      ctx.fillStyle = rgba(cs[0], f);
      glyph(ctx, big ? ['..x..', '..x..', 'xxoxx', '..x..', '..x..'] : ['.x.', 'xox', '.x.'], x, y, G.Sprites.PX, rgba('#ffffff', f));
    } },
    // Ráfagas de viento que se quedan detrás y se abren hacia los lados (Rayquaza, Tornadus, Dragonite...).
    wind: { life: 1.1, gap: 6, draw(ctx, p, f, t, cs) {
      const mx = p.ny, my = -p.nx, side = (hash(p.i) - 0.5) * 16 + (hash(p.i) < 0.5 ? -1 : 1) * p.age * 10, len = 6 + 6 * hash(p.i + 2);
      const x = p.x + p.nx * side, y = p.y - 6 + p.ny * side * 0.5;
      ctx.fillStyle = rgba(cs[p.i % cs.length], 0.8 * f); pixLine(ctx, x - mx * len, y - my * len * 0.5, x + mx * len, y + my * len * 0.5);
    } },
    // Corazones de píxeles que suben un poco y se apagan (Sylveon, Gardevoir, Magearna...).
    heart: { life: 1.8, gap: 10, solid: true, draw(ctx, p, f, t, cs) {
      ctx.globalAlpha = Math.min(1, f * 1.4);
      ctx.fillStyle = cs[p.i % (cs.length - 1)];
      glyph(ctx, ['.x.x.', 'xxoxx', '.xxx.', '..x..'], snap(p.x + (hash(p.i) - 0.5) * 12), snap(p.y - 4 - p.age * 6), G.Sprites.PX, cs[cs.length - 1]);
      ctx.globalAlpha = 1;
    } },
    // Gemas rosas que relucen en el suelo (Diancie, las perlas de Palkia).
    gem: { life: 2.2, gap: 7, draw(ctx, p, f, t, cs) {
      const tw = Math.sin(t * 5 + p.i) > 0.6;
      ctx.fillStyle = rgba(cs[0], f);
      glyph(ctx, ['.x.', 'xxx', 'xox', '.x.'], snap(p.x + (hash(p.i) - 0.5) * 12), snap(p.y - 3), G.Sprites.PX, rgba(tw ? '#ffffff' : cs[1], f));
    } }
  };
  const TRAIL_MAX = 90;
  /** Va dejando un rastro por donde pasa: un punto cada `gap` píxeles mientras dura la ola (unos
   *  7 s de cada 11) y se mueve; cada uno se apaga solo. Detrás del sprite (lo llama special). */
  function drawTrail(ctx, ent, R, y, t, dt) {
    const T = TRAILS[R.s];
    if (!T) return;
    const l = ent._trail || (ent._trail = []);
    if (dt > 0) {
      for (const p of l) p.age += dt;
      while (l.length && l[0].age >= T.life) l.shift();
      const at = ent._trailAt, d = at ? Math.hypot(ent.x - at.x, y - at.y) : 0;
      if (at && d > 80) ent._trailAt = { x: ent.x, y };              // saltó (cambio de mapa...): sin raya
      else if (wave(t, seedOf(ent) + 2, 11, 7) > 0.15 && l.length < TRAIL_MAX && (!at || d > T.gap)) {
        const nx = at ? (at.y - y) / (d || 1) : 0, ny = at ? (ent.x - at.x) / (d || 1) : 1;
        l.push({ x: ent.x + G.U.rand(-3, 3), y: y - 1, nx, ny, h: (ent.bodyH || 24) * 0.6, age: 0, i: ent._trailN = (ent._trailN || 0) + 1 });
        ent._trailAt = { x: ent.x, y };
      }
    }
    if (!l.length) return;
    ctx.save();
    ctx.globalCompositeOperation = T.solid ? 'source-over' : 'lighter';
    for (const p of l) {
      const k = p.age / T.life;
      T.draw(ctx, p, k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85, t, R.c);
    }
    ctx.restore();
  }

  /** Lo que gira alrededor (los aros de Hoopa, las gemas del trío del lago, las células de
   *  Zygarde): la mitad de detrás antes del sprite (special) y la de delante después (front).
   *  O: { n cuántos, c colores, s cómo son ('gem' | 'ring' | 'cell' | 'star'), sp vueltas por segundo }. */
  function drawOrbit(ctx, O, ent, y, t, inFront) {
    const h = ent.bodyH || 24, r = ent.r || 12, seed = seedOf(ent);
    const R = Math.max(r * 1.7, h * 0.55), cy = y - h * 0.55, u = G.Sprites.PX;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < O.n; i++) {
      const a = t * (O.sp || 0.5) * 6.2832 + seed + i * 6.2832 / O.n, z = Math.sin(a);
      if ((z >= 0) !== inFront) continue;
      const ox = snap(ent.x + Math.cos(a) * R), oy = snap(cy + z * R * 0.32 + Math.sin(t * 2 + i) * 2);
      const c = O.c[i % O.c.length], k = inFront ? 1 : 0.55;           // los de detrás, más apagados
      // Halo en píxeles (un rombo tenue) y la pieza.
      ctx.fillStyle = rgba(c, 0.22 * k);
      glyph(ctx, DIAMOND, ox, oy, u);
      ctx.globalAlpha = 0.9 * k;
      ctx.fillStyle = c;
      if (O.s === 'ring') {
        pixEllipse(ctx, ox, oy, 3.5 * u, 2.5 * u);
      } else if (O.s === 'cell') {
        ctx.fillRect(ox - u, oy - u, 2 * u, 2 * u);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(ox - u, oy - u, u, u);
      } else if (O.s === 'star') {
        glyph(ctx, Math.sin(t * 4 + i) > 0 ? ['..x..', '..x..', 'xxoxx', '..x..', '..x..'] : ['.x.', 'xox', '.x.'], ox, oy, u, '#ffffff');
      } else {
        // Gema: un rombo con el centro blanco.
        ctx.fillRect(ox - u, oy - 2 * u, 2 * u, 4 * u); ctx.fillRect(ox - 2 * u, oy - u, 4 * u, 2 * u);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(ox - u, oy - u, u, u);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  /** Grupos de píxeles pegados de un fotograma (los puntos de los Regi), en orden alrededor de su
   *  centro empezando por arriba. Se calcula una vez por fotograma. */
  function groupsOf(o, key) {
    if (!o.groups) o.groups = new Map();
    let gs = o.groups.get(key);
    if (gs) return gs;
    const l = o.pts.get(key) || [], at = new Map(), seen = new Set();
    for (let i = 0; i < l.length; i += 2) at.set(l[i] + ',' + l[i + 1], [l[i], l[i + 1]]);
    gs = [];
    for (const [k0, p0] of at) {
      if (seen.has(k0)) continue;
      const g = [], todo = [p0];
      seen.add(k0);
      while (todo.length) {
        const [px, py] = todo.pop();
        g.push(px, py);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const k = (px + dx) + ',' + (py + dy);
          if (at.has(k) && !seen.has(k)) { seen.add(k); todo.push(at.get(k)); }
        }
      }
      let sx = 0, sy = 0;
      for (let i = 0; i < g.length; i += 2) { sx += g[i]; sy += g[i + 1]; }
      g.cx = sx / (g.length / 2); g.cy = sy / (g.length / 2);
      gs.push(g);
    }
    const mx = gs.reduce((s, g) => s + g.cx, 0) / (gs.length || 1), my = gs.reduce((s, g) => s + g.cy, 0) / (gs.length || 1);
    const ang = g => (Math.atan2(g.cx - mx, my - g.cy) + 6.2832) % 6.2832;
    gs.sort((a, b) => ang(a) - ang(b));
    o.groups.set(key, gs);
    return gs;
  }

  /** Cuánto brilla ahora el punto i de n en una vuelta de `s` segundos: se encienden uno detrás de
   *  otro, se quedan un rato encendidos todos, se apagan juntos y descansan a oscuras. */
  function seqLevel(i, n, t, seed, s) {
    const k = ((((t + seed) % s) + s) % s) / s, on = 0.05 + 0.4 * i / Math.max(1, n);
    if (k < on) return 0;
    if (k < on + 0.06) return (k - on) / 0.06;
    if (k < 0.72) return 1;
    if (k < 0.88) return 1 - (k - 0.72) / 0.16;
    return 0;
  }

  /** Lo que va DELANTE del sprite: llámalo justo después de dibujarlo (con lo que se eleve en y).
   *  La mitad de delante de lo que gira alrededor y los puntos que se encienden uno a uno. */
  function front(ctx, ent, anim, dex, y, t) {
    if (ent.dead) return;
    const S = SPECIAL[dex];
    if (S && S.orbit) drawOrbit(ctx, S.orbit, ent, y, t, true);
    const rule = SPOTS[dex], ld = anim && anim.lastDraw;
    if (!rule || !rule.seq || !ld) return;
    const o = spotsOf(ld.img, dex, ld.m);
    if (!o) return;
    const gs = groupsOf(o, ld.sx + ',' + ld.sy), seed = seedOf(ent), c = rgb(rule.color), k = ld.k;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    gs.forEach((g, i) => {
      const lv = seqLevel(i, gs.length, t, seed, rule.seq);
      if (lv <= 0) return;
      // Halo en píxeles: el punto, un píxel del arte hacia cada lado y más tenue.
      ctx.fillStyle = 'rgba(' + c + ',' + 0.35 * lv + ')';
      for (let j = 0; j < g.length; j += 2) for (const [ox, oy] of AROUND) ctx.fillRect(ld.dx + (g[j] + ox) * k, ld.dy + (g[j + 1] + oy) * k, k, k);
      ctx.fillStyle = 'rgba(' + c + ',' + lv + ')';            // de su color, sin aclarar: se ve sobre un cuerpo claro
      for (let j = 0; j < g.length; j += 2) ctx.fillRect(ld.dx + g[j] * k, ld.dy + g[j + 1] * k, k, k);
    });
    ctx.restore();
  }

  /** El rastro en el suelo de su sprite. Va aparte de los demás efectos, con su propio ajuste
   *  (trailEnabled): lo llaman player.js y enemy.js ANTES de special y del sprite. dex: el del
   *  sprite (megas y primigenios llevan otro) · mine: es tu compañero. */
  function trail(ctx, ent, dex, y, t, dt, mine) {
    const S = SPECIAL[dex];
    if (!S || !S.trail || ent.dead) return;
    // Quitado: fuera también lo que ya había en el suelo (si no, saldría de golpe al volver a ponerlo).
    if (!trailEnabled(ent.dex || dex, mine)) { ent._trail = null; ent._trailAt = null; return; }
    drawTrail(ctx, ent, S.trail, y, t, dt);
  }
  /** ¿Lleva rastro? (el suyo o el de su mega: la ficha sólo enseña el botón a los que lo tienen) */
  const hasTrail = dex => !!((SPECIAL[dex] && SPECIAL[dex].trail) || (SPECIAL[100000 + dex] && SPECIAL[100000 + dex].trail));

  // ---------------- quitar efectos (Ajustes y la ficha de cada Pokémon) ----------------
  /** ¿Se dibujan los efectos de este Pokémon? dex: el normal (no el de su mega) · mine: es tu
   *  compañero. Ajustes → "Efectos de los Pokémon" (fx: todos, sólo el tuyo o ninguno) y, en la
   *  ficha de la Colección, quitárselos a uno solo (fxOff: lista de números). */
  function enabled(dex, mine) {
    const m = G.Settings.get('fx') || 'all';
    if (m === 'off' || (m === 'partner' && !mine)) return false;
    const off = G.Settings.get('fxOff');
    return !(Array.isArray(off) && off.includes(dex));
  }
  function setEnabled(dex, v) {
    const off = (G.Settings.get('fxOff') || []).filter(d => d !== dex);
    if (!v) off.push(dex);
    G.Settings.set('fxOff', off);
  }
  /** Lo mismo para los rastros, aparte (28-10-2026): Ajustes → "Rastros en el suelo" (trails:
   *  todos, sólo el tuyo o ninguno) y, en la ficha, quitárselo a uno solo (trailOff). */
  function trailEnabled(dex, mine) {
    const m = G.Settings.get('trails') || 'all';
    if (m === 'off' || (m === 'partner' && !mine)) return false;
    const off = G.Settings.get('trailOff');
    return !(Array.isArray(off) && off.includes(dex));
  }
  function setTrailEnabled(dex, v) {
    const off = (G.Settings.get('trailOff') || []).filter(d => d !== dex);
    if (!v) off.push(dex);
    G.Settings.set('trailOff', off);
  }

  // ---------------- para quién ----------------
  /** Opciones de dibujo (Animator.draw) para tu compañero o el de otro jugador (null: sin efectos). */
  function forPlayer(pl, t) {
    if (!enabled(pl.dex, pl === G.Game.player)) return null;
    const o = {};
    // De noche (systems/night.js), los detalles brillan más.
    const night = nightNow();
    const d = pl.anim ? pl.anim.dex : pl.dex;       // el del sprite: megas y primigenios llevan otro
    if (SPOTS[d] && !pl.dead) o.emit = { dex: d, level: emitLevel(d, t, seedOf(pl)) * (1 + 0.8 * night), color: spotColor(d) };
    if (pl.shiny) { const s = sweep(t, (pl.dex % 7) * 0.4); if (s >= 0) o.sweep = s; }
    else if (glint(d)) { const s = sweep(t, (pl.dex % 7) * 0.4); if (s >= 0) { o.sweep = s; o.sweepColor = glint(d); } }
    // (28-10-2026) Sin contorno de color al megaevolucionar: no quedaba bien.
    if (!pl.megaOn && pl === G.Game.player && G.Streak.mul() >= 1.25) o.glow = '#ffd23f';
    return o;
  }
  /** Para un enemigo: sólo jefes, legendarios y shiny (los demás, nada). */
  function forEnemy(e, t) {
    const legend = e.legend || (e.boss && G.Rift.inArena);
    if (!(e.boss || e.shiny || legend) || e.dead || !enabled(e.dex, false)) return null;
    const o = {};
    const d = e.anim ? e.anim.dex : e.dex;
    if (SPOTS[d]) o.emit = { dex: d, level: emitLevel(d, t, e.id) * (1 + 0.8 * nightNow()), color: spotColor(d) };
    if (e.shiny) { const s = sweep(t, (e.id % 9) * 0.37); if (s >= 0) o.sweep = s; }
    else if (glint(d)) { const s = sweep(t, (e.id % 9) * 0.37); if (s >= 0) { o.sweep = s; o.sweepColor = glint(d); } }
    if (legend) o.glow = '#ffd23f';
    else if (e.boss) o.glow = 'rgba(255,90,90,.9)';
    return o;
  }
  /** Color de su franja de luz sin ser shiny (o null). dex: el del sprite. */
  const glint = dex => (SPECIAL[dex] && SPECIAL[dex].glint) || null;
  /** ¿Lleva partículas? (los mismos que forEnemy, más los jugadores) */
  const fancy = e => !!(e.boss || e.shiny || e.legend);

  return { SPOTS, PARTS, SPECIAL, emissive, emitLevel, spotColor, emit, spotEmit, special, front, trail, hasTrail, trailEnabled, setTrailEnabled, TRAILS, enabled, setEnabled, update, draw, clear, sweep, drawSweep, glint, forPlayer, forEnemy, fancy };
})();
