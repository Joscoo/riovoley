# Refuerzo Estructurado De Core Drivers En Gamification

Fecha: 2026-06-11

## Objetivo

Cerrar las brechas más claras en la cobertura de Octalysis dentro del sistema actual de gamificación, priorizando:

- `Epic Meaning & Calling`
- `Empowerment of Creativity & Feedback`
- `Scarcity & Impatience`
- `Unpredictability & Curiosity`

El enfoque será progresivo y alineado entre aplicación y base de datos, evitando una migración monolítica.

## Estado actual

La base actual ya cubre razonablemente:

- `Development & Accomplishment`
- `Ownership & Possession`
- `Social Influence & Relatedness`
- `Loss & Avoidance`

Con soporte ya implementado en:

- XP y niveles
- logros
- retos derivados
- rachas
- leaderboard por categorías
- identidad visual
- tienda, moneda y cosméticos

Las brechas restantes no se resuelven con más contadores, sino con una capa más fuerte de:

- narrativa
- rutas estratégicas
- urgencia temporal
- sorpresa controlada

## Principios

1. Mantener `XP` separado de `moneda`.
2. Priorizar progresión verificable sobre acciones triviales.
3. Implementar primero lo que puede derivarse con datos existentes.
4. Introducir SQL solo cuando aporte persistencia o administración real.
5. No castigar narrativamente con retrocesos de etapa.

## Refuerzo estructurado

### 1. Etapas del atleta

Se introduce una capa narrativa de progreso con 6 etapas:

1. `semilla`
2. `en_marcha`
3. `constante`
4. `competidor`
5. `impacto`
6. `referente`

Estas etapas no reemplazan nivel o XP. Funcionan como interpretación narrativa del progreso.

Cada etapa debe exponer:

- nombre
- descripción
- mensaje de progreso
- criterios de entrada
- pista hacia la siguiente

La promoción usará una mezcla de:

- `min_level` obligatorio
- `requires_leaderboard_presence` cuando aplique
- `evidence_score` derivado de:
  - tests
  - asistencias
  - pagos
  - logros

La historia de etapas guardará solo `ascensos`.

### 2. Rutas estratégicas

El sistema debe sugerir:

- `1 ruta principal`
- `2 rutas alternativas`

Cada ruta debe mostrar una cadena exacta y medible:

- qué hacer
- cuánto falta
- qué recompensa inmediata obtiene
- qué desbloqueo posterior acerca
- qué mejora deportiva produce

Las rutas deben equilibrar:

- beneficio deportivo real
- recompensa gamificada visible

No deben presentarse como órdenes únicas, sino como opciones estratégicas.

### 3. Urgencia temporal

El sistema debe hacer visibles oportunidades limitadas mediante:

- retos semanales
- retos mensuales
- microeventos por categoría
- recompensas temporales

La UI debe mostrar:

- tiempo restante
- progreso
- recompensa
- costo de dejar pasar la oportunidad

### 4. Sorpresa y curiosidad

La capa de descubrimiento debe apoyarse en:

- logros ocultos con pista
- recompensas sorpresa
- cadenas sorpresa
- desbloqueos por combinación

La sorpresa debe ser real pero limitada. No debe convertirse en una lotería constante.

## SQL progresivo por etapas

### Etapa 1: sin SQL nuevo

Se implementa solo con lógica y UI:

- etapas derivadas
- rutas estratégicas
- más retos derivados
- primeros retos competitivos
- feedback más explícito

### Etapa 2: narrativa persistida

Migración propuesta:

- `gamification.athlete_stages_catalog`
- `gamification.student_current_stage`
- `gamification.student_stage_history`

#### `athlete_stages_catalog`

Propósito:

- definir etapas
- ajustar criterios sin reescribir el motor

Columnas:

- `slug text primary key`
- `name text not null`
- `description text not null`
- `progress_hint_template text not null`
- `sort_order integer not null`
- `min_level integer not null default 1`
- `min_tests integer not null default 0`
- `min_attendances integer not null default 0`
- `min_payments integer not null default 0`
- `min_achievements integer not null default 0`
- `requires_leaderboard_presence boolean not null default false`
- `is_active boolean not null default true`
- `created_at timestamptz not null default timezone('utc', now())`

#### `student_current_stage`

Propósito:

- snapshot rápido del estado actual

Columnas:

- `student_id uuid primary key references core.students(id) on delete cascade`
- `current_stage_slug text not null references gamification.athlete_stages_catalog(slug)`
- `progress_hint text not null`
- `metadata jsonb not null default '{}'::jsonb`
- `updated_at timestamptz not null default timezone('utc', now())`

La columna `metadata` debe incluir desglose de evidencia:

- tests
- asistencias
- pagos
- logros
- presencia en leaderboard

#### `student_stage_history`

Propósito:

- guardar historial de ascensos

Columnas:

- `id uuid primary key default gen_random_uuid()`
- `student_id uuid not null references core.students(id) on delete cascade`
- `stage_slug text not null references gamification.athlete_stages_catalog(slug)`
- `awarded_at timestamptz not null default timezone('utc', now())`
- `awarded_reason text not null`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default timezone('utc', now())`

Restricción recomendada:

- `unique(student_id, stage_slug)`

Índice recomendado:

- `student_stage_history_student_id_awarded_at_idx`

### Seed inicial de etapas

Se cargarán estas 6 filas:

#### `semilla`

- `sort_order = 10`
- `min_level = 1`
- `min_tests = 0`
- `min_attendances = 0`
- `min_payments = 0`
- `min_achievements = 0`
- `requires_leaderboard_presence = false`

#### `en_marcha`

- `sort_order = 20`
- `min_level = 1`
- `min_tests = 1`
- `min_attendances = 4`
- `min_payments = 1`
- `min_achievements = 0`
- `requires_leaderboard_presence = false`

#### `constante`

- `sort_order = 30`
- `min_level = 2`
- `min_tests = 2`
- `min_attendances = 8`
- `min_payments = 1`
- `min_achievements = 1`
- `requires_leaderboard_presence = false`

#### `competidor`

- `sort_order = 40`
- `min_level = 3`
- `min_tests = 3`
- `min_attendances = 12`
- `min_payments = 2`
- `min_achievements = 3`
- `requires_leaderboard_presence = true`

#### `impacto`

- `sort_order = 50`
- `min_level = 4`
- `min_tests = 4`
- `min_attendances = 18`
- `min_payments = 3`
- `min_achievements = 5`
- `requires_leaderboard_presence = true`

#### `referente`

- `sort_order = 60`
- `min_level = 5`
- `min_tests = 5`
- `min_attendances = 24`
- `min_payments = 4`
- `min_achievements = 8`
- `requires_leaderboard_presence = true`

## Regla de promoción

La promoción no debe depender de un checklist rígido completo.

Regla:

1. cumplir `min_level`
2. cumplir `requires_leaderboard_presence` si aplica
3. alcanzar un `evidence_score` suficiente

El `evidence_score` se calcula en aplicación, no en SQL.

Razón:

- permite ajustar pesos sin migraciones
- evita ascensos bloqueados por una sola variable
- mantiene claridad y flexibilidad

## Sincronización

Cada refresh real de gamificación debe:

1. calcular la etapa derivada
2. leer `student_current_stage`
3. si la etapa no cambia:
   - actualizar `progress_hint`
   - actualizar `metadata`
   - actualizar `updated_at`
4. si la etapa cambia:
   - actualizar `student_current_stage`
   - insertar fila en `student_stage_history`

Eventos que pueden disparar esta sincronización:

- tests físicos
- asistencias
- pagos
- refresh fuerte de gamificación
- cualquier evento que altere nivel o evidencia real

## Retos ampliados

El sistema ya no debe depender de un catálogo mínimo de retos. Se debe ampliar la derivación con:

- volumen de tests
- doble medición mensual
- mejora alta de salto
- mejora alta de fuerza
- cadena hábil de asistencia
- presencia acumulada
- pagos por ciclos
- meta mensual élite
- combo mensual completo

Además, se deben derivar retos competitivos:

- top 3 general
- podio de asistencia
- caza del líder en salto
- liderazgo en pagos registrados

## UI objetivo

### Identidad

- `Coleccion` y `Tienda` deben mostrarse en tabs separados
- `Coleccion` muestra preview, equipamiento e inventario
- `Tienda` muestra wallet, extracto y catálogo

### Metas

`Logros` debe mostrar:

- logros obtenidos
- logros secretos
- logros por desbloquear

`Retos` debe mostrar:

- retos derivados básicos
- retos competitivos
- retos futuros

## Qué no se incluye aún

Quedan fuera de esta fase:

- recompensas automáticas por etapa
- campañas administrables en SQL
- sorpresa persistida por cadena
- editor admin de etapas o eventos

Eso corresponde a etapas posteriores del plan progresivo.

## Riesgos

1. Inflar el número de retos sin priorización clara.
2. Volver confusa la narrativa si etapa, nivel, logros y retos no se diferencian visualmente.
3. Persistir demasiado pronto eventos temporales que todavía no están validados en UX.

## Mitigaciones

1. Mantener paginación y agrupación por tab.
2. Separar visualmente `nivel`, `etapa`, `logros` y `retos`.
3. Persistir primero solo narrativa estructural (`Etapa 2`) y dejar temporadas/sorpresas avanzadas para después.

## Éxito esperado

La fase se considera buena si:

- el estudiante entiende qué etapa tiene y por qué
- ve varias rutas estratégicas con recompensas exactas
- tiene más retos visibles sin saturación
- la competencia ya empuja objetivos concretos
- la cobertura de core drivers deja de depender solo de XP, rachas y cosméticos
