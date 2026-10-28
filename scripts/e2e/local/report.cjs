const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const h=require('./harness.cjs');
const read=file=>JSON.parse(fs.readFileSync(path.join(h.evidence,file),'utf8'));
const txt=file=>fs.readFileSync(path.join(h.evidence,file),'utf8');
const ref=file=>`[${file}](${file})`;
const source=file=>`[${file}](${path.relative(h.evidence,path.join(h.root,file)).replaceAll('\\','/')})`;
const old=path.relative(h.evidence,path.join(h.root,'docs/tesis/evidencias/verificacion-tecnica/20261027-212222-c71f55e')).replaceAll('\\','/');
const stable=read('pendientes-estable/resultados.json');
const mutation=read('mutaciones-estable/resultados.json');
const initial=read('roles-escritorio/resultados.json');
function specs(s) {return(s.specs||[]).concat((s.suites||[]).flatMap(specs));}
function cases(report,group) {return report.suites.flatMap(specs).flatMap(s=>s.tests.map(t=>({group,file:s.file,title:s.title,project:t.projectName,status:t.status,error:t.results.at(-1)?.error?.message||null,durationMs:t.results.reduce((n,r)=>n+r.duration,0)})));}
const records=cases(stable,'pendientes-estable').concat(cases(mutation,'mutaciones-estable'));
assert.equal(records.length,112);assert.equal(records.filter(t=>t.status==='expected').length,95);assert.equal(records.filter(t=>t.status==='unexpected').length,17);
const rows=new Map();
for(const c of records) {
  const key=c.file+'::'+c.title;
  if(!rows.has(key)) rows.set(key,{file:c.file,title:c.title,total:0,passed:0,failed:0,skipped:0});
  const r=rows.get(key);r.total++;r[c.status==='expected'?'passed':c.status==='unexpected'?'failed':'skipped']++;
}
const inventory=read('inventario-local.json');
const persist=read('persistencia-local.json');
const groups=[['E2E-01','Smoke inicial estricto por roles, escritorio',3,3,0,0,'roles-escritorio/resultados.json'],['E2E-02','Pendientes sin mutación explícita, siete perfiles',105,95,10,0,'pendientes-estable/resultados.json'],['E2E-03','Flujo de alta/pago/asistencia, siete perfiles',7,0,7,0,'mutaciones-estable/resultados.json'],['AUTH-01','Auth local y consultas por rol',3,3,0,0,'auth-roles-reales.json'],['RLS-01','Matriz SQL local (un script; sin denominador de casos)','—','—','—','—','rls-matriz-local.meta.json'],['HAR-01','Pruebas unitarias del arnés',12,12,0,0,'arnes-final.stdout.log'],['SEED-01','Idempotencia del seed (un control de conteos)',1,1,0,0,'seed-idempotencia.json'],['XP-01','Persistencia/deduplicación de recompensa diaria (un control)',1,1,0,0,'persistencia-local.json']];
h.write('casos-e2e-detallados.json',records);
h.write('resumen-e2e-local.json',{generatedAt:new Date().toISOString(),commit:'c71f55e5bc59c528a002c4347fb1664794cb277e',executed:112,passed:95,failed:17,skipped:0,blocked:0,logicalCases:16,profiles:7,stableStats:stable.stats,mutationStats:mutation.stats,initialSmoke:initial.stats,scope:'Solo Supabase local y fixtures. Smoke inicial es subconjunto; pruebas del arnés y verificaciones API/SQL no se suman a E2E.',groups:[...rows.values()]});
const sources=['.gitignore','package.json','playwright.local.config.cjs',...fs.readdirSync(path.join(h.root,'scripts/e2e/local')).filter(f=>/\.(cjs|py|toml|md)$/.test(f)).map(f=>'scripts/e2e/local/'+f),'database/e2e/local-baseline.sql'];
h.write('fuentes-entorno.json',sources.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(h.root,file))).digest('hex')})));
const byCase=[...rows.values()].map(r=>`| ${r.file}: ${r.title} | ${r.total} | ${r.passed} | ${r.failed} | ${r.skipped} |`).join('\n');
const table=groups.map(r=>`| ${r.slice(0,6).join(' | ')} | ${typeof r[4]==='number'&&r[4]>0?'FALLIDO':'APROBADO'} | ${ref(r[6])} |`).join('\n');
const compileFiles=fs.readdirSync(h.evidence).filter(f=>f.startsWith('compilacion-')&&f.endsWith('.meta.json')).sort();
const compiles=compileFiles.map(file=>({file,...read(file)}));
const compileTable=compiles.map(c=>`| ${c.command.join(' ')} | ${c.exitCode} | ${c.durationSeconds} | ${ref(c.file)} |`).join('\n');
const newBuild=compiles.find(c=>c.file.startsWith('compilacion-web-build-'));
const report=`# Verificación técnica complementaria: E2E con Supabase local

## Identificación y alcance

RIOVOLEY, commit base **c71f55e5bc59c528a002c4347fb1664794cb277e**. Ejecución del 28/10/2026; timestamps originales en UTC y zona del equipo America/Guayaquil (UTC−05). Expediente ${path.basename(h.evidence)}. Se preparó y ejecutó un entorno descartable para las 112 instancias que estaban bloqueadas en [la auditoría inicial](${old}/INFORME_VERIFICACION_TECNICA.md). Ese expediente se conserva: esta etapa es complementaria, no reemplaza sus resultados ni reejecuta sus 387 casos Jest.

El usuario autorizó crear el entorno local. Producción se utilizó exclusivamente como fuente de metadatos mediante SELECT para reconstruir DDL. No se ejecutó login, migración, cambio de permisos ni escritura institucional. No se copiaron usuarios, atletas, pagos, asistencias, evaluaciones, objetos Storage, claves de proveedores ni cron jobs de producción. No se hizo push, deploy ni publicación. Las comprobaciones de negocio de este informe se hicieron con Supabase real local; los datos ficticios son fixtures, no repositorios simulados.

## Entorno y preparación reproducible

Windows 11, Node v24.18.0, npm 11.16.0, Docker Desktop Linux 29.7.2 y Supabase CLI fijada a 2.122.0. PostgreSQL local reportó **${inventory.postgres}**; la fuente remota de estructura reportó 17.4. Esta diferencia y las versiones de servicios locales impiden afirmar equivalencia absoluta con producción.

Proyecto local riovoley-e2e-local, API 127.0.0.1:55321, DB 55322, correo local 55324–55326 y frontend 6100. Los bindings se comprobaron en ${ref('red-local/bindings.json')}. Se preservó el otro stack local microplus, que usa los puertos 54321–54327. Docker CLI, Supabase CLI y llamadas directas fijan el named pipe local de Docker Desktop y no confían en DOCKER_HOST/DOCKER_CONTEXT externos; se comprobó la guardia introduciendo deliberadamente variables remotas inválidas (${ref('docker-endpoint-forzado.meta.json')}).

Se reconstruyeron **47 tablas de aplicación, 44 vistas, 38 funciones y 139 políticas** desde metadatos. ${source('database/e2e/local-baseline.sql')} contiene solo DDL; no hay INSERT/COPY de registros institucionales. Los esquemas administrados de Auth/Storage/Realtime se inicializan por Supabase. El bootstrap no conserva todos los posibles aspectos de producción: extensiones y servicios administrados, propietarios exactos, default privileges, comentarios, estadísticas, objetos de Storage, proveedores y jobs programados no se certifican como idénticos. La presencia de esas estructuras no acredita por sí sola todos los permisos o transacciones; se complementó con Auth, consultas y matriz SQL reales.

La primera restauración encontró una función de edad requerida por una columna generada. Se implementó y probó la recreación de esa dependencia antes de crear la tabla, con volatilidad temporal IMMUTABLE y restauración de la definición observada antes de COMMIT. Los intentos iniciales fallidos se conservan en bootstrap-esquema*.meta.json; no se alteró la lógica del producto. Durante el enlace exclusivo a loopback se preservaron los archivos de Kong mediante TAR, con sus propietarios/modos; se retuvieron los contenedores anteriores detenidos y los volúmenes. El procedimiento final está verificado en el manager.

El seed creó **10 cuentas ficticias y ocho atletas**, ocho pagos, ocho asistencias, ocho evaluaciones, horarios, comunicado y catálogos para la interfaz. La repetición del seed mantuvo los conteos (${ref('seed-idempotencia.json')}). Las contraseñas, claves locales y clave PII solo residen en .e2e-local/, ignorado por Git. No se sobrescribieron .env/.env.e2e institucionales. El build se generó en runtime con URL/key locales y clave PII propia; BUILD_PATH evita tocar build/. El launcher neutraliza REACT_APP_* heredadas y el navegador bloquea destinos externos. No se configuró envío real de correo, WhatsApp o FCM; su entrega externa **NO FUE EJECUTADA**.

Comandos operativos completos: ${source('scripts/e2e/local/README.md')}. Preparación final repetida: node scripts/e2e/local/manage.cjs setup, salida 0 (${ref('setup-final.meta.json')}). Esa repetición incluyó arranque, verificación de loopback, seed, Auth por roles e idempotencia.

## Método y comandos ejecutados

1. Inspección de Docker, CLI, puertos ocupados y dump antiguo sin filas. El dump de mayo y las migraciones parciales no se dieron por suficientes para reproducir el estado actual.
2. Captura SELECT de estructura, generación del baseline y restauración exclusiva en supabase_db_riovoley-e2e-local mediante docker exec/psql. Las consultas y el generador quedan en scripts/e2e/local; el snapshot intermedio permanece privado.
3. Auth admin local creó los fixtures. Se iniciaron sesiones reales con los tres roles, se consultaron perfiles y visibilidad de filas, y se cerraron las sesiones de comprobación.
4. Se ejecutó database/tests/rls_access_matrix.sql **solo en PostgreSQL local**, con usuarios ficticios y ROLLBACK. Salida 0. Este mismo script no se había ejecutado en producción por sus escrituras.
5. Se compilaron builds CRA con variables locales. Se sirvieron estáticamente mediante un servidor propio; reuseExistingServer=false evita reutilizar un frontend con otra configuración. Los siete perfiles utilizan Chromium o WebKit; no son dispositivos físicos ni prueba nativa Android.
6. Smoke inicial: node scripts/e2e/local/run.cjs smoke. Pasada estable: node scripts/e2e/local/run.cjs pending --label=pendientes-estable --workers=3. Mutaciones: node scripts/e2e/local/run.cjs mutations --label=mutaciones-estable --workers=3. Ambas pasadas finales sin reintentos. Los comandos/tiempos/códigos están en las respectivas carpetas de evidencia.

Una primera pasada de 105 instancias coincidió con el ajuste del gateway y se interrumpió después; conservó logs/artefactos y un exit code de terminación, pero no un JSON final. **No se utiliza como ejecución completa ni como denominador de resultados.** La pasada estable posterior tiene JSON íntegro. No se modificaron los casos existentes para hacerlos aprobar: git diff -- src tests devolvió vacío.

## Resultados

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
${table}

Las 112 instancias pendientes suman exclusivamente E2E-02 y E2E-03: **95 aprobadas, 17 fallidas, 0 omitidas y 0 bloqueadas por credenciales**; son 16 casos lógicos × siete perfiles. El smoke inicial de tres roles se solapa con E2E-02 y no se vuelve a sumar. Las 12 pruebas del arnés, tres verificaciones API por rol y controles SQL tienen denominadores propios. La matriz RLS es un script con aserciones y salida 0; no se inventa una cantidad de casos TAP/Jest para él.

| Archivo y caso lógico | Instancias | Aprobadas | Fallidas | Omitidas |
|---|---:|---:|---:|---:|
${byCase}

Resultados detallados por perfil y caso: ${ref('casos-e2e-detallados.json')}. Reportes: ${ref('pendientes-estable/html/index.html')} y ${ref('mutaciones-estable/html/index.html')}. La pasada estable duró ${stable.stats.duration/1000} s según Playwright (${read('pendientes-estable/ejecucion.meta.json').durationSeconds} s de proceso); la mutación, ${mutation.stats.duration/1000} s de runner (${read('mutaciones-estable/ejecucion.meta.json').durationSeconds} s de proceso).

### Interpretación de los fallos

- **Siete fallos en asistencias.guided.review.spec.js:** en móvil no se encontró el botón de asistencias y en perfiles mayores no se alcanzó el encabezado esperado. Esa suite usa navegación genérica y no la preparación actual de la guía/sidebar usada por las otras suites. La navegación de módulos y los filtros de asistencias sí aprobaron con los helpers actuales. Esto apunta a una incompatibilidad del flujo de prueba; no se da por demostrada una falla del backend ni una aprobación de la revisión guiada.
- **Tres fallos del caso de pagos en 390/430/480 px:** no se encontró el encabezado Monto. La suite busca un encabezado de tabla en perfiles donde la presentación cambia; el script especializado del repositorio está orientado a escritorio. No se eliminó la aserción, se omitió el perfil ni se inventó una comprobación equivalente. La ordenación mediante ese encabezado sigue sin acreditarse en esos perfiles.
- **Siete fallos del happy path de alta/pago/asistencia:** el flujo existente no completó sus pasos con los selectores/preparación actuales. No se afirma éxito de creación UI, registro de pago ni asistencia. Los conteos posteriores continuaron en 10 usuarios y ocho atletas; la cadena funcional permanece pendiente de actualizar y verificar. Las pruebas están ejecutadas y fallidas, no bloqueadas por falta de cuentas.

Ninguna corrección a selectores, expectativa o lógica de producción forma parte de esta entrega. El siguiente trabajo funcional es depurar esas tres suites con los contratos actuales y conservar los resultados originales como línea de comparación.

## Persistencia y control de acceso reales

Auth y lecturas por rol: las sesiones locales de administrador, entrenador y atleta aprobaron; el atleta observó únicamente su fila de usuario y su estudiante, mientras el personal accedió al conjunto ficticio. Esto prueba el alcance de esas consultas, no todos los posibles endpoints u operaciones.

La matriz SQL local terminó con BEGIN/DO/ROLLBACK y salida 0 (${ref('rls-matriz-local.stdout.log')}, ${ref('rls-matriz-local.meta.json')}). Valida sus aserciones sobre usuarios ficticios y el esquema local; no certifica que todas las políticas remotas estén cubiertas ni corrige los riesgos identificados en la primera auditoría.

Después de los inicios de sesión del atleta, se consultó el historial real: **${persist.daily_login_entries} movimiento daily_login, ${persist.daily_login_xp} XP y ${persist.duplicate_daily_groups} grupos diarios duplicados**, además del estado de login_rewards (${ref('persistencia-local.json')}). Es evidencia de persistencia local de la recompensa diaria; no se extrapola a concurrencia ilimitada, compras de tienda ni todo el cálculo de progreso. Los ocho pagos/asistencias/tests del seed son datos de preparación, no casos E2E de alta aprobados.

## Compilación, Android y servicios

| Comando de compilación local | Código | Duración proceso (s) | Evidencia |
|---|---:|---:|---|
${compileTable}

Ambos builds CRA terminaron con salida 0; la versión final con clave PII local tardó ${newBuild?.durationSeconds} s. Se registró la advertencia DEP0176 de Node sobre fs.F_OK. El primer build no incorporaba la clave PII local y se utilizó para el smoke/navegación inicial; se preparó un build nuevo antes de la ejecución estable y las mutaciones. No se interpretan como pruebas de todas las funcionalidades. No se duplican bundles ni mapas con configuración tokenizada en el expediente público.

Las Edge Functions se levantaron localmente desde las fuentes del repositorio, con un archivo de entorno vacío de proveedores; no se validó entrega externa ni todos sus endpoints. Android no se reejecutó en esta etapa: continúa pendiente del SDK y de la combinación Java/Gradle descrita en el informe inicial. No se presenta este build web como compilación Android ni como despliegue.

## Revisión del arnés e integridad

Una revisión independiente no encontró hallazgos críticos; señaló tres importantes sobre destino Docker, helper de reinicio y preservación de evidencias. Se corrigieron con pruebas que primero reprodujeron la carencia y después aprobaron. Se reforzó también el entorno Edge vacío por invocación. Véase ${ref('REVISION_INDEPENDIENTE.md')} y ${ref('arnes-final.stdout.log')}. Las ejecuciones futuras reciben una carpeta única; una etiqueta ya existente se rechaza y los logs repetidos no reemplazan los anteriores.

Las fuentes y hashes del arnés están en ${ref('fuentes-entorno.json')}. La comprobación de integridad y privacidad está en ${ref('INTEGRIDAD.json')}, ${ref('PRIVACIDAD.json')} y ${ref('MANIFIESTO_SHA256.json')}. Las redacciones en copias de evidencia no alteran estados ni cantidades. Las capturas provienen únicamente de datos ficticios; no se usaron cuentas institucionales. El alcance del análisis de privacidad y sus límites se documentan allí, sin declarar una garantía absoluta.

## Pendientes y conclusión técnica

El entorno aislado está preparado y su setup se pudo repetir satisfactoriamente. Las 112 instancias dejaron de estar bloqueadas por ausencia de un backend descartable y ahora tienen resultados verificables: 95 aprobadas y 17 fallidas. Permanecen pendientes la adaptación/verificación de los flujos de pruebas descritos, la cadena UI completa de creación/pago/asistencia, compras cosméticas reales, entrega de proveedores externos y Android. Los riesgos de permisos/dependencias de la primera auditoría no se corrigen ni se dan por resueltos por crear este entorno.

La propuesta académica complementaria está en ${ref('RESULTADOS_PARA_TESIS_4_5.md')}. Este trabajo no mide usabilidad, motivación, capacidad de interacción, USE ni UES-SF, y no modificó el documento de tesis.
`;
h.write('INFORME_VERIFICACION_TECNICA.md',report);
const matrix=`# Matriz complementaria de verificaciones: entorno E2E local

La [matriz inicial](${old}/MATRIZ_VERIFICACIONES_TESIS.md) conserva los resultados unitarios de la Tabla 4-6. Esta etapa no vuelve a contar esas suites: documenta qué evidencia nueva aporta el backend local real.

| Categoría de Tabla 4-6 | Archivo/procedimiento relacionado | Ejecución y resultado nuevo | Tipo / mocks | Limitación | Evidencia |
|---|---|---|---|---|---|
| 1. Caso de uso de gamificación | Login de atleta + consulta de xp_ledger/login_rewards | 1 movimiento diario, 8 XP, 0 grupos diarios duplicados | Navegador/API/SQL reales locales; fixtures, sin repositorio mock | No reejecuta la suite del motor ni todos los cálculos XP | ${ref('persistencia-local.json')} |
| 2. Servicio público de gamificación | Flujo real de login local del atleta | Persistencia diaria observada; sin denominador nuevo de tests de fachada | Servicio de aplicación y backend locales reales | No equivale a endpoint anónimo ni certifica todos los métodos exportados | ${ref('persistencia-local.json')}; ${ref('pendientes-estable/resultados.json')} |
| 3. Identidad del atleta | roles.panels-navigation.smoke.spec.js y roles.modules-navigation.spec.js | Navegación de estudiante aprobada en siete perfiles en cada caso | Playwright con Auth/PostgreSQL locales | Sin edición/persistencia de avatar o título comprobada en esta etapa | ${ref('casos-e2e-detallados.json')} |
| 4. Wallet y monedas | Navegación de módulo de gamificación | Panel recorrido; transacciones de wallet no ejecutadas | Backend local real | El seed/catálogo no valida débitos, créditos ni integridad de saldo | ${ref('pendientes-estable/resultados.json')} |
| 5. Tienda cosmética | Catálogos y navegación existentes | Compras/equipamiento NO EJECUTADOS en esta etapa | Sin compra real ni mock de compra nuevo | Mantener resultados unitarios iniciales y preparar un flujo transaccional propio | ${ref('INFORME_VERIFICACION_TECNICA.md')} |
| 6. Asistencia | filtros de tablas, revisión guiada y happy path | Filtros: 7/7; revisión guiada: 0/7; happy path: 0/7 | Playwright contra backend local | Registrar asistencia por UI no acreditado; seed no cuenta como prueba funcional | ${ref('resumen-e2e-local.json')} |
| 7. Pagos | filtros de tablas y happy path | Filtros: 4/7, con 3 fallos móviles; happy path: 0/7 | Playwright contra backend local | Sin registro UI de pago demostrado por la cadena fallida | ${ref('resumen-e2e-local.json')} |
| 8. Compilación del proyecto | build.cjs / CRA | Dos compilaciones con salida 0; final ${newBuild?.durationSeconds} s | Compilador real; variables locales explícitas | Sin Android ni garantía funcional de módulos | ${ref(newBuild?.file||compiles[0].file)} |

Los casos reutilizados entre categorías no se suman. Los resultados E2E nuevos son **112 instancias = 95 aprobadas + 17 fallidas**, con cero omisiones. El smoke inicial de 3 casos ya está representado por casos posteriores y se informa como antecedente de arranque.

## Complementos

- Auth y consulta por rol: 3/3 verificaciones reales, ${ref('auth-roles-reales.json')}.
- Matriz RLS: un script real local, salida 0 y ROLLBACK; ${source('database/tests/rls_access_matrix.sql')}, ${ref('rls-matriz-local.meta.json')}.
- Idempotencia: conteos sin duplicados al repetir seed, ${ref('seed-idempotencia.json')}.
- Arnés: 12 pruebas node:test aprobadas; no se suman a E2E ni a Jest del producto, ${ref('arnes-final.stdout.log')}.
- Android y entrega externa de correo/push: no ejecutados en esta etapa.
- Seguridad de producción: sin correcciones; la copia de estructura no certifica ni modifica sus permisos actuales.

## Instancias por archivo y caso

| Archivo y caso | Ejecutadas | Aprobadas | Fallidas | Omitidas |
|---|---:|---:|---:|---:|
${byCase}
`;
h.write('MATRIZ_VERIFICACIONES_TESIS.md',matrix);
const thesis=`# Propuesta complementaria para el apartado 4.5

Texto para revisión académica. Complementa los [resultados iniciales](${old}/RESULTADOS_PARA_TESIS_4_5.md) y no sustituye sus denominadores. No se modificó la tesis.

Con el propósito de ampliar la verificación extremo a extremo, se preparó un entorno independiente de Supabase en Docker con PostgreSQL, Auth, RLS y datos ficticios. Se reconstruyeron 47 tablas de aplicación y 44 vistas a partir de metadatos, sin copiar registros institucionales, y se crearon diez cuentas de prueba, incluidos los roles de administrador, entrenador y atleta. El procedimiento de preparación se ejecutó de nuevo con resultado satisfactorio y el seed mantuvo sus conteos al repetirse ([inventario local](inventario-local.json), [preparación](setup-final.meta.json) e [idempotencia](seed-idempotencia.json)).

En este entorno se ejecutaron las **112 instancias E2E que habían quedado bloqueadas**, correspondientes a 16 casos lógicos en siete perfiles de pantalla con Chromium y WebKit. Los resultados fueron **95 instancias aprobadas y 17 fallidas, sin omisiones ni bloqueos por falta de credenciales**. De ellas, 105 correspondieron a navegación, roles, filtros y diseño adaptable, con 95 aprobadas y diez fallidas; las siete restantes pertenecieron al flujo administrativo de alta, pago y asistencia, que no llegó a completar satisfactoriamente sus pasos. Los diez fallos del primer grupo se concentraron en la revisión guiada de asistencias y en la búsqueda del encabezado de ordenación de pagos en tres perfiles móviles. Estas condiciones requieren revisar la preparación y los selectores de las suites respecto a la interfaz vigente, y no se interpretaron como funcionalidades aprobadas ([pasada estable](pendientes-estable/resultados.json), [flujo administrativo](mutaciones-estable/resultados.json) y [detalle por caso](casos-e2e-detallados.json)).

A diferencia de las pruebas con repositorios simulados, los inicios de sesión y las consultas de esta etapa se realizaron contra servicios locales reales. Se comprobaron tres accesos por rol y la visibilidad propia del atleta; además, la matriz SQL de control de acceso del repositorio terminó con código de salida cero sobre usuarios ficticios, revirtiendo sus escrituras mediante ROLLBACK. Tras los inicios de sesión del atleta se observó **un movimiento de recompensa diaria de ocho XP y ningún grupo diario duplicado** en el historial local. Este resultado demuestra persistencia para ese escenario concreto y no se extiende a todas las recompensas, compras cosméticas o transacciones del sistema ([roles](auth-roles-reales.json), [matriz RLS](rls-matriz-local.meta.json) y [persistencia](persistencia-local.json)).

La compilación web con configuración y clave de cifrado exclusivas del entorno local finalizó con código de salida cero en **${String(newBuild?.durationSeconds).replace('.',',')} segundos**. Las doce pruebas del arnés también aprobaron, incluyendo restricciones de destino, exclusión de configuración institucional y preservación de evidencias; estos controles se informan separadamente de los casos funcionales. Permanecen pendientes la cadena UI completa de alta, pago y asistencia, los flujos cosméticos transaccionales, la entrega por proveedores externos y la compilación Android. La preparación del entorno no resuelve los riesgos de seguridad ni las dependencias señaladas en la auditoría inicial ([compilación](${newBuild?.file}), [pruebas del arnés](arnes-final.stdout.log) e [informe complementario](INFORME_VERIFICACION_TECNICA.md)). Los resultados describen el alcance técnico comprobado y no constituyen mediciones de usabilidad, motivación o capacidad de interacción con usuarios, ni resultados de USE o UES-SF.
`;
h.write('RESULTADOS_PARA_TESIS_4_5.md',thesis);
console.log(JSON.stringify({reports:3,e2e:records.length,passed:95,failed:17,helperTests:12,evidence:path.relative(h.root,h.evidence)}));
