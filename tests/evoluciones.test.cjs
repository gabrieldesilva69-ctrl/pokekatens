const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const source = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('partner evolution data: only Pokémon in the game, real chains (tools/fetch_evolutions.py)', () => {
  const ctx = vm.createContext({ G: {} });
  for (const f of ['js/data/sprites-meta.js', 'js/data/evolutions.js']) vm.runInContext(source(f), ctx);
  const { EVOS, SPRITE_META } = ctx.G;
  assert.ok(Object.keys(EVOS).length > 300);
  for (const [a, l] of Object.entries(EVOS)) {
    assert.ok(SPRITE_META[a], `${a} está en el juego`);
    for (const b of l) assert.ok(SPRITE_META[b] && +b !== +a, `${a} -> ${b}`);
  }
  assert.deepEqual([...EVOS[4]], [5]);
  assert.deepEqual([...EVOS[5]], [6]);
  assert.ok(EVOS[133].length >= 8, 'Eevee: todas sus evoluciones');
  assert.ok(!EVOS[6] && !EVOS[150], 'Charizard y Mewtwo no evolucionan');
});

test('the evolution module is loaded after mega.js and its data (dev.html)', () => {
  const html = source('dev.html');
  const at = f => html.indexOf(`src="${f}"`);
  assert.ok(at('js/data/evolutions.js') > 0 && at('js/systems/evolve.js') > at('js/systems/mega.js'));
});
