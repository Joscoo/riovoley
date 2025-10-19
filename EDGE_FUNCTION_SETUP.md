# 📧 Guía de Implementación - Edge Function para Envío de Correos

## 🚀 **Pasos para Configurar el Envío de Correos**

### **Paso 1: Instalar Supabase CLI**
```bash
# Instalar Supabase CLI globalmente
npm install -g supabase

# Verificar instalación
supabase --version
```

### **Paso 2: Configurar Proyecto Local**
```bash
# Desde la carpeta root de tu proyecto
cd d:/Riovoley/riovoley

# Inicializar Supabase (si no está ya inicializado)
supabase init

# Login a Supabase
supabase login
```

### **Paso 3: Obtener API Key de Resend**

1. **Ir a [Resend.com](https://resend.com)** y crear una cuenta gratuita
2. **Crear API Key**:
   - Dashboard → API Keys → Create API Key
   - Nombre: "Riovoley Email Service"
   - Permisos: Send emails
   - Copiar la clave generada (empieza con `re_`)

### **Paso 4: Configurar Variables de Entorno**

**En Supabase Dashboard:**
1. Ir a Project Settings → Edge Functions
2. Agregar las siguientes variables:
   ```
   RESEND_API_KEY=re_tu_api_key_de_resend
   FROM_EMAIL=noreply@tudominio.com
   ```

**Para desarrollo local:**
```bash
# Crear archivo .env.local en supabase/
echo "RESEND_API_KEY=re_tu_api_key" > supabase/.env.local
echo "FROM_EMAIL=noreply@tudominio.com" >> supabase/.env.local
```

### **Paso 5: Desplegar la Edge Function**
```bash
# Desde la carpeta root del proyecto
supabase functions deploy send-email

# O para desarrollo local (testing)
supabase functions serve send-email --env-file supabase/.env.local
```

### **Paso 6: Configurar Dominio (Opcional pero Recomendado)**

**Para evitar que los correos lleguen a spam:**
1. **En Resend Dashboard**:
   - Add Domain → Ingresar tu dominio (ej: riovoley.com)
   - Seguir instrucciones para configurar registros DNS
2. **Actualizar FROM_EMAIL**:
   ```
   FROM_EMAIL=noreply@tudominio.com
   ```

### **Paso 7: Verificar Funcionamiento**
```bash
# Probar la función localmente
curl -X POST 'http://localhost:54321/functions/v1/send-email' \
  -H "Authorization: Bearer tu_anon_key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello World!</h1>"
  }'
```

## 🔧 **Comandos Útiles**

### **Desarrollo Local:**
```bash
# Iniciar servicios locales de Supabase
supabase start

# Servir functions localmente
supabase functions serve --env-file supabase/.env.local

# Ver logs de functions
supabase functions logs send-email
```

### **Deployment:**
```bash
# Desplegar function específica
supabase functions deploy send-email

# Ver logs en producción
supabase functions logs send-email --follow
```

### **Debugging:**
```bash
# Ver configuración actual
supabase status

# Reset ambiente local si hay problemas
supabase db reset
```

## 🛠️ **Estructura de Archivos Creada**

```
supabase/
├── functions/
│   ├── send-email/
│   │   └── index.ts          # Edge Function principal
│   └── _shared/
│       └── cors.ts           # Configuración CORS
├── config.toml               # Configuración de Supabase
└── .env.example             # Template de variables de entorno
```

## 🔍 **Troubleshooting**

### **Error: "Function not found"**
```bash
# Verificar que la función está desplegada
supabase functions list

# Re-desplegar si es necesario
supabase functions deploy send-email
```

### **Error: "Missing API Key"**
1. Verificar variables de entorno en Supabase Dashboard
2. Asegurarse de que la API key de Resend sea válida
3. Revisar logs: `supabase functions logs send-email`

### **Correos llegan a spam:**
1. Configurar dominio personalizado en Resend
2. Agregar registros SPF, DKIM, DMARC
3. Usar FROM_EMAIL con dominio verificado

### **Error de CORS:**
1. Verificar que `cors.ts` está correctamente importado
2. Asegurarse de que el frontend usa la URL correcta

## 📚 **Alternativa: Usar SendGrid en lugar de Resend**

Si prefieres usar SendGrid, modifica `index.ts`:

```typescript
// Reemplazar la sección de Resend con:
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')

const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SENDGRID_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: to }] }],
    from: { email: FROM_EMAIL },
    subject: subject,
    content: [{ type: 'text/html', value: html }],
  }),
})
```

## ✅ **Verificación Final**

Después de completar todos los pasos, deberías poder:

1. ✅ **Crear un nuevo atleta** → Se genera contraseña automáticamente
2. ✅ **Correo se envía automáticamente** → Usuario recibe credenciales
3. ✅ **Ver logs de Edge Function** → Sin errores en Supabase Dashboard
4. ✅ **Reenviar credenciales** → Funciona el botón 📧 en AtletasManager

¡Una vez configurado, el sistema funcionará automáticamente! 🚀