const { test, expect } = require('@playwright/test');
const { openAdminSection, loginAsAdmin } = require('./helpers/adminNavigation');

test('admin: every module opens without a JavaScript crash', async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, 'Admin credentials required');
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await loginAsAdmin(page);

  for (const [section, heading] of [
    ['dashboard', /dashboard/i],
    ['reportes', /reportes/i],
    ['revision-financiera', /financiera/i],
    ['usuarios', /gesti[oó]n de usuarios/i],
    ['pagos', /gesti[oó]n de pagos/i],
    ['asistencias', /control de asistencias/i],
    ['horarios', /gesti[oó]n de horarios/i],
    ['tests-fisicos', /tests f[ií]sicos/i],
    ['anuncios', /anuncios/i],
    ['gamificacion', /gamificaci[oó]n/i],
    ['configuracion', /perfil|configuraci[oó]n/i],
  ]) {
    await test.step(section, async () => {
      await openAdminSection(page, section);
      await expect(page.getByRole('main').getByRole('heading', { name: heading }).first()).toBeVisible();
      expect(errors, `JavaScript errors after opening ${section}`).toEqual([]);
    });
  }
});
