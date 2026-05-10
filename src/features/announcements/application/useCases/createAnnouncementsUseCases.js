import { getEcuadorISOString } from '../../../../utils/dateUtils';

export const createAnnouncementsUseCases = (repository) => {
  const loadAdminAnnouncementsUseCase = {
    execute: async ({ filters }) => repository.listAdminAnnouncements(filters),
  };

  const saveAnnouncementUseCase = {
    execute: async ({ editingAnuncio, formData, userId }) => {
      const anuncioData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        priority: formData.priority,
        target_audience: formData.target_audience,
        is_active: formData.is_active,
        expires_at: formData.expires_at || null,
      };

      if (editingAnuncio) {
        await repository.updateAnnouncement(editingAnuncio.id, anuncioData);
        return { mode: 'updated' };
      }

      await repository.createAnnouncement({
        ...anuncioData,
        created_by: userId,
      });
      return { mode: 'created' };
    },
  };

  const toggleAnnouncementActiveUseCase = {
    execute: async ({ anuncio }) => {
      await repository.updateAnnouncement(anuncio.id, { is_active: !anuncio.is_active });
      return { active: !anuncio.is_active };
    },
  };

  const removeAnnouncementUseCase = {
    execute: async ({ announcementId }) => repository.deleteAnnouncement(announcementId),
  };

  const loadViewerAnnouncementsUseCase = {
    execute: async ({ userRole, selectedPriority, limit }) =>
      repository.listViewerAnnouncements({
        userRole,
        selectedPriority,
        limit,
        nowIso: getEcuadorISOString(),
      }),
  };

  return {
    loadAdminAnnouncementsUseCase,
    saveAnnouncementUseCase,
    toggleAnnouncementActiveUseCase,
    removeAnnouncementUseCase,
    loadViewerAnnouncementsUseCase,
  };
};
