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

Locator: getByRole('heading', { name: /control de asistencias/i })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('heading', { name: /control de asistencias/i })

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
    - navigation "Navegacion del panel" [ref=e19]:
      - button "Colapsar menu lateral" [ref=e21] [cursor=pointer]:
        - img [ref=e22]
      - generic [ref=e24]:
        - img [ref=e26]
        - generic [ref=e28]:
          - heading "Administrador Pruebas" [level=3] [ref=e29]
          - paragraph [ref=e30]: Administrador
      - generic [ref=e31]:
        - button "Dashboard Resumen y estadisticas" [ref=e32] [cursor=pointer]:
          - img [ref=e34]
          - generic [ref=e36]:
            - generic [ref=e37]: Dashboard
            - generic [ref=e38]: Resumen y estadisticas
        - button "Reportes Asistencias, financieros y exportes" [active] [ref=e39] [cursor=pointer]:
          - img [ref=e41]
          - generic [ref=e43]:
            - generic [ref=e44]: Reportes
            - generic [ref=e45]: Asistencias, financieros y exportes
        - button "Revision Financiera Mensualidades vencidas, asistencias e ingresos" [ref=e46] [cursor=pointer]:
          - img [ref=e48]
          - generic [ref=e50]:
            - generic [ref=e51]: Revision Financiera
            - generic [ref=e52]: Mensualidades vencidas, asistencias e ingresos
        - button "Gestión de Usuarios Estudiantes, entrenadores y administradores" [ref=e53] [cursor=pointer]:
          - img [ref=e55]
          - generic [ref=e57]:
            - generic [ref=e58]: Gestión de Usuarios
            - generic [ref=e59]: Estudiantes, entrenadores y administradores
        - button "Pagos Mensualidades y facturacion" [ref=e60] [cursor=pointer]:
          - img [ref=e62]
          - generic [ref=e64]:
            - generic [ref=e65]: Pagos
            - generic [ref=e66]: Mensualidades y facturacion
        - button "Asistencias Control de entrenamientos" [ref=e67] [cursor=pointer]:
          - img [ref=e69]
          - generic [ref=e71]:
            - generic [ref=e72]: Asistencias
            - generic [ref=e73]: Control de entrenamientos
        - button "Horarios Gestion de horarios de entrenamientos" [ref=e74] [cursor=pointer]:
          - img [ref=e76]
          - generic [ref=e78]:
            - generic [ref=e79]: Horarios
            - generic [ref=e80]: Gestion de horarios de entrenamientos
        - button "Tests Fisicos Evaluaciones fisicas" [ref=e81] [cursor=pointer]:
          - img [ref=e83]
          - generic [ref=e85]:
            - generic [ref=e86]: Tests Fisicos
            - generic [ref=e87]: Evaluaciones fisicas
        - button "Anuncios Comunicados y notificaciones" [ref=e88] [cursor=pointer]:
          - img [ref=e90]
          - generic [ref=e92]:
            - generic [ref=e93]: Anuncios
            - generic [ref=e94]: Comunicados y notificaciones
        - button "Gamificación Tienda, logros y metas" [ref=e95] [cursor=pointer]:
          - img [ref=e97]
          - generic [ref=e99]:
            - generic [ref=e100]: Gamificación
            - generic [ref=e101]: Tienda, logros y metas
        - button "Configuracion Perfil y seguridad" [ref=e102] [cursor=pointer]:
          - img [ref=e104]
          - generic [ref=e106]:
            - generic [ref=e107]: Configuracion
            - generic [ref=e108]: Perfil y seguridad
    - main [ref=e109]:
      - generic [ref=e113]: Panel de Administración>Dashboard
      - generic [ref=e115]:
        - generic [ref=e116]:
          - generic [ref=e118]:
            - heading "Dashboard - Resumen General" [level=2] [ref=e119]:
              - img [ref=e121]
              - text: Dashboard - Resumen General
            - paragraph [ref=e123]: "Vista general de RioVoley Club - Sesión: [CORREO_REDACTADO]"
          - generic [ref=e124]:
            - heading "Acciones Rapidas" [level=3] [ref=e125]:
              - img [ref=e126]
              - text: Acciones Rapidas
            - generic [ref=e128]:
              - button "Agregar Estudiante" [ref=e129] [cursor=pointer]:
                - img [ref=e130]
                - text: Agregar Estudiante
              - button "Registrar Pago" [ref=e132] [cursor=pointer]:
                - img [ref=e133]
                - text: Registrar Pago
              - button "Revision Financiera" [ref=e135] [cursor=pointer]:
                - img [ref=e136]
                - text: Revision Financiera
              - button "Gestionar Usuarios" [ref=e138] [cursor=pointer]:
                - img [ref=e139]
                - text: Gestionar Usuarios
              - button "Ver Reportes" [ref=e141] [cursor=pointer]:
                - img [ref=e142]
                - text: Ver Reportes
          - generic [ref=e144]:
            - generic [ref=e146]:
              - generic [ref=e147]:
                - heading "Total Estudiantes" [level=3] [ref=e148]
                - paragraph [ref=e149]: "8"
                - paragraph [ref=e150]: Registrados en el sistema
              - img [ref=e152]
            - generic [ref=e155]:
              - generic [ref=e156]:
                - heading "Ingresos del Mes" [level=3] [ref=e157]
                - paragraph [ref=e158]: $280.00
                - paragraph [ref=e159]: Pagos recibidos este mes
              - img [ref=e161]
            - generic [ref=e164]:
              - generic [ref=e165]:
                - heading "Periodos Vencidos" [level=3] [ref=e166]
                - paragraph [ref=e167]: "0"
                - paragraph [ref=e168]: Todos con periodo vigente
              - img [ref=e170]
            - generic [ref=e173]:
              - generic [ref=e174]:
                - heading "Proximos a Vencer" [level=3] [ref=e175]
                - paragraph [ref=e176]: "0"
                - paragraph [ref=e177]: Sin vencimientos proximos
              - img [ref=e179]
            - generic [ref=e182]:
              - generic [ref=e183]:
                - heading "Estudiantes Activos" [level=3] [ref=e184]
                - paragraph [ref=e185]: "8"
                - paragraph [ref=e186]: 8 de 8 con pagos activos
              - img [ref=e188]
          - generic [ref=e190]:
            - heading "Actividad Reciente" [level=3] [ref=e191]:
              - img [ref=e192]
              - text: Actividad Reciente
            - generic [ref=e194]:
              - generic [ref=e195]:
                - img [ref=e197]
                - generic [ref=e199]:
                  - paragraph [ref=e200]: Fixture1 Auditoria asistio al entrenamiento
                  - text: 10/27/2026
              - generic [ref=e201]:
                - img [ref=e203]
                - generic [ref=e205]:
                  - paragraph [ref=e206]: Fixture2 Auditoria asistio al entrenamiento
                  - text: 10/27/2026
              - generic [ref=e207]:
                - img [ref=e209]
                - generic [ref=e211]:
                  - paragraph [ref=e212]: Atleta Pruebas asistio al entrenamiento
                  - text: 10/27/2026
              - generic [ref=e213]:
                - img [ref=e215]
                - generic [ref=e217]:
                  - paragraph [ref=e218]: Fixture1 Auditoria realizo un pago de $35
                  - text: 10/27/2026
              - generic [ref=e219]:
                - img [ref=e221]
                - generic [ref=e223]:
                  - paragraph [ref=e224]: Atleta Pruebas realizo un pago de $35
                  - text: 10/27/2026
          - generic [ref=e225]:
            - heading "Resumen por Categorias" [level=3] [ref=e226]:
              - img [ref=e227]
              - text: Resumen por Categorias
            - generic [ref=e229]:
              - generic [ref=e230]:
                - heading "Iniciacion Hombres" [level=4] [ref=e231]
                - paragraph [ref=e232]: 2 atletas
              - generic [ref=e233]:
                - heading "Iniciacion Mujeres" [level=4] [ref=e234]
                - paragraph [ref=e235]: 2 atletas
              - generic [ref=e236]:
                - heading "Master Mujeres" [level=4] [ref=e237]
                - paragraph [ref=e238]: 1 atletas
              - generic [ref=e239]:
                - heading "master_hombres" [level=4] [ref=e240]
                - paragraph [ref=e241]: 1 atletas
              - generic [ref=e242]:
                - heading "Perfeccionamiento Hombres" [level=4] [ref=e243]
                - paragraph [ref=e244]: 1 atletas
              - generic [ref=e245]:
                - heading "Perfeccionamiento Mujeres" [level=4] [ref=e246]
                - paragraph [ref=e247]: 1 atletas
        - button "Abrir guia del panel" [ref=e248] [cursor=pointer]:
          - img [ref=e249]
        - generic [ref=e251]:
          - generic [ref=e253]:
            - generic [ref=e254]:
              - paragraph [ref=e255]:
                - img [ref=e256]
                - text: Guia interactiva
              - heading "Entrada al dashboard" [level=3] [ref=e258]
              - paragraph [ref=e259]: Panel de Administración - Paso 1 de 22
            - generic [ref=e260]:
              - paragraph [ref=e261]: Progreso
              - paragraph [ref=e262]: 5%
          - generic [ref=e266]:
            - generic [ref=e267]:
              - paragraph [ref=e268]:
                - img [ref=e269]
                - text: Donde hacer click
              - paragraph [ref=e271]: Haz click en "Dashboard" para volver al resumen ejecutivo cuando necesites una vista general del club.
            - generic [ref=e272]:
              - paragraph [ref=e273]:
                - img [ref=e274]
                - text: Puntos clave
              - list [ref=e276]:
                - listitem [ref=e277]:
                  - generic [ref=e279]: Sirve como punto de partida para revisar el estado operativo.
                - listitem [ref=e280]:
                  - generic [ref=e282]: Desde aqui puedes saltar al resto de modulos sin salir del panel.
            - paragraph [ref=e284]: Buscando el elemento de esta etapa. Si tarda en aparecer, la guia ya cambio a la seccion correcta y esta esperando el bloque objetivo.
          - generic [ref=e286]:
            - button "Omitir guia" [ref=e287] [cursor=pointer]:
              - img [ref=e288]
              - text: Omitir guia
            - generic [ref=e290]:
              - button "Anterior" [disabled]:
                - img
                - text: Anterior
              - button "Siguiente paso" [ref=e291] [cursor=pointer]:
                - text: Siguiente paso
                - img [ref=e292]
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
> 21  |   await expect(page.getByRole('heading', { name: /control de asistencias/i })).toBeVisible({ timeout: 15000 });
      |                                                                                ^ Error: expect(locator).toBeVisible() failed
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