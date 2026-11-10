'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const context = require('./service-context.cjs'), c = context.read(), h = require('../../e2e/local/harness.cjs');
assert.equal(c.evidence, h.evidence);
const read = f => JSON.parse(fs.readFileSync(path.join(h.evidence, f), 'utf8'));
const attempt = context.latestAttempt(), result = read(attempt.resultFile), cleanup = read(attempt.cleanupFile), observations = read(attempt.observationsFile), http = read(attempt.httpFile);
assert.equal(result.executed, 24); assert.equal(result.passed, 24); assert.equal(result.failed, 0); assert.equal(result.cleanupPassed, true);
const labels = ['servicios-http', 'servicios-regresion-red', 'servicios-regresion-red-conexion-real', 'servicios-http-final'];
const runs = labels.map(label => ({ label, ...JSON.parse(fs.readFileSync(path.join(h.evidence, 'integracion', label + '.stdout.log'), 'utf8').trim()), ...read('integracion/' + label + '.meta.json') }));
assert.deepEqual(runs.map(r => [r.executed, r.passed, r.failed, r.exitCode]), [[21, 21, 0, 0], [22, 21, 1, 1], [22, 21, 1, 1], [24, 24, 0, 0]]);
assert.equal(attempt.file, runs[3].manifest);
const categories = {};
for (const r of http.requests) { const name = r.path.startsWith('/auth/') ? 'Auth' : 'Storage'; categories[name] ||= { requests: 0, statuses: {} }; categories[name].requests++; categories[name].statuses[r.status] = (categories[name].statuses[r.status] || 0) + 1; }
assert.equal(categories.Auth.requests, 12); assert.equal(categories.Storage.requests, 22);
const summary = { reportedAt: new Date().toISOString(), baseCommit: c.baseCommit,
  runs: runs.map(r => ({ label: r.label, executed: r.executed, passed: r.passed, failed: r.failed, exitCode: r.exitCode, durationSeconds: r.durationSeconds, start: r.start, end: r.end })),
  selectedAttempt: attempt.file, finalControls: { executed: 24, passed: 24, failed: 0 }, http: categories,
  ownedAccountsPerAttempt: 2, ownedBucketsPerAttempt: 2, beforeAndAfterOwnedAuthDigestsMatch: observations[0].auth.digest === observations[1].auth.digest,
  beforeAndAfterOwnedPhysicalDigestsMatch: observations[0].disk.digest === observations[1].disk.digest,
  baselinePhysicalFiles: observations[0].disk.files, cleanup, storageBackend: 'file', managedS3Tested: false,
  mocksUsed: false, cloudServicesTested: false, externalProvidersInvoked: false, newProviderKeysGenerated: false, existingPasswordsChanged: false,
  newJestCases: 0, newPlaywrightCases: 0, newAndroidCases: 0, newBuilds: 0, productionChanged: false, releaseReady: false };
function document(name, data) { fs.writeFileSync(path.join(h.evidence, name), (typeof data === 'string' ? data : JSON.stringify(data, null, 2)) + '\n'); }
document('RESULTADOS_AUTOMATIZADOS.json', summary);
const previous = '../20261109-142059-paquete-barrera-57a1e7b/', functional = '../20261105-152944-notifications-cancel-e903a31/';
document('ALCANCE_SERVICIOS_LOCALES.md', `# Auth y Storage: alcance comprobado

Se ejercitaron servicios Supabase reales del entorno local riovoley-e2e-local, mediante la API 127.0.0.1:55321 y PostgreSQL55322. Se recrearon dos cuentas descartables y dos buckets privados por intento, dentro de este contexto. La cuenta y bucket B actuaron como controles. Se reutilizó exclusivamente la contraseña de una fixture local existente, sin publicar su valor, cambiar contraseñas existentes o generar claves de proveedor.

El [intento final](${attempt.file}) enlaza sus resultados, respuestas HTTP, observaciones y limpieza exactos. Los 24 controles incluyen login/refresh/borrado de Auth, lectura con JWT previo, upload/upsert/remove/move de Storage, descargas, control de reasignación SQL y limpieza. No son 24 casos de interfaz ni una suite Playwright. [Controles](${attempt.resultFile}).

Se observaron 12 respuestas Auth (9 HTTP200 y 3 HTTP500 esperados de rechazo) y 22 Storage (18 HTTP200 y 4 HTTP500 esperados). Los errores se conservaron como respuestas reales; no se sustituyeron por respuestas simuladas. Un fallo HTTP por sí solo no demuestra ausencia de efectos: por eso se compararon los digests de cuatro tablas Auth de la cuenta seleccionada, nombres de objetos listados, bytes descargados y archivos físicos propios. [HTTP](${attempt.httpFile}), [observaciones](${attempt.observationsFile}).

El backend local observado es filesystem, raíz /mnt. El inventario inicial encontró un archivo físico real cuyo SHA-256 corresponde al centinela subido; no se aprobó una comparación entre inventarios vacíos. Durante las operaciones rechazadas permanecieron el archivo, su digest y los bytes descargados. Después de retirar los disparadores, login, subida y movimiento entre buckets funcionaron. [Limpieza](${attempt.cleanupFile}): cuentas Auth y core.users propias eliminadas, buckets eliminados, cero archivos físicos propios restantes, catálogo de vuelta al fingerprint inicial y disparadores retirados.

## Fallos y correcciones del prototipo

La revisión detectó que la limpieza se registraba sin hacerla obligatoria para el éxito del proceso, y que un UPDATE solo consideraba la propiedad nueva. Se corrigieron ambas condiciones. La primera regresión no fue válida para demostrar la elusión: falló con 42501 al intentar SET ROLE. Se conservó el resultado 21/22 y se cambió el ensayo a una conexión real supabase_storage_admin. Esa segunda regresión también quedó 21/22: faltó el rechazo esperado al mover la fila fuera del bucket seleccionado, y la transacción se revirtió. Tras comprobar OLD y NEW, el ensayo ampliado final pasó 24/24. [Revisión](seguridad/revision-independiente.json).

## Límites que permanecen

- Se probaron servicios Docker locales y datos descartables; no Cloud ni S3 gestionado.
- La barrera es condicional a las fixtures seleccionadas. No se activó mantenimiento global ni se integró con los cuatro SQL institucionales.
- El JWT previo siguió permitiendo lectura. Una barrera de escritura no acredita revocación de tokens o retirada de clientes.
- Los rechazos se observaron como HTTP500, sin un contrato de mantenimiento HTTP503 o de interfaz ensayado. Antes de uso institucional deben revisarse respuestas y reintentos.
- No se invocaron Resend, Firebase, push, scheduler o proveedores externos. El SMTP Auth observado apunta al contenedor local de pruebas; no se ensayó entrega de correo.
- El digest Auth cubre users/sessions/refresh_tokens/identities del sujeto; no todas las tablas de Auth. Storage compara nombres y bytes indicados, sin afirmar validación exhaustiva de todos sus metadatos o rutas.
- Continúan pendientes respaldo vigente, cobertura gestionada completa, paquete institucional revisado y ventana/autorización. La ventana propuesta del 7 de noviembre caducó.

La documentación oficial indica que los objetos se deben eliminar mediante [Storage API](https://supabase.com/docs/guides/storage/management/delete-objects); por ello la limpieza de archivos utilizó esa API y no DELETE SQL sobre storage.objects. El DELETE SQL de core.users se limitó a los UUID recién creados por este ensayo. Los [límites anteriores](${previous}PAQUETE_LOCAL_REVISABLE.md) no quedan automáticamente cerrados por esta prueba local.
`);
document('INFORME_VERIFICACION_TECNICA.md', `# Verificación técnica: Auth y Storage locales

## Identificación, fecha y entorno

RIOVOLEY, commit base ${c.baseCommit}, contexto ${c.createdAt} UTC, Ecuador UTC−5. Windows ${c.osRelease}, Node ${c.node}, PostgreSQL ${c.serverVersion}; proyecto local riovoley-e2e-local, API55321/SQL55322. Storage filesystem, imagen ${c.storageImage}; [contexto](CONTEXTO.json) y [Auth local](seguridad/configuracion-auth-local.json). No se utilizaron filas institucionales.

## Método y comandos

node scripts/audit/maintenance/service-context.cjs verifica el destino y abre expediente nuevo. node scripts/audit/maintenance/service-probe.cjs crea fixtures descartables, prueba antes/durante/después y libera sus objetos en finally. service-report.cjs genera documentos; service-finalize.cjs verifica y sella. Las ejecuciones reales usan el harness y conservan [comandos/códigos](COMANDOS.json). Después del sello se requiere contexto nuevo. El [manifiesto final](${attempt.file}) identifica los archivos exactos; las versiones anteriores no se sobrescribieron.

Los servicios HTTP y PostgreSQL son reales, sin mocks. La restricción de fetch permite únicamente el origen local; no publica cabeceras, cuerpos de Auth o valores de credenciales. Se reutilizan claves locales existentes en memoria; no se solicitaron claves, cambiaron contraseñas existentes o generaron claves de servidor/proveedor. Cada intento crea y limpia dos identidades y dos buckets de prueba, sin registrar pagos, asistencias o evaluaciones.

## Resultados

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
${runs.map((r, i) => `| SRV-0${i + 1} | ${['Primer alcance', 'Regresión: configuración de rol inválida', 'Regresión: reasignación sin rechazo', 'Ensayo ampliado corregido'][i]} | ${r.executed} controles | ${r.passed} | ${r.failed} | 0 | ${r.failed ? 'FALLIDO: conservado y corregido' : 'APROBADO para su alcance'} | [Salida](integracion/${r.label}.stdout.log), [recibo](integracion/${r.label}.meta.json) |`).join('\n')}
| SRV-05 | Limpieza final obligatoria | 1 verificación compuesta | 1 | 0 | 0 | APROBADO | [Postcondiciones](${attempt.cleanupFile}) |
| SRV-06 | Jest/componentes del producto | 0 nuevos | 0 | 0 | 0 | NO EJECUTADO aquí | [Antecedente](${functional}INFORME_VERIFICACION_TECNICA.md) |
| SRV-07 | Playwright y Android | 0 nuevos | 0 | 0 | 0 | NO EJECUTADO aquí | [Antecedente](${functional}INFORME_VERIFICACION_TECNICA.md) |
| SRV-08 | Compilación web/nativa | 0 nuevas | 0 | 0 | 0 | NO EJECUTADO aquí | [Antecedente](${functional}INFORME_VERIFICACION_TECNICA.md) |
| SRV-09 | Cloud, S3 y proveedores externos | 0 ensayos | 0 | 0 | 0 | NO EJECUTADO | [Límites](ALCANCE_SERVICIOS_LOCALES.md) |

Duraciones de proceso: ${runs.map(r => r.durationSeconds).join(', ')} segundos. No sumar los controles repetidos como comportamientos únicos. La limpieza es una postcondición adicional del proceso y no otro caso funcional de los 24. En la repetición final se observaron 12 respuestas Auth y 22 Storage; esos denominadores de tráfico no se confunden con los controles.

## Integración y evidencia

Durante la barrera, login, refresh y borrado de la cuenta seleccionada fueron rechazados; la cuenta control siguió autenticándose. Un JWT anterior siguió permitiendo lectura. Storage rechazó subida, upsert, borrado y movimiento del objeto seleccionado; el bucket control permitió subida. Un UPDATE SQL que cambia el bucket debe comprobar el alcance anterior y nuevo; su regresión y el movimiento HTTP se verificaron tras la corrección. [24 controles](${attempt.resultFile}), [HTTP](${attempt.httpFile}).

Las observaciones registraron un archivo físico inicial con SHA del centinela y el mismo archivo/digest tras las operaciones bloqueadas; los bytes descargados permanecieron iguales. También coincidió el digest de las filas Auth seleccionadas. Tras la retirada, se verificaron login, subida, movimiento y descarga del contenido. La limpieza confirmó cero fixtures Auth/core.users/buckets propias y cero archivos propios residuales, con catálogo restaurado. [Observaciones](${attempt.observationsFile}), [limpieza](${attempt.cleanupFile}).

## Incidencias, seguridad y limitaciones

Se preservaron dos regresiones fallidas, distinguiendo el error de configuración 42501 del rechazo ausente que reprodujo la elusión. Se corrigieron el predicado OLD/NEW y las postcondiciones obligatorias de limpieza, sin modificar lógica del producto ni permisos institucionales. La [revisión independiente](seguridad/revision-independiente.json) no encontró bloqueantes pendientes en el alcance local; no repitió pruebas.

No se ejecutaron aquí Jest, Playwright, builds o Android. El CI posterior se registra por su SHA de forma separada del sello. Este ensayo no revoca JWT, no valida S3 gestionado, no acredita entrega de correo/push ni mantenimiento global y no constituye una prueba de penetración completa. Los HTTP500 esperados del prototipo requieren un contrato operativo antes de cualquier uso institucional. Persisten respaldo vigente, cobertura gestionada y autorización/ventana. [Alcance detallado](ALCANCE_SERVICIOS_LOCALES.md).

[Privacidad](PRIVACIDAD.json), [integridad](INTEGRIDAD.json) y [manifiesto SHA-256](MANIFIESTO_SHA256.json) respaldan el cierre. La [matriz](MATRIZ_VERIFICACIONES_TESIS.md) y el [texto propuesto](RESULTADOS_PARA_TESIS_4_5.md) no modifican la tesis.
`);
const names = ['Caso de uso de gamificación', 'Servicio público de gamificación', 'Identidad del atleta', 'Wallet y monedas', 'Tienda cosmética', 'Asistencia', 'Pagos', 'Compilación del proyecto'];
document('MATRIZ_VERIFICACIONES_TESIS.md', `# Matriz de trazabilidad

El nuevo ensayo comprueba APIs locales de Auth/Storage y una barrera condicional. No repite los módulos funcionales de Tabla 4-6; crear una identidad Auth descartable no valida la identidad deportiva del atleta. Archivos y casos previos permanecen en la [matriz funcional](${functional}MATRIZ_VERIFICACIONES_TESIS.md).

| Categoría | Archivos de prueba relacionados | Casos nuevos de la categoría | Resultado | Tipo/dependencias | Limitación/evidencia |
|---|---|---|---|---|---|
${names.map(name => `| ${name} | [Archivos por categoría en matriz anterior](${functional}MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Sin invocación del caso de negocio | Auth/Storage de fixture no valida este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |`).join('\n')}

| Complemento | Archivo | Casos | Resultado real | Mocks o servicios | Evidencia/límite |
|---|---|---|---|---|---|
| Auth/Storage y barrera | scripts/audit/maintenance/service-probe.cjs | 24 controles finales | 24 aprobados, 0 fallidos | APIs Auth/Storage, PostgreSQL y filesystem reales locales; sin mocks | [Controles](${attempt.resultFile}); no Cloud/S3 |
| Primer alcance | Mismo runner | 21 | 21 aprobados | Local real | [Salida](integracion/servicios-http.stdout.log); alcance previo más reducido |
| Regresión/configuración | Mismo runner | 22 | 21 aprobados, 1 fallido | SET ROLE no autorizado; luego corregido | [Salida](integracion/servicios-regresion-red.stdout.log) |
| Regresión de elusión | Mismo runner | 22 | 21 aprobados, 1 fallido esperado | Conexión PostgreSQL Storage real, transacción revertida | [Salida](integracion/servicios-regresion-red-conexion-real.stdout.log) |
| Seguridad/limpieza | Incluidas en el proceso | Sin sumar otro denominador funcional | Postcondiciones obligatorias aprobadas | Solo filas/buckets propios | [Limpieza](${attempt.cleanupFile}) |
| Playwright/Android/builds | No ejecutados aquí | 0 | NO EJECUTADO | Antecedentes con SHA propio | [Informe previo](${functional}INFORME_VERIFICACION_TECNICA.md) |
`);
document('RESULTADOS_PARA_TESIS_4_5.md', `# Propuesta para revisión académica del apartado 4.5

En una verificación complementaria del 9 de noviembre de 2026 se ejercitaron las APIs reales de Supabase Auth y Storage en el entorno local, mediante cuentas, buckets y bytes descartables, sin repositorios simulados. El ensayo ampliado aprobó 24 de 24 controles, que comprendieron operaciones antes, durante y después de una barrera SQL condicional, así como una regresión de reasignación entre buckets ([controles finales](${attempt.resultFile})). Durante las operaciones bloqueadas coincidieron los digests de las filas Auth seleccionadas y del archivo físico observado, y los bytes descargados conservaron su SHA-256. Tras retirar los disparadores se restablecieron las operaciones y la limpieza verificó la eliminación de las fixtures propias y ausencia de archivos propios residuales ([observaciones](${attempt.observationsFile}), [limpieza](${attempt.cleanupFile})).

Se conservaron un alcance previo de 21 controles aprobados y dos regresiones con resultado 21/22. La primera respondió a un error de configuración del rol; la segunda reprodujo la ausencia de rechazo al considerar únicamente el bucket nuevo, antes de corregir el predicado para comprobar OLD y NEW. Estos intentos no se sumaron al denominador final ([registro de resultados](INFORME_VERIFICACION_TECNICA.md)). El tráfico final produjo 12 respuestas de Auth y 22 de Storage, con rechazos HTTP500 observados y lecturas permitidas con un JWT anterior; por ello no se interpreta la barrera como revocación de sesiones o mantenimiento global. El resultado corresponde al backend filesystem local, sin validación de S3 gestionado, entrega de notificaciones o despliegue institucional. Tampoco aporta resultados de usabilidad, motivación o capacidad de interacción con usuarios.
`);
console.log(JSON.stringify({ documents: 3, scopeDocument: 1, finalControls: 24, authResponses: 12, storageResponses: 22, productionChanged: false }));
