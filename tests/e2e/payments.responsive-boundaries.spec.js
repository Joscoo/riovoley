const { test, expect } = require('@playwright/test');
const { loginAsAdmin, openAdminSection } = require('./helpers/adminNavigation');
const { assertPaymentAmountsSorted } = require('./helpers/paymentsSorting');

for (const width of [481, 600, 767, 768]) {
  test(`pagos: ordenación accesible en límite adaptable ${width}px`, async ({ page }) => {
    test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, 'Requiere credenciales E2E.');
    await page.setViewportSize({ width, height: 900 });
    await loginAsAdmin(page);
    await openAdminSection(page, 'pagos');
    await expect(page.getByRole('heading', { name: /gesti.n de pagos/i })).toBeVisible();
    const controls = page.getByRole('group', { name: 'Ordenar pagos' });
    const button = width < 768
      ? controls.getByRole('button', { name: /^Ordenar por Monto:/ })
      : page.getByRole('button', { name: /^Monto$/ });
    if (width < 768) await expect(controls).toBeVisible();
    else await expect(controls).toBeHidden();
    await expect(button).toBeVisible();
    for (const descending of [false, true]) {
      await assertPaymentAmountsSorted(page, descending, button);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
