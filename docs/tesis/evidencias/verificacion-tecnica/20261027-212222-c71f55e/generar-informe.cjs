const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const a=require('./auditar.cjs');
const read=f=>JSON.parse(fs.readFileSync(path.join(a.out,f),'utf8'));
const text=f=>fs.readFileSync(path.join(a.out,f),'utf8');
const src=f=>path.relative(a.out,path.join(a.root,f)).replaceAll('\\','/');
const link=f=>`[${f}](${f})`;
const sourceLink=f=>`[${f}](${src(f)})`;
const fmt=n=>String(n).replace('.',',');
const j=read('unitarias/jest-resultados.json');
const c=read('integracion/contratos-resultados.json');
const extra=read('integracion/adicionales-resultados.json');
const pw=read('e2e/resultados.json');
const cov=read('unitarias/coverage/coverage-summary.json');
const inv=read('inventario.json');
const cat=read('seguridad/catalogos-rls.json');
const advisors=read('seguridad/asesores.json');
const b=read('compilacion-web/build.meta.json');
const u=read('unitarias/jest.meta.json');
const e=read('e2e/playwright.meta.json');
const buildFiles=read('compilacion-web/artefactos.json');
const commit=text('commit.stdout.log').trim();
const now=new Date().toISOString();
function specs(s) { return (s.specs||[]).concat((s.suites||[]).flatMap(specs)); }
const pCases=pw.suites.flatMap(specs).flatMap(s=>s.tests.map(t=>({file:s.file,title:s.title,project:t.projectName,status:t.status,results:t.results.map(r=>({status:r.status,duration:r.duration,attachments:r.attachments}))})));
const cases=j.testResults.flatMap(s=>s.assertionResults.map(t=>({file:path.relative(a.root,s.name).replaceAll('\\','/'),title:t.title,fullName:t.fullName,status:t.status,durationMs:t.duration})));
const extraCases=extra.testResults.flatMap(s=>s.assertionResults.map(t=>({file:path.relative(a.root,s.name).replaceAll('\\','/'),title:t.title,status:t.status,durationMs:t.duration})));
const count=(list)=>({executed:list.filter(t=>!['pending','todo','skipped'].includes(t.status)).length,passed:list.filter(t=>['passed','expected'].includes(t.status)).length,failed:list.filter(t=>['failed','unexpected'].includes(t.status)).length,skipped:list.filter(t=>['pending','todo','skipped'].includes(t.status)).length});
const originalInventory=JSON.parse(text('e2e/inventario.stdout.log'));
const initialCases=originalInventory.suites.flatMap(specs).flatMap(s=>s.tests.map(t=>({file:s.file,title:s.title,project:t.projectName})));
const safeFiles=['auth.password-recovery.spec.js','public.navigation-accessibility.spec.js','responsive.smoke.spec.js'];
const blocked=initialCases.filter(t=>!safeFiles.includes(t.file)||/role dashboards responsive/.test(t.title));
a.write('unitarias/casos-detallados.json',cases);
a.write('integracion/casos-adicionales.json',extraCases);
a.write('e2e/casos-detallados.json',pCases);
a.write('e2e/casos-bloqueados.json',{classification:'BLOQUEADO; no ejecutado ni omitido por Playwright',reason:'Backend de producción confirmado por el usuario; no se confirmó un entorno aislado con cuentas descartables. El login puede escribir actividad y recompensa diaria.',inventoryOnly:true,cases:blocked});
const groups={};
for(const t of cases) {
  const key=t.file.match(/^src\/features\/([^/]+)/)?.[1] || (t.file.startsWith('src/shared/')?'shared':t.file==='src/App.test.js'?'App (placeholder)':'config/utils');
  (groups[key] ||= []).push(t);
}
a.write('unitarias/resumen-modulos.json',Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,{suites:new Set(v.map(t=>t.file)).size,...count(v)}])));
const auditNames=['npm-audit','npm-audit-functions','npm-audit-riovoley'];
const audits=auditNames.map(name=>({name,...JSON.parse(text('seguridad/'+name+'.stdout.log'))}));
audits.forEach(x=>a.write('seguridad/'+x.name+'.json',x));
const metaFiles=a.walk(a.out).filter(f=>f.endsWith('.meta.json'));
const metas=metaFiles.map(file=>({file:path.relative(a.out,file).replaceAll('\\','/'),...JSON.parse(fs.readFileSync(file))}));
a.write('comandos-ejecutados.json',metas);
const gp='src/features/gamification/';
const core=gp+'application/useCases/createGamificationUseCases.test.js';
const foundation=gp+'application/useCases/createGamificationFoundationUseCases.test.js';
const service=gp+'presentation/createGamificationService.test.js';
const categories=[
  {name:'1. Caso de uso de gamificación', select:t=>[core,foundation,gp+'application/useCases/createGamificationAdminUseCases.test.js'].includes(t.file),type:'Unitarias de aplicación',mock:'Repositorios, dependencias de reloj y notificaciones simulados',limit:'Persistir significa llamadas a repositorios simulados; no confirma transacciones reales. Los escenarios no agotan los límites de nivel ni las combinaciones de retos.'},
  {name:'2. Servicio público de gamificación',select:t=>t.file===service,type:'Unitaria de fachada JavaScript',mock:'Casos de uso sustituidos con jest.fn',limit:'Servicio público significa API exportada de la feature; no demuestra un endpoint HTTP público ni acceso anónimo al backend.'},
  {name:'3. Identidad del atleta',select:t=>/IdentityPortrait\.test|StudentProfileIdentityCard\.test/.test(t.file)||(t.file===core&&/identity|avatar|identidad/i.test(t.title)),type:'Unitarias y componentes',mock:'Repositorios/datos de identidad y acciones simulados; DOM de jsdom',limit:'No prueba subida real a Storage, permisos del bucket ni persistencia de fotografía/título.'},
  {name:'4. Wallet y monedas',select:t=>[core,foundation,service].includes(t.file)&&/wallet|currency|monedas/i.test(t.title),type:'Unitarias de proyección y fachada',mock:'Repositorios o casos de uso simulados',limit:'Verifica formato y proyección; saldo y transacciones reales, concurrencia y restricciones de escritura quedan pendientes.'},
  {name:'5. Tienda cosmética',select:t=>([core,service].includes(t.file)&&/cosmetic|cosmetico|cosmeticos|cosmetics|equipCosmetic|unequipCosmetic/i.test(t.title))||/cosmeticVisuals\.test/.test(t.file),type:'Unitarias de compra/equipamiento y presentación',mock:'Compra y equipamiento delegados a repositorio simulado; catálogo de fixtures',limit:'No ejecuta la RPC de compra ni prueba el descuento atómico de monedas en PostgreSQL.'},
  {name:'6. Asistencia',select:t=>t.file.startsWith('src/features/attendance/'),type:'Unitarias de caso de uso, servicio y adaptador',mock:'Supabase/repositorios, gamificación y notificaciones simulados',limit:'La sincronización existente comprueba llamadas; la prueba adicional I-01 conecta el motor real con memoria, sin PostgreSQL.'},
  {name:'7. Pagos',select:t=>t.file.startsWith('src/features/payments/'),type:'Unitarias de caso de uso, servicio y adaptador',mock:'Supabase, notificaciones, comunicaciones y gamificación simulados',limit:'No modifica pagos institucionales, valida pasarelas de cobro ni ejecuta triggers reales. I-01 comprueba recalculado local.'},
];
for(const k of categories) { k.cases=cases.filter(k.select); k.files=[...new Set(k.cases.map(t=>t.file))]; k.result=count(k.cases); delete k.select; }
a.write('trazabilidad-casos.json',categories);
const covTable=['lines','statements','functions','branches'].map(k=>`| ${k} | ${cov.total[k].covered} | ${cov.total[k].total} | ${fmt(cov.total[k].pct)} % |`).join('\n');
const moduleTable=Object.entries(groups).sort().map(([name,list])=>`| ${name} | ${new Set(list.map(t=>t.file)).size} | ${list.length} | ${count(list).passed} | ${count(list).failed} | ${count(list).skipped} |`).join('\n');
const pwGroup=f=>count(pCases.filter(t=>t.file===f));
const nRls=cat.tables.filter(t=>t.rls).length;
const inventoryCoverage=Object.keys(cov).length-1;
const focus=cat.tables.filter(t=>t.schema==='gamification'&&['xp_ledger','login_rewards'].includes(t.table));
const checks=[
 ['U-01','Jest/Testing Library (83 suites)',j.numTotalTests,j.numPassedTests,j.numFailedTests,j.numPendingTests,'APROBADO','unitarias/jest-resultados.json'],
 ['U-02','Node test runner: autenticación y correo Edge',10,10,0,0,'APROBADO (mocks)','unitarias/auth-edge.stdout.log'],
 ['C-01','Script de contratos: 2 suites; subconjunto de U-01',c.numTotalTests,c.numPassedTests,c.numFailedTests,c.numPendingTests,'APROBADO (mocks)','integracion/contratos-resultados.json'],
 ['I-01','Integración local adicional (1 suite)',extra.numTotalTests,extra.numPassedTests,extra.numFailedTests,extra.numPendingTests,'APROBADO (memoria)','integracion/adicionales-resultados.json'],
 ['I-02','HTTP local /health: dos servicios',2,2,0,0,'APROBADO (sin backend)','integracion/health-resultados.json'],
 ...[['E-01','Responsive público','responsive.smoke.spec.js'],['E-02','Navegación pública y teclado','public.navigation-accessibility.spec.js'],['E-03','Recuperación Auth simulada','auth.password-recovery.spec.js'],['E-04','Denegación explícita para sesión anónima','audit.protected-routes.spec.js']].map(([id,name,file])=>{const v=pwGroup(file);return [id,name,v.executed,v.passed,v.failed,v.skipped,v.failed?'FALLIDO':'APROBADO (red aislada)','e2e/resultados.json'];}),
 ['E-05',`Roles, navegación y filtros: ${blocked.length} instancias inventariadas`,0,0,0,0,'BLOQUEADO','e2e/casos-bloqueados.json'],
 ['B-01','Compilación web (1 comando; no son casos de prueba)','—','—','—','—',b.exitCode===0?'APROBADO':'FALLIDO','compilacion-web/build.meta.json'],
 ['AN-01','Java, Gradle --version y Capacitor doctor (diagnóstico)','—','—','—','—','APROBADO (solo diagnóstico)','android/capacitor-doctor.stdout.log'],
 ['AN-02','Sincronización, APK/AAB y dispositivo',0,0,0,0,'NO EJECUTADO','android/alcance.json'],
 ['S-01','RLS y existencia de política en dos tablas objetivo',focus.length,focus.filter(t=>t.rls&&t.policy_count>0).length,focus.filter(t=>!t.rls||!t.policy_count).length,0,'APROBADO (configuración)','seguridad/catalogos-rls.json'],
 ['S-02','Revisión de políticas, grants, vistas y funciones','—','—','—','—','EJECUTADO CON HALLAZGOS','seguridad/funciones-permisos.json'],
 ['S-03','Asesor de seguridad Supabase (1 consulta)','—','—','—','—','EJECUTADO CON HALLAZGOS','seguridad/asesores.json'],
 ['S-04','npm audit en raíz, functions y riovoley (3 comandos)','—','—','—','—','FALLIDO (alertas)','seguridad/npm-audit.json'],
];
a.write('resumen-verificaciones.json',{generatedAt:now,commit,baselineJest:count(cases),additionalJest:count(extraCases),playwright:count(pCases),blockedE2E:blocked.length,coverage:cov.total,checks:checks.map(x=>({code:x[0],verification:x[1],executed:x[2],passed:x[3],failed:x[4],skipped:x[5],status:x[6],evidence:x[7]}))});
const resultTable=checks.map(x=>'| '+x.slice(0,7).join(' | ')+' | '+link(x[7])+' |').join('\n');
const commandTable=metas.map(m=>`| ${m.command.join(' ').replaceAll('|','\\|').replaceAll('\n',' ')} | ${m.cwd} | ${m.exitCode} | ${fmt(m.durationSeconds)} | ${link(m.file)} |`).join('\n');
const auditTable=audits.map(x=>`| ${x.name} | ${x.metadata.vulnerabilities.low} | ${x.metadata.vulnerabilities.moderate} | ${x.metadata.vulnerabilities.high} | ${x.metadata.vulnerabilities.critical} | ${x.metadata.vulnerabilities.total} | ${link('seguridad/'+x.name+'.json')} |`).join('\n');
const advisorTable=advisors.lints.map(l=>`| ${l.name} | ${l.level} | ${l.count} |`).join('\n');
const gamRows=[
 ['XP y acumulación','16 casos del motor + integración I-01','Cálculos derivados; I-01 verifica movimientos base de 35 XP por asistencia, 90 por pago y 100 por test. No es persistencia real.'],
 ['Niveles y progreso','Motor: deriva progreso y persiste perfil/proyecciones','Hay aserciones de XP positivo, nivel numérico y progreso no negativo. Cobertura parcial: no se prueban todos los umbrales de nivel.'],
 ['Historial XP','Foundation: loadXpLedger; repositorio: replaceXpLedger; I-01','Formateo, fuentes y deduplicación lógica; llamadas a Supabase simuladas.'],
 ['Rachas','Motor: deriva progreso','Comprueba weekdayAttendanceStreak = 1 en el fixture. No agota fechas límite, zonas horarias ni concurrencia.'],
 ['Logros','Motor: deriva progreso / persiste proyecciones','Verifica first_test, first_payment y logros bloqueados; catálogo y escritura simulados.'],
 ['Retos y campañas','Motor: deriva progreso; administración de gamificación','Proyección de retos/campañas y llamadas de reemplazo; cobertura parcial de metas y ventanas temporales.'],
 ['Clasificación por categoría','Motor: ranking derivado y priorización de categoría; repositorio','Ranking a partir de fixtures y parámetros de consulta; sin snapshots reales.'],
 ['Identidad, título y avatar','Casos de identidad y componentes; categoría 3 de la matriz','Actualización y opciones visuales deterministas con datos ficticios; sin Storage real.'],
 ['Wallet y monedas','Foundation y motor; categoría 4; I-01','Formato y proyecciones en memoria; no valida inmutabilidad del saldo ni seguridad de escritura.'],
 ['Compra cosmética','Motor y servicio: purchaseCosmeticItem','Delegación y bloqueo de prestigio no desbloqueado; RPC y débito real pendientes.'],
 ['Equipar/desequipar','Motor y servicio: equipCosmeticItem/unequipCosmeticItem','Delegación sin recargar el agregado completo; inventario simulado.'],
 ['Recompensa diaria','Foundation: 3 casos; servicio; I-01','Premia 8 XP, no duplica en el mismo día y omite usuario sin estudiante. Persistencia simulada o en memoria.'],
 ['Asistencia → gamificación','19 casos de aplicación de asistencia + I-01','Mocks en U-01; I-01 conecta registro y motor reales, verifica XP y evita duplicación al actualizar.'],
 ['Pagos → gamificación','18 casos de aplicación de pagos + I-01','Mocks en U-01; I-01 verifica registro/modificación y una única fuente de pago en memoria.'],
 ['Evaluación física → gamificación','6 casos de aplicación física + I-01','U-01 comprueba la llamada; I-01 verifica creación/modificación y movimiento base único en memoria.'],
];
const findings=`### Hallazgos y alcance de seguridad

Se consultaron metadatos mediante SELECT y el asesor de seguridad; no se leyeron filas de atletas, pagos, credenciales ni sesiones, y no se ejecutaron RPC de negocio. Las definiciones SQL extraídas describen el código desplegado observado, no constituyen ejecución funcional de ese código.

- **S-H01, prioridad alta: RPC de pagos con privilegios.** Las sobrecargas bigint y uuid de public.soft_delete_payment y public.restore_payment son SECURITY DEFINER y tienen EXECUTE para anon. Sus cuerpos observados contienen UPDATE sin comprobar auth.uid() ni el rol del actor. Esto configura una vía potencial de modificación no autorizada; la explotación no fue ejecutada. Evidencias: ${link('seguridad/catalogos-rls.json')} y ${link('seguridad/funciones-permisos.json')}. No todas las funciones marcadas por el asesor tienen el mismo riesgo: admin_insert_user sí comprueba el actor, y las RPC cosméticas comprueban propietario o personal.
- **S-H02, prioridad alta: integridad de recompensas.** Las políticas de xp_ledger, currency_ledger y currency_wallets permiten escrituras al propietario, además del personal; los grants de authenticated incluyen INSERT/UPDATE/DELETE. login_rewards permite INSERT/UPDATE al propio usuario. RLS limita filas, pero estas reglas por sí solas no autentican la procedencia de XP, saldo o fecha de recompensa. Los constraints consultados no validan dicha procedencia; se observó un trigger de deduplicación diaria en xp_ledger. Es una inferencia de riesgo sobre la configuración, sin intentar alterar saldos o XP. Evidencias: ${link('seguridad/catalogos-rls.json')} y ${link('seguridad/guardias-y-gamificacion.mcp.json')}.
- **S-H03: asesor Supabase.** Hay advertencias de search_path, funciones privilegiadas ejecutables, protección de contraseñas filtradas desactivada y parches pendientes del motor. La suma de incidencias por grupo no equivale a vulnerabilidades únicas: la misma función puede aparecer en varios grupos.
- **S-H04: dependencias.** Los tres npm audit terminaron con salida 1. Los conteos son registros de paquetes afectados según npm y pueden compartir avisos y dependencias transitivas. No se suman entre proyectos ni equivalen al número de CVE explotables. Incluyen herramientas de desarrollo/compilación. @capacitor/android 8.4.0 aparece afectado por [GHSA-rvm3-566m-v7fv](https://github.com/advisories/GHSA-rvm3-566m-v7fv); el aviso incluye 8.4.3 entre las correcciones. No se actualizó ningún paquete.

Se observaron ${nRls}/${cat.tables.length} tablas con RLS en el inventario de esquemas de aplicación consultados. Las seis sin RLS son audit.sql_errors, audit.sql_executions, reporting.scheduler_config, security.login_attempts, security.login_blocks y security.users_password_backup. Los grants consultados no conceden SELECT a anon/authenticated en esas seis; las dos tablas de auditoría sí conceden INSERT. Su exposición efectiva debe comprobarse antes de calificar el impacto. La configuración local de schemas de PostgREST no demuestra la configuración remota: current_setting('pgrst.db_schemas', true) devolvió null.

Las ${cat.views.length} vistas de public inventariadas tienen security_invoker=true. En core.users existe la política de propietario para UPDATE y un trigger guard_client_user_fields que restringe cambios de identidad/rol y suspensión; por ello no se infiere una escalada de rol únicamente a partir del grant UPDATE. La función del trigger fue inspeccionada, pero no se provocó un cambio real. Evidencias: ${link('seguridad/columnas-y-triggers.mcp.json')} y ${link('seguridad/guardias-y-gamificacion.mcp.json')}.

La presencia de RLS y de políticas no prueba que toda combinación de actor, operación y objeto esté protegida. No se ejecutó database/tests/rls_access_matrix.sql: selecciona usuarios reales y realiza escrituras, aunque termine con rollback. La matriz dinámica de permisos y las transacciones reales permanecen pendientes de un backend descartable. Esta evaluación no es una auditoría completa de penetración ni declara seguridad total.`;
const report=`# Informe de verificación técnica de RIOVOLEY

## 1. Identificación, fechas y estado de trabajo

Repositorio de referencia: https://github.com/Joscoo/riovoley. Proyecto React SPA/CRA, Tailwind, Capacitor Android y Supabase. Commit evaluado: **${commit}**. Se evaluó la copia local de ese commit; no se hizo pull, push, despliegue ni publicación.

Carpeta de ejecución: ${path.basename(a.out)}. Zona horaria: America/Guayaquil (UTC−05:00). La inspección inicial y las pruebas se realizaron el **27 de octubre de 2026 por la noche**, y la consolidación se continuó el **28 de octubre de 2026** por instrucción del usuario. Los metadatos conservan horas ISO UTC: Jest ${u.start}–${u.end}; compilación ${b.start}–${b.end}; Playwright ${e.start}–${e.end}. Generación del informe: ${now}. El intervalo de continuidad entre ambos días no se cuenta como duración de pruebas.

La primera inspección de git status no mostró cambios. Al registrar el estado después de crear el arnés ya aparecía auditar.cjs como no versionado (${link('estado-inicial.stdout.log')}). La comprobación final git diff --exit-code devolvió 0: no hay modificaciones de archivos versionados (${link('integridad-tracked.meta.json')}). Se añadieron evidencias y dos archivos de prueba, documentados abajo; no se alteró lógica de producción ni se descartaron archivos locales. ${link('estado-final.stdout.log')} registra ese estado. Los resultados de las pruebas adicionales corresponden al commit más esos archivos nuevos, cuyos hashes se conservan en el inventario final.

## 2. Entorno y configuración

Windows 11, x64; OS reportado 10.0.26300.0, PowerShell 5.1.26100.9711. Node.js **v24.18.0**, npm **11.16.0**, Python 3.11.9 y Git 2.56.0.windows.4. Node es posterior al 22 declarado por los servicios auxiliares; sus comprobaciones locales se ejecutaron con Node 24, sin certificar compatibilidad con Node 22. Java y javac **25.0.4.1** disponibles por PATH; Gradle wrapper **8.14.3**. Android SDK, adb, sdkmanager y emulador no fueron localizados en las rutas verificadas/PATH; Gradle global, Supabase CLI, Deno y psql ausentes en PATH. El wrapper sí está disponible y descargó su distribución al caché local para --version.

Versiones resueltas e instaladas: ${Object.entries(read('versiones-instaladas.json')).map(([k,v])=>k+' '+v).join('; ')}. El README contiene versiones declarativas anteriores: para esta auditoría se usa package-lock y la instalación observada. No se ejecutó npm install ni se modificaron lockfiles.

Se inspeccionaron package.json, package-lock.json, playwright.config.js, capacitor.config.json, src/features, src/shared, tests, Android, database y supabase. La documentación previa ${sourceLink('docs/RESTAURACION_PC_2026-10-22.md')} se utilizó como antecedente; ninguna cifra anterior se reutiliza como resultado nuevo. Referencias de arquitectura: ${sourceLink('README.md')}, ${sourceLink('src/features/README.md')} y los README de features. La carpeta .github/workflows inventariada contiene ${inv.workflows.length} archivos: no se pudo comprobar una ejecución de CI remota ni validar el workflow referido por el README. CI=true en Jest es solo modo no interactivo local.

Las variables se registraron exclusivamente por nombre y presencia en ${link('inventario.json')}. La web requiere REACT_APP_SUPABASE_URL y REACT_APP_SUPABASE_ANON_KEY; se revisaron también flags REACT_APP_*. Los E2E autenticados requieren E2E_ADMIN_EMAIL/PASSWORD, E2E_TRAINER_EMAIL/PASSWORD y E2E_STUDENT_EMAIL/PASSWORD; E2E_BASE_URL es opcional. Los archivos .env.e2e.example y .env.example no acreditan credenciales válidas. Los nombres de variables Deno para Auth, correo y push están en requiredEnvReferences del inventario; no se copiaron valores, archivos .env, tokens ni llaves de firma. Las credenciales existentes **no se probaron**: el usuario confirmó que el backend debe tratarse como producción. Su validez queda desconocida en esta auditoría.

## 3. Alcance, método y estados

Se ejecutaron pruebas locales, compilación, navegador aislado y consultas de lectura al backend autorizado. APROBADO significa que la verificación concreta cumplió sus aserciones; FALLIDO conserva un error o salida no satisfactoria; BLOQUEADO indica requisito de seguridad/entorno no disponible; OMITIDO es un caso que el runner marcó skipped/pending; NO EJECUTADO identifica una verificación que no llegó a iniciarse. “Ejecutado con hallazgos” se reserva para revisiones de configuración sin un denominador de casos automatizados. Un guion en la tabla significa que el concepto no es un caso de prueba.

Los scripts de pruebas descubiertos incluyen npm test (CRA/Jest), npm run test:contracts, npm run test:auth-edge (node:test vía tsx), npm run e2e y las variantes e2e:smoke:* / e2e:filters-sorting:*. No se encontró un runner separado para componentes: Testing Library se ejecuta dentro de Jest. Los contratos de usuario también forman parte de la suite general, aunque no del script test:contracts. No se encontró una batería de integración real PostgreSQL ejecutable sin escrituras institucionales.

Todos los comandos registrados, tiempos, códigos de salida y overrides están en ${link('comandos-ejecutados.json')}. Los archivos .stdout.log y .stderr.log adyacentes conservan la salida con redacción de datos sensibles. No se muestran secretos en la tabla de comandos. Los resultados MCP se conservan con tool, tiempo y respuesta; MCP no devuelve un código de salida de shell y no se le atribuye uno.

## 4. Resumen verificable

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
${resultTable}

No se suman denominadores de runners distintos. C-01 repite 5 casos incluidos en los 387 de U-01. Los 3 casos de userManagementRepositoryContract.test.js también están incluidos en U-01. I-01 añade 5 casos distintos ejecutados en otra invocación de Jest: entre ambas hay 392 casos diferentes en 84 archivos, pero la cobertura informada pertenece únicamente a la pasada de 83 suites. Los 10 casos de node:test y los 133 de Playwright se informan por separado. Las 224 instancias del listado inicial de Playwright no son pruebas ejecutadas: el --list las presenta como skipped y eso no se usa como conteo de omisiones.

## 5. Pruebas unitarias y componentes

Comando principal: npm test -- --watchAll=false --runInBand --coverage, con CI=true, reporteros json-summary/json/lcov/text y rutas explícitas a esta carpeta. Resultado: **${j.numPassedTestSuites}/${j.numTotalTestSuites} suites y ${j.numPassedTests}/${j.numTotalTests} casos aprobados**, ${j.numFailedTests} fallidos, ${j.numPendingTests} pendientes; sin snapshots. Jest informó 81,391 s y la duración del proceso registrado fue ${fmt(u.durationSeconds)} s; son mediciones diferentes. Las 10 pruebas Edge pasaron aparte en 1,0485 s de runner y 3,201 s de proceso. No se contactó al proveedor de correo desde esas pruebas: global fetch, gateway y Deno.env están simulados.

| Módulo / grupo de U-01 | Suites | Casos | Aprobados | Fallidos | Omitidos |
|---|---:|---:|---:|---:|---:|
${moduleTable}

La prueba App.test.js es un placeholder expect(true).toBe(true); su aprobación no verifica renderizado de App ni funcionalidades y se identifica separadamente. Las pruebas de componentes usan jsdom y Testing Library, con acciones/repositorios simulados cuando corresponde. Los detalles por archivo, título y estado están en ${link('unitarias/casos-detallados.json')}.

### Cobertura de código

Se instrumentaron ${inventoryCoverage} archivos según el resumen emitido por CRA/Istanbul. No se estableció un umbral de cobertura ni se presenta como cobertura de todos los posibles comportamientos.

| Métrica | Elementos cubiertos | Denominador instrumentado | Cobertura |
|---|---:|---:|---:|
${covTable}

Evidencias: ${link('unitarias/coverage/coverage-summary.json')}, ${link('unitarias/coverage/coverage-final.json')}, ${link('unitarias/coverage/lcov.info')} y ${link('unitarias/coverage/lcov-report/index.html')}. La cobertura muestra ramas y funciones todavía no ejecutadas; la compilación no cubre ese vacío. El control check:copy-quality también terminó con salida 0, como comprobación independiente de textos, no como prueba funcional.

### Gamificación: quince aspectos solicitados

| Aspecto | Pruebas ejecutadas relacionadas | Qué demuestra y límite |
|---|---|---|
${gamRows.map(r=>'| '+r.join(' | ')+' |').join('\n')}

Los grupos anteriores se solapan: un mismo caso puede comprobar XP, logros e identidad. Sus cantidades no se suman. La trazabilidad nominal está en ${link('trazabilidad-casos.json')} y ${link('MATRIZ_VERIFICACIONES_TESIS.md')}. “Persiste” en nombres originales de pruebas unitarias describe llamadas a mocks, no una transacción PostgreSQL demostrada.

## 6. Contratos e integración

test:contracts ejecutó las pruebas de supabaseReportingRepository.contract.test.js y deleteAuthUserById.test.js: **2 suites, 5 casos aprobados**, 0 fallidos/omitidos, ${fmt(read('integracion/contratos.meta.json').durationSeconds)} s de proceso; los clientes/funciones invocadas son simulados. Los otros 3 contratos estructurales de usuario se ejecutaron dentro de U-01. Un contrato comprobado con un cliente ficticio no acredita que la API remota mantenga el contrato.

Se añadió ${sourceLink('src/features/gamification/application/useCases/gamification.audit.integration.test.js')}. Sus **5/5 casos** conectan createGamificationService y los casos de uso reales de asistencia, pagos y pruebas físicas con repositorios en memoria, reloj fijo y gateway de notificaciones desactivado. Se comprueban movimientos de XP y ausencia de duplicación lógica, incluyendo recompensa diaria. No se reemplaza el motor de gamificación; sí se simulan las fronteras de infraestructura. No se implementa una RPC cosmética ficticia para presentarla como compra validada. Evidencia: ${link('integracion/adicionales-resultados.json')}.

functions compiló con tsc; los lint de functions y riovoley terminaron con salida 0. Se iniciaron ambos Express en puertos efímeros de loopback y se comprobó /health: **2 respuestas HTTP 200** con status ok, cerrando los servidores. Son comprobaciones HTTP locales reales sin acceso al backend, y no verifican despliegue de Edge Functions, flujos de negocio ni integridad transaccional. Evidencia: ${link('integracion/health-resultados.json')}.

## 7. Playwright

Configuración original: ${sourceLink('playwright.config.js')}; configuración específica: ${link('e2e/audit.config.cjs')}. Se sirvió el build de producción localmente en 127.0.0.1:3100, con dos workers, sin retries. Se usaron los siete perfiles existentes: 390×844, 430×932, 480×900, 768×1024, 1024×768, 1440×900 y 1920×1080. Los perfiles originales seleccionan Chromium o WebKit; no se probó Firefox. Son navegadores con viewport/dispositivo emulado, no siete dispositivos físicos.

La salida fue **126 aprobados, 7 fallidos, 0 omitidos y 0 flaky, de 133 instancias**. Playwright midió ${fmt(Math.round(pw.stats.duration)/1000)} s; el proceso completo tardó ${fmt(e.durationSeconds)} s. Se ejecutaron 19 casos lógicos en siete perfiles: 5 responsive, 7 navegación/teclado, 4 recuperación y 3 guardias anónimas. Los casos públicos verifican overflow, tamaño de controles y superficie de render; los de teclado comprueban main, skip link y gestión del menú. Esto no es una auditoría completa WCAG ni una evaluación de capacidad de interacción con usuarios.

**Aislamiento:** el proxy de navegador apunta al puerto cerrado 127.0.0.1:9 y solo exceptúa localhost/127.0.0.1; service workers bloqueados. Las peticiones externas no llegan al backend institucional. Los tests de recuperación resuelven Auth/REST mediante page.route; incluso el cambio de contraseña de ese flujo es simulado. Las pantallas públicas se ejecutan con la red externa indisponible, por lo que no validan datos públicos remotos, Google Calendar, imágenes externas ni Supabase Auth real. Las trazas y vídeos se deshabilitaron para minimizar captura de cabeceras/tokens; se conservaron siete capturas y contextos del fallo, sin datos personales de sesiones reales.

**E-H01:** el caso nuevo ${sourceLink('tests/e2e/audit.protected-routes.spec.js')} espera denegación explícita para el visitante anónimo. /admin y /entrenador pasaron en los siete perfiles (14/14). /estudiante falló en los siete: se observó “Cargando informacion…” y no la denegación esperada dentro de 10 s. La inspección de StudentPanel identifica loading inicial true y carga condicionada a user.id; sin usuario no se ejecuta el finally que lo desactiva. No se observó divulgación de datos del atleta. No se modificó la expectativa ni el producto para hacer pasar la prueba. Evidencias: ${link('e2e/resultados.json')}, ${link('e2e/reporte-html/index.html')} y ${link('e2e/artefactos/audit.protected-routes-aud-b7ecf--protected-panel-estudiante-desktop-1440/error-context.md')}.

**Bloqueos:** ${blocked.length} instancias de la batería original (16 casos lógicos × 7 perfiles) requieren cuentas o interacciones administrativas. Abarcan paneles/roles, navegación de módulos, filtros, búsquedas/ordenación, revisión de asistencia y flujos administrativos controlados. No se lanzaron ni se marcaron aprobadas/skipped. ${link('e2e/casos-bloqueados.json')} identifica cada título, archivo y perfil. Faltó un entorno aislado, no se sustituyeron usuarios ni se validaron/cambiaron contraseñas.

## 8. Compilación web

Comando existente npm run build: cross-env CI=false react-scripts build. **Salida ${b.exitCode}, Compiled successfully**, duración ${fmt(b.durationSeconds)} s. Node v24.18.0/npm 11.16.0. Sin errores de compilación. stderr registra DEP0176 (fs.F_OK obsoleto). El script establece CI=false, por lo que una advertencia no se convierte automáticamente en error de CI.

La salida build/ contiene ${buildFiles.files} archivos, ${buildFiles.totalBytes} bytes sin comprimir en total; se registraron nombre, tamaño y SHA-256 de cada uno, más asset-manifest. El bundle principal informado fue 207,44 kB gzip. Evidencias: ${link('compilacion-web/build.stdout.log')}, ${link('compilacion-web/build.stderr.log')}, ${link('compilacion-web/artefactos.json')}. Los bundles y mapas de build no se duplicaron en el expediente para evitar propagar configuración pública/tokenizada. No se desplegó ni se ejecutó OTA. Compilar prueba transformación/empaquetado, no funcionamiento de todas las funcionalidades.

## 9. Android y Capacitor

appId com.riovoley.app, webDir build, esquema https. Capacitor instalado 8.4.0, AGP 8.13.0, Gradle wrapper 8.14.3, minSdk 24, compileSdk/targetSdk 36. Java/javac 25.0.4.1 sí existen: el antecedente del 22 de octubre ya no describe completamente este entorno. gradlew --version y cap doctor terminaron con 0; el mensaje de doctor sobre Android comprueba dependencias y no equivale a una compilación nativa.

**Sincronización, compilación nativa y pruebas en dispositivo: NO EJECUTADAS.** android/local.properties apunta a D:/Apps/AndroidSDK, que no existe; tampoco se halló el SDK predeterminado del perfil. No hay ANDROID_HOME/ANDROID_SDK_ROOT configurados. JDK 25 requiere Gradle 9.1 o posterior según la [matriz oficial](https://docs.gradle.org/current/userguide/compatibility.html); que --version responda no certifica la combinación actual. No se cambió JDK, Gradle, local.properties, signing ni configuración nativa. No se generó APK/AAB en esta auditoría. La salida React no se contabiliza como build Android.

Existen dos pruebas nativas de ejemplo: ExampleUnitTest suma 2+2 y ExampleInstrumentedTest comprueba un packageName de plantilla; no cubren negocio y no fueron ejecutadas. Quedan pendientes un SDK/API 36 y Build Tools compatibles, una combinación JDK/Gradle soportada, sync y assembleDebug, y un dispositivo o emulador autorizado para instrumentación. Evidencias: ${link('android/alcance.json')}, ${link('android/java.stderr.log')}, ${link('android/gradle-wrapper-version.stdout.log')}, ${link('android/capacitor-doctor.stdout.log')} y ${link('inventario.json')}.

## 10. Seguridad y acceso

**Estado actual confirmado:** gamification.xp_ledger y gamification.login_rewards tienen relrowsecurity=true, relforcerowsecurity=false y una política cada una. Ambas políticas se aplican a authenticated, con USING y WITH CHECK por propietario o personal. Los grants de anon para estas dos tablas son falsos para SELECT/INSERT/UPDATE/DELETE; authenticated dispone de las operaciones descritas en S-H02. No se asumió que la migración local estuviese aplicada: se consultó el catálogo remoto. RLS_FORCED=false por sí solo no demuestra un fallo para anon/authenticated; el propietario y roles privilegiados tienen un tratamiento distinto.

${findings}

| Paquete / árbol npm | Bajas | Moderadas | Altas | Críticas | Total del árbol | Evidencia |
|---|---:|---:|---:|---:|---:|---|
${auditTable}

| Grupo del asesor Supabase | Nivel | Incidencias del grupo |
|---|---|---:|
${advisorTable}

## 11. Incidencias, límites y trabajo pendiente

| Incidencia | Estado | Implicación / pendiente |
|---|---|---|
| E-H01: espera anónima en /estudiante | FALLIDO, 7 perfiles | Resolver el estado de carga sin sesión y volver a ejecutar la guardia; no se hizo un cambio de producto durante la auditoría. |
| S-H01: RPC privilegiadas de pagos | Hallazgo de configuración, prioridad alta | Revisar permisos y autorización interna con aprobación expresa; reproducir después en un clon descartable. |
| S-H02: propietario escribe recompensas/saldo | Riesgo inferido, prioridad alta | Revisar frontera de confianza del recálculo; probar integridad y permisos en backend aislado antes de corregir. |
| Alertas npm / asesores | Hallazgos vigentes en el momento de consulta | Evaluar alcance por dependencia y plan de actualización; no se usó audit fix. |
| E2E autenticados y transacciones reales | BLOQUEADOS | Preparar backend y cuentas descartables. La validez de las credenciales de producción no fue comprobada. |
| Android | NO EJECUTADO | SDK y combinación Java/Gradle soportada; luego sync, APK debug e instrumentación. |
| Cobertura parcial | Medida, sin umbral | Cubrir ramas, niveles, tiempo, concurrencia y compra real; App.test.js es placeholder. |
| CI remota / Edge desplegadas | NO EJECUTADO | No hay workflow local verificable ni Deno disponible; no se valida despliegue remoto por compilar functions/ con tsc. |

La ejecución inicial de entorno.ps1 fue bloqueada por la política de ejecución de PowerShell (salida 1). Se preserva ese registro y se obtuvo el inventario mediante un comando inline (salida 0), sin cambiar políticas del sistema. Hubo errores auxiliares de sintaxis al construir comandos/extraer el envoltorio MCP, corregidos antes de obtener los artefactos definitivos; no fueron fallos del producto y no se atribuyen a sus suites. No se registran resultados ficticios para pasos no iniciados.

## 12. Reproducción y evidencias

Desde la raíz del repositorio, con las dependencias instaladas:

1. Revisar ${link('auditar.cjs')} y ${link('plan-ejecucion.md')}; el backend permanece clasificado como producción. Crear una carpeta nueva para una auditoría nueva: no sobrescribir este expediente.
2. Para repetir los comandos de esta ejecución, los argumentos exactos están en la tabla siguiente y en cada .meta.json. El arnés admite inspect, unit, contracts, edge, audit, audit-functions, build, functions-build, copy, e2e-list y e2e. Los .meta.json identifican cuándo cada comando fue ejecutado, su salida y duración; no basta volver a generar Markdown.
3. Para el navegador, compilar primero, iniciar e2e/servidor-local.cjs en loopback y ejecutar Playwright con e2e/audit.config.cjs. Mantener el proxy cerrado y el filtrado que excluye roles. La guardia /estudiante debe conservar su fallo mientras no se corrija el producto.
4. Las consultas .sql de seguridad son SELECT de metadatos y se pueden repetir mediante una conexión autorizada de lectura. No ejecutar las migraciones ni la matriz SQL con escrituras en producción. get_advisors es una lectura independiente del servicio.
5. ${link('generar-informe.cjs')} deriva tablas y documentos de los JSON reales; ${link('integridad.cjs')} verifica coherencia, privacidad y hashes. El informe, matriz y propuesta académica se guardan juntos. El documento de tesis no se modificó.

| Comando ejecutado | Directorio | Código de salida | Duración proceso (s) | Metadatos |
|---|---|---:|---:|---|
${commandTable}

El expediente contiene reportes de cobertura, JSON, logs, HTML de Playwright, capturas y metadatos. Los nombres reales de variables se mantienen y sus valores se omiten. Las redacciones de correos/tokens en copias de evidencia no cambian cantidades ni estados. ${link('INTEGRIDAD.json')} y ${link('MANIFIESTO_SHA256.json')} permiten verificar coherencia y conservación de archivos; el manifiesto no se incluye a sí mismo en su lista de hashes. La matriz ${link('MATRIZ_VERIFICACIONES_TESIS.md')} y la propuesta ${link('RESULTADOS_PARA_TESIS_4_5.md')} deben revisarse académicamente antes de incorporarse a la tesis.
`;
a.write('INFORME_VERIFICACION_TECNICA.md',report);
const matrix=`# Matriz de verificaciones para la tesis — Tabla 4-6

Commit ${commit}. Expediente ${path.basename(a.out)}. Resultados de la auditoría iniciada el 27/10/2026 y consolidada el 28/10/2026. ${link('INFORME_VERIFICACION_TECNICA.md')} documenta entorno, tiempos y límites. U-01: 387 casos; I-01: 5 casos adicionales en otra ejecución. Los casos pueden respaldar varias categorías, por lo que **no se suman las filas**.

| Categoría | Archivos de prueba relacionados | Casos ejecutados | Resultado real | Tipo | Mocks / servicios reales | Limitaciones | Evidencia |
|---|---|---:|---|---|---|---|---|
${categories.map(k=>`| ${k.name} | ${k.files.map(sourceLink).join('<br>')} | ${k.result.executed} | ${k.result.passed} aprobados, ${k.result.failed} fallidos, ${k.result.skipped} omitidos | ${k.type} | ${k.mock} | ${k.limit} | ${link('unitarias/jest-resultados.json')}; ${link('trazabilidad-casos.json')} |`).join('\n')}
| 8. Compilación del proyecto | ${sourceLink('package.json')}; npm run build | No aplica: 1 comando | Salida 0; Compiled successfully; ${fmt(b.durationSeconds)} s | Compilación CRA de producción | Herramientas reales locales | No es prueba funcional ni compilación nativa Android | ${link('compilacion-web/build.stdout.log')}; ${link('compilacion-web/artefactos.json')} |

## Ampliación de integración local

${sourceLink('src/features/gamification/application/useCases/gamification.audit.integration.test.js')}: **5 aprobados/5 ejecutados**, 0 fallidos y 0 omitidos. Fachada JavaScript y casos de uso de negocio reales; repositorios en memoria, reloj fijo y notificaciones aisladas. No hay PostgreSQL real. Esta ejecución complementa las categorías 1, 2, 4, 6 y 7 y las pruebas de evaluación física; no se añade silenciosamente al denominador de U-01.

| Caso adicional | Categoría respaldada | Resultado | Evidencia |
|---|---|---|---|
${extraCases.map((t,i)=>`| ${t.title} | ${['Asistencia, XP y wallet','Asistencia, XP y monedas','Pagos y XP','Evaluación física y XP','Servicio y recompensa diaria'][i]} | ${t.status} | ${link('integracion/adicionales-resultados.json')} |`).join('\n')}

## Verificaciones complementarias

| Grupo | Archivos / procedimiento | Denominador propio y resultado | Tipo y entorno | Límite | Evidencia |
|---|---|---|---|---|---|
| Contratos | supabaseReportingRepository.contract.test.js y deleteAuthUserById.test.js | 5/5 aprobados en 2 suites; incluidos en U-01 | Jest con clientes/gateways simulados | Sin integración real PostgreSQL | ${link('integracion/contratos-resultados.json')} |
| Contrato estructural de usuarios | userManagementRepositoryContract.test.js | 3/3 aprobados; incluidos en U-01 | Validación de interfaz en memoria | No valida operaciones remotas | ${link('unitarias/casos-detallados.json')} |
| Autenticación/correo Edge | ${sourceLink('tests/unit/credentials-edge.test.ts')} | 10/10 aprobados | node:test/tsx, fetch y gateways simulados | No envía correos ni modifica contraseñas reales | ${link('unitarias/auth-edge.stdout.log')} |
| Salud HTTP | functions/lib/index.js y riovoley/index.js | 2/2 HTTP 200 | HTTP real de loopback | No backend ni despliegue | ${link('integracion/health-resultados.json')} |
| E2E responsive público | ${sourceLink('tests/e2e/responsive.smoke.spec.js')} | 35/35 aprobados | Chromium/WebKit; siete perfiles; red externa bloqueada | Sin datos remotos | ${link('e2e/resultados.json')} |
| E2E navegación/teclado | ${sourceLink('tests/e2e/public.navigation-accessibility.spec.js')} | 49/49 aprobados | Navegador real emulado; red externa bloqueada | No equivale a WCAG completa ni interacción con usuarios | ${link('e2e/reporte-html/index.html')} |
| E2E recuperación | ${sourceLink('tests/e2e/auth.password-recovery.spec.js')} | 28/28 aprobados | Auth/REST interceptados con mocks | No valida Auth real | ${link('e2e/resultados.json')} |
| E2E guardias anónimas | ${sourceLink('tests/e2e/audit.protected-routes.spec.js')} | 21 ejecutados: 14 aprobados y 7 fallidos | Tres rutas × siete perfiles; anónimo | /estudiante queda cargando; sin divulgación demostrada | ${link('e2e/artefactos')}; ${link('e2e/resultados.json')} |
| E2E autenticados y filtros | Inventario por título y perfil | ${blocked.length} instancias bloqueadas; 0 ejecutadas | Requieren backend descartable | Backend actual de producción; credenciales no comprobadas | ${link('e2e/casos-bloqueados.json')} |
| Android | Capacitor doctor, Java y Gradle --version | Diagnósticos con salida 0; sync/APK/dispositivo no ejecutados | Capacitor 8.4.0, Gradle 8.14.3, JDK 25 | SDK ausente y combinación JDK/Gradle no soportada | ${link('android/alcance.json')} |
| RLS objetivo | SELECT de catálogo remoto | 2/2 tablas con RLS y política | PostgreSQL remoto real; solo metadatos | No prueba operaciones por usuario ni integridad de recompensas | ${link('seguridad/catalogos-rls.json')} |
| Seguridad de configuración | Catálogos, grants, funciones, vistas y asesor | Hallazgos S-H01 a S-H04 | Lecturas reales; sin ejecutar RPC de negocio | No auditoría completa de penetración | ${link('seguridad/funciones-permisos.json')}; ${link('seguridad/asesores.json')} |
| Dependencias | npm audit, raíz / functions / riovoley | ${audits.map(x=>x.metadata.vulnerabilities.total).join(' / ')} registros de paquetes afectados respectivamente; salida 1 en cada árbol | Consulta real al registro npm | No sumar árboles ni equiparar paquetes a CVE explotables | ${link('seguridad/npm-audit.json')}; ${link('seguridad/npm-audit-functions.json')}; ${link('seguridad/npm-audit-riovoley.json')} |

## Lectura académica

La evidencia sustenta comprobaciones técnicas limitadas a sus aserciones y entornos. Los repositorios simulados no prueban persistencia; el repositorio en memoria de I-01 prueba composición lógica local; las consultas remotas prueban configuración observada. Ninguna fila mide usabilidad, motivación, Octalysis en usuarios, USE ni UES-SF. La propuesta narrativa está en ${link('RESULTADOS_PARA_TESIS_4_5.md')}.
`;
a.write('MATRIZ_VERIFICACIONES_TESIS.md',matrix);
const thesis=`# Propuesta de resultados para el apartado 4.5

Texto para revisión académica e incorporación posterior a la Tabla 4-6. No se modificó el documento de tesis. Auditoría del commit ${commit}, iniciada el 27 de octubre y consolidada el 28 de octubre de 2026.

La verificación técnica automatizada de RIOVOLEY comprendió pruebas unitarias y de componentes, contratos, integración lógica local, pruebas de navegador y compilación. La ejecución general de Jest y Testing Library registró **83 suites y 387 casos aprobados**, sin casos fallidos u omitidos; dentro de ese total se incluye una prueba de aplicación de tipo placeholder que no comprueba funcionalidades. La cobertura instrumentada alcanzó el **41,11 % de líneas** (4968 de 12082), el 39,75 % de sentencias, el 35,49 % de funciones y el 31,99 % de ramas. Por consiguiente, la aprobación de la batería ejecutada no representa una comprobación exhaustiva del código. Los resultados y sus denominadores se encuentran en [el JSON de Jest](unitarias/jest-resultados.json) y [el resumen de cobertura](unitarias/coverage/coverage-summary.json).

Las pruebas de gamificación verificaron escenarios de cálculo y proyección de experiencia, rachas, logros, retos, clasificación, identidad visual, wallet y operaciones cosméticas, con el alcance por caso descrito en [la matriz de trazabilidad](MATRIZ_VERIFICACIONES_TESIS.md). Estas pruebas emplearon principalmente repositorios y dependencias simuladas; en particular, la delegación de una compra a un repositorio simulado no demuestra el débito transaccional de monedas en PostgreSQL. Para ampliar la comprobación entre módulos se añadieron **cinco casos de integración local**, todos aprobados, que conectaron los casos de uso reales de asistencia, pagos y evaluaciones físicas con el servicio de gamificación y un repositorio en memoria. Se verificaron movimientos base de 35, 90 y 100 XP, respectivamente, y la ausencia de duplicación lógica en los escenarios de actualización y recompensa diaria. Esta evidencia acredita composición lógica local, sin demostrar persistencia real en el backend ([resultados adicionales](integracion/adicionales-resultados.json)). El script de contratos aprobó **cinco casos en dos suites**, ya incluidos en el total de Jest, mientras que una ejecución independiente de node:test aprobó **diez casos** de autenticación y correo de las Edge Functions con gateways y respuestas HTTP simulados ([contratos](integracion/contratos-resultados.json); [pruebas Edge](unitarias/auth-edge.stdout.log)).

En Playwright se ejecutaron **133 instancias de prueba**, correspondientes a 19 casos lógicos en siete perfiles de pantalla con Chromium y WebKit: **126 aprobaron y siete fallaron**, sin omisiones ni reintentos. Aprobaron 35 verificaciones responsive públicas, 49 de navegación y teclado y 28 de recuperación de contraseña con Auth y REST simulados. Las guardias de rutas anónimas aprobaron 14 de sus 21 instancias; las siete restantes reprodujeron un estado de carga persistente en /estudiante, sin mostrar la denegación esperada. No se observó divulgación de información del atleta en ese escenario. El navegador se ejecutó sobre el build local con la red externa bloqueada, de modo que sus resultados no validan la autenticación real ni la disponibilidad de datos remotos. Las pruebas autenticadas de paneles, filtros y operaciones administrativas permanecieron bloqueadas porque el backend configurado fue identificado como producción y no se dispuso de un entorno descartable ([resultados de Playwright](e2e/resultados.json), [reporte HTML](e2e/reporte-html/index.html) y [casos bloqueados](e2e/casos-bloqueados.json)).

La compilación web de producción mediante npm run build concluyó con código de salida cero y una duración de **105,121 segundos**, con una advertencia de obsolescencia de Node y sin errores de compilación. Este resultado acredita la generación de los archivos web, sin sustituir las pruebas funcionales. La sincronización y compilación nativa de Android no se ejecutaron, debido a la ausencia del SDK en las rutas verificadas y a una combinación JDK/Gradle fuera de la matriz soportada; por tanto, no se generó ni validó un APK en esta auditoría ([compilación web](compilacion-web/build.meta.json); [alcance Android](android/alcance.json)).

En seguridad se realizaron consultas de lectura al catálogo del backend autorizado y análisis de dependencias. Se confirmó RLS activo y la existencia de políticas en gamification.xp_ledger y gamification.login_rewards. Sin embargo, la revisión identificó riesgos de configuración en funciones privilegiadas de pagos ejecutables por anon y en permisos de escritura del propietario sobre datos de recompensas y monedas; no se intentó explotar esas condiciones ni se modificaron registros institucionales. npm audit informó **63 registros de paquetes afectados en el árbol raíz**, de los cuales cinco se clasificaron como críticos; los árboles auxiliares se analizaron por separado. El asesor de Supabase también emitió advertencias de seguridad, por lo que no se concluye que el sistema esté completamente protegido ([catálogos de RLS](seguridad/catalogos-rls.json), [definiciones de funciones](seguridad/funciones-permisos.json), [dependencias](seguridad/npm-audit.json) y [asesores](seguridad/asesores.json)). Estos resultados describen el alcance técnico observado y sus limitaciones; no constituyen mediciones de usabilidad, motivación o capacidad de interacción con usuarios, ni resultados de instrumentos USE o UES-SF.

## Respaldo de las afirmaciones cuantitativas

| Afirmación | Evidencia identificable |
|---|---|
| 83 suites / 387 casos; sin fallos/omisiones | unitarias/jest-resultados.json: numTotalTestSuites, numTotalTests, numPassedTests, numFailedTests, numPendingTests |
| 41,11 % de líneas y otras métricas | unitarias/coverage/coverage-summary.json: total |
| 5 casos adicionales aprobados | integracion/adicionales-resultados.json y código de la prueba adicional |
| Movimientos base de 35 / 90 / 100 XP y deduplicación local | integracion/casos-adicionales.json y aserciones en gamification.audit.integration.test.js |
| 5 contratos, subconjunto del total | integracion/contratos-resultados.json y unitarias/casos-detallados.json |
| 10 pruebas Edge | unitarias/auth-edge.stdout.log: tests/pass/fail/skipped |
| 133 E2E = 126 aprobados + 7 fallidos | e2e/resultados.json: stats y suites |
| 35 / 49 / 28 / 21 instancias por grupo | e2e/casos-detallados.json y resumen-verificaciones.json |
| 105,121 s y salida 0 en compilación web | compilacion-web/build.meta.json: durationSeconds, exitCode |
| Android sin APK producido | android/alcance.json; inventario.json; herramientas-sistema-inline.stdout.log |
| RLS en ambas tablas y riesgos de escritura | seguridad/catalogos-rls.json; seguridad/guardias-y-gamificacion.mcp.json |
| RPC de pagos y permisos anon | seguridad/funciones-permisos.json y seguridad/catalogos-rls.json |
| 63 paquetes afectados / 5 críticos en raíz | seguridad/npm-audit.json: metadata.vulnerabilities |

El [informe técnico](INFORME_VERIFICACION_TECNICA.md) conserva comandos, tiempos, entorno y limitaciones. Los resultados corresponden a esta auditoría, sin reutilizar cifras del registro de restauración del 22 de octubre.
`;
a.write('RESULTADOS_PARA_TESIS_4_5.md',thesis);
a.write('seguridad/HALLAZGOS_SEGURIDAD.md','# Hallazgos de seguridad de la auditoría\n\n'+findings+'\n\n'+auditTable+'\n');
console.log(JSON.stringify({reports:3,jest:count(cases),additional:count(extraCases),playwright:count(pCases),blocked:blocked.length,categories:categories.map(k=>({name:k.name,...k.result})),coverage:cov.total.lines}));
