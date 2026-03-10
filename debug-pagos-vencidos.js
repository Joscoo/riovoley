// Script para depurar pagos vencidos en el dashboard
// Ejecutar con: node debug-pagos-vencidos.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

function getEcuadorDate() {
  const now = new Date();
  const ecuadorTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Guayaquil' }));
  return ecuadorTime.toISOString().split('T')[0];
}

async function debugPagosVencidos() {
  console.log('\n🔍 DEPURACIÓN DE PAGOS VENCIDOS\n');
  console.log('📅 Fecha actual (Ecuador):', getEcuadorDate());
  console.log('═'.repeat(60));

  // 1. Obtener todos los pagos sin pagar
  const { data: todosPagos, error: errorTodos } = await supabase
    .from('payments')
    .select('id, student_id, fecha_inicio, fecha_fin, estado, fecha_pago, deleted_at, monto')
    .is('fecha_pago', null)
    .is('deleted_at', null)
    .order('fecha_fin', { ascending: true });

  if (errorTodos) {
    console.error('❌ Error obteniendo pagos:', errorTodos);
    return;
  }

  console.log(`\n📊 Total pagos sin pagar (no eliminados): ${todosPagos.length}`);

  // 2. Analizar estados
  const hoy = new Date(getEcuadorDate());
  const pagosPorEstado = {
    vencido: [],
    proximo_a_vencer: [],
    activo: [],
    sin_estado: []
  };

  todosPagos.forEach(pago => {
    if (!pago.fecha_fin) {
      pagosPorEstado.sin_estado.push(pago);
      return;
    }

    const fechaFin = new Date(pago.fecha_fin);
    const diferenciaDias = Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24));
    
    let estadoCalculado;
    if (diferenciaDias < 0) {
      estadoCalculado = 'vencido';
    } else if (diferenciaDias <= 5) {
      estadoCalculado = 'proximo_a_vencer';
    } else {
      estadoCalculado = 'activo';
    }

    // Comparar con el estado guardado
    if (pago.estado !== estadoCalculado) {
      console.log(`\n⚠️  INCONSISTENCIA DETECTADA:`);
      console.log(`   Pago ID: ${pago.id}`);
      console.log(`   Fecha fin: ${pago.fecha_fin}`);
      console.log(`   Días restantes: ${diferenciaDias}`);
      console.log(`   Estado en BD: ${pago.estado || 'NULL'}`);
      console.log(`   Estado calculado: ${estadoCalculado}`);
    }

    pagosPorEstado[estadoCalculado].push(pago);
  });

  console.log('\n📈 DISTRIBUCIÓN POR ESTADO CALCULADO:');
  console.log('─'.repeat(60));
  console.log(`   Vencidos:           ${pagosPorEstado.vencido.length}`);
  console.log(`   Próximos a vencer:  ${pagosPorEstado.proximo_a_vencer.length}`);
  console.log(`   Activos:            ${pagosPorEstado.activo.length}`);
  console.log(`   Sin fecha fin:      ${pagosPorEstado.sin_estado.length}`);

  // 3. Ver pagos vencidos en la BD
  const { count: vencidosEnBD } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'vencido')
    .is('fecha_pago', null)
    .is('deleted_at', null);

  console.log('\n💾 ESTADO EN BASE DE DATOS:');
  console.log('─'.repeat(60));
  console.log(`   Pagos con estado='vencido' en BD: ${vencidosEnBD || 0}`);

  // 4. Mostrar detalles de pagos vencidos calculados
  if (pagosPorEstado.vencido.length > 0) {
    console.log('\n📋 DETALLES DE PAGOS VENCIDOS CALCULADOS:');
    console.log('─'.repeat(60));
    pagosPorEstado.vencido.slice(0, 10).forEach((pago, i) => {
      const fechaFin = new Date(pago.fecha_fin);
      const diferenciaDias = Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24));
      console.log(`\n   ${i + 1}. Pago ID: ${pago.id}`);
      console.log(`      Student ID: ${pago.student_id}`);
      console.log(`      Fecha fin: ${pago.fecha_fin}`);
      console.log(`      Días vencido: ${Math.abs(diferenciaDias)}`);
      console.log(`      Estado actual en BD: ${pago.estado || 'NULL'}`);
      console.log(`      Monto: $${pago.monto}`);
    });
    if (pagosPorEstado.vencido.length > 10) {
      console.log(`\n   ... y ${pagosPorEstado.vencido.length - 10} más`);
    }
  }

  // 5. Sugerencia
  console.log('\n💡 RECOMENDACIÓN:');
  console.log('─'.repeat(60));
  if (pagosPorEstado.vencido.length > vencidosEnBD) {
    console.log('⚠️  Hay pagos vencidos que no tienen el estado correcto en la BD.');
    console.log('   Ejecuta la actualización manual de estados desde PagosManager.');
  } else if (vencidosEnBD === 0 && pagosPorEstado.vencido.length === 0) {
    console.log('✅ No hay pagos vencidos. Todo está al día.');
  } else {
    console.log('✅ Los estados en la BD coinciden con los cálculos.');
  }
  
  console.log('\n' + '═'.repeat(60) + '\n');
}

debugPagosVencidos()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
