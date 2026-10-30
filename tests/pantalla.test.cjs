/* ============ pantalla.test.cjs — píxeles exactos (camera.js) y límite de FPS (game.js) ============
 *   node --test tests/pantalla.test.cjs
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

function camera(pixelPerfect) {
  const G = { Settings: { get: k => (k === 'pixelPerfect' ? pixelPerfect : undefined) }, Sprites: { PX: 2 } };
  vm.runInContext(read('js/core/camera.js'), vm.createContext({ G, Math }));
  return G.Camera;
}
// Píxeles de pantalla que ocupa cada píxel del arte.
const artPx = C => C.scale * C.dpr * 2;

test('píxeles exactos: en una pantalla grande cada píxel del arte ocupa un número entero de píxeles', () => {
  const off = camera(false), on = camera(true);
  off.resize(2000, 1086, 1); on.resize(2000, 1086, 1);
  assert.ok(Math.abs(artPx(off) - 5.17) < 0.01, 'sin él, 5,17 (cuadrados de 5 y de 6)');
  assert.equal(artPx(on), 5);
  assert.ok(on.w / off.w < 1.05, 'la vista casi no cambia (' + (on.w / off.w).toFixed(3) + ')');
});

test('píxeles exactos: si redondear cambiara mucho la vista (un móvil), se deja como estaba', () => {
  const on = camera(true), off = camera(false);
  on.resize(812, 375, 1.5); off.resize(812, 375, 1.5);
  assert.equal(on.scale, off.scale);
});

test('píxeles exactos: la Luminosfera sigue alejando la vista igual', () => {
  const on = camera(true);
  on.resize(2000, 1086, 1);
  const s = on.scale;
  on.zoom = 1.35; on.fit();
  assert.ok(Math.abs(on.scale - s / 1.35) < 1e-9);
});

test('límite de FPS: a 60 con una pantalla de 144 Hz salen unos 60 por segundo; sin límite, todos', () => {
  const src = read('js/game.js');
  const fn = src.slice(src.indexOf('  let nextT = 0;'), src.indexOf('  function loop(ts)'));
  const run = cap => {
    const ctx = { G: { Settings: { get: () => cap } } };
    vm.runInContext(fn + '\nthis.due = due;', vm.createContext(ctx));
    let n = 0;
    for (let i = 0; i < 144 * 10; i++) if (ctx.due(i * 1000 / 144)) n++;
    return n / 10;
  };
  assert.equal(run(0), 144);
  for (const cap of [30, 60, 120]) assert.ok(Math.abs(run(cap) - cap) <= 1, cap + ' → ' + run(cap));
});

test('la calidad automática no baja los efectos por llevar el límite de FPS puesto', () => {
  const store = { fpsCap: 30, quality: 'auto' };
  const ctx = { localStorage: { getItem: () => JSON.stringify(store), setItem() {} }, matchMedia: () => ({ matches: false }), G: {} };
  vm.runInContext(read('js/core/settings.js'), vm.createContext(ctx));
  const S = ctx.G.Settings;
  for (let i = 0; i < 30 * 10; i++) S.sample(1 / 30);
  assert.equal(S.fx, 2);
});
