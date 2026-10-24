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
 *   - Partículas suaves según su tipo (PARTS): ascuas, burbujas, hojas, chispas...
 *   - Contorno que brilla (glow): megaevolución, racha alta, jefes y legendarios.
 *   - Destello shiny: una franja de luz cruza el sprite de vez en cuando.
 * Lo usan entities/player.js, entities/enemy.js, core/sprites.js (Animator.draw:
 * opts.glow / opts.emit / opts.sweep) y ui/ui.js (vista de lujo de la colección).
 */
G.Aura = (() => {
  // ---------------- detalles que brillan ----------------
  // color: el tono del brillo · kind: cómo parpadea y qué suelta (SPOT_PARTS) · keep: brilla con
  // sus propios colores, sin teñir (los de varios colores). Elegidos mirando sus colores uno a uno.
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
    136: { on: ['fff700', 'dfb700'], color: '#ffb347', kind: 'flame' },                                        // Flareon: el pelo
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
    636: { on: ['d73f00', '9f0000', 'ff875f'], color: '#ff6a1a', kind: 'flame' },                             // Larvesta: los cuernos
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
    776: { on: ['ffee41', 'be9113'], color: '#ffd23f', kind: 'flame' },                                       // Turtonator: el caparazón
    777: { on: ['f7df5f', 'cfa72f'], color: '#ffe14d', kind: 'spark' },                                       // Togedemaru: las púas
    851: { on: ['ffd901', 'fc6e11', 'e49616'], color: '#ffb347', kind: 'flame' },                             // Centiskorch: las llamas
    854: { on: ['69bcac', 'a8dcd4'], color: '#9fe8d0', kind: 'glow' },                                        // Sinistea: el té
    855: { on: ['69bcac', 'a8dcd4'], color: '#9fe8d0', kind: 'glow' },                                        // Polteageist: el té
    873: { on: ['e9ffda', '9fca90'], color: '#9fe8ff', kind: 'ice' },                                         // Frosmoth
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
    100384: { on: ['fbe361', 'f89c30'], color: '#ffd23f', kind: 'glow' },                                    // Mega Rayquaza: las líneas
    100485: { on: ['e78f27', 'ffc439'], color: '#ffb347', kind: 'flame' },                                   // Mega Heatran
    100719: { on: ['f2a8c8', 'e371ad'], keep: true, color: '#ffb5de', kind: 'glow' },             // Mega Diancie: los diamantes
    // Legendarios (y los primigenios: su sprite es otro número).
    250: { on: ['5fb727', '9fcf6f', '879fff'], keep: true, color: '#9fffd0', kind: 'glow' },                   // Ho-Oh: las puntas de las alas
    382: { on: ['d73f00', 'ff875f'], color: '#ff6a6a', kind: 'glow' },                                       // Kyogre: las líneas
    384: { on: ['fff700', 'dfb700'], color: '#ffe14d', kind: 'glow' },                                        // Rayquaza: los anillos
    483: { on: ['97e7f7', 'c7ffff', '67bfe7'], color: '#9fe8ff', kind: 'glow' },                              // Dialga: el diamante
    484: { on: ['e77fe7', 'b74fb7'], color: '#ff9ff0', kind: 'glow' },                                       // Palkia: las perlas
    487: { on: ['d73f00', '9f0000'], color: '#ff3a3a', kind: 'eye' },                                         // Giratina: las rayas rojas
    491: { on: ['67b7b7', '4f8f8f', 'd73f00'], color: '#7ff0ff', kind: 'eye' },                               // Darkrai: el collar y el ojo
    493: { on: ['0db54f', '1a8e38', 'fff700'], keep: true, color: '#ffe680', kind: 'glow' },                  // Arceus: la rueda y los ojos
    643: { on: ['10a8a8', '186878'], color: '#6affff', kind: 'eye' },                                         // Reshiram: los ojos
    644: { on: ['209090', '207078', 'e03858'], color: '#7fd8ff', kind: 'spark', parts: { c: ['#bfefff', '#7fd8ff'] } },                           // Zekrom: el generador y los ojos
    646: { on: ['d5f2f0', 'afd5e4'], color: '#c8f4ff', kind: 'ice' },                                         // Kyurem: el hielo
    716: { on: ['ffae00', 'f65952', '7b69b4', '30b5de'], keep: true, color: '#ffe0a0', kind: 'glow' },        // Xerneas: los cuernos
    717: { on: ['f74125', 'ff8442'], color: '#ff4a3a', kind: 'glow' },                                       // Yveltal: las alas
    243: { on: ['b797df', '8f67bf'], above: 0.6, color: '#c9b5ff', kind: 'spark' },                          // Raikou: la nube
    244: { on: ['ff570f', 'd7a700'], color: '#ffb347', kind: 'flame' },                                       // Entei: la crin
    249: { on: ['373f8f', '5767b7'], color: '#9fd0ff', kind: 'glow' },                                        // Lugia: las placas
    251: { on: ['b7cfff', '5767b7', '879fff'], color: '#9fe8ff', kind: 'glow' },                              // Celebi: los ojos y las alas
    377: { on: ['ff875f'], color: '#ffb347', kind: 'glow' },                                                  // Regirock: los puntos
    379: { on: ['ff875f'], color: '#ff8a5a', kind: 'glow' },                                                  // Registeel: los puntos
    385: { on: ['5fc737', '8fff67', '278700'], color: '#7fffa0', kind: 'glow' },                              // Jirachi: las cintas
    386: { on: ['879fff', '5767b7', 'b7cfff'], color: '#7fd0ff', kind: 'glow' },                              // Deoxys: el cristal
    480: { on: ['cf3f00', 'ff3f00'], color: '#ff4a4a', kind: 'eye' },                                         // Uxie: la gema
    481: { on: ['cf3f00', 'ff3f00'], color: '#ff4a4a', kind: 'eye' },                                         // Mesprit: la gema
    482: { on: ['cf3f00', 'ff3f00'], color: '#ff4a4a', kind: 'eye' },                                         // Azelf: la gema
    485: { on: ['e78f27', 'f7b71f'], color: '#ffb347', kind: 'flame' },                                       // Heatran: la lava
    488: { on: ['ffe78f'], color: '#ffe680', kind: 'glow' },                                                  // Cresselia: la luna
    649: { on: ['f48673', 'd36450'], color: '#ff6a5a', kind: 'eye' },                                         // Genesect: los ojos
    718: { on: ['93bc3e', '52813b'], color: '#7fff6a', kind: 'glow' },                                        // Zygarde: las células
    720: { on: ['d3a717', 'f9c51a'], color: '#ffe14d', kind: 'glow' },                                        // Hoopa: los aros
    721: { on: ['52b2ff', '73ceff'], color: '#7fd0ff', kind: 'glow' },                                        // Volcanion: el aro del brazo
    785: { on: ['f3901e', 'd66531'], color: '#ffe14d', kind: 'spark' },                                       // Tapu Koko: la cresta
    791: { on: ['ffab28', 'fede70'], color: '#ffd27f', kind: 'glow' },                                        // Solgaleo: el sol
    792: { on: ['7cd8ed', '3b8bd8', 'ff268f'], color: '#c9b5ff', kind: 'glow' },                              // Lunala: el pecho
    800: { on: ['f47b42', 'dc5343', '70bf4c', '6967af'], keep: true, color: '#ffffff', kind: 'eye' },         // Necrozma: el prisma
    802: { on: ['ffef7b', 'ff8a66', 'ff6543'], color: '#ff8a5a', kind: 'eye' },                               // Marshadow: los ojos
    807: { on: ['38c0e5', '77faff', '3cdfe2'], color: '#7fd8ff', kind: 'spark', parts: { c: ['#d6f0ff', '#7fd8ff'] } }, // Zeraora
    849: { on: ['d793ff', '9b5bc1'], color: '#d793ff', kind: 'spark', parts: { c: ['#f0d6ff', '#d793ff'] } }, // Toxtricity
    890: { on: ['ff5858', 'cf2934'], color: '#ff5a6a', kind: 'glow' },                                        // Eternatus: el núcleo
    789: { on: ['d8b000', 'eeed83', '28afea', '8dd5f3'], keep: true, color: '#9fe8ff', kind: 'glow' },         // Cosmog: la nube de estrellas
    793: { on: ['6abde0', '8fdfff', '227da4'], color: '#9fe8ff', kind: 'glow' },                              // Nihilego
    801: { on: ['d3676d', 'ffd5d6', 'e6d05a'], keep: true, color: '#ff9fb0', kind: 'glow' },                  // Magearna: el corazón
    809: { on: ['f6be13', 'd68414'], color: '#ffd23f', kind: 'glow' },                                        // Melmetal: la tuerca
    894: { on: ['fef9b4'], color: '#ffe14d', kind: 'spark' },                                                  // Regieleki
    897: { on: ['f7d1fc', 'af97d9'], color: '#c9b5ff', kind: 'glow' },                                        // Spectrier: la crin
    100382: { on: ['fff3ad', 'f5c26b', 'bc708c'], color: '#7fe8ff', kind: 'glow' },                          // Kyogre primigenio: las líneas
    100383: { on: ['fef9bb'], color: '#ffd27f', kind: 'flame' }                                               // Groudon primigenio: la lava
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
      // Cuanto más grande es lo que brilla (en proporción al cuerpo), más suave: la tuerca de
      // Melmetal o el cuerpo de Regieleki no pueden brillar como las mejillas de Pikachu.
      let lit = 0, body = 0;
      for (let i = 0; i < w * h; i++) { if (d[i * 4 + 3] > 40) body++; if (keep[i]) lit++; }
      const soft = Math.round(255 * Math.max(0.35, Math.min(1, 0.12 / Math.max(0.001, lit / Math.max(1, body)))));
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

  /** Cuánto brilla ahora (según el tipo de detalle). `seed` desfasa a cada Pokémon. */
  function emitLevel(dex, t, seed = 0) {
    const rule = SPOTS[dex];
    if (!rule) return 0;
    if (rule.kind === 'flame') return 0.62 + 0.14 * Math.sin(t * 6) + 0.06 * Math.sin(t * 15.3);
    // Las chispas: tranquilas y, de vez en cuando, un chispazo.
    if (rule.kind === 'spark') { const w = wave(t, seed, 4.5, 1.1); return 0.35 + 0.65 * w * (0.85 + 0.15 * Math.sin(t * 40)); }
    if (rule.kind === 'eye') return 0.55 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.3 + seed));
    return 0.5 + 0.4 * (0.5 + 0.5 * Math.sin(t * 1.6 + seed));
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
    ent._auraAcc = (ent._auraAcc || 0) + dt * P.rate * 0.6 * k * w;
    while (ent._auraAcc >= 1 && parts.length < MAX) {
      ent._auraAcc -= 1;
      const h = ent.bodyH || 24, r = ent.r || 12;
      parts.push({ x: ent.x + G.U.rand(-r, r), y: ent.y - G.U.rand(0.1, 0.95) * h, vx: G.U.rand(-1, 1) * P.spread * 0.3,
        vy: -P.up * 0.7 * G.U.rand(0.6, 1.2), t: 0, life: P.life * 1.3 * G.U.rand(0.7, 1.2), c: G.U.pick(P.c), r: P.r * G.U.rand(0.8, 1.3) * G.Sprites.PX, P });
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
  function draw(ctx) {
    if (!parts.length) return;
    ctx.save();
    for (const p of parts) {
      // Aparece y se apaga suave (sin cortes).
      const a = Math.sin(Math.PI * Math.min(1, p.t / p.life));
      ctx.globalAlpha = Math.max(0, a) * (p.P.soft ? 0.4 : 0.9);
      ctx.globalCompositeOperation = p.P.glow ? 'lighter' : 'source-over';
      ctx.fillStyle = p.c;
      if (p.P.bolt) {
        // Chispa: un rayito en zigzag que sale del detalle, con borde oscuro para que se vea
        // también encima de un cuerpo amarillo.
        const s = p.vx < 0 ? -1 : 1, zig = () => {
          ctx.beginPath(); ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + s * 4, p.y - 3); ctx.lineTo(p.x + s * 2, p.y - 6); ctx.lineTo(p.x + s * 7, p.y - 10);
          ctx.stroke();
        };
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(60,40,0,.55)'; ctx.lineWidth = 3; zig();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = p.c; ctx.lineWidth = 1.5; zig();
      } else if (p.P.star) {
        // Destello de cuatro puntas que titila (como los brillos de los juegos).
        const s = p.r * (1.2 + 0.8 * Math.abs(Math.sin(p.t * 5)));
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - s * 1.6); ctx.lineTo(p.x + s * 0.3, p.y - s * 0.3); ctx.lineTo(p.x + s * 1.6, p.y);
        ctx.lineTo(p.x + s * 0.3, p.y + s * 0.3); ctx.lineTo(p.x, p.y + s * 1.6); ctx.lineTo(p.x - s * 0.3, p.y + s * 0.3);
        ctx.lineTo(p.x - s * 1.6, p.y); ctx.lineTo(p.x - s * 0.3, p.y - s * 0.3); ctx.closePath(); ctx.fill();
      } else if (p.P.note) {
        // Nota musical (Meloetta).
        ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(p.r > 1.1 ? '\u266B' : '\u266A', p.x, p.y);
      } else if (p.P.ring) {
        ctx.strokeStyle = p.c; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.stroke();
      } else if (p.P.glow) {
        // Lucecita redonda con halo.
        const ga = ctx.globalAlpha;
        ctx.globalAlpha = ga * 0.3;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.9, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = ga;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.75, 0, 6.2832); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.8, 0, 6.2832); ctx.fill();
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
  /** Dibuja la franja de luz sobre el fotograma (lo llama Animator.draw). */
  function drawSweep(ctx, img, sx, sy, w, h, dx, dy, k, phase, alpha) {
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
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5 * alpha;
    ctx.drawImage(work, 0, 0, w, h, dx, dy, w * k, h * k);
    ctx.restore();
  }

  // ---------------- efectos propios de legendarios ----------------
  // aura: luz suave de su color DETRÁS del cuerpo, que respira despacio (como en los juegos) ·
  // back: lo que va en el suelo, a ratos ('ripple' ondas, 'clock' el reloj de Dialga) con su color c ·
  // parts: partículas propias, que salen de su cuerpo a ratos (hue: cada una de un color del
  // arcoíris · low: sólo de la parte de abajo · star / note: destellos de cuatro puntas o notas).
  const SPECIAL = {
    150: { aura: '#b060ff', back: 'ripple', c: '#e08aff', parts: { c: ['#e08aff', '#ffffff'], up: 6, spread: 16, r: 1.2, life: 1.4, rate: 2, glow: true, star: true } }, // Mewtwo: aura psíquica
    151: { parts: { c: ['#ffc4ee', '#ffffff'], up: 10, spread: 14, r: 2.2, life: 1.4, rate: 2, ring: true } },   // Mew: burbujas
    249: { back: 'ripple', c: '#b8d8ff', parts: { c: ['#ffffff', '#d6e8ff'], up: 4, spread: 26, r: 1.4, life: 1, rate: 4, soft: true } }, // Lugia: viento
    250: { aura: '#ffb347', parts: { hue: true, up: 14, spread: 16, r: 1.3, life: 1.3, rate: 6, glow: true, star: true } }, // Ho-Oh: arcoíris
    382: { back: 'ripple', c: '#5fb8ff' },                                                                     // Kyogre: ondas
    383: { parts: { c: ['#ff7a3d', '#ffb347'], up: 26, spread: 18, r: 1.4, life: 0.8, rate: 5, glow: true } }, // Groudon: ascuas
    384: { parts: { c: ['#5fe08a', '#ffe14d'], up: 0, spread: 40, r: 1.2, life: 0.5, rate: 8, glow: true } },  // Rayquaza: estelas
    483: { back: 'clock', c: '#9fe8ff' },                                                                      // Dialga: el reloj del tiempo
    484: { aura: '#ff8ad8', back: 'ripple', c: '#ff9ff0' },                                                    // Palkia: el espacio que se ondula
    487: { parts: { c: ['#2a1830', '#5a1a2a'], up: 8, spread: 18, r: 3, life: 1.6, rate: 4, soft: true, low: true } }, // Giratina: sombras
    491: { parts: { c: ['#1a1428', '#3a2c50'], up: -4, spread: 20, r: 3.2, life: 1.8, rate: 5, soft: true, low: true } }, // Darkrai: humo oscuro
    493: { aura: '#ffd23f', parts: { c: ['#ffe680', '#ffffff'], up: 10, spread: 22, r: 1.4, life: 1.4, rate: 3, glow: true, star: true } }, // Arceus: luz dorada
    643: { parts: { c: ['#ffffff', '#ffd9a0', '#9fe8ff'], up: 30, spread: 14, r: 1.5, life: 0.8, rate: 6, glow: true } }, // Reshiram: fuego blanco
    644: { parts: { c: ['#bfefff', '#7fd8ff'], up: 0, spread: 30, r: 1, life: 0.2, rate: 7, glow: true, bolt: true } },   // Zekrom: rayos
    646: { parts: { c: ['#d8f1ff', '#ffffff'], up: -10, spread: 18, r: 1.4, life: 1.6, rate: 4 } },            // Kyurem: nieve
    716: { parts: { hue: true, up: 12, spread: 20, r: 1.2, life: 1.2, rate: 5, glow: true } },                 // Xerneas: luces de colores
    717: { parts: { c: ['#ff4a3a', '#5a1a1a'], up: -12, spread: 22, r: 1.6, life: 1.4, rate: 4, leaf: true } }, // Yveltal: plumas que caen
    // Segunda tanda.
    144: { parts: { c: ['#d8f1ff', '#ffffff'], up: -10, spread: 18, r: 1.4, life: 1.6, rate: 4 } },            // Articuno: nieve
    145: { parts: { c: ['#fffbe0', '#ffe14d'], up: 0, spread: 40, r: 1, life: 0.2, rate: 7, glow: true, bolt: true } }, // Zapdos: rayos
    146: { parts: { c: ['#ff7a3d', '#ffb347', '#ffe14d'], up: 30, spread: 20, r: 1.5, life: 0.9, rate: 7, glow: true } }, // Moltres: ascuas
    243: { parts: { c: ['#fffbe0', '#c9b5ff'], up: 0, spread: 36, r: 1, life: 0.2, rate: 6, glow: true, bolt: true } }, // Raikou: rayos
    244: { aura: '#ff7a2a', parts: { c: ['#ff7a3d', '#ffb347'], up: 26, spread: 16, r: 1.4, life: 0.8, rate: 5, glow: true } }, // Entei: volcán
    245: { back: 'ripple', c: '#9fe8ff', parts: { c: ['#d6f0ff', '#b8a8ff', '#ffffff'], up: 6, spread: 24, r: 1.2, life: 1.4, rate: 5, glow: true, star: true } }, // Suicune: aurora
    251: { parts: { c: ['#5fe08a', '#a5f07a'], up: -8, spread: 20, r: 1.6, life: 1.6, rate: 4, leaf: true } },  // Celebi: hojas
    385: { parts: { c: ['#ffe680', '#ffffff'], up: 8, spread: 22, r: 1.6, life: 1.1, rate: 4, glow: true, star: true } }, // Jirachi: estrellas
    386: { aura: '#ff6a4a', parts: { c: ['#7fd0ff', '#ffffff'], up: 6, spread: 16, r: 1.2, life: 1.2, rate: 2, glow: true } }, // Deoxys: aura
    480: { parts: { c: ['#ffe680', '#ffffff'], up: 8, spread: 12, r: 1.4, life: 1, rate: 2, ring: true } },     // Uxie
    481: { parts: { c: ['#ffb3e6', '#ffffff'], up: 8, spread: 12, r: 1.4, life: 1, rate: 2, ring: true } },     // Mesprit
    482: { parts: { c: ['#9fd8ff', '#ffffff'], up: 8, spread: 12, r: 1.4, life: 1, rate: 2, ring: true } },     // Azelf
    485: { parts: { c: ['#ff7a3d', '#ffb347'], up: 24, spread: 20, r: 1.6, life: 0.9, rate: 6, glow: true } },  // Heatran: ascuas
    488: { aura: '#ffb3e6', parts: { c: ['#ffe680', '#ffb3e6'], up: 6, spread: 18, r: 1.2, life: 1.2, rate: 3, glow: true, star: true } }, // Cresselia: luz de luna
    490: { parts: { c: ['#9fd8ff', '#d6f0ff'], up: 18, spread: 12, r: 1.8, life: 1.3, rate: 3, ring: true } }, // Manaphy: burbujas
    494: { parts: { c: ['#ff7a3d', '#ffe14d'], up: 22, spread: 14, r: 1.3, life: 0.8, rate: 5, glow: true } },  // Victini: llamitas
    648: { parts: { c: ['#7fffa0', '#ffffff', '#ffe680'], up: 16, spread: 20, r: 1, life: 1.4, rate: 2, note: true } }, // Meloetta: notas
    718: { parts: { c: ['#7fff6a', '#3fbf3f'], up: 10, spread: 22, r: 1.6, life: 1.2, rate: 5, glow: true } },  // Zygarde: células
    719: { parts: { c: ['#ffb5de', '#ffffff'], up: 8, spread: 18, r: 1.6, life: 1, rate: 4, glow: true, star: true } }, // Diancie: destellos
    720: { aura: '#ffd23f', parts: { c: ['#ffd23f', '#ffe680'], up: 8, spread: 20, r: 2.4, life: 1.6, rate: 1.5, ring: true, glow: true } }, // Hoopa: aros dorados
    721: { parts: { c: ['#ffffff', '#e6eef5'], up: 30, spread: 12, r: 2.6, life: 1.2, rate: 4, soft: true } },  // Volcanion: vapor
    791: { aura: '#ffab28', parts: { c: ['#ffd27f', '#ffffff'], up: 14, spread: 20, r: 1.3, life: 1, rate: 4, glow: true } }, // Solgaleo: sol
    792: { aura: '#8f6bff', parts: { c: ['#c9b5ff', '#ffffff', '#7cd8ed'], up: 4, spread: 26, r: 1.4, life: 1.4, rate: 5, glow: true, star: true } }, // Lunala: estrellas
    800: { parts: { hue: true, up: 10, spread: 22, r: 1.4, life: 1, rate: 6, glow: true, star: true } },        // Necrozma: luz del prisma
    802: { parts: { c: ['#1a1428', '#2f3a2f'], up: 4, spread: 18, r: 2.8, life: 1.4, rate: 4, soft: true, low: true } }, // Marshadow: sombra
    807: { parts: { c: ['#d6f0ff', '#7fd8ff'], up: 0, spread: 36, r: 1, life: 0.2, rate: 7, glow: true, bolt: true } }, // Zeraora: rayos
    890: { aura: '#ff3a5a', parts: { c: ['#ff5a6a', '#b04aff'], up: 20, spread: 18, r: 2, life: 1.1, rate: 5, glow: true } }, // Eternatus: energía
    // Tercera tanda.
    641: { parts: { c: ['#ffffff', '#c9f0d6'], up: 2, spread: 40, r: 2.2, life: 1, rate: 4, soft: true } },    // Tornadus: viento
    642: { parts: { c: ['#fffbe0', '#c9b5ff'], up: 0, spread: 36, r: 1, life: 0.2, rate: 6, glow: true, bolt: true } }, // Thundurus: rayos
    645: { parts: { c: ['#d8b878', '#b89458'], up: 6, spread: 26, r: 2, life: 1, rate: 5, soft: true, low: true } }, // Landorus: arena
    786: { aura: '#ff8ad8', parts: { c: ['#ffb3e6', '#ffffff'], up: 6, spread: 20, r: 1.3, life: 1.3, rate: 3, glow: true, star: true } }, // Tapu Lele: escamas
    787: { parts: { c: ['#5fe08a', '#ffe14d'], up: -6, spread: 20, r: 1.6, life: 1.6, rate: 3, leaf: true } }, // Tapu Bulu: hojas
    788: { aura: '#9fd8ff', parts: { c: ['#d6f0ff', '#ffffff'], up: 4, spread: 26, r: 2.6, life: 1.6, rate: 3, soft: true } }, // Tapu Fini: niebla
    789: { parts: { c: ['#ffe680', '#9fe8ff', '#ffffff'], up: 6, spread: 18, r: 1.2, life: 1.3, rate: 3, glow: true, star: true } }, // Cosmog: estrellitas
    790: { aura: '#ffe680', parts: { c: ['#ffe680', '#ffffff'], up: 4, spread: 16, r: 1.2, life: 1.3, rate: 2, glow: true, star: true } }, // Cosmoem
    793: { aura: '#6abde0' },                                                                                   // Nihilego
    801: { aura: '#ff9fb0', parts: { c: ['#ffd5d6', '#ffffff'], up: 8, spread: 14, r: 1.2, life: 1.2, rate: 2, glow: true, star: true } }, // Magearna
    888: { aura: '#5fb8ff', parts: { c: ['#d6f0ff', '#ffffff'], up: 10, spread: 18, r: 1.2, life: 1.1, rate: 3, glow: true, star: true } }, // Zacian: espada de luz
    889: { aura: '#ff6a5a', parts: { c: ['#ffd0c0', '#ffffff'], up: 10, spread: 18, r: 1.2, life: 1.1, rate: 3, glow: true, star: true } }, // Zamazenta: escudo de luz
    894: { parts: { c: ['#fffbe0', '#ffe14d'], up: 0, spread: 44, r: 1, life: 0.2, rate: 8, glow: true, bolt: true } }, // Regieleki: rayos
    896: { parts: { c: ['#d8f1ff', '#ffffff'], up: -10, spread: 20, r: 1.4, life: 1.6, rate: 4 } },            // Glastrier: nieve
    897: { aura: '#8f6bff', parts: { c: ['#1a1428', '#3a2c50'], up: 6, spread: 18, r: 2.8, life: 1.4, rate: 3, soft: true, low: true } }, // Spectrier: sombra
    898: { aura: '#7fe8a0', parts: { c: ['#5fe08a', '#a5f07a'], up: -6, spread: 20, r: 1.5, life: 1.6, rate: 3, leaf: true } }, // Calyrex: hojas
    100006: { parts: { c: ['#a4ddf9', '#5fc8ff'], up: 30, spread: 16, r: 1.5, life: 0.8, rate: 6, glow: true } }, // Mega Charizard X: llamas azules
    100150: { aura: '#b060ff', back: 'ripple', c: '#e08aff' },                                                  // Mega Mewtwo Y
    100384: { aura: '#5fe08a', parts: { c: ['#5fe08a', '#ffe14d'], up: 0, spread: 50, r: 1.3, life: 0.5, rate: 10, glow: true } }, // Mega Rayquaza
    100719: { parts: { c: ['#ffb5de', '#ffffff'], up: 8, spread: 22, r: 1.8, life: 1.1, rate: 6, glow: true, star: true } }, // Mega Diancie
    100382: { aura: '#3fa8ff', back: 'ripple', c: '#7fe8ff', parts: { c: ['#9fd8ff', '#d6f0ff'], up: 26, spread: 16, r: 1.8, life: 1.2, rate: 5, ring: true } }, // Kyogre primigenio
    100383: { aura: '#ff6a1a', parts: { c: ['#ff7a3d', '#ffb347', '#ffe14d'], up: 34, spread: 20, r: 1.6, life: 0.9, rate: 8, glow: true } } // Groudon primigenio
  };

  const rgb = c => hex(c.slice(1)).join(',');

  /** Efecto propio de `dex` (el número del sprite que lleva). Llámalo ANTES de dibujar el sprite:
   *  dibuja lo de detrás y suelta sus partículas. y: los pies (ya con lo que se eleve). */
  function special(ctx, ent, dex, y, t, dt) {
    const S = SPECIAL[dex];
    if (!S || ent.dead) return;
    const h = ent.bodyH || 24, r = ent.r || 12, x = ent.x, seed = seedOf(ent);
    if (S.aura) {
      // Luz suave detrás del cuerpo que respira.
      const cy = y - h * 0.5, R = Math.max(h * 0.8, r * 1.9), c = rgb(S.aura);
      const a = 0.38 * (0.7 + 0.3 * Math.sin(t * 1.2 + seed));
      const g = ctx.createRadialGradient(x, cy, 0, x, cy, R);
      g.addColorStop(0, `rgba(${c},${a})`);
      g.addColorStop(0.5, `rgba(${c},${a * 0.45})`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.fillRect(x - R, cy - R, R * 2, R * 2);
      ctx.restore();
    }
    if (S.back) {
      ctx.save();
      ctx.strokeStyle = S.c;
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 1.2;
      if (S.back === 'clock') {
        // Esfera de reloj en el suelo que aparece de vez en cuando: doce marcas y una aguja.
        const w = wave(t, seed, 10, 5);
        if (w > 0) {
          const rx = r * 2.2 + h * 0.2, ry = rx * 0.38;
          ctx.globalAlpha = 0.5 * w;
          ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.2832); ctx.stroke();
          for (let i = 0; i < 12; i++) {
            const a = i * 0.5236, cx = Math.cos(a), cy = Math.sin(a);
            ctx.beginPath(); ctx.moveTo(x + cx * rx * 0.82, y + cy * ry * 0.82); ctx.lineTo(x + cx * rx, y + cy * ry); ctx.stroke();
          }
          const a = t * 0.5;
          ctx.globalAlpha = 0.75 * w; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * rx * 0.75, y + Math.sin(a) * ry * 0.75); ctx.stroke();
        }
      } else if (S.back === 'ripple') {
        // Un par de ondas que salen despacio de los pies, a ratos.
        const w = wave(t, seed, 6, 3.5);
        for (let i = 0; i < 2 && w > 0; i++) {
          const k = (t * 0.45 + i / 2) % 1, rx = r * (1 + 2.2 * k) + h * 0.1;
          ctx.globalAlpha = 0.4 * w * (1 - k);
          ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.36, 0, 0, 6.2832); ctx.stroke();
        }
      }
      ctx.restore();
    }
    if (S.parts && dt > 0 && parts.length < MAX && G.Settings.get('quality') !== 'low') {
      const P = S.parts, w = wave(t, seed + 3, 8, 4.5);
      if (w <= 0) return;
      ent._specAcc = (ent._specAcc || 0) + dt * P.rate * 0.8 * w;
      while (ent._specAcc >= 1 && parts.length < MAX) {
        ent._specAcc -= 1;
        const c = P.hue ? 'hsl(' + Math.floor(Math.random() * 360) + ',100%,72%)' : G.U.pick(P.c);
        parts.push({ x: x + G.U.rand(-r, r) * 1.3, y: y - G.U.rand(0.05, P.low ? 0.3 : 0.95) * h, vx: G.U.rand(-1, 1) * P.spread * 0.4,
          vy: -P.up * 0.75 * G.U.rand(0.6, 1.2), t: 0, life: P.life * 1.2 * G.U.rand(0.7, 1.2), c, r: P.r * G.U.rand(0.8, 1.3) * G.Sprites.PX, P });
      }
    }
  }

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

  // ---------------- para quién ----------------
  /** Opciones de dibujo (Animator.draw) para tu compañero o el de otro jugador (null: sin efectos). */
  function forPlayer(pl, t) {
    if (!enabled(pl.dex, pl === G.Game.player)) return null;
    const o = {};
    // De noche (systems/night.js), los detalles brillan más.
    const night = G.Night ? G.Night.level(G.Game.st.time || 0) : 0;
    const d = pl.anim ? pl.anim.dex : pl.dex;       // el del sprite: megas y primigenios llevan otro
    if (SPOTS[d] && !pl.dead) o.emit = { dex: d, level: emitLevel(d, t, seedOf(pl)) * (1 + 0.6 * night), color: spotColor(d) };
    if (pl.shiny) { const s = sweep(t, (pl.dex % 7) * 0.4); if (s >= 0) o.sweep = s; }
    if (pl.megaOn) o.glow = G.Mega.primal(pl.dex) ? '#ff9a3d' : '#ff8ad8';
    else if (pl === G.Game.player && G.Streak.mul() >= 1.25) o.glow = '#ffd23f';
    return o;
  }
  /** Para un enemigo: sólo jefes, legendarios y shiny (los demás, nada). */
  function forEnemy(e, t) {
    const legend = e.legend || (e.boss && G.Rift.inArena);
    if (!(e.boss || e.shiny || legend) || e.dead || !enabled(e.dex, false)) return null;
    const o = {};
    const d = e.anim ? e.anim.dex : e.dex;
    if (SPOTS[d]) o.emit = { dex: d, level: emitLevel(d, t, e.id), color: spotColor(d) };
    if (e.shiny) { const s = sweep(t, (e.id % 9) * 0.37); if (s >= 0) o.sweep = s; }
    if (legend) o.glow = '#ffd23f';
    else if (e.boss) o.glow = 'rgba(255,90,90,.9)';
    return o;
  }
  /** ¿Lleva partículas? (los mismos que forEnemy, más los jugadores) */
  const fancy = e => !!(e.boss || e.shiny || e.legend);

  return { SPOTS, PARTS, SPECIAL, emissive, emitLevel, spotColor, emit, spotEmit, special, enabled, setEnabled, update, draw, clear, sweep, drawSweep, forPlayer, forEnemy, fancy };
})();
