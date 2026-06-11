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
- `gamificationService.updateStudentIdentity({ userId, nickname, selectedTitleSlug, avatarStyle, profileImageMode, profilePhotoFile, removeProfilePhoto })`
- `gamificationService.purchaseCosmeticItem({ userId, itemSlug })`
- `gamificationService.equipCosmeticItem({ userId, itemSlug })`
- `gamificationService.unequipCosmeticItem({ userId, category })`
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

## Fase de imagen de perfil y preview cosmetico
- El avatar seleccionado o la foto subida por el estudiante pasan a ser su imagen principal de perfil.
- Los marcos se aplican como borde visible del portraito, y fondos, insignias y efectos se pueden previsualizar antes de equipar.
- El mismo portraito se reutiliza en el panel del estudiante, el sidebar y los leaderboards para reforzar identidad y competencia.

## Fase de modelos de avatar y variedad cosmetica
- La identidad del avatar ya no depende solo de `avatar_style`; ahora tambien usa `avatar_model_slug`.
- El agregado del estudiante expone `avatarModelOptions.available` y `avatarModelOptions.blocked`.
- Los logros secretos se devuelven en `secretAchievements`, separados de `lockedAchievements`.
- El renderer de portraito aplica cambios visibles tambien para slugs nuevos del catalogo, reduciendo la necesidad de hardcodear cada item antes de publicarlo.

## Fase de cosmeticos con reglas de desbloqueo
- El catalogo cosmetico ya distingue entre compra directa, nivel, racha, cantidad de logros y prestigio por leaderboard.
- Cada item proyecta `isUnlocked`, `isLocked`, `unlockLabel` y `unlockHint` para explicar por que ya se puede comprar o que falta para conseguirlo.
- La compra se valida dentro del agregado antes de llamar a la funcion SQL, evitando adquisiciones de cosmeticos todavia bloqueados.
