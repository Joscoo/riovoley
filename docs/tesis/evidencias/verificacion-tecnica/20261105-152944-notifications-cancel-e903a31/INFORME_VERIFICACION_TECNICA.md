# Corrección de cargas de notificaciones tras cierre de sesión

RIOVOLEY. Base de trabajo e903a31788acde429bff07fe27f2b8e8a6b12135; inicio UTC 2026-11-05T15:29:44.143Z. Fuentes del APK corregido: 5f605512448f0683e8ddc52e197e42fa5d909868. Las fuentes del producto se confirmaron en Git después de aprobar Jest y antes de compilar; el expediente y el arnés se publican en un commit posterior. [Fuentes y hashes](FUENTES_EVALUADAS.json), [contexto](CONTEXTO.json).

## Problema y cambio

El [diagnóstico previo](../20261105-151232-http401-726602a/INFORME_VERIFICACION_TECNICA.md) no reprodujo los errores en una repetición nativa sin intervención (14/14, 298 respuestas sin error). Un escenario controlado de Chromium retuvo respuestas reales de anuncios hasta completar logout y reprodujo consultas anónimas de logros rechazadas con HTTP401/42501. No se atribuyó retrospectivamente esa fase a los dos errores históricos que no la registraron. La corrección se dirige a la continuación asíncrona obsoleta identificada, no a abrir permisos.

[src/features/notifications/presentation/components/NotificationBell.js](../../../../../src/features/notifications/presentation/components/NotificationBell.js) ahora cancela la carga al desmontar, cambiar usuario/rol o iniciar otra recarga y evita aplicar resultados/errores de cargas canceladas. [src/features/notifications/presentation/createNotificationsService.js](../../../../../src/features/notifications/presentation/createNotificationsService.js) pasa AbortSignal opcional; [src/features/notifications/application/useCases/createNotificationsUseCases.js](../../../../../src/features/notifications/application/useCases/createNotificationsUseCases.js) lo comprueba antes de iniciar y después de cada await de esa carga. La cancelación es cooperativa: detiene lecturas posteriores y actualizaciones obsoletas; no promete interrumpir HTTP ya enviado. Las cargas activas y los errores reales conservan su tratamiento. No se cambió Supabase, RLS, grants, credenciales o lógica de pagos/asistencias.

El test de acceso de NotificationBell conserva el mismo rol y usuario y exige además un AbortSignal real, conforme al contrato extendido. No se eliminó una restricción de acceso para aprobarlo. La revisión independiente detectó una comprobación ausente tras el await exterior del helper de pagos; una regresión de microtareas falló antes de corregirla. La revisión posterior no encontró bloqueantes. [Revisión](seguridad/revision-codigo.json), [RED de microtarea](unitarias/microtarea-rojo.json).

## Método y entorno

Windows 10.0.26300 x64; Node v24.18.0 y npm 11.16.0 según la [consulta actual](seguridad/herramientas-actuales-corregido.stdout.log), JDK21 y SDK/AVD API36 portables del laboratorio, Gradle8.14.3 según el entorno de compilación previo. Las versiones no se actualizan en esta fase. La primera consulta de versiones falló con código 1 porque el entorno mínimo no incluía ComSpec; se conservó el error y se corrigió la ruta de cmd.exe usando SystemRoot, con código 0. No fue un fallo del producto. Jest/Testing Library con dependencias simuladas e inputs sintéticos; CRA con CI=true y dotenv desactivado. El build nativo se hace en copia privada, omitiendo keystore institucional y google-services.json, con OTA automático desactivado y endpoints loopback cerrados. Auth/REST/PostgreSQL y cuentas sintéticas del laboratorio para los E2E, sin servicios institucionales. [Comandos exactos, tiempos y códigos](COMANDOS.json).

Se ejecutaron [scripts/audit/production/run-operational-jest.cjs](../../../../../scripts/audit/production/run-operational-jest.cjs) --label=jest-definitivo; build-local-android.cjs (CRA, Capacitor sync android, :app:assembleDebug :app:testDebugUnitTest --offline); inspecciones ZIP/firma/privacidad; [scripts/audit/android/reproduce-notification-signout.cjs](../../../../../scripts/audit/android/reproduce-notification-signout.cjs) --expect-cancelled; launch-local-candidate.cjs --current-build --trace-auth. El APK no se distribuye.

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| JEST | Regresión completa, 91 suites | 434 | 434 | 0 | 0 | APROBADO | [JSON](unitarias/jest-definitivo.json) |
| NOTIF | Módulo notificaciones; subconjunto JEST | 22 | 22 | 0 | 0 | APROBADO | JSON JEST, ocho casos nuevos separados |
| CTRL | Regresión con entrega retardada de anuncios reales | 1 | 1 | 0 | 0 | APROBADO | [Resultado](e2e/cierre-notificaciones-corregido.json) |
| NATIVE | WebView real/Auth/REST/PostgreSQL locales | 14 | 14 | 0 | 0 | APROBADO | [Casos](android/candidato-actual.json) |
| GUARD | Perfil, rutas y privacidad del clasificador | 19 | 19 | 0 | 0 | APROBADO | [TAP](unitarias/guardas-locales-finales.stdout.log) |
| JUNIT | Operación aritmética de plantilla | 1 | 1 | 0 | 0 | APROBADO | [Inspección](android/apk-local-inspeccion-cierre.json) |
| BUILD | Compilación web, sync y APK debug (operaciones) | — | — | — | — | APROBADO | [Metadatos](android/reconstruccion-corregida-comando.meta.json) |
| PROD | Release firmado y transición institucional | 0 | 0 | 0 | 0 | NO EJECUTADO | Sin claves nuevas, firma release o despliegue |

No sumar denominadores de herramientas o subconjuntos. Jest final duró 26.404 s; el comando WebView nativo, 143.738 s, sin incluir el arranque del AVD. El caso de App.test.js preexistente es placeholder y no demuestra comportamiento funcional. Los contratos e integración en memoria existentes se repitieron dentro de Jest; sus mocks no demuestran persistencia. Los ocho casos nuevos comprueban señal preabortada, cancelación en pagos/anuncios/continuación exterior, carga activa y ciclo de vida/resultados obsoletos del componente.

El RED inicial ejecutó seis casos (uno aprobado y cinco fallidos), y la primera implementación aprobó 20 casos de notificaciones y una regresión completa de 432 casos. Después de la revisión se añadieron dos regresiones y se corrigió el salto entre promesas: la ejecución final es 434/434 en 91 suites; se conservan los intentos previos sin sobrescribirlos. [RED inicial](unitarias/cancelacion-rojo.json), [primer verde](unitarias/cancelacion-verde.json), [432 previos](unitarias/jest-cierre.json), [final](unitarias/jest-definitivo.json).

Cobertura instrumentada final: líneas 5059/11813 (42.82 %), sentencias 5400/13023 (41.46 %), funciones 1245/3371 (36.93 %) y ramas 3969/11709 (33.89 %). Corresponde al conjunto instrumentado por la configuración efectiva; no es porcentaje de funciones del sistema ni de preparación productiva. [Resumen original](unitarias/cobertura-jest-definitivo/coverage-summary.json).

## Cliente compilado y Android

El escenario controlado conserva respuestas reales sin modificar contenido ni permisos y cambia explícitamente su expectativa: en la versión previa se buscaba reproducir la consulta tardía; en la corregida se exige que no se inicie una nueva consulta de logros después de cancelar. Se observaron cero durante 1500 ms tras liberar las respuestas. La ventana es acotada y no prueba todos los posibles intercalados. Se mantienen las pruebas previas y las regresiones unitarias deterministas de cancelación. Es Chromium de escritorio con viewport móvil, no otra ejecución Android. [Intervención y resultado](e2e/cierre-notificaciones-corregido.json).

El APK mide 31076464 bytes y su SHA-256 es 6d552150179f818bce9bc587a079f49413efa22a3dd990651498b9c29088303c. Los 65 archivos web coinciden con los 65 empaquetados. Reconstrucción: 393.702 s, código 0; React 204.662 s, sincronización 10.506 s y Gradle 168.868 s. El total incluye copias e inspecciones. [Recibo](android/apk-local-compilado.json), [ZIP/JUnit](android/apk-local-inspeccion-cierre.json). La firma es debug, no la identidad institucional. El único JUnit es addition_isCorrect y se separa de los casos funcionales. Los avisos reales de Node/Gradle/Kotlin permanecen en los [logs](android/gradle.stdout.log); no se editó node_modules para eliminarlos.

El APK corregido ejecutó 14 casos nativos, 14 aprobados y 0 fallidos, con 0 no ejecutados y 0 errores de limpieza. Se registraron 310 respuestas locales, 0 con HTTP >=400. Esto no valida todas las pantallas internas: las capturas pueden mostrar estados de carga. [Revisión visual](android/capturas-revisadas.json). La consulta posterior confirmó la recompensa diaria y el movimiento único de XP; [consulta tras parada](integracion/recompensa-tras-parada.json). El emulador propio quedó detenido: true. El proxy no reenvía y las rutas se comprueban sobre main, sin certificar todas las tablas de políticas.

## Límites y entrega

La corrección no altera permisos, no valida proveedores externos, FCM, correo, recuperación real con token o instalación OTA. La firma de un release actualizado y la transición coordinada de SQL/Edge/clientes permanecen pendientes. No se cambió producción ni se publicaron paquetes. Las pruebas técnicas no sustentan resultados de usabilidad, motivación, USE o UES-SF.

Los tres documentos se generan desde JSON originales mediante [scripts/audit/android/report-notification-fix.cjs](../../../../../scripts/audit/android/report-notification-fix.cjs). El [manifiesto](MANIFIESTO_SHA256.json), la [integridad](INTEGRIDAD.json) y la [privacidad](PRIVACIDAD.json) respaldan la custodia. El APK y los volcados completos permanecen privados. El CI del commit que incluya el expediente se comprueba después del sellado, sin alterar este paquete.

