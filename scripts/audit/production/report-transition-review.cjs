'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const h = require('../../e2e/local/harness.cjs'), read = f => JSON.parse(fs.readFileSync(path.join(h.evidence, f), 'utf8'));
assert.ok(!fs.existsSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json')), 'NEW_EVIDENCE_REQUIRED');
const context = read('CONTEXTO.json'), cloud = read('seguridad/supabase-catalogo-actual.json'), access = read('seguridad/rls-permisos-actuales.json');
const advisors = read('seguridad/supabase-avisos-actuales.json'), vercel = read('seguridad/vercel-actual.json');
const artifacts = read('seguridad/artefactos-sql-edge-verificados.json'), returns = read('seguridad/retorno-edge-archivos-verificados.json');
const backup = read('seguridad/respaldos-recibos-actuales.json'), ci = read('integracion/ci-candidato-verificado.json');
const web = read('seguridad/https-publico-actual.json'), apk = read('android/apk-existente-verificado.json'), operation = read('OPERACION_PROPUESTA.json');
const guards = read('seguridad/guardas-y-orden-sql.json');
const source = file => '[' + file + '](' + path.relative(h.evidence, path.join(h.root, file)).replaceAll('\\', '/') + ')';
assert.equal(cloud.fingerprint, '15b9d9e869fb5113263c485714009878'); assert.equal(ci.commit, context.baseCommit);
assert.equal(operation.productionExecutionAuthorized, false); assert.equal(operation.responsibleConfirmed, true);
const summary = { reportedAt: new Date().toISOString(), baseCommit: context.baseCommit, functionalTestsNew: 0,
  sqlFilesMatching: artifacts.sql.filter(f => f.matchesReviewed).length, cloudEdgeMetadataHashesMatching: artifacts.edge.filter(f => f.matchesPreparedReturnHash).length,
  privateCandidateFilesMatching: artifacts.candidateFiles.filter(f => f.privateHashMatches).length, privateReturnSourceFilesMatching: returns.totalFiles,
  rlsTablesEnabled: cloud.catalog.rls.filter(t => t.enabled).length, dailyRewardRpcPresent: cloud.catalog.daily_reward_rpc_present,
  fingerprint: cloud.fingerprint, advisories: advisors.categories, publicGet200: web.observations.filter(r => r.status === 200).length,
  productionCommit: vercel.deployment.gitSha, candidateCi: { commit: ci.commit, conclusion: ci.conclusion, newExecution: false },
  android: { artifactSource: apk.sourceCommit, newBuild: false, newRuntime: false, distributionIncluded: false },
  backup: { ciphertextHashMatches: backup.sql.ciphertextHashMatchesReceipt, createdAt: backup.sql.createdAt, newRestore: false, currentCutoffFreshnessProved: false },
  proposedWindow: operation, productionChanged: false, productionReady: false, decision: 'NO INICIAR EJECUCION: precondiciones operativas y autorizacion pendientes' };
h.write('RESULTADOS_AUTOMATIZADOS.json', summary);
const sqlRows = artifacts.sql.map(f => `| ${source(f.file)} | ${f.sha256} |`).join('\n');
const edgeRows = artifacts.edge.map(f => `| ${f.slug} | ${f.version} | ${f.cloudBundleSha256} |`).join('\n');
h.write('PAQUETE_TRANSICION_PROPUESTO.md', `# Paquete revisable de transición web, SQL y Edge

**Estado: preparado para revisión, no autorizado para ejecución y sin cambios institucionales.** Responsable: titular de esta sesión, confirmado por el usuario. Ventana propuesta por delegación: sábado 7 de noviembre de 2026, 22:00–23:30 en Ecuador (UTC−5), equivalente a 8 de noviembre 03:00–04:30 UTC. Reserva de 90 minutos: presupuesto operativo del agente, sin medición de baja demanda ni garantía de que un retorno gestionado quepa en ese plazo. Confirmar calendario institucional antes de activarla. [Ficha](OPERACION_PROPUESTA.json).

## Destinos y conjunto identificado

- Supabase: ${context.projectId}, Riovoley APP, observado ACTIVE_HEALTHY; catálogo ${cloud.fingerprint}.
- Vercel: cuenta Riovoley, equipo ${context.vercelTeam}, proyecto ${vercel.project.id}, dominio ${context.publicDomain}.
- Web productiva observada: ${vercel.deployment.id}, READY, commit ${vercel.deployment.gitSha}, rama ${vercel.deployment.gitRef}. Ese deployment es el punto web de retorno identificado, no un retorno ejecutado.
- Candidato fuente revisado: ${context.baseCommit}; [CI existente aprobado](${ci.url}), con 434 casos Jest en 91 suites según su recibo. El commit posterior que solo incorpore este expediente requiere su propio CI.
- Android queda en desarrollo/pruebas y fuera de distribución. El APK debug verificado procede de ${apk.sourceCommit}, SHA-256 ${apk.sha256}; no es un release institucional firmado.

## SQL exacto revisado

| Archivo | SHA-256 |
|---|---|
${sqlRows}

Avance: principal de seguridad, después complemento de reportes. Retorno, solo por decisión operativa y con clientes aislados: complemento de reportes primero, principal después. Los cuatro archivos no se ejecutan como una lista secuencial: los retornos no forman parte del avance normal. [Orden y guardas](seguridad/guardas-y-orden-sql.json).

Huellas previstas por las guardas del paquete: origen 15b9d9e869fb5113263c485714009878; después del principal 500d15ffa5fa23aeddb47e5c21cd1d13; después del complemento 38434a2af96ad410967032b00a0828ac. El retorno complementario vuelve al estado posterior al principal; el retorno principal vuelve al origen. Estas huellas proceden de los archivos ya ensayados, no de una ejecución institucional de esta fase.

Los marcadores de aprobación y closed-to-clients no autorizan el cambio ni suspenden tráfico. No modificarlos para eludir la falta de ventana o mantenimiento efectivo. El primer paso de la ventana debe abortar si existe deriva o falta un requisito.

## Edge y retorno preparado

| Función Cloud observada | Revisión | SHA-256 publicado en metadatos |
|---|---:|---|
${edgeRows}

Los nueve hashes de metadatos coinciden con el retorno preparado. No se descargaron nuevos bytes Cloud. Se comprobaron ${artifacts.candidateFiles.length} archivos privados del candidato y ${returns.totalFiles} archivos fuente privados de retorno repartidos en nueve funciones. Los TS del candidato coinciden con el repositorio después de normalizar CRLF; no equivale a igualdad binaria de todos los despliegues. No se ensayó ahora un retorno gestionado. [Candidato/SQL](seguridad/artefactos-sql-edge-verificados.json), [retorno](seguridad/retorno-edge-archivos-verificados.json).

## Agenda propuesta y condiciones de parada

| Tramo Ecuador | Acción prevista, solo tras aprobación | Condición para continuar |
|---|---|---|
| 22:00–22:15 | Gate previo y control efectivo de escrituras/clientes | Destinos, hashes y catálogo sin deriva; respaldo vigente al corte; responsable presente; autorización específica registrada |
| 22:15–22:35 | SQL principal y complemento, con verificaciones entre etapas | Huellas previstas, RLS/ACL/firmas y RPC diaria verificadas por lectura antes de Edge |
| 22:35–22:50 | Revisiones Edge compatibles | Contratos y denegaciones controladas sin efectos; detener ante deriva o respuesta inesperada |
| 22:50–23:10 | Promoción web compatible y comprobaciones públicas | Artefacto/commit correctos, versión efectiva de Node registrada, GET/recarga SPA esperados; no ejecutar login que otorgue XP o escrituras de prueba en producción |
| 23:10–23:30 | Observación y reserva de retorno | Solo reabrir con aceptación del responsable; no forzar reapertura por llegar a la hora final |

La agenda es una propuesta, no tiempos medidos de despliegue. Android, cambios Auth, actualización PostgreSQL, traslado de pg_net y tareas de claves quedan fuera. Correos/push, recuperación real y restauración gestionada de Storage no se presentan como comprobados; el responsable debe resolver si esa falta de evidencia impide la apertura de su operación.

Abortar antes de mutar si cualquier hash/destino/huella cambia, alguna precondición agregada deja de ser cero, no existe respaldo vigente o no se demuestra suspensión de escrituras y control de clientes anteriores. Un aviso en la portada o impedir nuevas visitas web no bloquea por sí solo clientes SPA ya abiertos que llaman directamente a Supabase. Si no puede aislarse el tráfico, este orden no es apto: diseñar y ensayar una transición de expansión compatible antes de ejecutarlo.

Detener la progresión ante un 5xx o resultado inesperado en las comprobaciones de promoción, RPC/ACL/firmas ausentes, denegación de un acceso legítimo confirmado o duplicación de recompensa. Los 401/403 que se esperan en comprobaciones de denegación no son fallos por sí solos. No realizar pruebas de escritura institucional para intentar demostrar un problema.

El retorno coordina web, Edge y SQL bajo control de clientes. Nunca restaurar SQL anterior mientras clientes o Edge nuevos siguen activos. Primero conservar las escrituras posteriores y decidir reconciliación si hubo alguna; los scripts de retorno restablecen catálogo/permisos previos y no recuperan datos. El respaldo actual conserva integridad cifrada pero data del ${backup.sql.createdAt}; su hash no prueba vigencia para esta ventana. [Respaldos y alcance](seguridad/respaldos-recibos-actuales.json), [runbook](../../../../produccion/RUNBOOK.md).

## Requisitos aún abiertos

${operation.openRequirements.map(r => '- ' + r).join('\n')}

La respuesta del usuario designó responsable y delegó una propuesta horaria en una pregunta que decía expresamente sin ejecutar cambios todavía. No se interpreta como autorización SQL, despliegue, cambios Auth o permisos. La exclusión de tareas con claves se conserva. Este documento no inicia la ventana ni programa acciones automáticas.
`);
const advisorRows = advisors.categories.map(a => `| ${a.name} | ${a.count} | ${a.level} | [Referencia oficial](${a.remediation}) |`).join('\n');
h.write('INFORME_VERIFICACION_TECNICA.md', `# Revisión de transición institucional por lectura

RIOVOLEY, commit base ${context.baseCommit}. Inicialización ${context.initializedAt} UTC. Algunas consultas MCP preceden a la asignación del expediente dentro de este mismo turno; se conservan sus horas originales. Supabase y Vercel MCP respondieron sobre el proyecto y cuenta correctos, sin recurrir a valores de claves. El usuario confirmó ser responsable y delegó la propuesta de ventana; no autorizó ejecutar cambios. [Contexto](CONTEXTO.json), [consultas MCP](seguridad/consultas-mcp.json), [consulta adicional de permisos](seguridad/consulta-permisos.meta.json).

## Alcance, método y herramientas

Se efectuaron consultas de catálogo en transacciones READ ONLY, lectura de avisos/revisiones y metadatos de hosting, GET públicos sin JavaScript y comprobaciones SHA-256 de archivos locales. Windows, Node ${process.version}; el entorno previo del candidato y sus ejecuciones conserva sus propios registros. No hubo nueva compilación, suite Jest/Playwright/Android, descarga de bytes Edge, descifrado/restauración, envíos, login institucional o escrituras de negocio. No se cambió SQL, Auth, RLS, permisos, versión PostgreSQL o despliegues.

Los tres comandos de comprobación locales y sus códigos se registran en [COMANDOS.json](COMANDOS.json). Los MCP no son procesos del sistema: sus recibos registran toolIsError y horas, con código de salida OS no aplicable. Para reproducir, seleccionar las cuentas con acceso al proyecto confirmado y usar los SQL [catálogo](seguridad/consulta-catalogo.sql), [huella](seguridad/consulta-huella.sql) y [permisos](seguridad/consulta-permisos.sql). Las sentencias BEGIN READ ONLY/ROLLBACK no aplican cambios persistentes. ${source('scripts/audit/production/read-public-transition.cjs')}, ${source('scripts/audit/production/verify-transition-artifacts.cjs')} y ${source('scripts/audit/production/verify-transition-return.cjs')} conservan el procedimiento local sin consultar secretos.

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

La huella ${cloud.fingerprint} coincide con el origen de las propuestas. Los cuatro contadores agregados son cero: identidades duplicadas de estudiante, XP diario duplicado, referencias nulas de XP diario y roles no canónicos. Eso no prueba identidad del contenido de toda la base ni ausencia de otros defectos. El catálogo confirma que public.claim_daily_login_reward() no existe: no promover el cliente que requiere esa RPC antes de completar y verificar el cambio SQL compatible.

RLS está habilitado en gamification.xp_ledger y gamification.login_rewards; cada tabla mantiene una política ALL para authenticated con expresión de propietario y FORCE=false. Sus expresiones no se clasifican como true constante; contienen auth.uid, lo cual por sí solo no prueba corrección semántica. Las dos vistas públicas observadas usan security_invoker=true. Los grants de las vistas y de tablas base se conservan por separado: no equivalen a operaciones efectivas bajo RLS, y no se intentaron escrituras. [Detalle](seguridad/rls-permisos-actuales.json). La [documentación de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security) explica que estas vistas aplican RLS de las tablas subyacentes.

## Avisos de seguridad actuales

| Categoría | Hallazgos informados | Nivel | Referencia |
|---|---:|---|---|
${advisorRows}

Hay seis categorías. Los recuentos se superponen entre funciones/roles y no se presentan como vulnerabilidades únicas ni explotabilidad demostrada. No se aplicaron remedios automáticos. pg_net0.14.0 está en public y no es relocatable; no proponer su traslado mediante SET SCHEMA como corrección ejecutable inmediata. [PostgreSQL17](https://www.postgresql.org/docs/17/sql-alterextension.html) requiere que la extensión sea reubicable para ese comando. Los cambios de extensión, PostgreSQL y configuración Auth requieren alcance y aprobación separados del paquete propuesto.

## Hosting, artefactos y respaldo

El deployment productivo ${vercel.deployment.id} sigue READY, con commit ${vercel.deployment.gitSha} de main, creado ${new Date(vercel.deployment.createdAt).toISOString()}. Cuatro GET devolvieron HTTP200 sin ejecutar JavaScript o autenticarse; esto no valida roles, flujos o integraciones. Se observó HSTS; no se observaron X-Content-Type-Options, X-Frame-Options, Referrer-Policy ni CSP en esas respuestas. Las tres primeras cabeceras están preparadas en vercel.json, no publicadas. No se infiere de ello una prueba de penetración completa.

El ajuste de proyecto Vercel es Node${vercel.project.nodeVersion}; el candidato fija engines.node=24.x. La [documentación de Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) establece prioridad de engines sobre el ajuste del proyecto. La versión efectiva del próximo build debe registrarse; el metadato no acredita ese build futuro. No se modificó la configuración del proyecto.

Se comprobaron 4 hashes SQL, 9 hashes de metadatos Edge, 39 archivos privados del candidato y 51 de retorno. Los 28 TS del candidato coinciden con el repositorio al normalizar CRLF, no necesariamente byte a byte antes de normalizar. No se descargó ni desplegó código Cloud en esta fase. El hash del APK existente coincide con su recibo; es debug, no release firmado.

El archivo SQL cifrado conserva el hash de su recibo y mide ${backup.sql.ciphertextBytes} bytes. Fue creado ${backup.sql.createdAt}; tenía ${backup.sql.ageHours} horas en la consulta de integridad. No se desbloqueó ni se generó otro respaldo. Los recibos previos de Storage registran 43 objetos y 3596269 bytes recuperados como bytes, sin restauración gestionada por Storage API. La restauración SQL anterior verificó 94 tablas, 27159 filas y 11 secuencias; es un antecedente del 1 de noviembre, no una ejecución nueva. [Alcance y fechas](seguridad/respaldos-recibos-actuales.json).

## Decisión y pendientes

Responsable confirmado y reserva propuesta de 90 minutos se registran sin datos personales. La ficha no autoriza cambios. El alcance planificado es web/SQL/Edge; Android continúa en desarrollo/pruebas y no se distribuye. Permanecen pendientes calendario institucional, respaldo vigente al corte, control efectivo de escrituras/clientes anteriores, criterios de aceptación de integraciones excluidas y autorización específica del paquete. El candidato no se declara listo para ejecutar ni funcionando en producción. No se deducen resultados de usabilidad, motivación, USE o UES-SF.

El [paquete propuesto](PAQUETE_TRANSICION_PROPUESTO.md) identifica destinos, hashes, orden, huellas de guardas y retorno. Los tres documentos se generan con ${source('scripts/audit/production/report-transition-review.cjs')}; [integridad](INTEGRIDAD.json), [privacidad](PRIVACIDAD.json) y [manifiesto](MANIFIESTO_SHA256.json) conservan la evidencia. El CI del commit posterior al sellado se comprueba aparte, sin editar este expediente.
`);
h.write('MATRIZ_VERIFICACIONES_TESIS.md', `# Matriz de trazabilidad de la revisión institucional

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
`);
h.write('RESULTADOS_PARA_TESIS_4_5.md', `# Propuesta académica para revisión

La revisión complementaria de RIOVOLEY sobre el commit ${context.baseCommit.slice(0, 7)} verificó por consultas de solo lectura que la huella del catálogo institucional coincidía con el origen del paquete SQL ensayado y que RLS permanecía habilitado en gamification.xp_ledger y gamification.login_rewards, con una política por tabla. Las dos vistas públicas relacionadas conservaron security_invoker=true; estos metadatos no demuestran por sí solos la corrección de todas las operaciones autorizadas. También se constató la ausencia de public.claim_daily_login_reward(), condición que impide atribuir al backend institucional la compatibilidad ya comprobada en el laboratorio. [Catálogo](seguridad/supabase-catalogo-actual.json) y [permisos](seguridad/rls-permisos-actuales.json).

Las comparaciones documentadas conservaron coincidencia en cuatro archivos SQL, nueve hashes publicados en metadatos Edge, 39 archivos privados del candidato y 51 fuentes privadas de retorno. Cuatro solicitudes HTTPS públicas devolvieron HTTP200 sin ejecutar JavaScript ni autenticación; el deployment observado continuó sirviendo el commit productivo anterior ${vercel.deployment.gitSha.slice(0, 7)}. Los asesores mantuvieron seis categorías de avisos con hallazgos superpuestos. [Artefactos](seguridad/artefactos-sql-edge-verificados.json), [retorno](seguridad/retorno-edge-archivos-verificados.json), [HTTP](seguridad/https-publico-actual.json) y [avisos](seguridad/supabase-avisos-actuales.json) respaldan estas afirmaciones. No se ejecutaron nuevos casos unitarios, extremo a extremo o compilaciones en esta fase, ni se aplicaron cambios institucionales; los resultados previos conservaron sus denominadores originales. La integridad del respaldo cifrado comprobada no acredita su vigencia para una ventana futura. Por tanto, estas evidencias sustentan la preparación y sus límites, mientras la transición institucional permanece pendiente; no justifican conclusiones de funcionamiento integral, seguridad completa, usabilidad o motivación.
`);
console.log(JSON.stringify({ sql: summary.sqlFilesMatching, edgeMetadata: summary.cloudEdgeMetadataHashesMatching, candidateFiles: summary.privateCandidateFilesMatching, returnFiles: summary.privateReturnSourceFilesMatching, publicHttp200: summary.publicGet200, productionReady: false, documents: 4 }));
