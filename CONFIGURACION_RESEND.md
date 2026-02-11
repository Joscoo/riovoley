# 📧 Configuración de Resend para Envío de Emails

## 🎯 Resumen

Este documento explica cómo configurar Resend para enviar emails de credenciales desde tu aplicación.

## 📋 Pasos de Configuración

### 1. Obtener API Key de Resend

1. Ve a [https://resend.com](https://resend.com) e inicia sesión
2. Ve a **API Keys** en el dashboard
3. Crea una nueva API Key:
   - **Name**: Rio Voley Production
   - **Permission**: Full Access (o Send Access)
4. **Copia la API Key** (empieza con `re_`)

### 2. Configurar Variables de Entorno en Supabase

Debes configurar las variables de entorno en Supabase para las Edge Functions:

#### Opción A: Desde Supabase Dashboard

1. Ve a tu proyecto en [https://app.supabase.com](https://app.supabase.com)
2. Settings → Edge Functions
3. Agrega las siguientes variables:
   ```
   RESEND_API_KEY=re_tu_api_key_aqui
   FROM_EMAIL=noreply@riovoley.com
   ```

#### Opción B: Usando Supabase CLI

```bash
# Configurar secretos para las Edge Functions
npx supabase secrets set RESEND_API_KEY=re_tu_api_key_aqui
npx supabase secrets set FROM_EMAIL=noreply@riovoley.com
```

### 3. Verificar Dominio en Resend (Importante)

Para enviar emails desde tu dominio personalizado:

1. En Resend Dashboard, ve a **Domains**
2. Agrega tu dominio: `riovoley.com`
3. Configura los registros DNS (SPF, DKIM, DMARC) que te proporciona Resend
4. Espera la verificación (puede tardar hasta 48 horas)

**MIENTRAS TANTO**: Puedes usar el dominio de prueba de Resend:
- Solo funcionará enviando a emails verificados
- Ve a **Verified Emails** en Resend y agrega tu email de prueba

### 4. Desplegar Edge Functions

Después de configurar las variables de entorno:

```bash
# Desplegar función de envío de emails
npx supabase functions deploy send-email

# Desplegar función de actualización de contraseña
npx supabase functions deploy update-user-password
```

### 5. Probar el Sistema

1. Ve a tu aplicación desplegada en Vercel
2. Inicia sesión como administrador
3. Ve a **Gestión de Atletas**
4. Intenta **Reenviar Credenciales** a un atleta
5. Verifica:
   - ✅ La consola del navegador (F12)
   - ✅ El email recibido
   - ✅ Los logs de Supabase: `npx supabase functions logs send-email`

## 🔍 Troubleshooting

### Error 500 en update-user-password

**Causa**: Faltan variables de entorno o permisos incorrectos

**Solución**:
```bash
# Ver logs de la función
npx supabase functions logs update-user-password

# Verificar que las variables estén configuradas
npx supabase secrets list
```

### Email no se envía (pero no hay error)

**Causa**: El dominio no está verificado en Resend

**Soluciones**:
1. **Inmediata**: Agrega emails de prueba en Resend → Verified Emails
2. **Permanente**: Verifica tu dominio en Resend (ver paso 3)

### Email llega a spam

**Causa**: Faltan configuraciones DNS

**Solución**:
1. Verifica que configuraste SPF, DKIM y DMARC en tu DNS
2. En Resend Dashboard → Domains, verifica que todos los checkmarks estén verdes

## 📊 Monitoreo

### Ver logs de envío de emails

```bash
# Logs en tiempo real
npx supabase functions logs send-email --follow

# Logs históricos
npx supabase functions logs send-email
```

### Dashboard de Resend

Ve a [https://resend.com/emails](https://resend.com/emails) para ver:
- ✅ Emails enviados
- ❌ Emails fallidos
- 📊 Estadísticas de entrega

## 🎨 Personalización

### Modificar plantilla de email

Edita el archivo: `src/services/userCreationWorking.js`

Busca la variable `emailHtml` en la función `resendWorkingCredentials`:

```javascript
const emailHtml = `
  <!DOCTYPE html>
  <html>
    <!-- Aquí puedes personalizar el diseño -->
  </html>
`;
```

### Cambiar remitente

Modifica la variable de entorno:
```bash
npx supabase secrets set FROM_EMAIL=soporte@riovoley.com
```

## ✅ Checklist Final

- [ ] API Key de Resend configurada
- [ ] Variables de entorno en Supabase configuradas
- [ ] Edge Functions desplegadas
- [ ] Dominio verificado en Resend (o emails de prueba agregados)
- [ ] Prueba exitosa de reenvío de credenciales
- [ ] Emails llegando correctamente (no a spam)

## 🆘 Soporte

Si sigues teniendo problemas:

1. Revisa los logs: `npx supabase functions logs send-email`
2. Verifica en Resend Dashboard si hay errores
3. Contacta a soporte de Resend si es necesario

---

**Última actualización**: Febrero 2026
