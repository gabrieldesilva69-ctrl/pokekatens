#!/usr/bin/env node
/* ============ check-tags.cjs — ¿están las 15 etiquetas de paso? ============
 * Comprueba que cada etiqueta de paso de la construcción de PokeKatens
 * (blueprints/pokekatens, mapa de pasos) existe y está en la historia de HEAD.
 * step-00-preparacion (la del Bootstrap) no cuenta.
 *
 *   node tools/check-tags.cjs   → «ETIQUETAS_OK 15» y 0, o la lista de las que faltan y 1
 */
const { execFileSync } = require('child_process');

const TAGS = [
  'step-01-config-fork', 'step-02-servidor-local', 'step-03-sin-google', 'step-04-sin-turn',
  'step-05-identidad', 'step-06-sin-seo', 'step-07-sin-donaciones', 'step-08-emulador',
  'step-09-reglas-admin', 'step-10-novedades', 'step-11-escritorio-base', 'step-12-sin-conexion',
  'step-13-instalador', 'step-14-normas-y-guia', 'step-15-version-final'
];

let ok = 0;
for (const tag of TAGS) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', tag, 'HEAD'], { stdio: 'ignore' });
    ok++;
  } catch (e) {
    console.log(`Falta la etiqueta ${tag} en la historia de HEAD`);
  }
}
if (ok === TAGS.length) console.log(`ETIQUETAS_OK ${ok}`);
process.exit(ok === TAGS.length ? 0 : 1);
