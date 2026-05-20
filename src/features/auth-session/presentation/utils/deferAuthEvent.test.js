import { deferAuthEvent } from './deferAuthEvent';

describe('deferAuthEvent', () => {
  test('retorna callback sincrono y difiere ejecucion del handler', async () => {
    const handler = jest.fn();
    const scheduler = jest.fn((callback) => callback());
    const deferred = deferAuthEvent(handler, scheduler);

    const result = deferred('SIGNED_IN', { user: { id: 'u1' } });
    await Promise.resolve();
    await Promise.resolve();

    expect(result).toBeUndefined();
    expect(scheduler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('SIGNED_IN', { user: { id: 'u1' } });
  });

  test('captura errores del handler sin romper el callback', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const scheduler = jest.fn((callback) => callback());
    const deferred = deferAuthEvent(() => {
      throw new Error('boom');
    }, scheduler);

    deferred('USER_UPDATED', { user: { id: 'u1' } });
    await Promise.resolve();
    await Promise.resolve();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
