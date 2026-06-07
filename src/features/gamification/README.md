# gamification

Feature clean-lite para fases 1 a 4 de gamificacion basada internamente en Octalysis.

## Responsabilidades
- Calcular progreso motivacional derivado de tests fisicos, asistencias y pagos.
- Persistir perfiles, eventos, logros, progreso de retos y snapshots de leaderboard.
- Exponer una API desacoplada para panel del estudiante y sincronizacion post-test/post-asistencia/post-pago.

## Capas
- `application/useCases/createGamificationUseCases.js`: reglas de negocio y proyecciones derivadas.
- `presentation/createGamificationService.js`: fachada consumida por otras features y UI.
- `domain/gamificationError.js`: error funcional del feature.
- `infrastructure/repositories/supabaseGamificationRepository.js`: acceso a vistas publicas de Supabase.

## Contrato publico
- `gamificationService.loadStudentGamification({ userId })`
- `gamificationService.loadStudentGamificationByStudentId({ studentId, studentData, physicalTests })`
- `gamificationService.refreshStudentProgress({ studentId })`
- `gamificationService.processPhysicalTestRecorded({ studentId, testId })`
- `gamificationService.getCategoryLeaderboard({ category, ageBand, limit })`
- `gamificationService.listStudentAchievements({ studentId })`
- `gamificationService.listActiveChallenges({ studentId })`
