# Baseline Canonico - Runbook

Fecha: 2026-04-27

## Script unico

- database/baseline_schema_canonical_2026_04_27.sql

## Cuando usarlo

- Nuevo entorno desde cero.
- Recuperacion de entorno con drift de esquemas/vistas/policies.
- Homologar staging con el estado validado en produccion.

## Que incluye

1. Migracion a esquemas reales (core/billing/training/profiles/public_content/audit/security).
2. Ajustes de modelo validados (schedules.descripcion, open_gym, campos de fuerza, limpieza students).
3. Helpers RBAC canonicos (public.is_admin, public.is_admin_or_trainer).
4. Vistas de compatibilidad public.* y grants esperados.
5. RLS habilitado en tablas reales.
6. Hardening final de announcements y dedupe puntual de profiles.user_profiles.
7. Verificaciones integradas al final.

## Ejecucion

1. Ejecutar el script completo en Supabase SQL Editor.
2. Revisar resultados de las consultas de verificacion al final.
3. Confirmar smoke test funcional en app:
- Horarios
- Anuncios
- Pagos
- Asistencias
- Usuarios/Perfiles

## Nota de seguridad

El baseline asume que existen politicas previas de negocio en las tablas reales.
Si algun entorno no las tiene, primero ejecutar los scripts phase previos de RBAC y luego este baseline.
