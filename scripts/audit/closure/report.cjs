const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
const c=require('../android/context.cjs');
const read=file=>JSON.parse(fs.readFileSync(path.join(h.evidence,file),'utf8'));
const native=file=>JSON.parse(fs.readFileSync(path.join(c.base,file),'utf8'));
const rel=file=>path.relative(h.evidence,file).replaceAll('\\','/');
const ref=file=>`[${file}](${file})`;
const src=file=>ref(rel(path.join(h.root,file)));
function specs(s){return [...s.specs||[],...(s.suites||[]).flatMap(specs)];}
const groups=['publicas-finales','paneles-finales','mutaciones-finales','limites-finales'];
const browsers=groups.map(label=>({label,...read(label+'/resultados.json').stats,exitCode:read(label+'/ejecucion.meta.json').exitCode}));
const cases=groups.flatMap(label=>read(label+'/resultados.json').suites.flatMap(specs).flatMap(s=>s.tests.map(t=>({group:label,file:s.file,title:s.title,project:t.projectName,status:t.status}))));
assert.equal(cases.length,249);assert.ok(cases.every(t=>t.status==='expected'));assert.ok(browsers.every(r=>r.exitCode===0));
const jest=read('jest-coverage.json');
assert.equal(jest.numTotalTests,404);assert.equal(jest.numPassedTests,404);assert.equal(jest.numFailedTests,0);assert.equal(jest.numTotalTestSuites,85);
const unit=jest.testResults.flatMap(s=>s.assertionResults.map(t=>({file:path.relative(h.root,s.name).replaceAll('\\','/'),title:t.fullName,status:t.status})));
const contracts=unit.filter(t=>/contract.*\.test|\.contract\.test/i.test(t.file));
const logical=unit.filter(t=>t.file.endsWith('gamification.audit.integration.test.js'));
const coverage=require('istanbul-lib-coverage').createCoverageMap(read('cobertura/coverage-final.json')).getCoverageSummary().toJSON();
const tap=fs.readFileSync(path.join(h.evidence,'integracion/integracion-17-final.stdout.log'),'utf8');
assert.match(tap,/# tests 17/);assert.match(tap,/# pass 17/);assert.match(tap,/# fail 0/);
assert.equal(read('integracion/integracion-17-final.meta.json').exitCode,0);
const artifact=native('android/artefacto-final.json');
const instrument=read('android/instrumentacion-final.json'),webview=read('android/webview-final.json');
assert.equal(instrument.passed,1);assert.equal(webview.access.passed,3);assert.equal(webview.artifactSha256,artifact.sha256);
const audits=['raiz','functions','auxiliar'].map(name=>({name,...read('seguridad/comparacion-'+name+'.json')}));
const builds=fs.readdirSync(h.evidence).filter(f=>/^compilacion-web-build-.*\.meta\.json$/.test(f)).sort().map(file=>({file,...read(file)}));
assert.ok(builds.every(r=>r.exitCode===0));
const modules=[...new Set(unit.map(t=>t.file.split('/')[2]||'otros'))].sort().map(name=>({module:name,cases:unit.filter(t=>(t.file.split('/')[2]||'otros')===name).length,files:[...new Set(unit.filter(t=>(t.file.split('/')[2]||'otros')===name).map(t=>t.file))]}));
const summary={generatedAt:new Date().toISOString(),commit:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTreeModified:true,jest:{suites:85,executed:404,passed:404,failed:0,skipped:0,seconds:read('unitarias/jest-coverage.meta.json').durationSeconds},contracts:{executed:contracts.length,subsetOfJest:true},logicalIntegration:{executed:logical.length,subsetOfJest:true,realPersistence:false},realIntegration:{executed:17,passed:17,failed:0,skipped:0,seconds:read('integracion/integracion-17-final.meta.json').durationSeconds},browsers,coverage,builds,artifact,instrument,webview,audits};
h.write('RESUMEN_CIERRE.json',summary);h.write('casos-e2e-detallados.json',cases);h.write('casos-jest-detallados.json',unit);h.write('unitarias/modulos.json',modules);h.write('cobertura-resumen.json',coverage);
h.write('android/estado-runtime-final.json',{generatedAt:new Date().toISOString(),installedOn:'emulator-5580',artifactSha256:artifact.sha256,instrumentation:instrument,webview,scope:'El campo installed:false del artefacto describe su exportación anterior a la instalación; esta evidencia registra la ejecución posterior.'});
const nativeRef=file=>ref(rel(path.join(c.base,file)));
const initial='../../verificacion-tecnica/20261027-212222-c71f55e';
const prior='../20261028-101418-correcciones-c71f55e';
const table=[
 ['UT-01','Jest/Testing Library',404,404,0,0,'APROBADO','jest-coverage.json'],
 ['CON-01','Contratos, subconjunto UT-01',contracts.length,contracts.length,0,0,'APROBADO','casos-jest-detallados.json'],
 ['INT-M','Integración en memoria, subconjunto UT-01',logical.length,logical.length,0,0,'APROBADO','casos-jest-detallados.json'],
 ['INT-R','Supabase/Auth/REST/RPC/PostgreSQL local',17,17,0,0,'APROBADO','integracion/integracion-17-final.stdout.log'],
 ['AUTH-E','Contratos Edge Auth, runner Node separado',10,10,0,0,'APROBADO','unitarias/auth-edge.stdout.log'],
 ['HAR-01','Guardia de red y redirecciones',1,1,0,0,'APROBADO','unitarias/guard-green.stdout.log'],
 ['HAR-02','Guardas del arnés local',12,12,0,0,'APROBADO','unitarias/arnes-final.stdout.log'],
 ['HAR-03','Detector de secretos en archivos APK',3,3,0,0,'APROBADO','unitarias/privacidad-apk.stderr.log'],
 ...browsers.map((r,i)=>['E2E-'+(i+1),r.label,r.expected+r.unexpected,r.expected,r.unexpected,r.skipped,'APROBADO',r.label+'/resultados.json']),
 ['WEB-01','Compilación web CRA','—','—','—','—','APROBADO',builds.at(-1).file],
 ['AND-01','Compilación APK nativo','—','—','—','—','APROBADO',rel(path.join(c.base,'android/gradle-assemble.meta.json'))],
 ['AND-02','JUnit nativo en JVM: plantilla aritmética',1,1,0,0,'APROBADO',rel(path.join(c.base,'android/unitarias-final/resumen.json'))],
 ['AND-03','Instrumentación en emulador API36',1,1,0,0,'APROBADO','android/instrumentacion-final.json'],
 ['AND-04','Acceso anónimo dentro del WebView Android',3,3,0,0,'APROBADO','android/webview-final.json'],
 ['SEC-01','Catálogo RLS/RPC local, solo lectura','—','—','—','—','EJECUTADO: HALLAZGOS','seguridad/catalogo-local-lectura.stdout.log'],
 ...audits.map(r=>['NPM-'+r.name,'npm audit '+r.name+' (avisos, no casos)','—','—','—','—',r.after.total?'EJECUTADO: AVISOS':'APROBADO','seguridad/comparacion-'+r.name+'.json']),
 ['SEC-02','Aplicación de cambios RLS/RPC','—','—','—','—','BLOQUEADO: AUTORIZACIÓN',rel(path.join(h.root,'database/security/REVISION_Y_AUTORIZACION_PENDIENTE.md'))],
 ['EXT-01','Entrega Resend/FCM real','—','—','—','—','NO EJECUTADO',initial+'/INFORME_VERIFICACION_TECNICA.md'],
].map(r=>`| ${r.slice(0,-1).join(' | ')} | ${ref(r.at(-1))} |`).join('\n');
const report=`# Informe de verificación técnica: cierre de incidencias RIOVOLEY

## Identificación y entorno

Repositorio oficial: https://github.com/Joscoo/riovoley. Commit base **${summary.commit}**, con modificaciones locales, sin commit ni publicación de esta etapa. Fecha de generación UTC: ${summary.generatedAt}; zona del trabajo: America/Guayaquil (UTC−5). Los tiempos exactos de cada ejecución constan en los archivos *.meta.json. Se conserva ${ref('estado-inicial.txt')}; ${ref('fuentes-iniciales.json')} permite comparar las fuentes de partida. Un hash de HEAD no identifica por sí solo el árbol modificado: el manifiesto y las huellas finales acompañan los resultados.

Windows, PowerShell, Node.js 24.18.0, npm 11.16.0; React/CRA, Jest/Testing Library, Playwright Chromium/WebKit. Backend **local descartable** Supabase Docker: API 127.0.0.1:55321, PostgreSQL en contenedor propio, SMTP/Mailpit local 55324, frontend 127.0.0.1:6100. Las cuentas son sintéticas. No se utiliza .env.e2e institucional. Claves locales y contraseñas permanecen únicamente en .e2e-local, ignorado por Git. Las variables de configuración REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY, REACT_APP_PII_ENCRYPTION_KEY y E2E_* se resuelven con el arnés sin publicar valores. El APK usa backend de loopback sin clave válida, OTA deshabilitado y no incluye google-services institucional ni keystore de publicación. Ver ${nativeRef('android/configuracion-final.json')}.

## Alcance y método

Esta etapa corrige fallos observados y amplía integración real, entrega local de recuperación y ejecución Android. La inspección inicial de scripts, estructura, pruebas, variables y documentación de restauración sigue disponible en ${ref(initial+'/INFORME_VERIFICACION_TECNICA.md')}. Sus resultados son antecedentes; las cifras finales siguientes proceden de ejecuciones de esta etapa. Se conservan los intentos fallidos y las ejecuciones RED/GREEN. No se borraron evidencias ni cambios locales. No se hicieron escrituras institucionales, despliegues, push, cambios de claves, esquema, RLS ni permisos.

Preparación reproducible del entorno: ${src('scripts/e2e/local/README.md')}, ${src('playwright.local.config.cjs')} y ${src('docs/superpowers/plans/2026-10-28-cierre-pendientes.md')}. Tras preparar los fixtures locales, los comandos principales son:

\`\`\`powershell
node scripts/audit/closure/run-jest.cjs coverage
node scripts/audit/closure/run-integration.cjs integracion-17-final
node scripts/audit/closure/check-guard.cjs green
node scripts/audit/closure/check-auxiliary.cjs
node scripts/audit/closure/security-readonly.cjs
node scripts/e2e/local/run.cjs public --label=publicas-finales --workers=2
node scripts/e2e/local/run.cjs pending --label=paneles-finales --workers=2
node scripts/e2e/local/run.cjs mutations --label=mutaciones-finales --workers=2
node scripts/e2e/local/run.cjs boundaries --label=limites-finales --workers=2
node scripts/audit/android/stage.cjs final
node scripts/audit/android/build.cjs assemble
node scripts/audit/android/inspect.cjs final
node scripts/audit/android/build.cjs lint
node scripts/audit/closure/launch-emulator.cjs
node scripts/audit/closure/instrumentation.cjs final
node scripts/audit/closure/native-webview.cjs --label=webview-final --access
\`\`\`

Los nombres de salida se deben asignar a un expediente nuevo al reproducir; no sobrescribir esta evidencia sellada. La preparación Android requiere el SDK/JDK descrito abajo y acepta las licencias mediante las herramientas oficiales. El arnés compila web con react-scripts build y sincroniza Capacitor en una copia privada. Los comandos completos, directorios, tiempos y códigos de salida están en *.meta.json; npm audit devuelve código distinto de cero cuando conserva avisos, sin implicar fallo de compilación.

## Resultados por herramienta

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
${table}

Los subconjuntos CON-01 e INT-M ya están dentro de 404; no se suman otra vez. Los 17 casos reales, los diez contratos Edge, el caso del arnés y los denominadores Android son runners independientes. Las 249 instancias Playwright finales comprenden 133 públicas +105 de paneles/filtros +7 de altas/pago/asistencia +4 anchos adicionales; los 21 casos anónimos de una ejecución intermedia se solapan con las 133 públicas y no se agregan.

## Unitarias, componentes y contratos

Jest aprobó **404 casos en 85 suites**, cero fallos y cero omitidos; duración de proceso ${summary.jest.seconds} s. Cobertura global: sentencias ${coverage.statements.pct}%, ramas ${coverage.branches.pct}%, funciones ${coverage.functions.pct}% y líneas ${coverage.lines.pct}%. ${ref('cobertura/lcov-report/index.html')}, ${ref('cobertura-resumen.json')}. Se instrumentan los archivos incluidos por la configuración; esos porcentajes no significan cobertura funcional completa.

${modules.map(m=>`- ${m.module}: ${m.cases} casos; archivos en unitarias/modulos.json.`).join('\n')}

Los módulos de autenticación, usuarios/permisos, pagos, asistencia, evaluaciones, anuncios/notificaciones, reportes, gamificación y UI deben interpretarse según los archivos y aserciones concretos de ${ref('unitarias/modulos.json')} y ${ref('casos-jest-detallados.json')}. Los contratos verifican forma de servicios y llamadas; los cinco casos de gamification.audit.integration.test.js usan repositorios en memoria. No demuestran PostgreSQL. La nueva prueba del panel usa servicios y router simulados. Los diez casos Edge también son contratos locales, sin envío real a proveedores.

## Integración real y gamificación

Los **17/17 casos** de ${src('tests/integration/gamification.local.test.cjs')} pasan por Auth, REST, repositorios de producción, RPC y PostgreSQL local. ${ref('integracion/integracion-17-final.stdout.log')} y su ${ref('integracion/integracion-17-final.meta.json')}. Las notificaciones comerciales se desacoplan para evitar envío externo; no se simula la persistencia. Los registros se crean exclusivamente en el backend descartable. El catálogo sintético de campaña se inserta mediante DML del propietario local, sin cambiar grants ni políticas; las consultas funcionales usan cuentas autenticadas.

G01/G02/G03/G04/G06/G07 comprueban XP, nivel e historial; G14 racha de tres días hábiles; G08 logros, retos y clasificación; G16 campaña; G10/G15 identidad, avatar y título; G11/G12/G13 wallet, compra y equipamiento; G09 ingreso diario de 8 XP una vez al día. G02/G04/G05/G06 enlazan asistencia, alta/modificación de pago y evaluación con gamificación. G08 comprueba existencia de un snapshot de clasificación del atleta de fixture, sin verificar su categoría, posición ni ordenación; ese aspecto permanece parcialmente comprobado. G17 acredita entrega de recuperación en SMTP/Mailpit **local**, sin cambiar la contraseña ni probar Resend o FCM reales. Las categorías pueden compartir casos y no deben sumarse.

## Playwright

${browsers.map(r=>`- ${r.label}: ${r.expected}/${r.expected+r.unexpected+r.skipped}, cero omitidos; ${(r.duration/1000).toFixed(3)} s; ${ref(r.label+'/html/index.html')}.`).join('\n')}

Siete perfiles entre 390 y 1920 px y límites adicionales 481/600/767/768 px. Incluyen navegación pública y paneles, controles de acceso visual, filtros, búsqueda, ordenación y siete flujos administrativos que escriben datos descartables. Las 28 instancias del archivo auth.password-recovery.spec.js interceptan Auth/REST: verifican UI y navegación, no autenticación remota. La entrega real local se comprueba separadamente mediante G17. Las demás autenticaciones por rol usan Auth local. Las trazas/vídeos se deshabilitan para reducir exposición de sesiones; se conservan HTML/JSON y capturas pertinentes. No se realizó evaluación de interacción con participantes.

## Correcciones y ciclos de verificación

- Panel del atleta: se resuelve acceso anónimo/rol ajeno antes de consultar datos, se ignoran respuestas antiguas y se libera loading de la petición vigente, incluida una carga silenciosa superpuesta. Regresión de siete casos: ${ref('jest-access-race-red.json')} → ${ref('jest-access-race-green.json')}; las 21 denegaciones públicas en navegador forman parte de la regresión final.
- Cambio de membresía de un pago: se envía monto nulo al cambiar la membresía para que el trigger calcule el precio vigente; se preserva el precio histórico cuando no cambia. ${ref('jest-payments-red.json')} → ${ref('jest-payments-green.json')}; G05 comprueba 35 →32,50 en PostgreSQL.
- Instrumentación Android: la plantilla esperaba com.getcapacitor.app y ahora verifica com.riovoley.app, applicationId del producto. ${ref('android/instrumentacion-red.json')} → ${ref('android/instrumentacion-final.json')}. No se cambió la expectativa de un requisito funcional para ocultar un defecto.
- Guardia de integración: fetch rechaza redirecciones incluso si el llamador solicita seguirlas; ${ref('unitarias/guard-red.stdout.log')} → ${ref('unitarias/guard-green.stdout.log')}.
- Los 17 fallos E2E corregidos en la etapa anterior (selectores/esperas de asistencia, ordenación y controles móviles de pagos) permanecen cubiertos por esta regresión. Evidencia anterior: ${ref(prior+'/fallos-corregidos.json')}.

Los intentos de integración anteriores también conservan expectativas ajustadas al contrato inspeccionado (physical_test, vista de inventario, campos del shop, nickname único y acceso autenticado al catálogo), y el primer intento WebView por CDP que no conectó. No se presentan esos intentos como aprobados; el resultado final usa el mecanismo AndroidWebView real de Playwright.

En la repetición del APK actualizado, el primer intento de instalación quedó bloqueado al dejar de responder el emulador. Se detuvo exclusivamente el proceso del AVD propio, se conservó el código 1 y el log, y se reinició el mismo AVD sin borrar datos. La instalación posterior mediante transferencia no streaming y la instrumentación terminaron con salida0; los comandos ADB tienen ahora un plazo explícito para evitar esperas indefinidas. Las evidencias de ambos intentos se conservan en android/apk-instalar-final*. El chequeo adicional de SortableHeader aprobó seis casos ya incluidos en 404; no aumenta ese denominador.

## Compilación web y Android

Compilación web local final: ${ref(builds.at(-1).file)}, salida 0, ${builds.at(-1).durationSeconds} s; build de producción en runtime privado, no distribuido. ${ref(builds.at(-1).file.replace('.meta.json','.stdout.log'))} conserva advertencias de CRA/ESLint/tamaño. Compilar no verifica por sí solo todos los módulos.

Android: JDK21.0.12.1+1 portátil, SDK36/revisión2, build-tools35.0.0, Gradle8.14.3, AGP8.13.0. Capacitor core/android8.6.0 tras actualizaciones compatibles; CLI8.4.0. Se sincronizaron siete plugins y se ejecutaron assembleDebug y testDebugUnitTest: ${nativeRef('android/gradle-assemble.meta.json')}. El JUnit JVM contiene únicamente la plantilla aritmética 2+2, separada del caso instrumentado de contexto. Se conserva Lint y sus avisos en el expediente nativo; no equivalen a fallos de casos.

Lint registró **0 errores y 29 advertencias**: ${nativeRef('android/lint/lint-results-debug.txt')}, ${nativeRef('android/lint/lint-results-debug.html')}. Se conserva también el aviso de incompatibilidad entre versiones del formato XML de las herramientas SDK. El estado de instalación posterior a exportar el artefacto consta en ${ref('android/estado-runtime-final.json')}.

APK debug **${artifact.bytes} bytes**, SHA-256 **${artifact.sha256}**, ${nativeRef(artifact.file)}. El archivo se inspeccionó en todos sus miembros antes de exportarlo y se verificó su firma de depuración. El emulador propio API36 x86_64 con WHPX ejecutó la instrumentación y cargó React dentro de MainActivity/WebView; se comprobaron las tres rutas protegidas sin sesión. ${ref('android/webview-final.json')}, ${ref('android/webview-final-inicio.png')}, ${ref('android/webview-final-denegacion.png')}. El APK offline no acredita login contra producción, notificaciones FCM, OTA, servicios Google ni ejecución en dispositivo físico. No se publicó ni distribuyó.

## Seguridad y dependencias

Consulta local actual de solo lectura: ${ref('seguridad/catalogo-local-lectura.stdout.log')}. **xp_ledger y login_rewards tienen RLS activo**, pero políticas ALL admiten escrituras del propietario; RLS habilitado no demuestra integridad de XP o recompensas. Las cuatro firmas de soft_delete_payment/restore_payment siguen siendo SECURITY DEFINER, ejecutables por anon y sin actor explícito en el cuerpo observado. No se invocaron para modificar registros. La lectura institucional anterior permanece en el expediente inicial; no se afirma haber vuelto a auditar el backend remoto en esta etapa.

| Árbol npm | Avisos antes →después | Críticos antes →después | Altos antes →después | Moderados antes →después |
|---|---:|---:|---:|---:|
${audits.map(a=>`| ${a.name} | ${a.before.total} →${a.after.total} | ${a.before.critical} →${a.after.critical} | ${a.before.high} →${a.after.high} | ${a.before.moderate} →${a.after.moderate} |`).join('\n')}

Se ejecutó npm audit fix --ignore-scripts --json, sin --force. Los críticos quedaron en cero, pero functions pasó de 39 a 62 avisos totales por el aumento de moderados (21→57). No se declara eliminado el riesgo: raíz conserva 13 altos y functions 5. Se rechazaron propuestas incompatibles como react-scripts0.0.0 y una degradación mayor de Genkit. Las comparaciones y JSON npm conservan denominadores independientes. Build/lint de functions y lint auxiliar finalizaron con salida 0: ${ref('integracion/functions-build.meta.json')}, ${ref('integracion/functions-lint.meta.json')}, ${ref('integracion/auxiliar-lint.meta.json')}. El árbol auxiliar declara Node22 frente al Node24 utilizado; se documenta la diferencia sin cambiar la instalación global.

La corrección de RPC/RLS requiere autorización explícita según la restricción original del usuario. ${src('database/security/REVISION_Y_AUTORIZACION_PENDIENTE.md')} contiene alcance, riesgos del trigger, escrituras directas y ambigüedad de sobrecargas. El SQL adjunto es un borrador parcial **no listo para aplicar**, sin validación dinámica; no se presenta como una remediación terminada. Se necesita un cambio coordinado de pagos y del contrato de escritura de XP/wallet/recompensa diaria, primero en el entorno descartable. La revisión presente no constituye una auditoría de penetración completa.

## Integridad, límites y pendientes

Las cantidades se derivan de JSON/TAP/JUnit, no de filas inventadas. ${ref('RESUMEN_CIERRE.json')}, ${ref('casos-e2e-detallados.json')} y ${ref('casos-jest-detallados.json')} permiten contrastarlas. ${ref('PRIVACIDAD.json')}, ${ref('INTEGRIDAD.json')} y ${ref('MANIFIESTO_SHA256.json')} documentan cierre y huellas; el manifiesto se excluye a sí mismo. Se verifican también los cuatro expedientes previos sin reescribirlos.

Pendientes: endurecimiento RLS/RPC autorizado y validado, avisos npm residuales, proveedores comerciales de correo/push, dispositivo físico y flujos nativos autenticados. No hay resultados USE/UES-SF ni inferencias sobre motivación/usabilidad. El texto de tesis es propuesta separada; no se modificó el documento académico.
`;
h.write('INFORME_VERIFICACION_TECNICA.md',report);
const rows=[
 ['1. Caso de uso de gamificación','src/features/gamification/application/useCases/createGamificationUseCases.test.js','G01–G09, G14, G16','Unitarias y 17 casos reales compartidos','Jest usa repositorios simulados; G* usa PostgreSQL local','No acredita todas las combinaciones institucionales'],
 ['2. Servicio público de gamificación','src/features/gamification/presentation/createGamificationService.test.js','G01/G07/G08/G09/G16','Contratos/servicio e integración real','Servicios/repositorios reales en G*; contratos incluidos en 404','Las cantidades exactas Jest se obtienen del inventario, no se suman por categoría'],
 ['3. Identidad del atleta','src/features/gamification','G10/G15','Unitaria +persistencia local','Auth y repositorio real en G*','Nickname sintético único; no valida preferencias de usuarios'],
 ['4. Wallet y monedas','src/features/gamification','G07/G11/G13','Unitaria +integración real','Wallet PostgreSQL/RPC reales en G*','Persiste riesgo de escrituras directas por RLS'],
 ['5. Tienda cosmética','src/features/gamification','G11/G12/G13','Unitaria +RPC real','Compra/inventario/equipamiento persistidos localmente','Sin pagos monetarios externos'],
 ['6. Asistencia','src/features/attendance','G02/G03/G14;7 flujos E2E compartidos','Unitaria +integración +E2E','Mocks Jest; Auth/REST/PG reales locales en G*/E2E','Datos descartables; no registros institucionales'],
 ['7. Pagos','src/features/payments','G04/G05;7 flujos E2E compartidos','Unitaria +integración +E2E','20 casos en archivo useCases; PG real en G*/E2E','RPC/RLS de acceso todavía pendientes de endurecimiento'],
 ['8. Compilación','package.json','No aplica: comandos','Web CRA y Android Gradle','Herramientas reales, APK offline','Compilar no prueba todas las funciones'],
 ];
const predicates=[
 t=>t.file.endsWith('/createGamificationUseCases.test.js'),
 t=>t.file.endsWith('/createGamificationService.test.js'),
 t=>t.file.includes('/gamification/')&&/identit|identidad|avatar|nickname|title|título|portrait/i.test(t.title),
 t=>t.file.includes('/gamification/')&&/wallet|coin|moneda|currency|saldo/i.test(t.title),
 t=>t.file.includes('/gamification/')&&/buy|purchase|cosmetic|equip|shop|tienda|compra/i.test(t.title),
 t=>t.file.includes('/attendance/'),
 t=>t.file.includes('/payments/'),
 ()=>false,
];
const trace=rows.map((r,i)=>({category:r[0],jestCases:unit.filter(predicates[i]),realCases:r[2],evidence:i===7?builds.at(-1).file:'integracion/integracion-17-final.stdout.log'}));
h.write('trazabilidad-detallada.json',trace);
const matrix=`# Matriz de verificaciones para la Tabla 4-6

Commit base ${summary.commit}, árbol modificado; ${summary.generatedAt}. Esta matriz sustituye las conclusiones provisionales de etapas anteriores sin borrar sus evidencias. Universo de referencia: **404 casos Jest / 85 suites**, **17 casos reales** y **249 instancias Playwright**; denominadores independientes. Las categorías se solapan. No deben sumarse filas ni considerar que un directorio sea un archivo de prueba.

| Categoría | Archivos y localización | Casos ejecutados relacionados | Tipo | Mocks/servicios | Limitación |
|---|---|---|---|---|---|
${rows.map(r=>`| ${r.join(' | ')} |`).join('\n')}

Todos los casos referidos están aprobados en la ejecución final. El inventario exacto por categoría, con nombres individuales y resultado, se conserva en ${ref('trazabilidad-detallada.json')}. La selección de identidad/wallet/tienda usa los nombres de sus aserciones dentro de gamificación; es una correspondencia explícita y conservadora, no un cálculo de cobertura funcional. Las rutas genéricas de la tabla indican agrupación. Los casos G01–G17 corresponden al archivo concreto ${src('tests/integration/gamification.local.test.cjs')}, con resultados en ${ref('integracion/integracion-17-final.stdout.log')}. Hay ${contracts.length} casos de contrato y ${logical.length} casos de integración en memoria dentro de 404; no se confunden con los 17 reales.

| Categoría | Casos Jest ejecutados/aprobados | Archivos de prueba exactos |
|---|---:|---|
${trace.map(t=>`| ${t.category} | ${t.jestCases.length}/${t.jestCases.length} | ${[...new Set(t.jestCases.map(c=>c.file))].map(src).join('<br>')||'No aplica: compilación'} |`).join('\n')}

## Correspondencia explícita de cobertura de gamificación

| Aspecto solicitado | Caso real local | Alcance |
|---|---|---|
| XP acumulado, niveles, historial y repetición | G01/G02/G03/G04/G06/G07 | Repositorios de producción y PostgreSQL |
| Rachas | G14 | Tres días hábiles consecutivos |
| Logros y retos | G08 | Progreso persistido de fixture |
| Campañas | G16 | Una campaña sintética activa |
| Clasificación por categoría | G08 | Persistencia de snapshot del atleta; categoría y posición no comprobadas |
| Identidad, título, avatar | G10/G15 | Persistencia por propietario |
| Wallet, tienda, equipar/desequipar | G11/G12/G13 | RPC, saldo e inventario reales locales |
| Login diario | G09 | Ocho XP, idempotencia del día |
| Asistencia hacia gamificación | G02/G03/G14 | Actividad e historial persistidos |
| Alta/modificación de pago hacia gamificación | G04/G05 | Precio recalculado y movimiento único |
| Evaluación física hacia gamificación | G06 | Movimiento XP y nivel |

## Verificaciones complementarias

- Playwright: ${browsers.map(b=>`${b.label} ${b.expected}/${b.expected}`).join('; ')}. Evidencia: ${groups.map(g=>ref(g+'/resultados.json')).join(', ')}. Los archivos exactos están en ${ref('casos-e2e-detallados.json')}. Auth password-recovery en navegador tiene 28 instancias con interceptación; G17 comprueba por separado SMTP local real.
- Android: ${nativeRef('android/gradle-assemble.meta.json')}, ${nativeRef('android/unitarias-final/resumen.json')}, ${ref('android/instrumentacion-final.json')} y ${ref('android/webview-final.json')}. Un caso JVM de plantilla, un caso instrumentado y tres denegaciones WebView se mantienen separados. APK actualizado y offline, no dispositivo físico.
- Seguridad: ${ref('seguridad/catalogo-local-lectura.stdout.log')}, ${audits.map(a=>ref('seguridad/comparacion-'+a.name+'.json')).join(', ')}. RLS activo no equivale a integridad; los cambios de políticas/RPC siguen bloqueados por autorización expresa. Las rutas protegidas UI se prueban en navegador/WebView, sin equipararlas a autorización de backend.
- Compilación: ${ref(builds.at(-1).file)} y ${nativeRef('android/gradle-assemble.meta.json')}. Resultado salida 0; advertencias conservadas en logs.

${ref('INFORME_VERIFICACION_TECNICA.md')} detalla método, tiempos, cobertura, correcciones y pendientes. ${ref('MANIFIESTO_SHA256.json')} identifica archivos y ${ref('INTEGRIDAD.json')} verifica cifras/enlaces. Ninguna prueba técnica constituye una evaluación USE/UES-SF, de motivación o de interacción con participantes.
`;
h.write('MATRIZ_VERIFICACIONES_TESIS.md',matrix);
h.write('RESULTADOS_PARA_TESIS_4_5.md',`# Propuesta para revisión académica: apartado 4.5

Texto propuesto para incorporar después de la Tabla 4-6. No se modificó el documento de tesis.

En la ejecución de cierre de la verificación técnica de RIOVOLEY, realizada el 28 de octubre de 2026 sobre el commit base ${summary.commit.slice(0,7)} y el árbol local modificado identificado en el manifiesto de evidencias, se aprobaron **404 casos de pruebas unitarias y de componentes distribuidos en 85 suites**. La cobertura instrumentada de líneas fue ${coverage.lines.pct}%, por lo que estos resultados se circunscriben a los archivos y comportamientos cubiertos por la configuración. Los ${contracts.length} casos de contrato y ${logical.length} casos de integración lógica con repositorios en memoria forman parte de ese mismo denominador y no constituyen evidencia de persistencia en PostgreSQL. Véanse ${ref('jest-coverage.json')}, ${ref('casos-jest-detallados.json')} y ${ref('cobertura-resumen.json')}.

De manera independiente, se aprobaron **17 pruebas de integración real** contra un entorno Supabase/PostgreSQL local, aislado y con datos descartables. Estas verificaciones comprobaron acumulación e idempotencia de XP, nivel e historial, rachas, logros, retos y una campaña, persistencia de un snapshot de clasificación del atleta de prueba, sin verificar categoría ni posición, identidad, títulos y avatar, wallet, compra y equipamiento de cosméticos, recompensa diaria y sincronización de gamificación con asistencia, pagos y evaluaciones físicas. También se verificó la entrega de un correo de recuperación en SMTP/Mailpit local, sin modificar contraseñas. Este alcance no acredita la entrega mediante proveedores comerciales ni la configuración institucional. Evidencia: ${ref('integracion/integracion-17-final.stdout.log')} y ${ref('MATRIZ_VERIFICACIONES_TESIS.md')}.

La regresión extremo a extremo aprobó **249 instancias de Playwright**, distribuidas en 133 públicas,105 de paneles y consultas, siete flujos administrativos con escritura local y cuatro comprobaciones adicionales de anchura. Los casos de recuperación de contraseña en navegador emplearon interceptación de servicios; se diferencian de la prueba SMTP local anterior. Las verificaciones finales incluyeron las correcciones del bloqueo del panel del atleta ante accesos sin sesión y del precio al cambiar la membresía de un pago; se conservaron intentos fallidos y regresiones antes y después de corregirlos. No se contabilizan las ejecuciones intermedias como casos adicionales. Evidencia: ${groups.map(g=>ref(g+'/resultados.json')).join(', ')} y ${ref('INFORME_VERIFICACION_TECNICA.md')}.

La compilación web de producción y la compilación nativa Android finalizaron con código de salida 0. El APK de depuración actualizado se instaló en un emulador API36 y aprobó una prueba instrumentada de identificación de la aplicación; además, React se abrió en su WebView y se comprobaron tres denegaciones de acceso sin sesión. La prueba JUnit de plantilla ejecutada en JVM se registra por separado y no valida funciones del negocio. El APK utiliza una configuración offline, sin credenciales institucionales, y estas evidencias no sustituyen pruebas de todos los flujos autenticados en Android ni de dispositivos físicos. Evidencia: ${ref(builds.at(-1).file)}, ${nativeRef('android/gradle-assemble.meta.json')}, ${ref('android/instrumentacion-final.json')} y ${ref('android/webview-final.json')}.

Las actualizaciones compatibles de dependencias redujeron a cero los avisos críticos detectados por npm en los tres árboles revisados; persistieron avisos altos y moderados. En functions, el total aumentó de 39 a 62 debido a avisos moderados, pese a la reducción de altos y críticos. La inspección local de solo lectura confirmó RLS activo en xp_ledger y login_rewards, aunque también identificó políticas que permiten escrituras del propietario y RPC de pagos pendientes de endurecimiento. No se aplicaron cambios de permisos o políticas, sujetos a autorización expresa y validación coordinada. Por ello, la evidencia sustenta los comportamientos comprobados y sus correcciones, manteniendo explícitas las limitaciones de seguridad y del entorno; no permite concluir seguridad total ni resultados de usabilidad, motivación o interacción con participantes. Véanse ${ref('seguridad/comparacion-raiz.json')}, ${ref('seguridad/comparacion-functions.json')}, ${ref('seguridad/comparacion-auxiliar.json')}, ${ref('seguridad/catalogo-local-lectura.stdout.log')} y ${src('database/security/REVISION_Y_AUTORIZACION_PENDIENTE.md')}.
`);
console.log(JSON.stringify({evidence:h.evidence,jest:404,realIntegration:17,e2e:cases.length,coverage:coverage.lines.pct}));
