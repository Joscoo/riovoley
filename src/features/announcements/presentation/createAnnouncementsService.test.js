jest.mock('../infrastructure/repositories/supabaseAnnouncementsRepository', () => ({
  __esModule: true,
  SupabaseAnnouncementsRepository: jest.fn().mockImplementation(() => ({
    listAdminAnnouncements: jest.fn(),
    createAnnouncement: jest.fn(),
    updateAnnouncement: jest.fn(),
    deleteAnnouncement: jest.fn(),
    listViewerAnnouncements: jest.fn(),
  })),
}));

const { createAnnouncementsService } = require('./createAnnouncementsService');

describe('createAnnouncementsService', () => {
  const buildRepository = () => ({
    listAdminAnnouncements: jest.fn(),
    createAnnouncement: jest.fn(),
    updateAnnouncement: jest.fn(),
    deleteAnnouncement: jest.fn(),
    listViewerAnnouncements: jest.fn(),
  });

  it('loadAdminAnnouncements delega al repositorio via use case', async () => {
    const repository = buildRepository();
    repository.listAdminAnnouncements.mockResolvedValue([{ id: 'a1' }]);
    const service = createAnnouncementsService(repository);

    const result = await service.loadAdminAnnouncements({
      filters: { priority: 'high', is_active: 'true', search: 'torneo' },
    });

    expect(repository.listAdminAnnouncements).toHaveBeenCalledWith({
      priority: 'high',
      is_active: 'true',
      search: 'torneo',
    });
    expect(result).toEqual([{ id: 'a1' }]);
  });

  it('removeAnnouncement delega announcementId al repositorio', async () => {
    const repository = buildRepository();
    const service = createAnnouncementsService(repository);

    await service.removeAnnouncement({ announcementId: 'a1' });

    expect(repository.deleteAnnouncement).toHaveBeenCalledWith('a1');
  });
});
