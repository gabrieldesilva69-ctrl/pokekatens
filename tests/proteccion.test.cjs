// Protección (26-10-2026): con mucha reducción de recarga se encadenaba y eras invencible
// toda la partida. Ahora su recarga nunca baja de 5 s (minCd en js/data/moves.js).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

function load() {
  const G = { U: { TYPE_COLOR: {}, dist: () => 0, clamp: (v, a, b) => Math.min(b, Math.max(a, v)) }, Coop: { active: false },
              FX: { ring() {}, dmgText() {} }, LIFT: 0, T: s => s };
  const ctx = vm.createContext({ G, console, performance: { now: () => 0 } });
  vm.runInContext(source('js/data/moves.js'), ctx);
  vm.runInContext(source('js/systems/combat.js'), ctx);
  return G;
}

// Toda la reducción de recarga que se puede juntar: 10 cartas, mejoras, objeto y santuario Prisa.
const MAX_CD_CUT = Math.pow(0.92, 10) * 0.7 * 0.8 * 0.6;

/** Parte del tiempo que Protección te deja intocable en un minuto de partida. */
function uptime(G, m, cdMul) {
  const pl = { dead: false, restT: 0, guardT: 0, cdMul, abil: null, x: 0, y: 0, r: 10, bodyH: 20,
               activeGroup: () => [m], cast() {} };
  let on = 0;
  const dt = 0.05;
  for (let t = 0; t < 60; t += dt) {
    G.Combat.tick(dt, pl, t * 1000);
    if (pl.guardT > 0) { on += dt; pl.guardT -= dt; }
  }
  return on / 60;
}

test('Protección no se puede encadenar: por mucha reducción de recarga, nunca menos de 5 s', () => {
  const G = load();
  const m = G.Moves.instance('protect', 1);
  assert.equal(m.minCd, 5); assert.equal(m.dur, 1.5); assert.equal(m.cd, 7);
  const u = uptime(G, m, MAX_CD_CUT);
  assert.ok(u < 0.32, 'protegido ' + Math.round(u * 100) + ' % del tiempo');
  // Sin el tope de antes: casi todo el tiempo (así se veía el fallo).
  const old = Object.assign(G.Moves.instance('protect', 1), { minCd: undefined });
  assert.ok(uptime(G, old, MAX_CD_CUT) > 0.95);
});

test('Protección al nivel máximo: escudo más largo, pero sigue habiendo huecos', () => {
  const G = load();
  const m = G.Moves.instance('protect', 5);
  assert.ok(m.dur < m.minCd, 'el escudo dura menos que la recarga mínima');
  assert.ok(uptime(G, m, MAX_CD_CUT) < 0.6);
});

test('el HUD y cambiar de ataque respetan la recarga mínima', () => {
  assert.match(source('js/ui/hud.js'), /Math\.max\(m\.minCd \|\| 0, m\.cd \* pl\.cdMul\)/);
  assert.match(source('js/entities/player.js'), /Math\.max\(m\.minCd \|\| 0, m\.cd \* 0\.35\)/);
});
