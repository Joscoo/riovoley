# Criterios propuestos de corte y retorno

Estado: preparación documental; no habilita mantenimiento, no bloquea tráfico y no autoriza SQL o despliegues. Responsable confirmado: titular de la sesión. Ventana propuesta: 7 de noviembre de 2026, 22:00–23:30 Ecuador (UTC−5), todavía por confirmar. Android continúa fuera de distribución. El [paquete anterior](../20261105-160424-transicion-lectura-d2b43e4/PAQUETE_TRANSICION_PROPUESTO.md) identifica destinos, hashes y orden SQL/Edge/web; no se reemplazan sus cuatro SQL.

## Decisión antes del primer cambio

| Condición | Evidencia exigida al corte | Estado actual |
|---|---|---|
| Recuperación de datos | Snapshot identificado y verificable del estado de corte; recuperación aislada y cobertura SQL, Storage y configuración conocidas. Registrar horas reales; no asumir RPO/RTO. | BLOQUEADO: la copia lógica es del 2026-11-01T02:58:51.738Z; su hash coincide, pero no acredita vigencia futura. La consulta administrada no estableció punto recuperable. |
| Escrituras y clientes anteriores | Mecanismo implementado y ensayado que impida las operaciones incompatibles de sesiones abiertas y clientes anteriores, con denegación comprobada en entorno aislado para cada vía afectada. | BLOQUEADO: no se implementó ni activó un mecanismo global en esta fase. |
| Artefactos y precondiciones | Revalidar SHA candidato, CI, destinos, huellas de catálogo y hashes de avance/retorno inmediatamente antes de la ventana. | Preparados en la revisión anterior; requieren nueva lectura al corte. |
| Integraciones | Decidir explícitamente si correo, push y scheduler son requisitos del release; si lo son, aportar su comprobación autorizada y aislada. No aprobar una entrega por ausencia de errores locales. | Pendiente de aceptación; comprobaciones con claves excluidas por el usuario. |
| Calendario y autoridad | Confirmación institucional de horario y autorización explícita del paquete concreto. | Propuesta horaria y responsable disponibles; ejecución no autorizada. |

Si falta cualquiera de los requisitos aplicables, no iniciar SQL, despliegue Edge o promoción web. Un plan free, WAL-G habilitado, una respuesta HTTP 200, CI verde, ausencia momentánea de actividad o un marcador de sesión no sustituyen estas evidencias.

## Alcance del control de clientes

El código usa un cliente Supabase para operaciones que no tienen por qué pasar por la página web alojada en Vercel. Estas referencias se comprobaron por archivo, línea y SHA-256; no se invocaron:

| Referencia | Fuente |
|---|---|
| REST/RPC | [src/features/gamification/infrastructure/repositories/supabaseGamificationRepository.js](../../../../../src/features/gamification/infrastructure/repositories/supabaseGamificationRepository.js) · línea 73 |
| Auth | [src/features/account-admin/infrastructure/repositories/supabaseAccountAdminRepository.js](../../../../../src/features/account-admin/infrastructure/repositories/supabaseAccountAdminRepository.js) · línea 150 |
| Storage | [src/features/reporting/infrastructure/repositories/supabaseReportingRepository.js](../../../../../src/features/reporting/infrastructure/repositories/supabaseReportingRepository.js) · línea 39 |
| Edge correo | [src/features/communications/infrastructure/repositories/supabaseCommunicationsRepository.js](../../../../../src/features/communications/infrastructure/repositories/supabaseCommunicationsRepository.js) · línea 89 |
| Edge dispositivos | [src/shared/infrastructure/mobile/supabaseMobileDeviceRepository.js](../../../../../src/shared/infrastructure/mobile/supabaseMobileDeviceRepository.js) · línea 17 |
| Edge push | [src/shared/infrastructure/mobile/supabasePushNotificationGateway.js](../../../../../src/shared/infrastructure/mobile/supabasePushNotificationGateway.js) · línea 48 |
| Marcador de ventana | [scripts/audit/production/sql-lab.cjs](../../../../../scripts/audit/production/sql-lab.cjs) · línea 39 |

Son referencias seleccionadas, no un inventario exhaustivo de endpoints. La operación Storage citada crea una URL firmada; no demuestra subida de objetos. Bloquear navegación web no demuestra bloqueo de REST/RPC, Auth, Storage o Edge por su URL directa. Los marcadores SQL solo participan en las guardas del paquete. No se ensayaron denegaciones institucionales ni se revocaron sesiones, roles o permisos.

Cualquier mecanismo nuevo de aislamiento requiere propuesta propia, ensayo local y autorización para activarlo. Si modifica el catálogo cubierto por la huella, debe revisarse el paquete SQL y repetirse su avance/retorno; no se debe eludir la guarda de deriva para hacer coincidir el ensayo.

## Criterios durante una futura ejecución autorizada

1. Antes de SQL, abortar el inicio ante deriva de huella/hash/destino, respaldo sin vigencia o clientes sin aislamiento demostrado. No establecer los marcadores para simular condiciones que no existen.
2. Después de cada etapa, no avanzar si el comando falla, aparece un error inesperado, falta una RPC requerida, difieren permisos/huella previstos o falla un contrato de aceptación. Conservar código, hora y metadatos sin datos personales.
3. Los smoke de aceptación deben tener cuentas y efectos expresamente autorizados; esta preparación no permite crear registros ni enviar correo/push institucional. La ausencia de dicho ensayo mantiene pendiente la aceptación funcional gestionada.
4. Solo reabrir con etapas y criterios aprobados. La reserva total de 90 minutos es una propuesta, no una duración de recuperación medida. Si se aproxima el límite sin aceptación, mantener el aislamiento y solicitar decisión operativa; no improvisar una restauración.

## Retorno

No se ejecuta como parte del avance normal. El responsable decide entre corrección hacia adelante y retorno, preservando las escrituras posteriores al corte antes de cualquier recuperación de datos. El orden SQL preparado es retorno complementario de reportes y después retorno principal; no ejecutar retorno contra una huella distinta de la prevista. Mantener coherencia entre SQL, Edge y cliente; no volver un componente mientras otro siga usando contratos incompatibles. Un retorno de esquema no restaura datos borrados y un restore puede perder cambios posteriores.

El estado objetivo debe comprobar catálogo, contratos, versión web/Edge y tratamiento de los cambios posteriores. Los ensayos locales previos no acreditan un retorno administrado en producción ni recuperación integral de Supabase. Si no se puede demostrar compatibilidad, conservar mantenimiento y escalar al responsable.

