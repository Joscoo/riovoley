-- Fase 30: Bucket de storage para assets de gamificación (cosméticos personalizados)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gamification-assets',
  'gamification-assets',
  true,
  2097152,  -- 2 MB max por archivo
  ARRAY['image/png','image/webp','image/jpeg','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png','image/webp','image/jpeg','image/gif'];

-- Lectura pública (URLs directas sin firma)
DROP POLICY IF EXISTS "Public read gamification assets" ON storage.objects;
CREATE POLICY "Public read gamification assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'gamification-assets');

-- Solo admins pueden subir/editar/eliminar
DROP POLICY IF EXISTS "Admin insert gamification assets" ON storage.objects;
CREATE POLICY "Admin insert gamification assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'gamification-assets' AND public.is_admin());

DROP POLICY IF EXISTS "Admin update gamification assets" ON storage.objects;
CREATE POLICY "Admin update gamification assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'gamification-assets' AND public.is_admin());

DROP POLICY IF EXISTS "Admin delete gamification assets" ON storage.objects;
CREATE POLICY "Admin delete gamification assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'gamification-assets' AND public.is_admin());
