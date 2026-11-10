# Verificación complementaria: corrección de dependencias de RIOVOLEY

## 1. Identificación y entorno

Repositorio Joscoo/riovoley; commit base **89ec6c678465bcdb839cb79474cd0d7eee636c22**, rama fix/seguridad-local-20261029. Inicio 2026-10-30T14:13:39.410Z; cierre documental 2026-10-30T14:45:28.737Z, UTC. Árbol modificado según inventarios de fuentes, estado inicial y diff; no se cambió código de src/ ni el framework CRA. [CONTEXTO.json](CONTEXTO.json), [fuentes-iniciales.json](fuentes-iniciales.json), [estado-inicial.txt](estado-inicial.txt).

Sistema Windows_NT 10.0.26300 x64, Node v24.18.0; npm 11.16.0, JDK 21.0.12.1, Gradle 8.14.3, SDK/build-tools 35.0.0. Las versiones nativas se registraron desde las herramientas privadas. El backend de navegador es Supabase descartable, API 127.0.0.1:55321 y PG 127.0.0.1:55322; no se utilizó .env.e2e institucional. Auth y auth.users fueron contrastados antes de las pruebas. [seguridad/backend-local.json](seguridad/backend-local.json), [herramientas.json](herramientas.json).

## 2. Alcance y metodología

Se diagnosticaron avisos npm, se probaron actualizaciones transitivas desde sus consumidores y se repitieron Jest, compilación, navegación y flujos locales. No se modificaron esquema, políticas, permisos, secretos o registros institucionales; no se publicaron despliegues ni APK. La revisión no constituye una prueba de penetración ni una evaluación con usuarios.

Se aplicaron seis overrides: serialize-javascript 7.1.4, Once 2.0.1 limitado a http-proxy-agent, UUID 11.1.1 limitado a SockJS, @svgr/webpack 6.5.1, resolve-url-loader 5.0.0 y middleware 7.4.6 limitado a webpack-dev-server 4. Son actualizaciones mayores transitivas: su compatibilidad se comprobó, no se presupuso por SemVer. Capacitor instalado ya requiere Node 22+; se verificó Node 24.18.0. No se ejecutó audit fix --force ni se modificaron node_modules manualmente. [../../../../../package.json](../../../../../package.json), [DECISIONES.md](DECISIONES.md), [DECISIONES_CARGADORES.md](DECISIONES_CARGADORES.md), [seguridad/cambios-lockfile.json](seguridad/cambios-lockfile.json), [seguridad/cambios-lockfile-cargadores.json](seguridad/cambios-lockfile-cargadores.json), [seguridad/arbol-final.stdout.log](seguridad/arbol-final.stdout.log).

Comandos principales, ejecutados desde la raíz:

~~~powershell
node scripts/audit/closure/initialize-dependencies.cjs
node scripts/audit/closure/audit-dependencies.cjs before
# Tras cada edición revisada de overrides:
npm.cmd install --ignore-scripts --no-audit --no-fund
node --test --test-reporter=tap tests/integration/toolchain.dependencies.test.cjs tests/integration/toolchain.security-followup.test.cjs tests/integration/toolchain.loaders-security.test.cjs
node scripts/audit/closure/audit-dependencies.cjs after-loaders
node scripts/e2e/local/build.cjs
node scripts/audit/closure/check-dependencies-dev-server.cjs
node scripts/e2e/local/functions.cjs
# Mientras el handler local está disponible, en otra terminal:
node scripts/audit/closure/browser-regression.cjs
node scripts/audit/closure/verify-e2e-final-persistence.cjs mutaciones-finales
node scripts/audit/closure/bind-dependencies-android.cjs
node scripts/audit/android/stage.cjs final
node scripts/audit/android/build.cjs assemble --rerun-tasks
python scripts/audit/closure/check-dependencies-apk.py
~~~

Jest se lanzó con react-scripts test --watchAll=false --runInBand --coverage, JSON y reportes json-summary/lcov/html/text; el comando exacto, entorno local, duración y salida constan en [unitarias/jest-cobertura.meta.json](unitarias/jest-cobertura.meta.json). Los scripts de cierre concilian este expediente concreto; no deben reutilizarse para forzar resultados históricos de otro. Una auditoría nueva requiere otra carpeta y etiquetas disponibles.

## 3. Resultados por herramienta

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| J01 | Jest: unitarias, componentes y contratos | 419 | 419 | 0 | 0 | APROBADO | [unitarias/jest-resultados.json](unitarias/jest-resultados.json) |
| J02 | Contratos incluidos en J01 | 12 | 12 | 0 | 0 | APROBADO | [unitarias/casos-jest.json](unitarias/casos-jest.json) |
| J03 | Integración lógica en memoria incluida en J01 | 5 | 5 | 0 | 0 | APROBADO | [unitarias/casos-jest.json](unitarias/casos-jest.json) |
| D01 | Primer ciclo: reproducción | 9 | 5 | 4 | 0 | FALLIDO (reproducción conservada) | [seguridad/regresion-rojo.stdout.log](seguridad/regresion-rojo.stdout.log) |
| D02 | Primer ciclo: compatibilidad | 15 | 15 | 0 | 0 | APROBADO | [seguridad/regresion-verde.stdout.log](seguridad/regresion-verde.stdout.log) |
| D03 | Cargadores: reproducción | 7 | 3 | 4 | 0 | FALLIDO (reproducción conservada) | [seguridad/cargadores-rojo.stdout.log](seguridad/cargadores-rojo.stdout.log) |
| D04 | Conjunto final de dependencias | 22 | 22 | 0 | 0 | APROBADO | [seguridad/cargadores-verde.stdout.log](seguridad/cargadores-verde.stdout.log) |
| G01 | Guardas del aislamiento Node | 12 | 12 | 0 | 0 | APROBADO | [unitarias/guardas-aislamiento.stdout.log](unitarias/guardas-aislamiento.stdout.log) |
| I01 | CRA real: HTTP, bundle y HMR | 3 | 3 | 0 | 0 | APROBADO | [integracion/dev-server-controles.json](integracion/dev-server-controles.json) |
| I02 | Consulta PostgreSQL READ ONLY | — | — | — | — | APROBADO (control agregado) | [integracion/persistencia-postgresql.json](integracion/persistencia-postgresql.json) |
| E01 | Playwright publicas-finales | 133 | 133 | 0 | 0 | APROBADO | [publicas-finales/resultados.json](publicas-finales/resultados.json) |
| E02 | Playwright paneles-finales | 105 | 105 | 0 | 0 | APROBADO | [paneles-finales/resultados.json](paneles-finales/resultados.json) |
| E03 | Playwright mutaciones-finales | 7 | 7 | 0 | 0 | APROBADO | [mutaciones-finales/resultados.json](mutaciones-finales/resultados.json) |
| E04 | Playwright limites-finales | 4 | 4 | 0 | 0 | APROBADO | [limites-finales/resultados.json](limites-finales/resultados.json) |
| W01 | Build web con backend local | — | — | — | — | APROBADO | [compilacion-web-build-1793370427198.meta.json](compilacion-web-build-1793370427198.meta.json) |
| W02 | Build web offline para empaquetado Android | — | — | — | — | APROBADO | [compilacion-web/build-auditoria.meta.json](compilacion-web/build-auditoria.meta.json) |
| A01 | Capacitor sync + Gradle Android debug | — | — | — | — | APROBADO | [android/gradle-assemble.meta.json](android/gradle-assemble.meta.json) |
| A02 | JUnit de plantilla en JVM | 1 | 1 | 0 | 0 | APROBADO | [android/junit-resumen.json](android/junit-resumen.json) |
| S01 | npm audit raíz: criterio cero avisos | — | — | — | — | FALLIDO: persisten avisos | [seguridad/npm-raiz-after-loaders.json](seguridad/npm-raiz-after-loaders.json) |
| S02 | npm audit functions | — | — | — | — | APROBADO | [seguridad/npm-functions-after-loaders.json](seguridad/npm-functions-after-loaders.json) |
| S03 | npm audit árbol auxiliar | — | — | — | — | APROBADO | [seguridad/npm-auxiliar-after-loaders.json](seguridad/npm-auxiliar-after-loaders.json) |

Los subconjuntos J02/J03 ya pertenecen a los 419 de J01. El conjunto final Node contiene **22 casos únicos**; las ejecuciones intermedias se conservan, no se suman como casos nuevos. Tampoco se suman las 12 guardas, tres controles HTTP/HMR, JUnit o Playwright al denominador Jest. La consulta I02 tiene conteos de filas, no casos de prueba.

## 4. Jest, contratos, módulos y cobertura

Se aprobaron **419/419 casos en 88 suites**, 0 fallidos y 0 omitidos; proceso 133.849s. Se incluyen 12 contratos seleccionados por archivos explícitos y 5 casos de integración lógica en memoria. Servicios/repositorios simulados, gateways interceptados o memoria no acreditan PostgreSQL. Inventarios de casos y módulos: [unitarias/casos-jest.json](unitarias/casos-jest.json), [unitarias/modulos.json](unitarias/modulos.json).

Cobertura: líneas **42.96%** (5209/12123), sentencias 41.58%, ramas 33.72% y funciones 36.93%. Solo corresponde al código instrumentado por Jest; los contratos Node de herramientas no aumentan la cobertura del negocio. [unitarias/cobertura/coverage-summary.json](unitarias/cobertura/coverage-summary.json), [unitarias/cobertura/lcov-report/index.html](unitarias/cobertura/lcov-report/index.html).

## 5. Dependencias y reproducción de fallos

El primer ciclo de nueve casos reprodujo cuatro fallos: tres consumidores emitían un cierre de etiqueta sin escapar y Once 1 ignoraba AbortSignal. El resultado no demuestra que la app ejerciera esa opción: http-proxy-agent espera connect y descarta el valor devuelto. Se conservan las salidas roja y verde. El segundo ciclo reprodujo cuatro fallos entre siete casos: buffer UUID insuficiente, enlace SVG con namespace, inclusión de sourcemap absoluto y escape de outputPath con publicPath sin barra. Se usaron únicamente marcadores y archivos sintéticos. Las expectativas no se relajaron; los fixtures se trasladaron al runtime privado para evitar nombres de usuario en rutas. [seguridad/regresion-rojo.stdout.log](seguridad/regresion-rojo.stdout.log), [seguridad/cargadores-rojo.stdout.log](seguridad/cargadores-rojo.stdout.log).

El conjunto final **22/22** comprobó también HTTP proxy y propagación de errores sobre loopback, JSONPath/BFJ, QS de Express, tipos serializados, conexiones SockJS, compilación SVG con opciones CRA, CSS y sus mapas. Son contratos/integraciones de herramientas reales con fixtures, sin backend deportivo. No se presentan como pruebas de gamificación real. [../../../../../tests/integration/toolchain.dependencies.test.cjs](../../../../../tests/integration/toolchain.dependencies.test.cjs), [../../../../../tests/integration/toolchain.security-followup.test.cjs](../../../../../tests/integration/toolchain.security-followup.test.cjs), [../../../../../tests/integration/toolchain.loaders-security.test.cjs](../../../../../tests/integration/toolchain.loaders-security.test.cjs).

CRA ya deshabilita svgo en su loader. El test opt-in del optimizador comprueba un bypass concreto y no convierte RIOVOLEY en un sanitizador de SVG. La guía de SVGR conserva webpack 5/file-loader en v6; se verificaron ReactComponent, título, ref, viewBox y URL. Los tres controles adicionales iniciaron CRA sobre 127.0.0.1:6101, recuperaron HTML y bundle y recibieron un mensaje HMR real; no ejecutaron JavaScript de la app. El proceso hijo se detuvo intencionalmente (salida 1 del servidor), mientras el driver terminó con salida 0. [integracion/dev-server-controles.json](integracion/dev-server-controles.json), [integracion/dev-server-proceso.json](integracion/dev-server-proceso.json), [integracion/dev-server.stdout.log](integracion/dev-server.stdout.log).

## 6. Seguridad y avisos pendientes

| Árbol | Antes | Tras primer ciclo | Final | Bajas / moderadas / altas / críticas final |
|---|---:|---:|---:|---|
| raiz | 31 | 23 | 15 | 13 / 2 / 0 / 0 |
| functions | 0 | 0 | 0 | 0 / 0 / 0 / 0 |
| auxiliar | 0 | 0 | 0 | 0 / 0 / 0 / 0 |

La raíz bajó de **31 a 15 avisos**, con cero altos/críticos en esta consulta; persisten 13 bajos y dos moderados. Son paquetes marcados, incluidos avisos propagados por dependencias; no equivalen a 15 vulnerabilidades independientes explotadas. El objetivo de cero alertas **no está cumplido**. npm audit mantiene salida 1 por los avisos; functions y auxiliar devolvieron0. [seguridad/npm-raiz-before.json](seguridad/npm-raiz-before.json), [seguridad/npm-raiz-after.json](seguridad/npm-raiz-after.json), [seguridad/npm-raiz-after-loaders.json](seguridad/npm-raiz-after-loaders.json), [seguridad/npm-functions-after-loaders.json](seguridad/npm-functions-after-loaders.json), [seguridad/npm-auxiliar-after-loaders.json](seguridad/npm-auxiliar-after-loaders.json).

Las causas restantes son deepmerge 4.3.1 sin parche publicado y webpack-dev-server 4. La actualización directa del servidor rompe opciones que CRA aún utiliza (https, onBeforeSetupMiddleware y onAfterSetupMiddleware); requiere trabajo de mantenimiento específico. No se rebajó deepmerge ni se ocultaron avisos. La ficha del middleware conserva una descripción antigua sobre backports que contradice su lista de versiones corregidas; por eso se contrastó el registro y se exigió el caso funcional contra7.4.6. Fuentes primarias y fechas: [seguridad/fuentes-consultadas.json](seguridad/fuentes-consultadas.json), [deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), [migración del servidor](https://github.com/webpack/webpack-dev-server/blob/main/migration-v5.md).

No aparecieron coincidencias de los quince paquetes en las fuentes declaradas por los 40 sourcemaps JS del bundle auditado. Este contraste no elimina riesgos de las herramientas ni certifica ausencia de todo código vulnerable. [seguridad/alcance-bundle.json](seguridad/alcance-bundle.json). No se reevaluaron aquí las políticas RLS institucionales; las comprobaciones locales y cambios SQL autorizados de etapas anteriores permanecen diferenciados.

## 7. Playwright e integración local

Se ejecutaron **249 instancias**: 249 aprobadas, 0 fallidas y 0 omitidas, con dos workers y cero reintentos automáticos. Chromium y WebKit:390/430/480/768/1024/1440/1920px; los cuatro límites de pagos usan481/600/767/768px. Son navegadores, no Android nativo. Los JSON y HTML de cada grupo se conservan; inventario completo en [e2e/casos-playwright.json](e2e/casos-playwright.json).

**28 instancias de recuperación simulan Auth/REST**. Los siete flujos administrativos usan Auth/REST/PG reales locales, crean atletas descartables y verifican pago y asistencia tras recargar. Una transacción READ ONLY corroboró siete atletas, siete pagos de 35 y siete asistencias dentro de su ventana temporal. Son los mismos flujos para pagos/asistencia y no se duplican al trazar categorías. No se contactaron Resend/FCM. [mutaciones-finales/resultados.json](mutaciones-finales/resultados.json), [integracion/persistencia-postgresql.json](integracion/persistencia-postgresql.json).

## 8. Compilación web y Android

El build local web terminó con salida 0 en 238.626s y el build offline Android con salida 0 en 79.489s. Se conservó DEP0176 de fs.F_OK. Los tamaños y archivos emitidos constan en sus stdout; la salida completa permanece en runtime privado. Compilar no prueba todas las funcionalidades. [compilacion-web-build-1793370427198.meta.json](compilacion-web-build-1793370427198.meta.json), [compilacion-web-build-1793370427198.stdout.log](compilacion-web-build-1793370427198.stdout.log), [compilacion-web/build-auditoria.meta.json](compilacion-web/build-auditoria.meta.json).

Capacitor sincronizó siete plugins y Gradle recompiló debug con --rerun-tasks, salida 0, duración295.542s. JDK 21.0.12.1, Gradle 8.14.3 y build-tools 35.0.0. Se conservaron avisos sobre versión XML del SDK, operaciones Java sin comprobación y APIs obsoletas, sin suprimirlos. [android/capacitor-sync.stdout.log](android/capacitor-sync.stdout.log), [android/gradle-assemble.meta.json](android/gradle-assemble.meta.json), [android/gradle-assemble.stderr.log](android/gradle-assemble.stderr.log).

APK privado: 35056311bytes, SHA-256 **92fe75484668d024013e39fa703886b93a833e1c40847d560e7ad71226d3e166**. Todos sus 106 archivos web coinciden con el build nuevo; autoactualización externa desactivada y claves placeholder sin validez. El escaneo del ZIP no encontró secretos conocidos. Firma debug y datos de empaquetado se verificaron. No se distribuye el paquete. [android/apk-verificado.json](android/apk-verificado.json), [android/privacidad-apk.json](android/privacidad-apk.json), [android/apk-firma.stdout.log](android/apk-firma.stdout.log), [android/apk-badging.stdout.log](android/apk-badging.stdout.log).

JUnit ejecutó 1 prueba de plantilla en JVM (1 aprobada); no es una prueba del negocio. No se repitieron instrumentación ni las 13 verificaciones WebView autenticadas del antecedente, ni se probó dispositivo físico en esta etapa. [android/junit-resumen.json](android/junit-resumen.json), [../20261029-221208-android-autenticado-317e5e3/INFORME_VERIFICACION_TECNICA.md](../20261029-221208-android-autenticado-317e5e3/INFORME_VERIFICACION_TECNICA.md).

## 9. Limitaciones y pendientes

El servidor Edge local se apagó intencionalmente tras completar las pruebas. Docker stop devolvió0 y functions serve terminó con salida 1 y señal de cierre 15 en stderr; no es un caso E2E fallido. [Cierre intencional](seguridad/cierre-edge.json), [metadatos Docker](seguridad/edge-cierre.meta.json), [metadatos del servidor](edge-functions/serve.meta.json).

Continúan15 avisos npm, mantenimiento del servidor CRA, actualización de deepmerge cuando exista una corrección verificable, aplicación institucional coordinada de SQL/RLS/Edge/clientes, proveedores reales, dispositivo físico y ampliación de categorías de ranking y recuperación de borrados parciales. Las pruebas técnicas no acreditan usabilidad, motivación, USE ni UES-SF. Se mantienen los fallos de reproducción y los nueve expedientes anteriores sin reescribir.

## 10. Integridad y entrega

[RESUMEN_FINAL.json](RESUMEN_FINAL.json), [MATRIZ_VERIFICACIONES_TESIS.md](MATRIZ_VERIFICACIONES_TESIS.md), [RESULTADOS_PARA_TESIS_4_5.md](RESULTADOS_PARA_TESIS_4_5.md). Antes del sello se contrastan cifras originales, hashes de fuentes, referencias, privacidad de texto/HTML y APK privado. Los nombres de usuario en rutas temporales se anonimizan sin cambiar cantidades o estados. El manifiesto SHA-256 excluye únicamente su propia huella; los APK permanecen fuera de Git.

