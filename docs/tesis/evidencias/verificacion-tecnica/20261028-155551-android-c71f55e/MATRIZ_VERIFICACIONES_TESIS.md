# Matriz complementaria: evidencia Android para la Tabla 4-6

Proyecto RIOVOLEY, commit base c71f55e, 28/10/2026. Esta etapa incorpora compilación nativa Android; no reejecuta los denominadores Jest/Playwright anteriores.

| Categoría | Archivos relacionados | Casos ejecutados en esta etapa | Resultado real | Tipo / mocks o servicios | Limitaciones | Evidencia |
|---|---|---|---|---|---|---|
| 1. Caso de uso de gamificación | src/features/gamification/ | No reejecutados | Conservar resultado del expediente E2E/Jest anterior | No hay prueba de negocio Android nueva | Compilar no acredita comportamiento del caso de uso | [../../e2e-aislado/20261028-101418-correcciones-c71f55e/MATRIZ_VERIFICACIONES_TESIS.md](../../e2e-aislado/20261028-101418-correcciones-c71f55e/MATRIZ_VERIFICACIONES_TESIS.md) |
| 2. Servicio público de gamificación | src/features/gamification/ | No reejecutados | Conservar evidencia anterior | Sin integración de backend en este APK | Endpoint loopback/placeholder | [../../e2e-aislado/20261028-101418-correcciones-c71f55e/MATRIZ_VERIFICACIONES_TESIS.md](../../e2e-aislado/20261028-101418-correcciones-c71f55e/MATRIZ_VERIFICACIONES_TESIS.md) |
| 3. Identidad del atleta | src/features/gamification/ | No reejecutados | Sin resultado funcional nativo nuevo | Empaquetado de fuentes | Sin edición de avatar/títulos en Android | [INFORME_VERIFICACION_TECNICA.md](INFORME_VERIFICACION_TECNICA.md) |
| 4. Wallet y monedas | src/features/gamification/ | No reejecutados | Sin transacciones nativas verificadas | Sin backend institucional | Build no demuestra saldos | [INFORME_VERIFICACION_TECNICA.md](INFORME_VERIFICACION_TECNICA.md) |
| 5. Tienda cosmética | src/features/gamification/ | No reejecutados | Sin compras/equipamiento nativo ejecutado | Sin mocks de transacción añadidos | Mantener alcance anterior | [INFORME_VERIFICACION_TECNICA.md](INFORME_VERIFICACION_TECNICA.md) |
| 6. Asistencia | src/features/attendance/ | No reejecutados | El flujo local E2E anterior se conserva | No se registra asistencia con este APK | Sin dispositivo ni login nativo | [../../e2e-aislado/20261028-101418-correcciones-c71f55e/MATRIZ_VERIFICACIONES_TESIS.md](../../e2e-aislado/20261028-101418-correcciones-c71f55e/MATRIZ_VERIFICACIONES_TESIS.md) |
| 7. Pagos | src/features/payments/ | No reejecutados | El flujo local E2E anterior se conserva | No se registran pagos con este APK | Sin dispositivo ni login nativo | [../../e2e-aislado/20261028-101418-correcciones-c71f55e/MATRIZ_VERIFICACIONES_TESIS.md](../../e2e-aislado/20261028-101418-correcciones-c71f55e/MATRIZ_VERIFICACIONES_TESIS.md) |
| 8. Compilación del proyecto | android/, capacitor.config.json, scripts/audit/android/ | Comandos de build/sync, sin denominador de casos | Web, sync7plugins, assembleDebug y firma: salida0 | Compiladores y herramientas Android reales, sin mocks | Perfil aislado; no release ni ejecución en Android | [android/gradle-assemble-1793214638542.meta.json](android/gradle-assemble-1793214638542.meta.json), [android/artefacto-final.json](android/artefacto-final.json) |

## Complementos independientes

- JUnit Android: **1/1**, plantilla 2+2=4; [android/unitarias-final/resumen.json](android/unitarias-final/resumen.json). No se agrega a Jest ni se interpreta como prueba funcional.
- Android Lint: **0 errores y 29 advertencias**, no casos de prueba; [android/lint/final/resumen.json](android/lint/final/resumen.json).
- Guardas del arnés: **1** caso Node sobre variables y **3** casos Python sobre privacidad; herramientas distintas con denominadores separados.
- ADB: **0 dispositivos**; prueba instrumentada y ejecución funcional **NO EJECUTADAS**, [android/dispositivos-final.json](android/dispositivos-final.json).
- APK: applicationId com.riovoley.app, min24/target36, debug firmado; [android/artefacto-final.json](android/artefacto-final.json). El escaneo previo no encontró valores sensibles conocidos/JWT; no equivale a una auditoría de seguridad integral.

La matriz anterior documenta 112/112 instancias E2E originales y cuatro adicionales; estas cifras se citan como antecedente y no como nuevas ejecuciones Android. La compilación nativa satisface el requisito antes pendiente de producir un APK debug, con las limitaciones especificadas en [INFORME_VERIFICACION_TECNICA.md](INFORME_VERIFICACION_TECNICA.md).

