# Verificación técnica: paquete SQL y barrera local

## Proyecto, fecha y entorno

RIOVOLEY, commit base 57a1e7bc4c636f3d71b2b412544b19622dbbe84c. Contexto nuevo 2026-11-09T14:20:59.258Z UTC (Ecuador UTC−5), Windows 10.0.26300, Node v24.18.0, PostgreSQL 17.11. Destino fijo 127.0.0.1:55322, base riovoley_gatepacket_20261109142059_bb0d7d, marcada para ensayo sintético. [Contexto](CONTEXTO.json). La [preparación del 5 de noviembre](../20261105-210719-paquete-barrera-57a1e7b/NOTA_CONTINUIDAD.md) conserva su fecha y no contiene estos resultados nuevos.

## Alcance y metodología

Integración real PostgreSQL con driver pg y Node assert, sin mocks de repositorios. Se clonó solo el laboratorio sintético anterior y se compararon 48 tablas/68 filas sintéticas y estados de siete secuencias mediante digests agregados, sin publicar filas. No es una restauración institucional ni una prueba de penetración. Se inició Docker Desktop para recuperar el entorno existente; no se restablecieron bases o credenciales. Los servicios gestionados y proveedores externos no fueron ejercitados.

Comandos: node scripts/audit/maintenance/packet-context.cjs crea contexto/base nuevos; node scripts/audit/maintenance/packet-rehearse.cjs ejecuta la normalización, medición de huellas, generación de variantes y avance/retorno; packet-report.cjs genera documentos y packet-finalize.cjs sella. Los [comandos y códigos](COMANDOS.json), [operaciones SQL](integracion/operaciones-sql-1794234721846-ba0529.json) y registros de los cuatro ensayos conservan el resultado real. Tras el sello se requiere un contexto nuevo. No hay parámetro para seleccionar Cloud.

## Resultados por ejecución

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| PKT-01 | Primer recorrido | 20 controles | 19 | 1 | 0 | FALLIDO: corregido y repetido | [Salida](integracion/ensayo-paquete.stdout.log), [código/tiempo](integracion/ensayo-paquete.meta.json) |
| PKT-02 | Recorrido tras conservar CRLF | 18 controles | 17 | 1 | 0 | FALLIDO: corregido y repetido | [Salida](integracion/ensayo-paquete-final.stdout.log), [código/tiempo](integracion/ensayo-paquete-final.meta.json) |
| PKT-03 | Recorrido corregido | 22 controles | 22 | 0 | 0 | APROBADO | [Salida](integracion/ensayo-paquete-corregido.stdout.log), [código/tiempo](integracion/ensayo-paquete-corregido.meta.json) |
| PKT-04 | Repetición con artefactos exactos | 22 controles | 22 | 0 | 0 | APROBADO | [Salida](integracion/ensayo-paquete-artefactos.stdout.log), [código/tiempo](integracion/ensayo-paquete-artefactos.meta.json) |
| PKT-05 | Digest: reproducción de error de tipos | 1 consulta | 0 | 1 | 0 | FALLIDO: 42725, corregido | [Recibo](integracion/digest-red.meta.json) |
| PKT-06 | Digest: consulta corregida | 1 consulta | 1 | 0 | 0 | APROBADO | [Recibo](integracion/digest-green.meta.json) |
| PKT-07 | Jest, componentes, Playwright y Android | 0 nuevos | 0 | 0 | 0 | NO EJECUTADO en este ensayo | [Antecedente](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) |
| PKT-08 | Compilaciones web/Android | 0 nuevas | 0 | 0 | 0 | NO EJECUTADO en este ensayo | [Antecedente](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md) |
| PKT-09 | Entorno gestionado y aislamiento global | 0 ensayos | 0 | 0 | 0 | NO EJECUTADO | [Límites](PAQUETE_LOCAL_REVISABLE.md) |
| PKT-10 | Selección de intento más reciente | 3 pruebas Node | 3 | 0 | 0 | APROBADO: fixtures de metadatos | [TAP](unitarias/seleccion-intentos.stdout.log), [recibo](unitarias/seleccion-intentos.meta.json) |

Los cuatro recorridos duraron 3.202, 2.78, 3.438, 3.535 segundos de proceso. Son ejecuciones repetidas con denominadores propios; no deben sumarse. Los 22 controles finales son comprobaciones del runner, no 22 suites Jest o 22 casos de negocio.

## Contratos, integración y seguridad comprobados

El recorrido normaliza la copia al catálogo inicial, mide tres estados con barrera y ejecuta cuatro variantes locales en orden. El retorno anticipado, función alterada, disparador deshabilitado y tabla no inventariada provocan rechazos específicos. El principal original también rechaza la deriva causada por la barrera. Cada etapa integrada verifica catálogo, digest de barrera, contenido sintético, secuencias y rechazo de la RPC de sonda. Al concluir se retira la barrera, se recupera la huella 15b9d9e869fb5113263c485714009878 y se verifica origen intacto. [22 controles](integracion/resultado-final-1794234721835-e3a110.json), [estado](integracion/estado-final-1794234721833-c3d36d.json).

El primer fallo detectó diferencias de finales de línea en 31 definiciones restauradas. La primera corrección preservó los bytes del SQL original; una segunda corrigió el separador SQL del digest. Se conservaron registros y variantes de todos los intentos. No se relajaron los resultados esperados del catálogo para aprobar un estado distinto. [Diagnóstico](integracion/diagnostico-retorno.json), [comparación](integracion/diferencias-retorno.json), [corrección final](integracion/correccion-separador-digest.json).

## Unitarias, componentes, E2E, web y Android

No se modificó lógica del producto ni se repitieron aquí las suites o compilaciones. Los antecedentes conservan sus propios SHA y denominadores: 434 Jest/91 suites, Chromium 1/1 y Android local 14/14 en el [expediente funcional](../20261105-152944-notifications-cancel-e903a31/INFORME_VERIFICACION_TECNICA.md). No se trasladan al deployment público, a otro APK o a servicios gestionados. El CI posterior a este commit se comprobará separadamente, sin modificar el sello.

Por separado, tres pruebas unitarias Node con metadatos sintéticos verificaron que el informe seleccione el intento exitoso más reciente aunque tenga un nombre con sufijo, y rechace rutas, fechas o estados inválidos. No son pruebas de módulos de negocio ni integración PostgreSQL; su denominador no se suma a los 22 controles.

## Incidencias, limitaciones y decisión

La apertura previa del entorno falló con ECONNREFUSED porque Docker estaba cerrado; se inició la aplicación y se verificó nuevamente el origen local. No se generaron resultados simulados ni se desbloqueó el respaldo. El archivo/contexto del 5 de noviembre se preservó. La revisión independiente, [privacidad](PRIVACIDAD.json), [integridad](INTEGRIDAD.json) y [manifiesto](MANIFIESTO_SHA256.json) completan el registro.

Continúan pendientes la cobertura gestionada de Auth/Storage y efectos externos, respaldo vigente, paquete institucional completo y autorización. La ventana del 7 de noviembre caducó. Este ensayo no permite afirmar que producción esté actualizada ni que exista aislamiento global. [Paquete y límites](PAQUETE_LOCAL_REVISABLE.md), [matriz](MATRIZ_VERIFICACIONES_TESIS.md), [propuesta académica](RESULTADOS_PARA_TESIS_4_5.md).

