# Features

Este directorio contiene módulos verticales por dominio funcional siguiendo Clean Lite por feature.

- Cada feature expone su API pública en `index.js`.
- La UI solo consume casos de uso/servicios de feature; no accede a `supabase` directo.
- Para iniciar un nuevo feature, usar la plantilla en `src/features/_templates/feature`.
