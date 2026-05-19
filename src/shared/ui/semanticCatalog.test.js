import { semanticCatalog, getRoleLabel, getUserTypeLabel } from './semanticCatalog';

describe('semanticCatalog', () => {
  it('returns canonical role labels', () => {
    expect(getRoleLabel('estudiante')).toBe('Estudiante');
    expect(getRoleLabel('usuario')).toBe('Estudiante');
    expect(getRoleLabel('administrador')).toBe('Administrador');
  });

  it('returns canonical user type labels', () => {
    expect(getUserTypeLabel('atleta')).toBe('Estudiante');
    expect(getUserTypeLabel('entrenador')).toBe('Entrenador');
  });

  it('exposes stable UI labels', () => {
    expect(semanticCatalog.UI_LABELS.usersManagementTitle).toBe('Gestión de Usuarios');
  });
});
