# 🕐 Corrección de Problema de Zona Horaria en Asistencias

## 📋 Problemas Identificados

Las asistencias tenían **dos problemas** relacionados con zonas horarias:

### 1️⃣ Problema al Guardar (RESUELTO)
Las asistencias se estaban **registrando** con la fecha del día siguiente, especialmente después de las 7:00 PM. Por ejemplo:
- Si se registraba asistencia el 20 de febrero a las 7:30 PM
- En la base de datos aparecía como 21 de febrero ❌

### 2️⃣ Problema al Mostrar (RESUELTO)
Las fechas del historial se mostraban con **un día menos**. Por ejemplo:
- Asistencia del miércoles 18 de febrero
- Se mostraba como martes 17 de febrero ❌

## 🔍 Causa Raíz

### Problema de Guardado
El código estaba usando `new Date().toISOString().split('T')[0]` para obtener fechas, lo cual:
1. Convierte la fecha a **UTC (Tiempo Universal Coordinado)**
2. Ecuador está en zona horaria **UTC-5** (5 horas detrás de UTC)
3. A las 7:30 PM en Ecuador (19:30), en UTC ya son las 12:30 AM del día siguiente (00:30)
4. Por lo tanto, el día se incrementaba incorrectamente

**Ejemplo:**
```javascript
// ❌ ANTES (Incorrecto - Guardado)
const fecha = new Date().toISOString().split('T')[0];
// Si son 20:00 del 20 de febrero en Ecuador
// UTC = 01:00 del 21 de febrero
// Resultado: "2026-02-21" ❌
```

### Problema de Visualización
Al mostrar las fechas, se usaba `new Date("2026-02-18")` que JavaScript interpreta como UTC medianoche:
```javascript
// ❌ ANTES (Incorrecto - Visualización)
new Date("2026-02-18") // Interpreta como 2026-02-18T00:00:00Z (UTC)
// En Ecuador (UTC-5): 2026-02-17T19:00:00 (día anterior)
// Al formatear: "17 de febrero" ❌
```

## ✅ Solución Implementada

### 1. Creación de Utilidad de Fechas (`dateUtils.js`)

Se creó un archivo de utilidades para manejar fechas con la zona horaria de Ecuador:

#### Para Guardar Fechas:
```javascript
// src/utils/dateUtils.js

export const getEcuadorDate = (date = new Date()) => {
  // Convierte a zona horaria de Ecuador (America/Guayaquil)
  const ecuadorDate = new Date(date.toLocaleString('en-US', { 
    timeZone: 'America/Guayaquil' 
  }));
  const year = ecuadorDate.getFullYear();
  const month = String(ecuadorDate.getMonth() + 1).padStart(2, '0');
  const day = String(ecuadorDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
```

#### Para Mostrar Fechas:
```javascript
export const formatDateString = (dateString, options = {}) => {
  // Separa componentes para evitar interpretación como UTC
  const [year, month, day] = dateString.split('-').map(num => Number.parseInt(num, 10));
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Guayaquil',
    ...options
  });
};
```

**Ejemplos normalizados:**
```javascript
// ✅ GUARDADO (Correcto)
const fecha = getEcuadorDate();
// Si son 20:00 del 20 de febrero en Ecuador
// Resultado: "2026-02-20" ✅

// ✅ VISUALIZACIÓN (Correcto)
formatDateString("2026-02-18");
// Resultado: "miércoles, 18 de febrero de 2026" ✅
```

### 2. Funciones Auxiliares Creadas

#### Para Guardar/Crear Fechas:
- `getEcuadorDate()` - Obtiene fecha actual en formato YYYY-MM-DD
- `getEcuadorDateTime()` - Obtiene fecha y hora como objeto Date
- `getEcuadorDateMinusDays(days)` - Resta días a la fecha actual
- `getEcuadorDatePlusDays(days)` - Suma días a la fecha actual
- `getEcuadorFirstDayOfMonth()` - Primer día del mes actual
- `getEcuadorLastDayOfMonth()` - Último día del mes actual

#### Para Mostrar/Formatear Fechas:
- `formatDateString(dateString, options)` - Formatea fecha para visualización (formato largo)
- `formatDateStringShort(dateString)` - Formatea fecha en formato corto (DD/MM/YYYY)

**Uso:**
```javascript
// Guardar
const fechaHoy = getEcuadorDate(); // "2026-02-20"

// Mostrar
formatDateString("2026-02-20"); // "jueves, 20 de febrero de 2026"
formatDateStringShort("2026-02-20"); // "20/02/2026"
```

### 3. Archivos Actualizados

Se actualizaron **8 archivos** para usar las nuevas utilidades:

#### 📁 Componentes Admin
- ✅ `AsistenciasManager.js` - Registro **y visualización** de asistencias
- ✅ `Dashboard.js` - Estadísticas del dashboard
- ✅ `PagosManager.js` - Gestión de pagos
- ✅ `TestsFisicosManager.js` - Tests físicos

#### 📁 Componentes Trainer
- ✅ `TrainerDashboard.js` - Dashboard de entrenadores

#### 📁 Componentes Student
- ✅ `StudentPanel.js` - Panel de estudiantes (pagos **y asistencias**)

#### 📁 Servicios
- ✅ `pagoStatusService.js` - Cálculo de estados de pagos

#### 📁 Utilidades
- ✅ `dateUtils.js` - **NUEVO** archivo con funciones de fecha

## 🎯 Cambios Específicos

### Problema 1: Guardado de Fechas

#### ❌ ANTES (Incorrecto)
```javascript
// Inicialización con fecha incorrecta
const [selectedDate, setSelectedDate] = useState(
  new Date().toISOString().split('T')[0]
);

// Registro de asistencia con fecha UTC
const { error } = await supabase
  .from('attendances')
  .insert({
    student_id: atletaId,
    fecha: new Date().toISOString().split('T')[0], // ❌ UTC
    metodo_pago_id: paymentTypeId
  });
```

#### ✅ AHORA (Correcto)
```javascript
import { getEcuadorDate } from '../../utils/dateUtils';

// Inicialización con fecha correcta
const [selectedDate, setSelectedDate] = useState(getEcuadorDate());

// Registro de asistencia con fecha de Ecuador
const { error } = await supabase
  .from('attendances')
  .insert({
    student_id: atletaId,
    fecha: selectedDate, // ✅ Ecuador
    metodo_pago_id: paymentTypeId
  });
```

### Problema 2: Visualización de Fechas

#### ❌ ANTES (Incorrecto)
```javascript
// En el historial de asistencias
const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
// fecha = "2026-02-18"
// new Date("2026-02-18") → interpreta como UTC
// Resultado: "martes, 17 de febrero de 2026" ❌ (un día menos)
```

#### ✅ AHORA (Correcto)
```javascript
import { formatDateString } from '../../utils/dateUtils';

// En el historial de asistencias
const fechaFormateada = formatDateString(fecha);
// fecha = "2026-02-18"
// Separa componentes y crea fecha local
// Resultado: "miércoles, 18 de febrero de 2026" ✅ (día correcto)
```

## 🧪 Casos de Prueba

### Caso 1: Registro en la Tarde/Noche (Problema de Guardado)
```javascript
// Día: 20 de febrero de 2026
// Hora: 19:30 (7:30 PM) Ecuador

// ANTES (UTC):
fecha guardada = "2026-02-21" ❌ (día siguiente)

// AHORA (Ecuador):
fecha guardada = "2026-02-20" ✅ (día correcto)
```

### Caso 2: Visualización de Historial (Problema de Mostrar)
```javascript
// Fecha en BD: "2026-02-18" (miércoles)

// ANTES (interpretación UTC):
new Date("2026-02-18").toLocaleDateString()
→ "martes, 17 de febrero" ❌ (día anterior)

// AHORA (componentes locales):
formatDateString("2026-02-18")
→ "miércoles, 18 de febrero" ✅ (día correcto)
```

### Caso 3: Registro en la Mañana
```javascript
// Día: 20 de febrero de 2026
// Hora: 09:00 (9:00 AM) Ecuador

// ANTES (UTC):
fecha guardada = "2026-02-20" ✅ (por casualidad correcto)
visualización = "19 de febrero" ❌ (día anterior)

// AHORA (Ecuador):
fecha guardada = "2026-02-20" ✅ (siempre correcto)
visualización = "20 de febrero" ✅ (día correcto)
```

### Caso 4: Cerca de Medianoche
```javascript
// Día: 20 de febrero de 2026
// Hora: 23:30 (11:30 PM) Ecuador

// ANTES (UTC):
fecha guardada = "2026-02-21" ❌ (día siguiente)
visualización = "20 de febrero" ❌ (confuso - días distintos)

// AHORA (Ecuador):
fecha guardada = "2026-02-20" ✅ (día correcto)
visualización = "20 de febrero" ✅ (consistente)
```

## 🔧 Verificación

Para verificar que ambas correcciones funcionan:

### 1. **Probar registro de asistencia después de las 7:00 PM**
   ```
   - Ir a "Control de Asistencias"
   - Registrar asistencia de un atleta después de las 7 PM
   - Verificar que la fecha guardada sea la correcta del día actual
   ```

### 2. **Revisar historial de asistencias**
   ```
   - Ir a la sección de "Reportes" o historial
   - Verificar que las fechas coincidan con el día real de registro
   - Ejemplo: miércoles 18 debe mostrar "miércoles 18", no "martes 17"
   ```

### 3. **Probar en diferentes horarios**
   ```
   - Mañana (9:00 AM)
   - Tarde (3:00 PM)
   - Noche (8:00 PM)
   - Medianoche (11:50 PM)
   
   En todos los casos:
   ✅ La fecha guardada debe ser correcta
   ✅ La fecha mostrada debe coincidir con la guardada
   ```

### 4. **Panel de estudiante**
   ```
   - Ingresar como estudiante
   - Ver historial de asistencias
   - Verificar que las fechas mostradas sean correctas
   ```

## 📚 Documentación Técnica

### Zona Horaria de Ecuador
- **Zona horaria:** America/Guayaquil
- **Desplazamiento UTC:** UTC-5 (todo el año)
- **Sin horario de verano:** Ecuador no cambia horario

### Método de Conversión
```javascript
// Convierte Date a zona horaria específica
const ecuadorDate = new Date(
  date.toLocaleString('en-US', { 
    timeZone: 'America/Guayaquil' 
  })
);

// Extrae componentes de fecha
const year = ecuadorDate.getFullYear();
const month = ecuadorDate.getMonth() + 1; // 1-12
const day = ecuadorDate.getDate(); // 1-31

// Formatea como string ISO
return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
```

## ⚠️ Consideraciones Importantes

1. **Consistencia:** Todos los registros ahora usan la misma zona horaria
2. **Histórico:** Los registros antiguos pueden corregirse con el script de migración (ver más abajo)
3. **A futuro:** Usar siempre `getEcuadorDate()` para nuevos registros de fechas
4. **Base de datos:** Las fechas se almacenan como `date` (sin timestamp) en formato YYYY-MM-DD

## 🔄 Corrección de Registros Históricos

**¿Se pueden corregir los registros antiguos?** ¡SÍ! ✅

He creado scripts SQL que identifican y corrigen automáticamente las asistencias con fechas incorrectas:

### ⚡ Corrección Rápida (Recomendado)
- **Guía Express:** [QUICK_FIX_FECHAS.md](QUICK_FIX_FECHAS.md) - Solo 1 comando SQL ⚡

### 📁 Scripts Disponibles
- **Script completo:** [database/fix_attendance_dates_timezone.sql](database/fix_attendance_dates_timezone.sql) - Con análisis detallado
- **Script simple:** [database/fix_attendance_dates_simple.sql](database/fix_attendance_dates_simple.sql) - Versión simplificada
- **Guía completa:** [CORRECCION_FECHAS_HISTORICAS.md](CORRECCION_FECHAS_HISTORICAS.md) - Paso a paso detallado

### 🎯 ¿Cómo Funciona?

El script usa la columna `hora_entrada` (timestamptz) que contiene el timestamp correcto con zona horaria para:

1. **Identificar** registros donde la fecha guardada no coincide con la fecha real en Ecuador
2. **Analizar** cuántos registros están afectados y en qué fechas
3. **Corregir** automáticamente las fechas usando la hora real de Ecuador
4. **Verificar** que la corrección fue exitosa

### ⚡ Ejemplo de Corrección

```sql
-- Antes (incorrecto):
Fecha guardada: 2026-02-21
Hora real: 2026-02-20 19:30:00 (Ecuador)

-- Después (correcto):
Fecha corregida: 2026-02-20
Hora real: 2026-02-20 19:30:00 (Ecuador)
```

### 🚨 Importante

- El script usa **transacciones** (BEGIN/COMMIT/ROLLBACK) para poder deshacer si algo sale mal
- Solo corrige registros que tienen `hora_entrada` válida
- Incluye verificaciones antes y después de aplicar cambios
- Lee la guía completa antes de ejecutar: [CORRECCION_FECHAS_HISTORICAS.md](CORRECCION_FECHAS_HISTORICAS.md)

## 🚀 Beneficios

✅ **Precisión al Guardar:** Las fechas siempre se registran con el día correcto en Ecuador  
✅ **Precisión al Mostrar:** Las fechas históricas se visualizan con el día correcto  
✅ **Consistencia:** Mismo comportamiento sin importar la hora del día  
✅ **Sin Confusión:** Lo que ves es lo que está guardado  
✅ **Mantenibilidad:** Funciones centralizadas fáciles de actualizar  
✅ **Escalabilidad:** Fácil agregar más funciones de fecha si se necesitan  

## 📝 Notas Adicionales

### Sobre los Dos Problemas
- **Problema de guardado:** Afectaba principalmente registros después de 7:00 PM (incrementaba el día)
- **Problema de visualización:** Afectaba TODOS los registros históricos (decrementaba el día al mostrar)
- **Efecto neto:** Los registros después de 7 PM se veían correctos por "dos errores que se cancelaban", pero los de la mañana/tarde se veían con un día menos

### Impacto Técnico
- **No afecta datos existentes:** Solo corrige nuevos registros y visualización
- **Compatible con Supabase:** Las fechas se envían en el formato correcto (YYYY-MM-DD)
- **Sin dependencias externas:** Usa API nativa de JavaScript
- **Rendimiento:** Impacto mínimo, operaciones ligeras
- **Corrección histórica:** Disponible script SQL para corregir datos anteriores si es necesario

---

**Fecha de implementación:** 20 de febrero de 2026  
**Versión:** 1.0  
**Estado:** ✅ Completado y probado
