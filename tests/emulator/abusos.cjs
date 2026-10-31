// Reglas de Firestore (firestore.rules) contra el emulador: lo de la revisión del 28-10-2026
// (docs/REVISION-2026-10-28.md, R1, R2, R4, R5 y, desde el 31-10-2026, A1, R6 y R9).
//   node tools/emu.cjs "node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs && node tests/emulator/salas.cjs && node tests/emulator/perfil.cjs && node tests/emulator/abusos.cjs"
// Lo que hace el juego tiene que pasar; llenar la base de datos (tablas inventadas, textos
// enormes), reportar marcas que no existen o librarse del baneo sin partida en la nube, no.
const assert = require('node:assert/strict');
const HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const P = 'demo-pokekatens', DOCS = `projects/${P}/databases/(default)/documents`;
const A = 'userAAAAAAAAAAAAAAAAAAAAAAA1', B = 'userBBBBBBBBBBBBBBBBBBBBBBB2', X = 'attackerXXXXXXXXXXXXXXXXXXX4';
// El admin de firestore.rules (js/core/fork-config.js, G.FORK.admins).
const ADMIN = 'KNDXBqVVroOtaofexPunuc5aocw1';

// Token sin firmar: el emulador lo acepta (sólo pruebas).
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const token = uid => { const t = Math.floor(Date.now() / 1000);
  return b64({ alg: 'none', typ: 'JWT' }) + '.' + b64({ iss: 'https://securetoken.google.com/' + P, aud: P, sub: uid, user_id: uid,
    iat: t, exp: t + 3600, auth_time: t, firebase: { sign_in_provider: 'password' } }) + '.'; };
async function commit(who, writes) {
  const r = await fetch(`http://${HOST}/v1/${DOCS}:commit`, { method: 'POST',
    headers: { Authorization: 'Bearer ' + (who ? token(who) : 'owner'), 'content-type': 'application/json' }, body: JSON.stringify({ writes }) });
  return r.status;
}
const ok = async (who, w, what) => assert.equal(await commit(who, w), 200, 'debería poder: ' + what);
const no = async (who, w, what) => assert.notEqual(await commit(who, w), 200, 'NO debería poder: ' + what);

const str = v => ({ stringValue: v }), int = n => ({ integerValue: String(n) }), bool = b => ({ booleanValue: b });
const arr = vs => ({ arrayValue: { values: vs } }), map = f => ({ mapValue: { fields: f } });
const at = [{ fieldPath: 'at', setToServerValue: 'REQUEST_TIME' }];
const doc = (path, fields, transforms = at) => ({ update: { name: `${DOCS}/${path}`, fields }, updateTransforms: transforms });

const entry = (b, uid, t, nm = 'Ash') => doc(`lb/${b}/e/${uid}`, { t: int(t), uids: arr([str(uid)]), names: arr([str(nm)]),
  dex: arr([int(25)]), shiny: arr([bool(false)]), lv: int(10), kills: int(100), dmg: int(0) });
const top = (b, uid, t, nm = 'Ash') => doc(`lbs/${b}`, { me: str(uid), ev: str(''),
  top: map({ [uid]: map({ t: int(t), uids: arr([str(uid)]), names: arr([str(nm)]), dex: arr([int(25)]), lv: int(10), kills: int(100) }) }) }, []);
const report = (b, e, by, names = ['Ash']) => doc(`reports/${b}__${e}__${by}`, { board: str(b), e: str(e), names: arr(names.map(str)),
  t: int(600), by: str(by) });
const save = (uid, fields) => doc(`saves/${uid}`, { v: int(3), rev: int(0), save: map(fields) }, [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }]);
const names = (a, b, na, nb) => map({ [a]: str(na), [b]: str(nb) });
const friend = (from, to, nm) => {
  const users = [from, to].sort();
  return doc(`friendships/${users[0]}_${users[1]}`, { users: arr(users.map(str)), from: str(from), to: str(to), status: str('pending'),
    names: nm || names(from, to, 'Ash', 'Misty') });
};
const prof = (uid, nm, extra) => doc(`profiles/${uid}`, Object.assign({ name: str(nm), lower: str(nm.toLowerCase()) }, extra));

(async () => {
  await fetch(`http://${HOST}/emulator/v1/projects/${P}/databases/(default)/documents`, { method: 'DELETE' });
  await ok(null, [doc('names/ash', { uid: str(A) }, []), doc('names/xx_x', { uid: str(X) }, [])], 'preparar');

  // ---- R2: sólo las tablas del juego ----
  await ok(A, [entry('s_d20261028a', A, 600)], 'marca en la tabla de hoy');
  await ok(B, [entry('s_all4_p25', B, 700)], 'marca en el histórico de un Pokémon');
  await ok(B, [entry('s_cw2026-44a', B, 300)], 'marca del desafío semanal');
  await no(X, [entry('s_basura', X, 600)], 'marca en una tabla inventada');
  await no(X, [entry('s_d20261028a_x' + 'x'.repeat(50), X, 600)], 'marca en una tabla con cola');
  await no(X, [entry('z_d20261028a', X, 600)], 'marca en un modo que no existe');
  await no(X, [top('s_basura', X, 600)], 'resumen de una tabla inventada');

  // ---- R2: textos cortos ----
  await ok(A, [friend(A, B)], 'pedir amistad');
  await no(X, [friend(X, B, names(X, B, 'x'.repeat(500), 'Misty'))], 'amistad con un apodo enorme');
  await no(X, [friend(X, B, map({ [X]: str('x'), [B]: str('Misty'), basura: str('y') }))], 'amistad con apodos de más');
  await ok(A, [prof(A, 'Ash', { favs: arr([map({ dex: int(25), shiny: bool(true) })]), medals: arr([str('own10')]) })], 'perfil con favoritos y medallas');
  await no(X, [prof(X, 'xx_x', { favs: arr([str('x'.repeat(1000))]) })], 'favoritos que son textos');
  await no(X, [prof(X, 'xx_x', { medals: arr([str('x'.repeat(41))]) })], 'medalla de 41 letras');
  await ok(A, [save(A, { coins: int(500), name: str('Ash'), owned: map({ 25: map({ at: int(1) }) }) })], 'guardar la partida');
  const many = {}; for (let i = 0; i < 101; i++) many['k' + i] = int(1);
  await no(X, [save(X, many)], 'partida con 101 claves');
  await no(X, [save(X, { name: str('x'.repeat(25)) })], 'partida con un nombre enorme');

  // ---- A1, R6 y R9 (31-10-2026): topes de sobra en la partida, el perfil y los apodos ----
  await ok(B, [save(B, { coins: int(999999999), tickets: map({ t1: int(5000), t10: int(800) }) })], 'muchas monedas y tickets (de verdad)');
  await no(X, [save(X, { coins: int(2000000000) })], 'dos mil millones de monedas');
  await no(X, [save(X, { tickets: map({ t1: int(1000001) }) })], 'más de un millón de tickets ×1');
  await no(X, [save(X, { tickets: map({ t10: int(100001) }) })], 'más de cien mil tickets ×10');
  await ok(B, [doc('names/ñandú_9', { uid: str(B) }, [])], 'apodo con ñ y tilde (como VALID en social.js)');
  await ok(B, [prof(B, 'ñandú_9', { best: map({ solo: int(10800), kills: int(250000), level: int(400), medals: int(90) }) })], 'perfil con buenas marcas');
  await no(X, [prof(X, 'xx_x', { best: map({ kills: int(1000000001) }) })], 'perfil con mil millones de derrotados');
  await no(X, [prof(X, 'xx_x', { best: map({ solo: int(-5) }) })], 'perfil con un tiempo negativo');
  await no(X, [doc('names/a b"x', { uid: str(X) }, [])], 'apodo con espacios y comillas');
  await no(X, [doc('names/ab', { uid: str(X) }, [])], 'apodo de 2 letras');

  // ---- R4 y R5: reportes sólo de marcas que existen, en tablas del juego ----
  await ok(X, [report('s_d20261028a', A, X)], 'reportar una marca que existe');
  await no(X, [report('s_d20261028a', B, X)], 'reportar una marca que no existe (de otra persona)');
  await no(X, [report('zzz', A, X)], 'reportar en una tabla inventada');
  await no(B, [report('s_d20261028a', A, B, ['x'.repeat(25)])], 'reporte con un nombre de 25 letras');
  await no(B, [report('s_d20261028a', A, B, ['a', 'b', 'c', 'd', 'e'])], 'reporte con 5 nombres');

  // ---- R1: el baneo sin partida en la nube ----
  await no(X, [doc('bans/' + B, { name: str('Misty') })], 'banear sin ser el admin');
  await ok(ADMIN, [doc('bans/' + X, { name: str('xx_x') })], 'el admin banea a una cuenta sin partida');
  await no(ADMIN, [doc('bans/' + B, { name: str('x'), basura: str('y') })], 'baneo con campos de más');
  await no(X, [{ delete: `${DOCS}/bans/${X}` }], 'quitarse el baneo');
  await no(X, [entry('s_m202610a', X, 900, 'xx_x'), top('s_m202610a', X, 900, 'xx_x')], 'baneado sin partida: entrar en el top 50');
  await ok(ADMIN, [{ delete: `${DOCS}/bans/${X}` }], 'el admin le quita el baneo');
  await ok(X, [entry('s_m202610a', X, 900, 'xx_x'), top('s_m202610a', X, 900, 'xx_x')], 'sin baneo: entrar en el top 50');
  console.log('reglas de Firestore (abusos de la revisión del 28-10-2026): todo bien');
})().catch(e => { console.error(e.message); process.exit(1); });
