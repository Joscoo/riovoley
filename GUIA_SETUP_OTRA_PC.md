# Guia de setup en otra computadora (Riovoley)

Esta guia explica como clonar o restaurar un respaldo y ejecutar el proyecto en una nueva PC.

La raiz de la web es `D:\Riovoley\riovoley`, donde estan `src/`, `public/`,
`android/` y el `package.json` principal. La subcarpeta `riovoley/` es otro
servicio auxiliar, no la aplicacion web. Conserva los cambios locales de Git.

## 1) Requisitos previos

- Git instalado
- Node.js 22 o superior para la web y Capacitor 8 (Node 24 compatible)
- npm (viene con Node)
- Acceso a las credenciales de entorno del proyecto

Los servicios auxiliares `functions/` y `riovoley/` declaran Node 22. Para la
web contra Supabase remoto no necesitas Java, Android Studio, Firebase CLI ni
una base de datos local. Requisitos oficiales de
[Capacitor](https://capacitorjs.com/docs/getting-started/environment-setup).

En PowerShell puedes usar `npm.cmd` y `npx.cmd` si los wrappers `.ps1` estan
bloqueados, sin cambiar la politica de ejecucion de Windows.

## 2) Clonar el repositorio

```bash
git clone URL_DEL_REPOSITORIO
cd riovoley
```

## 3) Instalar dependencias

```bash
npm.cmd ci --no-audit --no-fund
```

`npm ci` restaura las versiones de `package-lock.json` y sustituye
`node_modules/`. No borres los lockfiles ni uses `npm audit fix --force` para
restaurar. Un `node_modules/` copiado del respaldo no reemplaza este paso.

Si necesitas trabajar en los servicios auxiliares, usa Node 22 y restaura sus
lockfiles independientes desde la raiz:

```powershell
npm.cmd --prefix functions ci --no-audit --no-fund
npm.cmd --prefix riovoley ci --no-audit --no-fund
npm.cmd --prefix functions run build
```

Las Edge Functions desplegadas en Supabase estan en `supabase/functions/` y son
distintas de estos servicios Node. Restaurar la PC no requiere aplicar de nuevo
migraciones ni desplegar funciones.

## 4) Configurar variables de entorno

Este proyecto usa variables de entorno. No se debe compartir el archivo real con secretos.

1. Conservar `.env`, `.env.local`, `.env.production` y `.env.e2e` del respaldo.
   Crear archivo local desde la plantilla solo si falta:

```bash
# PowerShell
Set-Location .\riovoley   # solo si estas en C:\Riovoley
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

Alternativa (si prefieres la plantilla local):

```bash
# PowerShell
Set-Location .\riovoley   # solo si estas en C:\Riovoley
if (-not (Test-Path .env.local)) { Copy-Item .env.local.example .env.local }
```

2. Abrir `.env.local` y completar valores reales.

### Variables obligatorias para iniciar la app

- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_ANON_KEY

Para los datos personales cifrados tambien necesitas la
`REACT_APP_PII_ENCRYPTION_KEY` ORIGINAL. No generes otra para sustituirla: los
email y telefonos existentes requieren la clave con la que se guardaron.
No uses claves `service_role` en React.

CRA carga `.env.local` tambien al compilar para produccion, con prioridad sobre
`.env.production`. Revisa el entorno de destino antes de distribuir un build.

### Variables opcionales (funcionalidades WhatsApp)

- REACT_APP_WHATSAPP_ACCESS_TOKEN
- REACT_APP_WHATSAPP_PHONE_NUMBER_ID
- REACT_APP_WHATSAPP_BUSINESS_ACCOUNT_ID
- REACT_APP_CLUB_ADMIN_PHONE
- REACT_APP_CLUB_COACH_PHONE
- REACT_APP_CLUB_EMERGENCY_PHONE

## 5) Levantar el proyecto

```bash
npm.cmd start
```

La app abre en:

- http://localhost:3000

## 6) Comandos utiles

```bash
npm.cmd test -- --watchAll=false --runInBand
npm.cmd run test:contracts -- --watchAll=false --runInBand
npm.cmd run check:copy-quality
npm.cmd run build
npm.cmd run e2e:install
npm.cmd run e2e:smoke:public
```

Playwright necesita Chromium para los perfiles Desktop Chrome y WebKit para los
perfiles iPhone/iPad. Para todos los tamanos publicos:

```powershell
npx.cmd playwright test tests/e2e/responsive.smoke.spec.js --grep "public route responsive guard"
```

Para los paneles por rol, conserva o completa `.env.e2e` y ejecuta:

```powershell
npm.cmd run e2e:smoke:roles:strict
```

Este script carga `.env.e2e` y exige las seis variables de acceso; los demas
comandos Playwright no cargan ese archivo automaticamente. Ejecuta las pruebas
que crean o modifican registros solo contra un entorno de pruebas.

## 7) Problemas comunes

### Error por Supabase faltante

Si faltan REACT_APP_SUPABASE_URL o REACT_APP_SUPABASE_ANON_KEY, la app falla al iniciar.

Solucion:

1. Revisar `.env.local`
2. Confirmar que no haya espacios o comillas extras
3. Reiniciar el servidor con `npm start`

### Cambie variables y no impacta

Siempre reinicia el servidor de desarrollo cuando cambias variables de entorno.

### Error `Copy-Item` no encuentra `.env.local.example`

Si aparece una ruta como `C:\Riovoley\.env.local.example`, estas parado en la carpeta padre.

Solucion:

1. Ir a la carpeta del proyecto: `Set-Location C:\Riovoley\riovoley`
2. Verificar archivo: `Test-Path .env.local.example` (debe devolver `True`)
3. Ejecutar copia: `Copy-Item .env.local.example .env.local`

## 8) Reglas de seguridad para el equipo

- No subir secretos al repositorio
- No compartir `.env.local` por chat publico
- Compartir credenciales por un canal seguro (gestor de secretos)
- Mantener `.env.example` solo con placeholders o valores no sensibles

## 9) Flujo recomendado para colaborar

1. Crear rama nueva
2. Hacer cambios
3. Probar con `npm start` y, si aplica, `npm test`
4. Abrir Pull Request

---

## 10) Capacitor y Android despues de formatear

Las dependencias JavaScript de Capacitor se restauran con el `npm ci` principal.
Para revisar los plugins:

```powershell
npx.cmd cap ls
```

Para generar APK/AAB necesitas ademas Android Studio y el SDK. El proyecto usa
API 36 en [android/variables.gradle](android/variables.gradle). Instala la
plataforma API 36, Platform Tools y Build Tools desde SDK Manager. Android Studio
incluye su JDK.

Revisa `android/local.properties`: el `sdk.dir` respaldado puede apuntar a una
carpeta que ya no existe. Ajustalo a la ruta real del SDK de esta PC. Conserva:

- `android/app/google-services.json`, para Firebase y push.
- `android/app/my-release-key.keystore` y sus contrasenas, para firmar releases.

Con el entorno Android instalado:

```powershell
npm.cmd run mobile:sync
npm.cmd run mobile:android
```

Estos comandos regeneran assets y configuracion nativa. Los scripts
`ota:upload:*` publican en Capgo y no son parte de la restauracion local.

La falta del SDK no impide ejecutar la web. Consulta [README.md](README.md),
[README_DATABASE.md](README_DATABASE.md) y
[supabase/functions/](supabase/functions/) para el resto de la arquitectura.
