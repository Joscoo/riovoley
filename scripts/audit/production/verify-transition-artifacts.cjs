'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), cp = require('node:child_process'), assert = require('node:assert/strict');
const h = require('../../e2e/local/harness.cjs'), read = name => JSON.parse(fs.readFileSync(path.join(h.evidence, name), 'utf8'));
const json = file => JSON.parse(fs.readFileSync(path.join(h.root, file), 'utf8'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const fileHash = file => sha(fs.readFileSync(path.join(h.root, file)));
assert.ok(!fs.existsSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json')), 'NEW_EVIDENCE_REQUIRED');
const baseline = 'docs/tesis/evidencias/verificacion-tecnica/20261104-201230-continuacion-produccion-d9cdfb7';
const sql = json(baseline + '/seguridad/sql-cuatro-archivos-revalidados.json').files.map(file => ({ file: file.file, sha256: fileHash(file.file), matchesReviewed: fileHash(file.file) === file.sha256 }));
const fingerprint = read('seguridad/supabase-catalogo-actual.json').fingerprint;
assert.equal(fingerprint, '15b9d9e869fb5113263c485714009878', 'CATALOG_DRIFT_REQUIRES_NEW_REVIEW');
assert.ok(sql.every(f => f.matchesReviewed), 'SQL_PROPOSAL_CHANGED');
const packet = json('.e2e-local/edge-production/packet.json'), cloud = read('seguridad/edge-hashes-metadatos-actuales.json');
const packetRoot = path.resolve(h.root, packet.candidateDirectory); assert.ok(packetRoot.startsWith(h.runtime + path.sep), 'CANDIDATE_OUTSIDE_PRIVATE_RUNTIME');
const files = packet.candidateFiles.map(file => ({ file: file.file, privateHashMatches: fileHash(packet.candidateDirectory + '/' + file.file) === file.sha256,
  repositoryFilePresent: fs.existsSync(path.join(h.root, file.file)),
  sourceMatchesAfterLfNormalization: file.file.endsWith('.ts') ? fs.readFileSync(path.join(h.root, packet.candidateDirectory, file.file), 'utf8').replace(/\r\n/g, '\n') === fs.readFileSync(path.join(h.root, file.file), 'utf8').replace(/\r\n/g, '\n') : null }));
const edge = cloud.functions.map(f => { const previous = packet.functions.find(p => p.slug === f.slug); return { ...f,
  matchesPreparedReturnHash: f.cloudBundleSha256 === previous?.cloudBundleSha256,
  currentMetadataOnly: true, returnSources: previous?.returnSourceFiles.length }; });
h.write('seguridad/artefactos-sql-edge-verificados.json', { checkedAt: new Date().toISOString(), fingerprint, sql, edge, candidateFiles: files,
  rawCloudBytesDownloaded: false, scope: 'Archivos privados se comparan con manifiesto previo; TS contra repositorio solo tras normalizar CRLF. Metadatos SHA Cloud contra hash de retorno preparado, sin desplegar.' });
assert.ok(files.every(f => f.privateHashMatches), 'PRIVATE_EDGE_PACKET_CHANGED');
assert.ok(files.filter(f => f.file.endsWith('.ts')).every(f => f.sourceMatchesAfterLfNormalization), 'EDGE_CANDIDATE_SOURCE_CHANGED');
assert.ok(edge.every(f => f.matchesPreparedReturnHash && f.verifyJwt && f.status === 'ACTIVE'), 'EDGE_RETURN_METADATA_DRIFT');
const native = json('.e2e-local/native-local-current.json'), apk = json(path.relative(h.root, native.work).replaceAll('\\', '/') + '/receipt.json');
assert.equal(fileHash(apk.privateApk), apk.sha256, 'APK_CHANGED');
h.write('android/apk-existente-verificado.json', { checkedAt: new Date().toISOString(), sourceCommit: apk.sourceCommit, sha256: apk.sha256, bytes: apk.bytes,
  currentBytesMatchReceipt: true, debug: apk.debuggable, signatureWasVerifiedAtBuild: apk.signatureVerified, newBuild: false, newNativeExecution: false,
  referenceEvidence: '../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md' });
const backup = json('.e2e-local/institutional-backup/artifacts/20261101-025806-728619b0/receipt.json');
const archive = path.resolve(backup.archive); assert.ok(archive.startsWith(h.runtime + path.sep));
const archiveSha = sha(fs.readFileSync(archive)); assert.equal(archiveSha, backup.sha256, 'ENCRYPTED_BACKUP_CHANGED');
const storage = json('.e2e-local/institutional-storage/20261101161426-b27061d3/receipt.json');
h.write('seguridad/respaldos-recibos-actuales.json', { checkedAt: new Date().toISOString(), sql: { createdAt: backup.finishedAt, statusAtCreation: backup.status,
  ciphertextBytes: backup.bytes, ciphertextHashMatchesReceipt: true, ageHours: Math.round((Date.now() - Date.parse(backup.finishedAt)) / 3600000 * 100) / 100 },
  storage: { createdAt: storage.finishedAt, statusAtCreation: storage.status, objectsAtCreation: storage.completedObjects, bytesAtCreation: storage.downloadedBytes,
    encryptedManifestWasVerified: storage.encryptedManifestVerified, isolatedBytesWereVerified: storage.allRecoveredObjectHashesMatch, managedStorageApiRestoreVerified: storage.isolatedSupabaseStorageApiRestored },
  freshBackupPerformed: false, archiveUnlocked: false, newRestorePerformed: false,
  restoreEvidence: '../20261101-030216-restore-institucional-63826e6/RESULTADOS_AUTOMATIZADOS.json',
  scope: 'Integridad actual del ciphertext SQL y lectura de recibos historicos; no prueba vigencia de datos para una ventana futura ni nuevo descifrado/restauracion.' });
const candidate = read('CONTEXTO.json').baseCommit;
const ci = JSON.parse(cp.execFileSync('gh', ['run', 'view', '42059792014', '--json', 'headSha,status,conclusion,url,jobs'], { cwd: h.root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
assert.equal(ci.headSha, candidate); assert.equal(ci.conclusion, 'success');
const ciReceipt = json('.e2e-local/operational-readiness/github-ci-d2b43e4-verified.json');
h.write('integracion/ci-candidato-verificado.json', { checkedAt: new Date().toISOString(), commit: ci.headSha, conclusion: ci.conclusion, url: ci.url,
  recordedJest: ciReceipt.summary.jest, recordedWebBuildSucceeded: ciReceipt.summary.webBuildSucceeded,
  newCiExecution: false, newJestExecution: false, previousNativeWasLocal: true });
console.log(JSON.stringify({ sqlHashes: sql.length, edgeMetadataHashes: edge.length, edgeCandidateFiles: files.length, privateFilesMatching: files.filter(f => f.privateHashMatches).length, apkHashMatches: true, encryptedSqlHashMatches: true, candidateCi: ci.conclusion }));
