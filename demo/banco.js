/* ============ banco.js — banco de pruebas de los ataques (sólo para la demo) ============
 * Dibuja cualquier ataque, normal y «+», en un canvas aparte con el código REAL del
 * juego: G.Moves (los números), G.Combat (lo lanza), G.Projectiles, G.FX, G.VFX y
 * G.VFXPlus (lo pintan). Aquí sólo está lo de alrededor que la demo no carga: un
 * suelo, un muñeco que ataca, muñecos que reciben, y el mapa, la red y el sonido de
 * mentira (vacíos).
 *
 * No es parte del juego: no va en dev.html, ni en js/app.min.js, ni en la copia sin
 * internet (sw.js deja pasar /demo/ sin guardarlo).
 *
 *   const b = Banco.crear(canvas, [{ id: 'ember' }, ...], { cols: 2, zoom: 2 });
 *   b.paso(1 / 60); b.pinta();        // o b.correr() para que vaya solo
 *   Banco.calidad(0 | 1 | 2)          // baja, media, alta (no toca los ajustes guardados)
 */
window.Banco = (() => {
  const PX = G.Sprites.PX;
  const CW = 200, CH = 124;            // cada escenario, en unidades de juego
  const MID = 4, GAP = 14, LABEL = 16; // entre normal y «+», entre fichas, y la tira del nombre
  const CON_FICHA = ['projectile', 'nova', 'homing', 'bounce', 'cone', 'orbit', 'boomerang', 'mine', 'meteor', 'turret'];
  const CERCA = ['melee', 'spin', 'punch', 'scissor', 'aura', 'shove', 'boom', 'tremor', 'orbit', 'trail'];

  let nivel = 2, actual = null;
  const dolls = [];

  // ---- lo que el juego espera encontrar y aquí no hace falta ----
  G.T = G.T || (s => s);
  Object.defineProperty(G.Settings, 'fx', { get: () => nivel, configurable: true });
  G.Audio = { sfx() {}, cry() {} };
  G.Coop = { active: false, isHost: true, cast() {} };
  G.Weather = { mult: () => 1, KINDS: {}, cast() {} };
  G.Stats = { taken: () => 1 };
  G.Types = { mult: () => 1, label: () => null };
  G.World = { isWall: () => false, isFree: () => true, collide() {}, propsInCircle: () => [], projectileBlock: () => null, damageProp() {} };
  G.EnemyMgr = {
    all: () => dolls,
    queryCircle: (x, y, r) => dolls.filter(e => (e.x - x) ** 2 + (e.y - y) ** 2 <= (r + e.r) ** 2)
  };
  // "Lo que se ve" es el escenario del ataque que se está lanzando.
  G.Camera.sees = (x, y, pad = 60) => !actual ||
    (x > actual.x0 - pad && x < actual.x0 + CW + pad && y > actual.y0 - pad && y < actual.y0 + CH + pad);
  G.Camera.kick = () => {};

  // ---- muñecos (pixel art a mano, en la misma rejilla que el juego) ----
  const ATACA = ['..ooooo..', '.owwwwwo.', 'owwkwkwwo', 'owwwwwwwo', 'owrwwwrwo', '.owwwwwo.', '..obbbo..', '.obbbbbo.', '.obbbbbo.', '..oo.oo..'];
  const DIANA = ['..ooooo..', '.oyyyyyo.', 'oyyyyyyyo', 'oyykykyyo', 'oyyyyyyyo', '.oyyyyyo.', '..ottto..', '...oto...', '...oto...', '..ootoo..'];
  const COL = { o: '#1a1420', w: '#f4f1ea', k: '#1a1420', r: '#ff8fa3', b: '#3d6bd6', y: '#e2c27a', t: '#8a5a2e' };
  function doll(ctx, map, x, y, white) {
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(x, y, 9, 4, 0, 0, 6.2832); ctx.fill();
    const w = map[0].length, h = map.length;
    const ox = Math.round((x - w * PX / 2) / PX) * PX, oy = Math.round((y - h * PX + PX) / PX) * PX;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const c = map[j][i];
      if (c === '.') continue;
      ctx.fillStyle = white && c !== 'o' ? '#ffffff' : COL[c];
      ctx.fillRect(ox + i * PX, oy + j * PX, PX, PX);
    }
  }

  const NADA = () => {};
  function diana(id, x, y) {
    return { id, x, y, hx: x, hy: y, r: 9, bodyH: 20, types: ['normal'], mon: {}, dead: false, flash: 0, burn: 0, poison: 0, slow: 0,
             touchCd: 99, kx: 0, ky: 0, cy() { return this.y - 10; }, hurt() { this.flash = 0.09; },
             applyBurn: NADA, applyPoison: NADA, applySlow: NADA, applyStun: NADA, strike: NADA };
  }
  const LEJOS = { x: -9999, y: -9999, r: 1, dead: true, critChance: 0, dmgDealt: 0, onDealt: NADA, heal: NADA, hurt: NADA, hasItem: () => false };

  function crear(canvas, lista, o = {}) {
    const zoom = o.zoom || 2, cols = Math.max(1, o.cols || 1);
    const ctx = canvas.getContext('2d');
    const cardW = CW * 2 + MID, cardH = CH + LABEL;
    let cells = [], cards = [], t = 0, raf = 0;

    function rehacer(nueva) {
      lista = nueva || lista;
      G.Projectiles.clear(); G.FX.clear(); G.Combat.clearFields();
      dolls.length = 0; cells = []; cards = []; t = 0;
      const rowsN = Math.ceil(lista.length / cols);
      canvas.width = Math.max(1, (cols * cardW + (cols - 1) * GAP) * zoom);
      canvas.height = Math.max(1, (rowsN * cardH + Math.max(0, rowsN - 1) * GAP) * zoom);
      lista.forEach((it, i) => {
        const def = G.Moves.BY_ID[it.id];
        const cx = (i % cols) * (cardW + GAP), cy = Math.floor(i / cols) * (cardH + GAP);
        cards.push({ x: cx, y: cy, name: it.nombre || def.name, sub: it.sub || '' });
        for (const plus of [false, true]) {
          // En el mundo, cada escenario está lejos de los demás (lo de uno no llega a otro);
          // en el canvas se pintan juntos (dx, dy).
          const dx = cx + (plus ? CW + MID : 0), dy = cy + LABEL, x0 = cells.length * 1500, y0 = 0;
          const m = G.Moves.instance(it.id, def.maxLvl);
          if (plus) G.Moves.evolve(m);
          const near = CERCA.includes(m.kind);
          const hx = x0 + (near ? 78 : 36), hy = y0 + CH * (near ? 0.62 : 0.74);
          const ds = (near ? [[40, 4], [-34, -14], [10, 30]] : [[98, -6], [140, 10], [128, -34]])
            .map(([dx, dy], k) => diana(cells.length * 4 + k + 1, hx + dx, hy + dy));
          dolls.push(...ds);
          const cell = { x0, y0, dx, dy, plus, m, dolls: ds };
          cell.pl = {
            cell, x: hx, y: hy, hx, hy, r: 9, bodyH: 20, aim: 0, dead: false, restT: 0, cdMul: Math.min(1, 1.15 / (m.cd || 1)),
            item: null, abil: null, critChance: 0, dmgDealt: 0, level: 1, invuln: 0, hp: 100, maxHp: 100, manualAim: false,
            target: ds[0], castT: 0, away: 0,
            activeGroup: () => [m], activeMove: () => m, cast() { this.castT = 0.12; this.castAt = t; }, atkFor: () => 1,
            addBuff: NADA, heal: NADA, onDealt: NADA, hurt: NADA, hasItem: () => false
          };
          cells.push(cell);
        }
      });
    }

    function paso(dt) {
      t += dt;
      for (const c of cells) {
        const pl = c.pl;
        // Embestidas y saltos lo mueven: al poco, vuelve a su sitio.
        if (Math.abs(pl.x - pl.hx) + Math.abs(pl.y - pl.hy) > 1) { pl.away += dt; if (pl.away > 0.5) { pl.x = pl.hx; pl.y = pl.hy; pl.away = 0; } }
        pl.castT -= dt;
        pl.aim = Math.atan2(pl.target.y - pl.y, pl.target.x - pl.x);
        actual = c;
        G.Combat.tick(dt, pl, t);
      }
      actual = null;
      G.Projectiles.update(dt, LEJOS, dolls);
      // Nada sale de su escenario.
      for (const p of G.Projectiles.all().slice()) {
        const c = p.owner && p.owner.cell;
        if (c && !p.orb && (p.x < c.x0 + 4 || p.x > c.x0 + CW - 4 || p.y < c.y0 + G.LIFT + 2 || p.y > c.y0 + CH - 2)) G.Projectiles.remove(p);
      }
      G.Combat.resolve(dt, LEJOS, t);
      G.Combat.updateFields(dt);
      G.FX.update(dt);
      for (const e of dolls) {
        e.flash -= dt;
        e.x += (e.hx - e.x) * Math.min(1, dt * 4); e.y += (e.hy - e.y) * Math.min(1, dt * 4);
      }
    }

    function pinta() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(zoom, 0, 0, zoom, 0, 0);
      ctx.imageSmoothingEnabled = false;
      // Cada escenario, con su recorte: suelo (baldosas de 16, dos verdes), campos, muñecos,
      // proyectiles y efectos, en el orden en que los pinta el juego.
      for (const c of cells) {
        ctx.save();
        ctx.beginPath(); ctx.rect(c.dx, c.dy, CW, CH); ctx.clip();
        ctx.translate(c.dx - c.x0, c.dy - c.y0);
        for (let y = 0; y < CH; y += 16) for (let x = 0; x < CW; x += 16) {
          ctx.fillStyle = ((x + y) / 16) & 1 ? '#3f6b46' : '#3a6341';
          ctx.fillRect(c.x0 + x, c.y0 + y, 16, 16);
        }
        actual = c;
        G.Combat.drawGroundFields(ctx);
        const who = [[c.pl.y, ATACA, c.pl, false], ...c.dolls.map(e => [e.y, DIANA, e, e.flash > 0])].sort((a, b) => a[0] - b[0]);
        for (const [, map, e, white] of who) doll(ctx, map, e.x, e.y, white);
        G.Projectiles.draw(ctx);
        G.Combat.drawAirFields(ctx);
        G.FX.draw(ctx);
        actual = null;
        // Ficha: la silueta sola y más grande, en la esquina (la misma forma, paleta y fotogramas que pinta el juego).
        if (CON_FICHA.includes(c.m.kind)) {
          const vis = G.VFX.forMove(c.m), shape = (vis.evo && (vis.evo.body || vis.evo.shape)) || vis.proj;
          ctx.fillStyle = '#1b1e28'; ctx.fillRect(c.x0, c.y0, 76, 54);
          ctx.fillStyle = c.plus ? '#ffd84a' : '#363d52'; ctx.fillRect(c.x0, c.y0 + 54, 76, 2); ctx.fillRect(c.x0 + 76, c.y0, 2, 56);
          G.VFX.draw(ctx, shape, vis.pal, c.x0 + 38, c.y0 + 27, { scale: 1.5, frame: Math.floor(t * 6), plus: vis.plus });
        }
        ctx.restore();
      }
      // Nombres (en píxeles de pantalla, para que se lean).
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.textBaseline = 'middle';
      for (const k of cards) {
        const y = (k.y + LABEL / 2) * zoom;
        ctx.font = '700 15px "Segoe UI",system-ui,sans-serif';
        ctx.fillStyle = '#f4f1ea'; ctx.textAlign = 'left';
        ctx.fillText(k.name, k.x * zoom + 2, y);
        const w = ctx.measureText(k.name).width;
        ctx.font = '12px "Segoe UI",system-ui,sans-serif';
        ctx.fillStyle = '#9aa3b5';
        ctx.fillText(k.sub, k.x * zoom + w + 12, y + 1);
        ctx.font = '700 15px "Segoe UI",system-ui,sans-serif';
        ctx.fillStyle = '#ffd84a';
        ctx.fillText(k.name + ' +', (k.x + CW + MID) * zoom + 2, y);
      }
    }

    // Cuándo se retrata cada forma de jugar, en segundos tras lanzar (lo que tarda en verse lo suyo).
    const FASE = { melee: 0.07, scissor: 0.07, dash: 0.07, beam: 0.07, chain: 0.07, aura: 0.08, shove: 0.12, boom: 0.1, cone: 0.16,
                   spin: 0.2, punch: 0.2, blitz: 0.2, nova: 0.25, tremor: 0.28, quake: 0.3, cross: 0.36, leap: 0.38, storm: 0.4,
                   stun: 0.5, vortex: 0.5, wave: 0.2, trail: 0.55, meteor: 0.56, turret: 0.5, orbit: 0.5, mine: 0.4 };
    const faseDe = c => (c.m.kind === 'charge' ? (c.m.charge || 0.75) + 0.06 : FASE[c.m.kind] || 0.3);

    /** Imagen fija: cada escenario se retrata un momento después de un lanzamiento (el que
     *  toca a su forma de jugar, o `fase` si se dice), así todos salen con lo suyo a la vista.
     *  alAvanzar: se llama en cada paso (la página mueve con él su reloj de mentira). */
    function foto(fase = 0, calienta = 1.2, tope = 9, alAvanzar = null) {
      const copia = document.createElement('canvas');
      copia.width = canvas.width; copia.height = canvas.height;
      const c2 = copia.getContext('2d'), falta = new Set(cells), Z = zoom;
      while (falta.size && t < tope) {
        if (alAvanzar) alAvanzar(1 / 60);
        paso(1 / 60);
        const listos = [...falta].filter(c => { const d = t - c.pl.castAt, f = fase || faseDe(c); return t > calienta && d >= f && d < f + 0.05; });
        if (!listos.length) continue;
        pinta();
        for (const c of listos) { falta.delete(c); c2.drawImage(canvas, c.dx * Z, c.dy * Z, CW * Z, CH * Z, c.dx * Z, c.dy * Z, CW * Z, CH * Z); }
      }
      pinta();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (const c of cells) if (!falta.has(c)) ctx.clearRect(c.dx * Z, c.dy * Z, CW * Z, CH * Z);
      ctx.drawImage(copia, 0, 0);
    }

    function correr() {
      let last = performance.now();
      const f = now => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        paso(dt); pinta();
        raf = requestAnimationFrame(f);
      };
      parar(); raf = requestAnimationFrame(f);
    }
    function parar() { cancelAnimationFrame(raf); }

    rehacer();
    return { paso, pinta, foto, correr, parar, rehacer, get cells() { return cells; } };
  }

  return { crear, calidad(n) { nivel = n; }, get nivel() { return nivel; }, CW, CH };
})();
