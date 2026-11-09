# Matriz de trazabilidad

No se repiten los casos de negocio de la Tabla 4-6. Los archivos, cantidades y dependencias previos constan en la [matriz funcional](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md).

| Categoría | Archivos relacionados | Casos nuevos de la categoría | Resultado | Tipo/dependencias | Límite/evidencia |
|---|---|---|---|---|---|
| Caso de uso de gamificación | [Archivos específicos en matriz anterior](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Sin invocación del caso de negocio | Los rechazos Edge no validan este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Servicio público de gamificación | [Archivos específicos en matriz anterior](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Sin invocación del caso de negocio | Los rechazos Edge no validan este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Identidad del atleta | [Archivos específicos en matriz anterior](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Sin invocación del caso de negocio | Los rechazos Edge no validan este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Wallet y monedas | [Archivos específicos en matriz anterior](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Sin invocación del caso de negocio | Los rechazos Edge no validan este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Tienda cosmética | [Archivos específicos en matriz anterior](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Sin invocación del caso de negocio | Los rechazos Edge no validan este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Asistencia | [Archivos específicos en matriz anterior](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Sin invocación del caso de negocio | Los rechazos Edge no validan este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Pagos | [Archivos específicos en matriz anterior](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Sin invocación del caso de negocio | Los rechazos Edge no validan este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Compilación del proyecto | [Archivos específicos en matriz anterior](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Sin invocación del caso de negocio | Los rechazos Edge no validan este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |

| Complemento | Archivo/fase | Casos | Resultado real | Dependencias | Evidencia/límite |
|---|---|---|---|---|---|
| Handler dispositivos RED | edge-fence-cases.cjs red | 2 | 0 aprobados/2 fallidos: esperaba401 y recibía500 | Auth real local, sin mock de identidad | [RED](integracion/casos-red.json) |
| Nueve handlers y cerca final | edge-fence-cases.cjs green | 57 | 57 aprobados/0 fallidos | Deno y Auth/REST reales; listener/fetch instrumentados; proveedor sintético | [Resultado](integracion/casos-green-1794238392821-383d5a.json); sin entrega/Cloud |
| Contratos existentes | tests/unit/*edge*.test.* y scripts auxiliares del comando | 35 | 35 aprobados | Clientes simulados, no persistencia real | [TAP](integracion/contratos-edge.stdout.log) |
| Typecheck | sync-mobile-device, repositorio y candidato | 1 por comando | Ambos códigos0 | Deno y lock congelado del candidato | [Fuente](integracion/sync-typecheck.meta.json), [candidato](integracion/sync-typecheck-candidato-corregido.meta.json) |
| Playwright/Android/builds | No ejecutados aquí | 0 | NO EJECUTADO | Antecedentes conservan SHA propio | [Anterior](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) |

