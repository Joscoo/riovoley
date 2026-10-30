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
      - generic [ref=e113]: Panel de Administración>Asistencias
      - generic [ref=e115]:
        - generic [ref=e116]:
          - generic [ref=e117]:
            - generic [ref=e118]:
              - heading "Control de Asistencias" [level=2] [ref=e119]:
                - img [ref=e121]
                - text: Control de Asistencias
              - paragraph [ref=e123]: Registro y seguimiento de entrenamientos
            - button "Registro Rápido" [ref=e126] [cursor=pointer]:
              - img [ref=e127]
              - text: Registro Rápido
          - generic [ref=e129]:
            - generic [ref=e131]:
              - generic [ref=e132]:
                - paragraph [ref=e133]: Total Registros
                - paragraph [ref=e134]: "83"
              - img [ref=e136]
            - generic [ref=e139]:
              - generic [ref=e140]:
                - paragraph [ref=e141]: Presentes
                - paragraph [ref=e142]: "83"
              - img [ref=e144]
            - generic [ref=e147]:
              - generic [ref=e148]:
                - paragraph [ref=e149]: Ausentes
                - paragraph [ref=e150]: "89"
              - img [ref=e152]
            - generic [ref=e155]:
              - generic [ref=e156]:
                - paragraph [ref=e157]: Asistencia Promedio
                - paragraph [ref=e158]: 15.7%
              - img [ref=e160]
          - generic [ref=e162]:
            - search "Filtros de asistencias" [ref=e164]:
              - generic [ref=e165]:
                - generic [ref=e166]:
                  - generic [ref=e167]: Buscar en historial
                  - searchbox "Buscar asistencias por atleta o categoria" [ref=e168]
                - generic [ref=e170]:
                  - paragraph [ref=e171]: "Registros mostrados: 83"
                  - paragraph [ref=e172]: "Filtros activos: 0"
              - generic [ref=e173]:
                - generic [ref=e174]:
                  - generic [ref=e175]: Desde
                  - textbox [ref=e176]: 2026-10-23
                - generic [ref=e177]:
                  - generic [ref=e178]: Hasta
                  - textbox [ref=e179]: 2026-10-30
                - generic [ref=e181]:
                  - button "Hoy" [ref=e182] [cursor=pointer]
                  - button "7 dias" [ref=e183] [cursor=pointer]
                  - button "30 dias" [ref=e184] [cursor=pointer]
                  - button "Mes actual" [ref=e185] [cursor=pointer]
                - generic [ref=e186]:
                  - generic [ref=e187]: Categoria
                  - combobox [ref=e188]:
                    - option "Todas las categorias" [selected]
                    - option "Iniciacion hombres"
                    - option "Iniciacion mujeres"
                    - option "Perfeccionamiento mujeres"
                    - option "Perfeccionamiento hombres"
                    - option "Master mujeres"
                - generic [ref=e189]:
                  - generic [ref=e190]: Atleta
                  - combobox [ref=e191]:
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
                - generic [ref=e192]:
                  - generic [ref=e193]: Metodo de pago
                  - combobox [ref=e194]:
                    - option "Todos" [selected]
                    - option "Mensualidad"
                    - option "Pago diario"
                    - option "Tarjeta"
              - generic [ref=e195]:
                - button "Limpiar" [active] [ref=e196] [cursor=pointer]
                - button "Fecha (desc)" [ref=e197] [cursor=pointer]
            - generic [ref=e198]:
              - heading "Reportes Persistidos" [level=3] [ref=e199]:
                - img [ref=e200]
                - text: Reportes Persistidos
              - paragraph [ref=e202]: No hay reportes persistidos para el rango seleccionado.
            - generic [ref=e203]:
              - heading "Estadísticas por Categoría" [level=3] [ref=e204]:
                - img [ref=e205]
                - text: Estadísticas por Categoría
              - generic [ref=e207]:
                - generic [ref=e208]:
                  - heading "Iniciacion hombres" [level=4] [ref=e209]
                  - generic [ref=e210]:
                    - generic [ref=e211]: "Presentes: 77"
                    - generic [ref=e212]: "Total: 100"
                    - generic [ref=e213]: 77.0%
                - generic [ref=e214]:
                  - heading "Iniciacion mujeres" [level=4] [ref=e215]
                  - generic [ref=e216]:
                    - generic [ref=e217]: "Presentes: 2"
                    - generic [ref=e218]: "Total: 2"
                    - generic [ref=e219]: 100.0%
                - generic [ref=e220]:
                  - heading "Perfeccionamiento mujeres" [level=4] [ref=e221]
                  - generic [ref=e222]:
                    - generic [ref=e223]: "Presentes: 1"
                    - generic [ref=e224]: "Total: 1"
                    - generic [ref=e225]: 100.0%
                - generic [ref=e226]:
                  - heading "Perfeccionamiento hombres" [level=4] [ref=e227]
                  - generic [ref=e228]:
                    - generic [ref=e229]: "Presentes: 1"
                    - generic [ref=e230]: "Total: 1"
                    - generic [ref=e231]: 100.0%
                - generic [ref=e232]:
                  - heading "Master mujeres" [level=4] [ref=e233]
                  - generic [ref=e234]:
                    - generic [ref=e235]: "Presentes: 1"
                    - generic [ref=e236]: "Total: 1"
                    - generic [ref=e237]: 100.0%
            - generic [ref=e238]:
              - heading "Historial de Asistencias por Día" [level=3] [ref=e239]:
                - img [ref=e240]
                - text: Historial de Asistencias por Día
              - generic [ref=e242]:
                - generic [ref=e244]:
                  - heading "jueves, 29 de octubre de 2026 16 asistencias" [level=4] [ref=e245]:
                    - button "jueves, 29 de octubre de 2026 16 asistencias" [ref=e246] [cursor=pointer]:
                      - generic [ref=e247]:
                        - img [ref=e248]
                        - text: jueves, 29 de octubre de 2026
                      - generic [ref=e250]: 16 asistencias
                  - generic [ref=e251]:
                    - button "Exportar" [ref=e252] [cursor=pointer]:
                      - img [ref=e253]
                      - text: Exportar
                    - generic [ref=e255]: +
                - generic [ref=e257]:
                  - heading "miércoles, 28 de octubre de 2026 42 asistencias" [level=4] [ref=e258]:
                    - button "miércoles, 28 de octubre de 2026 42 asistencias" [ref=e259] [cursor=pointer]:
                      - generic [ref=e260]:
                        - img [ref=e261]
                        - text: miércoles, 28 de octubre de 2026
                      - generic [ref=e263]: 42 asistencias
                  - generic [ref=e264]:
                    - button "Exportar" [ref=e265] [cursor=pointer]:
                      - img [ref=e266]
                      - text: Exportar
                    - generic [ref=e268]: +
                - generic [ref=e270]:
                  - heading "martes, 27 de octubre de 2026 10 asistencias" [level=4] [ref=e271]:
                    - button "martes, 27 de octubre de 2026 10 asistencias" [ref=e272] [cursor=pointer]:
                      - generic [ref=e273]:
                        - img [ref=e274]
                        - text: martes, 27 de octubre de 2026
                      - generic [ref=e276]: 10 asistencias
                  - generic [ref=e277]:
                    - button "Exportar" [ref=e278] [cursor=pointer]:
                      - img [ref=e279]
                      - text: Exportar
                    - generic [ref=e281]: +
                - generic [ref=e283]:
                  - heading "lunes, 26 de octubre de 2026 10 asistencias" [level=4] [ref=e284]:
                    - button "lunes, 26 de octubre de 2026 10 asistencias" [ref=e285] [cursor=pointer]:
                      - generic [ref=e286]:
                        - img [ref=e287]
                        - text: lunes, 26 de octubre de 2026
                      - generic [ref=e289]: 10 asistencias
                  - generic [ref=e290]:
                    - button "Exportar" [ref=e291] [cursor=pointer]:
                      - img [ref=e292]
                      - text: Exportar
                    - generic [ref=e294]: +
                - generic [ref=e296]:
                  - heading "viernes, 23 de octubre de 2026 5 asistencias" [level=4] [ref=e297]:
                    - button "viernes, 23 de octubre de 2026 5 asistencias" [ref=e298] [cursor=pointer]:
                      - generic [ref=e299]:
                        - img [ref=e300]
                        - text: viernes, 23 de octubre de 2026
                      - generic [ref=e302]: 5 asistencias
                  - generic [ref=e303]:
                    - button "Exportar" [ref=e304] [cursor=pointer]:
                      - img [ref=e305]
                      - text: Exportar
                    - generic [ref=e307]: +
        - button "Abrir guia del panel" [ref=e308] [cursor=pointer]:
          - img [ref=e309]
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