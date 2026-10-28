# Informe de verificación técnica de RIOVOLEY

## 1. Identificación, fechas y estado de trabajo

Repositorio de referencia: https://github.com/Joscoo/riovoley. Proyecto React SPA/CRA, Tailwind, Capacitor Android y Supabase. Commit evaluado: **c71f55e5bc59c528a002c4347fb1664794cb277e**. Se evaluó la copia local de ese commit; no se hizo pull, push, despliegue ni publicación.

Carpeta de ejecución: 20261027-212222-c71f55e. Zona horaria: America/Guayaquil (UTC−05:00). La inspección inicial y las pruebas se realizaron el **27 de octubre de 2026 por la noche**, y la consolidación se continuó el **28 de octubre de 2026** por instrucción del usuario. Los metadatos conservan horas ISO UTC: Jest 2026-10-28T02:23:56.179Z–2026-10-28T02:25:30.636Z; compilación 2026-10-28T02:24:55.947Z–2026-10-28T02:26:41.068Z; Playwright 2026-10-28T02:27:05.730Z–2026-10-28T02:29:28.524Z. Generación del informe: 2026-10-28T13:54:12.875Z. El intervalo de continuidad entre ambos días no se cuenta como duración de pruebas.

La primera inspección de git status no mostró cambios. Al registrar el estado después de crear el arnés ya aparecía auditar.cjs como no versionado ([estado-inicial.stdout.log](estado-inicial.stdout.log)). La comprobación final git diff --exit-code devolvió 0: no hay modificaciones de archivos versionados ([integridad-tracked.meta.json](integridad-tracked.meta.json)). Se añadieron evidencias y dos archivos de prueba, documentados abajo; no se alteró lógica de producción ni se descartaron archivos locales. [estado-final.stdout.log](estado-final.stdout.log) registra ese estado. Los resultados de las pruebas adicionales corresponden al commit más esos archivos nuevos, cuyos hashes se conservan en el inventario final.

## 2. Entorno y configuración

Windows 11, x64; OS reportado 10.0.26300.0, PowerShell 5.1.26100.9711. Node.js **v24.18.0**, npm **11.16.0**, Python 3.11.9 y Git 2.56.0.windows.4. Node es posterior al 22 declarado por los servicios auxiliares; sus comprobaciones locales se ejecutaron con Node 24, sin certificar compatibilidad con Node 22. Java y javac **25.0.4.1** disponibles por PATH; Gradle wrapper **8.14.3**. Android SDK, adb, sdkmanager y emulador no fueron localizados en las rutas verificadas/PATH; Gradle global, Supabase CLI, Deno y psql ausentes en PATH. El wrapper sí está disponible y descargó su distribución al caché local para --version.

Versiones resueltas e instaladas: react 19.2.6; react-dom 19.2.6; react-router-dom 7.15.0; react-scripts 5.0.1; tailwindcss 3.4.19; @playwright/test 1.59.1; @supabase/supabase-js 2.105.4; @capacitor/android 8.4.0; @capacitor/cli 8.4.0; @capacitor/core 8.4.0; jest 27.5.1; @testing-library/react 16.3.2. El README contiene versiones declarativas anteriores: para esta auditoría se usa package-lock y la instalación observada. No se ejecutó npm install ni se modificaron lockfiles.

Se inspeccionaron package.json, package-lock.json, playwright.config.js, capacitor.config.json, src/features, src/shared, tests, Android, database y supabase. La documentación previa [docs/RESTAURACION_PC_2026-10-22.md](../../../../RESTAURACION_PC_2026-10-22.md) se utilizó como antecedente; ninguna cifra anterior se reutiliza como resultado nuevo. Referencias de arquitectura: [README.md](../../../../../README.md), [src/features/README.md](../../../../../src/features/README.md) y los README de features. La carpeta .github/workflows inventariada contiene 0 archivos: no se pudo comprobar una ejecución de CI remota ni validar el workflow referido por el README. CI=true en Jest es solo modo no interactivo local.

Las variables se registraron exclusivamente por nombre y presencia en [inventario.json](inventario.json). La web requiere REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY; se revisaron también flags REACT_APP_*. Los E2E autenticados requieren E2E_ADMIN_EMAIL/PASSWORD, E2E_TRAINER_EMAIL/PASSWORD y E2E_STUDENT_EMAIL/PASSWORD; E2E_BASE_URL es opcional. Los archivos .env.e2e.example y .env.example no acreditan credenciales válidas. Los nombres de variables Deno para Auth, correo y push están en requiredEnvReferences del inventario; no se copiaron valores, archivos .env, tokens ni llaves de firma. Las credenciales existentes **no se probaron**: el usuario confirmó que el backend debe tratarse como producción. Su validez queda desconocida en esta auditoría.

## 3. Alcance, método y estados

Se ejecutaron pruebas locales, compilación, navegador aislado y consultas de lectura al backend autorizado. APROBADO significa que la verificación concreta cumplió sus aserciones; FALLIDO conserva un error o salida no satisfactoria; BLOQUEADO indica requisito de seguridad/entorno no disponible; OMITIDO es un caso que el runner marcó skipped/pending; NO EJECUTADO identifica una verificación que no llegó a iniciarse. “Ejecutado con hallazgos” se reserva para revisiones de configuración sin un denominador de casos automatizados. Un guion en la tabla significa que el concepto no es un caso de prueba.

Los scripts de pruebas descubiertos incluyen npm test (CRA/Jest), npm run test:contracts, npm run test:auth-edge (node:test vía tsx), npm run e2e y las variantes e2e:smoke:* / e2e:filters-sorting:*. No se encontró un runner separado para componentes: Testing Library se ejecuta dentro de Jest. Los contratos de usuario también forman parte de la suite general, aunque no del script test:contracts. No se encontró una batería de integración real PostgreSQL ejecutable sin escrituras institucionales.

Todos los comandos registrados, tiempos, códigos de salida y overrides están en [comandos-ejecutados.json](comandos-ejecutados.json). Los archivos .stdout.log y .stderr.log adyacentes conservan la salida con redacción de datos sensibles. No se muestran secretos en la tabla de comandos. Los resultados MCP se conservan con tool, tiempo y respuesta; MCP no devuelve un código de salida de shell y no se le atribuye uno.

## 4. Resumen verificable

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| U-01 | Jest/Testing Library (83 suites) | 387 | 387 | 0 | 0 | APROBADO | [unitarias/jest-resultados.json](unitarias/jest-resultados.json) |
| U-02 | Node test runner: autenticación y correo Edge | 10 | 10 | 0 | 0 | APROBADO (mocks) | [unitarias/auth-edge.stdout.log](unitarias/auth-edge.stdout.log) |
| C-01 | Script de contratos: 2 suites; subconjunto de U-01 | 5 | 5 | 0 | 0 | APROBADO (mocks) | [integracion/contratos-resultados.json](integracion/contratos-resultados.json) |
| I-01 | Integración local adicional (1 suite) | 5 | 5 | 0 | 0 | APROBADO (memoria) | [integracion/adicionales-resultados.json](integracion/adicionales-resultados.json) |
| I-02 | HTTP local /health: dos servicios | 2 | 2 | 0 | 0 | APROBADO (sin backend) | [integracion/health-resultados.json](integracion/health-resultados.json) |
| E-01 | Responsive público | 35 | 35 | 0 | 0 | APROBADO (red aislada) | [e2e/resultados.json](e2e/resultados.json) |
| E-02 | Navegación pública y teclado | 49 | 49 | 0 | 0 | APROBADO (red aislada) | [e2e/resultados.json](e2e/resultados.json) |
| E-03 | Recuperación Auth simulada | 28 | 28 | 0 | 0 | APROBADO (red aislada) | [e2e/resultados.json](e2e/resultados.json) |
| E-04 | Denegación explícita para sesión anónima | 21 | 14 | 7 | 0 | FALLIDO | [e2e/resultados.json](e2e/resultados.json) |
| E-05 | Roles, navegación y filtros: 112 instancias inventariadas | 0 | 0 | 0 | 0 | BLOQUEADO | [e2e/casos-bloqueados.json](e2e/casos-bloqueados.json) |
| B-01 | Compilación web (1 comando; no son casos de prueba) | — | — | — | — | APROBADO | [compilacion-web/build.meta.json](compilacion-web/build.meta.json) |
| AN-01 | Java, Gradle --version y Capacitor doctor (diagnóstico) | — | — | — | — | APROBADO (solo diagnóstico) | [android/capacitor-doctor.stdout.log](android/capacitor-doctor.stdout.log) |
| AN-02 | Sincronización, APK/AAB y dispositivo | 0 | 0 | 0 | 0 | NO EJECUTADO | [android/alcance.json](android/alcance.json) |
| S-01 | RLS y existencia de política en dos tablas objetivo | 2 | 2 | 0 | 0 | APROBADO (configuración) | [seguridad/catalogos-rls.json](seguridad/catalogos-rls.json) |
| S-02 | Revisión de políticas, grants, vistas y funciones | — | — | — | — | EJECUTADO CON HALLAZGOS | [seguridad/funciones-permisos.json](seguridad/funciones-permisos.json) |
| S-03 | Asesor de seguridad Supabase (1 consulta) | — | — | — | — | EJECUTADO CON HALLAZGOS | [seguridad/asesores.json](seguridad/asesores.json) |
| S-04 | npm audit en raíz, functions y riovoley (3 comandos) | — | — | — | — | FALLIDO (alertas) | [seguridad/npm-audit.json](seguridad/npm-audit.json) |

No se suman denominadores de runners distintos. C-01 repite 5 casos incluidos en los 387 de U-01. Los 3 casos de userManagementRepositoryContract.test.js también están incluidos en U-01. I-01 añade 5 casos distintos ejecutados en otra invocación de Jest: entre ambas hay 392 casos diferentes en 84 archivos, pero la cobertura informada pertenece únicamente a la pasada de 83 suites. Los 10 casos de node:test y los 133 de Playwright se informan por separado. Las 224 instancias del listado inicial de Playwright no son pruebas ejecutadas: el --list las presenta como skipped y eso no se usa como conteo de omisiones.

## 5. Pruebas unitarias y componentes

Comando principal: npm test -- --watchAll=false --runInBand --coverage, con CI=true, reporteros json-summary/json/lcov/text y rutas explícitas a esta carpeta. Resultado: **83/83 suites y 387/387 casos aprobados**, 0 fallidos, 0 pendientes; sin snapshots. Jest informó 81,391 s y la duración del proceso registrado fue 94,457 s; son mediciones diferentes. Las 10 pruebas Edge pasaron aparte en 1,0485 s de runner y 3,201 s de proceso. No se contactó al proveedor de correo desde esas pruebas: global fetch, gateway y Deno.env están simulados.

| Módulo / grupo de U-01 | Suites | Casos | Aprobados | Fallidos | Omitidos |
|---|---:|---:|---:|---:|---:|
| App (placeholder) | 1 | 1 | 1 | 0 | 0 |
| account-admin | 3 | 12 | 12 | 0 | 0 |
| admin-dashboard | 2 | 9 | 9 | 0 | 0 |
| announcements | 2 | 7 | 7 | 0 | 0 |
| athletes | 2 | 14 | 14 | 0 | 0 |
| attendance | 3 | 32 | 32 | 0 | 0 |
| auth-profile | 2 | 5 | 5 | 0 | 0 |
| auth-session | 6 | 19 | 19 | 0 | 0 |
| communications | 3 | 11 | 11 | 0 | 0 |
| config/utils | 2 | 10 | 10 | 0 | 0 |
| gamification | 9 | 60 | 60 | 0 | 0 |
| notifications | 4 | 14 | 14 | 0 | 0 |
| payments | 3 | 38 | 38 | 0 | 0 |
| physical-tests | 2 | 9 | 9 | 0 | 0 |
| reporting | 3 | 7 | 7 | 0 | 0 |
| schedules | 2 | 4 | 4 | 0 | 0 |
| shared | 13 | 45 | 45 | 0 | 0 |
| student-dashboard | 6 | 25 | 25 | 0 | 0 |
| trainer-dashboard | 2 | 4 | 4 | 0 | 0 |
| trainer-management | 2 | 8 | 8 | 0 | 0 |
| training-categories | 1 | 3 | 3 | 0 | 0 |
| user-management | 7 | 30 | 30 | 0 | 0 |
| user-provisioning | 3 | 20 | 20 | 0 | 0 |

La prueba App.test.js es un placeholder expect(true).toBe(true); su aprobación no verifica renderizado de App ni funcionalidades y se identifica separadamente. Las pruebas de componentes usan jsdom y Testing Library, con acciones/repositorios simulados cuando corresponde. Los detalles por archivo, título y estado están en [unitarias/casos-detallados.json](unitarias/casos-detallados.json).

### Cobertura de código

Se instrumentaron 276 archivos según el resumen emitido por CRA/Istanbul. No se estableció un umbral de cobertura ni se presenta como cobertura de todos los posibles comportamientos.

| Métrica | Elementos cubiertos | Denominador instrumentado | Cobertura |
|---|---:|---:|---:|
| lines | 4968 | 12082 | 41,11 % |
| statements | 5300 | 13332 | 39,75 % |
| functions | 1231 | 3468 | 35,49 % |
| branches | 3821 | 11941 | 31,99 % |

Evidencias: [unitarias/coverage/coverage-summary.json](unitarias/coverage/coverage-summary.json), [unitarias/coverage/coverage-final.json](unitarias/coverage/coverage-final.json), [unitarias/coverage/lcov.info](unitarias/coverage/lcov.info) y [unitarias/coverage/lcov-report/index.html](unitarias/coverage/lcov-report/index.html). La cobertura muestra ramas y funciones todavía no ejecutadas; la compilación no cubre ese vacío. El control check:copy-quality también terminó con salida 0, como comprobación independiente de textos, no como prueba funcional.

### Gamificación: quince aspectos solicitados

| Aspecto | Pruebas ejecutadas relacionadas | Qué demuestra y límite |
|---|---|---|
| XP y acumulación | 16 casos del motor + integración I-01 | Cálculos derivados; I-01 verifica movimientos base de 35 XP por asistencia, 90 por pago y 100 por test. No es persistencia real. |
| Niveles y progreso | Motor: deriva progreso y persiste perfil/proyecciones | Hay aserciones de XP positivo, nivel numérico y progreso no negativo. Cobertura parcial: no se prueban todos los umbrales de nivel. |
| Historial XP | Foundation: loadXpLedger; repositorio: replaceXpLedger; I-01 | Formateo, fuentes y deduplicación lógica; llamadas a Supabase simuladas. |
| Rachas | Motor: deriva progreso | Comprueba weekdayAttendanceStreak = 1 en el fixture. No agota fechas límite, zonas horarias ni concurrencia. |
| Logros | Motor: deriva progreso / persiste proyecciones | Verifica first_test, first_payment y logros bloqueados; catálogo y escritura simulados. |
| Retos y campañas | Motor: deriva progreso; administración de gamificación | Proyección de retos/campañas y llamadas de reemplazo; cobertura parcial de metas y ventanas temporales. |
| Clasificación por categoría | Motor: ranking derivado y priorización de categoría; repositorio | Ranking a partir de fixtures y parámetros de consulta; sin snapshots reales. |
| Identidad, título y avatar | Casos de identidad y componentes; categoría 3 de la matriz | Actualización y opciones visuales deterministas con datos ficticios; sin Storage real. |
| Wallet y monedas | Foundation y motor; categoría 4; I-01 | Formato y proyecciones en memoria; no valida inmutabilidad del saldo ni seguridad de escritura. |
| Compra cosmética | Motor y servicio: purchaseCosmeticItem | Delegación y bloqueo de prestigio no desbloqueado; RPC y débito real pendientes. |
| Equipar/desequipar | Motor y servicio: equipCosmeticItem/unequipCosmeticItem | Delegación sin recargar el agregado completo; inventario simulado. |
| Recompensa diaria | Foundation: 3 casos; servicio; I-01 | Premia 8 XP, no duplica en el mismo día y omite usuario sin estudiante. Persistencia simulada o en memoria. |
| Asistencia → gamificación | 19 casos de aplicación de asistencia + I-01 | Mocks en U-01; I-01 conecta registro y motor reales, verifica XP y evita duplicación al actualizar. |
| Pagos → gamificación | 18 casos de aplicación de pagos + I-01 | Mocks en U-01; I-01 verifica registro/modificación y una única fuente de pago en memoria. |
| Evaluación física → gamificación | 6 casos de aplicación física + I-01 | U-01 comprueba la llamada; I-01 verifica creación/modificación y movimiento base único en memoria. |

Los grupos anteriores se solapan: un mismo caso puede comprobar XP, logros e identidad. Sus cantidades no se suman. La trazabilidad nominal está en [trazabilidad-casos.json](trazabilidad-casos.json) y [MATRIZ_VERIFICACIONES_TESIS.md](MATRIZ_VERIFICACIONES_TESIS.md). “Persiste” en nombres originales de pruebas unitarias describe llamadas a mocks, no una transacción PostgreSQL demostrada.

## 6. Contratos e integración

test:contracts ejecutó las pruebas de supabaseReportingRepository.contract.test.js y deleteAuthUserById.test.js: **2 suites, 5 casos aprobados**, 0 fallidos/omitidos, 15,481 s de proceso; los clientes/funciones invocadas son simulados. Los otros 3 contratos estructurales de usuario se ejecutaron dentro de U-01. Un contrato comprobado con un cliente ficticio no acredita que la API remota mantenga el contrato.

Se añadió [src/features/gamification/application/useCases/gamification.audit.integration.test.js](../../../../../src/features/gamification/application/useCases/gamification.audit.integration.test.js). Sus **5/5 casos** conectan createGamificationService y los casos de uso reales de asistencia, pagos y pruebas físicas con repositorios en memoria, reloj fijo y gateway de notificaciones desactivado. Se comprueban movimientos de XP y ausencia de duplicación lógica, incluyendo recompensa diaria. No se reemplaza el motor de gamificación; sí se simulan las fronteras de infraestructura. No se implementa una RPC cosmética ficticia para presentarla como compra validada. Evidencia: [integracion/adicionales-resultados.json](integracion/adicionales-resultados.json).

functions compiló con tsc; los lint de functions y riovoley terminaron con salida 0. Se iniciaron ambos Express en puertos efímeros de loopback y se comprobó /health: **2 respuestas HTTP 200** con status ok, cerrando los servidores. Son comprobaciones HTTP locales reales sin acceso al backend, y no verifican despliegue de Edge Functions, flujos de negocio ni integridad transaccional. Evidencia: [integracion/health-resultados.json](integracion/health-resultados.json).

## 7. Playwright

Configuración original: [playwright.config.js](../../../../../playwright.config.js); configuración específica: [e2e/audit.config.cjs](e2e/audit.config.cjs). Se sirvió el build de producción localmente en 127.0.0.1:3100, con dos workers, sin retries. Se usaron los siete perfiles existentes: 390×844, 430×932, 480×900, 768×1024, 1024×768, 1440×900 y 1920×1080. Los perfiles originales seleccionan Chromium o WebKit; no se probó Firefox. Son navegadores con viewport/dispositivo emulado, no siete dispositivos físicos.

La salida fue **126 aprobados, 7 fallidos, 0 omitidos y 0 flaky, de 133 instancias**. Playwright midió 136,503 s; el proceso completo tardó 142,794 s. Se ejecutaron 19 casos lógicos en siete perfiles: 5 responsive, 7 navegación/teclado, 4 recuperación y 3 guardias anónimas. Los casos públicos verifican overflow, tamaño de controles y superficie de render; los de teclado comprueban main, skip link y gestión del menú. Esto no es una auditoría completa WCAG ni una evaluación de capacidad de interacción con usuarios.

**Aislamiento:** el proxy de navegador apunta al puerto cerrado 127.0.0.1:9 y solo exceptúa localhost/127.0.0.1; service workers bloqueados. Las peticiones externas no llegan al backend institucional. Los tests de recuperación resuelven Auth/REST mediante page.route; incluso el cambio de contraseña de ese flujo es simulado. Las pantallas públicas se ejecutan con la red externa indisponible, por lo que no validan datos públicos remotos, Google Calendar, imágenes externas ni Supabase Auth real. Las trazas y vídeos se deshabilitaron para minimizar captura de cabeceras/tokens; se conservaron siete capturas y contextos del fallo, sin datos personales de sesiones reales.

**E-H01:** el caso nuevo [tests/e2e/audit.protected-routes.spec.js](../../../../../tests/e2e/audit.protected-routes.spec.js) espera denegación explícita para el visitante anónimo. /admin y /entrenador pasaron en los siete perfiles (14/14). /estudiante falló en los siete: se observó “Cargando informacion…” y no la denegación esperada dentro de 10 s. La inspección de StudentPanel identifica loading inicial true y carga condicionada a user.id; sin usuario no se ejecuta el finally que lo desactiva. No se observó divulgación de datos del atleta. No se modificó la expectativa ni el producto para hacer pasar la prueba. Evidencias: [e2e/resultados.json](e2e/resultados.json), [e2e/reporte-html/index.html](e2e/reporte-html/index.html) y [e2e/artefactos/audit.protected-routes-aud-b7ecf--protected-panel-estudiante-desktop-1440/error-context.md](e2e/artefactos/audit.protected-routes-aud-b7ecf--protected-panel-estudiante-desktop-1440/error-context.md).

**Bloqueos:** 112 instancias de la batería original (16 casos lógicos × 7 perfiles) requieren cuentas o interacciones administrativas. Abarcan paneles/roles, navegación de módulos, filtros, búsquedas/ordenación, revisión de asistencia y flujos administrativos controlados. No se lanzaron ni se marcaron aprobadas/skipped. [e2e/casos-bloqueados.json](e2e/casos-bloqueados.json) identifica cada título, archivo y perfil. Faltó un entorno aislado, no se sustituyeron usuarios ni se validaron/cambiaron contraseñas.

## 8. Compilación web

Comando existente npm run build: cross-env CI=false react-scripts build. **Salida 0, Compiled successfully**, duración 105,121 s. Node v24.18.0/npm 11.16.0. Sin errores de compilación. stderr registra DEP0176 (fs.F_OK obsoleto). El script establece CI=false, por lo que una advertencia no se convierte automáticamente en error de CI.

La salida build/ contiene 108 archivos, 35814931 bytes sin comprimir en total; se registraron nombre, tamaño y SHA-256 de cada uno, más asset-manifest. El bundle principal informado fue 207,44 kB gzip. Evidencias: [compilacion-web/build.stdout.log](compilacion-web/build.stdout.log), [compilacion-web/build.stderr.log](compilacion-web/build.stderr.log), [compilacion-web/artefactos.json](compilacion-web/artefactos.json). Los bundles y mapas de build no se duplicaron en el expediente para evitar propagar configuración pública/tokenizada. No se desplegó ni se ejecutó OTA. Compilar prueba transformación/empaquetado, no funcionamiento de todas las funcionalidades.

## 9. Android y Capacitor

appId com.riovoley.app, webDir build, esquema https. Capacitor instalado 8.4.0, AGP 8.13.0, Gradle wrapper 8.14.3, minSdk 24, compileSdk/targetSdk 36. Java/javac 25.0.4.1 sí existen: el antecedente del 22 de octubre ya no describe completamente este entorno. gradlew --version y cap doctor terminaron con 0; el mensaje de doctor sobre Android comprueba dependencias y no equivale a una compilación nativa.

**Sincronización, compilación nativa y pruebas en dispositivo: NO EJECUTADAS.** android/local.properties apunta a D:/Apps/AndroidSDK, que no existe; tampoco se halló el SDK predeterminado del perfil. No hay ANDROID_HOME/ANDROID_SDK_ROOT configurados. JDK 25 requiere Gradle 9.1 o posterior según la [matriz oficial](https://docs.gradle.org/current/userguide/compatibility.html); que --version responda no certifica la combinación actual. No se cambió JDK, Gradle, local.properties, signing ni configuración nativa. No se generó APK/AAB en esta auditoría. La salida React no se contabiliza como build Android.

Existen dos pruebas nativas de ejemplo: ExampleUnitTest suma 2+2 y ExampleInstrumentedTest comprueba un packageName de plantilla; no cubren negocio y no fueron ejecutadas. Quedan pendientes un SDK/API 36 y Build Tools compatibles, una combinación JDK/Gradle soportada, sync y assembleDebug, y un dispositivo o emulador autorizado para instrumentación. Evidencias: [android/alcance.json](android/alcance.json), [android/java.stderr.log](android/java.stderr.log), [android/gradle-wrapper-version.stdout.log](android/gradle-wrapper-version.stdout.log), [android/capacitor-doctor.stdout.log](android/capacitor-doctor.stdout.log) y [inventario.json](inventario.json).

## 10. Seguridad y acceso

**Estado actual confirmado:** gamification.xp_ledger y gamification.login_rewards tienen relrowsecurity=true, relforcerowsecurity=false y una política cada una. Ambas políticas se aplican a authenticated, con USING y WITH CHECK por propietario o personal. Los grants de anon para estas dos tablas son falsos para SELECT/INSERT/UPDATE/DELETE; authenticated dispone de las operaciones descritas en S-H02. No se asumió que la migración local estuviese aplicada: se consultó el catálogo remoto. RLS_FORCED=false por sí solo no demuestra un fallo para anon/authenticated; el propietario y roles privilegiados tienen un tratamiento distinto.

### Hallazgos y alcance de seguridad

Se consultaron metadatos mediante SELECT y el asesor de seguridad; no se leyeron filas de atletas, pagos, credenciales ni sesiones, y no se ejecutaron RPC de negocio. Las definiciones SQL extraídas describen el código desplegado observado, no constituyen ejecución funcional de ese código.

- **S-H01, prioridad alta: RPC de pagos con privilegios.** Las sobrecargas bigint y uuid de public.soft_delete_payment y public.restore_payment son SECURITY DEFINER y tienen EXECUTE para anon. Sus cuerpos observados contienen UPDATE sin comprobar auth.uid() ni el rol del actor. Esto configura una vía potencial de modificación no autorizada; la explotación no fue ejecutada. Evidencias: [seguridad/catalogos-rls.json](seguridad/catalogos-rls.json) y [seguridad/funciones-permisos.json](seguridad/funciones-permisos.json). No todas las funciones marcadas por el asesor tienen el mismo riesgo: admin_insert_user sí comprueba el actor, y las RPC cosméticas comprueban propietario o personal.
- **S-H02, prioridad alta: integridad de recompensas.** Las políticas de xp_ledger, currency_ledger y currency_wallets permiten escrituras al propietario, además del personal; los grants de authenticated incluyen INSERT/UPDATE/DELETE. login_rewards permite INSERT/UPDATE al propio usuario. RLS limita filas, pero estas reglas por sí solas no autentican la procedencia de XP, saldo o fecha de recompensa. Los constraints consultados no validan dicha procedencia; se observó un trigger de deduplicación diaria en xp_ledger. Es una inferencia de riesgo sobre la configuración, sin intentar alterar saldos o XP. Evidencias: [seguridad/catalogos-rls.json](seguridad/catalogos-rls.json) y [seguridad/guardias-y-gamificacion.mcp.json](seguridad/guardias-y-gamificacion.mcp.json).
- **S-H03: asesor Supabase.** Hay advertencias de search_path, funciones privilegiadas ejecutables, protección de contraseñas filtradas desactivada y parches pendientes del motor. La suma de incidencias por grupo no equivale a vulnerabilidades únicas: la misma función puede aparecer en varios grupos.
- **S-H04: dependencias.** Los tres npm audit terminaron con salida 1. Los conteos son registros de paquetes afectados según npm y pueden compartir avisos y dependencias transitivas. No se suman entre proyectos ni equivalen al número de CVE explotables. Incluyen herramientas de desarrollo/compilación. @capacitor/android 8.4.0 aparece afectado por [GHSA-rvm3-566m-v7fv](https://github.com/advisories/GHSA-rvm3-566m-v7fv); el aviso incluye 8.4.3 entre las correcciones. No se actualizó ningún paquete.

Se observaron 43/49 tablas con RLS en el inventario de esquemas de aplicación consultados. Las seis sin RLS son audit.sql_errors, audit.sql_executions, reporting.scheduler_config, security.login_attempts, security.login_blocks y security.users_password_backup. Los grants consultados no conceden SELECT a anon/authenticated en esas seis; las dos tablas de auditoría sí conceden INSERT. Su exposición efectiva debe comprobarse antes de calificar el impacto. La configuración local de schemas de PostgREST no demuestra la configuración remota: current_setting('pgrst.db_schemas', true) devolvió null.

Las 44 vistas de public inventariadas tienen security_invoker=true. En core.users existe la política de propietario para UPDATE y un trigger guard_client_user_fields que restringe cambios de identidad/rol y suspensión; por ello no se infiere una escalada de rol únicamente a partir del grant UPDATE. La función del trigger fue inspeccionada, pero no se provocó un cambio real. Evidencias: [seguridad/columnas-y-triggers.mcp.json](seguridad/columnas-y-triggers.mcp.json) y [seguridad/guardias-y-gamificacion.mcp.json](seguridad/guardias-y-gamificacion.mcp.json).

La presencia de RLS y de políticas no prueba que toda combinación de actor, operación y objeto esté protegida. No se ejecutó database/tests/rls_access_matrix.sql: selecciona usuarios reales y realiza escrituras, aunque termine con rollback. La matriz dinámica de permisos y las transacciones reales permanecen pendientes de un backend descartable. Esta evaluación no es una auditoría completa de penetración ni declara seguridad total.

| Paquete / árbol npm | Bajas | Moderadas | Altas | Críticas | Total del árbol | Evidencia |
|---|---:|---:|---:|---:|---:|---|
| npm-audit | 18 | 11 | 29 | 5 | 63 | [seguridad/npm-audit.json](seguridad/npm-audit.json) |
| npm-audit-functions | 0 | 21 | 15 | 3 | 39 | [seguridad/npm-audit-functions.json](seguridad/npm-audit-functions.json) |
| npm-audit-riovoley | 0 | 1 | 4 | 0 | 5 | [seguridad/npm-audit-riovoley.json](seguridad/npm-audit-riovoley.json) |

| Grupo del asesor Supabase | Nivel | Incidencias del grupo |
|---|---|---:|
| function_search_path_mutable | WARN | 19 |
| extension_in_public | WARN | 1 |
| anon_security_definer_function_executable | WARN | 17 |
| authenticated_security_definer_function_executable | WARN | 19 |
| auth_leaked_password_protection | WARN | 1 |
| vulnerable_postgres_version | WARN | 1 |

## 11. Incidencias, límites y trabajo pendiente

| Incidencia | Estado | Implicación / pendiente |
|---|---|---|
| E-H01: espera anónima en /estudiante | FALLIDO, 7 perfiles | Resolver el estado de carga sin sesión y volver a ejecutar la guardia; no se hizo un cambio de producto durante la auditoría. |
| S-H01: RPC privilegiadas de pagos | Hallazgo de configuración, prioridad alta | Revisar permisos y autorización interna con aprobación expresa; reproducir después en un clon descartable. |
| S-H02: propietario escribe recompensas/saldo | Riesgo inferido, prioridad alta | Revisar frontera de confianza del recálculo; probar integridad y permisos en backend aislado antes de corregir. |
| Alertas npm / asesores | Hallazgos vigentes en el momento de consulta | Evaluar alcance por dependencia y plan de actualización; no se usó audit fix. |
| E2E autenticados y transacciones reales | BLOQUEADOS | Preparar backend y cuentas descartables. La validez de las credenciales de producción no fue comprobada. |
| Android | NO EJECUTADO | SDK y combinación Java/Gradle soportada; luego sync, APK debug e instrumentación. |
| Cobertura parcial | Medida, sin umbral | Cubrir ramas, niveles, tiempo, concurrencia y compra real; App.test.js es placeholder. |
| CI remota / Edge desplegadas | NO EJECUTADO | No hay workflow local verificable ni Deno disponible; no se valida despliegue remoto por compilar functions/ con tsc. |

La ejecución inicial de entorno.ps1 fue bloqueada por la política de ejecución de PowerShell (salida 1). Se preserva ese registro y se obtuvo el inventario mediante un comando inline (salida 0), sin cambiar políticas del sistema. Hubo errores auxiliares de sintaxis al construir comandos/extraer el envoltorio MCP, corregidos antes de obtener los artefactos definitivos; no fueron fallos del producto y no se atribuyen a sus suites. No se registran resultados ficticios para pasos no iniciados.

## 12. Reproducción y evidencias

Desde la raíz del repositorio, con las dependencias instaladas:

1. Revisar [auditar.cjs](auditar.cjs) y [plan-ejecucion.md](plan-ejecucion.md); el backend permanece clasificado como producción. Crear una carpeta nueva para una auditoría nueva: no sobrescribir este expediente.
2. Para repetir los comandos de esta ejecución, los argumentos exactos están en la tabla siguiente y en cada .meta.json. El arnés admite inspect, unit, contracts, edge, audit, audit-functions, build, functions-build, copy, e2e-list y e2e. Los .meta.json identifican cuándo cada comando fue ejecutado, su salida y duración; no basta volver a generar Markdown.
3. Para el navegador, compilar primero, iniciar e2e/servidor-local.cjs en loopback y ejecutar Playwright con e2e/audit.config.cjs. Mantener el proxy cerrado y el filtrado que excluye roles. La guardia /estudiante debe conservar su fallo mientras no se corrija el producto.
4. Las consultas .sql de seguridad son SELECT de metadatos y se pueden repetir mediante una conexión autorizada de lectura. No ejecutar las migraciones ni la matriz SQL con escrituras en producción. get_advisors es una lectura independiente del servicio.
5. [generar-informe.cjs](generar-informe.cjs) deriva tablas y documentos de los JSON reales; [integridad.cjs](integridad.cjs) verifica coherencia, privacidad y hashes. El informe, matriz y propuesta académica se guardan juntos. El documento de tesis no se modificó.

| Comando ejecutado | Directorio | Código de salida | Duración proceso (s) | Metadatos |
|---|---|---:|---:|---|
| C:\Program Files\nodejs\node.exe node_modules/@capacitor/cli/bin/capacitor doctor | . | 0 | 10,489 | [android/capacitor-doctor.meta.json](android/capacitor-doctor.meta.json) |
| D:\Riovoley\riovoley\android\gradlew.bat --version | android | 0 | 27,638 | [android/gradle-wrapper-version.meta.json](android/gradle-wrapper-version.meta.json) |
| java -version | . | 0 | 0,533 | [android/java.meta.json](android/java.meta.json) |
| javac -version | . | 0 | 0,284 | [android/javac.meta.json](android/javac.meta.json) |
| git rev-parse HEAD | . | 0 | 0,07 | [commit.meta.json](commit.meta.json) |
| npm.cmd run build | . | 0 | 105,121 | [compilacion-web/build.meta.json](compilacion-web/build.meta.json) |
| C:\Program Files\nodejs\node.exe node_modules/@playwright/test/cli.js test --list --reporter=json | . | 0 | 11,124 | [e2e/inventario.meta.json](e2e/inventario.meta.json) |
| C:\Program Files\nodejs\node.exe node_modules/@playwright/test/cli.js test --config=docs/tesis/evidencias/verificacion-tecnica/20261027-212222-c71f55e/e2e/audit.config.cjs | . | 1 | 142,794 | [e2e/playwright.meta.json](e2e/playwright.meta.json) |
| powershell.exe -NoProfile -Command $auditProcess = Get-CimInstance Win32_Process -Filter "ProcessId = 18772"; if ($auditProcess -and $auditProcess.CommandLine -like "*servidor-local.cjs*") { Stop-Process -Id 18772; Write-Output "Servidor local de auditoria detenido" } else { Write-Output "Servidor de auditoria ya no activo con ese PID; no se detuvo otro proceso" } | . | 0 | 0,618 | [e2e/servidor-cierre.meta.json](e2e/servidor-cierre.meta.json) |
| git status --short --untracked-files=normal | . | 0 | 0,195 | [estado-final.meta.json](estado-final.meta.json) |
| git status --porcelain=v1 --untracked-files=all | . | 0 | 0,148 | [estado-inicial.meta.json](estado-inicial.meta.json) |
| git --version | . | 0 | 0,18 | [herramientas-git.meta.json](herramientas-git.meta.json) |
| C:\Program Files\nodejs\node.exe --version | . | 0 | 0,049 | [herramientas-node.meta.json](herramientas-node.meta.json) |
| npm.cmd --version | . | 0 | 0,328 | [herramientas-npm.meta.json](herramientas-npm.meta.json) |
| python --version | . | 0 | 0,259 | [herramientas-python.meta.json](herramientas-python.meta.json) |
| powershell.exe -NoProfile -Command [System.Environment]::OSVersion.VersionString $PSVersionTable.PSVersion.ToString() Get-Date -Format o foreach ($auditTool in 'adb','sdkmanager','emulator','gradle','supabase','deno','psql') {     if (Get-Command $auditTool -ErrorAction SilentlyContinue) {         Write-Output ($auditTool + ': disponible')     } else {         Write-Output ($auditTool + ': ausente en PATH')     } }  | . | 0 | 1,205 | [herramientas-sistema-inline.meta.json](herramientas-sistema-inline.meta.json) |
| powershell.exe -NoProfile -File D:\Riovoley\riovoley\docs\tesis\evidencias\verificacion-tecnica\20261027-212222-c71f55e\entorno.ps1 | . | 1 | 0,771 | [herramientas-sistema.meta.json](herramientas-sistema.meta.json) |
| npm.cmd test -- gamification.audit.integration.test.js --watchAll=false --runInBand --json --outputFile=docs/tesis/evidencias/verificacion-tecnica/20261027-212222-c71f55e/integracion/adicionales-resultados.json | . | 0 | 29,927 | [integracion/adicionales.meta.json](integracion/adicionales.meta.json) |
| npm.cmd run test:contracts -- --watchAll=false --runInBand --json --outputFile=docs/tesis/evidencias/verificacion-tecnica/20261027-212222-c71f55e/integracion/contratos-resultados.json | . | 0 | 15,481 | [integracion/contratos.meta.json](integracion/contratos.meta.json) |
| npm.cmd run build | functions | 0 | 13,279 | [integracion/functions-build.meta.json](integracion/functions-build.meta.json) |
| npm.cmd run lint | functions | 0 | 65,001 | [integracion/functions-lint.meta.json](integracion/functions-lint.meta.json) |
| C:\Program Files\nodejs\node.exe docs/tesis/evidencias/verificacion-tecnica/20261027-212222-c71f55e/integracion/health.cjs | . | 0 | 7,346 | [integracion/health.meta.json](integracion/health.meta.json) |
| npm.cmd run lint | riovoley | 0 | 38,985 | [integracion/riovoley-lint.meta.json](integracion/riovoley-lint.meta.json) |
| git diff --exit-code | . | 0 | 0,174 | [integridad-tracked.meta.json](integridad-tracked.meta.json) |
| npm.cmd audit --json | functions | 1 | 8,639 | [seguridad/npm-audit-functions.meta.json](seguridad/npm-audit-functions.meta.json) |
| npm.cmd audit --json | riovoley | 1 | 1,786 | [seguridad/npm-audit-riovoley.meta.json](seguridad/npm-audit-riovoley.meta.json) |
| npm.cmd audit --json | . | 1 | 17,705 | [seguridad/npm-audit.meta.json](seguridad/npm-audit.meta.json) |
| npm.cmd run test:auth-edge | . | 0 | 3,201 | [unitarias/auth-edge.meta.json](unitarias/auth-edge.meta.json) |
| npm.cmd run check:copy-quality | . | 0 | 0,82 | [unitarias/copy-quality.meta.json](unitarias/copy-quality.meta.json) |
| npm.cmd test -- --watchAll=false --runInBand --coverage --coverageDirectory=docs/tesis/evidencias/verificacion-tecnica/20261027-212222-c71f55e/unitarias/coverage --coverageReporters=json-summary --coverageReporters=json --coverageReporters=lcov --coverageReporters=text --json --outputFile=docs/tesis/evidencias/verificacion-tecnica/20261027-212222-c71f55e/unitarias/jest-resultados.json | . | 0 | 94,457 | [unitarias/jest.meta.json](unitarias/jest.meta.json) |

El expediente contiene reportes de cobertura, JSON, logs, HTML de Playwright, capturas y metadatos. Los nombres reales de variables se mantienen y sus valores se omiten. Las redacciones de correos/tokens en copias de evidencia no cambian cantidades ni estados. [INTEGRIDAD.json](INTEGRIDAD.json) y [MANIFIESTO_SHA256.json](MANIFIESTO_SHA256.json) permiten verificar coherencia y conservación de archivos; el manifiesto no se incluye a sí mismo en su lista de hashes. La matriz [MATRIZ_VERIFICACIONES_TESIS.md](MATRIZ_VERIFICACIONES_TESIS.md) y la propuesta [RESULTADOS_PARA_TESIS_4_5.md](RESULTADOS_PARA_TESIS_4_5.md) deben revisarse académicamente antes de incorporarse a la tesis.

