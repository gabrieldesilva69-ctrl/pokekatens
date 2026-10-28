// Cooperativo (js/net/coop.js): lo que llega de otro jugador lleva topes (revisión del
// 28-10-2026, docs/REVISION-2026-10-28.md, A4 y M3). Un invitado con el juego trucado no
// mata de un golpe ni manda enemigos al infinito; un anfitrión trucado no reparte tickets.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

function coop(host, api = {}) {
  let msgFn = null;
  const G = {};
  G.Net = { uid: host ? 'host' : 'guest', on(fn) { msgFn = fn; }, onPeer() {}, slow: () => false, send() {}, toHost() {}, mode: () => 'direct' };
  G.Player = class { constructor() { this.maxHp = 300; } };
  G.DEX_BY = { 25: { dex: 25 }, 7: { dex: 7 } }; G.baseStartOf = () => 'thundershock';
  G.Moves = { BY_ID: { thundershock: {}, tackle: {} } }; G.Items = { BY: {} };
  G.Sprites = { preload() {} }; G.U = { dist2: () => 0 };
  G.Projectiles = { clearOrbs() {} }; G.Spawner = { say() {} }; G.Social = { me: { name: 'yo' }, dropMember() {} };
  G.Judgment = { netState: () => null }; G.EnemyMgr = { all: () => [], get: () => null };
  new Function('G', 'document', 'setTimeout', 'clearTimeout', source('js/net/coop.js'))(G, { addEventListener() {} }, () => 0, () => {});
  G.Coop.begin({ host: 'host', members: [{ uid: 'host', name: 'Ana', dex: 25 }, { uid: 'guest', name: 'Bea', dex: 7 }] }, { x: 0, y: 0 },
    Object.assign({ mySum: () => null, over() {}, syncTeam() {}, hold() {}, away() {}, lost() {}, waiting() {} }, api));
  return { G, from: (u, msg) => msgFn(u, msg) };
}

test('host: a guest\'s hits, knockback and statuses are capped; junk is ignored', () => {
  const h = coop(true), hits = [], st = [], casts = [];
  const e = { dead: false, remote: false, hurt: (...a) => hits.push(a),
    applyBurn: v => st.push(['b', v]), applyPoison: v => st.push(['p', v]), applySlow: v => st.push(['s', v]), applyStun: v => st.push(['t', v]) };
  h.G.EnemyMgr.get = () => e;
  h.G.Combat = { ghostCast: (pl, id, lv, aim, evo) => casts.push([id, lv, aim, evo]) };
  h.from('guest', { k: 'f', ev: [
    ['h', 1, 1e12, '#fff', 3, 4, 1e300], ['h', 1, NaN, '#fff', 0, 0, 0], ['h', 1, 'mucho'], ['h', 1, 250, { x: 1 }, 1, 0, 120],
    ['s', 1, 'b', 1e9], ['s', 1, 's', 5], ['s', 1, 't', Infinity], 'basura', null,
    ['c', 'tackle', 1e6, NaN, 1]
  ] });
  assert.deepEqual(hits, [[1e6, '#fff', 3, 4, 1000], [250, '#fff', 1, 0, 120]]);
  assert.deepEqual(st, [['b', 8], ['s', 0.9], ['t', 0]]);
  assert.deepEqual(casts, [['tackle', 99, 0, 1]]);
});

test('host: at most MAX_EV events from one message', () => {
  const h = coop(true);
  let n = 0;
  h.G.EnemyMgr.get = () => ({ dead: false, remote: false, hurt: () => { n++; } });
  h.from('guest', { k: 'f', ev: Array.from({ length: 50000 }, () => ['h', 1, 10]) });
  assert.equal(n, 2000);
});

test('guest: team tickets, coins and counters from the host are capped by the run time', () => {
  let team = null, over = null;
  const g = coop(false, { syncTeam: t => { team = t; }, over: d => { over = d; } });
  g.from('host', { k: 'f', t: 600, lv: 1e9, xp: 5, xn: 10, ki: 1e12, bo: 999, co: 1e15, tk: [1e9, 1e9, 3], ev: [] });
  assert.deepEqual(team, { time: 600, level: 160, xp: 5, xpNext: 10, kills: 7300, bosses: 40, coins: 121000, t1: 130, t10: 40, cn: 3 });
  g.from('host', { k: 'f', t: 300, lv: 20, xp: 1, xn: 2, ki: 500, bo: 2, co: 800, tk: [4, 1, 0], ev: [] });
  assert.deepEqual(team, { time: 300, level: 20, xp: 1, xpNext: 2, kills: 500, bosses: 2, coins: 800, t1: 4, t10: 1, cn: 0 });
  g.from('host', { k: 'f', ev: [['ov', { why: 'host', t: 60, ki: 50, co: 'x', lv: 3, t1: 1e9, t10: -5, cn: 0, sums: {} }]] });
  assert.equal(over.why, 'host');
  assert.deepEqual([over.t, over.ki, over.co, over.lv, over.t1, over.t10], [60, 50, 0, 3, 40, 0]);
});
