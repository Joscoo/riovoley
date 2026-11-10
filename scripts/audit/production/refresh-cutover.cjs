'use strict';
// Evidence-only continuation. No SQL mutation, login, credential entry or deployment path.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const crypto = require('node:crypto'), assert = require('node:assert/strict');
const h = require('../../e2e/local/harness.cjs');
assert.match(path.basename(h.evidence), /^\d{8}-\d{6}-prerrequisitos-corte-[a-f0-9]{7}$/);
assert.ok(!fs.existsSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json')), 'SEALED_PACKET');
const read = f => JSON.parse(fs.readFileSync(path.join(h.evidence, f), 'utf8'));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const rel = f => path.relative(h.root, f).replaceAll('\\', '/');
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const git = args => cp.execFileSync('git', args, { cwd: h.root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

function artifacts() {
  const previous = 'docs/tesis/evidencias/verificacion-tecnica/20261109-152730-edge-fence-f0b89f4';
  const candidate = JSON.parse(fs.readFileSync(path.join(h.root, previous, 'seguridad/candidato-fuentes-corregido.json')));
  const packet = JSON.parse(fs.readFileSync(path.join(h.runtime, 'edge-production/packet.json')));
  const m = read('seguridad/metadatos-mcp-actuales.json');
  for (const f of candidate.files) {
    assert.equal(sha(fs.readFileSync(path.join(h.root, candidate.privateCandidateDirectory, f.file))), f.sha256);
    if (f.origin === 'current-repository') assert.equal(sha(fs.readFileSync(path.join(h.root, f.file))), f.sha256);
  }
  const prior = JSON.parse(fs.readFileSync(path.join(h.root, 'docs/tesis/evidencias/verificacion-tecnica/20261105-160424-transicion-lectura-d2b43e4/seguridad/artefactos-sql-edge-verificados.json')));
  assert.equal(prior.sql.length, 4);
  const sql = prior.sql.map(f => { assert.equal(sha(fs.readFileSync(path.join(h.root, f.file))), f.sha256); return { file: f.file, sha256: f.sha256, matchesPrior: true }; });
  const functions = packet.functions.map(f => {
    const cloud = m.edge.find(e => e.name === f.slug); assert.equal(cloud.bundleHash, f.cloudBundleSha256);
    for (const file of f.returnSourceFiles) {
      const target = path.resolve(h.root, f.returnDirectory, 'supabase/functions', file.file); assert.ok(target.startsWith(h.runtime + path.sep));
      assert.equal(sha(fs.readFileSync(target)), file.sha256);
    }
    return { function: f.slug, cloudVersion: cloud.version, bundleHash: cloud.bundleHash, previousBundleHash: f.cloudBundleSha256, privateReturnFilesMatching: f.returnSourceFiles.length };
  });
  h.write('seguridad/artefactos-y-candidato.json', { at: new Date().toISOString(), sql, candidateEvidence: previous + '/seguridad/candidato-fuentes-corregido.json',
    candidateFiles: candidate.files.length, candidateAllMatch: true, repositorySourceFiles: 28, previousGeneratedConfigs: 11,
    changedFromPriorCandidate: candidate.changedSourceFiles, edgeReturnMetadataAllMatch: true, returnFilesMatching: functions.reduce((n, f) => n + f.privateReturnFilesMatching, 0),
    functions, cloudBytesDownloadedAgain: false, cloudReturnExecuted: false, productionChanged: false });
  const ci = JSON.parse(fs.readFileSync(path.join(h.runtime, 'operational-readiness/github-ci-022cc8d-verified.json'))).summary;
  h.write('integracion/ci-commit-base.json', ci);
  const query = fs.readFileSync(path.join(__dirname, 'catalog-fingerprint.sql'));
  fs.writeFileSync(path.join(h.evidence, 'seguridad/catalog-fingerprint.sql'), query, { flag: 'wx' });
  h.write('seguridad/consulta-fingerprint.json', { tool: 'mcp__codex_apps__supabase_execute_sql', queryFile: 'catalog-fingerprint.sql', querySha256: sha(query),
    wrapper: 'BEGIN READ ONLY; <query file> COMMIT;', result: m.fingerprint, rawUserRowsReturned: false });
  console.log(JSON.stringify({ sqlFiles: sql.length, candidateFiles: candidate.files.length, returnFiles: functions.reduce((n, f) => n + f.privateReturnFilesMatching, 0) }));
}

async function http() {
  const m = read('seguridad/metadatos-mcp-actuales.json'), observations = [];
  assert.equal(m.project.id, 'mayvvlkvheagkojunzzb'); assert.equal(m.edge.length, 9);
  for (const f of m.edge) {
    assert.match(f.name, /^[a-z-]+$/);
    const sourceFile = 'supabase/functions/' + f.name + '/index.ts';
    const source = fs.readFileSync(path.join(h.root, sourceFile), 'utf8');
    assert.match(source, /if \(req\.method === 'OPTIONS'\)/);
    const startedAt = new Date().toISOString();
    try {
      const r = await fetch('https://mayvvlkvheagkojunzzb.supabase.co/functions/v1/' + f.name, {
        method: 'OPTIONS', redirect: 'error', signal: AbortSignal.timeout(15000),
        headers: { Origin: 'https://riovoley.com', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization, content-type' },
      });
      const body = Buffer.from(await r.arrayBuffer());
      const origin = r.headers.get('access-control-allow-origin');
      const allowedHeaders = (r.headers.get('access-control-allow-headers') || '').toLowerCase().split(',').map(s => s.trim());
      const corsAllowsBrowserRequest = ['*', 'https://riovoley.com'].includes(origin) && ['authorization', 'content-type'].every(s => allowedHeaders.includes(s));
      observations.push({ function: f.name, startedAt, finishedAt: new Date().toISOString(), status: r.status,
        bytes: body.length, bodySha256: sha(body), origin, allowedHeaders, corsAllowsBrowserRequest,
        passed: r.status >= 200 && r.status < 300 && corsAllowsBrowserRequest, sourceFile, sourceSha256: sha(Buffer.from(source)) });
    } catch (error) { observations.push({ function: f.name, startedAt, finishedAt: new Date().toISOString(), passed: false, errorCode: error.cause?.code || error.name }); }
  }
  const passed = observations.filter(o => o.passed).length;
  h.write('seguridad/edge-options-cloud.json', { at: new Date().toISOString(), observations, executed: observations.length, passed, failed: observations.length - passed,
    method: 'OPTIONS', credentialsSent: false, businessPostSent: false, businessRowsRead: false, providerDeliveryTested: false,
    scope: 'Managed HTTPS preflight only; may be answered by gateway. Does not prove handler execution, role authorization, allowed methods or business persistence.' });
  console.log(JSON.stringify({ cloudPreflights: observations.length, passed, failed: observations.length - passed, businessPostSent: false }));
  if (passed !== observations.length) process.exitCode = 1;
}

function report() {
  const c = read('CONTEXTO.json'), m = read('seguridad/metadatos-mcp-actuales.json'), b = read('seguridad/respaldos-administrados.json');
  const catalog = read('seguridad/catalogo-liberacion-actual.json'), old = read('seguridad/respaldo-logico-existente.json');
  const httpResult = read('seguridad/edge-options-cloud.json'), web = read('seguridad/https-publico-actual.json');
  const candidate = read('seguridad/artefactos-y-candidato.json'), ci = read('integracion/ci-commit-base.json');
  assert.equal(c.baseCommit, git(['rev-parse', 'HEAD']).trim()); assert.equal(ci.commit, c.baseCommit);
  const summary = { at: new Date().toISOString(), baseCommit: c.baseCommit, managedBackupReadExitCode: b.exitCode,
    managedRecoverablePointEstablished: b.recoverablePointEstablished, logicalBackupAgeHours: old.ageHoursAtCheck,
    fingerprint: m.fingerprint.value, rlsTables: catalog.rls, dailyRewardRpcPresent: catalog.dailyRewardRpcPresent,
    edgePreflight: { executed: httpResult.executed, passed: httpResult.passed, failed: httpResult.failed },
    publicGet: { executed: web.observations.length, passed: web.observations.filter(o => o.status === 200).length },
    advisorGroups: m.advisors, sqlArtifacts: candidate.sql.length, candidateFiles: candidate.candidateFiles,
    previousCi: { jest: ci.jest, url: ci.url, webBuildSucceeded: ci.webBuildSucceeded, rootAuditTotalVulnerabilities: ci.rootAuditTotalVulnerabilities },
    newBusinessTests: 0, newBuilds: 0, productionChanged: false, releaseReady: false, productionExecutionAuthorized: false };
  const doc = (name, value) => fs.writeFileSync(path.join(h.evidence, name), typeof value === 'string' ? value.trimEnd() + '\n' : JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
  doc('RESULTADOS_AUTOMATIZADOS.json', summary);
  const previous = '../20261109-152730-edge-fence-f0b89f4/';
  const rows = `| CT-01 | Preflight HTTPS Edge Cloud | ${httpResult.executed} | ${httpResult.passed} | ${httpResult.failed} | 0 | ${httpResult.failed ? 'FALLIDO' : 'APROBADO dentro de alcance CORS'} | [OPTIONS](seguridad/edge-options-cloud.json) |
| CT-02 | GET público, sin ejecutar JavaScript | ${web.observations.length} | ${summary.publicGet.passed} | ${web.observations.length - summary.publicGet.passed} | 0 | APROBADO HTTP | [GET](seguridad/https-publico-actual.json) |
| CT-03 | Consulta de respaldos gestionados | Sin denominador funcional | — | — | — | Consulta exitosa; recuperación BLOQUEADA | [CLI](seguridad/respaldos-administrados.meta.json), [datos](seguridad/respaldos-administrados.json) |
| CT-04 | Catálogo, RLS y avisos | Metadatos; no casos funcionales | — | — | — | Observado; avisos PENDIENTES | [Catálogo](seguridad/catalogo-liberacion-actual.json), [MCP](seguridad/metadatos-mcp-actuales.json) |
| CT-05 | Cuatro SQL y candidato de 39 archivos | Comparaciones SHA; no tests funcionales | — | — | — | Hashes comprobados | [Artefactos](seguridad/artefactos-y-candidato.json) |
| CT-06 | Jest/build del commit base, ejecutados antes de esta fase | 434 Jest / 91 suites | 434 | 0 | 0 | APROBADO, antecedente separado | [Recibo](integracion/ci-commit-base.json) |
| CT-07 | Nuevos Jest, Playwright, Android y builds | 0 | 0 | 0 | 0 | NO EJECUTADO aquí | [Antecedentes](${previous}INFORME_VERIFICACION_TECNICA.md) |`;
  doc('INFORME_VERIFICACION_TECNICA.md', `# Continuación de preparación: lectura institucional

RIOVOLEY, commit ${c.baseCommit}, contexto ${c.startedAt} UTC, Windows ${c.osRelease}, Node ${c.node}. Las consultas MCP previas al contexto se guardaron mediante proyección de campos técnicos; no se guardaron respuestas completas de cuentas. [Contexto](CONTEXTO.json), [metadatos](seguridad/metadatos-mcp-actuales.json).

Se ejecutaron comandos CLI de lectura y peticiones GET/OPTIONS sin autenticación. No hubo inicio de sesión institucional, POST funcionales, solicitudes de claves ni aplicación de SQL/despliegues. Las consultas de catálogo utilizaron BEGIN READ ONLY. El hash del catálogo cubre definiciones, políticas y ACL seleccionadas; no valida datos de negocio. [Consulta exacta](seguridad/catalog-fingerprint.sql), [comandos](COMANDOS.json).

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
${rows}

Las respuestas OPTIONS acreditan disponibilidad del preflight HTTPS y los encabezados de origen/cabeceras ensayados; el gateway puede responder antes del handler. No validan JWT, roles, métodos efectivos, entregas, scheduler ni persistencia. GET200 no valida navegación SPA ejecutada. No sumar ambos denominadores con las 434 pruebas previas o los 57 controles locales anteriores.

El catálogo mantiene ${m.fingerprint.value}; xp_ledger y login_rewards tienen RLS habilitado, no forzado, una política cada tabla. La RPC public.claim_daily_login_reward() sigue ausente. Los agregados de privilegios inspeccionados valen cero faltantes; no equivalen a una auditoría de todos los permisos o predicados.

Supabase conserva PostgreSQL ${m.project.databaseVersion} y estado ${m.project.status}. Los seis grupos de avisos tienen conteos ${m.advisors.map(a => a.count).join(', ')}; se superponen y no deben sumarse como vulnerabilidades únicas. ${m.advisors.map(a => `[${a.name}](${a.remediation})`).join('; ')}. No se corrigieron configuración Auth, extensión, permisos ni versión del motor.

Vercel observa el deployment ${m.vercel.observedDeployment.id}, ${m.vercel.observedDeployment.readyState}, commit ${m.vercel.observedDeployment.commit}, rama ${m.vercel.observedDeployment.branch}. Es distinto del candidato local; Node del proyecto ${m.vercel.nodeVersion}. No se atribuyen al despliegue los resultados de la rama de auditoría.

La CLI terminó con código ${b.exitCode}, pero backups es nulo, los metadatos físicos están vacíos y PITR está desactivado. No se estableció un punto gestionado recuperable. La copia lógica cifrada del ${old.createdAt} conserva su hash, con ${old.ageHoursAtCheck} horas de antigüedad al comprobarse; no se abrió ni restauró nuevamente. Eso no acredita vigencia al corte. [Respaldo lógico](seguridad/respaldo-logico-existente.json).

Se verificaron los cuatro SQL originales y las 39 copias del candidato corregido sin cambios. La preparación de evidencias conservó dos errores del lector: un campo JSON incorrecto y una ruta incompleta del retorno. Ambos se corrigieron a partir de la estructura observada, preservando el [incidente](seguridad/incidencia-lectura-manifiesto.json) y los registros del [primer intento](seguridad/artefactos-lectura.meta.json); el intento posterior terminó con código cero. No fueron fallos de flujos de negocio ni cambios institucionales. La ventana propuesta del 7 de noviembre ya caducó. Siguen pendientes respaldo vigente/restauración al corte, cobertura gestionada y control de escritores/clientes, además de calendario y aprobación específica. Proveedores/credenciales permanecen excluidos. No es una auditoría de penetración completa.

[Paquete actual](PAQUETE_ACTUAL_Y_PENDIENTES.md), [matriz](MATRIZ_VERIFICACIONES_TESIS.md), [texto académico](RESULTADOS_PARA_TESIS_4_5.md), [integridad](INTEGRIDAD.json), [privacidad](PRIVACIDAD.json), [sello](MANIFIESTO_SHA256.json).
`);
  doc('PAQUETE_ACTUAL_Y_PENDIENTES.md', `# Paquete actual y decisiones pendientes

Estado: NO INICIAR transición institucional. Responsable confirmado: titular de la sesión. Ventana anterior: caducada, sin sustitución automática. Este expediente no constituye aprobación ni activa mantenimiento.

| Componente | Identificación comprobada | Condición pendiente |
|---|---|---|
| Web candidato | ${c.baseCommit}; [CI](integracion/ci-commit-base.json) | Construir/promover solo tras aprobación del paquete concreto; CI sintético no es aceptación institucional |
| Web observada | ${m.vercel.observedDeployment.id}, ${m.vercel.observedDeployment.commit} | Conservar como referencia; retorno no ejecutado |
| SQL | [Cuatro hashes](seguridad/artefactos-y-candidato.json), catálogo ${m.fingerprint.value} | SQL original intacto; barrera SQL/Auth/Storage solo ensayada localmente, sin aislamiento gestionado activo |
| Edge candidato | 39 archivos, 28 TS actuales y 11 configuraciones previas; solo sync-mobile-device difiere del candidato anterior | [57 controles locales](${previous}INFORME_VERIFICACION_TECNICA.md); bundle/despliegue Cloud y flujo positivo gestionado pendientes |
| Edge retorno | Nueve hashes de metadatos coinciden con los registrados en el paquete de retorno | No se descargaron nuevamente bundles ni se ejecutó retorno gestionado |
| Recuperación | Hash cifrado correcto; antigüedad ${old.ageHoursAtCheck} horas | Punto vigente al corte y recuperación SQL/Storage/configuración no acreditados |
| Android | Compilaciones y ensayos anteriores conservan sus hashes/versiones | Desarrollo/pruebas; sin distribución ni compilación nueva aquí |
| Correo/push/scheduler | Preflight HTTPS observado; proveedores no invocados | Entrega y operación programada sin validar; tareas con claves excluidas por el usuario |

La ausencia de autorización no es el único impedimento. Primero deben resolverse los requisitos técnicos de respaldo y control de escrituras/clientes; después corresponde presentar y aprobar una ventana concreta. No modificar marcadores para saltar estos requisitos. Las propuestas SQL de retorno restablecen catálogo/permisos y no recuperan datos creados tras el corte.
`);
  const categories = ['Caso de uso de gamificación', 'Servicio público de gamificación', 'Identidad del atleta', 'Wallet y monedas', 'Tienda cosmética', 'Asistencia', 'Pagos', 'Compilación del proyecto'];
  doc('MATRIZ_VERIFICACIONES_TESIS.md', `# Matriz complementaria de trazabilidad

Las ocho categorías no tuvieron nuevos casos de negocio en esta fase. Sus archivos/cantidades originales constan en la [matriz funcional](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md).

| Categoría | Archivos relacionados | Casos nuevos | Resultado real | Tipo y dependencias | Limitación/evidencia |
|---|---|---|---|---|---|
${categories.map(n => `| ${n} | [Inventario anterior](../20261105-152944-notifications-cancel-e903a31/MATRIZ_VERIFICACIONES_TESIS.md) | 0 | NO EJECUTADO aquí | Lectura de metadatos no reemplaza tests | [Informe](INFORME_VERIFICACION_TECNICA.md) |`).join('\n')}

Complementos: ${httpResult.passed}/${httpResult.executed} preflights Cloud reales sin credenciales ni mocks y ${summary.publicGet.passed}/${summary.publicGet.executed} GET públicos. Archivos: refresh-cutover.cjs (OPTIONS) y read-public-transition.cjs (GET), evidencias [Cloud](seguridad/edge-options-cloud.json) y [web](seguridad/https-publico-actual.json). No se ejecutó Playwright o Android aquí. Catálogo/RLS/advisors son consultas reales de metadatos, con [resultados](seguridad/metadatos-mcp-actuales.json), sin denominador funcional ni autorización de cambio.
`);
  doc('RESULTADOS_PARA_TESIS_4_5.md', `# Propuesta complementaria para revisión académica

La revisión institucional de solo lectura obtuvo ${httpResult.passed} respuestas satisfactorias de ${httpResult.executed} preflights HTTPS de funciones Edge y ${summary.publicGet.passed} respuestas HTTP 200 de ${summary.publicGet.executed} recursos públicos, sin iniciar sesiones ni ejecutar operaciones funcionales de escritura ([preflights](seguridad/edge-options-cloud.json), [recursos públicos](seguridad/https-publico-actual.json)). Estos resultados comprueban el alcance de transporte y CORS ensayado; no acreditan ejecución del handler, autorización por rol, navegación con JavaScript o persistencia de negocio. La consulta del catálogo confirmó RLS habilitado en gamification.xp_ledger y gamification.login_rewards, mientras que la RPC pública de recompensa diaria continuó ausente ([catálogo](seguridad/catalogo-liberacion-actual.json)). Permanecen seis grupos superpuestos de avisos de seguridad y no se acreditó un respaldo vigente al corte ni un punto de recuperación gestionado ([metadatos](seguridad/metadatos-mcp-actuales.json), [respaldos](seguridad/respaldos-administrados.json)). Estas limitaciones impiden concluir que la transición institucional esté completada. No se incorporan resultados de usabilidad, motivación o capacidad de interacción.
`);
  console.log(JSON.stringify({ academicDocuments: 3, publicGet: summary.publicGet, cloudPreflight: summary.edgePreflight, releaseReady: false }));
}

async function seal() {
  const summary = read('RESULTADOS_AUTOMATIZADOS.json'); assert.equal(summary.releaseReady, false); assert.equal(summary.productionChanged, false);
  assert.equal(summary.baseCommit, git(['rev-parse', 'HEAD']).trim());
  const httpResult = read('seguridad/edge-options-cloud.json'), web = read('seguridad/https-publico-actual.json');
  assert.equal(httpResult.observations.length, 9); assert.equal(httpResult.executed, 9); assert.equal(httpResult.passed, 9); assert.equal(httpResult.failed, 0);
  assert.ok(httpResult.observations.every(o => o.passed && o.status >= 200 && o.status < 300 && o.corsAllowsBrowserRequest));
  for (const o of httpResult.observations) assert.equal(sha(fs.readFileSync(path.join(h.root, o.sourceFile))), o.sourceSha256);
  assert.deepEqual(summary.edgePreflight, { executed: 9, passed: 9, failed: 0 });
  assert.equal(web.observations.length, 4); assert.ok(web.observations.every(o => o.status === 200));
  assert.deepEqual(summary.publicGet, { executed: 4, passed: 4 });
  const catalog = read('seguridad/catalogo-liberacion-actual.json'), backups = read('seguridad/respaldos-administrados.json'), m = read('seguridad/metadatos-mcp-actuales.json');
  assert.equal(catalog.dailyRewardRpcPresent, false); assert.equal(catalog.rls.length, 2); assert.ok(catalog.rls.every(t => t.enabled && !t.forced && t.policies === 1));
  assert.equal(m.fingerprint.value, summary.fingerprint); assert.equal(m.fingerprint.toolIsError, false);
  assert.deepEqual(m.advisors.map(a => a.count), [19, 1, 17, 19, 1, 1]); assert.equal(m.edge.length, 9); assert.ok(m.edge.every(f => f.status === 'ACTIVE' && f.verifyJwt));
  assert.equal(backups.exitCode, 0); assert.equal(backups.responseRecognized, true); assert.equal(backups.backupsReturnedNull, true); assert.equal(backups.pitrEnabled, false);
  assert.equal(read('seguridad/respaldo-logico-existente.json').ciphertextMatchesReceipt, true);
  assert.equal(summary.previousCi.jest.passed, 434); assert.equal(summary.previousCi.jest.total, 434); assert.equal(summary.previousCi.jest.suites, 91);
  assert.equal(summary.previousCi.webBuildSucceeded, true); assert.equal(summary.previousCi.rootAuditTotalVulnerabilities, 0);
  const prior = walk(path.join(h.root, 'docs/tesis/evidencias')).filter(f => path.basename(f) === 'MANIFIESTO_SHA256.json');
  const historical = prior.flatMap(f => { const m = JSON.parse(fs.readFileSync(f)); return (m.entries || [...m.evidenceFiles || [], ...m.additionalTestSources || []]).map(e => ({ file: path.resolve(path.dirname(f), e.file), sha256: e.sha256 })); });
  let i = 0; await Promise.all(Array.from({ length: 12 }, async () => { while (i < historical.length) { const e = historical[i++]; assert.ok(e.file.startsWith(h.root + path.sep)); assert.equal(sha(await fs.promises.readFile(e.file)), e.sha256, 'HISTORICAL_EVIDENCE_CHANGED'); } }));
  const changed = [...new Set([...git(['diff', 'HEAD', '--name-only', '-z']).split('\0'), ...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0')].filter(Boolean))];
  const sources = changed.filter(f => !f.startsWith(rel(h.evidence) + '/'));
  assert.ok(sources.every(f => ['scripts/audit/production/refresh-cutover.cjs', 'docs/produccion/RUNBOOK.md'].includes(f)), 'UNEXPECTED_CHANGE');
  const selectedSources = h.write('FUENTES_EVALUADAS.json', { files: sources.map(file => ({ file, sha256: sha(fs.readFileSync(path.join(h.root, file))) })), productChanged: false, sqlChanged: false });
  const candidate = read('seguridad/artefactos-y-candidato.json'); assert.equal(candidate.candidateFiles, 39); assert.ok(candidate.candidateAllMatch); assert.ok(candidate.edgeReturnMetadataAllMatch); assert.equal(candidate.returnFilesMatching, 51);
  for (const f of candidate.sql) assert.equal(sha(fs.readFileSync(path.join(h.root, f.file))), f.sha256);
  const commands = walk(h.evidence).filter(f => f.endsWith('.meta.json')).map(f => ({ file: path.relative(h.evidence, f).replaceAll('\\', '/'), ...JSON.parse(fs.readFileSync(f)) }));
  const failed = commands.filter(c => c.exitCode !== 0);
  assert.equal(failed.length, 1); assert.equal(failed[0].file, 'seguridad/artefactos-lectura.meta.json'); assert.equal(failed[0].exitCode, 1);
  assert.match(fs.readFileSync(path.join(h.evidence, 'seguridad/artefactos-lectura.stderr.log'), 'utf8'), /ENOENT/);
  const attempts = commands.filter(c => c.file.startsWith('seguridad/artefactos-lectura')).sort((a, b) => a.start.localeCompare(b.start));
  assert.equal(attempts.at(-1).exitCode, 0); const selectedCommands = h.write('COMANDOS.json', { commands, selectedArtifactAttempt: attempts.at(-1).file });
  const known = new Set(), collect = (v, key = '') => { if (v && typeof v === 'object') for (const [k, val] of Object.entries(v)) collect(val, k); else if (typeof v === 'string' && v.length >= 12 && /password|secret|token|key/i.test(key)) known.add(v); };
  collect(JSON.parse(fs.readFileSync(path.join(h.runtime, 'credentials.json'))));
  for (const f of fs.readdirSync(h.root).filter(f => /^\.env(?:\.|$)/.test(f) && !f.includes('example'))) if (fs.statSync(path.join(h.root, f)).isFile()) for (const [key, val] of Object.entries(require('dotenv').parse(fs.readFileSync(path.join(h.root, f))))) if (/PASSWORD|TOKEN|SECRET|PRIVATE_KEY|PII_ENCRYPTION_KEY|PHONE|EMAIL/.test(key) && val.length >= 8) known.add(val);
  const files = [...walk(h.evidence), ...sources.map(f => path.join(h.root, f))]; let links = 0;
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8'); assert.ok(![...known].some(v => text.includes(v)), 'PRIVATE_VALUE');
    assert.ok(!/eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}|sb_secret_[A-Za-z0-9_-]{20,}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text), 'PRIVATE_PATTERN');
    if (file.endsWith('.md')) for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (/^https?:\/\//.test(match[1])) continue; const target = path.resolve(path.dirname(file), match[1].split('#')[0]);
      if (!['COMANDOS.json', 'INTEGRIDAD.json', 'PRIVACIDAD.json', 'MANIFIESTO_SHA256.json'].includes(path.basename(target))) assert.ok(fs.existsSync(target), 'BROKEN_LINK'); links++;
    }
  }
  h.write('PRIVACIDAD.json', { at: new Date().toISOString(), filesChecked: files.length, issues: 0, credentialValuesRequested: false, businessRowsPublished: false, scope: 'Current evidence/changed sources; known values and bounded patterns, not universal guarantee.' });
  h.write('INTEGRIDAD.json', { at: new Date().toISOString(), priorManifests: prior.length, priorEntries: historical.length, priorEntriesMatching: true, linksChecked: links, brokenLinks: 0, privacyIssues: 0,
    selectedSourceManifest: path.relative(h.evidence, selectedSources).replaceAll('\\', '/'), selectedCommandManifest: path.relative(h.evidence, selectedCommands).replaceAll('\\', '/'),
    priorClosureFailure: 'seguridad/incidencia-enlace-con-ancla.json', productChanged: false, productionChanged: false, releaseReady: false });
  const entries = walk(h.evidence).map(f => ({ file: path.relative(h.evidence, f).replaceAll('\\', '/'), bytes: fs.statSync(f).size, sha256: sha(fs.readFileSync(f)) })).sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json'), JSON.stringify({ at: new Date().toISOString(), baseCommit: summary.baseCommit, algorithm: 'SHA-256', entries }, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ sealed: true, entries: entries.length, priorManifests: prior.length, priorEntries: historical.length, productionChanged: false }));
}
Promise.resolve().then(() => ({ artifacts, http, report, seal }[process.argv[2]] || (() => { throw Error('Use artifacts, http, report or seal'); }))()).catch(error => { console.error(error.message); process.exitCode = 1; });
