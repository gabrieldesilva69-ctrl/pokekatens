/* ============ pagina.js — la página de la demo de ataques «+» ============
 * Reparte los ataques de G.Moves.EVO por familia (kind) y tipo y los pone en el banco
 * de pruebas (banco.js). Parámetros de la dirección:
 *   ?familia=projectile  &tipo=fire  &calidad=0|1|2  &cols=2
 *   ?familia=pulidos   los ataques normales pulidos · ?familia=pokemon&captura=1   la sección de los Pokémon
 *   &captura=1   una imagen fija (para tools/capturas-demo.cjs): sin cabecera, y cada
 *                escenario retratado un momento después de lanzar (&fase= segundos, si se quiere otro)
 */
(() => {
  const FAMILIA = {
    projectile: 'Proyectil', melee: 'Golpe', nova: 'Ráfaga radial', homing: 'Teledirigido', aura: 'Aura', bounce: 'Rebote',
    dash: 'Embestida', cone: 'Abanico', beam: 'Rayo', spin: 'Giro', stun: 'Aturdir', orbit: 'Órbita', shove: 'Empujón',
    punch: 'Puños', boomerang: 'Bumerán', mine: 'Minas', meteor: 'Meteoros', vortex: 'Remolino', chain: 'Cadena',
    trail: 'Rastro', turret: 'Torreta', charge: 'Carga', quake: 'Onda de suelo', tremor: 'Temblor', wave: 'Ola',
    cross: 'Cruz', storm: 'Tormenta', scissor: 'Tijera', blitz: 'Saltos', leap: 'Salto', boom: 'Explosión'
  };
  const TIPO = {
    normal: 'Normal', fire: 'Fuego', water: 'Agua', grass: 'Planta', electric: 'Eléctrico', ice: 'Hielo', fighting: 'Lucha',
    poison: 'Veneno', ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma',
    dragon: 'Dragón', dark: 'Siniestro', steel: 'Acero', fairy: 'Hada'
  };
  const q = new URLSearchParams(location.search);
  const captura = q.get('captura') === '1';
  const $ = id => document.getElementById(id);

  // Todos los ataques que evolucionan, por familia (las de más ataques, primero).
  const todos = Object.keys(G.Moves.EVO).map(id => ({ id, def: G.Moves.BY_ID[id] })).filter(a => a.def);
  const fams = {};
  for (const a of todos) (fams[a.def.kind] = fams[a.def.kind] || []).push(a);
  const orden = Object.keys(fams).sort((a, b) => fams[b].length - fams[a].length);
  const hecha = k => fams[k].every(a => G.VFXPlus.of(a.id));
  // Los ataques normales que se han pulido (vista aparte: ?familia=pulidos).
  const PULIDOS = ['thunder', 'surf', 'whirlpool', 'hyper-voice'];
  fams.pulidos = todos.filter(a => PULIDOS.includes(a.id));
  FAMILIA.pulidos = 'Ataques normales pulidos';

  let familia = fams[q.get('familia')] ? q.get('familia') : orden[0];
  let tipo = TIPO[q.get('tipo')] ? q.get('tipo') : '';
  Banco.calidad(q.has('calidad') ? Math.max(0, Math.min(2, +q.get('calidad') | 0)) : 2);

  const lista = () => (familia === '*' ? todos : fams[familia])
    .filter(a => !tipo || a.def.type === tipo)
    .map(a => ({ id: a.id, nombre: a.def.name, sub: TIPO[a.def.type] + (familia === '*' ? ' · ' + FAMILIA[a.def.kind] : '') }));

  const cols = () => +q.get('cols') || (captura ? 2 : Math.max(1, Math.floor((document.body.clientWidth - 32) / ((Banco.CW * 2 + 18) * 2))));
  const banco = Banco.crear($('lienzo'), lista(), { cols: cols(), zoom: +q.get('zoom') || 2 });

  function titulo() {
    const n = lista().length;
    $('titulo').textContent = (familia === '*' ? 'Todas las familias' : FAMILIA[familia] + ' (' + familia + ')') +
      (tipo ? ' · ' + TIPO[tipo] : '') + ' — ' + n + (n === 1 ? ' ataque' : ' ataques');
    $('nota').textContent = familia !== '*' && !hecha(familia)
      ? 'Esta familia aún no tiene rediseño propio: a la derecha sólo se ve el envoltorio común de los «+».'
      : 'Cada «+» con su silueta, su rastro de fotogramas, su estela y su impacto. Arriba se cambia la calidad: en baja queda la silueta con su borde.';
  }

  const pk = DemoPokemon.crear($('lienzo-pk'));
  if (captura && q.get('familia') === 'pokemon') {
    document.body.classList.add('captura', 'solo-pk');
    pk.foto();
    document.body.dataset.w = $('lienzo-pk').width + 24;
    document.body.dataset.h = $('lienzo-pk').height + 24 + 90;
    return;
  }
  if (captura) {
    document.body.classList.add('captura');
    // Reloj de mentira: el juego mide algunos efectos con performance.now(); aquí avanza con la simulación.
    let sim = 0;
    const t0 = performance.now();
    performance.now = () => t0 + sim * 1000;
    banco.foto(+q.get('fase') || 0, 1.2, 9, dt => { sim += dt; });
    titulo();
    const c = $('lienzo');
    document.body.dataset.w = c.width + 24;
    document.body.dataset.h = c.height + 24 + 70;
    return;
  }

  function boton(caja, texto, valor, actual, alPulsar, clase) {
    const b = document.createElement('button');
    b.textContent = texto;
    b.className = (valor === actual() ? 'on ' : '') + (clase || '');
    b.onclick = () => { alPulsar(valor); pintaBotones(); banco.rehacer(lista()); titulo(); };
    caja.appendChild(b);
  }
  function pintaBotones() {
    for (const id of ['familias', 'tipos', 'calidades']) { const c = $(id); while (c.children.length > 1) c.removeChild(c.lastChild); }
    for (const k of orden) boton($('familias'), FAMILIA[k] + ' ' + fams[k].length, k, () => familia, v => { familia = v; }, hecha(k) ? 'hecho' : '');
    boton($('tipos'), 'Todos', '', () => tipo, v => { tipo = v; });
    for (const t of Object.keys(TIPO)) boton($('tipos'), TIPO[t], t, () => tipo, v => { tipo = v; familia = fams[familia] && fams[familia].some(a => a.def.type === v) ? familia : '*'; });
    ['Baja', 'Media', 'Alta'].forEach((n, i) => boton($('calidades'), n, i, () => Banco.nivel, v => Banco.calidad(v)));
  }
  pintaBotones();
  titulo();
  banco.correr();
  pk.correr();
  $('ver-pulidos').onclick = () => { familia = 'pulidos'; tipo = ''; pintaBotones(); banco.rehacer(lista()); titulo(); scrollTo(0, 0); };
})();
