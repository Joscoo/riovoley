# Touch Target Audit - 48px Minimum Standard

## ✅ Objetivo
Todos los botones e elementos interactivos deben tener **mínimo 48x48px** en móvil (480px viewport).  
Estándar: WCAG AAA + Apple/Google Touch Guidelines.

---

## 🔴 CRÍTICO - Elementos <40px (Prioridad Alta)

### AsistenciasManager.module.css
- ❌ **Line 235-238**: `.clearSearch { width: 32px; height: 32px; }` → **DEBE SER 48px**
  - Uso: Botón para limpiar búsqueda
  - Impacto: Usado frecuentemente, difícil de tocar

### HorariosManager.module.css
- ❌ **Line 193-194**: `width: 20px; height: 20px;` → **CRÍTICO**
  - Uso: Probablemente icono clickeable
  - **URGENTE**: Revisar y aumentar a 48px o agregar padding

### HomePage.module.css
- ❌ **Line 254-255**: `width: 20px; height: 20px;` 
- ❌ **Line 295**: `width: 30px;`
  - Revisar si son elementos interactivos

### Horarios.module.css (Student/Viewer)
- ❌ **Line 259-260, 297-298, 332-333**: Múltiples `24px` y `20px`
  - Revisar funcionalidad y aumentar

---

## 🟡 IMPORTANTE - Elementos 30-40px (Prioridad Media)

### AsistenciasManager.module.css
- ⚠️ **Line 1117-1118**: `width: 40px; height: 40px;`
- ⚠️ **Line 1632-1633**: `width: 35px; height: 35px;`

### AtletasManager.module.css
- ⚠️ **Line 608-609**: `min-width: 40px; min-height: 40px;`
  - **EN MEDIA QUERY** → Debe ser 48px

### EntrenadoresManager.module.css
- ⚠️ **Line 273-274**: `width: 40px; height: 40px;`
  - Revisar si está en desktop o mobile

### AdminPanel.module.css
- ⚠️ **Line 23-24**: `width: 40px; height: 40px;`
- ⚠️ **Line 163**: `width: 30px;`
- ⚠️ **Line 304-305**: `width: 45px; height: 45px;` (MEDIA QUERY)
- ⚠️ **Line 423-424**: `width: 40px; height: 40px;` (MEDIA QUERY)

### AnunciosManager.module.css
- ⚠️ **Line 402-403**: `width: 35px; height: 35px;`

### AnunciosViewer.module.css
- ⚠️ **Line 59-60**: `width: 40px; height: 40px;`

### HorariosManager.module.css
- ⚠️ **Line 953-954**: `min-width: 40px; min-height: 40px;` (MEDIA QUERY)

### PagosManager.module.css
- ⚠️ **Line 1002-1003, 1016-1017**: `40px` (DESKTOP - probablemente OK)
- ✅ **Line 1058-1059**: Ya tiene 44px, **mejorar a 48px**

### Login.module.css
- ⚠️ **Line 689-690**: `width: 40px; height: 40px;` (MEDIA QUERY)
- ⚠️ **Line 728-729**: `width: 36px; height: 36px;` (MEDIA QUERY)

### Navbar.module.css
- ⚠️ **Line 416**: `height: 38px;`
- ✅ **Line 421-422**: Ya tiene 44px en media query

---

## 🟢 ACEPTABLE - Elementos 44-47px (Prioridad Baja)

Estos están cerca del estándar pero deberían subirse a 48px para consistencia:

### AnunciosManager.module.css
- 🔵 **Line 597-598, 628-629, 657-660**: `44px` → Mejorar a 48px

### AsistenciasManager.module.css
- 🔵 **Line 1330-1331**: `42px` → Mejorar a 48px
- 🔵 **Line 1557-1560**: `44px` → Mejorar a 48px

### HorariosManager.module.css
- 🔵 **Line 867-870**: `44px` → Mejorar a 48px

### Navbar.module.css
- 🔵 **Line 421-422**: `44px` → Mejorar a 48px

---

## ✅ EXCEPCIONES VÁLIDAS

Estos elementos NO necesitan ser 48px:

### LoadingSpinner.module.css
- ✅ **Line 41-42, 47-48**: `24px` y `40px`
  - Razón: No son elementos interactivos, son indicadores visuales
  - Acción: Ninguna

### Decorative Icons
- Icons dentro de botones que ya tienen 48px padding
- Badges, labels, indicators no clickeables
- Imágenes decorativas

---

## 📋 PLAN DE ACCIÓN

### Fase 1: CRÍTICOS (Inmediato)
1. [ ] AsistenciasManager clearSearch: 32px → 48px
2. [ ] HorariosManager: Auditar y corregir 20px elements
3. [ ] HomePage: Verificar elementos 20-30px
4. [ ] Horarios.module.css: Corregir 20-24px elements

### Fase 2: IMPORTANTES (Esta semana)
5. [ ] AtletasManager: 40px → 48px en media query
6. [ ] AdminPanel: 40px → 48px en media queries
7. [ ] AnunciosManager: 35px → 48px
8. [ ] EntrenadoresManager: 40px → 48px
9. [ ] HorariosManager: 40px → 48px en media query
10. [ ] Login: 36-40px → 48px en media queries
11. [ ] PagosManager: Verificar que todos sean 48px

### Fase 3: MEJORAS (Siguiente sprint)
12. [ ] Subir todos los 44px a 48px para consistencia
13. [ ] Subir 42px a 48px
14. [ ] Navbar: 44px → 48px

---

## 🛠️ CÓDIGO ESTÁNDAR

### Patrón para Botones Interactivos:
```css
@media (max-width: 480px) {
  .interactiveButton,
  .iconButton,
  .actionButton {
    min-width: 48px;
    min-height: 48px;
    width: 48px;  /* Si es square button */
    height: 48px; /* Si es square button */
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Para botones con texto */
  .textButton {
    min-height: 48px;
    padding: 12px 20px;
  }
}
```

### Patrón para Inputs:
```css
@media (max-width: 480px) {
  input,
  select,
  textarea {
    min-height: 48px;
    padding: 12px 16px;
    font-size: 16px; /* Previene iOS zoom */
  }
}
```

---

## 📊 ESTADÍSTICAS

- **Total elementos <48px encontrados**: ~100+
- **Críticos (<30px)**: ~15
- **Importantes (30-40px)**: ~40
- **Cerca del estándar (44px)**: ~20
- **Excepciones válidas (no interactivos)**: ~10

---

**Última actualización**: Marzo 2026  
**Responsable**: Equipo Mobile UX  
**Estándar**: WCAG AAA (48x48px minimum touch target)
