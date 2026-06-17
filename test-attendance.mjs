import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const athleteId = '7f862943-d60f-43aa-a8dd-19f6892f53f8'; // from previous script
  const selectedDate = new Date().toISOString().slice(0, 10);
  
  const { data, error } = await supabase.from('attendances').insert({
    student_id: athleteId,
    fecha: selectedDate,
    metodo_pago_id: 2
  });
  
  console.log('Insert error:', error);
  console.log('Data:', data);
}

test();
