const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const source = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

function load() {
  const ctx = vm.createContext({ G: { U: { TYPE_NAME: {}, TYPE_COLOR: {} }, Stats: {} } });
  for (const f of ['js/data/pokedex.js', 'js/data/sprites-meta.js', 'js/data/moves.js', 'js/data/tms.js']) vm.runInContext(source(f), ctx);
  return ctx.G;
}

test('signature moves: only their Pokémon get them (no type pool, no TM, no evolution)', () => {
  const G = load();
  const M = G.Moves;
  const only = M.ALL.filter(m => m.only);
  assert.ok(only.length >= 18, only.length);
  const types = new Set(only.map(m => m.type));
  assert.equal(types.size, 18, 'uno de cada tipo: ' + [...types]);
  const dexOf = new Set(G.DEX.map(p => p.dex));
  for (const m of only) {
    for (const d of m.only) {
      assert.ok(dexOf.has(d) && G.SPRITE_META[d], `${m.id}: ${d} está en el juego`);
      assert.ok(M.exclusiveFor(d).includes(m.id), `${m.id} en ONLY[${d}]`);
    }
    for (const t in M.POOL) assert.ok(!M.POOL[t].includes(m.id), `${m.id} no va en el pool de ${t}`);
    for (const d of dexOf) assert.ok(!G.TM_OF(d).includes(m.id), `${m.id}: no hay MT (${d})`);
    assert.ok(!M.EVO[m.id], `${m.id} no evoluciona`);
  }
  // Nadie más lo tiene en su pool: ni Pikachu Onda Mental ni Mewtwo Placaje Eléctrico.
  const mew2 = G.DEX.find(p => p.dex === 150), pika = G.DEX.find(p => p.dex === 25);
  assert.ok(!M.poolFor(pika, true).includes('psystrike') && !M.poolFor(mew2, true).includes('volt-tackle'));
  assert.deepEqual([...M.exclusiveFor(25)], ['volt-tackle']);
});

test('signature move names are not reused as the evolved name of another move', () => {
  const G = load();
  const names = new Set(G.Moves.ALL.filter(m => m.only).map(m => m.name));
  for (const [id, [evo]] of Object.entries(G.Moves.EVO)) assert.ok(!names.has(evo), `${id} evoluciona a ${evo}, que es exclusivo`);
});
