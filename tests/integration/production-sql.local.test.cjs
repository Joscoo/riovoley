const {test,before,after}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const h=require('../../scripts/audit/production/sql-context.cjs');
const {connectLab,withActor,maintenance}=require('../../scripts/audit/production/sql-lab.cjs');
const {returnSQL}=require('../../scripts/audit/production/sql-packet.cjs');
const snapshot=JSON.parse(fs.readFileSync(path.join(h.privateDir,'catalog.json'))),pc=JSON.parse(fs.readFileSync(path.join(h.privateDir,'preconditions.json'))),packet=JSON.parse(fs.readFileSync(path.join(h.privateDir,'packet.json')));
const fingerprintSQL=fs.readFileSync(path.join(h.root,'scripts/audit/production/catalog-fingerprint.sql'),'utf8'),forward=fs.readFileSync(path.join(h.root,packet.forward),'utf8');
const id=()=>crypto.randomUUID(),actors={admin:id(),trainer:id(),athlete:id(),other:id(),suspended:id()},student=id(),otherStudent=id(),payment=id();let db,backward,applied;
async function rejectedSQL(sql,pattern){await assert.rejects(db.query(sql),pattern);await db.query('ROLLBACK');}
async function actorQuery(actor,query,params=[],role='authenticated'){return withActor(db,actor,c=>c.query(query,params),role);}
const fp=async()=> (await db.query(fingerprintSQL)).rows[0].fingerprint;
before(async()=>{
 db=await connectLab();
 await db.query('BEGIN');
 try{
 for(const [name,user] of Object.entries(actors)){
  const role=name==='admin'?'administrador':name==='trainer'?'entrenador':'estudiante';
  await db.query("INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,'{}')",[user,name+'-'+user+'@example.test']);
  await db.query("INSERT INTO core.users(id,email,nombre,apellido,role,suspended) VALUES($1,$2,'Ensayo','SQL',$3,$4)",[user,name+'-'+user+'@example.test',role,name==='suspended']);
 }
 await db.query("INSERT INTO training.training_categories(code,label) VALUES('ensayo','Ensayo') ON CONFLICT(code) DO NOTHING");
 await db.query("INSERT INTO core.students(id,user_id,categoria,fecha_nacimiento) VALUES($1,$2,'ensayo','2008-01-01'),($3,$4,'ensayo','2008-01-01')",[student,actors.athlete,otherStudent,actors.other]);
 await db.query("INSERT INTO billing.membership_types(id,code,nombre,costo) VALUES(1,'ensayo','Ensayo',30) ON CONFLICT(id) DO NOTHING");
 await db.query("INSERT INTO billing.payments(id,student_id,monto,fecha_pago,membership_type_id) VALUES($1,$2,30,CURRENT_DATE,1)",[payment,student]);
 await db.query("INSERT INTO gamification.currency_wallets(student_id,balance,total_earned,total_spent) VALUES($1,100,100,0)",[student]);
 await db.query("INSERT INTO gamification.cosmetic_items_catalog(slug,name,description,category,price_coins,metadata) VALUES('sql-frame','Ensayo','Ensayo','frame',20,'{\"unlockType\":\"purchase\"}'),('sql-locked','Ensayo','Ensayo','badge',10,'{\"unlockType\":\"level\",\"unlockTarget\":5}') ON CONFLICT(slug) DO NOTHING");
 await db.query('COMMIT');
 }catch(e){await db.query('ROLLBACK');throw e;}
});
after(async()=>{if(db)await db.end();});
test('P01: reconstrucción conserva la huella de catálogos antes del cambio',async()=>assert.equal(await fp(),pc.fingerprint));
test('P02: el avance rechaza ausencia de marcadores operativos',async()=>rejectedSQL(forward,/pendiente de autorizacion/));
test('P02a: el avance rechaza un ejecutor distinto del propietario previsto',async()=>{
 await db.query('BEGIN');await db.query('SET LOCAL ROLE authenticated');await rejectedSQL(forward,/Ejecutar como postgres/);
});
test('P03: deriva de función impide el avance; se restaura la definición original',async()=>{
 await maintenance(db);await db.query("ALTER FUNCTION public.calculate_payment_state(date) SET search_path='pg_catalog'");
 await rejectedSQL(forward,/Deriva del catalogo/);
 await db.query(snapshot.functions.find(f=>f.name==='calculate_payment_state').definition);assert.equal(await fp(),pc.fingerprint);
});
test('P03a: deriva de vista se rechaza aunque conserve columnas y opciones',async()=>{
 const v=snapshot.views.find(v=>v.schema==='public'&&v.name==='users');
 await db.query('BEGIN');await db.query('CREATE OR REPLACE VIEW public.users WITH(security_invoker=true) AS SELECT * FROM ('+v.definition.trim().replace(/;$/,'')+') original WHERE false');
 await rejectedSQL(forward,/Deriva del catalogo/);assert.equal(await fp(),pc.fingerprint);
});
test('P03b: deriva de permisos de tabla se rechaza',async()=>{
 await db.query('BEGIN');await db.query('REVOKE SELECT ON core.users FROM authenticated');
 await rejectedSQL(forward,/Deriva del catalogo/);assert.equal(await fp(),pc.fingerprint);
});
test('P03c: deshabilitar un trigger invalida la huella',async()=>{
 const t=snapshot.triggers.find(t=>t.schema==='core'&&t.table==='users');
 await db.query('BEGIN');await db.query('ALTER TABLE core.users DISABLE TRIGGER '+require('../../scripts/e2e/local/schema.cjs').qi(t.name));
 await rejectedSQL(forward,/Deriva del catalogo/);assert.equal(await fp(),pc.fingerprint);
});
test('P03d: cambiar literales del CHECK normalizado se rechaza',async()=>{
 await db.query('BEGIN');await db.query("ALTER TABLE public_content.announcements DROP CONSTRAINT announcements_priority_check;ALTER TABLE public_content.announcements ADD CONSTRAINT announcements_priority_check CHECK(priority IN ('low','normal'))");
 await rejectedSQL(forward,/Deriva del catalogo/);assert.equal(await fp(),pc.fingerprint);
});
test('P03e: cambiar ACL predeterminadas del propietario se rechaza',async()=>{
 await db.query('BEGIN');await db.query('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM authenticated');
 await rejectedSQL(forward,/Deriva del catalogo/);assert.equal(await fp(),pc.fingerprint);
});
test('P04: duplicados de identidad abortan sin crear la RPC',async()=>{
 const duplicate=id();await db.query("INSERT INTO core.students(id,user_id,fecha_nacimiento) VALUES($1,$2,'2008-01-01')",[duplicate,actors.athlete]);
 await rejectedSQL(forward,/Identidades duplicadas/);assert.equal((await db.query("SELECT to_regprocedure('public.claim_daily_login_reward()') IS NULL AS absent")).rows[0].absent,true);
 await db.query('DELETE FROM core.students WHERE id=$1',[duplicate]);
});
test('P05: referencias diarias nulas impiden crear el índice',async()=>{
 const xp=id();await db.query("INSERT INTO gamification.xp_ledger(id,student_id,source_type,source_ref,xp_delta,label) VALUES($1,$2,'daily_login',NULL,8,'Ensayo')",[xp,student]);
 await rejectedSQL(forward,/XP diario sin fecha/);await db.query('DELETE FROM gamification.xp_ledger WHERE id=$1',[xp]);
});
test('P06: aplicación real y generación del retorno desde ACL capturadas',async()=>{
 await db.query(forward);applied=await fp();assert.notEqual(applied,pc.fingerprint);
 backward=returnSQL(snapshot,pc,fingerprintSQL,applied);
 const relative=packet.forward.replace(/_riovoley_security_production_proposal\.sql$/,'_riovoley_security_return_proposal.sql');
 const previous=path.join(h.root,relative);
 const attempt=String(fs.readdirSync(path.join(h.read().evidence,'seguridad')).filter(f=>/^paquete-ensayado.*\.json$/.test(f)).length+1).padStart(2,'0');
 if(fs.existsSync(previous)&&fs.readFileSync(previous,'utf8')!==backward)h.write('seguridad/retorno-previo-ensayo-'+attempt+'.sql',fs.readFileSync(previous,'utf8'));
 fs.writeFileSync(previous,backward);
 h.write('seguridad/paquete-ensayado-'+attempt+'.json',{...packet,return:relative,appliedFingerprint:applied,forwardSha256:crypto.createHash('sha256').update(forward).digest('hex'),returnSha256:crypto.createHash('sha256').update(backward).digest('hex'),productionApplied:false});
});
test('P07: cero funciones de aplicación sin search_path explícito',async()=>{
 const rows=(await db.query("SELECT n.nspname,p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname=ANY($1) AND p.prokind='f' AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e') AND NOT EXISTS(SELECT 1 FROM unnest(p.proconfig) x WHERE x LIKE 'search_path=%')",[snapshot.schemas])).rows;assert.deepEqual(rows,[]);
});
test('P08: anon no ejecuta premio, pagos ni inserción administrativa',async()=>{
 for(const signature of ['public.claim_daily_login_reward()','public.soft_delete_payment(uuid)','public.restore_payment(uuid)','public.admin_insert_user(uuid,text,text,text,text,date,text)'])assert.equal((await db.query("SELECT has_function_privilege('anon',$1,'EXECUTE') AS allowed",[signature])).rows[0].allowed,false);
 await assert.rejects(actorQuery(null,'SELECT public.claim_daily_login_reward()',[],'anon'),e=>e.code==='42501');
});
test('P09: atleta no modifica su rol ni su XP directamente',async()=>{
 await assert.rejects(actorQuery(actors.athlete,"UPDATE core.users SET role='administrador' WHERE id=$1",[actors.athlete]),e=>e.code==='42501');
 await assert.rejects(actorQuery(actors.athlete,"INSERT INTO gamification.xp_ledger(student_id,source_type,xp_delta,label) VALUES($1,'manual',999,'Ensayo')",[student]),e=>e.code==='42501');
});
test('P10: entrenador activo borra lógicamente y restaura pago UUID con auditoría',async()=>{
 const a=await actorQuery(actors.trainer,'SELECT public.soft_delete_payment($1::uuid) AS ok',[payment]);assert.equal(a.rows[0].ok,true);
 assert.ok((await db.query('SELECT deleted_at FROM billing.payments WHERE id=$1',[payment])).rows[0].deleted_at);
 assert.equal((await actorQuery(actors.trainer,'SELECT public.restore_payment($1::uuid) AS ok',[payment])).rows[0].ok,true);
 assert.equal((await db.query('SELECT deleted_at FROM billing.payments WHERE id=$1',[payment])).rows[0].deleted_at,null);
 assert.ok(Number((await db.query("SELECT count(*) AS n FROM audit.payments_audit WHERE payment_id=$1 AND action='UPDATE'",[payment])).rows[0].n)>=2);
});
test('P11: atleta y usuario suspendido no ejecutan pagos administrativos',async()=>{
 for(const actor of [actors.athlete,actors.suspended])await assert.rejects(actorQuery(actor,'SELECT public.soft_delete_payment($1::uuid)',[payment]),e=>e.code==='42501');
});
test('P12: firmas bigint renombradas sin ejecución web',async()=>{
 for(const n of ['soft_delete_payment','restore_payment']){assert.equal((await db.query('SELECT to_regprocedure($1) IS NULL AS absent',[`public.${n}(bigint)`])).rows[0].absent,true);assert.equal((await db.query("SELECT has_function_privilege('authenticated',$1,'EXECUTE') AS allowed",[`public.${n}_legacy_bigint(bigint)`])).rows[0].allowed,false);}
});
test('P13: premio diario persiste 8 XP una vez y usa fecha de Ecuador',async()=>{
 const a=(await actorQuery(actors.athlete,'SELECT public.claim_daily_login_reward() AS reward')).rows[0].reward;
 assert.equal(a.awarded,true);assert.equal(a.xpDelta,8);
 const b=(await actorQuery(actors.athlete,'SELECT public.claim_daily_login_reward() AS reward')).rows[0].reward;assert.equal(b.awarded,false);assert.equal(b.xpDelta,0);
 const r=(await db.query("SELECT count(*)::int AS n,sum(xp_delta)::int AS xp,min(source_ref) AS day FROM gamification.xp_ledger WHERE student_id=$1 AND source_type='daily_login'",[student])).rows[0];assert.equal(r.n,1);assert.equal(r.xp,8);assert.equal(r.day,(await db.query("SELECT (now() AT TIME ZONE 'America/Guayaquil')::date::text AS day")).rows[0].day);
});
test('P14: seis peticiones concurrentes conceden exactamente una recompensa',async()=>{
 const clients=await Promise.all(Array.from({length:6},()=>connectLab()));
 try{const results=await Promise.all(clients.map(c=>withActor(c,actors.other,x=>x.query('SELECT public.claim_daily_login_reward() AS reward'))));assert.equal(results.filter(x=>x.rows[0].reward.awarded).length,1);assert.equal((await db.query("SELECT count(*)::int AS n,sum(xp_delta)::int AS xp FROM gamification.xp_ledger WHERE student_id=$1 AND source_type='daily_login'",[otherStudent])).rows[0].xp,8);}finally{await Promise.all(clients.map(c=>c.end()));}
});
test('P15: suspensión deniega recompensa y compra mediante SECURITY DEFINER',async()=>{
 await db.query('UPDATE core.users SET suspended=true WHERE id=$1',[actors.athlete]);
 try{await assert.rejects(actorQuery(actors.athlete,'SELECT public.claim_daily_login_reward()'),e=>e.code==='42501');await assert.rejects(actorQuery(actors.athlete,"SELECT public.purchase_gamification_item($1,'sql-frame')",[student]),e=>e.code==='42501');}finally{await db.query('UPDATE core.users SET suspended=false WHERE id=$1',[actors.athlete]);}
});
test('P16: compra, equipamiento y desequipamiento legítimos persisten',async()=>{
 assert.equal((await actorQuery(actors.athlete,"SELECT public.purchase_gamification_item($1,'sql-frame') AS result",[student])).rows[0].result.ok,true);
 assert.equal((await db.query('SELECT balance FROM gamification.currency_wallets WHERE student_id=$1',[student])).rows[0].balance,80);
 await actorQuery(actors.athlete,"SELECT public.equip_gamification_item($1,'sql-frame')",[student]);assert.equal((await db.query('SELECT frame_item_slug FROM gamification.student_cosmetic_equipment WHERE student_id=$1',[student])).rows[0].frame_item_slug,'sql-frame');
 await actorQuery(actors.athlete,"SELECT public.unequip_gamification_item($1,'frame')",[student]);assert.equal((await db.query('SELECT frame_item_slug FROM gamification.student_cosmetic_equipment WHERE student_id=$1',[student])).rows[0].frame_item_slug,null);
});
test('P17: cosmético bloqueado revierte saldo e historial de compra',async()=>{
 await assert.rejects(actorQuery(actors.athlete,"SELECT public.purchase_gamification_item($1,'sql-locked')",[student]),e=>e.code==='42501');assert.equal((await db.query('SELECT balance FROM gamification.currency_wallets WHERE student_id=$1',[student])).rows[0].balance,80);
 assert.equal((await db.query("SELECT count(*)::int AS n FROM gamification.currency_ledger WHERE student_id=$1 AND source_ref='sql-locked'",[student])).rows[0].n,0);
});
test('P18: atleta ajeno no compra con wallet de otro estudiante',async()=>{
 await assert.rejects(actorQuery(actors.other,"SELECT public.purchase_gamification_item($1,'sql-locked')",[student]),/not_allowed/);
});
test('P19: sincronización del personal conserva gasto realizado',async()=>{
 await actorQuery(actors.trainer,'UPDATE gamification.currency_wallets SET total_earned=150,total_spent=0,balance=150 WHERE student_id=$1',[student]);
 const r=(await db.query('SELECT balance,total_earned,total_spent FROM gamification.currency_wallets WHERE student_id=$1',[student])).rows[0];assert.deepEqual(r,{balance:130,total_earned:150,total_spent:20});
});
test('P20: entrenador puede suspender y reactivar atleta; no promoverlo',async()=>{
 assert.equal((await actorQuery(actors.trainer,'UPDATE core.users SET suspended=true WHERE id=$1',[actors.other])).rowCount,1);
 await actorQuery(actors.trainer,'UPDATE core.users SET suspended=false WHERE id=$1',[actors.other]);
 await assert.rejects(actorQuery(actors.trainer,"UPDATE core.users SET role='administrador' WHERE id=$1",[actors.other]),e=>e.code==='42501');
});
test('P21: administrador activo conserva inserción administrativa',async()=>{
 const user=id();await db.query("INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES($1,$2,'{}')",[user,user+'@example.test']);
 const r=await actorQuery(actors.admin,"SELECT * FROM public.admin_insert_user($1,$2,'estudiante','Ensayo','SQL',NULL,NULL)",[user,user+'@example.test']);assert.equal(r.rowCount,1);
 assert.equal((await db.query('SELECT role FROM core.users WHERE id=$1',[user])).rows[0].role,'estudiante');
});
test('P22: retorno ejecuta DDL real y recupera huella original sin borrar XP',async()=>{
 assert.equal(await fp(),applied);await db.query(backward);assert.equal(await fp(),pc.fingerprint);
 assert.equal((await db.query("SELECT count(*)::int AS n FROM gamification.xp_ledger WHERE source_type='daily_login' AND student_id=ANY($1::uuid[])",[[student,otherStudent]])).rows[0].n,2);
 assert.equal((await db.query("SELECT has_schema_privilege('authenticated','security','USAGE') AS allowed")).rows[0].allowed,pc.preconditions.security_schema_authenticated_usage);
});
test('P23: reaplicación tras retorno conserva idempotencia y datos generados',async()=>{
 await db.query(forward);assert.equal(await fp(),applied);
 assert.equal((await actorQuery(actors.athlete,'SELECT public.claim_daily_login_reward() AS reward')).rows[0].reward.awarded,false);
 const count=fs.readdirSync(path.join(h.read().evidence,'integracion')).filter(f=>f.startsWith('estado-final')).length;
 const name='integracion/estado-final-'+String(count+1).padStart(2,'0')+'.json';
 h.write(name,{baselineFingerprint:pc.fingerprint,appliedFingerprint:applied,returnExecuted:true,reapplied:true,productionChanged:false,persistence:'PostgreSQL local real',authentication:'Contexto JWT simulado mediante SET LOCAL ROLE y request.jwt.claims; sin login HTTP'});
});
