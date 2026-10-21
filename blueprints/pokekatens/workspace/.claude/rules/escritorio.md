---
description: App de escritorio (Electron) y sus herramientas de prueba
paths:
  - "desktop/**"
  - "tools/desktop-smoke.cjs"
  - "tools/serve.cjs"
---

# App de escritorio

- `desktop/` es el único sitio con `package.json`. Versiones exactas (sin `^`): cámbialas sólo a propósito,
  con `npm install --prefix desktop` y subiendo `desktop/package-lock.json`.
- La app no lleva el juego dentro: abre `pokekatens.url` de `desktop/package.json` (o `PK_URL`). Así se
  actualiza con cada publicación de la web; el `.exe` sólo se rehace si cambia `desktop/`.
- Seguridad de la ventana, sin excepciones: `contextIsolation: true`, `sandbox: true`,
  `nodeIntegration: false`, sin `preload`; ventanas nuevas → navegador del sistema y `deny`;
  navegación a otro origen → navegador del sistema.
- Marcas de prueba (no cambiar el texto, las leen las pruebas): `PK_SMOKE_OK`, `PK_SMOKE_OFFLINE`,
  `PK_SMOKE_TIMEOUT` (código 3), y en el arnés `DESKTOP_SMOKE_OK <modo>` (`online`, `offline`, `hang`, `default`).
- Pruebas: `node tools/desktop-smoke.cjs`, `--offline`, `--hang`, y tras `npm --prefix desktop run dist`,
  `--exe desktop/dist/win-unpacked/PokeKatens.exe` y `--exe desktop/dist/win-unpacked/PokeKatens.exe --default`
  (sin `PK_URL`: la URL de fábrica; con `http://127.0.0.1:8123/` necesita el puerto 8123 libre). Cada prueba
  usa un perfil nuevo (`PK_PROFILE`), por eso `--offline` mide el primer arranque sin conexión.
- `desktop/legal/` son copias exactas de `LICENSE` y `LICENSE-NONCOMMERCIAL.md`: si cambian, se vuelven a copiar.
- Sin firma de código (costaría dinero): el aviso de SmartScreen se explica en la guía, no se "arregla".
- `desktop/dist/` está en `.gitignore`: el instalador nunca se sube al repositorio.
