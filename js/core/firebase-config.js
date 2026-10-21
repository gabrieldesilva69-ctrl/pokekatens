/* ============ firebase-config.js — conexión con tu proyecto de Firebase ============
 * Pega aquí la configuración de tu app web de Firebase (Consola de Firebase >
 * Configuración del proyecto > Tus apps > SDK setup and configuration > Config).
 * Los pasos completos están en docs/FIREBASE.md.
 *
 * Estos datos NO son secretos: Firebase los diseña para ir en la web. Lo que
 * protege las partidas son las reglas de Firestore (firestore.rules).
 *
 * Si se pone a null, el juego funciona en modo local (sólo en el navegador).
 */
// Configuración del EMULADOR local de Firebase (proyecto demo-pokekatens): durante la
// construcción ningún paso toca servidores reales. La lista de lanzamiento (§20.1 del
// plan) la cambia por la del proyecto real de PokeKatens.
G.FIREBASE_CONFIG = {
  apiKey: 'demo-pokekatens-key',
  authDomain: 'demo-pokekatens.firebaseapp.com',
  projectId: 'demo-pokekatens',
  storageBucket: 'demo-pokekatens.appspot.com',
  messagingSenderId: '0',
  appId: '1:0:web:0',
  databaseURL: 'http://127.0.0.1:9000?ns=demo-pokekatens',
  emulator: true
};

/* Ejemplo de cómo debe quedar:
G.FIREBASE_CONFIG = {
  apiKey: 'AIza...',
  authDomain: 'tu-proyecto.firebaseapp.com',
  projectId: 'tu-proyecto',
  storageBucket: 'tu-proyecto.firebasestorage.app',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:abc123'
};
*/
