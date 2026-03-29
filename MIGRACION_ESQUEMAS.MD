Cambios realizados en la base de datos (migración de esquemas)
1) Esquemas creados
Creamos estos esquemas (no cambian auth/storage/realtime, solo organizan tus tablas):

core
billing
training
profiles
public_content
audit
security
2) Tablas movidas fuera de public
Estas tablas fueron movidas desde public hacia sus nuevos esquemas:

public.users → core.users

public.students → core.students

public.user_profiles → profiles.user_profiles

public.payment_types → billing.payment_types

public.payments → billing.payments

public.schedules → training.schedules

public.attendances → training.attendances

public.physical_tests → training.physical_tests

public.announcements → public_content.announcements

public.payments_audit → audit.payments_audit

**public.users_password_backup → security.users_password_backup**

Además, movimos las secuencias que generan IDs para que sigan funcionando:

public.payment_types_id_seq → billing
public.schedules_id_seq → training
3) RLS
Por ahora lo dejamos como estaba (no activamos/desactivamos RLS adicionalmente).
Las políticas existentes ya reflejan correctamente referencias a los nuevos esquemas (p.ej. donde antes decía public.students, ahora aparece core.students; y donde antes user_profiles, ahora profiles.user_profiles).
Qué debes cambiar en tu app (para que no rompa)
Como las tablas ya no están en public, tu app debe apuntar a:

schema.tabla en vez de public.tabla (o solo tabla si antes dependías implícitamente de public).

Reemplazos obligatorios (tabla por tabla)
Busca en tu código todo uso de estas tablas y cámbialas:

users → core.users

students → core.students

user_profiles → profiles.user_profiles

payment_types → billing.payment_types

payments → billing.payments

schedules → training.schedules

attendances → training.attendances

physical_tests → training.physical_tests

announcements → public_content.announcements

payments_audit → audit.payments_audit

users_password_backup → security.users_password_backup

Casos típicos que suelen romper
Revisa si tu app hace cualquiera de estos patrones:

Queries SQL “hardcodeadas”
Cambia public.students, public.payments, etc.
Relacionados / selects anidados
Si haces algo como select('..., students(...)') o joins basados en nombres de relaciones, puede requerir ajustar para apuntar al esquema correcto.
RPC / funciones que referencien public.<tabla>
Si tienes rpc() que internamente hace FROM public.xxx, tendrás que modificar esas funciones (todavía no lo revisamos).

Checklist rápido para arreglar tu carpeta de código
Busca en el repo:

from('users'), from('students'), from('payments'), etc.
public. en strings SQL
rpc( que parezcan relacionados con esas tablas
Ajusta cada query:

usa core., billing., training., profiles., public_content., audit., security. según corresponda
Prueba endpoints/flows principales:

login/roles (si toca profiles)
CRUD de estudiantes
pagos, asistencias, tests físicos
anuncios
(si existe) auditoría/backup

---

Estado de implementación en código (2026-03-29)

1. Refactor de consultas en app/frontend completado.
- Se reemplazaron consultas from('tabla') por from('schema.tabla') en src/ y supabase/functions/.

2. Edge Function actualizada.
- update-user-password ahora consulta core.users y fallback a profiles.user_profiles.

3. Migración SQL versionada añadida.
- Archivo: database/migracion_esquemas_2026_03_29.sql
- Incluye create schema if not exists, alter table if exists, alter sequence if exists y grants mínimos de uso.

4. Documentación principal actualizada.
- README_DATABASE.md ahora refleja los esquemas de dominio en lugar de asumir public como único esquema.

Pendiente operativo recomendado

1. Ejecutar smoke tests funcionales por rol en producción (admin, entrenador, usuario).
2. Validar funciones/RLS que aún vivan en SQL legacy fuera de código activo.
3. Revisar vistas o RPCs que internamente usen public.<tabla>.