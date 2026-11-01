# Matriz complementaria: preparación de respaldo cifrado

Base 2b4e9ebf0f114d15065e689199042054ce625b1d; inicio 2026-11-01T02:34:45.433Z. Esta fase verifica herramientas operativas. No añade casos funcionales a las ocho categorías de la Tabla 4-6 ni recontabiliza resultados anteriores.

| Categoría | Archivos funcionales ejecutados | Casos ejecutados | Resultado real | Tipo / mocks o servicios | Limitación / evidencia |
| --- | --- | ---: | --- | --- | --- |
| Caso de uso de gamificación | Ninguno en esta fase | 0 | NO EJECUTADO | No aplica | [Antecedente](../20261101-013050-edge-preparacion-27dd972/INFORME_VERIFICACION_TECNICA.md); no sumar pruebas de respaldo a esta categoría |
| Servicio público de gamificación | Ninguno en esta fase | 0 | NO EJECUTADO | No aplica | [Antecedente](../20261101-013050-edge-preparacion-27dd972/INFORME_VERIFICACION_TECNICA.md); no sumar pruebas de respaldo a esta categoría |
| Identidad del atleta | Ninguno en esta fase | 0 | NO EJECUTADO | No aplica | [Antecedente](../20261101-013050-edge-preparacion-27dd972/INFORME_VERIFICACION_TECNICA.md); no sumar pruebas de respaldo a esta categoría |
| Wallet y monedas | Ninguno en esta fase | 0 | NO EJECUTADO | No aplica | [Antecedente](../20261101-013050-edge-preparacion-27dd972/INFORME_VERIFICACION_TECNICA.md); no sumar pruebas de respaldo a esta categoría |
| Tienda cosmética | Ninguno en esta fase | 0 | NO EJECUTADO | No aplica | [Antecedente](../20261101-013050-edge-preparacion-27dd972/INFORME_VERIFICACION_TECNICA.md); no sumar pruebas de respaldo a esta categoría |
| Asistencia | Ninguno en esta fase | 0 | NO EJECUTADO | No aplica | [Antecedente](../20261101-013050-edge-preparacion-27dd972/INFORME_VERIFICACION_TECNICA.md); no sumar pruebas de respaldo a esta categoría |
| Pagos | Ninguno en esta fase | 0 | NO EJECUTADO | No aplica | [Antecedente](../20261101-013050-edge-preparacion-27dd972/INFORME_VERIFICACION_TECNICA.md); no sumar pruebas de respaldo a esta categoría |
| Compilación del proyecto | Ninguno en esta fase | 0 | NO EJECUTADO | No aplica | [Antecedente](../20261101-013050-edge-preparacion-27dd972/INFORME_VERIFICACION_TECNICA.md); no sumar pruebas de respaldo a esta categoría |

| Complementaria | Archivo | Casos ejecutados | Resultado | Tipo / dependencia | Limitación | Evidencia |
| --- | --- | ---: | --- | --- | --- | --- |
| Contratos de respaldo | tests/unit/production-backup.test.cjs | 10 | 10 aprobados | Node; configuración sintética, sin DB | No acredita acceso institucional | [TAP](unitarias/backup-final.stdout.log) |
| Exportación/cifrado/recuperación de clave | scripts/audit/production/test-encrypted-backup.cjs | 1 flujo con 8 controles | APROBADO | Integración real PG/GPG local; fixtures, sin mocks de repositorio | Inspección de archivo; no carga filas en destino | [JSON](integracion/backup-cifrado-entrega.json) |
| Transporte seguro | Helper SSLRequest/TLS privado | 1 | APROBADO | Red institucional real, sin autenticar | No acredita contraseña ni permisos de exportación | [TLS](seguridad/tls-verificado.json) |
| Asistente | scripts/audit/production/check-backup-tools.ps1 | 1 comprobación | APROBADO | Parser PowerShell y ejecutables reales | Contraseña aún no introducida | [Entorno](seguridad/entorno.json) |
| Playwright | Ninguno en esta fase | 0 | NO EJECUTADO | No aplica | No confundir el flujo de backup con E2E del producto | [Informe](INFORME_VERIFICACION_TECNICA.md) |
| Android | Ninguno en esta fase | 0 | NO EJECUTADO | No aplica | Sin compilación nativa nueva | Mismo informe |
| Seguridad RLS/dependencias | Ninguno en esta fase | 0 | NO EJECUTADO | No aplica | No se repitieron advisors o auditorías npm | Mismo informe |
| Backup institucional / restore aislado | Asistente pendiente de entrada local | 0 | BLOQUEADO / NO EJECUTADO respectivamente | No se inició autenticación PostgreSQL | No existe copia institucional comprobada | [Estado](RESULTADOS_AUTOMATIZADOS.json) |

