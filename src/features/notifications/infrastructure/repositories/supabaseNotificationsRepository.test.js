jest.mock('../../../../config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = require('../../../../config/supabase');
const { NotificationsError } = require('../../domain/notificationsError');
const { SupabaseNotificationsRepository } = require('./supabaseNotificationsRepository');

const createQueryBuilder = (result) => {
  const builder = {
    select: jest.fn(() => builder),
    is: jest.fn(() => builder),
    order: jest.fn(() => builder),
    in: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    upsert: jest.fn(() => builder),
    single: jest.fn(() => Promise.resolve(result)),
    limit: jest.fn(() => Promise.resolve(result)),
    then: (resolve) => resolve(result),
  };
  return builder;
};

describe('SupabaseNotificationsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listPaymentsForNotifications retorna data cuando consulta es exitosa', async () => {
    const builder = createQueryBuilder({
      data: [{ student_id: 'st-1', fecha_fin: '2026-05-31' }],
      error: null,
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabaseNotificationsRepository();
    const result = await repository.listPaymentsForNotifications();

    expect(supabase.from).toHaveBeenCalledWith('payments');
    expect(builder.order).toHaveBeenCalledWith('fecha_fin', { ascending: false });
    expect(result).toHaveLength(1);
  });

  it('listStudentsByIds retorna [] cuando no hay ids', async () => {
    const repository = new SupabaseNotificationsRepository();
    const result = await repository.listStudentsByIds([]);

    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('listStudentsByIds lanza NotificationsError cuando supabase falla', async () => {
    const builder = createQueryBuilder({
      data: null,
      error: { message: 'students failed' },
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabaseNotificationsRepository();

    await expect(repository.listStudentsByIds(['st-1'])).rejects.toBeInstanceOf(NotificationsError);
    await expect(repository.listStudentsByIds(['st-1'])).rejects.toThrow('students failed');
  });

  it('listRecentActiveAnnouncements limita a 5 y retorna data', async () => {
    const builder = createQueryBuilder({
      data: [{ id: 1, title: 'Anuncio' }],
      error: null,
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabaseNotificationsRepository();
    const result = await repository.listRecentActiveAnnouncements('2026-05-01');

    expect(builder.limit).toHaveBeenCalledWith(5);
    expect(result).toHaveLength(1);
  });

  it('listNotificationInboxState consulta por user y keys', async () => {
    const builder = createQueryBuilder({
      data: [{ notification_key: 'anuncio-a1', read_at: null, dismissed_at: null }],
      error: null,
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabaseNotificationsRepository();
    const result = await repository.listNotificationInboxState('u1', ['anuncio-a1']);

    expect(supabase.from).toHaveBeenCalledWith('user_notification_inbox_state');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(builder.in).toHaveBeenCalledWith('notification_key', ['anuncio-a1']);
    expect(result).toHaveLength(1);
  });

  it('markNotificationAsRead usa upsert por user y notification key', async () => {
    const builder = createQueryBuilder({
      data: { notification_key: 'anuncio-a1' },
      error: null,
    });
    supabase.from.mockReturnValue(builder);

    const repository = new SupabaseNotificationsRepository();
    await repository.markNotificationAsRead({
      userId: 'u1',
      notificationKey: 'anuncio-a1',
      notificationCategory: 'anuncios',
    });

    expect(builder.upsert).toHaveBeenCalled();
    expect(builder.single).toHaveBeenCalled();
  });
});
