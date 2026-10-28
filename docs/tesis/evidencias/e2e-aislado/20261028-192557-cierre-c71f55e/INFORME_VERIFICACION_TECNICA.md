# Informe de verificación técnica: cierre de incidencias RIOVOLEY

## Identificación y entorno

Repositorio oficial: https://github.com/Joscoo/riovoley. Commit base **c71f55e5bc59c528a002c4347fb1664794cb277e**, con modificaciones locales, sin commit ni publicación de esta etapa. Fecha de generación UTC: 2026-10-28T20:28:09.092Z; zona del trabajo: America/Guayaquil (UTC−5). Los tiempos exactos de cada ejecución constan en los archivos *.meta.json. Se conserva [estado-inicial.txt](estado-inicial.txt); [fuentes-iniciales.json](fuentes-iniciales.json) permite comparar las fuentes de partida. Un hash de HEAD no identifica por sí solo el árbol modificado: el manifiesto y las huellas finales acompañan los resultados.

Windows, PowerShell, Node.js 24.18.0, npm 11.16.0; React/CRA, Jest/Testing Library, Playwright Chromium/WebKit. Backend **local descartable** Supabase Docker: API 127.0.0.1:55321, PostgreSQL en contenedor propio, SMTP/Mailpit local 55324, frontend 127.0.0.1:6100. Las cuentas son sintéticas. No se utiliza .env.e2e institucional. Claves locales y contraseñas permanecen únicamente en .e2e-local, ignorado por Git. Las variables de configuración REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY, REACT_APP_PII_ENCRYPTION_KEY y E2E_* se resuelven con el arnés sin publicar valores. El APK usa backend de loopback sin clave válida, OTA deshabilitado y no incluye google-services institucional ni keystore de publicación. Ver [../../verificacion-tecnica/20261028-200050-android-actualizado-c71f55e/android/configuracion-final.json](../../verificacion-tecnica/20261028-200050-android-actualizado-c71f55e/android/configuracion-final.json).

## Alcance y método

Esta etapa corrige fallos observados y amplía integración real, entrega local de recuperación y ejecución Android. La inspección inicial de scripts, estructura, pruebas, variables y documentación de restauración sigue disponible en [../../verificacion-tecnica/20261027-212222-c71f55e/INFORME_VERIFICACION_TECNICA.md](../../verificacion-tecnica/20261027-212222-c71f55e/INFORME_VERIFICACION_TECNICA.md). Sus resultados son antecedentes; las cifras finales siguientes proceden de ejecuciones de esta etapa. Se conservan los intentos fallidos y las ejecuciones RED/GREEN. No se borraron evidencias ni cambios locales. No se hicieron escrituras institucionales, despliegues, push, cambios de claves, esquema, RLS ni permisos.

Preparación reproducible del entorno: [../../../../../scripts/e2e/local/README.md](../../../../../scripts/e2e/local/README.md), [../../../../../playwright.local.config.cjs](../../../../../playwright.local.config.cjs) y [../../../../superpowers/plans/2026-10-28-cierre-pendientes.md](../../../../superpowers/plans/2026-10-28-cierre-pendientes.md). Tras preparar los fixtures locales, los comandos principales son:

```powershell
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
```

Los nombres de salida se deben asignar a un expediente nuevo al reproducir; no sobrescribir esta evidencia sellada. La preparación Android requiere el SDK/JDK descrito abajo y acepta las licencias mediante las herramientas oficiales. El arnés compila web con react-scripts build y sincroniza Capacitor en una copia privada. Los comandos completos, directorios, tiempos y códigos de salida están en *.meta.json; npm audit devuelve código distinto de cero cuando conserva avisos, sin implicar fallo de compilación.

## Resultados por herramienta

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| UT-01 | Jest/Testing Library | 404 | 404 | 0 | 0 | APROBADO | [jest-coverage.json](jest-coverage.json) |
| CON-01 | Contratos, subconjunto UT-01 | 6 | 6 | 0 | 0 | APROBADO | [casos-jest-detallados.json](casos-jest-detallados.json) |
| INT-M | Integración en memoria, subconjunto UT-01 | 5 | 5 | 0 | 0 | APROBADO | [casos-jest-detallados.json](casos-jest-detallados.json) |
| INT-R | Supabase/Auth/REST/RPC/PostgreSQL local | 17 | 17 | 0 | 0 | APROBADO | [integracion/integracion-17-final.stdout.log](integracion/integracion-17-final.stdout.log) |
| AUTH-E | Contratos Edge Auth, runner Node separado | 10 | 10 | 0 | 0 | APROBADO | [unitarias/auth-edge.stdout.log](unitarias/auth-edge.stdout.log) |
| HAR-01 | Guardia de red y redirecciones | 1 | 1 | 0 | 0 | APROBADO | [unitarias/guard-green.stdout.log](unitarias/guard-green.stdout.log) |
| HAR-02 | Guardas del arnés local | 12 | 12 | 0 | 0 | APROBADO | [unitarias/arnes-final.stdout.log](unitarias/arnes-final.stdout.log) |
| HAR-03 | Detector de secretos en archivos APK | 3 | 3 | 0 | 0 | APROBADO | [unitarias/privacidad-apk.stderr.log](unitarias/privacidad-apk.stderr.log) |
| E2E-1 | publicas-finales | 133 | 133 | 0 | 0 | APROBADO | [publicas-finales/resultados.json](publicas-finales/resultados.json) |
| E2E-2 | paneles-finales | 105 | 105 | 0 | 0 | APROBADO | [paneles-finales/resultados.json](paneles-finales/resultados.json) |
| E2E-3 | mutaciones-finales | 7 | 7 | 0 | 0 | APROBADO | [mutaciones-finales/resultados.json](mutaciones-finales/resultados.json) |
| E2E-4 | limites-finales | 4 | 4 | 0 | 0 | APROBADO | [limites-finales/resultados.json](limites-finales/resultados.json) |
| WEB-01 | Compilación web CRA | — | — | — | — | APROBADO | [compilacion-web-build-1793217928426.meta.json](compilacion-web-build-1793217928426.meta.json) |
| AND-01 | Compilación APK nativo | — | — | — | — | APROBADO | [../../verificacion-tecnica/20261028-200050-android-actualizado-c71f55e/android/gradle-assemble.meta.json](../../verificacion-tecnica/20261028-200050-android-actualizado-c71f55e/android/gradle-assemble.meta.json) |
| AND-02 | JUnit nativo en JVM: plantilla aritmética | 1 | 1 | 0 | 0 | APROBADO | [../../verificacion-tecnica/20261028-200050-android-actualizado-c71f55e/android/unitarias-final/resumen.json](../../verificacion-tecnica/20261028-200050-android-actualizado-c71f55e/android/unitarias-final/resumen.json) |
| AND-03 | Instrumentación en emulador API36 | 1 | 1 | 0 | 0 | APROBADO | [android/instrumentacion-final.json](android/instrumentacion-final.json) |
| AND-04 | Acceso anónimo dentro del WebView Android | 3 | 3 | 0 | 0 | APROBADO | [android/webview-final.json](android/webview-final.json) |
| SEC-01 | Catálogo RLS/RPC local, solo lectura | — | — | — | — | EJECUTADO: HALLAZGOS | [seguridad/catalogo-local-lectura.stdout.log](seguridad/catalogo-local-lectura.stdout.log) |
| NPM-raiz | npm audit raiz (avisos, no casos) | — | — | — | — | EJECUTADO: AVISOS | [seguridad/comparacion-raiz.json](seguridad/comparacion-raiz.json) |
| NPM-functions | npm audit functions (avisos, no casos) | — | — | — | — | EJECUTADO: AVISOS | [seguridad/comparacion-functions.json](seguridad/comparacion-functions.json) |
| NPM-auxiliar | npm audit auxiliar (avisos, no casos) | — | — | — | — | APROBADO | [seguridad/comparacion-auxiliar.json](seguridad/comparacion-auxiliar.json) |
| SEC-02 | Aplicación de cambios RLS/RPC | — | — | — | — | BLOQUEADO: AUTORIZACIÓN | [../../../../../database/security/REVISION_Y_AUTORIZACION_PENDIENTE.md](../../../../../database/security/REVISION_Y_AUTORIZACION_PENDIENTE.md) |
| EXT-01 | Entrega Resend/FCM real | — | — | — | — | NO EJECUTADO | [../../verificacion-tecnica/20261027-212222-c71f55e/INFORME_VERIFICACION_TECNICA.md](../../verificacion-tecnica/20261027-212222-c71f55e/INFORME_VERIFICACION_TECNICA.md) |

Los subconjuntos CON-01 e INT-M ya están dentro de 404; no se suman otra vez. Los 17 casos reales, los diez contratos Edge, el caso del arnés y los denominadores Android son runners independientes. Las 249 instancias Playwright finales comprenden 133 públicas +105 de paneles/filtros +7 de altas/pago/asistencia +4 anchos adicionales; los 21 casos anónimos de una ejecución intermedia se solapan con las 133 públicas y no se agregan.

## Unitarias, componentes y contratos

Jest aprobó **404 casos en 85 suites**, cero fallos y cero omitidos; duración de proceso 77.647 s. Cobertura global: sentencias 41.11%, ramas 33.28%, funciones 36.65% y líneas 42.5%. [cobertura/lcov-report/index.html](cobertura/lcov-report/index.html), [cobertura-resumen.json](cobertura-resumen.json). Se instrumentan los archivos incluidos por la configuración; esos porcentajes no significan cobertura funcional completa.

- account-admin: 12 casos; archivos en unitarias/modulos.json.
- admin-dashboard: 9 casos; archivos en unitarias/modulos.json.
- announcements: 7 casos; archivos en unitarias/modulos.json.
- appUrls.test.js: 2 casos; archivos en unitarias/modulos.json.
- athletes: 14 casos; archivos en unitarias/modulos.json.
- attendance: 32 casos; archivos en unitarias/modulos.json.
- auth-profile: 5 casos; archivos en unitarias/modulos.json.
- auth-session: 19 casos; archivos en unitarias/modulos.json.
- communications: 11 casos; archivos en unitarias/modulos.json.
- gamification: 65 casos; archivos en unitarias/modulos.json.
- infrastructure: 3 casos; archivos en unitarias/modulos.json.
- lib: 5 casos; archivos en unitarias/modulos.json.
- notifications: 14 casos; archivos en unitarias/modulos.json.
- otros: 1 casos; archivos en unitarias/modulos.json.
- passwordUtils.test.js: 8 casos; archivos en unitarias/modulos.json.
- payments: 40 casos; archivos en unitarias/modulos.json.
- physical-tests: 9 casos; archivos en unitarias/modulos.json.
- platform: 11 casos; archivos en unitarias/modulos.json.
- reporting: 7 casos; archivos en unitarias/modulos.json.
- schedules: 4 casos; archivos en unitarias/modulos.json.
- student-dashboard: 32 casos; archivos en unitarias/modulos.json.
- trainer-dashboard: 4 casos; archivos en unitarias/modulos.json.
- trainer-management: 8 casos; archivos en unitarias/modulos.json.
- training-categories: 3 casos; archivos en unitarias/modulos.json.
- ui: 29 casos; archivos en unitarias/modulos.json.
- user-management: 30 casos; archivos en unitarias/modulos.json.
- user-provisioning: 20 casos; archivos en unitarias/modulos.json.

Los módulos de autenticación, usuarios/permisos, pagos, asistencia, evaluaciones, anuncios/notificaciones, reportes, gamificación y UI deben interpretarse según los archivos y aserciones concretos de [unitarias/modulos.json](unitarias/modulos.json) y [casos-jest-detallados.json](casos-jest-detallados.json). Los contratos verifican forma de servicios y llamadas; los cinco casos de gamification.audit.integration.test.js usan repositorios en memoria. No demuestran PostgreSQL. La nueva prueba del panel usa servicios y router simulados. Los diez casos Edge también son contratos locales, sin envío real a proveedores.

## Integración real y gamificación

Los **17/17 casos** de [../../../../../tests/integration/gamification.local.test.cjs](../../../../../tests/integration/gamification.local.test.cjs) pasan por Auth, REST, repositorios de producción, RPC y PostgreSQL local. [integracion/integracion-17-final.stdout.log](integracion/integracion-17-final.stdout.log) y su [integracion/integracion-17-final.meta.json](integracion/integracion-17-final.meta.json). Las notificaciones comerciales se desacoplan para evitar envío externo; no se simula la persistencia. Los registros se crean exclusivamente en el backend descartable. El catálogo sintético de campaña se inserta mediante DML del propietario local, sin cambiar grants ni políticas; las consultas funcionales usan cuentas autenticadas.

G01/G02/G03/G04/G06/G07 comprueban XP, nivel e historial; G14 racha de tres días hábiles; G08 logros, retos y clasificación; G16 campaña; G10/G15 identidad, avatar y título; G11/G12/G13 wallet, compra y equipamiento; G09 ingreso diario de 8 XP una vez al día. G02/G04/G05/G06 enlazan asistencia, alta/modificación de pago y evaluación con gamificación. G08 comprueba existencia de un snapshot de clasificación del atleta de fixture, sin verificar su categoría, posición ni ordenación; ese aspecto permanece parcialmente comprobado. G17 acredita entrega de recuperación en SMTP/Mailpit **local**, sin cambiar la contraseña ni probar Resend o FCM reales. Las categorías pueden compartir casos y no deben sumarse.

## Playwright

- publicas-finales: 133/133, cero omitidos; 142.437 s; [publicas-finales/html/index.html](publicas-finales/html/index.html).
- paneles-finales: 105/105, cero omitidos; 564.079 s; [paneles-finales/html/index.html](paneles-finales/html/index.html).
- mutaciones-finales: 7/7, cero omitidos; 134.864 s; [mutaciones-finales/html/index.html](mutaciones-finales/html/index.html).
- limites-finales: 4/4, cero omitidos; 25.141 s; [limites-finales/html/index.html](limites-finales/html/index.html).

Siete perfiles entre 390 y 1920 px y límites adicionales 481/600/767/768 px. Incluyen navegación pública y paneles, controles de acceso visual, filtros, búsqueda, ordenación y siete flujos administrativos que escriben datos descartables. Las 28 instancias del archivo auth.password-recovery.spec.js interceptan Auth/REST: verifican UI y navegación, no autenticación remota. La entrega real local se comprueba separadamente mediante G17. Las demás autenticaciones por rol usan Auth local. Las trazas/vídeos se deshabilitan para reducir exposición de sesiones; se conservan HTML/JSON y capturas pertinentes. No se realizó evaluación de interacción con participantes.

## Correcciones y ciclos de verificación

- Panel del atleta: se resuelve acceso anónimo/rol ajeno antes de consultar datos, se ignoran respuestas antiguas y se libera loading de la petición vigente, incluida una carga silenciosa superpuesta. Regresión de siete casos: [jest-access-race-red.json](jest-access-race-red.json) → [jest-access-race-green.json](jest-access-race-green.json); las 21 denegaciones públicas en navegador forman parte de la regresión final.
- Cambio de membresía de un pago: se envía monto nulo al cambiar la membresía para que el trigger calcule el precio vigente; se preserva el precio histórico cuando no cambia. [jest-payments-red.json](jest-payments-red.json) → [jest-payments-green.json](jest-payments-green.json); G05 comprueba 35 →32,50 en PostgreSQL.
- Instrumentación Android: la plantilla esperaba com.getcapacitor.app y ahora verifica com.riovoley.app, applicationId del producto. [android/instrumentacion-red.json](android/instrumentacion-red.json) → [android/instrumentacion-final.json](android/instrumentacion-final.json). No se cambió la expectativa de un requisito funcional para ocultar un defecto.
- Guardia de integración: fetch rechaza redirecciones incluso si el llamador solicita seguirlas; [unitarias/guard-red.stdout.log](unitarias/guard-red.stdout.log) → [unitarias/guard-green.stdout.log](unitarias/guard-green.stdout.log).
- Los 17 fallos E2E corregidos en la etapa anterior (selectores/esperas de asistencia, ordenación y controles móviles de pagos) permanecen cubiertos por esta regresión. Evidencia anterior: [../20261028-101418-correcciones-c71f55e/fallos-corregidos.json](../20261028-101418-correcciones-c71f55e/fallos-corregidos.json).

Los intentos de integración anteriores también conservan expectativas ajustadas al contrato inspeccionado (physical_test, vista de inventario, campos del shop, nickname único y acceso autenticado al catálogo), y el primer intento WebView por CDP que no conectó. No se presentan esos intentos como aprobados; el resultado final usa el mecanismo AndroidWebView real de Playwright.

En la repetición del APK actualizado, el primer intento de instalación quedó bloqueado al dejar de responder el emulador. Se detuvo exclusivamente el proceso del AVD propio, se conservó el código 1 y el log, y se reinició el mismo AVD sin borrar datos. La instalación posterior mediante transferencia no streaming y la instrumentación terminaron con salida0; los comandos ADB tienen ahora un plazo explícito para evitar esperas indefinidas. Las evidencias de ambos intentos se conservan en android/apk-instalar-final*. El chequeo adicional de SortableHeader aprobó seis casos ya incluidos en 404; no aumenta ese denominador.

## Compilación web y Android

Compilación web local final: [compilacion-web-build-1793217928426.meta.json](compilacion-web-build-1793217928426.meta.json), salida 0, 45.027 s; build de producción en runtime privado, no distribuido. [compilacion-web-build-1793217928426.stdout.log](compilacion-web-build-1793217928426.stdout.log) conserva advertencias de CRA/ESLint/tamaño. Compilar no verifica por sí solo todos los módulos.

Android: JDK21.0.12.1+1 portátil, SDK36/revisión2, build-tools35.0.0, Gradle8.14.3, AGP8.13.0. Capacitor core/android8.6.0 tras actualizaciones compatibles; CLI8.4.0. Se sincronizaron siete plugins y se ejecutaron assembleDebug y testDebugUnitTest: [../../verificacion-tecnica/20261028-200050-android-actualizado-c71f55e/android/gradle-assemble.meta.json](../../verificacion-tecnica/20261028-200050-android-actualizado-c71f55e/android/gradle-assemble.meta.json). El JUnit JVM contiene únicamente la plantilla aritmética 2+2, separada del caso instrumentado de contexto. Se conserva Lint y sus avisos en el expediente nativo; no equivalen a fallos de casos.

Lint registró **0 errores y 29 advertencias**: [../../verificacion-tecnica/20261028-200050-android-actualizado-c71f55e/android/lint/lint-results-debug.txt](../../verificacion-tecnica/20261028-200050-android-actualizado-c71f55e/android/lint/lint-results-debug.txt), [../../verificacion-tecnica/20261028-200050-android-actualizado-c71f55e/android/lint/lint-results-debug.html](../../verificacion-tecnica/20261028-200050-android-actualizado-c71f55e/android/lint/lint-results-debug.html). Se conserva también el aviso de incompatibilidad entre versiones del formato XML de las herramientas SDK. El estado de instalación posterior a exportar el artefacto consta en [android/estado-runtime-final.json](android/estado-runtime-final.json).

APK debug **35144355 bytes**, SHA-256 **20fc358ecd1d27c87d887898617b5595e66f03d20a83f3b8ee3c2e8ea374b704**, [../../verificacion-tecnica/20261028-200050-android-actualizado-c71f55e/android/artefactos/riovoley-auditoria-debug-sin-credenciales.apk](../../verificacion-tecnica/20261028-200050-android-actualizado-c71f55e/android/artefactos/riovoley-auditoria-debug-sin-credenciales.apk). El archivo se inspeccionó en todos sus miembros antes de exportarlo y se verificó su firma de depuración. El emulador propio API36 x86_64 con WHPX ejecutó la instrumentación y cargó React dentro de MainActivity/WebView; se comprobaron las tres rutas protegidas sin sesión. [android/webview-final.json](android/webview-final.json), [android/webview-final-inicio.png](android/webview-final-inicio.png), [android/webview-final-denegacion.png](android/webview-final-denegacion.png). El APK offline no acredita login contra producción, notificaciones FCM, OTA, servicios Google ni ejecución en dispositivo físico. No se publicó ni distribuyó.

## Seguridad y dependencias

Consulta local actual de solo lectura: [seguridad/catalogo-local-lectura.stdout.log](seguridad/catalogo-local-lectura.stdout.log). **xp_ledger y login_rewards tienen RLS activo**, pero políticas ALL admiten escrituras del propietario; RLS habilitado no demuestra integridad de XP o recompensas. Las cuatro firmas de soft_delete_payment/restore_payment siguen siendo SECURITY DEFINER, ejecutables por anon y sin actor explícito en el cuerpo observado. No se invocaron para modificar registros. La lectura institucional anterior permanece en el expediente inicial; no se afirma haber vuelto a auditar el backend remoto en esta etapa.

| Árbol npm | Avisos antes →después | Críticos antes →después | Altos antes →después | Moderados antes →después |
|---|---:|---:|---:|---:|
| raiz | 63 →35 | 5 →0 | 29 →13 | 11 →6 |
| functions | 39 →62 | 3 →0 | 15 →5 | 21 →57 |
| auxiliar | 5 →0 | 0 →0 | 4 →0 | 1 →0 |

Se ejecutó npm audit fix --ignore-scripts --json, sin --force. Los críticos quedaron en cero, pero functions pasó de 39 a 62 avisos totales por el aumento de moderados (21→57). No se declara eliminado el riesgo: raíz conserva 13 altos y functions 5. Se rechazaron propuestas incompatibles como react-scripts0.0.0 y una degradación mayor de Genkit. Las comparaciones y JSON npm conservan denominadores independientes. Build/lint de functions y lint auxiliar finalizaron con salida 0: [integracion/functions-build.meta.json](integracion/functions-build.meta.json), [integracion/functions-lint.meta.json](integracion/functions-lint.meta.json), [integracion/auxiliar-lint.meta.json](integracion/auxiliar-lint.meta.json). El árbol auxiliar declara Node22 frente al Node24 utilizado; se documenta la diferencia sin cambiar la instalación global.

La corrección de RPC/RLS requiere autorización explícita según la restricción original del usuario. [../../../../../database/security/REVISION_Y_AUTORIZACION_PENDIENTE.md](../../../../../database/security/REVISION_Y_AUTORIZACION_PENDIENTE.md) contiene alcance, riesgos del trigger, escrituras directas y ambigüedad de sobrecargas. El SQL adjunto es un borrador parcial **no listo para aplicar**, sin validación dinámica; no se presenta como una remediación terminada. Se necesita un cambio coordinado de pagos y del contrato de escritura de XP/wallet/recompensa diaria, primero en el entorno descartable. La revisión presente no constituye una auditoría de penetración completa.

## Integridad, límites y pendientes

Las cantidades se derivan de JSON/TAP/JUnit, no de filas inventadas. [RESUMEN_CIERRE.json](RESUMEN_CIERRE.json), [casos-e2e-detallados.json](casos-e2e-detallados.json) y [casos-jest-detallados.json](casos-jest-detallados.json) permiten contrastarlas. [PRIVACIDAD.json](PRIVACIDAD.json), [INTEGRIDAD.json](INTEGRIDAD.json) y [MANIFIESTO_SHA256.json](MANIFIESTO_SHA256.json) documentan cierre y huellas; el manifiesto se excluye a sí mismo. Se verifican también los cuatro expedientes previos sin reescribirlos.

Pendientes: endurecimiento RLS/RPC autorizado y validado, avisos npm residuales, proveedores comerciales de correo/push, dispositivo físico y flujos nativos autenticados. No hay resultados USE/UES-SF ni inferencias sobre motivación/usabilidad. El texto de tesis es propuesta separada; no se modificó el documento académico.

