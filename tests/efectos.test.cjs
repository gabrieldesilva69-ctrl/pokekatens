const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');

// entities/aura.js con lo mínimo: unos ajustes en memoria y los sprites que hay en assets/.
function load() {
  const store = { fx: 'all', fxOff: [] };
  const G = { Settings: { get: k => store[k], set: (k, v) => { store[k] = v; } } };
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/entities/aura.js'), 'utf8'), vm.createContext({ G, performance: { now: () => 0 } }));
  return { A: G.Aura, store };
}

test('visual effects can be turned off for all, for everyone but your partner, or for one Pokémon (entities/aura.js)', () => {
  const { A, store } = load();
  assert.equal(A.enabled(25, true), true);
  assert.equal(A.enabled(25, false), true);
  store.fx = 'partner';
  assert.equal(A.enabled(25, true), true);
  assert.equal(A.enabled(25, false), false, 'con "Sólo mi compañero", los demás no llevan efectos');
  store.fx = 'off';
  assert.equal(A.enabled(25, true), false);
  store.fx = 'all';
  A.setEnabled(94, false);
  assert.deepEqual(store.fxOff, [94]);
  assert.equal(A.enabled(94, true), false, 'quitados en su ficha');
  assert.equal(A.enabled(25, true), true, 'los demás siguen');
  A.setEnabled(94, false);
  assert.deepEqual(store.fxOff, [94], 'sin repetidos');
  A.setEnabled(94, true);
  assert.deepEqual(store.fxOff, []);
});

test('every glowing detail and legendary effect is well formed and has its sprite', () => {
  const { A } = load();
  const KINDS = ['flame', 'spark', 'eye', 'glow', 'psy', 'ice'];
  for (const [dex, r] of Object.entries(A.SPOTS)) {
    assert.ok(fs.existsSync(path.join(ROOT, 'assets/pokemon', dex, 'Walk.png')), 'sprite de ' + dex);
    assert.ok(Array.isArray(r.on) && r.on.length, 'colores de ' + dex);
    for (const c of [...r.on, ...(r.avoid || []), ...(r.grow || [])]) assert.match(c, /^[0-9a-f]{6}$/, dex + ': ' + c);
    assert.match(r.color, /^#[0-9a-f]{6}$/, 'color de ' + dex);
    assert.ok(KINDS.includes(r.kind), 'clase de ' + dex);
  }
  for (const [dex, S] of Object.entries(A.SPECIAL)) {
    assert.ok(fs.existsSync(path.join(ROOT, 'assets/pokemon', dex)), 'sprite de ' + dex);
    assert.ok(S.aura || S.back || S.parts, 'algo que dibujar en ' + dex);
    if (S.aura) assert.match(S.aura, /^#[0-9a-f]{6}$/, 'aura de ' + dex);
    if (S.back) { assert.ok(['ripple', 'clock'].includes(S.back), 'fondo de ' + dex); assert.ok(S.c, 'color del fondo de ' + dex); }
    if (S.parts) assert.ok(S.parts.rate > 0 && S.parts.life > 0 && (S.parts.hue || S.parts.c), 'partículas de ' + dex);
  }
});

test('effects come and go slowly: a calm level most of the time and a spark now and then', () => {
  const { A } = load();
  let calm = 0;
  for (let t = 0; t < 45; t += 0.05) {
    const v = A.emitLevel(25, t, 0);
    assert.ok(v >= 0.3 && v <= 1.01);
    if (v < 0.4) calm++;
  }
  assert.ok(calm > 600, 'las chispas de Pikachu están tranquilas la mayor parte del tiempo');
  // Los ojos de Gengar respiran despacio: suben y bajan, pero tardan unos segundos en hacerlo.
  const eye = []; for (let t = 0; t < 10; t += 0.1) eye.push(A.emitLevel(94, t, 3));
  assert.ok(Math.min(...eye) >= 0.5 && Math.max(...eye) > Math.min(...eye) + 0.3, 'suben y bajan');
  for (let i = 1; i < eye.length; i++) assert.ok(Math.abs(eye[i] - eye[i - 1]) < 0.05, 'y despacio');
});
