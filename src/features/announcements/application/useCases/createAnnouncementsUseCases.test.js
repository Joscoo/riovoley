const { createAnnouncementsUseCases } = require('./createAnnouncementsUseCases');

describe('createAnnouncementsUseCases', () => {
  const buildRepository = () => ({
    listAdminAnnouncements: jest.fn(),
    createAnnouncement: jest.fn(),
    updateAnnouncement: jest.fn(),
    deleteAnnouncement: jest.fn(),
    listViewerAnnouncements: jest.fn(),
  });

  it('loadAdminAnnouncementsUseCase delega filtros al repositorio', async () => {
    const repository = buildRepository();
    repository.listAdminAnnouncements.mockResolvedValue([{ id: 'a1' }]);
    const useCases = createAnnouncementsUseCases(repository);

    const result = await useCases.loadAdminAnnouncementsUseCase.execute({
      filters: { priority: 'high', is_active: 'true', search: 'torneo' },
    });

    expect(repository.listAdminAnnouncements).toHaveBeenCalledWith({
      priority: 'high',
      is_active: 'true',
      search: 'torneo',
    });
    expect(result).toEqual([{ id: 'a1' }]);
  });

  it('saveAnnouncementUseCase actualiza cuando editingAnuncio existe', async () => {
    const repository = buildRepository();
    const useCases = createAnnouncementsUseCases(repository);

    const result = await useCases.saveAnnouncementUseCase.execute({
      editingAnuncio: { id: 'a1' },
      userId: 'u1',
      formData: {
        title: '  Titulo  ',
        content: '  Contenido  ',
        priority: 'high',
        target_audience: ['all'],
        is_active: true,
        expires_at: '',
      },
    });

    expect(repository.updateAnnouncement).toHaveBeenCalledWith('a1', {
      title: 'Titulo',
      content: 'Contenido',
      priority: 'high',
      target_audience: ['all'],
      is_active: true,
      expires_at: null,
    });
    expect(result).toEqual({ mode: 'updated' });
  });

  it('saveAnnouncementUseCase crea anuncio cuando es nuevo', async () => {
    const repository = buildRepository();
    const useCases = createAnnouncementsUseCases(repository);

    const result = await useCases.saveAnnouncementUseCase.execute({
      editingAnuncio: null,
      userId: 'u1',
      formData: {
        title: 'Nuevo',
        content: 'Comunicado',
        priority: 'medium',
        target_audience: ['estudiante'],
        is_active: true,
        expires_at: '2026-06-01',
      },
    });

    expect(repository.createAnnouncement).toHaveBeenCalledWith({
      title: 'Nuevo',
      content: 'Comunicado',
      priority: 'medium',
      target_audience: ['estudiante'],
      is_active: true,
      expires_at: '2026-06-01',
      created_by: 'u1',
    });
    expect(result).toEqual({ mode: 'created' });
  });

  it('toggleAnnouncementActiveUseCase alterna estado activo', async () => {
    const repository = buildRepository();
    const useCases = createAnnouncementsUseCases(repository);

    const result = await useCases.toggleAnnouncementActiveUseCase.execute({
      anuncio: { id: 'a1', is_active: false },
    });

    expect(repository.updateAnnouncement).toHaveBeenCalledWith('a1', { is_active: true });
    expect(result).toEqual({ active: true });
  });

  it('loadViewerAnnouncementsUseCase envia nowIso al repositorio', async () => {
    const repository = buildRepository();
    repository.listViewerAnnouncements.mockResolvedValue([{ id: 'a2' }]);
    const useCases = createAnnouncementsUseCases(repository);

    const result = await useCases.loadViewerAnnouncementsUseCase.execute({
      userRole: 'estudiante',
      selectedPriority: 'all',
      limit: 5,
    });

    expect(repository.listViewerAnnouncements).toHaveBeenCalledTimes(1);
    const payload = repository.listViewerAnnouncements.mock.calls[0][0];
    expect(payload).toMatchObject({
      userRole: 'estudiante',
      selectedPriority: 'all',
      limit: 5,
    });
    expect(typeof payload.nowIso).toBe('string');
    expect(result).toEqual([{ id: 'a2' }]);
  });
});
