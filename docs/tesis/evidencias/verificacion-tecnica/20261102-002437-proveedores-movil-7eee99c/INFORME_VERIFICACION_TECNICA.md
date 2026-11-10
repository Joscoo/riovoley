# Informe de verificación técnica: cierre del alcance inicial

## Identificación, fecha y entorno

RIOVOLEY, https://github.com/Joscoo/riovoley. Commit base **7eee99c36e4125570351d7ffaec97f0cc8cd265c**, rama fix/seguridad-local-20261029 y cambios locales identificados en [FUENTES_EVALUADAS.json](FUENTES_EVALUADAS.json). Inicio 2026-11-02T00:24:37.415Z; corte 2026-11-02T04:07:18.612Z; fechas UTC, Ecuador UTC−5. Sistema Windows, Node 24.18.0 y npm 11.16.0; Android usa JDK 21.0.12.1, SDK local y Gradle wrapper del proyecto. No se publican valores de configuración. Las versiones/comandos efectivos del build se conservan en metadatos; los logs originales nativos permanecen privados junto al APK. [Contexto](CONTEXTO.json), [comandos](COMANDOS.json).

El usuario detuvo la validación de credenciales y autorizó la revisión del proyecto y de metadatos Cloud. No se solicitan nuevas claves. Los conectores MCP Supabase/Vercel devolvieron LINK_ID_REQUIRED; se usaron las CLI ya autenticadas, con GET y SELECT READ ONLY. No se descifraron valores Vercel ni se cambiaron configuración, permisos, esquema o registros institucionales en esta fase. [Alcance y conectores](seguridad/alcance-cierre-y-mcp.json).

## Alcance, metodología y estados

Este expediente complementa los resultados de la auditoría inicial; no sustituye ni modifica sus registros sellados. APROBADO implica cumplimiento del escenario ejecutado, FALLIDO conserva un resultado adverso real, BLOQUEADO identifica una precondición impedida, OMITIDO un caso omitido por la herramienta y NO EJECUTADO una comprobación sin ejecución en esta fase. Un cero en NO EJECUTADO nunca significa aprobación. No se suman denominadores entre herramientas, subconjuntos o repeticiones RED→GREEN.

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| U01 | Node: guardas de proveedores y perfil Android | 17 | 17 | 0 | 0 | APROBADO; 14 + 3, transporte simulado | [TAP](unitarias/proveedores-y-perfil-cierre.stdout.log) |
| U02 | Jest/Testing Library del producto en esta fase | 0 | 0 | 0 | 0 | NO EJECUTADO; referencia anterior separada | [Cierre previo](../20261101-163241-cierre-operativo-2589935/INFORME_VERIFICACION_TECNICA.md) |
| I01 | API real Resend/FCM | 0 | 0 | 0 | 0 | BLOQUEADO; sin peticiones a proveedores | [Resultado real](seguridad/proveedores-verificacion-real.json) |
| E01 | Playwright nuevo en esta fase | 0 | 0 | 0 | 0 | NO EJECUTADO; matriz final anterior 249/249 | [Matriz ejecutada](../20261029-231235-e2e-final-2e999d1/INFORME_VERIFICACION_TECNICA.md) |
| W01 | Build web para perfil nativo local | — | — | — | — | APROBADO, salida 0; 207.463 s | [Metadatos](android/local-web-build.meta.json) |
| A01 | Capacitor sync Android aislado | — | — | — | — | APROBADO, salida 0; 9.84 s | [Metadatos](android/local-capacitor-sync.meta.json) |
| A02 | Gradle assembleDebug/testDebugUnitTest | — | — | — | — | APROBADO, salida 0; 340.998 s | [Metadatos](android/local-gradle.meta.json) |
| A03 | JUnit de plantilla addition_isCorrect | 1 | 1 | 0 | 0 | APROBADO; sin cobertura del negocio | [Inspección](android/apk-local-inspeccion-cierre.json) |
| A04 | Instalar/ejecutar el APK nuevo en WebView | 0 | 0 | 0 | 0 | NO EJECUTADO; no se lanzó emulador en esta fase | [Inspección](android/apk-local-inspeccion-cierre.json) |
| S01 | Catálogo institucional RLS/RPC (solo lectura) | — | — | — | — | EJECUTADO; RLS activo, RPC diaria ausente | [Catálogo](seguridad/catalogo-liberacion-actual.json) |
| S02 | Metadatos de configuración Supabase/Vercel | — | — | — | — | EJECUTADO; presencia, sin validar uso efectivo | [Supabase](seguridad/supabase-configuracion-nombres.json), [Vercel](seguridad/vercel-configuracion-nombres.json) |
| S03 | Revisión de exposición en snapshot Git | — | — | — | — | EJECUTADO; alcance acotado | [Resultado](seguridad/api-keys-revision-estatica.json) |

## Pruebas unitarias, componentes, contratos e integración

Los 17 casos Node actuales verifican 14 guardas de rutas/métodos HTTP, firma RSA local real con clave sintética efímera, validación de configuración, paginación y transporte simulado; los otros 3 verifican el aislamiento del perfil Android. No contactan proveedores ni PostgreSQL. No demuestran entrega de correo/push o persistencia institucional. Las ejecuciones iniciales fallidas RED y las ampliaciones intermedias se conservan en unitarias/ con sus códigos y no se suman como casos únicos al resultado final.

La última ejecución local completa del producto conservada en la auditoría aprobó **419/419 casos en 88 suites**, con 42,96 % de líneas instrumentadas (5209/12123). Incluye 5 casos de integración lógica con repositorio en memoria, no persistencia PostgreSQL. Esa ejecución pertenece al expediente de cierre operativo y no es una nueva ejecución de este expediente. El CI del commit base 7eee99c también fue satisfactorio, run 41360753642; cualquier commit posterior requiere su propia comprobación. [Resultado Jest y cobertura](../20261101-163241-cierre-operativo-2589935/RESULTADOS_AUTOMATIZADOS.json), [CI del commit base](https://github.com/Joscoo/riovoley/actions/runs/41360753642).

El intento real de proveedores terminó BLOQUEADO antes de llamar a Resend: el valor suministrado no coincidió con el digest de configuración actual; FROM_EMAIL sí coincidió. La comprobación no identifica cuál credencial corresponde al uso operativo ni declara inválida la suministrada. Firebase no se ejecutó. Por indicación del usuario no se continúa este proceso ni se buscan más credenciales. Cero peticiones completadas a proveedores, cero mensajes entregados. [Resultado real](seguridad/proveedores-verificacion-real.json).

## Playwright y persistencia local

La última matriz final de Playwright documentada reunió **249 instancias únicas aprobadas**, sin fallidas, omitidas ni flaky en sus grupos finales. Los intentos fallidos anteriores permanecen en sus registros y no se borran. De las 249, 28 de recuperación interceptaron Auth/REST; 7 flujos administrativos usaron Auth, REST y PostgreSQL locales reales para altas, pagos y asistencias, con comprobación agregada independiente de persistencia. No hubo login ni mutaciones de pruebas sobre producción. En esta fase no se repitió Playwright. [Casos finales](../20261029-231235-e2e-final-2e999d1/e2e/casos-playwright.json), [resumen](../20261029-231235-e2e-final-2e999d1/RESUMEN_FINAL.json), [persistencia](../20261029-231235-e2e-final-2e999d1/integracion/persistencia-postgresql.json).

## Compilación web y Android

Se compiló una copia privada nueva con backend local descartable, sin copiar google-services.json ni el keystore productivos; se desactivó OTA. El build web estricto, Capacitor y Gradle terminaron con salida 0. Se generaron **65 archivos web**, todos coincidentes byte a byte con assets del APK. El APK debug mide **31076228 bytes**, SHA-256 **5f059b7387cc096326cdb3936eaceca535acd4a53d6af2f63cdb18a2ab18cb9d**; firma verificada y paquete com.riovoley.app. Se conserva únicamente en .e2e-local/native-local/20261102003057/project/android/app/build/outputs/apk/debug/app-debug.apk; no se distribuyó ni instaló en esta fase. [Recibo](android/apk-local-compilado.json), [inspección ZIP/JUnit](android/apk-local-inspeccion-cierre.json), [salida web](compilacion-web/salida-generada.json).

Los logs originales reportan advertencias de obsolescencia y uso de flatDir; sus conteos de menciones, que no equivalen a incidencias únicas, se registran en la inspección. No hubo errores bloqueantes. El único caso JUnit addition_isCorrect es de plantilla. El build web no se interpreta como compilación nativa: esta última se acredita por el comando Gradle y el APK inspeccionado.

Existe además evidencia anterior de APK release firmado y verificado, y de **13/13 comprobaciones de WebView con servicios locales reales** sobre un APK debug anterior. No se transfieren esas aprobaciones al APK recién construido. La fase Android offline posterior registró intentos impedidos por ANR de SystemUI y no validó visualmente el release; sigue pendiente la comprobación nativa del candidato final y un dispositivo físico. [WebView anterior](../20261029-221208-android-autenticado-317e5e3/android/autenticacion-cierre.json), [release firmado](../20261101-163241-cierre-operativo-2589935/android/release-firmado.json), [limitación offline](../20261101-222301-scheduler-eec82da/android/release-observaciones-parciales.json).

## Seguridad, permisos y configuración

La consulta institucional actual confirma RLS habilitado y una política en cada tabla gamification.xp_ledger y gamification.login_rewards; FORCE RLS no está activado. Esto no verifica por sí solo los predicados ni la suficiencia de permisos. **public.claim_daily_login_reward() sigue ausente**, por lo que no corresponde promover aisladamente el cliente candidato. [Catálogo actual](seguridad/catalogo-liberacion-actual.json).

Vercel mantiene producción READY sobre **e469db5608fb77071b6a9ee3db253c28dae734dd**, distinta de esta rama. Están presentes los 4 nombres requeridos del frontend y los 6 nombres personalizados requeridos de Supabase; presencia no significa credenciales válidas, contrato funcional o entrega de proveedores. No se cambió configuración Cloud. Las alertas institucionales anteriores, las funciones privilegiadas y el paquete SQL/Edge propuesto permanecen en el [runbook](../../../../produccion/RUNBOOK.md); no se declara que una corrección local esté aplicada en producción.

La revisión de 9650 archivos de texto del snapshot actual no encontró coincidencias fuera de los archivos de origen con los valores configurados comparados ni bloques PEM privados en su alcance. No es un escaneo exhaustivo de toda la historia Git, paquetes instalados o todos los formatos de secretos. La anon pública esperada no se clasifica como service_role. Se detectó .env aún versionado: contenía únicamente dos opciones de ESLint, no claves; se retiró del índice para respetar .gitignore conservando sus bytes locales. No se reescribió la historia. [Revisión estática](seguridad/api-keys-revision-estatica.json), [higiene del índice](seguridad/env-retirado-del-indice.json).

El diseño actual utiliza REACT_APP_PII_ENCRYPTION_KEY en código del navegador. El prefijo REACT_APP permite su inclusión en el cliente; no debe considerarse un secreto de servidor inaccesible al usuario del bundle. Se registra esta limitación arquitectónica sin cambiar material de cifrado ni datos. El análisis npm anterior de CI informó cero avisos en tres árboles, con denominadores separados; no se repitió npm audit antes de este corte ni se equipara ese resultado con ausencia de vulnerabilidades de código, forks o infraestructura. [Diseño observado](seguridad/api-keys-revision-estatica.json), [análisis previo](../20261101-163241-cierre-operativo-2589935/RESULTADOS_AUTOMATIZADOS.json).

## Integridad, entregables y pendientes

Los tres entregables iniciales —informe, matriz y propuesta para el apartado 4.5— están disponibles (3 de 3). Esa cifra expresa entrega documental; no es un porcentaje de cobertura funcional, de código, ni de aptitud para producción. Las ocho categorías de la tesis disponen de trazabilidad y límites en [MATRIZ_VERIFICACIONES_TESIS.md](MATRIZ_VERIFICACIONES_TESIS.md). La propuesta académica está en [RESULTADOS_PARA_TESIS_4_5.md](RESULTADOS_PARA_TESIS_4_5.md), sin modificar el documento de tesis.

Permanecen expresamente pendientes: validación real de proveedores y correo de recuperación (fuera de continuación por decisión del usuario); aprobación y aplicación coordinada del paquete SQL/Edge/clientes; emisor del scheduler; revisión de alertas institucionales; validación nativa del candidato y dispositivo físico; restauración integral mediante Storage API/servicios gestionados y custodia en otro dispositivo. Los bytes de Storage y el SQL sí tienen recuperación local documentada; no se denominan restauración completa del servicio Supabase. [Cierre operativo](../20261101-163241-cierre-operativo-2589935/INFORME_VERIFICACION_TECNICA.md), [runbook](../../../../produccion/RUNBOOK.md).

El cierre verifica enlaces, cifras y manifiestos anteriores en [INTEGRIDAD.json](INTEGRIDAD.json), revisa exposición de datos en [PRIVACIDAD.json](PRIVACIDAD.json) y sella este expediente en [MANIFIESTO_SHA256.json](MANIFIESTO_SHA256.json). Este trabajo no es una prueba de penetración completa ni una evaluación de usabilidad, motivación, USE o UES-SF.
