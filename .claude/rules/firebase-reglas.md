---
description: Firebase, reglas de seguridad y red del cooperativo
paths:
  - "firestore.rules"
  - "database.rules.json"
  - "firestore.indexes.json"
  - "firebase.json"
  - ".firebaserc"
  - "js/core/db.js"
  - "js/core/firebase-config.js"
  - "js/net/**"
  - "tests/emulator/**"
---

# Firebase y red

- Proyecto: el de los dueños de PokeKatens, plan Spark gratuito. Nunca Identity Platform (ni funciones de
  bloqueo, ni MFA, ni "Actualizar para habilitar"). Nunca el proyecto ni los servidores de JPTER78.
- Mientras `js/core/firebase-config.js` lleve `emulator: true`, el juego usa los emuladores locales
  (auth 9099, firestore 8080, database 9000, como en `firebase.json`).
- Las reglas son la seguridad real. Si cambias qué se guarda o quién lo lee, cambia `firestore.rules`
  y añade un caso a `tests/emulator/` (mismo estilo: códigos de respuesta, nunca tokens en la salida).
- Prueba: `node tools/emu.cjs "node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs"`
  (necesita Java 21; `node tools/emu.cjs --check-java` lo comprueba).
- Mantén los topes de escritura de las reglas (las llamadas a `every()`) y las cachés del juego: el plan gratuito tiene
  límites diarios de lecturas y escrituras.
- Administradores: `function admin()` en `firestore.rules` y `G.FORK.admins` deben tener los mismos UID.
- Cooperativo: WebRTC directo con los STUN de Google (`js/net/net.js`). No añadas TURN. El relé por la
  Realtime Database (sólo sin directo) lo decidieron los dueños el 25-10-2026: no quites su tope del mes
  (`RELAY_CAP_MB`, `relayUse/<AAAA-MM>` en `database.rules.json`) ni subas su ritmo (3 mensajes/s, `coop.js`).
- Las reglas se despliegan a mano (lista de lanzamiento / guía): `npx --yes firebase-tools@15.34.0 deploy --only firestore:rules,firestore:indexes,database`.
