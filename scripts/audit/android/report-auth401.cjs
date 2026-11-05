'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const h = require('../../e2e/local/harness.cjs');
const read = name => JSON.parse(fs.readFileSync(path.join(h.evidence, name), 'utf8'));
assert.ok(!fs.existsSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json')), 'NEW_EVIDENCE_REQUIRED');
const context = read('CONTEXTO.json'), run = read('android/resultado-intento.json');
const tests = read('android/candidato-actual.json'), apk = read('android/apk-local-compilado.json');
const errors = tests.responses.filter(r => r.status >= 400);
const controlled = read('e2e/cierre-notificaciones-controlado.json');
assert.equal(controlled.passed, 1);
const controlledErrors = controlled.responses.filter(r => r.path === '/rest/v1/gamification_student_achievements' && r.status === 401);
assert.ok(controlledErrors.length > 0 && controlledErrors.every(r => r.localAnonMatch && r.declaredRole === 'anon' && !r.subjectPresent && r.errorCode === '42501'));
const matched = errors.filter(r => r.path === '/rest/v1/gamification_student_achievements' && r.status === 401 && r.errorCode === '42501' && r.completeHeadersRead && !r.observationIncomplete && r.localAnonMatch === true && r.declaredRole === 'anon' && r.subjectPresent === false && /^(?:logout|logged-out):/.test(r.phaseAtStart));
const classification = errors.length === 0 ? 'NO_REPRODUCIDO' : matched.length === errors.length ? 'ANON_DURANTE_CIERRE' : 'REQUIERE_MAS_DIAGNOSTICO';
const tap = fs.readFileSync(path.join(h.evidence, 'unitarias/observacion-auth-verde.stdout.log'), 'utf8');
assert.match(tap, /# tests 6\b/); assert.match(tap, /# pass 6\b/); assert.match(tap, /# fail 0\b/);
const analysis = { at: new Date().toISOString(), baseCommit: context.baseCommit, apkSourceCommit: apk.sourceCommit,
  classification, responses: tests.responses.length, httpErrors: errors.length, anonymousDuringSignout: matched.length,
  otherErrors: errors.length - matched.length, errors, historical401RetrospectivelyAttributed: false,
  observationsAreNotAuthorizationDecisions: true, jwtSignaturesValidatedByClassifier: false,
  newBuild: false, productionChanged: false, credentialsRequested: false,
  native: { executed: tests.executed, passed: tests.passed, failed: tests.failed, notExecuted: tests.notExecuted },
  unit: { executed: 6, passed: 6, failed: 0 }, emulatorStopped: run.emulatorStopped };
analysis.controlled = { executed: 1, passed: 1, achievement401: controlledErrors.length, realResponseDelay: true, browser: 'Chromium escritorio', mechanismReproduced: true };
h.write('ANALISIS_HTTP401.json', analysis);
const conclusion = classification === 'ANON_DURANTE_CIERRE'
  ? `Las ${matched.length} respuestas de error reproducidas procedieron de solicitudes enviadas en fase de cierre o posterior al cierre. La cabecera coincidió exactamente con el anon del laboratorio, sin sub y con rol declarado anon; PostgREST devolvió 42501. Esto identifica solicitudes sin sesión, correctamente rechazadas en esta reproducción. No se observó un 401 con cabecera authenticated en esta ejecución. El clasificador no valida firmas ni concede permisos.`
  : classification === 'NO_REPRODUCIDO'
    ? 'El flujo instrumentado no reprodujo errores HTTP. No permite determinar la causa de los dos 401 históricos; la incidencia conserva ese límite y no se declara corregida.'
    : 'Se reprodujeron respuestas que no cumplen todos los criterios de solicitud anónima durante cierre. La incidencia requiere continuar el diagnóstico; no se modifican permisos o expectativas para aprobarla.';
const link = file => '[' + file + '](' + path.relative(h.evidence, path.join(h.root, file)).replaceAll('\\', '/') + ')';
const prior = '../20261104-225654-android-ota-c9a3079/';
h.write('INFORME_VERIFICACION_TECNICA.md', `# Diagnóstico de HTTP401 de logros en Android local

Proyecto RIOVOLEY. Base de diagnóstico ${context.baseCommit}; inicio UTC ${context.startedAt}. El APK existente procede de ${apk.sourceCommit}, mide ${apk.bytes} bytes y conserva SHA-256 ${apk.sha256}. No se compiló ni firmó otro paquete. Las fuentes de producto no difieren de las del APK; [comprobación Git](android/fuentes-producto-sin-cambios.json). Los cambios del arnés se identifican en [FUENTES_EVALUADAS.json](FUENTES_EVALUADAS.json).

Se investigaron las dos respuestas HTTP401 sin contexto de autenticación documentadas en el [expediente anterior](${prior}INFORME_VERIFICACION_TECNICA.md). Se repitió el flujo de 14 casos sin modificar sus expectativas y se agregó observación de fase, tiempo y clasificación de cabecera. No se publican cabeceras, tokens, sub, correos, cuerpos de sesión, claves o filas de negocio. El rol declarado del JWT no está verificado criptográficamente y se utiliza solo como diagnóstico.

## Entorno, método y comandos

Windows x64 y Node ${process.version}; JDK21, SDK/AVD API36 y herramientas portables reutilizadas del laboratorio. Sus versiones se registraron en el [expediente de compilación](${prior}INFORME_VERIFICACION_TECNICA.md), no se atribuyen nuevas consultas de versión a esta fase. Supabase Auth, REST y PostgreSQL locales reales, con cuentas sintéticas; APK debug con OTA externo desactivado. No hay login o escrituras institucionales. El proxy no reenvía tráfico y las rutas se verifican solo sobre main; no se certifican todas las tablas de políticas. [Perfil](android/perfil-ejecutado.json), [rutas](android/rutas-principales-evaluadas.json).

${link('scripts/audit/android/initialize-auth401.cjs')} preservó punteros y abrió el expediente. Se ejecutaron node --test --test-reporter=tap tests/unit/auth-observation.test.cjs y ${link('scripts/audit/android/launch-local-candidate.cjs')} --existing-build --trace-auth. El launcher comprueba hash y ausencia de diferencias de producto antes de instalar el mismo artefacto en un AVD propio nuevo. ${link('scripts/audit/android/authenticated-webview.cjs')} conserva los 14 casos funcionales y añade metadata observacional. ${link('scripts/audit/android/auth-observation.cjs')} limita sus salidas a categorías y booleanos. [Comandos y códigos de salida](COMANDOS.json).

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| OBS-UNIT | Clasificador sin valores privados; fixtures sintéticas | 6 | 6 | 0 | 0 | APROBADO | [TAP](unitarias/observacion-auth-verde.stdout.log) |
| NATIVE | Repetición WebView/roles/sesiones/recompensa | ${tests.executed} | ${tests.passed} | ${tests.failed} | 0 | ${tests.failed === 0 && tests.notExecuted === 0 ? 'APROBADO' : 'FALLIDO'} | [Casos y respuestas](android/candidato-actual.json) |
| HTTP-OBS | Clasificación de respuestas de error, no casos adicionales | — | — | — | — | ${classification} | [Análisis](ANALISIS_HTTP401.json) |
| CTRL | Reproducción con retardo de respuesta real de anuncios | 1 | 1 | 0 | 0 | MECANISMO REPRODUCIDO | [Prueba controlada](e2e/cierre-notificaciones-controlado.json) |
| WEB/APK | Nueva compilación o firma | 0 | 0 | 0 | 0 | NO EJECUTADO | Reutilización explícita del APK anterior |
| CLOUD | Verificación institucional o proveedores | 0 | 0 | 0 | 0 | NO EJECUTADO | Alcance local sin credenciales nuevas |

No sumar los 6 casos node:test con los 14 nativos ni sumar esta repetición como 14 comportamientos distintos de la anterior. El RED unitario conserva seis fallos por módulo aún no implementado, seguido de seis aprobaciones; [RED](unitarias/observacion-auth-rojo.stdout.log). Quedaron ${tests.notExecuted} casos nativos sin ejecutar y ${tests.cleanupFailures.length} errores de limpieza. El emulador quedó detenido: ${run.emulatorStopped}. [Resultado del launcher](android/resultado-intento.json).

## Resultado del diagnóstico

Se registraron ${tests.responses.length} respuestas locales y ${errors.length} errores HTTP. ${conclusion}

Los datos exactos incluyen phaseAtStart y phaseAtResponse, comparación booleana con anon local, presencia de sub, errorCode y lectura de cabeceras completas para los errores. No se guardan valores originales. [ANALISIS_HTTP401.json](ANALISIS_HTTP401.json) conserva las filas clasificadas. Las dos respuestas del expediente anterior carecían de esa instrumentación: no se les atribuye retrospectivamente una fase o token concreto.

Una prueba controlada adicional en Chromium de escritorio, con el mismo cliente compilado y servicios locales reales, retuvo la entrega de respuestas GET de anuncios ya obtenidas del servidor hasta completar logout y comprobar ausencia de token local. Al liberar las respuestas sin alterar su contenido, la carga de notificaciones continuó con ${controlledErrors.length} GET de logros, enviados como anon local sin sub y rechazados con HTTP401/42501. Esto reproduce un mecanismo causal de continuación tardía después del cierre; no es otra ejecución Android ni datos de backend simulados. [Intervención y resultados](e2e/cierre-notificaciones-controlado.json). Se identificó la cadena de anuncios seguida por logros en ${link('src/features/notifications/application/useCases/createNotificationsUseCases.js')} y la falta de cancelación en ${link('src/features/notifications/presentation/components/NotificationBell.js')}. La corrección del producto y su regresión se realizarán en un expediente posterior para conservar esta evidencia previa intacta.

Como contexto de código, el panel invalida resultados de cargas obsoletas mediante loadVersionRef, mientras el caso de uso puede continuar lecturas asíncronas ya iniciadas. Esa lectura estática es compatible con trabajo pendiente alrededor de una transición de sesión y no prueba, por sí sola, la causa de cada error histórico. ${link('src/features/student-dashboard/presentation/components/StudentPanel.js')}, ${link('src/features/gamification/application/useCases/createGamificationUseCases.js')}, ${link('src/features/gamification/infrastructure/repositories/supabaseGamificationRepository.js')}. No se alteró RLS, grants, sesiones institucionales ni lógica del producto para silenciar respuestas.

La recompensa antes y después está en el JSON nativo y en la [consulta posterior a la parada](integracion/recompensa-tras-parada.json). Las sesiones, restricciones y ausencia de controles OTA se comprobaron en WebView real; no se validan todas las pantallas por ver el shell del panel. [Capturas revisadas](android/capturas-revisadas.json). No se ejecutó una nueva suite Jest completa o build local de producto en esta fase; el CI del commit posterior al sellado se comprobará separadamente.

## Límites y custodia

La observación distingue cabeceras declaradas, no sustituye verificación criptográfica o auditoría integral de autorización. No verifica FCM, Resend, TLS institucional, instalación OTA o un release firmado actualizado. El APK no fue distribuido y producción no se modificó. La transición SQL/Edge/clientes requiere su ventana, responsable y autorización. No se infieren resultados de usabilidad, motivación, USE o UES-SF.

Las fuentes, [privacidad](PRIVACIDAD.json), [integridad](INTEGRIDAD.json) y [manifiesto SHA-256](MANIFIESTO_SHA256.json) documentan esta ejecución. La integridad histórica se comprueba antes de sellar; no sobrescribir expedientes anteriores. Los archivos privados de runtime y el APK permanecen fuera de Git. Los documentos se generan mediante ${link('scripts/audit/android/report-auth401.cjs')} a partir de registros originales; ${link('scripts/audit/android/finalize-auth401.cjs')} valida y sella.
`);
h.write('MATRIZ_VERIFICACIONES_TESIS.md', `# Matriz de trazabilidad del diagnóstico HTTP401

| Categoría Tabla 4-6 | Casos nuevos en esta fase | Resultado y tipo | Dependencias y límites | Evidencia |
|---|---:|---|---|---|
| Caso de uso de gamificación | 1, subconjunto NATIVE | Recompensa diaria, ${tests.cases.find(t => t.code === 'N-student-recompensa')?.state || 'NO EJECUTADO'} | WebView + Auth/REST/PostgreSQL locales reales, sin mocks | [Casos](android/candidato-actual.json) |
| Servicio público de gamificación | 0 casos aislados | No se repite la unidad del servicio | Se observa indirectamente el flujo anterior y las consultas de logros | [Análisis](ANALISIS_HTTP401.json) |
| Identidad del atleta | 0 | NO EJECUTADO | No se atribuye identidad al acceso al panel | [Matriz anterior](${prior}MATRIZ_VERIFICACIONES_TESIS.md) |
| Wallet y monedas | 0 | NO EJECUTADO | XP no equivale a validar monedas | Matriz anterior |
| Tienda cosmética | 0 | NO EJECUTADO | No se compra/equipa | Matriz anterior |
| Asistencia | 0 | NO EJECUTADO | Sin registros nuevos de asistencia | Matriz anterior |
| Pagos | 0 | NO EJECUTADO | Sin registros nuevos de pagos | Matriz anterior |
| Compilación del proyecto | 0 operaciones nuevas | NO EJECUTADO | APK existente con mismo SHA-256 y fuentes de producto sin diferencias | [Recibo](android/apk-local-compilado.json), [Git](android/fuentes-producto-sin-cambios.json) |

Complementos: 6/6 pruebas unitarias sintéticas del clasificador de cabeceras; ${tests.passed}/${tests.executed} casos Playwright Android sobre WebView real; ${errors.length} errores HTTP observados y ${matched.length} clasificados como anon durante cierre. No sumar observaciones como casos funcionales. No se validan servicios de producción ni se cambian permisos. [Informe](INFORME_VERIFICACION_TECNICA.md).

Una prueba controlada adicional de Chromium de escritorio reprodujo la continuación de notificaciones tras logout al retrasar respuestas reales de anuncios, con ${controlledErrors.length} GET anónimos de logros rechazados. Es otro denominador: 1/1 escenarios de reproducción, sin nueva compilación. [Resultado](e2e/cierre-notificaciones-controlado.json).
`);
h.write('RESULTADOS_PARA_TESIS_4_5.md', `# Propuesta académica para revisión

En la continuación diagnóstica de RIOVOLEY, iniciada el 5 de noviembre de 2026 sobre la base ${context.baseCommit.slice(0, 7)}, se reutilizó el APK debug identificado por SHA-256 ${apk.sha256}, sin nueva compilación, y se repitieron ${tests.executed} casos en su WebView real, con ${tests.passed} aprobados, ${tests.failed} fallidos y ${tests.notExecuted} casos planificados no ejecutados. Los servicios Auth, REST y PostgreSQL pertenecieron exclusivamente al laboratorio descartable y no fueron simulados. Por separado, aprobaron seis pruebas unitarias con entradas sintéticas del clasificador de metadata de autenticación. [Casos nativos](android/candidato-actual.json), [unitarias](unitarias/observacion-auth-verde.stdout.log) y [fuentes del artefacto](android/fuentes-producto-sin-cambios.json) sustentan estos resultados.

La instrumentación registró ${tests.responses.length} respuestas locales, con ${errors.length} errores HTTP; el diagnóstico se clasificó como ${classification}. ${conclusion} Los datos originales y las limitaciones constan en [ANALISIS_HTTP401.json](ANALISIS_HTTP401.json). No se atribuye retrospectivamente este contexto a los dos errores históricos que no lo registraron. Las pruebas conservaron sus expectativas y no requirieron cambiar RLS, permisos o lógica del producto. La observación no valida todas las funciones del panel, servicios institucionales, un release firmado actualizado o propiedades de usabilidad y motivación; su alcance técnico se detalla en el [informe](INFORME_VERIFICACION_TECNICA.md).

De forma separada, un escenario controlado en Chromium de escritorio retrasó la entrega de respuestas reales de anuncios hasta completar el cierre de sesión. La carga de notificaciones continuó después del cierre y produjo ${controlledErrors.length} consultas de logros con anon local, rechazadas con HTTP401/42501. Este escenario reprodujo el mecanismo sin modificar respuestas, permisos o lógica del cliente; constituye 1/1 escenarios de reproducción y no se suma al denominador nativo. La [evidencia controlada](e2e/cierre-notificaciones-controlado.json) sustenta la necesidad de cancelar las continuaciones obsoletas; este expediente no declara aplicada la corrección.
`);
console.log(JSON.stringify({ classification, nativePassed: tests.passed, nativeExecuted: tests.executed, httpErrors: errors.length, matched: matched.length, unitCases: 6, documents: 3 }));
