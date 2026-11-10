# Integración local de barrera y avance/retorno

Estado: ensayo PostgreSQL local, sin autorización o aplicación institucional. Se clonó un laboratorio sintético marcado, sin filas institucionales. La copia contiene 48 tablas, 68 filas sintéticas y siete secuencias; el origen conservó su huella y digests. La barrera se instaló sobre las 48 tablas y se retiró al concluir. [Estado final](integracion/estado-final-1794234721833-c3d36d.json).

El [manifiesto del intento final](integracion/intento-final.json) identifica los archivos exactos. La repetición posterior a revisión ejecutó los mismos bytes SQL persistidos en los artefactos y pasó 22/22 controles. Los registros canónicos anteriores conservan sus fallos históricos.

## Variantes exactas del ensayo

| Etapa | Original intacto | Variante local | SHA-256 de variante | Literales de guarda ajustados |
|---|---|---|---|---|
| principal-avance | [20261031211612_riovoley_security_production_proposal.sql](../../../../../database/security/production-proposal/20261031211612_riovoley_security_production_proposal.sql) | [SQL](integracion/variantes-locales/20261031211612_riovoley_security_production_proposal-1794234720581-7c118a.sql) | 775796a026d902d995119c82ff2c964355453435154a1c3a65c6b649cff1b87c | 1 |
| reportes-avance | [20261101013935_reporting_service_grants_proposal.sql](../../../../../database/security/production-proposal/20261101013935_reporting_service_grants_proposal.sql) | [SQL](integracion/variantes-locales/20261101013935_reporting_service_grants_proposal-1794234720585-0ba8d8.sql) | 203671ae9e9f9a1d689c33fb749c16da078a03f72dcbbcf6e07d8f21ca976e4d | 1 |
| reportes-retorno | [20261101013935_reporting_service_return_proposal.sql](../../../../../database/security/production-proposal/20261101013935_reporting_service_return_proposal.sql) | [SQL](integracion/variantes-locales/20261101013935_reporting_service_return_proposal-1794234720606-0c731f.sql) | 8ff94a194ae3ce59858e3ca7c1bcd78b68a8ddbe6d585b8045972e940ca828c1 | 2 |
| principal-retorno | [20261031211612_riovoley_security_return_proposal.sql](../../../../../database/security/production-proposal/20261031211612_riovoley_security_return_proposal.sql) | [SQL](integracion/variantes-locales/20261031211612_riovoley_security_return_proposal-1794234720612-71ecb6.sql) | c96c637855e537c06779bd2380775791e8b4818351484e911cbb9f3720a7b28f | 2 |

Las variantes añaden destino por nombre de base/comentario y digest de la barrera/inventario. Se ajustan únicamente los literales de huella medidos con la barrera instalada, conservando bytes de cuerpos originales y las guardas de catálogo. No eliminan la comprobación de deriva. El principal original rechazó su catálogo con la barrera instalada, lo que demuestra que no puede copiarse sin revisión. Los [estados medidos](integracion/huellas-con-barrera-1794234721735-8dc26d.json) pertenecen a esta copia, no a Cloud.

El recorrido final aprobó 22 controles automatizados Node assert + driver pg. Avance: principal y complemento. Retorno: complemento y principal. La barrera permaneció durante las cuatro etapas; cada etapa comprobó huella, digest, contenido/secuencias y rechazo SQL 55000 de una RPC sintética SECURITY DEFINER que intenta UPDATE sin filas bajo SET LOCAL ROLE authenticated. No se autenticaron usuarios mediante HTTP ni se ejecutó una funcionalidad de negocio institucional.

También se rechazaron alteración de función, disparador deshabilitado, tabla nueva fuera del inventario y orden de retorno incorrecto. El digest adicional cubre definiciones/ACL del esquema nuevo y estado de disparadores, aspectos que no cubre íntegramente la huella original. [Controles finales](integracion/resultado-final-1794234721835-e3a110.json), [operaciones SQL](integracion/operaciones-sql-1794234721846-ba0529.json).

## Incidencias conservadas

Primer ensayo: 19/20, fallo en retorno principal. El generador convirtió CRLF dentro de cuerpos SQL; la comparación detectó 31 definiciones diferentes. Se preservaron fuente y guardas originales y se corrigió la generación. [Causa](integracion/causa-y-correccion.json), [diferencias por hash](integracion/diferencias-retorno.json).

Segundo ensayo: 17/18, fallo en control del retorno anticipado; el separador del digest dependía del CRLF físico. Se corrigió usando escape SQL explícito. [Corrección](integracion/correccion-separador-digest.json). El ensayo final terminó 22/22, sin sumar las ejecuciones repetidas como controles únicos. Además se conservó el error inicial 42725 del digest y su corrección de casts, con códigos 1 y 0 en los recibos digest-red/digest-green.

## Condiciones pendientes

La barrera continúa siendo una capa SQL local. Quedan fuera Auth/Storage HTTP, objetos Storage, correo, push, scheduler, objetos no inventariados, secuencias como vía de escritura, DDL privilegiado y escritores postgres. La copia no recupera el respaldo institucional ni acredita su vigencia. Los cuatro SQL originales no se han reemplazado con estas variantes y todavía no existe un paquete institucional completo aprobado con aislamiento global.

La ventana propuesta del 7 de noviembre pasó; no se reprogramó ni se ejecutó. Faltan respaldo vigente al corte, ensayo gestionado que cubra efectos externos, validación institucional de compatibilidad y autorización específica de un paquete concreto. No desplegar estos SQL locales en Cloud. Los [límites del prototipo anterior](../20261105-204301-barrera-sql-local-ade1d17/PROPUESTA_AISLAMIENTO_SQL.md) siguen aplicando.

