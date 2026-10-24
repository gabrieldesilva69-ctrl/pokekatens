/* ============ ranking.cjs — ranking y moderación contra el emulador ============
 * Se ejecuta dentro de los emuladores, en la misma sesión que smoke.cjs:
 *   node tools/emu.cjs "node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs"
 * (no termina en .test.cjs: node --test no lo lanza sin emuladores).
 * Nunca imprime tokens ni contraseñas: sólo códigos de respuesta.
 */
const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const KEY = 'demo-pokekatens-key';
const DOCS = 'http://127.0.0.1:8080/v1/projects/demo-pokekatens/databases/(default)/documents';

function fail(what, expected, got) {
  console.log(`EMULATOR_RANKING_FAIL ${what}: esperado ${expected}, recibido ${got}`);
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

/** Marca de una persona en la tabla de prueba s_test, con `t` segundos aguantados. */
function entry(user, t) {
  return {
    writes: [{
      update: {
        name: `projects/demo-pokekatens/databases/(default)/documents/lb/s_test/e/${user.uid}`,
        fields: {
          t: { integerValue: String(t) },
          uids: { arrayValue: { values: [{ stringValue: user.uid }] } },
          names: { arrayValue: { values: [{ stringValue: 'Tres' }] } },
          dex: { arrayValue: { values: [{ integerValue: '25' }] } },
          shiny: { arrayValue: { values: [{ booleanValue: false }] } },
          lv: { integerValue: '1' },
          kills: { integerValue: '0' }
        }
      },
      updateTransforms: [{ fieldPath: 'at', setToServerValue: 'REQUEST_TIME' }]
    }]
  };
}

// El admin de firestore.rules (js/core/fork-config.js, G.FORK.admins). El emulador acepta
// tokens sin firmar: así se prueba como esa cuenta sin conocer su contraseña.
const ADMIN = 'KNDXBqVVroOtaofexPunuc5aocw1';
function adminToken() {
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const t = Math.floor(Date.now() / 1000);
  return b64({ alg: 'none', typ: 'JWT' }) + '.' + b64({ iss: 'https://securetoken.google.com/demo-pokekatens',
    aud: 'demo-pokekatens', iat: t, exp: t + 3600, auth_time: t, sub: ADMIN, user_id: ADMIN,
    firebase: { sign_in_provider: 'password', identities: {} } }) + '.';
}

const commit = (user, body) => fetch(`${DOCS}:commit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + user.token },
  body: JSON.stringify(body)
});

(async () => {
  const tres = await signUp('tres@jugadores.pokekatens.invalid');

  expect('marca imposible (t = 2701)', 403, (await commit(tres, entry(tres, 2701))).status);
  expect('marca válida (t = 600)', 200, (await commit(tres, entry(tres, 600))).status);

  const r = await fetch(`${DOCS}/reports/nada`, { headers: { Authorization: 'Bearer ' + tres.token } });
  expect('un jugador sin permisos no lee reportes', 403, r.status);

  // ---- regalos del admin (gifts/{uid}/g) ----
  const admin = { token: adminToken(), uid: ADMIN };
  const gift = (who, to, id, fields, exists) => fetch(`${DOCS}:commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + who.token },
    body: JSON.stringify({ writes: [Object.assign({
      update: { name: `projects/demo-pokekatens/databases/(default)/documents/gifts/${to}/g/${id}`, fields },
      updateTransforms: [{ fieldPath: 'at', setToServerValue: 'REQUEST_TIME' }]
    }, exists === undefined ? {} : { currentDocument: { exists } })] })
  });
  const coins = n => ({ c: { integerValue: String(n) } });
  expect('un jugador no se regala a sí mismo', 403, (await gift(tres, tres.uid, 'r0', coins(500))).status);
  expect('el admin regala 500 monedas', 200, (await gift(admin, tres.uid, 'r1', coins(500), false)).status);
  expect('el admin no puede quitar monedas', 403, (await gift(admin, tres.uid, 'r2', coins(-500), false)).status);
  expect('un regalo no se cambia después', 403, (await gift(admin, tres.uid, 'r1', coins(900), true)).status);
  const mine = await fetch(`${DOCS}/gifts/${tres.uid}/g`, { headers: { Authorization: 'Bearer ' + tres.token } });
  expect('el jugador lee su buzón', 200, mine.status);
  const docs = (await mine.json()).documents || [];
  if (docs.length !== 1) fail('regalos en el buzón', 1, docs.length);
  console.log('ok un regalo en el buzón');
  const cuatro = await signUp('cuatro@jugadores.pokekatens.invalid');
  expect('otro jugador no lee ese buzón', 403, (await fetch(`${DOCS}/gifts/${tres.uid}/g`, { headers: { Authorization: 'Bearer ' + cuatro.token } })).status);

  // ---- regalos entre amigos (24-10-2026, js/net/social.js): un ticket al día a cada amigo ----
  const cinco = await signUp('cinco@jugadores.pokekatens.invalid');
  const seis = await signUp('seis@jugadores.pokekatens.invalid');
  const [u0, u1] = [cinco.uid, seis.uid].sort();
  const pid = u0 + '_' + u1;
  const fdoc = `projects/demo-pokekatens/databases/(default)/documents/friendships/${pid}`;
  const str = v => ({ stringValue: v });
  const names = { mapValue: { fields: { [cinco.uid]: str('cinco'), [seis.uid]: str('seis') } } };
  expect('cinco pide amistad a seis', 200, (await commit(cinco, { writes: [{
    update: { name: fdoc, fields: { users: { arrayValue: { values: [str(u0), str(u1)] } }, from: str(cinco.uid), to: str(seis.uid),
      status: str('pending'), names } },
    updateTransforms: [{ fieldPath: 'at', setToServerValue: 'REQUEST_TIME' }], currentDocument: { exists: false } }] })).status);
  const day = Math.floor(Date.now() / 864e5);
  const fgift = (who, to, d = day, extra = {}) => gift(who, to.uid, `f_${who.uid}_${d}`,
    Object.assign({ t1: { integerValue: '1' }, from: str(who.uid), name: str(who === cinco ? 'cinco' : 'seis'), day: { integerValue: String(d) } }, extra));
  expect('sin amistad aceptada no se regala', 403, (await fgift(cinco, seis)).status);
  expect('seis acepta', 200, (await commit(seis, { writes: [{
    update: { name: fdoc, fields: { status: str('ok') } }, updateMask: { fieldPaths: ['status'] },
    updateTransforms: [{ fieldPath: 'at', setToServerValue: 'REQUEST_TIME' }] }] })).status);
  expect('un ticket a un amigo', 200, (await fgift(cinco, seis)).status);
  expect('el mismo día, otra vez no', 403, (await fgift(cinco, seis)).status);
  expect('ni con el día de mañana', 403, (await fgift(cinco, seis, day + 1)).status);
  expect('ni más de un ticket', 403, (await fgift(seis, cinco, day, { t1: { integerValue: '5' } })).status);
  expect('ni monedas', 403, (await fgift(seis, cinco, day, { c: { integerValue: '100' } })).status);
  expect('ni con otro apodo', 403, (await fgift(seis, cinco, day, { name: str('admin') })).status);
  expect('ni a quien no es su amigo', 403, (await fgift(cinco, tres)).status);
  expect('ni a sí mismo', 403, (await fgift(cinco, cinco)).status);
  expect('el amigo también regala', 200, (await fgift(seis, cinco)).status);
  expect('quien regala no lee el buzón del otro', 403, (await fetch(`${DOCS}/gifts/${seis.uid}/g`, { headers: { Authorization: 'Bearer ' + cinco.token } })).status);
  const box = await fetch(`${DOCS}/gifts/${seis.uid}/g`, { headers: { Authorization: 'Bearer ' + seis.token } });
  expect('seis lee su buzón', 200, box.status);
  if (((await box.json()).documents || []).length !== 1) fail('regalos de amigos en el buzón', 1, '?');
  console.log('ok un regalo de amigo en el buzón');

  console.log('EMULATOR_RANKING_OK');
})().catch(e => fail('conexión con el emulador', 'respuesta', e && e.message));
