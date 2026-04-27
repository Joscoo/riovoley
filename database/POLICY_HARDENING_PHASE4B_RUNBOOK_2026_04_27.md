# Policy Hardening Fase 4B - Runbook

Fecha: 2026-04-27

## Objetivo

Reducir complejidad de policies sin romper autorizacion, eliminando solo redundancias comprobadas.

## Script

- database/hardening_policies_phase4b_2026_04_27.sql

## Flujo recomendado

1. Ejecutar script sin cambios (apply_changes = false).
2. Revisar resultado de temp_policy_redundancy.
3. Si la lista es valida, editar apply_changes = true.
4. Re-ejecutar script completo.
5. Validar modulos de app:
- student panel
- trainer dashboard
- admin pagos/asistencias/tests

## Criterio de rollback

Si algun flujo falla por permisos, restaurar ultimo backup de policies o re-crear policies faltantes con scripts faseados previos:
- database/normalize_rbac_phase3_2026_04_16.sql
- database/consolidate_policies_phase4_2026_04_16.sql

## Nota

El script no borra automaticamente policies por nombre ni por heuristica riesgosa.
Solo deduplica cuando FOR ALL y FOR comando comparten roles y predicados equivalentes.

## Siguiente Paso Con Resultado Real (2026-04-27)

Si en Fase 4B obtuviste:
- 1 redundancia en profiles.user_profiles (Admins can view all profiles)
- policies de announcements con rol public en INSERT/UPDATE/DELETE

Ejecuta:
- database/hardening_policies_phase4c_2026_04_27.sql

Este script:
- elimina solo la redundancia confirmada,
- restringe escritura de announcements a authenticated,
- mantiene lectura publica de anuncios activos.
