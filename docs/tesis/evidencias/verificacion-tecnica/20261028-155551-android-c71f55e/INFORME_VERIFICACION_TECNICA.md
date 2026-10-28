# Verificación técnica complementaria: compilación Android de RIOVOLEY

## Identificación y alcance

Proyecto RIOVOLEY, commit base **c71f55e5bc59c528a002c4347fb1664794cb277e**, con los cambios locales de auditoría/E2E conservados. Fecha: **28/10/2026**, zona America/Guayaquil (UTC−05); timestamps de comandos en UTC. Se verificó una **compilación nativa Android real** del contenedor Capacitor y sus siete plugins, además de sincronización, empaquetado, firma debug, JUnit disponible y Android Lint. No se confunde el build CRA con la compilación Java/Kotlin, DEX, recursos y APK realizada por Gradle.

Este expediente complementa [las correcciones E2E](../../e2e-aislado/20261028-101418-correcciones-c71f55e/INFORME_VERIFICACION_TECNICA.md). Los resultados Jest/Playwright de ese expediente no se reejecutaron ni se vuelven a contar aquí. Los expedientes anteriores se conservan, incluida su clasificación Android NO EJECUTADO válida para sus respectivas ejecuciones.

## Entorno y requisitos resueltos

Windows 11 amd64, Node 24.18.0 y npm 11.16.0 del proyecto. Inicialmente había Java 25 y no estaban disponibles SDK/ADB/sdkmanager. Se descargaron y verificaron mediante SHA-256 **Temurin JDK 21.0.12.1+1** y Android Command-Line Tools 15859902 (sdkmanager 22.0), desde fuentes oficiales. Se instalaron exclusivamente en runtime local: **SDK Platform 36 rev.2, Build-Tools 35.0.0 y Platform-Tools 37.0.1**. El wrapper existente utiliza **Gradle 8.14.3**, con **Android Gradle Plugin 8.13.0**, source/target Java21, minSdk24 y target/compileSdk36. No se modificaron versiones del proyecto, PATH global o Java25; JAVA_HOME/ANDROID_HOME/ANDROID_SDK_ROOT/ANDROID_USER_HOME/GRADLE_USER_HOME se fijaron solo en los procesos de auditoría. El SDK aceptó las licencias necesarias durante la instalación local.

Evidencia: [android/descarga-jdk-origen.json](android/descarga-jdk-origen.json), [android/descarga-jdk-sha256.json](android/descarga-jdk-sha256.json), [android/descarga-sdk-sha256.json](android/descarga-sdk-sha256.json), [android/sdk-instalado.stdout.log](android/sdk-instalado.stdout.log), [android/gradle-version.stdout.log](android/gradle-version.stdout.log), [android/java-global-conservado.stderr.log](android/java-global-conservado.stderr.log). Compatibilidad documentada por [Android AGP8.13](https://developer.android.com/build/releases/agp-8-13-0-release-notes), [Gradle/Java](https://docs.gradle.org/current/userguide/compatibility.html), [Capacitor8](https://capacitorjs.com/docs/getting-started/environment-setup) y [archivos Temurin](https://adoptium.net/installation/archives). Descarga de herramientas: [Android SDK](https://developer.android.com/studio#command-line-tools-only).

## Perfil de compilación y preservación

Se compilaron copias de android/ y de los módulos nativos instalados, con la misma applicationId, versiones SDK y fuentes. [../../../../../scripts/audit/android/README.md](../../../../../scripts/audit/android/README.md) explica el procedimiento. La copia excluye keystore de publicación, google-services.json, local.properties y salidas/cachés originales. Capacitor sync genera sus archivos en esa copia; los módulos originales de node_modules no reciben salidas de compilación. Se comprobaron **962 archivos versionados sin modificaciones** respecto al inicio ([android/integridad-fuentes-final.json](android/integridad-fuentes-final.json)).

El perfil web final utiliza exclusivamente endpoint loopback, una clave placeholder **sin validez** y PII key vacía; el APK no está configurado para operar con datos institucionales. Las actualizaciones OTA se desactivan en la configuración copiada. No se inicia la aplicación ni se realizan logins o escrituras de backend. La omisión de google-services.json significa que no se acredita registro/entrega FCM; tampoco se valida OTA o Auth nativo. La configuración se describe en [android/configuracion-final.json](android/configuracion-final.json).

## Metodología y comandos

1. Descargar JDK/SDK y comprobar hashes: download.cjs jdk/sdk.
2. Configurar el SDK local: setup.cjs; sdkmanager instala platform-tools, platforms;android-36 y build-tools;35.0.0.
3. Ejecutar secuencialmente stage.cjs final: build CRA con configuración explícita y cap sync android. La última compilación web duró **283.619 s** y la sincronización **14.874 s**. Se detectaron siete plugins Android.
4. Ejecutar el wrapper sin actualizaciones: **gradlew.bat :app:assembleDebug :app:testDebugUnitTest --no-daemon --console=plain --stacktrace --max-workers=2**. La última pasada posterior a la sincronización final terminó con **salida 0 en 59.344 s**. La primera compilación desde cachés vacías también aprobó y ejecutó 212 tareas Gradle; esas tareas **no son casos de prueba**.
5. Ejecutar **gradlew.bat :app:lintDebug --no-daemon --console=plain --stacktrace --max-workers=2 --rerun-tasks**; la pasada final terminó con salida 0 en **119.392 s**.
6. Comprobar aapt dump badging, apksigner verify --verbose --print-certs, XML JUnit y adb devices -l. Revisar el APK descomprimido, incluidos mapas/binaries y codificaciones UTF8/UTF16, antes de entregar el artefacto.

Scripts reproducibles: [../../../../../scripts/audit/android/build.cjs](../../../../../scripts/audit/android/build.cjs), [../../../../../scripts/audit/android/inspect.cjs](../../../../../scripts/audit/android/inspect.cjs), [../../../../../scripts/audit/android/privacy.py](../../../../../scripts/audit/android/privacy.py). Cada comando instrumentado conserva stdout, stderr, argumentos, directorio, fechas, duración y salida. Los builds/sync se ejecutaron sobre copias privadas, sin publicar ni distribuir paquetes.

## Resultados reales

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---:|---:|---:|---:|---|---|
| AND-01 | Sincronización Capacitor | — | — | — | — | APROBADO | [android/capacitor-sync-1793214589565.meta.json](android/capacitor-sync-1793214589565.meta.json) |
| AND-02 | Compilación nativa debug (comando Gradle) | — | — | — | — | APROBADO | [android/gradle-assemble-1793214638542.meta.json](android/gradle-assemble-1793214638542.meta.json) |
| AND-03 | JUnit nativo: plantilla aritmética | 1 | 1 | 0 | 0 | APROBADO | [android/unitarias-final/resumen.json](android/unitarias-final/resumen.json) |
| AND-04 | Android Lint (análisis estático) | — | — | — | — | APROBADO con 29 advertencias | [android/lint/final/resumen.json](android/lint/final/resumen.json) |
| AND-05 | Verificación de firma APK (un comando) | — | — | — | — | APROBADO | [android/apk-firma-1793214712347.meta.json](android/apk-firma-1793214712347.meta.json) |
| AND-06 | Inspección SDK/applicationId (un comando) | — | — | — | — | APROBADO | [android/apk-badging-1793214712023.meta.json](android/apk-badging-1793214712023.meta.json) |
| AND-07 | Prueba instrumentada en Android | 0 | 0 | 0 | 0 | NO EJECUTADO | [android/dispositivos-final.json](android/dispositivos-final.json) |
| HAR-01 | Regresión del filtro de variables del arnés | 1 | 1 | 0 | 0 | APROBADO | [android/guardas-entorno.stdout.log](android/guardas-entorno.stdout.log) |
| HAR-02 | Regresiones del escáner APK | 3 | 3 | 0 | 0 | APROBADO | [android/guardas-privacidad.stderr.log](android/guardas-privacidad.stderr.log) |
| PRIV-01 | Escaneo previo del APK privado (un control) | — | — | — | — | APROBADO | [android/privacidad-previa-verificada.json](android/privacidad-previa-verificada.json) |

El único caso JUnit del proyecto es **addition_isCorrect**, que comprueba 2+2=4. Fue ejecutado satisfactoriamente durante esta auditoría; Gradle pudo reutilizarlo en pasadas posteriores porque sus fuentes no cambiaron. No constituye cobertura funcional de RIOVOLEY ni se suma a las pruebas Jest/E2E previas. El test instrumentado no se ejecutó: ADB detectó **0 dispositivos** en la consulta final. Su expectativa de plantilla usa com.getcapacitor.app, distinta de com.riovoley.app; es una incidencia estática pendiente para cuando se prepare su ejecución, no un resultado fallido observado en dispositivo. No se modificó esa expectativa ni se declaró aprobada.

## APK generado y comprobado

Artefacto final: [android/artefactos/riovoley-auditoria-debug-sin-credenciales.apk](android/artefactos/riovoley-auditoria-debug-sin-credenciales.apk); **36793683 bytes (35.09 MiB)**. SHA-256: **58c2aa53a2e31de4e65fa2c751bfecdd7936a75c8420086a8cca604610919269** ([android/artefacto-final.json](android/artefacto-final.json)). aapt confirmó applicationId **com.riovoley.app**, versión **1.0 / code1**, mínimo **24**, objetivo **36** y compilación **36**. apksigner verificó una firma debug válida con esquema v2, RSA2048; no se utilizó la clave de publicación. La verificación de firma demuestra integridad del paquete firmado, no seguridad global del sistema. El APK se conserva como evidencia de compilación; no se instaló ni publicó.

## Lint, advertencias y limitaciones

Android Lint final: **0 errores y 29 advertencias**. Informes originales: [android/lint/final/lint-results-debug.html](android/lint/final/lint-results-debug.html), [android/lint/final/lint-results-debug.xml](android/lint/final/lint-results-debug.xml), [android/lint/final/resumen.json](android/lint/final/resumen.json).

| Identificador | Severidad | Cantidad |
|---|---|---:|
| AndroidGradlePluginVersion | Warning | 1 |
| GradleDependency | Warning | 1 |
| IconDipSize | Warning | 1 |
| IconDuplicates | Warning | 5 |
| IconLauncherShape | Warning | 10 |
| IconLocation | Warning | 1 |
| MonochromeLauncherIcon | Warning | 2 |
| ObsoleteSdkInt | Warning | 1 |
| UnusedResources | Warning | 7 |

Las advertencias no se ocultaron ni se cambiaron umbrales/baselines para aprobar. La compilación también informó usos deprecated/unchecked de dependencias, una advertencia Kotlin en Filesystem, uso de flatDir, diferencias de versión XML del SDK, una biblioteca nativa empaquetada sin strip y características Gradle obsoletas para una futura versión9. Esas advertencias se conservan en los logs; no impidieron generar el APK. No se efectuaron actualizaciones de dependencias ni cambios de lógica de producción.

## Incidencias durante la preparación

- El primer lanzamiento de sdkmanager falló por resolución de PATH/cmd en el arnés; el siguiente intento de instalación usó comillas interpretadas como parte del nombre del paquete. Se corrigieron ambos en el arnés, conservando sus salidas.
- Lint detectó **PropertyEscape** en local.properties generado para la copia Windows. Se escapó el separador de unidad. Una pasada posterior conservó un informe incremental anterior; al forzar --rerun-tasks el análisis final acreditó cero errores. El archivo local.properties del proyecto original no se modificó. [android/lint/inicial/resumen.json](android/lint/inicial/resumen.json) y [android/lint/correccion-entorno.json](android/lint/correccion-entorno.json) conservan la incidencia.
- La primera revisión de privacidad detectó una clave anon institucional dentro de un APK intermedio: un filtro del arnés retiraba el override REACT_APP y permitía cargar .env. El artefacto quedó reservado en runtime ignorado **antes de la entrega**, sin editar su firma; no se conserva dentro de los APK del expediente público. Se corrigió el filtro, se añadieron regresiones y se repitieron build web, sync y assemble. Un intento de assemble coincidió con la reconstrucción web y se considera intermedio; la pasada final verifica orden temporal web → sync → Gradle y es la empleada en los resultados finales. La descripción inicial de configuración reflejaba el perfil previsto y no acredita la privacidad de aquel primer APK. [PRIVACIDAD_INICIAL.json](PRIVACIDAD_INICIAL.json), [android/retencion-intermedios.json](android/retencion-intermedios.json) y [android/privacidad-previa-verificada.json](android/privacidad-previa-verificada.json) documentan el antes/después sin publicar valores de claves.
- La revisión independiente amplió el escaneo a **todos** los miembros ZIP del APK (incluidos .map y valores UTF16) y exigió validación del archivo privado antes de exportarlo. El APK final pasó ese control y coincide byte a byte con el archivo validado. La revisión no implica una prueba de penetración.

## Registro de intentos

No se suman preparaciones, intentos repetidos ni tareas Gradle a los casos JUnit. El resultado final se identifica mediante el orden temporal y los metadatos citados; se conservan los fallos de preparación y Lint.

| Comando/etiqueta | Salida | Duración (s) | Evidencia |
|---|---:|---:|---|
| descarga-jdk | 0 | 4.429 | [android/descarga-jdk.meta.json](android/descarga-jdk.meta.json) |
| extraer-jdk | 0 | 2.842 | [android/extraer-jdk.meta.json](android/extraer-jdk.meta.json) |
| descarga-sdk | 0 | 4.467 | [android/descarga-sdk.meta.json](android/descarga-sdk.meta.json) |
| extraer-sdk | 0 | 1.868 | [android/extraer-sdk.meta.json](android/extraer-sdk.meta.json) |
| java-21 | 0 | 0.189 | [android/java-21.meta.json](android/java-21.meta.json) |
| java-21-1793203046267 | 0 | 0.173 | [android/java-21-1793203046267.meta.json](android/java-21-1793203046267.meta.json) |
| sdkmanager-version | 0 | 3.231 | [android/sdkmanager-version.meta.json](android/sdkmanager-version.meta.json) |
| sdk-instalar | 1 | 3.67 | [android/sdk-instalar.meta.json](android/sdk-instalar.meta.json) |
| capacitor-sync | 0 | 8.398 | [android/capacitor-sync.meta.json](android/capacitor-sync.meta.json) |
| capacitor-plugins | 0 | 0.627 | [android/capacitor-plugins.meta.json](android/capacitor-plugins.meta.json) |
| gradle-version | 0 | 51.851 | [android/gradle-version.meta.json](android/gradle-version.meta.json) |
| java-21-1793203099314 | 0 | 0.241 | [android/java-21-1793203099314.meta.json](android/java-21-1793203099314.meta.json) |
| sdkmanager-version-1793203099590 | 0 | 5.585 | [android/sdkmanager-version-1793203099590.meta.json](android/sdkmanager-version-1793203099590.meta.json) |
| sdk-instalar-1793203105178 | 0 | 26.498 | [android/sdk-instalar-1793203105178.meta.json](android/sdk-instalar-1793203105178.meta.json) |
| sdk-instalado | 0 | 1.159 | [android/sdk-instalado.meta.json](android/sdk-instalado.meta.json) |
| gradle-assemble | 0 | 230.794 | [android/gradle-assemble.meta.json](android/gradle-assemble.meta.json) |
| adb-dispositivos | 0 | 3.552 | [android/adb-dispositivos.meta.json](android/adb-dispositivos.meta.json) |
| gradle-lint | 1 | 108.867 | [android/gradle-lint.meta.json](android/gradle-lint.meta.json) |
| apk-badging | 0 | 0.51 | [android/apk-badging.meta.json](android/apk-badging.meta.json) |
| apk-firma | 0 | 0.911 | [android/apk-firma.meta.json](android/apk-firma.meta.json) |
| java-global-conservado | 0 | 0.117 | [android/java-global-conservado.meta.json](android/java-global-conservado.meta.json) |
| gradle-lint-1793214142149 | 1 | 135.64 | [android/gradle-lint-1793214142149.meta.json](android/gradle-lint-1793214142149.meta.json) |
| gradle-assemble-1793214360658 | 0 | 96.758 | [android/gradle-assemble-1793214360658.meta.json](android/gradle-assemble-1793214360658.meta.json) |
| capacitor-sync-1793214589565 | 0 | 14.874 | [android/capacitor-sync-1793214589565.meta.json](android/capacitor-sync-1793214589565.meta.json) |
| capacitor-plugins-1793214604441 | 0 | 0.734 | [android/capacitor-plugins-1793214604441.meta.json](android/capacitor-plugins-1793214604441.meta.json) |
| gradle-assemble-1793214638542 | 0 | 59.344 | [android/gradle-assemble-1793214638542.meta.json](android/gradle-assemble-1793214638542.meta.json) |
| gradle-lint-1793214711993 | 0 | 119.392 | [android/gradle-lint-1793214711993.meta.json](android/gradle-lint-1793214711993.meta.json) |
| apk-badging-1793214712023 | 0 | 0.32 | [android/apk-badging-1793214712023.meta.json](android/apk-badging-1793214712023.meta.json) |
| apk-firma-1793214712347 | 0 | 1 | [android/apk-firma-1793214712347.meta.json](android/apk-firma-1793214712347.meta.json) |
| java-global-conservado-1793214725857 | 0 | 0.193 | [android/java-global-conservado-1793214725857.meta.json](android/java-global-conservado-1793214725857.meta.json) |
| guardas-entorno | 0 | 0.255 | [android/guardas-entorno.meta.json](android/guardas-entorno.meta.json) |
| adb-dispositivos-1793214850646 | 0 | 2.624 | [android/adb-dispositivos-1793214850646.meta.json](android/adb-dispositivos-1793214850646.meta.json) |
| guardas-entorno-1793214939826 | 0 | 0.278 | [android/guardas-entorno-1793214939826.meta.json](android/guardas-entorno-1793214939826.meta.json) |
| guardas-privacidad | 0 | 0.392 | [android/guardas-privacidad.meta.json](android/guardas-privacidad.meta.json) |
| apk-privacidad-verificada | 0 | 3.866 | [android/apk-privacidad-verificada.meta.json](android/apk-privacidad-verificada.meta.json) |

## Pendientes y cierre

Pendientes: ejecución en emulador/dispositivo autorizado, corrección y ejecución del test instrumentado de plantilla, pruebas funcionales nativas de permisos/FCM/OTA/conectividad, compilación release con firma institucional si se solicita y tratamiento de las 29 advertencias. Este expediente no cambia los pendientes de seguridad/dependencias ni acceso anónimo señalados en las auditorías anteriores.

Revisión independiente: [REVISION_INDEPENDIENTE.md](REVISION_INDEPENDIENTE.md). Privacidad/integridad: [PRIVACIDAD.json](PRIVACIDAD.json), [INTEGRIDAD.json](INTEGRIDAD.json), [MANIFIESTO_SHA256.json](MANIFIESTO_SHA256.json). Trazabilidad para la tesis: [MATRIZ_VERIFICACIONES_TESIS.md](MATRIZ_VERIFICACIONES_TESIS.md). Propuesta académica: [RESULTADOS_PARA_TESIS_4_5.md](RESULTADOS_PARA_TESIS_4_5.md). No se modificó el documento de tesis ni se realizaron push, despliegues o publicaciones.

