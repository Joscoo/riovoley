const fs = require('node:fs');
const path = require('node:path');
const h = require('./harness.cjs');
const { dockerArgs, localDockerEnv } = require('./safety.cjs');
const cp = require('node:child_process');
(async () => {
  await h.run('arnes-final', process.execPath, ['--test', ...['safety', 'schema', 'loopback', 'evidence'].map(name => 'scripts/e2e/local/' + name + '.test.cjs')]);
  await h.run('versiones-node', process.execPath, ['--version']);
  await h.run('versiones-npm', process.execPath, [path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), '--version']);
  await h.run('rls-local', 'docker', ['exec', '-i', h.container, 'psql', '-X', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'], { input: fs.readFileSync(path.join(h.root, 'database/tests/rls_access_matrix.sql'), 'utf8') });
  const bindings = ['db', 'kong', 'inbucket'].map(service => {
    const name = 'supabase_' + service + '_' + h.projectId;
    const data = JSON.parse(cp.execFileSync('docker', dockerArgs(['inspect', name, '--format', '{{json .HostConfig.PortBindings}}']), { env: localDockerEnv(), encoding: 'utf8', windowsHide: true }));
    if (!Object.values(data).flat().every(binding => binding.HostIp === '127.0.0.1')) throw new Error('Puerto no limitado a loopback');
    return { service, bindings: data };
  });
  h.write('bindings-locales.json', { observedAt: new Date().toISOString(), results: bindings });
})();
