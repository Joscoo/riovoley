const { test, expect } = require('@playwright/test');
const { loginAsRole, openPanelSection } = require('./helpers/adminNavigation');

for (const [role, credential, sections] of [
  ['trainer', 'TRAINER', ['usuarios', 'asistencias', 'tests-fisicos', 'pagos', 'anuncios', 'configuracion']],
  ['student', 'STUDENT', ['anuncios', 'progreso', 'mensualidad', 'asistencias', 'tests-fisicos', 'perfil']],
]) {
  test(`${role}: every module renders without a JavaScript crash`, async ({ page }) => {
    test.skip(!process.env[`E2E_${credential}_EMAIL`] || !process.env[`E2E_${credential}_PASSWORD`], `Credentials required for ${role}`);
    test.setTimeout(120_000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await loginAsRole(page, role);
    for (const section of sections) {
      await test.step(section, async () => {
        await openPanelSection(page, role, section);
        await expect(page.locator(`[data-guide-id="${role}-menu-${section}"]:visible`)).toHaveAttribute('aria-current', 'page');
        await expect(page.getByRole('main').getByRole('heading').first()).toBeVisible();
        expect(errors, `JavaScript errors in ${role}/${section}`).toEqual([]);
      });
    }
  });
}
