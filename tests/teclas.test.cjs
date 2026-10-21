const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

// G.Settings + G.Input sin navegador: un localStorage de mentira y eventos de teclado a mano.
function input(saved) {
  const store = saved ? { 'ps.settings': JSON.stringify(saved) } : {};
  const listeners = {};
  const ctx = vm.createContext({ G: {}, console, navigator: {}, performance: { now: () => 0 }, document: {},
    matchMedia: () => ({ matches: false }),
    addEventListener: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } } });
  ctx.window = ctx;
  for (const f of ['js/core/util.js', 'js/core/settings.js', 'js/core/input.js']) vm.runInContext(source(f), ctx, { filename: f });
  const key = (type, code) => (listeners[type] || []).forEach(fn => fn({ code, key: code, preventDefault() {} }));
  return { I: ctx.G.Input, S: ctx.G.Settings, store, press: c => key('keydown', c), release: c => key('keyup', c) };
}

test('the default keys work as before: WASD/arrows, Q/E/Tab, 1-4, P and Esc', () => {
  const { I, press } = input();
  assert.equal(I.defaultKeys, true);
  press('KeyQ'); assert.equal(I.act('prev'), true); I.endFrame();
  press('Tab'); assert.equal(I.act('next'), true); I.endFrame();
  press('Numpad3'); assert.equal(I.act('slot3'), true); I.endFrame();
  press('Escape'); assert.equal(I.act('pause'), true); I.endFrame();
  press('ArrowUp'); assert.deepEqual([...I.axis()], [0, -1]);
});

test('rebinding a key moves it and the old one stops working', () => {
  const { I, press, release } = input();
  I.bind('up', 0, 'keyi');
  press('KeyW'); assert.deepEqual([...I.axis()], [0, 0]); release('KeyW');
  press('KeyI'); assert.deepEqual([...I.axis()], [0, -1]);
  assert.equal(I.defaultKeys, false);
});

test('a key already used by another action is swapped, never duplicated', () => {
  const { I } = input();
  I.bind('down', 0, 'keyq');            // Q era "ataque anterior"
  assert.deepEqual([...I.keys('down')], ['keyq', 'arrowdown']);
  assert.deepEqual([...I.keys('prev')], ['keys', '']);
  const all = I.ACTIONS.flatMap(a => I.keys(a)).filter(Boolean);
  assert.equal(new Set(all).size, all.length);
});

test('Esc cannot be bound, Backspace-style clearing leaves the slot empty, and reset restores everything', () => {
  const { I, S } = input();
  assert.equal(I.bind('prev', 0, 'escape'), false);
  I.bind('prev', 0, '');
  assert.deepEqual([...I.keys('prev')], ['', '']);
  I.resetKeys();
  assert.deepEqual([...I.keys('prev')], ['keyq', '']);
  assert.equal(S.get('keys'), null);
});

test('only the changed keys are saved, and they come back after reloading', () => {
  const a = input();
  a.I.bind('pause', 1, 'keym');
  assert.deepEqual(JSON.parse(JSON.stringify(a.S.get('keys'))), { pause: ['keyp', 'keym'] });
  const b = input(JSON.parse(a.store['ps.settings']));
  assert.deepEqual([...b.I.keys('pause')], ['keyp', 'keym']);
  assert.deepEqual([...b.I.keys('up')], ['keyw', 'arrowup']);
});

test('a broken saved value falls back to the default keys', () => {
  const { I } = input({ keys: { up: 'nope', down: ['escape', 'keyk'] } });
  assert.deepEqual([...I.keys('up')], ['keyw', 'arrowup']);
  assert.deepEqual([...I.keys('down')], ['', 'keyk']);
});

test('key names are readable', () => {
  const { I } = input();
  assert.equal(I.keyName('keyw'), 'W');
  assert.equal(I.keyName('digit2'), '2');
  assert.equal(I.keyName('numpad4'), 'Num 4');
  assert.equal(I.keyName('arrowleft'), '←');
  assert.equal(I.keyName('space'), 'Espacio');
  assert.equal(I.keyName(''), '—');
});
