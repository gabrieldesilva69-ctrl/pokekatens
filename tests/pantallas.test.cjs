const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');

// Las pantallas que se abren con G.UI.show() tienen que estar en SCREENS (ui/ui.js): si no,
// nadie las cierra al volver o al empezar la partida y se quedan tapándolo todo (le pasó al
// desafío semanal, 24-10-2026).
test('every screen opened with G.UI.show() is in SCREENS, so it closes when another one opens', () => {
  const ui = fs.readFileSync(path.join(ROOT, 'js/ui/ui.js'), 'utf8');
  const list = ui.slice(ui.indexOf('const SCREENS'), ui.indexOf('];', ui.indexOf('const SCREENS')));
  const screens = new Set([...list.matchAll(/'(scr-[^']+)'/g)].map(m => m[1]));
  const opened = new Set();
  const walk = dir => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) { if (f.name !== 'lang') walk(p); continue; }
      if (!f.name.endsWith('.js') || f.name === 'app.min.js') continue;
      for (const m of fs.readFileSync(p, 'utf8').matchAll(/G\.UI\.show\('(scr-[^']+)'/g)) opened.add(m[1]);
    }
  };
  walk(path.join(ROOT, 'js'));
  assert.ok(opened.has('scr-chal'));
  for (const id of opened) assert.ok(screens.has(id), id + ' se abre con G.UI.show() pero no está en SCREENS');
});
