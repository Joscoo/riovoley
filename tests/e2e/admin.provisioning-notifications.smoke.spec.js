const { test, expect } = require('@playwright/test');

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

async function loginAsAdmin(page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');

  await page.getByLabel('Correo Electrónico').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASSWORD);

  const submitButton = page.locator('form button[type="submit"]').first();
  if (await submitButton.count()) {
    await submitButton.click();
  } else {
    await page
      .getByRole('button', { name: /ingresar|iniciar sesion|iniciar sesión|iniciar sesión con supabase/i })
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

test('admin smoke: provisioning + notifications entrypoints', async ({ page }) => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');

  await loginAsAdmin(page);
  await openSidebarIfNeeded(page);

  const userManagementButton = page.getByRole('button', { name: /gestion de usuarios/i }).first();
  await expect(userManagementButton).toBeVisible({ timeout: 15000 });
  await userManagementButton.click();

  await expect(page.getByText(/gestion de usuarios/i).first()).toBeVisible({ timeout: 15000 });

  const athletesTab = page.getByRole('button', { name: /^atletas$/i }).first();
  await expect(athletesTab).toBeVisible({ timeout: 10000 });
  await athletesTab.click();
  await expect(page.getByText(/^Atletas$/).first()).toBeVisible({ timeout: 10000 });

  const addAthleteButton = page.getByRole('button', { name: /agregar atleta/i }).first();
  await expect(addAthleteButton).toBeVisible({ timeout: 10000 });
  await addAthleteButton.click();

  await expect(page.getByText(/agregar nuevo atleta/i).first()).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: /cerrar modal/i }).first().click();

  const notificationsButton = page.getByRole('button', { name: /notificaciones/i }).first();
  await expect(notificationsButton).toBeVisible({ timeout: 10000 });
  await notificationsButton.click();
  await expect(page.getByText(/^Notificaciones$/).first()).toBeVisible({ timeout: 10000 });
});
