'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const c = require('./edge-fence-context.cjs').read(), h = require('../../e2e/local/harness.cjs');
const read = f => JSON.parse(fs.readFileSync(path.join(h.evidence, f), 'utf8'));
const index = read('integracion/indice-intentos.json'), final = read(index.selected.resultFile), candidate = read('seguridad/candidato-fuentes-corregido.json');
assert.equal(final.executed, 57); assert.equal(final.passed, 57); assert.equal(final.failed, 0); assert.equal(final.cleanupPassed, true);
const statuses = {}; for (const r of final.responses) statuses[r.status] = (statuses[r.status] || 0) + 1;
const contracts = fs.readFileSync(path.join(h.evidence, 'integracion/contratos-edge.stdout.log'), 'utf8'); assert.match(contracts, /# tests 35[\s\S]*# pass 35[\s\S]*# fail 0/);
const summary = { reportedAt: new Date().toISOString(), baseCommit: c.baseCommit, attempts: index.runs, selectedAttempt: index.selected,
  finalControls: { executed: 57, passed: 57, failed: 0 }, handlerHttpResponses: final.responses.length, responseStatuses: statuses,
  actualLocalReadResponses: final.stats.localReads.length, handlerWriteAttempts: final.stats.localWritesBlocked.filter(r => r.handler !== 'safety-probe').length,
  diagnosticWriteBlocks: final.stats.localWritesBlocked.filter(r => r.handler === 'safety-probe').length, deniedNativeProbes: final.stats.nativeProbes,
  providerAttemptBlocked: final.stats.externalAttempts, businessTables: final.baseline.tables, syntheticBusinessRows: final.baseline.rows, sequencesCompared: final.baseline.sequences,
  businessSnapshotsMatch: JSON.stringify(final.baseline) === JSON.stringify(final.after), contracts: { executed: 35, passed: 35, failed: 0, syntheticClients: true },
  sourceTypecheckExitCode: read('integracion/sync-typecheck.meta.json').exitCode, candidateFrozenTypecheckExitCode: read('integracion/sync-typecheck-candidato-corregido.meta.json').exitCode,
  candidateFiles: candidate.files.length, changedCandidateSources: candidate.changedSourceFiles, providerConfigurationSynthetic: true, actualProviderCredentialsUsed: false,
  newJestExecution: false, newAndroidExecution: false, newBuilds: 0, cloudRuntimeUsed: false, productionChanged: false, releaseReady: false };
function doc(name, value) { fs.writeFileSync(path.join(h.evidence, name), (typeof value === 'string' ? value : JSON.stringify(value, null, 2)) + '\n'); }
doc('RESULTADOS_AUTOMATIZADOS.json', summary);
const previous = '../20261109-145120-auth-storage-local-b1bbef7/', functional = '../20261105-152944-notifications-cancel-e903a31/';
doc('ALCANCE_EDGE_Y_CAMBIO.md', `# Handlers Edge, cerca de red y corrección HTTP

Se ejecutaron los nueve index.ts originales en Deno local, con Auth/REST locales reales. El arnés sustituyó únicamente el arranque serve para reunir los handlers en un listener127.0.0.1:6163. No es el runtime desplegado de Supabase Cloud. Las lecturas permitidas obtienen respuestas reales; no se fabrican identidades, roles o respuestas de repositorio.

## Límites impuestos y comprobados

- cached-only exige dependencias en caché. Es una condición adicional a los permisos de red, porque Deno puede cargar importaciones estáticas fuera de los permisos de fetch ordinario.
- allow-net solo habilita127.0.0.1:55321/6163; deny-net rechaza explícitamente Resend/Google. No se concedieron permisos de ejecución, escritura o FFI.
- fetch instrumentado permite solo GET/HEAD a Auth/user y REST/users locales. Bloquea otras operaciones locales antes de realizar I/O; no sustituye sus respuestas por resultados simulados.
- Dos sondas usan nativeFetch, evitando la instrumentación, y verifican NotCapable de Deno para Resend/FCM. Un intento autorizado de correo también queda bloqueado y el handler devuelve503 EMAIL_PROVIDER_UNAVAILABLE.
- La configuración Resend es un marcador ficticio y el remitente/destinatario son de prueba. No se usaron credenciales de proveedor; Firebase y scheduler permanecieron sin configurar. Esto no verifica configuración o entrega real.

La [documentación de permisos Deno](https://docs.deno.com/runtime/fundamentals/security/) explica los permisos y su diferencia con la carga estática. Los resultados aquí proceden de las sondas y recibos del proceso, no solo de la documentación. [Registro final](${index.selected.resultFile}), [flags efectivos](${index.selected.serverMetaFile}).

## Corrección de sync-mobile-device

Sin Bearer o con JWT inválido, requireUser lanzaba Error genérico y producía500 INTERNAL_ERROR. La fase RED conservó dos fallos, ambos con expectativa401 y respuesta500. Se adoptó AuthAdminError, usado ya por el proyecto, para responder401 AUTH_REQUIRED/AUTH_INVALID. La ruta autorizada, validación del cuerpo y escrituras válidas no se cambiaron. No se modificaron expectativas para aceptar500. [RED](integracion/casos-red.json).

Dos recorridos GREEN aprobaron57/57; la repetición final exige además los códigos AUTH_REQUIRED/AUTH_INVALID. Cada fase tiene su propia comparación de datos, porque el login de preparación puede actualizar las fixtures locales. [Índice exacto](integracion/indice-intentos.json).

## Alcance de las pruebas

Los 57 controles incluyen 51 respuestas HTTP de handlers y seis controles de entorno/efectos. Verifican OPTIONS, métodos rechazados, anonimato, token inválido, rol atleta y entradas vacías de administrador. No se invocó la ruta de generación programada autorizada ni persistencia válida de dispositivos. Una respuesta400 tras autenticar no valida la ejecución completa de un caso de negocio.

Se observaron ${final.stats.localReads.length} lecturas Auth/REST reales, cero intentos de escritura de handlers y un bloqueo deliberado de escritura del propio arnés. Coincidieron los digests de ${final.baseline.tables} tablas, ${final.baseline.rows} filas sintéticas y ${final.baseline.sequences} secuencias, desde después del login hasta terminar los handlers. El signOut local posterior revocó las sesiones de prueba de esta ejecución; no acredita revocación general de JWT ni inmovilidad de todas las tablas Auth.

## Candidato y límites pendientes

Se preparó una copia privada nueva de39 archivos:28 fuentes TypeScript del repositorio actual y11 configuraciones/lock generados previamente, comprobados contra sus hashes. Solo cambió sync-mobile-device/index.ts. Su comprobación de tipos pasó con lock congelado; no se compiló un bundle Cloud ni se desplegó. El candidato/retorno anteriores se preservaron. [Manifestación de fuentes](seguridad/candidato-fuentes-corregido.json), [procedencia del arnés](seguridad/procedencia-arnes-corregida.json).

La primera preparación del candidato abortó porque buscó deno.json generados dentro del repositorio. Se conservaron los archivos parciales y se corrigió el origen a la configuración privada anterior con verificación de hashes. [Incidencia](seguridad/incidencia-preparacion-candidato.json). Además, el cierre detectó que la copia inicial incorporaba config.toml local en lugar del archivo mínimo preparado para Cloud. Se conservó esa copia, se creó un candidato nuevo con la configuración anterior verificada y se repitió el typecheck ([incidencia](seguridad/incidencia-config-candidato.json)). La advertencia DEP0040 de punycode se conserva en stderr; no bloqueó las pruebas.

No se comprobaron entrega, dominio remitente, credenciales, cuotas, disponibilidad de proveedores, scheduler habilitado, runtime Cloud, S3 o mantenimiento global. La instrumentación impide escrituras y por tanto tampoco demuestra persistencia de los flujos positivos. Los [pendientes anteriores](${previous}ALCANCE_SERVICIOS_LOCALES.md), respaldo vigente y nueva ventana/autorización no quedan cerrados por estos resultados.
`);
doc('INFORME_VERIFICACION_TECNICA.md', `# Verificación técnica: handlers Edge con red restringida

## Identificación, fecha y entorno

RIOVOLEY, base ${c.baseCommit}, contexto ${c.createdAt} UTC (Ecuador UTC−5). Windows ${c.osRelease}, Node ${c.node}, PostgreSQL ${c.serverVersion}; Deno 2.9.6, V8 15.0.245.2-rusty y TypeScript 6.0.3 según [versión real](integracion/deno-version.stdout.log). [Contexto](CONTEXTO.json). Entorno exclusivamente local: API55321, listener6163; no se usó Cloud.

## Metodología y comandos

edge-fence-context.cjs crea expediente nuevo y valida Supabase local. edge-fence-run.cjs red/green arranca Deno, importa los nueve handlers y ejecuta edge-fence-cases.cjs. edge-fence-provenance.cjs liga JSON a intervalos reales de proceso y prepara fuentes del candidato. edge-fence-report.cjs genera documentos; edge-fence-finalize.cjs verifica/sella. Los [comandos y códigos](COMANDOS.json) conservan flags, tiempos y resultados. Las sesiones locales se obtienen antes del snapshot de negocio; el arnés no lee .env.e2e institucional ni solicita credenciales.

Se usa configuración de proveedor ficticia para alcanzar las comprobaciones de autorización, manteniendo la salida bloqueada. Auth/REST son reales, los contratos35 usan clientes sintéticos y la entrega de proveedor no se simuló como éxito. No es una prueba de penetración completa.

## Resultados por denominador

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
${index.runs.map((r, i) => `| EDF-0${i + 1} | ${r.phase === 'red' ? 'RED: autenticación de dispositivos' : i === index.runs.length - 1 ? 'GREEN final con códigos estructurados' : 'Primer GREEN'} | ${r.executed} controles | ${r.passed} | ${r.failed} | 0 | ${r.failed ? 'FALLIDO: corregido' : 'APROBADO'} | [JSON](${r.resultFile}), [recibo](${r.casesMetaFile}) |`).join('\n')}
| EDF-04 | Contratos Edge existentes | 35 pruebas Node | 35 | 0 | 0 | APROBADO: clientes sintéticos | [TAP](integracion/contratos-edge.stdout.log), [recibo](integracion/contratos-edge.meta.json) |
| EDF-05 | Tipo de función modificada | 1 comprobación Deno | 1 | 0 | 0 | APROBADO | [Recibo](integracion/sync-typecheck.meta.json) |
| EDF-06 | Tipo de candidato con lock congelado | 1 comprobación Deno | 1 | 0 | 0 | APROBADO | [Recibo](integracion/sync-typecheck-candidato-corregido.meta.json) |
| EDF-07 | Jest/componentes del producto | 0 nuevos aquí | 0 | 0 | 0 | NO EJECUTADO en fase local | [Antecedente](${functional}INFORME_VERIFICACION_TECNICA.md) |
| EDF-08 | Playwright/Android/builds | 0 nuevos aquí | 0 | 0 | 0 | NO EJECUTADO en fase local | [Antecedente](${functional}INFORME_VERIFICACION_TECNICA.md) |
| EDF-09 | Cloud y entrega de proveedores | 0 ensayos | 0 | 0 | 0 | NO EJECUTADO | [Límites](ALCANCE_EDGE_Y_CAMBIO.md) |

No sumar recorridos repetidos o herramientas. El resultado final57 no equivale a57 casos funcionales de negocio: incluye51 respuestas de handlers y seis comprobaciones de seguridad/entorno. Los códigos HTTP finales fueron ${Object.entries(statuses).map(([s, n]) => s + ': ' + n).join(', ')}; los401/403/405/503 son rechazos esperados, no errores ocultados. Tiempos de proceso de casos: ${index.runs.map(r => r.durationSeconds).join(', ')} segundos.

## Integración y corrección

La fase RED detectó dos500 incorrectos de sync-mobile-device ante ausencia/invalidez de sesión. Se corrigió el mapeo tipado a401 sin cambiar rutas autorizadas o permisos. La fase final comprobó códigos AUTH_REQUIRED/AUTH_INVALID. [Cambio fuente](seguridad/cambio-sync-mobile-device.diff), [RED](integracion/casos-red.json), [resultado final](${index.selected.resultFile}).

Durante los handlers hubo ${final.stats.localReads.length} respuestas de lectura Auth/REST reales, cero escrituras intentadas por handlers, un rechazo de escritura deliberado del arnés y dos denegaciones de red nativa NotCapable. Se mantuvieron los digests de47 tablas/4598 filas sintéticas y10 secuencias entre los snapshots de cada ejecución. No se acredita ausencia de efectos fuera de ese conjunto o persistencia de flujos positivos.

## Procedencia, seguridad y límites

La copia privada contiene39 archivos;11 configuraciones generadas se recuperaron del candidato anterior con hash comprobado, y28 fuentes TypeScript se copiaron del repositorio. Solo cambió la función corregida. No se sobrescribió el candidato/retorno anterior ni se generó bundle Cloud. Las fuentes compartidas y el arnés constan en [candidato](seguridad/candidato-fuentes-corregido.json), [procedencia](seguridad/procedencia-arnes-corregida.json) y [fuentes](FUENTES_EVALUADAS.json).

La [revisión independiente](seguridad/revision-independiente.json) no encontró bloqueantes; no repitió pruebas. DEP0040/punycode y el incidente ENOENT de preparación se conservan. El arnés fuerza cached-only porque los permisos fetch no controlan toda carga estática. La [documentación Deno](https://docs.deno.com/runtime/fundamentals/security/) se usa como referencia, sin sustituir los resultados de las sondas.

El ensayo no valida claves, entrega, cuotas, dominio remitente, scheduler activo, S3, runtime gestionado o mantenimiento global. No se modificó producción. Siguen pendientes respaldo vigente, paquete institucional completo y nueva ventana/autorización. El CI posterior al commit se comprobará separadamente, sin modificar el sello.

[Privacidad](PRIVACIDAD.json), [integridad](INTEGRIDAD.json), [manifiesto](MANIFIESTO_SHA256.json), [matriz](MATRIZ_VERIFICACIONES_TESIS.md) y [texto académico](RESULTADOS_PARA_TESIS_4_5.md).
`);
const names = ['Caso de uso de gamificación', 'Servicio público de gamificación', 'Identidad del atleta', 'Wallet y monedas', 'Tienda cosmética', 'Asistencia', 'Pagos', 'Compilación del proyecto'];
doc('MATRIZ_VERIFICACIONES_TESIS.md', `# Matriz de trazabilidad

No se repiten los casos de negocio de la Tabla 4-6. Los archivos, cantidades y dependencias previos constan en la [matriz funcional](${functional}MATRIZ_VERIFICACIONES_TESIS.md).

| Categoría | Archivos relacionados | Casos nuevos de la categoría | Resultado | Tipo/dependencias | Límite/evidencia |
|---|---|---|---|---|---|
${names.map(n => `| ${n} | [Archivos específicos en matriz anterior](${functional}MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Sin invocación del caso de negocio | Los rechazos Edge no validan este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |`).join('\n')}

| Complemento | Archivo/fase | Casos | Resultado real | Dependencias | Evidencia/límite |
|---|---|---|---|---|---|
| Handler dispositivos RED | edge-fence-cases.cjs red | 2 | 0 aprobados/2 fallidos: esperaba401 y recibía500 | Auth real local, sin mock de identidad | [RED](integracion/casos-red.json) |
| Nueve handlers y cerca final | edge-fence-cases.cjs green | 57 | 57 aprobados/0 fallidos | Deno y Auth/REST reales; listener/fetch instrumentados; proveedor sintético | [Resultado](${index.selected.resultFile}); sin entrega/Cloud |
| Contratos existentes | tests/unit/*edge*.test.* y scripts auxiliares del comando | 35 | 35 aprobados | Clientes simulados, no persistencia real | [TAP](integracion/contratos-edge.stdout.log) |
| Typecheck | sync-mobile-device, repositorio y candidato | 1 por comando | Ambos códigos0 | Deno y lock congelado del candidato | [Fuente](integracion/sync-typecheck.meta.json), [candidato](integracion/sync-typecheck-candidato-corregido.meta.json) |
| Playwright/Android/builds | No ejecutados aquí | 0 | NO EJECUTADO | Antecedentes conservan SHA propio | [Anterior](${functional}INFORME_VERIFICACION_TECNICA.md) |
`);
doc('RESULTADOS_PARA_TESIS_4_5.md', `# Propuesta para revisión académica del apartado 4.5

Como verificación complementaria, se ejecutaron los nueve handlers Edge originales en Deno local, conectados a servicios reales de Auth y REST y con permisos de red restringidos. La ejecución final aprobó 57 de 57 controles, que incluyeron 51 respuestas HTTP y seis comprobaciones de entorno y efectos. Se observaron dos denegaciones nativas NotCapable para Resend y FCM, cero intentos de escritura desde los handlers y coincidencia de los digests de 47 tablas, 4.598 filas sintéticas y diez secuencias durante las llamadas ensayadas ([registro final](${index.selected.resultFile})). La configuración del proveedor fue ficticia y no se atribuyeron resultados de entrega a esa ejecución.

La fase inicial conservó dos fallos: sync-mobile-device respondía 500 ante un token ausente o inválido, en lugar del 401 esperado. Se corrigió el tratamiento mediante el error tipado de autenticación utilizado por el proyecto; los recorridos posteriores comprobaron las respuestas 401 y los códigos AUTH_REQUIRED/AUTH_INVALID sin cambiar las expectativas ([RED](integracion/casos-red.json), [cambio](seguridad/cambio-sync-mobile-device.diff)). Por separado, aprobaron 35 pruebas de contratos con clientes simulados y dos comprobaciones de tipos, sin combinar esos denominadores con el recorrido HTTP ([contratos](integracion/contratos-edge.stdout.log), [candidato](integracion/sync-typecheck-candidato-corregido.meta.json)). El resultado no valida la entrega de notificaciones, el scheduler habilitado, S3, persistencia de flujos positivos o el runtime gestionado de Supabase Cloud. Tampoco aporta resultados de usabilidad, motivación o capacidad de interacción con usuarios.
`);
console.log(JSON.stringify({ academicDocuments: 3, scopeDocument: 1, finalControls: 57, contracts: 35, productionChanged: false }));
