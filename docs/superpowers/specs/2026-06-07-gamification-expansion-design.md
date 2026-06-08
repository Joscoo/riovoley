# Gamification Expansion Design

## Objetivo

Expandir `src/features/gamification` para convertirlo en un motor estructurado de progresion, competencia, identidad y economia ligera, manteniendo clean-lite por feature y usando Octalysis solo como marco interno de producto.

## Alcance

Esta expansion cubre:

- fuentes adicionales de XP verificable
- racha de dias habiles de lunes a viernes
- extracto detallado de XP
- catalogo mucho mas amplio de logros y objetivos
- pre-retos del siguiente ciclo
- competencia mas visible con lideres y record holders
- apodos
- titulos coleccionables elegibles
- moneda blanda
- avatar ilustrado configurable con herramienta/libreria existente
- tienda cosmetica y efectos de perfil

Queda fuera de esta iteracion inicial:

- recompensas con impacto competitivo
- ventajas pagadas
- personalizacion visual diseñada manualmente desde cero
- prescripcion medica, nutricional o de entrenamiento clinico

## Principios

- `XP = progreso`
- `Moneda = personalizacion`
- solo se recompensa principalmente actividad verificable
- el login diario puede dar XP minimo y moneda minima, pero una sola vez al dia
- la competencia debe estar equilibrada con superacion personal
- todo debe ser auditable mediante ledgers
- la UI del estudiante no debe mencionar Octalysis

## Arquitectura

### Ownership por feature

- `physical-tests` sigue siendo dueño del dato fisico
- `attendance` sigue siendo dueño del dato de asistencia
- `payments` sigue siendo dueño del dato financiero
- `auth-session` sigue siendo dueño del dato de sesion/login
- `gamification` es dueño de toda proyeccion motivacional derivada

### Submodulos internos del feature `gamification`

- `xp-engine`
  - calcula XP por fuente
  - genera movimientos del ledger
- `streak-engine`
  - calcula racha mensual
  - calcula racha de dias habiles seguidos
  - calcula rachas combinadas
- `achievement-engine`
  - resuelve logros permanentes, competitivos, secretos y combinados
- `challenge-engine`
  - resuelve retos mensuales, semanales, pre-retos y campañas especiales
- `competition-engine`
  - genera leaderboards por categoria, medicion, asistencia, pagos y records
- `recommendation-engine`
  - genera recomendaciones personalizadas segun medidas, retos y competencia
- `identity-engine`
  - maneja apodos, titulos visibles y configuracion publica de perfil
- `economy-engine`
  - maneja moneda, catalogo de cosmeticos, inventario y equipamiento

### Use cases nuevos o ampliados

- `loadStudentGamification`
- `refreshStudentProgress`
- `registerDailyLoginReward`
- `loadXpLedger`
- `loadInventory`
- `equipTitle`
- `equipAvatarItem`
- `updateNickname`
- `loadCategoryLeaderboards`
- `loadGamificationAdminOverview`

## Modelo de datos

### Tablas nuevas recomendadas

- `gamification_xp_ledger`
  - un movimiento por fuente de XP
  - campos base: `student_id`, `source_type`, `source_ref`, `xp_delta`, `label`, `description`, `occurred_at`
- `gamification_currency_wallets`
  - saldo consolidado
- `gamification_currency_ledger`
  - movimientos de moneda
- `gamification_titles_catalog`
- `gamification_student_titles`
- `gamification_avatar_items_catalog`
- `gamification_student_avatar_items`
- `gamification_student_equipped_items`
- `gamification_student_identity`
  - `nickname`, `active_title_slug`, configuracion publica del avatar
- `gamification_login_rewards`
  - control diario de recompensa por ingreso
- `gamification_seasonal_campaigns`
- `gamification_student_streaks`
  - racha mensual
  - racha de dias habiles
  - racha de actividad combinada

### Tablas existentes a reutilizar

- `gamification_profiles`
- `gamification_reward_events`
- `gamification_student_achievements`
- `gamification_achievement_catalog`
- `gamification_student_challenge_progress`
- `gamification_challenges_catalog`
- `gamification_leaderboard_snapshots`

## Reglas de producto

### Fuentes de XP

- test fisico registrado
- mejora de marca vs linea base
- asistencia registrada
- pago registrado
- cobertura activa del periodo
- login diario minimo una vez al dia
- logro desbloqueado
- reto completado
- pre-reto completado
- record alcanzado o recuperado

### Rachas

- racha de dias habiles consecutivos `lunes a viernes`, permitiendo continuidad entre semanas
- racha mensual de actividad
- racha de pagos al dia
- racha combinada de presencia, progreso y retorno

### Objetivos permanentes

- hitos por cada medicion fisica
- hitos de mejora frente a si mismo
- hitos de asistencia total
- hitos de racha habil
- hitos de login acumulado
- hitos de mensualidades
- hitos competitivos `top 10`, `top 3`, `top 1`
- hitos por sostener o recuperar un record
- hitos secretos y combinados

### Objetivos temporales

- retos mensuales
- mini-retos semanales
- pre-retos del siguiente ciclo
- campañas o temporadas especiales activables

### Identidad

- apodos libres con moderacion
- validacion de longitud, caracteres y palabras restringidas
- cambio con limite temporal
- titulos coleccionables elegibles
- el estudiante elige cual mostrar

### Economia

- moneda blanda separada del XP
- recompensas mixtas:
  - mayor peso en logros, niveles y retos
  - menor peso en login y acciones frecuentes
- la tienda solo vende cosmeticos y efectos de perfil
- no hay ventajas competitivas comprables

## UI esperada

### Estudiante

- panel de progreso con XP, nivel, rachas y objetivos
- extracto detallado de XP
- logros desbloqueados, bloqueados y secretos
- retos actuales y pre-retos del siguiente ciclo
- leaderboards por categoria y tipo de medicion
- record holder claro
- apodo y titulo visibles
- wallet, inventario y tienda
- avatar configurable

### Entrenador/Admin

- vista de competencia por categoria
- lideres por medicion
- estudiantes que estan rompiendo records
- estudiantes con caida de racha
- campañas activas y cumplimiento

## Cobertura de core drivers

- `Epic Meaning & Calling`
  - ruta deportiva, niveles narrativos, titulos y hitos
- `Development & Accomplishment`
  - XP, ledger, niveles, records, objetivos y barras claras
- `Empowerment of Creativity & Feedback`
  - recomendaciones, multiples rutas, avatar, identidad y feedback inmediato
- `Ownership & Possession`
  - wallet, inventario, titulos, avatar y progreso acumulado
- `Social Influence & Relatedness`
  - leaderboards, records, apodos, titulos y rivales a superar
- `Scarcity & Impatience`
  - retos mensuales, pre-retos, campañas y recompensas temporales
- `Unpredictability & Curiosity`
  - logros secretos, recompensas sorpresa y desbloqueos raros
- `Loss & Avoidance`
  - rachas, alertas de perdida de continuidad y vigencia de cobertura

## Fases de implementacion

### Fase 1

- `xp ledger`
- `registerDailyLoginReward`
- racha de dias habiles
- expansion grande de logros y retos
- UI visible para extracto de XP y nuevas rachas

### Fase 2

- apodos
- titulos coleccionables
- visibilidad de identidad en leaderboards

### Fase 3

- moneda blanda
- wallet + currency ledger
- primeras recompensas y catalogo base

### Fase 4

- avatar ilustrado configurable con libreria existente
- inventario y equipamiento

### Fase 5

- temporadas/campañas
- rotacion de tienda
- recompensas raras y records de temporada

## Reglas antiabuso

- login con recompensa maxima de una vez por dia
- XP de login siempre marginal
- no premiar abrir pantallas
- no premiar escrituras duplicadas o eliminadas
- ledgers auditable para XP y moneda
- nickname moderado y con cambios limitados
- leaderboards solo con datos verificables

## Testing

### Unit tests

- `xp-engine`
- `streak-engine`
- `achievement-engine`
- `challenge-engine`
- `competition-engine`
- `identity-engine`
- `economy-engine`

### Integration tests

- login diario registra recompensa una vez por dia
- asistencia actualiza XP y racha habil
- pago actualiza progreso y logros
- completar retos del mes habilita pre-retos
- equipar titulo/apodo actualiza visibilidad en leaderboard

### Product evidence

- estudiantes con al menos una accion gamificada semanal
- uso del extracto XP
- completitud de retos mensuales
- mantenimiento de racha habil
- vistas e interacciones con leaderboards
- uso de apodo, titulo y avatar
- conversion de moneda a inventario equipado

## Riesgos

- sobrecarga de UI por exceso de objetivos
- farmeo trivial del login
- complejidad prematura del avatar
- demasiada competencia para estudiantes rezagados
- crecimiento desordenado del motor si no se modulariza

## Mitigaciones

- mostrar primero las 3 metas mas relevantes
- mantener XP de login minimo
- separar `XP` de `Moneda`
- equilibrar objetivos competitivos y de superacion personal
- implementar por fases con cobertura documental y tests
