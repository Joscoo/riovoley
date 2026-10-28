# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: asistencias.guided.review.spec.js >> guided review: admin asistencias quick mode per viewport
- Location: tests\e2e\asistencias.guided.review.spec.js:61:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/admin/
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
  1   | const { test, expect } = require('@playwright/test');
  2   | 
  3   | const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
  4   | const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
  5   | 
  6   | async function ensureQuickMode(page) {
  7   |   const quickModeButton = page.getByRole('button', { name: /registro rapido|registro rápido/i });
  8   |   if (await quickModeButton.count()) {
  9   |     await quickModeButton.first().click();
  10  |   }
  11  | }
  12  | 
  13  | async function openAsistenciasModule(page) {
  14  |   await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  15  |   await page.waitForLoadState('load');
  16  | 
  17  |   const asistenciasMenuButton = page.getByRole('button', { name: /asistencias/i });
  18  |   await expect(asistenciasMenuButton.first()).toBeVisible({ timeout: 15000 });
  19  |   await asistenciasMenuButton.first().click();
  20  | 
  21  |   await expect(page.getByRole('heading', { name: /control de asistencias/i })).toBeVisible({ timeout: 15000 });
  22  | }
  23  | 
  24  | async function collectAsistenciasMetrics(page) {
  25  |   return page.evaluate(() => {
  26  |     const rows = Array.from(document.querySelectorAll('[class*="atletaItemNew"]'));
  27  |     const names = Array.from(document.querySelectorAll('[class*="atletaNameSection"] [class*="atletaName"]'));
  28  |     const actionGroups = Array.from(document.querySelectorAll('[class*="paymentButtons"]'));
  29  | 
  30  |     const rowWidths = rows.map((el) => Math.round(el.getBoundingClientRect().width));
  31  |     const nameWidths = names.map((el) => Math.round(el.getBoundingClientRect().width));
  32  |     const actionWidths = actionGroups.map((el) => Math.round(el.getBoundingClientRect().width));
  33  | 
  34  |     const minRow = rowWidths.length ? Math.min(...rowWidths) : 0;
  35  |     const maxRow = rowWidths.length ? Math.max(...rowWidths) : 0;
  36  |     const minName = nameWidths.length ? Math.min(...nameWidths) : 0;
  37  |     const maxName = nameWidths.length ? Math.max(...nameWidths) : 0;
  38  |     const maxActions = actionWidths.length ? Math.max(...actionWidths) : 0;
  39  | 
  40  |     const root = document.documentElement;
  41  |     const body = document.body;
  42  |     const scrollWidth = Math.max(root.scrollWidth, body ? body.scrollWidth : 0);
  43  |     const viewport = window.innerWidth;
  44  | 
  45  |     return {
  46  |       rowCount: rows.length,
  47  |       nameCount: names.length,
  48  |       actionGroupCount: actionGroups.length,
  49  |       minRow,
  50  |       maxRow,
  51  |       minName,
  52  |       maxName,
  53  |       maxActions,
  54  |       hasHorizontalOverflow: scrollWidth > viewport + 1,
  55  |       scrollWidth,
  56  |       viewport,
  57  |     };
  58  |   });
  59  | }
  60  | 
  61  | test('guided review: admin asistencias quick mode per viewport', async ({ page }, testInfo) => {
  62  |   test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');
  63  | 
  64  |   await page.goto('/login', { waitUntil: 'domcontentloaded' });
  65  |   await page.waitForLoadState('load');
  66  | 
  67  |   await page.getByLabel('Correo Electrónico').fill(ADMIN_EMAIL);
  68  |   await page.getByLabel('Contraseña').fill(ADMIN_PASSWORD);
  69  | 
  70  |   const submitButton = page.locator('form button[type="submit"]').first();
  71  |   if (await submitButton.count()) {
  72  |     await submitButton.click();
  73  |   } else {
  74  |     await page.getByRole('button', { name: /ingresar|iniciar sesion|iniciar sesión|iniciar sesión con supabase/i }).first().click();
  75  |   }
  76  | 
  77  |   await page.waitForURL(/\/admin|\/login/, { timeout: 20000 });
> 78  |   await expect(page).toHaveURL(/\/admin/);
      |                      ^ Error: expect(page).toHaveURL(expected) failed
  79  | 
  80  |   await openAsistenciasModule(page);
  81  |   await ensureQuickMode(page);
  82  | 
  83  |   const screenshotPath = testInfo.outputPath(`asistencias-quick-${testInfo.project.name}.png`);
  84  |   const isMobileProject = /mobile/i.test(testInfo.project.name);
  85  |   const pageHeight = await page.evaluate(() => {
  86  |     const root = document.documentElement;
  87  |     const body = document.body;
  88  |     return Math.max(root.scrollHeight, body ? body.scrollHeight : 0);
  89  |   });
  90  | 
  91  |   // Chromium cannot capture full-page images above 32767px in either dimension.
  92  |   if (isMobileProject || pageHeight >= 32000) {
  93  |     await page.screenshot({ path: screenshotPath, fullPage: false });
  94  |   } else {
  95  |     await page.screenshot({ path: screenshotPath, fullPage: true });
  96  |   }
  97  | 
  98  |   const metrics = await collectAsistenciasMetrics(page);
  99  |   console.log(`GUIDED_REVIEW_METRICS[${testInfo.project.name}]: ${JSON.stringify(metrics)}`);
  100 | 
  101 |   // Soft checks to avoid blocking the run while still flagging bad layouts.
  102 |   expect.soft(metrics.hasHorizontalOverflow, `Overflow in ${testInfo.project.name}`).toBeFalsy();
  103 | 
  104 |   if (metrics.rowCount > 0) {
  105 |     expect.soft(metrics.minName, `Name width too small in ${testInfo.project.name}`).toBeGreaterThan(90);
  106 |     expect.soft(metrics.maxActions, `Actions consuming too much width in ${testInfo.project.name}`).toBeLessThanOrEqual(metrics.viewport);
  107 |   }
  108 | });
  109 | 
```