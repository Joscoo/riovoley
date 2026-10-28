const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const c=require('./context.cjs');
const read=file=>JSON.parse(fs.readFileSync(path.join(c.base,file),'utf8'));
const ref=file=>`[${file}](${file})`;
function latest(prefix) {
  const items=fs.readdirSync(path.join(c.base,'android')).filter(name=>name.startsWith(prefix)&&name.endsWith('.meta.json')).map(name=>({file:'android/'+name,...read('android/'+name)}));
  return items.sort((a,b)=>a.end.localeCompare(b.end)).at(-1);
}
const assemble=latest('gradle-assemble'),lintRun=latest('gradle-lint'),sync=latest('capacitor-sync'),sign=latest('apk-firma'),badging=latest('apk-badging');
for(const run of [assemble,lintRun,sync,sign,badging]) assert.equal(run.exitCode,0);
const artifact=read('android/artefacto-final.json'),lint=read('android/lint/final/resumen.json'),unit=read('android/unitarias-final/resumen.json'),devices=read('android/dispositivos-final.json'),config=read('android/configuracion-final.json');
assert.equal(lint.errors,0);assert.equal(read('android/privacidad-previa-verificada.json').unresolved.length,0);
assert.equal(c.hash(path.join(c.base,artifact.file)),artifact.sha256);
assert.equal(c.hash(path.join(c.work,'project/android/app/build/outputs/apk/debug/app-debug.apk')),artifact.sha256);
const compileFiles=fs.readdirSync(path.join(c.base,'compilacion-web')).filter(f=>f.endsWith('.meta.json')).map(f=>({file:'compilacion-web/'+f,...read('compilacion-web/'+f)})).sort((a,b)=>a.end.localeCompare(b.end));
const web=compileFiles.at(-1);assert.equal(web.exitCode,0);assert.ok(web.end<sync.start);assert.ok(sync.end<assemble.start);
const attempts=fs.readdirSync(path.join(c.base,'android')).filter(f=>f.endsWith('.meta.json')).map(f=>({file:'android/'+f,...read('android/'+f)})).sort((a,b)=>a.start.localeCompare(b.start));
c.write('resumen-android.json',{generatedAt:new Date().toISOString(),commit:'c71f55e5bc59c528a002c4347fb1664794cb277e',nativeBuild:{state:'APROBADO',exitCode:assemble.exitCode,durationSeconds:assemble.durationSeconds,metadata:assemble.file},capacitorSync:{state:'APROBADO',plugins:config.nativeModules.filter(module=>module.name!=='@capacitor/android').length,metadata:sync.file},artifact,lint:{...lint,exitCode:lintRun.exitCode,metadata:lintRun.file},junit:unit,devices,profile:'Copia aislada, endpoint loopback, placeholder no válido, sin PII key ni google-services/keystore institucional, OTA desactivado. Compilación/empaquetado; no prueba funcional en Android.'});
c.write('android/retencion-intermedios.json',{firstArtifactSha256:read('android/artefacto.json').sha256,firstArtifactState:'Reservado en runtime ignorado antes de la entrega; no forma parte de los APK publicados en este expediente.',reason:'La revisión detectó una clave anon institucional en el primer APK porque el filtro del arnés retiró el override CRA. Se corrigió el filtro, se repitieron build web/sync/assemble y se verificó el APK final. La descripción inicial de configuración indicaba intención de aislamiento y no acredita la privacidad del primer APK.',finalArtifact:artifact.file,noApplicationExecution:true});
const table=[
  ['AND-01','Sincronización Capacitor','—','—','—','—','APROBADO',sync.file],
  ['AND-02','Compilación nativa debug (comando Gradle)','—','—','—','—','APROBADO',assemble.file],
  ['AND-03','JUnit nativo: plantilla aritmética',1,1,0,0,'APROBADO','android/unitarias-final/resumen.json'],
  ['AND-04','Android Lint (análisis estático)','—','—','—','—','APROBADO con '+lint.warnings+' advertencias','android/lint/final/resumen.json'],
  ['AND-05','Verificación de firma APK (un comando)','—','—','—','—','APROBADO',sign.file],
  ['AND-06','Inspección SDK/applicationId (un comando)','—','—','—','—','APROBADO',badging.file],
  ['AND-07','Prueba instrumentada en Android',0,0,0,0,'NO EJECUTADO','android/dispositivos-final.json'],
  ['HAR-01','Regresión del filtro de variables del arnés',1,1,0,0,'APROBADO','android/guardas-entorno.stdout.log'],
  ['HAR-02','Regresiones del escáner APK',3,3,0,0,'APROBADO','android/guardas-privacidad.stderr.log'],
  ['PRIV-01','Escaneo previo del APK privado (un control)','—','—','—','—','APROBADO','android/privacidad-previa-verificada.json'],
].map(r=>`| ${r.slice(0,-1).join(' | ')} | ${ref(r.at(-1))} |`).join('\n');
const lintTable=lint.issues.map(i=>`| ${i.id} | ${i.severity} | ${i.count} |`).join('\n');
const attemptsTable=attempts.map(a=>`| ${a.file.replace('android/','').replace('.meta.json','')} | ${a.exitCode} | ${a.durationSeconds} | ${ref(a.file)} |`).join('\n');
const previous=path.relative(c.base,path.join(c.root,'docs/tesis/evidencias/e2e-aislado/20261028-101418-correcciones-c71f55e')).replaceAll('\\','/');
const source=file=>ref(path.relative(c.base,path.join(c.root,file)).replaceAll('\\','/'));
c.write('INFORME_VERIFICACION_TECNICA.md',`# Verificación técnica complementaria: compilación Android de RIOVOLEY

## Identificación y alcance

Proyecto RIOVOLEY, commit base **c71f55e5bc59c528a002c4347fb1664794cb277e**, con los cambios locales de auditoría/E2E conservados. Fecha: **28/10/2026**, zona America/Guayaquil (UTC−05); timestamps de comandos en UTC. Se verificó una **compilación nativa Android real** del contenedor Capacitor y sus siete plugins, además de sincronización, empaquetado, firma debug, JUnit disponible y Android Lint. No se confunde el build CRA con la compilación Java/Kotlin, DEX, recursos y APK realizada por Gradle.

Este expediente complementa [las correcciones E2E](${previous}/INFORME_VERIFICACION_TECNICA.md). Los resultados Jest/Playwright de ese expediente no se reejecutaron ni se vuelven a contar aquí. Los expedientes anteriores se conservan, incluida su clasificación Android NO EJECUTADO válida para sus respectivas ejecuciones.

## Entorno y requisitos resueltos

Windows 11 amd64, Node 24.18.0 y npm 11.16.0 del proyecto. Inicialmente había Java 25 y no estaban disponibles SDK/ADB/sdkmanager. Se descargaron y verificaron mediante SHA-256 **Temurin JDK 21.0.12.1+1** y Android Command-Line Tools 15859902 (sdkmanager 22.0), desde fuentes oficiales. Se instalaron exclusivamente en runtime local: **SDK Platform 36 rev.2, Build-Tools 35.0.0 y Platform-Tools 37.0.1**. El wrapper existente utiliza **Gradle 8.14.3**, con **Android Gradle Plugin 8.13.0**, source/target Java21, minSdk24 y target/compileSdk36. No se modificaron versiones del proyecto, PATH global o Java25; JAVA_HOME/ANDROID_HOME/ANDROID_SDK_ROOT/ANDROID_USER_HOME/GRADLE_USER_HOME se fijaron solo en los procesos de auditoría. El SDK aceptó las licencias necesarias durante la instalación local.

Evidencia: ${ref('android/descarga-jdk-origen.json')}, ${ref('android/descarga-jdk-sha256.json')}, ${ref('android/descarga-sdk-sha256.json')}, ${ref('android/sdk-instalado.stdout.log')}, ${ref('android/gradle-version.stdout.log')}, ${ref('android/java-global-conservado.stderr.log')}. Compatibilidad documentada por [Android AGP8.13](https://developer.android.com/build/releases/agp-8-13-0-release-notes), [Gradle/Java](https://docs.gradle.org/current/userguide/compatibility.html), [Capacitor8](https://capacitorjs.com/docs/getting-started/environment-setup) y [archivos Temurin](https://adoptium.net/installation/archives). Descarga de herramientas: [Android SDK](https://developer.android.com/studio#command-line-tools-only).

## Perfil de compilación y preservación

Se compilaron copias de android/ y de los módulos nativos instalados, con la misma applicationId, versiones SDK y fuentes. ${source('scripts/audit/android/README.md')} explica el procedimiento. La copia excluye keystore de publicación, google-services.json, local.properties y salidas/cachés originales. Capacitor sync genera sus archivos en esa copia; los módulos originales de node_modules no reciben salidas de compilación. Se comprobaron **962 archivos versionados sin modificaciones** respecto al inicio (${ref('android/integridad-fuentes-final.json')}).

El perfil web final utiliza exclusivamente endpoint loopback, una clave placeholder **sin validez** y PII key vacía; el APK no está configurado para operar con datos institucionales. Las actualizaciones OTA se desactivan en la configuración copiada. No se inicia la aplicación ni se realizan logins o escrituras de backend. La omisión de google-services.json significa que no se acredita registro/entrega FCM; tampoco se valida OTA o Auth nativo. La configuración se describe en ${ref('android/configuracion-final.json')}.

## Metodología y comandos

1. Descargar JDK/SDK y comprobar hashes: download.cjs jdk/sdk.
2. Configurar el SDK local: setup.cjs; sdkmanager instala platform-tools, platforms;android-36 y build-tools;35.0.0.
3. Ejecutar secuencialmente stage.cjs final: build CRA con configuración explícita y cap sync android. La última compilación web duró **${web.durationSeconds} s** y la sincronización **${sync.durationSeconds} s**. Se detectaron siete plugins Android.
4. Ejecutar el wrapper sin actualizaciones: **gradlew.bat :app:assembleDebug :app:testDebugUnitTest --no-daemon --console=plain --stacktrace --max-workers=2**. La última pasada posterior a la sincronización final terminó con **salida 0 en ${assemble.durationSeconds} s**. La primera compilación desde cachés vacías también aprobó y ejecutó 212 tareas Gradle; esas tareas **no son casos de prueba**.
5. Ejecutar **gradlew.bat :app:lintDebug --no-daemon --console=plain --stacktrace --max-workers=2 --rerun-tasks**; la pasada final terminó con salida 0 en **${lintRun.durationSeconds} s**.
6. Comprobar aapt dump badging, apksigner verify --verbose --print-certs, XML JUnit y adb devices -l. Revisar el APK descomprimido, incluidos mapas/binaries y codificaciones UTF8/UTF16, antes de entregar el artefacto.

Scripts reproducibles: ${source('scripts/audit/android/build.cjs')}, ${source('scripts/audit/android/inspect.cjs')}, ${source('scripts/audit/android/privacy.py')}. Cada comando instrumentado conserva stdout, stderr, argumentos, directorio, fechas, duración y salida. Los builds/sync se ejecutaron sobre copias privadas, sin publicar ni distribuir paquetes.

## Resultados reales

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
${table}

El único caso JUnit del proyecto es **addition_isCorrect**, que comprueba 2+2=4. Fue ejecutado satisfactoriamente durante esta auditoría; Gradle pudo reutilizarlo en pasadas posteriores porque sus fuentes no cambiaron. No constituye cobertura funcional de RIOVOLEY ni se suma a las pruebas Jest/E2E previas. El test instrumentado no se ejecutó: ADB detectó **${devices.count} dispositivos** en la consulta final. Su expectativa de plantilla usa com.getcapacitor.app, distinta de com.riovoley.app; es una incidencia estática pendiente para cuando se prepare su ejecución, no un resultado fallido observado en dispositivo. No se modificó esa expectativa ni se declaró aprobada.

## APK generado y comprobado

Artefacto final: ${ref(artifact.file)}; **${artifact.bytes} bytes (${(artifact.bytes/1024/1024).toFixed(2)} MiB)**. SHA-256: **${artifact.sha256}** (${ref('android/artefacto-final.json')}). aapt confirmó applicationId **com.riovoley.app**, versión **1.0 / code1**, mínimo **24**, objetivo **36** y compilación **36**. apksigner verificó una firma debug válida con esquema v2, RSA2048; no se utilizó la clave de publicación. La verificación de firma demuestra integridad del paquete firmado, no seguridad global del sistema. El APK se conserva como evidencia de compilación; no se instaló ni publicó.

## Lint, advertencias y limitaciones

Android Lint final: **${lint.errors} errores y ${lint.warnings} advertencias**. Informes originales: ${ref('android/lint/final/lint-results-debug.html')}, ${ref('android/lint/final/lint-results-debug.xml')}, ${ref('android/lint/final/resumen.json')}.

| Identificador | Severidad | Cantidad |
|---|---|---:|
${lintTable}

Las advertencias no se ocultaron ni se cambiaron umbrales/baselines para aprobar. La compilación también informó usos deprecated/unchecked de dependencias, una advertencia Kotlin en Filesystem, uso de flatDir, diferencias de versión XML del SDK, una biblioteca nativa empaquetada sin strip y características Gradle obsoletas para una futura versión9. Esas advertencias se conservan en los logs; no impidieron generar el APK. No se efectuaron actualizaciones de dependencias ni cambios de lógica de producción.

## Incidencias durante la preparación

- El primer lanzamiento de sdkmanager falló por resolución de PATH/cmd en el arnés; el siguiente intento de instalación usó comillas interpretadas como parte del nombre del paquete. Se corrigieron ambos en el arnés, conservando sus salidas.
- Lint detectó **PropertyEscape** en local.properties generado para la copia Windows. Se escapó el separador de unidad. Una pasada posterior conservó un informe incremental anterior; al forzar --rerun-tasks el análisis final acreditó cero errores. El archivo local.properties del proyecto original no se modificó. ${ref('android/lint/inicial/resumen.json')} y ${ref('android/lint/correccion-entorno.json')} conservan la incidencia.
- La primera revisión de privacidad detectó una clave anon institucional dentro de un APK intermedio: un filtro del arnés retiraba el override REACT_APP y permitía cargar .env. El artefacto quedó reservado en runtime ignorado **antes de la entrega**, sin editar su firma; no se conserva dentro de los APK del expediente público. Se corrigió el filtro, se añadieron regresiones y se repitieron build web, sync y assemble. Un intento de assemble coincidió con la reconstrucción web y se considera intermedio; la pasada final verifica orden temporal web → sync → Gradle y es la empleada en los resultados finales. La descripción inicial de configuración reflejaba el perfil previsto y no acredita la privacidad de aquel primer APK. ${ref('PRIVACIDAD_INICIAL.json')}, ${ref('android/retencion-intermedios.json')} y ${ref('android/privacidad-previa-verificada.json')} documentan el antes/después sin publicar valores de claves.
- La revisión independiente amplió el escaneo a **todos** los miembros ZIP del APK (incluidos .map y valores UTF16) y exigió validación del archivo privado antes de exportarlo. El APK final pasó ese control y coincide byte a byte con el archivo validado. La revisión no implica una prueba de penetración.

## Registro de intentos

No se suman preparaciones, intentos repetidos ni tareas Gradle a los casos JUnit. El resultado final se identifica mediante el orden temporal y los metadatos citados; se conservan los fallos de preparación y Lint.

| Comando/etiqueta | Salida | Duración (s) | Evidencia |
|---|---:|---:|---|
${attemptsTable}

## Pendientes y cierre

Pendientes: ejecución en emulador/dispositivo autorizado, corrección y ejecución del test instrumentado de plantilla, pruebas funcionales nativas de permisos/FCM/OTA/conectividad, compilación release con firma institucional si se solicita y tratamiento de las 29 advertencias. Este expediente no cambia los pendientes de seguridad/dependencias ni acceso anónimo señalados en las auditorías anteriores.

Revisión independiente: ${ref('REVISION_INDEPENDIENTE.md')}. Privacidad/integridad: ${ref('PRIVACIDAD.json')}, ${ref('INTEGRIDAD.json')}, ${ref('MANIFIESTO_SHA256.json')}. Trazabilidad para la tesis: ${ref('MATRIZ_VERIFICACIONES_TESIS.md')}. Propuesta académica: ${ref('RESULTADOS_PARA_TESIS_4_5.md')}. No se modificó el documento de tesis ni se realizaron push, despliegues o publicaciones.
`);
c.write('MATRIZ_VERIFICACIONES_TESIS.md',`# Matriz complementaria: evidencia Android para la Tabla 4-6

Proyecto RIOVOLEY, commit base c71f55e, 28/10/2026. Esta etapa incorpora compilación nativa Android; no reejecuta los denominadores Jest/Playwright anteriores.

| Categoría | Archivos relacionados | Casos ejecutados en esta etapa | Resultado real | Tipo / mocks o servicios | Limitaciones | Evidencia |
|---|---|---|---|---|---|---|
| 1. Caso de uso de gamificación | src/features/gamification/ | No reejecutados | Conservar resultado del expediente E2E/Jest anterior | No hay prueba de negocio Android nueva | Compilar no acredita comportamiento del caso de uso | ${ref(previous+'/MATRIZ_VERIFICACIONES_TESIS.md')} |
| 2. Servicio público de gamificación | src/features/gamification/ | No reejecutados | Conservar evidencia anterior | Sin integración de backend en este APK | Endpoint loopback/placeholder | ${ref(previous+'/MATRIZ_VERIFICACIONES_TESIS.md')} |
| 3. Identidad del atleta | src/features/gamification/ | No reejecutados | Sin resultado funcional nativo nuevo | Empaquetado de fuentes | Sin edición de avatar/títulos en Android | ${ref('INFORME_VERIFICACION_TECNICA.md')} |
| 4. Wallet y monedas | src/features/gamification/ | No reejecutados | Sin transacciones nativas verificadas | Sin backend institucional | Build no demuestra saldos | ${ref('INFORME_VERIFICACION_TECNICA.md')} |
| 5. Tienda cosmética | src/features/gamification/ | No reejecutados | Sin compras/equipamiento nativo ejecutado | Sin mocks de transacción añadidos | Mantener alcance anterior | ${ref('INFORME_VERIFICACION_TECNICA.md')} |
| 6. Asistencia | src/features/attendance/ | No reejecutados | El flujo local E2E anterior se conserva | No se registra asistencia con este APK | Sin dispositivo ni login nativo | ${ref(previous+'/MATRIZ_VERIFICACIONES_TESIS.md')} |
| 7. Pagos | src/features/payments/ | No reejecutados | El flujo local E2E anterior se conserva | No se registran pagos con este APK | Sin dispositivo ni login nativo | ${ref(previous+'/MATRIZ_VERIFICACIONES_TESIS.md')} |
| 8. Compilación del proyecto | android/, capacitor.config.json, scripts/audit/android/ | Comandos de build/sync, sin denominador de casos | Web, sync7plugins, assembleDebug y firma: salida0 | Compiladores y herramientas Android reales, sin mocks | Perfil aislado; no release ni ejecución en Android | ${ref(assemble.file)}, ${ref('android/artefacto-final.json')} |

## Complementos independientes

- JUnit Android: **1/1**, plantilla 2+2=4; ${ref('android/unitarias-final/resumen.json')}. No se agrega a Jest ni se interpreta como prueba funcional.
- Android Lint: **0 errores y ${lint.warnings} advertencias**, no casos de prueba; ${ref('android/lint/final/resumen.json')}.
- Guardas del arnés: **1** caso Node sobre variables y **3** casos Python sobre privacidad; herramientas distintas con denominadores separados.
- ADB: **${devices.count} dispositivos**; prueba instrumentada y ejecución funcional **NO EJECUTADAS**, ${ref('android/dispositivos-final.json')}.
- APK: applicationId com.riovoley.app, min24/target36, debug firmado; ${ref('android/artefacto-final.json')}. El escaneo previo no encontró valores sensibles conocidos/JWT; no equivale a una auditoría de seguridad integral.

La matriz anterior documenta 112/112 instancias E2E originales y cuatro adicionales; estas cifras se citan como antecedente y no como nuevas ejecuciones Android. La compilación nativa satisface el requisito antes pendiente de producir un APK debug, con las limitaciones especificadas en ${ref('INFORME_VERIFICACION_TECNICA.md')}.
`);
c.write('RESULTADOS_PARA_TESIS_4_5.md',`# Propuesta académica complementaria: compilación Android

Como complemento de la verificación técnica, el 28 de octubre de 2026 se ejecutó una compilación nativa Android de RIOVOLEY mediante Capacitor y Gradle. Para superar las limitaciones del entorno inicialmente identificadas se prepararon JDK21 y Android SDK36 en una carpeta local aislada, conservando las fuentes y la configuración original del equipo. La sincronización de Capacitor reconoció siete plugins Android y finalizó correctamente. Posteriormente, el comando assembleDebug, junto con la tarea unitaria disponible, concluyó con código de salida cero; la última compilación posterior a la sincronización final duró **${String(assemble.durationSeconds).replace('.',',')} segundos** y generó un APK debug de **${artifact.bytes} bytes**, con identificador com.riovoley.app, SDK mínimo24 y objetivo36. La firma del paquete se verificó mediante apksigner y su integridad se registró mediante SHA-256 ([compilación](${assemble.file}), [sincronización](${sync.file}), [artefacto](android/artefacto-final.json)). Esta evidencia corresponde al empaquetado nativo y se distingue de la compilación web de React.

El análisis Android Lint final registró **cero errores y ${lint.warnings} advertencias**, relacionadas principalmente con iconos, recursos y versiones de dependencias; no se alteraron sus umbrales para obtener aprobación. La única prueba JUnit original ejecutada aprobó, pero corresponde a la plantilla aritmética 2+2=4 y no acredita funcionalidades del sistema ([Lint](android/lint/final/resumen.json), [JUnit](android/unitarias-final/resumen.json)). Durante la preparación se corrigieron incidencias del arnés relativas a la ruta del SDK y al aislamiento de variables. Un APK intermedio fue reservado al detectarse una clave pública institucional; el artefacto final se reconstruyó y superó la revisión de privacidad de sus miembros ZIP antes de la entrega, sin publicar credenciales ([retención de intermedios](android/retencion-intermedios.json), [privacidad previa](android/privacidad-previa-verificada.json)).

La comprobación se limitó a un perfil de empaquetado con configuración de prueba y actualizaciones OTA desactivadas en la copia; no utilizó claves institucionales de publicación ni configuración Firebase. ADB no detectó dispositivos conectados, por lo que las pruebas instrumentadas y el funcionamiento de la aplicación en Android permanecen **no ejecutados**. Tampoco se verificaron notificaciones FCM, permisos en ejecución, Auth nativo o distribución release ([dispositivos](android/dispositivos-final.json), [alcance](INFORME_VERIFICACION_TECNICA.md)). Los resultados permiten acreditar la generación verificable de un APK debug, sin atribuir validación completa de funcionalidades, seguridad, usabilidad, motivación o capacidad de interacción, ni resultados USE o UES-SF. Esta propuesta no modifica directamente el documento de tesis.
`);
console.log(JSON.stringify({reports:3,apk:artifact.file,bytes:artifact.bytes,nativeExitCode:assemble.exitCode,lintErrors:lint.errors,lintWarnings:lint.warnings}));
