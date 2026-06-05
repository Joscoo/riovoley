import { resolveNotificationRoute } from './push';

describe('resolveNotificationRoute', () => {
  it('prefers explicit route from payload', () => {
    expect(resolveNotificationRoute({ route: '/entrenador?section=anuncios' })).toBe('/entrenador?section=anuncios');
  });

  it('falls back to student monthly section for payment reminders', () => {
    expect(resolveNotificationRoute({ type: 'payment_reminder' })).toBe('/estudiante?section=mensualidad');
  });

  it('falls back to home when no route can be resolved', () => {
    expect(resolveNotificationRoute({ type: 'unknown' })).toBe('/');
  });
});
