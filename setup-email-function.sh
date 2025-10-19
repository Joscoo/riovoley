#!/bin/bash
# setup-email-function.sh - Script automatizado para configurar Edge Function

echo "🚀 Configurando Edge Function para envío de correos..."

# Verificar si Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI no está instalado. Instalando..."
    npm install -g supabase
    echo "✅ Supabase CLI instalado"
fi

# Verificar login
echo "🔐 Verificando autenticación con Supabase..."
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Necesitas hacer login a Supabase:"
    supabase login
fi

# Crear .env.local si no existe
if [ ! -f "supabase/.env.local" ]; then
    echo "📝 Creando archivo de variables de entorno..."
    echo "# Configurar con valores reales" > supabase/.env.local
    echo "RESEND_API_KEY=re_your_api_key_here" >> supabase/.env.local
    echo "FROM_EMAIL=noreply@yourdomain.com" >> supabase/.env.local
    echo "⚠️  Edita supabase/.env.local con tus credenciales reales"
fi

# Desplegar función
echo "📤 Desplegando Edge Function..."
supabase functions deploy send-email

if [ $? -eq 0 ]; then
    echo "✅ Edge Function desplegada exitosamente!"
    echo ""
    echo "🔧 Próximos pasos:"
    echo "1. Configura variables de entorno en Supabase Dashboard:"
    echo "   - RESEND_API_KEY=tu_api_key_de_resend"
    echo "   - FROM_EMAIL=noreply@tudominio.com"
    echo ""
    echo "2. Obtén tu API key de Resend en: https://resend.com/api-keys"
    echo ""
    echo "3. Prueba la función ejecutando:"
    echo "   node test-email.js"
    echo ""
    echo "🎉 ¡Listo para enviar correos!"
else
    echo "❌ Error al desplegar la función. Revisa los logs."
fi