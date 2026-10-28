const { test, expect } = require('@playwright/test');
const { openAdminSection, loginAsAdmin } = require('./helpers/adminNavigation');

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

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
  await openAdminSection(page, 'usuarios');
  await expect(page.getByRole('main').getByRole('heading', { name: /gesti[oó]n de usuarios/i })).toBeVisible();

  const athletesTab = page.getByRole('tab', { name: /estudiantes/i }).first();
  await expect(athletesTab).toBeVisible();
  await athletesTab.click();
  await assertFiltersResetForTab(page, 'atleta', { expectCategory: true });

  const trainersTab = page.getByRole('tab', { name: /entrenadores/i }).first();
  await expect(trainersTab).toBeVisible();
  await trainersTab.click();
  await assertFiltersResetForTab(page, 'entrenador', { expectCategory: false });

  const adminsTab = page.getByRole('tab', { name: /administradores/i }).first();
  await expect(adminsTab).toBeVisible();
  await adminsTab.click();
  await assertFiltersResetForTab(page, 'administrador', { expectCategory: false });
});
