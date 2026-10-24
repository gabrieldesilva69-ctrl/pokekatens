/* ============ streak.js — rachas: derrotar sin que te den ============
 * (24-10-2026, docs/IDEAS-NUEVA-VERSION.md, apartado 7.)
 * Cada enemigo que cae (los del grupo también) sube tu racha; un golpe que te
 * hace daño la corta (Protección, esquivar o ser intocable no la cortan).
 * Con la racha sube un multiplicador de las monedas que recoges (STEPS): se ve
 * en el HUD (hud.js) y se avisa al subir de escalón y al perderla. La mejor de la
 * partida sale en el resumen y queda en save.stats.bestStreak (logros).
 * En grupo, cada jugador tiene la suya (sólo cuenta el Pokémon de este aparato).
 */
G.Streak = (() => {
  const STEPS = [[50, 1.1], [150, 1.25], [300, 1.5]];
  let n = 0, best = 0, flashT = 0;

  /** Escalón de una racha: índice en STEPS (-1 si aún no llega al primero). */
  const step = k => { let i = -1; STEPS.forEach(([at], j) => { if (k >= at) i = j; }); return i; };
  /** Multiplicador de monedas ahora mismo. */
  const mul = () => { const i = step(n); return i < 0 ? 1 : STEPS[i][1]; };

  function reset() { n = 0; best = 0; flashT = 0; }

  /** Ha caído un enemigo (systems/progress.js). */
  function onKill() {
    const pl = G.Game.player;
    if (!pl || pl.dead) return;
    const was = step(n);
    n++;
    best = Math.max(best, n);
    const now = step(n);
    if (now > was) {
      flashT = 1.6;
      G.Spawner.say(G.I18n.f('¡Racha de {x}! Monedas ×{x}', n, STEPS[now][1].toLocaleString(G.I18n.locale)), 2, true);
      G.Audio.sfx('confirm');
    }
  }

  /** Te han hecho daño (entities/player.js): se corta. */
  function onHurt(pl) {
    if (pl !== G.Game.player || !n) return;
    if (step(n) >= 0) G.FX.dmgText(pl.x, pl.y - pl.bodyH - 18, G.I18n.f('Racha perdida ({x})', n), '#c9a0a8');
    n = 0;
  }

  /** Al acabar la partida: la mejor, a las estadísticas de la cuenta. */
  function save(stats) { stats.bestStreak = Math.max(stats.bestStreak || 0, best); }

  /** Para el HUD: { n, mul, flash 0..1 } o null si no hay racha. */
  function hud(dt) {
    flashT = Math.max(0, flashT - dt);
    return n >= 10 ? { n, mul: mul(), flash: flashT / 1.6, next: (STEPS[step(n) + 1] || [])[0] } : null;
  }

  return { STEPS, mul, reset, onKill, onHurt, save, hud, get count() { return n; }, get best() { return best; } };
})();
