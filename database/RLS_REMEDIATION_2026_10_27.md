# Correccion RLS — RioVoley
Fecha local: 2026-10-27. Aplicacion UTC: 2026-10-28.
Proyecto verificado: Riovoley APP (`mayvvlkvheagkojunzzb`), PostgreSQL 17.

## Resultado aplicado

| Advisor | Antes | Despues |
| --- | ---: | ---: |
| auth_rls_initplan | 46 advertencias | 0 |
| multiple_permissive_policies | 42 advertencias | 0 |
| security_definer_view | 17 errores | 0 |
| rls_enabled_no_policy | 1 aviso (core.users) | 0 |

La migracion aplicada en el historial remoto es
[`20261028001854_remediate_rls_advisors.sql`](../supabase/migrations/20261028001854_remediate_rls_advisors.sql).
No volver a ejecutarla manualmente: usa los nombres de las policies anteriores y
ya figura como aplicada.

Cambios:

- Llamadas de sesion/RBAC evaluadas mediante SELECT y policies superpuestas
  consolidadas por operacion. Se conservan los OR y los WITH CHECK efectivos.
- Policies de core.users para lectura propia y acceso del personal; escritura
  administrativa y gestion de estudiantes por entrenadores.
- Proteccion de rol, identidad, organizacion y suspension frente a ediciones
  directas del cliente; se conserva la actualizacion propia de first_login,
  last_login y datos de contacto.
- RBAC de profiles.user_profiles basado en el usuario persistido, en lugar de
  esperar que el rol PostgreSQL del JWT sea administrador.
- Veinte vistas de compatibilidad configuradas con security_invoker, incluidas
  tres que no figuraban como error por sus grants existentes.
- RLS en audit.payments_audit, gamification.login_rewards y
  gamification.xp_ledger. Auditoria solo visible al personal; gamificacion
  limitada al propietario o personal.
- Tabla y vista de backups de contrasenas reservadas a service_role.
- Revocado TRUNCATE a roles de navegador: esa operacion no aplica RLS.
- Horarios y catalogos no sensibles conservan lectura publica.

La vista announcements_with_creator tambien aplica RLS a los perfiles de autor.
Para visitantes/estudiantes, el nombre puede quedar NULL; la interfaz existente
muestra su texto alternativo ("Riovoley"/"Usuario"). No se abrio el resto de
perfiles para recuperar esos nombres.

## Validacion

[`tests/rls_access_matrix.sql`](tests/rls_access_matrix.sql) ejecutado como
propietario de la base, con SET LOCAL ROLE y claims por actor:

- Reproduce el fallo previo: lectura anonima de public.users exponia registros.
- Con la migracion: accesos de anonimo, estudiante, entrenador y administrador.
- Datos propios visibles y ajenos ocultos; conteos del personal conservados.
- Joins/policies relacionados con pagos, asistencias, pruebas fisicas,
  gamificacion y reportes.
- Ediciones propias de login y edicion de estudiantes por el personal.
- Creacion/eliminacion transaccional de usuarios permitidos y rechazo de
  promocion de estudiante o creacion de administrador por entrenador.
- Rechazo de cambios de rol o suspension por estudiantes.

La prueba completa paso antes de aplicar (DDL + pruebas + ROLLBACK) y despues de
aplicar. Las escrituras de prueba siempre se revierten.

API real mediante supabase-js:

- Anonimo: datos privados inaccesibles y horarios/catalogos/anuncios disponibles.
- Administrador y entrenador: inicio de sesion, perfil, joins de estudiantes y
  pagos, anuncios, gamificacion y reportes correctos.
- Estudiante: prueba API real completada con las credenciales corregidas.
  Inicio de sesion y perfil correctos; datos propios de pagos, asistencias,
  pruebas fisicas y gamificacion visibles, sin datos de otros estudiantes ni
  acceso a reportes/auditoria del personal. Cuenta activa y sin cambio de
  contrasena inicial pendiente. No se restablecieron credenciales.
- Las credenciales de estudiante se guardaron en .env.e2e (excluido de Git);
  .env.e2e.example no contiene credenciales.
- Navegador: smoke Playwright de estudiante en desktop-1440 aprobado (1/1).
  Se corrigio la expectativa obsoleta del smoke: estudiantes no muestran la
  campana de notificaciones, conforme a la regla existente de la interfaz.
- No se crearon cuentas en Auth ni se ejecuto un flujo completo de alta por UI.

Los advisors de seguridad y rendimiento se volvieron a consultar tras aplicar.

## Hallazgos independientes pendientes

Fuera de esta correccion de RLS, los advisors mantienen:

- 19 funciones con search_path mutable.
- 17 funciones SECURITY DEFINER ejecutables por anon y 19 por authenticated;
  estos avisos requieren revisar cada funcion y sus consumidores antes de revocar.
- pg_net instalado en public.
- Proteccion de contrasenas filtradas desactivada.
- Actualizacion de PostgreSQL con parches de seguridad disponible.
- Un indice duplicado en training.physical_tests.
- Avisos informativos de indices/FK y una tabla sin PK.

La revision adicional detecto ademas un riesgo existente que requiere tratamiento
propio: public.handle_new_user toma el rol de raw_user_meta_data del registro.
Ese dato lo controla el usuario, y hay funciones Edge (por ejemplo send-push)
que autorizan con el rol de profiles.user_profiles. Esta migracion bloquea la
edicion directa de roles desde las tablas/vistas, pero no modifica ese flujo de
registro ni resuelve ese riesgo.

Referencias: [RLS y vistas](https://supabase.com/docs/guides/database/postgres/row-level-security),
[advisors de base de datos](https://supabase.com/docs/guides/database/database-linter).
