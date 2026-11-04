# Paquete de producción preparado para revisión

Estado al 2026-11-04T20:24:05.230Z: **no aplicado, sin ventana ni autorización de mutaciones institucionales**. Destino identificado: mayvvlkvheagkojunzzb; frontend joscoos-projects/riovoley, riovoley.com. Commit base d9cdfb7a91ff5971e138ac4abd751dd76d7a080a. No ejecutar scripts locales contra producción ni cambiar los marcadores para eludir las guardas.

| Orden | Artefacto | SHA-256 |
|---|---|---|
| 1 | database/security/production-proposal/20261031211612_riovoley_security_production_proposal.sql | c61f457792f684d22dd3c8ffafcd1b4280dfefafdd66da382943f44347322fb6 |
| 2 | database/security/production-proposal/20261031211612_riovoley_security_return_proposal.sql | c27856e19b750e9f430c57cbb736fff3138bc23197564a7816c367664ff928b3 |
| 3 | database/security/production-proposal/20261101013935_reporting_service_grants_proposal.sql | 4c6c9fb9771751b1e0f15920faab664a9400c8f8b39b7288db97e7fdf0ad0d0d |
| 4 | database/security/production-proposal/20261101013935_reporting_service_return_proposal.sql | 5c0904bdd90d93a8d8def5ef780aef5a0a1a44570ab9ed54db78213e599bf333 |

La numeración identifica archivos; no ordena ejecutar los retornos tras los avances. Avance operativo: principal de seguridad, complemento de reportes, Edge/clientes coordinados bajo ventana cerrada. Retorno por decisión operativa: coordinar componentes y mantener la ventana cerrada; primero complemento de reportes, después principal. El retorno restituye permisos anteriores y no recupera datos ni reconcilia escrituras posteriores.

| Requisito | Resultado actual | Acción pendiente |
|---|---|---|
| Huella del catálogo | Coincide: 15b9d9e869fb5113263c485714009878 | Repetir lectura justo antes de una ventana aprobada |
| Precondiciones agregadas | Cuatro contadores en cero | No reemplaza revisión de nuevos datos al corte |
| SQL preparado | Cuatro hashes coincidentes con evidencia previa | Aprobar expresamente estos archivos/destino antes de ejecutar |
| Edge y retorno | Nueve hashes Cloud coinciden; revisiones administrativas distintas | Mantener esas referencias y revisar configuración de la ventana |
| Web/Android | Web productiva anterior; APK nuevo íntegro sin runtime nuevo | Validar candidato nativo y coordinar promoción de clientes |
| Backup | Existe antecedente de recuperación SQL/bytes Storage | Confirmar vigencia para la ventana; no se desbloquean copias en esta fase |
| Operación | Sin responsable ni ventana definidos | Definir responsable, duración y criterios de aborto/retorno |
| Proveedores | Validación detenida por indicación del usuario | No declarar comprobado correo, push o recuperación real |
| Plataforma | pg_net, parches PG y ajustes Auth siguen observados | Revisiones y autorizaciones separadas; sin cambios automáticos |

La preparación se sustenta en [los cuatro hashes](seguridad/sql-cuatro-archivos-revalidados.json), [el catálogo](seguridad/metadatos-mcp-actuales.json), [los bundles](seguridad/edge-bundles-actuales.json), [el runbook](../../../../produccion/RUNBOOK.md) y [el informe](INFORME_VERIFICACION_TECNICA.md). No es una instrucción para aplicar los archivos ahora.
