# 📱 Mobile UX Guidelines - Riovoley Project

## Implementación de Mejores Prácticas para Desarrollo Móvil

Este documento establece las pautas de diseño y desarrollo para garantizar una experiencia móvil óptima.

---

## 🎯 Principios Fundamentales

### 1. Mobile-First Approach
- Diseñar primero para móvil (430px viewport)
- Progressive enhancement para pantallas más grandes
- Contenido prioritario debe ser visible sin scroll

### 2. Touch-First Design
- TODOS los elementos interactivos: **mínimo 48x48px** (WCAG AAA)
- Espaciado entre elementos táctiles: mínimo 8px
- Feedback visual inmediato al tocar

### 3. Performance First
- Lazy loading de imágenes y componentes pesados
- Critical CSS inline
- Optimización de animaciones (usar transform/opacity)

---

## 📏 Sistema de Diseño

### Espaciado (8px Grid System)
```css
--space-xs:  8px   (0.5rem)
--space-sm:  12px  (0.75rem)
--space-md:  16px  (1rem)
--space-lg:  24px  (1.5rem)
--space-xl:  32px  (2rem)
--space-2xl: 48px  (3rem)
```

**✅ HACER:**
```css
.card { padding: var(--space-md); }
.header { gap: var(--space-lg); }
```

**❌ NO HACER:**
```css
.card { padding: 15px; } /* Usar 16px */
.header { gap: 20px; }   /* Usar 24px */
```

### Tipografía

#### Tamaños Mínimos en Móvil:
- **Body text:** 16px (1rem) - Previene zoom en iOS
- **Labels/Secondary:** 14px (0.875rem) - Mínimo legible
- **Captions:** 12px (0.75rem) - Solo para metadata

#### Line-Heights Requeridos:
```css
/* Headings */
h1, h2, h3, h4, h5, h6 {
  line-height: 1.3; /* Compacto pero legible */
}

/* Body text */
p, .description, .content {
  line-height: 1.6; /* Cómodo de leer */
}

/* UI elements (buttons, labels) */
button, label, .ui-text {
  line-height: 1.5; /* Balance entre compacto y legible */
}
```

### Touch Targets

#### Tamaños Recomendados:
```css
/* Botones primarios */
.primary-button {
  min-height: 48px;  /* Mínimo */
  min-height: 56px;  /* Recomendado */
}

/* Botones secundarios/iconos */
.icon-button {
  min-width: 48px;
  min-height: 48px;
}

/* Inputs */
input, select, textarea {
  min-height: 48px;
  font-size: 16px; /* ⚠️ CRÍTICO - Previene zoom iOS */
}

/* Checkboxes/Radio */
input[type="checkbox"], input[type="radio"] {
  width: 24px;
  height: 24px;
  /* Pero su área táctil debe ser 48x48px con padding */
}
```

---

## 📐 Layout Patterns

### Tablas en Móvil

**❌ NO:** Scroll horizontal
```css
.table {
  min-width: 800px;
  overflow-x: auto;
}
```

**✅ SÍ:** Conversión a cards/lista
```css
@media (max-width: 480px) {
  .table {
    display: block;
  }
  
  .table thead {
    display: none; /* Hide headers */
  }
  
  .table tbody {
    display: block;
  }
  
  .table tr {
    display: block;
    background: var(--color-surface);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
  }
  
  .table td {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
  }
  
  .table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--color-primary);
  }
}
```

### Modales en Móvil

**❌ NO:** Modales pequeños con padding
```css
.modal {
  width: 90%;
  margin: 20px;
}
```

**✅ SÍ:** Full-screen o Bottom Sheet
```css
@media (max-width: 480px) {
  /* Opción 1: Full-screen */
  .modal {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100vh;
    margin: 0;
    border-radius: 0;
  }
  
  /* Opción 2: Bottom Sheet (Preferido para forms) */
  .modal {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 90vh;
    border-radius: 16px 16px 0 0;
  }
}
```

### Formularios en Móvil

**Estructura Recomendada:**
```css
@media (max-width: 480px) {
  /* Siempre single column */
  .form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  /* Inputs cómodos */
  .form-input {
    min-height: 48px;
    padding: 14px 16px;
    font-size: 16px; /* ⚠️ Crítico */
    line-height: 1.5;
  }
  
  /* Labels claros */
  .form-label {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--color-primary);
  }
  
  /* Botones apilados */
  .form-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .form-button {
    width: 100%;
    min-height: 48px;
  }
}
```

---

## 🎨 Mejoras Visuales

### Jerarquía Clara

1. **Primario (Mas importante):**
   - Color: Gold (#ffd700)
   - Size: Más grande
   - Weight: Bold
   - Position: Top/Center

2. **Secundario:**
   - Color: White 70% opacity
   - Size: Medium
   - Weight: Semi-bold

3. **Terciario:**
   - Color: White 50% opacity
   - Size: Small
   - Weight: Normal

### Contraste

Cumplir WCAG AA mínimo:
- Texto normal: 4.5:1
- Texto grande (18px+): 3:1
- UI elements: 3:1

```css
/* ✅ Buen contraste en dark theme */
.text-primary { color: #ffffff; }  /* White on dark */
.text-secondary { color: rgba(255, 255, 255, 0.7); }
.accent { color: #ffd700; } /* Gold - altamente visible */

/* ❌ Mal contraste */
.text-bad { color: #666; } /* Gris en dark = barely visible */
```

### Feedback Visual

Todo elemento interactivo debe tener:

1. **Hover (desktop)**
```css
.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
```

2. **Active (touch)**
```css
.button:active {
  transform: scale(0.97);
}
```

3. **Focus (keyboard)**
```css
.button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

4. **Disabled**
```css
.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

---

## 🚀 Estados de Carga

### Skeleton Screens (Preferido)
```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.05) 0%,
    rgba(255,255,255,0.1) 50%,
    rgba(255,255,255,0.05) 100%
  );
  background-size: 200% 100%;
  animation: skeleton 1.5s ease-in-out infinite;
}

@keyframes skeleton {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Loading Spinners
Solo para acciones rápidas (<2 segundos esperados)

---

## ♿ Accesibilidad

### Checklist Esencial:

- [ ] Touch targets ≥ 48x48px
- [ ] Inputs font-size ≥ 16px (iOS)
- [ ] Contraste ≥ 4.5:1 (texto normal)
- [ ] Focus visible en todos los elementos interactivos
- [ ] Textos alternativos en imágenes
- [ ] Labels en todos los inputs
- [ ] ARIA labels donde sea necesario
- [ ] Navegación por teclado funcional
- [ ] Sin dependencia de hover (mobile-first)