/* ============ changelog.js — novedades del juego ============
 * Lo que ve la gente en el botón "Novedades" de la barra de arriba: cambios
 * de juego y fallos arreglados (nada de servidores ni bases de datos).
 * La fecha más nueva, arriba. En cada fecha, por apartados:
 *   new  lo nuevo · chg  cambios y ajustes · fix  fallos arreglados
 * Cada línea en español y en inglés.
 */
G.CHANGELOG = [
  { d: '2026-10-31', title: ["PokeKatens: la Pokédex completa", "PokeKatens: the complete Pokédex"], new: [
    ["Los legendarios de las grietas pelean por fases: a dos tercios de su vida sacan su ataque de fase, según su tipo (una cruz de rayos, rayos que giran a su alrededor o una tormenta que cae por toda la arena), y a un tercio se enfurecen y lanzan una vez su ataque final, una estrella de rayos en dos tandas. Todo avisa en el suelo, y la barra del legendario marca dónde cambia de fase.",
     "Rift legendaries fight in phases: at two thirds of their health they bring out their phase attack, depending on their type (a cross of beams, beams spinning around them or a storm falling all over the arena), and at one third they get enraged and unleash their final attack once, a star of beams in two waves. Everything is warned on the ground, and the legendary's bar marks where the phases change."],
    ["Más ataques exclusivos: 21 nuevos, como en los juegos, para los iniciales de Alola, Galar y Paldea (Puntada Sombría de Decidueye, Lariat Oscuro de Incineroar, Aria Burbuja de Primarina, Balón Ígneo de Cinderace, Disparo Certero de Inteleon, Truco Floral de Meowscarada) y para legendarios y singulares que aún no tenían (Aerochorro de Lugia, Llama Azul de Reshiram, Meteoimpacto de Solgaleo, Rayo Umbrío de Lunala, Tajo Supremo de Zacian, Cañón Dinamax de Eternatus, Cadena Virulenta de Pecharunt...). Salen como carta especial al subir de nivel desde el nivel 10.",
     "More signature moves: 21 new ones, like in the games, for the Alola, Galar and Paldea starters (Decidueye's Spirit Shackle, Incineroar's Darkest Lariat, Primarina's Sparkling Aria, Cinderace's Pyro Ball, Inteleon's Snipe Shot, Meowscarada's Flower Trick) and for legendaries and mythicals that had none yet (Lugia's Aeroblast, Reshiram's Blue Flare, Solgaleo's Sunsteel Strike, Lunala's Moongeist Beam, Zacian's Behemoth Blade, Eternatus's Dynamax Cannon, Pecharunt's Malignant Chain...). They show up as a special card when you level up, from level 10."],
    ["La Pokédex, completa: llegan los 59 Pokémon que faltaban, hasta los 1025. Entre ellos Simisear, Zebstrika, Jellicent, Pyroar, Toucannon, Coalossal, Sirfetch'd, Mr. Rime, Copperajah, Mabosstiff, Espathra y los legendarios Zarude, Wo-Chien, Chien-Pao, Ting-Lu, Miraidon, Okidogi y Pecharunt, que salen en las grietas. Todos con su shiny, su grito y sus MT, en el gacha de su región, como enemigos y en los huevos.",
     "The Pokédex is complete: the 59 missing Pokémon arrive, all the way to 1025. Among them Simisear, Zebstrika, Jellicent, Pyroar, Toucannon, Coalossal, Sirfetch'd, Mr. Rime, Copperajah, Mabosstiff, Espathra and the legendaries Zarude, Wo-Chien, Chien-Pao, Ting-Lu, Miraidon, Okidogi and Pecharunt, who show up in the rifts. All with their shiny, their cry and their TMs, in their region's gacha, as enemies and in eggs."]
  ], fix: [
    ["Al jugar en dos aparatos con la misma cuenta, juntar las partidas ya no regala una GS Ball ni un huevo del gacha de más, ni deja más de 6 huevos (los que sobran se cambian por 200 monedas cada uno, como siempre).",
     "When you play on two devices with the same account, merging the saves no longer gives an extra GS Ball or gacha egg, nor leaves more than 6 eggs (any extra ones turn into 200 coins each, as usual)."],
    ["Móvil: los botones ya no se quedan iluminados después de tocarlos, los menús no se meten debajo de la muesca y la ayuda del principio de la partida queda encima de la barra de inicio del iPhone.",
     "Mobile: buttons no longer stay lit after you tap them, menus no longer go under the notch, and the help line at the start of a run sits above the iPhone home bar."],
    ["En grupo, sólo pueden entrar en tu sala los amigos a los que invitas (antes, quien supiera el código de tu cuenta podía colarse en una sala abierta).",
     "In a group, only the friends you invite can join your room (before, anyone who knew your account code could sneak into an open room)."]
  ] },
  { d: '2026-10-30', title: ["PokeKatens: límite de FPS y píxeles exactos", "PokeKatens: FPS limit and pixel-perfect"], new: [
    ["Ajustes → Gráficos: «Límite de FPS» (sin límite, 144, 120, 60 o 30) para que el juego no dibuje más fotogramas de los que necesitas (con una pantalla rápida gastaba la gráfica sin parar), y «Píxeles exactos», encendido de fábrica: cada cuadrado del dibujo ocupa los mismos píxeles de tu pantalla y todo se ve más nítido, sobre todo en pantallas grandes. La vista casi no cambia.",
     "Settings → Graphics: “FPS limit” (no limit, 144, 120, 60 or 30) so the game doesn't draw more frames than you need (with a fast screen it kept the graphics card busy nonstop), and “Pixel-perfect”, on by default: every square of the art takes the same number of pixels on your screen and everything looks sharper, especially on big screens. The view barely changes."]
  ] },
  { d: '2026-10-29', title: ["PokeKatens: lo nuevo de PokéSurvivor", "PokeKatens: what's new from PokéSurvivor"], new: [
    ["Móvil y tableta: nuevo joystick «Anclado» (Ajustes → Controles → Colocar los botones). Aparece donde pones el dedo y se queda en ese sitio mientras lo mantienes, aunque alejes el dedo; al levantarlo y tocar en otro sitio, aparece allí. El «Flotante» de siempre sigue al dedo y sigue siendo el que viene puesto.",
     "Mobile and tablet: new \"Anchored\" joystick (Settings → Controls → Place the buttons). It appears where you put your finger and stays in that spot while you hold it, even if you move your finger away; lift it and touch somewhere else, and it appears there. The usual \"Floating\" one follows your finger and is still the default."]
  ], chg: [
    ["El evento de Halloween dura un día más: del 30 de octubre al 2 de noviembre (hora de España).",
     "The Halloween event lasts one more day: from October 30 to November 2 (Spain time)."]
  ], fix: [
    ["Durante Halloween, unos segundos después de abrir el juego (y al empezar o acabar el evento), la tienda, el gacha u otra pantalla del menú se cerraban solos y te devolvían al menú. Ya no.",
     "During Halloween, a few seconds after opening the game (and when the event starts or ends), the shop, the gacha or another menu screen closed by itself and sent you back to the menu. Not anymore."],
    ["Armadura Frágil, Impasible y Cobardía ya no te quitan las cargas de Agilidad (u otra subida de velocidad mejor) al recibir un golpe: antes las dejaban en una.",
     "Weak Armor, Steadfast and Rattled no longer remove your Agility charges (or any better speed boost) when you get hit: they used to drop them to one."],
    ["El Chaleco Asalto ya no cuenta para el tope del 70 % de las cartas Coraza: con las cartas al máximo, el chaleco suma encima. Y si te lo quitas, no pierdes lo de las cartas.",
     "The Assault Vest no longer counts toward the 70% cap of the Armor cards: with the cards maxed, the vest adds on top. And if you take it off, you keep what the cards gave you."],
    ["En ventanas muy alargadas (muy anchas y bajas), los enemigos ya no se quedan dando vueltas fuera de la pantalla sin acercarse: parecía que no salía ninguno.",
     "In very elongated windows (very wide and short), enemies no longer keep looping off screen without coming closer: it looked as if none were spawning."],
    ["Test inicial: los rasgos de tu personalidad («Paciente», «Tenaz»…) salían en español en todos los idiomas. Ya salen traducidos.",
     "Starting quiz: your personality traits (\"Patient\", \"Tenacious\"…) were shown in Spanish in every language. They are translated now."],
    ["Móvil: al tocar «Cambiar opciones» en las cartas de nivel, a veces se elegía sola una de las cartas nuevas; y en el vínculo, tras elegir el primer movimiento, se unía solo el que quedara debajo del dedo en vez del que tocabas. Ahora sólo se elige la carta que tocas.",
     "Mobile: tapping \"Change options\" on the level-up cards sometimes picked one of the new cards by itself; and in a bond, after choosing the first move, whichever move ended up under your finger was joined instead of the one you tapped. Now only the card you tap is chosen."],
    ["Cooperativo: con una conexión lenta, un jugador podía ver la partida minutos tarde (hasta más de 4 minutos por detrás de los demás), y en la Sentencia de Arceus era un caos. Ahora, si la conexión no da para más, el juego espera a que se ponga al día en vez de amontonar lo que falta por llegar: como mucho, la partida se para un momento («esperando al anfitrión»), pero va siempre al día.",
     "Co-op: with a slow connection, a player could see the run minutes late (more than 4 minutes behind the others), and Arceus's Judgment turned into chaos. Now, if the connection cannot keep up, the game waits for it to catch up instead of piling up what has yet to arrive: at worst the run pauses for a moment (\"waiting for the host\"), but it is always up to date."],
    ["Ranking de daño a Arceus: «Sólo amigos» enseña también a los amigos que no están en el top 50 (en Histórico), y en el Histórico se guarda tu mejor daño aunque esa partida no mejore tu tiempo.",
     "Arceus damage leaderboard: \"Friends only\" also shows friends outside the top 50 (in All-time), and All-time keeps your best damage even if that run does not beat your time."]
  ] },
  { d: '2026-10-28', title: ["PokeKatens: legendarios con más efectos", "PokeKatens: legendaries with more effects"], new: [
    ["Los ataques evolucionados («… +») ya se ven distintos de los normales: llevan un borde de luz de su color, un destello en cruz al lanzarlos, chispas que se quedan atrás, un aro doble en las ondas y un eco en los golpes. Sólo cambia cómo se ven, y en grupo tus amigos también lo ven. Con la calidad en «Baja», sólo el borde.",
     "Evolved moves («… +») now look different from normal ones: they have a border of light in their colour, a cross-shaped flash when cast, sparkles that trail behind, a double ring on shockwaves and an echo on strikes. Only the look changes, and in a group your friends see it too. With quality set to “Low”, just the border."],
    ["También relucen con su franja de color Scizor (roja), Metagross (azul plateada), Gholdengo (dorada), Carbink (rosa), Glaceon (azul hielo) y Magearna (rosa dorada), y las megas de Scizor y Metagross.",
     "Scizor (red), Metagross (silver blue), Gholdengo (gold), Carbink (pink), Glaceon (ice blue) and Magearna (rose gold) also gleam with their coloured band, as do the Megas of Scizor and Metagross."],
    ["Dialga, Diancie, Steelix, Registeel y Aegislash relucen sin ser shiny: de vez en cuando les cruza una franja de luz de su color (azul, rosa, plateada, azul acero y dorada), como la blanca de los shiny.",
     "Dialga, Diancie, Steelix, Registeel and Aegislash gleam without being shiny: every now and then a band of light in their own colour (blue, pink, silver, steel blue and gold) crosses them, like the white one on shiny Pokémon."],
    ["Botón «Al azar» en la Colección, con un dado: si no sabes con quién jugar, elige tu compañero al azar entre los Pokémon que tienes, con los filtros que hayas puesto (generación, tipo, rareza, favoritos...; con Shiny, su shiny).",
     "“Random” button in the Collection, with a die: if you don't know who to play with, it picks your partner at random from the Pokémon you have, with the filters you've set (generation, type, rarity, favourites...; with Shiny, its shiny)."],
    ["Muchos más Pokémon dejan su rastro: los legendarios que faltaban (Mewtwo y Mew con aros psíquicos, Rayquaza y Latios con ráfagas de viento, Registeel y Zacian con destellos de metal, Diancie con gemas, Magearna con corazones...), los pseudolegendarios (Tyranitar, Metagross, Garchomp, Hydreigon, Dragapult...), los iniciales, los más conocidos (Pikachu, Gengar, Lucario con llamas de aura azul, Sylveon y Gardevoir con corazones, las Eeveelución...) y sus megas.",
     "Many more Pokémon leave their trail: the missing legendaries (Mewtwo and Mew with psychic rings, Rayquaza and Latios with gusts of wind, Registeel and Zacian with metal glints, Diancie with gems, Magearna with hearts...), the pseudo-legendaries (Tyranitar, Metagross, Garchomp, Hydreigon, Dragapult...), the starters, the best-known ones (Pikachu, Gengar, Lucario with blue aura flames, Sylveon and Gardevoir with hearts, the Eeveelutions...) and their Megas."],
    ["Rastros en el suelo para muchos legendarios, cada uno con lo suyo: llamas (Entei, Moltres, Reshiram en blanco...), chispas (Raikou, Zapdos, Zekrom...), flores (Shaymin, Celebi, Xerneas...), escarcha (Articuno, Kyurem...), sombras (Darkrai, Giratina...), ondas de agua (Kyogre, Manaphy...) y destellos de arcoíris (Ho-Oh, Necrozma). Y algunos exclusivos: las grietas de magma de Groudon, las plumas de Lugia e Yveltal, las células de Zygarde, las estrellas de Jirachi, los cristales de Terapagos, las notas de Meloetta, los aros dorados de Arceus y la energía roja de Eternatus.",
     "Ground trails for many legendaries, each with its own: flames (Entei, Moltres, Reshiram in white...), sparks (Raikou, Zapdos, Zekrom...), flowers (Shaymin, Celebi, Xerneas...), frost (Articuno, Kyurem...), shadows (Darkrai, Giratina...), water ripples (Kyogre, Manaphy...) and rainbow sparkles (Ho-Oh, Necrozma). And some unique ones: Groudon's magma cracks, Lugia's and Yveltal's feathers, Zygarde's cells, Jirachi's stars, Terapagos's crystals, Meloetta's notes, Arceus's golden rings and Eternatus's red energy."],
    ["Suicune va dejando, de vez en cuando, un rastro de aurora en el suelo por donde pasa: cortinas de luz que se apagan solas detrás de él.",
     "Every now and then, Suicune leaves a trail of aurora on the ground wherever it goes: curtains of light that fade away behind it."],
    ["Los 21 legendarios y singulares que aún no tenían efecto ya lo tienen (Regice, Latias, Latios, Regigigas, Keldeo, Koraidon, Terapagos...), y también las megas de Darkrai, Zygarde y Zeraora.",
     "The 21 legendaries and mythicals that still had no effect now have one (Regice, Latias, Latios, Regigigas, Keldeo, Koraidon, Terapagos...), and so do the Megas of Darkrai, Zygarde and Zeraora."],
    ["Efectos nuevos, como en el anime: los puntos de Regirock, Regice, Registeel y Regigigas se encienden uno a uno; Arceus, Solgaleo, Ho-Oh, Necrozma, Koraidon y Terapagos tienen rayos de luz detrás; Suicune y Articuno, una aurora encima; y a Hoopa, al trío del lago, a Zygarde y a Cosmog les giran alrededor sus aros, gemas, células o estrellas.",
     "New effects, like in the anime: the dots of Regirock, Regice, Registeel and Regigigas light up one by one; Arceus, Solgaleo, Ho-Oh, Necrozma, Koraidon and Terapagos have rays of light behind them; Suicune and Articuno, an aurora above; and Hoopa, the lake trio, Zygarde and Cosmog have their rings, gems, cells or stars circling around them."]
  ], chg: [
    ["Los rastros tienen su propio apartado en Ajustes («Rastros en el suelo»: todos, sólo tu compañero o ninguno), aparte de los efectos, y en la ficha de cada Pokémon que lo tenga puedes quitárselo a uno solo. Y más cosas en píxeles: los destellos y las partículas.",
     "Trails have their own section in Settings (“Ground trails”: all, only your partner or none), separate from effects, and on the page of each Pokémon that has one you can turn it off for just that one. And more things in pixels: sparkles and particles."],
    ["Los efectos, ahora en píxeles como los sprites: las ondas, el reloj de Dialga, los aros de Hoopa, los rayos de luz, el aura, las burbujas, los rayos de las chispas, las notas, las Z de los dormilones y el contorno y el brillo de los Pokémon.",
     "Effects are now in pixels like the sprites: ripples, Dialga's clock, Hoopa's rings, rays of light, auras, bubbles, spark bolts, notes, the Z's of sleepy Pokémon and the outline and glow of Pokémon."],
    ["El aura de color que muchos legendarios llevan detrás ya sólo sale de noche (los singulares, Arceus y Lucario la siguen llevando siempre). Los brillos que se apagan y se encienden pasan más tiempo apagados, de noche todos los efectos lucen más, y al megaevolucionar ya no sale el contorno de color.",
     "The colour aura many legendaries have behind them now only shows at night (mythicals, Arceus and Lucario still always have it). Glows that fade in and out stay off for longer, all effects shine more at night, and Mega Evolving no longer adds a coloured outline."],
    ["Muchos brillos ahora se apagan y se vuelven a encender despacio en lugar de parpadear: el núcleo de Eternatus, el corazón de Magearna, el cristal de Deoxys, las líneas de Kyogre, el diamante de Dialga, las perlas de Palkia... Y brillan más legendarios: la crin de Suicune, las flores de Shaymin, los caparazones de los Tapu y muchos más.",
     "Many glows now fade out and slowly light up again instead of flickering: Eternatus's core, Magearna's heart, Deoxys's crystal, Kyogre's lines, Dialga's diamond, Palkia's pearls... And more legendaries glow: Suicune's mane, Shaymin's flowers, the Tapus' shells and many more."],
    ["Más megas con partículas propias (burbujas, ascuas, pétalos, nieve, arena, destellos de dragón...): las de Venusaur, Blastoise, Gyarados, Gengar, Tyranitar, Garchomp, Salamence y muchas más.",
     "More Megas with their own particles (bubbles, embers, petals, snow, sand, dragon sparkles...): those of Venusaur, Blastoise, Gyarados, Gengar, Tyranitar, Garchomp, Salamence and many more."]
  ], fix: [
    ["En grupo, lo que llega de los demás tiene topes: el daño, el empuje y los estados de los golpes de un compañero, y los tickets y monedas del equipo (según lo que dura la partida). Un juego trucado ya no mata a un legendario de un golpe ni reparte tickets sin fin.",
     "In co-op, what arrives from other players now has limits: the damage, knockback and status effects of a teammate's hits, and the team's tickets and coins (based on how long the run has lasted). A modified game can no longer kill a legendary in one hit or hand out endless tickets."],
    ["En el móvil, los campos de búsqueda de la Colección y del ranking ya no acercan la página al tocarlos (en el iPhone se quedaba ampliada).",
     "On mobile, the search fields in the Collection and the ranking no longer zoom the page in when you tap them (on iPhone it stayed zoomed in)."]
  ] },
  { d: '2026-10-26', title: ['PokeKatens: Protección más justa', 'PokeKatens: fairer Protect'], chg: [
    ["Protección ya no te hace invencible: con mucha reducción de recarga se volvía a poner antes de que se acabara el escudo y no había quien te tocara. Ahora se recarga en 7 s y, por mucha reducción que lleves, nunca en menos de 5 s. El escudo sigue durando 1,5 s.",
     "Protect no longer makes you invincible: with a lot of cooldown reduction it came back before the shield ran out and nothing could touch you. Now it recharges in 7 s and, however much reduction you have, never in less than 5 s. The shield still lasts 1.5 s."]
  ], fix: [
    ["Con huevos en la Incubadora no se podía entrar en la cuenta: salía «Error: n is not defined». Ya se entra con normalidad y los huevos siguen donde estaban.",
     "With eggs in the Incubator you couldn't log in: it said \"Error: n is not defined\". You can now log in normally and your eggs are still there."]
  ] },
  { d: '2026-10-25', title: ['PokeKatens: GS Ball y megas', 'PokeKatens: GS Ball and Megas'], new: [
    ["Cooperativo desde casas distintas: si vuestras conexiones no consiguen hablarse directamente (pasa con datos móviles y con algunas compañías de internet), la partida va por nuestro servidor y en la sala sale «Conectado (por servidor)». Va algo menos fluida que la conexión directa. Tiene un tope al mes para seguir siendo gratis; si se gasta, vuelve a salir «No se pudo conectar» hasta el mes siguiente.",
     "Co-op from different homes: if your connections can't reach each other directly (it happens with mobile data and some internet providers), the run goes through our server and the lobby shows \"Connected (via server)\". It's a bit less smooth than a direct connection. It has a monthly cap so it stays free; if it runs out, \"Could not connect\" shows again until next month."],
    ["Amigos: al lado de cada amigo sale si está en línea (verde), en partida (dorado, y si es en grupo lo dice) o desconectado (gris, con cuánto hace). Los que están conectados salen primero.",
     "Friends: next to each friend you see whether they are online (green), in a run (gold, and it says if it's a group run) or offline (grey, with how long ago). Connected friends are listed first."],
    ["GS Ball: cada 500 tiradas del gacha (de cualquier banner) te dan una GS Ball. Ábrela en la Mochila y elige el Pokémon que quieras de los que aún no tienes, legendarios incluidos (nunca shiny). En el gacha ves cuánto te falta.",
     "GS Ball: every 500 gacha pulls (on any banner) you get a GS Ball. Open it in the Bag and choose any Pokémon you don't have yet, legendaries included (never shiny). The gacha shows how many pulls are left."],
    ["En la ficha de la colección, el botón «Ver Mega» (o «Ver Primigenio») enseña la mega de tu Pokémon: su sprite, sus tipos, su habilidad y sus estadísticas, con lo que gana o pierde respecto a la forma normal. No hace falta tener la Megapiedra.",
     "On the collection page, the “View Mega” (or “View Primal”) button shows your Pokémon's Mega Evolution: its sprite, types, ability and stats, with what it gains or loses compared to the normal form. You don't need the Mega Stone."]
  ], chg: [
    ["Unos 60 ataques que se veían igual que otros de su tipo tienen ahora su propio aspecto: espiral en Confusión, ojo en Psíquico, nube en Bola Neblina, cristal en Psicocarga, cometa en Nitrocarga y Placaje Eléctrico, puño en los Puño Fuego / Hielo / Trueno, copo de nieve en Ventisca, semilla en Bomba Germen, pluma en Tornado, roca grande en Avalancha...",
     "About 60 moves that looked the same as others of their type now have their own look: a spiral for Confusion, an eye for Psychic, a cloud for Mist Ball, a crystal for Psyshock, a comet for Flame Charge and Volt Tackle, a fist for Fire / Ice / Thunder Punch, a snowflake for Blizzard, a seed for Seed Bomb, a feather for Gust, a big rock for Rock Slide..."],
    ["Al vencer a un legendario en una grieta, un 5 % de que te deje la Megapiedra (o el Orbe) de una mega cualquiera que aún no tengas, al azar: se guarda en la Mochila para cuando lleves a ese Pokémon. Antes era sólo la de tu compañero, un 3 %.",
     "When you beat a legendary in a rift, there's a 5% chance it leaves the Mega Stone (or Orb) of a random Mega Evolution you don't have yet: it stays in the Bag for when you take that Pokémon. Before, it was only your partner's, 3%."],
    ["Cada vez que megaevolucionas en una partida, la mega dura 3 s más que la anterior (45, 48, 51... hasta 90 s): en las partidas largas duran más.",
     "Each time you Mega Evolve in a run, it lasts 3 s longer than the previous one (45, 48, 51... up to 90 s): in long runs they last longer."]
  ], fix: [
    ["Los iconos de las Megapiedras ya no llevan el aro blanco (y el trozo de fondo) que sobresalía por fuera de su borde negro. Por dentro siguen igual.",
     "Mega Stone icons no longer have the white ring (and bit of background) sticking out past their black outline. Inside they're the same."]
  ] },
  { d: '2026-10-24', title: ['PokeKatens: desafío semanal, evoluciones y noche', 'PokeKatens: weekly challenge, evolutions and night'], new: [
    ["Cada Megapiedra tiene su propio icono, con los colores de su Pokémon, y el Orbe Rojo y el Orbe Azul el suyo, con su Ω y su α. Salen en la barra y el botón de megaevolucionar, en la Tienda, en la Mochila y en la ficha de la colección.",
     "Every Mega Stone has its own icon, with the colours of its Pokémon, and the Red Orb and Blue Orb have theirs, with their Ω and α. They show on the Mega Evolution bar and button, in the Shop, in the Bag and on the collection page."],
    ["Avatares de entrenador: en tu Perfil puedes elegir uno de 60 entrenadores animados de Pokémon Edición Reloaded, de F3R (Red, Blue, líderes de gimnasio, campeones...). Sale en tu perfil, en la lista de amigos y en la sala del cooperativo.",
     "Trainer avatars: in your Profile you can choose one of 60 animated trainers from Pokémon Reloaded Edition, by F3R (Red, Blue, Gym Leaders, Champions...). It shows on your profile, in the friends list and in the co-op room."],
    ["Las arenas de las grietas de muchos tipos tienen suelo nuevo en pixel art (roca para los de roca, nieve para los de hielo, arena del desierto para los de tierra...) y las de agua, una playa, de los campos de combate de Pokémon Edición Reloaded, de F3R.",
     "Rift arenas of many types have a new pixel-art floor (rock for Rock, snow for Ice, desert sand for Ground...) and Water ones a beach, from the battlefields of Pokémon Reloaded Edition, by F3R."],
    ["Fondos de caja de Pokémon Edición Reloaded, de F3R: la colección tiene de fondo una caja del PC distinta en cada región.",
     "Box wallpapers from Pokémon Reloaded Edition, by F3R: the collection has a different PC box wallpaper for each region."],
    ["Lo nuevo de PokéSurvivor (de JPTER78): la Sentencia de Arceus con Tablas y ranking de daño a Arceus (todas las tablas del ranking empiezan de cero), Esferas de Mundo Misterioso, Amuletos Iris, tirada ×100 con botón Saltar (la tirada ×1 ya no está) y movimientos evolucionados que se llaman igual con un «+». Lo tienes todo en sus novedades del 22 y el 23-10.",
     "New from PokéSurvivor (by JPTER78): Arceus's Judgment with Plates and an Arceus damage ranking (every leaderboard starts from zero), Mystery Dungeon orbs, Shiny Charms, a ×100 pull with a Skip button (the ×1 pull is gone) and evolved moves that keep their name with a «+». It is all in its news of 22 and 23-10."],
    ['Desafío semanal: cada semana todos juegan la misma partida, con el mismo mapa, el mismo Pokémon prestado y una condición (siempre llueve, sin objetos, noche eterna...). Tiene su propio ranking y, la primera vez de la semana que aguantas 3 minutos, te da un ticket ×10. Está en el menú, debajo de Jugar.',
     "Weekly challenge: every week everyone plays the same run, with the same map, the same borrowed Pokémon and a condition (always raining, no items, endless night...). It has its own ranking and, the first time each week you survive 3 minutes, it gives you a ×10 ticket. It's in the menu, under Play."],
    ['Regalos entre amigos: una vez al día puedes regalar un ticket ×1 a cada amigo con el botón «Regalar» de la lista de amigos. Le llega la próxima vez que entre (como mucho 10 regalos al día).',
     'Gifts between friends: once a day you can give each friend a ×1 ticket with the “Gift” button in the friends list. They get it the next time they log in (at most 10 gifts a day).'],
    ['Noche en la partida: desde el minuto 7, cada 10 minutos anochece durante 3. Se ve menos (sólo hay luz alrededor de tu Pokémon), salen más Pokémon nocturnos (Fantasma, Siniestro, Zubat, Murkrow...) y las monedas y la experiencia que recoges valen un 25 % más. En Ajustes > Pantalla se puede quitar la oscuridad.',
     'Night during the run: from minute 7, every 10 minutes night falls for 3. You see less (there is only light around your Pokémon), more nocturnal Pokémon appear (Ghost, Dark, Zubat, Murkrow...) and the coins and experience you pick up are worth 25% more. You can turn off the darkness in Settings > Display.'],
    ['Rachas: cada enemigo que cae sube tu racha y un golpe la corta. Con 50 seguidos las monedas que recoges valen ×1,1; con 150, ×1,25, y con 300, ×1,5. Se ve debajo de tu vida, la mejor sale en el resumen de la partida y hay dos logros nuevos.',
     'Streaks: every enemy that falls raises your streak and a hit breaks it. With 50 in a row the coins you pick up are worth ×1.1; with 150, ×1.25, and with 300, ×1.5. It shows under your HP, the best one appears in the run summary and there are two new achievements.'],
    ['Pokédex de vistos y derrotados: el juego apunta cada Pokémon que ves y cada uno que derrotas en tus partidas (también en grupo). En la Colección se ven aunque no los tengas, con una marca los derrotados, y hay filtros nuevos y cinco logros nuevos.',
     'Pokédex of seen and defeated: the game records every Pokémon you see and every one you defeat in your runs (also in a group). In the Collection they show even if you do not have them, the defeated ones with a mark, and there are new filters and five new achievements.'],
    ['Tu compañero ya puede evolucionar en la partida: al llegar al nivel 12 (y al 24 si tiene otra fase), sale una carta dorada para evolucionar (Charmander a Charmeleon y luego a Charizard; Eevee te deja elegir). Cambian su aspecto, sus tipos y sus stats, y se quedan sus ataques, su objeto y sus mejoras. Es sólo en esa partida: tu colección no cambia. Nueva misión semanal y dos logros.',
     'Your partner can now evolve during the run: at level 12 (and 24 if it has another stage), a golden card lets it evolve (Charmander into Charmeleon and then Charizard; Eevee lets you choose). Its look, types and stats change, and it keeps its moves, item and upgrades. It only lasts that run: your collection does not change. New weekly mission and two achievements.'],
    ["18 ataques exclusivos, uno por tipo: sólo los aprende su Pokémon, como en los juegos. Salen como carta especial al subir de nivel desde el nivel 10 (también con su mega o su forma primigenia), y en la ficha de la colección pone cuál es.",
     "18 signature moves, one per type: only their Pokémon learns them, like in the games. They're offered as a special card when you level up from level 10 (also with its Mega or primal form), and the collection page shows which one it is.",
     ['Ascenso Draco', 'Onda Mental', 'Fuego Sagrado', 'Pulso Primigenio', 'Filo del Abismo', 'Distorsión', 'Golpe Umbrío', 'Brecha Negra', 'Placaje Eléctrico', 'Sentencia', 'Tormenta de Diamantes', 'Sable Místico', 'Deseo Oculto', 'Geocontrol', 'Mundo Gélido', 'Fulgor Semilla', 'Giro Mortífero', 'Al Ataque']],
    ['Groudon y Kyogre ya pueden pasar a su forma primigenia en la partida, como una mega: compra su Orbe Rojo u Orbe Azul en la Tienda Kecleon (o consíguelo, muy de vez en cuando, al ganar a un legendario en una grieta). Mientras dura, Groudon pone sol abrasador y Kyogre, lluvia.',
     'Groudon and Kyogre can now take their primal form during the run, like a Mega: buy their Red Orb or Blue Orb in the Kecleon Shop (or get it, very rarely, by beating a legendary in a rift). While it lasts, Groudon brings scorching sun and Kyogre, rain.'],
    ["Efectos visuales: en más de 220 Pokémon y megas brillan algunas partes (la llama de Charmander, las mejillas de Pikachu, los ojos de Gengar, el plasma de Rotom, las llamas azules de Mega Charizard X...), que suben y bajan despacio y de vez en cuando sueltan chispas, ascuas o destellos; de noche brillan más. Unos 70 legendarios y megas tienen su propio efecto (el aura de Mewtwo y de Lucario, el reloj de Dialga, las chispas arcoíris de Ho-Oh, las estrellas de Lunala...) y unos 370 Pokémon conocidos sueltan de vez en cuando algo suyo: los corazones de Chansey, las notas de Jigglypuff y Lapras, los Zzz de Snorlax, las burbujas de los de agua, los pétalos de Roserade, las esporas de Breloom, las ascuas de Cyndaquil, nieve, arena, humo... Los shiny llevan un destello que los cruza y las megas, los jefes y los legendarios, un contorno de luz. Sólo se ven en tu compañero, los jefes, los legendarios y los shiny. Se pueden quitar en Ajustes > Gráficos > Efectos de los Pokémon (todos, sólo tu compañero o ninguno) o a un solo Pokémon con el botón «Efectos visuales» de su ficha en la Colección, donde tu Pokémon sale con la luz de su tipo y su reflejo.", "Visual effects: more than 220 Pokémon and Megas have parts that glow (Charmander's flame, Pikachu's cheeks, Gengar's eyes, Rotom's plasma, Mega Charizard X's blue flames...), slowly rising and fading and now and then giving off sparks, embers or flashes; they glow brighter at night. About 70 legendaries and Megas have their own effect (Mewtwo's and Lucario's aura, Dialga's clock, Ho-Oh's rainbow sparks, Lunala's stars...) and about 370 well-known Pokémon give off something of their own from time to time: Chansey's hearts, Jigglypuff's and Lapras's notes, Snorlax's Zzz, the Water types' bubbles, Roserade's petals, Breloom's spores, Cyndaquil's embers, snow, sand, smoke... Shiny ones get a flash of light sweeping across them, and Megas, bosses and legendaries, a glowing outline. They only show on your partner, bosses, legendaries and shiny ones. You can turn them off in Settings > Graphics > Pokémon effects (all, only your partner or none) or for a single Pokémon with the “Visual effects” button on its page in the Collection, where your Pokémon appears with the light of its type and its reflection."],
    ['Novedades: las listas largas (ataques, MT, objetos...) salen resumidas en una línea, con un botón «Ver cuáles» para desplegarlas.',
     'News: long lists (moves, TMs, items...) are summed up in one line, with a “Show which” button to expand them.']
  ], chg: [
    ['Las evoluciones de Giro Fuego, Surf, Terremoto, Pulso Dragón, Viento Aciago, Bomba Lodo, Fuerza Lunar, Escaldar y Poder Pasado tienen otro nombre, porque el que tenían es el de un ataque exclusivo. Funcionan igual.',
     'The evolutions of Fire Spin, Surf, Earthquake, Dragon Pulse, Ominous Wind, Sludge Bomb, Moonblast, Scald and Ancient Power have a new name, because the old one belongs to a signature move. They work the same.',
     ['Calcinación', 'Envite Acuático', 'Pataleta', 'Cola Dragón', 'Impresionar', 'Veneno X', 'Bruma Explosiva', 'Agua Lodosa', 'Pedrada']],
    ["En el mando, X megaevoluciona a tu compañero si ya puedes y, si no, usa la esfera elegida (Y cambia de esfera). Las teclas de las esferas (5-8) se pueden cambiar en Ajustes > Controles.",
     "On the controller, X Mega Evolves your partner when you can and otherwise uses the selected orb (Y switches orbs). The orb keys (5-8) can be changed in Settings > Controls."],
    ["Todas las megas se ven nítidas y al menos un 40 % más grandes que su forma normal (antes sólo las de los Pokémon grandes; las demás, un 20 %).",
     "Every Mega Evolution now looks sharp and at least 40% bigger than its normal form (before, only the big Pokémon's did; the rest were 20% bigger)."]
  ], fix: [
    ["Desafío semanal: los botones «Volver» y «Jugar el desafío» parecían no hacer nada, porque la ventana del desafío se quedaba abierta encima del menú o de la partida. Ya se cierra.",
     "Weekly challenge: the “Back” and “Play the challenge” buttons seemed to do nothing, because the challenge window stayed open on top of the menu or the run. It now closes."],
    ["Perfil: al crear tu apodo, tu perfil público (favoritos, título, avatar y récords) no se publicaba hasta que cambiabas algo y a veces nunca. Ahora se publica a los pocos segundos.",
     "Profile: when you created your nickname, your public profile (favourites, title, avatar and records) wasn't published until you changed something, and sometimes never. It is now published a few seconds later."],
    ['Las megas ya se ven más grandes que su forma normal: al menos un 20 %, y las de Pokémon grandes, como Mega Charizard, Mega Metagross o Mega Mewtwo, un 40 %. Antes algunas salían casi iguales o más pequeñas.',
     'Megas now look bigger than their normal form: at least 20%, and the big Pokémon ones, like Mega Charizard, Mega Metagross or Mega Mewtwo, 40%. Before, some looked almost the same or smaller.']
  ] },
  { d: '2026-10-23', title: ['PokeKatens: shiny para todos y red en la sala', 'PokeKatens: shiny for everyone and network in the room'], new: [
    ["6 MT de apoyo nuevas en la Tienda Kecleon (de la lista de Pokémon Edición Reloaded). Con ellas, la lista de MT de Reloaded que encaja en el juego ya está completa.",
     "6 new support TMs in the Kecleon Shop (from the Pokémon Reloaded Edition list). With them, the Reloaded TM list that fits the game is complete.",
     ['Protección', 'Descanso', 'Reflejo', 'Pantalla Luz', 'Doble Equipo', 'Explosión']],
    ["10 MT de proyectiles nuevas en la Tienda Kecleon (de la lista de Pokémon Edición Reloaded).",
     "10 new projectile TMs in the Kecleon Shop (from the Pokémon Reloaded Edition list).",
     ['Pulso Dragón', 'Bomba Lodo', 'Escaldar', 'Fuerza Lunar', 'Vendaval', 'Ola-Lava', 'Viento Plata', 'Psicocarga', 'Hidropulso', 'Roca Afilada']],
    ["10 MT de golpes nuevas en la Tienda Kecleon (de la lista de Pokémon Edición Reloaded).",
     "10 new hitting TMs in the Kecleon Shop (from the Pokémon Reloaded Edition list).",
     ['Puño Fuego', 'Puño Hielo', 'Puño Trueno', 'Puño Drenaje', 'Tijera X', 'Triturar', 'Cascada', 'Megacuerno', 'Velocidad Extrema', 'Acróbata']],
    ["8 MT nuevas en la Tienda Kecleon (de la lista de Pokémon Edición Reloaded), cada una con su forma de atacar. Día Soleado, Danza Lluvia y Tormenta Arena cambian el clima un rato aunque luego cambies de ataque. Sólo las venden para los Pokémon que las aprenden en los juegos.",
     "8 new TMs in the Kecleon Shop (from the Pokémon Reloaded Edition list), each with its own way of attacking. Sunny Day, Rain Dance and Sandstorm change the weather for a while even if you switch moves afterwards. They're only sold for the Pokémon that learn them in the games.",
     ['Terremoto', 'Surf', 'Ventisca', 'Llamarada', 'Trueno', 'Día Soleado', 'Danza Lluvia', 'Tormenta Arena']],
    ["Huevos: consigue Pokémon abriéndolos jugando. Salen de las misiones semanales «Gana una pelea en una grieta» y «Aguanta X minutos», del gacha (cada 10 tiradas ×10 en un mismo banner, uno de esa región) y, a veces, de un legendario. En la Mochila está la Incubadora (3 a la vez y 3 esperando): se abren derrotando enemigos, de 500 a 8000 según su rareza, y el huevo es el de la familia del Pokémon que lleva, para que lo adivines. Salen shiny 1 de cada 32. Los huevos son de Pokémon Edición Reloaded, de F3R.",
     "Eggs: get Pokémon by hatching them as you play. They come from the weekly missions “Win a rift fight” and “Survive X minutes”, from the gacha (every 10 ×10 pulls on the same banner, one from that region) and, sometimes, from a legendary. The Incubator is in your Bag (3 at a time and 3 waiting): they open as you defeat enemies, from 500 to 8000 depending on rarity, and the egg is the one of the family of the Pokémon inside, so you can guess it. They come out shiny 1 in 32. The eggs are from Pokémon Reloaded Edition, by F3R."],
    ["12 objetos nuevos. Y otros de un solo uso que salen de cofres y jefes y no ocupan el hueco del objeto: el Caramelo Exp. (subes un nivel), las Bayas Zidra, Atania y Meloc (se guardan y se usan solas cuando hace falta) y cuatro Mochis (+5 % a una estadística hasta acabar la run). El logro «Coleccionista de objetos» pide ahora los 23.",
     "12 new items. Plus single-use ones that drop from chests and bosses and don't take the item slot: the Exp. Candy (you level up), the Sitrus, Atania and Meloc Berries (kept and used on their own when needed) and four Mochis (+5% to a stat until the run ends). The “Item collector” achievement now asks for all 23.",
     ['Botas Gruesas', 'Metrónomo', 'Hierba Copia', 'Capa Furtiva', 'Guante de Boxeo', 'Supertapones', 'Espray Bucal', 'Dado Trucado', 'Gafa Protectora', 'Amuleto Exp.', 'Incienso Suerte', 'Incienso Raro']],
    ["Ya puedes megaevolucionar a tu compañero en la partida: compra su Megapiedra en la Tienda Kecleon (8000 monedas; sólo la de tu compañero actual) o consíguela, muy de vez en cuando, al ganar a un legendario en una grieta. Con ella, una barra se llena derrotando enemigos y, llena, pulsas F (X en el mando o el botón de mega en el móvil) para megaevolucionar 45 segundos: cambian su sprite, sus tipos, sus estadísticas y su habilidad, y en grupo los demás lo ven. Son 81 megas oficiales, con sprites y gritos de Pokémon Edición Reloaded, de F3R. Nueva misión semanal: «Megaevoluciona 3 veces».",
     "You can now Mega Evolve your partner during the run: buy its Mega Stone in the Kecleon Shop (8000 coins; only your current partner's) or get it, very rarely, by beating a legendary in a rift. With it, a bar fills as you defeat enemies and, once full, press F (X on the gamepad or the Mega button on mobile) to Mega Evolve for 45 seconds: its sprite, types, stats and ability change, and in a group the others see it. There are 81 official Megas, with sprites and cries from Pokémon Reloaded Edition, by F3R. New weekly mission: “Mega Evolve 3 times”."],
    ['Los Pokémon ya tienen su grito, de Pokémon Edición Reloaded, de F3R: suena al salir en el gacha (en la tirada ×10, los de 4 y 5 estrellas y los shiny), al elegir compañero o tocarlo en su ficha de la colección, al empezar la partida y cuando aparece un jefe, un legendario de grieta o un shiny salvaje. Se quitan en Ajustes > Sonido.',
     'Pokémon now have their cry, from Pokémon Reloaded Edition, by F3R: it plays when they come out of the gacha (in the ×10 pull, the 4 and 5 star ones and shinies), when you choose your partner or tap it on its collection page, when the run starts and when a boss, a rift legendary or a wild shiny appears. You can turn them off in Settings > Sound.'],
    ['Cooperativo: en la sala, cada jugador ve el tipo de red de cada uno (abierta, normal, estricta o bloqueada) y, si no conecta, el motivo más probable.',
     'Co-op: in the room, every player sees each one\'s network type (open, normal, strict or blocked) and, if it doesn\'t connect, the most likely reason.'],
    ['Los 8 Pokémon que no tenían shiny (Karrablast, Greedent, Barraskewda, Milcery, Glastrier, Oinkologne, Naclstack y Koraidon) ya lo tienen, con los colores de Pokémon Edición Reloaded, de F3R. Antes, si salían shiny, se veían con los colores normales.',
     'The 8 Pokémon that had no shiny (Karrablast, Greedent, Barraskewda, Milcery, Glastrier, Oinkologne, Naclstack and Koraidon) now have one, with the colours of Pokémon Reloaded Edition, by F3R. Before, if they came out shiny, they looked like the normal ones.']
  ] },
  { d: '2026-10-22', title: ['PokeKatens: cooperativo más estable', 'PokeKatens: more stable co-op'], fix: [
    ['Cooperativo: con un amigo en otra casa o con otra conexión, la sala se quedaba en «No se pudo conectar (reintentando…)» para siempre, aunque en la misma red funcionaba. Una parte de los datos para encontrarse por internet se perdía por el camino; ahora llega entera.',
     'Co-op: with a friend in another home or on another connection, the room got stuck on "Could not connect (retrying…)" forever, even though it worked on the same network. Part of the data used to find each other over the internet got lost on the way; now it all arrives.'],
    ['Cooperativo: a los invitados ya no les sale «La sala se ha cerrado» a mitad de partida (a veces a los pocos minutos o al entrar en una grieta) mientras los demás seguían jugando. Pasaba cuando su conexión con el servidor de las salas se cortaba un momento; ahora la partida sigue y la sala se recupera sola.',
     'Co-op: guests no longer get "The room has been closed" in the middle of a run (sometimes after a few minutes or when entering a rift) while the others kept playing. It happened when their connection to the rooms server dropped for a moment; now the run goes on and the room recovers on its own.'],
    ['Cooperativo: si se corta un momento la conexión con el anfitrión (un bache de la wifi o de los datos), el invitado ya no pierde la partida: se queda en pausa hasta 45 segundos mientras se vuelve a conectar y sigue jugando.',
     'Co-op: if the connection with the host drops for a moment (a Wi-Fi or mobile data hiccup), the guest no longer loses the run: it pauses for up to 45 seconds while reconnecting and then keeps playing.'],
    ['Cooperativo: si te quedas fuera de una partida mientras los demás siguen, ya no te sale «La sala se ha cerrado»: esperas en la sala y, cuando acaben, seguís juntos.',
     'Co-op: if you drop out of a run while the others keep playing, you no longer get "The room has been closed": you wait in the room and, when they finish, you play together again.']
  ] },
  { d: '2026-10-21', title: ['PokeKatens: versión no oficial', 'PokeKatens: unofficial version'], new: [
    ['Regalos: el administrador ya puede regalar monedas y tickets a un jugador. Los recibes la próxima vez que entres al juego, con un aviso.',
     'Gifts: the admin can now give coins and tickets to a player. You get them the next time you open the game, with a notice.'],
    ['Ajustes > Controles: ya puedes cambiar las teclas en PC (moverse, cambiar de ataque, los ataques 1-4 y la pausa), con dos teclas para cada acción. Vienen las de siempre y se pueden restablecer.',
     'Settings > Controls: you can now change the keys on PC (move, switch moves, moves 1-4 and pause), with two keys per action. The usual ones come by default and can be reset.'],
    ['Ping en las partidas en grupo: sale en la esquina de abajo, en verde por debajo de 100 ms, amarillo hasta 200 ms y rojo por encima. Se quita en Ajustes > Gráficos.',
     'Ping in group games: it shows in the bottom corner, green below 100 ms, yellow up to 200 ms and red above. You can hide it in Settings > Graphics.']
  ], chg: [
    ['El juego ahora se llama PokeKatens: es una versión no oficial, gratis y sin ánimo de lucro, basada en PokéSurvivor de JPTER78.',
     'The game is now called PokeKatens: an unofficial, free and non-profit version based on PokéSurvivor by JPTER78.'],
    ['Se entra sólo con nombre y contraseña (ya no hay botón de Google). Si olvidas la contraseña, pídele al administrador que te cree otra cuenta.',
     'You sign in with name and password only (the Google button is gone). If you forget your password, ask the admin to create a new account for you.']
  ] },
  { d: '2026-10-26', title: ["Halloween se acerca", "Halloween is coming"], new: [
    ["Evento de Halloween del 30 de octubre al 1 de noviembre (hora de España). Lo que trae, lo descubrirás jugando.",
     "Halloween event from October 30 to November 1 (Spain time). What it brings, you will find out by playing."],
    ["En la pantalla principal, una cuenta atrás: desde dos semanas antes, cuánto falta para Halloween; durante el evento, cuánto queda.",
     "On the main screen, a countdown: from two weeks before, how long until Halloween; during the event, how long is left."]
  ], fix: [
    ["Móvil: al entrar con tu usuario, el teclado ya no lo corrige ni le pone mayúsculas por su cuenta (con un nombre poco común, el autocorrector lo cambiaba y salía «Usuario o contraseña incorrectos»).",
     "Mobile: when you log in with your username, the keyboard no longer autocorrects it or adds capitals on its own (with an unusual name, autocorrect changed it and you got \"Wrong username or password\")."],
    ["Móvil: el joystick ya no se atasca al subir de nivel. Si tocabas una carta con un dedo mientras sujetabas el joystick con el otro, la carta no se elegía y todo se quedaba parado con las cartas abiertas. Ahora se elige al levantar el dedo sobre ella, haya otro dedo en la pantalla o no (también las de objeto y vínculo). Y si el móvil no se entera de que has soltado el dedo, el joystick se suelta solo en cuanto no queda ningún dedo en la pantalla.",
     "Mobile: the joystick no longer gets stuck when you level up. If you tapped a card with one finger while holding the joystick with the other, the card was not chosen and everything stayed frozen with the cards open. Now it is chosen when you lift your finger on it, whether or not another finger is on the screen (item and bond cards too). And if the phone misses that you lifted your finger, the joystick lets go by itself as soon as no finger is left on the screen."],
    ["La barra de arriba (monedas, tickets, caramelos, tu nombre y los botones) cabe en cualquier pantalla. Antes, con todo puesto, en muchas pantallas (también tabletas) las monedas y los tickets se salían por la izquierda y los botones se partían en dos líneas. Ahora, si no hay sitio, los botones se quedan sólo con su icono, tu nombre se recorta y las cantidades muy grandes salen en corto (10 M).",
     "The top bar (coins, tickets, candy, your name and the buttons) fits on any screen. Before, with everything showing, on many screens (tablets too) the coins and tickets went off the left edge and the buttons split into two lines. Now, when space is short, the buttons keep only their icon, your name is shortened and very large amounts are shown short (10M)."],
    ["Móvil: el botón «atrás» (o el gesto de volver) ya no te saca del juego. En plena partida la pausa, en una pantalla del menú vuelve al menú y sólo en el menú principal sale de la web. Y si bajas la cortina de avisos u otra app se pone por encima, la partida también se pausa (jugando solo).",
     "Mobile: the \"back\" button (or the back gesture) no longer takes you out of the game. During a run it pauses, on a menu screen it goes back to the menu, and only on the main menu does it leave the site. And if you pull down the notification shade or another app opens on top, the run also pauses (when playing solo)."],
    ["Móvil: los avisos del centro de la pantalla (los de las esferas, por ejemplo) se salían por los dos lados y no se podían leer. Ahora se parten en líneas y caben.",
     "Mobile: the messages in the middle of the screen (the orb ones, for example) went off both sides and could not be read. Now they wrap and fit."],
    ["Móvil: los avisos de abajo (logros y mensajes) ya no se quedan con los toques. Mientras se veían, tapaban los ataques y no se podía cambiar de ataque.",
     "Mobile: the notices at the bottom (achievements and messages) no longer catch your taps. While they were showing, they covered your moves and you could not switch moves."],
    ["En la pausa, la Defensa y la Defensa Especial de los Pokémon con naturaleza salían con decimales de más (55.00000000000001).",
     "In the pause screen, Defense and Special Defense of Pokémon with a nature showed extra decimals (55.00000000000001)."],
    ["Móvil: en las cartas de nivel y de objeto ya no queda un «·» suelto al final (era el de las teclas, que en el móvil no salen). En horizontal, la frase del título ya no tapa el botón Jugar, y en la ficha de la colección los botones de Menta, Cápsula y MT vuelven a su tamaño.",
     "Mobile: the level-up and item cards no longer end with a stray \"·\" (it belonged to the keyboard keys, which are not shown on mobile). In landscape, the title tagline no longer covers the Play button, and in the collection page the Mint, Capsule and TM buttons are back to their size."]
  ]},
  { d: '2026-10-25', title: ['Tickets y Pokémon iguales en todos tus aparatos', 'The same tickets and Pokémon on all your devices'], new: [
    ['Al acabar la partida, sola o en grupo, sale el resumen: cada ataque con el daño que ha hecho y su daño por segundo, el daño total y tu objeto. En grupo, también el de cada compañero, con una pestaña por jugador.',
     'When a run ends, solo or in a group, you get the summary: each move with the damage it dealt and its damage per second, your total damage and your item. In a group, also each teammate’s, with one tab per player.'],
    ['Móvil: vuelve «Apuntar a mano» (Ajustes → Accesibilidad), ahora con un segundo joystick: el dedo en la mitad derecha de la pantalla apunta tus ataques y el de la izquierda te mueve. Al soltarlo, vuelven a apuntar solos.',
     'Mobile: "Manual aim" is back (Settings → Accessibility), now with a second joystick: your finger on the right half of the screen aims your moves and the one on the left moves you. When you lift it, they aim on their own again.']
  ], chg: [
    ['Ranking por Pokémon: ahora cuentan las partidas de 10 minutos o más (antes 5). Los demás rankings siguen desde 2 minutos.',
     'Per-Pokémon ranking: runs now count from 10 minutes (it was 5). The other rankings still count from 2 minutes.'],
    ['Perfil público: tus récords y medallas les llegan a los demás como mucho cada 6 horas (antes cada 2). Tú los ves siempre al momento.',
     'Public profile: your records and medals reach other players at most every 6 hours (it was every 2). You always see them right away.']
  ], fix: [
    ['Móvil: con las cartas de nivel, de objeto o de vínculo abiertas ya puedes coger el joystick tocando fuera del recuadro, y al cerrarse sales andando sin tener que levantar el dedo, como con el teclado o el mando.',
     'Mobile: with the level-up, item or bond cards open you can now grab the joystick by touching outside the box, and when they close you walk off without lifting your finger, like with a keyboard or controller.'],
    ['Móvil en vertical: en la barra de arriba no se veían las monedas, los tickets ni tu nombre (con tantos botones no cabía y se salía por la izquierda). Ahora va en dos líneas y se ve todo.',
     'Mobile in portrait: the top bar did not show your coins, tickets or name (with so many buttons it did not fit and went off the left edge). Now it uses two lines and everything is visible.'],
    ['Gacha con mando: al pasar las animaciones pulsando A seguido, se volvía a tirar sin querer (tras «Continuar» quedaba elegido el botón de tirar) y se gastaban tickets a montones. Ahora los botones de tirar nunca se eligen solos: hay que ir a ellos.',
     'Gacha with a controller: skipping the animations by pressing A repeatedly pulled again by accident (after "Continue" the pull button was selected) and tickets were spent in bulk. Now the pull buttons are never selected on their own: you have to move to them.'],
    ['Gacha con mando: ya se pueden elegir «Saltar» y «Continuar» en la tirada (B también continúa).',
     'Gacha with a controller: you can now select "Skip" and "Continue" during a pull (B also continues).'],
    ['Esferas con mando: en cada casilla pone X (usar la elegida) o Y (pasar a otra) en vez de las teclas 5-8 del teclado.',
     'Orbs with a controller: each slot now shows X (use the selected one) or Y (switch) instead of the keyboard keys 5-8.'],
    ['Cooperativo: los Pokémon con Sequía, Llovizna, Chorro Arena o Nevada ponen su clima también si no son el anfitrión (antes sólo funcionaba el del creador de la sala).',
     'Co-op: Pokémon with Drought, Drizzle, Sand Stream or Snow Warning now set their weather even if they are not the host (before, only the room creator’s worked).'],
    ['Cooperativo: la partida ya no se queda parada para todos si se pierde el aviso de que alguien ha terminado de elegir carta, objeto o vínculo (pasaba con un corte momentáneo de la conexión): ahora se comprueba en cada mensaje.',
     'Co-op: the run no longer freezes for everyone if the message that someone finished choosing a card, item or bond gets lost (it happened with a momentary connection drop): it is now checked in every message.'],
    ['Guardado en la nube: si pulsabas Guardar poco después de otro Guardar, el juego decía «Se guarda en la nube en X s» y, si salías antes de ese tiempo, no se subía nunca (en el otro aparato no estaban los tickets). Ahora la espera es mucho más corta y, si sales del juego con un Guardar pendiente, se sube al salir.',
     'Cloud save: if you pressed Save shortly after another Save, the game said "Saving to the cloud in X s" and, if you left before that, it was never uploaded (your tickets were missing on the other device). Now the wait is much shorter and, if you leave the game with a pending Save, it is uploaded as you leave.'],
    ['Móvil: al minimizar el juego, la música seguía sonando, y distorsionada. Ahora se para y vuelve al volver al juego.',
     'Mobile: when you minimized the game, the music kept playing, and distorted. Now it stops and comes back when you return to the game.'],
    ['Guardado en la nube: si conseguías tickets, monedas o Pokémon en un aparato y mientras tanto guardabas en otro, al volver al primero el juego creía que ya estaba todo guardado («Ya está todo guardado en la nube») y no lo subía: en el otro aparato no aparecían. Ahora se mira lo que falta de verdad y Guardar lo sube.',
     'Cloud save: if you got tickets, coins or Pokémon on one device and saved on another one in the meantime, back on the first one the game thought everything was already saved ("Everything is already saved in the cloud") and did not upload it, so it never showed up on the other device. Now it checks what is really missing and Save uploads it.'],
    ['Guardado en la nube: después de gastar en un aparato tickets o monedas que ya se habían gastado en otro, los tickets podían ir creciendo solos cada vez que guardabas, y luego bajar de golpe en el otro aparato. Ahora el saldo es el mismo en todos, y lo que ganes después no se descuenta.',
     'Cloud save: after spending on one device tickets or coins that had already been spent on another, your tickets could keep growing on their own every time you saved, and then suddenly drop on the other device. Now the balance is the same everywhere, and nothing you earn afterwards is taken away.'],
    ['Guardado en la nube: si al abrir el juego aún no había conexión (pasa a veces en el móvil), se jugaba con la copia guardada en ese aparato, que podía ser vieja, hasta pulsar Guardar: faltaba lo conseguido en otros aparatos. Ahora, en cuanto vuelve la conexión, se trae lo de la nube y se junta con lo tuyo.',
     'Cloud save: if there was no connection yet when the game opened (it sometimes happens on phones), you played with the copy stored on that device, which could be old, until you pressed Save: what you got on other devices was missing. Now, as soon as the connection is back, the cloud copy is brought in and merged with yours.'],
    ['Sentencia de Arceus: yendo muy rápido se podía salir de la arena, y ahí ni Arceus ni los legendarios te alcanzaban: se aguantaba para siempre. Ahora nadie sale de la arena.',
     'Arceus\'s Judgment: going very fast you could get out of the arena, where neither Arceus nor the legendaries could reach you, so you survived forever. Now nobody leaves the arena.'],
    ['Cooperativo: si a un compañero se le cortaba la conexión o se le apagaba el móvil, su Pokémon se quedaba quieto en el mapa y los enemigos y Arceus le seguían persiguiendo sin hacerle nada, así que los demás no recibían golpes. Ahora, a los 3 segundos sin noticias suyas, van a por los que siguen jugando.',
     'Co-op: if a teammate lost connection or their phone switched off, their Pokémon stood still on the map and enemies and Arceus kept chasing it without hurting it, so nobody else got hit. Now, after 3 seconds without hearing from them, they go after the players still in the game.'],
    ['Ranking: las mejores partidas (las de más de 12 derrotados por segundo) no se subían nunca, sin ningún aviso: el servidor las rechazaba enteras. Ahora siempre se suben.',
     'Ranking: the best runs (more than 12 defeated per second) were never uploaded, without any warning: the server rejected them entirely. Now they are always uploaded.'],
    ['Ranking: el semanal, el mensual y el histórico ya cuadran entre sí. Cada uno se cargaba por su cuenta y el histórico podía no tener todavía una marca que ya salía en el semanal.',
     'Ranking: weekly, monthly and all-time now match each other. Each one was loaded separately and all-time could still be missing a time already shown in weekly.'],
    ['Ranking de amigos: en diario, semanal y mensual sólo salen los amigos que están en el top 50; ahora lo dice en vez de «Todavía no hay marcas aquí». En Histórico salen todos.',
     'Friends ranking: daily, weekly and monthly only show friends who are in the top 50; it now says so instead of "No records here yet". All-time shows everyone.'],
    ['Ranking histórico: si tu marca no entraba en el top 50, el ranking seguía enseñando la vieja durante horas, y al mirar tu puesto una partida peor podía sustituir a la mejor que aún no se había subido. Ahora sale tu mejor marca al momento y no se pierde.',
     'All-time ranking: if your time did not make the top 50, the ranking kept showing your old one for hours, and checking your rank could let a worse run replace the better one that had not been uploaded yet. Now your best time shows up right away and is never lost.'],
    ['Con el juego abierto en dos pestañas del mismo navegador, lo conseguido o gastado en una ya no se pierde al usar la otra: las dos se pasan los cambios al momento.',
     'With the game open in two tabs of the same browser, what you get or spend in one is no longer lost when you use the other: both share their changes right away.']
  ]},
  { d: '2026-10-24', title: ['Ataques en la colección y ventanas del menú', 'Moves in the collection and menu windows'], chg: [
    ['Colección: los iconos de los ataques que puede aprender cada Pokémon son el doble de grandes y, al pasar el ratón (o al tocarlos en el móvil), dicen su tipo, si es físico o especial y lo que hace.',
     'Collection: the icons of the moves each Pokémon can learn are twice as big and, when you hover over them (or tap them on mobile), they show their type, whether they are physical or special, and what they do.'],
    ['Las ventanas del menú, Ajustes, Novedades y Apoyar se pueden cerrar pulsando fuera de ellas, además de con Volver o Cerrar.',
     "The menu windows, Settings, What's new and Support can be closed by clicking outside them, as well as with Back or Close."]
  ], fix: [
    ['Las ventanas de la Tienda Kecleon y de Novedades ya no se meten por debajo de la barra de arriba: ahora empiezan debajo de ella, como las demás.',
     "The Kecleon Shop and What's new windows no longer slide under the top bar: they now start below it, like the other windows."]
  ] },
  { d: '2026-10-23', title: ['Ranking de daño a Arceus y Tablas', 'Arceus damage ranking and Plates'], new: [
    ["Ranking partido en dos: a la izquierda, el daño que le has hecho a Arceus; a la derecha, el tiempo aguantado, como siempre. Las dos mitades se cargan a la vez. Todas las tablas empiezan de cero.",
     "The ranking is now split in two: on the left, the damage you dealt to Arceus; on the right, the time survived, as always. Both halves load at once. Every board starts from zero."],
    ["Sentencia de Arceus: ahora se le puede pegar. Es invencible y sólo recibe una pequeña parte del daño (cada vez menos), y los ataques le apuntan cuando no queda ningún legendario.",
     "Arceus's Judgment: you can now hit it. It is invincible and only takes a small part of the damage (less and less over time), and your attacks aim at it when no legendary is left."],
    ["Tablas: en cada partida Arceus lleva una al azar, que le da su tipo (se avisa al entrar en la arena). Ya no hay un tipo de ataque que sea siempre el mejor.",
     "Plates: in every run Arceus holds a random one, which gives it its type (you are told when you enter the arena). No move type is always the best anymore."]
  ], chg: [
    ["En el minuto 35, Arceus rompe el objeto de todos (Banda Focus incluida).",
     "At minute 35, Arceus breaks everyone's item (Focus Sash included)."],
    ["Los legendarios de la Sentencia ya no son el doble de fuertes que el anterior: cada uno tiene un 25 % más de vida y un 15 % más de daño, así que se pueden tumbar. Ya no hay límite de 45 minutos en el ranking.",
     "The Judgment legendaries are no longer twice as strong as the previous one: each one has 25% more HP and 15% more damage, so they can be taken down. There is no 45-minute limit in the ranking anymore."],
    ['Los movimientos evolucionados ya no cambian de nombre: se llaman igual con un «+» (Puño Meteoro pasa a Puño Meteoro +). Hacen lo mismo que antes y se siguen distinguiendo por el borde dorado.',
     'Evolved moves no longer change their name: they keep it with a "+" (Meteor Mash becomes Meteor Mash +). They work just like before and still stand out with their golden border.'],
    ["Puño Meteoro pega menos: 24 de daño en vez de 34 y una zona un poco más pequeña. Al máximo y evolucionado hacía casi el doble que Avalancha; ahora están a la par.",
     "Meteor Mash hits softer: 24 damage instead of 34 and a slightly smaller area. Maxed and evolved it dealt almost twice as much as Rock Slide; now they are on par."],
    ["En la Sentencia de Arceus, el veneno y las quemaduras quitan poco y siempre lo mismo a los legendarios (antes el veneno quitaba un % de su vida): envenenar y huir ya no sirve, hay que pegarles.",
     "In Arceus's Judgment, poison and burns deal a small, fixed amount to the legendaries (poison used to take a % of their HP): poisoning them and running away no longer works, you have to hit them."]
  ] },
  { d: '2026-10-22', title: ['Esferas de Mundo Misterioso, Amuletos Iris y gacha ×100', 'Mystery Dungeon orbs, Shiny Charms and ×100 gacha'], new: [
    ['Esferas de Mundo Misterioso: objetos de un solo uso que se encuentran durante la partida (cofres, jefes y, a veces, al derrotar a un Pokémon). Soporesfera, Ralentosfera y Rafagaesfera duermen, frenan o lanzan lejos a los enemigos; Focosfera, Luminosfera y Rapidosfera te dan crítico, más campo de visión o velocidad a ti y a los compañeros cercanos. Llevas hasta 4 distintas (3 de cada) y se usan con las teclas 5-8, tocando su casilla encima de los ataques o con X / Y en el mando. A los jefes y legendarios les afectan menos.',
     'Mystery Dungeon orbs: single-use items you find during the run (chests, bosses and sometimes when you defeat a Pokémon). Slumber Orb, Slow Orb and Blowback Orb put enemies to sleep, slow them down or blow them away; Focus Orb, Luminous Orb and Quick Orb give critical hits, a wider view or speed to you and nearby teammates. You carry up to 4 different ones (3 of each) and use them with keys 5-8, by tapping their slot above your moves, or with X / Y on a controller. Bosses and legendaries are less affected.'],
    ['Amuletos Iris: uno por región (Kanto, Johto, Hoenn, Sinnoh, Teselia, Kalos, Alola, Galar y Paldea). Al completar la Pokédex de una región (legendarios incluidos) te dan su Amuleto Iris y en su banner del gacha los shiny salen el doble: del 1 % al 2 %. Los tienes en la Mochila, con lo que te falta para cada uno. Si ya habías completado alguna región, el suyo ya es tuyo.',
     'Shiny Charms: one per region (Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar and Paldea). Complete a region\'s Pokédex (legendaries included) to get its Shiny Charm, and shinies become twice as likely in its gacha banner: from 1% to 2%. You can find them in your Bag, along with how many you still need for each one. If you had already completed a region, its charm is already yours.'],
    ['Gacha: nueva tirada ×100, con 100 tickets normales o con 10 tickets ×10 (son diez ×10 seguidas, cada una con su Épica asegurada). La tragaperras gira 10 veces enseñando lo mejor de cada ×10 y al final ves un resumen (nuevos, shiny y Pokémonedas) con las cartas de mejor a peor. Para que quepa, ya no está la tirada ×1: se tira de 10 en 10 o de 100 en 100.',
     'Gacha: new ×100 pull, with 100 normal tickets or with 10 ×10 tickets (ten ×10 pulls in a row, each with its guaranteed Epic). The slot machine spins 10 times showing the best of each ×10, and at the end you get a summary (new, shiny and PokéCoins) with the cards sorted from best to worst. To make room, the ×1 pull is gone: you pull 10 or 100 at a time.'],
    ['Gacha: botón Saltar (o Esc) durante la animación: se acaba la tragaperras y salen todas las cartas de golpe.',
     'Gacha: Skip button (or Esc) during the animation: the slot machine ends and all the cards show up at once.']
  ], fix: [
    ['Cooperativo: a los invitados ya no les sale «La sala se ha cerrado» a mitad de partida (a veces a los pocos minutos o al entrar en una grieta) mientras los demás seguían jugando. Pasaba cuando su conexión con el servidor de las salas se cortaba un momento; ahora la partida sigue y la sala se recupera sola.',
     'Co-op: guests no longer get "The room has been closed" in the middle of a run (sometimes after a few minutes or when entering a rift) while the others kept playing. It happened when their connection to the rooms server dropped for a moment; now the run goes on and the room recovers on its own.'],
    ['Cooperativo: si se corta un momento la conexión con el anfitrión (un bache de la wifi o de los datos), el invitado ya no pierde la partida: se queda en pausa hasta 45 segundos mientras se vuelve a conectar y sigue jugando.',
     'Co-op: if the connection with the host drops for a moment (a Wi-Fi or mobile data hiccup), the guest no longer loses the run: it pauses for up to 45 seconds while reconnecting and then keeps playing.'],
    ['Cooperativo: si te quedas fuera de una partida mientras los demás siguen, ya no te sale «La sala se ha cerrado»: esperas en la sala y, cuando acaben, seguís juntos.',
     'Co-op: if you drop out of a run while the others keep playing, you no longer get "The room has been closed": you wait in the room and, when they finish, you play together again.']
  ]},
  { d: '2026-10-21', title: ['La gran actualización: Tienda Kecleon', 'The big update: Kecleon Shop'], new: [
    ['Mejora nueva: Tienda Kecleon (botón en el menú) con Mentas, Cápsulas Habilidad y 8 MT nuevas cada día. Cada Pokémon tiene ahora su naturaleza (±10 % a dos stats) y su habilidad, con efecto en la partida; se ven y se cambian en su ficha de la colección. Las MT enseñan para siempre ataques de fuera de sus tipos, pero sólo si los aprende en los juegos (Mewtwo puede aprender Bola Sombra; Psyduck no puede aprender Lanzallamas). Gracias a TheAdro7 por la idea y el trabajo de base.',
     'New: the Kecleon Shop (button in the menu) with Mints, Ability Capsules and 8 new TMs every day. Every Pokémon now has its own nature (±10% to two stats) and ability, with an effect in the run; you can see and change them on its page in the collection. TMs permanently teach moves outside its types, but only if it learns them in the games (Mewtwo can learn Shadow Ball; Psyduck cannot learn Flamethrower). Thanks to TheAdro7 for the idea and the groundwork.'],
    ['Mejora nueva, Segundo movimiento inicial: con Repertorio, se compra una vez por Pokémon y luego eliges gratis el segundo ataque con el que empiezas (o lo dejas al azar).',
     'New upgrade, Second starting move: with Repertoire, buy it once per Pokémon and then choose for free the second move you start with (or leave it random).'],
    ['Cooperativo: si caes, puedes mirar a un compañero que siga en pie mientras esperas a que te levanten. Pulsa el botón que sale debajo del aviso (o Q / E, o LB / RB en el mando) para pasar de uno a otro y volver a ti. Sólo cambia la cámara: no gasta más conexión.',
     'Co-op: if you go down, you can watch a teammate who is still standing while you wait to be revived. Press the button under the message (or Q / E, or LB / RB on a controller) to switch between them and back to yourself. Only the camera changes: it uses no extra connection.']
  ], fix: [
    ['Guardado en la nube: si jugabas en un aparato y guardabas, otro aparato con el juego abierto desde antes podía subir su copia vieja encima (al guardar o al actualizarse el juego) y en el otro no aparecían tus tickets ni tus Pokémon nuevos. Ahora, si la nube tiene algo más nuevo, se junta con lo tuyo antes de guardar y no se pierde nada.',
     'Cloud save: if you played and saved on one device, another device that still had the game open could upload its old copy over it (when saving or when the game updated), and your new tickets and Pokémon did not show up on the other one. Now, if the cloud has something newer, it is merged with yours before saving and nothing is lost.']
  ] },
  { d: '2026-10-20', title: ['Cooperativo más seguro y arreglos de ataques', 'Safer co-op and move fixes'], fix: [
    ['Cooperativo: un jugador con el juego trucado ya no puede colgar la partida de los demás mandando números imposibles (una experiencia infinita dejaba congelado al anfitrión y un efecto gigante, a los invitados).',
     'Co-op: a player with a tampered game can no longer freeze the others by sending impossible numbers (infinite experience froze the host and a giant effect froze the guests).'],
    ['Mejoras: al cambiar de compañero, la pantalla de mejoras se abre ya con el nuevo y no con el último que habías mirado.',
     'Upgrades: after changing your partner, the upgrades screen now opens on the new one instead of the last one you had looked at.'],
    ['Cooperativo: Viento Aciago, Bucle Arena y Torbellino de un invitado ya atraen a los enemigos (sólo atraían los del anfitrión).',
     'Co-op: a guest\'s Ominous Wind, Sand Tomb and Whirlpool now pull enemies in (only the host\'s did).'],
    ['Cooperativo: el Infortunio de un invitado ya hace su daño extra a los enemigos quemados, envenenados o frenados.',
     'Co-op: a guest\'s Hex now deals its extra damage to burned, poisoned or slowed enemies.'],
    ['Bomba Ácida, Bola Voltio, Bomba Germen, Rayo Señal, Joya de Luz, Bola Neblina, Energibola, Canto Helado, Sombra Vil y Beso Drenaje: al evolucionar, los disparos salían hacia los lados y no daban a nadie. Ahora salen hacia delante, y la mejora «+1 proyectil» ya añade uno (antes no añadía ninguno).',
     'Acid Spray, Electro Ball, Seed Bomb, Signal Beam, Power Gem, Mist Ball, Energy Ball, Ice Shard, Shadow Sneak and Draining Kiss: once evolved, the shots flew off to the sides and hit nothing. Now they go forward, and the "+1 projectile" upgrade really adds one (it added none before).'],
    ['Cooperativo: si a alguien se le cerraban las cartas de subida de nivel sin haber elegido (podía pasar eligiendo muy deprisa), ahora se le vuelven a abrir y los demás ya no se quedan esperándole.',
     'Co-op: if someone\'s level-up cards closed before they had picked (it could happen when picking very fast), they now open again and the others are no longer left waiting for them.']
  ], chg: [
    ['En el móvil ya no está la opción «Apuntar a mano» (no funcionaba con la pantalla táctil): los ataques siempre apuntan solos.',
     'On mobile the "Manual aim" option is gone (it did not work with the touch screen): moves always aim on their own.'],
    ['Ranking por Pokémon: ahora cuentan las partidas de 5 minutos o más (los demás rankings siguen desde 2 minutos).',
     'Per-Pokémon leaderboard: runs now count from 5 minutes on (the other leaderboards still from 2 minutes).'],
    ['Amigos: ya no se ve quién está en línea, y puedes invitar a una sala a cualquier amigo (si no entra, la invitación caduca sola a los 3 minutos).',
     'Friends: you no longer see who is online, and you can invite any friend to a room (if they do not join, the invite expires on its own after 3 minutes).'],
    ['Guardado en la nube: ahora la partida sólo se sube a la nube cuando pulsas el botón Guardar de arriba (y antes de una actualización del juego). En este navegador se sigue guardando todo al momento. Si juegas en otro aparato o vas a borrar los datos del navegador, pulsa Guardar antes.',
     'Cloud save: your game is now only uploaded to the cloud when you press the Save button at the top (and before a game update). Everything is still saved instantly in this browser. If you play on another device or are about to clear your browser data, press Save first.'],
    ['Las solicitudes de amistad nuevas se ven al abrir Amigos.',
     'New friend requests show up when you open Friends.']
  ] },
  { d: '2026-10-19', title: ['38 ataques nuevos', '38 new moves'], new: [
    ['38 ataques nuevos: ahora todos los tipos tienen 5 o más (Roca, Lucha, Dragón y Hada tenían sólo 2). Entre ellos Hiperrayo, Rayo Solar, Magnitud, Torbellino, Onda Trueno, Enfado, Carantoña, Golpe Bajo... cada uno con su evolución.',
     '38 new moves: every type now has 5 or more (Rock, Fighting, Dragon and Fairy had only 2). Among them Hyper Beam, Solar Beam, Magnitude, Whirlpool, Thunder Wave, Outrage, Play Rough, Sucker Punch... each with its evolution.'],
    ['Formas nuevas de atacar: disparos que persiguen al enemigo o rebotan entre ellos, rayos que se cargan, giros que golpean todo alrededor, ondas que avanzan por el suelo, remolinos que atraen a los enemigos, ondas que los apartan y zonas que los dejan aturdidos.',
     'New ways to attack: shots that chase enemies or bounce between them, beams you charge up, spins that hit everything around you, shockwaves that travel along the ground, vortexes that pull enemies in, waves that push them away and zones that stun them.'],
    ['Mejora nueva, Movimiento inicial: se compra una vez por Pokémon y luego eliges gratis con qué ataque empieza la partida.',
     'New upgrade, Starting move: buy it once per Pokémon and then choose for free which move it starts the run with.'],
    ['Idiomas nuevos: francés, italiano, portugués de Brasil, chino simplificado y chino tradicional, en Ajustes > Gráficos > Idioma. Gracias a quienes los tradujeron.',
     'New languages: French, Italian, Brazilian Portuguese, Simplified Chinese and Traditional Chinese, in Settings > Graphics > Language. Thanks to everyone who translated them.'],
    ['Una frase de broma en el título del menú principal, como las de Minecraft.',
     'A joke line on the main menu title, like the ones in Minecraft.']
  ], chg: [
    ['Los Pokémon de un solo tipo pegan un 20 % más con los ataques de su tipo, para compensar que tienen menos variedad.',
     'Single-type Pokémon deal 20% more damage with moves of their type, to make up for having less variety.'],
    ['Al aprender un ataque nuevo ya no se cambia solo a él: sigues con el que estabas usando y cambias cuando tú quieras.',
     'Learning a new move no longer switches to it on its own: you keep the one you were using and switch whenever you want.'],
    ['El juego sólo se puede jugar en su web oficial, pokesurvivor.com: si otra web lo mete dentro de la suya (por ejemplo, para ponerle anuncios alrededor), sale un aviso con un botón para ir a la oficial.',
     'The game can only be played on its official website, pokesurvivor.com: if another site embeds it in its own page (for example, to put ads around it), a notice appears with a button to go to the official one.']
  ], fix: [
    ['Movimiento inicial: ya se puede volver al ataque de serie aunque no sea de su tipo (por ejemplo Confusión en Psyduck).',
     'Starting move: you can now go back to the default move even if it is not of its type (for example Confusion on Psyduck).'],
    ['Cooperativo: el jefe que tocaba al volver de una grieta podía salir a miles de metros, donde nadie lo encontraba, y la partida se quedaba sin más grietas. Ahora sale cerca, y si un jefe se queda lejísimos de todos, vuelve a aparecer cerca a los pocos segundos.',
     'Co-op: the boss due when coming back from a rift could appear thousands of metres away, where nobody could find it, and the run got no more rifts. Now it appears nearby, and if a boss ends up very far from everyone, it shows up close again after a few seconds.'],
    ['Al recargar, a veces la página nueva se juntaba con los estilos viejos guardados en el navegador (por ejemplo, la frase del título salía en grande pegada a «PokéSurvivor»). Ya no pasa.',
     'When reloading, the new page sometimes got mixed with the old styles saved in the browser (for example, the title line showed up big and stuck to "PokéSurvivor"). That no longer happens.']
  ] },
  { d: '2026-10-18', title: ['Físico y especial, mando, botón Guardar y rankings desde cero', 'Physical and special, controller, Save button and fresh leaderboards'], new: [
    ['Ataques físicos y especiales, como en los juegos: cada Pokémon tiene su Ataque, Ataque Especial, Defensa y Defensa Especial. Los ataques físicos pegan con su Ataque y los especiales con su Ataque Especial: Machamp pega fuerte con Golpe Kárate y flojo con Bola Sombra. Con los de su lado bueno pega lo mismo que antes. Al subir de nivel, cada carta dice si el ataque es físico o especial y cuánto rinde con tu Pokémon, y en la colección se ven todas sus estadísticas.',
     'Physical and special moves, like in the games: every Pokémon has its Attack, Special Attack, Defense and Special Defense. Physical moves use its Attack and special moves its Special Attack: Machamp hits hard with Karate Chop and weakly with Shadow Ball. With moves on its strong side it hits as hard as before. When leveling up, each card says whether the move is physical or special and how well it works with your Pokémon, and the collection shows all its stats.'],
    ['Danza Espada y Danza Dragón suben sólo el Ataque (físico), como en los juegos, y llega Maquinación, que sube el Ataque Especial y la puede aprender cualquier Pokémon. Al subir de nivel, los ataques del lado bueno de tu Pokémon salen el doble de a menudo.',
     'Swords Dance and Dragon Dance now raise only (physical) Attack, like in the games, and Nasty Plot arrives, raising Special Attack, learnable by any Pokémon. When leveling up, moves on your Pokémon’s strong side show up twice as often.'],
    ['Resumen de la partida en la pausa: cada ataque con su categoría, el daño que lleva hecho y su daño por segundo; tus estadísticas con todo lo que has subido; y el objeto y las cartas de mejora que llevas.',
     'Run summary in the pause screen: each move with its category, the damage it has dealt and its damage per second; your stats with everything you have raised; and your item and the upgrade cards you have.'],
    ['Las defensas también cuentan (un poco): los enemigos se defienden de tus ataques físicos con su Defensa y de los especiales con su Defensa Especial, y cada enemigo te pega con su lado fuerte, que paras con tu Defensa o tu Defensa Especial.',
     'Defenses count too (a little): enemies resist your physical moves with their Defense and special moves with their Special Defense, and each enemy hits you with its strong side, which you block with your Defense or Special Defense.'],
    ['Ya se puede jugar con mando (Xbox, PlayStation, Switch y la mayoría de mandos USB o Bluetooth): moverte, cambiar de ataque, pausar, elegir cartas y manejar todos los menús, con vibración al recibir daño. Se configura en Ajustes > Controles.',
     'You can now play with a controller (Xbox, PlayStation, Switch and most USB or Bluetooth controllers): move, switch attacks, pause, pick cards and use every menu, with vibration when you take damage. Set it up in Settings > Controls.'],
    ['Colección: buscador por nombre o número, pestaña con todas las generaciones, filtros que se combinan (tengo / me faltan, varias rarezas a la vez, shiny, favoritos y tipo) y orden por número, nombre, rareza, recién conseguidos o más usados. Y favoritos: márcalos en la ficha de cada Pokémon; van con tu cuenta, en todos tus aparatos.',
     'Collection: search by name or number, a tab with every generation, filters that combine (owned / missing, several rarities at once, shiny, favorites and type) and sorting by number, name, rarity, recently caught or most played. Plus favorites: mark them on each Pokémon’s page; they go with your account, on all your devices.'],
    ['Nueva pestaña Accesibilidad en Ajustes con «Apuntar a mano»: tus ataques van hacia el ratón o hacia donde empujes el stick derecho del mando, en vez de al enemigo más cercano. Viene desactivado.',
     'New Accessibility tab in Settings with “Manual aim”: your attacks go towards the mouse or wherever you push the controller’s right stick, instead of the nearest enemy. It is off by default.'],
    ['Botón Guardar arriba a la derecha: sube tu partida a la nube al momento. Úsalo antes de cerrar el juego o de cambiar de aparato.',
     'Save button at the top right: it uploads your game to the cloud right away. Use it before closing the game or switching devices.']
  ], chg: [
    ['Las cartas de nivel, de vínculo y de objeto no se pueden elegir durante un momento al aparecer (se ven apagadas): pulsar 1-4 o tocar la pantalla para cambiar de ataque en plena pelea ya no elige una carta sin querer.',
     'Level-up, bond and item cards can’t be picked for a moment after they appear (they look dimmed): pressing 1-4 or tapping to switch attacks mid-fight no longer picks a card by accident.'],
    ['Con mando ya se pueden elegir en la colección los Pokémon que aún no tienes, y en el móvil las pestañas de Ajustes caben en una fila que se desliza.',
     'With a controller you can now select the Pokémon you don’t have yet in the collection, and on mobile the Settings tabs fit in one row that scrolls sideways.'],
    ['La partida se guarda en la nube automáticamente cada 10 minutos.',
     'Your game is saved to the cloud automatically every 10 minutes.'],
    ['Ranking histórico: si estás por debajo del puesto 1.000, sale «#1000+» en vez del número exacto.',
     'All-time leaderboard: if you are below rank 1,000, it shows “#1000+” instead of the exact number.'],
    ['Los Pokémon grandes (Onix, Gyarados, Wailord, Eternatus, los legendarios...) ya se pueden jugar bien: se ven algo más pequeños, aunque siguen siendo de los más grandes, y chocan como uno normal, así que caben por todos los pasillos y no reciben más golpes por su tamaño.',
     'Big Pokémon (Onix, Gyarados, Wailord, Eternatus, the legendaries...) are now properly playable: they look a bit smaller, while still being among the biggest, and collide like a normal one, so they fit through every corridor and don’t take extra hits because of their size.'],
    ['Como mucho hay 3 curanderos, 3 escuderos y 3 invocadores a la vez.',
     'There are at most 3 healers, 3 shielders and 3 summoners at a time.'],
    ['Los curanderos y escuderos ya no hacen inmatable a un jefe: lo que le curan y el escudo que le ponen van con el daño que le estás haciendo, y sólo recibe un escudo cada 6 segundos.',
     'Healers and shielders no longer make a boss unkillable: their healing and shields scale with the damage you are dealing to it, and it only gets one shield every 6 seconds.'],
    ['Sentencia de Arceus: la velocidad tiene un tope suave (lo que pase de cierto punto cuenta mucho menos) y los legendarios corren casi tanto como tú. Desde los 5 minutos de Sentencia Arceus acelera sin parar, y desde los 7 su toque quita cada vez más vida, hasta dejarte KO de un golpe hacia el minuto 40.',
     'Judgment of Arceus: speed has a soft cap (anything above a certain point counts much less) and legendaries run almost as fast as you. After 5 minutes of Judgment, Arceus keeps speeding up, and after 7 its touch takes more and more HP, until it knocks you out in one hit around minute 40.'],
    ['El veneno sigue quitando un porcentaje de la vida, pero contra enemigos con muchísima vida (los legendarios de la Sentencia) ese porcentaje es menor.',
     'Poison still takes a percentage of HP, but against enemies with huge HP (the Judgment legendaries) that percentage is smaller.'],
    ['Todos los rankings empiezan de cero (hoy, semana, mes, año e histórico): las marcas de huir de Arceus ya no se podrían alcanzar.',
     'All leaderboards start from scratch (daily, weekly, monthly, yearly and all-time): records from running away from Arceus could no longer be reached.']
  ], fix: [
    ['Seguridad: se ha cerrado un agujero por el que alguien podía meter código en su fila del ranking o en su perfil y hacer que se ejecutara en el navegador de quien los abría (a algunos les llevaba a un vídeo). Ahora todo lo que viene de otros jugadores se limpia, el servidor sólo deja guardar lo que debe, y el navegador no ejecuta nada que no sea del juego.',
     'Security: we closed a hole that let someone put code in their leaderboard row or profile and make it run in the browser of whoever opened them (some people were sent to a video). Now everything coming from other players is cleaned, the server only accepts what it should, and the browser runs nothing that isn’t part of the game.'],
    ['En el ranking ya salen en shiny los Pokémon de quien jugó con su shiny.',
     'The leaderboard now shows Pokémon in shiny form for players who played with their shiny.']
  ] },
  { d: '2026-10-15', title: ['Actualizaciones obligatorias', 'Required updates'], chg: [
    ['Cuando una actualización sea obligatoria (por ejemplo, para arreglar un fallo importante), la partida en curso se termina tras un aviso de 10 s y el juego se recarga. No pierdes nada: las monedas, los tickets, los récords y el ranking de esa partida se guardan como al abandonarla.',
     'When an update is required (for example, to fix an important bug), your current run ends after a 10 s notice and the game reloads. You lose nothing: that run’s coins, tickets, records and leaderboard entry are saved as if you had quit.']
  ] },
  { d: '2026-10-14', title: ['Recupera tu cuenta con Gmail', 'Recover your account with Gmail'], new: [
    ['Si juegas con nombre y contraseña, puedes vincular tu Gmail: si un día olvidas la contraseña, entras con Google y es tu misma cuenta. Te lo ofrecemos al entrar.',
     'If you play with a name and password, you can link your Gmail: if you ever forget your password, sign in with Google and it is the same account. We offer it when you sign in.'],
    ['Móvil: ya puedes colocar los botones donde quieras. En Ajustes > Controles > Colocar los botones arrastras los ataques (con el objeto), la pausa y el joystick, que ahora también puede ser fijo en vez de aparecer donde pones el dedo.',
     'Mobile: you can now place the buttons wherever you want. In Settings > Controls > Place the buttons, drag the attacks (with the item), the pause button and the joystick, which can now also be fixed instead of appearing where you put your finger.']
  ], chg: [
    ['Las tablas de la semana y del mes del ranking empiezan de cero, como el histórico: ahora sólo cuentan partidas con la Sentencia de Arceus y todas las tablas cuadran entre sí.',
     'The weekly and monthly leaderboards start from scratch, like the all-time one: now only runs with the Judgment of Arceus count, and all boards match each other.'],
    ['Aviso importante: la única web oficial de PokéSurvivor es pokesurvivor.com. El juego es y será gratis: si alguna otra web te pide pagar (por tickets, monedas o lo que sea), no somos nosotros. Lo verás también al entrar y en el Aviso legal.',
     'Important: the only official PokéSurvivor website is pokesurvivor.com. The game is and always will be free: if any other website asks you to pay (for tickets, coins or anything else), it isn’t us. You will also see this when signing in and in the Legal notice.'],
    ['El código del juego pasa a una licencia no comercial (PolyForm Noncommercial 1.0.0): se puede seguir estudiando y modificando, pero nadie puede cobrar por él.',
     'The game’s code moves to a non-commercial license (PolyForm Noncommercial 1.0.0): you can still study and modify it, but nobody may charge for it.']
  ], fix: [
    ['Cooperativo: la partida ya no se queda parada con cada uno esperando a que el otro elija. Un objeto y las cartas de nivel ya no se tapan, y si la conexión pierde un aviso se arregla solo.',
     'Co-op: the game no longer freezes with each player waiting for the other to choose. An item and the level-up cards no longer cover each other, and if the connection drops a message it fixes itself.'],
    ['Cooperativo: al volver de una grieta, quien no era el anfitrión ya ve a todos los enemigos (antes algunos eran invisibles y sólo se veían sus ataques).',
     'Co-op: after coming back from a rift, players who are not the host can see every enemy again (some used to be invisible, with only their attacks showing).'],
    ['Amigos: si tu móvil u ordenador tiene la hora (o la zona horaria) mal puesta, tus amigos ya no salen siempre desconectados y sus invitaciones te llegan.',
     'Friends: if your phone or computer has the wrong time (or time zone), your friends no longer always show as offline and their invitations reach you.'],
    ['Jugar en dos aparatos (PC y móvil) ya no hace perder monedas ni tickets: antes, si uno tenía la partida abierta con datos viejos y guardaba, borraba lo ganado en el otro. Ahora se suma lo de los dos. Y al volver al juego tras un rato fuera, se trae lo conseguido en el otro aparato (Pokémon, shinies...) sin recargar.',
     'Playing on two devices (PC and phone) no longer loses coins or tickets: before, if one had the game open with old data and saved, it erased what you earned on the other. Now both are added up. And when you come back to the game after a while away, it brings in what you got on the other device (Pokémon, shinies...) without reloading.'],
    ['Los avisos grandes de la partida (un Gholdengo cerca, una marea...) ya salen siempre centrados.',
     'Big in-game announcements (a nearby Gholdengo, a swarm...) are always centered now.']
  ] },
  { d: '2026-10-13', title: ['La Sentencia de Arceus', 'The Judgment of Arceus'], new: [
    ['La Sentencia de Arceus: al llegar al minuto 30, Arceus baja del cielo y te lleva a las Ruinas del Juicio. Es invencible, te persigue cada vez más deprisa y lanza pilares de luz, rayos y ondas; si te toca, te quita casi media vida. Cada 5 segundos acude un legendario con el doble de vida y de daño que el anterior. ¿Cuánto aguantarás?',
     'The Judgment of Arceus: at minute 30, Arceus descends from the sky and takes you to the Ruins of Judgment. It is invincible, chases you faster and faster and casts pillars of light, beams and shockwaves; if it touches you, you lose almost half your HP. Every 5 seconds a legendary joins, each with twice the HP and damage of the previous one. How long can you last?'],
    ['Tres logros nuevos: La Sentencia (llega al minuto 30), Ante el Creador (aguanta 1 minuto ante Arceus) y Desafío divino (derrota a 3 legendarios ante Arceus en una partida).',
     'Three new achievements: The Judgment (reach minute 30), Before the Creator (survive 1 minute against Arceus) and Divine challenge (defeat 3 legendaries against Arceus in a single run).'],
    ['Música nueva para la pelea contra Arceus.', 'New music for the fight against Arceus.'],
    ['Botón para reportar marcas sospechosas en el ranking (la banderita de cada fila).',
     'A button to report suspicious records on the leaderboard (the little flag on each row).']
  ], chg: [
    ['El ranking histórico empieza de cero: ahora que las partidas acaban ante Arceus, las marcas de antes ya no se podrían alcanzar. Las tablas de hoy, de la semana y del mes siguen igual.',
     'The all-time leaderboard starts from scratch: now that runs end against Arceus, older records could no longer be reached. The daily, weekly and monthly boards are unchanged.'],
    ['Se quita el tiempo extra del minuto 60 (ya no se llega hasta ahí).',
     'Overtime from minute 60 is removed (runs no longer get that far).'],
    ['Desde el minuto 28 ya no se abren grietas, para que la Sentencia no te pille dentro de una.',
     'Rifts no longer open from minute 28 on, so the Judgment does not catch you inside one.'],
    ['Ranking protegido contra trampas: el servidor comprueba que cada marca se ha jugado de verdad. Nunca se pierde nada de lo que ganas jugando.',
     'Leaderboard protected against cheating: the server checks that every record was really played. You never lose anything you earn by playing.'],
    ['Se han quitado del ranking las marcas de más de 35 minutos: con la Sentencia de Arceus ya no son posibles.',
     'Records over 35 minutes have been removed from the leaderboard: with the Judgment of Arceus they are no longer possible.']
  ], fix: [
    ['Las tiradas del gacha, los Pokémon nuevos y los premios se guardan en la nube al momento. Si abriste el juego en otro aparato o navegador y te faltaba algo, vuelve a abrirlo donde lo conseguiste: se recupera solo.',
     'Gacha pulls, new Pokémon and rewards are saved to the cloud right away. If you opened the game on another device or browser and something was missing, open it again where you got it: it comes back on its own.']
  ] },
  { d: '2026-10-12', title: ['Tiempo extra y grietas con menos azar', 'Overtime and less random rifts'], new: [
    ['Tiempo extra: desde el minuto 60 los Pokémon salvajes se vuelven cada vez más fuertes (más vida y más daño), y cada vez más deprisa. Antes, con las mejoras al máximo, algunas partidas no acababan nunca; ahora las mejores rondarán la hora y media.',
     'Overtime: from minute 60 on, wild Pokémon keep getting stronger (more HP and more damage), faster and faster. Before, with maxed upgrades, some runs never ended; now the best ones will last about an hour and a half.'],
    ['El juego se actualiza solo cuando sale una versión nueva: si estás en el menú, a los 5 segundos; si estás jugando, al acabar la partida (sin perder nada).',
     'The game now updates itself when a new version is out: within 5 seconds if you are in the menu, or after your run if you are playing (without losing anything).'],
    ['Botón de Novedades (esta ventana) con todos los cambios del juego.',
     'A "What\'s new" button (this window) with every change to the game.'],
    ['Números más fáciles de leer: el 2, el 5 y el 8 ya no se confunden.',
     'Easier to read numbers: 2, 5 and 8 no longer look alike.'],
    ['Elige la versión normal o shiny de tu compañero desde el menú principal, debajo de él.',
     'Pick the normal or shiny version of your partner right from the main menu, under it.'],
    ['Mejoras nuevas para cada Pokémon: Golpe Crítico (+3 % de críticos por nivel, que hacen x1,5 de daño), Cambio de cartas (+1 cambio de las cartas de nivel por run) y Veto (bloquea movimientos para que no te salgan en las cartas; se eligen en Mejoras).',
     'New upgrades for each Pokémon: Critical Hit (+3% critical chance per level, crits deal x1.5 damage), Card reroll (+1 level-up card reroll per run) and Ban (block moves so they never show up in your cards; pick them in Upgrades).'],
    ['Atajos de movimientos (en Mejoras, para cada Pokémon): elige qué movimiento va siempre en cada hueco, por ejemplo Confusión siempre en el 1, para la memoria muscular.',
     'Move shortcuts (in Upgrades, for each Pokémon): choose which move always goes in each slot, for example Confusion always on 1, for muscle memory.']
  ], chg: [
    ['Avalancha hace menos daño (21 en vez de 26): derrotaba casi el doble que la media de los movimientos.',
     'Rock Slide deals less damage (21 instead of 26): it defeated almost twice as many as the average move.'],
    ['Los cambios de cartas de nivel ya no se ganan venciendo jefes: tienes 1 gratis por run y el resto se compra en Mejoras.',
     'Level-up card rerolls are no longer earned by defeating bosses: you get 1 free per run and can buy more in Upgrades.'],
    ['Los legendarios de grieta ya no dan siempre tickets x10: dan uno la mitad de las veces (antes daban 2 siempre y salían demasiados).',
     'Rift legendaries no longer always drop x10 tickets: they drop one half of the time (they used to always drop 2, which was too many).'],
    ['Cooperativo: si vuestras redes no consiguen conectar entre sí, la sala lo avisa y lo reintenta sola, en vez de jugar a tirones por un servidor lento.',
     'Co-op: if your networks cannot connect to each other, the room says so and keeps retrying, instead of playing laggy through a slow server.'],
    ['Hemos cambiado de servidores para que el juego siga siendo gratis: puede que tengas que volver a iniciar sesión (con la misma cuenta y contraseña, o con Google). Tu partida y tus Pokémon siguen igual.',
     'We moved to new servers so the game can stay free: you may need to sign in again (with the same account and password, or with Google). Your save and your Pokémon are unchanged.'],
    ['Gacha: los shiny ya no salen repetidos. Si te toca uno que ya tienes, sale otro de la misma rareza que te falte.',
     'Gacha: shinies no longer come out as duplicates. If you roll one you already have, you get another of the same rarity that you are missing.'],
    ['Grietas con menos azar: cada vez que no sale una, la siguiente es más probable (como mucho 2,5 minutos sin grieta).',
     'Less random rifts: every time one does not show up, the next one is more likely (at most 2.5 minutes without a rift).'],
    ['Los legendarios que aún no has vencido salen 4 veces más en las grietas.',
     'Legendaries you have not beaten yet show up 4 times as often in rifts.'],
    ['Los curanderos curan más cuanto más fuerte pegas, pero cada vez menos y con un tope (como mucho el 2,5x).',
     'Healers heal more the harder you hit, but with diminishing returns and a cap (2.5x at most).'],
    ['Ataques cuerpo a cuerpo más fuertes: mientras llevas uno activo recibes un 25 % menos de daño, llegan un 25 % más lejos y hacen un 20 % más de daño.',
     'Stronger melee attacks: while one is active you take 25% less damage, and they reach 25% further and deal 20% more damage.'],
    ['Cooperativo: al elegir con qué objeto quedarte, la partida se para para todos (antes seguía y te pegaban mientras elegías).',
     'Co-op: choosing which held item to keep now pauses the run for everyone (it used to keep going and you got hit while choosing).'],
    ['Cooperativo: mientras alguien elige una fusión, la partida se para para todos.',
     'Co-op: while someone is choosing a fusion, the run pauses for everyone.'],
    ['Cooperativo: si el anfitrión cambia de pestaña o se le para el juego, la partida se pausa para todos hasta que vuelva.',
     'Co-op: if the host switches tabs or their game stalls, the run pauses for everyone until they are back.'],
    ['Las runs de menos de 1 minuto ya no cuentan para el ranking.',
     'Runs shorter than 1 minute no longer count for the leaderboard.']
  ], fix: [
    ['Quitadas del ranking las marcas rotas por el fallo del minuto 84 (el reloj seguía corriendo con el juego parado) y alguna imposible. Si tenías una, tu próxima partida vuelve a contar.',
     'Removed broken records from the leaderboard caused by the minute 84 bug (the clock kept running while the game was frozen) and a few impossible ones. If you had one, your next run counts again.'],
    ['iPhone (Safari y Chrome): a veces no se podía cambiar de movimiento tocando los iconos, sobre todo con el otro dedo en el joystick. Además los botones quedan por encima de la barra de inicio.',
     'iPhone (Safari and Chrome): sometimes you could not switch moves by tapping the icons, especially with your other finger on the joystick. Buttons also sit above the home bar now.'],
    ['En las partidas de más de 84 minutos la pantalla se quedaba en negro, el juego se paraba o empezabas a subir de nivel sin fin. Ya puedes jugar todo lo que aguantes.',
     'In runs longer than 84 minutes the screen went black, the game froze or you kept levelling up forever. Now you can play for as long as you survive.'],
    ['Si el juego fallara, la partida se cierra sola y se guarda (tiempo, derrotados, récords y ranking) en vez de perderse.',
     'If the game ever crashes, the run ends by itself and is saved (time, defeated, records and leaderboard) instead of being lost.'],
    ['Las partidas muy largas a veces se tomaban por trampas y no contaban para el ranking.',
     'Very long runs were sometimes flagged as cheating and did not count for the leaderboard.'],
    ['Cooperativo: si el anfitrión cambiaba de pestaña, los enemigos se quedaban quietos y los demás jugaban con ventaja.',
     'Co-op: if the host switched tabs, enemies stood still and everyone else got a free advantage.'],
    ['iPhone: mantener el dedo en el joystick sacaba "Copiar / Seleccionar todo".',
     'iPhone: holding your finger on the joystick brought up "Copy / Select all".'],
    ['iPhone: a veces no salía la pantalla completa. Ahora el botón explica cómo tenerla (Compartir y "Añadir a pantalla de inicio").',
     'iPhone: fullscreen sometimes did not show up. Now the button explains how to get it (Share and "Add to Home Screen").']
  ] },
  { d: '2026-10-11', title: ['Vínculos', 'Bonds'], new: [
    ['Vínculos: al vencer a un legendario fusionas movimientos que se lanzan a la vez desde un solo hueco (hasta 4).',
     'Bonds: defeating a legendary lets you fuse moves that fire at the same time from a single slot (up to 4).'],
    ['Botón para cambiar las cartas de subir de nivel.',
     'A button to reroll the level-up cards.']
  ], chg: [
    ['Más grietas.', 'More rifts.'],
    ['Movimientos psíquicos y curanderos más flojos.', 'Weaker psychic moves and healers.'],
    ['Las mejoras de las cartas de nivel (velocidad, recarga, experiencia, imán, coraza y potencia) tienen un tope de veces.',
     'Level-up card upgrades (speed, cooldown, experience, magnet, armor and power) can only be taken a limited number of times.'],
    ['En el móvil, la ficha del Pokémon sale al lado; entrar es más rápido y el gacha x10 se puede cerrar.',
     'On mobile, the Pokémon details show alongside; logging in is faster and the x10 gacha can be closed.']
  ], fix: [
    ['Pantalla negra en partidas de más de una hora por llenarse la memoria de imágenes.',
     'Black screen in runs longer than an hour because image memory filled up.'],
    ['Los tickets se perdían si se cerraba la pestaña antes de acabar la partida: ahora se guardan al cogerlos.',
     'Tickets were lost if the tab closed before the run ended: now they are saved as soon as you pick them up.'],
    ['Una mejora comprada justo después de guardar se cobraba y no se apuntaba.',
     'An upgrade bought right after saving was charged but not applied.'],
    ['El juego se quedaba congelado para siempre si algo fallaba a mitad de partida.',
     'The game froze forever if something went wrong mid-run.']
  ] },
  { d: '2026-10-10', title: ['Más reto', 'More challenge'], new: [
    ['Jefes y legendarios con 4 ataques avisados que se enfurecen a media vida.',
     'Bosses and legendaries with 4 telegraphed attacks that get enraged at half health.'],
    ['12 movimientos nuevos y 8 formas de atacar nuevas: bumerán, cadena, minas, meteoros, torreta, embestida, rastro y abanico.',
     '12 new moves and 8 new ways to attack: boomerang, chain, mines, meteors, turret, dash, trail and spray.'],
    ['Eventos a mitad de partida (hordas de un tipo, hora dorada, Pokémon perdidos) y Meowth y Gholdengo que huyen cargados de monedas.',
     'Mid-run events (single-type hordes, golden hour, lost Pokémon) and Meowth and Gholdengo running away loaded with coins.'],
    ['Estatuas para los Pokémon grandes.', 'Statues for big Pokémon.']
  ], chg: [
    ['Más difícil: menos enemigos pero más duros.', 'Harder: fewer but tougher enemies.'],
    ['Subir de nivel es más lento, los tickets son más raros y los jefes dan ticket x10 una de cada tres veces.',
     'Levelling up is slower, tickets are rarer and bosses drop a x10 ticket one time in three.'],
    ['Carga más rápida.', 'Faster loading.']
  ], fix: [
    ['Los enemigos rezagados desaparecían delante de ti: ahora sólo fuera de la vista.',
     'Straggling enemies vanished in front of you: now only off-screen.'],
    ['Los menús y pantallas se montaban encima de la barra de arriba.',
     'Menus and screens overlapped the top bar.']
  ] },
  { d: '2026-10-09', title: ['Móvil e inglés', 'Mobile and English'], new: [
    ['Se puede jugar en móvil y tablet con joystick táctil, e instalar como app.',
     'Play on phones and tablets with a touch joystick, and install it as an app.'],
    ['El juego, en español y en inglés.', 'The game in English and Spanish.'],
    ['Pantalla de ajustes con calidad gráfica automática.', 'Settings screen with automatic graphics quality.']
  ], chg: [
    ['Menos enemigos en pantalla pero más fuertes.', 'Fewer but stronger enemies on screen.'],
    ['Gigadrenado pasa a ser Hierba Lazo (ya no cura).', 'Giga Drain becomes Grass Knot (no more healing).']
  ] },
  { d: '2026-10-08', title: ['Misiones, grietas y cooperativo', 'Missions, rifts and co-op'], new: [
    ['Misiones diarias y semanales, logros con medallas y títulos, y perfil público.',
     'Daily and weekly missions, achievements with medals and titles, and a public profile.'],
    ['Objetos equipables, evoluciones de movimientos y enemigos que curan, protegen, invocan o explotan.',
     'Held items, move evolutions and enemies that heal, shield, summon or explode.'],
    ['Grietas que llevan a 18 arenas legendarias, una por tipo, y clima que cambia la batalla.',
     'Rifts leading to 18 legendary arenas, one per type, and weather that changes the fight.'],
    ['Cooperativo con tu lista de amigos y ranking.', 'Co-op with your friends list and leaderboards.'],
    ['Mejoras para cada Pokémon, gacha tragaperras con tickets y tabla de tipos.',
     'Upgrades for each Pokémon, a slot-machine ticket gacha and a type chart.']
  ], chg: [
    ['Cámara más lejos y enemigos que rodean los obstáculos.', 'Camera further out and enemies that walk around obstacles.']
  ] },
  { d: '2026-10-07', title: ['Primera versión', 'First version'], new: [
    ['Primera versión pública de PokéSurvivor.', 'First public version of PokéSurvivor.']
  ] }
];
