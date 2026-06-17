import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: payments, error: e2 } = await supabase.from('payments')
    .select('student_id')
    .not('membership_type_id', 'is', null)
    .eq('estado', 'activo')
    .is('deleted_at', null)
    .limit(10);
  console.log('Error:', e2);
  console.log('Sample payments with membership_type_id:', payments);
}

test();
