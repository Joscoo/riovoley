jest.mock('../../../../utils/piiCrypto', () => ({
  __esModule: true,
  withEncryptedUserContactFields: jest.fn(async (payload) => ({
    ...payload,
    email_ciphertext: 'enc-email',
  })),
}));

jest.mock('../../../../utils/athleteValidation', () => ({
  __esModule: true,
  MIN_ATHLETE_AGE: 5,
  validateAthleteBirthDate: jest.fn(() => ({ isValid: true })),
}));

jest.mock('../../../../shared/infrastructure/auth/deleteAuthUserById', () => ({
  __esModule: true,
  deleteAuthUserById: jest.fn(),
}));

const { withEncryptedUserContactFields } = require('../../../../utils/piiCrypto');
const { validateAthleteBirthDate } = require('../../../../utils/athleteValidation');
const { deleteAuthUserById } = require('../../../../shared/infrastructure/auth/deleteAuthUserById');
const { createAthletesUseCases } = require('./createAthletesUseCases');

describe('createAthletesUseCases', () => {
  const buildRepository = () => ({
    listAthletes: jest.fn(),
    updateUser: jest.fn(),
    updateStudent: jest.fn(),
    deleteStudent: jest.fn(),
    deleteUser: jest.fn(),
    listStudentUserIds: jest.fn(),
    listStudentRoleUsers: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    validateAthleteBirthDate.mockReturnValue({ isValid: true });
    withEncryptedUserContactFields.mockImplementation(async (payload) => ({
      ...payload,
      email_ciphertext: 'enc-email',
    }));
  });

  it('loadAtletasUseCase construye view model de email, telefono y full_name', async () => {
    const repository = buildRepository();
    repository.listAthletes.mockResolvedValue([
      {
        id: 's1',
        users: { nombre: 'Ana', apellido: 'Perez', email: 'ana@demo.com', telefono: '099' },
      },
      {
        id: 's2',
        users: { nombre: '', apellido: '', email: null, telefono: null },
      },
    ]);
    const useCases = createAthletesUseCases(repository);

    const result = await useCases.loadAtletasUseCase.execute();

    expect(result[0]).toMatchObject({
      id: 's1',
      full_name: 'Ana Perez',
      email: 'ana@demo.com',
      telefono: '099',
    });
    expect(result[1]).toMatchObject({
      id: 's2',
      full_name: 'Atleta s2',
      email: 'No disponible',
      telefono: 'No disponible',
    });
  });

  it('updateAtletaUseCase valida edad y actualiza users + students', async () => {
    const repository = buildRepository();
    const useCases = createAthletesUseCases(repository);

    await useCases.updateAtletaUseCase.execute({
      editingAtleta: { id: 's1', user_id: 'u1' },
      formData: {
        email: 'ana@demo.com',
        nombre: 'Ana',
        apellido: 'Perez',
        telefono: '099',
        fecha_nacimiento: '2010-01-01',
        categoria: 'iniciacion_hombres',
      },
    });

    expect(validateAthleteBirthDate).toHaveBeenCalled();
    expect(withEncryptedUserContactFields).toHaveBeenCalled();
    expect(repository.updateUser).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ email_ciphertext: 'enc-email' })
    );
    expect(repository.updateStudent).toHaveBeenCalledWith('s1', {
      categoria: 'iniciacion_hombres',
      fecha_nacimiento: '2010-01-01',
    });
  });

  it('updateAtletaUseCase lanza error si validacion de edad falla', async () => {
    validateAthleteBirthDate.mockReturnValueOnce({ isValid: false, error: 'Edad invalida' });
    const repository = buildRepository();
    const useCases = createAthletesUseCases(repository);

    await expect(
      useCases.updateAtletaUseCase.execute({
        editingAtleta: { id: 's1', user_id: 'u1' },
        formData: { fecha_nacimiento: '2024-01-01' },
      })
    ).rejects.toThrow('Edad invalida');
  });

  it('deleteAtletaCompletelyUseCase elimina auth y registros locales', async () => {
    const repository = buildRepository();
    const useCases = createAthletesUseCases(repository);

    const result = await useCases.deleteAtletaCompletelyUseCase.execute({
      atleta: { id: 's1', user_id: 'u1' },
    });

    expect(deleteAuthUserById).toHaveBeenCalledWith('u1');
    expect(repository.deleteStudent).toHaveBeenCalledWith('s1');
    expect(repository.deleteUser).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ userDeletionError: null });
  });

  it('listOrphanUsersUseCase detecta usuarios estudiante sin relacion', async () => {
    const repository = buildRepository();
    repository.listStudentUserIds.mockResolvedValue([{ user_id: 'u1' }]);
    repository.listStudentRoleUsers.mockResolvedValue([
      { id: 'u1', email: 'ok@demo.com' },
      { id: 'u2', email: 'orphan@demo.com' },
    ]);
    const useCases = createAthletesUseCases(repository);

    const result = await useCases.listOrphanUsersUseCase.execute();

    expect(result).toEqual([{ id: 'u2', email: 'orphan@demo.com' }]);
  });

  it('validateAthleteFormUseCase valida campos obligatorios y formato', () => {
    const repository = buildRepository();
    const useCases = createAthletesUseCases(repository);

    const invalid = useCases.validateAthleteFormUseCase.execute({
      formData: { nombre: 'Ana', apellido: 'Perez', email: 'correo-invalido' },
    });
    const valid = useCases.validateAthleteFormUseCase.execute({
      formData: {
        nombre: 'Ana',
        apellido: 'Perez',
        email: 'ana@demo.com',
        fecha_nacimiento: '2010-01-01',
        categoria: 'iniciacion_hombres',
      },
    });

    expect(invalid).toEqual({ isValid: false, error: 'La fecha de nacimiento es requerida' });
    expect(valid).toEqual({ isValid: true, error: null });
  });

  it('filterAndSortAtletasUseCase filtra por busqueda/categoria y ordena', () => {
    const repository = buildRepository();
    const useCases = createAthletesUseCases(repository);

    const result = useCases.filterAndSortAtletasUseCase.execute({
      athletes: [
        {
          id: 's1',
          full_name: 'Ana Perez',
          categoria: 'iniciacion_hombres',
          email: 'ana@demo.com',
          users: { nombre: 'Ana', apellido: 'Perez', created_at: '2026-01-10' },
          fecha_nacimiento: '2010-01-01',
        },
        {
          id: 's2',
          full_name: 'Lia Vega',
          categoria: 'master_mujeres',
          email: 'lia@demo.com',
          users: { nombre: 'Lia', apellido: 'Vega', created_at: '2026-02-10' },
          fecha_nacimiento: '2011-01-01',
        },
      ],
      filters: {
        categoria: 'master_mujeres',
        search: 'lia',
        sortBy: 'apellido',
        sortOrder: 'asc',
      },
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s2');
  });

  it('paginateAtletasUseCase devuelve pagina valida y total', () => {
    const repository = buildRepository();
    const useCases = createAthletesUseCases(repository);

    const result = useCases.paginateAtletasUseCase.execute({
      athletes: [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
      page: 3,
      pageSize: 2,
    });

    expect(result.totalPages).toBe(2);
    expect(result.currentPage).toBe(2);
    expect(result.paginated).toEqual([{ id: 's3' }]);
  });

  it('use cases de formato devuelven edad, categoria e ingreso', () => {
    const repository = buildRepository();
    const useCases = createAthletesUseCases(repository);

    const age = useCases.calculateAthleteAgeDisplayUseCase.execute({ birthDate: '2010-01-01' });
    const categoria = useCases.formatCategoriaUseCase.execute({ categoria: 'master_mujeres' });
    const ingreso = useCases.formatIngresoDateUseCase.execute({
      athlete: { users: { created_at: '2026-01-15T00:00:00.000Z' } },
    });

    expect(typeof age === 'number' || age === '--').toBe(true);
    expect(categoria).toBe('MASTER MUJERES');
    expect(ingreso).not.toBe('No registrado');
  });
});
