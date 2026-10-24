/* ============ challenge.js — el desafío semanal ============
 * (24-10-2026, docs/IDEAS-NUEVA-VERSION.md, apartado 10.)
 * Cada semana (de lunes a domingo, hora de España: la semana del ranking,
 * G.Ranking.periodIds().w) todos juegan la misma partida:
 *   - el mismo mapa (semilla de la semana: G.World.reset),
 *   - el mismo Pokémon prestado, sin mejoras ni naturaleza (no hace falta tenerlo),
 *   - una condición de CONDS.
 * Todo lo de la semana sale de su semilla, no de Math.random: es igual para todos.
 * La partida en sí sigue siendo aleatoria (enemigos, cartas...).
 *
 * Sólo en solitario. Tabla propia del ranking (G.Ranking.submitChallenge, "s_c<semana>")
 * con las mismas comprobaciones contra trampas que las demás (firestore.rules).
 * Premio: la primera vez de cada semana que aguantas PRIZE_T segundos, un ticket ×10
 * (save.wch = la semana en que ya lo cogiste).
 */
G.Challenge = (() => {
  const PRIZE_T = 180;
  // Condiciones (las aplican game.js, enemy.js, night.js y este módulo).
  const CONDS = [
    { id: 'rain', name: 'Siempre llueve', desc: 'Llueve toda la partida: el Agua y el Eléctrico se potencian y el Fuego se debilita.', wx: 'rain' },
    { id: 'sun', name: 'Sol abrasador', desc: 'Hace sol toda la partida: el Fuego se potencia y el Agua se debilita.', wx: 'sun' },
    { id: 'noitems', name: 'Sin objetos', desc: 'Los objetos equipables no salen: en su lugar, monedas.' },
    { id: 'fast', name: 'Enemigos veloces', desc: 'Los enemigos van un 30 % más rápido.' },
    { id: 'glass', name: 'Cañón de cristal', desc: 'Tienes la mitad de vida, pero haces un 30 % más de daño.' },
    { id: 'night', name: 'Noche eterna', desc: 'Es de noche toda la partida: se ve menos, salen nocturnos y se gana más.' }
  ];

  let active = null;                       // el desafío de la partida en curso (o null)

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let h = seed;
    return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  /** Los que pueden tocar: no legendarios, con sprite, por número (igual en todos los aparatos). */
  const pool = () => G.DEX.filter(p => !p.leg && p.rarity >= 2 && p.rarity <= 4 && G.SPRITE_META[p.dex]).sort((a, b) => a.dex - b.dex);

  /** El desafío de una semana ("w2026-43"). */
  function of(week) {
    const r = rng(hash('pokekatens-desafio-' + week));
    const list = pool();
    const mon = list[Math.floor(r() * list.length)];
    const cond = CONDS[Math.floor(r() * CONDS.length)];
    return { week, seed: Math.floor(r() * 1e6), dex: mon.dex, cond };
  }
  const current = () => of(G.Ranking.periodIds().w);

  /** Milisegundos hasta el lunes que viene a las 0:00 (hora de España). */
  function endsIn(now = new Date()) {
    const p = {};
    for (const x of new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(now)) p[x.type] = x.value;
    const wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday);
    const into = ((+p.hour * 60 + +p.minute) * 60 + +p.second) * 1000;
    return (7 - wd) * 864e5 - into;
  }

  /** El Pokémon prestado: sus stats base, sin naturaleza ni mejoras. */
  function monFor(c) { return Object.assign({}, G.DEX_BY[c.dex], { nature: 'hardy' }); }

  // ---------------- en la partida ----------------

  const is = id => !!(active && active.cond.id === id);

  /** game.js, al empezar (después de crear tu Pokémon). */
  function begin(c, pl) {
    active = c;
    if (is('glass')) { pl.maxHp = Math.max(1, Math.round(pl.maxHp * 0.5)); pl.hp = pl.maxHp; pl.atkMul *= 1.3; }
    keepWeather();
    G.Spawner.say(G.T('Desafío semanal') + ': ' + G.T(c.cond.name), 3.4, true);
  }
  /** Sin desafío (partida normal o al acabar). */
  function end() { active = null; }

  /** El clima de la condición, siempre (al salir de una grieta se quita: vuelve). */
  function keepWeather() {
    if (!active || !active.cond.wx || G.Rift.inArena || G.Judgment.active) return;
    const w = G.Weather.current;
    if (!w || w.kind !== active.cond.wx) G.Weather.force(active.cond.wx, 3600);
  }
  /** game.js, cada fotograma. */
  function update() { if (active && active.cond.wx) keepWeather(); }

  /** Al acabar: el premio de la semana. → true si se ha dado ahora. */
  function prize(save, time) {
    if (!active || time < PRIZE_T || save.wch === active.week) return false;
    save.wch = active.week;
    save.tickets.t10 = (save.tickets.t10 || 0) + 1;
    return true;
  }

  return {
    CONDS, PRIZE_T, of, current, endsIn, monFor, begin, end, update, prize,
    get active() { return active; },
    /** Condiciones que miran otros módulos. */
    noItems: () => is('noitems'),
    enemySpeed: () => (is('fast') ? 1.3 : 1),
    alwaysNight: () => is('night')
  };
})();
