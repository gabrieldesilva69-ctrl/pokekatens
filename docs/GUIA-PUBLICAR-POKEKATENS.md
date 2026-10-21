# Guía para publicar PokeKatens

Esta guía es para los dueños de PokeKatens, aunque no programéis. Cada comando va en su propio
bloque: cópialo y pégalo en **Git Bash**, abierto en la carpeta del juego. Donde pone `<usuario>`,
escribe vuestro nombre de usuario de GitHub (sin los signos `<` y `>`).

Sigue los apartados en orden. Los del 3 al 9 sólo se hacen una vez; el 8 se repite cada vez que
publiquéis algo nuevo.

---

## 1. Qué es cada cosa

- **GitHub**: donde vive el código del juego. También sirve la web gratis (GitHub Pages), en
  `https://<usuario>.github.io/pokekatens/`.
- **Firebase**: el servicio de Google que guarda las cuentas, las partidas, el ranking, los amigos y
  las salas del cooperativo. Usaréis el plan gratuito.
- **El `.exe`**: un programa para Windows que abre una ventana con la web del juego. No lleva el
  juego dentro: cuando publicáis una versión nueva, también se actualiza solo.

---

## 2. Antes de empezar: Java 21 y Modo de programador

Las dos cosas se instalan **antes** de lanzar la construcción (`/architect-next`): el primer paso las
comprueba y se para si falta alguna.

**Modo de programador.** Lo necesita el instalador `.exe`. En Windows:
Configuración → Sistema → Para programadores → **Modo de programador** → activado.

**Java 21.** Sólo hace falta para las pruebas en vuestro ordenador (el emulador de Firebase). Los
jugadores no lo necesitan. Se instala con este comando (pide permiso de administrador):

> Verificar antes de instalar: comprobad que el comando es exactamente este.

```bash
winget install --id EclipseAdoptium.Temurin.21.JDK -e --silent --accept-package-agreements --accept-source-agreements
```

Después, **cierra y vuelve a abrir Git Bash** y comprueba que lo encuentra:

```bash
node tools/emu.cjs --check-java
```

Tiene que decir algo como `Java 21 en ...`. Si dice `Falta Java 21`, repite la instalación.

---

## 3. Cuenta y repositorio de GitHub

1. Crea una cuenta en https://github.com/signup (si no la tenéis).
2. Crea un repositorio nuevo: botón **New**, nombre `pokekatens`, **Public**, y **sin** marcar
   «Add a README file».
3. Conecta vuestra copia del juego con ese repositorio. El primer comando guarda la dirección del
   juego original con el nombre `upstream` (sólo para consultarlo: nunca se sube nada allí):

```bash
git remote rename origin upstream
```

```bash
git remote add origin https://github.com/<usuario>/pokekatens.git
```

```bash
git push -u origin main
```

4. Activa la web: en el repositorio, **Settings → Pages**. En «Branch» elige `main` y la carpeta
   `/ (root)`, y pulsa **Save**. En unos minutos la web estará en
   `https://<usuario>.github.io/pokekatens/`.

---

## 4. Proyecto de Firebase

1. Entra en https://console.firebase.google.com con una cuenta de Google y pulsa **Crear un proyecto**.
   Ponle un nombre (por ejemplo `pokekatens`). **No** actives Google Analytics. El plan es **Spark**
   (gratis).
2. **Authentication** → Comenzar → **Método de acceso** → activa **Correo electrónico/contraseña**
   (sólo la primera opción, sin «Vínculo de correo electrónico»).
3. **Firestore Database** → Crear base de datos → **modo de producción** → elige una ubicación de
   Europa.
4. **Realtime Database** → Crear base de datos → la misma zona → modo bloqueado.

> ## ⚠️ MUY IMPORTANTE
>
> **No pulséis nunca «Actualizar a Identity Platform»**, ni nada que lo active: funciones de
> bloqueo, autenticación en dos pasos (MFA) o «Actualizar para habilitar». **Identity Platform cobra
> por cada usuario.** Con el plan gratuito normal, las cuentas no tienen límite.

---

## 5. Conectar el juego con vuestro Firebase

1. En Firebase: ⚙️ **Configuración del proyecto** → «Tus apps» → icono **</>** (web). Ponle un nombre
   y pulsa **Registrar app** (no hace falta Firebase Hosting).
2. Te enseña un bloque `firebaseConfig = { ... }`. Copia esos valores en `js/core/firebase-config.js`,
   dentro de `G.FIREBASE_CONFIG`, **sin** la línea `emulator: true` y **con** `databaseURL` (está en
   Realtime Database, arriba: empieza por `https://` y acaba en `firebaseio.com` o
   `firebasedatabase.app`).
3. En `js/core/fork-config.js`:
   - `site: 'https://<usuario>.github.io/pokekatens/'`
   - añade `'<usuario>.github.io'` a la lista `hosts`
   - `repo: 'https://github.com/<usuario>/pokekatens'`
4. En `.firebaserc`, cambia `demo-pokekatens` por el **id** de vuestro proyecto (sale en
   Configuración del proyecto → «ID del proyecto»).
5. En Firebase: **Authentication → Configuración → Dominios autorizados** → **Agregar dominio** →
   `<usuario>.github.io`.

---

## 6. Subir las reglas

Las reglas son las que protegen las partidas: sin ellas, la base de datos no deja hacer nada.
Primero, inicia sesión en Firebase desde Git Bash (se abre el navegador):

```bash
npx --yes firebase-tools@15.34.0 login
```

Y después súbelas:

```bash
npx --yes firebase-tools@15.34.0 deploy --only firestore:rules,firestore:indexes,database
```

Cada vez que cambiéis `firestore.rules` o `database.rules.json`, hay que repetir este último comando.

---

## 7. Primera cuenta y administrador

El administrador puede ver los reportes del ranking y banear tramposos. Al principio no hay ninguno.

1. Publica la web (apartado 8), entra en `https://<usuario>.github.io/pokekatens/` y crea vuestra
   cuenta con nombre y contraseña.
2. En Firebase: **Authentication → Usuarios**. Copia el **UID** de vuestra cuenta (una cadena larga de
   letras y números).
3. En `js/core/fork-config.js`, ponlo en `admins`: `admins: ['<UID>']`.
4. En `firestore.rules`, cambia la línea `function admin() { return false; }` por:
   `function admin() { return signedIn() && me() in ['<UID>']; }`
5. Vuelve a subir las reglas (el último comando del apartado 6) y publica (apartado 8).

---

## 8. Publicar una versión

Cada vez que cambiéis algo del juego:

```bash
node --test "tests/*.test.cjs"
```

```bash
node tools/build.js --sin-seo
```

```bash
git add -A
```

```bash
git commit -m "<qué cambia>"
```

```bash
git push
```

Si el primer comando dice algún `fail`, no sigas: algo se ha roto. En el mensaje del commit no pongáis
firmas de IA. En unos **5 minutos** todos los jugadores (en la web y en el `.exe`) pasan solos a la
versión nueva; si alguien está en plena partida, cambia al volver al menú.

---

## 9. El `.exe`

1. En `desktop/package.json`, dentro de `pokekatens`, pon la dirección de vuestra web:
   `"url": "https://<usuario>.github.io/pokekatens/"`
2. Instala lo que necesita y construye el instalador:

```bash
npm ci --prefix desktop
```

```bash
npm --prefix desktop run dist
```

3. Compruébalo tal como lo abrirán los amigos (sin servidor local ni dirección a mano):

```bash
node tools/desktop-smoke.cjs --exe desktop/dist/win-unpacked/PokeKatens.exe --default
```

   Tiene que decir `DESKTOP_SMOKE_OK default`.
4. Comparte el archivo `desktop/dist/PokeKatens-Setup-1.0.0.exe` (por Google Drive o Discord).
   El instalador **no** se sube a GitHub.

Sólo hay que rehacer el `.exe` si cambia algo de la carpeta `desktop/`. Los cambios del juego
llegan solos.

---

## 10. Sin internet

La primera vez, el programa necesita internet. Si no lo hay, sale la pantalla **«Sin conexión»** con
el botón **Reintentar**.

Después de haber cargado el juego una vez, el programa guarda una copia (el *service worker*,
`sw.js`). Sin internet abre esa copia: se ve el juego, pero sin cuentas, ranking ni cooperativo
hasta que vuelva la conexión.

---

## 11. El aviso de Windows (SmartScreen)

El programa no está firmado (firmarlo cuesta dinero), así que al instalarlo Windows dice
**«Windows protegió su PC»**. Para seguir: pulsa **Más información** → **Ejecutar de todas formas**.

Algún antivirus también puede avisar. Es normal en programas sin firma.

---

## 12. Cooperativo

El cooperativo conecta a los jugadores directamente, sin pasar por un servidor. En algunas redes
(datos móviles, algunos routers con CGNAT) dos jugadores no pueden conectarse entre sí y no pueden
jugar juntos.

No hay arreglo gratuito: haría falta un servidor TURN, que es de pago.

---

## 13. Si alguien olvida la contraseña

No hay correo de recuperación. Lo más fácil es crear otra cuenta con otro nombre.

Si queréis liberar el nombre antiguo para que se pueda volver a usar:
1. Firebase → **Authentication → Usuarios** → borra ese usuario.
2. Firebase → **Firestore** → colección `names` → borra el documento de ese nombre (en minúsculas).

---

## 14. Opcional: proteger la clave de la API

La configuración de Firebase es pública (va en la web), pero podéis limitar desde qué web se usa:
Google Cloud (https://console.cloud.google.com) → vuestro proyecto → **APIs y servicios →
Credenciales** → la clave «Browser key» → Restricciones de aplicaciones → **Sitios web** → añade
`https://<usuario>.github.io/*`.

---

## 15. Obligaciones de la licencia

PokeKatens es una copia de PokéSurvivor, de JPTER78, bajo la licencia PolyForm Noncommercial 1.0.0.
Para cumplirla:

- **No cobréis nada**: ni el juego, ni el `.exe`, ni anuncios, ni donaciones.
- **Mantened** los archivos `LICENSE` y `LICENSE-NONCOMMERCIAL.md` y la línea *Required Notice*
  del README: `Required Notice: Copyright 2026 JPTER78 (https://github.com/JPTER78/pokesurvivor)`.
- **Mantened el crédito visible** a JPTER78 (en la pantalla de entrada, en Ajustes y en el aviso
  legal): `Basado en PokéSurvivor de JPTER78 · versión no oficial y sin ánimo de lucro`.
