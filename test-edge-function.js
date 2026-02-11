// Test de Edge Function - update-user-password
// Este script prueba si la función responde correctamente

const SUPABASE_URL = 'https://mayvvlkvheagkojunzzb.supabase.co';
const FUNCTION_NAME = 'update-user-password';

async function testEdgeFunction() {
  console.log('🧪 Probando Edge Function...\n');

  // Test 1: OPTIONS request (CORS preflight)
  console.log('📋 Test 1: CORS Preflight (OPTIONS)');
  try {
    const optionsResponse = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type'
      }
    });

    console.log('Status:', optionsResponse.status);
    console.log('Headers CORS:');
    console.log('  - Access-Control-Allow-Origin:', optionsResponse.headers.get('Access-Control-Allow-Origin'));
    console.log('  - Access-Control-Allow-Methods:', optionsResponse.headers.get('Access-Control-Allow-Methods'));
    console.log('  - Access-Control-Allow-Headers:', optionsResponse.headers.get('Access-Control-Allow-Headers'));
    
    if (optionsResponse.status === 204 || optionsResponse.status === 200) {
      console.log('✅ CORS preflight OK\n');
    } else {
      console.log('❌ CORS preflight FAILED\n');
    }
  } catch (error) {
    console.log('❌ Error en preflight:', error.message, '\n');
  }

  // Test 2: POST sin autenticación
  console.log('📋 Test 2: POST sin autenticación');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test-id',
        newPassword: 'test-password'
      })
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('');
  } catch (error) {
    console.log('❌ Error:', error.message, '\n');
  }
}

testEdgeFunction().catch(console.error);
