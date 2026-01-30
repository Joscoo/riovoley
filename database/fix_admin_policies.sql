-- ============================================
-- FIX: Políticas RLS para Acceso de Administradores
-- ============================================
-- Problema: RLS está habilitado pero admins no pueden ver datos
-- Solución: Agregar políticas que permitan acceso total a administradores

-- PASO 1: Verificar el rol del usuario actual
-- Ejecuta esto primero para ver cómo está almacenado tu rol
SELECT 
    auth.uid() as user_id,
    auth.jwt() as full_jwt,
    auth.jwt() -> 'user_metadata' as user_metadata,
    u.role as role_in_users_table
FROM public.users u
WHERE u.id = auth.uid();

-- PASO 2: Crear función helper para verificar si el usuario es admin
-- Esta función verifica el rol en la tabla users
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('administrador', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 3: Agregar políticas de administrador para la tabla USERS
-- Eliminar políticas restrictivas existentes si es necesario
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Crear política para que admins vean todos los usuarios
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Crear política para que admins administren todos los usuarios
CREATE POLICY "Admins can manage all users"
ON public.users
FOR ALL
TO authenticated
USING (public.is_admin());

-- PASO 4: Agregar políticas de administrador para la tabla STUDENTS
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Admins can manage all students" ON public.students;

-- Crear política para que admins vean todos los estudiantes
CREATE POLICY "Admins can view all students"
ON public.students
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Crear política para que admins administren todos los estudiantes
CREATE POLICY "Admins can manage all students"
ON public.students
FOR ALL
TO authenticated
USING (public.is_admin());

-- PASO 5: Agregar políticas de administrador para USER_PROFILES
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;

CREATE POLICY "Admins can view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can manage all profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.is_admin());

-- PASO 6: Aplicar lo mismo a otras tablas críticas
-- PAYMENTS
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;

CREATE POLICY "Admins can view all payments"
ON public.payments
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can manage all payments"
ON public.payments
FOR ALL
TO authenticated
USING (public.is_admin());

-- ATTENDANCES
DROP POLICY IF EXISTS "Admins can view all attendances" ON public.attendances;
DROP POLICY IF EXISTS "Admins can manage all attendances" ON public.attendances;

CREATE POLICY "Admins can view all attendances"
ON public.attendances
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can manage all attendances"
ON public.attendances
FOR ALL
TO authenticated
USING (public.is_admin());

-- PHYSICAL_TESTS
DROP POLICY IF EXISTS "Admins can view all physical_tests" ON public.physical_tests;
DROP POLICY IF EXISTS "Admins can manage all physical_tests" ON public.physical_tests;

CREATE POLICY "Admins can view all physical_tests"
ON public.physical_tests
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can manage all physical_tests"
ON public.physical_tests
FOR ALL
TO authenticated
USING (public.is_admin());

-- PASO 7: Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'students', 'user_profiles', 'payments', 'attendances', 'physical_tests')
AND policyname LIKE '%Admin%'
ORDER BY tablename, policyname;

-- PASO 8: Verificar que la función is_admin() funciona para tu usuario
SELECT public.is_admin() as soy_admin;
-- Debe retornar TRUE si tu usuario tiene role 'administrador' o 'admin'

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Esta solución usa una función SECURITY DEFINER que verifica
--    el rol directamente en la tabla users
-- 
-- 2. Las políticas anteriores que verificaban JWT claims probablemente
--    fallaban porque el claim 'user_role' no existe en el JWT
--
-- 3. Después de ejecutar este script, tu usuario admin podrá ver
--    todos los datos en AtletasManager y UsuariosManager
--
-- 4. Las políticas existentes para usuarios normales (ver solo sus
--    propios datos) seguirán funcionando
-- ============================================
