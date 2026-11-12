// Genera docs/ATAQUES-PLUS.md: inventario de G.Moves.EVO por forma y tipo, con la idea de cada «+».
const fs = require('fs'), vm = require('vm');
const any = () => new Proxy(function () {}, { get: (o, k) => (k === Symbol.toPrimitive ? () => '' : any()), set: () => true, apply: () => any() });
const G = { U: { hash: () => 0.5, rand: (a, b) => a }, Sprites: { PX: 2 }, Settings: { fx: 2 } };
const ctx = vm.createContext({ G, document: { createElement: () => any() }, Math, performance: { now: () => 0 } });
for (const f of ['js/entities/vfx.js', 'js/entities/fx.js', 'js/entities/vfx-plus.js', 'js/data/moves.js']) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx);

const TIPO = { normal: 'Normal', fire: 'Fuego', water: 'Agua', grass: 'Planta', electric: 'Eléctrico', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro', steel: 'Acero', fairy: 'Hada' };
const FAM = {
  projectile: ['Proyectil', 'borde de luz en el proyectil, chispas claras detrás y destello al lanzar'],
  melee: ['Golpe', 'filo de luz y eco por dentro del tajo, chispas en el filo y borde en el sprite del golpe'],
  nova: ['Ráfaga radial', 'borde de luz en cada proyectil, chispas y aro doble al lanzar'],
  homing: ['Teledirigido', 'borde de luz, chispas detrás y destello al lanzar'],
  aura: ['Aura', 'aro doble y borde de luz en las partículas del aura'],
  bounce: ['Rebote', 'borde de luz, chispas detrás y destello al lanzar'],
  dash: ['Embestida', 'borde de luz en las copias de la estela y filo en el golpe final'],
  cone: ['Abanico', 'borde de luz en cada disparo y chispas'],
  beam: ['Rayo', 'filo de luz a trazos por fuera del rayo y borde en lo que viaja por él'],
  spin: ['Giro', 'filo de luz y eco en cada tajo de la vuelta'],
  stun: ['Aturdir', 'borde de puntos en la zona y aro doble al estallar'],
  orbit: ['Órbita', 'borde de luz en los orbes y chispas que dejan atrás'],
  shove: ['Empujón', 'aro doble y borde de luz en lo que sale despedido'],
  punch: ['Puños', 'filo de luz y eco en cada directo'],
  boomerang: ['Bumerán', 'borde de luz y chispas a la ida y a la vuelta'],
  mine: ['Minas', 'borde de luz en la mina y aro doble al estallar'],
  meteor: ['Meteoros', 'borde de luz en lo que cae, borde de puntos en la sombra y aro doble'],
  vortex: ['Remolino', 'borde de puntos alrededor y borde de luz en lo que gira'],
  chain: ['Cadena', 'filo de luz en cada salto'],
  trail: ['Rastro', 'borde de puntos en cada charco'],
  turret: ['Torreta', 'borde de luz en la torreta y en sus disparos'],
  charge: ['Carga', 'aro doble al cargar y filo a trazos en el rayo'],
  quake: ['Onda de suelo', 'aro doble en cada explosión'],
  tremor: ['Temblor', 'borde de puntos delante del anillo'],
  wave: ['Ola', 'filo de luz delante de la ola'],
  cross: ['Cruz', 'filo de luz en la cruz del aviso y aro doble'],
  storm: ['Tormenta', 'rayo más grueso por fuera y borde de puntos en el aviso'],
  scissor: ['Tijera', 'filo de luz y eco en los dos tajos'],
  blitz: ['Saltos', 'borde de luz en la estela y filo en cada golpe'],
  leap: ['Salto', 'borde de puntos donde cae y aro doble'],
  boom: ['Explosión', 'aro doble de fuego']
};
// La idea de cada uno (una línea). Las de la primera familia ya están hechas (vfx-plus.js).
const IDEA = {
  // projectile
  'ember': 'Llama de dos lenguas con el centro al blanco; brasas que suben; al golpear, llamarada de cuatro lenguas.',
  'water-gun': 'Gota más llena con sombra y gotitas detrás; gotas que caen; al golpear, corona de agua.',
  'thunder-shock': 'Rayo que se bifurca; chispas en zigzag; al golpear, chispazo en cruz y luego en aspa.',
  'confusion': 'Espiral de dos brazos; aritos que se quedan atrás; al golpear, dos ondas rosas.',
  'sludge': 'Pegote que burbujea y chorrea; gotas espesas que caen; al golpear, se aplasta contra el suelo y humea.',
  'poison-sting': 'Aguijón con dos pares de púas; surco fino morado; al golpear, cruz de pinchazo y humo.',
  'rock-throw': 'Roca agrietada con dos esquirlas; piedrecitas y polvo; al golpear, se parte en esquirlas.',
  'aura-sphere': 'Esfera con un aro de aura que le da vueltas; llamitas azules; al golpear, pulso y cruz de luz.',
  'shadow-ball': 'Centro encendido y jirones largos que giran; humo morado a bloques; al golpear, revienta en seis jirones.',
  'dragon-pulse': 'El anillo lleva delante un colmillo y apunta; escamas que se desprenden; al golpear, rugido en punta de flecha.',
  'sludge-bomb': 'Burbuja con el lodo dentro y burbujas pegadas; burbujitas que suben; al golpear, estalla en burbujas.',
  'scald': 'Nube de vapor con el agua hirviendo dentro; vapor que sube; al golpear, nube de vapor y gotas.',
  'hurricane': 'Cuatro arcos de viento más cerrados; rayas de viento; al golpear, remolinos que suben.',
  'water-pulse': 'Aro a trazos, aro lleno y gota en el centro; aritos y gotas; al golpear, onda y corona.',
  'stone-edge': 'Hoja de piedra con arista y la cola partida; polvo y chispas del filo; al golpear, púas que salen del suelo.',
  // melee
  'tackle': 'El impacto con ocho puntas y un aro de polvo que se abre a ras de suelo.',
  'body-slam': 'Impacto doble (uno grande y otro dentro) y grietas cortas en el suelo.',
  'vine-whip': 'El látigo se ve: una liana a tramos por el arco, con hojas que giran al soltarse.',
  'wing-attack': 'Dos tajos de ala paralelos y plumas que caen meciéndose.',
  'bug-bite': 'Mandíbulas más grandes que muerden dos veces y trocitos verdes que saltan.',
  'karate-chop': 'Tajo recto con filo blanco y una grieta que corre por delante.',
  'lick': 'Lengua que barre (arco rosa-morado) y gotas de baba morada.',
  'metal-claw': 'Cuatro garras en vez de tres, con brillo que recorre el filo y chispas de metal.',
  'bite': 'Colmillos de arriba y de abajo que se cierran, con destello oscuro al chocar.',
  'dragon-claw': 'Garras con llama de dragón en la punta y escamas que saltan.',
  'play-rough': 'Nube de pelea con estrellas y corazones que salen despedidos.',
  'crunch': 'Mandíbula entera que se cierra y fragmentos oscuros en aspa.',
  // nova
  'hyper-voice': 'Ondas de sonido dobles con una nota entre ellas; al lanzar, tres aros que laten.',
  'heat-wave': 'Arcos de calor con brasas dentro y el aire que tiembla (rayas que suben).',
  'bubble': 'Burbujas de dos tamaños con brillo; al tocar, estallan en gotitas.',
  'psychic': 'Ojo con pestañas de luz y pupila que late; aritos detrás.',
  'mud-shot': 'Pegotes de barro con piedrecitas; salpican barro al caer.',
  'fairy-wind': 'Estrellas de seis puntas con cola de polvo de hada.',
  'dark-pulse': 'Anillos dobles con el centro negro y humo oscuro que se queda.',
  'lava-plume': 'Goterones de lava con costra oscura; brasas y un charco que se apaga.',
  // homing
  'energy-ball': 'Bola con hojas girando alrededor; hojitas detrás; al golpear, estalla en hojas.',
  'mist-ball': 'Nube con una perla dentro; niebla que se queda; al golpear, anillo de niebla.',
  'air-slash': 'Media luna doble con filo blanco; rayas de viento; al golpear, corte en aspa.',
  'ice-shard': 'Cristal con facetas y punta doble; escarcha que cae; al golpear, se rompe en cristales.',
  'shadow-sneak': 'Garra de sombra con ojos; sombra pegada al suelo; al golpear, zarpazo.',
  'draining-kiss': 'Corazón con brillo y alitas; corazoncitos que suben; al golpear, corazón que late.',
  'sucker-punch': 'Puño con estela oscura; humo negro; al golpear, estrella de golpe.',
  'moonblast': 'Bola con una media luna dentro; polvo de luna; al golpear, luna que se abre.',
  // aura
  'giga-drain': 'Hilos verdes que van de cada enemigo hacia ti, con hojas y corazones por el camino.',
  'discharge': 'Rayos cortos en zigzag que saltan entre puntos del borde.',
  'bulldoze': 'Grietas que salen de ti y piedras que saltan del suelo.',
  'bug-buzz': 'Ondas de sonido verdes en dos aros desfasados y notas que vibran.',
  'powder-snow': 'Copos de dos tamaños que giran y una capa de escarcha en el borde.',
  'dazzling-gleam': 'Destellos en cruz que se encienden por turnos y polvo de hada.',
  'night-shade': 'Sombras que suben del suelo en columnas y un aro oscuro.',
  // bounce
  'seed-bomb': 'Semilla con brote; al rebotar suelta hojas y cáscara.',
  'electro-ball': 'Bola con dos arcos eléctricos que la rodean; chispa en zigzag en cada rebote.',
  'acid-spray': 'Gota con burbujas; al rebotar deja una salpicadura que humea.',
  'signal-beam': 'Estrella de dos colores que parpadea; destello doble en cada rebote.',
  'power-gem': 'Gema tallada con brillo que la recorre; al rebotar, esquirlas de luz.',
  'mirror-shot': 'Espejo con reflejo que cruza; al rebotar, trozos de espejo.',
  'psyshock': 'Cristal morado con núcleo; aritos morados; al rebotar, onda cuadrada.',
  // dash
  'quick-attack': 'Estela de rayas de velocidad y polvo en el arranque.',
  'aerial-ace': 'Estela doble en V y plumas en el golpe final.',
  'flame-charge': 'Camino de llamas que se queda un momento en el suelo.',
  'u-turn': 'Estela verde que se curva y un destello al dar la vuelta.',
  'megahorn': 'Cuerno grande delante, con rayas de embestida y trozos que saltan.',
  // cone
  'flamethrower': 'Llamas de tres tamaños, las del centro al blanco, y humo al final del chorro.',
  'bubble-beam': 'Burbujas en fila con brillo y gotitas al estallar.',
  'dragon-breath': 'Llamas moradas con chispas eléctricas dentro.',
  'blizzard': 'Copos grandes y pequeños con rayas de viento helado.',
  'silver-wind': 'Arcos plateados con escamas brillantes que giran.',
  // beam
  'hydro-pump': 'Chorro con remolino por dentro, gotas a los lados y corona de agua al final.',
  'psybeam': 'Dos ondas trenzadas en rosa y morado, con aritos.',
  'ice-beam': 'Rayo con cristales que crecen en los bordes y escarcha al final.',
  'dragon-rage': 'Rayo de llama de dragón con cabeza de fuego en la punta.',
  'flash-cannon': 'Rayo de acero con anillos de luz que lo recorren y destello al final.',
  // spin
  'rapid-spin': 'Aros de velocidad y estrellas que salen despedidas.',
  'rolling-kick': 'Tajo ancho con rayas de patada y polvo.',
  'outrage': 'Garras con llama de dragón en cada vuelta y escamas.',
  'gyro-ball': 'Aro metálico con dientes que gira y chispas.',
  'night-slash': 'Tajos oscuros con filo morado y sombra que se queda.',
  // stun
  'thunder-wave': 'Anillos eléctricos que se cierran y rayos pequeños dentro.',
  'rock-tomb': 'Rocas que caen en círculo y polvo.',
  'freeze-dry': 'Escarcha que crece desde el borde y cristales al estallar.',
  'dynamic-punch': 'Puño grande que cae, estrellas de aturdido y grietas.',
  'waterfall': 'Columna de agua que cae con espuma abajo.',
  // orbit
  'fire-spin': 'Bolas de fuego con cola de llama que se curva.',
  'leaf-storm': 'Espirales de hojas con hojas sueltas detrás.',
  'gust': 'Plumas dobles con rayas de viento.',
  'ancient-power': 'Piedras con runas que brillan por turnos.',
  // shove
  'extrasensory': 'Ojos que se abren hacia fuera y un aro morado doble.',
  'whirlwind': 'Espirales de viento con hojas arrastradas.',
  'vacuum-wave': 'Aros de vacío azules con rayas hacia dentro.',
  'disarming-voice': 'Notas y corazones en ondas rosas.',
  // punch
  'fire-punch': 'Puño envuelto en llama, brasas en cada directo y llamarada en el último.',
  'ice-punch': 'Puño con cristales, escarcha y estallido de hielo en el último.',
  'thunder-punch': 'Puño con arcos eléctricos y chispazo en el último.',
  'drain-punch': 'Puño con aura roja y orbes de energía que vuelven a ti.',
  // boomerang
  'razor-leaf': 'Hoja doble con nervio brillante; hojitas detrás; destello al dar la vuelta.',
  'bonemerang': 'Hueso entero (no media luna) que gira, con polvo.',
  'psycho-cut': 'Media luna morada doble con aritos detrás.',
  // mine
  'string-shot': 'Telaraña con hilos más largos que tiemblan; al estallar, hilos que atan.',
  'spikes': 'Púas de metal con brillo; al estallar, púas que saltan.',
  'toxic-spikes': 'Púas moradas que gotean; al estallar, charco y humo.',
  // meteor
  'rock-slide': 'Rocas con cola de polvo; al caer, piedras que ruedan.',
  'hail': 'Granizo con facetas y cola de escarcha; al caer, cristales.',
  'meteor-mash': 'Meteoro de acero con cola de fuego; al caer, estrella de impacto.',
  // vortex
  'whirlpool': 'Remolino con brazos de espuma en espiral y gotas que saltan.',
  'sand-tomb': 'Remolino de arena con granos y piedrecitas.',
  'ominous-wind': 'Remolino morado con caras de humo.',
  // chain
  'thunderbolt': 'Rayo con ramas cortas y un chispazo en cada enemigo que toca.',
  'hex': 'Cadena de sombras con ojos y humo morado en cada salto.',
  // trail
  'toxic': 'Charco con burbujas que revientan y humo morado.',
  'flame-wheel': 'Charco de fuego con llamas que bailan y brasas.',
  // turret
  'will-o-wisp': 'Llama azulada con cara y brasas alrededor.',
  'substitute': 'Muñeco con estrellas girando alrededor.',
  // charge
  'hyper-beam': 'Al cargar, estrellas que entran; rayo con anillos y núcleo blanco.',
  'solar-beam': 'Al cargar, hojas y luz que entran; rayo con hojas dentro.',
  // sueltos
  'magnitude': 'Cada onda con grietas y piedras que saltan, cada vez más grandes.',
  'earthquake': 'Anillo con grietas radiales y bloques de tierra que se levantan.',
  'surf': 'Ola con cresta de espuma en dos filas y gotas que saltan por delante.',
  'fire-blast': 'La cruz con forma de kanji de fuego: cinco brazos con llamas en la punta.',
  'thunder': 'Rayo con ramas y un cráter de chispas donde cae.',
  'x-scissor': 'Los dos tajos dejan una X que se queda un momento y trocitos verdes.',
  'extreme-speed': 'Imágenes del Pokémon en cada salto y rayas de velocidad.',
  'acrobatics': 'Estela en arco del salto, plumas y onda doble al caer.',
  'explosion': 'Bola de fuego a capas, humo que sube y cascotes.'
};

const M = G.Moves, by = {};
for (const id of Object.keys(M.EVO)) { const d = M.BY_ID[id]; (by[d.kind] = by[d.kind] || []).push({ id, d }); }
const orden = Object.keys(by).sort((a, b) => by[b].length - by[a].length);
const total = Object.keys(M.EVO).length, hechos = Object.keys(M.EVO).filter(id => G.VFXPlus.of(id)).length;
let out = `# Ataques evolucionados («… +»): inventario y rediseño

Los ${total} ataques de \`EVO\` (\`js/data/moves.js\`), por forma (\`kind\`) y por tipo. Todos llevan ya el
envoltorio común de los «+» (commit b0af20c3: borde de luz, destello al lanzar, chispas, aro doble). Aquí está
lo que cada uno tiene de propio encima de eso: su silueta, su estela y su impacto (\`js/entities/vfx-plus.js\`).
Sólo se ve: daño, radios, alcance, recargas y hitboxes no cambian.

Demo: \`node tools/serve.cjs\` → http://127.0.0.1:8123/demo/ataques-plus.html · capturas: \`node tools/capturas-demo.cjs\`
(\`demo/capturas/<familia>.png\`). Este archivo lo escribe \`tools/inventario-plus.cjs\` (las ideas están en él).

Hechos: **${hechos} de ${total}**.

## Reglas de estilo

- Pixel art: formas en la rejilla de \`G.VFX\` (letras \`o d m l w\`), paleta del tipo, bordes duros, por fotogramas.
- Nada de \`shadowBlur\`, \`filter\`, degradados ni antialias.
- El «+» conserva el tamaño de píxel de su ataque normal: crece por su silueta (2 píxeles de arte más), no inflando los píxeles.
- Rastro de fotogramas: dos siluetas planas detrás (clara, y media tramada). Sin transparencias.
- Partículas con los topes de \`G.FX\` (\`G.FX.spare\`: nunca pasan del 85 % del tope). Impacto: como mucho uno cada 90 ms por proyectil.
- Calidad media: un eco y la mitad de partículas. Calidad baja: sólo la silueta con su borde.

`;
for (const k of orden) {
  out += `## ${FAM[k][0]} (\`${k}\`) — ${by[k].length}\n\nAhora (envoltorio común): ${FAM[k][1]}.\n\n| Ataque | Tipo | Aspecto normal | Rediseño del «+» | Hecho |\n|---|---|---|---|---|\n`;
  for (const { id, d } of by[k].sort((a, b) => a.d.type.localeCompare(b.d.type))) {
    const v = G.VFX.forMove({ id, type: d.type });
    const look = [v.melee ? 'golpe ' + v.melee : v.beam ? 'rayo ' + v.beam : v.aura ? 'aura ' + v.aura : v.proj, v.pal !== d.type ? 'paleta ' + v.pal : '', v.trail ? 'estela ' + v.trail : ''].filter(Boolean).join(', ');
    if (!IDEA[id]) throw new Error('sin idea: ' + id);
    out += `| ${d.name} (\`${id}\`) | ${TIPO[d.type]} | ${look} | ${IDEA[id]} | ${G.VFXPlus.of(id) ? 'sí' : '—'} |\n`;
  }
  out += '\n';
}
fs.writeFileSync('docs/ATAQUES-PLUS.md', out);
console.log(total, hechos, Object.keys(IDEA).length);
