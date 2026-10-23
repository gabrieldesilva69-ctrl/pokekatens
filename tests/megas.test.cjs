const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const source = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

function load() {
  const ctx = vm.createContext({ G: {} });
  for (const f of ['js/data/sprites-meta.js', 'js/data/megas.js']) vm.runInContext(source(f), ctx);
  return ctx.G;
}
const TYPES = new Set(['normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying',
  'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy']);

test('every Mega has its data, its sprites (normal and shiny) and only official ones are in (tools/fetch_megas.py)', () => {
  const G = load();
  const dexes = Object.keys(G.MEGAS).map(Number);
  assert.ok(dexes.length >= 80, dexes.length);
  // Inventadas de Reloaded que nunca deben entrar (docs/IDEAS-RELOADED.md).
  for (const fake of [12, 25, 26, 52, 68, 99, 131, 133, 143, 495]) assert.ok(!G.MEGAS[fake], 'mega no oficial: ' + fake);
  for (const d of dexes) {
    const m = G.MEGAS[d], meta = G.SPRITE_META[100000 + d];
    assert.ok(G.SPRITE_META[d], `${d}: la especie está en el juego`);
    assert.ok(meta && meta.rl && meta.sh, `${d}: sprites de mega de Reloaded, con shiny`);
    assert.ok(m.types.length >= 1 && m.types.every(t => TYPES.has(t)), `${d}: tipos ${m.types}`);
    for (const k of ['hp', 'spd', 'pa', 'sa', 'df', 'sd']) assert.equal(typeof m[k], 'number', `${d}.${k}`);
    for (const a of Object.keys(meta.a)) {
      const file = meta.a[a].f || a;
      assert.ok(fs.existsSync(path.join(ROOT, 'assets', 'pokemon', String(100000 + d), file + '.png')), `${d}/${file}`);
    }
  }
  assert.equal(G.MEGAS[6].types.join('/'), 'fire/dragon');    // Mega Charizard X, la que dibuja Reloaded
});

test('Mega Stones: a valid bag key, only the current partner\'s is for sale, and buying it keeps it for good', () => {
  const G = load();
  const save = { partner: 6, coins: 9000, bag: {} };
  let commits = 0;
  G.DB = { get save() { return save; }, commit() { commits++; } };
  const ctx = vm.createContext({ G, Intl });
  vm.runInContext(source('js/data/shop.js'), ctx);
  const S = G.Shop;
  assert.ok(S.isStone('ms6') && S.isItem('ms6') && S.isItem('mint'));
  assert.ok(!S.isStone('ms25') && !S.isStone('ms') && !S.isStone('ms6x'));
  assert.ok(/^[a-z0-9]{1,12}$/.test(S.stoneId(1000)), 'cabe en la libreta de db.js (b:<objeto>)');
  assert.equal(S.stoneForSale(), 6);
  assert.equal(S.buy('ms150').ok, false, 'sólo la de tu compañero');
  assert.equal(S.buy('ms6').ok, true);
  assert.equal(save.coins, 9000 - S.STONE_PRICE);
  assert.equal(save.bag.ms6, 1);
  assert.equal(S.stoneForSale(), null);
  assert.equal(S.buy('ms6').ok, false, 'no se compra dos veces');
  assert.equal(S.giveStone(6), false);
  assert.equal(S.giveStone(150), true);
  assert.ok(S.hasStone(150) && commits >= 2);
});
