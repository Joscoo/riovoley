# Matriz de trazabilidad

El nuevo ensayo comprueba APIs locales de Auth/Storage y una barrera condicional. No repite los módulos funcionales de Tabla 4-6; crear una identidad Auth descartable no valida la identidad deportiva del atleta. Archivos y casos previos permanecen en la [matriz funcional](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md).

| Categoría | Archivos de prueba relacionados | Casos nuevos de la categoría | Resultado | Tipo/dependencias | Limitación/evidencia |
|---|---|---|---|---|---|
| Caso de uso de gamificación | [Archivos por categoría en matriz anterior](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Sin invocación del caso de negocio | Auth/Storage de fixture no valida este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Servicio público de gamificación | [Archivos por categoría en matriz anterior](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Sin invocación del caso de negocio | Auth/Storage de fixture no valida este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Identidad del atleta | [Archivos por categoría en matriz anterior](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Sin invocación del caso de negocio | Auth/Storage de fixture no valida este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Wallet y monedas | [Archivos por categoría en matriz anterior](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Sin invocación del caso de negocio | Auth/Storage de fixture no valida este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Tienda cosmética | [Archivos por categoría en matriz anterior](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Sin invocación del caso de negocio | Auth/Storage de fixture no valida este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Asistencia | [Archivos por categoría en matriz anterior](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Sin invocación del caso de negocio | Auth/Storage de fixture no valida este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Pagos | [Archivos por categoría en matriz anterior](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Sin invocación del caso de negocio | Auth/Storage de fixture no valida este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Compilación del proyecto | [Archivos por categoría en matriz anterior](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Sin invocación del caso de negocio | Auth/Storage de fixture no valida este módulo; [informe](INFORME_VERIFICACION_TECNICA.md) |

| Complemento | Archivo | Casos | Resultado real | Mocks o servicios | Evidencia/límite |
|---|---|---|---|---|---|
| Auth/Storage y barrera | scripts/audit/maintenance/service-probe.cjs | 24 controles finales | 24 aprobados, 0 fallidos | APIs Auth/Storage, PostgreSQL y filesystem reales locales; sin mocks | [Controles](integracion/resultados-servicios-1794236393839-243436.json); no Cloud/S3 |
| Primer alcance | Mismo runner | 21 | 21 aprobados | Local real | [Salida](integracion/servicios-http.stdout.log); alcance previo más reducido |
| Regresión/configuración | Mismo runner | 22 | 21 aprobados, 1 fallido | SET ROLE no autorizado; luego corregido | [Salida](integracion/servicios-regresion-red.stdout.log) |
| Regresión de elusión | Mismo runner | 22 | 21 aprobados, 1 fallido esperado | Conexión PostgreSQL Storage real, transacción revertida | [Salida](integracion/servicios-regresion-red-conexion-real.stdout.log) |
| Seguridad/limpieza | Incluidas en el proceso | Sin sumar otro denominador funcional | Postcondiciones obligatorias aprobadas | Solo filas/buckets propios | [Limpieza](integracion/limpieza-fixtures-1794236393836-cf48d6.json) |
| Playwright/Android/builds | No ejecutados aquí | 0 | NO EJECUTADO | Antecedentes con SHA propio | [Informe previo](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) |

