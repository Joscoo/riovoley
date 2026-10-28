const h = require('./harness.cjs');
require('./safety.cjs').readLocal();
(async () => {
  const r = await h.sql('persistencia-flujos-ui', `SELECT jsonb_build_object('observed_at',CURRENT_TIMESTAMP,'flows',(SELECT coalesce(jsonb_agg(x),'[]'::jsonb) FROM (SELECT s.id AS student_id,(SELECT count(*) FROM billing.payments p WHERE p.student_id=s.id) AS payments,(SELECT coalesce(jsonb_agg(a.fecha),'[]'::jsonb) FROM training.attendances a WHERE a.student_id=s.id) AS attendance_dates FROM core.students s JOIN core.users u ON u.id=s.user_id WHERE u.nombre LIKE 'E2E%') x));`);
  h.write('persistencia-flujos-ui.json',JSON.parse(r.stdout.trim()));
  console.log(r.stdout.trim());
})();
