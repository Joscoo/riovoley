# Diagnóstico OTA y preparación de producción

**Objetivo:** retirar de la interfaz normal el panel técnico OTA observado en el APK release, conservando el motor de actualización existente.

**Decisión de implementación:** tratar el panel como herramienta de diagnóstico. Solo se muestra si la compilación activa explícitamente `REACT_APP_ENABLE_OTA_DIAGNOSTICS=true`, la plataforma admite OTA y la ruta es la portada. El valor no es una clave. La preparación de producción rechaza esa activación; los builds ordinarios lo ocultan por defecto. Es una decisión técnica del agente dentro de la preparación autorizada, no una preferencia expresada por el usuario.

**Alcance:** `src/App.js`, pruebas separadas de App, preflight y documentación de variables. No cambiar contratos Supabase, proveedores, canales ni lógica del motor OTA; no solicitar credenciales, firmar paquetes o desplegar. Los APK previamente verificados siguen identificados por sus hashes y no se atribuyen al código nuevo.

- [x] Reproducir en Testing Library que el panel aparece con OTA nativo compatible sin activación explícita; conservar RED (3/7 aprobados, 4 fallidos, tras corregir la fixture).
- [x] Añadir la condición mínima al renderizado y comprobar ausencia por defecto, activación explícita y continuidad del bootstrap OTA (7/7 con mocks).
- [x] Incorporar la variable no sensible al preflight; rechazar diagnóstico habilitado en perfiles de producción con regresiones sobre entradas sintéticas (18/18, incluidos cuatro nuevos).
- [x] Ejecutar pruebas pertinentes y build web estricto con configuración sintética aislada; registrar denominadores reales (426/426 en 89 suites; build 0).
- [x] Generar los tres documentos, revisar el código y preparar el verificador de privacidad/integridad y sellado.

El sellado debe aprobar antes del commit/push autorizado. El CI del commit que incluya el expediente se comprobará después de publicarlo en la rama, sin despliegue; su resultado se identifica por SHA en GitHub Actions y no se anticipa dentro de la evidencia sellada.
