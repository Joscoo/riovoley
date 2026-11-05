'use strict';
// Render a new read-only follow-up packet. Existing sealed evidence is never updated.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),h=require('../../e2e/local/harness.cjs');
assert.ok(!fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')),'EVIDENCE_SEALED');
const read=n=>JSON.parse(fs.readFileSync(path.join(h.evidence,n),'utf8')),refresh=process.argv.includes('--refresh-reviewed-draft'),put=(n,v)=>{fs.writeFileSync(path.join(h.evidence,n),typeof v==='string'?v.trimEnd()+'\n':JSON.stringify(v,null,2)+'\n',{flag:refresh?'w':'wx'});};
const context=read('CONTEXTO.json'),cloud=read('seguridad/metadatos-mcp-actuales.json'),sql=read('seguridad/sql-cuatro-archivos-revalidados.json'),edge=read('seguridad/edge-bundles-actuales.json'),publicWeb=read('seguridad/despliegue-publico.json'),vercel=read('seguridad/vercel-configuracion-nombres.json'),resources=read('android/precondiciones-recursos.json'),apk=read('android/artefacto-pendiente-verificado.json'),compat=read('seguridad/compatibilidad-paquete-actual.json'),headers=read('seguridad/cabeceras-candidato-vs-produccion.json');
const audits=['raiz','functions','auxiliar'].map(tree=>{const raw=read('seguridad/npm-audit-actual-'+tree+'.stdout.log'),meta=read('seguridad/npm-audit-actual-'+tree+'.meta.json');assert.equal(meta.exitCode,0);assert.equal(raw.metadata.vulnerabilities.total,0);return {tree,exitCode:meta.exitCode,dependencies:raw.metadata.dependencies.total,vulnerabilities:raw.metadata.vulnerabilities};});
assert.equal(compat.fingerprintMatches,true);assert.equal(sql.allMatch,true);assert.equal(edge.allCloudBundleHashesMatch,true);assert.equal(apk.hashMatchesPriorBuild,true);assert.equal(resources.dockerAvailable,false);assert.ok(publicWeb.observations.every(x=>x.status===200&&x.hasRootElement));
const prior='../20261102-002437-proveedores-movil-7eee99c',operational='../20261101-163241-cierre-operativo-2589935',summary={generatedAt:new Date().toISOString(),baseCommit:context.baseCommit,sqlFingerprintMatches:true,sqlFilesMatching:sql.files.length,edgeBundlesMatching:edge.functions.length,edgeAdministrativeRevisionsChanged:edge.functions.filter(f=>f.revisionChanged).length,advisories:cloud.advisory.map(x=>({name:x.name,count:x.count})),npmAudits:audits,publicGetRequests:publicWeb.observations.length,publicHttp200:publicWeb.observations.filter(x=>x.status===200).length,android:{state:'BLOQUEADO_PRECONDICIONES',newRuntimeCasesExecuted:0,apkHashMatchesPriorBuild:true,memoryFreeMiB:resources.memoryFreeMiB,dockerAvailable:false,newBuild:false},newJestRun:false,newPlaywrightRun:false,newSqlIntegrationRun:false,productionChanged:false,credentialValidationExcluded:true,productionReady:false};
put('RESULTADOS_AUTOMATIZADOS.json',summary);
put('INFORME_VERIFICACION_TECNICA.md',`# Continuación de preparación de producción — 4 de noviembre de 2026

## Identificación y alcance

RIOVOLEY, commit base ${context.baseCommit}, rama fix/seguridad-local-20261029. Inicio ${context.startedAt}; corte ${summary.generatedAt} (UTC; Ecuador UTC−5). Se retomó la revisión autorizada de solo lectura y el pendiente Android. No se solicitaron claves ni se aplicaron migraciones ni se cambiaron permisos ni se publicaron clientes. Los resultados anteriores se referencian con su propio commit y no se presentan como ejecuciones nuevas. [Contexto](CONTEXTO.json), [herramientas y accesos](HERRAMIENTAS_Y_ALCANCE.json).

Windows, Node ${process.version}, npm 11.16.0. El MCP Supabase respondió correctamente. El conector Vercel devolvió LINK_ID_REQUIRED y se utilizó su CLI ya autenticada, solo GET y metadatos sin descifrar valores. Se conservaron los argumentos y códigos disponibles en [COMANDOS.json](COMANDOS.json) y los procedimientos MCP en [consultas-mcp.json](seguridad/consultas-mcp.json).

## Metodología y resultados

APROBADO se limita al procedimiento ejecutado; BLOQUEADO identifica una precondición impedida; NO EJECUTADO conserva una verificación sin ejecución nueva. Los catálogos, hashes, avisos y respuestas HTTP no son casos funcionales. No se suman recuentos de avisos superpuestos ni dependencias de árboles diferentes.

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| S01 | Consulta READ ONLY de huella y precondiciones SQL | — | — | — | — | APROBADO en comparación; sin aplicar SQL | [Metadatos](seguridad/metadatos-mcp-actuales.json), [comparación](seguridad/compatibilidad-paquete-actual.json) |
| S02 | Cuatro archivos SQL comparados con evidencia sellada | — | — | — | — | APROBADO: 4 coinciden | [Hashes](seguridad/sql-cuatro-archivos-revalidados.json) |
| S03 | Nueve bundles Cloud comparados | — | — | — | — | APROBADO: 9 hashes coinciden, 9 revisiones distintas | [Edge](seguridad/edge-bundles-actuales.json) |
| S04 | Asesores institucionales de seguridad | — | — | — | — | EJECUTADO; alertas pendientes | [Metadatos](seguridad/metadatos-mcp-actuales.json) |
| S05 | npm audit raíz | — | — | — | — | APROBADO: 0 avisos / ${audits[0].dependencies} dependencias | [JSON](seguridad/npm-audit-actual-raiz.stdout.log) |
| S06 | npm audit functions | — | — | — | — | APROBADO: 0 avisos / ${audits[1].dependencies} dependencias | [JSON](seguridad/npm-audit-actual-functions.stdout.log) |
| S07 | npm audit auxiliar | — | — | — | — | APROBADO: 0 avisos / ${audits[2].dependencies} dependencias | [JSON](seguridad/npm-audit-actual-auxiliar.stdout.log) |
| H01 | Cuatro GET públicos HTTPS | — | — | — | — | APROBADO: 4 respuestas 200; no prueba de navegador | [HTTP](seguridad/despliegue-publico.json) |
| A01 | Integridad del APK debug pendiente | — | — | — | — | APROBADO: bytes y hash conservados | [Artefacto](android/artefacto-pendiente-verificado.json) |
| A02 | Nuevas verificaciones WebView Android | 0 | 0 | 0 | 0 | BLOQUEADO: memoria y Docker | [Precondiciones](android/precondiciones-recursos.json) |
| U01 | Jest/Testing Library actuales | 0 | 0 | 0 | 0 | NO EJECUTADO en esta fase | [Antecedente](${prior}/INFORME_VERIFICACION_TECNICA.md) |
| I01 | Integración SQL, Auth o proveedores nueva | 0 | 0 | 0 | 0 | NO EJECUTADO; solo lecturas agregadas Cloud | [Consultas](seguridad/consultas-mcp.json) |
| E01 | Playwright de navegador nuevo | 0 | 0 | 0 | 0 | NO EJECUTADO | [Antecedente](${prior}/INFORME_VERIFICACION_TECNICA.md) |
| W01 | Nueva compilación web o nativa | — | — | — | — | NO EJECUTADA; se verificó el APK existente | [Artefacto](android/artefacto-pendiente-verificado.json) |

## Contraste del paquete SQL/Edge

La huella actual de catálogo **${cloud.fingerprint}** coincide con el estado original esperado por la propuesta. Las consultas agregadas registran cero grupos de identidades de atleta duplicadas, cero grupos de XP diario duplicado, cero referencias diarias nulas y cero roles fuera de la lista canónica consultada. Las cuatro fuentes SQL conservan los hashes publicados, incluidos avance/retorno principal y complemento de reportes. No se alteraron huellas, guardas o expectativas para forzar coincidencias. [Consulta exacta de huella](seguridad/fuente-consulta-huella.sql), [precondiciones](seguridad/consulta-precondiciones.sql), [cuatro archivos](seguridad/sql-cuatro-archivos-revalidados.json).

Las nueve revisiones administrativas de Edge difieren en una unidad respecto al inventario anterior; sus nueve hashes de bundle **siguen coincidiendo** con los capturados para el retorno. Los indicadores verify_jwt también coinciden. La revisión administrativa por sí sola no demuestra un cambio de código. Esta comparación no verifica los valores de configuración ni ejecuta funciones institucionales. [Comparación inicial](seguridad/compatibilidad-paquete-actual.json), [resolución mediante hashes](seguridad/edge-bundles-actuales.json).

## Seguridad y disponibilidad observadas

RLS continúa habilitado en gamification.xp_ledger y gamification.login_rewards, con una política cada una y FORCE RLS desactivado. La RPC public.claim_daily_login_reward() permanece ausente. El indicador de RLS y el recuento de políticas no prueban suficiencia de los predicados. [Catálogo actual](seguridad/metadatos-mcp-actuales.json).

Los asesores mantienen 19 avisos de search_path mutable, 1 de extensión en public, 17 de funciones SECURITY DEFINER ejecutables por anon, 19 por authenticated, 1 de protección de contraseñas filtradas desactivada y 1 de parches PostgreSQL pendientes. Son categorías superpuestas, no 58 vulnerabilidades independientes ni explotaciones demostradas. Se conservaron metadatos de las funciones sin invocarlas; seis devuelven trigger y la presencia literal de auth.uid() no se interpreta como autorización suficiente. [Asesores](seguridad/metadatos-mcp-actuales.json), [funciones](seguridad/funciones-privilegiadas-metadatos.json).

pg_net informa versión 0.14.0, esquema public y extrelocatable=false. No se intentó trasladar o recrear la extensión. La actualización del servicio PostgreSQL debe tener su propia revisión y ventana: la documentación oficial describe indisponibilidad durante el procedimiento ([Supabase: Upgrading](https://supabase.com/docs/guides/platform/upgrading)). No se ejecutó un upgrade ni se cambiaron ajustes de Auth. [Notas y documentación](seguridad/notas-plataforma.json).

Los análisis npm terminaron con salida 0 y cero avisos en cada árbol: raíz ${audits[0].dependencies}, functions ${audits[1].dependencies} y auxiliar ${audits[2].dependencies} dependencias, sin sumarlas. npm audit consulta el registro y no evalúa exhaustivamente código propio, forks locales o infraestructura.

Vercel conserva producción READY en **${vercel.productionCommit}**. Los GET a /, /login, /sobre y /horarios devolvieron 200 y el elemento raíz de la SPA. Esto acredita respuesta HTML, no renderizado de React, autenticación o persistencia. HSTS está presente. X-Content-Type-Options, X-Frame-Options y Referrer-Policy están preparadas en vercel.json del candidato y no se observaron en el hosting actual; CSP no está definida en el candidato ni se observó en producción. [Vercel](seguridad/vercel-configuracion-nombres.json), [HTTP](seguridad/despliegue-publico.json), [cabeceras](seguridad/cabeceras-candidato-vs-produccion.json).

## Android y recursos

El APK debug conserva **${apk.bytes} bytes**, SHA-256 **${apk.sha256}**. Es el artefacto de laboratorio construido en el expediente anterior, con OTA desactivada y backend descartable configurado; no se recompiló, instaló o distribuyó en esta fase. [Verificación de bytes](android/artefacto-pendiente-verificado.json).

La medición inicial registrada mostró **${resources.memoryFreeMiB} MiB** disponibles y el motor Docker detenido (consulta de contenedores con código ${resources.dockerReadExitCode}); la medición final registró **${read('android/precondiciones-recursos-finales.json').memoryFreeMiB} MiB**, sin disponibilidad del pipe Docker consultado. No se inició el emulador ni se usó un dispositivo físico; se solicitó liberar recursos y se continuaron las comprobaciones independientes. No se terminaron procesos de usuario ni se reconstruyeron copias cifradas. Por tanto, hay cero casos nativos nuevos, conservados como BLOQUEADO por precondiciones. [Registro inicial](android/precondiciones-recursos.json), [medición final](android/precondiciones-recursos-finales.json).

Los antecedentes de Jest 419/419, Playwright 249/249 y WebView 13/13 corresponden a sus propios commits y artefactos. La consulta del CI base confirmó el run 41386966532 satisfactorio; no se ejecutó de nuevo ese CI mediante la consulta. Esos resultados no se transfieren al APK pendiente. [CI del commit base](integracion/ci-base-readback.json), [cierre anterior](${prior}/INFORME_VERIFICACION_TECNICA.md).

## Decisiones pendientes e integridad

El [paquete concreto para revisión](PAQUETE_PARA_REVISION.md) identifica las cuatro fuentes SQL por SHA-256, la secuencia de avance/retorno y las condiciones todavía abiertas. La petición inicial prohíbe cambios de esquema, políticas o permisos sin autorización expresa. Esta continuación no cambia esa restricción ni constituye una aprobación de ventana o despliegue. También siguen fuera del alcance actual las validaciones que requieren credenciales de proveedores.

Se conservan el [inventario de fuentes](FUENTES_EVALUADAS.json), [comandos](COMANDOS.json), [privacidad](PRIVACIDAD.json), [integridad](INTEGRIDAD.json) y [manifiesto](MANIFIESTO_SHA256.json). Esta revisión no mide usabilidad, motivación, USE o UES-SF ni acredita una auditoría de penetración completa.
`);
put('PAQUETE_PARA_REVISION.md',`# Paquete de producción preparado para revisión

Estado al ${summary.generatedAt}: **no aplicado, sin ventana ni autorización de mutaciones institucionales**. Destino identificado: mayvvlkvheagkojunzzb; frontend joscoos-projects/riovoley, riovoley.com. Commit base ${context.baseCommit}. No ejecutar scripts locales contra producción ni cambiar los marcadores para eludir las guardas.

| Orden | Artefacto | SHA-256 |
|---|---|---|
${sql.files.map((x,i)=>'| '+(i+1)+' | '+x.file+' | '+x.sha256+' |').join('\n')}

La numeración identifica archivos; no ordena ejecutar los retornos tras los avances. Avance operativo: principal de seguridad, complemento de reportes, Edge/clientes coordinados bajo ventana cerrada. Retorno por decisión operativa: coordinar componentes y mantener la ventana cerrada; primero complemento de reportes, después principal. El retorno restituye permisos anteriores y no recupera datos ni reconcilia escrituras posteriores.

| Requisito | Resultado actual | Acción pendiente |
|---|---|---|
| Huella del catálogo | Coincide: ${cloud.fingerprint} | Repetir lectura justo antes de una ventana aprobada |
| Precondiciones agregadas | Cuatro contadores en cero | No reemplaza revisión de nuevos datos al corte |
| SQL preparado | Cuatro hashes coincidentes con evidencia previa | Aprobar expresamente estos archivos/destino antes de ejecutar |
| Edge y retorno | Nueve hashes Cloud coinciden; revisiones administrativas distintas | Mantener esas referencias y revisar configuración de la ventana |
| Web/Android | Web productiva anterior; APK nuevo íntegro sin runtime nuevo | Validar candidato nativo y coordinar promoción de clientes |
| Backup | Existe antecedente de recuperación SQL/bytes Storage | Confirmar vigencia para la ventana; no se desbloquean copias en esta fase |
| Operación | Sin responsable ni ventana definidos | Definir responsable, duración y criterios de aborto/retorno |
| Proveedores | Validación detenida por indicación del usuario | No declarar comprobado correo, push o recuperación real |
| Plataforma | pg_net, parches PG y ajustes Auth siguen observados | Revisiones y autorizaciones separadas; sin cambios automáticos |

La preparación se sustenta en [los cuatro hashes](seguridad/sql-cuatro-archivos-revalidados.json), [el catálogo](seguridad/metadatos-mcp-actuales.json), [los bundles](seguridad/edge-bundles-actuales.json), [el runbook](../../../../produccion/RUNBOOK.md) y [el informe](INFORME_VERIFICACION_TECNICA.md). No es una instrucción para aplicar los archivos ahora.
`);
const tracing=JSON.parse(fs.readFileSync(path.join(h.evidence,operational,'unitarias/trazabilidad-categorias.json'),'utf8'));
put('MATRIZ_VERIFICACIONES_TESIS.md',`# Matriz complementaria de esta continuación

Las ocho categorías iniciales mantienen su evidencia anterior; no se repitieron sus casos funcionales en esta fase. Los recuentos de las primeras siete filas son subconjuntos superpuestos de Jest 419 de aquel expediente, con mocks/fixtures o memoria y sin persistencia institucional acreditada por esos casos. No se suman como nuevas ejecuciones.

| Categoría | Archivos relacionados | Casos anteriores / resultado | Tipo y dependencias | Limitación | Evidencia |
|---|---|---|---|---|---|
${tracing.map((x,i)=>'| '+(i+1)+'. '+x.category+' | '+x.files.join('<br>')+' | '+x.executed+' ejecutados / '+x.passed+' aprobados; 0 nuevos aquí | '+x.type+' | Sin nueva ejecución funcional en esta fase | [Trazabilidad]('+operational+'/unitarias/trazabilidad-categorias.json) |').join('\n')}
| 8. Compilación | CRA/Capacitor/Gradle del expediente anterior | 0 nuevas compilaciones; APK existente coincide por SHA-256 | Inspección real del archivo privado | No demuestra ejecución WebView | [Artefacto](android/artefacto-pendiente-verificado.json) |

| Complemento actual | Resultado | Dependencias / límite | Evidencia |
|---|---|---|---|
| Android | BLOQUEADO; 0 casos runtime | Docker detenido y memoria insuficiente para el ensayo conjunto | [Precondiciones](android/precondiciones-recursos.json) |
| Playwright | NO EJECUTADO | GET público no equivale a navegador E2E | [HTTP](seguridad/despliegue-publico.json) |
| Seguridad SQL | Huella coincidente y cuatro fuentes intactas | Catálogo real READ ONLY; sin RPC de negocio | [Paquete](seguridad/compatibilidad-paquete-actual.json) |
| Seguridad Edge | Nueve hashes Cloud coincidentes | Metadatos reales; sin invocar proveedores | [Bundles](seguridad/edge-bundles-actuales.json) |
| npm audit | 0 avisos en raíz/functions/auxiliar, árboles separados | Registro npm; no auditoría de código propio o forks | [Raíz](seguridad/npm-audit-actual-raiz.stdout.log), [functions](seguridad/npm-audit-actual-functions.stdout.log), [auxiliar](seguridad/npm-audit-actual-auxiliar.stdout.log) |
| Asesores Supabase | Alertas continúan | Metadatos reales; no prueba de explotación | [Asesores](seguridad/metadatos-mcp-actuales.json) |

Esta matriz complementa la [matriz anterior](${prior}/MATRIZ_VERIFICACIONES_TESIS.md) y conserva sus denominadores y límites.
`);
put('RESULTADOS_PARA_TESIS_4_5.md',`# Propuesta complementaria para revisión académica — apartado 4.5

La revisión de continuidad realizada el 4 de noviembre de 2026 sobre el commit base ${context.baseCommit.slice(0,7)} contrastó el estado institucional mediante consultas de solo lectura. La huella de catálogo coincidió con la esperada por el paquete SQL previamente ensayado; sus cuatro archivos conservaron los hashes publicados y los nueve hashes de bundle de Edge coincidieron con el inventario anterior, aunque sus números de revisión administrativa habían cambiado. Esta evidencia comprueba correspondencia de los metadatos observados y artefactos, sin acreditar aplicación del paquete o ejecución funcional en producción. [Catálogo](seguridad/metadatos-mcp-actuales.json), [SQL](seguridad/sql-cuatro-archivos-revalidados.json), [Edge](seguridad/edge-bundles-actuales.json).

Los nuevos análisis npm finalizaron con código cero y sin avisos en los árboles raíz, functions y auxiliar, correspondientes a ${audits[0].dependencies}, ${audits[1].dependencies} y ${audits[2].dependencies} dependencias respectivamente, sin sumar sus denominadores. Cuatro solicitudes GET HTTPS a rutas públicas obtuvieron estado 200 y el elemento raíz de la SPA; no se ejecutó JavaScript ni se verificaron por este método autenticación, roles o persistencia. Las alertas institucionales de permisos y configuración continuaron, y la RPC de recompensa diaria permaneció ausente. Por tanto, los resultados no se interpretan como una validación integral de producción. [Análisis raíz](seguridad/npm-audit-actual-raiz.stdout.log), [functions](seguridad/npm-audit-actual-functions.stdout.log), [auxiliar](seguridad/npm-audit-actual-auxiliar.stdout.log), [HTTP](seguridad/despliegue-publico.json), [asesores y RPC](seguridad/metadatos-mcp-actuales.json).

La integridad del APK debug previamente construido fue corroborada por tamaño y SHA-256. No se realizaron nuevas compilaciones ni casos de WebView, dado que Docker estaba detenido y la memoria disponible impedía iniciar el ensayo conjunto en las condiciones previstas. El pendiente se conservó como bloqueado por precondiciones; los resultados de Jest, Playwright y Android de expedientes anteriores mantienen su identificación y no se presentan como nuevas ejecuciones. Las comprobaciones que requieren credenciales de proveedores continuaron excluidas por indicación del responsable. Esta evidencia no mide usabilidad, motivación ni resultados USE o UES-SF. [Artefacto](android/artefacto-pendiente-verificado.json), [precondiciones](android/precondiciones-recursos.json), [informe](INFORME_VERIFICACION_TECNICA.md).

Texto propuesto para revisión académica; no se modificó el documento de tesis.
`);
console.log(JSON.stringify({reportsCreated:4,npmAuditTrees:3,providerCalls:0,androidRuntimeCases:0,productionChanged:false}));
