process.env.REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://example.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'test-anon-key';

jest.mock('../application/useCases/createTrainerManagementUseCases', () => ({
  __esModule: true,
  createTrainerManagementUseCases: jest.fn(),
}));

const { createTrainerManagementUseCases } = require('../application/useCases/createTrainerManagementUseCases');
const { createTrainerManagementService } = require('./createTrainerManagementService');

describe('createTrainerManagementService', () => {
  const mockLoadExecute = jest.fn();
  const mockSaveExecute = jest.fn();
  const mockDeleteExecute = jest.fn();

  beforeEach(() => {
    mockLoadExecute.mockReset();
    mockSaveExecute.mockReset();
    mockDeleteExecute.mockReset();
    createTrainerManagementUseCases.mockReset();
    createTrainerManagementUseCases.mockReturnValue({
      loadEntrenadoresUseCase: { execute: mockLoadExecute },
      saveEntrenadorUseCase: { execute: mockSaveExecute },
      deleteEntrenadorUseCase: { execute: mockDeleteExecute },
    });
  });

  it('loadEntrenadores delega en loadEntrenadoresUseCase', async () => {
    mockLoadExecute.mockResolvedValueOnce([{ id: 't1' }]);
    const service = createTrainerManagementService({});

    const result = await service.loadEntrenadores();

    expect(mockLoadExecute).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 't1' }]);
  });

  it('saveEntrenador delega payload al use case', async () => {
    mockSaveExecute.mockResolvedValueOnce({ mode: 'updated' });
    const service = createTrainerManagementService({});

    const payload = {
      editingEntrenador: { id: 't1' },
      formData: { nombre: 'Ana' },
    };
    const result = await service.saveEntrenador(payload);

    expect(mockSaveExecute).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ mode: 'updated' });
  });

  it('deleteEntrenador delega trainerId al use case', async () => {
    mockDeleteExecute.mockResolvedValueOnce(undefined);
    const service = createTrainerManagementService({});

    await service.deleteEntrenador({ trainerId: 't1' });

    expect(mockDeleteExecute).toHaveBeenCalledWith({ trainerId: 't1' });
  });
});
