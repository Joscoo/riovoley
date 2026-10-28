const fs = require('node:fs');
const path = require('node:path');
const { evidence } = require('./harness.cjs');
const { redact } = require('./safety.cjs');
function specs(s) { return [...(s.specs || []), ...(s.suites || []).flatMap(specs)]; }
for (const label of process.argv.slice(2)) {
  const r = JSON.parse(fs.readFileSync(path.join(evidence, label, 'resultados.json')));
  console.log(JSON.stringify({ label, stats: r.stats, failures: r.suites.flatMap(specs).flatMap(s => s.tests.filter(t => t.status !== 'expected').map(t => ({ title:s.title, project:t.projectName, error:redact(t.results.at(-1)?.error?.message?.slice(0,600)), location:t.results.at(-1)?.error?.stack?.match(/admin\.happy-path-controlled\.spec\.js:\d+:\d+/)?.[0] }))) }));
}
