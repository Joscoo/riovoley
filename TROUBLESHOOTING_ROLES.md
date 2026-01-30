# 🔍 Troubleshooting: Cambio de Roles No Funciona

## ❓ Problema
Al cambiar el rol de un usuario (ej: de entrenador a estudiante), el cambio no se refleja cuando el usuario inicia sesión.

## 🛠️ Pasos de Diagnóstico

### 1. **Verificar que el rol se actualizó en la base de datos**

Ejecuta en Supabase SQL Editor:
```sql
-- Ver archivo: database/verify_roles_status.sql (Query #1)
SELECT 
    u.email,
    u.role as "Rol en users",
    up.role as "Rol en user_profiles"
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE u.email = 'EMAIL_DEL_USUARIO_AQUI';
```

**Resultado esperado:**
- Ambas columnas deben mostrar el mismo rol
- Si son diferentes, hay un problema de sincronización

### 2. **Verificar los logs en la consola del navegador**

Después de cambiar el rol, revisa la consola (F12) y busca:

```
✅ Logs esperados al actualizar:
🔄 Actualizando usuario: { id: "...", rolAntiguo: "entrenador", rolNuevo: "estudiante" }
✅ Tabla users actualizada
✅ Tabla user_profiles actualizada: [...]
🔍 Verificación del rol actualizado: { role: "estudiante" }
```

```
❌ Si ves estos logs, hay un problema:
❌ Error actualizando users: ...
❌ Error actualizando user_profiles: ...
```

### 3. **Verificar los logs al iniciar sesión**

Al iniciar sesión después del cambio, busca:

```
✅ Logs esperados:
📥 Cargando perfil para usuario: ...
✅ Perfil encontrado en user_profiles: { role: "estudiante" }
```

```
❌ Si ves esto, el perfil no se actualizó:
✅ Perfil encontrado en user_profiles: { role: "entrenador" }  ← ROL ANTERIOR
```

## ✅ Soluciones

### Solución 1: El usuario debe cerrar sesión completamente

**Importante:** El cambio de rol requiere que el usuario:
1. Cierre sesión
2. Espere 5 segundos
3. Vuelva a iniciar sesión

**Por qué:** El perfil se carga una vez al iniciar sesión y se mantiene en caché durante la sesión.

### Solución 2: Sincronizar manualmente el rol

Si el rol es diferente en ambas tablas, ejecuta:

```sql
-- Sincronizar UN usuario específico
UPDATE public.user_profiles
SET role = (
    SELECT role::user_role_enum 
    FROM public.users 
    WHERE users.id = user_profiles.id
)
WHERE id = (SELECT id FROM public.users WHERE email = 'EMAIL_USUARIO');
```

### Solución 3: Sincronizar TODOS los usuarios

```sql
-- Ejecutar: database/sync_user_profiles_roles.sql
INSERT INTO public.user_profiles (id, full_name, role, created_at)
SELECT 
    u.id,
    TRIM(CONCAT(u.nombre, ' ', u.apellido)),
    u.role::user_role_enum,
    u.created_at
FROM public.users u
WHERE u.role IS NOT NULL
ON CONFLICT (id) 
DO UPDATE SET 
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;
```

### Solución 4: Instalar el trigger automático

Para evitar problemas futuros, instala el trigger:

```sql
-- Ejecutar: database/create_trigger_sync_roles.sql
-- Esto sincronizará automáticamente los roles en cada actualización
```

## 🧪 Test Manual

1. **Como administrador:**
   - Ve a Gestión de Usuarios
   - Cambia el rol de un usuario de "entrenador" a "estudiante"
   - Observa el mensaje de confirmación

2. **Como el usuario afectado:**
   - Cierra sesión completamente
   - Espera 5 segundos
   - Inicia sesión nuevamente
   - Verifica el navbar (debe mostrar "🏃‍♂️ Estudiante")

3. **Verifica en Supabase:**
   ```sql
   SELECT * FROM user_profiles WHERE id = 'ID_DEL_USUARIO';
   ```

## 🔴 Errores Comunes

### Error: "El rol sigue siendo el anterior"

**Causa:** El usuario no cerró sesión completamente

**Solución:** 
1. Cerrar TODAS las pestañas de la aplicación
2. Esperar 5 segundos
3. Abrir nueva pestaña e iniciar sesión

### Error: "role violates check constraint"

**Causa:** Intentando asignar un rol que no existe en el enum

**Solución:** Solo usar estos roles:
- `administrador`
- `entrenador`
- `estudiante`

### Error: "users.role y user_profiles.role son diferentes"

**Causa:** Desincronización entre tablas

**Solución:** Ejecutar script de sincronización (Solución 3)

## 📊 Verificación Post-Cambio

Después de cambiar un rol, ejecuta:

```sql
-- Ver estado de sincronización
SELECT 
    u.email,
    u.role as users_role,
    up.role as profile_role,
    CASE WHEN u.role = up.role THEN '✅' ELSE '❌' END as ok
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE u.email = 'EMAIL_DEL_USUARIO';
```

**Resultado esperado:** `ok = ✅`

## 📝 Checklist de Verificación

- [ ] El rol se actualizó en `users` tabla
- [ ] El rol se actualizó en `user_profiles` tabla  
- [ ] Ambos roles son iguales
- [ ] El usuario cerró sesión
- [ ] El usuario esperó 5 segundos
- [ ] El usuario inició sesión nuevamente
- [ ] Los logs muestran el nuevo rol
- [ ] El navbar muestra el nuevo rol

## 🆘 Si Nada Funciona

1. **Revisar políticas RLS:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
   ```

2. **Verificar permisos:**
   ```sql
   SELECT grantee, privilege_type 
   FROM information_schema.role_table_grants 
   WHERE table_name = 'user_profiles';
   ```

3. **Recrear el perfil:**
   ```sql
   DELETE FROM user_profiles WHERE id = 'ID_USUARIO';
   -- Luego el usuario inicia sesión y se recrea automáticamente
   ```

## 🔗 Archivos Relacionados

- `src/components/admin/UsuariosManager.js` - Actualiza roles
- `src/hooks/useUserProfile.js` - Lee roles
- `database/sync_user_profiles_roles.sql` - Sincroniza roles
- `database/create_trigger_sync_roles.sql` - Trigger automático
- `database/verify_roles_status.sql` - Verifica estado

---

**Última actualización:** 2026-01-29
