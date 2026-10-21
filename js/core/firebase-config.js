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
// Proyecto pokekatens (21-10-2026): el de los dueños de PokeKatens, plan Spark gratuito,
// SIN Identity Platform. ¡No pulsar nunca "Actualizar a Identity Platform" en su consola!
// Para volver al emulador local, ver la configuración demo-pokekatens en la historia de git.
G.FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBeTptBPYoENMserV1tjFlOcSjl_6NvJOM',
  authDomain: 'pokekatens.firebaseapp.com',
  projectId: 'pokekatens',
  storageBucket: 'pokekatens.firebasestorage.app',
  messagingSenderId: '967159838142',
  appId: '1:967159838142:web:7696481f78de0b142135ef',
  databaseURL: 'https://pokekatens-default-rtdb.firebaseio.com'
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
