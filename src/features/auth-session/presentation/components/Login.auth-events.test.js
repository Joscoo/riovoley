import { render, screen, waitFor } from '@testing-library/react';
import Login from './Login';

const mockNavigate = jest.fn();
const mockSubscription = { unsubscribe: jest.fn() };

var mockAuthSessionService;

jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => mockNavigate
  }),
  { virtual: true }
);

jest.mock('../../authSessionService', () => ({
  authSessionService:
    mockAuthSessionService ||
    (mockAuthSessionService = {
      onAuthStateChange: jest.fn(),
      getCurrentUser: jest.fn(),
      checkFirstLogin: jest.fn(),
      getUserRole: jest.fn(),
      updateLastLogin: jest.fn(),
      checkLoginAllowed: jest.fn(),
      recordLoginAttempt: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      requestPasswordReset: jest.fn(),
      exchangeCodeForSession: jest.fn(),
      setRecoverySession: jest.fn(),
      getSession: jest.fn(),
      updatePassword: jest.fn(),
      markFirstLoginCompleted: jest.fn()
    })
}));

jest.mock('../../../auth-profile', () => ({
  useUserProfile: () => ({ profile: null })
}));

jest.mock('./ChangePasswordModal', () => () => (
  <div data-testid="change-password-modal">Cambio de Contraseña Obligatorio</div>
));

describe('Login auth events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthSessionService.onAuthStateChange.mockReturnValue({
      data: { subscription: mockSubscription }
    });
    mockAuthSessionService.getCurrentUser.mockResolvedValue(null);
    mockAuthSessionService.checkFirstLogin.mockResolvedValue(null);
  });

  test('registra un callback sincrono y difiere checkFirstLogin', async () => {
    render(<Login />);

    const listener = mockAuthSessionService.onAuthStateChange.mock.calls[0][0];
    const result = listener('SIGNED_IN', { user: { id: 'u1', email: 'user@test.com' } });

    expect(result).toBeUndefined();
    expect(mockAuthSessionService.checkFirstLogin).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(mockAuthSessionService.checkFirstLogin).toHaveBeenCalledWith('u1');
    });
  });

  test('USER_UPDATED no reabre flujo de primer ingreso', async () => {
    mockAuthSessionService.checkFirstLogin.mockResolvedValueOnce({
      id: 'u1',
      first_login: true,
      nombre: 'Test',
      apellido: 'User'
    });

    render(<Login />);
    const listener = mockAuthSessionService.onAuthStateChange.mock.calls[0][0];

    listener('SIGNED_IN', { user: { id: 'u1', email: 'user@test.com' } });

    await waitFor(() => {
      expect(screen.getByTestId('change-password-modal')).toBeInTheDocument();
    });
    expect(mockAuthSessionService.checkFirstLogin).toHaveBeenCalledTimes(1);

    listener('USER_UPDATED', { user: { id: 'u1', email: 'user@test.com' } });

    await waitFor(() => {
      expect(screen.queryByTestId('change-password-modal')).not.toBeInTheDocument();
    });
    expect(mockAuthSessionService.checkFirstLogin).toHaveBeenCalledTimes(1);
  });
});
