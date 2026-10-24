/* ============ combat.js — ejecución de movimientos y colisiones ============
 * Sólo se ejecuta el movimiento ACTIVO del jugador. Cada `kind` tiene aquí su
 * implementación. Todos los ataques dañan también los objetos destructibles
 * del escenario (rocas, cofres, hierba alta).
 *
 * Todo ocurre en el plano del suelo: (x, y) son pies / sombra.
 *
 * Cooperativo: cada ordenador ejecuta los ataques de SU jugador. Los de los
 * compañeros llegan por la red y se repiten como "fantasma" (ghostCast): se
 * ven igual, pero no hacen daño aquí (ya lo hizo su dueño).
 *
 * Lo que se queda en el mapa un rato (minas, meteoros que caen, torretas,
 * charcos del rastro) vive en `fields` y se actualiza/dibuja aquí.
 */
G.Combat = (() => {
  let ghost = false;
  let fields = [];

  // ---------------- ejecutar el movimiento activo ----------------

  function tick(dt, pl, now) {
    if (pl.dead || pl.restT > 0) return;                 // dormido con Descanso: no ataca
    // Vínculos: todos los movimientos del hueco activo, cada uno con su recarga.
    for (const m of pl.activeGroup()) tickMove(dt, pl, m, now);
  }

  function tickMove(dt, pl, m, now) {
    if (m.kind === 'orbit') { orbit(pl, m, dt, now); return; }

    m.t -= dt;
    if (m.t > 0) return;
    // Los ataques que necesitan blanco esperan a tenerlo (no gastes animación al aire).
    if (needsTarget(m, pl) && !(pl.target && G.U.dist(pl.x, pl.y, pl.target.x, pl.target.y) <= reach(m))) {
      m.t = 0.05;
      return;
    }
    // (Bromista: los potenciadores se recargan antes, ver data/ability-fx.js.)
    m.t = Math.max(0.05, m.cd * pl.cdMul * (G.Moves.isStatus(m) && pl.abil && pl.abil.statusCd || 1));
    pl.cast(m);
    if (G.Coop.active) G.Coop.cast(pl, m);
    // Vínculo: su icono destella en el HUD al lanzarse (uno que explota pegado al
    // enemigo, como Ascuas tras Ataque Rápido, casi no se ve).
    m.castAt = performance.now();

    runMove(pl, m);
  }

  function run(pl, m) {
    switch (m.kind) {
      case 'projectile': fireProjectiles(pl, m); break;
      case 'melee':      melee(pl, m); break;
      case 'beam':       beam(pl, m); break;
      case 'nova':       nova(pl, m); break;
      case 'aura':       aura(pl, m); break;
      case 'buff':       buff(pl, m); break;
      case 'boomerang':  boomerang(pl, m); break;
      case 'chain':      chain(pl, m); break;
      case 'mine':       mines(pl, m); break;
      case 'meteor':     meteors(pl, m); break;
      case 'turret':     turret(pl, m); break;
      case 'dash':       dash(pl, m); break;
      case 'trail':      trailPatch(pl, m); break;
      case 'cone':       cone(pl, m); break;
      case 'homing':     fireProjectiles(pl, m); break;      // persiguen: m.homing
      case 'bounce':     fireProjectiles(pl, m); break;      // rebotan: m.bounce (ver rebound)
      case 'charge':     chargeUp(pl, m); break;
      case 'spin':       spin(pl, m); break;
      case 'quake':      quake(pl, m); break;
      case 'vortex':     vortex(pl, m); break;
      case 'shove':      shove(pl, m); break;
      case 'stun':       stunZone(pl, m); break;
      case 'tremor':     tremor(pl, m); break;
      case 'wave':       wave(pl, m); break;
      case 'cross':      crossBlast(pl, m); break;
      case 'storm':      storm(pl, m); break;
      case 'weather':    weatherMove(pl, m); break;
      case 'punch':      punch(pl, m); break;
      case 'scissor':    scissor(pl, m); break;
      case 'blitz':      blitz(pl, m); break;
      case 'leap':       leap(pl, m); break;
      case 'guard':      guard(pl, m); break;
      case 'rest':       rest(pl, m); break;
      case 'screen':     screen(pl, m); break;
      case 'decoy':      decoy(pl, m); break;
      case 'boom':       boom(pl, m); break;
    }
  }

  const TARGETED = ['melee', 'beam', 'projectile', 'boomerang', 'chain', 'meteor', 'dash', 'cone',
                    'homing', 'bounce', 'charge', 'spin', 'quake', 'vortex', 'shove', 'stun',
                    'tremor', 'wave', 'cross', 'storm', 'punch', 'scissor', 'blitz', 'leap', 'boom'];
  // Con "Apuntar a mano" éstos se lanzan hacia donde apuntas aunque no haya
  // nadie (los decide el jugador); la cadena y los meteoros siguen esperando blanco.
  const FREE_AIM = ['melee', 'beam', 'projectile', 'boomerang', 'dash', 'cone', 'homing', 'bounce', 'charge', 'spin', 'quake', 'shove',
                    'tremor', 'wave', 'punch', 'scissor'];
  function needsTarget(m, pl) { return TARGETED.includes(m.kind) && !(pl && pl.manualAim && FREE_AIM.includes(m.kind)); }
  function reach(m) {
    if (m.kind === 'melee') return m.radius + 30;
    if (m.kind === 'beam') return m.radius + 20;
    if (m.kind === 'boomerang') return m.radius + 40;
    if (m.kind === 'chain') return 280;
    if (m.kind === 'meteor') return 340;
    if (m.kind === 'dash') return m.radius + 60;
    if (m.kind === 'cone') return m.speed * m.life + 30;
    if (m.kind === 'spin' || m.kind === 'shove' || m.kind === 'charge') return m.radius + 20;
    if (m.kind === 'quake') return (m.count | 0) * QSTEP + m.radius;
    if (m.kind === 'vortex' || m.kind === 'stun' || m.kind === 'cross') return 300;
    if (m.kind === 'tremor') return m.radius;
    if (m.kind === 'wave') return m.radius * 0.8;
    if (m.kind === 'storm') return 460;
    if (m.kind === 'punch' || m.kind === 'scissor') return m.radius + 30;
    if (m.kind === 'blitz') return m.radius;
    if (m.kind === 'leap') return m.range || 220;
    if (m.kind === 'boom') return m.radius * 0.8;          // no explota si no hay nadie cerca
    return 520;
  }

  function payload(m) {
    return { burn: m.burn || 0, poison: m.poison || 0, slow: m.slow || 0, knock: m.knock || 0, mtype: m.type, mcat: m.cat, src: m,
             bounce: m.bounce | 0, drain: m.drain || 0 };
  }

  /** Tabla de tipos × clima para un ataque de tipo `type` contra `e`.
   *  (Gafa Protectora, data/items.js: el clima sólo suma, nunca resta.) */
  function typeK(type, e, pl) {
    const w = G.Weather.mult(type);
    return G.Types.mult(type, e.types) * (pl && pl.item === 'safetygoggles' ? Math.max(1, w) : w);
  }

  /** Lanza un ataque; con el Dado Trucado, los de varios proyectiles o golpes, uno más. */
  function runMove(pl, m) {
    if (m.boost && !ghost && Math.random() < m.boost) {          // Viento Plata
      pl.addBuff('atk', 0.08, 6, 3); pl.addBuff('spd', 0.08, 6, 3);
      G.FX.dmgText(pl.x, pl.y - pl.bodyH - 8, G.T('¡Ataque y Velocidad suben!'), '#c9d6ff');
    }
    const dice = pl.item === 'loadeddice' && (m.count | 0) >= 2;
    if (dice) m.count++;
    try { run(pl, m); } finally { if (dice) m.count--; }
  }

  function fireProjectiles(pl, m) {
    const col = G.U.TYPE_COLOR[m.type];
    const vis = G.VFX.forMove(m);
    const n = Math.max(1, m.count | 0);
    const spread = m.spread || 0;
    for (let i = 0; i < n; i++) {
      const off = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread * n;
      const a = pl.aim + off + G.U.rand(-0.03, 0.03);
      G.Projectiles.spawn(Object.assign({
        x: pl.x + Math.cos(a) * 3, y: pl.y + Math.sin(a) * 3,
        vx: Math.cos(a) * m.speed, vy: Math.sin(a) * m.speed,
        dmg: m.dmg * pl.atkFor(m), r: m.size, life: m.life,
        pierce: m.pierce | 0, color: col, homing: m.homing || 0,
        hits: new Set(), vis, ghost, owner: pl
      }, payload(m)));
    }
    G.FX.spark(pl.x + Math.cos(pl.aim) * pl.r, pl.y - G.LIFT + Math.sin(pl.aim) * pl.r,
               col, Math.cos(pl.aim), Math.sin(pl.aim), 3);
  }

  function nova(pl, m) {
    const col = G.U.TYPE_COLOR[m.type];
    const vis = G.VFX.forMove(m);
    const n = Math.max(3, m.count | 0);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.2832 + G.U.rand(-0.06, 0.06);
      G.Projectiles.spawn(Object.assign({
        x: pl.x + Math.cos(a) * 3, y: pl.y + Math.sin(a) * 3,
        vx: Math.cos(a) * m.speed, vy: Math.sin(a) * m.speed,
        dmg: m.dmg * pl.atkFor(m), r: m.size, life: m.life,
        pierce: m.pierce | 0, color: col, homing: m.homing || 0,
        hits: new Set(), vis, ghost, owner: pl
      }, payload(m)));
    }
    G.FX.ring(pl.x, pl.y, pl.r, pl.r * 4, col, 0.3, 3);
  }

  function inArc(px, py, x, y, aim, half) {
    const a = Math.atan2(y - py, x - px);
    return Math.abs(((a - aim + Math.PI * 3) % 6.2832) - Math.PI) <= half;
  }

  function melee(pl, m) {
    const col = G.U.TYPE_COLOR[m.type];
    const half = Math.min(m.arc, 6.2832) / 2;
    G.FX.slash(pl.x, pl.y - G.LIFT * 0.5, pl.aim, m.radius, m.arc, col, G.VFX.forMove(m));
    if (ghost) return;

    for (const e of G.EnemyMgr.queryCircle(pl.x, pl.y, m.radius)) {
      if (!inArc(pl.x, pl.y, e.x, e.y, pl.aim, half)) continue;
      hit(pl, e, m.dmg * pl.atkFor(m), col, e.x - pl.x, e.y - pl.y, m.knock || 0, m);
    }
    for (const p of G.World.propsInCircle(pl.x, pl.y, m.radius)) {
      if (inArc(pl.x, pl.y, p.x, p.y, pl.aim, half)) G.World.damageProp(p, m.dmg * pl.atkFor(m), col);
    }
  }

  function beam(pl, m) {
    const col = G.U.TYPE_COLOR[m.type];
    const w = m.width;
    const ca = Math.cos(pl.aim), sa = Math.sin(pl.aim);

    // El rayo se corta en la primera pared.
    let len = m.radius;
    for (let d = 8; d < m.radius; d += 8) {
      if (G.World.isWall(pl.x + ca * d, pl.y + sa * d)) { len = d; break; }
    }
    G.FX.beam(pl.x, pl.y - G.LIFT, pl.aim, len, w, col, G.VFX.forMove(m));
    if (ghost) return;
    G.Camera.kick(0.08);

    const mx = pl.x + ca * len / 2, my = pl.y + sa * len / 2;
    const onBeam = (x, y, r) => {
      const px = x - pl.x, py = y - pl.y;
      const along = px * ca + py * sa;
      if (along < -r || along > len + r) return false;
      return Math.abs(-px * sa + py * ca) <= w / 2 + r;
    };
    for (const e of G.EnemyMgr.queryCircle(mx, my, len / 2 + w)) {
      if (onBeam(e.x, e.y, e.r)) hit(pl, e, m.dmg * pl.atkFor(m), col, ca, sa, 0, m);
    }
    for (const p of G.World.propsInCircle(mx, my, len / 2 + w)) {
      if (onBeam(p.x, p.y, p.r)) G.World.damageProp(p, m.dmg * pl.atkFor(m), col);
    }
  }

  function aura(pl, m) {
    const col = G.U.TYPE_COLOR[m.type];
    G.FX.ring(pl.x, pl.y, m.radius * 0.5, m.radius, col, 0.28, 2);
    const vis = G.VFX.forMove(m);
    if (vis.aura) {
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * 6.2832, r = m.radius * G.U.rand(0.45, 1);
        const x = pl.x + Math.cos(a) * r, y = pl.y + Math.sin(a) * r * 0.8 - G.LIFT * 0.5;
        // Hierba Lazo tira hacia ti; veneno y sombras suben; el resto gira.
        const v = vis.inward ? [-Math.cos(a) * r * 2.2, -Math.sin(a) * r * 1.8]
                : vis.rise ? [G.U.rand(-10, 10), -55]
                : [-Math.sin(a) * 70, Math.cos(a) * 55];
        G.FX.sp(vis.aura, vis.pal, x, y, { vx: v[0], vy: v[1], life: 0.42,
          spin: G.VFX.spins(vis.aura) ? G.U.rand(-6, 6) : 0 });
      }
    }
    if (ghost) return;
    let healed = 0;
    for (const e of G.EnemyMgr.queryCircle(pl.x, pl.y, m.radius)) {
      hit(pl, e, m.dmg * pl.atkFor(m), col, e.x - pl.x, e.y - pl.y, 0, m);
      if (m.drain) healed += m.drain;
    }
    for (const p of G.World.propsInCircle(pl.x, pl.y, m.radius)) G.World.damageProp(p, m.dmg * pl.atkFor(m), col);
    if (healed > 0) pl.heal(Math.min(healed, 6));
  }

  function buff(pl, m) {
    pl.addBuff(m.stat, m.amount, m.dur, m.stacks | 0);
    const col = G.U.TYPE_COLOR[m.type];
    G.FX.ring(pl.x, pl.y, pl.r * 2.4, pl.r * 1.1, col, 0.35, 2.5);
    const vis = G.VFX.forMove(m);
    for (let i = 0; i < 3; i++) {
      G.FX.sp(vis.buff || 'arrow', vis.pal, pl.x + G.U.rand(-pl.r * 1.4, pl.r * 1.4),
              pl.y - G.U.rand(0, pl.bodyH * 0.8), { vy: -70, life: 0.6 });
    }
  }

  // ---------------- familias nuevas (2026-10-10) ----------------

  /** Bumerán: sale hacia el enemigo, se para y vuelve a ti golpeando a la ida y a la vuelta. */
  function boomerang(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    const n = Math.max(1, m.count | 0), spread = m.spread || 0.5;
    const out = m.radius / m.speed;                       // segundos de ida
    for (let i = 0; i < n; i++) {
      const a = pl.aim + (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread * Math.min(n, 3));
      G.Projectiles.spawn(Object.assign({
        x: pl.x, y: pl.y, vx: Math.cos(a) * m.speed, vy: Math.sin(a) * m.speed,
        dmg: m.dmg * pl.atkFor(m), r: m.size, life: out * 4 + 1.5, pierce: 999, color: col,
        hits: new Set(), vis, ghost, owner: pl, boom: out, bsp: m.speed * 1.1
      }, payload(m)));
    }
  }

  /** Cadena: golpea a un enemigo y salta a los siguientes más cercanos (cada salto, algo menos). */
  function chain(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    let cur = pl.target && !pl.target.dead && pl.target.hurt ? pl.target : G.Projectiles.nearest(G.EnemyMgr.all(), pl.x, pl.y, reach(m));
    if (!cur) return;
    let fx = pl.x, fy = pl.y - G.LIFT, k = 1;
    const done = new Set();
    const n = Math.max(1, m.count | 0);
    for (let i = 0; i < n && cur; i++) {
      done.add(cur.id);
      const tx = cur.x, ty = cur.y - cur.bodyH * 0.5;
      G.FX.beam(fx, fy, Math.atan2(ty - fy, tx - fx), Math.hypot(tx - fx, ty - fy), 10, col, vis);
      if (!ghost) {
        // Infortunio: más daño a quien ya sufre un estado.
        // (Una copia del anfitrión no lleva los estados: vienen en net.st.)
        const hex = m.hex && (cur.burn > 0 || cur.poison > 0 || cur.slow > 0 || (cur.net && cur.net.st & 11)) ? m.hex : 1;
        hit(pl, cur, m.dmg * pl.atkFor(m) * k * hex, col, tx - fx, ty - fy, 0, m);
      }
      k *= 0.85;
      fx = tx; fy = ty;
      let best = null, bd = m.radius * m.radius;
      for (const e of G.EnemyMgr.queryCircle(cur.x, cur.y, m.radius)) {
        if (done.has(e.id)) continue;
        const d = G.U.dist2(cur.x, cur.y, e.x, e.y);
        if (d < bd) { bd = d; best = e; }
      }
      cur = best;
    }
    if (!ghost) G.Camera.kick(0.05);
  }

  /** Minas: se quedan en el suelo y estallan cuando un enemigo las pisa. */
  function mines(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    const n = Math.max(1, m.count | 0);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.2832, d = n === 1 ? 0 : G.U.rand(18, 46);
      fields.push({ kind: 'mine', owner: pl, ghost, m, col, vis, x: pl.x + Math.cos(a) * d, y: pl.y + Math.sin(a) * d * 0.8,
                    t: 0, arm: 0.35, life: m.dur || 7, r: m.radius, dmg: m.dmg * pl.atkFor(m) });
    }
    // Como mucho unas pocas por jugador: las más viejas se van.
    const mine = fields.filter(f => f.kind === 'mine' && f.owner === pl);
    for (const f of mine.slice(0, Math.max(0, mine.length - (4 + n * 2)))) f.gone = true;
  }

  /** Meteoros: caen del cielo sobre enemigos cercanos (la sombra avisa dónde). */
  function meteors(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    const n = Math.max(1, m.count | 0);
    const near = G.EnemyMgr.queryCircle(pl.x, pl.y, reach(m)).filter(e => !e.dead);
    G.U.shuffle ? G.U.shuffle(near) : near.sort(() => Math.random() - 0.5);
    for (let i = 0; i < n; i++) {
      const e = near[i];
      const x = e ? e.x + G.U.rand(-8, 8) : pl.x + G.U.rand(-140, 140);
      const y = e ? e.y + G.U.rand(-6, 6) : pl.y + G.U.rand(-110, 110);
      fields.push({ kind: 'meteor', owner: pl, ghost, m, col, vis, x, y, t: -i * 0.09, fall: 0.5, r: m.radius, dmg: m.dmg * pl.atkFor(m) });
    }
  }

  /** Torreta: deja algo en el suelo que dispara solo un rato. */
  function turret(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    const a = pl.aim + Math.PI + G.U.rand(-0.6, 0.6);
    fields.push({ kind: 'turret', owner: pl, ghost, m, col, vis, x: pl.x + Math.cos(a) * 26, y: pl.y + Math.sin(a) * 20,
                  t: 0, life: m.dur || 6, shotT: 0.3, dmg: m.dmg * pl.atkFor(m) });
    const mine = fields.filter(f => f.kind === 'turret' && f.owner === pl && !f.gone);
    for (const f of mine.slice(0, Math.max(0, mine.length - Math.max(1, m.count | 0)))) f.gone = true;
    G.FX.ring(pl.x, pl.y, 4, 30, col, 0.3, 2);
  }

  /** Embestida: cruzas como un rayo hacia el enemigo y golpeas a todo lo del camino. */
  function dash(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    const ca = Math.cos(pl.aim), sa = Math.sin(pl.aim);
    const sx = pl.x, sy = pl.y;
    let len = 0;
    for (let d = 8; d <= m.radius; d += 8) {
      if (!G.World.isFree(sx + ca * d, sy + sa * d, pl.r * 0.8, true)) break;
      len = d;
    }
    // Estela: varias copias del golpe a lo largo del recorrido.
    for (let d = 0; d <= len; d += 22) G.FX.sp(vis.proj || 'streak', vis.pal, sx + ca * d, sy + sa * d - G.LIFT * 0.6, { life: 0.22, angle: pl.aim });
    G.FX.slash(sx + ca * len, sy + sa * len - G.LIFT * 0.5, pl.aim, 34, 2.2, col, vis);
    if (ghost) return;
    pl.x = sx + ca * len; pl.y = sy + sa * len;
    G.World.collide(pl);
    pl.invuln = Math.max(pl.invuln || 0, 0.3);
    const w = m.width || 34;
    const mx = sx + ca * len / 2, my = sy + sa * len / 2;
    for (const e of G.EnemyMgr.queryCircle(mx, my, len / 2 + w)) {
      if (segDist2(sx, sy, pl.x, pl.y, e.x, e.y) <= (w / 2 + e.r) ** 2) hit(pl, e, m.dmg * pl.atkFor(m), col, ca, sa, m.knock || 0, m);
    }
    for (const p of G.World.propsInCircle(mx, my, len / 2 + w)) {
      if (segDist2(sx, sy, pl.x, pl.y, p.x, p.y) <= (w / 2 + p.r) ** 2) G.World.damageProp(p, m.dmg * pl.atkFor(m), col);
    }
    G.Camera.kick(0.12);
  }

  /** Rastro: vas dejando charcos que dañan a lo que pasa por encima. */
  function trailPatch(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    // Parado no deja uno nuevo encima del anterior (sólo de vez en cuando).
    const last = pl.lastPatch;
    if (last && G.U.dist2(last.x, last.y, pl.x, pl.y) < (m.radius * 0.9) ** 2 && last.t < 1) return;
    const f = { kind: 'patch', owner: pl, ghost, m, col, vis, x: pl.x, y: pl.y, t: 0, life: m.dur || 3, r: m.radius,
                tick: 0, dmg: m.dmg * pl.atkFor(m) };
    fields.push(f);
    pl.lastPatch = f;
    const mine = fields.filter(o => o.kind === 'patch' && o.owner === pl && !o.gone);
    for (const o of mine.slice(0, Math.max(0, mine.length - 18))) o.gone = true;
  }

  /** Abanico corto: muchos disparos rápidos que no llegan lejos (aliento, chorro...). */
  function cone(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    const n = Math.max(2, m.count | 0), arc = m.arc || 0.9;
    for (let i = 0; i < n; i++) {
      const a = pl.aim + (i / (n - 1) - 0.5) * arc + G.U.rand(-0.05, 0.05);
      const sp = m.speed * G.U.rand(0.85, 1.1);
      G.Projectiles.spawn(Object.assign({
        x: pl.x + Math.cos(a) * 4, y: pl.y + Math.sin(a) * 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        dmg: m.dmg * pl.atkFor(m), r: m.size, life: m.life * G.U.rand(0.85, 1.05), pierce: m.pierce | 0, color: col,
        hits: new Set(), vis, ghost, owner: pl
      }, payload(m)));
    }
    G.FX.spark(pl.x + Math.cos(pl.aim) * pl.r, pl.y - G.LIFT + Math.sin(pl.aim) * pl.r, col, Math.cos(pl.aim), Math.sin(pl.aim), 5);
  }

  // ---------------- familias nuevas (2026-10-19) ----------------

  const QSTEP = 34;             // distancia entre ondas de un terremoto

  /** El blanco de un ataque que va a un sitio (remolino, zona): el de siempre si llega; si no, el más cercano. */
  function spotFor(pl, m) {
    const t = pl.target;
    if (t && !t.dead && t.hurt && G.U.dist(pl.x, pl.y, t.x, t.y) <= reach(m)) return t;
    return G.Projectiles.nearest(G.EnemyMgr.all(), pl.x, pl.y, reach(m));
  }

  /** Carga: brilla un momento y sale un rayo enorme (el de beam, con su grosor). */
  function chargeUp(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m), at = m.charge || 0.75;
    fields.push({ kind: 'charge', owner: pl, ghost, m, col, vis, x: pl.x, y: pl.y, t: 0, at });
    G.FX.ring(pl.x, pl.y - G.LIFT * 0.5, pl.r * 3.2, pl.r * 0.8, col, at, 2);
  }

  /** Giro: golpea todo alrededor `count` veces seguidas (lo hace updateFields). */
  function spin(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    fields.push({ kind: 'spin', owner: pl, ghost, m, col, vis, x: pl.x, y: pl.y, t: 0, n: Math.max(1, m.count | 0), next: 0, a: pl.aim });
  }

  /** Terremoto: una onda avanza en línea delante de ti, explosión tras explosión. */
  function quake(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    fields.push({ kind: 'quake', owner: pl, ghost, m, col, vis, x: pl.x, y: pl.y, t: 0, ca: Math.cos(pl.aim), sa: Math.sin(pl.aim),
                  i: 0, n: Math.max(1, m.count | 0), next: 0, dmg: m.dmg * pl.atkFor(m) });
    if (!ghost) G.Camera.kick(0.1);
  }

  /** Remolino: sale donde está el enemigo, los atrae al centro y les va dañando. */
  function vortex(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m), tg = spotFor(pl, m);
    const x = tg ? tg.x : pl.x + Math.cos(pl.aim) * 120, y = tg ? tg.y : pl.y + Math.sin(pl.aim) * 100;
    fields.push({ kind: 'vortex', owner: pl, ghost, m, col, vis, x, y, t: 0, life: m.dur || 2.6, r: m.radius,
                  tick: 0.15, dmg: m.dmg * pl.atkFor(m), pull: m.pull || 140 });
    G.FX.ring(x, y, m.radius, 6, col, 0.4, 3);
    // Como mucho dos a la vez por jugador.
    const mine = fields.filter(f => f.kind === 'vortex' && f.owner === pl && !f.gone);
    for (const f of mine.slice(0, Math.max(0, mine.length - 2))) f.gone = true;
  }

  /** Empujón: onda alrededor que daña y aparta a los enemigos (no a los jefes). */
  function shove(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    G.FX.ring(pl.x, pl.y, pl.r, m.radius, col, 0.35, 4);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 6.2832;
      G.FX.sp(vis.proj, vis.pal, pl.x + Math.cos(a) * pl.r, pl.y + Math.sin(a) * pl.r * 0.8 - G.LIFT * 0.5,
              { vx: Math.cos(a) * m.radius * 3, vy: Math.sin(a) * m.radius * 2.4, life: 0.3, angle: a });
    }
    if (ghost) return;
    G.Camera.kick(0.1);
    for (const e of G.EnemyMgr.queryCircle(pl.x, pl.y, m.radius)) hit(pl, e, m.dmg * pl.atkFor(m), col, e.x - pl.x, e.y - pl.y, m.knock || 300, m);
    for (const p of G.World.propsInCircle(pl.x, pl.y, m.radius)) G.World.damageProp(p, m.dmg * pl.atkFor(m), col);
  }

  /** Aturdir: una zona avisa en el suelo y al momento daña y deja quietos a los que pilla. */
  function stunZone(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m), tg = spotFor(pl, m);
    if (!tg) return;
    fields.push({ kind: 'stunzone', owner: pl, ghost, m, col, vis, x: tg.x, y: tg.y, t: 0, delay: 0.45, r: m.radius, dmg: m.dmg * pl.atkFor(m) });
  }

  // ---------------- tanda A de MT (23-10-2026, de la lista de Pokémon Edición Reloaded) ----------------

  /** Terremoto: un anillo sale de ti hasta `radius` y golpea una vez a cada uno que alcanza. */
  function tremor(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    fields.push({ kind: 'tremor', owner: pl, ghost, m, col, vis, x: pl.x, y: pl.y, t: 0, life: 0.55, r: m.radius,
                  dmg: m.dmg * pl.atkFor(m), hits: new Set() });
    if (!ghost) G.Camera.kick(0.4);
  }

  /** Surf: una ola de `width` de ancho sale de detrás de ti y cruza hacia donde apuntas, arrastrando. */
  function wave(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m), ca = Math.cos(pl.aim), sa = Math.sin(pl.aim);
    fields.push({ kind: 'wave', owner: pl, ghost, m, col, vis, x: pl.x - ca * 50, y: pl.y - sa * 50, ca, sa, a: pl.aim,
                  t: 0, d: 0, len: m.radius + 50, w: m.width, dmg: m.dmg * pl.atkFor(m), hits: new Set() });
  }

  /** Llamarada: explosión en cruz (brazos de `radius`) sobre un enemigo, tras un aviso corto. */
  function crossBlast(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m), tg = spotFor(pl, m);
    if (!tg) return;
    fields.push({ kind: 'cross', owner: pl, ghost, m, col, vis, x: tg.x, y: tg.y, t: 0, delay: 0.3, r: m.radius,
                  w: m.width, dmg: m.dmg * pl.atkFor(m) });
  }

  /** Trueno: caen `count` rayos sobre enemigos al azar de los que se ven (no los más cercanos). */
  function storm(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    const seen = G.EnemyMgr.all().filter(e => !e.dead && G.Camera.sees(e.x, e.y, 0));
    if (!seen.length) return;
    const n = Math.max(1, m.count | 0);
    for (let i = 0; i < n; i++) {
      const e = G.U.pick(seen);
      fields.push({ kind: 'bolt', owner: pl, ghost, m, col, vis, x: e.x + G.U.rand(-12, 12), y: e.y + G.U.rand(-8, 8),
                    t: -i * 0.09, delay: 0.32, r: m.radius, dmg: m.dmg * pl.atkFor(m), struck: false });
    }
  }

  /** Día Soleado, Danza Lluvia, Tormenta Arena: ponen el clima `wx` (lo decide quien manda el clima). */
  function weatherMove(pl, m) {
    const d = G.Weather.KINDS[m.wx];
    if (!d) return;
    G.FX.ring(pl.x, pl.y - G.LIFT * 0.5, pl.r, pl.r * 4, d.color, 0.5, 3);
    for (let i = 0; i < 10; i++) G.FX.px(pl.x + G.U.rand(-20, 20), pl.y - G.U.rand(0, 40), d.color, { vy: -G.U.rand(60, 120), life: 0.6 });
    // En el invitado no se pone: al anfitrión le llega el fantasma de su ataque y lo manda a todos.
    if (!ghost || G.Coop.isHost) G.Weather.cast(m.wx, m.dur);
  }

  // ---------------- tanda B de MT (23-10-2026): golpes ----------------

  /** Puños: `count` directos seguidos delante; el último con su extra (stun, zap). */
  function punch(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    fields.push({ kind: 'punch', owner: pl, ghost, m, col, vis, x: pl.x, y: pl.y, t: 0, n: Math.max(1, m.count | 0), i: 0, next: 0 });
  }

  /** Tijera X: dos tajos cruzados; lo que está en los dos arcos recibe dos golpes. */
  function scissor(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m), half = m.arc / 2;
    for (const off of [-0.45, 0.45]) {
      const a = pl.aim + off;
      G.FX.slash(pl.x, pl.y - G.LIFT * 0.5, a, m.radius, m.arc, col, vis);
      if (ghost) continue;
      for (const e of G.EnemyMgr.queryCircle(pl.x, pl.y, m.radius)) {
        if (inArc(pl.x, pl.y, e.x, e.y, a, half)) hit(pl, e, m.dmg * pl.atkFor(m), col, e.x - pl.x, e.y - pl.y, 30, m);
      }
      for (const p of G.World.propsInCircle(pl.x, pl.y, m.radius)) if (inArc(pl.x, pl.y, p.x, p.y, a, half)) G.World.damageProp(p, m.dmg * pl.atkFor(m), col);
    }
  }

  /** Puño Trueno: desde `from`, un chispazo a los `m.zap` enemigos más cercanos. */
  function zapFrom(pl, from, m, d, col) {
    const near = G.EnemyMgr.queryCircle(from.x, from.y, 130).filter(e => e !== from && !e.dead)
      .sort((a, b) => G.U.dist2(a.x, a.y, from.x, from.y) - G.U.dist2(b.x, b.y, from.x, from.y)).slice(0, m.zap);
    for (const e of near) {
      G.FX.beam(from.x, from.y - G.LIFT * 0.5, Math.atan2(e.y - from.y, e.x - from.x), Math.hypot(e.x - from.x, e.y - from.y), 8, col, { pal: 'electric', beam: 'lightning' });
      hit(pl, e, d, col, e.x - from.x, e.y - from.y, 0, m);
    }
  }

  /** Velocidad Extrema: saltas de un enemigo al siguiente más cercano, `count` veces. */
  function blitz(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m);
    fields.push({ kind: 'blitz', owner: pl, ghost, m, col, vis, x: pl.x, y: pl.y, t: 0, n: Math.max(1, m.count | 0), i: 0, next: 0, done: new Set() });
  }

  /** Acróbata: salto sobre el enemigo y onda al caer (×noItem si no llevas objeto). */
  function leap(pl, m) {
    const col = G.U.TYPE_COLOR[m.type], vis = G.VFX.forMove(m), tg = spotFor(pl, m);
    if (!tg) return;
    fields.push({ kind: 'leap', owner: pl, ghost, m, col, vis, x: tg.x, y: tg.y, sx: pl.x, sy: pl.y, t: 0, fly: 0.32, r: m.radius,
                  dmg: m.dmg * pl.atkFor(m) * (m.noItem && !pl.item ? m.noItem : 1) });
    if (!ghost) pl.invuln = Math.max(pl.invuln || 0, 0.45);
  }

  // ---------------- tanda D de MT (23-10-2026): apoyo ----------------
  // (Lo de tu Pokémon sólo en tu pantalla: el fantasma de un compañero sólo se ve.)

  /** Protección: no recibes daño durante `dur` s. */
  function guard(pl, m) {
    G.FX.ring(pl.x, pl.y - G.LIFT * 0.5, pl.r * 3, pl.r * 1.2, '#9ae6ff', 0.3, 3);
    if (ghost) return;
    pl.guardT = m.dur;
    G.FX.dmgText(pl.x, pl.y - pl.bodyH - 8, G.T('Protección'), '#9ae6ff');
  }

  /** Descanso: cura `amount` y duermes `dur` s (ni te mueves ni atacas). */
  function rest(pl, m) {
    if (ghost) return;
    if (pl.hp >= pl.maxHp * 0.98) { m.t = 1; return; }        // con la vida llena no se duerme
    pl.heal(pl.maxHp * m.amount);
    pl.restT = m.dur;
    G.FX.ring(pl.x, pl.y, 6, 60, '#c9a6ff', 0.5, 3);
  }

  /** Reflejo / Pantalla Luz: −`amount` de daño de su categoría durante `dur` s. */
  function screen(pl, m) {
    const col = m.shield === 'physical' ? '#ffcb3d' : '#c47bff';
    G.FX.ring(pl.x, pl.y - G.LIFT * 0.5, pl.r, pl.r * 3.5, col, 0.4, 3);
    if (ghost) return;
    pl.screens = pl.screens || {};
    pl.screens[m.shield] = { t: m.dur, k: m.amount };
    G.FX.dmgText(pl.x, pl.y - pl.bodyH - 8, G.T(m.name, 'move'), col);
  }

  /** Doble Equipo: copias tuyas que atraen a los enemigos cercanos (las mueve quien mueve a los enemigos). */
  function decoy(pl, m) {
    const n = Math.max(1, m.count | 0);
    for (let i = 0; i < n; i++) {
      const a = pl.aim + Math.PI + (i - (n - 1) / 2) * 0.9;
      const x = pl.x + Math.cos(a) * 50, y = pl.y + Math.sin(a) * 40;
      fields.push({ kind: 'decoy', owner: pl, ghost, m, col: '#ffffff', vis: null, x, y, t: 0, life: m.dur, r: pl.r,
                    pull: m.radius, _vx: 0, _vy: 0, dead: false });
      G.FX.burst(x, y - 10, '#e8fbff', 8, 90);
    }
  }
  /** Los señuelos que hay ahora (enemy.js: los enemigos cercanos van a por ellos). */
  function decoys() {
    if (G.Coop.active && !G.Coop.isHost) return [];
    return fields.filter(f => f.kind === 'decoy' && !f.gone && f.t < f.life);
  }

  /** Explosión: daña todo a `radius` y te cuesta `cost` de la vida que te queda (nunca te deja KO). */
  function boom(pl, m) {
    const col = G.U.TYPE_COLOR.fire;
    G.FX.ring(pl.x, pl.y, 8, m.radius, '#ffffff', 0.35, 6);
    G.FX.ring(pl.x, pl.y, 8, m.radius * 0.8, col, 0.45, 5);
    G.FX.burst(pl.x, pl.y - 10, col, 30, 260);
    G.Audio.sfx('boss');
    if (ghost) return;
    G.Camera.kick(1);
    pl.hp = Math.max(1, pl.hp - Math.max(1, pl.hp * m.cost));
    for (const e of G.EnemyMgr.queryCircle(pl.x, pl.y, m.radius)) hit(pl, e, m.dmg * pl.atkFor(m), col, e.x - pl.x, e.y - pl.y, m.knock || 200, m);
    for (const p of G.World.propsInCircle(pl.x, pl.y, m.radius)) G.World.damageProp(p, m.dmg * pl.atkFor(m), col);
  }

  /** Rebote: el proyectil sale hacia el enemigo más cercano que aún no ha tocado. → true si rebota. */
  function rebound(p, from) {
    if (!(p.bounce > 0)) return false;
    let best = null, bd = 220 * 220;
    for (const e of G.EnemyMgr.queryCircle(from.x, from.y, 220)) {
      if (e.dead || p.hits.has(e.id)) continue;
      const d = G.U.dist2(from.x, from.y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    if (!best) return false;
    p.bounce--;
    const sp = Math.hypot(p.vx, p.vy) || 300, [nx, ny] = G.U.norm(best.x - from.x, best.y - from.y);
    p.vx = nx * sp; p.vy = ny * sp; p.x = from.x; p.y = from.y;
    p.t = Math.max(0, p.t - 0.5);                   // un poco más de vida para llegar
    if (Math.random() < 0.6) G.FX.spark(from.x, from.y - G.LIFT, p.color, nx, ny, 3);
    return true;
  }

  /** Cada fotograma de los campos nuevos (los llama updateFields). → true si hay que quitarlo. */
  function tickNewField(f, dt) {
    const pl = f.owner, m = f.m;
    if (f.kind === 'charge') {
      f.x = pl.x; f.y = pl.y;
      // La energía se junta en ti mientras carga.
      if (Math.random() < dt * 30 && G.Camera.sees(f.x, f.y, 40)) {
        const a = Math.random() * 6.2832, r = G.U.rand(30, 60);
        G.FX.sp(f.vis.proj, f.vis.pal, f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.8 - G.LIFT,
                { vx: -Math.cos(a) * r * 3, vy: -Math.sin(a) * r * 2.4, life: 0.3 });
      }
      if (f.t < f.at) return false;
      if (pl.dead) return true;
      const g = ghost; ghost = f.ghost;
      try { beam(pl, m); } finally { ghost = g; }
      if (!f.ghost) G.Camera.kick(0.25);
      return true;
    }
    if (f.kind === 'spin') {
      f.next -= dt;
      if (f.next > 0) return false;
      f.next = 0.13;
      G.FX.slash(pl.x, pl.y - G.LIFT * 0.5, f.a, m.radius, 3.6, f.col, f.vis);
      f.a += 2.2;
      if (!f.ghost && !pl.dead) {
        const d = m.dmg * pl.atkFor(m);
        for (const e of G.EnemyMgr.queryCircle(pl.x, pl.y, m.radius)) hit(pl, e, d, f.col, e.x - pl.x, e.y - pl.y, 40, m);
        for (const p of G.World.propsInCircle(pl.x, pl.y, m.radius)) G.World.damageProp(p, d, f.col);
      }
      return --f.n <= 0;
    }
    if (f.kind === 'quake') {
      f.next -= dt;
      while (f.next <= 0 && f.i < f.n) {
        f.next += 0.07; f.i++;
        const x = f.x + f.ca * f.i * QSTEP, y = f.y + f.sa * f.i * QSTEP, r = m.radius;
        if (G.World.isWall(x, y)) { f.i = f.n; break; }
        if (G.Camera.sees(x, y, 40)) {
          G.FX.ring(x, y, 4, r, f.col, 0.3, 3);
          G.FX.burst(x, y - 4, f.col, 6, 120);
          for (let k = 0; k < 2; k++) G.FX.sp(f.vis.proj, f.vis.pal, x + G.U.rand(-r, r) * 0.5, y - 4, { vy: -G.U.rand(50, 90), vx: G.U.rand(-30, 30), life: 0.35 });
        }
        blast({ ghost: f.ghost, owner: pl, m, col: f.col, dmg: f.dmg, x, y }, r);
      }
      return f.i >= f.n;
    }
    if (f.kind === 'vortex') {
      // Atrae quien tiene los enemigos de verdad: el anfitrión, también con el
      // remolino (fantasma) de un invitado. En el invitado son copias y no se tocan.
      // Antes el fantasma no atraía y en grupo el remolino de un invitado no hacía nada.
      for (const e of G.EnemyMgr.queryCircle(f.x, f.y, f.r * 1.4)) {
        if (e.dead || e.remote) continue;
        const dx = f.x - e.x, dy = f.y - e.y, d = Math.hypot(dx, dy);
        if (d < 4) continue;
        const k = Math.min(d, f.pull * dt * (e.boss || e.judge ? 0.25 : 1));
        e.x += dx / d * k; e.y += dy / d * k;
      }
      f.tick -= dt;
      if (f.tick <= 0) { f.tick = 0.4; blast(f, f.r); }
      if (Math.random() < dt * 16 && G.Camera.sees(f.x, f.y, 40)) {
        const a = Math.random() * 6.2832, rr = f.r * G.U.rand(0.5, 1);
        G.FX.sp(f.vis.proj, f.vis.pal, f.x + Math.cos(a) * rr, f.y + Math.sin(a) * rr * 0.6 - 4,
                { vx: -Math.sin(a) * 110 - Math.cos(a) * 60, vy: Math.cos(a) * 66 - Math.sin(a) * 36, life: 0.45,
                  spin: G.VFX.spins(f.vis.proj) ? 8 : 0 });
      }
      return false;
    }
    if (f.kind === 'punch') {
      f.next -= dt;
      if (f.next > 0) return false;
      f.next = 0.09;
      f.i++;
      const last = f.i >= f.n, a = pl.aim + (f.i % 2 ? -0.18 : 0.18), half = m.arc / 2;
      G.FX.slash(pl.x + Math.cos(a) * 10, pl.y + Math.sin(a) * 10 - G.LIFT * 0.5, a, m.radius, m.arc * 0.7, f.col, f.vis);
      if (!f.ghost && !pl.dead) {
        let healed = 0;
        const d = m.dmg * pl.atkFor(m) * (last ? 1.4 : 1);         // el último, más fuerte
        for (const e of G.EnemyMgr.queryCircle(pl.x, pl.y, m.radius)) {
          if (!inArc(pl.x, pl.y, e.x, e.y, a, half)) continue;
          hit(pl, e, d, f.col, e.x - pl.x, e.y - pl.y, last ? 70 : 10, m);
          if (m.drain) healed += m.drain;
          if (last && m.stun && !e.dead) e.applyStun(m.stun * (e.boss || e.judge ? 0.35 : 1));
          if (last && m.zap && !e.dead) zapFrom(pl, e, m, d * 0.6, f.col);
        }
        for (const p of G.World.propsInCircle(pl.x, pl.y, m.radius)) if (inArc(pl.x, pl.y, p.x, p.y, a, half)) G.World.damageProp(p, d, f.col);
        if (healed > 0) pl.heal(Math.min(healed, 6));
      }
      return last;
    }
    if (f.kind === 'blitz') {
      f.next -= dt;
      if (f.next > 0) return false;
      f.next = 0.08;
      if (f.ghost || pl.dead) return true;
      const e = G.EnemyMgr.queryCircle(pl.x, pl.y, m.radius).filter(x => !x.dead && !f.done.has(x))
        .sort((a, b) => G.U.dist2(a.x, a.y, pl.x, pl.y) - G.U.dist2(b.x, b.y, pl.x, pl.y))[0];
      if (!e) return true;
      f.done.add(e);
      const sx = pl.x, sy = pl.y, ang = Math.atan2(e.y - sy, e.x - sx);
      // Te pones a su lado (si cabes) y le golpeas.
      const tx = e.x - Math.cos(ang) * (e.r + pl.r), ty = e.y - Math.sin(ang) * (e.r + pl.r);
      if (G.World.isFree(tx, ty, pl.r * 0.8, true)) { pl.x = tx; pl.y = ty; G.World.collide(pl); }
      for (let d = 0; d <= 1; d += 0.2) G.FX.sp(f.vis.proj || 'streak', f.vis.pal, sx + (pl.x - sx) * d, sy + (pl.y - sy) * d - G.LIFT * 0.6, { life: 0.2, angle: ang });
      pl.invuln = Math.max(pl.invuln || 0, 0.25);
      hit(pl, e, m.dmg * pl.atkFor(m), f.col, Math.cos(ang), Math.sin(ang), 50, m);
      G.FX.slash(e.x, e.y - G.LIFT * 0.5, ang, 30, 2, f.col, f.vis);
      return ++f.i >= f.n;
    }
    if (f.kind === 'leap') {
      if (f.t < f.fly) return false;
      if (!f.ghost && !pl.dead && G.World.isFree(f.x, f.y, pl.r * 0.8, true)) { pl.x = f.x; pl.y = f.y; G.World.collide(pl); }
      if (G.Camera.sees(f.x, f.y, f.r)) {
        G.FX.ring(f.x, f.y, 4, f.r, f.col, 0.3, 4);
        G.FX.burst(f.x, f.y - 6, f.col, 10, 160);
        if (!f.ghost) G.Camera.kick(0.25);
      }
      blast(f, f.r);
      return true;
    }
    if (f.kind === 'tremor') {
      const rr = f.r * Math.min(1, f.t / f.life);
      if (G.Camera.sees(f.x, f.y, f.r) && Math.random() < 0.9) {
        const a = Math.random() * 6.2832;
        G.FX.sp(f.vis.proj, f.vis.pal, f.x + Math.cos(a) * rr, f.y + Math.sin(a) * rr * 0.6 - 4, { vy: -G.U.rand(40, 90), life: 0.3 });
      }
      if (!f.ghost && !pl.dead) {
        for (const e of G.EnemyMgr.queryCircle(f.x, f.y, rr)) {
          if (f.hits.has(e)) continue;
          f.hits.add(e);
          hit(pl, e, f.dmg, f.col, e.x - f.x, e.y - f.y, m.knock || 0, m);
        }
        for (const p of G.World.propsInCircle(f.x, f.y, rr)) if (!f.hits.has(p)) { f.hits.add(p); G.World.damageProp(p, f.dmg, f.col); }
      }
      return f.t >= f.life;
    }
    if (f.kind === 'wave') {
      f.d += m.speed * dt;
      const cx = f.x + f.ca * f.d, cy = f.y + f.sa * f.d;
      if (Math.random() < dt * 30 && G.Camera.sees(cx, cy, f.w)) {
        const o = G.U.rand(-f.w / 2, f.w / 2);
        G.FX.px(cx - f.sa * o, cy + f.ca * o - 6, '#e8fbff', { vx: f.ca * 80, vy: -40 + f.sa * 80, life: 0.4 });
      }
      if (!f.ghost && !pl.dead) {
        for (const e of G.EnemyMgr.queryCircle(cx, cy, f.w / 2 + 30)) {
          const along = (e.x - f.x) * f.ca + (e.y - f.y) * f.sa, side = -(e.x - f.x) * f.sa + (e.y - f.y) * f.ca;
          if (Math.abs(side) > f.w / 2 || along < f.d - 34 || along > f.d + 14) continue;
          if (!f.hits.has(e)) { f.hits.add(e); hit(pl, e, f.dmg, f.col, f.ca, f.sa, 0, m); }
          // La ola los arrastra (menos a los jefes; las copias del invitado las mueve el anfitrión).
          if (!e.dead && !e.remote) {
            const k = m.speed * dt * (e.boss || e.judge ? 0.15 : 0.75) * Math.min(1.5, (m.knock || 160) / 160);
            e.x += f.ca * k; e.y += f.sa * k;
          }
        }
        for (const p of G.World.propsInCircle(cx, cy, f.w / 2)) if (!f.hits.has(p)) { f.hits.add(p); G.World.damageProp(p, f.dmg, f.col); }
      }
      return f.d >= f.len;
    }
    if (f.kind === 'cross') {
      if (f.t < f.delay) return false;
      if (G.Camera.sees(f.x, f.y, f.r)) {
        G.FX.ring(f.x, f.y, 4, f.w * 1.4, f.col, 0.3, 4);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          for (let k = 1; k <= 4; k++) G.FX.burst(f.x + dx * f.r * k / 4, f.y + dy * f.r * 0.6 * k / 4 - 4, f.col, 4, 110);
        }
        G.Audio.sfx('break');
        if (!f.ghost) G.Camera.kick(0.2);
      }
      if (!f.ghost) {
        const inCross = (x, y, r) => {
          const dx = Math.abs(x - f.x), dy = Math.abs(y - f.y) / 0.6;
          return (dx <= f.r + r && dy <= f.w / 2 + r) || (dy <= f.r + r && dx <= f.w / 2 + r);
        };
        for (const e of G.EnemyMgr.queryCircle(f.x, f.y, f.r + 30)) if (inCross(e.x, e.y, e.r)) hit(pl, e, f.dmg, f.col, e.x - f.x, e.y - f.y, 40, m);
        for (const p of G.World.propsInCircle(f.x, f.y, f.r)) if (inCross(p.x, p.y, p.r || 8)) G.World.damageProp(p, f.dmg, f.col);
      }
      return true;
    }
    if (f.kind === 'bolt') {
      if (f.t < f.delay) return false;
      if (!f.struck) {
        f.struck = true;
        if (G.Camera.sees(f.x, f.y, 60)) {
          G.FX.ring(f.x, f.y, 3, f.r, '#fff7b0', 0.25, 3);
          G.FX.burst(f.x, f.y - 6, f.col, 8, 140);
          G.Audio.sfx('shot', { kind: 'beam', type: 'electric' });
        }
        blast(f, f.r);
      }
      return f.t >= f.delay + 0.16;            // el rayo se ve un momento
    }
    if (f.kind === 'stunzone') {
      if (f.t < f.delay) return false;
      G.FX.ring(f.x, f.y, 4, f.r, f.col, 0.35, 4);
      G.FX.burst(f.x, f.y - 6, f.col, 12, 160);
      if (G.Camera.sees(f.x, f.y, 40)) G.Audio.sfx('break');
      if (!f.ghost) {
        for (const e of G.EnemyMgr.queryCircle(f.x, f.y, f.r)) {
          hit(pl, e, f.dmg, f.col, e.x - f.x, e.y - f.y, 0, m);
          if (!e.dead) e.applyStun((m.stun || 1) * (e.boss || e.judge ? 0.35 : 1));
        }
        for (const p of G.World.propsInCircle(f.x, f.y, f.r)) G.World.damageProp(p, f.dmg, f.col);
      }
      return true;
    }
    return false;
  }

  /** Daño de un campo (mina, meteoro, charco) a todo lo que hay en su círculo. */
  function blast(f, r, k = 1) {
    if (f.ghost) return;
    const pl = f.owner, m = f.m;
    for (const e of G.EnemyMgr.queryCircle(f.x, f.y, r)) hit(pl, e, f.dmg * k, f.col, e.x - f.x, e.y - f.y, m.knock || 0, m);
    for (const p of G.World.propsInCircle(f.x, f.y, r)) G.World.damageProp(p, f.dmg * k, f.col);
  }

  const NEW_FIELDS = new Set(['charge', 'spin', 'quake', 'vortex', 'stunzone', 'tremor', 'wave', 'cross', 'bolt',
                              'punch', 'blitz', 'leap']);
  function updateFields(dt) {
    for (let i = fields.length - 1; i >= 0; i--) {
      const f = fields[i];
      f.t += dt;
      if (f.gone || !f.owner || (f.life && f.t >= f.life && f.kind !== 'mine')) { fields.splice(i, 1); continue; }
      if (NEW_FIELDS.has(f.kind)) { if (tickNewField(f, dt)) fields.splice(i, 1); continue; }
      if (f.kind === 'mine') {
        const armed = f.t >= f.arm;
        const trig = armed && G.EnemyMgr.queryCircle(f.x, f.y, 14).length > 0;
        if (trig || f.t >= f.life) {
          G.FX.ring(f.x, f.y, 4, f.r, f.col, 0.3, 4);
          G.FX.burst(f.x, f.y - 6, f.col, 10, 150);
          if (G.Camera.sees(f.x, f.y, 40)) G.Audio.sfx('break');
          blast(f, f.r, trig ? 1 : 0.5);
          fields.splice(i, 1);
        }
      } else if (f.kind === 'meteor') {
        if (f.t >= f.fall) {
          G.FX.ring(f.x, f.y, 4, f.r, f.col, 0.35, 4);
          G.FX.burst(f.x, f.y - 6, f.col, 12, 170);
          if (G.Camera.sees(f.x, f.y, 40)) { G.Audio.sfx('break'); G.Camera.kick(0.12); }
          blast(f, f.r);
          fields.splice(i, 1);
        }
      } else if (f.kind === 'turret') {
        f.shotT -= dt;
        if (f.shotT <= 0) {
          const m = f.m;
          const tg = G.Projectiles.nearest(G.EnemyMgr.all(), f.x, f.y, m.range || 300);
          f.shotT = tg ? m.rate || 0.6 : 0.15;
          if (tg) {
            const a = Math.atan2(tg.y - f.y, tg.x - f.x);
            G.Projectiles.spawn(Object.assign({
              x: f.x, y: f.y, vx: Math.cos(a) * (m.speed || 300), vy: Math.sin(a) * (m.speed || 300),
              dmg: f.dmg, r: m.size || 6, life: 1.4, pierce: m.pierce | 0, color: f.col,
              hits: new Set(), vis: f.vis, ghost: f.ghost, owner: f.owner
            }, payload(m)));
            f.kick = 0.12;
          }
        }
        if (f.kick > 0) f.kick -= dt;
      } else if (f.kind === 'patch') {
        f.tick -= dt;
        if (f.tick <= 0) { f.tick = 0.5; blast(f, f.r); }
        if (f.vis.aura && Math.random() < dt * 3 && G.Camera.sees(f.x, f.y, 20)) {
          G.FX.sp(f.vis.aura, f.vis.pal, f.x + G.U.rand(-f.r, f.r) * 0.6, f.y - 4, { vy: -40, life: 0.4 });
        }
      }
    }
  }

  /** Lo de los campos que va en el suelo (debajo de los Pokémon). */
  function drawGroundFields(ctx) {
    const now = performance.now() / 1000;
    for (const f of fields) {
      // (La ola de Surf se mueve lejos de donde salió: se mira dónde está ahora.)
      if (f.kind === 'wave' ? !G.Camera.sees(f.x + f.ca * f.d, f.y + f.sa * f.d, f.w) : !G.Camera.sees(f.x, f.y, 60)) continue;
      ctx.save();
      if (f.kind === 'vortex') {
        const a = Math.min(1, (f.life - f.t) * 2, f.t * 6);
        ctx.globalAlpha = 0.22 * a;
        ctx.fillStyle = f.col;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.6, 0, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 0.6 * a;
        ctx.strokeStyle = f.col; ctx.lineWidth = 2;
        for (let k = 0; k < 3; k++) {
          const rr = f.r * (0.35 + k * 0.28), a0 = now * (3 - k * 0.6) + k * 2;
          ctx.beginPath(); ctx.ellipse(f.x, f.y, rr, rr * 0.6, 0, a0, a0 + 3.4); ctx.stroke();
        }
      } else if (f.kind === 'tremor') {
        const k = Math.min(1, f.t / f.life), rr = f.r * k;
        ctx.globalAlpha = 0.55 * (1 - k * 0.6);
        ctx.strokeStyle = f.col; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, rr, rr * 0.6, 0, 0, 6.2832); ctx.stroke();
        ctx.globalAlpha = 0.25 * (1 - k);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, rr * 0.8, rr * 0.48, 0, 0, 6.2832); ctx.stroke();
      } else if (f.kind === 'wave') {
        ctx.translate(f.x + f.ca * f.d, f.y + f.sa * f.d); ctx.rotate(f.a);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = f.col;
        ctx.fillRect(-36, -f.w / 2, 36, f.w);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#e8fbff';
        for (let o = -f.w / 2; o < f.w / 2; o += 12) ctx.fillRect(Math.sin(now * 10 + o) * 3 - 4, o, 6, 9);
      } else if (f.kind === 'decoy') {
        // Doble Equipo: una copia medio transparente de tu Pokémon que parpadea al acabarse.
        const left = f.life - f.t;
        if (f.owner && f.owner.anim && (left > 1 || Math.floor(now * 10) % 2)) {
          G.Sprites.drawShadow(ctx, f.owner.dex, f.x, f.y, f.owner.scale);
          f.owner.anim.draw(ctx, f.x, f.y, { alpha: 0.55 });
        }
      } else if (f.kind === 'leap') {
        // Acróbata: tu sombra va hacia donde caerás.
        const k = G.U.clamp(f.t / f.fly, 0, 1), x = f.sx + (f.x - f.sx) * k, y = f.sy + (f.y - f.sy) * k;
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(x, y, 14, 6, 0, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 0.5; ctx.strokeStyle = f.col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * k, f.r * 0.6 * k, 0, 0, 6.2832); ctx.stroke();
      } else if (f.kind === 'cross' && f.t < f.delay) {
        const k = G.U.clamp(f.t / f.delay, 0, 1);
        ctx.globalAlpha = 0.18 + 0.3 * k;
        ctx.fillStyle = f.col;
        ctx.fillRect(f.x - f.r * k, f.y - f.w * 0.3, f.r * 2 * k, f.w * 0.6);
        ctx.fillRect(f.x - f.w / 2, f.y - f.r * 0.6 * k, f.w, f.r * 1.2 * k);
      } else if (f.kind === 'bolt' && f.t >= 0 && f.t < f.delay) {
        const k = G.U.clamp(f.t / f.delay, 0, 1);
        ctx.globalAlpha = 0.2 + 0.35 * k;
        ctx.strokeStyle = '#fff7b0'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.6, 0, 0, 6.2832); ctx.stroke();
      } else if (f.kind === 'stunzone') {
        const k = G.U.clamp(f.t / f.delay, 0, 1);
        ctx.globalAlpha = 0.15 + 0.25 * k;
        ctx.fillStyle = f.col;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * k, f.r * k * 0.6, 0, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = f.col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.6, 0, 0, 6.2832); ctx.stroke();
      } else if (f.kind === 'patch') {
        const a = Math.min(1, (f.life - f.t) * 2, f.t * 6);
        ctx.globalAlpha = 0.32 * a;
        ctx.fillStyle = f.col;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.62, 0, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 0.5 * a;
        ctx.strokeStyle = f.col; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * 0.8, f.r * 0.5, 0, 0, 6.2832); ctx.stroke();
      } else if (f.kind === 'mine') {
        const armed = f.t >= f.arm, blink = armed && Math.sin(now * 8 + f.x) > 0.3;
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = f.col;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * 0.45, f.r * 0.28, 0, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 1;
        G.VFX.draw(ctx, f.vis.proj, f.vis.pal, f.x, f.y - 4, { scale: 1, alpha: blink ? 1 : 0.75, frame: 0 });
      } else if (f.kind === 'meteor') {
        const k = G.U.clamp(f.t / f.fall, 0, 1);
        ctx.globalAlpha = 0.2 + k * 0.3;
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * (0.3 + k * 0.7), f.r * 0.6 * (0.3 + k * 0.7), 0, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = f.col; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.6, 0, 0, 6.2832); ctx.stroke();
      } else if (f.kind === 'turret') {
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(f.x, f.y, 11, 4.5, 0, 0, 6.2832); ctx.fill();
      }
      ctx.restore();
    }
  }

  /** Lo de los campos que va por encima (meteoros cayendo, torretas). */
  function drawAirFields(ctx) {
    const now = performance.now() / 1000;
    for (const f of fields) {
      if (!G.Camera.sees(f.x, f.y, 200)) continue;
      if (f.kind === 'bolt' && f.struck) {
        // Trueno: el rayo baja del cielo en zigzag.
        ctx.save();
        ctx.globalAlpha = 1 - (f.t - f.delay) / 0.16;
        ctx.strokeStyle = '#fff7b0'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(f.x + 10, f.y - 280);
        for (let k = 1; k <= 6; k++) ctx.lineTo(f.x + (k % 2 ? -12 : 12) * (1 - k / 7), f.y - 280 + k * 280 / 6);
        ctx.stroke();
        ctx.strokeStyle = f.col; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      } else if (f.kind === 'meteor' && f.t > 0) {
        const k = G.U.clamp(f.t / f.fall, 0, 1);
        G.VFX.draw(ctx, f.vis.proj, f.vis.pal, f.x + (1 - k) * 40, f.y - (1 - k) * 170 - 6,
                   { scale: 1.5, angle: Math.atan2(170, -40), frame: Math.floor(now * 12) });
      } else if (f.kind === 'turret') {
        const fade = Math.min(1, (f.life - f.t) * 2, f.t * 5);
        const bob = Math.sin(now * 4 + f.x) * 2 - (f.kick > 0 ? 2 : 0);
        G.VFX.draw(ctx, f.vis.proj, f.vis.pal, f.x, f.y - 16 + bob, { scale: 1.5, alpha: fade, frame: Math.floor(now * 8) });
      }
    }
  }

  function clearFields(owner) { fields = owner ? fields.filter(f => f.owner !== owner) : []; }

  function orbit(pl, m, dt, now, isGhost = false) {
    const col = G.U.TYPE_COLOR[m.type];
    const want = Math.max(1, m.count | 0);
    // Cada movimiento de órbita tiene sus orbes (puede haber dos en un vínculo).
    const mine = p => p.orb && p.owner === pl && p.mid === m.id;
    const orbs = G.Projectiles.all().filter(mine);
    // Si cambia el número de orbes (al mejorar el movimiento), se reparten
    // todos por igual a partir de donde va el primero, sin saltos.
    const relayout = orbs.length !== want;
    const base = orbs.length ? orbs[0].oa : now * m.speed;
    if (orbs.length > want) for (const p of orbs.slice(want)) G.Projectiles.remove(p);

    for (let i = orbs.length; i < want; i++) {
      G.Projectiles.spawnOrb({
        owner: pl, ghost: isGhost, mid: m.id,
        x: pl.x, y: pl.y, r: m.size, color: col, vis: G.VFX.forMove(m),
        dmg: m.dmg * pl.atkFor(m),
        oa: (i / want) * 6.2832, orad: m.radius, ospeed: m.speed,
        rehit: Math.max(0.12, m.cd),
        knock: m.knock || 0, burn: m.burn || 0, poison: m.poison || 0, slow: m.slow || 0, mtype: m.type, mcat: m.cat, src: m
      });
    }
    const live = G.Projectiles.all().filter(mine);
    live.forEach((p, i) => {
      p.dmg = m.dmg * pl.atkFor(m);
      p.orad = m.radius;
      p.ospeed = m.speed;
      p.r = m.size;
      if (relayout) p.oa = base + (i / live.length) * 6.2832;
    });

    // Animación de concentración de vez en cuando, para que se note vivo.
    pl.orbCastT = (pl.orbCastT || 0) - dt;
    if (pl.orbCastT <= 0) { pl.orbCastT = 1.6; pl.cast({ kind: 'orbit', cd: 1.6 }); }
  }

  /** Repite el ataque de un compañero sólo para verlo (sin daño). */
  function ghostCast(pl, id, lvl, aim, evolved) {
    const def = G.Moves.BY_ID[id];
    if (!def || def.kind === 'orbit') return;
    const m = G.Moves.instance(id, lvl);
    if (evolved) G.Moves.evolve(m);
    pl.aim = aim;
    ghost = true;
    try {
      pl.cast(m);
      runMove(pl, m);
    } finally { ghost = false; }
  }

  /** Orbes de un compañero que tiene activo un movimiento de órbita (sólo visual). */
  function ghostOrbit(pl, dt, now) {
    const m = pl.activeMove();
    if (m && m.kind === 'orbit' && !pl.dead) orbit(pl, m, dt, now, true);
    else if (G.Projectiles.all().some(p => p.orb && p.owner === pl)) G.Projectiles.clearOrbs(pl);
  }

  // Golpe crítico (Mejoras → Golpe Crítico): x1,5 de daño, número naranja y grande.
  const CRIT_MUL = 1.5;
  const isCrit = pl => !ghost && pl.critChance > 0 && Math.random() < pl.critChance;

  // Habilidad de quien pega (data/ability-fx.js): × al daño, crítico, estados y
  // lo que hace al golpear. (Los compañeros no la llevan aquí: pegan en su ordenador.)
  const abilOut = (pl, m, e) => (pl.abil && pl.abil.out && m ? pl.abil.out(pl, m, e) : 1);
  const critMul = pl => (pl.abil && pl.abil.critMul) || CRIT_MUL;
  /** × a quemaduras, venenos, frenazos y empujones: Potencia Bruta los quita, Dicha los dobla. */
  const statusK = pl => (!pl.abil ? 1 : pl.abil.sheer ? 0 : pl.abil.serene ? 2 : 1);
  function afterHit(pl, e, m) {
    const a = pl.abil;
    if (!a || e.dead) return;
    if (a.hit) a.hit(pl, e, m);
    if (a.touchPoison && m && ['melee', 'dash', 'punch', 'scissor', 'blitz', 'leap'].includes(m.kind)) e.applyPoison(1);
  }

  /** Extras de un proyectil al impactar (tanda C de MT): aturdir, explosión y charco. */
  function projectileExtras(pl, p, e, d) {
    const m = p.src, sk = statusK(pl);
    if (m.stun && sk && !e.dead) e.applyStun(m.stun * (e.boss || e.judge ? 0.35 : 1));
    if (m.splash) {
      G.FX.ring(e.x, e.y, 4, m.splash, p.color, 0.25, 3);
      for (const o of G.EnemyMgr.queryCircle(e.x, e.y, m.splash)) {
        if (o !== e && !o.dead) o.hurt(d * 0.6, p.color, o.x - e.x, o.y - e.y, 0, null);
      }
    }
    if (m.puddle) {
      const vis = G.VFX.forMove(m);
      fields.push({ kind: 'patch', owner: pl, ghost: false, m, col: p.color, vis, x: e.x, y: e.y, t: 0, life: m.puddle,
                    r: m.pr || 30, tick: 0, dmg: d * 0.3 });
      const mine = fields.filter(o => o.kind === 'patch' && o.owner === pl && o.m === m && !o.gone);
      for (const o of mine.slice(0, Math.max(0, mine.length - 12))) o.gone = true;
    }
  }

  function hit(pl, e, dmg, col, dx, dy, knock, m) {
    const k = typeK(m.type, e, pl) * G.Stats.taken(e.mon, m.cat) * abilOut(pl, m, e);
    const crit = isCrit(pl), sk = statusK(pl);
    dmg *= k * (crit ? critMul(pl) : 1) * (e.shredUntil > performance.now() ? 1.25 : 1);
    e.hurt(dmg, col, dx, dy, sk ? knock : 0, crit ? 'crit' : G.Types.label(G.Types.mult(m.type, e.types)));
    if (!ghost) pl.onDealt(dmg);
    pl.dmgDealt += dmg;
    m.dealt = (m.dealt || 0) + dmg;               // por ataque, para el resumen de la pausa
    if (m.burn && sk) e.applyBurn(m.burn * sk);
    if (m.poison && sk) e.applyPoison(m.poison * sk);
    if (m.slow && sk) e.applySlow(Math.min(0.8, m.slow * sk));
    // Triturar: tus golpes le hacen +25 % durante `shred` s (cada uno lo mira en su pantalla).
    if (m.shred && !e.dead) e.shredUntil = performance.now() + m.shred * 1000;
    afterHit(pl, e, m);
  }

  // ---------------- colisiones ----------------

  /** Distancia² del punto (cx, cy) al segmento (ax, ay)-(bx, by). */
  function segDist2(ax, ay, bx, by, cx, cy) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    let t = l2 ? ((cx - ax) * dx + (cy - ay) * dy) / l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const qx = ax + dx * t - cx, qy = ay + dy * t - cy;
    return qx * qx + qy * qy;
  }

  function resolve(dt, pl, now) {
    const projectiles = G.Projectiles.all();

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];

      // --- disparos enemigos: paredes y objetos sólidos dan cobertura ---
      if (!p.friendly) {
        if (G.World.projectileBlock(p.x, p.y, p.r)) {
          G.FX.burst(p.x, p.y - G.LIFT, p.color, 5, 70);
          projectiles.splice(i, 1);
          continue;
        }
        if (G.U.dist2(p.x, p.y, pl.x, pl.y) < (p.r + pl.r) * (p.r + pl.r)) {
          pl.hurt(p.dmg, p.mtype, false, p.cat);
          G.FX.burst(p.x, p.y - G.LIFT, p.color, 7, 110);
          projectiles.splice(i, 1);
        }
        continue;
      }

      // --- disparos de jugadores ---
      // Orbes de un compañero: sólo se ven.
      if (p.orb && p.ghost) continue;
      if (!p.orb) {
        const block = G.World.projectileBlock(p.x, p.y, p.r);
        if (block === 'wall' || (block && !block.destructible)) {
          G.FX.burst(p.x, p.y - G.LIFT, p.color, 5, 80);
          projectiles.splice(i, 1);
          continue;
        }
      }

      // Objetos del escenario (rocas, cofres, hierba).
      let consumed = false;
      for (const prop of G.World.propsInCircle(p.x, p.y, p.r)) {
        if (p.orb) {
          const k = 'p' + prop.id, last = p.hitLog.get(k) || -99;
          if (now - last < p.rehit) continue;
          p.hitLog.set(k, now);
          G.World.damageProp(prop, p.dmg, p.color);
          continue;
        }
        if (p.phits.has(prop.id)) continue;
        p.phits.add(prop.id);
        if (!p.ghost) G.World.damageProp(prop, p.dmg, p.color);
        // La hierba no frena; lo sólido sí gasta perforación.
        if (prop.solid) {
          if (p.pierce > 0) p.pierce--;
          else { consumed = true; break; }
        }
      }
      if (consumed) {
        G.FX.burst(p.x, p.y - G.LIFT, p.color, 5, 80);
        projectiles.splice(i, 1);
        continue;
      }

      // Enemigos. Colisión BARRIDA: se comprueba todo el tramo recorrido en este
      // fotograma, no sólo el punto final. Un Impactrueno avanza 8 unidades por
      // fotograma: sin esto atravesaba a los enemigos pegados al jugador, que
      // eran inmunes a todos los movimientos de proyectil.
      const sx = p.orb || p.px == null ? p.x : p.px, sy = p.orb || p.py == null ? p.y : p.py;
      const half = Math.hypot(p.x - sx, p.y - sy) / 2;
      for (const e of G.EnemyMgr.queryCircle((sx + p.x) / 2, (sy + p.y) / 2, half + p.r)) {
        if (segDist2(sx, sy, p.x, p.y, e.x, e.y) > (p.r + e.r) * (p.r + e.r)) continue;
        if (p.orb) {
          const last = p.hitLog.get(e.id) || -99;
          if (now - last < p.rehit) continue;
          p.hitLog.set(e.id, now);
          // Las órbitas duran toda la partida: se olvidan los golpes viejos.
          if (p.hitLog.size > 300) for (const [k, t] of p.hitLog) if (now - t > p.rehit) p.hitLog.delete(k);
        } else {
          if (p.hits.has(e.id)) continue;
          p.hits.add(e.id);
        }

        // Disparo fantasma de un compañero: choca y se ve, pero no daña.
        if (p.ghost) {
          G.FX.sp('impact', p.vis ? p.vis.pal : 'normal', e.x, e.y - e.bodyH * 0.5, { life: 0.12, scale: 1 });
          if (rebound(p, e)) break;
          if (p.pierce > 0) { p.pierce--; continue; }
          G.FX.burst(p.x, p.y - G.LIFT, p.color, 5, 80);
          projectiles.splice(i, 1);
          break;
        }

        const crit = isCrit(pl) || !!(p.src && p.src.critUp && Math.random() < p.src.critUp), sk = statusK(pl);
        const k = (p.mtype ? typeK(p.mtype, e, pl) : 1) * G.Stats.taken(e.mon, p.mcat) * (crit ? critMul(pl) : 1) * abilOut(pl, p.src, e);
        e.hurt(p.dmg * k, p.color, p.vx || (e.x - pl.x), p.vy || (e.y - pl.y), sk ? p.knock : 0,
               crit ? 'crit' : p.mtype ? G.Types.label(G.Types.mult(p.mtype, e.types)) : null);
        if (Math.random() < 0.5) G.FX.sp('impact', p.vis ? p.vis.pal : 'normal', e.x, e.y - e.bodyH * 0.5, { life: 0.12, scale: 1 });
        pl.dmgDealt += p.dmg * k;
        if (p.src) p.src.dealt = (p.src.dealt || 0) + p.dmg * k;
        pl.onDealt(p.dmg * k);
        if (p.burn && sk) e.applyBurn(p.burn * sk);
        if (p.poison && sk) e.applyPoison(p.poison * sk);
        if (p.slow && sk) e.applySlow(Math.min(0.8, p.slow * sk));
        if (p.drain) pl.heal(p.drain);                    // Beso Drenaje
        if (p.src) projectileExtras(pl, p, e, p.dmg * k);
        afterHit(pl, e, p.src);

        if (!p.orb && rebound(p, e)) break;
        if (!p.orb) {
          if (p.pierce > 0) { p.pierce--; }
          else {
            G.FX.burst(p.x, p.y - G.LIFT, p.color, 5, 80);
            projectiles.splice(i, 1);
            break;
          }
        }
      }
    }

    // --- contacto enemigo <-> jugador ---
    if (pl.dead) return;
    for (const e of G.EnemyMgr.queryCircle(pl.x, pl.y, pl.r + 40)) {
      if (G.U.dist2(e.x, e.y, pl.x, pl.y) > (e.r + pl.r) * (e.r + pl.r)) continue;
      if (e.touchCd > 0 || e.behavior === 'thief' || e.stunT > 0) continue;
      e.touchCd = 0.55;
      e.strike(pl);
      pl.hurt(e.dmg, e.atkType, false, e.cat);
      if (pl.hasItem('rockyhelmet')) e.hurt(15 + pl.level * 4, '#9aa6b5', e.x - pl.x, e.y - pl.y, 80);
      if (pl.abil && pl.abil.contact && !pl.dead && !e.dead) pl.abil.contact(pl, e);     // Elec. Estática, Cuerpo Llama...
      const [nx, ny] = G.U.norm(e.x - pl.x, e.y - pl.y);
      e.kx += nx * 150; e.ky += ny * 150;
    }
  }

  return { tick, resolve, ghostCast, ghostOrbit, updateFields, drawGroundFields, drawAirFields, clearFields, decoys,
           get fieldCount() { return fields.length; } };
})();
