Estructura de la base de datos — Esquema public
Estado: documentación técnica para desarrolladores / operaciones

Resumen

Esquemas de dominio: core, billing, training, profiles, public_content, audit, security.
Uso de UUIDs para la mayoría de PKs; secuencias para algunos integer PKs.
RLS (Row-Level Security) habilitado en tablas sensibles. Políticas aplicadas basadas en auth.uid() y claims JWT (por ejemplo, role).
Convenciones: nombres de columnas en español, constraints CHECK para enums lógicos, timestamps para auditoría.
Índice

Tablas y definición de columnas

Relaciones (FK)

Restricciones, checks e índices recomendados

RLS — políticas aplicadas (resumen técnico)

Funciones auxiliares y extensiones requeridas

DDL de ejemplo (habilitar RLS + políticas owner/admin)

Pruebas y validación

Recomendaciones operacionales y migraciones

Anexos — snippets útiles

Tablas y definición de columnas (técnico)

core.users

id uuid PRIMARY KEY — default: uuid_generate_v4() o gen_random_uuid()
email text UNIQUE NOT NULL
password text NOT NULL (hash)
role text NOT NULL CHECK (role = ANY (ARRAY['administrador'::text, 'entrenador'::text, 'estudiante'::text]))
nombre text
apellido text
fecha_nacimiento date NULL
telefono text NULL
last_login timestamptz NULL
created_at timestamptz DEFAULT now()
Comentario: usada como cuenta base; referenciada por students.user_id y workouts.owner_id.
profiles.user_profiles

id uuid PRIMARY KEY — FK -> auth.users.id
full_name text NULL
organization_id uuid NULL
role user_role_enum DEFAULT 'usuario' (enum values: administrador, entrenador, usuario)
created_at timestamptz DEFAULT now()
RLS: habilitado (políticas owner + admin aplicadas)
core.students

id uuid PRIMARY KEY
user_id uuid NULL REFERENCES core.users(id)
categoria text NULL CHECK (categoria = ANY (ARRAY['iniciacion_hombres'::text, 'iniciacion_mujeres'::text, 'perfeccionamiento_mujeres'::text, 'perfeccionamiento_hombres'::text, 'master_mujeres'::text]))
altura numeric NULL
peso numeric NULL
fecha_ingreso date DEFAULT CURRENT_DATE
fecha_nacimiento date
edad integer GENERATED/nullable — default calculado por calculate_age(fecha_nacimiento) (función DB)
Comentario: entidad central para datos deportivos; PK id referenciado por múltiples tablas.
public.training_cards

id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
student_id uuid NULL REFERENCES core.students(id)
fecha_compra date DEFAULT CURRENT_DATE
fecha_expiracion date NULL
sesiones_totales integer DEFAULT 12
sesiones_usadas integer DEFAULT 0
activa boolean DEFAULT true
billing.payments

id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
student_id uuid NULL REFERENCES core.students(id)
payment_type_id int NULL REFERENCES billing.payment_types(id)
monto numeric NOT NULL
fecha_inicio date NULL
fecha_fin date NULL
fecha_pago date DEFAULT CURRENT_DATE
estado text NULL CHECK (estado = ANY (ARRAY['activo'::text, 'vencido'::text, 'proximo_a_vencer'::text]))
billing.payment_types

id integer PRIMARY KEY DEFAULT nextval('payment_types_id_seq'::regclass)
nombre text UNIQUE NOT NULL
descripcion text NULL
precio numeric NULL
Comentario: catálogo de métodos de pago. Valores estándar: 'pago_diario', 'mensualidad', 'tarjeta'. Usado en attendances.metodo_pago_id para registrar cómo pagó cada atleta su asistencia.
training.attendances

id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
student_id uuid NULL REFERENCES core.students(id)
schedule_id integer NULL REFERENCES training.schedules(id)
metodo_pago_id integer NULL REFERENCES billing.payment_types(id)
fecha date DEFAULT CURRENT_DATE
hora_entrada timestamptz DEFAULT now()
training.schedules

id integer PRIMARY KEY DEFAULT nextval('schedules_id_seq'::regclass)
dia_semana text NULL CHECK (dia_semana = ANY (ARRAY['lunes'::text, 'martes'::text, 'miercoles'::text, 'jueves'::text, 'viernes'::text, 'sabado'::text, 'domingo'::text]))
hora_inicio time NOT NULL
hora_fin time NOT NULL
categoria text NULL CHECK (categoria = ANY (ARRAY['iniciacion_hombres'::text, 'iniciacion_mujeres'::text, 'perfeccionamiento_mujeres'::text, 'perfeccionamiento_hombres'::text, 'master_mujeres'::text, 'open_gym'::text]))
training.physical_tests

id uuid PRIMARY KEY DEFAULT gen_random_uuid()
student_id uuid NULL REFERENCES core.students(id)
estatura numeric NULL CHECK (estatura > 0::numeric AND estatura < 3::numeric)
peso numeric NULL CHECK (peso > 0::numeric AND peso < 300::numeric)
brazo_extend_inicial numeric NULL
brazo_extend_sin_impulso numeric NULL
brazo_extend_con_impulso numeric NULL
fuerza_explosiva_salto_largo numeric NULL
envergadura_brazos_extendidos_lateral numeric NULL
fuerza_abdomen integer NULL CHECK (fuerza_abdomen >= 0 AND fuerza_abdomen <= 200)
fuerza_brazos integer NULL CHECK (fuerza_brazos >= 0 AND fuerza_brazos <= 200)
fuerza_piernas integer NULL CHECK (fuerza_piernas >= 0 AND fuerza_piernas <= 300)
elevaciones_barra integer NULL CHECK (elevaciones_barra >= 0 AND elevaciones_barra <= 100)
observaciones text NULL
fecha_test date DEFAULT CURRENT_DATE
created_at timestamptz DEFAULT CURRENT_TIMESTAMP
updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
public.workouts

id uuid PRIMARY KEY DEFAULT gen_random_uuid()
title text NOT NULL
description text NULL
owner_id uuid NULL REFERENCES auth.users(id)
organization_id uuid NULL
is_public boolean DEFAULT false
created_at timestamptz DEFAULT now()
Relaciones (FK) — lista técnica
core.students.user_id -> core.users.id
profiles.user_profiles.id -> auth.users.id
public.training_cards.student_id -> core.students.id
billing.payments.student_id -> core.students.id
billing.payments.payment_type_id -> billing.payment_types.id
training.attendances.student_id -> core.students.id
training.attendances.schedule_id -> training.schedules.id
training.attendances.metodo_pago_id -> billing.payment_types.id
training.physical_tests.student_id -> core.students.id
public.workouts.owner_id -> auth.users.id
Restricciones, checks e índices recomendados
Checks ya presentes:
users.role, students.categoria, schedules.dia_semana, payments.estado, physical_tests ranges.
Unicidades:
users.email, payment_types.nombre.
Índices recomendados (si no existen):
CREATE INDEX ON core.students(user_id);
CREATE INDEX ON public.training_cards(student_id);
CREATE INDEX ON billing.payments(student_id);
CREATE INDEX ON training.attendances(student_id);
CREATE INDEX ON training.attendances(schedule_id);
Confirmar PK index en user_profiles.id (debe existir por PK).
Si se habilita multitenancy (organization_id) crear índices compuestos:
CREATE INDEX idx_user_org_user_org ON public.user_organizations(user_id, organization_id);
RLS — políticas aplicadas (resumen técnico)
Modelo aplicado para user_profiles: propietario + administrador.
Admin claim: JWT claim role = 'administrador' => FOR ALL.
Owner: filas donde id = auth.uid() tienen permiso para SELECT/INSERT/UPDATE/DELETE.
Ejemplo de política (aplicada):
CREATE POLICY "profiles_admin_full_access" ON profiles.user_profiles FOR ALL TO authenticated USING ((auth.jwt() ->> 'role') = 'administrador') WITH CHECK ((auth.jwt() ->> 'role') = 'administrador');
CREATE POLICY "profiles_select_owner" ON profiles.user_profiles FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id OR (auth.jwt() ->> 'role') = 'administrador');
Otras políticas análogas para INSERT/UPDATE/DELETE.
Nota técnica: usar (SELECT auth.uid()) en WHERE/USING/WITH CHECK para mejor compatibilidad con planes y caché.
Funciones auxiliares y extensiones requeridas
Extensiones típicas:
pgcrypto (gen_random_uuid())
uuid-ossp (uuid_generate_v4()) — usar una u otra según preferencia.
Funciones de negocio:
calculate_age(date) — función que calcula edad desde fecha de nacimiento; si se usa en generated column, debe existir y preferiblemente ser STABLE.
Recomendación: marcar funciones usadas en políticas como SECURITY DEFINER y revocar ejecución a roles públicos si contienen lógica sensible.
DDL de ejemplo (habilitar RLS + políticas owner/admin) Nota: ejecutar DDL que cambia políticas requiere privilegios y pruebas. Este bloque es un ejemplo de referencia.
-- Habilitar RLS ALTER TABLE profiles.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas owner + admin (ejemplo) CREATE POLICY "profiles_admin_full_access" ON profiles.user_profiles FOR ALL TO authenticated USING ((auth.jwt() ->> 'role') = 'administrador') WITH CHECK ((auth.jwt() ->> 'role') = 'administrador');

CREATE POLICY "profiles_select_owner" ON profiles.user_profiles FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id OR (auth.jwt() ->> 'role') = 'administrador');

CREATE POLICY "profiles_insert_owner_or_admin" ON profiles.user_profiles FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = id OR (auth.jwt() ->> 'role') = 'administrador');

CREATE POLICY "profiles_update_owner" ON profiles.user_profiles FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = id OR (auth.jwt() ->> 'role') = 'administrador') WITH CHECK ((SELECT auth.uid()) = id OR (auth.jwt() ->> 'role') = 'administrador');

CREATE POLICY "profiles_delete_owner" ON profiles.user_profiles FOR DELETE TO authenticated USING ((SELECT auth.uid()) = id OR (auth.jwt() ->> 'role') = 'administrador');

Pruebas y validación (procedimiento)
Validación de RLS:
Generar JWT para:
Usuario A (sub = , role = 'usuario')
Usuario B (sub = , role = 'usuario')
Admin (sub = , role = 'administrador')
Intentar SELECT/INSERT/UPDATE/DELETE sobre profiles.user_profiles para cada token y verificar permisos.
Pruebas unitarias:
Crear fixtures en DB para cada rol y ejecutar queries via CI (p. ej., usando supabase-js en tests).
Pruebas de integridad referencial:
Asegurar que inserciones en dependencias (payments → payment_types) fallen si FK incumple.
Recomendaciones operacionales y migraciones
Mantener los DDL en migraciones SQL versionadas (carpeta db/migrations).
Incluir versiones de extensiones requeridas en migraciones iniciales:
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
Si se agrega multitenancy:
Crear tabla public.user_organizations(user_id uuid, organization_id uuid, primary key (user_id, organization_id))
Ajustar políticas RLS para usar EXISTS(...) sobre user_organizations.
Seguridad:
No exponer funciones SECURITY DEFINER a roles no confiables.
Minimizar uso del rol service_role en producción; usarlo sólo para tareas de backend controladas.
Monitoreo:
Añadir índices para columnas usadas frecuentemente por WHERE/USING en políticas.
Revisar advisors de Supabase y logs periódicamente.
Anexos — snippets útiles
Crear índice ejemplo:
CREATE INDEX idx_students_user_id ON core.students(user_id);
Extensión:
CREATE EXTENSION IF NOT EXISTS pgcrypto;
Ejemplo función calculate_age (simple):
CREATE OR REPLACE FUNCTION public.calculate_age(d date) RETURNS integer LANGUAGE sql STABLE AS 
S
E
L
E
C
T
D
A
T
E
P
A
R
T
(
′
y
e
a
r
′
,
A
G
E
(
d
)
)
;
SELECTDATE 
P
​
 ART( 
′
 year 
′
 ,AGE(d));;
Nota: ajustar permisos y marcar SECURITY DEFINER si se usa en políticas.
Cambios recientes aplicados en esta sesión

Se aplicaron políticas RLS en profiles.user_profiles para adoptar el modelo propietario + administrador (políticas FOR ALL, SELECT, INSERT, UPDATE, DELETE). Verifica con pruebas de token/claims.