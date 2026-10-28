# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: asistencias.guided.review.spec.js >> guided review: admin asistencias quick mode per viewport
- Location: tests\e2e\asistencias.guided.review.spec.js:61:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /asistencias/i }).first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('button', { name: /asistencias/i }).first()

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
    - generic [ref=e7]:
      - button "Notificaciones" [ref=e9] [cursor=pointer]:
        - img [ref=e10]
        - generic [ref=e12]: "1"
      - button "Abrir menú" [ref=e13] [cursor=pointer]:
        - img [ref=e14]
  - generic [ref=e17]:
    - button "Abrir menu lateral" [ref=e18] [cursor=pointer]:
      - img [ref=e19]
    - generic:
      - navigation:
        - generic:
          - button:
            - img
        - generic:
          - generic:
            - img
          - generic:
            - heading [level=3]: Administrador Pruebas
            - paragraph: Administrador
        - generic:
          - button:
            - generic:
              - img
            - generic:
              - generic: Dashboard
          - button:
            - generic:
              - img
            - generic:
              - generic: Reportes
          - button:
            - generic:
              - img
            - generic:
              - generic: Revision Financiera
          - button:
            - generic:
              - img
            - generic:
              - generic: Gestión de Usuarios
          - button:
            - generic:
              - img
            - generic:
              - generic: Pagos
          - button:
            - generic:
              - img
            - generic:
              - generic: Asistencias
          - button:
            - generic:
              - img
            - generic:
              - generic: Horarios
          - button:
            - generic:
              - img
            - generic:
              - generic: Tests Fisicos
          - button:
            - generic:
              - img
            - generic:
              - generic: Anuncios
          - button:
            - generic:
              - img
            - generic:
              - generic: Gamificación
          - button:
            - generic:
              - img
            - generic:
              - generic: Configuracion
    - main [ref=e21]:
      - generic [ref=e25]: Panel de Administración>Dashboard
      - generic [ref=e27]:
        - generic [ref=e28]:
          - generic [ref=e30]:
            - heading "Dashboard - Resumen General" [level=2] [ref=e31]:
              - img [ref=e33]
              - text: Dashboard - Resumen General
            - paragraph [ref=e35]: "Vista general de RioVoley Club - Sesión: [CORREO_REDACTADO]"
          - generic [ref=e36]:
            - heading "Acciones Rapidas" [level=3] [ref=e37]:
              - img [ref=e38]
              - text: Acciones Rapidas
            - generic [ref=e40]:
              - button "Agregar Estudiante" [ref=e41] [cursor=pointer]:
                - img [ref=e42]
                - text: Agregar Estudiante
              - button "Registrar Pago" [ref=e44] [cursor=pointer]:
                - img [ref=e45]
                - text: Registrar Pago
              - button "Revision Financiera" [ref=e47] [cursor=pointer]:
                - img [ref=e48]
                - text: Revision Financiera
              - button "Gestionar Usuarios" [ref=e50] [cursor=pointer]:
                - img [ref=e51]
                - text: Gestionar Usuarios
              - button "Ver Reportes" [ref=e53] [cursor=pointer]:
                - img [ref=e54]
                - text: Ver Reportes
          - generic [ref=e56]:
            - generic [ref=e58]:
              - generic [ref=e59]:
                - heading "Total Estudiantes" [level=3] [ref=e60]
                - paragraph [ref=e61]: "8"
                - paragraph [ref=e62]: Registrados en el sistema
              - img [ref=e64]
            - generic [ref=e67]:
              - generic [ref=e68]:
                - heading "Ingresos del Mes" [level=3] [ref=e69]
                - paragraph [ref=e70]: $280.00
                - paragraph [ref=e71]: Pagos recibidos este mes
              - img [ref=e73]
            - generic [ref=e76]:
              - generic [ref=e77]:
                - heading "Periodos Vencidos" [level=3] [ref=e78]
                - paragraph [ref=e79]: "0"
                - paragraph [ref=e80]: Todos con periodo vigente
              - img [ref=e82]
            - generic [ref=e85]:
              - generic [ref=e86]:
                - heading "Proximos a Vencer" [level=3] [ref=e87]
                - paragraph [ref=e88]: "0"
                - paragraph [ref=e89]: Sin vencimientos proximos
              - img [ref=e91]
            - generic [ref=e94]:
              - generic [ref=e95]:
                - heading "Estudiantes Activos" [level=3] [ref=e96]
                - paragraph [ref=e97]: "8"
                - paragraph [ref=e98]: 8 de 8 con pagos activos
              - img [ref=e100]
          - generic [ref=e102]:
            - heading "Actividad Reciente" [level=3] [ref=e103]:
              - img [ref=e104]
              - text: Actividad Reciente
            - generic [ref=e106]:
              - generic [ref=e107]:
                - img [ref=e109]
                - generic [ref=e111]:
                  - paragraph [ref=e112]: Fixture1 Auditoria asistio al entrenamiento
                  - text: 10/27/2026
              - generic [ref=e113]:
                - img [ref=e115]
                - generic [ref=e117]:
                  - paragraph [ref=e118]: Fixture2 Auditoria asistio al entrenamiento
                  - text: 10/27/2026
              - generic [ref=e119]:
                - img [ref=e121]
                - generic [ref=e123]:
                  - paragraph [ref=e124]: Atleta Pruebas asistio al entrenamiento
                  - text: 10/27/2026
              - generic [ref=e125]:
                - img [ref=e127]
                - generic [ref=e129]:
                  - paragraph [ref=e130]: Fixture1 Auditoria realizo un pago de $35
                  - text: 10/27/2026
              - generic [ref=e131]:
                - img [ref=e133]
                - generic [ref=e135]:
                  - paragraph [ref=e136]: Atleta Pruebas realizo un pago de $35
                  - text: 10/27/2026
          - generic [ref=e137]:
            - heading "Resumen por Categorias" [level=3] [ref=e138]:
              - img [ref=e139]
              - text: Resumen por Categorias
            - generic [ref=e141]:
              - generic [ref=e142]:
                - heading "Iniciacion Hombres" [level=4] [ref=e143]
                - paragraph [ref=e144]: 2 atletas
              - generic [ref=e145]:
                - heading "Iniciacion Mujeres" [level=4] [ref=e146]
                - paragraph [ref=e147]: 2 atletas
              - generic [ref=e148]:
                - heading "Master Mujeres" [level=4] [ref=e149]
                - paragraph [ref=e150]: 1 atletas
              - generic [ref=e151]:
                - heading "master_hombres" [level=4] [ref=e152]
                - paragraph [ref=e153]: 1 atletas
              - generic [ref=e154]:
                - heading "Perfeccionamiento Hombres" [level=4] [ref=e155]
                - paragraph [ref=e156]: 1 atletas
              - generic [ref=e157]:
                - heading "Perfeccionamiento Mujeres" [level=4] [ref=e158]
                - paragraph [ref=e159]: 1 atletas
        - button "Abrir guia del panel" [ref=e160] [cursor=pointer]:
          - img [ref=e161]
        - generic [ref=e163]:
          - generic [ref=e165]:
            - generic [ref=e166]:
              - paragraph [ref=e167]:
                - img [ref=e168]
                - text: Guia interactiva
              - heading "Entrada al dashboard" [level=3] [ref=e170]
              - paragraph [ref=e171]: Panel de Administración - Paso 1 de 22
            - generic [ref=e172]:
              - paragraph [ref=e173]: Progreso
              - paragraph [ref=e174]: 5%
          - generic [ref=e178]:
            - generic [ref=e179]:
              - paragraph [ref=e180]:
                - img [ref=e181]
                - text: Donde hacer click
              - paragraph [ref=e183]: Haz click en "Dashboard" para volver al resumen ejecutivo cuando necesites una vista general del club.
            - generic [ref=e184]:
              - paragraph [ref=e185]:
                - img [ref=e186]
                - text: Puntos clave
              - list [ref=e188]:
                - listitem [ref=e189]:
                  - generic [ref=e191]: Sirve como punto de partida para revisar el estado operativo.
                - listitem [ref=e192]:
                  - generic [ref=e194]: Desde aqui puedes saltar al resto de modulos sin salir del panel.
            - paragraph [ref=e196]: En movil la guia mantiene visible el contenido principal. El paso ya cambio a la seccion correcta y puedes usar esta tarjeta mientras haces scroll.
          - generic [ref=e198]:
            - button "Omitir guia" [ref=e199] [cursor=pointer]:
              - img [ref=e200]
              - text: Omitir guia
            - generic [ref=e202]:
              - button "Anterior" [disabled]:
                - img
                - text: Anterior
              - button "Siguiente paso" [ref=e203] [cursor=pointer]:
                - text: Siguiente paso
                - img [ref=e204]
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
> 18  |   await expect(asistenciasMenuButton.first()).toBeVisible({ timeout: 15000 });
      |                                               ^ Error: expect(locator).toBeVisible() failed
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
  78  |   await expect(page).toHaveURL(/\/admin/);
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