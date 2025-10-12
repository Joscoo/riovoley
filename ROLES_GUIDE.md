# 👤 Sistema de Roles de Usuario - Guía Completa

## 🎯 Funcionalidades Implementadas

### ✅ **Características del Sistema:**
- **Perfiles de Usuario**: Cada usuario tiene un perfil con rol asignado
- **Roles Disponibles**: admin, moderador, usuario, premium, invitado
- **Visualización**: El rol se muestra en el navbar y en la página de login
- **Colores por Rol**: Cada rol tiene un color distintivo
- **Hook Personalizado**: `useUserProfile` para gestionar perfiles fácilmente
- **Seguridad**: Row Level Security (RLS) configurado en Supabase

### 🎨 **Colores de Roles:**
- 🔴 **Admin**: Rojo (#dc3545)
- 🟠 **Moderador**: Naranja (#fd7e14)
- 🟢 **Usuario**: Verde (#28a745)
- 🟣 **Premium**: Púrpura (#6f42c1)
- ⚫ **Invitado**: Gris (#6c757d)

## 🛠️ Configuración en Supabase

### 1. **Crear la Tabla de Perfiles**
1. Ve a tu dashboard de Supabase
2. Ve a "SQL Editor"
3. Ejecuta el contenido del archivo `supabase_user_profiles.sql`

### 2. **Verificar la Creación**
Ejecuta esta consulta para verificar:
```sql
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles';
```

### 3. **Asignar Roles a Usuarios Existentes**

#### Opción A: Desde SQL Editor
```sql
-- Primero, encuentra los IDs de tus usuarios
SELECT id, email, created_at FROM auth.users ORDER BY created_at;

-- Luego, inserta o actualiza los perfiles
INSERT INTO user_profiles (id, full_name, role) 
VALUES 
  ('uuid-del-usuario-1', 'Nombre Admin', 'admin'),
  ('uuid-del-usuario-2', 'Nombre Moderador', 'moderador')
ON CONFLICT (id) 
DO UPDATE SET role = EXCLUDED.role;
```

#### Opción B: Desde Authentication → Users
1. Ve a "Authentication" → "Users"
2. Para cada usuario, haz clic en su email
3. En "Raw User Meta Data", agrega:
   ```json
   {
     "full_name": "Nombre del Usuario",
     "role": "admin"
   }
   ```

## 🧪 Probar el Sistema

### 1. **Verificar Configuración Local**
1. Asegúrate de que tu aplicación esté corriendo: `npm start`
2. Ve a http://localhost:3000/login
3. Inicia sesión con un usuario

### 2. **Verificar que Funciona**
✅ **Deberías ver:**
- El rol del usuario en la página de login
- El rol como etiqueta de color en el navbar
- Información en la consola: "👤 Perfil cargado: {...}"

❌ **Si hay errores:**
- Verifica que la tabla `user_profiles` existe
- Asegúrate de que el usuario tiene un perfil asignado
- Revisa la consola del navegador para errores

## 📚 Usar el Hook useUserProfile

### Ejemplo Básico:
```javascript
import { useUserProfile } from '../hooks/useUserProfile';

function MiComponente({ user }) {
  const { 
    profile, 
    loading, 
    error, 
    hasRole, 
    isAdmin, 
    isModerator,
    getRoleColor 
  } = useUserProfile(user);

  if (loading) return <div>Cargando perfil...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Perfil del Usuario</h3>
      <p>Nombre: {profile?.full_name || 'Sin nombre'}</p>
      <p>Rol: <span style={{ color: getRoleColor() }}>{profile?.role}</span></p>
      
      {isAdmin() && <p>🔴 Tienes acceso de administrador</p>}
      {isModerator() && <p>🟠 Tienes acceso de moderador</p>}
      {hasRole('premium') && <p>🟣 Eres usuario premium</p>}
    </div>
  );
}
```

### Funciones Disponibles:
- `profile`: Objeto con datos del perfil
- `loading`: Boolean, true mientras carga
- `error`: Error si ocurre alguno
- `hasRole(role)`: Verifica si tiene un rol específico
- `isAdmin()`: True si es administrador
- `isModerator()`: True si es admin o moderador
- `getRoleColor()`: Devuelve el color hexadecimal del rol
- `refreshProfile()`: Recarga el perfil manualmente

## 🔐 Crear Componentes con Roles

### Componente Protegido por Rol:
```javascript
import { useUserProfile } from '../hooks/useUserProfile';

function AdminPanel({ user }) {
  const { isAdmin, loading } = useUserProfile(user);

  if (loading) return <div>Cargando...</div>;
  
  if (!isAdmin()) {
    return <div>❌ Acceso denegado. Solo administradores.</div>;
  }

  return (
    <div>
      <h2>🔴 Panel de Administración</h2>
      {/* Contenido solo para admins */}
    </div>
  );
}
```

### Mostrar Contenido Condicional:
```javascript
function HomePage({ user }) {
  const { profile, isAdmin, isModerator } = useUserProfile(user);

  return (
    <div>
      <h1>Bienvenido {profile?.full_name || user?.email}</h1>
      
      {isAdmin() && (
        <div>
          <h3>🔴 Sección de Admin</h3>
          <button>Gestionar Usuarios</button>
        </div>
      )}
      
      {isModerator() && (
        <div>
          <h3>🟠 Sección de Moderador</h3>
          <button>Moderar Contenido</button>
        </div>
      )}
    </div>
  );
}
```

## 🚀 Despliegue en Vercel

El sistema funcionará automáticamente en Vercel ya que:
- ✅ Las variables de entorno están configuradas
- ✅ El código está preparado para producción
- ✅ Supabase funciona desde cualquier dominio

## 🔧 Personalización

### Agregar Nuevos Roles:
1. **En Supabase**, modifica la tabla:
   ```sql
   ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_role_check;
   ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check 
   CHECK (role IN ('admin', 'moderador', 'usuario', 'premium', 'invitado', 'nuevo_rol'));
   ```

2. **En el código**, actualiza las funciones `getRoleColor`:
   ```javascript
   const roleColors = {
     'admin': '#dc3545',
     'moderador': '#fd7e14', 
     'usuario': '#28a745',
     'premium': '#6f42c1',
     'invitado': '#6c757d',
     'nuevo_rol': '#color_hexadecimal' // Agregar aquí
   };
   ```

### Cambiar Colores:
Modifica las funciones `getRoleColor` en:
- `src/components/Login.js`
- `src/components/Navbar.js`
- `src/hooks/useUserProfile.js`

## 🆘 Solución de Problemas

### "No se muestra el rol"
1. Verifica que la tabla `user_profiles` existe
2. Asegúrate de que el usuario tiene un perfil
3. Revisa la consola: debe mostrar "👤 Perfil cargado"

### "Error al obtener perfil"
1. Verifica las políticas RLS en Supabase
2. Asegúrate de que el usuario está autenticado
3. Revisa que las políticas permiten SELECT al propio usuario

### "El rol no se actualiza"
- Usa `refreshProfile()` del hook después de actualizar
- Verifica que el trigger de `updated_at` funciona

---

¡Tu sistema de roles está completo y listo para usar! 🎉