# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: filters-sorting.phase2-lists.spec.js >> phase2 athletes tab: filtros y orden con reset consistente
- Location: tests\e2e\filters-sorting.phase2-lists.spec.js:7:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/admin(?:\?|$)/
Received string:  "http://127.0.0.1:6100/login"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    14 × unexpected value "http://127.0.0.1:6100/login"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - link "Saltar al contenido" [ref=e3]:
    - /url: "#main-content"
  - navigation "Navegación principal" [ref=e4]:
    - link "Logo Riovoley" [ref=e5]:
      - /url: /
      - img "Logo Riovoley" [ref=e6]
    - button "Abrir menú" [ref=e8] [cursor=pointer]:
      - img [ref=e9]
  - main [active] [ref=e11]:
    - img
    - generic [ref=e14]:
      - generic [ref=e15]:
        - img "RioVoley" [ref=e18]
        - heading "Iniciar Sesión" [level=1] [ref=e19]
        - paragraph [ref=e20]: Accede a tu cuenta RioVoley
      - generic [ref=e22]:
        - generic [ref=e23]:
          - generic [ref=e24]:
            - img [ref=e26]
            - text: Correo electrónico
          - textbox "Correo electrónico" [ref=e28]:
            - /placeholder: [CORREO_REDACTADO]
            - text: [CORREO_REDACTADO]
        - generic [ref=e29]:
          - generic [ref=e30]:
            - img [ref=e32]
            - text: Contraseña
          - generic [ref=e34]:
            - textbox "Contraseña" [ref=e35]:
              - /placeholder: ••••••••
              - text: [REDACTADO]
            - button [ref=e36] [cursor=pointer]:
              - img [ref=e37]
        - button "Ingresar" [ref=e39] [cursor=pointer]
      - button "¿Olvidaste tu contraseña?" [ref=e41] [cursor=pointer]
      - generic [ref=e42]: Email o contraseña inválidos.
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
> 14 |   await expect(page).toHaveURL(new RegExp(`${route}(?:\\?|$)`));
     |                      ^ Error: expect(page).toHaveURL(expected) failed
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
  35 |   await expect(button).toBeVisible();
  36 |   await button.click();
  37 | }
  38 | 
  39 | module.exports = { openAdminSection, loginAsAdmin: (page) => loginAsRole(page), loginAsRole, openPanelSection, dismissPanelGuide };
  40 | 
```