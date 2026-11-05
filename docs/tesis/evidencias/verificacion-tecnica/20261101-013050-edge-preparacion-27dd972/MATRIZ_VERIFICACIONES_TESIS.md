# Matriz complementaria: Edge y preparación operativa

Base 27dd9727c5c791e8a7bf380a698dfa1c771e6dbb; 2026-11-01T01:30:50.378Z. Los conjuntos finales son 35 contratos Node (20 existentes y 15 nuevos), 12 HTTP de usuarios/push, 9 HTTP de reportes y un contrato SDK con transporte simulado. No sumar filas superpuestas ni recontar repeticiones.

| Categoría Tabla 4-6 | Archivos relacionados | Casos nuevos de categoría | Resultado / tipo | Mocks o servicios | Limitaciones | Evidencia |
| --- | --- | ---: | --- | --- | --- | --- |
| Caso de uso de gamificación | Sin ejecución nueva de ese caso de uso | 0 | NO EJECUTADO en esta fase | No aplica | Consultar ensayo SQL anterior; no atribuirle pruebas Edge | [Anterior](../20261031-211520-ensayo-sql-7665556/MATRIZ_VERIFICACIONES_TESIS.md) |
| Servicio público de gamificación | Sin ejecución nueva | 0 | NO EJECUTADO | No aplica | No se invocó createGamificationService | Mismo antecedente |
| Identidad del atleta | tests/integration/edge-http.local.test.cjs | 2 flujos de borrado H07/H10 | APROBADO; integración local | Auth/REST/PostgreSQL reales | No prueba avatar, títulos ni toda identidad de gamificación | [12 casos HTTP](integracion/edge-http-pruebas-1793497535205.stdout.log) |
| Wallet y monedas | Sin ejecución nueva | 0 | NO EJECUTADO | No aplica | No confundir con la protección SQL anterior | Antecedente SQL |
| Tienda cosmética | Sin ejecución nueva | 0 | NO EJECUTADO | No aplica | Sin compras nuevas | Antecedente SQL |
| Asistencia | _shared/reporting.ts | 0 flujos de asistencia | Solo comprobación estática del renderer | Deno, sin ejecución funcional | No se generó PDF de asistencia en esta fase | [Chequeo](integracion/candidato-final-check.meta.json) |
| Pagos | tests/unit/payment-reminders-edge.test.cjs | 4 | APROBADO; unitarias de recordatorios | Base/proveedor simulados | No registra mensualidades ni envía FCM real | [35 contratos](unitarias/regresion-edge-definitiva.stdout.log) |
| Compilación | nueve entrypoints / nueve bundles de retorno | — | APROBADO; comprobación Deno y bundles JS | Sin backend durante compilación | No equivale a build web/Android ni Cloud | [Deno](integracion/candidato-final-check.meta.json), [bundles](seguridad/bundles-retorno.json) |

## Complementarias

- **Reportes reales locales:** nueve casos en tests/integration/edge-reporting.local.test.cjs; PDF de padrón, snapshot, checksum, caché, borrado y autorizaciones. [TAP](integracion/reportes-http-pruebas-1793497867190.stdout.log). No se afirman resultados de renderers no ejecutados.
- **Contratos y seguridad:** 35 casos en credentials-edge, authorization-edge, reporting-edge, payment-reminders-edge y edge-relations; datos y dependencias simuladas. [TAP](unitarias/regresion-edge-definitiva.stdout.log).
- **SDK GoogleAuth:** un caso en tests/integration/google-auth.local.test.ts; criptografía y SDK reales, transporte OAuth simulado. [Registro](integracion/google-auth-contrato.stdout.log).
- **SQL complementario:** avance/retorno real local y orden con el paquete principal; no se aplicó institucionalmente. [Secuencia](seguridad/retorno-combinado.json).
- **Backup/restauración:** ensayo con datos sintéticos y seis tablas comparadas; primer restore directo falló, adaptación local documentada. No existe respaldo institucional verificado. [Resultado](seguridad/backup-local-restaurado.json).
- **Playwright/Android:** sin ejecuciones nuevas; [antecedente separado](../20261030-151554-preparacion-produccion-28e48d2/INFORME_VERIFICACION_TECNICA.md).

[Informe e incidencias](INFORME_VERIFICACION_TECNICA.md); [resultados](RESULTADOS_AUTOMATIZADOS.json).

