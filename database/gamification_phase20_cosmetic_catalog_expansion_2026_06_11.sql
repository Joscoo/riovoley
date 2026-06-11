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
  ('frame_plata_pulso', 'Marco Plata Pulso', 'Marco frio con presencia limpia para perfiles constantes.', 'common', 'frame', 18, 90, '{"accent":"silver","frameVariant":"pulse"}'::jsonb),
  ('frame_fuego_competitivo', 'Marco Fuego Competitivo', 'Borde intenso para quienes quieren destacar en tablas activas.', 'rare', 'frame', 26, 100, '{"accent":"fire","frameVariant":"flame"}'::jsonb),
  ('frame_neon_elite', 'Marco Neon Elite', 'Marco electrico para una presencia mas premium en rankings.', 'epic', 'frame', 42, 110, '{"accent":"neon","frameVariant":"elite"}'::jsonb),

  ('background_tormenta_azul', 'Fondo Tormenta Azul', 'Fondo de energia fria para una identidad competitiva mas fuerte.', 'common', 'background', 20, 120, '{"palette":"storm","backgroundVariant":"blue-storm"}'::jsonb),
  ('background_velocidad_magenta', 'Fondo Velocidad Magenta', 'Fondo dinamico con sensacion de impulso y movimiento.', 'rare', 'background', 28, 130, '{"palette":"magenta","backgroundVariant":"speed"}'::jsonb),
  ('background_carburo_nocturno', 'Fondo Carburo Nocturno', 'Fondo oscuro de alto contraste para perfiles serios.', 'rare', 'background', 30, 140, '{"palette":"carbon","backgroundVariant":"night-carbon"}'::jsonb),
  ('background_oceano_profundo', 'Fondo Oceano Profundo', 'Fondo acuatico para un look mas sobrio y distintivo.', 'epic', 'background', 36, 150, '{"palette":"ocean","backgroundVariant":"deep-ocean"}'::jsonb),

  ('badge_record_vivo', 'Insignia Record Vivo', 'Insignia para perfiles que quieren parecer amenaza real en rankings.', 'rare', 'badge', 24, 160, '{"icon":"medal","badgeVariant":"record"}'::jsonb),
  ('badge_fuerza_total', 'Insignia Fuerza Total', 'Sello pensado para quienes empujan fuerte en pruebas de fuerza.', 'rare', 'badge', 24, 170, '{"icon":"fire","badgeVariant":"strength"}'::jsonb),
  ('badge_asistencia_top', 'Insignia Asistencia Top', 'Insignia de constancia visible para tablas de asistencia.', 'epic', 'badge', 32, 180, '{"icon":"shield","badgeVariant":"attendance"}'::jsonb),

  ('effect_pulso_ambar', 'Pulso Ambar', 'Pulso suave que hace mas visible la tarjeta del perfil.', 'rare', 'effect', 26, 190, '{"glow":"amber","effectVariant":"pulse"}'::jsonb),
  ('effect_resplandor_magenta', 'Resplandor Magenta', 'Halo mas vivo para una identidad con personalidad.', 'epic', 'effect', 40, 200, '{"glow":"magenta","effectVariant":"glow"}'::jsonb),
  ('effect_corona_sutil', 'Corona Sutil', 'Efecto premium de presencia alta sin recargar demasiado.', 'epic', 'effect', 44, 210, '{"glow":"violet","effectVariant":"crown"}'::jsonb)
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
