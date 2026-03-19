const { test, expect } = require('@playwright/test');

const PUBLIC_ROUTES = ['/', '/sobre', '/horarios', '/login', '/reset-password'];
const MIN_TOUCH_SIZE = 48;

async function getOverflowInfo(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const maxWidth = Math.max(root.scrollWidth, body ? body.scrollWidth : 0);
    const viewport = window.innerWidth;
    return {
      hasOverflow: maxWidth > viewport + 1,
      maxWidth,
      viewport,
    };
  });
}

async function getSmallTouchTargets(page) {
  return page.evaluate((minTouchSize) => {
    const selector = [
      'button',
      'a[href]',
      'input[type="button"]',
      'input[type="submit"]',
      '[role="button"]',
    ].join(',');

    const nodes = Array.from(document.querySelectorAll(selector));
    const visibleNodes = nodes.filter((node) => {
      const rect = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none'
      );
    });

    return visibleNodes
      .map((node) => {
        const rect = node.getBoundingClientRect();
        const text = (node.textContent || '').trim().slice(0, 40);
        return {
          text,
          className: node.className,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((item) => item.width < minTouchSize || item.height < minTouchSize)
      .slice(0, 20);
  }, MIN_TOUCH_SIZE);
}

for (const route of PUBLIC_ROUTES) {
  test(`public route responsive guard: ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');

    const overflow = await getOverflowInfo(page);
    expect(
      overflow.hasOverflow,
      `Overflow detected at route ${route}. viewport=${overflow.viewport} scrollWidth=${overflow.maxWidth}`
    ).toBeFalsy();

    const smallTargets = await getSmallTouchTargets(page);
    expect(
      smallTargets,
      `Touch targets < ${MIN_TOUCH_SIZE}px found at ${route}: ${JSON.stringify(smallTargets, null, 2)}`
    ).toEqual([]);
  });
}

test('role dashboards responsive guard (optional env credentials)', async ({ page }) => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;
  const studentEmail = process.env.E2E_STUDENT_EMAIL;
  const studentPassword = process.env.E2E_STUDENT_PASSWORD;
  const trainerEmail = process.env.E2E_TRAINER_EMAIL;
  const trainerPassword = process.env.E2E_TRAINER_PASSWORD;

  const roleCredentials = [
    { name: 'admin', email: adminEmail, password: adminPassword, route: '/admin' },
    { name: 'estudiante', email: studentEmail, password: studentPassword, route: '/estudiante' },
    { name: 'entrenador', email: trainerEmail, password: trainerPassword, route: '/entrenador' },
  ];

  for (const role of roleCredentials) {
    if (!role.email || !role.password) {
      test.info().annotations.push({
        type: 'skip-role',
        description: `Skipping ${role.name}: missing env credentials`,
      });
      continue;
    }

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');
    await page.getByLabel('Correo Electrónico').fill(role.email);
    await page.getByLabel('Contraseña').fill(role.password);

    const submitButton = page.locator('form button[type="submit"]').first();
    if (await submitButton.count()) {
      await submitButton.click();
    } else {
      await page.getByRole('button', { name: /ingresar|iniciar sesion|iniciar sesión|iniciar sesión con supabase/i }).first().click();
    }

    await page.waitForURL(new RegExp(`${role.route}|/login`), { timeout: 20000 });
    await page.goto(role.route, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');

    const overflow = await getOverflowInfo(page);
    expect(
      overflow.hasOverflow,
      `Overflow detected for ${role.name}. viewport=${overflow.viewport} scrollWidth=${overflow.maxWidth}`
    ).toBeFalsy();

    const smallTargets = await getSmallTouchTargets(page);
    expect(
      smallTargets,
      `Touch targets < ${MIN_TOUCH_SIZE}px found for ${role.name}: ${JSON.stringify(smallTargets, null, 2)}`
    ).toEqual([]);
  }
});
