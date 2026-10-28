# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: audit.protected-routes.spec.js >> audit: anonymous access cannot render protected panel /estudiante
- Location: tests\e2e\audit.protected-routes.spec.js:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /acceso denegado/i })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: /acceso denegado/i })

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
  - paragraph [ref=e13]: Cargando informacion...
```

# Test source

```ts
  1  | // Auditoría: sesión anónima, sin solicitudes de autenticación ni escrituras remotas.
  2  | const { test, expect } = require('@playwright/test');
  3  | for (const route of ['/admin', '/entrenador', '/estudiante']) {
  4  |   test(`audit: anonymous access cannot render protected panel ${route}`, async ({ page }) => {
  5  |     await page.goto(route);
> 6  |     await expect(page.getByRole('heading', { name: /acceso denegado/i })).toBeVisible();
     |                                                                           ^ Error: expect(locator).toBeVisible() failed
  7  |     await expect(page.locator('[data-guide-id$="menu-dashboard"]')).toHaveCount(0);
  8  |   });
  9  | }
  10 | 
```