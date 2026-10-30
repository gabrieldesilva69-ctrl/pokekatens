/* ============ settings.js — ajustes de este dispositivo ============
 * Se guardan en el navegador (no en la cuenta): cada PC o móvil tiene los
 * suyos. El volumen lo guarda audio.js aparte.
 *
 *   quality     'auto' | 'high' | 'mid' | 'low'   efectos y partículas
 *   dmgNumbers  true/false                        números de daño
 *   calm        true/false                        menos sacudidas y destellos
 *   darkNight   true/false                        la noche oscurece la pantalla (systems/night.js)
 *   fps         true/false                        contador de FPS
 *   fpsCap      0 | 144 | 120 | 60 | 30           FPS como mucho (0 = los que dé la pantalla; game.js)
 *   pixelPerfect true/false                       cada píxel del arte, un número entero de píxeles (camera.js)
 *   ping        true/false                        ping en ms en las partidas en grupo
 *   stick       0.8 | 1 | 1.25                    tamaño del joystick táctil
 *   stickMode   'float' | 'anchor' | 'fixed'      joystick donde pones el dedo (que le sigue o se queda ahí), o siempre en su sitio
 *   pad         { bar, pause, stick } | null      dónde van los botones en móvil (centro, en
 *                                                 proporción a la pantalla); lo pone layout-ui.js
 *   gamepad     true/false                        jugar con mando (gamepad.js)
 *   padRumble   true/false                        que el mando vibre al recibir daño
 *   aimManual   true/false                        apuntar a mano (ratón o stick derecho) en vez de solo
 *   cries       true/false                        gritos de los Pokémon (audio.js → cry)
 *   fx          'all' | 'partner' | 'off'         efectos de los Pokémon (entities/aura.js): todos,
 *                                                 sólo tu compañero o ninguno
 *   fxOff       [dex, ...]                        Pokémon a los que les has quitado los efectos (ficha)
 *   trails      'all' | 'partner' | 'off'         rastros en el suelo (entities/aura.js), aparte de
 *                                                 los efectos: todos, sólo tu compañero o ninguno
 *   trailOff    [dex, ...]                        Pokémon a los que les has quitado el rastro (ficha)
 *   keys        { acción: [tecla, tecla] } | null  teclas cambiadas en PC (sólo las distintas de
 *                                                 las de fábrica); lo pone input.js
 *
 *   G.Settings.get('quality')  ·  G.Settings.set('fps', true)  ·  G.Settings.on(fn)
 *   G.Settings.fx   nivel efectivo 0 (bajo) .. 2 (alto), ya resuelto el 'auto'
 */
G.Settings = (() => {
  const KEY = 'ps.settings';
  const DEF = { quality: 'auto', dmgNumbers: true, calm: false, fps: false, fpsCap: 0, pixelPerfect: true, ping: true, stick: 1, stickMode: 'float', pad: null, gamepad: true, padRumble: true, aimManual: false, cries: true, darkNight: true, fx: 'all', fxOff: [], trails: 'all', trailOff: [], keys: null };
  let s = Object.assign({}, DEF);
  try { Object.assign(s, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* nada */ }
  const fns = new Set();

  // Calidad automática: empieza alta (media en móvil) y baja si va a tirones.
  const touchy = matchMedia('(pointer: coarse)').matches;
  let autoLevel = touchy ? 1 : 2;
  let acc = 0, frames = 0, slowT = 0, fastT = 0;

  function save() { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* nada */ } }
  function get(k) { return s[k]; }
  function set(k, v) { s[k] = v; save(); fns.forEach(fn => { try { fn(k, v); } catch (e) { /* nada */ } }); }

  /** Lo llama el bucle del juego en cada fotograma (sólo durante la partida). */
  function sample(dt) {
    if (s.quality !== 'auto' || dt <= 0) return;
    acc += dt; frames++;
    if (acc < 1) return;
    const fps = frames / acc;
    acc = 0; frames = 0;
    // 3 s seguidos por debajo de 45 FPS: baja un nivel; 8 s por encima de 57: sube.
    // (Con el límite de FPS, en proporción a él: a 30 FPS no va a tirones.)
    const cap = s.fpsCap > 0 ? s.fpsCap : 60, slow = Math.min(45, cap * 0.75), fast = Math.min(57, cap * 0.95);
    if (fps < slow) { slowT++; fastT = 0; } else if (fps > fast) { fastT++; slowT = 0; } else { slowT = fastT = 0; }
    if (slowT >= 3 && autoLevel > 0) { autoLevel--; slowT = 0; }
    if (fastT >= 8 && autoLevel < (touchy ? 1 : 2)) { autoLevel++; fastT = 0; }
  }

  return {
    get, set, sample, DEF,
    on(fn) { fns.add(fn); },
    get all() { return Object.assign({}, s); },
    get fx() { return s.quality === 'auto' ? autoLevel : s.quality === 'high' ? 2 : s.quality === 'mid' ? 1 : 0; },
    get autoLevel() { return autoLevel; },
    get touch() { return touchy; }
  };
})();
