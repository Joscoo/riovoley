// Auditoría: sesión anónima, sin solicitudes de autenticación ni escrituras remotas.
const { test, expect } = require('@playwright/test');
for (const route of ['/admin', '/entrenador', '/estudiante']) {
  test(`audit: anonymous access cannot render protected panel ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole('heading', { name: /acceso denegado/i })).toBeVisible();
    await expect(page.locator('[data-guide-id$="menu-dashboard"]')).toHaveCount(0);
  });
}
