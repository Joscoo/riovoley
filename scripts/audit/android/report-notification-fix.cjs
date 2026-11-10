'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const h = require('../../e2e/local/harness.cjs'), read = name => JSON.parse(fs.readFileSync(path.join(h.evidence, name), 'utf8'));
assert.ok(!fs.existsSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json')), 'NEW_EVIDENCE_REQUIRED');
const context = read('CONTEXTO.json'), jest = read('unitarias/jest-definitivo.json');
const coverage = read('unitarias/cobertura-jest-definitivo/coverage-summary.json').total;
const apk = read('android/apk-local-compilado.json'), inspection = read('android/apk-local-inspeccion-cierre.json');
const native = read('android/candidato-actual.json'), runtime = read('android/resultado-intento.json');
const controlled = read('e2e/cierre-notificaciones-corregido.json'), build = read('android/reconstruccion-corregida-comando.meta.json');
const jestMeta = read('unitarias/jest-definitivo.meta.json'), nativeMeta = read('android/autenticacion-candidato-comando.meta.json');
const webMeta = read('android/local-web-build.meta.json'), syncMeta = read('android/local-capacitor-sync.meta.json'), gradleMeta = read('android/local-gradle.meta.json');
const tools = JSON.parse(fs.readFileSync(path.join(h.evidence, 'seguridad/herramientas-actuales-corregido.stdout.log'), 'utf8'));
const notif = jest.testResults.filter(t => t.name.replaceAll('\\', '/').includes('/features/notifications/'));
const notifCases = notif.reduce((n, t) => n + t.assertionResults.length, 0);
const allCases = jest.testResults.flatMap(t => t.assertionResults.map(c => ({ file: path.relative(h.root, t.name).replaceAll('\\', '/'), name: c.fullName, status: c.status })));
const gamma = allCases.filter(c => c.file.includes('/gamification/'));
const groups = [
  ['Caso de uso de gamificación', gamma.filter(c => /application\/useCases\/(createGamificationUseCases|createGamificationFoundationUseCases|gamification.audit.integration)\.test\.js$/.test(c.file))],
  ['Servicio público de gamificación', gamma.filter(c => c.file.endsWith('/presentation/createGamificationService.test.js'))],
  ['Identidad del atleta', allCases.filter(c => /IdentityPortrait\.test|StudentProfileIdentityCard\.test/.test(c.file) || (c.file.includes('/gamification/') && /identity|avatar|apodo|titulo/i.test(c.name)))],
  ['Wallet y monedas', gamma.filter(c => /wallet|currency|monedas/i.test(c.name))],
  ['Tienda cosmética', gamma.filter(c => /cosmeticVisuals\.test/.test(c.file) || /purchase|equip|cosmetic/i.test(c.name))],
  ['Asistencia', allCases.filter(c => c.file.includes('/attendance/') || (c.file.endsWith('gamification.audit.integration.test.js') && /asistencia/i.test(c.name)))],
  ['Pagos', allCases.filter(c => c.file.includes('/payments/') || (c.file.endsWith('gamification.audit.integration.test.js') && /pago/i.test(c.name)))],
];
assert.equal(jest.numPassedTests, 434); assert.equal(jest.numTotalTestSuites, 91);
assert.equal(controlled.passed, 1); assert.equal(controlled.lateAchievementRequests.length, 0);
const errors = native.responses.filter(r => r.status >= 400);
const result = { at: new Date().toISOString(), baseCommit: context.baseCommit, compiledSourceCommit: apk.sourceCommit,
  jest: { cases: jest.numTotalTests, passed: jest.numPassedTests, failed: jest.numFailedTests, omitted: jest.numPendingTests, suites: jest.numTotalTestSuites },
  notificationsSubset: { cases: notifCases, suites: notif.length, newRegressionCases: 8 }, coverage,
  native: { executed: native.executed, passed: native.passed, failed: native.failed, notExecuted: native.notExecuted, httpResponses: native.responses.length, httpErrors: errors.length, cleanupFailures: native.cleanupFailures.length, otaUi: native.cases.find(c => c.code === 'N-ota-oculto')?.state || 'NO_EJECUTADO' },
  controlled: { cases: 1, passed: controlled.passed, failed: controlled.failed, observationWindowMs: controlled.absenceObservationWindowMs, lateAchievementRequests: 0 },
  build: { exitCode: build.exitCode, seconds: build.durationSeconds, apkBytes: apk.bytes, sha256: apk.sha256, webFilesMatching: inspection.matchingWebFiles },
  junitTemplateCases: inspection.junit.tests, emulatorStopped: runtime.emulatorStopped,
  productChange: 'Cancelacion cooperativa de carga de campana: cleanup/reload -> AbortSignal -> comprobaciones entre awaits.',
  productionChanged: false, credentialsRequested: false, releaseSignedOrPublished: false };
result.groups = groups.map(([category, cases]) => ({ category, executed: cases.length, passed: cases.filter(c => c.status === 'passed').length, cases }));
h.write('RESULTADOS_AUTOMATIZADOS.json', result);
const source = file => '[' + file + '](' + path.relative(h.evidence, path.join(h.root, file)).replaceAll('\\', '/') + ')';
const prior = '../20261105-151232-http401-726602a/';
h.write('INFORME_VERIFICACION_TECNICA.md', `# Corrección de cargas de notificaciones tras cierre de sesión

RIOVOLEY. Base de trabajo ${context.baseCommit}; inicio UTC ${context.startedAt}. Fuentes del APK corregido: ${apk.sourceCommit}. Las fuentes del producto se confirmaron en Git después de aprobar Jest y antes de compilar; el expediente y el arnés se publican en un commit posterior. [Fuentes y hashes](FUENTES_EVALUADAS.json), [contexto](CONTEXTO.json).

## Problema y cambio

El [diagnóstico previo](${prior}INFORME_VERIFICACION_TECNICA.md) no reprodujo los errores en una repetición nativa sin intervención (14/14, 298 respuestas sin error). Un escenario controlado de Chromium retuvo respuestas reales de anuncios hasta completar logout y reprodujo consultas anónimas de logros rechazadas con HTTP401/42501. No se atribuyó retrospectivamente esa fase a los dos errores históricos que no la registraron. La corrección se dirige a la continuación asíncrona obsoleta identificada, no a abrir permisos.

${source('src/features/notifications/presentation/components/NotificationBell.js')} ahora cancela la carga al desmontar, cambiar usuario/rol o iniciar otra recarga y evita aplicar resultados/errores de cargas canceladas. ${source('src/features/notifications/presentation/createNotificationsService.js')} pasa AbortSignal opcional; ${source('src/features/notifications/application/useCases/createNotificationsUseCases.js')} lo comprueba antes de iniciar y después de cada await de esa carga. La cancelación es cooperativa: detiene lecturas posteriores y actualizaciones obsoletas; no promete interrumpir HTTP ya enviado. Las cargas activas y los errores reales conservan su tratamiento. No se cambió Supabase, RLS, grants, credenciales o lógica de pagos/asistencias.

El test de acceso de NotificationBell conserva el mismo rol y usuario y exige además un AbortSignal real, conforme al contrato extendido. No se eliminó una restricción de acceso para aprobarlo. La revisión independiente detectó una comprobación ausente tras el await exterior del helper de pagos; una regresión de microtareas falló antes de corregirla. La revisión posterior no encontró bloqueantes. [Revisión](seguridad/revision-codigo.json), [RED de microtarea](unitarias/microtarea-rojo.json).

## Método y entorno

Windows ${tools.os} x64; Node ${tools.node} y npm ${tools.npm} según la [consulta actual](seguridad/herramientas-actuales-corregido.stdout.log), JDK21 y SDK/AVD API36 portables del laboratorio, Gradle8.14.3 según el entorno de compilación previo. Las versiones no se actualizan en esta fase. La primera consulta de versiones falló con código 1 porque el entorno mínimo no incluía ComSpec; se conservó el error y se corrigió la ruta de cmd.exe usando SystemRoot, con código 0. No fue un fallo del producto. Jest/Testing Library con dependencias simuladas e inputs sintéticos; CRA con CI=true y dotenv desactivado. El build nativo se hace en copia privada, omitiendo keystore institucional y google-services.json, con OTA automático desactivado y endpoints loopback cerrados. Auth/REST/PostgreSQL y cuentas sintéticas del laboratorio para los E2E, sin servicios institucionales. [Comandos exactos, tiempos y códigos](COMANDOS.json).

Se ejecutaron ${source('scripts/audit/production/run-operational-jest.cjs')} --label=jest-definitivo; build-local-android.cjs (CRA, Capacitor sync android, :app:assembleDebug :app:testDebugUnitTest --offline); inspecciones ZIP/firma/privacidad; ${source('scripts/audit/android/reproduce-notification-signout.cjs')} --expect-cancelled; launch-local-candidate.cjs --current-build --trace-auth. El APK no se distribuye.

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| JEST | Regresión completa, 91 suites | 434 | 434 | 0 | 0 | APROBADO | [JSON](unitarias/jest-definitivo.json) |
| NOTIF | Módulo notificaciones; subconjunto JEST | ${notifCases} | ${notifCases} | 0 | 0 | APROBADO | JSON JEST, ocho casos nuevos separados |
| CTRL | Regresión con entrega retardada de anuncios reales | 1 | 1 | 0 | 0 | APROBADO | [Resultado](e2e/cierre-notificaciones-corregido.json) |
| NATIVE | WebView real/Auth/REST/PostgreSQL locales | ${native.executed} | ${native.passed} | ${native.failed} | 0 | ${native.failed === 0 && native.notExecuted === 0 ? 'APROBADO' : 'FALLIDO'} | [Casos](android/candidato-actual.json) |
| GUARD | Perfil, rutas y privacidad del clasificador | 19 | 19 | 0 | 0 | APROBADO | [TAP](unitarias/guardas-locales-finales.stdout.log) |
| JUNIT | Operación aritmética de plantilla | ${inspection.junit.tests} | 1 | 0 | 0 | APROBADO | [Inspección](android/apk-local-inspeccion-cierre.json) |
| BUILD | Compilación web, sync y APK debug (operaciones) | — | — | — | — | APROBADO | [Metadatos](android/reconstruccion-corregida-comando.meta.json) |
| PROD | Release firmado y transición institucional | 0 | 0 | 0 | 0 | NO EJECUTADO | Sin claves nuevas, firma release o despliegue |

No sumar denominadores de herramientas o subconjuntos. Jest final duró ${jestMeta.durationSeconds} s; el comando WebView nativo, ${nativeMeta.durationSeconds} s, sin incluir el arranque del AVD. El caso de App.test.js preexistente es placeholder y no demuestra comportamiento funcional. Los contratos e integración en memoria existentes se repitieron dentro de Jest; sus mocks no demuestran persistencia. Los ocho casos nuevos comprueban señal preabortada, cancelación en pagos/anuncios/continuación exterior, carga activa y ciclo de vida/resultados obsoletos del componente.

El RED inicial ejecutó seis casos (uno aprobado y cinco fallidos), y la primera implementación aprobó 20 casos de notificaciones y una regresión completa de 432 casos. Después de la revisión se añadieron dos regresiones y se corrigió el salto entre promesas: la ejecución final es 434/434 en 91 suites; se conservan los intentos previos sin sobrescribirlos. [RED inicial](unitarias/cancelacion-rojo.json), [primer verde](unitarias/cancelacion-verde.json), [432 previos](unitarias/jest-cierre.json), [final](unitarias/jest-definitivo.json).

Cobertura instrumentada final: líneas ${coverage.lines.covered}/${coverage.lines.total} (${coverage.lines.pct} %), sentencias ${coverage.statements.covered}/${coverage.statements.total} (${coverage.statements.pct} %), funciones ${coverage.functions.covered}/${coverage.functions.total} (${coverage.functions.pct} %) y ramas ${coverage.branches.covered}/${coverage.branches.total} (${coverage.branches.pct} %). Corresponde al conjunto instrumentado por la configuración efectiva; no es porcentaje de funciones del sistema ni de preparación productiva. [Resumen original](unitarias/cobertura-jest-definitivo/coverage-summary.json).

## Cliente compilado y Android

El escenario controlado conserva respuestas reales sin modificar contenido ni permisos y cambia explícitamente su expectativa: en la versión previa se buscaba reproducir la consulta tardía; en la corregida se exige que no se inicie una nueva consulta de logros después de cancelar. Se observaron cero durante ${controlled.absenceObservationWindowMs} ms tras liberar las respuestas. La ventana es acotada y no prueba todos los posibles intercalados. Se mantienen las pruebas previas y las regresiones unitarias deterministas de cancelación. Es Chromium de escritorio con viewport móvil, no otra ejecución Android. [Intervención y resultado](e2e/cierre-notificaciones-corregido.json).

El APK mide ${apk.bytes} bytes y su SHA-256 es ${apk.sha256}. Los ${inspection.webFiles} archivos web coinciden con los ${inspection.matchingWebFiles} empaquetados. Reconstrucción: ${build.durationSeconds} s, código 0; React ${webMeta.durationSeconds} s, sincronización ${syncMeta.durationSeconds} s y Gradle ${gradleMeta.durationSeconds} s. El total incluye copias e inspecciones. [Recibo](android/apk-local-compilado.json), [ZIP/JUnit](android/apk-local-inspeccion-cierre.json). La firma es debug, no la identidad institucional. El único JUnit es addition_isCorrect y se separa de los casos funcionales. Los avisos reales de Node/Gradle/Kotlin permanecen en los [logs](android/gradle.stdout.log); no se editó node_modules para eliminarlos.

El APK corregido ejecutó ${native.executed} casos nativos, ${native.passed} aprobados y ${native.failed} fallidos, con ${native.notExecuted} no ejecutados y ${native.cleanupFailures.length} errores de limpieza. Se registraron ${native.responses.length} respuestas locales, ${errors.length} con HTTP >=400. Esto no valida todas las pantallas internas: las capturas pueden mostrar estados de carga. [Revisión visual](android/capturas-revisadas.json). La consulta posterior confirmó la recompensa diaria y el movimiento único de XP; [consulta tras parada](integracion/recompensa-tras-parada.json). El emulador propio quedó detenido: ${runtime.emulatorStopped}. El proxy no reenvía y las rutas se comprueban sobre main, sin certificar todas las tablas de políticas.

## Límites y entrega

La corrección no altera permisos, no valida proveedores externos, FCM, correo, recuperación real con token o instalación OTA. La firma de un release actualizado y la transición coordinada de SQL/Edge/clientes permanecen pendientes. No se cambió producción ni se publicaron paquetes. Las pruebas técnicas no sustentan resultados de usabilidad, motivación, USE o UES-SF.

Los tres documentos se generan desde JSON originales mediante ${source('scripts/audit/android/report-notification-fix.cjs')}. El [manifiesto](MANIFIESTO_SHA256.json), la [integridad](INTEGRIDAD.json) y la [privacidad](PRIVACIDAD.json) respaldan la custodia. El APK y los volcados completos permanecen privados. El CI del commit que incluya el expediente se comprueba después del sellado, sin alterar este paquete.
`);
h.write('MATRIZ_VERIFICACIONES_TESIS.md', `# Matriz de trazabilidad: corrección de notificaciones

| Categoría Tabla 4-6 | Archivos/flujo | Casos en esta ejecución | Resultado real | Tipo y dependencias | Límites/evidencia |
|---|---|---:|---|---|---|
${groups.map(([category, cases]) => `| ${category} | ${[...new Set(cases.map(c => c.file))].map(source).join('<br>')} | ${cases.length} | ${cases.filter(c => c.status === 'passed').length} aprobados | Unitarias/componentes y, cuando corresponde, integración en memoria; dependencias simuladas | [Selección exacta](RESULTADOS_AUTOMATIZADOS.json); no demuestra persistencia PostgreSQL |`).join('\n')}
| Compilación del proyecto | CRA + Capacitor + Gradle debug | Tres operaciones, código 0 | APROBADO | Compilación web y Android reales | [Recibo](android/apk-local-compilado.json), [metadatos](COMANDOS.json) |

Las categorías funcionales se solapan y no se suman. El [inventario por archivo](unitarias/jest-definitivo.json) contiene nombres y estado de cada caso; la selección exacta por categoría se conserva en [RESULTADOS_AUTOMATIZADOS.json](RESULTADOS_AUTOMATIZADOS.json). Complementos nuevos: ocho regresiones de notificaciones dentro de los 434 casos Jest, un escenario controlado Chromium aprobado y ${native.passed}/${native.executed} casos WebView Android con Auth/REST/PostgreSQL locales reales, incluido un caso de recompensa diaria independiente del denominador unitario; 19 guardas node:test usan entradas sintéticas y un JUnit de plantilla se registra aparte. No se ejecutan cambios de permisos o despliegues. [Informe](INFORME_VERIFICACION_TECNICA.md).
`);
h.write('RESULTADOS_PARA_TESIS_4_5.md', `# Propuesta académica para revisión

La verificación complementaria identificó y corrigió una continuación de la carga de notificaciones que podía consultar logros después del cierre de sesión. La reproducción controlada previa retrasó respuestas reales de anuncios y observó consultas anónimas rechazadas con HTTP401/42501; no se atribuye retrospectivamente esa fase a los dos errores históricos sin instrumentación. La corrección propaga una señal de cancelación desde el componente hacia el servicio y caso de uso, comprueba su estado entre operaciones asíncronas y evita aplicar resultados obsoletos. No requirió modificar RLS, permisos o credenciales. Tras el cambio, se aprobaron 434 casos Jest en 91 suites, incluidos ocho casos nuevos de regresión; el total conserva un caso placeholder preexistente. La cobertura instrumentada final fue ${coverage.lines.pct} % de líneas, ${coverage.statements.pct} % de sentencias, ${coverage.functions.pct} % de funciones y ${coverage.branches.pct} % de ramas. [Jest original](unitarias/jest-definitivo.json) y [cobertura](unitarias/cobertura-jest-definitivo/coverage-summary.json).

El escenario controlado del cliente corregido no inició consultas tardías de logros durante la ventana de ${controlled.absenceObservationWindowMs} ms posterior a la entrega de las respuestas retenidas; ese resultado corresponde a un escenario Chromium y no a cobertura universal de concurrencia. Se compiló además un APK debug desde ${apk.sourceCommit.slice(0, 7)}, con ${inspection.webFiles} archivos web coincidentes con los empaquetados, y se ejecutaron ${native.executed} casos en su WebView con Auth, REST y PostgreSQL locales reales: ${native.passed} aprobados, ${native.failed} fallidos y ${native.notExecuted} planificados no ejecutados. Los 19 controles node:test y el caso JUnit aritmético de plantilla tienen denominadores separados. [Regresión controlada](e2e/cierre-notificaciones-corregido.json), [recibo Android](android/apk-local-compilado.json) y [casos nativos](android/candidato-actual.json). Estos resultados sustentan la corrección y su verificación local; no equivalen a validación integral de producción, servicios externos, usabilidad o motivación. Un release firmado actualizado y la transición institucional coordinada permanecen pendientes.
`);
console.log(JSON.stringify({ documents: 3, jest: result.jest, native: result.native, controlled: result.controlled }));
