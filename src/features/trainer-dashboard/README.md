# trainer-dashboard

Feature clean-lite para el dashboard del entrenador.

## Responsabilidades
- Resolver metricas operativas del entrenador sin acceso directo a `supabase` desde UI.
- Mantener reglas de fecha y periodo en capa de application.

## Capas
- `application/useCases/createTrainerDashboardUseCases.js`: composicion de metricas del dashboard.
- `presentation/createTrainerDashboardService.js`: fachada consumida por UI.
- `domain/trainerDashboardError.js`: error funcional del feature.
- `infrastructure/repositories/supabaseTrainerDashboardRepository.js`: consultas a estudiantes, asistencias, tests y pagos.

## Contrato publico
- `trainerDashboardService.loadStats()`
  - retorna `{ totalAtletas, asistenciasHoy, testsPendientes, pagosDelMes }`
