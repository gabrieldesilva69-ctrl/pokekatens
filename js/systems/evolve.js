/* ============ evolve.js — tu compañero evoluciona en la partida ============
 * (24-10-2026, docs/IDEAS-NUEVA-VERSION.md, apartado 5.)
 * A qué evoluciona cada uno: G.EVOS (data/evolutions.js, tools/fetch_evolutions.py).
 *
 *   - Al subir de nivel en la run, desde el nivel LVL × (fase + 1) (fase 0 el
 *     Pokémon base: Charmander al 12, Charmeleon al 24), sale una carta dorada para
 *     evolucionar; si tiene varias evoluciones (Eevee...), una carta por cada una
 *     (como mucho 3, al azar). Si no la coges, vuelve a salir al siguiente nivel.
 *   - Cambian el sprite, los tipos y los stats (con la naturaleza del que empezó la
 *     run). Se quedan los ataques, el objeto, las mejoras y la habilidad; la vida,
 *     en la misma proporción. Sigue siendo shiny si lo era.
 *   - Sólo en la run: tu colección no cambia (decidido por los dueños). La mega o
 *     la forma primigenia que valga es la de la forma actual (su Megapiedra/Orbe).
 *   - No mientras está megaevolucionado. En grupo los demás lo ven (G.Coop.evolve).
 */
G.Evolve = (() => {
  const LVL = 12;
  let prevOf = null;                   // dex -> de quién evoluciona

  const next = dex => ((G.EVOS && G.EVOS[dex]) || []).filter(d => G.DEX_BY[d] && G.SPRITE_META[d]);
  function stage(dex) {
    if (!prevOf) {
      prevOf = {};
      for (const [a, l] of Object.entries(G.EVOS || {})) for (const b of l) prevOf[b] = +a;
    }
    let n = 0;
    for (let d = dex; prevOf[d] && n < 4; d = prevOf[d]) n++;
    return n;
  }
  /** Nivel de la run desde el que puede evolucionar ese Pokémon. */
  const levelFor = dex => LVL * (stage(dex) + 1);

  /** Cartas de evolución para levelup.js (vacío si no toca). */
  function cards(pl) {
    if (!pl || pl.megaOn || pl.level < levelFor(pl.dex)) return [];
    const opts = G.U.pickN(next(pl.dex), 3);
    return opts.map(to => ({
      w: 50, type: 'pevo', key: 'pevo:' + to,
      icon: 'type:' + G.DEX_BY[to].types[0], color: '#ffd23f', tag: 'EVOLUCIÓN',
      title: G.I18n.f('{x} evoluciona', G.DEX_BY[pl.dex].name) + ' → ' + G.DEX_BY[to].name,
      desc: G.T('Cambian su aspecto, sus tipos y sus stats; se quedan sus ataques, su objeto y sus mejoras. Sólo en esta partida.'),
      apply: p => evolve(p, to)
    }));
  }

  /** Tu Pokémon evoluciona (y se lo dice a los demás). */
  function evolve(pl, to) {
    if (!apply(pl, to)) return;
    if (pl === G.Game.player) {
      G.Game.flash('#ffffff', 0.6);
      G.Camera.kick(0.5);
      G.Spawner.say(G.I18n.f('¡{x} ha evolucionado!', G.DEX_BY[pl.evolvedFrom].name) + ' → ' + G.DEX_BY[to].name, 2.8, true);
      G.Audio.sfx('legend');
      G.Progress.event('pevolve', { from: pl.evolvedFrom, to });
    }
    G.Coop.evolve(pl, to);
  }

  /** El cambio (tu Pokémon o el de otro jugador en grupo). → true si ha evolucionado. */
  function apply(pl, to) {
    const from = pl.dex;
    if (!G.DEX_BY[to] || !G.SPRITE_META[to] || from === to || pl.megaOn) return false;
    const dir = pl.anim.dir, ratio = pl.maxHp > 0 ? pl.hp / pl.maxHp : 1;
    // Los stats del nuevo con la naturaleza del que empezó la run.
    const base = G.DEX_BY[to], nat = G.NATURES && G.NATURES.find(n => n.id === pl.mon.nature);
    const mon = Object.assign({}, base);
    if (nat && nat.up) mon[nat.up] = base[nat.up] * 1.1;
    if (nat && nat.down) mon[nat.down] = base[nat.down] * 0.9;
    mon.atk = Math.max(mon.pa, mon.sa);
    mon.nature = pl.mon.nature;
    pl.maxHp += mon.hp - pl.mon.hp;
    pl.hp = Math.max(1, Math.round(pl.maxHp * ratio));
    pl.mon = mon; pl.dex = to;
    pl.baseAtk = mon.atk; pl.baseSpd = mon.spd;
    pl.shiny = pl.shiny && G.Sprites.hasShiny(to);
    pl.scale = G.Sprites.playerScale(to);
    pl.anim = new G.Sprites.Animator(to, pl.scale, pl.shiny);
    pl.anim.dir = dir;
    pl.r = G.Sprites.playerRadius(to);
    pl.bodyH = G.Sprites.bodyHeight(to, pl.scale);
    pl.evolvedFrom = from;
    pl.evolutions = (pl.evolutions || 0) + 1;
    // Su mega es la de la forma de ahora (si tienes su Megapiedra u Orbe).
    if (pl === G.Game.player) {
      pl.mega = G.Mega.can(to) ? (pl.mega || { fill: 0, t: 0, times: 0 }) : null;
      if (pl.mega) G.Sprites.preload([G.Mega.ID + to], 8000, pl.shiny);
    }
    G.Sprites.preload([to], 8000, pl.shiny);
    G.FX.ring(pl.x, pl.y - pl.bodyH / 2, 8, 150, '#ffffff', 0.9, 6);
    G.FX.burst(pl.x, pl.y - pl.bodyH / 2, '#fff4d6', 36, 220);
    G.Audio.cry(to, { shiny: pl.shiny });
    return true;
  }

  return { LVL, next, stage, levelFor, cards, evolve, apply };
})();
