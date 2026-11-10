# Matriz de trazabilidad

La nueva ejecución valida compatibilidad de catálogo y una barrera sintética. No valida nuevamente los módulos de la Tabla 4-6. Los archivos y casos funcionales anteriores se conservan en su [matriz de origen](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md).

| Categoría | Archivos de prueba relacionados | Casos nuevos de la categoría | Resultado | Tipo / mocks o servicios | Límite / evidencia |
|---|---|---|---|---|---|
| Caso de uso de gamificación | [Archivos por categoría en la matriz previa](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO | No se invocó la funcionalidad | El ensayo SQL no demuestra este caso de negocio; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Servicio público de gamificación | [Archivos por categoría en la matriz previa](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO | No se invocó la funcionalidad | El ensayo SQL no demuestra este caso de negocio; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Identidad del atleta | [Archivos por categoría en la matriz previa](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO | No se invocó la funcionalidad | El ensayo SQL no demuestra este caso de negocio; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Wallet y monedas | [Archivos por categoría en la matriz previa](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO | No se invocó la funcionalidad | El ensayo SQL no demuestra este caso de negocio; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Tienda cosmética | [Archivos por categoría en la matriz previa](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO | No se invocó la funcionalidad | El ensayo SQL no demuestra este caso de negocio; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Asistencia | [Archivos por categoría en la matriz previa](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO | No se invocó la funcionalidad | El ensayo SQL no demuestra este caso de negocio; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Pagos | [Archivos por categoría en la matriz previa](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO | No se invocó la funcionalidad | El ensayo SQL no demuestra este caso de negocio; [informe](INFORME_VERIFICACION_TECNICA.md) |
| Compilación del proyecto | [Archivos por categoría en la matriz previa](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO | No se invocó la funcionalidad | El ensayo SQL no demuestra este caso de negocio; [informe](INFORME_VERIFICACION_TECNICA.md) |

| Complemento | Archivo / control | Casos | Resultado real | Dependencias y límites | Evidencia |
|---|---|---|---|---|---|
| Integración SQL final | packet-rehearse.cjs | 22 controles | 22 aprobados, 0 fallidos | PostgreSQL real, sin mocks; 68 filas sintéticas, no institucionales | [Resultado](integracion/resultado-final-1794234721835-e3a110.json) |
| Intentos previos | Mismo runner | 20 y 18, por separado | 19/20 y 17/18; fallos conservados y corregidos | No sumar con la repetición final | [Primer registro](integracion/ensayo-paquete.stdout.log), [segundo](integracion/ensayo-paquete-final.stdout.log) |
| Seguridad de guardas | Incluida dentro de 22 controles | Subconjunto, no denominador adicional | Se rechazan alteración, inventario incompleto y orden incorrecto | Sin pruebas gestionadas de denegación HTTP o entrega externa | [Paquete](PAQUETE_LOCAL_REVISABLE.md) |
| Playwright / Android / builds | No ejecutado aquí | 0 | NO EJECUTADO | Resultados históricos no trasladados a producción | [Antecedente](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) |

