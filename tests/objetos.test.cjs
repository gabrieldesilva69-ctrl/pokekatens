const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const source = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

function load() {
  const G = { U: { pick: a => a[0], TYPE_COLOR: {} } };
  const ctx = vm.createContext({ G, document: { createElement: () => ({ getContext: () => ({}) }) } });
  for (const f of ['js/data/items.js', 'js/ui/icons.js', 'js/data/lang-en.js']) {
    try { vm.runInContext(source(f), ctx); } catch (e) { /* lang-en necesita G.I18n: se lee como texto abajo */ }
  }
  return G;
}
const EN = source('js/data/lang-en.js');
const hasEn = es => EN.includes(JSON.stringify(es)) || EN.includes(`'${es.replace(/'/g, "\\'")}'`);

test('the 23 held items and the 8 single-use ones each have a name, a text, an icon and their English', () => {
  const G = load();
  assert.equal(G.Items.LIST.length, 23);
  assert.equal(G.Items.TREATS.length, 8);
  for (const it of [...G.Items.LIST, ...G.Items.TREATS]) {
    assert.ok(it.name && it.desc, it.id);
    assert.ok(G.Icons.UI[it.id], 'icono de ' + it.id);
    assert.ok(hasEn(it.name) && hasEn(it.desc), 'inglés de ' + it.id);
  }
  for (const it of G.Items.LIST) assert.equal(typeof it.on, 'function', it.id);
});

test('on/off of every held item leave the player as it was', () => {
  const G = load();
  for (const it of G.Items.LIST) {
    const p = { atkMul: 1, spdMul: 1, cdMul: 1, coinMul: 1, xpMul: 1, dmgReduce: 0, regenFlat: 0, maxHp: 100 };
    const before = JSON.stringify(p);
    it.on(p); it.off(p);
    for (const k of Object.keys(JSON.parse(before))) assert.ok(Math.abs(p[k] - JSON.parse(before)[k]) < 1e-9, `${it.id}.${k}`);
  }
});

test('single-use drops follow their weights (candy 20 %, each berry 20 %, one Mochi 20 %)', () => {
  const G = load();
  const total = G.Items.TREATS.reduce((a, t) => a + t.w, 0);
  const w = id => G.Items.TREAT[id].w / total;
  assert.equal(w('expcandy'), 0.2);
  for (const b of ['sitrus', 'atania', 'meloc']) { assert.equal(w(b), 0.2); assert.ok(G.Items.TREAT[b].berry); }
  assert.ok(Math.abs(['mochihp', 'mochiatk', 'mochispd', 'mochidef'].reduce((a, id) => a + w(id), 0) - 0.2) < 1e-9);
  assert.ok(G.Items.TREAT[G.Items.rollTreat()]);
});

test('the map knows how to draw them and the all-items achievement asks for all 23', () => {
  assert.match(source('js/entities/pickup.js'), /\n\s+treat:\s+\{ color:/);
  assert.match(source('js/data/achievements.js'), /id: 'itemsAll'[^\n]*goal: 23/);
});
