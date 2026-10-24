const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const source = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

function load() {
  const ctx = vm.createContext({ G: {} });
  vm.runInContext(source('js/data/sprites-meta.js'), ctx);
  vm.runInContext(source('js/data/cries.js'), ctx);
  vm.runInContext(source('js/data/megas.js'), ctx);
  return ctx.G;
}

test('every Pokémon in the game has its cry or is listed as missing (tools/import_cries.py)', () => {
  const G = load();
  const dexes = Object.keys(G.SPRITE_META).map(Number).filter(d => d <= 1025)
    .concat(Object.keys(G.MEGAS).filter(d => !G.MEGAS[d].primal).map(d => 100000 + +d));     // y las megas (las primigenias usan el de siempre)
  for (const d of dexes) {
    const file = fs.existsSync(path.join(ROOT, 'assets', 'cries', d + '.mp3'));
    assert.ok(file !== G.CRY_MISSING.has(d), `${d}: ${file ? 'tiene grito y está en CRY_MISSING' : 'sin grito y fuera de CRY_MISSING'}`);
  }
});

test('the cries stay light: under 10 MB in total and under 40 KB each', () => {
  const dir = path.join(ROOT, 'assets', 'cries');
  let total = 0;
  for (const fn of fs.readdirSync(dir)) {
    const n = fs.statSync(path.join(dir, fn)).size;
    assert.ok(n < 40 * 1024, `${fn}: ${n} bytes`);
    total += n;
  }
  assert.ok(total < 10 * 1024 * 1024, `${total} bytes`);
});

test('the cries are only downloaded when they play (not in the build nor preloaded)', () => {
  assert.ok(!/assets\/cries\//.test(source('dev.html')));
  assert.ok(/cries/.test(source('sw.js')), 'sw.js guarda los gritos oídos para la copia sin internet');
});
