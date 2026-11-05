# Verificación técnica: copia institucional y restauración aislada

## 1. Identificación, tiempo y estado

RIOVOLEY; repositorio Joscoo/riovoley; commit base **63826e6098ce1358f2e0cf727790c680dd458449**, con nuevas herramientas, pruebas y documentación durante la ejecución. Inicio del expediente **2026-11-01T03:02:16.474Z** UTC. Hubo una pausa nocturna; las duraciones activas se conservan por comando y no se presentan las horas de pausa como tiempo de restauración. FUENTES_EVALUADAS.json registra los hashes de las fuentes evaluadas antes del commit de entrega. El [expediente anterior](../20261101-023445-backup-cifrado-2b4e9eb/INFORME_VERIFICACION_TECNICA.md) dejó el asistente listo, con la copia institucional todavía pendiente en ese momento.

El usuario ejecutó después el asistente con entrada local oculta: la copia cifrada terminó el **2026-11-01T02:58:51.738Z**, con **1418439 bytes**, SHA-256 **22da6c77d9bbd3def2e6113c6c53531d76d900c0abe9c1f364c2dbb7828e54e6** y 1400 entradas de TOC. Se verificaron nuevamente archivo y clave por hash. El recibo registra descifrado y pg_restore --list con código cero, y recuperación desde la clave exportada. La contraseña PostgreSQL, la frase y la clave del servidor Storage no se recibieron por chat ni se publicaron. [Recibo de metadatos](seguridad/respaldo-institucional.json).

## 2. Entornos, alcance y método

Windows y Node v24.18.0/npm11.16.0; PowerShell5.1; clientes PostgreSQL17.11; GnuPG2.4.9; SDK Supabase2.105.4. [Versiones verificadas anteriormente](../20261101-023445-backup-cifrado-2b4e9eb/INFORME_VERIFICACION_TECNICA.md). Docker local usó la imagen PostgreSQL Supabase17.11 fijada por digest en [el aislamiento](seguridad/aislamiento-destino.json). La base institucional corresponde al proyecto mayvvlkvheagkojunzzb. Solo se realizaron lecturas de catálogo/agregados y GET de archivos; no se ejecutó login E2E, SQL de modificación o despliegue institucional.

El destino final **riovoley-restore-20261101-030216-07** tiene network=none, cero puertos publicados, ningún bind mount del host, log-driver=none y PGDATA en tmpfs. PostgreSQL escucha solo por socket Unix; cron.launch_active_jobs=off y max_worker_processes=0. No se iniciaron servicios Auth, Edge, Storage API, correo o push. Una parada del contenedor/motor pierde el contenido temporal; los respaldos cifrados son los artefactos persistentes, no el volumen de ensayo.

La carga adapta únicamente calculate_age en el destino vacío: definición temporal IMMUTABLE para crear la columna GENERATED, omisión de su entrada de definición en TOC y recuperación posterior de la definición original. Se conservaron todos los intentos fallidos. El bootstrap local copia atributos necesarios de roles leídos sin contraseñas, fuerza NOLOGIN en roles de servicio y mantiene postgres superusuario para operar; no restaura contraseñas ni membresías globales. La propiedad de event triggers requiere supabase_admin superusuario en el destino. [Roles y límites](seguridad/bootstrap-roles.json). Esto no demuestra la autorización efectiva del servicio gestionado.

## 3. Comandos y reproducibilidad

- node --test --test-reporter=tap tests/unit/institutional-restore.test.cjs tests/unit/restore-guards.test.cjs tests/unit/restore-data.test.cjs tests/unit/storage-backup.test.cjs
- node scripts/production/restore-isolated.cjs
- node scripts/audit/production/compare-restored-data.cjs
- powershell -NoProfile -ExecutionPolicy Bypass -File scripts/production/unlock-restore.ps1
- powershell -NoProfile -ExecutionPolicy Bypass -File scripts/production/storage-backup.ps1

Los helpers exigen el contexto privado, archivo identificado y un expediente sin sellar; no son un instalador universal. Las herramientas de fixtures nunca deben apuntarse al backend institucional. [Guía operativa](../../../../produccion/RESPALDO_Y_RESTAURACION.md), [comandos registrados](COMANDOS.json). Las invocaciones realizadas por el usuario se sustentan en sus recibos y artefactos verificados; no existe captura independiente de todos sus códigos nativos por objeto. Los comandos automatizados de esta sesión conservan código, tiempos y stdout/stderr sanitizados; los errores potencialmente sensibles se guardaron cifrados en runtime privado.

## 4. Resultados y denominadores

| Código | Verificación | Casos ejecutados | Aprobados | Fallidos | Omitidos | Estado | Evidencia |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| R01 | Contratos Node de herramientas, 4 archivos | 32 | 32 | 0 | 0 | APROBADO | [TAP](unitarias/respaldo-restauracion-final.stdout.log), [salida](unitarias/respaldo-restauracion-final.meta.json) |
| R02 | Flujo final de carga SQL y catálogo | 1 flujo | 1 | 0 | 0 | APROBADO con adaptación documentada | [Resultado](integracion/restauracion-institucional-final.json), [comando](integracion/restore-institucional-intento-07.meta.json) |
| R03 | Contenido de entradas TABLE DATA / COPY | 94 tablas | 94 | 0 | 0 | APROBADO; 27159 filas | [Comparación](integracion/datos-restaurados.json) |
| R04 | Estados de secuencias | 11 | 11 | 0 | 0 | APROBADO | Misma comparación; denominador distinto |
| R05 | Coherencia actual de columna GENERATED edad | 1 columna | 1 | 0 | 0 | APROBADO; no valida el valor almacenado histórico | Misma comparación |
| R06 | Archivos Storage descargados, cifrados y recuperados | 43 objetos | 43 | 0 | 0 | APROBADO para bytes; no Storage API | [Recibo](seguridad/storage-respaldo-real.json) |
| R07 | Cifrado sintético de archivos | 1 flujo / 3 fixtures | 1 flujo | 0 | 0 | APROBADO; corrupción rechazada | [Integración](integracion/storage-cripto-sintetico.json) |
| R08 | Jest/componentes del producto | 0 en esta fase | 0 | 0 | 0 | NO EJECUTADO | Sin cambios en lógica del producto; antecedentes separados |
| R09 | Playwright | 0 en esta fase | 0 | 0 | 0 | NO EJECUTADO | Sin login contra cuentas institucionales |
| R10 | Compilación web / Android | — | — | — | — | NO EJECUTADO en esta fase | No se modificaron fuentes frontend/nativas |
| R11 | Recuperación integral de Supabase gestionado | 0 | 0 | 0 | 0 | NO EJECUTADO | Auth/Storage API, secretos, raíz Vault y proveedores no acreditados |

No sumar filas superpuestas: R03–R05 son controles complementarios sobre la carga R02. R01 son pruebas Node, con suites=0 según el runner; cuatro archivos no se presentan como cuatro suites. No se generó cobertura CRA en esta fase. Los controles del SDK utilizan transporte simulado en R01; R06 sí utilizó el servicio institucional real mediante GET. R07 usa GnuPG real con datos sintéticos.

## 5. Alcance de la recuperación comprobada

La carga final y el catálogo terminaron con código cero; la huella coincidió exactamente: **15b9d9e869fb5113263c485714009878**. El snapshot de catálogo de referencia contiene 1101 elementos canónicos. La comparación de contenido cubrió las **94 entradas TABLE DATA** presentes en la copia y sus **27159 filas**, con hash interno independiente del orden físico; no se publicaron filas o hashes de contenido por tabla. No se equiparan estas entradas con todas las tablas que crean las extensiones. Los 11 estados de secuencia coincidieron. No había entradas BLOB en el TOC comprobado.

Las columnas incluidas en COPY coinciden; core.students.edad queda fuera porque PostgreSQL recalcula las columnas almacenadas GENERATED. No se detectaron discrepancias con su expresión actual, pero el valor almacenado histórico no está en el archivo lógico y no se declara idéntico. Tampoco se compararon filas contra producción viva, que puede haber cambiado desde el respaldo.

Storage finalizó entre **2026-11-01T16:14:26.787Z** y **2026-11-01T16:15:52.600Z**: **43 objetos y 3596269 bytes**. Los 43 ETag eran comparables como MD5 y coincidieron con los bytes descargados respecto del inventario SQL. Cada archivo y el manifiesto de rutas se cifraron; se comprobó descifrado y SHA-256 de los archivos recuperados en un directorio tmpfs del contenedor aislado. No se escribieron archivos en claro en el repositorio ni se publicaron nombres de buckets/objetos. La lectura ocurrió después del snapshot SQL: no es un snapshot atómico común y no detecta incorporaciones posteriores automáticamente. Recuperar bytes no acredita Storage API, URLs firmadas, configuración de buckets o integración cliente.

## 6. Incidencias, seguridad y revisión

Se conservaron siete intentos de restauración. Los primeros fallaron por la ruta de tail, la interpretación del argumento --host del cliente por la guarda Docker, precarga pg_net ausente y atributos insuficientes del propietario de event triggers. El sexto cargó SQL pero falló la verificación de catálogo: se aisló únicamente calculate_age, con dos CR introducidos al extraer SQL mediante el cliente Windows. La normalización a los LF originales recuperó su definición exacta; el séptimo intento aprobó. Los intentos anteriores no se reclasificaron como aprobados. La caché de recuperación expiró durante la pausa; hubo un desbloqueo fallido y uno posterior satisfactorio, sin recibir la frase por chat. [Diferencia aislada](seguridad/catalogo-diferencias.json), [recuperación de clave](seguridad/recuperacion-clave-renovada.json).

La revisión independiente identificó tres controles importantes: no publicar texto nativo arbitrario, rechazar huellas distintas y exigir el vínculo exacto del archivo SQL con el inventario de Storage. Se añadieron regresiones RED→GREEN; el cierre es 32/32, sin modificar lógica de negocio para conseguir aprobaciones. Los diagnósticos finales solo publican categorías permitidas, nunca mensajes arbitrarios de SQL. La prueba sintética del SDK detectó inicialmente un endpoint de descarga diferente del supuesto; se ajustó la guarda al endpoint GET usado por la versión instalada, conservando host fijo y prohibición de escrituras.

No se repitieron npm audit, advisors o pruebas RLS institucionales en esta fase. El catálogo restaurado conserva políticas/grants definidos en la copia; la igualdad no demuestra por sí sola su suficiencia. No se aplicaron las propuestas SQL/Edge ni se desplegó web/Android. Este alcance no es una prueba de penetración ni evaluación de usabilidad o motivación.

## 7. Pendientes y referencias

Custodiar fuera del único equipo una copia cifrada aprobada, clave exportada y frase por separado; su custodia externa no se ha comprobado. Completar recuperación gestionada de Auth/Storage, claves PII/Vault y secretos/configuración de proveedores; comprobar web, Android/Capgo y clientes previos, transición compatible, CI hospedado, responsables y ventana. PITR/RPO/RTO no se declaran acreditados. El release necesita aprobación específica del paquete y la ventana una vez cerrados esos requisitos.

[Matriz](MATRIZ_VERIFICACIONES_TESIS.md), [propuesta académica](RESULTADOS_PARA_TESIS_4_5.md), [resultados calculados](RESULTADOS_AUTOMATIZADOS.json), [privacidad](PRIVACIDAD.json), [integridad](INTEGRIDAD.json), [manifiesto](MANIFIESTO_SHA256.json). No se modificó el documento de tesis.
