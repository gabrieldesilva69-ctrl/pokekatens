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
  // Un lienzo de mentira para lo que se pinta a cuadritos (aura.js chunky).
  const any = () => new Proxy(function () {}, { get: (o, k) => (k === 'width' || k === 'height' ? 0 : any()), set: () => true, apply: () => any() });
  const document = { createElement: () => any() };
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/entities/aura.js'), 'utf8'), vm.createContext({ G, document, performance: { now: () => 0 } }));
  return { A: G.Aura, store, G };
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
    assert.ok(S.aura || S.back || S.parts || S.trail, 'algo que dibujar en ' + dex);
    if (S.aura) assert.match(S.aura, /^#[0-9a-f]{6}$/, 'aura de ' + dex);
    if (S.back) { assert.ok(['ripple', 'clock'].includes(S.back), 'fondo de ' + dex); assert.ok(S.c, 'color del fondo de ' + dex); }
    if (S.parts) assert.ok(S.parts.rate > 0 && S.parts.life > 0 && (S.parts.hue || S.parts.c), 'partículas de ' + dex);
    if (S.pulse != null) assert.ok(S.pulse >= 2 && S.aura, 'el aura que se apaga y se enciende de ' + dex);
    if (S.rays) assert.ok(S.rays === 'hue' || /^#[0-9a-f]{6}$/.test(S.rays), 'rayos de ' + dex);
    if (S.aurora) assert.ok(S.aurora.length && S.aurora.every(c => /^#[0-9a-f]{6}$/.test(c)), 'aurora de ' + dex);
    if (S.orbit) {
      assert.ok(S.orbit.n > 0 && S.orbit.c.every(c => /^#[0-9a-f]{6}$/.test(c)), 'lo que gira alrededor de ' + dex);
      assert.ok(['gem', 'ring', 'cell', 'star'].includes(S.orbit.s), 'cómo es lo que gira alrededor de ' + dex);
    }
    if (S.trail) assert.ok(A.TRAILS[S.trail.s] && S.trail.c.every(c => /^#[0-9a-f]{6}$/.test(c)), 'rastro de ' + dex);
  }
  for (const [dex, r] of Object.entries(A.SPOTS)) {
    if (r.pulse != null) assert.ok(r.pulse >= 2, 'despacio: ' + dex);
    if (r.seq != null) assert.ok(r.seq >= 4, 'puntos uno a uno, despacio: ' + dex);
  }
});

test('every legendary and mythical of the game has its own effect (28-10-2026)', () => {
  const { A } = load();
  const ctx = { G: {} };
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/data/pokedex.js'), 'utf8'), vm.createContext(ctx));
  const sin = ctx.G.DEX.filter(p => p.leg && fs.existsSync(path.join(ROOT, 'assets/pokemon', String(p.dex), 'Walk.png')))
    .filter(p => !A.SPOTS[p.dex] && !A.SPECIAL[p.dex]).map(p => p.name);
  assert.deepEqual([...sin], []);
});

test('some glows fade out and come back slowly (pulse), and the Regi dots light up one by one (seq)', () => {
  const { A } = load();
  // El núcleo de Eternatus: se apaga casi del todo, se vuelve a encender, y sin saltos.
  const v = []; for (let t = 0; t < 10; t += 0.05) v.push(A.emitLevel(890, t, 0));
  assert.ok(Math.min(...v) < 0.1 && Math.max(...v) > 0.95, 'de apagado a encendido');
  for (let i = 1; i < v.length; i++) assert.ok(Math.abs(v[i] - v[i - 1]) < 0.08, 'despacio: más de un segundo para encenderse');
  const off = v.filter(x => x < 0.1).length;
  assert.ok(off > v.length * 0.45, 'pasa más tiempo apagado que encendido');
  // Los Regi no encienden la hoja entera: sus puntos los dibuja front, uno detrás de otro.
  for (const d of [377, 378, 379, 486]) assert.equal(A.emitLevel(d, 3, 0), 0, 'puntos de ' + d);
  assert.equal(typeof A.front, 'function');
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

test('the colour aura behind a Pokémon only shows at night, except for mythicals, Arceus and Lucario (28-10-2026)', () => {
  const { A, G } = load();
  let auras = 0, night = 0;
  G.Game = { state: 'playing', st: { time: 0 } };
  G.Night = { level: () => night };
  G.Sprites = { PX: 2 };
  // Un lienzo de mentira que cuenta las auras (se pintan a cuadritos y se pegan con drawImage).
  const ctx = new Proxy({}, {
    get: (o, k) => (k === 'drawImage' ? () => { auras++; } : k in o ? o[k] : () => {}),
    set: (o, k, v) => { o[k] = v; return true; }
  });
  const draw = dex => { auras = 0; A.special(ctx, { x: 0, bodyH: 30, r: 10, _fxSeed: 0 }, dex, 0, 1, 0); return auras; };
  assert.equal(draw(150), 0, 'Mewtwo de día: sin aura');
  assert.ok(draw(493) > 0, 'Arceus: también de día');
  assert.ok(draw(386) > 0, 'Deoxys (singular): también de día');
  assert.ok(draw(448) > 0, 'Lucario: también de día');
  night = 1;
  assert.ok(draw(150) > 0, 'Mewtwo de noche: con aura');
});

test('Suicune leaves an aurora trail on the ground while it moves, now and then (28-10-2026)', () => {
  const { A, G } = load();
  G.U = { rand: (a, b) => (a + b) / 2, pick: l => l[0] };
  G.Sprites = { PX: 2 };
  const ctx = new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => ({ addColorStop() {} })), set: (o, k, v) => { o[k] = v; return true; } });
  const S = { x: 0, bodyH: 40, r: 14, _fxSeed: 0 };
  // Quieto no deja nada; andando, sí (mientras dura la ola), y cada punto se apaga solo.
  for (let i = 0; i < 20; i++) A.special(ctx, S, 245, 100, 1 + i * 0.05, 0.05);
  assert.ok((S._trail || []).length <= 1, 'quieto, nada');
  for (let i = 0; i < 40; i++) { S.x += 4; A.special(ctx, S, 245, 100, 2 + i * 0.05, 0.05); }
  assert.ok(S._trail.length > 20, 'andando, el rastro');
  for (let i = 0; i < 80; i++) A.special(ctx, S, 245, 100, 4 + i * 0.05, 0.05);
  assert.equal(S._trail.length, 0, 'y se apaga solo');
});
