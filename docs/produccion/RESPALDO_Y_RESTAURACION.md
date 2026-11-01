# Respaldo institucional y restauración aislada

Al inicio no existía un respaldo institucional comprobado. El 1 de noviembre de 2026 el usuario ejecutó el asistente local y obtuvo una copia PostgreSQL cifrada de 1418439 bytes. Después se cargó en un contenedor nuevo sin red ni puertos: coincidieron el catálogo, las 94 entradas TABLE DATA con 27159 filas y 11 estados de secuencia. La evidencia y el estado de Storage se detallan en [el expediente de restauración](../tesis/evidencias/verificacion-tecnica/20261101-030216-restore-institucional-63826e6/INFORME_VERIFICACION_TECNICA.md). No se creó un proyecto Cloud adicional ni se aplicaron cambios institucionales. Este resultado SQL no acredita recuperación integral de Supabase ni autoriza el release.

La comprobación inicial de variables no encontró configuración PostgreSQL reconocida. El usuario introdujo después la contraseña existente únicamente en el asistente local, con TLS verify-full y CA del proveedor. El agente no recibió esa contraseña ni la frase de recuperación por chat. La copia real y su clave exportada volvieron a comprobarse por SHA-256 antes de la restauración.

## Resultado de la restauración SQL institucional

El archivo cifrado original conserva SHA-256 `22da6c77d9bbd3def2e6113c6c53531d76d900c0abe9c1f364c2dbb7828e54e6`. La huella del catálogo original y restaurado es `15b9d9e869fb5113263c485714009878`. Los controles de contenido compararon todas las columnas presentes en los bloques COPY del archivo, ordenando filas para no depender del orden físico. No se comparó la copia con datos vivos de producción ni se publicaron filas.

El destino usa PostgreSQL Supabase 17.11, Docker network=none, ningún puerto publicado o montaje del host, logging desactivado, PGDATA en tmpfs, escucha solo por socket Unix, cron.launch_active_jobs=off y max_worker_processes=0. No se iniciaron servicios Auth, Edge, Storage API, correo o push. Los contenedores previos fallidos se conservaron; una parada del motor elimina el contenido temporal de tmpfs, y exige otro destino nuevo. El archivo cifrado es el artefacto persistente de recuperación.

La carga requirió precargar pg_cron/pg_net y preparar roles locales con atributos leídos del catálogo institucional, sin contraseñas. En el destino supabase_admin necesita SUPERUSER para recibir la propiedad de event triggers; el operador local postgres también sigue siendo superusuario para restaurar. Los roles de servicio quedan NOLOGIN. No se restauraron contraseñas globales ni membresías; no extrapolar este bootstrap a los permisos efectivos del servicio gestionado.

Se aplicó en el destino vacío la adaptación de calculate_age descrita más abajo, recuperando después su definición original. La salida SQL del cliente Windows introducía CRLF en el cuerpo de esa función; la comparación aisló exactamente esa diferencia y se recuperaron los LF originales. El intento con huella diferente fue rechazado; el siguiente coincidió. No se modificó el archivo origen ni la función institucional.

La columna almacenada GENERATED core.students.edad se recalcula durante COPY: se comprobó coherencia con su expresión actual, con cero discrepancias, pero sus valores almacenados originales no están en el archivo lógico. La igualdad de contenido indicada corresponde a las columnas incluidas en COPY. Persisten las comprobaciones del servicio gestionado, claves PII/Vault, proveedores, clientes y ventana aprobada.

## Copia cifrada de archivos Storage

El inventario institucional de solo lectura del 1 de noviembre identifica 43 objetos: 40 privados y 3 públicos en 3 buckets. Sus bytes no están incluidos en pg_dump. El [asistente Storage](../../scripts/production/storage-backup.ps1) usa una clave de servidor **existente**, introducida con entrada oculta, y la frase del respaldo anterior:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\production\storage-backup.ps1
```

Su transporte SDK admite exclusivamente GET al host institucional y endpoints Storage, sin redirecciones. Descarga únicamente los objetos inventariados en el snapshot SQL restaurado; comprueba tamaños y ETag MD5 cuando es comparable, cifra cada objeto y el manifiesto de rutas, verifica descifrado y copia los bytes recuperados a tmpfs del contenedor aislado con comprobación SHA-256. Los nombres y metadatos permanecen en el manifiesto cifrado; no se registran la clave del servidor ni la frase. Una clave pública o una contraseña PostgreSQL no sirven para esta operación.

El resultado queda bajo `.e2e-local/institutional-storage/`, ignorado por Git. Conservar el manifiesto cifrado, todos los objetos cifrados y la clave/frase del respaldo PostgreSQL. Una copia de bytes recuperada en un directorio aislado no equivale a restaurar Supabase Storage API, buckets, políticas, URLs firmadas y su funcionamiento gestionado. La lectura de archivos y el snapshot SQL ocurren en momentos distintos; no se garantiza un snapshot común ni se detectan incorporaciones posteriores automáticamente. Ver el estado real y las limitaciones en [el informe de esta fase](../tesis/evidencias/verificacion-tecnica/20261101-030216-restore-institucional-63826e6/INFORME_VERIFICACION_TECNICA.md).

## Cierre complementario del 1 de noviembre de 2026 UTC

Se ensayó el avance principal, complemento de reportes y sus dos retornos en una base nueva clonada del respaldo institucional dentro del contenedor sin red. Coincidieron contenidos de las 94 tablas y 27159 filas en cada etapa y se recuperó la huella inicial; la base origen restaurada no cambió. La clave frontend PII se contrastó en memoria con los 60 correos y 57 teléfonos cifrados presentes y sus índices. Vault no contiene secretos ni referencias de funciones en el inventario actual. No se modificaron registros institucionales ni se ejecutaron sus flujos de negocio.

Se crearon dos ZIP privados separados: datos ya cifrados, 45 entradas/5052389 bytes; clave de recuperación protegida y destinatario público, dos entradas/4207 bytes. Se copiaron a directorios distintos fuera del repositorio, elegidos con autorización del usuario, y se comprobaron sus SHA-256. La frase no se copió. Son copias locales: no se atribuye custodia en otro dispositivo o fuera del sitio. Las rutas completas quedan solo en `.e2e-local/operational-readiness/custodia-local.private.json`. [Evidencia y límites](../tesis/evidencias/verificacion-tecnica/20261101-163241-cierre-operativo-2589935/INFORME_VERIFICACION_TECNICA.md).

## Asistente local preparado el 1 de noviembre de 2026 UTC

En este equipo están disponibles clientes PostgreSQL 17.11 y GnuPG 2.4.9. El [asistente PowerShell](../../scripts/production/backup-assistant.ps1) solicita la contraseña actual de PostgreSQL y una nueva frase de recuperación de al menos 20 caracteres, con entrada oculta y confirmación. Ejecutar desde la raíz del repositorio:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\production\backup-assistant.ps1
```

`Bypass` afecta únicamente a ese proceso. No modifica la política permanente del equipo. No introducir contraseñas en el comando, el chat o archivos `.env`. Guardar la nueva frase en el gestor privado del responsable; no confundirla con la contraseña PostgreSQL.

El [ejecutor](../../scripts/production/backup.cjs) usa el [origen no secreto fijado](../../scripts/production/backup-source.json): proyecto institucional conocido, host directo, puerto 5432, base `postgres`, TLS `verify-full` y huella de catálogo esperada. Rechaza destinos distintos, deriva o versión principal inesperada. La consulta de preflight usa transacción READ ONLY y las conexiones de exportación reciben `default_transaction_read_only=on`. La huella es un control previo en otra transacción: no demuestra ausencia de DDL concurrente durante el snapshot de `pg_dump`.

`pg_dump --format=custom` envía su salida directamente a GnuPG; no se escribe un dump intermedio en claro. La clave RSA de producción es de 3072 bits y el archivo usa AES256. La frase protege la clave secreta exportada. Los llaveros privados tienen rutas cortas bajo `.e2e-local/gpg/` por el límite de sockets de GnuPG MSYS. El resultado queda en un directorio nuevo bajo `.e2e-local/institutional-backup/artifacts/`, ignorado por Git:

- `database.pgp`: copia lógica cifrada, únicamente después de códigos de salida satisfactorios.
- `recovery-key.asc`: clave secreta protegida; custodiar una copia por separado del archivo cifrado y conservar su frase en el gestor privado.
- `recipient.asc`: clave pública.
- `receipt.json`: códigos, tamaño, SHA-256 y resultado de descifrado e inspección del catálogo del archivo. Mantenerlo privado hasta extraer metadatos revisados.

Si una herramienta falla, el recibo informa de la etapa sin publicar stderr ni credenciales y conserva el archivo incompleto. Un fallo previo a crear el directorio se informa solo mediante código de etapa. No borrar ni renombrar una copia incompleta para presentarla como aprobada. El mensaje `ENCRYPTED_LOGICAL_ARCHIVE_VERIFIED` acredita descifrado completo e inspección `pg_restore --list`, incluida la recuperación desde la clave exportada en un llavero independiente; **no acredita restauración de filas ni recuperación integral de Supabase**. El ejecutor no restaura bases ni despliega cambios.

El [expediente de validación](../tesis/evidencias/verificacion-tecnica/20261101-023445-backup-cifrado-2b4e9eb/INFORME_VERIFICACION_TECNICA.md) conserva diez contratos Node aprobados, un flujo cifrado real con fixtures y sus controles negativos, la comprobación TLS sin autenticación y los intentos de desarrollo fallidos. El ensayo de entrega usa RSA3072 como el ejecutor institucional; los ensayos intermedios usaron RSA2048. Ninguno contiene datos institucionales.

### Reproducción de herramientas en otro equipo

El asistente actual requiere Windows, Node.js, GnuPG de Git for Windows en `C:/Program Files/Git/usr/bin/gpg.exe` y clientes PG17 en `.e2e-local/backup-tools/postgres17/`. Los binarios privados no se publican. La descarga oficial de [PostgreSQL para Windows](https://www.postgresql.org/download/windows/) enlaza [EDB](https://www.enterprisedb.com/download-postgresql-binaries). En esta sesión se usó el ZIP 17.11 de EDB, `https://sbp.enterprisedb.com/getfile.jsp?fileid=1260616`, de 381531864 bytes, SHA-256 `80379b2c04d51c30225532e0ae04509899141e9957ed096fe749d7fd9df8f82f`. Se extrajeron únicamente `pg_dump.exe`, `pg_restore.exe`, `psql.exe`, `pg_dumpall.exe` y los DLL de `pgsql/bin/`; no se instaló un servidor ni un servicio Windows. El hash es una medición local, no una firma o checksum del fabricante verificado independientemente.

La CA pública procede de `https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt`, guardada como `.e2e-local/backup-tools/supabase-prod-ca-2021.crt`, SHA-256 `700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7`. No sustituirla por `sslmode=require` o desactivar verificación si cambia la infraestructura: revisar primero el certificado y el procedimiento del proveedor.

Verificar herramientas y sintaxis sin pedir credenciales:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\audit\production\check-backup-tools.ps1
node --test --test-reporter=tap tests/unit/production-backup.test.cjs
```

El flujo sintético `scripts/audit/production/test-encrypted-backup.cjs` requiere el laboratorio marcado de esta auditoría, su configuración privada, PostgreSQL local en loopback y un expediente **nuevo sin sellar** para el harness. No usarlo contra producción ni apuntarlo al expediente ya sellado. No es un instalador universal de Supabase.

## Evidencia local disponible

Se ejecutó `pg_dump` en formato custom sobre una base de ensayo con datos sintéticos y se restauró en un destino nuevo del mismo servidor local. El [resultado original](../tesis/evidencias/verificacion-tecnica/20261101-013050-edge-preparacion-27dd972/seguridad/backup-local-restaurado.json) registra archivo privado, tamaño, SHA-256, códigos de salida, huella y comparación de contenido/recuentos de seis tablas. No se borraron bases anteriores.

El primer restore directo **falló**: `calculate_age` no es inmutable aunque la columna almacenada `core.students.edad` depende de ella. La restauración compatible se ensayó únicamente en otro destino vacío: precargar esa función con volatilidad temporal IMMUTABLE, omitir solo su definición en la lista de restauración y recuperar después la definición original. El dump y la función origen permanecieron intactos. No aplicar esa declaración de volatilidad a producción como supuesta corrección.

PostgreSQL recalcula columnas GENERATED durante una restauración lógica. La igualdad observada corresponde a las fixtures de este ensayo; revisar valores derivados y sus reglas con datos institucionales antes de aceptar un restore. La prueba local incluye una estructura Auth mínima y no incluye objetos Storage ni toda la plataforma Supabase. No acredita un respaldo institucional recuperable.

## Preparación del respaldo real

1. **Designar responsable y destino privado.** Registrar proyecto `mayvvlkvheagkojunzzb`, fecha, alcance, custodia, retención y almacenamiento cifrado aprobado. Los dumps pueden contener datos personales y contraseñas cifradas de Auth; no guardarlos en Git, reportes, tickets ni carpetas públicas.
2. **Comprobar backups gestionados disponibles.** Revisar el panel Database/Backups, plan, fecha y alcance efectivo. No asumir que el proyecto dispone de restauración, PITR o descargas por lo que ofrece un plan genérico. Registrar referencia y disponibilidad, sin publicar datos ni secretos.
3. **Preparar acceso de exportación.** El asistente anterior recoge la contraseña existente en memoria y la transmite al cliente PostgreSQL mediante el entorno del proceso hijo; filtra otras variables de conexión y depuración. No lee `PGSERVICEFILE`/`PGPASSFILE` ni secretos de Vercel. Una clave API `service_role` no sustituye las credenciales TCP de PostgreSQL para `pg_dump`. No cambiar contraseñas para completar esta auditoría ni enviarlas por chat.
4. **Definir todos los componentes.** Incluir estructura/datos/roles necesarios, historial de migraciones y personalizaciones de Auth/Storage. Inventariar aparte objetos Storage, funciones Edge, configuración Auth/URLs/SMTP, scheduler/cron, secretos, clientes/Capgo y claves de cifrado PII/Vault. Un dump de base de datos no equivale a copiar los archivos de Storage ni la configuración de los proveedores.
5. **Exportar sin escrituras institucionales.** Revisar la ayuda de la versión instalada y el procedimiento oficial antes de ejecutar. Verificar origen y proyecto; usar snapshot consistente y conservar los códigos de salida. La exportación debe terminar con artefactos privados verificables, tamaños y SHA-256. No mostrar una URL con contraseña ni el contenido de los archivos en consola.

La guía oficial describe exportaciones separadas de roles, esquema y datos. Su ejemplo de reset de contraseña no aplica aquí: las restricciones de esta auditoría exigen preservar las credenciales actuales. El procedimiento debe adaptarse a extensiones, cifrado y personalizaciones reales; no copiar comandos de restauración sobre producción.

## Preparación y aceptación de la restauración

1. Crear o disponer de un **destino vacío y aislado**, con identificación distinta del proyecto institucional. Si implica un recurso Cloud o coste, obtener antes la aprobación del responsable. Preservar los laboratorios actuales; no resetearlos para reutilizarlos.
2. Mantener correo, push, jobs, webhooks y cualquier salida hacia producción deshabilitados o bloqueados en el destino antes de cargar datos. No trasladar credenciales de proveedores para hacer funcionar la prueba.
3. Verificar versión PostgreSQL, extensiones, roles y permisos de restauración. Revisar específicamente `calculate_age`, columnas GENERATED, cifrado/Vault y triggers sobre Auth/Storage; el ensayo local no resuelve automáticamente esos casos institucionales.
4. Restaurar con parada ante errores y guardar cada resultado. Conservar un destino fallido para analizarlo o preparar otro vacío; no reintentar sobre un estado parcial sin un procedimiento explícito.
5. Comparar estructura, propietarios, grants, RLS/políticas, funciones y relaciones. Verificar recuentos y controles de contenido sin publicar filas personales, así como coherencia de datos derivados y archivos Storage recuperados.
6. Comprobar flujos con cuentas **nuevas y descartables del destino aislado**. No modificar contraseñas o registros institucionales para preparar pruebas. Auth, RLS, pagos, asistencia, evaluaciones, gamificación, reportes y recuperación deben mantener sus respectivos denominadores y resultados.
7. Registrar tiempos observados de respaldo/recuperación, integridad, incidencias, aprobación del responsable y referencia privada del artefacto recuperable. No declarar RPO/RTO cumplidos sin objetivos y mediciones reales.

Solo después puede revisarse la autorización del release coordinado. El orden de los paquetes SQL y su retorno se detalla en [EDGE.md](EDGE.md) y en el [runbook](RUNBOOK.md). El rollback de esquema ya ensayado conserva datos posteriores y reintroduce permisos antiguos: no es sustituto de la restauración.

## Herramienta de ensayo disponible

`scripts/audit/production/rehearse-local-backup.cjs` trabaja únicamente con la base sintética marcada de esta auditoría, el Docker local verificado y nombres nuevos `riovoley_restore_*`. No admite una conexión institucional ni exporta datos Cloud. Conserva el intento directo fallido y la restauración compatible como resultados distintos.

Los archivos de este ensayo se conservan en `.e2e-local/production-backup/`; contienen solo fixtures y no deben confundirse con el respaldo institucional pendiente. Ejecutar otra sesión exige un expediente nuevo: los expedientes sellados rechazan escrituras.

Referencias revisadas: [backups Supabase](https://supabase.com/docs/guides/platform/backups) y [backup/restauración con CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore). Esas guías no acreditan qué backups o recursos existen en esta cuenta.
