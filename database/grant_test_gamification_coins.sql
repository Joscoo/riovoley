-- database/grant_test_gamification_coins.sql
--
-- Uso: reemplaza los valores de v_student o v_user_email y v_amount.
--
-- Ejemplo rápido:
--   v_user_email := 'tu@email.com';
--   v_amount := 100;
--
-- Nota: esta operación requiere permisos de administrador o trainer
-- porque las tablas de gamificación tienen políticas RLS de escritura.

DO $$
DECLARE
  v_student uuid := null; -- reemplaza con tu student_id si lo conoces
  v_user_email text := 'jose.bonillao@espoch.edu.ec'; -- reemplaza con el email del usuario si no conoces el student_id
  v_amount integer := 200; -- reemplaza con la cantidad de monedas de prueba
BEGIN
  IF v_student IS NULL AND v_user_email IS NULL THEN
    RAISE EXCEPTION 'Debes asignar v_student o v_user_email antes de ejecutar este script.';
  END IF;

  IF v_student IS NULL THEN
    SELECT s.id
    INTO v_student
    FROM core.students s
    JOIN core.users u ON u.id = s.user_id
    WHERE u.email = v_user_email
    LIMIT 1;

    IF v_student IS NULL THEN
      RAISE EXCEPTION 'No se encontró ningún student_id para el email: %', v_user_email;
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM core.students WHERE id = v_student) THEN
    RAISE EXCEPTION 'No existe un registro en core.students con student_id = %', v_student;
  END IF;

  UPDATE gamification.currency_wallets
  SET
    balance = balance + v_amount,
    total_earned = total_earned + v_amount,
    updated_at = timezone('utc', now())
  WHERE student_id = v_student;

  IF NOT FOUND THEN
    INSERT INTO gamification.currency_wallets (
      student_id,
      balance,
      total_earned,
      total_spent,
      last_synced_at,
      created_at,
      updated_at
    ) VALUES (
      v_student,
      v_amount,
      v_amount,
      0,
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    );
  END IF;

  INSERT INTO gamification.currency_ledger (
    student_id,
    source_type,
    source_ref,
    coins_delta,
    label,
    description,
    metadata,
    occurred_at,
    created_at
  ) VALUES (
    v_student,
    'admin_grant',
    null,
    v_amount,
    'Monedas de prueba',
    'Monedas otorgadas manualmente para pruebas de gamificación.',
    '{}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now())
  );
END$$;
