# Continuación de preparación de producción — 4 de noviembre de 2026

## Identificación y alcance

RIOVOLEY, commit base d9cdfb7a91ff5971e138ac4abd751dd76d7a080a, rama fix/seguridad-local-20261029. Inicio 2026-11-04T20:12:30.124Z; corte 2026-11-04T20:24:05.230Z (UTC; Ecuador UTC−5). Se retomó la revisión autorizada de solo lectura y el pendiente Android. No se solicitaron claves ni se aplicaron migraciones ni se cambiaron permisos ni se publicaron clientes. Los resultados anteriores se referencian con su propio commit y no se presentan como ejecuciones nuevas. [Contexto](CONTEXTO.json), [herramientas y accesos](HERRAMIENTAS_Y_ALCANCE.json).

Windows, Node v24.18.0, npm 11.16.0. El MCP Supabase respondió correctamente. El conector Vercel devolvió LINK_ID_REQUIRED y se utilizó su CLI ya autenticada, solo GET y metadatos sin descifrar valores. Se conservaron los argumentos y códigos disponibles en [COMANDOS.json](COMANDOS.json) y los procedimientos MCP en [consultas-mcp.json](seguridad/consultas-mcp.json).

## Metodología y resultados

APROBADO se limita al procedimiento ejecutado; BLOQUEADO identifica una precondición impedida; NO EJECUTADO conserva una verificación sin ejecución nueva. Los catálogos, hashes, avisos y respuestas HTTP no son casos funcionales. No se suman recuentos de avisos superpuestos ni dependencias de árboles diferentes.

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| S01 | Consulta READ ONLY de huella y precondiciones SQL | — | — | — | — | APROBADO en comparación; sin aplicar SQL | [Metadatos](seguridad/metadatos-mcp-actuales.json), [comparación](seguridad/compatibilidad-paquete-actual.json) |
| S02 | Cuatro archivos SQL comparados con evidencia sellada | — | — | — | — | APROBADO: 4 coinciden | [Hashes](seguridad/sql-cuatro-archivos-revalidados.json) |
| S03 | Nueve bundles Cloud comparados | — | — | — | — | APROBADO: 9 hashes coinciden, 9 revisiones distintas | [Edge](seguridad/edge-bundles-actuales.json) |
| S04 | Asesores institucionales de seguridad | — | — | — | — | EJECUTADO; alertas pendientes | [Metadatos](seguridad/metadatos-mcp-actuales.json) |
| S05 | npm audit raíz | — | — | — | — | APROBADO: 0 avisos / 1439 dependencias | [JSON](seguridad/npm-audit-actual-raiz.stdout.log) |
| S06 | npm audit functions | — | — | — | — | APROBADO: 0 avisos / 330 dependencias | [JSON](seguridad/npm-audit-actual-functions.stdout.log) |
| S07 | npm audit auxiliar | — | — | — | — | APROBADO: 0 avisos / 101 dependencias | [JSON](seguridad/npm-audit-actual-auxiliar.stdout.log) |
| H01 | Cuatro GET públicos HTTPS | — | — | — | — | APROBADO: 4 respuestas 200; no prueba de navegador | [HTTP](seguridad/despliegue-publico.json) |
| A01 | Integridad del APK debug pendiente | — | — | — | — | APROBADO: bytes y hash conservados | [Artefacto](android/artefacto-pendiente-verificado.json) |
| A02 | Nuevas verificaciones WebView Android | 0 | 0 | 0 | 0 | BLOQUEADO: memoria y Docker | [Precondiciones](android/precondiciones-recursos.json) |
| U01 | Jest/Testing Library actuales | 0 | 0 | 0 | 0 | NO EJECUTADO en esta fase | [Antecedente](../20261102-002437-proveedores-movil-7eee99c/INFORME_VERIFICACION_TECNICA.md) |
| I01 | Integración SQL, Auth o proveedores nueva | 0 | 0 | 0 | 0 | NO EJECUTADO; solo lecturas agregadas Cloud | [Consultas](seguridad/consultas-mcp.json) |
| E01 | Playwright de navegador nuevo | 0 | 0 | 0 | 0 | NO EJECUTADO | [Antecedente](../20261102-002437-proveedores-movil-7eee99c/INFORME_VERIFICACION_TECNICA.md) |
| W01 | Nueva compilación web o nativa | — | — | — | — | NO EJECUTADA; se verificó el APK existente | [Artefacto](android/artefacto-pendiente-verificado.json) |

## Contraste del paquete SQL/Edge

La huella actual de catálogo **15b9d9e869fb5113263c485714009878** coincide con el estado original esperado por la propuesta. Las consultas agregadas registran cero grupos de identidades de atleta duplicadas, cero grupos de XP diario duplicado, cero referencias diarias nulas y cero roles fuera de la lista canónica consultada. Las cuatro fuentes SQL conservan los hashes publicados, incluidos avance/retorno principal y complemento de reportes. No se alteraron huellas, guardas o expectativas para forzar coincidencias. [Consulta exacta de huella](seguridad/fuente-consulta-huella.sql), [precondiciones](seguridad/consulta-precondiciones.sql), [cuatro archivos](seguridad/sql-cuatro-archivos-revalidados.json).

Las nueve revisiones administrativas de Edge difieren en una unidad respecto al inventario anterior; sus nueve hashes de bundle **siguen coincidiendo** con los capturados para el retorno. Los indicadores verify_jwt también coinciden. La revisión administrativa por sí sola no demuestra un cambio de código. Esta comparación no verifica los valores de configuración ni ejecuta funciones institucionales. [Comparación inicial](seguridad/compatibilidad-paquete-actual.json), [resolución mediante hashes](seguridad/edge-bundles-actuales.json).

## Seguridad y disponibilidad observadas

RLS continúa habilitado en gamification.xp_ledger y gamification.login_rewards, con una política cada una y FORCE RLS desactivado. La RPC public.claim_daily_login_reward() permanece ausente. El indicador de RLS y el recuento de políticas no prueban suficiencia de los predicados. [Catálogo actual](seguridad/metadatos-mcp-actuales.json).

Los asesores mantienen 19 avisos de search_path mutable, 1 de extensión en public, 17 de funciones SECURITY DEFINER ejecutables por anon, 19 por authenticated, 1 de protección de contraseñas filtradas desactivada y 1 de parches PostgreSQL pendientes. Son categorías superpuestas, no 58 vulnerabilidades independientes ni explotaciones demostradas. Se conservaron metadatos de las funciones sin invocarlas; seis devuelven trigger y la presencia literal de auth.uid() no se interpreta como autorización suficiente. [Asesores](seguridad/metadatos-mcp-actuales.json), [funciones](seguridad/funciones-privilegiadas-metadatos.json).

pg_net informa versión 0.14.0, esquema public y extrelocatable=false. No se intentó trasladar o recrear la extensión. La actualización del servicio PostgreSQL debe tener su propia revisión y ventana: la documentación oficial describe indisponibilidad durante el procedimiento ([Supabase: Upgrading](https://supabase.com/docs/guides/platform/upgrading)). No se ejecutó un upgrade ni se cambiaron ajustes de Auth. [Notas y documentación](seguridad/notas-plataforma.json).

Los análisis npm terminaron con salida 0 y cero avisos en cada árbol: raíz 1439, functions 330 y auxiliar 101 dependencias, sin sumarlas. npm audit consulta el registro y no evalúa exhaustivamente código propio, forks locales o infraestructura.

Vercel conserva producción READY en **e469db5608fb77071b6a9ee3db253c28dae734dd**. Los GET a /, /login, /sobre y /horarios devolvieron 200 y el elemento raíz de la SPA. Esto acredita respuesta HTML, no renderizado de React, autenticación o persistencia. HSTS está presente. X-Content-Type-Options, X-Frame-Options y Referrer-Policy están preparadas en vercel.json del candidato y no se observaron en el hosting actual; CSP no está definida en el candidato ni se observó en producción. [Vercel](seguridad/vercel-configuracion-nombres.json), [HTTP](seguridad/despliegue-publico.json), [cabeceras](seguridad/cabeceras-candidato-vs-produccion.json).

## Android y recursos

El APK debug conserva **31076228 bytes**, SHA-256 **5f059b7387cc096326cdb3936eaceca535acd4a53d6af2f63cdb18a2ab18cb9d**. Es el artefacto de laboratorio construido en el expediente anterior, con OTA desactivada y backend descartable configurado; no se recompiló, instaló o distribuyó en esta fase. [Verificación de bytes](android/artefacto-pendiente-verificado.json).

La medición inicial registrada mostró **1597 MiB** disponibles y el motor Docker detenido (consulta de contenedores con código 1); la medición final registró **2109 MiB**, sin disponibilidad del pipe Docker consultado. No se inició el emulador ni se usó un dispositivo físico; se solicitó liberar recursos y se continuaron las comprobaciones independientes. No se terminaron procesos de usuario ni se reconstruyeron copias cifradas. Por tanto, hay cero casos nativos nuevos, conservados como BLOQUEADO por precondiciones. [Registro inicial](android/precondiciones-recursos.json), [medición final](android/precondiciones-recursos-finales.json).

Los antecedentes de Jest 419/419, Playwright 249/249 y WebView 13/13 corresponden a sus propios commits y artefactos. La consulta del CI base confirmó el run 41386966532 satisfactorio; no se ejecutó de nuevo ese CI mediante la consulta. Esos resultados no se transfieren al APK pendiente. [CI del commit base](integracion/ci-base-readback.json), [cierre anterior](../20261102-002437-proveedores-movil-7eee99c/INFORME_VERIFICACION_TECNICA.md).

## Decisiones pendientes e integridad

El [paquete concreto para revisión](PAQUETE_PARA_REVISION.md) identifica las cuatro fuentes SQL por SHA-256, la secuencia de avance/retorno y las condiciones todavía abiertas. La petición inicial prohíbe cambios de esquema, políticas o permisos sin autorización expresa. Esta continuación no cambia esa restricción ni constituye una aprobación de ventana o despliegue. También siguen fuera del alcance actual las validaciones que requieren credenciales de proveedores.

Se conservan el [inventario de fuentes](FUENTES_EVALUADAS.json), [comandos](COMANDOS.json), [privacidad](PRIVACIDAD.json), [integridad](INTEGRIDAD.json) y [manifiesto](MANIFIESTO_SHA256.json). Esta revisión no mide usabilidad, motivación, USE o UES-SF ni acredita una auditoría de penetración completa.
