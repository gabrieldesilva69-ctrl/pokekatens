---
description: Convenciones del código del juego (scripts clásicos colgados de G, dev.html como fuente)
paths:
  - "js/**/*.js"
  - "dev.html"
  - "css/**"
---

# Código del juego

- Cada módulo es un script clásico sin `import`/`export`: `G.Nombre = (() => { … return { … }; })();`.
- El orden de carga es el del bloque `<!-- scripts:begin -->` … `<!-- scripts:end -->` de `dev.html`;
  `tools/build.js` une los archivos en ese orden. Un archivo nuevo va en ese bloque, después de lo que usa.
- `js/core/fork-config.js` va justo antes de `js/core/firebase-config.js`; `G.FORK` es la única fuente de
  nombre, webs permitidas (`hosts`), repo, crédito (`upstream`), contacto y administradores.
- Se edita `dev.html`; `index.html`, `js/app.min.js`, `version.json` y `js/lang/*.js` los genera el build.
- `js/core/updater.js` no se toca.
- Comentarios y textos de la interfaz en español; los nuevos, con su inglés en `js/data/lang-en.js`.
- Nada de URLs de `pokesurvivor.com`, `github.com/JPTER78` escrito a mano en JS (usa `G.FORK.upstream`)
  ni de servicios de Google para iniciar sesión.
- La CSP de `dev.html` sólo permite scripts propios y de Firebase: no añadas orígenes nuevos.
- Prueba rápida: `node --test "tests/*.test.cjs"` y `node tools/build.js --sin-seo`.
