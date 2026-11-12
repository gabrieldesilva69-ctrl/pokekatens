#!/usr/bin/env node
/* ============ capturas-demo.cjs — capturas en PNG de la demo de ataques «+» ============
 * Una imagen por familia en demo/capturas/<familia>.png, con el ataque normal y su «+»
 * lado a lado. Abre demo/ataques-plus.html?captura=1 con Edge o Chrome sin ventana
 * (los que ya trae el ordenador: aquí no se instala nada) y guarda lo que pinta.
 *
 *   node tools/capturas-demo.cjs                  todas las familias
 *   node tools/capturas-demo.cjs projectile beam  sólo ésas
 *   node tools/capturas-demo.cjs --fase 0.2       segundos tras el lanzamiento en que se retrata (si no, el de cada familia)
 *   NAVEGADOR=/ruta/al/navegador node tools/capturas-demo.cjs
 */
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'demo', 'capturas');
const PORT = 8137;

function navegador() {
  const pf = process.env['ProgramFiles'] || 'C:\\Program Files', pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const c = [process.env.NAVEGADOR,
    path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'), path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'), path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  return c.find(p => p && fs.existsSync(p));
}

/** Las familias (kind) de los ataques que evolucionan, leídas de js/data/moves.js. */
function familias() {
  const G = {};
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'data', 'moves.js'), 'utf8'), vm.createContext({ G, Math }));
  const n = {};
  for (const id of Object.keys(G.Moves.EVO)) { const d = G.Moves.BY_ID[id]; if (d) n[d.kind] = (n[d.kind] || 0) + 1; }
  familias.cuantos = n;
  return Object.keys(n).sort((a, b) => n[b] - n[a]);
}

/** Tamaño de la imagen de una familia si Edge no deja leerlo de la página (misma cuenta que demo/banco.js: 2 columnas, zoom 2). */
function tamano(f) {
  if (f === 'pokemon') return [1224, 828];
  const k = f === 'pulidos' ? 4 : familias.cuantos[f], filas = Math.ceil(k / 2);
  return [1668, filas * 280 + (filas - 1) * 28 + 24 + 70];
}

const espera = ms => new Promise(r => setTimeout(r, ms));
async function arriba() {
  for (let i = 0; i < 50; i++) {
    const ok = await new Promise(r => http.get({ host: '127.0.0.1', port: PORT, path: '/demo/ataques-plus.html' }, res => { res.resume(); r(res.statusCode === 200); }).on('error', () => r(false)));
    if (ok) return true;
    await espera(100);
  }
  return false;
}

(async () => {
  const args = process.argv.slice(2);
  const ip = args.indexOf('--fase');
  const fase = ip >= 0 ? +args.splice(ip, 2)[1] || 0 : 0;
  const exe = navegador();
  if (!exe) { console.error('No encuentro Edge ni Chrome. Pon su ruta en la variable NAVEGADOR.'); process.exit(1); }
  const todas = familias();
  const extras = ['pulidos', 'pokemon'];               // vistas de la demo que no son una familia
  const lista = args.length ? args : [...todas, ...extras];
  for (const f of lista) if (!todas.includes(f) && !extras.includes(f)) { console.error('Familia desconocida: ' + f + '\nLas que hay: ' + todas.join(', ')); process.exit(1); }

  fs.mkdirSync(OUT, { recursive: true });
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'pk-capturas-'));
  const srv = spawn(process.execPath, [path.join(ROOT, 'tools', 'serve.cjs'), '--port', String(PORT)], { stdio: 'ignore' });
  let mal = 0;
  try {
    if (!await arriba()) throw new Error('El servidor local no arranca (tools/serve.cjs).');
    const comun = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
                   '--force-device-scale-factor=1', '--virtual-time-budget=4000', '--user-data-dir=' + perfil];
    for (const f of lista) {
      const url = `http://127.0.0.1:${PORT}/demo/ataques-plus.html?captura=1&cols=2&familia=${f}&fase=${fase}`;
      // El tamaño de la ventana sale de la cuenta de tamano() (la de la propia página).
      const m = ['', ...tamano(f)];
      const png = path.join(OUT, f + '.png');
      fs.rmSync(png, { force: true });
      spawnSync(exe, [...comun, `--window-size=${m[1]},${m[2]}`, '--screenshot=' + png, url], { encoding: 'utf8', timeout: 60000 });
      // (Edge de ahora vuelve enseguida y guarda la imagen unos segundos después: se espera a que esté y deje de crecer.)
      for (let i = 0, ult = -1; i < 120; i++) {
        const tam = fs.existsSync(png) ? fs.statSync(png).size : 0;
        if (tam > 0 && tam === ult) break;
        ult = tam;
        await espera(500);
      }
      if (fs.existsSync(png)) console.log('✓ demo/capturas/' + f + '.png  ' + m[1] + '×' + m[2]);
      else { console.error('✗ ' + f + ': no se ha guardado la imagen'); mal++; }
    }
  } finally {
    srv.kill();
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) { /* el navegador puede tardar en soltarlo */ }
  }
  process.exit(mal ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
