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
        - button "Asistencias Control de entrenamientos" [active] [ref=e83] [cursor=pointer]:
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
                - paragraph [ref=e150]: "8"
              - img [ref=e152]
            - generic [ref=e155]:
              - generic [ref=e156]:
                - paragraph [ref=e157]: Presentes
                - paragraph [ref=e158]: "8"
              - img [ref=e160]
            - generic [ref=e163]:
              - generic [ref=e164]:
                - paragraph [ref=e165]: Ausentes
                - paragraph [ref=e166]: "0"
              - img [ref=e168]
            - generic [ref=e171]:
              - generic [ref=e172]:
                - paragraph [ref=e173]: Asistencia Promedio
                - paragraph [ref=e174]: 100.0%
              - img [ref=e176]
          - generic [ref=e178]:
            - search "Filtros de asistencias" [ref=e180]:
              - generic [ref=e181]:
                - generic [ref=e182]:
                  - generic [ref=e183]: Buscar en historial
                  - searchbox "Buscar asistencias por atleta o categoria" [ref=e184]
                - generic [ref=e186]:
                  - paragraph [ref=e187]: "Registros mostrados: 8"
                  - paragraph [ref=e188]: "Filtros activos: 0"
              - generic [ref=e189]:
                - generic [ref=e190]:
                  - generic [ref=e191]: Desde
                  - textbox [ref=e192]: 2026-10-21
                - generic [ref=e193]:
                  - generic [ref=e194]: Hasta
                  - textbox [ref=e195]: 2026-10-28
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
                    - option "Fixture7 Auditoria"
                    - option "Fixture1 Auditoria"
                    - option "Fixture2 Auditoria"
                    - option "Fixture3 Auditoria"
                    - option "Fixture4 Auditoria"
                    - option "Fixture5 Auditoria"
                    - option "Fixture6 Auditoria"
                    - option "Atleta Pruebas"
                - generic [ref=e208]:
                  - generic [ref=e209]: Metodo de pago
                  - combobox [ref=e210]:
                    - option "Todos" [selected]
                    - option "Mensualidad"
                    - option "Pago diario"
                    - option "Tarjeta"
              - generic [ref=e211]:
                - button "Limpiar" [ref=e212] [cursor=pointer]
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
                    - generic [ref=e227]: "Presentes: 2"
                    - generic [ref=e228]: "Total: 2"
                    - generic [ref=e229]: 100.0%
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
              - generic [ref=e260]:
                - heading "miércoles, 28 de octubre de 2026 8 asistencias" [level=4] [ref=e261]:
                  - button "miércoles, 28 de octubre de 2026 8 asistencias" [ref=e262] [cursor=pointer]:
                    - generic [ref=e263]:
                      - img [ref=e264]
                      - text: miércoles, 28 de octubre de 2026
                    - generic [ref=e266]: 8 asistencias
                - generic [ref=e267]:
                  - button "Exportar" [ref=e268] [cursor=pointer]:
                    - img [ref=e269]
                    - text: Exportar
                  - generic [ref=e271]: +
        - button "Abrir guia del panel" [ref=e272] [cursor=pointer]:
          - img [ref=e273]
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