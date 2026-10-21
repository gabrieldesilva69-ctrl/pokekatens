# PokeKatens — instrucciones para agentes

Versión no oficial, gratis y sin ánimo de lucro de PokéSurvivor (de JPTER78): web en GitHub Pages y
programa para Windows que abre esa web. La fuente completa de normas es `CLAUDE.md` en esta carpeta.

## Comandos

| Tarea | Comando |
|---|---|
| Pruebas | `node --test "tests/*.test.cjs"` |
| Comprobar datos | `node tools/export_data.js` |
| Construir (publicar) | `node tools/build.js --sin-seo` |
| Jugar en local | `node tools/serve.cjs` → http://127.0.0.1:8123/dev.html |
| Prueba de datos (emulador, Java 21) | `node tools/emu.cjs "node tests/emulator/smoke.cjs && node tests/emulator/ranking.cjs"` |
| Escritorio | `npm ci --prefix desktop` · `node tools/desktop-smoke.cjs` · `npm --prefix desktop run dist` |

**Gate:** `node --test "tests/*.test.cjs" && node tools/export_data.js && node tools/build.js --sin-seo`.

## No negociable

1. Editar `dev.html`, nunca `index.html` (se genera).
2. Commits sin ninguna firma de IA ("Co-Authored-By" incluido); `push` sólo cuando los dueños lo pidan.
3. Nunca activar Identity Platform ni ningún servicio de pago; nunca usar los servidores de JPTER78.
4. No tocar `js/core/updater.js` ni quitar la escritura de `version.json` en `tools/build.js`.
5. Mantener `LICENSE`, `LICENSE-NONCOMMERCIAL.md`, la línea *Required Notice* y el crédito a JPTER78; nunca cobrar.
6. Cada cambio de juego va en `js/data/changelog.js` (español e inglés) con sus traducciones en `js/data/lang-updates.js`.

Arquitectura, dónde vive cada cosa y recetas: `CLAUDE.md`.
