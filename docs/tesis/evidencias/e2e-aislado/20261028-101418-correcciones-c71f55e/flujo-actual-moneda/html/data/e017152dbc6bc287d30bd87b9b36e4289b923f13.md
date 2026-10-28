# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.happy-path-controlled.spec.js >> admin happy path controlado: atleta + pago + asistencia
- Location: tests\e2e\admin.happy-path-controlled.spec.js:6:1

# Error details

```
Error: expect(locator).toHaveClass(expected) failed

Locator: getByTestId('attendance-athlete-row').filter({ hasText: 'E2E334fd6c525ce' }).getByRole('button', { name: 'Marcar como presente', exact: true })
Expected pattern: /(?:^|\s)bg-emerald-500(?:\s|$)/
Received string:  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-black/40 text-emerald-400 transition-all duration-200 hover:scale-105 hover:bg-emerald-500/20 active:scale-95 "
Timeout: 10000ms

Call log:
  - Expect "toHaveClass" with timeout 10000ms
  - waiting for getByTestId('attendance-athlete-row').filter({ hasText: 'E2E334fd6c525ce' }).getByRole('button', { name: 'Marcar como presente', exact: true })
    14 × locator resolved to <button title="Presente" aria-label="Marcar como presente" class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-black/40 text-emerald-400 transition-all duration-200 hover:scale-105 hover:bg-emerald-500/20 active:scale-95 ">…</button>
       - unexpected value "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-black/40 text-emerald-400 transition-all duration-200 hover:scale-105 hover:bg-emerald-500/20 active:scale-95 "

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
      - generic [ref=e129]: Panel de Administración>Asistencias
      - generic [ref=e131]:
        - generic [ref=e132]:
          - generic [ref=e133]:
            - generic [ref=e134]:
              - heading "Control de Asistencias" [level=2] [ref=e135]:
                - img [ref=e137]
                - text: Control de Asistencias
              - paragraph [ref=e139]: Registro y seguimiento de entrenamientos
            - generic [ref=e141]:
              - button "Exportar" [ref=e142] [cursor=pointer]:
                - img [ref=e143]
                - text: Exportar
              - button "Ver Reportes" [ref=e145] [cursor=pointer]:
                - img [ref=e146]
                - text: Ver Reportes
          - generic [ref=e148]:
            - generic [ref=e150]:
              - generic [ref=e151]:
                - paragraph [ref=e152]: Total Registros
                - paragraph [ref=e153]: "11"
              - img [ref=e155]
            - generic [ref=e158]:
              - generic [ref=e159]:
                - paragraph [ref=e160]: Presentes
                - paragraph [ref=e161]: "8"
              - img [ref=e163]
            - generic [ref=e166]:
              - generic [ref=e167]:
                - paragraph [ref=e168]: Ausentes
                - paragraph [ref=e169]: "3"
              - img [ref=e171]
            - generic [ref=e174]:
              - generic [ref=e175]:
                - paragraph [ref=e176]: Asistencia Promedio
                - paragraph [ref=e177]: 72.7%
              - img [ref=e179]
          - generic [ref=e181]:
            - generic [ref=e182]:
              - generic [ref=e183]:
                - text: "Fecha de Entrenamiento:"
                - textbox "Fecha de Entrenamiento:" [ref=e184]: 2026-10-28
              - generic [ref=e185]:
                - img
                - textbox "Buscar atleta por nombre..." [active] [ref=e186]: E2E334fd6c525ce
                - button "Limpiar búsqueda" [ref=e187] [cursor=pointer]:
                  - img [ref=e188]
              - generic [ref=e190]:
                - generic [ref=e191]:
                  - text: Estado
                  - combobox "Filtrar toma por estado" [ref=e192]:
                    - option "Todos" [selected]
                    - option "Pendientes"
                    - option "Presentes"
                - generic [ref=e193]:
                  - text: Pago
                  - combobox "Filtrar toma por metodo de pago" [ref=e194]:
                    - option "Todos" [selected]
                    - option "Mensualidad"
                    - option "Pago diario"
                    - option "Tarjeta"
                - generic [ref=e195]:
                  - text: Mensualidad
                  - combobox "Filtrar toma por mensualidad" [ref=e196]:
                    - option "Todas" [selected]
                    - option "Activa"
                    - option "Necesita pago"
              - generic [ref=e197]:
                - button "Activas (1)" [ref=e198] [cursor=pointer]:
                  - img [ref=e199]
                  - text: Activas (1)
                - button "Limpiar filtros (1)" [ref=e201] [cursor=pointer]:
                  - img [ref=e202]
                  - text: Limpiar filtros (1)
                - button "Limpiar Dia" [ref=e204] [cursor=pointer]:
                  - img [ref=e205]
                  - text: Limpiar Dia
            - generic [ref=e207]:
              - tablist [ref=e208]:
                - tab "Todas (0/1)" [selected] [ref=e209] [cursor=pointer]:
                  - generic [ref=e211]:
                    - img [ref=e213]
                    - paragraph [ref=e217]: Todas (0/1)
                - tab "Iniciación" [ref=e218] [cursor=pointer]:
                  - generic [ref=e219]:
                    - img [ref=e221]
                    - paragraph [ref=e225]: Iniciación
                - tab "Perfeccionamiento" [ref=e226] [cursor=pointer]:
                  - generic [ref=e227]:
                    - img [ref=e229]
                    - paragraph [ref=e233]: Perfeccionamiento
                - tab "Master" [ref=e234] [cursor=pointer]:
                  - generic [ref=e235]:
                    - img [ref=e237]
                    - paragraph [ref=e241]: Master
              - generic [ref=e242]:
                - generic [ref=e243]:
                  - img [ref=e244]
                  - generic [ref=e246]: "Total: 1"
                - generic [ref=e247]:
                  - img [ref=e248]
                  - generic [ref=e250]: "Presentes: 0"
                - generic [ref=e251]:
                  - img [ref=e252]
                  - generic [ref=e254]: "Ausentes: 1"
                - generic [ref=e255]:
                  - img [ref=e256]
                  - generic [ref=e258]: "Activas: 1"
                - generic [ref=e259]:
                  - img [ref=e260]
                  - generic [ref=e262]: "Asistencia: 0.0%"
              - generic [ref=e264]:
                - generic [ref=e265]:
                  - heading "Iniciación" [level=3] [ref=e266]:
                    - img [ref=e267]
                    - text: Iniciación
                  - generic [ref=e269]:
                    - generic [ref=e270]:
                      - heading "Hombres" [level=4] [ref=e271]:
                        - img [ref=e272]
                        - text: Hombres
                      - generic [ref=e275]:
                        - generic [ref=e276]:
                          - generic [ref=e277]:
                            - generic [ref=e278]: EF
                            - generic "E2E334fd6c525ce Flow" [ref=e279]
                          - generic [ref=e280]:
                            - img [ref=e281]
                            - text: Activa
                        - generic [ref=e283]:
                          - button "Marcar como presente" [ref=e284] [cursor=pointer]:
                            - img [ref=e285]
                          - button "Marcar como ausente" [ref=e287] [cursor=pointer]:
                            - img [ref=e288]
                    - heading "Mujeres" [level=4] [ref=e291]:
                      - img [ref=e292]
                      - text: Mujeres
                - generic [ref=e294]:
                  - heading "Perfeccionamiento" [level=3] [ref=e295]:
                    - img [ref=e296]
                    - text: Perfeccionamiento
                  - generic [ref=e298]:
                    - heading "Hombres" [level=4] [ref=e300]:
                      - img [ref=e301]
                      - text: Hombres
                    - heading "Mujeres" [level=4] [ref=e304]:
                      - img [ref=e305]
                      - text: Mujeres
                - generic [ref=e307]:
                  - heading "Master" [level=3] [ref=e308]:
                    - img [ref=e309]
                    - text: Master
                  - heading "Mujeres" [level=4] [ref=e313]:
                    - img [ref=e314]
                    - text: Mujeres
        - button "Abrir guia del panel" [ref=e316] [cursor=pointer]:
          - img [ref=e317]
```

# Test source

```ts
  1  | ﻿const { test, expect } = require('@playwright/test');
  2  | const { randomUUID } = require('node:crypto');
  3  | const { loginAsAdmin, openAdminSection } = require('./helpers/adminNavigation');
  4  | const ENABLE_MUTATION_FLOW = process.env.E2E_ENABLE_MUTATION_FLOW === 'true';
  5  | 
  6  | test('admin happy path controlado: atleta + pago + asistencia', async ({ page }, testInfo) => {
  7  |   test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');
  8  |   test.skip(!ENABLE_MUTATION_FLOW, 'Set E2E_ENABLE_MUTATION_FLOW=true to run mutation flow.');
  9  |   // Las altas se autorizan exclusivamente en el entorno descartable de este arnés.
  10 |   expect(process.env.E2E_LOCAL_LABEL, 'Usar playwright.local.config.cjs y el arnés aislado').toBeTruthy();
  11 |   expect(testInfo.project.use.baseURL).toBe('http://127.0.0.1:6100');
  12 |   require('../../scripts/e2e/local/safety.cjs').readLocal();
  13 | 
  14 |   const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  15 |   const firstName = `E2E${suffix}`;
  16 |   const fullName = `${firstName} Flow`;
  17 |   const email = `e2e.flow.${suffix}@example.test`;
  18 |   const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  19 | 
  20 |   await loginAsAdmin(page);
  21 |   // Ocultar visualmente las contraseñas temporales en capturas, sin alterar su valor.
  22 |   await page.addStyleTag({ content: '[role="dialog"] code { -webkit-text-security: disc; }' });
  23 |   await openAdminSection(page, 'usuarios');
  24 |   await page.getByRole('tab', { name: /Estudiantes/i }).click();
  25 |   await page.getByRole('button', { name: /Agregar Estudiante/i }).first().click();
  26 |   const form = page.getByRole('dialog', { name: 'Agregar Nuevo Estudiante' });
  27 |   await expect(form).toBeVisible();
  28 |   await form.getByPlaceholder('Ingrese el nombre', { exact: true }).fill(firstName);
  29 |   await form.getByPlaceholder('Ingrese el apellido').fill('Flow');
  30 |   await form.locator('input[type="email"]').fill(email);
  31 |   await form.locator('input[type="tel"]').fill('0999999999');
  32 |   await form.locator('input[type="date"]').fill('2010-01-01');
  33 |   await form.locator('select').selectOption('iniciacion_hombres');
  34 |   await form.getByRole('radio', { name: 'No, enviar despues' }).check();
  35 |   await form.getByRole('button', { name: /^Crear$/i }).click();
  36 | 
  37 |   const credentials = page.getByRole('dialog', { name: 'Credenciales de la cuenta creada' });
  38 |   await expect(credentials).toBeVisible({ timeout: 30000 });
  39 |   const password = await credentials.locator('code').textContent();
  40 |   // Solo runtime ignorado; la revisión de privacidad conoce también claves creadas por UI.
  41 |   const fs = require('node:fs');
  42 |   const path = require('node:path');
  43 |   const { runtime } = require('../../scripts/e2e/local/safety.cjs');
  44 |   fs.appendFileSync(path.join(runtime, 'observed-secrets.jsonl'), JSON.stringify({ password }) + '\n');
  45 |   await credentials.getByRole('button', { name: /^Cerrar$/i }).click();
  46 |   await expect(form).toBeHidden();
  47 |   await page.locator('#user-filters-atleta-search').fill(email);
  48 |   await expect(page.getByText(email, { exact: true }).first()).toBeVisible();
  49 | 
  50 |   await openAdminSection(page, 'pagos');
  51 |   await page.getByRole('button', { name: /Registrar Pago/i }).first().click();
  52 |   const payment = page.getByRole('dialog');
  53 |   await payment.locator('#student_id').fill(firstName);
  54 |   await payment.getByRole('button', { name: new RegExp(fullName, 'i') }).click();
  55 |   await payment.locator('#membership_type_id').selectOption({ label: 'Mensualidad normal' });
  56 |   await expect(payment.locator('#monto')).toBeDisabled();
  57 |   await expect(payment.locator('#monto')).toHaveValue(/^\$\s*35[,.]00$/);
  58 |   await payment.locator('#fecha_pago').fill(today);
  59 |   await payment.getByRole('button', { name: /^Guardar$/i }).click();
  60 |   await expect(payment).toBeHidden({ timeout: 30000 });
  61 |   await page.locator('#payments-search').fill(firstName);
  62 |   const paymentRow = page.locator('tbody tr').filter({ hasText: fullName });
  63 |   await expect(paymentRow).toHaveCount(1);
  64 |   await expect(paymentRow.locator('td[data-label="Monto"]')).toHaveText(/^\$\s*35[,.]00$/);
  65 | 
  66 |   await openAdminSection(page, 'asistencias');
  67 |   await page.getByRole('button', { name: /Registro R.pido/i }).click();
  68 |   await page.locator('#attendance-date').fill(today);
  69 |   await page.getByPlaceholder('Buscar atleta por nombre...').fill(firstName);
  70 |   const athleteRow = page.getByTestId('attendance-athlete-row').filter({ hasText: firstName });
  71 |   await expect(athleteRow).toHaveCount(1);
  72 |   const present = athleteRow.getByRole('button', { name: 'Marcar como presente', exact: true });
  73 |   await expect(present).toBeVisible(); // La mensualidad debe habilitar el control correspondiente.
  74 |   await present.click();
  75 |   await expect(present).toHaveClass(/(?:^|\s)bg-emerald-500(?:\s|$)/);
  76 | 
  77 |   // Una recarga obliga a recuperar datos persistidos, sin mocks de Auth/REST.
  78 |   await page.reload();
  79 |   await openAdminSection(page, 'pagos');
  80 |   await page.locator('#payments-search').fill(firstName);
  81 |   await expect(page.locator('tbody tr').filter({ hasText: fullName }).locator('td[data-label="Monto"]')).toHaveText(/^\$\s*35[,.]00$/);
  82 |   await openAdminSection(page, 'asistencias');
  83 |   await page.getByRole('button', { name: /Registro R.pido/i }).click();
  84 |   await page.locator('#attendance-date').fill(today);
  85 |   await page.getByPlaceholder('Buscar atleta por nombre...').fill(firstName);
> 86 |   await expect(page.getByTestId('attendance-athlete-row').filter({ hasText: firstName }).getByRole('button', { name: 'Marcar como presente', exact: true })).toHaveClass(/(?:^|\s)bg-emerald-500(?:\s|$)/);
     |                                                                                                                                                              ^ Error: expect(locator).toHaveClass(expected) failed
  87 | });
  88 | 
```