# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: filters-sorting.tables.spec.js >> pagos: filtros base + orden de columnas por header
- Location: tests\e2e\filters-sorting.tables.spec.js:20:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/admin(?:\?|$)/
Received string:  "http://127.0.0.1:6100/login"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    6 × unexpected value "http://127.0.0.1:6100/login"

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
      - generic [ref=e25]: Panel de Administración>Dashboard
      - generic [ref=e27]:
        - generic [ref=e28]:
          - generic [ref=e30]:
            - heading "Dashboard - Resumen General" [level=2] [ref=e31]:
              - img [ref=e33]
              - text: Dashboard - Resumen General
            - paragraph [ref=e35]: "Vista general de RioVoley Club - Sesión: [CORREO_REDACTADO]"
          - generic [ref=e36]:
            - heading "Acciones Rapidas" [level=3] [ref=e37]:
              - img [ref=e38]
              - text: Acciones Rapidas
            - generic [ref=e40]:
              - button "Agregar Estudiante" [ref=e41] [cursor=pointer]:
                - img [ref=e42]
                - text: Agregar Estudiante
              - button "Registrar Pago" [ref=e44] [cursor=pointer]:
                - img [ref=e45]
                - text: Registrar Pago
              - button "Revision Financiera" [ref=e47] [cursor=pointer]:
                - img [ref=e48]
                - text: Revision Financiera
              - button "Gestionar Usuarios" [ref=e50] [cursor=pointer]:
                - img [ref=e51]
                - text: Gestionar Usuarios
              - button "Ver Reportes" [ref=e53] [cursor=pointer]:
                - img [ref=e54]
                - text: Ver Reportes
          - generic [ref=e56]:
            - generic [ref=e58]:
              - generic [ref=e59]:
                - heading "Total Estudiantes" [level=3] [ref=e60]
                - paragraph [ref=e61]: "198"
                - paragraph [ref=e62]: Registrados en el sistema
              - img [ref=e64]
            - generic [ref=e67]:
              - generic [ref=e68]:
                - heading "Ingresos del Mes" [level=3] [ref=e69]
                - paragraph [ref=e70]: $3,225.00
                - paragraph [ref=e71]: Pagos recibidos este mes
              - img [ref=e73]
            - generic [ref=e76]:
              - generic [ref=e77]:
                - heading "Periodos Vencidos" [level=3] [ref=e78]
                - paragraph [ref=e79]: "0"
                - paragraph [ref=e80]: Todos con periodo vigente
              - img [ref=e82]
            - generic [ref=e85]:
              - generic [ref=e86]:
                - heading "Proximos a Vencer" [level=3] [ref=e87]
                - paragraph [ref=e88]: "0"
                - paragraph [ref=e89]: Sin vencimientos proximos
              - img [ref=e91]
            - generic [ref=e94]:
              - generic [ref=e95]:
                - heading "Estudiantes Activos" [level=3] [ref=e96]
                - paragraph [ref=e97]: "93"
                - paragraph [ref=e98]: 93 de 198 con pagos activos
              - img [ref=e100]
          - generic [ref=e102]:
            - heading "Actividad Reciente" [level=3] [ref=e103]:
              - img [ref=e104]
              - text: Actividad Reciente
            - generic [ref=e106]:
              - generic [ref=e107]:
                - img [ref=e109]
                - generic [ref=e111]:
                  - paragraph [ref=e112]: E2E242854944af8 Flow asistio al entrenamiento
                  - text: 10/30/2026
              - generic [ref=e113]:
                - img [ref=e115]
                - generic [ref=e117]:
                  - paragraph [ref=e118]: E2E8973ebcbeff0 Flow asistio al entrenamiento
                  - text: 10/30/2026
              - generic [ref=e119]:
                - img [ref=e121]
                - generic [ref=e123]:
                  - paragraph [ref=e124]: E2E4d658be3ad82 Flow asistio al entrenamiento
                  - text: 10/30/2026
              - generic [ref=e125]:
                - img [ref=e127]
                - generic [ref=e129]:
                  - paragraph [ref=e130]: E2E242854944af8 Flow realizo un pago de $35
                  - text: 10/30/2026
              - generic [ref=e131]:
                - img [ref=e133]
                - generic [ref=e135]:
                  - paragraph [ref=e136]: E2E8973ebcbeff0 Flow realizo un pago de $35
                  - text: 10/30/2026
          - generic [ref=e137]:
            - heading "Resumen por Categorias" [level=3] [ref=e138]:
              - img [ref=e139]
              - text: Resumen por Categorias
            - generic [ref=e141]:
              - generic [ref=e142]:
                - heading "Iniciacion Hombres" [level=4] [ref=e143]
                - paragraph [ref=e144]: 192 atletas
              - generic [ref=e145]:
                - heading "Iniciacion Mujeres" [level=4] [ref=e146]
                - paragraph [ref=e147]: 2 atletas
              - generic [ref=e148]:
                - heading "Master Mujeres" [level=4] [ref=e149]
                - paragraph [ref=e150]: 1 atletas
              - generic [ref=e151]:
                - heading "master_hombres" [level=4] [ref=e152]
                - paragraph [ref=e153]: 1 atletas
              - generic [ref=e154]:
                - heading "Perfeccionamiento Hombres" [level=4] [ref=e155]
                - paragraph [ref=e156]: 1 atletas
              - generic [ref=e157]:
                - heading "Perfeccionamiento Mujeres" [level=4] [ref=e158]
                - paragraph [ref=e159]: 1 atletas
        - button "Abrir guia del panel" [ref=e160] [cursor=pointer]:
          - img [ref=e161]
```

# Test source

```ts
  1  | const { expect } = require('@playwright/test');
  2  | 
  3  | async function loginAsRole(page, role = 'admin') {
  4  |   const { credential, route } = {
  5  |     admin: { credential: 'ADMIN', route: '/admin' },
  6  |     trainer: { credential: 'TRAINER', route: '/entrenador' },
  7  |     student: { credential: 'STUDENT', route: '/estudiante' },
  8  |   }[role];
  9  |   await dismissPanelGuide(page, role);
  10 |   await page.goto('/login');
  11 |   await page.getByLabel(/correo/i).fill(process.env[`E2E_${credential}_EMAIL`]);
  12 |   await page.getByLabel(/contrase|password/i).fill(process.env[`E2E_${credential}_PASSWORD`]);
  13 |   await page.locator('form button[type="submit"]').click();
> 14 |   await expect(page).toHaveURL(new RegExp(`${route}(?:\\?|$)`));
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  15 |   await expect(page.getByRole('button', { name: 'Abrir guia del panel' })).toBeVisible();
  16 | }
  17 | 
  18 | async function dismissPanelGuide(page, role) {
  19 |   await page.addInitScript((roleName) => {
  20 |     localStorage.setItem(`riovoley:panel-guide:${roleName}`, JSON.stringify({
  21 |       version: '2026-06-22', status: 'dismissed',
  22 |     }));
  23 |   }, role);
  24 | }
  25 | 
  26 | async function openAdminSection(page, section) {
  27 |   return openPanelSection(page, 'admin', section);
  28 | }
  29 | 
  30 | async function openPanelSection(page, role, section) {
  31 |   const selector = `[data-guide-id="${role}-menu-${section}"]:visible`;
  32 |   const toggle = page.getByRole('button', { name: /abrir men[uú] lateral/i });
  33 |   if (await toggle.isVisible()) await toggle.click();
  34 |   const button = page.locator(selector);
  35 |   await expect(button).toBeVisible();
  36 |   await button.click();
  37 | }
  38 | 
  39 | module.exports = { openAdminSection, loginAsAdmin: (page) => loginAsRole(page), loginAsRole, openPanelSection, dismissPanelGuide };
  40 | 
```