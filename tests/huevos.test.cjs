const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const source = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// G.DB sin navegador (como tests/regalos.test.cjs).
function db() {
  const store = {};
  const ctx = vm.createContext({ G: {}, console, navigator: { onLine: true },
    location: { protocol: 'http:', hostname: 'localhost' },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; }, key: () => null, length: 0 } });
  for (const f of ['js/core/fork-config.js', 'js/core/firebase-config.js', 'js/core/db.js']) vm.runInContext(source(f), ctx, { filename: f });
  return ctx.G.DB;
}

// G.Eggs con una partida en memoria y la Pokédex de verdad.
function eggs(rnd = Math.random) {
  const save = { coins: 0, owned: {}, shiny: {}, eggs: [], eggsHatched: {}, eggGacha: {} };
  const G = { U: { pick: a => a[Math.floor(rnd() * a.length)] } };
  const ctx = vm.createContext({ G, Math: Object.assign(Object.create(Math), { random: rnd }) });
  for (const f of ['js/data/pokedex.js', 'js/data/eggs.js']) vm.runInContext(source(f), ctx);
  G.DEX_BY = {}; for (const p of G.DEX) G.DEX_BY[p.dex] = p;
  G.Gacha = { RATES: [[1, 45], [2, 30], [3, 17], [4, 6.5], [5, 1.5]], REFUND: { 1: 15, 2: 30, 3: 60, 4: 120, 5: 300 } };
  G.Sprites = { hasShiny: () => true };
  G.DB = { save, commit() {}, owns: d => !!save.owned[d], grant: d => { save.owned[d] = save.owned[d] || { at: 1 }; },
    grantShiny: d => { save.owned[d] = save.owned[d] || { at: 1 }; if (save.shiny[d]) return false; save.shiny[d] = { at: 1 }; return true; } };
  vm.runInContext(source('js/systems/eggs.js'), ctx);
  return { E: G.Eggs, save, G };
}

test('an egg is a breedable Pokémon of its region, never a legendary, with its family egg', () => {
  const { E, G } = eggs();
  for (let i = 0; i < 300; i++) {
    const r = E.roll(1 + (i % 9));
    const p = G.DEX_BY[r.dex];
    assert.ok(p && !p.leg && p.gen === 1 + (i % 9), r.dex);
    assert.ok(G.EGG_BASE[r.dex], 'huevo de su familia: ' + r.dex);
    assert.ok(fs.existsSync(path.join(ROOT, 'assets', 'eggs', G.EGG_BASE[r.dex] + '.png')));
    assert.ok(fs.existsSync(path.join(ROOT, 'assets', 'eggs', 's', G.EGG_BASE[r.dex] + '.png')));
  }
  assert.equal(G.EGG_BASE[25], 172, 'Pikachu sale del huevo de Pichu');
});

test('kills fill the 3 incubating eggs at once; a full Incubator turns the 7th egg into coins', () => {
  const { E, save } = eggs();
  for (let i = 0; i < 6; i++) assert.ok(E.give(1, 'mission').id);
  assert.deepEqual({ ...E.give(1, 'mission') }, { overflow: 200 });
  assert.equal(save.coins, 200);
  for (let i = 0; i < 600; i++) E.onKill();
  assert.equal(save.eggs.map(e => e.done).join(), [600, 600, 600, 0, 0, 0].map((d, i) => Math.min(d, save.eggs[i].need)).join());
});

test('hatching: only a ready egg in the Incubator; the Pokémon joins the collection, a repeat gives coins', () => {
  const { E, save } = eggs();
  const e = E.give(2, 'gacha');
  e.shiny = false;
  assert.equal(E.hatch(e.id), null, 'aún no está listo');
  e.done = e.need;
  const r = E.hatch(e.id);
  assert.ok(r.isNew && save.owned[e.dex] && !save.eggs.length && save.eggsHatched[e.id]);
  const again = E.give(2, 'gacha'); again.dex = e.dex; again.shiny = false; again.done = again.need;
  const r2 = E.hatch(again.id);
  assert.ok(!r2.isNew && r2.refund > 0 && save.coins === r2.refund);
});

test('every 10 ×10 pulls on the same banner give an egg of that region', () => {
  const { E, save } = eggs();
  for (let i = 0; i < 9; i++) assert.equal(E.onGacha10(4), null);
  assert.equal(E.onGacha10(5), null, 'otro banner cuenta aparte');
  const e = E.onGacha10(4);
  assert.ok(e && e.id && save.eggGacha[4] === 0 && save.eggGacha[5] === 1);
});

test('merging two devices: eggs of both, the most progress of each, and none that was already hatched', () => {
  const D = db();
  const base = { coins: 0, tickets: { t1: 0, t10: 0 }, owned: {}, shiny: {}, upgrades: {}, stats: {}, missions: {} };
  const a = Object.assign(JSON.parse(JSON.stringify(base)), { updated: 2,
    eggs: [{ id: 'aa', dex: 1, need: 500, done: 100 }, { id: 'bb', dex: 4, need: 500, done: 10 }], eggsHatched: { cc: 5 } });
  const b = Object.assign(JSON.parse(JSON.stringify(base)), { updated: 1,
    eggs: [{ id: 'bb', dex: 4, need: 500, done: 300 }, { id: 'cc', dex: 7, need: 500, done: 500 }, { id: 'dd', dex: 16, need: 500, done: 0 }],
    eggsHatched: {}, eggGacha: { 3: 7 } });
  const r = D.merge(a, b);
  assert.equal(JSON.stringify(r.eggs.map(e => [e.id, e.done])), JSON.stringify([['aa', 100], ['bb', 300], ['dd', 0]]));
  assert.ok(r.eggsHatched.cc);
  assert.equal(r.eggGacha[3], 7);
  // Y al revés, lo mismo (sin duplicar).
  assert.equal(D.merge(b, a).eggs.map(e => e.id).sort().join(), 'aa,bb,dd');
});
