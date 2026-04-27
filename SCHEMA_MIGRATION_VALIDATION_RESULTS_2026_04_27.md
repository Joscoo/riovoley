# Validacion Ejecutada En BD - Migracion Por Esquemas

Fecha: 2026-04-27
Fuente: resultados de ejecucion manual en SQL Editor (compartidos en chat)

## Estado General

PASS

La base de datos quedo consistente con la estrategia post-migracion por esquemas y capa de compatibilidad public.*.

## Evidencia Validada

1. Vistas de compatibilidad public.*
- Resultado: presentes 12/12 esperadas.
- Incluye public.announcements_with_creator y public.users_password_backup.

2. Horarios y descripcion
- training_schedules_has_descripcion = true
- public_schedules_has_descripcion = true

3. Vista enriquecida de anuncios
- announcements_with_creator_has_creator_name = true

4. RLS en tablas reales
- billing.payment_types, billing.payments, core.students, core.users,
  profiles.user_profiles, public_content.announcements,
  training.attendances, training.physical_tests, training.schedules = true.

5. Categorias de schedules
- Categoria open_gym presente.
- No evidencia de categorias legacy juego_sabado/juego_domingo en resultados compartidos.

6. Grants de compatibilidad public.*
- anon: select en announcements, announcements_with_creator, schedules.
- authenticated: CRUD en vistas de negocio y select en payments_audit.
- users_password_backup no aparece para anon/authenticated (correcto).

## Riesgos Residuales (No bloqueantes)

1. Politicas redundantes en algunas tablas
- Se observan politicas ALL junto con politicas especificas por comando en varias tablas.
- No bloquea funcionamiento, pero aumenta complejidad de seguridad y mantenimiento.

2. Politicas con rol public en public_content.announcements
- Actualmente combinado con grants de vistas, el comportamiento observado es correcto.
- Recomendable revisar en hardening futuro para minimizar superficie si cambian grants.

## Recomendacion Operativa

- Mantener como scripts canonicos los archivos *_schema_2026_04_27.sql y phase*.
- Marcar scripts legacy previos como no ejecutables post-migracion.
- Ejecutar smoke test funcional en app: horarios, anuncios, pagos, asistencias, usuarios.

## Fase 4B Preparada

Se agrego hardening auditable de policies (modo seguro por defecto):

- database/hardening_policies_phase4b_2026_04_27.sql
- database/POLICY_HARDENING_PHASE4B_RUNBOOK_2026_04_27.md

Caracteristica clave:
- No aplica cambios destructivos por defecto.
- Solo deduplica policies cuando FOR ALL y FOR comando tienen roles y predicados equivalentes.

## Fase 4B Ejecutada (Resultado)

- Redundancias detectadas: 1
    - profiles.user_profiles: "Admins can view all profiles" cubierta por "Admins can manage all profiles".
- Policies con rol public detectadas en public_content.announcements: 4
    - SELECT, INSERT, UPDATE, DELETE.

## Fase 4C Generada

Se agrego hardening quirurgico post-auditoria:

- database/hardening_policies_phase4c_2026_04_27.sql

Cobertura de Fase 4C:
- elimina la redundancia confirmada en profiles.user_profiles,
- restringe INSERT/UPDATE/DELETE de announcements a authenticated,
- mantiene SELECT publico para anuncios activos.

## Fase 4C Ejecutada (Resultado)

Estado: PASS

Evidencia compartida:

- announcements policies finales:
    - INSERT -> roles {authenticated}
    - UPDATE -> roles {authenticated}
    - DELETE -> roles {authenticated}
    - SELECT -> roles {public}
- policy redundante en profiles.user_profiles:
    - "Admins can view all profiles" ya no existe (0 rows en verificacion).

Conclusion:

- La escritura de announcements ya no depende de rol public.
- Se mantiene lectura publica de anuncios activos sin romper consumo anon.
- Redundancia de policies confirmada fue eliminada correctamente.

## Baseline Canonico Final

Se genero un script unico para nuevos entornos o recuperacion de drift:

- database/baseline_schema_canonical_2026_04_27.sql
- database/BASELINE_SCHEMA_CANONICAL_RUNBOOK_2026_04_27.md

Este baseline consolida estado validado de Fase 1 a Fase 4C
(esquemas, vistas public.*, ajustes de modelo, RLS y hardening de policies).
