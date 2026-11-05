# Paquete revisable de transición web, SQL y Edge

**Estado: preparado para revisión, no autorizado para ejecución y sin cambios institucionales.** Responsable: titular de esta sesión, confirmado por el usuario. Ventana propuesta por delegación: sábado 7 de noviembre de 2026, 22:00–23:30 en Ecuador (UTC−5), equivalente a 8 de noviembre 03:00–04:30 UTC. Reserva de 90 minutos: presupuesto operativo del agente, sin medición de baja demanda ni garantía de que un retorno gestionado quepa en ese plazo. Confirmar calendario institucional antes de activarla. [Ficha](OPERACION_PROPUESTA.json).

## Destinos y conjunto identificado

- Supabase: mayvvlkvheagkojunzzb, Riovoley APP, observado ACTIVE_HEALTHY; catálogo 15b9d9e869fb5113263c485714009878.
- Vercel: cuenta Riovoley, equipo joscoos-projects, proyecto prj_gnsNVKcXC8jvN0UcassXy4lZ0ZfN, dominio https://riovoley.com.
- Web productiva observada: dpl_DCPpv18kuroRoaEpV49xhGfY1isB, READY, commit e469db5608fb77071b6a9ee3db253c28dae734dd, rama main. Ese deployment es el punto web de retorno identificado, no un retorno ejecutado.
- Candidato fuente revisado: d2b43e466e2b727f4fa9824a72326a0d05aa5c95; [CI existente aprobado](https://github.com/Joscoo/riovoley/actions/runs/42059792014), con 434 casos Jest en 91 suites según su recibo. El commit posterior que solo incorpore este expediente requiere su propio CI.
- Android queda en desarrollo/pruebas y fuera de distribución. El APK debug verificado procede de 5f605512448f0683e8ddc52e197e42fa5d909868, SHA-256 6d552150179f818bce9bc587a079f49413efa22a3dd990651498b9c29088303c; no es un release institucional firmado.

## SQL exacto revisado

| Archivo | SHA-256 |
|---|---|
| [database/security/production-proposal/20261031211612_riovoley_security_production_proposal.sql](../../../../../database/security/production-proposal/20261031211612_riovoley_security_production_proposal.sql) | c61f457792f684d22dd3c8ffafcd1b4280dfefafdd66da382943f44347322fb6 |
| [database/security/production-proposal/20261031211612_riovoley_security_return_proposal.sql](../../../../../database/security/production-proposal/20261031211612_riovoley_security_return_proposal.sql) | c27856e19b750e9f430c57cbb736fff3138bc23197564a7816c367664ff928b3 |
| [database/security/production-proposal/20261101013935_reporting_service_grants_proposal.sql](../../../../../database/security/production-proposal/20261101013935_reporting_service_grants_proposal.sql) | 4c6c9fb9771751b1e0f15920faab664a9400c8f8b39b7288db97e7fdf0ad0d0d |
| [database/security/production-proposal/20261101013935_reporting_service_return_proposal.sql](../../../../../database/security/production-proposal/20261101013935_reporting_service_return_proposal.sql) | 5c0904bdd90d93a8d8def5ef780aef5a0a1a44570ab9ed54db78213e599bf333 |

Avance: principal de seguridad, después complemento de reportes. Retorno, solo por decisión operativa y con clientes aislados: complemento de reportes primero, principal después. Los cuatro archivos no se ejecutan como una lista secuencial: los retornos no forman parte del avance normal. [Orden y guardas](seguridad/guardas-y-orden-sql.json).

Huellas previstas por las guardas del paquete: origen 15b9d9e869fb5113263c485714009878; después del principal 500d15ffa5fa23aeddb47e5c21cd1d13; después del complemento 38434a2af96ad410967032b00a0828ac. El retorno complementario vuelve al estado posterior al principal; el retorno principal vuelve al origen. Estas huellas proceden de los archivos ya ensayados, no de una ejecución institucional de esta fase.

Los marcadores de aprobación y closed-to-clients no autorizan el cambio ni suspenden tráfico. No modificarlos para eludir la falta de ventana o mantenimiento efectivo. El primer paso de la ventana debe abortar si existe deriva o falta un requisito.

## Edge y retorno preparado

| Función Cloud observada | Revisión | SHA-256 publicado en metadatos |
|---|---:|---|
| send-email | 20 | 9c097c7f94aac8f2399560ebfd184f8f017c082650375ed777a3f05fc46fe909 |
| update-user-password | 21 | 34eedb50281c26d6aec8ef04d7556d3136cb909a2f9eb3f86f773415c1d64649 |
| delete-auth-user | 6 | a48f507f4b7ae1ccda5ac36ec939ed9dcdf047eaf5174697449fd5a1aedacc49 |
| generate-report | 11 | 9aae62ae304649cd52f9be8aa62d9bffd9b2c42046d7da014fca8ea371dd4a9d |
| generate-scheduled-reports | 11 | b640a0903625eb195d26cbc6043940340615b1aa5a56414ff4c1bc1726d6f480 |
| delete-report-run | 7 | d30e4a2b5c8f3ba2cda9a15345289129ae2b94ab4432f1fe4c36c93ac87cfe40 |
| sync-mobile-device | 9 | 39b175f5e2762166ae0a18c4324025c09b496302f27c86e412bc5f0d1f7cd536 |
| send-push | 15 | 4352841040d00df16572b8c0d20a22c2564f81d266760e306da2e53c16b51fbd |
| send-payment-reminders | 10 | 6f899b18d9ab91b767e08e9ee58dd0506359a6c8a45287160825e9283c8b8605 |

Los nueve hashes de metadatos coinciden con el retorno preparado. No se descargaron nuevos bytes Cloud. Se comprobaron 39 archivos privados del candidato y 51 archivos fuente privados de retorno repartidos en nueve funciones. Los TS del candidato coinciden con el repositorio después de normalizar CRLF; no equivale a igualdad binaria de todos los despliegues. No se ensayó ahora un retorno gestionado. [Candidato/SQL](seguridad/artefactos-sql-edge-verificados.json), [retorno](seguridad/retorno-edge-archivos-verificados.json).

## Agenda propuesta y condiciones de parada

| Tramo Ecuador | Acción prevista, solo tras aprobación | Condición para continuar |
|---|---|---|
| 22:00–22:15 | Gate previo y control efectivo de escrituras/clientes | Destinos, hashes y catálogo sin deriva; respaldo vigente al corte; responsable presente; autorización específica registrada |
| 22:15–22:35 | SQL principal y complemento, con verificaciones entre etapas | Huellas previstas, RLS/ACL/firmas y RPC diaria verificadas por lectura antes de Edge |
| 22:35–22:50 | Revisiones Edge compatibles | Contratos y denegaciones controladas sin efectos; detener ante deriva o respuesta inesperada |
| 22:50–23:10 | Promoción web compatible y comprobaciones públicas | Artefacto/commit correctos, versión efectiva de Node registrada, GET/recarga SPA esperados; no ejecutar login que otorgue XP o escrituras de prueba en producción |
| 23:10–23:30 | Observación y reserva de retorno | Solo reabrir con aceptación del responsable; no forzar reapertura por llegar a la hora final |

La agenda es una propuesta, no tiempos medidos de despliegue. Android, cambios Auth, actualización PostgreSQL, traslado de pg_net y tareas de claves quedan fuera. Correos/push, recuperación real y restauración gestionada de Storage no se presentan como comprobados; el responsable debe resolver si esa falta de evidencia impide la apertura de su operación.

Abortar antes de mutar si cualquier hash/destino/huella cambia, alguna precondición agregada deja de ser cero, no existe respaldo vigente o no se demuestra suspensión de escrituras y control de clientes anteriores. Un aviso en la portada o impedir nuevas visitas web no bloquea por sí solo clientes SPA ya abiertos que llaman directamente a Supabase. Si no puede aislarse el tráfico, este orden no es apto: diseñar y ensayar una transición de expansión compatible antes de ejecutarlo.

Detener la progresión ante un 5xx o resultado inesperado en las comprobaciones de promoción, RPC/ACL/firmas ausentes, denegación de un acceso legítimo confirmado o duplicación de recompensa. Los 401/403 que se esperan en comprobaciones de denegación no son fallos por sí solos. No realizar pruebas de escritura institucional para intentar demostrar un problema.

El retorno coordina web, Edge y SQL bajo control de clientes. Nunca restaurar SQL anterior mientras clientes o Edge nuevos siguen activos. Primero conservar las escrituras posteriores y decidir reconciliación si hubo alguna; los scripts de retorno restablecen catálogo/permisos previos y no recuperan datos. El respaldo actual conserva integridad cifrada pero data del 2026-11-01T02:58:51.738Z; su hash no prueba vigencia para esta ventana. [Respaldos y alcance](seguridad/respaldos-recibos-actuales.json), [runbook](../../../../produccion/RUNBOOK.md).

## Requisitos aún abiertos

- Confirmar calendario institucional y ventana definitiva
- Confirmar respaldo vigente al corte y alcance real de recuperacion
- Demostrar suspension efectiva de escrituras y control de clientes anteriores; un marcador SQL o pagina de mantenimiento no lo demuestra
- Fijar criterios operativos de aborto/retorno y aceptacion de integraciones no verificadas
- Autorizar expresamente el paquete concreto antes de cualquier mutacion o despliegue

La respuesta del usuario designó responsable y delegó una propuesta horaria en una pregunta que decía expresamente sin ejecutar cambios todavía. No se interpreta como autorización SQL, despliegue, cambios Auth o permisos. La exclusión de tareas con claves se conserva. Este documento no inicia la ventana ni programa acciones automáticas.

