import { createAnnouncementsUseCases } from '../application/useCases/createAnnouncementsUseCases';
import { SupabaseAnnouncementsRepository } from '../infrastructure/repositories/supabaseAnnouncementsRepository';

export const createAnnouncementsService = (repository = new SupabaseAnnouncementsRepository()) => {
  const useCases = createAnnouncementsUseCases(repository);

  const loadAdminAnnouncements = async ({ filters }) =>
    useCases.loadAdminAnnouncementsUseCase.execute({ filters });
  const saveAnnouncement = async ({ editingAnuncio, formData, userId }) =>
    useCases.saveAnnouncementUseCase.execute({ editingAnuncio, formData, userId });
  const toggleAnnouncementActive = async ({ anuncio }) =>
    useCases.toggleAnnouncementActiveUseCase.execute({ anuncio });
  const removeAnnouncement = async ({ announcementId }) =>
    useCases.removeAnnouncementUseCase.execute({ announcementId });
  const loadViewerAnnouncements = async ({ userRole, selectedPriority, limit }) =>
    useCases.loadViewerAnnouncementsUseCase.execute({ userRole, selectedPriority, limit });

  return {
    loadAdminAnnouncements,
    saveAnnouncement,
    toggleAnnouncementActive,
    removeAnnouncement,
    loadViewerAnnouncements,
  };
};
