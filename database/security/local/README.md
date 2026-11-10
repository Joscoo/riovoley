# Endurecimiento validado exclusivamente en Supabase local

El usuario autorizó continuar la corrección en el entorno descartable. La migración `20261029141114_riovoley_security_local.sql` se originó mediante Supabase CLI y se conserva fuera de `supabase/migrations` para impedir su aplicación automática. No se aplicó a producción.

El cambio conserva la sincronización administrativa de gamificación y restringe las escrituras del atleta sobre resultados, fuentes deportivas y relaciones de identidad. No transforma todo el cálculo de XP en lógica PostgreSQL ni elimina la autoridad administrativa del personal activo. Las lecturas del panel ya no escriben campañas, premios ocultos o etapas. El ingreso diario es una RPC sin parámetros de actor, fecha o XP: deriva el usuario de Auth y la fecha de Ecuador, concede ocho XP en una transacción y comprueba idempotencia por actor y fecha. También se impide duplicar la relación de estudiante por usuario.

Las RPC UUID de pagos son SECURITY INVOKER, exigen personal activo y ya no compiten con las firmas bigint; estas últimas se conservan con nombres legados y sin ejecución web. La auditoría de pagos usa esquemas explícitos. Los roles de personal no se obtienen de metadatos editables ni de un perfil alternativo cuando falta el usuario canónico. El personal suspendido no crea otra cuenta administrativa por REST/RPC ni escribe resultados. Se mantienen las operaciones de suspensión/reactivación y borrado de atletas que la política existente admitía para el entrenador.

La tienda comprueba el desbloqueo al adquirir un elemento. Para niveles contempla los XP diarios persistidos aunque el perfil administrativo todavía no se haya resincronizado. La escala SQL conserva los umbrales 0/200/450/750/1100 de los niveles 1–5 del dominio JavaScript; un cambio futuro de esa regla debe actualizar y probar ambos lugares. Los elementos ya adquiridos conservan su propiedad; el equipamiento no revoca retrospectivamente compras válidas.

## Reproducción

Preparar primero el [entorno local](../../../scripts/e2e/local/README.md). Se requieren API `127.0.0.1:55321`, PostgreSQL `127.0.0.1:55322` y credenciales sintéticas en `.e2e-local/credentials.json`. El driver verifica que el administrador de Auth local coincide con la base antes de ejecutar SQL. La contraseña local predeterminada puede sustituirse mediante `RIOVOLEY_LOCAL_DB_PASSWORD`, sin escribirla en informes.

```powershell
node scripts/audit/security/initialize.cjs
node scripts/audit/security/install-driver.cjs
node scripts/audit/security/snapshot.cjs
node scripts/audit/security/authorization-snapshot.cjs
node scripts/audit/security/apply-local.cjs preflight
node scripts/audit/security/apply-local.cjs apply
node scripts/audit/security/run.cjs access acceso-nuevo
node scripts/audit/security/run.cjs functional funcional-nuevo
node scripts/audit/security/run.cjs edge edge-nuevo
node scripts/audit/security/check-deno.cjs
node scripts/audit/security/deno-typecheck.cjs
node scripts/audit/security/edge-http.cjs
```

Usar un expediente nuevo y etiquetas nuevas para cada reproducción. `preflight` ejecuta el SQL dentro de una transacción que termina en ROLLBACK y genera la reversión con las definiciones/ACL originales. `verify-final.cjs` prueba la reversión real, compara funciones/ACL/políticas, reaplica y vuelve a ejecutar las comprobaciones. No ejecutar snapshot sobre un backend ya modificado pretendiendo que representa el estado original.

Las pruebas HTTP Deno ejecutan los handlers originales y los SDK reales; únicamente sustituyen el arranque del servidor Edge por un listener de loopback. La caché se prepara con la comprobación de tipos. Durante las pruebas, `--cached-only` y `--allow-net=127.0.0.1:55321,127.0.0.1:6161` impiden descargar módulos o contactar proveedores externos. Se prueban denegaciones de push sin enviar notificaciones y eliminación de cuentas descartables con Auth/PostgreSQL reales. No equivalen a un despliegue gestionado en Supabase Cloud.

## Producción y compatibilidad

La aplicación web/Android y las funciones Edge deben actualizarse coordinadamente con la RPC/políticas. Los clientes anteriores intentan escribir directamente la recompensa diaria y borrar las filas de usuario antes de pedir autorización de Auth; esos contratos cambiaron. No aplicar solo el SQL sobre clientes antiguos. El borrado Auth/PostgreSQL no es una transacción distribuida: el nuevo orden autoriza antes de escribir y evita borrar filas ante un 403, pero no acredita recuperación automática frente a cualquier fallo posterior de red o base.

Antes de una aplicación institucional se requieren autorización expresa, revisión de los roles heredados, comparación del catálogo actual, resolución de duplicados si existieran, respaldo y plan de despliegue/retorno adaptado al estado real. El aplicador suministrado rechaza otros destinos; el SQL también exige un marcador de alcance y precondiciones de RLS/vistas invocadoras. Esta validación no constituye una auditoría de penetración completa.
