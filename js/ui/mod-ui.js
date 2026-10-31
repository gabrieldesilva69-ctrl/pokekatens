/* ============ mod-ui.js — moderación del ranking (pantalla oculta) ============
 * Sólo la ve la cuenta de moderación (G.Ranking.isAdmin, y firestore.rules
 * admin(): aunque alguien abriera esta pantalla, el servidor no le dejaría
 * hacer nada). Se abre con el botón "Moderación" del ranking.
 *
 *   Reportes          marcas reportadas por los jugadores, las más reportadas
 *                     primero: borrar la marca, banear (no puede volver a
 *                     subir marcas, y se borra su marca de todas las tablas de
 *                     ahora) o descartar el reporte.
 *   Muy largas        las marcas de ahora de más de 33 min (casi imposibles con la Sentencia):
 *                     borrar o banear sin esperar a que alguien las reporte (31-10-2026).
 *   Baneados          las cuentas baneadas del ranking; se pueden desbanear.
 *   Regalos           dar monedas o tickets a un jugador por su apodo (sólo
 *                     sumar). Le llegan al buzón y los recibe al entrar.
 */
G.ModUI = (() => {
  const $ = G.UI.$;
  const esc = G.U.esc;
  let tab = 'rep';

  function init() {
    $('mod-back').onclick = () => G.RankingUI.open();
    $('mod-purge').onclick = async () => {
      if (!confirm('¿Quitar del ranking TODAS las marcas de más de 1 hora (todas las tablas)? No se puede deshacer.')) return;
      const b = $('mod-purge');
      b.disabled = true;
      try {
        const r = await G.Ranking.purgeAbove(3600, (i, n) => { b.textContent = 'Revisando ' + i + ' / ' + n + '…'; });
        G.UI.toast('Quitadas ' + r.rows + ' marcas de más de 1 hora (' + r.boards + ' tablas)', 5000);
      } catch (e) { G.UI.toast('No se pudo: ' + (e.code || e.message), 5000); }
      b.disabled = false; b.textContent = 'Quitar marcas de más de 1 hora';
      render();
    };
    document.querySelectorAll('#mod-tabs .tab').forEach(t => { t.onclick = () => { tab = t.dataset.tab; render(); }; });
  }

  function open() {
    if (!G.Ranking.isAdmin()) return;
    G.UI.show('scr-mod', true);
    render();
  }

  const fmt = t => G.U.mmss(t || 0);
  const btn = (label, cls, fn) => { const b = document.createElement('button'); b.className = 'btn small ' + cls; b.textContent = label; b.onclick = fn; return b; };

  async function render() {
    document.querySelectorAll('#mod-tabs .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === tab));
    const list = $('mod-list');
    list.innerHTML = '<p class="sub">Cargando…</p>';
    try {
      if (tab === 'rep') await renderReports(list);
      else if (tab === 'long') await renderLong(list);
      else if (tab === 'gift') renderGift(list);
      else await renderMarked(list);
    } catch (e) {
      list.innerHTML = '<p class="sub">No se pudo cargar (' + esc(e.code || e.message) + ').</p>';
    }
  }

  /** "s_w2026-42" -> "Solo · Semana" */
  function boardName(b) {
    const [m, p = ''] = String(b || '').split('_');
    const mode = m === 'g' ? 'Grupo' : 'Solo';
    const per = p.startsWith('d') ? 'Hoy' : p.startsWith('w') ? 'Semana' : p.startsWith('m') ? 'Mes' : 'Histórico';
    const dex = (b.match(/_p(\d+)$/) || [])[1];
    return mode + ' · ' + per + (dex && G.DEX_BY[dex] ? ' · sólo ' + G.DEX_BY[dex].name : '');
  }
  // Con la Sentencia de Arceus (minuto 30) casi nadie pasa de ~32-33 min.
  const SUSPECT_T = 33 * 60;

  async function renderReports(list) {
    const groups = await G.Ranking.reports();
    list.innerHTML = groups.length ? '' : '<p class="sub">No hay reportes.</p>';
    for (const g of groups) {
      const row = document.createElement('div');
      row.className = 'rk-row mod-row rep';
      const mode = g.board.startsWith('g_') ? 'g' : 's';
      // Lo que se ve de la marca ahora en su tabla (nivel, derrotados, Pokémon).
      const info = await G.Ranking.entryInfo(g.board, g.e).catch(() => null);
      const t = info ? info.t : g.t;
      const sus = t > SUSPECT_T;
      // Los nombres, de la marca (28-10-2026): los del reporte los escribe quien reporta y
      // podían ser de otro. Sin marca, el nombre del reporte sólo se enseña, entre comillas.
      const names = info ? info.names : g.names.map(n => '«' + n + '»');
      const mons = document.createElement('span');
      mons.className = 'mons';
      if (info) info.dex.forEach((d, i) => { if (G.DEX_BY[d]) mons.appendChild(G.UI.spriteCanvas(d, 44, 40, { scale: 1, shiny: !!(info.shiny || [])[i] })); });
      row.innerHTML = `<span class="pos" title="veces reportada">${g.n}×</span>`;
      row.appendChild(mons);
      row.insertAdjacentHTML('beforeend', `<span class="who"><b translate="no">${names.map(esc).join(' · ')}</b>
          <small>${esc(boardName(g.board))}${info ? ' · Nv. ' + (info.lv || 1) + ' · ' + (info.kills || 0).toLocaleString(G.I18n.locale) + ' derrotados' : ' · ya no está en el top 50'}</small>
          ${sus ? '<small class="mod-warn">Más de 33 min: casi imposible con la Sentencia de Arceus</small>' : ''}</span>
        <span class="time${sus ? ' mod-warn' : ''}">${fmt(t)}</span>`);
      const acts = document.createElement('span');
      acts.className = 'mod-acts';
      const busy = async (fn, msg) => {
        acts.querySelectorAll('button').forEach(b => { b.disabled = true; });
        try { await fn(); G.UI.toast(msg); row.remove(); }
        catch (e) { G.UI.toast('No se pudo: ' + (e.code || e.message)); acts.querySelectorAll('button').forEach(b => { b.disabled = false; }); }
      };
      acts.append(...[
        btn('Borrar marca', 'ghost', () => busy(async () => {
          await G.Ranking.removeEverywhere(g.e, mode, [], g.board);
          await G.Ranking.dismiss(g.ids);
        }, 'Marca borrada')),
        // Banear sólo si la marca sigue en su top 50: así se ve de quién es (sus uids y nombres).
        info && btn('Banear', 'danger', () => {
          if (!confirm('¿Banear a ' + info.names.join(', ') + '? No podrán volver a salir en el ranking y se borra su marca.')) return;
          busy(async () => {
            // (Si falla uno, se avisa: antes el error se perdía y salía «Baneado» igual.)
            for (let i = 0; i < info.uids.length; i++) await G.Ranking.setMarked(info.uids[i], true, info.names[i]);
            await G.Ranking.removeEverywhere(g.e, mode, [], g.board);
            await G.Ranking.dismiss(g.ids);
          }, 'Baneado');
        }),
        btn('Descartar', 'ghost', () => busy(() => G.Ranking.dismiss(g.ids), 'Reporte descartado'))
      ].filter(Boolean));
      row.appendChild(acts);
      list.appendChild(row);
    }
  }

  async function renderLong(list) {
    const rows = await G.Ranking.suspects(SUSPECT_T);
    list.innerHTML = rows.length ? '' : '<p class="sub">No hay marcas de más de 33 min en las tablas de ahora.</p>';
    for (const r of rows) {
      const mode = r.board.startsWith('g_') ? 'g' : 's';
      const row = document.createElement('div');
      row.className = 'rk-row mod-row rep';
      const mons = document.createElement('span');
      mons.className = 'mons';
      r.dex.forEach((d, i) => { if (G.DEX_BY[d]) mons.appendChild(G.UI.spriteCanvas(d, 44, 40, { scale: 1, shiny: !!(r.shiny || [])[i] })); });
      row.innerHTML = '<span class="pos"></span>';
      row.appendChild(mons);
      row.insertAdjacentHTML('beforeend', `<span class="who"><b translate="no">${r.names.map(esc).join(' · ')}</b>
          <small>${esc(boardName(r.board))} · Nv. ${r.lv || 1} · ${(r.kills || 0).toLocaleString(G.I18n.locale)} derrotados</small></span>
        <span class="time mod-warn">${fmt(r.t)}</span>`);
      const acts = document.createElement('span');
      acts.className = 'mod-acts';
      const busy = async (fn, msg) => {
        acts.querySelectorAll('button').forEach(b => { b.disabled = true; });
        try { await fn(); G.UI.toast(msg); row.remove(); }
        catch (e) { G.UI.toast('No se pudo: ' + (e.code || e.message)); acts.querySelectorAll('button').forEach(b => { b.disabled = false; }); }
      };
      acts.append(
        btn('Borrar marca', 'ghost', () => busy(() => G.Ranking.removeEverywhere(r.id, mode, [], r.board), 'Marca borrada')),
        btn('Banear', 'danger', () => {
          if (!confirm('¿Banear a ' + r.names.join(', ') + '? No podrán volver a salir en el ranking y se borra su marca.')) return;
          busy(async () => {
            for (let i = 0; i < r.uids.length; i++) await G.Ranking.setMarked(r.uids[i], true, r.names[i]);
            await G.Ranking.removeEverywhere(r.id, mode, [], r.board);
          }, 'Baneado');
        }));
      row.appendChild(acts);
      list.appendChild(row);
    }
  }

  async function renderMarked(list) {
    const accs = await G.Ranking.markedAccounts();
    list.innerHTML = accs.length ? '' : '<p class="sub">No hay cuentas baneadas.</p>';
    for (const a of accs) {
      const row = document.createElement('div');
      row.className = 'rk-row mod-row';
      row.innerHTML = `<span class="pos"></span>
        <span class="who"><b translate="no">${esc(a.name)}</b><small translate="no">${esc(G.I18n.f('{x} monedas · {x} tickets · {x} ×10 · {x} Pokémon', a.coins.toLocaleString(G.I18n.locale), a.t1, a.t10, a.owned))} · ${esc(a.uid)}</small></span>`;
      const acts = document.createElement('span');
      acts.className = 'mod-acts';
      acts.append(btn('Desbanear', 'ghost', async () => {
        try { await G.Ranking.setMarked(a.uid, false); G.UI.toast('Desbaneada'); row.remove(); }
        catch (e) { G.UI.toast('No se pudo: ' + (e.code || e.message)); }
      }));
      row.appendChild(acts);
      list.appendChild(row);
    }
  }

  function renderGift(list) {
    list.innerHTML = `<form id="gift-form" class="mod-gift" autocomplete="off">
        <p class="sub">Monedas o tickets de regalo para un jugador. Sólo se puede sumar; le llegan la próxima vez que entre al juego.</p>
        <label for="gift-nick">Apodo del jugador</label>
        <input id="gift-nick" class="field" maxlength="16" spellcheck="false" required>
        <label for="gift-c">Monedas</label>
        <input id="gift-c" class="field" type="number" min="0" max="1000000" step="1" value="0">
        <label for="gift-t1">Tickets</label>
        <input id="gift-t1" class="field" type="number" min="0" max="1000" step="1" value="0">
        <label for="gift-t10">Tickets ×10</label>
        <input id="gift-t10" class="field" type="number" min="0" max="1000" step="1" value="0">
        <p class="err" id="gift-err"></p>
        <div class="row"><button class="btn gold grow" id="gift-send" type="submit">Regalar</button></div>
      </form>`;
    const amount = (id, max) => { const v = Math.floor(+$(id).value || 0); return v >= 0 && v <= max ? v : NaN; };
    $('gift-form').onsubmit = async e => {
      e.preventDefault();
      const nick = $('gift-nick').value.trim();
      const g = { c: amount('gift-c', 1000000), t1: amount('gift-t1', 1000), t10: amount('gift-t10', 1000) };
      $('gift-err').textContent = '';
      if (![g.c, g.t1, g.t10].every(Number.isFinite)) { $('gift-err').textContent = 'Máximo: 1.000.000 monedas y 1.000 tickets de cada tipo.'; return; }
      if (!(g.c + g.t1 + g.t10)) { $('gift-err').textContent = 'Pon alguna cantidad.'; return; }
      if (!confirm(`¿Regalar a ${nick}: ${g.c} monedas, ${g.t1} tickets y ${g.t10} tickets ×10? No se puede deshacer.`)) return;
      $('gift-send').disabled = true;
      try {
        const uid = await G.Ranking.sendGift(nick, g);
        if (!uid) $('gift-err').textContent = 'No hay ningún jugador con ese apodo.';
        else { G.UI.toast('Regalo enviado a ' + nick, 4000); $('gift-form').reset(); }
      } catch (err) { $('gift-err').textContent = 'No se pudo: ' + (err.code || err.message); }
      $('gift-send').disabled = false;
    };
  }

  return { init, open };
})();
