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
 *     estos colores pegados a ellos, `above` / `below` sólo por encima / por debajo de esa
 *     parte de su alto (los ojos de Gengar, no su lengua). Se calcula una vez por hoja
 *     (emissive). Los shiny tienen otros colores: no se encienden (ya llevan su destello).
 *   - Efectos propios de algunos legendarios (SPECIAL): el reloj de Dialga, el halo de
 *     Arceus, las chispas arcoíris de Ho-Oh...
 *   - Partículas suaves según su tipo (PARTS): ascuas, burbujas, hojas, chispas...
 *   - Contorno que brilla (glow): megaevolución, racha alta, jefes y legendarios.
 *   - Destello shiny: una franja de luz cruza el sprite de vez en cuando.
 * Lo usan entities/player.js, entities/enemy.js, core/sprites.js (Animator.draw:
 * opts.glow / opts.emit / opts.sweep) y ui/ui.js (vista de lujo de la colección).
 */
G.Aura = (() => {
  // ---------------- detalles que brillan ----------------
  // color: el tono del brillo · kind: cómo parpadea y qué suelta (SPOT_PARTS) · keep: brilla con
  // sus propios colores, sin teñir (los de varios colores). Elegidos mirando sus colores uno a uno.
  const SPOTS = {
    4: { on: ['fff700'], avoid: ['dfb700', 'a76f00'], grow: ['d73f00'], color: '#ffb347', kind: 'flame' },   // Charmander: la llama
    5: { on: ['fff700'], color: '#ffb347', kind: 'flame' },                                                    // Charmeleon: la llama
    6: { on: ['fff700'], avoid: ['dfb700', 'a76f00'], grow: ['d73f00'], color: '#ffb347', kind: 'flame' },   // Charizard: la llama
    25: { on: ['d73f00'], color: '#ffe14d', kind: 'spark' },                                                   // Pikachu: las mejillas
    26: { on: ['fff700'], above: 0.3, below: 0.62, color: '#ffe14d', kind: 'spark' },                          // Raichu: las mejillas
    38: { on: ['e73f67', 'ff8faf'], color: '#ff5a8a', kind: 'eye' },                                           // Ninetales: los ojos
    77: { on: ['fff700', 'dfb700'], above: 0.55, color: '#ffb347', kind: 'flame' },                            // Ponyta: la crin
    78: { on: ['fff700', 'ff875f'], above: 0.45, color: '#ffb347', kind: 'flame' },                            // Rapidash: la crin
    94: { on: ['d73f00', '9f0000'], above: 0.4, color: '#ff4a6a', kind: 'eye' },                               // Gengar: los ojos
    135: { on: ['fff700'], above: 0.5, color: '#ffe14d', kind: 'spark' },                                      // Jolteon: el pelo de punta
    145: { on: ['fff700'], above: 0.5, color: '#ffe14d', kind: 'spark' },                                      // Zapdos: las plumas
    146: { on: ['d73f00', 'ff875f'], above: 0.35, color: '#ff8a3d', kind: 'flame' },                          // Moltres: las llamas
    150: { on: ['d797df', 'af6fb7'], color: '#e08aff', kind: 'psy' },                                          // Mewtwo: la cola y la barriga
    151: { on: ['0067b7', '1f9fe7', '8fdfff'], color: '#5fd0ff', kind: 'eye' },                                // Mew: los ojos
    171: { on: ['fff700', 'dfb700'], color: '#fff27a', kind: 'glow' },                                        // Lanturn: las luces
    172: { on: ['d73f00'], color: '#ffe14d', kind: 'spark' },                                                  // Pichu: las mejillas
    181: { on: ['d73f00', '9f0000'], color: '#ff7a4a', kind: 'spark' },                                       // Ampharos: la bola de la cola
    196: { on: ['d73f00', 'ff875f'], color: '#ff4a5a', kind: 'psy' },                                          // Espeon: la gema
    197: { on: ['fff700', 'dfb700'], color: '#ffe14d', kind: 'glow' },                                        // Umbreon: los anillos
    200: { on: ['b70000', 'e73f67'], color: '#ff4a8a', kind: 'eye' },                                          // Misdreavus: el collar
    212: { on: ['fff700', 'dfb700', 'ffffff'], color: '#ffe14d', kind: 'eye' },                                // Scizor: los ojos de las pinzas
    282: { on: ['e73f67', 'ff8faf'], color: '#ff6a8a', kind: 'psy' },                                          // Gardevoir: el cuerno del pecho
    302: { on: ['6787af', 'd73f00'], color: '#7fd0ff', kind: 'eye' },                                         // Sableye: las gemas
    355: { on: ['d73f00'], color: '#ff4a4a', kind: 'eye' },                                                    // Duskull: el ojo
    390: { on: ['ffa747'], color: '#ffb347', kind: 'flame' },                                                  // Chimchar: la llama
    391: { on: ['fff700'], color: '#ffb347', kind: 'flame' },                                                  // Monferno: la llama
    392: { on: ['ff7f57', 'c72f00'], above: 0.6, color: '#ff7a2a', kind: 'flame' },                           // Infernape: la llama
    607: { on: ['8793d9', '6770a1', '414b8d'], above: 0.7, color: '#a58fff', kind: 'flame', parts: { c: ['#c9b5ff', '#8f7bff', '#ffffff'] } }, // Litwick
    609: { on: ['7352e6', '9ccefc'], color: '#a58fff', kind: 'flame', parts: { c: ['#c9b5ff', '#8f7bff', '#ffffff'] } },                      // Chandelure
    // Legendarios (y los primigenios: su sprite es otro número).
    250: { on: ['5fb727', '9fcf6f', '879fff'], keep: true, color: '#9fffd0', kind: 'glow' },                   // Ho-Oh: las puntas de las alas
    382: { on: ['d73f00', 'ff875f'], color: '#ff6a6a', kind: 'glow' },                                       // Kyogre: las líneas
    384: { on: ['fff700', 'dfb700'], color: '#ffe14d', kind: 'glow' },                                        // Rayquaza: los anillos
    483: { on: ['97e7f7', 'c7ffff', '67bfe7'], color: '#9fe8ff', kind: 'glow' },                              // Dialga: el diamante
    484: { on: ['e77fe7', 'b74fb7'], color: '#ff9ff0', kind: 'glow' },                                       // Palkia: las perlas
    487: { on: ['d73f00', '9f0000'], color: '#ff3a3a', kind: 'eye' },                                         // Giratina: las rayas rojas
    491: { on: ['67b7b7', '4f8f8f', 'd73f00'], color: '#7ff0ff', kind: 'eye' },                               // Darkrai: el collar y el ojo
    493: { on: ['0db54f', '1a8e38', 'fff700'], keep: true, color: '#ffe680', kind: 'glow' },                  // Arceus: la rueda y los ojos
    643: { on: ['10a8a8', '186878'], color: '#6affff', kind: 'eye' },                                         // Reshiram: los ojos
    644: { on: ['209090', '207078', 'e03858'], color: '#7fd8ff', kind: 'spark', parts: { c: ['#bfefff', '#7fd8ff'] } },                           // Zekrom: el generador y los ojos
    646: { on: ['d5f2f0', 'afd5e4'], color: '#c8f4ff', kind: 'ice' },                                         // Kyurem: el hielo
    716: { on: ['ffae00', 'f65952', '7b69b4', '30b5de'], keep: true, color: '#ffe0a0', kind: 'glow' },        // Xerneas: los cuernos
    717: { on: ['f74125', 'ff8442'], color: '#ff4a3a', kind: 'glow' },                                       // Yveltal: las alas
    100382: { on: ['fff3ad', 'f5c26b', 'bc708c'], color: '#7fe8ff', kind: 'glow' },                          // Kyogre primigenio: las líneas
    100383: { on: ['fef9bb'], color: '#ffd27f', kind: 'flame' }                                               // Groudon primigenio: la lava
  };
  const hex = c => [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  const masks = new WeakMap();              // hoja -> { dex -> { c: canvas, pts: Map(celda -> [x, y, ...]) } o null }

  /** Hoja con sólo los píxeles que brillan de ese Pokémon, teñidos de su color (o null),
   *  y por cada fotograma (celda "sx,sy") dónde están esos píxeles (para soltar partículas
   *  desde el detalle: ascuas de la llama, chispas de las mejillas...). m: geometría (w, h, ay). */
  function spotsOf(img, dex, m) {
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
      // above / below: sólo por encima / por debajo de esa parte del alto (desde los pies, como en Idle).
      const idle = G.Sprites.animMeta(dex, 'Idle'), tall = idle ? idle.ay : 24;
      const high = py => !m || ((!rule.above || (m.ay - (py % m.h)) > tall * rule.above) && (!rule.below || (m.ay - (py % m.h)) < tall * rule.below));
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
      // Teñidos de su color, casi blanco (el centro de una luz): al sumarse encima del sprite
      // se nota aunque sea amarillo sobre amarillo; el halo (sprites.js) va de su color.
      // Con keep, sus propios colores (aclarados).
      const res = x.createImageData(w, h), r = res.data, tint = hex(rule.color.slice(1)).map(v => Math.round(v + (255 - v) * 0.5));
      const pts = new Map();
      let any = false;
      for (let i = 0; i < w * h; i++) {
        if (!keep[i]) continue;
        any = true;
        if (rule.keep) for (let j = 0; j < 3; j++) r[i * 4 + j] = Math.min(255, d[i * 4 + j] + 60);
        else { r[i * 4] = tint[0]; r[i * 4 + 1] = tint[1]; r[i * 4 + 2] = tint[2]; }
        r[i * 4 + 3] = 255;
        if (m) {
          const px = i % w, py = (i - px) / w, key = (px - px % m.w) + ',' + (py - py % m.h);
          let l = pts.get(key);
          if (!l) pts.set(key, l = []);
          l.push(px % m.w, py % m.h);
        }
      }
      if (any) { x.clearRect(0, 0, w, h); x.putImageData(res, 0, 0); out = { c, pts }; }
    } catch (e) { /* file:// no deja leer los píxeles: sin brillo */ }
    per[dex] = out;
    return out;
  }

  const emissive = (img, dex, m) => { const o = spotsOf(img, dex, m); return o ? o.c : null; };

  /** Cuánto brilla ahora (parpadeo según el tipo de detalle). */
  function emitLevel(dex, t) {
    const rule = SPOTS[dex];
    if (!rule) return 0;
    if (rule.kind === 'flame') return 0.6 + 0.25 * Math.sin(t * 13) + 0.15 * Math.sin(t * 31);
    if (rule.kind === 'spark') return Math.sin(t * 3.4) > 0.1 ? 0.8 + 0.2 * Math.random() : 0.45;
    if (rule.kind === 'eye') return 0.75 + 0.25 * Math.sin(t * 2.2);
    return 0.7 + 0.3 * Math.sin(t * 3);
  }

  // Partículas que salen del propio detalle, según su clase.
  const SPOT_PARTS = {
    flame: { c: ['#ffe14d', '#ffb347', '#ff7a3d'], up: 40, spread: 6, r: 1.3, life: 0.7, rate: 9, glow: true },
    spark: { c: ['#fffbe0', '#ffe14d'], up: 0, spread: 60, r: 1, life: 0.25, rate: 9, glow: true, bolt: true },
    eye: { up: 6, spread: 6, r: 1.1, life: 0.6, rate: 3, glow: true },
    glow: { up: 10, spread: 8, r: 1, life: 0.8, rate: 3, glow: true },
    psy: { up: 8, spread: 6, r: 2, life: 0.9, rate: 2, ring: true },
    ice: { up: -6, spread: 10, r: 1.2, life: 1.1, rate: 3, glow: true }
  };
  /** Suelta partículas desde los píxeles del detalle en el fotograma que se acaba de dibujar. */
  function spotEmit(ent, anim, dex, dt, k = 1) {
    const rule = SPOTS[dex], ld = anim && anim.lastDraw;
    if (!rule || !ld || parts.length >= MAX || G.Settings.get('quality') === 'low') return;
    const o = spotsOf(ld.img, dex, ld.m);
    const l = o && o.pts.get(ld.sx + ',' + ld.sy);
    if (!l || !l.length) return;
    // Los que no traen colores propios, del color de su brillo y blanco.
    const P = Object.assign({ c: [rule.color, '#ffffff'] }, SPOT_PARTS[rule.kind] || SPOT_PARTS.glow, rule.parts || {});
    ent._spotAcc = (ent._spotAcc || 0) + dt * P.rate * k;
    while (ent._spotAcc >= 1 && parts.length < MAX) {
      ent._spotAcc -= 1;
      const i = 2 * Math.floor(Math.random() * l.length / 2);
      parts.push({ x: ld.dx + (l[i] + 0.5) * ld.k, y: ld.dy + (l[i + 1] + 0.5) * ld.k, vx: G.U.rand(-1, 1) * P.spread * 0.5,
        vy: -P.up * G.U.rand(0.6, 1.2), t: 0, life: P.life * G.U.rand(0.7, 1.2), c: G.U.pick(P.c), r: P.r * G.U.rand(0.8, 1.3) * G.Sprites.PX, P });
    }
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
      if (p.P.bolt) {
        // Chispa: un rayito en zigzag que sale del detalle, con borde oscuro para que se vea
        // también encima de un cuerpo amarillo.
        const s = p.vx < 0 ? -1 : 1, zig = () => {
          ctx.beginPath(); ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + s * 4, p.y - 3); ctx.lineTo(p.x + s * 2, p.y - 6); ctx.lineTo(p.x + s * 7, p.y - 10);
          ctx.stroke();
        };
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(60,40,0,.55)'; ctx.lineWidth = 3; zig();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = p.c; ctx.lineWidth = 1.5; zig();
      } else if (p.P.ring) {
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

  // ---------------- efectos propios de legendarios ----------------
  // back: lo que va DETRÁS del sprite (aros, relojes...) · parts: partículas propias, que
  // salen de su cuerpo (hue: cada una de un color del arcoíris · low: sólo de la parte de abajo).
  const SPECIAL = {
    150: { back: 'ring', c: '#e08aff' },                                                                       // Mewtwo: aro psíquico
    151: { parts: { c: ['#ffc4ee', '#ffffff'], up: 10, spread: 14, r: 2.2, life: 1.4, rate: 2, ring: true } },   // Mew: burbujas
    249: { back: 'ripple', c: '#b8d8ff', parts: { c: ['#ffffff', '#d6e8ff'], up: 4, spread: 26, r: 1.4, life: 1, rate: 4, soft: true } }, // Lugia: viento
    250: { parts: { hue: true, up: 18, spread: 16, r: 1.4, life: 1, rate: 8, glow: true } },                   // Ho-Oh: arcoíris
    382: { back: 'ripple', c: '#5fb8ff' },                                                                     // Kyogre: ondas
    383: { parts: { c: ['#ff7a3d', '#ffb347'], up: 26, spread: 18, r: 1.4, life: 0.8, rate: 5, glow: true } }, // Groudon: ascuas
    384: { parts: { c: ['#5fe08a', '#ffe14d'], up: 0, spread: 40, r: 1.2, life: 0.5, rate: 8, glow: true } },  // Rayquaza: estelas
    483: { back: 'clock', c: '#9fe8ff' },                                                                      // Dialga: el reloj del tiempo
    484: { back: 'ripple', c: '#ff9ff0' },                                                                     // Palkia: el espacio que se ondula
    487: { parts: { c: ['#2a1830', '#5a1a2a'], up: 8, spread: 18, r: 3, life: 1.6, rate: 4, soft: true, low: true } }, // Giratina: sombras
    491: { parts: { c: ['#1a1428', '#3a2c50'], up: -4, spread: 20, r: 3.2, life: 1.8, rate: 5, soft: true, low: true } }, // Darkrai: humo oscuro
    493: { back: 'halo', c: '#ffd23f' },                                                                       // Arceus: halo dorado
    643: { parts: { c: ['#ffffff', '#ffd9a0', '#9fe8ff'], up: 30, spread: 14, r: 1.5, life: 0.8, rate: 6, glow: true } }, // Reshiram: fuego blanco
    644: { parts: { c: ['#bfefff', '#7fd8ff'], up: 0, spread: 30, r: 1, life: 0.2, rate: 7, glow: true, bolt: true } },   // Zekrom: rayos
    646: { parts: { c: ['#d8f1ff', '#ffffff'], up: -10, spread: 18, r: 1.4, life: 1.6, rate: 4 } },            // Kyurem: nieve
    716: { parts: { hue: true, up: 12, spread: 20, r: 1.2, life: 1.2, rate: 5, glow: true } },                 // Xerneas: luces de colores
    717: { parts: { c: ['#ff4a3a', '#5a1a1a'], up: -12, spread: 22, r: 1.6, life: 1.4, rate: 4, leaf: true } }, // Yveltal: plumas que caen
    100382: { back: 'ripple', c: '#7fe8ff', parts: { c: ['#9fd8ff', '#d6f0ff'], up: 26, spread: 16, r: 1.8, life: 1.2, rate: 5, ring: true } }, // Kyogre primigenio
    100383: { back: 'halo', c: '#ff9a3d', parts: { c: ['#ff7a3d', '#ffb347', '#ffe14d'], up: 34, spread: 20, r: 1.6, life: 0.9, rate: 8, glow: true } } // Groudon primigenio
  };

  /** Efecto propio de `dex` (el número del sprite que lleva). Llámalo ANTES de dibujar el sprite:
   *  dibuja lo de detrás y suelta sus partículas. y: los pies (ya con lo que se eleve). */
  function special(ctx, ent, dex, y, t, dt) {
    const S = SPECIAL[dex];
    if (!S || ent.dead) return;
    const h = ent.bodyH || 24, r = ent.r || 12, x = ent.x;
    if (S.back) {
      ctx.save();
      ctx.strokeStyle = S.c; ctx.fillStyle = S.c;
      ctx.globalCompositeOperation = 'lighter';
      if (S.back === 'ring' || S.back === 'halo') {
        // Aro inclinado a media altura que gira (el halo de Arceus, con bolitas).
        const cy = y - h * (S.back === 'halo' ? 0.55 : 0.45), rx = r * 2 + h * 0.25, ry = rx * 0.32;
        ctx.globalAlpha = 0.45 + 0.15 * Math.sin(t * 2);
        ctx.lineWidth = S.back === 'halo' ? 2.5 : 1.5;
        ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, 0, 0, 6.2832); ctx.stroke();
        const n = S.back === 'halo' ? 8 : 4;
        for (let i = 0; i < n; i++) {
          const a = t * 1.2 + i * 6.2832 / n;
          ctx.globalAlpha = 0.5 + 0.4 * Math.sin(a);
          ctx.beginPath(); ctx.arc(x + Math.cos(a) * rx, cy + Math.sin(a) * ry, 2.2, 0, 6.2832); ctx.fill();
        }
      } else if (S.back === 'clock') {
        // Esfera de reloj en el suelo: doce marcas y una aguja que da la vuelta.
        const rx = r * 2.2 + h * 0.2, ry = rx * 0.38;
        ctx.globalAlpha = 0.5; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.2832); ctx.stroke();
        for (let i = 0; i < 12; i++) {
          const a = i * 0.5236, cx = Math.cos(a), cy = Math.sin(a);
          ctx.beginPath(); ctx.moveTo(x + cx * rx * 0.82, y + cy * ry * 0.82); ctx.lineTo(x + cx * rx, y + cy * ry); ctx.stroke();
        }
        const a = t * 0.9;
        ctx.globalAlpha = 0.8; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * rx * 0.75, y + Math.sin(a) * ry * 0.75); ctx.stroke();
      } else if (S.back === 'ripple') {
        // Ondas que salen de los pies y se apagan.
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
          const k = (t * 0.6 + i / 3) % 1, rx = r * (1 + 2.4 * k) + h * 0.1;
          ctx.globalAlpha = 0.5 * (1 - k);
          ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.36, 0, 0, 6.2832); ctx.stroke();
        }
      }
      ctx.restore();
    }
    if (S.parts && dt > 0 && parts.length < MAX && G.Settings.get('quality') !== 'low') {
      const P = S.parts;
      ent._specAcc = (ent._specAcc || 0) + dt * P.rate;
      while (ent._specAcc >= 1 && parts.length < MAX) {
        ent._specAcc -= 1;
        const c = P.hue ? 'hsl(' + Math.floor(Math.random() * 360) + ',100%,70%)' : G.U.pick(P.c);
        parts.push({ x: x + G.U.rand(-r, r) * 1.3, y: y - G.U.rand(0.05, P.low ? 0.3 : 0.95) * h, vx: G.U.rand(-1, 1) * P.spread * 0.5,
          vy: -P.up * G.U.rand(0.6, 1.2), t: 0, life: P.life * G.U.rand(0.7, 1.2), c, r: P.r * G.U.rand(0.8, 1.3) * G.Sprites.PX, P });
      }
    }
  }

  // ---------------- para quién ----------------
  /** Opciones de dibujo (Animator.draw) para tu compañero o el de otro jugador. */
  function forPlayer(pl, t) {
    const o = {};
    // De noche (systems/night.js), los detalles brillan más.
    const night = G.Night ? G.Night.level(G.Game.st.time || 0) : 0;
    const d = pl.anim ? pl.anim.dex : pl.dex;       // el del sprite: megas y primigenios llevan otro
    if (SPOTS[d] && !pl.dead) o.emit = { dex: d, level: emitLevel(d, t) * (1 + 0.8 * night), color: spotColor(d) };
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
    const d = e.anim ? e.anim.dex : e.dex;
    if (SPOTS[d]) o.emit = { dex: d, level: emitLevel(d, t + e.id), color: spotColor(d) };
    if (e.shiny) { const s = sweep(t, (e.id % 9) * 0.37); if (s >= 0) o.sweep = s; }
    if (legend) o.glow = '#ffd23f';
    else if (e.boss) o.glow = 'rgba(255,90,90,.9)';
    return o;
  }
  /** ¿Lleva partículas? (los mismos que forEnemy, más los jugadores) */
  const fancy = e => !!(e.boss || e.shiny || e.legend);

  return { SPOTS, PARTS, SPECIAL, emissive, emitLevel, spotColor, emit, spotEmit, special, update, draw, clear, sweep, drawSweep, forPlayer, forEnemy, fancy };
})();
