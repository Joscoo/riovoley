const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
assert.ok(!fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')));
const read=f=>JSON.parse(fs.readFileSync(path.join(h.evidence,f),'utf8'));
const text=f=>fs.readFileSync(path.join(h.evidence,f),'utf8');
const ref=f=>`[${f}](${f})`;
const src=f=>ref(path.relative(h.evidence,path.join(h.root,f)).replaceAll('\\','/'));
const context=read('CONTEXTO.json'),jest=read('unitarias/jest-resultados.json');
const unit=jest.testResults.flatMap(s=>s.assertionResults.map(t=>({file:path.relative(h.root,s.name).replaceAll('\\','/'),title:t.fullName,status:t.status,durationMs:t.duration})));
const count=rows=>({executed:rows.length,passed:rows.filter(r=>r.status==='passed').length,failed:rows.filter(r=>r.status==='failed').length,skipped:rows.filter(r=>['pending','skipped','todo','disabled'].includes(r.status)).length});
const contracts=unit.filter(t=>/contract.*\.test|\.contract\.test/i.test(t.file)||t.file==='src/shared/infrastructure/auth/deleteAuthUserById.test.js');
const memory=unit.filter(t=>t.file.endsWith('/gamification.audit.integration.test.js'));
const coverage=read('unitarias/cobertura/coverage-summary.json').total;
const tap=f=>{const s=text(f);return Object.fromEntries([['executed','tests'],['passed','pass'],['failed','fail'],['skipped','skipped']].map(([key,label])=>[key,Number(s.match(new RegExp('# '+label+' (\\d+)\\b'))?.[1])]));};
const nodeGroups=[['Primer ciclo: reproducción','seguridad/regresion-rojo'],['Primer ciclo: compatibilidad','seguridad/regresion-verde'],['Cargadores: reproducción','seguridad/cargadores-rojo'],['Conjunto final de dependencias','seguridad/cargadores-verde']].map(([name,label])=>({name,label,...tap(label+'.stdout.log'),meta:read(label+'.meta.json')}));
const guards=tap('unitarias/guardas-aislamiento.stdout.log');
const audits=Object.fromEntries(['raiz','functions','auxiliar'].map(tree=>[tree,Object.fromEntries(['before','after','after-loaders'].map(stage=>[stage,read(`seguridad/npm-${tree}-${stage}.json`).metadata.vulnerabilities]))]));
const flatten=s=>[...(s.specs||[]),...(s.suites||[]).flatMap(flatten)];
const labels=['publicas-finales','paneles-finales','mutaciones-finales','limites-finales'];
const browserCases=[];
const browsers=labels.map(label=>{
 const raw=read(label+'/resultados.json');
 for(const s of raw.suites.flatMap(flatten))for(const t of s.tests){
  const file=path.isAbsolute(s.file)?path.relative(h.root,s.file).replaceAll('\\','/'):s.file.startsWith('tests/')?s.file:'tests/e2e/'+s.file;
  browserCases.push({group:label,file,title:s.title,project:t.projectName,status:t.results.at(-1)?.status,attempts:t.results.length});
 }
 return {label,stats:raw.stats,counts:count(browserCases.filter(c=>c.group===label)),meta:read(label+'/ejecucion.meta.json')};
});
const webMeta=fs.readdirSync(h.evidence).find(f=>/^compilacion-web-build-\d+\.meta\.json$/.test(f));
const web={file:webMeta,...read(webMeta)},webAndroid={file:'compilacion-web/build-auditoria.meta.json',...read('compilacion-web/build-auditoria.meta.json')};
const android={file:'android/gradle-assemble.meta.json',...read('android/gradle-assemble.meta.json')};
const apk=read('android/apk-verificado.json'),junit=read('android/junit-resumen.json'),dev=read('integracion/dev-server-controles.json');
const summary={generatedAt:new Date().toISOString(),commit:context.commit,jest:{...count(unit),suites:jest.numTotalTestSuites,seconds:read('unitarias/jest-cobertura.meta.json').durationSeconds,contracts:contracts.length,memoryIntegration:memory.length,coverage},nodeGroups,guards,audits,browsers,e2e:count(browserCases),recoveryMocks:browserCases.filter(c=>c.file.endsWith('/auth.password-recovery.spec.js')).length,web,webAndroid,android,apk,junit,dev,persistence:read('integracion/persistencia-postgresql.json'),productionChanged:false,applicationChanged:false,remediationComplete:audits.raiz['after-loaders'].total===0};
h.write('RESUMEN_FINAL.json',summary);h.write('unitarias/casos-jest.json',unit);h.write('e2e/casos-playwright.json',browserCases);
const modules=Object.entries(Object.groupBy(unit,t=>t.file.includes('src/features/')?t.file.split('/')[2]:t.file.startsWith('src/shared/')?'shared':'otros')).map(([module,cases])=>({module,...count(cases),files:[...new Set(cases.map(c=>c.file))]}));
h.write('unitarias/modulos.json',modules);
const predicates=[t=>t.file.endsWith('/createGamificationUseCases.test.js'),t=>t.file.endsWith('/createGamificationService.test.js'),t=>t.file.includes('/gamification/')&&/identit|identidad|avatar|nickname|title|título|portrait/i.test(t.title),t=>t.file.includes('/gamification/')&&/wallet|coin|moneda|currency|saldo/i.test(t.title),t=>t.file.includes('/gamification/')&&/buy|purchase|cosmetic|equip|shop|tienda|compra/i.test(t.title),t=>t.file.includes('/attendance/'),t=>t.file.includes('/payments/'),()=>false];
const categories=['Caso de uso de gamificación','Servicio público de gamificación','Identidad del atleta','Wallet y monedas','Tienda cosmética','Asistencia','Pagos','Compilación del proyecto'];
const trace=categories.map((category,i)=>({category,jestCases:unit.filter(predicates[i]),e2eCases:i===5||i===6?browserCases.filter(c=>c.group==='mutaciones-finales'):[],evidence:i===7?[web.file,webAndroid.file,android.file]:['unitarias/jest-resultados.json',...(i===5||i===6?['mutaciones-finales/resultados.json','integracion/persistencia-postgresql.json']:[])]}));
h.write('trazabilidad-detallada.json',trace);
const row=(code,name,counts,status,evidence)=>`| ${code} | ${name} | ${counts?.executed??'—'} | ${counts?.passed??'—'} | ${counts?.failed??'—'} | ${counts?.skipped??'—'} | ${status} | ${ref(evidence)} |`;
const table=[row('J01','Jest: unitarias, componentes y contratos',summary.jest,summary.jest.failed?'FALLIDO':'APROBADO','unitarias/jest-resultados.json'),row('J02','Contratos incluidos en J01',count(contracts),'APROBADO','unitarias/casos-jest.json'),row('J03','Integración lógica en memoria incluida en J01',count(memory),'APROBADO','unitarias/casos-jest.json'),...nodeGroups.map((g,i)=>row('D0'+(i+1),g.name,g,g.meta.exitCode===0?'APROBADO':'FALLIDO (reproducción conservada)',g.label+'.stdout.log')),row('G01','Guardas del aislamiento Node',guards,'APROBADO','unitarias/guardas-aislamiento.stdout.log'),row('I01','CRA real: HTTP, bundle y HMR',{...dev,skipped:0},dev.failed?'FALLIDO':'APROBADO','integracion/dev-server-controles.json'),row('I02','Consulta PostgreSQL READ ONLY',null,'APROBADO (control agregado)','integracion/persistencia-postgresql.json'),...browsers.map((g,i)=>row('E0'+(i+1),'Playwright '+g.label,g.counts,g.meta.exitCode===0?'APROBADO':'FALLIDO',g.label+'/resultados.json')),row('W01','Build web con backend local',null,web.exitCode===0?'APROBADO':'FALLIDO',web.file),row('W02','Build web offline para empaquetado Android',null,webAndroid.exitCode===0?'APROBADO':'FALLIDO',webAndroid.file),row('A01','Capacitor sync + Gradle Android debug',null,android.exitCode===0?'APROBADO':'FALLIDO',android.file),row('A02','JUnit de plantilla en JVM',junit,junit.failed?'FALLIDO':'APROBADO','android/junit-resumen.json'),row('S01','npm audit raíz: criterio cero avisos',null,audits.raiz['after-loaders'].total?'FALLIDO: persisten avisos':'APROBADO','seguridad/npm-raiz-after-loaders.json'),row('S02','npm audit functions',null,audits.functions['after-loaders'].total?'FALLIDO':'APROBADO','seguridad/npm-functions-after-loaders.json'),row('S03','npm audit árbol auxiliar',null,audits.auxiliar['after-loaders'].total?'FALLIDO':'APROBADO','seguridad/npm-auxiliar-after-loaders.json')].join('\n');
h.write('INFORME_VERIFICACION_TECNICA.md',`# Verificación complementaria: corrección de dependencias de RIOVOLEY

## 1. Identificación y entorno

Repositorio Joscoo/riovoley; commit base **${context.commit}**, rama fix/seguridad-local-20261029. Inicio ${context.createdAt}; cierre documental ${summary.generatedAt}, UTC. Árbol modificado según inventarios de fuentes, estado inicial y diff; no se cambió código de src/ ni el framework CRA. ${ref('CONTEXTO.json')}, ${ref('fuentes-iniciales.json')}, ${ref('estado-inicial.txt')}.

Sistema ${context.os} ${context.release} ${context.architecture}, Node ${context.node}; npm ${text('seguridad/npm-version.stdout.log').trim()}, JDK 21.0.12.1, Gradle 8.14.3, SDK/build-tools 35.0.0. Las versiones nativas se registraron desde las herramientas privadas. El backend de navegador es Supabase descartable, API 127.0.0.1:55321 y PG 127.0.0.1:55322; no se utilizó .env.e2e institucional. Auth y auth.users fueron contrastados antes de las pruebas. ${ref('seguridad/backend-local.json')}, ${ref('herramientas.json')}.

## 2. Alcance y metodología

Se diagnosticaron avisos npm, se probaron actualizaciones transitivas desde sus consumidores y se repitieron Jest, compilación, navegación y flujos locales. No se modificaron esquema, políticas, permisos, secretos o registros institucionales; no se publicaron despliegues ni APK. La revisión no constituye una prueba de penetración ni una evaluación con usuarios.

Se aplicaron seis overrides: serialize-javascript 7.1.4, Once 2.0.1 limitado a http-proxy-agent, UUID 11.1.1 limitado a SockJS, @svgr/webpack 6.5.1, resolve-url-loader 5.0.0 y middleware 7.4.6 limitado a webpack-dev-server 4. Son actualizaciones mayores transitivas: su compatibilidad se comprobó, no se presupuso por SemVer. Capacitor instalado ya requiere Node 22+; se verificó Node 24.18.0. No se ejecutó audit fix --force ni se modificaron node_modules manualmente. ${src('package.json')}, ${ref('DECISIONES.md')}, ${ref('DECISIONES_CARGADORES.md')}, ${ref('seguridad/cambios-lockfile.json')}, ${ref('seguridad/cambios-lockfile-cargadores.json')}, ${ref('seguridad/arbol-final.stdout.log')}.

Comandos principales, ejecutados desde la raíz:

~~~powershell
node scripts/audit/closure/initialize-dependencies.cjs
node scripts/audit/closure/audit-dependencies.cjs before
# Tras cada edición revisada de overrides:
npm.cmd install --ignore-scripts --no-audit --no-fund
node --test --test-reporter=tap tests/integration/toolchain.dependencies.test.cjs tests/integration/toolchain.security-followup.test.cjs tests/integration/toolchain.loaders-security.test.cjs
node scripts/audit/closure/audit-dependencies.cjs after-loaders
node scripts/e2e/local/build.cjs
node scripts/audit/closure/check-dependencies-dev-server.cjs
node scripts/e2e/local/functions.cjs
# Mientras el handler local está disponible, en otra terminal:
node scripts/audit/closure/browser-regression.cjs
node scripts/audit/closure/verify-e2e-final-persistence.cjs mutaciones-finales
node scripts/audit/closure/bind-dependencies-android.cjs
node scripts/audit/android/stage.cjs final
node scripts/audit/android/build.cjs assemble --rerun-tasks
python scripts/audit/closure/check-dependencies-apk.py
~~~

Jest se lanzó con react-scripts test --watchAll=false --runInBand --coverage, JSON y reportes json-summary/lcov/html/text; el comando exacto, entorno local, duración y salida constan en ${ref('unitarias/jest-cobertura.meta.json')}. Los scripts de cierre concilian este expediente concreto; no deben reutilizarse para forzar resultados históricos de otro. Una auditoría nueva requiere otra carpeta y etiquetas disponibles.

## 3. Resultados por herramienta

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
${table}

Los subconjuntos J02/J03 ya pertenecen a los ${summary.jest.executed} de J01. El conjunto final Node contiene **${nodeGroups.at(-1).executed} casos únicos**; las ejecuciones intermedias se conservan, no se suman como casos nuevos. Tampoco se suman las ${guards.executed} guardas, tres controles HTTP/HMR, JUnit o Playwright al denominador Jest. La consulta I02 tiene conteos de filas, no casos de prueba.

## 4. Jest, contratos, módulos y cobertura

Se aprobaron **${summary.jest.passed}/${summary.jest.executed} casos en ${summary.jest.suites} suites**, ${summary.jest.failed} fallidos y ${summary.jest.skipped} omitidos; proceso ${summary.jest.seconds.toFixed(3)}s. Se incluyen ${contracts.length} contratos seleccionados por archivos explícitos y ${memory.length} casos de integración lógica en memoria. Servicios/repositorios simulados, gateways interceptados o memoria no acreditan PostgreSQL. Inventarios de casos y módulos: ${ref('unitarias/casos-jest.json')}, ${ref('unitarias/modulos.json')}.

Cobertura: líneas **${coverage.lines.pct}%** (${coverage.lines.covered}/${coverage.lines.total}), sentencias ${coverage.statements.pct}%, ramas ${coverage.branches.pct}% y funciones ${coverage.functions.pct}%. Solo corresponde al código instrumentado por Jest; los contratos Node de herramientas no aumentan la cobertura del negocio. ${ref('unitarias/cobertura/coverage-summary.json')}, ${ref('unitarias/cobertura/lcov-report/index.html')}.

## 5. Dependencias y reproducción de fallos

El primer ciclo de nueve casos reprodujo cuatro fallos: tres consumidores emitían un cierre de etiqueta sin escapar y Once 1 ignoraba AbortSignal. El resultado no demuestra que la app ejerciera esa opción: http-proxy-agent espera connect y descarta el valor devuelto. Se conservan las salidas roja y verde. El segundo ciclo reprodujo cuatro fallos entre siete casos: buffer UUID insuficiente, enlace SVG con namespace, inclusión de sourcemap absoluto y escape de outputPath con publicPath sin barra. Se usaron únicamente marcadores y archivos sintéticos. Las expectativas no se relajaron; los fixtures se trasladaron al runtime privado para evitar nombres de usuario en rutas. ${ref('seguridad/regresion-rojo.stdout.log')}, ${ref('seguridad/cargadores-rojo.stdout.log')}.

El conjunto final **${nodeGroups.at(-1).passed}/${nodeGroups.at(-1).executed}** comprobó también HTTP proxy y propagación de errores sobre loopback, JSONPath/BFJ, QS de Express, tipos serializados, conexiones SockJS, compilación SVG con opciones CRA, CSS y sus mapas. Son contratos/integraciones de herramientas reales con fixtures, sin backend deportivo. No se presentan como pruebas de gamificación real. ${src('tests/integration/toolchain.dependencies.test.cjs')}, ${src('tests/integration/toolchain.security-followup.test.cjs')}, ${src('tests/integration/toolchain.loaders-security.test.cjs')}.

CRA ya deshabilita svgo en su loader. El test opt-in del optimizador comprueba un bypass concreto y no convierte RIOVOLEY en un sanitizador de SVG. La guía de SVGR conserva webpack 5/file-loader en v6; se verificaron ReactComponent, título, ref, viewBox y URL. Los tres controles adicionales iniciaron CRA sobre 127.0.0.1:6101, recuperaron HTML y bundle y recibieron un mensaje HMR real; no ejecutaron JavaScript de la app. El proceso hijo se detuvo intencionalmente (salida 1 del servidor), mientras el driver terminó con salida 0. ${ref('integracion/dev-server-controles.json')}, ${ref('integracion/dev-server-proceso.json')}, ${ref('integracion/dev-server.stdout.log')}.

## 6. Seguridad y avisos pendientes

| Árbol | Antes | Tras primer ciclo | Final | Bajas / moderadas / altas / críticas final |
|---|---:|---:|---:|---|
${Object.entries(audits).map(([name,a])=>`| ${name} | ${a.before.total} | ${a.after.total} | ${a['after-loaders'].total} | ${a['after-loaders'].low} / ${a['after-loaders'].moderate} / ${a['after-loaders'].high} / ${a['after-loaders'].critical} |`).join('\n')}

La raíz bajó de **31 a 15 avisos**, con cero altos/críticos en esta consulta; persisten 13 bajos y dos moderados. Son paquetes marcados, incluidos avisos propagados por dependencias; no equivalen a 15 vulnerabilidades independientes explotadas. El objetivo de cero alertas **no está cumplido**. npm audit mantiene salida 1 por los avisos; functions y auxiliar devolvieron0. ${ref('seguridad/npm-raiz-before.json')}, ${ref('seguridad/npm-raiz-after.json')}, ${ref('seguridad/npm-raiz-after-loaders.json')}, ${ref('seguridad/npm-functions-after-loaders.json')}, ${ref('seguridad/npm-auxiliar-after-loaders.json')}.

Las causas restantes son deepmerge 4.3.1 sin parche publicado y webpack-dev-server 4. La actualización directa del servidor rompe opciones que CRA aún utiliza (https, onBeforeSetupMiddleware y onAfterSetupMiddleware); requiere trabajo de mantenimiento específico. No se rebajó deepmerge ni se ocultaron avisos. La ficha del middleware conserva una descripción antigua sobre backports que contradice su lista de versiones corregidas; por eso se contrastó el registro y se exigió el caso funcional contra7.4.6. Fuentes primarias y fechas: ${ref('seguridad/fuentes-consultadas.json')}, [deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), [migración del servidor](https://github.com/webpack/webpack-dev-server/blob/main/migration-v5.md).

No aparecieron coincidencias de los quince paquetes en las fuentes declaradas por los 40 sourcemaps JS del bundle auditado. Este contraste no elimina riesgos de las herramientas ni certifica ausencia de todo código vulnerable. ${ref('seguridad/alcance-bundle.json')}. No se reevaluaron aquí las políticas RLS institucionales; las comprobaciones locales y cambios SQL autorizados de etapas anteriores permanecen diferenciados.

## 7. Playwright e integración local

Se ejecutaron **${summary.e2e.executed} instancias**: ${summary.e2e.passed} aprobadas, ${summary.e2e.failed} fallidas y ${summary.e2e.skipped} omitidas, con dos workers y cero reintentos automáticos. Chromium y WebKit:390/430/480/768/1024/1440/1920px; los cuatro límites de pagos usan481/600/767/768px. Son navegadores, no Android nativo. Los JSON y HTML de cada grupo se conservan; inventario completo en ${ref('e2e/casos-playwright.json')}.

**${summary.recoveryMocks} instancias de recuperación simulan Auth/REST**. Los siete flujos administrativos usan Auth/REST/PG reales locales, crean atletas descartables y verifican pago y asistencia tras recargar. Una transacción READ ONLY corroboró siete atletas, siete pagos de 35 y siete asistencias dentro de su ventana temporal. Son los mismos flujos para pagos/asistencia y no se duplican al trazar categorías. No se contactaron Resend/FCM. ${ref('mutaciones-finales/resultados.json')}, ${ref('integracion/persistencia-postgresql.json')}.

## 8. Compilación web y Android

El build local web terminó con salida${web.exitCode} en ${web.durationSeconds.toFixed(3)}s y el build offline Android con salida${webAndroid.exitCode} en ${webAndroid.durationSeconds.toFixed(3)}s. Se conservó DEP0176 de fs.F_OK. Los tamaños y archivos emitidos constan en sus stdout; la salida completa permanece en runtime privado. Compilar no prueba todas las funcionalidades. ${ref(web.file)}, ${ref(web.file.replace('.meta.json','.stdout.log'))}, ${ref(webAndroid.file)}.

Capacitor sincronizó siete plugins y Gradle recompiló debug con --rerun-tasks, salida${android.exitCode}, duración${android.durationSeconds.toFixed(3)}s. JDK 21.0.12.1, Gradle 8.14.3 y build-tools 35.0.0. Se conservaron avisos sobre versión XML del SDK, operaciones Java sin comprobación y APIs obsoletas, sin suprimirlos. ${ref('android/capacitor-sync.stdout.log')}, ${ref(android.file)}, ${ref('android/gradle-assemble.stderr.log')}.

APK privado: ${apk.bytes}bytes, SHA-256 **${apk.sha256}**. Todos sus ${apk.matchingWebAssets} archivos web coinciden con el build nuevo; autoactualización externa desactivada y claves placeholder sin validez. El escaneo del ZIP no encontró secretos conocidos. Firma debug y datos de empaquetado se verificaron. No se distribuye el paquete. ${ref('android/apk-verificado.json')}, ${ref('android/privacidad-apk.json')}, ${ref('android/apk-firma.stdout.log')}, ${ref('android/apk-badging.stdout.log')}.

JUnit ejecutó ${junit.executed} prueba de plantilla en JVM (${junit.passed} aprobada); no es una prueba del negocio. No se repitieron instrumentación ni las 13 verificaciones WebView autenticadas del antecedente, ni se probó dispositivo físico en esta etapa. ${ref('android/junit-resumen.json')}, ${ref('../20261029-221208-android-autenticado-317e5e3/INFORME_VERIFICACION_TECNICA.md')}.

## 9. Limitaciones y pendientes

El servidor Edge local se apagó intencionalmente tras completar las pruebas. Docker stop devolvió0 y functions serve terminó con salida 1 y señal de cierre 15 en stderr; no es un caso E2E fallido. ${ref('seguridad/cierre-edge.json')}, ${ref('seguridad/edge-cierre.meta.json')}, ${ref('edge-functions/serve.meta.json')}.

Continúan15 avisos npm, mantenimiento del servidor CRA, actualización de deepmerge cuando exista una corrección verificable, aplicación institucional coordinada de SQL/RLS/Edge/clientes, proveedores reales, dispositivo físico y ampliación de categorías de ranking y recuperación de borrados parciales. Las pruebas técnicas no acreditan usabilidad, motivación, USE ni UES-SF. Se mantienen los fallos de reproducción y los nueve expedientes anteriores sin reescribir.

## 10. Integridad y entrega

${ref('RESUMEN_FINAL.json')}, ${ref('MATRIZ_VERIFICACIONES_TESIS.md')}, ${ref('RESULTADOS_PARA_TESIS_4_5.md')}. Antes del sello se contrastan cifras originales, hashes de fuentes, referencias, privacidad de texto/HTML y APK privado. Los nombres de usuario en rutas temporales se anonimizan sin cambiar cantidades o estados. El manifiesto SHA-256 excluye únicamente su propia huella; los APK permanecen fuera de Git.
`);
h.write('MATRIZ_VERIFICACIONES_TESIS.md',`# Matriz para la Tabla 4-6 — regresión tras dependencias

Commit base ${context.commit}; ${context.createdAt}. Los subconjuntos de Jest se solapan y forman parte de sus ${unit.length} casos, sin sumar filas. La selección por título de identidad/wallet/tienda es explícita y conservadora, no cobertura funcional exhaustiva. ${ref('trazabilidad-detallada.json')} conserva archivo, caso y estado.

| Categoría | Archivos relacionados | Casos Jest ejecutados/aprobados/fallidos | Resultado y tipo | Mocks o servicios reales | Limitaciones y evidencia |
|---|---|---:|---|---|---|
${trace.map((t,i)=>`| ${i+1}. ${t.category} | ${i===7?'package.json; android/; scripts/audit/android/':[...new Set(t.jestCases.map(c=>c.file))].map(f=>'\`'+f+'\`').join('<br>')} | ${i===7?'No aplica':`${t.jestCases.length}/${count(t.jestCases).passed}/${count(t.jestCases).failed}`} | ${i===7?'Compilaciones web/nativa reales':i>=5?'Jest + siete flujos E2E compartidos':'Jest de dominio/servicio/componentes'} | ${i===7?'Herramientas reales; APK offline privado':i>=5?'Mocks Jest; Auth/REST/PG reales solo en E2E':'Mocks, repositorios en memoria o lógica pura; no PG real'} | ${i<5?'Sin acreditación nueva de persistencia de estas reglas':i<7?'Los siete E2E no se suman dos veces':'Compilación no acredita todos los procesos'}; ${t.evidence.map(ref).join(', ')} |`).join('\n')}

## Complementos

- Playwright: ${summary.e2e.passed}/${summary.e2e.executed}; ${summary.recoveryMocks} de recuperación usan interceptaciones. ${ref('e2e/casos-playwright.json')}.
- Dependencias: ${nodeGroups.at(-1).passed}/${nodeGroups.at(-1).executed}, con paquetes reales y fixtures; ocho fallos de reproducción conservados en dos ciclos, sin relación con participantes. ${ref('seguridad/cargadores-verde.stdout.log')}.
- Android: recompilación debug, firma, ${apk.matchingWebAssets} assets coincidentes y ${junit.executed} JUnit de plantilla; sin nueva instrumentación ni WebView. ${ref('android/apk-verificado.json')}, ${ref('android/junit-resumen.json')}.
- Seguridad: npm raíz31→15 (13 bajas/2 moderadas/0 altas/0críticas), functions 0, auxiliar 0; persisten avisos y no se acredita RLS institucional. ${ref('seguridad/npm-raiz-after-loaders.json')}.
- Integración técnica adicional: tres controles HTTP/HMR reales y una consulta PG READ ONLY; se conservan separados de los casos de negocio. ${ref('integracion/dev-server-controles.json')}, ${ref('integracion/persistencia-postgresql.json')}.
`);
h.write('RESULTADOS_PARA_TESIS_4_5.md',`# Propuesta para revisión académica — apartado 4.5

Como continuación de la verificación de RIOVOLEY, se revisaron las dependencias del commit base ${context.commit.slice(0,7)} y se aplicaron seis actualizaciones transitivas, manteniendo React, Create React App y Capacitor. El análisis npm de la raíz pasó de 31 a 15 paquetes señalados: 13 de severidad baja y 2 moderada, sin avisos altos o críticos en la consulta final. Los árboles functions y auxiliar registraron cero avisos. Esta reducción no supone eliminación de todos los riesgos: permanecen incidencias relacionadas con deepmerge y el servidor de desarrollo. ${ref('seguridad/npm-raiz-before.json')}, ${ref('seguridad/npm-raiz-after-loaders.json')}, ${ref('seguridad/npm-functions-after-loaders.json')}, ${ref('seguridad/npm-auxiliar-after-loaders.json')}.

La compatibilidad se comprobó mediante ${nodeGroups.at(-1).executed} casos Node con dependencias reales y fixtures, todos aprobados. Los dos ciclos previos conservaron ocho fallos de reproducción; sus resultados no se sustituyeron por los del conjunto final. De forma independiente, Jest ejecutó ${summary.jest.executed} casos en ${summary.jest.suites} suites, con ${summary.jest.passed} aprobados, ${summary.jest.failed} fallidos y ${summary.jest.skipped} omitidos. Su cobertura de líneas fue ${coverage.lines.pct}%, limitada al código instrumentado. Los ${contracts.length} contratos y ${memory.length} casos de integración lógica en memoria están incluidos en ese total y no demuestran persistencia PostgreSQL. ${ref('seguridad/cargadores-verde.stdout.log')}, ${ref('unitarias/jest-resultados.json')}, ${ref('unitarias/cobertura/coverage-summary.json')}.

Sobre el bundle actualizado, Playwright registró ${summary.e2e.executed} instancias: ${summary.e2e.passed} aprobadas, ${summary.e2e.failed} fallidas y ${summary.e2e.skipped} omitidas. Los casos abarcaron navegación pública, roles, consultas, presentación adaptable y siete flujos administrativos con datos descartables. De ellos, ${summary.recoveryMocks} instancias de recuperación de contraseña interceptaron Auth/REST; los flujos de alta, pago y asistencia utilizaron servicios locales reales. Una consulta PostgreSQL de solo lectura corroboró siete atletas, siete pagos y siete asistencias de esos flujos, sin incrementar el denominador de Playwright. ${ref('e2e/casos-playwright.json')}, ${ref('integracion/persistencia-postgresql.json')}.

La compilación web, la sincronización de Capacitor y la recompilación Android debug concluyeron satisfactoriamente. Se verificaron la firma del APK privado y la coincidencia de sus ${apk.matchingWebAssets} archivos web con el build recién generado. La prueba JUnit de plantilla se registra por separado y no representa cobertura del negocio; en esta etapa no se repitieron instrumentación ni flujos de WebView Android. Permanecen las limitaciones de proveedores externos, dispositivo físico, avisos npm residuales y aplicación institucional de cambios. Estos resultados no permiten inferir usabilidad, motivación ni resultados USE o UES-SF. ${ref(web.file)}, ${ref(android.file)}, ${ref('android/apk-verificado.json')}, ${ref('android/junit-resumen.json')}.
`);
console.log(JSON.stringify({jest:summary.jest.executed,node:nodeGroups.at(-1).executed,e2e:summary.e2e,auditFinal:audits.raiz['after-loaders'],coverage:coverage.lines.pct}));
