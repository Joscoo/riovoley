import { iconRegistry, getRoleIcon, getUserTypeIcon } from './iconRegistry';

describe('iconRegistry', () => {
  it('resolves role icons for known roles', () => {
    expect(getRoleIcon('estudiante')).toBe(iconRegistry.roles.estudiante);
    expect(getRoleIcon('entrenador')).toBe(iconRegistry.roles.entrenador);
    expect(getRoleIcon('administrador')).toBe(iconRegistry.roles.administrador);
  });

  it('resolves user type icon for atleta as student icon', () => {
    expect(getUserTypeIcon('atleta')).toBe(iconRegistry.roles.estudiante);
  });

  it('falls back to user icon for unknown values', () => {
    expect(getRoleIcon('desconocido')).toBe(iconRegistry.user);
  });
});
