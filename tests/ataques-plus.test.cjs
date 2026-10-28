/* ============ ataques-plus.test.cjs — aspecto de los ataques evolucionados («… +») ============
 * El «+» sólo se ve: borde de luz (vfx.js), chispas, destello y aro doble (fx.js). En calidad
 * baja se queda en el borde. Los números del ataque (moves.js) no cambian por esto.
 *   node --test tests/ataques-plus.test.cjs
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// Un lienzo de mentira que cuenta los drawImage.
function load() {
  const calls = { drawImage: 0 };
  const any = () => new Proxy(function () {}, {
    get: (o, k) => (k === 'width' || k === 'height' ? 16 : k === 'drawImage' ? () => { calls.drawImage++; } : any()),
    set: () => true, apply: () => any()
  });
  const level = { fx: 2 };
  const G = {
    Sprites: { PX: 2 },
    U: { hash: () => 0.5, rand: (a, b) => (a + b) / 2, lerp: (a, b, k) => a + (b - a) * k },
    Settings: { get fx() { return level.fx; }, get: () => true }
  };
  const ctx = vm.createContext({ G, document: { createElement: () => any() }, performance: { now: () => 0 }, Math });
  for (const f of ['js/entities/vfx.js', 'js/entities/fx.js']) vm.runInContext(read(f), ctx, { filename: f });
  return { G, calls, level, ctx2d: any() };
}

test('forMove marca los ataques evolucionados con plus (también los de un compañero: ghostCast los evoluciona)', () => {
  const { G } = load();
  assert.equal(G.VFX.forMove({ id: 'ember', type: 'fire' }).plus, false);
  assert.equal(G.VFX.forMove({ id: 'ember', type: 'fire', evolved: true }).plus, true);
  assert.match(read('js/systems/combat.js'), /if \(evolved\) G\.Moves\.evolve\(m\);/);
});

test('el borde de luz es un solo drawImage más por sprite', () => {
  const { G, calls, ctx2d } = load();
  G.VFX.draw(ctx2d, 'fire', 'fire', 0, 0, {});
  assert.equal(calls.drawImage, 1);
  G.VFX.draw(ctx2d, 'fire', 'fire', 0, 0, { plus: true });
  assert.equal(calls.drawImage, 3);
});

test('en calidad baja no hay chispas ni destello (sólo el borde); en alta, sí', () => {
  const { G, level } = load();
  level.fx = 0;
  G.FX.glint('fire', 0, 0); G.FX.plusFlash(0, 0, 'fire', 10);
  assert.equal(G.FX.count, 0);
  level.fx = 2;
  G.FX.glint('fire', 0, 0); G.FX.plusFlash(0, 0, 'fire', 10);
  assert.equal(G.FX.count, 2, 'una chispa y la cruz del destello');
});

test('evolucionar sigue cambiando sólo lo de EVO_MODS (nada de daño ni radio extra por lo visual)', () => {
  const src = read('js/data/moves.js');
  const body = src.slice(src.indexOf('function evolve(m)'), src.indexOf('const isStatus'));
  assert.doesNotMatch(body, /vis|plus|draw/);
});
