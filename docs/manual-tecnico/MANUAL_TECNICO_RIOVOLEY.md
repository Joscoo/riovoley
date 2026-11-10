<div class="portada">
  <img class="logo" src="recursos/logo-riovoley.png" alt="Logotipo oficial de RioVoley, Riobamba, Ecuador">
  <p class="tipo">Documentación del sistema</p>
  <p class="titulo">Manual técnico<br>RIOVOLEY</p>
  <p class="subtitulo">Plataforma de gestión deportiva, administrativa y de seguimiento del atleta</p>
  <p class="version">MT-RV-001 · Edición 1.0<br>9 de noviembre de 2026<br>Web y aplicación Android</p>
</div>

# Manual técnico de RioVoley

## Control documental

| Campo | Valor |
| --- | --- |
| Código | MT-RV-001 |
| Edición del documento | 1.0 |
| Fecha de elaboración | 2026-11-09 |
| Producto | RioVoley |
| Versión declarada de la web | `0.1.0`, según `package.json`; no equivale a la versión nativa ni al bundle OTA |
| Base de revisión | Código y documentación del repositorio; commit base `0bc835b` |
| Idioma y contexto | Español; operación del club en Ecuador |
| Destinatarios | Desarrollo, soporte, administración técnica, pruebas y responsables de operación |
| Alcance de verificación | Inspección estática del producto y de sus procedimientos; este manual no certifica el estado del servicio desplegado |

La edición documenta el árbol de trabajo revisado el 9 de noviembre de 2026. Los archivos de auditoría o propuestas sin integrar no se consideran funcionalidades publicadas. Una modificación de permisos, reglas, esquema o integraciones exige revisar este documento y registrar una nueva edición.

Para conservar colores, portada y saltos de página en el PDF, usar [la hoja de estilos](manual-tecnico.css) y seguir [la guía de exportación](README.md). El contenido sigue siendo legible como Markdown sin estilos.

## Índice

1. [Propósito y alcance del producto](#proposito)
2. [Identidad visual del documento](#identidad)
3. [Arquitectura y componentes](#arquitectura)
4. [Requisitos y preparación del entorno](#entorno)
5. [Roles, acceso y permisos](#roles)
6. [Catálogo de funcionalidades](#funcionalidades)
7. [Flujos y reglas de negocio](#flujos)
8. [Modelo de datos](#datos)
9. [Servicios e integraciones](#servicios)
10. [Seguridad y tratamiento de información](#seguridad)
11. [Construcción, despliegue y Android](#despliegue)
12. [Pruebas y criterios de aceptación](#pruebas)
13. [Operación, respaldo y mantenimiento](#operacion)
14. [Diagnóstico de incidencias](#incidencias)
15. [Límites y dependencias de disponibilidad](#limites)
16. [Trazabilidad y referencias del repositorio](#referencias)
17. [Glosario e historial documental](#glosario)

<a id="proposito"></a>

## 1. Propósito y alcance del producto

RioVoley centraliza la operación del club: administra usuarios, estudiantes, entrenadores, mensualidades, asistencias, horarios, evaluaciones físicas y comunicados. Ofrece paneles por rol, reportes administrativos y un sistema de progreso y recompensas para los estudiantes.

El producto dispone de una aplicación web de una sola página y una aplicación Android que utiliza el mismo frontend mediante Capacitor. La persistencia y autenticación se apoyan en Supabase; determinadas acciones se ejecutan en funciones de servidor.

Este manual describe cómo está construido el sistema, qué funcionalidades están disponibles en cada panel, qué reglas gobiernan sus datos y cómo preparar, verificar y mantener un entorno. Las instrucciones de uso por rol se incluyen para explicar los procesos técnicos y sus resultados esperados.

### 1.1 Canales y alcance funcional

| Canal | Función |
| --- | --- |
| Sitio público | Inicio, información institucional y consulta de horarios |
| Panel administrativo | Control general, usuarios, cobros, asistencia, horarios, evaluaciones, anuncios, reportes y catálogos de gamificación |
| Panel del entrenador | Gestión de estudiantes, cobros, asistencia, evaluaciones, anuncios y configuración propia |
| Panel del estudiante | Consulta personal de mensualidad, asistencia y evaluaciones; progreso, identidad y tienda cosmética |
| Android | Acceso a los paneles, integración móvil, notificaciones push, enlaces de recuperación y actualizaciones OTA según configuración |

### 1.2 Interpretación de disponibilidad

Se emplean tres distinciones a lo largo del manual:

- **Presente en el código:** existe una pantalla, servicio o regla en el repositorio revisado.
- **Dependiente del entorno:** requiere esquema, permisos, función desplegada, bucket o proveedor configurado.
- **Pendiente o restringido:** hay un límite explícito del producto o una preparación técnica que todavía no acredita disponibilidad operativa.

La presencia de una pantalla o una prueba local satisfactoria no demuestra por sí sola que todas sus dependencias estén activas en producción. Los antecedentes de publicación se consultan en el [runbook de producción](../produccion/RUNBOOK.md).

<a id="identidad"></a>

## 2. Identidad visual del documento

La presentación utiliza los colores definidos en [Tailwind](../../tailwind.config.js), el estilo de fondo de los paneles y los logotipos existentes en el producto.

| Elemento | Valor / procedencia | Aplicación editorial |
| --- | --- | --- |
| Dorado institucional de la interfaz | `#FFD700`, token `rv.gold` | Líneas de sección, acentos y franja de portada |
| Negro de panel | `#0A0A0A`, token `rv.dark` | Fondo de portada y texto sobre dorado |
| Azul profundo | `#1E3A8A`, token `rv.deepBlue` | Títulos, cabeceras de tabla y enlaces |
| Degradado de panel | `135deg`, negro → azul profundo | Portada |
| Logotipo principal | `public/images/logoRio.png` | Portada; copia exacta en `recursos/logo-riovoley.png` |
| Logotipo de navegación | `public/images/logoRio-nav.webp` | Cierre del documento; copia exacta en `recursos/logo-riovoley-nav.webp` |
| Tipografía de lectura | Segoe UI / Arial, con alternativas del sistema | Texto y tablas |
| Tipografía técnica | Consolas / Courier New | Comandos, rutas e identificadores |

Los logotipos conservan sus colores originales. El cuerpo se presenta sobre blanco para facilitar lectura e impresión; el dorado se utiliza como acento o fondo con texto oscuro. Las copias locales permiten trasladar el paquete del manual sin perder las imágenes.

<a id="arquitectura"></a>

## 3. Arquitectura y componentes

### 3.1 Vista general

```text
Navegador web                    Aplicación Android
       |                         Capacitor / WebView
       +-----------------------------+
                     |
          React SPA + React Router
                     |
       Features: presentación y servicios
                     |
         Casos de uso y reglas de dominio
                     |
        Repositorios / gateways compartidos
                     |
                  Supabase
       +-------------+-------------+
       |             |             |
     Auth       API de datos      Storage
                     |             |
              PostgreSQL      PDFs e imágenes
              vistas / RLS
                     |
             Edge Functions
                     |
         Correo Resend / Push FCM
```

La autorización efectiva depende del backend: filtros y botones del frontend organizan la experiencia, mientras que los permisos SQL, RLS y validaciones de servidor determinan qué operaciones pueden ejecutarse sobre los datos.

### 3.2 Tecnologías identificadas

Las versiones de esta tabla son las referencias declaradas en los manifiestos; los lockfiles fijan la resolución reproducible de dependencias.

| Componente | Referencia declarada | Responsabilidad |
| --- | --- | --- |
| React / React DOM | `^19.1.1` | Componentes, estado y renderizado de la SPA |
| React Router DOM | `^7.7.0` | Rutas públicas y paneles |
| Create React App | `react-scripts 5.0.1` | Desarrollo, pruebas Jest y compilación web |
| Tailwind CSS | `^3.4.13` | Estilos, tokens y adaptación responsive |
| Supabase JS | `^2.74.0` | Auth, datos, Storage, Realtime y funciones desde la web |
| PostgreSQL | Mayor `17` en la configuración local | Persistencia, restricciones, triggers, vistas y políticas |
| Capacitor | Familia `8.x` | Contenedor y capacidades nativas Android |
| Capgo Updater | `^8.47.9` | Actualización del bundle web Android |
| Recharts | `^3.3.0` | Gráficos operativos y deportivos |
| jsPDF / AutoTable | `^4.2.0` / `^5.0.7` | Exportaciones PDF del frontend |
| Playwright | `^1.53.0` | Pruebas E2E y perfiles de pantalla |
| Deno | Runtime de los entrypoints Edge | Operaciones de servidor desplegables en Supabase |
| Node / Express / TypeScript auxiliares | Node `22`, Express `^5.1.0`, TS `^5.8.3` en `functions/` | Árbol auxiliar; su existencia no demuestra que sea un servicio desplegado |

El frontend utiliza Node `24.x` y npm `11.x`. `functions/` declara un runtime diferente y se instala por separado cuando lo requiere una tarea. El sistema no utiliza Next.js ni Remix.

### 3.3 Organización del código

```text
src/
  App.js                    Rutas y arranque móvil
  components/               Sitio público
  config/                   Cliente Supabase y configuración
  contexts/                 Contextos compartidos
  features/<feature>/
    presentation/           Componentes, hooks y servicios
    application/            Casos de uso y contratos
    domain/                 Reglas, políticas y errores
    infrastructure/         Repositorios y gateways
  shared/                   UI, plataforma e infraestructura común
  utils/                    Fechas, PII, pagos, contraseñas y PDF
public/                     HTML y recursos públicos
database/                   SQL y procedimientos de esquema
supabase/functions/         Funciones Edge y módulos compartidos
functions/                  Proyecto npm auxiliar
android/                    Proyecto nativo Capacitor
tests/                      Pruebas E2E, unitarias e integración
scripts/                    Toolchain, pruebas y operación
docs/                       Documentación y evidencias
vendor/                     Adaptadores de dependencias locales
```

La organización **Clean Lite por feature** separa UI, coordinación de operaciones y acceso a infraestructura. No todos los módulos tienen exactamente el mismo número de archivos. Para incorporar un cambio se debe seguir la organización del feature correspondiente y reutilizar `src/shared/` para necesidades transversales.

### 3.4 Rutas reales

| Ruta | Componente o propósito | Acceso previsto |
| --- | --- | --- |
| `/` | `HomePage` | Público |
| `/sobre` | `AboutUs` | Público |
| `/horarios` | `Horarios` | Público; datos según configuración del backend |
| `/login` | `Login` | Inicio de sesión y solicitud de recuperación |
| `/reset-password` | `ResetPassword` | Flujo con sesión o token de recuperación válido |
| `/admin` | `AdminPanel` | Administrador |
| `/entrenador` | `TrainerPanel` | Entrenador |
| `/estudiante` | `StudentPanel` | Estudiante o alias `usuario`, con ficha asociada |

Los módulos internos de cada panel se seleccionan mediante estado de la interfaz. No debe suponerse que cada pestaña constituye una ruta independiente. Entrar en la URL de un panel no concede permisos: los componentes comprueban el perfil antes de mostrar su contenido.

<a id="entorno"></a>

## 4. Requisitos y preparación del entorno

### 4.1 Requisitos

| Actividad | Requisitos |
| --- | --- |
| Desarrollo web | Git, Node `24.x`, npm `11.x`, navegador y repositorio completo con `vendor/` |
| Backend remoto de desarrollo | Proyecto Supabase autorizado, esquema compatible y configuración propia del entorno |
| Laboratorio E2E aislado | Docker Desktop en modo Linux, dependencias del proyecto y arnés local |
| Pruebas de contratos Edge con TS | Dependencias de `functions/` instaladas |
| Android | Android Studio, SDK/JDK compatibles con el proyecto Gradle, dispositivo o emulador y configuración nativa |
| Exportación de este documento | Renderizador Markdown con HTML y CSS; procedimiento en [README](README.md) |

La referencia de Node está en [.nvmrc](../../.nvmrc). La opción `install-links=true` de [.npmrc](../../.npmrc) forma parte de la instalación reproducible; no se debe excluir `vendor/` al copiar el proyecto.

### 4.2 Instalación web en PowerShell

Desde una copia del repositorio y su directorio raíz:

```powershell
node --version
npm.cmd --version
npm.cmd ci
if (-not (Test-Path -LiteralPath '.env.local')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env.local'
}
```

Completar `.env.local` mediante el procedimiento privado del equipo. No sobrescribir un archivo restaurado que contenga la clave PII histórica. Los ejemplos públicos deben conservar únicamente nombres o marcadores, nunca valores operativos.

```dotenv
REACT_APP_SUPABASE_URL=<URL_DEL_ENTORNO_AUTORIZADO>
REACT_APP_SUPABASE_ANON_KEY=<CLAVE_PUBLICA_DEL_ENTORNO>
REACT_APP_APP_URL=<ORIGEN_PUBLICO_DE_LA_APLICACION>
REACT_APP_PII_ENCRYPTION_KEY=<CLAVE_COMPATIBLE_CON_LOS_DATOS>
REACT_APP_ENABLE_OTA_DIAGNOSTICS=false
```

Los marcadores anteriores no son valores utilizables. El cliente Supabase exige URL y clave pública para inicializarse; las operaciones de PII también requieren su clave compatible.

```powershell
npm.cmd start
```

El frontend local usa normalmente `http://localhost:3000`. El arranque pasa por `scripts/toolchain/start.cjs`, que adapta CRA al servidor de desarrollo actualizado y restringe la exposición a loopback. Después de modificar variables de CRA es necesario reiniciar el proceso; para una publicación se debe recompilar.

En los bloques PowerShell se usa `npm.cmd` para evitar que una política de ejecución de scripts bloquee `npm.ps1`. En otros shells puede usarse `npm`.

### 4.3 Variables por ámbito

| Ámbito | Variables | Uso |
| --- | --- | --- |
| Web: conexión | `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY` | URL y clave pública de Supabase |
| Web: enlaces | `REACT_APP_APP_URL` | Origen para enlaces de acceso y recuperación |
| Web: compatibilidad PII | `REACT_APP_PII_ENCRYPTION_KEY` | Cifrado e índices de búsqueda existentes |
| Web: versión y OTA | `REACT_APP_VERSION`, `REACT_APP_CAPGO_DEFAULT_CHANNEL` | Identificación de bundle y selección de canal |
| Web: diagnóstico | `REACT_APP_ENABLE_OTA_DIAGNOSTICS`, `REACT_APP_ENABLE_SQL_AUDIT`, `REACT_APP_ENABLE_WEB_VITALS_LOG` | Capacidades de diagnóstico; omitir o desactivar en producción según inventario |
| Web: datos institucionales públicos | `REACT_APP_CLUB_ADMIN_PHONE`, `REACT_APP_CLUB_COACH_PHONE`, `REACT_APP_CLUB_EMERGENCY_PHONE` | Contactos del club cuando se autorice publicarlos |
| Edge: Supabase | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Cliente de usuario y operaciones privilegiadas de servidor |
| Edge: correo | `RESEND_API_KEY`, `FROM_EMAIL` | Envío mediante Resend |
| Edge: push | `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` | Cuenta de servicio y proyecto Firebase |
| Edge: programación | `REPORTS_SCHEDULER_SECRET` | Autenticación del emisor de tareas programadas |
| Android: firma | `KEYSTORE_PASSWORD`, `KEY_PASSWORD` | Firma mediante el keystore autorizado |

> Todo `REACT_APP_*` queda incorporado al JavaScript público, incluido el bundle Android/OTA. El nombre de una variable no la convierte en un secreto. Nunca introducir una clave privilegiada de Supabase, una credencial FCM, Resend o un token privado WhatsApp en el frontend.

La plantilla histórica incluye `REACT_APP_WHATSAPP_ACCESS_TOKEN` y los identificadores `REACT_APP_WHATSAPP_PHONE_NUMBER_ID` y `REACT_APP_WHATSAPP_BUSINESS_ACCOUNT_ID`. El inventario de producción considera bloqueante publicar el token privado en el cliente. La disponibilidad de ese flujo requiere resolver su tratamiento en backend o su desactivación, según el [inventario de variables](../produccion/VARIABLES.md).

### 4.4 Base de datos y entornos

No basta con crear un proyecto Supabase vacío: el frontend consume tablas, vistas, relaciones, funciones y catálogos específicos. Los SQL de `database/` incluyen baselines, correcciones históricas y propuestas; no forman una lista que deba ejecutarse indiscriminadamente por orden alfabético.

Para preparar o restaurar un entorno, consultar el [baseline canónico](../../database/BASELINE_SCHEMA_CANONICAL_RUNBOOK_2026_04_27.md), el [orden de migración](../../database/PHASE3_SCHEMA_MIGRATION_EXECUTION_ORDER_2026_04_27.md) y el procedimiento vigente de producción. El baseline tiene prerrequisitos y no equivale por sí solo a una restauración completa del servicio.

Para pruebas sin cuentas institucionales, utilizar el [arnés local](../../scripts/e2e/local/README.md). Este mantiene configuración, credenciales ficticias y artefactos privados en `.e2e-local/`, separado de los archivos del entorno institucional.

<a id="roles"></a>

## 5. Roles, acceso y permisos

### 5.1 Identificadores funcionales

| Rol visible | Valor técnico principal | Alcance |
| --- | --- | --- |
| Administrador | `administrador` | Gestión general y herramientas administrativas |
| Entrenador | `entrenador` | Gestión operativa de estudiantes y entrenamiento |
| Estudiante | `estudiante` | Información y acciones propias del atleta |
| Estudiante, compatibilidad | `usuario` | Alias aceptado en el panel del estudiante; requiere revisar coherencia de perfil y ficha |
| Visitante | Sin sesión | Páginas públicas e inicio de sesión |

El tipo `atleta` empleado en la gestión de usuarios identifica al estudiante como destinatario de una operación. No constituye un cuarto rol de autenticación. Tampoco existe un panel independiente de representante o padre de familia en las rutas revisadas.

`auth-profile` resuelve el perfil mediante `user_profiles`, luego `users` y finalmente un perfil base. Los fallbacks permiten presentar estados incompletos, pero no sustituyen la asignación correcta del rol ni la relación `students.user_id`.

### 5.2 Matriz de acceso a módulos

**G:** gestión desde el panel. **C:** consulta. **P:** acciones sobre información propia. **—:** sin sección en ese panel. Esta matriz representa la navegación y capacidades del cliente; los permisos efectivos del servidor deben coincidir con ella.

| Módulo | Administrador | Entrenador | Estudiante |
| --- | --- | --- | --- |
| Dashboard operativo | C general | C operativo | — |
| Usuarios: estudiantes | G | G con restricciones | — |
| Usuarios: entrenadores y administradores | G con restricciones | — | — |
| Pagos y mensualidades | G | G | C propia |
| Registro de asistencias | G | G | C propia |
| Administración de horarios | G | — | — |
| Consulta pública de horarios | C | C | C |
| Evaluaciones físicas | G | G | C propia y gráficos |
| Anuncios | G | G | C según audiencia |
| Centro de reportes | G | — | — |
| Revisión financiera | C | — | — |
| Catálogos de gamificación | G | — | — |
| Progreso, identidad y tienda cosmética | — | — | P |
| Configuración de perfil y contraseña | P | P | P |
| Campana de notificaciones | Según sesión y datos accesibles | Según sesión y datos accesibles | Según sesión y datos accesibles |

El entrenador utiliza los mismos componentes de pagos, asistencias, tests y anuncios que el administrador. No se debe describir su panel como exclusivamente de lectura ni limitarlo al seguimiento deportivo.

### 5.3 Permisos de gestión de usuarios

La matriz está definida en `createUserManagementUseCases.js`; se completa con restricciones del componente y del repositorio.

| Actor → destinatario | Ver / crear / editar | Eliminar | Suspender / reactivar | Reenviar credenciales | Cambiar rol |
| --- | --- | --- | --- | --- | --- |
| Administrador → estudiante | Sí | Sí | Sí | Sí | Sí |
| Administrador → entrenador | Sí | Sí | Sí | Sí | Sí |
| Administrador → administrador | Sí | No | No | No | Restringido al administrador principal para otro administrador |
| Entrenador → estudiante | Sí | No en la UI | Sí | Sí | No |
| Entrenador → entrenador o administrador | No | No | No | No | No |
| Estudiante → otros usuarios | No | No | No | No | No |

Restricciones adicionales:

- No se puede eliminar una cuenta de administrador desde el módulo revisado.
- El administrador no puede quitarse a sí mismo su rol administrativo.
- Para modificar el rol de otro administrador se comprueba la cuenta principal definida en `domain/adminPrivileges.js`. No es un rol adicional ni una preferencia editable desde el panel.
- La ausencia del botón de eliminación para el entrenador no demuestra por sí sola la denegación del endpoint: las políticas y el caso de uso Edge deben revisarse de forma independiente.

Estas reglas son especialmente sensibles a diferencias entre la versión del cliente y las funciones desplegadas. Para homologar el backend consultar la [propuesta de seguridad](../../database/security/production-proposal/README.md) y sus gates de publicación.

### 5.4 Sesión y recuperación

El acceso utiliza Supabase Auth con correo y contraseña. El frontend normaliza el correo, consulta el control de intentos y registra el resultado cuando están disponibles sus contratos. Después del login resuelve primer ingreso, perfil y navegación por rol.

En el primer ingreso se solicita el cambio de la contraseña temporal. El restablecimiento utiliza `/reset-password` y, en Android, el enlace `riovoley://reset-password` según la configuración de URLs autorizadas. La UI de recuperación exige al menos diez caracteres, mayúscula, minúscula, número, carácter especial, ausencia de espacios y confirmación coincidente.

La configuración de URLs del archivo local de Supabase no modifica la configuración remota. Las URLs y el proveedor SMTP del proyecto desplegado se verifican por separado.

<a id="funcionalidades"></a>

## 6. Catálogo de funcionalidades

### 6.1 Administrador

| Sección del panel | Funcionalidades observadas | Módulos principales |
| --- | --- | --- |
| Dashboard | Indicadores de estudiantes, pagos, asistencia, categorías y actividad reciente; accesos a módulos | `admin-dashboard` |
| Gestión de Usuarios | Pestañas de estudiantes, entrenadores y administradores; búsqueda, filtros, orden, paginación, altas, edición y acciones permitidas | `user-management`, `user-provisioning` |
| Pagos | Registro y edición de mensualidades, vista previa del período, período personalizado, filtros, estado y baja lógica | `payments` |
| Asistencias | Registro por fecha y estudiante, selección de forma de pago, acciones en lote, historial, correcciones y exportación | `attendance` |
| Horarios | Creación para días/categorías, horas de inicio y fin, descripción, edición y eliminación | `schedules`, `training-categories` |
| Tests Físicos | Alta, edición, eliminación, comparación de resultados y estudiantes pendientes de evaluación del mes | `physical-tests` |
| Anuncios | Creación, edición, prioridad, audiencia, vigencia, activación y eliminación | `announcements` |
| Reportes | Operación, finanzas, padrón e historial; exportaciones inmediatas y reportes persistidos | `reporting`, `ReportsCenter` |
| Revisión Financiera | Ingresos, vencimientos, asistencia e indicadores de cartera estimada; filtros y gráficos | `FinancialReview` |
| Gamificación | Tienda cosmética, catálogo de logros y metas; configuración de reglas y recursos visuales | `gamification` |
| Configuración | Datos personales y cambio de contraseña propia | `account-admin` |

### 6.2 Entrenador

| Sección | Funcionalidad |
| --- | --- |
| Dashboard | Total de atletas, asistencias del día, tests pendientes y pagos del mes |
| Gestión de Usuarios | Administración de estudiantes con los límites de la matriz de permisos |
| Asistencias | Registro, corrección y consulta mediante el gestor compartido |
| Tests Físicos | Gestión de evaluaciones y seguimiento de pendientes |
| Pagos | Gestión de mensualidades mediante el componente compartido |
| Anuncios | Gestión de comunicados mediante el componente compartido |
| Configuración | Perfil y seguridad de la cuenta propia |

No hay una sección de horarios administrativos, centro de reportes, revisión financiera ni catálogo administrativo de gamificación en este panel.

### 6.3 Estudiante

| Sección | Funcionalidad |
| --- | --- |
| Anuncios | Lectura de comunicados activos dirigidos a su audiencia |
| Mi Progreso | XP, nivel, logros, retos, campañas, rachas, etapas del atleta, clasificaciones y monedas según contratos disponibles |
| Mensualidad | Estado vigente, fechas del período, días restantes e historial propio de pagos |
| Asistencias | Resumen y consulta del historial de entrenamiento propio |
| Tests Físicos | Historial personal, evolución gráfica y comparación de métricas |
| Mi Perfil | Identidad deportiva, apodo, título, avatar o fotografía; configuración de datos y contraseña |

El estudiante no registra cobros, modifica asistencias ni edita resultados físicos desde su panel. La compra cosmética usa monedas virtuales de gamificación y no constituye el pago de una mensualidad.

### 6.4 Funcionalidades transversales

- Interfaz responsive para móvil, tableta y escritorio.
- Guía interactiva inicial por panel, cuyo estado se conserva en el almacenamiento local del cliente.
- Componentes comunes de tablas, filtros, formularios, estados vacíos, confirmaciones y avisos.
- Campana de notificaciones con lectura y descarte persistidos por usuario cuando sus contratos están disponibles.
- Integración móvil para push, enlaces y OTA, sujeta a configuración nativa y servicios externos.

<a id="flujos"></a>

## 7. Flujos y reglas de negocio

### 7.1 Alta de estudiante y credenciales

**Actor:** administrador o entrenador con permiso de creación.

1. Ingresar a Gestión de Usuarios → Estudiantes y abrir el formulario de creación.
2. Completar los datos requeridos y seleccionar una categoría válida.
3. El servicio de aprovisionamiento coordina la cuenta de acceso y la ficha de estudiante.
4. Se genera una contraseña temporal y se presenta el resultado de creación y entrega.
5. Si no se confirma la entrega automática, utilizar el mecanismo manual previsto por la interfaz y un canal autorizado.
6. En el primer acceso el estudiante completa el cambio de contraseña.

**Resultado esperado:** cuenta de autenticación, datos del usuario y ficha `students` relacionados correctamente. La creación de una cuenta Auth por sí sola no garantiza que el panel del estudiante pueda cargar sus datos.

Para entrenadores y administradores, la gestión está restringida al panel administrativo. No se debe promocionar un perfil mediante cambios aislados en una sola tabla sin revisar la consistencia entre las representaciones del rol.

### 7.2 Reenvío de credenciales

El reenvío **genera una nueva contraseña temporal**; no recupera la anterior. El servicio admite correo y WhatsApp según selección y configuración.

| Resultado | Interpretación |
| --- | --- |
| `success` | La generación/cambio de contraseña se completó según el contrato |
| `deliverySuccess` | Resultado agregado de los canales de entrega seleccionados |
| `deliveryStatus: sent` | Canales seleccionados informaron aceptación de envío |
| `deliveryStatus: partial` | Solo una parte de los canales informó éxito |
| `deliveryStatus: failed` | No se confirmó el envío por los canales seleccionados |

La contraseña anterior queda invalidada aunque falle la entrega. Por ello, soporte debe comprobar el resultado de ambos procesos y evitar sucesivos reenvíos sin revisar qué credencial recibió el usuario. La aceptación del proveedor tampoco demuestra recepción en la bandeja del destinatario.

### 7.3 Suspensión, reactivación y cambio de rol

La suspensión guarda estado, motivo y, cuando corresponde, fecha límite. La reactivación revierte el estado operativo mediante el servicio del módulo. Su aplicación efectiva depende de que las políticas y handlers consulten el estado del usuario.

El cambio de rol se solicita desde la gestión administrativa. La conversión a estudiante puede necesitar crear la ficha deportiva. Después del cambio se debe volver a resolver el perfil y verificar la navegación y el acceso real del nuevo rol. Una pestaña oculta no revoca una sesión ya emitida.

### 7.4 Registro de mensualidad

**Actores:** administrador y entrenador.

1. Seleccionar al estudiante desde los resultados de búsqueda; escribir un nombre sin seleccionar su ficha no completa el identificador requerido.
2. Seleccionar un tipo de mensualidad activo.
3. Indicar una fecha de pago válida, sin adelantarla al futuro.
4. Revisar la propuesta de período. Si se habilita un período personalizado, completar inicio y fin y verificar su orden.
5. Guardar y comprobar el registro persistido, el monto y las fechas devueltas.
6. Comprobar las notificaciones como resultado independiente del guardado.

Reglas relevantes:

- `student_id`, `membership_type_id` y `fecha_pago` son datos centrales de la operación.
- El monto procede del costo del catálogo de mensualidades y las fechas/estado se derivan mediante reglas de base de datos. La vista previa del cliente no sustituye el resultado persistido.
- La UI admite solicitar fechas personalizadas; su resultado depende de los triggers y contratos instalados.
- Las observaciones del formulario se limitan a 300 caracteres; no deben asumirse como una columna disponible en todas las versiones del esquema.
- La eliminación del repositorio de pagos es lógica: informa `deleted_at` y las consultas habituales excluyen esos registros.
- El progreso gamificado y el push se sincronizan como efectos complementarios. Sus fallos no deben interpretarse automáticamente como ausencia del pago.

El sistema registra cobros y períodos. En el código revisado no se identifica un checkout bancario o una pasarela que permita al estudiante pagar en línea. Los registros y exportes tampoco deben denominarse comprobantes tributarios electrónicos sin una integración específica.

### 7.5 Asistencia y forma de pago

**Actores:** administrador y entrenador.

1. Seleccionar la fecha de trabajo y filtrar categoría o estudiante cuando sea necesario.
2. Marcar la presencia y seleccionar la forma de pago asociada cuando corresponda.
3. Revisar el listado actualizado y el estado de mensualidad mostrado.
4. Para corregir, modificar la forma de pago o retirar la marca de la fecha elegida.
5. Consultar el historial por rango de fechas y exportar el día o período disponible.

El caso de uso busca una asistencia existente por estudiante y fecha antes de registrar con forma de pago: si la encuentra, actualiza ese dato; si no, crea el registro. El marcado y desmarcado tienen operaciones de creación y eliminación. La unicidad y concurrencia también deben respaldarse en el esquema del entorno.

Las modalidades de pago de la asistencia proceden de `payment_types`; no son el mismo catálogo que los tipos de mensualidad de `membership_types`. La revisión financiera utiliza estos conceptos para interpretar ingresos diarios y mensualidades.

El módulo dispone de acciones en lote y de limpieza por fecha. Antes de una corrección masiva el operador debe comprobar fecha, categoría y alcance de la selección en la confirmación mostrada.

### 7.6 Evaluaciones físicas

Las pruebas se vinculan a la ficha `students` y se conservan por fecha. El formulario utiliza metadatos de validación centralizados en `physicalTestFieldMetadata.js`.

| Grupo | Campos técnicos principales | Interpretación |
| --- | --- | --- |
| Antropometría | `estatura`, `peso`, `envergadura_brazos_extendidos_lateral` | Medidas corporales; respetar las unidades indicadas por el formulario |
| Alcances y salto | `brazo_extend_inicial`, `brazo_extend_sin_impulso`, `brazo_extend_con_impulso` | Alcance de pie y alcances de salto utilizados para comparación |
| Salto largo | `fuerza_explosiva_salto_largo` | Distancia de la prueba |
| Fuerza | `fuerza_abdomen`, `fuerza_brazos`, `fuerza_piernas`, `elevaciones_barra` | Repeticiones de abdominales, flexiones, sentadillas y dominadas |
| Contexto | `fecha_test`, `observaciones` | Fecha de evaluación y notas |

El gestor permite crear, editar y eliminar evaluaciones, filtrar historial e identificar estudiantes sin test del mes. La vista del estudiante presenta gráficos y comparaciones personales.

Las restricciones de base de datos incluyen validación de edad y rangos definidos por los SQL correspondientes; la documentación del repositorio recoge una edad mínima de cinco años en la fecha del test. Verificar que esas restricciones estén instaladas antes de atribuirlas al entorno. Los valores exactos del formulario deben mantenerse alineados con [sus metadatos](../../src/features/physical-tests/domain/physicalTestFieldMetadata.js) y las [restricciones SQL](../../database/validate_physical_tests_constraints_2026_04_28.sql).

La creación o actualización dispara el procesamiento del progreso gamificado. Una evaluación debe conservar medidas comparables: confundir alcance absoluto con altura neta de salto altera los gráficos y las recompensas derivadas.

### 7.7 Horarios y categorías

El administrador selecciona días, categorías, hora inicial, hora final y descripción. El servicio admite crear horarios para varias combinaciones de días/categorías, editar un horario y eliminarlo. La vista pública consulta los horarios persistidos y permite organizarlos por día.

Las categorías se obtienen de un catálogo con `code`, `label`, `default_description`, `for_students`, `for_schedules` e `is_active`. Entre las categorías sembradas están iniciación, perfeccionamiento, máster y Open Gym. **Open Gym se define inicialmente para horarios y no para estudiantes**; el catálogo vigente determina las opciones finales.

El servicio de horarios contiene compatibilidad para entornos sin la columna `descripcion`. Esa tolerancia evita asumir que todas las bases tienen exactamente el mismo esquema; no sustituye una actualización controlada. La existencia de `src/config/googleCalendar.js` tampoco acredita sincronización Google Calendar: las pantallas revisadas consumen el servicio de horarios del sistema.

### 7.8 Anuncios y notificaciones

El administrador y el entrenador disponen del gestor de anuncios. Se configuran título, contenido, prioridad, audiencia, estado activo y expiración. La audiencia permite dirigir comunicados a estudiantes, entrenadores y administradores según las opciones de la pantalla.

La vista de lectura filtra anuncios según audiencia, vigencia y prioridad. Guardar el anuncio y entregar una notificación push son resultados distintos: comprobar ambos cuando se requiera entrega móvil.

La campana agrega novedades de mensualidades, anuncios y gamificación. El estado de lectura o descarte se conserva por usuario en el contrato de bandeja de entrada; no representa la eliminación del anuncio o pago de origen.

### 7.9 Reportes y revisión financiera

El centro de reportes del administrador agrupa **Operación, Finanzas, Padrón e Historial**.

| Tipo persistido | Código | Propósito |
| --- | --- | --- |
| Asistencias diarias | `attendance_daily` | Consolidación de asistencia por período solicitado |
| Resumen financiero | `financial_monthly_summary` | Resumen económico del período |
| Padrón estudiantil | `student_roster_snapshot` | Instantánea de estudiantes |

Existen dos vías de exportación:

1. **Exportación inmediata del cliente:** genera PDF, CSV o un archivo compatible con Excel según la sección. La exportación denominada Excel utiliza HTML con MIME de Excel; no debe confundirse con un libro XLSX nativo.
2. **Reporte persistido:** invoca una función Edge, registra ejecución y artefactos, guarda el PDF en Storage y permite consultar su historial y descargarlo mediante URL firmada.

El repositorio solicita URLs firmadas con duración de una hora. Un enlace expirado requiere una nueva solicitud autorizada; no se debe convertir el bucket `reports` en público para evitar ese vencimiento.

La revisión financiera muestra tendencias, ingresos por mensualidades y pagos diarios, estudiantes con vencimientos y cartera estimada. Los importes agregados dependen de fechas y reglas del módulo; una deuda estimada no sustituye una conciliación de caja. Los reportes financieros revisados formatean importes en USD, pero existen utilidades heredadas con otros formatos monetarios: comprobar la presentación del módulo concreto antes de reutilizar un helper.

### 7.10 Progreso, gamificación e identidad

El motor combina actividad registrada —asistencias, mensualidades y tests— para derivar progreso. Mantiene perfiles, eventos de recompensa, extracto de XP, monedas, logros, retos y clasificaciones.

| Capacidad | Comportamiento |
| --- | --- |
| XP y nivel | Experiencia y nivel deportivo presentados al estudiante |
| Recompensa de ingreso | RPC `claim_daily_login_reward`; requiere contrato disponible y guardia diaria de servidor |
| Rachas | Seguimiento de constancia según las reglas del motor |
| Logros y retos | Progreso, condiciones, desbloqueos y pistas de recompensas ocultas |
| Campañas | Objetivos con ventana temporal y progreso persistido |
| Etapas del atleta | Etapa actual e historial de ascensos; narrativa complementaria al nivel |
| Rutas estratégicas | Acciones sugeridas, metas y recompensas asociadas |
| Clasificaciones | Comparación por categoría y bandas configuradas |
| Monedas | Saldo y movimientos separados del XP y de los pagos reales |
| Tienda cosmética | Compra, inventario y equipamiento de marcos, fondos, insignias y efectos |
| Identidad | Apodo, título, estilo/modelo de avatar y fotografía propia |

Las compras y el equipamiento utilizan las RPC `purchase_gamification_item`, `equip_gamification_item` y `unequip_gamification_item`. Las condiciones pueden incluir nivel, racha, cantidad de logros o posición en ranking. Las restricciones deben validarse también en servidor.

Las fotografías admiten JPEG, PNG o WebP con un límite de 4 MiB en el caso de uso revisado. Los archivos se almacenan en `profile-images`; los recursos de catálogo usan `gamification-assets`. El avatar generado puede depender de la API externa de DiceBear.

El administrador gestiona Tienda, Logros y Metas. Los campos de productos físicos e instrucciones de canje deben mantenerse como borradores: la propia interfaz indica que el canje de productos físicos aún no está disponible. No existe aquí una certificación de inventario, entrega o canje de mercancía.

<a id="datos"></a>

## 8. Modelo de datos

### 8.1 Esquemas por dominio

El backend organiza tablas reales en esquemas de dominio y publica vistas de compatibilidad en `public`. Los repositorios suelen utilizar nombres como `students` o `payments` sin seleccionar el esquema físico: debe revisarse si el objeto expuesto es tabla o vista.

| Esquema | Entidades representativas | Responsabilidad |
| --- | --- | --- |
| `core` | `users`, `students` | Personas, roles operativos y ficha deportiva |
| `profiles` | `user_profiles`, `mobile_device_registrations`, `user_notification_preferences` | Perfil, dispositivos y preferencias |
| `billing` | `payments`, `membership_types`, `payment_types` | Mensualidades, cobros y modalidades |
| `training` | `attendances`, `physical_tests`, `schedules`, `training_categories` | Entrenamiento, evaluación y categorías |
| `public_content` | `announcements` | Comunicados |
| `gamification` | Perfiles, identidad, XP, monedas, catálogos, logros y progreso | Motivación e identidad deportiva |
| `reporting` | `report_definitions`, `report_runs`, `report_artifacts`, `scheduler_config` | Definiciones, ejecuciones y archivos de reportes |
| `security` | `login_attempts`, `login_blocks`, `users_password_backup` | Controles de acceso y artefactos heredados sensibles |
| `audit` | `payments_audit`, `sql_executions`, `sql_errors` | Trazabilidad técnica y de pagos |
| `public` | Vistas de compatibilidad y `user_notification_inbox_state` | Contratos expuestos y estado de bandeja |
| Administrados | `auth`, `storage` | Usuarios de autenticación y objetos del proveedor |

El inventario de referencia está en el [baseline local capturado](../../database/e2e/local-baseline.sql). Es una instantánea para pruebas; no garantiza equivalencia con cualquier destino remoto.

### 8.2 Relaciones principales

```text
auth.users
   +--> profiles.user_profiles

core.users
   +--> core.students (user_id)
           +--> billing.payments (student_id)
           +--> training.attendances (student_id)
           +--> training.physical_tests (student_id)
           +--> progreso e identidad de gamificación

billing.membership_types --> billing.payments
billing.payment_types ----> pagos / asistencias, según contrato
training.schedules -------> training.attendances (schedule_id)
training.training_categories --> estudiantes / horarios

reporting.report_definitions
   +--> reporting.report_runs
           +--> reporting.report_artifacts
                   +--> objeto PDF en Storage
```

La representación resume dependencias funcionales y no sustituye el DDL de claves foráneas. El identificador de Auth, el identificador de usuario de negocio y `students.id` deben tratarse según la relación de cada contrato; no son intercambiables por intuición.

### 8.3 Diccionario mínimo de operación

| Entidad | Campos relevantes | Consideración técnica |
| --- | --- | --- |
| Usuario de negocio | `id`, `role`, `nombre`, `apellido`, `email`, `telefono`, `first_login`, `last_login`, `suspended` | Rol y estado operativo; contiene campos PII adicionales |
| Estudiante | `id`, `user_id`, `categoria`, `fecha_ingreso`, `fecha_nacimiento`, `edad` | Ficha requerida para cargar el panel personal |
| Mensualidad | `membership_type_id`, `monto`, `fecha_pago`, `fecha_inicio`, `fecha_fin`, `estado`, `deleted_at` | Valor y período sujetos a reglas SQL; eliminación lógica |
| Asistencia | `student_id`, `fecha`, `metodo_pago_id`, `schedule_id`, `hora_entrada` | Registro de entrenamiento y modalidad asociada |
| Evaluación | `student_id`, `fecha_test`, medidas, fuerza, `observaciones` | Datos temporales de seguimiento deportivo |
| Anuncio | `title`, `content`, `priority`, `target_audience`, `is_active`, `expires_at`, `created_by` | Audiencia y vigencia determinan lectura |
| Ejecución de reporte | Código, período, estado, solicitante y trazabilidad | Diferenciar solicitud, archivo listo y error |
| Artefacto | Bucket, ruta y formato | El acceso depende del Storage y de la autorización |
| Dispositivo | Usuario, token, plataforma, estado y versiones | El token identifica un destino push; requiere gestión de sesión y permisos |

### 8.4 Fechas, estados y catálogos

Las utilidades de operación utilizan `America/Guayaquil`. Los campos SQL `date` representan días de negocio; los timestamps con zona registran instantes. Evitar convertir indiscriminadamente fechas `YYYY-MM-DD` a UTC: puede desplazar el día presentado.

Los nombres visibles de categorías se derivan de etiquetas del catálogo o de formateadores compartidos. Los estados de mensualidad mostrados se calculan a partir del período y las reglas de estado; un importe no determina por sí solo la vigencia.

Los catálogos de categorías, modalidades y tipos de mensualidad forman parte de la configuración funcional. Un catálogo ausente o inactivo puede impedir el registro aunque la tabla principal esté disponible.

<a id="servicios"></a>

## 9. Servicios e integraciones

### 9.1 Contratos internos del frontend

El patrón habitual de llamada es:

```text
Componente / hook
    -> servicio de presentación del feature
        -> caso de uso
            -> repositorio o gateway
                -> Supabase / plataforma móvil / proveedor
```

Los servicios exponen operaciones como `loadStudentPanelData`, `createTest`, `registerDailyLoginReward`, generación de reportes o aprovisionamiento. La UI debe consumir estos contratos y evitar duplicar consultas y reglas dentro de nuevos componentes.

El cliente compartido se inicializa en `src/config/supabase.js`. Existe un logger SQL opcional; su habilitación en navegador depende de exposición y permisos del esquema de auditoría y puede requerir un tratamiento de privacidad específico.

### 9.2 Inventario de funciones Edge

Los entrypoints se encuentran en `supabase/functions/<nombre>/index.ts`. El nombre es también el identificador de invocación utilizado por el cliente cuando corresponde.

| Función | Propósito | Dependencias principales |
| --- | --- | --- |
| `send-email` | Envío de comunicaciones y credenciales | Actor autorizado, contratos de correo y Resend |
| `update-user-password` | Cambio administrativo de contraseña temporal | Auth admin, permisos sobre el destinatario |
| `delete-auth-user` | Eliminación de cuenta de autenticación permitida | Actor activo, tipo de destinatario y Auth admin |
| `generate-report` | Generación manual de reporte persistido | Definiciones, permisos, datos y bucket `reports` |
| `generate-scheduled-reports` | Ejecución de reportes programables | Autorización de la llamada, programación y contratos de reportes |
| `delete-report-run` | Retirada de ejecución y artefactos de reporte | Permisos de reportes y Storage |
| `send-push` | Notificación a dispositivos | Autorización, registros móviles y FCM |
| `send-payment-reminders` | Recordatorios de vencimiento | Emisor programado, secreto compartido, pagos, dispositivos y FCM |
| `sync-mobile-device` | Alta/actualización o retirada de registro móvil | JWT del usuario y repositorio de dispositivos |

Los módulos `_core/` y `_shared/` contienen casos de uso, gateways y utilidades de respuesta, CORS, relaciones y reporting. Un cambio en un módulo compartido puede afectar funciones cuyo entrypoint no cambió.

Las funciones con privilegios deben validar el actor y el destinatario antes de operar con la clave de servicio. La configuración `verify_jwt` y el handler constituyen controles diferentes; no se deben alterar como solución improvisada a un error de acceso.

### 9.3 Correo

Los correos de credenciales y confirmaciones usan el feature `communications` y la función `send-email`, integrada con Resend. Los enlaces de recuperación usan Supabase Auth y su SMTP: son canales técnicos separados.

Para el diagnóstico, registrar función, tipo de mensaje, identificador de solicitud, resultado y hora, sin incluir contraseña temporal, JWT o clave del proveedor. Ver la [guía de credenciales y recuperación](../CREDENCIALES_RECUPERACION_2026-10-22.md).

### 9.4 WhatsApp

El repositorio contiene servicios para preparar o enviar comunicaciones por WhatsApp. La disponibilidad final depende del modo empleado y de la configuración de Meta Business. La existencia de esos adaptadores no prueba una entrega automatizada operativa.

El token de acceso no debe incorporarse al bundle público. Consultar el [inventario de producción](../produccion/VARIABLES.md) antes de habilitar el flujo. Los números institucionales publicados y los datos personales de atletas tienen tratamientos distintos.

### 9.5 Push y dispositivos

El frontend inicializa el puente móvil, escucha el registro push y envía el token mediante `sync-mobile-device`. El payload incluye plataforma, estado de notificaciones y metadatos de versión nativa, bundle y canal OTA.

La desactivación del destino se solicita al cerrar sesión cuando hay información de registro. Debe verificarse el comportamiento completo con sesiones y dispositivos reales; una respuesta HTTP de autorización no acredita persistencia del token ni entrega FCM.

Se requieren Firebase para Android, configuración nativa y permisos del dispositivo, además de las variables de servidor. Un mensaje visible en primer plano no demuestra funcionamiento en segundo plano o al tocar una notificación.

### 9.6 Storage y recursos externos

| Recurso | Uso | Control a comprobar |
| --- | --- | --- |
| `reports` | PDFs persistidos | Bucket privado, permisos, ruta del artefacto y URL firmada |
| `profile-images` | Fotografías del estudiante | Propiedad, tamaño/tipo y exposición prevista; el repositorio obtiene URL pública |
| `gamification-assets` | Recursos de catálogo | Permiso administrativo de carga y lectura prevista |
| DiceBear | Generación de avatares | Disponibilidad externa y compatibilidad visual |
| Capgo | Distribución OTA | Canal, bundle, versión nativa y compatibilidad |

Los archivos de Storage requieren respaldo de sus bytes, además de metadatos SQL. Un dump de base de datos no contiene necesariamente los objetos descargables.

<a id="seguridad"></a>

## 10. Seguridad y tratamiento de información

### 10.1 Controles y fronteras

La seguridad se distribuye entre sesión Auth, resolución del perfil, restricciones de UI, permisos SQL/RLS, contratos RPC y validaciones de funciones Edge. Para una operación sensible deben coincidir identidad, rol, estado activo y alcance sobre el registro solicitado.

El repositorio conserva documentación de auditoría y propuestas de endurecimiento. No debe afirmarse que la mera existencia de políticas garantiza protección: RLS debe estar habilitado en la tabla real y las vistas, grants y funciones deben preservar la frontera prevista. Revisar el estado del entorno con el procedimiento autorizado.

Los nombres `administrador`, `estudiante`, `entrenador` y el alias `usuario` deben mantenerse coherentes entre datos de negocio y perfil. Un dato editable por el usuario no debe convertirse en fuente suficiente de autorización de servidor.

### 10.2 PII: comportamiento real del código

`src/utils/piiCrypto.js` genera campos de cifrado y búsqueda para correo y teléfono:

| Elemento | Mecanismo observado |
| --- | --- |
| Normalización | Correo en minúsculas y teléfono normalizado |
| Cifrado | AES-GCM mediante Web Crypto |
| Derivación de clave | SHA-256 de la clave configurada |
| IV | 12 bytes aleatorios por cifrado |
| Contexto autenticado | Identificador de campo y versión |
| Serialización | `v1.<iv_base64>.<cifrado_base64>` |
| Búsqueda | HMAC-SHA-256 para coincidencia exacta y tokens parciales |
| Presentación | Campos enmascarados de correo/teléfono |

La clave histórica debe conservarse para mantener compatibilidad con cifrados e índices. Cambiarla exige inventario, migración y plan de recuperación, no solo editar `.env.local`.

> La clave actual se distribuye en el cliente CRA. Este mecanismo no acredita confidencialidad frente a quien obtiene el bundle ni implica que todos los campos originales o copias de datos estén cifrados. Documentar esa limitación forma parte del mantenimiento del sistema existente.

### 10.3 Credenciales y artefactos sensibles

Las contraseñas se gestionan mediante Auth y sus flujos autorizados. El inventario histórico incluye `security.users_password_backup`, un artefacto especialmente sensible que no debe exponerse por la API ni incorporarse a exportes de negocio.

No publicar `.env.local`, `.env.e2e`, contenidos privados de `.e2e-local/`, tokens móviles, claves de proveedor, keystores ni contraseñas temporales. La evidencia que se comparta debe limitarse a resultados sanitizados y metadatos necesarios.

### 10.4 Suspensión y sesiones emitidas

Suspender o eliminar un usuario no debe equipararse automáticamente a invalidar todo JWT previamente emitido. Las operaciones críticas necesitan las comprobaciones de sesión/estado previstas en el backend. Después de un cambio de rol o una baja, verificar tanto un nuevo login como el comportamiento de una sesión anterior en el entorno de ensayo.

### 10.5 Registro técnico

Registrar módulo, acción, fecha, código de error, resultado y versión evaluada. Evitar capturar payloads completos de Auth o comunicaciones. El diagnóstico de un fallo de correo, push o gamificación debe distinguir el dato principal guardado del efecto externo que falló.

<a id="despliegue"></a>

## 11. Construcción, despliegue y Android

### 11.1 Compilación web

```powershell
npm.cmd run build
```

Produce `build/`, que es salida generada. El script habitual fija `CI=false`; por ello, una compilación local satisfactoria no sustituye el build estricto utilizado en publicación.

`vercel.json` declara el siguiente comando de construcción y las cabeceras de la aplicación:

```text
CI=true GENERATE_SOURCEMAP=false
node node_modules/react-scripts/scripts/build.js
```

La primera línea representa variables del proceso, no un comando PowerShell completo. Para reproducir el modo estricto en una terminal compatible con el proyecto puede utilizarse `cross-env`:

```powershell
npx.cmd --no-install cross-env CI=true GENERATE_SOURCEMAP=false node node_modules/react-scripts/scripts/build.js
```

El hosting debe servir correctamente las rutas de la SPA y sus recursos. Verificar un acceso directo y una recarga en `/login`, `/admin`, `/entrenador`, `/estudiante` y `/reset-password` en el destino de ensayo; no inferir ese comportamiento únicamente del código de React Router.

### 11.2 Preparación de publicación

El proceso de producción reúne frontend, SQL, funciones Edge y, cuando corresponde, Android/OTA. Debe seguir el [runbook](../produccion/RUNBOOK.md), el [paquete Edge](../produccion/EDGE.md) y la [propuesta SQL](../../database/security/production-proposal/README.md).

La comprobación de estructura de configuración se realiza con variables ya suministradas al proceso:

```powershell
npm.cmd run check:production -- --profile frontend --structure
```

El preflight no abre automáticamente archivos `.env` ni constituye autorización de despliegue. Un código cero con `--structure` solo acredita la forma de la configuración que esa herramienta revisa; no verifica proveedores, respaldo ni disponibilidad funcional.

Antes de publicar, confirmar la versión evaluada, compatibilidad de contratos, respaldo vigente y restaurable, tratamiento de clientes anteriores, ventana y procedimiento de retorno. Los SQL propuestos no se deben aplicar como parte de una instalación web rutinaria.

### 11.3 Android con Capacitor

| Parámetro | Valor del repositorio |
| --- | --- |
| `appId` | `com.riovoley.app` |
| `appName` | `Riovoley` |
| `webDir` | `build` |
| Esquema del servidor Android | `https` |
| Proyecto nativo | `android/` |

```powershell
npm.cmd run mobile:sync
npm.cmd run mobile:android
```

`mobile:sync` compila y sincroniza los recursos web/plugins; `mobile:android` también abre Android Studio. Estos comandos no equivalen a firmar ni publicar un APK/AAB.

Para preparar una versión nativa revisar `applicationId`, `versionCode`, `versionName`, configuración Firebase, permisos y keystore/alias originales. Conservar la identidad de firma para actualizar una instalación existente. No editar `android/build/` ni recursos generados como solución permanente.

### 11.4 Actualizaciones OTA

El proyecto integra Capgo y un canal por defecto `production`; puede existir un override mediante `REACT_APP_CAPGO_DEFAULT_CHANNEL`. La versión web, la versión nativa y la versión del bundle OTA son identificadores distintos.

| Cambio | Distribución requerida |
| --- | --- |
| JS, CSS, HTML o recursos web compatibles con el contenedor existente | Puede ser elegible para OTA, tras verificar compatibilidad |
| Plugin nativo, permisos, Firebase nativo, Java/Kotlin/XML o configuración nativa | Nueva compilación y distribución APK/AAB |

Los scripts disponibles `ota:upload:production` y `ota:upload:beta` compilan y **suben** un bundle a un servicio externo. Ejecutarlos constituye una publicación, por lo que se utiliza el procedimiento de release y la autorización correspondiente.

La UI técnica OTA solo se muestra si `REACT_APP_ENABLE_OTA_DIAGNOSTICS === 'true'`, la plataforma es compatible y se está en la portada. Mantener el flag omitido o en `false` en producción no desactiva el motor OTA. La configuración nativa y el puente de plataforma también intervienen en el comportamiento de actualización.

### 11.5 Retorno

El retorno debe contemplar qué cliente, SQL, funciones y artefactos estaban activos antes del cambio. Restaurar código no restaura datos. El paquete documentado de seguridad exige retornar primero el complemento de reportes y después el SQL principal cuando corresponda a esa transición.

Usar el orden y las huellas del paquete vigente; no reutilizar una ventana o autorización caducada. Mantener la trazabilidad de las acciones y verificar los roles y procesos afectados después del retorno.

<a id="pruebas"></a>

## 12. Pruebas y criterios de aceptación

### 12.1 Herramientas disponibles

| Objetivo | Comando desde la raíz | Consideraciones |
| --- | --- | --- |
| Unitarias CRA, una ejecución | `npm test -- --watchAll=false` | Jest y Testing Library |
| Contratos del frontend | `npm run test:contracts -- --watchAll=false` | Reporting y borrado Auth |
| Contratos Edge | `npm run test:edge-contracts` | Requiere dependencias de `functions/` |
| Compatibilidad de toolchain | `npm run test:toolchain` | Incluye adaptadores locales y controles del servidor |
| Calidad de textos | `npm run check:copy-quality` | Revisión automatizada disponible en el proyecto |
| Navegadores E2E | `npm run e2e:install` | Prepara navegadores Playwright |
| Smoke público | `npm run e2e:smoke:public` | Rutas y adaptación pública |
| Smoke de roles estricto | `npm run e2e:smoke:roles:strict` | Exige credenciales E2E configuradas |
| Suite Playwright | `npm run e2e` | Revisar entorno, datos y alcance antes de ejecutar |
| Guardas del laboratorio | `npm run e2e:local:guards` | Comprueba el arnés aislado |

Los comandos describen los mecanismos de verificación disponibles. Este manual no atribuye a esta edición una ejecución de todas esas suites ni reutiliza conteos históricos como prueba del estado actual.

### 12.2 Laboratorio E2E sin datos institucionales

```powershell
npm.cmd run e2e:local:setup
npm.cmd run e2e:local:build
npm.cmd run e2e:local:smoke
```

El arnés crea servicios y cuentas ficticias, verifica roles y conserva un build propio. Su API usa loopback en el puerto `55321`, PostgreSQL `55322` y correo de prueba `55324`; el frontend del arnés usa `6100` durante la ejecución. Estos puertos difieren de los valores locales generales de `supabase/config.toml`.

Para cobertura ampliada y flujos con escritura seguir [las instrucciones del laboratorio](../../scripts/e2e/local/README.md). No ejecutar las mutaciones o semillas contra el backend institucional por cambiar una URL. Los resultados de correo/push sin proveedores deben informarse como tales.

### 12.3 Validación funcional por rol

| Caso | Resultado esperado en un entorno homologado |
| --- | --- |
| Visitante intenta abrir un panel | No obtiene contenido protegido ni datos privados |
| Administrador inicia sesión | Accede a su panel y módulos administrativos |
| Entrenador inicia sesión | Accede al panel operativo y solo a sus pestañas de usuarios permitidas |
| Estudiante inicia sesión | Consulta su ficha, pagos, asistencia, pruebas y progreso |
| Primer ingreso | Solicita cambio de contraseña y completa el flujo antes de continuar |
| Alta de estudiante | Se conserva la relación entre Auth, usuario y ficha deportiva |
| Reenvío con fallo de proveedor | Se distingue contraseña regenerada de entrega fallida |
| Registro de mensualidad | Se persisten monto y período coherentes con catálogo/reglas |
| Registro y corrección de asistencia | Se refleja en la fecha correcta y en el historial propio |
| Registro de test | Aparece en seguimiento y procesa el progreso previsto |
| Anuncio por audiencia | Lo reciben en lectura únicamente los destinatarios previstos |
| Compra cosmética | Valida requisitos/saldo, registra inventario y permite equipar |
| Reporte persistido | Hay ejecución, objeto descargable y acceso autorizado |
| Suspensión o cambio de rol | Se deniega la operación no permitida también desde una sesión anterior, conforme al contrato de seguridad |

### 12.4 Android y resultados externos

Verificar login y recuperación, navegación por rol, permiso push, recepción en primer y segundo plano, apertura al tocar la notificación, registro/retirada del dispositivo y compatibilidad OTA. Repetir los procesos afectados cuando cambia un plugin o permiso nativo.

Separar los resultados por capa: UI, HTTP, persistencia SQL, Storage físico, proveedor y dispositivo. Una respuesta de aceptación de FCM o Resend no sustituye la comprobación de entrega; una prueba HTTP de denegación no demuestra un flujo exitoso con escritura.

<a id="operacion"></a>

## 13. Operación, respaldo y mantenimiento

### 13.1 Rutina de soporte

| Frecuencia sugerida | Actividad | Evidencia mínima |
| --- | --- | --- |
| Cada jornada | Revisar login, horarios, altas del día, cobros y asistencias | Incidencias y correcciones con fecha |
| Ante aviso de entrega | Comprobar correo/push por separado del dato guardado | Resultado de la función y del proveedor, sanitizados |
| Antes de un release | Contrastar versión, contratos y configuración; verificar respaldo y retorno | Identificadores y resultado de las comprobaciones |
| Periódica | Revisar dependencias, catálogos, usuarios suspendidos y dispositivos inactivos | Registro de revisión y acciones autorizadas |
| Según política de respaldo | Generar copia protegida y probar restauración en destino aislado | Fecha, alcance, integridad y resultado de restauración |

Estas frecuencias son una propuesta operativa para el equipo, no tareas automáticas cuya ejecución esté acreditada por el sistema.

### 13.2 Respaldo y restauración

Un respaldo debe contemplar datos SQL, esquema y permisos, objetos Storage, configuración necesaria, claves de compatibilidad PII y artefactos de release custodiados por sus responsables. Los secretos deben conservarse mediante mecanismos privados, sin incluirse en documentación pública.

Procedimiento de referencia:

1. Identificar el entorno y el punto de recuperación requerido.
2. Registrar fecha, alcance, versión y responsable de la copia.
3. Proteger el respaldo y comprobar su integridad.
4. Restaurarlo en un destino aislado sin destinatarios institucionales.
5. Verificar relaciones, permisos, login, lectura de PII compatible y bytes Storage.
6. Registrar qué servicios gestionados y proveedores quedaron sin ensayar.

Ver [respaldo y restauración](../produccion/RESPALDO_Y_RESTAURACION.md). Un archivo cifrado íntegro no demuestra vigencia al momento del corte ni restauración completa del servicio gestionado. El ensayo SQL de una copia no prueba la recuperación de Auth, Storage y proveedores externos.

### 13.3 Scheduler y trabajos automáticos

La existencia de `REPORTS_SCHEDULER_SECRET` o de funciones programables no acredita un emisor activo. Confirmar identidad del emisor, calendario, zona horaria, autenticación, prevención de duplicados y resultado de cada tarea en un entorno de ensayo.

En el repositorio consta un [estado de scheduler pendiente](../produccion/SCHEDULER_PENDIENTE.md). No describir los recordatorios ni reportes programados como ejecutándose automáticamente en producción sin comprobar la configuración vigente.

### 13.4 Gestión de cambios

| Tipo de cambio | Documentación que debe revisarse |
| --- | --- |
| Nuevo módulo o comportamiento | Catálogo funcional, flujos y trazabilidad |
| Permiso o rol | Matrices, políticas/RPC/Edge y pruebas de denegación |
| Esquema o catálogo | Diccionario, migración, respaldo y compatibilidad |
| Clave o mecanismo PII | Inventario, migración y restauración de compatibilidad |
| Proveedor | Variables, contratos de entrega y diagnóstico |
| Nativo/OTA | Requisitos, versión, canal y matriz de dispositivos |

No modificar archivos generados de `build/`, `android/build/` o `node_modules/` como fuente del cambio. Conservar las evidencias históricas selladas y crear un expediente nuevo para cada nueva verificación.

<a id="incidencias"></a>

## 14. Diagnóstico de incidencias

| Síntoma | Comprobaciones en orden | Resultado a registrar |
| --- | --- | --- |
| La aplicación no inicia y muestra configuración incompleta | URL/clave pública en el entorno correcto; nombre de variable; reinicio de CRA | Nombres presentes/ausentes y versión, sin valores |
| Instalación falla por adaptadores | Node/npm del proyecto, lockfile, `.npmrc` y presencia de `vendor/` | Comando, versión y error sanitizado |
| Login falla | Correo normalizado, credencial vigente, Auth y bloqueo por intentos | Código y tiempo de reintento; sin contraseña |
| Panel indica acceso denegado | Rol resuelto, coherencia `users`/`user_profiles` y destino del login | Identificador interno y rol esperado/observado |
| Estudiante entra sin datos | Relación `students.user_id`, existencia de ficha y acceso permitido | Entidad faltante o contrato que deniega |
| Recuperación no llega o no abre | SMTP de Auth, URLs autorizadas, token/link y esquema Android | Canal y etapa que falló; sin copiar el token |
| Credenciales regeneradas sin correo | `success` frente a `deliveryStatus`; Resend y función desplegada | Contraseña cambiada sí/no y entrega confirmada sí/no |
| Pago con período inesperado | Tipo de mensualidad, fecha, vista previa y triggers instalados | Valores persistidos y regla que los produjo |
| Pago guardado sin push | Confirmar primero el pago; luego registro móvil, permisos, FCM y función | Persistencia y entrega como resultados separados |
| Error RLS, permisos o relación | Objeto real/vista, grants, política aplicable, rol y esquema del entorno | Operación y frontera que denegó; no desactivar RLS |
| Falta recompensa diaria | Existencia y permisos de `claim_daily_login_reward`, usuario y fecha | Contrato ausente, denegación o recompensa ya reclamada |
| PDF persistido no descarga | Estado de ejecución, artefacto, bucket, objeto y vigencia de URL | Diferenciar generación fallida, objeto ausente y URL expirada |
| No aparece foto o cosmético | Bucket/ruta, formato, tamaño, catálogo y reglas de desbloqueo | Recurso y validación que falló |
| Push no recibe | Permiso nativo, token activo, sesión, proyecto FCM y respuesta del proveedor | Primer/segundo plano y dispositivo probado |
| OTA no muestra panel técnico | Flag de diagnóstico, plataforma y ruta portada | Configuración observada; no confundirla con motor desactivado |
| Recordatorios no se ejecutan | Emisor, calendario, secreto, función y destinos de ensayo | Ejecución del job y entrega por separado |
| Fechas desplazadas | Diferenciar `date` de timestamp y comprobar `America/Guayaquil` | Valor almacenado y transformación de presentación |

Para escalar una incidencia adjuntar versión web/nativa/bundle según corresponda, rol, ruta o módulo, pasos reproducibles, fecha, resultado esperado y código sanitizado. Utilizar identificadores internos sin incorporar información personal innecesaria.

<a id="limites"></a>

## 15. Límites y dependencias de disponibilidad

Esta sección resume límites constatados en el código o recogidos en los procedimientos locales. No sustituye una inspección actual del servicio remoto.

| Tema | Límite o dependencia |
| --- | --- |
| Código frente a producción | Hay propuestas SQL/Edge y evidencias locales que no equivalen a una publicación coordinada |
| Matriz de permisos | La UI y los handlers tienen que homologarse; no se atribuye seguridad completa solo a un botón oculto |
| Recompensa diaria | Depende de la RPC instalada; el runbook conserva antecedentes de ausencia en el backend institucional |
| Correo y push | Requieren proveedores, identidades y entrega verificados |
| Scheduler | Un secreto configurado no prueba un emisor o tarea activa |
| PII | Cifrado e índices en cliente con limitación de exposición de clave |
| WhatsApp | Token privado en el bundle es un bloqueo de publicación documentado |
| Productos físicos | Catálogo preparado como borrador; canje no disponible |
| Pagos | Registro administrativo; sin checkout en línea identificado |
| Exportación Excel | Algunas exportaciones son HTML compatible con Excel, no XLSX |
| Moneda | Reportes financieros usan USD; revisar utilidades heredadas antes de reutilizarlas |
| Google Calendar | Configuración existente no demuestra integración activa de horarios |
| Offline | Tener assets Android empaquetados no acredita captura y sincronización de negocio sin conexión |
| iOS | El proyecto nativo incluido es Android; no se documenta una entrega iOS |
| Evidencias históricas | Sus resultados, fechas y denominadores no certifican esta edición ni se suman indiscriminadamente |

La revisión de estado operativo debe tomar como punto de partida [producción](../produccion/RUNBOOK.md), [variables](../produccion/VARIABLES.md), [Edge](../produccion/EDGE.md) y el expediente de verificación aplicable. Este manual no realiza ni autoriza cambios sobre esos servicios.

<a id="referencias"></a>

## 16. Trazabilidad y referencias del repositorio

Las referencias son relativas al paquete del manual dentro del repositorio. Al mover únicamente la carpeta del manual se conservan logo y estilos, pero los enlaces al código requieren mantener o actualizar su ubicación.

| Tema documentado | Fuente principal |
| --- | --- |
| Propósito y arranque | [README general](../../README.md) y [guía en otra PC](../../GUIA_SETUP_OTRA_PC.md) |
| Dependencias y scripts | [package.json](../../package.json), [.nvmrc](../../.nvmrc), [.npmrc](../../.npmrc), [vendor](../../vendor/README.md) |
| Identidad de panel | [Tailwind](../../tailwind.config.js), [Navbar](../../src/components/Navbar.js), [recursos originales](../../public/images/) |
| Rutas y arranque móvil | [App.js](../../src/App.js) |
| Arquitectura de features | [features](../../src/features/README.md) y [shared](../../src/shared/README.md) |
| Autenticación | [auth-session](../../src/features/auth-session/README.md) y [auth-profile](../../src/features/auth-profile/README.md) |
| Permisos de usuarios | [casos de uso](../../src/features/user-management/application/useCases/createUserManagementUseCases.js), [administrador principal](../../src/features/user-management/domain/adminPrivileges.js), [repositorio](../../src/features/user-management/infrastructure/repositories/supabaseUserManagementRepository.js) |
| Panel administrativo | [AdminPanel](../../src/features/admin-dashboard/presentation/components/AdminPanel.js) |
| Panel entrenador | [TrainerPanel](../../src/features/trainer-dashboard/presentation/components/TrainerPanel.js) |
| Panel estudiante | [StudentPanel](../../src/features/student-dashboard/presentation/components/StudentPanel.js) |
| Usuarios y credenciales | [user-management](../../src/features/user-management/README.md), [user-provisioning](../../src/features/user-provisioning/README.md) |
| Mensualidades | [payments](../../src/features/payments/README.md) y [reglas de pagos](../../src/features/payments/application/useCases/createPaymentsUseCases.js) |
| Asistencia | [attendance](../../src/features/attendance/README.md) |
| Horarios | [schedules](../../src/features/schedules/README.md) y [catálogo de categorías](../../database/add_training_categories_catalog_schema_2026_05_21.sql) |
| Evaluación física | [physical-tests](../../src/features/physical-tests/README.md) y [metadatos de campos](../../src/features/physical-tests/domain/physicalTestFieldMetadata.js) |
| Anuncios y notificaciones | [announcements](../../src/features/announcements/README.md), [notifications](../../src/features/notifications/README.md) y [casos de notificación](../../src/features/notifications/application/useCases/createNotificationsUseCases.js) |
| Perfil y contraseña | [account-admin](../../src/features/account-admin/README.md) y [ResetPassword](../../src/features/auth-session/presentation/components/ResetPassword.js) |
| Reportes | [ReportsCenter](../../src/features/admin-dashboard/presentation/components/ReportsCenter.js), [repositorio reporting](../../src/features/reporting/infrastructure/repositories/supabaseReportingRepository.js) |
| Finanzas | [FinancialReview](../../src/features/admin-dashboard/presentation/components/FinancialReview.js) |
| Gamificación | [README del feature](../../src/features/gamification/README.md), [panel administrativo](../../src/features/gamification/presentation/components/GamificationAdminPanel.js), [repositorio](../../src/features/gamification/infrastructure/repositories/supabaseGamificationRepository.js) |
| Cliente de datos | [supabase.js](../../src/config/supabase.js) |
| Esquema de referencia | [baseline local](../../database/e2e/local-baseline.sql), [baseline canónico](../../database/BASELINE_SCHEMA_CANONICAL_RUNBOOK_2026_04_27.md) |
| PII real | [piiCrypto.js](../../src/utils/piiCrypto.js) e [inventario de variables](../produccion/VARIABLES.md) |
| Edge | [fuentes](../../supabase/functions/) y [paquete de publicación](../produccion/EDGE.md) |
| Registro móvil | [repositorio de dispositivos](../../src/shared/infrastructure/mobile/supabaseMobileDeviceRepository.js) y [puente de plataforma](../../src/shared/platform/) |
| Android y hosting | [Capacitor](../../capacitor.config.json), [Android](../../android/), [Vercel](../../vercel.json) |
| E2E | [configuración Playwright](../../playwright.config.js), [pruebas](../../tests/), [laboratorio local](../../scripts/e2e/local/README.md) |
| Publicación y recuperación | [runbook](../produccion/RUNBOOK.md), [respaldo/restauración](../produccion/RESPALDO_Y_RESTAURACION.md), [scheduler](../produccion/SCHEDULER_PENDIENTE.md) |
| Seguridad SQL propuesta | [paquete revisable](../../database/security/production-proposal/README.md) |

Los documentos históricos, en particular los inventarios de base de datos con fechas de corte anteriores, sirven como antecedente. Ante discrepancias, contrastar el código evaluado y el catálogo real del entorno siguiendo el procedimiento de revisión, sin asumir que una descripción antigua sigue vigente.

<a id="glosario"></a>

## 17. Glosario e historial documental

| Término | Significado en este sistema |
| --- | --- |
| Atleta / estudiante | Persona con ficha deportiva asociada a un usuario |
| SPA | Aplicación web que navega y actualiza vistas mediante JavaScript |
| CRA | Create React App; toolchain basado en `react-scripts` |
| Clean Lite | Organización práctica por feature con presentación, aplicación, dominio e infraestructura |
| Supabase Auth | Servicio de identidad, sesiones y recuperación |
| JWT | Token de acceso firmado con vigencia determinada |
| RLS | Políticas de acceso a filas de PostgreSQL |
| RPC | Función SQL invocada mediante la API de Supabase |
| Edge Function | Función de servidor utilizada para operaciones e integraciones |
| PII | Información personal identificable, como correo y teléfono |
| Storage | Almacenamiento de archivos organizado por buckets |
| URL firmada | Enlace temporal de descarga autorizado |
| XP | Experiencia virtual del progreso del estudiante |
| Monedas | Saldo virtual cosmético separado del XP y de los cobros reales |
| OTA | Actualización remota del bundle web de la aplicación móvil |
| FCM | Firebase Cloud Messaging, proveedor de notificaciones push |
| Scheduler | Emisor que ejecuta tareas según un calendario |
| Smoke | Comprobación breve de funciones esenciales |
| Preflight | Verificación previa de requisitos; no equivale a publicar |
| Retorno | Recuperación coordinada de versiones/contratos anteriores |

### 17.1 Historial del documento

| Edición | Fecha | Cambio | Base |
| --- | --- | --- | --- |
| 1.0 | 2026-11-09 | Elaboración del manual técnico, matrices de rol, inventario funcional, operación y presentación para PDF | Repositorio, commit base `0bc835b` |

### 17.2 Actualización y revisión

En cada edición registrar la versión del producto evaluada y las fuentes modificadas. Antes de distribuir el PDF, revisar índice, logotipos, tablas, enlaces y fecha de corte, además de contrastar que los permisos y límites reflejen el release documentado.

<div class="marca-cierre">
  <img src="recursos/logo-riovoley-nav.webp" alt="RioVoley">
  <span>RIOVOLEY · Manual técnico · MT-RV-001 · Edición 1.0</span>
</div>
