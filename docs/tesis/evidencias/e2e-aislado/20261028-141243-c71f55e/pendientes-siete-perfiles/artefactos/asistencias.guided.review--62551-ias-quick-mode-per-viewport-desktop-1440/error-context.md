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
      - list [ref=e8]:
        - listitem [ref=e9]:
          - link "Inicio" [ref=e10] [cursor=pointer]:
            - /url: /
        - listitem [ref=e11]:
          - link "Sobre Nosotros" [ref=e12] [cursor=pointer]:
            - /url: /sobre
        - listitem [ref=e13]:
          - link "Horarios" [ref=e14] [cursor=pointer]:
            - /url: /horarios
        - listitem [ref=e15]:
          - link "Panel de Administración" [ref=e16] [cursor=pointer]:
            - /url: /admin
            - img [ref=e17]
            - text: Panel de Administración
      - button "Notificaciones" [ref=e20] [cursor=pointer]:
        - img [ref=e21]
        - generic [ref=e23]: "1"
      - generic [ref=e24]:
        - generic [ref=e25]:
          - generic [ref=e26]: Administrador Pruebas
          - generic [ref=e27]: Administrador
        - button [ref=e28] [cursor=pointer]:
          - img [ref=e29]
  - generic [ref=e33]:
    - navigation "Navegacion del panel" [ref=e35]:
      - button "Colapsar menu lateral" [ref=e37] [cursor=pointer]:
        - img [ref=e38]
      - generic [ref=e40]:
        - img [ref=e42]
        - generic [ref=e44]:
          - heading "Administrador Pruebas" [level=3] [ref=e45]
          - paragraph [ref=e46]: Administrador
      - generic [ref=e47]:
        - button "Dashboard Resumen y estadisticas" [ref=e48] [cursor=pointer]:
          - img [ref=e50]
          - generic [ref=e52]:
            - generic [ref=e53]: Dashboard
            - generic [ref=e54]: Resumen y estadisticas
        - button "Reportes Asistencias, financieros y exportes" [active] [ref=e55] [cursor=pointer]:
          - img [ref=e57]
          - generic [ref=e59]:
            - generic [ref=e60]: Reportes
            - generic [ref=e61]: Asistencias, financieros y exportes
        - button "Revision Financiera Mensualidades vencidas, asistencias e ingresos" [ref=e62] [cursor=pointer]:
          - img [ref=e64]
          - generic [ref=e66]:
            - generic [ref=e67]: Revision Financiera
            - generic [ref=e68]: Mensualidades vencidas, asistencias e ingresos
        - button "Gestión de Usuarios Estudiantes, entrenadores y administradores" [ref=e69] [cursor=pointer]:
          - img [ref=e71]
          - generic [ref=e73]:
            - generic [ref=e74]: Gestión de Usuarios
            - generic [ref=e75]: Estudiantes, entrenadores y administradores
        - button "Pagos Mensualidades y facturacion" [ref=e76] [cursor=pointer]:
          - img [ref=e78]
          - generic [ref=e80]:
            - generic [ref=e81]: Pagos
            - generic [ref=e82]: Mensualidades y facturacion
        - button "Asistencias Control de entrenamientos" [ref=e83] [cursor=pointer]:
          - img [ref=e85]
          - generic [ref=e87]:
            - generic [ref=e88]: Asistencias
            - generic [ref=e89]: Control de entrenamientos
        - button "Horarios Gestion de horarios de entrenamientos" [ref=e90] [cursor=pointer]:
          - img [ref=e92]
          - generic [ref=e94]:
            - generic [ref=e95]: Horarios
            - generic [ref=e96]: Gestion de horarios de entrenamientos
        - button "Tests Fisicos Evaluaciones fisicas" [ref=e97] [cursor=pointer]:
          - img [ref=e99]
          - generic [ref=e101]:
            - generic [ref=e102]: Tests Fisicos
            - generic [ref=e103]: Evaluaciones fisicas
        - button "Anuncios Comunicados y notificaciones" [ref=e104] [cursor=pointer]:
          - img [ref=e106]
          - generic [ref=e108]:
            - generic [ref=e109]: Anuncios
            - generic [ref=e110]: Comunicados y notificaciones
        - button "Gamificación Tienda, logros y metas" [ref=e111] [cursor=pointer]:
          - img [ref=e113]
          - generic [ref=e115]:
            - generic [ref=e116]: Gamificación
            - generic [ref=e117]: Tienda, logros y metas
        - button "Configuracion Perfil y seguridad" [ref=e118] [cursor=pointer]:
          - img [ref=e120]
          - generic [ref=e122]:
            - generic [ref=e123]: Configuracion
            - generic [ref=e124]: Perfil y seguridad
    - main [ref=e125]:
      - generic [ref=e129]: Panel de Administración>Dashboard
      - generic [ref=e131]:
        - generic [ref=e132]:
          - generic [ref=e134]:
            - heading "Dashboard - Resumen General" [level=2] [ref=e135]:
              - img [ref=e137]
              - text: Dashboard - Resumen General
            - paragraph [ref=e139]: "Vista general de RioVoley Club - Sesión: [CORREO_REDACTADO]"
          - generic [ref=e140]:
            - heading "Acciones Rapidas" [level=3] [ref=e141]:
              - img [ref=e142]
              - text: Acciones Rapidas
            - generic [ref=e144]:
              - button "Agregar Estudiante" [ref=e145] [cursor=pointer]:
                - img [ref=e146]
                - text: Agregar Estudiante
              - button "Registrar Pago" [ref=e148] [cursor=pointer]:
                - img [ref=e149]
                - text: Registrar Pago
              - button "Revision Financiera" [ref=e151] [cursor=pointer]:
                - img [ref=e152]
                - text: Revision Financiera
              - button "Gestionar Usuarios" [ref=e154] [cursor=pointer]:
                - img [ref=e155]
                - text: Gestionar Usuarios
              - button "Ver Reportes" [ref=e157] [cursor=pointer]:
                - img [ref=e158]
                - text: Ver Reportes
          - generic [ref=e160]:
            - generic [ref=e162]:
              - generic [ref=e163]:
                - heading "Total Estudiantes" [level=3] [ref=e164]
                - paragraph [ref=e165]: "8"
                - paragraph [ref=e166]: Registrados en el sistema
              - img [ref=e168]
            - generic [ref=e171]:
              - generic [ref=e172]:
                - heading "Ingresos del Mes" [level=3] [ref=e173]
                - paragraph [ref=e174]: $280.00
                - paragraph [ref=e175]: Pagos recibidos este mes
              - img [ref=e177]
            - generic [ref=e180]:
              - generic [ref=e181]:
                - heading "Periodos Vencidos" [level=3] [ref=e182]
                - paragraph [ref=e183]: "0"
                - paragraph [ref=e184]: Todos con periodo vigente
              - img [ref=e186]
            - generic [ref=e189]:
              - generic [ref=e190]:
                - heading "Proximos a Vencer" [level=3] [ref=e191]
                - paragraph [ref=e192]: "0"
                - paragraph [ref=e193]: Sin vencimientos proximos
              - img [ref=e195]
            - generic [ref=e198]:
              - generic [ref=e199]:
                - heading "Estudiantes Activos" [level=3] [ref=e200]
                - paragraph [ref=e201]: "8"
                - paragraph [ref=e202]: 8 de 8 con pagos activos
              - img [ref=e204]
          - generic [ref=e206]:
            - heading "Actividad Reciente" [level=3] [ref=e207]:
              - img [ref=e208]
              - text: Actividad Reciente
            - generic [ref=e210]:
              - generic [ref=e211]:
                - img [ref=e213]
                - generic [ref=e215]:
                  - paragraph [ref=e216]: Fixture1 Auditoria asistio al entrenamiento
                  - text: 10/27/2026
              - generic [ref=e217]:
                - img [ref=e219]
                - generic [ref=e221]:
                  - paragraph [ref=e222]: Fixture2 Auditoria asistio al entrenamiento
                  - text: 10/27/2026
              - generic [ref=e223]:
                - img [ref=e225]
                - generic [ref=e227]:
                  - paragraph [ref=e228]: Atleta Pruebas asistio al entrenamiento
                  - text: 10/27/2026
              - generic [ref=e229]:
                - img [ref=e231]
                - generic [ref=e233]:
                  - paragraph [ref=e234]: Fixture1 Auditoria realizo un pago de $35
                  - text: 10/27/2026
              - generic [ref=e235]:
                - img [ref=e237]
                - generic [ref=e239]:
                  - paragraph [ref=e240]: Atleta Pruebas realizo un pago de $35
                  - text: 10/27/2026
          - generic [ref=e241]:
            - heading "Resumen por Categorias" [level=3] [ref=e242]:
              - img [ref=e243]
              - text: Resumen por Categorias
            - generic [ref=e245]:
              - generic [ref=e246]:
                - heading "Iniciacion Hombres" [level=4] [ref=e247]
                - paragraph [ref=e248]: 2 atletas
              - generic [ref=e249]:
                - heading "Iniciacion Mujeres" [level=4] [ref=e250]
                - paragraph [ref=e251]: 2 atletas
              - generic [ref=e252]:
                - heading "Master Mujeres" [level=4] [ref=e253]
                - paragraph [ref=e254]: 1 atletas
              - generic [ref=e255]:
                - heading "master_hombres" [level=4] [ref=e256]
                - paragraph [ref=e257]: 1 atletas
              - generic [ref=e258]:
                - heading "Perfeccionamiento Hombres" [level=4] [ref=e259]
                - paragraph [ref=e260]: 1 atletas
              - generic [ref=e261]:
                - heading "Perfeccionamiento Mujeres" [level=4] [ref=e262]
                - paragraph [ref=e263]: 1 atletas
        - button "Abrir guia del panel" [ref=e264] [cursor=pointer]:
          - img [ref=e265]
        - generic [ref=e267]:
          - generic [ref=e269]:
            - generic [ref=e270]:
              - paragraph [ref=e271]:
                - img [ref=e272]
                - text: Guia interactiva
              - heading "Entrada al dashboard" [level=3] [ref=e274]
              - paragraph [ref=e275]: Panel de Administración - Paso 1 de 22
            - generic [ref=e276]:
              - paragraph [ref=e277]: Progreso
              - paragraph [ref=e278]: 5%
          - generic [ref=e282]:
            - generic [ref=e283]:
              - paragraph [ref=e284]:
                - img [ref=e285]
                - text: Donde hacer click
              - paragraph [ref=e287]: Haz click en "Dashboard" para volver al resumen ejecutivo cuando necesites una vista general del club.
            - generic [ref=e288]:
              - paragraph [ref=e289]:
                - img [ref=e290]
                - text: Puntos clave
              - list [ref=e292]:
                - listitem [ref=e293]:
                  - generic [ref=e295]: Sirve como punto de partida para revisar el estado operativo.
                - listitem [ref=e296]:
                  - generic [ref=e298]: Desde aqui puedes saltar al resto de modulos sin salir del panel.
            - paragraph [ref=e300]: Buscando el elemento de esta etapa. Si tarda en aparecer, la guia ya cambio a la seccion correcta y esta esperando el bloque objetivo.
          - generic [ref=e302]:
            - button "Omitir guia" [ref=e303] [cursor=pointer]:
              - img [ref=e304]
              - text: Omitir guia
            - generic [ref=e306]:
              - button "Anterior" [disabled]:
                - img
                - text: Anterior
              - button "Siguiente paso" [ref=e307] [cursor=pointer]:
                - text: Siguiente paso
                - img [ref=e308]
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