begin;

insert into gamification.cosmetic_items_catalog (
  slug,
  name,
  description,
  rarity,
  category,
  price_coins,
  sort_order,
  metadata
)
values
  ('frame_resistencia_total', 'Marco Resistencia Total', 'Marco para perfiles que ya sostienen constancia real.', 'rare', 'frame', 24, 220, '{"accent":"steel","frameVariant":"pulse","unlockType":"streak","unlockTarget":3,"unlockHint":"Desbloquea al mantener una racha mensual de 3 meses."}'::jsonb),
  ('frame_rey_cobalto', 'Marco Rey Cobalto', 'Marco de prestigio para quien domina la tabla principal.', 'legendary', 'frame', 0, 230, '{"accent":"cobalt","frameVariant":"elite","unlockType":"leaderboard_top","unlockTarget":1,"boardType":"overall","unlockHint":"Desbloquea al liderar el progreso general de tu categoria."}'::jsonb),

  ('background_ruta_titanio', 'Fondo Ruta Titanio', 'Fondo firme para quienes ya acumulan varios hitos.', 'rare', 'background', 26, 240, '{"palette":"titanium","backgroundVariant":"speed","unlockType":"achievement_count","unlockTarget":8,"unlockHint":"Desbloquea al conseguir 8 logros."}'::jsonb),
  ('background_cima_dorada', 'Fondo Cima Dorada', 'Fondo premium reservado para niveles altos.', 'epic', 'background', 38, 250, '{"palette":"summit","backgroundVariant":"blue-storm","unlockType":"level","unlockTarget":5,"unlockHint":"Desbloquea al llegar al nivel 5."}'::jsonb),

  ('badge_top3_general', 'Insignia Top 3 General', 'Insignia visible para quienes ya se meten en la pelea grande.', 'epic', 'badge', 0, 260, '{"icon":"medal","badgeVariant":"record","unlockType":"leaderboard_top","unlockTarget":3,"boardType":"overall","unlockHint":"Desbloquea al entrar al top 3 del progreso general."}'::jsonb),
  ('badge_racha_sagrada', 'Insignia Racha Sagrada', 'Insignia para una constancia que ya se siente seria.', 'rare', 'badge', 18, 270, '{"icon":"shield","badgeVariant":"attendance","unlockType":"streak","unlockTarget":3,"unlockHint":"Desbloquea al mantener una racha mensual de 3 meses."}'::jsonb),

  ('effect_aura_capitan', 'Aura Capitan', 'Efecto de autoridad para estudiantes de nivel alto.', 'epic', 'effect', 30, 280, '{"glow":"cyan","effectVariant":"glow","unlockType":"level","unlockTarget":6,"unlockHint":"Desbloquea al llegar al nivel 6."}'::jsonb),
  ('effect_pulso_record', 'Pulso de Record', 'Pulso reservado para quienes lideran una medicion clave.', 'legendary', 'effect', 0, 290, '{"glow":"amber","effectVariant":"pulse","unlockType":"leaderboard_top","unlockTarget":1,"boardType":"jump_approach","unlockHint":"Desbloquea al liderar la tabla de salto con carrera."}'::jsonb)
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

update gamification.cosmetic_items_catalog
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'unlockType', 'purchase',
  'unlockHint', 'Disponible para comprar con monedas.'
)
where slug in (
  'frame_plata_pulso',
  'frame_fuego_competitivo',
  'frame_neon_elite',
  'background_tormenta_azul',
  'background_velocidad_magenta',
  'background_carburo_nocturno',
  'background_oceano_profundo',
  'badge_record_vivo',
  'badge_fuerza_total',
  'badge_asistencia_top',
  'effect_pulso_ambar',
  'effect_resplandor_magenta',
  'effect_corona_sutil'
);

commit;
