jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }));
jest.mock('../../../../config/supabase', () => ({ supabase: { auth: { signInWithPassword: jest.fn() } } }));
const { createClient } = require('@supabase/supabase-js');
const { supabase } = require('../../../../config/supabase');
const { SupabaseAccountAdminRepository } = require('./supabaseAccountAdminRepository');

it('verifica la contrasena actual sin reemplazar ni cerrar la sesion principal', async () => {
  const signOut = jest.fn();
  supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
  createClient.mockReturnValue({ auth: { signInWithPassword: async () => ({ data: { user: { id: 'u1' } }, error: null }), signOut } });
  const result = await new SupabaseAccountAdminRepository().verifyCurrentPassword('ana@demo.com', 'Old123456!');
  expect(result.ok).toBe(true);
  expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  expect(createClient.mock.calls[0][2].auth.persistSession).toBe(false);
  expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
});
