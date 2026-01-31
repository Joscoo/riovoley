-- ============================================
-- FIX: Permitir a Administradores Crear Usuarios
-- ============================================
-- Problema: Error "new row violates row-level security policy for table users"
-- Solución: Agregar políticas que permitan a administradores insertar en tabla users

-- PASO 1: Verificar políticas actuales en tabla users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- PASO 2: Crear función helper con SECURITY DEFINER para evitar recursión infinita
-- Esta función bypasea RLS y evita el problema de recursión
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

-- PASO 3: Eliminar políticas conflictivas existentes
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- PASO 4: Crear políticas específicas para administradores usando la función SECURITY DEFINER

-- Política para INSERT (crear nuevos usuarios)
CREATE POLICY "Admins can insert users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Política para UPDATE (actualizar usuarios existentes)
CREATE POLICY "Admins can update users"
ON public.users
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Política para DELETE
CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (public.is_admin());

-- PASO 5: Verificar que las políticas se crearon correctamente
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies
WHERE tablename = 'users'
AND policyname LIKE 'Admins%'
ORDER BY cmd, policyname;

-- PASO 6: Verificar que RLS está habilitado
SELECT 
    tablename,
    rowsecurity as "RLS Habilitado"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'users';

-- ============================================
-- INSTRUCCIONES DE USO:
-- ============================================
-- 1. Ejecuta este script completo en el SQL Editor de Supabase
-- 2. Verifica que las políticas se crearon correctamente
-- 3. Intenta crear un entrenador desde el panel de admin
-- 4. Si aún hay errores, verifica que tu usuario tiene role='administrador' en public.users
