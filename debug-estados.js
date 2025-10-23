// Test debug para el sistema de estados de pagos
import PagoStatusService from './src/services/pagoStatusService.js';

// Simular el pago que creaste
const pagoTest = {
  id: 'test-123',
  fecha_inicio: '2025-08-31',
  fecha_fin: '2025-09-30',
  fecha_pago: null, // Sin fecha de pago
  monto: 1000
};

console.log('🧪 TEST DEL SISTEMA DE ESTADOS');
console.log('================================');
console.log('📅 Fecha actual:', new Date().toISOString().split('T')[0]);
console.log('📋 Pago de prueba:', pagoTest);
console.log('');

// Calcular estado
const estado = PagoStatusService.calcularEstado(pagoTest);
const statusInfo = PagoStatusService.getStatusInfo(pagoTest);

console.log('🎯 RESULTADO:');
console.log('Estado calculado:', estado);
console.log('Info completa:', statusInfo);
console.log('');

// Test manual de la lógica
const hoy = new Date();
hoy.setHours(0, 0, 0, 0);
const fechaFin = new Date('2025-09-30');
fechaFin.setHours(0, 0, 0, 0);

const diferenciaMs = fechaFin.getTime() - hoy.getTime();
const diferenciaDias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

console.log('🔍 CÁLCULO MANUAL:');
console.log('Hoy:', hoy.toISOString().split('T')[0]);
console.log('Fecha fin:', fechaFin.toISOString().split('T')[0]);
console.log('Diferencia en ms:', diferenciaMs);
console.log('Diferencia en días:', diferenciaDias);
console.log('Estado esperado:', diferenciaDias < 0 ? 'vencido' : (diferenciaDias <= 5 ? 'proximo_a_vencer' : 'activo'));

// Expected: vencido (porque 30/09/2025 < 23/10/2025)