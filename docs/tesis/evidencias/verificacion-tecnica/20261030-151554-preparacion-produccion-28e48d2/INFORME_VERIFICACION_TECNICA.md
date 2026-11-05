# Verificación técnica: dependencias y preparación de producción

## 1. Identificación

RIOVOLEY, https://github.com/Joscoo/riovoley. Commit base 28e48d22a881704fc7c4d2197fdbec8bcedf841a; rama fix/seguridad-local-20261029, cambios inventariados sin incluir un despliegue. Inicio 2026-10-30T15:15:55.072Z; cierre 2026-10-31T19:54:14.096Z UTC. Auditoría realizada entre el 30 y el 31 de octubre de 2026. [CONTEXTO.json](CONTEXTO.json), [fuentes-iniciales.json](fuentes-iniciales.json), [fuentes-finales.json](fuentes-finales.json).

## 2. Herramientas y configuración

Windows_NT 10.0.26300 x64; Node v24.18.0; npm 11.16.0. JDK21, Gradle8.14.3 y SDK/build-tools35 de herramientas privadas, versión efectiva en [android/definitivo/android/gradle-version.stdout.log](android/definitivo/android/gradle-version.stdout.log). Los paquetes auxiliares declaran Node22: la instalación local sobre Node24 conservó EBADENGINE; el CI preparado separa los runtimes, sin cambiar el runtime institucional.

E2E exclusivamente en Supabase local descartable API127.0.0.1:55321, PostgreSQL127.0.0.1:55322, frontend127.0.0.1:6100. El verificador de persistencia contrasta la identidad de un fixture con Auth y auth.users antes de consultar. No se usó .env.e2e de producción. Las claves locales son privadas y los builds evitan dotenv institucional mediante variables explícitas. El APK usa placeholder sin validez y actualizador externo desactivado.

## 3. Alcance y metodología

Se reprodujeron los problemas, se modificaron herramientas/configuración y se verificó una instalación limpia. No se cambió src/ ni la lógica del producto para aprobar pruebas. El único cambio E2E espera fuentes y captura en CSS pixels; conserva todas las aserciones. No hubo cambios de registros, permisos, esquemas o secretos institucionales, despliegues, distribución de APK o merge a main. El inventario reproducible incluye cada comando, entorno de trabajo, tiempos y código de salida: [COMANDOS.json](COMANDOS.json). No sumar comandos envolventes con los procesos hijos ni denominadores de herramientas distintas.

Comandos principales:

~~~powershell
node scripts/audit/closure/initialize-production.cjs
node scripts/audit/closure/audit-dependencies.cjs before
# Cambios revisados de vendor/package y regeneración aislada del lockfile
node scripts/audit/production/repair-file-lock.cjs
npm.cmd install --ignore-scripts --no-audit --no-fund
node scripts/audit/production/clean-install.cjs
npm.cmd run test:toolchain
# Jest se ejecutó con CI=true, watchAll=false, runInBand, JSON y cobertura
node scripts/e2e/local/manage.cjs start
node scripts/e2e/local/functions.cjs
node scripts/e2e/local/build.cjs
node scripts/audit/closure/browser-regression.cjs
node scripts/e2e/local/run.cjs pending --label=paneles-captura-corregida --workers=2
node scripts/audit/closure/verify-e2e-final-persistence.cjs mutaciones-finales
node scripts/audit/closure/check-dependencies-dev-server.cjs --label=aislado
# Build CRA con CI=true, GENERATE_SOURCEMAP=false y configuración local
node scripts/audit/closure/bind-dependencies-android.cjs
node scripts/audit/production/rebuild-android.cjs
node scripts/audit/production/verify-offline-apk.cjs
node scripts/audit/closure/audit-dependencies.cjs verificado
node scripts/audit/production/check-config.cjs
~~~

Los helpers registran los argumentos efectivos; build/test no se ejecutaron con configuración institucional. functions.cjs es un servicio de larga duración, no una suite. La regeneración del lock y los instaladores modifican solo archivos de dependencias; repetir en checkout de ensayo.

## 4. Resultados por herramienta

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| J01 | Jest final: unitarias/componentes/contratos | 419 | 419 | 0 | 0 | APROBADO | [unitarias/jest-final.json](unitarias/jest-final.json) |
| J02 | Contratos, incluidos en J01 | 12 | 12 | 0 | 0 | APROBADO | [unitarias/casos-jest.json](unitarias/casos-jest.json) |
| J03 | Integración lógica en memoria, incluida en J01 | 5 | 5 | 0 | 0 | APROBADO | [unitarias/casos-jest.json](unitarias/casos-jest.json) |
| N01 | Contratos Node finales de herramientas y preflight | 76 | 76 | 0 | 0 | APROBADO | [unitarias/cadena-regresion-final.stdout.log](unitarias/cadena-regresion-final.stdout.log) |
| N02 | Mismos contratos tras npm ci independiente | 76 | 76 | 0 | 0 | APROBADO | [unitarias/cadena-instalacion-limpia-1793474740434.meta.json](unitarias/cadena-instalacion-limpia-1793474740434.meta.json) |
| G01 | Guardas de aislamiento del arnés | 12 | 12 | 0 | 0 | APROBADO | [unitarias/arnes-final.stdout.log](unitarias/arnes-final.stdout.log) |
| I01 | CRA real: compilación/HTTP/bundle/HMR/origen | 5 | 5 | 0 | 0 | APROBADO | [integracion/dev-server-aislado-controles.json](integracion/dev-server-aislado-controles.json) |
| I02 | Consulta agregada PostgreSQL READ ONLY | — | — | — | — | APROBADO; sin casos nuevos | [integracion/persistencia-postgresql.json](integracion/persistencia-postgresql.json) |
| E01 | Playwright publicas-finales | 133 | 133 | 0 | 0 | APROBADO | [publicas-finales/resultados.json](publicas-finales/resultados.json) |
| E02 | Playwright paneles-aislados | 105 | 105 | 0 | 0 | APROBADO | [paneles-aislados/resultados.json](paneles-aislados/resultados.json) |
| E03 | Playwright mutaciones-finales | 7 | 7 | 0 | 0 | APROBADO | [mutaciones-finales/resultados.json](mutaciones-finales/resultados.json) |
| E04 | Playwright limites-finales | 4 | 4 | 0 | 0 | APROBADO | [limites-finales/resultados.json](limites-finales/resultados.json) |
| E05 | Smoke adicional sobre build estricto final (casos repetidos) | 3 | 3 | 0 | 0 | APROBADO | [smoke-build-estricto/resultados.json](smoke-build-estricto/resultados.json) |
| E00 | Primer intento completo de paneles | 105 | 104 | 1 | 0 | FALLIDO; conservado | [paneles-finales/resultados.json](paneles-finales/resultados.json) |
| E00b | Segundo intento de paneles | 105 | 103 | 2 | 0 | FALLIDO: dos esperas de login local agotadas | [paneles-captura-corregida/resultados.json](paneles-captura-corregida/resultados.json) |
| W01 | Build estricto equivalente al comando preparado para Vercel | — | — | — | — | APROBADO | [compilacion-web/vercel-candidato.meta.json](compilacion-web/vercel-candidato.meta.json) |
| A01 | Capacitor + Gradle debug con lockfile definitivo | — | — | — | — | APROBADO | [android/definitivo/android/gradle-assemble.meta.json](android/definitivo/android/gradle-assemble.meta.json) |
| A02 | JUnit de plantilla en JVM | 1 | 1 | 0 | 0 | APROBADO | [android/definitivo/android/junit-resumen.json](android/definitivo/android/junit-resumen.json) |
| S01 | npm audit raiz final | — | — | — | — | APROBADO (registro; adaptadores locales fuera de alcance) | [seguridad/npm-raiz-verificado.json](seguridad/npm-raiz-verificado.json) |
| S02 | npm audit functions final | — | — | — | — | APROBADO (registro; adaptadores locales fuera de alcance) | [seguridad/npm-functions-verificado.json](seguridad/npm-functions-verificado.json) |
| S03 | npm audit auxiliar final | — | — | — | — | APROBADO (registro; adaptadores locales fuera de alcance) | [seguridad/npm-auxiliar-verificado.json](seguridad/npm-auxiliar-verificado.json) |
| P01 | Preflight de .env.production local | — | — | — | — | BLOQUEADO: APP_URL ausente | [seguridad/preflight-config-local.stdout.log](seguridad/preflight-config-local.stdout.log) |
| P02 | Publicación institucional/SQL/Edge/Android release | — | — | — | — | NO EJECUTADO: gates operativos pendientes | [ESTADO_PRODUCCION.md](ESTADO_PRODUCCION.md) |

## 5. Unitarias y componentes

Jest final: 419 casos, 88 suites, 221.136s de proceso. Cobertura: líneas 42.96%, sentencias 41.58%, funciones 36.93%, ramas 33.72%. Es cobertura instrumentada de las fuentes incluidas por Jest, no porcentaje de requisitos validados. Se conservó también la ejecución anterior de 419 casos dentro de esta sesión, con denominador separado.

| Módulo | Casos | Aprobados | Fallidos | Omitidos |
|---|---:|---:|---:|---:|
| student-dashboard | 32 | 32 | 0 | 0 |
| shared | 57 | 57 | 0 | 0 |
| payments | 40 | 40 | 0 | 0 |
| gamification | 69 | 69 | 0 | 0 |
| user-management | 32 | 32 | 0 | 0 |
| auth-session | 19 | 19 | 0 | 0 |
| reporting | 7 | 7 | 0 | 0 |
| auth-profile | 5 | 5 | 0 | 0 |
| trainer-dashboard | 4 | 4 | 0 | 0 |
| notifications | 14 | 14 | 0 | 0 |
| attendance | 32 | 32 | 0 | 0 |
| account-admin | 12 | 12 | 0 | 0 |
| user-provisioning | 20 | 20 | 0 | 0 |
| physical-tests | 9 | 9 | 0 | 0 |
| announcements | 7 | 7 | 0 | 0 |
| athletes | 14 | 14 | 0 | 0 |
| admin-dashboard | 9 | 9 | 0 | 0 |
| schedules | 4 | 4 | 0 | 0 |
| communications | 11 | 11 | 0 | 0 |
| trainer-management | 8 | 8 | 0 | 0 |
| otros | 11 | 11 | 0 | 0 |
| training-categories | 3 | 3 | 0 | 0 |

Inventarios por archivo y título: [unitarias/casos-jest.json](unitarias/casos-jest.json), [unitarias/modulos.json](unitarias/modulos.json); cobertura [unitarias/cobertura-final/lcov-report/index.html](unitarias/cobertura-final/lcov-report/index.html), [unitarias/cobertura-final/coverage-summary.json](unitarias/cobertura-final/coverage-summary.json). Los contratos de herramientas no se agregan a Jest; su cobertura no se midió.

## 6. Contratos e integración

12 contratos y 5 pruebas de integración lógica en memoria están incluidos en los 419 casos Jest. Los repositorios/gateways simulados prueban llamadas, mapeos y errores, no PostgreSQL. La fachada de gamificación se prueba con casos de uso simulados; la integración gamificación/asistencia/pago/evaluación de gamification.audit.integration.test.js usa repositorio en memoria y mocks de Supabase/móvil. [../../../../../src/features/gamification/application/useCases/gamification.audit.integration.test.js](../../../../../src/features/gamification/application/useCases/gamification.audit.integration.test.js). La persistencia real se observó solamente en los flujos locales Playwright y su consulta PG: {"students":7,"payments":7,"paymentswithexpectedamount":7,"attendances":7}; ese control agregado no aumenta el número de casos. No prueba todas las transacciones de XP ni el backend institucional.

Los 76 contratos Node incluyen HTTP/WebSocket reales de loopback, compilaciones de fixtures webpack, seguridad de dependencias y preflight con configuración sintética. La instalación limpia repite los mismos contratos, sin convertirlos en casos únicos adicionales. [unitarias/cadena-instalacion-limpia-1793474740434.meta.json](unitarias/cadena-instalacion-limpia-1793474740434.meta.json), [seguridad/instalacion-limpia.json](seguridad/instalacion-limpia.json).

## 7. Extremo a extremo

249 instancias finales: 249 aprobadas, 0 fallidas, 0 omitidas; 133 públicas, 105 paneles, siete flujos con escritura y cuatro límites adaptables. Son combinaciones caso/perfil, no 249 funcionalidades independientes. Las 28 instancias de recuperación de contraseña simulan Auth/REST; no validan entrega de correo. Las demás llamadas usan el stack local según los casos existentes; no se hicieron logins institucionales. Reportes HTML en cada carpeta de grupo, capturas pertinentes y JSON. No se generaron trazas para una corrida aprobada sin reintentos.

La regresión de 249 instancias utilizó el build con mapas generado antes del último ajuste de empaquetado/patrones; src/ se conservó. El build estricto final sin mapas se comprobó además mediante tres casos de paneles por rol, ya presentes en la regresión, sin sumarlos como casos únicos nuevos. No se repitió toda la matriz sobre ese segundo artefacto. La copia y sus hashes constan en [compilacion-web/build-estricto-browser.json](compilacion-web/build-estricto-browser.json), [smoke-build-estricto/resultados.json](smoke-build-estricto/resultados.json). El primer intento de paneles fue 104/105: tablet-768 multiplicaba el bitmap por DPR=2 y superaba el límite de captura, aunque la altura CSS estaba bajo el guard. Se corrigió únicamente la adquisición de evidencia con scale:css y espera de fuentes. La segunda ejecución aprobó la captura y terminó 103/105 por dos esperas de login local agotadas; el diagnóstico registró /token 500 con context canceled. Sin builds simultáneos se repitió la suite con un trabajador. Entre los intentos de regresión se registraron 459 ejecuciones, 456 aprobadas y tres fallidas, correspondientes a 249 combinaciones únicas. El smoke adicional de tres casos repetidos tiene denominador separado. La repetición final se registra aparte; [paneles-finales/resultados.json](paneles-finales/resultados.json), [paneles-aislados/resultados.json](paneles-aislados/resultados.json). Los controles de disposición son automatizados; no miden usabilidad, motivación, USE o UES-SF.

## 8. Compilación web

Build estricto del comando previsto en Vercel: código 0, 212.873s, Nodev24.18.0, npm11.16.0. Se generó una SPA privada con index.html, static/js, static/css y assets; inventario [compilacion-web/vercel-salida.json](compilacion-web/vercel-salida.json). La ausencia de mapas se comprobó en la salida. Se conservan el build para E2E y los builds offline del empaquetado nativo con sus duraciones. Las advertencias deprecadas fs.F_OK se preservan en stderr; no son fallos de casos. El éxito de build no demuestra funcionamiento completo ni publicación en Vercel.

## 9. Android

Capacitor sync y Gradle :app:assembleDebug :app:testDebugUnitTest --rerun-tasks fueron ejecutados en copia privada con el lockfile definitivo. Gradle código 0, 247.601s. APK debug 35056311 bytes; SHA256 92fe75484668d024013e39fa703886b93a833e1c40847d560e7ad71226d3e166; 106 archivos web comparados byte a byte con su build. [../../../../../.e2e-local/android-native/20261028-155551/project/android/app/build/outputs/apk/debug/app-debug.apk](../../../../../.e2e-local/android-native/20261028-155551/project/android/app/build/outputs/apk/debug/app-debug.apk) permanece ignorado por Git; no se distribuye. [android/definitivo/android/apk-verificado.json](android/definitivo/android/apk-verificado.json). Firma debug, badging y privacidad en [android/apk-firma-definitivo.meta.json](android/apk-firma-definitivo.meta.json), [android/apk-badging-definitivo.meta.json](android/apk-badging-definitivo.meta.json), [android/definitivo/android/privacidad-apk.json](android/definitivo/android/privacidad-apk.json). Se conservaron advertencias SDK XML y APIs Java deprecadas en los logs; no se confundieron con errores de compilación.

JUnit: 1 prueba de plantilla de JVM, 1 aprobada; no es cobertura funcional Android. No se repitió ejecución en emulador/dispositivo en esta etapa ni se produjo release firmado. Dos inspecciones de perfil autenticado fallaron al exigir una anon local real que deliberadamente no existe en el APK offline; no detectó secretos. Se conservó como incidencia y se aplicaron los controles del perfil correcto, sin cambiar la expectativa del inspector autenticado. [android/apk-privado-inspeccion-produccion.json](android/apk-privado-inspeccion-produccion.json). El primer APK quedó conservado privadamente antes de recompilar: [android/apk-primer-build-preservado.json](android/apk-primer-build-preservado.json).

## 10. Seguridad y producción

## Cambios y criterio de seguridad

Se mantuvo CRA 5, React y Capacitor. WDS se actualizó a 6.1.0 (middleware 8.6.0) con traducción de configuración, middlewares, ciclo de cierre y módulos .cjs del cliente HMR. Se restringe el servidor a loopback y al origen autorizado; el control real de origen falló antes y aprobó después.

Deepmerge es una copia privada identificada como @riovoley/deepmerge-hardened, derivada de 4.3.1, con MIT, huella y procedencia. Rechaza __proto__ en ambos lados y define propiedades propias. No es una publicación corregida upstream ni un sanitizador general. El fallo reproducido afecta al prototipo del objeto devuelto; no demuestra modificación global de Object.prototype. Los 25 contratos prueban cuatro consumidores reales y compatibilidad. [../../../../../vendor/README.md](../../../../../vendor/README.md), [../../../../../vendor/deepmerge/ORIGIN.json](../../../../../vendor/deepmerge/ORIGIN.json).

El 31 de octubre aparecieron dos avisos nuevos del registro: [glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) y [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249). La consulta intermedia informó 51 paquetes moderados en raíz, 15 en functions y 10 en auxiliar; son propagaciones de dos causas, no 76 vulnerabilidades independientes. Se actualizó glob de API moderna a 14.0.3; se conserva glob 7 donde se requiere callback. Una adaptación privada expone al código antiguo la API de minimatch y los segmentos Matcher, delegando al motor sin modificar minimatch 11.0.3 del registro. Se verificaron callbacks/sync, nombres y funciones, glob de Capacitor, cancelación y un patrón de amplificación con plazo y memoria acotados. [../../../../../vendor/minimatch-compat/README.md](../../../../../vendor/minimatch-compat/README.md), [../../../../../tests/integration/toolchain.patterns.test.cjs](../../../../../tests/integration/toolchain.patterns.test.cjs).

La secuencia raíz fue 15 → 0 (consulta del día 30) → 51 (avisos nuevos del día 31) → 0 (consulta final); no es una reducción monotónica de una base estática. El motor del registro sí entra en npm audit. **Npm audit no analiza el código de deepmerge local ni la adaptación local de minimatch**: su revisión, hashes y contratos son controles separados. Cero avisos no equivale a ausencia de vulnerabilidades ni a una prueba de penetración. La instalación inicial file: generó enlaces inválidos; se corrigió con dependencias directas referenciadas por overrides y empaquetado install-links=true. npm ci independiente confirmó la reproducción. Se conserva un intento npm install --force que no renovó la copia local; no se usó npm audit fix --force. La versión privada cambió al corregir su implementación.

El CI aparta dotenv del checkout temporal, usa Node22 para árboles auxiliares y Node24 para React/herramientas. Se prepararon tres cabeceras HTTP y build estricto sin sourcemaps; no se publicaron. La validación del esquema de Vercel se limitó a las propiedades usadas: el documento completo publicado contiene incompatibilidades draft-04 en campos experimentales ajenos. Se conservaron los errores. [../../../../../.github/workflows/technical-readiness.yml](../../../../../.github/workflows/technical-readiness.yml), [../../../../../vercel.json](../../../../../vercel.json), [seguridad/configuracion-final.meta.json](seguridad/configuracion-final.meta.json).

Lectura institucional de metadatos: xp_ledger/login_rewards y tablas de moneda consultadas mantienen RLS habilitada; no se presume suficiencia de sus políticas. La RPC pública claim_daily_login_reward() sigue ausente; hay sobrecargas UUID/bigint de pagos SECURITY DEFINER con EXECUTE para anon/authenticated y search_path sin fijar. Esos metadatos requieren revisión de cuerpo/contratos, no acreditan por sí solos un exploit. [seguridad/supabase-catalogo-20261031.json](seguridad/supabase-catalogo-20261031.json). Nueve funciones Edge inventariadas, todas con verify_jwt=true en metadata; no se ejecutaron ni se confirmó identidad de su fuente con el candidato. [seguridad/supabase-edge-20261031.json](seguridad/supabase-edge-20261031.json).

Los advisories institucionales consultados el día 30 mantienen pendientes 19 search_path, pg_net en public, 17 funciones SECURITY DEFINER ejecutables por anon y 19 por authenticated (pueden solaparse), protección de contraseñas filtradas desactivada y actualización de PostgreSQL. Son observaciones de esa fecha; no se aplicaron arreglos remotos. [seguridad/supabase-advisores.json](seguridad/supabase-advisores.json). Véanse las URLs de remediación incluidas en esa evidencia.

Las cuatro rutas públicas HTTPS devolvieron 200 con contenedor SPA; no se ejecutó JS ni login. No se observó CSP/nosniff/referrer/frame/permissions-policy en ese GET. [seguridad/despliegue-publico.json](seguridad/despliegue-publico.json). El usuario identificó riovoley.com y joscoos-projects/riovoley; el conector Vercel disponible no acredita acceso operativo a ese equipo. No se aseguró qué SHA sirve producción. [ESTADO_PRODUCCION.md](ESTADO_PRODUCCION.md), [../../../../produccion/RUNBOOK.md](../../../../produccion/RUNBOOK.md).

## 11. Incidencias, omisiones y límites

Los ciclos fallidos de merge, adaptación, middleware, empaquetado, capturas, inspección de perfil y esquema se conservan: [INCIDENCIAS.json](INCIDENCIAS.json). Los timeouts del servidor completo se registran sin aprobar HTTP por haber compilado; el último control se consigna en la tabla. Una compilación concurrente dispuso de aproximadamente 1.1GiB libre de 15.9GiB; esa observación contextual no demuestra que fuera la causa del timeout. Las omisiones automáticas de las suites finales fueron cero. La publicación y pruebas institucionales de escritura están NO EJECUTADAS, no omitidas silenciosamente; dependen de gates explícitos y un entorno autorizado. Correo/push externos, backup/restauración, SQL productivo ensayado, clientes antiguos/Capgo, configuración cloud de Auth, CI remoto, publicación y smoke postdespliegue siguen pendientes. No hay evaluación con usuarios ni prueba de penetración completa.

## 12. Integridad y privacidad

Se verifican los diez expedientes sellados anteriores y las cifras frente a JSON/TAP originales; las fuentes del producto src/ deben coincidir con el inventario inicial. Se inspeccionan valores conocidos, JWT, claves, correos y ZIP base64 en HTML; se anonimizan perfiles Windows en copias de logs. Los resultados definitivos constan en [INTEGRIDAD.json](INTEGRIDAD.json), [PRIVACIDAD.json](PRIVACIDAD.json), [MANIFIESTO_SHA256.json](MANIFIESTO_SHA256.json). El manifiesto excluye su propio hash y no certifica permisos institucionales.

## 13. Referencias y reproducción

La matriz y el texto propuesto acompañan este documento. Las rutas relativas vinculan evidencia real. Para reproducir, usar Node24/npm11 y el lockfile/vendor versionados; para las suites locales consultar [../../../../../scripts/e2e/local/README.md](../../../../../scripts/e2e/local/README.md). Nunca apuntarlas a .env.e2e institucional. Respetar los perfiles Android y mantener los artefactos en runtime privado. La preparación de producción se revisa en [../../../../produccion/RUNBOOK.md](../../../../produccion/RUNBOOK.md) y [../../../../produccion/VARIABLES.md](../../../../produccion/VARIABLES.md).
