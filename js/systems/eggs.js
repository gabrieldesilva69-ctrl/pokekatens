/* ============ eggs.js — huevos que se abren jugando ============
 * (Idea 6 de docs/IDEAS-RELOADED.md.) Lógica pura: la Incubadora está en
 * ui/shop-ui.js (Mochila) y la eclosión en ui/egg-ui.js.
 *
 *   De dónde salen: misiones semanales (reward.egg), el gacha (cada 10 tiradas
 *   ×10 en un mismo banner) y, a veces, un legendario de grieta.
 *   Qué Pokémon: se sortea AL CONSEGUIRLO, como el gacha (sin legendarios ni
 *   pity), de su región; shiny 1 de cada 32. El huevo es el de su familia
 *   (G.EGG_BASE, data/eggs.js: huevos de Pokémon Edición Reloaded, de F3R).
 *   Se abren derrotando enemigos (también los del grupo): NEED según su rareza.
 *   SLOTS incuban a la vez; hasta WAIT esperan; si no caben, OVERFLOW monedas.
 *
 * Guardado: save.eggs = [{ id, dex, shiny, need, done, from }] (los SLOTS
 * primeros incuban) y save.eggsHatched = { id: fecha } (los abiertos, para
 * que al juntar dos aparatos no vuelvan; la fusión está en core/db.js: merge).
 */
G.Eggs = (() => {
  const NEED = { 1: 500, 2: 1000, 3: 2000, 4: 4000, 5: 8000 };
  const SHINY = 1 / 32;
  const SLOTS = 3, WAIT = 3, OVERFLOW = 200, KEEP_HATCHED = 300;   // (300: B1 de la revisión; con 40, un aparato viejo resucitaba huevos)
  const GACHA_EVERY = 10;           // tiradas ×10 en un banner por huevo
  const LEGEND_CHANCE = 0.05;

  const save = () => G.DB.save;
  const list = () => { const s = save(); return (s && s.eggs) || []; };
  const base = dex => (G.EGG_BASE && G.EGG_BASE[dex]) || null;
  /** Imagen del huevo (de su familia; shiny si lo es). */
  const img = e => `assets/eggs/${e.shiny ? 's/' : ''}${base(e.dex)}.png`;

  /** Los que pueden salir de un huevo de esa región, por rareza. */
  function poolOf(gen, rarity) {
    return G.DEX.filter(p => p.gen === gen && p.rarity === rarity && !p.leg && base(p.dex));
  }

  /** Sortea su Pokémon (rareza como el gacha, la más cercana que tenga alguno). */
  function roll(gen) {
    const rates = G.Gacha.RATES, total = rates.reduce((a, [, w]) => a + w, 0);
    let x = Math.random() * total, want = 1;
    for (const [r, w] of rates) { x -= w; if (x <= 0) { want = r; break; } }
    for (const d of [0, -1, 1, -2, 2, -3, 3, -4, 4]) {
      const r = want + d, p = r >= 1 && r <= 5 ? poolOf(gen, r) : [];
      if (p.length) {
        const mon = G.U.pick(p);
        return { dex: mon.dex, rarity: r, shiny: G.Sprites.hasShiny(mon.dex) && Math.random() < SHINY };
      }
    }
    return null;
  }

  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /**
   * Te da un huevo de la región `gen` (`from`: 'mission' | 'gacha' | 'rift').
   * → el huevo, o { overflow: monedas } si ya no cabe, o null.
   */
  function give(gen, from) {
    const s = save();
    if (!s) return null;
    s.eggs = s.eggs || [];
    if (s.eggs.length >= SLOTS + WAIT) {
      s.coins += OVERFLOW;
      G.DB.commit();
      return { overflow: OVERFLOW };
    }
    const r = roll(gen);
    if (!r) return null;
    const e = { id: newId(), dex: r.dex, shiny: r.shiny, need: NEED[r.rarity], done: 0, from };
    s.eggs.push(e);
    G.DB.commit();
    return e;
  }

  /** Un enemigo ha caído (G.Progress.kill, también los del grupo): avanzan los que incuban. */
  function onKill() {
    const s = save();
    if (!s || !s.eggs || !s.eggs.length) return;
    for (const e of s.eggs.slice(0, SLOTS)) if (e.done < e.need) e.done++;
  }

  const ready = e => e.done >= e.need;
  const anyReady = () => list().slice(0, SLOTS).some(ready);

  /**
   * Abre ese huevo (tiene que estar listo y en la Incubadora).
   * → { dex, shiny, isNew, refund } o null.
   */
  function hatch(id) {
    const s = save();
    const i = list().findIndex(e => e.id === id);
    if (i < 0 || i >= SLOTS || !ready(s.eggs[i])) return null;
    const e = s.eggs.splice(i, 1)[0];
    s.eggsHatched = s.eggsHatched || {};
    s.eggsHatched[e.id] = Date.now();
    const old = Object.keys(s.eggsHatched).sort((a, b) => s.eggsHatched[b] - s.eggsHatched[a]).slice(KEEP_HATCHED);
    for (const k of old) delete s.eggsHatched[k];
    const rarity = (G.DEX_BY[e.dex] || {}).rarity || 1;
    let isNew, refund = 0;
    if (e.shiny) {
      isNew = G.DB.grantShiny(e.dex, 'egg');
      if (!isNew) refund = G.Gacha.REFUND[rarity] * 3;
    } else {
      isNew = !G.DB.owns(e.dex);
      G.DB.grant(e.dex, 'egg');
      if (!isNew) refund = G.Gacha.REFUND[rarity];
    }
    s.coins += refund;
    G.DB.commit(true);
    return { dex: e.dex, shiny: e.shiny, isNew, refund };
  }

  // ---------------- de dónde salen ----------------

  /** Cada tirada ×10 en un banner (gacha-ui): cada GACHA_EVERY, un huevo de esa región. */
  function onGacha10(gen) {
    const s = save();
    if (!s) return null;
    // Tiradas de ese banner y huevos ya dados, que sólo suben (como la GS Ball: G.DB.merge).
    s.eggGacha = s.eggGacha || {};
    s.eggGachaGot = s.eggGachaGot || {};
    s.eggGacha[gen] = (s.eggGacha[gen] || 0) + 1;
    if ((s.eggGachaGot[gen] || 0) >= Math.floor(s.eggGacha[gen] / GACHA_EVERY)) return null;
    s.eggGachaGot[gen] = (s.eggGachaGot[gen] || 0) + 1;
    return give(gen, 'gacha');
  }

  /** Al ganar una grieta: a veces, un huevo de la región de ese legendario. */
  function onRiftWin(dex) {
    const mon = G.DEX_BY[dex];
    return mon && Math.random() < LEGEND_CHANCE ? give(mon.gen, 'rift') : null;
  }

  return { NEED, SHINY, SLOTS, WAIT, OVERFLOW, GACHA_EVERY, LEGEND_CHANCE,
           list, base, img, roll, give, onKill, ready, anyReady, hatch, onGacha10, onRiftWin };
})();
