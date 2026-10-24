const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');

test('Pokédex of seen/defeated: small hex bitmaps that only grow and merge as a union (systems/seen.js)', () => {
  const save = { seen: '', beat: '' };
  const G = { DB: { save }, DEX: [{ dex: 1 }, { dex: 25 }, { dex: 1025 }] };
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/systems/seen.js'), 'utf8'), vm.createContext({ G }));
  const S = G.Seen;
  S.onSpawn(25); S.onKill(1); S.onKill(1025); S.onSpawn(0); S.onSpawn(5000);
  assert.ok(S.seen(25) && S.seen(1) && S.beat(1) && !S.beat(25) && S.beat(1025));
  assert.equal(S.count('seen'), 3);
  assert.equal(S.count('beat'), 2);
  assert.ok(save.seen.length <= 260 && /^[0-9a-f]*$/.test(save.seen));
  assert.equal(S.union('8', '4'), 'c');
  assert.equal(S.union(save.beat, ''), save.beat);
  assert.equal(S.clean('ZZ<f0>'.repeat(200)).length, 260);
});
