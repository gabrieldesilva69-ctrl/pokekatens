/* ============ fases.test.cjs — los legendarios de las grietas pelean por fases (31-10-2026) ============
 * js/entities/enemy.js: a 2/3 de vida su ataque de fase (según su tipo), a 1/3 se enfurecen y lanzan
 * una vez el ataque final. Todo con aviso en el suelo (G.Hazards).
 *   node --test tests/fases.test.cjs
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'js/entities/enemy.js'), 'utf8');

test('sólo el legendario de la grieta va por fases; los jefes y los de la Sentencia, como siempre', () => {
  assert.match(src, /phased\(\) \{ return !!this\.legend && !this\.judge; \}/);
  assert.match(src, /ai\.phase < 2 && this\.hp < this\.maxHp \* 2 \/ 3\) this\.phaseUp\(2, pl\)/);
  assert.match(src, /ai\.phase < 3 && this\.hp < this\.maxHp \/ 3\) this\.phaseUp\(3, pl\)/);
  assert.match(src, /else if \(!ai\.fury && this\.hp < this\.maxHp \* 0\.5\) this\.enrage\(\);/, 'los demás jefes se siguen enfureciendo a media vida');
});

test('cada tipo tiene su ataque de fase, y cada ataque de fase avisa en el suelo', () => {
  const sig = src.match(/sig: has\(([^)]*)\) \? 'spiral'\s*: has\(([^)]*)\) \? 'storm' : 'cross'/);
  assert.ok(sig, 'el reparto por tipos');
  const types = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic',
                 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
  const listed = (sig[1] + sig[2]).match(/'[a-z]+'/g).map(s => s.slice(1, -1));
  for (const t of listed) assert.ok(types.includes(t), t);
  for (const id of ['cross', 'spiral', 'storm', 'ultimate']) {
    const body = src.slice(src.indexOf(`case '${id}':`), src.indexOf('break;', src.indexOf(`case '${id}':`)));
    assert.match(body, /this\.hazard\(\{ kind: '(beam|zone)'/, id + ' avisa en el suelo');
    assert.match(body, /delay: /, id + ' con tiempo para apartarse');
  }
});
