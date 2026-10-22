# Revision y restauracion del entorno local - 2026-10-22

## Alcance

Revision de estructura, requisitos, dependencias, configuracion respaldada,
compilacion y pruebas para volver a trabajar tras formatear Windows. No es una
auditoria exhaustiva de cada flujo de negocio o de la base de datos remota.

## Estructura y herramientas

| Parte | Ubicacion | Funcion |
| --- | --- | --- |
| Web principal | Raiz, `src/`, `public/` | React 19, CRA 5, Tailwind 3 y React Router 7 |
| Logica de negocio | `src/features/` | 20 modulos por dominio con estructura Clean Lite |
| Componentes e infraestructura compartidos | `src/shared/` | UI, plataforma, gateways y utilidades |
| Backend remoto | Supabase | PostgreSQL, Auth, RLS y funciones desplegadas |
| Edge Functions | `supabase/functions/` | 9 funciones, mas modulos compartidos |
| Servicios Node auxiliares | `functions/`, `riovoley/` | Paquetes independientes de la web |
| Android | `android/` | Contenedor nativo Capacitor 8, SDK objetivo 36 |
| Pruebas | `src/**/*.test.js`, `tests/e2e/` | Jest/Testing Library y Playwright |

Herramientas detectadas: Node **24.18.0**, npm **11.16.0**, Git **2.56.0** y
Visual Studio Code. La web y Capacitor requieren Node 22 o superior. Los
servicios auxiliares declaran especificamente Node 22: npm avisa `EBADENGINE`
al instalarlos con Node 24. No se cambio la version global de Node.

## Restauracion realizada

- Reinstaladas las dependencias de los tres paquetes con `npm ci`, conservando
  sus `package-lock.json` y las versiones respaldadas.
- `npm ls --depth=0 --json` termina correctamente en los tres directorios y no
  informa dependencias invalidas ni faltantes.
- Instalados los navegadores de Playwright 1.59.1: Chromium, Firefox y WebKit.
  La instalacion uso el servidor alternativo oficial para WebKit al fallar el
  certificado del primero; no se desactivo la verificacion TLS.
- Verificados los siete plugins Android de Capacitor con `npx.cmd cap ls`.
- Comprobada conectividad de Supabase: `GET /auth/v1/settings` con la clave
  publica respaldada respondio **HTTP 200**. Esto verifica disponibilidad y
  configuracion basica; no certifica las politicas ni todas las tablas.
- Conservados los archivos de entorno, la clave PII, `google-services.json` y
  el keystore de firma encontrados en el respaldo.
- Actualizadas [la guia de setup](../GUIA_SETUP_OTRA_PC.md), [README](../README.md)
  y la plantilla `.env.local.example`, que no incluia Supabase ni la clave PII.

## Ajustes de pruebas

La primera ejecucion dio **327 pruebas correctas y 3 fallidas**. Se revisaron
los fallos contra la implementacion y se corrigieron solo los tests:

- Pagos: el formulario ya incluye el periodo personalizado desactivado y dos
  fechas vacias; la expectativa no contemplaba esos campos.
- Atletas: el catalogo compartido muestra `Master mujeres`; el test esperaba
  el texto anterior en mayusculas.
- Panel estudiante: una prueba de cobertura continua utilizaba la fecha real.
  Al ejecutarla en octubre, el primer periodo del ejemplo ya habia vencido.
  Se fijo el reloj de esa suite al 15 de junio de 2026 y se restaura al terminar.

Resultado posterior: **70 suites y 330 pruebas correctas**.
`test:contracts` tambien paso: **2 suites y 5 pruebas** (incluidas en el total).
`check:copy-quality` paso. El servicio `functions/` compilo con TypeScript y el
modulo `riovoley/index.js` se pudo importar.

Tambien se corrigio el formato de los dos modulos Express para cumplir sus
reglas de ESLint (tabulaciones, coma final y longitud de linea), sin cambiar
su comportamiento. El lint de ambos paquetes y la recompilacion TypeScript
terminaron correctamente. Montados temporalmente en puertos locales libres,
ambos endpoints `/health` respondieron **HTTP 200** con `status: ok`.

## Compilacion y navegador

- `npm.cmd run build`: **correcto**, con `Compiled successfully` y salida en
  `build/`. El bundle principal comprimido pesa aproximadamente 292 kB.
- `npm.cmd start`: **correcto**, servidor de desarrollo disponible en
  `http://localhost:3000`.
- La primera pasada publica de Playwright dio 31 correctas y cuatro timeouts de
  navegacion en `mobile-390`, mientras se ejecutaba la primera compilacion.
  La repeticion completa de ese perfil, con el servidor ya compilado, dio
  **5/5 correctas** sin cambios en UI ni en los limites de las pruebas.
- Repeticion final de todos los perfiles publicos: **35/35 correctas en 42.2 s**,
  cubriendo cinco rutas en siete tamanos de pantalla, con Chromium y WebKit.
- Smoke por roles: **administrador y entrenador correctos**. El estudiante
  permanece en login y muestra `Email o contrasena invalidos`. Las credenciales
  E2E respaldadas de ese rol deben revisarse en `.env.e2e`; no se cambio ninguna
  contrasena ni se creo una cuenta para omitir el fallo.
  Una comprobacion directa contra Supabase Auth confirmo **HTTP 400,
  `invalid_credentials`**, incluso leyendo el archivo con el parser dotenv.

Los accesos validos ejecutan el flujo normal de la aplicacion, que puede
registrar `last_login`, auditoria de login y la recompensa diaria de gamificacion.
No se ejecutaron las pruebas E2E que crean usuarios, pagos u otros registros de
negocio. No se da por aprobado el smoke completo de tres roles.

## Dependencias que requieren mantenimiento

`npm audit --json` sobre la raiz informo **97 alertas**:

| Severidad | Cantidad |
| --- | ---: |
| Critica | 5 |
| Alta | 77 |
| Moderada | 10 |
| Baja | 5 |

Es el inventario de alertas de npm para el arbol instalado, incluyendo las
herramientas de compilacion; requiere evaluar el uso de cada dependencia.
La restauracion conserva las versiones anteriores y no corrige estas alertas.

Una prioridad concreta es `@capacitor/android` **8.4.0**, afectado por
[GHSA-rvm3-566m-v7fv](https://github.com/advisories/GHSA-rvm3-566m-v7fv).
El aviso oficial incluye **8.4.3** entre las versiones corregidas y exige
recompilar y distribuir la app nativa para aplicar el arreglo. Una OTA de los
assets web no actualiza el runtime nativo.

Otras alertas involucran PostCSS, React Router y dependencias de CRA/Tailwind.
`npm audit` propone incluso `react-scripts@0.0.0` o Tailwind 4 para parte del
arbol; aplicar `npm audit fix --force` sin revision no es una solucion de setup.

## Android y servicios auxiliares

No se encontro Java, Android Studio ni el SDK en la ruta respaldada.
`android/local.properties` apunta a `D:\Apps\AndroidSDK`, que no existe en esta
PC. Esto no impide trabajar con la web; falta instalar el entorno nativo y
corregir esa ruta para generar APK/AAB. No se ejecuto una compilacion Android.

Supabase CLI y Deno tampoco estan instalados. Son herramientas para trabajar
localmente con las Edge Functions, no requisitos de la web contra Supabase remoto.

Los servicios Node auxiliares tienen detalles previos que conviene revisar si se
van a utilizar independientemente:

- `functions/src/index.ts` y `riovoley/index.js` exportan Express sin llamar a
  `listen`; sus scripts `start` no mantienen un servidor HTTP abierto por si solos.
- `functions` declara Express, pero no declara `@types/express`; la compilacion
  en este arbol puede resolver los tipos instalados por la raiz.
- `riovoley/index.js` importa Express, pero su propio `package.json` no lo declara;
  la importacion comprobada lo resuelve desde las dependencias de la raiz.
- `functions` tiene un script `genkit:start` que referencia
  `src/genkit-sample.ts`, archivo ausente del respaldo.

No son necesarios para `npm start` de la aplicacion principal.

## Documentacion y estado conservado

El README cita un workflow `clean-lite-migration-gate.yml` y algunos documentos
que no estan en la carpeta restaurada. `.github/workflows/` esta vacio; no se
puede dar por verificado un pipeline de CI basandose en esa descripcion.

Se conservaron los cambios locales previos en dashboards, asistencias, tablas y
sidebar, asi como la migracion SQL no versionada que ya existia. No se aplicaron
migraciones, no se desplegaron funciones y no se publico ningun bundle OTA.

## Uso diario

```powershell
Set-Location -LiteralPath 'D:\Riovoley\riovoley'
npm.cmd start
```

Aplicacion: `http://localhost:3000`. Detener con `Ctrl+C`.
