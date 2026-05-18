# RioVoley

<p align="center">
  <strong>Plataforma de gestion para clubes de voley y gimnasia</strong><br/>
  Management platform for volleyball and gym clubs
</p>

<p align="center">
  Operacion diaria, control de pagos, seguimiento deportivo y seguridad de datos en una sola aplicacion.
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="Playwright" src="https://img.shields.io/badge/Testing-Playwright-2EAD33?logo=playwright&logoColor=white" />
  <img alt="Build" src="https://img.shields.io/badge/Build-React%20Scripts%205-09B3AF" />
</p>

## Quick Navigation

- [Que es RioVoley](#que-es-riovoley--what-is-riovoley)
- [Arquitectura y Stack](#arquitectura-y-stack--architecture-and-tech-stack)
- [Tecnologias Verificadas](#tecnologias-verificadas--verified-technologies)
- [Capacidades](#capacidades-principales--core-capabilities)
- [Quick Start](#quick-start-local)
- [Scripts](#scripts)
- [Estructura del Proyecto](#estructura-rapida--quick-project-map)
- [Estado Migracion](#estado-migracion-clean-lite--clean-lite-migration-status)
- [Seguridad](#seguridad-y-datos--security-and-data)
- [Documentacion](#documentacion-relacionada--related-docs)

## Que es RioVoley | What Is RioVoley

**ES:** RioVoley es un sistema web para administrar el ciclo completo de un club: usuarios por rol, atletas, asistencias, pagos, horarios, pruebas fisicas, notificaciones y seguridad de datos sensibles.

**EN:** RioVoley is a web platform to run the full club lifecycle: role-based users, athlete records, attendance, payments, schedules, physical tests, notifications, and sensitive-data security.

### Valor por rol | Role-Based Value

- **Administracion / Admin:** control operativo, pagos, asistencia, gestion de usuarios.
- **Entrenadores / Coaches:** seguimiento deportivo, horarios, pruebas fisicas.
- **Atletas / Students:** visibilidad de progreso y datos personales del entrenamiento.

## Arquitectura y Stack | Architecture and Tech Stack

```text
React SPA (Clean Lite por feature)
  |-- src/features/<feature>/
  |    |-- presentation/
  |    |-- application/
  |    |-- domain/
  |    +-- infrastructure/
  |
  +-- src/shared/ (ui, config, helpers y gateways transversales)

Supabase (PostgreSQL + Auth + RLS + Edge Functions)
  |-- esquemas por dominio
  |-- politicas RLS por rol
  +-- integraciones externas (WhatsApp Business, Google Calendar)
```

| Layer | Stack | Purpose |
|---|---|---|
| Frontend | React 19, React Router 7, Tailwind CSS 3 | SPA y experiencia por rol |
| Data/BaaS | Supabase (PostgreSQL, Auth, RLS) | Persistencia, autenticacion y permisos |
| Analytics/UI | Recharts, React Icons | Visualizacion y UI operativa |
| Docs/Exports | jsPDF, jspdf-autotable | Reportes PDF |
| Testing | Playwright | E2E multi flujo |

## Tecnologias Verificadas | Verified Technologies

| Tecnologia | Uso en el proyecto | Justificacion (por que se usa) | Evidencia |
|---|---|---|---|
| React 19.1.1 | SPA con modulos por rol | Ecosistema estable para UI compleja y componentes reutilizables | [package.json](package.json) |
| React Router 7.7.0 | Navegacion y rutas por rol | Enrutamiento declarativo para flujos por permisos | [package.json](package.json) |
| Tailwind CSS 3.4.13 | Estilos y UI operativa | Velocidad de desarrollo y consistencia visual | [package.json](package.json) |
| PostCSS 8.5.9 | Procesado de CSS | Pipeline moderno para CSS utilitario | [package.json](package.json) |
| Autoprefixer 10.5.0 | Compatibilidad CSS | Soporte cross-browser sin friccion | [package.json](package.json) |
| React Scripts 5.0.1 (CRA) | Build y dev server | Tooling listo para SPA sin configurar bundler | [package.json](package.json) |
| Supabase + Postgres 17 | Data/BaaS y seguridad | Backend administrado con permisos por rol y DB confiable | [supabase/config.toml](supabase/config.toml) |
| Supabase JS Client 2.74.0 | Acceso a datos desde frontend | SDK oficial para queries, auth y realtime | [package.json](package.json) |
| Supabase Edge Functions (Deno) | Funciones serverless | Automatiza flujos sensibles cerca del backend | [supabase/functions/delete-auth-user/index.ts](supabase/functions/delete-auth-user/index.ts) |
| Node.js 22 + Express 5.1.0 | Backend de funciones | API flexible para integraciones y automatizaciones | [functions/package.json](functions/package.json) |
| TypeScript 5.8.3 (backend) | Tipado en funciones | Reduce errores en integraciones y modelos | [functions/package.json](functions/package.json) |
| Genkit 1.15.5 | Orquestacion de flujos (funciones) | Estandariza pipelines y automatizaciones | [functions/package.json](functions/package.json) |
| Playwright 1.53.0 | Testing E2E | Cobertura real de flujos por rol | [package.json](package.json) |
| Testing Library + Jest DOM | Tests de UI | Pruebas orientadas a usuario y aserciones claras | [package.json](package.json) |
| Recharts 3.3.0 | Dashboards y graficos | Visualizaciones rapidas para operacion | [package.json](package.json) |
| React Icons 5.5.0 | Iconografia | Consistencia visual y velocidad de UI | [package.json](package.json) |
| jsPDF 4.2.0 + jspdf-autotable 5.0.7 | Reportes PDF | Exportacion de datos para admin y auditoria | [package.json](package.json) |

## Capacidades Principales | Core Capabilities

| Capability | Status in Repo |
|---|---|
| Gestion de atletas | Implementado en modulos admin |
| Registro de asistencias | Implementado |
| Pagos y vencimientos | Implementado |
| Pruebas fisicas | Implementado |
| Dashboards por rol | Implementado |
| Notificaciones WhatsApp/Email | Integracion disponible (requiere setup) |
| Cifrado de PII (email/telefono) | Implementado |

## Quick Start (Local)

### 1) Requisitos

- Node.js 18+
- npm
- Git

### 2) Instalar

```bash
git clone <URL_DEL_REPOSITORIO>
cd riovoley
npm install
```

### 3) Configurar entorno

```bash
# PowerShell
Copy-Item .env.example .env.local
```

Variables obligatorias para iniciar:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

Variables opcionales (integraciones):

- `REACT_APP_PII_ENCRYPTION_KEY`
- `REACT_APP_WHATSAPP_ACCESS_TOKEN`
- `REACT_APP_WHATSAPP_PHONE_NUMBER_ID`
- `REACT_APP_WHATSAPP_BUSINESS_ACCOUNT_ID`
- `REACT_APP_CLUB_ADMIN_PHONE`
- `REACT_APP_CLUB_COACH_PHONE`
- `REACT_APP_CLUB_EMERGENCY_PHONE`

### 4) Ejecutar

```bash
npm start
```

Aplicacion local: `http://localhost:3000`

## Scripts

```bash
npm start            # desarrollo
npm test             # tests unitarios/react-scripts
npm run test:contracts # contratos edge function (reporting/auth-admin)
npm run build        # build produccion
npm run e2e          # E2E Playwright
npm run e2e:smoke:roles # smoke de paneles por rol (requiere E2E_* en entorno)
npm run e2e:smoke:roles:strict # valida E2E_* y falla si falta alguna credencial
npm run e2e:smoke:public # smoke responsive de rutas publicas
npm run e2e:ui       # E2E en modo UI
npm run e2e:install  # instala browsers de Playwright
```

### E2E por roles (ultimo paso de cierre)

1. Copiar `.env.e2e.example` a `.env.e2e` y completar credenciales:

- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`
- `E2E_TRAINER_EMAIL`
- `E2E_TRAINER_PASSWORD`
- `E2E_STUDENT_EMAIL`
- `E2E_STUDENT_PASSWORD`

2. Exportar variables al entorno de la terminal (PowerShell):

```powershell
Get-Content .env.e2e | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $name, $value = $_ -split '=', 2
  Set-Item -Path ("env:" + $name.Trim()) -Value $value.Trim()
}
```

3. Ejecutar:

```bash
npm run e2e:smoke:roles:strict
```

## Estructura Rapida | Quick Project Map

```text
src/
  features/          Modulos Clean Lite por feature
  components/        Solo vistas publicas del sitio (landing)
  shared/            UI, helpers, config y gateways compartidos
  utils/             Utilidades (pagos, crypto, PDF, fechas)
database/            SQL scripts y migraciones
functions/           Supabase Edge Functions
tests/               E2E tests (Playwright)
```

## Estado Migracion Clean Lite | Clean Lite Migration Status

- Migrado a `src/features/*`:
  - `announcements`, `athletes`, `attendance`, `payments`, `physical-tests`, `schedules`, `trainer-management`, `user-management`
  - dashboards: `admin-dashboard`, `trainer-dashboard`, `student-dashboard`
  - auth/profile: `auth-session`, `auth-profile`, `account-admin (ProfileSettings/UsuariosManager)`
  - `notifications (NotificacionesPagos)`
- En curso:
  - corrida E2E final por roles autenticados (admin/trainer/student) con credenciales de entorno

## Seguridad y Datos | Security and Data

- Cifrado en cliente para PII (email/telefono).
- Control de acceso por autenticacion y RLS en Supabase.
- Secretos locales en `.env.local` (no versionar credenciales reales).

Documentacion tecnica:

- [DOCUMENTACION_ENCRIPTACION_PII.md](DOCUMENTACION_ENCRIPTACION_PII.md)
- [README_DATABASE.md](README_DATABASE.md)

## Documentacion Relacionada | Related Docs

- [GUIA_SETUP_OTRA_PC.md](GUIA_SETUP_OTRA_PC.md) - onboarding en otra maquina
- [GUIA_WHATSAPP_PASO_A_PASO.md](GUIA_WHATSAPP_PASO_A_PASO.md) - configuracion WhatsApp
- [EDGE_FUNCTION_SETUP.md](EDGE_FUNCTION_SETUP.md) - setup de funciones
- [README_DATABASE.md](README_DATABASE.md) - esquema y consideraciones DB
- [DOCUMENTACION_ENCRIPTACION_PII.md](DOCUMENTACION_ENCRIPTACION_PII.md) - estrategia de cifrado

## Alcance Actual | Current Scope

Este repositorio implementa la plataforma web y su base tecnica.

- Integraciones externas requieren credenciales y configuracion.
- El comportamiento final depende de la configuracion de entorno y Supabase.

## Contribuciones

1. Crear rama de trabajo.
2. Implementar cambios.
3. Probar localmente (`npm start`, y si aplica `npm run e2e`).
4. Abrir Pull Request.

---

Proximo upgrade recomendado para destacar aun mas en GitHub: agregar capturas del panel admin y un GIF corto del flujo principal (login -> dashboard -> pagos).
