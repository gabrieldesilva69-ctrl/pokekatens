/* ============ funding.js — donaciones ============
 * PokeKatens es gratis y sin ánimo de lucro: no acepta donaciones. Por eso
 * todo va vacío y el botón "Apoyar en Ko-fi" no sale nunca.
 *
 *   kofi      usuario de Ko-fi (vacío = el botón no sale)
 *   sponsors  usuario de GitHub Sponsors (vacío)
 *   costs     gastos [concepto, euros al mes] (ninguno)
 */
G.Funding = {
  kofi: '',
  sponsors: '',
  costs: [],
  get url() { return this.kofi ? 'https://ko-fi.com/' + this.kofi : ''; }
};
