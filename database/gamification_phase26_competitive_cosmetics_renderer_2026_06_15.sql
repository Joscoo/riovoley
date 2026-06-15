begin;

update gamification.cosmetic_items_catalog
set metadata = coalesce(metadata, '{}'::jsonb)
  || case
    when category = 'frame' then jsonb_build_object('frameVariant', coalesce(metadata->>'frameVariant', 'studio'))
    when category = 'background' then jsonb_build_object('backgroundVariant', coalesce(metadata->>'backgroundVariant', 'portrait'))
    when category = 'badge' then jsonb_build_object('badgeVariant', coalesce(metadata->>'badgeVariant', 'club-seal'))
    when category = 'effect' then jsonb_build_object('effectVariant', coalesce(metadata->>'effectVariant', 'halo'))
    else '{}'::jsonb
  end
where category in ('frame', 'background', 'badge', 'effect');

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
  ('frame_club_satin', 'Marco Club Satin', 'Marco limpio y sobrio para perfiles que quieren verse ordenados desde temprano.', 'common', 'frame', 14, 500, '{"accent":"pearl","frameVariant":"satin","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('frame_carburo_linea', 'Marco Carburo Linea', 'Marco oscuro de contraste suave para un look serio sin exceso.', 'common', 'frame', 16, 501, '{"accent":"obsidian","frameVariant":"studio","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('frame_rosa_cinta', 'Marco Rosa Cinta', 'Marco con energia elegante y deportiva para perfiles expresivos.', 'rare', 'frame', 22, 502, '{"accent":"rose","frameVariant":"ribbon","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('frame_acero_pulso', 'Marco Acero Pulso', 'Marco de metal frio con presencia firme para progreso constante.', 'rare', 'frame', 24, 503, '{"accent":"steel","frameVariant":"pulse","unlockType":"streak","unlockTarget":3,"unlockHint":"Desbloquea al mantener una racha mensual de 3 meses."}'::jsonb),
  ('frame_fuego_trazo', 'Marco Fuego Trazo', 'Marco con tension deportiva y calor visible para perfiles activos.', 'epic', 'frame', 36, 504, '{"accent":"fire","frameVariant":"flame","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('frame_arco_cobalto', 'Marco Arco Cobalto', 'Marco premium con doble presencia azul para que el retrato gane peso visual.', 'epic', 'frame', 40, 505, '{"accent":"cobalt","frameVariant":"arc-double","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('frame_neon_corredor', 'Marco Neon Corredor', 'Marco electrico con lectura fuerte para tablas competitivas.', 'epic', 'frame', 44, 506, '{"accent":"neon","frameVariant":"elite","unlockType":"level","unlockTarget":5,"unlockHint":"Desbloquea al llegar al nivel 5."}'::jsonb),
  ('frame_corona_general', 'Marco Corona General', 'Marco de prestigio reservado para quien domina el progreso general.', 'legendary', 'frame', 0, 507, '{"accent":"gold","frameVariant":"crown","unlockType":"leaderboard_top","unlockTarget":1,"boardType":"overall","unlockHint":"Desbloquea al liderar el progreso general de tu categoria."}'::jsonb),

  ('background_estudio_perla', 'Fondo Estudio Perla', 'Fondo claro y limpio para que el retrato se vea mejor iluminado.', 'common', 'background', 14, 520, '{"palette":"studio","backgroundVariant":"portrait","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('background_carburo_foco', 'Fondo Carburo Foco', 'Fondo oscuro con foco suave para tarjetas mas serias.', 'common', 'background', 16, 521, '{"palette":"carbon","backgroundVariant":"spotlight","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('background_rosa_difuso', 'Fondo Rosa Difuso', 'Fondo calido para un look mas marcado sin perder sobriedad.', 'rare', 'background', 22, 522, '{"palette":"blush","backgroundVariant":"soft-focus","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('background_titanio_ruta', 'Fondo Titanio Ruta', 'Fondo firme con direccion visual para constancia deportiva.', 'rare', 'background', 24, 523, '{"palette":"titanium","backgroundVariant":"speed","unlockType":"achievement_count","unlockTarget":8,"unlockHint":"Desbloquea al conseguir 8 logros."}'::jsonb),
  ('background_malla_veloz', 'Fondo Malla Veloz', 'Fondo competitivo con sensacion de tension y desplazamiento.', 'epic', 'background', 34, 524, '{"palette":"storm","backgroundVariant":"speed-grid","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('background_oceano_profundo_x', 'Fondo Oceano Profundo X', 'Fondo azul sobrio con mas profundidad para identidad fuerte.', 'epic', 'background', 36, 525, '{"palette":"ocean","backgroundVariant":"deep-ocean","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('background_aurora_escena', 'Fondo Aurora Escena', 'Fondo premium con capas frias para perfiles de nivel alto.', 'epic', 'background', 40, 526, '{"palette":"aurora","backgroundVariant":"aurora-stage","unlockType":"level","unlockTarget":5,"unlockHint":"Desbloquea al llegar al nivel 5."}'::jsonb),
  ('background_cima_maestra', 'Fondo Cima Maestra', 'Fondo legendario reservado para quienes ya sostienen la punta.', 'legendary', 'background', 0, 527, '{"palette":"summit","backgroundVariant":"summit-stage","unlockType":"leaderboard_top","unlockTarget":1,"boardType":"overall","unlockHint":"Desbloquea al liderar el progreso general de tu categoria."}'::jsonb),

  ('badge_sello_escuela', 'Insignia Sello Escuela', 'Sello compacto para una identidad institucional y limpia.', 'common', 'badge', 12, 540, '{"icon":"shield","badgeVariant":"club-seal","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('badge_flash_inicio', 'Insignia Flash Inicio', 'Insignia ligera para darle un punto de energia al retrato.', 'common', 'badge', 14, 541, '{"icon":"star","badgeVariant":"flash","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('badge_lente_tactico', 'Insignia Lente Tactico', 'Insignia de enfoque para perfiles que quieren verse mas serios.', 'rare', 'badge', 20, 542, '{"icon":"medal","badgeVariant":"lens","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('badge_racha_firme', 'Insignia Racha Firme', 'Insignia visible para quien ya demuestra constancia real.', 'rare', 'badge', 22, 543, '{"icon":"shield","badgeVariant":"attendance","unlockType":"streak","unlockTarget":3,"unlockHint":"Desbloquea al mantener una racha mensual de 3 meses."}'::jsonb),
  ('badge_record_abierto', 'Insignia Record Abierto', 'Insignia de amenaza competitiva para perfiles que ya empujan arriba.', 'epic', 'badge', 30, 544, '{"icon":"medal","badgeVariant":"record","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('badge_forja_competitiva', 'Insignia Forja Competitiva', 'Insignia mas agresiva para una identidad de alto empuje.', 'epic', 'badge', 32, 545, '{"icon":"star","badgeVariant":"forge","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('badge_podio_constante', 'Insignia Podio Constante', 'Insignia visible para quien mezcla progreso con presencia real.', 'epic', 'badge', 0, 546, '{"icon":"medal","badgeVariant":"crown-podium","unlockType":"leaderboard_top","unlockTarget":3,"boardType":"overall","unlockHint":"Desbloquea al entrar al top 3 del progreso general."}'::jsonb),
  ('badge_corona_capitana', 'Insignia Corona Capitana', 'Insignia-trofeo reservada para lideres consolidados.', 'legendary', 'badge', 0, 547, '{"icon":"medal","badgeVariant":"crown-podium","unlockType":"leaderboard_top","unlockTarget":1,"boardType":"overall","unlockHint":"Desbloquea al liderar el progreso general de tu categoria."}'::jsonb),

  ('effect_halo_claro', 'Halo Claro', 'Halo sobrio para separar mejor el retrato del fondo.', 'common', 'effect', 12, 560, '{"glow":"pearl","effectVariant":"halo","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('effect_brilo_puntual', 'Brillo Puntual', 'Destello suave para darle una lectura mas limpia al perfil.', 'common', 'effect', 14, 561, '{"glow":"cyan","effectVariant":"sparkle","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('effect_pulso_sutil', 'Pulso Sutil', 'Pulso discreto para darle mas vida a la tarjeta sin saturarla.', 'rare', 'effect', 20, 562, '{"glow":"amber","effectVariant":"pulse","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('effect_aura_fria', 'Aura Fria', 'Resplandor contenido para perfiles que ya marcan presencia.', 'rare', 'effect', 22, 563, '{"glow":"cyan","effectVariant":"glow","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('effect_onda_capitan', 'Onda Capitan', 'Aura competitiva para perfiles que ya ganaron peso visual.', 'epic', 'effect', 30, 564, '{"glow":"cyan","effectVariant":"glow","unlockType":"level","unlockTarget":6,"unlockHint":"Desbloquea al llegar al nivel 6."}'::jsonb),
  ('effect_pulso_record_x', 'Pulso Record X', 'Pulso mas fuerte para que el retrato parezca una amenaza real.', 'epic', 'effect', 34, 565, '{"glow":"amber","effectVariant":"pulse","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('effect_destello_premium', 'Destello Premium', 'Destello premium con lectura fuerte para tarjetas altas.', 'epic', 'effect', 38, 566, '{"glow":"gold","effectVariant":"sparkle","unlockType":"achievement_count","unlockTarget":10,"unlockHint":"Desbloquea al conseguir 10 logros."}'::jsonb),
  ('effect_corona_voltaje', 'Corona Voltaje', 'Overlay legendario de prestigio competitivo para lideres absolutos.', 'legendary', 'effect', 0, 567, '{"glow":"gold","effectVariant":"crown-burst","unlockType":"leaderboard_top","unlockTarget":1,"boardType":"overall","unlockHint":"Desbloquea al liderar el progreso general de tu categoria."}'::jsonb)
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
