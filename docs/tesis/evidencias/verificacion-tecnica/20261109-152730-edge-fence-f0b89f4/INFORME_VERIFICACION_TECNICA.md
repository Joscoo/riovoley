# Verificación técnica: handlers Edge con red restringida

## Identificación, fecha y entorno

RIOVOLEY, base f0b89f4a6136c17d881a72c36c7b484aeefb6c06, contexto 2026-11-09T15:27:30.265Z UTC (Ecuador UTC−5). Windows 10.0.26300, Node v24.18.0, PostgreSQL 17.11; Deno 2.9.6, V8 15.0.245.2-rusty y TypeScript 6.0.3 según [versión real](integracion/deno-version.stdout.log). [Contexto](CONTEXTO.json). Entorno exclusivamente local: API55321, listener6163; no se usó Cloud.

## Metodología y comandos

edge-fence-context.cjs crea expediente nuevo y valida Supabase local. edge-fence-run.cjs red/green arranca Deno, importa los nueve handlers y ejecuta edge-fence-cases.cjs. edge-fence-provenance.cjs liga JSON a intervalos reales de proceso y prepara fuentes del candidato. edge-fence-report.cjs genera documentos; edge-fence-finalize.cjs verifica/sella. Los [comandos y códigos](COMANDOS.json) conservan flags, tiempos y resultados. Las sesiones locales se obtienen antes del snapshot de negocio; el arnés no lee .env.e2e institucional ni solicita credenciales.

Se usa configuración de proveedor ficticia para alcanzar las comprobaciones de autorización, manteniendo la salida bloqueada. Auth/REST son reales, los contratos35 usan clientes sintéticos y la entrega de proveedor no se simuló como éxito. No es una prueba de penetración completa.

## Resultados por denominador

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| EDF-01 | RED: autenticación de dispositivos | 2 controles | 0 | 2 | 0 | FALLIDO: corregido | [JSON](integracion/casos-red.json), [recibo](integracion/edge-cases-red.meta.json) |
| EDF-02 | Primer GREEN | 57 controles | 57 | 0 | 0 | APROBADO | [JSON](integracion/casos-green.json), [recibo](integracion/edge-cases-green.meta.json) |
| EDF-03 | GREEN final con códigos estructurados | 57 controles | 57 | 0 | 0 | APROBADO | [JSON](integracion/casos-green-1794238392821-383d5a.json), [recibo](integracion/edge-cases-green-1794238390727.meta.json) |
| EDF-04 | Contratos Edge existentes | 35 pruebas Node | 35 | 0 | 0 | APROBADO: clientes sintéticos | [TAP](integracion/contratos-edge.stdout.log), [recibo](integracion/contratos-edge.meta.json) |
| EDF-05 | Tipo de función modificada | 1 comprobación Deno | 1 | 0 | 0 | APROBADO | [Recibo](integracion/sync-typecheck.meta.json) |
| EDF-06 | Tipo de candidato con lock congelado | 1 comprobación Deno | 1 | 0 | 0 | APROBADO | [Recibo](integracion/sync-typecheck-candidato-corregido.meta.json) |
| EDF-07 | Jest/componentes del producto | 0 nuevos aquí | 0 | 0 | 0 | NO EJECUTADO en fase local | [Antecedente](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) |
| EDF-08 | Playwright/Android/builds | 0 nuevos aquí | 0 | 0 | 0 | NO EJECUTADO en fase local | [Antecedente](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) |
| EDF-09 | Cloud y entrega de proveedores | 0 ensayos | 0 | 0 | 0 | NO EJECUTADO | [Límites](ALCANCE_EDGE_Y_CAMBIO.md) |

No sumar recorridos repetidos o herramientas. El resultado final57 no equivale a57 casos funcionales de negocio: incluye51 respuestas de handlers y seis comprobaciones de seguridad/entorno. Los códigos HTTP finales fueron 200: 9, 400: 8, 401: 16, 403: 7, 405: 9, 503: 2; los401/403/405/503 son rechazos esperados, no errores ocultados. Tiempos de proceso de casos: 1.842, 2.607, 2.114 segundos.

## Integración y corrección

La fase RED detectó dos500 incorrectos de sync-mobile-device ante ausencia/invalidez de sesión. Se corrigió el mapeo tipado a401 sin cambiar rutas autorizadas o permisos. La fase final comprobó códigos AUTH_REQUIRED/AUTH_INVALID. [Cambio fuente](seguridad/cambio-sync-mobile-device.diff), [RED](integracion/casos-red.json), [resultado final](integracion/casos-green-1794238392821-383d5a.json).

Durante los handlers hubo 38 respuestas de lectura Auth/REST reales, cero escrituras intentadas por handlers, un rechazo de escritura deliberado del arnés y dos denegaciones de red nativa NotCapable. Se mantuvieron los digests de47 tablas/4598 filas sintéticas y10 secuencias entre los snapshots de cada ejecución. No se acredita ausencia de efectos fuera de ese conjunto o persistencia de flujos positivos.

## Procedencia, seguridad y límites

La copia privada contiene39 archivos;11 configuraciones generadas se recuperaron del candidato anterior con hash comprobado, y28 fuentes TypeScript se copiaron del repositorio. Solo cambió la función corregida. No se sobrescribió el candidato/retorno anterior ni se generó bundle Cloud. Las fuentes compartidas y el arnés constan en [candidato](seguridad/candidato-fuentes-corregido.json), [procedencia](seguridad/procedencia-arnes-corregida.json) y [fuentes](FUENTES_EVALUADAS.json).

La [revisión independiente](seguridad/revision-independiente.json) no encontró bloqueantes; no repitió pruebas. DEP0040/punycode y el incidente ENOENT de preparación se conservan. El arnés fuerza cached-only porque los permisos fetch no controlan toda carga estática. La [documentación Deno](https://docs.deno.com/runtime/fundamentals/security/) se usa como referencia, sin sustituir los resultados de las sondas.

El ensayo no valida claves, entrega, cuotas, dominio remitente, scheduler activo, S3, runtime gestionado o mantenimiento global. No se modificó producción. Siguen pendientes respaldo vigente, paquete institucional completo y nueva ventana/autorización. El CI posterior al commit se comprobará separadamente, sin modificar el sello.

[Privacidad](PRIVACIDAD.json), [integridad](INTEGRIDAD.json), [manifiesto](MANIFIESTO_SHA256.json), [matriz](MATRIZ_VERIFICACIONES_TESIS.md) y [texto académico](RESULTADOS_PARA_TESIS_4_5.md).

