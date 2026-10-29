const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
const read=file=>JSON.parse(fs.readFileSync(path.join(h.evidence,file),'utf8'));
const ref=file=>`[${file}](${file})`;
const source=file=>ref(path.relative(h.evidence,path.join(h.root,file)).replaceAll('\\','/'));
const text=file=>fs.readFileSync(path.join(h.evidence,file),'utf8');
const save=(file,value)=>{
 const target=path.join(h.evidence,file);
 if(fs.existsSync(target)){
  assert.ok(process.argv.includes('--refresh-derived')&&!fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')),'Solo regenerar derivados sin sellar');
  fs.writeFileSync(target,require('../../e2e/local/safety.cjs').redact(typeof value==='string'?value:JSON.stringify(value,null,2))+'\n');return target;
 }
 return h.write(file,value);
};
const clean=value=>{
 for(const [a,b] of Object.entries({'Tabla4-6':'Tabla 4-6','apartado4.5':'apartado 4.5','del29':'del 29','de2026':'de 2026','en87':'en 87','los410':'los 410','de410':'de 410','Los34':'Los 34','Los18':'Los 18','Los20':'Los 20','Los12':'Los 12','Los28':'Los 28','Los24':'Los 24','De manera':'De manera','de20':'de 20','obtuvo5':'obtuvo 5','aprobadas/15':'aprobadas / 15','final es34/34':'final es 34/34','y12':'y 12','de8XP':'de 8 XP','de62':'de 62','a0':'a 0','conservó35':'conservó 35','incluidos13':'incluidos 13','salida0':'salida 0','código0':'código 0','dos rutas':'dos rutas','codes':'codes','a55321':'a 55321','devuelve400':'devuelve 400','no24':'no 24','de11':'de 11','y111':'y 111','con249':'con 249','registra249':'registra 249','casos y2':'casos y 2','y2 pruebas':'y 2 pruebas','casos de410':'casos de 410','distintos de las18':'distintos de las 18','integraciones y34':'integraciones y 34','Edge:20':'Edge: 20','mocks,12':'mocks, 12',';12 HTTP':' ;12 HTTP','conserva35':'conserva 35','de18':'de 18','de34':'de 34','raíz;35':'raíz; 35','250XP':'250 XP','a192':'a 192','transición192':'transición 192','nivel2':'nivel 2','historial de ese caso':'historial de ese caso','de la raíz;35':'de la raíz; 35','entre390':'entre 390','y1920px':'y 1920 px','límites481':'límites 481','limita a55321':'limita a 55321','13 altos,6':'13 altos, 6','moderados,16':'moderados, 16'}))value=value.replace(new RegExp('\\b'+a+'\\b','g'),b);
 return value.replaceAll('las12','las 12').replaceAll('públicas,105','públicas, 105');
};
const doc=(file,value)=>save(file,clean(value));
function latest(folder,prefix,ext='.meta.json'){
 return fs.readdirSync(path.join(h.evidence,folder)).filter(n=>n.startsWith(prefix)&&n.endsWith(ext)).map(n=>({file:folder+'/'+n,modifiedMs:fs.statSync(path.join(h.evidence,folder,n)).mtimeMs,...(ext==='.meta.json'?read(folder+'/'+n):{})})).sort((a,b)=>a.modifiedMs-b.modifiedMs).at(-1);
}
const jest=read('unitarias/jest-410-final.json');assert.equal(jest.numPassedTests,410);assert.equal(jest.numFailedTests,0);assert.equal(jest.numTotalTestSuites,87);
const units=jest.testResults.flatMap(r=>r.assertionResults.map(t=>({file:path.relative(h.root,r.name).replaceAll('\\','/'),title:t.fullName,status:t.status})));
const coverageDir='unitarias/cobertura-jest-410-final';
const coverage=require('istanbul-lib-coverage').createCoverageMap(read(coverageDir+'/coverage-final.json')).getCoverageSummary().toJSON();
const contracts=units.filter(t=>/contract.*\.test|\.contract\.test/.test(t.file));
const memory=units.filter(t=>t.file.endsWith('gamification.audit.integration.test.js'));
function tap(file,expected){const s=text(file);assert.match(s,new RegExp('# tests '+expected+'\\b'));assert.match(s,new RegExp('# pass '+expected+'\\b'));assert.match(s,/# fail 0\b/);return {executed:expected,passed:expected,failed:0,skipped:0,file};}
const accessMeta=latest('integracion','acceso-final'),functionalMeta=latest('integracion','funcional-final'),edgeMeta=latest('unitarias','edge-final');
const access=tap(accessMeta.file.replace('.meta.json','.stdout.log'),34),functional=tap(functionalMeta.file.replace('.meta.json','.stdout.log'),18),edge=tap(edgeMeta.file.replace('.meta.json','.stdout.log'),20);
const rankCandidates=fs.readdirSync(path.join(h.evidence,'integracion')).filter(f=>/^ranking-categoria(?:-.*)?\.json$/.test(f)).map(file=>({file:'integracion/'+file,at:Number(/-(\d{13})-/.exec(file)?.[1]||fs.statSync(path.join(h.evidence,'integracion',file)).mtimeMs)})).filter(r=>r.at>=Date.parse(functionalMeta.start)&&r.at<=Date.parse(functionalMeta.end));
assert.equal(rankCandidates.length,1,'Vincular el ranking al mismo intervalo de la integración final');
const ranking={...read(rankCandidates[0].file),evidence:rankCandidates[0].file};
const httpMeta=latest('integracion','edge-http-pruebas');assert.equal(httpMeta.exitCode,0);const http=tap(httpMeta.file.replace('.meta.json','.stdout.log'),12);
const healthMeta=latest('integracion','functions-health-final');assert.equal(healthMeta.exitCode,0);const health=tap(healthMeta.file.replace('.meta.json','.stdout.log'),2);
const denoMeta=latest('integracion','deno-typecheck');assert.equal(denoMeta.exitCode,0);
const groups=['publicas-finales','paneles-finales','mutaciones-finales','limites-finales'];
const browsers=groups.map(label=>({label,...read(label+'/resultados.json').stats,...read(label+'/ejecucion.meta.json')}));
assert.deepEqual(browsers.map(r=>r.expected),[133,105,7,4]);assert.ok(browsers.every(r=>r.exitCode===0&&r.unexpected===0&&r.skipped===0&&r.flaky===0));
function specs(s){return [...s.specs||[],...(s.suites||[]).flatMap(specs)];}
const browserCases=groups.flatMap(group=>read(group+'/resultados.json').suites.flatMap(specs).flatMap(s=>s.tests.map(t=>({group,file:s.file,title:s.title,project:t.projectName,status:t.status}))));assert.equal(browserCases.length,249);
const builds=fs.readdirSync(h.evidence).filter(f=>/^compilacion-web-build-\d+\.meta\.json$/.test(f)).sort().map(file=>({file,...read(file)}));assert.ok(builds.length>=2&&builds.every(r=>r.exitCode===0));
const audits=['raiz','functions','auxiliar'].map(name=>({name,before:read('seguridad/npm-'+name+'-after.json').metadata.vulnerabilities,after:read('seguridad/npm-'+name+'-final.json').metadata.vulnerabilities}));
const rollback=latest('seguridad','rollback-verificado','.json');const rollbackResult=read(rollback.file);assert.equal(rollbackResult.passed,true);assert.equal(rollbackResult.functionAclsRestored,11);
const context=read('CONTEXTO.json'),env=read('herramientas-entorno.json');
const summary={generatedAt:new Date().toISOString(),commit:context.commit,branch:cp.execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),modifiedTree:true,productionChanged:false,pushed:false,environment:env,jest:{suites:87,executed:410,passed:410,failed:0,skipped:0,processSeconds:read('unitarias/jest-410-final.meta.json').durationSeconds},contracts:{executed:contracts.length,subsetOfJest:true},memoryIntegration:{executed:memory.length,subsetOfJest:true,realPersistence:false},coverage,access,functional,edge,http,health,browsers,builds,audits,rollback:rollbackResult,deno:denoMeta,ranking,migration:'database/security/local/20261029141114_riovoley_security_local.sql'};
save('RESUMEN_FINAL.json',summary);save('unitarias/casos-jest.json',units);save('e2e/casos-playwright.json',browserCases);save('unitarias/cobertura-resumen.json',coverage);
const table=[
 ['UT-01','Jest y Testing Library',410,410,0,0,'APROBADO','unitarias/jest-410-final.json'],
 ['CON-01','Contratos incluidos en UT-01',contracts.length,contracts.length,0,0,'APROBADO','unitarias/casos-jest.json'],
 ['INT-M','Integración en memoria incluida en UT-01',memory.length,memory.length,0,0,'APROBADO','unitarias/casos-jest.json'],
 ...[['SEC-R','Seguridad REST/RPC/PG local',access],['INT-R','Flujos funcionales con persistencia local',functional],['EDGE-C','Contratos Edge con dependencias simuladas',edge],['EDGE-H','Handlers HTTP originales con Auth/PG reales',http],['HTTP-F','Express functions en loopback',health]].map(([code,name,r])=>[code,name,r.executed,r.passed,0,0,'APROBADO',r.file]),
 ...browsers.map((b,i)=>['E2E-'+(i+1),b.label,b.expected,b.expected,0,0,'APROBADO',b.label+'/resultados.json']),
 ['SQL-01','Reversión de definiciones/ACL/políticas','—','—','—','—','APROBADO',rollback.file],
 ['DEN-01','Deno check: cuatro entrypoints','—','—','—','—','APROBADO',denoMeta.file],
 ['WEB-01','Compilación web','—','—','—','—','APROBADO',builds.at(-1).file],
 ...audits.map(a=>['NPM-'+a.name,'npm audit '+a.name+' (avisos, no casos)','—','—','—','—',a.after.total?'EJECUTADO: AVISOS':'APROBADO','seguridad/npm-'+a.name+'-final.json']),
 ['AND-01','Nueva compilación Android en esta etapa','—','—','—','—','NO EJECUTADO','../../20261028-200050-android-actualizado-c71f55e/android/artefacto-final.json'],
 ['PROD-01','Aplicación institucional del endurecimiento','—','—','—','—','BLOQUEADO: AUTORIZACIÓN',path.relative(h.evidence,path.join(h.root,'database/security/local/README.md')).replaceAll('\\','/')],
 ].map(r=>`| ${r.slice(0,-1).join(' | ')} | ${ref(r.at(-1))} |`).join('\n');
// El expediente Android anterior comparte el directorio padre, no el abuelo.
const correctedTable=table.replaceAll('../../20261028-200050-android-actualizado-c71f55e','../20261028-200050-android-actualizado-c71f55e');
const report=`# Informe de verificación técnica: seguridad y regresión local

## 1. Proyecto, commit y alcance autorizado

RIOVOLEY, repositorio https://github.com/Joscoo/riovoley. Base **${context.commit}**, rama **${summary.branch}**, con cambios sin publicar identificados en el inventario final. Fecha de inicio UTC: ${context.createdAt}; generación: ${summary.generatedAt}. Zona de trabajo: America/Guayaquil. ${ref('CONTEXTO.json')}. No se modificó el documento de tesis ni el backend institucional. Los seis expedientes anteriores permanecen como antecedentes íntegros; las cifras finales de este informe proceden de ejecuciones nuevas.

El usuario autorizó continuar la corrección en el backend local descartable. La autorización no se extiende a producción, publicación de funciones, distribución de APK ni push nuevos. El SQL se conserva fuera de supabase/migrations y exige un marcador de alcance, RLS activo y vistas invocadoras. ${source(summary.migration)}, ${source('database/security/local/README.md')}.

## 2. Entorno y configuración

${env.os} ${env.release}, ${env.architecture}; Node ${env.node}, npm 11.16.0; PostgreSQL ${env.postgres}; driver pg8.23.1 y Deno2.9.6 portátiles/locales. API127.0.0.1:55321, PG127.0.0.1:55322, frontend127.0.0.1:6100, SMTP/Mailpit127.0.0.1:55324. ${ref('herramientas-entorno.json')}. Las cuentas son sintéticas y descartables. Variables requeridas: REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY, REACT_APP_PII_ENCRYPTION_KEY y E2E_* se resuelven desde .e2e-local; RIOVOLEY_LOCAL_DB_PASSWORD es opcional para el driver; las claves del servidor Deno se inyectan únicamente al proceso. No se publican valores.

Docker Desktop no estaba iniciado y su API Windows quedó sin responder aun cuando Auth/REST/PG locales funcionaban. Se preservaron los intentos fallidos y se usó conexión PG exclusivamente de loopback. Antes de ejecutar SQL, el driver contrasta el UID y correo de la cuenta sintética de Auth con la misma base; rechaza cualquier otra URL/proyecto. No se ejecut? SQL ni se orden? recrear o reiniciar otros stacks. El árbol functions declara Node22 y se comprobó con Node24; los avisos EBADENGINE se conservan.

## 3. Método y comandos

Se observaron fallos antes de corregirlos, se aplicó el SQL en una transacción local, se verificaron las rutas negativas y los flujos legítimos, y se ejecutaron reversión, comparación y reaplicación. ${source('docs/superpowers/plans/2026-10-29-seguridad-local.md')} y ${source('database/security/local/README.md')} detallan preparación, copias y restricciones. Los códigos de salida y tiempos están en cada *.meta.json; los comandos SQL independientes dejan también resultados explícitos. Secuencia principal, siempre en un expediente nuevo:

\`\`\`powershell
node scripts/audit/security/install-driver.cjs
node scripts/audit/security/snapshot.cjs
node scripts/audit/security/authorization-snapshot.cjs
node scripts/audit/security/apply-local.cjs preflight
node scripts/audit/security/apply-local.cjs apply
node scripts/audit/security/run.cjs access acceso-nuevo
node scripts/audit/security/run.cjs functional funcional-nuevo
node scripts/audit/security/run.cjs edge edge-nuevo
node scripts/audit/security/run.cjs full jest-nuevo
node scripts/e2e/local/build.cjs
node scripts/audit/closure/browser-regression.cjs
node scripts/audit/security/deno-typecheck.cjs
node scripts/audit/security/edge-http.cjs
node scripts/audit/security/verify-final.cjs
node scripts/audit/security/check-functions.cjs
node scripts/audit/closure/audit-dependencies.cjs final
\`\`\`

El arnés inicializa un expediente mediante initialize.cjs. No volver a tomar snapshots de un backend modificado pretendiendo que son el estado previo. Las etiquetas de salida deben ser nuevas al reproducir. Para semántica de políticas restrictivas y funciones se consultó la documentación oficial de [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) y [funciones PostgreSQL](https://supabase.com/docs/guides/database/functions); la comprobación efectiva se hizo sobre el catálogo y el backend locales.

## 4. Resultados y denominadores

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
${correctedTable}

CON-01 e INT-M son subconjuntos de los410 casos y no se suman de nuevo. Los34 casos de seguridad,18 funcionales,20 contratos Edge,12 HTTP reales y2 HTTP Express son runners separados. Playwright registra249 instancias:133 públicas +105 de paneles/filtros +7 flujos con escritura local +4 límites de anchura. Los intentos fallidos o intermedios se conservan; no se agregan a los denominadores finales.

## 5. Unitarias y componentes

**410/410 casos en87 suites**, cero fallos/omitidos, ${summary.jest.processSeconds} s de proceso. Cobertura instrumentada: sentencias ${coverage.statements.pct}%, ramas ${coverage.branches.pct}%, funciones ${coverage.functions.pct}% y líneas ${coverage.lines.pct}%. ${ref(coverageDir+'/lcov-report/index.html')}, ${ref('unitarias/cobertura-resumen.json')}, ${ref('unitarias/casos-jest.json')}. Los módulos incluyen autenticación/sesiones, usuarios, pagos, asistencias, evaluaciones, comunicados/notificaciones, reportes, gamificación y UI compartida. La cobertura no representa todos los comportamientos posibles.

Se añadieron cuatro regresiones sobre recompensa atómica/lecturas sin escrituras y dos sobre autorización del borrado antes de eliminar filas. En el primer recorrido completo falló un test financiero cuyo pago supuestamente vigente terminaba el día28 del mes; el29 ya representaba correctamente una deuda. Se cambió únicamente el dato de cobertura al último día real del mes, manteniendo las expectativas y la lógica de producción. La corrección de esa dependencia del calendario está sustentada por ${ref('unitarias/jest-408-final.json')} y ${ref('unitarias/jest-410-final.json')}.

## 6. Contratos e integración

Los20 casos Edge verifican autorización canónica, suspensión, rechazo de perfiles alternativos, objetivos de eliminación por rol y contratos de comunicaciones/credenciales. Usan dependencias simuladas: no son entrega real de correo/push. Deno check aprobó cuatro entrypoints/árboles de importación del código modificado, ${ref(denoMeta.file)}. El primer chequeo detectó expansión excesiva de tipos del SDK; se acotó el adaptador de consulta canónica y el chequeo posterior aprobó sin omitir tipos.

Los18 casos de ${source('tests/integration/gamification.local.test.cjs')} usan Auth, REST, RPC y PostgreSQL reales locales. Se conserva un adaptador vacío de notificaciones externas; la persistencia y los repositorios de negocio no están simulados. G01–G17 comprueban XP/niveles/historial, rachas, logros/retos/campaña, identidad/títulos/avatar, wallet, compra/equipamiento, ingreso diario e interacción con pagos/asistencias/evaluaciones; G17 entrega recuperación en SMTP/Mailpit local, sin cambiar contraseñas.

G18 amplía la comprobación de clasificaciones: **${summary.ranking.participants} participantes** de la categoría del fixture, posiciones consecutivas, puntuación descendente, desempate por nivel/UUID, correspondencia servicio/snapshot y categoría inexistente vacía. ${ref(ranking.evidence)}. No se extrapola a todas las categorías o métricas.

Los12 casos HTTP ejecutan los handlers originales de delete-auth-user y send-push en Deno con Auth/PG reales. Solo se sustituye el arranque del servidor por un listener de loopback. La ejecución final usa --cached-only y permisos de red limitados a55321/6161, sin descarga de módulos ni proveedores externos; la preparación de caché previa sí descargó dependencias públicas. Se comprueban 401/403, perfiles legados, objetivos administrativos rechazados y el borrado real de atletas descartables mediante los repositorios de administrador/entrenador. Push autorizado con cuerpo vacío devuelve400 antes del proveedor; **no se envía ningún push**. ${ref(http.file)}. No equivale a despliegue en Supabase Cloud ni a transacción distribuida entre Auth y PostgreSQL.

## 7. Seguridad y permisos reales

Los34 casos de ${source('tests/integration/security.local.test.cjs')} cubren anónimo, atleta, personal activo y suspendido. La primera matriz de20 comprobaciones obtuvo5 aprobadas/15 fallidas; al ampliar el alcance se conservaron otros ciclos RED/GREEN. El resultado final es34/34. Se verificaron escrituras propias y ajenas, pagos por REST/RPC, modificación de rol/suspensión, metadatos de alta, duplicación/categoría del estudiante, inventario/logros no adquiridos, reloj/importe no controlables por el cliente y12 peticiones concurrentes que entregan una sola recompensa de8XP. El cambio de relación deportiva no habilita una segunda recompensa al mismo actor.

RLS permanece activo en **gamification.xp_ledger y gamification.login_rewards**, además de wallet/ledger. Las políticas nuevas impiden escrituras del atleta sobre resultados y fuentes protegidas; login_rewards solo se modifica mediante la RPC/servidor. Las RPC UUID de pagos son invocadoras, validan personal activo y no tienen ejecución anónima. Las firmas bigint conservadas no compiten con UUID ni tienen ejecución web. El trigger de auditoría usa esquema explícito. ${ref('seguridad/verificacion-catalogo.json')}, ${ref('seguridad/funciones-finales.json')}, ${ref('seguridad/politicas-finales.json')}.

El personal activo conserva su capacidad administrativa; el cálculo de proyecciones sigue en los casos de uso existentes con escrituras autorizadas. No se afirma que todo el progreso se calcule en el servidor. La compra RPC comprueba desbloqueo al adquirir; se conservan gasto confirmado y compras durante resincronización, y una transición192→200XP por ingreso diario permite una compra de nivel2. Los24 días de historial de ese caso son un fixture sintético, no24 días de observación temporal. Las reglas no revocan retrospectivamente cosméticos ya adquiridos.

Se probó la reversión real y se compararon **11 definiciones de funciones,11 ACL y111 políticas** de los esquemas incluidos en la instantánea; se retiró la RPC diaria nueva y después se reaplicó la corrección y se repitieron las pruebas. ${ref(rollback.file)}. No se restauraron datos descartables ni se presenta ese procedimiento como respaldo institucional. El SQL de reversión es evidencia para el estado local observado, no una migración universal.

## 8. Playwright

${browsers.map(b=>`- ${b.label}: ${b.expected}/${b.expected}, cero omitidos y reintentos; ${((b.duration||0)/1000).toFixed(3)} s; ${ref(b.label+'/html/index.html')}.`).join('\n')}

Incluye navegación pública, acceso sin sesión, paneles de tres roles, búsquedas/filtros/ordenación, siete altas/pago/asistencia con datos locales y límites481/600/767/768px. Siete perfiles entre390 y1920px. Los28 casos de recuperación de contraseña en navegador interceptan Auth/REST y no prueban autenticación remota. Los demás flujos autenticados usan el Auth local. Se conservan HTML/JSON y capturas pertinentes, sin trazas/vídeos con sesiones.

## 9. Compilación web

CRA/react-scripts build finalizó con salida0, ${builds.at(-1).durationSeconds} s, con Node/npm indicados. El build local activo queda en .e2e-local, sin distribución. ${ref(builds.at(-1).file)}, ${ref(builds.at(-1).file.replace('.meta.json','.stdout.log'))}. Los logs conservan advertencias de CRA/ESLint/tamaño y la deprecación fs.F_OK. Compilar no acredita todas las funcionalidades.

## 10. Android

No se volvió a compilar ni ejecutar Android en esta etapa: el cambio se concentró en el contrato web/backend. La compilación y ejecución nativas del28 de octubre permanecen como **antecedentes**, no resultados nuevos del árbol modificado: ${ref('../20261028-200050-android-actualizado-c71f55e/android/artefacto-final.json')}. Se mantiene pendiente verificar una publicación coordinada del cliente Android actualizado, flujos autenticados nativos y dispositivo físico. No se distribuyó un APK ni se publicó una versión.

## 11. Dependencias y servicios auxiliares

| Árbol npm | Avisos antes →después | Altos antes →después | Moderados antes →después | Críticos finales |
|---|---:|---:|---:|---:|
${audits.map(a=>`| ${a.name} | ${a.before.total} →${a.after.total} | ${a.before.high} →${a.after.high} | ${a.before.moderate} →${a.after.moderate} | ${a.after.critical} |`).join('\n')}

functions solo importa Express para dos rutas de diagnóstico. Se retiraron Genkit no utilizado y un comando que apuntaba a un archivo inexistente; posteriormente npm audit fix --ignore-scripts --json corrigió un aviso compatible restante de path-to-regexp. No se utilizó --force, no se degradó Genkit y no se migró CRA. Build/lint y2 pruebas HTTP Express aprobaron después del cambio. ${ref('seguridad/functions-retirar-genkit.meta.json')}, ${ref('seguridad/functions-parche-compatible.meta.json')}, ${ref(health.file)}. Los JSON npm finales están en seguridad/npm-*-final.json. La raíz conserva35 avisos (13 altos,6 moderados,16 bajos); no se ocultaron ni se presentó react-scripts0.0.0 como reparación válida.

## 12. Incidencias y límites

Se conservan los intentos fallidos de arranque Docker, preparación de fixtures, RLS/grants, comprobación de tipos y regresiones. Una primera aplicación olvidó el permiso de ejecución del helper para service_role: falló la preparación de24 casos y se corrigió antes del resultado válido. Se ajustaron campos de fixtures a sus contratos reales (método de pago, fecha de nacimiento, columnas generadas no escribibles); no se suprimieron casos. Para UPDATE bloqueado por RLS se comprueba también que la fila permanece intacta, ya que puede devolver cero filas sin excepción.

La eliminación de usuarios ahora autoriza Auth mientras existe el rol canónico y evita mutaciones ante un rechazo; Auth/PG siguen sin una transacción distribuida. No se ha probado recuperación automática de todas las interrupciones posteriores. La comprobación de permisos tiene alcance definido y no es una prueba de penetración completa. Tampoco acredita usabilidad, motivación, interacción de participantes ni resultados USE/UES-SF.

## 13. Integridad y pendientes

${ref('RESUMEN_FINAL.json')}, ${ref('INTEGRIDAD.json')}, ${ref('PRIVACIDAD.json')} y ${ref('MANIFIESTO_SHA256.json')} sustentan cifras, enlaces, privacidad y huellas. Los archivos anteriores no se reescribieron. El código permanece en una rama local sin nueva publicación; el manifiesto identifica el árbol modificado.

Pendientes: autorización y plan de aplicación institucional coordinada (SQL, funciones y clientes), revisión de roles/datos heredados y compatibilidad de clientes antiguos;35 avisos de la raíz; entrega externa Resend/FCM; Android actualizado y dispositivo físico; ampliación de ranking a otras categorías/métricas y recuperación distribuida de borrados. Los providers no se sustituyen por resultados simulados. Los tres documentos de esta etapa son propuesta verificable para revisión académica.
`;
doc('INFORME_VERIFICACION_TECNICA.md',report);
const predicates=[t=>t.file.endsWith('/createGamificationUseCases.test.js'),t=>t.file.endsWith('/createGamificationService.test.js'),t=>t.file.includes('/gamification/')&&/identit|identidad|avatar|nickname|title|título|portrait/i.test(t.title),t=>t.file.includes('/gamification/')&&/wallet|coin|moneda|currency|saldo/i.test(t.title),t=>t.file.includes('/gamification/')&&/buy|purchase|cosmetic|equip|shop|tienda|compra/i.test(t.title),t=>t.file.includes('/attendance/'),t=>t.file.includes('/payments/'),()=>false];
const descriptions=[['Caso de uso de gamificación','G01–G09/G14/G16','Proyección del dominio y persistencia; personal conserva sincronización'],['Servicio público de gamificación','G01/G07/G08/G09/G16/G18','Servicios reales; G18 valida una categoría overall'],['Identidad del atleta','G10/G15; S28/S29/S30','Propiedad y rol canónico; no evaluación de preferencias'],['Wallet y monedas','G07/G11/G13; S05/S24','Saldo, gasto y resincronización; fixtures locales'],['Tienda cosmética','G11/G12/G13; S17/S31/S33','RPC real, inventario y desbloqueo; sin pagos externos'],['Asistencia','G02/G03/G14; S22; siete E2E compartidos','Datos descartables; sin registros institucionales'],['Pagos','G04/G05; S01–S03/S13–S16; siete E2E compartidos','REST/RPC y autorización local; sin transacciones reales'],['Compilación del proyecto','CRA y functions nuevos; Android como antecedente','Comandos con salida0, sin denominador de casos']];
const traces=descriptions.map((d,i)=>({category:d[0],jestCases:units.filter(predicates[i]),realCases:d[1],limitation:d[2]}));save('trazabilidad-detallada.json',traces);
doc('MATRIZ_VERIFICACIONES_TESIS.md',`# Matriz de trazabilidad: Tabla4-6 y verificaciones complementarias

Base ${context.commit}, rama ${summary.branch}, ${summary.generatedAt}. Se relacionan únicamente los resultados de esta ejecución. Las categorías se solapan; sus cantidades no se suman. El inventario exacto de archivos/aserciones y estados está en ${ref('trazabilidad-detallada.json')} y ${ref('unitarias/casos-jest.json')}.

| Categoría | Casos Jest ejecutados/aprobados | Archivos exactos | Casos reales relacionados | Tipo, mocks/servicios y límites |
|---|---:|---|---|---|
${traces.map((t,i)=>`| ${i+1}. ${t.category} | ${i===7?'No aplica':t.jestCases.length+'/'+t.jestCases.length} | ${[...new Set(t.jestCases.map(c=>c.file))].map(source).join('<br>')||source('package.json')} | ${t.realCases} | ${i===7?'Compilación real': 'Jest: mocks o repositorios en memoria; G/S: Auth/REST/RPC/PG local real'}. ${t.limitation}. |`).join('\n')}

Las selecciones de identidad/wallet/tienda se apoyan en nombres de aserción explícitos y pueden compartir archivos y casos. No son porcentajes de cobertura funcional. Los ${contracts.length} contratos y ${memory.length} casos en memoria son subconjuntos de410, distintos de las18 integraciones y34 verificaciones de seguridad reales.

Los casos G01–G18 están en ${source('tests/integration/gamification.local.test.cjs')} y ${ref(functional.file)}. Los S01–S34 están en ${source('tests/integration/security.local.test.cjs')} y ${ref(access.file)}. G18 comprueba orden, desempate, posición y filtro sobre ${summary.ranking.participants} participantes de una categoría overall; no todas las categorías/métricas. G17 comprueba SMTP/Mailpit local. La recompensa diaria concurrente y la protección de identidad/rol se verifican en S08/S09/S10–S12/S25–S30/S32; el cruce de nivel y compra válida en S33 utiliza historial sintético.

## Complementos

- Playwright:249/249, ${groups.map(g=>ref(g+'/resultados.json')).join(', ')}; casos detallados en ${ref('e2e/casos-playwright.json')}. Incluye28 casos de recuperación con interceptación, diferenciados de G17.
- Edge:20 contratos con mocks, ${ref(edge.file)};12 HTTP reales en Deno con handlers originales/Auth/PG local, ${ref(http.file)}; cuatro entrypoints con Deno check, ${ref(denoMeta.file)}. No se envió push.
- Seguridad:34/34 y catálogo ${ref('seguridad/verificacion-catalogo.json')}; reversión de11 funciones/ACL y111 políticas comparadas, ${ref(rollback.file)}. Solo aplicación local autorizada.
- Compilación: ${ref(builds.at(-1).file)}; build/lint y dos respuestas HTTP Express, ${ref(health.file)}. Android no se repitió; ${ref('../20261028-200050-android-actualizado-c71f55e/android/artefacto-final.json')} es antecedente separado.
- Dependencias: ${audits.map(a=>ref('seguridad/npm-'+a.name+'-final.json')).join(', ')}. functions y auxiliar sin avisos; raíz mantiene35.

${ref('INFORME_VERIFICACION_TECNICA.md')} contiene método, duración, cobertura y limitaciones. ${ref('INTEGRIDAD.json')} y ${ref('MANIFIESTO_SHA256.json')} permiten contrastar cifras y archivos. No se vinculan estos resultados a usabilidad, motivación, USE o UES-SF.
`);
doc('RESULTADOS_PARA_TESIS_4_5.md',`# Propuesta para revisión académica del apartado4.5

Texto propuesto para incorporar después de la Tabla4-6. No se modificó el documento de tesis.

En la verificación del29 de octubre de2026, realizada sobre el commit base ${context.commit.slice(0,7)} y el árbol local modificado identificado en el inventario de fuentes, se aprobaron **410 casos Jest distribuidos en87 suites**, con cobertura instrumentada de líneas de ${coverage.lines.pct}%. Los ${contracts.length} contratos y ${memory.length} casos de integración en memoria están incluidos en ese mismo denominador y no acreditan persistencia en PostgreSQL. Los archivos y aserciones están identificados en ${ref('unitarias/jest-410-final.json')}, ${ref('unitarias/casos-jest.json')} y ${ref('unitarias/cobertura-resumen.json')}.

De manera independiente, se aprobaron **18 integraciones funcionales con persistencia real local**, que comprobaron gamificación, identidad, wallet, tienda y su interacción con asistencia, pagos y evaluaciones, además de recuperación mediante SMTP local. La clasificación incorporó posiciones consecutivas, orden y desempate, correspondencia con el servicio y filtrado de una categoría de fixture con ${summary.ranking.participants} participantes. Ese resultado no se extrapola a todas las categorías y métricas. La matriz y los registros correspondientes se encuentran en ${ref('MATRIZ_VERIFICACIONES_TESIS.md')}, ${ref(functional.file)} y ${ref(ranking.evidence)}.

El endurecimiento autorizado se aplicó exclusivamente a un backend Supabase/PostgreSQL local descartable. Se aprobaron **34 comprobaciones reales de seguridad**, incluidas restricciones de escritura por rol, acceso REST/RPC a pagos y resultados, protección frente a autoasignación de privilegios y recompensa diaria atómica de ocho XP con idempotencia por actor/fecha. Se verificó también la reversión y reaplicación de definiciones, ACL y políticas del estado local observado. Los20 contratos Edge con dependencias simuladas se distinguen de las12 pruebas HTTP de handlers originales con Auth/PostgreSQL reales locales. Estas últimas comprobaron denegaciones y eliminación de cuentas descartables; no constituyeron envíos reales de notificaciones. Evidencia: ${ref(access.file)}, ${ref(rollback.file)}, ${ref(edge.file)} y ${ref(http.file)}.

La regresión de navegador aprobó **249 instancias Playwright** —133 públicas,105 de paneles y consultas, siete flujos con escritura local y cuatro límites adicionales de anchura—, y la compilación web finalizó con código0. Los28 casos de recuperación de contraseña en navegador utilizaron interceptación de servicios y se separan de la comprobación SMTP local. En esta etapa no se repitió la compilación ni la ejecución nativa Android; sus resultados anteriores se conservan como antecedentes y no validan el cliente modificado. Véanse ${groups.map(g=>ref(g+'/resultados.json')).join(', ')} y ${ref(builds.at(-1).file)}.

La retirada de una dependencia Genkit no utilizada y un parche compatible redujeron los avisos npm de functions de62 a0, con compilación, lint y dos respuestas HTTP de diagnóstico aprobadas. La raíz conservó35 avisos, incluidos13 altos; no se ocultaron esas incidencias ni se modificó el framework para obtener una aprobación artificial. Los cambios institucionales y la publicación coordinada de SQL, funciones y clientes siguen pendientes de autorización; tampoco se comprobó entrega externa Resend/FCM, funcionamiento nativo actualizado o recuperación distribuida ante todas las interrupciones. Por ello, las conclusiones se limitan a los comportamientos técnicos comprobados y no acreditan seguridad total, usabilidad, motivación ni interacción con participantes. Véanse ${audits.map(a=>ref('seguridad/npm-'+a.name+'-final.json')).join(', ')} y ${source('database/security/local/README.md')}.
`);
console.log(JSON.stringify({evidence:h.evidence,jest:410,suites:87,security:34,functional:18,edge:20,http:12,playwright:249,lines:coverage.lines.pct}));
