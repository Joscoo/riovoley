# 🆘 GUÍA DE RECUPERACIÓN Y PROTECCIÓN DE PAGOS

## ⚠️ SITUACIÓN ACTUAL
Los pagos fueron eliminados de la base de datos y **no hay backups disponibles**.

---

## 📋 PLAN DE ACCIÓN

### **PASO 1: Recopilar Información Existente**

Busca cualquier fuente de datos que tengas:

#### Fuentes Posibles:
- ✉️ **Emails enviados** - Revisa confirmaciones de pago enviadas
- 💬 **Mensajes WhatsApp** - Busca notificaciones de pagos enviadas
- 📸 **Capturas de pantalla** - Fotos de la pantalla de pagos
- 📱 **Caché del navegador** - Datos temporales (F12 > Storage > Local Storage)
- 📝 **Recibos físicos/digitales** - Comprobantes de pago
- 💰 **Estados de cuenta bancarios** - Transferencias recibidas
- 📊 **Excel/Hojas de cálculo** - Si llevabas control manual

#### Revisar Cache del Navegador:
1. Abre la página de pagos (aunque esté vacía)
2. Presiona **F12** para abrir DevTools
3. Ve a **Application** > **Local Storage** o **Session Storage**
4. Busca entradas relacionadas con "payments" o "pagos"

---

### **PASO 2: Ejecutar Protección de Datos (IMPORTANTE)**

**Antes de reconstruir datos, implementa la protección:**

1. Ve a **Supabase Dashboard** > **SQL Editor**
2. Ejecuta el archivo: `database/setup_soft_delete_protection.sql`
3. Esto implementará:
   - ✅ **Soft Delete** - Los pagos no se eliminarán permanentemente
   - ✅ **Auditoría completa** - Registra todos los cambios
   - ✅ **Recuperación** - Puedes restaurar datos eliminados

**¿Qué hace el Soft Delete?**
- Cuando "elimines" un pago, solo se marca como `deleted_at`
- Los datos permanecen 30 días en la base de datos
- Puedes recuperarlos ejecutando:
  ```sql
  SELECT restore_payment(ID_DEL_PAGO);
  ```

---

### **PASO 3: Reconstruir Pagos**

#### **Opción A: Datos Completos Disponibles**
Si tienes registros detallados:

1. Abre: `database/emergency_rebuild_payments.sql`
2. Modifica el INSERT con tus datos reales:
   ```sql
   INSERT INTO payments (student_id, monto, fecha_inicio, fecha_fin, fecha_pago, estado, observaciones)
   VALUES
   (1, 50.00, '2026-01-01', '2026-01-31', '2026-01-05', 'activo', 'Enero'),
   (2, 50.00, '2026-01-01', '2026-01-31', NULL, 'vencido', 'Pendiente');
   ```
3. Ejecuta el script en Supabase

#### **Opción B: Solo Necesitas Mes Actual**
Si solo te importa el mes actual:

1. Ejecuta la Sección 4 del archivo `emergency_rebuild_payments.sql`
2. Ajusta el monto estándar (ejemplo: $50)
3. Esto generará pagos automáticamente para todos los estudiantes

#### **Opción C: Reconstrucción Manual**
Desde la interfaz web:
1. Ve a **Gestión de Pagos**
2. Usa el botón **"Registrar Pago"**
3. Ingresa cada pago uno por uno

---

### **PASO 4: Verificación**

Ejecuta estas consultas para verificar:

```sql
-- Ver total de pagos restaurados
SELECT COUNT(*) as total_pagos FROM payments WHERE deleted_at IS NULL;

-- Ver pagos por estudiante
SELECT 
  u.nombre, u.apellido,
  p.monto, p.fecha_inicio, p.estado
FROM payments p
JOIN students s ON p.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE p.deleted_at IS NULL
ORDER BY p.fecha_inicio DESC;
```

---

## 🛡️ PROTECCIÓN IMPLEMENTADA

### **1. Soft Delete Activado**
✅ Los pagos ya NO se eliminan permanentemente
✅ El botón "Eliminar" ahora solo marca como eliminado
✅ Confirmación mejorada con detalles del pago

### **2. Sistema de Auditoría**
Todos los cambios se registran en `payments_audit`:
- Quién hizo el cambio
- Cuándo lo hizo
- Qué cambió (antes y después)

Ver historial completo:
```sql
SELECT * FROM payments_audit ORDER BY changed_at DESC LIMIT 50;
```

### **3. Recuperación de Datos**
Si alguien elimina un pago por error:

```sql
-- Ver pagos eliminados
SELECT * FROM payments WHERE deleted_at IS NOT NULL;

-- Restaurar un pago específico
SELECT restore_payment(123); -- Reemplaza 123 con el ID real
```

---

## 📊 ESTADÍSTICAS ÚTILES

```sql
-- Total de pagos activos vs eliminados
SELECT 
  CASE 
    WHEN deleted_at IS NULL THEN 'Activos'
    ELSE 'Eliminados'
  END as estado,
  COUNT(*) as cantidad,
  SUM(monto) as total
FROM payments
GROUP BY estado;

-- Últimas eliminaciones
SELECT 
  p.id,
  u.nombre, u.apellido,
  p.monto,
  p.deleted_at,
  pa.changed_by
FROM payments p
JOIN students s ON p.student_id = s.id
JOIN users u ON s.user_id = u.id
LEFT JOIN payments_audit pa ON p.id = pa.payment_id AND pa.action = 'DELETE'
WHERE p.deleted_at IS NOT NULL
ORDER BY p.deleted_at DESC;
```

---

## ⚙️ CONFIGURACIÓN DE SUPABASE

### **Habilitar Backups (Cuando sea posible)**
1. Ve a **Supabase Dashboard** > **Settings** > **Database**
2. Considera actualizar tu plan para incluir backups automáticos
3. Alternativa: Exporta datos manualmente cada semana

### **Exportación Manual Regular**
```sql
-- Exportar todos los pagos a CSV
COPY (
  SELECT 
    p.*,
    u.nombre, u.apellido
  FROM payments p
  JOIN students s ON p.student_id = s.id
  JOIN users u ON s.user_id = u.id
  WHERE p.deleted_at IS NULL
) TO '/tmp/backup_payments.csv' WITH CSV HEADER;
```

---

## 🚨 PREVENCIÓN FUTURA

### **Checklist Semanal:**
- [ ] Exportar CSV de pagos activos
- [ ] Revisar tabla de auditoría
- [ ] Verificar integridad de datos

### **Checklist Mensual:**
- [ ] Limpiar pagos eliminados hace más de 30 días
- [ ] Backup completo de la base de datos
- [ ] Revisar logs de auditoría

### **Limpiar Pagos Eliminados (después de 30 días):**
```sql
-- Ver pagos eliminados hace más de 30 días
SELECT * FROM payments 
WHERE deleted_at < NOW() - INTERVAL '30 days';

-- SOLO ejecuta esto cuando estés seguro
DELETE FROM payments 
WHERE deleted_at < NOW() - INTERVAL '30 days';
```

---

## 🆘 SOPORTE

Si necesitas ayuda:
1. Revisa los logs de auditoría: `SELECT * FROM payments_audit;`
2. Verifica triggers activos: `\d payments`
3. Contacta soporte de Supabase si necesitas acceso a logs del servidor

---

## 📝 NOTAS IMPORTANTES

- ⏰ **Tiempo de retención**: 30 días para pagos eliminados
- 🔒 **Seguridad**: Solo administradores pueden ver pagos eliminados
- 📊 **Performance**: El índice en `deleted_at` mantiene consultas rápidas
- 💾 **Espacio**: Los pagos eliminados ocupan espacio hasta la limpieza

---

**Fecha de implementación**: ${new Date().toLocaleDateString()}
**Sistema actualizado**: Soft Delete + Auditoría + Recuperación
