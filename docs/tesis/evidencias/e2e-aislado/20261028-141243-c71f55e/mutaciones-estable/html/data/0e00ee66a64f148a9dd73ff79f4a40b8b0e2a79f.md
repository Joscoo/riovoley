# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.happy-path-controlled.spec.js >> admin happy path controlado: atleta + pago + asistencia
- Location: tests\e2e\admin.happy-path-controlled.spec.js:44:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /abrir menu lateral/i }).first()
    - locator resolved to <button type="button" aria-expanded="false" aria-label="Abrir menu lateral" class="rv-performance-sidebar fixed bottom-[max(env(safe-area-inset-bottom),1rem)] left-4 z-[1001] flex h-12 w-12 items-center justify-center rounded-full border border-rv-gold/40 bg-rv-dark/85 text-rv-gold shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80 desktop:hidden">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="grid grid-cols-2 gap-2 mobile:flex mobile:flex-row">…</div> from <main tabindex="-1" id="main-content" class="flex min-w-0 flex-1 flex-col overflow-hidden">…</main> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="grid grid-cols-2 gap-2 mobile:flex mobile:flex-row">…</div> from <main tabindex="-1" id="main-content" class="flex min-w-0 flex-1 flex-col overflow-hidden">…</main> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    24 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="grid grid-cols-2 gap-2 mobile:flex mobile:flex-row">…</div> from <main tabindex="-1" id="main-content" class="flex min-w-0 flex-1 flex-col overflow-hidden">…</main> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable

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
  5   | const ENABLE_MUTATION_FLOW = process.env.E2E_ENABLE_MUTATION_FLOW === 'true';
  6   | 
  7   | async function loginAsAdmin(page) {
  8   |   await page.goto('/login', { waitUntil: 'domcontentloaded' });
  9   |   await page.waitForLoadState('load');
  10  | 
  11  |   await page.getByLabel(/correo/i).fill(ADMIN_EMAIL);
  12  |   await page.getByLabel(/contrase/i).fill(ADMIN_PASSWORD);
  13  | 
  14  |   const submitButton = page.locator('form button[type="submit"]').first();
  15  |   if (await submitButton.count()) {
  16  |     await submitButton.click();
  17  |   } else {
  18  |     await page
  19  |       .getByRole('button', { name: /ingresar|iniciar sesion|iniciar sesi/i })
  20  |       .first()
  21  |       .click();
  22  |   }
  23  | 
  24  |   await page.waitForURL(/\/admin|\/login/, { timeout: 20000 });
  25  |   await expect(page).toHaveURL(/\/admin/);
  26  | }
  27  | 
  28  | async function openSidebarIfNeeded(page) {
  29  |   const openSidebarButton = page.getByRole('button', { name: /abrir menu lateral/i }).first();
  30  |   const userManagementButton = page.getByRole('button', { name: /gestion de usuarios/i }).first();
  31  | 
  32  |   if (!(await userManagementButton.isVisible()) && (await openSidebarButton.count())) {
> 33  |     await openSidebarButton.click();
      |                             ^ Error: locator.click: Test timeout of 60000ms exceeded.
  34  |   }
  35  | }
  36  | 
  37  | async function openSection(page, sectionNameRegex) {
  38  |   await openSidebarIfNeeded(page);
  39  |   const sectionButton = page.getByRole('button', { name: sectionNameRegex }).first();
  40  |   await expect(sectionButton).toBeVisible({ timeout: 15000 });
  41  |   await sectionButton.click();
  42  | }
  43  | 
  44  | test('admin happy path controlado: atleta + pago + asistencia', async ({ page }) => {
  45  |   test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');
  46  |   test.skip(!ENABLE_MUTATION_FLOW, 'Set E2E_ENABLE_MUTATION_FLOW=true to run mutation flow.');
  47  | 
  48  |   page.on('dialog', async (dialog) => {
  49  |     if (dialog.type() === 'confirm') {
  50  |       await dialog.dismiss();
  51  |       return;
  52  |     }
  53  |     await dialog.accept();
  54  |   });
  55  | 
  56  |   const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-9);
  57  |   const firstName = `E2E${uniqueSuffix}`;
  58  |   const lastName = 'Flow';
  59  |   const fullName = `${firstName} ${lastName}`;
  60  |   const email = `e2e.flow.${uniqueSuffix}@example.com`;
  61  |   const today = new Date().toISOString().slice(0, 10);
  62  | 
  63  |   await loginAsAdmin(page);
  64  | 
  65  |   await openSection(page, /gestion de usuarios/i);
  66  |   await expect(page.getByText(/gestion de usuarios/i).first()).toBeVisible({ timeout: 15000 });
  67  | 
  68  |   const athletesTab = page.getByRole('button', { name: /^atletas$/i }).first();
  69  |   await expect(athletesTab).toBeVisible({ timeout: 10000 });
  70  |   await athletesTab.click();
  71  | 
  72  |   const addAthleteButton = page.getByRole('button', { name: /agregar atleta/i }).first();
  73  |   await expect(addAthleteButton).toBeVisible({ timeout: 10000 });
  74  |   await addAthleteButton.click();
  75  | 
  76  |   const athleteModal = page.getByRole('dialog');
  77  |   await expect(athleteModal).toBeVisible({ timeout: 10000 });
  78  |   await athleteModal.locator('#nombre').fill(firstName);
  79  |   await athleteModal.locator('#apellido').fill(lastName);
  80  |   await athleteModal.locator('#email').fill(email);
  81  |   await athleteModal.locator('#telefono').fill('0999999999');
  82  |   await athleteModal.locator('#fecha_nacimiento').fill('2010-01-01');
  83  |   await athleteModal.locator('#categoria').selectOption('iniciacion_hombres');
  84  |   await athleteModal.getByRole('button', { name: /^guardar$/i }).click();
  85  | 
  86  |   await expect(athleteModal).toBeHidden({ timeout: 60000 });
  87  | 
  88  |   await page.locator('#athlete-search').fill(email);
  89  |   await expect(page.getByText(email).first()).toBeVisible({ timeout: 30000 });
  90  | 
  91  |   await openSection(page, /^pagos$/i);
  92  |   await expect(page.getByText(/gestion de pagos/i).first()).toBeVisible({ timeout: 15000 });
  93  | 
  94  |   const addPaymentButton = page.getByRole('button', { name: /registrar pago/i }).first();
  95  |   await expect(addPaymentButton).toBeVisible({ timeout: 10000 });
  96  |   await addPaymentButton.click();
  97  | 
  98  |   const paymentModal = page.getByRole('dialog');
  99  |   await expect(paymentModal).toBeVisible({ timeout: 10000 });
  100 |   await paymentModal.locator('#student_id').fill(firstName);
  101 |   await paymentModal.locator('li').filter({ hasText: fullName }).first().click();
  102 |   await paymentModal.locator('#monto').fill('25');
  103 |   await paymentModal.locator('#fecha_pago').fill(today);
  104 |   await paymentModal.getByRole('button', { name: /^guardar$/i }).click();
  105 | 
  106 |   await expect(paymentModal).toBeHidden({ timeout: 60000 });
  107 | 
  108 |   await page.locator('#payments-search').fill(firstName);
  109 |   await expect(page.getByText(fullName).first()).toBeVisible({ timeout: 30000 });
  110 | 
  111 |   await openSection(page, /^asistencias$/i);
  112 |   await expect(page.getByText(/control de asistencias/i).first()).toBeVisible({ timeout: 15000 });
  113 | 
  114 |   await page.getByRole('button', { name: /registro/i }).first().click();
  115 |   const attendanceSearch = page.getByPlaceholder(/buscar atleta por nombre/i).first();
  116 |   await expect(attendanceSearch).toBeVisible({ timeout: 10000 });
  117 |   await attendanceSearch.fill(firstName);
  118 | 
  119 |   const athleteRow = page
  120 |     .locator('div')
  121 |     .filter({ hasText: firstName })
  122 |     .filter({ has: page.getByRole('button', { name: /marcar asistencia con/i }).first() })
  123 |     .first();
  124 |   await expect(athleteRow).toBeVisible({ timeout: 30000 });
  125 | 
  126 |   const monthlyButton = athleteRow.getByRole('button', { name: /marcar asistencia con mensualidad/i }).first();
  127 |   if (await monthlyButton.count()) {
  128 |     await monthlyButton.click();
  129 |   } else {
  130 |     await athleteRow.getByRole('button', { name: /marcar asistencia con/i }).first().click();
  131 |   }
  132 | 
  133 |   await expect(athleteRow.getByRole('button', { name: /eliminar asistencia/i }).first()).toBeVisible({ timeout: 15000 });
```