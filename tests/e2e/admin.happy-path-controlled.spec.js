const { test, expect } = require('@playwright/test');

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const ENABLE_MUTATION_FLOW = process.env.E2E_ENABLE_MUTATION_FLOW === 'true';

async function loginAsAdmin(page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');

  await page.getByLabel(/correo/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/contrase/i).fill(ADMIN_PASSWORD);

  const submitButton = page.locator('form button[type="submit"]').first();
  if (await submitButton.count()) {
    await submitButton.click();
  } else {
    await page
      .getByRole('button', { name: /ingresar|iniciar sesion|iniciar sesi/i })
      .first()
      .click();
  }

  await page.waitForURL(/\/admin|\/login/, { timeout: 20000 });
  await expect(page).toHaveURL(/\/admin/);
}

async function openSidebarIfNeeded(page) {
  const openSidebarButton = page.getByRole('button', { name: /abrir menu lateral/i }).first();
  const userManagementButton = page.getByRole('button', { name: /gestion de usuarios/i }).first();

  if (!(await userManagementButton.isVisible()) && (await openSidebarButton.count())) {
    await openSidebarButton.click();
  }
}

async function openSection(page, sectionNameRegex) {
  await openSidebarIfNeeded(page);
  const sectionButton = page.getByRole('button', { name: sectionNameRegex }).first();
  await expect(sectionButton).toBeVisible({ timeout: 15000 });
  await sectionButton.click();
}

test('admin happy path controlado: atleta + pago + asistencia', async ({ page }) => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');
  test.skip(!ENABLE_MUTATION_FLOW, 'Set E2E_ENABLE_MUTATION_FLOW=true to run mutation flow.');

  page.on('dialog', async (dialog) => {
    if (dialog.type() === 'confirm') {
      await dialog.dismiss();
      return;
    }
    await dialog.accept();
  });

  const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-9);
  const firstName = `E2E${uniqueSuffix}`;
  const lastName = 'Flow';
  const fullName = `${firstName} ${lastName}`;
  const email = `e2e.flow.${uniqueSuffix}@example.com`;
  const today = new Date().toISOString().slice(0, 10);

  await loginAsAdmin(page);

  await openSection(page, /gestion de usuarios/i);
  await expect(page.getByText(/gestion de usuarios/i).first()).toBeVisible({ timeout: 15000 });

  const athletesTab = page.getByRole('button', { name: /^atletas$/i }).first();
  await expect(athletesTab).toBeVisible({ timeout: 10000 });
  await athletesTab.click();

  const addAthleteButton = page.getByRole('button', { name: /agregar atleta/i }).first();
  await expect(addAthleteButton).toBeVisible({ timeout: 10000 });
  await addAthleteButton.click();

  const athleteModal = page.getByRole('dialog');
  await expect(athleteModal).toBeVisible({ timeout: 10000 });
  await athleteModal.locator('#nombre').fill(firstName);
  await athleteModal.locator('#apellido').fill(lastName);
  await athleteModal.locator('#email').fill(email);
  await athleteModal.locator('#telefono').fill('0999999999');
  await athleteModal.locator('#fecha_nacimiento').fill('2010-01-01');
  await athleteModal.locator('#categoria').selectOption('iniciacion_hombres');
  await athleteModal.getByRole('button', { name: /^guardar$/i }).click();

  await expect(athleteModal).toBeHidden({ timeout: 60000 });

  await page.locator('#athlete-search').fill(email);
  await expect(page.getByText(email).first()).toBeVisible({ timeout: 30000 });

  await openSection(page, /^pagos$/i);
  await expect(page.getByText(/gestion de pagos/i).first()).toBeVisible({ timeout: 15000 });

  const addPaymentButton = page.getByRole('button', { name: /registrar pago/i }).first();
  await expect(addPaymentButton).toBeVisible({ timeout: 10000 });
  await addPaymentButton.click();

  const paymentModal = page.getByRole('dialog');
  await expect(paymentModal).toBeVisible({ timeout: 10000 });
  await paymentModal.locator('#student_id').fill(firstName);
  await paymentModal.locator('li').filter({ hasText: fullName }).first().click();
  await paymentModal.locator('#monto').fill('25');
  await paymentModal.locator('#fecha_pago').fill(today);
  await paymentModal.getByRole('button', { name: /^guardar$/i }).click();

  await expect(paymentModal).toBeHidden({ timeout: 60000 });

  await page.locator('#payments-search').fill(firstName);
  await expect(page.getByText(fullName).first()).toBeVisible({ timeout: 30000 });

  await openSection(page, /^asistencias$/i);
  await expect(page.getByText(/control de asistencias/i).first()).toBeVisible({ timeout: 15000 });

  await page.getByRole('button', { name: /registro/i }).first().click();
  const attendanceSearch = page.getByPlaceholder(/buscar atleta por nombre/i).first();
  await expect(attendanceSearch).toBeVisible({ timeout: 10000 });
  await attendanceSearch.fill(firstName);

  const athleteRow = page
    .locator('div')
    .filter({ hasText: firstName })
    .filter({ has: page.getByRole('button', { name: /marcar asistencia con/i }).first() })
    .first();
  await expect(athleteRow).toBeVisible({ timeout: 30000 });

  const monthlyButton = athleteRow.getByRole('button', { name: /marcar asistencia con mensualidad/i }).first();
  if (await monthlyButton.count()) {
    await monthlyButton.click();
  } else {
    await athleteRow.getByRole('button', { name: /marcar asistencia con/i }).first().click();
  }

  await expect(athleteRow.getByRole('button', { name: /eliminar asistencia/i }).first()).toBeVisible({ timeout: 15000 });
});
