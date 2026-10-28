# Verificación técnica complementaria: E2E con Supabase local

## Identificación y alcance

RIOVOLEY, commit base **c71f55e5bc59c528a002c4347fb1664794cb277e**. Ejecución del 28/10/2026; timestamps originales en UTC y zona del equipo America/Guayaquil (UTC−05). Expediente 20261028-141243-c71f55e. Se preparó y ejecutó un entorno descartable para las 112 instancias que estaban bloqueadas en [la auditoría inicial](../../verificacion-tecnica/20261027-212222-c71f55e/INFORME_VERIFICACION_TECNICA.md). Ese expediente se conserva: esta etapa es complementaria, no reemplaza sus resultados ni reejecuta sus 387 casos Jest.

El usuario autorizó crear el entorno local. Producción se utilizó exclusivamente como fuente de metadatos mediante SELECT para reconstruir DDL. No se ejecutó login, migración, cambio de permisos ni escritura institucional. No se copiaron usuarios, atletas, pagos, asistencias, evaluaciones, objetos Storage, claves de proveedores ni cron jobs de producción. No se hizo push, deploy ni publicación. Las comprobaciones de negocio de este informe se hicieron con Supabase real local; los datos ficticios son fixtures, no repositorios simulados.

## Entorno y preparación reproducible

Windows 11, Node v24.18.0, npm 11.16.0, Docker Desktop Linux 29.7.2 y Supabase CLI fijada a 2.122.0. PostgreSQL local reportó **17.11**; la fuente remota de estructura reportó 17.4. Esta diferencia y las versiones de servicios locales impiden afirmar equivalencia absoluta con producción.

Proyecto local riovoley-e2e-local, API 127.0.0.1:55321, DB 55322, correo local 55324–55326 y frontend 6100. Los bindings se comprobaron en [red-local/bindings.json](red-local/bindings.json). Se preservó el otro stack local microplus, que usa los puertos 54321–54327. Docker CLI, Supabase CLI y llamadas directas fijan el named pipe local de Docker Desktop y no confían en DOCKER_HOST/DOCKER_CONTEXT externos; se comprobó la guardia introduciendo deliberadamente variables remotas inválidas ([docker-endpoint-forzado.meta.json](docker-endpoint-forzado.meta.json)).

Se reconstruyeron **47 tablas de aplicación, 44 vistas, 38 funciones y 139 políticas** desde metadatos. [database/e2e/local-baseline.sql](../../../../../database/e2e/local-baseline.sql) contiene solo DDL; no hay INSERT/COPY de registros institucionales. Los esquemas administrados de Auth/Storage/Realtime se inicializan por Supabase. El bootstrap no conserva todos los posibles aspectos de producción: extensiones y servicios administrados, propietarios exactos, default privileges, comentarios, estadísticas, objetos de Storage, proveedores y jobs programados no se certifican como idénticos. La presencia de esas estructuras no acredita por sí sola todos los permisos o transacciones; se complementó con Auth, consultas y matriz SQL reales.

La primera restauración encontró una función de edad requerida por una columna generada. Se implementó y probó la recreación de esa dependencia antes de crear la tabla, con volatilidad temporal IMMUTABLE y restauración de la definición observada antes de COMMIT. Los intentos iniciales fallidos se conservan en bootstrap-esquema*.meta.json; no se alteró la lógica del producto. Durante el enlace exclusivo a loopback se preservaron los archivos de Kong mediante TAR, con sus propietarios/modos; se retuvieron los contenedores anteriores detenidos y los volúmenes. El procedimiento final está verificado en el manager.

El seed creó **10 cuentas ficticias y ocho atletas**, ocho pagos, ocho asistencias, ocho evaluaciones, horarios, comunicado y catálogos para la interfaz. La repetición del seed mantuvo los conteos ([seed-idempotencia.json](seed-idempotencia.json)). Las contraseñas, claves locales y clave PII solo residen en .e2e-local/, ignorado por Git. No se sobrescribieron .env/.env.e2e institucionales. El build se generó en runtime con URL/key locales y clave PII propia; BUILD_PATH evita tocar build/. El launcher neutraliza REACT_APP_* heredadas y el navegador bloquea destinos externos. No se configuró envío real de correo, WhatsApp o FCM; su entrega externa **NO FUE EJECUTADA**.

Comandos operativos completos: [scripts/e2e/local/README.md](../../../../../scripts/e2e/local/README.md). Preparación final repetida: node scripts/e2e/local/manage.cjs setup, salida 0 ([setup-final.meta.json](setup-final.meta.json)). Esa repetición incluyó arranque, verificación de loopback, seed, Auth por roles e idempotencia.

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
| E2E-01 | Smoke inicial estricto por roles, escritorio | 3 | 3 | 0 | 0 | APROBADO | [roles-escritorio/resultados.json](roles-escritorio/resultados.json) |
| E2E-02 | Pendientes sin mutación explícita, siete perfiles | 105 | 95 | 10 | 0 | FALLIDO | [pendientes-estable/resultados.json](pendientes-estable/resultados.json) |
| E2E-03 | Flujo de alta/pago/asistencia, siete perfiles | 7 | 0 | 7 | 0 | FALLIDO | [mutaciones-estable/resultados.json](mutaciones-estable/resultados.json) |
| AUTH-01 | Auth local y consultas por rol | 3 | 3 | 0 | 0 | APROBADO | [auth-roles-reales.json](auth-roles-reales.json) |
| RLS-01 | Matriz SQL local (un script; sin denominador de casos) | — | — | — | — | APROBADO | [rls-matriz-local.meta.json](rls-matriz-local.meta.json) |
| HAR-01 | Pruebas unitarias del arnés | 12 | 12 | 0 | 0 | APROBADO | [arnes-final.stdout.log](arnes-final.stdout.log) |
| SEED-01 | Idempotencia del seed (un control de conteos) | 1 | 1 | 0 | 0 | APROBADO | [seed-idempotencia.json](seed-idempotencia.json) |
| XP-01 | Persistencia/deduplicación de recompensa diaria (un control) | 1 | 1 | 0 | 0 | APROBADO | [persistencia-local.json](persistencia-local.json) |

Las 112 instancias pendientes suman exclusivamente E2E-02 y E2E-03: **95 aprobadas, 17 fallidas, 0 omitidas y 0 bloqueadas por credenciales**; son 16 casos lógicos × siete perfiles. El smoke inicial de tres roles se solapa con E2E-02 y no se vuelve a sumar. Las 12 pruebas del arnés, tres verificaciones API por rol y controles SQL tienen denominadores propios. La matriz RLS es un script con aserciones y salida 0; no se inventa una cantidad de casos TAP/Jest para él.

| Archivo y caso lógico | Instancias | Aprobadas | Fallidas | Omitidas |
|---|---:|---:|---:|---:|
| admin.modules-navigation.spec.js: admin: every module opens without a JavaScript crash | 7 | 7 | 0 | 0 |
| admin.provisioning-notifications.smoke.spec.js: admin smoke: provisioning + notifications entrypoints | 7 | 7 | 0 | 0 |
| asistencias.guided.review.spec.js: guided review: admin asistencias quick mode per viewport | 7 | 0 | 7 | 0 |
| filters-sorting.phase2-lists.spec.js: phase2 athletes tab: filtros y orden con reset consistente | 7 | 7 | 0 | 0 |
| filters-sorting.phase2-lists.spec.js: phase2 schedules: filtros y orden con limpiar filtros | 7 | 7 | 0 | 0 |
| filters-sorting.physical-tests.spec.js: physical-tests: filtros + orden + limpiar filtros | 7 | 7 | 0 | 0 |
| filters-sorting.tables.spec.js: pagos: filtros base + orden de columnas por header | 7 | 4 | 3 | 0 |
| filters-sorting.tables.spec.js: asistencias: filtros del historial + orden por columnas | 7 | 7 | 0 | 0 |
| filters-sorting.user-management.spec.js: user-management tabs: filtros y orden se actualizan y resetean por tab | 7 | 7 | 0 | 0 |
| responsive.smoke.spec.js: role dashboards responsive guard (optional env credentials) | 7 | 7 | 0 | 0 |
| roles.modules-navigation.spec.js: trainer: every module renders without a JavaScript crash | 7 | 7 | 0 | 0 |
| roles.modules-navigation.spec.js: student: every module renders without a JavaScript crash | 7 | 7 | 0 | 0 |
| roles.panels-navigation.smoke.spec.js: role panel smoke: admin | 7 | 7 | 0 | 0 |
| roles.panels-navigation.smoke.spec.js: role panel smoke: trainer | 7 | 7 | 0 | 0 |
| roles.panels-navigation.smoke.spec.js: role panel smoke: student | 7 | 7 | 0 | 0 |
| admin.happy-path-controlled.spec.js: admin happy path controlado: atleta + pago + asistencia | 7 | 0 | 7 | 0 |

Resultados detallados por perfil y caso: [casos-e2e-detallados.json](casos-e2e-detallados.json). Reportes: [pendientes-estable/html/index.html](pendientes-estable/html/index.html) y [mutaciones-estable/html/index.html](mutaciones-estable/html/index.html). La pasada estable duró 291.449923 s según Playwright (292.823 s de proceso); la mutación, 99.462427 s de runner (100.899 s de proceso).

### Interpretación de los fallos

- **Siete fallos en asistencias.guided.review.spec.js:** en móvil no se encontró el botón de asistencias y en perfiles mayores no se alcanzó el encabezado esperado. Esa suite usa navegación genérica y no la preparación actual de la guía/sidebar usada por las otras suites. La navegación de módulos y los filtros de asistencias sí aprobaron con los helpers actuales. Esto apunta a una incompatibilidad del flujo de prueba; no se da por demostrada una falla del backend ni una aprobación de la revisión guiada.
- **Tres fallos del caso de pagos en 390/430/480 px:** no se encontró el encabezado Monto. La suite busca un encabezado de tabla en perfiles donde la presentación cambia; el script especializado del repositorio está orientado a escritorio. No se eliminó la aserción, se omitió el perfil ni se inventó una comprobación equivalente. La ordenación mediante ese encabezado sigue sin acreditarse en esos perfiles.
- **Siete fallos del happy path de alta/pago/asistencia:** el flujo existente no completó sus pasos con los selectores/preparación actuales. No se afirma éxito de creación UI, registro de pago ni asistencia. Los conteos posteriores continuaron en 10 usuarios y ocho atletas; la cadena funcional permanece pendiente de actualizar y verificar. Las pruebas están ejecutadas y fallidas, no bloqueadas por falta de cuentas.

Ninguna corrección a selectores, expectativa o lógica de producción forma parte de esta entrega. El siguiente trabajo funcional es depurar esas tres suites con los contratos actuales y conservar los resultados originales como línea de comparación.

## Persistencia y control de acceso reales

Auth y lecturas por rol: las sesiones locales de administrador, entrenador y atleta aprobaron; el atleta observó únicamente su fila de usuario y su estudiante, mientras el personal accedió al conjunto ficticio. Esto prueba el alcance de esas consultas, no todos los posibles endpoints u operaciones.

La matriz SQL local terminó con BEGIN/DO/ROLLBACK y salida 0 ([rls-matriz-local.stdout.log](rls-matriz-local.stdout.log), [rls-matriz-local.meta.json](rls-matriz-local.meta.json)). Valida sus aserciones sobre usuarios ficticios y el esquema local; no certifica que todas las políticas remotas estén cubiertas ni corrige los riesgos identificados en la primera auditoría.

Después de los inicios de sesión del atleta, se consultó el historial real: **1 movimiento daily_login, 8 XP y 0 grupos diarios duplicados**, además del estado de login_rewards ([persistencia-local.json](persistencia-local.json)). Es evidencia de persistencia local de la recompensa diaria; no se extrapola a concurrencia ilimitada, compras de tienda ni todo el cálculo de progreso. Los ocho pagos/asistencias/tests del seed son datos de preparación, no casos E2E de alta aprobados.

## Compilación, Android y servicios

| Comando de compilación local | Código | Duración proceso (s) | Evidencia |
|---|---:|---:|---|
| C:\Program Files\nodejs\node.exe D:\Riovoley\riovoley\node_modules\react-scripts\scripts\build.js | 0 | 244.354 | [compilacion-local.meta.json](compilacion-local.meta.json) |
| C:\Program Files\nodejs\node.exe D:\Riovoley\riovoley\node_modules\react-scripts\scripts\build.js | 0 | 125.567 | [compilacion-web-build-1793197434387.meta.json](compilacion-web-build-1793197434387.meta.json) |

Ambos builds CRA terminaron con salida 0; la versión final con clave PII local tardó 125.567 s. Se registró la advertencia DEP0176 de Node sobre fs.F_OK. El primer build no incorporaba la clave PII local y se utilizó para el smoke/navegación inicial; se preparó un build nuevo antes de la ejecución estable y las mutaciones. No se interpretan como pruebas de todas las funcionalidades. No se duplican bundles ni mapas con configuración tokenizada en el expediente público.

Las Edge Functions se levantaron localmente desde las fuentes del repositorio, con un archivo de entorno vacío de proveedores; no se validó entrega externa ni todos sus endpoints. Android no se reejecutó en esta etapa: continúa pendiente del SDK y de la combinación Java/Gradle descrita en el informe inicial. No se presenta este build web como compilación Android ni como despliegue.

## Revisión del arnés e integridad

Una revisión independiente no encontró hallazgos críticos; señaló tres importantes sobre destino Docker, helper de reinicio y preservación de evidencias. Se corrigieron con pruebas que primero reprodujeron la carencia y después aprobaron. Se reforzó también el entorno Edge vacío por invocación. Véase [REVISION_INDEPENDIENTE.md](REVISION_INDEPENDIENTE.md) y [arnes-final.stdout.log](arnes-final.stdout.log). Las ejecuciones futuras reciben una carpeta única; una etiqueta ya existente se rechaza y los logs repetidos no reemplazan los anteriores.

Las fuentes y hashes del arnés están en [fuentes-entorno.json](fuentes-entorno.json). La comprobación de integridad y privacidad está en [INTEGRIDAD.json](INTEGRIDAD.json), [PRIVACIDAD.json](PRIVACIDAD.json) y [MANIFIESTO_SHA256.json](MANIFIESTO_SHA256.json). Las redacciones en copias de evidencia no alteran estados ni cantidades. Las capturas provienen únicamente de datos ficticios; no se usaron cuentas institucionales. El alcance del análisis de privacidad y sus límites se documentan allí, sin declarar una garantía absoluta.

## Pendientes y conclusión técnica

El entorno aislado está preparado y su setup se pudo repetir satisfactoriamente. Las 112 instancias dejaron de estar bloqueadas por ausencia de un backend descartable y ahora tienen resultados verificables: 95 aprobadas y 17 fallidas. Permanecen pendientes la adaptación/verificación de los flujos de pruebas descritos, la cadena UI completa de creación/pago/asistencia, compras cosméticas reales, entrega de proveedores externos y Android. Los riesgos de permisos/dependencias de la primera auditoría no se corrigen ni se dan por resueltos por crear este entorno.

La propuesta académica complementaria está en [RESULTADOS_PARA_TESIS_4_5.md](RESULTADOS_PARA_TESIS_4_5.md). Este trabajo no mide usabilidad, motivación, capacidad de interacción, USE ni UES-SF, y no modificó el documento de tesis.

