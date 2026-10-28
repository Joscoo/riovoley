# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.happy-path-controlled.spec.js >> admin happy path controlado: atleta + pago + asistencia
- Location: tests\e2e\admin.happy-path-controlled.spec.js:6:1

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  getByRole('dialog').locator('#monto')
Expected: "$35.00"
Received: "$ 35,00"
Timeout:  10000ms

Call log:
  - Expect "toHaveValue" with timeout 10000ms
  - waiting for getByRole('dialog').locator('#monto')
    14 × locator resolved to <input disabled id="monto" type="text" value="$ 35,00" class="min-h-[48px] w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm text-white/90"/>
       - unexpected value "$ 35,00"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
        - generic [ref=e129]: Panel de Administración>Pagos
        - generic [ref=e131]:
          - generic [ref=e132]:
            - generic [ref=e133]:
              - generic [ref=e134]:
                - heading "Gestión de Pagos" [level=2] [ref=e135]:
                  - img [ref=e137]
                  - text: Gestión de Pagos
                - paragraph [ref=e139]: Administrar mensualidades y pagos del club
              - generic [ref=e141]:
                - button "Actualizar Estados" [ref=e142] [cursor=pointer]:
                  - img [ref=e143]
                  - text: Actualizar Estados
                - button "Registrar Pago" [ref=e145] [cursor=pointer]:
                  - img [ref=e146]
                  - text: Registrar Pago
            - generic [ref=e148]:
              - generic [ref=e150]:
                - generic [ref=e151]:
                  - heading "Total Pagos" [level=3] [ref=e152]
                  - paragraph [ref=e153]: "8"
                - img [ref=e155]
              - generic [ref=e158]:
                - generic [ref=e159]:
                  - heading "Activos" [level=3] [ref=e160]
                  - paragraph [ref=e161]: "8"
                - img [ref=e163]
              - generic [ref=e166]:
                - generic [ref=e167]:
                  - heading "Próximos a Vencer" [level=3] [ref=e168]
                  - paragraph [ref=e169]: "0"
                - img [ref=e171]
              - generic [ref=e174]:
                - generic [ref=e175]:
                  - heading "Vencidos" [level=3] [ref=e176]
                  - paragraph [ref=e177]: "0"
                - img [ref=e179]
              - generic [ref=e182]:
                - generic [ref=e183]:
                  - heading "Total Recaudado" [level=3] [ref=e184]
                  - paragraph [ref=e185]: $ 277,50
                - img [ref=e187]
            - generic [ref=e190]:
              - generic [ref=e191]:
                - generic [ref=e192]: Búsqueda
                - textbox "Buscar pagos por atleta" [ref=e193]:
                  - /placeholder: Buscar por atleta, email o mensualidad...
              - generic [ref=e194]:
                - generic [ref=e195]: Desde
                - textbox [ref=e196]:
                  - /placeholder: Fecha inicio
              - generic [ref=e197]:
                - generic [ref=e198]: Hasta
                - textbox [ref=e199]:
                  - /placeholder: Fecha fin
              - generic [ref=e200]:
                - generic [ref=e201]: Estado
                - combobox "Filtrar por estado de pago" [ref=e202]:
                  - option "Todos los estados" [selected]
                  - option "Activo"
                  - option "Próximo a Vencer"
                  - option "Vencido"
              - generic [ref=e203]:
                - generic [ref=e204]: Atleta
                - combobox "Filtrar por atleta" [ref=e205]:
                  - option "Todos los atletas" [selected]
                  - option "Fixture7 Auditoria"
                  - option "Fixture1 Auditoria"
                  - option "Fixture2 Auditoria"
                  - option "Fixture3 Auditoria"
                  - option "Fixture4 Auditoria"
                  - option "Fixture5 Auditoria"
                  - option "Fixture6 Auditoria"
                  - option "E2Eed9682c4a645 Flow"
                  - option "E2E8201a1c91a2b Flow"
                  - option "Atleta Pruebas"
              - generic [ref=e206]:
                - generic [ref=e207]: Mensualidad
                - combobox "Filtrar por tipo de mensualidad" [ref=e208]:
                  - option "Todas" [selected]
                  - option "Mensualidad normal"
                  - option "Mensualidad en grupo"
              - button "Limpiar" [ref=e210] [cursor=pointer]
            - paragraph [ref=e211]: Mostrando 8 de 8 pagos.
            - generic [ref=e212]:
              - generic [ref=e213]:
                - button "Anterior" [disabled] [ref=e214]
                - generic [ref=e215]: Página 1 de 1
                - button "Siguiente" [disabled] [ref=e216]
              - table [ref=e218]:
                - rowgroup [ref=e219]:
                  - row "Atleta Mensualidad Período Monto Estado Fecha Pago Acciones" [ref=e220]:
                    - columnheader "Atleta" [ref=e221]:
                      - button "Atleta" [ref=e222] [cursor=pointer]:
                        - generic [ref=e223]: Atleta
                        - img [ref=e224]
                    - columnheader "Mensualidad" [ref=e226]:
                      - button "Mensualidad" [ref=e227] [cursor=pointer]:
                        - generic [ref=e228]: Mensualidad
                        - img [ref=e229]
                    - columnheader "Período" [ref=e231]:
                      - button "Período" [ref=e232] [cursor=pointer]:
                        - generic [ref=e233]: Período
                        - img [ref=e234]
                    - columnheader "Monto" [ref=e236]:
                      - button "Monto" [ref=e237] [cursor=pointer]:
                        - generic [ref=e238]: Monto
                        - img [ref=e239]
                    - columnheader "Estado" [ref=e241]:
                      - button "Estado" [ref=e242] [cursor=pointer]:
                        - generic [ref=e243]: Estado
                        - img [ref=e244]
                    - columnheader "Fecha Pago" [ref=e246]:
                      - button "Fecha Pago" [ref=e247] [cursor=pointer]:
                        - generic [ref=e248]: Fecha Pago
                        - img [ref=e249]
                    - columnheader "Acciones" [ref=e251]
                - rowgroup [ref=e252]:
                  - row "Fixture7 Auditoria Iniciacion mujeres Mensualidad en grupo 28/10/2026 - 27/11/2026 $ 32,50 30 dias restantes 28/10/2026" [ref=e253]:
                    - cell "Fixture7 Auditoria Iniciacion mujeres" [ref=e254]:
                      - generic [ref=e255]:
                        - strong [ref=e256]: Fixture7 Auditoria
                        - generic [ref=e257]: Iniciacion mujeres
                    - cell "Mensualidad en grupo" [ref=e258]
                    - cell "28/10/2026 - 27/11/2026" [ref=e259]
                    - cell "$ 32,50" [ref=e260]
                    - cell "30 dias restantes" [ref=e261]:
                      - generic [ref=e262]: 30 dias restantes
                    - cell "28/10/2026" [ref=e263]
                    - cell [ref=e264]:
                      - generic [ref=e265]:
                        - button "Editar" [ref=e266] [cursor=pointer]:
                          - img [ref=e267]
                        - button "Eliminar" [ref=e269] [cursor=pointer]:
                          - img [ref=e270]
                  - row "Atleta Pruebas Iniciacion hombres Mensualidad normal 28/10/2026 - 26/11/2026 $ 35,00 29 dias restantes 28/10/2026" [ref=e272]:
                    - cell "Atleta Pruebas Iniciacion hombres" [ref=e273]:
                      - generic [ref=e274]:
                        - strong [ref=e275]: Atleta Pruebas
                        - generic [ref=e276]: Iniciacion hombres
                    - cell "Mensualidad normal" [ref=e277]
                    - cell "28/10/2026 - 26/11/2026" [ref=e278]
                    - cell "$ 35,00" [ref=e279]
                    - cell "29 dias restantes" [ref=e280]:
                      - generic [ref=e281]: 29 dias restantes
                    - cell "28/10/2026" [ref=e282]
                    - cell [ref=e283]:
                      - generic [ref=e284]:
                        - button "Editar" [ref=e285] [cursor=pointer]:
                          - img [ref=e286]
                        - button "Eliminar" [ref=e288] [cursor=pointer]:
                          - img [ref=e289]
                  - row "Fixture1 Auditoria Iniciacion mujeres Mensualidad normal 28/10/2026 - 26/11/2026 $ 35,00 29 dias restantes 28/10/2026" [ref=e291]:
                    - cell "Fixture1 Auditoria Iniciacion mujeres" [ref=e292]:
                      - generic [ref=e293]:
                        - strong [ref=e294]: Fixture1 Auditoria
                        - generic [ref=e295]: Iniciacion mujeres
                    - cell "Mensualidad normal" [ref=e296]
                    - cell "28/10/2026 - 26/11/2026" [ref=e297]
                    - cell "$ 35,00" [ref=e298]
                    - cell "29 dias restantes" [ref=e299]:
                      - generic [ref=e300]: 29 dias restantes
                    - cell "28/10/2026" [ref=e301]
                    - cell [ref=e302]:
                      - generic [ref=e303]:
                        - button "Editar" [ref=e304] [cursor=pointer]:
                          - img [ref=e305]
                        - button "Eliminar" [ref=e307] [cursor=pointer]:
                          - img [ref=e308]
                  - row "Fixture2 Auditoria Perfeccionamiento hombres Mensualidad normal 28/10/2026 - 26/11/2026 $ 35,00 29 dias restantes 28/10/2026" [ref=e310]:
                    - cell "Fixture2 Auditoria Perfeccionamiento hombres" [ref=e311]:
                      - generic [ref=e312]:
                        - strong [ref=e313]: Fixture2 Auditoria
                        - generic [ref=e314]: Perfeccionamiento hombres
                    - cell "Mensualidad normal" [ref=e315]
                    - cell "28/10/2026 - 26/11/2026" [ref=e316]
                    - cell "$ 35,00" [ref=e317]
                    - cell "29 dias restantes" [ref=e318]:
                      - generic [ref=e319]: 29 dias restantes
                    - cell "28/10/2026" [ref=e320]
                    - cell [ref=e321]:
                      - generic [ref=e322]:
                        - button "Editar" [ref=e323] [cursor=pointer]:
                          - img [ref=e324]
                        - button "Eliminar" [ref=e326] [cursor=pointer]:
                          - img [ref=e327]
                  - row "Fixture3 Auditoria Perfeccionamiento mujeres Mensualidad normal 28/10/2026 - 26/11/2026 $ 35,00 29 dias restantes 28/10/2026" [ref=e329]:
                    - cell "Fixture3 Auditoria Perfeccionamiento mujeres" [ref=e330]:
                      - generic [ref=e331]:
                        - strong [ref=e332]: Fixture3 Auditoria
                        - generic [ref=e333]: Perfeccionamiento mujeres
                    - cell "Mensualidad normal" [ref=e334]
                    - cell "28/10/2026 - 26/11/2026" [ref=e335]
                    - cell "$ 35,00" [ref=e336]
                    - cell "29 dias restantes" [ref=e337]:
                      - generic [ref=e338]: 29 dias restantes
                    - cell "28/10/2026" [ref=e339]
                    - cell [ref=e340]:
                      - generic [ref=e341]:
                        - button "Editar" [ref=e342] [cursor=pointer]:
                          - img [ref=e343]
                        - button "Eliminar" [ref=e345] [cursor=pointer]:
                          - img [ref=e346]
                  - row "Fixture4 Auditoria Master Hombres Mensualidad normal 28/10/2026 - 26/11/2026 $ 35,00 29 dias restantes 28/10/2026" [ref=e348]:
                    - cell "Fixture4 Auditoria Master Hombres" [ref=e349]:
                      - generic [ref=e350]:
                        - strong [ref=e351]: Fixture4 Auditoria
                        - generic [ref=e352]: Master Hombres
                    - cell "Mensualidad normal" [ref=e353]
                    - cell "28/10/2026 - 26/11/2026" [ref=e354]
                    - cell "$ 35,00" [ref=e355]
                    - cell "29 dias restantes" [ref=e356]:
                      - generic [ref=e357]: 29 dias restantes
                    - cell "28/10/2026" [ref=e358]
                    - cell [ref=e359]:
                      - generic [ref=e360]:
                        - button "Editar" [ref=e361] [cursor=pointer]:
                          - img [ref=e362]
                        - button "Eliminar" [ref=e364] [cursor=pointer]:
                          - img [ref=e365]
                  - row "Fixture5 Auditoria Master mujeres Mensualidad normal 28/10/2026 - 26/11/2026 $ 35,00 29 dias restantes 28/10/2026" [ref=e367]:
                    - cell "Fixture5 Auditoria Master mujeres" [ref=e368]:
                      - generic [ref=e369]:
                        - strong [ref=e370]: Fixture5 Auditoria
                        - generic [ref=e371]: Master mujeres
                    - cell "Mensualidad normal" [ref=e372]
                    - cell "28/10/2026 - 26/11/2026" [ref=e373]
                    - cell "$ 35,00" [ref=e374]
                    - cell "29 dias restantes" [ref=e375]:
                      - generic [ref=e376]: 29 dias restantes
                    - cell "28/10/2026" [ref=e377]
                    - cell [ref=e378]:
                      - generic [ref=e379]:
                        - button "Editar" [ref=e380] [cursor=pointer]:
                          - img [ref=e381]
                        - button "Eliminar" [ref=e383] [cursor=pointer]:
                          - img [ref=e384]
                  - row "Fixture6 Auditoria Iniciacion hombres Mensualidad normal 28/10/2026 - 26/11/2026 $ 35,00 29 dias restantes 28/10/2026" [ref=e386]:
                    - cell "Fixture6 Auditoria Iniciacion hombres" [ref=e387]:
                      - generic [ref=e388]:
                        - strong [ref=e389]: Fixture6 Auditoria
                        - generic [ref=e390]: Iniciacion hombres
                    - cell "Mensualidad normal" [ref=e391]
                    - cell "28/10/2026 - 26/11/2026" [ref=e392]
                    - cell "$ 35,00" [ref=e393]
                    - cell "29 dias restantes" [ref=e394]:
                      - generic [ref=e395]: 29 dias restantes
                    - cell "28/10/2026" [ref=e396]
                    - cell [ref=e397]:
                      - generic [ref=e398]:
                        - button "Editar" [ref=e399] [cursor=pointer]:
                          - img [ref=e400]
                        - button "Eliminar" [ref=e402] [cursor=pointer]:
                          - img [ref=e403]
              - generic [ref=e405]:
                - button "Anterior" [disabled] [ref=e406]
                - generic [ref=e407]: Página 1 de 1
                - button "Siguiente" [disabled] [ref=e408]
          - button "Abrir guia del panel" [ref=e409] [cursor=pointer]:
            - img [ref=e410]
  - dialog "Registrar Nuevo Pago" [ref=e413]:
    - generic [ref=e414]:
      - heading "Registrar Nuevo Pago" [level=3] [ref=e415]:
        - img [ref=e417]
        - generic [ref=e419]: Registrar Nuevo Pago
      - button "Cerrar modal" [ref=e420] [cursor=pointer]:
        - img [ref=e421]
    - generic [ref=e424]:
      - generic [ref=e425]:
        - heading "Atleta y Periodo" [level=4] [ref=e426]:
          - img [ref=e427]
          - text: Atleta y Periodo
        - generic [ref=e429]:
          - generic [ref=e430]:
            - generic [ref=e431]: Atleta *
            - textbox "Atleta *" [ref=e433]:
              - /placeholder: Escribe el nombre del atleta...
              - text: E2Eed9682c4a645 Flow
          - generic [ref=e434]:
            - generic [ref=e435]: Fecha de Pago *
            - textbox "Fecha de Pago *" [ref=e436]: 2026-10-28
            - paragraph [ref=e437]: Obligatoria. Solo fechas hasta hoy.
          - generic [ref=e438]:
            - generic [ref=e439]: Periodo sugerido
            - generic [ref=e440]: 28/10/2026 - 27/11/2026
            - paragraph [ref=e441]: Se calcula automaticamente segun el historial del atleta.
          - generic [ref=e443] [cursor=pointer]:
            - checkbox "Personalizar periodo de pago" [ref=e444]
            - generic [ref=e445]: Personalizar periodo de pago
      - generic [ref=e446]:
        - heading "Datos del Pago" [level=4] [ref=e447]:
          - img [ref=e448]
          - text: Datos del Pago
        - generic [ref=e450]:
          - generic [ref=e451]:
            - generic [ref=e452]: Tipo de Mensualidad *
            - combobox "Tipo de Mensualidad *" [ref=e453]:
              - option "Selecciona una mensualidad"
              - option "Mensualidad normal" [selected]
              - option "Mensualidad en grupo"
            - paragraph [ref=e454]: Normal ($35.00) o en grupo ($32.50).
          - generic [ref=e455]:
            - generic [ref=e456]: Monto (automatico)
            - textbox "Monto (automatico)" [disabled] [ref=e457]: $ 35,00
            - paragraph [ref=e458]: El monto se define por el tipo de mensualidad seleccionado.
          - generic [ref=e459]:
            - generic [ref=e460]: Observaciones
            - textbox "Observaciones" [ref=e461]:
              - /placeholder: Notas internas del pago (opcional)
            - paragraph [ref=e462]: 0/300 caracteres
      - generic [ref=e463]:
        - button "Cancelar" [ref=e464] [cursor=pointer]
        - button "Guardar" [ref=e465] [cursor=pointer]
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
> 57 |   await expect(payment.locator('#monto')).toHaveValue('$35.00');
     |                                           ^ Error: expect(locator).toHaveValue(expected) failed
  58 |   await payment.locator('#fecha_pago').fill(today);
  59 |   await payment.getByRole('button', { name: /^Guardar$/i }).click();
  60 |   await expect(payment).toBeHidden({ timeout: 30000 });
  61 |   await page.locator('#payments-search').fill(firstName);
  62 |   const paymentRow = page.locator('tbody tr').filter({ hasText: fullName });
  63 |   await expect(paymentRow).toHaveCount(1);
  64 |   await expect(paymentRow.locator('td[data-label="Monto"]')).toContainText('35.00');
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
  81 |   await expect(page.locator('tbody tr').filter({ hasText: fullName }).locator('td[data-label="Monto"]')).toContainText('35.00');
  82 |   await openAdminSection(page, 'asistencias');
  83 |   await page.getByRole('button', { name: /Registro R.pido/i }).click();
  84 |   await page.locator('#attendance-date').fill(today);
  85 |   await page.getByPlaceholder('Buscar atleta por nombre...').fill(firstName);
  86 |   await expect(page.getByTestId('attendance-athlete-row').filter({ hasText: firstName }).getByRole('button', { name: 'Marcar como presente', exact: true })).toHaveClass(/(?:^|\s)bg-emerald-500(?:\s|$)/);
  87 | });
  88 | 
```