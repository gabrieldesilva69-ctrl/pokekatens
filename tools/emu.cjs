#!/usr/bin/env node
/* ============ emu.cjs — emuladores de Firebase para las pruebas ============
 * Arranca los emuladores auth, firestore y database del proyecto de prueba
 * demo-pokekatens (no toca ningún servidor real), ejecuta un comando dentro
 * y los para al acabar.
 *
 *   node tools/emu.cjs --check-java      ¿hay Java 21 o más nuevo? (0 = sí, 2 = no)
 *   node tools/emu.cjs "<comando>"       sale con el código del comando
 *
 * Los emuladores necesitan Java 21. Se busca por este orden: %JAVA_HOME%\bin,
 * C:\Program Files\Eclipse Adoptium\jdk-2*\bin (la más nueva primero) y el PATH.
 */
const FIREBASE_TOOLS = 'firebase-tools@15.34.0';
const PROJECT = 'demo-pokekatens';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const MIN_JAVA = 21;
const EXE = process.platform === 'win32' ? 'java.exe' : 'java';

/** Versión principal de un java (1.8 → 8), o 0 si no se puede ejecutar. */
function javaVersion(exe) {
  const r = spawnSync(exe, ['-version'], { encoding: 'utf8' });
  if (r.error) return 0;
  const m = /version "(\d+)(?:\.(\d+))?/.exec((r.stderr || '') + (r.stdout || ''));
  if (!m) return 0;
  const major = Number(m[1]);
  return major === 1 ? Number(m[2] || 0) : major;
}

/** Carpetas bin donde buscar, en orden; null = el java del PATH. */
function candidates() {
  const out = [];
  if (process.env.JAVA_HOME) out.push(path.join(process.env.JAVA_HOME, 'bin'));
  const adoptium = 'C:\\Program Files\\Eclipse Adoptium';
  try {
    fs.readdirSync(adoptium).filter(d => /^jdk-2/.test(d)).sort().reverse()
      .forEach(d => out.push(path.join(adoptium, d, 'bin')));
  } catch (e) { /* no está instalado ahí */ }
  out.push(null);
  return out;
}

/** → { version, bin } del primer Java ≥ 21 (bin = null si es el del PATH), o null. */
function findJava() {
  for (const bin of candidates()) {
    const exe = bin ? path.join(bin, EXE) : 'java';
    if (bin && !fs.existsSync(exe)) continue;
    const version = javaVersion(exe);
    if (version >= MIN_JAVA) return { version, bin };
  }
  return null;
}

function usage() {
  console.error('Uso: node tools/emu.cjs --check-java');
  console.error('     node tools/emu.cjs "<comando>"');
  process.exit(64);
}

const args = process.argv.slice(2);
if (args.length !== 1 || !args[0]) usage();

const java = findJava();
if (!java) {
  console.error('Falta Java 21: instala Temurin JDK 21 (docs/GUIA-PUBLICAR-POKEKATENS.md, apartado Java)');
  process.exit(2);
}
if (args[0] === '--check-java') {
  console.log(`Java ${java.version} en ${java.bin || 'el PATH'}`);
  process.exit(0);
}

const command = args[0];
if (command.includes('"')) {
  console.error('El comando no puede llevar comillas dobles.');
  process.exit(64);
}

const env = { ...process.env };
if (java.bin) {
  env.PATH = java.bin + path.delimiter + (env.PATH || '');
  env.JAVA_HOME = path.dirname(java.bin);
}
// Sin proxy: con él, firebase-tools se queda colgado al cargar las reglas del
// emulador database (PUT http://127.0.0.1:9000/.settings/rules.json sin respuesta).
delete env.HTTP_PROXY; delete env.HTTPS_PROXY; delete env.http_proxy; delete env.https_proxy;

/*
 * En Windows, al parar, emulators:exec cierra su parte pero los Java de Firestore
 * y Database pueden quedarse vivos con los puertos 8080/9000 ocupados, y la
 * siguiente prueba falla con "port taken". Se cierran antes y después, y sólo
 * los Java que ejecutan un .jar de emulador de la caché de firebase-tools.
 */
function stopLeftovers() {
  if (process.platform !== 'win32') return;
  spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    "Get-CimInstance Win32_Process -Filter \"Name='java.exe'\" | " +
    "Where-Object { $_.CommandLine -like '*\\.cache\\firebase\\emulators\\*' } | " +
    'ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }'],
    { stdio: 'ignore' });
}

stopLeftovers();
const r = spawnSync(`npx --yes ${FIREBASE_TOOLS} --non-interactive emulators:exec --only auth,firestore,database --project ${PROJECT} "${command}"`,
  { shell: true, stdio: 'inherit', env });
stopLeftovers();
process.exit(r.status === null ? 1 : r.status);
