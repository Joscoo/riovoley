const { test, expect } = require('@playwright/test');
const { openAdminSection, loginAsAdmin } = require('./helpers/adminNavigation');

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test('phase2 athletes tab: filtros y orden con reset consistente', async ({ page }) => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');

  await loginAsAdmin(page);
  await openAdminSection(page, 'usuarios');
  await expect(page.getByRole('main').getByRole('heading', { name: /gesti[oó]n de usuarios/i })).toBeVisible();

  const athletesTab = page.getByRole('tab', { name: /estudiantes/i }).first();
  await expect(athletesTab).toBeVisible();
  await athletesTab.click();

  const search = page.locator('#user-filters-atleta-search');
  const category = page.locator('#user-filters-atleta-category');
  const status = page.locator('#user-filters-atleta-status');
  const sortBy = page.locator('#user-filters-atleta-sort-by');
  const sortOrder = page.locator('#user-filters-atleta-sort-order');
  const reset = page.locator('#user-filters-atleta-reset');

  await expect(search).toBeVisible();
  await expect(category).toBeVisible();
  await expect(status).toBeVisible();
  await expect(sortBy).toBeVisible();
  await expect(sortOrder).toBeVisible();
  await expect(reset).toBeVisible();

  await search.fill('e2e-athletes-phase2');
  await expect(search).toHaveValue('e2e-athletes-phase2');
  await category.selectOption('iniciacion_hombres');
  await expect(category).toHaveValue('iniciacion_hombres');
  await status.selectOption('active');
  await expect(status).toHaveValue('active');
  await sortBy.selectOption('nombre');
  await expect(sortBy).toHaveValue('nombre');
  await sortOrder.selectOption('desc');
  await expect(sortOrder).toHaveValue('desc');

  await reset.click();
  await expect(search).toHaveValue('');
  await expect(category).toHaveValue('');
  await expect(status).toHaveValue('all');
  await expect(sortBy).toHaveValue('apellido');
  await expect(sortOrder).toHaveValue('asc');
});

test('phase2 schedules: filtros y orden con limpiar filtros', async ({ page }) => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');

  await loginAsAdmin(page);
  await openAdminSection(page, 'horarios');
  await expect(page.getByRole('main').getByRole('heading', { name: /gesti[oó]n de horarios/i })).toBeVisible();

  const day = page.locator('#schedules-filter-day');
  const category = page.locator('#schedules-filter-category');
  const sortField = page.locator('#schedules-sort-field');
  const sortDirection = page.locator('#schedules-sort-direction');
  const reset = page.locator('#schedules-clear-filters');

  await expect(day).toBeVisible();
  await expect(category).toBeVisible();
  await expect(sortField).toBeVisible();
  await expect(sortDirection).toBeVisible();
  await expect(reset).toBeVisible();

  await day.selectOption('martes');
  await expect(day).toHaveValue('martes');
  await category.selectOption('open_gym');
  await expect(category).toHaveValue('open_gym');
  await sortField.selectOption('hora_inicio');
  await expect(sortField).toHaveValue('hora_inicio');
  await sortDirection.selectOption('desc');
  await expect(sortDirection).toHaveValue('desc');

  await reset.click();
  await expect(day).toHaveValue('todos');
  await expect(category).toHaveValue('todos');
  await expect(sortField).toHaveValue('dia_semana');
  await expect(sortDirection).toHaveValue('asc');
});
