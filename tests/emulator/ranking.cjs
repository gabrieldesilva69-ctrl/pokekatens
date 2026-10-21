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

  console.log('EMULATOR_RANKING_OK');
})().catch(e => fail('conexión con el emulador', 'respuesta', e && e.message));
