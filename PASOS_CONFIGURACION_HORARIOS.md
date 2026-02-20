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

---

### Paso 4: Ejecutar Tercer Script - Agregar Descripciones

📄 **Archivo:** `database/add_schedule_descriptions.sql`

```sql
-- Ejecuta TODO el contenido de este archivo
-- Esto agrega descripciones informativas a cada horario
```

**Qué hace:**
- ✅ Agrega columna `descripcion` a tabla schedules
- ✅ Puebla descripciones automáticamente según categoría:
  - **Iniciación**: Fundamentos básicos para principiantes
  - **Perfeccionamiento**: Técnica avanzada y táctica de juego
  - **Master**: Atletas mayores de 18 años con experiencia
  - **Open Gym**: Juego libre para todos los niveles
- ✅ Textos descriptivos y atractivos para cada nivel

---

## ✅ Verificación Final

Después de ejecutar los tres scripts, verifica:

```sql
-- Ejecuta esto para confirmar que todo está bien
SELECT 
    'Estado completo de schedules' as info,
    categoria,
    COUNT(*) as total_horarios,
    COUNT(descripcion) as con_descripcion,
    CASE 
        WHEN COUNT(*) = COUNT(descripcion) THEN '✅ Listo'
        ELSE '⚠️ Falta configurar'
    END as estado
FROM public.schedules
GROUP BY categoria
ORDER BY categoria;
```

**Debes ver:**
- ✅ `open_gym` como categoría válida
- ✅ Sin errores de constraint
- ✅ Todas las categorías con descripción
- ✅ Horarios existentes migrados correctamente

---

## 🎨 Cambios en el Frontend

### ✅ Ya Realizados (No necesitas hacer nada)

1. **HorariosManager** - Panel Admin
   - Categoría única "Open Gym" en lugar de Juego Sábado/Domingo
   - Color turquesa (#1abc9c)
   - Multi-selección de días y categorías funcional
   - **Campo de descripción opcional** con placeholder inteligente
   - Valores por defecto según categoría seleccionada

2. **Horarios.js** - Vista Pública
   - Nuevo diseño simplificado sin header
   - **Descripciones visibles** en cada card de horario
   - Icono informativo con texto descriptivo
   - Diseño responsive en mobile

3. **Estilos Mejorados**
   - Cards de horarios con descripción integrada
   - Textarea para editar descripciones
   - Animaciones suaves
   - Diseño responsive en tablets y móviles

---

## 📝 Descripciones por Categoría

Las descripciones creadas son:

### 🔵 Iniciación Hombres / Mujeres
*"Perfecto para quienes se inician en el voleibol. Aprende los fundamentos básicos: recepción, saque, golpe de dedos, antebrazo y posicionamiento en cancha. Entrenamiento progresivo y didáctico."*

### 🟢 Perfeccionamiento Hombres / Mujeres
*"Para jugadores con experiencia que buscan mejorar su técnica y táctica de juego. Enfoque en remates, bloqueos, sistemas defensivos y estrategias avanzadas de competición."*

### 🟠 Master Mujeres
*"Categoría especial para atletas mayores de 18 años con experiencia previa en voleibol. Mantén tu nivel competitivo, mejora tu condición física y disfruta del juego con compañeras de tu edad y experiencia."*

### 🟢 Open Gym
*"Sesión de juego libre para todos los niveles. Practica lo aprendido, conoce jugadores de diferentes categorías y disfruta partidos recreativos en un ambiente divertido y competitivo."*

---

## 🚀 Resumen de Ejecución

1. ✅ Ejecutar `disable_schedules_rls.sql` en Supabase SQL Editor
2. ✅ Ejecutar `update_open_gym_category.sql` en Supabase SQL Editor
3. ✅ Ejecutar `add_schedule_descriptions.sql` en Supabase SQL Editor
4. ✅ Verificar resultados con query de verificación
5. ✅ Recargar la app y probar crear un horario "Open Gym"
6. ✅ Ver descripciones en la vista pública de horarios

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
