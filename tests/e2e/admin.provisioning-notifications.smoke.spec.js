const { test, expect } = require('@playwright/test');
const { openAdminSection, loginAsAdmin } = require('./helpers/adminNavigation');

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test('admin smoke: provisioning + notifications entrypoints', async ({ page }) => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');

  await loginAsAdmin(page);
  await openAdminSection(page, 'usuarios');
  await expect(page.getByRole('main').getByRole('heading', { name: /gesti[oó]n de usuarios/i })).toBeVisible();

  const athletesTab = page.getByRole('tab', { name: /estudiantes/i }).first();
  await expect(athletesTab).toBeVisible({ timeout: 10000 });
  await athletesTab.click();
  await expect(page.locator('#user-filters-atleta-search')).toBeVisible();

  const addAthleteButton = page.getByRole('button', { name: /agregar estudiante/i }).first();
  await expect(addAthleteButton).toBeVisible({ timeout: 10000 });
  await addAthleteButton.click();

  await expect(page.getByRole('dialog')).toContainText(/agregar nuevo estudiante/i);
  await page.getByRole('button', { name: /cerrar modal/i }).first().click();

  const notificationsButton = page.getByRole('button', { name: /notificaciones/i }).first();
  await expect(notificationsButton).toBeVisible({ timeout: 10000 });
  await notificationsButton.click();
  await expect(page.getByText(/^Notificaciones$/).first()).toBeVisible({ timeout: 10000 });
});
