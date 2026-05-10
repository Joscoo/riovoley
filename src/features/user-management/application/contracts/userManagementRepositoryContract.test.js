const { assertUserManagementRepository } = require('./userManagementRepositoryContract');
const { UserManagementError } = require('../../domain/userManagementError');

describe('assertUserManagementRepository', () => {
  const buildValidRepository = () => ({
    listAthletes: jest.fn(),
    listTrainers: jest.fn(),
    listAdministrators: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    suspendUser: jest.fn(),
    reactivateUser: jest.fn(),
    resendCredentials: jest.fn(),
    changeRole: jest.fn(),
  });

  it('no lanza error cuando repositorio es valido', () => {
    expect(() => assertUserManagementRepository(buildValidRepository())).not.toThrow();
  });

  it('lanza UserManagementError cuando repository es invalido', () => {
    expect(() => assertUserManagementRepository(null)).toThrow(UserManagementError);
  });

  it('lanza UserManagementError cuando faltan metodos requeridos', () => {
    const incompleteRepository = {
      listAthletes: jest.fn(),
      listTrainers: jest.fn(),
    };

    expect(() => assertUserManagementRepository(incompleteRepository)).toThrow(UserManagementError);
    expect(() => assertUserManagementRepository(incompleteRepository)).toThrow(/incompleto/i);
  });
});
