# 🔧 Guía: Corrección de Fechas Históricas en Asistencias

## 📋 Problema

Los registros de asistencia anteriores al 20 de febrero de 2026 pueden tener fechas incorrectas debido al uso de UTC en lugar de la zona horaria de Ecuador.

**Ejemplo del problema:**
- Asistencia registrada: **20 de febrero a las 8:00 PM** (Ecuador)
- Fecha guardada en BD: **21 de febrero** ❌ (día siguiente)
- Fecha correcta debería ser: **20 de febrero** ✅

## ✅ Solución

Tenemos la columna `hora_entrada` (timestamptz) que contiene el timestamp correcto con zona horaria. Usaremos esto para corregir las fechas.

## ⚡ Corrección Rápida (Recomendado)

### Opción Simple: 2 Pasos

**Usa el script simplificado:** `database/fix_attendance_dates_simple.sql`

#### 1️⃣ Ver el Problema (Sin cambios)

Copia y ejecuta en Supabase SQL Editor:

```sql
SELECT 
    COUNT(*) as total_incorrectos
FROM attendances
WHERE fecha != (hora_entrada AT TIME ZONE 'America/Guayaquil')::date;
```

Esto te dirá cuántos registros están afectados.

#### 2️⃣ Corregir Todo

Si encontró registros incorrectos, ejecuta:

```sql
UPDATE attendances
SET fecha = (hora_entrada AT TIME ZONE 'America/Guayaquil')::date
WHERE fecha != (hora_entrada AT TIME ZONE 'America/Guayaquil')::date;
```

✅ ¡Listo! Las fechas están corregidas.

## 🚀 Pasos para Corregir

### Paso 1: Identificar Registros Afectados

1. Abre el **SQL Editor** de Supabase
2. Copia y ejecuta **solo la sección PASO 1** del script:

```sql
-- Ver registros con fechas incorrectas
SELECT 
    a.id,
    u.nombre || ' ' || u.apellido as atleta,
    a.fecha as fecha_guardada,
    (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::date as fecha_correcta,
    a.hora_entrada,
    (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::time as hora_real
FROM attendances a
JOIN students s ON a.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE a.fecha != (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::date
ORDER BY a.fecha DESC
LIMIT 20;
```

**📊 Esto te mostrará:**
- Qué registros tienen fechas incorrectas
- La fecha guardada (incorrecta)
- La fecha correcta que debería tener
- La hora real en Ecuador

### Paso 2: Ver Resumen de Afectados

```sql
-- Contar cuántos registros están afectados
SELECT 
    COUNT(*) as total_registros_incorrectos,
    MIN(fecha) as fecha_mas_antigua,
    MAX(fecha) as fecha_mas_reciente
FROM attendances
WHERE fecha != (hora_entrada AT TIME ZONE 'America/Guayaquil')::date;
```

### Paso 3: Aplicar la Corrección

⚠️ **IMPORTANTE:** Una vez que hayas revisado y confirmado que los registros necesitan corrección:

```sql
-- EJECUTAR LA CORRECCIÓN
BEGIN;

-- Ver lo que se va a actualizar
SELECT 
    a.id,
    u.nombre || ' ' || u.apellido as atleta,
    a.fecha as fecha_antes,
    (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::date as fecha_despues
FROM attendances a
JOIN students s ON a.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE a.fecha != (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::date;

-- Actualizar las fechas
UPDATE attendances
SET fecha = (hora_entrada AT TIME ZONE 'America/Guayaquil')::date
WHERE fecha != (hora_entrada AT TIME ZONE 'America/Guayaquil')::date;

-- Confirmar los cambios
COMMIT;
```

Si algo sale mal y quieres deshacer, ejecuta:
```sql
ROLLBACK;
```

### Paso 4: Verificar la Corrección

```sql
-- Debe retornar 0 si todo está correcto
SELECT COUNT(*) as registros_aun_incorrectos
FROM attendances
WHERE fecha != (hora_entrada AT TIME ZONE 'America/Guayaquil')::date;
```

Si retorna **0**, ¡la corrección fue exitosa! ✅

## 📝 Ejemplo de Corrección

### ❌ Antes de la corrección:

| Atleta | Fecha Guardada | Hora Real (Ecuador) | Problema |
|--------|----------------|---------------------|----------|
| Juan Pérez | **2026-02-21** | 2026-02-20 19:30 | Día siguiente ❌ |
| María López | **2026-02-21** | 2026-02-20 20:15 | Día siguiente ❌ |
| Carlos Ruiz | **2026-02-21** | 2026-02-20 21:45 | Día siguiente ❌ |

### ✅ Después de la corrección:

| Atleta | Fecha Corregida | Hora Real (Ecuador) | Estado |
|--------|-----------------|---------------------|--------|
| Juan Pérez | **2026-02-20** | 2026-02-20 19:30 | Correcto ✅ |
| María López | **2026-02-20** | 2026-02-20 20:15 | Correcto ✅ |
| Carlos Ruiz | **2026-02-20** | 2026-02-20 21:45 | Correcto ✅ |

### 📊 Resumen Visual

```
ANTES:                           DESPUÉS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hora: 20/02 - 19:30 (Ecuador)    Hora: 20/02 - 19:30 (Ecuador)
Fecha BD: 21/02 ❌               Fecha BD: 20/02 ✅
Diferencia: +1 día incorrecto    Diferencia: 0 días (correcto)
```

## 🎯 ¿Qué Registros se Corrigen?

Se corrigen automáticamente registros donde:
- ✅ La asistencia fue registrada después de las 7:00 PM hora Ecuador
- ✅ La fecha guardada es diferente a la fecha real en Ecuador
- ✅ Tienen `hora_entrada` con timestamp válido

## ⚠️ Casos Especiales

### Registros sin hora_entrada

Si hay registros sin `hora_entrada` (NULL), no se pueden corregir automáticamente. Para verlos:

```sql
SELECT 
    a.id,
    u.nombre || ' ' || u.apellido as atleta,
    a.fecha
FROM attendances a
JOIN students s ON a.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE a.hora_entrada IS NULL;
```

Estos deberán corregirse manualmente si es necesario.

## 🔍 Script Completo

El script completo está en: `database/fix_attendance_dates_timezone.sql`

Incluye:
- ✅ Identificación de registros afectados
- ✅ Análisis y reportes
- ✅ Corrección con transacción (BEGIN/COMMIT/ROLLBACK)
- ✅ Verificación post-corrección
- ✅ Detección de casos especiales

## 💡 Recomendaciones

1. **Respaldo:** Aunque usamos transacciones, considera hacer un respaldo de la tabla antes
2. **Horario:** Ejecuta esto en un momento de baja actividad
3. **Verificación:** Revisa algunos registros manualmente después de la corrección
4. **Documentación:** Guarda un log de cuántos registros fueron corregidos

## 📞 Ayuda

Si tienes dudas o encuentras problemas:
1. No ejecutes la corrección hasta estar seguro
2. Revisa primero con las consultas de identificación (Paso 1 y 2)
3. Usa el script completo que incluye protección con transacciones

---

**Fecha de creación:** 20 de febrero de 2026  
**Versión:** 1.0  
**Estado:** ✅ Listo para usar
