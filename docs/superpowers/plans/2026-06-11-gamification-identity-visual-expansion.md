# Gamification Identity Visual Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the student's competitive identity with fixed avatar models per style, a larger and more visible cosmetic system, and clearer blocked/secret achievement presentation that renders consistently in profile and leaderboards.

**Architecture:** Extend the existing `gamification` feature instead of rebuilding it. Keep the source of truth split between domain catalog files for avatar models and cosmetic visual behavior, the gamification use cases for projection and unlocking, and the existing portrait renderer for consistent composition across student panel, sidebar, and leaderboards.

**Tech Stack:** React 19, Create React App, Tailwind CSS, Supabase/PostgREST, Supabase Storage, Jest, existing clean-lite feature structure

---

## File Structure

### Files to modify

- `database/gamification_phase18_profile_media_2026_06_11.sql`
  - Extend `student_identity` persistence with `avatar_model_slug` and keep compatibility with current profile media rollout.
- `src/features/gamification/domain/avatarCatalog.js`
  - Replace the flat style list with style + fixed models metadata and unlock hints.
- `src/features/gamification/domain/buildAvatarUrl.js`
  - Build DiceBear URLs using style, model, and cosmetic-driven avatar parameters.
- `src/features/gamification/application/useCases/createGamificationUseCases.js`
  - Load avatar models, blocked models, blocked achievements, secret achievements with hints, and propagate richer cosmetic identity state.
- `src/features/gamification/infrastructure/repositories/supabaseGamificationRepository.js`
  - Persist/read `avatar_model_slug` as part of student identity.
- `src/features/gamification/presentation/createGamificationService.js`
  - Forward `avatarModelSlug` through the public service contract.
- `src/features/gamification/presentation/components/IdentityPortrait.js`
  - Improve cosmetic rendering so every slot creates a visible change in avatar/photo.
- `src/features/gamification/presentation/components/StudentGamificationPanel.js`
  - Add style/model chooser, blocked model cards, larger cosmetic catalog presentation, and blocked/secret achievement sections.
- `src/features/gamification/presentation/components/CategoryLeaderboardsPanel.js`
  - Surface the richer portrait composition consistently in rankings.
- `src/features/student-dashboard/presentation/components/StudentPanel.js`
  - Keep sidebar portrait aligned with the richer identity payload.
- `src/features/gamification/application/useCases/createGamificationUseCases.test.js`
  - Cover avatar models, blocked models, achievement visibility, and richer cosmetic composition.
- `src/features/gamification/presentation/createGamificationService.test.js`
  - Cover `avatarModelSlug` delegation.
- `src/features/student-dashboard/application/useCases/createStudentDashboardUseCases.test.js`
  - Guard the richer gamification aggregate shape consumed by the panel.
- `docs/gamification/octalysis-decisions.md`
  - Record implementation decisions made while rolling out this slice.
- `docs/gamification/octalysis-coverage.md`
  - Extend core-driver evidence for blocked models and hidden achievements.
- `docs/gamification/octalysis-architecture.md`
  - Reflect avatar model catalog and achievement visibility changes.
- `src/features/gamification/README.md`
  - Document new public contract and identity behavior.

### Files to create

- `database/gamification_phase19_avatar_models_2026_06_11.sql`
  - Focused migration for `avatar_model_slug`.

## Task 1: Add Avatar Model Persistence

**Files:**
- Create: `database/gamification_phase19_avatar_models_2026_06_11.sql`
- Modify: `src/features/gamification/infrastructure/repositories/supabaseGamificationRepository.js`
- Modify: `src/features/gamification/presentation/createGamificationService.js`
- Test: `src/features/gamification/presentation/createGamificationService.test.js`

- [ ] **Step 1: Write the failing service test**

```js
it('updateStudentIdentity delega avatarModelSlug junto a la identidad visual', async () => {
  const fakeFile = { name: 'perfil.webp', type: 'image/webp', size: 1280 };
  mockUpdateIdentity.mockResolvedValueOnce({ identity: { avatarModelSlug: 'adventurer-02' } });

  const result = await gamificationService.updateStudentIdentity({
    userId: 'u-1',
    nickname: 'Capitan Rio',
    selectedTitleSlug: 'primer_impulso',
    avatarStyle: 'adventurer-neutral',
    avatarModelSlug: 'adventurer-02',
    profileImageMode: 'photo',
    profilePhotoFile: fakeFile,
    removeProfilePhoto: false,
  });

  expect(mockUpdateIdentity).toHaveBeenCalledWith({
    userId: 'u-1',
    nickname: 'Capitan Rio',
    selectedTitleSlug: 'primer_impulso',
    avatarStyle: 'adventurer-neutral',
    avatarModelSlug: 'adventurer-02',
    profileImageMode: 'photo',
    profilePhotoFile: fakeFile,
    removeProfilePhoto: false,
  });
  expect(result).toEqual({ identity: { avatarModelSlug: 'adventurer-02' } });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/presentation/createGamificationService.test.js --watchAll=false --runInBand
```

Expected: FAIL because `avatarModelSlug` is not forwarded yet.

- [ ] **Step 3: Add migration and repository/service support**

```sql
begin;

alter table gamification.student_identity
  add column if not exists avatar_model_slug text;

update gamification.student_identity
set avatar_model_slug = null
where avatar_model_slug = '';

create or replace view public.gamification_student_identity
with (security_invoker = true) as
select * from gamification.student_identity;

grant select, insert, update on public.gamification_student_identity to authenticated;

commit;
```

```js
// createGamificationService.js
const updateStudentIdentity = ({
  userId,
  nickname,
  selectedTitleSlug,
  avatarStyle,
  avatarModelSlug,
  profileImageMode,
  profilePhotoFile,
  removeProfilePhoto,
}) => useCases.updateStudentIdentityUseCase.execute({
  userId,
  nickname,
  selectedTitleSlug,
  avatarStyle,
  avatarModelSlug,
  profileImageMode,
  profilePhotoFile,
  removeProfilePhoto,
});
```

```js
// supabaseGamificationRepository.js
async upsertStudentIdentity(payload) {
  const { data, error } = await supabase
    .from('gamification_student_identity')
    .upsert(payload)
    .select('*')
    .single();

  if (error) {
    throw new GamificationError(normalizeError(error, 'Error actualizando identidad competitiva'), error);
  }

  return data;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/presentation/createGamificationService.test.js --watchAll=false --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add database/gamification_phase19_avatar_models_2026_06_11.sql src/features/gamification/infrastructure/repositories/supabaseGamificationRepository.js src/features/gamification/presentation/createGamificationService.js src/features/gamification/presentation/createGamificationService.test.js
git commit -m "feat: persist avatar model selection"
```

## Task 2: Replace Flat Avatar Styles With Fixed Models

**Files:**
- Modify: `src/features/gamification/domain/avatarCatalog.js`
- Modify: `src/features/gamification/domain/buildAvatarUrl.js`
- Test: `src/features/gamification/application/useCases/createGamificationUseCases.test.js`

- [ ] **Step 1: Write the failing use-case test for available and blocked models**

```js
it('loadStudentGamificationByStudentIdUseCase retorna modelos de avatar disponibles y bloqueados', async () => {
  repository.getIdentity.mockResolvedValueOnce({
    student_id: 's1',
    avatar_style: 'adventurer-neutral',
    avatar_model_slug: 'adventurer-01',
  });

  const result = await useCases.loadStudentGamificationByStudentIdUseCase.execute({
    studentId: 's1',
    studentData: student,
  });

  expect(result.identity.avatarStyle).toBe('adventurer-neutral');
  expect(result.identity.avatarModelSlug).toBe('adventurer-01');
  expect(result.identity.avatarModelOptions.available.length).toBeGreaterThan(0);
  expect(result.identity.avatarModelOptions.blocked.length).toBeGreaterThan(0);
  expect(result.identity.avatarModelOptions.blocked[0]).toEqual(
    expect.objectContaining({
      slug: expect.any(String),
      unlockHint: expect.any(String),
      isLocked: true,
    })
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/application/useCases/createGamificationUseCases.test.js --watchAll=false --runInBand
```

Expected: FAIL because `avatarModelSlug` and model groups are missing.

- [ ] **Step 3: Replace the catalog structure and URL builder**

```js
// avatarCatalog.js
export const AVATAR_STYLE_OPTIONS = [
  {
    slug: 'adventurer-neutral',
    name: 'Aventurero',
    description: 'Avatar ilustrado con rasgos expresivos y tono amigable.',
    models: [
      {
        slug: 'adventurer-01',
        name: 'Aventurero 1',
        isBase: true,
        unlockType: 'base',
        unlockHint: 'Disponible desde el inicio.',
        visualParams: { seedSuffix: 'base-01', mood: 'focus', accessories: 'none' },
      },
      {
        slug: 'adventurer-02',
        name: 'Aventurero 2',
        isBase: true,
        unlockType: 'base',
        unlockHint: 'Disponible desde el inicio.',
        visualParams: { seedSuffix: 'base-02', mood: 'spark', accessories: 'cap' },
      },
      {
        slug: 'adventurer-03',
        name: 'Aventurero Elite',
        isBase: false,
        unlockType: 'level',
        unlockHint: 'Desbloquea al llegar al nivel 4.',
        visualParams: { seedSuffix: 'elite-03', mood: 'elite', accessories: 'glasses' },
      },
    ],
  },
];

export const getAvatarStyleMeta = (value) =>
  AVATAR_STYLE_OPTIONS.find((option) => option.slug === value) || AVATAR_STYLE_OPTIONS[0];

export const getAvatarModelMeta = (styleSlug, modelSlug) => {
  const style = getAvatarStyleMeta(styleSlug);
  return style.models.find((model) => model.slug === modelSlug) || style.models[0];
};
```

```js
// buildAvatarUrl.js
import { DEFAULT_AVATAR_STYLE, getAvatarModelMeta } from './avatarCatalog';

export const buildAvatarUrl = ({
  seed,
  style = DEFAULT_AVATAR_STYLE,
  modelSlug,
  equipment = {},
}) => {
  const model = getAvatarModelMeta(style, modelSlug);
  const safeSeed = `${seed || 'Riovoley'}-${model.visualParams.seedSuffix}`;
  const backgroundColor = getBackgroundPalette(equipment);
  const radius = equipment.frame ? 28 : 50;

  return `https://api.dicebear.com/10.x/${encode(style)}/svg?seed=${encode(safeSeed)}&backgroundColor=${backgroundColor}&radius=${radius}`;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/application/useCases/createGamificationUseCases.test.js --watchAll=false --runInBand
```

Expected: PASS for the new avatar model expectations.

- [ ] **Step 5: Commit**

```bash
git add src/features/gamification/domain/avatarCatalog.js src/features/gamification/domain/buildAvatarUrl.js src/features/gamification/application/useCases/createGamificationUseCases.test.js
git commit -m "feat: add fixed avatar models by style"
```

## Task 3: Project Avatar Models Through Gamification Use Cases

**Files:**
- Modify: `src/features/gamification/application/useCases/createGamificationUseCases.js`
- Test: `src/features/gamification/application/useCases/createGamificationUseCases.test.js`

- [ ] **Step 1: Write the failing test for identity projection**

```js
it('updateStudentIdentityUseCase guarda avatarModelSlug y loadStudentGamification lo proyecta', async () => {
  repository.getIdentity.mockResolvedValueOnce(null);
  repository.upsertStudentIdentity.mockResolvedValueOnce({
    student_id: 's1',
    nickname: 'Muralla',
    avatar_style: 'adventurer-neutral',
    avatar_model_slug: 'adventurer-02',
    profile_image_mode: 'avatar',
  });

  const result = await useCases.updateStudentIdentityUseCase.execute({
    userId: 'u1',
    nickname: 'Muralla',
    selectedTitleSlug: null,
    avatarStyle: 'adventurer-neutral',
    avatarModelSlug: 'adventurer-02',
    profileImageMode: 'avatar',
  });

  expect(repository.upsertStudentIdentity).toHaveBeenCalledWith(
    expect.objectContaining({
      avatar_model_slug: 'adventurer-02',
    })
  );
  expect(result.identity.avatarModelSlug).toBe('adventurer-02');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/application/useCases/createGamificationUseCases.test.js --watchAll=false --runInBand
```

Expected: FAIL because the use case ignores `avatarModelSlug`.

- [ ] **Step 3: Implement model normalization, unlock grouping, and payload propagation**

```js
const buildAvatarModelOptions = ({ profile, styleSlug }) => {
  const style = getAvatarStyleMeta(styleSlug);
  const available = [];
  const blocked = [];

  style.models.forEach((model) => {
    const unlocked = model.isBase || (
      model.unlockType === 'level'
      && Number(profile.currentLevel || 0) >= Number(model.unlockLevel || 4)
    );

    const projected = {
      slug: model.slug,
      name: model.name,
      unlockHint: model.unlockHint,
      isLocked: !unlocked,
      previewStyle: style.slug,
    };

    if (unlocked) {
      available.push(projected);
    } else {
      blocked.push(projected);
    }
  });

  return { available, blocked };
};

const identityModelSlug = getAvatarModelMeta(avatarStyle, identity?.avatar_model_slug).slug;
const avatarModelOptions = buildAvatarModelOptions({ profile: cosmetics?.profile || {}, styleSlug: avatarStyle });
```

```js
// updateStudentIdentityUseCase.execute
avatarModelSlug = null,
...
const normalizedAvatarModelSlug = getAvatarModelMeta(avatarStyle, avatarModelSlug).slug;
...
avatar_model_slug: normalizedAvatarModelSlug,
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/application/useCases/createGamificationUseCases.test.js --watchAll=false --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/gamification/application/useCases/createGamificationUseCases.js src/features/gamification/application/useCases/createGamificationUseCases.test.js
git commit -m "feat: project avatar model state in gamification"
```

## Task 4: Make Every Cosmetic Cause a Visible Change

**Files:**
- Modify: `src/features/gamification/presentation/components/IdentityPortrait.js`
- Modify: `src/features/gamification/domain/buildAvatarUrl.js`
- Test: `src/features/gamification/application/useCases/createGamificationUseCases.test.js`

- [ ] **Step 1: Write the failing test for richer cosmetic projection**

```js
it('loadStudentGamificationByStudentIdUseCase entrega equippedItems completos para cambios visibles', async () => {
  const result = await useCases.loadStudentGamificationByStudentIdUseCase.execute({
    studentId: 's1',
    studentData: student,
  });

  expect(result.cosmetics.equippedItems).toEqual(
    expect.objectContaining({
      frame: expect.anything(),
      background: expect.anything(),
      badge: expect.anything(),
      effect: expect.anything(),
    })
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/application/useCases/createGamificationUseCases.test.js --watchAll=false --runInBand
```

Expected: FAIL if some equipped slots are not represented consistently.

- [ ] **Step 3: Improve portrait rendering and avatar internals**

```js
// IdentityPortrait.js
const getFrameClasses = (slug) => {
  switch (slug) {
    case 'frame_fuego_competitivo':
      return 'bg-[linear-gradient(135deg,_rgba(251,146,60,0.98),_rgba(190,24,93,0.9))] shadow-[0_0_32px_rgba(251,146,60,0.28)]';
    case 'frame_neon_elite':
      return 'bg-[linear-gradient(135deg,_rgba(34,211,238,1),_rgba(99,102,241,0.95))] shadow-[0_0_34px_rgba(34,211,238,0.24)]';
    default:
      return 'bg-[linear-gradient(135deg,_rgba(226,232,240,0.92),_rgba(148,163,184,0.72))]';
  }
};
```

```js
// buildAvatarUrl.js
const getAccessoryFromEquipment = (equipment = {}) => {
  if (equipment.badge === 'badge_record_vivo') return 'roundGlasses';
  if (equipment.effect === 'effect_rayo_cian') return 'kurt';
  return '';
};

return `https://api.dicebear.com/10.x/${encode(style)}/svg?seed=${encode(safeSeed)}&backgroundColor=${backgroundColor}&radius=${radius}&accessories=${encode(getAccessoryFromEquipment(equipment))}`;
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/application/useCases/createGamificationUseCases.test.js --watchAll=false --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/gamification/presentation/components/IdentityPortrait.js src/features/gamification/domain/buildAvatarUrl.js src/features/gamification/application/useCases/createGamificationUseCases.test.js
git commit -m "feat: render stronger cosmetic changes in portraits"
```

## Task 5: Expand Student Identity UI With Models and Better Preview

**Files:**
- Modify: `src/features/gamification/presentation/components/StudentGamificationPanel.js`
- Test: `src/features/student-dashboard/application/useCases/createStudentDashboardUseCases.test.js`

- [ ] **Step 1: Write the failing UI-shape test through the dashboard use case**

```js
it('loadStudentPanelDataUseCase mantiene avatarModelOptions y achievement visibility en gamification', async () => {
  gamificationService.loadStudentGamification.mockResolvedValueOnce({
    identity: {
      avatarModelOptions: {
        available: [{ slug: 'adventurer-01' }],
        blocked: [{ slug: 'adventurer-03', isLocked: true, unlockHint: 'Desbloquea al llegar al nivel 4.' }],
      },
    },
    blockedAchievements: [],
    secretAchievements: [],
  });

  const result = await useCases.loadStudentPanelDataUseCase.execute({ userId: 'u1' });

  expect(result.gamification.identity.avatarModelOptions.blocked[0].slug).toBe('adventurer-03');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/student-dashboard/application/useCases/createStudentDashboardUseCases.test.js --watchAll=false --runInBand
```

Expected: FAIL until the shape is stable.

- [ ] **Step 3: Add model picker, blocked cards, and clearer cosmetic preview**

```jsx
<div className="grid gap-3 md:grid-cols-3">
  {(identity?.avatarModelOptions?.available || []).map((model) => (
    <button
      key={model.slug}
      type="button"
      onClick={() => setSelectedAvatarModelSlug(model.slug)}
      className={selectedAvatarModelSlug === model.slug ? 'border-cyan-300 bg-cyan-500/10' : 'border-white/10 bg-black/20'}
    >
      <p className="font-bold text-white">{model.name}</p>
      <p className="text-xs text-slate-300">{model.unlockHint}</p>
    </button>
  ))}
</div>

<div className="grid gap-3 md:grid-cols-2">
  {(identity?.avatarModelOptions?.blocked || []).map((model) => (
    <div key={model.slug} className="rounded-2xl border border-white/10 bg-black/20 p-3 opacity-80">
      <p className="font-bold text-white">{model.name}</p>
      <p className="text-xs text-amber-200">{model.unlockHint}</p>
      <StatusBadge tone="warning">Bloqueado</StatusBadge>
    </div>
  ))}
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/student-dashboard/application/useCases/createStudentDashboardUseCases.test.js --watchAll=false --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/gamification/presentation/components/StudentGamificationPanel.js src/features/student-dashboard/application/useCases/createStudentDashboardUseCases.test.js
git commit -m "feat: add avatar model chooser and richer preview ui"
```

## Task 6: Show Blocked and Secret Achievements With Hints

**Files:**
- Modify: `src/features/gamification/application/useCases/createGamificationUseCases.js`
- Modify: `src/features/gamification/presentation/components/StudentGamificationPanel.js`
- Test: `src/features/gamification/application/useCases/createGamificationUseCases.test.js`

- [ ] **Step 1: Write the failing use-case test for secret achievements**

```js
it('loadStudentGamificationByStudentIdUseCase separa logros bloqueados y secretos con pista', async () => {
  const result = await useCases.loadStudentGamificationByStudentIdUseCase.execute({
    studentId: 's1',
    studentData: student,
  });

  expect(result.blockedAchievements.length).toBeGreaterThan(0);
  expect(result.secretAchievements.length).toBeGreaterThan(0);
  expect(result.secretAchievements[0]).toEqual(
    expect.objectContaining({
      hint: expect.any(String),
      isSecret: true,
    })
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/application/useCases/createGamificationUseCases.test.js --watchAll=false --runInBand
```

Expected: FAIL because `secretAchievements` is not projected yet.

- [ ] **Step 3: Implement blocked/secret separation and UI cards**

```js
const secretAchievements = (projection.lockedAchievements || [])
  .filter((achievement) => achievement.isSecret)
  .map((achievement) => ({
    slug: achievement.slug,
    title: achievement.title || 'Logro oculto',
    hint: achievement.hint || 'Hay algo por descubrir en tu progreso.',
    rarity: achievement.rarity || 'rare',
    isSecret: true,
  }));

const blockedAchievements = (projection.lockedAchievements || [])
  .filter((achievement) => !achievement.isSecret);
```

```jsx
<div className="grid gap-3 md:grid-cols-2">
  {secretAchievements.map((achievement) => (
    <div key={achievement.slug} className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-500/5 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-200">Logro secreto</p>
      <p className="mt-2 font-black text-white">{achievement.title}</p>
      <p className="mt-1 text-sm text-slate-300">{achievement.hint}</p>
    </div>
  ))}
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/application/useCases/createGamificationUseCases.test.js --watchAll=false --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/gamification/application/useCases/createGamificationUseCases.js src/features/gamification/presentation/components/StudentGamificationPanel.js src/features/gamification/application/useCases/createGamificationUseCases.test.js
git commit -m "feat: add blocked and secret achievement visibility"
```

## Task 7: Carry Rich Identity Into Leaderboards

**Files:**
- Modify: `src/features/gamification/presentation/components/CategoryLeaderboardsPanel.js`
- Modify: `src/features/student-dashboard/presentation/components/StudentPanel.js`
- Modify: `src/features/gamification/presentation/components/IdentityPortrait.js`
- Test: `src/features/gamification/application/useCases/createGamificationUseCases.test.js`

- [ ] **Step 1: Write the failing test for leaderboard identity shape**

```js
it('listCategoryLeaderboardsUseCase entrega profileImageUrl, titulo y cosmeticos visibles por fila', async () => {
  const result = await useCases.listCategoryLeaderboardsUseCase.execute({
    category: 'Sub-18',
  });

  expect(result[0].rows[0]).toEqual(
    expect.objectContaining({
      profileImageUrl: expect.any(String),
      cosmeticEquipment: expect.anything(),
      equippedTitle: expect.anything(),
    })
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/application/useCases/createGamificationUseCases.test.js --watchAll=false --runInBand
```

Expected: FAIL until every leaderboard row is enriched consistently.

- [ ] **Step 3: Tighten leaderboard rendering**

```jsx
<IdentityPortrait
  imageUrl={row.profileImageUrl || row.avatarUrl}
  displayName={row.publicAlias}
  equipment={row.cosmeticEquipment}
  size="sm"
  showBadgeLabel
/>
<div>
  <p className="font-bold text-white">{row.publicAlias}</p>
  {row.equippedTitle ? (
    <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">{row.equippedTitle.name}</p>
  ) : null}
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/application/useCases/createGamificationUseCases.test.js --watchAll=false --runInBand
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/gamification/presentation/components/CategoryLeaderboardsPanel.js src/features/student-dashboard/presentation/components/StudentPanel.js src/features/gamification/presentation/components/IdentityPortrait.js src/features/gamification/application/useCases/createGamificationUseCases.test.js
git commit -m "feat: render full competitive identity in leaderboards"
```

## Task 8: Update Documentation and Verify End-to-End Build

**Files:**
- Modify: `src/features/gamification/README.md`
- Modify: `docs/gamification/octalysis-decisions.md`
- Modify: `docs/gamification/octalysis-coverage.md`
- Modify: `docs/gamification/octalysis-architecture.md`

- [ ] **Step 1: Update README and Octalysis docs**

```md
## Fase de modelos de avatar y logros visibles
- La identidad competitiva ahora usa `avatar_style + avatar_model_slug`.
- Los modelos pueden estar disponibles o bloqueados con pista visible.
- Los logros bloqueados muestran progreso y los secretos muestran una pista sin revelar la condicion exacta.
```

- [ ] **Step 2: Run focused tests**

Run:

```bash
npx cross-env CI=true react-scripts test src/features/gamification/application/useCases/createGamificationUseCases.test.js src/features/gamification/presentation/createGamificationService.test.js src/features/student-dashboard/application/useCases/createStudentDashboardUseCases.test.js --watchAll=false --runInBand
```

Expected: PASS for all affected suites.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS. Existing unrelated warnings may remain, but there should be no new errors from gamification.

- [ ] **Step 4: Commit**

```bash
git add src/features/gamification/README.md docs/gamification/octalysis-decisions.md docs/gamification/octalysis-coverage.md docs/gamification/octalysis-architecture.md
git commit -m "docs: record visual identity expansion"
```

## Self-Review

### Spec coverage

- `style + model`: covered by Tasks 1, 2, 3.
- available and blocked avatar models: covered by Tasks 2, 3, 5.
- visible cosmetic impact on avatar/photo: covered by Tasks 4, 5, 7.
- consistent portrait in leaderboards: covered by Task 7.
- blocked achievements and secret achievements with hints: covered by Task 6.
- docs and Octalysis traceability: covered by Task 8.

### Placeholder scan

- No `TODO`, `TBD`, or unresolved placeholders remain.
- Every coding task contains concrete code or command examples.

### Type consistency

- `avatarModelSlug` is the public camelCase contract.
- `avatar_model_slug` is the persisted snake_case field.
- `avatarModelOptions.available` and `avatarModelOptions.blocked` are the projected UI buckets.
- `secretAchievements` is introduced explicitly as a separate aggregate field.
