# Matriz complementaria para la Tabla 4-6

Commit base 76655561d6632df42237d9a0c2da5d6eddf9d1ba; ejecución 2026-10-31T21:15:20.564Z. Categorías superpuestas: **no sumar** casos entre filas. El ensayo final contiene 29 casos únicos; los seis contratos de herramientas se contabilizan aparte. Todos los casos P* pertenecen a [production-sql.local.test.cjs](../../../../../tests/integration/production-sql.local.test.cjs).

| Categoría | Casos relacionados | Casos ejecutados en categoría | Resultado real | Tipo | Mocks o servicios | Limitaciones | Evidencia |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| Caso de uso de gamificación | P13, P14, P15, P23 | 4 | APROBADO en cierre final | Integración SQL con persistencia real | Sin repositorios mock; PostgreSQL real local, JWT SQL simulado | XP diario, concurrencia, suspensión e idempotencia; no invoca el caso de uso JavaScript. | [Prueba](../../../../../tests/integration/production-sql.local.test.cjs) / [TAP](integracion/ensayo-07-propietario.stdout.log) |
| Servicio público de gamificación | P08, P13, P14, P15, P23 | 5 | APROBADO en cierre final | Contrato y ejecución de RPC SQL real | Sin repositorios mock; PostgreSQL real local, JWT SQL simulado | No vuelve a ejecutar createGamificationService ni PostgREST HTTP. | [Prueba](../../../../../tests/integration/production-sql.local.test.cjs) / [TAP](integracion/ensayo-07-propietario.stdout.log) |
| Identidad del atleta | P04, P09, P20, P21 | 4 | APROBADO en cierre final | Integración SQL de identidad y roles | Sin repositorios mock; PostgreSQL real local, JWT SQL simulado | No prueba avatar, títulos ni toda la actualización de perfil. | [Prueba](../../../../../tests/integration/production-sql.local.test.cjs) / [TAP](integracion/ensayo-07-propietario.stdout.log) |
| Wallet y monedas | P16, P17, P18, P19 | 4 | APROBADO en cierre final | Integración SQL real | Sin repositorios mock; PostgreSQL real local, JWT SQL simulado | Saldo, gasto y propiedad; no prueba toda fuente de monedas. | [Prueba](../../../../../tests/integration/production-sql.local.test.cjs) / [TAP](integracion/ensayo-07-propietario.stdout.log) |
| Tienda cosmética | P15, P16, P17, P18 | 4 | APROBADO en cierre final | Integración SQL real | Sin repositorios mock; PostgreSQL real local, JWT SQL simulado | Compra/equipamiento/desbloqueo denegado; faltan éxitos de todos los tipos de desbloqueo. | [Prueba](../../../../../tests/integration/production-sql.local.test.cjs) / [TAP](integracion/ensayo-07-propietario.stdout.log) |
| Asistencia | Sin casos nuevos | 0 | NO EJECUTADO | No ejecutada en esta fase | No corresponde | Los triggers se crean, pero esto no equivale a registrar asistencia desde el producto. | [Antecedente](../20261030-151554-preparacion-produccion-28e48d2/INFORME_VERIFICACION_TECNICA.md) |
| Pagos | P10, P11, P12 | 3 | APROBADO en cierre final | Integración SQL real | Sin repositorios mock; PostgreSQL real local, JWT SQL simulado | Borrado/restauración UUID, roles, auditoría y retiro bigint; no prueba todos los cálculos de mensualidad. | [Prueba](../../../../../tests/integration/production-sql.local.test.cjs) / [TAP](integracion/ensayo-07-propietario.stdout.log) |
| Compilación del proyecto | Sin compilación nueva | 0 | NO EJECUTADO | No ejecutada en esta fase | No corresponde | Web/Android se conservan en expedientes anteriores con fechas y artefactos propios. | [Antecedente](../20261030-151554-preparacion-produccion-28e48d2/INFORME_VERIFICACION_TECNICA.md) |

## Verificaciones complementarias

- **Herramientas:** seis contratos node:test aprobados, tres del generador y tres del constructor de esquemas; fixtures de metadatos, sin servicio remoto. [TAP](unitarias/contratos-cierre.stdout.log); [generador](../../../../../tests/integration/production-sql-packet.test.cjs) y [esquema](../../../../../scripts/e2e/local/schema.test.cjs).
- **Seguridad SQL:** guards, RLS, ACL, search_path, transacciones y retorno en los 29 casos; [metadatos](seguridad/metadatos-locales-finales.json). No es auditoría de penetración completa.
- **Institucional:** lectura de catálogos, cero duplicados agregados observados y [avisos](seguridad/advisores-institucionales-finales.json) todavía pendientes. Sin login ni mutaciones.
- **Playwright y Android:** sin ejecuciones nuevas; [antecedente separado](../20261030-151554-preparacion-produccion-28e48d2/INFORME_VERIFICACION_TECNICA.md). No sustituir sus resultados por el ensayo SQL.
- **Producción:** aplicación bloqueada por gates operativos; no se publica ni se despliega. [Paquete](../../../../../database/security/production-proposal/README.md).

[Informe y fallos conservados](INFORME_VERIFICACION_TECNICA.md); [resultados calculados](RESULTADOS_AUTOMATIZADOS.json).
