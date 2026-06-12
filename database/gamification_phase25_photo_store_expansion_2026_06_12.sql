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
  ('frame_perla_estudio', 'Marco Perla Estudio', 'Marco claro para que tu foto de perfil se vea mas limpia y premium.', 'common', 'frame', 16, 300, '{"accent":"pearl","frameVariant":"studio","photoFocus":"direct","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('frame_obsidiana_flash', 'Marco Obsidiana Flash', 'Borde oscuro con presencia fuerte para retratos con mas contraste.', 'rare', 'frame', 24, 310, '{"accent":"obsidian","frameVariant":"glass","photoFocus":"direct","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('frame_rosa_editorial', 'Marco Rosa Editorial', 'Marco elegante para fotos con un look mas destacado y expresivo.', 'rare', 'frame', 28, 320, '{"accent":"rose","frameVariant":"ribbon","photoFocus":"direct","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('frame_cobalto_retrato', 'Marco Cobalto Retrato', 'Marco premium para una foto que quiera dominar la tarjeta completa.', 'epic', 'frame', 38, 330, '{"accent":"cobalt","frameVariant":"elite","photoFocus":"direct","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),

  ('background_studio_luz', 'Fondo Studio Luz', 'Fondo suave para que la foto respire mejor y gane profundidad.', 'common', 'background', 18, 340, '{"palette":"studio","backgroundVariant":"portrait","photoFocus":"surround","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('background_aurora_retrato', 'Fondo Aurora Retrato', 'Fondo frio-violeta que levanta la presencia visual sin tapar la foto.', 'rare', 'background', 26, 350, '{"palette":"aurora","backgroundVariant":"portrait","photoFocus":"surround","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('background_blush_glow', 'Fondo Blush Glow', 'Fondo calido para una tarjeta mas llamativa alrededor de tu imagen.', 'rare', 'background', 27, 360, '{"palette":"blush","backgroundVariant":"soft-focus","photoFocus":"surround","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('background_carburo_flash', 'Fondo Carburo Flash', 'Fondo oscuro con brillo puntual para que el rostro y el marco resalten mas.', 'epic', 'background', 35, 370, '{"palette":"carbon","backgroundVariant":"spotlight","photoFocus":"surround","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),

  ('badge_sello_club', 'Insignia Sello Club', 'Sello compacto que se ve bien encima de una foto sin saturarla.', 'common', 'badge', 14, 380, '{"icon":"shield","badgeVariant":"club","photoFocus":"direct","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('badge_destello_flash', 'Insignia Destello Flash', 'Insignia brillante para una foto con personalidad mas agresiva.', 'rare', 'badge', 22, 390, '{"icon":"star","badgeVariant":"flash","photoFocus":"direct","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('badge_lente_competitiva', 'Insignia Lente Competitiva', 'Insignia de enfoque para perfiles que quieren verse mas serios y top.', 'rare', 'badge', 24, 400, '{"icon":"medal","badgeVariant":"lens","photoFocus":"direct","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),

  ('effect_halo_suave', 'Halo Suave', 'Efecto ligero alrededor de la foto para mejorar la lectura del perfil.', 'common', 'effect', 18, 410, '{"glow":"pearl","effectVariant":"halo","photoFocus":"surround","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('effect_destello_estudio', 'Destello Estudio', 'Brillo mas frio para retratos que necesitan un borde visual extra.', 'rare', 'effect', 26, 420, '{"glow":"cyan","effectVariant":"sparkle","photoFocus":"surround","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb),
  ('effect_bokeh_dorado', 'Bokeh Dorado', 'Efecto premium con profundidad visual para que tu foto se sienta mas cara.', 'epic', 'effect', 36, 430, '{"glow":"gold","effectVariant":"bokeh","photoFocus":"surround","unlockType":"purchase","unlockHint":"Disponible para comprar con monedas."}'::jsonb)
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
