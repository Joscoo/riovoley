'use strict';
// Read-only inspection. This tool has no deployment, SQL, restore or key-entry path.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..'), runtime = path.join(root, '.e2e-local');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const git = args => cp.execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const relative = file => path.relative(root, file).replaceAll('\\', '/');
const project = 'mayvvlkvheagkojunzzb';
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

function initialize() {
  const commit = git(['rev-parse', 'HEAD']);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const evidence = path.join(root, 'docs/tesis/evidencias/verificacion-tecnica', stamp + '-prerrequisitos-corte-' + commit.slice(0, 7));
  assert.ok(!fs.existsSync(evidence));
  for (const dir of ['unitarias', 'integracion', 'e2e', 'compilacion-web', 'android', 'seguridad']) fs.mkdirSync(path.join(evidence, dir), { recursive: true });
  const previous = fs.readFileSync(path.join(runtime, 'evidence-dir.txt'), 'utf8').trim();
  fs.writeFileSync(path.join(evidence, 'CONTEXTO.json'), JSON.stringify({ startedAt: new Date().toISOString(), baseCommit: commit,
    priorEvidence: relative(previous), projectId: project, platform: process.platform, architecture: process.arch,
    node: process.version, osRelease: require('node:os').release(), initialGitStatus: git(['status', '--short']),
    productionChanged: false, credentialValuesRequested: false, newFunctionalTests: false }, null, 2) + '\n', { flag: 'wx' });
  fs.writeFileSync(path.join(runtime, 'evidence-dir.txt'), evidence + '\n');
  console.log(relative(evidence));
}

function context() {
  const evidence = fs.readFileSync(path.join(runtime, 'evidence-dir.txt'), 'utf8').trim();
  assert.ok(evidence.startsWith(path.join(root, 'docs/tesis/evidencias/verificacion-tecnica') + path.sep));
  assert.match(path.basename(evidence), /^\d{8}-\d{6}-prerrequisitos-corte-[a-f0-9]{7}$/);
  assert.ok(!fs.existsSync(path.join(evidence, 'MANIFIESTO_SHA256.json')), 'SEALED_PACKET');
  return evidence;
}

function collect() {
  const evidence = context();
  const write = (name, value) => fs.writeFileSync(path.join(evidence, name), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
  const cli = path.join(runtime, 'tools/node_modules/@supabase/cli-windows-x64/bin/supabase.exe');
  assert.ok(fs.existsSync(cli), 'CLI_NOT_AVAILABLE');
  const args = ['backups', 'list', '--project-ref', project, '--output', 'json'];
  const start = new Date();
  const r = cp.spawnSync(cli, args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 55000, input: '', maxBuffer: 4 * 1024 * 1024 });
  const finishedAt = new Date().toISOString();
  let data;
  try { data = JSON.parse(r.stdout); } catch { /* Preserve failure without publishing raw diagnostics. */ }
  const privateDir = path.join(runtime, 'cutover-prerequisites', path.basename(evidence));
  fs.mkdirSync(privateDir, { recursive: true });
  fs.writeFileSync(path.join(privateDir, 'cli-private.json'), JSON.stringify({ stdout: r.stdout, stderr: r.stderr, errorCode: r.error?.code }), { flag: 'wx' });
  const valid = r.status === 0 && data && Object.hasOwn(data, 'backups') && typeof data.pitr_enabled === 'boolean';
  const physical = data?.physical_backup_data;
  const result = { projectId: project, startedAt: start.toISOString(), finishedAt, exitCode: r.status,
    errorCode: r.error?.code || null, responseRecognized: Boolean(valid),
    backupsReturnedNull: valid ? data.backups === null : null,
    listedBackupCount: valid && Array.isArray(data.backups) ? data.backups.length : null,
    physicalRecoveryMetadataEmpty: valid && physical && typeof physical === 'object' ? Object.keys(physical).length === 0 : null,
    pitrEnabled: valid ? data.pitr_enabled : null, walgEnabled: valid ? data.walg_enabled === true : null,
    recoverablePointEstablished: false, restoreAttempted: false, newBackupCreated: false,
    state: valid ? 'CONSULTA_APROBADA' : 'CONSULTA_BLOQUEADA',
    note: 'Null is not an empty backup array. WAL-G enabled does not establish a usable recovery point; no restore was attempted.' };
  write('seguridad/respaldos-administrados.json', result);
  write('seguridad/respaldos-administrados.meta.json', { command: [relative(cli), ...args], start: start.toISOString(), end: finishedAt,
    durationSeconds: (Date.now() - start) / 1000, exitCode: r.status, errorCode: r.error?.code || null,
    stdout: 'Projected fields in respaldos-administrados.json; raw output retained privately.', stderr: 'Private; no raw authentication or provider diagnostics published.' });
  const backup = json(path.join(runtime, 'institutional-backup/artifacts/20261101-025806-728619b0/receipt.json'));
  const archive = path.resolve(backup.archive);
  assert.ok(archive.startsWith(runtime + path.sep), 'ARCHIVE_OUTSIDE_PRIVATE_RUNTIME');
  const matches = hash(fs.readFileSync(archive)) === backup.sha256;
  write('seguridad/respaldo-logico-existente.json', { checkedAt: new Date().toISOString(), createdAt: backup.finishedAt,
    encryptedBytes: backup.bytes, ciphertextMatchesReceipt: matches,
    ageHoursAtCheck: Math.round((Date.now() - Date.parse(backup.finishedAt)) / 3600000 * 100) / 100,
    archiveUnlocked: false, newRestorePerformed: false, currentCutoffFreshnessEstablished: false });
  assert.ok(matches, 'ENCRYPTED_ARCHIVE_CHANGED');
  const targets = [
    ['REST/RPC', 'src/features/gamification/infrastructure/repositories/supabaseGamificationRepository.js', /supabase\.rpc\('claim_daily_login_reward'\)/],
    ['Auth', 'src/features/account-admin/infrastructure/repositories/supabaseAccountAdminRepository.js', /supabase\.auth\.updateUser\(/],
    ['Storage', 'src/features/reporting/infrastructure/repositories/supabaseReportingRepository.js', /supabase\.storage\.from\(bucket\)\.createSignedUrl/],
    ['Edge correo', 'src/features/communications/infrastructure/repositories/supabaseCommunicationsRepository.js', /supabase\.functions\.invoke\('send-email'/],
    ['Edge dispositivos', 'src/shared/infrastructure/mobile/supabaseMobileDeviceRepository.js', /supabase\.functions\.invoke\('sync-mobile-device'/],
    ['Edge push', 'src/shared/infrastructure/mobile/supabasePushNotificationGateway.js', /supabase\.functions\.invoke\('send-push'/],
    ['Marcador de ventana', 'scripts/audit/production/sql-lab.cjs', /async function maintenance\(db\)/]
  ];
  const references = targets.map(([channel, file, expression]) => {
    const bytes = fs.readFileSync(path.join(root, file)), lines = bytes.toString('utf8').split(/\r?\n/);
    const line = lines.findIndex(text => expression.test(text)) + 1;
    assert.ok(line > 0, 'SOURCE_REFERENCE_DRIFT: ' + file);
    return { channel, file, line, sha256: hash(bytes), executed: false };
  });
  write('seguridad/canales-cliente-revisados.json', { checkedAt: new Date().toISOString(), references,
    scope: 'Selected static source references, not exhaustive API inventory or real channel blocking test. Storage reference is a signed-URL operation, not proof of an object upload.',
    productionTrafficBlocked: false, globalWriteGateDemonstrated: false, productionWritesAttempted: false });
  console.log(JSON.stringify({ queryExitCode: r.status, queryRecognized: Boolean(valid), backupsNull: result.backupsReturnedNull,
    physicalRecoveryMetadataEmpty: result.physicalRecoveryMetadataEmpty, pitrEnabled: result.pitrEnabled,
    ciphertextMatches: matches, staticReferences: references.length, productionChanged: false }));
  if (!valid) process.exitCode = 1;
}

if (process.argv[2] === 'init') initialize();
else if (process.argv[2] === 'collect') collect();
else throw Error('Use init or collect; no mutation command is implemented.');
