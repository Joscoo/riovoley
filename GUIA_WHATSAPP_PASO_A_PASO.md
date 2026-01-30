# 🚀 Configuración WhatsApp Business - Guía Paso a Paso

## 📌 Lo que vamos a hacer

Configurar WhatsApp Business API para enviar automáticamente:
- 🔑 **Credenciales** cuando crees/reenvíes acceso a atletas
- 💰 **Confirmaciones de pago** cuando registres mensualidades

---

## PASO 1: Crear Cuenta Meta Business Manager

### 1.1 Ir a Meta Business Manager
👉 Abre: **https://business.facebook.com**

### 1.2 Crear Cuenta Empresarial
- Click en **"Crear cuenta"** (arriba derecha)
- Completa:
  - **Nombre del negocio:** Rio Voley Club
  - **Tu nombre:** [Tu nombre]
  - **Email empresarial:** [Tu email]
- Click **"Siguiente"**
- Completa la verificación

### 1.3 Acceder a WhatsApp
- En el menú lateral izquierdo, busca **"Todas las herramientas"**
- Click en **"WhatsApp"**
- Click en **"Comenzar"**

---

## PASO 2: Configurar Número de Teléfono

### 2.1 Agregar Número
- En WhatsApp > Click **"Agregar número de teléfono"**
- Selecciona país: **Ecuador** (o el que corresponda)
- Ingresa tu número de teléfono **COMERCIAL** del club
  - ⚠️ **IMPORTANTE:** NO uses número personal, usa el del club
  - Formato: 0991234567

### 2.2 Verificar Número
- Recibirás un **código SMS**
- Ingresa el código
- Click **"Verificar"**

### 2.3 **COPIAR Phone Number ID**
Después de verificar, verás una pantalla con:
```
Phone Number ID: 123456789012345
```

**✏️ COPIA este número AHORA:**
```
Phone Number ID: _________________________________
```

---

## PASO 3: Obtener Credenciales API

### 3.1 Ir a Configuración
- En WhatsApp, click **"Configuración"** (arriba derecha)
- O ve a: WhatsApp > Configuración

### 3.2 Generar Token Permanente
- Busca sección **"Tokens de acceso"**
- Click **"Generar token"**
- Selecciona permisos:
  - ✅ `whatsapp_business_messaging`
  - ✅ `whatsapp_business_management`
- **Duración:** Selecciona **"Nunca caduca"** (permanente)
- Click **"Generar"**

### 3.3 **COPIAR Access Token**
⚠️ **MUY IMPORTANTE:** El token solo se muestra UNA VEZ

**✏️ COPIA el token AHORA:**
```
Access Token: _________________________________
```

### 3.4 **COPIAR Business Account ID**
- Ve a **Configuración empresarial** (menú lateral)
- Copia el **ID de cuenta empresarial**

**✏️ COPIA el ID AHORA:**
```
Business Account ID: _________________________________
```

---

## PASO 4: Crear Plantilla "Credenciales de Acceso"

### 4.1 Ir a Plantillas
- En WhatsApp, click **"Plantillas de mensajes"**
- Click **"Crear plantilla"**

### 4.2 Configurar Plantilla
**Nombre:** `credenciales_acceso`

**Categoría:** Selecciona **"UTILITY"** (Utilidad)

**Idioma:** **Español**

### 4.3 Configurar Contenido

**Header (Encabezado):** Déjalo en **"Ninguno"**

**Body (Cuerpo):** Copia EXACTAMENTE esto:
```
Hola {{1}}, ¡bienvenido/a a Rio Voley! 🏐

Tus credenciales de acceso a la plataforma:

📧 Email: {{2}}
🔑 Contraseña: {{3}}

Accede en: https://riovoley.app

⚠️ Te recomendamos cambiar tu contraseña al iniciar sesión.
```

**Footer (Pie de página):** 
```
Equipo Rio Voley 🏐
```

**Buttons (Botones):** **Ninguno**

### 4.4 Enviar para Aprobación
- Click **"Enviar"**
- Espera aprobación (10-30 minutos normalmente)

---

## PASO 5: Crear Plantilla "Confirmación de Pago"

### 5.1 Crear Nueva Plantilla
- Click **"Crear plantilla"** nuevamente

### 5.2 Configurar Plantilla
**Nombre:** `confirmacion_pago`

**Categoría:** **"TRANSACTIONAL"** (Transaccional)

**Idioma:** **Español**

### 5.3 Configurar Contenido

**Header:** **"Ninguno"**

**Body:** Copia EXACTAMENTE:
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

**Buttons:** **Ninguno**

### 5.4 Enviar para Aprobación
- Click **"Enviar"**
- Espera aprobación

---

## PASO 6: Configurar Variables de Entorno

### 6.1 Crear archivo .env.local
En VS Code:
- Click derecho en la carpeta raíz del proyecto
- **"Nuevo archivo"**
- Nombra: `.env.local`

### 6.2 Copiar Contenido
Copia EXACTAMENTE esto en `.env.local`:

```env
# WhatsApp Business API
REACT_APP_WHATSAPP_ACCESS_TOKEN=PEGA_AQUI_TU_ACCESS_TOKEN
REACT_APP_WHATSAPP_PHONE_NUMBER_ID=PEGA_AQUI_TU_PHONE_NUMBER_ID
REACT_APP_WHATSAPP_BUSINESS_ACCOUNT_ID=PEGA_AQUI_TU_BUSINESS_ACCOUNT_ID

# Números del club (formato: 593991234567)
REACT_APP_CLUB_ADMIN_PHONE=593991234567
REACT_APP_CLUB_COACH_PHONE=593991234567
REACT_APP_CLUB_EMERGENCY_PHONE=593991234567
```

### 6.3 Reemplazar Valores
Reemplaza con tus datos del PASO 3:
- `PEGA_AQUI_TU_ACCESS_TOKEN` → El token largo que copiaste
- `PEGA_AQUI_TU_PHONE_NUMBER_ID` → El Phone Number ID
- `PEGA_AQUI_TU_BUSINESS_ACCOUNT_ID` → El Business Account ID
- Los números de teléfono (formato: `593` + número sin 0)

**Ejemplo:**
```env
REACT_APP_WHATSAPP_ACCESS_TOKEN=EAABsbCS1...muylargo
REACT_APP_WHATSAPP_PHONE_NUMBER_ID=123456789012345
REACT_APP_WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765
REACT_APP_CLUB_ADMIN_PHONE=593991234567
```

### 6.4 Guardar Archivo
- **Ctrl + S** para guardar
- ⚠️ **IMPORTANTE:** Nunca subas este archivo a Git

---

## PASO 7: Probar la Integración

### 7.1 Reiniciar la Aplicación
En la terminal donde corre la app:
1. **Ctrl + C** (detener)
2. `npm start` (reiniciar)

Esto carga las nuevas variables de entorno.

### 7.2 Verificar Configuración
Abre la consola del navegador (F12) y ejecuta:
```javascript
console.log('WhatsApp Config:', {
  hasToken: !!process.env.REACT_APP_WHATSAPP_ACCESS_TOKEN,
  hasPhoneId: !!process.env.REACT_APP_WHATSAPP_PHONE_NUMBER_ID,
  hasBusinessId: !!process.env.REACT_APP_WHATSAPP_BUSINESS_ACCOUNT_ID
});
```

Debe mostrar todo en `true`.

### 7.3 Prueba 1: Enviar Credenciales
1. Inicia sesión como admin
2. Ve a **Gestión de Atletas**
3. Busca un atleta que tenga **teléfono** registrado
4. Click **"Reenviar credenciales"**

**Debe pasar:**
- ✅ Se genera nueva contraseña
- ✅ Se envía email
- ✅ Se envía WhatsApp (si plantilla aprobada)
- ✅ Mensaje de confirmación

**Verificar:** El atleta debe recibir WhatsApp con sus credenciales

### 7.4 Prueba 2: Confirmar Pago
1. Ve a **Gestión de Pagos**
2. Registra un pago para un estudiante con teléfono
3. El sistema debe enviar WhatsApp automáticamente

**Verificar:** El estudiante recibe confirmación de pago

---

## ⚠️ Solución de Problemas

### Error: "Template not found"
- Las plantillas aún están en revisión
- Espera 10-30 minutos
- Revisa en Meta: WhatsApp > Plantillas de mensajes
- Estado debe ser **"APPROVED"** (verde)

### No recibe WhatsApp
1. Verifica que el número esté en formato correcto: `593991234567`
2. Verifica que el número tenga WhatsApp instalado
3. Revisa consola del navegador (F12) para ver errores
4. Verifica en Meta: WhatsApp > Mensajes enviados

### Error: "Invalid access token"
- El token es incorrecto o expiró
- Genera uno nuevo en Meta Business Manager
- Actualiza `.env.local`
- Reinicia la app

### Variables no se cargan
- Verifica que el archivo se llame `.env.local` (con punto al inicio)
- Verifica que todas empiecen con `REACT_APP_`
- **Reinicia la aplicación** después de cambiar `.env.local`

---

## 📊 Checklist Final

Antes de terminar, verifica:

- [ ] Cuenta Meta Business creada
- [ ] Número de teléfono verificado
- [ ] Access Token copiado y guardado
- [ ] Phone Number ID copiado
- [ ] Business Account ID copiado
- [ ] Plantilla `credenciales_acceso` creada y APROBADA
- [ ] Plantilla `confirmacion_pago` creada y APROBADA
- [ ] Archivo `.env.local` creado con todas las variables
- [ ] Aplicación reiniciada
- [ ] Prueba de credenciales exitosa
- [ ] Prueba de pago exitosa

---

## 🎉 ¡Listo!

Ahora tienes WhatsApp Business completamente integrado. El sistema enviará automáticamente:

✅ Credenciales de acceso (Email + WhatsApp)  
✅ Confirmaciones de pago (WhatsApp)  
✅ Recordatorios futuros (cuando lo implementes)

**¿Necesitas ayuda?** Revisa los logs en la consola del navegador (F12) para ver detalles de cada envío.
