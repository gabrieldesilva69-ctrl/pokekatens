/* ============ noframe.js — el juego no se juega dentro de otras webs ============
 * Hay webs que meten el juego dentro de un marco (iframe) y ponen sus anuncios
 * alrededor. Si esta página está dentro de un marco de otra web, no arranca el
 * juego (main.js mira PS_FRAMED) y sale un aviso, sin enlaces. Un marco de la
 * misma web sí vale. Va en un archivo aparte (y no dentro del HTML) por la CSP.
 * Si algún día el juego se publica en un portal que lo mete en un marco
 * (itch.io, CrazyGames...), su dominio va en ALLOW.
 */
(function () {
  var ALLOW = [];
  if (window.top === window.self) return;
  var parent = '';
  try { parent = window.top.location.hostname; } catch (e) { /* de otra web: no se puede leer */ }
  if (parent === location.hostname) return;
  var anc = location.ancestorOrigins && location.ancestorOrigins[0];
  if (!parent && anc) { try { parent = new URL(anc).hostname; } catch (e) { /* sin origen */ } }
  if (parent && ALLOW.indexOf(parent) >= 0) return;
  window.PS_FRAMED = true;

  var lang = (window.PS_LOCALES && window.PS_LOCALES.lang) || document.documentElement.lang || 'en';
  var texts = {
    es: ['Esta página no se puede abrir dentro de otra web', 'PokeKatens no se juega dentro de otras webs.'],
    en: ['This page cannot be opened inside another website', 'PokeKatens cannot be played inside other websites.'],
    fr: ['Cette page ne peut pas être ouverte dans un autre site', 'PokeKatens ne se joue pas dans d’autres sites.'],
    it: ['Questa pagina non può essere aperta all’interno di un altro sito', 'PokeKatens non si gioca all’interno di altri siti.'],
    'pt-BR': ['Esta página não pode ser aberta dentro de outro site', 'PokeKatens não pode ser jogado dentro de outros sites.'],
    'zh-Hans': ['此页面无法在其他网站中打开', 'PokeKatens 不能在其他网站中游玩。'],
    'zh-Hant': ['此頁面無法在其他網站中開啟', 'PokeKatens 不能在其他網站中遊玩。']
  };
  var copy = texts[lang] || texts.en;

  function show() {
    var box = document.createElement('div');
    box.setAttribute('translate', 'no');
    box.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;' +
      'padding:16px;background:#0a1430;color:#fff;font:16px/1.5 system-ui,sans-serif;text-align:center';
    var inner = document.createElement('div');
    inner.style.cssText = 'max-width:440px';
    var h = document.createElement('h1');
    h.style.cssText = 'margin:0 0 12px;font-size:24px;color:#ffd84a';
    h.textContent = copy[0];
    var p = document.createElement('p');
    p.style.cssText = 'margin:0';
    p.textContent = copy[1];
    inner.appendChild(h); inner.appendChild(p);
    box.appendChild(inner);
    document.body.appendChild(box);
  }
  if (document.body) show();
  else document.addEventListener('DOMContentLoaded', show);
})();
