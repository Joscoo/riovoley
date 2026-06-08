# Gamification Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first structured expansion of gamification with XP ledger, daily login reward, weekday attendance streak, expanded achievements/challenges, and student-facing UI for traceable progress.

**Architecture:** Extend the existing `gamification` feature without leaking ownership from `auth-session`, `attendance`, `payments`, or `physical-tests`. Persist new read models in Supabase for XP traceability and daily reward control, add focused public service methods, and keep the student panel consuming a ready-to-render aggregate from `gamification`.

**Tech Stack:** React, Jest, Supabase JS, SQL migrations, Tailwind CSS, clean-lite by feature

---

## File Structure

### Files to create
- `database/gamification_phase13_foundation_2026_06_07.sql`
- `src/features/gamification/application/useCases/createGamificationFoundationUseCases.js`
- `src/features/gamification/application/useCases/createGamificationFoundationUseCases.test.js`

### Files to modify
- `src/features/gamification/application/useCases/createGamificationUseCases.js`
- `src/features/gamification/infrastructure/repositories/supabaseGamificationRepository.js`
- `src/features/gamification/presentation/createGamificationService.js`
- `src/features/gamification/presentation/createGamificationService.test.js`
- `src/features/gamification/presentation/components/StudentGamificationPanel.js`
- `src/features/gamification/README.md`
- `src/features/auth-session/infrastructure/repositories/supabaseAuthSessionRepository.js`
- `src/features/auth-session/application/useCases/createAuthSessionUseCases.js`
- `src/features/auth-session/application/useCases/createAuthSessionUseCases.test.js`
- `src/features/auth-session/presentation/createAuthSessionService.js`
- `src/features/student-dashboard/application/useCases/createStudentDashboardUseCases.js`
- `docs/gamification/octalysis-decisions.md`
- `docs/gamification/octalysis-coverage.md`

---

### Task 1: Add Supabase foundation tables for XP ledger and daily login reward

**Files:**
- Create: `database/gamification_phase13_foundation_2026_06_07.sql`

- [ ] **Step 1: Write the migration file with the new schema objects**

```sql
begin;

create table if not exists gamification.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  source_type text not null,
  source_ref text,
  xp_delta integer not null,
  label text not null,
  description text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists gamification_xp_ledger_student_id_occurred_at_idx
  on gamification.xp_ledger(student_id, occurred_at desc);

create table if not exists gamification.login_rewards (
  user_id uuid primary key references public.users(id) on delete cascade,
  reward_date date not null,
  reward_count integer not null default 1,
  updated_at timestamptz not null default now()
);

grant usage on schema gamification to authenticated;
grant select, insert, update, delete on gamification.xp_ledger to authenticated;
grant select, insert, update on gamification.login_rewards to authenticated;

commit;
```

- [ ] **Step 2: Run the SQL manually in Supabase**

Run: execute `database/gamification_phase13_foundation_2026_06_07.sql` in the SQL editor  
Expected: migration completes with no permission or relation errors

- [ ] **Step 3: Commit**

```bash
git add database/gamification_phase13_foundation_2026_06_07.sql
git commit -m "feat: add gamification foundation tables"
```

### Task 2: Add repository surface for XP ledger and daily login reward

**Files:**
- Modify: `src/features/gamification/infrastructure/repositories/supabaseGamificationRepository.js`
- Test: `src/features/gamification/presentation/createGamificationService.test.js`

- [ ] **Step 1: Write the failing service test for the new public methods**

```js
it('loadXpLedger delega studentId y limit', async () => {
  mockXpLedger.mockResolvedValueOnce([{ label: 'Asistencia', xpDelta: 35 }]);
  const service = createGamificationService({});

  const result = await service.loadXpLedger({ studentId: 's1', limit: 20 });

  expect(mockXpLedger).toHaveBeenCalledWith({ studentId: 's1', limit: 20 });
  expect(result[0].label).toBe('Asistencia');
});

it('registerDailyLoginReward delega userId', async () => {
  mockLoginReward.mockResolvedValueOnce({ awarded: true, xpDelta: 8 });
  const service = createGamificationService({});

  const result = await service.registerDailyLoginReward({ userId: 'u1' });

  expect(mockLoginReward).toHaveBeenCalledWith({ userId: 'u1' });
  expect(result).toEqual({ awarded: true, xpDelta: 8 });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx cross-env CI=true react-scripts test src/features/gamification/presentation/createGamificationService.test.js --watchAll=false --runInBand`  
Expected: FAIL because `loadXpLedgerUseCase` and `registerDailyLoginRewardUseCase` do not exist yet

- [ ] **Step 3: Add repository methods for ledger and login-reward state**

```js
async listXpLedger(studentId, limit = 25) {
  const { data, error } = await supabase
    .from('gamification_xp_ledger')
    .select('*')
    .eq('student_id', studentId)
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new GamificationError(normalizeError(error, 'Error cargando extracto de XP'), error);
  }

  return data || [];
}

async getLoginRewardState(userId) {
  const { data, error } = await supabase
    .from('gamification_login_rewards')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && !isNoRowsError(error)) {
    throw new GamificationError(normalizeError(error, 'Error cargando recompensa diaria'), error);
  }

  return data || null;
}

async upsertLoginRewardState(row) {
  const { data, error } = await supabase
    .from('gamification_login_rewards')
    .upsert(row)
    .select()
    .single();

  if (error) {
    throw new GamificationError(normalizeError(error, 'Error guardando recompensa diaria'), error);
  }

  return data;
}
```

- [ ] **Step 4: Extend the gamification service facade**

```js
const loadXpLedger = async ({ studentId, limit }) =>
  useCases.loadXpLedgerUseCase.execute({ studentId, limit });

const registerDailyLoginReward = async ({ userId }) =>
  useCases.registerDailyLoginRewardUseCase.execute({ userId });
```

- [ ] **Step 5: Run the service test to verify it passes**

Run: `npx cross-env CI=true react-scripts test src/features/gamification/presentation/createGamificationService.test.js --watchAll=false --runInBand`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/gamification/infrastructure/repositories/supabaseGamificationRepository.js src/features/gamification/presentation/createGamificationService.js src/features/gamification/presentation/createGamificationService.test.js
git commit -m "feat: add gamification ledger repository surface"
```

### Task 3: Build focused foundation use cases for login reward and XP ledger

**Files:**
- Create: `src/features/gamification/application/useCases/createGamificationFoundationUseCases.js`
- Create: `src/features/gamification/application/useCases/createGamificationFoundationUseCases.test.js`
- Modify: `src/features/gamification/application/useCases/createGamificationUseCases.js`

- [ ] **Step 1: Write the failing unit tests**

```js
it('registerDailyLoginRewardUseCase entrega XP una vez por dia', async () => {
  repository.findStudentByUserId.mockResolvedValue({ id: 's1', user_id: 'u1', categoria: 'iniciacion_hombres', users: { nombre: 'Leo', apellido: 'Perez' } });
  repository.getLoginRewardState.mockResolvedValue(null);
  repository.listXpLedger.mockResolvedValue([]);

  const useCases = createGamificationFoundationUseCases(repository, {
    getEcuadorDate: jest.fn(() => '2026-06-07'),
    getEcuadorISOString: jest.fn(() => '2026-06-07T12:00:00.000Z'),
  });

  const result = await useCases.registerDailyLoginRewardUseCase.execute({ userId: 'u1' });

  expect(result).toMatchObject({ awarded: true, xpDelta: 8 });
  expect(repository.upsertLoginRewardState).toHaveBeenCalled();
});

it('registerDailyLoginRewardUseCase no duplica la recompensa en el mismo dia', async () => {
  repository.findStudentByUserId.mockResolvedValue({ id: 's1', user_id: 'u1', categoria: 'iniciacion_hombres', users: { nombre: 'Leo', apellido: 'Perez' } });
  repository.getLoginRewardState.mockResolvedValue({ user_id: 'u1', reward_date: '2026-06-07', reward_count: 1 });

  const useCases = createGamificationFoundationUseCases(repository, deps);
  const result = await useCases.registerDailyLoginRewardUseCase.execute({ userId: 'u1' });

  expect(result).toEqual({ awarded: false, xpDelta: 0 });
});
```

- [ ] **Step 2: Run the foundation tests to verify they fail**

Run: `npx cross-env CI=true react-scripts test src/features/gamification/application/useCases/createGamificationFoundationUseCases.test.js --watchAll=false --runInBand`  
Expected: FAIL because the file and use cases do not exist yet

- [ ] **Step 3: Create the foundation use cases**

```js
import { getEcuadorDate, getEcuadorISOString } from '../../../../utils/dateUtils';

const DAILY_LOGIN_XP = 8;

export const createGamificationFoundationUseCases = (repository, deps = {}) => {
  const todayProvider = deps.getEcuadorDate || getEcuadorDate;
  const isoProvider = deps.getEcuadorISOString || getEcuadorISOString;

  const loadXpLedgerUseCase = {
    execute: async ({ studentId, limit = 25 }) => repository.listXpLedger(studentId, limit),
  };

  const registerDailyLoginRewardUseCase = {
    execute: async ({ userId }) => {
      const student = await repository.findStudentByUserId(userId);
      const today = todayProvider();
      const rewardState = await repository.getLoginRewardState(userId);

      if (rewardState?.reward_date === today) {
        return { awarded: false, xpDelta: 0, rewardDate: today };
      }

      await repository.upsertLoginRewardState({
        user_id: userId,
        reward_date: today,
        reward_count: 1,
        updated_at: isoProvider(),
      });

      return {
        awarded: true,
        xpDelta: DAILY_LOGIN_XP,
        studentId: student.id,
        rewardDate: today,
        ledgerEntry: {
          student_id: student.id,
          source_type: 'daily_login',
          source_ref: today,
          xp_delta: DAILY_LOGIN_XP,
          label: 'Ingreso diario',
          description: 'Recompensa minima por volver hoy a la aplicacion.',
          occurred_at: isoProvider(),
        },
      };
    },
  };

  return { loadXpLedgerUseCase, registerDailyLoginRewardUseCase };
};
```

- [ ] **Step 4: Wire these use cases into `createGamificationUseCases.js`**

```js
import { createGamificationFoundationUseCases } from './createGamificationFoundationUseCases';

const foundation = createGamificationFoundationUseCases(repository, deps);

return {
  ...foundation,
  loadStudentGamificationUseCase,
  loadStudentGamificationByStudentIdUseCase,
  refreshStudentProgressUseCase,
  processPhysicalTestRecordedUseCase,
  getCategoryLeaderboardUseCase,
  listCategoryLeaderboardsUseCase,
  listStudentAchievementsUseCase,
  listActiveChallengesUseCase,
};
```

- [ ] **Step 5: Run the foundation tests to verify they pass**

Run: `npx cross-env CI=true react-scripts test src/features/gamification/application/useCases/createGamificationFoundationUseCases.test.js --watchAll=false --runInBand`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/gamification/application/useCases/createGamificationFoundationUseCases.js src/features/gamification/application/useCases/createGamificationFoundationUseCases.test.js src/features/gamification/application/useCases/createGamificationUseCases.js
git commit -m "feat: add gamification foundation use cases"
```

### Task 4: Persist XP ledger and weekday streak inside the main projection

**Files:**
- Modify: `src/features/gamification/application/useCases/createGamificationUseCases.js`
- Test: `src/features/gamification/application/useCases/createGamificationUseCases.test.js`

- [ ] **Step 1: Write the failing projection test**

```js
it('refreshStudentProgressUseCase construye racha habil y ledger de XP', async () => {
  repository.findStudentById.mockResolvedValue(buildStudent());
  repository.listPhysicalTests.mockResolvedValue([
    { id: 't1', fecha_test: '2026-06-02', brazo_extend_con_impulso: 46 },
  ]);
  repository.listAttendances.mockResolvedValue([
    { id: 'a1', fecha: '2026-06-02' },
    { id: 'a2', fecha: '2026-06-03' },
    { id: 'a3', fecha: '2026-06-04' },
    { id: 'a4', fecha: '2026-06-05' },
    { id: 'a5', fecha: '2026-06-06' },
  ]);
  repository.listPayments.mockResolvedValue([]);
  repository.listAchievementCatalog.mockResolvedValue([]);
  repository.listActiveChallenges.mockResolvedValue([]);
  repository.listStudentsByCategory.mockResolvedValue([buildStudent()]);
  repository.listPhysicalTestsByStudentIds.mockResolvedValue([]);
  repository.listAttendancesByStudentIds.mockResolvedValue([]);
  repository.listPaymentsByStudentIds.mockResolvedValue([]);

  const useCases = createGamificationUseCases(repository, buildDeps());
  await useCases.refreshStudentProgressUseCase.execute({ studentId: 's1' });

  expect(repository.upsertProfile).toHaveBeenCalledWith(expect.objectContaining({
    summary: expect.objectContaining({
      weekdayAttendanceStreak: 5,
    }),
  }));
  expect(repository.replaceRewardEvents).toHaveBeenCalledWith('s1', expect.arrayContaining([
    expect.objectContaining({ source_type: 'attendance' }),
  ]));
});
```

- [ ] **Step 2: Run the projection test to verify it fails**

Run: `npx cross-env CI=true react-scripts test src/features/gamification/application/useCases/createGamificationUseCases.test.js --watchAll=false --runInBand`  
Expected: FAIL because `weekdayAttendanceStreak` and ledger-aware event generation are not implemented

- [ ] **Step 3: Add focused helpers inside `createGamificationUseCases.js`**

```js
const isWeekday = (date) => {
  const day = new Date(`${date}T00:00:00`).getUTCDay();
  return day >= 1 && day <= 5;
};

const getPreviousBusinessDay = (date) => {
  const cursor = new Date(`${date}T00:00:00`);
  do {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  } while (cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6);
  return cursor.toISOString().slice(0, 10);
};

const calculateWeekdayAttendanceStreak = (attendances) => {
  const uniqueDates = [...new Set((attendances || []).map((entry) => entry.fecha).filter(Boolean))]
    .filter(isWeekday)
    .sort();

  if (uniqueDates.length === 0) return 0;

  let streak = 1;
  for (let index = uniqueDates.length - 1; index > 0; index -= 1) {
    if (getPreviousBusinessDay(uniqueDates[index]) === uniqueDates[index - 1]) streak += 1;
    else break;
  }

  return streak;
};
```

- [ ] **Step 4: Extend the derived profile summary and reward-event generation**

```js
summary: {
  ...existingSummary,
  weekdayAttendanceStreak: calculateWeekdayAttendanceStreak(attendances),
}

const rewardEvents = [
  ...tests.map((test) => ({
    student_id: student.id,
    source_type: 'physical_test',
    source_ref: test.id,
    xp_delta: BASE_TEST_XP,
    label: 'Test fisico registrado',
    description: 'Se registro una nueva evaluacion fisica.',
    occurred_at: `${test.fecha_test}T12:00:00.000Z`,
  })),
  ...attendances.map((attendance) => ({
    student_id: student.id,
    source_type: 'attendance',
    source_ref: attendance.id,
    xp_delta: BASE_ATTENDANCE_XP,
    label: 'Asistencia registrada',
    description: 'Entrenamiento validado dentro de tu progreso.',
    occurred_at: `${attendance.fecha}T12:00:00.000Z`,
  })),
];
```

- [ ] **Step 5: Persist the XP ledger after projection refresh**

```js
await repository.replaceRewardEvents(studentId, projection.rewardEvents);

if (typeof repository.replaceXpLedger === 'function') {
  await repository.replaceXpLedger(studentId, projection.rewardEvents);
}
```

- [ ] **Step 6: Run the gamification use-case tests to verify they pass**

Run: `npx cross-env CI=true react-scripts test src/features/gamification/application/useCases/createGamificationUseCases.test.js --watchAll=false --runInBand`  
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/features/gamification/application/useCases/createGamificationUseCases.js src/features/gamification/application/useCases/createGamificationUseCases.test.js
git commit -m "feat: add weekday streak and xp ledger projection"
```

### Task 5: Register daily login reward from auth-session

**Files:**
- Modify: `src/features/auth-session/infrastructure/repositories/supabaseAuthSessionRepository.js`
- Modify: `src/features/auth-session/application/useCases/createAuthSessionUseCases.js`
- Modify: `src/features/auth-session/application/useCases/createAuthSessionUseCases.test.js`
- Modify: `src/features/auth-session/presentation/createAuthSessionService.js`

- [ ] **Step 1: Write the failing auth-session test**

```js
it('signInWithPassword registra recompensa diaria de gamificacion cuando el login es exitoso', async () => {
  repository.signInWithPassword.mockResolvedValue({
    user: { id: 'u1', email: 'leo@test.com' },
    session: { access_token: 'token' },
  });
  gamificationService.registerDailyLoginReward = jest.fn().mockResolvedValue({ awarded: true, xpDelta: 8 });

  const useCases = createAuthSessionUseCases(repository, deps);
  await useCases.signInWithPasswordUseCase.execute({ email: 'leo@test.com', password: 'secret' });

  expect(gamificationService.registerDailyLoginReward).toHaveBeenCalledWith({ userId: 'u1' });
});
```

- [ ] **Step 2: Run the auth-session test to verify it fails**

Run: `npx cross-env CI=true react-scripts test src/features/auth-session/application/useCases/createAuthSessionUseCases.test.js --watchAll=false --runInBand`  
Expected: FAIL because the login flow does not call gamification yet

- [ ] **Step 3: Inject best-effort reward registration into the successful login path**

```js
import { gamificationService } from '../../../gamification';

try {
  await gamificationService.registerDailyLoginReward({ userId: data.user.id });
} catch (rewardError) {
  console.error('No se pudo registrar la recompensa diaria de gamificacion:', rewardError);
}
```

- [ ] **Step 4: Run the auth-session tests to verify they pass**

Run: `npx cross-env CI=true react-scripts test src/features/auth-session/application/useCases/createAuthSessionUseCases.test.js --watchAll=false --runInBand`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/auth-session/application/useCases/createAuthSessionUseCases.js src/features/auth-session/application/useCases/createAuthSessionUseCases.test.js src/features/auth-session/presentation/createAuthSessionService.js src/features/auth-session/infrastructure/repositories/supabaseAuthSessionRepository.js
git commit -m "feat: register gamification login reward on sign in"
```

### Task 6: Expose XP extract and new streaks in the student aggregate and UI

**Files:**
- Modify: `src/features/student-dashboard/application/useCases/createStudentDashboardUseCases.js`
- Modify: `src/features/gamification/presentation/components/StudentGamificationPanel.js`

- [ ] **Step 1: Write the failing student-dashboard expectation**

```js
expect(result.gamification).toMatchObject({
  xpLedger: expect.any(Array),
  profile: expect.objectContaining({
    summary: expect.objectContaining({
      weekdayAttendanceStreak: expect.any(Number),
    }),
  }),
});
```

- [ ] **Step 2: Run the relevant dashboard test to verify it fails**

Run: `npx cross-env CI=true react-scripts test src/features/student-dashboard/application/useCases/createStudentDashboardUseCases.test.js --watchAll=false --runInBand`  
Expected: FAIL because `xpLedger` is not part of the student aggregate

- [ ] **Step 3: Load the ledger from the gamification aggregate**

```js
const gamification = await gamificationService.loadStudentGamificationByStudentId({
  studentId: studentData.id,
  studentData,
  physicalTests,
});

return {
  studentData,
  paymentStatus,
  attendanceStats,
  physicalTests,
  gamification: {
    ...gamification,
    xpLedger: gamification?.xpLedger || [],
  },
};
```

- [ ] **Step 4: Render the new sections in `StudentGamificationPanel.js`**

```js
<HighlightStat
  icon={<FaCalendarCheck />}
  label="Racha habil"
  value={`${profile.summary?.weekdayAttendanceStreak || 0} dias`}
  helper="Cuenta tus dias habiles seguidos de entrenamiento."
  tone={(profile.summary?.weekdayAttendanceStreak || 0) > 0 ? 'success' : 'default'}
/>;

<Card className="mt-4 border-white/15 bg-black/25" padding="sm">
  <h3 className="inline-flex items-center gap-2 text-base font-extrabold text-white mobile:text-lg">
    <FaBolt className="text-rv-gold" />
    Extracto de XP
  </h3>
  <div className="mt-3 space-y-2">
    {(gamification?.xpLedger || []).slice(0, 12).map((entry) => (
      <div key={`${entry.sourceRef || entry.occurredAt}-${entry.label}`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-white">{entry.label}</p>
            <p className="mt-1 text-xs text-slate-300">{entry.description}</p>
          </div>
          <StatusBadge tone="success">+{entry.xpDelta} XP</StatusBadge>
        </div>
      </div>
    ))}
  </div>
</Card>
```

- [ ] **Step 5: Run the student and build verification**

Run: `npx cross-env CI=true react-scripts test src/features/student-dashboard/application/useCases/createStudentDashboardUseCases.test.js --watchAll=false --runInBand`  
Expected: PASS

Run: `npm run build`  
Expected: build finishes successfully

- [ ] **Step 6: Commit**

```bash
git add src/features/student-dashboard/application/useCases/createStudentDashboardUseCases.js src/features/gamification/presentation/components/StudentGamificationPanel.js
git commit -m "feat: show weekday streak and xp extract in student panel"
```

### Task 7: Expand documentation and feature README after code lands

**Files:**
- Modify: `src/features/gamification/README.md`
- Modify: `docs/gamification/octalysis-decisions.md`
- Modify: `docs/gamification/octalysis-coverage.md`

- [ ] **Step 1: Update the feature README**

```md
## Nuevas capacidades de fase 1 estructurada
- `loadXpLedger({ studentId, limit })`
- `registerDailyLoginReward({ userId })`
- racha de dias habiles consecutivos
- extracto detallado de XP en el panel del estudiante
```

- [ ] **Step 2: Record the implementation decisions**

```md
### 2026-06-07 - Implemented daily login reward
- Phase: 5
- Topic: Minimal habit reward
- Decision: Ship daily login XP with once-per-day persistence guard and visible ledger trace.
```

- [ ] **Step 3: Record the implemented coverage evidence**

```md
### 2. Development & Accomplishment
- Implementacion:
  - Extracto de XP visible y persistido.
- Evidencia:
  - [StudentGamificationPanel.js](D:/Riovoley/riovoley/src/features/gamification/presentation/components/StudentGamificationPanel.js:1)
```

- [ ] **Step 4: Commit**

```bash
git add src/features/gamification/README.md docs/gamification/octalysis-decisions.md docs/gamification/octalysis-coverage.md
git commit -m "docs: record gamification foundation rollout"
```

---

## Self-Review

### Spec coverage
- `xp ledger`: covered by Tasks 1, 2, 3, 4, 6
- `login diario minimo`: covered by Tasks 1, 2, 3, 5
- `racha de dias habiles`: covered by Tasks 4 and 6
- `mas claridad en progreso visible`: covered by Task 6
- `documentacion`: covered by Task 7

### Placeholder scan
- No `TODO`, `TBD`, or “similar to previous task” markers remain.

### Type consistency
- Public method names are consistent across tasks:
  - `loadXpLedger`
  - `registerDailyLoginReward`
  - `weekdayAttendanceStreak`

---

Plan complete and saved to `docs/superpowers/plans/2026-06-07-gamification-phase1-foundation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
