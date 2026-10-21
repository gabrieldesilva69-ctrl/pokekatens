#!/usr/bin/env node
/* ============ serve.cjs — servidor web local de PokeKatens ============
 * Para jugar en el ordenador y para las pruebas de la app de escritorio.
 * Sin dependencias: sólo módulos de Node.
 *
 *   node tools/serve.cjs [--port N]
 *
 * Puerto por defecto 8123 (--port 0 = el sistema elige uno libre). Escucha
 * sólo en 127.0.0.1 y sirve la carpeta del repositorio. Al empezar escribe
 * una línea «PK_SERVE http://127.0.0.1:<puerto>/».
 * Nada se guarda en caché (Cache-Control: no-store), así el actualizador
 * ve cada version.json nuevo.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_PORT = 8123;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

function portArg(argv) {
  const i = argv.indexOf('--port');
  if (i < 0) return DEFAULT_PORT;
  const n = Number(argv[i + 1]);
  if (!Number.isInteger(n) || n < 0 || n > 65535) {
    console.error('Uso: node tools/serve.cjs [--port N]');
    process.exit(2);
  }
  return n;
}

function send(res, code, text) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(text + '\n');
}

function handle(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return send(res, 405, 'Método no permitido');
  }
  // La ruta se toma tal cual llega (sin normalizar): se quita la parte ?…
  let route = req.url.split('?')[0];
  try { route = decodeURIComponent(route); } catch (e) { return send(res, 400, 'Ruta no válida'); }
  if (route.includes('\0')) return send(res, 400, 'Ruta no válida');
  if (route.endsWith('/')) route += 'index.html';

  let file = path.resolve(ROOT, '.' + route);
  // Nunca se sirve nada de fuera de la carpeta del repositorio.
  if (!file.startsWith(ROOT + path.sep)) return send(res, 403, 'Prohibido');

  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) {
      file = path.join(file, 'index.html');
      return fs.stat(file, (err2, st2) => serveFile(req, res, file, err2 ? null : st2));
    }
    serveFile(req, res, file, err ? null : st);
  });
}

function serveFile(req, res, file, st) {
  if (!st || !st.isFile()) return send(res, 404, 'No encontrado');
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Content-Length': st.size,
    'Cache-Control': 'no-store'
  });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
}

const server = http.createServer(handle);
server.on('error', err => {
  console.error(err.code === 'EADDRINUSE' ? `El puerto ${err.port} está ocupado.` : err.message);
  process.exit(1);
});
server.listen(portArg(process.argv.slice(2)), '127.0.0.1', () => {
  console.log(`PK_SERVE http://127.0.0.1:${server.address().port}/`);
});
