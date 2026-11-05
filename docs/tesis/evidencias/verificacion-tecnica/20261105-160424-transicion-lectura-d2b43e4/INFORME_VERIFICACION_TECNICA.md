# Revisión de transición institucional por lectura

RIOVOLEY, commit base d2b43e466e2b727f4fa9824a72326a0d05aa5c95. Inicialización 2026-11-05T16:04:24.150Z UTC. Algunas consultas MCP preceden a la asignación del expediente dentro de este mismo turno; se conservan sus horas originales. Supabase y Vercel MCP respondieron sobre el proyecto y cuenta correctos, sin recurrir a valores de claves. El usuario confirmó ser responsable y delegó la propuesta de ventana; no autorizó ejecutar cambios. [Contexto](CONTEXTO.json), [consultas MCP](seguridad/consultas-mcp.json), [consulta adicional de permisos](seguridad/consulta-permisos.meta.json).

## Alcance, método y herramientas

Se efectuaron consultas de catálogo en transacciones READ ONLY, lectura de avisos/revisiones y metadatos de hosting, GET públicos sin JavaScript y comprobaciones SHA-256 de archivos locales. Windows, Node v24.18.0; el entorno previo del candidato y sus ejecuciones conserva sus propios registros. No hubo nueva compilación, suite Jest/Playwright/Android, descarga de bytes Edge, descifrado/restauración, envíos, login institucional o escrituras de negocio. No se cambió SQL, Auth, RLS, permisos, versión PostgreSQL o despliegues.

Los tres comandos de comprobación locales y sus códigos se registran en [COMANDOS.json](COMANDOS.json). Los MCP no son procesos del sistema: sus recibos registran toolIsError y horas, con código de salida OS no aplicable. Para reproducir, seleccionar las cuentas con acceso al proyecto confirmado y usar los SQL [catálogo](seguridad/consulta-catalogo.sql), [huella](seguridad/consulta-huella.sql) y [permisos](seguridad/consulta-permisos.sql). Las sentencias BEGIN READ ONLY/ROLLBACK no aplican cambios persistentes. [scripts/audit/production/read-public-transition.cjs](../../../../../scripts/audit/production/read-public-transition.cjs), [scripts/audit/production/verify-transition-artifacts.cjs](../../../../../scripts/audit/production/verify-transition-artifacts.cjs) y [scripts/audit/production/verify-transition-return.cjs](../../../../../scripts/audit/production/verify-transition-return.cjs) conservan el procedimiento local sin consultar secretos.

## Resultados reales de esta revisión

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| DB | Catálogo, RLS, precondiciones y huella READ ONLY | — | — | — | — | Coincide con origen; cambio pendiente | [Catálogo](seguridad/supabase-catalogo-actual.json), [permisos](seguridad/rls-permisos-actuales.json) |
| SQL | Integridad de cuatro propuestas | — | — | — | — | APROBADO: 4 hashes coincidentes | [Artefactos](seguridad/artefactos-sql-edge-verificados.json) |
| EDGE | Nueve revisiones/hashes de metadatos y 39 archivos del candidato | — | — | — | — | APROBADO dentro del alcance de comparación | Artefactos; [metadatos Cloud](seguridad/edge-hashes-metadatos-actuales.json) |
| RET | Integridad de 51 fuentes privadas de retorno | — | — | — | — | APROBADO; sin retorno gestionado | [Resultado](seguridad/retorno-edge-archivos-verificados.json) |
| HTTP | Cuatro GET públicos, tres raíces SPA y manifest | — | — | — | — | APROBADO: 4 HTTP200 | [Resultados](seguridad/https-publico-actual.json) |
| HOST | Identidad de proyecto/deployment | — | — | — | — | READY; commit productivo anterior | [Vercel](seguridad/vercel-actual.json) |
| BAK | Hash actual del ciphertext SQL y recibos previos | — | — | — | — | Integridad comprobada; vigencia al corte pendiente | [Recibos](seguridad/respaldos-recibos-actuales.json) |
| ADV | Asesores institucionales | — | — | — | — | EJECUTADO; avisos abiertos | [Avisos](seguridad/supabase-avisos-actuales.json) |
| UNIT/E2E/BUILD | Nuevas ejecuciones funcionales o compilaciones en esta fase | 0 | 0 | 0 | 0 | NO EJECUTADO | Antecedentes referidos por SHA, no resultados nuevos |
| REL | Aplicación SQL/Edge y promoción institucional | 0 | 0 | 0 | 0 | NO EJECUTADO | [Paquete propuesto](PAQUETE_TRANSICION_PROPUESTO.md) |

Las filas de metadatos/hash/HTTP son procedimientos y observaciones, no suites de casos funcionales; por ello no se asignan denominadores ficticios. La lectura de un CI existente no constituye otra ejecución. [CI del candidato](integracion/ci-candidato-verificado.json) refiere 434/434 Jest en 91 suites y build, ya documentados; el [APK verificado](android/apk-existente-verificado.json) refiere el artefacto cuyo expediente anterior ejecutó 14/14 casos nativos. No se trasladan esos resultados a esta fase ni a producción.

## Catálogo, RLS y permisos

La huella 15b9d9e869fb5113263c485714009878 coincide con el origen de las propuestas. Los cuatro contadores agregados son cero: identidades duplicadas de estudiante, XP diario duplicado, referencias nulas de XP diario y roles no canónicos. Eso no prueba identidad del contenido de toda la base ni ausencia de otros defectos. El catálogo confirma que public.claim_daily_login_reward() no existe: no promover el cliente que requiere esa RPC antes de completar y verificar el cambio SQL compatible.

RLS está habilitado en gamification.xp_ledger y gamification.login_rewards; cada tabla mantiene una política ALL para authenticated con expresión de propietario y FORCE=false. Sus expresiones no se clasifican como true constante; contienen auth.uid, lo cual por sí solo no prueba corrección semántica. Las dos vistas públicas observadas usan security_invoker=true. Los grants de las vistas y de tablas base se conservan por separado: no equivalen a operaciones efectivas bajo RLS, y no se intentaron escrituras. [Detalle](seguridad/rls-permisos-actuales.json). La [documentación de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security) explica que estas vistas aplican RLS de las tablas subyacentes.

## Avisos de seguridad actuales

| Categoría | Hallazgos informados | Nivel | Referencia |
|---|---:|---|---|
| function_search_path_mutable | 19 | WARN | [Referencia oficial](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable) |
| extension_in_public | 1 | WARN | [Referencia oficial](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public) |
| anon_security_definer_function_executable | 17 | WARN | [Referencia oficial](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) |
| authenticated_security_definer_function_executable | 19 | WARN | [Referencia oficial](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) |
| auth_leaked_password_protection | 1 | WARN | [Referencia oficial](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) |
| vulnerable_postgres_version | 1 | WARN | [Referencia oficial](https://supabase.com/docs/guides/platform/upgrading) |

Hay seis categorías. Los recuentos se superponen entre funciones/roles y no se presentan como vulnerabilidades únicas ni explotabilidad demostrada. No se aplicaron remedios automáticos. pg_net0.14.0 está en public y no es relocatable; no proponer su traslado mediante SET SCHEMA como corrección ejecutable inmediata. [PostgreSQL17](https://www.postgresql.org/docs/17/sql-alterextension.html) requiere que la extensión sea reubicable para ese comando. Los cambios de extensión, PostgreSQL y configuración Auth requieren alcance y aprobación separados del paquete propuesto.

## Hosting, artefactos y respaldo

El deployment productivo dpl_DCPpv18kuroRoaEpV49xhGfY1isB sigue READY, con commit e469db5608fb77071b6a9ee3db253c28dae734dd de main, creado 2026-10-28T20:49:50.217Z. Cuatro GET devolvieron HTTP200 sin ejecutar JavaScript o autenticarse; esto no valida roles, flujos o integraciones. Se observó HSTS; no se observaron X-Content-Type-Options, X-Frame-Options, Referrer-Policy ni CSP en esas respuestas. Las tres primeras cabeceras están preparadas en vercel.json, no publicadas. No se infiere de ello una prueba de penetración completa.

El ajuste de proyecto Vercel es Node22.x; el candidato fija engines.node=24.x. La [documentación de Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) establece prioridad de engines sobre el ajuste del proyecto. La versión efectiva del próximo build debe registrarse; el metadato no acredita ese build futuro. No se modificó la configuración del proyecto.

Se comprobaron 4 hashes SQL, 9 hashes de metadatos Edge, 39 archivos privados del candidato y 51 de retorno. Los 28 TS del candidato coinciden con el repositorio al normalizar CRLF, no necesariamente byte a byte antes de normalizar. No se descargó ni desplegó código Cloud en esta fase. El hash del APK existente coincide con su recibo; es debug, no release firmado.

El archivo SQL cifrado conserva el hash de su recibo y mide 1418439 bytes. Fue creado 2026-11-01T02:58:51.738Z; tenía 109.22 horas en la consulta de integridad. No se desbloqueó ni se generó otro respaldo. Los recibos previos de Storage registran 43 objetos y 3596269 bytes recuperados como bytes, sin restauración gestionada por Storage API. La restauración SQL anterior verificó 94 tablas, 27159 filas y 11 secuencias; es un antecedente del 1 de noviembre, no una ejecución nueva. [Alcance y fechas](seguridad/respaldos-recibos-actuales.json).

## Decisión y pendientes

Responsable confirmado y reserva propuesta de 90 minutos se registran sin datos personales. La ficha no autoriza cambios. El alcance planificado es web/SQL/Edge; Android continúa en desarrollo/pruebas y no se distribuye. Permanecen pendientes calendario institucional, respaldo vigente al corte, control efectivo de escrituras/clientes anteriores, criterios de aceptación de integraciones excluidas y autorización específica del paquete. El candidato no se declara listo para ejecutar ni funcionando en producción. No se deducen resultados de usabilidad, motivación, USE o UES-SF.

El [paquete propuesto](PAQUETE_TRANSICION_PROPUESTO.md) identifica destinos, hashes, orden, huellas de guardas y retorno. Los tres documentos se generan con [scripts/audit/production/report-transition-review.cjs](../../../../../scripts/audit/production/report-transition-review.cjs); [integridad](INTEGRIDAD.json), [privacidad](PRIVACIDAD.json) y [manifiesto](MANIFIESTO_SHA256.json) conservan la evidencia. El CI del commit posterior al sellado se comprueba aparte, sin editar este expediente.

