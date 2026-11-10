# Matriz complementaria — Android nativo

| Categoría Tabla 4-6 | Casos ejecutados aquí | Tipo y dependencias | Limitaciones | Evidencia |
|---|---|---|---|---|
| 1. Caso de uso de gamificación | N-student-recompensa: 1, incluido en 13 | Integración nativa con PostgreSQL local real; una recompensa diaria de 8 XP | No comprueba todos los retos, logros o concurrencia | [Casos/alcance](android/candidato-actual.json) |
| 2. Servicio público de gamificación | 0 casos unitarios nuevos de fachada | La RPC diaria local se usa dentro de los 13; no equivale a probar toda la fachada | Sin nueva ejecución de unitarias de servicio | [Casos/alcance](android/candidato-actual.json) |
| 3. Identidad del atleta | 0 casos nuevos de identidad visual/títulos | Los accesos del atleta no prueban identidad cosmética | DiceBear remoto bloqueado | [Casos/alcance](android/candidato-actual.json) |
| 4. Wallet y monedas | 0 casos nuevos | Antecedentes separados | Sin nuevas transacciones de monedas | [Casos/alcance](android/candidato-actual.json) |
| 5. Tienda cosmética | 0 casos nuevos | Antecedentes separados | Sin compras/equipamiento nativos nuevos | [Casos/alcance](android/candidato-actual.json) |
| 6. Asistencia | 0 casos nuevos | Antecedentes separados | Sin nuevas asistencias desde Android | [Casos/alcance](android/candidato-actual.json) |
| 7. Pagos | 0 casos nuevos | Antecedentes separados | Sin nuevos pagos desde Android | [Casos/alcance](android/candidato-actual.json) |
| 8. Compilación del proyecto | 0 nuevas compilaciones; 1 caso de binding de APK, incluido en 13 | Inspección real de archivo y hash instalado | Build original referenciado; no compilación repetida | [Casos/alcance](android/candidato-actual.json) |

Archivos relacionados: scripts/audit/android/authenticated-webview.cjs (los 13 casos), scripts/audit/android/launch-local-candidate.cjs (preparación), tests/unit/android-offline-routes.test.cjs (10 guardas sintéticas) y scripts/audit/production/smoke-signed-android-offline.cjs (flujo release independiente). Las filas que mencionan un caso incluido en 13 no representan casos adicionales.

| Complemento | Resultado real | Mocks o servicios | Evidencia |
|---|---|---|---|
| AndroidWebView | 13/13 aprobados, 0 fallidos/omitidos | Auth/REST/PostgreSQL locales reales, sin mocks | [android/candidato-actual.json](android/candidato-actual.json) |
| Parser de rutas | 10/10 aprobados; RED anterior 10 fallos conservados | Entradas de rutas, sin servicio o dispositivo en esta suite | [unitarias/rutas-aislamiento-verde.stdout.log](unitarias/rutas-aislamiento-verde.stdout.log) |
| Persistencia posterior | Una recompensa, un ledger, 8 XP | PostgreSQL local real READ ONLY | [integracion/recompensa-despues-de-parada.json](integracion/recompensa-despues-de-parada.json) |
| Release offline | APROBADO dentro de su alcance offline | APK firmado real; sin login/backend institucional | [android/release-smoke-offline.json](android/release-smoke-offline.json) |
| Playwright de navegador | No repetido; AndroidWebView usa otro entorno y denominador | Antecedentes de navegador separados | [../20261104-201230-continuacion-produccion-d9cdfb7/MATRIZ_VERIFICACIONES_TESIS.md](../20261104-201230-continuacion-produccion-d9cdfb7/MATRIZ_VERIFICACIONES_TESIS.md) |
| Seguridad Cloud | Sin nueva auditoría de políticas o proveedores | Antecedentes de solo lectura separados | [../20261104-201230-continuacion-produccion-d9cdfb7/INFORME_VERIFICACION_TECNICA.md](../20261104-201230-continuacion-produccion-d9cdfb7/INFORME_VERIFICACION_TECNICA.md) |

La [matriz general anterior](../20261102-002437-proveedores-movil-7eee99c/MATRIZ_VERIFICACIONES_TESIS.md) identifica las pruebas unitarias de las ocho categorías y sus límites; estos resultados nativos no amplían implícitamente esos denominadores.
