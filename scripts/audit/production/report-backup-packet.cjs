'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs'),read=name=>JSON.parse(fs.readFileSync(path.join(h.evidence,name),'utf8'));
assert.ok(!fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')),'Usar expediente nuevo');
const ctx=read('CONTEXTO.json'),archive=read('integracion/backup-cifrado-entrega.json'),environment=read('seguridad/entorno.json');
const tap=fs.readFileSync(path.join(h.evidence,'unitarias/backup-final.stdout.log'),'utf8');
const count=name=>Number(tap.match(new RegExp('^# '+name+' (\\d+)$','m'))?.[1]);
const unit={tests:count('tests'),pass:count('pass'),fail:count('fail'),skipped:count('skipped'),durationMs:Number(tap.match(/^# duration_ms ([\d.]+)$/m)?.[1])};
assert.equal(unit.tests,10);assert.equal(unit.pass,10);assert.equal(unit.fail,0);assert.equal(unit.skipped,0);
for(const key of ['onlySynthetic','originalArchiveVerified','exportedRecoveryKeyVerified','corruptionRejected','wrongPassphraseRejected','failedDumpRejected','sourceCatalogCheckedReadOnly','wrongCatalogRejected','wrongServerMajorRejected'])assert.equal(archive[key],true,key);
assert.equal(archive.rsaBits,3072);assert.equal(archive.institutionalBackupPerformed,false);
for(const name of ['unitarias/backup-final','integracion/cifrado-backup-entrega','seguridad/herramientas-asistente','seguridad/tls-sin-credenciales-corregido'])assert.equal(read(name+'.meta.json').exitCode,0);
const tls=read('seguridad/tls-verificado.json');assert.equal(tls.tlsVerified,true);assert.equal(tls.postgresAuthenticationAttempted,false);
const previous='../20261101-013050-edge-preparacion-27dd972/INFORME_VERIFICACION_TECNICA.md';
h.write('RESULTADOS_AUTOMATIZADOS.json',{baseCommit:ctx.commit,createdAt:ctx.createdAt,unit,syntheticEncryptedFlow:{executed:1,passed:1,failed:0,skipped:0,checks:8,rsaBits:3072,archiveBytes:archive.archiveBytes,tocEntries:archive.tocEntries},tls:{executed:1,passed:1,authenticated:false},assistantStaticCheck:{executed:1,passed:1,hiddenInputs:3},institutionalBackup:{status:'BLOQUEADO',reason:'Entrada local pendiente de contraseña actual y nueva frase de recuperación; no enviarlas por chat'},isolatedInstitutionalRestore:{status:'NO EJECUTADO',reason:'Todavía no existe copia institucional exportada'},productionChanged:false,webBuildExecuted:false,androidBuildExecuted:false,playwrightExecuted:false});
h.write('INFORME_VERIFICACION_TECNICA.md',`# Verificación técnica complementaria: respaldo cifrado

## Identificación, fecha y alcance

RIOVOLEY, repositorio Joscoo/riovoley. Commit base **${ctx.commit}**, con archivos nuevos/modificados de herramientas y documentación durante la ejecución. Inicio UTC **${ctx.createdAt}**; el inventario FUENTES_EVALUADAS.json identifica por SHA-256 las fuentes evaluadas antes del commit de entrega. No se modificaron lógica de negocio, registros institucionales, esquema, políticas, credenciales o despliegues.

Esta fase prepara la exportación lógica cifrada y su operación local. No repite las suites del producto ni sustituye [la auditoría anterior](${previous}). No es una auditoría de penetración, evaluación de usabilidad o estudio de motivación.

## Entorno y configuración

${environment.OS}; PowerShell ${environment.PowerShell}; Node ${environment.Node}; npm ${environment.npm}; ${environment.pg_dump}; ${environment.pg_restore}; ${environment.gpg}. [Registro de herramientas](seguridad/entorno.json). Clientes nativos extraídos de ZIP oficial, sin instalar servidor/servicio Windows. [Origen y hashes de herramientas](seguridad/herramientas-descargadas.json). El hash local del ZIP no equivale a checksum del fabricante comprobado independientemente.

Origen previsto: proyecto mayvvlkvheagkojunzzb, host directo IPv6, PostgreSQL postgres:5432, usuario postgres, TLS verify-full y CA pública del proveedor. Solo se publican [parámetros no secretos](seguridad/origen-configurado.json). La contraseña actual pertenece al usuario y aún no se introdujo en el asistente. El backend configurado en .env.e2e se trata como producción y no se utilizó para login o mutaciones. La CLI de Supabase no tenía sesión disponible ([resultado](seguridad/sesion-cli.json)); el acceso MCP de lectura no suministra una contraseña TCP para pg_dump.

## Metodología y comandos

- node --test --test-reporter=tap tests/unit/production-backup.test.cjs: controles puros del origen, TLS obligatorio y entorno filtrado; sin conexión real.
- node scripts/audit/production/test-encrypted-backup.cjs: un flujo con PostgreSQL local marcado, clientes PG y GnuPG reales; datos sintéticos, sin repositorio simulado. Ocho controles: catálogo en READ ONLY, rechazo de deriva, rechazo de versión, exportación/cifrado/inspección, clave exportada independiente, frase incorrecta, fallo de dump y corrupción.
- powershell -NoProfile -ExecutionPolicy Bypass -File scripts/audit/production/check-backup-tools.ps1: sintaxis del asistente, tres entradas ocultas y versiones; no solicita secretos.
- Helper privado de SSLRequest/TLS: conexión sin autenticar contra el host institucional y validación de CA/nombre. Los registros identifican el comando y resultado; no se redistribuye un exportador de secretos.

[COMANDOS.json](COMANDOS.json) conserva comandos, inicio/fin, duración y códigos de todas las ejecuciones registradas. Reproducción y requisitos en [la guía operativa](../../../../produccion/RESPALDO_Y_RESTAURACION.md).

## Resultados por herramienta

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| B01 | Contratos Node de respaldo | 10 | 10 | 0 | 0 | APROBADO | [TAP](unitarias/backup-final.stdout.log), [metadatos](unitarias/backup-final.meta.json) |
| B02 | Flujo cifrado real sintético, ocho controles | 1 flujo | 1 | 0 | 0 | APROBADO | [JSON](integracion/backup-cifrado-entrega.json), [ejecución](integracion/cifrado-backup-entrega.meta.json) |
| B03 | TLS sin autenticación PostgreSQL | 1 | 1 | 0 | 0 | APROBADO | [TLS](seguridad/tls-verificado.json), [salida](seguridad/tls-sin-credenciales-corregido.meta.json) |
| B04 | Sintaxis y herramientas PowerShell | 1 comprobación | 1 | 0 | 0 | APROBADO | [Entorno](seguridad/entorno.json), [ejecución](seguridad/herramientas-asistente.meta.json) |
| B05 | Exportación institucional cifrada | 0 | 0 | 0 | 0 | BLOQUEADO: entrada local de secretos pendiente | [Estado](RESULTADOS_AUTOMATIZADOS.json) |
| B06 | Restauración institucional aislada | 0 | 0 | 0 | 0 | NO EJECUTADO: falta la copia institucional | [Estado](RESULTADOS_AUTOMATIZADOS.json) |
| B07 | Jest/componentes del producto | 0 en esta fase | 0 | 0 | 0 | NO EJECUTADO | [Antecedente separado](${previous}) |
| B08 | Playwright | 0 en esta fase | 0 | 0 | 0 | NO EJECUTADO | Mismo antecedente; sin login institucional |
| B09 | Compilación web | — | — | — | — | NO EJECUTADO en esta fase | Mismo antecedente; fuentes frontend sin cambios |
| B10 | Compilación Android | — | — | — | — | NO EJECUTADO en esta fase | Mismo antecedente; fuentes Android sin cambios |

No sumar estos denominadores ni contar ejecuciones intermedias como casos adicionales. Las duraciones originales constan en cada meta.json. La cobertura de código no se calculó: los diez contratos son Node, no la suite CRA con instrumentación.

## Integración, seguridad e incidencias

El flujo de entrega generó un archivo privado de **${archive.archiveBytes} bytes**, con **${archive.tocEntries} entradas** inspeccionadas en su tabla de contenido. Se usó RSA3072 y cifrado AES256; pg_dump y GPG terminaron con código cero. El SHA-256 y los resultados negativos constan en [la evidencia](integracion/backup-cifrado-entrega.json). La clave secreta protegida por frase se importó en otro llavero y permitió descifrar; una frase incorrecta fue rechazada. No se persistió el dump en claro ni se publicaron filas. La corrupción intencional y el fallo controlado de dump son denegaciones esperadas aprobadas, no fallos del cierre.

GnuPG se drena hasta el final aunque pg_restore --list cierre antes la entrada; se comprueba así la integridad del mensaje cifrado. **Listar el archivo no restaura sus filas ni valida todos sus bloques comprimidos mediante carga en una base**. No se ejecutó una restauración institucional y no se acredita recuperación integral de Auth, Storage, roles globales, claves PII/Vault, configuración de proveedores o servicios gestionados.

Se conservaron intentos fallidos: prueba inicial sin módulo; primer flujo con error de sintaxis; generación GPG por rutas Windows; importación de recuperación por ruta de socket demasiado larga. Se corrigieron rutas MSYS y ubicación corta de llaveros. El primer helper TLS informó validación, pero terminó con error nativo por doble cierre del socket; la ejecución corregida terminó con código cero. Los registros originales permanecen separados, sin reclasificarlos como aprobados. Los ensayos cifrados intermedios usaron RSA2048; solo el de entrega usa RSA3072.

La revisión independiente fue de solo lectura y reejecutó 10/10 contratos; no confirmó defectos críticos o importantes. La huella esperada del catálogo es un control previo en una transacción distinta del snapshot de pg_dump; no excluye DDL concurrente. La consistencia del snapshot y la comparación posterior durante un restore deben evaluarse por separado.

No se repitieron advisors de dependencias o pruebas RLS en esta fase. Los hallazgos institucionales y propuestas SQL/Edge anteriores siguen sin aplicarse. Esta verificación no autoriza el release.

## Pendientes y evidencias

Ejecutar el asistente con entrada privada, custodiar archivo/clave/frase por separado, revisar el recibo y preparar un destino nuevo aislado con salidas de correo/push/jobs bloqueadas. La restauración debe contemplar la incidencia calculate_age/columna GENERATED ya registrada en [el ensayo anterior](${previous}). Respaldar objetos Storage, roles/configuración y claves necesarias aparte; comprobar los proveedores y clientes antes de la ventana aprobada. No se modificaron el documento de tesis ni servicios institucionales.

[Matriz](MATRIZ_VERIFICACIONES_TESIS.md), [texto académico](RESULTADOS_PARA_TESIS_4_5.md), [resultados calculados](RESULTADOS_AUTOMATIZADOS.json), [privacidad](PRIVACIDAD.json), [integridad](INTEGRIDAD.json) y [manifiesto](MANIFIESTO_SHA256.json).
`);
const categories=['Caso de uso de gamificación','Servicio público de gamificación','Identidad del atleta','Wallet y monedas','Tienda cosmética','Asistencia','Pagos','Compilación del proyecto'];
h.write('MATRIZ_VERIFICACIONES_TESIS.md',`# Matriz complementaria: preparación de respaldo cifrado

Base ${ctx.commit}; inicio ${ctx.createdAt}. Esta fase verifica herramientas operativas. No añade casos funcionales a las ocho categorías de la Tabla 4-6 ni recontabiliza resultados anteriores.

| Categoría | Archivos funcionales ejecutados | Casos ejecutados | Resultado real | Tipo / mocks o servicios | Limitación / evidencia |
| --- | --- | ---: | --- | --- | --- |
${categories.map(c=>`| ${c} | Ninguno en esta fase | 0 | NO EJECUTADO | No aplica | [Antecedente](${previous}); no sumar pruebas de respaldo a esta categoría |`).join('\n')}

| Complementaria | Archivo | Casos ejecutados | Resultado | Tipo / dependencia | Limitación | Evidencia |
| --- | --- | ---: | --- | --- | --- | --- |
| Contratos de respaldo | tests/unit/production-backup.test.cjs | 10 | 10 aprobados | Node; configuración sintética, sin DB | No acredita acceso institucional | [TAP](unitarias/backup-final.stdout.log) |
| Exportación/cifrado/recuperación de clave | scripts/audit/production/test-encrypted-backup.cjs | 1 flujo con 8 controles | APROBADO | Integración real PG/GPG local; fixtures, sin mocks de repositorio | Inspección de archivo; no carga filas en destino | [JSON](integracion/backup-cifrado-entrega.json) |
| Transporte seguro | Helper SSLRequest/TLS privado | 1 | APROBADO | Red institucional real, sin autenticar | No acredita contraseña ni permisos de exportación | [TLS](seguridad/tls-verificado.json) |
| Asistente | scripts/audit/production/check-backup-tools.ps1 | 1 comprobación | APROBADO | Parser PowerShell y ejecutables reales | Contraseña aún no introducida | [Entorno](seguridad/entorno.json) |
| Playwright | Ninguno en esta fase | 0 | NO EJECUTADO | No aplica | No confundir el flujo de backup con E2E del producto | [Informe](INFORME_VERIFICACION_TECNICA.md) |
| Android | Ninguno en esta fase | 0 | NO EJECUTADO | No aplica | Sin compilación nativa nueva | Mismo informe |
| Seguridad RLS/dependencias | Ninguno en esta fase | 0 | NO EJECUTADO | No aplica | No se repitieron advisors o auditorías npm | Mismo informe |
| Backup institucional / restore aislado | Asistente pendiente de entrada local | 0 | BLOQUEADO / NO EJECUTADO respectivamente | No se inició autenticación PostgreSQL | No existe copia institucional comprobada | [Estado](RESULTADOS_AUTOMATIZADOS.json) |
`);
h.write('RESULTADOS_PARA_TESIS_4_5.md',`# Propuesta para revisión académica: complemento del apartado 4.5

La preparación operativa del respaldo incorporó diez pruebas de contrato aprobadas para restringir el origen de conexión, exigir TLS verificado y filtrar variables heredadas. De forma separada, se ejecutó un flujo de integración con PostgreSQL 17.11 y GnuPG 2.4.9 sobre datos sintéticos. Este comprobó ocho controles relacionados con la lectura del catálogo, el rechazo de deriva o versión incorrecta, la exportación cifrada, la recuperación mediante la clave exportada en un llavero independiente, el rechazo de una frase incorrecta, la detección de un fallo de exportación y la identificación de corrupción del archivo. La copia cifrada del ensayo de entrega ocupó ${archive.archiveBytes} bytes y su tabla de contenido presentó ${archive.tocEntries} entradas; estos valores corresponden al laboratorio y no al volumen institucional ([contratos](unitarias/backup-final.stdout.log), [flujo sintético](integracion/backup-cifrado-entrega.json)).

Asimismo, se verificó el transporte TLS 1.3 hacia el servidor institucional sin intentar autenticación PostgreSQL. La inspección del archivo y el descifrado completo no constituyen una restauración de datos. La exportación institucional permanece bloqueada por la entrada local pendiente de la contraseña actual y de una frase de recuperación; por ello, tampoco se ha ejecutado su restauración aislada. En esta fase no se repitieron pruebas del producto con Jest, Playwright ni compilaciones web o Android, y no se aplicaron cambios al servicio institucional. Los intentos fallidos y las correcciones del entorno Windows se conservan en [el informe técnico](INFORME_VERIFICACION_TECNICA.md), junto con [los estados pendientes](RESULTADOS_AUTOMATIZADOS.json). Estas comprobaciones operativas no proporcionan mediciones de usabilidad o motivación.
`);
console.log(JSON.stringify({reports:3,unit:unit.pass,syntheticFlows:1,institutionalBackupPerformed:false}));
