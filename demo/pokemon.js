/* ============ pokemon.js — la sección «Detalles de los Pokémon» de la demo ============
 * Tres detalles pulidos, antes (izquierda) y ahora (derecha), con los sprites y el
 * animador reales del juego (G.Sprites). Lo de «ahora» lo pinta el código del juego:
 * G.Sprites.drawShadow y Animator.draw. Lo de «antes» ya no existe en el juego: aquí se
 * imita en dos líneas (la elipse suave y el fundido continuo) sólo para comparar.
 *
 *   ?familia=pokemon&captura=1   imagen fija de esta sección (tools/capturas-demo.cjs)
 */
window.DemoPokemon = (() => {
  const Z = 3, W = 400, ROW = 78, DEX = [25, 6, 143];
  const FILAS = [
    ['Sombra bajo los pies', 'elipse suave de canvas', 'elipse a escalones de píxel, pintada una vez'],
    ['Aparición', 'salen de golpe', 'destello blanco de una décima de segundo'],
    ['Desaparición al caer', 'fundido continuo', 'se apagan en tres escalones']
  ];
  const escalon = k => (k > 0.66 ? 1 : k > 0.33 ? 0.66 : k > 0 ? 0.33 : 0);

  function crear(canvas) {
    const ctx = canvas.getContext('2d');
    canvas.width = W * Z; canvas.height = (FILAS.length * ROW + 4) * Z;
    const anims = DEX.map(d => new G.Sprites.Animator(d));
    let t = 0, raf = 0, fijo = null;

    const sombraVieja = (dex, x, y) => {
      const m = G.Sprites.meta(dex), rx = [5, 8, 12][Math.max(0, Math.min(2, m ? m.s : 1))] * G.Sprites.PX;
      ctx.fillStyle = 'rgba(0,0,0,.34)';
      ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.42, 0, 0, 6.2832); ctx.fill();
    };

    function pinta(dt) {
      t += dt;
      for (const a of anims) a.update(dt);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const c = (t % 2.4) / 2.4;                       // ciclo de aparecer y caer
      FILAS.forEach((f, i) => {
        const y0 = i * ROW, ci = fijo ? fijo[i] || c : c;
        for (const lado of [0, 1]) {
          const x0 = lado * (W / 2 + 2);
          ctx.setTransform(Z, 0, 0, Z, 0, 0);
          ctx.imageSmoothingEnabled = false;
          for (let y = 14; y < ROW; y += 16) for (let x = 0; x < W / 2 - 2; x += 16) {
            ctx.fillStyle = ((x + y - 14) / 16) & 1 ? '#3f6b46' : '#3a6341';
            ctx.fillRect(x0 + x, y0 + y, Math.min(16, W / 2 - 2 - x), Math.min(16, ROW - y));
          }
          DEX.forEach((dex, k) => {
            const x = x0 + 36 + k * 62, y = y0 + ROW - 12, a = anims[k];
            let alpha = 1, flash = false, hay = true;
            if (i === 1) { hay = ci > 0.25; flash = lado === 1 && ci > 0.25 && ci < 0.25 + 0.1 / 2.4; }
            if (i === 2) { const k0 = Math.max(0, 1 - Math.max(0, ci - 0.35) / 0.4); alpha = lado ? escalon(k0) : k0; }
            if (!hay || alpha <= 0) return;
            ctx.save();
            ctx.globalAlpha = alpha;
            if (lado === 0 && i === 0) sombraVieja(dex, x, y); else G.Sprites.drawShadow(ctx, dex, x, y, 1);
            a.draw(ctx, x, y, { flash, alpha });
            ctx.restore();
          });
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.textBaseline = 'middle';
        ctx.font = '700 14px "Segoe UI",system-ui,sans-serif';
        ctx.fillStyle = '#f4f1ea';
        ctx.fillText(f[0], 2, (y0 + 7) * Z);
        const w = ctx.measureText(f[0]).width;
        ctx.font = '12px "Segoe UI",system-ui,sans-serif';
        ctx.fillStyle = '#9aa3b5';
        ctx.fillText('antes: ' + f[1], w + 14, (y0 + 7) * Z + 1);
        ctx.fillStyle = '#ffd84a';
        ctx.fillText('ahora: ' + f[2], (W / 2 + 2) * Z + 2, (y0 + 7) * Z + 1);
      });
    }

    function correr() {
      let last = performance.now();
      const f = now => { pinta(Math.min(0.05, (now - last) / 1000)); last = now; raf = requestAnimationFrame(f); };
      raf = requestAnimationFrame(f);
    }
    /** Imagen fija: a mitad del destello y del apagado, repintando hasta que carguen los sprites. */
    function foto() { fijo = { 1: 0.27, 2: 0.55 }; pinta(0); let n = 0; const id = setInterval(() => { pinta(0); if (++n > 40) clearInterval(id); }, 100); }
    return { correr, foto, parar() { cancelAnimationFrame(raf); } };
  }
  return { crear };
})();
