# Gamification Core Drivers Structured Reinforcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist athlete stages, strengthen narrative progression, and expand strategic/competitive challenge projection so the remaining Octalysis core drivers are covered with real product behavior.

**Architecture:** Keep stage scoring and challenge derivation in application code, while persisting the athlete stage catalog, current stage snapshot, and ascent-only stage history in PostgreSQL. Extend the gamification projection to sync the stage layer during normal refresh flows, then surface stages, unlocked/locked/secret achievements, and competitive routes cleanly in the student panel.

**Tech Stack:** React (CRA), Supabase/PostgreSQL, feature-based application use cases, Tailwind, Jest/react-scripts tests.

---

## File Structure

- Modify: `database/create_public_compatibility_views.sql`
  - Add public compatibility views and grants for the new athlete-stage tables.
- Create: `database/gamification_phase22_athlete_stages_2026_06_11.sql`
  - Create stage tables, RLS, indexes, and seed the six athlete stages.
- Modify: `src/features/gamification/infrastructure/repositories/supabaseGamificationRepository.js`
  - Read/write current stage, stage history, and stage catalog through Supabase.
- Modify: `src/features/gamification/application/useCases/createGamificationUseCases.js`
  - Calculate athlete stages, sync current/history, expand challenge projection, and return stage data to UI.
- Modify: `src/features/gamification/presentation/createGamificationService.js`
  - Pass through updated gamification aggregate with stage information.
- Modify: `src/features/gamification/presentation/components/StudentGamificationPanel.js`
  - Show current stage, next stage hint, achievement sections, and challenge-rich goals UI.
- Modify: `src/features/gamification/application/useCases/createGamificationUseCases.test.js`
  - Cover stage sync and expanded challenge projection.
- Modify: `src/features/gamification/presentation/createGamificationService.test.js`
  - Verify service shape stays consistent with stage data.
- Modify: `src/features/gamification/README.md`
  - Document athlete stages and new reinforcement layer.
- Modify: `docs/gamification/octalysis-decisions.md`
  - Record the decisions behind stages, strategic routes, and competitive challenges.
- Modify: `docs/gamification/octalysis-coverage.md`
  - Update coverage notes for the missing core drivers.
- Modify: `docs/gamification/octalysis-architecture.md`
  - Add the new persistence and synchronization flow.

### Task 1: Create Athlete Stage SQL

**Files:**
- Create: `database/gamification_phase22_athlete_stages_2026_06_11.sql`
- Modify: `database/create_public_compatibility_views.sql`
- Test: manual SQL execution in Supabase SQL editor after code review

- [ ] **Step 1: Write the migration file with the stage tables and seed data**

```sql
begin;

create table if not exists gamification.athlete_stages_catalog (
  slug text primary key,
  name text not null,
  description text not null,
  progress_hint_template text not null,
  sort_order integer not null,
  min_level integer not null default 1,
  min_tests integer not null default 0,
  min_attendances integer not null default 0,
  min_payments integer not null default 0,
  min_achievements integer not null default 0,
  requires_leaderboard_presence boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists gamification.student_current_stage (
  student_id uuid primary key references core.students(id) on delete cascade,
  current_stage_slug text not null references gamification.athlete_stages_catalog(slug),
  progress_hint text not null,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists gamification.student_stage_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references core.students(id) on delete cascade,
  stage_slug text not null references gamification.athlete_stages_catalog(slug),
  awarded_at timestamptz not null default timezone('utc', now()),
  awarded_reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (student_id, stage_slug)
);

create index if not exists gamification_student_stage_history_student_id_awarded_at_idx
  on gamification.student_stage_history(student_id, awarded_at desc);

insert into gamification.athlete_stages_catalog (
  slug, name, description, progress_hint_template, sort_order,
  min_level, min_tests, min_attendances, min_payments, min_achievements,
  requires_leaderboard_presence
) values
  ('semilla', 'Semilla', 'Estas construyendo tu base inicial.', 'Completa tus primeras acciones verificadas para dejar de estar en blanco.', 10, 1, 0, 0, 0, 0, false),
  ('en_marcha', 'En Marcha', 'Ya tienes actividad real en el sistema.', 'Te falta consolidar constancia para alcanzar la siguiente etapa.', 20, 1, 1, 4, 1, 0, false),
  ('constante', 'Constante', 'Tu progreso ya no es aislado.', 'Sostener asistencia, tests y logros te acercara a competir visiblemente.', 30, 2, 2, 8, 1, 1, false),
  ('competidor', 'Competidor', 'Ya entraste en la pelea visible.', 'Sube tu impacto con mas logros y presencia competitiva.', 40, 3, 3, 12, 2, 3, true),
  ('impacto', 'Impacto', 'Tu presencia ya influye en el entorno.', 'Te falta consolidar una base fuerte para convertirte en referente.', 50, 4, 4, 18, 3, 5, true),
  ('referente', 'Referente', 'Tu progreso ya sirve de referencia para otros.', 'Sigue defendiendo tu presencia para sostener tu lugar.', 60, 5, 5, 24, 4, 8, true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  progress_hint_template = excluded.progress_hint_template,
  sort_order = excluded.sort_order,
  min_level = excluded.min_level,
  min_tests = excluded.min_tests,
  min_attendances = excluded.min_attendances,
  min_payments = excluded.min_payments,
  min_achievements = excluded.min_achievements,
  requires_leaderboard_presence = excluded.requires_leaderboard_presence,
  is_active = true;
```

- [ ] **Step 2: Add RLS, grants, and compatibility views in the migration**

```sql
alter table gamification.athlete_stages_catalog enable row level security;
alter table gamification.student_current_stage enable row level security;
alter table gamification.student_stage_history enable row level security;

create policy gamification_athlete_stages_catalog_read
on gamification.athlete_stages_catalog
for select
to authenticated
using (true);

create policy gamification_athlete_stages_catalog_admin_write
on gamification.athlete_stages_catalog
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy gamification_student_current_stage_read
on gamification.student_current_stage
for select
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_current_stage.student_id
      and s.user_id = auth.uid()
  )
);

create policy gamification_student_stage_history_read
on gamification.student_stage_history
for select
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_stage_history.student_id
      and s.user_id = auth.uid()
  )
);

grant select on gamification.athlete_stages_catalog to authenticated;
grant select, insert, update on gamification.student_current_stage to authenticated;
grant select, insert on gamification.student_stage_history to authenticated;

create or replace view public.gamification_athlete_stages_catalog
with (security_invoker = true) as
select * from gamification.athlete_stages_catalog;

create or replace view public.gamification_student_current_stage
with (security_invoker = true) as
select * from gamification.student_current_stage;

create or replace view public.gamification_student_stage_history
with (security_invoker = true) as
select * from gamification.student_stage_history;

grant select on
  public.gamification_athlete_stages_catalog,
  public.gamification_student_current_stage,
  public.gamification_student_stage_history
to authenticated;

commit;
```

- [ ] **Step 3: Mirror the new public views in the compatibility script**

```sql
create or replace view public.gamification_athlete_stages_catalog
with (security_invoker = true) as
select * from gamification.athlete_stages_catalog;

create or replace view public.gamification_student_current_stage
with (security_invoker = true) as
select * from gamification.student_current_stage;

create or replace view public.gamification_student_stage_history
with (security_invoker = true) as
select * from gamification.student_stage_history;
```

- [ ] **Step 4: Update grants in the compatibility script**

```sql
grant select on
  public.gamification_athlete_stages_catalog,
  public.gamification_student_current_stage,
  public.gamification_student_stage_history
to authenticated;

grant select on
  gamification.athlete_stages_catalog,
  gamification.student_current_stage,
  gamification.student_stage_history
to authenticated;
```

- [ ] **Step 5: Run a targeted verification query after applying the SQL**

Run:

```sql
select slug, sort_order
from gamification.athlete_stages_catalog
order by sort_order;
```

Expected:

- 6 rows
- ordered from `semilla` to `referente`

- [ ] **Step 6: Commit**

```bash
git add database/gamification_phase22_athlete_stages_2026_06_11.sql database/create_public_compatibility_views.sql
git commit -m "feat: add athlete stage persistence"
```

### Task 2: Add Repository Support For Athlete Stages

**Files:**
- Modify: `src/features/gamification/infrastructure/repositories/supabaseGamificationRepository.js`
- Test: `src/features/gamification/presentation/createGamificationService.test.js`

- [ ] **Step 1: Write the failing repository/service expectation**

```js
it('normaliza current stage e historial de etapas desde el repositorio', async () => {
  const repository = createSupabaseGamificationRepository(mockClient);
  mockClient.from.mockReturnValueOnce(buildQueryResult({
    data: { current_stage_slug: 'constante', progress_hint: 'Te falta ranking.', metadata: { achievements: 3 } },
  }));

  const result = await repository.getCurrentStage('student-1');

  expect(result).toMatchObject({
    currentStageSlug: 'constante',
    progressHint: 'Te falta ranking.',
    metadata: { achievements: 3 },
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/presentation/createGamificationService.test.js --watchAll=false --runInBand
```

Expected:

- FAIL because `getCurrentStage` does not exist yet

- [ ] **Step 3: Add the repository methods**

```js
const normalizeCurrentStage = (row) => row ? {
  studentId: row.student_id,
  currentStageSlug: row.current_stage_slug,
  progressHint: row.progress_hint || '',
  metadata: row.metadata || {},
  updatedAt: row.updated_at || null,
} : null;

const normalizeStageHistoryRow = (row) => ({
  id: row.id,
  studentId: row.student_id,
  stageSlug: row.stage_slug,
  awardedAt: row.awarded_at || null,
  awardedReason: row.awarded_reason || '',
  metadata: row.metadata || {},
});

async function getAthleteStageCatalog() {
  const { data, error } = await supabase
    .from('gamification_athlete_stages_catalog')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function getCurrentStage(studentId) {
  const { data, error } = await supabase
    .from('gamification_student_current_stage')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();
  if (error) throw error;
  return normalizeCurrentStage(data);
}

async function listStageHistory(studentId) {
  const { data, error } = await supabase
    .from('gamification_student_stage_history')
    .select('*')
    .eq('student_id', studentId)
    .order('awarded_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeStageHistoryRow);
}

async function upsertCurrentStage(payload) {
  const { error } = await supabase
    .from('gamification_student_current_stage')
    .upsert({
      student_id: payload.studentId,
      current_stage_slug: payload.currentStageSlug,
      progress_hint: payload.progressHint,
      metadata: payload.metadata || {},
      updated_at: payload.updatedAt,
    });
  if (error) throw error;
}

async function insertStageHistory(payload) {
  const { error } = await supabase
    .from('gamification_student_stage_history')
    .insert({
      student_id: payload.studentId,
      stage_slug: payload.stageSlug,
      awarded_at: payload.awardedAt,
      awarded_reason: payload.awardedReason,
      metadata: payload.metadata || {},
    });
  if (error) throw error;
}
```

- [ ] **Step 4: Export the methods from the repository factory**

```js
return {
  // existing methods...
  getAthleteStageCatalog,
  getCurrentStage,
  listStageHistory,
  upsertCurrentStage,
  insertStageHistory,
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/presentation/createGamificationService.test.js --watchAll=false --runInBand
```

Expected:

- PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/gamification/infrastructure/repositories/supabaseGamificationRepository.js src/features/gamification/presentation/createGamificationService.test.js
git commit -m "feat: add athlete stage repository methods"
```

### Task 3: Calculate And Sync Athlete Stages In The Use Case Layer

**Files:**
- Modify: `src/features/gamification/application/useCases/createGamificationUseCases.js`
- Test: `src/features/gamification/application/useCases/createGamificationUseCases.test.js`

- [ ] **Step 1: Write the failing use-case test for stage projection**

```js
it('sincroniza athlete stage actual e historial cuando sube de etapa', async () => {
  repository.getAthleteStageCatalog.mockResolvedValue([
    { slug: 'semilla', sort_order: 10, min_level: 1, min_tests: 0, min_attendances: 0, min_payments: 0, min_achievements: 0, requires_leaderboard_presence: false },
    { slug: 'constante', sort_order: 30, min_level: 2, min_tests: 2, min_attendances: 8, min_payments: 1, min_achievements: 1, requires_leaderboard_presence: false },
  ]);
  repository.getCurrentStage.mockResolvedValue({ currentStageSlug: 'semilla', progressHint: 'old', metadata: {} });
  repository.listStageHistory.mockResolvedValue([{ stageSlug: 'semilla' }]);

  const result = await useCases.loadStudentGamificationByStudentIdUseCase.execute({ studentId: 's1' });

  expect(repository.upsertCurrentStage).toHaveBeenCalled();
  expect(repository.insertStageHistory).toHaveBeenCalledWith(expect.objectContaining({
    studentId: 's1',
    stageSlug: 'constante',
  }));
  expect(result.identity.currentStage.currentStageSlug).toBe('constante');
});
```

- [ ] **Step 2: Run the focused test to confirm failure**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/application/useCases/createGamificationUseCases.test.js --watchAll=false --runInBand
```

Expected:

- FAIL because the stage sync path is not implemented yet

- [ ] **Step 3: Add helpers to score and select stages**

```js
const buildStageEvidence = ({ profile, achievements, leaderboards }) => {
  const summary = profile?.summary || {};
  const hasLeaderboardPresence = (leaderboards || []).some((section) => Number(section.currentStudentRank || 0) > 0);
  return {
    level: Number(profile?.current_level || 1),
    tests: Number(summary.testsCount || 0),
    attendances: Number(summary.totalAttendances || 0),
    payments: Number(summary.totalPayments || 0),
    achievements: Number(achievements?.length || 0),
    hasLeaderboardPresence,
  };
};

const buildStageMetadata = (stage, evidence) => ({
  level: evidence.level,
  tests: { current: evidence.tests, required: Number(stage.min_tests || 0) },
  attendances: { current: evidence.attendances, required: Number(stage.min_attendances || 0) },
  payments: { current: evidence.payments, required: Number(stage.min_payments || 0) },
  achievements: { current: evidence.achievements, required: Number(stage.min_achievements || 0) },
  leaderboard: { required: Boolean(stage.requires_leaderboard_presence), current: evidence.hasLeaderboardPresence },
});

const getStageEvidenceScore = (stage, evidence) => {
  let score = 0;
  if (evidence.tests >= Number(stage.min_tests || 0)) score += 1;
  if (evidence.attendances >= Number(stage.min_attendances || 0)) score += 1;
  if (evidence.payments >= Number(stage.min_payments || 0)) score += 1;
  if (evidence.achievements >= Number(stage.min_achievements || 0)) score += 1;
  return score;
};

const selectAthleteStage = ({ catalog, evidence }) => {
  const ordered = [...(catalog || [])].sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0));
  let current = ordered[0] || null;
  for (const stage of ordered) {
    const levelOk = evidence.level >= Number(stage.min_level || 1);
    const leaderboardOk = !stage.requires_leaderboard_presence || evidence.hasLeaderboardPresence;
    const scoreOk = getStageEvidenceScore(stage, evidence) >= 3;
    if (levelOk && leaderboardOk && scoreOk) {
      current = stage;
    }
  }
  return current;
};
```

- [ ] **Step 4: Sync current stage and ascent-only history during load**

```js
const stageCatalog = await repository.getAthleteStageCatalog();
const storedCurrentStage = await repository.getCurrentStage(studentId);
const storedStageHistory = await repository.listStageHistory(studentId);

const stageEvidence = buildStageEvidence({
  profile: effectiveProfile,
  achievements: achievementRows,
  leaderboards: leaderboardSections,
});

const selectedStage = selectAthleteStage({
  catalog: stageCatalog,
  evidence: stageEvidence,
});

const currentStage = selectedStage ? {
  studentId: student.id,
  currentStageSlug: selectedStage.slug,
  progressHint: selectedStage.progress_hint_template,
  metadata: buildStageMetadata(selectedStage, stageEvidence),
  updatedAt: isoProvider(),
} : null;

if (currentStage) {
  await repository.upsertCurrentStage(currentStage);
  const alreadyAwarded = (storedStageHistory || []).some((entry) => entry.stageSlug === currentStage.currentStageSlug);
  if (!alreadyAwarded) {
    await repository.insertStageHistory({
      studentId: student.id,
      stageSlug: currentStage.currentStageSlug,
      awardedAt: currentStage.updatedAt,
      awardedReason: `Ascenso a ${selectedStage.name}`,
      metadata: currentStage.metadata,
    });
  }
}
```

- [ ] **Step 5: Project stage data into the aggregate returned to UI**

```js
identity: {
  ...identity,
  currentStage,
  stageHistory: storedStageHistory || [],
}
```

- [ ] **Step 6: Run the gamification use-case test suite**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/application/useCases/createGamificationUseCases.test.js --watchAll=false --runInBand
```

Expected:

- PASS

- [ ] **Step 7: Commit**

```bash
git add src/features/gamification/application/useCases/createGamificationUseCases.js src/features/gamification/application/useCases/createGamificationUseCases.test.js
git commit -m "feat: sync athlete stages in gamification projection"
```

### Task 4: Surface Stages And Richer Goals In The Student Panel

**Files:**
- Modify: `src/features/gamification/presentation/components/StudentGamificationPanel.js`
- Modify: `src/features/gamification/presentation/createGamificationService.js`
- Test: `src/features/gamification/presentation/createGamificationService.test.js`

- [ ] **Step 1: Write the failing service/presentation expectation**

```js
it('expone currentStage y stageHistory al panel del estudiante', async () => {
  const result = await service.loadStudentGamificationByStudentId({ studentId: 's1' });
  expect(result.identity.currentStage).toMatchObject({
    currentStageSlug: 'constante',
    progressHint: expect.any(String),
  });
  expect(Array.isArray(result.identity.stageHistory)).toBe(true);
});
```

- [ ] **Step 2: Run the presentation/service test to confirm failure**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/presentation/createGamificationService.test.js --watchAll=false --runInBand
```

Expected:

- FAIL if the service strips the new fields

- [ ] **Step 3: Pass through the new stage fields in the service**

```js
const normalizeIdentity = (identity) => ({
  ...identity,
  currentStage: identity?.currentStage || null,
  stageHistory: identity?.stageHistory || [],
});
```

- [ ] **Step 4: Add the stage summary UI in the panel**

```jsx
{identity?.currentStage ? (
  <Card className="mt-4 border-white/15 bg-black/25" padding="sm">
    <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
      <FaFlagCheckered className="text-rv-gold" />
      Etapa del atleta
    </h3>
    <div className="mt-3 grid gap-3 desktop:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-2xl border border-rv-gold/25 bg-rv-gold/10 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-100">Etapa actual</p>
        <p className="mt-2 text-2xl font-black text-white">{identity.currentStage.currentStageSlug.replaceAll('_', ' ')}</p>
        <p className="mt-2 text-sm text-slate-200">{identity.currentStage.progressHint}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Desglose</p>
        <div className="mt-3 grid gap-3 mobile:grid-cols-2">
          <MiniInsight icon={<FaChartLine />} label="Tests" value={`${identity.currentStage.metadata?.tests?.current || 0}`} helper={`Meta: ${identity.currentStage.metadata?.tests?.required || 0}`} />
          <MiniInsight icon={<FaCalendarCheck />} label="Asistencias" value={`${identity.currentStage.metadata?.attendances?.current || 0}`} helper={`Meta: ${identity.currentStage.metadata?.attendances?.required || 0}`} />
          <MiniInsight icon={<FaCoins />} label="Pagos" value={`${identity.currentStage.metadata?.payments?.current || 0}`} helper={`Meta: ${identity.currentStage.metadata?.payments?.required || 0}`} />
          <MiniInsight icon={<FaMedal />} label="Logros" value={`${identity.currentStage.metadata?.achievements?.current || 0}`} helper={`Meta: ${identity.currentStage.metadata?.achievements?.required || 0}`} />
        </div>
      </div>
    </div>
  </Card>
) : null}
```

- [ ] **Step 5: Add stage history under the goals/identity flow**

```jsx
{identity?.stageHistory?.length > 0 ? (
  <Card className="mt-4 border-white/15 bg-black/25" padding="sm">
    <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
      <FaTrophy className="text-rv-gold" />
      Historial de etapas
    </h3>
    <div className="mt-3 space-y-2">
      {identity.stageHistory.map((entry) => (
        <div key={`${entry.stageSlug}-${entry.awardedAt}`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-sm font-bold text-white">{entry.stageSlug.replaceAll('_', ' ')}</p>
          <p className="mt-1 text-xs text-slate-300">{entry.awardedReason}</p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{formatDate(entry.awardedAt)}</p>
        </div>
      ))}
    </div>
  </Card>
) : null}
```

- [ ] **Step 6: Run the service test and build**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/presentation/createGamificationService.test.js --watchAll=false --runInBand
npm run build
```

Expected:

- PASS
- build completes with only the existing `App.js` warning

- [ ] **Step 7: Commit**

```bash
git add src/features/gamification/presentation/createGamificationService.js src/features/gamification/presentation/components/StudentGamificationPanel.js src/features/gamification/presentation/createGamificationService.test.js
git commit -m "feat: show athlete stages in student panel"
```

### Task 5: Update Documentation

**Files:**
- Modify: `src/features/gamification/README.md`
- Modify: `docs/gamification/octalysis-decisions.md`
- Modify: `docs/gamification/octalysis-coverage.md`
- Modify: `docs/gamification/octalysis-architecture.md`

- [ ] **Step 1: Document athlete stages in the feature README**

```md
## Athlete stages

The feature now persists a narrative layer on top of XP:

- `athlete_stages_catalog`
- `student_current_stage`
- `student_stage_history`

Stage scoring remains in application code. The database stores the current snapshot and ascent-only history.
```

- [ ] **Step 2: Record the product decision in Octalysis decisions**

```md
### Athlete stages

We added a narrative progression layer with six athlete stages. Promotion requires a minimum level, optional leaderboard presence, and a weighted evidence mix from tests, attendances, payments, and achievements. Stage history records only ascents.
```

- [ ] **Step 3: Update Octalysis coverage**

```md
### Epic Meaning & Calling

- Athlete stages provide a named transformation path beyond XP totals.
- Stage history turns progression into a story, not only a scoreboard.

### Empowerment of Creativity & Feedback

- Strategic routes and current-stage evidence breakdown explain what the student should do next and why.
```

- [ ] **Step 4: Update architecture notes**

```md
### Stage persistence

The application calculates athlete stages from the current gamification projection, then synchronizes:

- `student_current_stage` for fast reads
- `student_stage_history` for ascent-only audit/history

The SQL catalog stores thresholds, but stage scoring remains in the use-case layer for flexibility.
```

- [ ] **Step 5: Commit**

```bash
git add src/features/gamification/README.md docs/gamification/octalysis-decisions.md docs/gamification/octalysis-coverage.md docs/gamification/octalysis-architecture.md
git commit -m "docs: document athlete stages reinforcement"
```

## Self-Review

- Spec coverage:
  - Athlete-stage persistence: covered by Tasks 1-3.
  - Strategic routes/challenge expansion already started in codebase; Task 3 keeps the projection path aligned with stage logic.
  - UI surfacing for current stage/history: covered by Task 4.
  - Documentation updates: covered by Task 5.
- Placeholder scan:
  - No `TODO`, `TBD`, or “implement later” placeholders remain.
- Type consistency:
  - Repository uses `currentStageSlug`, `progressHint`, `stageHistory`.
  - Use-case and UI steps use the same names.

