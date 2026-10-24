/* ============ night.js — la noche en la partida ============
 * (24-10-2026, docs/IDEAS-NUEVA-VERSION.md, apartado 8.)
 * Desde el minuto 7, cada 10 minutos hay una noche de 3 (con 20 s de
 * anochecer y de amanecer). Sale del reloj de la partida, que en grupo es el
 * mismo para todos: no hace falta mandar nada por la red.
 *
 *   - Se ve menos: la pantalla se oscurece y queda un círculo de luz alrededor
 *     de tu Pokémon (un degradado encima de todo, barato). Encima van el HUD, la
 *     flecha del shiny y los avisos. Ajustes → "Noches oscuras" (sin él, sólo un
 *     tinte suave).
 *   - Salen más Pokémon nocturnos (Fantasma, Siniestro y los de NIGHT_DEX) del
 *     tramo de ahora (spawner.js, G.Enemies.nightDefs): la mitad de las veces.
 *   - Se gana más: BONUS a las monedas y a la experiencia que recoges.
 */
G.Night = (() => {
  const FROM = 420, EVERY = 600, LONG = 180, FADE = 20, BONUS = 1.25, SHARE = 0.5;
  let was = false;

  /** 0..1: cuánto es de noche en el segundo t de la partida. */
  function level(t) {
    if (t < FROM || G.Rift.inArena || G.Judgment.active) return 0;
    const k = (t - FROM) % EVERY;
    if (k >= LONG) return 0;
    return Math.min(1, k / FADE, (LONG - k) / FADE);
  }
  const now = () => level(G.Game.st.time || 0);
  const isNight = () => now() > 0.5;
  /** Multiplicador de monedas y experiencia que recoges. */
  const bonus = () => (isNight() ? BONUS : 1);
  /** ¿Este enemigo nuevo debe ser nocturno? (spawner.js) */
  const nightSpawn = () => isNight() && Math.random() < SHARE;

  /** Avisos al anochecer y al amanecer (game.js, cada fotograma). */
  function update() {
    const n = isNight();
    if (n === was) return;
    was = n;
    G.Spawner.say(G.T(n ? 'Anochece: salen Pokémon nocturnos y se gana más' : 'Amanece'), 3, n);
    if (n) G.Audio.sfx('biome');
  }
  function reset() { was = false; }

  /** La oscuridad, en pantalla (después del mundo y del clima, antes del HUD). */
  function draw(ctx, w, h, pl) {
    const k = now();
    if (k <= 0 || !pl) return;
    const dark = G.Settings.get('darkNight') !== false;
    const cam = G.Camera, s = cam.scale;
    const x = (pl.x - cam.left()) * s, y = (pl.y - pl.bodyH * 0.5 - cam.top()) * s;
    if (!dark) {
      ctx.fillStyle = `rgba(20,30,70,${0.22 * k})`;
      ctx.fillRect(0, 0, w, h);
      return;
    }
    const r = Math.min(w, h);
    const g = ctx.createRadialGradient(x, y, r * 0.16, x, y, r * 0.62);
    g.addColorStop(0, 'rgba(8,12,34,0)');
    g.addColorStop(1, `rgba(8,12,34,${0.72 * k})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  return { FROM, EVERY, LONG, BONUS, level, isNight, bonus, nightSpawn, update, reset, draw };
})();
