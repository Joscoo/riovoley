-- Script para HABILITAR RLS en todas las tablas
-- Fecha: 2026-01-29
-- CRÍTICO: Esto activa la seguridad que ya configuraste

-- 1. Habilitar RLS en todas las tablas con políticas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- 2. Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Habilitado"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'users', 'user_profiles', 'students', 'payments', 'payment_types',
    'physical_tests', 'attendances', 'schedules', 'training_cards', 'workouts'
)
ORDER BY tablename;

-- 3. Verificar políticas activas por tabla
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. IMPORTANTE: Verificar que NO hay acceso público sin restricciones
-- Esto debe mostrar las políticas que ya tienes configuradas
SELECT 
    tablename,
    COUNT(*) as num_policies,
    ARRAY_AGG(policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 5. URGENTE: Verificar permisos en la tabla users
-- Asegurarse de que la columna password no sea accesible
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY grantee, privilege_type;
