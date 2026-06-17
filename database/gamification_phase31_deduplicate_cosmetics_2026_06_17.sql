-- Fase 31: Deduplicación de cosméticos
-- Elimina cosméticos que visualmente son idénticos a otros para asegurar que todos los disponibles sean distintos.

WITH ranked_items AS (
  SELECT slug,
         ROW_NUMBER() OVER(
           PARTITION BY category, 
             metadata->>'frameVariant', 
             metadata->>'backgroundVariant', 
             metadata->>'badgeVariant', 
             metadata->>'icon', 
             metadata->>'effectVariant'
           ORDER BY price_coins DESC, slug
         ) as rn
  FROM gamification.cosmetic_items_catalog
  WHERE category IN ('frame', 'background', 'badge', 'effect')
)
DELETE FROM gamification.cosmetic_items_catalog
WHERE slug IN (
  SELECT slug FROM ranked_items WHERE rn > 1
);
