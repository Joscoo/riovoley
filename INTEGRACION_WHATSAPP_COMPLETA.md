# 📱 Guía Completa: Integración WhatsApp para Rio Voley

## ✅ Estado Actual

**Ya implementado:**
- ✅ Servicio WhatsApp Business (`whatsappBusinessService.js`)
- ✅ Envío de confirmaciones de pago en `PagosManager`
- ✅ Formateo automático de números argentinos
- ✅ Plantillas: `confirmacion_pago`, `recordatorio_pago`, `bienvenida_club`, `suspension_cuenta`

**Por implementar:**
- ⚠️ Envío de credenciales de acceso
- ⚠️ Configuración de variables de entorno
- ⚠️ Creación de plantillas en Meta Business Manager

---

## 🚀 Pasos para Completar la Integración

### **PASO 1: Crear Cuenta WhatsApp Business API**

1. Ve a [Meta Business Manager](https://business.facebook.com)
2. Crea cuenta empresarial (si no tienes)
3. Navega a **Todas las herramientas** > **WhatsApp**
4. Click en **Comenzar**

### **PASO 2: Configurar Número de Teléfono**

1. En WhatsApp > **Configuración**
2. Click **Agregar número de teléfono**
3. Verifica tu número comercial con SMS
4. **COPIA estos valores:**
   - ✏️ **Phone Number ID**: `___________________`
   - ✏️ **Business Account ID**: `___________________`

### **PASO 3: Generar Access Token**

1. Ve a **Configuración** > **Tokens de acceso**
2. Click **Generar token permanente**
3. Selecciona permisos: `whatsapp_business_messaging`, `whatsapp_business_management`
4. **COPIA el token (solo se muestra una vez):**
   - ✏️ **Access Token**: `___________________`

### **PASO 4: Crear Plantillas de Mensajes**

Ve a **WhatsApp** > **Plantillas de mensajes** y crea estas 2 plantillas:

---

#### 📋 **Plantilla 1: Confirmación de Pago** (Ya lista para usar)

**Nombre:** `confirmacion_pago`  
**Categoría:** TRANSACTIONAL  
**Idioma:** Español (es_AR)

**Body:**
```
Hola {{1}}, ¡tu pago ha sido registrado exitosamente! 🏐

💰 Monto: {{2}}
📅 Fecha: {{3}}  
🆔 Referencia: {{4}}
📋 Concepto: {{5}}

¡Gracias por tu pago! 🙌
```

**Footer:** `Equipo Rio Voley 🏐`

---

#### 🔑 **Plantilla 2: Envío de Credenciales** (NUEVA)

**Nombre:** `credenciales_acceso`  
**Categoría:** UTILITY  
**Idioma:** Español (es_AR)

**Body:**
```
Hola {{1}}, ¡bienvenido/a a Rio Voley! 🏐

Tus credenciales de acceso a la plataforma:

📧 Email: {{2}}
🔑 Contraseña: {{3}}

Accede en: https://riovoley.app

⚠️ Te recomendamos cambiar tu contraseña al iniciar sesión.
```

**Footer:** `Equipo Rio Voley 🏐`

---

#### 📅 **Plantilla 3: Recordatorio de Pago** (Ya lista para usar)

**Nombre:** `recordatorio_pago`  
**Categoría:** MARKETING  
**Idioma:** Español (es_AR)

**Body:**
```
Hola {{1}}, te recordamos que tienes un pago pendiente 📋

💰 Monto: {{2}}
📅 Vencimiento: {{3}}
📋 Concepto: {{4}}

Para realizar el pago, puedes contactarnos o venir al club.
```

**Footer:** `Equipo Rio Voley 🏐`  
**Botón:** Call Phone `+549XXXXXXXXXX` (tu número del club)

---

### **PASO 5: Configurar Variables de Entorno**

Crea el archivo `.env.local` en la raíz del proyecto:

```env
# ========================================
# WhatsApp Business API - Meta Cloud API
# ========================================

# Access Token (del PASO 3)
REACT_APP_WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxx

# Phone Number ID (del PASO 2)
REACT_APP_WHATSAPP_PHONE_NUMBER_ID=123456789012345

# Business Account ID (del PASO 2)
REACT_APP_WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765

# ========================================
# Números de Contacto del Club
# ========================================

# Número principal (administración)
REACT_APP_CLUB_ADMIN_PHONE=5491123456789

# Número de entrenadores
REACT_APP_CLUB_COACH_PHONE=5491123456790

# Número de emergencias
REACT_APP_CLUB_EMERGENCY_PHONE=5491123456791
```

**⚠️ IMPORTANTE:**
- Nunca subas `.env.local` a Git
- Ya está en `.gitignore`
- Formato números: `5491123456789` (sin +, sin espacios, sin guiones)

---

### **PASO 6: Actualizar el Código**

Los archivos que se van a actualizar:

1. ✅ `src/services/whatsappBusinessService.js` - Agregar método `sendCredentials()`
2. ✅ `src/components/admin/AtletasManager.js` - Integrar envío al reenviar credenciales

---

### **PASO 7: Reiniciar y Probar**

```bash
# Detener la app (Ctrl+C en la terminal)
# Reiniciar para cargar variables de entorno
npm start
```

**Pruebas:**
1. **Credenciales:** Gestión de Atletas > Click "Reenviar credenciales" en un atleta con teléfono
2. **Pago:** Gestión de Pagos > Registrar pago para usuario con teléfono
3. **Verificar:** Revisa la consola para ver logs de envío

---

## 🔍 Verificar Configuración

Puedes verificar si está todo configurado correctamente:

```javascript
// En la consola del navegador (F12)
const whatsapp = new WhatsAppBusinessService();
const validation = whatsapp.validateConfiguration();
console.log('Configuración WhatsApp:', validation);
```

Debe retornar:
```json
{
  "isValid": true,
  "issues": []
}
```

---

## 📊 Casos de Uso

### **1. Registrar Pago → Envía WhatsApp automáticamente**
```
Usuario registra pago → Sistema envía:
"Hola Juan, ¡tu pago ha sido registrado exitosamente! 🏐
💰 Monto: $5000
📅 Fecha: 30/01/2026
..."
```

### **2. Crear Atleta → Envía credenciales por WhatsApp**
```
Admin crea atleta → Sistema envía:
"Hola María, ¡bienvenido/a a Rio Voley! 🏐
📧 Email: maria@gmail.com
🔑 Contraseña: Temp1234
..."
```

### **3. Reenviar Credenciales → WhatsApp + Email**
```
Admin reenvía credenciales → Sistema envía:
- Email con credenciales
- WhatsApp con credenciales (si tiene teléfono)
```

---

## 🛠️ Solución de Problemas

### Error: "Configuración de WhatsApp Business incompleta"
✅ Verifica que `.env.local` esté en la raíz del proyecto  
✅ Reinicia la app después de crear/editar `.env.local`  
✅ Verifica que las variables empiecen con `REACT_APP_`

### Error: "Template not found"
✅ Crea la plantilla en Meta Business Manager  
✅ Espera aprobación (puede tardar 10-30 minutos)  
✅ Verifica que el nombre sea exacto: `credenciales_acceso`, `confirmacion_pago`

### Número no recibe mensajes
✅ Formato: `5491123456789` (código país + 9 + número)  
✅ Verifica en Meta Business Manager > WhatsApp > Mensajes enviados  
✅ El destinatario debe tener WhatsApp instalado

### Plantilla rechazada
✅ No uses URLs acortadas o sospechosas  
✅ Categoría correcta: UTILITY para credenciales, TRANSACTIONAL para pagos  
✅ No incluyas links de terceros sin aprobación

---

## 📞 Próximos Pasos

Después de configurar:
1. ✅ Prueba envío de credenciales
2. ✅ Prueba confirmación de pago
3. ⚠️ Implementar recordatorios automáticos de pago (próxima feature)
4. ⚠️ Dashboard de mensajes enviados (próxima feature)

---

## 📚 Referencias

- [Meta WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Crear plantillas de mensajes](https://business.facebook.com/wa/manage/message-templates/)
- [Meta Business Manager](https://business.facebook.com)
