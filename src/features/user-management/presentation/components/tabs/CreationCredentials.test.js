import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AthletesTab from './AthletesTab';
import TrainersTab from './TrainersTab';
import AdministratorsTab from './AdministratorsTab';
import { userManagementService } from '../../../userManagementService';
import { communicationsService } from '../../../../communications';

const mockFormData = { email: 'new@example.com', nombre: 'Nuevo', apellido: 'Usuario', send_credentials_on_create: true };
jest.mock('../shared/UserForm', () => ({ onSubmit }) => <button onClick={() => onSubmit(mockFormData)}>Confirmar creación</button>);
jest.mock('../hooks/useUserPermissions', () => ({ useUserPermissions: () => ({ canCreate: true }) }));
jest.mock('../../../userManagementService', () => ({ userManagementService: {
  listAthletes: jest.fn(async () => []), listTrainers: jest.fn(async () => []), listAdministrators: jest.fn(async () => []),
  filterAthletes: () => [], filterTrainers: () => [], filterAdministrators: () => [],
  paginateUsers: () => ({ totalPages: 1, currentPage: 1, paginated: [] }),
  buildAthletesStats: () => ({ byCategory: {} }), buildTrainersStats: () => ({}), buildAdministratorsStats: () => ({}),
  performAction: jest.fn(),
} }));
jest.mock('../../../../communications', () => ({ communicationsService: { sendCredentials: jest.fn() } }));
jest.mock('../../../../training-categories', () => ({ trainingCategoriesService: { listStudentCategories: async () => [] } }));

beforeEach(() => {
  jest.clearAllMocks();
  mockFormData.send_credentials_on_create = true;
  userManagementService.performAction.mockResolvedValue({
    success: true, credentials: { email: mockFormData.email, password: 'Generated123!', loginUrl: 'https://example.com/login' },
  });
  communicationsService.sendCredentials.mockResolvedValue({ success: false, error: 'Proveedor no disponible' });
});

it.each([
  ['Estudiante', AthletesTab], ['Entrenador', TrainersTab], ['Administrador', AdministratorsTab],
])('conserva credenciales al fallar el envío inicial de %s', async (label, Tab) => {
  render(<Tab userRole="administrador" />);
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`Agregar ${label}`) }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar creación' }));
  await waitFor(() => expect(screen.getByText('Generated123!')).toBeInTheDocument());
  await waitFor(() => expect(screen.getByText(/Proveedor no disponible/)).toBeInTheDocument());
  expect(communicationsService.sendCredentials).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: /Reintentar envío/i }));
  await waitFor(() => expect(communicationsService.sendCredentials).toHaveBeenCalledTimes(2));
  expect(userManagementService.performAction).toHaveBeenCalledTimes(1);
  expect(communicationsService.sendCredentials.mock.calls[1][0].password).toBe('Generated123!');
});

it('la entrega manual muestra la contraseña sin enviar correo ni generar otra', async () => {
  mockFormData.send_credentials_on_create = false;
  render(<TrainersTab userRole="administrador" />);
  fireEvent.click(screen.getByRole('button', { name: /Agregar Entrenador/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar creación' }));
  await waitFor(() => expect(screen.getByText('Generated123!')).toBeInTheDocument());
  expect(communicationsService.sendCredentials).not.toHaveBeenCalled();
  expect(userManagementService.performAction).toHaveBeenCalledTimes(1);
});
