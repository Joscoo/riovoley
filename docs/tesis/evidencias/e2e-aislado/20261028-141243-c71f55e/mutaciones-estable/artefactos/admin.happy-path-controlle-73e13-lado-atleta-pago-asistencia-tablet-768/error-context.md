# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.happy-path-controlled.spec.js >> admin happy path controlado: atleta + pago + asistencia
- Location: tests\e2e\admin.happy-path-controlled.spec.js:44:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /gestion de usuarios/i }).first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('button', { name: /gestion de usuarios/i }).first()

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
    - button "Abrir menu lateral" [expanded] [ref=e18] [cursor=pointer]:
      - img [ref=e19]
    - navigation "Navegacion del panel" [ref=e22]:
      - button "Cerrar menu lateral" [ref=e24] [cursor=pointer]:
        - img [ref=e25]
      - generic [ref=e27]:
        - img [ref=e29]
        - generic [ref=e31]:
          - heading "Administrador Pruebas" [level=3] [ref=e32]
          - paragraph [ref=e33]: Administrador
      - generic [ref=e34]:
        - button "Dashboard" [ref=e35] [cursor=pointer]:
          - img [ref=e37]
          - generic [ref=e40]: Dashboard
        - button "Reportes" [ref=e41] [cursor=pointer]:
          - img [ref=e43]
          - generic [ref=e46]: Reportes
        - button "Revision Financiera" [ref=e47] [cursor=pointer]:
          - img [ref=e49]
          - generic [ref=e52]: Revision Financiera
        - button "Gestión de Usuarios" [ref=e53] [cursor=pointer]:
          - img [ref=e55]
          - generic [ref=e58]: Gestión de Usuarios
        - button "Pagos" [ref=e59] [cursor=pointer]:
          - img [ref=e61]
          - generic [ref=e64]: Pagos
        - button "Asistencias" [ref=e65] [cursor=pointer]:
          - img [ref=e67]
          - generic [ref=e70]: Asistencias
        - button "Horarios" [ref=e71] [cursor=pointer]:
          - img [ref=e73]
          - generic [ref=e76]: Horarios
        - button "Tests Fisicos" [ref=e77] [cursor=pointer]:
          - img [ref=e79]
          - generic [ref=e82]: Tests Fisicos
        - button "Anuncios" [ref=e83] [cursor=pointer]:
          - img [ref=e85]
          - generic [ref=e88]: Anuncios
        - button "Gamificación" [ref=e89] [cursor=pointer]:
          - img [ref=e91]
          - generic [ref=e94]: Gamificación
        - button "Configuracion" [ref=e95] [cursor=pointer]:
          - img [ref=e97]
          - generic [ref=e100]: Configuracion
    - main [ref=e101]:
      - generic [ref=e105]: Panel de Administración>Dashboard
      - generic [ref=e107]:
        - generic [ref=e108]:
          - generic [ref=e110]:
            - heading "Dashboard - Resumen General" [level=2] [ref=e111]:
              - img [ref=e113]
              - text: Dashboard - Resumen General
            - paragraph [ref=e115]: "Vista general de RioVoley Club - Sesión: [CORREO_REDACTADO]"
          - generic [ref=e116]:
            - heading "Acciones Rapidas" [level=3] [ref=e117]:
              - img [ref=e118]
              - text: Acciones Rapidas
            - generic [ref=e120]:
              - button "Agregar Estudiante" [ref=e121] [cursor=pointer]:
                - img [ref=e122]
                - text: Agregar Estudiante
              - button "Registrar Pago" [ref=e124] [cursor=pointer]:
                - img [ref=e125]
                - text: Registrar Pago
              - button "Revision Financiera" [ref=e127] [cursor=pointer]:
                - img [ref=e128]
                - text: Revision Financiera
              - button "Gestionar Usuarios" [ref=e130] [cursor=pointer]:
                - img [ref=e131]
                - text: Gestionar Usuarios
              - button "Ver Reportes" [ref=e133] [cursor=pointer]:
                - img [ref=e134]
                - text: Ver Reportes
          - generic [ref=e136]:
            - generic [ref=e138]:
              - generic [ref=e139]:
                - heading "Total Estudiantes" [level=3] [ref=e140]
                - paragraph [ref=e141]: "8"
                - paragraph [ref=e142]: Registrados en el sistema
              - img [ref=e144]
            - generic [ref=e147]:
              - generic [ref=e148]:
                - heading "Ingresos del Mes" [level=3] [ref=e149]
                - paragraph [ref=e150]: $280.00
                - paragraph [ref=e151]: Pagos recibidos este mes
              - img [ref=e153]
            - generic [ref=e156]:
              - generic [ref=e157]:
                - heading "Periodos Vencidos" [level=3] [ref=e158]
                - paragraph [ref=e159]: "0"
                - paragraph [ref=e160]: Todos con periodo vigente
              - img [ref=e162]
            - generic [ref=e165]:
              - generic [ref=e166]:
                - heading "Proximos a Vencer" [level=3] [ref=e167]
                - paragraph [ref=e168]: "0"
                - paragraph [ref=e169]: Sin vencimientos proximos
              - img [ref=e171]
            - generic [ref=e174]:
              - generic [ref=e175]:
                - heading "Estudiantes Activos" [level=3] [ref=e176]
                - paragraph [ref=e177]: "8"
                - paragraph [ref=e178]: 8 de 8 con pagos activos
              - img [ref=e180]
          - generic [ref=e182]:
            - heading "Actividad Reciente" [level=3] [ref=e183]:
              - img [ref=e184]
              - text: Actividad Reciente
            - generic [ref=e186]:
              - generic [ref=e187]:
                - img [ref=e189]
                - generic [ref=e191]:
                  - paragraph [ref=e192]: Fixture1 Auditoria asistio al entrenamiento
                  - text: 10/27/2026
              - generic [ref=e193]:
                - img [ref=e195]
                - generic [ref=e197]:
                  - paragraph [ref=e198]: Fixture2 Auditoria asistio al entrenamiento
                  - text: 10/27/2026
              - generic [ref=e199]:
                - img [ref=e201]
                - generic [ref=e203]:
                  - paragraph [ref=e204]: Atleta Pruebas asistio al entrenamiento
                  - text: 10/27/2026
              - generic [ref=e205]:
                - img [ref=e207]
                - generic [ref=e209]:
                  - paragraph [ref=e210]: Fixture1 Auditoria realizo un pago de $35
                  - text: 10/27/2026
              - generic [ref=e211]:
                - img [ref=e213]
                - generic [ref=e215]:
                  - paragraph [ref=e216]: Atleta Pruebas realizo un pago de $35
                  - text: 10/27/2026
          - generic [ref=e217]:
            - heading "Resumen por Categorias" [level=3] [ref=e218]:
              - img [ref=e219]
              - text: Resumen por Categorias
            - generic [ref=e221]:
              - generic [ref=e222]:
                - heading "Iniciacion Hombres" [level=4] [ref=e223]
                - paragraph [ref=e224]: 2 atletas
              - generic [ref=e225]:
                - heading "Iniciacion Mujeres" [level=4] [ref=e226]
                - paragraph [ref=e227]: 2 atletas
              - generic [ref=e228]:
                - heading "Master Mujeres" [level=4] [ref=e229]
                - paragraph [ref=e230]: 1 atletas
              - generic [ref=e231]:
                - heading "master_hombres" [level=4] [ref=e232]
                - paragraph [ref=e233]: 1 atletas
              - generic [ref=e234]:
                - heading "Perfeccionamiento Hombres" [level=4] [ref=e235]
                - paragraph [ref=e236]: 1 atletas
              - generic [ref=e237]:
                - heading "Perfeccionamiento Mujeres" [level=4] [ref=e238]
                - paragraph [ref=e239]: 1 atletas
        - button "Abrir guia del panel" [ref=e240] [cursor=pointer]:
          - img [ref=e241]
        - generic [ref=e243]:
          - generic [ref=e245]:
            - generic [ref=e246]:
              - paragraph [ref=e247]:
                - img [ref=e248]
                - text: Guia interactiva
              - heading "Entrada al dashboard" [level=3] [ref=e250]
              - paragraph [ref=e251]: Panel de Administración - Paso 1 de 22
            - generic [ref=e252]:
              - paragraph [ref=e253]: Progreso
              - paragraph [ref=e254]: 5%
          - generic [ref=e258]:
            - generic [ref=e259]:
              - paragraph [ref=e260]:
                - img [ref=e261]
                - text: Donde hacer click
              - paragraph [ref=e263]: Haz click en "Dashboard" para volver al resumen ejecutivo cuando necesites una vista general del club.
            - generic [ref=e264]:
              - paragraph [ref=e265]:
                - img [ref=e266]
                - text: Puntos clave
              - list [ref=e268]:
                - listitem [ref=e269]:
                  - generic [ref=e271]: Sirve como punto de partida para revisar el estado operativo.
                - listitem [ref=e272]:
                  - generic [ref=e274]: Desde aqui puedes saltar al resto de modulos sin salir del panel.
          - generic [ref=e276]:
            - button "Omitir guia" [ref=e277] [cursor=pointer]:
              - img [ref=e278]
              - text: Omitir guia
            - generic [ref=e280]:
              - button "Anterior" [disabled]:
                - img
                - text: Anterior
              - button "Siguiente paso" [ref=e281] [cursor=pointer]:
                - text: Siguiente paso
                - img [ref=e282]
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
  33  |     await openSidebarButton.click();
  34  |   }
  35  | }
  36  | 
  37  | async function openSection(page, sectionNameRegex) {
  38  |   await openSidebarIfNeeded(page);
  39  |   const sectionButton = page.getByRole('button', { name: sectionNameRegex }).first();
> 40  |   await expect(sectionButton).toBeVisible({ timeout: 15000 });
      |                               ^ Error: expect(locator).toBeVisible() failed
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
  134 | });
  135 | 
```