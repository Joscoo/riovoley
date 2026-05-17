process.env.REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://example.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'test-anon-key';

const mockLoadExecute = jest.fn();
const mockUpdateExecute = jest.fn();
const mockValidateFormExecute = jest.fn();
const mockFilterSortExecute = jest.fn();
const mockPaginateExecute = jest.fn();
const mockAgeDisplayExecute = jest.fn();
const mockFormatIngresoExecute = jest.fn();
const mockFormatCategoriaExecute = jest.fn();
const mockDeleteRecordsExecute = jest.fn();
const mockDeleteCompleteExecute = jest.fn();
const mockListOrphansExecute = jest.fn();
const mockCleanOrphansExecute = jest.fn();
const mockDeleteUserRecordExecute = jest.fn();

jest.mock('../application/useCases/createAthletesUseCases', () => ({
  __esModule: true,
  createAthletesUseCases: jest.fn(),
}));

const { createAthletesUseCases } = require('../application/useCases/createAthletesUseCases');
const { createAthletesService } = require('./createAthletesService');

describe('createAthletesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createAthletesUseCases.mockReturnValue({
      loadAtletasUseCase: { execute: mockLoadExecute },
      updateAtletaUseCase: { execute: mockUpdateExecute },
      validateAthleteFormUseCase: { execute: mockValidateFormExecute },
      filterAndSortAtletasUseCase: { execute: mockFilterSortExecute },
      paginateAtletasUseCase: { execute: mockPaginateExecute },
      calculateAthleteAgeDisplayUseCase: { execute: mockAgeDisplayExecute },
      formatIngresoDateUseCase: { execute: mockFormatIngresoExecute },
      formatCategoriaUseCase: { execute: mockFormatCategoriaExecute },
      deleteAtletaRecordsUseCase: { execute: mockDeleteRecordsExecute },
      deleteAtletaCompletelyUseCase: { execute: mockDeleteCompleteExecute },
      listOrphanUsersUseCase: { execute: mockListOrphansExecute },
      cleanOrphanUsersUseCase: { execute: mockCleanOrphansExecute },
      deleteUserRecordUseCase: { execute: mockDeleteUserRecordExecute },
    });
  });

  it('loadAtletas delega a loadAtletasUseCase', async () => {
    mockLoadExecute.mockResolvedValueOnce([{ id: 's1' }]);
    const service = createAthletesService({});

    const result = await service.loadAtletas();

    expect(mockLoadExecute).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 's1' }]);
  });

  it('updateAtleta delega payload al use case', async () => {
    const service = createAthletesService({});
    const payload = {
      editingAtleta: { id: 's1' },
      formData: { nombre: 'Ana' },
    };

    await service.updateAtleta(payload);

    expect(mockUpdateExecute).toHaveBeenCalledWith(payload);
  });

  it('cleanOrphanUsers delega a cleanOrphanUsersUseCase', async () => {
    mockCleanOrphansExecute.mockResolvedValueOnce({ deletedCount: 1, failedCount: 0 });
    const service = createAthletesService({});

    const result = await service.cleanOrphanUsers();

    expect(mockCleanOrphansExecute).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ deletedCount: 1, failedCount: 0 });
  });

  it('filterAndSortAtletas delega payload', () => {
    mockFilterSortExecute.mockReturnValueOnce([{ id: 's1' }]);
    const service = createAthletesService({});

    const result = service.filterAndSortAtletas({
      athletes: [{ id: 's1' }],
      filters: { search: 'ana' },
    });

    expect(mockFilterSortExecute).toHaveBeenCalledWith({
      athletes: [{ id: 's1' }],
      filters: { search: 'ana' },
    });
    expect(result).toEqual([{ id: 's1' }]);
  });

  it('formatCategoria delega payload', () => {
    mockFormatCategoriaExecute.mockReturnValueOnce('MASTER MUJERES');
    const service = createAthletesService({});

    const result = service.formatCategoria({ categoria: 'master_mujeres' });

    expect(mockFormatCategoriaExecute).toHaveBeenCalledWith({ categoria: 'master_mujeres' });
    expect(result).toBe('MASTER MUJERES');
  });
});
