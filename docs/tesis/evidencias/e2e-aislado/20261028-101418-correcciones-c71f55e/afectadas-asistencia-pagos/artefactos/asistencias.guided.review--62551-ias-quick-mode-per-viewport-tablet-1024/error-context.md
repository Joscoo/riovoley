# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: asistencias.guided.review.spec.js >> guided review: admin asistencias quick mode per viewport
- Location: tests\e2e\asistencias.guided.review.spec.js:52:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('attendance-athlete-row').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByTestId('attendance-athlete-row').first()

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
        - button "Asistencias Control de entrenamientos" [active] [ref=e67] [cursor=pointer]:
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
                - paragraph [ref=e134]: "8"
              - img [ref=e136]
            - generic [ref=e139]:
              - generic [ref=e140]:
                - paragraph [ref=e141]: Presentes
                - paragraph [ref=e142]: "8"
              - img [ref=e144]
            - generic [ref=e147]:
              - generic [ref=e148]:
                - paragraph [ref=e149]: Ausentes
                - paragraph [ref=e150]: "0"
              - img [ref=e152]
            - generic [ref=e155]:
              - generic [ref=e156]:
                - paragraph [ref=e157]: Asistencia Promedio
                - paragraph [ref=e158]: 100.0%
              - img [ref=e160]
          - generic [ref=e162]:
            - search "Filtros de asistencias" [ref=e164]:
              - generic [ref=e165]:
                - generic [ref=e166]:
                  - generic [ref=e167]: Buscar en historial
                  - searchbox "Buscar asistencias por atleta o categoria" [ref=e168]
                - generic [ref=e170]:
                  - paragraph [ref=e171]: "Registros mostrados: 8"
                  - paragraph [ref=e172]: "Filtros activos: 0"
              - generic [ref=e173]:
                - generic [ref=e174]:
                  - generic [ref=e175]: Desde
                  - textbox [ref=e176]: 2026-10-21
                - generic [ref=e177]:
                  - generic [ref=e178]: Hasta
                  - textbox [ref=e179]: 2026-10-28
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
                    - option "Fixture7 Auditoria"
                    - option "Fixture1 Auditoria"
                    - option "Fixture2 Auditoria"
                    - option "Fixture3 Auditoria"
                    - option "Fixture4 Auditoria"
                    - option "Fixture5 Auditoria"
                    - option "Fixture6 Auditoria"
                    - option "Atleta Pruebas"
                - generic [ref=e192]:
                  - generic [ref=e193]: Metodo de pago
                  - combobox [ref=e194]:
                    - option "Todos" [selected]
                    - option "Mensualidad"
                    - option "Pago diario"
                    - option "Tarjeta"
              - generic [ref=e195]:
                - button "Limpiar" [ref=e196] [cursor=pointer]
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
                    - generic [ref=e211]: "Presentes: 2"
                    - generic [ref=e212]: "Total: 2"
                    - generic [ref=e213]: 100.0%
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
              - generic [ref=e244]:
                - heading "miércoles, 28 de octubre de 2026 8 asistencias" [level=4] [ref=e245]:
                  - button "miércoles, 28 de octubre de 2026 8 asistencias" [ref=e246] [cursor=pointer]:
                    - generic [ref=e247]:
                      - img [ref=e248]
                      - text: miércoles, 28 de octubre de 2026
                    - generic [ref=e250]: 8 asistencias
                - generic [ref=e251]:
                  - button "Exportar" [ref=e252] [cursor=pointer]:
                    - img [ref=e253]
                    - text: Exportar
                  - generic [ref=e255]: +
        - button "Abrir guia del panel" [ref=e256] [cursor=pointer]:
          - img [ref=e257]
```

# Test source

```ts
  1  | ﻿const { test, expect } = require('@playwright/test');
  2  | 
  3  | const { loginAsAdmin, openAdminSection } = require('./helpers/adminNavigation');
  4  | 
  5  | const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
  6  | const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
  7  | 
  8  | async function ensureQuickMode(page) {
  9  |   const quickModeButton = page.getByRole('button', { name: /registro rapido|registro rápido/i });
  10 |   if (await quickModeButton.count()) {
  11 |     await quickModeButton.first().click();
  12 |   }
  13 | }
  14 | 
  15 | async function collectAsistenciasMetrics(page) {
  16 |   return page.evaluate(() => {
  17 |     const rows = Array.from(document.querySelectorAll('[data-testid="attendance-athlete-row"]'));
  18 |     const names = Array.from(document.querySelectorAll('[data-testid="attendance-athlete-name"]'));
  19 |     const actionGroups = Array.from(document.querySelectorAll('[data-testid="attendance-athlete-actions"]'));
  20 | 
  21 |     const rowWidths = rows.map((el) => Math.round(el.getBoundingClientRect().width));
  22 |     const nameWidths = names.map((el) => Math.round(el.getBoundingClientRect().width));
  23 |     const actionWidths = actionGroups.map((el) => Math.round(el.getBoundingClientRect().width));
  24 | 
  25 |     const minRow = rowWidths.length ? Math.min(...rowWidths) : 0;
  26 |     const maxRow = rowWidths.length ? Math.max(...rowWidths) : 0;
  27 |     const minName = nameWidths.length ? Math.min(...nameWidths) : 0;
  28 |     const maxName = nameWidths.length ? Math.max(...nameWidths) : 0;
  29 |     const maxActions = actionWidths.length ? Math.max(...actionWidths) : 0;
  30 | 
  31 |     const root = document.documentElement;
  32 |     const body = document.body;
  33 |     const scrollWidth = Math.max(root.scrollWidth, body ? body.scrollWidth : 0);
  34 |     const viewport = window.innerWidth;
  35 | 
  36 |     return {
  37 |       rowCount: rows.length,
  38 |       nameCount: names.length,
  39 |       actionGroupCount: actionGroups.length,
  40 |       minRow,
  41 |       maxRow,
  42 |       minName,
  43 |       maxName,
  44 |       maxActions,
  45 |       hasHorizontalOverflow: scrollWidth > viewport + 1,
  46 |       scrollWidth,
  47 |       viewport,
  48 |     };
  49 |   });
  50 | }
  51 | 
  52 | test('guided review: admin asistencias quick mode per viewport', async ({ page }, testInfo) => {
  53 |   test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Missing E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD environment variables.');
  54 | 
  55 |   await loginAsAdmin(page);
  56 |   await openAdminSection(page, 'asistencias');
  57 |   await ensureQuickMode(page);
  58 | 
> 59 |   await expect(page.getByTestId('attendance-athlete-row').first()).toBeVisible();
     |                                                                    ^ Error: expect(locator).toBeVisible() failed
  60 | 
  61 |   const screenshotPath = testInfo.outputPath(`asistencias-quick-${testInfo.project.name}.png`);
  62 |   const isMobileProject = /mobile/i.test(testInfo.project.name);
  63 |   const pageHeight = await page.evaluate(() => {
  64 |     const root = document.documentElement;
  65 |     const body = document.body;
  66 |     return Math.max(root.scrollHeight, body ? body.scrollHeight : 0);
  67 |   });
  68 | 
  69 |   // Chromium cannot capture full-page images above 32767px in either dimension.
  70 |   if (isMobileProject || pageHeight >= 32000) {
  71 |     await page.screenshot({ path: screenshotPath, fullPage: false });
  72 |   } else {
  73 |     await page.screenshot({ path: screenshotPath, fullPage: true });
  74 |   }
  75 | 
  76 |   const metrics = await collectAsistenciasMetrics(page);
  77 |   console.log(`GUIDED_REVIEW_METRICS[${testInfo.project.name}]: ${JSON.stringify(metrics)}`);
  78 | 
  79 |   // Soft checks to avoid blocking the run while still flagging bad layouts.
  80 |   expect.soft(metrics.hasHorizontalOverflow, `Overflow in ${testInfo.project.name}`).toBeFalsy();
  81 | 
  82 |   expect(metrics.rowCount).toBeGreaterThan(0);
  83 |   expect(metrics.nameCount).toBe(metrics.rowCount);
  84 |   expect(metrics.actionGroupCount).toBe(metrics.rowCount);
  85 |   {
  86 |     expect.soft(metrics.minName, `Name width too small in ${testInfo.project.name}`).toBeGreaterThan(90);
  87 |     expect.soft(metrics.maxActions, `Actions consuming too much width in ${testInfo.project.name}`).toBeLessThanOrEqual(metrics.viewport);
  88 |   }
  89 | });
  90 | 
  91 | 
```