# Matriz de trazabilidad

Base ade1d1748dc77f13d75da2b1248810f7b1a65386. La nueva suite comprueba mantenimiento SQL con fixtures y no se atribuye a las ocho categorías funcionales. Los archivos y resultados anteriores se mantienen en su [matriz de origen](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md).

| Categoría Tabla 4-6 | Archivos relacionados | Casos funcionales nuevos | Resultado real de esta fase | Tipo / mocks o servicios | Limitación / evidencia |
|---|---|---|---|---|---|
| Caso de uso de gamificación | [Archivos específicos de la categoría en matriz previa](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO para la categoría | No se invocó la funcionalidad | Barrera sintética no valida este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Servicio público de gamificación | [Archivos específicos de la categoría en matriz previa](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO para la categoría | No se invocó la funcionalidad | Barrera sintética no valida este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Identidad del atleta | [Archivos específicos de la categoría en matriz previa](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO para la categoría | No se invocó la funcionalidad | Barrera sintética no valida este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Wallet y monedas | [Archivos específicos de la categoría en matriz previa](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO para la categoría | No se invocó la funcionalidad | Barrera sintética no valida este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Tienda cosmética | [Archivos específicos de la categoría en matriz previa](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO para la categoría | No se invocó la funcionalidad | Barrera sintética no valida este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Asistencia | [Archivos específicos de la categoría en matriz previa](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO para la categoría | No se invocó la funcionalidad | Barrera sintética no valida este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Pagos | [Archivos específicos de la categoría en matriz previa](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO para la categoría | No se invocó la funcionalidad | Barrera sintética no valida este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Compilación del proyecto | [Archivos específicos de la categoría en matriz previa](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO para la categoría | No se invocó la funcionalidad | Barrera sintética no valida este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |

## Verificación complementaria ejecutada

| Verificación | Archivo / fase | Casos | Resultado | Tipo y dependencias | Limitación / evidencia |
|---|---|---|---|---|---|
| Escrituras abiertas | maintenance-gate.local.test.cjs / baseline | 5 | 5 aprobados | Integración PostgreSQL real; sin mocks | Permisos intencionalmente amplios de fixture; [TAP](integracion/baseline.stdout.log) |
| Rechazo sin barrera | Mismo archivo / red | 1 | 1 fallido esperado | PostgreSQL real | Demuestra ausencia inicial del mecanismo; [TAP](integracion/red.stdout.log) |
| Primera barrera | Mismo archivo / green | 44 | 44 aprobados | PostgreSQL real | Versión previa a tres regresiones; [TAP](integracion/green.stdout.log) |
| Barrera final / retorno | [tests/integration/maintenance-gate.local.test.cjs](../../../../../tests/integration/maintenance-gate.local.test.cjs) / green-final | 47 | 47 aprobados, 0 fallidos/omitidos | Conexiones reales y SET ROLE; sin Auth HTTP ni repositorios simulados | Solo relaciones y RPC sintéticas; [TAP](integracion/green-final.stdout.log) |
| Playwright | No ejecutado aquí | 0 | NO EJECUTADO | No navegador nuevo | [Antecedente](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) |
| Android / build | No ejecutado aquí | 0 | NO EJECUTADO | No dispositivo o compilación nueva | [Antecedente](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) |
| Seguridad Cloud / aislamiento integral | No ejecutado | 0 | PENDIENTE | Sin mutaciones o ensayos gestionados | [Alcance excluido](PROPUESTA_AISLAMIENTO_SQL.md) |

No sumar denominadores de fases repetidas, herramientas o verificaciones documentales.

