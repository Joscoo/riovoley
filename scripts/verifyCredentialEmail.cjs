// Manual delivery probe: it never rotates passwords or creates accounts.
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

const args = process.argv.slice(2);
const recipient = args[args.indexOf('--to') + 1];
if (!args.includes('--confirm-send') || !args.includes('--to') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient || '')) {
  console.error('Uso: node scripts/verifyCredentialEmail.cjs --to correo-autorizado@example.com --confirm-send');
  process.exit(1);
}
const root = path.resolve(__dirname, '..');
const readEnv = (name) => fs.existsSync(path.join(root, name)) ? dotenv.parse(fs.readFileSync(path.join(root, name))) : {};
const env = { ...readEnv('.env'), ...readEnv('.env.local'), ...readEnv('.env.e2e'), ...process.env };

async function main() {
  if (!env.REACT_APP_SUPABASE_URL || !env.REACT_APP_SUPABASE_ANON_KEY || !env.E2E_ADMIN_EMAIL || !env.E2E_ADMIN_PASSWORD) {
    throw new Error('Falta la configuracion de Supabase o la cuenta E2E de administrador.');
  }
  const client = createClient(env.REACT_APP_SUPABASE_URL, env.REACT_APP_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error: authError } = await client.auth.signInWithPassword({ email: env.E2E_ADMIN_EMAIL, password: env.E2E_ADMIN_PASSWORD });
  if (authError) throw new Error('No se pudo autenticar la cuenta E2E de administrador: ' + authError.code);
  try {
    const timestamp = new Date().toISOString();
    const { data, error } = await client.functions.invoke('send-email', { body: {
      to: recipient,
      subject: 'RioVoley - prueba de entrega de correo',
      html: '<h1>Prueba de correo de RioVoley</h1><p>Este mensaje comprueba la entrega del servicio de correo de la plataforma.</p><p>Referencia: ' + timestamp + '</p>',
    } });
    if (error || data?.success !== true) {
      let body = data;
      try { if (error?.context?.json) body = await error.context.json(); } catch (_error) { /* network/proxy error */ }
      console.error(JSON.stringify({ accepted: false, status: error?.context?.status, code: body?.code, message: body?.message || body?.error || error?.message }));
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify({ accepted: true, messageId: data.messageId || data.data?.messageId || data.id || null, timestamp }));
    console.log('El proveedor acepto el mensaje. La recepcion en bandeja debe confirmarse con el destinatario o los eventos de Resend.');
  } finally {
    await client.auth.signOut({ scope: 'local' });
  }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
