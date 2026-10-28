const { test, expect } = require('@playwright/test');
const { randomUUID } = require('node:crypto');
const { loginAsAdmin, openAdminSection } = require('./helpers/adminNavigation');
const ENABLE_MUTATION_FLOW = process.env.E2E_ENABLE_MUTATION_FLOW === 'true';

test('admin happy path controlado: atleta + pago + asistencia', async ({ page }, testInfo) => {
  test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');
  test.skip(!ENABLE_MUTATION_FLOW, 'Set E2E_ENABLE_MUTATION_FLOW=true to run mutation flow.');
  // Las altas se autorizan exclusivamente en el entorno descartable de este arnés.
  expect(process.env.E2E_LOCAL_LABEL, 'Usar playwright.local.config.cjs y el arnés aislado').toBeTruthy();
  expect(testInfo.project.use.baseURL).toBe('http://127.0.0.1:6100');
  require('../../scripts/e2e/local/safety.cjs').readLocal();

  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  const firstName = `E2E${suffix}`;
  const fullName = `${firstName} Flow`;
  const email = `e2e.flow.${suffix}@example.test`;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

  await loginAsAdmin(page);
  // Ocultar visualmente las contraseñas temporales en capturas, sin alterar su valor.
  await page.addStyleTag({ content: '[role="dialog"] code { -webkit-text-security: disc; }' });
  await openAdminSection(page, 'usuarios');
  await page.getByRole('tab', { name: /Estudiantes/i }).click();
  await page.getByRole('button', { name: /Agregar Estudiante/i }).first().click();
  const form = page.getByRole('dialog', { name: 'Agregar Nuevo Estudiante' });
  await expect(form).toBeVisible();
  await form.getByPlaceholder('Ingrese el nombre', { exact: true }).fill(firstName);
  await form.getByPlaceholder('Ingrese el apellido').fill('Flow');
  await form.locator('input[type="email"]').fill(email);
  await form.locator('input[type="tel"]').fill('0999999999');
  await form.locator('input[type="date"]').fill('2010-01-01');
  await form.locator('select').selectOption('iniciacion_hombres');
  await form.getByRole('radio', { name: 'No, enviar despues' }).check();
  await form.getByRole('button', { name: /^Crear$/i }).click();

  const credentials = page.getByRole('dialog', { name: 'Credenciales de la cuenta creada' });
  await expect(credentials).toBeVisible({ timeout: 30000 });
  const password = await credentials.locator('code').textContent();
  // Solo runtime ignorado; la revisión de privacidad conoce también claves creadas por UI.
  const fs = require('node:fs');
  const path = require('node:path');
  const { runtime } = require('../../scripts/e2e/local/safety.cjs');
  fs.appendFileSync(path.join(runtime, 'observed-secrets.jsonl'), JSON.stringify({ password }) + '\n');
  await credentials.getByRole('button', { name: /^Cerrar$/i }).click();
  await expect(form).toBeHidden();
  await page.locator('#user-filters-atleta-search').fill(email);
  await expect(page.getByText(email, { exact: true }).first()).toBeVisible();

  await openAdminSection(page, 'pagos');
  await page.getByRole('button', { name: /Registrar Pago/i }).first().click();
  const payment = page.getByRole('dialog');
  await payment.locator('#student_id').fill(firstName);
  await payment.getByRole('button', { name: new RegExp(fullName, 'i') }).click();
  await payment.locator('#membership_type_id').selectOption({ label: 'Mensualidad normal' });
  await expect(payment.locator('#monto')).toBeDisabled();
  await expect(payment.locator('#monto')).toHaveValue(/^\$\s*35[,.]00$/);
  await payment.locator('#fecha_pago').fill(today);
  await payment.getByRole('button', { name: /^Guardar$/i }).click();
  await expect(payment).toBeHidden({ timeout: 30000 });
  await page.locator('#payments-search').fill(firstName);
  const paymentRow = page.locator('tbody tr').filter({ hasText: fullName });
  await expect(paymentRow).toHaveCount(1);
  await expect(paymentRow.locator('td[data-label="Monto"]')).toHaveText(/^\$\s*35[,.]00$/);

  await openAdminSection(page, 'asistencias');
  await page.getByRole('button', { name: /Registro R.pido/i }).click();
  await page.locator('#attendance-date').fill(today);
  await page.getByPlaceholder('Buscar atleta por nombre...').fill(firstName);
  const athleteRow = page.getByTestId('attendance-athlete-row').filter({ hasText: firstName });
  await expect(athleteRow).toHaveCount(1);
  const present = athleteRow.getByRole('button', { name: 'Marcar como presente', exact: true });
  await expect(present).toBeVisible(); // La mensualidad debe habilitar el control correspondiente.
  const persistedAttendance = page.waitForResponse(response =>
    new URL(response.url()).pathname === '/rest/v1/attendances' && response.request().method() === 'POST');
  await present.click();
  const attendanceResponse = await persistedAttendance;
  expect(attendanceResponse.ok(), 'El backend debe confirmar la inserción antes de recargar').toBe(true);
  await expect(present).toHaveClass(/(?:^|\s)bg-emerald-500(?:\s|$)/);

  // Una recarga obliga a recuperar datos persistidos, sin mocks de Auth/REST.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Abrir guia del panel' })).toBeVisible();
  await openAdminSection(page, 'pagos');
  await page.locator('#payments-search').fill(firstName);
  await expect(page.locator('tbody tr').filter({ hasText: fullName }).locator('td[data-label="Monto"]')).toHaveText(/^\$\s*35[,.]00$/);
  await openAdminSection(page, 'asistencias');
  await page.getByRole('button', { name: /Registro R.pido/i }).click();
  await page.locator('#attendance-date').fill(today);
  await page.getByPlaceholder('Buscar atleta por nombre...').fill(firstName);
  await expect(page.getByTestId('attendance-athlete-row').filter({ hasText: firstName }).getByRole('button', { name: 'Marcar como presente', exact: true })).toHaveClass(/(?:^|\s)bg-emerald-500(?:\s|$)/);
});
