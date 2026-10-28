# Cambios de seguridad pendientes de autorización

Este documento y `PROPUESTA_RPC_PAGOS_NO_APLICADA.sql` son propuestas revisables; no se ejecutaron cambios de esquema, RLS, funciones o permisos en ningún backend durante esta etapa de cierre.

## RPC de pagos

La instantánea de la auditoría contiene cuatro firmas SECURITY DEFINER ejecutables por anon: soft_delete_payment y restore_payment, con identificadores UUID y bigint. Las firmas UUID modifican pagos sin validar al actor. La propuesta añade verificación de usuario/personal no suspendido, referencias de esquema explícitas y search_path limitado; revoca ejecución anónima y conserva las firmas bigint como rechazo explícito porque la PK observada es UUID. No se elimina ninguna función.

Antes de aplicar: volver a consultar definiciones, propietarios, tipos, grants y callers actuales; comparar con la instantánea, guardar un respaldo de definiciones/ACL y revisar la compatibilidad de las firmas legadas. Primero probar en el backend descartable: anon y atleta rechazados; administrador/entrenador autorizados; restauración idempotente; usuario suspendido rechazado; casos rollback. La propuesta no tiene una aprobación dinámica de PostgreSQL todavía.

La restricción de estas RPC no cierra todas las rutas de escritura de pagos. Las políticas de la instantánea también permiten escrituras del atleta sobre sus propios pagos, y el repositorio cliente utiliza UPDATE directo. Por tanto, un cambio exclusivo de las RPC no impide modificar `deleted_at` mediante REST ni garantiza bloquear por esa ruta a personal suspendido. Se debe revisar conjuntamente RLS, privilegios por columna y callers antes de afirmar que borrar/restaurar queda reservado al personal. Este SQL es una propuesta parcial para las RPC, no una corrección completa del acceso a pagos.

Además, conservar sobrecargas UUID y bigint con el mismo nombre de argumento `payment_id` puede provocar ambigüedad PGRST203 al invocarlas mediante PostgREST. El rechazo dentro de bigint no resuelve un error anterior de selección de firma. Antes de considerar aplicable la propuesta se requiere decidir la compatibilidad de callers y las firmas legadas, y comprobar llamadas REST/RPC reales para cada rol; ejecutar SELECT SQL directamente no basta. El borrador no está listo para aplicarse tal cual.

La revisión estática identificó otra dependencia: `payments_audit_trigger` llama a `public.audit_payments()`, que en la instantánea inserta en `payments_audit` sin calificar el esquema ni establecer su propio `search_path`. Restringir el path de la RPC a `pg_catalog` puede impedir resolver esa relación y revertir incluso operaciones autorizadas. La corrección completa debe resolver esa dependencia (por ejemplo, referencia explícita a `audit.payments_audit` y contexto seguro en el trigger) y comprobarla mediante operaciones descartables antes de aplicar cambios reales. Es una inferencia de las definiciones inspeccionadas, no una ejecución del borrador.

## XP, wallet y recompensa diaria

No basta revocar las políticas actuales de escritura: el servicio de gamificación usa esas escrituras para recalcular progreso y registrar el ingreso diario. Aplicar una revocación aislada rompería esos flujos.

El cambio coordinado debe mantener lecturas por propietario y transferir las escrituras de XP/saldos a operaciones autorizadas. La recompensa diaria debe resolverse con una operación atómica que derive actor, fecha y 8 XP en el servidor, sin aceptar importes o fechas arbitrarias. Después se debe restringir INSERT/UPDATE/DELETE directo del atleta sobre ledger, wallet y estado de recompensas, y verificar que compras/equipamiento y sincronización administrativa mantienen sus invariantes. Se requiere implementar y validar ese contrato de backend junto con el repositorio cliente; no se presenta como una corrección ya aplicada.

## Dependencias

Se aplicaron actualizaciones permitidas por npm audit fix, sin --force ni scripts de instalación. Los avisos críticos quedaron en cero, pero hay avisos residuales y el árbol functions incorporó más registros moderados; se conservan conteos separados. npm propone para algunos casos react-scripts 0.0.0 o una degradación de Genkit; no son remediaciones funcionales aceptables sin un trabajo de compatibilidad independiente. No se ocultan avisos con umbrales, omisiones o cambios de expectativas.

La autorización pendiente para RLS/RPC debe indicar expresamente el entorno. Preparar y validar en el backend local no autoriza aplicar cambios en producción; esa aplicación debe aprobarse sobre el SQL final y su evidencia de pruebas.
