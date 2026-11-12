/* ============ ataques-plus.test.cjs — aspecto de los ataques evolucionados («… +») ============
 * El «+» sólo se ve: borde de luz (vfx.js), chispas, destello y aro doble (fx.js) y, encima, el
 * rediseño propio de cada ataque (vfx-plus.js: silueta, estela e impacto). En calidad baja se
 * queda en la silueta con su borde. Los números del ataque (moves.js) no cambian por esto.
 * La demo (demo/) usa los scripts del juego y no llega ni al juego ni a la copia sin internet.
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
  const level = { fx: 2 }, clock = { t: 1000 };
  const G = {
    Sprites: { PX: 2 },
    U: { hash: () => 0.5, rand: (a, b) => (a + b) / 2, lerp: (a, b, k) => a + (b - a) * k },
    Settings: { get fx() { return level.fx; }, get: () => true }
  };
  const ctx = vm.createContext({ G, document: { createElement: () => any() }, performance: { now: () => clock.t }, Math });
  for (const f of ['js/entities/vfx.js', 'js/entities/fx.js', 'js/entities/vfx-plus.js', 'js/data/moves.js']) vm.runInContext(read(f), ctx, { filename: f });
  return { G, calls, level, clock, ctx2d: any() };
}

test('forMove marca los ataques evolucionados con plus (también los de un compañero: ghostCast los evoluciona)', () => {
  const { G } = load();
  assert.equal(G.VFX.forMove({ id: 'ember', type: 'fire' }).plus, false);
  assert.equal(G.VFX.forMove({ id: 'ember', type: 'fire', evolved: true }).plus, true);
  assert.match(read('js/systems/combat.js'), /if \(evolved\) G\.Moves\.evolve\(m\);/);
});

test('el borde de luz va pintado en el propio sprite: un «+» es un solo drawImage, como el normal', () => {
  const { G, calls, ctx2d } = load();
  G.VFX.draw(ctx2d, 'fire', 'fire', 0, 0, {});
  assert.equal(calls.drawImage, 1);
  G.VFX.draw(ctx2d, 'fire', 'fire', 0, 0, { plus: true });
  assert.equal(calls.drawImage, 2);
  G.VFX.draw(ctx2d, 'fire', 'fire', 0, 0, { echo: 1 });
  G.VFX.draw(ctx2d, 'fire', 'fire', 0, 0, { echo: 2 });
  assert.equal(calls.drawImage, 4, 'cada eco del rastro, otro');
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

// ---------------- el rediseño propio de cada «+» (vfx-plus.js) ----------------

test('cada ataque de EVO tiene su rediseño propio, y no hay dos iguales', () => {
  const { G } = load();
  const R = G.VFXPlus.REC, ids = Object.keys(G.Moves.EVO), S = G.VFX.SHAPES, T = G.VFXPlus.TRAILS, H = G.VFXPlus.HITS;
  assert.deepEqual(Object.keys(R).filter(id => !G.Moves.EVO[id]), [], 'rediseños de ataques que no evolucionan');
  assert.deepEqual(ids.filter(id => !R[id]), [], 'ataques de EVO sin rediseño propio');
  const vistos = new Map(), formas = new Map();
  for (const id of ids) {
    const r = R[id], def = G.Moves.BY_ID[id];
    assert.ok(Object.keys(r).length > 0, id + ': rediseño vacío');
    if (r.shape) {
      assert.notEqual(r.shape, G.VFX.forMove({ id, type: def.type }).proj, id + ': su «+» lleva la misma forma que el normal');
      assert.ok(!formas.has(r.shape), id + ' repite la silueta de ' + formas.get(r.shape));
      formas.set(r.shape, id);
    }
    // Todo lo que nombra existe.
    for (const A of [r, r.area || {}, r.ray || {}]) {
      for (const k of ['shape', 'body', 'mark', 'edge', 'floor', 'around', 'side']) if (A[k]) assert.ok(S[A[k]], id + ': no existe la forma ' + A[k]);
      for (const k of ['trail', 'bits', 'path']) if (A[k]) assert.equal(typeof T[A[k]], 'function', id + ': no existe la estela ' + A[k]);
      if (A.hit) assert.equal(typeof H[A.hit], 'function', id + ': no existe el impacto ' + A.hit);
    }
    // Cada forma de jugar, con lo que le toca: los que lanzan algo, su silueta; los rayos, ray; las zonas, area.
    const k = def.kind;
    if (['projectile', 'nova', 'homing', 'bounce', 'cone', 'orbit', 'boomerang', 'mine', 'meteor'].includes(k)) assert.ok(r.shape, id + ' (' + k + ') sin silueta');
    if (k === 'turret') assert.ok(r.body, id + ' sin torreta propia');
    if (['beam', 'charge', 'chain'].includes(k)) assert.ok(r.ray, id + ' (' + k + ') sin rayo propio');
    if (['aura', 'shove', 'stun', 'vortex', 'trail', 'quake', 'tremor', 'wave', 'cross', 'storm', 'leap', 'boom', 'mine', 'meteor'].includes(k)) assert.ok(r.area, id + ' (' + k + ') sin zona propia');
    if (['melee', 'spin', 'punch', 'scissor'].includes(k)) assert.ok(r.mark || r.edge || r.rope, id + ' (' + k + ') sin golpe propio');
    if (['dash', 'blitz'].includes(k)) assert.ok(r.path, id + ' (' + k + ') sin camino propio');
    const key = JSON.stringify(r);
    assert.ok(!vistos.has(key), id + ' tiene el mismo rediseño que ' + vistos.get(key));
    vistos.set(key, id);
  }
  assert.equal(vistos.size, ids.length);
});

test('las formas de los «+» se pintan (ninguna falla ni sale vacía) y no son mucho mayores que las normales', () => {
  const { G } = load();
  for (const [id, r] of Object.entries(G.VFXPlus.REC)) {
    if (!r.shape) continue;
    const S = G.VFX.SHAPES[r.shape], base = G.VFX.SHAPES[G.VFX.forMove({ id, type: G.Moves.BY_ID[id].type }).proj];
    for (let f = 0; f < (S.frames || 1); f++) assert.doesNotThrow(() => G.VFX.sprite(r.shape, 'fire', f, 1), r.shape);
    assert.ok(S.w <= base.w + 4 && S.h <= base.h + 4, r.shape + ' es demasiado grande para ' + id);
  }
});

test('forMove da el rediseño sólo al evolucionado', () => {
  const { G } = load();
  const m = G.Moves.instance('ember', 5);
  assert.equal(G.VFX.forMove(m).evo, null);
  G.Moves.evolve(m);
  const v = G.VFX.forMove(m);
  assert.equal(v.evo, G.VFXPlus.REC.ember);
  assert.equal(v.fine, true, 'Ascuas + se pinta con el píxel de Ascuas, no inflado');
  assert.equal(v.proj, 'fire', 'la forma normal no cambia (la lee quien no conoce el rediseño)');
});

test('en calidad baja, ni estela ni impacto propios; en alta, sí; y nunca pasan del tope', () => {
  const { G, level, clock } = load();
  const E = G.VFXPlus.REC;
  level.fx = 0;
  for (const id of Object.keys(E)) {
    const r = E[id];
    G.VFXPlus.trail(r, 'fire', 0, 0, 100, 0); G.VFXPlus.hit(r, 'fire', 0, 0, 100, 0); G.VFXPlus.cut(r, 'fire', 0, 0, 0, 40, 2);
    G.VFXPlus.path(r, 'fire', 0, 0, 80, 0); G.VFXPlus.ray(r, 'fire', 0, 0, 0, 200); G.VFXPlus.area(r, 'fire', 0, 0, 60);
  }
  assert.equal(G.FX.count, 0);
  level.fx = 2;
  for (const id of Object.keys(E)) {
    G.FX.clear();
    const r = E[id];
    clock.t += 100;                                   // (los impactos van con tope: uno cada 40 ms)
    G.VFXPlus.hit(r, 'fire', 0, 0, 100, 0); G.VFXPlus.cut(r, 'fire', 0, 0, 0, 40, 2); G.VFXPlus.path(r, 'fire', 0, 0, 80, 0);
    clock.t += 100;
    G.VFXPlus.ray(r, 'fire', 0, 0, 0, 200); G.VFXPlus.area(r, 'fire', 0, 0, 60);
    const soloAros = r.hit === 'ripple' || (!r.hit && !r.mark && !r.edge && !r.bits && !r.rope && !r.path && !r.ray && !r.area);
    assert.ok(G.FX.count > 0 || soloAros, id + ': lo suyo no pinta nada');
  }
  G.FX.clear();
  for (let i = 0; i < 20000; i++) { G.VFXPlus.trail(E.ember, 'fire', 0, 0, 100, 0); G.VFXPlus.area(E.toxic, 'poison', 0, 0, 60); G.VFXPlus.cut(E['vine-whip'], 'grass', 0, 0, 0, 40, 2); }
  assert.ok(G.FX.count <= 1400 * 0.85 + 320 * 0.8 + 40, 'los adornos dejan sitio libre: ' + G.FX.count);
});

test('lo pintan projectile.js (silueta, ecos, estela) y combat.js (impacto), sin tocar la red', () => {
  const p = read('js/entities/projectile.js'), c = read('js/systems/combat.js');
  assert.match(p, /E && E\.shape \|\| v\.proj/);
  assert.match(p, /echo: i/);
  assert.match(p, /G\.VFXPlus\.trail\(/);
  assert.match(c, /G\.VFXPlus\.hit\(/);
  assert.match(c, /G\.VFXPlus\.area\(/);
  assert.match(c, /G\.VFXPlus\.path\(/);
  assert.match(read('js/entities/fx.js'), /G\.VFXPlus\.cut\(/);
  assert.match(read('js/entities/fx.js'), /G\.VFXPlus\.ray\(/);
  for (const f of fs.readdirSync(path.join(ROOT, 'js', 'net'))) assert.doesNotMatch(read('js/net/' + f), /VFXPlus|\.evo\b/, f);
});

test('nada nuevo usa shadowBlur, filter ni degradados', () => {
  for (const f of ['js/entities/vfx-plus.js', 'js/entities/vfx.js', 'demo/banco.js']) {
    assert.doesNotMatch(read(f), /shadowBlur|\.filter\s*=|createLinearGradient|createRadialGradient/, f);
  }
});

// ---------------- la demo ----------------

test('la demo usa los scripts del juego y no llega ni al juego ni a la copia sin internet', () => {
  const dev = read('dev.html'), demo = read('demo/ataques-plus.html');
  const bloque = dev.slice(dev.indexOf('<!-- scripts:begin -->'), dev.indexOf('<!-- scripts:end -->'));
  assert.match(bloque, /js\/entities\/vfx-plus\.js/, 'vfx-plus.js va en el juego');
  assert.doesNotMatch(bloque, /demo\//, 'la demo no va en dev.html');
  const srcs = [...demo.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  const juego = srcs.filter(s => s.startsWith('js/'));
  assert.ok(juego.length >= 8);
  for (const s of juego) assert.ok(bloque.includes('src="' + s + '"'), s + ' no es un script del juego');
  assert.deepEqual(srcs.filter(s => !s.startsWith('js/')), ['demo/banco.js', 'demo/pokemon.js', 'demo/pagina.js']);
  // La demo no copia código del juego: ni formas ni paletas propias.
  for (const f of ['demo/banco.js', 'demo/pokemon.js', 'demo/pagina.js']) assert.doesNotMatch(read(f), /SHAPES\.\w+\s*=|PAL\s*=\s*\{/, f);
  assert.match(read('sw.js'), /if \(\/\\\/demo\\\/\/\.test\(url\.pathname\)\) return;/);
  assert.doesNotMatch(read('tools/build.js'), /demo\//);
});

test('con muchos golpes a la vez, los impactos propios tienen tope (uno cada 40 ms entre todos)', () => {
  const { G, clock } = load();
  const E = G.VFXPlus.REC.ember;
  G.VFXPlus.hit(E, 'fire', 0, 0, 100, 0);
  const uno = G.FX.count;
  assert.ok(uno > 0);
  for (let i = 0; i < 500; i++) G.VFXPlus.hit(E, 'fire', 0, 0, 100, 0);
  assert.equal(G.FX.count, uno, 'en el mismo instante no sale otro');
  clock.t += 41;
  G.VFXPlus.hit(E, 'fire', 0, 0, 100, 0);
  assert.ok(G.FX.count > uno);
  assert.match(read('js/entities/projectile.js'), /p\.turn = !p\.turn/, 'la estela propia se turna con la chispa común');
});
