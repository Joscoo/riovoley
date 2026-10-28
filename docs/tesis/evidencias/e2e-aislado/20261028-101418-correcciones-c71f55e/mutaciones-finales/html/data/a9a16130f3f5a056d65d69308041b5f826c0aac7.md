# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.happy-path-controlled.spec.js >> admin happy path controlado: atleta + pago + asistencia
- Location: tests\e2e\admin.happy-path-controlled.spec.js:6:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('[data-guide-id="admin-menu-pagos"]:visible')
    - locator resolved to <button type="button" data-guide-id="admin-menu-pagos" class="group inline-flex w-full min-h-[44px] items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-left text-sm font-medium text-white/80 transition-all duration-200 hover:border-rv-gold/35 hover:bg-rv-gold/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rv-gold/80 desktop:w-full desktop:gap-3 desktop:px-4 desktop:py-3">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
    - retrying click action
      - waiting 100ms
    26 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - element is outside of the viewport
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable

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
                - paragraph [ref=e61]: "18"
                - paragraph [ref=e62]: Registrados en el sistema
              - img [ref=e64]
            - generic [ref=e67]:
              - generic [ref=e68]:
                - heading "Ingresos del Mes" [level=3] [ref=e69]
                - paragraph [ref=e70]: $557.50
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
                - paragraph [ref=e97]: "16"
                - paragraph [ref=e98]: 16 de 18 con pagos activos
              - img [ref=e100]
          - generic [ref=e102]:
            - heading "Actividad Reciente" [level=3] [ref=e103]:
              - img [ref=e104]
              - text: Actividad Reciente
            - generic [ref=e106]:
              - generic [ref=e107]:
                - img [ref=e109]
                - generic [ref=e111]:
                  - paragraph [ref=e112]: Fixture1 Auditoria asistio al entrenamiento
                  - text: 10/27/2026
              - generic [ref=e113]:
                - img [ref=e115]
                - generic [ref=e117]:
                  - paragraph [ref=e118]: Fixture2 Auditoria asistio al entrenamiento
                  - text: 10/27/2026
              - generic [ref=e119]:
                - img [ref=e121]
                - generic [ref=e123]:
                  - paragraph [ref=e124]: Atleta Pruebas asistio al entrenamiento
                  - text: 10/27/2026
              - generic [ref=e125]:
                - img [ref=e127]
                - generic [ref=e129]:
                  - paragraph [ref=e130]: E2Ed03076d6b4c0 Flow realizo un pago de $35
                  - text: 10/27/2026
              - generic [ref=e131]:
                - img [ref=e133]
                - generic [ref=e135]:
                  - paragraph [ref=e136]: E2E334fd6c525ce Flow realizo un pago de $35
                  - text: 10/27/2026
          - generic [ref=e137]:
            - heading "Resumen por Categorias" [level=3] [ref=e138]:
              - img [ref=e139]
              - text: Resumen por Categorias
            - generic [ref=e141]:
              - generic [ref=e142]:
                - heading "Iniciacion Hombres" [level=4] [ref=e143]
                - paragraph [ref=e144]: 12 atletas
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
  14 |   await expect(page).toHaveURL(new RegExp(`${route}(?:\\?|$)`));
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
> 36 |   await button.click();
     |                ^ Error: locator.click: Test timeout of 60000ms exceeded.
  37 | }
  38 | 
  39 | module.exports = { openAdminSection, loginAsAdmin: (page) => loginAsRole(page), loginAsRole, openPanelSection, dismissPanelGuide };
  40 | 
```