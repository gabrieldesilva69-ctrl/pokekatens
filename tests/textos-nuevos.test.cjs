const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { capture, SOURCES, LANGS } = require('../tools/build_langs.js');
const root = path.join(__dirname, '..');
const source = f => fs.readFileSync(path.join(root, f), 'utf8');
const norm = s => s.replace(/\s+/g, ' ');

// Los textos nuevos de los pasos 3 (sin Google) y 5 (nombre PokeKatens), tal cual.
const TEXTS = [
  'Si olvidas la contraseña, pídele al administrador que te cree otra cuenta.',
  'Esta web no está en la lista de webs de esta copia del juego: la partida sólo se guarda en este navegador.',
  'Si creas una cuenta, guardamos tu nombre de jugador y tu partida (colección, monedas, mejoras y estadísticas) en Google Firebase para que puedas seguir en cualquier ordenador. No usamos tus datos para nada más, ni los compartimos, ni hay publicidad ni seguimiento. Como invitado no se guarda nada fuera de tu navegador.',
  'Es el nombre que verán tus amigos y el que sale en el ranking. Tu nombre de usuario no se enseña a nadie.',
  'Versión no oficial',
  'PokeKatens es una versión no oficial de PokéSurvivor (de JPTER78) hecha por un grupo de amigos, gratuita y sin ánimo de lucro. No tiene anuncios, compras ni donaciones.',
  'PokeKatens se juega en horizontal.'
];

// Diccionario inglés, como lo junta tools/export_data.js.
function english() {
  const EN = {};
  const ctx = vm.createContext({ G: { I18n: { add: (d, l = 'en', c = '') => { if (l === 'en' && !c) Object.assign(EN, d); } } } });
  vm.runInContext(source('js/data/lang-en.js'), ctx, { filename: 'js/data/lang-en.js' });
  return EN;
}

// Francés, italiano...: lo que junta tools/build_langs.js para js/lang/.
function others() {
  const dicts = Object.fromEntries(LANGS.map(l => [l, {}]));
  for (const [d, l, c] of capture(SOURCES, '?')) if (!c && dicts[l]) Object.assign(dicts[l], d);
  return dicts;
}

test('every new text is on screen, in dev.html or js/ui/login.js', () => {
  const shown = norm(source('dev.html')) + '\n' + norm(source('js/ui/login.js'));
  for (const t of TEXTS) assert.ok(shown.includes(t), 'no sale en pantalla: ' + t);
});
test('every new text has its English translation', () => {
  const EN = english();
  for (const t of TEXTS) assert.ok(EN[t], 'falta el inglés de: ' + t);
});
test('every new text is translated into fr, it, pt-BR, zh-Hans and zh-Hant', () => {
  const dicts = others();
  assert.deepEqual(Object.keys(dicts), ['fr', 'it', 'pt-BR', 'zh-Hans', 'zh-Hant']);
  for (const [lang, d] of Object.entries(dicts)) {
    for (const t of TEXTS) assert.ok(d[t], `falta ${lang} de: ${t}`);
  }
});
