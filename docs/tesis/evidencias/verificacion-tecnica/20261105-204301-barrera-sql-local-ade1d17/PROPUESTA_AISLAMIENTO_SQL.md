# Capa SQL de aislamiento: ensayo local y límites

Se preparó y ensayó un prototipo, no una migración de producción. El código está en [scripts/audit/maintenance/gate.cjs](../../../../../scripts/audit/maintenance/gate.cjs); las guardas de destino y fixture están en [scripts/audit/maintenance/lab.cjs](../../../../../scripts/audit/maintenance/lab.cjs). No contiene una opción para seleccionar Cloud ni otro host/puerto. Requiere base nueva con nombre y comentario propios en 127.0.0.1:55322.

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

El prototipo se retiró al concluir. La [consulta posterior](integracion/estado-final-laboratorio.json) registra cero disparadores propios y ausencia del esquema gate_guard, con snapshots de fixtures iguales y base conservada. No hay aislamiento activo en producción ni autorización de despliegue. Los [criterios de corte anteriores](../20261105-171049-prerrequisitos-corte-922a374/CRITERIOS_CORTE_Y_RETORNO.md) siguen pendientes en su alcance global, especialmente respaldo vigente y cobertura externa.

