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
- [Capacidades](#capacidades-principales--core-capabilities)
- [Quick Start](#quick-start-local)
- [Scripts](#scripts)
- [Estructura del Proyecto](#estructura-rapida--quick-project-map)
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
React SPA (UI por rol)
  |-- Admin modules
  |-- Trainer modules
  |-- Student modules
  |
  | supabase-js
  v
Supabase (PostgreSQL + Auth + RLS)
  |-- Domain schemas (core, training, billing, profiles, ...)
  |-- Row Level Security by role
  |-- Edge Functions (email workflows)
  |
  +--> External integrations (WhatsApp Business, Google Calendar)
```

| Layer | Stack | Purpose |
|---|---|---|
| Frontend | React 19, React Router 7, Tailwind CSS 3 | SPA y experiencia por rol |
| Data/BaaS | Supabase (PostgreSQL, Auth, RLS) | Persistencia, autenticacion y permisos |
| Analytics/UI | Recharts, React Icons | Visualizacion y UI operativa |
| Docs/Exports | jsPDF, jspdf-autotable | Reportes PDF |
| Testing | Playwright | E2E multi flujo |

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
npm run build        # build produccion
npm run e2e          # E2E Playwright
npm run e2e:ui       # E2E en modo UI
npm run e2e:install  # instala browsers de Playwright
```

## Estructura Rapida | Quick Project Map

```text
src/
  components/        UI por rol (admin/trainer/student)
  services/          Integraciones y logica de datos
  utils/             Utilidades (pagos, crypto, PDF, fechas)
database/            SQL scripts y migraciones
functions/           Supabase Edge Functions
tests/               E2E tests (Playwright)
```

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