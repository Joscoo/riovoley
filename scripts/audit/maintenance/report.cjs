'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const lab = require('./lab.cjs'), c = lab.context(), h = require('../../e2e/local/harness.cjs');
assert.equal(c.evidence, h.evidence);
const read = file => JSON.parse(fs.readFileSync(path.join(h.evidence, file), 'utf8'));
const phases = ['baseline', 'red', 'green', 'green-final'].map(label => {
  const body = fs.readFileSync(path.join(h.evidence, 'integracion', label + '.stdout.log'), 'utf8');
  const count = name => { const m = body.match(new RegExp('^# ' + name + ' (\\d+)$', 'm')); assert.ok(m, name); return Number(m[1]); };
  const meta = read('integracion/' + label + '.meta.json');
  return { label, tests: count('tests'), passed: count('pass'), failed: count('fail'), skipped: count('skipped'), cancelled: count('cancelled'),
    durationSeconds: meta.durationSeconds, exitCode: meta.exitCode, start: meta.start, end: meta.end };
});
assert.deepEqual(phases.map(p => [p.tests, p.passed, p.failed, p.exitCode]), [[5, 5, 0, 0], [1, 0, 1, 1], [44, 44, 0, 0], [47, 47, 0, 0]]);
const final = read('integracion/estado-final-laboratorio.json'), sql = read('seguridad/propuestas-sql-sin-cambios.json');
const review = read('seguridad/revision-independiente.json'), fixture = read('integracion/fixture-antes.json');
assert.deepEqual(fixture.tables, final.tables); assert.equal(final.activeGateTriggers, 0); assert.equal(final.gateSchemaAbsent, true);
assert.ok(sql.files.length === 4 && sql.files.every(f => f.matchesReviewed)); assert.equal(review.blockingFindings, 0);
const summary = { reportedAt: new Date().toISOString(), baseCommit: c.baseCommit, phases, serverVersion: c.serverVersion,
  syntheticRelations: lab.relations.length, loginActors: lab.actors.map(a => ({ name: a.name, login: a.login, role: a.role || null })),
  syntheticRowsUnchanged: true, gateRemoved: true, databasePreserved: true, productionSqlFilesUnchanged: 4,
  newJestCases: 0, newPlaywrightCases: 0, newAndroidCases: 0, newBuilds: 0,
  realPostgres: true, mockedRepositories: false, httpAuthExercised: false, storageBytesExercised: false,
  fullMaintenanceIsolationEstablished: false, productionChanged: false, releaseReady: false };
h.write('RESULTADOS_AUTOMATIZADOS.json', summary);
const fileLink = file => '[' + file + '](' + path.relative(h.evidence, path.join(h.root, file)).replaceAll('\\', '/') + ')';
const prior = '../20261105-171049-prerrequisitos-corte-922a374/';
const functional = '../20261105-152944-notifications-cancel-e903a31/';
const phaseRows = phases.map((p, i) => `| MNT-0${i + 1} | ${['Control de escrituras sin barrera', 'RED: rechazo requerido sin barrera', 'Primera barrera SQL', 'Barrera con regresiones adicionales'][i]} | ${p.tests} | ${p.passed} | ${p.failed} | ${p.skipped} | ${i === 1 ? 'FALLIDO ESPERADO: demuestra ausencia inicial' : 'APROBADO'} | [TAP](integracion/${p.label}.stdout.log), [código y tiempo](integracion/${p.label}.meta.json) |`).join('\n');
h.write('PROPUESTA_AISLAMIENTO_SQL.md', `# Capa SQL de aislamiento: ensayo local y límites

Se preparó y ensayó un prototipo, no una migración de producción. El código está en ${fileLink('scripts/audit/maintenance/gate.cjs')}; las guardas de destino y fixture están en ${fileLink('scripts/audit/maintenance/lab.cjs')}. No contiene una opción para seleccionar Cloud ni otro host/puerto. Requiere base nueva con nombre y comentario propios en 127.0.0.1:55322.

## Comportamiento comprobado

Siete relaciones sintéticas reciben un BEFORE STATEMENT para INSERT, UPDATE, DELETE y TRUNCATE. El disparador es SECURITY INVOKER y utiliza search_path fijo. Rechaza con SQLSTATE 55000 y mensaje RIOVOLEY_LOCAL_WRITE_GATE. La excepción administrativa exige session_user y current_user postgres, y rol de sesión none. Una llamada SECURITY DEFINER no convierte al originador en la sesión administrativa. No depende de una bandera en tabla que una transacción anterior pueda leer desde un snapshot antiguo.

El [TAP final](integracion/green-final.stdout.log) verifica 47 casos: cinco actores, DML, SELECT, RPC sintética SECURITY DEFINER, vista security_invoker, particiones, UPSERT, UPDATE sin filas, sentencia preparada y transacción REPEATABLE READ anteriores al cierre, marcador de ventana y excepción administrativa. También se ensayan lock_timeout y rollback transaccional de instalación/retirada parcial. Las identidades de conexión son reales en PostgreSQL local; SET ROLE reproduce los roles de aplicación sin autenticar usuarios mediante Supabase Auth HTTP.

La [documentación de CREATE TRIGGER de PostgreSQL 17](https://www.postgresql.org/docs/17/sql-createtrigger.html) describe disparadores por sentencia y su aplicación a TRUNCATE. La distinción entre identidad de sesión y efectiva está en [funciones de información](https://www.postgresql.org/docs/17/functions-info.html); los conflictos entre escrituras y DDL se documentan en [bloqueos explícitos](https://www.postgresql.org/docs/17/explicit-locking.html). Los resultados aquí publicados proceden del ensayo y no se deducen solo de esas referencias.

## Lo que esta capa no acredita

- No bloquea llamadas externas ni demuestra suspensión de correo, push o scheduler.
- No demuestra que un servicio Storage no modifique bytes antes de fallar su operación SQL. No se ejercitó Storage API.
- No prueba login, refresh o recuperación Auth HTTP. Las tablas auth y storage son fixtures mínimas, no los esquemas gestionados completos.
- No cubre secuencias, large objects, DDL privilegiado, objetos nuevos no inventariados o escritores postgres autorizados. El bypass administrativo se comprobó explícitamente y requiere coordinación operativa.
- No implementa cierre global del sitio, revocación de sesiones ni control de versiones de clientes. No se modificaron roles globales o contraseñas.

Por tanto, no debe activarse como supuesto mantenimiento integral. Los cinco controles abiertos demostraron permisos de escritura antes del cierre; los rechazos finales comprueban código y mensaje específicos, no solo cualquier error de permiso. Las lecturas siguen disponibles en la fixture.

## Integración futura requerida

Antes de convertirlo en propuesta institucional deben inventariarse todas las relaciones y vías afectadas, revisar propiedad/permisos, mecanismos de efectos externos y comportamiento de servicios gestionados en un entorno separado. Los cuatro SQL de producción [conservan sus hashes](seguridad/propuestas-sql-sin-cambios.json); no se les añadió este prototipo. Instalar disparadores sobre relaciones cubiertas por su huella cambia el catálogo: requiere un paquete nuevo y repetir avance/retorno, sin eludir las guardas existentes.

El prototipo se retiró al concluir. La [consulta posterior](integracion/estado-final-laboratorio.json) registra cero disparadores propios y ausencia del esquema gate_guard, con snapshots de fixtures iguales y base conservada. No hay aislamiento activo en producción ni autorización de despliegue. Los [criterios de corte anteriores](${prior}CRITERIOS_CORTE_Y_RETORNO.md) siguen pendientes en su alcance global, especialmente respaldo vigente y cobertura externa.
`);
h.write('INFORME_VERIFICACION_TECNICA.md', `# Verificación técnica: barrera SQL en laboratorio

## Identificación y entorno

RIOVOLEY, commit base ${c.baseCommit}. Base y expediente creados ${c.createdAt} UTC (Ecuador UTC−5). Windows ${c.osRelease}, Node ${c.node}, PostgreSQL local ${c.serverVersion}, conexión fija 127.0.0.1:55322. Base única ${c.database}; siete relaciones sintéticas en public, gamification, auth y storage, con particiones. [Contexto](CONTEXTO.json). No se copiaron filas institucionales ni modificaron roles globales, contraseñas, servicios o permisos institucionales.

## Alcance y método

Ensayo de integración con PostgreSQL real y conexiones locales de authenticator, supabase_auth_admin y supabase_storage_admin. Authenticator usa SET ROLE anon, authenticated o service_role; no son cuentas de atletas ni login mediante Auth HTTP. No se usan repositorios simulados. Las tablas y RPC son fixtures propias y no reproducen las funcionalidades completas del producto. El alcance no es una auditoría de penetración.

Primero se verificaron escrituras permitidas. La fase RED exigió rechazo antes de instalar la barrera y falló por ausencia de rechazo, con código 1 conservado; es evidencia previa al mecanismo, no un fallo ocultado o una expectativa debilitada. Después se implementaron y ensayaron disparadores por sentencia. La primera versión pasó 44 casos; se añadieron tres regresiones para sentencia preparada y administradores Auth/Storage en sus esquemas sintéticos y se repitió la suite con 47 casos. No sumar las fases como comportamientos únicos.

## Comandos reproducibles

1. Ejecutar node scripts/audit/maintenance/lab.cjs. Verifica primero el Supabase local ya identificado y crea una base nueva; no recibe URL Cloud ni modifica la base de negocio local existente.
2. Establecer RIOVOLEY_GATE_PHASE=baseline y ejecutar node --test --test-reporter=tap tests/integration/maintenance-gate.local.test.cjs. Repetir con fase red, cuyo código esperado es 1.
3. Establecer RIOVOLEY_GATE_PHASE=green y ejecutar el mismo archivo. Instala y retira la barrera en la base marcada, sin dejarla activa al terminar satisfactoriamente. Se reutilizan exclusivamente credenciales locales existentes, sin pedir o generar claves.
4. Ejecutar node scripts/audit/maintenance/report.cjs y node scripts/audit/maintenance/finalize.cjs antes del sellado. Los recibos MCP/documentación y revisión se conservan en el expediente. Después de sellar, crear un contexto nuevo; no escribir sobre esta carpeta.

Los [metadatos de comandos](COMANDOS.json) conservan códigos y duraciones. Las cuatro fases midieron, respectivamente, ${phases.map(p => p.durationSeconds).join(', ')} segundos de proceso. No equivalen a tiempos de mantenimiento o recuperación institucional.

## Resultados

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
${phaseRows}
| MNT-05 | Integridad de los cuatro SQL preparados | 4 comparaciones SHA-256 | 4 | 0 | 0 | APROBADO: archivos intactos | [Hashes](seguridad/propuestas-sql-sin-cambios.json) |
| MNT-06 | Jest y componentes del producto | 0 nuevos | 0 | 0 | 0 | NO EJECUTADO en este ensayo | [Antecedente](${functional}INFORME_VERIFICACION_TECNICA.md) |
| MNT-07 | Playwright y ejecución Android | 0 nuevos | 0 | 0 | 0 | NO EJECUTADO | [Antecedente](${functional}INFORME_VERIFICACION_TECNICA.md) |
| MNT-08 | Compilación web y Android | 0 nuevas | 0 | 0 | 0 | NO EJECUTADO en el ensayo | [Antecedente](${functional}INFORME_VERIFICACION_TECNICA.md) |
| MNT-09 | Aislamiento gestionado integral | 0 ensayos completos | 0 | 0 | 0 | NO EJECUTADO: capa parcial | [Límites](PROPUESTA_AISLAMIENTO_SQL.md) |

## Qué comprueban los 47 casos finales

Los cinco actores de base de datos reciben el rechazo específico para INSERT/UPDATE/DELETE/TRUNCATE y conservan SELECT. Se prueban además escritura en tres esquemas adicionales, dos administradores en sus esquemas de fixture, tres llamadas SECURITY DEFINER, vista, dos accesos a particiones, UPSERT, UPDATE sin filas, marcador de ventana y control de excepción administrativa. Una transacción REPEATABLE READ y una sentencia preparada, ambas anteriores al cierre, no eluden la barrera en este ensayo. Los fallos de bloqueo durante instalación y retirada devuelven SQLSTATE 55P03 y no dejan cambios parciales. El retorno permite INSERT nuevamente a los cinco actores y conserva el contenido sintético. [Archivo de pruebas](${path.relative(h.evidence, path.join(h.root, 'tests/integration/maintenance-gate.local.test.cjs')).replaceAll('\\', '/')}), [TAP final](integracion/green-final.stdout.log).

## Unitarias, contratos, E2E y compilaciones

Este nuevo denominador corresponde a integración PostgreSQL de una fixture. No valida XP, pagos, asistencias o permisos institucionales por fila, ni constituye pruebas reales de servicios Auth/Storage. No se cambió lógica del producto y no se repitieron aquí Jest, Playwright, compilación web o Android. El [expediente funcional anterior](${functional}INFORME_VERIFICACION_TECNICA.md) conserva sus 434 Jest/91 suites, Chromium 1/1 y Android local 14/14, con artefactos y fecha propios. El CI posterior a subir este expediente debe identificarse por su SHA y conservarse separado del sello; no se presume su resultado.

## Seguridad, revisión y estado final

La [revisión independiente estática](seguridad/revision-independiente.json) no encontró hallazgos bloqueantes en fixture, barrera y pruebas; el revisor no repitió la suite ni revisó estos informes. La comprobación posterior muestra barrera retirada, siete snapshots iguales y base conservada. [Estado final](integracion/estado-final-laboratorio.json), [snapshots previos](integracion/fixture-antes.json). Las [fuentes](FUENTES_EVALUADAS.json), [privacidad](PRIVACIDAD.json) e [integridad](INTEGRIDAD.json) se verifican antes del [sellado SHA-256](MANIFIESTO_SHA256.json).

## Incidencias y pendientes

Se conserva la fase RED 0/1 con fallo esperado y el primer GREEN 44/44; el resultado final es 47/47 y no omite casos. No hubo nueva compilación, restore, consulta de alertas Cloud o despliegue. Continúan pendientes un respaldo vigente al corte, cubrir efectos externos y todos los objetos relevantes, integrar y reensayar un paquete institucional compatible, confirmar calendario y autorizarlo expresamente. La limitación de respaldos administrados está documentada en la [fase anterior](${prior}INFORME_VERIFICACION_TECNICA.md), sin atribuirle una nueva consulta en esta fase.
`);
const names = ['Caso de uso de gamificación', 'Servicio público de gamificación', 'Identidad del atleta', 'Wallet y monedas', 'Tienda cosmética', 'Asistencia', 'Pagos', 'Compilación del proyecto'];
h.write('MATRIZ_VERIFICACIONES_TESIS.md', `# Matriz de trazabilidad

Base ${c.baseCommit}. La nueva suite comprueba mantenimiento SQL con fixtures y no se atribuye a las ocho categorías funcionales. Los archivos y resultados anteriores se mantienen en su [matriz de origen](${functional}MATRIZ_VERIFICACIONES_TESIS.md).

| Categoría Tabla 4-6 | Archivos relacionados | Casos funcionales nuevos | Resultado real de esta fase | Tipo / mocks o servicios | Limitación / evidencia |
|---|---|---|---|---|---|
${names.map(name => `| ${name} | [Archivos específicos de la categoría en matriz previa](${functional}MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO para la categoría | No se invocó la funcionalidad | Barrera sintética no valida este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |`).join('\n')}

## Verificación complementaria ejecutada

| Verificación | Archivo / fase | Casos | Resultado | Tipo y dependencias | Limitación / evidencia |
|---|---|---|---|---|---|
| Escrituras abiertas | maintenance-gate.local.test.cjs / baseline | 5 | 5 aprobados | Integración PostgreSQL real; sin mocks | Permisos intencionalmente amplios de fixture; [TAP](integracion/baseline.stdout.log) |
| Rechazo sin barrera | Mismo archivo / red | 1 | 1 fallido esperado | PostgreSQL real | Demuestra ausencia inicial del mecanismo; [TAP](integracion/red.stdout.log) |
| Primera barrera | Mismo archivo / green | 44 | 44 aprobados | PostgreSQL real | Versión previa a tres regresiones; [TAP](integracion/green.stdout.log) |
| Barrera final / retorno | ${fileLink('tests/integration/maintenance-gate.local.test.cjs')} / green-final | 47 | 47 aprobados, 0 fallidos/omitidos | Conexiones reales y SET ROLE; sin Auth HTTP ni repositorios simulados | Solo relaciones y RPC sintéticas; [TAP](integracion/green-final.stdout.log) |
| Playwright | No ejecutado aquí | 0 | NO EJECUTADO | No navegador nuevo | [Antecedente](${functional}INFORME_VERIFICACION_TECNICA.md) |
| Android / build | No ejecutado aquí | 0 | NO EJECUTADO | No dispositivo o compilación nueva | [Antecedente](${functional}INFORME_VERIFICACION_TECNICA.md) |
| Seguridad Cloud / aislamiento integral | No ejecutado | 0 | PENDIENTE | Sin mutaciones o ensayos gestionados | [Alcance excluido](PROPUESTA_AISLAMIENTO_SQL.md) |

No sumar denominadores de fases repetidas, herramientas o verificaciones documentales.
`);
h.write('RESULTADOS_PARA_TESIS_4_5.md', `# Propuesta para revisión académica del apartado 4.5

Como verificación complementaria, se ensayó una barrera de escritura SQL en una base PostgreSQL 17.11 separada, formada por siete relaciones sintéticas y sin registros institucionales. El control previo permitió la inserción desde cinco actores de base de datos; posteriormente, la suite final aprobó 47 de 47 casos, sin fallos ni omisiones, utilizando conexiones reales y sin repositorios simulados ([control previo](integracion/baseline.stdout.log), [resultados finales](integracion/green-final.stdout.log)). Los casos comprobaron rechazo específico de operaciones de escritura, llamadas a una RPC sintética SECURITY DEFINER, acceso mediante vista y particiones, sesiones anteriores al cierre y rollback de cambios parciales ante conflictos de bloqueo. La retirada del prototipo restituyó las escrituras de los cinco actores y conservó los snapshots de las fixtures ([estado posterior](integracion/estado-final-laboratorio.json)).

Se conservó también una ejecución previa de rechazo que falló en ausencia de la barrera, así como una primera ejecución satisfactoria de 44 casos; estos antecedentes no se sumaron al denominador final ([fase RED](integracion/red.stdout.log), [primer ensayo](integracion/green.stdout.log)). El resultado corresponde a integración SQL local y no acredita recuperación o autenticación mediante APIs gestionadas, modificación de objetos Storage, entrega de notificaciones ni aislamiento completo de producción. En esta fase no se repitieron pruebas Jest, Playwright o compilaciones web/Android, cuyos resultados anteriores mantienen su identificación en el [expediente funcional](${functional}INFORME_VERIFICACION_TECNICA.md). La aplicación institucional de un mecanismo de mantenimiento continúa pendiente de cobertura completa, revisión del paquete y condiciones operativas documentadas ([alcance y límites](PROPUESTA_AISLAMIENTO_SQL.md)). Estas pruebas no aportan resultados de usabilidad, motivación o capacidad de interacción.
`);
console.log(JSON.stringify({ documents: 3, proposal: 1, finalPostgresCases: 47, productionChanged: false }));
