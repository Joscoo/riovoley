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

#### 🎯 Opción Rápida: Integración Vercel + Resend (Recomendado)

Si tu aplicación está en Vercel y Resend:

1. Ve a tu proyecto en [vercel.com](https://vercel.com)
2. Ve a **Settings** → **Integrations**
3. Busca **Resend** 
4. Click en **Add Integration**
5. Esto configurará automáticamente la API Key en Vercel
6. **Luego** debes copiar la API Key a Supabase (ver opciones A o B abajo)

#### Opción A: Desde Supabase Dashboard

1. Ve a tu proyecto en [https://app.supabase.com](https://app.supabase.com)
2. Settings → Edge Functions → **Manage secrets**
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

#### Paso 3.1: Agregar Dominio en Resend

1. En Resend Dashboard, ve a **Domains**
2. Click en **Add Domain**
3. Ingresa tu dominio: `riovoley.com` (sin www)
4. Click en **Add**

#### Paso 3.2: Obtener Registros DNS

Resend te mostrará una tabla con los registros DNS que necesitas configurar. Algo como:

| Tipo | Nombre | Valor |
|------|--------|-------|
| TXT | @ | `v=spf1 include:_spf.resend.com ~all` |
| TXT | resend._domainkey | `p=MIGfMA0GCSq...` (largo) |
| TXT | _dmarc | `v=DMARC1; p=none; ...` |
| MX | @ | `feedback-smtp.resend.com` (prioridad: 10) |

**Copia estos valores** - los necesitarás en el siguiente paso.

#### Paso 3.3: Configurar DNS en tu Proveedor

Debes ir al panel de control de donde compraste tu dominio (GoDaddy, Namecheap, Cloudflare, etc.)

##### Si usas **GoDaddy**:

1. Inicia sesión en [godaddy.com](https://godaddy.com)
2. Ve a **My Products** → **Domains**
3. Click en tu dominio `riovoley.com`
4. Click en **DNS** o **Manage DNS**
5. Busca la sección **Records**
6. Para cada registro que te dio Resend:
   - Click **Add**
   - Selecciona el **Type** (TXT o MX)
   - En **Name/Host**: copia exactamente lo que dice Resend (@ significa raiz)
   - En **Value/Points to**: copia el valor completo de Resend
   - En **TTL**: deja el default (600 o Auto)
   - Click **Save**

##### Si usas **Vercel** (tu caso):

1. Inicia sesión en [vercel.com](https://vercel.com)
2. Ve a tu proyecto o click en tu avatar → **Domains**
3. Click en tu dominio `riovoley.com`
4. Ve a la pestaña **DNS Records**
5. Para cada registro que te dio Resend:
   
   **Para registros TXT (SPF, DKIM, DMARC):**
   - Click **Add** o **Add Record**
   - **Type**: TXT
   - **Name**: copia lo que dice Resend
     - Si dice `@` → déjalo vacío o pon `@`
     - Si dice `resend._domainkey` → pon exactamente eso
     - Si dice `_dmarc` → pon exactamente eso
   - **Value**: pega el valor completo que te dio Resend
   - Click **Save**
   
   **⚠️ IMPORTANTE - Advertencia de Wildcard Domain:**
   
   Si ves un mensaje como "Wildcard Domain Override" al agregar `resend._domainkey`:
   - **Es NORMAL y SEGURO** ✅
   - Click en **Continue** o **Override**
   - Este registro no afectará el funcionamiento de tu sitio
   - Solo configura la autenticación de emails de Resend
   
   **Para registro MX (opcional):**
   - Click **Add Record**
   - **Type**: MX
   - **Name**: déjalo vacío o pon `@`
   - **Value**: `feedback-smtp.resend.com`
   - **Priority**: 10
   - Click **Save**

6. Los cambios en Vercel suelen propagarse en 5-15 minutos

**Nota importante para Vercel**: Los registros DNS en Vercel se aplican automáticamente sin necesidad de esperar días.

##### Si usas **Cloudflare**:

1. Inicia sesión en [cloudflare.com](https://cloudflare.com)
2. Selecciona tu sitio `riovoley.com`
3. Ve a **DNS** → **Records**
4. Para cada registro:
   - Click **Add record**
   - **Type**: TXT o MX
   - **Name**: lo que dice Resend (@ es la raiz, déjalo en blanco o pon @)
   - **Content**: el valor completo de Resend
   - **TTL**: Auto
   - **Proxy status**: DNS only (nube gris, NO naranja)
   - Click **Save**

##### Si usas **Namecheap**:

1. Inicia sesión en [namecheap.com](https://namecheap.com)
2. Ve a **Domain List** → click en **Manage** junto a tu dominio
3. Ve a **Advanced DNS**
4. En **Host Records**:
   - Click **Add New Record**
   - **Type**: TXT Record o MX Record
   - **Host**: copia de Resend (@ para raiz)
   - **Value**: el valor de Resend
   - **TTL**: Automatic
   - Click guardar (✓)

##### Si usas otro proveedor:

Busca en tu panel de control por términos como:
- DNS Management
- DNS Settings
- Manage DNS
- Advanced DNS
- Zone Editor

Luego agrega los registros TXT y MX como te indicó Resend.

#### Paso 3.4: Verificar en Resend

1. Regresa al Dashboard de Resend → **Domains**
2. Click en **Verify** o **Check DNS**
3. Si aparecen checkmarks verdes ✅ - ¡Listo!
4. Si aparecen rojos ❌:
   - Espera 10-15 minutos (la propagación DNS toma tiempo)
   - Verifica que copiaste **exactamente** los valores
   - Revisa que no haya espacios extras al inicio/final
   - Intenta verificar nuevamente

**Nota**: La verificación DNS puede tardar desde 5 minutos hasta 48 horas dependiendo de tu proveedor.

#### 📝 Ejemplo de Configuración Completa en Vercel

**Paso a paso para agregar registros DNS en Vercel:**

1. **Registro SPF (TXT):**
   ```
   Type: TXT
   Name: @ (o déjalo vacío)
   Value: v=spf1 include:_spf.resend.com ~all
   ```

2. **Registro DKIM (TXT):**
   ```
   Type: TXT
   Name: resend._domainkey
   Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4... (copia el valor largo que te da Resend)
   ```

3. **Registro DMARC (TXT):**
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc@resend.com
   ```

4. **Registro MX (opcional, para recibir bounces):**
   ```
   Type: MX
   Name: @ (o déjalo vacío)
   Value: feedback-smtp.resend.com
   Priority: 10
   ```

**🎯 Atajo para usuarios de Vercel**: 

Si ya tienes integración de Vercel con Resend activada, puedes:
1. Ve a tu proyecto en Vercel
2. Settings → Integrations
3. Busca "Resend" y conecta la integración
4. Esto podría configurar automáticamente las variables de entorno

**MIENTRAS TANTO**: Puedes usar el dominio de prueba de Resend:
- Solo funcionará enviando a emails verificados
- Ve a **Verified Emails** en Resend y agrega tu email de prueba
- Esto te permite probar inmediatamente sin esperar verificación DNS

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
