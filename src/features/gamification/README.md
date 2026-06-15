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

## Fase de renderer cosmetico competitivo
- El renderer visual del portrait ya depende de metadata estructurada por categoria y rareza, en lugar de apoyarse principalmente en slugs puntuales.
- `common` y `rare` se mantienen sobrios y se diferencian sobre todo por acabado, color y composicion.
- `epic` y `legendary` concentran overlays, silueta, capas y presencia competitiva mas fuerte.
- El catalogo se expande de forma pareja entre `frame`, `background`, `badge` y `effect`, para que cada slot tenga piezas realmente deseables.
- Cada item proyecta `variantLabel` para explicar mejor su identidad visual dentro de la tienda.

## Fase de etapas del atleta
- La gamificacion ahora interpreta el progreso tambien como una narrativa persistida del atleta, no solo como nivel y XP.
- El agregado del estudiante expone `identity.currentStage` con `currentStageSlug`, `currentStageName`, `currentStageDescription`, `progressHint` y `metadata`.
- El mismo agregado expone `identity.stageHistory` como historial de ascensos, sin registrar retrocesos.
- La sincronizacion se hace dentro del motor al recalcular progreso, reutilizando perfil, logros y presencia competitiva.

## Fase de rutas estrategicas
- El agregado ahora expone `strategicRoutes` como una ruta principal y hasta dos alternativas.
- Cada ruta muestra:
  - accion exacta
  - progreso actual contra objetivo
  - recompensas inmediatas
  - cadena corta de impacto posterior
  - beneficio deportivo real
- `recommendations` sigue existiendo como compatibilidad ligera, pero ahora se deriva desde `strategicRoutes`.

## Fase de campañas temporales
- El agregado ahora expone `campaigns` como ventanas temporales activas separadas de los retos permanentes.
- Cada campaña muestra progreso actual, objetivo, recompensa visible, hint y dias restantes.
- El progreso se sincroniza en `gamification.student_campaign_progress` durante carga y refresh, usando el catalogo activo de `gamification.campaigns_catalog`.

## Fase de sorpresa persistida
- El agregado ahora expone `discoveredHiddenRewards` y `hiddenRewardHints`.
- `discoveredHiddenRewards` representa descubrimientos sorpresa ya activados y persistidos.
- `hiddenRewardHints` muestra pistas y progreso parcial de recompensas ocultas que todavia no se han revelado.
- La sincronizacion se hace en `gamification.student_hidden_rewards`, tomando combinaciones reales del estudiante y evitando azar artificial por ahora.

## SQL asociado a campañas
- `gamification_phase23_campaigns_2026_06_11.sql`
  - crea `gamification.campaigns_catalog`
  - crea `gamification.student_campaign_progress`
  - siembra campañas semanales, mensuales y flash iniciales
  - expone vistas publicas compatibles para lectura desde Supabase/PostgREST

## SQL asociado a sorpresa persistida
- `gamification_phase24_hidden_rewards_2026_06_11.sql`
  - crea `gamification.hidden_rewards_catalog`
  - crea `gamification.student_hidden_rewards`
  - siembra recompensas ocultas iniciales basadas en constancia, salto y combinaciones reales
  - expone vistas publicas compatibles para lectura desde Supabase/PostgREST

## SQL asociado a etapas del atleta
- `gamification_phase22_athlete_stages_2026_06_11.sql`
  - crea `gamification.athlete_stages_catalog`
  - crea `gamification.student_current_stage`
  - crea `gamification.student_stage_history`
  - siembra las etapas iniciales `semilla`, `en_marcha`, `constante`, `competidor`, `impacto`, `referente`
  - expone vistas publicas compatibles para lectura desde Supabase/PostgREST
