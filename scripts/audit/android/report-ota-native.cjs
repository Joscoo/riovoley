'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const h = require('../../e2e/local/harness.cjs');
const read = name => JSON.parse(fs.readFileSync(path.join(h.evidence, name), 'utf8'));
const exists = name => fs.existsSync(path.join(h.evidence, name));
assert.ok(!exists('MANIFIESTO_SHA256.json'), 'NEW_EVIDENCE_REQUIRED');
const context = read('CONTEXTO.json'), apk = read('android/apk-local-compilado.json');
const inspection = read('android/apk-local-inspeccion-cierre.json'), source = read('android/fuentes-y-artefacto.json');
const build = read('android/reconstruccion-local-comando.meta.json'), web = read('android/local-web-build.meta.json');
const sync = read('android/local-capacitor-sync.meta.json'), gradle = read('android/local-gradle.meta.json');
const runtime = read('android/resultado-intento.json');
const probes = read('integracion/sondas-logros-locales.json');
assert.equal(probes.results.length, 4);
assert.ok([401, 403].includes(probes.results[0].status));
assert.ok(probes.results.slice(1).every(p => p.status === 200));
const cases = exists('android/candidato-actual.json') ? read('android/candidato-actual.json') : { planned: 14, executed: 0, passed: 0, failed: 0, notExecuted: 14, cases: [], cleanupFailures: [] };
const tap = fs.readFileSync(path.join(h.evidence, 'unitarias/guardas-android-local.stdout.log'), 'utf8');
const count = key => Number(tap.match(new RegExp('# ' + key + ' ([0-9]+)'))?.[1]);
assert.equal(count('tests'), 13); assert.equal(count('pass'), 13); assert.equal(count('fail'), 0);
const ui = cases.cases.find(c => c.code === 'N-ota-oculto');
const result = { recordedAt: new Date().toISOString(), baseCommit: context.baseCommit,
  build: { exitCode: build.exitCode, durationSeconds: build.durationSeconds, webSeconds: web.durationSeconds, syncSeconds: sync.durationSeconds, gradleSeconds: gradle.durationSeconds },
  apk: { sha256: apk.sha256, bytes: apk.bytes, sourceCommit: apk.sourceCommit, debug: true, signatureVerified: apk.signatureVerified },
  junit: inspection.junit, guards: { tests: 13, passed: 13, failed: 0, skipped: 0 },
  native: { planned: cases.planned, executed: cases.executed, passed: cases.passed, failed: cases.failed, notExecuted: cases.notExecuted, cleanupFailures: cases.cleanupFailures.length, otaUi: ui?.state || 'NO_EJECUTADO', emulatorStopped: runtime.emulatorStopped },
  responses: { total: (cases.responses || []).length, http400OrMore: (cases.responses || []).filter(r => r.status >= 400).length },
  achievementReadProbes: { executed: 4, passed: 4, native401CauseAttributed: false },
  priorStaticChecksFailed: 2, staticCheckCorrection: 'La ausencia del literal OTA no es requisito de visibilidad; CRA con bandera omitida conserva texto protegido. Se mantiene la expectativa de ausencia del botón en WebView.',
  networkScope: { mainTableOnly: true, allPolicyTablesCertified: false, proxyForwardsNothing: true },
  productionChanged: false, institutionalWrites: false, releaseSignedOrPublished: false,
  sourcesChanged: 'Solo arnes y documentación; fuentes de producto sin cambios desde c9a3079.' };
h.write('RESULTADOS_AUTOMATIZADOS.json', result);
const nativeState = !runtime.failed && cases.executed === 14 && cases.passed === 14 && cases.cleanupFailures.length === 0 ? 'APROBADO' : (cases.executed ? 'FALLIDO' : 'BLOQUEADO');
const sourceLink = file => '[' + file + '](' + path.relative(h.evidence, path.join(h.root, file)).replaceAll('\\', '/') + ')';
const old = '../20261104-223055-ota-diagnostico-0d0d488/';
h.write('INFORME_VERIFICACION_TECNICA.md', `# Compilación Android y comprobación del candidato OTA

RIOVOLEY, commit fuente del APK \`${apk.sourceCommit}\`. Inicio UTC ${context.startedAt}; la pausa y reanudación del 5 de noviembre constan en [reanudación](android/reanudacion-entorno.json). Los cambios locales corresponden al arnés y la documentación; App y la lógica de producción no se modificaron. [Fuentes](FUENTES_EVALUADAS.json), [contexto](CONTEXTO.json).

Se construyó un APK debug en una copia privada del proyecto Android, usando el backend Supabase descartable existente con cuentas sintéticas. El build web usó CI=true, sin sourcemaps y con dotenv desactivado por preload. Se omitió el keystore institucional y google-services.json, se desactivó la actualización OTA automática solo en la copia, y sus servicios apuntaron al puerto loopback cerrado. El tráfico de la API local utiliza HTTP por ADB reverse. No se solicitó introducir claves, no se firmó un release ni se distribuyó el APK.

## Entorno y método

Windows x64, Node según [herramientas del host](android/herramientas-host.json), JDK21, Gradle8.14.3 y SDK/AVD configurado para API36. Las versiones efectivas quedan en [Java](android/version-java.stdout.log), [Gradle](android/version-gradle.stdout.log) y [ADB](android/version-adb.stdout.log). Se ejecutaron ${sourceLink('scripts/audit/production/build-local-android.cjs')}, ${sourceLink('scripts/audit/production/inspect-local-android.cjs')}, ${sourceLink('scripts/audit/android/inspect-ota-native.cjs')} y ${sourceLink('scripts/audit/android/launch-local-candidate.cjs')} con --current-build. Este último exige que el recibo corresponda al HEAD y que el hash coincida con el APK del expediente antes de instalarlo. [Comandos, tiempos y códigos](COMANDOS.json).

Gradle ejecutó :app:assembleDebug :app:testDebugUnitTest --offline --no-daemon --no-configuration-cache --console=plain --stacktrace --max-workers=2. La sincronización usó Capacitor sync android sobre la copia privada. El APK es depurable y mide ${apk.bytes} bytes, con SHA-256 ${apk.sha256}. Los ${inspection.webFiles} archivos del build coinciden byte a byte con los ${inspection.matchingWebFiles} empaquetados. [Recibo](android/apk-local-compilado.json), [inspección ZIP/JUnit](android/apk-local-inspeccion-cierre.json), [firma](android/signature.stdout.log).

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| WEB | Compilación React estricta (operación) | — | — | — | — | ${web.exitCode === 0 ? 'APROBADO' : 'FALLIDO'} | [Metadatos](android/local-web-build.meta.json), [salida](compilacion-web/web-build.stdout.log) |
| CAP | Sincronización Capacitor (operación) | — | — | — | — | ${sync.exitCode === 0 ? 'APROBADO' : 'FALLIDO'} | [Metadatos](android/local-capacitor-sync.meta.json) |
| APK | Compilación Gradle debug (operación) | — | — | — | — | ${gradle.exitCode === 0 ? 'APROBADO' : 'FALLIDO'} | [Metadatos](android/local-gradle.meta.json), [salida](android/gradle.stdout.log) |
| JUNIT | Caso aritmético de plantilla, no funcional | ${inspection.junit.tests} | ${inspection.junit.tests - inspection.junit.failures - inspection.junit.errors - inspection.junit.skipped} | ${inspection.junit.failures + inspection.junit.errors} | ${inspection.junit.skipped} | APROBADO | [JUnit extraído](android/apk-local-inspeccion-cierre.json) |
| GUARD | Perfil local y rutas offline sintéticas | 13 | 13 | 0 | 0 | APROBADO | [TAP](unitarias/guardas-android-local.stdout.log) |
| API-READ | Sondas independientes de lectura de logros | 4 | 4 | 0 | 0 | APROBADO | [Resultados](integracion/sondas-logros-locales.json) |
| NATIVE | WebView/Auth/REST/PostgreSQL locales | ${cases.executed} | ${cases.passed} | ${cases.failed} | 0 | ${nativeState} | [Casos](android/candidato-actual.json), [launcher](android/resultado-intento.json) |
| OTA-UI | Ausencia de panel en portada nativa; subconjunto NATIVE | ${ui ? 1 : 0} | ${ui?.state === 'APROBADO' ? 1 : 0} | ${ui?.state === 'FALLIDO' ? 1 : 0} | 0 | ${ui?.state || 'NO EJECUTADO'} | [Captura revisada](android/capturas-revisadas.json) |
| PROD | Release firmado, servicios gestionados y despliegue | 0 | 0 | 0 | 0 | NO EJECUTADO | Fuera de esta ejecución local |

No sumar los denominadores: JUnit, node:test y WebView son herramientas distintas, y OTA-UI es subconjunto de WebView. Quedaron ${cases.notExecuted} casos nativos planificados sin ejecutar; no equivalen a omitidos por la herramienta. La operación completa de reconstrucción duró ${build.durationSeconds} s, incluidos ${web.durationSeconds} s de React, ${sync.durationSeconds} s de sincronización y ${gradle.durationSeconds} s de Gradle. Las operaciones también contienen copias e inspecciones.

## Ejecución nativa e integración

El arnés ${sourceLink('scripts/audit/android/authenticated-webview.cjs')} utiliza Playwright Android sobre la WebView instalada. Comprueba hash instalado, portada sin panel OTA, inicio de sesión, persistencia al recargar y cierre por tres roles, dos restricciones de acceso al panel administrador y una recompensa diaria de 8 XP sin duplicación. El caso OTA exige plataforma nativa y disponibilidad del plugin CapacitorUpdater antes de comprobar la ausencia del botón y del encabezado técnico. No cambia las expectativas de los trece casos previos; agrega uno. Las cuentas, las sesiones y las escrituras de recompensa corresponden exclusivamente al laboratorio. No se simulan Auth, REST o PostgreSQL. Resultado: ${cases.passed}/${cases.executed} aprobados; estado ${nativeState}; ${cases.cleanupFailures.length} fallos de limpieza. [Resultado por caso](android/candidato-actual.json).

Se registraron ${result.responses.total} respuestas de la API local, de las cuales ${result.responses.http400OrMore} tuvieron estado HTTP igual o superior a 400: dos GET de gamification_student_achievements devolvieron 401. Cuatro sondas independientes posteriores, con limit=0 y sin recuperar filas, comprobaron rechazo anónimo y HTTP200 en admin, trainer y student autenticados. No se capturó la fase ni la identidad del token de los dos 401 originales; su causa queda pendiente de instrumentación y no se atribuye automáticamente a un cierre de sesión. [Sondas](integracion/sondas-logros-locales.json). La consulta de recompensa previa y posterior está en el JSON de casos; no se presupone que la base haya sido reiniciada o que la recompensa previa fuera cero. [Consulta posterior a la parada](integracion/recompensa-tras-parada.json). La comprobación de cabeceras de panel/sesiones no valida todas las pantallas internas. [Revisión visual de capturas](android/capturas-revisadas.json) describe cualquier carga transitoria observada.

Se utilizó un AVD propio sin ventana, modo avión, Wi-Fi/datos desactivados y un proxy que no reenvía solicitudes. Se examinaron las tablas main IPv4/IPv6 sin filtro default. Este control tiene alcance limitado: no certifica todas las tablas de enrutamiento por políticas ni el kernel. Playwright también bloqueó orígenes distintos del contenedor web y API local. [Perfil](android/perfil-ejecutado.json), [rutas](android/rutas-principales-evaluadas.json). El estado de parada del emulador es ${runtime.emulatorStopped}; no se cerraron aplicaciones del usuario ni contenedores ajenos.

## Seguridad, incidencias y límites

El escaneo descomprimió los miembros ZIP y comparó valores institucionales conocidos, clave server y contraseñas locales prohibidas, además de patrones JWT. Solo se toleraron los inputs anon/PII del cliente local dentro del APK privado. El resultado no certifica ausencia universal de secretos. Los informes y logs públicos pasan una revisión independiente del contenido del APK; no contienen valores ni digests de credenciales. [Privacidad APK](seguridad/privacidad-apk-local.json), [privacidad del expediente](PRIVACIDAD.json).

Se conservan dos fallos del comprobador estático, con códigos 1: exigía que no existiera el literal del panel en el bundle. Esa expectativa era más fuerte que el requisito de interfaz. Con una variable CRA omitida, el código protegido puede conservarse como texto, aunque el valor distinto de true impida renderizarlo. Se corrigió el comprobador para registrar ese texto (${source.panelTextFiles} archivo), manteniendo la prueba funcional nativa de ausencia del control. No se cambió App ni se modificaron expectativas de roles/recompensa para conseguir aprobación. [Primer intento](android/privacidad-y-contenido.meta.json), [diagnóstico](android/privacidad-diagnostico.meta.json), [cierre](android/privacidad-cierre.meta.json), [vinculación](android/fuentes-y-artefacto.json).

Tras la pausa, Docker estaba detenido y se reanudó localmente. La memoria libre fue insuficiente al principio; no se inició el AVD hasta que el usuario liberó recursos. Gradle advirtió sobre flatDir, deprecaciones incompatibles con Gradle9 y avisos Kotlin del plugin Filesystem; React/Node emitió DEP0176. Estos avisos no se ocultan ni se corrigieron editando dependencias instaladas. [Logs de Gradle](android/gradle.stdout.log), [stderr web](compilacion-web/web-build.stderr.log), [reanudación](android/reanudacion-entorno.json).

No se ejecutaron Jest completo, suites Playwright de escritorio, FCM, Resend, descarga/instalación OTA, recuperación real con token ni auditoría de RLS institucional en esta fase. El [Jest anterior de 426 casos](${old}INFORME_VERIFICACION_TECNICA.md) corresponde al mismo App de la base, pero no se atribuye como nueva ejecución. Este APK debug tampoco reemplaza la validación de un release firmado con el cambio. La transición SQL/Edge/clientes y la promoción institucional requieren su ventana, responsable y autorización; producción no fue modificada. No se derivan resultados de usabilidad, motivación, USE o UES-SF.

## Reproducción y custodia

Requiere el laboratorio existente, JDK/SDK/caché local, Python, Node y memoria suficiente. Inicializar un expediente nuevo con ${sourceLink('scripts/audit/android/initialize-ota-native.cjs')}, ejecutar build-local-android, inspección y launcher --current-build, conservando cada intento. El APK y los volcados nativos completos permanecen en .e2e-local, fuera de Git. Los logs publicados omiten el perfil de usuario y se filtran por valores locales conocidos. No sobrescribir expedientes sellados. Los tres documentos son generados por ${sourceLink('scripts/audit/android/report-ota-native.cjs')}; el [manifiesto](MANIFIESTO_SHA256.json) y la [integridad](INTEGRIDAD.json) respaldan su custodia. El CI del commit que los incluya se verifica después del sellado sin alterar el expediente.
`);
const daily = cases.cases.find(c => c.code === 'N-student-recompensa');
h.write('MATRIZ_VERIFICACIONES_TESIS.md', `# Matriz de trazabilidad: APK actual

Fuente del APK: ${apk.sourceCommit}. Las filas distinguen ejecuciones nuevas de referencias anteriores. No sumar subconjuntos.

| Categoría Tabla 4-6 | Archivo o flujo | Casos nuevos | Resultado real | Tipo y dependencias | Limitación y evidencia |
|---|---|---:|---|---|---|
| Caso de uso de gamificación | authenticated-webview.cjs, N-student-recompensa | ${daily ? 1 : 0} | ${daily?.state || 'NO EJECUTADO'} | E2E WebView + Auth/REST/PostgreSQL locales, sin mocks | Solo recompensa diaria; [casos](android/candidato-actual.json) |
| Servicio público de gamificación | Mismo flujo, sin prueba aislada del servicio | 0 casos aislados | NO EJECUTADO como unidad en esta fase | Interacción observada dentro del E2E anterior | [Servicio en auditoría anterior](${old}MATRIZ_VERIFICACIONES_TESIS.md) |
| Identidad del atleta | Sin suite nueva | 0 | NO EJECUTADO | No extrapolar la navegación a identidad | [Matriz anterior](${old}MATRIZ_VERIFICACIONES_TESIS.md) |
| Wallet y monedas | Sin suite nueva | 0 | NO EJECUTADO | No se valida saldo por comprobar XP | Matriz anterior |
| Tienda cosmética | Sin suite nueva | 0 | NO EJECUTADO | No se compran o equipan elementos en este flujo | Matriz anterior |
| Asistencia | Sin suite nueva | 0 | NO EJECUTADO | No se registran asistencias en este flujo | Matriz anterior |
| Pagos | Sin suite nueva | 0 | NO EJECUTADO | No se registran pagos en este flujo | Matriz anterior |
| Compilación del proyecto | build-local-android.cjs, CRA + sync + Gradle | Tres operaciones, salida 0 | APROBADO | Build web y nativo debug reales | ${inspection.webFiles} archivos web coincidentes; [recibo](android/apk-local-compilado.json), [metadatos](COMANDOS.json) |

Complementos Android: ${cases.executed} casos WebView ejecutados, ${cases.passed} aprobados y ${cases.failed} fallidos; ${cases.notExecuted} no ejecutados. Incluye OTA-UI como un caso adicional a los trece flujos anteriores. Se utiliza Playwright Android y servicios reales locales, sin autenticar usuarios institucionales. [Resultado exacto](android/candidato-actual.json). JUnit: ${inspection.junit.tests} caso aritmético de plantilla, sin valor funcional. Node: 13/13 guardas sintéticas (perfil y rutas), sin dispositivo o persistencia. Se aprobaron cuatro sondas de lectura independientes (anon rechazado y tres roles autenticados con HTTP200); no establecen la causa de los dos 401 registrados en el flujo nativo. [Sondas](integracion/sondas-logros-locales.json). Seguridad: revisión ZIP de valores prohibidos y controles de salida con alcance main; no prueba de penetración, RLS actual o proveedores externos. [Informe y límites](INFORME_VERIFICACION_TECNICA.md).
`);
h.write('RESULTADOS_PARA_TESIS_4_5.md', `# Propuesta para revisión académica

La comprobación complementaria de RIOVOLEY construyó un APK de depuración a partir del commit ${apk.sourceCommit.slice(0, 7)}, mediante la compilación web estricta, la sincronización de Capacitor y las tareas assembleDebug y testDebugUnitTest de Gradle, todas con código de salida cero. Se verificó la firma de depuración y la coincidencia byte a byte de ${inspection.webFiles} archivos web empaquetados. El caso JUnit preexistente comprobó una operación aritmética de plantilla, por lo que no se considera evidencia de comportamiento funcional. El APK, de ${apk.bytes} bytes, quedó identificado por SHA-256 ${apk.sha256} y conservado en un directorio privado, sin distribución. [Recibo](android/apk-local-compilado.json), [inspección](android/apk-local-inspeccion-cierre.json) y [comandos](COMANDOS.json) respaldan la compilación.

En el emulador se ejecutaron ${cases.executed} casos sobre la WebView del APK, con ${cases.passed} aprobados, ${cases.failed} fallidos y ${cases.notExecuted} casos planificados no ejecutados. Los flujos utilizaron Supabase Auth, REST y PostgreSQL del laboratorio descartable, sin mocks, para comprobar sesiones por rol, restricciones de acceso y recompensa diaria; se agregó la comprobación de ausencia del panel técnico OTA en la portada nativa. El estado de esta última fue ${ui?.state || 'NO EJECUTADO'}. Los resultados se conservan por caso en [candidato-actual.json](android/candidato-actual.json), con la [consulta posterior](integracion/recompensa-tras-parada.json) y [revisión visual](android/capturas-revisadas.json). Por separado, aprobaron 13 guardas automatizadas de entradas sintéticas; ese denominador no se combina con los casos nativos. Se observaron dos respuestas HTTP401 al consultar logros cuya causa no quedó determinada; cuatro [sondas posteriores](integracion/sondas-logros-locales.json) verificaron rechazo anónimo y lectura autorizada para los tres roles, sin explicar las respuestas previas. Se documentaron dos fallos iniciales del comprobador estático, cuya expectativa de ausencia de un literal en JavaScript no equivalía al requisito de visibilidad de interfaz; la expectativa funcional se mantuvo. El control de red se limitó a las tablas main y a los bloqueos descritos en el [informe](INFORME_VERIFICACION_TECNICA.md). Estas evidencias amplían la verificación local del artefacto Android, sin acreditar notificaciones externas, instalación OTA, funcionamiento integral en producción o resultados de usabilidad y motivación. Un release firmado actualizado y la transición institucional coordinada permanecen pendientes.
`);
console.log(JSON.stringify({ documents: 3, buildExitCode: build.exitCode, nativeState, native: result.native, guards: 13 }));
