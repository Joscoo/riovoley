# 📋 Pasos para Configurar Horarios con Open Gym

## 🚨 Error Actual
```
Error al guardar horario: {
  code: '23514',
  message: 'new row for relation "schedules" violates check constraint "schedules_categoria_check"'
}
```

**Causa:** La tabla `schedules` en Supabase todavía tiene el constraint antiguo con `juego_sabado` y `juego_domingo`. Necesita actualizarse a `open_gym`.

---

## 🔧 Solución - Ejecutar Scripts SQL en Supabase

### Paso 1: Acceder a Supabase SQL Editor

1. Ve a [https://supabase.com](https://supabase.com)
2. Abre tu proyecto **RioVoley**
3. En el menú lateral, haz clic en **SQL Editor** (icono de código)

### Paso 2: Ejecutar Primer Script - Deshabilitar RLS

📄 **Archivo:** `database/disable_schedules_rls.sql`

```sql
-- Ejecuta TODO el contenido de este archivo
-- Esto deshabilitará el Row Level Security que causa el error 403
```

**Qué hace:**
- ✅ Deshabilita RLS en tabla `schedules`
- ✅ Muestra estado actual y final
- ✅ Soluciona error 403

**Pasos:**
1. Crea una nueva query en SQL Editor
2. Copia TODO el contenido de `database/disable_schedules_rls.sql`
3. Pega en el editor
4. Haz clic en **RUN** (o presiona Ctrl+Enter)
5. Verifica que aparezca "✅ RLS Deshabilitado"

---

### Paso 3: Ejecutar Segundo Script - Actualizar Categorías

📄 **Archivo:** `database/update_open_gym_category.sql`

```sql
-- Ejecuta TODO el contenido de este archivo
-- Esto cambia juego_sabado y juego_domingo por open_gym
```

**Qué hace:**
- ✅ Migra datos existentes de `juego_sabado`/`juego_domingo` → `open_gym`
- ✅ Elimina constraint antiguo
- ✅ Crea nuevo constraint con categorías correctas:
  - iniciacion_hombres
  - iniciacion_mujeres  
  - perfeccionamiento_hombres
  - perfeccionamiento_mujeres
  - master_mujeres
  - **open_gym** ← NUEVA

**Pasos:**
1. Crea otra nueva query en SQL Editor
2. Copia TODO el contenido de `database/update_open_gym_category.sql`
3. Pega en el editor
4. Haz clic en **RUN** (o presiona Ctrl+Enter)
5. Verifica los resultados de cada paso

---

## ✅ Verificación Final

Después de ejecutar ambos scripts, verifica:

```sql
-- Ejecuta esto para confirmar que todo está bien
SELECT 
    'Categorías disponibles' as info,
    categoria,
    COUNT(*) as cantidad
FROM public.schedules
GROUP BY categoria
ORDER BY categoria;
```

**Debes ver:**
- ✅ `open_gym` como categoría válida
- ✅ Sin errores de constraint
- ✅ Horarios existentes migrados correctamente

---

## 🎨 Cambios en el Frontend

### ✅ Ya Realizados (No necesitas hacer nada)

1. **HorariosManager** - Panel Admin
   - Categoría única "Open Gym" en lugar de Juego Sábado/Domingo
   - Color turquesa (#1abc9c)
   - Multi-selección de días y categorías funcional

2. **Horarios.js** - Vista Pública
   - Nuevo header con logo y ubicación
   - Información de contacto visible (teléfono, Instagram)
   - Diseño más atractivo y profesional
   - Responsive en mobile

3. **Estilos Mejorados**
   - Header con logo, nombre de marca y ubicación
   - Cards de horarios con mejor contraste
   - Animaciones suaves
   - Diseño responsive en tablets y móviles

---

## 📍 Personalización

Edita la información de contacto en: `src/components/Horarios.js`

```javascript
// Línea ~170
<div className={styles.infoItem}>
  <FaMapMarkerAlt className={styles.infoIcon} />
  <div>
    <p className={styles.infoLabel}>Ubicación</p>
    <p className={styles.infoValue}>Av. Principal 123, Caracas</p> ← EDITAR
  </div>
</div>
<div className={styles.infoItem}>
  <FaPhone className={styles.infoIcon} />
  <div>
    <p className={styles.infoLabel}>Teléfono</p>
    <p className={styles.infoValue}>+58 424-1234567</p> ← EDITAR
  </div>
</div>
<div className={styles.infoItem}>
  <FaInstagram className={styles.infoIcon} />
  <div>
    <p className={styles.infoLabel}>Instagram</p>
    <p className={styles.infoValue}>@riovoley</p> ← EDITAR
  </div>
</div>
```

---

## 🚀 Resumen de Ejecución

1. ✅ Ejecutar `disable_schedules_rls.sql` en Supabase SQL Editor
2. ✅ Ejecutar `update_open_gym_category.sql` en Supabase SQL Editor
3. ✅ Verificar resultados con query de verificación
4. ✅ Recargar la app y probar crear un horario "Open Gym"
5. ✅ Personalizar datos de contacto en Horarios.js

---

## 📞 Soporte

Si después de ejecutar los scripts sigues viendo errores:

1. Verifica que ejecutaste **ambos scripts completos**
2. Revisa la consola de Supabase SQL Editor por errores en rojo
3. Confirma que estás en la base de datos correcta
4. Recarga la aplicación (Ctrl+F5)

---

**✨ Resultado Final:**
- ✅ Sin errores 403 o de constraint
- ✅ Categoría "Open Gym" disponible y funcional
- ✅ Header atractivo con logo, ubicación e información de contacto
- ✅ Diseño profesional y responsive
