# Auditoria De Scripts Legacy Post-Migracion (Fase 2)

Fecha: 2026-04-27

## Resumen

Se detectaron scripts SQL en database que siguen apuntando a public.* para operaciones estructurales o RLS.
Tras la migracion por esquemas, varias entidades de negocio en public son vistas de compatibilidad, no tablas fisicas.

Regla operativa:
- ALTER TABLE sobre public.<vista> = riesgo alto / no ejecutar.
- RLS sobre public.<vista> = invalido o no aplicable.
- DML sobre public.<vista> puede funcionar en algunos casos, pero es fragil y no recomendado para scripts de mantenimiento.

## Hallazgos Por Severidad

## P0 - No ejecutar sin adaptar (rompen o quedan invalidos)

1. database/add_schedule_descriptions.sql
- Problema: ALTER TABLE public.schedules y UPDATE public.schedules.
- Destino correcto: training.schedules (y recrear public.schedules).
- Reemplazo: database/fix_schedules_descripcion_after_schema_migration_2026_04_27.sql.

2. database/update_open_gym_category.sql
- Problema: ALTER/UPDATE sobre public.schedules.
- Destino correcto: training.schedules.

3. database/add_physical_test_strength_fields.sql
- Problema: ALTER TABLE public.physical_tests.
- Destino correcto: training.physical_tests.

4. database/remove_altura_peso_from_students.sql
- Problema: ALTER TABLE public.students.
- Destino correcto: core.students.

5. database/add_first_login_field.sql
- Problema: ALTER TABLE public.users.
- Destino correcto: core.users.

6. database/fix_password_security.sql
- Problema: ALTER TABLE public.users DROP COLUMN.
- Destino correcto: core.users.

7. database/fix_admin_and_password.sql
- Problema: ALTER TABLE public.users en flujo mixto.
- Destino correcto: core.users para estructura.

8. database/enforce_student_birthdate_min_age_phase9_2026_04_20.sql
- Problema: ALTER TABLE public.students para constraints.
- Destino correcto: core.students.

## P1 - RLS legacy (adaptar a tablas reales)

1. database/enable_rls_all_tables.sql
- Problema: aplica RLS sobre public.*.
- Destino correcto: core.*, billing.*, training.*, profiles.*, public_content.* segun tabla.

2. database/disable_all_rls.sql
- Problema: desactiva RLS sobre public.*.
- Destino correcto: tablas fisicas en esquemas migrados.

3. database/disable_rls_users.sql
- Problema: public.users.
- Destino correcto: core.users.

4. database/disable_schedules_rls.sql
- Problema: public.schedules.
- Destino correcto: training.schedules.

5. database/fix_students_rls.sql
- Problema: public.students.
- Destino correcto: core.students.

## P2 - DML legacy (evaluar y repoint recomendado)

Scripts con INSERT/UPDATE sobre public.users o public.user_profiles.
Aunque algunos pueden funcionar via vistas updatable, no son confiables para mantenimiento post-migracion.

- database/create_admin_in_users.sql
- database/create_admin_insert_function.sql
- database/fix_create_admin_user.sql
- database/fix_incomplete_user.sql
- database/supabase_user_profiles.sql
- database/sync_user_profiles_roles.sql
- database/verify_roles_status.sql
- database/update_admin_role.sql
- database/add_estudiante_to_enum.sql

Recomendacion:
- Reapuntar DML de usuarios a core.users.
- Reapuntar DML de perfiles a profiles.user_profiles.

## Cambios De Compatibilidad Ya Implementados

1. Vista de anuncios enriquecida incluida en script principal:
- database/create_public_compatibility_views.sql

2. Fix puntual para entornos ya desplegados:
- database/fix_announcements_with_creator_view_after_schema_migration_2026_04_27.sql

3. Auditoria de estado en BD:
- database/audit_schema_migration_usage_phase1_2026_04_27.sql

## Plan De Remediacion Fase 3

1. Crear versiones _schema_2026_04_27.sql de cada script P0/P1 con targets correctos.
2. Marcar scripts legacy con encabezado NO_EJECUTAR_POST_MIGRACION.
3. Mantener solo scripts faseados (phase*) como canon para prod.
4. Ejecutar smoke test por modulo:
- Horarios
- Anuncios
- Pagos
- Asistencias
- Usuarios/Perfiles

## Implementacion Fase 3 (Ejecutada En Repo)

Scripts nuevos listos para ejecutar en BD:

- database/add_physical_test_strength_fields_schema_2026_04_27.sql
- database/remove_altura_peso_from_students_schema_2026_04_27.sql
- database/update_open_gym_category_schema_2026_04_27.sql
- database/enable_rls_all_tables_schema_2026_04_27.sql

Guia de orden de ejecucion:

- database/PHASE3_SCHEMA_MIGRATION_EXECUTION_ORDER_2026_04_27.md

## Criterio De Cierre

- Cero scripts P0/P1 activos apuntando a public.* para ALTER TABLE/RLS.
- Todos los scripts operativos apuntan a tablas fisicas en core/billing/training/profiles/public_content.
- Vistas public.* se usan solo como capa de compatibilidad para consumo de app.
