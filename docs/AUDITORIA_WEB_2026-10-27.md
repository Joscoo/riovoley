# Auditoría general de RioVoley

## Alcance y criterio

Mantenimiento de la aplicación CRA existente: corregir los problemas comprobados
del informe móvil, ejecutar las pruebas de módulos y armonizar componentes con
la identidad azul, negro y dorado. Se conservan los cambios previos de seguridad.

Fuente: [PageSpeed móvil, 27 de octubre de 2026](https://pagespeed.web.dev/analysis/https-riovoley-com/2s61kuc4gj?form_factor=mobile).
Rendimiento 79, accesibilidad 98, buenas prácticas 100, SEO 100.
FCP 1,1 s; LCP 5,6 s; TBT 90 ms; CLS 0.

## Trabajo y validación

1. Medir build y pruebas actuales; inventariar las rutas públicas y paneles.
2. Reducir el logo que se muestra en navegación (original 1280 × 750, 599.138 bytes),
   reservar sus dimensiones y anticipar su descarga desde HTML.
3. Usar un fondo estático ligero en móviles y respetar ahorro de datos y
   movimiento reducido también en escritorio. Mantener el vídeo en escritorio.
4. Separar las pantallas y la gamificación del código inicial de la portada.
5. Añadir área principal, enlace de salto y navegación móvil por teclado;
   corregir los espacios bajo la barra fija y reutilizar los colores existentes.
6. Configurar caché de navegador para JS/CSS con hash en Vercel; validar sin
   publicar cambios en producción.
7. Ejecutar unitarias completas, recuperación de contraseña, navegación y
   filtros por módulo, responsive y build final. Registrar por separado
   cobertura real, cobertura simulada y flujos que requieren credenciales.

## Evidencia inicial

- 81 suites y 380 pruebas unitarias aprobadas.
- Build de producción aprobado.
- E2E inicial de escritorio: 11 aprobadas y 2 omitidas por credenciales.
- El informe identifica 539 KiB de ahorro en imágenes y 209 KiB en JavaScript.
- El vídeo móvil descarga aproximadamente 1,8 MB; el logo se usa además como
  póster de ese vídeo.
- El servidor entrega `s-maxage` para JS; falta `max-age` para el navegador.

## Límites de la revisión

Las puntuaciones del informe corresponden a producción antes de estos cambios.
Las pruebas que alteran pagos, asistencias, cuentas o envían notificaciones reales
no se habilitan como parte de la navegación de comprobación. La corrección RLS
se limita al catálogo no sensible descrito abajo; no se modifica el acceso a
datos personales ni se despliega el frontend a producción.

## Cambios implementados

| Recurso | Antes | Después |
| --- | ---: | ---: |
| Logo de navegación | 599.138 bytes | 8.460 bytes |
| Fondo móvil | vídeo de 1.809.969 bytes + póster del logo | imagen de 25.944 bytes |
| JavaScript inicial, gzip | 297.366 bytes | 207.959 bytes (−30,1 %) |
| Iconos ICO redundantes | hasta dos descargas de 158.462 bytes | iconos PNG existentes de 48/96 px |

- Portada visible desde el primer render; pantallas públicas secundarias y
  gamificación se cargan bajo demanda.
- Páginas públicas con un único `main`, enlace para saltar al contenido y
  dimensiones explícitas de imágenes. El enlace incluye `tabindex="0"` para
  acceso por teclado en WebKit móvil.
- Menú móvil azul/dorado, cerrado fuera del árbol de navegación cuando no está
  visible, foco contenido, cierre con Escape y restauración al botón de apertura.
- Sidebar de los tres roles con selección dorada; altura de barra compartida,
  sin doble espacio superior en los paneles. Se respetan movimiento reducido y
  ahorro de datos también en escritorio.
- Diálogos compartidos con nombre accesible, foco, Escape y portal sobre la
  navegación. El bloqueo de scroll queda en un único componente para pagos.
- Filtro de administradores: ahora aplica activo/suspendido y Limpiar restaura
  también el estado.
- Historial de asistencias: apertura mediante botón con `aria-expanded` y
  `aria-controls`, accesible por teclado y con indicador legible. Se elimina la
  doble consulta inicial y se descartan respuestas de filtros anteriores para
  impedir que sobrescriban el resultado actual o escondan el indicador de carga.
- Caché de navegador para recursos estáticos con hash; imágenes con caducidad
  limitada. Véase [documentación de Cache-Control de Vercel](https://vercel.com/docs/caching/cache-control-headers).
- Playwright carga `.env.e2e` sin reemplazar variables exportadas. Los tests
  esperan la pantalla de login cuando una ruta se carga de forma diferida y
  omiten la guía inicial para probar la operación normal del panel.

## Corrección de categorías en producción

Se reprodujo `42501: permission denied for table training_categories` bajo el
rol `authenticated`. La vista era `security_invoker`, pero faltaban los permisos
en su tabla subyacente. Existían siete categorías activas; la interfaz vacía
era consecuencia del error, no de falta de datos.

Con autorización explícita del usuario se aplicó
[`20261028014018_restore_training_category_access.sql`](../supabase/migrations/20261028014018_restore_training_category_access.sql).
El nombre del archivo coincide con la versión registrada por Supabase.

La lectura pública existente se mantiene; las escrituras autenticadas requieren
ser administrador mediante RLS. Se comprobaron lectura autenticada, rechazo de
inserción no administrativa, alta/edición/eliminación administrativa y ausencia
de escritura anónima. Los registros de prueba se revirtieron en una transacción.
La prueba reproducible está en
[`training_categories_access.sql`](../database/tests/training_categories_access.sql).

Las pruebas finales de navegador utilizan el catálogo real. La respuesta pública
simulada utilizada durante el diagnóstico se retiró de las pruebas.

## Medición local de rendimiento

Lighthouse 13.6.0, perfil móvil, build de producción servido localmente con gzip
y las reglas de caché preparadas: rendimiento **94**, accesibilidad **100**,
SEO **100**; FCP **1,3 s**, LCP **2,7 s**, TBT **150 ms**, CLS **0**,
Speed Index **1,5 s**. Transferencia medida: **282.397 bytes**.

La máquina inyecta un script de Kaspersky en las páginas HTTP. Se bloqueó
únicamente su URL durante esta medición, sin modificar la configuración del
antivirus. La medición final se ejecutó sin otras suites de navegador en marcha.
El servidor local usa HTTP: su puntuación de buenas prácticas no equivale a la
del dominio HTTPS. No se presenta esta medición como un nuevo PageSpeed de
producción; las condiciones difieren de las del informe proporcionado.

Los cambios de frontend y cabeceras están preparados en el repositorio, sin
publicar. Después del despliegue se debe repetir el informe móvil del dominio.

## Cobertura de módulos

La suite unitaria contiene pruebas en los 20 módulos funcionales. Los números
indican archivos de prueba, no porcentajes de cobertura.

| Módulo | Archivos de prueba | Comprobación adicional en navegador |
| --- | ---: | --- |
| account-admin | 3 | Perfil y configuración |
| admin-dashboard | 2 | Dashboard y sus 11 secciones |
| announcements | 2 | Anuncios en los tres roles |
| athletes | 2 | Listado y filtros de estudiantes |
| attendance | 3 | Filtros, orden, expansión de días |
| auth-profile | 2 | Perfiles de los tres roles |
| auth-session | 6 | Login por rol y recuperación de contraseña |
| communications | 3 | Pruebas unitarias de casos de uso y repositorio |
| gamification | 9 | Progreso de estudiante y administración |
| notifications | 4 | Apertura de campana de admin/entrenador; ausente en estudiante |
| payments | 3 | Filtros, orden, diálogo y restauración del scroll |
| physical-tests | 2 | Filtros y navegación por rol |
| reporting | 3 | Centro de reportes y revisión financiera |
| schedules | 2 | Horarios públicos, gestión y filtros |
| student-dashboard | 6 | Seis secciones, móvil y escritorio |
| trainer-dashboard | 2 | Seis secciones, móvil y escritorio |
| trainer-management | 2 | Pestaña entrenadores, filtros y reset |
| training-categories | 1 | Catálogo real más pruebas SQL de permisos |
| user-management | 7 | Tres pestañas, filtros, alta sin guardar y reset |
| user-provisioning | 3 | Entrada del formulario; casos de uso cubiertos por unitarias |

La apertura de módulos comprueba navegación y ausencia de errores JavaScript;
no certifica todos sus flujos de escritura. No se registraron pagos/asistencias,
no se crearon usuarios y no se enviaron mensajes reales como parte de los E2E.

## Evidencia reproducible

Los logs, capturas y JSON de Lighthouse de esta sesión están en
`.superpowers/audit/` (excluido de Git para no versionar datos de pruebas).
Los tests y la migración sí forman parte de los cambios revisables.

- Unitarias completas: **83 suites, 387 pruebas**, todas aprobadas.
- Funciones de credenciales: **10 pruebas**, aprobadas (`npm run test:auth-edge`).
- E2E de cierre: **90 pruebas aprobadas**: 30 en escritorio y 60 adicionales
  de navegación, teclado y roles en móvil, tablet y escritorio de 1920 px.
  Se comprobaron los siete tamaños configurados entre 390 y 1920 px.
- Asistencias: la regresión de filtros pasó **3 repeticiones consecutivas** y
  volvió a pasar en la suite completa de escritorio.
- Entrenador y estudiante: recorrido adicional de sus seis secciones en móvil
  y escritorio, **4 pruebas aprobadas**.
- Calidad de textos y `git diff --check`: aprobados.
- Build de producción: validado con `npm run build`.
- Permisos del catálogo: prueba SQL transaccional antes y después de aplicar.
- Revisión independiente del diff: se corrigió la duplicación del bloqueo de
  scroll en pagos detectada por la revisión.
