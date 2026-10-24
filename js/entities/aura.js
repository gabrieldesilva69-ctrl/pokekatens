/* ============ aura.js — detalles que brillan, partículas, contorno y destello shiny ============
 * (24-10-2026.) Efectos que el juego dibuja ENCIMA de los sprites, sin tocar los
 * dibujos de SpriteCollab. Sólo en tu compañero (y los de tu grupo), los jefes,
 * los legendarios y los shiny: con cientos de enemigos el móvil no daría abasto.
 *
 *   - Detalles que brillan (SPOTS): partes de algunos Pokémon que se iluminan y
 *     parpadean (la llama de Charmander, las mejillas de Pikachu, los ojos de Gengar).
 *     Se sacan de los COLORES del sprite, así siguen al Pokémon en cada fotograma y
 *     dirección: `on` los colores que brillan, `avoid` no si tocan uno de estos (la
 *     barriga de Charmander tiene el mismo amarillo que su llama), `grow` y también
 *     estos colores pegados a ellos, `above` sólo por encima de esa parte de su alto
 *     (los ojos de Gengar, no su lengua). Se calcula una vez por hoja (emissive).
 *   - Partículas suaves según su tipo (PARTS): ascuas, burbujas, hojas, chispas...
 *   - Contorno que brilla (glow): megaevolución, racha alta, jefes y legendarios.
 *   - Destello shiny: una franja de luz cruza el sprite de vez en cuando.
 * Lo usan entities/player.js, entities/enemy.js, core/sprites.js (Animator.draw:
 * opts.glow / opts.emit / opts.sweep) y ui/ui.js (vista de lujo de la colección).
 */
G.Aura = (() => {
  // ---------------- detalles que brillan ----------------
  const SPOTS = {
    4: { on: ['fff700'], avoid: ['dfb700', 'a76f00'], grow: ['d73f00'], color: '#ffb347', kind: 'flame' },   // Charmander: la llama
    25: { on: ['d73f00'], color: '#ffe14d', kind: 'spark' },                                                   // Pikachu: las mejillas
    94: { on: ['d73f00', '9f0000'], above: 0.4, color: '#ff4a6a', kind: 'eye' }                                 // Gengar: los ojos
  };
  const hex = c => [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  const masks = new WeakMap();              // hoja -> { dex -> canvas o null }

  /** Hoja con sólo los píxeles que brillan de ese Pokémon (o null). m: geometría de la hoja (w, h, ay). */
  function emissive(img, dex, m) {
    const rule = SPOTS[dex];
    if (!rule || !img || !img.width) return null;
    let per = masks.get(img);
    if (!per) masks.set(img, per = {});
    if (dex in per) return per[dex];
    let out = null;
    try {
      const w = img.width, h = img.height;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0);
      const src = x.getImageData(0, 0, w, h), d = src.data;
      const set = l => new Set((l || []).map(v => hex(v).join(',')));
      const on = set(rule.on), avoid = set(rule.avoid), grow = set(rule.grow);
      const col = i => (d[i + 3] > 40 ? d[i] + ',' + d[i + 1] + ',' + d[i + 2] : '');
      const near = (px, py, s) => {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const qx = px + dx, qy = py + dy;
          if (qx >= 0 && qy >= 0 && qx < w && qy < h && s.has(col((qy * w + qx) * 4))) return true;
        }
        return false;
      };
      // above: sólo los que están por encima de esa parte del alto (desde los pies, como en Idle).
      const idle = G.Sprites.animMeta(dex, 'Idle'), tall = idle ? idle.ay : 24;
      const high = py => !rule.above || !m || (m.ay - (py % m.h)) > tall * rule.above;
      const keep = new Uint8Array(w * h);
      for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
        if (on.has(col((py * w + px) * 4)) && high(py) && !(avoid.size && near(px, py, avoid))) keep[py * w + px] = 1;
      }
      if (grow.size) {
        const add = [];
        for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
          const i = py * w + px;
          if (keep[i] || !grow.has(col(i * 4))) continue;
          for (let dy = -1; dy <= 1 && !keep[i]; dy++) for (let dx = -1; dx <= 1; dx++) {
            const qx = px + dx, qy = py + dy;
            if (qx >= 0 && qy >= 0 && qx < w && qy < h && keep[qy * w + qx] === 1) { add.push(i); break; }
          }
        }
        for (const i of add) keep[i] = 2;
      }
      const res = x.createImageData(w, h), r = res.data;
      let any = false;
      for (let i = 0; i < w * h; i++) {
        if (!keep[i]) continue;
        any = true;
        r[i * 4] = d[i * 4]; r[i * 4 + 1] = d[i * 4 + 1]; r[i * 4 + 2] = d[i * 4 + 2]; r[i * 4 + 3] = 255;
      }
      if (any) { x.clearRect(0, 0, w, h); x.putImageData(res, 0, 0); out = c; }
    } catch (e) { /* file:// no deja leer los píxeles: sin brillo */ }
    per[dex] = out;
    return out;
  }

  /** Cuánto brilla ahora (parpadeo según el tipo de detalle). */
  function emitLevel(dex, t) {
    const rule = SPOTS[dex];
    if (!rule) return 0;
    if (rule.kind === 'flame') return 0.55 + 0.25 * Math.sin(t * 13) + 0.15 * Math.sin(t * 31);
    if (rule.kind === 'spark') return Math.sin(t * 2.2) > 0.6 ? 0.5 + 0.5 * Math.random() : 0.25;
    return 0.45 + 0.3 * Math.sin(t * 3);
  }
  const spotColor = dex => (SPOTS[dex] ? SPOTS[dex].color : '#fff');

  // ---------------- partículas según el tipo ----------------
  // c colores · up subida · spread a los lados · r tamaño · life vida · rate cuántas por segundo
  const PARTS = {
    fire: { c: ['#ffb347', '#ff7a3d', '#ffe14d'], up: 34, spread: 10, r: 1.6, life: 0.9, rate: 7, glow: true },
    water: { c: ['#9fd8ff', '#d6f0ff'], up: 22, spread: 8, r: 1.8, life: 1.3, rate: 4, ring: true },
    grass: { c: ['#5fe08a', '#a5f07a'], up: -10, spread: 16, r: 1.6, life: 1.6, rate: 3, leaf: true },
    electric: { c: ['#ffe14d', '#fff7b0'], up: 0, spread: 18, r: 1.2, life: 0.25, rate: 9, glow: true },
    ice: { c: ['#d8f1ff', '#ffffff'], up: -8, spread: 14, r: 1.4, life: 1.6, rate: 3 },
    ghost: { c: ['#9b7bff', '#c9b5ff'], up: 14, spread: 12, r: 2.4, life: 1.4, rate: 3, soft: true },
    psychic: { c: ['#ff8ad8', '#ffc4ee'], up: 12, spread: 12, r: 1.4, life: 1.2, rate: 3, ring: true },
    poison: { c: ['#c86bdc', '#e2a3f0'], up: 18, spread: 8, r: 1.8, life: 1.1, rate: 4, ring: true },
    dark: { c: ['#4a4060', '#6b5d8a'], up: 10, spread: 12, r: 2.6, life: 1.4, rate: 3, soft: true },
    fairy: { c: ['#ffb3e6', '#ffffff'], up: 10, spread: 14, r: 1.2, life: 1.1, rate: 4, glow: true },
    dragon: { c: ['#8f7bff', '#5fb8ff'], up: 16, spread: 10, r: 1.6, life: 1.1, rate: 4, glow: true },
    steel: { c: ['#e6ecff', '#b0b8c8'], up: 6, spread: 14, r: 1.2, life: 0.6, rate: 3, glow: true },
    rock: { c: ['#c8a875', '#a08560'], up: -6, spread: 12, r: 1.4, life: 1.0, rate: 2 },
    ground: { c: ['#d8b878', '#b89458'], up: 4, spread: 14, r: 1.6, life: 0.9, rate: 3, soft: true },
    flying: { c: ['#ffffff', '#d6e8ff'], up: 6, spread: 18, r: 1.4, life: 1.2, rate: 3, soft: true },
    bug: { c: ['#a5d84a', '#d6f07a'], up: 12, spread: 14, r: 1.2, life: 1.0, rate: 3, glow: true },
    fighting: { c: ['#ff9a3d', '#ffd23f'], up: 20, spread: 8, r: 1.2, life: 0.5, rate: 4 },
    normal: { c: ['#ffffff', '#fff4d6'], up: 8, spread: 12, r: 1.1, life: 1.0, rate: 1.5, glow: true }
  };
  const MAX = 160;
  const parts = [];

  /** Suelta partículas del tipo principal de `ent` (llámalo cada fotograma; dt en s). */
  function emit(ent, types, dt, k = 1) {
    if (!types || !types.length || parts.length >= MAX || G.Settings.get('quality') === 'low') return;
    const P = PARTS[types[0]] || PARTS.normal;
    ent._auraAcc = (ent._auraAcc || 0) + dt * P.rate * k;
    while (ent._auraAcc >= 1 && parts.length < MAX) {
      ent._auraAcc -= 1;
      const h = ent.bodyH || 24, r = ent.r || 12;
      parts.push({ x: ent.x + G.U.rand(-r, r), y: ent.y - G.U.rand(0.1, 0.95) * h, vx: G.U.rand(-1, 1) * P.spread * 0.4,
        vy: -P.up * G.U.rand(0.6, 1.2), t: 0, life: P.life * G.U.rand(0.7, 1.2), c: G.U.pick(P.c), r: P.r * G.U.rand(0.8, 1.3) * G.Sprites.PX, P });
    }
  }
  function update(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.t >= p.life) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
      p.x += p.vx * dt + (p.P.leaf ? Math.sin(p.t * 5) * 12 * dt : 0);
      p.y += p.vy * dt;
    }
  }
  /** En el mundo (con la cámara puesta), encima de los Pokémon. */
  function draw(ctx) {
    if (!parts.length) return;
    ctx.save();
    for (const p of parts) {
      const k = p.t / p.life, a = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
      ctx.globalAlpha = Math.max(0, a) * (p.P.soft ? 0.45 : 0.85);
      ctx.globalCompositeOperation = p.P.glow ? 'lighter' : 'source-over';
      ctx.fillStyle = p.c;
      if (p.P.ring) {
        ctx.strokeStyle = p.c; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.stroke();
      } else {
        const s = Math.max(1, Math.round(p.r));
        ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
      }
    }
    ctx.restore();
  }
  function clear() { parts.length = 0; }

  // ---------------- destello shiny ----------------
  const SWEEP_EVERY = 3.2, SWEEP_LONG = 0.7;
  /** 0..1 mientras la franja cruza el sprite (o -1 si ahora no). `seed` desfasa a cada uno. */
  function sweep(t, seed = 0) {
    const k = ((t + seed) % SWEEP_EVERY) / SWEEP_LONG;
    return k <= 1 ? k : -1;
  }

  // Lienzo pequeño de trabajo para la franja (uno para todos).
  let work = null;
  /** Dibuja la franja de luz sobre el fotograma (lo llama Animator.draw). */
  function drawSweep(ctx, img, sx, sy, w, h, dx, dy, k, phase, alpha) {
    if (!work) work = document.createElement('canvas');
    if (work.width < w) work.width = w;
    if (work.height < h) work.height = h;
    const x = work.getContext('2d');
    x.globalCompositeOperation = 'source-over';
    x.clearRect(0, 0, work.width, work.height);
    x.drawImage(G.Sprites.white(img), sx, sy, w, h, 0, 0, w, h);
    x.globalCompositeOperation = 'source-in';
    // Una franja estrecha e inclinada que cruza de izquierda a derecha.
    const c = -w * 0.3 + phase * w * 1.6;
    const g = x.createLinearGradient(c - w * 0.12, h * 0.1, c + w * 0.12, -h * 0.1);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5 * alpha;
    ctx.drawImage(work, 0, 0, w, h, dx, dy, w * k, h * k);
    ctx.restore();
  }

  // ---------------- para quién ----------------
  /** Opciones de dibujo (Animator.draw) para tu compañero o el de otro jugador. */
  function forPlayer(pl, t) {
    const o = {};
    // De noche (systems/night.js), los detalles brillan más.
    const night = G.Night ? G.Night.level(G.Game.st.time || 0) : 0;
    if (SPOTS[pl.dex] && !pl.dead) o.emit = { dex: pl.dex, level: emitLevel(pl.dex, t) * (1 + 0.8 * night), color: spotColor(pl.dex) };
    if (pl.shiny) { const s = sweep(t, (pl.dex % 7) * 0.4); if (s >= 0) o.sweep = s; }
    if (pl.megaOn) o.glow = G.Mega.primal(pl.dex) ? '#ff9a3d' : '#ff8ad8';
    else if (pl === G.Game.player && G.Streak.mul() >= 1.25) o.glow = '#ffd23f';
    return o;
  }
  /** Para un enemigo: sólo jefes, legendarios y shiny (los demás, nada). */
  function forEnemy(e, t) {
    const legend = e.legend || (e.boss && G.Rift.inArena);
    if (!(e.boss || e.shiny || legend) || e.dead) return null;
    const o = {};
    if (SPOTS[e.dex]) o.emit = { dex: e.dex, level: emitLevel(e.dex, t + e.id), color: spotColor(e.dex) };
    if (e.shiny) { const s = sweep(t, (e.id % 9) * 0.37); if (s >= 0) o.sweep = s; }
    if (legend) o.glow = '#ffd23f';
    else if (e.boss) o.glow = 'rgba(255,90,90,.9)';
    return o;
  }
  /** ¿Lleva partículas? (los mismos que forEnemy, más los jugadores) */
  const fancy = e => !!(e.boss || e.shiny || e.legend);

  return { SPOTS, PARTS, emissive, emitLevel, emit, update, draw, clear, sweep, drawSweep, forPlayer, forEnemy, fancy };
})();
