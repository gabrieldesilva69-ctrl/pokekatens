/* ============ visual.test.cjs — material visual de Pokémon Edición Reloaded (unidad 8) ============
 * Retratos, iconos Físico / Especial / Estado y fondos de caja (tools/import_visual.py).
 *   node --test tests/visual.test.cjs
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const has = f => fs.existsSync(path.join(ROOT, f));

function load(files) {
  const ctx = { G: {}, console };
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(read(f), ctx, { filename: f });
  return ctx.G;
}

test('cada Pokémon del juego tiene su retrato, normal y shiny', () => {
  const dex = [...read('js/data/pokedex.js').matchAll(/"dex":(\d+),/g)].map(m => +m[1]);
  assert.ok(dex.length > 900);
  const miss = dex.filter(d => !has(`assets/portraits/${d}.png`) || !has(`assets/portraits/s/${d}.png`));
  assert.strictEqual(miss.join(','), '');
});

test('los retratos son ligeros (menos de 6 KB cada uno)', () => {
  const dir = path.join(ROOT, 'assets/portraits');
  const big = fs.readdirSync(dir).filter(f => f.endsWith('.png') && fs.statSync(path.join(dir, f)).size > 6144);
  assert.strictEqual(big.join(','), '');
});

test('hay icono de categoría para Físico, Especial y Estado, y caja para cada región', () => {
  for (const c of ['physical', 'special', 'status']) assert.ok(has(`assets/ui/cat-${c}.png`), c);
  for (let g = 0; g <= 9; g++) assert.ok(has(`assets/ui/box/${g}.png`), 'caja ' + g);
});

test('la categoría de un ataque: la suya, la del lado que sube o Estado', () => {
  const G = load(['js/data/moves.js', 'js/systems/stats.js']);
  G.T = s => s;
  const by = G.Moves.BY_ID;
  assert.strictEqual(G.Stats.catOf(by['ember']), 'special');
  assert.strictEqual(G.Stats.catOf(by['tackle']), 'physical');
  assert.strictEqual(G.Stats.catOf(by['swords-dance']), 'physical');
  assert.strictEqual(G.Stats.catOf(by['protect']), 'status');
  assert.ok(/cat-status\.png/.test(G.Stats.catIcon('status')));
  assert.strictEqual(G.Stats.catIcon(''), '');
});

test('sw.js guarda los retratos y las imágenes de la interfaz para la copia sin internet', () => {
  assert.ok(/portraits/.test(read('sw.js')) && /\|ui\|/.test(read('sw.js')));
});

test('cada arena (los 18 tipos y la Sentencia) tiene su suelo, ligero', () => {
  const types = [...read('js/world/tiles.js').match(/const ARENA_THEMES = \{([\s\S]*?)\n  \};/)[1].matchAll(/^    ([a-z]+):/gm)].map(m => m[1]);
  assert.strictEqual(types.length, 19);
  for (const t of types) {
    const f = `assets/arenas/${t}.jpg`;
    assert.ok(has(f), f);
    assert.ok(fs.statSync(path.join(ROOT, f)).size < 100 * 1024, f + ' pesa demasiado');
  }
  assert.ok(/arenas/.test(read('sw.js')));
});
