const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');

test('streaks: kills raise it, a hit breaks it, coins go ×1.1 / ×1.25 / ×1.5 (systems/streak.js)', () => {
  const pl = { x: 0, y: 0, bodyH: 20, dead: false };
  const said = [];
  const G = { Game: { player: pl }, Spawner: { say: t => said.push(t) }, Audio: { sfx() {} }, FX: { dmgText() {} },
    I18n: { locale: 'es', f: (s, ...v) => { let i = 0; return s.replace(/\{x\}/g, () => v[i++]); } } };
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/systems/streak.js'), 'utf8'), vm.createContext({ G }));
  const S = G.Streak;
  S.reset();
  for (let i = 0; i < 49; i++) S.onKill();
  assert.equal(S.mul(), 1);
  S.onKill();
  assert.equal(S.mul(), 1.1);
  assert.equal(said.length, 1);
  for (let i = 0; i < 250; i++) S.onKill();
  assert.equal(S.mul(), 1.5);
  S.onHurt({}); assert.equal(S.count, 300, 'el golpe de otro jugador no la corta');
  S.onHurt(pl);
  assert.equal(S.count, 0);
  assert.equal(S.mul(), 1);
  const stats = { bestStreak: 120 };
  S.save(stats);
  assert.equal(stats.bestStreak, 300);
});
