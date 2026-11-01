'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),h=require('../../e2e/local/harness.cjs');
const read=name=>JSON.parse(fs.readFileSync(path.join(h.evidence,name),'utf8')),put=(name,data)=>fs.writeFileSync(path.join(h.evidence,name),typeof data==='string'?data.trimEnd()+'\n':JSON.stringify(data,null,2)+'\n');
assert.ok(!fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')),'NEW_EVIDENCE_REQUIRED');const ctx=read('CONTEXTO.json'),db=read('seguridad/respaldo-institucional.json'),data=read('integracion/datos-restaurados.json'),storage=read('seguridad/storage-respaldo-real.json');
const candidates=fs.readdirSync(path.join(h.evidence,'integracion')).filter(f=>/^restauracion-institucional.*\.json$/.test(f)).map(file=>({file:'integracion/'+file,...read('integracion/'+file)})).filter(x=>x.catalogMatchesSourcePreflight);assert.ok(candidates.length);const restored=candidates.sort((a,b)=>b.completedAt.localeCompare(a.completedAt))[0];assert.equal(restored.archiveSha256,db.sha256);assert.equal(data.archiveSha256,db.sha256);assert.equal(storage.sourceDatabaseArchiveSha256,db.sha256);
const tap=fs.readFileSync(path.join(h.evidence,'unitarias/respaldo-restauracion-final.stdout.log'),'utf8'),n=key=>Number(tap.match(new RegExp('^# '+key+' (\\d+)$','m'))?.[1]);assert.equal(n('tests'),32);assert.equal(n('pass'),32);assert.equal(n('fail'),0);assert.equal(n('skipped'),0);
assert.equal(data.allCopiedColumnsMatch,true);assert.equal(data.allComparedSequencesMatch,true);assert.equal(data.totalArchiveRows,data.totalRestoredRows);assert.equal(data.storedGeneratedColumns.mismatchesAgainstCurrentExpression,0);assert.equal(storage.completedObjects,43);assert.equal(storage.allRecoveredObjectHashesMatch,true);assert.equal(storage.sourceEtagComparableObjects,43);
put('integracion/restauracion-institucional-final.json',{...restored,originalEvidence:restored.file});
put('RESULTADOS_AUTOMATIZADOS.json',{baseCommit:ctx.commit,startedAt:ctx.createdAt,reportedAt:new Date().toISOString(),node:{tests:32,pass:32,fail:0,skipped:0,files:4,suites:n('suites')},sqlRestore:{finalFlowPassed:true,archiveBytes:db.bytes,catalogMatches:true,fingerprint:restored.restoredFingerprint},copiedTableChecks:{executed:data.comparedTables,passed:data.tables.filter(t=>t.contentMatches&&t.archiveRows===t.restoredRows).length,rows:data.totalRestoredRows},sequenceChecks:{executed:data.sequenceStates.length,passed:data.sequenceStates.filter(x=>x.stateMatches).length},generatedExpressionChecks:{executed:1,passed:1,originalStoredValuesInArchive:false},storage:{objects:storage.completedObjects,bytes:storage.downloadedBytes,etagMatches:storage.sourceEtagComparableObjects,encryptedManifestVerified:storage.encryptedManifestVerified,isolatedByteRecoveryVerified:true,supabaseStorageApiRestoreVerified:false},productionDatabaseChanged:false,productionStorageChanged:false,deploymentsPerformed:false,webAndroidPlaywrightExecuted:false});
const previous='../20261101-023445-backup-cifrado-2b4e9eb/INFORME_VERIFICACION_TECNICA.md';
put('INFORME_VERIFICACION_TECNICA.md',`# Verificación técnica: copia institucional y restauración aislada

## 1. Identificación, tiempo y estado

RIOVOLEY; repositorio Joscoo/riovoley; commit base **${ctx.commit}**, con nuevas herramientas, pruebas y documentación durante la ejecución. Inicio del expediente **${ctx.createdAt}** UTC. Hubo una pausa nocturna; las duraciones activas se conservan por comando y no se presentan las horas de pausa como tiempo de restauración. FUENTES_EVALUADAS.json registra los hashes de las fuentes evaluadas antes del commit de entrega. El [expediente anterior](${previous}) dejó el asistente listo, con la copia institucional todavía pendiente en ese momento.

El usuario ejecutó después el asistente con entrada local oculta: la copia cifrada terminó el **${db.finishedAt}**, con **${db.bytes} bytes**, SHA-256 **${db.sha256}** y 1400 entradas de TOC. Se verificaron nuevamente archivo y clave por hash. El recibo registra descifrado y pg_restore --list con código cero, y recuperación desde la clave exportada. La contraseña PostgreSQL, la frase y la clave del servidor Storage no se recibieron por chat ni se publicaron. [Recibo de metadatos](seguridad/respaldo-institucional.json).

## 2. Entornos, alcance y método

Windows y Node v24.18.0/npm11.16.0; PowerShell5.1; clientes PostgreSQL17.11; GnuPG2.4.9; SDK Supabase2.105.4. [Versiones verificadas anteriormente](${previous}). Docker local usó la imagen PostgreSQL Supabase17.11 fijada por digest en [el aislamiento](seguridad/aislamiento-destino.json). La base institucional corresponde al proyecto mayvvlkvheagkojunzzb. Solo se realizaron lecturas de catálogo/agregados y GET de archivos; no se ejecutó login E2E, SQL de modificación o despliegue institucional.

El destino final **${restored.container}** tiene network=none, cero puertos publicados, ningún bind mount del host, log-driver=none y PGDATA en tmpfs. PostgreSQL escucha solo por socket Unix; cron.launch_active_jobs=off y max_worker_processes=0. No se iniciaron servicios Auth, Edge, Storage API, correo o push. Una parada del contenedor/motor pierde el contenido temporal; los respaldos cifrados son los artefactos persistentes, no el volumen de ensayo.

La carga adapta únicamente calculate_age en el destino vacío: definición temporal IMMUTABLE para crear la columna GENERATED, omisión de su entrada de definición en TOC y recuperación posterior de la definición original. Se conservaron todos los intentos fallidos. El bootstrap local copia atributos necesarios de roles leídos sin contraseñas, fuerza NOLOGIN en roles de servicio y mantiene postgres superusuario para operar; no restaura contraseñas ni membresías globales. La propiedad de event triggers requiere supabase_admin superusuario en el destino. [Roles y límites](seguridad/bootstrap-roles.json). Esto no demuestra la autorización efectiva del servicio gestionado.

## 3. Comandos y reproducibilidad

- node --test --test-reporter=tap tests/unit/institutional-restore.test.cjs tests/unit/restore-guards.test.cjs tests/unit/restore-data.test.cjs tests/unit/storage-backup.test.cjs
- node scripts/production/restore-isolated.cjs
- node scripts/audit/production/compare-restored-data.cjs
- powershell -NoProfile -ExecutionPolicy Bypass -File scripts/production/unlock-restore.ps1
- powershell -NoProfile -ExecutionPolicy Bypass -File scripts/production/storage-backup.ps1

Los helpers exigen el contexto privado, archivo identificado y un expediente sin sellar; no son un instalador universal. Las herramientas de fixtures nunca deben apuntarse al backend institucional. [Guía operativa](../../../../produccion/RESPALDO_Y_RESTAURACION.md), [comandos registrados](COMANDOS.json). Las invocaciones realizadas por el usuario se sustentan en sus recibos y artefactos verificados; no existe captura independiente de todos sus códigos nativos por objeto. Los comandos automatizados de esta sesión conservan código, tiempos y stdout/stderr sanitizados; los errores potencialmente sensibles se guardaron cifrados en runtime privado.

## 4. Resultados y denominadores

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| R01 | Contratos Node de herramientas, 4 archivos | 32 | 32 | 0 | 0 | APROBADO | [TAP](unitarias/respaldo-restauracion-final.stdout.log), [salida](unitarias/respaldo-restauracion-final.meta.json) |
| R02 | Flujo final de carga SQL y catálogo | 1 flujo | 1 | 0 | 0 | APROBADO con adaptación documentada | [Resultado](integracion/restauracion-institucional-final.json), [comando](integracion/restore-institucional-intento-07.meta.json) |
| R03 | Contenido de entradas TABLE DATA / COPY | ${data.comparedTables} tablas | ${data.comparedTables} | 0 | 0 | APROBADO; ${data.totalRestoredRows} filas | [Comparación](integracion/datos-restaurados.json) |
| R04 | Estados de secuencias | ${data.sequenceStates.length} | ${data.sequenceStates.length} | 0 | 0 | APROBADO | Misma comparación; denominador distinto |
| R05 | Coherencia actual de columna GENERATED edad | 1 columna | 1 | 0 | 0 | APROBADO; no valida el valor almacenado histórico | Misma comparación |
| R06 | Archivos Storage descargados, cifrados y recuperados | ${storage.completedObjects} objetos | ${storage.completedObjects} | 0 | 0 | APROBADO para bytes; no Storage API | [Recibo](seguridad/storage-respaldo-real.json) |
| R07 | Cifrado sintético de archivos | 1 flujo / 3 fixtures | 1 flujo | 0 | 0 | APROBADO; corrupción rechazada | [Integración](integracion/storage-cripto-sintetico.json) |
| R08 | Jest/componentes del producto | 0 en esta fase | 0 | 0 | 0 | NO EJECUTADO | Sin cambios en lógica del producto; antecedentes separados |
| R09 | Playwright | 0 en esta fase | 0 | 0 | 0 | NO EJECUTADO | Sin login contra cuentas institucionales |
| R10 | Compilación web / Android | — | — | — | — | NO EJECUTADO en esta fase | No se modificaron fuentes frontend/nativas |
| R11 | Recuperación integral de Supabase gestionado | 0 | 0 | 0 | 0 | NO EJECUTADO | Auth/Storage API, secretos, raíz Vault y proveedores no acreditados |

No sumar filas superpuestas: R03–R05 son controles complementarios sobre la carga R02. R01 son pruebas Node, con suites=0 según el runner; cuatro archivos no se presentan como cuatro suites. No se generó cobertura CRA en esta fase. Los controles del SDK utilizan transporte simulado en R01; R06 sí utilizó el servicio institucional real mediante GET. R07 usa GnuPG real con datos sintéticos.

## 5. Alcance de la recuperación comprobada

La carga final y el catálogo terminaron con código cero; la huella coincidió exactamente: **${restored.restoredFingerprint}**. El snapshot de catálogo de referencia contiene 1101 elementos canónicos. La comparación de contenido cubrió las **94 entradas TABLE DATA** presentes en la copia y sus **27159 filas**, con hash interno independiente del orden físico; no se publicaron filas o hashes de contenido por tabla. No se equiparan estas entradas con todas las tablas que crean las extensiones. Los 11 estados de secuencia coincidieron. No había entradas BLOB en el TOC comprobado.

Las columnas incluidas en COPY coinciden; core.students.edad queda fuera porque PostgreSQL recalcula las columnas almacenadas GENERATED. No se detectaron discrepancias con su expresión actual, pero el valor almacenado histórico no está en el archivo lógico y no se declara idéntico. Tampoco se compararon filas contra producción viva, que puede haber cambiado desde el respaldo.

Storage finalizó entre **${storage.startedAt}** y **${storage.finishedAt}**: **43 objetos y 3596269 bytes**. Los 43 ETag eran comparables como MD5 y coincidieron con los bytes descargados respecto del inventario SQL. Cada archivo y el manifiesto de rutas se cifraron; se comprobó descifrado y SHA-256 de los archivos recuperados en un directorio tmpfs del contenedor aislado. No se escribieron archivos en claro en el repositorio ni se publicaron nombres de buckets/objetos. La lectura ocurrió después del snapshot SQL: no es un snapshot atómico común y no detecta incorporaciones posteriores automáticamente. Recuperar bytes no acredita Storage API, URLs firmadas, configuración de buckets o integración cliente.

## 6. Incidencias, seguridad y revisión

Se conservaron siete intentos de restauración. Los primeros fallaron por la ruta de tail, la interpretación del argumento --host del cliente por la guarda Docker, precarga pg_net ausente y atributos insuficientes del propietario de event triggers. El sexto cargó SQL pero falló la verificación de catálogo: se aisló únicamente calculate_age, con dos CR introducidos al extraer SQL mediante el cliente Windows. La normalización a los LF originales recuperó su definición exacta; el séptimo intento aprobó. Los intentos anteriores no se reclasificaron como aprobados. La caché de recuperación expiró durante la pausa; hubo un desbloqueo fallido y uno posterior satisfactorio, sin recibir la frase por chat. [Diferencia aislada](seguridad/catalogo-diferencias.json), [recuperación de clave](seguridad/recuperacion-clave-renovada.json).

La revisión independiente identificó tres controles importantes: no publicar texto nativo arbitrario, rechazar huellas distintas y exigir el vínculo exacto del archivo SQL con el inventario de Storage. Se añadieron regresiones RED→GREEN; el cierre es 32/32, sin modificar lógica de negocio para conseguir aprobaciones. Los diagnósticos finales solo publican categorías permitidas, nunca mensajes arbitrarios de SQL. La prueba sintética del SDK detectó inicialmente un endpoint de descarga diferente del supuesto; se ajustó la guarda al endpoint GET usado por la versión instalada, conservando host fijo y prohibición de escrituras.

No se repitieron npm audit, advisors o pruebas RLS institucionales en esta fase. El catálogo restaurado conserva políticas/grants definidos en la copia; la igualdad no demuestra por sí sola su suficiencia. No se aplicaron las propuestas SQL/Edge ni se desplegó web/Android. Este alcance no es una prueba de penetración ni evaluación de usabilidad o motivación.

## 7. Pendientes y referencias

Custodiar fuera del único equipo una copia cifrada aprobada, clave exportada y frase por separado; su custodia externa no se ha comprobado. Completar recuperación gestionada de Auth/Storage, claves PII/Vault y secretos/configuración de proveedores; comprobar web, Android/Capgo y clientes previos, transición compatible, CI hospedado, responsables y ventana. PITR/RPO/RTO no se declaran acreditados. El release necesita aprobación específica del paquete y la ventana una vez cerrados esos requisitos.

[Matriz](MATRIZ_VERIFICACIONES_TESIS.md), [propuesta académica](RESULTADOS_PARA_TESIS_4_5.md), [resultados calculados](RESULTADOS_AUTOMATIZADOS.json), [privacidad](PRIVACIDAD.json), [integridad](INTEGRIDAD.json), [manifiesto](MANIFIESTO_SHA256.json). No se modificó el documento de tesis.
`);
const rows=[['Caso de uso de gamificación','Datos gamification.*; sin ejecución de use cases'],['Servicio público de gamificación','Funciones y ACL del catálogo; no se invocó el servicio público'],['Identidad del atleta','Filas core.users/core.students; no flujos de avatar/títulos'],['Wallet y monedas','Tablas de gamificación incluidas en COPY; sin recompensas nuevas'],['Tienda cosmética','Datos y catálogo de gamificación; sin compras/equipamiento'],['Asistencia','Datos training.*; sin registrar asistencias'],['Pagos','Datos billing.*; sin registrar/modificar pagos'],['Compilación del proyecto','Sin compilación web o nativa nueva']];
put('MATRIZ_VERIFICACIONES_TESIS.md',`# Matriz complementaria: recuperación institucional

Base ${ctx.commit}; inicio ${ctx.createdAt}. Las ocho categorías conservan cero casos funcionales nuevos en esta fase. Los controles de recuperación apoyan la continuidad de sus datos; no sustituyen las pruebas de comportamiento del producto. No sumar las tablas de esta matriz como nuevos casos unitarios de la Tabla 4-6.

| Categoría Tabla 4-6 | Archivos relacionados | Casos funcionales ejecutados | Resultado real / tipo | Mocks o servicios | Limitaciones | Evidencia |
| --- | --- | ---: | --- | --- | --- | --- |
${rows.map(([name,scope])=>`| ${name} | compare-restored-data.cjs / restore-isolated.cjs | 0 | ${scope}; recuperación SQL comprobada salvo compilación, no ejecutada | PostgreSQL local real | No verifica comportamientos de aplicación | [94 tablas](integracion/datos-restaurados.json), [catálogo](integracion/restauracion-institucional-final.json) |`).join('\n')}

## Verificaciones complementarias

| Verificación | Archivo | Denominador | Resultado | Tipo / dependencias | Limitación | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Herramientas de recuperación | institutional-restore, restore-guards, restore-data, storage-backup.test.cjs | 32 casos Node | 32 aprobados | Contratos/parsers; SDK real con transporte simulado en casos SDK | No son casos funcionales de la aplicación | [TAP](unitarias/respaldo-restauracion-final.stdout.log) |
| Carga SQL | scripts/production/restore-isolated.cjs | 1 flujo final | APROBADO | PG17.11 real, copia institucional, sin servicios simulados | Roles bootstrap / GENERATED / gestión Supabase distintos | [Final](integracion/restauracion-institucional-final.json) |
| Contenido recuperado | compare-restored-data.cjs | 94 tablas; 27159 filas; 11 secuencias; 1 columna derivada | Coincidencias documentadas por denominador | Archivo real y SQL local real; no repositorios simulados | Valores históricos GENERATED no incluidos en copia | [Comparación](integracion/datos-restaurados.json) |
| Storage | scripts/production/storage-backup.cjs | 43 archivos / 3596269 bytes | Cifrado y recuperación de bytes aprobados | GET institucional real, GnuPG y tmpfs reales | No Storage API recuperada; snapshot de tiempos distintos | [Recibo](seguridad/storage-respaldo-real.json) |
| Cifrado de fixtures | test-storage-crypto.cjs | 1 flujo / 3 archivos sintéticos | APROBADO, corrupción rechazada | GnuPG real; sin Storage institucional | No sumar a los 43 archivos reales | [JSON](integracion/storage-cripto-sintetico.json) |
| Playwright y Android | Ninguno en esta fase | 0 | NO EJECUTADO | No aplica | Antecedentes separados; ninguna publicación | [Informe](INFORME_VERIFICACION_TECNICA.md) |
| Seguridad | Guardas y catálogos indicados | Dentro de los 32 casos / carga SQL | Aislamiento y denegaciones comprobados | Roles de servicio NOLOGIN; sin Auth gestionado | Sin nueva auditoría de penetración, RLS dinámica o dependencias | [Aislamiento](seguridad/aislamiento-destino.json) |
`);
put('RESULTADOS_PARA_TESIS_4_5.md',`# Propuesta para revisión académica: verificación de recuperación

Como verificación técnica complementaria se obtuvo una copia lógica institucional cifrada de PostgreSQL y se ensayó su restauración en un contenedor local sin conectividad de red ni puertos publicados. La carga final reprodujo la huella del catálogo de referencia y permitió comparar las 94 entradas de datos de tablas incluidas en la copia, con 27159 filas coincidentes en las columnas exportadas y 11 estados de secuencia iguales. La columna almacenada generada correspondiente a la edad del atleta se recalculó durante la restauración: no presentó discrepancias con su expresión actual, pero el archivo lógico no contiene sus valores históricos almacenados, por lo que no se afirma su igualdad retrospectiva. Se conservaron los intentos fallidos y las adaptaciones del entorno, incluido el tratamiento temporal de calculate_age y la recuperación exacta de su definición original ([carga y catálogo](integracion/restauracion-institucional-final.json), [comparación de datos](integracion/datos-restaurados.json)).

Se respaldaron además 43 objetos de Storage, con 3596269 bytes, mediante consultas GET al servicio institucional. Sus ETag MD5 coincidieron con el inventario del snapshot SQL; los archivos y el manifiesto se cifraron y se verificaron sus bytes recuperados en un directorio del entorno aislado. Esta lectura posterior no constituye un snapshot atómico conjunto ni una restauración de Supabase Storage API. Las herramientas incorporadas registraron 32 pruebas Node aprobadas, sin fallos u omisiones; los contratos del SDK usaron transporte simulado y se distinguen de las descargas institucionales reales. No se repitieron en esta fase Jest del producto, Playwright ni compilaciones web o Android, y no hubo despliegues o cambios institucionales. Permanecen pendientes la recuperación integral del servicio gestionado, la custodia externa de los respaldos y los controles operativos de publicación. Estas evidencias no se interpretan como mediciones de usabilidad o motivación ([Storage real](seguridad/storage-respaldo-real.json), [pruebas de herramientas](unitarias/respaldo-restauracion-final.stdout.log), [alcance y limitaciones](INFORME_VERIFICACION_TECNICA.md)).
`);
console.log(JSON.stringify({documents:3,nodeTests:32,tables:data.comparedTables,rows:data.totalRestoredRows,sequences:data.sequenceStates.length,storageObjects:storage.completedObjects,productionChanged:false}));
