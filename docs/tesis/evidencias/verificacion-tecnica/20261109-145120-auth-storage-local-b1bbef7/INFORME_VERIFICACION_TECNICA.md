# Verificación técnica: Auth y Storage locales

## Identificación, fecha y entorno

RIOVOLEY, commit base b1bbef7dc55d0845acc09bcd3c6ebbda959e32a8, contexto 2026-11-09T14:51:20.916Z UTC, Ecuador UTC−5. Windows 10.0.26300, Node v24.18.0, PostgreSQL 17.11; proyecto local riovoley-e2e-local, API55321/SQL55322. Storage filesystem, imagen public.ecr.aws/supabase/storage-api:v1.84.19; [contexto](CONTEXTO.json) y [Auth local](seguridad/configuracion-auth-local.json). No se utilizaron filas institucionales.

## Método y comandos

node scripts/audit/maintenance/service-context.cjs verifica el destino y abre expediente nuevo. node scripts/audit/maintenance/service-probe.cjs crea fixtures descartables, prueba antes/durante/después y libera sus objetos en finally. service-report.cjs genera documentos; service-finalize.cjs verifica y sella. Las ejecuciones reales usan el harness y conservan [comandos/códigos](COMANDOS.json). Después del sello se requiere contexto nuevo. El [manifiesto final](integracion/intento-servicios-1794236393839.json) identifica los archivos exactos; las versiones anteriores no se sobrescribieron.

Los servicios HTTP y PostgreSQL son reales, sin mocks. La restricción de fetch permite únicamente el origen local; no publica cabeceras, cuerpos de Auth o valores de credenciales. Se reutilizan claves locales existentes en memoria; no se solicitaron claves, cambiaron contraseñas existentes o generaron claves de servidor/proveedor. Cada intento crea y limpia dos identidades y dos buckets de prueba, sin registrar pagos, asistencias o evaluaciones.

## Resultados

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| SRV-01 | Primer alcance | 21 controles | 21 | 0 | 0 | APROBADO para su alcance | [Salida](integracion/servicios-http.stdout.log), [recibo](integracion/servicios-http.meta.json) |
| SRV-02 | Regresión: configuración de rol inválida | 22 controles | 21 | 1 | 0 | FALLIDO: conservado y corregido | [Salida](integracion/servicios-regresion-red.stdout.log), [recibo](integracion/servicios-regresion-red.meta.json) |
| SRV-03 | Regresión: reasignación sin rechazo | 22 controles | 21 | 1 | 0 | FALLIDO: conservado y corregido | [Salida](integracion/servicios-regresion-red-conexion-real.stdout.log), [recibo](integracion/servicios-regresion-red-conexion-real.meta.json) |
| SRV-04 | Ensayo ampliado corregido | 24 controles | 24 | 0 | 0 | APROBADO para su alcance | [Salida](integracion/servicios-http-final.stdout.log), [recibo](integracion/servicios-http-final.meta.json) |
| SRV-05 | Limpieza final obligatoria | 1 verificación compuesta | 1 | 0 | 0 | APROBADO | [Postcondiciones](integracion/limpieza-fixtures-1794236393836-cf48d6.json) |
| SRV-06 | Jest/componentes del producto | 0 nuevos | 0 | 0 | 0 | NO EJECUTADO aquí | [Antecedente](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) |
| SRV-07 | Playwright y Android | 0 nuevos | 0 | 0 | 0 | NO EJECUTADO aquí | [Antecedente](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) |
| SRV-08 | Compilación web/nativa | 0 nuevas | 0 | 0 | 0 | NO EJECUTADO aquí | [Antecedente](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) |
| SRV-09 | Cloud, S3 y proveedores externos | 0 ensayos | 0 | 0 | 0 | NO EJECUTADO | [Límites](ALCANCE_SERVICIOS_LOCALES.md) |

Duraciones de proceso: 7.487, 2.479, 2.499, 2.741 segundos. No sumar los controles repetidos como comportamientos únicos. La limpieza es una postcondición adicional del proceso y no otro caso funcional de los 24. En la repetición final se observaron 12 respuestas Auth y 22 Storage; esos denominadores de tráfico no se confunden con los controles.

## Integración y evidencia

Durante la barrera, login, refresh y borrado de la cuenta seleccionada fueron rechazados; la cuenta control siguió autenticándose. Un JWT anterior siguió permitiendo lectura. Storage rechazó subida, upsert, borrado y movimiento del objeto seleccionado; el bucket control permitió subida. Un UPDATE SQL que cambia el bucket debe comprobar el alcance anterior y nuevo; su regresión y el movimiento HTTP se verificaron tras la corrección. [24 controles](integracion/resultados-servicios-1794236393839-243436.json), [HTTP](integracion/http-servicios-1794236393736-19e57a.json).

Las observaciones registraron un archivo físico inicial con SHA del centinela y el mismo archivo/digest tras las operaciones bloqueadas; los bytes descargados permanecieron iguales. También coincidió el digest de las filas Auth seleccionadas. Tras la retirada, se verificaron login, subida, movimiento y descarga del contenido. La limpieza confirmó cero fixtures Auth/core.users/buckets propias y cero archivos propios residuales, con catálogo restaurado. [Observaciones](integracion/observaciones-auth-storage-1794236393833-d0b96b.json), [limpieza](integracion/limpieza-fixtures-1794236393836-cf48d6.json).

## Incidencias, seguridad y limitaciones

Se preservaron dos regresiones fallidas, distinguiendo el error de configuración 42501 del rechazo ausente que reprodujo la elusión. Se corrigieron el predicado OLD/NEW y las postcondiciones obligatorias de limpieza, sin modificar lógica del producto ni permisos institucionales. La [revisión independiente](seguridad/revision-independiente.json) no encontró bloqueantes pendientes en el alcance local; no repitió pruebas.

No se ejecutaron aquí Jest, Playwright, builds o Android. El CI posterior se registra por su SHA de forma separada del sello. Este ensayo no revoca JWT, no valida S3 gestionado, no acredita entrega de correo/push ni mantenimiento global y no constituye una prueba de penetración completa. Los HTTP500 esperados del prototipo requieren un contrato operativo antes de cualquier uso institucional. Persisten respaldo vigente, cobertura gestionada y autorización/ventana. [Alcance detallado](ALCANCE_SERVICIOS_LOCALES.md).

[Privacidad](PRIVACIDAD.json), [integridad](INTEGRIDAD.json) y [manifiesto SHA-256](MANIFIESTO_SHA256.json) respaldan el cierre. La [matriz](MATRIZ_VERIFICACIONES_TESIS.md) y el [texto propuesto](RESULTADOS_PARA_TESIS_4_5.md) no modifican la tesis.

