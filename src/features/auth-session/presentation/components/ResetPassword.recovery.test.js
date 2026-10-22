import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ResetPassword from './ResetPassword';
import { authSessionService } from '../../authSessionService';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('../../authSessionService', () => ({ authSessionService: {
  onAuthStateChange: jest.fn(), getSession: jest.fn(), exchangeCodeForSession: jest.fn(),
  setRecoverySession: jest.fn(), verifyRecoveryToken: jest.fn(), updatePassword: jest.fn(),
  markFirstLoginCompleted: jest.fn(), signOut: jest.fn(),
} }));

const session = { user: { id: 'u1' }, access_token: 'test-token' };

describe('ResetPassword: enlaces de recuperacion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState({}, '', '/reset-password');
    authSessionService.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } });
    authSessionService.getSession.mockResolvedValue(session);
    authSessionService.markFirstLoginCompleted.mockResolvedValue(undefined);
    authSessionService.signOut.mockResolvedValue(undefined);
  });

  it('rechaza un enlace expirado aunque el navegador conserve otra sesion', async () => {
    window.history.replaceState({}, '', '/reset-password#error=access_denied&error_code=otp_expired');
    const { container } = render(<ResetPassword />);
    await waitFor(() => expect(screen.queryByText(/Validando enlace/)).not.toBeInTheDocument());
    const listener = authSessionService.onAuthStateChange.mock.calls[0][0];
    await act(async () => { listener('INITIAL_SESSION', session); await new Promise((r) => setTimeout(r, 10)); });
    expect(container.querySelector('#new-password')).toBeNull();
    expect(screen.getByRole('button', { name: /Volver al inicio/i })).toBeInTheDocument();
  });

  it('no sustituye un codigo invalido por una sesion de otro usuario', async () => {
    window.history.replaceState({}, '', '/reset-password?code=invalid-code');
    authSessionService.exchangeCodeForSession.mockRejectedValue(new Error('Codigo vencido'));
    const { container } = render(<ResetPassword />);
    await waitFor(() => expect(screen.queryByText(/Validando enlace/)).not.toBeInTheDocument());
    expect(container.querySelector('#new-password')).toBeNull();
  });

  it('verifica token_hash de recuperacion antes de mostrar el formulario', async () => {
    window.history.replaceState({}, '', '/reset-password?token_hash=test-hash&type=recovery');
    authSessionService.getSession.mockResolvedValue(null);
    authSessionService.verifyRecoveryToken.mockResolvedValue(session);
    const { container } = render(<ResetPassword />);
    await waitFor(() => expect(container.querySelector('#new-password')).not.toBeNull());
    expect(authSessionService.verifyRecoveryToken).toHaveBeenCalledWith('test-hash');
    expect(window.location.search).toBe('');
  });

  const submit = async () => {
    const { container } = render(<ResetPassword />);
    await waitFor(() => expect(container.querySelector('#new-password')).not.toBeNull());
    fireEvent.change(container.querySelector('#new-password'), { target: { value: 'Newpassword123!' } });
    fireEvent.change(container.querySelector('#confirm-password'), { target: { value: 'Newpassword123!' } });
    await act(async () => { fireEvent.submit(container.querySelector('form')); });
  };

  it('si otra pestaña cambia de cuenta, no modifica la contraseña del nuevo usuario', async () => {
    authSessionService.getSession.mockResolvedValueOnce(session).mockResolvedValue({ user: { id: 'another-user' } });
    await submit();
    await waitFor(() => expect(screen.getByText(/sesión.*cambi/i)).toBeInTheDocument());
    expect(authSessionService.updatePassword).not.toHaveBeenCalled();
  });

  it('cierra la sesion de recuperacion aunque falle sincronizar primer ingreso', async () => {
    authSessionService.markFirstLoginCompleted.mockRejectedValue(new Error('metadata unavailable'));
    await submit();
    await waitFor(() => expect(screen.getByText(/Contraseña actualizada correctamente/)).toBeInTheDocument());
    expect(authSessionService.signOut).toHaveBeenCalledTimes(1);
  });
});
