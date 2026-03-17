## ✅ Checklist de Optimización Móvil

- [ ] Scroll horizontal NO prohibido
- [ ] Botones ordenados por importancia (primario arriba)
- [ ] Animaciones suaves y no mareantes
- [ ] Loading states en todas las acciones async

---

## 📱 Navegación Móvil

### Sidebar → Bottom Nav en Móvil

**AdminPanel, StudentPanel, TrainerPanel:**

Implementación actual (✅ Ya hecho):
```css
@media (max-width: 480px) {
  .sidebar {
    width: 100%;
    height: auto;
    position: static; /* No sticky en móvil */
  }
  
  .menu {
    flex-direction: row;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding: 8px;
    gap: 4px;
  }
  
  .menuItem {
    flex-direction: column;
    min-width: 80px;
    text-align: center;
  }
}
```

### Breadcrumbs en Móvil

```css
@media (max-width: 480px) {
  .breadcrumb {
    font-size: 12px;
    max-width: 100%;
    overflow-x: auto;
    white-space: nowrap;
    padding: 8px 12px;
  }
  
  /* Ocultar breadcrumbs no críticos */
  .breadcrumb-item:not(:last-child):not(:first-child) {
    display: none;
  }
  
  .breadcrumb-item:not(:last-child)::after {
    content: "...";
  }
}
```

---

## 🖼️ Imágenes y Media

### Responsive Images
```css
img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* Avatar optimizado */
.avatar {
  width: 80px;
  height: 80px;
}

@media (max-width: 480px) {
  .avatar {
    width: 40px;
    height: 40px;
  }
}
```

### Iconos
```css
/* Desktop */
.icon {
  font-size: 1.5rem; /* 24px */
}

/* Mobile */
@media (max-width: 480px) {
  .icon {
    font-size: 1.3rem; /* ~21px - mejor para touch */
  }
  
  /* Iconos clickeables más grandes */
  .icon-button .icon {
    font-size: 1.5rem; /* 24px dentro de 48px touch target */
  }
}
```

---

## 🔄 Progressive Disclosure

Mostrar contenido de forma progresiva en móvil:

### Accordions para Contenido Extenso
```jsx
// Ejemplo: TestsFisicos en mobile
<div className="test-card">
  <header className="test-header" onClick={toggleExpand}>
    <h3>Salto Vertical</h3>
    <span className="result">45cm</span>
    <FaChevronDown className={expanded ? 'rotated' : ''} />
  </header>
  
  {expanded && (
    <div className="test-details">
      {/* Detalles completos */}
    </div>
  )}
</div>
```

### Tabs para Navegación de Contenido
```jsx
// Ejemplo: AsistenciasManager - Categorías
<div className="category-tabs mobile-scroll">
  <button className="tab">Sub-14</button>
  <button className="tab active">Sub-16</button>
  <button className="tab">Sub-18</button>
</div>
```

---

## 🎯 Priorización de Contenido

### Orden Visual en Móvil:

1. **Hero/Header** (50-70px):
   - Logo + título conciso
   - Acción primaria si aplica

2. **Stats principales** (si aplica):
   - Máximo 3-4 stats visibles
   - Single column layout

3. **Acción principal**:
   - CTA destacado
   - Full-width button

4. **Contenido principal**:
   - Lista/Grid de items
   - Infinite scroll o paginación

5. **Navegación** (sticky bottom):
   - 4-5 opciones máximo
   - Iconos + labels cortos

---

## 🎨 Dark Theme Optimizations

Nuestro proyecto usa dark theme, consideraciones:

### Colores Optimizados para OLED:
```css
:root {
  /* True black para OLED */
  --background-pure: #000000;
  --background-elevated: #0a0a0a;
  
  /* Surfaces con transparencia */
  --surface-lowest: rgba(255, 255, 255, 0.03);
  --surface-low: rgba(255, 255, 255, 0.05);
  --surface-mid: rgba(255, 255, 255, 0.08);
  --surface-high: rgba(255, 255, 255, 0.12);
  
  /* Evitar pure white (cansa la vista) */
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-tertiary: rgba(255, 255, 255, 0.5);
  
  /* Accent color - Gold altamente visible en dark */
  --accent: #ffd700;
  --accent-hover: #ffed4e;
}
```

### Shadows en Dark Theme:
```css
/* Shadows más sutiles en dark */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);

/* Glows para destacar en dark */
--glow-gold: 0 0 20px rgba(255, 215, 0, 0.3);
--glow-green: 0 0 20px rgba(32, 201, 151, 0.3);
```

---

## ⚡ Performance Optimizations

### CSS Optimizations:
```css
/* Use transform instead of positioning */
❌ .element { top: 10px; left: 10px; }
✅ .element { transform: translate(10px, 10px); }

/* Use transform for animations */
❌ .element { width: 100px; }
✅ .element { transform: scaleX(1); }

/* Will-change for known animations */
.animated-element {
  will-change: transform, opacity;
}

/* Remove will-change after animation */
.animated-element:not(.animating) {
  will-change: auto;
}
```

### Reduce Reflows:
```css
/* Batch DOM changes */
/* Use CSS Grid/Flexbox instead of calculating positions */
/* Use contain for isolated components */
.card {
  contain: layout style paint;
}
```

---

## 🐛 Common Mobile Issues & Solutions

### Issue 1: iOS Input Zoom
**Problema:** iOS hace zoom cuando tap en input <16px
**Solución:**
```css
input, select, textarea {
  font-size: 16px; /* Minimum */
}
```

### Issue 2: 300ms Click Delay
**Problema:** Touch events tienen delay
**Solución:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
```
```css
* {
  touch-action: manipulation; /* Removes delay */
}
```

### Issue 3: Hover States en Mobile
**Problema:** Estados hover quedan "pegados" en touch
**Solución:**
```css
/* Only apply hover on devices with hover capability */
@media (hover: hover) {
  .button:hover {
    background: gold;
  }
}

/* Or use :active for touch */
.button:active {
  background: gold;
}
```

### Issue 4: Fixed Elements con Virtual Keyboard
**Problema:** Keyboard cubre elementos fijos
**Solución:**
```css
@media (max-width: 480px) {
  .fixed-bottom {
    position: sticky; /* Instead of fixed */
    bottom: 0;
  }
  
  /* Or use JavaScript to adjust */
  /* window.visualViewport API */
}
```

### Issue 5: Notch/Safe Areas
**Problema:** Contenido tapado por notch
**Solución:**
```css
/* Already implemented in mobile-best-practices.css */
@supports (padding: max(0px)) {
  body {
    padding-top: max(0px, env(safe-area-inset-top));
    padding-bottom: max(0px, env(safe-area-inset-bottom));
  }
}
```

---

## 📊 Metrics to Track

### Core Web Vitals (Mobile):
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Mobile-Specific:
- Touch target hit rate: > 95%
- Scroll performance: 60fps
- Time to interactive: < 3s

---

## 🔍 Testing Checklist

### Dispositivos de Prueba:
- [ ] iPhone 14 Pro Max (430x932) - PRINCIPAL
- [ ] iPhone SE (375x667) - Pantalla pequeña
- [ ] Samsung Galaxy S21 (360x800) - Android referencia
- [ ] iPad (768x1024) - Tablet

### Scenarios de Prueba:
- [ ] Navegación completa sin scroll horizontal
- [ ] Todos los botones tocables con un dedo
- [ ] Formularios rellenables sin zoom
- [ ] Tablas legibles (modo card)
- [ ] Modales srolleable en contenido largo
- [ ] Performance 60fps en scroll
- [ ] Funciona sin conexión (si PWA)

### Orientaciones:
- [ ] Portrait (vertical) - Prioridad
- [ ] Landscape (horizontal) - Secundario

---

## 🎓 Resources & References

### Guías de Diseño:
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [Material Design Mobile](https://material.io/design)
- [WCAG 2.1 AAA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Tools:
- Chrome DevTools Device Mode
- Lighthouse Mobile Audit
- WebPageTest (Mobile)
- BrowserStack (Real devices)

### Performance:
- [web.dev/vitals](https://web.dev/vitals/)
- [PageSpeed Insights](https://pagespeed.web.dev/)

---

## 📝 Componentes Comunes Optimizados

Ver `/src/components/common/` para:
- `Button.js` - Botones con touch targets correctos
- `Input.js` - Inputs optimizados (16px, padding)
- `Modal.js` - Modal responsive
- `Card.js` - Cards responsive
- `LoadingSpinner.js` - Loading states
- `Toast.js` - Notificaciones móvil-friendly

---

## 🔄 Maintenance

### Cada Sprint:
1. Audit de touch targets (Chrome DevTools)
2. Performance audit (Lighthouse)
3. Visual regression testing
4. Actualizar este documento con nuevos learnings

### Antes de Deploy:
1. Test en device real (iPhone 14 Pro Max)
2. Test con slow 3G
3. Test con throttled CPU
4. Accessibility audit

---

**Última actualización:** Marzo 2026  
**Mantenido por:** Equipo de Desarrollo  
**Versión:** 1.0
