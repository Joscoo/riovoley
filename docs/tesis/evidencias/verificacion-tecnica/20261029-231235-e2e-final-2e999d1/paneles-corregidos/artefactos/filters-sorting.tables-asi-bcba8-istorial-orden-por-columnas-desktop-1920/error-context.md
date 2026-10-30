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
        - generic [ref=e23]: "6"
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
            - button "Registro Rápido" [ref=e142] [cursor=pointer]:
              - img [ref=e143]
              - text: Registro Rápido
          - generic [ref=e145]:
            - generic [ref=e147]:
              - generic [ref=e148]:
                - paragraph [ref=e149]: Total Registros
                - paragraph [ref=e150]: "83"
              - img [ref=e152]
            - generic [ref=e155]:
              - generic [ref=e156]:
                - paragraph [ref=e157]: Presentes
                - paragraph [ref=e158]: "83"
              - img [ref=e160]
            - generic [ref=e163]:
              - generic [ref=e164]:
                - paragraph [ref=e165]: Ausentes
                - paragraph [ref=e166]: "89"
              - img [ref=e168]
            - generic [ref=e171]:
              - generic [ref=e172]:
                - paragraph [ref=e173]: Asistencia Promedio
                - paragraph [ref=e174]: 15.7%
              - img [ref=e176]
          - generic [ref=e178]:
            - search "Filtros de asistencias" [ref=e180]:
              - generic [ref=e181]:
                - generic [ref=e182]:
                  - generic [ref=e183]: Buscar en historial
                  - searchbox "Buscar asistencias por atleta o categoria" [ref=e184]
                - generic [ref=e186]:
                  - paragraph [ref=e187]: "Registros mostrados: 83"
                  - paragraph [ref=e188]: "Filtros activos: 0"
              - generic [ref=e189]:
                - generic [ref=e190]:
                  - generic [ref=e191]: Desde
                  - textbox [ref=e192]: 2026-10-23
                - generic [ref=e193]:
                  - generic [ref=e194]: Hasta
                  - textbox [ref=e195]: 2026-10-30
                - generic [ref=e197]:
                  - button "Hoy" [ref=e198] [cursor=pointer]
                  - button "7 dias" [ref=e199] [cursor=pointer]
                  - button "30 dias" [ref=e200] [cursor=pointer]
                  - button "Mes actual" [ref=e201] [cursor=pointer]
                - generic [ref=e202]:
                  - generic [ref=e203]: Categoria
                  - combobox [ref=e204]:
                    - option "Todas las categorias" [selected]
                    - option "Iniciacion hombres"
                    - option "Iniciacion mujeres"
                    - option "Perfeccionamiento mujeres"
                    - option "Perfeccionamiento hombres"
                    - option "Master mujeres"
                - generic [ref=e205]:
                  - generic [ref=e206]: Atleta
                  - combobox [ref=e207]:
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
                - generic [ref=e208]:
                  - generic [ref=e209]: Metodo de pago
                  - combobox [ref=e210]:
                    - option "Todos" [selected]
                    - option "Mensualidad"
                    - option "Pago diario"
                    - option "Tarjeta"
              - generic [ref=e211]:
                - button "Limpiar" [active] [ref=e212] [cursor=pointer]
                - button "Fecha (desc)" [ref=e213] [cursor=pointer]
            - generic [ref=e214]:
              - heading "Reportes Persistidos" [level=3] [ref=e215]:
                - img [ref=e216]
                - text: Reportes Persistidos
              - paragraph [ref=e218]: No hay reportes persistidos para el rango seleccionado.
            - generic [ref=e219]:
              - heading "Estadísticas por Categoría" [level=3] [ref=e220]:
                - img [ref=e221]
                - text: Estadísticas por Categoría
              - generic [ref=e223]:
                - generic [ref=e224]:
                  - heading "Iniciacion hombres" [level=4] [ref=e225]
                  - generic [ref=e226]:
                    - generic [ref=e227]: "Presentes: 77"
                    - generic [ref=e228]: "Total: 100"
                    - generic [ref=e229]: 77.0%
                - generic [ref=e230]:
                  - heading "Iniciacion mujeres" [level=4] [ref=e231]
                  - generic [ref=e232]:
                    - generic [ref=e233]: "Presentes: 2"
                    - generic [ref=e234]: "Total: 2"
                    - generic [ref=e235]: 100.0%
                - generic [ref=e236]:
                  - heading "Perfeccionamiento mujeres" [level=4] [ref=e237]
                  - generic [ref=e238]:
                    - generic [ref=e239]: "Presentes: 1"
                    - generic [ref=e240]: "Total: 1"
                    - generic [ref=e241]: 100.0%
                - generic [ref=e242]:
                  - heading "Perfeccionamiento hombres" [level=4] [ref=e243]
                  - generic [ref=e244]:
                    - generic [ref=e245]: "Presentes: 1"
                    - generic [ref=e246]: "Total: 1"
                    - generic [ref=e247]: 100.0%
                - generic [ref=e248]:
                  - heading "Master mujeres" [level=4] [ref=e249]
                  - generic [ref=e250]:
                    - generic [ref=e251]: "Presentes: 1"
                    - generic [ref=e252]: "Total: 1"
                    - generic [ref=e253]: 100.0%
            - generic [ref=e254]:
              - heading "Historial de Asistencias por Día" [level=3] [ref=e255]:
                - img [ref=e256]
                - text: Historial de Asistencias por Día
              - generic [ref=e258]:
                - generic [ref=e260]:
                  - heading "jueves, 29 de octubre de 2026 16 asistencias" [level=4] [ref=e261]:
                    - button "jueves, 29 de octubre de 2026 16 asistencias" [ref=e262] [cursor=pointer]:
                      - generic [ref=e263]:
                        - img [ref=e264]
                        - text: jueves, 29 de octubre de 2026
                      - generic [ref=e266]: 16 asistencias
                  - generic [ref=e267]:
                    - button "Exportar" [ref=e268] [cursor=pointer]:
                      - img [ref=e269]
                      - text: Exportar
                    - generic [ref=e271]: +
                - generic [ref=e273]:
                  - heading "miércoles, 28 de octubre de 2026 42 asistencias" [level=4] [ref=e274]:
                    - button "miércoles, 28 de octubre de 2026 42 asistencias" [ref=e275] [cursor=pointer]:
                      - generic [ref=e276]:
                        - img [ref=e277]
                        - text: miércoles, 28 de octubre de 2026
                      - generic [ref=e279]: 42 asistencias
                  - generic [ref=e280]:
                    - button "Exportar" [ref=e281] [cursor=pointer]:
                      - img [ref=e282]
                      - text: Exportar
                    - generic [ref=e284]: +
                - generic [ref=e286]:
                  - heading "martes, 27 de octubre de 2026 10 asistencias" [level=4] [ref=e287]:
                    - button "martes, 27 de octubre de 2026 10 asistencias" [ref=e288] [cursor=pointer]:
                      - generic [ref=e289]:
                        - img [ref=e290]
                        - text: martes, 27 de octubre de 2026
                      - generic [ref=e292]: 10 asistencias
                  - generic [ref=e293]:
                    - button "Exportar" [ref=e294] [cursor=pointer]:
                      - img [ref=e295]
                      - text: Exportar
                    - generic [ref=e297]: +
                - generic [ref=e299]:
                  - heading "lunes, 26 de octubre de 2026 10 asistencias" [level=4] [ref=e300]:
                    - button "lunes, 26 de octubre de 2026 10 asistencias" [ref=e301] [cursor=pointer]:
                      - generic [ref=e302]:
                        - img [ref=e303]
                        - text: lunes, 26 de octubre de 2026
                      - generic [ref=e305]: 10 asistencias
                  - generic [ref=e306]:
                    - button "Exportar" [ref=e307] [cursor=pointer]:
                      - img [ref=e308]
                      - text: Exportar
                    - generic [ref=e310]: +
                - generic [ref=e312]:
                  - heading "viernes, 23 de octubre de 2026 5 asistencias" [level=4] [ref=e313]:
                    - button "viernes, 23 de octubre de 2026 5 asistencias" [ref=e314] [cursor=pointer]:
                      - generic [ref=e315]:
                        - img [ref=e316]
                        - text: viernes, 23 de octubre de 2026
                      - generic [ref=e318]: 5 asistencias
                  - generic [ref=e319]:
                    - button "Exportar" [ref=e320] [cursor=pointer]:
                      - img [ref=e321]
                      - text: Exportar
                    - generic [ref=e323]: +
        - button "Abrir guia del panel" [ref=e324] [cursor=pointer]:
          - img [ref=e325]
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