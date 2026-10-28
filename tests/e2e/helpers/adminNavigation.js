const { expect } = require('@playwright/test');

async function loginAsRole(page, role = 'admin') {
  const { credential, route } = {
    admin: { credential: 'ADMIN', route: '/admin' },
    trainer: { credential: 'TRAINER', route: '/entrenador' },
    student: { credential: 'STUDENT', route: '/estudiante' },
  }[role];
  await dismissPanelGuide(page, role);
  await page.goto('/login');
  await page.getByLabel(/correo/i).fill(process.env[`E2E_${credential}_EMAIL`]);
  await page.getByLabel(/contrase|password/i).fill(process.env[`E2E_${credential}_PASSWORD`]);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(new RegExp(`${route}(?:\\?|$)`));
  await expect(page.getByRole('button', { name: 'Abrir guia del panel' })).toBeVisible();
}

async function dismissPanelGuide(page, role) {
  await page.addInitScript((roleName) => {
    localStorage.setItem(`riovoley:panel-guide:${roleName}`, JSON.stringify({
      version: '2026-06-22', status: 'dismissed',
    }));
  }, role);
}

async function openAdminSection(page, section) {
  return openPanelSection(page, 'admin', section);
}

async function openPanelSection(page, role, section) {
  const selector = `[data-guide-id="${role}-menu-${section}"]:visible`;
  const toggle = page.getByRole('button', { name: /abrir men[uú] lateral/i });
  if (await toggle.isVisible()) await toggle.click();
  const button = page.locator(selector);
  await expect(button).toBeVisible();
  await button.click();
}

module.exports = { openAdminSection, loginAsAdmin: (page) => loginAsRole(page), loginAsRole, openPanelSection, dismissPanelGuide };
