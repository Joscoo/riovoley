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
  const paymentsButton = page.getByRole('button', { name: /^pagos$/i }).first();

  if (!(await paymentsButton.isVisible()) && (await openSidebarButton.count())) {
    await openSidebarButton.click();
  }
}

async function openSection(page, sectionNameRegex) {
  await openSidebarIfNeeded(page);
  const sectionButton = page.getByRole('button', { name: sectionNameRegex }).first();
  await expect(sectionButton).toBeVisible({ timeout: 15000 });
  await sectionButton.click();
}

async function assertThreeStateSortFromHeaderButton(headerButton) {
  const header = headerButton.locator('xpath=ancestor::th[1]');

  await expect(header).toHaveAttribute('aria-sort', 'none');
  await headerButton.click();
  await expect(header).toHaveAttribute('aria-sort', 'ascending');
  await headerButton.click();
  await expect(header).toHaveAttribute('aria-sort', 'descending');
  await headerButton.click();
  await expect(header).toHaveAttribute('aria-sort', 'none');
}

test('pagos: filtros base + orden de columnas por header', async ({ page }) => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');

  await loginAsAdmin(page);
  await openSection(page, /^pagos$/i);
  await expect(page.getByText(/gestion de pagos/i).first()).toBeVisible({ timeout: 15000 });

  const searchInput = page.locator('#payments-search');
  const statusFilter = page.locator('#payments-status-filter');
  const athleteFilter = page.locator('#payments-athlete-filter');
  const clearButton = page.locator('#payments-clear-filters');

  await expect(searchInput).toBeVisible();
  await expect(statusFilter).toBeVisible();
  await expect(athleteFilter).toBeVisible();
  await expect(clearButton).toBeVisible();

  await searchInput.fill('e2e-filter-sorting-check');
  await expect(searchInput).toHaveValue('e2e-filter-sorting-check');
  await statusFilter.selectOption('vencido');
  await expect(statusFilter).toHaveValue('vencido');

  const athleteOptionsCount = await athleteFilter.locator('option').count();
  if (athleteOptionsCount > 1) {
    await athleteFilter.selectOption({ index: 1 });
    await expect(athleteFilter).not.toHaveValue('');
  }

  const montoHeaderButton = page.getByRole('button', { name: /^monto$/i }).first();
  await expect(montoHeaderButton).toBeVisible();
  await assertThreeStateSortFromHeaderButton(montoHeaderButton);

  await clearButton.click();
  await expect(searchInput).toHaveValue('');
  await expect(statusFilter).toHaveValue('');
  await expect(athleteFilter).toHaveValue('');
});

test('asistencias: filtros del historial + orden por columnas', async ({ page }) => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');

  await loginAsAdmin(page);
  await openSection(page, /^asistencias$/i);
  await expect(page.getByText(/control de asistencias/i).first()).toBeVisible({ timeout: 15000 });

  const dateFrom = page.locator('#fecha-inicio');
  const dateTo = page.locator('#fecha-fin');
  const categoriaFilter = page.locator('#categoria-filter');
  const atletaFilter = page.locator('#atleta-filter');
  const metodoPagoFilter = page.locator('#metodo-pago-filter');
  const clearFiltersButton = page.locator('#attendance-clear-filters');
  const sortByDateButton = page.locator('#attendance-sort-fecha');

  await expect(dateFrom).toBeVisible();
  await expect(dateTo).toBeVisible();
  await expect(categoriaFilter).toBeVisible();
  await expect(atletaFilter).toBeVisible();
  await expect(metodoPagoFilter).toBeVisible();
  await expect(sortByDateButton).toBeVisible();

  const initialDateFrom = await dateFrom.inputValue();
  const initialDateTo = await dateTo.inputValue();

  await sortByDateButton.click();
  await expect(sortByDateButton).toContainText(/fecha/i);

  await categoriaFilter.selectOption('perfeccionamiento_hombres');
  await expect(categoriaFilter).toHaveValue('perfeccionamiento_hombres');

  const atletaOptionsCount = await atletaFilter.locator('option').count();
  if (atletaOptionsCount > 1) {
    await atletaFilter.selectOption({ index: 1 });
    await expect(atletaFilter).not.toHaveValue('');
  }

  const metodoOptionsCount = await metodoPagoFilter.locator('option').count();
  if (metodoOptionsCount > 1) {
    await metodoPagoFilter.selectOption({ index: 1 });
    await expect(metodoPagoFilter).not.toHaveValue('');
  }

  await clearFiltersButton.click();
  await expect(categoriaFilter).toHaveValue('');
  await expect(atletaFilter).toHaveValue('');
  await expect(metodoPagoFilter).toHaveValue('');
  await expect(dateFrom).toHaveValue(initialDateFrom);
  await expect(dateTo).toHaveValue(initialDateTo);

  const historySection = page.getByTestId('attendance-history-table').first();
  await expect(historySection).toBeVisible();
  const dayHeaders = historySection.getByTestId('attendance-day-header');
  const dayCount = await dayHeaders.count();

  if (dayCount > 0) {
    await dayHeaders.first().click();
    const atletaHeaderButton = historySection.getByRole('button', { name: /^atleta$/i }).first();
    await expect(atletaHeaderButton).toBeVisible();
    await assertThreeStateSortFromHeaderButton(atletaHeaderButton);
  } else {
    await expect(page.getByText(/no hay registros de asistencia/i).first()).toBeVisible();
  }
});
