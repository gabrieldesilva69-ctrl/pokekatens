---
name: anadir-movimiento
description: Añade o ajusta un ataque (movimiento) de PokeKatens con sus textos en los 7 idiomas. Úsala cuando digan "añade el ataque X", "nuevo movimiento", "cambia el daño de" o "haz que X evolucione".
---

# Añadir o cambiar un movimiento

## When to use
- Un ataque nuevo para un tipo, un cambio de daño/recarga/alcance, o una evolución de ataque nueva.

## Steps
1. En `js/data/moves.js`, añade el objeto en la lista de su tipo, con el mismo formato que los demás:
   `{ id: 'thunder-shock', name: 'Impactrueno', type: 'electric', kind: 'projectile', desc: 'Descarga rapidísima que atraviesa varios enemigos.', cd: 0.40, dmg: 13, speed: 480, count: 1, spread: 0.08, pierce: 2, life: 1.1, size: 5 }`
   (el `id`, en inglés y con guiones; los números, según el `kind`: copia los de un ataque parecido).
   El `kind` decide cómo se comporta (lista al principio de `moves.js`; lo implementa `js/systems/combat.js`).
   Nunca cambies el `id` de un ataque que ya existe: las partidas guardadas lo usan.
2. Si evoluciona, añade su fila en `EVO` de `moves.js`: `'id': ['Nombre evolucionado', '<mejora>']`
   (la mejora es una de `hp`, `atk`, `spd`, `cd`, `def`, `rgn`, `mag`, `xp`).
3. Textos: el nombre y la descripción en inglés en `js/data/lang-en.js`; y una fila en `rows` de
   `js/data/lang-updates.js` con francés, italiano, portugués de Brasil, chino simplificado y tradicional.
   `node tools/build_langs.js --faltan` dice lo que falta por traducir.
4. Efectos visuales opcionales: `js/entities/fx.js` y `js/entities/vfx.js` (reutiliza los que ya hay
   siempre que puedas).
5. Novedades (skill `publicar-version`, paso 1) y gate.

## Verify
```bash
node tools/export_data.js          # expect: exit 0 — instancia todos los movimientos y sus evoluciones
node --test "tests/*.test.cjs"     # expect: exit 0 — incluida la cobertura de idiomas
node tools/build.js --sin-seo      # expect: exit 0
```

## Do not
- No dejes un texto en español sin su inglés y sus cinco traducciones: `tests/i18n.test.cjs` falla.
- No cambies los `id` existentes ni borres ataques que tengan las partidas guardadas.
- No metas dependencias nuevas para efectos: Canvas 2D y lo que ya hay.
