-- Migración: Completar metadata faltante en cosméticos existentes de las fases 16 y 20
-- Los ítems de la fase 16 no tienen frameVariant/backgroundVariant/badgeVariant/effectVariant
-- Los ítems de la fase 20 tampoco tienen unlockType/unlockHint

begin;

-- ── Fase 16: marcos originales ─────────────────────────────────────────────
update gamification.cosmetic_items_catalog
set metadata = metadata
  || '{"frameVariant":"studio","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb
where slug = 'frame_bronce_club';

update gamification.cosmetic_items_catalog
set metadata = metadata
  || '{"frameVariant":"satin","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb
where slug = 'frame_cian_ruta';

-- ── Fase 16: fondos originales ─────────────────────────────────────────────
update gamification.cosmetic_items_catalog
set metadata = metadata
  || '{"backgroundVariant":"portrait","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb
where slug = 'background_olas_noche';

update gamification.cosmetic_items_catalog
set metadata = metadata
  || '{"backgroundVariant":"summit-stage","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb
where slug = 'background_cancha_dorada';

-- ── Fase 16: insignias originales ─────────────────────────────────────────
update gamification.cosmetic_items_catalog
set metadata = metadata
  || '{"badgeVariant":"flash","icon":"star","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb
where slug = 'badge_primer_impulso';

update gamification.cosmetic_items_catalog
set metadata = metadata
  || '{"badgeVariant":"attendance","icon":"shield","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb
where slug = 'badge_muro_constante';

-- ── Fase 16: efectos originales ───────────────────────────────────────────
update gamification.cosmetic_items_catalog
set metadata = metadata
  || '{"effectVariant":"sparkle","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb
where slug = 'effect_aura_oro';

update gamification.cosmetic_items_catalog
set metadata = metadata
  || '{"effectVariant":"glow","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb
where slug = 'effect_rayo_cian';

-- ── Fase 20: marcos ────────────────────────────────────────────────────────
update gamification.cosmetic_items_catalog
set metadata = metadata
  || '{"unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb
where slug = 'frame_plata_pulso'
  and not (metadata ? 'unlockType');

update gamification.cosmetic_items_catalog
set metadata = metadata
  || '{"unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb
where slug = 'frame_fuego_competitivo'
  and not (metadata ? 'unlockType');

update gamification.cosmetic_items_catalog
set metadata = metadata
  || '{"unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb
where slug = 'frame_neon_elite'
  and not (metadata ? 'unlockType');

-- ── Fase 20: fondos ────────────────────────────────────────────────────────
update gamification.cosmetic_items_catalog
set metadata = metadata
  || '{"unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb
where slug in (
  'background_tormenta_azul',
  'background_velocidad_magenta',
  'background_carburo_nocturno',
  'background_oceano_profundo'
)
  and not (metadata ? 'unlockType');

-- ── Fase 20: insignias ─────────────────────────────────────────────────────
update gamification.cosmetic_items_catalog
set metadata = metadata
  || '{"unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb
where slug in (
  'badge_record_vivo',
  'badge_fuerza_total',
  'badge_asistencia_top'
)
  and not (metadata ? 'unlockType');

-- badgeVariant faltante para insignias de fase 20
update gamification.cosmetic_items_catalog
set metadata = metadata || '{"badgeVariant":"record"}'::jsonb
where slug = 'badge_record_vivo' and not (metadata ? 'badgeVariant');

update gamification.cosmetic_items_catalog
set metadata = metadata || '{"badgeVariant":"forge"}'::jsonb
where slug = 'badge_fuerza_total' and not (metadata ? 'badgeVariant');

update gamification.cosmetic_items_catalog
set metadata = metadata || '{"badgeVariant":"attendance"}'::jsonb
where slug = 'badge_asistencia_top' and not (metadata ? 'badgeVariant');

-- ── Fase 20: efectos ───────────────────────────────────────────────────────
update gamification.cosmetic_items_catalog
set metadata = metadata
  || '{"unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb
where slug in (
  'effect_pulso_ambar',
  'effect_resplandor_magenta',
  'effect_corona_sutil'
)
  and not (metadata ? 'unlockType');

update gamification.cosmetic_items_catalog
set metadata = metadata || '{"effectVariant":"pulse"}'::jsonb
where slug = 'effect_pulso_ambar' and not (metadata ? 'effectVariant');

update gamification.cosmetic_items_catalog
set metadata = metadata || '{"effectVariant":"glow"}'::jsonb
where slug = 'effect_resplandor_magenta' and not (metadata ? 'effectVariant');

update gamification.cosmetic_items_catalog
set metadata = metadata || '{"effectVariant":"crown-burst"}'::jsonb
where slug = 'effect_corona_sutil' and not (metadata ? 'effectVariant');

-- ── Fallback universal: cualquier ítem que aún no tenga unlockType ─────────
update gamification.cosmetic_items_catalog
set metadata = metadata
  || '{"unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb
where not (metadata ? 'unlockType');

commit;
