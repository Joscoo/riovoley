# gamification

Feature clean-lite para fases 1 a 4 de gamificacion basada internamente en Octalysis.

## Responsabilidades
- Calcular progreso motivacional derivado de tests fisicos, asistencias y pagos.
- Persistir perfiles, eventos, logros, progreso de retos y snapshots de leaderboard.
- Exponer una API desacoplada para panel del estudiante y sincronizacion post-test/post-asistencia/post-pago.
- Derivar multiples leaderboards por categoria desde actividad real del estudiante.

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
- `gamificationService.listCategoryLeaderboards({ category, ageBand, limit })`
- `gamificationService.loadXpLedger({ studentId, limit })`
- `gamificationService.loadCurrencyWallet({ studentId, limit })`
- `gamificationService.registerDailyLoginReward({ userId })`
- `gamificationService.updateStudentIdentity({ userId, nickname, selectedTitleSlug })`
- `gamificationService.updateStudentIdentity({ userId, nickname, selectedTitleSlug, avatarStyle })`
- `gamificationService.purchaseCosmeticItem({ userId, itemSlug })`
- `gamificationService.equipCosmeticItem({ userId, itemSlug })`
- `gamificationService.listStudentAchievements({ studentId })`
- `gamificationService.listActiveChallenges({ studentId })`

## Nuevas capacidades de fase 1 estructurada
- Extracto detallado de XP derivado desde `gamification_xp_ledger`.
- Recompensa minima por ingreso diario con guardia de una vez por dia.
- Racha de asistencia en dias habiles visibles dentro del panel del estudiante.
- Preparacion del feature para seguir creciendo sin mezclar `XP` con futuras monedas cosmeticas.

## Fase de identidad social
- Apodos editables por el propio estudiante con validacion moderada.
- Titulos desbloqueables y equipables sin exponer reglas internas del framework.
- Leaderboards enriquecidos con `apodo + titulo` sin alterar el ownership de los datos base.

## Fase de economia base
- Moneda blanda separada del XP con `wallet` y `ledger` propios.
- Recompensas de monedas derivadas desde actividad verificada, logros y subidas de nivel.
- Panel del estudiante con saldo, resumen y extracto de monedas listo para futuras compras cosmeticas.

## Fase de tienda cosmetica inicial
- Catalogo inicial de marcos, fondos, insignias y efectos.
- Inventario propio del estudiante y equipamiento por slot.
- Compras seguras via funciones SQL, sin abrir escritura directa del wallet al cliente.

## Fase de avatar configurable
- Avatar generado con DiceBear HTTP API usando semilla deterministica por estudiante.
- Seleccion persistida de estilo de avatar dentro de la identidad competitiva.
- Render del avatar en panel del estudiante y leaderboards, reutilizando apodo, estilo y cosmeticos equipados.
