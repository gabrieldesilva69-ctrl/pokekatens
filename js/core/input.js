/* ============ input.js — teclado y ratón (el táctil está en touch.js y el mando en gamepad.js) ============
 * Las teclas de la partida van por ACCIONES (moverse, cambiar de ataque, pausa...), cada
 * una con dos huecos: principal y alternativa. Vienen con las de fábrica y se pueden
 * cambiar en Ajustes → Controles; G.Settings 'keys' guarda sólo las que son distintas.
 * Esc siempre pausa y cierra (no se puede quitar), y los menús (cartas 1-3, R) son fijos.
 */
G.Input = (() => {
  const down = new Set();
  const pressed = new Set();   // se limpia cada frame
  let mx = 0, my = 0, mdown = false;

  const DEF_KEYS = {
    up: ['keyw', 'arrowup'], down: ['keys', 'arrowdown'],
    left: ['keya', 'arrowleft'], right: ['keyd', 'arrowright'],
    prev: ['keyq', ''], next: ['keye', 'tab'], pause: ['keyp', ''],
    slot1: ['digit1', 'numpad1'], slot2: ['digit2', 'numpad2'], slot3: ['digit3', 'numpad3'], slot4: ['digit4', 'numpad4'],
    mega: ['keyf', ''],
    orb1: ['digit5', 'numpad5'], orb2: ['digit6', 'numpad6'], orb3: ['digit7', 'numpad7'], orb4: ['digit8', 'numpad8']
  };
  const ACTIONS = Object.keys(DEF_KEYS);
  const RESERVED = new Set(['escape']);
  let binds = null;            // acción -> [tecla, tecla] ya mezclado con lo guardado

  function load() {
    const saved = G.Settings.get('keys') || {};
    binds = {};
    for (const a of ACTIONS) {
      const v = saved[a];
      binds[a] = Array.isArray(v) && v.length === 2 ? v.map(k => (typeof k === 'string' && !RESERVED.has(k) ? k : '')) : DEF_KEYS[a].slice();
    }
    return binds;
  }
  const keysOf = a => (binds || load())[a] || [];
  function save() {
    const diff = {};
    for (const a of ACTIONS) if (binds[a].join() !== DEF_KEYS[a].join()) diff[a] = binds[a].slice();
    G.Settings.set('keys', Object.keys(diff).length ? diff : null);
  }

  function code(e) { return (e.code || e.key).toLowerCase(); }

  addEventListener('keydown', e => {
    const c = code(e);
    if (!down.has(c)) pressed.add(c);
    down.add(c);
    // Evita que el navegador haga scroll con flechas/espacio durante el juego.
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space', 'tab'].includes(c)) e.preventDefault();
  });
  addEventListener('keyup', e => down.delete(code(e)));
  addEventListener('blur', () => { down.clear(); });
  let movedAt = 0;               // última vez que se movió el ratón (apuntado a mano)
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; movedAt = performance.now(); });
  addEventListener('mousedown', () => mdown = true);
  addEventListener('mouseup', () => mdown = false);

  // ---------------- nombres de las teclas ----------------
  // Con la distribución real del teclado si el navegador la da (en AZERTY, la "W" de
  // fábrica sale como "Z"); si no, por el código físico.
  let layout = null;
  try { if (navigator.keyboard && navigator.keyboard.getLayoutMap) navigator.keyboard.getLayoutMap().then(m => { layout = m; }).catch(() => {}); } catch (e) { /* nada */ }
  const NAMES = {
    arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→', space: 'Espacio', enter: 'Intro', tab: 'Tab',
    shiftleft: 'Mayús izq.', shiftright: 'Mayús der.', controlleft: 'Ctrl izq.', controlright: 'Ctrl der.',
    altleft: 'Alt', altright: 'Alt Gr', capslock: 'Bloq Mayús', backspace: '⌫', numpadenter: 'Num Intro'
  };
  function keyName(c) {
    if (!c) return '—';
    if (NAMES[c]) return NAMES[c];
    if (layout) for (const [k, l] of layout) if (k.toLowerCase() === c && l.trim()) return l.toUpperCase();
    let m;
    if ((m = c.match(/^key([a-z])$/))) return m[1].toUpperCase();
    if ((m = c.match(/^digit(\d)$/))) return m[1];
    if ((m = c.match(/^numpad(.+)$/))) return 'Num ' + m[1];
    if ((m = c.match(/^f(\d+)$/))) return 'F' + m[1];
    return c.charAt(0).toUpperCase() + c.slice(1);
  }

  return {
    /** Vector de movimiento del jugador (teclado, joystick táctil o mando). */
    axis() {
      const t = G.Touch && G.Touch.vector();
      if (t && (t[0] || t[1])) return t;
      const g = G.Pad && G.Pad.vector();
      if (g && (g[0] || g[1])) return g;
      const on = a => keysOf(a).some(k => k && down.has(k));
      let x = 0, y = 0;
      if (on('left')) x -= 1;
      if (on('right')) x += 1;
      if (on('up')) y -= 1;
      if (on('down')) y += 1;
      return G.U.norm(x, y);
    },
    held(c) { return down.has(c); },
    /** true sólo en el frame en que se pulsó. */
    tap(c) { return pressed.has(c); },
    /** Una pulsación que no viene del teclado (el mando): cuenta como tecla en este fotograma. */
    virtual(c) { pressed.add(c); },
    /** ¿Se pulsó en este fotograma alguna tecla de la acción (o el mando la pidió)? Pausa: también Esc. */
    act(a) {
      if (pressed.has('act:' + a) || (a === 'pause' && pressed.has('escape'))) return true;
      return keysOf(a).some(k => k && pressed.has(k));
    },
    /** El mando pide una acción (vale aunque se cambien las teclas). */
    virtualAct(a) { pressed.add('act:' + a); },

    // ---------------- teclas configurables (Ajustes → Controles) ----------------
    ACTIONS,
    keys(a) { return keysOf(a).slice(); },
    /** Nombre corto de la primera tecla de la acción ('' si no tiene). */
    actKey(a) { const k = keysOf(a).find(Boolean); return k ? keyName(k) : ''; },
    /** Pone `c` en el hueco `slot` (0 o 1) de la acción. Si otra acción la usaba, se intercambian. */
    bind(a, slot, c) {
      if (!binds) load();
      if (RESERVED.has(c) || !binds[a]) return false;
      const old = binds[a][slot];
      if (c) for (const b of ACTIONS) {
        const i = binds[b].indexOf(c);
        if (i >= 0 && !(b === a && i === slot)) binds[b][i] = b === a ? '' : old;
      }
      binds[a][slot] = c;
      save();
      return true;
    },
    resetKeys() { binds = null; G.Settings.set('keys', null); load(); },
    /** ¿Siguen las teclas de fábrica? */
    get defaultKeys() { return !G.Settings.get('keys'); },
    keyName,
    isReserved(c) { return RESERVED.has(c); },

    mouse() { return { x: mx, y: my, down: mdown }; },
    /** Cuándo se movió el ratón por última vez (performance.now). */
    get mouseMovedAt() { return movedAt; },
    /** Dónde apunta el ratón en el mundo (el lienzo ocupa toda la ventana). */
    mouseWorld() { return { x: G.Camera.left() + mx / G.Camera.scale, y: G.Camera.top() + my / G.Camera.scale }; },
    endFrame() { pressed.clear(); }
  };
})();
