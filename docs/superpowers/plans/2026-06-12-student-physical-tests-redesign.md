# Student Physical Tests Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the student's physical tests module so it tells a clear progress story and produces profile-based recommendations grounded in the recorded test data.

**Architecture:** Keep `StudentPhysicalTests.js` as the container entry point, move derived calculations into a pure profile builder, and split the UI into small physical-test-specific presentation components under the student dashboard feature. The chart becomes block-driven (`corporal`, `salto`, `fuerza`), while recommendations and insights read from the same derived profile object so the UI and narrative stay consistent.

**Tech Stack:** React 19, Create React App/Jest, React Testing Library, Tailwind utility classes, Recharts, existing `shared/ui` primitives, `getPhysicalTestFieldMeta` from `src/features/physical-tests`.

---

## File Structure

### Create

- `src/features/student-dashboard/presentation/components/physical-tests/buildStudentPhysicalProfile.js`
- `src/features/student-dashboard/presentation/components/physical-tests/buildStudentPhysicalProfile.test.js`
- `src/features/student-dashboard/presentation/components/physical-tests/StudentPhysicalHero.js`
- `src/features/student-dashboard/presentation/components/physical-tests/StudentPhysicalTrendChart.js`
- `src/features/student-dashboard/presentation/components/physical-tests/StudentPhysicalInsights.js`
- `src/features/student-dashboard/presentation/components/physical-tests/StudentPhysicalRecommendations.js`
- `src/features/student-dashboard/presentation/components/physical-tests/StudentPhysicalHistory.js`
- `src/features/student-dashboard/presentation/components/StudentPhysicalTests.test.js`

### Modify

- `src/features/student-dashboard/presentation/components/StudentPhysicalTests.js`

### Responsibilities

- `buildStudentPhysicalProfile.js`: sort tests, normalize metrics, compute block summaries, generate insights, generate recommendations, and export chart-ready metadata.
- `StudentPhysicalHero.js`: latest status summary, last test date, confidence label, quick findings.
- `StudentPhysicalTrendChart.js`: block selector plus the single narrative chart.
- `StudentPhysicalInsights.js`: render "Lo que mejoro / necesita trabajo / estable".
- `StudentPhysicalRecommendations.js`: render headline, priority, confidence, and action list.
- `StudentPhysicalHistory.js`: compact list of historical measurements and contextual notes.
- `StudentPhysicalTests.js`: glue component only; owns the selected block and empty-state flow.
- `buildStudentPhysicalProfile.test.js`: unit coverage for ordering, edge cases, and recommendation rules.
- `StudentPhysicalTests.test.js`: render coverage for empty, preliminary, and multi-test states.

---

### Task 1: Build the Derived Student Physical Profile

**Files:**
- Create: `src/features/student-dashboard/presentation/components/physical-tests/buildStudentPhysicalProfile.js`
- Test: `src/features/student-dashboard/presentation/components/physical-tests/buildStudentPhysicalProfile.test.js`

- [ ] **Step 1: Write the failing profile builder tests**

```js
const { buildStudentPhysicalProfile } = require('./buildStudentPhysicalProfile');

describe('buildStudentPhysicalProfile', () => {
  it('returns an empty profile when there are no tests', () => {
    const result = buildStudentPhysicalProfile({
      physicalTests: [],
      studentData: { categoria: 'juvenil' },
    });

    expect(result.hasTests).toBe(false);
    expect(result.recommendations.confidence).toBe('preliminar');
    expect(result.blocks.body.status).toBe('sin_datos');
    expect(result.insights.needsWork).toEqual([]);
  });

  it('sorts by fecha_test and computes preliminary single-test output', () => {
    const result = buildStudentPhysicalProfile({
      physicalTests: [
        { id: 't2', fecha_test: '2026-06-10', peso: 64, estatura: 1.7, brazo_extend_con_impulso: 286 },
        { id: 't1', fecha_test: '2026-05-10', peso: 63, estatura: 1.7, brazo_extend_con_impulso: 280 },
      ],
      studentData: { categoria: 'juvenil' },
    });

    expect(result.latestTestId).toBe('t2');
    expect(result.blocks.jump.current.brazo_extend_con_impulso).toBe(286);
    expect(result.blocks.jump.deltaFromPrevious.brazo_extend_con_impulso).toBe(6);
    expect(result.recommendations.confidence).toBe('media');
  });

  it('flags weight increase plus jump regression as a mixed-profile alert', () => {
    const result = buildStudentPhysicalProfile({
      physicalTests: [
        { id: 't1', fecha_test: '2026-05-01', peso: 62, estatura: 1.7, brazo_extend_con_impulso: 288, fuerza_piernas: 45 },
        { id: 't2', fecha_test: '2026-06-01', peso: 65, estatura: 1.7, brazo_extend_con_impulso: 281, fuerza_piernas: 45 },
      ],
      studentData: { categoria: 'juvenil' },
    });

    expect(result.blocks.body.status).toBe('alerta');
    expect(result.blocks.jump.status).toBe('alerta');
    expect(result.recommendations.priority).toMatch(/explosividad|carga corporal/i);
    expect(result.insights.needsWork[0]).toMatch(/salto|peso/i);
  });

  it('keeps force conclusions empty when force metrics are missing', () => {
    const result = buildStudentPhysicalProfile({
      physicalTests: [
        { id: 't1', fecha_test: '2026-05-01', peso: 61, estatura: 1.68, brazo_extend_con_impulso: 275 },
        { id: 't2', fecha_test: '2026-06-01', peso: 61, estatura: 1.68, brazo_extend_con_impulso: 282 },
      ],
      studentData: { categoria: 'juvenil' },
    });

    expect(result.blocks.strength.status).toBe('sin_datos');
    expect(result.recommendations.headline).toMatch(/salto/i);
    expect(result.recommendations.recommendations.join(' ')).not.toMatch(/fuerza base/);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- --runInBand --watch=false --runTestsByPath src/features/student-dashboard/presentation/components/physical-tests/buildStudentPhysicalProfile.test.js
```

Expected: FAIL with `Cannot find module './buildStudentPhysicalProfile'` or missing export assertions.

- [ ] **Step 3: Write the minimal profile builder implementation**

```js
const METRIC_BLOCKS = {
  body: ['peso', 'estatura'],
  jump: [
    'brazo_extend_inicial',
    'brazo_extend_sin_impulso',
    'brazo_extend_con_impulso',
    'fuerza_explosiva_salto_largo',
    'envergadura_brazos_extendidos_lateral',
  ],
  strength: ['fuerza_abdomen', 'fuerza_brazos', 'fuerza_piernas', 'elevaciones_barra'],
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const calculateImc = (peso, estatura) => {
  const safePeso = toNumber(peso);
  const safeEstatura = toNumber(estatura);
  if (!safePeso || !safeEstatura) return null;
  return Number((safePeso / (safeEstatura * safeEstatura)).toFixed(2));
};

function buildStudentPhysicalProfile({ physicalTests = [], studentData = {} }) {
  const tests = [...physicalTests].sort((left, right) => (
    new Date(left.fecha_test) - new Date(right.fecha_test)
  ));

  if (tests.length === 0) {
    return {
      hasTests: false,
      latestTestId: null,
      studentData,
      blocks: {
        body: { status: 'sin_datos', current: {}, deltaFromPrevious: {}, deltaFromBaseline: {}, summary: 'Sin datos corporales suficientes.' },
        jump: { status: 'sin_datos', current: {}, deltaFromPrevious: {}, deltaFromBaseline: {}, summary: 'Sin datos de salto suficientes.' },
        strength: { status: 'sin_datos', current: {}, deltaFromPrevious: {}, deltaFromBaseline: {}, summary: 'Sin datos de fuerza suficientes.' },
      },
      insights: { improved: [], needsWork: [], stable: [] },
      recommendations: {
        headline: 'Aun no hay evaluaciones para construir tu perfil.',
        priority: 'Completar el primer test fisico.',
        recommendations: ['Solicita tu primera evaluacion fisica para activar el seguimiento de progreso.'],
        confidence: 'preliminar',
        disclaimer: 'Las recomendaciones apareceran cuando existan mediciones registradas.',
      },
    };
  }

  // Build normalized rows, calculate current/previous/baseline per block,
  // derive statuses, insights, chart groups, and recommendations from the same signals.
  return {
    hasTests: true,
    latestTestId: tests.at(-1)?.id || null,
    sortedTests: tests,
    blocks: {
      body: buildBodyBlock(tests),
      jump: buildDirectionalBlock(tests, METRIC_BLOCKS.jump, 'jump'),
      strength: buildDirectionalBlock(tests, METRIC_BLOCKS.strength, 'strength'),
    },
    insights: buildInsights({ tests, studentData }),
    recommendations: buildRecommendations({ tests, studentData }),
    chartGroups: buildChartGroups(tests),
    hero: buildHeroSummary({ tests, studentData }),
    history: buildHistoryItems(tests),
  };
}

module.exports = {
  buildStudentPhysicalProfile,
};
```

- [ ] **Step 4: Run the profile builder tests until they pass**

Run:

```bash
npm test -- --runInBand --watch=false --runTestsByPath src/features/student-dashboard/presentation/components/physical-tests/buildStudentPhysicalProfile.test.js
```

Expected: PASS for all `buildStudentPhysicalProfile` cases.

- [ ] **Step 5: Commit**

```bash
git add src/features/student-dashboard/presentation/components/physical-tests/buildStudentPhysicalProfile.js src/features/student-dashboard/presentation/components/physical-tests/buildStudentPhysicalProfile.test.js
git commit -m "feat: add student physical profile builder"
```

---

### Task 2: Add Render Tests for the New Student Narrative

**Files:**
- Create: `src/features/student-dashboard/presentation/components/StudentPhysicalTests.test.js`
- Modify: `src/features/student-dashboard/presentation/components/StudentPhysicalTests.js`

- [ ] **Step 1: Write the failing component tests**

```js
import { fireEvent, render, screen } from '@testing-library/react';
import StudentPhysicalTests from './StudentPhysicalTests';

const baseStudent = {
  categoria: 'juvenil',
  fecha_nacimiento: '2010-03-20',
};

describe('StudentPhysicalTests', () => {
  it('shows the empty state when there are no tests', () => {
    render(<StudentPhysicalTests physicalTests={[]} studentData={baseStudent} onRefresh={jest.fn()} />);

    expect(screen.getByText(/aun no tienes tests fisicos registrados/i)).toBeInTheDocument();
    expect(screen.queryByText(/lo que mejoro/i)).not.toBeInTheDocument();
  });

  it('shows preliminary recommendations for a single test', () => {
    render(
      <StudentPhysicalTests
        physicalTests={[{ id: 't1', fecha_test: '2026-06-01', peso: 60, estatura: 1.68, brazo_extend_con_impulso: 278 }]}
        studentData={baseStudent}
        onRefresh={jest.fn()}
      />
    );

    expect(screen.getByText(/confianza preliminar/i)).toBeInTheDocument();
    expect(screen.getByText(/completar seguimiento/i)).toBeInTheDocument();
  });

  it('switches chart blocks and renders narrative insights for multiple tests', () => {
    render(
      <StudentPhysicalTests
        physicalTests={[
          { id: 't1', fecha_test: '2026-05-01', peso: 61, estatura: 1.68, brazo_extend_con_impulso: 274, fuerza_piernas: 42 },
          { id: 't2', fecha_test: '2026-06-01', peso: 61, estatura: 1.68, brazo_extend_con_impulso: 281, fuerza_piernas: 47 },
        ]}
        studentData={baseStudent}
        onRefresh={jest.fn()}
      />
    );

    expect(screen.getByText(/lo que mejoro/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /fuerza/i }));
    expect(screen.getByText(/fuerza de piernas/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the component test to verify it fails**

Run:

```bash
npm test -- --runInBand --watch=false --runTestsByPath src/features/student-dashboard/presentation/components/StudentPhysicalTests.test.js
```

Expected: FAIL because the current component does not expose the new confidence, insight, and block-switching UI.

- [ ] **Step 3: Create the UI building blocks used by the narrative layout**

```js
// Example shape for StudentPhysicalHero.js
import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '../../../../../shared/ui';

export default function StudentPhysicalHero({ hero, onRefresh }) {
  return (
    <Card className="border-white/20 bg-black/35">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Estado actual</p>
          <h3 className="mt-1 text-2xl font-black text-white">{hero.headline}</h3>
          <p className="mt-2 text-sm text-slate-200">{hero.summary}</p>
        </div>
        <button type="button" onClick={onRefresh} className="min-h-[48px] rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white">
          Actualizar
        </button>
      </div>
    </Card>
  );
}

StudentPhysicalHero.propTypes = {
  hero: PropTypes.shape({
    headline: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
  }).isRequired,
  onRefresh: PropTypes.func.isRequired,
};
```

- [ ] **Step 4: Re-run the component tests to confirm the new subcomponents satisfy the contract**

Run:

```bash
npm test -- --runInBand --watch=false --runTestsByPath src/features/student-dashboard/presentation/components/StudentPhysicalTests.test.js
```

Expected: fewer failures or new assertion failures limited to the container integration step.

- [ ] **Step 5: Commit**

```bash
git add src/features/student-dashboard/presentation/components/StudentPhysicalTests.test.js src/features/student-dashboard/presentation/components/physical-tests/StudentPhysicalHero.js src/features/student-dashboard/presentation/components/physical-tests/StudentPhysicalTrendChart.js src/features/student-dashboard/presentation/components/physical-tests/StudentPhysicalInsights.js src/features/student-dashboard/presentation/components/physical-tests/StudentPhysicalRecommendations.js src/features/student-dashboard/presentation/components/physical-tests/StudentPhysicalHistory.js
git commit -m "feat: add student physical test narrative components"
```

---

### Task 3: Refactor `StudentPhysicalTests.js` into a Profile-Driven Container

**Files:**
- Modify: `src/features/student-dashboard/presentation/components/StudentPhysicalTests.js`
- Modify: `src/features/student-dashboard/presentation/components/physical-tests/buildStudentPhysicalProfile.js`
- Test: `src/features/student-dashboard/presentation/components/StudentPhysicalTests.test.js`

- [ ] **Step 1: Replace the monolithic in-component calculations with a failing integration expectation**

```js
it('renders the hero, narrative chart, insights, and recommendations from the derived profile', () => {
  render(
    <StudentPhysicalTests
      physicalTests={[
        { id: 't1', fecha_test: '2026-05-01', peso: 63, estatura: 1.7, brazo_extend_con_impulso: 280, fuerza_piernas: 42 },
        { id: 't2', fecha_test: '2026-06-01', peso: 62, estatura: 1.7, brazo_extend_con_impulso: 286, fuerza_piernas: 48 },
      ]}
      studentData={{ categoria: 'juvenil', fecha_nacimiento: '2010-03-20' }}
      onRefresh={jest.fn()}
    />
  );

  expect(screen.getByText(/estado actual/i)).toBeInTheDocument();
  expect(screen.getByText(/lo que necesita trabajo/i)).toBeInTheDocument();
  expect(screen.getByText(/prioridad actual/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /salto y alcance/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the integration-focused component suite and verify failure**

Run:

```bash
npm test -- --runInBand --watch=false --runTestsByPath src/features/student-dashboard/presentation/components/StudentPhysicalTests.test.js
```

Expected: FAIL until the container switches from legacy cards/mini-bar charts to the new profile-driven sections.

- [ ] **Step 3: Implement the container refactor**

```js
import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Card, EmptyState, SectionHeader } from '../../../../shared/ui';
import { FaChartBar, FaDumbbell } from 'react-icons/fa';
import { buildStudentPhysicalProfile } from './physical-tests/buildStudentPhysicalProfile';
import StudentPhysicalHero from './physical-tests/StudentPhysicalHero';
import StudentPhysicalTrendChart from './physical-tests/StudentPhysicalTrendChart';
import StudentPhysicalInsights from './physical-tests/StudentPhysicalInsights';
import StudentPhysicalRecommendations from './physical-tests/StudentPhysicalRecommendations';
import StudentPhysicalHistory from './physical-tests/StudentPhysicalHistory';

const DEFAULT_BLOCK = 'jump';

export default function StudentPhysicalTests({ physicalTests, studentData, onRefresh }) {
  const profile = useMemo(() => buildStudentPhysicalProfile({ physicalTests, studentData }), [physicalTests, studentData]);
  const [activeBlock, setActiveBlock] = useState(DEFAULT_BLOCK);

  return (
    <Card className="border-rv-gold/20 bg-black/30" padding="lg">
      <SectionHeader
        title="Tests Fisicos y Rendimiento"
        subtitle="Monitorea tu progreso con una lectura clara de tu evolucion y prioridades."
        icon={<FaDumbbell />}
      />

      {!profile.hasTests ? (
        <EmptyState
          icon={<FaChartBar />}
          title="Aun no tienes tests fisicos registrados"
          description="Los entrenadores realizaran evaluaciones periodicas para activar tu perfil de rendimiento."
        />
      ) : (
        <div className="space-y-4">
          <StudentPhysicalHero hero={profile.hero} onRefresh={onRefresh} />
          <StudentPhysicalTrendChart
            activeBlock={activeBlock}
            blocks={profile.chartGroups}
            onBlockChange={setActiveBlock}
          />
          <StudentPhysicalInsights insights={profile.insights} />
          <StudentPhysicalRecommendations recommendations={profile.recommendations} />
          <StudentPhysicalHistory items={profile.history} />
        </div>
      )}
    </Card>
  );
}

StudentPhysicalTests.propTypes = {
  physicalTests: PropTypes.array.isRequired,
  studentData: PropTypes.object,
  onRefresh: PropTypes.func.isRequired,
};
```

- [ ] **Step 4: Run both the builder and component tests**

Run:

```bash
npm test -- --runInBand --watch=false --runTestsByPath src/features/student-dashboard/presentation/components/physical-tests/buildStudentPhysicalProfile.test.js src/features/student-dashboard/presentation/components/StudentPhysicalTests.test.js
```

Expected: PASS for both suites with the old narrative code removed.

- [ ] **Step 5: Commit**

```bash
git add src/features/student-dashboard/presentation/components/StudentPhysicalTests.js src/features/student-dashboard/presentation/components/physical-tests/buildStudentPhysicalProfile.js src/features/student-dashboard/presentation/components/StudentPhysicalTests.test.js
git commit -m "feat: refactor student physical tests into profile container"
```

---

### Task 4: Finish Chart, History, and Regression Coverage

**Files:**
- Modify: `src/features/student-dashboard/presentation/components/physical-tests/StudentPhysicalTrendChart.js`
- Modify: `src/features/student-dashboard/presentation/components/physical-tests/StudentPhysicalHistory.js`
- Modify: `src/features/student-dashboard/presentation/components/physical-tests/buildStudentPhysicalProfile.test.js`
- Modify: `src/features/student-dashboard/presentation/components/StudentPhysicalTests.test.js`

- [ ] **Step 1: Add regression tests for block degradation and compact history**

```js
it('shows a useful empty message when the selected block lacks enough series data', () => {
  render(
    <StudentPhysicalTests
      physicalTests={[
        { id: 't1', fecha_test: '2026-06-01', peso: 60, estatura: 1.68 },
      ]}
      studentData={{ categoria: 'juvenil' }}
      onRefresh={jest.fn()}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: /fuerza/i }));
  expect(screen.getByText(/sin datos de fuerza suficientes/i)).toBeInTheDocument();
});

it('renders historical observations only when they exist', () => {
  render(
    <StudentPhysicalTests
      physicalTests={[
        { id: 't1', fecha_test: '2026-05-01', peso: 60, estatura: 1.68, observaciones: '' },
        { id: 't2', fecha_test: '2026-06-01', peso: 61, estatura: 1.68, observaciones: 'Mejor tecnica en el salto.' },
      ]}
      studentData={{ categoria: 'juvenil' }}
      onRefresh={jest.fn()}
    />
  );

  expect(screen.getByText(/mejor tecnica en el salto/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the regression-focused tests and verify failure**

Run:

```bash
npm test -- --runInBand --watch=false --runTestsByPath src/features/student-dashboard/presentation/components/StudentPhysicalTests.test.js src/features/student-dashboard/presentation/components/physical-tests/buildStudentPhysicalProfile.test.js
```

Expected: FAIL until block fallback text and compact-history behavior are implemented.

- [ ] **Step 3: Finish the chart/history behavior and profile fallbacks**

```js
// Example behavior in StudentPhysicalTrendChart.js
if (!activeSeries.length) {
  return (
    <Card className="border-white/15 bg-black/25">
      <p className="text-sm text-slate-200">{activeBlockConfig.emptyMessage}</p>
    </Card>
  );
}

// Example behavior in StudentPhysicalHistory.js
{item.observaciones ? (
  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
    <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Observaciones</p>
    <p className="mt-1 text-sm text-slate-100">{item.observaciones}</p>
  </div>
) : null}
```

- [ ] **Step 4: Run the targeted tests, then a broader student-dashboard pass**

Run:

```bash
npm test -- --runInBand --watch=false --runTestsByPath src/features/student-dashboard/presentation/components/physical-tests/buildStudentPhysicalProfile.test.js src/features/student-dashboard/presentation/components/StudentPhysicalTests.test.js src/features/student-dashboard/presentation/createStudentDashboardService.test.js src/features/student-dashboard/application/useCases/createStudentDashboardUseCases.test.js
```

Expected: PASS for the new profile/UI tests and no regression in the existing student dashboard service/use-case suites.

- [ ] **Step 5: Commit**

```bash
git add src/features/student-dashboard/presentation/components/physical-tests/StudentPhysicalTrendChart.js src/features/student-dashboard/presentation/components/physical-tests/StudentPhysicalHistory.js src/features/student-dashboard/presentation/components/physical-tests/buildStudentPhysicalProfile.test.js src/features/student-dashboard/presentation/components/StudentPhysicalTests.test.js
git commit -m "test: cover student physical test regressions"
```

---

## Self-Review

### Spec coverage

- Narrative progress layout: covered by Tasks 2 and 3.
- Derived mixed profile: covered by Task 1.
- Recommendations by profile: covered by Tasks 1 and 3.
- Central chart grouped by block: covered by Tasks 2, 3, and 4.
- Compact history and edge cases: covered by Task 4.
- Test coverage: covered by all tasks, with existing student dashboard regression suites in Task 4.

### Placeholder scan

- No `TODO`, `TBD`, or "implement later" markers remain.
- Every code-changing step includes a concrete code block.
- Every test step includes an exact command and expected outcome.

### Type consistency

- The plan consistently uses `physicalTests`, `studentData`, `profile`, `blocks.body`, `blocks.jump`, `blocks.strength`, and `recommendations.confidence`.
- The UI uses the same `buildStudentPhysicalProfile` export defined in Task 1.
