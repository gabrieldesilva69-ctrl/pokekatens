/* ============ mega.js — megaevolución en la partida ============
 * (Idea 4 de docs/IDEAS-RELOADED.md.) Sólo si tu compañero tiene su Megapiedra
 * (save.bag['ms' + dex], data/shop.js) y su mega está en G.MEGAS (data/megas.js,
 * sprites de Pokémon Edición Reloaded en assets/pokemon/<100000 + dex>/).
 *
 *   - La barra se llena derrotando enemigos (los del grupo también): KILLS para
 *     llenarla, un jefe cuenta BOSS.
 *   - Llena: tecla "Megaevolucionar" (F; X en el mando; botón en el móvil) y
 *     megaevoluciona DUR segundos. Después la barra vuelve a cero.
 *   - Cambian el sprite, los stats, los tipos y la habilidad (sólo sus efectos
 *     durante la partida: lo que la habilidad hace "al empezar" no se aplica).
 *     No cambian el tamaño con el que choca, la vida ni los ataques.
 *   - En cooperativo los demás ven tu mega (G.Coop.mega → evento 'mg').
 */
G.Mega = (() => {
  const KILLS = 150, BOSS = 25, DUR = 45;
  const ID = 100000;                     // sprites y grito: 100000 + dex

  const data = dex => (G.MEGAS && G.MEGAS[dex]) || null;
  /** ¿Existe la mega de esa especie en el juego (datos y sprites)? */
  const exists = dex => !!data(dex) && !!G.SPRITE_META[ID + dex];
  /** ¿Puede megaevolucionar? (existe y tienes su Megapiedra) */
  const can = dex => exists(dex) && G.Shop.hasStone(dex);

  function suffix(dex) { const d = data(dex); return d && d.sfx ? ' ' + d.sfx : ''; }
  /** "Mega Charizard X" */
  function name(dex) { return G.I18n.f('Mega {x}', G.DEX_BY[dex].name + suffix(dex)); }
  /** "Megapiedra de Charizard X" */
  function stoneName(dex) { return G.I18n.f('Megapiedra de {x}', G.DEX_BY[dex].name + suffix(dex)); }
  /** Icono de su Megapiedra: del color del primer tipo de la mega. */
  function stoneIcon(dex) { const d = data(dex); return 'stone:' + (d ? d.types[0] : 'normal'); }

  /** Los stats de la mega con la naturaleza de tu Pokémon (la misma proporción). */
  function megaMon(pl) {
    const d = data(pl.dex), mon = pl.mon, base = G.DEX_BY[pl.dex];
    const m = Object.assign({}, mon, { types: d.types.slice() });
    for (const k of ['spd', 'pa', 'sa', 'df', 'sd']) m[k] = d[k] * (base[k] ? mon[k] / base[k] : 1);
    m.atk = Math.max(m.pa, m.sa);
    return m;
  }

  // ---------------- tu Pokémon en la run ----------------

  /** Al empezar la partida: la barra, sólo si puede megaevolucionar. */
  function setup(pl) {
    pl.mega = can(pl.dex) ? { fill: 0, t: 0, times: 0 } : null;
    if (pl.mega) G.Sprites.preload([ID + pl.dex], 8000, pl.shiny);
  }

  const ready = pl => !!(pl && pl.mega && !pl.megaOn && pl.mega.fill >= KILLS);

  /** Un enemigo ha caído (G.Progress.kill): llena la barra. */
  function onKill(e) {
    const pl = G.Game.player;
    if (!pl || !pl.mega || pl.megaOn || pl.dead) return;
    const was = pl.mega.fill;
    pl.mega.fill = Math.min(KILLS, was + (e.boss ? BOSS : 1));
    if (was < KILLS && pl.mega.fill >= KILLS) G.Audio.sfx('confirm');
  }

  /** La tecla: megaevoluciona si la barra está llena. */
  function press(pl) {
    if (!ready(pl) || pl.dead) return false;
    pl.mega.t = DUR; pl.mega.times++;
    apply(pl, true);
    G.Coop.mega(pl, true);
    G.Progress.event('mega', {});
    return true;
  }

  /** Cada fotograma (game.js): cuenta los 45 s y vuelve a la normalidad. */
  function update(pl, dt) {
    if (!pl || !pl.mega || !pl.megaOn) return;
    pl.mega.t -= dt;
    if (pl.mega.t <= 0) {
      pl.mega.t = 0; pl.mega.fill = 0;
      apply(pl, false);
      G.Coop.mega(pl, false);
    }
  }

  // ---------------- el cambio (tu Pokémon o el de otro jugador) ----------------

  function apply(pl, on) {
    if (!!pl.megaOn === on || !exists(pl.dex)) return;
    const dir = pl.anim.dir;
    if (on) {
      pl._noMega = { mon: pl.mon, anim: pl.anim, scale: pl.scale, bodyH: pl.bodyH, baseAtk: pl.baseAtk, baseSpd: pl.baseSpd,
                     abil: pl.abil, abilId: pl.abilId };
      const d = data(pl.dex), gid = ID + pl.dex;
      pl.mon = megaMon(pl);
      pl.baseAtk = pl.mon.atk; pl.baseSpd = pl.mon.spd;
      pl.scale = G.Sprites.playerScale(gid);
      pl.anim = new G.Sprites.Animator(gid, pl.scale, pl.shiny);
      pl.bodyH = G.Sprites.bodyHeight(gid, pl.scale);
      if (d.ab) {
        // Sólo sus efectos durante la partida; la recarga se cambia y se devuelve.
        const ab = G.AbilityFX.of(d.ab, pl.mon), old = pl.abil;
        if (old && old.cdMul) pl.cdMul /= old.cdMul;
        if (ab.cdMul) pl.cdMul *= ab.cdMul;
        pl.abil = Object.assign({}, ab, { start: null }); pl.abilId = d.ab;
      }
      pl.megaOn = true;
      G.FX.ring(pl.x, pl.y - pl.bodyH / 2, 8, 140, '#ff8ad8', 0.8, 6);
      G.FX.ring(pl.x, pl.y - pl.bodyH / 2, 4, 90, '#ffd23f', 0.6, 4);
      if (pl === G.Game.player) {
        G.Game.flash('#ffffff', 0.5);
        G.Camera.kick(0.6);
        G.Spawner.say(G.I18n.f('¡{x} ha megaevolucionado!', G.DEX_BY[pl.dex].name) + ' → ' + name(pl.dex), 2.6, true);
      }
      G.Audio.cry(pl.dex, { shiny: pl.shiny, mega: true });
    } else {
      const o = pl._noMega;
      if (pl.abil !== o.abil) {
        if (pl.abil && pl.abil.cdMul) pl.cdMul /= pl.abil.cdMul;
        if (o.abil && o.abil.cdMul) pl.cdMul *= o.abil.cdMul;
      }
      Object.assign(pl, { mon: o.mon, anim: o.anim, scale: o.scale, bodyH: o.bodyH, baseAtk: o.baseAtk, baseSpd: o.baseSpd,
                          abil: o.abil, abilId: o.abilId });
      pl._noMega = null; pl.megaOn = false;
      if (pl.dead) pl.anim.play('Faint', { hold: true });
      G.FX.ring(pl.x, pl.y - pl.bodyH / 2, 6, 70, '#c9d6ff', 0.5, 3);
    }
    pl.anim.dir = dir;
  }

  /** Para el HUD: 0..1 de la barra (o lo que queda de la mega) y si está lista. */
  function bar(pl) {
    if (!pl || !pl.mega) return null;
    return pl.megaOn ? { k: pl.mega.t / DUR, on: true, ready: false }
      : { k: pl.mega.fill / KILLS, on: false, ready: pl.mega.fill >= KILLS };
  }

  return { KILLS, BOSS, DUR, ID, data, exists, can, name, stoneName, stoneIcon, setup, ready, onKill, press, update, apply, bar };
})();
