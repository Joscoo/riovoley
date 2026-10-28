# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: filters-sorting.tables.spec.js >> pagos: filtros base + orden de columnas por header
- Location: tests\e2e\filters-sorting.tables.spec.js:19:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /^monto$/i }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('button', { name: /^monto$/i }).first()

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
    - main [active] [ref=e21]:
      - generic [ref=e25]: Panel de Administración>Pagos
      - generic [ref=e27]:
        - generic [ref=e28]:
          - generic [ref=e29]:
            - generic [ref=e30]:
              - heading "Gestión de Pagos" [level=2] [ref=e31]:
                - img [ref=e33]
                - text: Gestión de Pagos
              - paragraph [ref=e35]: Administrar mensualidades y pagos del club
            - generic [ref=e37]:
              - button "Actualizar Estados" [ref=e38] [cursor=pointer]:
                - img [ref=e39]
                - text: Actualizar Estados
              - button "Registrar Pago" [ref=e41] [cursor=pointer]:
                - img [ref=e42]
                - text: Registrar Pago
          - generic [ref=e44]:
            - generic [ref=e46]:
              - generic [ref=e47]:
                - heading "Total Pagos" [level=3] [ref=e48]
                - paragraph [ref=e49]: "8"
              - img [ref=e51]
            - generic [ref=e54]:
              - generic [ref=e55]:
                - heading "Activos" [level=3] [ref=e56]
                - paragraph [ref=e57]: "8"
              - img [ref=e59]
            - generic [ref=e62]:
              - generic [ref=e63]:
                - heading "Próximos a Vencer" [level=3] [ref=e64]
                - paragraph [ref=e65]: "0"
              - img [ref=e67]
            - generic [ref=e70]:
              - generic [ref=e71]:
                - heading "Vencidos" [level=3] [ref=e72]
                - paragraph [ref=e73]: "0"
              - img [ref=e75]
            - generic [ref=e78]:
              - generic [ref=e79]:
                - heading "Total Recaudado" [level=3] [ref=e80]
                - paragraph [ref=e81]: $ 280,00
              - img [ref=e83]
          - generic [ref=e86]:
            - generic [ref=e87]:
              - generic [ref=e88]: Búsqueda
              - textbox "Buscar pagos por atleta" [ref=e89]:
                - /placeholder: Buscar por atleta, email o mensualidad...
            - generic [ref=e90]:
              - generic [ref=e91]: Desde
              - textbox "Fecha inicio" [ref=e92]
            - generic [ref=e93]:
              - generic [ref=e94]: Hasta
              - textbox "Fecha fin" [ref=e95]
            - generic [ref=e96]:
              - generic [ref=e97]: Estado
              - combobox "Filtrar por estado de pago" [ref=e98]:
                - option "Todos los estados" [selected]
                - option "Activo"
                - option "Próximo a Vencer"
                - option "Vencido"
            - generic [ref=e99]:
              - generic [ref=e100]: Atleta
              - combobox "Filtrar por atleta" [ref=e101]:
                - option "Todos los atletas" [selected]
                - option "Fixture7 Auditoria"
                - option "Fixture1 Auditoria"
                - option "Fixture2 Auditoria"
                - option "Fixture3 Auditoria"
                - option "Fixture4 Auditoria"
                - option "Fixture5 Auditoria"
                - option "Fixture6 Auditoria"
                - option "Atleta Pruebas"
            - generic [ref=e102]:
              - generic [ref=e103]: Mensualidad
              - combobox "Filtrar por tipo de mensualidad" [ref=e104]:
                - option "Todas" [selected]
                - option "Mensualidad normal"
                - option "Mensualidad en grupo"
            - button "Limpiar" [ref=e106] [cursor=pointer]
          - paragraph [ref=e107]: Mostrando 8 de 8 pagos.
          - generic [ref=e108]:
            - generic [ref=e109]:
              - button "Anterior" [disabled] [ref=e110]
              - generic [ref=e111]: Página 1 de 1
              - button "Siguiente" [disabled] [ref=e112]
            - table [ref=e114]:
              - rowgroup [ref=e115]:
                - row "Atleta Atleta Pruebas Iniciacion hombres Mensualidad Mensualidad normal Período 28/10/2026 - 26/11/2026 Monto $ 35,00 Estado 29 dias restantes Fecha Pago 28/10/2026 Acciones" [ref=e116]:
                  - cell "Atleta Atleta Pruebas Iniciacion hombres" [ref=e117]:
                    - text: Atleta
                    - generic [ref=e118]:
                      - strong [ref=e119]: Atleta Pruebas
                      - generic [ref=e120]: Iniciacion hombres
                  - cell "Mensualidad Mensualidad normal" [ref=e121]
                  - cell "Período 28/10/2026 - 26/11/2026" [ref=e122]
                  - cell "Monto $ 35,00" [ref=e123]
                  - cell "Estado 29 dias restantes" [ref=e124]:
                    - text: Estado
                    - generic [ref=e125]: 29 dias restantes
                  - cell "Fecha Pago 28/10/2026" [ref=e126]
                  - cell "Acciones" [ref=e127]:
                    - text: Acciones
                    - generic [ref=e128]:
                      - button "Editar" [ref=e129] [cursor=pointer]:
                        - img [ref=e130]
                      - button "Eliminar" [ref=e132] [cursor=pointer]:
                        - img [ref=e133]
                - row "Atleta Fixture1 Auditoria Iniciacion mujeres Mensualidad Mensualidad normal Período 28/10/2026 - 26/11/2026 Monto $ 35,00 Estado 29 dias restantes Fecha Pago 28/10/2026 Acciones" [ref=e135]:
                  - cell "Atleta Fixture1 Auditoria Iniciacion mujeres" [ref=e136]:
                    - text: Atleta
                    - generic [ref=e137]:
                      - strong [ref=e138]: Fixture1 Auditoria
                      - generic [ref=e139]: Iniciacion mujeres
                  - cell "Mensualidad Mensualidad normal" [ref=e140]
                  - cell "Período 28/10/2026 - 26/11/2026" [ref=e141]
                  - cell "Monto $ 35,00" [ref=e142]
                  - cell "Estado 29 dias restantes" [ref=e143]:
                    - text: Estado
                    - generic [ref=e144]: 29 dias restantes
                  - cell "Fecha Pago 28/10/2026" [ref=e145]
                  - cell "Acciones" [ref=e146]:
                    - text: Acciones
                    - generic [ref=e147]:
                      - button "Editar" [ref=e148] [cursor=pointer]:
                        - img [ref=e149]
                      - button "Eliminar" [ref=e151] [cursor=pointer]:
                        - img [ref=e152]
                - row "Atleta Fixture2 Auditoria Perfeccionamiento hombres Mensualidad Mensualidad normal Período 28/10/2026 - 26/11/2026 Monto $ 35,00 Estado 29 dias restantes Fecha Pago 28/10/2026 Acciones" [ref=e154]:
                  - cell "Atleta Fixture2 Auditoria Perfeccionamiento hombres" [ref=e155]:
                    - text: Atleta
                    - generic [ref=e156]:
                      - strong [ref=e157]: Fixture2 Auditoria
                      - generic [ref=e158]: Perfeccionamiento hombres
                  - cell "Mensualidad Mensualidad normal" [ref=e159]
                  - cell "Período 28/10/2026 - 26/11/2026" [ref=e160]
                  - cell "Monto $ 35,00" [ref=e161]
                  - cell "Estado 29 dias restantes" [ref=e162]:
                    - text: Estado
                    - generic [ref=e163]: 29 dias restantes
                  - cell "Fecha Pago 28/10/2026" [ref=e164]
                  - cell "Acciones" [ref=e165]:
                    - text: Acciones
                    - generic [ref=e166]:
                      - button "Editar" [ref=e167] [cursor=pointer]:
                        - img [ref=e168]
                      - button "Eliminar" [ref=e170] [cursor=pointer]:
                        - img [ref=e171]
                - row "Atleta Fixture3 Auditoria Perfeccionamiento mujeres Mensualidad Mensualidad normal Período 28/10/2026 - 26/11/2026 Monto $ 35,00 Estado 29 dias restantes Fecha Pago 28/10/2026 Acciones" [ref=e173]:
                  - cell "Atleta Fixture3 Auditoria Perfeccionamiento mujeres" [ref=e174]:
                    - text: Atleta
                    - generic [ref=e175]:
                      - strong [ref=e176]: Fixture3 Auditoria
                      - generic [ref=e177]: Perfeccionamiento mujeres
                  - cell "Mensualidad Mensualidad normal" [ref=e178]
                  - cell "Período 28/10/2026 - 26/11/2026" [ref=e179]
                  - cell "Monto $ 35,00" [ref=e180]
                  - cell "Estado 29 dias restantes" [ref=e181]:
                    - text: Estado
                    - generic [ref=e182]: 29 dias restantes
                  - cell "Fecha Pago 28/10/2026" [ref=e183]
                  - cell "Acciones" [ref=e184]:
                    - text: Acciones
                    - generic [ref=e185]:
                      - button "Editar" [ref=e186] [cursor=pointer]:
                        - img [ref=e187]
                      - button "Eliminar" [ref=e189] [cursor=pointer]:
                        - img [ref=e190]
                - row "Atleta Fixture4 Auditoria Master Hombres Mensualidad Mensualidad normal Período 28/10/2026 - 26/11/2026 Monto $ 35,00 Estado 29 dias restantes Fecha Pago 28/10/2026 Acciones" [ref=e192]:
                  - cell "Atleta Fixture4 Auditoria Master Hombres" [ref=e193]:
                    - text: Atleta
                    - generic [ref=e194]:
                      - strong [ref=e195]: Fixture4 Auditoria
                      - generic [ref=e196]: Master Hombres
                  - cell "Mensualidad Mensualidad normal" [ref=e197]
                  - cell "Período 28/10/2026 - 26/11/2026" [ref=e198]
                  - cell "Monto $ 35,00" [ref=e199]
                  - cell "Estado 29 dias restantes" [ref=e200]:
                    - text: Estado
                    - generic [ref=e201]: 29 dias restantes
                  - cell "Fecha Pago 28/10/2026" [ref=e202]
                  - cell "Acciones" [ref=e203]:
                    - text: Acciones
                    - generic [ref=e204]:
                      - button "Editar" [ref=e205] [cursor=pointer]:
                        - img [ref=e206]
                      - button "Eliminar" [ref=e208] [cursor=pointer]:
                        - img [ref=e209]
                - row "Atleta Fixture5 Auditoria Master mujeres Mensualidad Mensualidad normal Período 28/10/2026 - 26/11/2026 Monto $ 35,00 Estado 29 dias restantes Fecha Pago 28/10/2026 Acciones" [ref=e211]:
                  - cell "Atleta Fixture5 Auditoria Master mujeres" [ref=e212]:
                    - text: Atleta
                    - generic [ref=e213]:
                      - strong [ref=e214]: Fixture5 Auditoria
                      - generic [ref=e215]: Master mujeres
                  - cell "Mensualidad Mensualidad normal" [ref=e216]
                  - cell "Período 28/10/2026 - 26/11/2026" [ref=e217]
                  - cell "Monto $ 35,00" [ref=e218]
                  - cell "Estado 29 dias restantes" [ref=e219]:
                    - text: Estado
                    - generic [ref=e220]: 29 dias restantes
                  - cell "Fecha Pago 28/10/2026" [ref=e221]
                  - cell "Acciones" [ref=e222]:
                    - text: Acciones
                    - generic [ref=e223]:
                      - button "Editar" [ref=e224] [cursor=pointer]:
                        - img [ref=e225]
                      - button "Eliminar" [ref=e227] [cursor=pointer]:
                        - img [ref=e228]
                - row "Atleta Fixture6 Auditoria Iniciacion hombres Mensualidad Mensualidad normal Período 28/10/2026 - 26/11/2026 Monto $ 35,00 Estado 29 dias restantes Fecha Pago 28/10/2026 Acciones" [ref=e230]:
                  - cell "Atleta Fixture6 Auditoria Iniciacion hombres" [ref=e231]:
                    - text: Atleta
                    - generic [ref=e232]:
                      - strong [ref=e233]: Fixture6 Auditoria
                      - generic [ref=e234]: Iniciacion hombres
                  - cell "Mensualidad Mensualidad normal" [ref=e235]
                  - cell "Período 28/10/2026 - 26/11/2026" [ref=e236]
                  - cell "Monto $ 35,00" [ref=e237]
                  - cell "Estado 29 dias restantes" [ref=e238]:
                    - text: Estado
                    - generic [ref=e239]: 29 dias restantes
                  - cell "Fecha Pago 28/10/2026" [ref=e240]
                  - cell "Acciones" [ref=e241]:
                    - text: Acciones
                    - generic [ref=e242]:
                      - button "Editar" [ref=e243] [cursor=pointer]:
                        - img [ref=e244]
                      - button "Eliminar" [ref=e246] [cursor=pointer]:
                        - img [ref=e247]
                - row "Atleta Fixture7 Auditoria Iniciacion mujeres Mensualidad Mensualidad normal Período 28/10/2026 - 26/11/2026 Monto $ 35,00 Estado 29 dias restantes Fecha Pago 28/10/2026 Acciones" [ref=e249]:
                  - cell "Atleta Fixture7 Auditoria Iniciacion mujeres" [ref=e250]:
                    - text: Atleta
                    - generic [ref=e251]:
                      - strong [ref=e252]: Fixture7 Auditoria
                      - generic [ref=e253]: Iniciacion mujeres
                  - cell "Mensualidad Mensualidad normal" [ref=e254]
                  - cell "Período 28/10/2026 - 26/11/2026" [ref=e255]
                  - cell "Monto $ 35,00" [ref=e256]
                  - cell "Estado 29 dias restantes" [ref=e257]:
                    - text: Estado
                    - generic [ref=e258]: 29 dias restantes
                  - cell "Fecha Pago 28/10/2026" [ref=e259]
                  - cell "Acciones" [ref=e260]:
                    - text: Acciones
                    - generic [ref=e261]:
                      - button "Editar" [ref=e262] [cursor=pointer]:
                        - img [ref=e263]
                      - button "Eliminar" [ref=e265] [cursor=pointer]:
                        - img [ref=e266]
            - generic [ref=e268]:
              - button "Anterior" [disabled] [ref=e269]
              - generic [ref=e270]: Página 1 de 1
              - button "Siguiente" [disabled] [ref=e271]
        - button "Abrir guia del panel" [ref=e272] [cursor=pointer]:
          - img [ref=e273]
```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | const { openAdminSection, loginAsAdmin } = require('./helpers/adminNavigation');
  3   | 
  4   | const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
  5   | const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
  6   | 
  7   | async function assertThreeStateSortFromHeaderButton(headerButton) {
  8   |   const header = headerButton.locator('xpath=ancestor::th[1]');
  9   | 
  10  |   await expect(header).toHaveAttribute('aria-sort', 'none');
  11  |   await headerButton.click();
  12  |   await expect(header).toHaveAttribute('aria-sort', 'ascending');
  13  |   await headerButton.click();
  14  |   await expect(header).toHaveAttribute('aria-sort', 'descending');
  15  |   await headerButton.click();
  16  |   await expect(header).toHaveAttribute('aria-sort', 'none');
  17  | }
  18  | 
  19  | test('pagos: filtros base + orden de columnas por header', async ({ page }) => {
  20  |   test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');
  21  | 
  22  |   await loginAsAdmin(page);
  23  |   await openAdminSection(page, 'pagos');
  24  |   await expect(page.getByRole('main').getByRole('heading', { name: /gesti[oó]n de pagos/i })).toBeVisible();
  25  | 
  26  |   const searchInput = page.locator('#payments-search');
  27  |   const statusFilter = page.locator('#payments-status-filter');
  28  |   const athleteFilter = page.locator('#payments-athlete-filter');
  29  |   const clearButton = page.getByRole('main').getByRole('button', { name: /^limpiar$/i });
  30  | 
  31  |   await expect(searchInput).toBeVisible();
  32  |   await expect(statusFilter).toBeVisible();
  33  |   await expect(athleteFilter).toBeVisible();
  34  |   await expect(clearButton).toBeVisible();
  35  | 
  36  |   await searchInput.fill('e2e-filter-sorting-check');
  37  |   await expect(searchInput).toHaveValue('e2e-filter-sorting-check');
  38  |   await statusFilter.selectOption('vencido');
  39  |   await expect(statusFilter).toHaveValue('vencido');
  40  | 
  41  |   const athleteOptionsCount = await athleteFilter.locator('option').count();
  42  |   if (athleteOptionsCount > 1) {
  43  |     await athleteFilter.selectOption({ index: 1 });
  44  |     await expect(athleteFilter).not.toHaveValue('');
  45  |   }
  46  | 
  47  |   await clearButton.click();
  48  |   await expect(searchInput).toHaveValue('');
  49  |   await expect(statusFilter).toHaveValue('');
  50  |   await expect(athleteFilter).toHaveValue('');
  51  | 
  52  |   const montoHeaderButton = page.getByRole('button', { name: /^monto$/i }).first();
> 53  |   await expect(montoHeaderButton).toBeVisible();
      |                                   ^ Error: expect(locator).toBeVisible() failed
  54  |   await assertThreeStateSortFromHeaderButton(montoHeaderButton);
  55  | 
  56  |   const initialOverflow = await page.evaluate(() => document.body.style.overflow);
  57  |   await page.getByRole('main').getByRole('button', { name: /registrar pago|agregar pago/i }).first().click();
  58  |   await expect(page.getByRole('dialog')).toBeVisible();
  59  |   await page.keyboard.press('Escape');
  60  |   await expect(page.getByRole('dialog')).toHaveCount(0);
  61  |   await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe(initialOverflow);
  62  | });
  63  | 
  64  | test('asistencias: filtros del historial + orden por columnas', async ({ page }) => {
  65  |   test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');
  66  | 
  67  |   await loginAsAdmin(page);
  68  |   await openAdminSection(page, 'asistencias');
  69  |   await expect(page.getByRole('main').getByRole('heading', { name: /control de asistencias/i })).toBeVisible();
  70  | 
  71  |   const dateFrom = page.locator('#fecha-inicio');
  72  |   const dateTo = page.locator('#fecha-fin');
  73  |   const categoriaFilter = page.locator('#categoria-filter');
  74  |   const atletaFilter = page.locator('#atleta-filter');
  75  |   const metodoPagoFilter = page.locator('#metodo-pago-filter');
  76  |   const clearFiltersButton = page.locator('#attendance-clear-filters');
  77  |   const sortByDateButton = page.locator('#attendance-sort-fecha');
  78  | 
  79  |   await expect(dateFrom).toBeVisible();
  80  |   await expect(dateTo).toBeVisible();
  81  |   await expect(categoriaFilter).toBeVisible();
  82  |   await expect(atletaFilter).toBeVisible();
  83  |   await expect(metodoPagoFilter).toBeVisible();
  84  |   await expect(sortByDateButton).toBeVisible();
  85  | 
  86  |   const initialDateFrom = await dateFrom.inputValue();
  87  |   const initialDateTo = await dateTo.inputValue();
  88  | 
  89  |   await sortByDateButton.click();
  90  |   await expect(sortByDateButton).toContainText(/fecha/i);
  91  | 
  92  |   await categoriaFilter.selectOption('perfeccionamiento_hombres');
  93  |   await expect(categoriaFilter).toHaveValue('perfeccionamiento_hombres');
  94  | 
  95  |   const atletaOptionsCount = await atletaFilter.locator('option').count();
  96  |   if (atletaOptionsCount > 1) {
  97  |     await atletaFilter.selectOption({ index: 1 });
  98  |     await expect(atletaFilter).not.toHaveValue('');
  99  |   }
  100 | 
  101 |   const metodoOptionsCount = await metodoPagoFilter.locator('option').count();
  102 |   if (metodoOptionsCount > 1) {
  103 |     await metodoPagoFilter.selectOption({ index: 1 });
  104 |     await expect(metodoPagoFilter).not.toHaveValue('');
  105 |   }
  106 | 
  107 |   await clearFiltersButton.click();
  108 |   await expect(categoriaFilter).toHaveValue('');
  109 |   await expect(atletaFilter).toHaveValue('');
  110 |   await expect(metodoPagoFilter).toHaveValue('');
  111 |   await expect(dateFrom).toHaveValue(initialDateFrom);
  112 |   await expect(dateTo).toHaveValue(initialDateTo);
  113 | 
  114 |   const historySection = page.getByTestId('attendance-history-table').first();
  115 |   await expect(historySection).toBeVisible();
  116 |   const dayHeaders = historySection.getByTestId('attendance-day-header');
  117 |   const dayCount = await dayHeaders.count();
  118 | 
  119 |   if (dayCount > 0) {
  120 |     const controlledId = await dayHeaders.first().locator('button[aria-expanded]').getAttribute('aria-controls');
  121 |     const dayToggle = historySection.locator(`button[aria-controls="${controlledId}"]`);
  122 |     if (await dayToggle.getAttribute('aria-expanded') === 'false') await dayToggle.click();
  123 |     await expect(dayToggle).toHaveAttribute('aria-expanded', 'true');
  124 |     const atletaHeaderButton = historySection.getByRole('button', { name: /^atleta$/i }).first();
  125 |     if (await atletaHeaderButton.count()) {
  126 |       await expect(atletaHeaderButton).toBeVisible();
  127 |       await assertThreeStateSortFromHeaderButton(atletaHeaderButton);
  128 |     }
  129 |   } else {
  130 |     await expect(page.getByText(/no hay registros de asistencia/i).first()).toBeVisible();
  131 |   }
  132 | });
  133 | 
```