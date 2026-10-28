const { expect } = require('@playwright/test');

async function assertPaymentAmountsSorted(page, descending, sortButton) {
  const waitForPayments = () => page.waitForResponse(response => {
    const url = new URL(response.url());
    return url.pathname === '/rest/v1/payments' && response.request().method() === 'GET' &&
      url.searchParams.get('order') === `monto.${descending ? 'desc' : 'asc'}`;
  });
  const sortedResponse = waitForPayments();
  await sortButton.click();
  expect((await sortedResponse).ok()).toBe(true);
  const amounts = [];
  const next = page.getByRole('main').getByRole('button', { name: 'Siguiente', exact: true }).first();
  // Se comprueba el conjunto paginado: una página puede contener solo empates.
  for (let pageNumber = 1; pageNumber <= 100; pageNumber += 1) {
    await expect(page.getByText('Cargando pagos...', { exact: true })).toBeHidden();
    await expect(page.getByText(new RegExp(`^P.gina ${pageNumber} de \\d+$`)).first()).toBeVisible();
    await expect(page.locator('td[data-label="Monto"]').first()).toBeVisible();
    amounts.push(...(await page.locator('td[data-label="Monto"]').allTextContents())
      .map(value => Number(value.replace(/[^0-9,.-]/g, '').replace(',', '.'))));
    if (await next.isDisabled()) break;
    expect(pageNumber, 'Límite explícito de 100 páginas del fixture').toBeLessThan(100);
    const pageResponse = waitForPayments();
    await next.click();
    expect((await pageResponse).ok()).toBe(true);
  }
  expect(new Set(amounts).size, 'Se requieren al menos dos importes distintos para probar ordenación').toBeGreaterThanOrEqual(2);
  expect(amounts.every(Number.isFinite)).toBe(true);
  expect(amounts).toEqual([...amounts].sort((a, b) => descending ? b - a : a - b));
}

module.exports = { assertPaymentAmountsSorted };
