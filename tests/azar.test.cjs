const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// «Al azar» de la Colección (28-10-2026): elige compañero entre los que tienes de la lista filtrada.
test('the Collection has a "Random" button that picks a partner you own from the filtered list', () => {
  assert.match(read('dev.html'), /id="dex-rand"/, 'el botón está en la Colección');
  const menu = read('js/ui/menu.js');
  assert.match(menu, /\$\('dex-rand'\)[\s\S]*onclick = randomPartner/, 'y hace algo');
  assert.match(menu, /function randomPartner\(\)[\s\S]*dexList\(\)\.filter\(p => s\.owned\[p\.dex\]\)/, 'sólo los que tienes, con los filtros de ahora');
  assert.match(read('js/ui/icons.js'), /\n    dice: \{/, 'con su dado');
});
