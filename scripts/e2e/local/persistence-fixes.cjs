const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const h = require('./harness.cjs');
require('./safety.cjs').readLocal();
(async () => {
  const report = JSON.parse(fs.readFileSync(path.join(h.evidence, 'mutaciones-confirmadas/resultados.json')));
  const start = new Date(report.stats.startTime).toISOString();
  const end = new Date(Date.parse(start) + report.stats.duration).toISOString();
  const result = await h.sql('persistencia-siete-flujos', `SELECT coalesce(jsonb_agg(x),'[]'::jsonb) FROM (SELECT s.id AS student_id,(SELECT count(*) FROM billing.payments p WHERE p.student_id=s.id) AS payments,(SELECT jsonb_agg(p.monto) FROM billing.payments p WHERE p.student_id=s.id) AS amounts,(SELECT count(*) FROM training.attendances a WHERE a.student_id=s.id) AS attendances FROM core.students s JOIN core.users u ON u.id=s.user_id WHERE u.nombre LIKE 'E2E%' AND u.created_at >= '${start}'::timestamptz AND u.created_at <= '${end}'::timestamptz) x;`);
  const rows = JSON.parse(result.stdout.trim());
  assert.equal(rows.length, 7);
  for (const row of rows) { assert.equal(row.payments, 1); assert.equal(row.attendances, 1); assert.deepEqual(row.amounts, [35]); }
  h.write('persistencia-siete-flujos.json', { observedAt:new Date().toISOString(), run:'mutaciones-confirmadas', start,end, students:rows.length,passed:rows.length, rows, scope:'SELECT sobre PostgreSQL local real; filas creadas dentro de la ventana del run final, sin nombres, correos ni contraseñas.' });
  console.log('Siete estudiantes, siete pagos de 35 y siete asistencias persistidos en PostgreSQL local.');
})();
