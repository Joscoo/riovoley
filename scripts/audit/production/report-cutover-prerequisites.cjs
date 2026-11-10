'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const h = require('../../e2e/local/harness.cjs');
assert.match(path.basename(h.evidence), /^\d{8}-\d{6}-prerrequisitos-corte-[a-f0-9]{7}$/);
assert.ok(!fs.existsSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json')), 'SEALED_PACKET');
const read = name => JSON.parse(fs.readFileSync(path.join(h.evidence, name), 'utf8'));
const c = read('CONTEXTO.json'), b = read('seguridad/respaldos-administrados.json');
const old = read('seguridad/respaldo-logico-existente.json'), org = read('seguridad/plan-organizacion-mcp.json');
const refs = read('seguridad/canales-cliente-revisados.json');
assert.equal(b.responseRecognized, true); assert.equal(org.toolIsError, false);
const source = file => path.relative(h.evidence, path.join(h.root, file)).replaceAll('\\', '/');
const previous = '../20261105-160424-transicion-lectura-d2b43e4/';
const functional = '../20261105-152944-notifications-cancel-e903a31/';
const docs = 'https://supabase.com/docs/guides/platform/backups';
const sum = { reportedAt: new Date().toISOString(), baseCommit: c.baseCommit,
  managedBackupRead: { exitCode: b.exitCode, recognized: b.responseRecognized, backupsReturnedNull: b.backupsReturnedNull,
    listedBackupCount: b.listedBackupCount, physicalRecoveryMetadataEmpty: b.physicalRecoveryMetadataEmpty, pitrEnabled: b.pitrEnabled },
  organizationPlan: org.plan, ciphertextMatchesReceipt: old.ciphertextMatchesReceipt, sourceReferencesMatched: refs.references.length,
  newFunctionalTests: 0, newBuilds: 0, freshBackupPerformed: false, newRestorePerformed: false,
  effectiveWriteIsolationDemonstrated: false, productionChanged: false, productionExecutionAuthorized: false, releaseReady: false,
  decision: 'NO INICIAR: respaldo vigente al corte, aislamiento efectivo, calendario y autorizacion pendientes.' };
h.write('RESULTADOS_AUTOMATIZADOS.json', sum);
h.write('seguridad/documentacion-consultada.json', { tool: 'supabase_search_docs', source: docs,
  consultedAt: read('seguridad/documentacion-mcp.meta.json').finishedAt,
  factsParaphrased: ['Daily backups are documented for Pro, Team and Enterprise; free projects are advised to export data and keep off-site copies.',
    'Database backups contain Storage metadata, not Storage object bytes.', 'PITR requires an eligible paid plan and compute add-on.'],
  fullSourceCopied: false, providerOfferingChanged: false });
const rows = refs.references.map(r => `| ${r.channel} | [${r.file}](${source(r.file)}) · línea ${r.line} |`).join('\n');
h.write('CRITERIOS_CORTE_Y_RETORNO.md', `# Criterios propuestos de corte y retorno

Estado: preparación documental; no habilita mantenimiento, no bloquea tráfico y no autoriza SQL o despliegues. Responsable confirmado: titular de la sesión. Ventana propuesta: 7 de noviembre de 2026, 22:00–23:30 Ecuador (UTC−5), todavía por confirmar. Android continúa fuera de distribución. El [paquete anterior](${previous}PAQUETE_TRANSICION_PROPUESTO.md) identifica destinos, hashes y orden SQL/Edge/web; no se reemplazan sus cuatro SQL.

## Decisión antes del primer cambio

| Condición | Evidencia exigida al corte | Estado actual |
|---|---|---|
| Recuperación de datos | Snapshot identificado y verificable del estado de corte; recuperación aislada y cobertura SQL, Storage y configuración conocidas. Registrar horas reales; no asumir RPO/RTO. | BLOQUEADO: la copia lógica es del ${old.createdAt}; su hash coincide, pero no acredita vigencia futura. La consulta administrada no estableció punto recuperable. |
| Escrituras y clientes anteriores | Mecanismo implementado y ensayado que impida las operaciones incompatibles de sesiones abiertas y clientes anteriores, con denegación comprobada en entorno aislado para cada vía afectada. | BLOQUEADO: no se implementó ni activó un mecanismo global en esta fase. |
| Artefactos y precondiciones | Revalidar SHA candidato, CI, destinos, huellas de catálogo y hashes de avance/retorno inmediatamente antes de la ventana. | Preparados en la revisión anterior; requieren nueva lectura al corte. |
| Integraciones | Decidir explícitamente si correo, push y scheduler son requisitos del release; si lo son, aportar su comprobación autorizada y aislada. No aprobar una entrega por ausencia de errores locales. | Pendiente de aceptación; comprobaciones con claves excluidas por el usuario. |
| Calendario y autoridad | Confirmación institucional de horario y autorización explícita del paquete concreto. | Propuesta horaria y responsable disponibles; ejecución no autorizada. |

Si falta cualquiera de los requisitos aplicables, no iniciar SQL, despliegue Edge o promoción web. Un plan free, WAL-G habilitado, una respuesta HTTP 200, CI verde, ausencia momentánea de actividad o un marcador de sesión no sustituyen estas evidencias.

## Alcance del control de clientes

El código usa un cliente Supabase para operaciones que no tienen por qué pasar por la página web alojada en Vercel. Estas referencias se comprobaron por archivo, línea y SHA-256; no se invocaron:

| Referencia | Fuente |
|---|---|
${rows}

Son referencias seleccionadas, no un inventario exhaustivo de endpoints. La operación Storage citada crea una URL firmada; no demuestra subida de objetos. Bloquear navegación web no demuestra bloqueo de REST/RPC, Auth, Storage o Edge por su URL directa. Los marcadores SQL solo participan en las guardas del paquete. No se ensayaron denegaciones institucionales ni se revocaron sesiones, roles o permisos.

Cualquier mecanismo nuevo de aislamiento requiere propuesta propia, ensayo local y autorización para activarlo. Si modifica el catálogo cubierto por la huella, debe revisarse el paquete SQL y repetirse su avance/retorno; no se debe eludir la guarda de deriva para hacer coincidir el ensayo.

## Criterios durante una futura ejecución autorizada

1. Antes de SQL, abortar el inicio ante deriva de huella/hash/destino, respaldo sin vigencia o clientes sin aislamiento demostrado. No establecer los marcadores para simular condiciones que no existen.
2. Después de cada etapa, no avanzar si el comando falla, aparece un error inesperado, falta una RPC requerida, difieren permisos/huella previstos o falla un contrato de aceptación. Conservar código, hora y metadatos sin datos personales.
3. Los smoke de aceptación deben tener cuentas y efectos expresamente autorizados; esta preparación no permite crear registros ni enviar correo/push institucional. La ausencia de dicho ensayo mantiene pendiente la aceptación funcional gestionada.
4. Solo reabrir con etapas y criterios aprobados. La reserva total de 90 minutos es una propuesta, no una duración de recuperación medida. Si se aproxima el límite sin aceptación, mantener el aislamiento y solicitar decisión operativa; no improvisar una restauración.

## Retorno

No se ejecuta como parte del avance normal. El responsable decide entre corrección hacia adelante y retorno, preservando las escrituras posteriores al corte antes de cualquier recuperación de datos. El orden SQL preparado es retorno complementario de reportes y después retorno principal; no ejecutar retorno contra una huella distinta de la prevista. Mantener coherencia entre SQL, Edge y cliente; no volver un componente mientras otro siga usando contratos incompatibles. Un retorno de esquema no restaura datos borrados y un restore puede perder cambios posteriores.

El estado objetivo debe comprobar catálogo, contratos, versión web/Edge y tratamiento de los cambios posteriores. Los ensayos locales previos no acreditan un retorno administrado en producción ni recuperación integral de Supabase. Si no se puede demostrar compatibilidad, conservar mantenimiento y escalar al responsable.
`);
h.write('INFORME_VERIFICACION_TECNICA.md', `# Informe de verificación técnica: prerrequisitos del corte

Proyecto RIOVOLEY. Commit base ${c.baseCommit}. Inicio UTC ${c.startedAt}; consulta CLI ${b.startedAt}–${b.finishedAt}. Sistema ${c.platform}/${c.architecture}, versión ${c.osRelease}, Node ${c.node}. El [contexto](CONTEXTO.json) registra cambios locales iniciales. Las fechas UTC se convierten a Ecuador restando cinco horas.

## Alcance y metodología

Se consultaron metadatos de respaldo mediante la sesión CLI existente para el proyecto ${c.projectId}, el plan organizacional mediante MCP y la documentación oficial. No se introdujeron claves, descifraron archivos, crearon respaldos, restauraron servicios ni modificaron registros o configuración institucional. También se calculó SHA-256 del ciphertext existente y se verificaron siete referencias estáticas del repositorio. No constituye una prueba de penetración.

Comandos reproducibles: «node scripts/audit/production/check-cutover-prerequisites.cjs init», después «node scripts/audit/production/check-cutover-prerequisites.cjs collect». El segundo ejecuta exclusivamente la consulta «supabase backups list --project-ref ${c.projectId} --output json» de la CLI portátil instalada. Se consulta su sesión existente sin imprimirla. Requiere acceso de lectura previo; no incluye login interactivo, restauración o actualización. [Comando, duración y código real](seguridad/respaldos-administrados.meta.json).

La respuesta reconocida fue backupsReturnedNull=${b.backupsReturnedNull}, physicalRecoveryMetadataEmpty=${b.physicalRecoveryMetadataEmpty}, pitrEnabled=${b.pitrEnabled}; código ${b.exitCode}. El valor null no se transforma en un arreglo vacío ni se presenta como un recuento de cero backups. WAL-G habilitado no establece por sí mismo un punto recuperable. El plan observado es ${org.plan}. [Consulta](seguridad/respaldos-administrados.json), [plan MCP](seguridad/plan-organizacion-mcp.json).

La [documentación oficial de respaldos](${docs}) describe copias diarias para planes Pro, Team y Enterprise y recomienda exportaciones y custodia externa para proyectos free; los bytes de Storage no forman parte del respaldo de base de datos. Se registraron [fuente y alcance](seguridad/documentacion-consultada.json). No se contrató ningún servicio. La conclusión sobre este proyecto procede de su respuesta real, no solo de su plan.

## Resultados de esta fase

Los denominadores expresan consultas o controles documentales, no pruebas funcionales.

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| COR-01 | Lectura CLI de respaldos administrados | 1 consulta | 1 | 0 | 0 | APROBADO: consulta | [JSON](seguridad/respaldos-administrados.json) |
| COR-02 | Existencia de punto recuperable administrado vigente | 0 restauraciones | 0 | 0 | 0 | BLOQUEADO: no acreditado | [Respuesta real](seguridad/respaldos-administrados.json) |
| COR-03 | Lectura del plan organizacional | 1 consulta MCP | 1 | 0 | 0 | APROBADO: lectura | [Recibo](seguridad/plan-organizacion-mcp.json) |
| COR-04 | Integridad del ciphertext lógico existente | 1 comparación SHA-256 | 1 | 0 | 0 | APROBADO: bytes cifrados | [Control](seguridad/respaldo-logico-existente.json) |
| COR-05 | Referencias estáticas de canales/marcador | 7 referencias | 7 coincidencias | 0 | 0 | APROBADO: localización; no bloqueo | [Fuentes](seguridad/canales-cliente-revisados.json) |
| COR-06 | Aislamiento efectivo de clientes/escrituras | 0 ensayos | 0 | 0 | 0 | NO EJECUTADO: mecanismo pendiente | [Criterios](CRITERIOS_CORTE_Y_RETORNO.md) |
| COR-07 | Jest, contratos e integración funcional | 0 casos nuevos | 0 | 0 | 0 | NO EJECUTADO en esta fase documental | [Antecedente](${functional}INFORME_VERIFICACION_TECNICA.md) |
| COR-08 | Playwright y Android en ejecución | 0 casos nuevos | 0 | 0 | 0 | NO EJECUTADO en esta fase | [Antecedente](${functional}INFORME_VERIFICACION_TECNICA.md) |
| COR-09 | Compilación web y nativa | 0 compilaciones nuevas | 0 | 0 | 0 | NO EJECUTADO en esta fase | [Antecedente](${functional}INFORME_VERIFICACION_TECNICA.md) |

## Unitarias, contratos, Playwright, web y Android

No se modificó lógica del producto y no se repitieron estas suites o compilaciones. El expediente funcional anterior documenta sus 434 casos Jest/91 suites, prueba controlada Chromium 1/1 y 14/14 escenarios Android locales con su APK identificado; son denominadores distintos y ejecuciones anteriores. No se trasladan esos resultados al deployment público ni a un APK release posterior. [Trazabilidad de esta fase](MATRIZ_VERIFICACIONES_TESIS.md).

## Seguridad, permisos e incidencias

El ciphertext tiene ${old.encryptedBytes} bytes, fue generado en ${old.createdAt} y tenía ${old.ageHoursAtCheck} horas al comprobarse. Coincide con su recibo; no se demostró que incluya cambios posteriores o que sea vigente al futuro corte. No hubo nuevo descifrado ni restore. La ausencia de punto administrado acreditado impide reemplazar esta limitación con una afirmación de recuperación gestionada.

Las alertas, RLS y ausencia de RPC diaria observadas en la [revisión anterior](${previous}INFORME_VERIFICACION_TECNICA.md) mantienen su fecha y alcance; aquí no se volvieron a consultar ni se corrigieron. No se invocaron APIs de negocio, Auth, Storage o Edge. El aislamiento de escrituras sigue sin demostración y no se consideró suplido por Vercel, ausencia de actividad o marcadores SQL.

## Decisión y pendientes

No iniciar la transición. Los [criterios de corte/aborto/retorno](CRITERIOS_CORTE_Y_RETORNO.md) concretan la evidencia necesaria, sin activar medidas. Pendientes: respaldo vigente al corte y cobertura de recuperación, mecanismo de aislamiento ensayado, aceptación de integraciones excluidas de comprobación con claves, confirmación de calendario y autorización expresa del paquete. Android continúa solo en desarrollo/pruebas. No se ejecutó despliegue, SQL institucional, cambio de permisos, distribución, envío de mensajes o modificación de credenciales.

La revisión de [privacidad](PRIVACIDAD.json), [integridad](INTEGRIDAD.json) y [manifiesto](MANIFIESTO_SHA256.json) se realiza antes del sellado. El texto [para revisión académica](RESULTADOS_PARA_TESIS_4_5.md) no modifica el documento de tesis.
`);
const categories = ['Caso de uso de gamificación', 'Servicio público de gamificación', 'Identidad del atleta', 'Wallet y monedas', 'Tienda cosmética', 'Asistencia', 'Pagos', 'Compilación del proyecto'];
const priorMatrix = JSON.parse(fs.readFileSync(path.join(h.root, 'docs/tesis/evidencias/verificacion-tecnica/20261105-152944-notifications-cancel-e903a31/RESULTADOS_AUTOMATIZADOS.json'), 'utf8'));
assert.ok(priorMatrix);
h.write('MATRIZ_VERIFICACIONES_TESIS.md', `# Matriz de verificaciones para la tesis

Fase documental sobre ${c.baseCommit}; cero nuevos casos funcionales y cero nuevas compilaciones. Para cada categoría, los archivos, casos y resultados de pruebas anteriores permanecen en la [matriz funcional original](${functional}MATRIZ_VERIFICACIONES_TESIS.md), con fecha, denominador y tipo de dependencia propios. Esta matriz no inventa repeticiones.

| Categoría de Tabla 4-6 | Archivos de prueba relacionados | Casos nuevos | Resultado de esta fase | Tipo / mocks o servicios | Limitación / evidencia |
|---|---|---|---|---|---|
${categories.map(name => `| ${name} | [Consultar archivos específicos en matriz anterior](${functional}MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO | Sin ejecución; no aplica mocks/servicios nuevos | Fase de prerrequisitos; [informe](INFORME_VERIFICACION_TECNICA.md) |`).join('\n')}

## Complementarias

| Verificación | Ejecución real | Dependencias | Resultado / limitación | Evidencia |
|---|---|---|---|---|
| Playwright / Android / compilación | 0 nuevas ejecuciones | Ninguna | No repetidas; no validar producción por resultados locales anteriores | [Antecedente](${functional}INFORME_VERIFICACION_TECNICA.md) |
| Respaldos administrados | 1 consulta CLI | API real, sesión existente; sin mocks | Consulta aprobada; punto recuperable no acreditado | [JSON](seguridad/respaldos-administrados.json) |
| Plan organizacional | 1 consulta MCP | API real; sin mocks | Lectura aprobada, plan ${org.plan}; no cambio contratado | [Recibo](seguridad/plan-organizacion-mcp.json) |
| Ciphertext lógico | 1 comparación | Archivo local cifrado real | Hash coincide; no descifrado, restore o vigencia al corte | [Control](seguridad/respaldo-logico-existente.json) |
| Canales de acceso y marcador | 7 referencias estáticas | Código real; no invocaciones | Coincidencias de fuente; no prueba funcional de bloqueo | [Fuentes y hashes](seguridad/canales-cliente-revisados.json) |
| Seguridad / mantenimiento | 0 ensayos de denegación | No ejecutado | Aislamiento efectivo pendiente; no cambio de permisos | [Criterios](CRITERIOS_CORTE_Y_RETORNO.md) |
`);
h.write('RESULTADOS_PARA_TESIS_4_5.md', `# Propuesta para revisión académica del apartado 4.5

En la revisión operativa complementaria del 5 de noviembre de 2026 se consultaron los metadatos reales de respaldo del proyecto RIOVOLEY mediante la CLI de Supabase. La consulta finalizó con código de salida cero, pero la respuesta no permitió acreditar un punto de recuperación administrado: el campo de respaldos fue nulo, los metadatos de recuperación física estaban vacíos y PITR se encontraba desactivado ([evidencia de la consulta](seguridad/respaldos-administrados.json)). Por separado, la comparación SHA-256 confirmó que el archivo lógico cifrado de ${old.encryptedBytes} bytes, generado el 1 de noviembre de 2026, conservaba los bytes registrados en su recibo; esta comprobación no implicó descifrarlo, restaurarlo nuevamente ni demostrar su vigencia para un corte posterior ([control de integridad](seguridad/respaldo-logico-existente.json)).

La inspección estática de siete referencias del repositorio identificó operaciones cliente sobre Supabase y el marcador utilizado en los ensayos de ventana, sin invocar dichas operaciones ni demostrar un bloqueo efectivo de escrituras ([fuentes revisadas](seguridad/canales-cliente-revisados.json)). En esta fase no se repitieron pruebas unitarias, de integración, extremo a extremo ni compilaciones, cuyos resultados anteriores conservan su identificación en el [expediente funcional](${functional}INFORME_VERIFICACION_TECNICA.md). En consecuencia, la preparación documental del corte no se interpreta como validación del despliegue institucional: permanecen pendientes la vigencia y cobertura del respaldo y el aislamiento efectivo de clientes y escrituras, además de las condiciones operativas indicadas en los [criterios de transición](CRITERIOS_CORTE_Y_RETORNO.md). Estas comprobaciones técnicas no aportan resultados de usabilidad, motivación o capacidad de interacción con usuarios.
`);
console.log(JSON.stringify({ reportsWritten: 3, operationalCriteriaWritten: true, newFunctionalTests: 0, productionChanged: false }));
