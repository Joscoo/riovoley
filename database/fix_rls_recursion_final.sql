-- ============================================
-- FIX FINAL: Eliminar Recursión en RLS
-- ============================================
-- Problema: Las políticas causan recursión infinita al hacer SELECT en users
-- Solución: Usar solo la función is_admin() existente que tiene SECURITY DEFINER

-- PASO 1: Ver todas las políticas actuales
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN substring(qual::text, 1, 100)
        ELSE 'No USING'
    END as using_clause
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- PASO 2: ELIMINAR TODAS LAS POLÍTICAS QUE CAUSAN RECURSIÓN
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;

-- PASO 3: Verificar que la función is_admin() existe y usa SECURITY DEFINER
SELECT 
    proname,
    prosecdef as security_definer,
    prosrc as source_code
FROM pg_proc 
WHERE proname = 'is_admin';

-- PASO 4: Crear políticas usando SOLO la función is_admin() (sin SELECT anidado)
-- Esta función tiene SECURITY DEFINER, así que NO causa recursión

CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (is_admin() OR id = auth.uid());

CREATE POLICY "Admins can update users"
ON public.users
FOR UPDATE
TO authenticated
USING (is_admin() OR id = auth.uid())
WITH CHECK (is_admin() OR id = auth.uid());

CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (is_admin());

-- PASO 5: Para INSERT, NO crear política - usar solo la función admin_insert_user
-- La función admin_insert_user ya tiene SECURITY DEFINER y maneja el INSERT

-- PASO 6: Verificar las nuevas políticas
SELECT 
    policyname,
    cmd,
    qual::text as using_clause,
    with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'users'
AND policyname LIKE 'Admins%'
ORDER BY cmd;

-- PASO 7: Probar que is_admin() funciona
SELECT 
    'Test is_admin()' as test,
    is_admin() as soy_admin,
    auth.uid() as mi_user_id;
