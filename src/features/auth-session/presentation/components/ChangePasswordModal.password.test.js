import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ChangePasswordModal from './ChangePasswordModal';
import { accountAdminService } from '../../../account-admin/accountAdminService';
import { authSessionService } from '../../authSessionService';

jest.mock('../../../account-admin/accountAdminService', () => ({ accountAdminService: { changePassword: jest.fn() } }));
jest.mock('../../authSessionService', () => ({ authSessionService: {
  getSession: jest.fn(), updatePassword: jest.fn(), markFirstLoginCompleted: jest.fn(),
} }));

it('no cambia la contrasena ni cierra el modal si la actual es incorrecta', async () => {
  authSessionService.getSession.mockResolvedValue({ user: { id: 'u1' } });
  accountAdminService.changePassword.mockResolvedValue({ ok: false, message: 'La contraseña actual es incorrecta' });
  const done = jest.fn();
  const { container } = render(<ChangePasswordModal user={{ id: 'u1', email: 'ana@demo.com' }} onPasswordChanged={done} />);
  fireEvent.change(container.querySelector('#currentPassword'), { target: { value: 'wrong-password' } });
  fireEvent.change(container.querySelector('#newPassword'), { target: { value: 'Newpass123!' } });
  fireEvent.change(container.querySelector('#confirmPassword'), { target: { value: 'Newpass123!' } });
  fireEvent.submit(container.querySelector('form'));
  await waitFor(() => expect(screen.getByText('La contraseña actual es incorrecta')).toBeInTheDocument());
  expect(done).not.toHaveBeenCalled();
  expect(authSessionService.updatePassword).not.toHaveBeenCalled();
});
