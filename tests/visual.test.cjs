/* ============ visual.test.cjs — material visual de Pokémon Edición Reloaded (unidad 8) ============
 * Fondos de caja, suelos de las arenas y avatares de entrenador (tools/import_visual.py).
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

test('hay una caja de fondo para cada región de la colección', () => {
  for (let g = 0; g <= 9; g++) assert.ok(has(`assets/ui/box/${g}.png`), 'caja ' + g);
  assert.ok(/\|ui\|/.test(read('sw.js')));
});

test('los suelos de las arenas: los de data/arenas.js están, son ligeros y de tipos que existen; nada más', () => {
  const G = load(['js/data/arenas.js']);
  const types = [...read('js/world/tiles.js').match(/const ARENA_THEMES = \{([\s\S]*?)\r?\n  \};/)[1].matchAll(/^    ([a-z]+):/gm)].map(m => m[1]);
  const files = Object.values(G.ARENA_ART).map(d => d.f);
  for (const [t, d] of Object.entries(G.ARENA_ART)) {
    assert.ok(types.includes(t), t);
    assert.ok(has('assets/arenas/' + d.f), d.f);
    assert.ok(fs.statSync(path.join(ROOT, 'assets/arenas', d.f)).size < 100 * 1024, d.f + ' pesa demasiado');
    assert.strictEqual(d.px, /\.png$/.test(d.f) ? 1 : 0, d.f);
  }
  const extra = fs.readdirSync(path.join(ROOT, 'assets/arenas')).filter(f => !files.includes(f));
  assert.strictEqual(extra.join(','), '');
  assert.ok(/arenas/.test(read('sw.js')) && /js\/data\/arenas\.js/.test(read('dev.html')));
});

test('los 60 avatares de entrenador están, ligeros, y las reglas aceptan su número (0-60)', () => {
  const G = load(['js/data/avatars.js']);
  assert.strictEqual(G.AVATARS, 60);
  for (let n = 1; n <= G.AVATARS; n++) {
    const f = `assets/trainers/${n}.gif`;
    assert.ok(has(f), f);
    assert.ok(fs.statSync(path.join(ROOT, f)).size < 80 * 1024, f + ' pesa demasiado');
  }
  assert.ok(!has(`assets/trainers/${G.AVATARS + 1}.gif`));
  const rules = read('firestore.rules');
  assert.ok(/'medals', 'avatar'\]/.test(rules) && /avatar <= 60/.test(rules));
  assert.ok(/trainers/.test(read('sw.js')));
  assert.ok(/js\/data\/avatars\.js/.test(read('dev.html')));
});

test('G.UI.avatar sólo pinta un número de la lista (lo de la sala llega sin comprobar)', () => {
  const src = read('js/ui/ui.js');
  const body = src.slice(src.indexOf('function avatar('), src.indexOf('/** Rareza'));
  const G = { AVATARS: 60 };
  const avatar = new Function('G', body + '; return avatar;')(G);
  assert.ok(/trainers\/7\.gif/.test(avatar(7)));
  for (const bad of [0, 61, -1, 2.5, '3', '"><script>', null, undefined]) assert.strictEqual(avatar(bad), '', String(bad));
});
