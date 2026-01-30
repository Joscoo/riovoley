# Migración: Eliminación de Altura y Peso del Registro de Atletas

**Fecha:** 29 de enero de 2026  
**Autor:** Sistema Riovoley

## 📋 Resumen de Cambios

Se eliminaron los campos de **altura** y **peso** del formulario de registro de atletas, ya que estos datos ahora se registran exclusivamente en los **Tests Físicos**.

## 🎯 Objetivo

- Evitar duplicidad de datos
- Mantener altura y peso actualizados a través de los tests físicos
- Simplificar el proceso de registro de atletas

## ✅ Archivos Modificados

### 1. **Frontend - Componentes**

#### `src/components/admin/AtletasManager.js`
- ❌ Removidos campos `altura` y `peso` del estado `formData`
- ❌ Removidos inputs del formulario de creación/edición
- ❌ Removida visualización en las tarjetas de atletas
- ❌ Removidos del query de carga de datos
- ❌ Removidos de las funciones `createAtleta()` y `updateAtleta()`

### 2. **Backend - Servicios**

#### `src/services/userCreationWorking.js`
- ❌ Removidos parámetros `altura` y `peso` de `createStudentWorking()`
- ❌ Removidos del insert en tabla `students`

#### `src/services/userCreationService.js`
- ❌ Removidos parámetros `altura` y `peso` de `createCompleteStudent()`
- ❌ Removidos del insert en tabla `students`

### 3. **Base de Datos**

#### `database/remove_altura_peso_from_students.sql`
- ✅ Script SQL para eliminar columnas de la tabla `students`

## 🗄️ Migración de Base de Datos

### Ejecutar en Supabase SQL Editor:

```sql
-- Eliminar columnas altura y peso
ALTER TABLE public.students
DROP COLUMN IF EXISTS altura;

ALTER TABLE public.students
DROP COLUMN IF EXISTS peso;
```

### ⚠️ Nota Importante
- Esta acción es **IRREVERSIBLE**
- Los datos de altura y peso existentes se **perderán**
- Asegúrate de tener un backup si necesitas los datos históricos

### Backup Opcional (Ejecutar ANTES de eliminar):
```sql
-- Crear tabla temporal con los datos actuales
CREATE TABLE students_backup_altura_peso AS
SELECT id, user_id, altura, peso, created_at
FROM students
WHERE altura IS NOT NULL OR peso IS NOT NULL;
```

## 📊 Dónde se Registran Ahora

Los datos de **altura** y **peso** ahora se registran y consultan desde:

- 📍 **Tabla:** `physical_tests`
- 📍 **Componente:** `TestsFisicosManager.js`
- 📍 **Campos en tests físicos:**
  - `estatura` (equivalente a altura)
  - `peso`

## 🔍 Verificación Post-Migración

### 1. Verificar que las columnas fueron eliminadas:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name IN ('altura', 'peso');
```
**Resultado esperado:** 0 filas

### 2. Verificar que los tests físicos tienen los datos:
```sql
SELECT COUNT(*) 
FROM physical_tests 
WHERE estatura IS NOT NULL AND peso IS NOT NULL;
```

### 3. Probar en la aplicación:
- ✅ Crear un nuevo atleta (sin campos de altura/peso)
- ✅ Editar un atleta existente
- ✅ Ver que los atletas se listan correctamente
- ✅ Registrar un test físico con altura y peso

## 🚀 Pasos para Aplicar

1. **Hacer commit de los cambios en el código**
   ```bash
   git add .
   git commit -m "feat: Eliminar altura y peso del registro de atletas"
   ```

2. **Ejecutar el script SQL en Supabase**
   - Ir a Supabase Dashboard → SQL Editor
   - Copiar y ejecutar el contenido de `database/remove_altura_peso_from_students.sql`

3. **Desplegar el frontend actualizado**
   ```bash
   npm run build
   # O el comando que uses para deployment
   ```

4. **Verificar en producción**
   - Probar crear un nuevo atleta
   - Verificar que no hay errores en consola

## 📝 Notas Adicionales

- Los **tests físicos existentes** conservan sus datos de altura y peso
- Para consultar la altura/peso actual de un atleta, buscar el test más reciente
- Si necesitas migrar datos antiguos de altura/peso a tests físicos, contacta al desarrollador

## 🔄 Rollback (Si es necesario)

Si necesitas revertir estos cambios:

1. Ejecutar:
```sql
ALTER TABLE public.students
ADD COLUMN altura NUMERIC(4,2);

ALTER TABLE public.students
ADD COLUMN peso NUMERIC(5,2);
```

2. Revertir el código con:
```bash
git revert HEAD
```

---

**Estado:** ✅ Completado  
**Próximo paso:** Ejecutar el script SQL en Supabase
