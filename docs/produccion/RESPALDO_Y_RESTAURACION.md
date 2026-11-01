# Respaldo institucional y restauración aislada: pendiente

El usuario confirmó que todavía no dispone de un respaldo reciente y un entorno de restauración comprobados. No se ha exportado información institucional ni se ha creado un proyecto Cloud adicional. El cambio de producción permanece bloqueado hasta completar este procedimiento con el responsable.

La comprobación local de nombres usuales de variables PostgreSQL no encontró configuración reconocida en archivos de entorno ni en el proceso. No se intentó una conexión institucional y no se leyeron valores para el informe. Esto no descarta credenciales en un gestor externo o una integración gestionada; el operador debe preparar acceso privado y custodia antes de la exportación.

## Evidencia local disponible

Se ejecutó `pg_dump` en formato custom sobre una base de ensayo con datos sintéticos y se restauró en un destino nuevo del mismo servidor local. El [resultado original](../tesis/evidencias/verificacion-tecnica/20261101-013050-edge-preparacion-27dd972/seguridad/backup-local-restaurado.json) registra archivo privado, tamaño, SHA-256, códigos de salida, huella y comparación de contenido/recuentos de seis tablas. No se borraron bases anteriores.

El primer restore directo **falló**: `calculate_age` no es inmutable aunque la columna almacenada `core.students.edad` depende de ella. La restauración compatible se ensayó únicamente en otro destino vacío: precargar esa función con volatilidad temporal IMMUTABLE, omitir solo su definición en la lista de restauración y recuperar después la definición original. El dump y la función origen permanecieron intactos. No aplicar esa declaración de volatilidad a producción como supuesta corrección.

PostgreSQL recalcula columnas GENERATED durante una restauración lógica. La igualdad observada corresponde a las fixtures de este ensayo; revisar valores derivados y sus reglas con datos institucionales antes de aceptar un restore. La prueba local incluye una estructura Auth mínima y no incluye objetos Storage ni toda la plataforma Supabase. No acredita un respaldo institucional recuperable.

## Preparación del respaldo real

1. **Designar responsable y destino privado.** Registrar proyecto `mayvvlkvheagkojunzzb`, fecha, alcance, custodia, retención y almacenamiento cifrado aprobado. Los dumps pueden contener datos personales y contraseñas cifradas de Auth; no guardarlos en Git, reportes, tickets ni carpetas públicas.
2. **Comprobar backups gestionados disponibles.** Revisar el panel Database/Backups, plan, fecha y alcance efectivo. No asumir que el proyecto dispone de restauración, PITR o descargas por lo que ofrece un plan genérico. Registrar referencia y disponibilidad, sin publicar datos ni secretos.
3. **Preparar acceso de exportación.** Si se necesita exportación lógica, el operador debe disponer de la conexión PostgreSQL existente y suministrarla mediante su gestor privado, `PGSERVICEFILE`/`PGPASSFILE` u otro mecanismo aprobado. Una clave API `service_role` no sustituye las credenciales TCP de PostgreSQL para `pg_dump`. No cambiar contraseñas para completar esta auditoría ni enviarlas por chat.
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
