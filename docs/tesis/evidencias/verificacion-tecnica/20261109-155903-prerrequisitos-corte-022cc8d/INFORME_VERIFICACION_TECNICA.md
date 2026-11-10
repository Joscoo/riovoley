# Continuación de preparación: lectura institucional

RIOVOLEY, commit 022cc8d559eff2ba7d25c2227ea830bcf873cb30, contexto 2026-11-09T15:59:03.300Z UTC, Windows 10.0.26300, Node v24.18.0. Las consultas MCP previas al contexto se guardaron mediante proyección de campos técnicos; no se guardaron respuestas completas de cuentas. [Contexto](CONTEXTO.json), [metadatos](seguridad/metadatos-mcp-actuales.json).

Se ejecutaron comandos CLI de lectura y peticiones GET/OPTIONS sin autenticación. No hubo inicio de sesión institucional, POST funcionales, solicitudes de claves ni aplicación de SQL/despliegues. Las consultas de catálogo utilizaron BEGIN READ ONLY. El hash del catálogo cubre definiciones, políticas y ACL seleccionadas; no valida datos de negocio. [Consulta exacta](seguridad/catalog-fingerprint.sql), [comandos](COMANDOS.json).

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| CT-01 | Preflight HTTPS Edge Cloud | 9 | 9 | 0 | 0 | APROBADO dentro de alcance CORS | [OPTIONS](seguridad/edge-options-cloud.json) |
| CT-02 | GET público, sin ejecutar JavaScript | 4 | 4 | 0 | 0 | APROBADO HTTP | [GET](seguridad/https-publico-actual.json) |
| CT-03 | Consulta de respaldos gestionados | Sin denominador funcional | — | — | — | Consulta exitosa; recuperación BLOQUEADA | [CLI](seguridad/respaldos-administrados.meta.json), [datos](seguridad/respaldos-administrados.json) |
| CT-04 | Catálogo, RLS y avisos | Metadatos; no casos funcionales | — | — | — | Observado; avisos PENDIENTES | [Catálogo](seguridad/catalogo-liberacion-actual.json), [MCP](seguridad/metadatos-mcp-actuales.json) |
| CT-05 | Cuatro SQL y candidato de 39 archivos | Comparaciones SHA; no tests funcionales | — | — | — | Hashes comprobados | [Artefactos](seguridad/artefactos-y-candidato.json) |
| CT-06 | Jest/build del commit base, ejecutados antes de esta fase | 434 Jest / 91 suites | 434 | 0 | 0 | APROBADO, antecedente separado | [Recibo](integracion/ci-commit-base.json) |
| CT-07 | Nuevos Jest, Playwright, Android y builds | 0 | 0 | 0 | 0 | NO EJECUTADO aquí | [Antecedentes](../20261109-152730-edge-fence-f0b89f4/INFORME_VERIFICACION_TECNICA.md) |

Las respuestas OPTIONS acreditan disponibilidad del preflight HTTPS y los encabezados de origen/cabeceras ensayados; el gateway puede responder antes del handler. No validan JWT, roles, métodos efectivos, entregas, scheduler ni persistencia. GET200 no valida navegación SPA ejecutada. No sumar ambos denominadores con las 434 pruebas previas o los 57 controles locales anteriores.

El catálogo mantiene 15b9d9e869fb5113263c485714009878; xp_ledger y login_rewards tienen RLS habilitado, no forzado, una política cada tabla. La RPC public.claim_daily_login_reward() sigue ausente. Los agregados de privilegios inspeccionados valen cero faltantes; no equivalen a una auditoría de todos los permisos o predicados.

Supabase conserva PostgreSQL 17.4.1.064 y estado ACTIVE_HEALTHY. Los seis grupos de avisos tienen conteos 19, 1, 17, 19, 1, 1; se superponen y no deben sumarse como vulnerabilidades únicas. [function_search_path_mutable](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable); [extension_in_public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public); [anon_security_definer_function_executable](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable); [authenticated_security_definer_function_executable](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable); [auth_leaked_password_protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); [vulnerable_postgres_version](https://supabase.com/docs/guides/platform/upgrading). No se corrigieron configuración Auth, extensión, permisos ni versión del motor.

Vercel observa el deployment dpl_DCPpv18kuroRoaEpV49xhGfY1isB, READY, commit e469db5608fb77071b6a9ee3db253c28dae734dd, rama main. Es distinto del candidato local; Node del proyecto 22.x. No se atribuyen al despliegue los resultados de la rama de auditoría.

La CLI terminó con código 0, pero backups es nulo, los metadatos físicos están vacíos y PITR está desactivado. No se estableció un punto gestionado recuperable. La copia lógica cifrada del 2026-11-01T02:58:51.738Z conserva su hash, con 205.01 horas de antigüedad al comprobarse; no se abrió ni restauró nuevamente. Eso no acredita vigencia al corte. [Respaldo lógico](seguridad/respaldo-logico-existente.json).

Se verificaron los cuatro SQL originales y las 39 copias del candidato corregido sin cambios. La preparación de evidencias conservó dos errores del lector: un campo JSON incorrecto y una ruta incompleta del retorno. Ambos se corrigieron a partir de la estructura observada, preservando el [incidente](seguridad/incidencia-lectura-manifiesto.json) y los registros del [primer intento](seguridad/artefactos-lectura.meta.json); el intento posterior terminó con código cero. No fueron fallos de flujos de negocio ni cambios institucionales. La ventana propuesta del 7 de noviembre ya caducó. Siguen pendientes respaldo vigente/restauración al corte, cobertura gestionada y control de escritores/clientes, además de calendario y aprobación específica. Proveedores/credenciales permanecen excluidos. No es una auditoría de penetración completa.

[Paquete actual](PAQUETE_ACTUAL_Y_PENDIENTES.md), [matriz](MATRIZ_VERIFICACIONES_TESIS.md), [texto académico](RESULTADOS_PARA_TESIS_4_5.md), [integridad](INTEGRIDAD.json), [privacidad](PRIVACIDAD.json), [sello](MANIFIESTO_SHA256.json).
