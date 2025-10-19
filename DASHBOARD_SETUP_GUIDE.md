# 📧 **Guía Completa: Crear Edge Function desde Supabase Dashboard**

## 🚀 **Paso a Paso - Sin necesidad de CLI**

### **Paso 1: Acceder a tu Proyecto**
1. Ve a [supabase.com](https://supabase.com) 
2. **Sign In** con tu cuenta
3. Selecciona tu proyecto **"Riovoley"**

### **Paso 2: Crear la Edge Function**
1. En el **menú lateral izquierdo**, busca y haz clic en **"Edge Functions"**
2. Haz clic en el botón **"Create a new function"** 
3. **Nombre de la función**: `send-email`
4. Haz clic en **"Create function"**

### **Paso 3: Copiar el Código**
En el editor que aparece, **borra todo el contenido** y pega exactamente este código:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

console.log("Send Email function loaded!")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { to, subject, html } = await req.json()

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: to, subject, html' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get environment variables
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@riovoley.com'

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      throw new Error('RESEND_API_KEY environment variable is not set')
    }

    console.log('Sending email to:', to)

    // Send email using Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: subject,
        html: html,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text()
      console.error('Resend API error:', errorData)
      throw new Error(`Resend API error: ${resendResponse.status} - ${errorData}`)
    }

    const result = await resendResponse.json()
    console.log('Email sent successfully:', result)

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.id,
        message: 'Email sent successfully' 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-email function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

### **Paso 4: Guardar la Función**
1. Haz clic en **"Deploy function"** (botón azul)
2. Espera a que aparezca ✅ **"Function deployed successfully"**

### **Paso 5: Configurar Variables de Entorno**
1. Ve a **"Project Settings"** (⚙️ en el menú lateral)
2. En el menú de la izquierda, haz clic en **"Edge Functions"**
3. Busca la sección **"Environment Variables"**
4. Haz clic en **"Add variable"** y agrega:

**Variable 1:**
- **Name**: `RESEND_API_KEY`
- **Value**: `re_tu_api_key_aqui` (la obtienes en paso 6)

**Variable 2:**
- **Name**: `FROM_EMAIL`  
- **Value**: `noreply@tudominio.com` (o usa `noreply@riovoley.com`)

5. Haz clic en **"Save"** después de agregar cada variable

### **Paso 6: Obtener API Key de Resend**
1. Ve a [resend.com](https://resend.com)
2. **Regístrate gratis** (si no tienes cuenta)
3. Una vez dentro, ve a **"API Keys"** en el menú lateral
4. Haz clic en **"Create API Key"**
5. **Nombre**: "Riovoley Email Service"
6. **Permisos**: "Send emails" (por defecto)
7. Haz clic en **"Add"**
8. **¡IMPORTANTE!** Copia la clave que empieza con `re_...`
9. Ve de vuelta a Supabase y úsala en la variable `RESEND_API_KEY`

### **Paso 7: Verificar que Funciona**
1. En Supabase Dashboard, ve a **"Edge Functions"**
2. Haz clic en tu función **"send-email"**
3. En la pestaña **"Invocations"**, deberías ver las llamadas
4. En la pestaña **"Logs"**, verás los mensajes de debug

### **Paso 8: Probar desde tu Aplicación**
Ahora tu aplicación debería funcionar automáticamente:

1. ✅ **Crear un nuevo atleta** → Se genera contraseña automáticamente
2. ✅ **El correo se envía** → Revisa la bandeja (y spam) del email del atleta
3. ✅ **Logs visibles** → En Supabase Dashboard puedes ver si hay errores

## 🎯 **URLs Importantes**

- **Supabase Dashboard**: https://supabase.com/dashboard/projects
- **Resend Dashboard**: https://resend.com/dashboard
- **Logs de la función**: Tu proyecto → Edge Functions → send-email → Logs

## 🔧 **Troubleshooting**

### **❌ "Function not found"**
- Verifica que el nombre sea exactamente `send-email`
- Asegúrate de que esté desplegada (Status: Active)

### **❌ "RESEND_API_KEY not set"**  
- Ve a Project Settings → Edge Functions → Environment Variables
- Verifica que `RESEND_API_KEY` esté configurada correctamente
- La clave debe empezar con `re_`

### **❌ "Correos no llegan"**
1. Verifica en **Resend Dashboard → Logs** si se están enviando
2. Revisa la carpeta de **Spam** del destinatario
3. Si usas email genérico (gmail, outlook), pueden bloquearse
4. Considera configurar un dominio personalizado en Resend

### **❌ "Error 500"**
- Ve a **Edge Functions → send-email → Logs**
- Ahí verás el error específico
- Usualmente es problema de configuración de variables

## 🎉 **¡Listo!**

Una vez completados todos los pasos:

1. **Crear atleta** → Contraseña generada automáticamente ✅
2. **Email enviado** → Usuario recibe credenciales ✅  
3. **Reenvío manual** → Botón 📧 funciona ✅
4. **Logs monitoreados** → Errores visibles en Dashboard ✅

**¡Sin necesidad de instalar nada localmente!** 🚀