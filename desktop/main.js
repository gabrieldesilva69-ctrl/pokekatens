/* ============ main.js — PokeKatens para Windows ============
 * Una ventana de Electron que abre la web del juego. No lleva el juego dentro:
 * se actualiza solo con cada publicación (js/core/updater.js).
 *
 *   PK_URL        web que se abre (si falta, pokekatens.url de package.json)
 *   PK_PROFILE    carpeta de perfil (pruebas: empieza sin caché ni service worker)
 *   --smoke       prueba sin ventana: escribe una marca y sale
 *                 (PK_SMOKE_OK, PK_SMOKE_OFFLINE o, a los 30 s, PK_SMOKE_TIMEOUT)
 *   PK_SMOKE_OUT  archivo donde se escribe también la marca
 *
 * La ventana no da ningún acceso al PC a la página: sin preload, con
 * contextIsolation, sandbox y sin nodeIntegration. Lo de otras webs se abre
 * en el navegador del sistema.
 */
const { app, BrowserWindow, shell } = require('electron');
const fs = require('fs');
const path = require('path');

const URL_JUEGO = process.env.PK_URL || require('./package.json').pokekatens.url;
const SMOKE = process.argv.includes('--smoke');
const SMOKE_TIMEOUT = 30000;

if (process.env.PK_PROFILE) app.setPath('userData', process.env.PK_PROFILE);

function origin(url) {
  try { return new URL(url).origin; } catch (e) { return ''; }
}

/** Marca de prueba (consola y PK_SMOKE_OUT) y salida con ese código. */
function fin(codigo, marca) {
  console.log(marca);
  if (process.env.PK_SMOKE_OUT) {
    try { fs.writeFileSync(process.env.PK_SMOKE_OUT, marca + '\n'); } catch (e) { /* queda la consola */ }
  }
  app.exit(codigo);
}

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    autoHideMenuBar: true,
    title: 'PokeKatens',
    backgroundColor: '#0a1430',
    show: !SMOKE,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false }
  });
  const wc = win.webContents;

  // Ventanas nuevas y enlaces a otras webs: al navegador del sistema.
  wc.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  wc.on('will-navigate', (e, url) => {
    if (/^https?:\/\//.test(url) && origin(url) !== origin(URL_JUEGO)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  // Si la web no carga (sin internet y sin copia del service worker): pantalla
  // Sin conexión, con un botón para reintentar.
  let fallo = false;
  wc.on('did-fail-load', (e, codigo, desc, url, esPrincipal) => {
    if (!esPrincipal || codigo === -3) return;   // -3: carga cancelada
    fallo = true;
    win.loadFile(path.join(__dirname, 'offline.html'), { query: { url: URL_JUEGO } });
  });

  if (SMOKE) {
    wc.on('did-finish-load', () => {
      if (wc.getURL().startsWith('file:')) fin(0, 'PK_SMOKE_OFFLINE');
      else if (!fallo) fin(0, 'PK_SMOKE_OK');
      // Si falló, la página de error no cuenta: llegará la de offline.html.
    });
    setTimeout(() => fin(3, 'PK_SMOKE_TIMEOUT'), SMOKE_TIMEOUT);
  }

  win.loadURL(URL_JUEGO);
});

app.on('window-all-closed', () => app.quit());
