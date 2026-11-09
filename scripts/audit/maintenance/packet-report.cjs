'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const ctx = require('./packet-context.cjs'), c = ctx.read(), h = require('../../e2e/local/harness.cjs');
assert.equal(c.evidence, h.evidence);
const read = f => JSON.parse(fs.readFileSync(path.join(h.evidence, f), 'utf8'));
const attempt = ctx.latestAttempt();
const result = read(attempt.resultFile), state = read(attempt.stateFile);
const variants = read(attempt.variantManifestFile), cause = read('integracion/causa-y-correccion.json');
const separator = read('integracion/correccion-separador-digest.json');
const runs = ['ensayo-paquete', 'ensayo-paquete-final', 'ensayo-paquete-corregido', 'ensayo-paquete-artefactos'].map(label => {
  const output = fs.readFileSync(path.join(h.evidence, 'integracion', label + '.stdout.log'), 'utf8').trim();
  return { label, ...JSON.parse(output), ...read('integracion/' + label + '.meta.json') };
});
assert.deepEqual(runs.map(r => [r.executed, r.passed, r.failed, r.exitCode]), [[20, 19, 1, 1], [18, 17, 1, 1], [22, 22, 0, 0], [22, 22, 0, 0]]);
assert.equal(state.tables, 48); assert.equal(state.rows, 68); assert.equal(state.sequences, 7); assert.equal(result.completed, true);
const summary = { reportedAt: new Date().toISOString(), baseCommit: c.baseCommit, scope: 'Synthetic catalog SQL integration only',
  runs: runs.map(r => ({ label: r.label, executed: r.executed, passed: r.passed, failed: r.failed, exitCode: r.exitCode, durationSeconds: r.durationSeconds, start: r.start, end: r.end })),
  finalControls: { executed: result.executed, passed: result.passed, failed: result.failed }, syntheticTables: state.tables, syntheticRows: state.rows,
  sequencesCompared: state.sequences, sourceIntact: state.sourceIntact, gateRemoved: state.gateRemoved, finalFingerprint: state.finalFingerprint,
  variants: variants.variants.map(v => ({ file: v.evidenceFile, source: v.file, sha256: v.variantSha256, guardsRebased: v.guardsRebased, originalBodyPreservedBytewise: v.originalBodyPreservedBytewise })),
  originalSqlFilesModified: false, newJestCases: 0, toolingUnitCases: 3, newPlaywrightCases: 0, newAndroidCases: 0, newBuilds: 0,
  institutionalRowsCopied: 0, newInstitutionalRestore: false, archiveUnlocked: false, managedServicesExercised: false,
  productionChanged: false, productionExecutionAuthorized: false, releaseReady: false, previousWindowExpired: true };
function writeReport(name, value) {
  assert.ok(['RESULTADOS_AUTOMATIZADOS.json', 'PAQUETE_LOCAL_REVISABLE.md', 'INFORME_VERIFICACION_TECNICA.md', 'MATRIZ_VERIFICACIONES_TESIS.md', 'RESULTADOS_PARA_TESIS_4_5.md'].includes(name));
  let body = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  for (const [before, after] of Object.entries({ 'integracion/intento-final.json': attempt.file, 'integracion/resultado-final.json': attempt.resultFile, 'integracion/estado-final.json': attempt.stateFile,
    'integracion/variantes-manifiesto.json': attempt.variantManifestFile, 'integracion/operaciones-sql.json': attempt.operationsFile, 'integracion/huellas-con-barrera.json': attempt.fingerprintFile })) body = body.replaceAll(before, after);
  body = body.replaceAll('registros de los tres ensayos', 'registros de los cuatro ensayos').replaceAll('Los tres recorridos', 'Los cuatro recorridos');
  fs.writeFileSync(path.join(h.evidence, name), body + '\n');
}
writeReport('RESULTADOS_AUTOMATIZADOS.json', summary);
const functional = '../20261105-152944-notifications-cancel-e903a31/';
const previous = '../20261105-204301-barrera-sql-local-ade1d17/';
const original = f => '[' + path.basename(f) + '](' + path.relative(h.evidence, path.join(h.root, f)).replaceAll('\\', '/') + ')';
writeReport('PAQUETE_LOCAL_REVISABLE.md', `# Integración local de barrera y avance/retorno

Estado: ensayo PostgreSQL local, sin autorización o aplicación institucional. Se clonó un laboratorio sintético marcado, sin filas institucionales. La copia contiene 48 tablas, 68 filas sintéticas y siete secuencias; el origen conservó su huella y digests. La barrera se instaló sobre las 48 tablas y se retiró al concluir. [Estado final](integracion/estado-final.json).

El [manifiesto del intento final](integracion/intento-final.json) identifica los archivos exactos. La repetición posterior a revisión ejecutó los mismos bytes SQL persistidos en los artefactos y pasó 22/22 controles. Los registros canónicos anteriores conservan sus fallos históricos.

## Variantes exactas del ensayo

| Etapa | Original intacto | Variante local | SHA-256 de variante | Literales de guarda ajustados |
|---|---|---|---|---|
${variants.variants.map(v => `| ${v.label} | ${original(v.file)} | [SQL](${v.evidenceFile}) | ${v.variantSha256} | ${v.guardsRebased} |`).join('\n')}

Las variantes añaden destino por nombre de base/comentario y digest de la barrera/inventario. Se ajustan únicamente los literales de huella medidos con la barrera instalada, conservando bytes de cuerpos originales y las guardas de catálogo. No eliminan la comprobación de deriva. El principal original rechazó su catálogo con la barrera instalada, lo que demuestra que no puede copiarse sin revisión. Los [estados medidos](integracion/huellas-con-barrera.json) pertenecen a esta copia, no a Cloud.

El recorrido final aprobó 22 controles automatizados Node assert + driver pg. Avance: principal y complemento. Retorno: complemento y principal. La barrera permaneció durante las cuatro etapas; cada etapa comprobó huella, digest, contenido/secuencias y rechazo SQL 55000 de una RPC sintética SECURITY DEFINER que intenta UPDATE sin filas bajo SET LOCAL ROLE authenticated. No se autenticaron usuarios mediante HTTP ni se ejecutó una funcionalidad de negocio institucional.

También se rechazaron alteración de función, disparador deshabilitado, tabla nueva fuera del inventario y orden de retorno incorrecto. El digest adicional cubre definiciones/ACL del esquema nuevo y estado de disparadores, aspectos que no cubre íntegramente la huella original. [Controles finales](integracion/resultado-final.json), [operaciones SQL](integracion/operaciones-sql.json).

## Incidencias conservadas

Primer ensayo: 19/20, fallo en retorno principal. El generador convirtió CRLF dentro de cuerpos SQL; la comparación detectó ${cause.differingFunctionItems} definiciones diferentes. Se preservaron fuente y guardas originales y se corrigió la generación. [Causa](integracion/causa-y-correccion.json), [diferencias por hash](integracion/diferencias-retorno.json).

Segundo ensayo: 17/18, fallo en control del retorno anticipado; el separador del digest dependía del CRLF físico. Se corrigió usando escape SQL explícito. [Corrección](integracion/correccion-separador-digest.json). El ensayo final terminó 22/22, sin sumar las ejecuciones repetidas como controles únicos. Además se conservó el error inicial 42725 del digest y su corrección de casts, con códigos 1 y 0 en los recibos digest-red/digest-green.

## Condiciones pendientes

La barrera continúa siendo una capa SQL local. Quedan fuera Auth/Storage HTTP, objetos Storage, correo, push, scheduler, objetos no inventariados, secuencias como vía de escritura, DDL privilegiado y escritores postgres. La copia no recupera el respaldo institucional ni acredita su vigencia. Los cuatro SQL originales no se han reemplazado con estas variantes y todavía no existe un paquete institucional completo aprobado con aislamiento global.

La ventana propuesta del 7 de noviembre pasó; no se reprogramó ni se ejecutó. Faltan respaldo vigente al corte, ensayo gestionado que cubra efectos externos, validación institucional de compatibilidad y autorización específica de un paquete concreto. No desplegar estos SQL locales en Cloud. Los [límites del prototipo anterior](${previous}PROPUESTA_AISLAMIENTO_SQL.md) siguen aplicando.
`);
writeReport('INFORME_VERIFICACION_TECNICA.md', `# Verificación técnica: paquete SQL y barrera local

## Proyecto, fecha y entorno

RIOVOLEY, commit base ${c.baseCommit}. Contexto nuevo ${c.createdAt} UTC (Ecuador UTC−5), Windows ${c.osRelease}, Node ${c.node}, PostgreSQL ${c.serverVersion}. Destino fijo 127.0.0.1:55322, base ${c.database}, marcada para ensayo sintético. [Contexto](CONTEXTO.json). La [preparación del 5 de noviembre](../20261105-210719-paquete-barrera-57a1e7b/NOTA_CONTINUIDAD.md) conserva su fecha y no contiene estos resultados nuevos.

## Alcance y metodología

Integración real PostgreSQL con driver pg y Node assert, sin mocks de repositorios. Se clonó solo el laboratorio sintético anterior y se compararon 48 tablas/68 filas sintéticas y estados de siete secuencias mediante digests agregados, sin publicar filas. No es una restauración institucional ni una prueba de penetración. Se inició Docker Desktop para recuperar el entorno existente; no se restablecieron bases o credenciales. Los servicios gestionados y proveedores externos no fueron ejercitados.

Comandos: node scripts/audit/maintenance/packet-context.cjs crea contexto/base nuevos; node scripts/audit/maintenance/packet-rehearse.cjs ejecuta la normalización, medición de huellas, generación de variantes y avance/retorno; packet-report.cjs genera documentos y packet-finalize.cjs sella. Los [comandos y códigos](COMANDOS.json), [operaciones SQL](integracion/operaciones-sql.json) y registros de los tres ensayos conservan el resultado real. Tras el sello se requiere un contexto nuevo. No hay parámetro para seleccionar Cloud.

## Resultados por ejecución

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
${runs.map((r, i) => `| PKT-0${i + 1} | ${['Primer recorrido', 'Recorrido tras conservar CRLF', 'Recorrido corregido', 'Repetición con artefactos exactos'][i]} | ${r.executed} controles | ${r.passed} | ${r.failed} | 0 | ${i < 2 ? 'FALLIDO: corregido y repetido' : 'APROBADO'} | [Salida](integracion/${r.label}.stdout.log), [código/tiempo](integracion/${r.label}.meta.json) |`).join('\n')}
| PKT-05 | Digest: reproducción de error de tipos | 1 consulta | 0 | 1 | 0 | FALLIDO: 42725, corregido | [Recibo](integracion/digest-red.meta.json) |
| PKT-06 | Digest: consulta corregida | 1 consulta | 1 | 0 | 0 | APROBADO | [Recibo](integracion/digest-green.meta.json) |
| PKT-07 | Jest, componentes, Playwright y Android | 0 nuevos | 0 | 0 | 0 | NO EJECUTADO en este ensayo | [Antecedente](${functional}INFORME_VERIFICACION_TECNICA.md) |
| PKT-08 | Compilaciones web/Android | 0 nuevas | 0 | 0 | 0 | NO EJECUTADO en este ensayo | [Antecedente](${functional}INFORME_VERIFICACION_TECNICA.md) |
| PKT-09 | Entorno gestionado y aislamiento global | 0 ensayos | 0 | 0 | 0 | NO EJECUTADO | [Límites](PAQUETE_LOCAL_REVISABLE.md) |
| PKT-10 | Selección de intento más reciente | 3 pruebas Node | 3 | 0 | 0 | APROBADO: fixtures de metadatos | [TAP](unitarias/seleccion-intentos.stdout.log), [recibo](unitarias/seleccion-intentos.meta.json) |

Los tres recorridos duraron ${runs.map(r => r.durationSeconds).join(', ')} segundos de proceso. Son ejecuciones repetidas con denominadores propios; no deben sumarse. Los 22 controles finales son comprobaciones del runner, no 22 suites Jest o 22 casos de negocio.

## Contratos, integración y seguridad comprobados

El recorrido normaliza la copia al catálogo inicial, mide tres estados con barrera y ejecuta cuatro variantes locales en orden. El retorno anticipado, función alterada, disparador deshabilitado y tabla no inventariada provocan rechazos específicos. El principal original también rechaza la deriva causada por la barrera. Cada etapa integrada verifica catálogo, digest de barrera, contenido sintético, secuencias y rechazo de la RPC de sonda. Al concluir se retira la barrera, se recupera la huella ${state.finalFingerprint} y se verifica origen intacto. [22 controles](integracion/resultado-final.json), [estado](integracion/estado-final.json).

El primer fallo detectó diferencias de finales de línea en ${cause.differingFunctionItems} definiciones restauradas. La primera corrección preservó los bytes del SQL original; una segunda corrigió el separador SQL del digest. Se conservaron registros y variantes de todos los intentos. No se relajaron los resultados esperados del catálogo para aprobar un estado distinto. [Diagnóstico](integracion/diagnostico-retorno.json), [comparación](integracion/diferencias-retorno.json), [corrección final](integracion/correccion-separador-digest.json).

## Unitarias, componentes, E2E, web y Android

No se modificó lógica del producto ni se repitieron aquí las suites o compilaciones. Los antecedentes conservan sus propios SHA y denominadores: 434 Jest/91 suites, Chromium 1/1 y Android local 14/14 en el [expediente funcional](${functional}INFORME_VERIFICACION_TECNICA.md). No se trasladan al deployment público, a otro APK o a servicios gestionados. El CI posterior a este commit se comprobará separadamente, sin modificar el sello.

Por separado, tres pruebas unitarias Node con metadatos sintéticos verificaron que el informe seleccione el intento exitoso más reciente aunque tenga un nombre con sufijo, y rechace rutas, fechas o estados inválidos. No son pruebas de módulos de negocio ni integración PostgreSQL; su denominador no se suma a los 22 controles.

## Incidencias, limitaciones y decisión

La apertura previa del entorno falló con ECONNREFUSED porque Docker estaba cerrado; se inició la aplicación y se verificó nuevamente el origen local. No se generaron resultados simulados ni se desbloqueó el respaldo. El archivo/contexto del 5 de noviembre se preservó. La revisión independiente, [privacidad](PRIVACIDAD.json), [integridad](INTEGRIDAD.json) y [manifiesto](MANIFIESTO_SHA256.json) completan el registro.

Continúan pendientes la cobertura gestionada de Auth/Storage y efectos externos, respaldo vigente, paquete institucional completo y autorización. La ventana del 7 de noviembre caducó. Este ensayo no permite afirmar que producción esté actualizada ni que exista aislamiento global. [Paquete y límites](PAQUETE_LOCAL_REVISABLE.md), [matriz](MATRIZ_VERIFICACIONES_TESIS.md), [propuesta académica](RESULTADOS_PARA_TESIS_4_5.md).
`);
const names = ['Caso de uso de gamificación', 'Servicio público de gamificación', 'Identidad del atleta', 'Wallet y monedas', 'Tienda cosmética', 'Asistencia', 'Pagos', 'Compilación del proyecto'];
writeReport('MATRIZ_VERIFICACIONES_TESIS.md', `# Matriz de trazabilidad

La nueva ejecución valida compatibilidad de catálogo y una barrera sintética. No valida nuevamente los módulos de la Tabla 4-6. Los archivos y casos funcionales anteriores se conservan en su [matriz de origen](${functional}MATRIZ_VERIFICACIONES_TESIS.md).

| Categoría | Archivos de prueba relacionados | Casos nuevos de la categoría | Resultado | Tipo / mocks o servicios | Límite / evidencia |
|---|---|---|---|---|---|
${names.map(name => `| ${name} | [Archivos por categoría en la matriz previa](${functional}MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO | No se invocó la funcionalidad | El ensayo SQL no demuestra este caso de negocio; [informe](INFORME_VERIFICACION_TECNICA.md) |`).join('\n')}

| Complemento | Archivo / control | Casos | Resultado real | Dependencias y límites | Evidencia |
|---|---|---|---|---|---|
| Integración SQL final | packet-rehearse.cjs | 22 controles | 22 aprobados, 0 fallidos | PostgreSQL real, sin mocks; 68 filas sintéticas, no institucionales | [Resultado](integracion/resultado-final.json) |
| Intentos previos | Mismo runner | 20 y 18, por separado | 19/20 y 17/18; fallos conservados y corregidos | No sumar con la repetición final | [Primer registro](integracion/ensayo-paquete.stdout.log), [segundo](integracion/ensayo-paquete-final.stdout.log) |
| Seguridad de guardas | Incluida dentro de 22 controles | Subconjunto, no denominador adicional | Se rechazan alteración, inventario incompleto y orden incorrecto | Sin pruebas gestionadas de denegación HTTP o entrega externa | [Paquete](PAQUETE_LOCAL_REVISABLE.md) |
| Playwright / Android / builds | No ejecutado aquí | 0 | NO EJECUTADO | Resultados históricos no trasladados a producción | [Antecedente](${functional}INFORME_VERIFICACION_TECNICA.md) |
`);
writeReport('RESULTADOS_PARA_TESIS_4_5.md', `# Propuesta para revisión académica del apartado 4.5

En la verificación complementaria del 9 de noviembre de 2026 se ensayó la compatibilidad entre una barrera SQL de mantenimiento y el paquete de avance y retorno, sobre una copia local del catálogo con 48 tablas, 68 filas sintéticas y siete secuencias. El recorrido final aprobó 22 de 22 controles automatizados con PostgreSQL real y sin repositorios simulados. Las cuatro etapas conservaron los digests del contenido sintético y los estados de secuencia; al concluir se retiró la barrera, se recuperó el catálogo inicial y se comprobó que la base origen no había cambiado ([resultado final](integracion/resultado-final.json), [estado posterior](integracion/estado-final.json)). Los controles verificaron además el rechazo de un retorno ejecutado fuera de orden y de cambios en la función, el estado de un disparador o el inventario de tablas.

Se conservaron dos recorridos previos con resultados 19/20 y 17/18, cuyos fallos se debieron al tratamiento de finales de línea durante la generación de variantes y del separador del digest. Las correcciones preservaron los bytes originales y las comprobaciones de catálogo; estos recorridos no se sumaron al denominador final ([primer fallo](integracion/ensayo-paquete.stdout.log), [segundo fallo](integracion/ensayo-paquete-final.stdout.log), [causas documentadas](PAQUETE_LOCAL_REVISABLE.md)). El resultado acredita integración SQL local del catálogo y no una restauración institucional o un aislamiento completo de servicios gestionados. No se repitieron en esta fase Jest, Playwright o compilaciones web/Android, y permanecen pendientes respaldo vigente y cobertura de Auth/Storage y efectos externos. Estas verificaciones no aportan resultados de usabilidad, motivación o capacidad de interacción con usuarios.
`);
console.log(JSON.stringify({ documents: 3, localPacket: 1, finalControls: 22, productionChanged: false }));
