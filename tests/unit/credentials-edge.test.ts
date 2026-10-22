import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';
import { ResendCommunicationsGateway } from '../../supabase/functions/_core/communications/infrastructure/resend-communications-gateway.ts';
import { SendEmailUseCase } from '../../supabase/functions/_core/communications/application/use-cases/send-email-use-case.ts';
import { UpdateUserPasswordUseCase } from '../../supabase/functions/_core/auth-admin/application/use-cases/update-user-password-use-case.ts';

const originalFetch = globalThis.fetch;
Object.assign(globalThis, { Deno: { env: { get: (name: string) => name === 'RESEND_API_KEY' ? 'test-key' : undefined } } });
afterEach(() => { globalThis.fetch = originalFetch; });
const mail = { to: 'recipient@example.com', subject: 'Prueba', html: '<p>Prueba</p>' };
const authorized = { requireActor: async () => ({ userId: 'admin', role: 'administrador' }) };

test('rechaza una respuesta 200 del proveedor sin identificador de mensaje', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'invalid response' }), { status: 200 });
  await assert.rejects(new ResendCommunicationsGateway().sendEmail(mail), (error: any) => error.code === 'INVALID_PROVIDER_RESPONSE');
});

test('un dominio no verificado se informa como fallo de configuracion', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'The riovoley.com domain is not verified' }), { status: 403 });
  await assert.rejects(new ResendCommunicationsGateway().sendEmail(mail), (error: any) => error.code === 'EMAIL_DOMAIN_NOT_VERIFIED' && /dominio/i.test(error.message));
});

test('la peticion al proveedor tiene un limite de tiempo', async () => {
  let signal: AbortSignal | null | undefined;
  globalThis.fetch = async (_url, options) => { signal = options?.signal; return new Response(JSON.stringify({ id: 'email-1' })); };
  const result = await new ResendCommunicationsGateway().sendEmail(mail);
  assert.equal(result.id, 'email-1');
  assert.ok(signal instanceof AbortSignal);
});

test('un timeout no se convierte en correo enviado', async () => {
  globalThis.fetch = async () => { throw Object.assign(new Error('timeout'), { name: 'TimeoutError' }); };
  await assert.rejects(new ResendCommunicationsGateway().sendEmail(mail), (error: any) => error.code === 'EMAIL_PROVIDER_TIMEOUT' && error.status === 504);
});

test('no permite usar el correo de la aplicacion sin sesion autorizada', async () => {
  let sent = false;
  const gateway = { sendEmail: async () => { sent = true; return { id: 'email-1' }; } };
  const auth = { requireActor: async () => { throw new Error('AUTH_REQUIRED'); } };
  await assert.rejects(new SendEmailUseCase(gateway as any, auth as any).execute(mail, ''), /AUTH_REQUIRED/);
  assert.equal(sent, false);
});

test('rechaza un destinatario invalido antes de contactar al proveedor', async () => {
  let sent = false;
  const gateway = { sendEmail: async () => { sent = true; return { id: 'email-1' }; } };
  await assert.rejects(new SendEmailUseCase(gateway as any, authorized as any).execute({ ...mail, to: 'invalid' }, 'Bearer test'), (error: any) => error.code === 'INVALID_RECIPIENT');
  assert.equal(sent, false);
});

const passwordInput = { authorization: 'Bearer test', userId: 'target', newPassword: 'Temporary123!' };
const passwordGateway = (role = 'administrador', targetRole = 'estudiante') => ({
  requireActor: async () => ({ userId: 'actor', role }),
  getPasswordResetTarget: async () => ({ id: 'target', role: targetRole, email: 'target@example.com' }),
  updateUserPassword: async () => ({}),
  markFirstLoginRequired: async () => {},
});

test('un entrenador no puede cambiar la contrasena de un administrador', async () => {
  const gateway = passwordGateway('entrenador', 'administrador');
  let updated = false;
  gateway.updateUserPassword = async () => { updated = true; return {}; };
  await assert.rejects(new UpdateUserPasswordUseCase(gateway as any).execute(passwordInput), (error: any) => error.code === 'TARGET_NOT_ALLOWED');
  assert.equal(updated, false);
});

test('una contrasena temporal debil se rechaza antes de la actualizacion', async () => {
  const gateway = passwordGateway();
  let updated = false;
  gateway.updateUserPassword = async () => { updated = true; return {}; };
  await assert.rejects(new UpdateUserPasswordUseCase(gateway as any).execute({ ...passwordInput, newPassword: '123456' }), (error: any) => error.code === 'WEAK_PASSWORD');
  assert.equal(updated, false);
});

test('marca primer ingreso despues de actualizar Auth y devuelve el email real de Auth', async () => {
  const gateway = passwordGateway();
  const operations: string[] = [];
  gateway.updateUserPassword = async () => { operations.push('password'); return {}; };
  gateway.markFirstLoginRequired = async () => { operations.push('first_login'); };
  const result = await new UpdateUserPasswordUseCase(gateway as any).execute(passwordInput);
  assert.deepEqual(operations, ['password', 'first_login']);
  assert.equal(result.email, 'target@example.com');
  assert.equal(result.firstLoginUpdated, true);
});

test('conserva el resultado del cambio si falla sincronizar primer ingreso', async () => {
  const gateway = passwordGateway();
  gateway.markFirstLoginRequired = async () => { throw new Error('metadata unavailable'); };
  const result = await new UpdateUserPasswordUseCase(gateway as any).execute(passwordInput);
  assert.equal(result.success, true);
  assert.equal(result.firstLoginUpdated, false);
});
