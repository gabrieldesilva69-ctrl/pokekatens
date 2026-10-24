const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const source = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function load() {
  const ctx = vm.createContext({ G: {}, Intl, Date, Math });
  for (const f of ['js/data/pokedex.js', 'js/data/sprites-meta.js']) vm.runInContext(source(f), ctx);
  ctx.G.Ranking = { periodIds: () => ({ w: 'w2026-43' }) };
  vm.runInContext(source('js/systems/challenge.js'), ctx);
  return ctx.G;
}

test('weekly challenge: the same Pokémon, condition and map for everyone in a week (systems/challenge.js)', () => {
  const G = load(), C = G.Challenge;
  const a = C.of('w2026-43'), b = load().Challenge.of('w2026-43');
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), 'igual en otro aparato');
  const p = G.DEX.find(x => x.dex === a.dex);
  assert.ok(p && !p.leg && G.SPRITE_META[a.dex], 'un Pokémon del juego y no legendario');
  assert.ok(C.CONDS.includes(a.cond) && a.seed >= 0 && a.seed < 1e6);
  const weeks = new Set(['w2026-44', 'w2026-45', 'w2026-46', 'w2026-47', 'w2026-48'].map(w => C.of(w).dex));
  assert.ok(weeks.size >= 4, 'cambia de semana a semana');
  assert.equal(C.current().week, 'w2026-43');
  const left = C.endsIn(new Date('2026-10-26T10:00:00Z'));      // lunes por la mañana en España
  assert.ok(left > 6 * 864e5 && left <= 7 * 864e5, String(left));
});

test('weekly challenge prize: once a week, from 3 minutes', () => {
  const G = load(), C = G.Challenge;
  const c = C.of('w2026-43'), pl = { maxHp: 100, hp: 100, atkMul: 1 };
  G.Rift = { inArena: false }; G.Judgment = { active: false };
  G.Weather = { current: null, force() {} }; G.Spawner = { say() {} }; G.T = s => s;
  C.begin(c, pl);
  const save = { tickets: { t1: 0, t10: 0 } };
  assert.equal(C.prize(save, 100), false);
  assert.equal(C.prize(save, 200), true);
  assert.equal(C.prize(save, 900), false);
  assert.equal(save.tickets.t10, 1);
  assert.equal(save.wch, 'w2026-43');
  C.end();
  assert.equal(C.active, null);
});
