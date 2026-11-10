# Decisiones y alcance

El npm audit del registro pasa de15 a0 con WDS6 y el reemplazo local de deepmerge. No se afirma que el registro audite el fork: sus16 regresiones de seguridad y sus8 contratos de consumidores, licencia y huellas se comprueban por separado. El cambio del fork es código defensivo real, no solo un nombre/versión.

WDS6 dejó de depender de SockJS/UUID. Sus dos casos históricos se conservan en Git y registros sellados; en el archivo actual se sustituyen por dos casos del transporte WS realmente instalado (eco/cierre y límite de mensaje). No se reinstalan dependencias muertas para lograr aprobaciones.

Express5 cambió el parser por defecto a simple. La prueba del contrato QS conserva su expectativa de filtros anidados y declara extended explícitamente en su fixture, sin modificar la app. Middleware8 vuelve asíncrono getFilenameFromUrl; se añade await sin cambiar las expectativas de contención y archivo válido. El intento previo con cuatro fallos se conserva.

Se mantiene CRA5, con adaptador de opciones y orden de middleware del servidor actualizado. El arranque de desarrollo queda limitado a loopback y CORS local, preservando TLS y proxy explícitos. Se probó antes del cambio que el canal HMR aceptaba un origen ajeno; después se exige denegación. No se despliega este servidor como producción.
