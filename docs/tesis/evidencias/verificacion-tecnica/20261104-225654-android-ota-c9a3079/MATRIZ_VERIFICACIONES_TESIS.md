# Matriz de trazabilidad: APK actual

Fuente del APK: c9a3079cafdd97acb59ec952864e6fe976a9c223. Las filas distinguen ejecuciones nuevas de referencias anteriores. No sumar subconjuntos.

| Categoría Tabla 4-6 | Archivo o flujo | Casos nuevos | Resultado real | Tipo y dependencias | Limitación y evidencia |
|---|---|---:|---|---|---|
| Caso de uso de gamificación | authenticated-webview.cjs, N-student-recompensa | 1 | APROBADO | E2E WebView + Auth/REST/PostgreSQL locales, sin mocks | Solo recompensa diaria; [casos](android/candidato-actual.json) |
| Servicio público de gamificación | Mismo flujo, sin prueba aislada del servicio | 0 casos aislados | NO EJECUTADO como unidad en esta fase | Interacción observada dentro del E2E anterior | [Servicio en auditoría anterior](../20261104-223055-ota-diagnostico-0d0d488/MATRIZ_VERIFICACIONES_TESIS.md) |
| Identidad del atleta | Sin suite nueva | 0 | NO EJECUTADO | No extrapolar la navegación a identidad | [Matriz anterior](../20261104-223055-ota-diagnostico-0d0d488/MATRIZ_VERIFICACIONES_TESIS.md) |
| Wallet y monedas | Sin suite nueva | 0 | NO EJECUTADO | No se valida saldo por comprobar XP | Matriz anterior |
| Tienda cosmética | Sin suite nueva | 0 | NO EJECUTADO | No se compran o equipan elementos en este flujo | Matriz anterior |
| Asistencia | Sin suite nueva | 0 | NO EJECUTADO | No se registran asistencias en este flujo | Matriz anterior |
| Pagos | Sin suite nueva | 0 | NO EJECUTADO | No se registran pagos en este flujo | Matriz anterior |
| Compilación del proyecto | build-local-android.cjs, CRA + sync + Gradle | Tres operaciones, salida 0 | APROBADO | Build web y nativo debug reales | 65 archivos web coincidentes; [recibo](android/apk-local-compilado.json), [metadatos](COMANDOS.json) |

Complementos Android: 14 casos WebView ejecutados, 14 aprobados y 0 fallidos; 0 no ejecutados. Incluye OTA-UI como un caso adicional a los trece flujos anteriores. Se utiliza Playwright Android y servicios reales locales, sin autenticar usuarios institucionales. [Resultado exacto](android/candidato-actual.json). JUnit: 1 caso aritmético de plantilla, sin valor funcional. Node: 13/13 guardas sintéticas (perfil y rutas), sin dispositivo o persistencia. Se aprobaron cuatro sondas de lectura independientes (anon rechazado y tres roles autenticados con HTTP200); no establecen la causa de los dos 401 registrados en el flujo nativo. [Sondas](integracion/sondas-logros-locales.json). Seguridad: revisión ZIP de valores prohibidos y controles de salida con alcance main; no prueba de penetración, RLS actual o proveedores externos. [Informe y límites](INFORME_VERIFICACION_TECNICA.md).

