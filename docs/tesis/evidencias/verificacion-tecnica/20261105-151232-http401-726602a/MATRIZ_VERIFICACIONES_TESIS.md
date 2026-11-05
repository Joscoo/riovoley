# Matriz de trazabilidad del diagnóstico HTTP401

| Categoría Tabla 4-6 | Casos nuevos en esta fase | Resultado y tipo | Dependencias y límites | Evidencia |
|---|---:|---|---|---|
| Caso de uso de gamificación | 1, subconjunto NATIVE | Recompensa diaria, APROBADO | WebView + Auth/REST/PostgreSQL locales reales, sin mocks | [Casos](android/candidato-actual.json) |
| Servicio público de gamificación | 0 casos aislados | No se repite la unidad del servicio | Se observa indirectamente el flujo anterior y las consultas de logros | [Análisis](ANALISIS_HTTP401.json) |
| Identidad del atleta | 0 | NO EJECUTADO | No se atribuye identidad al acceso al panel | [Matriz anterior](../20261104-225654-android-ota-c9a3079/MATRIZ_VERIFICACIONES_TESIS.md) |
| Wallet y monedas | 0 | NO EJECUTADO | XP no equivale a validar monedas | Matriz anterior |
| Tienda cosmética | 0 | NO EJECUTADO | No se compra/equipa | Matriz anterior |
| Asistencia | 0 | NO EJECUTADO | Sin registros nuevos de asistencia | Matriz anterior |
| Pagos | 0 | NO EJECUTADO | Sin registros nuevos de pagos | Matriz anterior |
| Compilación del proyecto | 0 operaciones nuevas | NO EJECUTADO | APK existente con mismo SHA-256 y fuentes de producto sin diferencias | [Recibo](android/apk-local-compilado.json), [Git](android/fuentes-producto-sin-cambios.json) |

Complementos: 6/6 pruebas unitarias sintéticas del clasificador de cabeceras; 14/14 casos Playwright Android sobre WebView real; 0 errores HTTP observados y 0 clasificados como anon durante cierre. No sumar observaciones como casos funcionales. No se validan servicios de producción ni se cambian permisos. [Informe](INFORME_VERIFICACION_TECNICA.md).

Una prueba controlada adicional de Chromium de escritorio reprodujo la continuación de notificaciones tras logout al retrasar respuestas reales de anuncios, con 2 GET anónimos de logros rechazados. Es otro denominador: 1/1 escenarios de reproducción, sin nueva compilación. [Resultado](e2e/cierre-notificaciones-controlado.json).

