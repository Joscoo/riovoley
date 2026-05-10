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

async function login(page, email, password) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
  await page.getByLabel('Correo Electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);

  const submitButton = page.locator('form button[type="submit"]').first();
  if (await submitButton.count()) {
    await submitButton.click();
  } else {
    await page
      .getByRole('button', { name: /ingresar|iniciar sesion|iniciar sesión|iniciar sesión con supabase/i })
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

    await expect(page.getByText(role.expected).first()).toBeVisible({ timeout: 15000 });

    const bell = page.getByRole('button', { name: /notificaciones/i }).first();
    await expect(bell).toBeVisible({ timeout: 10000 });
    await bell.click();
    await expect(page.getByText(/notificaciones/i).first()).toBeVisible({ timeout: 10000 });
  });
}
