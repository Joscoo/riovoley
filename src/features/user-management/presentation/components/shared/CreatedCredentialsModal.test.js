import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import CreatedCredentialsModal from './CreatedCredentialsModal';
import { communicationsService } from '../../../../communications';

jest.mock('../../../../communications', () => ({ communicationsService: { sendCredentials: jest.fn() } }));

it('envía una sola vez en StrictMode y conserva el resultado mientras el proveedor responde', async () => {
  let finish;
  communicationsService.sendCredentials.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  const onClose = jest.fn();
  render(<StrictMode><CreatedCredentialsModal
    result={{ credentials: { email: 'new@example.com', password: 'Temporary123!', loginUrl: 'https://example.com/login' } }}
    formData={{ nombre: 'Nuevo', apellido: 'Usuario', send_credentials_on_create: true }} onClose={onClose}
  /></StrictMode>);
  expect(communicationsService.sendCredentials).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar modal' }));
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByText('Temporary123!')).toBeInTheDocument();
  await act(async () => { finish({ success: true }); });
  expect(screen.getByRole('status')).toHaveTextContent('El servicio aceptó el correo');
  expect(screen.queryByRole('button', { name: 'Enviar por email' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar', exact: true }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
