# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: filters-sorting.tables.spec.js >> asistencias: filtros del historial + orden por columnas
- Location: tests\e2e\filters-sorting.tables.spec.js:80:1

# Error details

```
Error: toBeOK can be only used with APIResponse object
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
        - generic [ref=e12]: "6"
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
      - generic [ref=e25]: Panel de Administración>Asistencias
      - generic [ref=e27]:
        - generic [ref=e28]:
          - generic [ref=e29]:
            - generic [ref=e30]:
              - heading "Control de Asistencias" [level=2] [ref=e31]:
                - img [ref=e33]
                - text: Control de Asistencias
              - paragraph [ref=e35]: Registro y seguimiento de entrenamientos
            - button "Registro Rápido" [ref=e38] [cursor=pointer]:
              - img [ref=e39]
              - text: Registro Rápido
          - generic [ref=e41]:
            - generic [ref=e43]:
              - generic [ref=e44]:
                - paragraph [ref=e45]: Total Registros
                - paragraph [ref=e46]: "83"
              - img [ref=e48]
            - generic [ref=e51]:
              - generic [ref=e52]:
                - paragraph [ref=e53]: Presentes
                - paragraph [ref=e54]: "83"
              - img [ref=e56]
            - generic [ref=e59]:
              - generic [ref=e60]:
                - paragraph [ref=e61]: Ausentes
                - paragraph [ref=e62]: "89"
              - img [ref=e64]
            - generic [ref=e67]:
              - generic [ref=e68]:
                - paragraph [ref=e69]: Asistencia Promedio
                - paragraph [ref=e70]: 15.7%
              - img [ref=e72]
          - generic [ref=e74]:
            - search "Filtros de asistencias" [ref=e76]:
              - generic [ref=e77]:
                - generic [ref=e78]:
                  - generic [ref=e79]: Buscar en historial
                  - searchbox "Buscar asistencias por atleta o categoria" [ref=e80]
                - generic [ref=e82]:
                  - paragraph [ref=e83]: "Registros mostrados: 83"
                  - paragraph [ref=e84]: "Filtros activos: 0"
              - generic [ref=e85]:
                - generic [ref=e86]:
                  - generic [ref=e87]: Desde
                  - textbox [ref=e88]: 2026-10-23
                - generic [ref=e89]:
                  - generic [ref=e90]: Hasta
                  - textbox [ref=e91]: 2026-10-30
                - generic [ref=e93]:
                  - button "Hoy" [ref=e94] [cursor=pointer]
                  - button "7 dias" [ref=e95] [cursor=pointer]
                  - button "30 dias" [ref=e96] [cursor=pointer]
                  - button "Mes actual" [ref=e97] [cursor=pointer]
                - generic [ref=e98]:
                  - generic [ref=e99]: Categoria
                  - combobox [ref=e100]:
                    - option "Todas las categorias" [selected]
                    - option "Iniciacion hombres"
                    - option "Iniciacion mujeres"
                    - option "Perfeccionamiento mujeres"
                    - option "Perfeccionamiento hombres"
                    - option "Master mujeres"
                - generic [ref=e101]:
                  - generic [ref=e102]: Atleta
                  - combobox [ref=e103]:
                    - option "Todos los atletas" [selected]
                    - option "Fixture6 Auditoria"
                    - option "Fixture5 Auditoria"
                    - option "Fixture4 Auditoria"
                    - option "Fixture3 Auditoria"
                    - option "Fixture2 Auditoria"
                    - option "Fixture7 Auditoria"
                    - option "Fixture1 Auditoria"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "Fixture Cierre"
                    - option "E2E17d593128749 Flow"
                    - option "E2E96e87fb9b428 Flow"
                    - option "E2Ec5163bd43093 Flow"
                    - option "E2E33ca3f7b1d56 Flow"
                    - option "E2Ec5a70dc502e3 Flow"
                    - option "E2E1efd3b3e0e2c Flow"
                    - option "E2E38f40f0a1e52 Flow"
                    - option "E2E830f3a41df57 Flow"
                    - option "E2Ef1c26588d364 Flow"
                    - option "E2E74179617a293 Flow"
                    - option "E2E6bd4009a2275 Flow"
                    - option "E2Eb1a9007bd4ca Flow"
                    - option "E2Eca50e8a14f8e Flow"
                    - option "E2E7cfaddab275c Flow"
                    - option "E2Ec03ee1200c00 Flow"
                    - option "E2Ed03076d6b4c0 Flow"
                    - option "E2E334fd6c525ce Flow"
                    - option "E2Eed9682c4a645 Flow"
                    - option "E2E8201a1c91a2b Flow"
                    - option "E2E2659726e3fd6 Flow"
                    - option "E2E13d48e02bf58 Flow"
                    - option "E2E314f04fcecd7 Flow"
                    - option "E2E9fc7deff4e26 Flow"
                    - option "E2E187f6e4cff91 Flow"
                    - option "E2E6acec1d8edf7 Flow"
                    - option "E2E62b03a928299 Flow"
                    - option "E2Ee86c72218700 Flow"
                    - option "E2E0657483d13f1 Flow"
                    - option "E2E0781e6ad9e04 Flow"
                    - option "E2E8efff5be04d4 Flow"
                    - option "E2E0b330a5cf926 Flow"
                    - option "E2E0ea2ce01f579 Flow"
                    - option "E2Eecb6a679cfab Flow"
                    - option "E2E91175a0fb117 Flow"
                    - option "E2Ed43af4aceb85 Flow"
                    - option "E2E1b296482b31e Flow"
                    - option "E2Eb7ced1bce36d Flow"
                    - option "Atleta Pruebas"
                - generic [ref=e104]:
                  - generic [ref=e105]: Metodo de pago
                  - combobox [ref=e106]:
                    - option "Todos" [selected]
                    - option "Mensualidad"
                    - option "Pago diario"
                    - option "Tarjeta"
              - generic [ref=e107]:
                - button "Limpiar" [active] [ref=e108] [cursor=pointer]
                - button "Fecha (desc)" [ref=e109] [cursor=pointer]
            - generic [ref=e110]:
              - heading "Reportes Persistidos" [level=3] [ref=e111]:
                - img [ref=e112]
                - text: Reportes Persistidos
              - paragraph [ref=e114]: No hay reportes persistidos para el rango seleccionado.
            - generic [ref=e115]:
              - heading "Estadísticas por Categoría" [level=3] [ref=e116]:
                - img [ref=e117]
                - text: Estadísticas por Categoría
              - generic [ref=e119]:
                - generic [ref=e120]:
                  - heading "Iniciacion hombres" [level=4] [ref=e121]
                  - generic [ref=e122]:
                    - generic [ref=e123]: "Presentes: 77"
                    - generic [ref=e124]: "Total: 100"
                    - generic [ref=e125]: 77.0%
                - generic [ref=e126]:
                  - heading "Iniciacion mujeres" [level=4] [ref=e127]
                  - generic [ref=e128]:
                    - generic [ref=e129]: "Presentes: 2"
                    - generic [ref=e130]: "Total: 2"
                    - generic [ref=e131]: 100.0%
                - generic [ref=e132]:
                  - heading "Perfeccionamiento mujeres" [level=4] [ref=e133]
                  - generic [ref=e134]:
                    - generic [ref=e135]: "Presentes: 1"
                    - generic [ref=e136]: "Total: 1"
                    - generic [ref=e137]: 100.0%
                - generic [ref=e138]:
                  - heading "Perfeccionamiento hombres" [level=4] [ref=e139]
                  - generic [ref=e140]:
                    - generic [ref=e141]: "Presentes: 1"
                    - generic [ref=e142]: "Total: 1"
                    - generic [ref=e143]: 100.0%
                - generic [ref=e144]:
                  - heading "Master mujeres" [level=4] [ref=e145]
                  - generic [ref=e146]:
                    - generic [ref=e147]: "Presentes: 1"
                    - generic [ref=e148]: "Total: 1"
                    - generic [ref=e149]: 100.0%
            - generic [ref=e150]:
              - heading "Historial de Asistencias por Día" [level=3] [ref=e151]:
                - img [ref=e152]
                - text: Historial de Asistencias por Día
              - generic [ref=e154]:
                - generic [ref=e156]:
                  - heading "jueves, 29 de octubre de 2026 16 asistencias" [level=4] [ref=e157]:
                    - button "jueves, 29 de octubre de 2026 16 asistencias" [ref=e158] [cursor=pointer]:
                      - generic [ref=e159]:
                        - img [ref=e160]
                        - text: jueves, 29 de octubre de 2026
                      - generic [ref=e162]: 16 asistencias
                  - generic [ref=e163]:
                    - button "Exportar" [ref=e164] [cursor=pointer]:
                      - img [ref=e165]
                      - text: Exportar
                    - generic [ref=e167]: +
                - generic [ref=e169]:
                  - heading "miércoles, 28 de octubre de 2026 42 asistencias" [level=4] [ref=e170]:
                    - button "miércoles, 28 de octubre de 2026 42 asistencias" [ref=e171] [cursor=pointer]:
                      - generic [ref=e172]:
                        - img [ref=e173]
                        - text: miércoles, 28 de octubre de 2026
                      - generic [ref=e175]: 42 asistencias
                  - generic [ref=e176]:
                    - button "Exportar" [ref=e177] [cursor=pointer]:
                      - img [ref=e178]
                      - text: Exportar
                    - generic [ref=e180]: +
                - generic [ref=e182]:
                  - heading "martes, 27 de octubre de 2026 10 asistencias" [level=4] [ref=e183]:
                    - button "martes, 27 de octubre de 2026 10 asistencias" [ref=e184] [cursor=pointer]:
                      - generic [ref=e185]:
                        - img [ref=e186]
                        - text: martes, 27 de octubre de 2026
                      - generic [ref=e188]: 10 asistencias
                  - generic [ref=e189]:
                    - button "Exportar" [ref=e190] [cursor=pointer]:
                      - img [ref=e191]
                      - text: Exportar
                    - generic [ref=e193]: +
                - generic [ref=e195]:
                  - heading "lunes, 26 de octubre de 2026 10 asistencias" [level=4] [ref=e196]:
                    - button "lunes, 26 de octubre de 2026 10 asistencias" [ref=e197] [cursor=pointer]:
                      - generic [ref=e198]:
                        - img [ref=e199]
                        - text: lunes, 26 de octubre de 2026
                      - generic [ref=e201]: 10 asistencias
                  - generic [ref=e202]:
                    - button "Exportar" [ref=e203] [cursor=pointer]:
                      - img [ref=e204]
                      - text: Exportar
                    - generic [ref=e206]: +
                - generic [ref=e208]:
                  - heading "viernes, 23 de octubre de 2026 5 asistencias" [level=4] [ref=e209]:
                    - button "viernes, 23 de octubre de 2026 5 asistencias" [ref=e210] [cursor=pointer]:
                      - generic [ref=e211]:
                        - img [ref=e212]
                        - text: viernes, 23 de octubre de 2026
                      - generic [ref=e214]: 5 asistencias
                  - generic [ref=e215]:
                    - button "Exportar" [ref=e216] [cursor=pointer]:
                      - img [ref=e217]
                      - text: Exportar
                    - generic [ref=e219]: +
        - button "Abrir guia del panel" [ref=e220] [cursor=pointer]:
          - img [ref=e221]
```

# Test source

```ts
  38  |   await expect(searchInput).toHaveValue('e2e-filter-sorting-check');
  39  |   await statusFilter.selectOption('vencido');
  40  |   await expect(statusFilter).toHaveValue('vencido');
  41  | 
  42  |   const athleteOptionsCount = await athleteFilter.locator('option').count();
  43  |   if (athleteOptionsCount > 1) {
  44  |     await athleteFilter.selectOption({ index: 1 });
  45  |     await expect(athleteFilter).not.toHaveValue('');
  46  |   }
  47  | 
  48  |   await clearButton.click();
  49  |   await expect(searchInput).toHaveValue('');
  50  |   await expect(statusFilter).toHaveValue('');
  51  |   await expect(athleteFilter).toHaveValue('');
  52  | 
  53  |   const mobileSort = page.getByRole('group', { name: 'Ordenar pagos' });
  54  |   const onCards = await mobileSort.isVisible();
  55  |   const montoButton = onCards
  56  |     ? mobileSort.getByRole('button', { name: /^Ordenar por Monto:/ })
  57  |     : page.getByRole('button', { name: /^monto$/i }).first();
  58  |   const header = montoButton.locator('xpath=ancestor::th[1]');
  59  |   const assertSortState = async (state, description) => {
  60  |     if (onCards) await expect(montoButton).toHaveAccessibleName(`Ordenar por Monto: ${description}`);
  61  |     else await expect(header).toHaveAttribute('aria-sort', state);
  62  |   };
  63  |   await expect(montoButton).toBeVisible();
  64  |   await assertSortState('none', 'sin ordenar');
  65  |   await assertPaymentAmountsSorted(page, false, montoButton);
  66  |   await assertSortState('ascending', 'ascendente');
  67  |   await assertPaymentAmountsSorted(page, true, montoButton);
  68  |   await assertSortState('descending', 'descendente');
  69  |   await montoButton.click();
  70  |   await assertSortState('none', 'sin ordenar');
  71  | 
  72  |   const initialOverflow = await page.evaluate(() => document.body.style.overflow);
  73  |   await page.getByRole('main').getByRole('button', { name: /registrar pago|agregar pago/i }).first().click();
  74  |   await expect(page.getByRole('dialog')).toBeVisible();
  75  |   await page.keyboard.press('Escape');
  76  |   await expect(page.getByRole('dialog')).toHaveCount(0);
  77  |   await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe(initialOverflow);
  78  | });
  79  | 
  80  | test('asistencias: filtros del historial + orden por columnas', async ({ page }) => {
  81  |   test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');
  82  | 
  83  |   await loginAsAdmin(page);
  84  |   await openAdminSection(page, 'asistencias');
  85  |   await expect(page.getByRole('main').getByRole('heading', { name: /control de asistencias/i })).toBeVisible();
  86  | 
  87  |   const dateFrom = page.locator('#fecha-inicio');
  88  |   const dateTo = page.locator('#fecha-fin');
  89  |   const categoriaFilter = page.locator('#categoria-filter');
  90  |   const atletaFilter = page.locator('#atleta-filter');
  91  |   const metodoPagoFilter = page.locator('#metodo-pago-filter');
  92  |   const clearFiltersButton = page.locator('#attendance-clear-filters');
  93  |   const sortByDateButton = page.locator('#attendance-sort-fecha');
  94  | 
  95  |   await expect(dateFrom).toBeVisible();
  96  |   await expect(dateTo).toBeVisible();
  97  |   await expect(categoriaFilter).toBeVisible();
  98  |   await expect(atletaFilter).toBeVisible();
  99  |   await expect(metodoPagoFilter).toBeVisible();
  100 |   await expect(sortByDateButton).toBeVisible();
  101 | 
  102 |   const initialDateFrom = await dateFrom.inputValue();
  103 |   const initialDateTo = await dateTo.inputValue();
  104 | 
  105 |   await sortByDateButton.click();
  106 |   await expect(sortByDateButton).toContainText(/fecha/i);
  107 | 
  108 |   await categoriaFilter.selectOption('perfeccionamiento_hombres');
  109 |   await expect(categoriaFilter).toHaveValue('perfeccionamiento_hombres');
  110 | 
  111 |   const atletaOptionsCount = await atletaFilter.locator('option').count();
  112 |   if (atletaOptionsCount > 1) {
  113 |     await atletaFilter.selectOption({ index: 1 });
  114 |     await expect(atletaFilter).not.toHaveValue('');
  115 |   }
  116 | 
  117 |   const metodoOptionsCount = await metodoPagoFilter.locator('option').count();
  118 |   if (metodoOptionsCount > 1) {
  119 |     await metodoPagoFilter.selectOption({ index: 1 });
  120 |     await expect(metodoPagoFilter).not.toHaveValue('');
  121 |   }
  122 | 
  123 |   // Wait for the request caused by resetting the filters. A visible container
  124 |   // can belong to the previous query and disappear during the next render.
  125 |   const resetRequestPromise = page.waitForRequest((request) => {
  126 |     const url = new URL(request.url());
  127 |     const dates = url.searchParams.getAll('fecha');
  128 |     return request.method() === 'GET'
  129 |       && url.pathname.endsWith('/rest/v1/attendances')
  130 |       && dates.includes(`gte.${initialDateFrom}`)
  131 |       && dates.includes(`lte.${initialDateTo}`)
  132 |       && !url.searchParams.has('student_id')
  133 |       && !url.searchParams.has('metodo_pago_id');
  134 |   });
  135 |   await clearFiltersButton.click();
  136 |   const resetResponse = await (await resetRequestPromise).response();
  137 |   expect(resetResponse).not.toBeNull();
> 138 |   await expect(resetResponse).toBeOK();
      |                               ^ Error: toBeOK can be only used with APIResponse object
  139 |   const resetRows = await resetResponse.json();
  140 |   expect(Array.isArray(resetRows)).toBe(true);
  141 |   await expect(categoriaFilter).toHaveValue('');
  142 |   await expect(atletaFilter).toHaveValue('');
  143 |   await expect(metodoPagoFilter).toHaveValue('');
  144 |   await expect(dateFrom).toHaveValue(initialDateFrom);
  145 |   await expect(dateTo).toHaveValue(initialDateTo);
  146 | 
  147 |   const historySection = page.getByTestId('attendance-history-table').first();
  148 |   await expect(historySection).toBeVisible();
  149 |   const dayHeaders = historySection.getByTestId('attendance-day-header');
  150 |   if (resetRows.length > 0) {
  151 |     await expect(dayHeaders.first()).toBeVisible();
  152 |     const controlledId = await dayHeaders.first().locator('button[aria-expanded]').getAttribute('aria-controls');
  153 |     const dayToggle = historySection.locator(`button[aria-controls="${controlledId}"]`);
  154 |     if (await dayToggle.getAttribute('aria-expanded') === 'false') await dayToggle.click();
  155 |     await expect(dayToggle).toHaveAttribute('aria-expanded', 'true');
  156 |     const atletaHeaderButton = historySection.getByRole('button', { name: /^atleta$/i }).first();
  157 |     if (await atletaHeaderButton.count()) {
  158 |       await expect(atletaHeaderButton).toBeVisible();
  159 |       await assertThreeStateSortFromHeaderButton(atletaHeaderButton);
  160 |     }
  161 |   } else {
  162 |     await expect(page.getByText(/no hay registros de asistencia/i).first()).toBeVisible();
  163 |   }
  164 | });
  165 | 
```