const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {createClient}=require('@supabase/supabase-js');
const {readLocal,assertLocalTarget}=require('./safety.cjs');
const {ql}=require('./schema.cjs');
const h=require('./harness.cjs');
function statements(text) {
  const result=[];let start=0,quote=false,dollar=null,line=false,block=false;
  for(let i=0;i<text.length;i++) {
    const c=text[i],next=text[i+1];
    if(line) {if(c==='\n') line=false;continue;}
    if(block) {if(c==='*'&&next==='/'){block=false;i++;}continue;}
    if(dollar) {if(text.startsWith(dollar,i)){i+=dollar.length-1;dollar=null;}continue;}
    if(quote) {if(c==="'"&&next==="'")i++;else if(c==="'")quote=false;continue;}
    if(c==='-'&&next==='-'){line=true;i++;continue;}
    if(c==='/'&&next==='*'){block=true;i++;continue;}
    if(c==="'"){quote=true;continue;}
    if(c==='$'){const m=text.slice(i).match(/^\$[A-Za-z_0-9]*\$/);if(m){dollar=m[0];i+=dollar.length-1;}continue;}
    if(c===';'){result.push(text.slice(start,i+1));start=i+1;}
  }
  return result;
}
async function seed() {
  const local=readLocal();assertLocalTarget(local.apiUrl);
  local.accounts ||= {};
  for(const role of ['admin','trainer','student']) local.accounts[role] ||= {email:`e2e.${role}@example.test`,password:crypto.randomBytes(24).toString('base64url')+'Aa1!'};
  fs.writeFileSync(path.join(h.runtime,'credentials.json'),JSON.stringify(local,null,2));
  const admin=createClient(local.apiUrl,local.serviceRoleKey,{auth:{autoRefreshToken:false,persistSession:false}});
  const listed=await admin.auth.admin.listUsers({page:1,perPage:1000});
  if(listed.error) throw listed.error;
  const fixtures=[
    {key:'admin',role:'administrador',nombre:'Administrador',apellido:'Pruebas'},
    {key:'trainer',role:'entrenador',nombre:'Entrenador',apellido:'Pruebas'},
    {key:'student',role:'estudiante',nombre:'Atleta',apellido:'Pruebas'},
    ...Array.from({length:7},(_,i)=>({key:'fixture'+i,role:'estudiante',nombre:'Fixture'+(i+1),apellido:'Auditoria'})),
  ];
  for(const fixture of fixtures) {
    const account=local.accounts[fixture.key] ||= {email:`e2e.${fixture.key}@example.test`,password:crypto.randomBytes(24).toString('base64url')+'Aa1!'};
    let user=listed.data.users.find(u=>u.email===account.email);
    if(!user) {
      const created=await admin.auth.admin.createUser({email:account.email,password:account.password,email_confirm:true,user_metadata:{role:fixture.role,full_name:fixture.nombre+' '+fixture.apellido}});
      if(created.error) throw new Error('Crear cuenta local '+fixture.key+': '+created.error.message);
      user=created.data.user;
    }
    account.userId=user.id; Object.assign(fixture,{id:user.id,email:account.email});
    fs.writeFileSync(path.join(h.runtime,'credentials.json'),JSON.stringify(local,null,2));
  }
  const catalogFiles=fs.readdirSync(path.join(h.root,'database')).filter(f=>/gamification/.test(f)&&/phase\d+/.test(f)).sort((a,b)=>Number(a.match(/phase(\d+)/)[1])-Number(b.match(/phase(\d+)/)[1]));
  catalogFiles.push('add_training_categories_catalog_schema_2026_05_21.sql','reporting_phase33_persistent_reports_2026_06_19.sql');
  const catalogSql=[];
  for(const file of catalogFiles) {
    for(const statement of statements(fs.readFileSync(path.join(h.root,'database',file),'utf8'))) {
      const clean=statement.replace(/--[^\n]*|\/\*[\s\S]*?\*\//g,'').trim();
      if(/^insert\s+into\s+(?:gamification\.(?:achievement_catalog|challenges_catalog|titles_catalog|cosmetic_items_catalog|athlete_stages_catalog|campaigns_catalog|hidden_rewards_catalog)|training\.training_categories|public\.report_definitions)\b/i.test(clean)) catalogSql.push(statement);
    }
  }
  await h.sql('seed-catalogos','BEGIN;\n'+catalogSql.join('\n')+'\nCOMMIT;');
  const sql=['BEGIN;','SET search_path = public, extensions;'];
  sql.push("INSERT INTO billing.membership_types(id,code,nombre,costo,active) VALUES (1,'normal','Mensualidad normal',35,true),(2,'grupo','Mensualidad en grupo',32.50,true) ON CONFLICT (id) DO UPDATE SET code=excluded.code,nombre=excluded.nombre,costo=excluded.costo;",
    "INSERT INTO billing.payment_types(id,nombre,descripcion,precio) VALUES (1,'mensualidad','Fixture de mensualidad',35),(2,'pago_diario','Fixture diario',3),(3,'tarjeta','Fixture tarjeta',3) ON CONFLICT (id) DO UPDATE SET nombre=excluded.nombre;",
    "SELECT setval('billing.membership_types_id_seq',GREATEST((SELECT max(id) FROM billing.membership_types),1));",
    "SELECT setval('billing.payment_types_id_seq',GREATEST((SELECT max(id) FROM billing.payment_types),1));");
  const categories=['iniciacion_hombres','iniciacion_mujeres','perfeccionamiento_hombres','perfeccionamiento_mujeres','master_hombres','master_mujeres','open_gym'];
  for(const category of categories) sql.push(`INSERT INTO training.training_categories(code,label,is_active,for_schedules,for_students) VALUES (${ql(category)},${ql(category)},true,true,true) ON CONFLICT(code) DO NOTHING;`);
  let index=0;
  for(const fixture of fixtures) {
    sql.push(`INSERT INTO core.users(id,email,role,nombre,apellido,fecha_nacimiento,first_login,suspended) VALUES (${ql(fixture.id)},${ql(fixture.email)},${ql(fixture.role)},${ql(fixture.nombre)},${ql(fixture.apellido)},'2008-01-15',false,false) ON CONFLICT(id) DO UPDATE SET role=excluded.role,nombre=excluded.nombre,apellido=excluded.apellido,first_login=false,suspended=false;`,
      `INSERT INTO profiles.user_profiles(id,full_name,role) VALUES (${ql(fixture.id)},${ql(fixture.nombre+' '+fixture.apellido)},${ql(fixture.role)}) ON CONFLICT(id) DO UPDATE SET role=excluded.role,full_name=excluded.full_name;`);
    if(fixture.role!=='estudiante') continue;
    const studentId='eeee0000-0000-4000-8000-'+String(index+1).padStart(12,'0');
    fixture.studentId=studentId;
    const membershipId=index===7?2:1;
    const amount=index===7?32.50:35;
    sql.push(`INSERT INTO core.students(id,user_id,categoria,fecha_nacimiento,fecha_ingreso) VALUES (${ql(studentId)},${ql(fixture.id)},${ql(categories[index%6])},'2008-01-15',CURRENT_DATE-90) ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id,categoria=excluded.categoria;`,
      `INSERT INTO billing.payments(id,student_id,membership_type_id,fecha_pago,fecha_inicio,fecha_fin,monto,estado) VALUES ('eeee1000-0000-4000-8000-${String(index+1).padStart(12,'0')}',${ql(studentId)},${membershipId},CURRENT_DATE,CURRENT_DATE,CURRENT_DATE+29,${amount},'activo') ON CONFLICT(id) DO UPDATE SET membership_type_id=excluded.membership_type_id,monto=excluded.monto;`,
      `INSERT INTO training.attendances(id,student_id,fecha,metodo_pago_id) VALUES ('eeee2000-0000-4000-8000-${String(index+1).padStart(12,'0')}',${ql(studentId)},CURRENT_DATE,1) ON CONFLICT(id) DO NOTHING;`,
      `INSERT INTO training.physical_tests(id,student_id,estatura,peso,fecha_test,brazo_extend_inicial,brazo_extend_sin_impulso,brazo_extend_con_impulso,fuerza_explosiva_salto_largo,fuerza_abdomen,fuerza_brazos,fuerza_piernas,elevaciones_barra,observaciones) VALUES ('eeee3000-0000-4000-8000-${String(index+1).padStart(12,'0')}',${ql(studentId)},1.65,58,CURRENT_DATE,200,240,250,180,20,15,30,3,'Datos ficticios para E2E') ON CONFLICT(id) DO NOTHING;`);
    index++;
  }
  for(let i=0;i<categories.length;i++) sql.push(`INSERT INTO training.schedules(id,dia_semana,hora_inicio,hora_fin,categoria,descripcion) VALUES (${9000+i},${ql(i%2?'martes':'lunes')},'16:00','18:00',${ql(categories[i])},'Horario ficticio E2E') ON CONFLICT(id) DO NOTHING;`);
  sql.push(`INSERT INTO public_content.announcements(id,title,content,priority,target_audience,is_active,created_by) VALUES ('eeee4000-0000-4000-8000-000000000001','Comunicado de prueba E2E','Contenido ficticio de auditoria','normal',ARRAY['all'],true,${ql(fixtures[0].id)}) ON CONFLICT(id) DO NOTHING;`,
    "INSERT INTO storage.buckets(id,name,public) VALUES ('profile-images','profile-images',true),('report-artifacts','report-artifacts',false) ON CONFLICT(id) DO NOTHING;",
    "SELECT setval('training.schedules_id_seq',GREATEST((SELECT max(id) FROM training.schedules),1));", "NOTIFY pgrst, 'reload schema';",'COMMIT;');
  await h.sql('seed-negocio',sql.join('\n'));
  local.fixtures=fixtures.map(f=>({key:f.key,userId:f.id,studentId:f.studentId}));
  fs.writeFileSync(path.join(h.runtime,'credentials.json'),JSON.stringify(local,null,2));
  h.write('seed-resumen.json',{createdAt:new Date().toISOString(),accounts:fixtures.length,students:index,catalogStatements:catalogSql.length,data:'Solo fixtures creados localmente. No se copió ninguna fila institucional.',roles:['administrador','entrenador','estudiante'],api:'http://127.0.0.1:55321'});
  console.log('Seed local listo: '+fixtures.length+' cuentas ficticias y '+index+' estudiantes');
}
if(require.main===module) seed().catch(e=>{console.error(require('./safety.cjs').redact(e.message));process.exitCode=1;});
module.exports={seed,statements};
