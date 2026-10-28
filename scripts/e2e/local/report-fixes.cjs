const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const h = require('./harness.cjs');
const read = file => JSON.parse(fs.readFileSync(path.join(h.evidence, file), 'utf8'));
const ref = file => `[${file}](${file})`;
const source = file => ref(path.relative(h.evidence, path.join(h.root,file)).replaceAll('\\','/'));
const previous = '../20261028-141243-c71f55e';
const initial = '../../verificacion-tecnica/20261027-212222-c71f55e';
function specs(s) { return [...(s.specs || []), ...(s.suites || []).flatMap(specs)]; }
function cases(report, group) { return report.suites.flatMap(specs).flatMap(s => s.tests.map(t => ({group,file:s.file,title:s.title,project:t.projectName,status:t.status,durationMs:t.results.reduce((n,r)=>n+r.duration,0)}))); }
const pending = read('pendientes-finales/resultados.json');
const mutations = read('mutaciones-confirmadas/resultados.json');
const boundaries = read('limites-finales/resultados.json');
const jest = read('jest-coverage-final.json');
const final = [...cases(pending,'pendientes-finales'), ...cases(mutations,'mutaciones-confirmadas')];
assert.equal(final.length,112); assert.equal(final.filter(t=>t.status==='expected').length,112);
assert.equal(boundaries.stats.expected,4); assert.equal(boundaries.stats.unexpected,0);
assert.equal(jest.numPassedTests,395); assert.equal(jest.numFailedTests,0);
const prior = JSON.parse(fs.readFileSync(path.resolve(h.evidence,previous,'casos-e2e-detallados.json')));
const key = c => [c.file,c.title,c.project].join('::');
assert.deepEqual(final.map(key).sort(),prior.map(key).sort());
const resolved = prior.filter(t=>t.status==='unexpected').map(t=>({...t,currentStatus:final.find(c=>key(c)===key(t)).status}));
assert.equal(resolved.length,17); assert.ok(resolved.every(c=>c.currentStatus==='expected'));
const unit = jest.testResults.flatMap(s => s.assertionResults.map(t => ({file:path.relative(h.root,s.name).replaceAll('\\','/'),title:t.fullName,status:t.status})));
const contracts = unit.filter(t=>/contract.*\.test|\.contract\.test/i.test(t.file));
const integration = unit.filter(t=>t.file.endsWith('gamification.audit.integration.test.js'));
const coverage = require('istanbul-lib-coverage').createCoverageMap(read('cobertura/coverage-final.json')).getCoverageSummary().toJSON();
const buildFiles = fs.readdirSync(h.evidence).filter(f=>/^compilacion-web-build-.*\.meta\.json$/.test(f)).sort();
const builds = buildFiles.map(file=>({file,...read(file)}));
assert.ok(builds.every(b=>b.exitCode===0));
const attempts = fs.readdirSync(h.evidence,{withFileTypes:true}).filter(d=>d.isDirectory() && fs.existsSync(path.join(h.evidence,d.name,'resultados.json'))).map(d=>({label:d.name,...read(d.name+'/resultados.json').stats}));
h.write('casos-e2e-detallados.json',final);
h.write('fallos-corregidos.json',resolved);
h.write('casos-jest-detallados.json',unit);
h.write('cobertura-resumen.json',coverage);
h.write('resumen-correcciones.json',{generatedAt:new Date().toISOString(),commit:cp.execFileSync('git',['rev-parse','HEAD'],{cwd:h.root,encoding:'utf8'}).trim(),originalInstances:112,passed:112,failed:0,skipped:0,resolved:resolved.length,boundaries:{executed:4,passed:4,failed:0},jest:{suites:jest.numTotalTestSuites,executed:jest.numTotalTests,passed:jest.numPassedTests,failed:jest.numFailedTests,skipped:jest.numPendingTests},contracts:{executed:contracts.length,passed:contracts.filter(t=>t.status==='passed').length,subsetOfJest:true},logicalIntegration:{executed:integration.length,passed:integration.filter(t=>t.status==='passed').length,subsetOfJest:true,realPersistence:false},attempts});
const table = [
  ['JEST-01','Jest y Testing Library',395,395,0,0,'APROBADO','jest-coverage-final.json'],
  ['CON-01','Contratos (subconjunto de JEST-01)',contracts.length,contracts.length,0,0,'APROBADO','casos-jest-detallados.json'],
  ['INT-01','Integración lógica en memoria (subconjunto de JEST-01)',integration.length,integration.length,0,0,'APROBADO','casos-jest-detallados.json'],
  ['E2E-01','Quince casos × siete perfiles',105,105,0,0,'APROBADO','pendientes-finales/resultados.json'],
  ['E2E-02','Alta + mensualidad + asistencia, siete perfiles',7,7,0,0,'APROBADO','mutaciones-confirmadas/resultados.json'],
  ['E2E-03','Límites adaptables de pagos',4,4,0,0,'APROBADO','limites-finales/resultados.json'],
  ['DB-01','Persistencia SQL de los siete flujos',7,7,0,0,'APROBADO','persistencia-siete-flujos.json'],
  ['HAR-01','Pruebas del arnés local',12,12,0,0,'APROBADO','arnes-final.stdout.log'],
  ['AUTH-01','Login y lectura de tres roles locales',3,3,0,0,'APROBADO','auth-roles-reales.json'],
  ['RLS-01','Matriz SQL local con ROLLBACK (un script)','—','—','—','—','APROBADO','rls-local.meta.json'],
  ['WEB-01','Compilación CRA (comando, sin casos)','—','—','—','—','APROBADO',builds.at(-1).file],
  ['AND-01','Compilación nativa Android','—','—','—','—','NO EJECUTADO',initial+'/INFORME_VERIFICACION_TECNICA.md'],
].map(r=>`| ${r.slice(0,-1).join(' | ')} | ${ref(r.at(-1))} |`).join('\n');
const changes = `- Asistencias: se reutiliza el helper de login/navegación que prepara la guía inicial y abre el menú móvil; se espera Registro Rápido, sin condicionar el clic a un conteo inmediato. Los selectores por nombres internos de clases se sustituyen por atributos estables. Se exige al menos una fila y correspondencia entre filas, nombres y acciones, para evitar comprobaciones vacías.
- Pagos: los encabezados se ocultan por global.css hasta 767 px. Se incorporan controles accesibles para los seis criterios en la presentación de tarjetas; usan exactamente queryState/toggleSort existentes. SortableHeader informa el estado fuera de tablas mediante nombre accesible. El ciclo sigue siendo ninguno → ascendente → descendente → ninguno.
- Ordenación E2E: se comprueban importes numéricos reales en todas las páginas, esperando la consulta y la página correspondiente. El seed local incluye dos precios distintos (35 y 32,50); las pruebas rechazan listas constantes como evidencia de ordenación. Los cuatro anchos nuevos cubren el intervalo que no aparecía en los siete perfiles originales.
- Alta: se utilizan Estudiantes, Crear, campos actuales y el modal de credenciales. Se elige entrega manual y se cierra el modal; no se configura ni acredita entrega por proveedores externos. El importe automático deshabilitado se comprueba como 35,00, respetando el formato monetario, sin intentar escribir 25 en él.
- Asistencia: se comprueba el botón correspondiente a una mensualidad activa. Se espera la respuesta POST satisfactoria antes de recargar, pues el color inicial es una actualización optimista. Después se verifica de nuevo pago y asistencia. La consulta SQL posterior acredita las siete cadenas persistidas. Las altas se restringen al arnés local.
- Privacidad: las claves temporales creadas por UI permanecen en runtime ignorado y se incorporan al saneamiento de logs/reportes; el contenido code de credenciales se enmascara visualmente en las capturas.`;
const attemptRows=attempts.map(a=>`| ${a.label} | ${a.expected} | ${a.unexpected} | ${a.skipped} | ${(a.duration/1000).toFixed(3)} | ${ref(a.label+'/resultados.json')} |`).join('\n');
const buildRows=builds.map(b=>`| ${b.command.join(' ')} | ${b.exitCode} | ${b.durationSeconds} | ${ref(b.file)} |`).join('\n');
const report=`# Informe de corrección y verificación técnica de RIOVOLEY

Commit base **c71f55e5bc59c528a002c4347fb1664794cb277e**; árbol local con cambios de auditoría y las correcciones aquí descritas, sin commit ni push. Fecha: 28/10/2026; zona America/Guayaquil (UTC−05). Los registros guardan inicio/fin UTC. Este expediente complementa [la auditoría inicial](${initial}/INFORME_VERIFICACION_TECNICA.md) y [la primera ejecución aislada](${previous}/INFORME_VERIFICACION_TECNICA.md); ambos se conservan con sus hashes.

## Alcance y entorno

Se corrigieron las causas de las 17 instancias fallidas de la primera pasada aislada y se repitieron las mismas 112 instancias, con cuatro comprobaciones adaptables adicionales. Windows 11, Node ${fs.readFileSync(path.join(h.evidence,'versiones-node.stdout.log'),'utf8').trim()}, npm ${fs.readFileSync(path.join(h.evidence,'versiones-npm.stdout.log'),'utf8').trim()}, CRA 5.0.1, React 19, Playwright instalado según lockfile y Supabase local Docker. API 127.0.0.1:55321, PostgreSQL 17.11 en 55322 y frontend 6100. La configuración ${source('playwright.local.config.cjs')} usa siete perfiles, Chromium/WebKit, tres workers en las pasadas finales y **cero reintentos**. El proxy cerrado bloquea solicitudes externas del navegador. Variables requeridas: claves Supabase y PII locales, cuentas ADMIN/TRAINER/STUDENT y E2E_LOCAL_LABEL; los valores no se publican. No se carga .env.e2e institucional. ${ref('bindings-locales.json')} acredita bindings a loopback.

Supabase Auth, REST y PostgreSQL de E2E son reales y locales, con datos ficticios. El esquema local fue reconstruido desde metadatos en la etapa anterior; no se afirma equivalencia absoluta con producción (PostgreSQL remoto observado entonces: 17.4). No se modificó la base institucional ni sus credenciales, esquema, RLS o permisos. El build usa configuración exclusiva local. No se publicó ni distribuyó ningún paquete.

## Correcciones y justificación

${changes}

Archivos principales: ${source('tests/e2e/asistencias.guided.review.spec.js')}, ${source('tests/e2e/filters-sorting.tables.spec.js')}, ${source('tests/e2e/admin.happy-path-controlled.spec.js')}, ${source('tests/e2e/helpers/paymentsSorting.js')}, ${source('tests/e2e/payments.responsive-boundaries.spec.js')}, ${source('src/features/payments/presentation/components/PagosManager.js')}, ${source('src/shared/ui/SortableHeader.js')} y ${source('src/features/attendance/presentation/components/AsistenciasManager.js')}. No se cambió la lógica de cálculo, cobro, autenticación o persistencia del producto para hacer aprobar pruebas; el cambio funcional de interfaz incorpora ordenación móvil con la lógica existente.

## Metodología reproducible

Desde la raíz, con Docker local disponible: ejecutar secuencialmente npm.cmd run e2e:local:setup; npm.cmd run e2e:local:build; node scripts/e2e/local/functions.cjs (servicio en otra terminal); node scripts/e2e/local/run.cjs mutations --workers=3; node scripts/e2e/local/run.cjs pending --workers=3; node scripts/e2e/local/run.cjs boundaries --workers=2; node scripts/e2e/local/check-fixes.cjs coverage-final; node scripts/e2e/local/check-environment-fixes.cjs. Usar etiquetas nuevas en cada ejecución. No correr seed/idempotencia simultáneamente con altas. ${source('scripts/e2e/local/README.md')} documenta preparación y aislamiento. Cada comando instrumentado conserva stdout/stderr y meta.json con argumentos, fechas, duración y código de salida.

## Resultados consolidados finales

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
${table}

Las mismas **112 instancias** pasaron de **95 aprobadas y 17 fallidas a 112 aprobadas y cero fallidas**, con cero omisiones. ${ref('fallos-corregidos.json')} relaciona individualmente los 17 fallos anteriores con su resultado actual; ${ref('casos-e2e-detallados.json')} conserva el denominador completo. Los cuatro casos de límites son adicionales: **116 instancias E2E finales aprobadas**, no una suma de todos los intentos. Los siete controles SQL verifican las mismas altas y no se añaden al denominador E2E. Los contratos y cinco integraciones lógicas están dentro de las 395 pruebas Jest, no se suman otra vez.

Jest: **${jest.numPassedTestSuites}/${jest.numTotalTestSuites} suites y ${jest.numPassedTests}/${jest.numTotalTests} casos**, ${jest.numPendingTests} omitidos. Esos resultados incluyen las cinco pruebas de integración lógica añadidas durante la auditoría inicial y tres nuevas aserciones de accesibilidad de SortableHeader. La mayoría de pruebas de servicios/casos de uso usan repositorios o dependencias simuladas; los cinco casos de integración lógica usan almacenamiento en memoria, no PostgreSQL. La cobertura instrumentada es: líneas **${coverage.lines.pct}% (${coverage.lines.covered}/${coverage.lines.total})**, sentencias ${coverage.statements.pct}%, funciones ${coverage.functions.pct}% y ramas ${coverage.branches.pct}% (${ref('cobertura-resumen.json')}, ${ref('cobertura/lcov-report/index.html')}). Se conserva la limitación del App.test.js trivial identificada inicialmente; no se interpreta la cobertura como validación completa del producto.

Duraciones Playwright finales: 105 instancias, ${(pending.stats.duration/1000).toFixed(3)} s; siete cadenas, ${(mutations.stats.duration/1000).toFixed(3)} s; cuatro límites, ${(boundaries.stats.duration/1000).toFixed(3)} s. Reportes HTML: ${ref('pendientes-finales/html/index.html')}, ${ref('mutaciones-confirmadas/html/index.html')}, ${ref('limites-finales/html/index.html')}. Las capturas de revisión guiada conservan los datos ficticios; no se habilitaron trazas ni vídeos que pudieran guardar tokens.

## Compilación web y Android

| Comando registrado | Salida | Duración (s) | Evidencia |
|---|---:|---:|---|
${buildRows}

Ambos builds se generaron en directorios nuevos de .e2e-local; el segundo contiene el breakpoint final. Archivos de salida y hashes: ${ref('artefactos-compilacion.json')}. Advertencias: consultar los stdout/stderr de compilación; se registró la deprecación DEP0176 de Node. Se compiló React para web; ello no demuestra todas las funcionalidades ni constituye una compilación Android. Android no se reejecutó: en la inspección inicial faltó Android SDK y el JDK/Gradle disponible era incompatible. Esa verificación conserva estado NO EJECUTADO, con requisitos en el informe inicial. No se publicaron APK/AAB ni OTA.

## Persistencia, roles y seguridad

${ref('persistencia-siete-flujos.json')} acredita mediante SELECT local **siete estudiantes nuevos, siete pagos de 35 y siete asistencias** dentro de la ventana del run final. Es evidencia de persistencia real local, además de la recarga UI. No equivale a verificar todas las actualizaciones de XP, wallet, tienda, concurrencia o integraciones externas. Los intentos de depuración también dejaron registros ficticios, que se conservan; no se cuentan como siete casos adicionales.

Los tres roles aprobaron login y lecturas locales (${ref('auth-roles-reales.json')}); la matriz SQL con ROLLBACK finalizó con salida 0 (${ref('rls-local.meta.json')}). Estos controles tienen alcance limitado. No se ejecutó una nueva auditoría remota, npm audit fix, cambios de permisos ni remediación de los avisos de dependencias anteriores. Los hallazgos de seguridad de la auditoría inicial siguen pendientes de tratamiento específico; no se presenta este trabajo como prueba de penetración ni certificación de seguridad.

## Intentos, incidencias y límites

Todos los intentos Playwright de esta etapa se conservan; las filas finales se identifican por sus etiquetas y no se combinan con fallos previos para calcular el resultado final.

| Intento | Aprobados | Fallidos | Omitidos | Duración runner (s) | Evidencia |
|---|---:|---:|---:|---:|---|
${attemptRows}

La comprobación inicial de idempotencia coincidió por error con altas en curso y devolvió salida 1 al observar conteos cambiantes; no permite concluir duplicación ni corrupción. Se repitió después de terminar las escrituras y aprobó con conteos iguales (${ref('seed-idempotencia.json')}); los logs de ambos intentos se conservan. La primera ejecución llamada jest-rojo no llegó a evaluar el componente sin corrección, porque la edición se produjo antes de que CRA terminara de cargarlo: no se usa como evidencia de fallo previo. La pasada explícita jest-sin-correccion comprobó tres fallos nuevos y tres casos existentes aprobados; jest-con-correccion aprobó seis. El primer comando denominado jest-coverage solo ejecutó seis casos enfocados, sin cobertura; el resultado completo válido es jest-coverage-final (395 casos y artefactos de cobertura).

No se han ejecutado nuevas compras/equipamientos cosméticos ni validaciones de proveedores externos, compilación nativa o pruebas con usuarios. Los siete fallos de acceso anónimo a /estudiante de la primera auditoría pública corresponden a otro expediente y no se reejecutaron ni se declaran corregidos aquí. La corrección acreditada en esta etapa se refiere a las 17 instancias de la ejecución aislada.

La revisión independiente y las correcciones atendidas figuran en ${ref('REVISION_INDEPENDIENTE.md')}. Integridad/privacidad: ${ref('INTEGRIDAD.json')}, ${ref('PRIVACIDAD.json')} y ${ref('MANIFIESTO_SHA256.json')}. Las cifras se generan desde los JSON originales, no desde resultados simulados. Propuesta de texto académico: ${ref('RESULTADOS_PARA_TESIS_4_5.md')}; trazabilidad: ${ref('MATRIZ_VERIFICACIONES_TESIS.md')}.
`;
h.write('INFORME_VERIFICACION_TECNICA.md',report);
const categories=[
  ['1. Caso de uso de gamificación',t=>t.file.endsWith('/createGamificationUseCases.test.js')],
  ['2. Servicio público de gamificación',t=>t.file.endsWith('/createGamificationService.test.js')],
  ['3. Identidad del atleta',t=>t.file.includes('/gamification/') && /identity|avatar|identidad|t[ií]tulo/i.test(t.title+' '+t.file)],
  ['4. Wallet y monedas',t=>t.file.includes('/gamification/') && /wallet|moneda|currency|saldo|coin/i.test(t.title)],
  ['5. Tienda cosmética',t=>t.file.includes('/gamification/') && /cosmetic|cosm[eé]tic|purchase|buy|equip|tienda|shop/i.test(t.title+' '+t.file)],
  ['6. Asistencia',t=>t.file.includes('/attendance/')],
  ['7. Pagos',t=>t.file.includes('/payments/')],
];
const matrixRows=categories.map(([name,filter])=>{
  const selected=unit.filter(filter),files=[...new Set(selected.map(t=>t.file))];
  return `| ${name} | ${files.map(source).join('<br>')} | ${selected.length} | ${selected.filter(t=>t.status==='passed').length} aprobados | Unitarias/componentes; dependencias simuladas o funciones puras | No acreditan persistencia real; selección de casos en JSON | ${ref('casos-jest-detallados.json')} |`;
}).join('\n');
h.write('MATRIZ_VERIFICACIONES_TESIS.md',`# Matriz de verificaciones para la Tabla 4-6

Ejecución complementaria de correcciones del 28/10/2026, commit base c71f55e. Todas las cantidades siguientes proceden de las ejecuciones de este expediente. Los subconjuntos Jest se pueden solapar y no se suman; el total es 395 casos, 84 suites. Los criterios de selección por archivo/título constan en ${source('scripts/e2e/local/report-fixes.cjs')} y el inventario individual en ${ref('casos-jest-detallados.json')}.

| Categoría | Archivos relacionados | Casos ejecutados | Resultado real | Tipo / mocks o servicios | Limitaciones | Evidencia |
|---|---|---:|---|---|---|---|
${matrixRows}
| 8. Compilación | ${source('scripts/e2e/local/build.cjs')} | No aplica | Dos comandos con salida 0 | CRA real, configuración local | No acredita Android ni funcionamiento completo | ${ref(builds.at(-1).file)}, ${ref('artefactos-compilacion.json')} |

## Evidencia E2E que complementa asistencia y pagos

El happy path ejecutó siete cadenas completas (una por perfil), con Auth/REST/PostgreSQL locales reales: alta de estudiante, pago normal de 35 y asistencia, con recarga posterior. Las consultas SQL confirmaron siete relaciones de cada tipo en el run final. Son las mismas siete instancias, reutilizadas para las categorías 6 y 7, no catorce pruebas distintas: ${ref('mutaciones-confirmadas/resultados.json')}, ${ref('persistencia-siete-flujos.json')}. Los siete casos de filtros/ordenación de pagos y siete de filtros de asistencia pertenecen a las 105 instancias de ${ref('pendientes-finales/resultados.json')}; la revisión guiada añade otras siete instancias dentro de ese mismo denominador. Los cuatro casos de límites adaptables son adicionales y constan en ${ref('limites-finales/resultados.json')}.

La gamificación dispone además de cinco integraciones lógicas en memoria (subconjunto de Jest), no persistencia PostgreSQL. La navegación real de los paneles no acredita por sí sola las transacciones de wallet, compras, equipamiento ni modificación de avatar. No se confunden seed/catálogos con resultados funcionales.

## Complementos y pendientes

- Playwright: 112/112 instancias originales y 4/4 adicionales, cero reintentos/omisiones. Comparación de los 17 fallos: ${ref('fallos-corregidos.json')}.
- Contratos: ${contracts.length}/${contracts.length}, dentro de Jest y con dependencias simuladas; ${ref('resumen-correcciones.json')}.
- Seguridad local: tres roles y un script de matriz RLS con salida 0; no es auditoría de penetración. ${ref('auth-roles-reales.json')}, ${ref('rls-local.meta.json')}.
- Android: no ejecutado en esta etapa; Android SDK y compatibilidad JDK/Gradle pendientes según ${ref(initial+'/INFORME_VERIFICACION_TECNICA.md')}.
- Seguridad remota/dependencias, compras/equipamientos reales, proveedores externos y los siete fallos anónimos originales no se declaran resueltos.

El informe completo explica metodología, tiempos, intentos fallidos e integridad: ${ref('INFORME_VERIFICACION_TECNICA.md')}.
`);
h.write('RESULTADOS_PARA_TESIS_4_5.md',`# Propuesta para revisión académica: apartado 4.5

En la verificación complementaria del sistema RIOVOLEY se corrigieron las causas de las 17 instancias fallidas identificadas en la primera ejecución con backend aislado. La repetición conservó los 16 casos lógicos y los siete perfiles de pantalla: las **112 instancias extremo a extremo aprobaron, sin fallos, omisiones ni reintentos**, frente a las 95 aprobadas y 17 fallidas de la pasada anterior. Se verificaron adicionalmente cuatro casos de ordenación de pagos a 481, 600, 767 y 768 píxeles, todos aprobados. Las correcciones comprendieron la preparación de la guía inicial y del menú móvil, la actualización de selectores al flujo vigente y la incorporación de controles de ordenación en la presentación móvil de pagos. La ordenación se comprobó con importes distintos y sobre el conjunto paginado; la revisión de asistencias exigió filas reales para evitar comprobaciones vacías ([comparación individual](fallos-corregidos.json), [resultado de 105 instancias](pendientes-finales/resultados.json), [siete cadenas funcionales](mutaciones-confirmadas/resultados.json) y [límites adaptables](limites-finales/resultados.json)).

Las siete cadenas de alta de estudiante, registro de mensualidad y asistencia utilizaron Supabase Auth, REST y PostgreSQL **reales en un entorno local descartable**, con cuentas y datos ficticios. El pago y la asistencia se comprobaron después de recargar la aplicación y, mediante consultas de lectura posteriores, se confirmaron siete estudiantes nuevos con un pago de 35 y una asistencia cada uno. Esta evidencia acredita persistencia local para los flujos ejecutados; no demuestra equivalencia completa con la base institucional ni todas las transacciones de gamificación ([verificación SQL](persistencia-siete-flujos.json)). Por separado, Jest y Testing Library registraron **395 casos aprobados en 84 suites**, con cero fallos u omisiones y cobertura de líneas de **${String(coverage.lines.pct).replace('.',',')} %** (${coverage.lines.covered} de ${coverage.lines.total}). Estos resultados incluyen contratos y cinco pruebas de integración lógica en memoria; el uso de repositorios simulados en pruebas de servicios no se interpreta como integración real con PostgreSQL ([resultados Jest](jest-coverage-final.json), [inventario de casos](casos-jest-detallados.json) y [cobertura](cobertura-resumen.json)).

La compilación web finalizó con código de salida cero; el último comando duró **${String(builds.at(-1).durationSeconds).replace('.',',')} segundos**. Asimismo, aprobaron doce pruebas del arnés, tres controles de autenticación/lectura por rol y la ejecución del script de matriz RLS local, con denominadores independientes. La compilación web no constituye una compilación nativa Android, la cual permanece no ejecutada por los requisitos del entorno previamente documentados. Tampoco se consideran resueltos los hallazgos de seguridad/dependencias, las siete incidencias de acceso anónimo del expediente inicial ni los flujos transaccionales cosméticos y proveedores externos que no se reejecutaron. Los resultados tienen alcance técnico y no aportan mediciones de usabilidad, motivación o capacidad de interacción, ni resultados USE o UES-SF ([compilación](${builds.at(-1).file}), [controles del arnés](arnes-final.stdout.log), [roles](auth-roles-reales.json), [matriz SQL](rls-local.meta.json) e [informe de alcance y límites](INFORME_VERIFICACION_TECNICA.md)).

Este texto es una propuesta para revisión académica; no se modificó el documento de tesis.
`);
console.log(JSON.stringify({reports:3,originalE2E:112,resolved:17,additionalE2E:4,jest:395,coverage:coverage.lines.pct}));
