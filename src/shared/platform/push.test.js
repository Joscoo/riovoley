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
    expect(resolveNotificationRoute({ type: 'payment_registered' })).toBe('/estudiante?section=mensualidad');
    expect(resolveNotificationRoute({ type: 'payment_overdue' })).toBe('/estudiante?section=mensualidad');
  });

  it('routes payment reminders to admin and trainer payments sections when role is present', () => {
    expect(resolveNotificationRoute({ type: 'payment_reminder', user_role: 'administrador' })).toBe('/admin?section=pagos');
    expect(resolveNotificationRoute({ type: 'payment_reminder', user_role: 'entrenador' })).toBe('/entrenador?section=pagos');
  });

  it('routes gamification notifications to progress section', () => {
    expect(resolveNotificationRoute({ type: 'gamification_progress' })).toBe('/estudiante?section=progreso');
    expect(resolveNotificationRoute({ type: 'achievement_unlocked', user_role: 'entrenador' })).toBe('/entrenador?section=progreso');
    expect(resolveNotificationRoute({ type: 'challenge_completed' })).toBe('/estudiante?section=progreso');
    expect(resolveNotificationRoute({ type: 'level_up' })).toBe('/estudiante?section=progreso');
  });

  it('routes attendance notifications to the attendance section', () => {
    expect(resolveNotificationRoute({ type: 'attendance_recorded' })).toBe('/estudiante?section=asistencias');
    expect(resolveNotificationRoute({ type: 'attendance_recorded', user_role: 'administrador' })).toBe('/admin?section=asistencias');
  });

  it('falls back to home when no route can be resolved', () => {
    expect(resolveNotificationRoute({ type: 'unknown' })).toBe('/');
  });
});
