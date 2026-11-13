/* ============ weather.js — climas (evento raro) ============
 * De vez en cuando (desde el minuto 2, ~1 de cada 6 minutos) llega un clima
 * que dura alrededor de un minuto. Cambia el daño según el tipo del ataque,
 * para ti y para los enemigos:
 *
 *   sol      Fuego ×1,5 · Agua ×0,5
 *   lluvia   Agua ×1,5 · Eléctrico ×1,2 · Fuego ×0,5
 *   arena    Roca, Tierra y Acero ×1,3; los demás pierden un poco de vida
 *   nieve    Hielo ×1,5; los demás pierden un poco de vida y van algo más lentos
 *   niebla   Fantasma, Hada y Psíquico ×1,3
 *
 * Cada bioma tiene sus climas más probables (el volcán, sol y arena...).
 * Lo visual es suave a propósito: un tinte leve y pocas partículas, cada clima con su
 * dibujo (ver "dibujo"); en los lagos también se nota (world.js drawLiquid).
 *
 * Cooperativo: lo decide el anfitrión y lo manda con 'wx'.
 */
G.Weather = (() => {
  const KINDS = {
    sun:  { name: 'Sol abrasador', icon: 'wsun', color: '#ffcb3d', tint: [255, 190, 90, 0.07],
            mult: { fire: 1.5, water: 0.5 }, hint: 'el Fuego se potencia y el Agua se debilita' },
    rain: { name: 'Lluvia', icon: 'wrain', color: '#7fb8ff', tint: [50, 90, 170, 0.09],
            mult: { water: 1.5, electric: 1.2, fire: 0.5 }, hint: 'el Agua se potencia y el Fuego se debilita' },
    sand: { name: 'Tormenta de arena', icon: 'wsand', color: '#e0bf73', tint: [200, 160, 90, 0.13],
            mult: { rock: 1.3, ground: 1.3, steel: 1.3 }, safe: ['rock', 'ground', 'steel'],
            hint: 'Roca, Tierra y Acero se potencian; el resto sufre' },
    snow: { name: 'Nevada', icon: 'wsnow', color: '#d8f1ff', tint: [210, 230, 255, 0.08],
            mult: { ice: 1.5 }, safe: ['ice'], slow: true, hint: 'el Hielo se potencia; el resto sufre y va más lento' },
    fog:  { name: 'Niebla', icon: 'wfog', color: '#c9cfdc', tint: [190, 195, 210, 0.12],
            mult: { ghost: 1.3, fairy: 1.3, psychic: 1.3 }, hint: 'Fantasma, Hada y Psíquico se potencian' }
  };
  // Probabilidad de cada clima según el bioma (bosque, cueva, volcán).
  const BIOME_W = [
    { rain: 3, fog: 2, sun: 1.5, snow: 0.5, sand: 0.5 },
    { fog: 3, snow: 2.5, rain: 1, sand: 1 },
    { sun: 3, sand: 3, fog: 1 }
  ];
  const FROM = 120, CHECK = 60, CHANCE = 0.18;

  let cur = null;           // { kind, t, dur }
  let checkT = CHECK, chipT = 0;
  let parts = [];
  const authority = () => !G.Coop.active || G.Coop.isHost;

  function reset() { cur = null; checkT = CHECK; chipT = 0; parts = []; }

  function def() { return cur ? KINDS[cur.kind] : null; }

  /** Multiplicador de daño de un ataque de este tipo con el clima actual. */
  function mult(type) {
    const d = def();
    return d && d.mult[type] ? 1 + (d.mult[type] - 1) * level() : 1;
  }

  /** Intensidad 0..1 (entra y sale en 3 s). */
  function level() {
    if (!cur) return 0;
    return Math.min(1, cur.t / 3, (cur.dur - cur.t) / 3);
  }

  /** ¿Le afecta el daño de arena/nieve a un Pokémon con estos tipos? */
  function hurts(types) {
    const d = def();
    return !!(d && d.safe && !types.some(t => d.safe.includes(t)));
  }

  /** Factor de velocidad (nieve) para un Pokémon con estos tipos. */
  function speedFor(types) {
    const d = def();
    return d && d.slow && !types.includes('ice') ? 1 - 0.1 * level() : 1;
  }

  function start(kind, dur) {
    // El mismo clima que ya hay (Día Soleado lanzado otra vez): sólo dura más, sin volver a avisar.
    if (cur && cur.kind === kind && cur.t < cur.dur) { cur.dur = Math.max(cur.dur, cur.t + dur); return; }
    cur = { kind, t: 0, dur };
    const d = KINDS[kind];
    G.Spawner.say(d.name + ': ' + d.hint, 3.4, true);
    G.Audio.sfx('biome');
  }

  function stop() {
    if (!cur) return;
    // Deja que se desvanezca.
    cur.dur = Math.min(cur.dur, cur.t + 3);
  }

  function pick(biome) {
    const w = BIOME_W[biome % BIOME_W.length];
    let r = Math.random() * Object.values(w).reduce((a, b) => a + b, 0);
    for (const k in w) { r -= w[k]; if (r <= 0) return k; }
    return 'rain';
  }

  function update(dt, time, pl) {
    if (cur) {
      cur.t += dt;
      if (cur.t >= cur.dur) cur = null;
    } else if (authority() && time > FROM && !G.Rift.inArena && !G.Judgment.active) {
      checkT -= dt;
      if (checkT <= 0) {
        checkT = CHECK;
        if (Math.random() < CHANCE) {
          const kind = pick(G.World.biome), dur = Math.round(G.U.rand(55, 75));
          start(kind, dur);
          if (G.Coop.isHost) G.Coop.broadcast(['wx', kind, dur]);
        }
      }
    }
    // Arena y nieve: te van quitando un poco de vida (nunca te dejan KO).
    chipT -= dt;
    if (chipT <= 0) {
      chipT = 2;
      if (pl && !pl.dead && hurts(pl.mon.types) && level() > 0.5) {
        const d = Math.max(1, pl.maxHp * 0.012);
        if (pl.hp > d + 1) {
          pl.hp -= d;
          G.FX.dmgText(pl.x, pl.y - pl.bodyH - 4, '-' + Math.round(d), def().color);
        }
      }
      if (authority() && cur && def().safe && level() > 0.5) {
        for (const e of G.EnemyMgr.all()) {
          if (e.dead || e.remote || e.boss) continue;
          if (!hurts(e.types || [])) continue;
          e.hp -= e.maxHp * 0.02 + 1;
          e.flash = 0.05;
          if (e.hp <= 0) e.die();
        }
      }
    }
  }

  /** Cooperativo: el anfitrión manda el clima. */
  function onEvent(ev) { if (ev[1]) start(ev[1], ev[2]); else stop(); }

  // ---------------- dibujo (en pantalla) ----------------
  // (12-11-2026) Cada clima con su dibujo, en píxeles enteros y a fotogramas, sin tapar la acción:
  //   lluvia  gotas en diagonal que caen hasta un punto del suelo y salpican
  //   nieve   copos de dos tamaños que caen despacio con vaivén
  //   arena   granos, rayas horizontales y rayas de viento que llegan a ráfagas
  //   sol     rayos de luz a escalones desde arriba y algún destello
  //   niebla  bandas de bloques que se desplazan despacio
  // En calidad baja, lo mínimo: el tinte y unas pocas partículas sencillas.
  // Las mismas cantidades de siempre (COUNT); la niebla no lleva partículas.
  const COUNT = { rain: 70, snow: 45, sand: 40, sun: 14, fog: 0 };
  let clock = 0, partsKind = null;
  const hash = n => { const v = Math.sin(n * 127.1) * 43758.5; return v - Math.floor(v); };

  /** Se llama después de dibujar el mundo. */
  function draw(ctx, w, h, dt) {
    const d = def();
    const k = level();
    if (!d || k <= 0) { parts.length = 0; partsKind = null; return; }
    // Otro clima encima del que había (un ataque de clima): fuera sus partículas, no valen para este.
    if (partsKind !== cur.kind) { parts.length = 0; partsKind = cur.kind; }
    clock += dt;
    const low = G.Settings.get('quality') === 'low';
    const s = Math.max(2, Math.round(w / 640));          // un "píxel" del juego
    const [r, g, b, a] = d.tint;
    ctx.fillStyle = `rgba(${r},${g},${b},${a * k})`;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    if (!low && cur.kind === 'sun') sunRays(ctx, w, h, s, k);
    if (!low && cur.kind === 'fog') fogBands(ctx, w, h, s, k);
    // Arena: el viento sopla a ráfagas (más deprisa y más visible unos segundos, luego afloja).
    const gust = cur.kind === 'sand' ? 0.55 + 0.45 * Math.max(0, Math.sin(clock * 0.9) + 0.35 * Math.sin(clock * 2.3)) : 1;
    if (!low && cur.kind === 'sand') sandGusts(ctx, w, h, s, k, gust);

    const want = Math.round(COUNT[cur.kind] * (low ? 0.5 : 1) * k * (w / 1280));
    while (parts.length < want) parts.push(spawn(w, h, true));
    if (parts.length > want) parts.length = want;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.land) {
        // Salpicadura de la gota: dos fotogramas y a otra cosa.
        if (p.t > 0.2) { parts[i] = spawn(w, h, false); continue; }
        ctx.globalAlpha = 0.6 * k;
        ctx.fillStyle = '#e6f1ff';
        const x = Math.round(p.x), y = Math.round(p.y), o = p.t < 0.1 ? s : 2 * s;
        ctx.fillRect(x - o, y - (p.t < 0.1 ? s : 0), s, s); ctx.fillRect(x + o, y - (p.t < 0.1 ? s : 0), s, s);
        if (p.t < 0.1) ctx.fillRect(x, y, s, s);
        continue;
      }
      p.x += p.vx * gust * dt; p.y += p.vy * dt;
      // Fuera sólo cuando ya no se ve nada de ella (con margen): no se cortan en los bordes.
      if (p.y > h + 6 * s || p.x < -8 * s || p.x > w + 8 * s || p.t > p.life) { parts[i] = spawn(w, h, false); continue; }
      const x = Math.round(p.x), y = Math.round(p.y);
      ctx.fillStyle = p.c;
      if (cur.kind === 'rain') {
        if (!low && p.y >= p.ly) { p.land = true; p.t = 0; continue; }
        ctx.globalAlpha = p.a * k;
        // Raya en diagonal de seis píxeles (cae hacia la izquierda).
        for (let j = 0; j < 2; j++) ctx.fillRect(x + j * s, y - (j + 1) * 3 * s, s, 3 * s);
      } else if (cur.kind === 'snow') {
        ctx.globalAlpha = p.a * k;
        // Vaivén a pasos de un píxel; los grandes, en cruz.
        const sx = x + Math.round(Math.sin(p.t * p.sw + p.ph) * 3) * s;
        if (p.big && !low) { ctx.fillRect(sx - s, y, 3 * s, s); ctx.fillRect(sx, y - s, s, 3 * s); }
        else ctx.fillRect(sx, y, s, s);
      } else if (cur.kind === 'sand') {
        ctx.globalAlpha = p.a * k * (0.5 + 0.5 * gust);
        ctx.fillRect(x, y, (p.big ? 6 : 1) * s, s);
        if (p.big) ctx.fillRect(x + 7 * s, y, s, s);
      } else {
        // Sol: destellos que titilan (cruz de un píxel a ratos, punto el resto).
        const tw = Math.sin(p.t * 3 + p.ph);
        ctx.globalAlpha = p.a * k * Math.max(0, Math.min(1, p.t * 2, (p.life - p.t) * 2));
        if (tw > 0.6 && !low) { ctx.fillRect(x - s, y, 3 * s, s); ctx.fillRect(x, y - s, s, 3 * s); }
        else ctx.fillRect(x, y, s, s);
      }
    }
    ctx.restore();
  }

  function spawn(w, h, anywhere) {
    const kind = cur.kind, s = Math.max(2, Math.round(w / 640));
    const y = anywhere ? Math.random() * h : -4 * s;
    if (kind === 'rain') {
      // Entra por arriba (o por la derecha) y cae hasta su punto del suelo (ly), donde salpica.
      const x = Math.random() * (w + h * 0.25), ly = anywhere ? y + Math.random() * (h - y) : h * (0.15 + 0.85 * Math.random());
      return { x, y, ly, vx: -190, vy: 570, a: 0.6, c: '#cfe2ff', t: 0, life: 9 };
    }
    if (kind === 'snow') return { x: Math.random() * w, y, vx: G.U.rand(-10, 10), vy: G.U.rand(28, 60), a: 0.75, c: '#ffffff', t: 0, life: 30,
      sw: G.U.rand(0.8, 1.6), ph: Math.random() * 6.28, big: Math.random() < 0.3 };
    if (kind === 'sand') return { x: anywhere ? Math.random() * w : w + 6 * s, y: Math.random() * h, vx: G.U.rand(-560, -380), vy: G.U.rand(10, 40), a: 0.85,
      c: Math.random() < 0.5 ? '#e8cf8f' : '#c9a865', t: 0, life: 9, big: Math.random() < 0.35 };
    // sol: destellos en la mitad de arriba, que bajan muy despacio
    return { x: Math.random() * w, y: Math.random() * h * 0.6, vx: G.U.rand(-6, 6), vy: G.U.rand(4, 10), a: 0.6, c: '#fff1b0', t: 0,
      life: G.U.rand(3, 6), ph: Math.random() * 6.28 };
  }

  /** Sol: cinco rayos inclinados que bajan desde arriba, a escalones (cada tramo más estrecho y más
   *  flojo), y que se encienden y se apagan por turnos. */
  function sunRays(ctx, w, h, s, k) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#ffe9a0';
    const step = 8 * s, rows = Math.ceil(h * 0.55 / step);
    for (let i = 0; i < 5; i++) {
      // A fotogramas: su brillo cambia en 4 niveles.
      const on = Math.round((0.5 + 0.5 * Math.sin(clock * 0.5 + i * 1.9)) * 4) / 4;
      if (on <= 0) continue;
      const x0 = Math.round(w * (0.12 + 0.19 * i + 0.04 * hash(i + 3)) / s) * s, wd = (10 + Math.round(8 * hash(i + 11))) * s;
      for (let j = 0; j < rows; j++) {
        const q = j / rows, cut = Math.floor(q * 3);
        ctx.globalAlpha = 0.15 * k * on * (cut === 0 ? 1 : cut === 1 ? 0.6 : 0.3);
        ctx.fillRect(x0 - j * 3 * s + cut * s, j * step, wd - cut * 2 * s, step);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /** Niebla: seis bandas horizontales hechas de bloques (con el borde a escalones) que se desplazan
   *  cada una a su paso; las del centro de la pantalla, donde está tu Pokémon, más flojas. */
  function fogBands(ctx, w, h, s, k) {
    const B = 16 * s;                                    // ancho de un bloque
    ctx.fillStyle = '#dfe4ee';
    for (let i = 0; i < 6; i++) {
      const cy = Math.round(h * (0.08 + 0.17 * i) / s) * s, mid = 1 - Math.min(1, Math.abs(cy - h * 0.5) / (h * 0.22));
      const off = Math.round(clock * (10 + 7 * hash(i + 1)) * (i % 2 ? -1 : 1) / s) * s, n0 = Math.floor(off / B);
      ctx.globalAlpha = k * (0.13 - 0.07 * mid);
      for (let x = -(((off % B) + B) % B) - B, n = n0 - 1; x < w + B; x += B, n++) {
        // Cada bloque, su alto (o un hueco): así la banda tiene claros y el borde va a escalones.
        const v = hash(n * 7.3 + i * 31.7);
        if (v < 0.3) continue;
        const hh = (2 + Math.round(v * 5)) * 2 * s, up = Math.round(hash(n * 3.1 + i) * 3) * 2 * s;
        ctx.fillRect(x, cy - up, B, hh);
        ctx.fillRect(x + 4 * s, cy - up - 2 * s, B - 8 * s, 2 * s);
        ctx.fillRect(x + 2 * s, cy - up + hh, B - 6 * s, 2 * s);
      }
    }
  }

  /** Arena: siete rayas de viento a trozos que cruzan la pantalla de derecha a izquierda, cada una
   *  a su altura y a su paso, y que se notan más con la ráfaga. */
  function sandGusts(ctx, w, h, s, k, gust) {
    ctx.fillStyle = '#f0dca0';
    for (let i = 0; i < 7; i++) {
      const y = Math.round(h * (0.08 + 0.135 * i + 0.05 * hash(i + 5)) / s) * s, L = Math.round(60 + 50 * hash(i + 9)) * s, span = w + 2 * L;
      const x = w + L - (clock * (520 + 140 * hash(i + 2)) + span * hash(i + 4)) % (span * 1.6);
      if (x < -L) continue;                              // el hueco entre una pasada y la siguiente
      ctx.globalAlpha = Math.min(0.6, 0.5 * k * gust);
      for (let j = 0, n = 0; j < L; j += 9 * s, n++) ctx.fillRect(Math.round((x + j) / s) * s, y + (n % 3 === 2 ? s : 0), 6 * s, s);
    }
  }

  return {
    KINDS, reset, update, draw, mult, speedFor, hurts, onEvent,
    get current() { return cur && level() > 0 ? Object.assign({ left: Math.max(0, cur.dur - cur.t) }, cur, KINDS[cur.kind]) : null; },
    get vignette() { return cur && cur.kind === 'fog' ? level() : 0; },
    /** Para lo que el clima cambia en el dibujo del mapa (el agua de los lagos): cuál hay y cuánto (0..1). */
    get kind() { return cur ? cur.kind : null; },
    get level() { return level(); },
    /** Pone un clima ya (la arena de la grieta; no se manda: cada uno lo pone). */
    force(kind, dur) { start(kind, dur); },
    /** Quita el clima de golpe (al salir de la arena). */
    clear() { cur = null; parts.length = 0; partsKind = null; },
    debugStart(kind = 'rain', dur = 60) { start(kind, dur); if (G.Coop.isHost) G.Coop.broadcast(['wx', kind, dur]); },
    /** Un ataque de clima (Día Soleado, Danza Lluvia, Tormenta Arena): lo pone quien manda el clima. */
    cast(kind, dur) { if (G.Coop.active && !G.Coop.isHost) return; start(kind, dur); if (G.Coop.isHost) G.Coop.broadcast(['wx', kind, dur]); }
  };
})();
