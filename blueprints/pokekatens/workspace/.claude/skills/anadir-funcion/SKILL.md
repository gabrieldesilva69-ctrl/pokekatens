---
name: anadir-funcion
description: Añade una función nueva al juego PokeKatens (pantalla, sistema, opción) respetando cómo está hecho. Úsala cuando digan "añade una pantalla", "nueva función", "quiero que el juego haga" o "añade una opción en Ajustes".
---

# Añadir una función al juego

## When to use
- Una pantalla o un menú nuevo, un sistema de juego nuevo, una opción de Ajustes, algo que se guarde.

## Steps
1. Decide dónde va: sistemas de juego en `js/systems/`, pantallas y menús en `js/ui/`, red en `js/net/`.
   Cada archivo es un módulo `G.Nombre = (() => { … return { … }; })();` sin `import`.
2. Si es un archivo nuevo, añádelo a `dev.html` dentro de `<!-- scripts:begin -->` … `<!-- scripts:end -->`,
   **después** de los módulos que usa. Si no está ahí, `tools/build.js` no lo mete en `js/app.min.js`.
3. HTML de pantallas nuevas en `dev.html` (nunca en `index.html`); estilos en `css/style.css`.
4. Textos visibles en español; su inglés en `js/data/lang-en.js`.
5. Si guarda datos en la nube: el campo tiene que caber en `firestore.rules` (cambia las reglas si no),
   añade un caso a `tests/emulator/` y pasa `node tools/emu.cjs "node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs"`.
   Recuerda que Firebase va en plan gratuito: nada de escrituras en bucle (mira los topes de 20 s de las reglas).
6. Una prueba en `tests/<nombre>.test.cjs` si la lógica se puede probar sin navegador.
7. Novedades (skill `publicar-version`, paso 1) y gate.

## Verify
```bash
node --test "tests/*.test.cjs"     # expect: exit 0
node tools/export_data.js          # expect: exit 0
node tools/build.js --sin-seo      # expect: exit 0
```

## Do not
- No toques `js/core/updater.js` ni cómo `tools/build.js` escribe `version.json`.
- No añadas servicios de pago, Google Sign-In ni nada que active Identity Platform.
- No añadas librerías ni frameworks al juego.
