process.env.REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://example.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'test-anon-key';

jest.mock('../application/useCases/createPhysicalTestsUseCases', () => ({
  __esModule: true,
  createPhysicalTestsUseCases: jest.fn(),
}));

jest.mock('../../gamification', () => ({
  gamificationService: {
    processPhysicalTestRecorded: jest.fn(),
  },
}));

const { createPhysicalTestsUseCases } = require('../application/useCases/createPhysicalTestsUseCases');
const { createPhysicalTestsService } = require('./createPhysicalTestsService');

describe('createPhysicalTestsService', () => {
  const mockLoadAtletas = jest.fn();
  const mockLoadTests = jest.fn();
  const mockCreate = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockBuildInitialForm = jest.fn();
  const mockBuildFormFromTest = jest.fn();
  const mockValidateTestForm = jest.fn();
  const mockCalculateStats = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    createPhysicalTestsUseCases.mockReturnValue({
      loadAtletasUseCase: { execute: mockLoadAtletas },
      loadTestsUseCase: { execute: mockLoadTests },
      createTestUseCase: { execute: mockCreate },
      updateTestUseCase: { execute: mockUpdate },
      deleteTestUseCase: { execute: mockDelete },
      buildInitialFormUseCase: { execute: mockBuildInitialForm },
      buildFormFromTestUseCase: { execute: mockBuildFormFromTest },
      validateTestFormUseCase: { execute: mockValidateTestForm },
      calculateStatsUseCase: { execute: mockCalculateStats },
    });
  });

  it('loadTests delega filtros al use case', async () => {
    mockLoadTests.mockResolvedValueOnce([{ id: 't1' }]);
    const service = createPhysicalTestsService({}, { gamificationService: { processPhysicalTestRecorded: jest.fn() } });

    const result = await service.loadTests({ filters: { search: 'ana' } });

    expect(mockLoadTests).toHaveBeenCalledWith({ filters: { search: 'ana' } });
    expect(result).toEqual([{ id: 't1' }]);
  });

  it('buildInitialForm delega al use case', () => {
    mockBuildInitialForm.mockReturnValueOnce({ fecha_test: '2026-05-17' });
    const service = createPhysicalTestsService({}, { gamificationService: { processPhysicalTestRecorded: jest.fn() } });

    const result = service.buildInitialForm();

    expect(mockBuildInitialForm).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ fecha_test: '2026-05-17' });
  });

  it('validateTestForm delega payload al use case', () => {
    mockValidateTestForm.mockReturnValueOnce({ ok: true });
    const service = createPhysicalTestsService({}, { gamificationService: { processPhysicalTestRecorded: jest.fn() } });

    const result = service.validateTestForm({
      formData: { student_id: 's1' },
      athletes: [{ id: 's1' }],
    });

    expect(mockValidateTestForm).toHaveBeenCalledWith({
      formData: { student_id: 's1' },
      athletes: [{ id: 's1' }],
    });
    expect(result).toEqual({ ok: true });
  });
});
