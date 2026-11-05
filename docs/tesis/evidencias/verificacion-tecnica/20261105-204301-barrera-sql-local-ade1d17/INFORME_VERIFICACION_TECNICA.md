# Verificación técnica: barrera SQL en laboratorio

## Identificación y entorno

RIOVOLEY, commit base ade1d1748dc77f13d75da2b1248810f7b1a65386. Base y expediente creados 2026-11-05T20:43:01.489Z UTC (Ecuador UTC−5). Windows 10.0.26300, Node v24.18.0, PostgreSQL local 17.11, conexión fija 127.0.0.1:55322. Base única riovoley_gate_20261105204301_d69b51; siete relaciones sintéticas en public, gamification, auth y storage, con particiones. [Contexto](CONTEXTO.json). No se copiaron filas institucionales ni modificaron roles globales, contraseñas, servicios o permisos institucionales.

## Alcance y método

Ensayo de integración con PostgreSQL real y conexiones locales de authenticator, supabase_auth_admin y supabase_storage_admin. Authenticator usa SET ROLE anon, authenticated o service_role; no son cuentas de atletas ni login mediante Auth HTTP. No se usan repositorios simulados. Las tablas y RPC son fixtures propias y no reproducen las funcionalidades completas del producto. El alcance no es una auditoría de penetración.

Primero se verificaron escrituras permitidas. La fase RED exigió rechazo antes de instalar la barrera y falló por ausencia de rechazo, con código 1 conservado; es evidencia previa al mecanismo, no un fallo ocultado o una expectativa debilitada. Después se implementaron y ensayaron disparadores por sentencia. La primera versión pasó 44 casos; se añadieron tres regresiones para sentencia preparada y administradores Auth/Storage en sus esquemas sintéticos y se repitió la suite con 47 casos. No sumar las fases como comportamientos únicos.

## Comandos reproducibles

1. Ejecutar node scripts/audit/maintenance/lab.cjs. Verifica primero el Supabase local ya identificado y crea una base nueva; no recibe URL Cloud ni modifica la base de negocio local existente.
2. Establecer RIOVOLEY_GATE_PHASE=baseline y ejecutar node --test --test-reporter=tap tests/integration/maintenance-gate.local.test.cjs. Repetir con fase red, cuyo código esperado es 1.
3. Establecer RIOVOLEY_GATE_PHASE=green y ejecutar el mismo archivo. Instala y retira la barrera en la base marcada, sin dejarla activa al terminar satisfactoriamente. Se reutilizan exclusivamente credenciales locales existentes, sin pedir o generar claves.
4. Ejecutar node scripts/audit/maintenance/report.cjs y node scripts/audit/maintenance/finalize.cjs antes del sellado. Los recibos MCP/documentación y revisión se conservan en el expediente. Después de sellar, crear un contexto nuevo; no escribir sobre esta carpeta.

Los [metadatos de comandos](COMANDOS.json) conservan códigos y duraciones. Las cuatro fases midieron, respectivamente, 0.444, 0.377, 1.137, 1.185 segundos de proceso. No equivalen a tiempos de mantenimiento o recuperación institucional.

## Resultados

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| MNT-01 | Control de escrituras sin barrera | 5 | 5 | 0 | 0 | APROBADO | [TAP](integracion/baseline.stdout.log), [código y tiempo](integracion/baseline.meta.json) |
| MNT-02 | RED: rechazo requerido sin barrera | 1 | 0 | 1 | 0 | FALLIDO ESPERADO: demuestra ausencia inicial | [TAP](integracion/red.stdout.log), [código y tiempo](integracion/red.meta.json) |
| MNT-03 | Primera barrera SQL | 44 | 44 | 0 | 0 | APROBADO | [TAP](integracion/green.stdout.log), [código y tiempo](integracion/green.meta.json) |
| MNT-04 | Barrera con regresiones adicionales | 47 | 47 | 0 | 0 | APROBADO | [TAP](integracion/green-final.stdout.log), [código y tiempo](integracion/green-final.meta.json) |
| MNT-05 | Integridad de los cuatro SQL preparados | 4 comparaciones SHA-256 | 4 | 0 | 0 | APROBADO: archivos intactos | [Hashes](seguridad/propuestas-sql-sin-cambios.json) |
| MNT-06 | Jest y componentes del producto | 0 nuevos | 0 | 0 | 0 | NO EJECUTADO en este ensayo | [Antecedente](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) |
| MNT-07 | Playwright y ejecución Android | 0 nuevos | 0 | 0 | 0 | NO EJECUTADO | [Antecedente](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) |
| MNT-08 | Compilación web y Android | 0 nuevas | 0 | 0 | 0 | NO EJECUTADO en el ensayo | [Antecedente](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) |
| MNT-09 | Aislamiento gestionado integral | 0 ensayos completos | 0 | 0 | 0 | NO EJECUTADO: capa parcial | [Límites](PROPUESTA_AISLAMIENTO_SQL.md) |

## Qué comprueban los 47 casos finales

Los cinco actores de base de datos reciben el rechazo específico para INSERT/UPDATE/DELETE/TRUNCATE y conservan SELECT. Se prueban además escritura en tres esquemas adicionales, dos administradores en sus esquemas de fixture, tres llamadas SECURITY DEFINER, vista, dos accesos a particiones, UPSERT, UPDATE sin filas, marcador de ventana y control de excepción administrativa. Una transacción REPEATABLE READ y una sentencia preparada, ambas anteriores al cierre, no eluden la barrera en este ensayo. Los fallos de bloqueo durante instalación y retirada devuelven SQLSTATE 55P03 y no dejan cambios parciales. El retorno permite INSERT nuevamente a los cinco actores y conserva el contenido sintético. [Archivo de pruebas](../../../../../tests/integration/maintenance-gate.local.test.cjs), [TAP final](integracion/green-final.stdout.log).

## Unitarias, contratos, E2E y compilaciones

Este nuevo denominador corresponde a integración PostgreSQL de una fixture. No valida XP, pagos, asistencias o permisos institucionales por fila, ni constituye pruebas reales de servicios Auth/Storage. No se cambió lógica del producto y no se repitieron aquí Jest, Playwright, compilación web o Android. El [expediente funcional anterior](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) conserva sus 434 Jest/91 suites, Chromium 1/1 y Android local 14/14, con artefactos y fecha propios. El CI posterior a subir este expediente debe identificarse por su SHA y conservarse separado del sello; no se presume su resultado.

## Seguridad, revisión y estado final

La [revisión independiente estática](seguridad/revision-independiente.json) no encontró hallazgos bloqueantes en fixture, barrera y pruebas; el revisor no repitió la suite ni revisó estos informes. La comprobación posterior muestra barrera retirada, siete snapshots iguales y base conservada. [Estado final](integracion/estado-final-laboratorio.json), [snapshots previos](integracion/fixture-antes.json). Las [fuentes](FUENTES_EVALUADAS.json), [privacidad](PRIVACIDAD.json) e [integridad](INTEGRIDAD.json) se verifican antes del [sellado SHA-256](MANIFIESTO_SHA256.json).

## Incidencias y pendientes

Se conserva la fase RED 0/1 con fallo esperado y el primer GREEN 44/44; el resultado final es 47/47 y no omite casos. No hubo nueva compilación, restore, consulta de alertas Cloud o despliegue. Continúan pendientes un respaldo vigente al corte, cubrir efectos externos y todos los objetos relevantes, integrar y reensayar un paquete institucional compatible, confirmar calendario y autorizarlo expresamente. La limitación de respaldos administrados está documentada en la [fase anterior](../20261105-171049-prerrequisitos-corte-922a374/INFORME_VERIFICACION_TECNICA.md), sin atribuirle una nueva consulta en esta fase.

