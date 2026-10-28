const { test, expect } = require('@playwright/test');
const { openAdminSection, loginAsAdmin } = require('./helpers/adminNavigation');
const { assertPaymentAmountsSorted } = require('./helpers/paymentsSorting');

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

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
  await openAdminSection(page, 'pagos');
  await expect(page.getByRole('main').getByRole('heading', { name: /gesti[oó]n de pagos/i })).toBeVisible();

  const searchInput = page.locator('#payments-search');
  const statusFilter = page.locator('#payments-status-filter');
  const athleteFilter = page.locator('#payments-athlete-filter');
  const clearButton = page.getByRole('main').getByRole('button', { name: /^limpiar$/i });

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

  await clearButton.click();
  await expect(searchInput).toHaveValue('');
  await expect(statusFilter).toHaveValue('');
  await expect(athleteFilter).toHaveValue('');

  const mobileSort = page.getByRole('group', { name: 'Ordenar pagos' });
  const onCards = await mobileSort.isVisible();
  const montoButton = onCards
    ? mobileSort.getByRole('button', { name: /^Ordenar por Monto:/ })
    : page.getByRole('button', { name: /^monto$/i }).first();
  const header = montoButton.locator('xpath=ancestor::th[1]');
  const assertSortState = async (state, description) => {
    if (onCards) await expect(montoButton).toHaveAccessibleName(`Ordenar por Monto: ${description}`);
    else await expect(header).toHaveAttribute('aria-sort', state);
  };
  await expect(montoButton).toBeVisible();
  await assertSortState('none', 'sin ordenar');
  await assertPaymentAmountsSorted(page, false, montoButton);
  await assertSortState('ascending', 'ascendente');
  await assertPaymentAmountsSorted(page, true, montoButton);
  await assertSortState('descending', 'descendente');
  await montoButton.click();
  await assertSortState('none', 'sin ordenar');

  const initialOverflow = await page.evaluate(() => document.body.style.overflow);
  await page.getByRole('main').getByRole('button', { name: /registrar pago|agregar pago/i }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe(initialOverflow);
});

test('asistencias: filtros del historial + orden por columnas', async ({ page }) => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');

  await loginAsAdmin(page);
  await openAdminSection(page, 'asistencias');
  await expect(page.getByRole('main').getByRole('heading', { name: /control de asistencias/i })).toBeVisible();

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
    const controlledId = await dayHeaders.first().locator('button[aria-expanded]').getAttribute('aria-controls');
    const dayToggle = historySection.locator(`button[aria-controls="${controlledId}"]`);
    if (await dayToggle.getAttribute('aria-expanded') === 'false') await dayToggle.click();
    await expect(dayToggle).toHaveAttribute('aria-expanded', 'true');
    const atletaHeaderButton = historySection.getByRole('button', { name: /^atleta$/i }).first();
    if (await atletaHeaderButton.count()) {
      await expect(atletaHeaderButton).toBeVisible();
      await assertThreeStateSortFromHeaderButton(atletaHeaderButton);
    }
  } else {
    await expect(page.getByText(/no hay registros de asistencia/i).first()).toBeVisible();
  }
});
