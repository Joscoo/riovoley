# Verificación nativa Android para la tesis

Esta utilidad ejecuta una compilación debug real del proyecto Capacitor y conserva evidencia nueva en `docs/tesis/evidencias/verificacion-tecnica/`. No firma una versión de publicación ni instala la aplicación. El contexto y herramientas permanecen en `.e2e-local`, ignorado por Git. No usar sobre producción ni configurar proveedores externos.

Secuencia utilizada (desde la raíz, Windows):

1. `node scripts/audit/android/download.cjs jdk` y `... download.cjs sdk`: fuentes oficiales y hashes SHA-256 publicados.
2. `node scripts/audit/android/setup.cjs`: JDK21, SDK36, build-tools35, platform-tools; licencias SDK y cachés exclusivamente locales.
3. `node scripts/audit/android/stage.cjs final`: copia fuentes y módulos Android; compila React con endpoint loopback, clave placeholder y PII vacía; sincroniza Capacitor. Esperar a que termine antes de Gradle.
4. `node scripts/audit/android/build.cjs assemble`: `:app:assembleDebug :app:testDebugUnitTest` con wrapper8.14.3, Java21, sin daemon persistente y dos workers.
5. `node scripts/audit/android/build.cjs lint --rerun-tasks`: comprobar también lint; conservar intentos anteriores. Forzar reejecución evita reutilizar un informe incremental anterior de local.properties.
6. `node scripts/audit/android/lint-evidence.cjs final` y `python scripts/audit/android/lint-summary.py`.
7. `node scripts/audit/android/inspect.cjs final`: firma, SDK, hash APK, JUnit y huellas de fuentes.
8. `node scripts/audit/android/devices.cjs`: consulta ADB sin identificadores publicados ni instalación.
9. Generar documentos y ejecutar privacidad/integridad antes de compartir.

No ejecutar la etapa web y Gradle simultáneamente. Las operaciones de compilación se ejecutan secuencialmente para asegurar que el APK contiene los assets sincronizados más recientes. Los logs repetidos reciben sufijo. El script context rechaza sobrescribir evidencias existentes; una auditoría nueva requiere un contexto nuevo (conservar el puntero anterior en runtime).

El perfil excluye keystore de publicación y google-services.json, desactiva autoUpdate OTA únicamente en la copia y usa la misma applicationId/SDK/plugins de las fuentes. El APK acredita compilación/empaquetado; no valida Auth, notificaciones FCM, OTA ni funcionamiento completo en dispositivo. La prueba JUnit original es solo `2+2=4`; la instrumentada original contiene una expectativa de package obsoleta y permanece sin ejecutar si no hay dispositivo.

Se añadieron controles para conservar los overrides CRA al filtrar variables, impedir que dotenv reincorpore claves institucionales y revisar el contenido descomprimido del APK. Nunca publicar un APK con coincidencias pendientes de privacidad. Los artefactos intermedios reservados permanecen fuera del expediente público.
