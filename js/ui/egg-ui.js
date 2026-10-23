/* ============ egg-ui.js — Incubadora y eclosión ============
 * La Incubadora va dentro de la Mochila (ui/shop-ui.js: bagHtml); aquí están
 * su HTML y la animación de abrir un huevo: tiembla cada vez más, se agrieta,
 * destello y aparece el Pokémon con su grito. La lógica es systems/eggs.js.
 */
G.EggUI = (() => {
  let el = null;

  function slotHtml(e) {
    if (!e) return `<div class="egg-slot empty"><span>${G.T('Hueco libre')}</span></div>`;
    const k = Math.min(1, e.done / e.need), ok = G.Eggs.ready(e);
    return `<div class="egg-slot${ok ? ' ready' : ''}">
        <img class="pix" src="${G.Eggs.img(e)}" alt="" draggable="false">
        <div class="bar"><i style="width:${Math.round(k * 100)}%"></i></div>
        <small>${ok ? `<b class="gold">${G.T('¡Listo!')}</b>` : `${Math.min(e.done, e.need).toLocaleString('es')} / ${e.need.toLocaleString('es')}`}</small>
        ${ok ? `<button class="btn small gold" data-hatch="${e.id}">${G.T('Abrir')}</button>` : ''}
      </div>`;
  }

  /** La sección de la Mochila: 3 huecos y los que esperan. */
  function incubatorHtml() {
    const l = G.Eggs.list(), inc = l.slice(0, G.Eggs.SLOTS), wait = l.slice(G.Eggs.SLOTS);
    let h = `<h3 style="margin:10px 0 6px">${G.Icons.html('egg', 18)} ${G.T('Incubadora')}</h3>
      <p class="sub" style="margin:0 0 8px">${G.T('Los huevos se abren derrotando enemigos (también los de tu grupo). Salen de algunas misiones semanales, del gacha (cada 10 tiradas ×10 en un banner) y, a veces, de un legendario.')}</p>
      <div class="egg-row">`;
    for (let i = 0; i < G.Eggs.SLOTS; i++) h += slotHtml(inc[i]);
    h += '</div>';
    if (wait.length) {
      h += `<p class="sub" style="margin:6px 0">${G.T('Esperando hueco:')} ${wait.map(e => `<img class="pix egg-mini" src="${G.Eggs.img(e)}" alt="">`).join(' ')}</p>`;
    }
    return h;
  }

  function wire(box, after) {
    box.querySelectorAll('[data-hatch]').forEach(b => { b.onclick = () => hatch(b.dataset.hatch, after); });
  }

  // ---------------- eclosión ----------------

  function build() {
    el = document.createElement('section');
    el.id = 'scr-hatch';
    el.className = 'scr dim hidden';
    el.innerHTML = `<div class="box hatch-box">
        <div class="hatch-stage"><img class="pix hatch-egg" alt="" draggable="false"><canvas class="hatch-cracks" width="64" height="64"></canvas>
          <div class="hatch-flash"></div><div class="hatch-mon"></div></div>
        <h3 class="hatch-title"></h3><p class="sub center hatch-sub"></p>
        <button class="btn gold hidden hatch-ok">${G.T('¡Genial!')}</button></div>`;
    document.body.appendChild(el);
  }

  const wait = ms => new Promise(r => setTimeout(r, ms));

  /** Grietas que crecen desde arriba (k de 0 a 1) sobre el huevo. */
  function cracks(cv, k, seed) {
    const c = cv.getContext('2d');
    c.clearRect(0, 0, 64, 64);
    c.strokeStyle = '#1b1528'; c.lineWidth = 2; c.lineCap = 'square';
    let r = seed;
    const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
    for (let b = 0; b < 3; b++) {
      let x = 20 + b * 12 + rnd() * 6, y = 14 + rnd() * 6;
      c.beginPath(); c.moveTo(x, y);
      const steps = Math.floor(2 + k * 6);
      for (let i = 0; i < steps; i++) { x += (rnd() - 0.5) * 12; y += 4 + rnd() * 4; c.lineTo(Math.round(x), Math.round(y)); }
      c.stroke();
    }
  }

  async function hatch(id, after) {
    const e = G.Eggs.list().find(x => x.id === id);
    if (!e || !G.Eggs.ready(e)) return;
    if (!el) build();
    const egg = el.querySelector('.hatch-egg'), cv = el.querySelector('.hatch-cracks'), flash = el.querySelector('.hatch-flash');
    const mon = el.querySelector('.hatch-mon'), ok = el.querySelector('.hatch-ok');
    egg.src = G.Eggs.img(e); egg.style.opacity = 1; egg.style.transform = '';
    mon.innerHTML = ''; cv.getContext('2d').clearRect(0, 0, 64, 64);
    el.querySelector('.hatch-title').textContent = G.T('¡Oh! ¡El huevo se mueve!');
    el.querySelector('.hatch-sub').textContent = '';
    ok.classList.add('hidden');
    el.classList.remove('hidden');
    // Tiembla cada vez más (unos 2,4 s) y se agrieta.
    const t0 = performance.now(), seed = id.length * 977 + e.dex;
    await new Promise(res => {
      (function step() {
        const t = (performance.now() - t0) / 2400;
        if (t >= 1) return res();
        const amp = 2 + t * 9, a = Math.sin(t * 60) * amp;
        egg.style.transform = `rotate(${a.toFixed(1)}deg)`;
        cv.style.transform = egg.style.transform;
        if (t > 0.35) cracks(cv, (t - 0.35) / 0.65, seed);
        if (Math.random() < 0.08) G.Audio.sfx('shake');
        requestAnimationFrame(step);
      })();
    });
    // Destello y nace.
    const r = G.Eggs.hatch(id);
    flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
    G.Audio.sfx(r && r.shiny ? 'shinyGet' : 'burst', { rarity: (G.DEX_BY[e.dex] || {}).rarity || 1 });
    await wait(180);
    egg.style.opacity = 0; cv.getContext('2d').clearRect(0, 0, 64, 64);
    if (!r) { el.classList.add('hidden'); return; }
    mon.appendChild(G.UI.spriteCanvas(r.dex, 180, 150, { lively: true, scale: 3, hero: true, shiny: r.shiny }));
    G.Audio.cry(r.dex, { shiny: r.shiny });
    const name = G.DEX_BY[r.dex].name + (r.shiny ? ' shiny' : '');
    el.querySelector('.hatch-title').innerHTML = (r.shiny ? G.Icons.html('shiny', 18) + ' ' : '') + G.I18n.f('¡Ha nacido {x}!', name);
    el.querySelector('.hatch-sub').innerHTML = r.isNew ? G.T('Ya está en tu colección.')
      : G.I18n.f('Ya lo tenías: +{x} monedas', r.refund);
    G.UI.refreshCoins();
    ok.classList.remove('hidden');
    ok.onclick = () => { el.classList.add('hidden'); if (after) after(); };
  }

  return { incubatorHtml, wire, hatch };
})();
