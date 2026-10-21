const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

// G.DB sin navegador: un localStorage de mentira y la nube sin arrancar.
function db() {
  const store = {};
  const ctx = vm.createContext({ G: {}, console, navigator: { onLine: true },
    location: { protocol: 'http:', hostname: 'localhost' },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; }, key: () => null, length: 0 } });
  for (const f of ['js/core/fork-config.js', 'js/core/firebase-config.js', 'js/core/db.js']) vm.runInContext(source(f), ctx, { filename: f });
  return ctx.G.DB;
}
const save = (coins = 100, t1 = 2, t10 = 0) => ({ coins, tickets: { t1, t10 } });
const copy = s => JSON.parse(JSON.stringify(s));

test('a gift adds coins and tickets and reports what was new', () => {
  const D = db(), s = save();
  assert.deepEqual({ ...D.addGifts(s, [['a1', { c: 500, t1: 3 }]]) }, { c: 500, t1: 3, t10: 0 });
  assert.equal(s.coins, 600);
  assert.deepEqual({ ...s.tickets }, { t1: 5, t10: 0 });
});
test('the same gift is never added twice', () => {
  const D = db(), s = save();
  D.addGifts(s, [['a1', { c: 500 }]]);
  assert.equal(D.addGifts(s, [['a1', { c: 500 }]]), null);
  assert.equal(s.coins, 600);
});
test('gifts only add: negative, invalid or huge amounts are not taken away or overflow', () => {
  const D = db(), s = save();
  assert.equal(D.addGifts(s, [['neg', { c: -50, t1: -1 }], ['bad', { c: 'x' }], ['no/id', { c: 9 }]]), null);
  assert.equal(s.coins, 100);
  D.addGifts(s, [['big', { c: 5e9, t10: 5e9 }]]);
  assert.equal(s.coins, 100 + 1000000);
  assert.equal(s.tickets.t10, 1000);
});
test('a gift survives merging with an older copy that never saw it, and spending keeps working', () => {
  const D = db(), s = save();
  const old = copy(s);
  D.addGifts(s, [['a1', { c: 500 }]]);
  const m = D.merge(copy(s), Object.assign(copy(old), { updated: Date.now() + 1e6 }));
  assert.equal(m.coins, 600);
  m.coins -= 200;                       // gasta en la tienda
  assert.equal(D.addGifts(m, [['a1', { c: 500 }]]), null);
  assert.equal(m.coins, 400);
});
