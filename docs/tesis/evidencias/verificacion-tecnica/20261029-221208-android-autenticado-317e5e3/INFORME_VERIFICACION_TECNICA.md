# Verificación técnica complementaria: Android autenticado y dependencias

## 1. Identificación y entorno

RIOVOLEY, repositorio oficial Joscoo/riovoley. Commit base **317e5e3a223b426f0fa30052c65cf697c8076ba3**, rama fix/seguridad-local-20261029; los cambios posteriores se identifican en el inventario de fuentes. Inicio UTC 2026-10-29T22:12:08.883Z; cierre del informe 2026-10-29T23:03:31.906Z. Sistema Windows_NT 10.0.26300, x64; Node v24.18.0, npm 11.16.0. Las horas de terminal usan America/Guayaquil (UTC−5); metadatos ISO en UTC.

Se reutilizaron herramientas privadas: JDK 21, Android SDK/API 36, Gradle 8.14.3 y Capacitor 8, comprobados en los registros Android. No se modificó Java/SDK global. [herramientas-entorno.json](herramientas-entorno.json), [android/java-version.stderr.log](android/java-version.stderr.log), [android/gradle-version.stdout.log](android/gradle-version.stdout.log).

## 2. Alcance y metodología

Esta etapa continúa el [../20261029-135953-seguridad-local-e469db5/INFORME_VERIFICACION_TECNICA.md](../20261029-135953-seguridad-local-e469db5/INFORME_VERIFICACION_TECNICA.md), conservado como antecedente. Se ejecutaron nuevamente Jest, compilación web/nativa, análisis npm y lectura del catálogo PostgreSQL. Se añadió regresión de dependencias y acceso real por rol dentro del WebView Android. Los 249 Playwright de escritorio y las integraciones G/S del expediente anterior no se contabilizan como nuevas ejecuciones aquí.

El backend es exclusivamente riovoley-e2e-local, API 127.0.0.1:55321 y PostgreSQL 127.0.0.1:55322. Se comparó la identidad Auth de la cuenta sintética con auth.users antes de consultar SQL. Las cuentas, claves y herramientas quedan fuera de Git. No se accedió con cuentas institucionales ni se modificó producción.

Variables requeridas: REACT_APP_SUPABASE_URL (loopback), REACT_APP_SUPABASE_ANON_KEY y REACT_APP_PII_ENCRYPTION_KEY del stack descartable; las cuentas de los tres roles residen en credentials.json privado. JAVA_HOME, ANDROID_HOME/ANDROID_SDK_ROOT y GRADLE_USER_HOME apuntan a herramientas/cachés privadas. No se carga .env.e2e institucional; buildWebEnv bloquea las variables REACT_APP de .env antes de que CRA procese dotenv. No se publican valores de claves ni contraseñas.

Comandos reproducibles desde la raíz, después de provisionar el entorno local según scripts/e2e/local/README.md:

~~~powershell
node scripts/audit/android/initialize-followup.cjs
node scripts/audit/android/preflight-followup.cjs
node scripts/audit/android/dependencies-followup.cjs qs
node scripts/audit/android/stage.cjs local-auth
node scripts/audit/android/build.cjs assemble --rerun-tasks
node scripts/audit/android/build.cjs lint --rerun-tasks
node scripts/audit/android/build.cjs version
node scripts/audit/android/collect-private.cjs cierre
node scripts/audit/closure/launch-emulator.cjs
node scripts/audit/closure/instrumentation.cjs cierre
node scripts/audit/android/authenticated-webview.cjs --label=autenticacion-cierre
node scripts/audit/closure/stop-emulator.cjs
node scripts/audit/security/inspect.cjs
node scripts/audit/closure/audit-dependencies.cjs after
~~~

La ejecución completa de Jest y sus argumentos de cobertura están en [unitarias/jest-push-cierre.meta.json](unitarias/jest-push-cierre.meta.json); equivale a react-scripts test --watchAll=false --runInBand --coverage, con reporteros JSON y CI=true. Los archivos .meta.json conservan comando, inicio, fin, duración y código de salida. Las repeticiones son intentos separados y no se suman como casos nuevos.

## 3. Resultados

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| J01 | Jest y Testing Library | 419 | 419 | 0 | 0 | APROBADO | [unitarias/jest-push-cierre.json](unitarias/jest-push-cierre.json) |
| T01 | Regresión y compatibilidad de dependencias, Node test | 6 | 6 | 0 | 0 | APROBADO | [seguridad/compatibilidad-final.stdout.log](seguridad/compatibilidad-final.stdout.log) |
| A01 | Protección del entorno y destino ADB, Node test | 2 | 2 | 0 | 0 | APROBADO | [android/entorno-adb-final-tap.stdout.log](android/entorno-adb-final-tap.stdout.log) |
| N01 | JUnit de plantilla Android | 1 | 1 | 0 | 0 | APROBADO | [android/junit-cierre/resumen.json](android/junit-cierre/resumen.json) |
| N02 | Instrumentación Android de plantilla | 1 | 1 | 0 | 0 | APROBADO | [android/instrumentacion-cierre.json](android/instrumentacion-cierre.json) |
| N03 | APK y flujos dentro del WebView Android | 13 | 13 | 0 | 0 | APROBADO | [android/autenticacion-cierre.json](android/autenticacion-cierre.json) |
| B01 | Compilación web de producción | — | — | — | — | APROBADO | [compilacion-web/build-auditoria-1793314648747.meta.json](compilacion-web/build-auditoria-1793314648747.meta.json) |
| B02 | Sincronización Capacitor Android | — | — | — | — | APROBADO | [android/capacitor-sync-1793314672413.meta.json](android/capacitor-sync-1793314672413.meta.json) |
| B03 | Compilación Android debug real | — | — | — | — | APROBADO | [android/gradle-assemble-1793314674214.meta.json](android/gradle-assemble-1793314674214.meta.json) |
| B04 | Lint Android | — | — | — | — | APROBADO | [android/lint/final/resumen.json](android/lint/final/resumen.json) |
| S01 | Lectura del catálogo RLS/RPC local | — | — | — | — | APROBADO | [seguridad/verificacion-catalogo.json](seguridad/verificacion-catalogo.json) |
| S02 | npm audit de la raíz | — | — | — | — | FALLIDO: avisos pendientes | [seguridad/npm-raiz-after.json](seguridad/npm-raiz-after.json) |
| S03 | npm audit de functions | — | — | — | — | APROBADO | [seguridad/npm-functions-after.json](seguridad/npm-functions-after.json) |
| S04 | npm audit del proyecto auxiliar | — | — | — | — | APROBADO | [seguridad/npm-auxiliar-after.json](seguridad/npm-auxiliar-after.json) |

## 4. Pruebas unitarias, contratos e integración

Jest registró **419/419** casos aprobados en **88 suites**, 0 fallidos y 0 omitidos. Duración del runner 26.125 s; la duración completa del proceso está en su .meta.json. Cobertura: líneas 42.97%, sentencias 41.58%, funciones 36.9% y ramas 33.73%. Es cobertura de las fuentes instrumentadas; no representa porcentaje de requisitos validados. [unitarias/cobertura-push-cierre/coverage-summary.json](unitarias/cobertura-push-cierre/coverage-summary.json).

Las suites de dominio/aplicación, repositorios, componentes y contratos de Jest usan mocks o repositorios en memoria según su implementación; no se atribuye persistencia PostgreSQL a esas llamadas. Los seis casos Node de dependencias ejecutan Underscore, JSONPath, BFJ y Express reales, incluyendo un servidor HTTP efímero en loopback, sin Supabase. Los flujos nativos usan Auth/REST y consulta PostgreSQL local real; no sustituyen las integraciones funcionales G01–G18 del expediente anterior.

Se reprodujeron dos desbordamientos de pila con Underscore 1.13.6 y un TypeError de QS 6.14.3 con arrays comma que contienen null/undefined. Tras fijar Underscore 1.13.8 dentro de JSONPath y QS 6.16.2 dentro de Express, los seis casos finalizaron aprobados. Se conserva el ciclo fallido y el posterior: [seguridad/compatibilidad-underscore-rojo.stdout.log](seguridad/compatibilidad-underscore-rojo.stdout.log), [seguridad/compatibilidad-qs-rojo.stdout.log](seguridad/compatibilidad-qs-rojo.stdout.log), [seguridad/compatibilidad-final.stdout.log](seguridad/compatibilidad-final.stdout.log). Los parches de dependencias no alteraron lógica del producto. Además, la ejecución Android reprodujo un cierre fatal de FirebaseApp en unregister() al salir sin registro push previo (android/crash-logout-inicial.stdout.log y android/autenticacion-corregida.json: tres comprobaciones aprobadas y una fallida). Se corrigió push.js para cancelar solo solicitudes aceptadas por el puente, esperar solicitudes pendientes, respetar una sesión nueva y permitir reintentar un rechazo del puente. Los nueve casos mock de push.lifecycle.test.js forman parte del total Jest; no prueban obtención de token ni entrega FCM. Se conservan el ciclo rojo y las correcciones del fixture de permisos/esperas en unitarias/. El primer borrador del fixture se interrumpió sin conteo válido; el ciclo completo posterior sí produjo JSON. La aceptación de register() no implica que Firebase haya completado getToken(). Referencias primarias: [CVE-2026-27601](https://github.com/advisories/GHSA-qpx9-hpmf-5gmw), [CVE-2026-8723](https://github.com/advisories/GHSA-q8mj-m7cp-5q26), [cambios QS 6.16.2](https://github.com/ljharb/qs/blob/v6.16.2/CHANGELOG.md).

## 5. Playwright y Android

No se repitió la matriz Playwright de escritorio de 249 instancias en esta etapa. Se utilizó Playwright AndroidWebView para controlar el WebView real de com.riovoley.app en el emulador descartable API36. El resultado N03 comprende **13 verificaciones, 13 aprobadas y 0 fallidas**; 0 de las 13 planificadas quedaron no ejecutadas. El JSON enumera cada verificación: identidad del APK instalado, inicio por los tres roles, persistencia tras recarga, denegación por rol, cierre de sesión y recompensa diaria.

La comprobación diaria consulta login_rewards y xp_ledger después del segundo ingreso del atleta y exige un único movimiento de 8 XP para la fecha del servidor. Las cuentas son sintéticas; no hay mocks de Auth/REST/PG. Capturas: android/autenticacion-cierre-admin.png, android/autenticacion-cierre-trainer.png y android/autenticacion-cierre-student.png. La huella instalada se compara con la del APK inspeccionado antes de iniciar los flujos. [android/autenticacion-cierre.json](android/autenticacion-cierre.json).

Se ejecutaron tareas nativas y JUnit con --rerun-tasks y se recompiló el APK tras actualizar los assets web. El último comando de Gradle finalizó con código 0, duración 24.506 s. El APK de depuración tiene **36690375 bytes**, SHA-256 **4e6c5741f411861410db71cc31e8a8880040d63de2a4868222cc1d345c9a0301**; permanece exclusivamente en runtime privado. La inspección también compara push.js de los mapas de fuentes empaquetados con el archivo actual. Se publican metadatos e inspección de todos sus 646 miembros ZIP; coincidencias prohibidas: 0. [android/apk-privado-inspeccion-cierre.json](android/apk-privado-inspeccion-cierre.json), [android/apk-firma-cierre.stdout.log](android/apk-firma-cierre.stdout.log), [android/apk-badging-cierre.stdout.log](android/apk-badging-cierre.stdout.log).

El paquete contiene únicamente claves anon/PII del entorno local para esta prueba y por ello no se distribuye. La copia privada habilita mixed content y HTTP solo al loopback, conectado por adb reverse. Esa configuración no se incorpora a android/ ni valida TLS institucional. [La documentación de Capacitor limita estas opciones al desarrollo](https://capacitorjs.com/docs/config). Se desactivó OTA y se fijaron sus URLs a un puerto loopback cerrado; se denegó el permiso de notificaciones antes del login. No se verificó FCM, Resend, OTA externo ni dispositivo físico. El arnés retira el túnel y sus flags al finalizar; los errores de limpieza se registran de forma independiente.

Las pruebas JUnit e instrumentada son verificaciones de plantilla (aritmética y applicationId) con denominadores separados; no equivalen a pruebas de los módulos de negocio. Lint: **0 errores y 27 advertencias**; desglose en [android/lint/final/resumen.json](android/lint/final/resumen.json).

## 6. Compilación web

react-scripts/scripts/build.js produjo el bundle de producción con variables locales, código 0, 23.663 s, en la copia privada project/build-safe; Capacitor lo copió a assets/public. Se conservaron los registros íntegros: [compilacion-web/build-auditoria-1793314648747.stdout.log](compilacion-web/build-auditoria-1793314648747.stdout.log), [compilacion-web/build-auditoria-1793314648747.stderr.log](compilacion-web/build-auditoria-1793314648747.stderr.log). El comando usa CI=false como el script npm del repositorio; las advertencias no se confunden con errores. El build no prueba todas las funcionalidades.

## 7. Seguridad, incidencias y pendientes

La lectura actual confirma RLS en gamification.xp_ledger, login_rewards, currency_wallets y currency_ledger, además de comprobar privilegios concretos de RPC de pagos. Se inventariaron 272 políticas; su existencia no demuestra por sí sola que todas sean correctas. No se ejecutaron cambios de esquema ni permisos institucionales.

npm audit pasó de 35 a **31 dependencias señaladas**: 10 altas, 5 moderadas, 16 bajas y 0 críticas. Son paquetes marcados por npm, no una suma de CVE únicos ni una demostración de explotación. functions y el árbol auxiliar registran 0 y 0, respectivamente, sobre sus propios denominadores publicados en los JSON. No se utilizó --force. Quedan avisos de la cadena CRA/Jest/SVGO/PostCSS/Workbox y servidor de desarrollo; se requiere evaluar actualizaciones de herramientas incompatibles con las versiones fijadas, sin sustituir react-scripts por 0.0.0.

El backend estaba detenido y luego en recuperación al inicio; se continuó tras verificar su identidad. La falta de memoria obligó a detener temporalmente el emulador. Un segundo stage terminó con código 1 al intentar reutilizar un nombre de evidencia; build y sync habían terminado con código 0. Se corrigió la generación del nombre y el siguiente stage concluyó correctamente. Se conserva [android/incidencias-entorno.json](android/incidencias-entorno.json). El primer control de AVD quedó bloqueado antes de ejecutar casos por el doble retorno de carro de la salida ADB en Windows; se normalizó el final de línea sin cambiar el nombre permitido y se conservó el intento (android/autenticacion-final.json). El primer lint detectó la ausencia de includeSubdomains en el perfil de red debug privado; se conservó el informe inicial, se añadió includeSubdomains=false y se repitieron compilación y lint sin suprimir la regla (android/correccion-lint-local.json). El ciclo del guard ADB también se conserva en android/entorno-adb-rojo.stdout.log y android/entorno-adb-verde.stdout.log.

Pendientes que afectan las conclusiones: autorización y aplicación institucional coordinada de SQL/Edge/clientes; 31 dependencias señaladas; proveedor externo de correo y push; dispositivo físico y matriz nativa ampliada; clasificación deportiva en otras categorías/métricas; recuperación distribuida ante fallo parcial de borrado. No se declara una auditoría de penetración completa ni se infieren usabilidad, motivación, USE o UES-SF.

## 8. Evidencias e integridad

[RESUMEN_FINAL.json](RESUMEN_FINAL.json) contiene cifras derivadas de los registros. [MATRIZ_VERIFICACIONES_TESIS.md](MATRIZ_VERIFICACIONES_TESIS.md) relaciona la Tabla4-6; [RESULTADOS_PARA_TESIS_4_5.md](RESULTADOS_PARA_TESIS_4_5.md) es una propuesta de redacción, sin modificar el documento de tesis. El cierre conserva inventario SHA-256, privacidad e integridad. No hay APK, contraseñas, tokens ni datos institucionales en la entrega pública.

