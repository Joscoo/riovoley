# 🚀 Guía de Implementación: WhatsApp Business API para Rio Voley

## 📋 **Resumen de la implementación**

Se ha implementado un sistema completo de WhatsApp Business API que:
- ✅ Envía mensajes automáticamente al registrar pagos
- ✅ Usa plantillas oficiales aprobadas por Meta
- ✅ Fallback automático a WhatsApp Web si no está configurado
- ✅ Botón manual para reenviar mensajes
- ✅ Manejo de errores y validaciones

---

## 🔧 **Pasos para configurar WhatsApp Business API**

### **1. Crear cuenta de WhatsApp Business**

1. Ve a [Meta Business Manager](https://business.facebook.com)
2. Crea una cuenta empresarial si no tienes
3. Agrega WhatsApp Business API desde "Todas las herramientas"

### **2. Configurar número de teléfono**

1. En Meta Business Manager > WhatsApp > Configuración
2. Agrega tu número de teléfono comercial
3. Verifica el número con el código SMS
4. Anota el **Phone Number ID** que aparece

### **3. Obtener credenciales**

**Access Token:**
- Ve a Meta Business Manager > WhatsApp > Configuración > Tokens de acceso
- Genera un token permanente
- **¡Importante!** Guarda este token de forma segura

**Business Account ID:**
- Ve a Meta Business Manager > Configuración empresarial
- Copia el ID de tu cuenta empresarial

### **4. Crear plantillas de mensajes**

Ve a Meta Business Manager > WhatsApp > Plantillas de mensajes y crea:

#### **Plantilla: confirmacion_pago**
```
Hola {{1}}, ¡tu pago ha sido registrado exitosamente! 🏐

💰 Monto: {{2}}
📅 Fecha: {{3}}  
🆔 Referencia: {{4}}
📋 Concepto: {{5}}

¡Gracias por tu pago! 🙌

Equipo Rio Voley 🏐
```

**Configuración:**
- Categoría: TRANSACTIONAL
- Idioma: Español (Argentina) - es_AR

#### **Plantilla: recordatorio_pago**
```
Hola {{1}}, te recordamos que tienes un pago pendiente 📋

💰 Monto: {{2}}
📅 Vencimiento: {{3}}
📋 Concepto: {{4}}

Para realizar el pago, puedes contactarnos o venir al club.

Equipo Rio Voley 🏐
```

**Configuración:**
- Categoría: MARKETING
- Idioma: Español (Argentina) - es_AR
- Botón: Call Phone (+5491123456789)

### **5. Configurar variables de entorno**

Crea o edita `.env.local` en la raíz del proyecto:

```env
# WhatsApp Business API
REACT_APP_WHATSAPP_ACCESS_TOKEN=tu_access_token_aqui
REACT_APP_WHATSAPP_PHONE_NUMBER_ID=123456789012345
REACT_APP_WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765

# Números del club
REACT_APP_CLUB_ADMIN_PHONE=5491123456789
REACT_APP_CLUB_COACH_PHONE=5491123456790
REACT_APP_CLUB_EMERGENCY_PHONE=5491123456791
```

### **6. Probar la configuración**

1. Reinicia la aplicación React
2. Ve a Admin Panel > Gestión de Pagos
3. Registra un pago para un usuario con teléfono
4. Verifica que se envíe automáticamente por WhatsApp Business

---

## 🔄 **Funcionamiento del sistema**

### **Envío automático al registrar pago:**
1. Se registra el pago en la base de datos
2. Se envía email de confirmación
3. **Si WhatsApp Business está configurado:**
   - Se envía mensaje automáticamente usando plantilla `confirmacion_pago`
   - Muestra ID del mensaje en confirmación
4. **Si no está configurado:**
   - Fallback a WhatsApp Web (abre navegador)
   - Pregunta al usuario si quiere enviar

### **Envío manual desde botón 📱:**
- Mismo proceso pero activado manualmente
- Útil para reenviar confirmaciones

---

## ⚠️ **Limitaciones y consideraciones**

### **Restricciones de WhatsApp Business:**
- **Plantillas requeridas:** Solo puedes enviar plantillas pre-aprobadas
- **Límite de mensajes:** 1000 mensajes gratis/mes, luego es pago
- **Aprobación:** Las plantillas deben ser aprobadas por Meta (24-48h)
- **Números verificados:** Solo puedes enviar a números que te han escrito primero (para MARKETING)

### **Tipos de plantillas:**
- **TRANSACTIONAL:** Para confirmaciones de pago (sin restricciones)
- **MARKETING:** Para promociones (requiere opt-in del usuario)
- **UTILITY:** Para notificaciones generales

### **Solución de problemas:**

**Error: "Template not found"**
- Verifica que la plantilla esté aprobada en Meta Business Manager
- Confirma que el nombre coincida exactamente

**Error: "Invalid phone number"**
- El número debe incluir código de país (54 para Argentina)
- Formato: 5491123456789

**Error: "Access token invalid"**
- Regenera el token en Meta Business Manager
- Actualiza la variable de entorno

---

## 📊 **Ventajas vs WhatsApp Web**

| Característica | WhatsApp Web | WhatsApp Business API |
|----------------|--------------|----------------------|
| **Automatización** | Manual (abre navegador) | Completamente automático |
| **Costo** | Gratis | 1000 gratis, luego pago |
| **Plantillas** | Mensaje libre | Solo plantillas aprobadas |
| **Escalabilidad** | Limitado | Ilimitado |
| **Confiabilidad** | Depende del navegador | API estable |
| **Tracking** | No | IDs de mensaje y estados |

---

## 🎯 **Próximos pasos recomendados**

1. **Configurar webhook** para recibir estados de mensajes
2. **Agregar recordatorios automáticos** de pagos vencidos
3. **Implementar mensajes de bienvenida** para nuevos miembros
4. **Analytics de mensajes** enviados y entregados

---

## 📞 **Soporte**

Para problemas con WhatsApp Business API:
- [Documentación oficial de Meta](https://developers.facebook.com/docs/whatsapp)
- [Centro de ayuda empresarial](https://business.facebook.com/help)

Para problemas con la implementación:
- Revisar logs en la consola del navegador
- Verificar variables de entorno
- Confirmar que las plantillas estén aprobadas