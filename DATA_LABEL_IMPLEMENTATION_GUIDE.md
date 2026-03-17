# 📋 Guía de Implementación: data-label Attributes

## 🎯 Objetivo

Agregar atributos `data-label` a todas las celdas `<td>` en tablas para que la conversión table-to-card en móvil muestre los nombres de las columnas.

---

## 📁 Archivos que Necesitan Modificación

### 1. AsistenciasManager.js
**Ubicación**: `src/components/admin/AsistenciasManager.js`

**Tablas Afectadas**:
- Tabla principal de asistencias por atleta
- Posiblemente tablas de reportes

**Patrón ANTES**:
```jsx
<tr key={atleta.id}>
  <td>
    <div className={styles.atletaCell}>
      <strong>{atleta.nombre}</strong>
      <small>{atleta.categoria}</small>
    </div>
  </td>
  <td>{atleta.asistencias}</td>
  <td>
    <span className={styles.statusBadge}>{atleta.status}</span>
  </td>
  <td>
    <div className={styles.actions}>
      <button className={styles.attendanceButton}>
        Presente
      </button>
    </div>
  </td>
</tr>
```

**Patrón DESPUÉS**:
```jsx
<tr key={atleta.id}>
  <td data-label="Atleta">
    <div className={styles.atletaCell}>
      <strong>{atleta.nombre}</strong>
      <small>{atleta.categoria}</small>
    </div>
  </td>
  <td data-label="Asistencias">{atleta.asistencias}</td>
  <td data-label="Estado">
    <span className={styles.statusBadge}>{atleta.status}</span>
  </td>
  <td data-label="Acciones">
    <div className={styles.actions}>
      <button className={styles.attendanceButton}>
        Presente
      </button>
    </div>
  </td>
</tr>
```

**Nombres de Columnas Sugeridos**:
- Primera columna (nombre): `"Atleta"` o `"Nombre"`
- Categoría: `"Categoría"`
- Asistencias/estadísticas: `"Asistencias"`, `"Total"`, `"Porcentaje"`
- Estado: `"Estado"` o `"Status"`
- Fecha: `"Fecha"`
- Acciones: `"Acciones"` o dejar vacío con `data-label=""`

---

### 2. EntrenadoresManager.js
**Ubicación**: `src/components/admin/EntrenadoresManager.js`

**Tablas Afectadas**:
- Tabla de entrenadores

**Patrón Típico**:
```jsx
<tbody>
  {entrenadores.map(entrenador => (
    <tr key={entrenador.id}>
      <td>
        <div className={styles.nameCell}>
          <strong>{entrenador.nombre}</strong>
          {entrenador.ultimo_acceso ? (
            <span className={styles.lastLogin}>
              Último acceso: {formatDate(entrenador.ultimo_acceso)}
            </span>
          ) : (
            <span className={styles.neverLoggedIn}>
              Nunca ha ingresado
            </span>
          )}
        </div>
      </td>
      <td>{entrenador.email}</td>
      <td>{entrenador.categorias?.join(', ') || 'Sin categoría'}</td>
      <td>
        <div className={styles.actions}>
          <button className={styles.editButton}>
            <FaEdit />
          </button>
          <button className={styles.deleteButton}>
            <FaTrash />
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
```

**Patrón CON data-label**:
```jsx
<tbody>
  {entrenadores.map(entrenador => (
    <tr key={entrenador.id}>
      <td data-label="Entrenador">
        <div className={styles.nameCell}>
          <strong>{entrenador.nombre}</strong>
          {entrenador.ultimo_acceso ? (
            <span className={styles.lastLogin}>
              Último acceso: {formatDate(entrenador.ultimo_acceso)}
            </span>
          ) : (
            <span className={styles.neverLoggedIn}>
              Nunca ha ingresado
            </span>
          )}
        </div>
      </td>
      <td data-label="Email">{entrenador.email}</td>
      <td data-label="Categorías">{entrenador.categorias?.join(', ') || 'Sin categoría'}</td>
      <td data-label="Acciones">
        <div className={styles.actions}>
          <button className={styles.editButton}>
            <FaEdit />
          </button>
          <button className={styles.deleteButton}>
            <FaTrash />
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
```

**Nombres de Columnas Sugeridos**:
- `"Entrenador"` o `"Nombre"`
- `"Email"`
- `"Categorías"` o `"Grupos"`
- `"Acciones"` o `""`

---

### 3. PagosManager.js
**Ubicación**: `src/components/admin/PagosManager.js`

**Tablas Afectadas**:
- Tabla principal de pagos

**Patrón Ejemplo**:
```jsx
<tbody>
  {pagos.map(pago => (
    <tr key={pago.id} className={styles.tableRow}>
      <td>
        <div className={styles.atletaInfo}>
          <strong>{pago.atleta_nombre}</strong>
          <small>{pago.categoria}</small>
        </div>
      </td>
      <td className={styles.monto}>
        ${pago.monto.toFixed(2)}
      </td>
      <td>{formatDate(pago.fecha_vencimiento)}</td>
      <td>{formatDate(pago.fecha_pago)}</td>
      <td>
        <span className={`${styles.statusBadge} ${styles[pago.status]}`}>
          {pago.status}
        </span>
      </td>
      <td>
        <div className={styles.actions}>
          <button className={styles.paidButton}>
            <FaCheck />
          </button>
          <button className={styles.editButton}>
            <FaEdit />
          </button>
          <button className={styles.deleteButton}>
            <FaTrash />
          </button>
          <button className={styles.whatsappButton}>
            <FaWhatsapp />
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
```

**Patrón CON data-label**:
```jsx
<tbody>
  {pagos.map(pago => (
    <tr key={pago.id} className={styles.tableRow}>
      <td data-label="Atleta">
        <div className={styles.atletaInfo}>
          <strong>{pago.atleta_nombre}</strong>
          <small>{pago.categoria}</small>
        </div>
      </td>
      <td data-label="Monto" className={styles.monto}>
        ${pago.monto.toFixed(2)}
      </td>
      <td data-label="Vencimiento">{formatDate(pago.fecha_vencimiento)}</td>
      <td data-label="Pago">{formatDate(pago.fecha_pago)}</td>
      <td data-label="Estado">
        <span className={`${styles.statusBadge} ${styles[pago.status]}`}>
          {pago.status}
        </span>
      </td>
      <td data-label="Acciones">
        <div className={styles.actions}>
          <button className={styles.paidButton}>
            <FaCheck />
          </button>
          <button className={styles.editButton}>
            <FaEdit />
          </button>
          <button className={styles.deleteButton}>
            <FaTrash />
          </button>
          <button className={styles.whatsappButton}>
            <FaWhatsapp />
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
```

**Nombres de Columnas Sugeridos**:
- `"Atleta"` o `"Nombre"`
- `"Monto"` o `"Valor"`
- `"Vencimiento"` o `"Fecha Venc."`
- `"Pago"` o `"Fecha Pago"`
- `"Estado"` o `"Status"`
- `"Acciones"` o `""`

---

## 🔍 Cómo Encontrar las Tablas

### Método 1: Búsqueda por Patrón
```bash
# En terminal (PowerShell)
Get-ChildItem -Path "src/components" -Recurse -Filter "*.js" | Select-String "<tbody>" -Context 2,5
```

### Método 2: VS Code Search
1. Presiona `Ctrl+Shift+F`
2. Busca: `<tbody>`
3. Incluye: `src/components/**/*.js`
4. Revisa cada resultado

### Método 3: Grep en VS Code
1. Usa la extensión de búsqueda
2. Patrón regex: `<tr.*key=.*>`
3. Archivos: Manager components

---

## ✅ Checklist de Implementación

### AsistenciasManager.js:
- [ ] Identificar todas las tablas `<table>` en el archivo
- [ ] Para cada tabla, identificar las columnas del `<thead>`
- [ ] Agregar `data-label` a cada `<td>` en `<tbody>` correspondiente
- [ ] Probar en viewport 430px (iPhone 14 Pro Max)
- [ ] Verificar que los labels aparecen correctamente en mobile

### EntrenadoresManager.js:
- [ ] Ubicar tabla de entrenadores
- [ ] Columnas típicas: Nombre, Email, Categorías, Último acceso, Acciones
- [ ] Agregar data-labels correspondientes
- [ ] Probar hover effects en cards móviles
- [ ] Verificar touch targets de botones (deben ser 48px)

### PagosManager.js:
- [ ] Ubicar tabla principal de pagos
- [ ] Columnas: Atleta, Monto, Vencimiento, Fecha Pago, Estado, Acciones
- [ ] Agregar data-labels
- [ ] Verificar que el monto destaca en mobile (font-size 1.3rem en CSS)
- [ ] Probar los 4 botones de acción (touch targets 48px)

---

## 🧪 Testing Post-Implementación

### Pruebas en DevTools:
1. **Abrir Chrome DevTools**
2. **Device Mode**: iPhone 14 Pro Max (430x932)
3. **Navegar** a cada manager component
4. **Verificar**:
   - ✅ Sin scroll horizontal
   - ✅ Cards se ven como tarjetas independientes
   - ✅ Labels (en dorado #ffd700) aparecen a la izquierda
   - ✅ Data aparece a la derecha
   - ✅ Hover effects funcionan (translateY(-2px))
   - ✅ Touch targets son grandes (48x48px)

### Pruebas Visuales:
```
ANTES (con scroll):
┌─────────────────────────────────────────────┐
│ [←─────── Tabla muy ancha ──────────→]     │
│                                       scroll│
└─────────────────────────────────────────────┘

DESPUÉS (cards):
┌─────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════╗  │
│ ║ ATLETA:           Juan Pérez          ║  │
│ ║ ASISTENCIAS:      15/20               ║  │
│ ║ ESTADO:           [Activo]            ║  │
│ ║ ACCIONES:         [Presente] [Editar] ║  │
│ ╚═══════════════════════════════════════╝  │
│                                             │
│ ╔═══════════════════════════════════════╗  │
│ ║ ATLETA:           María López         ║  │
│ ║ ...                                   ║  │
│ ╚═══════════════════════════════════════╝  │
└─────────────────────────────────────────────┘
```

---

## 🚨 Common Pitfalls

### ❌ Error 1: Olvidar data-label en algunas celdas
```jsx
<td>Contenido</td>  <!-- SIN data-label -->
```
**Resultado**: Celda aparece sin label en mobile, confusa para el usuario

**Solución**: Agregar `data-label` incluso si es vacío: `data-label=""`

### ❌ Error 2: Labels muy largos
```jsx
<td data-label="Fecha de último acceso al sistema">...</td>
```
**Resultado**: Label ocupa demasiado espacio, breaks layout

**Solución**: Usar labels cortos: `data-label="Último acceso"`

### ❌ Error 3: No probar con datos reales
**Resultado**: Layout funciona con datos cortos pero breaks con nombres largos

**Solución**: Probar con nombres como "María Fernanda Pérez de González"

### ❌ Error 4: Labels inconsistentes
```jsx
/* Tabla 1 */
<td data-label="Nombre">...</td>

/* Tabla 2 en el mismo componente */
<td data-label="Atleta">...</td>
```
**Resultado**: Inconsistencia confunde al usuario

**Solución**: Mantener labels consistentes en todo el componente

---

## 📖 Recursos Adicionales

### CSS Ya Implementado:
- `AsistenciasManager.module.css` - líneas 780-900 aprox (table-to-card)
- `EntrenadoresManager.module.css` - líneas 505-590 aprox
- `PagosManager.module.css` - líneas 1020-1130 aprox

### Patrones CSS Relevantes:
```css
/* El ::before que usa el data-label */
.table tbody td::before {
  content: attr(data-label);  /* ← Toma el valor del atributo */
  font-weight: 600;
  color: #ffd700;
  text-transform: uppercase;
  font-size: 0.75rem;
  width: 120px;
}
```

---

## 🎯 Resultado Esperado

Después de implementar los data-labels:

✅ **AsistenciasManager**: Tabla de asistencias se convierte en cards en 430px  
✅ **EntrenadoresManager**: Tabla de entrenadores se convierte en cards en 430px  
✅ **PagosManager**: Tabla de pagos se convierte en cards en 430px  

**User Experience**:
- Scroll vertical natural (como Instagram/Twitter)
- Zero scroll horizontal
- Fácil de escanear visualmente
- Touch targets grandes y accesibles
- Experiencia comparable a app nativa

---

**Estimación de tiempo**: 1-2 horas para implementar todos los componentes  
**Prioridad**: Alta  
**Dependencias**: Ninguna (CSS ya está listo)

