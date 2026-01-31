-- ============================================
-- FIX DEFINITIVO: Función para Crear Usuarios sin RLS
-- ============================================
-- Problema: Recursión infinita en políticas RLS
-- Solución: Crear función con SECURITY DEFINER que bypasea RLS

-- PASO 1: Verificar que la función is_admin existe y funciona
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'is_admin';

-- PASO 2: Eliminar todas las políticas que vamos a recrear
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- PASO 3: Crear función para insertar usuarios (bypasea RLS)
CREATE OR REPLACE FUNCTION public.admin_insert_user(
    p_id UUID,
    p_email TEXT,
    p_role TEXT,
    p_nombre TEXT,
    p_apellido TEXT,
    p_fecha_nacimiento DATE DEFAULT NULL,
    p_telefono TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    email TEXT,
    role TEXT,
    nombre TEXT,
    apellido TEXT,
    fecha_nacimiento DATE,
    telefono TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Verificar que el usuario actual es admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('administrador', 'admin')
    ) THEN
        RAISE EXCEPTION 'Solo administradores pueden crear usuarios';
    END IF;

    -- Insertar el usuario (esta función tiene SECURITY DEFINER, bypasea RLS)
    RETURN QUERY
    INSERT INTO public.users (
        id, 
        email, 
        role, 
        nombre, 
        apellido, 
        fecha_nacimiento, 
        telefono
    )
    VALUES (
        p_id,
        p_email,
        p_role,
        p_nombre,
        p_apellido,
        p_fecha_nacimiento,
        p_telefono
    )
    RETURNING 
        users.id,
        users.email,
        users.role,
        users.nombre,
        users.apellido,
        users.fecha_nacimiento,
        users.telefono,
        users.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 4: Crear políticas simples que no causan recursión
-- Solo para SELECT, UPDATE y DELETE (INSERT lo maneja la función)

CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() 
        AND u.role IN ('administrador', 'admin')
    )
    OR id = auth.uid()  -- También puede ver su propio perfil
);

CREATE POLICY "Admins can update users"  
ON public.users
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() 
        AND u.role IN ('administrador', 'admin')
    )
    OR id = auth.uid()  -- También puede actualizar su propio perfil
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() 
        AND u.role IN ('administrador', 'admin')
    )
    OR id = auth.uid()
);

CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE  
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid() 
        AND u.role IN ('administrador', 'admin')
    )
);

-- PASO 5: Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.admin_insert_user TO authenticated;

-- PASO 6: Verificar que todo está correcto
SELECT 
    'Función creada' as status,
    proname as function_name,
    prosecdef as is_security_definer
FROM pg_proc 
WHERE proname = 'admin_insert_user';

SELECT 
    'Políticas actualizadas' as status,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'users'
AND policyname LIKE 'Admins%'
ORDER BY cmd;

-- ============================================
-- INSTRUCCIONES PARA EL CÓDIGO JAVASCRIPT:
-- ============================================
-- En lugar de usar supabase.from('users').insert()
-- Ahora debes usar la función SQL:
--
-- const { data, error } = await supabase.rpc('admin_insert_user', {
--   p_id: authUserId,
--   p_email: email.trim(),
--   p_role: 'entrenador',
--   p_nombre: nombre.trim(),
--   p_apellido: apellido.trim(),
--   p_fecha_nacimiento: fecha_nacimiento || null,
--   p_telefono: telefono || null
-- });
