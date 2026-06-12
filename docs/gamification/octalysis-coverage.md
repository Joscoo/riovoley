# Octalysis Coverage Map

Este documento deja trazabilidad de como se estan cubriendo los 8 core drivers en Riovoley, con su justificacion y evidencia verificable.

## Cobertura

### 1. Epic Meaning & Calling
- Implementacion:
  - Ruta visual de progreso del estudiante.
  - Logro `Primer paso`.
  - Titulos llamativos y hitos narrativos visibles.
  - Etapa del atleta persistida con snapshot actual e historial de ascensos.
- Justificacion:
  - Da sentido al inicio del recorrido y presenta el avance como parte de una historia deportiva.
- Evidencia:
  - [StudentGamificationPanel.js](D:/Riovoley/riovoley/src/features/gamification/presentation/components/StudentGamificationPanel.js:1)
  - [createGamificationUseCases.js](D:/Riovoley/riovoley/src/features/gamification/application/useCases/createGamificationUseCases.js:1)
  - [gamification_phase22_athlete_stages_2026_06_11.sql](D:/Riovoley/riovoley/database/gamification_phase22_athlete_stages_2026_06_11.sql:1)

### 2. Development & Accomplishment
- Implementacion:
  - XP, niveles, barra de progreso al siguiente nivel, logros por salto, por cantidad de tests y por historial de pagos.
  - Ledger detallado de XP definido para explicar cada fuente del progreso.
  - Catalogo ampliado de logros permanentes y records por medicion.
  - Extracto de XP visible implementado dentro del panel del estudiante.
  - Retos competitivos y etapas del atleta reforzando progresion acumulativa.
- Justificacion:
  - El estudiante ve progreso cuantificable y metas concretas de mejora.
- Evidencia:
  - [StudentGamificationPanel.js](D:/Riovoley/riovoley/src/features/gamification/presentation/components/StudentGamificationPanel.js:1)
  - [createGamificationUseCases.test.js](D:/Riovoley/riovoley/src/features/gamification/application/useCases/createGamificationUseCases.test.js:1)
  - [2026-06-07-gamification-expansion-design.md](D:/Riovoley/riovoley/docs/superpowers/specs/2026-06-07-gamification-expansion-design.md:1)

### 3. Empowerment of Creativity & Feedback
- Implementacion:
  - Retos activos con progreso en tiempo real.
  - Insights de salto, fuerza, tests y actividad del mes.
  - Recomendaciones derivadas de las medidas mas recientes del estudiante.
  - Avatar configurable, titulos elegibles y multiples rutas de progreso planteadas para la siguiente fase.
  - Desglose persistido de evidencia para explicar la etapa narrativa actual.
  - Rutas estrategicas con accion exacta, progreso medible, recompensa inmediata y cadena corta de impacto posterior.
- Justificacion:
  - El sistema devuelve feedback inmediato y permite interpretar donde esta mejorando.
- Evidencia:
  - [StudentGamificationPanel.js](D:/Riovoley/riovoley/src/features/gamification/presentation/components/StudentGamificationPanel.js:1)
  - [StudentPhysicalTests.js](D:/Riovoley/riovoley/src/features/student-dashboard/presentation/components/StudentPhysicalTests.js:1)
  - [octalysis-architecture.md](D:/Riovoley/riovoley/docs/gamification/octalysis-architecture.md:1)

### 4. Ownership & Possession
- Implementacion:
  - Perfil persistido de progreso.
  - Coleccion de logros desbloqueados y logros bloqueados.
  - Cobertura de mensualidad reflejada dentro del avance personal.
  - Identidad competitiva persistida con apodo y titulo equipado.
  - Wallet de monedas blandas y extracto de monedas ya visibles.
  - Tienda cosmetica inicial, inventario y equipamiento por slot ya implementados.
  - El catalogo cosmetico ya muestra piezas de compra directa y piezas de prestigio/progreso con reglas visibles de desbloqueo.
  - Estilo de avatar persistido y visible en la identidad del estudiante.
  - Economia de moneda blanda, inventario, tienda y equipamiento definidos para la expansion.
- Justificacion:
  - El estudiante siente que esta construyendo algo propio y acumulativo.
- Evidencia:
  - [SupabaseGamificationRepository.js](D:/Riovoley/riovoley/src/features/gamification/infrastructure/repositories/supabaseGamificationRepository.js:1)
  - [StudentGamificationPanel.js](D:/Riovoley/riovoley/src/features/gamification/presentation/components/StudentGamificationPanel.js:1)
  - [2026-06-07-gamification-expansion-design.md](D:/Riovoley/riovoley/docs/superpowers/specs/2026-06-07-gamification-expansion-design.md:1)

### 5. Social Influence & Relatedness
- Implementacion:
  - Ranking por categoria con nombres visibles.
  - Multiples leaderboards por progreso general, mediciones fisicas, asistencias y mensualidades.
  - Logros y retos conectados a asistencia y constancia.
  - Apodos moderados y titulos visibles ya implementados para reforzar identidad social.
  - Avatar visible ya implementado en panel y rankings para reforzar reconocimiento inmediato.
  - Retos competitivos conectados a top 3 general, asistencia, salto y pagos.
- Justificacion:
  - Se incorpora comparacion social directa y permite competir desde fortalezas distintas.
- Evidencia:
  - [createGamificationUseCases.js](D:/Riovoley/riovoley/src/features/gamification/application/useCases/createGamificationUseCases.js:1)
  - [StudentGamificationPanel.js](D:/Riovoley/riovoley/src/features/gamification/presentation/components/StudentGamificationPanel.js:1)
  - [octalysis-architecture.md](D:/Riovoley/riovoley/docs/gamification/octalysis-architecture.md:1)

### 6. Scarcity & Impatience
- Implementacion:
  - Retos mensuales de test y asistencia.
  - Retos mensuales ampliados como `monthly_double_check_in`, `attendance_monthly_elite` y `monthly_combo_ready`.
  - Logros por sostener pagos durante varios meses.
  - Logros de ventana temporal mensual.
  - Vista previa de retos del siguiente ciclo para preparacion anticipada.
  - Campañas temporales persistidas con progreso propio, recompensa visible y dias restantes.
  - Pre-retos preparatorios y campañas especiales definidos para mantener urgencia futura.
- Justificacion:
  - Empuja accion dentro de una ventana limitada sin necesidad de castigo.
- Evidencia:
  - [createGamificationUseCases.js](D:/Riovoley/riovoley/src/features/gamification/application/useCases/createGamificationUseCases.js:1)
  - [2026-06-07-gamification-expansion-design.md](D:/Riovoley/riovoley/docs/superpowers/specs/2026-06-07-gamification-expansion-design.md:1)

### 7. Unpredictability & Curiosity
- Implementacion:
  - Logro oculto `Logro misterioso` hasta que se cumpla una combinacion de asistencia y progreso fisico.
  - Logros secretos separados visualmente de los bloqueados visibles y mostrados con pista.
  - Recompensas ocultas persistidas con descubrimiento real y pistas separadas del sistema de logros.
  - Titulos secretos, cosmeticos raros y recompensas sorpresa definidos para la siguiente expansion.
- Justificacion:
  - Mantiene curiosidad y exploracion sin revelar todas las reglas desde el inicio.
- Evidencia:
  - [StudentGamificationPanel.js](D:/Riovoley/riovoley/src/features/gamification/presentation/components/StudentGamificationPanel.js:1)
  - [createGamificationUseCases.js](D:/Riovoley/riovoley/src/features/gamification/application/useCases/createGamificationUseCases.js:1)
  - [2026-06-07-gamification-expansion-design.md](D:/Riovoley/riovoley/docs/superpowers/specs/2026-06-07-gamification-expansion-design.md:1)

### 8. Loss & Avoidance
- Implementacion:
  - Racha activa.
  - Logro por constancia de 3 meses.
  - Logro y reto por mantener mensualidad vigente.
  - Racha de dias habiles y alertas de continuidad definidas para la siguiente expansion.
  - Racha de asistencia en dias habiles ya implementada en la primera base estructurada.
- Justificacion:
  - Refuerza no perder continuidad sin introducir penalizacion toxica.
- Evidencia:
  - [createGamificationUseCases.js](D:/Riovoley/riovoley/src/features/gamification/application/useCases/createGamificationUseCases.js:1)
  - [StudentGamificationPanel.js](D:/Riovoley/riovoley/src/features/gamification/presentation/components/StudentGamificationPanel.js:1)
  - [octalysis-architecture.md](D:/Riovoley/riovoley/docs/gamification/octalysis-architecture.md:1)

## Pruebas y verificacion

### Pruebas automatizadas
- `src/features/gamification/application/useCases/createGamificationUseCases.test.js`
  - valida proyeccion derivada, ranking de respaldo y persistencia
- `src/features/gamification/presentation/createGamificationService.test.js`
  - valida delegacion del servicio publico
- `src/features/gamification/application/useCases/createGamificationUseCases.test.js`
  - valida actualizacion de identidad, titulos equipados y render competitivo derivado
- `src/features/gamification/application/useCases/createGamificationFoundationUseCases.test.js`
  - valida wallet y extracto de monedas
- `src/features/gamification/application/useCases/createGamificationUseCases.test.js`
  - valida compra y equipamiento cosmetico dentro del agregado
- `src/features/attendance/application/useCases/createAttendanceUseCases.test.js`
  - valida que cambios de asistencia disparen recalculo gamificado
- `src/features/payments/application/useCases/createPaymentsUseCases.test.js`
  - valida que cambios de pago disparen recalculo gamificado

### Verificacion tecnica
- `npm run build`
  - confirma que la experiencia responsive en Tailwind compile correctamente

### Herramientas internas usadas
- Motor de proyeccion del feature `gamification`
- Vistas publicas de Supabase para lectura
- Tests unitarios con Jest
- Tailwind CSS para la experiencia responsive
- Ledger persistido `gamification_xp_ledger`
- Guardia diaria `gamification_login_rewards`
- Wallet persistida `gamification_currency_wallets`
- Ledger persistido `gamification_currency_ledger`
- Catalogo `gamification_cosmetic_items_catalog`
- Inventario `gamification_student_cosmetic_items`
- Equipamiento `gamification_student_cosmetic_equipment`
- Bucket publico `profile-images` para foto de perfil
- RPC `unequip_gamification_item` para desequipar slots sin exponer escrituras amplias
- Componente visual unificado `IdentityPortrait` para panel, sidebar y leaderboards

## Cobertura planificada para la expansion estructurada

### Mecanicas nuevas previstas
- `xp ledger` detallado por evento
- recompensa minima por login diario
- racha de dias habiles seguidos
- catalogo amplio de objetivos permanentes y temporales
- apodos moderados
- titulos coleccionables elegibles
- wallet de moneda blanda
- avatar ilustrado configurable
- tienda cosmetica y efectos de perfil
- foto de perfil opcional como imagen principal
- previsualizacion real de marcos, fondos, insignias y efectos
- leaderboards enriquecidos con portraito, titulo y cosmeticos visibles
- modelos de avatar visibles y bloqueados por estilo
- logros secretos con pista y logros bloqueados con progreso
- renderer de portraito que hace visibles marcos, fondos, insignias y efectos incluso para slugs nuevos del catalogo
- etapas del atleta persistidas con snapshot actual e historial de ascensos
- retos competitivos derivados desde leaderboards reales
- reglas de desbloqueo cosmetico por nivel, racha, logros y prestigio

### Evidencia documental
- [2026-06-07-gamification-expansion-design.md](D:/Riovoley/riovoley/docs/superpowers/specs/2026-06-07-gamification-expansion-design.md:1)
- [octalysis-architecture.md](D:/Riovoley/riovoley/docs/gamification/octalysis-architecture.md:1)

### Criterio de cumplimiento por core driver
- cada core driver debe quedar respaldado por:
  - una mecanica visible
  - una evidencia tecnica
  - una prueba automatizada
  - una metrica de producto
