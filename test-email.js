// test-email.js - Script para probar el envío de correos
// Ejecutar con: node test-email.js

const { createClient } = require('@supabase/supabase-js');

// Configurar con tus credenciales reales
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu_anon_key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testEmailFunction() {
  console.log('🧪 Probando Edge Function de envío de correos...');
  
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: 'test@example.com', // Cambia por tu email real
        subject: '🧪 Test - Función de Correo Riovoley',
        html: `
          <h1>¡Prueba exitosa!</h1>
          <p>Si recibes este correo, la Edge Function está funcionando correctamente.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        `
      }
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (data && data.success) {
      console.log('✅ Correo enviado exitosamente!');
      console.log('📧 Message ID:', data.messageId);
    } else {
      console.error('❌ Error en la respuesta:', data);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

// Ejecutar la prueba
testEmailFunction();

/* 
INSTRUCCIONES DE USO:

1. Instalar dependencias:
   npm install @supabase/supabase-js

2. Actualizar las credenciales arriba:
   - SUPABASE_URL con tu URL de proyecto
   - SUPABASE_ANON_KEY con tu clave anónima
   - Cambiar el email de prueba

3. Ejecutar:
   node test-email.js

4. Verificar:
   - Revisa la consola para ver si hay errores
   - Revisa tu bandeja de entrada (y spam)
   - Revisa los logs en Supabase Dashboard
*/