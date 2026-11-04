'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const h = require('../../e2e/local/harness.cjs');
const read = name => JSON.parse(fs.readFileSync(path.join(h.evidence, name), 'utf8'));
const rel = target => path.relative(h.evidence, path.resolve(h.root, target)).replaceAll('\\', '/');
assert.ok(!fs.existsSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json')), 'NEW_EVIDENCE_REQUIRED');
const context = read('CONTEXTO.json'), jest = read('unitarias/jest-cierre.json');
const coverage = read('unitarias/cobertura-cierre/coverage-summary.json').total;
const build = read('compilacion-web/artefactos.json'), buildMeta = read('compilacion-web/build-estricto-ota.meta.json');
const testMeta = read('unitarias/jest-cierre.meta.json');
assert.equal(jest.numFailedTests, 0); assert.equal(buildMeta.exitCode, 0);
const tests = jest.testResults.flatMap(suite => suite.assertionResults.map(t => ({
  file: path.relative(h.root, suite.name).replaceAll('\\', '/'), name: t.fullName, status: t.status
})));
const byFile = pattern => tests.filter(t => pattern.test(t.file));
const gamma = tests.filter(t => t.file.includes('/gamification/'));
const groups = [
  ['GAM-UC', 'Caso de uso de gamificación', byFile(/gamification\/application\/useCases\/(createGamificationUseCases|createGamificationFoundationUseCases|gamification.audit.integration)\.test\.js$/)],
  ['GAM-SRV', 'Servicio público de gamificación', byFile(/gamification\/presentation\/createGamificationService\.test\.js$/)],
  ['GAM-ID', 'Identidad del atleta', tests.filter(t => /IdentityPortrait\.test|StudentProfileIdentityCard\.test/.test(t.file) || (t.file.includes('/gamification/') && /identity|avatar|apodo|titulo/i.test(t.name)))],
  ['GAM-WAL', 'Wallet y monedas', gamma.filter(t => /wallet|currency|monedas/i.test(t.name))],
  ['GAM-SHOP', 'Tienda cosmética', gamma.filter(t => /cosmeticVisuals\.test/.test(t.file) || /purchase|equip|cosmetic/i.test(t.name))],
  ['ASI', 'Asistencia', tests.filter(t => t.file.includes('/attendance/') || (t.file.endsWith('gamification.audit.integration.test.js') && /asistencia/i.test(t.name)))],
  ['PAG', 'Pagos', tests.filter(t => t.file.includes('/payments/') || (t.file.endsWith('gamification.audit.integration.test.js') && /pago/i.test(t.name)))],
];
const tap = fs.readFileSync(path.join(h.evidence, 'unitarias/preflight-regresion-completa.stdout.log'), 'utf8');
const tapValue = key => Number(tap.match(new RegExp('# ' + key + ' ([0-9]+)'))?.[1]);
assert.equal(tapValue('tests'), 18); assert.equal(tapValue('pass'), 18); assert.equal(tapValue('fail'), 0);
const counts = { suites: jest.numTotalTestSuites, cases: jest.numTotalTests, passed: jest.numPassedTests,
  failed: jest.numFailedTests, skipped: jest.numPendingTests };
assert.deepEqual(counts, { suites: 89, cases: 426, passed: 426, failed: 0, skipped: 0 });
const ui = read('unitarias/ota-ui-verde.json');
assert.equal(ui.numTotalTests, 7); assert.equal(ui.numPassedTests, 7);
h.write('RESULTADOS_AUTOMATIZADOS.json', { recordedAt: new Date().toISOString(), baseCommit: context.baseCommit,
  jest: counts, coverage, focusedUi: { cases: 7, passed: 7, subsetOfJest: true },
  nodePreflight: { cases: 18, passed: 18, newOtaSubset: 4 }, webBuild: { exitCode: 0, ...build },
  nativeBuildExecuted: false, playwrightExecuted: false, institutionalWrites: false, productionChanged: false,
  groups: groups.map(([code, category, cases]) => ({ code, category, cases: cases.length, passed: cases.filter(t => t.status === 'passed').length, tests: cases })),
  allJestFiles: jest.testResults.map(t => ({ file: path.relative(h.root, t.name).replaceAll('\\', '/'), cases: t.assertionResults.length })),
  limitations: ['Categorías solapadas; no sumar sus denominadores.', 'Incluye un caso placeholder existente en src/App.test.js.',
    'Jest utiliza dependencias simuladas y repositorios en memoria; no demuestra persistencia PostgreSQL ni actualización OTA real.',
    'Build web sintético privado; no corresponde a un release firmado ni a producción.'] });
const sourceLink = file => '[' + file + '](' + rel(file) + ')';
const prior = '../20261104-211815-android-webview-7e9a27d/INFORME_VERIFICACION_TECNICA.md';
h.write('INFORME_VERIFICACION_TECNICA.md', `# Verificación del diagnóstico OTA y regresión local

Proyecto RIOVOLEY. Commit base: \`${context.baseCommit}\`; cambios locales deliberados en App, preflight, pruebas, CI y documentación. Inicio UTC: ${context.startedAt || context.start || 'ver CONTEXTO.json'}. Las fuentes evaluadas se identifican por SHA-256 en [FUENTES_EVALUADAS.json](FUENTES_EVALUADAS.json); el commit que contiene este expediente será posterior a la base.

Se corrigió el panel técnico OTA observado previamente en el APK release: la interfaz ordinaria lo oculta, y una compilación diagnóstica puede habilitarlo con el valor literal true de REACT_APP_ENABLE_OTA_DIAGNOSTICS, únicamente en portada y con soporte OTA. El preflight de producción rechaza esa activación. La bandera es configuración de compilación, no control de autorización. No se modificó el motor de actualización. La comprobación de sus llamadas iniciales usa mocks y no demuestra descarga o instalación real.

Entorno: Windows ${JSON.parse(fs.readFileSync(path.join(h.evidence, 'seguridad/herramientas-locales.stdout.log'), 'utf8')).release}, x64, Node ${build.node}, npm 11.16.0. Se usaron CRA/Jest/Testing Library y node:test existentes. El build y Jest emplearon entradas sintéticas loopback, CI=true y un preload que impide cargar dotenv. No se solicitaron credenciales ni se realizaron escrituras institucionales, despliegues, firmas Android o llamadas a proveedores. [Herramientas](seguridad/herramientas-locales.stdout.log), [contexto](CONTEXTO.json).

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| JEST | Regresión completa; ${counts.suites} suites | ${counts.cases} | ${counts.passed} | ${counts.failed} | ${counts.skipped} | APROBADO | [JSON original](unitarias/jest-cierre.json) |
| OTA-UI | Visibilidad y bootstrap con mocks; subconjunto JEST | 7 | 7 | 0 | 0 | APROBADO | [ejecución enfocada](unitarias/ota-ui-verde.json) |
| INT-MEM | Asistencia, pagos, evaluaciones y login diario; subconjunto JEST | 5 | 5 | 0 | 0 | APROBADO | ${sourceLink('src/features/gamification/application/useCases/gamification.audit.integration.test.js')}, JSON JEST |
| NODE | Regresión del preflight sintético | 18 | 18 | 0 | 0 | APROBADO | [TAP](unitarias/preflight-regresion-completa.stdout.log) |
| OTA-GUARD | Guarda nueva; subconjunto NODE | 4 | 4 | 0 | 0 | APROBADO | [TAP enfocado](unitarias/ota-preflight-verde.stdout.log) |
| WEB | Compilación estricta (operación, no casos funcionales) | — | — | — | — | APROBADO | [log](compilacion-web/build-estricto-ota.stdout.log), [metadatos](compilacion-web/build-estricto-ota.meta.json) |
| E2E | Playwright en esta fase | 0 | 0 | 0 | 0 | NO EJECUTADO | Alcance limitado al cambio de UI y preflight |
| AND | Nueva compilación o ejecución nativa | 0 | 0 | 0 | 0 | NO EJECUTADO | [Android anterior, fuente distinta](${prior}) |
| CLOUD | Integración PostgreSQL/OTA gestionado y producción | 0 | 0 | 0 | 0 | NO EJECUTADO | No se realizaron operaciones institucionales |

No se suman las filas que representan subconjuntos. Jest completo duró ${testMeta.durationSeconds} s, con ${jest.numPassedTestSuites} suites aprobadas. Un caso existente de App.test.js es placeholder y no constituye validación funcional. Los contratos de repositorios y la integración de cinco casos vuelven a ejecutarse dentro de Jest; emplean clientes simulados o repositorios en memoria. No son integración con PostgreSQL. El inventario exacto de archivos y casos está en [RESULTADOS_AUTOMATIZADOS.json](RESULTADOS_AUTOMATIZADOS.json).

Cobertura instrumentada: líneas ${coverage.lines.covered}/${coverage.lines.total} (${coverage.lines.pct} %), sentencias ${coverage.statements.covered}/${coverage.statements.total} (${coverage.statements.pct} %), funciones ${coverage.functions.covered}/${coverage.functions.total} (${coverage.functions.pct} %) y ramas ${coverage.branches.covered}/${coverage.branches.total} (${coverage.branches.pct} %). Estas cifras corresponden al conjunto instrumentado por la configuración actual; no representan porcentaje de funcionalidades completas ni de preparación productiva. [Resumen original](unitarias/cobertura-cierre/coverage-summary.json).

Se conservó el desarrollo de la prueba: dos intentos iniciales no cargaron suites (resolución React Router 7 en Jest 27 y referencia fuera del ámbito de la factory); un tercero ejecutó 7 casos (6 aprobados y 1 fallido), pero reveló una fixture nativa inactiva por resetMocks y no se usa como demostración del defecto. Con la fixture corregida, la versión previa produjo 3 aprobados y 4 fallidos; tras el cambio, 7/7. La guarda Node pasó de 4 fallidos a 4 aprobados. [RED significativo](unitarias/ota-ui-rojo-nativo.json), [configuración/calibración](unitarias/ota-ui-rojo-reproducido.json), [RED Node](unitarias/ota-preflight-rojo.stdout.log). Los errores de preparación no se ocultan ni se suman al resultado final del producto. Se simuló el router por incompatibilidad de resolución de exports con Jest; estas pruebas no acreditan navegación real.

Compilación web: código de salida 0; duración ${buildMeta.durationSeconds} s; ${build.fileCount} archivos, ${build.totalBytes} bytes, ${build.sourceMapCount} sourcemaps. El literal del panel se encontró en ${build.diagnosticPanelLiteralInJavaScript.length} archivos JavaScript. Se conserva el inventario SHA-256, no el bundle privado, en [artefactos.json](compilacion-web/artefactos.json). CRA indicó Compiled successfully; stderr registró la deprecación Node DEP0176 de fs.F_OK, sin error de compilación. CI=true no tolera warnings de compilación de CRA. La compilación demuestra generación de activos, no funcionamiento integral. Se ejecutó ${sourceLink('scripts/audit/production/verify-ota-web.cjs')}; no se utilizó npm run build, cuyo script histórico fuerza CI=false.

La [revisión de código](seguridad/revision-codigo.json) no detectó hallazgos bloqueantes en el cambio mínimo, pero no reemplaza la ejecución. Los APK debug/release y sus pruebas anteriores corresponden a fuentes y hashes anteriores. Antes de distribuir un APK con este cambio se requiere reconstruirlo y verificar ese artefacto; no se solicitó firma ni publicación. Las aprobaciones nativas históricas no se transfieren a App modificado. La aplicación institucional del paquete SQL/Edge y la promoción coordinada de clientes siguen pendientes de ventana, responsable y autorización expresa. La validación con credenciales de proveedores queda excluida por decisión del usuario. No se atribuyen resultados de usabilidad, motivación, USE o UES-SF a estas pruebas. El CI del commit que incorpore este expediente se comprobará después del sellado; no se inventa su resultado anticipadamente.

Reproducción: seleccionar un expediente nuevo no sellado mediante .e2e-local/evidence-dir.txt, ejecutar ${sourceLink('scripts/audit/production/run-operational-jest.cjs')}, node --test --test-reporter=tap tests/unit/production-preflight.test.cjs tests/unit/ota-production-preflight.test.cjs y el helper de build mencionado. ${sourceLink('scripts/audit/production/report-ota-diagnostics.cjs')} genera estos documentos a partir de los JSON/TAP originales; ${sourceLink('scripts/audit/production/finalize-ota-diagnostics.cjs')} verifica y sella. Los comandos exactos, tiempos y códigos están en [COMANDOS.json](COMANDOS.json). No sobrescribir expedientes sellados. [Integridad](INTEGRIDAD.json), [privacidad](PRIVACIDAD.json), [manifiesto](MANIFIESTO_SHA256.json).
`);
const rows = groups.map(([code, category, cases]) => {
  const files = [...new Set(cases.map(t => t.file))].map(sourceLink).join('<br>');
  return `| ${code}: ${category} | ${files} | ${cases.length}/${cases.length}, todos aprobados | Unitarias/componentes${code === 'GAM-UC' || code === 'ASI' || code === 'PAG' ? ' e integración en memoria' : ''} | Mocks o repositorios en memoria; sin persistencia PostgreSQL | [Casos exactos](RESULTADOS_AUTOMATIZADOS.json), [Jest](unitarias/jest-cierre.json) |`;
}).join('\n');
h.write('MATRIZ_VERIFICACIONES_TESIS.md', `# Matriz de trazabilidad: continuación OTA

Las siete categorías funcionales usan selecciones explícitas del JSON de Jest de esta ejecución. Un caso puede participar en varias categorías: no sumar denominadores. El inventario incluye nombres completos para revisar la selección; no supone que el módulo esté cubierto íntegramente.

| Categoría Tabla 4-6 | Archivos relacionados | Casos aprobados/ejecutados | Tipo | Dependencias y limitaciones | Evidencia |
|---|---|---|---|---|---|
${rows}
| Compilación del proyecto | ${sourceLink('scripts/audit/production/verify-ota-web.cjs')} | Una operación, salida 0 | Build web estricto | Configuración sintética; no valida Android ni cada funcionalidad | [Metadatos](compilacion-web/build-estricto-ota.meta.json), [artefactos](compilacion-web/artefactos.json) |

Complementos: App.otaDiagnostics.test.js aprobó 7/7 con router/plataforma simulados, dentro de los ${counts.cases} casos Jest; la guarda OTA aprobó 4/4 dentro de 18/18 Node. No se ejecutó Playwright ni un nuevo APK en esta fase. [Pruebas Android anteriores](${prior}) conservan fuente y hash propios, no prueban el cambio nuevo. Seguridad: la revisión del preflight es local y sintética; no se inspeccionaron nuevamente RLS, permisos gestionados o proveedores, ni se realizó una auditoría de penetración. Las incidencias RED, cobertura y límites se detallan en el [informe](INFORME_VERIFICACION_TECNICA.md).
`);
h.write('RESULTADOS_PARA_TESIS_4_5.md', `# Propuesta académica para revisión

En la verificación complementaria de RIOVOLEY iniciada el 4 de noviembre de 2026 sobre el commit base ${context.baseCommit.slice(0, 7)} y las fuentes modificadas identificadas por SHA-256, se ejecutaron 426 casos de Jest distribuidos en 89 suites, todos aprobados, sin casos fallidos u omitidos. El total incluye un caso placeholder preexistente y no debe interpretarse como 426 comportamientos funcionales diferentes. La cobertura instrumentada alcanzó ${coverage.lines.pct} % de líneas, ${coverage.statements.pct} % de sentencias, ${coverage.functions.pct} % de funciones y ${coverage.branches.pct} % de ramas. Dentro del mismo conjunto, cinco casos verificaron la interacción de asistencia, pagos, evaluaciones físicas y gamificación mediante repositorios en memoria, por lo que sus resultados no demuestran persistencia real en PostgreSQL. Las evidencias originales y la selección por categorías se conservan en [Jest](unitarias/jest-cierre.json), [cobertura](unitarias/cobertura-cierre/coverage-summary.json) y [matriz](MATRIZ_VERIFICACIONES_TESIS.md).

La revisión permitió corregir la exposición ordinaria del panel técnico OTA. Con una fixture nativa compatible, la prueba previa registró cuatro fallos entre siete casos; después de condicionar su visibilidad a una configuración diagnóstica explícita, los siete aprobaron. Las dependencias de plataforma y navegación fueron simuladas, y se comprobó la invocación del bootstrap sin acreditar descarga ni instalación OTA real. Además, se aprobaron 18 controles de preflight con entradas sintéticas, incluidos cuatro correspondientes a la nueva restricción diagnóstica, y la compilación web estricta terminó con código de salida cero. [RED](unitarias/ota-ui-rojo-nativo.json), [resultado final de componentes](unitarias/ota-ui-verde.json), [controles Node](unitarias/preflight-regresion-completa.stdout.log) y [compilación](compilacion-web/build-estricto-ota.meta.json) respaldan estas afirmaciones. Esta fase no ejecutó nuevas pruebas extremo a extremo o compilaciones Android ni modificó producción; los artefactos nativos anteriores conservan su alcance por fuente y hash. Por ello, los resultados sustentan la regresión local y la generación de activos web, mientras la validación del nuevo artefacto nativo y la transición institucional coordinada permanecen pendientes. No se derivan conclusiones de usabilidad, motivación o capacidad de interacción de estas verificaciones técnicas.
`);
console.log(JSON.stringify({jest: counts, groups: groups.map(([code, , c]) => ({ code, cases: c.length })), node: 18, buildExitCode: 0, documents: 3}));
