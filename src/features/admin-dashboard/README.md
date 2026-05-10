# admin-dashboard

Feature clean-lite para el dashboard administrativo.

## Responsabilidades
- Consolidar KPIs del panel admin (atletas, pagos, asistencias, categorias, actividad reciente).
- Exponer una API de presentacion unica para el componente legacy del dashboard.
- Centralizar acceso a Supabase en el repositorio del feature.

## Capas
- `presentation/createAdminDashboardService.js`: orquesta carga completa del dashboard.
- `domain/adminDashboardError.js`: error funcional del feature.
- `infrastructure/repositories/supabaseAdminDashboardRepository.js`: consultas SQL/REST contra Supabase.

## Contrato publico
- `adminDashboardService.loadDashboard()`
  - retorna: `{ stats, categoriesStats, recentActivity }`
  - encapsula todas las consultas necesarias para renderizar el dashboard.
