// Test de variables de entorno - Ejecutar en consola del navegador
console.log('=== DEBUG VARIABLES DE ENTORNO ===');
console.log('Todas las variables REACT_APP_:');
Object.keys(process.env)
  .filter(key => key.startsWith('REACT_APP_'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key] ? '✅ DEFINIDA' : '❌ UNDEFINED'}`);
  });

console.log('\n=== VARIABLES ESPECÍFICAS DE SUPABASE ===');
console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY);

console.log('\n=== INFORMACIÓN DEL ENTORNO ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Directorio actual:', process.cwd?.() || 'No disponible');

// Test de importación de Supabase
try {
  const { supabase } = require('./src/config/supabase');
  console.log('✅ Supabase importado correctamente');
} catch (error) {
  console.error('❌ Error al importar Supabase:', error.message);
}