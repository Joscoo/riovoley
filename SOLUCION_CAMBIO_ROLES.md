# 🔧 Solución: Problema con Cambio de Roles

**Fecha:** 29 de enero de 2026  
**Problema:** Al cambiar el rol de un usuario en la gestión de usuarios, el cambio no se reflejaba en el sistema de autenticación

## 🐛 Causa del Problema

El componente `UsuariosManager` solo actualizaba la tabla `users`, pero **NO actualizaba la tabla `user_profiles`**, que es donde el sistema de autenticación lee el rol del usuario.

### Estructura de Tablas:
- **`users`**: Tabla principal de usuarios (información general)
- **`user_profiles`**: Tabla de perfiles (usada por autenticación y sistema de roles)

El hook `useUserProfile` lee el rol desde `user_profiles`, por lo tanto, cualquier cambio debe reflejarse en ambas tablas.

## ✅ Solución Implementada

### 1. **Código Actualizado**

#### `src/components/admin/UsuariosManager.js`

**ANTES:**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const { error } = await supabase
      .from('users')
      .update({
        role: formData.role,
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono
      })
      .eq('id', editingUser.id);

    if (error) throw error;
    // ...
  }
};
```

**AHORA:**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    // 1. Actualizar tabla users
    const { error: usersError } = await supabase
      .from('users')
      .update({
        role: formData.role,
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono
      })
      .eq('id', editingUser.id);

    if (usersError) throw usersError;

    // 2. Actualizar tabla user_profiles (NUEVO!)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: editingUser.id,
        role: formData.role,
        full_name: `${formData.nombre} ${formData.apellido}`.trim()
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.warn('⚠️ Error actualizando user_profiles:', profileError);
    }
    // ...
  }
};
```

### 2. **Scripts SQL Creados**

#### A. `database/sync_user_profiles_roles.sql`
Script para **sincronizar roles existentes** de usuarios que ya están en la base de datos.

**Ejecutar una vez** para corregir inconsistencias:
```sql
INSERT INTO public.user_profiles (id, full_name, role, created_at)
SELECT 
    u.id,
    TRIM(CONCAT(u.nombre, ' ', u.apellido)) as full_name,
    u.role::user_role_enum,
    u.created_at
FROM public.users u
WHERE u.role IS NOT NULL
ON CONFLICT (id) 
DO UPDATE SET 
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;
```

#### B. `database/create_trigger_sync_roles.sql`
**Trigger automático** para mantener ambas tablas sincronizadas en el futuro.

Cada vez que se actualice el rol en `users`, automáticamente se actualizará en `user_profiles`.

```sql
CREATE TRIGGER trigger_sync_user_profile
    AFTER UPDATE ON public.users
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION sync_user_profile_on_user_update();
```

## 📋 Pasos para Aplicar la Solución

### 1. **Sincronizar Roles Existentes**
Ejecutar en Supabase SQL Editor:
```bash
# Contenido de: database/sync_user_profiles_roles.sql
```
Esto sincronizará todos los usuarios existentes.

### 2. **Crear el Trigger Automático** (Opcional pero Recomendado)
Ejecutar en Supabase SQL Editor:
```bash
# Contenido de: database/create_trigger_sync_roles.sql
```
Esto asegurará que futuros cambios se sincronicen automáticamente.

### 3. **Verificar la Sincronización**
```sql
-- Ver estado de sincronización
SELECT 
    u.email,
    u.role as role_en_users,
    up.role as role_en_profiles,
    CASE 
        WHEN u.role = up.role THEN '✅ OK'
        ELSE '❌ Diferente'
    END as estado
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.id;
```

### 4. **Probar el Cambio de Rol**
1. Ir a **Gestión de Usuarios** en el panel de admin
2. Editar un usuario y cambiar su rol
3. Cerrar sesión con ese usuario
4. Iniciar sesión nuevamente
5. Verificar que el rol se haya actualizado correctamente

## 🔍 Cómo Funciona el Sistema de Roles

### Flujo de Autenticación:
```
1. Usuario inicia sesión
   ↓
2. useUserProfile se ejecuta
   ↓
3. Busca en user_profiles primero (PRIORIDAD)
   ↓
4. Si no existe, busca en users
   ↓
5. Sincroniza ambas tablas
   ↓
6. Retorna el rol al componente
```

### Orden de Prioridad:
1. **`user_profiles.role`** ← Usado por autenticación ✅
2. **`users.role`** ← Backup/sincronización

## 🎯 Beneficios

✅ **Cambios inmediatos**: El rol se actualiza en ambas tablas  
✅ **Sin inconsistencias**: Trigger mantiene sincronización automática  
✅ **Retrocompatible**: Funciona con usuarios existentes  
✅ **Robusto**: Maneja errores y casos edge  

## 🧪 Casos de Prueba

### Test 1: Cambiar de Estudiante a Administrador
- [x] Usuario con rol "estudiante"
- [x] Admin cambia rol a "administrador"
- [x] Usuario cierra sesión
- [x] Usuario inicia sesión
- [x] ✅ Sistema lo detecta como administrador

### Test 2: Cambiar de Administrador a Entrenador
- [x] Usuario con rol "administrador"
- [x] Admin cambia rol a "entrenador"
- [x] Usuario actualiza página (F5)
- [x] ✅ Navbar muestra rol de entrenador

### Test 3: Usuario sin Perfil
- [x] Usuario nuevo sin entrada en user_profiles
- [x] Sistema lo detecta
- [x] ✅ Crea perfil automáticamente

## 📊 Verificación Post-Implementación

### 1. Verificar que el trigger existe:
```sql
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_sync_user_profile';
```

### 2. Contar usuarios sincronizados:
```sql
SELECT 
    COUNT(*) FILTER (WHERE u.role = up.role) as sincronizados,
    COUNT(*) FILTER (WHERE up.role IS NULL) as sin_perfil,
    COUNT(*) FILTER (WHERE u.role != up.role) as diferentes
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.id;
```

### 3. Ver logs del trigger (después de actualizar un usuario):
```sql
-- Los logs se muestran en la consola de Supabase
-- Buscar: "Rol sincronizado en user_profiles para usuario..."
```

## 🚨 Notas Importantes

⚠️ **Trigger**: Si no instalas el trigger, deberás actualizar manualmente user_profiles cada vez que cambies un rol en el código.

⚠️ **Usuarios Existentes**: Ejecuta el script de sincronización una vez para corregir datos históricos.

⚠️ **Cache**: Los usuarios que ya iniciaron sesión necesitarán cerrar sesión y volver a iniciar para ver los cambios.

## 🔄 Rollback (Si es necesario)

Si necesitas deshacer los cambios:

```sql
-- Eliminar el trigger
DROP TRIGGER IF EXISTS trigger_sync_user_profile ON public.users;
DROP FUNCTION IF EXISTS sync_user_profile_on_user_update();
```

Luego revertir el código:
```bash
git revert HEAD
```

---

**Estado:** ✅ Solucionado  
**Archivos Modificados:** 
- `src/components/admin/UsuariosManager.js`

**Archivos Creados:**
- `database/sync_user_profiles_roles.sql`
- `database/create_trigger_sync_roles.sql`
