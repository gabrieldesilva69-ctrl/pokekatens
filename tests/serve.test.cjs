const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

let child, port;

before(() => new Promise((resolve, reject) => {
  child = spawn(process.execPath, [path.join(__dirname, '..', 'tools', 'serve.cjs'), '--port', '0'],
    { stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  const timer = setTimeout(() => reject(new Error('serve.cjs no escribió PK_SERVE: ' + out)), 10000);
  child.stdout.on('data', d => {
    out += d;
    const m = out.match(/PK_SERVE http:\/\/127\.0\.0\.1:(\d+)\//);
    if (m) { clearTimeout(timer); port = Number(m[1]); resolve(); }
  });
  child.on('exit', code => { clearTimeout(timer); reject(new Error('serve.cjs salió con ' + code)); });
}));
after(() => { if (child) child.kill(); });

// La ruta va tal cual en `path`, sin normalizar.
function request(method, route) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path: route }, res => {
      res.resume();
      res.on('end', () => resolve(res));
    });
    req.on('error', reject);
    req.end();
  });
}

test('serves game files with their type and no-store caching', async () => {
  for (const [route, type] of [['/dev.html', 'text/html'], ['/js/core/util.js', 'text/javascript'],
    ['/version.json', 'application/json']]) {
    const res = await request('GET', route);
    assert.equal(res.statusCode, 200, route);
    assert.ok(res.headers['content-type'].startsWith(type), route + ' ' + res.headers['content-type']);
    assert.equal(res.headers['cache-control'], 'no-store', route);
  }
});
test('missing files are 404', async () => {
  assert.equal((await request('GET', '/no-existe.html')).statusCode, 404);
});
test('paths that climb out of the repository are 403', async () => {
  assert.equal((await request('GET', '/%2e%2e/%2e%2e/secreto.txt')).statusCode, 403);
});
test('methods other than GET and HEAD are 405', async () => {
  assert.equal((await request('POST', '/')).statusCode, 405);
});
