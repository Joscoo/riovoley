# Verificación nativa Android del candidato

## Identificación, entorno y alcance

RIOVOLEY, commit base **7e9a27dd2b248a626a4440ece2e7227ba5e47ae5**, rama fix/seguridad-local-20261029. Inicio del intento efectivo 2026-11-04T21:18:15.823Z; corte 2026-11-04T21:57:34.724Z; UTC (Ecuador UTC−5). Windows 11, Node 24.18.0, npm 11.16.0, JDK 21.0.12.1, herramientas Android 35.0.0 y emulador local con imagen API 36. Las versiones medidas están en [HERRAMIENTAS.json](HERRAMIENTAS.json). No hubo nueva compilación web o nativa en esta fase.

Se ejecutó el APK debug existente, construido sobre **7eee99c36e4125570351d7ffaec97f0cc8cd265c**: 31076228 bytes, SHA-256 **5f059b7387cc096326cdb3936eaceca535acd4a53d6af2f63cdb18a2ab18cb9d**. Se volvió a comparar el archivo y sus 65 assets web con la salida original; además, un caso verificó el hash del APK instalado mediante ADB. No se distribuyó el paquete. [Recibo anterior referenciado](android/apk-local-compilado.json), [inspección nueva](android/apk-local-inspeccion-cierre.json), [casos y hash instalado](android/candidato-actual.json).

El laboratorio usó Supabase Auth, REST y PostgreSQL locales reales, con cuentas sintéticas existentes, API 127.0.0.1:55321 y PostgreSQL 55322. El driver comprobó la identidad del administrador canónico local antes de abrir el ensayo. Se usó un AVD nuevo propio, WHPX, GPU host, 1536 MiB de RAM, 2 núcleos y pantalla configurada 360×720 a 240 dpi. Es un emulador Android real, no un viewport de navegador de escritorio. [android/perfil-ejecutado.json](android/perfil-ejecutado.json), [aceleración medida](android/aceleracion-verificada.stdout.log), [CONTEXTO.json](CONTEXTO.json).

El primer inicializador de ADB falló antes de crear el emulador al indicar explícitamente un socket que ADB trató como remoto. Se conservó la salida 4294967295. El segundo intento inició ADB con su configuración predeterminada y verificó que escucha solo en loopback. La corrección fue del arnés; el APK y la suite funcional no se alteraron. [Intento inicial conservado](../20261104-211658-android-webview-7e9a27d/INFORME_VERIFICACION_TECNICA.md), [android/adb-servidor-local.meta.json](android/adb-servidor-local.meta.json), [android/adb-listen-local.meta.json](android/adb-listen-local.meta.json).

## Metodología y comandos

- node scripts/audit/android/launch-local-candidate.cjs: crea el contexto nuevo, comprueba backend/artefacto, crea su AVD, verifica red, instala el APK y ejecuta la suite existente. El arranque efectivo de Android tardó 158.83 s.
- node scripts/audit/android/authenticated-webview.cjs --label=candidato-actual: instrumentación Playwright AndroidWebView, login, recarga, denegaciones, logout y recompensa diaria con datos locales reales; 149.014 s y código 0.
- node --test --test-reporter=tap tests/unit/android-offline-routes.test.cjs: diez regresiones de interpretación de rutas, con entradas sintéticas/una salida observada de Android, sin dispositivo o red en esta suite.
- node scripts/audit/production/smoke-signed-android-offline.cjs --gpu-host: prueba separada del APK release existente sin acceso a backend; el historial de intentos se conserva.
- node scripts/audit/production/smoke-signed-android-offline.cjs --resume-owned-last --gpu-host: reanuda exclusivamente el AVD creado en esta fase y comprueba el hash instalado antes de seguir. Su resultado se distingue de los intentos anteriores.

[COMANDOS.json](COMANDOS.json) conserva argumentos, tiempos y códigos disponibles. Los logs completos del emulador y los dumps permanecen privados; no se guardaron cuerpos de respuestas de Auth ni tokens. La reproducción necesita el stack descartable ya preparado y los artefactos privados indicados en [el expediente de compilación](../20261102-002437-proveedores-movil-7eee99c/INFORME_VERIFICACION_TECNICA.md).

## Resultados con denominadores separados

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| N01 | AndroidWebView: artefacto, Auth, roles, sesiones y XP | 13 | 13 | 0 | 0 | APROBADO en laboratorio | [Casos](android/candidato-actual.json) |
| U01 | Parser de aislamiento: regresiones finales Node | 10 | 10 | 0 | 0 | APROBADO; datos de rutas, sin red | [TAP final](unitarias/rutas-aislamiento-verde.stdout.log) |
| U02 | Parser antes de incorporación | 10 | 0 | 10 | 0 | FALLIDO RED, conservado; no sumar como casos únicos nuevos | [TAP inicial](unitarias/rutas-aislamiento-rojo.stdout.log) |
| I01 | Recompensa tras parar el emulador | — | — | — | — | APROBADO: 1 recompensa, 1 ledger, 8 XP | [PostgreSQL READ ONLY](integracion/recompensa-despues-de-parada.json) |
| A01 | APK release: arranque/enlace sin conexión | — | — | — | — | APROBADO en alcance offline | [Resultado](android/release-smoke-offline.json) |
| A02 | Intentos anteriores del arnés release en esta fase | — | — | — | — | 2 intentos fallidos conservados; no son casos funcionales | [Historial](android/intentos-release-resumen.json) |
| D01 | Consultas de versión/pantalla del debug tras su parada | — | — | — | — | 3 comandos con salida 1, sin dato; no fallos de los 13 casos | [Contexto](android/sondeo-posterior-a-parada.json) |
| W01 | Nueva compilación web/Android | — | — | — | — | NO EJECUTADA; artefactos existentes | [Referencia](android/apk-local-compilado.json) |
| J01 | Jest/Testing Library con nueva cobertura | 0 | 0 | 0 | 0 | NO EJECUTADO en el corte local de esta fase | [Antecedentes](../20261104-201230-continuacion-produccion-d9cdfb7/INFORME_VERIFICACION_TECNICA.md) |

## Casos nativos ejecutados

| Código | Comprobación | Resultado | Duración s |
|---|---|---|---:|
| N-artefacto | El paquete instalado coincide con el APK privado compilado | APROBADO | 0.793 |
| N-admin-login | Inicio real de sesión y panel: admin | APROBADO | 10.673 |
| N-admin-persistencia | Sesión conservada tras recargar WebView: admin | APROBADO | 3.527 |
| N-admin-logout | Cierre real de sesión y denegación del panel propio: admin | APROBADO | 5.482 |
| N-trainer-login | Inicio real de sesión y panel: trainer | APROBADO | 10.135 |
| N-trainer-persistencia | Sesión conservada tras recargar WebView: trainer | APROBADO | 4.933 |
| N-trainer-rol | Denegación del panel administrador: trainer | APROBADO | 8.417 |
| N-trainer-logout | Cierre real de sesión y denegación del panel propio: trainer | APROBADO | 6.007 |
| N-student-login | Inicio real de sesión y panel: student | APROBADO | 15.746 |
| N-student-persistencia | Sesión conservada tras recargar WebView: student | APROBADO | 7.122 |
| N-student-rol | Denegación del panel administrador: student | APROBADO | 9.981 |
| N-student-logout | Cierre real de sesión y denegación del panel propio: student | APROBADO | 4.302 |
| N-student-recompensa | Segundo ingreso atleta conserva una recompensa diaria de 8 XP en PostgreSQL | APROBADO | 12.552 |

Antes del ensayo no había recompensa ni movimiento diario para el atleta sintético en la fecha consultada; después quedó una recompensa y un movimiento de 8 XP. La recarga y el segundo ingreso no generaron duplicados dentro de los escenarios ejecutados. Una consulta agregada independiente, después de detener el emulador, confirmó los mismos valores. Estas son operaciones de PostgreSQL local real y no llamadas a repositorios simulados. No prueban concurrencia ilimitada, otras fechas o la aplicación del contrato institucional. [Antes/después](android/candidato-actual.json), [Persistencia posterior](integracion/recompensa-despues-de-parada.json).

Se observaron 313 respuestas HTTP del origen local, sin estados 400 o superiores en el registro capturado. Esas respuestas no incrementan el número de casos. Cuatro solicitudes externas de avatares DiceBear fueron abortadas por la política del navegador; los avatares remotos no quedaron validados. El permiso de notificaciones se denegó en el AVD descartable y su flag se restauró al terminar: no se comprobó entrega FCM. [Registro HTTP y limpieza](android/candidato-actual.json).

## APK release y corrección del arnés

El primer intento offline con GPU host se detuvo por una interpretación demasiado estricta de ip route: Android devolvió la ruta local 10.0.2.0/24 a pesar del filtro default. Modo avión estaba activo, Wi-Fi desactivado y no había salida IPv6. Se incorporó un parser que solo admite loopback y los enlaces virtuales previstos; rechaza default, gateways, rutas públicas específicas, otras redes e información desconocida. Diez pruebas de regresión aprobaron. Este cambio altera el comprobador de aislamiento con justificación técnica y no modifica las expectativas funcionales de la suite WebView o el producto. [android/incidencia-ruta-local.json](android/incidencia-ruta-local.json), [unitarias/rutas-aislamiento-verde.stdout.log](unitarias/rutas-aislamiento-verde.stdout.log).

El siguiente intento instaló el release y mostró MainActivity, pero un diálogo activo Application Not Responding de SystemUI impedía la comprobación visual. La inspección de mCurrentFocus y mFocusedWindow confirmó que no se trataba únicamente de un registro histórico. Se conservó el intento y se reanudó una vez el AVD propio ya inicializado. [android/incidencia-systemui-release.json](android/incidencia-systemui-release.json), [android/intentos-release-resumen.json](android/intentos-release-resumen.json).

La reanudación terminó con SIGNED_RELEASE_INSTALLED_AND_LAUNCHED_OFFLINE, Android API 36, actividad de RIOVOLEY en primer plano y aceptación del intent riovoley://reset-password. El APK release procede de ef9a05ad20bba4f9303f547130c07336eeea61e7, mide 28376554 bytes y conserva SHA-256 3305c32983cba75a1361c5b6d741836051f98acfd0c7fefe8bd42dcb81cce16c. No se usó un token válido de recuperación, no se inició sesión y no se probó el backend institucional. Se leyó el buffer de crashes sin observar un crash de RIOVOLEY en esa muestra. Las capturas revisadas delimitan el estado visible; esto no valida una recuperación real de contraseña. [android/release-smoke-offline.json](android/release-smoke-offline.json), [android/release-capturas-revisadas.json](android/release-capturas-revisadas.json).

## Evidencias visuales, seguridad y limitaciones

Las tres capturas del debug fueron inspeccionadas visualmente y no muestran datos institucionales. Las de entrenador y atleta contienen estados de carga transitorios. La suite espera el shell del panel y las condiciones de autenticación; no espera la finalización de todos los módulos antes de capturar. Por tanto, no se declara comprobada la carga estable de todo el contenido ni se interpreta la imagen aislada como un bloqueo persistente. [android/capturas-revisadas.json](android/capturas-revisadas.json), [administrador](android/candidato-actual-admin.png), [entrenador](android/candidato-actual-trainer.png), [atleta](android/candidato-actual-student.png).

Antes de abrir los APK se comprobaron modo avión, Wi-Fi y las salidas de rutas previstas por el arnés original; los proxies de bloqueo no reenviaron tráfico. Los emuladores propios se detuvieron al terminar. No se cerraron aplicaciones del usuario ni se modificaron otros proyectos Docker. No se solicitaron credenciales institucionales ni se alteraron esquema, permisos o datos de producción. Las mutaciones del ensayo corresponden únicamente a sesiones y registros sintéticos del laboratorio. [android/resultado-intento.json](android/resultado-intento.json), [android/offline-rutas-evaluadas.json](android/offline-rutas-evaluadas.json).

La revisión posterior amplió la consulta a todas las tablas y encontró rutas default por dummy0 en la tabla policy 1002. La consulta del tipo de interfaz fue denegada al usuario del emulador; no se elevaron privilegios ni se declara verificado su controlador. Los indicadores noDefaultRoute/noIpv6DefaultRoute originales se limitan a las salidas consultadas entonces y no acreditan ausencia universal de rutas policy. Para ejecuciones futuras se retiró el filtro default y se evaluará toda la tabla principal IPv4/IPv6; esa adquisición nueva no se ejecutó como parte de los 13 casos conservados. Estos resultados no certifican un aislamiento exhaustivo de red. [Límites y cambio de adquisición](android/limites-enrutamiento.json), [tablas completas reales](android/tablas-completas-capturadas.json), [consulta de interfaz](android/interfaz-dummy-y-rutas-completas.json).

am start -W informó timeout al esperar el primer dibujo del release; posteriormente se comprobaron la actividad en primer plano y la portada visible. El intent posterior informó ok. No se acredita un objetivo de tiempo de arranque. La captura también muestra un botón OTA que no se accionó. [android/observaciones-release.json](android/observaciones-release.json).

No hubo nuevo build, distribución del APK o despliegue. El resultado del debug no se transfiere al release ni al dispositivo físico. Continúan pendientes la operación institucional coordinada SQL/Edge/clientes y las condiciones del [paquete de producción](../20261104-201230-continuacion-produccion-d9cdfb7/PAQUETE_PARA_REVISION.md). Los proveedores externos siguen fuera de esta continuación por indicación del usuario. No se infieren usabilidad, motivación, USE o UES-SF.

El cierre conserva [fuentes](FUENTES_EVALUADAS.json), [comandos](COMANDOS.json), [privacidad](PRIVACIDAD.json), [integridad](INTEGRIDAD.json) y [manifiesto](MANIFIESTO_SHA256.json).
