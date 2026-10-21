#!/usr/bin/env node
/* ============ desktop-smoke.cjs — prueba la app de escritorio sin manos ============
 *   node tools/desktop-smoke.cjs                     online: abre el juego del servidor local
 *   node tools/desktop-smoke.cjs --offline           sin conexión: debe salir la pantalla Sin conexión
 *   node tools/desktop-smoke.cjs --hang              un servidor que nunca contesta: la app se rinde a los 30 s
 *   node tools/desktop-smoke.cjs --exe <ruta>        como online, pero con el .exe empaquetado
 *   node tools/desktop-smoke.cjs --exe <ruta> --default   sin PK_URL: la URL que lleva dentro el programa
 *   --url <url>                                      (online / --exe) esa URL en vez del servidor local
 *
 * Cada prueba usa un perfil nuevo (PK_PROFILE) y lee la marca de la app de un
 * archivo (PK_SMOKE_OUT). Escribe «DESKTOP_SMOKE_OK <modo>» y sale con 0, o
 * «DESKTOP_SMOKE_FAIL <modo>: …» y sale con 1.
 */
const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const APP_TIMEOUT = 60000;
const DEFAULT_URL = 'http://127.0.0.1:8123/';

const argv = process.argv.slice(2);
const flag = f => argv.includes(f);
const value = f => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
const exe = value('--exe');
const url = value('--url');
const mode = flag('--offline') ? 'offline' : flag('--hang') ? 'hang' : exe && flag('--default') ? 'default' : 'online';
const EXPECT = { online: [0, 'PK_SMOKE_OK'], default: [0, 'PK_SMOKE_OK'], offline: [0, 'PK_SMOKE_OFFLINE'], hang: [3, 'PK_SMOKE_TIMEOUT'] };

const cleanups = [];
function finish(ok, detail) {
  for (const fn of cleanups.reverse()) { try { fn(); } catch (e) { /* seguir limpiando */ } }
  console.log(ok ? `DESKTOP_SMOKE_OK ${mode}` : `DESKTOP_SMOKE_FAIL ${mode}: ${detail}`);
  process.exit(ok ? 0 : 1);
}

/** Arranca tools/serve.cjs y espera su línea PK_SERVE → la URL. */
function startServer(port) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(ROOT, 'tools', 'serve.cjs'), '--port', String(port)],
      { stdio: ['ignore', 'pipe', 'pipe'] });
    cleanups.push(() => child.kill());
    let out = '', err = '';
    const timer = setTimeout(() => reject(new Error('tools/serve.cjs no arrancó a tiempo')), 10000);
    child.stdout.on('data', d => {
      out += d;
      const m = out.match(/PK_SERVE (http:\/\/127\.0\.0\.1:\d+\/)/);
      if (m) { clearTimeout(timer); resolve(m[1]); }
    });
    child.stderr.on('data', d => { err += d; });
    child.on('exit', code => {
      clearTimeout(timer);
      reject(new Error(`tools/serve.cjs salió con ${code}${err ? ': ' + err.trim() : ''}`));
    });
  });
}

/** Un servidor que acepta conexiones y nunca contesta → su URL. */
function startHangServer() {
  return new Promise(resolve => {
    const sockets = new Set();
    const server = net.createServer(s => { sockets.add(s); s.on('close', () => sockets.delete(s)); });
    cleanups.push(() => { sockets.forEach(s => s.destroy()); server.close(); });
    server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}/`));
  });
}

async function gameUrl() {
  if (mode === 'offline') return 'http://127.0.0.1:1/';
  if (mode === 'hang') return startHangServer();
  if (mode === 'default') {
    // La misma URL que se empaquetó: sólo la local necesita el servidor en el 8123.
    const packed = JSON.parse(fs.readFileSync(path.join(ROOT, 'desktop', 'package.json'), 'utf8')).pokekatens.url;
    if (packed === DEFAULT_URL) {
      try { await startServer(8123); } catch (e) {
        throw new Error('no se pudo arrancar tools/serve.cjs en el puerto 8123 (¿está ocupado?): ' + e.message);
      }
    }
    return null;
  }
  if (url) return url;
  return (await startServer(0)) + 'index.html';
}

function appCommand() {
  if (exe) return [path.resolve(exe), ['--smoke']];
  let bin;
  try { bin = require(path.join(ROOT, 'desktop', 'node_modules', 'electron')); } catch (e) {
    throw new Error('Electron no está instalado (npm install --prefix desktop): ' + e.message);
  }
  return [bin, [path.join(ROOT, 'desktop'), '--smoke']];
}

(async () => {
  let bin, args, pkUrl;
  try {
    [bin, args] = appCommand();
    pkUrl = await gameUrl();
  } catch (e) { return finish(false, e.message); }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pokekatens-smoke-'));
  cleanups.push(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const out = path.join(tmp, 'marca.txt');
  const profile = path.join(tmp, 'perfil');
  fs.mkdirSync(profile);

  const env = { ...process.env, PK_SMOKE_OUT: out, PK_PROFILE: profile };
  if (pkUrl) env.PK_URL = pkUrl; else delete env.PK_URL;

  const child = spawn(bin, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  child.stdout.on('data', d => { stdout += d; });
  child.stderr.on('data', () => {});
  const killer = setTimeout(() => { child.kill(); finish(false, `la app no salió en ${APP_TIMEOUT / 1000} s`); }, APP_TIMEOUT);

  child.on('error', e => { clearTimeout(killer); finish(false, 'no se pudo abrir la app: ' + e.message); });
  child.on('exit', code => {
    clearTimeout(killer);
    let mark = '';
    try { mark = fs.readFileSync(out, 'utf8').trim(); } catch (e) {
      const m = stdout.match(/PK_SMOKE_[A-Z]+/); mark = m ? m[0] : '';
    }
    const [wantCode, wantMark] = EXPECT[mode];
    finish(code === wantCode && mark === wantMark, `código ${code}, marca ${mark || '(ninguna)'}`);
  });
})();
