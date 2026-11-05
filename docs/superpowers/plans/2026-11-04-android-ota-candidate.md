# Reconstrucción Android del candidato OTA

Base: commit c9a3079. Reconstruir el APK debug local para incorporar App con el diagnóstico oculto. No modificar código de producto, claves, configuración institucional ni permisos del backend. No usar firma release ni publicar el APK.

- [x] Abrir expediente nuevo, preservar punteros anteriores y verificar identidad del backend descartable.
- [x] Ejecutar build React estricto, sync Capacitor y Gradle debug/JUnit en copia privada; conservar metadatos y verificar firma debug, ZIP y hash (65 archivos coincidentes, JUnit aritmético 1/1).
- [x] Adaptar el arnés para vincular la ejecución al recibo nuevo sin atribuirle los APK anteriores; añadir comprobación explícita de ausencia de OTA en la portada nativa.
- [x] Ejecutar el APK en un AVD propio con bloqueo de salida y loopback local, conservando límites del aislamiento (14/14). Verificar sesiones/roles y recompensa diaria con Auth/REST/PostgreSQL locales reales. Detener solo el emulador creado.
- [x] Preparar generación de tres documentos y verificador de privacidad/integridad y sellado; se conservan dos fallos del comprobador estático y dos HTTP401 cuya causa no fue atribuida. Las cuatro sondas API independientes aprobaron.

Ejecutar el verificador antes del commit/push autorizado. El CI del commit que incluya el expediente se comprobará tras subir la rama; no anticipar su resultado dentro del expediente sellado. La revisión independiente del arnés fue solicitada, pero el subagente no pudo completarla por su límite de uso; no se presenta como aprobada.

La prueba JUnit de plantilla no se contará como verificación funcional. Las ejecuciones anteriores conservan sus propios hashes. Si una etapa falla, conservar el intento y documentarlo antes de intentar una alternativa. La validación gestionada y la transición institucional siguen pendientes.
