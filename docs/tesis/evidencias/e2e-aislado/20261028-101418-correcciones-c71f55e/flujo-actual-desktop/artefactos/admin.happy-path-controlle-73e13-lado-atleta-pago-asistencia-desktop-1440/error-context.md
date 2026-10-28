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
  - waiting for getByRole('dialog', { name: 'Agregar Nuevo Estudiante' }).getByRole('button', { name: /^Guardar$/i })

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
        - generic [ref=e129]: Panel de Administración>Gestión de Usuarios
        - generic [ref=e131]:
          - generic [ref=e132]:
            - generic [ref=e133]:
              - img [ref=e135]
              - generic [ref=e137]:
                - heading "Gestión de Usuarios" [level=1] [ref=e138]
                - paragraph [ref=e139]: Administrar estudiantes, entrenadores y administradores del club
            - tablist [ref=e140]:
              - tab "Estudiantes" [selected] [ref=e141] [cursor=pointer]:
                - generic [ref=e143]:
                  - img [ref=e145]
                  - paragraph [ref=e149]: Estudiantes
              - tab "Entrenadores" [ref=e150] [cursor=pointer]:
                - generic [ref=e151]:
                  - img [ref=e153]
                  - paragraph [ref=e157]: Entrenadores
              - tab "Administradores" [ref=e158] [cursor=pointer]:
                - generic [ref=e159]:
                  - img [ref=e161]
                  - paragraph [ref=e165]: Administradores
            - generic [ref=e167]:
              - generic [ref=e168]:
                - generic [ref=e169]:
                  - heading "Estudiantes" [level=2] [ref=e170]:
                    - img [ref=e172]
                    - text: Estudiantes
                  - paragraph [ref=e174]: 8 estudiantes encontrados - 8 activos, 0 suspendidos
                - button "Agregar Estudiante" [ref=e176] [cursor=pointer]:
                  - img [ref=e177]
                  - text: Agregar Estudiante
              - generic [ref=e179]:
                - generic [ref=e181]:
                  - generic [ref=e182]:
                    - paragraph [ref=e183]: Total Estudiantes
                    - paragraph [ref=e184]: "8"
                  - img [ref=e186]
                - generic [ref=e189]:
                  - generic [ref=e190]:
                    - paragraph [ref=e191]: Activos
                    - paragraph [ref=e192]: "8"
                  - img [ref=e194]
                - generic [ref=e197]:
                  - generic [ref=e198]:
                    - paragraph [ref=e199]: Suspendidos
                    - paragraph [ref=e200]: "0"
                  - img [ref=e202]
                - generic [ref=e205]:
                  - generic [ref=e206]:
                    - paragraph [ref=e207]: Categorías
                    - paragraph [ref=e208]: "6"
                  - img [ref=e210]
              - search "Filtros de busqueda" [ref=e213]:
                - generic [ref=e214]:
                  - generic [ref=e215]:
                    - generic [ref=e216]: Buscar
                    - searchbox "Buscar usuarios por nombre, apellido o email" [ref=e217]
                  - generic [ref=e218]:
                    - generic [ref=e219]: Categoria
                    - combobox "Filtrar por categoria deportiva" [ref=e220]:
                      - option "Todas las categorias" [selected]
                      - option "Iniciacion Hombres"
                      - option "Iniciacion Mujeres"
                      - option "Master Mujeres"
                      - option "master_hombres"
                      - option "Perfeccionamiento Hombres"
                      - option "Perfeccionamiento Mujeres"
                - generic [ref=e221]:
                  - generic [ref=e222]:
                    - generic [ref=e223]: Estado
                    - combobox "Filtrar por estado del usuario" [ref=e224]:
                      - option "Todos los estados" [selected]
                      - option "Activos"
                      - option "Suspendidos"
                  - generic [ref=e225]:
                    - generic [ref=e226]: Ordenar por
                    - combobox "Criterio de ordenamiento" [ref=e227]:
                      - option "Apellido" [selected]
                      - option "Nombre"
                      - option "Categoria"
                      - option "Edad"
                      - option "Fecha de registro"
                  - generic [ref=e228]:
                    - generic [ref=e229]: Direccion
                    - combobox "Direccion de ordenamiento" [ref=e230]:
                      - option "Ascendente (A-Z)" [selected]
                      - option "Descendente (Z-A)"
                  - button "Limpiar filtros" [ref=e232] [cursor=pointer]: Limpiar
              - generic [ref=e233]:
                - 'article "Estudiante: Fixture1 Auditoria" [ref=e234]':
                  - generic [ref=e235]:
                    - heading "Fixture1 Auditoria" [level=3] [ref=e237]
                    - generic [ref=e238]:
                      - button "Editar Fixture1 Auditoria" [ref=e239] [cursor=pointer]:
                        - img [ref=e240]
                      - button "Eliminar Fixture1 Auditoria" [ref=e242] [cursor=pointer]:
                        - img [ref=e243]
                  - generic [ref=e245]:
                    - generic [ref=e246]:
                      - term [ref=e247]: Email
                      - definition [ref=e248]: e2e.[REDACTADO]@example.test
                    - generic [ref=e249]:
                      - term [ref=e250]: Categoría
                      - definition [ref=e251]:
                        - generic [ref=e252]: Iniciacion mujeres
                    - generic [ref=e253]:
                      - term [ref=e254]: Edad
                      - definition [ref=e255]: 18 años
                    - generic [ref=e256]:
                      - term [ref=e257]: Rol
                      - definition [ref=e258]:
                        - generic [ref=e259]:
                          - img [ref=e260]
                          - generic [ref=e262]: Estudiante
                  - generic [ref=e264]:
                    - button "Reenviar credenciales a Fixture1 Auditoria" [ref=e265] [cursor=pointer]:
                      - img [ref=e266]
                      - text: Reenviar credenciales
                    - generic [ref=e268]:
                      - button "Suspender a Fixture1 Auditoria" [ref=e269] [cursor=pointer]:
                        - img [ref=e270]
                        - text: Suspender
                      - button "Cambiar rol de Fixture1 Auditoria" [ref=e272] [cursor=pointer]:
                        - img [ref=e273]
                        - text: Cambiar rol
                - 'article "Estudiante: Fixture2 Auditoria" [ref=e275]':
                  - generic [ref=e276]:
                    - heading "Fixture2 Auditoria" [level=3] [ref=e278]
                    - generic [ref=e279]:
                      - button "Editar Fixture2 Auditoria" [ref=e280] [cursor=pointer]:
                        - img [ref=e281]
                      - button "Eliminar Fixture2 Auditoria" [ref=e283] [cursor=pointer]:
                        - img [ref=e284]
                  - generic [ref=e286]:
                    - generic [ref=e287]:
                      - term [ref=e288]: Email
                      - definition [ref=e289]: e2e.[REDACTADO]@example.test
                    - generic [ref=e290]:
                      - term [ref=e291]: Categoría
                      - definition [ref=e292]:
                        - generic [ref=e293]: Perfeccionamiento hombres
                    - generic [ref=e294]:
                      - term [ref=e295]: Edad
                      - definition [ref=e296]: 18 años
                    - generic [ref=e297]:
                      - term [ref=e298]: Rol
                      - definition [ref=e299]:
                        - generic [ref=e300]:
                          - img [ref=e301]
                          - generic [ref=e303]: Estudiante
                  - generic [ref=e305]:
                    - button "Reenviar credenciales a Fixture2 Auditoria" [ref=e306] [cursor=pointer]:
                      - img [ref=e307]
                      - text: Reenviar credenciales
                    - generic [ref=e309]:
                      - button "Suspender a Fixture2 Auditoria" [ref=e310] [cursor=pointer]:
                        - img [ref=e311]
                        - text: Suspender
                      - button "Cambiar rol de Fixture2 Auditoria" [ref=e313] [cursor=pointer]:
                        - img [ref=e314]
                        - text: Cambiar rol
                - 'article "Estudiante: Fixture3 Auditoria" [ref=e316]':
                  - generic [ref=e317]:
                    - heading "Fixture3 Auditoria" [level=3] [ref=e319]
                    - generic [ref=e320]:
                      - button "Editar Fixture3 Auditoria" [ref=e321] [cursor=pointer]:
                        - img [ref=e322]
                      - button "Eliminar Fixture3 Auditoria" [ref=e324] [cursor=pointer]:
                        - img [ref=e325]
                  - generic [ref=e327]:
                    - generic [ref=e328]:
                      - term [ref=e329]: Email
                      - definition [ref=e330]: e2e.[REDACTADO]@example.test
                    - generic [ref=e331]:
                      - term [ref=e332]: Categoría
                      - definition [ref=e333]:
                        - generic [ref=e334]: Perfeccionamiento mujeres
                    - generic [ref=e335]:
                      - term [ref=e336]: Edad
                      - definition [ref=e337]: 18 años
                    - generic [ref=e338]:
                      - term [ref=e339]: Rol
                      - definition [ref=e340]:
                        - generic [ref=e341]:
                          - img [ref=e342]
                          - generic [ref=e344]: Estudiante
                  - generic [ref=e346]:
                    - button "Reenviar credenciales a Fixture3 Auditoria" [ref=e347] [cursor=pointer]:
                      - img [ref=e348]
                      - text: Reenviar credenciales
                    - generic [ref=e350]:
                      - button "Suspender a Fixture3 Auditoria" [ref=e351] [cursor=pointer]:
                        - img [ref=e352]
                        - text: Suspender
                      - button "Cambiar rol de Fixture3 Auditoria" [ref=e354] [cursor=pointer]:
                        - img [ref=e355]
                        - text: Cambiar rol
                - 'article "Estudiante: Fixture4 Auditoria" [ref=e357]':
                  - generic [ref=e358]:
                    - heading "Fixture4 Auditoria" [level=3] [ref=e360]
                    - generic [ref=e361]:
                      - button "Editar Fixture4 Auditoria" [ref=e362] [cursor=pointer]:
                        - img [ref=e363]
                      - button "Eliminar Fixture4 Auditoria" [ref=e365] [cursor=pointer]:
                        - img [ref=e366]
                  - generic [ref=e368]:
                    - generic [ref=e369]:
                      - term [ref=e370]: Email
                      - definition [ref=e371]: e2e.[REDACTADO]@example.test
                    - generic [ref=e372]:
                      - term [ref=e373]: Categoría
                      - definition [ref=e374]:
                        - generic [ref=e375]: Master Hombres
                    - generic [ref=e376]:
                      - term [ref=e377]: Edad
                      - definition [ref=e378]: 18 años
                    - generic [ref=e379]:
                      - term [ref=e380]: Rol
                      - definition [ref=e381]:
                        - generic [ref=e382]:
                          - img [ref=e383]
                          - generic [ref=e385]: Estudiante
                  - generic [ref=e387]:
                    - button "Reenviar credenciales a Fixture4 Auditoria" [ref=e388] [cursor=pointer]:
                      - img [ref=e389]
                      - text: Reenviar credenciales
                    - generic [ref=e391]:
                      - button "Suspender a Fixture4 Auditoria" [ref=e392] [cursor=pointer]:
                        - img [ref=e393]
                        - text: Suspender
                      - button "Cambiar rol de Fixture4 Auditoria" [ref=e395] [cursor=pointer]:
                        - img [ref=e396]
                        - text: Cambiar rol
                - 'article "Estudiante: Fixture5 Auditoria" [ref=e398]':
                  - generic [ref=e399]:
                    - heading "Fixture5 Auditoria" [level=3] [ref=e401]
                    - generic [ref=e402]:
                      - button "Editar Fixture5 Auditoria" [ref=e403] [cursor=pointer]:
                        - img [ref=e404]
                      - button "Eliminar Fixture5 Auditoria" [ref=e406] [cursor=pointer]:
                        - img [ref=e407]
                  - generic [ref=e409]:
                    - generic [ref=e410]:
                      - term [ref=e411]: Email
                      - definition [ref=e412]: e2e.[REDACTADO]@example.test
                    - generic [ref=e413]:
                      - term [ref=e414]: Categoría
                      - definition [ref=e415]:
                        - generic [ref=e416]: Master mujeres
                    - generic [ref=e417]:
                      - term [ref=e418]: Edad
                      - definition [ref=e419]: 18 años
                    - generic [ref=e420]:
                      - term [ref=e421]: Rol
                      - definition [ref=e422]:
                        - generic [ref=e423]:
                          - img [ref=e424]
                          - generic [ref=e426]: Estudiante
                  - generic [ref=e428]:
                    - button "Reenviar credenciales a Fixture5 Auditoria" [ref=e429] [cursor=pointer]:
                      - img [ref=e430]
                      - text: Reenviar credenciales
                    - generic [ref=e432]:
                      - button "Suspender a Fixture5 Auditoria" [ref=e433] [cursor=pointer]:
                        - img [ref=e434]
                        - text: Suspender
                      - button "Cambiar rol de Fixture5 Auditoria" [ref=e436] [cursor=pointer]:
                        - img [ref=e437]
                        - text: Cambiar rol
                - 'article "Estudiante: Fixture6 Auditoria" [ref=e439]':
                  - generic [ref=e440]:
                    - heading "Fixture6 Auditoria" [level=3] [ref=e442]
                    - generic [ref=e443]:
                      - button "Editar Fixture6 Auditoria" [ref=e444] [cursor=pointer]:
                        - img [ref=e445]
                      - button "Eliminar Fixture6 Auditoria" [ref=e447] [cursor=pointer]:
                        - img [ref=e448]
                  - generic [ref=e450]:
                    - generic [ref=e451]:
                      - term [ref=e452]: Email
                      - definition [ref=e453]: e2e.[REDACTADO]@example.test
                    - generic [ref=e454]:
                      - term [ref=e455]: Categoría
                      - definition [ref=e456]:
                        - generic [ref=e457]: Iniciacion hombres
                    - generic [ref=e458]:
                      - term [ref=e459]: Edad
                      - definition [ref=e460]: 18 años
                    - generic [ref=e461]:
                      - term [ref=e462]: Rol
                      - definition [ref=e463]:
                        - generic [ref=e464]:
                          - img [ref=e465]
                          - generic [ref=e467]: Estudiante
                  - generic [ref=e469]:
                    - button "Reenviar credenciales a Fixture6 Auditoria" [ref=e470] [cursor=pointer]:
                      - img [ref=e471]
                      - text: Reenviar credenciales
                    - generic [ref=e473]:
                      - button "Suspender a Fixture6 Auditoria" [ref=e474] [cursor=pointer]:
                        - img [ref=e475]
                        - text: Suspender
                      - button "Cambiar rol de Fixture6 Auditoria" [ref=e477] [cursor=pointer]:
                        - img [ref=e478]
                        - text: Cambiar rol
                - 'article "Estudiante: Fixture7 Auditoria" [ref=e480]':
                  - generic [ref=e481]:
                    - heading "Fixture7 Auditoria" [level=3] [ref=e483]
                    - generic [ref=e484]:
                      - button "Editar Fixture7 Auditoria" [ref=e485] [cursor=pointer]:
                        - img [ref=e486]
                      - button "Eliminar Fixture7 Auditoria" [ref=e488] [cursor=pointer]:
                        - img [ref=e489]
                  - generic [ref=e491]:
                    - generic [ref=e492]:
                      - term [ref=e493]: Email
                      - definition [ref=e494]: e2e.[REDACTADO]@example.test
                    - generic [ref=e495]:
                      - term [ref=e496]: Categoría
                      - definition [ref=e497]:
                        - generic [ref=e498]: Iniciacion mujeres
                    - generic [ref=e499]:
                      - term [ref=e500]: Edad
                      - definition [ref=e501]: 18 años
                    - generic [ref=e502]:
                      - term [ref=e503]: Rol
                      - definition [ref=e504]:
                        - generic [ref=e505]:
                          - img [ref=e506]
                          - generic [ref=e508]: Estudiante
                  - generic [ref=e510]:
                    - button "Reenviar credenciales a Fixture7 Auditoria" [ref=e511] [cursor=pointer]:
                      - img [ref=e512]
                      - text: Reenviar credenciales
                    - generic [ref=e514]:
                      - button "Suspender a Fixture7 Auditoria" [ref=e515] [cursor=pointer]:
                        - img [ref=e516]
                        - text: Suspender
                      - button "Cambiar rol de Fixture7 Auditoria" [ref=e518] [cursor=pointer]:
                        - img [ref=e519]
                        - text: Cambiar rol
                - 'article "Estudiante: Atleta Pruebas" [ref=e521]':
                  - generic [ref=e522]:
                    - heading "Atleta Pruebas" [level=3] [ref=e524]
                    - generic [ref=e525]:
                      - button "Editar Atleta Pruebas" [ref=e526] [cursor=pointer]:
                        - img [ref=e527]
                      - button "Eliminar Atleta Pruebas" [ref=e529] [cursor=pointer]:
                        - img [ref=e530]
                  - generic [ref=e532]:
                    - generic [ref=e533]:
                      - term [ref=e534]: Email
                      - definition [ref=e535]: [CORREO_REDACTADO]
                    - generic [ref=e536]:
                      - term [ref=e537]: Categoría
                      - definition [ref=e538]:
                        - generic [ref=e539]: Iniciacion hombres
                    - generic [ref=e540]:
                      - term [ref=e541]: Edad
                      - definition [ref=e542]: 18 años
                    - generic [ref=e543]:
                      - term [ref=e544]: Rol
                      - definition [ref=e545]:
                        - generic [ref=e546]:
                          - img [ref=e547]
                          - generic [ref=e549]: Estudiante
                  - generic [ref=e551]:
                    - button "Reenviar credenciales a Atleta Pruebas" [ref=e552] [cursor=pointer]:
                      - img [ref=e553]
                      - text: Reenviar credenciales
                    - generic [ref=e555]:
                      - button "Suspender a Atleta Pruebas" [ref=e556] [cursor=pointer]:
                        - img [ref=e557]
                        - text: Suspender
                      - button "Cambiar rol de Atleta Pruebas" [ref=e559] [cursor=pointer]:
                        - img [ref=e560]
                        - text: Cambiar rol
          - button "Abrir guia del panel" [ref=e562] [cursor=pointer]:
            - img [ref=e563]
  - dialog "Agregar Nuevo Estudiante" [ref=e566]:
    - generic [ref=e567]:
      - heading "Agregar Nuevo Estudiante" [level=3] [ref=e568]:
        - img [ref=e570]
        - generic [ref=e572]: Agregar Nuevo Estudiante
      - button "Cerrar modal" [ref=e573] [cursor=pointer]:
        - img [ref=e574]
    - generic [ref=e577]:
      - generic [ref=e578]:
        - heading "Informacion Personal" [level=4] [ref=e579]:
          - img [ref=e580]
          - text: Informacion Personal
        - generic [ref=e582]:
          - generic [ref=e583]:
            - generic [ref=e584]:
              - img [ref=e586]
              - text: Nombre *
            - textbox "Ingrese el nombre" [ref=e588]: E2E960c819f33ba
          - generic [ref=e589]:
            - generic [ref=e590]: Apellido *
            - textbox "Ingrese el apellido" [ref=e591]: Flow
          - generic [ref=e592]:
            - generic [ref=e593]: Email *
            - textbox "[CORREO_REDACTADO]" [ref=e594]: [CORREO_REDACTADO]
          - generic [ref=e595]:
            - generic [ref=e596]: Telefono
            - textbox "099 123 4567" [ref=e597]: "0999999999"
          - generic [ref=e598]:
            - generic [ref=e599]: Fecha de Nacimiento *
            - textbox [active] [ref=e600]: 2010-01-01
      - generic [ref=e601]:
        - heading "Informacion del Estudiante" [level=4] [ref=e602]:
          - img [ref=e603]
          - text: Informacion del Estudiante
        - generic [ref=e605]:
          - generic [ref=e606]: Categoria *
          - combobox [ref=e607]:
            - option "Seleccionar categoria"
            - option "Iniciacion Hombres" [selected]
            - option "Iniciacion Mujeres"
            - option "Master Mujeres"
            - option "master_hombres"
            - option "Perfeccionamiento Hombres"
            - option "Perfeccionamiento Mujeres"
      - generic [ref=e608]:
        - heading "Credenciales de Acceso" [level=4] [ref=e609]:
          - img [ref=e610]
          - text: Credenciales de Acceso
        - paragraph [ref=e612]: Despues de guardar, deseas enviar automaticamente las credenciales por email?
        - generic [ref=e613]:
          - generic [ref=e614] [cursor=pointer]:
            - radio "Si, enviar al guardar" [ref=e615]
            - text: Si, enviar al guardar
          - generic [ref=e616] [cursor=pointer]:
            - radio "No, enviar despues" [checked] [ref=e617]
            - text: No, enviar despues
      - generic [ref=e618]:
        - button "Cancelar" [ref=e619] [cursor=pointer]
        - button "Crear" [ref=e620] [cursor=pointer]
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
> 35 |   await form.getByRole('button', { name: /^Guardar$/i }).click();
     |                                                          ^ Error: locator.click: Test timeout of 60000ms exceeded.
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
  47 |   await page.locator('#user-filters-athletes-search').fill(email);
  48 |   await expect(page.getByText(email, { exact: true }).first()).toBeVisible();
  49 | 
  50 |   await openAdminSection(page, 'pagos');
  51 |   await page.getByRole('button', { name: /Registrar Pago/i }).first().click();
  52 |   const payment = page.getByRole('dialog');
  53 |   await payment.locator('#student_id').fill(firstName);
  54 |   await payment.getByRole('button', { name: new RegExp(fullName, 'i') }).click();
  55 |   await payment.locator('#membership_type_id').selectOption({ label: 'Mensualidad normal' });
  56 |   await expect(payment.locator('#monto')).toBeDisabled();
  57 |   await expect(payment.locator('#monto')).toHaveValue('$35.00');
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