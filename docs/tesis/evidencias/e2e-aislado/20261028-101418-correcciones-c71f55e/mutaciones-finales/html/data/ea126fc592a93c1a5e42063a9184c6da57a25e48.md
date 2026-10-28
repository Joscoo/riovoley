# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.happy-path-controlled.spec.js >> admin happy path controlado: atleta + pago + asistencia
- Location: tests\e2e\admin.happy-path-controlled.spec.js:6:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-guide-id="admin-menu-pagos"]:visible')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[data-guide-id="admin-menu-pagos"]:visible')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - link "Saltar al contenido" [ref=e3] [cursor=pointer]:
    - /url: "#main-content"
  - navigation "Navegación principal" [ref=e4]:
    - link "Logo Riovoley" [ref=e5] [cursor=pointer]:
      - /url: /
      - img "Logo Riovoley" [ref=e6]
    - button "Abrir menú" [ref=e8] [cursor=pointer]:
      - img [ref=e9]
  - generic [ref=e12]:
    - img [ref=e14]
    - heading "Acceso Denegado" [level=3] [ref=e16]
    - paragraph [ref=e17]: "Solo los administradores pueden acceder a este panel. Tu rol actual es: Sin rol."
```

# Test source

```ts
  1  | const { expect } = require('@playwright/test');
  2  | 
  3  | async function loginAsRole(page, role = 'admin') {
  4  |   const { credential, route } = {
  5  |     admin: { credential: 'ADMIN', route: '/admin' },
  6  |     trainer: { credential: 'TRAINER', route: '/entrenador' },
  7  |     student: { credential: 'STUDENT', route: '/estudiante' },
  8  |   }[role];
  9  |   await dismissPanelGuide(page, role);
  10 |   await page.goto('/login');
  11 |   await page.getByLabel(/correo/i).fill(process.env[`E2E_${credential}_EMAIL`]);
  12 |   await page.getByLabel(/contrase|password/i).fill(process.env[`E2E_${credential}_PASSWORD`]);
  13 |   await page.locator('form button[type="submit"]').click();
  14 |   await expect(page).toHaveURL(new RegExp(`${route}(?:\\?|$)`));
  15 |   await expect(page.getByRole('button', { name: 'Abrir guia del panel' })).toBeVisible();
  16 | }
  17 | 
  18 | async function dismissPanelGuide(page, role) {
  19 |   await page.addInitScript((roleName) => {
  20 |     localStorage.setItem(`riovoley:panel-guide:${roleName}`, JSON.stringify({
  21 |       version: '2026-06-22', status: 'dismissed',
  22 |     }));
  23 |   }, role);
  24 | }
  25 | 
  26 | async function openAdminSection(page, section) {
  27 |   return openPanelSection(page, 'admin', section);
  28 | }
  29 | 
  30 | async function openPanelSection(page, role, section) {
  31 |   const selector = `[data-guide-id="${role}-menu-${section}"]:visible`;
  32 |   const toggle = page.getByRole('button', { name: /abrir men[uú] lateral/i });
  33 |   if (await toggle.isVisible()) await toggle.click();
  34 |   const button = page.locator(selector);
> 35 |   await expect(button).toBeVisible();
     |                        ^ Error: expect(locator).toBeVisible() failed
  36 |   await button.click();
  37 | }
  38 | 
  39 | module.exports = { openAdminSection, loginAsAdmin: (page) => loginAsRole(page), loginAsRole, openPanelSection, dismissPanelGuide };
  40 | 
```