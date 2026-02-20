# ⚡ CORRECCIÓN RÁPIDA - Fechas de Asistencias

## 🎯 Objetivo
Corregir fechas de asistencias que se registraron con el día siguiente por problema de zona horaria.

## 📊 ¿Cómo saber si tengo este problema?

Ejecuta en **Supabase SQL Editor**:

```sql
SELECT COUNT(*) as registros_con_fecha_incorrecta
FROM attendances
WHERE fecha != (hora_entrada AT TIME ZONE 'America/Guayaquil')::date;
```

- **Si retorna 0:** ✅ No hay problema
- **Si retorna un número mayor:** ❌ Tienes registros que corregir

## ✅ Solución en 1 Solo Comando

```sql
UPDATE attendances
SET fecha = (hora_entrada AT TIME ZONE 'America/Guayaquil')::date
WHERE fecha != (hora_entrada AT TIME ZONE 'America/Guayaquil')::date;
```

Ejecuta esto y listo. Las fechas se corrigen automáticamente.

## 🔍 Verificar que funcionó

```sql
SELECT COUNT(*) as registros_aun_incorrectos
FROM attendances
WHERE fecha != (hora_entrada AT TIME ZONE 'America/Guayaquil')::date;
```

Debe retornar **0**.

## 📁 Scripts Disponibles

### Para usuarios avanzados:
- **Script completo con análisis:** `database/fix_attendance_dates_timezone.sql`
- **Script simplificado:** `database/fix_attendance_dates_simple.sql`
- **Guía detallada:** `CORRECCION_FECHAS_HISTORICAS.md`

## ⚠️ Importante

- ✅ Es seguro ejecutar (solo actualiza registros incorrectos)
- ✅ No afecta registros que ya están correctos
- ✅ Usa la hora real registrada en `hora_entrada`
- ⚠️ Recomendado: Ejecuta en horario de baja actividad

## 💡 ¿Qué hace exactamente?

**Para cada asistencia:**
1. Toma la `hora_entrada` (que tiene el timestamp correcto)
2. Convierte a zona horaria de Ecuador
3. Extrae solo la fecha
4. Actualiza el campo `fecha` con la fecha correcta

**Ejemplo:**
- `hora_entrada`: 2026-02-20 19:30 (Ecuador)
- `fecha` antes: 2026-02-21 ❌
- `fecha` después: 2026-02-20 ✅

---

**¿Dudas?** Lee la guía completa: `CORRECCION_FECHAS_HISTORICAS.md`
