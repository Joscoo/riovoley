# Fase 3 - Orden De Ejecucion (Post-Migracion)

Fecha: 2026-04-27

## Objetivo

Ejecutar versiones adaptadas a esquemas reales para reemplazar scripts legacy que apuntaban a public.*.

## Orden Recomendado

1. database/add_physical_test_strength_fields_schema_2026_04_27.sql
2. database/remove_altura_peso_from_students_schema_2026_04_27.sql
3. database/update_open_gym_category_schema_2026_04_27.sql
4. database/enable_rls_all_tables_schema_2026_04_27.sql
5. database/audit_schema_migration_usage_phase1_2026_04_27.sql

## Checklist de cierre

- training.physical_tests contiene campos de fuerza.
- core.students no contiene altura/peso.
- training.schedules no contiene categorias juego_sabado/juego_domingo.
- RLS habilitado en tablas objetivo de esquemas reales.
- Flujos app verificados: horarios, anuncios, pagos, asistencias, usuarios.
