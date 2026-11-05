# Matriz de trazabilidad de la revisión institucional

| Categoría Tabla4-6 | Ejecución nueva de casos funcionales | Resultado y alcance actual | Evidencia |
|---|---:|---|---|
| Caso de uso de gamificación | 0 | NO EJECUTADO; lectura de RPC diaria ausente y RLS, sin invocar recompensa | [Catálogo](seguridad/supabase-catalogo-actual.json) |
| Servicio público de gamificación | 0 | NO EJECUTADO; no se convierte una consulta de catálogo en integración del servicio | Catálogo |
| Identidad del atleta | 0 | NO EJECUTADO; no se consultaron filas personales | [Alcance](CONTEXTO.json) |
| Wallet y monedas | 0 | NO EJECUTADO; no se alteraron saldos | Alcance |
| Tienda cosmética | 0 | NO EJECUTADO; no se hicieron compras/equipamientos | Alcance |
| Asistencia | 0 | NO EJECUTADO; sin registros reales modificados | Alcance |
| Pagos | 0 | NO EJECUTADO; sin registros reales modificados | Alcance |
| Compilación del proyecto | 0 | NO EJECUTADO; se leyó CI existente del candidato y se verificó hash del APK existente | [CI](integracion/ci-candidato-verificado.json), [APK](android/apk-existente-verificado.json) |

Las suites relacionadas, archivos y casos de las ocho categorías están en la [matriz del candidato previo](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md). Sus 434 casos Jest con mocks/memoria y 14 casos nativos con servicios locales reales conservan ese alcance; no se contabilizan de nuevo.

Complementos nuevos: consultas MCP de metadatos/catálogos en producción solo lectura, comparación de 4 SQL, 9 hashes Edge de metadatos, 39 archivos del candidato y 51 de retorno, 4 GET públicos sin JavaScript y hash del ciphertext de respaldo. Ninguno sustituye un E2E autenticado institucional, una compilación nativa o una auditoría de penetración. [Informe](INFORME_VERIFICACION_TECNICA.md).

