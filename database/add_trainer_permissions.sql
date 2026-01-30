-- ============================================
-- AGREGAR PERMISOS PARA ENTRENADORES
-- ============================================
-- Permitir que entrenadores gestionen atletas, tests físicos, pagos y asistencias

-- PASO 1: Crear función para verificar si es admin o entrenador
CREATE OR REPLACE FUNCTION public.is_admin_or_trainer()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.users 
        WHERE id = auth.uid() 
        AND role IN ('administrador', 'admin', 'entrenador')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 2: Agregar políticas para STUDENTS (atletas)
DROP POLICY IF EXISTS "Trainers can view all students" ON public.students;
DROP POLICY IF EXISTS "Trainers can manage all students" ON public.students;

CREATE POLICY "Trainers can view all students"
ON public.students
FOR SELECT
TO authenticated
USING (public.is_admin_or_trainer());

CREATE POLICY "Trainers can manage all students"
ON public.students
FOR ALL
TO authenticated
USING (public.is_admin_or_trainer());

-- PASO 3: Agregar políticas para PHYSICAL_TESTS (tests físicos)
DROP POLICY IF EXISTS "Trainers can view all physical_tests" ON public.physical_tests;
DROP POLICY IF EXISTS "Trainers can manage all physical_tests" ON public.physical_tests;

CREATE POLICY "Trainers can view all physical_tests"
ON public.physical_tests
FOR SELECT
TO authenticated
USING (public.is_admin_or_trainer());

CREATE POLICY "Trainers can manage all physical_tests"
ON public.physical_tests
FOR ALL
TO authenticated
USING (public.is_admin_or_trainer());

-- PASO 4: Agregar políticas para PAYMENTS (pagos)
DROP POLICY IF EXISTS "Trainers can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Trainers can manage all payments" ON public.payments;

CREATE POLICY "Trainers can view all payments"
ON public.payments
FOR SELECT
TO authenticated
USING (public.is_admin_or_trainer());

CREATE POLICY "Trainers can manage all payments"
ON public.payments
FOR ALL
TO authenticated
USING (public.is_admin_or_trainer());

-- PASO 5: Agregar políticas para ATTENDANCES (asistencias)
DROP POLICY IF EXISTS "Trainers can view all attendances" ON public.attendances;
DROP POLICY IF EXISTS "Trainers can manage all attendances" ON public.attendances;

CREATE POLICY "Trainers can view all attendances"
ON public.attendances
FOR SELECT
TO authenticated
USING (public.is_admin_or_trainer());

CREATE POLICY "Trainers can manage all attendances"
ON public.attendances
FOR ALL
TO authenticated
USING (public.is_admin_or_trainer());

-- PASO 6: Agregar políticas para USERS (solo lectura para entrenadores)
DROP POLICY IF EXISTS "Trainers can view all users" ON public.users;

CREATE POLICY "Trainers can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (public.is_admin_or_trainer());

-- PASO 7: Verificar las políticas creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('students', 'physical_tests', 'payments', 'attendances', 'users')
AND policyname LIKE '%Trainer%'
ORDER BY tablename, policyname;

-- PASO 8: Verificar que la función funciona
SELECT public.is_admin_or_trainer() as tiene_acceso;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Ahora tanto administradores como entrenadores pueden:
-- ✅ Ver y gestionar atletas (students)
-- ✅ Ver y gestionar tests físicos (physical_tests)
-- ✅ Ver y gestionar pagos (payments)
-- ✅ Ver y gestionar asistencias (attendances)
-- ✅ Ver usuarios (users) - solo lectura para entrenadores
--
-- Solo administradores pueden:
-- ✅ Crear/editar/eliminar usuarios (users)
-- ============================================
