process.env.REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://example.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'test-anon-key';

jest.mock('../application/useCases/createSchedulesUseCases', () => ({
  __esModule: true,
  createSchedulesUseCases: jest.fn(),
}));

const { createSchedulesUseCases } = require('../application/useCases/createSchedulesUseCases');
const { createSchedulesService } = require('./createSchedulesService');

describe('createSchedulesService', () => {
  const mockLoad = jest.fn();
  const mockUpdate = jest.fn();
  const mockCreate = jest.fn();
  const mockDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    createSchedulesUseCases.mockReturnValue({
      loadHorariosUseCase: { execute: mockLoad },
      updateHorarioUseCase: { execute: mockUpdate },
      createHorariosUseCase: { execute: mockCreate },
      deleteHorarioUseCase: { execute: mockDelete },
    });
  });

  it('createHorarios delega argumentos', async () => {
    mockCreate.mockResolvedValueOnce({ totalCreados: 2, descripcionOmitida: false });
    const service = createSchedulesService({});

    const payload = {
      diasParaCrear: ['lunes'],
      categorias: ['a', 'b'],
      hora_inicio: '08:00',
      hora_fin: '09:00',
      descripcionResolver: () => 'x',
    };
    const result = await service.createHorarios(payload);

    expect(mockCreate).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ totalCreados: 2, descripcionOmitida: false });
  });
});
