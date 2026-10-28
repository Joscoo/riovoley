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
        - button "Reportes Asistencias, financieros y exportes" [ref=e55] [cursor=pointer]:
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