# Informe de verificación técnica: prerrequisitos del corte

Proyecto RIOVOLEY. Commit base 922a3744b0c74b6e8ffcb9f340c6e1bfa754425d. Inicio UTC 2026-11-05T17:10:50.244Z; consulta CLI 2026-11-05T17:10:50.533Z–2026-11-05T17:10:52.728Z. Sistema win32/x64, versión 10.0.26300, Node v24.18.0. El [contexto](CONTEXTO.json) registra cambios locales iniciales. Las fechas UTC se convierten a Ecuador restando cinco horas.

## Alcance y metodología

Se consultaron metadatos de respaldo mediante la sesión CLI existente para el proyecto mayvvlkvheagkojunzzb, el plan organizacional mediante MCP y la documentación oficial. No se introdujeron claves, descifraron archivos, crearon respaldos, restauraron servicios ni modificaron registros o configuración institucional. También se calculó SHA-256 del ciphertext existente y se verificaron siete referencias estáticas del repositorio. No constituye una prueba de penetración.

Comandos reproducibles: «node scripts/audit/production/check-cutover-prerequisites.cjs init», después «node scripts/audit/production/check-cutover-prerequisites.cjs collect». El segundo ejecuta exclusivamente la consulta «supabase backups list --project-ref mayvvlkvheagkojunzzb --output json» de la CLI portátil instalada. Se consulta su sesión existente sin imprimirla. Requiere acceso de lectura previo; no incluye login interactivo, restauración o actualización. [Comando, duración y código real](seguridad/respaldos-administrados.meta.json).

La respuesta reconocida fue backupsReturnedNull=true, physicalRecoveryMetadataEmpty=true, pitrEnabled=false; código 0. El valor null no se transforma en un arreglo vacío ni se presenta como un recuento de cero backups. WAL-G habilitado no establece por sí mismo un punto recuperable. El plan observado es free. [Consulta](seguridad/respaldos-administrados.json), [plan MCP](seguridad/plan-organizacion-mcp.json).

La [documentación oficial de respaldos](https://supabase.com/docs/guides/platform/backups) describe copias diarias para planes Pro, Team y Enterprise y recomienda exportaciones y custodia externa para proyectos free; los bytes de Storage no forman parte del respaldo de base de datos. Se registraron [fuente y alcance](seguridad/documentacion-consultada.json). No se contrató ningún servicio. La conclusión sobre este proyecto procede de su respuesta real, no solo de su plan.

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
| COR-07 | Jest, contratos e integración funcional | 0 casos nuevos | 0 | 0 | 0 | NO EJECUTADO en esta fase documental | [Antecedente](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) |
| COR-08 | Playwright y Android en ejecución | 0 casos nuevos | 0 | 0 | 0 | NO EJECUTADO en esta fase | [Antecedente](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) |
| COR-09 | Compilación web y nativa | 0 compilaciones nuevas | 0 | 0 | 0 | NO EJECUTADO en esta fase | [Antecedente](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) |

## Unitarias, contratos, Playwright, web y Android

No se modificó lógica del producto y no se repitieron estas suites o compilaciones. El expediente funcional anterior documenta sus 434 casos Jest/91 suites, prueba controlada Chromium 1/1 y 14/14 escenarios Android locales con su APK identificado; son denominadores distintos y ejecuciones anteriores. No se trasladan esos resultados al deployment público ni a un APK release posterior. [Trazabilidad de esta fase](MATRIZ_VERIFICACIONES_TESIS.md).

## Seguridad, permisos e incidencias

El ciphertext tiene 1418439 bytes, fue generado en 2026-11-01T02:58:51.738Z y tenía 110.2 horas al comprobarse. Coincide con su recibo; no se demostró que incluya cambios posteriores o que sea vigente al futuro corte. No hubo nuevo descifrado ni restore. La ausencia de punto administrado acreditado impide reemplazar esta limitación con una afirmación de recuperación gestionada.

Las alertas, RLS y ausencia de RPC diaria observadas en la [revisión anterior](../20261105-160424-transicion-lectura-d2b43e4/INFORME_VERIFICACION_TECNICA.md) mantienen su fecha y alcance; aquí no se volvieron a consultar ni se corrigieron. No se invocaron APIs de negocio, Auth, Storage o Edge. El aislamiento de escrituras sigue sin demostración y no se consideró suplido por Vercel, ausencia de actividad o marcadores SQL.

## Decisión y pendientes

No iniciar la transición. Los [criterios de corte/aborto/retorno](CRITERIOS_CORTE_Y_RETORNO.md) concretan la evidencia necesaria, sin activar medidas. Pendientes: respaldo vigente al corte y cobertura de recuperación, mecanismo de aislamiento ensayado, aceptación de integraciones excluidas de comprobación con claves, confirmación de calendario y autorización expresa del paquete. Android continúa solo en desarrollo/pruebas. No se ejecutó despliegue, SQL institucional, cambio de permisos, distribución, envío de mensajes o modificación de credenciales.

La revisión de [privacidad](PRIVACIDAD.json), [integridad](INTEGRIDAD.json) y [manifiesto](MANIFIESTO_SHA256.json) se realiza antes del sellado. El texto [para revisión académica](RESULTADOS_PARA_TESIS_4_5.md) no modifica el documento de tesis.

