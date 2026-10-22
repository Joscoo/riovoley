const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const dotenv = require('dotenv');

test('recovery: un codigo PKCE valido se intercambia una sola vez al abrir el correo', async ({ page }) => {
  const env = Object.assign({}, ...['.env', '.env.local'].filter((file) => fs.existsSync(file)).map((file) => dotenv.parse(fs.readFileSync(file))), process.env);
  const storageKey = `sb-${new URL(env.REACT_APP_SUPABASE_URL).hostname.split('.')[0]}-auth-token-code-verifier`;
  await page.addInitScript(({ key }) => {
    localStorage.setItem(key, JSON.stringify('test-code-verifier/recovery'));
  }, { key: storageKey });
  const user = { id: '11111111-1111-4111-8111-111111111111', email: 'recovery@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} };
  const encode = (data) => Buffer.from(JSON.stringify(data)).toString('base64url');
  const accessToken = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.test-signature`;
  let exchanges = 0;
  await page.route('**/auth/v1/**', async (route) => {
    let body = user;
    if (new URL(route.request().url()).pathname.endsWith('/token')) {
      exchanges += 1;
      expect(route.request().postDataJSON().code_verifier).toBe('test-code-verifier');
      body = { access_token: accessToken, refresh_token: 'test-refresh-token', expires_in: 3600, token_type: 'bearer', user };
    }
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
  });
  await page.route('**/rest/v1/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.goto('/reset-password?code=valid-recovery-code');
  await expect(page.getByLabel('Nueva contraseña', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/reset-password$/);
  expect(exchanges).toBe(1);
});

test('recovery: un enlace expirado no habilita el formulario', async ({ page }) => {
  await page.goto('/reset-password#error=access_denied&error_code=otp_expired');
  await expect(page.getByText('Enlace inválido o expirado')).toBeVisible();
  await expect(page.locator('#new-password')).toHaveCount(0);
});

test('recovery: un codigo rechazado no se trata como una sesion valida', async ({ page }) => {
  await page.route('**/auth/v1/token**', (route) => route.fulfill({
    status: 400, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid recovery code' }),
  }));
  await page.goto('/reset-password?code=invalid-recovery-code');
  await expect(page.getByText('Enlace inválido o expirado')).toBeVisible();
  await expect(page.locator('#new-password')).toHaveCount(0);
});

test('recovery: verifica el enlace, cambia una vez y cierra la sesion de recuperacion', async ({ page }) => {
  // All Auth/REST writes are intercepted: this test never changes a real account.
  const user = { id: '11111111-1111-4111-8111-111111111111', email: 'recovery@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} };
  const encode = (data) => Buffer.from(JSON.stringify(data)).toString('base64url');
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.test-signature`;
  let verified = false;
  let passwordUpdates = 0;
  let firstLoginCleared = false;
  let signedOut = false;
  const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    let body = user;
    if (pathname.endsWith('/verify')) {
      const payload = request.postDataJSON();
      verified = payload.token_hash === 'recovery-test-hash' && payload.type === 'recovery';
      body = { access_token: token, refresh_token: 'test-refresh-token', expires_in: 3600, token_type: 'bearer', user };
    } else if (pathname.endsWith('/user') && request.method() === 'PUT') {
      expect(verified).toBe(true);
      expect(request.postDataJSON().password).toBe('Recovery123!');
      passwordUpdates += 1;
    } else if (pathname.endsWith('/logout')) {
      signedOut = true;
      return route.fulfill({ status: 204, headers });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(body) });
  });
  await page.route('**/rest/v1/**', async (route) => {
    if (route.request().method() === 'PATCH') firstLoginCleared = route.request().postDataJSON().first_login === false;
    await route.fulfill({ status: 200, contentType: 'application/json', headers, body: '[]' });
  });
  await page.goto('/reset-password?token_hash=recovery-test-hash&type=recovery');
  await page.getByLabel('Nueva contraseña', { exact: true }).fill('Recovery123!');
  await page.getByLabel('Confirmar contraseña', { exact: true }).fill('Recovery123!');
  await expect(page).toHaveURL(/\/reset-password$/);
  await page.getByRole('button', { name: 'Actualizar Contraseña' }).click();
  await expect(page.getByText(/Contraseña actualizada correctamente/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Actualizar Contraseña' })).toBeDisabled();
  await expect(page).toHaveURL(/\/login$/);
  expect(passwordUpdates).toBe(1);
  expect(firstLoginCleared).toBe(true);
  expect(signedOut).toBe(true);
});
