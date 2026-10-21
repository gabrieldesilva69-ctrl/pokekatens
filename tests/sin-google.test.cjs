const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const source = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

// dev.html y los .js del juego; fuera lo generado (app.min.js, lang/) y los datos (diccionarios, novedades antiguas).
function gameFiles() {
  const out = ['dev.html'];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = dir + '/' + e.name;
      if (e.isDirectory()) { if (rel !== 'js/lang' && rel !== 'js/data') walk(rel); }
      else if (e.name.endsWith('.js') && rel !== 'js/app.min.js') out.push(rel);
    }
  };
  walk('js');
  return out;
}

const BANNED = ['GoogleAuthProvider', 'signInWithPopup', 'linkWithPopup', 'reauthenticateWithPopup',
  'loginWithGoogle', 'linkGoogle', 'hasGoogle', 'offerRecovery', 'btn-google', 'scr-recover',
  'apis.google.com', 'auth/popup-blocked'];

test('no Google sign-in remains in dev.html or the game scripts', () => {
  const files = gameFiles();
  assert.ok(files.includes('js/core/db.js') && files.includes('js/ui/login.js'));
  for (const f of files) {
    const text = source(f);
    for (const word of BANNED) assert.ok(!text.includes(word), `${f} contiene «${word}»`);
  }
});
test('the CSP only allows the game and Firebase scripts', () => {
  assert.ok(source('dev.html').includes("script-src 'self' file: https://www.gstatic.com https://*.firebaseio.com https://*.firebasedatabase.app; object-src 'none'; base-uri 'self'"));
});
test('db.js keeps name + password accounts and the local mode', () => {
  const db = source('js/core/db.js');
  for (const s of ["const NAME_DOMAIN = 'jugadores.pokekatens.invalid';", 'createUserWithEmailAndPassword',
    'signInWithEmailAndPassword', "localReason = 'config'"]) assert.ok(db.includes(s), s);
});
test('the login screen keeps the guest button and the new forgotten-password note', () => {
  const html = source('dev.html');
  assert.ok(html.includes('id="btn-guest"'));
  assert.ok(html.includes('id="forgot-note"'));
  assert.ok(html.includes('pídele al administrador que te cree otra cuenta'));
  assert.ok(!source('js/ui/login.js').includes('pokesurvivor.com'));
});
