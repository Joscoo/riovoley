# 🔧 SOLUCIÓN: Error de RLS al Crear Entrenadores

## 📋 Problema
Al intentar crear un entrenador desde el panel de admin, aparece uno de estos errores:
```
Error creando usuario en tabla pública: new row violates row-level security policy for table "users"
```
o
```
Error creando usuario en tabla pública: infinite recursion detected in policy for relation "users"
```

## 🎯 Causa
El problema tiene dos partes:
1. Las políticas RLS no permitían INSERT a administradores
2. Al intentar verificar si eres admin, se crea recursión infinita (las políticas consultan la tabla `users` para verificar el rol, pero esa consulta activa las mismas políticas)

## ✅ Solución Definitiva

La solución usa una **función SQL con `SECURITY DEFINER`** que bypasea RLS de forma segura.

### Paso 1: Ejecutar el Script SQL
1. Ve a tu panel de Supabase: https://supabase.com/dashboard/project/mayvvlkvheagkojunzzb
2. Navega a **SQL Editor**
3. Abre el archivo `database/fix_admin_insert_function.sql`
4. Copia y pega todo el contenido en el editor SQL
5. Ejecuta el script completo (botón **Run**)

El script:
- ✅ Crea la función `admin_insert_user()` con privilegios elevados
- ✅ Actualiza las políticas RLS para evitar recursión
- ✅ Permite solo a administradores crear usuarios de forma segura

### Paso 2: El Código Ya Está Actualizado
El código JavaScript en [src/services/userCreationWorking.js](src/services/userCreationWorking.js) ya fue actualizado para usar la nueva función SQL en lugar de INSERT directo.

**Antes:**
```javascript
await supabase.from('users').insert({ ... })
```

**Ahora:**
```javascript
await supabase.rpc('admin_insert_user', { p_id, p_email, ... })
```

### Paso 3: Verificar tu Rol de Admin
Ejecuta esta consulta para verificar que tu usuario tiene rol de administrador:

```sql
SELECT 
    id,
    email,
    role,
    nombre,
    apellido
FROM public.users
WHERE id = auth.uid();
```

**Debe mostrar `role = 'administrador'` o `role = 'admin'`**

Si tu rol no es correcto, corrígelo con:

```sql
UPDATE public.users
SET role = 'administrador'
WHERE email = 'TU_EMAIL_AQUI@ejemplo.com';
```

### Paso 4: Probar la Creación de Entrenador
1. Vuelve al panel de administración en tu aplicación
2. Ve a **Entrenadores**  
3. Haz clic en **Crear Nuevo Entrenador**
4. Completa el formulario
5. Envía el formulario

**Ahora debería funcionar sin errores** ✅

## 🔍 Cómo Funciona la Solución

### La Función SQL
La función `admin_insert_user()` tiene `SECURITY DEFINER`, lo que significa:
- Se ejecuta con los privilegios del creador de la función (superusuario)
- Bypasea las políticas RLS de forma controlada
- Verifica internamente que solo los admins puedan usarla

```sql
CREATE FUNCTION public.admin_insert_user(...)
RETURNS TABLE(...)
AS $$
BEGIN
    -- Verifica que el usuario sea admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('administrador', 'admin')
    ) THEN
        RAISE EXCEPTION 'Solo administradores pueden crear usuarios';
    END IF;
    
    -- Inserta el usuario (bypasea RLS gracias a SECURITY DEFINER)
    RETURN QUERY INSERT INTO public.users (...) VALUES (...) RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Por Qué Funciona
- ✅ No hay recursión porque la verificación de admin se hace DENTRO de la función
- ✅ El INSERT se ejecuta con privilegios elevados
- ✅ La seguridad se mantiene (solo admins pueden llamar la función)
- ✅ Las demás operaciones (SELECT, UPDATE, DELETE) usan políticas normales

## 🔍 Verificación Adicional

Si aún tienes problemas, ejecuta este diagnóstico:

```sql
-- 1. Verificar que la función existe
SELECT proname, prosecdef as security_definer
FROM pg_proc 
WHERE proname = 'admin_insert_user';

-- 2. Ver todas las políticas de la tabla users
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd;

-- 3. Verificar tu sesión actual
SELECT 
    auth.uid() as mi_user_id,
    u.role as mi_rol,
    u.email
FROM public.users u
WHERE u.id = auth.uid();
```

## 📚 Explicación Técnica

### Problema de Recursión Infinita
Cuando las políticas RLS intentan verificar si eres admin consultando `users`:
```sql
-- Esta consulta dentro de una política causa recursión
SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrador'
```

La consulta `SELECT FROM users` activa las mismas políticas RLS, que vuelven a hacer `SELECT FROM users`, creando un bucle infinito.

### Solución: SECURITY DEFINER
La función con `SECURITY DEFINER` se ejecuta con privilegios del propietario (superusuario), bypaseando RLS:
- ✅ La verificación de admin se hace DENTRO de la función (sin activar RLS)
- ✅ El INSERT se ejecuta con privilegios elevados
- ✅ La seguridad se mantiene mediante validación interna

## 🚨 Notas de Seguridad

- ✅ Las políticas RLS están correctamente configuradas para seguridad
- ✅ Solo usuarios con rol 'administrador' pueden crear/modificar usuarios
- ✅ Las contraseñas NO se guardan en public.users (están en auth.users)
- ✅ Cada nuevo usuario tiene un UUID único generado por Supabase Auth

## 📞 Si Aún Tienes Problemas

1. Verifica los logs del navegador (F12 → Console)
2. Revisa los logs de Supabase (Dashboard → Logs)
3. Confirma que estás logueado como administrador
4. Verifica que la tabla `users` existe y tiene RLS habilitado
