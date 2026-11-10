# Verificación complementaria de Edge y preparación operativa

## 1. Proyecto y commit

RIOVOLEY, https://github.com/Joscoo/riovoley. Base **27dd9727c5c791e8a7bf380a698dfa1c771e6dbb**, rama fix/seguridad-local-20261029; los cambios locales posteriores se identifican por SHA-256 en FUENTES_EVALUADAS.json. No se publicó un despliegue ni se aplicó SQL institucional. El [paquete SQL previo](../../../../../database/security/production-proposal/README.md) conserva su expediente sellado.

## 2. Fecha y entorno

Inicio 2026-11-01T01:30:50.378Z, UTC (Ecuador UTC−5). Windows 11 Pro, Node 24.18.0, npm 11.16.0, Deno 2.9.6, Supabase CLI 2.122.0 y PostgreSQL local 17.11. Servicios API/Auth/REST/Storage locales en 127.0.0.1:55321; handlers Deno locales en 6161 y 6162. Docker se inició de forma oculta y se reanudó el stack existente sin reiniciar ni borrar sus datos. No se utilizaron cuentas institucionales de .env.e2e.

## 3. Alcance y metodología

Se leyeron metadatos y fuentes de nueve funciones Cloud, sin invocarlas. Se compararon con el repositorio y se prepararon 39 archivos privados de candidato: fuentes, lock y configuración por función. Las versiones/bundles Cloud permanecieron iguales en la lectura final. Solo tres entrypoints difieren, pero también cambian módulos compartidos; no deducir que basta desplegar esas tres funciones. [Comparación](seguridad/comparacion-edge.json), [paquete final](seguridad/paquete-edge-final.json).

Los contratos unitarios simulan clientes/repositorios o transportes. Las suites HTTP ejecutan handlers originales y SDK reales contra Auth, REST, PostgreSQL y Storage locales; se sustituye únicamente el arranque del servidor para escucharlos en loopback. Deno restringe la red de esos handlers a destinos locales y el proceso carece de claves de FCM/Resend. La comprobación de tipos y el empaquetado no ejecutan lógica de negocio.

## 4. Comandos y resultados finales

COMANDOS.json y los archivos .meta.json conservan argumentos, duración, stdout/stderr y códigos de salida. Las llamadas MCP de lectura tienen éxito/error de herramienta y carecen de código de proceso; no se les atribuye exit 0.

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| EU-01 | Contratos Node de credenciales, roles, reportes, relaciones y scheduler | 35 | 35 | 0 | 0 | APROBADO; dependencias simuladas | [TAP](unitarias/regresion-edge-definitiva.stdout.log) |
| EH-01 | HTTP de usuarios y push, servicios locales reales | 12 | 12 | 0 | 0 | APROBADO, sin enviar FCM | [TAP](integracion/edge-http-pruebas-1793497535205.stdout.log) |
| EH-02 | HTTP de reportes y bloqueo de recordatorios | 9 | 9 | 0 | 0 | APROBADO, servicios locales reales | [TAP](integracion/reportes-http-pruebas-1793497867190.stdout.log) |
| SDK-01 | GoogleAuth real, firma JWT y getAccessToken con OAuth simulado | 1 | 1 | 0 | 0 | APROBADO; no proveedor real | [Registro](integracion/google-auth-contrato.stdout.log) |
| TS-01 | Deno: nueve entrypoints del candidato, lock congelado | — | — | — | — | APROBADO: 9 comprobados, exit 0 | [Comando](integracion/candidato-final-check.meta.json) |
| RET-01 | Compilación JavaScript de fuentes de retorno | — | — | — | — | APROBADO: 9 bundles, sin typecheck | [Metadatos](seguridad/bundles-retorno.json) |
| ACL-01 | Avance/retorno complementario y secuencia con SQL principal | — | — | — | — | APROBADO solo local | [Secuencia](seguridad/retorno-combinado.json) |
| AUD-01 | Deno audit del grafo npm candidato | — | — | — | — | EJECUTADO: 1 moderada inicial, 0 finales | [Final](seguridad/deno-audit-final.stdout.log) |
| BK-01 | Backup/restauración de base sintética | — | — | — | — | APROBADO con adaptación; intento directo falló | [Resultado](seguridad/backup-local-restaurado.json) |
| PROD-01 | Backup institucional, restauración y despliegue gestionado | 0 | 0 | 0 | 0 | BLOQUEADO: faltan respaldo/entorno y gates | [Estado](seguridad/estado-respaldo.json) |
| WEB/AND/E2E | Nuevos builds web/Android y Playwright | 0 | 0 | 0 | 0 | NO EJECUTADO en esta fase Edge | [Antecedente](../20261030-151554-preparacion-produccion-28e48d2/INFORME_VERIFICACION_TECNICA.md) |

Los denominadores se mantienen separados; no son 57 casos de integración real ni se suman los intentos repetidos. No se generó cobertura Jest nueva.

## 5. Correcciones comprobadas

La primera comprobación de los nueve entrypoints encontró **23 errores TypeScript**. Se conservaron tipos concretos de snapshots hasta cada renderer, se normalizaron relaciones PostgREST objeto/array unitario rechazando multiplicidad y se copió la vista de bytes antes de WebCrypto. No se añadieron supresiones ni any en producción para ocultar esos errores.

La revisión detectó dos controles incompletos: reportes ignoraba suspended al comprobar el usuario canónico, y recordatorios continuaba si faltaba REPORTS_SCHEDULER_SECRET. Ahora reportes rechaza personal suspendido antes de operar con service_role; recordatorios devuelve 503 sin secreto y 403 si es incorrecto, antes de consultar pagos. Se mantiene una respuesta válida para el job sin destinatarios y se abortan relaciones ambiguas antes de consultar dispositivos o enviar.

Las nueve pruebas HTTP nuevas verifican denegaciones y el flujo real de **padrón de estudiantes**: generación, snapshot con nombres sintéticos y totales coherentes, PDF en Storage, tamaño y SHA-256, caché y borrado de ejecución/artefacto/objeto. Los renderers de asistencias y finanzas pasan chequeo estático; no se ejecutó su generación satisfactoria en esta fase. Los metadatos del PDF se guardan sin campos personales en integracion/reporte-roster-*.json.

## 6. Permisos de reportes y orden SQL

Una consulta institucional de solo lectura confirmó permisos de service_role en vistas públicas, pero **ninguno en reporting.report_definitions, report_runs ni report_artifacts**. La prueba local reprodujo el bloqueo de acceso. Se preparó el [avance complementario](../../../../../database/security/production-proposal/20261101013935_reporting_service_grants_proposal.sql) y su [retorno](../../../../../database/security/production-proposal/20261101013935_reporting_service_return_proposal.sql), fuera de migraciones automáticas: SELECT sobre definiciones; SELECT/INSERT/UPDATE/DELETE sobre ejecuciones y artefactos. No se otorgó escritura de definiciones al backend. La fixture del catálogo se insertó mediante conexión PostgreSQL local verificada.

El complemento exige la huella aplicada del SQL principal. Orden de avance: **principal → complemento → componentes coordinados**; orden de retorno: **complemento → principal**, con clientes cerrados. Se ensayó el orden incorrecto, que fue rechazado, y la secuencia correcta recuperó la huella original y permitió reaplicar ambos. Para las pruebas HTTP de la base local histórica se aplicó el mismo cuerpo de GRANT; no se afirmó que esa base pasara el guard completo de producción. [Evidencia](seguridad/reporting-acl-ensayo.json).

## 7. Dependencias y alcance de seguridad

Deno audit detectó inicialmente uuid 9.0.1 con un aviso moderado. Se cambió el import flotante GoogleAuth 9 por **10.9.1 exacto**, compatible con Node >=18 según metadatos npm; el candidato usa un lock nuevo sin entradas antiguas sobrantes. El grafo npm candidato registra **cero avisos**. Se comprobó el SDK real generando una clave RSA efímera, verificando la firma de la aserción y el contrato getAccessToken, con transporte OAuth simulado y sin permisos de red. No demuestra permisos IAM ni entrega FCM.

La auditoría Deno no acredita ausencia de vulnerabilidades en módulos HTTPS/esm.sh, en Cloud, ni en todo el backend. Los avisos institucionales de PostgreSQL, pg_net y contraseñas continúan sujetos a acciones separadas. Los bundles de retorno conservan dependencias y comportamiento anteriores; su compilación no acredita seguridad de esas versiones. [Aviso consultado](https://github.com/advisories/GHSA-w5hq-g745-h8pq).


También se repitió npm audit en raíz, functions y riovoley: cada árbol registró cero avisos, con 1.439, 330 y 101 dependencias informadas respectivamente en sus metadatos. Esas cantidades no son casos de prueba ni prueban cobertura de los adaptadores locales, que se verificaron por separado en el expediente anterior. Véase [resultado de los tres árboles](seguridad/npm-auditorias-cierre.json). El comando npm run test:edge-contracts aprobó los 35 casos localmente y se añadió al workflow técnico; no se atribuye un resultado a una ejecución remota futura.

## 8. Artefactos y retorno Edge

El candidato y las fuentes Cloud están en directorios privados listados en paquete-edge-final.json, sin secretos incorporados al informe. Cada función de retorno tiene su propio árbol para no mezclar módulos compartidos de distintas revisiones. Cloud omitió cuatro imports solo de tipos en tres funciones; se registran y no se inventaron archivos para completarlos. Las nueve fuentes de retorno compilaron con deno bundle, cuyo modo estándar no comprueba tipos.

Esos bundles JavaScript son artefactos locales, **no el ESZIP original**, y sus hashes no deben compararse como igualdad con el hash del bundle Cloud. La herramienta experimental emitió advertencias de dependencias legadas conservadas en los logs. No hubo redeploy, ejecución del retorno gestionado ni cambio de verify_jwt, que permanece true en las nueve funciones observadas.

## 9. Respaldo y restauración

El usuario confirmó que no dispone de respaldo reciente ni de entorno de restauración comprobados. Se preparó el [procedimiento](../../../../produccion/RESPALDO_Y_RESTAURACION.md) y se ejecutó un ensayo real de pg_dump/pg_restore **solo con la base sintética**. El archivo privado tiene 408774 bytes y SHA-256 b66b13630424dc82535371afdde73e2e3e5c6f8c4e2d2d3d7bbb8865d6514e63. Se compararon huella de catálogo y contenido/recuentos de seis tablas, todos coincidentes. No contiene una copia institucional ni objetos Storage ni un servicio Auth gestionado completo.

El primer pg_restore falló porque calculate_age no es IMMUTABLE aunque una columna GENERATED almacenada depende de ella. En un segundo destino vacío se precargó esa función como IMMUTABLE únicamente durante la restauración y después se repuso su definición original. El dump y la base origen quedaron intactos; el destino fallido se conservó. PostgreSQL recalcula columnas GENERATED: la igualdad verificada corresponde solo a las fixtures y exige revisar valores derivados al restaurar datos institucionales. No se cambió volatilidad en producción.

## 10. Intentos conservados

| Registro | Casos reportados | Aprobados | Fallidos | Fallos por hook |
| --- | ---: | ---: | ---: | ---: |
| [edge-http-pruebas-1793496861549.stdout.log](integracion/edge-http-pruebas-1793496861549.stdout.log) | 12 | 12 | 0 | 0 |
| [edge-http-pruebas-1793497535205.stdout.log](integracion/edge-http-pruebas-1793497535205.stdout.log) | 12 | 12 | 0 | 0 |
| [edge-http-pruebas.stdout.log](integracion/edge-http-pruebas.stdout.log) | 12 | 0 | 12 | 12 |
| [reportes-http-pruebas-1793497177572.stdout.log](integracion/reportes-http-pruebas-1793497177572.stdout.log) | 9 | 9 | 0 | 0 |
| [reportes-http-pruebas-1793497541744.stdout.log](integracion/reportes-http-pruebas-1793497541744.stdout.log) | 9 | 9 | 0 | 0 |
| [reportes-http-pruebas-1793497867190.stdout.log](integracion/reportes-http-pruebas-1793497867190.stdout.log) | 9 | 9 | 0 | 0 |
| [reportes-http-pruebas.stdout.log](integracion/reportes-http-pruebas.stdout.log) | 9 | 0 | 9 | 9 |
| [contratos-edge-preparacion.stdout.log](unitarias/contratos-edge-preparacion.stdout.log) | 20 | 20 | 0 | 0 |
| [regresion-edge-cierre.stdout.log](unitarias/regresion-edge-cierre.stdout.log) | 33 | 33 | 0 | 0 |
| [regresion-edge-definitiva.stdout.log](unitarias/regresion-edge-definitiva.stdout.log) | 35 | 35 | 0 | 0 |
| [regresion-edge-final.stdout.log](unitarias/regresion-edge-final.stdout.log) | 13 | 13 | 0 | 0 |
| [regresion-edge-rojo.stdout.log](unitarias/regresion-edge-rojo.stdout.log) | 7 | 1 | 6 | 0 |
| [regresion-edge-verde.stdout.log](unitarias/regresion-edge-verde.stdout.log) | 10 | 6 | 4 | 0 |

Se conservan el primer arranque bloqueado por caché de tipos ausente, la repetición con API local apagada, los errores de tipos y los hooks bloqueados por permisos de reportes. La fixture de pruebas unitarias necesitó completar el mock rgb del módulo PDF; aquellos fallos no prueban fallos de renderizado. La primera preparación de retorno se detuvo por un import solo de tipos omitido por Cloud; se ajustó la validación AST manteniendo las fuentes exactas. No se ocultaron los fallos detrás de los cierres aprobados.

## 11. Compilaciones y Android

No se repitieron CRA, Gradle, emulador ni Playwright porque esta fase cambia Edge y documentación, sin cambios al cliente React/Android. Los expedientes anteriores conservan sus artefactos y denominadores. Deno check y deno bundle no equivalen a esas compilaciones ni a un despliegue Supabase.

## 12. Pendientes y límites

Faltan respaldo institucional recuperable y restauración aislada, validación gestionada del retorno, clientes web/APK/Capgo coordinados, bucket reports y configuración efectiva Auth/Storage, SMTP/Resend/FCM/scheduler, tratamiento de avisos Supabase, ventana y aprobación expresa. Ninguna clave o contraseña fue cambiada; no se invocaron operaciones institucionales. No se acreditan usabilidad, motivación, USE ni UES-SF mediante estas pruebas.

## 13. Evidencias

[Resultados calculados](RESULTADOS_AUTOMATIZADOS.json), [matriz](MATRIZ_VERIFICACIONES_TESIS.md), [texto académico](RESULTADOS_PARA_TESIS_4_5.md), [paquete final](seguridad/paquete-edge-final.json), [estado Cloud](seguridad/edge-institucional-final.json), [ACL leídas](seguridad/reporting-acl-institucional.json), [retorno combinado](seguridad/retorno-combinado.json), [backup local](seguridad/backup-local-restaurado.json) y los registros originales. COMANDOS.json, FUENTES_EVALUADAS.json y el manifiesto se completan al sellar.

