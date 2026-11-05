# Creación acotada del secreto del scheduler

**Objetivo:** completar únicamente REPORTS_SCHEDULER_SECRET en mayvvlkvheagkojunzzb, según la propuesta SCHEDULER_PENDIENTE.md. El usuario respondió CONTINUA después de la solicitud concreta de autorización; se interpreta dentro de ese alcance, sin extenderlo a SQL, despliegues, jobs o envíos.

**Implementación elegida:** Node y CLI Supabase 2.122 existente. La CLI combina config.toml, env-file y argumentos; se ejecutará en un directorio nuevo fuera del repositorio con configuración mínima sin secretos. Una tubería Windows de una conexión entregará únicamente la entrada autorizada. Se descartan argumentos con valores y archivos en claro. Antes del cambio se verificará la ausencia dos veces; si aparece se abortará. El nuevo valor aleatorio de 32 bytes tendrá recuperación privada cifrada con GPG y DPAPI. La lectura posterior comprobará presencia/digest en memoria y que los demás digests no cambiaron, sin publicarlos.

**Guías aplicadas:** Supabase, secrets-management, writing-plans, TDD; ejecución directa por el agente principal. No se requiere otra elección del usuario sobre la implementación de esta propuesta ya concreta.

- [x] Crear expediente nuevo; autorización y comandos registrados. La integridad de los 17 manifiestos anteriores se comprueba en el cierre.
- [x] Guardas scheduler12, regresión de respaldo10 y parser Android4; ciclos RED→GREEN conservados. El grupo CI de26 contiene scheduler12, Auth10 y Android4, sin sumar repeticiones.
- [x] Tubería con CLI real, HTTP loopback y fixture: una entrada, sin valores en argumentos/salida. DPAPI/GPG locales probados antes de escritura.
- [x] Revisión independiente: corregidos keyHome no exportado, recuento constante y normalización del digest value de CLI. Una escritura real, lectura posterior y otros digests sin cambios; presentes6/6.
- [x] Recuperación del archivo DPAPI frente al digest actual y custodia de dos cifrados fuera de Git, sin publicar valores. GPG no descifrado otra vez.
- [x] Android: APK instalado y hash cotejado; actividad en primer plano acreditada por registro real. System UI presentó ANR; visual e intent bloqueados. Corregido parser de formato Android36 sin alterar el producto. Todos los intentos del arnés y los AVD conservados.
- [x] Tres documentos generados y revisados. El resultado de privacidad/integridad y la publicación se acredita mediante los recibos de cierre y Git, no mediante una aprobación anticipada en esta lista.
