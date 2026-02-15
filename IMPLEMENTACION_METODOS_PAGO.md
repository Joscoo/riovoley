# 💳 Guía de Implementación: Métodos de Pago en Asistencias

## 📋 Resumen de Cambios

Se reestructuró la tabla `payment_types` para que funcione como un **catálogo de métodos de pago**, permitiendo registrar cómo pagó cada atleta al momento de registrar su asistencia.

### Métodos de Pago Disponibles:
1. **Pago Diario** - Pago por sesión individual
2. **Mensualidad** - Pago mensual ya registrado
3. **Tarjeta** - Tarjeta de entrenamiento prepagada

---

## 🗄️ Cambios en Base de Datos

### 1. Ejecutar Migración

```bash
# Ejecutar el script SQL de reestructuración
psql -d tu_database < database/restructure_payment_types.sql
```

O desde Supabase SQL Editor:
- Abrir `database/restructure_payment_types.sql`
- Ejecutar cada sección paso a paso
- Verificar resultados

### 2. Estructura Final de `payment_types`

```sql
id              | integer  | PK
nombre          | text     | UNIQUE NOT NULL ('pago_diario', 'mensualidad', 'tarjeta')
descripcion     | text     | NULL
precio          | numeric  | NULL (opcional, solo referencia)
```

### 3. Uso en `attendances`

```sql
-- La columna metodo_pago_id ya existe
metodo_pago_id  | integer  | FK -> payment_types(id)
```

---

## 💻 Cambios en el Código Frontend

### Paso 1: Cargar Métodos de Pago

En `AsistenciasManager.js`, agregar estado para métodos de pago:

```javascript
const AsistenciasManager = ({ user }) => {
  // ... estados existentes ...
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  // Cargar métodos de pago al iniciar
  useEffect(() => {
    loadPaymentTypes();
  }, []);

  const loadPaymentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_types')
        .select('*')
        .order('id');

      if (error) throw error;
      setPaymentTypes(data || []);
      
      // Pre-seleccionar "mensualidad" como método por defecto
      const defaultMethod = data?.find(pt => pt.nombre === 'mensualidad');
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod.id);
      }
    } catch (error) {
      console.error('Error cargando métodos de pago:', error);
    }
  };
```

### Paso 2: Modificar `toggleAttendance` para incluir método de pago

```javascript
const toggleAttendance = async (atletaId, isCurrentlyPresent, paymentTypeId = null) => {
  try {
    if (isCurrentlyPresent) {
      // Si está presente, eliminar el registro (marcar como ausente)
      const { error } = await supabase
        .from('attendances')
        .delete()
        .eq('student_id', atletaId)
        .eq('fecha', selectedDate);

      if (error) throw error;
    } else {
      // Si está ausente, crear registro con método de pago (marcar como presente)
      const { error } = await supabase
        .from('attendances')
        .insert({
          student_id: atletaId,
          fecha: selectedDate,
          metodo_pago_id: paymentTypeId || selectedPaymentMethod // Usar el método seleccionado
        });

      if (error) throw error;
    }

    loadTodayAttendance();
    loadData(); // Refrescar la lista general
  } catch (error) {
    console.error('Error actualizando asistencia:', error);
    alert('Error: ' + error.message);
  }
};
```

### Paso 3: Agregar Selector de Método de Pago en UI

Agregar este componente antes de la lista de atletas:

```jsx
{/* Selector de Método de Pago */}
<div className={styles.paymentMethodSelector}>
  <label htmlFor="payment-method">Método de Pago:</label>
  <select
    id="payment-method"
    value={selectedPaymentMethod || ''}
    onChange={(e) => setSelectedPaymentMethod(Number(e.target.value))}
    className={styles.paymentSelect}
  >
    <option value="">Seleccionar método...</option>
    {paymentTypes.map(pt => (
      <option key={pt.id} value={pt.id}>
        {pt.nombre.replace('_', ' ').toUpperCase()}
        {pt.descripcion && ` - ${pt.descripcion}`}
      </option>
    ))}
  </select>
</div>
```

### Paso 4: Actualizar el componente de atleta individual

Modificar el componente de cada atleta para mostrar su método de pago:

```jsx
{todayAttendance
  .filter(atleta => atleta.categoria === 'iniciacion_hombres')
  .map(atleta => {
    const isPresent = atleta.attendance !== null;
    const metodoPago = atleta.attendance?.metodo_pago_id;
    const metodoPagoNombre = paymentTypes.find(pt => pt.id === metodoPago)?.nombre;
    
    return (
      <div key={atleta.id} className={styles.atletaItem}>
        <div className={styles.atletaInfo}>
          <span className={styles.atletaName}>
            {atleta.users?.nombre} {atleta.users?.apellido}
          </span>
          {isPresent && metodoPagoNombre && (
            <small className={styles.metodoPago}>
              {metodoPagoNombre.replace('_', ' ')}
            </small>
          )}
        </div>
        <button
          onClick={() => toggleAttendance(atleta.id, isPresent)}
          className={`${styles.attendanceToggle} ${
            isPresent ? styles.present : styles.absent
          }`}
        >
          {isPresent ? <FaCheck /> : <FaTimes />}
        </button>
      </div>
    );
  })
}
```

---

## 🎨 Estilos CSS Sugeridos

Agregar a `AsistenciasManager.module.css`:

```css
.paymentMethodSelector {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.paymentMethodSelector label {
  font-weight: 600;
  color: white;
}

.paymentSelect {
  flex: 1;
  padding: 0.5rem;
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 1rem;
}

.paymentSelect:focus {
  outline: none;
  border-color: #ffd700;
}

.metodoPago {
  display: block;
  font-size: 0.75rem;
  color: #ffc107;
  text-transform: capitalize;
  margin-top: 0.25rem;
}
```

---

## 📊 Consultas SQL Útiles

### Ver asistencias con método de pago

```sql
SELECT 
  a.fecha,
  s.id,
  u.nombre,
  u.apellido,
  pt.nombre as metodo_pago
FROM attendances a
JOIN students s ON a.student_id = s.id
JOIN users u ON s.user_id = u.id
LEFT JOIN payment_types pt ON a.metodo_pago_id = pt.id
ORDER BY a.fecha DESC, u.apellido;
```

### Estadísticas por método de pago

```sql
SELECT 
  pt.nombre as metodo_pago,
  COUNT(a.id) as total_asistencias,
  COUNT(DISTINCT a.student_id) as atletas_unicos
FROM payment_types pt
LEFT JOIN attendances a ON a.metodo_pago_id = pt.id
GROUP BY pt.id, pt.nombre
ORDER BY total_asistencias DESC;
```

### Asistencias sin método de pago registrado

```sql
SELECT 
  a.fecha,
  u.nombre,
  u.apellido
FROM attendances a
JOIN students s ON a.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE a.metodo_pago_id IS NULL
ORDER BY a.fecha DESC;
```

---

## ✅ Checklist de Implementación

- [ ] Ejecutar script SQL `restructure_payment_types.sql`
- [ ] Verificar que existan los 3 métodos de pago en la tabla
- [ ] Agregar estado `paymentTypes` y `selectedPaymentMethod`
- [ ] Crear función `loadPaymentTypes()`
- [ ] Modificar `toggleAttendance()` para incluir `metodo_pago_id`
- [ ] Agregar selector de método de pago en UI
- [ ] Actualizar componentes de atleta para mostrar método de pago
- [ ] Agregar estilos CSS
- [ ] Probar registro de asistencias con diferentes métodos
- [ ] Verificar que se guarde correctamente en la base de datos

---

## 🔄 Flujo de Uso

1. **Administrador abre AsistenciasManager**
2. **Selecciona fecha del entrenamiento**
3. **Selecciona método de pago** (mensualidad por defecto)
4. **Marca atletas presentes** → Se guarda con el método seleccionado
5. **Puede cambiar método de pago** para atletas específicos
6. **Sistema registra** `metodo_pago_id` en cada asistencia

---

## 💡 Ventajas del Nuevo Sistema

✅ **Control de pagos**: Saber exactamente cómo pagó cada atleta
✅ **Estadísticas**: Conocer qué método de pago es más usado
✅ **Auditoría**: Historial completo de métodos de pago por asistencia
✅ **Flexibilidad**: Cada asistencia puede tener un método diferente
✅ **Simplicidad**: Solo 3 opciones claras y fáciles de usar

---

## 🚀 Próximos Pasos Opcionales

1. **Reportes por método de pago**: Crear dashboard con estadísticas
2. **Validación de mensualidades**: Verificar que el atleta tenga mensualidad vigente
3. **Alertas**: Avisar si un atleta marca "mensualidad" pero no tiene pago activo
4. **Tarjetas de entrenamiento**: Descontar sesiones automáticamente si usa "tarjeta"

---

## 📞 Soporte

Si tienes dudas sobre la implementación, revisa:
- [README_DATABASE.md](README_DATABASE.md) - Documentación de base de datos
- `database/restructure_payment_types.sql` - Script de migración
- Consulta los ejemplos de código arriba

---

**¡Listo para implementar! 🏐**
