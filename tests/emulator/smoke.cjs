/* ============ smoke.cjs — cuentas y partidas contra el emulador ============
 * Se ejecuta dentro de los emuladores: node tools/emu.cjs "node tests/emulator/smoke.cjs"
 * (no termina en .test.cjs: node --test no lo lanza sin emuladores).
 * Nunca imprime tokens ni contraseñas: sólo códigos de respuesta.
 */
const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const KEY = 'demo-pokekatens-key';
const DOCS = 'http://127.0.0.1:8080/v1/projects/demo-pokekatens/databases/(default)/documents';

function fail(what, expected, got) {
  console.log(`EMULATOR_SMOKE_FAIL ${what}: esperado ${expected}, recibido ${got}`);
  process.exit(1);
}
function expect(what, expected, got) {
  if (got !== expected) fail(what, expected, got);
  console.log('ok ' + what);
}

async function signUp(email) {
  const r = await fetch(`${AUTH}/accounts:signUp?key=${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'secreto123', returnSecureToken: true })
  });
  expect('crear ' + email.split('@')[0], 200, r.status);
  const j = await r.json();
  return { token: j.idToken, uid: j.localId };
}

function saveBody(uid, exists, extra = {}) {
  return {
    writes: [{
      update: {
        name: `projects/demo-pokekatens/databases/(default)/documents/saves/${uid}`,
        fields: {
          v: { integerValue: '3' },
          save: { mapValue: { fields: {
            coins: { integerValue: '500' },
            tickets: { mapValue: { fields: {
              t1: { integerValue: '1' },
              t10: { integerValue: '0' }
            } } },
            ...extra
          } } }
        }
      },
      updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }],
      currentDocument: { exists }
    }]
  };
}

const commit = (user, exists, extra) => fetch(`${DOCS}:commit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + user.token },
  body: JSON.stringify(saveBody(user.uid, exists, extra))
});
const read = (user, uid) => fetch(`${DOCS}/saves/${uid}`, { headers: { Authorization: 'Bearer ' + user.token } });

(async () => {
  const uno = await signUp('uno@jugadores.pokekatens.invalid');
  const dos = await signUp('dos@jugadores.pokekatens.invalid');

  expect('el usuario 1 guarda su partida', 200, (await commit(uno, false)).status);
  expect('el usuario 2 no puede leerla', 403, (await read(dos, uno.uid)).status);

  const r = await read(uno, uno.uid);
  expect('el usuario 1 la lee', 200, r.status);
  const doc = await r.json();
  if (!String(doc.name || '').endsWith('/saves/' + uno.uid)) fail('nombre del documento', '/saves/<uid1>', doc.name);
  console.log('ok nombre del documento');

  expect('guardar otra vez antes de 20 s', 403, (await commit(uno, true)).status);

  // Megapiedra en la Mochila (save.bag.ms6, data/shop.js) y su apunte en la libreta.
  const mochila = await signUp('mochila@jugadores.pokekatens.invalid');
  const bag = { bag: { mapValue: { fields: { ms6: { integerValue: '1' } } } } };
  expect('guardar una partida con una Megapiedra', 200, (await commit(mochila, false, bag)).status);
  const r3 = await read(mochila, mochila.uid);
  expect('leerla', 200, r3.status);
  const got = (((((await r3.json()).fields || {}).save || {}).mapValue || {}).fields || {}).bag;
  const n = got && got.mapValue && got.mapValue.fields && got.mapValue.fields.ms6;
  if (!n || n.integerValue !== '1') fail('la Megapiedra sigue en la Mochila', 'ms6 = 1', JSON.stringify(got));
  console.log('ok la Megapiedra sigue en la Mochila');

  // Huevos en la Incubadora (save.eggs, systems/eggs.js): una lista de mapas.
  const incu = await signUp('huevos@jugadores.pokekatens.invalid');
  const egg = { mapValue: { fields: { id: { stringValue: 'mh3k2a9z' }, dex: { integerValue: '25' }, shiny: { booleanValue: false },
    need: { integerValue: '1000' }, done: { integerValue: '340' }, from: { stringValue: 'mission' } } } };
  const withEgg = { eggs: { arrayValue: { values: [egg] } }, eggsHatched: { mapValue: { fields: { old1: { integerValue: '1' } } } } };
  expect('guardar una partida con un huevo', 200, (await commit(incu, false, withEgg)).status);
  const r4 = await read(incu, incu.uid);
  expect('leerla', 200, r4.status);
  const f4 = (((await r4.json()).fields || {}).save || {}).mapValue.fields;
  const e4 = f4.eggs && f4.eggs.arrayValue.values[0].mapValue.fields;
  if (!e4 || e4.id.stringValue !== 'mh3k2a9z' || e4.done.integerValue !== '340') fail('el huevo sigue igual', 'mh3k2a9z 340/1000', JSON.stringify(e4));
  console.log('ok el huevo sigue igual');

  // Pokédex de vistos y derrotados (save.seen / save.beat, systems/seen.js): textos cortos.
  const dex = await signUp('pokedex@jugadores.pokekatens.invalid');
  const hex = n => ({ stringValue: 'f'.repeat(n) });
  expect('guardar una partida con su Pokédex', 200, (await commit(dex, false, { seen: hex(260), beat: hex(40) })).status);
  const dex2 = await signUp('pokedex2@jugadores.pokekatens.invalid');
  expect('una Pokédex demasiado larga no se guarda', 403, (await commit(dex2, false, { seen: hex(261) })).status);
  expect('ni una que no es texto', 403, (await commit(dex2, false, { beat: { integerValue: '5' } })).status);

  // Avatar de entrenador en el perfil público (profiles/{uid}.avatar, data/avatars.js): 0 a 60.
  const prof = (user, nick, avatar, withName) => fetch(`${DOCS}:commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + user.token },
    body: JSON.stringify({ writes: [
      ...(withName ? [{ update: { name: `projects/demo-pokekatens/databases/(default)/documents/names/${nick}`,
        fields: { uid: { stringValue: user.uid } } }, currentDocument: { exists: false } }] : []),
      { update: { name: `projects/demo-pokekatens/databases/(default)/documents/profiles/${user.uid}`,
        fields: { name: { stringValue: nick }, lower: { stringValue: nick }, avatar: avatar } },
        updateTransforms: [{ fieldPath: 'at', setToServerValue: 'REQUEST_TIME' }] }] })
  });
  const ava = await signUp('avatar@jugadores.pokekatens.invalid');
  expect('un avatar que no existe (61)', 403, (await prof(ava, 'avatarin', { integerValue: '61' }, true)).status);
  expect('ni uno que no es un número', 403, (await prof(ava, 'avatarin', { stringValue: '<img>' }, true)).status);
  expect('perfil con el avatar 60', 200, (await prof(ava, 'avatarin', { integerValue: '60' }, true)).status);

  // Estado para los amigos (presence/<uid> en la Realtime Database, 25-10-2026, database.rules.json).
  // (El emulador aplica database.rules.json en el espacio <proyecto>-default-rtdb, como el de verdad.)
  const RTDB = 'http://127.0.0.1:9000';
  const putPres = (user, who, body) => fetch(`${RTDB}/presence/${who}.json?ns=demo-pokekatens-default-rtdb&auth=${user.token}`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const ts = { '.sv': 'timestamp' };
  const est = await signUp('estado@jugadores.pokekatens.invalid');
  expect('poner tu estado (en partida)', 200, (await putPres(est, est.uid, { s: 'play', at: ts })).status);
  expect('el estado de otro no', 401, (await putPres(est, uno.uid, { s: 'off', at: ts })).status);
  expect('un estado que no existe no', 401, (await putPres(est, est.uid, { s: 'admin', at: ts })).status);
  expect('ni con campos de más', 401, (await putPres(est, est.uid, { s: 'on', at: ts, nombre: '<b>x</b>' })).status);
  expect('ni con una hora del futuro', 401, (await putPres(est, est.uid, { s: 'on', at: Date.now() + 3600e3 })).status);
  expect('ni con una hora del pasado', 401, (await putPres(est, est.uid, { s: 'on', at: 1 })).status);
  expect('otro jugador lo lee', 200, (await fetch(`${RTDB}/presence/${est.uid}.json?ns=demo-pokekatens-default-rtdb&auth=${uno.token}`)).status);
  expect('sin sesión no se lee', 401, (await fetch(`${RTDB}/presence/${est.uid}.json?ns=demo-pokekatens-default-rtdb`)).status);

  console.log('EMULATOR_SMOKE_OK');
})().catch(e => fail('conexión con el emulador', 'respuesta', e && e.message));
