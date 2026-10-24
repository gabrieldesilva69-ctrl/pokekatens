const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');

test('night: from minute 7, 3 minutes every 10, never in a rift or before Arceus (systems/night.js)', () => {
  const G = { Rift: { inArena: false }, Judgment: { active: false }, Game: { st: { time: 0 } } };
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/systems/night.js'), 'utf8'), vm.createContext({ G, Math }));
  const N = G.Night;
  assert.equal(N.level(0), 0);
  assert.equal(N.level(419), 0);
  assert.equal(N.level(500), 1);
  assert.equal(N.level(620), 0);
  assert.equal(N.level(1100), 1, 'otra noche 10 minutos después');
  G.Game.st.time = 500;
  assert.equal(N.bonus(), N.BONUS);
  G.Rift.inArena = true;
  assert.equal(N.level(500), 0);
  assert.equal(N.bonus(), 1);
});
