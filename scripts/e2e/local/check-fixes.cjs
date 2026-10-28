const path = require('node:path');
const h = require('./harness.cjs');
const mode = process.argv[2] || 'focused';
const args = [path.join(h.root, 'node_modules/react-scripts/bin/react-scripts.js'), 'test', '--watchAll=false', '--runInBand', '--json', '--outputFile=' + path.join(h.evidence, 'jest-' + mode + '.json')];
if (mode.startsWith('coverage')) args.push('--coverage', '--coverageDirectory=' + path.join(h.evidence, 'cobertura'));
else if (mode !== 'all') args.push('--runTestsByPath', 'src/shared/ui/SortableHeader.test.js');
h.run('jest-' + mode, process.execPath, args, { env: { ...process.env, CI: 'true' }, allowFailure: true }).then(r => { process.exitCode = r.exitCode; });
