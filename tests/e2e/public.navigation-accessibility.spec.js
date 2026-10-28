const { test, expect } = require('@playwright/test');

for (const route of ['/', '/sobre', '/horarios', '/login', '/reset-password']) {
  test(`public page has a main landmark and a keyboard skip link: ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('main')).not.toHaveAttribute('aria-busy', 'true');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Saltar al contenido' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
  });
}

test('mobile navigation closes with Escape and restores keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Abrir menú', exact: true });
  await toggle.click();
  await expect(page.getByRole('button', { name: 'Cerrar menú', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#mobile-navigation a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#mobile-navigation')).toBeHidden();
});

test('mobile menu keeps keyboard focus within its controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
  await page.locator('#mobile-navigation a').last().focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Cerrar menú', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#mobile-navigation a').first()).toBeFocused();
});
