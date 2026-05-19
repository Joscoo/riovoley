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

async function openSidebarIfNeeded(page, sectionRegex) {
  const openSidebarButton = page.getByRole('button', { name: /abrir menu lateral/i }).first();
  const sectionButton = page.getByRole('button', { name: sectionRegex }).first();

  if (!(await sectionButton.isVisible()) && (await openSidebarButton.count())) {
    await openSidebarButton.click();
  }
}

async function openSection(page, sectionRegex) {
  await openSidebarIfNeeded(page, sectionRegex);
  const sectionButton = page.getByRole('button', { name: sectionRegex }).first();
  await expect(sectionButton).toBeVisible({ timeout: 15000 });
  await sectionButton.click();
}

test('phase2 athletes tab: filtros y orden con reset consistente', async ({ page }) => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');

  await loginAsAdmin(page);
  await openSection(page, /gestion de usuarios|gesti.n de usuarios/i);
  await expect(page.getByText(/gestion de usuarios|gesti.n de usuarios/i).first()).toBeVisible({ timeout: 15000 });

  const athletesTab = page.getByRole('button', { name: /estudiantes/i }).first();
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
  await openSection(page, /^horarios$/i);
  await expect(page.getByText(/gestion de horarios/i).first()).toBeVisible({ timeout: 15000 });

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
