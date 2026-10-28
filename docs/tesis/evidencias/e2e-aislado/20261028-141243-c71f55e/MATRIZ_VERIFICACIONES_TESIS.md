# Matriz complementaria de verificaciones: entorno E2E local

La [matriz inicial](../../verificacion-tecnica/20261027-212222-c71f55e/MATRIZ_VERIFICACIONES_TESIS.md) conserva los resultados unitarios de la Tabla 4-6. Esta etapa no vuelve a contar esas suites: documenta qué evidencia nueva aporta el backend local real.

| Categoría de Tabla 4-6 | Archivo/procedimiento relacionado | Ejecución y resultado nuevo | Tipo / mocks | Limitación | Evidencia |
|---|---|---|---|---|---|
| 1. Caso de uso de gamificación | Login de atleta + consulta de xp_ledger/login_rewards | 1 movimiento diario, 8 XP, 0 grupos diarios duplicados | Navegador/API/SQL reales locales; fixtures, sin repositorio mock | No reejecuta la suite del motor ni todos los cálculos XP | [persistencia-local.json](persistencia-local.json) |
| 2. Servicio público de gamificación | Flujo real de login local del atleta | Persistencia diaria observada; sin denominador nuevo de tests de fachada | Servicio de aplicación y backend locales reales | No equivale a endpoint anónimo ni certifica todos los métodos exportados | [persistencia-local.json](persistencia-local.json); [pendientes-estable/resultados.json](pendientes-estable/resultados.json) |
| 3. Identidad del atleta | roles.panels-navigation.smoke.spec.js y roles.modules-navigation.spec.js | Navegación de estudiante aprobada en siete perfiles en cada caso | Playwright con Auth/PostgreSQL locales | Sin edición/persistencia de avatar o título comprobada en esta etapa | [casos-e2e-detallados.json](casos-e2e-detallados.json) |
| 4. Wallet y monedas | Navegación de módulo de gamificación | Panel recorrido; transacciones de wallet no ejecutadas | Backend local real | El seed/catálogo no valida débitos, créditos ni integridad de saldo | [pendientes-estable/resultados.json](pendientes-estable/resultados.json) |
| 5. Tienda cosmética | Catálogos y navegación existentes | Compras/equipamiento NO EJECUTADOS en esta etapa | Sin compra real ni mock de compra nuevo | Mantener resultados unitarios iniciales y preparar un flujo transaccional propio | [INFORME_VERIFICACION_TECNICA.md](INFORME_VERIFICACION_TECNICA.md) |
| 6. Asistencia | filtros de tablas, revisión guiada y happy path | Filtros: 7/7; revisión guiada: 0/7; happy path: 0/7 | Playwright contra backend local | Registrar asistencia por UI no acreditado; seed no cuenta como prueba funcional | [resumen-e2e-local.json](resumen-e2e-local.json) |
| 7. Pagos | filtros de tablas y happy path | Filtros: 4/7, con 3 fallos móviles; happy path: 0/7 | Playwright contra backend local | Sin registro UI de pago demostrado por la cadena fallida | [resumen-e2e-local.json](resumen-e2e-local.json) |
| 8. Compilación del proyecto | build.cjs / CRA | Dos compilaciones con salida 0; final 125.567 s | Compilador real; variables locales explícitas | Sin Android ni garantía funcional de módulos | [compilacion-web-build-1793197434387.meta.json](compilacion-web-build-1793197434387.meta.json) |

Los casos reutilizados entre categorías no se suman. Los resultados E2E nuevos son **112 instancias = 95 aprobadas + 17 fallidas**, con cero omisiones. El smoke inicial de 3 casos ya está representado por casos posteriores y se informa como antecedente de arranque.

## Complementos

- Auth y consulta por rol: 3/3 verificaciones reales, [auth-roles-reales.json](auth-roles-reales.json).
- Matriz RLS: un script real local, salida 0 y ROLLBACK; [database/tests/rls_access_matrix.sql](../../../../../database/tests/rls_access_matrix.sql), [rls-matriz-local.meta.json](rls-matriz-local.meta.json).
- Idempotencia: conteos sin duplicados al repetir seed, [seed-idempotencia.json](seed-idempotencia.json).
- Arnés: 12 pruebas node:test aprobadas; no se suman a E2E ni a Jest del producto, [arnes-final.stdout.log](arnes-final.stdout.log).
- Android y entrega externa de correo/push: no ejecutados en esta etapa.
- Seguridad de producción: sin correcciones; la copia de estructura no certifica ni modifica sus permisos actuales.

## Instancias por archivo y caso

| Archivo y caso | Ejecutadas | Aprobadas | Fallidas | Omitidas |
|---|---:|---:|---:|---:|
| admin.modules-navigation.spec.js: admin: every module opens without a JavaScript crash | 7 | 7 | 0 | 0 |
| admin.provisioning-notifications.smoke.spec.js: admin smoke: provisioning + notifications entrypoints | 7 | 7 | 0 | 0 |
| asistencias.guided.review.spec.js: guided review: admin asistencias quick mode per viewport | 7 | 0 | 7 | 0 |
| filters-sorting.phase2-lists.spec.js: phase2 athletes tab: filtros y orden con reset consistente | 7 | 7 | 0 | 0 |
| filters-sorting.phase2-lists.spec.js: phase2 schedules: filtros y orden con limpiar filtros | 7 | 7 | 0 | 0 |
| filters-sorting.physical-tests.spec.js: physical-tests: filtros + orden + limpiar filtros | 7 | 7 | 0 | 0 |
| filters-sorting.tables.spec.js: pagos: filtros base + orden de columnas por header | 7 | 4 | 3 | 0 |
| filters-sorting.tables.spec.js: asistencias: filtros del historial + orden por columnas | 7 | 7 | 0 | 0 |
| filters-sorting.user-management.spec.js: user-management tabs: filtros y orden se actualizan y resetean por tab | 7 | 7 | 0 | 0 |
| responsive.smoke.spec.js: role dashboards responsive guard (optional env credentials) | 7 | 7 | 0 | 0 |
| roles.modules-navigation.spec.js: trainer: every module renders without a JavaScript crash | 7 | 7 | 0 | 0 |
| roles.modules-navigation.spec.js: student: every module renders without a JavaScript crash | 7 | 7 | 0 | 0 |
| roles.panels-navigation.smoke.spec.js: role panel smoke: admin | 7 | 7 | 0 | 0 |
| roles.panels-navigation.smoke.spec.js: role panel smoke: trainer | 7 | 7 | 0 | 0 |
| roles.panels-navigation.smoke.spec.js: role panel smoke: student | 7 | 7 | 0 | 0 |
| admin.happy-path-controlled.spec.js: admin happy path controlado: atleta + pago + asistencia | 7 | 0 | 7 | 0 |

