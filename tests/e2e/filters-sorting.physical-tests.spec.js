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
  const sectionButton = page.getByRole('button', { name: /tests fisicos|tests f.sicos/i }).first();

  if (!(await sectionButton.isVisible()) && (await openSidebarButton.count())) {
    await openSidebarButton.click();
  }
}

test('physical-tests: filtros + orden + limpiar filtros', async ({ page }) => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');

  await loginAsAdmin(page);
  await openSidebarIfNeeded(page);

  const sectionButton = page.getByRole('button', { name: /tests fisicos|tests f.sicos/i }).first();
  await expect(sectionButton).toBeVisible({ timeout: 15000 });
  await sectionButton.click();
  await expect(page.getByText(/gestion de tests fisicos/i).first()).toBeVisible({ timeout: 15000 });

  const search = page.locator('#search-tests');
  const athleteFilter = page.locator('#physical-tests-athlete-filter');
  const startDate = page.locator('#physical-tests-start-date');
  const endDate = page.locator('#physical-tests-end-date');
  const sortField = page.locator('#physical-tests-sort-field');
  const sortDirection = page.locator('#physical-tests-sort-direction');
  const onlyPending = page.locator('#physical-tests-only-pending');
  const clearFilters = page.locator('#physical-tests-clear-filters');

  await expect(search).toBeVisible();
  await expect(athleteFilter).toBeVisible();
  await expect(startDate).toBeVisible();
  await expect(endDate).toBeVisible();
  await expect(sortField).toBeVisible();
  await expect(sortDirection).toBeVisible();
  await expect(onlyPending).toBeVisible();
  await expect(clearFilters).toBeVisible();

  await search.fill('e2e-physical-tests');
  await expect(search).toHaveValue('e2e-physical-tests');

  const athleteOptionsCount = await athleteFilter.locator('option').count();
  if (athleteOptionsCount > 1) {
    await athleteFilter.selectOption({ index: 1 });
    await expect(athleteFilter).not.toHaveValue('');
  }

  await startDate.fill('2026-01-01');
  await endDate.fill('2026-12-31');
  await expect(startDate).toHaveValue('2026-01-01');
  await expect(endDate).toHaveValue('2026-12-31');

  await sortField.selectOption('peso');
  await expect(sortField).toHaveValue('peso');
  await sortDirection.selectOption('asc');
  await expect(sortDirection).toHaveValue('asc');

  await onlyPending.check();
  await expect(onlyPending).toBeChecked();

  await clearFilters.click();
  await expect(search).toHaveValue('');
  await expect(athleteFilter).toHaveValue('');
  await expect(startDate).toHaveValue('');
  await expect(endDate).toHaveValue('');
  await expect(sortField).toHaveValue('fecha_test');
  await expect(sortDirection).toHaveValue('desc');
  await expect(onlyPending).not.toBeChecked();
});
