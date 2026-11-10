# Corrección local de permisos y recompensas

**Objetivo:** cerrar escrituras no autorizadas de pagos y progreso sin romper los flujos administrativos y del atleta. La autorización del usuario se limita al backend local descartable. No aplicar en producción ni volver a publicar sin una instrucción posterior.

**Diseño:** conservar React/Supabase y la sincronización de progreso realizada por administrador/entrenador activos. RLS impedirá al atleta escribir los resultados derivados, su XP, saldo, inventario y recompensas. Las lecturas del panel no persistirán proyecciones. La recompensa diaria se resolverá con una RPC sin parámetros de actor/fecha/importe, transaccional y con exclusión por atleta. Las compras/equipamiento continúan mediante RPC existentes verificadas. Los privilegios usados para autorizar personal no pueden ser autoasignados ni restaurados por el propietario.

**Pagos:** nuevas políticas de escritura reservadas al personal activo; RPC UUID sin ambigüedad con bigint, firmas legadas conservadas bajo nombres diferenciados y sin ejecución pública. Auditoría con referencias de esquema explícitas y path seguro. Se probarán llamadas REST/RPC reales, incluidas cuentas suspendidas.

**Alcance de confianza:** el personal autorizado conserva la gestión administrativa de datos y progreso; no se afirma que el cálculo administrativo ocurra totalmente en PostgreSQL. No se trasladan al atleta permisos administrativos para mantener compatibilidad.

## Pasos y validación

- [x] Crear expediente nuevo, comprobar backend loopback y guardar catálogo/definiciones/ACL actuales para reversión local.
- [x] Escribir pruebas reales de acceso antes del cambio y observar rechazos incorrectos o escrituras admitidas, únicamente sobre fixtures.
- [x] Crear SQL fuera de las migraciones automáticas de producción, con precondiciones y aplicador que exija el contenedor local y aprobación de alcance explícita.
- [x] Cerrar escalación de rol/suspensión; endurecer pagos, auditoría y firmas RPC; verificar administrador, entrenador, atleta, anónimo y suspendido.
- [x] Restringir mutaciones de resultados de gamificación; RPC diaria atómica e idempotente; consultas del atleta sin escrituras. Probar la preservación del gasto al resincronizar wallet.
- [x] Ejecutar integración funcional existente, contratos/componentes afectados, regresión Jest y flujos E2E locales pertinentes. Ampliar la comprobación de posición/categoría del ranking.
- [x] Revisión independiente, privacidad, manifiestos y documentos nuevos de evidencia. Mantener los seis expedientes anteriores sin cambios.

**Pendientes externos:** aplicar en producción requiere SQL final, revisión y autorización adicional; no se envía correo/push a terceros ni se simulan pruebas de dispositivo físico. Las dependencias residuales se tratarán sin degradaciones incompatibles ni npm audit fix --force.
