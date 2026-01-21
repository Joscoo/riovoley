# Actualización de Tests Físicos - Nuevos Campos de Fuerza

## 📋 Resumen de Cambios

Se han agregado 4 nuevos campos a la tabla `physical_tests` para medir la fuerza muscular:

1. **fuerza_abdomen** - Cantidad de abdominales en un minuto (0-200 reps)
2. **fuerza_brazos** - Cantidad de flexiones de brazo en un minuto (0-200 reps)
3. **fuerza_piernas** - Cantidad de sentadillas en un minuto (0-300 reps)
4. **elevaciones_barra** - Cantidad máxima de elevaciones en barra en un minuto (0-100 reps)

## 🗄️ Paso 1: Aplicar Migración de Base de Datos

Ejecuta el siguiente script SQL en tu base de datos Supabase:

```bash
# Conéctate a tu proyecto de Supabase y ejecuta:
psql -h [TU_HOST_SUPABASE] -U postgres -d postgres -f database/add_physical_test_strength_fields.sql
```

O desde el SQL Editor de Supabase, ejecuta el contenido del archivo:
- **Archivo**: `database/add_physical_test_strength_fields.sql`

### Contenido del Script:
- Agrega 4 nuevas columnas tipo INTEGER
- Aplica restricciones CHECK para validar rangos razonables
- Agrega comentarios descriptivos en la base de datos
- Compatible con datos existentes (todos los campos son NULL por defecto)

## ✅ Verificación de la Migración

Después de ejecutar el script, verifica que los campos se agregaron correctamente:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'physical_tests' 
AND column_name IN ('fuerza_abdomen', 'fuerza_brazos', 'fuerza_piernas', 'elevaciones_barra');
```

Deberías ver los 4 nuevos campos.

## 🔄 Archivos Actualizados

### Componentes React:

1. **TestsFisicosManager.js** 
   - ✅ Formulario actualizado con nuevos campos
   - ✅ Validación de datos
   - ✅ Visualización en tarjetas de tests
   - ✅ Funciones createTest y updateTest actualizadas

2. **StudentPhysicalTests.js**
   - ✅ Visualización de nuevas métricas para estudiantes
   - ✅ Iconos diferenciados para cada tipo de fuerza

3. **PhysicalTestChart.js**
   - ✅ Nuevas métricas agregadas para gráficos
   - ✅ Colores únicos para cada métrica de fuerza

4. **README_DATABASE.md**
   - ✅ Documentación actualizada con los nuevos campos

## 🎯 Características Implementadas

### Para Administradores/Entrenadores:
- Formulario con nueva sección "💪 Fuerza Muscular (repeticiones por minuto)"
- 4 campos numéricos con validación automática
- Placeholders con valores de referencia
- Los campos son opcionales - se puede registrar solo algunos

### Para Estudiantes:
- Visualización de las nuevas métricas en su panel
- Iconos descriptivos:
  - 🔥 Abdominales
  - 💪 Flexiones
  - 🦵 Sentadillas
  - 🏋️ Elevaciones en barra
- Gráficos actualizados para seguimiento de progreso

## 📊 Validaciones Implementadas

### Base de Datos:
- `fuerza_abdomen`: 0-200 repeticiones
- `fuerza_brazos`: 0-200 repeticiones
- `fuerza_piernas`: 0-300 repeticiones
- `elevaciones_barra`: 0-100 repeticiones

### Frontend:
- Campos numéricos con límites min/max
- Valores enteros (no decimales)
- Opcional - no bloquea el guardado si están vacíos

## 🚀 Despliegue

1. **Aplicar migración de base de datos** (ver Paso 1)
2. **Actualizar código React** (ya actualizado en los archivos)
3. **Rebuilder la aplicación**:
   ```bash
   npm run build
   ```
4. **Desplegar a producción**

## 🧪 Pruebas Recomendadas

1. ✅ Crear un nuevo test físico con todos los campos de fuerza
2. ✅ Crear un nuevo test físico solo con algunos campos de fuerza
3. ✅ Editar un test existente y agregar campos de fuerza
4. ✅ Ver un test desde la vista de estudiante
5. ✅ Verificar que los gráficos muestren las nuevas métricas
6. ✅ Verificar que los tests antiguos (sin estos campos) se muestren correctamente

## 📝 Notas Importantes

- ⚠️ **Compatibilidad**: Los tests físicos existentes no se ven afectados. Los nuevos campos aparecerán como NULL/vacíos.
- ✅ **Retrocompatibilidad**: Todos los componentes manejan correctamente la ausencia de estos campos.
- 🔒 **Seguridad**: Las restricciones de base de datos previenen valores inválidos.
- 📱 **Responsive**: Los nuevos campos se adaptan correctamente a móviles.

## 🎨 UI/UX

Los nuevos campos aparecen en una sección separada en el formulario:
- Agrupados bajo "💪 Fuerza Muscular (repeticiones por minuto)"
- Grid responsivo de 2 columnas (4 columnas en pantallas grandes)
- Labels descriptivos con unidad de medida
- Placeholders con valores de referencia

## 🐛 Solución de Problemas

### Error: "column does not exist"
- Asegúrate de haber ejecutado el script de migración SQL

### Los campos no aparecen en el formulario
- Verifica que estés usando la versión actualizada de TestsFisicosManager.js
- Limpia el cache del navegador (Ctrl+Shift+R)

### Los valores no se guardan
- Verifica los permisos RLS en Supabase para la tabla physical_tests
- Revisa la consola del navegador para errores de validación

## 📞 Soporte

Si encuentras algún problema:
1. Revisa los logs de la consola del navegador
2. Verifica que la migración SQL se ejecutó correctamente
3. Confirma que tienes la última versión del código
