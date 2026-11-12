/* ============ vfx-plus.js — el rediseño propio de cada ataque evolucionado («… +») ============
 * vfx.js y fx.js dan a todos los «+» el mismo envoltorio (borde de luz, destello al
 * lanzar, chispas, aro doble). Aquí va lo que es de CADA uno: la misma forma y los
 * mismos colores que su ataque normal, pero más trabajada.
 *
 *   shape  su silueta (una forma nueva de G.VFX.SHAPES, a píxeles como las demás)
 *   trail  lo que va soltando: brasas que suben, gotas que caen, humo, chispas en zigzag...
 *   hit    su fotograma de impacto al golpear
 *   y, en los que no son proyectiles: mark / edge / bits / floor / rope / dust (golpes),
 *   path (embestidas), ray (rayos) y area (zonas): ver las recetas de REC, abajo.
 *
 * Sólo se ve: nada de aquí toca daño, radios ni hitboxes. Sale de m.evolved por
 * G.VFX.forMove (campo evo), así que los compañeros lo ven igual (ghostCast).
 * En calidad baja queda la silueta con su borde; ni rastro, ni estela, ni impacto.
 * Inventario y diseño de cada uno: docs/ATAQUES-PLUS.md.
 */
G.VFXPlus = (() => {
  const S = G.VFX.SHAPES, PAL = G.VFX.PAL;
  const H = (a, b, c) => G.U.hash(a, b, c);
  const R = (a, b) => G.U.rand(a, b);
  const TAU = 6.2832;

  // ---------------- ayudas para pintar formas ----------------

  /** Filas de letras (o d m l w L; el punto es hueco), como el puño y el corazón de vfx.js. */
  const rows = (P, a, ox = 0, oy = 0) => a.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.') P.set(x + ox, y + oy, c); }));
  /** Disco a capas: [[radio, letra], ...] de dentro afuera. */
  const disc = (P, cx, cy, bands) => P.fill((x, y) => {
    const d = Math.hypot(x - cx, y - cy);
    for (const [r, c] of bands) if (d < r) return c;
    return null;
  });
  /** Burbujita de 3×3. */
  const bub = (P, x, y) => { P.set(x - 1, y, 'l'); P.set(x + 1, y, 'm'); P.set(x, y - 1, 'l'); P.set(x, y + 1, 'm'); P.set(x, y, 'L'); };

  // ---------------- siluetas de los proyectiles «+» ----------------
  // Todas miran a la DERECHA, como las de vfx.js.

  // Ascuas +: la llama se abre en dos lenguas, con el centro al blanco y una brasa suelta.
  S.fire2 = { w: 17, h: 13, frames: 3, dir: true, gen(P, f) {
    for (const s of [-1, 1]) for (let x = 1; x <= 9; x++) {
      const t = (x - 1) / 8, th = 0.4 + t * 1.9 + (H(x, f, s + 4) - 0.5) * 0.8;
      const yc = 6 + s * (1 - t) * 2.9 + Math.sin(x * 1.3 + f * 2.1 + s) * 0.6 * (1 - t);
      for (let y = 0; y < P.h; y++) {
        const d = Math.abs(y - yc);
        if (d <= th) P.set(x, y, t < 0.25 ? 'd' : d < th * 0.4 && t > 0.45 ? 'l' : 'm');
      }
    }
    disc(P, 12, 6, [[1.4, 'w'], [2.6, 'l'], [3.6, 'm'], [4.4, 'd']]);
    P.set(1 + f, 6, 'l');
    P.outline();
  } };

  // Pistola Agua +: gota más llena, con sombra abajo y gotitas que la siguen.
  S.drop2 = { w: 15, h: 11, frames: 2, dir: true, gen(P, f) {
    for (let x = 3; x <= 8; x++) {
      const th = (x - 3) / 5 * 2.9;
      for (let y = 0; y < P.h; y++) { const d = Math.abs(y - 5); if (d <= th) P.set(x, y, d < th * 0.45 ? 'l' : 'm'); }
    }
    P.fill((x, y) => { const d = Math.hypot(x - 9.5, y - 5); return d < 1.7 ? 'l' : d < 3.6 ? (y > 6 ? 'd' : 'm') : null; });
    P.set(9, 2, 'w'); P.set(10, 2, 'w'); P.set(11, 3, 'w'); P.set(12, 4, 'w');
    P.set(1, 1 + f, 'l'); P.set(1, 9 - f, 'l');
    P.outline();
  } };

  // Impactrueno +: el rayo se bifurca.
  S.bolt2 = { w: 17, h: 12, frames: 2, dir: true, gen(P, f) {
    const m = f ? [[0, 5], [4, 9], [7, 3], [11, 8], [16, 5]] : [[0, 6], [4, 2], [7, 8], [11, 3], [16, 6]];
    const b = f ? [[7, 3], [10, 1], [13, 2]] : [[7, 8], [10, 10], [13, 9]];
    for (let i = 0; i < b.length - 1; i++) P.line(b[i][0], b[i][1], b[i + 1][0], b[i + 1][1], 'l');
    for (let i = 0; i < m.length - 1; i++) P.line(m[i][0], m[i][1], m[i + 1][0], m[i + 1][1], 'w', 1, 'l');
    P.outline();
  } };

  // Confusión +: espiral de dos brazos.
  S.spiral2 = { w: 15, h: 15, frames: 2, spin: true, gen(P, f) {
    for (const arm of [0, Math.PI]) for (let t = 0.8; t < 6.2; t += 0.1) {
      const a = t * 1.2 + arm + f * 0.6, r = t * 1.02;
      P.set(7 + Math.cos(a) * r, 7 + Math.sin(a) * r, t > 4.6 ? 'm' : 'l');
    }
    P.set(7, 7, 'w'); P.set(6, 7, 'w'); P.set(8, 7, 'w'); P.set(7, 6, 'w'); P.set(7, 8, 'w');
    P.outline();
  } };

  // Residuos +: pegote que burbujea por arriba y chorrea por abajo.
  S.blob2 = { w: 14, h: 15, frames: 2, gen(P, f) {
    P.fill((x, y) => {
      const dx = x - 6.5, dy = y - 7.5, a = Math.atan2(dy, dx), d = Math.hypot(dx, dy);
      const Rr = 4.3 + Math.sin(a * 4 + f * 2) * 0.5;
      if (d > Rr) return null;
      const lit = (-dx * 0.6 - dy * 0.8) / Rr;
      return lit > 0.45 ? 'l' : lit > -0.3 ? 'm' : 'd';
    });
    P.set(5, 6, 'w'); P.set(4, 6, 'w'); P.set(5, 5, 'w');
    bub(P, 3, 1 + f); bub(P, 10, 2 - f);
    P.set(5, 12, 'm'); if (f) P.set(5, 13, 'm');
    P.set(8, 12, 'm'); P.set(8, 13, 'd'); if (!f) P.set(8, 14, 'd');
    P.outline();
  } };

  // Picotazo Veneno +: aguijón con dos pares de púas.
  S.needle2 = { w: 15, h: 7, dir: true, gen(P) {
    rows(P, ['.d....d........',
             '..d....d.......',
             '...lllllllllw..',
             '..mmmmmmmmmmwww',
             '..d....d.......',
             '.d....d........']);
    P.outline();
  } };

  // Lanzarrocas +: roca agrietada con dos esquirlas que la acompañan.
  S.rock2 = { w: 14, h: 13, frames: 3, spin: true, gen(P, f) {
    const r = [0, 1, 2, 3, 4, 5, 6].map(i => 3.7 + H(i, f, 9) * 1.3);
    P.fill((x, y) => {
      const dx = x - 6.5, dy = y - 6, a = (Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI) * 6;
      const i = Math.floor(a), t = a - i, Rr = r[i] * (1 - t) + r[(i + 1) % 6] * t, d = Math.hypot(dx, dy);
      if (d > Rr) return null;
      const lit = (-dx * 0.6 - dy * 0.8) / Rr;
      return lit > 0.35 ? 'l' : lit > -0.3 ? 'm' : 'd';
    });
    for (const [x, y] of [[5, 4], [6, 5], [6, 6], [7, 7], [8, 7]]) P.set(x, y, 'o');   // grieta
    P.set(5, 3, 'w'); P.set(4, 4, 'w');
    for (const k of [0, 1]) {
      const a = f * 2.1 + k * Math.PI, x = 6.5 + Math.cos(a) * 5.6, y = 6 + Math.sin(a) * 4.8;
      P.set(x, y, 'l'); P.set(x + 1, y, 'm');
    }
    P.outline();
  } };

  // Esfera Aural +: la esfera con un aro de aura que le da vueltas.
  S.aura2 = { w: 15, h: 15, frames: 3, gen(P, f) {
    disc(P, 7, 7, [[1.5, 'w'], [2.8, 'l'], [4, 'm'], [4.8, 'd']]);
    P.set(5, 5, 'w');
    const tilt = -0.6 + f * 0.6, ct = Math.cos(tilt), st = Math.sin(tilt);
    for (let a = 0; a < TAU; a += 0.1) {
      const ex = Math.cos(a) * 6.6, ey = Math.sin(a) * 2.2;
      const x = Math.round(7 + ex * ct - ey * st), y = Math.round(7 + ex * st + ey * ct);
      if (Math.sin(a) > -0.1) P.set(x, y, Math.sin(a) > 0.55 ? 'w' : 'l');     // por delante de la esfera
      else if (!P.get(x, y)) P.set(x, y, 'm');                                  // por detrás: sólo lo que asoma
    }
    P.outline();
  } };

  // Bola Sombra +: el centro encendido y jirones largos que giran.
  S.shadow2 = { w: 15, h: 15, frames: 3, gen(P, f) {
    disc(P, 7, 7, [[1.5, 'w'], [2.6, 'l'], [3.6, 'm'], [4.6, 'd']]);
    for (let k = 0; k < 6; k++) for (let s = 0; s < 4; s++) {
      const a = k * 1.047 + f * 0.7 + s * 0.24, r = 4.8 + s * 0.7;
      P.set(7 + Math.cos(a) * r, 7 + Math.sin(a) * r, s < 2 ? 'm' : 'd');
    }
    P.outline();
  } };

  // Pulso Dragón +: el anillo lleva delante un colmillo (punta de flecha): ahora apunta.
  S.dpulse2 = { w: 17, h: 13, frames: 2, dir: true, gen(P, f) {
    P.fill((x, y) => {
      const d = Math.hypot(x - 6, y - 6);
      if (Math.abs(d - (4.6 + f * 0.5)) < 0.75) return 'm';
      if (Math.abs(d - (2.6 + f * 0.4)) < 0.65) return 'l';
      return d < 1.1 ? 'w' : null;
    });
    P.line(11, 2, 15, 6, 'l'); P.line(11, 10, 15, 6, 'l');
    P.line(10, 2, 14, 6, 'm'); P.line(10, 10, 14, 6, 'm');
    P.set(14, 6, 'w'); P.set(15, 6, 'w'); P.set(16, 6, 'w');
    P.outline();
  } };

  // Bomba Lodo +: burbuja con el lodo dentro y burbujas pegadas.
  S.bomb2 = { w: 13, h: 13, frames: 2, gen(P, f) {
    const rx = 4.7 + f * 0.3, ry = 4.7 - f * 0.3;
    P.fill((x, y) => { const e = Math.hypot((x - 6) / rx, (y - 6.5) / ry); return e <= 1 ? (e > 0.76 ? 'm' : 'L') : null; });
    disc(P, 6.5, 7.3, [[1.1, 'm'], [2.3, 'd']]);
    P.set(3, 3, 'w'); P.set(4, 3, 'w'); P.set(3, 4, 'w'); P.set(9, 9, 'l');
    bub(P, 10, 2 + f); bub(P, 2, 10 - f);
    P.outline();
  } };

  // Escaldar +: nube de vapor con el agua hirviendo dentro y vapor que se escapa.
  S.scald2 = { w: 15, h: 13, frames: 2, gen(P, f) {
    const puffs = [[4.5, 8.5, 3], [9, 8.5, 3.3], [6.8, 6.3 - f * 0.5, 3], [11.2, 6.3 + f * 0.5, 2.2]];
    P.fill((x, y) => puffs.some(([a, b, r]) => Math.hypot(x - a, y - b) < r) ? 'l' : null);
    for (const [a, b] of puffs) P.set(a - 1, b - 1, 'w');
    disc(P, 7.6, 8.5, [[1, 'w'], [2.1, 'm']]);
    P.set(4, 1 + f, 'w'); P.set(10, 2 - f, 'w');
    P.outline();
  } };

  // Vendaval +: cuatro arcos de viento en vez de tres, más cerrados.
  S.gale2 = { w: 15, h: 15, frames: 2, spin: true, gen(P, f) {
    P.arc(7, 7, 6.4, -0.8 + f * 0.7, 3.2 + f * 0.7, 'm');
    P.arc(7, 7, 5, -0.4 + f * 0.7, 3 + f * 0.7, 'l');
    P.arc(7, 7, 3.7, 2.6 + f * 0.7, 5.9 + f * 0.7, 'w');
    P.arc(7, 7, 2.2, 0.4 + f, 3.4 + f, 'l');
    P.set(7, 7, 'w');
  } };

  // Hidropulso +: aro a trazos por fuera, aro lleno y una gota en el centro.
  S.wpulse2 = { w: 15, h: 15, frames: 2, gen(P, f) {
    for (let i = 0; i < 24; i++) {
      if (i % 4 === 3) continue;
      const a = i / 24 * TAU + f * 0.13;
      P.set(7 + Math.cos(a) * (6.2 + f * 0.4), 7 + Math.sin(a) * (6.2 + f * 0.4), 'm');
    }
    P.fill((x, y) => {
      const d = Math.hypot(x - 7, y - 7);
      if (Math.abs(d - (3.9 + f * 0.4)) < 0.7) return 'l';
      return d < 1.8 ? (d < 1 ? 'w' : 'l') : null;
    });
  } };

  // Roca Afilada +: hoja de piedra con arista, sombra y la cola partida.
  S.edge2 = { w: 15, h: 9, dir: true, gen(P) {
    P.fill((x, y) => {
      if (Math.abs(x - 7) / 7.4 + Math.abs(y - 4) / 4.4 > 1 || (x < 4 && y === 4)) return null;
      return y < 4 ? 'l' : y > 5 ? 'd' : 'm';
    });
    for (let x = 7; x <= 13; x++) P.set(x, 4, 'w');
    P.set(5, 2, 'w'); P.set(6, 2, 'w');
    P.outline();
  } };

  // ---------------- fotogramas de impacto y motas ----------------

  // Llamarada de cuatro lenguas que se abre.
  S.hflare = { w: 15, h: 15, frames: 3, gen(P, f) {
    const L = [3.5, 5.5, 6.5][f];
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + k * Math.PI / 2;
      P.line(7, 7, 7 + Math.cos(a) * L, 7 + Math.sin(a) * L, 'l', 1, 'm');
    }
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; P.line(7, 7, 7 + Math.cos(a) * L * 0.55, 7 + Math.sin(a) * L * 0.55, 'l'); }
    disc(P, 7, 7, [[[2.4, 1.8, 1.1][f], 'w']]);
    P.outline();
  } };
  // Corona de agua: salpicadura que sube y se abre.
  S.hcrown = { w: 17, h: 12, frames: 3, gen(P, f) {
    const hs = [[1, 2, 3, 2, 1], [2, 4, 6, 4, 2], [1, 2, 3, 2, 1]][f], gap = 2 + f * 0.8, lift = f === 2 ? 3 : 0;
    for (let i = 0; i < 5; i++) {
      const x = Math.round(8 + (i - 2) * gap);
      for (let h = 0; h <= hs[i]; h++) P.set(x, 10 - lift - h, h === hs[i] ? 'w' : h ? 'l' : 'm');
    }
    P.outline();
  } };
  // Chispazo: cuatro brazos en zigzag (en cruz y luego en aspa).
  S.hzap = { w: 15, h: 15, frames: 2, gen(P, f) {
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2 + (f ? Math.PI / 4 : 0), ca = Math.cos(a), sa = Math.sin(a);
      const pt = (d, o) => [7 + ca * d - sa * o, 7 + sa * d + ca * o];
      const pts = [pt(1.5, 0), pt(3, 1.4), pt(4.6, -1.2), pt(6.4, 0.4)];
      for (let i = 0; i < 3; i++) P.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], i === 2 ? 'l' : 'w');
    }
    disc(P, 7, 7, [[1.7, 'w']]);
    P.outline();
  } };
  // Pegote que se aplasta contra el suelo.
  S.hsplat = { w: 17, h: 11, frames: 2, gen(P, f) {
    P.fill((x, y) => {
      const dx = (x - 8) / (5 + f * 1.6), dy = (y - 6) / (2.6 + f * 0.7), a = Math.atan2(dy, dx);
      if (Math.hypot(dx, dy) > 1 + Math.sin(a * 5 + f) * 0.2) return null;
      return dy < -0.3 ? 'l' : dy > 0.45 ? 'd' : 'm';
    });
    P.set(6, 5, 'w');
    if (f) { P.set(1, 2, 'm'); P.set(15, 3, 'm'); P.set(8, 0, 'l'); }
    P.outline();
  } };
  // Cruz fina de un pinchazo.
  S.hcross = { w: 11, h: 11, frames: 2, gen(P, f) {
    const L = 2 + f * 2;
    for (let i = 1; i <= L; i++) for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) P.set(5 + a * i, 5 + b * i, i === L ? 'm' : 'l');
    P.set(5, 5, 'w');
    if (f) for (const [a, b] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) P.set(5 + a, 5 + b, 'l');
  } };
  // Sombra que revienta en seis jirones.
  S.hgloom = { w: 17, h: 17, frames: 3, gen(P, f) {
    const Rr = [2.5, 4.6, 6.2][f], r = [1.9, 1.7, 1.2][f];
    for (let k = 0; k < 6; k++) {
      const a = k * 1.047 + f * 0.4;
      disc(P, 8 + Math.cos(a) * Rr, 8 + Math.sin(a) * Rr, [[r, f < 2 ? 'm' : 'd']]);
    }
    if (f < 2) disc(P, 8, 8, [[1.4, 'w'], [2.5, 'l']]);
    P.outline();
  } };
  // Dos puntas de flecha (el rugido que sigue de largo).
  S.hchev = { w: 13, h: 13, frames: 2, dir: true, gen(P, f) {
    for (const j of [0, 1]) {
      const x0 = 2 + j * 4 + f;
      P.line(x0, 2, x0 + 4, 6, j ? 'w' : 'l'); P.line(x0, 10, x0 + 4, 6, j ? 'w' : 'l');
    }
    P.outline();
  } };
  // Tres púas de piedra que salen del suelo.
  S.hspikes = { w: 15, h: 13, frames: 3, gen(P, f) {
    const hs = [[2, 3, 2], [4, 7, 5], [5, 9, 6]][f], xs = [3, 7, 11];
    for (let i = 0; i < 3; i++) {
      const h = hs[i], cx = xs[i];
      for (let y = 0; y < h; y++) {
        const w = Math.round((1 - y / h) * 2.2);
        for (let x = -w; x <= w; x++) P.set(cx + x, 11 - y, x < 0 ? 'l' : x > 0 ? 'd' : 'm');
      }
      P.set(cx, 11 - h, 'w');
    }
    P.outline();
  } };
  // Motas: esquirla, arito, burbujita y escama.
  S.chip = { w: 7, h: 6, spin: true, gen(P) { rows(P, ['.......', '..ll...', '.lmmd..', '..mdd..', '...d...']); P.outline(); } };
  S.ringlet = { w: 7, h: 7, gen(P) { P.fill((x, y) => Math.abs(Math.hypot(x - 3, y - 3) - 2.4) < 0.6 ? 'l' : null); P.set(1, 2, 'w'); P.set(2, 1, 'w'); } };
  S.bubblet = { w: 7, h: 7, gen(P) {
    P.fill((x, y) => { const d = Math.hypot(x - 3, y - 3); return Math.abs(d - 2.3) < 0.6 ? 'm' : d < 1.8 ? 'L' : null; });
    P.set(2, 2, 'w');
  } };
  S.scale = { w: 7, h: 7, spin: true, gen(P) {
    P.fill((x, y) => Math.abs(x - 3) + Math.abs(y - 3) <= 2 ? (y < 3 ? 'l' : 'm') : null);
    P.set(3, 2, 'w');
    P.outline();
  } };

  // ---------------- el resto de proyectiles: la forma normal, crecida y con su detalle ----------------
  // grow: pinta la forma normal un píxel hacia dentro de una rejilla 2 píxeles mayor y
  // le añade lo suyo encima (extra). Así el «+» es la misma forma, más trabajada.

  function grow(base, extra, o = {}) {
    const B = S[base];
    return { w: B.w + 2, h: B.h + 2, frames: o.frames || B.frames, dir: B.dir, spin: B.spin, gen(P, f) {
      const Q = { w: B.w, h: B.h, set: (x, y, c) => P.set(x + 1, y + 1, c), get: (x, y) => P.get(Math.round(x) + 1, Math.round(y) + 1),
        fill(fn) { for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) { const c = fn(x, y); if (c) P.set(x + 1, y + 1, c); } },
        outline() {}, line: P.line, arc: P.arc };
      B.gen(Q, f % (B.frames || 1));
      extra(P, f);
      if (o.ol !== false) P.outline();
    } };
  }
  /** n puntos repartidos en una elipse (c2: color de los impares). */
  const sat = (P, cx, cy, rx, ry, k, ph, c, c2) => {
    for (let i = 0; i < k; i++) { const a = ph + i * TAU / k; P.set(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, i % 2 && c2 ? c2 : c); }
  };
  const dots = (P, c, ...pts) => { for (const [x, y] of pts) P.set(x, y, c); };

  // ---- ráfaga radial (nova) ----
  S.voice2 = grow('note', P => { P.arc(3, 7, 9.4, -0.42, 0.42, 'd'); dots(P, 'w', [7, 7], [10, 7]); });
  S.heat2 = grow('wind', (P, f) => { P.arc(7, 6, 5.8, -0.6 + f * 0.7, 1.4 + f * 0.7, 'd'); P.set(7, 6, 'w'); P.set(5 + f, 8, 'l'); P.set(9, 4 + f, 'm'); }, { ol: false });
  S.bubble2 = grow('bubble', (P, f) => { bub(P, 10, 2 + f); dots(P, 'w', [8, 8], [5, 4]); });
  S.eye2 = grow('eye', P => { for (const x of [4, 8, 12]) { P.set(x, 0, 'l'); P.set(x, 10, 'l'); } P.set(8, 5, 'w'); });
  S.mud2 = grow('blob', (P, f) => { dots(P, 'd', [5, 8], [8, 5]); P.set(9, 9, 'w'); P.set(f, 6, 'm'); P.set(13 - f, 4, 'm'); });
  S.fstar2 = grow('star', P => { for (const i of [2, 3]) for (const [a, b] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) P.set(6 + a * i, 6 + b * i, i === 3 ? 'w' : 'l'); }, { ol: false });
  S.dring2 = grow('ring', P => { disc(P, 7, 7, [[1, 'w'], [2.1, 'd']]); dots(P, 'l', [7, 0], [7, 14], [0, 7], [14, 7]); dots(P, 'm', [7, 1], [7, 13], [1, 7], [13, 7]); }, { ol: false });
  S.lava2 = grow('blob', (P, f) => { dots(P, 'd', [5, 3], [6, 3], [8, 4]); dots(P, 'w', [6, 6], [7, 7], [5, 8]); P.set(7, f, 'l'); });

  // ---- teledirigidos (homing) ----
  S.eball2 = grow('ball', (P, f) => { sat(P, 6, 6, 5.6, 5.6, 3, f * 0.7, 'l'); sat(P, 6, 6, 4.6, 4.6, 3, f * 0.7 + 0.25, 'w'); }, { frames: 3 });
  S.pearl2 = grow('mist', P => { disc(P, 7.5, 7, [[1, 'w'], [2.2, 'm']]); });
  S.aslash2 = grow('crescent', P => {
    for (let a = -0.95; a <= 0.95; a += 0.12) P.set(7.5 + Math.cos(a) * 4.5, 6 + Math.sin(a) * 4.5, 'w');
    dots(P, 'l', [2, 2], [1, 6], [2, 10]);
  });
  S.ishard2 = grow('shard', P => { dots(P, 'l', [5, 0], [6, 7]); dots(P, 'w', [6, 1], [14, 4], [3, 4], [4, 4], [5, 4]); P.set(5, 8, 'm'); });
  S.sclaw2 = grow('claw', P => { P.line(0, 9, 3, 3, 'l'); dots(P, 'w', [11, 12], [13, 11]); });
  S.kiss2 = grow('heart', P => { dots(P, 'w', [0, 3], [10, 3], [5, 0], [7, 3]); dots(P, 'l', [0, 4], [10, 4]); });
  S.spunch2 = grow('fist', P => { for (const y of [1, 9]) { P.set(0, y, 'd'); P.set(1, y, 'm'); } dots(P, 'w', [10, 4], [10, 7]); });
  S.moon2 = grow('ball', (P, f) => { dots(P, 'w', [5, 4], [4, 5], [4, 6], [4, 7], [5, 8]); dots(P, 'l', [6, 6], [7, 6]); sat(P, 6, 6, 6, 6, 4, 0.785 + f * 0.4, 'w'); });

  // ---- los que rebotan (bounce) ----
  S.seed2 = grow('seed', P => { dots(P, 'l', [4, 0], [7, 0], [8, 1]); P.set(3, 1, 'w'); dots(P, 'o', [5, 7], [6, 8], [5, 9]); });
  S.eorb2 = grow('ball', (P, f) => { sat(P, 6, 6, 5.8, 5.8, 8, f * 0.4, 'w', 'l'); });
  S.acid2 = grow('drop', (P, f) => { dots(P, 'L', [9, 5], [10, 6]); bub(P, 3, 2 + f); P.set(2, 8, 'l'); });
  S.signal2 = grow('star', (P, f) => { sat(P, 6, 6, 5.6, 5.6, 8, f * 0.39, 'w', 'm'); }, { ol: false });
  S.gem2 = grow('shard', P => { dots(P, 'w', [6, 3], [7, 2], [13, 2]); dots(P, 'd', [8, 5], [9, 6]); dots(P, 'l', [13, 1], [12, 2], [14, 2], [13, 3]); });
  S.mirror2 = grow('prism', (P, f) => { for (let i = 0; i < 7; i++) { const x = 3 + i + f * 2 - 1, y = 9 - i; if (P.get(x, y)) P.set(x, y, 'w'); } }, { frames: 2 });
  S.pshock2 = grow('prism', P => { disc(P, 6, 6, [[1, 'w'], [2.2, 'd']]); dots(P, 'l', [1, 1], [11, 1], [1, 11], [11, 11]); });

  // ---- abanicos (cone) ----
  S.flame2 = grow('fire', (P, f) => { dots(P, 'w', [10, 6], [11, 6], [12, 6]); P.set(9, 6, 'l'); P.set(1, 3 - f % 2, 'd'); P.set(0, 8, 'd'); P.set(3, 1 + f % 2, 'm'); });
  S.bbeam2 = grow('bubble', P => { sat(P, 6, 6, 2, 2, 8, 0, 'l'); P.set(9, 3, 'w'); });
  S.dbreath2 = grow('fire', P => { dots(P, 'w', [3, 6], [4, 5], [5, 7], [6, 6], [7, 5]); });
  S.bliz2 = grow('snowflake', P => { sat(P, 6, 6, 6, 6, 6, 0, 'w'); dots(P, 'w', [6, 5], [5, 6], [7, 6], [6, 7]); });
  S.silver2 = grow('wind', (P, f) => { P.arc(7, 6, 5.9, 2.4 + f * 0.7, 4.6 + f * 0.7, 'm'); sat(P, 7, 6, 4.6, 4.6, 5, f * 0.7, 'w'); }, { ol: false });

  // ---- órbitas (orbit) ----
  S.fspin2 = grow('ball', (P, f) => { for (let i = 1; i <= 5; i++) { const a = 2.1 + i * 0.3 + f * 0.2; P.set(6 + Math.cos(a) * 5.8, 6 + Math.sin(a) * 5.8, i < 3 ? 'l' : 'm'); } P.set(6, 0, 'l'); });
  S.lstorm2 = grow('spiral', (P, f) => { for (let k = 0; k < 3; k++) { const a = f * 0.6 + k * 2.094, x = 7 + Math.cos(a) * 6.3, y = 7 + Math.sin(a) * 6.3; P.set(x, y, 'w'); P.set(x, y + 1, 'l'); } });
  S.gust2 = grow('feather', P => { for (let x = 2; x <= 12; x++) P.set(x, 4, 'w'); dots(P, 'd', [0, 4], [1, 4]); dots(P, 'l', [4, 1], [8, 0]); dots(P, 'm', [4, 7], [8, 8]); });
  S.ancient2 = grow('ball', (P, f) => { dots(P, 'd', [5, 5], [7, 5], [6, 7], [5, 8], [7, 8]); if (f) P.set(6, 6, 'w'); sat(P, 6, 6, 5.9, 5.9, 4, 0.785, 'm'); });

  // ---- bumeranes (boomerang) ----
  S.rleaf2 = grow('leaf', P => { for (let x = 3; x <= 10; x++) P.set(x, 4, 'w'); dots(P, 'd', [5, 2], [8, 2], [5, 6], [8, 6], [0, 4]); P.set(13, 4, 'w'); });
  S.bone2 = { w: 15, h: 9, spin: true, gen(P) {
    rows(P, ['.ll.......ll.', 'lwwl.....lwwl', 'lwwwlllllwwwl', '.lwwwwwwwwwl.', 'lwwwmmmmmwwwl', 'lmml.....lmml', '.mm.......mm.'], 1, 1);
    P.outline();
  } };
  S.pcut2 = grow('crescent', P => { for (let a = -0.9; a <= 0.9; a += 0.12) P.set(7.5 + Math.cos(a) * 4.5, 6 + Math.sin(a) * 4.5, 'w'); P.set(3, 6, 'l'); P.set(1, 6, 'm'); });

  // ---- minas (mine) ----
  S.web2 = grow('web', P => { sat(P, 6, 6, 6, 6, 8, 0, 'l'); sat(P, 6, 6, 4.4, 4.4, 4, 0.39, 'w'); }, { ol: false });
  S.spike2 = grow('star', P => { disc(P, 6, 6, [[1.6, 'd']]); dots(P, 'w', [6, 6], [6, 0], [6, 12], [0, 6], [12, 6]); });
  S.tspike2 = grow('star', P => { dots(P, 'm', [6, 12], [4, 11]); bub(P, 10, 2); });

  // ---- meteoros (meteor) ----
  S.slide2 = grow('boulder', P => { dots(P, 'o', [6, 6], [7, 7], [8, 7], [9, 8], [9, 9]); dots(P, 'm', [1, 2], [0, 5]); dots(P, 'l', [2, 2], [3, 0]); });
  S.hail2 = grow('shard', P => { dots(P, 'w', [7, 3], [8, 3]); P.set(5, 5, 'd'); sat(P, 7, 4, 6.8, 3.9, 4, 0.785, 'w'); });
  S.mmash2 = grow('rock', (P, f) => { dots(P, 'w', [5, 4], [4, 4], [6, 4], [5, 3], [5, 5], [1, 7]); P.set(0, 5 + f % 2, 'l'); P.set(0, 8 - f % 2, 'm'); });

  // ---- torretas (turret) ----
  S.wisp2 = grow('ball', (P, f) => { dots(P, 'd', [4, 6], [7, 6]); P.set(6 + f, 0, 'l'); dots(P, 'm', [5, 1], [7, 1]); });
  S.sub2 = { w: 13, h: 13, gen(P) {
    rows(P, ['...mm.mm...', '..mllmllm..', '..mlllllm..', '.mlldldllm.', '.mlllllllm.', '..mlllllm..', '.mmlllllmm.', 'mllmlllmllm', '.mmlllllmm.', '..mllmllm..', '..mmm.mmm..'], 1, 1);
    P.outline();
  } };

  // ---- más fotogramas de impacto y motas ----
  // Estallido de ocho puntas.
  S.hburst = { w: 15, h: 15, frames: 3, gen(P, f) {
    const r0 = [1, 3, 5][f], r1 = [4, 6, 7][f];
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + f * 0.2; P.line(7 + Math.cos(a) * r0, 7 + Math.sin(a) * r0, 7 + Math.cos(a) * r1, 7 + Math.sin(a) * r1, k % 2 ? 'l' : 'w'); }
    if (!f) disc(P, 7, 7, [[2, 'w']]);
    P.outline();
  } };
  // Grietas en el suelo.
  S.hcrack = { w: 17, h: 9, frames: 2, gen(P, f) {
    const k = f ? 1 : 0.6;
    for (const [x, y] of [[1, 2], [15, 3], [4, 7], [13, 7], [8, 0]]) P.line(8, 4, 8 + (x - 8) * k, 4 + (y - 4) * k, 'o');
    P.set(8, 4, 'd');
  } };
  // Colmillos que se cierran.
  S.hfang = { w: 13, h: 11, frames: 3, gen(P, f) {
    const gap = [3, 1, 0][f];
    for (let t = 0; t < 4; t++) {
      const x = 2 + t * 3, up = 4 - gap, lo = 6 + gap;
      P.set(x, up, 'w'); P.set(x - 1, up - 1, 'w'); P.set(x, up - 1, 'w'); P.set(x + 1, up - 1, 'l');
      P.set(x + 1, lo, 'w'); P.set(x, lo + 1, 'w'); P.set(x + 1, lo + 1, 'w'); P.set(x + 2, lo + 1, 'l');
    }
    P.outline();
  } };
  // Corte en aspa.
  S.hx = { w: 13, h: 13, frames: 2, gen(P, f) {
    const L = 3 + f * 2;
    for (let i = -L; i <= L; i++) for (const s of [1, -1]) { P.set(6 + i + 1, 6 + i * s, 'l'); P.set(6 + i, 6 + i * s, Math.abs(i) === L ? 'm' : 'w'); }
  } };
  // Estrella de cuatro puntas que crece.
  S.hstar = { w: 13, h: 13, frames: 3, gen(P, f) {
    const L = [2, 4, 6][f], D = [1, 2, 2][f];
    for (let i = 1; i <= L; i++) for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) P.set(6 + a * i, 6 + b * i, i === L ? 'm' : 'l');
    for (let i = 1; i <= D; i++) for (const [a, b] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) P.set(6 + a * i, 6 + b * i, 'l');
    P.set(6, 6, 'w');
  } };
  // Corazón que late.
  S.hheart = { w: 11, h: 10, frames: 2, gen(P, f) {
    if (f) rows(P, ['.ll...ll.', 'lwll.llll', 'lllllllll', 'lllllllll', '.lllllll.', '..lllll..', '...lll...', '....l....'], 1, 1);
    else rows(P, ['.l.l.', 'lwlll', '.lll.', '..l..'], 3, 3);
    P.outline();
  } };
  // Cuatro zarpazos.
  S.hclaw4 = { w: 17, h: 13, frames: 2, gen(P, f) {
    for (let i = 0; i < 4; i++) { const x0 = 1 + i * 3.4; P.line(f ? x0 : x0 + 2, f ? 11 : 6, x0 + 4, 1, 'w', 1, 'l'); }
    P.outline();
  } };
  // Nube de pelea.
  S.hpow = { w: 15, h: 13, frames: 2, gen(P, f) {
    const puffs = [[5, 7, 3], [9, 7, 3], [7, 5, 3], [7, 9, 2.5]];
    P.fill((x, y) => puffs.some(([a, b, r]) => Math.hypot(x - a, y - b) < r + f * 0.6) ? 'l' : null);
    dots(P, 'w', [4, 5], [6, 3], [8, 5]);
    if (f) dots(P, 'w', [1, 2], [13, 3], [12, 11], [2, 11]);
    P.outline();
  } };
  // Tajo recto.
  S.hchop = { w: 17, h: 5, frames: 2, dir: true, gen(P, f) {
    const L = f ? 8 : 4;
    for (let x = 8 - L; x <= 8 + L; x++) P.set(x, 2, Math.abs(x - 8) === L ? 'l' : 'w');
    if (f) for (let x = 6; x <= 10; x++) { P.set(x, 1, 'l'); P.set(x, 3, 'l'); }
  } };
  S.leaflet = { w: 7, h: 5, spin: true, gen(P) { rows(P, ['.......', '..lll..', '.lwmmd.', '..mmm..']); P.outline(); } };
  S.heartlet = { w: 5, h: 5, gen(P) { rows(P, ['.l.l.', 'lwlll', 'lllll', '.lll.', '..l..']); } };

  // ---------------- lo que suelta cada uno por el camino ----------------
  // (P: su paleta; x, y: dónde va el proyectil; bx, by: hacia atrás.)

  const px = (x, y, c, o) => G.FX.px(x, y, c, o);
  const half = () => Math.random() < 0.5;
  const TRAILS = {
    // Fuego: brasas que suben y se apagan.
    embers(P, pal, x, y, bx) {
      for (let i = 0; i < 2; i++) {
        px(x + R(-4, 4) + bx * 4, y + R(-3, 3), P[i ? 3 : 4],
           { vx: bx * 25 + R(-12, 12), vy: R(-75, -40), life: R(0.35, 0.6), size: Math.random() < 0.3 ? 2 : 1, drag: 0.93 });
      }
    },
    // Agua: gotas que caen.
    droplets(P, pal, x, y, bx) {
      px(x + R(-3, 3), y + R(-2, 2), P[3], { vx: bx * 30 + R(-20, 20), vy: R(-50, -10), grav: 420, life: 0.45 });
      px(x + R(-3, 3), y + 2, P[4], { vx: bx * 15, vy: -15, grav: 420, life: 0.35 });
    },
    // Eléctrico: chispas en zigzag (cuatro píxeles quietos, en diente de sierra).
    zigzag(P, pal, x, y, bx, by) {
      const ox = R(-5, 5), oy = R(-5, 5);
      for (let i = 0; i < 4; i++) {
        const o = i % 2 ? 2 : -2;
        px(x + ox + bx * i * 3 - by * o, y + oy + by * i * 3 + bx * o, i < 2 ? P[4] : P[3], { life: 0.1 + i * 0.03, drag: 1 });
      }
    },
    // Psíquico: aritos que se quedan atrás.
    rings(P, pal, x, y) {
      if (half() && G.FX.spare(true)) G.FX.sp('ringlet', pal, x + R(-2, 2), y + R(-2, 2), { life: 0.3 });
      else px(x + R(-4, 4), y + R(-4, 4), P[4], { life: 0.25, drag: 1 });
    },
    // Veneno: gotas espesas que caen y alguna burbuja que sube.
    ooze(P, pal, x, y) {
      px(x + R(-3, 3), y + 2, P[half() ? 2 : 1], { vx: R(-8, 8), vy: R(10, 30), grav: 380, life: 0.4, size: Math.random() < 0.4 ? 2 : 1 });
      if (Math.random() < 0.4) px(x + R(-4, 4), y - 3, P[3], { vy: -32, life: 0.4 });
    },
    // Veneno fino: el surco del aguijón y una gota de vez en cuando.
    venom(P, pal, x, y, bx, by) {
      px(x + bx * 8, y + by * 8, P[3], { life: 0.16, drag: 1 });
      px(x + bx * 12, y + by * 12, P[2], { life: 0.22, drag: 1 });
      if (Math.random() < 0.35) px(x + bx * 6, y + by * 6 + 2, P[3], { vy: 10, grav: 300, life: 0.35 });
    },
    // Roca: piedrecitas que caen y polvo.
    pebbles(P, pal, x, y, bx) {
      px(x + R(-4, 4), y + R(-2, 4), P[half() ? 1 : 2], { vx: bx * 30 + R(-20, 20), vy: R(-60, -20), grav: 520, life: 0.45, size: 2 });
      px(x + R(-4, 4), y + R(-2, 4), P[3], { vx: bx * 15, vy: -12, life: 0.4 });
    },
    // Aura: llamitas azules que se quedan atrás.
    aurawisp(P, pal, x, y, bx, by) {
      for (let i = 0; i < 2; i++) {
        px(x + bx * 5 + R(-3, 3), y + by * 5 + R(-3, 3), P[i ? 3 : 4],
           { vx: bx * 70 + R(-10, 10), vy: by * 70 - 20, life: R(0.2, 0.32), size: i ? 2 : 1 });
      }
    },
    // Fantasma: humo morado, a bloques, que sube despacio.
    smoke(P, pal, x, y, bx) {
      px(x + R(-4, 4), y + R(-4, 4), P[half() ? 1 : 2], { vx: bx * 10 + R(-6, 6), vy: R(-28, -12), life: R(0.5, 0.75), size: half() ? 3 : 2, drag: 0.96 });
    },
    // Dragón: escamas que se desprenden.
    scales(P, pal, x, y, bx, by) {
      if (half() && G.FX.spare(true)) G.FX.sp('scale', pal, x + bx * 6 + R(-4, 4), y + by * 6 + R(-4, 4), { vx: bx * 30, vy: by * 30 + 10, life: 0.3, grav: 60, spin: R(-8, 8) });
      else px(x + bx * 6 + R(-4, 4), y + by * 6 + R(-4, 4), P[4], { vx: bx * 20, vy: by * 20, life: 0.2 });
    },
    // Veneno en burbujas: burbujitas que suben.
    fumes(P, pal, x, y) {
      if (Math.random() < 0.6 && G.FX.spare(true)) G.FX.sp('bubblet', pal, x + R(-4, 4), y + R(-3, 3), { vy: R(-45, -25), vx: R(-8, 8), life: 0.4 });
      else px(x + R(-4, 4), y + R(-3, 3), P[3], { vy: -35, life: 0.4 });
    },
    // Vapor: bloques claros que suben.
    steam(P, pal, x, y) {
      for (let i = 0; i < 2; i++) {
        px(x + R(-5, 5), y + R(-4, 2), i ? P[4] : P[3], { vx: R(-10, 10), vy: R(-55, -30), life: R(0.4, 0.6), size: 2, drag: 0.94 });
      }
    },
    // Viento: rayas cortas en la dirección en que va.
    gust(P, pal, x, y, bx, by) {
      const o = R(-8, 8);
      for (let i = 0; i < 4; i++) px(x - by * o + bx * (4 + i * 2), y + bx * o + by * (4 + i * 2), i < 2 ? P[4] : P[3], { life: 0.12 + i * 0.03, drag: 1 });
    },
    // Agua en ondas: aritos y una gota.
    ripples(P, pal, x, y, bx) {
      if (half() && G.FX.spare(true)) G.FX.sp('ringlet', pal, x + R(-3, 3), y + R(-3, 3), { life: 0.28, vy: 12 });
      else px(x + R(-3, 3), y, P[4], { vx: bx * 20, vy: -20, grav: 420, life: 0.35 });
    },
    // Piedra afilada: polvo y chispas del filo.
    grit(P, pal, x, y, bx) {
      px(x + R(-3, 3), y + R(-2, 3), P[2], { vx: bx * 25, vy: -15, grav: 300, life: 0.35 });
      if (half()) { const a = Math.random() * TAU; px(x, y, P[4], { vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, life: 0.14 }); }
    },
    // Planta: hojas que giran.
    leaves(P, pal, x, y, bx) {
      if (half() && G.FX.spare(true)) G.FX.sp('leaflet', pal, x + R(-4, 4), y + R(-4, 4), { vx: bx * 30 + R(-15, 15), vy: R(-10, 20), grav: 40, spin: R(-9, 9), life: 0.45 });
      else px(x + R(-4, 4), y + R(-4, 4), P[3], { vx: bx * 20, vy: 12, life: 0.35 });
    },
    // Hielo: escarcha que cae despacio.
    frost(P, pal, x, y) {
      for (let i = 0; i < 2; i++) px(x + R(-4, 4), y + R(-3, 3), i ? P[4] : P[3], { vx: R(-8, 8), vy: R(8, 30), life: R(0.35, 0.55), drag: 0.97 });
    },
    // Hada: corazoncitos que suben.
    hearts(P, pal, x, y) {
      if (half() && G.FX.spare(true)) G.FX.sp('heartlet', pal, x + R(-4, 4), y + R(-3, 3), { vy: R(-45, -25), life: 0.4 });
      else px(x + R(-4, 4), y + R(-3, 3), P[4], { vy: -20, life: 0.3 });
    },
    // Polvo de estrellas: destellos quietos y alguno que cae.
    stardust(P, pal, x, y) {
      px(x + R(-5, 5), y + R(-5, 5), P[4], { life: 0.22, drag: 1 });
      px(x + R(-4, 4), y, P[3], { vy: 25, life: 0.4 });
    },
    // Tierra: arena que cae.
    sand(P, pal, x, y, bx) {
      for (let i = 0; i < 2; i++) px(x + R(-4, 4), y + R(-2, 3), P[i ? 3 : 2], { vx: bx * 20 + R(-12, 12), vy: R(-10, 10), grav: 260, life: 0.35 });
    }
  };

  // ---------------- su impacto ----------------
  // (dx, dy: hacia dónde iba el proyectil.)

  // Un sprite que hace sus fotogramas una vez y se va (sin volver al primero).
  const once = (shape, pal, x, y, fr, o = {}) =>
    G.FX.sp(shape, pal, x, y, Object.assign({ life: G.VFX.frames(shape) / fr - 0.005, frameRate: fr, fade: false }, o));
  // Cuántas partículas: menos en calidad media.
  const n = k => Math.max(1, Math.round(k * (G.Settings.fx === 2 ? 1 : 0.6)));
  const puff = (P, x, y, k, c1 = 1, c2 = 2) => {
    for (let i = 0; i < n(k); i++) px(x + R(-6, 6), y + R(-5, 5), P[half() ? c1 : c2], { vx: R(-14, 14), vy: R(-36, -14), life: R(0.4, 0.65), size: half() ? 3 : 2, drag: 0.95 });
  };
  const sparks = (P, x, y, k, v = 170) => {
    for (let i = 0; i < n(k); i++) { const a = Math.random() * TAU, s = R(v * 0.6, v); px(x, y, P[4], { vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.14 }); }
  };
  const drops = (P, x, y, k, c = 3) => {
    for (let i = 0; i < n(k); i++) px(x, y, P[i % 2 ? c : 4], { vx: R(-90, 90), vy: R(-150, -70), grav: 620, life: 0.45 });
  };

  const HITS = {
    flare(P, pal, x, y) {
      once('hflare', pal, x, y, 14);
      for (let i = 0; i < n(5); i++) px(x + R(-6, 6), y + R(-4, 4), P[i % 2 ? 3 : 4], { vx: R(-30, 30), vy: R(-110, -50), life: R(0.3, 0.55), size: i % 3 ? 1 : 2, drag: 0.92 });
    },
    crown(P, pal, x, y) { once('hcrown', pal, x, y + 4, 13); drops(P, x, y, 5); },
    zap(P, pal, x, y) { once('hzap', pal, x, y, 14); sparks(P, x, y, 4, 220); },
    ripple(P, pal, x, y) {
      G.FX.ring(x, y, 3, 16, P[3], 0.24, 2); G.FX.ring(x, y, 2, 10, P[4], 0.3, 2);
      sparks(P, x, y, 4, 90);
    },
    splat(P, pal, x, y) {
      once('hsplat', pal, x, y + 6, 8);
      for (let i = 0; i < n(4); i++) px(x, y, P[half() ? 2 : 3], { vx: R(-70, 70), vy: R(-110, -40), grav: 520, life: 0.45, size: half() ? 2 : 1 });
      puff(P, x, y, 2);
    },
    prick(P, pal, x, y) { once('hcross', pal, x, y, 14); puff(P, x, y - 2, 3, 2, 3); },
    shatter(P, pal, x, y) {
      for (let i = 0; i < n(4); i++) G.FX.sp('chip', pal, x, y, { vx: R(-90, 90), vy: R(-140, -60), grav: 520, spin: R(-10, 10), life: 0.4 });
      for (let i = 0; i < n(3); i++) px(x + R(-6, 6), y + R(-3, 5), P[3], { vx: R(-25, 25), vy: R(-25, -8), life: 0.45 });
    },
    pulse(P, pal, x, y) { G.FX.ring(x, y, 3, 18, P[3], 0.22, 2); once('hcross', pal, x, y, 13); sparks(P, x, y, 4, 150); },
    gloom(P, pal, x, y) { once('hgloom', pal, x, y, 12); puff(P, x, y, 4); },
    roar(P, pal, x, y, dx, dy) {
      once('hchev', pal, x + dx * 6, y + dy * 6, 10, { angle: Math.atan2(dy, dx) || 0.0001, vx: dx * 70, vy: dy * 70 });
      for (let i = 0; i < n(3); i++) G.FX.sp('scale', pal, x, y, { vx: R(-80, 80), vy: R(-110, -40), grav: 420, spin: R(-10, 10), life: 0.38 });
    },
    pop(P, pal, x, y) {
      const k = n(5);
      for (let i = 0; i < k; i++) { const a = i / k * TAU + 0.4; G.FX.sp('bubblet', pal, x, y, { vx: Math.cos(a) * 75, vy: Math.sin(a) * 60 - 20, life: 0.3 }); }
      px(x - 1, y - 1, P[4], { life: 0.12, size: 2, drag: 1 });
    },
    steamburst(P, pal, x, y) { puff(P, x, y, 5, 3, 4); drops(P, x, y, 2); },
    twister(P, pal, x, y) {
      for (let i = 0; i < n(3); i++) G.FX.sp('wind', pal, x + R(-5, 5), y + 4, { vy: -70 - i * 25, spin: 12, life: 0.32 });
      sparks(P, x, y, 3, 110);
    },
    ripplewater(P, pal, x, y) { G.FX.ring(x, y, 3, 18, P[3], 0.26, 2); once('hcrown', pal, x, y + 4, 16); drops(P, x, y, 3); },
    spikes(P, pal, x, y) {
      once('hspikes', pal, x, y + 6, 11);
      for (let i = 0; i < n(4); i++) px(x + R(-8, 8), y + 8, P[half() ? 2 : 3], { vx: R(-50, 50), vy: R(-90, -40), grav: 520, life: 0.4 });
    },
    leafburst(P, pal, x, y) {
      const k = n(5);
      for (let i = 0; i < k; i++) { const a = i / k * TAU + R(0, 1); G.FX.sp('leaflet', pal, x, y, { vx: Math.cos(a) * 80, vy: Math.sin(a) * 60 - 20, grav: 120, spin: R(-10, 10), life: 0.4 }); }
    },
    icebreak(P, pal, x, y) {
      once('hstar', pal, x, y, 16);
      for (let i = 0; i < n(4); i++) G.FX.sp('chip', pal, x, y, { vx: R(-90, 90), vy: R(-130, -50), grav: 520, spin: R(-10, 10), life: 0.38 });
      for (let i = 0; i < n(4); i++) px(x + R(-6, 6), y + R(-6, 6), P[4], { vy: R(10, 30), life: 0.4 });
    },
    heartbeat(P, pal, x, y) {
      once('hheart', pal, x, y - 2, 9);
      for (let i = 0; i < n(3); i++) G.FX.sp('heartlet', pal, x + R(-8, 8), y, { vy: R(-70, -40), vx: R(-20, 20), life: 0.4 });
    },
    starburst(P, pal, x, y) { once('hstar', pal, x, y, 16); sparks(P, x, y, 4, 150); },
    slashx(P, pal, x, y) { once('hx', pal, x, y, 13); sparks(P, x, y, 3, 120); },
    // Hilos de telaraña que salen en ocho direcciones.
    threads(P, pal, x, y) {
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; for (let i = 1; i <= 3; i++) px(x + Math.cos(a) * i * 5, y + Math.sin(a) * i * 4, i < 3 ? P[4] : P[3], { life: 0.14 + i * 0.04, drag: 1 }); }
    }
  };

  // ---------------- cada ataque, lo suyo ----------------
  // Uno por cada movimiento de G.Moves.EVO; no hay dos iguales (tests/ataques-plus.test.cjs).

  const REC = {
    // ---- proyectiles (projectile) ----
    'ember':         { shape: 'fire2',   trail: 'embers',   hit: 'flare' },
    'water-gun':     { shape: 'drop2',   trail: 'droplets', hit: 'crown' },
    'thunder-shock': { shape: 'bolt2',   trail: 'zigzag',   hit: 'zap' },
    'confusion':     { shape: 'spiral2', trail: 'rings',    hit: 'ripple' },
    'sludge':        { shape: 'blob2',   trail: 'ooze',     hit: 'splat' },
    'poison-sting':  { shape: 'needle2', trail: 'venom',    hit: 'prick' },
    'rock-throw':    { shape: 'rock2',   trail: 'pebbles',  hit: 'shatter' },
    'aura-sphere':   { shape: 'aura2',   trail: 'aurawisp', hit: 'pulse' },
    'shadow-ball':   { shape: 'shadow2', trail: 'smoke',    hit: 'gloom' },
    'dragon-pulse':  { shape: 'dpulse2', trail: 'scales',   hit: 'roar' },
    'sludge-bomb':   { shape: 'bomb2',   trail: 'fumes',    hit: 'pop' },
    'scald':         { shape: 'scald2',  trail: 'steam',    hit: 'steamburst' },
    'hurricane':     { shape: 'gale2',   trail: 'gust',     hit: 'twister' },
    'water-pulse':   { shape: 'wpulse2', trail: 'ripples',  hit: 'ripplewater' },
    'stone-edge':    { shape: 'edge2',   trail: 'grit',     hit: 'spikes' },
    // ---- ráfaga radial (nova) ----
    'hyper-voice':   { shape: 'voice2',  trail: 'gust',     hit: 'ripple' },
    'heat-wave':     { shape: 'heat2',   trail: 'embers',   hit: 'flare' },
    'bubble':        { shape: 'bubble2', trail: 'fumes',    hit: 'pop' },
    'psychic':       { shape: 'eye2',    trail: 'rings',    hit: 'pulse' },
    'mud-shot':      { shape: 'mud2',    trail: 'pebbles',  hit: 'splat' },
    'fairy-wind':    { shape: 'fstar2',  trail: 'stardust', hit: 'starburst' },
    'dark-pulse':    { shape: 'dring2',  trail: 'smoke',    hit: 'gloom' },
    'lava-plume':    { shape: 'lava2',   trail: 'embers',   hit: 'splat' },
    // ---- teledirigidos (homing) ----
    'energy-ball':   { shape: 'eball2',  trail: 'leaves',   hit: 'leafburst' },
    'mist-ball':     { shape: 'pearl2',  trail: 'steam',    hit: 'ripple' },
    'air-slash':     { shape: 'aslash2', trail: 'gust',     hit: 'slashx' },
    'ice-shard':     { shape: 'ishard2', trail: 'frost',    hit: 'icebreak' },
    'shadow-sneak':  { shape: 'sclaw2',  trail: 'smoke',    hit: 'slashx' },
    'draining-kiss': { shape: 'kiss2',   trail: 'hearts',   hit: 'heartbeat' },
    'sucker-punch':  { shape: 'spunch2', trail: 'smoke',    hit: 'starburst' },
    'moonblast':     { shape: 'moon2',   trail: 'stardust', hit: 'pulse' },
    // ---- los que rebotan (bounce) ----
    'seed-bomb':     { shape: 'seed2',   trail: 'leaves',   hit: 'shatter' },
    'electro-ball':  { shape: 'eorb2',   trail: 'zigzag',   hit: 'zap' },
    'acid-spray':    { shape: 'acid2',   trail: 'ooze',     hit: 'steamburst' },
    'signal-beam':   { shape: 'signal2', trail: 'stardust', hit: 'zap' },
    'power-gem':     { shape: 'gem2',    trail: 'grit',     hit: 'starburst' },
    'mirror-shot':   { shape: 'mirror2', trail: 'grit',     hit: 'icebreak' },
    'psyshock':      { shape: 'pshock2', trail: 'rings',    hit: 'icebreak' },
    // ---- abanicos (cone) ----
    'flamethrower':  { shape: 'flame2',  trail: 'smoke',    hit: 'flare' },
    'bubble-beam':   { shape: 'bbeam2',  trail: 'droplets', hit: 'pop' },
    'dragon-breath': { shape: 'dbreath2', trail: 'zigzag',  hit: 'flare' },
    'blizzard':      { shape: 'bliz2',   trail: 'frost',    hit: 'icebreak' },
    'silver-wind':   { shape: 'silver2', trail: 'scales',   hit: 'twister' },
    // ---- órbitas (orbit) ----
    'fire-spin':     { shape: 'fspin2',  trail: 'embers',   hit: 'flare' },
    'leaf-storm':    { shape: 'lstorm2', trail: 'leaves',   hit: 'leafburst' },
    'gust':          { shape: 'gust2',   trail: 'gust',     hit: 'twister' },
    'ancient-power': { shape: 'ancient2', trail: 'pebbles', hit: 'shatter' },
    // ---- bumeranes (boomerang) ----
    'razor-leaf':    { shape: 'rleaf2',  trail: 'leaves',   hit: 'slashx' },
    'bonemerang':    { shape: 'bone2',   trail: 'sand',     hit: 'shatter' },
    'psycho-cut':    { shape: 'pcut2',   trail: 'rings',    hit: 'slashx' },
    // ---- minas (mine): su silueta en el suelo y su estallido (area.hit) ----
    'string-shot':   { shape: 'web2',    area: { hit: 'threads', around: 'ringlet', move: 'out' } },
    'spikes':        { shape: 'spike2',  area: { hit: 'shatter', bits: 'sand' } },
    'toxic-spikes':  { shape: 'tspike2', area: { hit: 'splat', around: 'bubblet', move: 'up' } },
    // ---- meteoros (meteor): lo que cae y cómo cae ----
    'rock-slide':    { shape: 'slide2',  area: { hit: 'shatter', bits: 'pebbles', mark: 'hcrack' } },
    'hail':          { shape: 'hail2',   area: { hit: 'icebreak', bits: 'frost' } },
    'meteor-mash':   { shape: 'mmash2',  area: { hit: 'starburst', bits: 'embers', mark: 'hburst' } },
    // ---- torretas (turret): body es la torreta; shape, sus disparos ----
    'will-o-wisp':   { body: 'wisp2', shape: 'wisp2', trail: 'embers',   hit: 'flare' },
    'substitute':    { body: 'sub2',                  trail: 'stardust', hit: 'starburst' },

    // ---- golpes (melee): mark = fotograma del golpe, edge = lo que salta del filo,
    //      bits = partículas en el filo, floor = marca en el suelo, rope = el látigo se ve, dust = aro de polvo ----
    'tackle':        { mark: 'hburst', dust: true },
    'body-slam':     { mark: 'hburst', floor: 'hcrack', bits: 'pebbles' },
    'vine-whip':     { rope: true, edge: 'leaflet', bits: 'leaves' },
    'wing-attack':   { edge: 'feather', bits: 'gust' },
    'bug-bite':      { mark: 'hfang', edge: 'chip' },
    'karate-chop':   { mark: 'hchop', floor: 'hcrack' },
    'lick':          { rope: true, bits: 'ooze' },
    'metal-claw':    { mark: 'hclaw4', bits: 'grit' },
    'bite':          { mark: 'hfang', bits: 'smoke' },
    'dragon-claw':   { mark: 'hclaw4', edge: 'scale', bits: 'embers' },
    'play-rough':    { mark: 'hpow', edge: 'heartlet' },
    'crunch':        { mark: 'hfang', floor: 'hx', edge: 'chip' },
    // ---- giros (spin) ----
    'rapid-spin':    { edge: 'star', dust: true },
    'rolling-kick':  { mark: 'hburst', bits: 'gust' },
    'outrage':       { mark: 'hclaw4', bits: 'embers' },
    'gyro-ball':     { edge: 'chip', bits: 'grit', dust: true },
    'night-slash':   { mark: 'hx', bits: 'smoke' },
    // ---- puños (punch) ----
    'fire-punch':    { mark: 'hflare', bits: 'embers' },
    'ice-punch':     { mark: 'hstar', edge: 'chip', bits: 'frost' },
    'thunder-punch': { mark: 'hzap', bits: 'zigzag' },
    'drain-punch':   { mark: 'hburst', edge: 'ringlet', inward: true },
    // ---- tijera, embestidas y saltos (path = lo que queda por el camino) ----
    'x-scissor':     { mark: 'hx', edge: 'chip' },
    'quick-attack':  { path: 'gust', dust: true },
    'aerial-ace':    { path: 'gust', edge: 'feather', mark: 'hx' },
    'flame-charge':  { path: 'embers', mark: 'hflare' },
    'u-turn':        { path: 'leaves', mark: 'hstar' },
    'megahorn':      { path: 'grit', mark: 'hburst', edge: 'chip' },
    'extreme-speed': { path: 'gust', mark: 'hstar', dust: true },

    // ---- rayos (beam, charge, chain): bits a lo largo, mark al final, side = lo que salta a los lados ----
    'hydro-pump':    { ray: { bits: 'droplets', mark: 'hcrown' } },
    'psybeam':       { ray: { bits: 'rings', mark: 'hcross' } },
    'ice-beam':      { ray: { bits: 'frost', mark: 'hstar', side: 'chip' } },
    'dragon-rage':   { ray: { bits: 'embers', mark: 'hflare', side: 'scale' } },
    'flash-cannon':  { ray: { bits: 'grit', mark: 'hstar', side: 'ringlet' } },
    'hyper-beam':    { ray: { bits: 'stardust', mark: 'hburst' } },
    'solar-beam':    { ray: { bits: 'leaves', mark: 'hstar', side: 'leaflet' } },
    'thunderbolt':   { ray: { bits: 'zigzag', mark: 'hzap' } },
    'hex':           { ray: { bits: 'smoke', mark: 'hgloom' } },

    // ---- zonas (aura, shove, stun, vortex, trail y las sueltas): around = lo que sale por el borde
    //      (move: up sube, out se va, in viene, spin gira, still se queda), bits, mark en el centro ----
    'giga-drain':    { area: { around: 'leaflet', move: 'in', bits: 'leaves' } },
    'discharge':     { area: { mark: 'hzap', bits: 'zigzag' } },
    'bulldoze':      { area: { around: 'chip', move: 'up', mark: 'hcrack' } },
    'bug-buzz':      { area: { around: 'ringlet', move: 'out', bits: 'gust' } },
    'powder-snow':   { area: { around: 'chip', move: 'spin', bits: 'frost' } },
    'dazzling-gleam': { area: { around: 'hcross', move: 'still', bits: 'stardust' } },
    'night-shade':   { area: { bits: 'smoke', mark: 'hgloom' } },
    'extrasensory':  { area: { around: 'ringlet', move: 'out', mark: 'hcross' } },
    'whirlwind':     { area: { around: 'leaflet', move: 'spin', bits: 'gust' } },
    'vacuum-wave':   { area: { bits: 'aurawisp', mark: 'hburst' } },
    'disarming-voice': { area: { around: 'heartlet', move: 'out', bits: 'stardust' } },
    'thunder-wave':  { area: { around: 'ringlet', move: 'in', bits: 'zigzag', mark: 'hzap' } },
    'rock-tomb':     { area: { around: 'chip', move: 'up', bits: 'pebbles', mark: 'hspikes' } },
    'freeze-dry':    { area: { around: 'chip', move: 'out', bits: 'frost', mark: 'hstar' } },
    'dynamic-punch': { area: { around: 'star', move: 'up', mark: 'hpow' } },
    'waterfall':     { area: { around: 'ringlet', move: 'still', bits: 'droplets', mark: 'hcrown' } },
    'whirlpool':     { area: { around: 'ringlet', move: 'spin', bits: 'droplets' } },
    'sand-tomb':     { area: { around: 'chip', move: 'spin', bits: 'pebbles' } },
    'ominous-wind':  { area: { around: 'scale', move: 'spin', bits: 'smoke' } },
    'toxic':         { area: { around: 'bubblet', move: 'up', bits: 'ooze' } },
    'flame-wheel':   { area: { bits: 'embers', mark: 'hflare' } },
    'magnitude':     { area: { bits: 'pebbles', mark: 'hspikes' } },
    'earthquake':    { area: { around: 'chip', move: 'out', bits: 'pebbles', mark: 'hcrack' } },
    'surf':          { area: { around: 'bubblet', move: 'up', bits: 'droplets', mark: 'hcrown' } },
    'fire-blast':    { area: { around: 'hflare', move: 'still', bits: 'embers', mark: 'hflare' } },
    'thunder':       { area: { around: 'hcross', move: 'still', bits: 'zigzag', mark: 'hzap' } },
    'acrobatics':    { area: { around: 'feather', move: 'out', bits: 'gust', mark: 'hburst' } },
    'explosion':     { area: { around: 'chip', move: 'out', bits: 'smoke', mark: 'hburst' } }
  };

  const of = id => REC[id] || null;

  /** Lo que suelta por el camino (lo llama projectile.js cada pocas centésimas). */
  function trail(E, pal, x, y, vx, vy) {
    const q = G.Settings.fx, fn = TRAILS[E.trail];
    if (!fn || !q || !G.FX.spare() || (q === 1 && Math.random() < 0.5)) return;
    const sp = Math.hypot(vx, vy) || 1;
    fn(PAL[pal] || PAL.normal, pal, x, y, -vx / sp, -vy / sp);
  }

  // Presupuesto: con ocho «+» y la pantalla llena caen cientos de golpes por segundo. Los
  // impactos propios salen como mucho uno cada 40 ms entre todos, y sólo si queda sitio:
  // así la partida no va más lenta que con el envoltorio común.
  let lastHit = 0;
  function room() {
    const t = performance.now();
    if (t - lastHit < 40 || !G.FX.spare() || !G.FX.spare(true)) return false;
    lastHit = t;
    return true;
  }

  /** Su impacto (lo llama combat.js al golpear). */
  function hit(E, pal, x, y, vx, vy) {
    const fn = HITS[E.hit];
    if (!fn || !G.Settings.fx || !room()) return;
    const sp = Math.hypot(vx, vy) || 1;
    fn(PAL[pal] || PAL.normal, pal, x, y, vx / sp, vy / sp);
  }

  /** Golpes: lo propio de ese tajo (lo llama G.FX.slash). */
  function cut(E, pal, x, y, ang, rad, arc) {
    if (!G.Settings.fx || !(E.mark || E.edge || E.bits || E.floor || E.rope || E.dust)) return;
    const P = PAL[pal] || PAL.normal, hf = Math.min(arc, TAU) / 2;
    const mx = x + Math.cos(ang) * rad * 0.7, my = y + Math.sin(ang) * rad * 0.7;
    const room = G.FX.spare(true);
    if (E.floor && room) once(E.floor, pal, mx, my + 8, 9);
    if (E.mark && room) once(E.mark, pal, mx, my, 13, G.VFX.isDir(E.mark) ? { angle: ang || 0.0001 } : {});
    if (E.dust) G.FX.ring(x, y + 6, rad * 0.4, rad * 0.9, P[3], 0.25, 2);
    if (E.rope && G.FX.spare()) {                   // el látigo (o la lengua): una cuerda de píxeles por el arco
      const k = Math.min(16, Math.max(5, Math.round(rad * hf * 2 / 7)));
      for (let i = 0; i <= k; i++) {
        const a = ang - hf + i / k * hf * 2;
        px(x + Math.cos(a) * rad * 0.92, y + Math.sin(a) * rad * 0.92, P[i % 2 ? 2 : 1], { life: 0.16 + i * 0.006, size: 2, drag: 1 });
      }
    }
    if (E.edge) for (let i = 0; i < n(3); i++) {
      if (!G.FX.spare(true)) break;
      const a = ang + R(-hf, hf), r = rad * R(0.6, 1), k = E.inward ? -1 : 1;
      G.FX.sp(E.edge, pal, x + Math.cos(a) * r, y + Math.sin(a) * r,
              { vx: Math.cos(a) * 70 * k, vy: Math.sin(a) * 70 * k - (E.inward ? 0 : 30), grav: E.inward ? 0 : 160, spin: G.VFX.spins(E.edge) ? R(-8, 8) : 0, life: 0.38 });
    }
    const fn = TRAILS[E.bits];
    if (fn) for (let i = 0; i < n(4); i++) {
      if (!G.FX.spare()) break;
      const a = ang + R(-hf, hf);
      fn(P, pal, x + Math.cos(a) * rad * 0.95, y + Math.sin(a) * rad * 0.95, Math.cos(a), Math.sin(a));
    }
  }

  /** Embestidas y saltos: lo que queda por el camino (lo llama combat.js). */
  function path(E, pal, x0, y0, x1, y1) {
    const fn = TRAILS[E.path];
    if (!fn || !G.Settings.fx) return;
    const P = PAL[pal] || PAL.normal, len = Math.hypot(x1 - x0, y1 - y0) || 1, k = n(Math.min(10, len / 16));
    for (let i = 0; i <= k; i++) {
      if (!G.FX.spare()) break;
      fn(P, pal, x0 + (x1 - x0) * i / k, y0 + (y1 - y0) * i / k, (x0 - x1) / len, (y0 - y1) / len);
    }
  }

  /** Rayos: partículas a lo largo, su final y lo que salta a los lados (lo llama G.FX.beam). */
  function ray(E, pal, x, y, ang, len) {
    const A = E.ray;
    if (!A || !G.Settings.fx) return;
    const P = PAL[pal] || PAL.normal, ca = Math.cos(ang), sa = Math.sin(ang);
    if (A.mark && G.FX.spare(true)) once(A.mark, pal, x + ca * len, y + sa * len, 13);
    const fn = TRAILS[A.bits], k = n(Math.min(8, len / 36));
    if (fn) for (let i = 1; i <= k; i++) {
      if (!G.FX.spare()) break;
      const s = half() ? 1 : -1;
      fn(P, pal, x + ca * len * i / (k + 1), y + sa * len * i / (k + 1), -sa * s, ca * s);
    }
    if (A.side) for (let i = 0; i < n(3); i++) {
      if (!G.FX.spare(true)) break;
      const d = R(0.2, 1) * len, s = half() ? 1 : -1;
      G.FX.sp(A.side, pal, x + ca * d, y + sa * d, { vx: -sa * s * 70, vy: ca * s * 70 - 20, grav: 140, spin: G.VFX.spins(A.side) ? R(-8, 8) : 0, life: 0.35 });
    }
  }

  /** Zonas: lo que sale por el borde, sus partículas y su marca (lo llama combat.js al lanzar o al estallar). */
  function area(E, pal, x, y, r) {
    const A = E.area;
    if (!A || !G.Settings.fx) return;
    const P = PAL[pal] || PAL.normal;
    if (A.hit && HITS[A.hit] && room()) HITS[A.hit](P, pal, x, y - 6, 0, -1);
    if (A.mark && G.FX.spare(true)) once(A.mark, pal, x, y - 4, 11);
    if (A.around) {
      const k = n(Math.min(8, 4 + r / 30)), still = A.move === 'still', ph = R(0, TAU);
      for (let i = 0; i < k; i++) {
        if (!G.FX.spare(true)) break;
        const a = ph + i / k * TAU, rr = r * (still ? R(0.3, 0.9) : 0.85), ca = Math.cos(a), sa = Math.sin(a);
        const px0 = x + ca * rr, py0 = y + sa * rr * 0.6 - 4;
        if (still) { once(A.around, pal, px0, py0, 12, { scale: 1 }); continue; }
        const v = A.move === 'up' ? [R(-10, 10), -75] : A.move === 'in' ? [-ca * rr * 2.2, -sa * rr * 1.3]
                : A.move === 'spin' ? [-sa * 100, ca * 60] : [ca * 90, sa * 54];
        G.FX.sp(A.around, pal, px0, py0, { vx: v[0], vy: v[1], life: 0.4, grav: A.move === 'up' ? 150 : 0, spin: G.VFX.spins(A.around) ? R(-8, 8) : 0 });
      }
    }
    const fn = TRAILS[A.bits];
    if (fn) for (let i = 0; i < n(6); i++) {
      if (!G.FX.spare()) break;
      const a = R(0, TAU), rr = r * R(0.3, 1);
      fn(P, pal, x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.6 - 4, Math.cos(a), Math.sin(a));
    }
  }

  return { REC, TRAILS, HITS, of, trail, hit, cut, path, ray, area };})();
