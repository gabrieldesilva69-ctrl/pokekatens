---
description: Diccionarios de idiomas y novedades
paths:
  - "js/data/lang-*.js"
  - "js/data/changelog.js"
  - "js/lang/**"
---

# Idiomas y novedades

- La clave de cada texto es el texto en español, carácter por carácter. Si cambias un texto español en el
  juego, su clave en los diccionarios deja de valer: añade la nueva (la vieja puede quedarse).
- Inglés en `js/data/lang-en.js`. Francés, italiano, portugués de Brasil, chino simplificado y tradicional:
  una fila nueva en `rows` de `js/data/lang-updates.js` (`[es, fr, it, pt-BR, zh-Hans, zh-Hant]`).
- `node tools/build_langs.js --faltan` lista lo que falta; `js/lang/*.js` se regenera al construir
  (no se edita a mano).
- Novedades: `js/data/changelog.js`, la fecha más nueva arriba, cada línea `[español, inglés]` en `new`,
  `chg` o `fix`. Va en la entrada de PokeKatens de hoy si ya existe; si no, en una entrada nueva al principio (nunca debajo de las de JPTER78). Nada de servidores ni costes.
- `tests/i18n.test.cjs` exige traducción en los cinco idiomas para cada línea de novedades con fecha
  `2026-10-18` o posterior, y que todo lo que tiene inglés lo tenga también en los otros idiomas.
- Respeta los marcadores `{x}` y `{name}`: mismo número en el original y en la traducción.
