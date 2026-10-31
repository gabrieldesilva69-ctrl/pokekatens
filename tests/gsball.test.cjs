/* ============ gsball.test.cjs — GS Ball y megas del 25-10-2026 ============
 * GS Ball cada 500 tiradas (systems/gacha.js, data/shop.js), Megapiedra al azar
 * al vencer a un legendario (G.Shop.randomStone) y megas que duran más (G.Mega.durFor).
 *   node --test tests/gsball.test.cjs
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const source = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

function shop(save) {
  const ctx = vm.createContext({ G: {}, Intl });
  for (const f of ['js/data/sprites-meta.js', 'js/data/megas.js']) vm.runInContext(source(f), ctx);
  const G = ctx.G;
  G.DEX = [{ dex: 1 }, { dex: 4 }, { dex: 7 }];
  G.DEX_BY = { 1: G.DEX[0], 4: G.DEX[1], 7: G.DEX[2] };
  G.U = { pick: a => a[0] };
  G.Mega = { exists: d => !!G.MEGAS[d] };
  G.DB = { get save() { return save; }, commit() {} };
  vm.runInContext(source('js/data/shop.js'), ctx);
  return G;
}

test('la GS Ball es un objeto de la Mochila que cabe en la libreta de db.js', () => {
  const G = shop({ owned: {}, bag: {}, coins: 0 });
  assert.ok(G.Shop.isItem(G.Shop.GS));
  assert.ok(/^[a-z0-9]{1,12}$/.test(G.Shop.GS));
});

test('abrir una GS Ball: un Pokémon que no tienes, nunca shiny; si ya los tienes todos, monedas', () => {
  const save = { owned: { 1: {} }, bag: { gsball: 2 }, coins: 0 };
  const G = shop(save);
  assert.deepEqual(G.Shop.gsChoices().map(p => p.dex), [4, 7]);
  assert.equal(G.Shop.openGs(1).ok, false, 'uno que ya tienes no');
  assert.equal(G.Shop.openGs(99).ok, false, 'uno que no existe no');
  assert.equal(G.Shop.openGs(null).ok, false, 'monedas sólo si ya los tienes todos');
  assert.equal(G.Shop.openGs(4).ok, true);
  assert.ok(save.owned[4] && !save.shiny, 'te lo da normal');
  assert.equal(save.bag.gsball, 1);
  save.owned[7] = {};
  const r = G.Shop.openGs(null);
  assert.equal(r.ok, true);
  assert.equal(save.coins, G.Shop.GS_COINS);
  assert.ok(!save.bag.gsball, 'se gasta');
  assert.equal(G.Shop.openGs(null).ok, false, 'sin GS Ball no se abre nada');
});

test('Megapiedra al azar al vencer a un legendario: sólo de las que no tienes', () => {
  const save = { owned: {}, bag: {}, coins: 0 };
  const G = shop(save);
  const all = Object.keys(G.MEGAS).map(Number);
  for (const d of all.slice(1)) save.bag['ms' + d] = 1;
  assert.equal(G.Shop.randomStone(), all[0]);
  save.bag['ms' + all[0]] = 1;
  assert.equal(G.Shop.randomStone(), null);
  assert.ok(/STONE_CHANCE = 0\.05/.test(source('js/systems/rift.js')) && /G\.Shop\.randomStone\(\)/.test(source('js/systems/rift.js')));
});

test('cada mega de la partida dura 3 s más, de 45 a 90 s', () => {
  const m = source('js/systems/mega.js');
  const body = m.slice(m.indexOf('const KILLS'), m.indexOf('const durFor'));
  const durFor = new Function(body + m.match(/const durFor = [^;]+;/)[0] + '; return durFor;')();
  assert.deepEqual([0, 1, 2, 5, 15, 100].map(durFor), [45, 48, 51, 60, 90, 90]);
});

test('el gacha cuenta las tiradas hacia la GS Ball y se guarda en la partida', () => {
  const g = source('js/systems/gacha.js'), db = source('js/core/db.js');
  assert.ok(/const GS_EVERY = 500;/.test(g) && /save\.gsGot < Math\.floor\(save\.gsPulls \/ GS_EVERY\)/.test(g));
  assert.ok(/gsPulls: 0,/.test(db) && /gsGot: 0,/.test(db) && /r\.gsPulls = Math\.max/.test(db) && /r\.gsGot = Math\.max/.test(db));
});

test('juntar dos aparatos no da una GS Ball de más (M5 de la revisión, 31-10-2026)', () => {
  // Uno llegó a 500 (le dio la GS Ball); el otro, sin conexión, se quedó en 495.
  const g = source('js/systems/gacha.js');
  const give = new Function('save', 'n', 'const GS_EVERY = 500; let out = { gs: 0 };'
    + g.slice(g.indexOf('    save.gsPulls = (save.gsPulls || 0) + n;'), g.indexOf('    out.iris', g.indexOf('    save.gsPulls = (save.gsPulls || 0) + n;'))).replace(/G\.Shop\.GS/g, "'gsball'") + 'return out.gs;');
  const pc = { gsPulls: 495 }, mob = { gsPulls: 495 };
  assert.equal(give(pc, 5), 1, 'a las 500, una');
  // Lo que hace G.DB.merge: el mayor de cada contador.
  const merged = { gsPulls: Math.max(pc.gsPulls, mob.gsPulls), gsGot: Math.max(pc.gsGot || 0, mob.gsGot || 0) };
  assert.equal(give(merged, 5), 0, 'con 5 tiradas más no sale otra');
  assert.equal(give(merged, 495), 1, 'a las 1000, la segunda');
});
