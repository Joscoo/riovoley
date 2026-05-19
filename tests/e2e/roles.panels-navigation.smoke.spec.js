const { test, expect } = require('@playwright/test');

const CREDENTIALS = [
  {
    name: 'admin',
    email: process.env.E2E_ADMIN_EMAIL,
    password: process.env.E2E_ADMIN_PASSWORD,
    route: '/admin',
    expected: /dashboard|gestion de usuarios/i,
  },
  {
    name: 'trainer',
    email: process.env.E2E_TRAINER_EMAIL,
    password: process.env.E2E_TRAINER_PASSWORD,
    route: '/entrenador',
    expected: /panel entrenador|gestion de usuarios|anuncios/i,
  },
  {
    name: 'student',
    email: process.env.E2E_STUDENT_EMAIL,
    password: process.env.E2E_STUDENT_PASSWORD,
    route: '/estudiante',
    expected: /mi panel|anuncios|estado de mensualidad/i,
  },
];

async function fillFirstVisible(page, locators, value) {
  for (const locator of locators) {
    const target = locator.first();
    if (await target.count()) {
      await target.fill(value);
      return;
    }
  }
  throw new Error('No se encontro un input compatible para completar el login.');
}

async function expectAnyVisibleText(page, pattern, timeout = 15000) {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const locator = page.getByText(pattern);
    const count = await locator.count();
    for (let index = 0; index < count; index += 1) {
      if (await locator.nth(index).isVisible()) {
        return;
      }
    }
    await page.waitForTimeout(250);
  }

  throw new Error(`No hay coincidencias visibles para: ${pattern}`);
}

async function login(page, email, password) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');

  await fillFirstVisible(page, [
    page.getByLabel(/correo electr(o|ó|Ã³)nico/i),
    page.getByPlaceholder(/correo electr(o|ó|Ã³)nico/i),
    page.getByLabel(/email/i),
    page.locator('input[type="email"]'),
  ], email);

  await fillFirstVisible(page, [
    page.getByLabel(/contras(e|é|Ã©)(n|ñ|Ã±)a/i),
    page.getByPlaceholder(/contras(e|é|Ã©)(n|ñ|Ã±)a/i),
    page.locator('input[type="password"]'),
  ], password);

  const submitButton = page.locator('form button[type="submit"]').first();
  if (await submitButton.count()) {
    await submitButton.click();
  } else {
    await page
      .getByRole('button', { name: /ingresar|iniciar sesi(o|ó|Ã³)n( con supabase)?/i })
      .first()
      .click();
  }
}

for (const role of CREDENTIALS) {
  test(`role panel smoke: ${role.name}`, async ({ page }) => {
    test.skip(!role.email || !role.password, `Missing credentials for ${role.name}`);

    await login(page, role.email, role.password);
    await page.waitForURL(new RegExp(`${role.route}|/login`), { timeout: 20000 });
    await expect(page).toHaveURL(new RegExp(role.route));

    await expectAnyVisibleText(page, role.expected, 15000);

    const bell = page.getByRole('button', { name: /notificaciones/i }).first();
    await expect(bell).toBeVisible({ timeout: 10000 });
    await bell.click();
    await expect(page.getByText(/notificaciones/i).first()).toBeVisible({ timeout: 10000 });
  });
}
