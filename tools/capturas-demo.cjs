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
  return Object.keys(n).sort((a, b) => n[b] - n[a]);
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
      // Primero, el tamaño que tiene la página; luego, la foto con esa ventana.
      const dom = spawnSync(exe, [...comun, '--dump-dom', url], { encoding: 'utf8', timeout: 60000 });
      const m = /data-w="(\d+)" data-h="(\d+)"/.exec(dom.stdout || '');
      if (!m) { console.error('✗ ' + f + ': la página no ha pintado'); mal++; continue; }
      const png = path.join(OUT, f + '.png');
      fs.rmSync(png, { force: true });
      spawnSync(exe, [...comun, `--window-size=${m[1]},${m[2]}`, '--screenshot=' + png, url], { encoding: 'utf8', timeout: 60000 });
      if (fs.existsSync(png)) console.log('✓ demo/capturas/' + f + '.png  ' + m[1] + '×' + m[2]);
      else { console.error('✗ ' + f + ': no se ha guardado la imagen'); mal++; }
    }
  } finally {
    srv.kill();
    try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) { /* el navegador puede tardar en soltarlo */ }
  }
  process.exit(mal ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
