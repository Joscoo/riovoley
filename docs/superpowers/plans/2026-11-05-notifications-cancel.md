# Cancelación cooperativa de notificaciones obsoletas

El diagnóstico e903a31 reprodujo GET anónimos de logros tras logout al retrasar respuestas reales de anuncios. Corregir la continuación de la carga de notificaciones, sin cambiar permisos o suprimir errores autenticados legítimos.

- [x] Escribir regresiones separadas: señal ya cancelada, cancelación durante pagos/anuncios, flujo activo y limpieza del componente al desmontar/cambiar usuario; conservar RED (1/6 aprobado, 5 fallidos). Añadir microtarea exterior (RED 4/5) y resultado obsoleto del widget tras revisión.
- [x] Pasar AbortSignal del componente al servicio/caso de uso. Interrumpir lecturas posteriores entre awaits y evitar actualizaciones de UI/catch obsoletos. Las solicitudes HTTP ya enviadas pueden terminar; no se promete abortarlas en transporte.
- [x] Ejecutar Jest completo con cobertura (final 434/434, 91 suites). Justificar la extensión del contrato del test de acceso: mismos rol/usuario y además una señal real.
- [x] Confirmar fuentes con commit 5f60551 antes de recompilar APK; ejecutar build web estricto, sync, Gradle debug e inspección, sin firma release. Reconstrucción 393,704 s, 65 archivos web coincidentes, APK debug 6d552150.
- [x] Ejecutar el escenario controlado con el cliente corregido (1/1, cero lecturas tardías observadas en 1500 ms), sin retirar la prueba previa que las reprodujo. Comprobar el nuevo APK en WebView (14/14, 310 respuestas locales sin error HTTP, emulador detenido).
- [x] Generar tres documentos con denominadores separados y preparar el verificador de integridad/privacidad y sellado. Ejecutarlo antes del commit del expediente; subir la rama autorizada y comprobar CI después del sellado, sin anticipar su resultado ni desplegar.
