const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
assert.ok(!fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')));
const read=f=>JSON.parse(fs.readFileSync(path.join(h.evidence,f),'utf8'));
const text=f=>fs.readFileSync(path.join(h.evidence,f),'utf8');
const ref=f=>`[${f}](${f})`;
const source=f=>ref(path.relative(h.evidence,path.join(h.root,f)).replaceAll('\\','/'));
const labels=['publicas-finales','paneles-verificados','mutaciones-reanudadas','limites-finales'];
const names=['Navegación pública, acceso anónimo y recuperación','Paneles por rol, navegación, búsquedas, filtros y ordenación','Alta de atleta, pago y asistencia con recarga','Límites adaptables de pagos'];
const flatten=s=>[...(s.specs||[]),...(s.suites||[]).flatMap(flatten)];
const cases=[];
const groups=labels.map((label,i)=>{
 const result=read(label+'/resultados.json'),meta=read(label+'/ejecucion.meta.json');
 for(const spec of result.suites.flatMap(flatten))for(const test of spec.tests){
  const final=test.results.at(-1);
  const file=path.isAbsolute(spec.file)?path.relative(h.root,spec.file).replaceAll('\\','/'):spec.file.startsWith('tests/')?spec.file:'tests/e2e/'+spec.file;
  cases.push({group:label,file,title:spec.title,project:test.projectName,expectedStatus:test.expectedStatus,status:test.status,actualStatus:final?.status,attempts:test.results.length,durationMs:test.results.reduce((n,r)=>n+r.duration,0),dependencies:file.endsWith('auth.password-recovery.spec.js')?'Auth/REST interceptados con respuestas simuladas':'Frontend público o Auth/REST/backend local reales según el flujo'});
 }
 return {label,name:names[i],...result.stats,meta,evidence:label+'/resultados.json',html:label+'/html/index.html',cases:cases.filter(c=>c.group===label).length};
});
const total={executed:cases.length,passed:cases.filter(c=>c.actualStatus==='passed').length,failed:cases.filter(c=>!['passed','skipped'].includes(c.actualStatus)).length,skipped:cases.filter(c=>c.actualStatus==='skipped').length,flaky:groups.reduce((n,g)=>n+g.flaky,0)};
const priorPanelResults=['paneles-finales','paneles-corregidos'].map(label=>{
 const result=read(label+'/resultados.json');
 return {label,executed:result.stats.expected+result.stats.unexpected+result.stats.skipped+result.stats.flaky,passed:result.stats.expected,failed:result.stats.unexpected,skipped:result.stats.skipped,meta:read(label+'/ejecucion.meta.json'),evidence:label+'/resultados.json'};
});
const initialPanelResult=priorPanelResults[0],httpAssertionResult=priorPanelResults[1];
const completedInvocations=priorPanelResults.reduce((n,g)=>({executed:n.executed+g.executed,passed:n.passed+g.passed,failed:n.failed+g.failed,skipped:n.skipped+g.skipped}),{executed:total.executed,passed:total.passed,failed:total.failed,skipped:total.skipped});
const buildFile=fs.readdirSync(h.evidence).find(f=>/^compilacion-web-build-\d+\.meta\.json$/.test(f));
const build={file:buildFile,...read(buildFile)};
const context=read('CONTEXTO.json'),env=read('herramientas-entorno.json');
const mockCases=cases.filter(c=>c.file.endsWith('auth.password-recovery.spec.js'));
const mutations=cases.filter(c=>c.group==='mutaciones-reanudadas');
const guardsText=text('unitarias/guardas-locales.stdout.log');
const guards={executed:Number(guardsText.match(/# tests (\d+)/)?.[1]),passed:Number(guardsText.match(/# pass (\d+)/)?.[1]),failed:Number(guardsText.match(/# fail (\d+)/)?.[1]),skipped:Number(guardsText.match(/# skipped (\d+)/)?.[1])};
const previous='../20261029-221208-android-autenticado-317e5e3';
const state=total.failed||total.skipped||total.flaky||groups.some(g=>g.meta.exitCode!==0)?'CON INCIDENCIAS':'APROBADO';
const summary={generatedAt:new Date().toISOString(),commit:context.commit,environment:env,groups,total,initialPanelResult,priorPanelResults,completedInvocations,interrupted:read('e2e/interrupcion.json'),mockCases:mockCases.length,mutations:mutations.length,guards,build,persistence:read('integracion/persistencia-postgresql.json'),state,productionChanged:false,applicationChanged:false,testChange:'tests/e2e/filters-sorting.tables.spec.js: esperar la petición GET originada al limpiar filtros y decidir con sus filas reales, antes de comprobar el DOM; Response.ok() comprueba HTTP del navegador',harnessChange:'scripts/e2e/local/functions.cjs: reutilizar riovoley-e2e-loopback mediante --network-id'};
h.write('e2e/casos-playwright.json',cases);h.write('RESUMEN_FINAL.json',summary);
h.write('INFORME_VERIFICACION_TECNICA.md',`# Repetición final de la matriz E2E de RIOVOLEY

## Identificación, alcance y entorno

Commit base evaluado **${context.commit}**, rama fix/seguridad-local-20261029. Inicio UTC ${context.createdAt}; informe ${summary.generatedAt}. Se repite la matriz de navegadores sobre las fuentes de ese commit, después del arreglo Android y los parches de dependencias. No se modificaron src/ ni los lockfiles. Se corrigió la sincronización de una prueba de asistencias en tests/e2e/filters-sorting.tables.spec.js y se añadió --network-id riovoley-e2e-loopback al arranque local de funciones. Las huellas iniciales y finales identifican ambas diferencias respecto del commit base; el bundle del producto no cambió.

Entorno: ${env.os} ${env.release} ${env.architecture}, Node ${env.node}, npm ${text('herramientas/npm-version.stdout.log').trim()}, Playwright ${env.playwright}. ${ref('herramientas-entorno.json')}. Se usaron Chromium y WebKit en siete perfiles: 390, 430, 480, 768, 1024, 1440 y 1920 px. Los cuatro límites de pagos usan 481, 600, 767 y 768 px dentro de Chromium. Son perfiles de navegador, no dispositivos físicos ni WebView Android.

Frontend en 127.0.0.1:6100; Supabase local descartable en 127.0.0.1:55321 y PostgreSQL en 127.0.0.1:55322. Se verificó identidad de Auth y auth.users mediante consultas de lectura antes de las pruebas. Las escrituras se limitaron a cuentas y datos sintéticos. No se utilizó .env.e2e institucional ni se modificó producción. ${ref('seguridad/backend-local-verificado.json')}.

## Metodología y comandos

Se abrió otro expediente y se compiló un nuevo bundle con buildWebEnv: REACT_APP_SUPABASE_URL, ANON_KEY y PII_ENCRYPTION_KEY locales; se bloquearon los valores REACT_APP institucionales antes de dotenv. Las cuentas se inyectan desde credentials.json privado. Dos workers, cero reintentos, service workers bloqueados y proxy cerrado a destinos externos. Traces y vídeo desactivados para evitar guardar tokens; se conservan HTML, JSON, registros y capturas guiadas o de fallo.

~~~powershell
node scripts/audit/closure/initialize-e2e-final.cjs
node scripts/e2e/local/build.cjs
# Servir funciones en otra terminal con entorno de proveedores vacío:
node scripts/e2e/local/functions.cjs
node scripts/audit/closure/browser-regression.cjs
# Después de la interrupción y de corregir la sincronización del test:
node scripts/e2e/local/run.cjs pending --label=paneles-corregidos --workers=2
node scripts/e2e/local/run.cjs mutations --label=mutaciones-reanudadas --workers=2
node scripts/e2e/local/run.cjs boundaries --label=limites-finales --workers=2
node scripts/e2e/local/run.cjs pending --label=paneles-verificados --workers=2
node scripts/audit/closure/verify-e2e-final-persistence.cjs
~~~

El orquestador inició public, pending y mutations; la sesión se interrumpió durante mutations y boundaries aún no había comenzado. Se conservaron los resultados completos de public y pending. Después se repitió pending con la espera de red; ese intento descubrió un uso incorrecto de toBeOK con Response del navegador. Se conservó también y se repitió el grupo completo usando Response.ok(). Se ejecutaron mutations y boundaries con etiquetas independientes. Cada .meta.json registra comando real, inicio, fin, duración, cwd y código de salida. La corrección sustituye una lectura inmediata del DOM por una espera de la petición y de los elementos acordes a sus datos; mantiene la comprobación del estado vacío y de ordenación. No se omitieron casos por falta de credenciales. ${groups.map(g=>ref(g.label+'/ejecucion.meta.json')).join(', ')}; ${ref('e2e/interrupcion.json')}.

## Resultados observados

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| E02-A | Paneles: primer intento conservado | ${initialPanelResult.executed} | ${initialPanelResult.passed} | ${initialPanelResult.failed} | ${initialPanelResult.skipped} | FALLIDO | ${ref(initialPanelResult.evidence)}, ${ref('paneles-finales/html/index.html')} |
| E02-B | Paneles: intento con error de aserción HTTP | ${httpAssertionResult.executed} | ${httpAssertionResult.passed} | ${httpAssertionResult.failed} | ${httpAssertionResult.skipped} | FALLIDO | ${ref(httpAssertionResult.evidence)}, ${ref('paneles-corregidos/html/index.html')} |
${groups.map((g,i)=>{const list=cases.filter(c=>c.group===g.label);return `| E0${i+1} | ${g.name} | ${list.length} | ${list.filter(c=>c.actualStatus==='passed').length} | ${list.filter(c=>!['passed','skipped'].includes(c.actualStatus)).length} | ${list.filter(c=>c.actualStatus==='skipped').length} | ${g.meta.exitCode===0?'APROBADO':'FALLIDO'} | ${ref(g.evidence)}, ${ref(g.html)} |`;}).join('\n')}
| G01 | Guardas del arnés, Node test | ${guards.executed} | ${guards.passed} | ${guards.failed} | ${guards.skipped} | ${guards.failed?'FALLIDO':'APROBADO'} | ${ref('unitarias/guardas-locales.stdout.log')} |
| I01 | Consulta agregada PostgreSQL de solo lectura | — | — | — | — | APROBADO (control, sin denominador de casos) | ${ref('integracion/persistencia-postgresql.json')}, ${ref('integracion/persistencia-postgresql.meta.json')} |
| E03-A | Flujo de escritura inicial interrumpido | No determinable | — | — | — | BLOQUEADO por interrupción; se repitió como E03 | ${ref('e2e/interrupcion.json')} |
| B01 | Compilación web nueva | — | — | — | — | ${build.exitCode===0?'APROBADO':'FALLIDO'} | ${ref(buildFile)} |

La matriz final selecciona **${total.executed} instancias únicas**, ${total.passed} aprobadas, ${total.failed} fallidas, ${total.skipped} omitidas y ${total.flaky} clasificadas como flaky por Playwright. Cero reintentos automáticos no significa que toda la auditoría aprobara al primer intento: se repitió manualmente dos veces el grupo de 105 paneles. Al contar las tres ejecuciones completas de ese grupo hay **${completedInvocations.executed} ejecuciones de casos**, ${completedInvocations.passed} aprobadas y ${completedInvocations.failed} fallidas; no son casos únicos adicionales. El intento interrumpido de mutations carece de resultado final y se excluye de estas cifras. Los ocho casos Node corresponden al arnés y no se suman a Playwright. El inventario de la matriz final está en ${ref('e2e/casos-playwright.json')} y el fallo original en ${ref('e2e/fallos-primer-intento.json')}.

Duraciones de cada proceso Playwright: ${groups.map(g=>g.label+' '+g.meta.durationSeconds.toFixed(3)+' s').join('; ')}. La compilación duró ${build.durationSeconds.toFixed(3)} s, salida ${build.exitCode}; su bundle se guardó en runtime privado y se activó solo después de compilar correctamente. Las advertencias y archivos de salida figuran en ${ref(buildFile.replace('.meta.json','.stdout.log'))} y ${ref(buildFile.replace('.meta.json','.stderr.log'))}. Compilar no acredita todas las funcionalidades.

CRA emitió «Compiled successfully». stderr conserva una advertencia de obsolescencia DEP0176 sobre fs.F_OK; no se reportaron errores de compilación. El inventario de archivos efectivamente generados, tamaños y SHA-256 está en ${ref('compilacion-web/artefactos.json')}; el bundle completo, incluidos sus mapas, permanece en el runtime local privado.

## Mocks, integración real y límites

**${mockCases.length} instancias de auth.password-recovery.spec.js interceptan Auth/REST con respuestas simuladas**. Comprueban comportamiento de la interfaz y protocolo esperado; no prueban correo externo, cambios reales de contraseña ni persistencia PostgreSQL. Se identifican por separado en el inventario. Las otras pruebas usan el frontend público o el backend local real según su alcance; no se afirma que todas ellas escriban o consulten PostgreSQL.

Las ${mutations.length} instancias de admin.happy-path-controlled.spec.js crean un atleta descartable, registran una mensualidad y una asistencia, exigen respuesta satisfactoria del POST y verifican ambos datos después de recargar. Auth/REST/PG son reales locales, sin mocks; los mismos casos cubren pagos y asistencia y no se duplican al sumar. Las contraseñas temporales quedan exclusivamente en runtime privado para su detección por el escaneo de privacidad. Se selecciona envío manual; no se contactan Resend, FCM ni destinatarios reales.

Como contraste independiente, una consulta agregada en una transacción PostgreSQL READ ONLY recuperó **7 atletas, 7 pagos de 35 y 7 asistencias** vinculados exclusivamente a las altas sintéticas creadas en la ventana temporal de ese grupo E2E. No devuelve identificadores ni datos personales. El control SQL no se suma a los casos Playwright; su comando, consulta, ventana, conteos y salida están en ${ref('integracion/persistencia-postgresql.json')} y ${ref('integracion/persistencia-postgresql.meta.json')}.

Las comprobaciones públicas de teclado, foco, landmarks y ausencia de overflow tienen alcance técnico acotado. No constituyen evaluación USE/UES-SF, usabilidad, motivación, experiencia del atleta ni certificación WCAG completa.

## Incidencias del entorno

El primer grupo de paneles obtuvo ${initialPanelResult.passed}/${initialPanelResult.executed}. El caso de filtros de asistencias en desktop-1920 decidió que no había datos mediante count() inmediatamente después de limpiar filtros. La instantánea DOM del fallo muestra días y asistencias cargados, mientras el test esperaba el mensaje de lista vacía. AsistenciasManager vuelve a cargar al cambiar queryState y sustituye temporalmente el contenedor por un spinner. El test ahora identifica la petición GET sin filtros de atleta/método y con el rango de fechas restaurado, exige respuesta HTTP satisfactoria y usa sus filas para esperar el estado visual correspondiente. Se conservan los controles de filtros, fechas y ordenación de tres estados. El grupo completo se repitió con otra etiqueta; su resultado figura separado del original. ${ref('e2e/fallos-primer-intento.json')}, ${source('tests/e2e/filters-sorting.tables.spec.js')}.

La primera versión de la corrección añadió toBeOK() a una Response de navegador, pero ese matcher exige APIResponse. Produjo ${httpAssertionResult.failed} fallos de la infraestructura de prueba y ${httpAssertionResult.passed} aprobaciones en 105 instancias; no se atribuyen esos errores al producto. Se sustituyó por expect(resetResponse.ok()).toBe(true), manteniendo el requisito HTTP 2xx. El grupo se repitió completo como paneles-verificados. ${ref(httpAssertionResult.evidence)}, ${ref('paneles-verificados/resultados.json')}.

Al reanudar la conversación Docker y los procesos Node anteriores estaban detenidos. Se arrancó Docker Desktop y únicamente el stack riovoley-e2e-local, sin volver a sembrar ni modificar esquemas. Se comprobó de nuevo la identidad del backend y se reanudó el flujo con otra etiqueta, conservando los artefactos incompletos y sin atribuirles aprobaciones. ${ref('e2e/interrupcion.json')}, ${ref('seguridad/reanudacion-local.json')}.

Después de completar los grupos se detuvo intencionalmente solo el contenedor Edge Runtime de este proyecto local, verificando antes su etiqueta. La CLI functions serve terminó con código 1 y señal de cierre 15 en su registro; corresponde al apagado solicitado del servidor y no se cuenta como prueba funcional fallida. ${ref('seguridad/cierre-edge.json')}, ${ref('edge-functions/serve.meta.json')}, ${ref('edge-functions/serve.stderr.log')}.

El primer preflight utilizó send-credentials, que no es un handler del repositorio; se conserva como diagnóstico inicial, sin considerarlo prueba funcional. La consulta al handler correcto send-email devolvió después 503 por resolución de nombres. Docker confirmó que Edge Runtime estaba en supabase_network_riovoley-e2e-local y Kong en riovoley-e2e-loopback. Se unió únicamente ese contenedor descartable a la red de su proyecto y el preflight pasó a HTTP200. La ayuda de la CLI confirmó --network-id; el arnés lo fija ahora para futuras ejecuciones. No se modificaron esquemas, RLS, usuarios institucionales ni otros stacks. ${ref('seguridad/red-edge.stdout.log')}, ${ref('seguridad/red-kong.stdout.log')}, ${ref('seguridad/kong-error-diagnostico.stderr.log')}, ${ref('seguridad/edge-unir-red-local.meta.json')}, ${ref('seguridad/edge-disponible.json')}.

## Verificaciones no repetidas y pendientes

Jest del producto, Android nativo y auditoría npm no se repitieron aquí. El expediente anterior documenta 419 Jest, 13 verificaciones WebView, compilación Android e instrumentación; se citan como antecedentes y no se suman a esta ejecución: ${ref(previous+'/INFORME_VERIFICACION_TECNICA.md')}. Las ocho guardas Node nuevas corresponden únicamente al arnés.

Persisten las 31 alertas de dependencias npm del análisis anterior, la aplicación institucional coordinada de SQL/RLS/Edge/clientes, FCM/Resend reales, dispositivo físico y ampliación de clasificaciones y recuperación ante fallos parciales de borrado. No se acredita estado de RLS institucional por las pruebas locales.

## Evidencias y cierre

${ref('RESUMEN_FINAL.json')}, ${ref('MATRIZ_VERIFICACIONES_TESIS.md')} y ${ref('RESULTADOS_PARA_TESIS_4_5.md')}. La integridad contrasta cifras finales y de los intentos previos, diferencias documentadas de fuentes, los ocho manifiestos anteriores y los archivos nuevos; el manifiesto SHA-256 excluye únicamente su propia huella. La revisión de privacidad incluye texto y ZIP base64 internos de los seis HTML. Los resultados y estados no se cambian durante la sanitización.
`);
const categories=['Pruebas del caso de uso de gamificación','Pruebas del servicio público de gamificación','Pruebas de identidad del atleta','Pruebas de wallet y monedas','Pruebas de tienda cosmética','Pruebas de asistencia','Pruebas de pagos','Compilación del proyecto'];
const trace=categories.map((category,i)=>({category,cases:i===5||i===6?mutations:[],scope:i<5?'Sin casos específicos nuevos; la navegación no sustituye la prueba del dominio. Consultar el antecedente Jest.':i<7?'Flujo UI con persistencia real local; los mismos siete casos se comparten entre las dos categorías.':'Compilación web real, sin denominador de casos.',evidence:i<5?previous+'/MATRIZ_VERIFICACIONES_TESIS.md':i<7?'mutaciones-reanudadas/resultados.json':buildFile}));
h.write('trazabilidad-detallada.json',trace);
h.write('MATRIZ_VERIFICACIONES_TESIS.md',`# Matriz complementaria para la Tabla 4-6

Commit ${context.commit}; ejecución ${context.createdAt}. Esta etapa repite E2E, sin atribuirle las pruebas unitarias anteriores. ${ref('trazabilidad-detallada.json')} conserva los casos exactos relacionados.

| Categoría | Archivos | Casos nuevos | Resultado real | Tipo, mocks o servicios | Limitaciones y evidencia |
|---|---|---:|---|---|---|
${trace.map((t,i)=>`| ${i+1}. ${t.category} | ${i<5?'Consultar archivos del antecedente':i<7?'tests/e2e/admin.happy-path-controlled.spec.js':'package.json; scripts/e2e/local/build.cjs'} | ${i<5?'0 específicos nuevos':i<7?t.cases.length:'No aplica'} | ${i<5?'NO EJECUTADO como prueba específica en esta etapa':i<7?t.cases.filter(c=>c.actualStatus==='passed').length+'/'+t.cases.length+' aprobados':build.exitCode===0?'APROBADO':'FALLIDO'} | ${i<5?'Jest anterior: mocks/memoria; no repetido':i<7?'E2E; Auth/REST/PG reales locales':'Compilación real con configuración local'} | ${t.scope} ${ref(t.evidence)} |`).join('\n')}

## Complementos

Playwright: matriz final de ${total.executed} instancias y ${total.passed} aprobadas, en cuatro grupos; ${mockCases.length} de recuperación simulan Auth/REST. El primer grupo de paneles obtuvo ${initialPanelResult.passed}/${initialPanelResult.executed}; el siguiente, ${httpAssertionResult.passed}/${httpAssertionResult.executed} por el error de aserción HTTP. Ambos se conservaron; la matriz final utiliza la tercera ejecución completa de paneles. ${ref('e2e/casos-playwright.json')}, ${ref(initialPanelResult.evidence)}, ${ref(httpAssertionResult.evidence)}. Las pruebas de navegación y filtros complementan los módulos, sin acreditar sus reglas de negocio completas.

Android: no repetido; ver ${ref(previous+'/INFORME_VERIFICACION_TECNICA.md')}. Seguridad: ocho guardas del arnés y comprobación de aislamiento local; no se reevalúa RLS institucional ni se repite npm audit. La corrección de red se limita a Docker local. Las categorías asistencia/pagos comparten casos y no se suman de nuevo.

La consulta complementaria de PostgreSQL READ ONLY encontró 7 atletas, 7 pagos de 35 y 7 asistencias en las altas sintéticas de la ventana E2E; es un control agregado, sin casos adicionales. ${ref('integracion/persistencia-postgresql.json')}.
`);
h.write('RESULTADOS_PARA_TESIS_4_5.md',`# Propuesta complementaria para revisión académica — apartado 4.5

La matriz de pruebas extremo a extremo de RIOVOLEY se repitió sobre el commit base ${context.commit.slice(0,7)}, posterior a la corrección del cierre de sesión Android y los parches de dependencias, con una corrección documentada de sincronización en el test de asistencias y sin modificar el producto. La matriz final reunió ${total.executed} instancias únicas: ${total.passed} aprobadas, ${total.failed} fallidas, ${total.skipped} omitidas y ${total.flaky} clasificadas como flaky por Playwright. El primer grupo de paneles obtuvo ${initialPanelResult.passed}/${initialPanelResult.executed} por una lectura anticipada del historial; la primera corrección registró ${httpAssertionResult.passed}/${httpAssertionResult.executed} por un uso incompatible del matcher HTTP en el propio test. Se conservaron ambos intentos y se repitió el grupo completo con la aserción corregida. No se configuraron reintentos automáticos. En conjunto se registraron ${completedInvocations.executed} ejecuciones completas de casos, ${completedInvocations.passed} aprobadas y ${completedInvocations.failed} fallidas, considerando las tres ejecuciones de paneles. Los grupos finales comprendieron ${groups.map(g=>g.cases+' de '+g.name.toLowerCase()).join(', ')}. Se emplearon Chromium y WebKit con siete perfiles de viewport; estos resultados no equivalen a ejecución sobre dispositivos físicos. ${ref('e2e/casos-playwright.json')}, ${ref('RESUMEN_FINAL.json')}, ${ref(initialPanelResult.evidence)}, ${ref(httpAssertionResult.evidence)}.

De las instancias de la matriz final, ${mockCases.length} corresponden a recuperación de contraseña con Auth/REST simulados; comprueban la interfaz y no una integración real de correo o cambios persistidos de credenciales. En cambio, las ${mutations.length} instancias del flujo administrativo emplearon Auth, REST y PostgreSQL locales reales para crear un atleta descartable, registrar pago y asistencia y recuperar los datos tras una recarga. Un intento previo de ese flujo se interrumpió al terminar la sesión y no produjo un resultado final; no se le atribuyeron aprobaciones. El denominador de esos flujos se mantiene separado de las ocho guardas técnicas del arnés y no se duplica al relacionarlo con pagos y asistencia. ${ref('publicas-finales/resultados.json')}, ${ref('mutaciones-reanudadas/resultados.json')}, ${ref('e2e/interrupcion.json')}.

Una consulta agregada independiente, ejecutada en una transacción PostgreSQL de solo lectura, corroboró la existencia de 7 atletas, 7 pagos con importe 35 y 7 asistencias correspondientes a las altas sintéticas de la ventana temporal del flujo E2E. Esta comprobación complementa la recuperación desde la interfaz y no incrementa el número de casos Playwright. ${ref('integracion/persistencia-postgresql.json')}.

La compilación web nueva finalizó con código ${build.exitCode}. Durante la preparación se corrigió una discrepancia de red entre Edge Runtime y el gateway del entorno descartable, conservando sus registros; no se modificó producción. Esta etapa no repitió Jest del producto, la compilación Android ni el análisis npm del expediente anterior, que permanecen como evidencias diferenciadas. Persisten las limitaciones de proveedores externos, dispositivo físico y aplicación institucional de los cambios. No se infieren resultados de usabilidad, motivación, USE o UES-SF a partir de estas pruebas técnicas. ${ref(buildFile)}, ${ref('seguridad/edge-disponible.json')}, ${ref(previous+'/INFORME_VERIFICACION_TECNICA.md')}.
`);
console.log(JSON.stringify({state,total,groups:groups.map(g=>({label:g.label,cases:g.cases,exitCode:g.meta.exitCode})),mockCases:mockCases.length}));
