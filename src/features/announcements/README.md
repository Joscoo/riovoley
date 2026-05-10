# announcements

Feature clean-lite para anuncios administrativos y vista publica.

## Responsabilidades
- Gestionar CRUD y estado activo de anuncios desde panel admin.
- Cargar anuncios publicos por rol, prioridad y expiracion.
- Encapsular consultas a vistas/tablas `announcements*` en repositorio.

## Capas
- `application/useCases/createAnnouncementsUseCases.js`: reglas de orquestacion para admin y viewer.
- `presentation/createAnnouncementsService.js`: fachada del feature hacia UI.
- `domain/announcementsError.js`: error funcional del feature.
- `infrastructure/repositories/supabaseAnnouncementsRepository.js`: acceso a `announcements` y `announcements_with_creator`.

## Contrato publico
- `announcementsService.loadAdminAnnouncements({ filters })`
- `announcementsService.saveAnnouncement({ editingAnuncio, formData, userId })`
- `announcementsService.toggleAnnouncementActive({ anuncio })`
- `announcementsService.removeAnnouncement({ announcementId })`
- `announcementsService.loadViewerAnnouncements({ userRole, selectedPriority, limit })`

