# trainer-dashboard

Feature clean-lite para el dashboard del entrenador.

## Responsabilidades
- Resolver metricas operativas del entrenador sin acceso directo a `supabase` desde UI.
- Mantener reglas de fecha/periodo en capa de presentacion del feature.

## Capas
- `presentation/createTrainerDashboardService.js`: compone metricas del dashboard.
- `domain/trainerDashboardError.js`: error funcional del feature.
- `infrastructure/repositories/supabaseTrainerDashboardRepository.js`: consultas a estudiantes, asistencias, tests y pagos.

## Contrato publico
- `trainerDashboardService.loadStats()`
  - retorna: `{ totalAtletas, asistenciasHoy, testsFisicosMes, pagosMes, loading }`

