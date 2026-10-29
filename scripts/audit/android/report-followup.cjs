const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
assert.ok(!fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')),'Expediente sellado');
const read=name=>JSON.parse(fs.readFileSync(path.join(h.evidence,name),'utf8'));
const text=name=>fs.readFileSync(path.join(h.evidence,name),'utf8');
const ref=name=>`[${name}](${name})`;
const save=(name,value)=>h.write(name,value);
const context=read('CONTEXTO.json'),env=read('herramientas-entorno.json');
const nativeLabel=process.argv[2]||'autenticacion-final';assert.match(nativeLabel,/^[a-z0-9-]+$/);
const nativeFile='android/'+nativeLabel+'.json';
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
function latestMeta(prefix){return walk(h.evidence).filter(file=>file.endsWith('.meta.json')).map(file=>({file:path.relative(h.evidence,file).replaceAll('\\','/'),...JSON.parse(fs.readFileSync(file,'utf8'))})).filter(r=>r.file.startsWith(prefix)).sort((a,b)=>a.end.localeCompare(b.end)).at(-1);}
const unit=read('unitarias/jest-push-cierre.json');
const cases=unit.testResults.flatMap(s=>s.assertionResults.map(a=>({file:path.relative(h.root,s.name).replaceAll('\\','/'),title:a.fullName,status:a.status,durationMs:a.duration})));
assert.equal(cases.length,unit.numTotalTests);
save('unitarias/casos-jest.json',cases);
const coverage=read('unitarias/cobertura-push-cierre/coverage-summary.json').total;
const audit=read('seguridad/npm-raiz-after.json'),before=JSON.parse(text('seguridad/npm-audit-inicial.stdout.log'));
const functions=read('seguridad/npm-functions-after.json'),aux=read('seguridad/npm-auxiliar-after.json');
const apk=read('android/apk-privado-inspeccion-cierre.json'),native=read(nativeFile);
const instrumentation=read('android/instrumentacion-cierre.json'),junit=read('android/junit-cierre/resumen.json');
const web=latestMeta('compilacion-web/build-auditoria'),sync=latestMeta('android/capacitor-sync'),assemble=latestMeta('android/gradle-assemble'),lintRun=latestMeta('android/gradle-lint');
const lint=read('android/lint/final/resumen.json');
const parseTap=file=>{const s=text(file),n=name=>Number(s.match(new RegExp('# '+name+' (\\d+)'))?.[1]??0);return {file,executed:n('tests'),passed:n('pass'),failed:n('fail'),skipped:n('skipped')};};
const compatibility=parseTap('seguridad/compatibilidad-final.stdout.log'),guards=parseTap('android/entorno-adb-final-tap.stdout.log');
const summary={generatedAt:new Date().toISOString(),context,environment:env,jest:{executed:unit.numTotalTests,passed:unit.numPassedTests,failed:unit.numFailedTests,skipped:unit.numPendingTests,suites:unit.numTotalTestSuites,seconds:(unit.testResults.reduce((m,s)=>Math.max(m,s.endTime||0),0)-unit.startTime)/1000,file:'unitarias/jest-push-cierre.json'},coverage,compatibility,guards,web,sync,assemble,lintRun,lint,apk,instrumentation,junit,native,nativeEvidence:nativeFile,dependencies:{before:before.metadata.vulnerabilities,after:audit.metadata.vulnerabilities,functions:functions.metadata.vulnerabilities,aux:aux.metadata.vulnerabilities},productionChanged:false};
save('RESUMEN_FINAL.json',summary);
save('seguridad/DEPENDENCIAS_PENDIENTES.md',`# Dependencias señaladas después de los parches compatibles

Resultado npm actual: ${audit.metadata.vulnerabilities.total} paquetes señalados; no equivale a ese número de CVE únicos. Los intentos sin --force, el árbol resuelto y los cambios del lockfile están conservados. Se mantienen CRA 5.0.1 y la arquitectura del repositorio. No se sustituyó react-scripts por la versión 0.0.0 sugerida en parte de los metadatos de npm.

| Paquete | Severidad | Rango señalado | Causa transitiva/advisory | Impedimento para cerrar en esta etapa |
|---|---|---|---|---|
${Object.entries(audit.vulnerabilities).map(([name,v])=>`| ${name} | ${v.severity} | ${v.range} | ${v.via.map(a=>typeof a==='string'?a:'['+a.name+']('+a.url+')').join('<br>')} | ${typeof v.fixAvailable==='object'&&v.fixAvailable.version==='0.0.0'?'La propuesta automática reemplaza react-scripts por 0.0.0; no es una corrección aceptable del proyecto. Requiere actualización y validación de la cadena de herramientas.':v.fixAvailable?'npm audit fix sin --force no eliminó el aviso; el parche queda fuera de las restricciones de los padres resueltos. Necesita evaluar compatibilidad antes de forzar otro árbol.':'No hay parche automático indicado para este árbol; requiere revisar versiones upstream y compatibilidad.'} |`).join('\n')}

Este inventario no demuestra exposición explotable del paquete publicado. Incluye herramientas de compilación, pruebas y desarrollo; no se evaluaron todas las rutas de ataque. La producción y las credenciales institucionales no se utilizaron.
`);
const cell=(code,name,executed,passed,failed,skipped,state,evidence)=>`| ${code} | ${name} | ${executed} | ${passed} | ${failed} | ${skipped} | ${state} | ${ref(evidence)} |`;
const commandState=r=>r.exitCode===0?'APROBADO':'FALLIDO';
const junitCount=junit.results.reduce((v,r)=>({executed:v.executed+r.tests,failed:v.failed+r.failures+r.errors,skipped:v.skipped+r.skipped}),{executed:0,failed:0,skipped:0});
const previous='../20261029-135953-seguridad-local-e469db5';
save('INFORME_VERIFICACION_TECNICA.md',`# Verificación técnica complementaria: Android autenticado y dependencias

## 1. Identificación y entorno

RIOVOLEY, repositorio oficial Joscoo/riovoley. Commit base **${context.commit}**, rama fix/seguridad-local-20261029; los cambios posteriores se identifican en el inventario de fuentes. Inicio UTC ${context.createdAt}; cierre del informe ${summary.generatedAt}. Sistema ${env.os} ${env.release}, ${env.architecture}; Node ${env.node}, npm ${text('seguridad/npm-version.stdout.log').trim()}. Las horas de terminal usan America/Guayaquil (UTC−5); metadatos ISO en UTC.

Se reutilizaron herramientas privadas: JDK 21, Android SDK/API 36, Gradle 8.14.3 y Capacitor 8, comprobados en los registros Android. No se modificó Java/SDK global. ${ref('herramientas-entorno.json')}, ${ref('android/java-version.stderr.log')}, ${ref('android/gradle-version.stdout.log')}.

## 2. Alcance y metodología

Esta etapa continúa el ${ref(previous+'/INFORME_VERIFICACION_TECNICA.md')}, conservado como antecedente. Se ejecutaron nuevamente Jest, compilación web/nativa, análisis npm y lectura del catálogo PostgreSQL. Se añadió regresión de dependencias y acceso real por rol dentro del WebView Android. Los 249 Playwright de escritorio y las integraciones G/S del expediente anterior no se contabilizan como nuevas ejecuciones aquí.

El backend es exclusivamente riovoley-e2e-local, API 127.0.0.1:55321 y PostgreSQL 127.0.0.1:55322. Se comparó la identidad Auth de la cuenta sintética con auth.users antes de consultar SQL. Las cuentas, claves y herramientas quedan fuera de Git. No se accedió con cuentas institucionales ni se modificó producción.

Variables requeridas: REACT_APP_SUPABASE_URL (loopback), REACT_APP_SUPABASE_ANON_KEY y REACT_APP_PII_ENCRYPTION_KEY del stack descartable; las cuentas de los tres roles residen en credentials.json privado. JAVA_HOME, ANDROID_HOME/ANDROID_SDK_ROOT y GRADLE_USER_HOME apuntan a herramientas/cachés privadas. No se carga .env.e2e institucional; buildWebEnv bloquea las variables REACT_APP de .env antes de que CRA procese dotenv. No se publican valores de claves ni contraseñas.

Comandos reproducibles desde la raíz, después de provisionar el entorno local según scripts/e2e/local/README.md:

~~~powershell
node scripts/audit/android/initialize-followup.cjs
node scripts/audit/android/preflight-followup.cjs
node scripts/audit/android/dependencies-followup.cjs qs
node scripts/audit/android/stage.cjs local-auth
node scripts/audit/android/build.cjs assemble --rerun-tasks
node scripts/audit/android/build.cjs lint --rerun-tasks
node scripts/audit/android/build.cjs version
node scripts/audit/android/collect-private.cjs cierre
node scripts/audit/closure/launch-emulator.cjs
node scripts/audit/closure/instrumentation.cjs cierre
node scripts/audit/android/authenticated-webview.cjs --label=${nativeLabel}
node scripts/audit/closure/stop-emulator.cjs
node scripts/audit/security/inspect.cjs
node scripts/audit/closure/audit-dependencies.cjs after
~~~

La ejecución completa de Jest y sus argumentos de cobertura están en ${ref('unitarias/jest-push-cierre.meta.json')}; equivale a react-scripts test --watchAll=false --runInBand --coverage, con reporteros JSON y CI=true. Los archivos .meta.json conservan comando, inicio, fin, duración y código de salida. Las repeticiones son intentos separados y no se suman como casos nuevos.

## 3. Resultados

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
${cell('J01','Jest y Testing Library',summary.jest.executed,summary.jest.passed,summary.jest.failed,summary.jest.skipped,unit.success?'APROBADO':'FALLIDO',summary.jest.file)}
${cell('T01','Regresión y compatibilidad de dependencias, Node test',compatibility.executed,compatibility.passed,compatibility.failed,compatibility.skipped,compatibility.failed?'FALLIDO':'APROBADO',compatibility.file)}
${cell('A01','Protección del entorno y destino ADB, Node test',guards.executed,guards.passed,guards.failed,guards.skipped,guards.failed?'FALLIDO':'APROBADO',guards.file)}
${cell('N01','JUnit de plantilla Android',junitCount.executed,junitCount.executed-junitCount.failed-junitCount.skipped,junitCount.failed,junitCount.skipped,junitCount.failed?'FALLIDO':'APROBADO','android/junit-cierre/resumen.json')}
${cell('N02','Instrumentación Android de plantilla',instrumentation.executed,instrumentation.passed,instrumentation.failed,0,instrumentation.state,'android/instrumentacion-cierre.json')}
${cell('N03','APK y flujos dentro del WebView Android',native.executed,native.passed,native.failed,0,native.state,nativeFile)}
${cell('B01','Compilación web de producción','—','—','—','—',commandState(web),web.file)}
${cell('B02','Sincronización Capacitor Android','—','—','—','—',commandState(sync),sync.file)}
${cell('B03','Compilación Android debug real','—','—','—','—',commandState(assemble),assemble.file)}
${cell('B04','Lint Android','—','—','—','—',commandState(lintRun),'android/lint/final/resumen.json')}
${cell('S01','Lectura del catálogo RLS/RPC local','—','—','—','—',read('seguridad/verificacion-catalogo.json').passed?'APROBADO':'FALLIDO','seguridad/verificacion-catalogo.json')}
${cell('S02','npm audit de la raíz','—','—','—','—',audit.metadata.vulnerabilities.total?'FALLIDO: avisos pendientes':'APROBADO','seguridad/npm-raiz-after.json')}
${cell('S03','npm audit de functions','—','—','—','—',functions.metadata.vulnerabilities.total?'FALLIDO':'APROBADO','seguridad/npm-functions-after.json')}
${cell('S04','npm audit del proyecto auxiliar','—','—','—','—',aux.metadata.vulnerabilities.total?'FALLIDO':'APROBADO','seguridad/npm-auxiliar-after.json')}

## 4. Pruebas unitarias, contratos e integración

Jest registró **${summary.jest.passed}/${summary.jest.executed}** casos aprobados en **${summary.jest.suites} suites**, ${summary.jest.failed} fallidos y ${summary.jest.skipped} omitidos. Duración del runner ${summary.jest.seconds.toFixed(3)} s; la duración completa del proceso está en su .meta.json. Cobertura: líneas ${coverage.lines.pct}%, sentencias ${coverage.statements.pct}%, funciones ${coverage.functions.pct}% y ramas ${coverage.branches.pct}%. Es cobertura de las fuentes instrumentadas; no representa porcentaje de requisitos validados. ${ref('unitarias/cobertura-push-cierre/coverage-summary.json')}.

Las suites de dominio/aplicación, repositorios, componentes y contratos de Jest usan mocks o repositorios en memoria según su implementación; no se atribuye persistencia PostgreSQL a esas llamadas. Los seis casos Node de dependencias ejecutan Underscore, JSONPath, BFJ y Express reales, incluyendo un servidor HTTP efímero en loopback, sin Supabase. Los flujos nativos usan Auth/REST y consulta PostgreSQL local real; no sustituyen las integraciones funcionales G01–G18 del expediente anterior.

Se reprodujeron dos desbordamientos de pila con Underscore 1.13.6 y un TypeError de QS 6.14.3 con arrays comma que contienen null/undefined. Tras fijar Underscore 1.13.8 dentro de JSONPath y QS 6.16.2 dentro de Express, los seis casos finalizaron aprobados. Se conserva el ciclo fallido y el posterior: ${ref('seguridad/compatibilidad-underscore-rojo.stdout.log')}, ${ref('seguridad/compatibilidad-qs-rojo.stdout.log')}, ${ref(compatibility.file)}. Los parches de dependencias no alteraron lógica del producto. Además, la ejecución Android reprodujo un cierre fatal de FirebaseApp en unregister() al salir sin registro push previo (android/crash-logout-inicial.stdout.log y android/autenticacion-corregida.json: tres comprobaciones aprobadas y una fallida). Se corrigió push.js para cancelar solo solicitudes aceptadas por el puente, esperar solicitudes pendientes, respetar una sesión nueva y permitir reintentar un rechazo del puente. Los nueve casos mock de push.lifecycle.test.js forman parte del total Jest; no prueban obtención de token ni entrega FCM. Se conservan el ciclo rojo y las correcciones del fixture de permisos/esperas en unitarias/. El primer borrador del fixture se interrumpió sin conteo válido; el ciclo completo posterior sí produjo JSON. La aceptación de register() no implica que Firebase haya completado getToken(). Referencias primarias: [CVE-2026-27601](https://github.com/advisories/GHSA-qpx9-hpmf-5gmw), [CVE-2026-8723](https://github.com/advisories/GHSA-q8mj-m7cp-5q26), [cambios QS 6.16.2](https://github.com/ljharb/qs/blob/v6.16.2/CHANGELOG.md).

## 5. Playwright y Android

No se repitió la matriz Playwright de escritorio de 249 instancias en esta etapa. Se utilizó Playwright AndroidWebView para controlar el WebView real de com.riovoley.app en el emulador descartable API36. El resultado N03 comprende **${native.executed} verificaciones, ${native.passed} aprobadas y ${native.failed} fallidas**; ${native.notExecuted} de las ${native.planned} planificadas quedaron no ejecutadas. El JSON enumera cada verificación: identidad del APK instalado, inicio por los tres roles, persistencia tras recarga, denegación por rol, cierre de sesión y recompensa diaria.

La comprobación diaria consulta login_rewards y xp_ledger después del segundo ingreso del atleta y exige un único movimiento de 8 XP para la fecha del servidor. Las cuentas son sintéticas; no hay mocks de Auth/REST/PG. Capturas: android/${nativeLabel}-admin.png, android/${nativeLabel}-trainer.png y android/${nativeLabel}-student.png. La huella instalada se compara con la del APK inspeccionado antes de iniciar los flujos. ${ref(nativeFile)}.

Se ejecutaron tareas nativas y JUnit con --rerun-tasks y se recompiló el APK tras actualizar los assets web. El último comando de Gradle finalizó con código ${assemble.exitCode}, duración ${assemble.durationSeconds} s. El APK de depuración tiene **${apk.bytes} bytes**, SHA-256 **${apk.sha256}**; permanece exclusivamente en runtime privado. La inspección también compara push.js de los mapas de fuentes empaquetados con el archivo actual. Se publican metadatos e inspección de todos sus ${apk.checkedMembers} miembros ZIP; coincidencias prohibidas: ${apk.forbiddenMatches.length}. ${ref('android/apk-privado-inspeccion-cierre.json')}, ${ref('android/apk-firma-cierre.stdout.log')}, ${ref('android/apk-badging-cierre.stdout.log')}.

El paquete contiene únicamente claves anon/PII del entorno local para esta prueba y por ello no se distribuye. La copia privada habilita mixed content y HTTP solo al loopback, conectado por adb reverse. Esa configuración no se incorpora a android/ ni valida TLS institucional. [La documentación de Capacitor limita estas opciones al desarrollo](https://capacitorjs.com/docs/config). Se desactivó OTA y se fijaron sus URLs a un puerto loopback cerrado; se denegó el permiso de notificaciones antes del login. No se verificó FCM, Resend, OTA externo ni dispositivo físico. El arnés retira el túnel y sus flags al finalizar; los errores de limpieza se registran de forma independiente.

Las pruebas JUnit e instrumentada son verificaciones de plantilla (aritmética y applicationId) con denominadores separados; no equivalen a pruebas de los módulos de negocio. Lint: **${lint.errors} errores y ${lint.warnings} advertencias**; desglose en ${ref('android/lint/final/resumen.json')}.

## 6. Compilación web

react-scripts/scripts/build.js produjo el bundle de producción con variables locales, código ${web.exitCode}, ${web.durationSeconds} s, en la copia privada project/build-safe; Capacitor lo copió a assets/public. Se conservaron los registros íntegros: ${ref(web.file.replace('.meta.json','.stdout.log'))}, ${ref(web.file.replace('.meta.json','.stderr.log'))}. El comando usa CI=false como el script npm del repositorio; las advertencias no se confunden con errores. El build no prueba todas las funcionalidades.

## 7. Seguridad, incidencias y pendientes

La lectura actual confirma RLS en gamification.xp_ledger, login_rewards, currency_wallets y currency_ledger, además de comprobar privilegios concretos de RPC de pagos. Se inventariaron ${read('seguridad/politicas-finales.json').length} políticas; su existencia no demuestra por sí sola que todas sean correctas. No se ejecutaron cambios de esquema ni permisos institucionales.

npm audit pasó de ${before.metadata.vulnerabilities.total} a **${audit.metadata.vulnerabilities.total} dependencias señaladas**: ${audit.metadata.vulnerabilities.high} altas, ${audit.metadata.vulnerabilities.moderate} moderadas, ${audit.metadata.vulnerabilities.low} bajas y ${audit.metadata.vulnerabilities.critical} críticas. Son paquetes marcados por npm, no una suma de CVE únicos ni una demostración de explotación. functions y el árbol auxiliar registran ${functions.metadata.vulnerabilities.total} y ${aux.metadata.vulnerabilities.total}, respectivamente, sobre sus propios denominadores publicados en los JSON. No se utilizó --force. Quedan avisos de la cadena CRA/Jest/SVGO/PostCSS/Workbox y servidor de desarrollo; se requiere evaluar actualizaciones de herramientas incompatibles con las versiones fijadas, sin sustituir react-scripts por 0.0.0.

El backend estaba detenido y luego en recuperación al inicio; se continuó tras verificar su identidad. La falta de memoria obligó a detener temporalmente el emulador. Un segundo stage terminó con código 1 al intentar reutilizar un nombre de evidencia; build y sync habían terminado con código 0. Se corrigió la generación del nombre y el siguiente stage concluyó correctamente. Se conserva ${ref('android/incidencias-entorno.json')}. El primer control de AVD quedó bloqueado antes de ejecutar casos por el doble retorno de carro de la salida ADB en Windows; se normalizó el final de línea sin cambiar el nombre permitido y se conservó el intento (android/autenticacion-final.json). El primer lint detectó la ausencia de includeSubdomains en el perfil de red debug privado; se conservó el informe inicial, se añadió includeSubdomains=false y se repitieron compilación y lint sin suprimir la regla (android/correccion-lint-local.json). El ciclo del guard ADB también se conserva en android/entorno-adb-rojo.stdout.log y android/entorno-adb-verde.stdout.log.

Pendientes que afectan las conclusiones: autorización y aplicación institucional coordinada de SQL/Edge/clientes; ${audit.metadata.vulnerabilities.total} dependencias señaladas; proveedor externo de correo y push; dispositivo físico y matriz nativa ampliada; clasificación deportiva en otras categorías/métricas; recuperación distribuida ante fallo parcial de borrado. No se declara una auditoría de penetración completa ni se infieren usabilidad, motivación, USE o UES-SF.

## 8. Evidencias e integridad

${ref('RESUMEN_FINAL.json')} contiene cifras derivadas de los registros. ${ref('MATRIZ_VERIFICACIONES_TESIS.md')} relaciona la Tabla4-6; ${ref('RESULTADOS_PARA_TESIS_4_5.md')} es una propuesta de redacción, sin modificar el documento de tesis. El cierre conserva inventario SHA-256, privacidad e integridad. No hay APK, contraseñas, tokens ni datos institucionales en la entrega pública.
`);
const predicates=[t=>t.file.endsWith('/createGamificationUseCases.test.js'),t=>t.file.endsWith('/createGamificationService.test.js'),t=>t.file.includes('/gamification/')&&/identit|identidad|avatar|nickname|title|título|portrait/i.test(t.title),t=>t.file.includes('/gamification/')&&/wallet|coin|moneda|currency|saldo/i.test(t.title),t=>t.file.includes('/gamification/')&&/buy|purchase|cosmetic|equip|shop|tienda|compra/i.test(t.title),t=>t.file.includes('/attendance/'),t=>t.file.includes('/payments/')];
const names=['Pruebas del caso de uso de gamificación','Pruebas del servicio público de gamificación','Pruebas de identidad del atleta','Pruebas de wallet y monedas','Pruebas de tienda cosmética','Pruebas de asistencia','Pruebas de pagos'];
const traces=names.map((category,i)=>({category,cases:cases.filter(predicates[i])}));save('trazabilidad-detallada.json',[...traces,{category:'Compilación del proyecto',cases:[],evidence:[web.file,assemble.file]}]);
save('MATRIZ_VERIFICACIONES_TESIS.md',`# Matriz para la Tabla4-6

Base ${context.commit}; ejecución ${context.createdAt}. Los subconjuntos pueden solaparse y no se suman entre categorías. Inventario exacto: ${ref('trazabilidad-detallada.json')}.

| Categoría | Archivos relacionados | Casos ejecutados/aprobados/fallidos | Tipo y dependencias | Limitaciones | Evidencia |
|---|---|---:|---|---|---|
${traces.map((t,i)=>`| ${i+1}. ${t.category} | ${[...new Set(t.cases.map(x=>x.file))].map(x=>'\u0060'+x+'\u0060').join('<br>')} | ${t.cases.length}/${t.cases.filter(x=>x.status==='passed').length}/${t.cases.filter(x=>x.status==='failed').length} | Jest; mocks o repositorios en memoria | No demuestra persistencia PostgreSQL ni cobertura total del módulo | ${ref('unitarias/jest-push-cierre.json')}, ${ref('trazabilidad-detallada.json')} |`).join('\n')}
| 8. Compilación del proyecto | package.json; capacitor.config.json; android/; scripts/audit/android/ | Sin denominador de casos | Compilación real web y nativa, sincronización y firma debug | APK local autenticado privado; no distribución ni prueba total del producto | ${ref(web.file)}, ${ref(assemble.file)}, ${ref('android/apk-privado-inspeccion-cierre.json')} |

## Verificaciones complementarias

- Playwright de escritorio: no ejecutado nuevamente en esta etapa; 249 instancias se conservan como antecedente en ${ref(previous+'/INFORME_VERIFICACION_TECNICA.md')}.
- Android WebView real: ${native.executed} verificaciones, ${native.passed} aprobadas y ${native.failed} fallidas; Auth/REST/PostgreSQL locales reales. Login de atleta y recompensa diaria complementan gamificación/identidad, sin sustituir las pruebas específicas de wallet, tienda, pagos o asistencias. ${ref(nativeFile)}.
- Android: JUnit ${junitCount.executed} e instrumentación ${instrumentation.executed}, de plantilla y con denominadores separados. ${ref('android/junit-cierre/resumen.json')}, ${ref('android/instrumentacion-cierre.json')}.
- Seguridad: catálogo local leído, RLS comprobado en cuatro tablas y privilegios RPC concretos; npm mantiene ${audit.metadata.vulnerabilities.total} paquetes señalados en la raíz. ${ref('seguridad/verificacion-catalogo.json')}, ${ref('seguridad/npm-raiz-after.json')}.
- Compatibilidad de dependencias: ${compatibility.executed} casos Node con paquetes reales, incluidos HTTP Express y regresiones CVE; no son integraciones de módulos deportivos con PostgreSQL. ${ref(compatibility.file)}.
`);
save('RESULTADOS_PARA_TESIS_4_5.md',`# Propuesta de redacción para revisión académica — apartado4.5

La verificación complementaria de RIOVOLEY, realizada el 29 de octubre de 2026 sobre el commit base ${context.commit.slice(0,7)} y los cambios identificados en el inventario de fuentes, registró ${summary.jest.passed} casos aprobados de ${summary.jest.executed} ejecutados mediante Jest y Testing Library, distribuidos en ${summary.jest.suites} suites, con ${summary.jest.failed} fallidos y ${summary.jest.skipped} omitidos. La cobertura de líneas de las fuentes instrumentadas fue de ${coverage.lines.pct}%. Estas pruebas incluyen componentes, lógica de aplicación y contratos con dependencias simuladas o repositorios en memoria; sus resultados no se interpretan como comprobación de persistencia en PostgreSQL. Las cifras se sustentan en ${ref('unitarias/jest-push-cierre.json')} y ${ref('unitarias/cobertura-push-cierre/coverage-summary.json')}.

Se reprodujeron defectos de desbordamiento de pila en Underscore y de serialización en QS. Después de aplicar versiones compatibles, se aprobaron ${compatibility.passed} de ${compatibility.executed} verificaciones Node que también comprueban JSONPath, BFJ y peticiones HTTP a Express real en loopback (${ref(compatibility.file)}). El análisis de dependencias de la raíz pasó de ${before.metadata.vulnerabilities.total} a ${audit.metadata.vulnerabilities.total} paquetes señalados, incluidos ${audit.metadata.vulnerabilities.high} de severidad alta; por tanto, permanecen limitaciones de seguridad en la cadena de herramientas. Los árboles functions y auxiliar no presentaron avisos en sus respectivos análisis (${ref('seguridad/npm-raiz-after.json')}, ${ref('seguridad/npm-functions-after.json')}, ${ref('seguridad/npm-auxiliar-after.json')}). La lectura del catálogo local confirmó RLS en xp_ledger y login_rewards, entre otras tablas; ello no acredita el estado institucional ni sustituye una auditoría de penetración (${ref('seguridad/verificacion-catalogo.json')}).

La primera ejecución funcional nativa falló al cerrar sesión porque se invocaba unregister() sin un registro previo de notificaciones, lo que produjo un cierre fatal en el perfil local sin Firebase configurado. Se corrigió el ciclo de llamadas del puente nativo y se añadieron nueve regresiones con mocks, incluidas en el total Jest; estas no demuestran entrega FCM. El fallo original se conserva en ${ref('android/crash-logout-inicial.stdout.log')} y ${ref('android/autenticacion-corregida.json')}.

La compilación web y la compilación Android debug finalizaron con códigos ${web.exitCode} y ${assemble.exitCode}, respectivamente. En el WebView real del APK instalado en un emulador API36 se ejecutaron ${native.executed} verificaciones, con ${native.passed} aprobadas y ${native.failed} fallidas, utilizando Supabase Auth, REST y PostgreSQL locales reales. Se comprobaron el acceso por rol, la conservación de sesiones, las restricciones y el registro de una única recompensa diaria de 8 XP tras ingresos repetidos del atleta, según los casos y consultas documentados en ${ref(nativeFile)}. El paquete se conservó de forma privada y su huella se comparó con la instalación ejecutada (${ref('android/apk-privado-inspeccion-cierre.json')}). La prueba JUnit y la prueba instrumentada de plantilla se contabilizan por separado y no representan cobertura de los procesos de negocio. No se repitió en esta etapa la matriz Playwright de escritorio del expediente anterior; tampoco se verificaron un dispositivo físico, los proveedores externos ni la aplicación institucional de los cambios. Estos resultados delimitan la verificación técnica y no permiten inferir usabilidad, motivación ni resultados USE o UES-SF. ${ref(web.file)}, ${ref(assemble.file)}.
`);
console.log(JSON.stringify({jest:summary.jest,native:{executed:native.executed,passed:native.passed,failed:native.failed},dependencies:summary.dependencies.after}));
