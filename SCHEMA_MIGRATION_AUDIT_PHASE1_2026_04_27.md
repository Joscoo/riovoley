# Auditoria De Uso Post-Migracion De Esquemas (Fase 1)

Fecha: 2026-04-27

## Objetivo

Verificar que los modulos de aplicacion consumen tablas migradas correctamente, usando la capa de compatibilidad public.* o referencias por esquema consistentes.

## Resultado Fase 1

1. Se inventariaron consultas Supabase en frontend y edge functions.
2. No se detectaron referencias directas a core., billing., training., profiles., public_content., audit. o security. en codigo de app.
3. Se detecto riesgo estructural en la vista public.announcements_with_creator.
4. Se implemento fix SQL para asegurar la vista y su grant.
5. Se fortalecio script base de compatibilidad para incluir announcements_with_creator.

## Objetos Consultados Por Codigo

- announcements
- announcements_with_creator
- attendances
- payment_types
- payments
- physical_tests
- schedules
- students
- user_profiles
- users

## Hallazgos

1. schedules.descripcion
- Estado: resuelto con fix sobre training.schedules y recreacion de public.schedules.
- Archivo relacionado: database/fix_schedules_descripcion_after_schema_migration_2026_04_27.sql.

2. announcements_with_creator
- Estado previo: usado por codigo pero no definido en script principal de vistas de compatibilidad.
- Riesgo: entornos nuevos o restaurados podian carecer de la vista.
- Mitigacion implementada:
- database/create_public_compatibility_views.sql ahora crea public.announcements_with_creator.
- database/fix_announcements_with_creator_view_after_schema_migration_2026_04_27.sql permite corregir entornos existentes.

## Entregables Implementados

1. Script de auditoria SQL:
- database/audit_schema_migration_usage_phase1_2026_04_27.sql

2. Fix de vista de anuncios enriquecida:
- database/fix_announcements_with_creator_view_after_schema_migration_2026_04_27.sql

3. Actualizacion del script principal de vistas:
- database/create_public_compatibility_views.sql

## Siguiente Fase Recomendada

1. Ejecutar audit_schema_migration_usage_phase1_2026_04_27.sql en el entorno objetivo.
2. Ejecutar fix_announcements_with_creator_view_after_schema_migration_2026_04_27.sql si la vista no existe o no tiene creator_name.
3. Validar en app estos flujos:
- visualizacion de anuncios
- gestion de anuncios admin
- creacion y edicion de horarios con descripcion
4. Generar Fase 2 con barrido de scripts legacy en database/ para marcar cuales no deben correrse post-migracion.
