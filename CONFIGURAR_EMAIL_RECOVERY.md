# 📧 Configurar Template de Recuperación de Contraseña en Supabase

## Problema Actual

El correo de recuperación de contraseña llega mostrando el código HTML en lugar del email formateado.

## Solución

Debes configurar correctamente el template en Supabase Dashboard.

---

## 📋 Pasos para Configurar

### 1. Acceder a Email Templates en Supabase

1. Ve a tu proyecto en Supabase: https://app.supabase.com
2. En el menú lateral, haz clic en **Authentication**
3. Haz clic en **Email Templates**
4. Selecciona **Reset Password** (Recuperación de contraseña)

### 2. Configurar el Template

En la sección de **Reset Password**, verás dos pestañas:

#### A. Subject (Asunto)
Cambia el asunto a:
```
Recuperación de Contraseña - Riovoley
```

#### B. Message (HTML)

**IMPORTANTE:** Asegúrate de que estás en modo **HTML** (no en modo texto).

Copia TODO el contenido del archivo `email-templates/password-recovery.html` de este proyecto y pégalo en el campo de mensaje.

El template ya no tiene emojis y está listo para usarse.

### 3. Configurar URLs de Redirección

1. En el menú lateral de Authentication, haz clic en **URL Configuration**
2. En la sección **Redirect URLs**, agrega:

   **Para producción:**
   ```
   https://riovoley.vercel.app/reset-password
   https://www.riovoley.com/reset-password
   ```

   **Para desarrollo (opcional):**
   ```
   http://localhost:3000/reset-password
   ```

3. Haz clic en **Save**

### 4. Verificar Configuración de Site URL

En la misma sección **URL Configuration**:

1. **Site URL** debe ser:
   ```
   https://riovoley.vercel.app
   ```
   o
   ```
   https://www.riovoley.com
   ```

2. Esto asegura que `{{ .ConfirmationURL }}` se genere correctamente

### 5. Guardar Cambios

1. Haz clic en **Save** en Email Templates
2. Espera unos segundos para que se apliquen los cambios

---

## 🧪 Probar el Sistema

1. Ve a tu aplicación: https://riovoley.vercel.app/login
2. Haz clic en "¿Olvidaste tu contraseña?"
3. Ingresa un email registrado
4. Haz clic en "Enviar Enlace"
5. Revisa tu bandeja de entrada

El email debería llegar **formateado** con:
- ✅ Fondo con degradado azul
- ✅ Botón dorado para restablecer contraseña
- ✅ Logo de RIOVOLEY en el header
- ✅ Información de seguridad
- ✅ Enlace alternativo al final

---

## ❌ Problemas Comunes

### El email sigue llegando como HTML plano

**Solución:**
- Verifica que estés pegando el template en la pestaña correcta (HTML, no texto plano)
- Asegúrate de hacer clic en **Save** después de pegar
- Espera 1-2 minutos y prueba nuevamente

### El enlace no funciona

**Solución:**
- Verifica que la URL de redirección esté agregada en **Redirect URLs**
- Verifica que **Site URL** esté configurada correctamente
- El enlace expira en 1 hora, solicita uno nuevo si pasó ese tiempo

### No llega el email

**Solución:**
- Revisa la carpeta de SPAM
- Verifica que el email esté registrado en Supabase
- Revisa los logs en Supabase Dashboard → Logs

---

## 📝 Notas Importantes

- El template usa variables de Supabase: `{{ .ConfirmationURL }}` - NO las modifiques
- El enlace de recuperación expira en 1 hora por seguridad
- Solo se puede usar una vez
- Si el usuario no solicitó el cambio, puede ignorar el email de forma segura

---

## ✅ Checklist

- [ ] Template HTML copiado en Supabase Email Templates
- [ ] Subject actualizado a "Recuperación de Contraseña - Riovoley"
- [ ] Redirect URLs configuradas correctamente
- [ ] Site URL configurada correctamente
- [ ] Cambios guardados (botón Save)
- [ ] Email de prueba enviado y recibido correctamente
- [ ] Email llega formateado (no como HTML plano)
- [ ] Enlace funciona y redirige a /reset-password

---

**Última actualización:** Febrero 2024
