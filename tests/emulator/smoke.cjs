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

  console.log('EMULATOR_SMOKE_OK');
})().catch(e => fail('conexión con el emulador', 'respuesta', e && e.message));
