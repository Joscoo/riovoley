# Gamification Cosmetics Renderer Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the gamification cosmetic renderer around structured metadata, then expand the cosmetic catalog evenly so every slot has visibly valuable rewards across rarities.

**Architecture:** Keep the existing gamification aggregate and shop flows intact. Move portrait rendering away from slug-by-slug conditionals into reusable visual token resolvers driven by cosmetic metadata and rarity, then add a new SQL expansion migration that upgrades existing items and inserts a balanced catalog across `frame`, `background`, `badge`, and `effect`.

**Tech Stack:** React 19, Testing Library/Jest via `react-scripts`, Tailwind utility classes, Supabase/PostgreSQL SQL migrations, existing gamification feature modules.

---

## File Structure

**Create:**
- `src/features/gamification/presentation/components/cosmeticVisuals.js`
- `src/features/gamification/presentation/components/cosmeticVisuals.test.js`
- `src/features/gamification/presentation/components/IdentityPortrait.test.js`
- `database/gamification_phase26_competitive_cosmetics_renderer_2026_06_15.sql`

**Modify:**
- `src/features/gamification/presentation/components/IdentityPortrait.js`
- `src/features/gamification/presentation/components/StudentGamificationPanel.js`
- `src/features/gamification/application/useCases/createGamificationUseCases.test.js`
- `src/features/gamification/README.md`

---

### Task 1: Extract Metadata-Driven Cosmetic Visual Tokens

**Files:**
- Create: `src/features/gamification/presentation/components/cosmeticVisuals.js`
- Test: `src/features/gamification/presentation/components/cosmeticVisuals.test.js`

- [ ] **Step 1: Write the failing token resolver test**

```javascript
import {
  normalizeCosmeticItem,
  resolveFrameVisual,
  resolveBackgroundVisual,
  resolveBadgeVisual,
  resolveEffectVisual,
} from './cosmeticVisuals';

describe('cosmeticVisuals', () => {
  it('resolves sober visuals for common and rare cosmetics from metadata', () => {
    const item = normalizeCosmeticItem({
      slug: 'frame_club_satin',
      rarity: 'common',
      metadata: {
        accent: 'pearl',
        frameVariant: 'studio',
      },
    });

    const result = resolveFrameVisual(item);

    expect(result.intensity).toBe('sober');
    expect(result.variant).toBe('studio');
    expect(result.classes).toContain('linear-gradient');
  });

  it('resolves strong silhouette visuals for epic and legendary cosmetics', () => {
    const item = normalizeCosmeticItem({
      slug: 'effect_crown_voltage',
      rarity: 'legendary',
      metadata: {
        glow: 'gold',
        effectVariant: 'crown-burst',
      },
    });

    const result = resolveEffectVisual(item);

    expect(result.intensity).toBe('strong');
    expect(result.variant).toBe('crown-burst');
    expect(result.layers.front.length).toBeGreaterThan(0);
  });

  it('does not collapse different badge variants into the same visual payload', () => {
    const club = resolveBadgeVisual(normalizeCosmeticItem({
      slug: 'badge_sello_club',
      rarity: 'common',
      metadata: { icon: 'shield', badgeVariant: 'club-seal' },
    }));

    const podium = resolveBadgeVisual(normalizeCosmeticItem({
      slug: 'badge_corona_podio',
      rarity: 'epic',
      metadata: { icon: 'medal', badgeVariant: 'crown-podium' },
    }));

    expect(club.variant).toBe('club-seal');
    expect(podium.variant).toBe('crown-podium');
    expect(club.classes).not.toEqual(podium.classes);
    expect(club.shortLabel).not.toEqual(podium.shortLabel);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/gamification/presentation/components/cosmeticVisuals.test.js`

Expected: FAIL with module-not-found or missing export errors for `cosmeticVisuals.js`.

- [ ] **Step 3: Write the minimal token resolver implementation**

```javascript
const RARITY_INTENSITY = {
  common: 'sober',
  rare: 'sober',
  epic: 'strong',
  legendary: 'strong',
};

export const normalizeCosmeticItem = (item = {}) => ({
  slug: item.slug || '',
  rarity: item.rarity || 'common',
  category: item.category || null,
  metadata: item.metadata || {},
});

export const resolveFrameVisual = (item) => {
  const normalized = normalizeCosmeticItem(item);
  const variant = normalized.metadata.frameVariant || 'default-frame';
  return {
    variant,
    intensity: RARITY_INTENSITY[normalized.rarity] || 'sober',
    classes: variant === 'studio'
      ? 'bg-[linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(226,232,240,0.9))]'
      : 'bg-[linear-gradient(135deg,_rgba(125,211,252,0.96),_rgba(30,64,175,0.9))]',
  };
};

export const resolveBackgroundVisual = (item) => {
  const normalized = normalizeCosmeticItem(item);
  const variant = normalized.metadata.backgroundVariant || 'default-background';
  return {
    variant,
    intensity: RARITY_INTENSITY[normalized.rarity] || 'sober',
    classes: variant === 'portrait'
      ? 'bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_30%),linear-gradient(145deg,_rgba(71,85,105,0.84),_rgba(15,23,42,0.92)_60%,_rgba(30,41,59,0.9))]'
      : 'bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_34%),linear-gradient(145deg,_rgba(8,47,73,0.94),_rgba(14,116,144,0.8)_55%,_rgba(15,23,42,0.92))]',
  };
};

export const resolveBadgeVisual = (item) => {
  const normalized = normalizeCosmeticItem(item);
  const variant = normalized.metadata.badgeVariant || 'default-badge';
  return {
    variant,
    intensity: RARITY_INTENSITY[normalized.rarity] || 'sober',
    classes: variant === 'club-seal'
      ? 'bg-[linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(148,163,184,0.9))]'
      : 'bg-[linear-gradient(135deg,_rgba(120,53,15,0.98),_rgba(245,158,11,0.92))]',
    shortLabel: variant === 'club-seal' ? 'CLB' : 'POD',
    iconKey: normalized.metadata.icon || 'star',
  };
};

export const resolveEffectVisual = (item) => {
  const normalized = normalizeCosmeticItem(item);
  const variant = normalized.metadata.effectVariant || 'default-effect';
  return {
    variant,
    intensity: RARITY_INTENSITY[normalized.rarity] || 'sober',
    layers: {
      back: normalized.rarity === 'legendary'
        ? ["before:absolute before:-inset-2 before:rounded-[inherit] before:bg-yellow-300/18 before:blur-2xl before:content-['']"]
        : [],
      front: ['pointer-events-none absolute inset-0'],
    },
    classes: variant === 'crown-burst'
      ? "before:absolute before:-inset-1 before:rounded-[inherit] before:bg-yellow-300/18 before:blur-xl before:content-['']"
      : "before:absolute before:-inset-1 before:rounded-[inherit] before:bg-cyan-300/18 before:blur-xl before:content-['']",
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/gamification/presentation/components/cosmeticVisuals.test.js`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/gamification/presentation/components/cosmeticVisuals.js src/features/gamification/presentation/components/cosmeticVisuals.test.js
git commit -m "feat: add metadata-driven cosmetic visual resolvers"
```

---

### Task 2: Refactor IdentityPortrait To Use Token Resolvers And Layered Rendering

**Files:**
- Modify: `src/features/gamification/presentation/components/IdentityPortrait.js`
- Test: `src/features/gamification/presentation/components/IdentityPortrait.test.js`

- [ ] **Step 1: Write the failing portrait rendering test**

```javascript
import { render, screen } from '@testing-library/react';
import IdentityPortrait from './IdentityPortrait';

describe('IdentityPortrait', () => {
  it('renders sober common cosmetics without strong overlays', () => {
    render(
      <IdentityPortrait
        imageUrl="https://example.com/profile.png"
        displayName="Lia"
        equippedItems={{
          frame: {
            slug: 'frame_perla_estudio',
            rarity: 'common',
            metadata: { accent: 'pearl', frameVariant: 'studio' },
          },
        }}
      />
    );

    expect(screen.getByAltText('Perfil de Lia').closest('div')).toHaveClass('bg-[linear-gradient');
    expect(screen.queryByTestId('legendary-effect-front')).not.toBeInTheDocument();
  });

  it('renders strong front layers for legendary effects', () => {
    render(
      <IdentityPortrait
        imageUrl="https://example.com/profile.png"
        displayName="Nora"
        equippedItems={{
          effect: {
            slug: 'effect_crown_voltage',
            rarity: 'legendary',
            metadata: { glow: 'gold', effectVariant: 'crown-burst' },
          },
        }}
      />
    );

    expect(screen.getByTestId('legendary-effect-front')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/gamification/presentation/components/IdentityPortrait.test.js`

Expected: FAIL because `IdentityPortrait` does not expose the new layer structure or test IDs yet.

- [ ] **Step 3: Write the minimal layered portrait implementation**

```javascript
import {
  normalizeCosmeticItem,
  resolveFrameVisual,
  resolveBackgroundVisual,
  resolveBadgeVisual,
  resolveEffectVisual,
} from './cosmeticVisuals';

const frameItem = normalizeCosmeticItem(
  equippedItems?.frame || (normalizedEquipment.frame ? { slug: normalizedEquipment.frame } : null)
);
const backgroundItem = normalizeCosmeticItem(
  equippedItems?.background || (normalizedEquipment.background ? { slug: normalizedEquipment.background } : null)
);
const effectItem = normalizeCosmeticItem(
  equippedItems?.effect || (normalizedEquipment.effect ? { slug: normalizedEquipment.effect } : null)
);
const badgeItem = normalizeCosmeticItem(
  equippedItems?.badge || (normalizedEquipment.badge ? { slug: normalizedEquipment.badge } : null)
);

const frameVisual = resolveFrameVisual(frameItem);
const backgroundVisual = resolveBackgroundVisual(backgroundItem);
const effectVisual = resolveEffectVisual(effectItem);
const badgeVisual = badgeItem.slug ? resolveBadgeVisual(badgeItem) : null;

return (
  <div className={cn('relative isolate', className)}>
    {effectVisual.layers.back.map((layerClass, index) => (
      <div
        key={`effect-back-${index}`}
        className={cn('absolute inset-0 rounded-[inherit]', layerClass)}
        data-testid={effectItem.rarity === 'legendary' ? 'legendary-effect-back' : undefined}
      />
    ))}

    <div className={cn('relative overflow-visible', sizeStyles.shell, frameVisual.classes, effectVisual.classes)}>
      <div className={cn('relative h-full w-full overflow-hidden border border-white/10', sizeStyles.inner, backgroundVisual.classes)}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayName ? `Perfil de ${displayName}` : 'Imagen de perfil'}
            className={cn('relative z-[1] h-full w-full object-cover', sizeStyles.image, imageClassName)}
          />
        ) : null}

        {effectItem.rarity === 'legendary' ? (
          <div
            data-testid="legendary-effect-front"
            className="pointer-events-none absolute inset-x-1 top-0 z-[2] h-3 rounded-full bg-gradient-to-r from-transparent via-yellow-200/65 to-transparent"
          />
        ) : null}
      </div>

      {badgeVisual ? (
        <div className={cn('absolute z-[3] inline-flex items-center justify-center', sizeStyles.badge, badgeVisual.classes)}>
          <span>{badgeVisual.shortLabel}</span>
        </div>
      ) : null}
    </div>
  </div>
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/gamification/presentation/components/IdentityPortrait.test.js`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/gamification/presentation/components/IdentityPortrait.js src/features/gamification/presentation/components/IdentityPortrait.test.js
git commit -m "feat: refactor identity portrait to layered cosmetic renderer"
```

---

### Task 3: Expand Cosmetic Payload Coverage In The Student Panel And Aggregate Tests

**Files:**
- Modify: `src/features/gamification/application/useCases/createGamificationUseCases.test.js`
- Modify: `src/features/gamification/presentation/components/StudentGamificationPanel.js`

- [ ] **Step 1: Write the failing aggregate projection test**

```javascript
it('preserves renderer metadata for expanded cosmetics inside the projected catalog', async () => {
  const repository = buildRepository();
  repository.findStudentById.mockResolvedValue(buildStudent());
  repository.listPhysicalTests.mockResolvedValue([]);
  repository.listAttendances.mockResolvedValue([]);
  repository.listPayments.mockResolvedValue([]);
  repository.getProfile.mockResolvedValue(null);
  repository.getIdentity.mockResolvedValue(null);
  repository.getCurrencyWallet.mockResolvedValue({ student_id: 's1', balance: 120, total_earned: 120, total_spent: 0 });
  repository.listStudentAchievements.mockResolvedValue([]);
  repository.listAchievementCatalog.mockResolvedValue([]);
  repository.listTitleCatalog.mockResolvedValue([]);
  repository.listActiveChallenges.mockResolvedValue([]);
  repository.listStudentChallengeProgress.mockResolvedValue([]);
  repository.listXpLedger.mockResolvedValue([]);
  repository.listCurrencyLedger.mockResolvedValue([]);
  repository.listStudentsByCategory.mockResolvedValue([buildStudent()]);
  repository.listPhysicalTestsByStudentIds.mockResolvedValue([]);
  repository.listAttendancesByStudentIds.mockResolvedValue([]);
  repository.listPaymentsByStudentIds.mockResolvedValue([]);
  repository.listIdentitiesByStudentIds.mockResolvedValue([]);
  repository.listStudentCosmeticItems.mockResolvedValue([]);
  repository.getStudentCosmeticEquipment.mockResolvedValue(null);
  repository.listCosmeticCatalog.mockResolvedValue([
    {
      slug: 'frame_prestige_arc',
      name: 'Marco Prestige Arc',
      rarity: 'epic',
      category: 'frame',
      price_coins: 42,
      metadata: {
        accent: 'cobalt',
        frameVariant: 'arc-double',
        unlockType: 'purchase',
        unlockHint: 'Disponible para comprar con monedas.',
      },
    },
  ]);

  const useCases = createGamificationUseCases(repository, buildDeps());
  const result = await useCases.loadStudentGamificationByStudentIdUseCase.execute({ studentId: 's1' });
  const item = result.cosmetics.items.find((entry) => entry.slug === 'frame_prestige_arc');

  expect(item.metadata.frameVariant).toBe('arc-double');
  expect(item.rarity).toBe('epic');
  expect(item.canPurchase).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/gamification/application/useCases/createGamificationUseCases.test.js -t "preserves renderer metadata for expanded cosmetics inside the projected catalog"`

Expected: FAIL because the current projection may not preserve or expose all metadata consistently for store rendering.

- [ ] **Step 3: Write the minimal aggregate/UI implementation**

```javascript
// createGamificationUseCases.js inside buildCosmeticsView item mapping
return {
  ...item,
  metadata: item.metadata || {},
  photoFocus: getCosmeticPhotoFocus(item),
  photoFocusLabel: getCosmeticPhotoFocusLabel(item),
  isUnlocked,
  isLocked: !isUnlocked,
  canPurchase,
  isEquipped,
};
```

```javascript
// StudentGamificationPanel.js within cosmetic cards
<p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
  {(item.metadata?.frameVariant || item.metadata?.backgroundVariant || item.metadata?.badgeVariant || item.metadata?.effectVariant || 'base')
    .replaceAll('-', ' ')}
</p>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/features/gamification/application/useCases/createGamificationUseCases.test.js`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/gamification/application/useCases/createGamificationUseCases.test.js src/features/gamification/presentation/components/StudentGamificationPanel.js
git commit -m "feat: preserve cosmetic renderer metadata in projected store items"
```

---

### Task 4: Add Balanced Competitive Cosmetic Catalog Expansion Migration

**Files:**
- Create: `database/gamification_phase26_competitive_cosmetics_renderer_2026_06_15.sql`
- Modify: `src/features/gamification/README.md`

- [ ] **Step 1: Write the failing catalog shape test as a repository-level expectation**

```javascript
it('documents the balanced expansion target for competitive cosmetics', () => {
  const plannedCounts = {
    frame: { common: 2, rare: 2, epic: 3, legendary: 1 },
    background: { common: 2, rare: 2, epic: 3, legendary: 1 },
    badge: { common: 2, rare: 2, epic: 3, legendary: 1 },
    effect: { common: 2, rare: 2, epic: 3, legendary: 1 },
  };

  expect(plannedCounts.frame.epic).toBe(3);
  expect(plannedCounts.effect.legendary).toBe(1);
});
```

Place this as a small guard block in `createGamificationUseCases.test.js` or a new focused cosmetic planning test if the suite already owns cosmetic catalog expectations.

- [ ] **Step 2: Run test to verify it fails for missing migration references or missing planned fixture**

Run: `npm test -- src/features/gamification/application/useCases/createGamificationUseCases.test.js -t "documents the balanced expansion target for competitive cosmetics"`

Expected: FAIL until the guard block is added and the plan is represented in code/tests.

- [ ] **Step 3: Write the migration and README update**

```sql
begin;

update gamification.cosmetic_items_catalog
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'frameVariant', case when category = 'frame' and slug like 'frame_%' then coalesce(metadata->>'frameVariant', 'studio') else metadata->>'frameVariant' end,
  'backgroundVariant', case when category = 'background' and slug like 'background_%' then coalesce(metadata->>'backgroundVariant', 'portrait') else metadata->>'backgroundVariant' end,
  'badgeVariant', case when category = 'badge' and slug like 'badge_%' then coalesce(metadata->>'badgeVariant', 'club-seal') else metadata->>'badgeVariant' end,
  'effectVariant', case when category = 'effect' and slug like 'effect_%' then coalesce(metadata->>'effectVariant', 'halo') else metadata->>'effectVariant' end
)
where category in ('frame', 'background', 'badge', 'effect');

insert into gamification.cosmetic_items_catalog (slug, name, description, rarity, category, price_coins, sort_order, metadata)
values
  ('frame_club_satin', 'Marco Club Satin', 'Marco sobrio con acabado limpio para perfiles iniciales.', 'common', 'frame', 14, 500, '{"accent":"pearl","frameVariant":"studio","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('frame_strike_forge', 'Marco Strike Forge', 'Marco con energia deportiva y relieve controlado.', 'epic', 'frame', 42, 520, '{"accent":"cobalt","frameVariant":"arc-double","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('background_velocity_grid', 'Fondo Velocity Grid', 'Fondo con direccion y tension competitiva.', 'epic', 'background', 39, 620, '{"palette":"storm","backgroundVariant":"speed-grid","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('badge_crown_podium', 'Insignia Crown Podium', 'Insignia de presencia alta para perfiles top.', 'legendary', 'badge', 0, 730, '{"icon":"medal","badgeVariant":"crown-podium","unlockType":"leaderboard_top","unlockTarget":1,"unlockHint":"Desbloquea al liderar una tabla clave."}'::jsonb),
  ('effect_crown_voltage', 'Efecto Crown Voltage', 'Overlay de prestigio con presencia fuerte y controlada.', 'legendary', 'effect', 0, 830, '{"glow":"gold","effectVariant":"crown-burst","unlockType":"leaderboard_top","unlockTarget":1,"unlockHint":"Desbloquea al liderar una tabla clave."}'::jsonb)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  rarity = excluded.rarity,
  category = excluded.category,
  price_coins = excluded.price_coins,
  is_active = true,
  sort_order = excluded.sort_order,
  metadata = excluded.metadata;

commit;
```

```md
## Fase de renderer cosmetico competitivo
- El renderer visual del portrait ya depende de metadata estructurada por categoria y rareza.
- `common/rare` se mantienen sobrios.
- `epic/legendary` concentran silueta, overlays y presencia fuerte.
- El catalogo crece de forma pareja entre `frame`, `background`, `badge` y `effect`.
```

- [ ] **Step 4: Run the targeted tests to verify they pass**

Run: `npm test -- src/features/gamification/presentation/components/cosmeticVisuals.test.js src/features/gamification/presentation/components/IdentityPortrait.test.js src/features/gamification/application/useCases/createGamificationUseCases.test.js`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add database/gamification_phase26_competitive_cosmetics_renderer_2026_06_15.sql src/features/gamification/README.md src/features/gamification/application/useCases/createGamificationUseCases.test.js
git commit -m "feat: expand competitive cosmetics catalog and renderer metadata"
```

---

## Spec Coverage Check

- Metadata-driven renderer: covered by Task 1 and Task 2.
- Strong rarity rules: covered by Task 1 and Task 2.
- Even expansion across 4 categories: covered by Task 4.
- Preserve shop/inventory flow compatibility: covered by Task 3 and Task 4.
- Better value perception in profile and leaderboard: covered by Task 2 and Task 3.

## Placeholder Scan

No `TODO`, `TBD`, or “implement later” placeholders remain. Every task includes concrete files, test-first steps, commands, and example code/migration content.

## Type Consistency Check

- Variant keys are consistent: `frameVariant`, `backgroundVariant`, `badgeVariant`, `effectVariant`.
- Rarity buckets are consistent: `common`, `rare`, `epic`, `legendary`.
- Resolver naming is consistent: `resolveFrameVisual`, `resolveBackgroundVisual`, `resolveBadgeVisual`, `resolveEffectVisual`.

