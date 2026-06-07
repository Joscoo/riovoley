import { resolveNotificationRoute } from './push';

describe('resolveNotificationRoute', () => {
  it('prefers explicit route from payload', () => {
    expect(resolveNotificationRoute({ route: '/entrenador?section=anuncios' })).toBe('/entrenador?section=anuncios');
  });

  it('routes announcements to the role specific announcements section', () => {
    expect(resolveNotificationRoute({ type: 'announcement', user_role: 'administrador' })).toBe('/admin?section=anuncios');
    expect(resolveNotificationRoute({ type: 'announcement', user_role: 'entrenador' })).toBe('/entrenador?section=anuncios');
    expect(resolveNotificationRoute({ type: 'announcement', user_role: 'estudiante' })).toBe('/estudiante?section=anuncios');
  });

  it('falls back to student monthly section for payment reminders', () => {
    expect(resolveNotificationRoute({ type: 'payment_reminder' })).toBe('/estudiante?section=mensualidad');
  });

  it('routes payment reminders to admin and trainer payments sections when role is present', () => {
    expect(resolveNotificationRoute({ type: 'payment_reminder', user_role: 'administrador' })).toBe('/admin?section=pagos');
    expect(resolveNotificationRoute({ type: 'payment_reminder', user_role: 'entrenador' })).toBe('/entrenador?section=pagos');
  });

  it('routes gamification notifications to progress section', () => {
    expect(resolveNotificationRoute({ type: 'gamification_progress' })).toBe('/estudiante?section=progreso');
    expect(resolveNotificationRoute({ type: 'achievement_unlocked', user_role: 'entrenador' })).toBe('/entrenador?section=progreso');
  });

  it('falls back to home when no route can be resolved', () => {
    expect(resolveNotificationRoute({ type: 'unknown' })).toBe('/');
  });
});
