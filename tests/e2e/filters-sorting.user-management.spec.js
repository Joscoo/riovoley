const { test, expect } = require('@playwright/test');

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

async function loginAsAdmin(page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');

  await page.getByLabel(/correo/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/contrase|password/i).fill(ADMIN_PASSWORD);

  const submitButton = page.locator('form button[type="submit"]').first();
  if (await submitButton.count()) {
    await submitButton.click();
  } else {
    await page.getByRole('button', { name: /ingresar|iniciar sesion|iniciar sesi/i }).first().click();
  }

  await page.waitForURL(/\/admin|\/login/, { timeout: 20000 });
  await expect(page).toHaveURL(/\/admin/);
}

async function openSidebarIfNeeded(page) {
  const openSidebarButton = page.getByRole('button', { name: /abrir menu lateral/i }).first();
  const usersButton = page.getByRole('button', { name: /gestion de usuarios|gesti.n de usuarios/i }).first();

  if (!(await usersButton.isVisible()) && (await openSidebarButton.count())) {
    await openSidebarButton.click();
  }
}

async function openUsersSection(page) {
  await openSidebarIfNeeded(page);
  const usersButton = page.getByRole('button', { name: /gestion de usuarios|gesti.n de usuarios/i }).first();
  await expect(usersButton).toBeVisible({ timeout: 15000 });
  await usersButton.click();
  await expect(page.getByText(/gestion de usuarios|gesti.n de usuarios/i).first()).toBeVisible({ timeout: 15000 });
}

async function assertFiltersResetForTab(page, scope, { expectCategory = false } = {}) {
  const search = page.locator(`#user-filters-${scope}-search`);
  const status = page.locator(`#user-filters-${scope}-status`);
  const sortBy = page.locator(`#user-filters-${scope}-sort-by`);
  const sortOrder = page.locator(`#user-filters-${scope}-sort-order`);
  const reset = page.locator(`#user-filters-${scope}-reset`);
  const category = page.locator(`#user-filters-${scope}-category`);

  await expect(search).toBeVisible();
  await expect(status).toBeVisible();
  await expect(sortBy).toBeVisible();
  await expect(sortOrder).toBeVisible();
  await expect(reset).toBeVisible();

  await search.fill(`e2e-${scope}-search`);
  await expect(search).toHaveValue(`e2e-${scope}-search`);

  await status.selectOption('active');
  await expect(status).toHaveValue('active');

  await sortBy.selectOption('nombre');
  await expect(sortBy).toHaveValue('nombre');

  await sortOrder.selectOption('desc');
  await expect(sortOrder).toHaveValue('desc');

  if (expectCategory) {
    await expect(category).toBeVisible();
    await category.selectOption('iniciacion_hombres');
    await expect(category).toHaveValue('iniciacion_hombres');
  } else {
    await expect(category).toHaveCount(0);
  }

  await reset.click();

  await expect(search).toHaveValue('');
  await expect(status).toHaveValue('all');
  await expect(sortBy).toHaveValue('apellido');
  await expect(sortOrder).toHaveValue('asc');

  if (expectCategory) {
    await expect(category).toHaveValue('');
  }
}

test('user-management tabs: filtros y orden se actualizan y resetean por tab', async ({ page }) => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');

  await loginAsAdmin(page);
  await openUsersSection(page);

  const athletesTab = page.getByRole('button', { name: /estudiantes/i }).first();
  await expect(athletesTab).toBeVisible();
  await athletesTab.click();
  await assertFiltersResetForTab(page, 'atleta', { expectCategory: true });

  const trainersTab = page.getByRole('button', { name: /entrenadores/i }).first();
  await expect(trainersTab).toBeVisible();
  await trainersTab.click();
  await assertFiltersResetForTab(page, 'entrenador', { expectCategory: false });

  const adminsTab = page.getByRole('button', { name: /administradores/i }).first();
  await expect(adminsTab).toBeVisible();
  await adminsTab.click();
  await assertFiltersResetForTab(page, 'administrador', { expectCategory: false });
});
