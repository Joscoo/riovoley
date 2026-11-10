# Verificación nativa Android para la tesis

## Continuación autenticada en entorno descartable

La continuación usa `initialize-followup.cjs` para abrir otro expediente y conservar ambos punteros anteriores. Requiere el stack local provisionado según [el arnés E2E](../../e2e/local/README.md), sus cuentas sintéticas y las herramientas portables Android de esta utilidad. El proyecto institucional no se utiliza.

`stage.cjs local-auth` genera una copia privada con claves anon/PII exclusivamente locales, OTA desactivado y URLs del actualizador en un puerto loopback cerrado. Habilita mixed content solo en esa copia y permite HTTP únicamente a 127.0.0.1 en su manifiesto debug. El APK autenticado nunca se copia a evidencias ni se distribuye. No ejecutar `inspect.cjs final` para exportar ese perfil; usar `collect-private.cjs cierre`, que conserva únicamente inspección, firma, metadatos y JUnit.

Después de `build.cjs assemble --rerun-tasks` y `build.cjs lint --rerun-tasks`, iniciar el emulador mediante `../closure/launch-emulator.cjs` y ejecutar `../closure/instrumentation.cjs cierre`. `authenticated-webview.cjs --label=autenticacion-final` exige el AVD riovoley-audit en emulator-5580, servidor ADB local 5037 y coincidencia SHA-256 del APK inspeccionado con el instalado. Conecta el loopback por `adb reverse`, usa Auth/REST/PostgreSQL reales, prueba roles/sesiones y consulta la recompensa diaria. No simula esos servicios. Deniega notificaciones durante el flujo y retira el túnel y sus propios flags al terminar. No comprueba FCM, Resend, TLS institucional ni OTA externo.

Los parches de Underscore/JSONPath y QS/Express se aplican mediante `dependencies-followup.cjs`; se prueban por separado con `node --test tests/integration/toolchain.dependencies.test.cjs`. Se fijan versiones dentro de la misma versión principal y se conserva `package-lock.json`; no se utiliza `npm audit fix --force`. El inventario npm mantiene explícitos los avisos no resueltos de la cadena de herramientas CRA.

`report-followup.cjs` genera los tres documentos y `finalize-followup.cjs` contrasta registros, privacidad e integridad antes de sellar el expediente. Los punteros quedan asociados al expediente sellado; abrir otro antes de ejecutar nuevos comandos de evidencia. En equipos con memoria limitada, compilar antes de arrancar el emulador.

El perfil inicial siguiente ejecuta una compilación debug real del proyecto Capacitor y conserva evidencia nueva en `docs/tesis/evidencias/verificacion-tecnica/`; la instalación y ejecución corresponden a la continuación descrita arriba. El contexto y herramientas permanecen en `.e2e-local`, ignorado por Git. Las firmas son de depuración y el backend es local.

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
