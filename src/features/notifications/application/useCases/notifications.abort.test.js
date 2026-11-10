jest.mock('../../../../config/supabase', () => ({ supabase: {} }));
const { createNotificationsUseCases } = require('./createNotificationsUseCases');
const { createNotificationsService } = require('../../presentation/createNotificationsService');
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const repository = () => ({
  listPaymentsForNotifications: jest.fn().mockResolvedValue([]),
  listStudentsByIds: jest.fn().mockResolvedValue([]),
  listRecentActiveAnnouncements: jest.fn().mockResolvedValue([]),
  listRecentGamificationAchievements: jest.fn().mockResolvedValue([]),
  listNotificationInboxState: jest.fn().mockResolvedValue([]),
});
test('el servicio propaga una señal cancelada y no inicia lecturas', async () => {
  const repo = repository(), controller = new AbortController(); controller.abort();
  await expect(createNotificationsService(repo).loadBellNotifications({ userId: 'fixture', signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  expect(repo.listPaymentsForNotifications).not.toHaveBeenCalled();
});
test('cancelar durante pagos evita consultar estudiantes y siguientes etapas', async () => {
  const repo = repository(), pending = deferred(), controller = new AbortController();
  repo.listPaymentsForNotifications.mockReturnValue(pending.promise);
  const result = createNotificationsUseCases(repo).loadBellNotificationsUseCase.execute({ userId: 'fixture', signal: controller.signal });
  controller.abort(); pending.resolve([]);
  await expect(result).rejects.toMatchObject({ name: 'AbortError' });
  expect(repo.listStudentsByIds).not.toHaveBeenCalled();
  expect(repo.listRecentActiveAnnouncements).not.toHaveBeenCalled();
});
test('cancelar con anuncios pendientes evita logros e inbox posteriores', async () => {
  const repo = repository(), pending = deferred(), reached = deferred(), controller = new AbortController();
  repo.listRecentActiveAnnouncements.mockImplementation(() => { reached.resolve(); return pending.promise; });
  const result = createNotificationsUseCases(repo).loadBellNotificationsUseCase.execute({ userId: 'fixture', signal: controller.signal });
  await reached.promise; controller.abort(); pending.resolve([]);
  await expect(result).rejects.toMatchObject({ name: 'AbortError' });
  expect(repo.listRecentGamificationAchievements).not.toHaveBeenCalled();
  expect(repo.listNotificationInboxState).not.toHaveBeenCalled();
});
test('cancelar entre el helper de pagos y su consumidor evita iniciar anuncios', async () => {
  const repo = repository(), controller = new AbortController();
  repo.listStudentsByIds.mockImplementation(() => {
    queueMicrotask(() => queueMicrotask(() => controller.abort()));
    return Promise.resolve([]);
  });
  await expect(createNotificationsUseCases(repo).loadBellNotificationsUseCase.execute({ userId: 'fixture', signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  expect(repo.listRecentActiveAnnouncements).not.toHaveBeenCalled();
});
test('una carga activa conserva anuncios y consulta logros e inbox', async () => {
  const repo = repository(), controller = new AbortController();
  repo.listRecentActiveAnnouncements.mockResolvedValue([{ id: 'active', title: 'Aviso vigente', content: 'Contenido ficticio', created_at: '2026-11-05' }]);
  const result = await createNotificationsUseCases(repo).loadBellNotificationsUseCase.execute({ userId: 'fixture', signal: controller.signal });
  expect(result).toEqual([expect.objectContaining({ id: 'anuncio-active', mensaje: 'Aviso vigente' })]);
  expect(repo.listRecentGamificationAchievements).toHaveBeenCalledTimes(1);
  expect(repo.listNotificationInboxState).toHaveBeenCalledTimes(1);
});
