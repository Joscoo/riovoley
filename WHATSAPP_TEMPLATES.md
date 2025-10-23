# Plantillas de WhatsApp Business para Rio Voley

## 🏗️ **Plantillas que debes crear en Meta Business Manager**

### 1. **Confirmación de Pago**
- **Nombre:** `confirmacion_pago`
- **Categoría:** TRANSACTIONAL
- **Idioma:** Español (Argentina) - es_AR

**Header:** Ninguno

**Body:**
```
Hola {{1}}, ¡tu pago ha sido registrado exitosamente! 🏐

💰 Monto: {{2}}
📅 Fecha: {{3}}  
🆔 Referencia: {{4}}
📋 Concepto: {{5}}

¡Gracias por tu pago! 🙌
```

**Footer:** 
```
Equipo Rio Voley 🏐
```

**Buttons:** Ninguno

---

### 2. **Recordatorio de Pago**
- **Nombre:** `recordatorio_pago`
- **Categoría:** MARKETING
- **Idioma:** Español (Argentina) - es_AR

**Header:** Ninguno

**Body:**
```
Hola {{1}}, te recordamos que tienes un pago pendiente 📋

💰 Monto: {{2}}
📅 Vencimiento: {{3}}
📋 Concepto: {{4}}

Para realizar el pago, puedes contactarnos o venir al club.
```

**Footer:** 
```
Equipo Rio Voley 🏐
```

**Buttons:** 
- Call Phone: +5491123456789 (número del club)

---

### 3. **Bienvenida al Club**
- **Nombre:** `bienvenida_club`
- **Categoría:** UTILITY
- **Idioma:** Español (Argentina) - es_AR

**Header:** Media > Image (subir logo del club)

**Body:**
```
¡Bienvenido/a al Club Rio Voley, {{1}}! 🏐

Estamos emocionados de tenerte como parte de nuestra familia deportiva. 

📋 Tu categoría: {{2}}
📅 Inicio: {{3}}

¡Prepárate para vivir la pasión del voley!
```

**Footer:** 
```
Equipo Rio Voley 🏐
```

**Buttons:** Ninguno

---

### 4. **Suspensión de Cuenta**
- **Nombre:** `suspension_cuenta`
- **Categoría:** UTILITY
- **Idioma:** Español (Argentina) - es_AR

**Body:**
```
Hola {{1}}, te informamos que tu cuenta ha sido suspendida temporalmente.

⚠️ Motivo: {{2}}
📅 Hasta: {{3}}

Para más información, contacta con administración.
```

**Footer:** 
```
Equipo Rio Voley 🏐
```

**Buttons:** 
- Call Phone: +5491123456789

---

### 5. **Reactivación de Cuenta**
- **Nombre:** `reactivacion_cuenta`
- **Categoría:** UTILITY
- **Idioma:** Español (Argentina) - es_AR

**Body:**
```
¡Excelentes noticias {{1}}! 🎉

Tu cuenta ha sido reactivada y ya puedes acceder a todos los servicios del club.

¡Te esperamos en las canchas! 🏐
```

**Footer:** 
```
Equipo Rio Voley 🏐
```

**Buttons:** Ninguno

---

## 📋 **Pasos para crear las plantillas:**

1. **Ve a Meta Business Manager** (business.facebook.com)
2. **Selecciona tu cuenta empresarial**
3. **Ve a WhatsApp > Message Templates**
4. **Haz clic en "Create Template"**
5. **Copia el contenido exacto de cada plantilla**
6. **Envía para aprobación**

⚠️ **Importante:** 
- Las plantillas deben ser aprobadas por Meta antes de usarse
- El proceso de aprobación puede tomar 24-48 horas
- Los parámetros `{{1}}`, `{{2}}`, etc. son reemplazados automáticamente por el código

## 🔗 **Variables que corresponden a cada parámetro:**

### Confirmación de Pago:
- {{1}} = Nombre del estudiante
- {{2}} = Monto ($1000)
- {{3}} = Fecha (23/10/2025)
- {{4}} = Referencia (#123)
- {{5}} = Concepto (Mensualidad Club de Voley)

### Recordatorio de Pago:
- {{1}} = Nombre del estudiante
- {{2}} = Monto ($1000)
- {{3}} = Fecha vencimiento
- {{4}} = Concepto de la deuda