/* ============ seen.js — Pokédex de vistos y derrotados ============
 * (24-10-2026, docs/IDEAS-NUEVA-VERSION.md, apartado 6.)
 * Se apunta cada especie que aparece en la partida (vista) y cada una que cae
 * (derrotada), también en grupo. Se ve en la Colección (ui/menu.js) y da logros
 * (data/achievements.js).
 *
 * Guardado ligero: save.seen y save.beat son un mapa de bits en hexadecimal
 * (un bit por número de Pokédex, del 0 al MAX): ~260 caracteres cada uno. Al
 * juntar aparatos se unen (G.DB.merge → union). Lo frena firestore.rules (saneSave).
 */
G.Seen = (() => {
  const MAX = 1039;                       // 1040 bits = 260 caracteres
  const LEN = (MAX + 1) / 4;
  const memo = { seen: { src: null, bits: null }, beat: { src: null, bits: null } };

  /** Texto hexadecimal → bits (Uint8Array de 0/1). */
  function decode(hex) {
    const bits = new Uint8Array(MAX + 1);
    if (typeof hex !== 'string') return bits;
    for (let i = 0; i < Math.min(hex.length, LEN); i++) {
      const v = parseInt(hex[i], 16) || 0;
      for (let b = 0; b < 4; b++) if (v & (8 >> b)) bits[i * 4 + b] = 1;
    }
    return bits;
  }
  function encode(bits) {
    let out = '';
    for (let i = 0; i < LEN; i++) {
      const v = (bits[i * 4] << 3) | (bits[i * 4 + 1] << 2) | (bits[i * 4 + 2] << 1) | bits[i * 4 + 3];
      out += v.toString(16);
    }
    return out.replace(/0+$/, '');
  }
  /** Unión de dos textos (al juntar dos aparatos). */
  function union(a, b) {
    const x = decode(a), y = decode(b);
    for (let i = 0; i <= MAX; i++) x[i] |= y[i];
    return encode(x);
  }
  /** Sólo dígitos hexadecimales y de largo razonable (partida tocada a mano). */
  const clean = v => (typeof v === 'string' ? v.toLowerCase().replace(/[^0-9a-f]/g, '').slice(0, LEN) : '');

  function bitsOf(kind) {
    const s = G.DB.save, m = memo[kind];
    if (!s) return null;
    if (m.src !== s[kind] || !m.bits) { m.bits = decode(s[kind]); m.src = s[kind]; }
    return m.bits;
  }
  /** Lo apunta; sólo toca la partida si es nuevo (pasa pocas veces). */
  function mark(kind, dex) {
    dex = +dex;
    if (!(dex > 0 && dex <= MAX)) return;
    const bits = bitsOf(kind);
    if (!bits || bits[dex]) return;
    bits[dex] = 1;
    const s = G.DB.save;
    s[kind] = memo[kind].src = encode(bits);
  }

  const seen = dex => { const b = bitsOf('seen'); return !!(b && b[+dex]); };
  const beat = dex => { const b = bitsOf('beat'); return !!(b && b[+dex]); };
  /** Cuántos de los del juego (de una lista de G.DEX, o todos). */
  function count(kind, list = G.DEX) {
    const b = bitsOf(kind);
    return b ? list.filter(p => b[p.dex]).length : 0;
  }

  return {
    MAX, decode, encode, union, clean, seen, beat, count,
    /** Ha aparecido en la partida (enemigo, jefe, legendario de grieta, shiny...). */
    onSpawn(dex) { mark('seen', dex); },
    /** Ha caído: cuenta como visto y derrotado. */
    onKill(dex) { mark('seen', dex); mark('beat', dex); }
  };
})();
