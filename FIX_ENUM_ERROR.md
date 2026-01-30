# 🔧 Solución Rápida: Error de Enum user_role_enum

## ❌ Error
```
ERROR: 22P02: invalid input value for enum user_role_enum: "estudiante"
```

## 🎯 Causa
El enum `user_role_enum` en Supabase no tiene el valor "estudiante", solo tiene:
- `administrador`
- `entrenador`  
- `usuario`

Pero tu tabla `users` tiene registros con `role = 'estudiante'`.

## ✅ Soluciones (elige UNA)

### **Solución 1: Agregar 'estudiante' al Enum** (RECOMENDADO)

**Ejecutar en Supabase SQL Editor:**
```sql
-- Ver archivo: database/add_estudiante_to_enum.sql
ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'estudiante';
```

Luego ejecutar el sync normal:
```sql
-- Ver archivo: database/sync_user_profiles_roles.sql
```

**✅ Ventajas:**
- Mantiene la distinción entre 'estudiante' y 'usuario'
- No requiere cambios en datos existentes
- Más semántico

---

### **Solución 2: Normalizar a 'usuario'**

**Paso 1 - Actualizar tabla users:**
```sql
UPDATE public.users 
SET role = 'usuario' 
WHERE role = 'estudiante';
```

**Paso 2 - Ejecutar sync (ya actualizado para mapear automáticamente):**
```sql
-- Ver archivo: database/sync_user_profiles_roles.sql
```

**⚠️ Desventajas:**
- Pierde la distinción entre tipos de usuarios
- Modifica datos existentes

---

## 📋 Pasos Recomendados

### 1. Verificar valores actuales del enum:
```sql
-- Ver archivo: database/check_enum_values.sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role_enum')
ORDER BY enumsortorder;
```

### 2. Verificar cuántos usuarios tienen cada rol:
```sql
SELECT role, COUNT(*) as cantidad
FROM public.users
GROUP BY role
ORDER BY role;
```

### 3. Ejecutar Solución 1:
```sql
ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'estudiante';
```

### 4. Ahora sí, ejecutar el script de sincronización:
```sql
-- El script ya está actualizado para manejar ambos casos
-- Ver: database/sync_user_profiles_roles.sql
```

## 🧪 Verificación

Después de ejecutar, verifica:

```sql
-- Todos los perfiles deben estar sincronizados
SELECT 
    u.email,
    u.role as role_users,
    up.role as role_profiles,
    CASE WHEN u.role = up.role OR (u.role = 'estudiante' AND up.role = 'usuario') 
         THEN '✅' ELSE '❌' END as ok
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.id;
```

## 📝 Archivos Actualizados

Todos los scripts ya están actualizados para manejar el mapeo automático:

- ✅ `database/sync_user_profiles_roles.sql` - Mapea estudiante→usuario
- ✅ `database/create_trigger_sync_roles.sql` - Trigger con mapeo
- ✅ `database/add_estudiante_to_enum.sql` - Agrega el valor al enum
- ✅ `database/check_enum_values.sql` - Verifica valores actuales

## 🚀 Ejecución Paso a Paso

```sql
-- PASO 1: Agregar 'estudiante' al enum
ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'estudiante';

-- PASO 2: Verificar que se agregó
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role_enum')
ORDER BY enumsortorder;

-- PASO 3: Sincronizar perfiles (ahora sin error)
-- Copiar y pegar el contenido completo de:
-- database/sync_user_profiles_roles.sql

-- PASO 4: Instalar trigger (opcional)
-- Copiar y pegar el contenido completo de:
-- database/create_trigger_sync_roles.sql
```

---

**Estado:** ✅ Scripts actualizados y listos para usar
