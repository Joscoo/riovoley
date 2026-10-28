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
        - button "Reportes Asistencias, financieros y exportes" [ref=e39] [cursor=pointer]:
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