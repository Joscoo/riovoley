const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
const {connect}=require('../security/local-db.cjs');
const read=file=>JSON.parse(fs.readFileSync(path.join(h.evidence,file),'utf8'));
const query=`WITH created AS (
 SELECT s.id FROM core.students s JOIN core.users u ON u.id=s.user_id
 WHERE u.nombre ~ '^E2E[0-9a-f]{12}$' AND u.apellido='Flow'
 AND u.created_at >= $1::timestamptz AND u.created_at <= $2::timestamptz
)
SELECT (SELECT count(*)::int FROM created) AS students,
 (SELECT count(*)::int FROM billing.payments WHERE student_id IN (SELECT id FROM created) AND deleted_at IS NULL) AS payments,
 (SELECT count(*)::int FROM billing.payments WHERE student_id IN (SELECT id FROM created) AND deleted_at IS NULL AND monto=35) AS paymentsWithExpectedAmount,
 (SELECT count(*)::int FROM training.attendances WHERE student_id IN (SELECT id FROM created)) AS attendances`;
(async()=>{
 const meta=read('mutaciones-reanudadas/ejecucion.meta.json');
 const db=await connect();
 try{
  await db.query('BEGIN READ ONLY');
  const readonly=(await db.query('SHOW transaction_read_only')).rows[0].transaction_read_only;
  assert.equal(readonly,'on');
  const result=await db.query(query,[meta.start,meta.end]);
  const counts=result.rows[0];
  h.write('integracion/persistencia-postgresql.json',{recordedAt:new Date().toISOString(),scope:'Consulta agregada de solo lectura sobre las altas sintéticas de la ventana exacta del flujo E2E. Control complementario; no añade casos al denominador Playwright.',readOnly:readonly,window:{start:meta.start,end:meta.end},query,counts});
  assert.deepEqual(counts,{students:7,payments:7,paymentswithexpectedamount:7,attendances:7});
  await db.query('COMMIT');
  console.log(JSON.stringify({state:'APROBADO',counts,readOnly:true}));
 }finally{await db.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
