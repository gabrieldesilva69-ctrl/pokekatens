const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

function load() {
  const ctx = vm.createContext({ G: {} });
  vm.runInContext(source('js/core/fork-config.js'), ctx);
  vm.runInContext(source('js/core/firebase-config.js'), ctx);
  return ctx.G;
}

test('G.FORK names PokeKatens, credits the original and lists the allowed hosts', () => {
  const { FORK } = load();
  assert.equal(FORK.name, 'PokeKatens');
  assert.equal(FORK.upstream, 'https://github.com/JPTER78/pokesurvivor');
  assert.ok(Array.isArray(FORK.hosts));
  assert.ok(FORK.hosts.includes('localhost'));
  assert.ok(FORK.hosts.includes('127.0.0.1'));
  assert.ok(Array.isArray(FORK.admins));
  assert.ok(FORK.admins.every(a => typeof a === 'string'));
  for (const k of ['site', 'repo', 'contact']) assert.equal(typeof FORK[k], 'string', k);
});
test('Firebase never points at the original project, and the emulator uses a demo- project', () => {
  const cfg = load().FIREBASE_CONFIG;
  if (cfg === null) return;
  assert.notEqual(cfg.projectId, 'pokesurvivor-free');
  if (cfg.emulator === true) assert.ok(cfg.projectId.startsWith('demo-'), cfg.projectId);
});
test('dev.html loads fork-config.js before firebase-config.js, and that before db.js', () => {
  const html = source('dev.html');
  const a = html.indexOf('<!-- scripts:begin -->'), b = html.indexOf('<!-- scripts:end -->');
  assert.ok(a >= 0 && b > a);
  const block = html.slice(a, b);
  const fork = block.indexOf('js/core/fork-config.js');
  const fb = block.indexOf('js/core/firebase-config.js');
  const db = block.indexOf('js/core/db.js');
  assert.ok(fork >= 0 && fb >= 0 && db >= 0);
  assert.ok(fork < fb && fb < db);
});
test('db.js takes its allowed hosts from G.FORK', () => {
  const db = source('js/core/db.js');
  assert.ok(db.includes('const HOSTS = G.FORK.hosts;'));
  assert.ok(!db.includes("'pokesurvivor.com'"));
});
