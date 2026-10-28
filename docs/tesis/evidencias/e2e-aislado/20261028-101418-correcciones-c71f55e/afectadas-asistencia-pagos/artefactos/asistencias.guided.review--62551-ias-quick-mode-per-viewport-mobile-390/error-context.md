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
                - paragraph [ref=e46]: "8"
              - img [ref=e48]
            - generic [ref=e51]:
              - generic [ref=e52]:
                - paragraph [ref=e53]: Presentes
                - paragraph [ref=e54]: "8"
              - img [ref=e56]
            - generic [ref=e59]:
              - generic [ref=e60]:
                - paragraph [ref=e61]: Ausentes
                - paragraph [ref=e62]: "0"
              - img [ref=e64]
            - generic [ref=e67]:
              - generic [ref=e68]:
                - paragraph [ref=e69]: Asistencia Promedio
                - paragraph [ref=e70]: 100.0%
              - img [ref=e72]
          - generic [ref=e74]:
            - search "Filtros de asistencias" [ref=e76]:
              - generic [ref=e77]:
                - generic [ref=e78]:
                  - generic [ref=e79]: Buscar en historial
                  - searchbox "Buscar asistencias por atleta o categoria" [ref=e80]
                - generic [ref=e82]:
                  - paragraph [ref=e83]: "Registros mostrados: 8"
                  - paragraph [ref=e84]: "Filtros activos: 0"
              - generic [ref=e85]:
                - generic [ref=e86]:
                  - generic [ref=e87]: Desde
                  - textbox [ref=e88]: 2026-10-21
                - generic [ref=e89]:
                  - generic [ref=e90]: Hasta
                  - textbox [ref=e91]: 2026-10-28
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
                    - option "Fixture7 Auditoria"
                    - option "Fixture1 Auditoria"
                    - option "Fixture2 Auditoria"
                    - option "Fixture3 Auditoria"
                    - option "Fixture4 Auditoria"
                    - option "Fixture5 Auditoria"
                    - option "Fixture6 Auditoria"
                    - option "Atleta Pruebas"
                - generic [ref=e104]:
                  - generic [ref=e105]: Metodo de pago
                  - combobox [ref=e106]:
                    - option "Todos" [selected]
                    - option "Mensualidad"
                    - option "Pago diario"
                    - option "Tarjeta"
              - generic [ref=e107]:
                - button "Limpiar" [ref=e108] [cursor=pointer]
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
                    - generic [ref=e123]: "Presentes: 2"
                    - generic [ref=e124]: "Total: 2"
                    - generic [ref=e125]: 100.0%
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
              - generic [ref=e156]:
                - heading "miércoles, 28 de octubre de 2026 8 asistencias" [level=4] [ref=e157]:
                  - button "miércoles, 28 de octubre de 2026 8 asistencias" [ref=e158] [cursor=pointer]:
                    - generic [ref=e159]:
                      - img [ref=e160]
                      - text: miércoles, 28 de octubre de 2026
                    - generic [ref=e162]: 8 asistencias
                - generic [ref=e163]:
                  - button "Exportar" [ref=e164] [cursor=pointer]:
                    - img [ref=e165]
                    - text: Exportar
                  - generic [ref=e167]: +
        - button "Abrir guia del panel" [ref=e168] [cursor=pointer]:
          - img [ref=e169]
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