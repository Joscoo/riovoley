import { createAttendanceService } from './src/features/attendance/presentation/createAttendanceService.js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const service = createAttendanceService();
  const athleteId = '7f862943-d60f-43aa-a8dd-19f6892f53f8';
  const selectedDate = new Date().toISOString().slice(0, 10);
  
  try {
    const pt = await service.listPaymentTypes();
    const mens = pt.find(p => p.nombre === 'mensualidad');
    console.log('Mensualidad ID:', mens?.id);
    
    await service.registerAttendanceWithPayment({
      athleteId,
      selectedDate,
      paymentTypeId: mens.id
    });
    console.log('Success!');
  } catch(e) {
    console.error('Error:', e);
  }
}

test();
