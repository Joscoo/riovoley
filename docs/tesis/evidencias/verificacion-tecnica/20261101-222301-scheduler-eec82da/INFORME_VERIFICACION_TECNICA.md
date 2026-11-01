# Informe de verificación técnica: secreto del scheduler y Android

## 1. Identificación, fecha y entorno

RIOVOLEY, https://github.com/Joscoo/riovoley. Commit base eec82da6ceb8ab3517fea6a9db150517265ca3bc; rama fix/seguridad-local-20261029 y cambios inventariados en FUENTES_EVALUADAS.json. Inicio 2026-11-01T22:23:01.938Z; corte 2026-11-01T23:05:50.995Z; UTC, Ecuador UTC−5. Entorno Windows, Node 24.18.0, npm 11.16.0, Python 3.11.9, CLI Supabase 2.122.0, GnuPG 2.4.9 y DPAPI CurrentUser. Android usa el JDK21 y SDK previamente verificados; imagen Android36 google_apis x86_64 y herramientas locales. Las configuraciones privadas no se incluyen en Git ni en este informe.

El usuario respondió CONTINUA después de la solicitud concreta para crear solo REPORTS_SCHEDULER_SECRET en mayvvlkvheagkojunzzb. Se interpretó como autorización dentro de ese alcance. No se extendió a SQL, permisos, funciones, jobs, mensajes o despliegues. En esta fase sí cambió una configuración de producción: se creó ese único secreto. No se modificaron datos de negocio ni esquema. [CONTEXTO.json](CONTEXTO.json).

## 2. Metodología y comandos reproducibles

[COMANDOS.json](COMANDOS.json) conserva argumentos, fechas, códigos de salida y alcance. La copia cifrada y el APK se mantienen en directorios privados; una reproducción requiere un expediente nuevo. No volver a ejecutar la creación sobre un secreto existente ni apuntar el harness a una carpeta sellada.

- node --test --test-reporter=tap tests/unit/scheduler-secret.test.cjs: guardas y contratos con dependencias sintéticas.
- node --test --test-reporter=tap tests/unit/production-backup.test.cjs: regresión tras exportar keyHome, sin acceso institucional.
- node --test --test-reporter=tap tests/unit/supabase-config-summary.test.cjs tests/unit/scheduler-secret.test.cjs tests/unit/android-offline-state.test.cjs: grupo añadido al workflow technical-readiness; aquí se registra su ejecución local.
- node scripts/audit/production/test-scheduler-channel.cjs: CLI real con perfil que apunta únicamente a HTTP loopback; una tubería Windows, datos sintéticos y cifrado local real. Requiere Windows, CLI privada y destinatario público del respaldo existente; no crea secretos Cloud.
- node scripts/production/create-scheduler-secret.cjs --create-authorized: comando sensible ya ejecutado una vez con escritura real. No es un test para repetir. Comprueba ausencia dos veces, prepara recuperación, ejecuta secrets set desde configuración mínima fuera del repositorio y verifica lectura/digests en memoria. El primer intento se detuvo antes de cualquier escritura por diferencia de esquema del listado.
- node scripts/audit/production/verify-scheduler-custody.cjs: recuperación del archivo DPAPI almacenado, comparación con digest actual por lectura, escaneo del nuevo valor en archivos públicos y copia de cifrados a la custodia local separada.
- node scripts/audit/production/smoke-signed-android-offline.cjs: AVD nuevo, proxy que no reenvía, modo avión/Wi-Fi y ausencia de rutas predeterminadas IPv4/IPv6 antes de instalar. Utiliza exclusivamente el APK firmado existente y detiene su propio emulador al terminar.

La documentación oficial indica que los secretos nuevos están disponibles sin redesplegar funciones ([Supabase](https://supabase.com/docs/guides/functions/secrets). La fuente de CLI 2.122 confirma la combinación de config/env-file/argumentos y que el listado JSON conserva el campo value que la tabla rotula DIGEST ([set.handler](https://github.com/supabase/cli/blob/v2.122.0/apps/cli/src/commands/secrets/set/set.handler.ts), [secrets.format](https://github.com/supabase/cli/blob/v2.122.0/apps/cli/src/commands/secrets/secrets.format.ts). Por ello se aisló config.toml y se normalizó únicamente un value de formato SHA-256, sin publicarlo. Se revisaron la ayuda instalada y el changelog; TLS moderno del proceso se conservó. No se usó npm audit fix --force.

## 3. Resultados por herramienta y denominador

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| U01 | Guardas del scheduler (Node) | 12 | 12 | 0 | 0 | APROBADO | [unitarias/scheduler-cli-esquema-verde.stdout.log](unitarias/scheduler-cli-esquema-verde.stdout.log) |
| U02 | Regresión del respaldo (Node) | 10 | 10 | 0 | 0 | APROBADO | [unitarias/scheduler-respaldo-regresion.stdout.log](unitarias/scheduler-respaldo-regresion.stdout.log) |
| U03 | Grupo CI de configuración/scheduler, incluye U01 | 26 | 26 | 0 | 0 | APROBADO; no sumar repeticiones | [unitarias/configuracion-scheduler-android-ci.stdout.log](unitarias/configuracion-scheduler-android-ci.stdout.log) |
| I01 | Flujo CLI/tubería con HTTP local | 1 flujo | 1 flujo | 0 | 0 | APROBADO con API simulada local | [integracion/scheduler-canal-sintetico.json](integracion/scheduler-canal-sintetico.json) |
| I02 | Protección DPAPI/GPG sintética | 1 flujo | 1 flujo | 0 | 0 | APROBADO; cifrado real local | [integracion/scheduler-proteccion-sintetica.json](integracion/scheduler-proteccion-sintetica.json) |
| S01 | Preflight inicial del creador | — | — | — | — | FALLIDO antes de escribir: esquema de CLI | [seguridad/scheduler-creacion-autorizada.meta.json](seguridad/scheduler-creacion-autorizada.meta.json) |
| S02 | Creación autorizada y lectura del secreto | — | — | — | — | APROBADO; una operación real, no un test | [seguridad/scheduler-secreto-creado.json](seguridad/scheduler-secreto-creado.json) |
| S03 | Recuperación DPAPI y custodia cifrada | — | — | — | — | APROBADO; lectura y recuperación real | [seguridad/scheduler-recuperacion-custodia.json](seguridad/scheduler-recuperacion-custodia.json) |
| A00 | Intentos fallidos del arnes Android conservados | 6 intentos | 0 | 6 intentos | 0 | FALLIDOS; no casos funcionales nuevos | [android/intentos-offline.json](android/intentos-offline.json) |
| A01 | Instalación/arranque e intent nativo sin red | — | — | 0 | 0 | BLOQUEADO visual; instalacion/actividad comprobadas | [android/release-observaciones-parciales.json](android/release-observaciones-parciales.json) |
| J01 | Jest del producto antes del corte | 0 | 0 | 0 | 0 | NO EJECUTADO en esta fase | [INFORME_VERIFICACION_TECNICA.md](INFORME_VERIFICACION_TECNICA.md) |
| E01 | Playwright en esta fase | 0 | 0 | 0 | 0 | NO EJECUTADO | [INFORME_VERIFICACION_TECNICA.md](INFORME_VERIFICACION_TECNICA.md) |
| W01 | Nueva compilación web/Android | 0 | 0 | 0 | 0 | NO EJECUTADO; se usa APK ya verificado | [INFORME_VERIFICACION_TECNICA.md](INFORME_VERIFICACION_TECNICA.md) |

Las operaciones de configuración, archivos y flujos de herramientas no se suman a los casos Node. El grupo de 26 incluye los 12 del scheduler, diez del parser Auth y cuatro del parser de actividad Android; las repeticiones no son casos únicos adicionales. Las duraciones exactas de cada proceso están en sus archivos .meta.json.

## 4. Unitarias, componentes, contratos e integración

Las 12 guardas verifican destino/autorización, rechazo de listado inválido/duplicado/sin digest, normalización del esquema real de CLI, valor aleatorio de 32 bytes, prohibición de sobrescritura, carrera de aparición entre lecturas, fallo al proteger, digest posterior y conservación de otros secretos. El acuse incierto y un readback distinto no provocan otra escritura. Los callbacks de lista/protección/escritura son sintéticos: estos tests no prueban Supabase real. Las diez regresiones de respaldo comprobaron la compatibilidad del módulo tras exportar keyHome. El grupo CI de 26 añadió las diez fixtures del parser Auth y cuatro del formato de actividad Android; estas últimas reproducen el cambio de mResumedActivity a topResumedActivity y diferencian el ANR de System UI.

El flujo de CLI usó el binario real, una tubería real y un servidor HTTP local que simuló la API de administración: recibió exactamente una entrada del nombre esperado. El valor no apareció en argumentos o salida. DPAPI y GPG cifraron una fixture local real; esa prueba no contactó producción. [integracion/scheduler-canal-sintetico.json](integracion/scheduler-canal-sintetico.json), [integracion/scheduler-proteccion-sintetica.json](integracion/scheduler-proteccion-sintetica.json).

No se ejecutaron casos de uso nuevos de pagos, asistencias, evaluaciones o gamificación sobre PostgreSQL en esta fase. El expediente anterior conserva 419/419 Jest, 88 suites, cobertura de líneas 42,96 % y el ensayo SQL real aislado de cuatro etapas; son antecedentes separados. [../20261101-163241-cierre-operativo-2589935/INFORME_VERIFICACION_TECNICA.md](../20261101-163241-cierre-operativo-2589935/INFORME_VERIFICACION_TECNICA.md).

## 5. Seguridad, permisos y resultado institucional

La creación real terminó con SCHEDULER_SECRET_CREATED_VERIFIED, código0, un solo intento de escritura y una sola entrada en el acuse de CLI. El digest del nuevo valor coincidió en memoria y todos los demás digests permanecieron iguales. Los seis nombres personalizados requeridos están presentes. No se publicaron valores o digests del servicio, ni se pasaron por argumentos o archivos en claro. [seguridad/scheduler-secreto-creado.json](seguridad/scheduler-secreto-creado.json), [seguridad/scheduler-secreto-escritura.meta.json](seguridad/scheduler-secreto-escritura.meta.json).

El archivo DPAPI almacenado se recuperó posteriormente para el mismo usuario local y su valor coincidió con el digest vigente. La copia GPG usa el destinatario del respaldo ya existente; no se repitió su descifrado con frase. Se copiaron los dos archivos cifrados fuera del repositorio, con hashes coincidentes; no se acredita custodia en otro dispositivo. El escaneo comparó el nuevo secreto contra archivos públicos sin encontrar coincidencias, sin publicar el valor usado en esa comparación. [seguridad/scheduler-recuperacion-custodia.json](seguridad/scheduler-recuperacion-custodia.json).

Configurar el secreto no activa ni acredita un emisor del scheduler, un job o la entrega Resend/FCM. No se enviaron mensajes. No se reejecutaron advisors, npm audit, pruebas de RLS o RPC de negocio institucional en esta fase; sus estados anteriores permanecen antecedentes, no se presentan como nuevas mediciones o correcciones aplicadas. Este alcance no es un pentest completo.

## 6. Playwright y compilación web

No hubo Playwright nuevo antes del corte ni nueva compilación web. El CI de eec82da terminó satisfactoriamente al cerrar la fase anterior y sus logs están conservados de forma privada, con enlace verificable [run41351578523](https://github.com/Joscoo/riovoley/actions/runs/41351578523). El workflow incorpora ahora el grupo sintético de configuración/scheduler; su futura ejecución sobre el commit de publicación debe comprobarse por separado. No se da por aprobada de antemano. No se ejecutó login o escritura institucional para completar tablas.

## 7. Android

El APK firmado quedó instalado y su hash en el dispositivo coincidió con el original. El registro ADB topResumedActivity acredita MainActivity de RIOVOLEY en primer plano, pero System UI presentó un ANR. El resultado visual e intent nativo permanece BLOQUEADO; no se consultó el buffer de crash antes del cierre del diagnóstico ni se acredita recuperación de contraseña. El reanálisis usa el snapshot real conservado, no una ejecución nueva del APK. [android/release-observaciones-parciales.json](android/release-observaciones-parciales.json).

Se conservan 6 intentos fallidos del arnés Android, incluidos sondeos que terminaron antes de arrancar la imagen. El primero se detuvo con svc data disable código20 antes de instalar el APK; el segundo agotó los 30 segundos de instalación y no se le atribuye una instalación aprobada. El ensayo de cierre aumenta la memoria de1536 a3072MB, espera los servicios package/activity y permite120 segundos de instalación. Se preservó el intento; en el siguiente, ese comando se registra como incidencia y la autorización para instalar depende de comprobaciones independientes y más estrictas de modo avión, Wi-Fi y rutas IPv4/IPv6. También se conservan la espera ActivityManager no aprobada y los errores EEXIST del ejecutor al reanudar; se corrigió la asignación de logs para conservar archivos anteriores. El arnés exige actividad visible, capturas y buffer de crash, además del acuse del comando, pero esta ejecución se detuvo antes de obtener capturas y leer ese buffer; un timeout de espera no se trata por sí solo como un crash ni como una aprobación. No se suprimen los fallos del registro. El diagnóstico permanece privado. Esta verificación de instalación/arranque e intent nativo, cuando aprobada, no es una nueva compilación ni acredita backend, login, recuperación con token válido, correo o flujos deportivos. No se distribuyó el paquete ni se usó un dispositivo físico. No se generaron capturas de interfaz utilizables: el ejecutor se detuvo antes de capturarlas. No se crean imágenes ficticias.

## 8. Incidencias, limitaciones e integridad

Se conservaron los ensayos fallidos del perfil CLI incompleto, la política PowerShell local de ejecución de scripts, la integración keyHome no exportada y el listado JSON con value como digest. Se corrigieron perfil/canal y exportación, se usó Bypass solo en el proceso hijo, y se añadieron regresiones para el esquema observado. La revisión independiente detectó keyHome y un recuento constante; ambos se corrigieron y el recuento final procede del readback. El primer creador se detuvo con cero escrituras; después de corregir la lectura hubo exactamente una escritura real satisfactoria. No se ocultaron resultados intermedios ni se cambió lógica del producto para aprobar casos.

El inventario local de archivos seleccionados no acredita acceso a credenciales de proveedores y no existe conector Resend/FCM disponible; no se enviaron mensajes ni se solicitaron destinatarios reales. [seguridad/proveedores-disponibilidad-local.json](seguridad/proveedores-disponibilidad-local.json). Siguen pendientes la identificación/configuración del emisor, pruebas controladas de Resend/FCM y correo de recuperación, la verificación funcional móvil con backend aislado y la preparación final de una ventana coordinada SQL→Edge→clientes. No se aplicaron propuestas SQL ni se promovieron funciones, web, OTA o APK. Las alertas gestionadas y la RPC diaria ausente documentadas anteriormente no se corrigieron mediante la creación del secreto. Las autorizaciones recibidas no se extienden a esos cambios. No se atribuyen resultados de usabilidad, motivación, USE o UES-SF a estas verificaciones.

[MATRIZ_VERIFICACIONES_TESIS.md](MATRIZ_VERIFICACIONES_TESIS.md), [RESULTADOS_PARA_TESIS_4_5.md](RESULTADOS_PARA_TESIS_4_5.md), [RESULTADOS_AUTOMATIZADOS.json](RESULTADOS_AUTOMATIZADOS.json), [PRIVACIDAD.json](PRIVACIDAD.json), [INTEGRIDAD.json](INTEGRIDAD.json), [MANIFIESTO_SHA256.json](MANIFIESTO_SHA256.json). El documento original de tesis permanece sin modificaciones.
